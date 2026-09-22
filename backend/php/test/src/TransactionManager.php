<?php

declare(strict_types=1);

namespace BackendPhpTest;

// 事务管理器：闭包成功提交，失败回滚。仓储默认靠本定界执行，不收事务参数。
class TransactionManager
{
    public function __construct(private MemoryOrderRepository $repo) {}

    /** @param callable(): mixed $fn */
    public function transaction(callable $fn): mixed
    {
        $this->repo->beginTx();
        try {
            $result = $fn();
        } catch (\Throwable $e) {
            $this->repo->rollbackTx();
            throw $e;
        }
        $this->repo->commitTx();
        return $result;
    }
}
