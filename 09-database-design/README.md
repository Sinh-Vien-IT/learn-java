# MODULE 9 — DATABASE DESIGN 🔴

> **Mục tiêu:** Nắm vững thiết kế Schema Database ở quy mô lớn, Sharding, Partitioning, Replication và So sánh khi nào chọn MySQL, PostgreSQL hay ClickHouse.

---

## Mục Lục

1. [Normalization vs Denormalization](#1-normalization-vs-denormalization)
2. [Partitioning vs Sharding](#2-partitioning-vs-sharding)
3. [Replication Architectures (Master-Slave / Leader-Follower)](#3-replication-architectures)
4. [CAP Theorem & Database Consistency](#4-cap-theorem--database-consistency)
5. [Database Selection: MySQL vs PostgreSQL vs ClickHouse](#5-database-selection)
6. [Interview Questions & Answers](#6-interview-questions--answers)
7. [Cheat Sheet](#7-cheat-sheet)

---

## 1. Normalization vs Denormalization 🔴

| Tiêu chí | Normalization (1NF -> 3NF) | Denormalization |
|----------|----------------------------|-----------------|
| **Mục đích** | Giảm thiểu trùng lặp dữ liệu (Data Redundancy), đảm bảo tính toàn vẹn dữ liệu. | Tối ưu tốc độ đọc (Read performance), giảm thiểu việc JOIN nhiều bảng phức tạp. |
| **Cấu trúc** | Chia nhỏ thành nhiều bảng liên kết với nhau qua Foreign Keys. | Trộn dữ liệu vào cùng 1 bảng (chấp nhận lưu dư thừa dữ liệu). |
| **Ghi (Write)** | Nhanh hơn (chỉ cần update ở 1 nơi duy nhất). | Chậm hơn và phức tạp hơn (phải update dữ liệu dư thừa ở nhiều nơi). |
| **Đọc (Read)** | Chậm hơn khi data lớn (phải JOIN 5-10 bảng). | Cực kỳ nhanh (đọc trực tiếp từ 1 bảng mỏng/dẹt - Wide Table). |
| **Use cases** | Hệ thống OLTP (E-commerce Order Processing, Banking Core). | Hệ thống OLAP / Reporting / Data Warehouse (ClickHouse, BigQuery). |

---

## 2. Partitioning vs Sharding 🔴

### Table Partitioning (Vertical / Horizontal Partitioning trên CÙNG 1 Server DB)
* **Horizontal Partitioning:** Chia 1 bảng 500 triệu dòng thành nhiều file vật lý nhỏ hơn trên cùng 1 server dựa trên 1 Partition Key (ví dụ: `created_at` theo tháng/năm).
* **Ưu điểm:** Tăng tốc Query khi filter đúng Partition Key (Partition Pruning), dễ dàng xóa bớt data cũ bằng cách `DROP PARTITION` trong 1ms thay vì câu lệnh `DELETE` tốn cả tiếng.

### Database Sharding (Horizontal Partitioning trên NHIỀU Server DB)
* Khi data và traffic quá lớn mà 1 server DB không thể chứa nổi (cả CPU, RAM, Disk).
* Data được phân tán ra nhiều Database Instances độc lập gọi là các **Shards**.

```
User Requests ──> [ Sharding Router / Proxy (e.g. Vitess / ShardingSphere) ]
                         │
        ┌────────────────┼────────────────┐
        ▼                ▼                ▼
   [ Shard 1 ]      [ Shard 2 ]      [ Shard 3 ]
  (User 1-1M)      (User 1M-2M)     (User 2M-3M)
```

#### Sharding Strategies:
1. **Hash-Based Sharding:** `Shard_ID = Hash(user_id) % total_shards`. Đều data nhưng khó scale thêm Shard mới (bị rehash lại).
2. **Range-Based Sharding:** Shard 1 (ID 1-1M), Shard 2 (ID 1M-2M). Dễ bị Hotspot Shard (Shard mới luôn bị tải nặng).

---

## 3. Replication Architectures (Master-Slave / Leader-Follower) 🔴

```
                  ┌─────────────────┐
                  │  Master (Write) │
                  └────────┬────────┘
                           │ Async / Semi-Sync Replication (Binlog)
            ┌──────────────┴──────────────┐
            ▼                             ▼
   ┌─────────────────┐           ┌─────────────────┐
   │  Replica 1 (Read)│           │ Replica 2 (Read)│
   └─────────────────┘           └─────────────────┘
```

* **Replication Lag:** Hiện tượng data ghi ở Master chưa kịp sync sang Slave/Replica mà User đã đọc từ Slave.
* **Cách xử lý Replication Lag cho UI:** Với hành động vừa Submit Form của User (ví dụ Update Profile), bắt buộc đọc request tiếp theo trực tiếp từ Master DB (hoặc đọc từ Read-Through Cache). Các trang xem chung của user khác thì đọc từ Slave.

---

## 4. Database Selection: MySQL vs PostgreSQL vs ClickHouse 🔴

Đây là câu hỏi kinh điển dành cho Senior/Tech Lead khi lựa chọn Database Architecture:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           DATABASE SELECTION MATRIX                         │
├──────────────────┬──────────────────────┬──────────────────┬────────────────┤
│ Feature          │ MySQL (InnoDB)       │ PostgreSQL       │ ClickHouse     │
├──────────────────┼──────────────────────┼──────────────────┼────────────────┤
│ **Loại DB**      │ OLTP (Row-oriented)  │ OLTP (Row-oriented)│ OLAP (Columnar)│
├──────────────────┼──────────────────────┼──────────────────┼────────────────┤
│ **Primary Use**  │ E-commerce, Web Apps │ Complex Data, GIS│ Real-time Analytics│
├──────────────────┼──────────────────────┼──────────────────┼────────────────┤
│ **Storage Engine**│ Row-based (B+Tree)  │ Row-based (MVCC) │ Columnar (MergeTree)│
├──────────────────┼──────────────────────┼──────────────────┼────────────────┤
│ **Write Pattern**│ High-concurrency Single-row UPDATE/INSERT     │ Batch Insert (10k+ rows)│
├──────────────────┼──────────────────────┼──────────────────┼────────────────┤
│ **Read Pattern** │ Point Lookup, Small JOINs                       │ Aggregation over Millions of rows (`COUNT`, `SUM`, `AVG`)│
├──────────────────┼──────────────────────┼──────────────────┼────────────────┤
│ **Compression**  │ Thấp                 │ Trung bình       │ Cực cao (1:5 - 1:10) │
└──────────────────┴──────────────────────┴──────────────────┴────────────────┘
```

### Triết lý lựa chọn cho Tech Lead:
* **Chọn MySQL:** Khi team đã quen thuộc với MySQL ecosystem, hệ thống CRUD cơ bản, OLTP vừa và lớn.
* **Chọn PostgreSQL:** Khi hệ thống yêu cầu xử lý dữ liệu phức tạp (JSONB query sâu, PostGIS cho bản đồ/tọa độ, Full-text Search mạnh mẽ, Strict SQL Standards).
* **Chọn ClickHouse:** Khi xây dựng **Data Platform, Real-time Analytics, Event Streaming Pipeline, Log Management**. Tuyệt đối KHÔNG dùng ClickHouse làm DB chính cho transactional CRUD (vì ClickHouse UPDATE/DELETE đơn dòng cực kỳ tệ và không hỗ trợ ACID kiểu OLTP).

---

## 5. Cheat Sheet 🔴

```
┌──────────────────────────────────────────────────────────────┐
│               DATABASE DESIGN CHEAT SHEET                    │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│ Normalization vs Denormalization:                            │
│ • OLTP (MySQL/Postgres) → 3NF (Avoid Redundancy, Fast Write) │
│ • OLAP (ClickHouse)     → Denormalized Wide Tables (Fast Read)│
│                                                              │
│ Partition vs Sharding:                                       │
│ • Partitioning: Single Server, multiple physical files       │
│ • Sharding: Multiple Independent DB Servers (Horizontal Scale)│
│                                                              │
│ DB Selection Rule:                                           │
│ • OLTP Transactions (Orders, Payments) → MySQL / PostgreSQL  │
│ • Real-time Analytics & Big Data Logs → ClickHouse           │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

---

> → Tiếp theo: [Module 10 - Redis & Cache](../10-redis-cache/)
