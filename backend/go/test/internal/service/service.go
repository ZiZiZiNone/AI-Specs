package service

import (
	"context"

	"example.com/ai-specs/order-slice/api"
)

// OrderService 订单服务对外抽象契约。
type OrderService interface {
	Create(ctx context.Context, req api.CreateOrderRequest) (api.OrderResponse, error)
	List(ctx context.Context, req api.ListOrdersRequest) (api.ListOrdersResponse, error)
}
