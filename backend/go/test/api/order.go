package api

import "time"

// CreateOrderRequest 创建订单接口请求 DTO。
type CreateOrderRequest struct {
	UserID         string `json:"userId"`
	ItemID         string `json:"itemId"`
	Quantity       int    `json:"quantity"`
	UnitPriceCents int64  `json:"unitPriceCents"`
	CouponCode     string `json:"couponCode,omitempty"`
	IdempotencyKey string `json:"idempotencyKey"`
}

// OrderResponse 单个订单响应 DTO。
type OrderResponse struct {
	ID         string    `json:"id"`
	UserID     string    `json:"userId"`
	ItemID     string    `json:"itemId"`
	Quantity   int       `json:"quantity"`
	TotalCents int64     `json:"totalCents"`
	CouponCode string    `json:"couponCode,omitempty"`
	Status     string    `json:"status"`
	CreatedAt  time.Time `json:"createdAt"`
}

// ListOrdersRequest 列表查询请求 DTO。
type ListOrdersRequest struct {
	UserID    string `json:"userId"`
	Status    string `json:"status,omitempty"`
	Page      int    `json:"page"`
	PageSize  int    `json:"pageSize"`
	SortBy    string `json:"sortBy,omitempty"`
	SortOrder string `json:"sortOrder,omitempty"`
}

// PageMeta 分页元信息（对齐 common/rules/api-contract.md）。
type PageMeta struct {
	Page       int `json:"page"`
	PageSize   int `json:"pageSize"`
	Total      int `json:"total"`
	TotalPages int `json:"totalPages"`
}

// ListOrdersResponse 列表查询响应 DTO（对齐 common/rules/api-contract.md）。
type ListOrdersResponse struct {
	Items []OrderResponse `json:"items"`
	Page  PageMeta        `json:"page"`
}
