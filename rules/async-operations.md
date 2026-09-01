# 异步操作

统一异步语法、错误捕获、并发控制。

## 异步语法

### 优先使用 async/await
**强制要求**：
- 所有异步操作优先使用 async/await
- 禁止使用 Promise.then().catch() 链式调用（除非必要）
- 禁止回调函数嵌套

**正确示例**：
```typescript
// ✅ async/await
async function fetchUserData(id: string) {
  const user = await userService.fetchUser(id);
  const orders = await orderService.fetchOrders(user.id);
  return { user, orders };
}
```

**错误示例**：
```typescript
// ❌ Promise 链式调用
function fetchUserData(id: string) {
  return userService.fetchUser(id)
    .then(user => orderService.fetchOrders(user.id))
    .then(orders => ({ user, orders }));
}
```

---

## 错误捕获

### try-catch 位置
**规则**：
- Service 层：在唯一的请求出口 try-catch，业务方法不重复包裹
- Logic 层：消费 Result 判断分支，不 try-catch（Service 已保证不抛异常）
- UI 层：不 try-catch（通过状态管理处理错误）

### Service 层错误捕获
捕获必须收敛到唯一的请求出口（统一封装的 httpClient / request），
业务 Service 方法只描述"调哪个接口、返回什么类型"。

```typescript
// ✅ 唯一出口承担 try-catch 与错误归一
async function request<T>(method: string, path: string, options: RequestOptions) {
  try {
    const response = await send(method, path, options);
    if (response.status >= 400) {
      return { success: false, error: toStandardError(response.status, response.payload) };
    }
    return { success: true, data: response.payload.data as T };
  } catch (error) {
    return { success: false, error: toTransportError(error) };
  }
}

// ✅ 业务方法一行转发，不再套 try-catch
export function fetchUser(id: string): Promise<Result<User>> {
  return httpClient.get(`/api/users/${id}`);
}
```

```typescript
// ❌ 每个业务方法各写一遍 try-catch
export async function fetchUser(id: string): Promise<Result<User>> {
  try {
    return { success: true, data: await httpClient.get(`/api/users/${id}`) };
  } catch (error) {
    return { success: false, error: transformError(error) };
  }
}
// 问题：N 个接口产出 N 份重复捕获，错误归一规则会逐渐漂移不一致
```

**强制要求**：
- Service 层整体不向上抛异常，一律返回 Result
- try-catch 与错误归一只有一份实现，位于请求出口
- 返回统一的 Result 类型（success + data/error）
- 业务方法禁止重复包裹 try-catch


### Logic 层错误处理
```typescript
// ✅ Logic 处理业务错误
async function loadUserData(id: string) {
  setState('loading');
  
  const result = await userService.fetchUser(id);
  
  if (!result.success) {
    setState('error');
    setError(result.error.message);
    return;
  }
  
  setState('success');
  setData(result.data);
}
```

**规则**：
- 接收 Service 返回的 Result
- 根据 success 判断成功/失败
- 转换错误为 UI 状态
- 不向上抛出异常

### UI 层错误展示
```typescript
// ✅ UI 根据状态展示
{state === 'error' && <ErrorMessage message={error} />}
```

**规则**：
- 不 try-catch
- 通过状态展示错误
- 详见 rules/error-handling.md

---

## 并发控制

### 并发请求
**适用场景**：
- 多个独立接口可以同时发起
- 互不依赖的数据加载

**使用 Promise.all**：
```typescript
// ✅ 并发请求
const [userResult, orderResult] = await Promise.all([
  userService.fetchUser(id),
  orderService.fetchOrders(id)
]);
```

**注意**：
- 任一失败则全部失败
- 适合必须同时成功的场景

**使用 Promise.allSettled**：
```typescript
// ✅ 部分成功场景
const results = await Promise.allSettled([
  userService.fetchUser(id),
  orderService.fetchOrders(id)
]);

// 逐个判断成功/失败
```

