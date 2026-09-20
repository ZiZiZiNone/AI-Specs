# 接口

路径基准：本文所有裸路径相对规范库根 `<SPEC_ROOT>` 解析，首段为 `common/`、`frontend/` 或 `backend/`。见 `<SPEC_ROOT>/README.md`「路径基准」。

所有接口经Service访问。新代码一律以 `common/rules/api-contract.md`「响应信封」与「业务错误码」为准；存量偏离须链到该文件「前端迁移清单」条目，Review 时无链条目按违规计。

## 规则
- 页面/组件/Logic 不直接调用请求库或拼接 URL，一律通过 Service 方法。
- Service 方法以业务语义命名（fetchUser、submitOrder），不在 UI 层裸调 fetch/axios。
- 参数校验、响应数据转换、错误归一统一在 Service 内处理。
- 统一错误处理（超时、业务错误码、网络错误），UI 只消费结构化结果。
