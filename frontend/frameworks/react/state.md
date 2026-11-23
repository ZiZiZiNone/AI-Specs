# React 状态归属规范

路径基准：本文所有裸路径相对规范库根 `<SPEC_ROOT>` 解析。见 `<SPEC_ROOT>/README.md`「路径基准」。

## 规则
- 列表筛选/分页归 URL SearchParams；服务端缓存归 TanStack Query（不手写同步到全局 Store）；客户端跨页状态（如主题、当前会话）归轻量化 Zustand，登出时显式 `reset()`。

## 检查清单
- [ ] 严格遵守 `FE-101` 至 `FE-104`、`COM-013` 至 `COM-018`
- [ ] 可运行参考切片见 `frontend/frameworks/react/test/`
