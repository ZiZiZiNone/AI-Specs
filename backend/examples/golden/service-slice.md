# 示例：服务切片

路径基准：本文所有裸路径相对规范库根 `<SPEC_ROOT>` 解析，首段为 `common/`、`frontend/` 或 `backend/`。见 `<SPEC_ROOT>/README.md`「路径基准」。本示例自包含，代码即规范结论的完整载体，不依赖外部工程。代码与 `backend/go/test/` 落地文件同名同语义，可运行形态见该目录（`go test -race` 实跑通过）。

示范：`backend/patterns/update-transactional.md`「规则」、 `backend/patterns/write-idempotent.md`「规则」、 `common/rules/api-contract.md`「幂等与重试」：「`POST` 禁自动重试」。

## 1. 控制器只做组装与转发

**解决的问题**：过滤、权限、事务散落入口后，换一个入口就要复制一遍，根因定位要在多个控制器之间跳。

来源：`internal/controller/order.go`

```go
func (c *OrderController) Create(ctx context.Context, req api.CreateOrderRequest) (api.OrderResponse, error) {
    result, err := c.svc.Create(ctx, req.ToInput())
    if err != nil {
        return api.OrderResponse{}, err
    }
    return api.ToResponse(result), nil
}
```

绑定、调用、响应三步，无业务分支、无 SQL、无事务语句。

PHP 落点：控制器方法只做表单请求校验、调服务、返资源；业务存在性与权限校验归服务。

## 2. 服务承载规则与事务边界

**解决的问题**：去重判定与写入分属两次调用时，重复送达会产生第二个订单；冲突后若在已失败的事务内继续查询，部分数据库直接报错，快照隔离下也看不见并发已提交的胜者行，重放丢单；同键异载荷若直接复用，会把他人的结果当成自己的。

来源：`internal/logic/order.go`

```go
func NewOrderLogic(db dao.Transactor, orders dao.OrderDAO) *OrderLogic {
    return &OrderLogic{db: db, orders: orders}
}

func (s *OrderLogic) Create(ctx context.Context, in model.CreateOrderInput) (model.OrderResult, error) {
    if err := in.Validate(); err != nil {
        return model.OrderResult{}, err
    }
    var result model.OrderResult
    err := s.db.Transact(ctx, func(ctx context.Context) error {
        res, err := s.orders.Insert(ctx, in)
        if err != nil {
            return err
        }
        result = res
        return nil
    })
    if dao.IsDuplicateKey(err) {
        // 失败事务已回滚/释放：在新读路径回读首次结果，不在已冲突事务内继续查询
        first, ferr := s.orders.FindByIdempotencyKey(ctx, in.IdempotencyKey)
        if ferr != nil {
            return model.OrderResult{}, ferr
        }
        if first.UserID != in.UserID || first.AmountCents != in.AmountCents || first.CouponCode != in.CouponCode {
            return model.OrderResult{}, model.ErrConflict
        }
        return first, nil
    }
    if err != nil {
        return model.OrderResult{}, err
    }
    return result, nil
}
```

幂等键在 orders 表建唯一约束，去重记录与业务行同事务落子。服务层经 Transact 闭包显式定界，闭包自动提交与回滚；数据层方法只收上下文并经上下文取事务。失败一律返零值，不泄漏未提交结果。`Validate` 拒空幂等键：无键请求旁路去重会互相碰撞，需防重放的创建必须带键。回读比对用户与关键载荷，同键异载荷返回冲突。闭包提交语义以各项目驱动实测为准。

可运行形态见 `backend/go/test/`（`go test -race` 实跑通过）。

PHP 落点：服务用事务闭包包裹多仓储调用；仓储默认靠框架绑定执行，不收事务参数；同键异载荷抛 `ConflictException`；事务管理器直接依赖内存仓储（零依赖演示，生产替换框架绑定）。可运行形态见 `backend/php/test/`（`php test/run.php` 实跑通过）。

## 3. 仓储收敛查询实现

**解决的问题**：同一查询在服务与仓储各写一遍后，结果偶发不一致，且服务层出现 SQL 字符串。

