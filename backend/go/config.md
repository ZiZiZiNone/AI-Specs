# Go 配置管理规范

路径基准：本文所有裸路径相对规范库根 `<SPEC_ROOT>` 解析。见 `<SPEC_ROOT>/README.md`「路径基准」。

## 规则与正反示例

1. **启动期一次性解析并校验（Fail-Fast）**：在 `cmd/server` 将环境变量/YAML 反序列化为只读强类型 `Config` 结构体并校验必填项，缺失立即报错退出，禁止在业务函数内部散落 `os.Getenv()`。
2. **配置切片向下注入**：模块只接收自己所需的子配置结构（如 `DBConfig`），不传递整个全局 `AppConfig`。

```go
// ✅ 正例：强类型配置结构体 + 启动校验
type DBConfig struct {
    DSN             string        `env:"DB_DSN"`
    MaxOpenConns    int           `env:"DB_MAX_OPEN"`
    ConnMaxLifetime time.Duration `env:"DB_CONN_MAX_LIFE"`
}
func (c DBConfig) Validate() error {
    if c.DSN == "" { return errors.New("DB_DSN is required") }
    return nil
}

// ❌ 反例：业务层隐式读环境变量，无法单测且运行时才炸
func queryOrders() { dsn := os.Getenv("DB_DSN"); _ = dsn }
```

## 检查清单

- [ ] 业务包内无 `os.Getenv` 或全局可变配置单例
- [ ] 必填配置与超时参数在启动阶段完成校验
