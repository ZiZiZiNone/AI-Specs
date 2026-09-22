<?php

declare(strict_types=1);

namespace BackendPhpTest;

// 订单仓储接口：只做组装与执行，不含业务分支。
interface OrderRepositoryInterface
{
    public function insert(OrderInput $in): OrderResult;

    public function findByIdempotencyKey(string $key): OrderResult;

    /** @return array{0: OrderResult[], 1: int} items 与总数 */
    public function list(?string $userId, int $page, int $pageSize): array;
}
