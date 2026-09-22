# PHP 样例工程

路径基准：本文路径相对规范库根 `<SPEC_ROOT>` 解析。见 `<SPEC_ROOT>/README.md`「路径基准」。

本目录为 `backend/php/` 最小可运行切片：创建订单（幂等键 + 事务边界），零依赖（无 Composer 包），`php test/run.php` 即跑。

## 运行

```bash
cd backend/php/test
php -l src/OrderService.php && php -l src/MemoryOrderRepository.php
php test/run.php
```

## 落位对照

- 入口：`src/OrderController.php`（组装与转发）。
- 服务：`src/OrderService.php`（全部业务规则，事务闭包定界）。
- 仓储：`src/MemoryOrderRepository.php`（查询实现收敛，内存实现）。
- 测试：`test/run.php`（内存替身，不起服务不连真实库）。

Laravel 形态差异（表单请求、资源类、Eloquent 绑定）见 `backend/php/laravel/`，本样例不引入框架，保持零依赖可跑。
