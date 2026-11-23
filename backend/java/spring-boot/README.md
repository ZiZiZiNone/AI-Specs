# Spring Boot 3 框架差异规范

路径基准：本文所有裸路径相对规范库根 `<SPEC_ROOT>` 解析。见 `<SPEC_ROOT>/README.md`「路径基准」。

## 规则
- 开启 `spring.jpa.open-in-view=false` 防 View 层隐式懒加载 N+1；关闭生产 `/actuator` 敏感端点仅暴露 `/actuator/health/liveness` 与 `/readiness`；配置类使用 `@ConfigurationProperties` + `@Validated`。

## 检查清单
- [ ] 严格遵守 `BE-101` 至 `BE-108` 与 `COM-013` 至 `COM-018`
