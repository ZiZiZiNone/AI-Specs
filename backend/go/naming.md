# Go 命名规范

路径基准：本文所有裸路径相对规范库根 `<SPEC_ROOT>` 解析。见 `<SPEC_ROOT>/README.md`「路径基准」。

跨语言语义原则见 `common/rules/naming.md`「跨语言规则」。

## 规则与正反示例

1. **首字母缩写保持大小写一致**：`UserID`、`HTTPClient`、`URLPath`（禁止 `UserId`、`HttpClient`）；包名全小写单词无下划线（`order`、`dao`，禁止 `order_service`）。
2. **DTO 必带 `json` tag**：`api/` 下全部请求/响应结构体显式声明 camelCase `json:"..."` 标签；接口单方法优先 `-er` 后缀（`Reader`、`OrderSaver`）。

```go
// ✅ 正例
type CreateOrderRequest struct {
    UserID         string `json:"userId"`
    UnitPriceCents int64  `json:"unitPriceCents"`
}

// ❌ 反例：缩写大小写不一致且缺 json tag
type CreateOrderReq struct { UserId string; Price float64 }
```

## 检查清单

- [ ] 包名简短全小写无下划线，无 `utils`/`common` 垃圾桶包
- [ ] `api/` DTO 全部携带明确 `json` tag，金额与时间带单位后缀
