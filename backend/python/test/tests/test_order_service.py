import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from src.models import (
    ConflictError,
    DEFAULT_IDEMPOTENCY_TTL,
    InvalidInputError,
    ListOrdersQuery,
    NestedTransactionError,
    OrderInput,
)
from src.repository import MemoryOrderStore
from src.service import OrderService


class OrderServiceTest(unittest.TestCase):
    def test_idempotency_scoped_per_user_and_ttl(self) -> None:
        now = [1763884800]
        store = MemoryOrderStore()
        svc = OrderService(store, store, clock=lambda: now[0])

        o1 = svc.create(OrderInput("u1", "sku-1", 2, 500, "k1"))
        o2 = svc.create(OrderInput("u2", "sku-1", 1, 500, "k1"))
        self.assertNotEqual(o1.id, o2.id)

        replay = svc.create(OrderInput("u1", "sku-1", 2, 500, "k1"))
        self.assertEqual(replay.id, o1.id)

        with self.assertRaises(ConflictError):
            svc.create(OrderInput("u1", "sku-1", 2, 500, "k1", coupon_code="VIP"))

        now[0] += DEFAULT_IDEMPOTENCY_TTL + 60
        o3 = svc.create(OrderInput("u1", "sku-1", 2, 500, "k1"))
        self.assertNotEqual(o3.id, o1.id)

    def test_list_clamps_page_size_and_rejects_unknown_sort(self) -> None:
        store = MemoryOrderStore()
        svc = OrderService(store, store)
        svc.create(OrderInput("u1", "sku-1", 1, 100, "k1"))
        res = svc.list_orders(ListOrdersQuery(user_id="u1", page=1, page_size=500))
        self.assertEqual(res["page"]["pageSize"], 100)

        with self.assertRaises(InvalidInputError):
            svc.list_orders(ListOrdersQuery(user_id="u1", sort_by="drop_table"))

    def test_nested_transaction_rejected_and_rollback_counted(self) -> None:
        store = MemoryOrderStore()
        with self.assertRaises(NestedTransactionError):
            with store.transaction():
                with store.transaction():
                    pass
        self.assertEqual(store.rollbacks, 1)


if __name__ == "__main__":
    unittest.main()
