import crypto from 'node:crypto';

export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;
export const DEFAULT_IDEMPOTENCY_TTL = 86400;

export class DomainError extends Error {
  constructor(errorCode, message, context = {}) {
    super(message);
    this.errorCode = errorCode;
    this.context = context;
  }
}

export function computePayloadHash(input) {
  const raw = `u=${input.userId}|i=${input.itemId}|q=${input.quantity}|p=${input.unitPriceCents}|c=${input.couponCode ?? ''}`;
  return crypto.createHash('sha256').update(raw).digest('hex');
}

export class MemoryOrderStore {
  constructor() {
    this.seq = 0;
    this.orders = new Map();
    this.byScope = new Map();
    this.inTx = false;
    this.stagedOrders = new Map();
    this.stagedScope = new Map();
    this.rollbacks = 0;
  }

  run(fn) {
    if (this.inTx) throw new DomainError(50002, 'Nested transaction is not supported');
    this.inTx = true;
    this.stagedOrders.clear();
    this.stagedScope.clear();
    try {
      const out = fn();
      for (const [id, ord] of this.stagedOrders) this.orders.set(id, ord);
      for (const [sk, id] of this.stagedScope) this.byScope.set(sk, id);
      return out;
    } catch (err) {
      this.rollbacks += 1;
      throw err;
    } finally {
      this.stagedOrders.clear();
      this.stagedScope.clear();
      this.inTx = false;
    }
  }

  findByKey(userId, key, nowTs) {
    const sk = `${userId}:${key}`;
    if (this.inTx && this.stagedScope.has(sk)) return this.stagedOrders.get(this.stagedScope.get(sk));
    const id = this.byScope.get(sk);
    if (!id) return null;
    const ord = this.orders.get(id);
    return ord.idemExpiresAt > nowTs ? ord : null;
  }

  insert(input, totalCents, nowTs, ttlSeconds) {
    if (this.findByKey(input.userId, input.idempotencyKey, nowTs)) {
      throw new DomainError(40901, 'Duplicate idempotency key', { userId: input.userId });
    }
    this.seq += 1;
    const ord = {
      seq: this.seq, id: `ord-${this.seq}`, userId: input.userId, itemId: input.itemId,
      quantity: input.quantity, totalCents, couponCode: input.couponCode ?? '',
      status: 'created', payloadHash: computePayloadHash(input), idemExpiresAt: nowTs + ttlSeconds,
    };
    const sk = `${input.userId}:${input.idempotencyKey}`;
    if (this.inTx) {
      this.stagedOrders.set(ord.id, ord);
      this.stagedScope.set(sk, ord.id);
    } else {
      this.orders.set(ord.id, ord);
      this.byScope.set(sk, ord.id);
    }
    return ord;
  }

  list(query) {
    if (!['created_at', 'total_cents'].includes(query.sortBy)) {
      throw new DomainError(40001, 'Unknown sort field', { sortBy: query.sortBy });
    }
    const matched = [...this.orders.values()].filter((o) => !query.userId || o.userId === query.userId);
    const desc = query.sortOrder === 'desc' ? -1 : 1;
    matched.sort((a, b) => {
      const cmp = query.sortBy === 'total_cents' ? (a.totalCents - b.totalCents || a.seq - b.seq) : (a.seq - b.seq);
      return cmp * desc;
    });
    const total = matched.length;
    const totalPages = total > 0 ? Math.ceil(total / query.pageSize) : 0;
    const start = (query.page - 1) * query.pageSize;
    return {
      items: matched.slice(start, start + query.pageSize),
      page: { page: query.page, pageSize: query.pageSize, total, totalPages },
    };
  }
}

export class OrderService {
  constructor(repo, tx, clock = () => Math.floor(Date.now() / 1000)) {
    this.repo = repo;
    this.tx = tx;
    this.clock = clock;
  }

  create(input) {
    if (!input.userId?.trim() || !input.itemId?.trim() || !input.idempotencyKey?.trim() ||
        input.quantity <= 0 || input.unitPriceCents <= 0) {
      throw new DomainError(40001, 'Invalid order parameters');
    }
    const nowTs = this.clock();
    const totalCents = input.quantity * input.unitPriceCents;
    return this.tx.run(() => {
      const existing = this.repo.findByKey(input.userId, input.idempotencyKey, nowTs);
      if (existing) {
        if (existing.payloadHash !== computePayloadHash(input)) {
          throw new DomainError(40901, 'Idempotency key payload mismatch', { userId: input.userId });
        }
        return existing;
      }
      return this.repo.insert(input, totalCents, nowTs, DEFAULT_IDEMPOTENCY_TTL);
    });
  }

  list({ userId = '', page = 1, pageSize = DEFAULT_PAGE_SIZE, sortBy = 'created_at', sortOrder = 'asc' }) {
    const safePage = Math.max(1, page);
    const safeSize = pageSize <= 0 ? DEFAULT_PAGE_SIZE : Math.min(pageSize, MAX_PAGE_SIZE);
    return this.repo.list({ userId, page: safePage, pageSize: safeSize, sortBy, sortOrder });
  }
}
