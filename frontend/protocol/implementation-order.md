# 实现顺序

> 路径基准：本文所有裸路径相对规范库根 `<SPEC_ROOT>` 解析。见 `<SPEC_ROOT>/README.md`「路径基准」。

Pattern→State→Logic→Service→UI（对应 `frontend/tasks/feature.md`「流程：需求→设计→实现→检查」中"实现：按 Pattern→State→Logic→Service→UI 落地"）。

## 说明（每阶段输入/输出/完成口径；整体链到 `frontend/tasks/feature.md`「流程：需求→设计→实现→检查」之实现步）
- Pattern：输入需求与页面类型；输出选定的既有模式与标准结构；完成口径为模式已指名且结构已套用，未命中既有模式时先按 `frontend/tasks/feature.md`「设计：判断 pattern」确认，不自造模式。
- State：输入模式结构与数据来源；输出状态边界与来源划分（局部/父级/URL/Store）；完成口径为每份状态归属已判定且需刷新保持者以 URL 为唯一来源（见 `frontend/rules/store.md`「状态归属决策」）。
- Logic：输入业务规则与状态流转需求；输出框架无关的 Logic 实现；完成口径为可判定的业务规则确实落在此层且可单独测试。
- Service：输入接口需求；输出唯一的接口访问层；完成口径为 try-catch 收敛统一出口、返回统一 Result，且 UI 未直连接口。
- UI：输入上述四层产物；输出组装好的视图与交互；完成口径为页面只做组装与传递、无业务判断，且通过 `frontend/checklists/detailed-check.md` 适用章节与 `common/protocol/final-gate.md` 验证。
- 顺序保证先搭骨架与数据流，再铺界面，避免返工。
