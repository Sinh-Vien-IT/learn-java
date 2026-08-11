/**
 * Senior Java & Tech Lead Bootcamp App Logic
 * Single Page App (SPA) Router, Markdown Fetcher, Search, Progress Tracker
 */

const CURRICULUM_MANIFEST = [
  {
    group: "Phase 0 — Setup & Orientation",
    items: [
      { title: "Mục Lục & Tổng Quan", path: "README.md", priority: "🔴" },
      { title: "Lộ Trình Học Chi Tiết", path: "ROADMAP.md", priority: "🔴" },
      { title: "Spaced Repetition Tracker", path: "REVISION_TRACKER.md", priority: "🔴" }
    ]
  },
  {
    group: "Phase 1 — Core Foundation & Concurrency",
    items: [
      { title: "Module 00: Interview Fundamentals", path: "00-interview-fundamentals/README.md", priority: "🔴" },
      { title: "Module 01: OOP & Clean Code", path: "01-java-core/01-oop.md", priority: "🔴" },
      { title: "Module 01: Java Language Deep Dive", path: "01-java-core/02-java-language.md", priority: "🔴" },
      { title: "Module 01: Collections & HashMap Internals", path: "01-java-core/03-collections.md", priority: "🔴" },
      { title: "Module 02: Thread & ThreadPool Sizing", path: "02-concurrency/01-thread-fundamentals.md", priority: "🔴" },
      { title: "Module 02: Synchronization & Atomic", path: "02-concurrency/02-synchronization.md", priority: "🔴" },
      { title: "Module 02: JMM, Happens-Before & CF", path: "02-concurrency/03-java-memory-model.md", priority: "🔴" },
      { title: "Module 03: JVM Architecture", path: "03-jvm/01-architecture.md", priority: "🔴" },
      { title: "Module 03: GC Algorithms & Tuning", path: "03-jvm/02-gc.md", priority: "🔴" },
      { title: "Module 03: Production Troubleshooting", path: "03-jvm/03-troubleshooting.md", priority: "🔴" },
      { title: "Module 04: Modern Java (8 -> 21)", path: "04-modern-java/README.md", priority: "🟠" }
    ]
  },
  {
    group: "Phase 2 — Spring & Data Architecture",
    items: [
      { title: "Module 05: Spring Core & AOP Proxy", path: "05-spring-core/README.md", priority: "🔴" },
      { title: "Module 06: Spring Boot & REST API", path: "06-spring-boot/README.md", priority: "🔴" },
      { title: "Module 07: Transaction & Outbox Pattern", path: "07-transaction/README.md", priority: "🔴" },
      { title: "Module 08: SQL Mastery & Window Functions", path: "08-database-sql/01-sql-mastery.md", priority: "🔴" },
      { title: "Module 08: B-Tree Index & Debug 20s->10ms", path: "08-database-sql/02-index-performance.md", priority: "🔴" },
      { title: "Module 09: DB Design, Sharding & Selection", path: "09-database-design/README.md", priority: "🔴" },
      { title: "Module 10: Redis & 3 Caching Disasters", path: "10-redis-cache/README.md", priority: "🟠" }
    ]
  },
  {
    group: "Phase 3 — Distributed Systems & Architecture",
    items: [
      { title: "Module 11: Kafka Architecture Internals", path: "11-kafka/01-fundamentals.md", priority: "🔴" },
      { title: "Module 11: Kafka Delivery Semantics & EOS", path: "11-kafka/02-delivery-semantics.md", priority: "🔴" },
      { title: "Module 11: Kafka Production & Lag Fix", path: "11-kafka/03-production.md", priority: "🔴" },
      { title: "Module 12: Event-Driven Architecture", path: "12-event-driven/README.md", priority: "🔴" },
      { title: "Module 13: Microservices & Resilience4j", path: "13-microservices/README.md", priority: "🔴" },
      { title: "Module 14: Distributed Systems Theory", path: "14-distributed-system/README.md", priority: "🔴" },
      { title: "Module 15: System Design 13-Step Framework", path: "15-system-design/README.md", priority: "🔴" },
      { title: "Module 15: Real-time CDC Data Pipeline", path: "15-system-design/15-data-pipeline.md", priority: "🔴" }
    ]
  },
  {
    group: "Phase 4 & 5 — Operations & Final Packs",
    items: [
      { title: "Module 16: Performance Engineering", path: "16-performance/README.md", priority: "🔴" },
      { title: "Module 17: Kubernetes & Docker Troubleshooting", path: "17-kubernetes-docker/README.md", priority: "🟠" },
      { title: "Module 24: Tech Lead Mindset & Negotiations", path: "24-tech-lead/README.md", priority: "🔴" },
      { title: "Module 25: Behavioral Interview (STAR)", path: "25-behavioral/README.md", priority: "🔴" },
      { title: "Module 30: Interview Trap Questions", path: "30-final-interview-pack/trap-questions.md", priority: "🔴" },
      { title: "Module 30: 20 Production Incidents Playbook", path: "30-final-interview-pack/production-incidents.md", priority: "🔴" },
      { title: "Module 30: Mock Interview Scorecard", path: "30-final-interview-pack/scorecard.md", priority: "🔴" }
    ]
  }
];

class App {
  constructor() {
    this.currentPath = "README.md";
    this.sidebarEl = document.getElementById("sidebar");
    this.contentEl = document.getElementById("content");
    this.searchOverlay = document.getElementById("searchResults");
    
    this.initTheme();
    this.renderSidebar();
    this.bindEvents();
    this.handleRoute();
  }

