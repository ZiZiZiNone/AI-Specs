from __future__ import annotations

import time
from typing import Callable

from .models import (
    ConflictError,
    DEFAULT_IDEMPOTENCY_TTL,
    DEFAULT_PAGE_SIZE,
    InvalidInputError,
    ListOrdersQuery,
    MAX_PAGE_SIZE,
    OrderInput,
    OrderRecord,
)
from .repository import OrderRepository, TransactionManager


class OrderService:
    def __init__(
        self,
        repo: OrderRepository,
        tx: TransactionManager,
        clock: Callable[[], int] | None = None,
    ) -> None:
        self._repo = repo
        self._tx = tx
        self._clock = clock or (lambda: int(time.time()))

    def create(self, data: OrderInput) -> OrderRecord:
        if (not data.user_id.strip() or not data.item_id.strip() or
                not data.idempotency_key.strip() or data.quantity <= 0 or data.unit_price_cents <= 0):
            raise InvalidInputError("Invalid order parameters")
        now_ts = self._clock()
        total_cents = data.quantity * data.unit_price_cents
        with self._tx.transaction():
            existing = self._repo.find_by_key(data.user_id, data.idempotency_key, now_ts)
            if existing is not None:
                if existing.payload_hash != data.payload_hash():
                    raise ConflictError("Idempotency key payload mismatch", {"userId": data.user_id})
                return existing
            return self._repo.insert(data, total_cents, now_ts, DEFAULT_IDEMPOTENCY_TTL)

    def list_orders(self, query: ListOrdersQuery) -> dict[str, object]:
        safe_page = max(1, query.page)
        safe_size = DEFAULT_PAGE_SIZE if query.page_size <= 0 else min(query.page_size, MAX_PAGE_SIZE)
        return self._repo.list_orders(ListOrdersQuery(
            user_id=query.user_id, page=safe_page, page_size=safe_size,
            sort_by=query.sort_by, sort_order=query.sort_order,
        ))
