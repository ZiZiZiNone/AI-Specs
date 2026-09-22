# 导入路径

路径基准：本文所有裸路径相对规范库根 `<SPEC_ROOT>` 解析，首段为 `common/`、`frontend/` 或 `backend/`。见 `<SPEC_ROOT>/README.md`「路径基准」。本文 `src/*` 指业务项目根下源码，与规范库路径含义不同。

业务项目统一 `@/` 绝对路径：移动引用方文件时不改它的 `import` 语句。

## 范围

- 约束业务项目源码（Vue 系 `src/`、小程序 `miniprogram/`）。
- 不约束：构建配置 glob 与 CSS `url()`、规范库 `.md` 示例代码、第三方裸包
  （`vue`、`dayjs`、`@arco-design/web-vue` 等 `@scope/pkg` 形态不受影响）。

## 别名

- 只允许单一业务别名 `@/`，禁止 `@components` 等多别名。
- Vue：`@/` = `src/`（`tsconfig paths {"@/*":["src/*"]}` + `vite resolve.alias {"@": "./src"}`）。
- 小程序：`@/` = `miniprogram/`（`tsconfig baseUrl:"." + paths {"@/*":["miniprogram/*"]}`，
  由开发者工具 `typescript` 编译插件解析，无需第三方插件）。
- 测试映射：Vitest 沿用 vite alias；Jest（`ts-jest`）配
  `moduleNameMapper {"^@/(.*)$": "<rootDir>/src/$1"}`（小程序侧指向 `<rootDir>/miniprogram/$1`）。

## 禁用相对

- `from './…'`、`from '../…'` 一律违规，含同目录兄弟文件；跨目录必须 `@/`。
- 覆盖静态 `import` / `export … from`、动态 `import()`（含路由懒加载）与 `require()`。
- CSS `@import` / `url()` 与模板静态资源豁免。

## 后缀

- `@/` 导入一律带文件后缀：`.vue` 必带，`.ts/.js` 必带。
- `/index` 结尾视同带后缀：`@/api/index` 合法；`@/api`、`@/logic/foo` 违规
  （后者改 `@/logic/foo.ts`）。
- Vue 链配 `allowImportingTsExtensions`（要求 `noEmit`，与 `vue-tsc --noEmit` 同构）。
  小程序链（`CommonJS` + `node` 解析 + 有 `outDir`）若未启用该选项，纯 TS 文件经同目录 `index.ts` 重导出并以 `/index` 结尾引用，不得裸名引用。是否启用检查 `tsconfig` 的 `allowImportingTsExtensions` 字段。

## 迁移

- 增量：新代码一律 `@/`；存量文件改动时顺手把该文件内相对导入转掉，不单独立项全量重写。

## 检查清单

- [ ] 无 `./` / `../` 相对导入（含动态 `import()` 与 `export … from`）
- [ ] `@/` 全部带文件后缀或 `/index` 结尾
- [ ] 别名唯一，无新增业务别名
- [ ] `tsconfig paths` 与构建侧 alias 双配（Vue：vite；小程序：开发者工具插件；Jest：`moduleNameMapper`）
- [ ] 小程序链未开 `allowImportingTsExtensions` 时，纯 TS 经 `index` 重导出
