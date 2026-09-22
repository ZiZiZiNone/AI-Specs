// Package logic 承载订单业务规则：去重、事务边界、失败语义。
package logic

import (
	"context"

	"spectest.local/backend-go-test/internal/dao"
	"spectest.local/backend-go-test/internal/model"
	"spectest.local/backend-go-test/internal/service"
)

// OrderLogic 订单业务实现，依赖经构造函数注入接口。
type OrderLogic struct {
	db     dao.Transactor
	orders dao.OrderDAO
}

// NewOrderLogic 构造业务实现。
func NewOrderLogic(db dao.Transactor, orders dao.OrderDAO) *OrderLogic {
	return &OrderLogic{db: db, orders: orders}
}

// 编译期保证接口满足。
var _ service.OrderService = (*OrderLogic)(nil)

// Create 创建订单。去重记录与业务行同事务落子；唯一冲突后，
// 在失败事务之外的新读路径回读首次结果，不在已冲突事务内继续查询。
func (s *OrderLogic) Create(ctx context.Context, in model.CreateOrderInput) (model.OrderResult, error) {
	if err := in.Validate(); err != nil {
		return model.OrderResult{}, err
	}
	var result model.OrderResult
	err := s.db.Transact(ctx, func(ctx context.Context) error {
		res, err := s.orders.Insert(ctx, in)
		if err != nil {
			return err
		}
		result = res
		return nil
	})
	if dao.IsDuplicateKey(err) {
		first, ferr := s.orders.FindByIdempotencyKey(ctx, in.IdempotencyKey)
		if ferr != nil {
			return model.OrderResult{}, ferr
		}
		return first, nil
	}
	if err != nil {
		return model.OrderResult{}, err
	}
	return result, nil
}
