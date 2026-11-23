# TypeScript 后端目录结构（BE-101 / BE-102）

路径基准：本文所有裸路径相对规范库根 `<SPEC_ROOT>` 解析。见 `<SPEC_ROOT>/README.md`「路径基准」。

## 规则
- 采用 `src/{controller,service,repository,model,middleware}` 单向分层；统一使用 ESM（`"type": "module"`），依赖通过构造函数注入，不在模块顶层连接数据库。

## 检查清单
- [ ] 通过 `tsc --noEmit` 与自动化单元测试
- [ ] 严格遵守 `BE-101` 至 `BE-108` 与 `COM-013` 至 `COM-018`
