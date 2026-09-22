# 创建幂等

路径基准：本文所有裸路径相对规范库根 `<SPEC_ROOT>` 解析。见 `<SPEC_ROOT>/README.md`「路径基准」。

定位：只管"需防重放的 POST 创建"这一种写链路，防重复创建资源。

## 结构落点

分层唯一来源见 `backend/README.md`「分层原则（PHP / Go 共用）」。幂等语义见 `common/rules/api-contract.md`「幂等与重试」。

本页分工：

- 入口：透传幂等键，不做去重判定。
- 业务：按键去重，去重窗口由业务项目声明；同一键重复提交返回首次结果；幂等键绑定用户或租户作用域，同键载荷不一致返回业务冲突，不跨作用域复用结果。
- 数据：幂等键建唯一约束，与业务行同事务落子；唯一冲突即返回首次结果。
- 唯一冲突后在失败事务之外的新读路径回读首次结果，不在已冲突事务内继续查询；默认读已提交，重试预算由业务项目声明。
- 去重窗口与 TTL 随存储落子并声明；生产键须密码学随机，测试键注明非生产生成方式。

## 规则

- 非幂等写默认不重试，见 `common/rules/api-contract.md`「幂等与重试」：「`POST` 禁自动重试」。
- 需防重放的创建使用幂等键，见 `common/rules/api-contract.md`「幂等与重试」：「调用方生成 `Idempotency-Key`，服务端按键去重」。
- 同一幂等键重复提交返回首次结果，不执行第二次副作用。
- 数据层提供按幂等键查询，业务层只做分支决策；判定逻辑不进仓储，查询实现不进业务层。
- 重试只在业务边界显式决策，数据层内不得自行重试。
- 参数校验在入口与业务边界完成，错误归属到字段并返回可用错误码。

## 正例指针

- `backend/examples/golden/service-slice.md`「2. 服务承载规则与事务边界」：闭包定界、同事务落子、冲突后外部回读。
- `backend/examples/golden/service-slice.md`「4. 配套断言覆盖行为与回滚」：同一键重放返回首次结果的断言。

## 反例指针

- `backend/examples/golden/anti-examples.md`「4. 幂等键无人消费」：键透传了但去重逻辑不存在。
- `backend/examples/golden/anti-examples.md`「1. 胖控制器」：去重判定写在入口。

## 自检指针

- `backend/checklists/detailed-check.md`「接口契约检查」：幂等键声明与非幂等默认不重试。
- `backend/checklists/detailed-check.md`「错误检查」：预期错误与系统故障区分返回。
