# MODULE 7 — TRANSACTION 🔴

> **Mục tiêu:** Dạy cực sâu về Transaction: từ ACID, Isolation levels, Lock, `@Transactional` đến Distributed Transaction (Saga, Outbox pattern).
> Giải thích tại sao `@Transactional` KHÔNG BẠO HÀNH được distributed system và cách xử lý thực tế trong Production.

---

## Mục Lục

1. [ACID & Fundamental Concepts](#1-acid--fundamental-concepts)
2. [Database Isolation Levels](#2-database-isolation-levels)
3. [Optimistic vs Pessimistic Locking](#3-optimistic-vs-pessimistic-locking)
4. [Spring `@Transactional` Deep Dive](#4-spring-transactional-deep-dive)
5. [Propagation Types](#5-propagation-types)
6. [Tại sao `@Transactional` KHÔNG THỂ giải quyết Distributed Transaction?](#6-tại-sao-transactional-không-thể-giải-quyết-distributed-transaction)
7. [Distributed Transaction Patterns (Saga, Outbox)](#7-distributed-transaction-patterns)
8. [Production Scenarios (Payment, Inventory, Order)](#8-production-scenarios)
9. [Interview Questions & Answers](#9-interview-questions--answers)
10. [Cheat Sheet](#10-cheat-sheet)

---

## 1. ACID & Fundamental Concepts 🔴

### ACID Properties

| Thuộc tính | Định nghĩa | Cơ chế đảm bảo trong DB (e.g. MySQL InnoDB) |
|------------|------------|---------------------------------------------|
| **Atomicity** (Tính nguyên tố) | Tất cả các câu lệnh trong TX phải thành công toàn bộ, hoặc thất bại toàn bộ (roll back). | **Undo Log** |
| **Consistency** (Tính nhất quán) | Chuyển DB từ trạng thái hợp lệ này sang trạng thái hợp lệ khác (tuân thủ mọi constraint/foreign key). | Phối hợp giữa Application logic + Undo/Redo Log + Locks |
| **Isolation** (Tính cô lập) | Các TX thực thi đồng thời không can thiệp/làm sai lệch lẫn nhau. | **Locks + MVCC** (Multi-Version Concurrency Control) |
| **Durability** (Tính bền vững) | Một khi TX đã commit, data chắc chắn được ghi nhận kể cả khi crash/mất điện ngay sau đó. | **Redo Log / WAL** (Write-Ahead Logging) |

---

## 2. Database Isolation Levels 🔴

### 3 Read Phenomena (Hiện tượng đọc sai)

1. **Dirty Read:** TX A đọc dữ liệu UNCOMMITTED của TX B. TX B sau đó rollback → TX A giữ data rác (không tồn tại).
2. **Non-repeatable Read:** TX A đọc 1 record ở thời điểm T1. TX B UPDATE/DELETE record đó và COMMIT. TX A đọc lại ở T2 → Nhận value khác.
3. **Phantom Read:** TX A query `WHERE age > 18` ở T1 được 5 dòng. TX B INSERT 1 dòng mới `age = 20` và COMMIT. TX A query lại ở T2 → Thấy 6 dòng (xuất hiện dòng "ma").

### Matrix Isolation Levels vs Phenomena

| Isolation Level | Dirty Read | Non-repeatable Read | Phantom Read | Mechanism (MySQL InnoDB) | Performance |
|-----------------|------------|----------------------|--------------|--------------------------|-------------|
| **Read Uncommitted** | ❌ (Có thể bị) | ❌ | ❌ | Read directly without locks | Cao nhất |
| **Read Committed** | ✅ (Tránh được) | ❌ | ❌ | MVCC Read View per statement | Cao |
| **Repeatable Read** (Default MySQL) | ✅ | ✅ | ✅ (InnoDB tránh được nhờ Gap Lock / Next-Key Lock) | MVCC Read View per transaction + Gap Locks | Trung bình |
| **Serializable** | ✅ | ✅ | ✅ | Strict pessimistic locking (Lock toàn bộ range read) | Thấp nhất |

---

## 3. Optimistic vs Pessimistic Locking 🔴

### So Sánh

| Tiêu chí | Optimistic Locking | Pessimistic Locking |
|----------|--------------------|---------------------|
| **Triết lý** | Ít khi có conflict. Không lock DB record. Check version lúc UPDATE. | Rất dễ có conflict. Lock cứng DB record bằng `SELECT ... FOR UPDATE`. |
| **Cơ chế** | Sử dụng `@Version` (dùng version counter / timestamp). | Sử dụng Row-level locks / Page locks của Database. |
| **Performance** | High throughput khi Read >> Write. Không bị DB deadlock do lock wait. | Thấp hơn, dễ gây thread block hoặc DB Deadlock nếu contention cao. |
| **Xử lý conflict** | Throw `OptimisticLockException` khi version mismatch. Application phải Retry. | Block các transaction khác cho tới khi Lock được release (Commit/Rollback). |
| **Use cases** | E-commerce product details update, User Profile settings, High concurrency reads. | Banking account balance transfer, Flash sale inventory deduction, Ticket booking. |

### Implementation Examples

#### Optimistic Locking (Spring Data JPA)

```java
@Entity
public class Product {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    private String name;
    private Integer stock;

    @Version // JPA tự động check & bump version khi update
    private Integer version;
}

// Service Logic
@Service
public class ProductService {
    @Transactional
    public void updateStock(Long productId, int quantity) {
        Product product = productRepository.findById(productId).orElseThrow();
        product.setStock(product.getStock() - quantity);
        // SQL sinh ra: UPDATE product SET stock = ?, version = version + 1 WHERE id = ? AND version = ?
        // Nếu dòng bị sửa bởi TX khác -> affected rows = 0 -> Throw OptimisticLockException
    }
}
```

#### Pessimistic Locking (Spring Data JPA)

```java
public interface ProductRepository extends JpaRepository<Product, Long> {
    
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT p FROM Product p WHERE p.id = :id")
    Optional<Product> findByIdForUpdate(@Param("id") Long id);
}

// SQL Executed: SELECT * FROM product WHERE id = 1 FOR UPDATE;
```

---

## 4. Spring `@Transactional` Deep Dive 🔴

### Cơ chế AOP Proxy

Khi annotate `@Transactional`, Spring AOP tạo ra một **Proxy object** bọc quanh Bean thực sự:

```
[Client Call] ──> [Spring Transaction Proxy]
                       │ 1. Get DB Connection from DataSource
                       │ 2. Set autoCommit = false
                       │ 3. Bind connection to current Thread (ThreadLocal)
                       ▼
                 [Real Service Implementation]
                       │ (Executes Queries within current Thread Connection)
                       ▼
                 [Spring Transaction Proxy]
                       │ 4. If Exception (RuntimeException) -> Rollback
                       │ 5. If Success -> Commit Connection
                       │ 6. Close & Return connection to Pool
```

---

## 5. Propagation Types 🔴

Spring hỗ trợ 7 kiểu Transaction Propagation:

```
1. REQUIRED (Default): 
   - Đã có TX -> dùng chung TX đó.
   - Chưa có TX -> tạo TX mới.

2. REQUIRES_NEW:
   - Luôn tạo TX mới.
   - Nếu đang có TX cũ -> TẠM DỪNG (Suspend) TX cũ, chạy xong TX mới rồi khôi phục TX cũ.

3. NESTED:
   - Sử dụng Savepoint trong DB transaction.
   - TX con rollback -> chỉ rollback về Savepoint, TX cha vẫn có thể commit.

4. SUPPORTS:
   - Có TX -> chạy trong TX. Không có TX -> chạy non-transactional.

5. NOT_SUPPORTED:
   - Không chạy trong TX. Nếu đang có TX -> tạm dừng TX đó.

6. MANDATORY:
   - Bắt buộc phải có TX sẵn. Nếu chưa có -> Throw Exception!

7. NEVER:
   - Bắt buộc KHÔNG được có TX. Nếu có -> Throw Exception!
```

---

## 6. Tại sao `@Transactional` KHÔNG THỂ giải quyết Distributed Transaction? 🔴

Một lầm tưởng cực kỳ phổ biến của Junior/Mid-level:
> *"Em bọc `@Transactional` cho method gọi 3 API microservices (Order, Payment, Inventory) thì nếu service 3 fail, `@Transactional` sẽ rollback tất cả!"*

### Tại sao điều này SAI 100%?

1. **Ranh giới Connection (Connection Boundary):** `@Transactional` chỉ quản lý được **1 Database Connection** thuộc về 1 DataSource cụ thể thông qua `ThreadLocal`.
2. **Giao tiếp mạng (Network Boundary):** Các Microservices khác có Database riêng và chạy trên JVM riêng biệt. Một khi Payment Service đã execute SQL `COMMIT` bên phía DB của nó, Spring Boot bên phía Order Service **không có quyền hạn hay phép thuật nào** để bắt DB của Payment Service `ROLLBACK` được.

---

## 7. Distributed Transaction Patterns 🔴

### Pattern 1: Saga Pattern (Choreography vs Orchestration)

Thay vì dùng ACID (Strict Consistency), Saga dùng **BASE** (Eventually Consistent) thông qua chuỗi các Local Transactions và **Compensating Transactions** (Giao dịch bù trừ).

#### 1. Choreography-based Saga (Event-driven)
* Mọi service publish Event sau khi làm xong. Service khác listen event và xử lý.
* **Ưu:** Decoupled, dễ dựng cho hệ thống nhỏ.
* **Nhược:** Khó trace flow khi có nhiều services (Spaghetti event flow), rủi ro circular dependency.

#### 2. Orchestration-based Saga (Central Coordinator)
* Có 1 service trung tâm (Saga Orchestrator) quản lý và chỉ đạo các service con thực hiện từng bước.
* Nếu bước $N$ thất bại, Orchestrator gửi lệnh gọi **Compensating Actions** ngược lại từ $N-1 \rightarrow 1$.

```
[Order Orchestrator] ──1. Create Pending Order──> [Order Service]
                     ──2. Charge Money─────────> [Payment Service] (FAILED!)
                     ──3. Compensate (Cancel)──> [Order Service]
```

### Pattern 2: Transactional Outbox Pattern

Giải quyết triệt để bài toán: **Vừa ghi Database vừa gửi Kafka Message mà không lo bị chênh lệch dữ liệu (Message Loss / Phantom Event).**

```
❌ Cách SAI thường gặp:
@Transactional
public void createOrder() {
    orderRepository.save(order); // 1. Save DB
    kafkaTemplate.send("order-created", event); // 2. Send Kafka (Nếu Kafka bị lỗi -> DB bị commit, event mất!)
}
```

```
✅ transactional OUTBOX PATTERN:

[Order Service] 
    │ (Cùng 1 Local Transaction)
    ├──> 1. INSERT INTO orders (...)
    └──> 2. INSERT INTO outbox_table (id, payload, status='PENDING')
    
          │ (DB Asynchronous Read / CDC)
          ▼
[Debezium CDC / Outbox Poller] 
    │
    └──> 3. Read outbox_table -> Publish to Kafka Topic
```

---

## 8. Production Scenarios 🔴

### Case 1: High-concurrency Flash Sale Inventory
* **Vấn đề:** 10,000 requests/sec cùng mua 1 món hàng có stock = 10.
* **Giải pháp:**
  1. **Redis Atomic Decr (`DECRBY` / Lua Script):** Check & Atomic Decrement stock trên Redis trước để Fast-fail 9,990 requests thừa.
  2. **Kafka Queue:** Push 10 requests hợp lệ vào Kafka.
  3. **Database Write:** DB Worker consume Kafka và update DB dùng SQL Atomic:
     `UPDATE inventory SET stock = stock - 1 WHERE product_id = 123 AND stock > 0;`

---

## 9. Interview Questions & Answers 🔴

### Q1: "@Transactional(propagation = Propagation.REQUIRES_NEW) hoạt động thế nào? Khi nào nên dùng?"
* **Short Answer:** `REQUIRES_NEW` sẽ tạm dừng Transaction hiện tại (nếu có) và khởi tạo một Transaction mới hoàn toàn độc lập.
* **Strong Answer:** Khi Method B dùng `REQUIRES_NEW` được gọi từ Method A (đang có TX A):
  1. Connection của TX A bị bế mạc tạm thời (Suspend) và cất vào `TransactionSynchronizationManager`.
  2. Spring mượn Connection thứ 2 từ Connection Pool để chạy TX B.
  3. TX B Commit/Rollback xong -> Release Connection 2 -> Khôi phục Connection 1 của TX A.
* **Production Use-case:** **Audit Logging**. Dù business logic ở TX A thành công hay thất bại (rollback), ta vẫn MUỐN lưu lại log hành vết vào DB ở TX B.

---

## 10. Cheat Sheet 🔴

```
┌──────────────────────────────────────────────────────────────┐
│                  TRANSACTION CHEAT SHEET                     │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│ ACID:                                                        │
│ • Atomicity: Undo Log                                        │
│ • Isolation: Locks + MVCC                                    │
│ • Durability: Redo Log / WAL                                 │
│                                                              │
│ Isolation Levels & Anomalies:                                │
│ • Read Uncommitted → Dirty Read                              │
│ • Read Committed   → Non-repeatable Read                     │
│ • Repeatable Read  → Phantom Read (MySQL avoids via GapLock) │
│ • Serializable     → Strict Locking (slowest)                │
│                                                              │
│ Locking:                                                     │
│ • Optimistic: @Version, no DB lock, fast for Read-heavy      │
│ • Pessimistic: SELECT FOR UPDATE, hard DB lock, high-risk DB │
│   deadlock                                                   │
│                                                              │
│ Propagation:                                                 │
│ • REQUIRED: Default (reuse or create)                        │
│ • REQUIRES_NEW: Suspend current, create fresh DB connection  │
│                                                              │
│ Spring @Transactional Pitfalls:                              │
│ • Self-invocation bypasses Proxy!                            │
│ • Cannot handle Distributed Transactions!                    │
│ • Default ONLY rollbacks RuntimeException!                   │
│                                                              │
│ Distributed Transaction Solutions:                           │
│ • Saga Pattern (Orchestration/Choreography + Compensation)  │
│ • Outbox Pattern (DB Local TX + CDC/Debezium -> Kafka)       │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

---

> → Tiếp theo: [Module 08 - Database & SQL](../08-database-sql/)
