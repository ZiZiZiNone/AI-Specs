# 前端接口消费与契约迁移规范

路径基准：本文所有裸路径相对规范库根 `<SPEC_ROOT>` 解析。见 `<SPEC_ROOT>/README.md`「路径基准」。

通用接口契约见 `common/rules/api-contract.md`。本文件规定前端 Service 层落地细则，并承接存量接口的契约迁移追踪表。

## 前端强制规则

参数校验、响应数据转换、错误归一统一在 Service 内处理。


1. **双层成功判定**：`httpClient` 必须先检查 HTTP 状态码，再检查信封 `payload.code === 0`；HTTP 200 但 `code !== 0` 一律映射为标准业务错误对象返回，严禁当作成功。
2. **统一分页载荷**：新接口一律消费 `data.items` + `data.page.{page, pageSize, total, totalPages}`；严禁在页面或 Hook 层直接适配后端历史字段（如 `list`/`rows`），存量旧接口适配必须收敛在对应 Service 适配器内并在下表登记。
3. **单出口错误处理**：所有 `try/catch`、超时控制、可中断退避重试收敛在 `httpClient` / Service 层，Service 层**严禁直接弹窗或 Toast**（仅返回标准化错误对象，见 `frontend/rules/error-handling.md`）。
4. **可运行参考实现**：见 `frontend/frameworks/vue3/test/src/services/httpClient.mjs` 与 `frontend/frameworks/miniprogram/test/miniprogram/services/request.mjs`。

## 前端存量接口迁移清单

存量接口暂不符合 `common/rules/api-contract.md` 信封或分页结构时，须在此登记并在 Service 层做单点适配（未登记的偏离在 Review 时按违规计）：

| 接口路径 | 当前偏离项 | Service 适配位置 | 计划迁齐日期 / 责任人 |
|---|---|---|---|
| （暂无存量偏离；新接口严格按 `common/rules/api-contract.md` 实现） | — | — | — |
