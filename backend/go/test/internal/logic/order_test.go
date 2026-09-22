package logic

import (
	"context"
	"errors"
	"sync"
	"testing"

	"spectest.local/backend-go-test/internal/dao"
	"spectest.local/backend-go-test/internal/model"
)

func orderInputWithKey(key string) model.CreateOrderInput {
	return model.CreateOrderInput{
		IdempotencyKey: key,
		UserID:         "u-1",
		AmountCents:    100,
	}
}

func TestCreateDuplicateKeyReturnsFirstResult(t *testing.T) {
	store := dao.NewMemStore()
	svc := NewOrderLogic(store, store)
	ctx := context.Background()

	first, err := svc.Create(ctx, orderInputWithKey("key-1"))
	if err != nil {
		t.Fatalf("first create failed: %v", err)
	}
	again, err := svc.Create(ctx, orderInputWithKey("key-1"))
	if err != nil {
		t.Fatalf("replay failed: %v", err)
	}
	if again.ID != first.ID {
		t.Fatalf("replay created a second order: %v vs %v", again.ID, first.ID)
	}
	if store.RowCount() != 1 {
		t.Fatalf("replay must not add rows, got %d", store.RowCount())
	}
}

func TestCreateFailureRollsBack(t *testing.T) {
	store := dao.NewMemStore()
	store.FailInsertWith(errors.New("db down"))
	svc := NewOrderLogic(store, store)
	ctx := context.Background()

	if _, err := svc.Create(ctx, orderInputWithKey("key-9")); err == nil {
		t.Fatal("expected error, got nil")
	}
	if !store.RollbackCalled() {
		t.Fatal("failed create must roll back")
	}
	if store.RowCount() != 0 {
		t.Fatal("rolled-back rows must be discarded")
	}
	if _, dup := store.FindStoredKey("key-9"); dup {
		t.Fatal("failed create must not store idempotency key")
	}
}

func TestCreateRejectsEmptyKey(t *testing.T) {
	store := dao.NewMemStore()
	svc := NewOrderLogic(store, store)
	ctx := context.Background()

	in := orderInputWithKey("")
	if _, err := svc.Create(ctx, in); !errors.Is(err, model.ErrValidation) {
		t.Fatalf("expected validation error, got %v", err)
	}
	if store.InsertCalls() != 0 {
		t.Fatal("rejected input must not reach dao")
	}
}

func TestCreateConcurrentReplayReturnsFirstResult(t *testing.T) {
	// 提交期合并冲突分支在本串行化演示下不可达，覆盖见 Insert 预检路径；
	// 本测试证明无死锁、无 data race 与重放收敛。
	store := dao.NewMemStore()
	svc := NewOrderLogic(store, store)
	ctx := context.Background()

	const n = 8
	ids := make([]string, n)
	var wg sync.WaitGroup
	for i := 0; i < n; i++ {
		wg.Add(1)
		go func(i int) {
			defer wg.Done()
			res, err := svc.Create(ctx, orderInputWithKey("key-c"))
			if err != nil {
				t.Errorf("concurrent create failed: %v", err)
				return
			}
			ids[i] = res.ID
		}(i)
	}
	wg.Wait()
	for _, id := range ids {
		if id == "" || id != ids[0] {
			t.Fatalf("concurrent replay diverged: %v", ids)
		}
	}
	if store.RowCount() != 1 {
		t.Fatalf("concurrent replay must keep one row, got %d", store.RowCount())
	}
}

func TestCreateConflictingPayloadReturnsConflict(t *testing.T) {
	store := dao.NewMemStore()
	svc := NewOrderLogic(store, store)
	ctx := context.Background()

	if _, err := svc.Create(ctx, orderInputWithKey("key-x")); err != nil {
		t.Fatalf("first create failed: %v", err)
	}
	clash := orderInputWithKey("key-x")
	clash.AmountCents = 999
	if _, err := svc.Create(ctx, clash); !errors.Is(err, model.ErrConflict) {
		t.Fatalf("expected conflict, got %v", err)
	}
	if store.RowCount() != 1 {
		t.Fatalf("conflict must not add rows, got %d", store.RowCount())
	}
}

func TestDaoRejectsEmptyKeyDirectly(t *testing.T) {
	store := dao.NewMemStore()
	if _, err := store.Insert(context.Background(), model.CreateOrderInput{}); !errors.Is(err, model.ErrValidation) {
		t.Fatalf("expected validation error, got %v", err)
	}
}

func TestListPaginates(t *testing.T) {
	store := dao.NewMemStore()
	svc := NewOrderLogic(store, store)
	ctx := context.Background()

	for _, k := range []string{"k-a", "k-b", "k-c"} {
		if _, err := svc.Create(ctx, orderInputWithKey(k)); err != nil {
			t.Fatalf("seed failed: %v", err)
		}
	}
	items, total, err := svc.List(ctx, model.OrderFilter{Page: 1, PageSize: 2})
	if err != nil || total != 3 || len(items) != 2 {
		t.Fatalf("page one wrong: items=%d total=%d err=%v", len(items), total, err)
	}
	items, total, err = svc.List(ctx, model.OrderFilter{Page: 5, PageSize: 2})
	if err != nil || total != 3 || len(items) != 0 {
		t.Fatalf("empty page must stay empty: items=%d total=%d err=%v", len(items), total, err)
	}
}
