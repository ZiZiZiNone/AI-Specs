# backend/patterns

路径基准：本文所有裸路径相对规范库根 `<SPEC_ROOT>` 解析。见 `<SPEC_ROOT>/README.md`「路径基准」。

后端标准工程模式目录，按场景按需取用：

### 基础读写模式
- `backend/patterns/list-query.md`：分页、过滤与白名单排序列表查询
- `backend/patterns/write-idempotent.md`：作用域隔离的幂等写操作
- `backend/patterns/update-transactional.md`：多表/多行事务更新

### 生产级架构与稳定性模式
- `backend/patterns/authz-security.md`：认证/RBAC/ABAC 三层鉴权、防 IDOR/BOLA、SSRF 防护与审计日志
- `backend/patterns/concurrency-locking.md`：跨 Go/PHP 并发写安全（悲观锁、乐观锁、原子更新、分布式锁）
- `backend/patterns/caching.md`：Cache-Aside 一致性、防击穿/穿透/雪崩与热 Key 治理
- `backend/patterns/resilience.md`：超时传递（Deadline）、退避重试、熔断降级与多维限流
- `backend/patterns/migration-online-ddl.md`：在线 DDL 锁表防护、Expand-Contract、分批回填与主从延迟
- `backend/patterns/observability.md`：OpenTelemetry 追踪、RED 指标、健康检查与优雅停机
- `backend/patterns/outbox-async.md`：Transactional Outbox、消费幂等、死信队列与 Webhook 验签防重放
