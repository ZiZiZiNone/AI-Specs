# 示例：列表页

路径基准：本文所有裸路径相对规范库根 `<SPEC_ROOT>` 解析，首段为 `common/`、`frontend/` 或 `backend/`。见 `<SPEC_ROOT>/README.md`「路径基准」。本示例自包含，代码即规范结论的完整载体，不依赖外部工程。

示范：`frontend/patterns/list-page.md`「筛选/分页/排序以 URL 为唯一来源」、 `frontend/rules/store.md`「需刷新保持的状态一律以 URL 为唯一来源，不得以 Store 作为替代。」、 `frontend/rules/ui-states.md`「整体态保持 `success`，错误只经 `errorMessage` / Toast 呈现。」、 FE-101 `frontend/rules/core-principles.md`「FE-101 页面薄层原则」「页面内直接定义的函数不超过 3 个」。

## 1. 筛选条件以 URL 为唯一来源

**解决的问题**：若另存一份 ref，就有两个写入点，前进/后退或外部重置时两者不同步。
以 URL 为唯一来源后，该类 bug 从结构上消失。

来源：`hooks/useTicketQuery.ts`

```typescript
export function useTicketQuery() {
  const route = useRoute();
  const router = useRouter();

  // 不另存 ref：查询条件由 URL 实时解析得出
  const query = computed<TicketListQuery>(() =>
    parseQueryFromParams(route.query as Record<string, string | undefined>),
  );

  function push(next: TicketListQuery): void {
    router.replace({ query: serializeQueryToParams(next) });
  }

  return {
    query,
    changeFilter: (patch: Partial<Omit<TicketListQuery, 'page'>>) =>
      push(applyFilterChange(query.value, patch)),
    changePage: (page: number, pageSize: number) =>
      push(applyPageChange(query.value, page, pageSize)),
  };
}
```

序列化与解析成对实现于 Logic，且必须互逆（`logic/ticketQuery.logic.ts`）：

```typescript
/** 只输出与默认值不同的项，保持 URL 简短可读。规范示范形态，其余字段同理。 */
export function serializeQueryToParams(query: TicketListQuery): Record<string, string> {
  const defaults = createDefaultQuery();
  const params: Record<string, string> = {};
  if (query.page !== defaults.page) params.page = String(query.page);
  if (query.keyword) params.keyword = query.keyword;
  if (query.status !== defaults.status) params.status = query.status;
  if (query.pageSize !== defaults.pageSize) params.pageSize = String(query.pageSize);
  return params;
}
```

配套断言保证互逆（`logic/ticketQuery.logic.spec.ts`）：

```typescript
it('should_round_trip_query_through_url_serialization', () => {
  expect(parseQueryFromParams(serializeQueryToParams(original))).toEqual(original);
});
```

---

## 2. 改筛选必回第一页

**解决的问题**：在第 7 页改筛选条件，结果集变小后会停在不存在的页码上看到空列表。

来源：`logic/ticketQuery.logic.ts`

