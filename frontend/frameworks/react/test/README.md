# React 19 / Next.js 最小可运行参考切片（v3.0）

路径基准：本文所有裸路径相对规范库根 `<SPEC_ROOT>` 解析。见 `<SPEC_ROOT>/README.md`「路径基准」。

演示 `createEffectRequestGuard`（React `useEffect` 清理取消旧请求）与 `createServerActionGuard`（Next.js Server Action 认证 + 细粒度资源归属 + 载荷校验）。

## 运行验证命令
```bash
tsc -p frontend/frameworks/react/test/tsconfig.json --noEmit
AI_SPEC_ALIAS_ROOT=frontend/frameworks/react/test/src node --no-warnings --loader ./scripts/node-alias-loader.mjs --test frontend/frameworks/react/test/tests/react-slice.test.mjs
```
