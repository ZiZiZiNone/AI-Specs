# Hook

Hook负责状态与逻辑复用。

## 规则
- 有状态/副作用逻辑被多处复用时，提取为自定义 Hook（useXxx）。
- Hook 内部可组合 useState/useEffect 等，对外暴露最小接口。
- Hook 只做状态与逻辑，不返回 JSX（那是组件的职责）。
- 无复用需求不强行抽 Hook（遵守"真实复用后再抽象"）。
- Hook 命名以 use 开头，语义化。
