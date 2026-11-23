# PHP 日志规范（COM-017 / BE-106）

路径基准：本文所有裸路径相对规范库根 `<SPEC_ROOT>` 解析。见 `<SPEC_ROOT>/README.md`「路径基准」。

## 核心规则

1. **统一由入口中间件生成并透传 `requestId`**：与 `backend/php/laravel/logging.md` 完全对齐——入口中间件读取或生成 `X-Request-Id`，注入日志上下文并回写响应头；Controller 与 Service 仅透传消费，**禁止在 Controller 内重复生成**。
2. **依赖 PSR-3 接口注入**：Service 注入 `Psr\Log\LoggerInterface`，严禁直接使用 `error_log()`、`var_dump()` 或全局 Facade 耦合导致不可测。
3. **结构化上下文与脱敏**：日志上下文使用数组键值对（如 `['orderId' => $id, 'requestId' => $reqId]`），在日志 Processor 中统一脱敏密码、Token、Authorization 与完整 PII。
4. **级别与异常**：4xx 业务/参数拒绝记 `info` 或 `warning`，仅 5xx/不可恢复故障记 `error`；SQL 慢日志与异常日志必须脱敏绑定参数。

## 检查清单

- [ ] `requestId` 统一由入口中间件生成并回写响应头
- [ ] Service 注入 `LoggerInterface`，无 `error_log`/`var_dump`
- [ ] 日志处理器已配置敏感字段脱敏，4xx 未误记为 `error`
