// Package model 定义订单用例的纯数据结构，不依赖任何宿主与框架。
package model

import "errors"

// ErrValidation 参数校验失败。
var ErrValidation = errors.New("invalid order input")

// ErrNotFound 按键查询无结果。
var ErrNotFound = errors.New("order not found")

// ErrConflict 同键载荷不一致：用户、金额等关键载荷与首次结果不符。
var ErrConflict = errors.New("idempotency payload conflict")

// CreateOrderInput 创建订单输入，字段均为业务含义，不含传输对象。
type CreateOrderInput struct {
	IdempotencyKey string
	UserID         string
	AmountCents    int64
	CouponCode     string
}

// Validate 校验输入。需防重放的创建必须带幂等键：空键直接拒绝，
// 不旁路去重，否则无键请求会互相碰撞。
func (in CreateOrderInput) Validate() error {
	if in.IdempotencyKey == "" {
		return ErrValidation
	}
	if in.UserID == "" || in.AmountCents <= 0 {
		return ErrValidation
	}
	return nil
}

// OrderResult 订单创建结果，含全部比对载荷。
type OrderResult struct {
	ID             string
	IdempotencyKey string
	UserID         string
	AmountCents    int64
	CouponCode     string
}

// OrderFilter 列表过滤结构，分页从 1 起计。
type OrderFilter struct {
	UserID   string
	Page     int
	PageSize int
}
