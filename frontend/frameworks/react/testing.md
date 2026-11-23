# React 测试规范

路径基准：本文所有裸路径相对规范库根 `<SPEC_ROOT>` 解析。见 `<SPEC_ROOT>/README.md`「路径基准」。

## 规则
- 纯逻辑与 Hook 竞态守卫使用零 DOM 单元测试；组件测试使用 React Testing Library 按无障碍角色（`getByRole`）断言交互行为，不测内部 state。

## 检查清单
- [ ] 严格遵守 `FE-101` 至 `FE-104`、`COM-013` 至 `COM-018`
- [ ] 可运行参考切片见 `frontend/frameworks/react/test/`
