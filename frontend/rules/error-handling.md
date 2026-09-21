# 错误处理

路径基准：本文所有裸路径相对规范库根 `<SPEC_ROOT>` 解析，首段为 `common/`、`frontend/` 或 `backend/`。见 `<SPEC_ROOT>/README.md`「路径基准」。

错误统一捕获、转换、展示。业务错误码的契约定义见 `common/rules/api-contract.md`「业务错误码」。

## 错误分类

### 1. 网络错误
- 请求超时
- 网络断开
- 服务器无响应
- DNS 解析失败

### 2. 业务错误
- 后端返回的业务错误码
- 权限不足
- 数据校验失败
- 资源不存在

### 3. 客户端错误
- 表单验证失败
- 参数格式错误
- 文件类型/大小不符
- 浏览器兼容性问题

---

## 错误处理层级

### Service 层（捕获）
**职责**：捕获所有网络层错误，统一转换为标准错误对象。

**规则**：
- try-catch 收敛在唯一请求出口（如 httpClient），业务 Service 方法不重复包裹
- 网络错误转换为统一错误对象
- HTTP 状态码归类处理
- 超时设置统一配置，且超时能真正中断请求
- 区分超时与用户取消（前者是故障，后者是预期行为）
- 不在 Service 层展示错误（仅返回错误对象）

**标准错误对象结构**：
```typescript
interface StandardError {
  code: string;           // 错误码（业务码或标准错误码）
  message: string;        // 用户可读的错误信息
  type: 'network' | 'business' | 'client';
  details?: unknown;      // 详细信息（可选，供调试）
  retryable: boolean;     // 是否可重试；须被重试逻辑真实消费，不可只标不用
}
```

**示例**
来源：`frontend/examples/golden/service-layer.md`「1. 统一请求出口承担 try-catch」与「4. 错误归一为 StandardError」：try-catch 只收敛在唯一请求出口，业务 Service 方法不重复包裹。

```typescript
// ✅ Service 统一错误处理：try-catch 只在这一处
async function attemptOnce<T>(method: string, path: string, options: RequestOptions) {
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

// ✅ 业务方法只描述接口语义，不再包裹 try-catch
export function fetchTicketDetail(id: string, context: RequestContext = {}) {
  return httpClient.get<TicketDetail>(`/api/tickets/${id}`, { signal: context.signal });
}
```

```typescript
// ❌ 逐方法重复 try-catch：N 个接口 N 份捕获，归一规则随时间漂移
export async function fetchUserList(params: UserListParams) {
  try {
    const response = await axios.get('/api/users', { params, timeout: 10000 });
    return { success: true, data: response.data.data };
  } catch (error) {
    return { success: false, error: transformError(error) };
  }
}
```

---

### Logic 层（转换）
**职责**：接收 Service 错误，根据业务场景转换为具体的用户提示。

**规则**：
- 接收 Service 返回的错误对象
- 根据错误码/类型转换为用户友好的提示
- 决定错误处理策略（展示/重试/降级）
- 返回处理后的错误状态给 UI
- 不直接操作 UI（通过返回值通知）

**示例**
来源：`frontend/examples/golden/list-page.md`「6. 页面只做组装」：按错误码决定策略，取消静默、字段级错误落到字段。

```typescript
// ✅ 按错误码决定策略：取消不算故障，字段级错误落到字段
if (!result.success) {
  if (result.error.code === 'CANCELED') return;          // 预期行为，静默
  if (result.error.code === 'CODE_TAKEN') {              // 可归属到字段
    setFieldError('code', result.error.message);
    return { isSuccess: false, focusField: 'code', message: result.error.message };
  }
  errorMessage.value = result.error.message;             // 其余交由 UI 整体展示
  if (!hasData) state.value = 'error';                   // 已有数据则不整片清空
  return;
}
```

要点：这一层只做「策略判定」，不产出任何 UI 调用（无 Message/Modal/alert）。

---

### UI 层（展示）
**职责**：接收错误状态，按规范展示给用户。

**规则**：
- 接收 Logic/Hook 返回的错误状态
- 根据错误类型选择展示方式
- 提供用户操作入口（重试/取消/返回）
- 不自行判断错误类型和处理策略

### 展示方式

