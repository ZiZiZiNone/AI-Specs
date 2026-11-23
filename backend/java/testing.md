# Java 测试规范

路径基准：本文所有裸路径相对规范库根 `<SPEC_ROOT>` 解析。见 `<SPEC_ROOT>/README.md`「路径基准」。

## 规则
- Service 业务逻辑通过 `Clock` 注入与内存 Fake 仓储跑纯单元测试（不启动 Spring 上下文）；需要真实 DB 语义时使用 Testcontainers。

## 检查清单
- [ ] 严格遵守 `BE-101` 至 `BE-108` 与 `COM-013` 至 `COM-018`
