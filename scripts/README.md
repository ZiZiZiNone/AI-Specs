# scripts — 自动化规范门禁脚本（v3.0）

路径基准：本文所有裸路径相对规范库根 `<SPEC_ROOT>` 解析。见 `<SPEC_ROOT>/README.md`「路径基准」。

零第三方依赖的可执行校验门禁（Python 3.10+ / Node.js 18+）：

- `scripts/check-all.py`：一键质量门禁总入口（串联 23 项全栈门禁：Python/TS/Node/Vue 3/React/小程序/Go/PHP/Java/Rust + 狗食自检 + 安全扫描）
- `scripts/check-citations.py`：COM-011 引用可验伪校验（四大编号定义源、位置式引用拦截、`>` 引文逐行比对、裸路径断链、「小节标题」存在性校验与正文行内双引号逐字摘录校验）
- `scripts/check-spec-integrity.py`：规范库结构完整性、四大编号定义源四方一致性与硬编码本机路径泄露检测
- `scripts/check-security-hygiene.py`：COM-013 / COM-017 通用安全基线扫描（密钥泄露、XSS 注入点、Go `http.DefaultClient`、PHP `unserialize`/`global`）
- `scripts/check-import-path.py`：前端导入路径校验（`frontend/rules/import-path.md` 可执行形态，支持块注释跳过与 `--json`）
- `scripts/test-scripts.py`：校验脚本自身的单元测试套件
- `scripts/pre-commit.sh`：可直接挂载到 `.git/hooks/pre-commit` 的本地提交门禁脚本
- `scripts/check-dogfood.py`：狗食原则自检（FE-005 禁墓碑注释、参考代码单函数 ≤50 行 / 参数 ≤4 个、全库 100% 路径基准覆盖）
- `scripts/node-alias-loader.mjs`：零依赖 Node.js 18+ `@/` 别名解析器（供前端参考切片测试使用）
