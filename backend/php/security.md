# PHP 安全规范（BE-105 / BE-106 / COM-013）

路径基准：本文所有裸路径相对规范库根 `<SPEC_ROOT>` 解析。见 `<SPEC_ROOT>/README.md`「路径基准」。

## 核心规则

1. **三层鉴权对齐 `BE-105`**：中间件做认证与粗粒度 RBAC；Service 层（或由 Service 显式调用的 Policy）执行细粒度资源归属校验，防 IDOR/BOLA。
2. **防注入与反序列化漏洞**：数据库一律 PDO 预处理参数绑定，动态排序字段走白名单；**严禁对不可信输入调用 `unserialize()`、`eval()`、`exec()`、`shell_exec()`**。
3. **密码、哈希与常量时间比对**：密码使用 `password_hash($pwd, PASSWORD_ARGON2ID)` 与 `password_verify()`；Token 落库存 `hash('sha256', $token)`；签名校验必须用 `hash_equals()`。
4. **防 SSRF 与依赖审计**：出向 HTTP 校验目标主机解析 IP（阻断内网/云元数据段）并设显式超时；CI 定期执行 `composer audit`。

## 检查清单

- [ ] 无 `unserialize`/`eval` 处理外部输入，SQL 全部参数化
- [ ] 密码使用 Argon2id/bcrypt，签名比对使用 `hash_equals()`
- [ ] CI 包含 `composer audit` 检查
