# Go 项目目录结构规范（BE-101 / BE-102）

路径基准：本文所有裸路径相对规范库根 `<SPEC_ROOT>` 解析。见 `<SPEC_ROOT>/README.md`「路径基准」。

## 标准分层布局

```text
cmd/server/           # 启动装配与依赖注入（唯一组装层）
api/                  # 对外请求/响应 DTO（带 json tag，不含业务逻辑）
internal/
├── controller/       # 薄入口：解析、读 Actor、调 service、映射信封
├── service/          # 服务抽象接口契约
├── logic/            # 核心业务规则、事务编排、细粒度鉴权（脱离宿主可测）
├── dao/              # 仓储接口与参数化存储实现
└── model/            # 领域实体、哨兵错误、过滤器
```

## 依赖方向红线
- 严格单向：`controller → service/logic → dao/model`，`internal/` 防止外部项目耦合内部实现；`dao` 绝不反向依赖 `logic` 或 `api`。

## 检查清单

- [ ] 依赖装配集中在 `cmd/`，业务包无 `init()` 隐式连接数据库
- [ ] 依赖方向单向无环，可运行示范见 `backend/go/test/`

- 核心红线：controller 只做参数绑定、调 service、写响应，无业务分支。dao 封装全部 SQL，logic 不直接操作数据库连接，不拼 SQL 字符串。
