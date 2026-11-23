# PHP 配置管理规范

路径基准：本文所有裸路径相对规范库根 `<SPEC_ROOT>` 解析。见 `<SPEC_ROOT>/README.md`「路径基准」。

## 规则与正反示例

1. **配置集中加载并按构造函数注入**：在容器装配层读取环境变量或配置文件，封装为 `readonly` 配置对象注入 Service，严禁在业务类内散落 `getenv()` / `$_ENV`。
2. **禁止提交真实 `.env`**：仓库仅保留 `.env.example` 占位模板。

```php
// ✅ 正例：只读配置 DTO 构造注入
final readonly class PaymentConfig {
    public function __construct(public string $endpoint, public int $timeoutMs) {}
}

// ❌ 反例：业务方法直接读超全局变量
$secret = $_ENV['PAY_SECRET'];
```

## 检查清单

- [ ] Service/Repository 内无 `getenv()` / `$_ENV` / `$_SERVER` 直读
- [ ] 缺失必填配置在启动装配期即抛出明确异常
