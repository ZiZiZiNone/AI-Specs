# GoFrame v2.10 日志差异规范

路径基准：本文所有裸路径相对规范库根 `<SPEC_ROOT>` 解析。见 `<SPEC_ROOT>/README.md`「路径基准」。

## GoFrame 专属约束

1. **必须使用带上下文链式调用 `g.Log().Ctx(ctx)`**：利用 GoFrame 内置 `gtrace` 自动注入 `TraceId` / `SpanId`，并配合入口中间件在 `ctx` 与响应头双向透传 `X-Request-Id`。
2. **自定义脱敏 Handler**：为 `glog.Logger` 注册统一 `SetHandlers(...)` 脱敏处理器，输出 JSON 格式并拦截 `password`/`token`/`authorization`/`phone` 等敏感字段明文落盘（`COM-017`）。
3. **逻辑层解耦日志库**：核心 `internal/logic` 优先依赖最小 `Logger` 接口（见 `backend/go/test/internal/dao/dao.go`），在装配层用 GoFrame `glog` 适配器实现。

## 检查清单

- [ ] 全部服务端日志输出 JSON 且携带 `TraceId` 与 `requestId`
- [ ] 已注册敏感字段脱敏 Handler，4xx 未误记 `Error`
