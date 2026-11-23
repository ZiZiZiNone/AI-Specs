package model

import (
	"crypto/sha256"
	"encoding/hex"
	"errors"
	"fmt"
	"time"
)

var (
	ErrInvalidInput      = errors.New("invalid input")
	ErrConflict          = errors.New("idempotency conflict")
	ErrNotFound          = errors.New("order not found")
	ErrUnknownSortField  = errors.New("unknown sort field")
	ErrNestedTransaction = errors.New("nested transaction not supported")
)

const (
	DefaultPageSize = 20
	MaxPageSize     = 100
)

type Order struct {
	Seq            int64
	ID             string
	UserID         string
	ItemID         string
	Quantity       int
	UnitPriceCents int64
	TotalCents     int64
	CouponCode     string
	Status         string
	IdempotencyKey string
	PayloadHash    string
	IdemExpiresAt  time.Time
	CreatedAt      time.Time
}

type OrderFilter struct {
	UserID    string
	Status    string
	Page      int
	PageSize  int
	SortBy    string
	SortOrder string
}

type PageResult struct {
	Items      []Order
	Total      int
	Page       int
	PageSize   int
	TotalPages int
}

type PayloadInput struct {
	UserID         string
	ItemID         string
	Quantity       int
	UnitPriceCents int64
	CouponCode     string
}

// ComputePayloadHash 对全部关键业务载荷生成确定性哈希，避免新增字段漏检。
func ComputePayloadHash(in PayloadInput) string {
	raw := fmt.Sprintf("u=%s|i=%s|q=%d|p=%d|c=%s", in.UserID, in.ItemID, in.Quantity, in.UnitPriceCents, in.CouponCode)
	sum := sha256.Sum256([]byte(raw))
	return hex.EncodeToString(sum[:])
}
