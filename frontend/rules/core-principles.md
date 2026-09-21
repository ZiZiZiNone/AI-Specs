# 核心原则

路径基准：本文所有裸路径相对规范库根 `<SPEC_ROOT>` 解析，首段为 `common/`、`frontend/` 或 `backend/`。见 `<SPEC_ROOT>/README.md`「路径基准」。示例均引自 `frontend/examples/golden/` 自包含示例。本文 `src/*` 指业务项目根下源码，与规范库路径含义不同。

四大核心原则，所有代码必须遵守。

## FE-101 页面薄层原则
页面只负责布局和简单逻辑，核心代码模块放到组件。

### 定义
- **页面职责**：组装组件、传递数据、接收结果
- **简单逻辑**：仅限数据传递、条件渲染、列表遍历
- **禁止在页面**：业务判断、数据转换、状态计算、接口调用、复杂交互

### 量化标准

**页面文件**：
- 一般页面：不超过 300 行
- 纯展示页面：不超过 500 行
- 页面内直接定义的函数不超过 3 个
- 页面内状态变量不超过 5 个

**组件文件**：
- 展示组件：不超过 200 行
- 一般组件：不超过 300 行
- 复杂表单组件：不超过 500 行
  - 判定条件：8+ 字段 + 验证逻辑 + 异步操作（上传/搜索/验证）
  - 前提：职责单一，拆分会增加复杂度

**Hook 文件**：
- 单个 Hook：不超过 150 行
- 对外暴露成员不超过 10 个
- 一个 Hook 只服务一个关注点（一次数据加载 / 一个表单 / 一组行操作）
- 禁止"万能 Hook"：同时管理弹窗开关 + 数据加载 + 表单校验 + 提交，属职责堆叠

### 指标的意图（重要）
上述数字不是目的，而是"职责是否单一"的可观测代理。判断顺序始终是**先看职责，再看数字**：

- 指标超标 → 说明大概率职责不单一，必须重新审视
- 指标达标但职责混杂 → **仍然不合规**，不得以"行数没超"为由通过

**特别禁止：以搬运换达标。** 把页面里的函数原样挪进 Hook、使页面函数数达标，
而 Hook 变成新的复杂度堆积处，属于规避而非治理。
判定标准：抽取后的单元是否有独立、可一句话描述的职责，是否可被另一处复用或单测。

**超标处理**：
1. 检查职责是否单一（能否用一句话描述）
2. 评估拆分是否会增加复杂度（props 层层透传、逻辑割裂）
3. 如拆分更复杂，可保持当前结构
4. 必须在代码注释中说明保留原因

### 正确示例
来源：`frontend/examples/golden/list-page.md`「6. 页面只做组装」：页面只做组装和传递，状态全部来自 Hook，仅 1 个函数。

```vue
<script setup lang="ts">
// ✅ 页面只做组装和传递：状态全部来自 Hook，仅 1 个函数
const { query, changeFilter, changePage, goToPage } = useTicketQuery();
const list = useTicketList(query);
const formModal = useTicketFormModal(computed(() => session.user));
const rowOps = useTicketRowOperations({ rows: list.list, query, total: list.total,
  reload: list.reload, goToPage });

const canCreate = computed(() => hasPermission(session.user, 'ticket:create'));

async function handleSubmit(): Promise<void> {
  if (await formModal.submit()) await list.reload();
}
</script>
```

### 错误示例
来源：`frontend/examples/golden/anti-examples.md`「1. 页面直接调用 Service」与「10. 页面承担 13 个函数」：确认→请求→反馈→刷新全在页面，共 13 个函数。

```typescript
// ❌ 页面内写业务逻辑：确认→请求→反馈→刷新全在页面，共 13 个函数
const handleDelete = useCallback(async (userId: string) => {
  const confirmed = window.confirm('确定要删除该用户吗？此操作无法撤销。');
  if (!confirmed) return;

  const result = await userService.deleteUser(userId);   // 页面直连 Service
  if (result.success) {
    alert('删除成功');
    await refreshUsers();
  } else {
    alert(result.error?.message || '删除失败');
  }
}, [refreshUsers]);
```

---

## FE-102 组件完全解耦原则
组件完全解耦合，不管外部如何实现，只需要接受固定结构数据（或不需要）就能完成功能。

### 定义
- **固定结构数据**：通过 TypeScript 接口严格定义的数据结构
- **完全解耦**：组件不依赖外部实现细节、不直接访问全局状态、不直接调用接口
- **自包含**：组件内部包含完成其职责所需的全部展示逻辑和交互逻辑

### 强制要求
- 所有组件 props 必须有 TypeScript 类型定义
- 禁止组件内直接 import Store
- 禁止组件内发起业务数据请求（列表/详情/提交/删除）
- 禁止组件访问路由参数/全局变量（除自包含交互组件）
- 数据通过 props 传入，事件通过回调上报

### 组件调用 Service 的边界

