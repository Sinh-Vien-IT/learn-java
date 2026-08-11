# MODULE 13 — MICROSERVICES 🔴

> **Mục tiêu:** Nắm vững các Patterns trong Microservices (Circuit Breaker, Retry, Bulkhead, Rate Limiting, API Gateway, Service Discovery) và trả lời sắc bén câu hỏi: *"Khi nào KHÔNG NÊN dùng Microservices?"*

---

## Mục Lục

1. [Monolith vs Modular Monolith vs Microservices](#1-monolith-vs-modular-monolith-vs-microservices)
2. [Microservices Patterns](#2-microservices-patterns)
3. [Resilience Patterns (Resilience4j)](#3-resilience-patterns)
4. [Khi nào KHÔNG NÊN dùng Microservices?](#4-khi-nào-không-nên-dùng-microservices)
5. [Interview Questions & Answers](#5-interview-questions--answers)
6. [Cheat Sheet](#6-cheat-sheet)

---

## 1. Resilience Patterns (Resilience4j) 🔴

### 1. Circuit Breaker (Cầu dao ngắt mạch)
TránhCascading Failures (Lỗi dây chuyền toàn hệ thống khi 1 downstream service bị nghẽn/sập).

```
State Flow:
  [CLOSED] ──(Lỗi > Threshold %)──> [OPEN] (Fast-fail lập tức, không gọi downstream)
      ▲                               │
      │                               ▼ (Sau Wait Duration, e.g. 10s)
      └──────────(Thành công)─── [HALF-OPEN] (Cho 1 vài request thử nghiệm)
```

### 2. Bulkhead (Vách ngăn tàu thủy)
* Chia Isolation cho Resource Pools (Thread Pool / Connection Pool). Sự cố nghẽn ở Service A không vắt kệt Thread Pool dùng chung cho Service B.

### 3. Rate Limiting
* Giới hạn số lượng Request được chấp nhận trong một khoảng thời gian (Token Bucket / Leaky Bucket algorithm).

---

## 2. Khi nào KHÔNG NÊN dùng Microservices? 🔴

### Câu trả lời thể hiện tư duy Tech Lead:

> *"Microservices **KHÔNG PHẢI LÀ BẠO BẢNH (Free Lunch)**. Nó đánh đổi sự đơn giản của Codebase lấy sự phức tạp tột cùng của Operational & Distributed Systems.
> 
> **KHÔNG NÊN dùng Microservices khi:**
> 1. **Domain Boundary chưa rõ ràng:** Hệ thống mới (Startup MVP), Business Requirement thay đổi liên tục. Chia sai Bounded Context sẽ biến Microservices thành **Distributed Monolith** (vừa chậm, vừa khó sửa, dính Distributed Lock/Transaction liên miên).
> 2. **Team Size nhỏ (< 10-15 Engineers):** Chi phí quản lý Infra (K8s, Observability, CI/CD, Service Mesh) đè bẹp thời gian phát triển Feature.
> 3. **High Consistency Requirement:** Hệ thống đòi hỏi Strict ACID trên nhiều bảng dữ liệu.
> 
> **Lựa chọn tối ưu ban đầu:** Hãy bắt đầu bằng một **Modular Monolith** sạch sẽ (Clean Architecture, Bounded Contexts rõ ràng trong cùng 1 Codebase). Khi team đông lên hoặc 1 sub-module thực sự bị bottleneck về scale, mới tách module đó ra thành Microservice độc lập."*

---

## 3. Cheat Sheet 🔴

```
┌──────────────────────────────────────────────────────────────┐
│                 MICROSERVICES CHEAT SHEET                    │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│ Resilience Patterns:                                         │
│ • Circuit Breaker: State Closed -> Open (Fast Fail) ->       │
│   Half-Open.                                                 │
│ • Bulkhead: Isolate Thread Pools để tránh Cascading Failure. │
│                                                              │
│ Trade-offs & Tech Lead Mindset:                              │
│ • Microservices = High Operational Complexity + Distributed  │
│   Data Trade-offs.                                           │
│ • Start with Modular Monolith first! Only split when domain  │
│   is stable and team/scale demands it.                       │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

---

> → Tiếp theo: [Module 14 - Distributed System](../14-distributed-system/)
