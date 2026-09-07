# 小程序组件

组件通信、properties/observers/lifetimes 与受控约定。
组件职责边界见 rules/ui-rule.md 与 rules/core-principles.md P2。

## properties

### 定义方式

- `properties` 一律写完整形态（`type` + `value`），不用简写；`type` 用构造器，
  复杂对象配 `TicketDetail` 这类 `src/types/` 下的类型，不内联。
- 可选属性用 `value` 给缺省（缺省语义即"未传入"）；领域数据字段用 `| null`
  表达"业务上确实为空"，与"未传入"区分开。这是对 rules/typescript.md 的框架侧细化，
  与 vue3/component.md 的 `?:` vs `| null` 同源。

```typescript
// ✅ 可选属性给 value，领域字段用 | null
Component({
  properties: {
    detail: { type: Object, value: null as TicketDetail | null },
    errorMessage: { type: String, value: '' },   // 未传入 = 空串
  },
})
```

### observer

- 属性变化的派生只写 `observer`，不在 `lifetimes.attached` 里读一次就不管。
- `observer` 内只做"属性→内部展示态"的纯映射，不调接口、不写业务判断；
  需要判定的走 logic，observer 只负责把结果回写。

```typescript
// ✅ observer 只做纯映射
properties: {
  status: {
    type: String,
    value: 'todo',
    observer(next: TicketStatus) {
      this.setData({ statusText: STATUS_TEXT[next] })  // 映射表在 logic 常量
    },
  },
}
```

---

## 事件

- 用 `triggerEvent('change', payload)` 上报，事件名用动词，不用 `onXxx`
 （那是 properties 命名）。
- 载荷是领域数据或标识，不传组件内部实现细节。
- 父级在 WXML 用 `bind:change="onChildChange"` 接收，`e.detail` 取载荷。

```typescript
// ✅ 载荷是领域数据
this.triggerEvent('changePriority', { row: this.data.ticket, priority })
```

---

## 受控与非受控

### 业务组件一律受控

值由 properties 传入，变更经事件上报，组件自身不持有业务状态。
判定沿用 vue3/component.md：「该状态若丢失，是否只影响本次交互体验、
不影响业务数据？是则可自持，否则必须上提。」

```html
<!-- ✅ 受控筛选栏：值来自 properties，变更上报 -->
<filter-bar keyword="{{query.keyword}}" bind:change="onQueryChange" />
```

```typescript
// ❌ 复合业务组件自持状态：与真实来源（父级/Logic）脱节，
//    外部重置时不同步
Component({
  properties: { initialKeyword: { type: String, value: '' } },
  data: { keyword: '' },   // 从 initialKeyword 拷一份后各自为政
})
```

### 允许自持状态的范围

仅 protocol/decision-trees.md 白名单内的基础控件与纯交互状态：
输入类控件的输入法中间态、下拉/弹层的展开收起、表单未提交的草稿中间态。

### 双向形态

- 不用 `model:` 双向绑定承载业务值；业务值一律"properties 下 + 事件上"。
- 纯交互开关类组件可用双向绑定，但须在组件注释写明"仅交互态"。

---

## lifetimes

- 数据加载不写 `attached`（对应"守卫/attached 内无业务数据请求"，见 router.md）；
  页面级加载在页面 `onLoad` 调 logic，组件只渲染传入的数据。
- 清理写 `detached`：取消订阅、清定时器、中断 guard（见 logic.md）。
- `ready` 只做依赖布局信息的初始化（宽高测量），不做数据请求。

---

## 组件通信禁止项

- ❌ 组件内读 `globalData` 做业务判定（P2；展示组件连读都不读）
- ❌ 组件内加载页面业务数据（列表/详情/提交/删除）
- ❌ 组件内调 `wx.request`（接口入口唯一归 Service）
- ❌ 组件读页面路由参数（页面组件除外）
- ❌ 用 `selectComponent` 命令式调用子组件业务方法
  （UI 焦点控制等纯交互可例外，需注释说明）

允许调用 Service 的例外见 rules/core-principles.md P2「组件调用 Service 的边界」：
仅限组件自身交互功能（上传、异步搜索、唯一性校验）。

---

## 文件与对象键顺序

- `Page()` / `Component()` 键序：imports → 模块常量 →
  `properties`（组件）/ `data` → `observers` →
  生命周期（页面 `onLoad` / `onShow` / `onReachBottom`；
  组件 `lifetimes.attached` / `ready`）→ 自定义方法与事件处理 →
  清理（`detached` / `onUnload` 调 `abortAll` 收尾）。
- 纯 logic TS 模块顺序见 rules/typescript.md。

---

## 检查清单

- [ ] properties 用完整形态，类型定义在 types/
- [ ] 可选属性有 value 缺省，领域字段用 | null
- [ ] observer 只做纯映射，无接口与业务判断
- [ ] 事件名用动词，载荷为领域数据或标识
- [ ] 业务组件受控，未自持业务状态
- [ ] 自持状态在白名单内且丢失不影响业务数据
- [ ] attached 内无数据请求，detached 有清理
- [ ] 无 globalData 业务读取、无业务数据请求、无路由参数访问
- [ ] 未用 selectComponent 调用业务方法
- [ ] 对象键序为 properties/data → observers → 生命周期 → 自定义方法 → 清理收尾
