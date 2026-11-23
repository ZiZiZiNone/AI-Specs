# 前端性能规范（Core Web Vitals 与内存治理）

路径基准：本文所有裸路径相对规范库根 `<SPEC_ROOT>` 解析。见 `<SPEC_ROOT>/README.md`「路径基准」。

## 1. Core Web Vitals 目标基线
- **LCP**（最大内容绘制）≤ 2.5s：首屏关键图预设宽高防重排、使用 `fetchpriority="high"`、避免 JS 阻塞首屏渲染。
- **INP**（交互到下次绘制）≤ 200ms：避免单次主线程长任务（> 50ms），高频输入/滚动使用防抖（300ms）或 `requestAnimationFrame` 节流。
- **CLS**（累积布局偏移）≤ 0.1：图片/媒体/异步卡片容器必须预留骨架或固定宽高比，禁止无占位突然顶开下方内容。

## 2. 打包体积与渲染性能
- 路由页面按需动态 `import()` 懒加载；重型依赖（图表、富文本、PDF）延迟到交互触发时加载，严禁整包引入全量图标库/工具库。
- 列表项超过 200 条且 DOM 较重时启用虚拟滚动；Vue 3 大列表静态数据使用 `shallowRef` / `Object.freeze` 避免深度代理开销。

## 3. 内存泄漏治理（红线）
- 组件/作用域卸载（`onScopeDispose` / `onUnmounted` / `onUnload`）必须成对清理：在途 `AbortController`、`setTimeout`/`setInterval`、`addEventListener`、`ResizeObserver`/`IntersectionObserver`、WebSocket 与 `URL.createObjectURL()`（调用 `URL.revokeObjectURL`）。

## 检查清单

- [ ] 路由与重型第三方库均按需懒加载
- [ ] 所有定时器、全局监听、Observer、ObjectURL 与在途请求在卸载时完整清理
- [ ] 列表、图片与异步卡片均预留占位防 CLS 抖动
