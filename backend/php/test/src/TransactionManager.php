<?php
declare(strict_types=1);

namespace App;

use Throwable;

final class TransactionManager implements TransactionManagerInterface
{
    private bool $inTransaction = false;
    public int $rollbacks = 0;

    public function __construct(private readonly MemoryOrderRepository $repo) {}

    public function run(callable $callback): mixed
    {
        if ($this->inTransaction) {
            throw new NestedTransactionException();
        }
        $this->inTransaction = true;
        $this->repo->beginTx();
        try {
            $result = $callback();
            $this->repo->commitTx();
            return $result;
        } catch (Throwable $e) {
            $this->repo->rollbackTx();
            $this->rollbacks++;
            throw $e;
        } finally {
            $this->inTransaction = false;
        }
    }
}
