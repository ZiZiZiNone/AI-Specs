<?php
declare(strict_types=1);

namespace App;

interface OrderRepositoryInterface
{
    public function insert(OrderInput $input, int $totalCents, int $nowTs, int $ttlSeconds): OrderResult;

    public function findByIdempotencyKey(string $userId, string $key, int $nowTs): ?OrderResult;

    /**
     * @return array{items: list<OrderResult>, page: array{page: int, pageSize: int, total: int, totalPages: int}}
     */
    public function list(ListOrdersQuery $query): array;
}
