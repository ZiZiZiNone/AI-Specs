# GoFrame v2.10 测试差异规范

路径基准：本文所有裸路径相对规范库根 `<SPEC_ROOT>` 解析。见 `<SPEC_ROOT>/README.md`「路径基准」。

## GoFrame 专属约束

1. **单测不启 `g.Server()` 与真实 DB**：`internal/logic` 通过构造函数注入内存 Fake，直接用标准 `testing` + `go test -race ./...` 毫秒级运行（见 `backend/go/test/`）。
2. **接口契约测试**：HTTP 中间件、参数 `v` 标签校验与 `MiddlewareHandlerResponse` 信封映射使用 `httptest.NewRecorder()` 或临时端口 `g.Server` 测试，验证 `code`/`data: null`/`X-Request-Id` 与真实 HTTP 状态码。
3. **无法执行真实集成测试时**：严格按 `common/protocol/final-gate.md`「无法验证时的处理」显式声明未验证项。

## 检查清单

- [ ] 业务逻辑单测脱离 GoFrame 全局单例独立通过 `go test -race ./...`
- [ ] HTTP 契约测试覆盖 400/401/403/404/409/500 响应信封与 `X-Request-Id`
