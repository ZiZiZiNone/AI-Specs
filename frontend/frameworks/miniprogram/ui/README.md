# 小程序 UI 组件库

路径基准：本文所有裸路径相对规范库根 `<SPEC_ROOT>` 解析。见 `<SPEC_ROOT>/README.md`「路径基准」。

按组件库分子目录，进入项目判定组件库后读取对应目录。

- 无对应组件库目录时，不套用其他库规范。
- 新增组件库：新建 `<uilib>/` 目录，必须写明与本规范的三类冲突取舍：
  1. 组件库自带校验 vs「校验规则在 Logic」
  2. 表格/分页等组件内部状态 vs「状态集中在 Logic」
  3. 命令式 API（Message/Modal）的允许调用位置
- 现有目录：
  - tdesign-miniprogram/：TDesign 小程序端与本规范的冲突取舍
  - vant-weapp/：Vant 小程序端与本规范的冲突取舍
