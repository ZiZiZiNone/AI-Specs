<?php
declare(strict_types=1);

namespace App;

final class MemoryOrderRepository implements OrderRepositoryInterface
{
    private int $seq = 0;
    /** @var array<string, OrderResult> */
    private array $orders = [];
    /** @var array<string, string> */
    private array $byScope = [];

    private bool $inTx = false;
    /** @var array<string, OrderResult> */
    private array $stagedOrders = [];
    /** @var array<string, string> */
    private array $stagedScope = [];

    public function beginTx(): void
    {
        $this->inTx = true;
        $this->stagedOrders = [];
        $this->stagedScope = [];
    }

    public function commitTx(): void
    {
        foreach ($this->stagedOrders as $id => $ord) {
            $this->orders[$id] = $ord;
        }
        foreach ($this->stagedScope as $sk => $id) {
            $this->byScope[$sk] = $id;
        }
        $this->stagedOrders = [];
        $this->stagedScope = [];
        $this->inTx = false;
    }

    public function rollbackTx(): void
    {
        $this->stagedOrders = [];
        $this->stagedScope = [];
        $this->inTx = false;
    }

    private static function scopeKey(string $userId, string $key): string
    {
        return $userId . ':' . $key;
    }

    public function insert(OrderInput $input, int $totalCents, int $nowTs, int $ttlSeconds): OrderResult
    {
        $sk = self::scopeKey($input->userId, $input->idempotencyKey);
        if ($this->findByIdempotencyKey($input->userId, $input->idempotencyKey, $nowTs) !== null) {
            throw new ConflictException('Duplicate idempotency key', ['userId' => $input->userId]);
        }

        $this->seq++;
        $order = new OrderResult(
            seq: $this->seq, id: 'ord-' . $this->seq, userId: $input->userId,
            itemId: $input->itemId, quantity: $input->quantity, totalCents: $totalCents,
            couponCode: $input->couponCode, status: 'created',
            payloadHash: $input->payloadHash(), idemExpiresAt: $nowTs + $ttlSeconds,
        );

        if ($this->inTx) {
            $this->stagedOrders[$order->id] = $order;
            $this->stagedScope[$sk] = $order->id;
        } else {
            $this->orders[$order->id] = $order;
            $this->byScope[$sk] = $order->id;
        }
        return $order;
    }

    public function findByIdempotencyKey(string $userId, string $key, int $nowTs): ?OrderResult
    {
        $sk = self::scopeKey($userId, $key);
        if ($this->inTx && isset($this->stagedScope[$sk])) {
            return $this->stagedOrders[$this->stagedScope[$sk]];
        }
        if (!isset($this->byScope[$sk])) {
            return null;
        }
        $ord = $this->orders[$this->byScope[$sk]];
        return $ord->idemExpiresAt > $nowTs ? $ord : null;
    }

    public function list(ListOrdersQuery $query): array
    {
        if (!in_array($query->sortBy, ['created_at', 'total_cents'], true)) {
            throw new InvalidInputException('Unknown sort field', ['sortBy' => $query->sortBy]);
        }
        $matched = array_values(array_filter(
            $this->orders,
            static fn (OrderResult $o): bool => $query->userId === '' || $o->userId === $query->userId,
        ));
        $desc = $query->sortOrder === 'desc';
        usort($matched, static function (OrderResult $a, OrderResult $b) use ($query, $desc): int {
            $cmp = $query->sortBy === 'total_cents'
                ? ($a->totalCents <=> $b->totalCents ?: $a->seq <=> $b->seq)
                : ($a->seq <=> $b->seq);
            return $desc ? -$cmp : $cmp;
        });

        $total = count($matched);
        $totalPages = $total > 0 ? (int) ceil($total / $query->pageSize) : 0;
        $items = array_slice($matched, ($query->page - 1) * $query->pageSize, $query->pageSize);
        return [
            'items' => $items,
            'page' => ['page' => $query->page, 'pageSize' => $query->pageSize, 'total' => $total, 'totalPages' => $totalPages],
        ];
    }
}
