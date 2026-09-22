# 胖控制器

对齐关系见 `backend/go/structure.md` 与 `backend/php/structure.md`，本文件不自立阈值，命中症状即进入对策。

对齐条目：`backend/go/structure.md`「规则」：「controller 只做参数绑定、调 service、写响应，无业务分支。」；`backend/php/structure.md`「规则」：「控制器只解析输入、调用服务、返回资源，禁止业务判断与模型直调。」

## 定义

控制器承担组装转发之外的职责即为胖控制器，入口只保留路由、参数绑定与响应封装。

## 判定信号

### 可观测信号

- 控制器内出现业务判断、数据转换、状态计算、直接访问数据源中的任一种。
- 控制器内出现 SQL 字符串、事务语句、状态码拼装、权限结论拼装。
- 同一过滤或分页拼装在多个控制器各写一遍。

### 症状（命中 2 条即进入对策）

- 改一处业务规则需通读多个控制器。
- 换一个入口（新路由复用同一用例）需复制整段逻辑。
- 控制器函数达标行数但逻辑下沉处只是原样转发，无规则丢失即可删除。

## 对策（落到哪层，四选一写明）

- 业务判断与规则计算 → 业务层（Go 的 logic / Laravel 的 Service）。
- 查询组装与执行 → 数据层（Go 的 dao / Laravel 的 Repository）。
- 事务边界 → 服务层唯一开启点，见 `backend/protocol/decision-trees.md`「二、事务边界决策」。
- 格式校验留入口，业务存在性与权限校验归服务：表单请求只做格式校验。

## 正例指针

- `backend/examples/golden/service-slice.md`「1. 控制器只做组装与转发」：绑定、调用、响应三步，无分支。
- `backend/patterns/list-query.md`「规则」：过滤白名单与分页整形在业务层。

## 反例指针（`backend/examples/golden/anti-examples.md`，标题原文引用，不编新条号）

- 「1. 胖控制器」：过滤、权限、事务全堆入口。
- 「2. 服务直连数据库」：瘦身控制器后业务层直接拼 SQL，属换地方堆积。

## 自检指针（`backend/checklists/detailed-check.md`，用小节名）

- 「分层检查」：入口无业务分支与 SQL。
- 「接口契约检查」：参数校验归属与错误码。

## 决策指针（`backend/protocol/decision-trees.md`，指针短语）

- 「一、分层落位决策」：新逻辑落位判定。
- 「二、事务边界决策」：事务开启点判定。
