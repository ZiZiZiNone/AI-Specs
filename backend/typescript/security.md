# TypeScript 后端安全规范（BE-105 / BE-106 / COM-013）

路径基准：本文所有裸路径相对规范库根 `<SPEC_ROOT>` 解析。见 `<SPEC_ROOT>/README.md`「路径基准」。

## 规则
- 防原型污染（拒绝 `__proto__`/`constructor`/`prototype` 键，使用 `Object.create(null)` 或 `Map`）；防 ReDoS 正则回溯；CI 运行 `npm audit --audit-level=high`；禁止 `eval`/`new Function`。

## 检查清单
- [ ] 通过 `tsc --noEmit` 与自动化单元测试
- [ ] 严格遵守 `BE-101` 至 `BE-108` 与 `COM-013` 至 `COM-018`
