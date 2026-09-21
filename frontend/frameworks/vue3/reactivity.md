# Vue 3 响应式

路径基准：本文所有裸路径相对规范库根 `<SPEC_ROOT>` 解析。见 `<SPEC_ROOT>/README.md`「路径基准」。

ref / reactive / shallowRef 的选择与 watch 使用边界。

## 选择决策

```
问：要存的是什么？
  ├─ 基本类型（string/number/boolean/null）→ ref
  ├─ 整体替换的数组或对象（列表数据、详情对象）→ shallowRef
  ├─ 需要按字段读写的表单值对象 → reactive
  └─ 能由其他状态算出 → computed（不要存）
```

### ref
- 基本类型一律用 ref。
- 需要整体替换引用、且内部不做深层字段读写时也用 ref。

### shallowRef
- **列表数据、详情对象等"整体替换"的引用类型优先 shallowRef**。
- 理由：这类数据每次都是接口返回的新对象，深层代理无收益，只增加代理开销；
  且能避免"改了内部字段却期待整体刷新"的模糊写法。
- 更新方式必须是整体赋值：`list.value = next`，不得 `list.value.push(x)`。

```typescript
// ✅ 列表整体替换
const list = shallowRef<Ticket[]>([]);
list.value = result.data.list;

// ✅ 行内乐观更新也整体替换
const next = [...list.value];
next[index] = { ...next[index], priority };
list.value = next;
```

```typescript
// ❌ 用 shallowRef 却做深层修改，视图不更新
list.value[index].priority = 'urgent';
```

### reactive
- 仅用于**需要按字段读写**的场景，典型是表单值对象。
- 理由：表单要支持 `values[field] = value` 的字段级写入，用 ref 需处处 `.value` 且整体
  替换会让受控组件失焦。
- 解构必须用 `toRefs`，否则丢失响应性。
- **禁止嵌套 reactive**：不要把已经是 reactive/ref 的对象再包一层 `reactive({...})`，
  会产生两个代理身份，写入与读取可能走不同代理导致读到旧值。

```typescript
// ✅ 表单值按字段写入
const values = reactive<TicketFormValues>(createEmptyFormValues());
values[field] = value;

// ✅ 组装视图模型用 computed，不再包 reactive
const viewModel = computed(() => ({
  values,
  errors,
  isSubmitting: isSubmitting.value,
}));
```

```typescript
// ❌ 嵌套 reactive：values 被二次代理，写入与模板读取可能不是同一代理
const viewModel = reactive({
  values,
  isSubmitting: computed(() => isSubmitting.value),
});
```

「嵌套 reactive」这一条属机制类结论（依据 Vue 的代理身份语义），
成立理由已写明，可用一个最小复现验证。

> 见 `frontend/examples/golden/README.md`「示例教什么、不教什么」。

### computed
- 派生值一律 computed，不冗余存一份（见 `frontend/rules/store.md`「派生值实时计算（selector/计算属性），不冗余存一份」）。
- computed 内禁止副作用（请求、赋值、写 Store）。

---

## watch 使用边界

### 触发源
- 监听 ref/computed：直接传入，不要写成 `() => x.value` 除非需要取子字段。
- 监听多个源用数组形式，不要写多个 watch 做同一件事。

### immediate
- 需要"进入即执行一次"时用 `immediate: true`，不要另写一次 onMounted 调用。
- 与 `deep` 同时开启前先确认触发源是否真的会深层变化。

### deep
- **仅在触发源是 reactive 对象或含嵌套结构的 ref 时使用**。
- 触发源是 computed 且每次返回新对象时，`deep` 无意义且会放大开销——
  新对象引用本身已足够触发。
- 监听查询条件这类"整体重算"的 computed，不加 deep。

```typescript
// ✅ 查询条件是 computed，引用变化即触发
watch(query, load, { immediate: true });

// ✅ 表单值是 reactive，需要 deep 才能感知字段变化
watch(values, markDirty, { deep: true });
```

### flush
- 默认 `flush: 'pre'`，不要随意改。
- 需要读取更新后的 DOM 时才用 `flush: 'post'`，并说明原因。
- `flush: 'sync'` 禁用（易造成重复触发与死循环），除非有明确记录的理由。

### 副作用清理
- watch 内启动的定时器/请求，必须在 `onWatcherCleanup` 或 `onScopeDispose` 中清理。
- 切换监听目标时先取消上一目标的在途请求（见 composable.md 竞态处理）。

```typescript
// ✅ 切换 id 时取消旧请求再加载
watch(
  id,
  () => {
    guard.abortAll();
    void load();
  },
  { immediate: true },
);
```

### 禁止
- ❌ watch 内写业务判断（下沉 Logic）
- ❌ 用 watch 同步两个状态（改用 computed 派生）
- ❌ watch 里再改自己的触发源（循环触发）

---

## 检查清单

- [ ] 基本类型用 ref，整体替换的引用类型用 shallowRef
- [ ] reactive 仅用于按字段读写的表单值
- [ ] 无嵌套 reactive（未对已响应式对象二次包装）
- [ ] reactive 解构用了 toRefs
- [ ] shallowRef 的更新是整体赋值，无深层字段修改
- [ ] 派生值用 computed，未冗余存储
- [ ] computed 内无副作用
- [ ] deep 仅用于 reactive 或嵌套结构，未加在返回新对象的 computed 上
- [ ] flush 保持默认，改动有说明
- [ ] watch 内的定时器/请求有清理
- [ ] watch 内无业务判断、无状态同步、无自触发
