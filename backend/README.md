# backend — 后端工程规范

路径基准：本文所有裸路径相对规范库根 `<SPEC_ROOT>` 解析。见 `<SPEC_ROOT>/README.md`「路径基准」。

后端规范以 `backend/rules/core-principles.md`（`BE-101` 至 `BE-108`）为强制红线，采用“共用分层与生产模式 + 语言子树（Go / PHP）+ 框架差异目录（GoFrame / Laravel）”结构。

## 必读入口与按需加载顺序

1. 先读完根目录必读四件（见 `<SPEC_ROOT>/README.md`「加载策略」）
2. 必读后端核心红线：`backend/rules/core-principles.md`（`BE-101` 至 `BE-108`）
3. 进入对应语言子树：`backend/go/README.md`（含 `goframe/`）或 `backend/php/README.md`（含 `laravel/`）
4. 按场景取用：
   - 决策点：`backend/protocol/decision-trees.md`
   - 读写与生产模式：`backend/patterns/README.md`（列表、幂等写、事务更新、鉴权安全、并发锁、缓存、韧性、在线 DDL、可观测、异步 Outbox）
   - 反模式警戒：`backend/anti-patterns/README.md`
   - 黄金切片与可运行测试：`backend/examples/golden/service-slice.md`、`backend/go/test/`、`backend/php/test/`
   - 任务模板与自检：`backend/tasks/README.md`、`backend/checklists/self-check.md`、`backend/checklists/detailed-check.md`

## 分层原则（PHP / Go 共用）

- **入口层（Controller / Handler）**：协议解析、基础格式校验、读取中间件注入的 `Actor` 身份、调用 Service、输出统一信封；不开事务、不含业务规则、不直接调 DAO（`BE-101`）。
- **服务层（Service / Logic）**：承载业务规则、状态机、细粒度资源归属鉴权（`BE-105`）、事务边界编排（`BE-103`）与幂等控制（`BE-104`）；通过接口注入仓储与外部依赖（`BE-102`）。
- **数据层（Repository / DAO）**：专注参数化 SQL/存储访问与模型映射，不承载业务规则，不私自开启跨仓储事务，不执行隐藏重试（`BE-106`）。

## 现有子目录与技术栈覆盖矩阵

未收录对应技术栈目录时仅遵循 `common/` 通用规范，不套用其他技术栈的规则。


| 语言 | 语言子树 | 框架差异目录 | 并发数据安全要求 | 可运行参考切片 |
|---|---|---|---|---|
| Go | `backend/go/` | `backend/go/goframe/`（GoFrame v2.10） | 协程安全 + 数据库/分布式锁（`BE-107`） | `backend/go/test/` |
| PHP | `backend/php/` | `backend/php/laravel/`（Laravel 13） | **多进程/Octane 并发同样受 `BE-107` 约束，严禁免检** | `backend/php/test/` |

## 全语言后端技术栈覆盖矩阵（v3.0 — 六大主流 AI 开发语言）

| 语言 | 语言子树 | 框架差异目录 | 可运行参考切片 |
|---|---|---|---|
| Go | `backend/go/` | `backend/go/goframe/`（GoFrame v2.10） | `backend/go/test/` |
| PHP | `backend/php/` | `backend/php/laravel/`（Laravel 13） | `backend/php/test/` |
| Python | `backend/python/` | `backend/python/fastapi/`（FastAPI + Pydantic v2） | `backend/python/test/` |
| TypeScript / Node.js | `backend/typescript/` | `backend/typescript/nestjs-fastify/`（NestJS / Fastify） | `backend/typescript/test/` |
| Java | `backend/java/` | `backend/java/spring-boot/`（Spring Boot 3 / Java 17-21） | `backend/java/test/` |
| Rust | `backend/rust/` | `backend/rust/axum/`（Axum / Tokio） | `backend/rust/test/` |
