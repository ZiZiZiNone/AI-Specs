# Java 安全规范（BE-105 / BE-106 / COM-013）

路径基准：本文所有裸路径相对规范库根 `<SPEC_ROOT>` 解析。见 `<SPEC_ROOT>/README.md`「路径基准」。

## 规则
- 严禁使用原生 `ObjectInputStream` 反序列化不可信字节流；MyBatis 严禁 `${}` 拼接用户输入（必用 `#{}`）；排序字段经 `Set.of(...)` 白名单校验；CI 运行 OWASP Dependency-Check。

## 检查清单
- [ ] 严格遵守 `BE-101` 至 `BE-108` 与 `COM-013` 至 `COM-018`
