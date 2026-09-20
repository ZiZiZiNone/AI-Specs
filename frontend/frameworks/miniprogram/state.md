# 小程序状态

data 归属到小程序实现的映射、setData 语义、页面间传参与全局状态边界。
归属决策本身见 `frontend/rules/store.md`，本文件只写映射，不重复决策树。

## setData 语义

以下三条是小程序自身语义，成立理由写在原处，便于复核。

### 异步合并：setData 后立即读 data 拿到的是旧值

`setData` 把数据变更发往渲染层是异步过程，调用后同步读取 `this.data`
得到的是调用前的值。依赖新值做后续判定时，用 `setData` 回调或先算好再写。

```typescript
// ❌ 读到的是旧 list，翻页条件永远错一位
this.setData({ page: this.data.page + 1 })
this.loadList(this.data.page)

// ✅ 先算后写，判定用算好的值
const nextPage = this.data.page + 1
this.setData({ page: nextPage })
this.loadList(nextPage)
```

### 默认整体替换，路径更新为例外（已定 2026-09-03）

logic 纯函数返回新状态，页面直接整体 `setData` 回写。
这与 B 方案同构：状态是不可变快照，不是原地修改的对象。

```typescript
// ✅ 默认形态：新状态整体回写
async onReachBottom() {
  this.setData(await loadMore(pickPage(this.data), fetchTickets))
}
```

仅当列表达到万级且高频局部更新（倒计时、实时进度）时，改用路径更新，
并在原处注明性能理由。路径字符串禁止手拼动态 key，先组装对象再传：

```typescript
// ✅ 例外形态：只传变化路径，须附性能理由
this.setData({ [`list[${index}].status`]: 'done' })
```

### 只写可序列化数据，单次有上限

`setData` 传输的数据须可 JSON 序列化：函数、`undefined`、`Date` 会丢失或变形，
这类值留在 logic 层，永远不进 `data`。单次 `setData` 数据量有官方上限，
列表分页返回整页即止，禁止一次写入全量历史数据。

- [ ] `data` 中无函数、`undefined`、`Date`
- [ ] 分页按页写入，不攒全量后一次写入
- [ ] 需要精度的数字（金额）以分为单位存整数，展示时再换算

## data 归属映射

`frontend/rules/store.md` 的状态归属决策原文：

> 只在单个组件内使用 → 组件内局部状态。
> 父子/兄弟需要共享 → 提升到父组件，props/回调下发。
> 需要刷新后保持 → URL 参数（持久化状态）。
> 跨页面/跨模块或多处需要响应式共享 → 进入 Store。
> 每上移一级都先确认必要性，避免提前全局化。

小程序映射（其中「需要刷新后保持 → URL 参数」一条不照搬 Vue 的 URL 结论，小程序无 URL 状态）：

| 归属结论 | 小程序实现 |
|---|---|
| 组件内自用 | Component / Page 的 `data` |
| 父子共享 | properties 下发 + `triggerEvent` 上抛（见 component.md） |
| 需刷新后保持 | 页面 `query`（options）+ `wx.setStorageSync`，见下节 |
| 跨页响应式共享 | `app.globalData` + 同步约定，见"全局状态边界" |

页面业务数据（列表、详情、表单）跟随页面进出，归 logic 层拥有、
页面 `data` 持有快照。`frontend/rules/store.md` 原文：

> 禁止在 Store 里加载页面业务数据（列表/详情/表单），那属于 Hook 的职责。

本目录中 Hook 层由 logic 承担（见 README「Hook 层映射」），故读作：
页面业务数据归 logic，不进 `globalData`。

## 页面间传参

- `query`：`options` 只传字符串；对象先 `JSON.stringify` 后 `encodeURIComponent`，
  接收侧解码失败时按缺参处理，不抛错（见 frontend/rules/error-handling.md）。
- `eventChannel`：仅用于"返回时回传结果"（如选择器回填），不用作常规下发通道。
- `storage`：刷新后保持的状态（筛选、草稿）走 storage，读写收敛到 logic 函数，
  页面不直接调 `wx.setStorageSync` 散写。
- `globalData`：不做传参通道，跨页共享走下一节，传参走 query。

## 全局状态边界（已定 2026-09-03：globalData 方案）

`frontend/rules/store.md` 原文：

> Store只存共享状态，不承载业务逻辑。
> Store 只做状态读写与 action 编排，不写业务判断、不转换数据。

`globalData` 只存四类：会话、当前用户与权限、全局配置、未读数。
更新走 `app.ts` 统一入口（`setCurrentUser` 这类方法），禁止各页面直接改写
`getApp().globalData` 的字段。

跨页响应式靠约定同步，不靠框架：用全局状态的页面在 `onShow` 重读；
需要即时性的场景（未读数清零）用 `app` 上的订阅通知，页面 `onUnload` 取消订阅。
多页高频共享同一份可变状态才考虑引入 mobx-miniprogram，引入前须按 C6
指出消费者（哪几个页面、哪个验收条件依赖即时同步）。

### 为什么页面数据不能进 globalData

`frontend/rules/store.md` 原文：

> Store 的生命周期与应用同寿，页面数据的生命周期跟随页面进出。
> 把列表/详情放进 Store 会让二者脱钩——离开页面数据仍在，
> 再次进入时可能先读到上一次的残留，且并发页面互相覆盖。

小程序同理：页面销毁时 `data` 释放，`globalData` 常驻。
列表放进 `globalData`，返回再进会先闪出上次残留；两个同类页面并发时互相覆盖。

## 检查清单

- [ ] setData 后无同步读 `this.data` 做判定的代码
- [ ] 默认整体回写；路径更新附了性能理由
- [ ] `data` 无函数、`undefined`、`Date`
- [ ] 页面业务数据在 logic + 页面 `data`，不在 `globalData`
- [ ] `globalData` 只有会话/用户/配置/未读数四类，走 `app.ts` 统一入口改写
- [ ] 刷新保持的状态走 query + storage，读写在 logic 内
