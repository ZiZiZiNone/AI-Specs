# Vue 3 路由

vue-router 约定。路由承载「刷新后需保持的状态」，是状态归属决策树的第 3 层实现。

## 路由定义

```typescript
// ✅ 页面组件一律懒加载；name 用于跳转，避免硬编码路径
const routes: RouteRecordRaw[] = [
  { path: '/', redirect: '/tickets' },
  {
    path: '/tickets',
    name: 'ticket-list',
    component: () => import('@/pages/TicketListPage.vue'),
  },
  {
    path: '/tickets/:id',
    name: 'ticket-detail',
    component: () => import('@/pages/TicketDetailPage.vue'),
  },
];
```

来源：`frontend/test/vue/src/router/index.ts`

**规则**：
- 页面组件用 `() => import()` 懒加载，非页面组件不需要。
- 跳转优先用 `name` + `params`，不拼字符串路径——路径变更时不必全局搜索替换。
- 路由层级对应 URL 语义，不为复用布局而制造无意义嵌套。
- 路由文件只做映射与守卫，**不写业务判断**（权限规则在 Logic）。

---

## 参数 vs 查询

| 用途 | 位置 | 例 |
|---|---|---|
| 标识唯一资源 | path params | `/tickets/:id` |
| 筛选、分页、排序、Tab | query | `?keyword=x&page=2` |

**理由**：params 变化意味着"看的是另一个资源"，query 变化意味着"同一集合的不同视图"。
混用会导致面包屑、返回逻辑、缓存键难以判定。

query 的读写约定（唯一来源、容错解析、replace 而非 push、只序列化非默认值）
见 state.md「URL 状态」，本文不重复。

---

## 守卫

守卫只做「拦截与重定向」，判定逻辑调用 Logic：

```typescript
// ✅ 守卫编排，规则在 Logic
router.beforeEach((to) => {
  const session = useSessionStore();
  if (!session.user) return true;                    // 未加载完不在此处阻塞
  if (!canAccessRoute(session.user, to.name)) {      // 判定在 Logic
    return { name: 'forbidden' };
  }
  return true;
});
```

```typescript
// ❌ 权限规则写进守卫：换个入口（菜单渲染、按钮禁用）就要复制一遍
router.beforeEach((to) => {
  if (to.path.startsWith('/admin') && user.role !== 'admin') return '/403';
});
```

**规则**：
- 守卫内禁止发起业务数据请求。需要预取数据时在页面/Hook 内做，
  否则跳转会被网络延迟阻塞，且失败无处展示。
- 会话/权限的加载在应用启动时完成，不在每次守卫里重复请求。
- 守卫返回值只有三种：`true`、`false`、目标路由对象；不要在守卫里 `router.push`
  （会产生嵌套导航）。
- 全局守卫保持单一职责，一个守卫做一件事，不堆成大函数。

---

## 权限与菜单

「同一判据须覆盖守卫/菜单/按钮三处」是框架无关的要求，见 frontend/patterns/permission.md。
Vue 侧只需注意：守卫是三处消费者之一，判定函数本身不写在路由文件里。

---

## 页面进出与清理

- 路由参数变化但组件复用时（如 `/tickets/1` → `/tickets/2`），
  须 `watch` 参数重新加载，不能只依赖 `onMounted`。
- 离开页面时取消在途请求（`onScopeDispose`，见 composable.md）。
- 需要缓存列表滚动位置或已填表单时，明确使用 `KeepAlive` 并说明缓存边界；
  默认不缓存，避免读到上一次的残留状态。

```typescript
// ✅ 详情页：id 变化时重载
watch(() => route.params.id, (id) => { if (typeof id === 'string') load(id); }, { immediate: true });
```

---

## 检查清单

- [ ] 页面组件懒加载
- [ ] 跳转用 name，未硬编码路径
- [ ] 资源标识用 params，视图条件用 query
- [ ] query 读写遵循 state.md「URL 状态」（唯一来源、容错解析、replace）
- [ ] 守卫内无业务判断（调用 Logic）
- [ ] 守卫内无业务数据请求
- [ ] 守卫返回路由对象而非调用 push
- [ ] 权限判定函数不写在路由文件里（三处一致要求见 frontend/patterns/permission.md）
- [ ] 组件复用时 watch 路由参数重载
- [ ] 离开页面取消在途请求
- [ ] 使用 KeepAlive 时已说明缓存边界
