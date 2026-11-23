# Axum 框架差异规范

路径基准：本文所有裸路径相对规范库根 `<SPEC_ROOT>` 解析。见 `<SPEC_ROOT>/README.md`「路径基准」。

## 规则
- 共享状态通过 `State<Arc<AppState>>` 注入；为领域错误实现 `IntoResponse` 统一输出 `common/rules/api-contract.md` 信封（`data: null`）；配置 `tower_http::timeout::TimeoutLayer` 与 `with_graceful_shutdown`。

## 检查清单
- [ ] 生产路径零 `.unwrap()` / `.expect()`，零 `unsafe`
- [ ] 严格遵守 `BE-101` 至 `BE-108` 与 `COM-013` 至 `COM-018`
