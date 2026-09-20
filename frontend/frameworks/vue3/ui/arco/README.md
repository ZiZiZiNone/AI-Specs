# Arco Design Vue

Arco 与本规范的边界约定。核心冲突有三处：自带校验、Table 内部状态、命令式 API。
以下取舍已定，不再逐次决策。

## 一、表单校验：弃用 Arco rules

Arco `a-form` 自带 `rules` / `field` 校验能力，与本规范「校验规则定义在 Logic」
（frontend/rules/form-validation.md）直接冲突。

**取舍：弃用 Arco 的 rules，只用其展示能力。**

理由：Arco rules 把规则绑在模板上，导致规则无法被 Logic 复用、无法脱离组件单测，
且提交前的跨字段校验与动态可见性判断难以表达。规则留在 Logic 才能同时服务
新增/编辑/批量导入等多个入口。

```vue
<!-- ✅ 规则在 Logic，Arco 只负责渲染错误 -->
<a-form-item
  field="code"
  label="工单编号"
  required
  :validate-status="errors.code ? 'error' : undefined"
  :help="errors.code"
>
  <a-input
    :model-value="values.code"
    @update:model-value="update('code', $event)"
    @blur="emit('blur', 'code')"
  />
</a-form-item>
```

```vue
<!-- ❌ 规则写进模板：无法复用、无法单测、跨字段校验难表达 -->
<a-form :model="values" :rules="{ code: [{ required: true, message: '请输入编号' }] }">
  <a-form-item field="code"><a-input v-model="values.code" /></a-form-item>
</a-form>
```

**约定**：
- 不使用 `a-form` 的 `rules` prop，不调用 `formRef.validate()`。
- 用 `validate-status` + `help` 展示 Logic 返回的错误信息。
- `required` 仅作视觉标记（红星），不承担校验。
- `a-form` 不绑 `@submit`，提交由页面的按钮事件触发，避免两条提交路径。

---

## 二、Table：排序/分页/选择状态外置

Arco `a-table` 的 `sortable`、内置 `pagination`、`rowSelection` 都会持有内部状态，
与「排序/分页状态集中在 Logic」（frontend/patterns/list-page.md）冲突。

**取舍：一律外置，Table 只渲染。**

```vue
<!-- ✅ 关闭内置分页，排序受控并回调上报 -->
<a-table
  :data="rows"
  :loading="loading"
  :pagination="false"
  row-key="id"
  @change="handleSort"
/>
<a-pagination
  :current="query.page"
  :page-size="query.pageSize"
  :total="total"
  @change="changePage($event, query.pageSize)"
/>
```

**约定**：
- `:pagination="false"`，分页用独立 `a-pagination`，状态来自 URL / Logic。
- 排序用 `sortable.defaultSortOrder` 由外部状态推导当前方向，
  变更经 `@change` 上报，不依赖组件内部记忆。
- 多选的 `selectedKeys` 受控传入，不用组件内部选中态。
- 单元格渲染保持简单；状态/优先级等映射调 Logic 的常量表，不在模板里写三元链。

```typescript
// ✅ 当前排序方向由外部状态推导
function sortableOf(field: TicketSortField): TableSortable {
  return {
    sortDirections: ['ascend', 'descend'],
    defaultSortOrder:
      props.sortBy === field ? (props.sortOrder === 'asc' ? 'ascend' : 'descend') : '',
    sorter: true,
  };
}
```

---

## 三、命令式 API：Message / Modal / Notification

`Message.success()`、`Modal.confirm()` 是命令式调用，直接写在组件里会形成
隐藏副作用（frontend/anti-patterns/hidden-side-effect.md）。

**取舍：允许使用，但调用位置受限。**

| API | 允许位置 | 禁止位置 |
|---|---|---|
| `Message.*`（Toast） | 页面、Hook | Logic、Service、展示组件 |
| `Modal.confirm`（二次确认） | 页面、Hook | Logic、Service、展示组件 |
| `Notification.*` | 页面、Hook | Logic、Service、展示组件 |

**约定**：
- 确认文案与危险等级判定放 Logic（如 `requiresPriorityConfirm`），
  Modal 调用封装在 Hook，页面只声明"确认后做什么"。
- 展示组件不弹 Toast，通过 emit 上报由页面决定提示方式。
- 二次确认必须满足 frontend/rules/ui-rule.md：危险色按钮、明确文案（"确定删除"而非"确定"）。

```typescript
// ✅ 确认逻辑收进 Hook，返回布尔供页面编排
function confirmDanger(options: ConfirmOptions): Promise<boolean> {
  return new Promise((resolve) => {
    Modal.confirm({
      title: options.title,
      content: options.content,
      okText: options.okText,
      cancelText: '取消',
      okButtonProps: { status: 'danger' },
      onOk: () => resolve(true),
      onCancel: () => resolve(false),
    });
  });
}
```

```typescript
// ❌ Logic 里弹窗：Logic 不再框架无关，无法单测
export function deleteTicket(id: string) {
  Modal.confirm({ title: '确认删除', onOk: () => api.delete(id) });
}
```

---

## 四、其他约定

### 图标按需引入
从 `@arco-design/web-vue/es/icon` 具名引入，不全量注册。

```typescript
import { IconPlus, IconRefresh } from '@arco-design/web-vue/es/icon';
```

### 弹窗
- `:mask-closable="false"` + `:esc-to-close="false"`，关闭统一走自定义 `requestClose`，
  以便执行"有未保存输入需二次确认"。
- `unmount-on-close` 开启，避免残留上一次的表单状态。
- footer 自定义，提交按钮承载 `loading` 与禁用态。

### 骨架屏
首屏用 `a-skeleton` 而非 `a-spin`，结构与实际内容对齐（frontend/rules/ui-states.md）。

### 空态
`a-empty` 的描述插槽必须给出具体文案与引导操作，不使用默认"无数据"。

### 主题 token
颜色、边框、文字层级用 Arco CSS 变量（`var(--color-text-1)`、`rgb(var(--danger-6))`），
不引入第二套调色板。详见 frontend/rules/style.md。

---

## 检查清单

- [ ] 未使用 a-form 的 rules，未调用 formRef.validate()
- [ ] 错误经 validate-status + help 展示，规则在 Logic
- [ ] a-table 关闭内置分页，排序/选择状态外置受控
- [ ] 单元格无复杂三元链，映射走 Logic 常量表
- [ ] Message/Modal 仅出现在页面与 Hook，未进 Logic/Service/展示组件
- [ ] 危险操作确认用危险色按钮与明确文案
- [ ] 图标按需具名引入
- [ ] 弹窗禁用遮罩关闭并自定义关闭确认，开启 unmount-on-close
- [ ] 首屏用 a-skeleton，空态有具体文案与引导
- [ ] 颜色文字用 Arco CSS 变量，无第二套调色板
