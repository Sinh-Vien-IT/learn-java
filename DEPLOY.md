# 🚀 Hướng Dẫn Đẩy Lên GitHub Pages (3 Bước)

Bộ giáo trình đã được thiết kế sẵn dưới dạng **Single Page Application (SPA) Web Portal** hiện đại, tự động đọc và render Markdown sắc nét, có hỗ trợ Tìm kiếm (Search), Syntax Highlighting, Dark/Light Mode và Responsive cho Mobile.

---

## 📌 3 Bước Đẩy Lên GitHub Pages

### Bước 1: Khởi tạo Git Repository và Commit
Mở Terminal tại thư mục `learn_java` và chạy các lệnh sau:

```bash
# 1. Khởi tạo git repository (nếu chưa có)
git init

# 2. Add toàn bộ các file bài học và source code website
git add .

# 3. Commit
git commit -m "Feat: Complete Senior Java & Tech Lead Interview Bootcamp Web Portal"
```

### Bước 2: Tạo Repository trên GitHub và Push Code
1. Truy cập [GitHub Create New Repo](https://github.com/new).
2. Tạo 1 repository mới (Ví dụ tên repo: `learn_java` hoặc `senior-java-interview-bootcamp`).
3. Chạy lệnh push code lên GitHub:

```bash
git branch -M main
git remote add origin https://github.com/username-cua-ban/learn_java.git
git push -u origin main
```

---

### Bước 3: Bật GitHub Pages trong 10 Giây!
1. Truy cập vào Repository trên GitHub: `https://github.com/username-cua-ban/learn_java`.
2. Chọn **Settings** (Bánh răng trên cùng) $\rightarrow$ Tìm mục **Pages** ở menu bên trái.
3. Tại phần **Build and deployment**:
   * **Source**: Chọn `Deploy from a branch`.
   * **Branch**: Chọn `main` / `root (/)`.
4. Bấm **Save**.

🎉 **XONG!** Sau khoảng 30-60 giây, trang web của bạn sẽ xuất hiện tại đường dẫn:
`https://username-cua-ban.github.io/learn_java/`

---

## 🌟 Các Tính Năng Web Portal Ôn Luyện Bổ Sung:
* 🌙 **Dark / Light Mode:** Chuyển đổi giao diện sáng tối mắt dịu bằng nút toggle góc phải.
* 🔍 **Instant Search Bar:** Tìm kiếm ngay lập tức mọi bài học, keyword, module từ thanh tìm kiếm.
* 📱 **Mobile Friendly:** Giao diện co giãn thông minh, học mượt mà trên iPhone/Android/iPad.
* 🎨 **Syntax Highlighting & Formatting:** Code Java 17/21, SQL, Shell, YAML được tô màu đẹp mắt với Prism.js.
