<?php

declare(strict_types=1);

// 服务测试：内存替身仓储，不起服务不连真实库。任一断言失败即非零退出。
require __DIR__ . '/../src/Exceptions.php';
require __DIR__ . '/../src/OrderInput.php';
require __DIR__ . '/../src/OrderResult.php';
require __DIR__ . '/../src/OrderRepositoryInterface.php';
require __DIR__ . '/../src/MemoryOrderRepository.php';
require __DIR__ . '/../src/TransactionManager.php';
require __DIR__ . '/../src/OrderService.php';
require __DIR__ . '/../src/OrderController.php';

use BackendPhpTest\ConflictException;
use BackendPhpTest\MemoryOrderRepository;
use BackendPhpTest\OrderController;
use BackendPhpTest\OrderInput;
use BackendPhpTest\OrderService;
use BackendPhpTest\TransactionManager;
use BackendPhpTest\ValidationException;

$failures = 0;

function check(string $name, bool $cond): void
{
    global $failures;
    if ($cond) {
        echo "PASS: {$name}\n";
    } else {
        $failures++;
        echo "FAIL: {$name}\n";
    }
}

function makeService(MemoryOrderRepository $repo): OrderService
{
    return new OrderService(new TransactionManager($repo), $repo);
}

function inputWithKey(string $key): OrderInput
{
    return new OrderInput(idempotencyKey: $key, userId: 'u-1', amountCents: 100);
}

// 1. 同一键重复提交返回首次结果，不产生第二行。
$repo = new MemoryOrderRepository();
$svc = makeService($repo);
$first = $svc->create(inputWithKey('key-1'));
$again = $svc->create(inputWithKey('key-1'));
check('replay_returns_first_result', $again->id === $first->id);
check('replay_adds_no_rows', $repo->rowCount() === 1);

// 2. Insert 阶段失败全部回滚，不落去重键；断言异常类精确到哨兵。
$repo2 = new MemoryOrderRepository();
$repo2->failInsertWith(new RuntimeException('db down'));
$svc2 = makeService($repo2);
$thrown = null;
try {
    $svc2->create(inputWithKey('key-9'));
} catch (\Throwable $e) {
    $thrown = $e;
}
check('failure_throws_db_down', $thrown instanceof RuntimeException && $thrown->getMessage() === 'db down');
check('failure_rolls_back', $repo2->rollbacks > 0);
check('failure_discards_rows', $repo2->rowCount() === 0);
check('failure_stores_no_key', !$repo2->hasStoredKey('key-9'));

// 3. 空幂等键直接拒绝，不到仓储；仓储直调同样拒绝。
$repo3 = new MemoryOrderRepository();
$svc3 = makeService($repo3);
$rejected = false;
try {
    $svc3->create(new OrderInput(idempotencyKey: '', userId: 'u-1', amountCents: 100));
} catch (ValidationException) {
    $rejected = true;
}
check('empty_key_rejected', $rejected);
check('rejected_input_skips_dao', $repo3->insertCalls === 0);
$daoRejected = false;
try {
    $repo3->insert(new OrderInput(idempotencyKey: '', userId: 'u-1', amountCents: 100));
} catch (ValidationException) {
    $daoRejected = true;
}
check('dao_rejects_empty_key_directly', $daoRejected);

// 4. 同键异载荷返回冲突，不复用他人结果。
$repo4 = new MemoryOrderRepository();
$svc4 = makeService($repo4);
$svc4->create(inputWithKey('key-x'));
$clashAmount = new OrderInput(idempotencyKey: 'key-x', userId: 'u-1', amountCents: 999);
$conflicted = false;
try {
    $svc4->create($clashAmount);
} catch (ConflictException) {
    $conflicted = true;
}
check('conflicting_payload_returns_conflict', $conflicted);
check('conflict_adds_no_rows', $repo4->rowCount() === 1);

// 5. 控制器只做组装：透传一次创建成功。
$repo5 = new MemoryOrderRepository();
$controller = new OrderController(makeService($repo5));
$res = $controller->create(['idempotencyKey' => 'key-c', 'userId' => 'u-2', 'amountCents' => 200]);
check('controller_assembles', $res['userId'] === 'u-2' && $res['amountCents'] === 200 && $repo5->rowCount() === 1);

// 6. 列表分页：总数正确，空页保持空。
$repo6 = new MemoryOrderRepository();
$svc6 = makeService($repo6);
foreach (['k-a', 'k-b', 'k-c'] as $k) {
    $svc6->create(inputWithKey($k));
}
[$items, $total] = $repo6->list(null, 1, 2);
check('list_paginates', count($items) === 2 && $total === 3);
[$items, $total] = $repo6->list(null, 5, 2);
check('list_empty_page_stays_empty', count($items) === 0 && $total === 3);

exit($failures === 0 ? 0 : 1);
