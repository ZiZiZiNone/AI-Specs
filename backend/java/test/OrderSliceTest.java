import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HexFormat;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.function.LongSupplier;

public final class OrderSliceTest {
    record OrderInput(String userId, String itemId, int quantity, long unitPriceCents, String idempotencyKey, String couponCode) {
        String payloadHash() {
            try {
                String raw = "u=" + userId + "|i=" + itemId + "|q=" + quantity + "|p=" + unitPriceCents + "|c=" + couponCode;
                byte[] digest = MessageDigest.getInstance("SHA-256").digest(raw.getBytes(StandardCharsets.UTF_8));
                return HexFormat.of().formatHex(digest);
            } catch (Exception e) {
                throw new IllegalStateException(e);
            }
        }
    }

    record ListQuery(String userId, int page, int pageSize, String sortBy, String sortOrder) {}
    record OrderRecord(long seq, String id, String userId, long totalCents, String payloadHash, long idemExpiresAt) {}
    record PageMeta(int page, int pageSize, int total, int totalPages) {}
    record PageResult(List<OrderRecord> items, PageMeta page) {}

    static final class DomainException extends RuntimeException {
        private static final long serialVersionUID = 1L;
        final int errorCode;
        DomainException(int errorCode, String message) {
            super(message);
            this.errorCode = errorCode;
        }
    }

    static final class MemoryOrderStore {
        private static final Set<String> ALLOWED_SORTS = Set.of("created_at", "total_cents");
        private long seq = 0;
        private final Map<String, OrderRecord> orders = new HashMap<>();
        private final Map<String, String> byScope = new HashMap<>();

        OrderRecord findByKey(String userId, String key, long nowTs) {
            String id = byScope.get(userId + ":" + key);
            if (id == null) return null;
            OrderRecord rec = orders.get(id);
            return rec.idemExpiresAt() > nowTs ? rec : null;
        }

        OrderRecord insert(OrderInput in, long totalCents, long nowTs, long ttlSec) {
            if (findByKey(in.userId(), in.idempotencyKey(), nowTs) != null) {
                throw new DomainException(40901, "Duplicate idempotency key");
            }
            seq++;
            OrderRecord rec = new OrderRecord(seq, "ord-" + seq, in.userId(), totalCents, in.payloadHash(), nowTs + ttlSec);
            orders.put(rec.id(), rec);
            byScope.put(in.userId() + ":" + in.idempotencyKey(), rec.id());
            return rec;
        }

        PageResult list(ListQuery q) {
            if (!ALLOWED_SORTS.contains(q.sortBy())) {
                throw new DomainException(40001, "Unknown sort field");
            }
            List<OrderRecord> matched = new ArrayList<>();
            for (OrderRecord r : orders.values()) {
                if (q.userId().isEmpty() || r.userId().equals(q.userId())) matched.add(r);
            }
            Comparator<OrderRecord> cmp = q.sortBy().equals("total_cents")
                ? Comparator.comparingLong(OrderRecord::totalCents).thenComparingLong(OrderRecord::seq)
                : Comparator.comparingLong(OrderRecord::seq);
            matched.sort(q.sortOrder().equals("desc") ? cmp.reversed() : cmp);
            int total = matched.size();
            int totalPages = total > 0 ? (total + q.pageSize() - 1) / q.pageSize() : 0;
            int start = Math.min((q.page() - 1) * q.pageSize(), total);
            int end = Math.min(start + q.pageSize(), total);
            return new PageResult(matched.subList(start, end), new PageMeta(q.page(), q.pageSize(), total, totalPages));
        }
    }

    static final class OrderService {
        private static final int MAX_PAGE_SIZE = 100;
        private static final long TTL_SEC = 86400;
        private final MemoryOrderStore store;
        private final LongSupplier clock;

        OrderService(MemoryOrderStore store, LongSupplier clock) {
            this.store = store;
            this.clock = clock;
        }

        OrderRecord create(OrderInput in) {
            if (in.userId().isBlank() || in.itemId().isBlank() || in.idempotencyKey().isBlank() || in.quantity() <= 0) {
                throw new DomainException(40001, "Invalid input");
            }
            long now = clock.getAsLong();
            OrderRecord existing = store.findByKey(in.userId(), in.idempotencyKey(), now);
            if (existing != null) {
                if (!existing.payloadHash().equals(in.payloadHash())) {
                    throw new DomainException(40901, "Idempotency payload mismatch");
                }
                return existing;
            }
            return store.insert(in, in.quantity() * in.unitPriceCents(), now, TTL_SEC);
        }

        PageResult list(ListQuery q) {
            int safePage = Math.max(1, q.page());
            int safeSize = q.pageSize() <= 0 ? 20 : Math.min(q.pageSize(), MAX_PAGE_SIZE);
            return store.list(new ListQuery(q.userId(), safePage, safeSize, q.sortBy(), q.sortOrder()));
        }
    }

    private static void assertTrue(boolean cond, String msg) {
        if (!cond) throw new AssertionError("FAIL: " + msg);
    }

    public static void main(String[] args) {
        long[] now = {1763884800L};
        OrderService svc = new OrderService(new MemoryOrderStore(), () -> now[0]);

        OrderRecord o1 = svc.create(new OrderInput("u1", "sku-1", 2, 500, "k1", ""));
        OrderRecord o2 = svc.create(new OrderInput("u2", "sku-1", 1, 500, "k1", ""));
        assertTrue(!o1.id().equals(o2.id()), "different users must have isolated idempotency keys");
        assertTrue(svc.create(new OrderInput("u1", "sku-1", 2, 500, "k1", "")).id().equals(o1.id()), "same payload replays");

        boolean caughtConflict = false;
        try {
            svc.create(new OrderInput("u1", "sku-1", 2, 500, "k1", "VIP"));
        } catch (DomainException e) {
            caughtConflict = e.errorCode == 40901;
        }
        assertTrue(caughtConflict, "payload mismatch throws 40901");

        now[0] += 86460L;
        OrderRecord o3 = svc.create(new OrderInput("u1", "sku-1", 2, 500, "k1", ""));
        assertTrue(!o3.id().equals(o1.id()), "expired key creates new order");

        PageResult page = svc.list(new ListQuery("u1", 1, 500, "created_at", "asc"));
        assertTrue(page.page().pageSize() == 100, "pageSize > 100 clamps to 100");
        System.out.println("Java tests passed=5 failed=0");
    }
}
