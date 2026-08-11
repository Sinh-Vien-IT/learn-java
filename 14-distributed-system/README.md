# MODULE 14 — DISTRIBUTED SYSTEM 🔴

> **Mục tiêu:** Nắm vững lý thuyết hệ thống phân tán: Định lý CAP, Định lý PACELC, Consistency Models, và các bài toán sập mạng thực tế (Network Partition, Clock Skew, Retry Storm).

---

## Mục Lục

1. [CAP Theorem & PACELC Theorem](#1-cap-theorem--pacelc-theorem)
2. [Consistency Models](#2-consistency-models)
3. [Common Distributed System Pitfalls](#3-common-distributed-system-pitfalls)
4. [Interview Questions & Answers](#4-interview-questions--answers)
5. [Cheat Sheet](#5-cheat-sheet)

---

## 1. CAP Theorem & PACELC Theorem 🔴

### CAP Theorem
Trong một hệ thống phân tán có hiện tượng Mất kết nối mạng (**P - Partition Tolerance** - điều BẮT BUỘC xảy ra trong thực tế), bạn chỉ được chọn **MỘT TRONG HAI**:
* **CP (Consistency / Partition Tolerance):** Ưu tiên Dữ liệu đúng tuyệt đối. Nếu rớt mạng ->Từ chối Request (Hy sinh Availability). *Ví dụ: MongoDB, HBase, Redis Cluster (dưới cấu hình strict).*
* **AP (Availability / Partition Tolerance):** Ưu tiên Hệ thống luôn trả lời. Dữ liệu có thể tạm thời chưa đồng bộ kịp. *Ví dụ: Cassandra, DynamoDB.*

### PACELC Theorem (Mở rộng của CAP)
CAP chỉ nói khi có Mất kết nối mạng (P). PACELC bổ sung trường hợp hệ thống hoạt động **BÌNH THƯỜNG (Else)**:

> **If P (Partition):** Choose **A** (Availability) OR **C** (Consistency)
> **Else (Normal):** Choose **L** (Latency) OR **C** (Consistency)

*Ví dụ: DynamoDB khi bình thường đánh đổi Consistency để lấy Latency cực thấp (PA/EL).*

---

## 2. Common Distributed System Pitfalls 🔴

### 1. Network Partition (Rớt mạng giữa các Node)
Mạng chập chờn khiến Node A không gửi được heartbeat cho Node B -> Node B tưởng Node A đã chết và tự ứng cử làm Leader -> **Split-Brain Problem** (Xuất hiện 2 Leader cùng ghi dữ liệu).
* **Khắc phục:** Quorum Consensus (Ví dụ: `Quorum = N/2 + 1`).

### 2. Retry Storm & Thundering Herd Problem
Khi Downstream Service bị sập tạm thời, hàng ngàn Upstream Services đồng loạt Retry liên tục -> Tạo ra một cơn bão Traffic khiến Downstream Service vừa ngóc đầu dậy lại bị sập tiếp!
* **Khắc phục:** **Exponential Backoff + Jitter** (Randomize retry interval).

---

## 3. Cheat Sheet 🔴

```
┌──────────────────────────────────────────────────────────────┐
│             DISTRIBUTED SYSTEM CHEAT SHEET                   │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│ Theorems:                                                    │
│ • CAP: On Partition (P) -> Choose Availability (AP) or       │
│   Consistency (CP).                                          │
│ • PACELC: If Partition -> A or C; ELSE -> Latency (L) or C.   │
│                                                              │
│ Mitigation:                                                  │
│ • Split-Brain -> Quorum Consensus (N/2 + 1).                 │
│ • Retry Storm -> Exponential Backoff + Jitter + Circuit      │
│   Breaker.                                                   │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

---

> → Tiếp theo: [Module 15 - System Design](../15-system-design/)
