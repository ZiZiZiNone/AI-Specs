<?php

declare(strict_types=1);

namespace BackendPhpTest;

// 事务管理器：闭包成功提交，失败回滚；提交失败同样走统一回滚口，不分叉计数。
// 零依赖演示故直接依赖内存仓储，生产替换为框架绑定实现。
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
        try {
            $this->repo->commitTx();
        } catch (\Throwable $e) {
            $this->repo->rollbackTx();
            throw $e;
        }
        return $result;
    }
}
