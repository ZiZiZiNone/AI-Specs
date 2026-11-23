# Go 代码风格与复杂度规范

路径基准：本文所有裸路径相对规范库根 `<SPEC_ROOT>` 解析。见 `<SPEC_ROOT>/README.md`「路径基准」。

## 规则与量化阈值

1. **格式与静态检查**：提交前必须 `gofmt -l .` 零输出、`go vet ./...` 零警告、推荐 `golangci-lint run` 通过。
2. **函数规模红线**：单个非测试函数建议 **≤ 50 行**、圈复杂度 **≤ 10**（`gocyclo`）、参数 **≤ 4 个**（超出封装为选项或输入结构体）。
3. **卫语句早返回（Early Return）**：先处理错误与边界条件并 `return`，保持主干逻辑左对齐，避免超过 3 层嵌套 `if`。

```go
// ✅ 正例：早返回，无多余 else
if err != nil {
    return fmt.Errorf("insert order: %w", err)
}
return toOrderResponse(ord), nil

// ❌ 反例：深层嵌套 else
if err == nil {
    if ord.ID != "" { ... }
} else { return err }
```

## 检查清单

- [ ] `gofmt -l .` 与 `go vet ./...` 全部通过
- [ ] 无超 50 行函数、无超 4 参数裸签名、无深层嵌套 `else`
