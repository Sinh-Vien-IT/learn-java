# 15.15 — Data Pipeline (CDC + Debezium + Kafka + ClickHouse) 🔴

> **Mục tiêu:** Đây là bài System Design trúng khớp 100% với kinh nghiệm Data Platform thực tế của bạn. Thiết kế End-to-End Real-time CDC Data Ingestion Pipeline từ MySQL sang ClickHouse cho Analytics.

---

## 1. Requirements 🔴

### Functional Requirements
1. Capture mọi thay đổi (INSERT, UPDATE, DELETE) từ các bảng MySQL OLTP Production theo thời gian thực (Near Real-time).
2. Transform và Load dữ liệu vào ClickHouse cho Reporting & Analytics Dashboard.
3. Đảm bảo dữ liệu tươi (Data Freshness) delay không quá 2 phút.
4. Xử lý sự thay đổi cấu trúc bảng (Schema Evolution / DDL Changes) mà không làm ngắt đứt Pipeline.

### Non-Functional Requirements
1. **High Throughput:** Xử lý 200 triệu Events / ngày (~2,500 RPS trung bình, Peak 10,000 RPS).
2. **Zero Data Loss:** Đảm bảo không mất mát bất kỳ Event nào.
3. **No Production Impact:** Việc Capture data KHÔNG ĐƯỢC ảnh hưởng tới performance của MySQL Production (Giảm CPU/Read load trên Prod DB).
4. **Idempotency:** Xử lý trùng lặp dữ liệu tại ClickHouse Sink.

---

## 2. Capacity Estimation 🔴

* **Traffic:** 200,000,000 events / 86,400s $\approx$ 2,315 events/s (Avg). Peak (x4) $\approx$ **10,000 events/s**.
* **Payload Size:** Trung bình 1 KB / Event (Avro Compressed).
* **Network Bandwidth:** $10,000 \text{ events/s} \times 1 \text{ KB} = 10 \text{ MB/s} = 80 \text{ Mbps}$.
* **Daily Storage:** $200 \times 10^6 \times 1 \text{ KB} \approx 200 \text{ GB / ngày}$.
* **ClickHouse Compressed Storage (Ratio 1:5):** $200 \text{ GB} / 5 = 40 \text{ GB / ngày}$ Data mới.

---

## 3. High-Level Architecture Diagram 🔴

```
[MySQL Production DB] ──(Binlog)──> [Debezium CDC Connector]
                                            │
                                 (Avro + Schema Registry)
                                            │
                                            ▼
                                  [Kafka Event Backbone]
                                  (Topic: mysql-cdc-events)
                                            │
                                            ▼
                                [Kafka Connect / Flink Sink]
                                            │
                                     (Batch Writes)
                                            │
                                            ▼
                                 [ClickHouse Cluster]
                                 (Engine: ReplacingMergeTree)
```

---

## 4. Deep Dive Architecture & Critical Decisions 🔴

### 1. Tại sao chọn CDC (Debezium) thay vì Batch ETL?
* **Batch ETL (`SELECT * FROM table WHERE updated_at > last_run`):** Gây tải cực nặng (Full Table Scan / Slow Query) cho MySQL Production DB mỗi lần chạy. Không thể capture được các lệnh `DELETE`.
* **CDC (Change Data Capture - Debezium):** Đọc trực tiếp từ **MySQL Binary Log (Binlog)** dưới dạng Asynchronous. Hoàn toàn KHÔNG execute câu lệnh SQL nào lên Database, giảm 80% tải cho Production DB và capture được chính xác lệnh `DELETE`.

### 2. Schema Evolution Handling (Avro + Schema Registry)
* Đăng ký Schema Registry cho Debezium.
* Thiết lập Compatibility Rule là `BACKWARD`. Khi Dev team thêm cột mới vào MySQL, Debezium tự đăng ký Version Schema mới. Kafka Sink đọc Schema mới và tự động bổ sung cột tương ứng trên ClickHouse mà không rớt pipeline.

### 3. ClickHouse Storage Engine Choice: `ReplacingMergeTree`
ClickHouse là Columnar DB, việc `UPDATE`/`DELETE` từng dòng đơn lẻ rất chậm.
* **Giải pháp:** Sử dụng Engine `ReplacingMergeTree(ver)`.
* Khi Debezium đẩy các bản ghi UPDATE mới vào ClickHouse, ClickHouse lưu các bản ghi này dưới dạng Append-Only. Quá trình Merge ngầm (Background Merge Process) của ClickHouse sẽ tự động dọn dẹp các bản ghi cũ và chỉ giữ lại bản ghi có `version` (hoặc `updated_at`) lớn nhất!

---

## 5. Expected Interviewer Follow-ups & Model Answers 🔴

### Q: "Nếu Kafka Consumer bị Crash, làm sao đảm bảo không bị trùng data ở ClickHouse?"
* **Answer:** Dùng `ReplacingMergeTree` với `ver = updated_at` của MySQL Record. Khi Consumer đọc lại cùng 1 Event trùng lặp do Kafka retry, ClickHouse ghi đè bản ghi có cùng Primary Key / Deduplication Key -> Đảm bảo tính **Idempotency** tuyệt đối!

---

## 6. Cheat Sheet 🔴

```
┌──────────────────────────────────────────────────────────────┐
│                 CDC DATA PIPELINE CHEAT SHEET                │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│ Architecture:                                                │
│ • MySQL (Binlog) -> Debezium CDC -> Kafka (Avro) ->          │
│   ClickHouse (ReplacingMergeTree).                           │
│                                                              │
│ Highlights:                                                  │
│ • Zero impact on MySQL Prod DB (No SQL queries, pure Binlog).│
│ • Data freshness < 2 minutes.                                │
│ • Schema Evolution handled via Confluent Schema Registry.    │
│ • Idempotency achieved via ClickHouse ReplacingMergeTree.    │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

---

> → Tiếp theo: [Module 16 - Performance Engineering](../16-performance/)
