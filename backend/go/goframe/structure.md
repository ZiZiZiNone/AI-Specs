# GoFrame v2.10 目录与分层差异规范

路径基准：本文所有裸路径相对规范库根 `<SPEC_ROOT>` 解析。见 `<SPEC_ROOT>/README.md`「路径基准」。

本文件仅记录 GoFrame v2.10 相对 `backend/go/structure.md` 的框架专属约定与陷阱规避，不重复通用原则。

## GoFrame 专属约束

1. **解决 `service.RegisterXxx()` 全局单例冲突（关键）**：
   - GoFrame 官方推荐通过 `service.RegisterOrder(s)` 暴露全局访问点，但这会与 `BE-102`「逻辑脱离宿主可测」冲突。
   - **强制折中方案**：`internal/logic/<domain>` 必须提供显式构造函数 `NewOrder(repo dao.OrderRepo, tx dao.TxManager, log Logger) *Order` 供单元测试直接注入 Fake；`service.RegisterOrder(...)` 仅作为 `cmd/server` 启动装配层的薄注册入口，**严禁在 `logic` 内部直接调用 `service.Other()` 或 `g.DB()` 全局函数**。
2. **隔离 `gf gen dao` 自动生成代码**：
   - `internal/dao/internal/` 与 `internal/model/entity/`、`internal/model/do/` 归工具自动生成，**禁止手改**；手写查询方法与仓储接口实现放在 `internal/dao/<domain>.go`。
3. **API 契约与校验 tag**：
   - `api/<domain>/v1/` 中结构体使用 `g.Meta` 声明路由/方法，字段同时声明 `json:"..."` 与 `v:"required|..."` 格式校验标签；`v` 标签仅做格式校验，业务存在性与细粒度鉴权归 `internal/logic/`（`BE-105`）。
4. **事务闭包**：
   - 在 `internal/logic/` 通过注入的事务封装调用 `g.DB().Transaction(ctx, func(ctx context.Context, tx gdb.TX) error { ... })`，DAO 方法从 `ctx` 透明获取事务连接，严禁 Controller 层开启 `Transaction`。

## 检查清单

- [ ] `internal/logic` 支持纯构造注入单测，不直接调用 `g.DB()` 或 `service.Xxx()` 全局单例
- [ ] `gf gen dao` 生成目录未被手改
- [ ] `api/` DTO 具备 `json` 与基础 `v` 校验标签
