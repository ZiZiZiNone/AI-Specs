# Rust 后端工程规范

路径基准：本文所有裸路径相对规范库根 `<SPEC_ROOT>` 解析。见 `<SPEC_ROOT>/README.md`「路径基准」。

承接 `backend/rules/core-principles.md`（`BE-101` 至 `BE-108`），适用于 Axum / Tokio 高性能服务与 AI 基础设施组件。

## 目录索引
- `backend/rust/structure.md`：模块边界与 Trait 抽象
- `backend/rust/style.md`：`rustfmt`、`clippy` 与生产代码禁 `.unwrap()`
- `backend/rust/error-handling.md`：`thiserror` 领域错误 vs `anyhow` 入口边界
- `backend/rust/concurrency.md`：`tokio` 禁阻塞、`MutexGuard` 禁跨 `.await` 与优雅取消
- `backend/rust/security.md`：`unsafe` 隔离、`cargo audit` 与边界校验
- `backend/rust/transaction.md`：SQLx / SeaORM 显式事务传递
- `backend/rust/testing.md`：`cargo test` / `rustc --test` 单元测试
- `backend/rust/axum/README.md`：Axum 框架差异规范
- `backend/rust/test/`：零外部 Crate 可运行 Rust 参考切片（`rustc --test`）
