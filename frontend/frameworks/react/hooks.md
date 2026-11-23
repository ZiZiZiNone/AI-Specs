# React 19 Hooks 与副作用规范

路径基准：本文所有裸路径相对规范库根 `<SPEC_ROOT>` 解析。见 `<SPEC_ROOT>/README.md`「路径基准」。

## 规则
- 异步请求在 `useEffect` 返回清理函数中调用 `controller.abort()`；禁止用 `// eslint-disable-next-line react-hooks/exhaustive-deps` 掩盖过期闭包；复杂业务计算与表单校验沉淀到无 React 依赖的 `logic/` 纯函数。

## 检查清单
- [ ] 严格遵守 `FE-101` 至 `FE-104`、`COM-013` 至 `COM-018`
- [ ] 可运行参考切片见 `frontend/frameworks/react/test/`
