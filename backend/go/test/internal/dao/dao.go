package dao

import (
	"context"
	"time"

	"example.com/ai-specs/order-slice/internal/model"
)

type reqIDKey struct{}

// WithRequestID 将请求追踪标识写入上下文。
func WithRequestID(ctx context.Context, reqID string) context.Context {
	return context.WithValue(ctx, reqIDKey{}, reqID)
}

// RequestIDFromContext 从上下文读取请求追踪标识。
func RequestIDFromContext(ctx context.Context) string {
	if v, ok := ctx.Value(reqIDKey{}).(string); ok {
		return v
	}
	return ""
}

// Logger 结构化日志抽象接口（避免逻辑层耦合具体日志库）。
type Logger interface {
	Info(ctx context.Context, event string, kv map[string]any)
	Warn(ctx context.Context, event string, kv map[string]any)
}

// OrderRepo 订单仓储抽象接口。
type OrderRepo interface {
	Insert(ctx context.Context, o *model.Order) error
	FindByIdempotencyKey(ctx context.Context, userID, key string, now time.Time) (*model.Order, error)
	List(ctx context.Context, filter model.OrderFilter) (model.PageResult, error)
}

// TxManager 事务管理器抽象接口。
type TxManager interface {
	Transact(ctx context.Context, fn func(ctx context.Context) error) error
}
