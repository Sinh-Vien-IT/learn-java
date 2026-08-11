# MODULE 6 — SPRING BOOT 🔴

> **Mục tiêu:** Hiểu Spring Boot auto-configuration, REST API design best practices.

---

## Mục Lục

1. [Auto-Configuration](#1-auto-configuration)
2. [Configuration Management](#2-configuration-management)
3. [REST API Design](#3-rest-api-design)
4. [Exception Handling](#4-exception-handling)
5. [Actuator & Monitoring](#5-actuator--monitoring)
6. [Interview Questions](#6-interview-questions)
7. [Cheat Sheet](#7-cheat-sheet)

---

## 1. Auto-Configuration 🔴

### Cách Spring Boot Auto-Config hoạt động

```
@SpringBootApplication
    = @Configuration + @EnableAutoConfiguration + @ComponentScan

@EnableAutoConfiguration:
1. Đọc META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports
   (trước đó: META-INF/spring.factories)
2. Tìm tất cả AutoConfiguration classes
3. Mỗi class có @Conditional annotations:
   → @ConditionalOnClass: chỉ enable nếu class tồn tại trong classpath
   → @ConditionalOnMissingBean: chỉ enable nếu user chưa define bean
   → @ConditionalOnProperty: chỉ enable nếu property set
4. Nếu conditions match → auto-configure beans
```

### Ví dụ: DataSource Auto-Configuration

```
1. spring-boot-starter-data-jpa có trong classpath
2. HikariDataSource class detected → @ConditionalOnClass match
3. User chưa define DataSource bean → @ConditionalOnMissingBean match
4. spring.datasource.url property set → @ConditionalOnProperty match
5. → Spring Boot tự tạo HikariDataSource bean với properties từ application.yml

Override: chỉ cần define DataSource bean → auto-config bị skip
```

### Starter Dependencies

```
spring-boot-starter-web:
  → Tomcat + Spring MVC + Jackson
  → Auto-configure: DispatcherServlet, ErrorMvcAutoConfiguration, etc.

spring-boot-starter-data-jpa:
  → Hibernate + HikariCP + Spring Data JPA
  → Auto-configure: DataSource, EntityManagerFactory, TransactionManager

Mỗi starter = curated set of dependencies + auto-configuration
```

---

## 2. Configuration Management 🟠

### Profiles

```yaml
# application.yml (default)
server:
  port: 8080

# application-dev.yml
spring:
  datasource:
    url: jdbc:mysql://localhost:3306/mydb

# application-prod.yml  
spring:
  datasource:
    url: jdbc:mysql://prod-db:3306/mydb
    hikari:
      maximum-pool-size: 50
```

```bash
# Activate profile
java -jar app.jar --spring.profiles.active=prod
# Or: SPRING_PROFILES_ACTIVE=prod (env var for K8s)
```

### Configuration Properties (Type-safe)

```java
@ConfigurationProperties(prefix = "app.kafka")
public record KafkaConfig(
    String bootstrapServers,
    String groupId,
    int maxPollRecords,
    Duration pollTimeout,
    RetryConfig retry
) {
    public record RetryConfig(int maxAttempts, Duration backoff) {}
}

// application.yml
// app:
//   kafka:
//     bootstrap-servers: kafka-1:9092,kafka-2:9092
//     group-id: order-service
//     max-poll-records: 500
//     poll-timeout: 5s
//     retry:
//       max-attempts: 3
//       backoff: 1s
```

### Configuration Priority (cao → thấp)

```
1. Command line args (--server.port=9090)
2. SPRING_APPLICATION_JSON
3. OS environment variables (SERVER_PORT=9090)
4. application-{profile}.yml
5. application.yml
6. @PropertySource
7. Default properties
```

---

## 3. REST API Design 🔴

### HTTP Methods & Status Codes

```
GET    /api/v1/orders           → 200 OK (list)
GET    /api/v1/orders/{id}      → 200 OK / 404 Not Found
POST   /api/v1/orders           → 201 Created (Location header)
PUT    /api/v1/orders/{id}      → 200 OK / 404 Not Found
PATCH  /api/v1/orders/{id}      → 200 OK / 404 Not Found
DELETE /api/v1/orders/{id}      → 204 No Content / 404 Not Found

Status Codes:
  2xx: Success    (200 OK, 201 Created, 204 No Content)
  3xx: Redirect   (301 Moved, 304 Not Modified)
  4xx: Client err (400 Bad Request, 401 Unauthorized, 403 Forbidden, 404 Not Found, 409 Conflict, 422 Unprocessable)
  5xx: Server err (500 Internal, 502 Bad Gateway, 503 Service Unavailable, 504 Gateway Timeout)
```

### Idempotency 🔴

```
Idempotent: cùng request gọi nhiều lần → cùng kết quả

GET:    ✅ Luôn idempotent
PUT:    ✅ Luôn idempotent (replace toàn bộ)
DELETE: ✅ Luôn idempotent
PATCH:  ⚠️ Có thể không idempotent
POST:   ❌ Thường KHÔNG idempotent

POST idempotent: dùng idempotency key
  → Client gửi header: Idempotency-Key: uuid-123
  → Server: check key đã xử lý chưa?
    → Đã xử lý → return cached response
    → Chưa → process, lưu key + response, return response
```

### Pagination & Filtering

```java
// Request
GET /api/v1/orders?page=0&size=20&sort=createdAt,desc&status=COMPLETED

// Response
{
    "content": [...],
    "page": { "number": 0, "size": 20, "totalElements": 150, "totalPages": 8 }
}

// Spring Data Pageable
@GetMapping("/orders")
public Page<OrderResponse> getOrders(
    @RequestParam(defaultValue = "COMPLETED") OrderStatus status,
    @PageableDefault(size = 20, sort = "createdAt", direction = DESC) Pageable pageable
) {
    return orderService.findByStatus(status, pageable);
}
```

### API Versioning

```java
// 1. URL path (most common, clearest)
@RequestMapping("/api/v1/orders")
@RequestMapping("/api/v2/orders")

// 2. Header
@GetMapping(headers = "X-API-Version=2")

// 3. Query param
@GetMapping(params = "version=2")

// Recommendation: URL path versioning — simple, cacheable, debuggable
```

---

## 4. Exception Handling 🔴

### Global Exception Handler

```java
@RestControllerAdvice
public class GlobalExceptionHandler {
    
    @ExceptionHandler(ResourceNotFoundException.class)
    @ResponseStatus(HttpStatus.NOT_FOUND)
    public ErrorResponse handleNotFound(ResourceNotFoundException ex) {
        return new ErrorResponse(
            "NOT_FOUND",
            ex.getMessage(),
            LocalDateTime.now()
        );
    }
    
    @ExceptionHandler(MethodArgumentNotValidException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ErrorResponse handleValidation(MethodArgumentNotValidException ex) {
        Map<String, String> errors = ex.getBindingResult()
            .getFieldErrors().stream()
            .collect(Collectors.toMap(
                FieldError::getField,
                FieldError::getDefaultMessage,
                (a, b) -> a
            ));
        return new ErrorResponse("VALIDATION_ERROR", "Validation failed", errors);
    }
    
    @ExceptionHandler(Exception.class)
    @ResponseStatus(HttpStatus.INTERNAL_SERVER_ERROR)
    public ErrorResponse handleGeneric(Exception ex) {
        log.error("Unexpected error", ex);
        return new ErrorResponse(
            "INTERNAL_ERROR",
            "An unexpected error occurred", // Không expose internal details!
            LocalDateTime.now()
        );
    }
}

public record ErrorResponse(String code, String message, Object details) {}
```

### Validation

```java
@PostMapping("/orders")
public ResponseEntity<OrderResponse> createOrder(
    @Valid @RequestBody CreateOrderRequest request
) {
    // @Valid triggers validation
}

public record CreateOrderRequest(
    @NotNull Long customerId,
    @NotEmpty List<@Valid OrderItemRequest> items,
    @Size(max = 500) String notes
) {}

public record OrderItemRequest(
    @NotNull Long productId,
    @Min(1) @Max(1000) int quantity
) {}
```

---

## 5. Actuator & Monitoring 🟠

```yaml
# application.yml
management:
  endpoints:
    web:
      exposure:
        include: health, metrics, info, prometheus
  endpoint:
    health:
      show-details: when-authorized
  metrics:
    tags:
      application: order-service
```

```
/actuator/health      → Readiness/Liveness for K8s
/actuator/metrics     → JVM, HTTP, custom metrics
/actuator/prometheus  → Prometheus scraping format
/actuator/info        → Application info
```

### Custom Health Check

```java
@Component
public class KafkaHealthIndicator implements HealthIndicator {
    @Override
    public Health health() {
        try {
            kafkaTemplate.send("health-check", "ping").get(5, TimeUnit.SECONDS);
            return Health.up().withDetail("kafka", "connected").build();
        } catch (Exception e) {
            return Health.down().withException(e).build();
        }
    }
}
```

---

## 6. Interview Questions

### Q1: "Spring Boot Auto-Configuration hoạt động thế nào?" 🔴

#### Strong answer
> "@EnableAutoConfiguration scan META-INF auto-configuration classes. Mỗi class có @Conditional annotations — chỉ activate khi conditions match (class on classpath, bean chưa defined, property set). Ví dụ: HikariCP on classpath + spring.datasource.url set → auto-create DataSource.
>
> User luôn có thể override: define DataSource bean → auto-config skip (ConditionalOnMissingBean). Đây là convention over configuration."

### Q2: "REST API design best practices?" 🔴

#### Strong answer
> "Resource-based URLs (nouns not verbs), proper HTTP methods (GET/POST/PUT/DELETE), correct status codes, consistent error format, pagination cho list endpoints, versioning (URL path), idempotency cho POST (idempotency key). Validation với @Valid. Global exception handling với @RestControllerAdvice."

### Q3: "Idempotency trong REST API?" 🔴

#### Strong answer
> "GET/PUT/DELETE inherently idempotent. POST thường không — cùng POST 2 lần tạo 2 resources. Solution: idempotency key — client gửi unique key, server check đã xử lý chưa. Nếu rồi → return cached response. Critical cho payment — tránh charge 2 lần."
> → Xem cross-reference: [Module 07 - Transaction](../07-transaction/), [Module 14 - Distributed System](../14-distributed-system/)

---

## 7. Cheat Sheet

```
┌──────────────────────────────────────────────────────────────┐
│                 SPRING BOOT CHEAT SHEET                      │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│ Auto-Configuration:                                          │
│ • @ConditionalOnClass, @ConditionalOnMissingBean             │
│ • User-defined beans override auto-config                    │
│ • Starter = dependencies + auto-config                       │
│                                                              │
│ REST API:                                                    │
│ • GET=read, POST=create, PUT=replace, PATCH=partial, DEL=rm │
│ • 200/201/204/400/401/403/404/409/500                       │
│ • Idempotency key for POST                                  │
│ • Pagination: page, size, sort                               │
│ • Versioning: /api/v1/                                       │
│ • Validation: @Valid + @NotNull/@Min/@Size                   │
│ • Error: @RestControllerAdvice + @ExceptionHandler           │
│                                                              │
│ Config Priority (high→low):                                  │
│ • CLI args → env vars → profile yml → default yml            │
│                                                              │
│ Actuator:                                                    │
│ • /health → K8s probes                                       │
│ • /prometheus → metrics scraping                             │
│ • Custom HealthIndicator for dependencies                    │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

---

> → Tiếp theo: [Module 07 - Transaction](../07-transaction/)
