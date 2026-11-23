# PHP 最小可运行参考切片（v2.0）

路径基准：本文所有裸路径相对规范库根 `<SPEC_ROOT>` 解析。见 `<SPEC_ROOT>/README.md`「路径基准」。

零第三方依赖的 PHP 8.2+ 工程，演示 `BE-101` 至 `BE-107` 完整落地：
- `TransactionManagerInterface` 依赖倒置 + 嵌套事务拦截
- 复合幂等键 `(user_id, idempotency_key)` + 全字段载荷哈希 + TTL 过期
- `pageSize > 100` 截断为 `100` + 白名单排序 + `OrderController::list()` / `OrderService::list()` 全链路打通
- 领域异常统一携带业务错误码与安全上下文；测试脚本无 `global` 变量

## 运行验证命令

```bash
cd backend/php/test
find src test -name '*.php' -print0 | xargs -0 -n1 php -l
php test/run.php
```
