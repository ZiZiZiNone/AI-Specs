# Vant 小程序端与本规范的冲突取舍

Vant（vant-weapp）与本规范不一致的三处，按 vue3/ui/README.md 的
取舍要求逐条裁定：说明冲突、给出取舍、标注适用范围。

版本说明：以下依据 vant-weapp 1.x 的常见形态写成；组件名、属性名、事件名
以所装版本的文档与 `miniprogram_npm` 产物为准，首次接入时按文末核对清单
逐项确认，不凭印象套用。

## 取舍一：表单校验展示

- 冲突：`van-form` 自带校验展示（`rules` + 内置错误文案），
  与本规范"校验判定在 logic，组件只渲染传入状态"不一致。
- 取舍：校验判定仍在 logic（必填/格式/唯一性全部走 logic 纯函数），
  `van-form` 的 `rules` 只做"展示层同步提示"（失焦即提示这类纯交互），
  最终提交前的全量校验一律调 logic，结果经 `setData` 回写后由组件展示。
- 适用范围：所有含提交的表单页。

## 取舍二：组件状态外置

- 冲突：`van-field` 这类输入组件持有内部值（非受控即可用），
  与本规范"业务组件一律受控"不一致。
- 取舍：业务值一律受控（`value="{{query.keyword}}"` + `bind:change` 上报，
  见 component.md）；仅白名单内的纯交互态（输入法中间态、弹层展开收起）
  允许用组件内部态。
- 适用范围：所有承载业务值的 Vant 组件。

## 取舍三：命令式 API 的位置

- 冲突：`Dialog`、`Toast`、`Notify` 这类命令式调用可在任意处直调，
  与本规范"logic 不直接操作 UI，提示由页面按返回状态执行"不一致。
- 取舍：命令式调用只出现在页面方法内，且调用参数来自 logic 返回的状态
  （`error` 字段、`success` 标志），不在 logic 内、不在组件内调用。
  全局提示（网络错误浮层）收敛到 Service 出口的统一处理，不散写。

```typescript
// ✅ 页面按 logic 返回状态执行提示
const next = await submitForm(pickForm(this.data), data)
this.setData(next)
if (next.error) {
  Notify({ context: this, selector: '#van-notify', message: next.error })
}
```

## 样式穿透约定

- 优先用 Vant 暴露的样式入口（`custom-class` 与各组件的 externalClasses），
  不直接改组件内部类。
- 必须穿透时只走官方暴露的入口，不用全局类名覆盖组件内部结构；
  该版本无暴露入口时，改视觉走外层容器包裹，不硬穿。
- 穿透只做视觉对齐（间距、字号、颜色），不改变组件布局结构；
  每次穿透在原处注释说明原因，设计走查时复核。

## token 对齐

- 颜色、字号、圆角优先用 Vant 的 CSS 变量，不另起一套。
- 本规范 design-token 与 Vant 变量冲突时，以 Vant 为准，
  差异点记在页面注释，不在全局覆盖。

## 首次接入核对清单

- [ ] `van-form` 的 rules 字段名、校验触发时机与所装版本一致
- [ ] `Dialog` / `Toast` / `Notify` 的调用签名（含 context/selector）与所装版本一致
- [ ] 受控写法（value + change 事件名）与所装版本一致
- [ ] 样式入口（custom-class / externalClasses / CSS 变量名）与所装版本一致
- [ ] 不一致处以所装版本为准，并回写本节备注

## 检查清单

- [ ] 提交前全量校验走 logic，van-form rules 仅同步提示
- [ ] 业务值全部受控，自持态在白名单内
- [ ] 命令式调用只在页面方法内，参数来自 logic 返回状态
- [ ] 全局提示收敛到 Service 出口，无散写 Dialog/Toast/Notify
- [ ] 穿透只走官方样式入口并附原因注释
- [ ] 无全局类名覆盖组件内部结构
