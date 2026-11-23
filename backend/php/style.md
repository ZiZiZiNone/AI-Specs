# PHP 代码风格与静态分析规范

路径基准：本文所有裸路径相对规范库根 `<SPEC_ROOT>` 解析。见 `<SPEC_ROOT>/README.md`「路径基准」。

## 核心规则

1. **严格类型与现代语法**：所有 PHP 文件首行必须声明 `declare(strict_types=1);`；使用 PHP 8.2+ `readonly` DTO、构造器属性提升与明确参数/返回类型，禁止无类型混用数组充当核心业务 DTO。
2. **编码标准与格式化**：严格遵守 PER Coding Style 2.0 / PSR-12，使用 Laravel Pint（`vendor/bin/pint --test`）或 PHP-CS-Fixer 统一校验。
3. **静态分析门槛**：CI 必须通过 PHPStan（推荐 Level 8，存量项目不低于 Level 6）或 Psalm，禁止无理由添加 `@phpstan-ignore-next-line`。
4. **函数复杂度量化上限**：与 `backend/go/style.md` 对齐——单个方法建议 ≤ 50 行、圈复杂度 ≤ 10、参数 ≤ 4 个（超出封装为 `readonly` DTO）。
5. **禁止 `global` 与魔法变量**：严禁在业务与测试代码中使用 `global $xxx` 或可变变量 `$$name`。

## 检查清单

- [ ] 所有文件顶部声明 `declare(strict_types=1);`
- [ ] 通过 `php -l`、`pint --test` 与 `phpstan analyse`
- [ ] 单方法无超长嵌套，无 `global` 变量
