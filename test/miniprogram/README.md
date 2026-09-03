# 小程序规范测试工程

`frameworks/miniprogram/` 的实跑锚点：能跑的用例都在这里，不再是"规范示范"。

## 覆盖

| 用例 | 对应规范 | 状态 |
|---|---|---|
| `src/logic/pagination.spec.ts`（5 个） | `frameworks/miniprogram/logic.md`（纯函数入参/返回值、error 字段、取消静默） | 实跑 |
| `src/components/filter-bar/filter-bar.spec.ts`（2 个） | `frameworks/miniprogram/component.md`（受控、事件上报） | 实跑（miniprogram-simulate v1.6.2） |
| 导航入口、Service 出口、automator 端到端 | `frameworks/miniprogram/router.md`、`service.md`、`testing.md` | 未建，按 testing.md 规范示范标注法补 |

## 运行

```
cd test/miniprogram
npm install
npm test
```

## 已验证环境

- miniprogram-simulate v1.6.2：load（文件路径 + compiler simulate）、render/attach、
  addEventListener 捕获、实例方法调用、真实 DOM 条件渲染断言，均实跑通过。
- 升级 simulate 大版本后重跑本工程，红了按其新版文档调整用例。
