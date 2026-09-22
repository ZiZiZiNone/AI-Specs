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
