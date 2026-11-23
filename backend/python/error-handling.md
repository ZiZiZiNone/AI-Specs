# Python 错误与异常处理规范

路径基准：本文所有裸路径相对规范库根 `<SPEC_ROOT>` 解析。见 `<SPEC_ROOT>/README.md`「路径基准」。

## 核心规则
1. **禁裸 `except:` 与空吞异常**：永远捕获精确异常类型；禁止 `except Exception: pass`；向上重抛保留因果链 `raise DomainError(...) from exc`。
2. **统一领域异常基类**：定义 `DomainError(error_code: int, message: str, context: dict)`，入口层统一映射为 `common/rules/api-contract.md` 信封（`data: None`）。
