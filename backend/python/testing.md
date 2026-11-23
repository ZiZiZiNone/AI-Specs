# Python 测试规范

路径基准：本文所有裸路径相对规范库根 `<SPEC_ROOT>` 解析。见 `<SPEC_ROOT>/README.md`「路径基准」。

## 规则
- 遵循 `common/rules/test.md`「规则」，通过构造函数注入 `clock: Callable[[], int]` 与内存 Fake 仓储实现零 I/O 确定性测试；禁止依赖真实网络或系统时钟。
