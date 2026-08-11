# MODULE 10 — REDIS / CACHE 🟠

> **Mục tiêu:** Nắm vững các Caching Patterns (Cache-Aside, Write-Through, Write-Behind), xử lý 3 thảm họa Caching (Penetration, Breakdown/Stampede, Avalanche) và Distributed Lock với Redlock.

---

## Mục Lục

1. [Caching Patterns](#1-caching-patterns)
2. [Cache Eviction Policies](#2-cache-eviction-policies)
3. [3 Thảm Họa Caching & Cách Khắc Phục](#3-3-thảm-họa-caching--cách-khắc-phục)
4. [Redis Distributed Lock (Redisson / Redlock)](#4-redis-distributed-lock)
5. [Interview Questions & Answers](#5-interview-questions--answers)
6. [Cheat Sheet](#6-cheat-sheet)

---

## 1. Caching Patterns 🔴

### 1. Cache-Aside (Lazy Loading) — Phổ biến nhất (90%)

```
[App] ──1. Check Cache──> [Redis] (Hit -> Return Data)
  │                          │ (Miss)
  ├──2. Query DB─────────> [Database]
  └──3. Write to Cache───> [Redis]
```

* **Ưu điểm:** Dữ liệu chỉ được cache khi thực sự được đọc. Tránh đầy cache với dữ liệu rác.
* **Nhược điểm:** Lần đọc đầu tiên (Cache Miss) bị chậm. Rủi ro data inconsistency nếu DB update mà Cache chưa bị Evict.

### 2. Write-Through
* Application ghi data trực tiếp vào Cache. Cache tự động ghi nối tiếp vào Database ngay lập tức (Synchronous).

### 3. Write-Behind (Write-Back)
* Application ghi data vào Cache. Cache gom batch và ghi bất đồng bộ (Asynchronous) xuống DB sau vài giây/vài phút.
* **Ưu điểm:** Tốc độ Write cực nhanh (tận dụng In-memory Speed).
* **Nhược điểm:** Rủi ro MẤT DATA nếu Redis node bị crash trước khi kịp flush xuống DB.

---

## 2. 3 Thảm Họa Caching & Cách Khắc Phục 🔴

### 1. Cache Penetration (Thủng Cache)
* **Hiện tượng:** Hacker gửi liên tục vô số Request với Key KHÔNG TỒN TẠI cả trong Cache lẫn Database (ví dụ: `GET /users/-9999`). Request luôn bypass Cache và chọc thẳng xuống Database -> Sập Database.
* **Giải pháp:**
  1. **Cache Null Values:** Nếu DB trả về Null, vẫn lưu vào Redis `key: -9999 -> null` với TTL ngắn (1-5 phút).
  2. **Bloom Filter:** Đặt Bloom Filter đứng trước Cache để check xác suất Key có tồn tại hay không trong 1ms.

### 2. Cache Breakdown / Stampede (Lở Cache)
* **Hiện tượng:** Một **Hot Key** (Key cực hot có lượng đọc hàng trăm ngàn req/s, ví dụ Flash Sale Product) đột ngột hết hạn (TTL Expire). Hàng trăm nghìn request cùng lúc phát hiện Cache Miss và đồng loạt lao xuống DB để query -> Sập DB.
* **Giải pháp:**
  1. **Mutex Lock / Singleflight:** Khi Cache Miss, chỉ cho phép 1 Request duy nhất được giữ Lock xuống DB lấy data và ghi lại Cache. Các request khác phải ngưng đợi 50ms rồi đọc lại Cache.
  2. **Logical Expiration:** Không set TTL cứng cho Redis. Thêm trường `expire_at` vào JSON value và cho 1 Background Thread định kỳ refresh data trước khi hết hạn.

### 3. Cache Avalanche (Tuyết Lở Cache)
* **Hiện tượng:** Hàng loạt Cache Keys đồng loạt hết hạn vào cùng 1 thời điểm (ví dụ do dev set TTL 1 hour cho toàn bộ bảng lúc 12h đêm) -> DB bị đè bẹp bởi lượng Cache Miss cùng lúc.
* **Giải pháp:**
  1. **Randomize TTL:** Cộng thêm một khoảng thời gian ngẫu nhiên (Jitter) vào TTL. Ví dụ: `TTL = 3600s + random(0, 300s)`.

---

## 3. Redis Distributed Lock (Redisson / Redlock) 🔴

### Tại sao không dùng `SETNX` đơn thuần?

```
❌ SETNX key value + EXPIRE key 30s
Nếu Process bị crash giữa lệnh SETNX và EXPIRE -> Key bị Lock vĩnh viễn (Deadlock)!
```

### Triển khai chuẩn xác với Redisson (Atomic Lua Script + Watchdog Thread)

```java
RUnboundedLock lock = redissonClient.getLock("order_lock_" + orderId);
try {
    // Try to acquire lock for max 5s, auto-lease 30s (Watchdog auto renews while running)
    boolean isAcquired = lock.tryLock(5, 30, TimeUnit.SECONDS);
    if (isAcquired) {
        // Critical Section (Execute Payment / Stock Process)
    }
} finally {
    if (lock.isHeldByCurrentThread()) {
        lock.unlock(); // Safe unlock only by holding thread
    }
}
```

---

## 4. Cheat Sheet 🔴

```
┌──────────────────────────────────────────────────────────────┐
│                  REDIS & CACHE CHEAT SHEET                   │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│ Cache Patterns:                                              │
│ • Cache-Aside: App checks Cache -> DB Miss -> Update Cache.  │
│ • Write-Behind: Write Cache fast -> Async Batch Write DB     │
│   (High Risk Data Loss).                                     │
│                                                              │
│ Caching Disasters & Defenses:                                │
│ • Penetration (Fake Non-existent Keys): Cache Null / Bloom   │
│   Filter.                                                    │
│ • Breakdown (Hot Key Expire): Mutex Lock / Logical Expire.   │
│ • Avalanche (Mass Expire): Randomize TTL (+ Jitter).         │
│                                                              │
│ Distributed Lock:                                            │
│ • Never use raw `SETNX`. Use Redisson with Atomic Lua Script │
│   & Watchdog auto-renewal mechanism.                         │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

---

> → Tiếp theo: [Module 11 - Kafka](../11-kafka/)
