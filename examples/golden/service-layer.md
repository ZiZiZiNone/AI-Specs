# 示例：Service 层

来源：`test/vue/src/services/`（Vue 3 + TS，已过 checklists 自检）
示范：rules/api.md、rules/error-handling.md、rules/async-operations.md

## 1. 统一请求出口承担 try-catch

**解决的问题**：N 个接口若各写一遍 try-catch，会产出 N 份重复捕获，
错误归一规则随时间漂移不一致。

来源：`services/httpClient.ts`

```typescript
async function attemptOnce<T>(
  method: string,
  path: string,
  options: RequestOptions,
): Promise<Result<T>> {
  const guard = withTimeout(options.timeoutMs ?? DEFAULT_TIMEOUT_MS, options.signal);

  try {
    const response = await send(method, path, options, guard.signal);
    if (response.status >= 400) {
      return { success: false, error: toStandardError(response.status, response.payload) };
    }
    return { success: true, data: (response.payload as SuccessPayload<T>).data };
  } catch (error) {
    if (isAbortError(error)) {
      return { success: false, error: guard.isTimeout() ? TIMEOUT_ERROR : CANCELED_ERROR };
    }
    return { success: false, error: NETWORK_ERROR };
  } finally {
    guard.dispose();
  }
}
```

业务方法只描述接口语义，不再包裹 try-catch：

```typescript
// services/ticket.service.ts
export function fetchTicketDetail(
  id: string,
  context: RequestContext = {},
): Promise<Result<TicketDetail>> {
  return httpClient.get(`/api/tickets/${id}`, { signal: context.signal });
}
```

---

## 2. 超时与外部取消联动

**解决的问题**：只设超时不中断底层请求，超时后请求仍在后台占用连接；
只接外部 signal 则超时无法生效。二者需合并为一个 signal。

来源：`services/httpClient.ts`

```typescript
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
    // 用于区分"超时"与"用户取消"：前者是故障，后者是预期行为
    isTimeout: () => timedOut,
    dispose: () => {
      clearTimeout(timer);
      externalSignal?.removeEventListener('abort', onExternalAbort);
    },
  };
}
```

---

## 3. 幂等性决定是否重试

**解决的问题**：对 POST 重试会重复创建资源（重复工单/订单），
属数据正确性缺陷。默认只对幂等方法开启。

来源：`services/httpClient.ts` + `services/ticket.service.ts`

```typescript
async function request<T>(method: string, path: string, options: RequestOptions = {}) {
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
// 非幂等写操作显式关闭重试
export function createTicket(values: Omit<TicketFormValues, 'id'>) {
  return httpClient.post('/api/tickets', { body: values, retryable: false });
}
```

---

## 4. 错误归一为 StandardError

**解决的问题**：UI 需要知道"能否重试"与"给用户看什么话"，
不应让每个调用点各自解析状态码。

来源：`services/errorMapper.ts`

```typescript
export function toStandardError(status: number, payload: unknown): StandardError {
  // 5xx 视为服务端临时故障，可重试
  if (status >= 500) {
    return {
      code: 'SERVER_ERROR',
      message: '服务暂时不可用，请稍后重试',
      type: 'network',
      details: payload,
      retryable: true,
    };
  }

  const business = readBusinessError(payload);
  if (business) {
    return {
      code: business.code,
      message: business.message,
      type: 'business',
      details: payload,
      retryable: status === 429,
    };
  }

  const mapped = HTTP_MESSAGES[status];
  return mapped
    ? { ...mapped, type: 'business', details: payload, retryable: status === 429 }
    : {
        code: `HTTP_${status}`,
        message: '操作失败，请稍后重试或联系管理员',
        type: 'business',
        details: payload,
        retryable: false,
      };
}
```

配套断言（`services/errorMapper.spec.ts`）确保文案不泄漏技术术语：

```typescript
it('should_produce_user_readable_message_without_technical_terms', () => {
  const error = toStandardError(500, { stack: 'Error: at handler' });
  expect(error.message).not.toContain('500');
  expect(error.message).not.toContain('Error');
});
```
