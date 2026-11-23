# Go 日志规范（COM-017 / BE-106）

路径基准：本文所有裸路径相对规范库根 `<SPEC_ROOT>` 解析。见 `<SPEC_ROOT>/README.md`「路径基准」。

## 规则与正反示例

1. **结构化 JSON 日志 + 上下文透传**：使用 `log/slog`（或抽象 `Logger` 接口）输出结构化键值，自动挂载 `requestId`/`traceId` 并在响应头回写 `X-Request-Id`。
2. **严禁明文记录凭证与 PII**：敏感结构体实现 `slog.LogValuer` 脱敏输出；4xx 业务拒绝记 `Warn/Info`，仅 5xx 故障记 `Error`。

```go
// ✅ 正例：通过 slog.LogValuer 自动脱敏，防止误打明文
type SecretToken string
func (SecretToken) LogValue() slog.Value { return slog.StringValue("[REDACTED]") }

// ❌ 反例：fmt.Printf 裸打非结构化日志并泄露明文 token
fmt.Printf("login user=%s token=%s
", user, token)
```

## 检查清单

- [ ] 无 `fmt.Print*` / 全局裸 `log.Printf` 混入业务代码
- [ ] 敏感字段具备脱敏处理，4xx 未误记 `Error`
