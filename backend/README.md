# backend

后端专属规范。与 `common/`、`frontend/` 平级。

**状态**：导航入口已建立；PHP 与 Go 语言子树待建（见 `<SPEC_ROOT>/README.md`「TODO」）。

## 用法

- 通用规则（宪法、四条通用原则、命名抽象、测试、重构、性能、注释、任务边界）在 `common/`，
  **不在本目录重复**；本目录只放后端专属结论。
- 进入业务项目先判定语言与框架（读 `composer.json` / `go.mod`），再按需读取对应语言子树；
  涉及框架时进入其二级目录。无对应目录时仅遵循 `common/` 通用规范，
  **不套用其他技术栈的规则**；遇到框架专属决策点应提问而非自行发挥（C1）。

## 分层原则（PHP / Go 共用）

依赖方向唯一向下，与 `common/principles.md`「单向依赖原则」一致：

| 技术栈 | 依赖方向 |
|---|---|
| GoFrame（Go） | `controller → logic → service → dao` |
| Laravel（PHP） | `Controller → Service → Repository → Model` |

四条通用原则（薄入口 / 模块解耦 / 逻辑解耦 / 单向依赖）的后端落地见各语言子树的
`structure.md`。**极致解耦为跨切面硬约束，不是建议**：

- 逻辑单元不接收 HTTP 对象（GoFrame 不得依赖 `*ghttp.Request`；Laravel 不得依赖 `Request` / `Response`）
- 逻辑单元不自己取数据库连接（GoFrame 走 dao，不直接 `g.DB()`）
- 依赖经参数或构造函数显式传入，不用全局单例、静态门面（Facade）、服务定位器
- 逻辑单元必须可脱离宿主单测（不起 HTTP 服务）

## 计划中的子目录

每个语言子树采用「语言级通用 + 框架二级目录」两层，**一主题一文件**：

| 主题文件 | 内容 |
|---|---|
| `README.md` | 读取顺序、与 `common/` 的映射、加载策略 |
| `structure.md` | 项目目录结构、分层职责、依赖方向 |
| `naming.md` | 命名约定 |
| `style.md` | 代码风格与格式化 |
| `error-handling.md` | 错误处理 |
| `logging.md` | 日志记录 |
| `dependencies.md` | 依赖管理 |
| `config.md` | 配置管理 |
| `comments.md` | 注释与文档 |
| `testing.md` | 单元测试 |
| `performance.md` | 性能 |
| `security.md` | 安全 |
| `concurrency.md` | 并发处理（**仅 Go**；PHP 传统 FPM 模型无对应物，不建该文件） |

接口设计（HTTP 契约、业务错误码、分页、幂等、版本化）属前后端共用，规划于 `common/`。

框架二级目录**只写该框架真正引入差异的主题**，不为凑齐主题文件而写。

## 计划中的技术栈

| 子树 | 技术栈 | 状态 |
|---|---|---|
| `php/` | PHP 8.3+ 语言级通用 + Laravel 13 | 待建 |
| `go/` | Go 语言级通用 + GoFrame v2.10 | 待建 |

样例工程：Go 侧计划建于 `backend/go/test/`，须实跑 `go build` 与 `go test`；
PHP 侧因本机 Composer 不可用，暂不建样例，交付时按 `common/protocol/final-gate.md`
「无法验证时的处理」声明未验证项。
