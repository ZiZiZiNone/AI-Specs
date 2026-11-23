# Vue 3 最小可运行参考切片（v2.0）

路径基准：本文所有裸路径相对规范库根 `<SPEC_ROOT>` 解析。见 `<SPEC_ROOT>/README.md`「路径基准」。

零第三方依赖的 Node.js 18+ 原生模块与测试切片，直接验证 `frontend/examples/golden/` 与 `frontend/frameworks/vue3/` 中全部 P0 修复点：
- `src/hooks/useRequestGuard.mjs`：单飞覆盖式 `start()` 真取消上一在途 `AbortController` + 单调序号防后发先至 + `abortAll()`
- `src/services/httpClient.mjs`：HTTP 200 业务码 `code !== 0` 判定、`withTimeout` 预判已 abort、可被 `AbortSignal` 立即中断的退避重试、POST 禁自动重试
- `src/logic/ticketQuery.logic.mjs`：URL Query 序列化/解析互逆、筛选/排序/pageSize 变更回第 1 页、批量删除动态页码修正
- `src/logic/ticketValidation.logic.mjs`：全量错误替换（无旧错残留）、`toSubmitPayload` 剔除隐藏字段、`isSubmitting` 防重入锁、`handleBlur` 仅 dirty/已提交时报错
- `src/router/sessionGuard.mjs`：单飞 `ensureLoaded()` 彻底消除首屏刷新权限绕过漏洞

## 运行验证命令

```bash
AI_SPEC_ALIAS_ROOT=frontend/frameworks/vue3/test/src node --no-warnings --loader ./scripts/node-alias-loader.mjs --test frontend/frameworks/vue3/test/tests/vue3-slice.test.mjs
```
