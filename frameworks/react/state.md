# React 状态

React 侧状态实现细则。

## 状态归属实现
状态归属决策见 rules/store.md；React 侧对应实现：
- 组件内 → useState/useReducer。
- 父级提升 → props/回调下发。
- Store → Store 库。

## 待补充
- Store 库选型与用法细则（待用户补充；补充后同步 frameworks/README.md 现有目录说明）。
