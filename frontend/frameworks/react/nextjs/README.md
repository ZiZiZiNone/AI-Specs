# Next.js App Router 与 Server Actions 专属规范

路径基准：本文所有裸路径相对规范库根 `<SPEC_ROOT>` 解析。见 `<SPEC_ROOT>/README.md`「路径基准」。

## 规则
- 1) 默认使用 Server Component，仅交互叶节点标 `'use client'`，禁止把服务端密钥/DB 客户端导入 Client Bundle；2) 每个 `'use server'` Server Action 都是公开 HTTP 端点，必须独立校验认证、细粒度资源归属（`BE-105`）与 Zod 入参校验；3) 写操作后精确调用 `revalidatePath`/`revalidateTag`，避免缓存陈旧。

## 检查清单
- [ ] 严格遵守 `FE-101` 至 `FE-104`、`COM-013` 至 `COM-018`
- [ ] 可运行参考切片见 `frontend/frameworks/react/test/`
