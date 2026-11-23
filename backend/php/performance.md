# PHP 性能与内存规范

路径基准：本文所有裸路径相对规范库根 `<SPEC_ROOT>` 解析。见 `<SPEC_ROOT>/README.md`「路径基准」。

## 规则与正反示例

1. **消除 N+1 与大结果集 OOM**：关联查询使用预加载（Eager Loading）；大批量导出与历史回填必须使用游标/分块（`chunkById` / Generator `yield`），严禁 `fetchAll()` 一次性把十万行加载进 PHP 内存。
2. **缓存与常驻内存防泄漏**：遵循 `backend/patterns/caching.md`；在 Swoole/Octane 常驻进程模式下，严禁在静态属性中缓存请求级数据导致内存持续增长与跨请求串号。

```php
// ✅ 正例：分批流式处理大表
foreach ($repo->cursorById($batchSize = 500) as $batch) {
    processBatch($batch);
}

// ❌ 反例：循环内逐条查库（N+1）
foreach ($orders as $o) { $o->user = $userRepo->find($o->userId); }
```

## 检查清单

- [ ] 无循环内 DB/HTTP 查询，大导出与回填均采用分块或流式游标
- [ ] 常驻内存模式无静态请求态缓存泄漏
