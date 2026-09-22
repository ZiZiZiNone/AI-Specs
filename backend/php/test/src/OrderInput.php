<?php

declare(strict_types=1);

namespace BackendPhpTest;

// 创建订单输入：纯业务结构，不含传输对象。
final readonly class OrderInput
{
    public function __construct(
        public string $idempotencyKey,
        public string $userId,
        public int $amountCents,
        public string $couponCode = '',
    ) {}

    // 需防重放的创建必须带幂等键：空键直接拒绝，不旁路去重。
    public function validate(): void
    {
        if ($this->idempotencyKey === '' || $this->userId === '' || $this->amountCents <= 0) {
            throw new ValidationException('invalid order input');
        }
    }
}
