# 11.1 — Kafka Fundamentals & Architecture Internals 🔴

> **Mục tiêu:** Hiểu sâu bản chất Kiến trúc Distributed Commit Log của Kafka, cách Producer gửi message, Consumer Fetching & Commit Offset, và thuật toán Rebalance.

---

## 1. Apache Kafka Architecture Internals 🔴

### Distributed Commit Log Concept
Khác với traditional message brokers (RabbitMQ, ActiveMQ - xoá message ngay sau khi Consumer Ack), Kafka lưu trữ dữ liệu dưới dạng **Distributed Append-Only Commit Log** trên đĩa cứng (Disk Sequential Write).

```
Topic: order-events (3 Partitions)

Partition 0:  [offset 0][offset 1][offset 2][offset 3]... -> Write Segment Files
Partition 1:  [offset 0][offset 1][offset 2]...
Partition 2:  [offset 0][offset 1][offset 2][offset 3][offset 4]...
```

### Partition & Leader / Follower Replicas (ISR - In-Sync Replicas)
* **Leader Replica:** Tất cả mọi request Read/Write từ Producer/Consumer mặc định đều đi qua Leader (trừ trường hợp Rack-aware fetching từ Follower).
* **ISR (In-Sync Replicas):** Tập hợp các Replicas đang duy trì bám đuổi sát nút (không bị lag) so với Leader.
* **`min.insync.replicas`:** Số lượng replica tối thiểu trong ISR phải ghi nhận message thành công khi Producer gửi với `acks=all`.

---

## 2. Producer Internals: Message Routing & Delivery 🔴

```
[Producer Record] (Topic, Key, Value)
       │
       ▼
[Serializer] (Key/Value to Bytes)
       │
       ▼
[Partitioner] ─── Key != null? ───> Hash(Key) % TotalPartitions (Key Ordering Guaranteed)
       │                              
       └── Key == null ───────────> Sticky Partitioner / Round-Robin
       │
       ▼
[Record Accumulator (Buffer)] ──(Batching: batch.size & linger.ms)──> [Network Sender Thread] ──> Kafka Broker
```

### Producer Configuration Quan Trọng

1. **`acks`:**
   * `acks=0`: Gửi xong không chờ response (Fastest, High Message Loss Risk).
   * `acks=1`: Chờ duy nhất Leader Replica ghi nhận vào Log (Moderate Safety).
   * `acks=all` (hoặc `-1`): Chờ Leader VÀ toàn bộ ISR Replicas ghi nhận. (Highest Durability).
2. **`enable.idempotence=true`:** Đảm bảo Producer gửi retry do sự cố mạng không gây trùng lặp Message tại Broker (sử dụng `ProducerID` + `SequenceNumber`).

---

## 3. Consumer Group & Offset Management 🔴

### Group Coordinator & Consumer Group
* **Consumer Group:** Tập hợp các Consumer Worker hợp tác để consume toàn bộ Partitions của một Topic.
* **Quy tắc vàng:** **Một Partition tại một thời điểm chỉ được phụ trách bởi DUY NHẤT một Consumer Instance trong cùng 1 Consumer Group.**

```
Case: Topic có 4 Partitions, Consumer Group có 2 Consumers:
- Consumer A: Assigned Partition 0, Partition 1
- Consumer B: Assigned Partition 2, Partition 3

Case: Consumer Group tăng lên 5 Consumers (thừa 1 Consumer):
- Consumer A, B, C, D: Mỗi con phụ trách 1 Partition
- Consumer E: IDLE (Rảnh rỗi chờ dự phòng) -> Bằng chứng: Thêm Consumer vượt quá số Partition KHÔNG DÙNG ĐỂ SCALE THROUGHPUT ĐƯỢC!
```

---

## 4. Rebalance Mechanism Deep Dive 🔴

### Rebalance là gì?
Là quá trình bàn giao lại quyền sở hữu các Partitions giữa các Consumers trong cùng Group khi có biến động (Consumer mới Join, Consumer Crash, Partition mới được tạo).

### Nguyên nhân gây nên "Unwanted Rebalance" (Rebalance Storm)
1. **`max.poll.interval.ms` (Default 5 min):** Consumer tốn quá nhiều thời gian để xử lý 1 batch data trong code Java (ví dụ bị nghẽn DB/External Call) vượt quá 5 phút -> Group Coordinator coi Consumer này đã CHẾT -> Kick khỏi Group -> Trigger Rebalance.
2. **`session.timeout.ms` & `heartbeat.interval.ms`:** Consumer bị GC Pause quá lâu (Stop-The-World) làm mất tín hiệu Heartbeat gửi tới Broker.

### Rebalance Protocol Algorithms (Eager vs Cooperative)
* **Eager Rebalance (Legacy):** Stop-The-World toàn bộ Group! TẤT CẢ Consumers ngừng đọc data, nhả toàn bộ Partition, chờ gán lại từ đầu -> Gây ra Latency Spike lớn.
* **Cooperative Sticky Rebalance (Kafka 2.4+ Default):** Chỉrevoke những Partition thực sự cần chuyển giao. Các Consumer khác vẫn tiếp tục đọc data bình thường trên các Partition không bị ảnh hưởng.

---

> → Tiếp theo: [02-delivery-semantics.md](./02-delivery-semantics.md)
