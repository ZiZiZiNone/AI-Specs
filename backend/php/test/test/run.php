<?php
declare(strict_types=1);

require_once __DIR__ . '/../src/Exceptions.php';
require_once __DIR__ . '/../src/TransactionManagerInterface.php';
require_once __DIR__ . '/../src/OrderInput.php';
require_once __DIR__ . '/../src/ListOrdersQuery.php';
require_once __DIR__ . '/../src/OrderResult.php';
require_once __DIR__ . '/../src/OrderRepositoryInterface.php';
require_once __DIR__ . '/../src/MemoryOrderRepository.php';
require_once __DIR__ . '/../src/TransactionManager.php';
require_once __DIR__ . '/../src/OrderService.php';
require_once __DIR__ . '/../src/OrderController.php';

use App\ConflictException;
use App\InvalidInputException;
use App\MemoryOrderRepository;
use App\NestedTransactionException;
use App\OrderController;
use App\OrderService;
use App\TransactionManager;

final class TestRunner
{
    private int $passed = 0;
    private int $failed = 0;

    public function assertTrue(bool $cond, string $msg): void
    {
        if ($cond) {
            $this->passed++;
        } else {
            $this->failed++;
            fwrite(STDERR, "FAIL: {$msg}\n");
        }
    }

    public function summary(): int
    {
        echo "PHP tests passed={$this->passed} failed={$this->failed}\n";
        return $this->failed === 0 ? 0 : 1;
    }
}

$runner = new TestRunner();
$now = 1763884800;
$repo = new MemoryOrderRepository();
$tx = new TransactionManager($repo);
$service = new OrderService($repo, $tx, static function () use (&$now): int { return $now; });
$controller = new OrderController($service);

// 1. 复合作用域幂等键隔离（不同用户同键均成功）
$o1 = $controller->create([
    'userId' => 'u1', 'itemId' => 'sku-1', 'quantity' => 2, 'unitPriceCents' => 500, 'idempotencyKey' => 'k1',
]);
$o2 = $controller->create([
    'userId' => 'u2', 'itemId' => 'sku-1', 'quantity' => 1, 'unitPriceCents' => 500, 'idempotencyKey' => 'k1',
]);
$runner->assertTrue($o1->id !== $o2->id, 'different users with same key must be isolated');

// 2. 同用户同键同载荷重放返回原结果
$o1Replay = $controller->create([
    'userId' => 'u1', 'itemId' => 'sku-1', 'quantity' => 2, 'unitPriceCents' => 500, 'idempotencyKey' => 'k1',
]);
$runner->assertTrue($o1Replay->id === $o1->id, 'same user same payload replays original order');

// 3. 同用户同键异载荷（含 couponCode）抛 ConflictException 且带错误码 40901
$caughtConflict = false;
try {
    $controller->create([
        'userId' => 'u1', 'itemId' => 'sku-1', 'quantity' => 2, 'unitPriceCents' => 500, 'couponCode' => 'VIP', 'idempotencyKey' => 'k1',
    ]);
} catch (ConflictException $e) {
    $caughtConflict = ($e->errorCode === 40901);
}
$runner->assertTrue($caughtConflict, 'payload mismatch throws ConflictException(40901)');

// 4. TTL 过期后允许重新创建
$now += OrderService::DEFAULT_IDEMPOTENCY_TTL + 60;
$o3 = $controller->create([
    'userId' => 'u1', 'itemId' => 'sku-1', 'quantity' => 2, 'unitPriceCents' => 500, 'idempotencyKey' => 'k1',
]);
$runner->assertTrue($o3->id !== $o1->id, 'expired idempotency key allows new order');

// 5. pageSize > 100 截断为 100（非重置为 20）且拒绝非法排序字段
$list = $controller->list(['userId' => 'u1', 'page' => 1, 'pageSize' => 500]);
$runner->assertTrue($list['page']['pageSize'] === 100, 'pageSize > 100 must clamp to 100');

$caughtSort = false;
try {
    $controller->list(['userId' => 'u1', 'sortBy' => 'evil_sql']);
} catch (InvalidInputException $e) {
    $caughtSort = ($e->errorCode === 40001);
}
$runner->assertTrue($caughtSort, 'unknown sortBy throws InvalidInputException(40001)');

// 6. 嵌套事务拦截
$caughtNested = false;
try {
    $tx->run(static function () use ($tx): void {
        $tx->run(static function (): void {});
    });
} catch (NestedTransactionException) {
    $caughtNested = true;
}
$runner->assertTrue($caughtNested, 'nested transaction must be rejected');

exit($runner->summary());
