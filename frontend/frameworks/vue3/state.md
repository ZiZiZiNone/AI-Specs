# Vue 3 状态

Vue 3 侧状态实现细则。归属决策见 frontend/rules/store.md，本文只讲 Vue 侧怎么落。

## 归属到实现的映射

| 归属结论（frontend/rules/store.md） | Vue 侧实现 |
|---|---|
| 组件内自用 | `ref` / `reactive` 局部状态 |
| 父子/兄弟共享 | props 下发 + emit 上报，不用 provide 走捷径 |
| 刷新需保持（筛选/分页/排序/Tab） | `useRoute` + `router.replace`，不另存 ref |
| 跨页面共享且需响应式 | Pinia store |

---

## 局部状态

- 派生值一律 `computed`，不冗余存一份。
- 整体替换的集合用 `shallowRef`，按字段写入的表单值用 `reactive`
  （选型判据见 reactivity.md）。
- 解构 `reactive` 必须经 `toRefs`，否则丢响应性。

---

## URL 状态

需刷新保持的状态以 URL 为唯一来源，**不再另存一份 ref**——
两个写入点必然带来前进/后退不同步的问题。

```typescript
// ✅ 由 URL 实时解析得出，解析/序列化成对放在 Logic
const query = computed<TicketListQuery>(() =>
  parseQueryFromParams(route.query as Record<string, string | undefined>),
);

function push(next: TicketListQuery): void {
  router.replace({ query: serializeQueryToParams(next) });
}
```

来源：`frontend/test/vue/src/hooks/useTicketQuery.ts`；完整示例见 frontend/examples/golden/list-page.md 第 1 节。

**约定**：
- 用 `router.replace` 而非 `push`：筛选变化不应在浏览器历史里堆积条目。
- 解析必须容错：URL 可被手工编辑，非法值回落默认值，不抛异常。
- 解析与序列化须互逆，并有往返断言（见 common/rules/test.md）。

---

## Pinia store

用 setup 语法（与组合式 API 一致，类型推导更直接）：

```typescript
// ✅ setup store
export const useSessionStore = defineStore('session', () => {
  const user = ref<SessionUser | null>(null);
  const state = ref<UIState>('idle');
  const errorMessage = ref('');

  async function loadSession(): Promise<void> { /* … */ }

  return { user, state, errorMessage, loadSession };
});
```

**规则**：
- store 只做状态读写与 action 编排，**不写业务判断**。
  权限判定、状态流转这类规则留在 Logic，store 调用它。
- store 的 action 可以调用 Service 加载自身状态，但仅限
  「该 store 自己拥有的状态」（如 session store 加载当前用户）。
  **禁止**在 store 里加载页面业务数据（列表/详情），那属于 Hook 的职责。
- 不在 store 里持有可由 URL 承载的状态（筛选、分页）。
- 不在 store 里放只有一个页面用的状态。

### store 与 Hook 的分界

```
问：这份状态归谁？
  ├─ 应用级、跨页面、生命周期跟随会话（当前用户、权限、全局配置、未读数）
  │    → store，加载写在 store 的 action 里
  └─ 页面级、跟随页面进出（列表数据、详情、表单）
       → Hook，store 不参与
```

理由：把页面数据放进 store 会让状态生命周期与页面脱钩——
离开页面数据仍在，再进入时可能读到上一次的残留。

来源：`frontend/test/vue/src/store/session.store.ts`（仅 session 进 store，
工单列表/详情/表单全部由 Hook 承载）。

---

## 组件消费 store 的边界

- **页面**可直接 `useXxxStore()`。
- **展示组件禁止 import store**（core-principles P2）：
  所需数据由 props 传入，否则组件与全局状态耦合，无法独立渲染与测试。

```vue
<!-- ✅ 页面取 store，往下传值 -->
<TicketTable :rows="list.list.value" :user="session.user" />
```

```vue
<!-- ❌ 展示组件自己取全局状态 -->
<script setup>
const session = useSessionStore();   // 组件被绑死在 store 上
</script>
```

---

## 检查清单

- [ ] 归属结论与 frontend/rules/store.md 决策树一致
- [ ] 派生值用 computed，未冗余存储
- [ ] 刷新需保持的状态在 URL，且未另存 ref
- [ ] URL 解析容错，解析↔序列化互逆并有断言
- [ ] store 用 setup 语法
- [ ] store 内无业务判断（判定调用 Logic）
- [ ] store 只加载自身拥有的状态，未承载页面业务数据
- [ ] store 内无可由 URL 承载的状态
- [ ] 展示组件未 import store
- [ ] reactive 解构经 toRefs
