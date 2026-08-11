# MODULE 16 — PERFORMANCE ENGINEERING 🔴

> **Mục tiêu:** Cung cấp Framework chẩn đoán và khắc phục Performance Bottleneck toàn diện trên hệ thống Backend (CPU, Memory, Thread Pool, Connection Pool, Kafka, Database).

---

## 1. Performance Diagnostics Framework 🔴

```
┌──────────────────────────────────────────────────────────────┐
│  MEASURE BASELINE ➔ IDENTIFY BOTTLENECK ➔ HYPOTHESIZE       │
│         ▲                                   │                │
│         └────── MEASURE AGAIN  FIX  EXPERIMENT              │
└──────────────────────────────────────────────────────────────┘
```

---

## 2. Top 7 Production Performance Case Studies 🔴

### Case 1: API Latency Spike (p99 > 2s)
* **Chẩn đoán:** Bật APM (Elastic APM / Jaeger Tracing). Kiểm tra xem Latency tốn ở đâu.
* **Nguyên nhân phổ biến:** N+1 Query Problem trong Spring Data JPA / Hibernat, thiếu Database Index, hoặc nghẽn Connection Pool.
* **Khắc phục:** Dùng `JOIN FETCH` trong JPQL, tạo Composite Index phù hợp.

### Case 2: CPU 100% Constant Spike
* **Chẩn đoán:** `top -H -p <pid>` -> Find Thread ID in Hex -> `jstack <pid>`.
* **Nguyên nhân phổ biến:** Infinite loop, Catastrophic Regex Backtracking, High GC Overhead.

### Case 3: Kafka Consumer Lag Spike
* **Chẩn đoán:** Prometheus Metric `kafka_consumergroup_lag`.
* **Khắc phục:** Repartition Topic, Scale Out Consumers, Tune `max.poll.records` & Batch Inserts.

---

## 3. Cheat Sheet 🔴

```
┌──────────────────────────────────────────────────────────────┐
│            PERFORMANCE ENGINEERING CHEAT SHEET               │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│ Rule #1: Never guess! Always measure with Profiler / Tracing.│
│ Rule #2: Fix N+1 queries first (JOIN FETCH).                 │
│ Rule #3: Always set timeouts on HTTP, DB, & Redis clients.   │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

---

> → Tiếp theo: [Module 17 - Kubernetes & Docker](../17-kubernetes-docker/)
