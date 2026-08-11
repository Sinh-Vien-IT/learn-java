# 11.3 — Kafka Production Architecture & Troubleshooting 🔴

> **Mục tiêu:** Nắm vững kỹ thuật vận hành Kafka trên Production: Xử lý Consumer Lag, Dead Letter Queue (DLQ), Poison Messages, Backpressure và Schema Evolution với Avro & Schema Registry.

---

## 1. Consumer Lag Debugging & Scaling Strategy 🔴

### Consumer Lag là gì?
Consumer Lag = **Latest Offset (Producer Offset) - Current Committed Offset (Consumer Offset)**.
Lag tăng liên tục đồng nghĩa với việc Consumer xử lý không kịp tốc độ đẩy dữ liệu của Producer -> Data bị outdated.

### Các Bước Debug & Fix Consumer Lag trên Production

```
Step 1: Metric Verification (Prometheus + Grafana / Burrow)
   - Kiểm tra `kafka_consumergroup_lag` theo từng Partition.
   - Lag tăng đều ở TẤT CẢ Partitions hay chỉ bị Skewed ở 1-2 Partitions?

Step 2: Diagnosis
   - Case A: Lag skewed 1 Partition -> Data Skew (Key Partitioning bị lệch, 1 key chứa 80% traffic).
   - Case B: Lag tăng đều tất cả Partitions -> Code Consumer xử lý quá chậm (Nghẽn DB Write / External API Call / High CPU GC).

Step 3: Remediation (Xử lý)
   1. Nếu Partitions còn dư slot (Num Partitions > Num Consumers):
      -> Scale OUT Consumer Instances (Increase K8s HPA Replica count).
   2. Nếu Num Consumers == Num Partitions (Đã max slot):
      -> Tăng số Partitions cho Topic (ví dụ từ 10 lên 30 partitions) -> Scale thêm Consumers.
   3. Parallel Consumer Pattern (Xử lý bất đồng bộ trong cùng 1 Consumer Instance):
      -> Dùng ThreadPoolWorker bên trong Consumer để process song song các Key độc lập.
```

---

## 2. Retry Mechanism & Dead Letter Queue (DLQ) 🔴

### Rủi ro của Retry ngây thơ (Naive Retry)
Nếu Message bị lỗi gãy code (Poison Pill Message / Unparseable Payload), nếu Consumer cứ `poll()` và retry liên tục tại chỗ -> **Toàn bộ Partition bị nghẽn (Block Queue)!**

### Kỹ thuật Non-blocking Retry & DLT (Dead Letter Topic)

```
[Main Topic: orders] ──(Processing Failed)──> [Retry Topic 1: orders-retry-1m] (Delay 1m)
                                                      │ (Failed again)
                                                      ▼
[Dead Letter Topic: orders-dlt] <──(Failed max)── [Retry Topic 2: orders-retry-5m] (Delay 5m)
        │
        ▼
[Manual Inspection / Auto-Alert Ops Tool]
```

#### Spring Kafka `@RetryableTopic` Implementation

```java
@RetryableTopic(
    attempts = "3",
    backoff = @Backoff(delay = 1000, multiplier = 2.0),
    topicSuffixingStrategy = TopicSuffixingStrategy.SUFFIX_WITH_INDEX_VALUE,
    dltStrategy = DltStrategy.FAIL_ON_ERROR
)
@KafkaListener(topics = "orders", groupId = "order-group")
public void listen(OrderEvent event) {
    processOrder(event);
}

@DltHandler
public void handleDlt(OrderEvent event, @Header(KafkaHeaders.RECEIVED_TOPIC) String topic) {
    log.error("Event sent to DLT: {} from topic: {}", event, topic);
    // Alert Slack / Save to Admin Error Dashboard
}
```

---

## 3. Schema Registry & Avro Schema Evolution 🔴

### Tại sao cần Schema Registry?
Khi truyền JSON thô qua Kafka:
* Tốn dung lượng mạng (Field names bị lặp lại trong mọi message).
* Không có Contract Validation: Team Producer tự ý đổi tên field `user_id` thành `userId` -> Pipeline Consumer sập toàn bộ mà không báo trước!

### Apache Avro + Confluent Schema Registry

```
1. Producer gửi Avro Event ──> (Schema Registry gán Schema ID: #42 vào Header Byte)
2. Consumer nhận Event     ──> (Dùng Schema ID #42 tra cứu Schema từ Registry -> Deserialize)
```

### Schema Compatibility Modes (Compatibility Rules)

| Mode | Ý nghĩa | Ví dụ áp dụng |
|------|---------|---------------|
| **BACKWARD** (Default) | Consumer dùng Schema MỚI đọc được data ghi bởi Producer dùng Schema CŨ. | Thêm trường mới CÓ DEFAULT VALUE. Bớt trường cũ. |
| **FORWARD** | Consumer dùng Schema CŨ đọc được data ghi bởi Producer dùng Schema MỚI. | Xóa trường mới. |
| **FULL** | Cả Backward và Forward cùng được đảm bảo. | Thêm/Xóa các trường đều có default value. |

---

## 4. Cheat Sheet 🔴

```
┌──────────────────────────────────────────────────────────────┐
│                    KAFKA CHEAT SHEET                         │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│ Production Tuning Configs:                                   │
│ • Producer: acks=all, enable.idempotence=true,               │
│   max.in.flight.requests.per.connection=5                    │
│ • Consumer: enable.auto.commit=false (Manual Ack),           │
│   max.poll.interval.ms=300000                                │
│                                                              │
│ Troubleshooting Lag:                                         │
│ • Check Lag per Partition -> Skewed Key hay Slow Consumer.   │
│ • Consumer Count MAX bằng Partition Count.                   │
│ • Tăng Throughput = Increase Partitions + Scale Consumers /  │
│   Parallel Consumer Threading.                               │
│                                                              │
│ Error Handling:                                              │
│ • Never infinite retry blocking Main Topic.                  │
│ • Use Non-blocking Retry Topics + DLQ (Dead Letter Queue).   │
│                                                              │
│ Data Format:                                                 │
│ • Avro + Schema Registry (Backward Compatibility) for Binary │
│   Compression & Strict Schema Contracts.                     │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

---

> → Tiếp theo: [Module 12 - Event-Driven Architecture](../12-event-driven/)
