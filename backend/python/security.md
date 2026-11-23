# Python 安全规范（BE-105 / BE-106 / COM-013）

路径基准：本文所有裸路径相对规范库根 `<SPEC_ROOT>` 解析。见 `<SPEC_ROOT>/README.md`「路径基准」。

## 核心规则
1. **严禁反序列化与代码注入**：绝对禁止对不可信输入使用 `pickle.loads`、`yaml.load`（必用 `yaml.safe_load`）、`eval`、`exec`、`subprocess(..., shell=True)`。
2. **SQL 参数化与常量时间比对**：全部 SQL 使用绑定参数，签名比对使用 `hmac.compare_digest`；CI 运行 `bandit` 与 `pip-audit`。
