# 任务分析

先识别任务类型。

## 判定
- 新功能 / 新页面 / 新模块 / 新接口 → Feature。
- 现有行为出错 → Bugfix。
- 结构调整、不改行为 → Refactor。
- 审查代码、给结论 → Review。
- 边界模糊时先分析本质，不套错模板。

## 流程
- 第一步判定任务类型（见上），按对应任务规范走流程
  （前端：`frontend/tasks/`；后端：`backend/tasks/`，待建）。
- 第二步确定授权面（只读 / 定向写 / 开放写），见 `common/protocol/task-boundary.md`；拿不准按只读档。
- 分析需求来源、目标、范围、边界与验收标准。
- 信息不足时按 `common/protocol/requirement-completeness.md` 分级处理：
  阻塞项先确认，非阻塞项标注"待确认"继续，禁止用猜测补齐。
