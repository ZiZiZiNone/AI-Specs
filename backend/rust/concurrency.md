# Rust / Tokio 并发规范（BE-107）

路径基准：本文所有裸路径相对规范库根 `<SPEC_ROOT>` 解析。见 `<SPEC_ROOT>/README.md`「路径基准」。

## 规则
- 严禁在异步任务中调用阻塞 I/O 或 CPU 密集计算（改用 `tokio::task::spawn_blocking`）；**严禁持有 `std::sync::MutexGuard` 跨越 `.await` 点**；使用 `CancellationToken` 实现优雅停机。

## 检查清单
- [ ] 生产路径零 `.unwrap()` / `.expect()`，零 `unsafe`
- [ ] 严格遵守 `BE-101` 至 `BE-108` 与 `COM-013` 至 `COM-018`
