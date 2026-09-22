# 示例：服务切片

路径基准：本文所有裸路径相对规范库根 `<SPEC_ROOT>` 解析，首段为 `common/`、`frontend/` 或 `backend/`。见 `<SPEC_ROOT>/README.md`「路径基准」。本示例自包含，代码即规范结论的完整载体，不依赖外部工程。

示范：`backend/patterns/update-transactional.md`「规则」、 `backend/patterns/write-idempotent.md`「规则」、 `common/rules/api-contract.md`「幂等与重试」：「`POST` 禁自动重试」。

## 1. 控制器只做组装与转发

**解决的问题**：过滤、权限、事务散落入口后，换一个入口就要复制一遍，根因定位要在多个控制器之间跳。

来源：`internal/controller/order.go`

```go
func (c *OrderController) Create(ctx context.Context, req *CreateOrderRequest) (*OrderResponse, error) {
    result, err := c.orderService.Create(ctx, req.toInput())
    if err != nil {
        return nil, err
    }
    return toResponse(result), nil
}
```

绑定、调用、响应三步，无业务分支、无 SQL、无事务语句。

PHP 落点：控制器方法只做表单请求校验、调服务、返资源；业务存在性与权限校验归服务。

## 2. 服务承载规则与事务边界

**解决的问题**：去重判定与写入分属两次调用时，重复送达会产生第二个订单；冲突后若在已失败的事务内继续查询，部分数据库直接报错，快照隔离下也看不见并发已提交的胜者行，重放丢单。

来源：`internal/logic/order.go`

```go
func NewOrderService(db Transactor, orders OrderDAO) *OrderService {
    return &OrderService{db: db, orders: orders}
}

func (s *OrderService) Create(ctx context.Context, in CreateOrderInput) (OrderResult, error) {
    if err := in.Validate(); err != nil {
        return OrderResult{}, err
    }
    var result OrderResult
    err := s.db.Transact(ctx, func(ctx context.Context) error {
        res, err := s.orders.Insert(ctx, in)
        if err != nil {
            return err
        }
        result = res
        return nil
    })
    if IsDuplicateKey(err) {
        // 失败事务已回滚/释放：在新读路径回读首次结果，不在已冲突事务内继续查询
        first, ferr := s.orders.FindByIdempotencyKey(ctx, in.IdempotencyKey)
        if ferr != nil {
            return OrderResult{}, ferr
        }
        return first, nil
    }
    if err != nil {
        return OrderResult{}, err
    }
    return result, nil
}
```

幂等键在 orders 表建唯一约束，去重记录与业务行同事务落子。服务层经 Transact 闭包显式定界，闭包自动提交与回滚；数据层方法只收上下文并经上下文取事务。失败一律返零值，不泄漏未提交结果。`Validate` 拒空幂等键：无键请求旁路去重会互相碰撞，需防重放的创建必须带键。闭包提交语义以各项目驱动实测为准。

可运行形态见 `backend/go/test/`（`go test -race` 实跑通过）。

PHP 落点：服务用事务闭包包裹多仓储调用；仓储默认靠框架绑定执行，不收事务参数。可运行形态见 `backend/php/test/`（`php test/run.php` 实跑通过）。

## 3. 仓储收敛查询实现

**解决的问题**：同一查询在服务与仓储各写一遍后，结果偶发不一致，且服务层出现 SQL 字符串。

来源：`internal/dao/order.go`

```go
type OrderDAO interface {
    Insert(ctx context.Context, in CreateOrderInput) (OrderResult, error)
    FindByIdempotencyKey(ctx context.Context, key string) (OrderResult, error)
    List(ctx context.Context, filter OrderFilter, page, pageSize int) ([]OrderResult, int, error)
}
```

仓储只做组装与执行，只收过滤结构、只返数据与总数；业务分支一律上浮服务层。`Insert` 依赖幂等键唯一约束；`List` 返 items 与总数，分页规则见 `backend/patterns/list-query.md`「规则」。

PHP 落点：仓储封装全部查询实现，服务禁止直调模型查询构造器。

## 4. 配套断言覆盖行为与回滚

**解决的问题**：无断言的事务边界只是宣称；重复送达、失败回滚与并发重放必须有可复现的证据。

来源：`internal/logic/order_test.go`（替身仓储，不起服务、不连真实库）

Fake 语义：内存事务经独立串行锁执行，闭包失败即丢弃暂存、成功即原子落子；对幂等键施内存唯一约束并计数 `Insert` 调用。串行化与等同真实 DB 的部分仅为示意（结论依据为静态推演，以项目实测为准）。

```go
func TestCreateDuplicateKeyReturnsFirstResult(t *testing.T) {
    dao := NewFakeOrderDAO()
    svc := NewOrderService(NewFakeTransactor(), dao)
    first, err := svc.Create(context.Background(), orderInputWithKey("key-1"))
    if err != nil {
        t.Fatalf("first create failed: %v", err)
    }
    again, err := svc.Create(context.Background(), orderInputWithKey("key-1"))
    if err != nil {
        t.Fatalf("replay failed: %v", err)
    }
    if again.ID != first.ID {
        t.Fatalf("replay created a second order: %v vs %v", again.ID, first.ID)
    }
    if dao.RowCount() != 1 {
        t.Fatalf("replay must not add rows, got %d", dao.RowCount())
    }
}

func TestCreateFailureRollsBack(t *testing.T) {
    dao := NewFakeOrderDAO()
    dao.FailInsertWith(errors.New("db down"))
    svc := NewOrderService(NewFakeTransactor(), dao)
    if _, err := svc.Create(context.Background(), orderInputWithKey("key-9")); err == nil {
        t.Fatal("expected error, got nil")
    }
    if !dao.RollbackCalled() {
        t.Fatal("failed create must roll back")
    }
    if dao.RowCount() != 0 {
        t.Fatal("rolled-back rows must be discarded")
    }
    if _, dup := dao.FindStoredKey("key-9"); dup {
        t.Fatal("failed create must not store idempotency key")
    }
}

func TestCreateRejectsEmptyKey(t *testing.T) {
    dao := NewFakeOrderDAO()
    svc := NewOrderService(NewFakeTransactor(), dao)
    if _, err := svc.Create(context.Background(), orderInputWithKey("")); err == nil {
        t.Fatal("empty key must fail closed")
    }
    if dao.InsertCalls() != 0 {
        t.Fatal("rejected input must not reach dao")
    }
}

func TestCreateConcurrentReplayReturnsFirstResult(t *testing.T) {
    dao := NewFakeOrderDAO()
    svc := NewOrderService(NewFakeTransactor(), dao)
    const n = 8
    ids := make([]string, n)
    var wg sync.WaitGroup
    for i := 0; i < n; i++ {
        wg.Add(1)
        go func(i int) {
            defer wg.Done()
            res, err := svc.Create(context.Background(), orderInputWithKey("key-c"))
            if err != nil {
                t.Errorf("concurrent create failed: %v", err)
                return
            }
            ids[i] = res.ID
        }(i)
    }
    wg.Wait()
    for _, id := range ids {
        if id == "" || id != ids[0] {
            t.Fatalf("concurrent replay diverged: %v", ids)
        }
    }
    if dao.RowCount() != 1 {
        t.Fatalf("concurrent replay must keep one row, got %d", dao.RowCount())
    }
}
```

可运行形态见 `backend/go/test/`（`go test -race` 实跑通过）。

PHP 落点：服务测试使用内存替身仓储；仓储测试用事务回滚或专用测试库。可运行形态见 `backend/php/test/`（`php test/run.php` 实跑通过）。
