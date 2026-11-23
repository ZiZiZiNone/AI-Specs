# 后端可观测性与优雅停机模式（COM-017）

路径基准：本文所有裸路径相对规范库根 `<SPEC_ROOT>` 解析。见 `<SPEC_ROOT>/README.md`「路径基准」。

## 1. 分布式追踪与日志关联
- 入口中间件读取或生成 W3C `traceparent` 与 `X-Request-Id`，注入 `context.Context` / 请求上下文，并在响应头原样回写 `X-Request-Id`。
- 所有结构化日志自动挂载 `traceId`、`spanId`、`requestId`、`service`、`env`，脱敏规则严格执行 `common/rules/observability.md`「3. PII 与凭证强制脱敏（红线）」。

## 2. RED / USE 指标规范
- 每个 HTTP/RPC 服务必须暴露 RED 指标：请求速率（Rate）、错误数（Errors，按 4xx/5xx 区分）、延迟直方图（Duration，支持 P50/P95/P99）。
- 指标标签仅允许低基数枚举（`method`、`route_template`、`status_class`），**严禁把原始 URL、userId、orderId 作为标签**。

## 3. 健康检查与优雅停机（Graceful Shutdown）
- **存活探针（`/healthz`）**：仅检查进程是否存活且未死锁，**不得**探测外部 DB/Redis（避免依赖抖动引发全集群雪崩重启）。
- **就绪探针（`/readyz`）**：检查关键本地初始化完成且可承接流量；收到 `SIGTERM` 后第一时间将 `/readyz` 置为 `503` 摘除负载均衡流量。
- **优雅停机流程**：监听 `SIGINT`/`SIGTERM` → 停止接收新请求 → 等待在途 HTTP/RPC 请求与后台消费任务在宽限期内（如 25s）完成 → 按序关闭 MQ 消费者、数据库连接池与日志缓冲刷盘 → 退出进程。

## 检查清单

- [ ] 入口中间件统一透传 `traceparent` 与 `X-Request-Id`
- [ ] `/healthz` 与 `/readyz` 语义分离，无级联重启隐患
- [ ] 服务实现 `SIGTERM` 优雅停机，排空在途请求与后台任务并刷盘日志
