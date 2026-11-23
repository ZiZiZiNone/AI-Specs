# Rust 事务边界规范（BE-103）

路径基准：本文所有裸路径相对规范库根 `<SPEC_ROOT>` 解析。见 `<SPEC_ROOT>/README.md`「路径基准」。

## 规则
- 使用 SQLx `pool.begin().await?` 在 Service 层显式传递 `&mut Transaction` 给仓储方法，结束前调用 `tx.commit().await?`，未提交时 Drop 自动回滚；事务内禁发外部 HTTP。

## 检查清单
- [ ] 生产路径零 `.unwrap()` / `.expect()`，零 `unsafe`
- [ ] 严格遵守 `BE-101` 至 `BE-108` 与 `COM-013` 至 `COM-018`
