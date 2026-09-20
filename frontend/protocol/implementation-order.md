# 实现顺序

Pattern→State→Logic→Service→UI。

## 说明
- Pattern：先判断页面/模块属于哪种既有模式（列表/表单/详情等），套用标准结构。
- State：确定状态边界与来源（局部/父级/Store）。
- Logic：实现业务规则与状态流转。
- Service：定义接口访问层。
- UI：最后组装视图与交互。
- 顺序保证先搭骨架与数据流，再铺界面，避免返工。
