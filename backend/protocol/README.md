# protocol

路径基准：本文所有裸路径相对规范库根 `<SPEC_ROOT>` 解析。见 `<SPEC_ROOT>/README.md`「路径基准」。

后端决策协议。遇分层、事务、重试、复用决策点时取用，不全量通读。

任务内的执行顺序见 `backend/tasks/` 各模板流程节（Feature、Bugfix、Refactor、Review 各异），本目录只收决策判定，不重复顺序。

- `backend/protocol/decision-trees.md`：决策流程图
