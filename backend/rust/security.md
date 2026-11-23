# Rust 安全规范（BE-105 / BE-106 / COM-013）

路径基准：本文所有裸路径相对规范库根 `<SPEC_ROOT>` 解析。见 `<SPEC_ROOT>/README.md`「路径基准」。

## 规则
- 业务代码默认 `#![forbid(unsafe_code)]`，确需 `unsafe` 须隔离在独立小模块并写明 `// SAFETY:` 不变量；CI 运行 `cargo audit` 与 `cargo deny`。

## 检查清单
- [ ] 生产路径零 `.unwrap()` / `.expect()`，零 `unsafe`
- [ ] 严格遵守 `BE-101` 至 `BE-108` 与 `COM-013` 至 `COM-018`
