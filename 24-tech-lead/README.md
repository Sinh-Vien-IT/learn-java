# MODULE 24 — TECH LEAD 🔴

> **Mục tiêu:** Cung cấp bộ khung tư duy, kỹ năng quản lý kĩ thuật, giải quyết xung đột, quản lý Technical Debt và quy trình trả lời các câu hỏi phỏng vấn vị trí Tech Lead.

---

## 1. Top Tech Lead Scenarios & Model Answers 🔴

### Scenario 1: Product Manager (PM) đưa ra Deadline không thực tế (Unrealistic Deadline)
* **❌ Trả lời kém:** *"Em bảo với PM là không làm kịp đâu, rồi làm được đến đâu thì đến."*
* **✅ Trả lời đỉnh đạc (Tech Lead Level):**
  > *"Tôi sẽ không phản đối suông mà sử dụng **Data-driven Trade-off Negotiation**. 
  > 1. Tôi cùng team tiến hành **Breakdown Task** và đưa ra Estimate minh bạch dựa trên Velocity của team.
  > 2. Tôi làm việc lại với PM dựa trên **Triple Constraint Triangle** (Scope - Time - Resource): 
  >    - Nếu **Time** cố định (Deadline không lùi), ta phải **Cut Scope** (Phase 1 chỉ làm Core P0 Features, P1/P2 đẩy sang Phase 2).
  >    - Hoặc chấp nhận **Phased Delivery** (Deploy Feature Flag cho subset users trước).
  > 3. Tuyệt đối không chấp nhận thỏa hiệp bằng cách 'bỏ bớt Unit Test hay viết code ẩu' vì nó sẽ tạo ra Technical Debt tàn phá hệ thống về sau."*

---

### Scenario 2: Quản lý Technical Debt vs Feature Delivery
* **✅ Trả lời (Tech Lead Level):**
  > *"Tôi duy trì một **Technical Debt Backlog** được phân loại theo Rủi ro (Impact vs Effort).
  > Trong mỗi Sprint Planning, tôi đàm phán thương lượng dành ra cố định **20% Sprint Capacity** cho Tech Debt Refactoring, Security Updates và Tooling. Dùng dữ liệu Production (Error rate, Latency, Downtime) để chứng minh cho PM thấy việc trả Tech Debt giúp tăng tốc độ delivery feature ở các sprint sau."*

---

## 2. Cheat Sheet 🔴

```
┌──────────────────────────────────────────────────────────────┐
│                  TECH LEAD CHEAT SHEET                       │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│ Core Mindset:                                                │
│ • You are a Team Multiplier, not just a solo coder.          │
│ • Business Value > Tech Hype.                                │
│ • 20% Sprint Capacity dedicated for Technical Debt.          │
│ • Unrealistic Deadline -> Negotiate Scope, never compromise  │
│   Code Quality.                                              │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

---

> → Tiếp theo: [Module 25 - Behavioral Interview](../25-behavioral/)
