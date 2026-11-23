# Rust 目录结构与 Trait 依赖倒置（BE-101 / BE-102）

路径基准：本文所有裸路径相对规范库根 `<SPEC_ROOT>` 解析。见 `<SPEC_ROOT>/README.md`「路径基准」。

## 规则
- 使用 `api` / `service` / `repo` / `domain` 模块清晰分层；Service 通过泛型或 `Arc<dyn OrderRepo + Send + Sync>` 注入仓储 Trait，杜绝全局 `OnceLock` 隐藏可变状态。

## 检查清单
- [ ] 生产路径零 `.unwrap()` / `.expect()`，零 `unsafe`
- [ ] 严格遵守 `BE-101` 至 `BE-108` 与 `COM-013` 至 `COM-018`
