# MODULE 17 — KUBERNETES & DOCKER 🟠

> **Mục tiêu:** Nắm vững kiến thức Kubernetes & Docker cần thiết cho Senior / Tech Lead để trả lời phỏng vấn và xử lý các sự cố Production Troubleshooting.

---

## 1. Production Troubleshooting Scenarios 🔴

### Scenario 1: Pod liên tục ở trạng thái `CrashLoopBackOff`
* **Nguyên nhân:** Application bị sập ngay khi khởi động (OOM, thiếu Env Var, DB Connection Refused, Exception trong `@PostConstruct`).
* **Các lệnh Debug:**
  ```bash
  kubectl describe pod <pod-name>       # Kiểm tra Exit Code & Events
  kubectl logs <pod-name> --previous    # Xem Log của Container ngay trước khi crash!
  ```

### Scenario 2: Pod ở trạng thái `Running` nhưng Service không thể truy cập
* **Nguyên nhân:** `Readiness Probe` bị FAILED (Service chưa sẵn sàng nhận traffic). Hoặc Label Selector của Service không trùng khớp với Pod Labels.
* **Cách fix:** Kiểm tra lại endpoint `/actuator/health` xem Readiness Probe cấu hình đúng chưa.

---

## 2. Cheat Sheet 🟠

```
┌──────────────────────────────────────────────────────────────┐
│             KUBERNETES & DOCKER CHEAT SHEET                  │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│ Probes:                                                      │
│ • Liveness Probe: FAILED -> K8s KILLS & Restarts Pod.        │
│ • Readiness Probe: FAILED -> K8s REMOVES Pod from Service    │
│   Endpoints (No Traffic).                                    │
│                                                              │
│ Debug Commands:                                              │
│ • kubectl logs <pod> --previous (Check crash logs)           │
│ • kubectl describe pod <pod>   (Check OOMKilled / Events)    │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

---

> → Tiếp theo: [Module 24 - Tech Lead](../24-tech-lead/)