**强制禁止**（业务数据加载，必须通过 Hook/Logic）：
- ❌ 列表数据加载（fetchList）
- ❌ 详情数据加载（fetchDetail）
- ❌ 表单提交（submitForm）
- ❌ 删除/更新操作（deleteItem/updateItem）
- ❌ 任何影响页面主要业务数据的操作

**允许例外**（组件自身交互功能）：
- ✅ 文件上传（如头像上传、附件上传）
- ✅ 异步搜索（如部门搜索下拉框、用户搜索）
- ✅ 实时验证（如用户名/手机号唯一性验证）
- ✅ 富文本编辑器图片上传
- ✅ 组件内部的辅助数据加载（如省市区联动）

**判定原则**：
```
问：这个 Service 调用是为了？
  ├─ 完成组件自身的交互功能（上传/搜索/验证）→ 允许
  └─ 加载或修改页面业务数据 → 禁止，应通过 Hook/Logic
```

**示例对照**：
- ✅ 允许：`<AvatarUpload onUpload={handleUpload} />` 内部调用 uploadService
- ❌ 禁止：`<UserCard userId={id} />` 内部调用 fetchUser
- ✅ 允许：`<DepartmentSelect onSearch={searchDepartments} />` 内部调用 searchService
- ❌ 禁止：`<UserList />` 内部调用 fetchUserList

### 自包含交互组件例外
仅以下基础表单控件可自持 UI 交互状态：
- Input/Textarea
- Select/Autocomplete
- Checkbox/Radio/Switch
- Slider/Rating
- DatePicker/TimePicker

**禁止**业务组件、复合组件、涉及数据请求的组件自持状态。

### 正确示例
来源：`frontend/examples/golden/list-page.md`「6. 页面只做组装」：组件只接收数据和回调，给什么渲染什么，权限由传入的 user 判定，判定调用 Logic，模板里不写条件表达式。

```vue
<script setup lang="ts">
// ✅ 组件只接收数据和回调：给什么渲染什么，权限由传入的 user 判定
interface Props {
  rows: Ticket[];
  loading?: boolean;
  user: SessionUser | null;
  sortBy: TicketSortField;
  sortOrder: SortOrder;
}
const props = withDefaults(defineProps<Props>(), { loading: false });

const emit = defineEmits<{
  remove: [row: Ticket];
  changePriority: [row: Ticket, priority: TicketPriority];
  sortChange: [sortBy: TicketSortField, sortOrder: SortOrder];
}>();

// 判定调用 Logic，模板里不写条件表达式；组件自身不发请求
function abilityOf(row: Ticket) {
  return resolveTicketRowAbility(props.user, row);
}
</script>
```

### 错误示例
来源：`frontend/examples/golden/anti-examples.md`「2. 展示型组件自己加载数据」：弹窗自己取详情，与接口绑定，无法脱离后端渲染。

```typescript
// ❌ 组件内调用接口：弹窗自己取详情，与接口绑定，无法脱离后端渲染
const loadUserDetail = async (userId: string) => {
  setIsLoadingDetail(true);
  const result = await userService.fetchUserDetail(userId);
  setIsLoadingDetail(false);
  if (result.success && result.data) setInitialData({ name: result.data.name /* … */ });
  else setLoadError(result.error?.message || '加载用户信息失败');
};
```

正确形态：`initialValues` / `isLoading` / `errorMessage` 由 props 传入，加载由 Hook 负责。

---

## FE-103 逻辑完全解耦原则
完全解耦合的函数/工厂/方法/逻辑，在独立的逻辑文件（全局或局部），只需要接受固定结构数据（或不需要）就能完成功能。

### 定义
- **Logic 文件**：业务项目 `src/logic/` 下的纯业务逻辑文件
- **完全解耦**：不依赖框架、不依赖 UI、不依赖全局状态
- **固定结构**：输入输出通过 TypeScript 接口严格定义

### 强制要求
- Logic 文件禁止 import 任何 UI 组件
- Logic 文件禁止 import 框架特定 Hook（如 useState/useEffect）
- Logic 可以调用 Service，但不直接调用请求库
- Logic 必须可单独测试（不需要挂载组件）
- 所有公共 Logic 函数必须有类型定义

### Logic 拆分原则
- 按业务领域拆分，不按页面拆分
- 单一职责：一个 Logic 文件只负责一个业务实体或用例
- 文件命名：`useCase.logic.ts` 或 `entity.logic.ts`
- 多页面共用同一 Logic，不重复实现

### 正确示例
来源：`frontend/examples/golden/list-page.md`「2. 改筛选必回第一页」：纯逻辑框架无关，输入输出普通数据，可直接单测。

```typescript
// ✅ 纯逻辑，框架无关：输入输出都是普通数据，可直接单测
/** 删除末页最后一条后退回上一页，避免停在空页。 */
export function resolvePageAfterRemoval(
  query: TicketListQuery,
  totalBeforeRemoval: number,
): number {
  const totalAfter = Math.max(0, totalBeforeRemoval - 1);
  const lastPage = Math.max(1, Math.ceil(totalAfter / query.pageSize));
  return Math.min(query.page, lastPage);
}
```

