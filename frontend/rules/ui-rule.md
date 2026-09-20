# UI

路径基准：本文所有裸路径相对规范库根 `<SPEC_ROOT>` 解析，首段为 `common/`、`frontend/` 或 `backend/`。见 `<SPEC_ROOT>/README.md`「路径基准」。

UI只负责展示与交互。

## 规则
- 组件不承载业务判断/数据请求/状态持久化，只渲染与分发事件。组件自身交互例外见 `frontend/rules/core-principles.md`「组件调用 Service 的边界」：完成组件自身交互功能（上传/搜索/验证）允许直连 Service，加载或修改页面业务数据一律禁止。
- 数据由父级或 Logic 提供，交互通过回调上报。
- 表单即时校验等交互可留在 UI，但规则定义进 Logic。
- 组件无隐藏副作用：一次性副作用直接调用 Logic（见 `frontend/rules/architecture.md`「仅允许两类跨层直连：Page/Component 直接调 Logic，Hook 直接调 Service」），需复用/组合时才提取 Hook，由 Hook 调用 Logic 完成业务调度。
- 样式与展示关注点不泄漏业务逻辑。
- 仅自包含交互组件（开关/选择器类）可自持状态并回调上报。

---

## 危险操作的交互规范

### 需要二次确认的操作
- **删除操作**（不可逆）
- **状态变更**（启用/禁用/锁定/封禁）
- **批量操作**（批量删除/批量修改）
- **重要数据修改**（金额/权限/关键配置）

### 确认方式
- **Modal 对话框**：明确说明操作后果
- **确认按钮**：使用危险色（红色），文案明确（"确定删除"而非"确定"）
- **取消按钮**：提供明显的取消选项
- **再次确认**：特别危险的操作（如删除账户）可要求输入确认文字

### 示例
```typescript
// ✅ 正确的删除确认
Modal.confirm({
  title: '确认删除用户',
  content: '删除后无法恢复，该用户的所有数据将被清除',
  okText: '确定删除',
  okType: 'danger',
  cancelText: '取消',
  onOk: handleDelete
});

// ❌ 错误的删除确认
if (confirm('确定？')) {
  handleDelete();
}
```
