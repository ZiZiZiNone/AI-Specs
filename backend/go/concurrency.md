# Go 并发规范（BE-107）

路径基准：本文所有裸路径相对规范库根 `<SPEC_ROOT>` 解析。见 `<SPEC_ROOT>/README.md`「路径基准」。

## 核心规则

1. **所有 goroutine 必须有明确退出条件**：启动 goroutine 前必须确定其退出信号（`ctx.Done()` 或关闭 channel），严禁“发后即忘（fire-and-forget）”导致 goroutine 泄漏。
2. **并发编排优先 `errgroup.WithContext`**：多路并发查询/聚合使用 `errgroup`，并通过 `g.SetLimit(n)` 限制最大并发度，防止瞬时扇出打垮下游。
3. **显式超时与上下文传递**：`context.Context` 永远作为函数第一参数（不存入 struct），跨层与跨 I/O 完整透传；进入长耗时操作前检查 `ctx.Err()`。
4. **共享可变状态防护**：共享 Map/缓存必须使用 `sync.RWMutex` / `sync.Mutex` 或 `singleflight.Group` 保护；锁临界区内严禁执行网络或磁盘 I/O。
5. **跨请求数据竞争防护**：进程内锁不能替代数据库并发控制；多实例并发写同一业务记录必须遵循 `backend/patterns/concurrency-locking.md`（行锁/原子更新/乐观锁）。
6. **竞态检测必过**：核心并发包提交前必须通过 `go test -race ./...`。

## 检查清单

- [ ] 每个新启 goroutine 均有可验证的退出路径，无泄漏风险
- [ ] 并发扇出有上限（`SetLimit` / Worker Pool），无无界开协程
- [ ] 所有 I/O 与锁操作不混用，核心测试通过 `go test -race ./...`
