package logic

import (
	"context"
	"errors"
	"fmt"
	"strings"
	"time"

	"example.com/ai-specs/order-slice/api"
	"example.com/ai-specs/order-slice/internal/dao"
	"example.com/ai-specs/order-slice/internal/model"
)

const DefaultIdempotencyTTL = 24 * time.Hour

type nopLogger struct{}

func (nopLogger) Info(context.Context, string, map[string]any) {}
func (nopLogger) Warn(context.Context, string, map[string]any) {}

type OrderLogic struct {
	repo   dao.OrderRepo
	tx     dao.TxManager
	logger dao.Logger
	nowFn  func() time.Time
	ttl    time.Duration
}

func NewOrderLogic(repo dao.OrderRepo, tx dao.TxManager, logger dao.Logger, nowFn func() time.Time) *OrderLogic {
	if logger == nil {
		logger = nopLogger{}
	}
	if nowFn == nil {
		nowFn = time.Now
	}
	return &OrderLogic{repo: repo, tx: tx, logger: logger, nowFn: nowFn, ttl: DefaultIdempotencyTTL}
}

func validateCreateReq(req api.CreateOrderRequest) error {
	if strings.TrimSpace(req.UserID) == "" || strings.TrimSpace(req.ItemID) == "" ||
		strings.TrimSpace(req.IdempotencyKey) == "" || req.Quantity <= 0 || req.UnitPriceCents <= 0 {
		return fmt.Errorf("create order validation: %w", model.ErrInvalidInput)
	}
	return nil
}

func (l *OrderLogic) createWithinTx(txCtx context.Context, req api.CreateOrderRequest, now time.Time) (model.Order, error) {
	payloadHash := model.ComputePayloadHash(model.PayloadInput{
		UserID: req.UserID, ItemID: req.ItemID, Quantity: req.Quantity,
		UnitPriceCents: req.UnitPriceCents, CouponCode: req.CouponCode,
	})
	existing, findErr := l.repo.FindByIdempotencyKey(txCtx, req.UserID, req.IdempotencyKey, now)
	if findErr == nil {
		if existing.PayloadHash != payloadHash {
			l.logger.Warn(txCtx, "order.create.idempotency_mismatch", map[string]any{
				"requestId": dao.RequestIDFromContext(txCtx), "userId": req.UserID,
			})
			return model.Order{}, fmt.Errorf("idempotency key payload mismatch: %w", model.ErrConflict)
		}
		return *existing, nil
	}
	if !errors.Is(findErr, model.ErrNotFound) {
		return model.Order{}, fmt.Errorf("lookup idempotency key: %w", findErr)
	}

	ord := &model.Order{
		UserID: req.UserID, ItemID: req.ItemID, Quantity: req.Quantity,
		UnitPriceCents: req.UnitPriceCents, TotalCents: int64(req.Quantity) * req.UnitPriceCents,
		CouponCode: req.CouponCode, Status: "created", IdempotencyKey: req.IdempotencyKey,
		PayloadHash: payloadHash, IdemExpiresAt: now.Add(l.ttl), CreatedAt: now,
	}
	if insErr := l.repo.Insert(txCtx, ord); insErr != nil {
		return model.Order{}, fmt.Errorf("insert order: %w", insErr)
	}
	return *ord, nil
}

func (l *OrderLogic) Create(ctx context.Context, req api.CreateOrderRequest) (api.OrderResponse, error) {
	if err := validateCreateReq(req); err != nil {
		return api.OrderResponse{}, err
	}
	now := l.nowFn().UTC()
	var result model.Order
	err := l.tx.Transact(ctx, func(txCtx context.Context) error {
		ord, txErr := l.createWithinTx(txCtx, req, now)
		if txErr != nil {
			return txErr
		}
		result = ord
		return nil
	})
	if err != nil {
		return api.OrderResponse{}, err
	}
	l.logger.Info(ctx, "order.create.ok", map[string]any{
		"requestId": dao.RequestIDFromContext(ctx), "orderId": result.ID,
	})
	return toOrderResponse(result), nil
}

func (l *OrderLogic) List(ctx context.Context, req api.ListOrdersRequest) (api.ListOrdersResponse, error) {
	page := req.Page
	if page < 1 {
		page = 1
	}
	pageSize := req.PageSize
	if pageSize <= 0 {
		pageSize = model.DefaultPageSize
	} else if pageSize > model.MaxPageSize {
		pageSize = model.MaxPageSize
	}

	res, err := l.repo.List(ctx, model.OrderFilter{
		UserID: req.UserID, Status: req.Status, Page: page, PageSize: pageSize,
		SortBy: req.SortBy, SortOrder: req.SortOrder,
	})
	if err != nil {
		return api.ListOrdersResponse{}, fmt.Errorf("list orders: %w", err)
	}
	items := make([]api.OrderResponse, 0, len(res.Items))
	for _, ord := range res.Items {
		items = append(items, toOrderResponse(ord))
	}
	return api.ListOrdersResponse{
		Items: items,
		Page:  api.PageMeta{Page: res.Page, PageSize: res.PageSize, Total: res.Total, TotalPages: res.TotalPages},
	}, nil
}

func toOrderResponse(o model.Order) api.OrderResponse {
	return api.OrderResponse{
		ID: o.ID, UserID: o.UserID, ItemID: o.ItemID, Quantity: o.Quantity,
		TotalCents: o.TotalCents, CouponCode: o.CouponCode, Status: o.Status, CreatedAt: o.CreatedAt,
	}
}
