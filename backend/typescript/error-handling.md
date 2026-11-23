# TypeScript 后端错误处理规范

路径基准：本文所有裸路径相对规范库根 `<SPEC_ROOT>` 解析。见 `<SPEC_ROOT>/README.md`「路径基准」。

## 规则
- 统一继承 `DomainError`（携带 `errorCode` 与 `httpStatus`），在全局错误处理中间件归一为 `common/rules/api-contract.md` 信封（`data: null`）；严禁未处理的 `unhandledRejection`。

## 检查清单
- [ ] 通过 `tsc --noEmit` 与自动化单元测试
- [ ] 严格遵守 `BE-101` 至 `BE-108` 与 `COM-013` 至 `COM-018`
