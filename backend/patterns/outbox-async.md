# 异步消息、Transactional Outbox 与 Webhook 模式

路径基准：本文所有裸路径相对规范库根 `<SPEC_ROOT>` 解析。见 `<SPEC_ROOT>/README.md`「路径基准」。

## 1. Transactional Outbox（本地消息表）
需要“数据库状态变更 + 发送异步事件/消息”保持最终一致时，禁止在 DB 事务内直接发 MQ（事务回滚无法撤回消息，且发 MQ 慢会拉长锁持有时间），也禁止先提交 DB 再裸发 MQ（进程崩溃会丢消息）。
标准做法：
1. 在同一业务 DB 事务中，写入业务表 + 写入 `outbox_events` 表（含 `event_id`、`aggregate_id`、`payload`、`status=PENDING`）；
2. 独立的中继进程（Relay Worker）或 CDC（Debezium）轮询/监听 `outbox_events` 投递至 MQ，投递成功后标记 `PUBLISHED`；
3. 定期清理已发布历史记录。

## 2. 消费端幂等与死信队列（DLQ）
- 分布式消息默认按**至少一次（At-Least-Once）**投递设计，消费端必须基于 `event_id` 做去重表或业务状态机前置条件校验，保证重复消费无副作用。
- 消费失败按指数退避有限重试（如 3–5 次），仍失败或属不可恢复毒丸消息（格式错误）须转入**死信队列（DLQ）**并触发告警，严禁无限重试阻塞分区。

## 3. 外部 Webhook 接入安全
- 必须校验签名（HMAC-SHA256，使用**常量时间比较** `hmac.Equal` / `hash_equals` 防时序攻击）。
- 必须校验时间戳窗口（如 ±5 分钟）并记录事件唯一 ID 去重，防止重放攻击；业务处理应快速返回 `200` 并交由异步队列执行。

## 检查清单

- [ ] 跨 DB 与 MQ 的关键事件采用 Transactional Outbox 或事务提交后可靠补偿
- [ ] 消费端支持重复投递幂等，且配置最大重试次数与死信队列（DLQ）
- [ ] Webhook 验签使用常量时间比较，且具备时间戳窗口与事件 ID 防重放
