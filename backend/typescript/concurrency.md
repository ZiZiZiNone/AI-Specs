# TypeScript 后端并发与事件循环规范（BE-107）

路径基准：本文所有裸路径相对规范库根 `<SPEC_ROOT>` 解析。见 `<SPEC_ROOT>/README.md`「路径基准」。

## 规则
- 禁止在主线程执行同步加密/大 JSON 解析/同步 `fs.*Sync` 阻塞事件循环；并发批处理使用 `p-limit` 控流并传递 `AbortSignal`；多实例写库遵循 `backend/patterns/concurrency-locking.md`。

## 检查清单
- [ ] 通过 `tsc --noEmit` 与自动化单元测试
- [ ] 严格遵守 `BE-101` 至 `BE-108` 与 `COM-013` 至 `COM-018`
