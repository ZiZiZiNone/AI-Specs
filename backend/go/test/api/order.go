// Package api 为入口 DTO：只做输入输出形态，不含业务规则。
package api

import (
	"spectest.local/backend-go-test/internal/model"
)

// CreateOrderRequest 创建订单请求。
type CreateOrderRequest struct {
	IdempotencyKey string
	UserID         string
	AmountCents    int64
	CouponCode     string
}

// ToInput 转为业务输入。
func (r CreateOrderRequest) ToInput() model.CreateOrderInput {
	return model.CreateOrderInput{
		IdempotencyKey: r.IdempotencyKey,
		UserID:         r.UserID,
		AmountCents:    r.AmountCents,
		CouponCode:     r.CouponCode,
	}
}

// OrderResponse 订单响应。
type OrderResponse struct {
	ID          string
	UserID      string
	AmountCents int64
	CouponCode  string
}

// ToResponse 转为响应形态。
func ToResponse(res model.OrderResult) OrderResponse {
	return OrderResponse{
		ID:          res.ID,
		UserID:      res.UserID,
		AmountCents: res.AmountCents,
		CouponCode:  res.CouponCode,
	}
}
