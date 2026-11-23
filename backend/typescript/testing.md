# TypeScript 后端测试规范

路径基准：本文所有裸路径相对规范库根 `<SPEC_ROOT>` 解析。见 `<SPEC_ROOT>/README.md`「路径基准」。

## 规则
- 遵循 `common/rules/test.md`「规则」，通过注入时钟与内存 Fake 仓储测试 Service，使用 `tsc --noEmit` + `node --test`（或 Vitest）验证。

## 检查清单
- [ ] 通过 `tsc --noEmit` 与自动化单元测试
- [ ] 严格遵守 `BE-101` 至 `BE-108` 与 `COM-013` 至 `COM-018`
