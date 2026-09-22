# Go 项目结构与分层

路径基准：本文所有裸路径相对规范库根 `<SPEC_ROOT>` 解析，首段为 `common/`、`frontend/` 或 `backend/`。见 `<SPEC_ROOT>/README.md`「路径基准」。

分层唯一来源见 `backend/README.md`「分层原则（PHP / Go 共用）」。反转发层依据见 `common/principles.md`「单向依赖原则」：不制造纯转发层。

## 规则

- 目录采用业务项目相对路径（非规范库路径）：`api/`（DTO）、`internal/controller/`、`internal/service/`（接口）、`internal/logic/`（实现）、`internal/dao/`、`internal/model/`。分层改动以 `backend/README.md`「分层原则（PHP / Go 共用）」为准，`api/` 与 `model/` 仅为 DTO 与模型落点。
- controller 只做参数绑定、调 service、写响应，无业务分支。
- service 定义接口，logic 实现接口并通过构造函数注入 dao 接口。
- logic 签名只用结构体、基础类型、`context.Context`，禁收 HTTP 对象。
- dao 封装全部 SQL，logic 不直接操作数据库连接，不拼 SQL 字符串。
- 跨模块调用走 service 接口，不直调对方 logic 或 dao。
- 无业务规则的中间层直接删除，不保留转发包。

## 检查清单

- [ ] controller 无业务判断与数据转换
- [ ] service 为接口且由 logic 唯一实现
- [ ] logic 不引用 HTTP 类型与数据库全局对象
- [ ] dao 之外无 SQL 字符串
- [ ] 依赖方向无反向与循环
- [ ] 无纯转发包
