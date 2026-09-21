# common

前后端通用规范。与 `frontend/`、`backend/` 平级，三棵树各司其职。

## 用法

- **任何**任务（前端或后端）开工前，先读本文与 `common/rules/constitution.md`、
  `common/principles.md`、`common/protocol/task-boundary.md`。
- 本目录只放**与语言、框架、端无关**的规则。任何一端专属的结论不放这里——
  前端专属进 `frontend/`，后端专属进 `backend/`。
- 通用原则只写一份，各子树只写**落地形态**，不重复原则本身。

## 子目录

- `common/principles.md`：四条通用原则（薄入口 / 模块解耦 / 逻辑解耦 / 单向依赖）+ 极致解耦总纲
- `common/rules/`
  - `constitution.md`：宪法（禁止猜测、用户决策权、规范优先、已覆盖直接执行、引用可验伪、授权面）
  - `api-contract.md`：接口契约（复数名词、无动词路径、响应信封、业务错误码、分页、幂等、版本化）
  - `naming.md`：命名抽象原则（大小写形态按端，见对应子树）
  - `comment.md`：注释规范
  - `test.md`：测试规范（含 mock / 假数据约定）
  - `refactor.md`：重构规范
  - `reusability.md`：复用抽象时机
  - `performance.md`：性能优化规范
  - `business-rule.md`：业务规则位置
  - `readme.md`：项目根 README 规范（人工操作与使用说明的必载内容）
- `common/protocol/`
  - `task-boundary.md`：任务边界（授权面三档、消费者判据四问、四类越界）
  - `task-analysis.md`：任务类型判定
  - `requirement-completeness.md`：需求完整性检查
  - `final-gate.md`：最终闸门验收（含无法验证时的声明要求）

## 加载策略

**必读四件**（含根 README）：

1. `<SPEC_ROOT>/README.md`
2. `common/rules/constitution.md`
3. `common/principles.md`
4. `common/protocol/task-boundary.md`

**按需读取**：其余文件按当前任务涉及的领域取用，禁止全量通读。

## 与各子树的关系

| 端 | 子树 | 通用原则的落地文件 |
|---|---|---|
| 前端 | `frontend/` | `frontend/rules/core-principles.md`（P1–P4） |
| 后端（PHP） | `backend/php/`（待建） | 该子树的 `structure.md`（待建） |
| 后端（Go） | `backend/go/`（待建） | 该子树的 `structure.md`（待建） |

后端分层的共用约定见 `backend/README.md`。
