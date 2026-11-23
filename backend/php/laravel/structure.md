# Laravel 13 目录与分层差异规范

路径基准：本文所有裸路径相对规范库根 `<SPEC_ROOT>` 解析。见 `<SPEC_ROOT>/README.md`「路径基准」。

本文件仅记录 Laravel 13 专属落地约束与框架陷阱，不重复 `backend/php/structure.md`。

## 规则（Laravel 专属约束）

1. **FormRequest 与授权边界（对齐 `BE-105`）**：
   - `FormRequest::rules()` 仅做请求格式与类型校验；
   - `FormRequest::authorize()` 仅做粗粒度角色/入口开关，**禁止在 FormRequest 中查库做复杂业务状态与细粒度归属判定**——统一交由 Service 层结合实体状态裁决。
2. **Eloquent 防 N+1 与防批量赋值**：
   - 在 `AppServiceProvider::boot()` 对非生产环境启用 `Model::preventLazyLoading(!app()->isProduction())` 与 `Model::preventSilentlyDiscardingAttributes(!app()->isProduction())`；
   - 所有 Model 必须显式声明白名单 `$fillable`，严禁设置 `$guarded = []`。
3. **事务提交后再发事件/队列**：
   - 凡在 `DB::transaction()` 内触发队列任务、通知或缓存删除，**必须**包裹在 `DB::afterCommit(fn () => ...)` 中（或使用 `ShouldDispatchAfterCommit`），防止事务回滚后下游已消费脏事件。
4. **禁止滥用 Eloquent Observer 隐藏副作用**：
   - 禁止在 Model `booted()` / Observer 中偷偷发起外部 HTTP 调用、修改其他聚合表或开启隐式事务；跨实体副作用必须显式编排在 Service 层。

## 检查清单

- [ ] 已开启 `Model::preventLazyLoading`，所有 Model 显式定义 `$fillable`
- [ ] 事务内派发队列/清缓存全部使用 `DB::afterCommit()`
- [ ] 无隐藏跨表写入或外部调用的 Eloquent Observer
