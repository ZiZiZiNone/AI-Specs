# Vue 3 组合式函数

路径基准：本文所有裸路径相对规范库根 `<SPEC_ROOT>` 解析。见 `<SPEC_ROOT>/README.md`「路径基准」。

composable（useXxx）的入参、返回值、清理与竞态约定。
职责边界见 `frontend/rules/architecture.md`「分层职责」：Hook 为 UI 侧的状态与副作用复用单元；量化标准见 FE-101 `frontend/rules/core-principles.md`「FE-101 页面薄层原则」；
拆分判据见 `frontend/protocol/decision-trees.md`「Hook 拆分决策」。

## 命名与位置
- 位置：`src/hooks/`，文件名与函数同名（camelCase，`useTicketList.ts`）。
- 以 `use` 开头；名字必须指向关注点，禁止 `usePageLogic`、`useXxxHandlers` 这类聚合命名。
- 不返回模板/JSX；不 import UI 组件。

---

## 入参约定

### 响应式入参用 Ref 类型，不用裸对象
```typescript
// ✅ 只读引用，兼容 ref 与 computed
export function useTicketList(query: Readonly<Ref<TicketListQuery>>) {}

// ❌ 裸结构类型：computed 传入时类型不兼容，且丢失响应式语义
export function useTicketList(query: { value: TicketListQuery }) {}
```

**规则**：
- composable 内部只读的响应式入参，一律标注 `Readonly<Ref<T>>`。
  `computed()` 返回 `ComputedRef<T>`（只读），不可赋给 `Ref<T>`，用后者会导致类型不兼容。
- composable 内部需要写入的入参，标注 `Ref<T>`，并在文档注释说明会被修改。
- 非响应式配置用普通对象参数（`options: { delayMs?: number }`）。
- 禁止把整个 Store 实例作为入参；只传所需的 ref 或 computed。

本条属机制类结论（依据 Vue 的 `ComputedRef` 只读性），成立理由已写在规则内，
可用一次 `vue-tsc` 复核。

> 见 `frontend/examples/golden/README.md`「示例教什么、不教什么」。

### 入参不做业务判断
入参进来后若需要判断/换算，下沉到 Logic，composable 只负责调用。

---

## 返回值形态

### 统一返回「ref 集合」，不返回 reactive 对象
```typescript
// ✅ 返回 ref 集合，调用方用 .value 访问，来源清晰
return { list, total, state, errorMessage, reload };

// ❌ 返回 reactive 包装：调用方不写 .value，
// 与其他 composable 混用时形态不一致，且嵌套代理有读写不一致风险
return reactive({ list, total, state });
```

**规则**：
- 返回对象的字段是 ref / computed / 函数，不对返回值整体套 `reactive`。
- 需要对外提供组装好的只读视图时，用 `computed` 暴露单个成员，而非 `reactive` 聚合。
- 只读状态优先暴露 `computed`，避免调用方直接改写内部状态。
- 暴露成员不超过 10 个（超出说明关注点过多，见拆分判据）。
- 不要既返回 `state` 又返回 `isLoading`、`isEmpty` 这类可由 state 算出的冗余字段。

### 命名一致性
同类 composable 的返回字段名保持一致，便于替换与阅读：

| 语义 | 字段名 |
|---|---|
| 数据 | `list` / `detail` / `logs` |
| 总数 | `total` |
| 整体态 | `state`（UIState） |
| 错误信息 | `errorMessage` |
| 刷新中（已有数据） | `isRefreshing` |
| 追加加载中 | `isLoadingMore` |
| 重新加载 | `reload` |

---

## 生命周期与清理

### 必须清理的资源
- 定时器（防抖/节流/轮询）
- 在途请求（AbortController）
- 事件监听、ResizeObserver 等外部订阅

### 用 onScopeDispose 而非 onUnmounted
```typescript
// ✅ 作用域级清理，在非组件作用域（effectScope）中同样生效
onScopeDispose(abortAll);

// ❌ 仅组件卸载时触发，composable 被用在 effectScope 内会漏清理
onUnmounted(abortAll);
```

### 副作用不得在模块顶层启动
composable 内的请求/定时器只能在被调用后启动，禁止写在模块作用域。

---

## 竞态与取消

### 双保险：取消 + 失效判定
仅靠 AbortController 不足以覆盖"请求已返回但结果已过期"的情形，需配合序号判定。

```typescript
// ✅ 统一封装，避免每个 composable 各写一遍
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
      isStale: () => {
        controllers.delete(controller);
        return token !== latestToken.value;
      },
    };
  }

  function abortAll() {
    for (const c of controllers) c.abort();
    controllers.clear();
    latestToken.value += 1;
  }

  onScopeDispose(abortAll);
  return { start, abortAll };
}
```

**规则**：
- 每次发起请求前 `start()`，写入状态前先判 `isStale()`，过期结果直接丢弃。
- 切换目标（如详情页 id 变化）时先 `abortAll()` 再加载。
- 取消导致的失败（`code === 'CANCELED'`）**不得写入错误态**——那是预期行为，不是故障。

```typescript
// ✅ 取消不算错误
if (!result.success) {
  if (result.error.code === 'CANCELED') return;
  errorMessage.value = result.error.message;
}
```

---

## 与 Logic 的分工
- composable 只做：状态持有、副作用调度、生命周期、竞态。
- 业务判断、数据转换、校验规则一律在 Logic，composable 调用其结果。
- 判断方法：把 composable 里的 `if` 逐个问"这是 UI 时机判断还是业务规则"，
  后者必须下沉。

```typescript
// ✅ 五态判定在 Logic，composable 只赋值
state.value = resolveListState(result.data.list);

// ❌ 业务判定写在 composable 里
state.value = result.data.list.length > 0 ? 'success' : 'empty';
```

---

## 检查清单

- [ ] 命名指向单一关注点，非 usePageLogic 式聚合
- [ ] 响应式入参标注 Readonly<Ref<T>>（只读）或 Ref<T>（会写入）
- [ ] 未把 Store 实例整体作为入参
- [ ] 返回 ref 集合，未对返回值整体套 reactive
- [ ] 无可由 state 算出的冗余返回字段
- [ ] 暴露成员不超过 10 个
- [ ] 返回字段命名与同类 composable 一致
- [ ] 定时器/请求/订阅在 onScopeDispose 中清理
- [ ] 请求有竞态保护（取消 + 失效判定）
- [ ] 取消导致的失败未写入错误态
- [ ] 内部无业务判断（已下沉 Logic）
- [ ] 不返回模板/JSX，不 import UI 组件
