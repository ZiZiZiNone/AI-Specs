package logic_test

import (
	"context"
	"errors"
	"testing"
	"time"

	"example.com/ai-specs/order-slice/api"
	"example.com/ai-specs/order-slice/internal/controller"
	"example.com/ai-specs/order-slice/internal/dao"
	"example.com/ai-specs/order-slice/internal/logic"
	"example.com/ai-specs/order-slice/internal/model"
)

func TestOrderCreate_IdempotencyScopedPerUser(t *testing.T) {
	store := dao.NewMemOrderStore()
	now := time.Date(2026, 11, 23, 8, 0, 0, 0, time.UTC)
	svc := logic.NewOrderLogic(store, store, nil, func() time.Time { return now })
	ctrl := controller.NewOrderController(svc)
	ctx := dao.WithRequestID(context.Background(), "req-001")

	r1, err := ctrl.Create(ctx, api.CreateOrderRequest{
		UserID: "u1", ItemID: "sku-1", Quantity: 2, UnitPriceCents: 500, IdempotencyKey: "same-key",
	})
	if err != nil {
		t.Fatalf("u1 create failed: %v", err)
	}
	// 不同用户使用同一幂等键，必须隔离成功（防跨用户 DoS/探测）
	r2, err := ctrl.Create(ctx, api.CreateOrderRequest{
		UserID: "u2", ItemID: "sku-1", Quantity: 1, UnitPriceCents: 500, IdempotencyKey: "same-key",
	})
	if err != nil {
		t.Fatalf("u2 create with same key should succeed: %v", err)
	}
	if r1.ID == r2.ID {
		t.Fatalf("expected distinct order IDs for different users, got %s", r1.ID)
	}
	// 同用户同键同载荷重放返回相同结果
	r1Replay, err := ctrl.Create(ctx, api.CreateOrderRequest{
		UserID: "u1", ItemID: "sku-1", Quantity: 2, UnitPriceCents: 500, IdempotencyKey: "same-key",
	})
	if err != nil || r1Replay.ID != r1.ID {
		t.Fatalf("expected idempotent replay %s, got %s err=%v", r1.ID, r1Replay.ID, err)
	}
	// 同用户同键异载荷（含优惠券差异）必须返回 ErrConflict
	_, err = ctrl.Create(ctx, api.CreateOrderRequest{
		UserID: "u1", ItemID: "sku-1", Quantity: 2, UnitPriceCents: 500, CouponCode: "VIP10", IdempotencyKey: "same-key",
	})
	if !errors.Is(err, model.ErrConflict) {
		t.Fatalf("expected ErrConflict for payload mismatch, got %v", err)
	}
}

func TestOrderCreate_IdempotencyExpiresAfterTTL(t *testing.T) {
	store := dao.NewMemOrderStore()
	current := time.Date(2026, 11, 23, 8, 0, 0, 0, time.UTC)
	svc := logic.NewOrderLogic(store, store, nil, func() time.Time { return current })

	r1, err := svc.Create(context.Background(), api.CreateOrderRequest{
		UserID: "u1", ItemID: "sku-1", Quantity: 1, UnitPriceCents: 100, IdempotencyKey: "ttl-key",
	})
	if err != nil {
		t.Fatalf("first create failed: %v", err)
	}
	current = current.Add(logic.DefaultIdempotencyTTL + time.Minute)
	r2, err := svc.Create(context.Background(), api.CreateOrderRequest{
		UserID: "u1", ItemID: "sku-1", Quantity: 1, UnitPriceCents: 100, IdempotencyKey: "ttl-key",
	})
	if err != nil || r2.ID == r1.ID {
		t.Fatalf("expected new order after TTL expiry, got r1=%s r2=%s err=%v", r1.ID, r2.ID, err)
	}
}

func TestOrderList_ClampsPageSizeToMaxAndRejectsUnknownSort(t *testing.T) {
	store := dao.NewMemOrderStore()
	svc := logic.NewOrderLogic(store, store, nil, nil)
	for i := 0; i < 12; i++ {
		_, err := svc.Create(context.Background(), api.CreateOrderRequest{
			UserID: "u1", ItemID: "sku-1", Quantity: 1, UnitPriceCents: int64(100 * (i + 1)), IdempotencyKey: time.Duration(i).String(),
		})
		if err != nil {
			t.Fatalf("seed failed: %v", err)
		}
	}
	res, err := svc.List(context.Background(), api.ListOrdersRequest{UserID: "u1", Page: 1, PageSize: 500})
	if err != nil {
		t.Fatalf("list failed: %v", err)
	}
	if res.Page.PageSize != model.MaxPageSize {
		t.Fatalf("expected pageSize clamped to %d, got %d", model.MaxPageSize, res.Page.PageSize)
	}
	if res.Items[0].ID != "ord-1" || res.Items[9].ID != "ord-10" {
		t.Fatalf("expected numeric sequence order, got first=%s tenth=%s", res.Items[0].ID, res.Items[9].ID)
	}
	_, err = svc.List(context.Background(), api.ListOrdersRequest{UserID: "u1", SortBy: "drop_table"})
	if !errors.Is(err, model.ErrUnknownSortField) {
		t.Fatalf("expected ErrUnknownSortField, got %v", err)
	}
}

func TestTransact_PanicTriggersRollback(t *testing.T) {
	store := dao.NewMemOrderStore()
	defer func() {
		if r := recover(); r == nil {
			t.Fatalf("expected panic to propagate")
		}
		if store.Rollbacks != 1 {
			t.Fatalf("expected rollback count 1 after panic, got %d", store.Rollbacks)
		}
	}()
	_ = store.Transact(context.Background(), func(ctx context.Context) error {
		panic("boom")
	})
}
