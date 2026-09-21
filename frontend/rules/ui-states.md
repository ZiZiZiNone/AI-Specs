# UI 状态

路径基准：本文所有裸路径相对规范库根 `<SPEC_ROOT>` 解析，首段为 `common/`、`frontend/` 或 `backend/`。见 `<SPEC_ROOT>/README.md`「路径基准」。示例均引自 `frontend/examples/golden/` 自包含示例。

统一管理加载态、空态、错误态。

## 状态枚举

所有数据加载场景必须包含以下状态：

```typescript
type UIState = 'idle' | 'loading' | 'success' | 'error' | 'empty';
```

### 状态定义
- **idle**：初始状态，未开始加载
- **loading**：加载中
- **success**：加载成功且有数据
- **error**：加载失败
- **empty**：加载成功但无数据

---

## 状态转换规则

### 标准流程
```
idle → loading → success/error/empty
```

### 刷新流程
```
success/error/empty → loading → success/error/empty
```

### 重试流程
```
error → loading → success/error/empty
```

### 禁止的转换
- ❌ idle → success（必须经过 loading）
- ❌ loading → idle（不能回到初始态）
- ❌ error 直接到 success（必须重新 loading）

---

## 整体态与操作反馈的区分

UIState 描述的是**当前区块整体呈现什么**，不等于"是否发生过错误"。
二者是两个独立维度，必须分开存放：

| 维度 | 含义 | 载体 |
|---|---|---|
| 整体态（UIState） | 该区块此刻渲染骨架/内容/空态/错误占位中的哪一种 | `state` |
| 操作反馈 | 某次具体操作的成败信息 | `errorMessage` + Toast |

### 判定规则
- **已有数据时的失败**（刷新失败、翻页失败、行内操作失败）：
  整体态保持 `success`，错误只经 `errorMessage` / Toast 呈现。
  已有内容不得因一次失败而消失。
- **无数据时的失败**（首次加载失败）：整体态转 `error`，渲染错误占位 + 重试。

因此 **`success` 与非空 `errorMessage` 并存是合法状态**，不违反"禁止 error 直接到 success"
（该禁令约束的是整体态的跳变，不约束操作反馈）。

```typescript
// ✅ 有数据时刷新失败：保留内容，仅提示
const hasData = state.value === 'success';
if (!result.success) {
  errorMessage.value = result.error.message;
  if (!hasData) state.value = 'error';
  return;
}
```

```typescript
// ❌ 刷新失败即清空并转错误态
if (!result.success) {
  list.value = [];
  state.value = 'error';
}
// 问题：用户原本看得见的数据因一次网络抖动整片消失
```

---

## 状态判定标准

### success vs empty
- **success**：数据数组长度 > 0，或对象有有效字段
- **empty**：数据数组长度 = 0，或对象为空/null

### 边界情况
- 列表第一页为空 → empty
- 列表翻页为空 → 保持 success，Toast 提示"没有更多数据"
- 搜索无结果 → empty，显示"未找到相关内容"
- 详情不存在 → error，显示"内容不存在或已删除"

---

## 状态存储位置

### 组件内状态
适用场景：
- 仅当前组件关心的加载状态
- 不需要跨组件共享

示例：下拉框选项加载、图片上传状态

### Logic 层状态
适用场景：
- 页面级数据加载
- 需要在多个组件间共享
- 需要复用的加载逻辑

示例：列表数据、详情数据、表单提交状态

### Store 状态
适用场景：
- 跨页面共享的加载状态
- 需要全局感知的状态

示例：用户信息加载、全局配置加载

---

## UI 展示规范

### loading 态
**何时显示**：
- 首次加载：全屏/区块级 loading
- 刷新：顶部进度条或小型 loading 图标
- 分页：表格底部 loading
- 提交操作：按钮 loading 状态

**交互要求**：
- 禁用相关操作按钮
- 显示加载指示器
- 超过 3 秒显示"加载中..."文字提示
- 提供取消按钮（可选，长时间操作必须）

**示例**
来源：`frontend/examples/golden/list-page.md`「6. 页面只做组装」：骨架屏保留布局，避免内容跳动。

```vue
<!-- ✅ loading 态展示：骨架屏保留布局，避免内容跳动 -->
<template v-if="state === 'loading'">
  <a-skeleton animation :loading="true">
    <a-skeleton-line :rows="6" />
  </a-skeleton>
</template>
```

```typescript
// ✅ 首次加载与刷新是两种加载态：刷新只显示顶部进度，不清空已有内容
const hasData = state.value === 'success';
if (hasData) isRefreshing.value = true;
else state.value = 'loading';
```

```vue
<!-- ❌ 刷新时也整片替换为 loading：用户已看到的数据凭空消失 -->
<Skeleton v-if="isLoading" />
<Table v-else :rows="rows" />
```

---

### success 态
**展示内容**：
- 渲染实际数据
- 移除 loading 指示器
- 恢复操作按钮

**注意**：
- 不显示"加载成功"提示（静默成功）
- 除非是操作反馈（如"保存成功"）

---

### empty 态
**展示内容**：
- 空状态插图（图标/图片）
- 友好的文案说明
- 引导操作（如"创建第一个项目"）

**文案规范**：
- 列表为空："暂无数据"或"还没有XXX"
- 搜索无结果："未找到相关内容，试试其他关键词"
- 筛选无结果："当前筛选条件下没有数据，调整筛选条件试试"

**禁止**：
- ❌ 显示空白页面
- ❌ 仅显示"无数据"三个字
- ❌ 显示 null/undefined

**示例**
来源：`frontend/examples/golden/list-page.md`「6. 页面只做组装」：empty 态说明现状加给出下一步动作，动作按钮受权限控制。

