# 前端安全规范（COM-013 前端落地）

路径基准：本文所有裸路径相对规范库根 `<SPEC_ROOT>` 解析。见 `<SPEC_ROOT>/README.md`「路径基准」。

## 核心规则

1. **防 XSS（跨站脚本）**：
   - 严禁将不可信文本或服务端富文本未经净化直接传入 `v-html`、`innerHTML`、`outerHTML`、`document.write`；确需渲染富文本时，必须先经权威白名单净化库（如 DOMPurify）清洗。
   - 严禁将用户输入直接拼入 `href` / `src`（防 `javascript:` / `data:text/html` 协议注入）；外链跳转须校验协议仅允许 `http:` / `https:`，新标签页外链必须附带 `rel="noopener noreferrer"`。
2. **敏感凭证存储禁令**：
   - 严禁在 `localStorage` / `sessionStorage` / URL Query / 前端硬编码中存放长期高权限密钥或明文敏感信息；Web 端优先使用服务端 `HttpOnly + Secure + SameSite=Lax/Strict` Cookie 承载会话凭证。
   - 登出、切换租户或 `401` 失效时，必须完整清空内存 Store、缓存与本地非公开状态。
3. **CSRF 与 CSP**：
   - Cookie 鉴权写接口必须配合 `SameSite` 属性与 CSRF Token（`X-CSRF-Token`）；生产站点应配置严格 Content-Security-Policy，禁止随意开启 `unsafe-eval`。
4. **防依赖与源码泄露**：
   - 生产构建禁止对外暴露完整 `.map` SourceMap；前端环境变量（`VITE_*` 等）默认会打包进公开产物，**严禁放入任何服务端私密密钥**。

## 检查清单

- [ ] 无未净化的 `v-html` / `innerHTML`，外链已校验协议并加 `rel="noopener noreferrer"`
- [ ] 无 `VITE_*` 或前端代码硬编码服务端密钥
- [ ] 登出/切租户已清空 Store 与本地敏感缓存
