# 上传

定位：附件 / 图片 / 文件上传场景的落点规范。
只定分层与状态机，不定传输细节；传输细节收敛在 Upload Service。

## 结构落点

UI → Logic → Upload Service，收敛出口为 Upload Service 的上传方法。

- UI（受控）：选择文件、展示进度与结果。已选未上传的中间态可本地持有，
  判定见 frontend/frameworks/vue3/component.md「该状态若丢失，是否只影响本次交互体验、
  不影响业务数据」；已确认的业务值必须上提，不自持副本。
- Logic（单一写入点）：文件校验（类型 / 大小 / 数量）、上传状态管理、
  结果回调。校验规则在 Logic，UI 不散落判断。
- Upload Service：封装上传请求（分片 / 直传 / 凭证）、并发与超时重试；
  try-catch 收敛在统一请求出口，业务方法只描述接口语义。
- 小程序侧同构：业务值一律「properties 下 + 事件上」，
  不用双向绑定承载业务值，见 frontend/frameworks/miniprogram/component.md
  「业务值一律"properties 下 + 事件上"」；清理写 detached，
  取消订阅、清定时器、中断 guard。

## 状态机

选择 → 校验 → 进度 → 成功 / 失败，取消可发生在进度中任何时刻：

- 选择：文件选择器的中间态仅属交互态，未确认前不写入业务值。
- 校验：先判集合级（数量上限）再判单项（类型 / 大小），
  集合级优先；边界「恰好等于上限应通过」须有断言覆盖。
- 进度：显示进度与取消入口；上传中禁用重复触发，相关操作按钮禁用。
- 成功：静默保持或按流程反馈，不重复提示加载成功。
- 失败：保留已选输入与已有结果，错误按可归属字段落到字段级，
  否则经操作反馈呈现；已有内容不得因一次失败整片消失。
- 取消：「取消不是错误」，被取消的请求「不进入 error 态」，
  只静默返回并清理进度态。

## 规则

- 校验在 Logic：类型 / 大小 / 数量判据放 Logic，UI 只触发与展示。
- 上传中禁用重复触发，失败保留输入，成功后按流程反馈。
- 大文件与并发由 Service 处理，UI 不感知细节。
- 取消与竞态：AbortController 负责中断在途请求，单调序号负责判定
  已返回但已过期的结果；signal 必须真正下传给请求。
- 重试先判幂等：「重复执行不产生额外后果」方可自动重试；
  非幂等写操作「禁止自动重试」，失败后交由用户手动触发。
- 超时：「上传 / 下载超时：根据文件大小动态设置」，超时必须真正中断请求，
  超时与外部取消合并为同一个 signal，并可区分二者。
- 组件卸载时取消未完成的请求；轮询式进度上报在卸载时停止。

## 正例指针

- 校验判据与集合级优先：frontend/examples/golden/form-validation.md「7. 附件校验」
- 上传封装：frontend/examples/golden/service-layer.md「1. 统一请求出口承担 try-catch」上传方法只描述接口语义形态
- 进度展示形态：frontend/examples/golden/list-page.md「6. 页面只做组装」容器形态
- 超时与取消联动写法见 frontend/examples/golden/service-layer.md
  「2. 超时与外部取消联动」一节对应的 withTimeout 形态。
- 边界断言形态：frontend/examples/golden/form-validation.md「7. 附件校验」恰好等于上限应通过断言
- 重试门槛见 frontend/examples/golden/service-layer.md「3. 幂等性决定是否重试」，
  非幂等写操作显式关闭重试。
- 手动重试见 frontend/rules/async-operations.md「复用同一个 load」，
  不另写一份重试版逻辑。
- 取消不进 error 态的判定见 frontend/rules/async-operations.md
  「被取消的请求须在上层被识别为预期行为，不进入 error 态」。

## 反例指针

- frontend/examples/golden/anti-examples.md「3. 竞态保护形似而无实效」
- frontend/examples/golden/anti-examples.md「4. 每个接口重复 try-catch」
- frontend/examples/golden/anti-examples.md「5. retryable 计算了但没人用」

## 自检指针

对照 frontend/checklists/detailed-check.md 中与下列原文短句对应的条目：

- 「超时与外部取消合并为同一 signal」
- 「非幂等方法（POST 等）默认不重试」
- 「组件卸载时取消未完成的请求」
- 「请求取消（CANCELED）不进入 error 态」
- 「使用 AbortController 取消旧请求，且 signal 已实际下传到请求」
- 「临时性错误自动重试（最多 3 次）」
- 「重试期间外部取消能立即中断」
