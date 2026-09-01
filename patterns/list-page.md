# 列表页

Search→Logic→Service→Table。

## 流程
- Search：搜索条件表单。
- Logic：查询参数组装、分页/排序状态、数据刷新。
- Service：fetchList(params) 接口访问。
- Table：只负责渲染数据与事件回调。

## 规则
- 搜索/分页/排序状态集中在 Logic。
- 表格不直接请求数据，只消费结果。
- 空数据、加载态、错误态统一处理。
