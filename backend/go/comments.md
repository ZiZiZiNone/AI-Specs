# Go 注释与 GoDoc 规范

路径基准：本文所有裸路径相对规范库根 `<SPEC_ROOT>` 解析。见 `<SPEC_ROOT>/README.md`「路径基准」。

通用原则见 `common/rules/comment.md`。

## 规则与正反示例

1. **导出符号必写 GoDoc**：所有导出的 package、type、func、const 注释以标识符名开头，说明契约、并发安全性与错误语义。
2. **行内注释只写“为什么”**：解释业务不变量、锁顺序或协议怪癖，不复述代码字面逻辑；`TODO` 须带 `(owner/#issue)`。

```go
// ✅ 正例：以标识符开头，说清并发安全性与错误契约
// Create 创建订单并保证同用户同幂等键可安全重放；载荷不一致时返回 model.ErrConflict。
func (l *OrderLogic) Create(ctx context.Context, req api.CreateOrderRequest) (api.OrderResponse, error)

// ❌ 反例：复述代码 + 无主 TODO
// 创建订单
// TODO: 以后优化
func (l *OrderLogic) Create(ctx context.Context, req api.CreateOrderRequest) (api.OrderResponse, error)
```

## 检查清单

- [ ] 导出类型与函数均具备标准 GoDoc 契约注释
- [ ] 无复述代码、无死代码注释、无无主 `TODO`
