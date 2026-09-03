# 示例：列表页

来源：`test/vue/src/`（Vue 3 + Arco + Tailwind，已过 checklists 自检）
示范：patterns/list-page.md、rules/store.md 状态归属、rules/ui-states.md、core-principles P1

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
/** 只输出与默认值不同的项，保持 URL 简短可读。 */
export function serializeQueryToParams(query: TicketListQuery): Record<string, string> {
  const defaults = createDefaultQuery();
  const params: Record<string, string> = {};
  if (query.page !== defaults.page) params.page = String(query.page);
  if (query.keyword) params.keyword = query.keyword;
  // …其余同理
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
整体态与操作反馈是两个维度（rules/ui-states.md）。

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

  list.value = result.data.list;
  total.value = result.data.total;
  state.value = resolveListState(result.data.list);
}
```

---

## 4. 竞态双保险

**解决的问题**：仅靠 AbortController 无法覆盖"请求已返回但结果已过期"，
需配合序号判定。封装一次，供列表/详情/记录共用。

来源：`hooks/useRequestGuard.ts`

```typescript
export function useRequestGuard() {
  const controllers = new Set<AbortController>();
  const latestToken = ref(0);

  function start() {
    const controller = new AbortController();
    controllers.add(controller);
    latestToken.value += 1;
    const token = latestToken.value;

    return {
      signal: controller.signal,
      // 期间又发起了新请求，本次结果作废
      isStale: () => {
        controllers.delete(controller);
        return token !== latestToken.value;
      },
    };
  }

  function abortAll(): void {
    for (const controller of controllers) controller.abort();
    controllers.clear();
    latestToken.value += 1;
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

五态由容器组件统一承担，页面不写 v-if 链：

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

与本示例同属列表分页与筛选主题的小程序侧已落地用例，机制结论以小程序框架规范为准：

- 分页纯函数：`test/miniprogram/src/logic/pagination.ts`（入参只收值与前状态快照，失败走 error 字段不抛异常，取消静默），用例见 `test/miniprogram/src/logic/pagination.spec.ts`（5 个）。框架约定见 `frameworks/miniprogram/logic.md`。
- 受控筛选条：`test/miniprogram/src/components/filter-bar/`（keyword 经 properties 传入，变更经 change 事件上报），用例见 `test/miniprogram/src/components/filter-bar/filter-bar.spec.ts`（miniprogram-simulate v1.6.2）。框架约定见 `frameworks/miniprogram/component.md`，用例状态见 `test/miniprogram/README.md`。
