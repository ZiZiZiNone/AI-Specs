# 通用命名规范

路径基准：本文所有裸路径相对规范库根 `<SPEC_ROOT>` 解析。见 `<SPEC_ROOT>/README.md`「路径基准」。

语言级大小写与缩写细则分别由 `frontend/rules/style.md`、`frontend/rules/typescript.md`、`backend/go/naming.md`、`backend/php/naming.md` 定义；本文件仅规定跨语言语义命名原则。

## 跨语言规则

1. **见名知意，禁用无语义缩写**：禁止 `a`/`b`/`tmp`/`data2`/`info`/`mgr`/`util2` 等模糊命名；仅允许行业通用缩写（`id`/`url`/`http`/`api`/`dto`/`sql`/`ttl`）。
2. **领域词汇全栈统一**：同一业务概念在数据库、后端、API、前端必须使用同一英文词根（例如统一用 `order`，禁止后端叫 `order`、前端叫 `bill`、接口叫 `trade`）。
3. **布尔值禁双重否定**：布尔变量与函数必须使用正向肯定前缀（`is`/`has`/`can`/`should`/`enabled`），禁止 `isNotDisabled`、`noError === false`。
4. **带单位与精度后缀**：涉及时间、金额、容量且类型本身不承载单位时，必须显式带单位后缀——时间戳用 `*At`（ISO-8601 或 Unix 明确约定）、时长用 `*Ms` / `*Seconds`、金额整数分用 `*Cents`（禁止裸 `amount` 混用元与分）、字节用 `*Bytes`。
5. **动词体现副作用**：纯查询/计算用 `get`/`find`/`list`/`calc`/`parse`/`format`；产生状态变更或写入用 `create`/`update`/`delete`/`apply`/`commit`/`publish`。

## 检查清单

- [ ] 无无语义单字母或 `temp`/`data2` 类命名（短循环下标除外）
- [ ] 核心领域名词在前后端与接口契约中一致
- [ ] 布尔命名无双重否定
- [ ] 时长、金额、字节字段明确表达单位，无元/分或秒/毫秒混用隐患
