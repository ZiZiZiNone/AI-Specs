# GoFrame v2.10 配置管理差异规范

路径基准：本文所有裸路径相对规范库根 `<SPEC_ROOT>` 解析。见 `<SPEC_ROOT>/README.md`「路径基准」。

## GoFrame 专属约束

1. **禁止在 `internal/logic` 内散布 `g.Cfg().MustGet(ctx, ...)`**：在启动阶段（`cmd/server`）一次性读取并反序列化为强类型只读 `Config` 结构体，启动时校验必填项缺失即 fail-fast，按需将子配置结构体注入各组件（对齐 `BE-102`）。
2. **多环境与密钥隔离**：`manifest/config/config.yaml` 仅放非敏感默认配置与占位符，生产密钥通过环境变量或 KMS 注入，禁止将真实数据库密码/Token 提交入库（`COM-013`）。
3. **禁止依赖热更新隐式可变全局配置**：确需动态开关（Feature Flag）时通过显式只读接口注入，便于单测替换。

## 检查清单

- [ ] 启动期完成强类型配置加载与必填项校验，`internal/logic` 无 `g.Cfg()` 全局调用
- [ ] 配置文件中无真实密钥与生产密码
