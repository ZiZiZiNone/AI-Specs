# 小程序 Service

路径基准：本文所有裸路径相对规范库根 `<SPEC_ROOT>` 解析。见 `<SPEC_ROOT>/README.md`「路径基准」。

`wx.request` 统一封装、登录态、超时联动、错误归一与重试。
Service 层职责见 `frontend/examples/golden/service-layer.md`（统一出口/超时联动/幂等重试/错误归一），
本文件只写小程序映射，不重复通用结论。

## 统一出口

所有 `wx.request` 收敛到 `src/services/request.ts`，页面/logic 不直调。
出口做五件事：拼 baseURL、带登录态、配超时、归一错误、记录请求日志。

```typescript
// ✅ 统一出口：调用方只描述业务请求
export interface RequestOptions {
  path: string
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
  data?: Record<string, unknown>
  signal?: AbortSignal   // 取消转接见下节
}

export function request<T>(options: RequestOptions): Promise<Result<T>> {
  return new Promise((resolve) => {
    const task = wx.request({
      url: `${BASE_URL}${options.path}`,
      method: options.method ?? 'GET',
      data: options.data,
      header: { Authorization: `Bearer ${getToken()}` },
      timeout: REQUEST_TIMEOUT,
      success: (res) => resolve(toResult<T>(res)),
      fail: (err) => resolve(toResult<T>(null, err)),
    })
    bindAbort(task, options.signal)   // signal → RequestTask.abort 转接
  })
}
```

## signal 转接

`wx.request` 无原生 signal 入口，logic 传下的 `signal`（见 `frontend/frameworks/miniprogram/logic.md`「入参/返回值约定」）
由出口转接为 `RequestTask.abort()`。转接后 `fail` 回调的 `err.errMsg`
含 `abort`，须映射为 `CANCELED`，走"取消不是错误"结论
（见 `frontend/rules/async-operations.md`「取消不是错误」：被取消的请求须在上层被识别为预期行为）。

```typescript
// ✅ signal 中断真正 abort 请求；abort 结果归一为 CANCELED
function bindAbort(task: WechatMiniprogram.RequestTask, signal?: AbortSignal) {
  if (!signal) return
  if (signal.aborted) { task.abort(); return }
  signal.addEventListener('abort', () => task.abort(), { once: true })
}
```

## 超时联动

超时时间与 loading 提示联动，沿用 service-layer 的结论：
超时阈值唯一定义在出口常量，页面 loading 文案不另设倒计时。
`wx.request` 的 `timeout` 与 guard 的超时判定用同一常量，
避免"请求已超时但页面还在转圈"。

## 错误归一

HTTP 状态与业务码统一转为 `StandardError`（结构见 `frontend/rules/error-handling.md`「标准错误对象结构」），
logic 只收归一后的错误对象做转换（见 `frontend/frameworks/miniprogram/logic.md`「职责与禁区」）。

| 场景 | 归一结果 |
|---|---|
| 200 + 业务成功 | `{ success: true, data }` |
| 200 + 业务失败码 | `{ success: false, error: { code: 业务码, message } }` |
| 401 | `{ success: false, error: { code: 'UNAUTHORIZED' } }`，并触发重登录跳转 |
| 网络失败/超时 | `{ success: false, error: { code: 'NETWORK' / 'TIMEOUT' } }` |
| abort（取消） | `{ success: false, error: { code: 'CANCELED' } }`，不进入 error 态 |

401 只做一次重登录跳转：出口内加跳转中标记，避免并发请求触发多次跳转。

## 重试

- 只重试 GET 这类幂等请求，POST/PUT/DELETE 默认不重试。
- 重试次数与间隔唯一定义在出口，不在各调用方散写。
- 重试仍全部失败时，返回最后一次的错误，不抛异常（logic 走 error 字段）。

## 检查清单

- [ ] 无散写 wx.request，全部走统一出口
- [ ] baseURL、token、timeout 只在出口出现
- [ ] signal 已转接为 RequestTask.abort，abort 归一为 CANCELED
- [ ] 超时常量唯一，loading 与超时同源
- [ ] 错误全部归一为 StandardError，无原始 err 穿透到 logic
- [ ] 401 单次跳转，有并发 guard
- [ ] 只有幂等 GET 默认重试，写操作不重试

## v2.0 静默登录续期队列、监听解绑与隐私合规授权

- **401 并发静默续期队列**：当多个并发请求同时返回 `401` 时，必须合并为单次 `wx.login()` 换取新 Token（单飞 Promise），其余请求挂起等待刷新成功后自动重放一次；刷新失败则统一清理登录态并返回未授权错误（参考实现见 `frontend/frameworks/miniprogram/test/miniprogram/services/request.mjs`）。
- **`AbortSignal` 监听必解绑**：`RequestTask` 在 `complete` 回调中必须 `signal.removeEventListener('abort', onAbort)`，防止长生命周期共享 `signal` 产生内存泄漏。
- **隐私合规授权**：调用定位、剪贴板、相册、手机号等涉及用户隐私的微信 API 前，必须接入 `wx.onNeedPrivacyAuthorization` 拦截弹窗引导用户同意，被拒后通过 `wx.openSetting` 引导而非静默失败。
