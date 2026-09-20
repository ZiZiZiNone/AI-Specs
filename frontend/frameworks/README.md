# frameworks

框架专属规范，按框架一个子目录；框架目录内再按主题/组件库细分。

## 用法
- 进入具体项目先判定框架（读代码与依赖），再进入对应子目录按需读取。
- 框架目录内涉及 UI 组件库时，进入 ui/<组件库>/ 二级目录读取；无对应目录时不套用其他库规范。
- 无对应框架目录时，仅遵循通用规范（`common/rules/` 等），不套用其他框架的规则。

## 子目录约定
- 每个框架目录自包含，只放该框架专属规则（Hook/组合式函数、状态实现、框架测试、组件库约定等）。
- 框架无关的原则留在 `common/rules/`，不在框架目录重复。
- 新增框架/组件库：新建对应目录并补 README 说明，参照现有目录组织。

## 现有目录

- **vue3/**（覆盖度较完整，可作为新增框架目录的参照）
  - README.md：读取顺序与通用规范索引
  - reactivity.md：ref/shallowRef/reactive/computed 选型、watch 边界
  - state.md：归属结论到实现的映射、URL 状态、Pinia store 边界
  - composable.md：组合式函数参数与返回约定、清理、竞态
  - component.md：defineProps/defineEmits、受控业务组件、可选性表达
  - router.md：路由定义、params/query 分工、守卫、权限三处一致
  - testing.md：各层测试方式与不测清单
  - ui/arco/README.md：Arco Design Vue 与本规范的冲突取舍
- **miniprogram/**（微信原生 + TS，已定稿 2026-09-03）
  - README.md：读取顺序、Hook 层映射（logic 纯函数承担）、通用规范索引
  - state.md：setData 语义、data 归属、页面间传参与全局状态边界
  - logic.md：B 方案纯函数约定、setData 回写、清理与竞态（对应 vue3/composable.md 的位置）
  - component.md：properties/observers/lifetimes、受控组件、可选性表达
  - router.md：四类导航 API 分工、params/query、登录守卫、app.json 与分包
  - service.md：wx.request 封装、登录态与 baseURL、Service 层映射
  - testing.md：各层测试方式与不测清单
  - ui/tdesign-miniprogram/：TDesign 小程序端与本规范的冲突取舍
  - ui/vant-weapp/：Vant 小程序端与本规范的冲突取舍

## 说明
- React 框架规范已移除（2026-09-03）：本库当前只覆盖 Vue 3 与微信小程序。
- miniprogram/ 已定稿（2026-09-03，见 miniprogram/README.md）；
  填充时沿用"以 vue3/ 的文件划分为模板，但**不要照搬 Vue 的机制结论**"原则——
  小程序的 setData / Component 语义与 Vue 不同，需按小程序自身语义重写。
