# 微信小程序最小可运行参考切片（v2.0）

路径基准：本文所有裸路径相对规范库根 `<SPEC_ROOT>` 解析。见 `<SPEC_ROOT>/README.md`「路径基准」。

零第三方依赖的 Node.js 18+ 原生测试切片，验证小程序核心生产难点：
- `miniprogram/services/request.mjs`：`wx.request` 封装、`AbortSignal` 取消绑定与 `complete` 自动解绑、并发 `401` 单飞 `wx.login` 静默续期与重放队列
- `miniprogram/logic/pagination.mjs`：二维分页切片、先置 `loadingMore: true` 与防重入锁、单飞请求守卫防后发先至
- `miniprogram/utils/navigate.mjs`：10 层页面栈自动降级 `wx.redirectTo`、冷启动 `ensureAppReady()` 守卫

## 运行验证命令

```bash
AI_SPEC_ALIAS_ROOT=frontend/frameworks/miniprogram/test/miniprogram node --no-warnings --loader ./scripts/node-alias-loader.mjs --test frontend/frameworks/miniprogram/test/tests/miniprogram-slice.test.mjs
```