**注意**：
- 所有请求都会完成
- 适合部分成功也可用的场景

---

### 顺序请求
**适用场景**：
- 后续请求依赖前一个请求的结果

**正确写法**：
```typescript
// ✅ 顺序依赖
const userResult = await userService.fetchUser(id);
if (!userResult.success) return;

const ordersResult = await orderService.fetchOrders(userResult.data.id);
```

**错误写法**：
```typescript
// ❌ 不必要的顺序
const user = await userService.fetchUser(id);
const config = await configService.fetchConfig(); // 不依赖 user，应该并发
```

---

### 竞态条件处理
**问题场景**：
- 用户快速切换 Tab/页面
- 快速输入触发多次搜索
- 旧请求结果覆盖新请求

**解决方案 1：取消旧请求**
```typescript
// ✅ 使用 AbortController
let abortController: AbortController | null = null;

async function search(keyword: string) {
  // 取消上一次请求
  if (abortController) {
    abortController.abort();
  }
  
  abortController = new AbortController();
  
  const result = await searchService.search(keyword, {
    signal: abortController.signal
  });
  
  // 处理结果
}
```

**解决方案 2：忽略过期结果**
```typescript
// ✅ 使用请求 ID
let latestRequestId = 0;

async function search(keyword: string) {
  const requestId = ++latestRequestId;
  
  const result = await searchService.search(keyword);
  
  // 只处理最新请求的结果
  if (requestId !== latestRequestId) return;
  
  // 处理结果
}
```

**示例**
来源：`test/vue/src/hooks/useRequestGuard.ts`（完整版见 examples/golden/list-page.md 第 4 节）

上述两种方案**须同时使用**：AbortController 负责中断在途请求，
序号负责判定「已返回但已过期」的结果。封装一次，供列表/详情/记录共用。

```typescript
// ✅ 完整的竞态处理：双保险 + 作用域销毁时自动清理
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

  function abortAll(): void {
    for (const controller of controllers) controller.abort();
    controllers.clear();
    latestToken.value += 1;
  }

  onScopeDispose(abortAll);
  return { start, abortAll };
}
```

调用方：

```typescript
// ✅ signal 必须真正传给请求，否则 abort 不会中断任何东西
const { signal, isStale } = guard.start();
const result = await fetchTicketList(query.value, { signal });
if (isStale()) return;
```

```typescript
// ❌ 建了 controller 但 signal 从未下传；且用对象引用做新旧判定
abortControllerRef.current = new AbortController();
const result = await fetchUserList(params);        // 没传 signal
if (currentParamsRef.current !== params) return;   // 引用比较，语义不稳定
```

---

## 防抖与节流

### 防抖（Debounce）
**适用场景**：
- 搜索输入
- 窗口 resize
- 表单自动保存

**规则**：
- 用户停止操作 N 毫秒后才执行
- 推荐延迟：搜索 300ms，自动保存 1000ms

**示例**
来源：`test/vue/src/hooks/useAsyncSearch.ts`

```typescript
// ✅ 搜索防抖：新输入同时废弃上一次的定时器与在途请求
function trigger(keyword: string): void {
  if (timer !== null) clearTimeout(timer);
  controller?.abort();

  isSearching.value = true;
  timer = setTimeout(async () => {
    const current = new AbortController();
    controller = current;

    const data = await search(keyword, current.signal);
    if (current.signal.aborted) return;   // 定时器已触发但请求被后续输入取消

    result.value = data;
    isSearching.value = false;
  }, delayMs);
}
```

```typescript
// ❌ 只清定时器不取消请求：已发出的旧请求仍会回来覆盖新结果
if (timer !== null) clearTimeout(timer);
timer = setTimeout(() => search(keyword), delayMs);
```

---

### 节流（Throttle）
**适用场景**：
- 滚动加载
- 按钮防重复点击
- 高频事件（mousemove）

**规则**：
- N 毫秒内只执行一次
- 推荐间隔：滚动 200ms，点击 1000ms

**示例**