  initTheme() {
    const savedTheme = localStorage.getItem("bootcamp_theme") || "dark";
    document.documentElement.setAttribute("data-theme", savedTheme);
  }

  toggleTheme() {
    const current = document.documentElement.getAttribute("data-theme");
    const next = current === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem("bootcamp_theme", next);
  }

  renderSidebar() {
    let html = "";
    CURRICULUM_MANIFEST.forEach(group => {
      html += `<div class="sidebar-group">
        <div class="sidebar-title">${group.group}</div>
        <ul class="sidebar-menu">`;
      group.items.forEach(item => {
        html += `<li class="sidebar-item">
          <a href="#${item.path}" class="sidebar-link" data-path="${item.path}">
            <span class="priority-icon">${item.priority}</span>
            <span>${item.title}</span>
          </a>
        </li>`;
      });
      html += `</ul></div>`;
    });
    this.sidebarEl.innerHTML = html;
  }

  bindEvents() {
    window.addEventListener("hashchange", () => this.handleRoute());
    
    document.getElementById("themeToggle").addEventListener("click", () => this.toggleTheme());
    document.getElementById("mobileToggle").addEventListener("click", () => {
      this.sidebarEl.classList.toggle("open");
    });

    const searchInput = document.getElementById("searchInput");
    searchInput.addEventListener("input", (e) => this.handleSearch(e.target.value));
    
    document.addEventListener("click", (e) => {
      if (!this.searchOverlay.contains(e.target) && e.target !== searchInput) {
        this.searchOverlay.style.display = "none";
      }
    });
  }

  async handleRoute() {
    const hash = window.location.hash.substring(1);
    this.currentPath = hash || "README.md";

    // Update active link in sidebar
    document.querySelectorAll(".sidebar-link").forEach(link => {
      if (link.getAttribute("data-path") === this.currentPath) {
        link.classList.add("active");
      } else {
        link.classList.remove("active");
      }
    });

    // Close mobile sidebar if open
    this.sidebarEl.classList.remove("open");

    await this.loadMarkdown(this.currentPath);
  }

  async loadMarkdown(path) {
    this.contentEl.innerHTML = `<div style="text-align:center; padding: 4rem; color: var(--text-muted);">
      <i class="fas fa-spinner fa-spin fa-2x"></i>
      <p style="margin-top: 1rem;">Đang tải bài học...</p>
    </div>`;

    try {
      const res = await fetch(`./${path}`);
      if (!res.ok) throw new Error("Could not fetch file");
      let text = await res.text();

      // Configure marked
      marked.setOptions({
        highlight: function(code, lang) {
          if (Prism.languages[lang]) {
            return Prism.highlight(code, Prism.languages[lang], lang);
          }
          return code;
        }
      });

      let parsedHtml = marked.parse(text);
      this.contentEl.innerHTML = `<div class="markdown-body">${parsedHtml}</div>` + this.renderNavigationButtons();
      
      // Post-processing
      if (window.Prism) Prism.highlightAll();
      window.scrollTo(0, 0);

      this.bindBottomNav();
    } catch (err) {
      this.contentEl.innerHTML = `<div style="text-align:center; padding: 4rem; color: var(--accent-red);">
        <h2>⚠️ Không thể tải nội dung</h2>
        <p style="margin-top: 0.5rem; color: var(--text-secondary);">Vui lòng kiểm tra lại đường dẫn file hoặc chạy qua local HTTP server.</p>
      </div>`;
    }
  }

  renderNavigationButtons() {
    let allItems = [];
    CURRICULUM_MANIFEST.forEach(g => allItems.push(...g.items));
    
    const currentIndex = allItems.findIndex(i => i.path === this.currentPath);
    const prev = allItems[currentIndex - 1];
    const next = allItems[currentIndex + 1];

    return `
      <div class="bottom-nav">
        ${prev ? `<a href="#${prev.path}" class="btn-nav"><i class="fas fa-arrow-left"></i> ${prev.title}</a>` : `<div></div>`}
        ${next ? `<a href="#${next.path}" class="btn-nav">${next.title} <i class="fas fa-arrow-right"></i></a>` : `<div></div>`}
      </div>
    `;
  }

  bindBottomNav() {
    // Smooth navigation bindings if needed
  }

  handleSearch(query) {
    if (!query.trim()) {
      this.searchOverlay.style.display = "none";
      return;
    }

    const q = query.toLowerCase();
    let results = [];

    CURRICULUM_MANIFEST.forEach(group => {
      group.items.forEach(item => {
        if (item.title.toLowerCase().includes(q) || item.path.toLowerCase().includes(q)) {
          results.push(item);
        }
      });
    });

    if (results.length === 0) {
      this.searchOverlay.innerHTML = `<div style="padding: 1rem; color: var(--text-muted); text-align:center;">Không tìm thấy kết quả</div>`;
    } else {
      let html = "";
      results.forEach(res => {
        html += `<div class="search-result-item" onclick="window.location.hash='${res.path}'; document.getElementById('searchResults').style.display='none';">
          <div class="search-result-title">${res.priority} ${res.title}</div>
          <div class="search-result-path">${res.path}</div>
        </div>`;
      });
      this.searchOverlay.innerHTML = html;
    }

    this.searchOverlay.style.display = "block";
  }
}

document.addEventListener("DOMContentLoaded", () => {
  window.app = new App();
});
