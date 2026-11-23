# PHP 注释与 PHPDoc 规范

路径基准：本文所有裸路径相对规范库根 `<SPEC_ROOT>` 解析。见 `<SPEC_ROOT>/README.md`「路径基准」。

通用原则见 `common/rules/comment.md`。

## 规则与正反示例

1. **PHPDoc 补足泛型与数组形状**：PHP 8.2+ 原生类型已表达清晰时不再写废话 `@param string $id`；仅用 PHPDoc 补充 `array{...}`、`list<T>`、`@template` 供 PHPStan 静态分析。
2. **写明不变量与异常契约**：记录抛出的领域异常与幂等/事务前置条件，禁留死代码注释。

```php
// ✅ 正例：补充数组形状供 PHPStan 校验
/** @param array{userId: string, quantity: int, couponCode?: string} $payload */
public function create(array $payload): OrderResult

// ❌ 反例：复述原生类型的无效 PHPDoc
/** @param OrderInput $input 输入 */
public function create(OrderInput $input): OrderResult
```

## 检查清单

- [ ] PHPDoc 与实际参数字段完全一致（无漏写可选键如 `couponCode`）
- [ ] 复杂数组与集合均具备 PHPStan 泛型/形状注解