```typescript
// ✅ 节流：首次立即执行，其后间隔内忽略；配套 cancel 供卸载时清理
export function createThrottle<A extends unknown[]>(
  handler: (...args: A) => void,
  intervalMs: number,
) {
  let lastRunAt = 0;
  let timer: ReturnType<typeof setTimeout> | null = null;

  function invoke(...args: A): void {
    const now = Date.now();
    const remaining = intervalMs - (now - lastRunAt);

    if (remaining <= 0) {
      lastRunAt = now;
      handler(...args);
      return;
    }
    // 保留最后一次调用，避免用户停止操作后丢掉末次事件
    if (timer === null) {
      timer = setTimeout(() => {
        timer = null;
        lastRunAt = Date.now();
        handler(...args);
      }, remaining);
    }
  }

  invoke.cancel = () => {
    if (timer !== null) clearTimeout(timer);
    timer = null;
  };
  return invoke;
}
```

```typescript
// ❌ 无 cancel：组件卸载后残留定时器仍会触发回调，操作已销毁的状态
window.addEventListener('scroll', throttle(onScroll, 200));
```

绑定与解绑须成对，解绑时同时 cancel（Vue 侧用 `onScopeDispose`，
见 frameworks/vue3/composable.md）。

---

## 重试机制

### 幂等性前置判断（先判这条，再谈重试）
重试的前提是"重复执行不产生额外后果"。判断顺序：

```
问：该请求重复执行是否会产生第二份副作用？
  ├─ 否（GET / PUT / DELETE，天然幂等）→ 允许自动重试
  └─ 是（POST 等非幂等写操作）→ 禁止自动重试
       └─ 确需重试时，必须由后端支持幂等键（Idempotency-Key）后才可开启
```

**强制要求**：
- 自动重试默认只对幂等请求开启（GET/PUT/DELETE）
- POST 等非幂等操作**禁止自动重试**，失败后交由用户手动触发
- 请求封装必须提供显式开关（如 `retryable`），不允许对所有方法一律重试
- 违反后果：网络抖动会造成重复创建（重复订单、重复工单），属数据正确性缺陷而非体验问题

```typescript
// ✅ 幂等方法默认重试，非幂等显式关闭
export const httpClient = {
  get: <T>(path: string, options?: RequestOptions) => request<T>('GET', path, options),
  post: <T>(path: string, options?: RequestOptions) => request<T>('POST', path, options),
};

// 出口内部：allowRetry 默认仅对 GET 成立
const allowRetry = options.retryable ?? method === 'GET';

export function createTicket(values: TicketPayload) {
  return httpClient.post('/api/tickets', { body: values, retryable: false });
}
```

```typescript
// ❌ 不区分幂等性，一律重试
const result = await fetchWithRetry(() => api.createTicket(values), 3);
// 问题：首次请求已到达服务端但响应丢失时，重试会创建出 2-3 条重复工单
```

### 自动重试
**适用场景**：
- 网络超时
- 临时性错误（5xx）
- 限流错误（429）

**规则**：
- 仅对幂等请求开启（见上）
- 最多重试 3 次（含首次共 3 次尝试）
- 使用指数退避（1s, 2s, 4s）
- 非临时性错误不重试（4xx，除 429）
- 依据 StandardError.retryable 决定，不在调用点各自判断状态码
- 重试期间若请求已被取消（signal.aborted），立即停止后续重试


**示例**
来源：`test/vue/src/services/httpClient.ts`（完整版见 examples/golden/service-layer.md 第 3 节）

```typescript
// ✅ 自动重试：幂等门槛 + retryable 驱动 + 指数退避 + 取消可中断
async function request<T>(
  method: string,
  path: string,
  options: RequestOptions = {},
): Promise<Result<T>> {
  const allowRetry = options.retryable ?? method === 'GET';
  let lastResult = await attemptOnce<T>(method, path, options);

  for (let attempt = 1; allowRetry && attempt < MAX_RETRY; attempt += 1) {
    if (lastResult.success || !lastResult.error.retryable) break;
    if (options.signal?.aborted) return { success: false, error: CANCELED_ERROR };

    await delay(RETRY_BASE_DELAY_MS * 2 ** (attempt - 1));
    lastResult = await attemptOnce<T>(method, path, options);
  }
  return lastResult;
}
```

