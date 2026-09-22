package dao

import (
	"context"
	"errors"
	"fmt"
	"sort"
	"sync"

	"spectest.local/backend-go-test/internal/model"
)

// txKey 为事务在上下文中的键，不导出。
type txKey struct{}

// memTx 单事务暂存区：失败即丢弃，成功即原子落子。
type memTx struct {
	staged     []model.OrderResult
	stagedKeys map[string]struct{}
}

func withTx(ctx context.Context, tx *memTx) context.Context {
	return context.WithValue(ctx, txKey{}, tx)
}

func getTx(ctx context.Context) *memTx {
	tx, _ := ctx.Value(txKey{}).(*memTx)
	return tx
}

// MemStore 内存实现：事务体经独立串行锁执行，仅用于演示与测试，非生产实现。
// 真实隔离级别、连接池与持久化语义以各项目数据库实测为准。
type MemStore struct {
	txMu        sync.Mutex
	mu          sync.Mutex
	rows        map[string]model.OrderResult
	byKey       map[string]string
	insertCalls int
	rollbacks   int
	failInsert  error
	seq         int
}

// NewMemStore 创建空内存存储。
func NewMemStore() *MemStore {
	return &MemStore{
		rows:  make(map[string]model.OrderResult),
		byKey: make(map[string]string),
	}
}

// FailInsertWith 使下一次 Insert 注错，用于回滚测试。
func (s *MemStore) FailInsertWith(err error) {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.failInsert = err
}

// Transact 串行执行闭包：失败丢弃本事务暂存并计数回滚，成功原子落子。
// 闭包体内的数据操作按次持有数据锁，本方法不跨闭包持锁，故无死锁。
// 不支持嵌套事务，嵌套调用直接返回错误。
func (s *MemStore) Transact(ctx context.Context, fn func(ctx context.Context) error) error {
	s.txMu.Lock()
	defer s.txMu.Unlock()
	if err := ctx.Err(); err != nil {
		return err
	}
	if getTx(ctx) != nil {
		return errors.New("nested transaction not supported")
	}
	tx := &memTx{stagedKeys: make(map[string]struct{})}
	if err := fn(withTx(ctx, tx)); err != nil {
		s.mu.Lock()
		s.rollbacks++
		s.mu.Unlock()
		return err
	}
	s.mu.Lock()
	defer s.mu.Unlock()
	for k := range tx.stagedKeys {
		if _, ok := s.byKey[k]; ok {
			s.rollbacks++
			return &DuplicateKeyError{Key: k}
		}
	}
	for _, row := range tx.staged {
		s.rows[row.ID] = row
		s.byKey[row.IdempotencyKey] = row.ID
	}
	return nil
}

// Insert 写入订单，幂等键全局唯一；空键直接拒绝，不落存储；冲突返回 DuplicateKeyError。
func (s *MemStore) Insert(ctx context.Context, in model.CreateOrderInput) (model.OrderResult, error) {
	if in.IdempotencyKey == "" {
		return model.OrderResult{}, model.ErrValidation
	}
	s.mu.Lock()
	defer s.mu.Unlock()
	s.insertCalls++
	if s.failInsert != nil {
		err := s.failInsert
		s.failInsert = nil
		return model.OrderResult{}, err
	}
	if _, ok := s.byKey[in.IdempotencyKey]; ok {
		return model.OrderResult{}, &DuplicateKeyError{Key: in.IdempotencyKey}
	}
	if tx := getTx(ctx); tx != nil {
		if _, ok := tx.stagedKeys[in.IdempotencyKey]; ok {
			return model.OrderResult{}, &DuplicateKeyError{Key: in.IdempotencyKey}
		}
	}
	s.seq++
	row := model.OrderResult{
		ID:             fmt.Sprintf("ord-%d", s.seq),
		IdempotencyKey: in.IdempotencyKey,
		UserID:         in.UserID,
		AmountCents:    in.AmountCents,
		CouponCode:     in.CouponCode,
	}
	if tx := getTx(ctx); tx != nil {
		tx.staged = append(tx.staged, row)
		tx.stagedKeys[in.IdempotencyKey] = struct{}{}
		return row, nil
	}
	s.rows[row.ID] = row
	s.byKey[row.IdempotencyKey] = row.ID
	return row, nil
}

// FindByIdempotencyKey 按键回读，先查本事务暂存，再查已提交。
func (s *MemStore) FindByIdempotencyKey(ctx context.Context, key string) (model.OrderResult, error) {
	s.mu.Lock()
	defer s.mu.Unlock()
	if tx := getTx(ctx); tx != nil {
		for _, row := range tx.staged {
			if row.IdempotencyKey == key {
				return row, nil
			}
		}
	}
	id, ok := s.byKey[key]
	if !ok {
		return model.OrderResult{}, model.ErrNotFound
	}
	return s.rows[id], nil
}

// List 过滤加分页：页码从 1 起计，页大小服务端截断上限，空页返空数组。
func (s *MemStore) List(ctx context.Context, filter model.OrderFilter) ([]model.OrderResult, int, error) {
	s.mu.Lock()
	defer s.mu.Unlock()
	if err := ctx.Err(); err != nil {
		return nil, 0, err
	}
	var all []model.OrderResult
	for _, row := range s.rows {
		if filter.UserID != "" && row.UserID != filter.UserID {
			continue
		}
		all = append(all, row)
	}
	sort.Slice(all, func(i, j int) bool { return all[i].ID < all[j].ID })
	total := len(all)
	page, pageSize := filter.Page, filter.PageSize
	if page < 1 {
		page = 1
	}
	if pageSize < 1 || pageSize > 100 {
		pageSize = 20
	}
	start := (page - 1) * pageSize
	if start >= total {
		return []model.OrderResult{}, total, nil
	}
	end := start + pageSize
	if end > total {
		end = total
	}
	return all[start:end], total, nil
}

// RowCount 已提交行数，测试断言用。
func (s *MemStore) RowCount() int {
	s.mu.Lock()
	defer s.mu.Unlock()
	return len(s.rows)
}

// InsertCalls Insert 调用次数，测试断言用。
func (s *MemStore) InsertCalls() int {
	s.mu.Lock()
	defer s.mu.Unlock()
	return s.insertCalls
}

// RollbackCalled 是否发生过回滚，测试断言用。
func (s *MemStore) RollbackCalled() bool {
	s.mu.Lock()
	defer s.mu.Unlock()
	return s.rollbacks > 0
}

// FindStoredKey 直查已提交键，测试断言用。
func (s *MemStore) FindStoredKey(key string) (model.OrderResult, bool) {
	s.mu.Lock()
	defer s.mu.Unlock()
	id, ok := s.byKey[key]
	if !ok {
		return model.OrderResult{}, false
	}
	return s.rows[id], true
}
