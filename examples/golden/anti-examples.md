# 负向示例集

来源：`test/react/`（React 18 + TS，**未按本规范落地**，且缺 `package.json`/`main.tsx`，无法构建）
用途：这些是真实产出的违规代码，用于识别常见偏离。每条给出违反条目与正确做法。

> 说明：该项目是本规范早期未覆盖时的产物。保留它比删除更有价值——
> 它记录了「不加约束时 AI 会怎么写」，是校验规范有效性的对照组。

---

## 1. 页面直接调用 Service

违反：core-principles P3、rules/architecture.md（依赖只能向下，页面不越层）

来源：`pages/UserListPage.tsx:16, 155-190`

```typescript
// ❌ 页面 import Service，并在事件处理里直接发请求 + 手写反馈
import * as userService from '../services/user.service';

const handleDelete = useCallback(async (userId: string) => {
  const confirmed = window.confirm('确定要删除该用户吗？此操作无法撤销。');
  if (!confirmed) return;

  const result = await userService.deleteUser(userId);
  if (result.success) {
    alert('删除成功');
    await refreshUsers();
  } else {
    alert(result.error?.message || '删除失败');
  }
}, [refreshUsers]);
```

问题：删除的编排（确认→请求→反馈→刷新→页码修正）落在页面里，
换一个入口（详情页删除）就要复制一遍；且 `window.confirm`/`alert` 不可测试。

**正确做法**：编排进 Hook，页面只调用。参见 `list-page.md` 第 6 节。

```typescript
// ✅ 页面
const rowOps = useTicketRowOperations({ rows, query, total, reload, goToPage });
// <TicketTable @remove="rowOps.remove" />
```

---

## 2. 展示型组件自己加载数据

违反：core-principles P2（组件完全解耦：组件不自取数据）

来源：`components/UserFormModal.tsx:44-67`

```typescript
// ❌ 弹窗组件内部发请求取详情
const loadUserDetail = async (userId: string) => {
  setIsLoadingDetail(true);
  const result = await userService.fetchUserDetail(userId);
  setIsLoadingDetail(false);
  if (result.success && result.data) {
    setInitialData({ name: result.data.name, /* … */ });
  } else {
    setLoadError(result.error?.message || '加载用户信息失败');
  }
};
```

问题：组件与接口绑定，无法在其他数据源下复用，也无法单独渲染测试；
详情加载失败的错误态被埋在组件内部，页面无法感知。

**正确做法**：数据由 Hook 取，组件通过 props 接收 `initialValues` / `isLoading` / `errorMessage`。

---

## 3. 竞态保护形似而无实效

违反：rules/async-operations.md（竞态处理）

来源：`hooks/useUserList.ts:28-45`

```typescript
// ❌ 建了 AbortController 但 signal 从未传给请求
abortControllerRef.current = new AbortController();
currentParamsRef.current = params;

const result = await userService.fetchUserList(params);  // 没有 signal

// ❌ 比较对象引用：两次相同条件的加载会误判为过期
if (currentParamsRef.current !== params) return;
```

三处失效：
- `signal` 未下传，`abort()` 不会中断任何请求。
- Service 签名 `fetchUserList(params)` 根本不接受 `signal`，缺口在接口设计层。
- 用对象引用做新旧判定，语义不稳定（同值不同引用 / 同引用重复调用）。

**正确做法**：Service 统一接受 `{ signal }`，Hook 用单调序号判定。
参见 `list-page.md` 第 4 节 `useRequestGuard`。

---

## 4. 每个接口重复 try-catch

违反：rules/async-operations.md（收敛到统一请求出口）

来源：`services/user.service.ts` —— 10 个函数各写一遍：

```typescript
// ❌ ×10
export async function fetchUserList(params: UserListParams) {
  try {
    const response = await axios.get('/api/users', { params, timeout: 10000 });
    return { success: true, data: response.data.data };
  } catch (error) {
    return { success: false, error: transformError(error) };
  }
}
```

问题：`timeout: 10000` 在 10 处硬编码；新增接口靠复制，
漏写 try-catch 就会抛到调用方；错误归一规则随时间漂移。

**正确做法**：单一 `httpClient` 承担 try-catch/超时/重试，业务方法只描述接口语义。
参见 `service-layer.md` 第 1 节。

---

## 5. retryable 计算了但没人用

违反：rules/error-handling.md（错误字段须被消费）、anti-patterns/hidden-side-effect.md

来源：`services/user.service.ts:30,40,56,68,…`

```typescript
// ❌ 每个错误都标了 retryable，但全项目没有一处读取它
return { code: 'TIMEOUT', message: '请求超时', type: 'network', retryable: true };
```

问题：字段成为装饰。规范要求的不是"有这个字段"，而是"重试策略由它驱动"。

这是「无消费者产物」的典型形态，判据见 `protocol/task-boundary.md`：加东西前先指出消费者。

**正确做法**：`retryable` 作为重试循环的判据，并与幂等性共同决定是否重试。
参见 `service-layer.md` 第 3 节。

