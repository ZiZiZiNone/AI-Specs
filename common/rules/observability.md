# 可观测性与日志脱敏规范（COM-017 细则）

路径基准：本文所有裸路径相对规范库根 `<SPEC_ROOT>` 解析。见 `<SPEC_ROOT>/README.md`「路径基准」。

后端 OpenTelemetry/Metrics/健康检查落地见 `backend/patterns/observability.md`；语言细则见 `backend/go/logging.md`、`backend/php/logging.md`。

## 1. 结构化日志契约
服务端日志一律输出结构化 JSON（开发本地可格式化渲染），每条日志必须包含基础上下文字段：
- `timestamp`（ISO-8601 UTC）
- `level`（`DEBUG` / `INFO` / `WARN` / `ERROR`）
- `service` / `env`
- `requestId` / `traceId`（全链路透传，并回写 HTTP 响应头 `X-Request-Id`）
- `event`（稳定可检索的事件名，如 `order.create.failed`）与 `errorCode`（失败时）

## 2. 日志级别语义
- `DEBUG`：开发排障细节，生产环境默认关闭。
- `INFO`：关键业务状态变迁与生命周期事件（启动、停机、核心写操作完成），禁止在高频读热路径打全量载荷日志。
- `WARN`：可自愈异常、业务预期内拒绝（如幂等冲突、限流触发、降级生效）。
- `ERROR`：**仅用于需要人工关注或触发告警的真实故障**（5xx、依赖不可用、数据不一致）；禁止把普通参数校验错误（4xx）记为 `ERROR` 制造告警风暴。

## 3. PII 与凭证强制脱敏（红线）
以下字段**严禁明文出现在任何日志、错误消息、Metrics 标签或前端埋点中**：
- 认证凭证：`Authorization` Header、`Cookie`、`password`、`token`、`access_token`、`refresh_token`、`secret`、`private_key`
- 个人敏感信息（PII）：身份证号、银行卡号、CVV、完整手机号（最多保留前 3 后 4，如 `138****5678`）、完整邮箱（按需掩码）、精确家庭住址

## 4. 指标与追踪约束
- Metrics 标签严禁使用高基数字段（如 `userId`、`orderId`、`requestId`、原始 URL 路径），防止时序数据库基数爆炸。
- 关键异步任务与跨服务调用必须透传 `traceparent` / `X-Request-Id`，保证单次请求端到端可串联。

## 检查清单

- [ ] 服务端日志为结构化格式且全链路透传 `requestId` / `traceId`
- [ ] 4xx 客户端校验错误未误记为 `ERROR`
- [ ] 日志序列化器或脱敏中间件已过滤密码、Token、Authorization 与完整 PII
- [ ] Metrics 标签无 `userId`/`orderId` 等高基数字段
