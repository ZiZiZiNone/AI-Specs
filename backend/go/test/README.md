# Go 最小可运行参考切片（v2.0）

路径基准：本文所有裸路径相对规范库根 `<SPEC_ROOT>` 解析。见 `<SPEC_ROOT>/README.md`「路径基准」。

零第三方依赖的标准库 Go 工程，演示 `BE-101` 至 `BE-107` 的完整落地：
- 薄入口 `api/`（带 `json` tag）与 `internal/controller/`（不碰底层 `model.OrderFilter` 透传）
- `internal/logic/` 承载业务规则、分页上限截断（`> 100` 截断为 `100`）、全字段载荷哈希幂等校验、`%w` 错误包装与 `Logger` 注入
- `internal/dao/` 内存 Fake 演示复合幂等键 `(user_id, idempotency_key)` + TTL 过期、`defer` panic 回滚守卫、嵌套事务拦截、`ctx.Err()` 检查、白名单排序与数值序分页

## 运行验证命令

```bash
cd backend/go/test
gofmt -l .
go vet ./...
go test -race -v ./...
```
