# 小程序测试

各层测试方式、不测清单与标注法。
分层策略见 rules/test.md，本文件只写小程序各层的测试方式映射。

## 分层方式

沿用 vue3/testing.md 的分层表结构，测试工具替换为小程序侧：

| 层 | 方式 | 工具 |
|---|---|---|
| logic 纯函数 | 单测，断言"入参→新状态"，含 error 字段与 CANCELED | vitest / jest（与框架无关，直接跑） |
| Service 出口 | 单测，mock `wx.request`，断言归一结果与重试 | vitest / jest + wx mock |
| Component/页面 | 组件测试，断言 properties→渲染、事件载荷 | miniprogram-simulate |
| 导航入口 | 单测，断言守卫拦截至登录页、url 拼接正确 | vitest / jest + wx mock |
| 端到端关键流 | 登录→列表→详情→提交，跑通主链路 | miniprogram-automator |

logic 是必测层：纯函数无框架依赖，单测成本最低、收益最高。
页面 `data` 快照的构造（`initialPage` 这类）随 logic 单测覆盖，不另写页面单测。

```typescript
// ✅ logic 单测：纯输入输出，无框架
test('loadMore 累加分页', async () => {
  const next = await loadMore(initialPage(), { keyword: '' }, fakeFetcher)
  expect(next.list).toHaveLength(20)
  expect(next.page).toBe(2)
})

test('取消不写 error 态', async () => {
  const next = await loadMore(initialPage(), { keyword: '' }, canceledFetcher)
  expect(next.error).toBeNull()
})
```

## 组件测试

用 miniprogram-simulate 挂载，断言三件事：
properties 传入后的渲染结果、`observer` 派生是否生效、`triggerEvent` 载荷。
不测业务数据（组件内本就不该有，见 component.md）。

## 不测清单

- 不测 `setData` 本身的渲染机制（框架行为）
- 不测 `wx.*` API 的内部实现（只测出口的归一结果）
- 不测样式与布局（走人工走查）
- 不测第三方组件库内部（只测三冲突取舍点的行为，见 ui/ 下对应组件库目录）

## 落地状态（`test/miniprogram/`）

- logic 单测已落地：`src/logic/pagination.spec.ts`（成功累加/error 字段/取消静默/完成态/并发 guard）。
- 组件挂载已落地：`src/components/filter-bar/filter-bar.spec.ts`（miniprogram-simulate v1.6.2
  文件管线挂载；方法经实例调用、上报经真实 triggerEvent 捕获、条件渲染经真实 DOM 断言；
  模板事件绑定属框架机制，不在此测）。
- 导航入口、Service 出口、automator 端到端未建，仍按规范示范标注法补。

## 规范示范标注法

沿用 vue3/testing.md 的标注：凡因工具链未落地而无法在本机实跑的测试约定，
在用例顶部标注 `// 规范示范：miniprogram-simulate 未接入前按此形态手写用例`，
待工具链落地后转实跑。标注的用例仍须符合"入参→断言"结构，不写空壳。

## 检查清单

- [ ] logic 有单测，覆盖成功/失败 error 字段/取消三态
- [ ] Service 出口有单测，覆盖归一表与 GET 重试
- [ ] 组件测试覆盖 properties→渲染、observer 派生、事件载荷
- [ ] 导航入口守卫逻辑有单测
- [ ] 未落地处已按规范示范标注，无空壳用例
- [ ] 不测清单内的内容无对应用例
