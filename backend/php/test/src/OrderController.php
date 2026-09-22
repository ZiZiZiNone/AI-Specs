<?php

declare(strict_types=1);

namespace BackendPhpTest;

// 订单入口：只做组装与转发，无业务分支。
class OrderController
{
    public function __construct(private OrderService $svc) {}

    /** @param array{idempotencyKey: string, userId: string, amountCents: int} $request */
    public function create(array $request): array
    {
        $result = $this->svc->create(new OrderInput(
            idempotencyKey: (string) ($request['idempotencyKey'] ?? ''),
            userId: (string) ($request['userId'] ?? ''),
            amountCents: (int) ($request['amountCents'] ?? 0),
        ));
        return ['id' => $result->id, 'userId' => $result->userId, 'amountCents' => $result->amountCents];
    }
}