```typescript
// ✅ 非幂等写操作显式关闭重试
export function createTicket(values: Omit<TicketFormValues, 'id'>) {
  return httpClient.post<Ticket>('/api/tickets', { body: values, retryable: false });
}
```

```typescript
// ❌ 无幂等判断、抛异常而非返回 Result、用 any
async function fetchWithRetry(fetcher: () => Promise<any>, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try { return await fetcher(); }
    catch (error) {
      if (i === maxRetries - 1) throw error;
      await sleep(2 ** i * 1000);
    }
  }
}
```

---

### 手动重试
**适用场景**：
- 用户可感知的错误
- 需要用户确认的重试

**规则**：
- 提供"重试"按钮
- 保留原有参数
- 显示重试次数（可选）

**示例**
来源：`test/vue/src/hooks/useTicketList.ts` + `components/feedback/ErrorPlaceholder.vue`

```typescript
// ✅ 手动重试：复用同一个 load，参数从当前查询条件重新取，不缓存旧参数副本
return { state, list, total, errorMessage, reload: load };
```

```vue
<!-- ✅ 错误占位提供重试入口，重试动作由上层注入 -->
<ErrorPlaceholder :message="errorMessage" @retry="reload" />
```

要点：重试入口调用的是原本的加载函数，而不是另写一份「重试版」逻辑——
两份实现会随时间漂移。

---

## 超时处理

### 请求超时
**规则**：
- 所有请求必须设置超时
- 默认超时：10 秒
- 上传/下载超时：根据文件大小动态设置
- 超时必须**真正中断请求**，不能只是不再等待
- 超时与外部取消须合并为同一个 signal，并可区分二者

**示例**
来源：`test/vue/src/services/httpClient.ts`（完整版见 examples/golden/service-layer.md 第 2 节）

```typescript
// ✅ 超时与外部取消联动：合并为一个 signal，isTimeout 用于区分故障与预期取消
function withTimeout(timeoutMs: number, externalSignal?: AbortSignal) {
  const controller = new AbortController();
  let timedOut = false;

  const timer = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, timeoutMs);

  const onExternalAbort = () => controller.abort();
  externalSignal?.addEventListener('abort', onExternalAbort, { once: true });

  return {
    signal: controller.signal,
    isTimeout: () => timedOut,
    dispose: () => {
      clearTimeout(timer);
      externalSignal?.removeEventListener('abort', onExternalAbort);
    },
  };
}
```

```typescript
// ❌ 只设超时不中断：超时后请求仍在后台占用连接，结果回来还可能覆盖新状态
const result = await Promise.race([api.fetchData(), rejectAfter(10000)]);
```

---

### 超时反馈
**UI 处理**：
- 显示"请求超时，请检查网络后重试"
- 提供重试按钮
- 记录超时日志

---

## 加载状态管理

### 基础加载状态
```typescript
// ✅ 标准状态管理
const [state, setState] = useState<UIState>('idle');
const [data, setData] = useState<Data | null>(null);
const [error, setError] = useState<string | null>(null);

async function loadData() {
  setState('loading');
  setError(null);
  
  const result = await service.fetchData();
  
  if (result.success) {
    setState('success');
    setData(result.data);
  } else {
    setState('error');
    setError(result.error.message);
  }
}
```

**详见**：rules/ui-states.md

---

### 多接口状态管理
**全部成功才可用**：
```typescript
// ✅ 全部成功
const results = await Promise.all([fetchA(), fetchB()]);
if (results.every(r => r.success)) {
  setState('success');
} else {
  setState('error');
}
```

