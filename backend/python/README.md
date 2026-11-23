# Python 3.11+ 后端工程规范

路径基准：本文所有裸路径相对规范库根 `<SPEC_ROOT>` 解析。见 `<SPEC_ROOT>/README.md`「路径基准」。

承接 `backend/rules/core-principles.md`（`BE-101` 至 `BE-108`），适用于 FastAPI / Django / 数据与 AI 服务后端。

## 目录索引
- `backend/python/structure.md`：分层目录与 `Protocol` 依赖倒置
- `backend/python/style.md`：类型注解（mypy strict）、Ruff 风格与 `dataclass(frozen=True)`
- `backend/python/error-handling.md`：领域异常层级与禁裸 `except:`
- `backend/python/concurrency.md`：`asyncio` 事件循环防阻塞、`TaskGroup` 与数据库锁
- `backend/python/security.md`：禁 `pickle`/`eval`/shell 拼接、`pip-audit` 与参数化查询
- `backend/python/transaction.md`：Unit of Work / ContextManager 事务边界
- `backend/python/testing.md`：`pytest`/`unittest` 确定性测试与时钟注入
- `backend/python/fastapi/README.md`：FastAPI + Pydantic v2 专属约束
- `backend/python/test/`：零依赖可运行 Python 订单参考切片（`python3 -m unittest discover -s backend/python/test/tests -v`）
