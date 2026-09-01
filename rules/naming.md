# 命名

动词命名函数；is/has/can布尔；禁止temp/common等模糊命名。

## 规则
- 函数用动词开头：fetchUser、saveForm、submitOrder；事件回调用 handleXxx/onXxx。
- 布尔变量用 is/has/can 开头：isLoading、hasError、canSubmit。
- 常量用大写蛇形：MAX_PAGE_SIZE。
- 组件用 PascalCase，变量/函数用 camelCase。
- 禁止 temp、common、data、info 等无信息量命名；缩写不明时写全称。
- 命名表达意图，能"读出声说明什么"，而非"说明怎么实现"。
