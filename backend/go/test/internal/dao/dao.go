// Package dao 定义数据层接口：只做组装与执行，不含业务分支。
package dao

import (
	"context"
	"errors"

	"spectest.local/backend-go-test/internal/model"
)

// Transactor 事务定界：闭包成功提交，失败回滚。实现经构造函数注入。
type Transactor interface {
	Transact(ctx context.Context, fn func(ctx context.Context) error) error
}

// OrderDAO 订单数据访问：方法只收上下文与业务结构，经上下文取事务。
type OrderDAO interface {
	Insert(ctx context.Context, in model.CreateOrderInput) (model.OrderResult, error)
	FindByIdempotencyKey(ctx context.Context, key string) (model.OrderResult, error)
	List(ctx context.Context, filter model.OrderFilter) ([]model.OrderResult, int, error)
}

// DuplicateKeyError 幂等键唯一冲突。
type DuplicateKeyError struct {
	Key string
}

func (e *DuplicateKeyError) Error() string {
	return "duplicate idempotency key: " + e.Key
}

// IsDuplicateKey 判定是否为幂等键唯一冲突。
func IsDuplicateKey(err error) bool {
	var dup *DuplicateKeyError
	return errors.As(err, &dup)
}
