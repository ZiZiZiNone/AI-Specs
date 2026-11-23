# 小程序 UI 组件库约束：tdesign-miniprogram（v2.0）

路径基准：本文所有裸路径相对规范库根 `<SPEC_ROOT>` 解析。见 `<SPEC_ROOT>/README.md`「路径基准」。

本文件已依据 `COM-007`（禁止猜测虚构组件）与 `frontend/rules/error-handling.md` 完成纠偏，统一小程序 UI 层边界。

## 核心取舍规则

1. **禁止双份表单校验（唯一权威源在 `logic/`）**：
   - 不依赖也不虚构组件库内置表单校验引擎（`vant-weapp` 与 `tdesign-miniprogram` 均不承载业务校验规则）；
   - 全部同步与跨字段校验统一由纯函数 `miniprogram/logic/*.validation.ts` 执行，组件仅通过 `error-message` / `tips` 属性展示当前字段错误文案。
2. **禁止在 Service 层直接调用组件库 Toast / Dialog**：
   - `frontend/rules/error-handling.md` 明确规定 Service 层仅返回标准化错误对象、不展示 UI；
   - 统一由 Page 层或 App 级错误订阅器接收错误对象后再调用 `tdesign-miniprogram` 的 Toast / Dialog 组件展示。
3. **受控组件与事件映射**：
   - 输入框、弹窗、选项卡均由 Page `data` 单向驱动，通过 `bind:change` / `bind:close` 回调更新状态，严禁通过 `selectComponent` 直接篡改子组件内部状态。

## 检查清单

- [ ] 表单校验逻辑 100% 位于 `logic/`，组件仅展示错误文案
- [ ] Service 层无 `Toast` / `Dialog` / `wx.showToast` 调用
- [ ] 未通过 `selectComponent` 直接修改子组件内部状态
