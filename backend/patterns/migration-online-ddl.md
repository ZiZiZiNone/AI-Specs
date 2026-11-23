# 数据库迁移与在线 DDL 模式（BE-108 / COM-016）

路径基准：本文所有裸路径相对规范库根 `<SPEC_ROOT>` 解析。见 `<SPEC_ROOT>/README.md`「路径基准」。

## 1. 大表在线 DDL 锁表防护
- 变更前必须评估目标表数据量与 QPS；百万行以上或核心高频表严禁直接执行会触发表级拷贝/长 Metadata Lock（MDL）的原生 `ALTER TABLE`。
- MySQL 优先确认 `ALGORITHM=INPLACE, LOCK=NONE` 兼容性，大表改结构使用 `gh-ost` / `pt-online-schema-change`；PostgreSQL 建索引必须用 `CREATE INDEX CONCURRENTLY`，新增带约束列先 `NOT VALID` 再 `VALIDATE CONSTRAINT`。

## 2. Expand-Contract 渐进演进
- **新增列**：优先设为 `NULL` 或轻量默认值，避免全表重写锁表；先发新 Schema，再发读写新列的应用代码。
- **改名/改类型/删列**：严格按 `common/rules/compatibility.md` 四步执行（加新列 + 双写 → 分批限速回填 → 切读新列 → 确认无旧实例后删旧列）。
- **分批回填**：单批 500–2000 行、按主键范围游标推进、批间休眠（如 50–200ms）并监控主从复制延迟（Replication Lag），禁止单条大事务 `UPDATE` 锁全表。

## 3. 读写分离与主从延迟治理
- **写后即读（Read-Your-Own-Writes）** 与 **幂等冲突回读** 必须强制路由到**主库**，严禁走从库导致读不到刚写入的数据或误判幂等冲突。

## 检查清单

- [ ] Schema 变更已纳入版本化迁移脚本并附回滚方案
- [ ] 大表 DDL 已评估锁表风险并使用在线方式，PG 索引带 `CONCURRENTLY`
- [ ] 历史数据回填采用分批限速游标，无全表长事务更新
- [ ] 写后即读与幂等冲突回读明确强制走主库
