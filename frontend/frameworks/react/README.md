# React 19 + Next.js 前端工程规范（v3.0）

路径基准：本文所有裸路径相对规范库根 `<SPEC_ROOT>` 解析。见 `<SPEC_ROOT>/README.md`「路径基准」。

承接 `frontend/rules/core-principles.md`（`FE-101` 至 `FE-104`），面向现代 React 19 / Next.js App Router 项目。

## 目录索引
- `frontend/frameworks/react/component.md`：Server/Client 组件边界、受控组件与 `FE-102` 解耦
- `frontend/frameworks/react/hooks.md`：自定义 Hook、`useEffect` 清理 `AbortController` 与防闭包过期
- `frontend/frameworks/react/state.md`：URL 单一数据源、TanStack Query 与 Zustand 归属边界
- `frontend/frameworks/react/router.md`：路由鉴权单飞守卫与错误边界（ErrorBoundary）
- `frontend/frameworks/react/testing.md`：纯逻辑单测与 Testing Library 行为测试
- `frontend/frameworks/react/nextjs/README.md`：Next.js App Router / Server Actions 安全与缓存约束
- `frontend/frameworks/react/test/`：零依赖可运行参考切片（`tsc --noEmit` + `check-import-path.py` + `node --test`）
