# Python 并发与异步规范（BE-107）

路径基准：本文所有裸路径相对规范库根 `<SPEC_ROOT>` 解析。见 `<SPEC_ROOT>/README.md`「路径基准」。

## 核心规则
1. **严禁在 `async def` 中调用同步阻塞 I/O**：`requests.get`、`time.sleep`、同步驱动会卡死整个事件循环；必须使用 `httpx.AsyncClient` / `asyncio.sleep` 或 `asyncio.to_thread`。
2. **结构化并发**：使用 `asyncio.TaskGroup` 与 `asyncio.timeout(...)` 管理子任务生命周期与超时，禁止“发后即忘”的裸 `asyncio.create_task` 不存引用（可能被 GC 静默回收）。
3. **跨进程并发写安全**：多 Worker（Uvicorn/Gunicorn）同样受 `backend/patterns/concurrency-locking.md` 约束，禁止进程内锁替代数据库行锁/原子更新。
