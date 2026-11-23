# Go 性能与内存规范

路径基准：本文所有裸路径相对规范库根 `<SPEC_ROOT>` 解析。见 `<SPEC_ROOT>/README.md`「路径基准」。

## 规则与正反示例

1. **热路径预分配容量**：已知切片/Map 长度时使用 `make([]T, 0, n)` / `make(map[K]V, n)` 减少扩容拷贝；高频字符串拼接使用 `strings.Builder`。
2. **基准测试驱动**：性能优化提交须附 `go test -bench=. -benchmem` 前后对比数据，禁止无数据微优化。

```go
// ✅ 正例：预分配切片容量
items := make([]api.OrderResponse, 0, len(res.Items))
for _, ord := range res.Items {
    items = append(items, toOrderResponse(ord))
}

// ❌ 反例：热循环内用 += 反复拼接大字符串
var out string
for _, s := range parts { out += s }
```

## 检查清单

- [ ] 已知容量切片已预分配，大字符串拼接使用 `strings.Builder`
- [ ] 性能优化 PR 附带 `go test -bench -benchmem` 基线对比
