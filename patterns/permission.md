# 权限

权限来自Store，经Logic消费。

## 规则
- 当前用户权限/角色从 Store 读取，不在组件内重复请求。
- 权限判断逻辑放进 Logic（hasPermission 等），组件只消费结果。
- 页面/按钮/操作按权限控制，权限不足给明确提示。
- 前端权限是体验层，敏感操作仍依赖后端鉴权。

## 同一判据须覆盖三处

一份权限判定函数须同时服务路由拦截、入口渲染、操作控件：

```
判定函数（Logic）
  ├─ 路由守卫 → 拦截直接访问 URL
  ├─ 菜单/入口渲染 → 决定是否显示
  └─ 页面/组件内控件 → 决定按钮可见或禁用
```

**禁止只做其中一处**：只拦路由会让用户看到点不动的菜单；
只藏菜单会让用户手输 URL 绕过；只禁按钮则入口仍暴露。

**禁止为三处各写一份判定**——三份实现必然随时间漂移，
出现"菜单能进但进去全是禁用"这类矛盾状态。

```typescript
// ✅ 一份判定，多处消费
export function resolveTicketRowAbility(user: SessionUser | null, row: Ticket) {
  return {
    canEdit: hasPermission(user, 'ticket:update') && row.status !== 'closed',
    canRemove: hasPermission(user, 'ticket:delete') && row.status === 'open',
  };
}
```

来源：`test/vue/src/logic/ticketPermission.logic.ts` 的 `resolveTicketRowAbility`，
在 `TicketTable.vue` 与页面两处消费同一份结果。

## 可见 vs 禁用

- **无权限进入**：不渲染入口（隐藏），避免暴露不存在的能力。
- **有权限但当前状态不允许**：渲染为禁用并说明原因
  （如"已关闭的工单不可编辑"），否则用户不知道为什么点不动。

判据：区别在于"你不该知道这件事"还是"你现在还不能做这件事"。

## 框架实现
路由守卫写法等框架细则见 frameworks/<框架>/router.md。
