# FastAPI + Pydantic v2 框架差异规范

路径基准：本文所有裸路径相对规范库根 `<SPEC_ROOT>` 解析。见 `<SPEC_ROOT>/README.md`「路径基准」。

## FastAPI 专属约束
1. **生命周期用 `lifespan`**：使用 `@asynccontextmanager async def lifespan(app)` 初始化与优雅关闭连接池/HTTP 客户端（弃用旧版 `@app.on_event`）。
2. **`Depends` 装配依赖**：通过 `Depends` 注入认证 `Actor`、Service 与 `Session`，禁止在路由函数内实例化 DB 连接或直接写 SQL。
3. **同步路由 vs 异步路由**：仅当全链路使用真异步驱动时写 `async def` 路由；调用同步 ORM/SDK 的路由声明为普通 `def` 由线程池执行，防事件循环卡死。
4. **Pydantic v2 校验与响应裁剪**：入参 Schema 与出参 `response_model` 严格分离，开启 `model_config = ConfigDict(extra="forbid")` 防未知字段污染，严禁直接返回 ORM 模型泄露内部列。
