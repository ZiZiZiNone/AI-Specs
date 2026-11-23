<?php
declare(strict_types=1);

namespace App;

final class OrderController
{
    public function __construct(private readonly OrderService $service) {}

    /**
     * @param array{userId: string, itemId: string, quantity: int, unitPriceCents: int, idempotencyKey: string, couponCode?: string} $payload
     */
    public function create(array $payload): OrderResult
    {
        return $this->service->create(new OrderInput(
            userId: (string) ($payload['userId'] ?? ''),
            itemId: (string) ($payload['itemId'] ?? ''),
            quantity: (int) ($payload['quantity'] ?? 0),
            unitPriceCents: (int) ($payload['unitPriceCents'] ?? 0),
            idempotencyKey: (string) ($payload['idempotencyKey'] ?? ''),
            couponCode: (string) ($payload['couponCode'] ?? ''),
        ));
    }

    /**
     * @param array{userId?: string, page?: int, pageSize?: int, sortBy?: string, sortOrder?: string} $query
     * @return array{items: list<OrderResult>, page: array{page: int, pageSize: int, total: int, totalPages: int}}
     */
    public function list(array $query): array
    {
        return $this->service->list(new ListOrdersQuery(
            userId: (string) ($query['userId'] ?? ''),
            page: (int) ($query['page'] ?? 1),
            pageSize: (int) ($query['pageSize'] ?? OrderService::DEFAULT_PAGE_SIZE),
            sortBy: (string) ($query['sortBy'] ?? 'created_at'),
            sortOrder: (string) ($query['sortOrder'] ?? 'asc'),
        ));
    }
}
