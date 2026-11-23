# PHP 测试规范

路径基准：本文所有裸路径相对规范库根 `<SPEC_ROOT>` 解析。见 `<SPEC_ROOT>/README.md`「路径基准」。

通用原则见 `common/rules/test.md`「规则」，无法执行时按 `common/protocol/final-gate.md`「无法验证时的处理」声明。

## 规则与正反示例

1. **隔离可测与时钟注入**：通过构造函数注入 `callable(): int` 时钟与内存 Fake 仓储，实现毫秒级确定性单测；测试脚本同样禁止使用 `global` 变量（封装在 `TestRunner` 或 PHPUnit/Pest 类中）。
2. **全量语法与静态检查**：提交前执行全目录 `php -l`、`vendor/bin/phpstan analyse`、`vendor/bin/pint --test` 及测试套件（见 `backend/php/test/`）。

```php
// ✅ 正例：注入可控时钟测试 TTL 过期
$now = 1763884800;
$service = new OrderService($repo, $tx, static function () use (&$now): int { return $now; });
$now += OrderService::DEFAULT_IDEMPOTENCY_TTL + 60;
```

## 检查清单

- [ ] 全量 `.php` 文件通过 `php -l` 与单元测试
- [ ] 测试代码无 `global` 变量、无真实外网与系统时钟依赖
