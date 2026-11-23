# Go 安全规范（BE-105 / BE-106 / COM-013）

路径基准：本文所有裸路径相对规范库根 `<SPEC_ROOT>` 解析。见 `<SPEC_ROOT>/README.md`「路径基准」。

## 核心规则

1. **三层鉴权对齐 `BE-105`**：入口中间件验 Token 并通过类型安全的私有 `contextKey` 注入不可变 `Actor`；路由层做粗粒度 RBAC；Service 层必须执行细粒度资源归属校验（防 IDOR/BOLA）。
2. **参数化 SQL 与排序白名单**：全部 SQL 使用 `?` / `$1` 占位符；动态排序字段经 `map[string]string` 白名单映射，禁止 `fmt.Sprintf` 拼接用户输入到 SQL。
3. **密码与令牌安全**：密码使用 `golang.org/x/crypto/bcrypt`（cost ≥ 12）或 `argon2id`；API Token/Refresh Token 落库仅存 `sha256` 哈希；签名比对必须使用 `crypto/subtle.ConstantTimeCompare` 或 `hmac.Equal`。
4. **出向 SSRF 与超时防护**：禁止使用 `http.DefaultClient`；所有外部请求须配置自定义 `http.Client{Timeout: ...}` 与校验解析后 IP 的 `DialContext`（阻断内网与云元数据段）。
5. **敏感信息脱敏与审计**：结构体序列化与日志字段自动屏蔽 `Password`、`Token`、`Secret`（如 `json:"-"` 与自定义 `slog.LogValuer`）；高危写操作落结构化审计日志。
6. **依赖漏洞扫描**：CI 运行 `govulncheck ./...`，高危漏洞阻断合并。

## 检查清单

- [ ] 鉴权职责严格遵循 `BE-105`，越权场景有单测覆盖
- [ ] 无 `fmt.Sprintf` 拼接 SQL 与无 `http.DefaultClient`
- [ ] 密码使用 Argon2id/bcrypt，签名比对使用常量时间函数
- [ ] 敏感结构体字段已通过 `json:"-"` 与脱敏器隔离，无明文落日志
