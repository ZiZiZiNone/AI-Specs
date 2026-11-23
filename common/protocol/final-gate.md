# 交付前最终门禁

路径基准：本文所有裸路径相对规范库根 `<SPEC_ROOT>` 解析。见 `<SPEC_ROOT>/README.md`「路径基准」。

每次提交或交付前，必须完整通过本门禁。未通过项必须当次修复；受环境限制确实无法执行的校验项，必须按「未验证项声明模板」显式披露，严禁伪造“已通过”。

## 门禁清单

1. **行为与宪法合规**：核对 `AGENTS.md`（`FE-000` 至 `FE-005`）与 `common/rules/constitution.md`（`COM-007` 至 `COM-018`），无越权写入、无凭空引文、无硬编码密钥。
2. **端专项自检**：
   - 前端：过 `frontend/checklists/self-check.md`（小改动）或 `frontend/checklists/detailed-check.md`（完整交付）。
   - 后端：过 `backend/checklists/self-check.md`「精简自检」或 `backend/checklists/detailed-check.md`「适用性判定」（结合 `backend/rules/core-principles.md` 与反模式核查）。
3. **Mock 与假数据披露**：遵循 `common/rules/test.md`「Mock 与假数据」原文要求：
   > 交付文档中若引用了 mock 产生的数字（README / 验收报告 / 结论），必须标注来源为 mock
4. **安全与依赖核验**：无新增硬编码凭证/PII 明文日志；新增第三方依赖已核验来源与版本（`COM-013`、`COM-014`、`COM-017`）。
5. **实跑验证闭环**：必须实际执行构建/类型检查/测试（要求是至少执行一次，不是执行多次），以及适用门禁脚本（如 `scripts/check-citations.py`、`scripts/check-security-hygiene.py`、`scripts/check-import-path.py`），记录真实命令与退出码。

## 无法验证时的处理

若环境缺失运行时（如无 Go/PHP 编译器、无真实数据库、无外网拉依赖），必须严格执行以下四步：
1. 列出缺失的运行环境或前置条件；
2. 列出本次**未能执行**的具体命令；
3. 说明已完成的替代静态检查（如语法/引用/逻辑人工逐行核验）；
4. 给出用户在目标环境需要补跑的精确验证命令。

## 未验证项声明模板

```markdown
### 未验证项声明
- **受限原因**：当前环境未安装 `<运行时/工具>`
- **未执行命令**：`<例如：go test -race ./...>`
- **已执行替代检查**：`<例如：静态代码审查 + python3 scripts/check-all.py>`
- **目标环境补跑命令**：`<可直接复制执行的命令>`
```