全局错误走 Modal 对话框、页面级错误走错误占位组件、表单错误走表单顶部错误提示、操作错误走 Toast 提示、静默错误走控制台日志加埋点上报：
- **全局错误**（网络断开、登录过期）：Modal 对话框
- **页面级错误**（数据加载失败）：错误占位组件
- **表单错误**（提交失败）：表单顶部错误提示 + 字段级错误
- **操作错误**（删除失败、保存失败）：Toast 提示
- **静默错误**（非关键操作）：控制台日志 + 埋点上报

**示例**
来源：`frontend/examples/golden/list-page.md`「6. 页面只做组装」：容器组件按状态分派，页面不写 v-if 链。

```vue
<!-- ✅ 页面级错误：由容器组件按状态分派，页面不写 v-if 链 -->
<DataLoader
  :state="list.state.value"
  :error-message="list.errorMessage.value"
  empty-title="暂无工单数据"
  @retry="list.reload()"
>
  <TicketTable :rows="list.list.value" />
</DataLoader>
```

```typescript
// ✅ 操作级错误：Toast，且仅在页面/Hook 层调用命令式反馈
const outcome = await rowOps.remove(id);
Message[outcome.isSuccess ? 'success' : 'error'](outcome.message);
```

```typescript
// ❌ 展示组件内部自行判断错误类型并弹提示
if (props.error.type === 'network') Modal.error({ content: '网络异常' });
```

---

## 错误处理策略

### 可重试错误
- 网络超时
- 服务器临时不可用（5xx）
- 限流错误（429）

**处理**：
- 自动重试（最多 3 次，指数退避）
- 或提供"重试"按钮给用户

### 不可重试错误
- 权限不足（403）
- 资源不存在（404）
- 参数错误（400）
- 业务规则错误

**处理**：
- 展示明确错误信息
- 提供解决路径或返回入口

### 静默处理错误
- 埋点上报失败
- 非关键资源加载失败（如头像）
- 预加载失败

**处理**：
- 控制台日志记录
- 监控系统上报
- 不打断用户流程

---

## 错误信息编写规范

### 必须包含
1. **发生了什么**：明确告知用户当前状态
2. **为什么发生**：简要说明原因（可选）
3. **如何解决**：提供下一步操作建议

### 禁止
- ❌ 技术术语（500 Internal Server Error）
- ❌ 堆栈信息（显示给用户）
- ❌ 模糊表述（"操作失败"）
- ❌ 指责用户（"你输入错误"）

### 推荐
- ✅ "网络连接失败，请检查网络后重试"
- ✅ "该文章已被删除，3秒后返回列表"
- ✅ "保存失败，请稍后重试或联系管理员"
- ✅ "文件大小超过10MB，请选择更小的文件"

---

## 特殊场景

### 表单提交错误
- **字段级错误**：显示在对应字段下方
- **全局错误**：显示在表单顶部
- **保留用户输入**：失败后不清空已填内容
- **聚焦错误字段**：自动滚动到第一个错误位置

### 列表加载错误
- **首次加载失败**：显示错误占位 + 重试按钮
- **翻页失败**：Toast 提示 + 保留当前页数据
- **刷新失败**：Toast 提示 + 保留旧数据

### 并发操作错误
- 用户快速点击导致的重复请求：前端防抖/节流
- 乐观更新失败：回滚 UI 状态 + 错误提示
- 多个接口同时失败：合并展示或只显示第一个

---

## 错误日志

### 必须记录
- 错误类型和错误码
- 触发错误的用户操作
- 请求参数（脱敏后）
- 时间戳和用户标识

### 禁止记录
- 用户密码和敏感信息
- 完整的 Token
- 个人隐私数据

### 上报时机
- 所有业务错误：实时上报
- 网络错误：采样上报（避免风暴）
- 客户端错误：实时上报

---

## 检查清单

- [ ] try-catch 收敛在统一请求出口，未逐方法重复
- [ ] Service 层整体不向上抛异常，一律返回 Result
- [ ] 错误对象结构统一（StandardError）
- [ ] retryable 被重试逻辑真实消费，不是装饰字段
- [ ] 超时与用户取消可区分；取消不计为错误态
- [ ] Logic 层转换了业务错误为用户提示，且不产出 UI 调用
- [ ] 能归属到字段的后端错误按字段级展示
- [ ] UI 展示方式符合错误类型
- [ ] 可重试错误提供了重试机制
- [ ] 错误信息清晰友好，无技术术语
- [ ] 关键错误已上报到监控系统
- [ ] 表单错误保留了用户输入
