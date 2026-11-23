# 前端负向反例对照集（Vue 3 + 微信小程序，v2.1）

路径基准：本文所有裸路径相对规范库根 `<SPEC_ROOT>` 解析。见 `<SPEC_ROOT>/README.md`「路径基准」。

本文件已按 `FE-005` 彻底清除历史 React 18 遗留代码，全部改为 **Vue 3 + TypeScript** 与 **微信小程序** 双栈对照，同时保留全库引用的稳定章节标题。

## 1. 页面直接调用 Service

```ts
// ❌ 反例：页面组件直接拼装参数、发 fetch、做业务判断（违背 FE-101）
async function load() {
  const res = await fetch('/api/v1/tickets?page=' + page.value);
  const json = await res.json();
  items.value = json.data.items;
  canCancel.value = items.value.every((t: Ticket) => t.status === 'open');
}

// ✅ 正例：页面只调 useTicketList()，查询序列化与业务判断下沉 logic/
import { useTicketList } from '@/hooks/useTicketList.ts';
const { state, items, reload } = useTicketList(queryRef);
```

## 2. 展示型组件自己加载数据

```ts
// ❌ 反例：弹窗/表格展示组件内部发请求或读写全局 Store（违背 FE-102）
import { useUserStore } from '@/store/user.ts';
const store = useUserStore();
onMounted(() => fetchTicketDetail(props.id));

// ✅ 正例：纯受控组件，通过 props 接收数据、通过 emit 发出动作意图
const props = defineProps<{ ticket: TicketDetail | null; loading: boolean }>();
const emit = defineEmits<{ submit: [payload: TicketSubmitPayload]; close: [] }>();
```

## 3. 竞态保护形似而无实效

```ts
// ❌ 反例：只把 controller 放进 Set 从未 abort 上一个，或未将 signal 传给 fetch
controllers.add(controller);
fetch(url); // 未传 signal

// ✅ 正例：发起新请求前先 activeController?.abort()，并将 signal 透传给请求
import { createRequestGuard } from '@/hooks/useRequestGuard.mjs';
const { signal, isStale } = guard.start();
const res = await requestJson({ fetchImpl: fetch, url, signal });
if (isStale()) return;
```

## 4. 每个接口重复 try-catch

```ts
// ❌ 反例：每个页面/Hook 各自 try/catch 且忽略 HTTP 200 非零业务码，或在 Service 层弹 Toast
try {
  const resp = await fetch('/api/v1/orders');
  if (resp.status >= 400) throw new Error('fail');
} catch (e) {
  showToast(String(e));
}

// ✅ 正例：唯一 try/catch 与 HTTP 200 code===0 校验收敛在 httpClient，Service 只返标准错误对象
const res = await requestJson({ fetchImpl: fetch, url: '/api/v1/orders' });
if (!res.ok) return res;
```

## 5. retryable 计算了但没人用

```ts
// ❌ 反例：算了 retryable 但未接入可中断退避循环，或对 POST 盲目重试
const retryable = resp.status === 503;
// 后面直接 return error，或 delay(ms) 不监听 AbortSignal

// ✅ 正例：仅 GET / 幂等请求在可重试状态码下使用 delayWithSignal(ms, signal) 退避重试
const shouldContinue = await delayWithSignal(baseDelayMs * (2 ** attempt), signal);
if (!shouldContinue || signal?.aborted) return { ok: false, error: CANCELED_ERROR };
```

## 6. 受控组件自持一份状态

```ts
// ❌ 反例：筛选栏或弹窗把 props.keyword 拷贝进本地 ref 后自行维护，外部重置时不同步
const localKeyword = ref(props.keyword); // 外部 reset 后视图残留旧值

// ✅ 正例：受控输入直接绑定 props 并 emit 更新，路由/父级保持单一数据源（FE-104）
const props = defineProps<{ keyword: string }>();
const emit = defineEmits<{ 'update:keyword': [value: string] }>();
```

## 7. 校验层放弃类型

```ts
// ❌ 反例：校验函数用 any / Object.assign 合并残留旧错，且未剔除隐藏字段
function validate(v: any) { Object.assign(errors, runRules(v)); }

// ✅ 正例：强类型泛型规则表，全量替换 errors 并通过 toSubmitPayload 裁剪隐藏字段
state.errors = validateTicketForm(state.values);
await submitFn(toSubmitPayload(state.values));
```

## 8. 路由守卫首屏未就绪放行与不安全相对导入

```ts
// ❌ 反例：首屏刷新 session.user 未就绪直接 return true 绕过鉴权；使用相对导入
import { parseTicketQuery } from '../logic/ticketQuery.logic';
if (!session.user) return true;

// ✅ 正例：单飞等待 ensureLoaded()；统一 @/ 绝对路径加扩展名
import { parseTicketQuery } from '@/logic/ticketQuery.logic.mjs';
await session.ensureLoaded();
if (to.meta.requiresAuth && !session.user) return { name: 'login' };
```

## 9. 小程序整数组 setData 刷写与 Service 层弹 Toast

```ts
// ❌ 反例：每翻一页整包覆写几百条数组（易超 1024KB 上限），且在 Service 层调 wx.showToast
this.setData({ list: [...this.data.list, ...newItems] });

// ✅ 正例：二维分页路径增量写入，10 层页面栈经 navigateSafe 自动降级 redirectTo
this.setData({ [`listPages[${pageIndex}]`]: newItems, loadingMore: false });
```

## 10. 页面承担 13 个函数

```ts
// ❌ 反例：单个 .vue 页面堆砌分页、筛选、弹窗、批量删除、导出、权限判断等十余个函数
// 违反 FE-101 页面薄层量化上限，逻辑无法独立单测

// ✅ 正例：按职责拆分为 useTicketList / useTicketForm / ticketQuery.logic / ticketPermission.logic
```

## 11. Logic 层空转

```ts
// ❌ 反例：建了 logic/ 目录却只放空壳转发，真实业务判断（如状态跃迁、金额浮点计算）仍散落在页面模板与组件中
// 既造成目录形式主义，又导致规则多处漂移

// ✅ 正例：所有状态机、表单校验、权限判据、分页回退算法（resolvePageAfterRemoval）沉淀在纯函数 logic/ 并配单元测试
```

## 12. 缺少可运行的最小验证闭环

- ❌ 反例：文档示例从未编译或运行，长期隐藏编译报错、竞态泄漏与 XSS/浮点精度缺陷（违背 `common/protocol/final-gate.md`「无法验证时的处理」）。
- ✅ 正例：关键机制均同步落入 `frontend/frameworks/vue3/test/` 与 `frontend/frameworks/miniprogram/test/`，由 `scripts/check-all.py` 12 项门禁自动实跑验证。
