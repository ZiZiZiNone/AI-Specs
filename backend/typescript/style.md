# TypeScript 后端风格与强类型规范

路径基准：本文所有裸路径相对规范库根 `<SPEC_ROOT>` 解析。见 `<SPEC_ROOT>/README.md`「路径基准」。

## 规则
- 开启 `strict: true`、`noUncheckedIndexedAccess: true`；严禁 `any` 与裸类型断言；所有外部 HTTP/MQ 入参必须经 Zod/Valibot/TypeBox 运行时解析；单函数 ≤ 50 行、参数 ≤ 4 个。

## 检查清单
- [ ] 通过 `tsc --noEmit` 与自动化单元测试
- [ ] 严格遵守 `BE-101` 至 `BE-108` 与 `COM-013` 至 `COM-018`
