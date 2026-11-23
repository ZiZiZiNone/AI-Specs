# PHP 项目目录结构规范（BE-101 / BE-102）

路径基准：本文所有裸路径相对规范库根 `<SPEC_ROOT>` 解析。见 `<SPEC_ROOT>/README.md`「路径基准」。

## 标准分层布局

```text
src/
├── Controller/      # 薄入口：基础格式解析、调用 Service、输出信封
├── Service/         # 业务规则、细粒度鉴权（BE-105）、事务与幂等编排
├── Repository/      # 仓储接口与参数化存储实现（不承载业务规则）
├── DTO/             # final readonly 输入/查询/输出对象
└── Exception/       # 统一 DomainException 层级
test/                # 独立可运行单测与集成测试
```

## 依赖方向红线
- 严格单向：`Controller → Service → RepositoryInterface ← ConcreteRepository`；表单请求/入口校验只做格式校验，业务存在性与资源归属授权统一归 Service（`BE-105`）。

## 检查清单

- [ ] 所有文件顶部声明 `declare(strict_types=1);`
- [ ] 可运行最小切片见 `backend/php/test/`

- 核心红线：控制器只解析输入、调用服务、返回资源，禁止业务判断与模型直调。
