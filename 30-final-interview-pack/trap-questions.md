# 30.1 — Trap Questions (Các câu hỏi tưởng dễ nhưng hỏi sâu) 🔴

> **Mục tiêu:** Tổng hợp các câu hỏi bẫy kinh điển trong các buổi phỏng vấn Senior Java / Tech Lead. Giải thích chi tiết tại sao các câu trả lời đơn giản thông thường đều SAI.

---

## 1. Top 10 Trap Questions 🔴

### Trap 1: "HashMap có Thread-safe không?"
* **Trả lời sai/nông:** *"Không thread-safe ạ."*
* **Senior Answer:** 
  > *"HashMap không thread-safe. Trong môi trường đa luồng:
  > - Ở Java 7: Khi concurrent `put()` gây rehash, nó có thể tạo ra **Circular Linked List** gây ra Vòng lặp vô tận (Infinite Loop) khiến CPU 100%.
  > - Ở Java 8+: Đã sửa lỗi circular list nhưng vẫn gây ra **Lost Update** (ghi đè data của nhau) hoặc dữ liệu bị hỏng.
  > - Giải pháp: Dùng `ConcurrentHashMap` (khóa theo Bucket/CAS) chứ không dùng `Collections.synchronizedMap` (vì nó lock toàn bộ Map gây nghẽn)."*

---

### Trap 2: "Volatile có Thread-safe không?"
* **Trả lời sai/nông:** *"Có ạ, volatile giúp biến trở thành thread-safe."*
* **Senior Answer:**
  > *"KHÔNG hoàn toàn! `volatile` chỉ đảm bảo tính **Visibility** (Hiển thị) và **Ordering** (Tránh Reordering), nhưng **KHÔNG ĐẢM BẢO Atomicity** (Tính nguyên tố).
  > Biến `volatile int count = 0;` nếu thực hiện `count++` bởi nhiều thread thì vẫn bị Race Condition vì `count++` gồm 3 bước (Read-Modify-Write). Muốn atomic phải dùng `AtomicInteger` hoặc `synchronized`."*

---

### Trap 3: "`@Transactional` có đảm bảo Atomicity cho toàn hệ thống không?"
* **Trả lời sai/nông:** *"Có ạ, bọc `@Transactional` thì lỗi sẽ rollback hết."*
* **Senior Answer:**
  > *"KHÔNG! `@Transactional` chỉ có hiệu lực trên **cùng 1 DB Connection** (ThreadLocal). Nếu method gọi tới API của Microservice khác hoặc gửi Kafka Message, thì `@Transactional` KHÔNG THỂ rollback được dữ liệu bên phía Service kia hay trên Kafka. Cần dùng Saga Pattern hoặc Outbox Pattern cho Distributed System."*

---

### Trap 4: "Kafka có đảm bảo Exactly-Once Processing không?"
* **Trả lời sai/nông:** *"Có ạ, Kafka có cấu hình Exactly-Once."*
* **Senior Answer:**
  > *"Về mặt lý thuyết mạng (Network Communication), Exactly-Once Delivery qua mạng giữa 2 hệ thống phân tán là BẤT KHẢ THI (Two Generals' Problem). 
  > Kafka đạt được Exactly-Once Semantics (EOS) bằng công thức: **At-Least-Once Delivery + Idempotent Consumer (hoặc Transactional Producer)**. Bản chất là Deduplication tại nơi nhận."*

---

### Trap 5: "Microservices có luôn tốt hơn Monolith không?"
* **Trả lời sai/nông:** *"Có ạ, Microservices hiện đại hơn và scale tốt hơn."*
* **Senior Answer:**
  > *"KHÔNG! Microservices đánh đổi sự đơn giản của Monolith lấy sự phức tạp tột cùng của Hệ thống Phân tán (Distributed Data, Latency, Network Partition, Observability). 
  > Nếu Domain chưa ổn định hoặc Team quá nhỏ (<10 người), Microservices sẽ biến thành **Distributed Monolith** (thảm họa). Lựa chọn đúng đắn ban đầu là **Modular Monolith**."*

---

> → Tiếp theo: [30.2 — Production Incidents](./production-incidents.md)
