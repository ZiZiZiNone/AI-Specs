# TypeScript / Node.js 后端工程规范

路径基准：本文所有裸路径相对规范库根 `<SPEC_ROOT>` 解析。见 `<SPEC_ROOT>/README.md`「路径基准」。

承接 `backend/rules/core-principles.md`（`BE-101` 至 `BE-108`），适用于 Node.js 18+ / Fastify / NestJS / Express 后端服务。

## 目录索引
- `backend/typescript/structure.md`：分层目录与 ESM 规范
- `backend/typescript/style.md`：`strict: true`、边界 Schema 校验（Zod/Valibot）与复杂度红线
- `backend/typescript/error-handling.md`：领域错误类与全局异常过滤器
- `backend/typescript/concurrency.md`：事件循环防阻塞、`AbortSignal` 与数据库锁
- `backend/typescript/security.md`：防原型污染、ReDoS、`npm audit` 与 Helmet/CORS
- `backend/typescript/transaction.md`：Prisma/Drizzle/Knex 事务闭包边界
- `backend/typescript/testing.md`：`node --test` / Vitest 确定性测试
- `backend/typescript/nestjs-fastify/README.md`：NestJS 与 Fastify 专属约束
- `backend/typescript/test/`：零依赖可运行参考切片（`tsc --noEmit` + `node --test`）
