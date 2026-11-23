# Rust 错误处理规范

路径基准：本文所有裸路径相对规范库根 `<SPEC_ROOT>` 解析。见 `<SPEC_ROOT>/README.md`「路径基准」。

## 规则
- 库与领域层使用 `thiserror` 定义强类型枚举错误（精确映射 HTTP 状态码与业务码）；`anyhow::Error` 仅允许用于 `main.rs` 或 CLI 顶层入口；响应体屏蔽内部错误细节。

## 检查清单
- [ ] 生产路径零 `.unwrap()` / `.expect()`，零 `unsafe`
- [ ] 严格遵守 `BE-101` 至 `BE-108` 与 `COM-013` 至 `COM-018`
