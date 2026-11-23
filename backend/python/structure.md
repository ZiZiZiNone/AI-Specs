# Python 目录结构与依赖倒置（BE-101 / BE-102）

路径基准：本文所有裸路径相对规范库根 `<SPEC_ROOT>` 解析。见 `<SPEC_ROOT>/README.md`「路径基准」。

## 标准布局
```text
app/
├── api/          # FastAPI Router / DTO（只做格式校验与响应映射）
├── service/      # 领域服务、状态机、细粒度鉴权（BE-105）与事务编排
├── repository/   # typing.Protocol 仓储协议与 SQLAlchemy/内存实现
└── domain/       # frozen dataclass 实体、错误层级与纯业务函数
```
- 依赖方向严格单向：`api → service → repository.Protocol ← concrete_repo`；禁止在模块顶层创建全局数据库连接并在 import 时产生副作用。
