# 样式

路径基准：本文所有裸路径相对规范库根 `<SPEC_ROOT>` 解析，首段为 `common/`、`frontend/` 或 `backend/`。见 `<SPEC_ROOT>/README.md`「路径基准」。本文 `src/*` 指业务项目根下源码，与规范库路径含义不同。

设计 token 单一来源；样式不泄漏业务语义。

## 核心原则
- 样式只表达"看起来怎样"，不表达"业务是什么"。
- 设计 token（颜色/字号/间距/圆角/阴影）**必须单一来源**，禁止两套并存。
- 状态到样式的映射写在 Logic 常量表，模板只做查表。

---

## 设计 token 单一来源

项目引入组件库时，以**组件库的 CSS 变量为唯一 token 来源**，
工具类框架（Tailwind 等）不引入自己的调色板。

理由：两套色板并存会导致同一语义（如"主色""危险色""次级文字"）出现两个近似值，
主题切换时只有一套跟随变化，视觉割裂且无法统一维护。

```html
<!-- ✅ 用组件库 token，主题切换自动跟随 -->
<p class="text-sm text-[var(--color-text-3)]">共 128 条</p>
<span class="text-[rgb(var(--danger-6))]">删除</span>
```

```html
<!-- ❌ 混用工具类调色板：与组件库主色不一致，暗色主题不跟随 -->
<p class="text-sm text-gray-500">共 128 条</p>
<span class="text-red-500">删除</span>
```

**约定**：
- 颜色、文字层级、边框：一律用组件库变量。
- 间距、栅格、flex 布局：可用工具类（这类无主题语义）。
- 无组件库时，在业务项目 `src/styles/tokens.css`（即 `@/styles/tokens.css`）定义项目自己的变量作为唯一来源。

---

## 工具类框架共存

### 重置样式冲突
组件库自带样式重置，工具类框架的 preflight/reset 会覆盖组件库基础样式，
导致组件内边距、行高、边框异常。

**约定：关闭工具类框架的重置，保留组件库的。**

```javascript
// ✅ tailwind.config.js —— 关闭 preflight，避免覆盖组件库基础样式
export default {
  content: ['./index.html', './src/**/*.{vue,ts}'],
  corePlugins: {
    preflight: false,
  },
};
```

### 样式优先级
- 组件库组件的尺寸/间距微调，用工具类包一层容器实现，
  少用 `!important`（Tailwind 的 `!` 前缀）直接压组件内部样式。
- 确需覆盖组件内部时，注释说明覆盖原因。

---

## 原子类抽取时机

参照 `common/rules/reusability.md`「抽象决策」：同一串原子类组合第二次出现且语义相同时才抽取。

```
问：同一串原子类组合出现第几次？
  ├─ 第 1 次 → 直接写，不抽
  └─ 第 2 次及以上 ↓
问：两处语义是否相同？
  ├─ 否 → 保持重复
  └─ 是 ↓
问：这串类是否描述一个可命名的 UI 单元？
  ├─ 是 → 提取为组件（优先）
  └─ 否 → 提取为 @apply 类（次选）
```

**约定**：
- 优先提取组件，而非 `@apply`。组件能带类型与行为，`@apply` 只搬样式。
- 单元素原子类超过约 12 个且难以阅读时，考虑抽取。
- 禁止建立无主题杂物文件堆放杂类（见 `frontend/anti-patterns/god-utils.md`「定义」）。

---

## 样式不泄漏业务

状态→样式的映射属于业务规则，放 Logic 常量表：

```typescript
// ✅ Logic 里的映射表，列表与详情共用同一份
export const STATUS_COLORS: Record<TicketStatus, string> = {
  open: 'orange',
  processing: 'arcoblue',
  closed: 'gray',
};
```

```vue
<!-- ✅ 模板只查表 -->
<a-tag :color="STATUS_COLORS[ticket.status]">{{ STATUS_LABELS[ticket.status] }}</a-tag>

<!-- ❌ 业务判断写进模板样式 -->
<a-tag :color="ticket.status === 'closed' ? 'gray' : ticket.priority === 'urgent' ? 'red' : 'orange'">
```

---

## 响应式与间距

- 断点用框架默认档位，不自造中间断点（除设计稿明确要求）。
- 间距使用统一节奏（如 4 的倍数），同一页面内不混用 `gap-3` 与 `gap-[13px]`。
- 固定宽高需注释原因，优先用 flex/grid 自适应。

---

## 检查清单

- [ ] 颜色/文字层级用单一 token 来源（组件库变量或项目 tokens.css）
- [ ] 未引入第二套调色板
- [ ] 工具类框架的 preflight 已关闭（存在组件库时）
- [ ] 未用 !important 大面积压组件库样式，覆盖处有注释
- [ ] 重复原子类组合已按判据抽取（优先组件而非 @apply）
- [ ] 无无主题的 utils.css
- [ ] 状态到样式的映射在 Logic 常量表，模板只查表
- [ ] 模板内无业务判断驱动的样式三元链
- [ ] 间距节奏统一，固定尺寸有注释
