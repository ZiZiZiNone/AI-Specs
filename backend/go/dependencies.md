# Go 依赖与模块管理规范

路径基准：本文所有裸路径相对规范库根 `<SPEC_ROOT>` 解析。见 `<SPEC_ROOT>/README.md`「路径基准」。

## 规则与正反示例

1. **标准库优先，接口定义在消费方**：能用标准库解决不引入重型三方包；接口声明在调用方（`logic`/`service`）而非实现方（`dao`），遵循最小接口原则。
2. **供应链与版本锁定**：`go.mod` 与 `go.sum` 同步提交，变更后执行 `go mod tidy` 与 `govulncheck ./...`（对齐 `COM-014`）。

```go
// ✅ 正例：消费方定义最小接口，按需注入 Fake
type OrderWriter interface {
    Insert(ctx context.Context, o *model.Order) error
}

// ❌ 反例：逻辑层直接依赖具体驱动 *sql.DB 或全局 gorm.DB
```

## 检查清单

- [ ] 新增三方包已核验维护状态与 `govulncheck` 零高危漏洞
- [ ] 接口定义精简且归属消费方，无循环包依赖
