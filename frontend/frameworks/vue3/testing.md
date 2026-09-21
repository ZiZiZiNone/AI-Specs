# Vue 3 测试

通用测试原则见 common/rules/test.md（测行为不测覆盖率、命名 `should_xxx_when_xxx`、
边界含临界点、mock 须标注）。本文只讲 Vue 侧怎么落。

## 测什么层，用什么方式

| 被测对象 | 方式 | 环境 |
|---|---|---|
| Logic 纯函数 | 直接调用，无需 Vue | `node` |
| Service / 错误归一 | 直接调用 + mock transport | `node` |
| composable | `withSetup` 包裹后调用 | `jsdom` |
| 组件渲染与交互 | `@vue/test-utils` 挂载 | `jsdom` |

**优先级**：Logic 与 Service 必测，composable 按复杂度测，组件只测关键交互。
理由是前两者是业务正确性的落点且成本最低——纯函数进出，不需要任何框架设施。

```typescript
// ✅ 默认环境设 node，组件与 composable 测试文件单独声明 jsdom
// vite.config.ts
test: {
  environment: 'node',
  include: ['src/**/*.spec.ts'],
}
```

需要 DOM 的文件在顶部加 `// @vitest-environment jsdom`，避免为少数组件测试拖慢全量。

---

## Logic 测试

不引入任何 Vue API，断言业务规则本身：

```typescript
// ✅ 纯函数进出，无挂载、无 mock
it('should_step_back_a_page_when_last_row_of_last_page_is_removed', () => {
  expect(resolvePageAfterRemoval({ ...query, page: 3, pageSize: 10 }, 21)).toBe(2);
});

// ✅ 可逆操作断言互逆（见 `common/rules/test.md`「规则」：可逆操作须有互逆断言）
it('should_round_trip_query_through_url_serialization', () => {
  expect(parseQueryFromParams(serializeQueryToParams(original))).toEqual(original);
});
```

来源：`frontend/examples/golden/list-page.md`「2. 改筛选必回第一页」同类形态：纯函数进出，无挂载、无 mock；可逆操作断言互逆同类形态。

**若 Logic 测试需要挂载组件或 mock 路由，说明该 Logic 不纯**——
这是分层出问题的信号，应先修 Logic 而不是给测试加设施。

---

## composable 测试

下方为最小 setup 宿主、清理与竞态断言形态，新增 composable 测试时照此形态手写，
并确认 `@vue/test-utils`、`jsdom` 仍在 devDependencies。

composable 依赖组件实例作用域（`onScopeDispose`、`inject` 等），
须在一个最小 setup 内调用：

```typescript
// @vitest-environment jsdom
// ✅ 最小宿主，拿到返回值同时保留作用域以便测清理（需 DOM，故声明 jsdom）
function withSetup<T>(composable: () => T): [T, App] {
  let result!: T;
  const app = createApp({
    setup() {
      result = composable();
      return () => null;
    },
  });
  app.mount(document.createElement('div'));
  return [result, app];
}

it('should_abort_inflight_request_when_scope_disposed', async () => {
  const [guard, app] = withSetup(() => useRequestGuard());
  const { signal } = guard.start();
  app.unmount();                       // 触发 onScopeDispose
  expect(signal.aborted).toBe(true);
});
```

被测对象 `useRequestGuard` 见 `frontend/examples/golden/list-page.md`「4. 竞态双保险」，确有
`onScopeDispose(abortAll)`，故该断言与实现相符；该测试为规范示范形态，新增 composable 测试时照此形态手写。

**规则**：
- 依赖路由的 composable，注入真实 router 的 memory history，不 mock `useRoute`——
  mock 掉就测不到"解析是否容错""replace 是否真的改了 URL"。
- 断言响应式结果时须 `await nextTick()` 后再读，否则读到更新前的值。
- 竞态类 composable 必须测「后发先至」：先发的请求晚返回时结果应被丢弃。
- 清理类行为（取消请求、清定时器）必须测，否则等于没写清理。

---

## 组件测试

组件测试为规范示范形态：`data-test` 选择器、emit 载荷断言。新增组件测试时照此形态手写；交互元素须带 `data-test` 属性。

只测「给定 props 渲染出什么」与「交互是否上报正确事件」：

```typescript
// @vitest-environment jsdom
// 规范示范形态，交互元素须带 data-test 属性
it('should_emit_remove_with_row_when_delete_clicked', async () => {
  const wrapper = mount(TicketTable, { props: { rows: [row], user: adminUser, /* … */ } });
  await wrapper.find('[data-test="remove"]').trigger('click');
  expect(wrapper.emitted('remove')?.[0]).toEqual([row]);
});
```

**规则**：
- 选择器用 `data-test` 属性，不用 class 或组件库内部结构——
  后者会因组件库升级或样式调整而碎。
- 断言 emit 载荷，不断言组件内部状态。
- 不测组件库自身行为（Table 怎么排版、Modal 怎么动画）。
- 权限、状态映射类断言优先在 Logic 层测，组件层只验证"传入不同 user 时按钮出现与否"。
- 组件内若需要 store，通过 `createTestingPinia` 注入初始 state，不真调接口。

---

## 不测什么

- 组件库的既有能力。
- 类型层面已保证的事（`ComputedRef` 不能赋给 `Ref` 由 `vue-tsc` 保证，不写运行时断言）。
- 内部函数与 DOM 结构细节。
- 为提升覆盖率而对 getter/纯转发函数补测。

---

## 检查清单

- [ ] Logic 与 Service 有测试，且不依赖 Vue
- [ ] Logic 测试无需挂载组件（若需要则说明分层有问题）
- [ ] 默认测试环境为 node，需 DOM 的文件单独声明 jsdom
- [ ] composable 在最小 setup 内测试，清理行为有断言
- [ ] 竞态 composable 有「后发先至」断言
- [ ] 依赖路由的 composable 用 memory history，未 mock useRoute
- [ ] 读响应式结果前已 await nextTick
- [ ] 组件测试用 data-test 选择器
- [ ] 组件测试断言 emit 载荷，未断言内部状态
- [ ] 未测组件库自身行为
- [ ] mock 已按 common/rules/test.md 标注