配套单测无需挂载组件：

```typescript
it('should_step_back_a_page_when_last_row_of_last_page_is_removed', () => {
  expect(resolvePageAfterRemoval({ ...query, page: 3, pageSize: 10 }, 21)).toBe(2);
});
```

### 错误示例
来源：`frontend/examples/golden/anti-examples.md`「11. Logic 层空转」：业务规则散落在页面与组件里。以下是两类典型污染：

```typescript
// ❌ Logic 依赖 UI：引入框架 Hook，无法脱离组件运行
import { useState } from 'react';
export function useUserRules() { const [errors, setErrors] = useState({}); /* … */ }

// ❌ Logic 直接产出 UI 反馈：把提示方式写死，换成弹窗或行内提示就要改 Logic
export function validateUser(values: UserFormData): void {
  if (!values.name) alert('请输入姓名');
}
```

正确形态：Logic 返回 `ValidationErrors`，由谁展示、怎么展示交给上层决定。

---

## FE-104 单向数据流原则
页面负责原始简单数据，传入各个组件/方法等，然后接受渲染完成/输出完成的最终成果。

### 定义
- **单向流动**：数据从页面流向组件/Logic，结果通过回调返回页面
- **原始简单数据**：从接口获取的原始数据，或从路由/Store 获取的基础数据
- **禁止反向依赖**：组件/Logic 不能反向调用页面方法、不能修改页面状态

### 数据流向
```
Page → Component（props 传入，event 上报）
Page → Logic（调用方法，返回结果）
Logic → Service（请求数据）
Logic ← Service（返回数据）
Page ← Logic（返回结果）
Page ← Component（回调上报）
```

### 强制要求
- 依赖只能向下：Page/Component → Hook → Logic → Service
- 允许跨层直连：Page/Component 可直接调 Logic
- 禁止向上/反向/循环依赖
- 组件不能调用父组件方法（通过回调上报事件）
- Logic 不能调用 Hook/UI

### 正确示例
来源：`frontend/examples/golden/list-page.md`「1. 筛选条件以 URL 为唯一来源」：筛选条以 URL 为唯一来源，组件全受控，自己不存筛选值。

```vue
<!-- ✅ 数据向下流动，事件向上冒泡：组件全受控，自己不存筛选值 -->
<TicketSearchBar
  :keyword="query.keyword"
  :status="query.status"
  @change="changeFilter"
/>
```

```typescript
// ✅ 唯一写入点在 URL；组件上报 → Logic 计算下一状态 → 写回 URL → 派生值自动更新
function changeFilter(patch: Partial<Omit<TicketListQuery, 'page'>>): void {
  router.replace({ query: serializeQueryToParams(applyFilterChange(query.value, patch)) });
}
```

### 错误示例
来源：`frontend/examples/golden/anti-examples.md`「6. 受控组件自持一份状态」：组件自持一份与 URL 平行的状态，形成两个写入点。

```typescript
// ❌ 组件自持一份与 URL 平行的状态，形成两个写入点
export const UserFilter: React.FC<UserFilterProps> = ({
  keyword: initialKeyword, role: initialRole, onFilterChange,
}) => {
  const [keyword, setKeyword] = useState(initialKeyword);   // 只在挂载时取一次
  const [role, setRole] = useState(initialRole);
```

后果：浏览器前进/后退或外部重置筛选时，URL 变了而组件内部不变。
`initialXxx` 这类命名本身就是双写入点的信号。

另一类反向依赖：

```typescript
// ❌ 组件直接修改父级状态：拿到父级 setter 或直接改传入对象
props.parentState.keyword = value;        // 改传入引用
props.setPageState({ ...props.pageState, page: 1 });   // 代父级决策
```

正确形态：组件只 `emit('change', patch)`，由页面/Hook 决定如何更新。

---

## 原则优先级

发生冲突时的判定顺序：
1. **宪法**（constitution.md）：禁止猜测、用户决策权、规范优先、已覆盖直接执行
2. **核心原则**（本文档）：四大核心原则
3. **具体规则**（其他 `frontend/rules/`）
4. **设计模式**（frontend/patterns/）

用户明确要求与原则冲突时：
1. 说明与哪条原则冲突
2. 解释原则存在的理由
3. 提供符合原则的替代方案
4. 如用户坚持，按用户要求执行并记录偏离

---

## 检查清单

每次实现前必须确认：
- [ ] 页面是否足够薄？是否有业务逻辑留在页面？
- [ ] 组件是否完全解耦？是否依赖外部实现？
- [ ] Logic 是否框架无关？是否可单独测试？
- [ ] 数据流是否单向？是否有反向依赖？
- [ ] 所有接口是否有 TypeScript 类型定义？
