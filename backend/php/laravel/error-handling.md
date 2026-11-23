# Laravel 13 异常处理差异规范

路径基准：本文所有裸路径相对规范库根 `<SPEC_ROOT>` 解析。见 `<SPEC_ROOT>/README.md`「路径基准」。

## Laravel 专属约束

1. **统一异常注册（`bootstrap/app.php`）**：Laravel 11–13 在 `bootstrap/app.php` 的 `withExceptions(function (Exceptions $exceptions) { ... })` 中集中注册领域异常到统一信封 `{code, message, data: null, requestId}` 及 HTTP 状态码（400/401/403/404/409/422/429/500）的映射。
2. **领域异常带错误码与上下文**：自定义领域异常继承统一基类 `DomainException`，携带稳定业务码 `errorCode` 与安全上下文数组，不向客户端泄露 `ValidationException` 之外的内部 SQL/文件名。
3. **日志降噪**：通过 `$exceptions->dontReport([...])` 或分级上报避免 4xx 业务拒绝触发 `ERROR` 告警风暴。

## 检查清单

- [ ] 异常映射集中在 `bootstrap/app.php` `withExceptions` 中统一输出信封
- [ ] 4xx 领域异常不触发 `ERROR` 告警风暴，生产环境 `APP_DEBUG=false`
