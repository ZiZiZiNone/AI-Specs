# Python 风格、类型与复杂度规范

路径基准：本文所有裸路径相对规范库根 `<SPEC_ROOT>` 解析。见 `<SPEC_ROOT>/README.md`「路径基准」。

## 核心规则
1. **强制全量类型注解**：启用 `mypy --strict`（或 Pyright strict），禁止无类型 `dict[str, Any]` 四处透传核心业务载荷；DTO 使用 `@dataclass(frozen=True, slots=True)` 或 Pydantic v2 `BaseModel`。
2. **格式化与静态检查**：统一使用 `ruff check` 与 `ruff format --check`；单函数 ≤ 50 行、参数 ≤ 4 个（超出封装为不可变 dataclass）。
3. **禁止可变默认参数**：严禁 `def f(items: list[str] = []):`（必须 `items: list[str] | None = None`）。
