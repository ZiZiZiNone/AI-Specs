from __future__ import annotations

from dataclasses import dataclass
import hashlib


DEFAULT_PAGE_SIZE = 20
MAX_PAGE_SIZE = 100
DEFAULT_IDEMPOTENCY_TTL = 86400


class DomainError(Exception):
    def __init__(self, error_code: int, message: str, context: dict[str, object] | None = None) -> None:
        super().__init__(message)
        self.error_code = error_code
        self.context = context or {}


class InvalidInputError(DomainError):
    def __init__(self, message: str, context: dict[str, object] | None = None) -> None:
        super().__init__(40001, message, context)


class ConflictError(DomainError):
    def __init__(self, message: str, context: dict[str, object] | None = None) -> None:
        super().__init__(40901, message, context)


class NestedTransactionError(DomainError):
    def __init__(self) -> None:
        super().__init__(50002, "Nested transaction is not supported")


@dataclass(frozen=True, slots=True)
class OrderInput:
    user_id: str
    item_id: str
    quantity: int
    unit_price_cents: int
    idempotency_key: str
    coupon_code: str = ""

    def payload_hash(self) -> str:
        raw = f"u={self.user_id}|i={self.item_id}|q={self.quantity}|p={self.unit_price_cents}|c={self.coupon_code}"
        return hashlib.sha256(raw.encode("utf-8")).hexdigest()


@dataclass(frozen=True, slots=True)
class ListOrdersQuery:
    user_id: str = ""
    page: int = 1
    page_size: int = DEFAULT_PAGE_SIZE
    sort_by: str = "created_at"
    sort_order: str = "asc"


@dataclass(frozen=True, slots=True)
class OrderRecord:
    seq: int
    id: str
    user_id: str
    item_id: str
    quantity: int
    total_cents: int
    coupon_code: str
    status: str
    payload_hash: str
    idem_expires_at: int