---

## 6. 受控组件自持一份状态

违反：core-principles P4（单向数据流）、rules/store.md（状态单一来源）

来源：`components/UserFilter.tsx:43-45`

```typescript
// ❌ props 传入初值后组件另存三份 state，与 URL 形成双写入点
export const UserFilter: React.FC<UserFilterProps> = ({
  keyword: initialKeyword, role: initialRole, status: initialStatus, onFilterChange,
}) => {
  const [keyword, setKeyword] = useState(initialKeyword);
  const [role, setRole] = useState<UserRole | undefined>(initialRole);
  const [status, setStatus] = useState<UserStatus | undefined>(initialStatus);
```

问题：`initialXxx` 命名暴露了它只在挂载时取一次——
浏览器前进/后退、外部重置筛选时，URL 变了而组件内部不变。

**正确做法**：筛选条件以 URL 为唯一来源，组件全受控（`value` + `onChange`）。
仅"输入中的草稿值"可短暂本地持有，防抖后立即上报。参见 `list-page.md` 第 1 节。

---

## 7. 校验层放弃类型

违反：rules/typescript.md（禁止 any）

来源：`logic/userValidation.logic.ts:14`

```typescript
// ❌ validator 参数为 any，规则写错字段名不会被发现
export interface ValidationRule {
  validator?: (value: any, formData?: Partial<UserFormData>) => boolean;
  message: string;
}
```

**正确做法**：规则表按字段泛型化，`validator` 拿到该字段的精确类型。

```typescript
// ✅
export type ValidationRules<T> = { [K in keyof T]?: ValidationRule<T[K]>[] };
export interface ValidationRule<V> {
  validator?: (value: V) => boolean;
  message: string;
}
```

---

## 8. 注释复述代码

违反：AGENTS.md B 类行为准则、rules/comment.md（注释写"为什么"）

来源：`logic/userValidation.logic.ts`、`pages/UserListPage.tsx` 多处

```typescript
// ❌ 说的都是代码本身已经写明的事
// 必填验证
if (rule.required && isEmpty(value)) return rule.message;

// 处理筛选变化
const handleFilterChange = useCallback(/* … */);
```

对照一条有价值的注释（来自 test/vue）：

```typescript
// ✅ 解释了不这样写会出什么问题
// 非必填字段留空时跳过后续规则，否则空值会撞上格式校验
if (isEmptyValue(value)) return null;
```

---

## 9. useEffect 依赖注释掩盖问题

违反：rules/async-operations.md、frameworks/react/hook.md

来源：`pages/UserListPage.tsx:44-46`

```typescript
// ❌ 用注释解释为何要漏依赖，而不是消除漏依赖的必要性
useEffect(() => {
  loadUsers(listParams);
}, [searchParams]); // 依赖 searchParams 而不是 listParams，避免重复渲染
```

问题：`listParams` 每次渲染都是新对象，所以只能挂 `searchParams`——
根因是"从 URL 解析出的对象没有稳定标识"，注释只是绕开它。

**正确做法**：让查询条件本身成为稳定派生值（`computed` / `useMemo` 依赖序列化串），
或把加载触发放进以 URL 字符串为依赖的 Hook 内部。

---

## 10. 页面承担 13 个函数

违反：core-principles P1（薄页面：≤3 个函数、≤5 个状态变量）

来源：`pages/UserListPage.tsx` —— `updateURLParams`、`handleFilterChange`、
`handleResetFilter`、`handleSort`、`handlePageChange`、`handlePageSizeChange`、
`handleCreate`、`handleEdit`、`handleModalClose`、`handleFormSubmit`、
`handleView`、`handleDelete`、`handleToggleStatus`。

**正确做法**：按关注点分组抽 Hook（查询编排 / 行操作 / 弹窗），
每个 Hook 须有独立关注点，不是把函数搬个位置。
判据见 protocol/decision-trees.md「Hook 拆分决策」。

---

## 11. Logic 层空转

违反：rules/architecture.md（Logic 是业务规则的落点）、rules/business-rule.md

现象：4 个 Hook 全部直接调 Service，Logic 只做 URL 解析与参数拼装，
业务规则（谁能删、什么状态能改优先级、删除末页最后一条后去哪页）散落在页面与组件里。

**正确做法**：可判定的业务规则一律下沉 Logic 并可单测。
参见 `list-page.md` 第 2 节 `resolvePageAfterRemoval`、
`form-validation.md` 第 4 节 `resolveVisibleFields`。

---

## 12. 缺少可运行的最小闭环

违反：protocol/final-gate.md（验证要求）

现象：22 个 `.tsx/.ts` 源文件齐备，但没有 `package.json`、`tsconfig.json`、`main.tsx`，
`axios` 从未声明为依赖——项目从一开始就不可能通过构建。

**正确做法**：工程骨架先于业务代码；无法执行构建时，须按
protocol/final-gate.md 的「无法验证时的处理」显式声明未验证项，
不得以"代码已写完"当作完成。
