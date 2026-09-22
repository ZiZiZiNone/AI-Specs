# 命名

> 路径基准：本文所有裸路径相对规范库根 `<SPEC_ROOT>` 解析。见 `<SPEC_ROOT>/README.md`「路径基准」。

命名表达意图；禁止无信息量命名。**具体大小写形态按语言**，见对应子树的 `backend/go/naming.md` 与 `backend/php/naming.md`。

## 跨语言规则

- 命名表达意图，能"读出声说明什么"，而非"说明怎么实现"。
- 函数用动词开头：fetchUser、saveForm、submitOrder。
- 布尔量用 is/has/can 开头：isLoading、hasError、canSubmit。
- 禁止 temp、common、data、info 等无信息量命名；缩写不明时写全称。
- 同一概念在代码、接口、数据库与文档中使用**同一名称**，不一处一个叫法。

## 大小写形态（按端）

- **前端**（TS / Vue / 小程序）：组件 PascalCase；变量与函数 camelCase；
  常量 UPPER_SNAKE（MAX_PAGE_SIZE）；事件回调 handleXxx / onXxx。
- **后端**：按语言约定，见对应子树的 `backend/go/naming.md` 与 `backend/php/naming.md`。
  - Go：标识符用 MixedCaps，**首字母大小写决定导出性**，不额外加 Get/Set 式前缀；包名小写单词。
  - PHP：遵循 PSR-1 / PSR-12；类 PascalCase、方法与变量 camelCase、常量 UPPER_SNAKE。
