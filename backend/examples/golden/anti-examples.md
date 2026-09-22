# 负向示例集

路径基准：本文所有裸路径相对规范库根 `<SPEC_ROOT>` 解析。见 `<SPEC_ROOT>/README.md`「路径基准」。

来源：本文件内联反例，代码即载体。各节语言标签以节内代码块为准，反例 Go 为主，与 PHP 同构时不再双写。
用途：这些是真实产出的违规代码，用于识别常见偏离。每条给出违反条目与正确做法。

说明：本文件内联记录了「不加约束时 AI 会怎么写」，是校验规范有效性的对照组。各节标注的路径为示意落位，非外部工程行号；以下五节均为 Go 形态，与 PHP 同构，判定结论对两侧同罚。

---

## 1. 胖控制器

违反：`backend/go/structure.md`「controller 只做参数绑定、调 service、写响应，无业务分支。」、 `backend/php/structure.md`「控制器只解析输入、调用服务、返回资源，禁止业务判断与模型直调。」

来源：`internal/controller/order.go:42-71`

```go
// ❌ 过滤、权限、事务全堆入口
func (c *OrderController) Create(ctx context.Context, req *CreateOrderRequest) (*OrderResponse, error) {
    if req.Status != "paid" && !c.isAdmin(ctx) {
        return nil, ErrForbidden
    }
    tx := c.db.Begin(ctx)
    id, err := c.db.Exec(ctx, tx, "INSERT INTO orders ...")
    if err != nil {
        tx.Rollback()
        return nil, err
    }
    tx.Commit()
    return &OrderResponse{ID: id}, nil
}
```

问题：换一个入口就要复制整段逻辑；控制器出现 SQL 字符串与事务语句，单测必须连真实库。

**正确做法**：绑定、调用、响应三步，逻辑下沉服务与仓储。参见 `backend/examples/golden/service-slice.md`「1. 控制器只做组装与转发」。

---

## 2. 服务直连数据库

违反：`backend/go/structure.md`「dao 封装全部 SQL，logic 不直接操作数据库连接，不拼 SQL 字符串。」

来源：`internal/logic/order.go:58-76`

```go
// ❌ 业务层直连全局连接并拼 SQL
func (s *OrderService) List(ctx context.Context, status string) ([]Order, error) {
    rows, err := g.DB().Query(ctx, "SELECT * FROM orders WHERE status = '"+status+"'")
    if err != nil {
        return nil, err
    }
    defer rows.Close()
    return scanOrders(rows)
}
```

问题：查询实现旁落服务层；字符串拼接引入注入面；全局连接使单测必须连真实库。另含 `SELECT *`，正例须显式列白名单。另见 `backend/README.md`「分层原则（PHP / Go 共用）」：「逻辑单元不自己取数据库连接」。

**正确做法**：查询组装收敛数据层，服务只传过滤结构。参见 `backend/examples/golden/service-slice.md`「3. 仓储收敛查询实现」。

---

## 3. 仓储回调服务

违反：`backend/go/structure.md`「规则」：「跨模块调用走 service 接口，不直调对方 logic 或 dao。」；PHP 同构问题见 `backend/php/structure.md`「规则」：「跨聚合协作由服务组合多个仓储，禁止仓储相互调用。」

来源：`internal/dao/order.go:90-104`

```go
// ❌ 数据层反向依赖业务层
func (d *OrderDAO) InsertWithCoupon(ctx context.Context, tx Tx, in CreateOrderInput) (OrderResult, error) {
    if !couponService.IsValid(ctx, in.CouponCode) {
        return OrderResult{}, ErrInvalidCoupon
    }
    return d.insert(ctx, tx, in)
}
```

问题：依赖方向写反，数据层测试必须懂业务规则；协作关系被藏进数据层，调用方看不见。

**正确做法**：协作上浮服务层组合多个仓储，仓储只收过滤结构、只返数据。参见 `backend/examples/golden/service-slice.md`「2. 服务承载规则与事务边界」。

---

## 4. 幂等键无人消费

违反：`common/rules/api-contract.md`「幂等与重试」：「调用方生成 `Idempotency-Key`，服务端按键去重」；`backend/patterns/write-idempotent.md`「规则」：「同一幂等键重复提交返回首次结果」。

来源：`internal/logic/order.go:30`

```go
// ❌ 键透传了但全项目没有一处读取它
func (s *OrderService) Create(ctx context.Context, in CreateOrderInput) (OrderResult, error) {
    _ = in.IdempotencyKey
    return s.orders.Insert(ctx, s.orders.Begin(ctx), in)
}
```

问题：字段成为装饰。规范要求的不是"有这个字段"，而是"去重逻辑由它驱动"。指不出消费点即为装饰性代码，删除或补上消费（判据见 `common/protocol/task-boundary.md`「四类越界」）。

**正确做法**：同一键重复提交返回首次结果，不执行第二次副作用。参见 `backend/examples/golden/service-slice.md`「2. 服务承载规则与事务边界」。

---

## 5. 事务内调用外部网络

违反：`backend/go/transaction.md`「规则」与 `backend/php/transaction.md`「规则」：事务内不调外部网络与长耗时操作；必须调用时超时与补偿已说明。

来源：`internal/logic/order.go:112-130`

```go
// ❌ 外部调用包在事务内且无超时补偿
func (s *OrderService) Create(ctx context.Context, in CreateOrderInput) (OrderResult, error) {
    tx := s.orders.Begin(ctx)
    result, err := s.orders.Insert(ctx, tx, in)
    if err != nil {
        tx.Rollback()
        return OrderResult{}, err
    }
    if err := s.couponClient.Deduct(ctx, in.CouponCode); err != nil {
        tx.Rollback()
        return OrderResult{}, err
    }
    return result, tx.Commit()
}
```

问题：外部抖动直接拖长事务持有，拖出超大事务与死锁；失败语义混在一起，补偿说不清；提交失败仍返回非零结果，调用方可能消费并未提交的数据。

**正确做法**：外部调用移出事务，或超时与补偿已说明。参见 `backend/patterns/update-transactional.md`「规则」，并见 `backend/protocol/decision-trees.md`「二、事务边界决策」。
