# Python 事务边界规范（BE-103）

路径基准：本文所有裸路径相对规范库根 `<SPEC_ROOT>` 解析。见 `<SPEC_ROOT>/README.md`「路径基准」。

## 规则
- 通过 `with tx.transaction():` / `async with uow:` 上下文管理器在 Service 层统一界定事务边界；异常自动回滚，拦截非法嵌套事务；事务内严禁同步调用外部 HTTP/LLM API。
