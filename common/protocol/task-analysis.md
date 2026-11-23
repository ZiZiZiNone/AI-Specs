# 任务分析与启动协议

路径基准：本文所有裸路径相对规范库根 `<SPEC_ROOT>` 解析。见 `<SPEC_ROOT>/README.md`「路径基准」。

开工前先判定任务类型、授权面与需求完整度，再进入对应端执行模板。

## 任务类型与默认授权面

| 任务类型 | 适用场景 | 默认授权面 | 对应端模板 |
|---|---|---|---|
| **Feature** | 新增功能、页面、接口、能力模块 | 定向写 / 开放写 | `frontend/tasks/feature.md`、`backend/tasks/feature.md` |
| **Bugfix** | 定位并修复缺陷、回归问题 | 定向写 | `frontend/tasks/bugfix.md`、`backend/tasks/bugfix.md` |
| **Refactor** | 不改变外部行为的内部结构优化 | 定向写 | `frontend/tasks/refactor.md`、`backend/tasks/refactor.md` |
| **Review** | 代码审查、规范审计、质量评估 | **只读** | `frontend/tasks/review.md`、`backend/tasks/review.md` |
| **Hotfix** | 线上故障应急止血（先恢复服务，后补根因与回归测试） | 定向写（最小变更） | 遵循 Bugfix 模板并附回滚方案 |
| **Migration / Ops** | 数据库 Schema 演进、配置/基础设施迁移 | 定向写 | 须叠加 `common/rules/compatibility.md` 与 `backend/patterns/migration-online-ddl.md` |
| **Docs / Spec** | 纯文档、README、规范维护 | 定向写 | 须过 `scripts/check-citations.py --strict` |
| **Research / Spike** | 技术调研、可行性评估、方案对比 | **只读**（除非明确授权原型） | 仅输出方案报告，不改业务源码 |

## 启动流程（四步）

1. **定任务类型与授权面**：按上表确定任务类型，按 `common/protocol/task-boundary.md` 锁定授权面（只读 / 定向写 / 开放写）。
2. **做需求完整性核验**：信息不足时按 `common/protocol/requirement-completeness.md`「阻塞项与非阻塞项判定」分级处理——阻塞项一次问清，非阻塞项采用规范默认并显式说明。
3. **判定技术栈并按需加载规范**：读业务项目依赖文件（`package.json` / `go.mod` / `composer.json`），仅加载命中技术栈与模式的规范文件，禁止全量通读。
4. **先方案后实现**：涉及多文件变更或契约调整时，先明确受影响文件清单与验证方式，再动工写代码。
