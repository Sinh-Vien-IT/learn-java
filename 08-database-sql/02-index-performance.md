# 8.2 — Index & Performance Engineering 🔴

> **Mục tiêu:** Hiểu sâu cấu trúc B-Tree Index, Composite Index, Cardinality và quy trình Debug Query chạy 20 giây ở Production xuống còn dưới 10ms.

---

## 1. B-Tree Index Internals 🔴

### Tại sao lại là B-Tree / B+Tree?

Hầu hết Relational Database (MySQL InnoDB, PostgreSQL) sử dụng **B+Tree** cho Index:
* Tất cả data thật (hoặc Record Pointer) nằm ở **Leaf Nodes** (Lá).
* Các **Non-Leaf Nodes** chỉ chứa Index Key làm nhiệm vụ điều hướng (Routing).
* Các Leaf Nodes liên kết với nhau thành một danh sách liên kết đôi (**Doubly Linked List**) -> Giúp Query dạng Range (`BETWEEN`, `>`, `<`) và `ORDER BY` cực kỳ hiệu quả.

```
                  [ 50 ]
                 /      \
            [ 20 ]      [ 80 ]
           /      \    /      \
    [10, 15] -> [20, 30] -> [50, 60] -> [80, 90]  (Leaf nodes linked)
```

---

## 2. Composite Index & Leftmost Prefix Rule 🔴

Nếu tạo Composite Index `INDEX idx_user_status_date (user_id, status, created_at)`:

### Leftmost Prefix Rule
Index này chỉ hoạt động khi điều kiện `WHERE` tìm kiếm từ bên TRÁI sang bên PHẢI không đứt đoạn:

| Query Condition | Có dùng Index `(user_id, status, created_at)` không? |
|-----------------|----------------------------------------------------|
| `WHERE user_id = 1` | ✅ Có (Dùng phần `user_id`) |
| `WHERE user_id = 1 AND status = 'ACTIVE'` | ✅ Có (Dùng `user_id, status`) |
| `WHERE user_id = 1 AND status = 'ACTIVE' AND created_at > '2026-01-01'` | ✅ Có (Dùng cả 3 cột) |
| `WHERE status = 'ACTIVE'` | ❌ **KHÔNG** (Bị nhảy cóc `user_id` -> Full Table Scan) |
| `WHERE user_id = 1 AND created_at > '2026-01-01'` | ⚠️ Chỉ dùng được phần `user_id`. Phần `created_at` bị bỏ qua do thiếu `status`. |

### Range Condition Rule
Nếu trong câu SQL xuất hiện toán tử so sánh khoảng (`>`, `<`, `LIKE 'abc%'`, `BETWEEN`), Database sẽ dừng sử dụng các cột Index đứng phía SAU nó trong Composite Index!

---

## 3. Covering Index & Clustered Index 🔴

* **Clustered Index:** Trong InnoDB, Primary Key chính là Clustered Index. Data của cả dòng nằm trực tiếp ở Leaf Node của PK Index.
* **Secondary Index:** Các Index khác do dev tạo. Leaf node chứa value của Key + **Primary Key**.
* **Secondary Index Lookup (Bookmark Lookup):** Khi dùng Secondary Index tìm được PK -> Phải quay lại Clustered Index đọc nốt các cột khác (tốn gấp đôi I/O).
* **Covering Index:** Nếu câu SELECT **chỉ lấy các cột nằm sẵn trong Secondary Index**, DB trả về kết quả ngay lập tức mà KHÔNG CẦN quay lại Clustered Index! (Biểu hiện trong EXPLAIN: `Using index`).

---

## 4. Performance Debugging Framework: Query 20s ➔ 10ms 🔴

### Scenario
Một query báo cáo chạy ở Dev tốn **10ms**, nhưng khi deploy lên Production với bảng 50 triệu dòng thì chạy tốn **20 giây**.

