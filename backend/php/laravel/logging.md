# Laravel 13 日志差异规范

路径基准：本文所有裸路径相对规范库根 `<SPEC_ROOT>` 解析。见 `<SPEC_ROOT>/README.md`「路径基准」。

## Laravel 专属约束

1. **入口中间件统一注入上下文（对齐 `backend/php/logging.md`）**：在全局 HTTP 中间件生成或读取 `X-Request-Id`，调用 `Log::withContext(['requestId' => $reqId, 'traceId' => $traceId])`（或 `Context::add(...)`），并在响应头回写 `X-Request-Id`。
2. **Monolog 脱敏 Processor**：在 `config/logging.php` 的通道 `tap` 中挂载自定义 Monolog Processor，统一屏蔽 `password`/`token`/`authorization` 与完整 PII，生产通道使用 `JsonFormatter`。
3. **逻辑层依赖 PSR-3**：Service 注入 `Psr\Log\LoggerInterface`，不直接静态调 `Log::info()`。

## 检查清单

- [ ] `X-Request-Id` 在入口中间件统一生成并注入 `Log::withContext` 与响应头
- [ ] 生产日志通道已配置 JSON 格式化与敏感字段脱敏 Processor
