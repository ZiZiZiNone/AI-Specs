# 小程序 Logic

B 方案正文：纯函数入参/返回值约定、setData 回写接口、清理与竞态。
本文件即 Hook 层在小程序的承担者（见 README「Hook 层映射」）。

## 职责与禁区

`frontend/rules/architecture.md` 原文：

> Logic：业务规则、状态流转、副作用编排，可复用、可测试。
> Logic 保持框架无关（不 import Hook/UI），保证可单测。
> 禁止 Service 依赖 Logic、Logic 依赖 UI 组件与 Hook、Component 直接调接口。

小程序映射：logic 不接收 Page 实例与 `this`，不调用 `setData`，
不直接调 `wx.request`（接口入口唯一归 Service，见 service.md），
不直接操作 UI（提示、跳转由页面按返回状态执行）。

`frontend/rules/error-handling.md` 对 Logic 层的职责原文：

> 接收 Service 返回的错误对象
> 根据错误码/类型转换为用户友好的提示
> 决定错误处理策略（展示/重试/降级）
> 返回处理后的错误状态给 UI
> 不直接操作 UI（通过返回值通知）

## 入参/返回值约定

logic 函数入参只收普通值：查询参数对象加前状态快照。不收 `this`、
不收整个 `data` 引用——收引用就不可单测，且把"读 data"的时机埋进逻辑内。

```typescript
// ✅ 入参是值，出参是新状态；不碰 this，不碰 data
export async function loadMore<T>(
  state: PageState<T>,
  query: ListQuery,
  fetcher: (q: ListQuery, page: number) => Promise<T[]>,
): Promise<PageState<T>>
```

失败表达走状态内 error 字段，不抛异常。这不是新选择，而是已定形态的推论：
B 方案要求 logic 返回新状态、页面整体 `setData`，而 `frontend/rules/error-handling.md`
要求 Logic"返回处理后的错误状态给 UI"且"通过返回值通知"——
error 字段即错误状态，抛异常反而违反这两条。

```typescript
export interface PageState<T> {
  list: T[]
  page: number
  loading: boolean
  finished: boolean
  error: string | null   // 错误状态随快照一起返回，页面只负责展示
}
```

取消是预期行为，不是失败。`frontend/rules/async-operations.md` 原文：

> 取消不是错误：被取消的请求须在上层被识别为预期行为，不进入 error 态。

```typescript
// ✅ 取消静默返回，不写 error 态
if (!result.success) {
  if (result.error.code === 'CANCELED') return state
  return { ...state, loading: false, error: toUserMessage(result.error) }
}
```

## setData 回写接口

页面侧只有一行：调 logic，整体 `setData`。`data` 到快照的提取函数
（`pickPage` 这类）放在 logic 文件内，保持纯函数可单测。

```typescript
// logic/pagination.ts
export function initialPage<T>(): PageState<T> {
  return { list: [], page: 1, loading: false, finished: false, error: null }
}

export function pickPage<T>(data: PageState<T>): PageState<T> {
  return { list: data.list, page: data.page, loading: data.loading, finished: data.finished, error: null }
}

// pages/list/index.ts
Component({
  data: initialPage<Ticket>(),
  methods: {
    async onReachBottom() {
      this.setData(await loadMore(pickPage(this.data), this.data.query, fetchTickets))
    },
  },
})
```

## 删除回退

删除末页最后一条后退回上一页，避免停在空页。映射 `frontend/examples/golden/list-page.md` 的删除回退判定，小程序无地址状态，页码即快照内字段。

```typescript
// ✅ 纯函数：删后总数推上一页，页面整体 setData 回写
export function resolvePageAfterRemoval(query: { page: number; pageSize: number }, totalBeforeRemoval: number): number {
  const totalAfter = Math.max(0, totalBeforeRemoval - 1)
  const lastPage = Math.max(1, Math.ceil(totalAfter / query.pageSize))
  return Math.min(query.page, lastPage)
}
```

## 清理与竞态

`frontend/rules/async-operations.md` 原文：

> 上述两种方案须同时使用：AbortController 负责中断在途请求，
> 序号负责判定「已返回但已过期」的结果。封装一次，供列表/详情/记录共用。

小程序映射：guard 形态不变（`start` / `signal` / `isStale` / `abortAll`），
两处替换 Vue 专属机制——`onScopeDispose` 改为页面 `onUnload` 调 `abortAll`；
`signal` 到请求的转接（`wx.request` 无原生 signal 入口）由 service.md 统一封装，
本文件只要求 `frontend/rules/async-operations.md` 的结论：

> signal 必须真正传给请求，否则 abort 不会中断任何东西

```typescript
// ✅ 页面卸载中断未完成请求；过期结果直接丢弃
Component({
  lifetimes: {
    attached(this: WechatMiniprogram.Component.Instance) {
      this.guard = createRequestGuard()
    },
    detached(this: WechatMiniprogram.Component.Instance) {
      this.guard.abortAll()
    },
  },
  methods: {
    async onSearch(this: WechatMiniprogram.Component.Instance, keyword: string) {
      const { signal, isStale } = this.guard.start()
      const next = await searchTickets(pickPage(this.data), keyword, { signal })
      if (isStale()) return
      this.setData(next)
    },
  },
})
```

搜索防抖走 `frontend/rules/form-validation.md` 结论：用户停止输入 500ms 后才发起请求，格式未合法不发起，与 guard 双保险叠加而不替代。

## 不要制造纯转发层

`frontend/rules/architecture.md` 原文：

> 判据：该 Logic 函数删掉后，是否有任何业务规则随之丢失？
> 若没有，就不该存在。

只做"调 Service 后原样返回"的 logic 函数不该存在：
Service 已是统一入口，再包一层不含判定的转发只是多一次跳转。
合并、分页累加、错误转换、取消判定，至少含一条才成立。

## 检查清单

- [ ] logic 函数入参无 `this`、无 Page 实例、无 `data` 引用
- [ ] logic 内无 `setData`、无 `wx.request` 直调、无 UI 操作
- [ ] 失败经 error 字段返回，取消静默不写 error 态
- [ ] 快速切换场景有 guard 双保险；`onUnload` / `detached` 调 `abortAll`
- [ ] 搜索类场景有 500ms 防抖且格式未合法不发起，与 guard 叠加
- [ ] 每个 logic 函数都过转发层判据：删掉它有业务规则丢失