**部分成功可用**：
```typescript
// ✅ 部分成功
const results = await Promise.allSettled([fetchA(), fetchB()]);
const successData = results
  .filter(r => r.status === 'fulfilled')
  .map(r => r.value);
  
if (successData.length > 0) {
  setState('success');
  setData(successData);
}
```

---

## 取消请求

### 使用 AbortController
```typescript
// ✅ 取消请求
const abortController = new AbortController();

const result = await fetch(url, {
  signal: abortController.signal
});

// 需要取消时
abortController.abort();
```

**适用场景**：
- 组件卸载时取消请求
- 用户快速切换时取消旧请求
- 用户主动取消长时间操作

**示例**
来源：`test/vue/src/hooks/useRequestGuard.ts`

```typescript
// ✅ 作用域销毁时统一中断，无需每个 Hook 自己写卸载钩子
onScopeDispose(abortAll);
```

React 侧对应形态：

```typescript
// ✅ 卸载时中断
useEffect(() => () => abortControllerRef.current?.abort(), []);
```

**取消不是错误**：被取消的请求须在上层被识别为预期行为，不进入 error 态。

```typescript
// ✅
if (!result.success) {
  if (result.error.code === 'CANCELED') return;   // 静默返回
  errorMessage.value = result.error.message;
}
```

```typescript
// ❌ 用户快速切换筛选时，被取消的旧请求把页面打成错误态
if (!result.success) state.value = 'error';
```

---

## 乐观更新

### 适用场景
- 点赞/收藏
- 简单状态切换
- 用户体验优先的操作

### 实现流程
```typescript
// ✅ 乐观更新
async function toggleLike(id: string) {
  // 1. 立即更新 UI
  const oldState = isLiked;
  setIsLiked(!isLiked);
  
  // 2. 发送请求
  const result = await likeService.toggle(id);
  
  // 3. 失败时回滚
  if (!result.success) {
    setIsLiked(oldState);
    showError('操作失败，请重试');
  }
}
```

**注意**：
- 必须有回滚机制
- 失败要有明确提示
- 不适用于关键操作（支付、删除）

---

## 轮询

### 短轮询
**适用场景**：
- 实时性要求不高（>5秒）
- 简单的状态查询

**实现**：
```typescript
// ✅ 短轮询
let pollingTimer: NodeJS.Timeout | null = null;

function startPolling() {
  pollingTimer = setInterval(async () => {
    await fetchData();
  }, 5000); // 5秒轮询一次
}

function stopPolling() {
  if (pollingTimer) {
    clearInterval(pollingTimer);
    pollingTimer = null;
  }
}

// 组件卸载时停止
onUnmount(() => stopPolling());
```

---

### 长轮询
**适用场景**：
- 实时性要求高
- 服务端支持长连接

**实现**：
```typescript
// ✅ 长轮询
async function longPolling() {
  while (isActive) {
    const result = await fetchWithTimeout(30000);
    if (result.success) {
      handleData(result.data);
    }
    await sleep(1000); // 短暂间隔后继续
  }
}
```

---

## 检查清单

- [ ] 所有异步操作使用 async/await
- [ ] try-catch 收敛在唯一请求出口，业务 Service 方法未重复包裹
- [ ] Service 层整体不向上抛异常
- [ ] 返回统一的 Result 类型（success + data/error）
- [ ] Logic 层处理了错误状态
- [ ] 独立请求使用 Promise.all 并发
- [ ] 依赖请求按顺序执行
- [ ] 搜索输入有防抖处理（300ms）
- [ ] 快速切换有竞态保护（取消或忽略）
- [ ] 临时性错误有自动重试（最多3次）
- [ ] **非幂等写操作（POST）未开启自动重试**
- [ ] 所有请求设置了超时（默认10秒）
- [ ] 超时与外部取消联动（超时后底层请求确实被中断）
- [ ] 组件卸载时取消了未完成的请求
- [ ] 乐观更新有失败回滚机制，且快照在写入前保存
- [ ] 轮询在组件卸载时停止
