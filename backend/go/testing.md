# Go 测试规范

路径基准：本文所有裸路径相对规范库根 `<SPEC_ROOT>` 解析。见 `<SPEC_ROOT>/README.md`「路径基准」。

通用原则见 `common/rules/test.md`「规则」，无法执行时按 `common/protocol/final-gate.md`「无法验证时的处理」声明。

## 规则与正反示例

1. **命名与表驱动测试**：函数名严格遵守 `Test<Unit>_<Scenario>_<Expected>`；多边界场景使用表驱动（Table-Driven）+ `t.Run(tc.name, ...)`。
2. **时间与并发确定性**：注入 `nowFn func() time.Time` 代替直接调 `time.Now()`；并发包必跑 `go test -race -v ./...`（参考 `backend/go/test/internal/logic/order_test.go`）。

```go
// ✅ 正例：行为命名 + 注入固定时钟 + 竞态检测
func TestOrderCreate_IdempotencyExpiresAfterTTL(t *testing.T) {
    current := time.Date(2026, 11, 23, 8, 0, 0, 0, time.UTC)
    svc := logic.NewOrderLogic(store, store, nil, func() time.Time { return current })
    ...
}
```

## 检查清单

- [ ] 测试命令已实跑 `go test -race ./...` 且全绿
- [ ] 覆盖正常路径、边界截断、异常回滚与并发重放
