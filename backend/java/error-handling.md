# Java 异常处理规范

路径基准：本文所有裸路径相对规范库根 `<SPEC_ROOT>` 解析。见 `<SPEC_ROOT>/README.md`「路径基准」。

## 规则
- 定义非受检 `DomainException` 携带 `errorCode`，在 `@RestControllerAdvice` 统一映射 `common/rules/api-contract.md` 信封（`data: null`）；严禁 `e.printStackTrace()` 与空 `catch`。

## 检查清单
- [ ] 严格遵守 `BE-101` 至 `BE-108` 与 `COM-013` 至 `COM-018`
