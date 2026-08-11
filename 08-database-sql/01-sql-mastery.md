# 8.1 — SQL Mastery 🔴

> **Mục tiêu:** Làm chủ các câu lệnh SQL phức tạp, Window Functions, CTE và phân biệt hiệu năng giữa các kỹ thuật viết SQL nâng cao.

---

## 1. Window Functions 🔴

Window Functions cho phép tính toán trên một tập các dòng (window) liên quan tới dòng hiện tại mà **KHÔNG gộp (group)** các dòng lại thành 1 dòng như `GROUP BY`.

### Syntax
```sql
FUNCTION_NAME() OVER (
    PARTITION BY column1, column2
    ORDER BY column3 ASC|DESC
    ROWS|RANGE BETWEEN ...
)
```

### Các hàm phổ biến & Production Examples

#### 1. `ROW_NUMBER()`, `RANK()`, `DENSE_RANK()`

| Hàm | Giải thích | Ví dụ điểm: [100, 100, 90] |
|-----|------------|---------------------------|
| `ROW_NUMBER()` | Đánh số thứ tự duy nhất cho từng dòng (không trùng). | 1, 2, 3 |
| `RANK()` | Đồng hạng sẽ cùng số, nhưng bỏ cách số tiếp theo. | 1, 1, 3 |
| `DENSE_RANK()` | Đồng hạng cùng số, KHÔNG bỏ cách số tiếp theo. | 1, 1, 2 |

```sql
-- Production Case: Tìm Top 3 đơn hàng có giá trị lớn nhất của MỖI User
WITH RankedOrders AS (
    SELECT 
        order_id,
        user_id,
        total_amount,
        ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY total_amount DESC) as rn
    FROM orders
)
SELECT order_id, user_id, total_amount
FROM RankedOrders
WHERE rn <= 3;
```

#### 2. `LEAD()` và `LAG()`
Lấy dữ liệu của dòng sau (`LEAD`) hoặc dòng trước (`LAG`) so với dòng hiện tại.

```sql
-- Production Case: Tính thời gian chênh lệch (latency) giữa 2 lần bấm nút liên tiếp của User
SELECT 
    user_id,
    click_time,
    LAG(click_time, 1) OVER (PARTITION BY user_id ORDER BY click_time) as prev_click_time,
    TIMESTAMPDIFF(SECOND, LAG(click_time, 1) OVER (PARTITION BY user_id ORDER BY click_time), click_time) as diff_seconds
FROM user_clicks;
```

---

## 2. Common Table Expressions (CTE) & Subquery 🔴

### Subquery vs CTE vs Temporary Table

| Feature | Subquery | CTE (`WITH ... AS`) | Temporary Table (`CREATE TEMP TABLE`) |
|---------|----------|---------------------|--------------------------------------|
| **Scope** | Trong cùng câu Query chứa nó | Trong cùng câu Query (có thể tái sử dụng nhiều lần) | Trong toàn bộ Database Session/Connection |
| **Readability** | Thấp (Nested Spaghetti) | Rất cao (Modular design) | Trung bình |
| **Performance** | Tùy Query Optimizer inline | MySQL 8.0+ / Postgres optimizer inline/materialize | Tốn I/O ghi disk/memory tạm, cần Drop thủ công |

---

## 3. `EXISTS` vs `IN` vs `JOIN` 🔴

### Quy tắc vàng tối ưu hóa Query

```sql
-- 1. Dùng EXISTS khi Subquery kiểm tra sự TỒN TẠI (Semi-Join):
-- Dừng scan ngay khi tìm thấy 1 match duy nhất -> Rất nhanh!
SELECT * FROM users u 
WHERE EXISTS (
    SELECT 1 FROM orders o WHERE o.user_id = u.id AND o.status = 'COMPLETED'
);

-- 2. Dùng IN khi danh sách phần tử nhỏ hoặc Cố định:
SELECT * FROM products WHERE category_id IN (1, 2, 3);
-- ⚠️ CẢNH BÁO: `IN (SELECT id FROM ...)` dễ dính NULL trap. Nếu Subquery chứa NULL -> IN trả về UNKNOWN!
```

---

> → Tiếp theo: [02-index-performance.md](./02-index-performance.md)
