<?php

declare(strict_types=1);

namespace BackendPhpTest;

// 订单创建结果。
final readonly class OrderResult
{
    public function __construct(
        public string $id,
        public string $idempotencyKey,
        public string $userId,
        public int $amountCents,
    ) {}
}
