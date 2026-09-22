// Package service 定义业务层接口，由 logic 实现。
package service

import (
	"context"

	"spectest.local/backend-go-test/internal/model"
)

// OrderService 订单用例接口。
type OrderService interface {
	Create(ctx context.Context, in model.CreateOrderInput) (model.OrderResult, error)
}
