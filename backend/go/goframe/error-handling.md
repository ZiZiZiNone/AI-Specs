# GoFrame v2.10 错误与响应映射差异规范

路径基准：本文所有裸路径相对规范库根 `<SPEC_ROOT>` 解析。见 `<SPEC_ROOT>/README.md`「路径基准」。

## GoFrame 专属约束

1. **统一错误码构造**：领域错误在边界层通过 `gerror.NewCode(gcode.New(bizCode, msg, nil), detail)` 包装，领域层内部仍优先使用标准哨兵错误（`errors.Is`），避免把 `gerror` 强耦合进纯领域函数。
2. **统一响应中间件**：使用自定义 `ghttp.MiddlewareHandlerResponse` 替代默认文本响应，统一输出 `common/rules/api-contract.md` 信封 `{code, message, data, requestId}`，失败时 `data` 固定为 `null`，并根据业务码映射正确 HTTP 状态码（400/401/403/404/409/422/500）。
3. **屏蔽内部栈信息**：生产环境禁止把 `gerror.Stack(err)` 写入 HTTP 响应体，仅记入结构化服务端日志并关联 `requestId`。

## 检查清单

- [ ] 已注册自定义 `MiddlewareHandlerResponse` 输出统一信封且失败 `data` 为 `null`
- [ ] 响应体未泄露 `gerror.Stack` 或数据库底层错误原文
