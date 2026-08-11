# 3.1 — JVM Architecture 🔴

> **Mục tiêu:** Hiểu JVM không phải ở level "JVM chạy bytecode" mà ở level "data lưu ở đâu, class load thế nào, tại sao StackOverflow xảy ra".

---

## Mục Lục

1. [JVM Overview](#1-jvm-overview)
2. [Class Loading](#2-class-loading)
3. [Runtime Data Areas](#3-runtime-data-areas)
4. [Execution Engine](#4-execution-engine)
5. [Interview Questions](#5-interview-questions)

---

## 1. JVM Overview 🔴

### JVM Architecture Diagram

```
┌──────────────────────────────────────────────────────────────┐
│                        JVM                                    │
│                                                               │
│  ┌────────────────────────────────────────────────────────┐   │
│  │                  CLASS LOADING                          │   │
│  │  Bootstrap → Extension → Application ClassLoaders       │   │
│  └────────────────────┬───────────────────────────────────┘   │
│                       │ .class files                          │
│                       ▼                                       │
│  ┌────────────────────────────────────────────────────────┐   │
│  │              RUNTIME DATA AREAS                         │   │
│  │                                                         │   │
│  │  ┌──────────┐  ┌──────────┐  ┌───────────────────┐     │   │
│  │  │  Method  │  │   Heap   │  │    JVM Stack      │     │   │
│  │  │  Area    │  │          │  │  (per thread)     │     │   │
│  │  │(Metaspace│  │ Young Gen│  │  ┌─────────────┐  │     │   │
│  │  │  Java 8+)│  │ Old Gen  │  │  │Stack Frames │  │     │   │
│  │  └──────────┘  └──────────┘  │  │ Local Vars  │  │     │   │
│  │                               │  │ Operand Stk │  │     │   │
│  │  ┌──────────┐  ┌──────────┐  │  └─────────────┘  │     │   │
│  │  │PC Register│ │  Native  │  └───────────────────┘     │   │
│  │  │(per thread)│ │ Method  │                             │   │
│  │  └──────────┘  │  Stack   │                             │   │
│  │                 └──────────┘                             │   │
│  └────────────────────────────────────────────────────────┘   │
│                       │                                       │
│                       ▼                                       │
│  ┌────────────────────────────────────────────────────────┐   │
│  │              EXECUTION ENGINE                           │   │
│  │  Interpreter → JIT Compiler (C1/C2) → GC               │   │
│  └────────────────────────────────────────────────────────┘   │
│                                                               │
│  ┌────────────────────────────────────────────────────────┐   │
│  │           NATIVE METHOD INTERFACE (JNI)                 │   │
│  └────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────┘
```

---

## 2. Class Loading 🟠

### ClassLoader Hierarchy

```
Bootstrap ClassLoader (C++ code, loads rt.jar / java.base)
       │
       ▼
Extension/Platform ClassLoader (loads jre/lib/ext)
       │
       ▼
Application ClassLoader (loads classpath - your code)
       │
       ▼
Custom ClassLoaders (Tomcat, OSGi, etc.)
```

### Delegation Model (Parent-First)

```
Request to load class "com.myapp.Service"
    │
    ▼
Application ClassLoader: "Tôi có chưa? Không → hỏi parent"
    │
    ▼
Extension ClassLoader: "Tôi có chưa? Không → hỏi parent"
    │
    ▼
Bootstrap ClassLoader: "Tôi có chưa? Không → trả về cho con"
    │
    ▼
Extension ClassLoader: "Tôi tìm trong ext? Không → trả về cho con"
    │
    ▼
Application ClassLoader: "Tôi tìm trong classpath → FOUND!"
```

### Class Loading Phases

```
Loading → Linking (Verify → Prepare → Resolve) → Initialization

1. LOADING:    Đọc .class file, tạo Class object
2. VERIFY:     Check bytecode hợp lệ (security)
3. PREPARE:    Allocate memory cho static fields (default values)
4. RESOLVE:    Symbolic references → direct references
5. INITIALIZE: Chạy static initializers, static blocks
```

### Production relevance

```java
// ClassNotFoundException vs NoClassDefFoundError
// ClassNotFoundException: class không tìm thấy khi load dynamically
Class.forName("com.driver.MySQL"); // throws ClassNotFoundException

// NoClassDefFoundError: class có lúc compile nhưng missing lúc runtime
// Hoặc: class initialization fail (static block throw exception)
// → Lần gọi sau sẽ thấy NoClassDefFoundError
```

### Tomcat ClassLoader — Interview topic

```
Tomcat dùng child-first (ngược parent-first) cho web apps:
  → Mỗi webapp có ClassLoader riêng
  → webapp có thể dùng version library khác nhau
  → Hot reload: destroy ClassLoader = unload tất cả classes
```

---

## 3. Runtime Data Areas 🔴

### 3.1 Heap — Shared across all threads

```
┌──────────────────────────────────────────────────┐
│                      HEAP                         │
│                                                   │
│  ┌───────────────────────┐  ┌──────────────────┐ │
│  │    Young Generation    │  │  Old Generation  │ │
│  │                        │  │  (Tenured)       │ │
│  │  ┌─────┐ ┌────┬────┐  │  │                  │ │
│  │  │Eden │ │ S0 │ S1 │  │  │  Long-lived      │ │
│  │  │     │ │    │    │  │  │  objects          │ │
│  │  └─────┘ └────┴────┘  │  │                  │ │
│  │                        │  │                  │ │
│  │  New objects here      │  │  Survived many   │ │
│  │  Minor GC frequent     │  │  GC cycles       │ │
│  └───────────────────────┘  └──────────────────┘ │
│                                                   │
│  -Xms: initial heap    -Xmx: max heap            │
│  -Xmn: young gen size                             │
└──────────────────────────────────────────────────┘
```

**Object lifecycle trên Heap:**
```
1. new Object() → allocate trong Eden
2. Eden full → Minor GC
3. Survived objects → S0 (age = 1)
4. Next Minor GC: Eden + S0 live objects → S1 (age + 1)
5. S0 ↔ S1 swap mỗi Minor GC
6. Object age > threshold (default 15) → promote to Old Gen
7. Old Gen full → Major GC / Full GC
```

### 3.2 JVM Stack — Per thread

```
Thread Stack (per thread, default ~1MB):
┌──────────────────────┐
│  Frame: methodC()    │  ← top (current executing)
│  ┌─────────────────┐ │
│  │ Local Variables  │ │  ← primitives + references
│  │ Operand Stack    │ │  ← computation workspace
│  │ Frame Data       │ │  ← return address, exception table
│  └─────────────────┘ │
├──────────────────────┤
│  Frame: methodB()    │
├──────────────────────┤
│  Frame: methodA()    │
├──────────────────────┤
│  Frame: main()       │  ← bottom
└──────────────────────┘

Stack quá sâu → StackOverflowError (recursive call quá nhiều)
-Xss: stack size per thread (default 512K-1M)
```

### 3.3 Metaspace (Java 8+, thay PermGen)

```
Metaspace: lưu class metadata, method definitions, constant pool
  → Dùng native memory (không phải heap)
  → Tự grow (không fixed size như PermGen)
  → -XX:MaxMetaspaceSize=256m (giới hạn nếu cần)
  
Metaspace leak: 
  → Hot deploy (Tomcat redeploy) mà ClassLoader không được GC
  → Proxy generation quá nhiều (CGLib, Reflection)
```

### 3.4 PC Register — Per thread

```
Program Counter: địa chỉ bytecode instruction đang execute
  → Per thread (mỗi thread track vị trí riêng)
  → Native method → undefined
```

### 3.5 Native Method Stack — Per thread

```
Stack cho native methods (C/C++ code via JNI)
  → Ví dụ: System.arraycopy(), I/O operations
```

### Memory Summary

| Area | Shared? | Stores | Error | JVM Flag |
|------|---------|--------|-------|----------|
| Heap | ✅ | Objects, arrays | OutOfMemoryError | -Xms, -Xmx |
| Stack | ❌ per thread | Local vars, frames | StackOverflowError | -Xss |
| Metaspace | ✅ | Class metadata | OutOfMemoryError: Metaspace | -XX:MaxMetaspaceSize |
| PC Register | ❌ per thread | Current instruction | — | — |
| Native Stack | ❌ per thread | Native method frames | — | — |

---

## 4. Execution Engine 🟠

### Interpreter vs JIT Compiler

```
Source Code → javac → Bytecode (.class)
                          │
                          ▼
                    ┌────────────┐
                    │ Interpreter │  ← Đọc bytecode từng instruction
                    │  (slow)     │     Không optimize
                    └──────┬─────┘
                           │
                    Hotspot detected (method called many times)
                           │
                    ┌──────▼───────┐
                    │ JIT Compiler  │  ← Compile bytecode → native code
                    │ C1 (Client)   │     Cache compiled code
                    │ C2 (Server)   │     Subsequent calls = native speed
                    └──────────────┘
```

### Tiered Compilation (Default Java 8+)

```
Level 0: Interpreter (cold code)
Level 1-3: C1 compiler (quick compilation, basic optimizations)
Level 4: C2 compiler (slow compilation, aggressive optimizations)

Flow: Interpreter → profiling → C1 → more profiling → C2
Hot methods get native-speed execution
```

### JIT Optimizations

```
1. Method Inlining: thay method call bằng method body
   → Giảm overhead function call
   → -XX:MaxInlineSize=35 (bytes)

2. Dead Code Elimination: bỏ code không bao giờ chạy

3. Loop Unrolling: repeat loop body, reduce branch prediction misses

4. Escape Analysis: object không escape method → allocate trên Stack (thay Heap)
   → Không cần GC cho objects này!
   
5. Lock Elision: synchronized trên object không shared → bỏ lock
```

### Production tip

```bash
# Xem JIT compilation
java -XX:+PrintCompilation MyApp

# Xem inlining decisions
java -XX:+PrintInlining MyApp

# Warm-up: JIT cần thời gian compile hot methods
# → API latency cao lúc startup, giảm dần
# → Production: warm-up requests trước nhận real traffic
```

---

## 5. Interview Questions

### Q1: "Giải thích JVM Architecture?" 🔴

#### What interviewer is testing
Overview understanding + biết data lưu ở đâu.

#### Strong answer
> "JVM gồm 3 phần chính: Class Loading, Runtime Data Areas, và Execution Engine.
>
> Class Loading dùng delegation model — Application ClassLoader → Extension → Bootstrap. Classes load lazy, chỉ khi first reference.
>
> Runtime Data Areas gồm Heap (shared, objects, GC manages), Stack (per thread, local vars, StackOverflow nếu quá sâu), Metaspace (class metadata, thay PermGen từ Java 8), PC Register và Native Stack.
>
> Execution Engine: Interpreter chạy bytecode trực tiếp, JIT Compiler detect hot methods và compile ra native code cho performance. Tiered compilation C1→C2.
>
> Production relevance: -Xmx cho heap limit, -Xss cho stack size, MaxMetaspaceSize cho class metadata. Hiểu areas này để debug OOM — mỗi area có OOM riêng."

#### Follow-up: "Heap vs Stack — object lưu ở đâu?"
> "Objects luôn trên Heap. References (pointers) trên Stack. Primitives local thì trên Stack. Ngoại lệ: JIT Escape Analysis có thể allocate object trên Stack nếu object không escape method — optimization, không ảnh hưởng semantics."

#### Follow-up: "PermGen vs Metaspace?"
> "PermGen (Java 7 trở xuống): fixed size trên Heap, chứa class metadata. Hay gặp 'PermGen space' error khi load quá nhiều classes (hot deploy Tomcat).
>
> Metaspace (Java 8+): dùng native memory, tự grow. Giải quyết fixed size problem. Nhưng vẫn cần set MaxMetaspaceSize để tránh memory leak (classloader leak)."

---

### Q2: "StackOverflowError vs OutOfMemoryError?" 🔴

#### Strong answer
> "StackOverflowError: JVM Stack full — thường do recursive call quá sâu hoặc infinite recursion. Mỗi method call tạo stack frame. Fix: tăng -Xss hoặc fix recursion logic.
>
> OutOfMemoryError: Heap full — quá nhiều objects, hoặc memory leak (objects không được GC vì vẫn có reference). Fix: tăng -Xmx (short-term), fix memory leak (long-term), analyze heap dump.
>
> OOM cũng có thể từ Metaspace (quá nhiều classes) hoặc native memory (direct buffer, JNI)."

---

### Q3: "ClassLoader hoạt động thế nào?" 🟠

#### Strong answer
> "Parent delegation: Application → Extension → Bootstrap. Mỗi ClassLoader check parent trước. Security: đảm bảo core classes (java.lang.String) luôn từ Bootstrap, không bị override.
>
> Tomcat phá vỡ model: child-first cho web apps — mỗi webapp có ClassLoader riêng, load classes trước parent. Cho phép khác version library. Hot deploy: destroy ClassLoader = unload classes."

---

> → Tiếp theo: [02-gc.md](./02-gc.md)