```vue
<!-- ✅ empty 态：说明现状 + 给出下一步动作；动作按钮受权限控制 -->
<EmptyPlaceholder
  title="暂无工单数据"
  description="调整筛选条件，或创建第一个工单"
  :action-text="canCreate ? '新增工单' : ''"
  @action="openCreate"
/>
```

**区分"本来没有"与"筛出来没有"**：两者的引导动作不同——
前者引导创建，后者引导清空筛选。判据应放 Logic，例如
`frontend/examples/golden/list-page.md`「1. 筛选条件以 URL 为唯一来源」的序列化与解析判据
即可作为区分依据，同一判据可复用于 empty 态文案选择。

---

### error 态
**展示内容**：
- 错误说明
- 重试按钮
- 返回/取消按钮（根据场景）

**展示方式**：
- **页面级错误**：错误占位组件（替换整个内容区）
- **区块级错误**：局部错误提示
- **操作级错误**：Toast/Message 提示

错误分级见 `frontend/rules/error-handling.md`「展示方式」：全局错误走 Modal 对话框、页面级错误走错误占位组件、表单错误走表单顶部错误提示、操作错误走 Toast 提示。

**示例**（页面级错误占位，见 `frontend/examples/golden/list-page.md`「6. 页面只做组装」）：
```vue
<!-- ✅ error 态展示：说明 + 重试 + 按场景返回，三者齐全 -->
<ErrorPlaceholder
  v-if="uiState.status === 'error'"
  :message="uiState.error"
  retry-text="重新加载"
  back-text="返回列表"
  @retry="reload"
  @back="goBack"
/>
```

---

## 标准组件封装

### 数据加载容器组件
推荐封装统一的状态容器组件：

```typescript
<DataLoader
  state={uiState}
  data={data}
  error={error}
  onRetry={handleRetry}
  loadingRender={<LoadingSkeleton />}
  emptyRender={<EmptyPlaceholder />}
  errorRender={<ErrorPlaceholder />}
>
  {(data) => <ActualContent data={data} />}
</DataLoader>
```

**封装要求**：
- 根据 state 自动切换展示
- 支持自定义各状态的渲染
- 提供默认渲染（保持一致性）
- 仅 success 态渲染子组件

---

## 特殊场景处理

### 分页加载
- **首页 loading**：全局 loading
- **翻页 loading**：表格底部小型 loading
- **首页 empty**：显示空态
- **翻页 empty**：保持当前数据，Toast 提示"没有更多了"

### 搜索加载
- **输入防抖**：300ms 后触发
- **加载中**：保留上次结果 + 顶部 loading 条
- **结果为空**：显示 empty 态 + "未找到相关内容"
- **清空搜索**：恢复到初始列表

### 下拉刷新
- **下拉中**：显示下拉指示器
- **加载中**：顶部 loading 条
- **成功**：平滑更新数据 + "已刷新"提示（1秒后消失）
- **失败**：Toast 提示 + 保留旧数据

### 乐观更新
- **写入前保存快照**：修改本地状态前先存下原值
- **立即更新 UI**：不等接口返回
- **成功**：静默保持
- **失败**：按快照回滚 + error 提示
- **适用场景**：点赞、收藏、简单开关、列表行内字段调整

**强制要求**：快照必须在写入前取得，禁止在失败分支反推原值。
并发操作下反推会把状态回滚成另一次操作的中间值。

```typescript
// ✅ 写入前取快照，失败按快照回滚
const snapshot = rows.value[index].priority;
rows.value = withPriority(rows.value, id, next);

const result = await updatePriority(id, next);
if (!result.success) {
  rows.value = withPriority(rows.value, id, snapshot);
}
```

```typescript
// ❌ 失败时反推原值
if (!result.success) {
  // next 的"上一个值"无法从当前状态推出，并发时会回滚错
  rows.value = withPriority(rows.value, id, previousOf(next));
}
```


---

## 状态组合场景

### 多接口并发
- **任一接口 loading**：显示 loading
- **全部成功**：显示 success
- **任一失败**：显示 error（或部分成功提示）
- **全部为空**：显示 empty

### 依赖加载
```
接口A loading → 接口A success → 接口B loading → 接口B success
```
- 显示"正在加载..."，不分阶段提示
- 任一失败即显示 error

### Tab 切换
- **切换未加载的 Tab**：显示 loading
- **切换已加载的 Tab**：直接显示缓存数据
- **手动刷新**：重新 loading

---

## 性能优化

### Skeleton 屏
- **首次加载**：使用 Skeleton 替代 loading 图标
- **结构还原**：Skeleton 结构与实际内容一致
- **适用场景**：列表、卡片、详情页
- **禁止场景**：简单表单、小型弹窗

### 预加载
- **数据预判**：用户可能访问的数据提前加载
- **状态管理**：预加载不影响当前 UI 状态
- **失败处理**：预加载失败静默，实际访问时重试

### 缓存策略
- **读缓存**：先展示缓存（success），后台刷新
- **写缓存**：成功后更新缓存
- **过期策略**：根据数据时效性设置过期时间

---

## 检查清单

- [ ] 所有数据加载场景都有五态（idle/loading/success/error/empty）
- [ ] 状态转换符合规则（不能跳过 loading）
- [ ] loading 超过 3 秒有文字提示
- [ ] empty 态有友好文案和引导操作
- [ ] error 态有重试按钮
- [ ] 表单提交中禁用按钮并显示 loading
- [ ] 分页加载的 loading 位置正确
- [ ] 搜索有防抖处理
- [ ] 长列表使用 Skeleton 屏
- [ ] 不在 success 态显示"加载成功"提示
