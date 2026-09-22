// Package controller 为入口层：只做绑定、调用、响应，无业务分支。
package controller

import (
	"context"

	"spectest.local/backend-go-test/api"
	"spectest.local/backend-go-test/internal/model"
	"spectest.local/backend-go-test/internal/service"
)

// OrderController 订单入口。
type OrderController struct {
	svc service.OrderService
}

// NewOrderController 构造入口。
func NewOrderController(svc service.OrderService) *OrderController {
	return &OrderController{svc: svc}
}

// Create 绑定输入、调业务、写响应三步。
func (c *OrderController) Create(ctx context.Context, req api.CreateOrderRequest) (api.OrderResponse, error) {
	result, err := c.svc.Create(ctx, req.ToInput())
	if err != nil {
		return api.OrderResponse{}, err
	}
	return api.ToResponse(result), nil
}

// List 绑定过滤、调业务、写分页三步。
func (c *OrderController) List(ctx context.Context, filter model.OrderFilter) ([]api.OrderResponse, int, error) {
	items, total, err := c.svc.List(ctx, filter)
	if err != nil {
		return nil, 0, err
	}
	out := make([]api.OrderResponse, 0, len(items))
	for _, it := range items {
		out = append(out, api.ToResponse(it))
	}
	return out, total, nil
}
