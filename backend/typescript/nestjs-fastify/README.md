# NestJS / Fastify 框架差异规范

路径基准：本文所有裸路径相对规范库根 `<SPEC_ROOT>` 解析。见 `<SPEC_ROOT>/README.md`「路径基准」。

## 规则
- Fastify 使用 JSON Schema 驱动校验与序列化加速并配 `@fastify/helmet`；NestJS 中 Guard 仅做认证与粗粒度 RBAC，细粒度资源归属校验必须落在 Service 层（`BE-105`），异常统一由全局 `ExceptionFilter` 映射信封。

## 检查清单
- [ ] 通过 `tsc --noEmit` 与自动化单元测试
- [ ] 严格遵守 `BE-101` 至 `BE-108` 与 `COM-013` 至 `COM-018`
