# frameworks

框架专属规范，按框架一个子目录；框架目录内再按主题/组件库细分。

## 用法
- 进入具体项目先判定框架（读代码与依赖），再进入对应子目录按需读取。
- 框架目录内涉及 UI 组件库时，进入 ui/<组件库>/ 二级目录读取；无对应目录时不套用其他库规范。
- 无对应框架目录时，仅遵循通用规范（rules/ 等），不套用其他框架的规则。

## 子目录约定
- 每个框架目录自包含，只放该框架专属规则（Hook/组合式函数、状态实现、框架测试、组件库约定等）。
- 框架无关的原则留在 rules/，不在框架目录重复。
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
- **react/**
  - hook.md：Hook 规范
  - state.md：骨架（Store 库细则待补）
  - ui/：按组件库细分（待补）
- **miniprogram/**：待补

## 待补缺口（已知）
- react/ 缺组件规范（props 可选性、受控组件、memo 边界）与响应式心智对应文件；
  ui/ 下无任何组件库目录。
- 补充时以 vue3/ 的文件划分为模板，但**不要照搬 Vue 的机制结论**——
  两者的响应式模型不同，需按 React 自身语义重写。
- react 侧的常见偏离已在 examples/golden/anti-examples.md 记录（来自 test/react），
  补写 react/ 规范时应优先覆盖这 12 条。
