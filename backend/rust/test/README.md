# Rust 最小可运行参考切片（v3.0）

路径基准：本文所有裸路径相对规范库根 `<SPEC_ROOT>` 解析。见 `<SPEC_ROOT>/README.md`「路径基准」。

零外部 Crate 依赖（纯 `std` + `#![forbid(unsafe_code)]`），演示 `BE-101` 至 `BE-107`。

## 运行验证命令
```bash
rustc --test backend/rust/test/src/lib.rs -o /tmp/rust_order_test && /tmp/rust_order_test
```
