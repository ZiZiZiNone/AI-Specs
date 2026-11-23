# common — 通用工程规范

路径基准：本文所有裸路径相对规范库根 `<SPEC_ROOT>` 解析。见 `<SPEC_ROOT>/README.md`「路径基准」。

本目录存放**端无关、语言无关、框架无关**的通用工程宪法、原则、规则与协作协议。
前端专属规范进 `frontend/`，后端专属规范进 `backend/`；凡涉及具体语言/框架语法的细则，一律下沉到对应端或语言子树。

## 必读四件对齐说明

任何任务开工前按序读完的四件是：
1. `<SPEC_ROOT>/README.md`
2. `common/rules/constitution.md`
3. `common/principles.md`
4. `common/protocol/task-boundary.md`

本文件（`common/README.md`）是目录导航索引，不属于必读四件，按需查阅即可。

## 目录索引

### 核心总纲
- `common/principles.md`：极致解耦总纲与四条通用原则（薄入口、模块解耦、逻辑解耦、单向依赖）

### 通用规则（`common/rules/`）
- `common/rules/communication.md`：用户沟通与报告规范（COM-019：结论先行、默认不展过程、白话表达）
- `common/rules/constitution.md`：宪法条款（`COM-007` 至 `COM-019`）与引用验伪细则
- `common/rules/api-contract.md`：前后端接口契约（REST、信封、状态码矩阵、分页、幂等、版本化）
- `common/rules/security.md`：通用安全基线（鉴权默认拒绝、输入校验、密钥治理、防越权）
- `common/rules/observability.md`：可观测性与隐私脱敏（结构化日志、`requestId`/`traceId`、PII 脱敏）
- `common/rules/ai-safety.md`：AI 辅助开发防线（防 API/依赖幻觉、供应链核验、防提示词注入）
- `common/rules/compatibility.md`：向后兼容与数据演进（Expand-Contract、滚动发布兼容、回滚预案）
- `common/rules/test.md`：跨语言行为测试原则、边界/互逆断言与 Mock 标注纪律
- `common/rules/naming.md`：跨语言语义命名原则与单位/时间/金额后缀约定
- `common/rules/business-rule.md`：业务规则建模边界（展示格式化 vs 领域规则、状态机、金额精度）
- `common/rules/comment.md`：契约注释 vs 实现注释、`TODO` 追踪格式与禁留死代码
- `common/rules/performance.md`：性能优化基线测量要求与通用性能红线
- `common/rules/refactor.md`：安全重构协议（特征测试前置、提交隔离、并行演进）
- `common/rules/reusability.md`：复用与抽象时机（本质重复 vs 偶发重复、过度抽象红灯）
- `common/rules/readme.md`：业务项目根 `README.md` 必载项与禁令

### 协作协议（`common/protocol/`）
- `common/protocol/task-boundary.md`：任务授权面（只读 / 定向写 / 开放写）与消费者判据
- `common/protocol/task-analysis.md`：任务类型判定（Feature / Bugfix / Refactor / Review / Hotfix / Migration / Docs / Spike）与启动流程
- `common/protocol/requirement-completeness.md`：需求完整性检查与阻塞项/非阻塞项判定标准
- `common/protocol/final-gate.md`：交付前最终门禁与未验证项声明模板

## 端落地映射

| 通用规范 | 前端落地 | 后端落地 |
|---|---|---|
| `common/principles.md` | `frontend/rules/core-principles.md`（`FE-101`~`FE-104`） | `backend/rules/core-principles.md`（`BE-101`~`BE-108`） |
| `common/rules/naming.md` | `frontend/rules/style.md`、`frontend/rules/typescript.md` | `backend/go/naming.md`、`backend/php/naming.md` |
| `common/rules/security.md` | `frontend/rules/security.md` | `backend/patterns/authz-security.md`、`backend/go/security.md`、`backend/php/security.md` |
| `common/rules/observability.md` | `frontend/rules/error-handling.md` | `backend/patterns/observability.md`、`backend/go/logging.md`、`backend/php/logging.md` |
| `common/rules/performance.md` | `frontend/rules/performance.md` | `backend/go/performance.md`、`backend/php/performance.md`、`backend/patterns/caching.md` |
| `common/rules/test.md` | `frontend/frameworks/vue3/testing.md`、`frontend/frameworks/miniprogram/testing.md` | `backend/go/testing.md`、`backend/php/testing.md` |
| 目录结构落地 | `frontend/rules/architecture.md` | `backend/go/structure.md`、`backend/php/structure.md` |
