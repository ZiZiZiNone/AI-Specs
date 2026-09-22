# PHP 事务与迁移

路径基准：本文所有裸路径相对规范库根 `<SPEC_ROOT>` 解析，首段为 `common/`、`frontend/` 或 `backend/`。见 `<SPEC_ROOT>/README.md`「路径基准」。

基准见 `backend/README.md`「分层原则（PHP / Go 共用）」与 `common/principles.md`「薄入口原则」。本文是 `backend/checklists/detailed-check.md`「事务检查」各条的规则源，清单只判结论，不重复本文件。

## 规则

- 事务边界在服务层，控制器与表单请求不碰事务，只做组装与转发。
- 服务用事务闭包包裹多仓储调用；仓储默认靠框架绑定执行，不收事务参数，确需手动连接时收可选连接并注明场景。
- 表单请求只做格式校验，业务存在性与权限校验归服务，事务决策不前移到校验层。
- 失败分支全部回滚，早退路径不漏回滚；提交前校验已通过；唯一冲突后的回读必须在失败事务之外的新读路径执行，默认读已提交，冲突重试预算由业务项目声明。
- 事务内不调外部网络与长耗时操作；必须调用时超时与补偿已说明。
- 迁移 up 与 down 配对可回滚，数据回填走可重跑命令且幂等；接口破坏性变更的版本策略见 `common/rules/api-contract.md`「版本化」，不与迁移版本混用。
- 跨用例协作由服务组合多个仓储，事务不跨用例硬包。

## 正例指针

- `backend/examples/golden/service-slice.md`「2. 服务承载规则与事务边界」：闭包定界、失败返零值。
- `backend/examples/golden/service-slice.md`「4. 配套断言覆盖行为与回滚」：回滚三件套断言。

## 反例指针

- `backend/examples/golden/anti-examples.md`「5. 事务内调用外部网络」：外部调用移出事务或说明补偿。

## 自检指针

- `backend/checklists/detailed-check.md`「事务检查」：边界、回滚、隔离、迁移。
- `backend/checklists/detailed-check.md`「测试检查」：事务回滚与幂等重放断言。

## 决策指针

- `backend/protocol/decision-trees.md`「二、事务边界决策」：开启点与外部调用判定。

## 检查清单

- [ ] 事务边界在服务层，入口与校验层无事务语句
- [ ] 仓储无自行开关事务
- [ ] 失败与早退路径全部回滚
- [ ] 事务内无外部调用，或超时补偿已说明
- [ ] 迁移可执行可回滚，回填幂等可重跑
- [ ] 事务不跨用例硬包
