<?php
declare(strict_types=1);

namespace App;

final readonly class OrderResult
{
    public function __construct(
        public int $seq,
        public string $id,
        public string $userId,
        public string $itemId,
        public int $quantity,
        public int $totalCents,
        public string $couponCode,
        public string $status,
        public string $payloadHash,
        public int $idemExpiresAt,
    ) {}
}
