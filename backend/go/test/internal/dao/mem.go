package dao

import (
	"context"
	"fmt"
	"sort"
	"sync"
	"time"

	"example.com/ai-specs/order-slice/internal/model"
)

type txCtxKey struct{}

type memTx struct {
	stagedOrders map[string]model.Order
	stagedKeys   map[string]string
}

// MemOrderStore 线程安全的内存仓储与事务实现。
type MemOrderStore struct {
	mu        sync.Mutex
	seq       int64
	orders    map[string]model.Order
	byScope   map[string]string
	Rollbacks int
}

func NewMemOrderStore() *MemOrderStore {
	return &MemOrderStore{
		orders:  make(map[string]model.Order),
		byScope: make(map[string]string),
	}
}

func scopeKey(userID, key string) string {
	return userID + ":" + key
}

// Transact 执行带 defer panic 回滚守卫与嵌套事务拦截的原子事务。
func (s *MemOrderStore) Transact(ctx context.Context, fn func(ctx context.Context) error) (err error) {
	if err := ctx.Err(); err != nil {
		return err
	}
	if ctx.Value(txCtxKey{}) != nil {
		return model.ErrNestedTransaction
	}

	s.mu.Lock()
	tx := &memTx{stagedOrders: make(map[string]model.Order), stagedKeys: make(map[string]string)}
	txCtx := context.WithValue(ctx, txCtxKey{}, tx)
	committed := false
	defer func() {
		if r := recover(); r != nil {
			s.Rollbacks++
			s.mu.Unlock()
			panic(r)
		}
		if !committed {
			s.Rollbacks++
		}
		s.mu.Unlock()
	}()

	if err = fn(txCtx); err != nil {
		return err
	}
	for id, ord := range tx.stagedOrders {
		s.orders[id] = ord
	}
	for sk, id := range tx.stagedKeys {
		s.byScope[sk] = id
	}
	committed = true
	return nil
}

func (s *MemOrderStore) hasActiveKeyLocked(sk string, now time.Time) bool {
	existingID, exists := s.byScope[sk]
	if !exists {
		return false
	}
	existing := s.orders[existingID]
	return existing.IdemExpiresAt.IsZero() || existing.IdemExpiresAt.After(now)
}

func (s *MemOrderStore) Insert(ctx context.Context, o *model.Order) error {
	if err := ctx.Err(); err != nil {
		return err
	}
	sk := scopeKey(o.UserID, o.IdempotencyKey)
	if tx, ok := ctx.Value(txCtxKey{}).(*memTx); ok {
		if s.hasActiveKeyLocked(sk, o.CreatedAt) || tx.stagedKeys[sk] != "" {
			return model.ErrConflict
		}
		s.seq++
		o.Seq, o.ID = s.seq, fmt.Sprintf("ord-%d", s.seq)
		tx.stagedOrders[o.ID], tx.stagedKeys[sk] = *o, o.ID
		return nil
	}

	s.mu.Lock()
	defer s.mu.Unlock()
	if s.hasActiveKeyLocked(sk, o.CreatedAt) {
		return model.ErrConflict
	}
	s.seq++
	o.Seq, o.ID = s.seq, fmt.Sprintf("ord-%d", s.seq)
	s.orders[o.ID], s.byScope[sk] = *o, o.ID
	return nil
}

func (s *MemOrderStore) FindByIdempotencyKey(ctx context.Context, userID, key string, now time.Time) (*model.Order, error) {
	if err := ctx.Err(); err != nil {
		return nil, err
	}
	sk := scopeKey(userID, key)
	if tx, ok := ctx.Value(txCtxKey{}).(*memTx); ok {
		if id, exists := tx.stagedKeys[sk]; exists {
			ord := tx.stagedOrders[id]
			return &ord, nil
		}
		if s.hasActiveKeyLocked(sk, now) {
			ord := s.orders[s.byScope[sk]]
			return &ord, nil
		}
		return nil, model.ErrNotFound
	}

	s.mu.Lock()
	defer s.mu.Unlock()
	if !s.hasActiveKeyLocked(sk, now) {
		return nil, model.ErrNotFound
	}
	ord := s.orders[s.byScope[sk]]
	return &ord, nil
}

func resolveSortBy(raw string) (string, error) {
	if raw == "" {
		return "created_at", nil
	}
	if raw == "created_at" || raw == "total_cents" {
		return raw, nil
	}
	return "", fmt.Errorf("sortBy %q: %w", raw, model.ErrUnknownSortField)
}

func sortOrders(matched []model.Order, sortBy string, desc bool) {
	sort.Slice(matched, func(i, j int) bool {
		less := matched[i].Seq < matched[j].Seq
		if sortBy == "total_cents" && matched[i].TotalCents != matched[j].TotalCents {
			less = matched[i].TotalCents < matched[j].TotalCents
		}
		if desc {
			return !less
		}
		return less
	})
}

func paginateOrders(matched []model.Order, page, pageSize int) model.PageResult {
	total := len(matched)
	totalPages := 0
	if total > 0 {
		totalPages = (total + pageSize - 1) / pageSize
	}
	start := (page - 1) * pageSize
	if start >= total {
		return model.PageResult{Items: []model.Order{}, Total: total, Page: page, PageSize: pageSize, TotalPages: totalPages}
	}
	end := start + pageSize
	if end > total {
		end = total
	}
	items := make([]model.Order, end-start)
	copy(items, matched[start:end])
	return model.PageResult{Items: items, Total: total, Page: page, PageSize: pageSize, TotalPages: totalPages}
}

func (s *MemOrderStore) List(ctx context.Context, filter model.OrderFilter) (model.PageResult, error) {
	if err := ctx.Err(); err != nil {
		return model.PageResult{}, err
	}
	sortBy, err := resolveSortBy(filter.SortBy)
	if err != nil {
		return model.PageResult{}, err
	}

	s.mu.Lock()
	matched := make([]model.Order, 0, len(s.orders))
	for _, ord := range s.orders {
		if (filter.UserID == "" || ord.UserID == filter.UserID) && (filter.Status == "" || ord.Status == filter.Status) {
			matched = append(matched, ord)
		}
	}
	s.mu.Unlock()

	sortOrders(matched, sortBy, filter.SortOrder == "desc")
	return paginateOrders(matched, filter.Page, filter.PageSize), nil
}
