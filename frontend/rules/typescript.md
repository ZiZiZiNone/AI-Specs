# TypeScript

避免any；类型即文档。

## 规则
- 禁止无理由 any，确实需要时用 unknown 或明确窄化。
- 接口数据定义类型，函数签名显式标注参数与返回。
- 用类型表达意图（可空、枚举、联合），让类型自解释。
- 不为类型写花哨体操，保持可读。
- 公共函数/组件 props 必须有类型定义。

## 可空的表达

**领域数据的可空字段用 `Type | null`，不用 `?:`。**

理由：`?:` 表达的是"这个键可能不存在"，`| null` 表达的是"这个值明确为空"。
接口返回的字段几乎总是存在但可能为空，用 `?:` 会让调用方无法区分
"后端没返回这个字段"和"后端返回了空值"，也让穷尽性检查失效。

```typescript
// ✅ 领域字段：存在但可为空
interface TicketDetail {
  assigneeId: string | null;
  followUpAt: string | null;
}

// ❌ 用 ?: 表达"值为空"，与"键缺失"混为一谈
interface TicketDetail {
  assigneeId?: string;
  followUpAt?: string;
}
```

**例外**：框架机制要求以 `undefined` 作为"未提供"信号的位置（如组件 props
的默认值填充），须用 `?:`。这类例外由框架规范显式说明并给出理由，
见 frontend/frameworks/vue3/component.md。

## 规则表与映射的类型化

按键泛型化，而不是退化为索引签名 + any：

```typescript
// ✅ validator 拿到该字段的精确类型
export type ValidationRules<T> = { [K in keyof T]?: ValidationRule<T[K]>[] };

// ❌ 字段名写错、类型不匹配都不会被发现
export type FieldRules = { [fieldName: string]: { validator?: (v: any) => boolean }[] };
```

## 模块内容顺序

纯 TS 模块（`logic` / `service` / `types` / `hooks`）按此序：
文件头注释 → imports → 类型（`interface` / `type`）→ 常量与映射表 → 私有函数 → 公开导出函数。
`async` 不提前，失败经返回值表达（见 frontend/frameworks/miniprogram/logic.md 入参/返回值约定）。

## 检查清单
- [ ] 无无理由的 any（需要时用 unknown 并窄化）
- [ ] 领域数据可空字段用 `Type | null`
- [ ] 用 `?:` 的位置有框架层面的理由
- [ ] 枚举用联合类型或 enum，不用裸 string
- [ ] 映射/规则表按键泛型化，未退化为索引签名
- [ ] 公共函数与组件 props 有类型定义
- [ ] 模块内容顺序为头注释 → imports → 类型 → 常量 → 私有 → 公开导出
