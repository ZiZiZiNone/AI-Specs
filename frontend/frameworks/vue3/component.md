# Vue 3 组件

路径基准：本文所有裸路径相对规范库根 `<SPEC_ROOT>` 解析。见 `<SPEC_ROOT>/README.md`「路径基准」。

组件通信、props/emit 与受控约定。
组件职责边界见 `frontend/rules/ui-rule.md` 与 `frontend/rules/core-principles.md`「P2 组件完全解耦原则」。

## props

### 定义方式
- 一律用 `defineProps<Props>()` 泛型形式，配 `interface Props`，不用运行时对象形式。
- 有默认值时用 `withDefaults`。
- 复杂 props 类型定义在 `src/types/` 下，不内联在组件里（便于复用与被 Logic 引用）。

### 可空性约定
- **组件 props 的可选参数用 `?:`**，其缺省语义即 `undefined`，配 `withDefaults` 给默认值。
- **领域数据字段用 `| null`**（如 `assignee: TicketAssignee | null`），
  表达"业务上确实为空"，与"未传入"区分开。

这是对 `frontend/rules/typescript.md`「可空的表达」：领域数据的可空字段用 `Type | null` 的框架侧细化：
该条约束领域数据建模，不适用于组件 props 的"未传入"语义——
Vue 的默认值机制以 `undefined` 为信号，强制 `| null` 会迫使每个调用点显式传 `null`。

```typescript
// ✅ 可选 props 用 ?:，领域字段用 | null
interface Props {
  detail: TicketDetail;          // 必填
  errorMessage?: string;         // 未传入 = undefined
  initialOption?: TicketAssignee | null;  // 未传入 or 业务上无值
}
withDefaults(defineProps<Props>(), { errorMessage: '' });
```

---

## emit

- 用 `defineEmits<{ name: [payload: T] }>()` 元组语法标注载荷类型。
- 事件名用动词或 `update:xxx`，不用 `onXxx`（那是 props 命名）。
- 载荷是领域数据或标识，不传组件内部实现细节（不传 DOM 事件对象，除非确有必要）。

```typescript
const emit = defineEmits<{
  view: [id: string];
  changePriority: [row: Ticket, priority: TicketPriority];
  'update:modelValue': [value: string];
}>();
```

---

## 受控与非受控

### 业务组件一律受控
值由 props 传入，变更经 emit 上报，组件自身不持有业务状态。

```vue
<!-- ✅ 受控筛选栏：值来自 props，变更上报 -->
<a-input
  :model-value="query.keyword"
  @update:model-value="emit('change', { keyword: String($event ?? '') })"
/>
```

```vue
<!-- ❌ 复合业务组件自持状态：与真实来源（URL/父级）脱节，
     前进后退或外部重置时不同步 -->
<script setup lang="ts">
const keyword = ref(props.initialKeyword);
</script>
```

### 允许自持状态的范围
仅 frontend/protocol/decision-trees.md 白名单内的基础控件与纯交互状态：
- 输入类控件的输入法中间态
- 下拉/折叠/弹层的展开收起
- 文件选择器的"已选择未上传"中间态

**判定**：该状态若丢失，是否只影响本次交互体验、不影响业务数据？
是则可自持，否则必须上提。

### 双向绑定
- 用 `modelValue` + `update:modelValue`，不自造 `value` + `change` 组合。
- 自定义组件支持 `v-model` 时，内部仍是受控实现（不写入 props）。

---

## SFC 块顺序与 script 内部顺序

- 块顺序强制 `template → script → style`；缺 `style` 不罚；
  `i18n` / `docs` 等自定义块一律放末尾。
- `<script setup>` 内部：imports → 类型定义（`Props` / `Emits` 接口）→
  `defineProps` / `defineEmits` / `withDefaults` →
  store / hooks 实例 → `computed` / `watch` → 生命周期 → 函数与事件处理。

---

## 插槽

- 用具名插槽表达结构扩展点，不用 props 传 render 函数。
- 状态容器类组件（如 DataLoader）只在 success 态渲染默认插槽，
  其余态由自身渲染，避免调用方重复写 v-if 链。
- 插槽作用域数据只暴露必要字段，不整体透出内部状态。

---

## 组件通信禁止项

- ❌ 组件内 import Store（P2）
- ❌ 组件内加载页面业务数据（列表/详情/提交/删除）
- ❌ 组件访问路由参数（页面组件除外）
- ❌ 通过 `$parent` / `provide` 隐式回写父级状态
- ❌ 用 `defineExpose` 暴露内部方法供父级命令式调用业务逻辑
  （UI 焦点控制等纯交互可例外，需注释说明）

允许 import Service 的例外见 `frontend/rules/core-principles.md`「组件调用 Service 的边界」：
仅限组件自身交互功能（上传、异步搜索、唯一性校验）。

---

## 检查清单

- [ ] props 用 defineProps<Props>() 泛型形式，类型定义在 types/
- [ ] 可选 props 用 ?:，领域字段用 | null
- [ ] emit 用元组语法标注载荷类型
- [ ] 业务组件受控，未自持业务状态
- [ ] 自持状态在白名单内且丢失不影响业务数据
- [ ] 双向绑定用 modelValue + update:modelValue
- [ ] 状态容器只在 success 态渲染默认插槽
- [ ] 无 import Store、无业务数据请求、无路由参数访问
- [ ] 未用 defineExpose 暴露业务方法
- [ ] SFC 块顺序为 template → script → style（缺 style 不罚，自定义块殿后）
- [ ] script 内部按类型 → props/emit 声明 → 实例 → computed/watch → 生命周期 → 函数
