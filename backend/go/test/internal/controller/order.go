package controller

import (
	"context"

	"example.com/ai-specs/order-slice/api"
	"example.com/ai-specs/order-slice/internal/service"
)

// OrderController 薄入口控制器：仅转发 DTO 至服务层，不承载业务规则与事务。
type OrderController struct {
	svc service.OrderService
}

func NewOrderController(svc service.OrderService) *OrderController {
	return &OrderController{svc: svc}
}

func (c *OrderController) Create(ctx context.Context, req api.CreateOrderRequest) (api.OrderResponse, error) {
	return c.svc.Create(ctx, req)
}

func (c *OrderController) List(ctx context.Context, req api.ListOrdersRequest) (api.ListOrdersResponse, error) {
	return c.svc.List(ctx, req)
}
