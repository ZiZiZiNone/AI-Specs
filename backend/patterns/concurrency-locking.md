# 并发数据安全与锁模式（BE-107，Go / PHP 共用）

路径基准：本文所有裸路径相对规范库根 `<SPEC_ROOT>` 解析。见 `<SPEC_ROOT>/README.md`「路径基准」。

**重要纠正**：并发写竞争并非 Go 独有——PHP-FPM 多进程并发处理同一用户的双击/重试请求，或 Laravel Octane/Swoole 协程并发，同样会引发超卖、丢失更新与死锁。本模式同时约束 Go 与 PHP。

## 选型决策

| 场景 | 推荐机制 | 说明 |
|---|---|---|
| 库存扣减、余额扣减、计数器 | **条件原子更新** | `UPDATE stock SET qty = qty - ? WHERE sku_id = ? AND qty >= ?`，检查 `affected_rows == 1` |
| 读多写少、低冲突状态更新 | **乐观锁（CAS）** | 表加 `version` 列：`UPDATE ... SET status = ?, version = version + 1 WHERE id = ? AND version = ?`；影响 0 行报 `409 Conflict` |
| 写冲突激烈、多表强一致 | **悲观行锁** | 事务内 `SELECT ... FROM ... WHERE id = ? FOR UPDATE`；多行加锁**必须按主键升序排序**防止死锁 |
| 跨服务/跨存储互斥（如防重复调第三方支付） | **分布式锁 + Fencing Token** | 锁必须带唯一 owner 标识、合理 TTL、Lua 原子释放（校验 owner 后删）；写入存储时校验单调递增 Fencing Token |

## 死锁与锁超时防护
- 严禁在持有数据库行锁或分布式锁期间发起慢外部 HTTP/RPC 调用。
- 事务内锁定多条记录时，强制按 `id ASC` 统一加锁顺序。
- 数据库会话须配置合理 `lock_wait_timeout`（如 3–5 秒），避免慢锁拖垮整个连接池。

## 检查清单

- [ ] 无“先 `SELECT` 读出余额/库存 → 应用层判断 → 再 `UPDATE` 写回”的无锁丢失更新代码
- [ ] 多行 `FOR UPDATE` 已按固定键顺序加锁防死锁
- [ ] 分布式锁具备 owner 校验释放与超时机制，且锁内无长耗时外部调用
