<?php

declare(strict_types=1);

namespace BackendPhpTest;

// 内存仓储：幂等键全局唯一；事务内写入先进暂存，提交原子落子，失败丢弃。
// 仅用于演示与测试，非生产实现。
class MemoryOrderRepository implements OrderRepositoryInterface
{
    /** @var array<string, OrderResult> */
    private array $rows = [];

    /** @var array<string, string> 幂等键到主键 */
    private array $byKey = [];

    /** @var OrderResult[]|null 非空即在事务内 */
    private ?array $staged = null;

    /** @var array<string, true>|null */
    private ?array $stagedKeys = null;

    public int $insertCalls = 0;

    public int $rollbacks = 0;

    private ?\Throwable $failInsert = null;

    private int $seq = 0;

    // 下一次 insert 注错，用于回滚测试。
    public function failInsertWith(\Throwable $e): void
    {
        $this->failInsert = $e;
    }

    // 由事务管理器调用：开启暂存。
    public function beginTx(): void
    {
        $this->staged = [];
        $this->stagedKeys = [];
    }

    // 由事务管理器调用：原子落子；冲突只抛错不清场，清场走统一回滚口。
    public function commitTx(): void
    {
        foreach ($this->stagedKeys as $k => $_) {
            if (isset($this->byKey[$k])) {
                throw new DuplicateKeyException($k);
            }
        }
        foreach ($this->staged as $row) {
            $this->rows[$row->id] = $row;
            $this->byKey[$row->idempotencyKey] = $row->id;
        }
        $this->staged = null;
        $this->stagedKeys = null;
    }

    // 由事务管理器调用：丢弃暂存。
    public function rollbackTx(): void
    {
        $this->staged = null;
        $this->stagedKeys = null;
        $this->rollbacks++;
    }

    public function inTransaction(): bool
    {
        return $this->staged !== null;
    }

    public function insert(OrderInput $in): OrderResult
    {
        if ($in->idempotencyKey === '') {
            throw new ValidationException('invalid order input');
        }
        $this->insertCalls++;
        if ($this->failInsert !== null) {
            $e = $this->failInsert;
            $this->failInsert = null;
            throw $e;
        }
        if (isset($this->byKey[$in->idempotencyKey])) {
            throw new DuplicateKeyException($in->idempotencyKey);
        }
        if ($this->stagedKeys !== null && isset($this->stagedKeys[$in->idempotencyKey])) {
            throw new DuplicateKeyException($in->idempotencyKey);
        }
        $this->seq++;
        $row = new OrderResult(
            id: sprintf('ord-%d', $this->seq),
            idempotencyKey: $in->idempotencyKey,
            userId: $in->userId,
            amountCents: $in->amountCents,
            couponCode: $in->couponCode,
        );
        if ($this->staged !== null) {
            $this->staged[] = $row;
            $this->stagedKeys[$in->idempotencyKey] = true;
            return $row;
        }
        $this->rows[$row->id] = $row;
        $this->byKey[$row->idempotencyKey] = $row->id;
        return $row;
    }

    public function findByIdempotencyKey(string $key): OrderResult
    {
        if ($this->staged !== null) {
            foreach ($this->staged as $row) {
                if ($row->idempotencyKey === $key) {
                    return $row;
                }
            }
        }
        if (!isset($this->byKey[$key])) {
            throw new NotFoundException('order not found');
        }
        return $this->rows[$this->byKey[$key]];
    }

    public function list(?string $userId, int $page, int $pageSize): array
    {
        $all = array_values(array_filter(
            $this->rows,
            static fn (OrderResult $r): bool => $userId === null || $r->userId === $userId,
        ));
        usort($all, static fn (OrderResult $a, OrderResult $b): int => $a->id <=> $b->id);
        $total = count($all);
        $page = max(1, $page);
        $pageSize = ($pageSize < 1 || $pageSize > 100) ? 20 : $pageSize;
        $start = ($page - 1) * $pageSize;
        if ($start >= $total) {
            return [[], $total];
        }
        return [array_slice($all, $start, $pageSize), $total];
    }

    public function rowCount(): int
    {
        return count($this->rows);
    }

    public function hasStoredKey(string $key): bool
    {
        return isset($this->byKey[$key]);
    }
}
