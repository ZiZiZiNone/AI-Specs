# 多表写事务

路径基准：本文所有裸路径相对规范库根 `<SPEC_ROOT>` 解析。见 `<SPEC_ROOT>/README.md`「路径基准」。

定位：只管"同一业务用例的多表写"这一种写链路，边界唯一且在服务层。

## 结构落点

分层唯一来源见 `backend/README.md`「分层原则（PHP / Go 共用）」。事务规则源按语言取用：Go 见 `backend/go/transaction.md`「规则」；PHP 见 `backend/php/transaction.md`「规则」。

本页分工：

- 入口：参数绑定、调业务、写响应，不开事务。
- 业务：显式开启事务，失败分支全部回滚，早退路径不漏回滚。
- 数据：接收事务对象执行读写，不私开跨界事务。
- 迁移与回填随本次变更同交付：迁移可执行可回滚，回填脚本幂等。

## 规则

- 单行单表无附加原子要求时不开事务；需与去重键或多行同原子落子时即使单表也开事务。多表写先过 `backend/protocol/decision-trees.md`「二、事务边界决策」。
- 事务开启点唯一且在服务层，数据层只接收事务对象。
- 失败分支全部回滚，提交前校验已通过。
- 事务内不调外部网络与长耗时操作；必须调用时超时与补偿已说明。
- 跨模块协作由服务组合多个数据单元，事务不跨用例硬包：Go 见 `backend/go/structure.md`「规则」：「跨模块调用走 service 接口，不直调对方 logic 或 dao。」；PHP 见 `backend/php/structure.md`「规则」：「跨聚合协作由服务组合多个仓储，禁止仓储相互调用。」
- 修共享业务与共享仓储时查所有调用方，见 `common/protocol/task-boundary.md`「修共享函数时必须一并改真实受影响的调用方」。

## 正例指针

- `backend/examples/golden/service-slice.md`「2. 服务承载规则与事务边界」：闭包定界、同事务落子、冲突后外部回读。
- `backend/examples/golden/service-slice.md`「4. 配套断言覆盖行为与回滚」：失败分支回滚断言。

## 反例指针

- `backend/examples/golden/anti-examples.md`「5. 事务内调用外部网络」：外部调用包在事务内且无超时补偿。
- `backend/examples/golden/anti-examples.md`「2. 服务直连数据库」：业务层绕开数据层拼 SQL。

## 自检指针

- `backend/checklists/detailed-check.md`「事务检查」：边界、回滚、隔离、迁移。
- `backend/checklists/detailed-check.md`「测试检查」：事务回滚与幂等重放断言。
