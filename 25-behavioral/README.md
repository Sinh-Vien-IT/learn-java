# MODULE 25 — BEHAVIORAL INTERVIEW 🔴

> **Mục tiêu:** Cung cấp bộ câu hỏi Behavioral cốt lõi chuẩn STAR Method cá nhân hóa cho Senior Java / Tech Lead.

---

## 1. Top STAR Behavioral Scenarios 🔴

### Q1: "Hãy kể về sự cố Production nghiêm trọng nhất bạn từng gặp và cách bạn xử lý nó?" (Biggest Production Incident)

* **S (Situation):** *"Năm ngoái, hệ thống Kafka Consumer Lag của Data Pipeline bùng nổ lên 2 tiếng trong đợt Campaign 11/11 khiến Dashboard Real-time Analytics của Marketing bị đứt đoạn dữ liệu."*
* **T (Task):** *"Tôi là Senior Engineer On-call, cần phải giảm Lag xuống dưới 1 phút trong vòng 2 tiếng và đảm bảo không mất mát dữ liệu."*
* **A (Action):** *"1. Tôi kiểm tra Prometheus Metrics và phát hiện CPU của Consumer Pods bị spike 100% do Deserialize Avro Payload phức tạp. 2. Tôi lập tức dùng `kubectl scale` nâng số Consumer từ 3 lên 12, đồng thời re-partition Topic từ 6 lên 24 partitions. 3. Tune tăng batch size ghi vào ClickHouse từ 500 lên 2000. 4. Chủ động nhắn tin update tiến độ cho Marketing Stakeholders mỗi 30 phút."*
* **R (Result):** *"Consumer Lag hạ từ 2 tiếng xuống dưới 30 giây sau 1.5 giờ. Sau sự cố, tôi tổ chức một buổi **Post-Mortem (Blameless)**, xây dựng Auto-scaling policy cho K8s và viết Runbook hướng dẫn xử lý cho team."*

---

## 2. Cheat Sheet 🔴

```
┌──────────────────────────────────────────────────────────────┐
│               BEHAVIORAL INTERVIEW CHEAT SHEET               │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│ STAR Method Rules:                                           │
│ • S (Situation): Context ngắn gọn (15%).                     │
│ • T (Task): Nhiệm vụ cụ thể của BẠN (15%).                   │
│ • A (Action): Chi tiết kỹ thuật & Hành động của BẠN (50%).   │
│ • R (Result): Con số định lượng cụ thể & Lesson Learned (20%).│
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

---

> → Tiếp theo: [Module 29 - Cheat Sheet](../29-cheat-sheet/)
