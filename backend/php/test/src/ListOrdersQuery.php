<?php
declare(strict_types=1);

namespace App;

final readonly class ListOrdersQuery
{
    public function __construct(
        public string $userId = '',
        public int $page = 1,
        public int $pageSize = OrderService::DEFAULT_PAGE_SIZE,
        public string $sortBy = 'created_at',
        public string $sortOrder = 'asc',
    ) {}
}
