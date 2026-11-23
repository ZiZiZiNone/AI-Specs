# Java 目录结构与构造注入（BE-101 / BE-102）

路径基准：本文所有裸路径相对规范库根 `<SPEC_ROOT>` 解析。见 `<SPEC_ROOT>/README.md`「路径基准」。

## 规则
- 强制使用**构造函数注入**（禁止字段 `@Autowired`）；按 `controller → service → repository → domain` 单向分层，DTO 全部采用不可变 `record`。

## 检查清单
- [ ] 严格遵守 `BE-101` 至 `BE-108` 与 `COM-013` 至 `COM-018`
