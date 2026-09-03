/**
 * 假后端传输层。对上暴露与 fetch 类似的语义（含超时/取消/网络抖动），
 * 使 httpClient 的重试、竞态、取消逻辑能被真实触发而非空跑。
 */

export interface MockRequest {
  method: string;
  path: string;
  params: Record<string, string>;
  body: unknown;
}

export interface MockResponse {
  status: number;
  payload: unknown;
}

export type MockHandler = (request: MockRequest) => MockResponse | Promise<MockResponse>;

const handlers = new Map<string, MockHandler>();

function keyOf(method: string, pathPattern: string): string {
  return `${method.toUpperCase()} ${pathPattern}`;
}

/** 路径模板用 :param 占位，如 /api/tickets/:id。 */
export function registerHandler(
  method: string,
  pathPattern: string,
  handler: MockHandler,
): void {
  handlers.set(keyOf(method, pathPattern), handler);
}

interface MatchedHandler {
  handler: MockHandler;
  pathParams: Record<string, string>;
}

function matchHandler(method: string, path: string): MatchedHandler | null {
  const segments = path.split('/').filter(Boolean);

  for (const [key, handler] of handlers) {
    const [handlerMethod, pattern] = key.split(' ');
    if (handlerMethod !== method.toUpperCase()) continue;

    const patternSegments = pattern.split('/').filter(Boolean);
    if (patternSegments.length !== segments.length) continue;

    const pathParams: Record<string, string> = {};
    const isMatch = patternSegments.every((patternSegment, index) => {
      if (patternSegment.startsWith(':')) {
        pathParams[patternSegment.slice(1)] = segments[index];
        return true;
      }
      return patternSegment === segments[index];
    });

    if (isMatch) return { handler, pathParams };
  }
  return null;
}

/** 注入的故障率，用于人工验证重试与错误态；默认关闭以免干扰日常使用。 */
export const mockFaultConfig = {
  networkFailureRate: 0,
  latencyMs: 320,
};

function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException('Aborted', 'AbortError'));
      return;
    }
    const timer = setTimeout(resolve, ms);
    signal?.addEventListener(
      'abort',
      () => {
        clearTimeout(timer);
        reject(new DOMException('Aborted', 'AbortError'));
      },
      { once: true },
    );
  });
}

export class MockNetworkError extends Error {
  constructor() {
    super('mock network failure');
    this.name = 'MockNetworkError';
  }
}

export async function sendMockRequest(
  method: string,
  path: string,
  params: Record<string, string>,
  body: unknown,
  signal?: AbortSignal,
): Promise<MockResponse> {
  await sleep(mockFaultConfig.latencyMs, signal);

  if (Math.random() < mockFaultConfig.networkFailureRate) {
    throw new MockNetworkError();
  }

  const matched = matchHandler(method, path);
  if (!matched) {
    return {
      status: 404,
      payload: { success: false, error: { code: 'NOT_FOUND', message: '接口不存在' } },
    };
  }

  // handler 自身的耗时同样受超时/取消约束：与 abort 信号竞速，
  // 中途中断时按 AbortError 拒绝，走与 fetch 一致的取消语义。
  return Promise.race([
    matched.handler({
      method,
      path,
      params: { ...params, ...matched.pathParams },
      body,
    }),
    new Promise<never>((_, reject) => {
      if (!signal) return;
      if (signal.aborted) {
        reject(new DOMException('Aborted', 'AbortError'));
        return;
      }
      signal.addEventListener(
        'abort',
        () => reject(new DOMException('Aborted', 'AbortError')),
        { once: true },
      );
    }),
  ]);
}
