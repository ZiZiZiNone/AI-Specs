<?php
declare(strict_types=1);

namespace App;

final class OrderService
{
    public const DEFAULT_PAGE_SIZE = 20;
    public const MAX_PAGE_SIZE = 100;
    public const DEFAULT_IDEMPOTENCY_TTL = 86400;

    /** @var callable(): int */
    private $clock;

    /** @param (callable(): int)|null $clock */
    public function __construct(
        private readonly OrderRepositoryInterface $repo,
        private readonly TransactionManagerInterface $tx,
        ?callable $clock = null,
    ) {
        $this->clock = $clock ?? static fn (): int => time();
    }

    public function create(OrderInput $input): OrderResult
    {
        if (trim($input->userId) === '' || trim($input->itemId) === '' ||
            trim($input->idempotencyKey) === '' || $input->quantity <= 0 || $input->unitPriceCents <= 0) {
            throw new InvalidInputException('Invalid order parameters');
        }

        $nowTs = ($this->clock)();
        $totalCents = $input->quantity * $input->unitPriceCents;

        return $this->tx->run(function () use ($input, $totalCents, $nowTs): OrderResult {
            $existing = $this->repo->findByIdempotencyKey($input->userId, $input->idempotencyKey, $nowTs);
            if ($existing !== null) {
                if ($existing->payloadHash !== $input->payloadHash()) {
                    throw new ConflictException('Idempotency key payload mismatch', ['userId' => $input->userId]);
                }
                return $existing;
            }
            return $this->repo->insert($input, $totalCents, $nowTs, self::DEFAULT_IDEMPOTENCY_TTL);
        });
    }

    /**
     * @return array{items: list<OrderResult>, page: array{page: int, pageSize: int, total: int, totalPages: int}}
     */
    public function list(ListOrdersQuery $query): array
    {
        $safePage = max(1, $query->page);
        $safePageSize = $query->pageSize <= 0 ? self::DEFAULT_PAGE_SIZE : min($query->pageSize, self::MAX_PAGE_SIZE);
        return $this->repo->list(new ListOrdersQuery(
            userId: $query->userId,
            page: $safePage,
            pageSize: $safePageSize,
            sortBy: $query->sortBy,
            sortOrder: $query->sortOrder,
        ));
    }
}
