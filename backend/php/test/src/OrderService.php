<?php

declare(strict_types=1);

namespace BackendPhpTest;

// 订单服务：承载全部业务规则。依赖经构造函数注入。
class OrderService
{
    public function __construct(
        private TransactionManager $db,
        private OrderRepositoryInterface $orders,
    ) {}

    // 去重记录与业务行同事务落子；唯一冲突后，在失败事务之外的新读路径
    // 回读首次结果，不在已冲突事务内继续查询；回读比对用户与关键载荷，
    // 同键异载荷抛冲突，不跨作用域复用结果。
    public function create(OrderInput $in): OrderResult
    {
        $in->validate();
        $result = null;
        try {
            $this->db->transaction(function () use ($in, &$result): void {
                $result = $this->orders->insert($in);
            });
        } catch (DuplicateKeyException) {
            $first = $this->orders->findByIdempotencyKey($in->idempotencyKey);
            if ($first->userId !== $in->userId
                || $first->amountCents !== $in->amountCents
                || $first->couponCode !== $in->couponCode) {
                throw new ConflictException($in->idempotencyKey);
            }
            return $first;
        }
        if (!$result instanceof OrderResult) {
            throw new \LogicException('unreachable: committed without result');
        }
        return $result;
    }
}
