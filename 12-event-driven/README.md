# MODULE 12 — EVENT-DRIVEN ARCHITECTURE 🔴

> **Mục tiêu:** Dạy kiến trúc Event-Driven (EDA), phân biệt Event Notification vs Event-Carried State Transfer, CQRS, Event Sourcing và so sánh REST vs Kafka.

---

## Mục Lục

1. [Event-Driven Architecture (EDA) Patterns](#1-event-driven-architecture-patterns)
2. [Event Sourcing & CQRS](#2-event-sourcing--cqrs)
3. [REST vs Kafka (Sync vs Async)](#3-rest-vs-kafka)
4. [Interview Questions & Answers](#4-interview-questions--answers)
5. [Cheat Sheet](#5-cheat-sheet)

---

## 1. Event-Driven Architecture (EDA) Patterns 🔴

### 1. Event Notification (Thông báo sự kiện)
* Service A phát ra 1 event cực ngắn thông báo có sự kiện xảy ra: `OrderCreatedEvent { orderId: 100 }`.
* Service B nhận event -> Muốn biết thông tin đơn hàng phải **HTTP Call ngược lại Service A** để lấy detail.
* **Nhược:** Vẫn bị Coupling giữa Service B và Service A qua HTTP call.

### 2. Event-Carried State Transfer (Truyền tải trạng thái)
* Event mang **TOÀN BỘ DATA NỀN TẢNG** mà Consumer cần: `OrderCreatedEvent { orderId: 100, amount: 50.0, items: [...], customer: {...} }`.
* Service B lưu lại thông tin này vào Local Database của nó.
* **Ưu điểm:** Fully Decoupled! Service A có sập thì Service B vẫn chạy bình thường với Local Cached Data.

---

## 2. Event Sourcing & CQRS 🔴

### Event Sourcing
* Thay vì chỉ lưu **Current State** (Trạng thái hiện tại) của Entity vào Database bằng câu lệnh `UPDATE`, ta lưu **TOÀN BỘ CHUỖI SỰ KIỆN (Stream of Events)** đã xảy ra với Entity đó vào một **Event Store** (Append-Only).

```
State của Bank Account = Sum(mọi Events):
  1. AccountCreated ($0)
  2. MoneyDeposited ($100)
  3. MoneyWithdrawn ($30)
  ---> Current Balance = $70
```

### CQRS (Command Query Responsibility Segregation)
Tách biệt hoàn toàn Model ghi dữ liệu (**Command Path**) và Model đọc dữ liệu (**Query Path**).

```
                 ┌────────────────────────────────────────────────┐
                 │                  CLIENT                        │
                 └───────────────┬────────────────┬───────────────┘
                                 │ Write          │ Read
                                 ▼                ▼
                         [Command Service]   [Query Service]
                                 │                ▲
                      (Write DB) ▼                │ (Read DB - Fast)
                           [MySQL DB]       [ClickHouse / Elastic]
                                 │                ▲
                                 └─ (Async Sync) ─┘
```

---

## 3. REST vs Kafka (Sync vs Async) 🔴

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            REST vs KAFKA COMPARISON                         │
├──────────────────┬────────────────────────────┬─────────────────────────────┤
│ Feature          │ REST (HTTP Request/Resp)   │ Kafka (Event-Driven Async)   │
├──────────────────┼────────────────────────────┼─────────────────────────────┤
│ **Communication**│ Synchronous (Trực tiếp)    │ Asynchronous (Thông qua Queue)│
├──────────────────┼────────────────────────────┼─────────────────────────────┤
│ **Coupling**     │ Tight (Service A biết B)   │ Loose (Service A không biết B)│
├──────────────────┼────────────────────────────┼─────────────────────────────┤
│ **Availability** │ Phụ thuộc vào Uptime của B │ A vẫn chạy tốt nếu B sập    │
├──────────────────┼────────────────────────────┼─────────────────────────────┤
│ **Latency**      │ Low cho Point-to-Point     │ Eventual Consistent (Vài ms) │
├──────────────────┼────────────────────────────┼─────────────────────────────┤
│ **Use Cases**    │ User UI Query, Auth, CRUD  │ Data Pipeline, High Volume  │
└──────────────────┴────────────────────────────┴─────────────────────────────┘
```

---

## 4. Cheat Sheet 🔴

```
┌──────────────────────────────────────────────────────────────┐
│             EVENT-DRIVEN ARCHITECTURE CHEAT SHEET            │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│ Patterns:                                                    │
│ • Event Notification: Event mỏng (chỉ có ID) -> Consumer phải│
│   HTTP GET ngược lại Producer.                               │
│ • Event-Carried State Transfer: Event chứa full data -> Full │
│   Decoupling giữa các services.                              │
│                                                              │
│ CQRS & Event Sourcing:                                       │
│ • Event Sourcing: Lưu vết Append-Only chuỗi Events thay vì   │
│   Update Current State.                                      │
│ • CQRS: Tách Command (Write - RDBMS) và Query (Read - OLAP / │
│   Elasticsearch).                                            │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

---

> → Tiếp theo: [Module 13 - Microservices](../13-microservices/)
