# 11.2 — Delivery Semantics & Exactly-Once Processing 🔴

> **Mục tiêu:** Mổ xẻ 3 cấp độ Delivery Semantics (At-most-once, At-least-once, Exactly-once). Trả lời câu hỏi kinh điển của Interviewer: *"Exactly-Once Processing trong Distributed System có thực sự tồn tại không?"*

---

## 1. 3 Cấp Độ Message Delivery Semantics 🔴

### 1. At-Most-Once (Tối đa 1 lần - Có thể mất data, không lặp data)
* **Cơ chế:** Consumer `Commit Offset` TRƯỚC KHI thực hiện xử lý Business Logic / Save DB.
* **Rủi ro:** Nếu Consumer vừa commit offset xong mà bị crash giữa chừng lúc save DB -> Message đó bị trôi qua mất vĩnh viễn (Message Loss).

### 2. At-Least-Once (Tối thiểu 1 lần - Không mất data, có thể lặp data) - Phổ biến nhất
* **Cơ chế:** Consumer xử lý Business Logic & Save DB XONG RỒI MỚI `Commit Offset`.
* **Rủi ro:** Nếu Consumer save DB thành công nhưng bị sập mạng trước khi kịp Commit Offset -> Lần sau khởi động lại, Consumer sẽ fetch lại đúng message đó từ Kafka -> Trùng lặp dữ liệu (Duplicate Processing).

### 3. Exactly-Once Processing (Đúng duy nhất 1 lần)
* **Cơ chế:** Đảm bảo hệ thống đầu-cuối (End-to-End) có kết quả cuối cùng tương đương việc message chỉ được xử lý đúng 1 lần duy nhất.

---

## 2. Exactly-Once trong Distributed System có thực sự tồn tại? 🔴

### Câu trả lời của Senior / Tech Lead dành cho Interviewer:

> *"Về mặt lý thuyết truyền thông mạng thuần túy (Network Protocol / Two Generals' Problem), việc đảm bảo Exactly-Once Delivery giữa 2 hệ thống phân tán qua mạng là **BẤT KHẢ THI** vì sự cố rớt mạng có thể xảy ra ở bất kỳ thời điểm nào.
> 
> Tuy nhiên, ta đạt được **Exactly-Once Semantics (EOS)** trong thực tế bằng công thức:
> **Exactly-Once = At-Least-Once Delivery + Idempotent Processing (hoặc Atomic Commit via Transactions)**"*

---

## 3. Các Giải Pháp Triển Khai Exactly-Once Real World 🔴

### Cách 1: Kafka Transactional Producer/Consumer (Kafka Read-Process-Write Loop)
Dùng cho Pipeline đọc từ Kafka Topic A -> Process -> Ghi sang Kafka Topic B.

```java
// Configuration
props.put(ProducerConfig.ENABLE_IDEMPOTENCE_CONFIG, "true");
props.put(ProducerConfig.TRANSACTIONAL_ID_CONFIG, "my-transaction-id-1");

producer.initTransactions();

try {
    producer.beginTransaction();
    
    // 1. Process & Send to Output Topic
    producer.send(new ProducerRecord<>("output-topic", key, value));
    
    // 2. Send Consumer Offsets to Transaction
    producer.sendOffsetsToTransaction(offsets, consumerGroupId);
    
    // 3. Commit Transaction (Atomic Update both Output Data + Consumer Offset)
    producer.commitTransaction();
} catch (Exception e) {
    producer.abortTransaction(); // Rollback ALL
}
```

### Cách 2: Idempotent Consumer Pattern (Kafka Consumer -> Database Sink)
Dùng cho Pipeline đọc từ Kafka Topic -> Ghi xuống MySQL / ClickHouse / External API.

```
Message (Key: Event_UUID_123)
       │
       ▼
[Consumer Worker]
       │
       ├─── 1. Check Unique Event_UUID_123 in Redis / DB Table
       │        ├── EXISTED? -> Skip processing & Commit Offset Immediately (Idempotent Hit)
       │        └── NOT EXISTED? -> Execute Business Logic
       │
       └─── 2. Save Data & Insert Event_UUID_123 to DB (In SAME Local DB Transaction)
```

---

> → Tiếp theo: [03-production.md](./03-production.md)
