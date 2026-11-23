# TypeScript 后端事务边界规范（BE-103）

路径基准：本文所有裸路径相对规范库根 `<SPEC_ROOT>` 解析。见 `<SPEC_ROOT>/README.md`「路径基准」。

## 规则
- 通过注入的 `TransactionManager.run(async (tx) => ...)` 在 Service 层统一编排事务，严禁事务内发起同步外部 HTTP 请求，拦截非法嵌套事务。

## 检查清单
- [ ] 通过 `tsc --noEmit` 与自动化单元测试
- [ ] 严格遵守 `BE-101` 至 `BE-108` 与 `COM-013` 至 `COM-018`
