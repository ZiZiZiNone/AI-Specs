# Java 并发与虚拟线程规范（BE-107）

路径基准：本文所有裸路径相对规范库根 `<SPEC_ROOT>` 解析。见 `<SPEC_ROOT>/README.md`「路径基准」。

## 规则
- 禁止使用无界队列 `Executors.newFixedThreadPool`；Java 21 虚拟线程中避免在 `synchronized` 块内执行网络/DB I/O（改用 `ReentrantLock` 防 Carrier Thread Pinning）；写竞争遵循 `backend/patterns/concurrency-locking.md`。

## 检查清单
- [ ] 严格遵守 `BE-101` 至 `BE-108` 与 `COM-013` 至 `COM-018`
