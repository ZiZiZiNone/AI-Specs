# Laravel 13 配置管理差异规范

路径基准：本文所有裸路径相对规范库根 `<SPEC_ROOT>` 解析。见 `<SPEC_ROOT>/README.md`「路径基准」。

## Laravel 专属约束

1. **`config/` 之外严禁调用 `env()`（关键陷阱）**：生产环境执行 `php artisan config:cache` 后，`config/` 目录外直接调用 `env()` 会始终返回 `null`！所有环境变量必须先映射到 `config/*.php`，业务代码仅在装配层读取 `config(...)` 并通过构造参数注入 Service。
2. **密钥与环境模板**：`.env` 严禁提交入库，仅维护 `.env.example` 占位模板；生产环境强制 `APP_DEBUG=false`。

## 检查清单

- [ ] `app/` 目录内零处直接调用 `env()`
- [ ] `Service` 通过构造函数接收标量/配置对象，不直接依赖 `config()` 全局函数
