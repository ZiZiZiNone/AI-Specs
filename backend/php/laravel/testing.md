# Laravel 13 测试差异规范

路径基准：本文所有裸路径相对规范库根 `<SPEC_ROOT>` 解析。见 `<SPEC_ROOT>/README.md`「路径基准」。

## Laravel 专属约束

1. **纯单元测试 vs 特性测试分离**：Service 核心逻辑优先纯 PHPUnit/Pest 单测（注入内存 Repository Fake，不启动 Laravel 容器，毫秒级运行）；HTTP 契约、中间件鉴权与数据库事务回滚放 Feature Test（使用 `RefreshDatabase`）。
2. **内置 Fake 工具防外部副作用**：
   - 出向 HTTP 必须使用 `Http::fake()` + `Http::preventStrayRequests()`；
   - 队列/事件/邮件使用 `Queue::fake()` / `Event::fake()` / `Mail::fake()`；
   - 时间相关逻辑使用 `Carbon::setTestNow(...)` 固定时钟，用例结束自动恢复。

## 检查清单

- [ ] 测试配置启用 `Http::preventStrayRequests()`，零真实外网请求
- [ ] 时间敏感用例全部使用 `Carbon::setTestNow()` 固定时间
