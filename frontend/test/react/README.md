# frontend/test/react —— 负向素材，勿作参照

**这个项目不符合本工作区规范，且无法构建**（缺 `package.json`、`tsconfig.json`、
`main.tsx`，`axios` 未声明依赖）。保留它的唯一目的是记录「不加约束时会写成什么样」，
作为规范有效性的对照组。

**不要**从这里复制写法。正向参照见：
- `frontend/test/vue/`：按规范落地的 Vue 3 + Arco + Tailwind 实现
- `frontend/examples/golden/`：从 frontend/test/vue 提取的示例

**它的 12 条违规已整理成条目**，每条含违反的规范条目与正确做法：
`frontend/examples/golden/anti-examples.md`

摘要：页面直连 Service、展示组件自取数据、竞态保护建了但 signal 未下传、
10 处重复 try-catch、retryable 无人消费、受控组件自持状态、校验层用 any、
复述型注释、useEffect 漏依赖靠注释掩盖、单页 13 个函数、Logic 层空转、无工程骨架。

若要修它，等价于按规范重写，收益低于直接参照 frontend/test/vue。
