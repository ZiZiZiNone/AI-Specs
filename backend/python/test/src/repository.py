from __future__ import annotations

from contextlib import AbstractContextManager, contextmanager
import math
from typing import Iterator, Protocol

from .models import ConflictError, InvalidInputError, ListOrdersQuery, NestedTransactionError, OrderInput, OrderRecord


class OrderRepository(Protocol):
    def insert(self, data: OrderInput, total_cents: int, now_ts: int, ttl_seconds: int) -> OrderRecord: ...
    def find_by_key(self, user_id: str, key: str, now_ts: int) -> OrderRecord | None: ...
    def list_orders(self, query: ListOrdersQuery) -> dict[str, object]: ...


class TransactionManager(Protocol):
    def transaction(self) -> AbstractContextManager[None]: ...


class MemoryOrderStore:
    def __init__(self) -> None:
        self._seq = 0
        self._orders: dict[str, OrderRecord] = {}
        self._by_scope: dict[str, str] = {}
        self._in_tx = False
        self._staged_orders: dict[str, OrderRecord] = {}
        self._staged_scope: dict[str, str] = {}
        self.rollbacks = 0

    @contextmanager
    def transaction(self) -> Iterator[None]:
        if self._in_tx:
            raise NestedTransactionError()
        self._in_tx = True
        self._staged_orders, self._staged_scope = {}, {}
        try:
            yield
            self._orders.update(self._staged_orders)
            self._by_scope.update(self._staged_scope)
        except Exception:
            self.rollbacks += 1
            raise
        finally:
            self._staged_orders, self._staged_scope = {}, {}
            self._in_tx = False

    def find_by_key(self, user_id: str, key: str, now_ts: int) -> OrderRecord | None:
        sk = f"{user_id}:{key}"
        if self._in_tx and sk in self._staged_scope:
            return self._staged_orders[self._staged_scope[sk]]
        oid = self._by_scope.get(sk)
        if not oid:
            return None
        ord_rec = self._orders[oid]
        return ord_rec if ord_rec.idem_expires_at > now_ts else None

    def insert(self, data: OrderInput, total_cents: int, now_ts: int, ttl_seconds: int) -> OrderRecord:
        if self.find_by_key(data.user_id, data.idempotency_key, now_ts) is not None:
            raise ConflictError("Duplicate idempotency key", {"userId": data.user_id})
        self._seq += 1
        rec = OrderRecord(
            seq=self._seq, id=f"ord-{self._seq}", user_id=data.user_id, item_id=data.item_id,
            quantity=data.quantity, total_cents=total_cents, coupon_code=data.coupon_code,
            status="created", payload_hash=data.payload_hash(), idem_expires_at=now_ts + ttl_seconds,
        )
        sk = f"{data.user_id}:{data.idempotency_key}"
        if self._in_tx:
            self._staged_orders[rec.id], self._staged_scope[sk] = rec, rec.id
        else:
            self._orders[rec.id], self._by_scope[sk] = rec, rec.id
        return rec

    def list_orders(self, query: ListOrdersQuery) -> dict[str, object]:
        if query.sort_by not in ("created_at", "total_cents"):
            raise InvalidInputError("Unknown sort field", {"sortBy": query.sort_by})
        matched = [o for o in self._orders.values() if not query.user_id or o.user_id == query.user_id]
        key_fn = (lambda o: (o.total_cents, o.seq)) if query.sort_by == "total_cents" else (lambda o: o.seq)
        matched.sort(key=key_fn, reverse=(query.sort_order == "desc"))
        total = len(matched)
        total_pages = math.ceil(total / query.page_size) if total > 0 else 0
        start = (query.page - 1) * query.page_size
        return {
            "items": matched[start:start + query.page_size],
            "page": {"page": query.page, "pageSize": query.page_size, "total": total, "totalPages": total_pages},
        }