```sql
SELECT order_id, total_amount 
FROM orders 
WHERE DATE(created_at) = '2026-08-10' 
  AND status = 'COMPLETED' 
ORDER BY total_amount DESC 
LIMIT 20;
```

### Bước 1: Chạy `EXPLAIN ANALYZER` / `EXPLAIN FORMAT=JSON`

```sql
EXPLAIN SELECT ...
```

**Các chỉ số nguy hiểm cần soi trong EXPLAIN:**
* `type`: `ALL` (Full Table Scan) hoặc `index` (Full Index Scan) -> **CỰC KỲ NGUY HIỂM**.
* `rows`: Scan 50,000,000 dòng -> **NGUY HIỂM**.
* `Extra`: `Using filesort`, `Using temporary` -> Phải sort ngoài đĩa cứng/RAM tạm.

### Bước 2: Phát hiện Nguyên Nhân (Root Causes)

1. **Lỗi 1: Dùng Function bọc quanh cột Index (`DATE(created_at)`)**
   * Do bọc hàm `DATE()`, Database không thể tra cứu trên cây B-Tree của index `created_at` -> Bắt buộc phải **Full Table Scan** 50M dòng để tính hàm `DATE()` cho từng dòng!
2. **Lỗi 2: Thiếu Index phù hợp**
   * Cần Composite Index phục vụ cả `WHERE` lẫn `ORDER BY`.

### Bước 3: Đề xuất Fix & Refactor Query

#### 1. Sửa Query (Tránh wrap function vào cột Index)
```sql
-- Chuyển từ DATE(created_at) = '2026-08-10' thành RANGE query:
SELECT order_id, total_amount 
FROM orders 
WHERE created_at >= '2026-08-10 00:00:00' 
  AND created_at < '2026-08-11 00:00:00'
  AND status = 'COMPLETED' 
ORDER BY total_amount DESC 
LIMIT 20;
```

#### 2. Tạo Index Tối Ưu (Phục vụ Filter + Sort)
Thứ tự trong Composite Index: **Equality (`=`) ➔ Range (`>=, <`) ➔ Sort (`ORDER BY`)**

```sql
CREATE INDEX idx_orders_status_created_amount 
ON orders (status, created_at, total_amount DESC);
```

### Bước 4: Kiểm tra lại kết quả
* `type`: `range` / `ref`
* `rows`: Scan ~500 dòng
* `Extra`: `Using index condition` (Không còn `Using filesort`)
* Execution Time: **20s ➔ 8ms** (Thành công!).

---

## 5. Cheat Sheet 🔴

```
┌──────────────────────────────────────────────────────────────┐
│                INDEX & SQL CHEAT SHEET                       │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│ B-Tree Rules:                                                │
│ • Leftmost Prefix: Composite Index (A,B,C) chỉ chạy khi WHERE │
│   có A. Thứ tự: Equality (=) -> Range (<,>) -> Sort (ORDER BY)│
│ • Covering Index: Selective columns nằm hết trong Index       │
│   -> Tránh Bookmark Lookup về Primary Key Clustered Index.   │
│                                                              │
│ Dangerous Anti-Patterns (Causes Full Table Scan):            │
│ ❌ WHERE DATE(created_at) = '2026-01-01'                     │
│ ❌ WHERE UPPER(email) = 'TEST@GMAIL.COM'                     │
│ ❌ WHERE phone LIKE '%999'  (Wildcard ở đầu string)          │
│ ❌ Implicit Type Conversion (WHERE phone_varchar = 12345)    │
│                                                              │
│ Debug Steps:                                                 │
│ 1. EXPLAIN ANALYZE query                                     │
│ 2. Check `type` (giao động từ system -> const -> ref ->      │
│    range -> index -> ALL)                                    │
│ 3. Fix Query: Bỏ wrap function quanh Column                  │
│ 4. Build proper Composite Index                              │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

---

> → Tiếp theo: [Module 09 - Database Design](../09-database-design/)
