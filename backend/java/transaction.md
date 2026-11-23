# Java / Spring 事务边界规范（BE-103）

路径基准：本文所有裸路径相对规范库根 `<SPEC_ROOT>` 解析。见 `<SPEC_ROOT>/README.md`「路径基准」。

## 规则
- 声明 `@Transactional(rollbackFor = Exception.class)`（避免受检异常默认不回滚）；禁止同类 `this.method()` 自调用绕过 AOP 代理；事务后发 MQ/清缓存必须走 `TransactionSynchronizationManager.registerSynchronization(afterCommit)` 或 Outbox。

## 检查清单
- [ ] 严格遵守 `BE-101` 至 `BE-108` 与 `COM-013` 至 `COM-018`
