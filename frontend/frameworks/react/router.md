# React 路由守卫与错误边界规范

路径基准：本文所有裸路径相对规范库根 `<SPEC_ROOT>` 解析。见 `<SPEC_ROOT>/README.md`「路径基准」。

## 规则
- 受保护路由必须等待 `session.ensureLoaded()` 单飞完成再裁决，严禁首屏未就绪放行；每个独立功能区包裹 `ErrorBoundary` 提供局部降级与重试入口。

## 检查清单
- [ ] 严格遵守 `FE-101` 至 `FE-104`、`COM-013` 至 `COM-018`
- [ ] 可运行参考切片见 `frontend/frameworks/react/test/`
