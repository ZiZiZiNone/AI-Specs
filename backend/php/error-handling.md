# PHP 错误与异常处理规范

路径基准：本文所有裸路径相对规范库根 `<SPEC_ROOT>` 解析。见 `<SPEC_ROOT>/README.md`「路径基准」。

## 规则与正反示例

1. **领域异常统一基类**：继承统一 `DomainException` 携带稳定整型业务错误码 `errorCode` 与安全上下文数组（参考 `backend/php/test/src/Exceptions.php`），禁止裸抛 `new \Exception('fail')`。
2. **禁吞异常与 SQL 脱敏**：禁止空 `catch (Throwable $e) {}`；仓储层不私自重试，捕获底层 PDO 异常后映射为领域异常且不泄露原始 SQL 绑定参数。

```php
// ✅ 正例：语义明确、带稳定业务码与安全上下文
throw new ConflictException('Idempotency key payload mismatch', ['userId' => $input->userId]);

// ❌ 反例：裸抛通用异常或吞掉异常
try { $this->repo->insert(...); } catch (\Throwable $e) {}
```

## 检查清单

- [ ] 全部业务异常继承统一 `DomainException` 并携带业务码
- [ ] 无空 `catch` 块，异常响应不泄露内部堆栈与 SQL 原文