```typescript
export function applyFilterChange(
  current: TicketListQuery,
  patch: Partial<Omit<TicketListQuery, 'page'>>,
): TicketListQuery {
  return { ...current, ...patch, page: 1 };
}

/** 改 pageSize 同样回第一页；纯翻页不变。 */
export function applyPageChange(
  current: TicketListQuery,
  page: number,
  pageSize: number,
): TicketListQuery {
  const isPageSizeChanged = pageSize !== current.pageSize;
  return { ...current, pageSize, page: isPageSizeChanged ? 1 : page };
}

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

---

## 3. 刷新失败保留旧数据

**解决的问题**：一次网络抖动不应让用户已看到的数据整片消失。
整体态与操作反馈是两个维度（见 `frontend/rules/ui-states.md`「整体态与操作反馈的区分」，原文："整体态保持 `success`，错误只经 `errorMessage` / Toast 呈现。"）。

来源：`hooks/useTicketList.ts`

```typescript
async function load(): Promise<void> {
  // 已有数据时走"刷新"语义：保留旧数据，只显示顶部进度
  const hasData = state.value === 'success';
  if (hasData) isRefreshing.value = true;
  else state.value = 'loading';

  const { signal, isStale } = guard.start();
  const result = await fetchTicketList(query.value, { signal });

  if (isStale()) return;
  isRefreshing.value = false;

  if (!result.success) {
    if (result.error.code === 'CANCELED') return;  // 取消是预期行为，不是故障
    errorMessage.value = result.error.message;
    if (!hasData) state.value = 'error';           // 首次失败才整体转错误态
    return;
  }

  list.value = result.data.items;
  total.value = result.data.page.total;
  state.value = resolveListState(result.data.items);
}
```

---

## 4. 竞态双保险

**解决的问题**：仅靠 AbortController 无法覆盖"请求已返回但结果已过期"，
需配合序号判定。封装一次，供列表/详情/记录共用。

来源：`hooks/useRequestGuard.ts`

```typescript
export function useRequestGuard() {
  let activeController: AbortController | null = null;
  let latestToken = 0;

  function start() {
    // 发起新请求前先真正中断上一在途请求（单飞覆盖）
    activeController?.abort();
    const controller = new AbortController();
    activeController = controller;
    const token = ++latestToken;

    return {
      signal: controller.signal,
      // 纯查询：不提前清空 activeController，保证 abortAll() 仍可中止当前请求
      isStale: () => token !== latestToken,
      done: () => {
        if (activeController === controller) activeController = null;
      },
    };
  }

  function abortAll(): void {
    activeController?.abort();
    activeController = null;
    latestToken += 1;
  }

  onScopeDispose(abortAll);
  return { start, abortAll };
}
```

---

## 5. 乐观更新与快照回滚

**解决的问题**：快照必须写入前取；失败时反推原值在并发下会回滚成错误值。

来源：`hooks/useTicketActions.ts`

```typescript
async function changePriority(id: string, priority: TicketPriority): Promise<ActionOutcome> {
  const index = rows.value.findIndex((row) => row.id === id);
  if (index < 0) return { isSuccess: false, message: '工单已不在当前列表中' };

  const snapshot = rows.value[index].priority;   // 写入前取快照
  const optimistic = [...rows.value];
  optimistic[index] = { ...optimistic[index], priority };
  rows.value = optimistic;

  const result = await updateTicketPriority(id, priority);
  if (result.success) return { isSuccess: true, message: '优先级已更新' };

  const rolledBack = [...rows.value];
  const currentIndex = rolledBack.findIndex((row) => row.id === id);
  if (currentIndex >= 0) {
    rolledBack[currentIndex] = { ...rolledBack[currentIndex], priority: snapshot };
    rows.value = rolledBack;
  }
  return { isSuccess: false, message: result.error.message };
}
```

---

## 6. 页面只做组装

页面内仅 1 个函数、状态全部来自 Hook。行操作编排、确认弹窗分别在
`useTicketRowOperations`、`useTicketConfirm`（各有独立关注点，非搬运式抽取）。

来源：`pages/TicketListPage.vue`

```vue
<script setup lang="ts">
const { query, changeFilter, changePage, changeSort, goToPage } = useTicketQuery();
const list = useTicketList(query);
const formModal = useTicketFormModal(computed(() => session.user));
const rowOps = useTicketRowOperations({
  rows: list.list,
  query,
  total: list.total,
  reload: list.reload,
  goToPage,
});

const canCreate = computed(() => hasPermission(session.user, 'ticket:create'));

async function handleSubmit(): Promise<void> {
  if (await formModal.submit()) await list.reload();
}
</script>
```

五态由容器组件统一承担，页面不写 v-if 链。以下为 Vue 3 形态，小程序侧映射见 `frontend/frameworks/miniprogram/component.md`「业务组件一律受控」与 `frontend/frameworks/miniprogram/logic.md`「入参/返回值约定」。

```vue
<DataLoader
  :state="list.state.value"
  :error-message="list.errorMessage.value"
  empty-title="暂无工单数据"
  empty-description="调整筛选条件，或创建第一个工单"
  :empty-action-text="canCreate ? '新增工单' : ''"
  @retry="list.reload()"
  @empty-action="formModal.openCreate()"
>
  <TicketTable :rows="list.list.value" :user="session.user" @remove="rowOps.remove" />
</DataLoader>
```

## 小程序映射

机制结论以小程序框架规范为准：

- 分页纯函数：见 `frontend/frameworks/miniprogram/logic.md`「入参/返回值约定」：logic 函数入参只收普通值，失败表达走状态内 error 字段；取消语义见 `frontend/rules/async-operations.md`「取消不是错误」：被取消的请求须在上层被识别为预期行为；删除回退见 `frontend/frameworks/miniprogram/logic.md`「删除回退」：删除末页最后一条后退回上一页，避免停在空页。
- 受控筛选条：见 `frontend/frameworks/miniprogram/component.md`「业务组件一律受控」：值由 properties 传入，变更经事件上报，组件自身不持有业务状态。

## v2.0 关键修复说明（已同步至可运行切片 `frontend/frameworks/vue3/test/`）

1. **`useRequestGuard.start()` 真正取消旧请求**：发起新请求前必须先调用 `activeController?.abort()` 中断上一在途请求，再创建新 `AbortController` 并递增单调 `token`，避免旧请求滞留与 `controllers` 泄漏。
2. **刷新成功清空 `errorMessage`**：当刷新态重新请求成功时，必须将 `errorMessage` 重置为 `null`，避免旧错误条长期残留。
3. **翻页为空保持 `success` 态**：仅当 `page === 1 && items.length === 0` 时进入 `empty` 态；`page > 1` 返回空数组时保持 `success` 并提示“没有更多数据”。
4. **统一契约载荷与多值 Query 防护**：分页响应严格读取 `result.data.items` 与 `result.data.page.total`；解析 `route.query` 时兼容 `string | string[] | null`（取首值并校验合法正整数），禁止不安全强转。
