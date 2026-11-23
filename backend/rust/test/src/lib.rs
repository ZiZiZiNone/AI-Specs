#![forbid(unsafe_code)]

use std::collections::hash_map::DefaultHasher;
use std::collections::HashMap;
use std::hash::{Hash, Hasher};

pub const DEFAULT_PAGE_SIZE: usize = 20;
pub const MAX_PAGE_SIZE: usize = 100;
pub const DEFAULT_TTL_SEC: u64 = 86_400;

#[derive(Debug, PartialEq, Eq)]
pub enum DomainError {
    InvalidInput(&'static str),
    Conflict(&'static str),
}

#[derive(Debug, Clone)]
pub struct OrderInput {
    pub user_id: String,
    pub item_id: String,
    pub quantity: u32,
    pub unit_price_cents: i64,
    pub idempotency_key: String,
    pub coupon_code: String,
}

impl OrderInput {
    pub fn payload_hash(&self) -> u64 {
        let mut h = DefaultHasher::new();
        self.user_id.hash(&mut h);
        self.item_id.hash(&mut h);
        self.quantity.hash(&mut h);
        self.unit_price_cents.hash(&mut h);
        self.coupon_code.hash(&mut h);
        h.finish()
    }
}

#[derive(Debug, Clone)]
pub struct ListQuery {
    pub user_id: String,
    pub page: usize,
    pub page_size: usize,
    pub sort_by: String,
    pub desc: bool,
}

#[derive(Debug, Clone)]
pub struct OrderRecord {
    pub seq: u64,
    pub id: String,
    pub user_id: String,
    pub total_cents: i64,
    pub payload_hash: u64,
    pub idem_expires_at: u64,
}

#[derive(Debug, Clone)]
pub struct PageResult {
    pub items: Vec<OrderRecord>,
    pub page: usize,
    pub page_size: usize,
    pub total: usize,
}

#[derive(Default)]
pub struct MemoryOrderStore {
    seq: u64,
    orders: HashMap<String, OrderRecord>,
    by_scope: HashMap<String, String>,
}

impl MemoryOrderStore {
    pub fn find_by_key(&self, user_id: &str, key: &str, now_ts: u64) -> Option<OrderRecord> {
        let sk = format!("{}:{}", user_id, key);
        let oid = self.by_scope.get(&sk)?;
        let rec = self.orders.get(oid)?;
        if rec.idem_expires_at > now_ts { Some(rec.clone()) } else { None }
    }

    pub fn insert(&mut self, input: &OrderInput, now_ts: u64) -> Result<OrderRecord, DomainError> {
        if self.find_by_key(&input.user_id, &input.idempotency_key, now_ts).is_some() {
            return Err(DomainError::Conflict("duplicate idempotency key"));
        }
        self.seq += 1;
        let rec = OrderRecord {
            seq: self.seq,
            id: format!("ord-{}", self.seq),
            user_id: input.user_id.clone(),
            total_cents: i64::from(input.quantity) * input.unit_price_cents,
            payload_hash: input.payload_hash(),
            idem_expires_at: now_ts + DEFAULT_TTL_SEC,
        };
        let sk = format!("{}:{}", input.user_id, input.idempotency_key);
        self.orders.insert(rec.id.clone(), rec.clone());
        self.by_scope.insert(sk, rec.id.clone());
        Ok(rec)
    }

    pub fn list(&self, q: &ListQuery) -> Result<PageResult, DomainError> {
        if q.sort_by != "created_at" && q.sort_by != "total_cents" {
            return Err(DomainError::InvalidInput("unknown sort field"));
        }
        let mut matched: Vec<OrderRecord> = self.orders.values()
            .filter(|o| q.user_id.is_empty() || o.user_id == q.user_id)
            .cloned()
            .collect();
        matched.sort_by(|a, b| {
            let ord = if q.sort_by == "total_cents" {
                a.total_cents.cmp(&b.total_cents).then(a.seq.cmp(&b.seq))
            } else {
                a.seq.cmp(&b.seq)
            };
            if q.desc { ord.reverse() } else { ord }
        });
        let total = matched.len();
        let start = ((q.page - 1) * q.page_size).min(total);
        let end = (start + q.page_size).min(total);
        Ok(PageResult { items: matched[start..end].to_vec(), page: q.page, page_size: q.page_size, total })
    }
}

pub struct OrderService {
    store: MemoryOrderStore,
}

impl OrderService {
    pub fn new(store: MemoryOrderStore) -> Self {
        Self { store }
    }

    pub fn create(&mut self, input: &OrderInput, now_ts: u64) -> Result<OrderRecord, DomainError> {
        if input.user_id.trim().is_empty() || input.item_id.trim().is_empty()
            || input.idempotency_key.trim().is_empty() || input.quantity == 0 || input.unit_price_cents <= 0
        {
            return Err(DomainError::InvalidInput("invalid order parameters"));
        }
        if let Some(existing) = self.store.find_by_key(&input.user_id, &input.idempotency_key, now_ts) {
            if existing.payload_hash != input.payload_hash() {
                return Err(DomainError::Conflict("idempotency payload mismatch"));
            }
            return Ok(existing);
        }
        self.store.insert(input, now_ts)
    }

    pub fn list(&self, q: &ListQuery) -> Result<PageResult, DomainError> {
        let safe_page = q.page.max(1);
        let safe_size = if q.page_size == 0 { DEFAULT_PAGE_SIZE } else { q.page_size.min(MAX_PAGE_SIZE) };
        let normalized = ListQuery {
            user_id: q.user_id.clone(),
            page: safe_page,
            page_size: safe_size,
            sort_by: q.sort_by.clone(),
            desc: q.desc,
        };
        self.store.list(&normalized)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn mk(user: &str, key: &str, coupon: &str) -> OrderInput {
        OrderInput {
            user_id: user.into(), item_id: "sku-1".into(), quantity: 2,
            unit_price_cents: 500, idempotency_key: key.into(), coupon_code: coupon.into(),
        }
    }

    #[test]
    fn scoped_idempotency_ttl_and_pagination_work() {
        let mut svc = OrderService::new(MemoryOrderStore::default());
        let mut now = 1_763_884_800;
        let o1 = svc.create(&mk("u1", "k1", ""), now).expect("u1 ok");
        let o2 = svc.create(&mk("u2", "k1", ""), now).expect("u2 ok");
        assert_ne!(o1.id, o2.id);

        let replay = svc.create(&mk("u1", "k1", ""), now).expect("replay ok");
        assert_eq!(replay.id, o1.id);
        assert_eq!(svc.create(&mk("u1", "k1", "VIP"), now).err(), Some(DomainError::Conflict("idempotency payload mismatch")));

        now += DEFAULT_TTL_SEC + 60;
        let o3 = svc.create(&mk("u1", "k1", ""), now).expect("after ttl ok");
        assert_ne!(o3.id, o1.id);

        let list = svc.list(&ListQuery { user_id: "u1".into(), page: 1, page_size: 500, sort_by: "created_at".into(), desc: false }).expect("list ok");
        assert_eq!(list.page_size, MAX_PAGE_SIZE);
        assert_eq!(svc.list(&ListQuery { user_id: "u1".into(), page: 1, page_size: 20, sort_by: "evil".into(), desc: false }).err(), Some(DomainError::InvalidInput("unknown sort field")));
    }
}
