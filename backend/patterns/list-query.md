# 列表查询

路径基准：本文所有裸路径相对规范库根 `<SPEC_ROOT>` 解析。见 `<SPEC_ROOT>/README.md`「路径基准」。

定位：只管"带过滤 + 分页的列表查询"这一种读链路，方向固定为入口 → 业务 → 数据。

## 结构落点

分层唯一来源见 `backend/README.md`「分层原则（PHP / Go 共用）」：GoFrame 为 `controller → service → dao`；Laravel 为 `Controller → Service → Repository → Model`。

本页分工：

- 入口：参数绑定、调业务、写响应，无业务分支。
- 业务：过滤字段白名单、分页参数整形、排序字段与方向双白名单判定。
- 数据：查询组装与执行，循环内重复查询合并为批量查询。
- 响应形状见 `common/rules/api-contract.md`「分页」：列表为 items + page 形状。

防纯转发：某层删掉后若无业务规则丢失即删除，见 `common/principles.md`「单向依赖原则」：「某层删掉后若没有任何业务规则随之丢失，它就不该存在。」

## 规则

- 过滤字段走白名单，未声明字段按参数错误拒绝并归属到字段，不静默忽略；错误落点见 `backend/checklists/detailed-check.md`「接口契约检查」。
- `page` 从 1 起计，`pageSize` 由服务端截断上限，见 `common/rules/api-contract.md`「分页」：「`page` 从 1 起计，`pageSize` 由服务端截断上限」。
- 空页返回空数组加正确的分页信息，不用 404 表示空结果，见 `common/rules/api-contract.md`「分页」：「不用 404 表示空结果」。
- 同一查询只实现一份，循环内查询合并为批量，空结果同样走统一形状。
- 排序键直拼即注入，非白名单排序按参数错误拒绝。
- 新增查询有索引对照，大结果集有用索引支撑。

## 正例指针

- `backend/examples/golden/service-slice.md`「3. 仓储收敛查询实现」：查询组装收敛在数据层，业务层只传过滤结构。
- `backend/examples/golden/service-slice.md`「1. 控制器只做组装与转发」：入口只做绑定、调用与响应。

## 反例指针

- `backend/examples/golden/anti-examples.md`「1. 胖控制器」：过滤与分页拼装落在入口。
- `backend/examples/golden/anti-examples.md`「2. 服务直连数据库」：业务层拼 SQL 字符串。

## 自检指针

- `backend/checklists/detailed-check.md`「接口契约检查」：分页参数与上限、空页形状。
- `backend/checklists/detailed-check.md`「性能检查」：循环内查询、索引对照。
