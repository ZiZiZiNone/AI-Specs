# PHP 命名规范

路径基准：本文所有裸路径相对规范库根 `<SPEC_ROOT>` 解析。见 `<SPEC_ROOT>/README.md`「路径基准」。

跨语言语义原则见 `common/rules/naming.md`「跨语言规则」。

## 规则与正反示例

1. **PSR-4 命名空间与文件名严格一致**：类名 `PascalCase`、方法与属性 `camelCase`、类常量 `UPPER_SNAKE_CASE`；接口统一 `*Interface` 后缀（如 `TransactionManagerInterface`）。
2. **只读 DTO 与单位后缀**：传输与查询对象使用 `final readonly class`（如 `OrderInput`、`ListOrdersQuery`），金额与时间字段显式带 `*Cents` / `*Ts` / `*Seconds`。

```php
// ✅ 正例
final readonly class ListOrdersQuery {
    public function __construct(public string $userId = '', public int $page = 1) {}
}

// ❌ 反例：无类型关联数组四处透传
function listOrders(array $params) { ... }
```

## 检查清单

- [ ] 命名空间与目录路径完全符合 PSR-4
- [ ] 接口带 `Interface` 后缀，核心载荷封装为 `readonly` DTO
