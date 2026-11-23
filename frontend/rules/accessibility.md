# 前端无障碍规范（A11y / WCAG 2.1 AA）

路径基准：本文所有裸路径相对规范库根 `<SPEC_ROOT>` 解析。见 `<SPEC_ROOT>/README.md`「路径基准」。

## 核心规则

1. **语义化标签优先**：可点击动作使用 `<button type="button">`，页面跳转使用 `<a href>`，禁止用裸 `<div>`/`<span>` 绑定点击事件冒充按钮（避免丢失键盘回车/空格触发与读屏语义）。
2. **表单与错误可感知**：每个输入控件必须关联 `<label for>` 或 `aria-label`；校验失败时在输入框标注 `aria-invalid="true"` 并通过 `aria-describedby` 关联错误提示文案。
3. **键盘可达与焦点管理**：
   - 弹窗/抽屉打开时将焦点移入弹窗并锁定 Tab 循环（Focus Trap），按 `Esc` 可关闭并在关闭后将焦点归还触发元素；
   - 严禁 `outline: none` 且不提供替代 `:focus-visible` 焦点样式。
4. **对比度与非纯色表达**：正文文本与背景对比度满足 WCAG AA（≥ 4.5:1，大字 ≥ 3:1）；状态/错误不得仅靠红绿颜色区分，须辅以图标或文字。

## 检查清单

- [ ] 所有交互元素支持键盘 Tab 聚焦与 Enter/Space 触发
- [ ] 弹窗/抽屉支持 `Esc` 关闭与焦点归还，焦点轮廓可见
- [ ] 表单错误已通过 `aria-invalid` / `aria-describedby` 关联
