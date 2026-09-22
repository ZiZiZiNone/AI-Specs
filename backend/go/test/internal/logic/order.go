// Package logic 承载订单业务规则：去重、作用域与载荷一致性、事务边界、失败语义。
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
// 在失败事务之外的新读路径回读首次结果，不在已冲突事务内继续查询；
// 回读时比对用户与关键载荷，同键异载荷返回冲突，不跨作用域复用结果。
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
		if first.UserID != in.UserID || first.AmountCents != in.AmountCents || first.CouponCode != in.CouponCode {
			return model.OrderResult{}, model.ErrConflict
		}
		return first, nil
	}
	if err != nil {
		return model.OrderResult{}, err
	}
	return result, nil
}

// List 列表透传：分页整形在业务层，查询收敛数据层。
func (s *OrderLogic) List(ctx context.Context, filter model.OrderFilter) ([]model.OrderResult, int, error) {
	if filter.Page < 1 {
		filter.Page = 1
	}
	if filter.PageSize < 1 || filter.PageSize > 100 {
		filter.PageSize = 20
	}
	return s.orders.List(ctx, filter)
}
