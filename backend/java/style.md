# Java 17/21+ 风格与复杂度规范

路径基准：本文所有裸路径相对规范库根 `<SPEC_ROOT>` 解析。见 `<SPEC_ROOT>/README.md`「路径基准」。

## 规则
- 优先使用 `record`、`sealed interface`、`Optional`（仅作返回值不作字段/入参）；金额用 `long`（分）或 `BigDecimal`（禁 `double`/`float`）；单方法 ≤ 50 行、参数 ≤ 4 个。

## 检查清单
- [ ] 严格遵守 `BE-101` 至 `BE-108` 与 `COM-013` 至 `COM-018`
