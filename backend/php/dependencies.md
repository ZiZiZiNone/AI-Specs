# PHP 依赖与 Composer 管理规范

路径基准：本文所有裸路径相对规范库根 `<SPEC_ROOT>` 解析。见 `<SPEC_ROOT>/README.md`「路径基准」。

## 规则与正反示例

1. **依赖倒置（`BE-102`）**：Service 构造函数仅依赖接口（如 `OrderRepositoryInterface`、`TransactionManagerInterface`、`LoggerInterface`），绝不硬编码依赖具体存储实现。
2. **锁文件与安全审计**：应用项目必须提交 `composer.lock`，CI 定期运行 `composer audit`（`COM-014`）。

```php
// ✅ 正例：依赖抽象接口
public function __construct(
    private readonly OrderRepositoryInterface $repo,
    private readonly TransactionManagerInterface $tx,
) {}

// ❌ 反例：直接依赖具体实现类
public function __construct(private readonly MemoryOrderRepository $repo) {}
```

## 检查清单

- [ ] `composer.lock` 已锁定版本并通过 `composer audit`
- [ ] 核心服务全部通过接口构造注入，无静态 Facade 强耦合
