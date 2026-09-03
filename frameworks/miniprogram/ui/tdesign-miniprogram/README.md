# TDesign 小程序端与本规范的冲突取舍

TDesign（tdesign-miniprogram）与本规范不一致的三处，按 vue3/ui/README.md 的
取舍要求逐条裁定：说明冲突、给出取舍、标注适用范围。

## 取舍一：表单校验展示

- 冲突：TDesign 表单组件自带校验展示（`rules` + 错误文案内置），
  与本规范"校验判定在 logic，组件只渲染传入状态"不一致。
- 取舍：校验判定仍在 logic（必填/格式/唯一性全部走 logic 纯函数），
  TDesign 的 `rules` 只做"展示层同步提示"（失焦即提示这类纯交互），
  最终提交前的全量校验一律调 logic，结果经 `setData` 回写后由组件展示。
- 适用范围：所有含提交的表单页。

## 取舍二：组件状态外置

- 冲突：TDesign 输入/选择类组件持有内部值（非受控即可用），
  与本规范"业务组件一律受控"不一致。
- 取舍：业务值一律受控（`value="{{query.keyword}}"` + `bind:change` 上报，
  见 component.md）；仅白名单内的纯交互态（输入法中间态、弹层展开收起）
  允许用组件内部态。
- 适用范围：所有承载业务值的 TDesign 组件。

## 取舍三：命令式 API 的位置

- 冲突：`Dialog`、`Toast` 这类命令式调用可在任意处直调，
  与本规范"logic 不直接操作 UI，提示由页面按返回状态执行"不一致。
- 取舍：命令式调用只出现在页面方法内，且调用参数来自 logic 返回的状态
  （`error` 字段、`success` 标志），不在 logic 内、不在组件内调用。
  全局提示（网络错误浮层）收敛到 Service 出口的统一处理，不散写。

```typescript
// ✅ 页面按 logic 返回状态执行提示
const next = await submitForm(pickForm(this.data), data)
this.setData(next)
if (next.error) {
  Toast({ context: this, selector: '#t-toast', message: next.error })
}
```

## 样式穿透约定

- 主题用 `--td-*` CSS 变量覆盖，不直接改组件内部类。
- 必须穿透时用 `externalClasses`（TDesign 暴露的 `t-class-*` 入口），
  不用 `::deep` / 全局类名覆盖组件内部结构。
- 穿透只做视觉对齐（间距、字号、颜色），不改变组件布局结构；
  每次穿透在原处注释说明原因，设计走查时复核。

## token 对齐

- 颜色、字号、圆角优先用 TDesign 的 `--td-*` token，不另起一套。
- 本规范 design-token 与 TDesign token 冲突时，以 TDesign 为准，
  差异点记在页面注释，不在全局覆盖。

## 检查清单

- [ ] 提交前全量校验走 logic，TDesign rules 仅同步提示
- [ ] 业务值全部受控，自持态在白名单内
- [ ] 命令式调用只在页面方法内，参数来自 logic 返回状态
- [ ] 全局提示收敛到 Service 出口，无散写 Toast/Dialog
- [ ] 主题覆盖用 --td-* 变量，穿透只走 externalClasses 并附原因注释
- [ ] 无全局类名覆盖组件内部结构
