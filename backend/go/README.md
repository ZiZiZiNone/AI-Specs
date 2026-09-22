# Go 语言子树总览

路径基准：本文所有裸路径相对规范库根 `<SPEC_ROOT>` 解析，首段为 `common/`、`frontend/` 或 `backend/`。见 `<SPEC_ROOT>/README.md`「路径基准」。

本目录只写 Go 专属结论，通用规则不重复。通用薄入口定义见 `common/principles.md`「薄入口原则」：入口只负责组装与转发。通用依赖方向见 `common/principles.md`「单向依赖原则」：依赖方向唯一且向下。Go 依赖链唯一来源见 `backend/README.md`「分层原则（PHP / Go 共用）」。

## 规则

- 先读业务项目根 `go.mod`（非规范库路径，不适用路径基准）判定模块名与 Go 版本，再选读本目录文件，不套用 PHP 规则。
- 阅读顺序：本文件→`backend/go/structure.md`→`backend/go/error-handling.md`→`backend/go/testing.md`→按需读其余；可运行切片见 `backend/go/test/`。
- 涉及 GoFrame 时再进入 `backend/go/goframe/`，二级目录只读差异点。
- 通用结论缺失时回退 `common/`，不自创跨语言规则。
- 所有 logic 必须满足可脱离宿主单测，否则视为未就绪，见 `backend/README.md`「分层原则（PHP / Go 共用）」：「逻辑单元必须可脱离宿主单测（不起 HTTP 服务）」。
- 新依赖、配置项、并发原语必须指明直接消费者，否则不引入，见 `common/protocol/task-boundary.md`「消费者判据（四问）」。

## 框架差异

涉及 GoFrame 时再进入 `backend/go/goframe/`，无对应文件即无差异：

- `backend/go/goframe/README.md`：二级目录总览与阅读顺序
- `backend/go/goframe/structure.md`：控制器绑定、服务接口与逻辑实现的 GoFrame 落点
- `backend/go/goframe/config.md`：启动装配期收敛、敏感缺失即失败
- `backend/go/goframe/error-handling.md`：中间件收敛业务码、生产关闭调试输出
- `backend/go/goframe/logging.md`：请求标识中间件生成、敏感载荷默认不记
- `backend/go/goframe/testing.md`：接口与实现分离测试、控制器只测边界形状

## 检查清单

- [ ] 已确认业务项目根 `go.mod`（非规范库路径）模块与工具链版本
- [ ] 已读分层与依赖方向并能复述调用链
- [ ] 未混入 PHP 或其他栈写法
- [ ] GoFrame 差异已在二级目录核对
- [ ] 通用问题能在 `common/` 找到回链
- [ ] 无全局单例直连逻辑
