<?php
declare(strict_types=1);

namespace App;

final readonly class OrderInput
{
    public function __construct(
        public string $userId,
        public string $itemId,
        public int $quantity,
        public int $unitPriceCents,
        public string $idempotencyKey,
        public string $couponCode = '',
    ) {}

    public function payloadHash(): string
    {
        return hash('sha256', sprintf(
            'u=%s|i=%s|q=%d|p=%d|c=%s',
            $this->userId,
            $this->itemId,
            $this->quantity,
            $this->unitPriceCents,
            $this->couponCode,
        ));
    }
}
