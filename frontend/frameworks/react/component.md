# React 19 组件规范（FE-102）

路径基准：本文所有裸路径相对规范库根 `<SPEC_ROOT>` 解析。见 `<SPEC_ROOT>/README.md`「路径基准」。

## 规则
- 展示组件保持纯受控（Props 驱动 + 回调发出意图），不直接发请求或耦合全局 Store；列表渲染严禁用数组下标作稳定 `key`；富文本严禁未净化传 `dangerouslySetInnerHTML`。

## 检查清单
- [ ] 严格遵守 `FE-101` 至 `FE-104`、`COM-013` 至 `COM-018`
- [ ] 可运行参考切片见 `frontend/frameworks/react/test/`
