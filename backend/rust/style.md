# Rust 风格与零 Panic 红线

路径基准：本文所有裸路径相对规范库根 `<SPEC_ROOT>` 解析。见 `<SPEC_ROOT>/README.md`「路径基准」。

## 规则
- 提交前必过 `cargo fmt --check` 与 `cargo clippy -- -D warnings`；**生产路径严禁 `.unwrap()` / `.expect()` / 裸数组下标越界**（全部通过 `?` 与 `Result`/`Option` 显式处理）；单函数 ≤ 50 行、参数 ≤ 4 个。

## 检查清单
- [ ] 生产路径零 `.unwrap()` / `.expect()`，零 `unsafe`
- [ ] 严格遵守 `BE-101` 至 `BE-108` 与 `COM-013` 至 `COM-018`
