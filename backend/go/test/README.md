# Go 样例工程

路径基准：本文路径相对规范库根 `<SPEC_ROOT>` 解析。见 `<SPEC_ROOT>/README.md`「路径基准」。

本目录为 `backend/go/` 最小可运行切片：创建订单（幂等键 + 事务边界），只用标准库，零第三方依赖。

## 运行

```bash
cd backend/go/test
go build ./...
go vet ./...
go test ./... -race -count=1
```

## 证明内容

- 控制器只做绑定、调用、响应（`internal/controller/order.go`）。
- 服务经 `Transact` 闭包显式定界，去重记录与业务行同事务落子（`internal/logic/order.go`）。
- 唯一冲突后在失败事务之外的新读路径回读首次结果（同上）。
- 空幂等键直接拒绝，不旁路去重（`internal/model/order.go`「Validate」+ 并发与空键测试）。
- 测试：串行重放、失败回滚、空键拒绝、8 协程并发重放（`go test -race` 通过）。

内存事务为串行化演示实现，真实隔离级别与持久化语义以各项目数据库实测为准。