来源：`internal/dao/dao.go`（接口），实现见 `internal/dao/mem.go`

```go
type OrderDAO interface {
    Insert(ctx context.Context, in model.CreateOrderInput) (model.OrderResult, error)
    FindByIdempotencyKey(ctx context.Context, key string) (model.OrderResult, error)
    List(ctx context.Context, filter model.OrderFilter) ([]model.OrderResult, int, error)
}
```

仓储只做组装与执行，只收过滤结构、只返数据与总数；业务分支一律上浮服务层。`Insert` 依赖幂等键唯一约束，空键直接拒绝；`List` 返 items 与总数，分页规则见 `backend/patterns/list-query.md`「规则」。

PHP 落点：仓储封装全部查询实现，服务禁止直调模型查询构造器。

## 4. 配套断言覆盖行为与回滚

**解决的问题**：无断言的事务边界只是宣称；重复送达、失败回滚、载荷冲突与并发重放必须有可复现的证据。

来源：`internal/logic/order_test.go`（替身仓储，不起服务、不连真实库）

Fake 语义：内存事务经独立串行锁执行，闭包失败即丢弃暂存、成功即原子落子，不支持嵌套；对幂等键施内存唯一约束并计数 `Insert` 调用。串行化、提交期冲突路径与等同真实 DB 的部分仅为示意（结论依据为静态推演，以项目实测为准）。

```go
func TestCreateDuplicateKeyReturnsFirstResult(t *testing.T) {
    store := dao.NewMemStore()
    svc := NewOrderLogic(store, store)
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
    if store.RowCount() != 1 {
        t.Fatalf("replay must not add rows, got %d", store.RowCount())
    }
}

func TestCreateFailureRollsBack(t *testing.T) {
    store := dao.NewMemStore()
    store.FailInsertWith(errors.New("db down"))
    svc := NewOrderLogic(store, store)
    if _, err := svc.Create(context.Background(), orderInputWithKey("key-9")); err == nil {
        t.Fatal("expected error, got nil")
    }
    if !store.RollbackCalled() {
        t.Fatal("failed create must roll back")
    }
    if store.RowCount() != 0 {
        t.Fatal("rolled-back rows must be discarded")
    }
    if _, dup := store.FindStoredKey("key-9"); dup {
        t.Fatal("failed create must not store idempotency key")
    }
}

func TestCreateRejectsEmptyKey(t *testing.T) {
    store := dao.NewMemStore()
    svc := NewOrderLogic(store, store)
    if _, err := svc.Create(context.Background(), orderInputWithKey("")); !errors.Is(err, model.ErrValidation) {
        t.Fatalf("empty key must fail closed: %v", err)
    }
    if store.InsertCalls() != 0 {
        t.Fatal("rejected input must not reach dao")
    }
}

func TestCreateConflictingPayloadReturnsConflict(t *testing.T) {
    store := dao.NewMemStore()
    svc := NewOrderLogic(store, store)
    if _, err := svc.Create(context.Background(), orderInputWithKey("key-x")); err != nil {
        t.Fatalf("first create failed: %v", err)
    }
    clash := orderInputWithKey("key-x")
    clash.AmountCents = 999
    if _, err := svc.Create(context.Background(), clash); !errors.Is(err, model.ErrConflict) {
        t.Fatalf("expected conflict, got %v", err)
    }
}

func TestCreateConcurrentReplayReturnsFirstResult(t *testing.T) {
    // 提交期合并冲突分支在本串行化演示下不可达，覆盖见 Insert 预检路径；
    // 本测试证明无死锁、无 data race 与重放收敛。
    store := dao.NewMemStore()
    svc := NewOrderLogic(store, store)
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
    if store.RowCount() != 1 {
        t.Fatalf("concurrent replay must keep one row, got %d", store.RowCount())
    }
}
```

可运行形态见 `backend/go/test/`（`go test -race` 实跑通过）。

PHP 落点：服务测试使用内存替身仓储；仓储测试用事务回滚或专用测试库；异常断言精确到类，不宽捕。可运行形态见 `backend/php/test/`（`php test/run.php` 实跑通过）。
