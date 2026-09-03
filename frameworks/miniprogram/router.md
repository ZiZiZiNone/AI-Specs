# 小程序路由与导航

四类导航 API 分工、参数、统一导航入口与守卫。
路由定义本身见 app.json，守卫判定调 logic（见 logic.md）。

## 四类导航 API 分工

`frameworks/vue3/router.md` 的选型原文：

> 跳转优先用 `name` + `params`，不拼字符串路径——路径变更时不必全局搜索替换。
> 路由参数变化但组件复用时（如 `/tickets/1` → `/tickets/2`），
> 须 `watch` 参数重新加载，不能只依赖 `onMounted`。

小程序无具名路由，url 字符串不可避免，故用统一导航入口收敛拼接，
替代"不拼接路径字符串"的结论（机制不同，目的相同：跳转点可检索、可拦截）。

| API | 用途 | 会触发 tabBar |
|---|---|---|
| `wx.navigateTo` | 普通页面下钻 | 否 |
| `wx.redirectTo` | 替换当前页（登录页跳首页、提交成功回列表） | 否 |
| `wx.switchTab` | tabBar 页面切换 | 是 |
| `wx.reLaunch` | 登录态失效后重启到登录页 | 否 |

- tabBar 页面只能 `switchTab`，用 `navigateTo` 会失败。
- `navigateBack` 只用于"返回并回传结果"（配 eventChannel），不用作常规跳转。

## 统一导航入口

所有跳转走 `src/utils/navigate.ts`，不散写 `wx.navigateTo`。
入口内做三件事：拼 url、调守卫 logic 判定、失败时转登录页。

```typescript
// ✅ 统一入口：调用方传路由名与参数，不拼字符串
export async function goTicketDetail(id: string) {
  const allowed = checkLogin()
  await navigateTo({ url: `/pages/ticket/detail/index?id=${id}`, needLogin: true, allowed })
}
```

### 跳转参数

- 只传字符串；对象先 `JSON.stringify` 后 `encodeURIComponent`。
- 列表上下文（从哪来、回填目标）走 query 或 eventChannel，不读全局状态（见 state.md 页面间传参）。
- 守卫/attached 内无业务数据请求：页面 `onLoad` 只解析参数、调 logic 加载，
  未登录时守卫先拦到登录页，不进页面再弹回。

## 登录守卫

`patterns/permission.md` 的权限原文：

> 一份权限判定函数须同时服务路由拦截、入口渲染、操作控件：
> **禁止为三处各写一份判定**——三份实现必然随时间漂移，

小程序映射：导航入口的 `needLogin` 标记、tabBar/按钮的条件渲染、Service 层的
401 归一处理（见 service.md），三处同时具备。守卫本身只做判定（调 logic 的
`checkLogin` 纯函数），跳转动作由入口执行。

```typescript
// ✅ 守卫只判定，不执行跳转
if (needLogin && !checkLogin()) {
  return redirectTo({ url: '/pages/login/index' })
}
return wx.navigateTo({ url })
```

## 页面复用

同一页面不同参数（如不同工单详情）走"onLoad 参数重载"，
不配多条路由。需要"返回刷新"的页面在 `onShow` 比对参数变化后重载，
不用"先返回再重新进入"模拟刷新。

## 分包

- 分包路径以 `package-` 前缀区分，入口内路由名即含分包前缀的完整路径。
- 分包预下载只配高频入口（扫码页、分享页），不全量预下载。
- 独立分包只给完全无依赖的页面（登录页、分享落地页），常规业务包不独立。

## 检查清单

- [ ] 无散写 wx.navigateTo，全部走统一导航入口
- [ ] 调用方不拼 url 字符串，参数经编码后传入
- [ ] needLogin 标记、条件渲染、401 归一三处一致
- [ ] 守卫只判定，跳转由入口执行
- [ ] onLoad 内无登录弹回逻辑，未登录在入口即拦截
- [ ] tabBar 页面只用 switchTab
- [ ] 同一页面多参数走 onLoad 重载，未配多条路由
