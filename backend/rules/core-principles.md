# 后端核心原则（BE-101 至 BE-108）

路径基准：本文所有裸路径相对规范库根 `<SPEC_ROOT>` 解析。见 `<SPEC_ROOT>/README.md`「路径基准」。

本文件是后端条款级编号（`BE-101` 至 `BE-108`）的唯一定义源，已纳入 `COM-011` 编号定义源与 `scripts/check-citations.py` 校验。每条均标注 `[MUST]`（违反即重做）。

## BE-101 薄入口与单向依赖 [MUST]
- 入口层（Controller / HTTP Handler / RPC Handler / Consumer）仅做四件事：解析与基础格式校验、读取已认证身份上下文、调用 Service/Logic、映射响应信封与状态码。
- 严禁在入口层编写业务状态机、直接开启跨仓储事务或直接操作数据库/DAO。
- 依赖方向严格单向：`Controller/API → Service/Logic → Repository/DAO 接口 ← 具体存储实现`；DTO 不得跨层反向污染领域模型。

## BE-102 逻辑脱离宿主可测 [MUST]
- 核心业务逻辑与领域服务必须通过构造函数注入抽象接口（仓储接口、事务管理器接口、外部客户端接口、时钟/日志接口），严禁隐式访问全局 DB、全局配置单例或 HTTP 请求对象。
- 任意核心 Service 必须能在无 Web 服务器、无真实数据库的纯单元测试中通过内存 Fake 完成测试。

## BE-103 事务边界唯一且禁含外部调用 [MUST]
- 事务只能由 Service/Logic 编排层按完整业务用例统一开启与提交/回滚；Controller 不开事务，DAO/Repository 不私自开启跨界事务。
- 事务内严禁发起同步外部 HTTP/RPC 调用、发送不可回滚的消息或执行长时间慢计算；需要事后发消息/发事件时，必须采用事务提交后钩子（如 `DB::afterCommit`）或本地消息表（见 `backend/patterns/outbox-async.md`）。
- 事务必须有 `defer` / `try-finally` 级别的异常与 panic 回滚守卫，并拦截非法嵌套事务覆盖风险。

## BE-104 幂等键作用域隔离与防重放 [MUST]
- 非幂等写接口必须校验 `Idempotency-Key`，且唯一键必须绑定作用域 `(tenant_id/user_id, method/action, idempotency_key)`，**严禁全局唯一键**导致跨用户阻塞或信息探测。
- 同键同载荷返回历史结果快照；同键异载荷（通过载荷哈希校验）返回 `409 Conflict`；在途并发冲突返回 `409 Conflict`；幂等记录须带 TTL 过期清理机制。

## BE-105 认证与鉴权三层清晰分工 [MUST]
为彻底消除入口与服务层鉴权冲突，全后端统一执行三层权责矩阵（详述见 `backend/patterns/authz-security.md`）：
1. **认证（Authentication）**：在入口中间件统一执行（验 Token/Session、提取 `Actor{UserID, TenantID, Roles}` 写入上下文）。
2. **粗粒度功能权限（RBAC）**：在路由中间件或入口守卫拦截（如“仅管理员可访问 `/admin/*`”）。
3. **细粒度资源归属与业务授权（ABAC / 防 IDOR）**：**必须在 Service 层结合资源实体状态与归属关系强制执行**（如“仅订单创建者或同租户管理员可取消未发货订单”），禁止只靠入口层放行。

## BE-106 参数化查询、白名单排序与敏感脱敏 [MUST]
- 所有 SQL 与 NoSQL 查询必须使用参数化绑定；动态 `ORDER BY` / `GROUP BY` / 过滤字段名必须经过服务端显式白名单映射，拒绝未知字段。
- 日志、错误消息、SQL 慢日志与响应体严禁明文输出密码、Token、`Authorization`、私钥与完整 PII（见 `common/rules/observability.md`）。
- 密码必须使用 Argon2id/bcrypt 哈希，API Token/Refresh Token 落库须存单向哈希。

## BE-107 显式超时、上下文传递与并发数据安全 [MUST]
- 所有外部 I/O（DB、Redis、HTTP、RPC、MQ）必须传递上下文（Go `context.Context` / PHP 请求取消与超时配置）并设置显式超时，严禁无超时阻塞。
- **并发数据安全适用于 Go 与 PHP（含 PHP-FPM 多进程与 Swoole/Octane）**：凡涉及库存扣减、余额变更、状态跃迁、并发写同一资源，必须使用数据库行锁（`SELECT ... FOR UPDATE`）、条件原子更新、乐观锁版本号或带 Fencing Token 的分布式锁（见 `backend/patterns/concurrency-locking.md`），禁止“先查后改无锁覆盖”。

## BE-108 可回滚迁移与在线 DDL 防护 [MUST]
- 数据库 Schema 变更必须通过版本化迁移脚本管理，并按 `common/rules/compatibility.md` 与 `backend/patterns/migration-online-ddl.md` 采用 Expand-Contract 策略；大表加索引/改字段须评估锁表（Metadata Lock）风险并使用在线 DDL 工具或低峰分批执行。
