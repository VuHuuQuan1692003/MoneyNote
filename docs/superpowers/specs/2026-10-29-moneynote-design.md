# Đặc tả thiết kế Ứng dụng Quản lý Thu Chi Cá nhân MoneyNote

- **Ngày tạo**: 2026-10-29
- **Trạng thái**: Đã phê duyệt qua Brainstorming
- **Mục tiêu**: Xây dựng ứng dụng web quản lý tài chính cá nhân MoneyNote hoạt động hoàn toàn độc lập, offline (Pure HTML5, CSS3, Vanilla JS & SVG), đáp ứng trọn vẹn 12 yêu cầu chức năng.

---

## 1. Mục tiêu và Phạm vi

Ứng dụng MoneyNote giúp người dùng dễ dàng theo dõi, ghi chép và phân tích dòng tiền cá nhân (thu nhập và chi tiêu) theo tháng, kiểm soát hạn mức chi tiêu, xem biểu đồ tỷ trọng danh mục và xuất báo cáo ra Excel.

### 12 Yêu cầu nghiệp vụ:
1. **Trang chủ & Dashboard**: Hiển thị Tổng thu, Tổng chi, Số dư của tháng hiện tại. Định dạng tiền tệ tiếng Việt (`1.500.000 ₫`).
2. **Thêm giao dịch**: Nhập Số tiền, Danh mục, Ngày, Ghi chú. Validate chặt chẽ: số tiền > 0, ngày hợp lệ, danh mục bắt buộc, chặn nhập dữ liệu sai.
3. **Danh sách giao dịch**: Mới nhất lên đầu. Khoản thu màu xanh lá (`#10B981`, dấu `+`), khoản chi màu đỏ (`#EF4444`, dấu `-`).
4. **Sửa giao dịch**: Bấm vào giao dịch để mở modal sửa thông tin, lưu cập nhật.
5. **Xóa giao dịch**: Hộp thoại modal xác nhận an toàn trước khi xóa (tránh xóa nhầm).
6. **Lưu trữ dữ liệu**: Tự động lưu vào `localStorage`, tải lại hoặc mở lại trình duyệt không mất dữ liệu. Có sẵn dữ liệu mẫu ban đầu.
7. **Bộ lọc & Tìm kiếm**: Lọc theo tháng/năm, danh mục, loại thu/chi. Tìm kiếm tức thì theo nội dung ghi chú.
8. **Hạn mức chi tiêu (Budget)**: Thiết lập hạn mức chi cho tháng. Hiển thị thanh tiến độ %, đổi màu theo ngưỡng cảnh báo (<80% xanh, 80-100% cam, >100% đỏ cảnh báo vượt hạn mức).
9. **Biểu đồ tỷ trọng chi tiêu (Donut Chart)**: Biểu đồ Donut SVG thuần túy (không dùng thư viện ngoài), tính % chi tiêu theo danh mục, tooltip hover và bảng chú thích tỉ mỉ.
10. **Tối ưu Mobile**: Giao diện responsive 100%, nút bấm cảm ứng lớn, Floating Action Button (FAB) trên điện thoại, modal dạng bottom sheet.
11. **Giao diện Sáng / Tối (Dark/Light mode)**: Nút chuyển đổi tức thì, tự lưu tùy chọn theme vào `localStorage`.
12. **Xuất file Excel**: Tải danh sách giao dịch dưới dạng file CSV chuẩn UTF-8 BOM (`\uFEFF`) để mở trực tiếp trên Excel không bị lỗi font tiếng Việt.

---

## 2. Kiến trúc & Cấu trúc Mã nguồn

Ứng dụng tuân thủ phương án 3 file tách biệt, chạy trực tiếp trên trình duyệt (double-click mở file HTML):

```text
BT-DEMO-2/
├── index.html       # Cấu trúc HTML5 ngữ nghĩa, modal, layout dashboard, filters, list
├── style.css        # Hệ thống CSS Variables (Light/Dark), Flex/Grid, Mobile Responsive, Animation
├── app.js           # Logic trung tâm: State, Storage, Form Validation, Donut SVG Render, Export CSV
└── docs/
    └── superpowers/
        └── specs/
            └── 2026-10-29-moneynote-design.md
```

---

## 3. Cấu trúc Dữ liệu & Lưu trữ (Storage)

### 3.1. Đối tượng Giao dịch (`Transaction`)
```javascript
{
  id: "tx_1730190000000_abc123", // String ID duy nhất
  type: "expense" | "income",     // Loại: Chi tiêu hoặc Thu nhập
  amount: 150000,                 // Number > 0
  category: "Ăn uống",            // Tên danh mục
  date: "2026-10-29",             // YYYY-MM-DD
  note: "Ăn trưa bún bò",         // Ghi chú chi tiết
  createdAt: 1730190000000        // Timestamp miligiây để sắp xếp
}
```

### 3.2. Cấu trúc Danh mục (Categories)
- **Chi tiêu (`expense`)**:
  - 🍜 Ăn uống
  - 🛒 Mua sắm
  - 🚗 Di chuyển
  - 💡 Hóa đơn & Tiện ích
  - 🏠 Nhà cửa
  - 🎬 Giải trí
  - 💊 Sức khỏe
  - 📚 Giáo dục
  - 📦 Chi tiêu khác
- **Thu nhập (`income`)**:
  - 💰 Tiền lương
  - 🎁 Thưởng & Làm thêm
  - 📈 Đầu tư & Tiết kiệm
  - 💵 Thu nhập khác

### 3.3. Trạng thái ứng dụng (`State`)
- `transactions`: Mảng chứa các giao dịch.
- `budgets`: Object lưu hạn mức theo tháng `{ "2026-10": 10000000 }` hoặc mặc định.
- `filters`: `{ month: "2026-10", type: "all", category: "all", search: "" }`.
- `editingId`: ID của giao dịch đang sửa (null nếu thêm mới).
- `theme`: `"light"` | `"dark"`.

### 3.4. Khóa Lưu Trữ LocalStorage
- `moneynote_transactions`: Chuỗi JSON danh sách giao dịch.
- `moneynote_budget`: Hạn mức chi tiêu.
- `moneynote_theme`: `"light"` hoặc `"dark"`.

---

## 4. Thiết kế Chi tiết các Mô-đun

### 4.1. Dashboard & Thống kê Tài chính
- Lấy danh sách giao dịch của tháng được chọn trong bộ lọc.
- Tính:
  - `totalIncome = sum(amount)` với `type === "income"`.
  - `totalExpense = sum(amount)` với `type === "expense"`.
  - `balance = totalIncome - totalExpense`.
- Định dạng hiển thị: `new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val)`.

### 4.2. Thanh Hạn Mức Chi Tiêu (Monthly Budget Bar)
- Tỷ lệ chi tiêu: `percent = (totalExpense / budget) * 100`.
- Màu sắc thanh tiến độ:
  - `percent < 80%`: Xanh ngọc (#10B981).
  - `80% <= percent <= 100%`: Cam cảnh báo (#F59E0B).
  - `percent > 100%`: Đỏ nguy hiểm (#EF4444).
- Thông báo cảnh báo xuất hiện khi `percent > 100%` với số tiền vượt mức cụ thể.

### 4.3. Form Thêm / Sửa Giao Dịch & Validation
- **Kiểm tra hợp lệ (Strict Validation)**:
  - `amount`: Phải là số dương > 0. Hiển thị định dạng tiền thời gian thực dưới ô nhập khi người dùng gõ.
  - `category`: Bắt buộc chọn từ danh sách dropdown.
  - `date`: Bắt buộc có giá trị, định dạng ngày hợp lệ.
  - `note`: Tự động cắt khoảng trắng; nếu rỗng tự điền tên danh mục.
- Nếu không hợp lệ: Hiển thị viền đỏ và text lỗi, chặn submit.
- Khi sửa: Điền sẵn toàn bộ dữ liệu vào form, đổi tiêu đề thành "Cập nhật giao dịch".

### 4.4. Modal Xác Nhận Xóa
- Thiết kế custom dialog đẹp mắt, hiển thị tên danh mục, ghi chú và số tiền của giao dịch muốn xóa.
- Nút "Hủy bỏ" và "Xác nhận xóa" màu đỏ.

### 4.5. Biểu Đồ Donut SVG Thuần
- Lọc các khoản chi tiêu (`type === 'expense'`) trong tháng đang chọn.
- Nhóm theo danh mục và tính tổng chi cùng phần trăm.
- Vẽ vòng Donut SVG dùng `<circle>` với `stroke-dasharray` hoặc các cung `path`:
  - Tâm `(cx, cy) = (100, 100)`, bán kính `r = 70`, bề dày nét `stroke-width = 30`.
  - Giữa vòng hiển thị tổng chi tiêu.
  - Hover hiệu ứng phóng to nhẹ và hiển thị Tooltip (Tên danh mục, Số tiền, %).
  - Kèm Legend (Bảng chú giải) hiển thị màu sắc, tên danh mục, số tiền và % giảm dần.

### 4.6. Bộ Lọc & Tìm Kiếm
- Sự kiện `input` ô tìm kiếm có debounce 200ms.
- Lọc kết hợp: Tháng + Loại (Thu/Chi/Tất cả) + Danh mục + Ghi chú.
- Danh sách kết quả được render lại tức thì, sắp xếp giảm dần theo ngày và thời gian tạo.

### 4.7. Chuyển Đổi Dark / Light Mode
- Thêm thuộc tính `data-theme="dark"` trên thẻ `<html>` hoặc `<body>`.
- Định nghĩa toàn bộ biến màu trong `:root` và `[data-theme="dark"]`.
- Lưu trạng thái vào `localStorage` và tự động áp dụng ngay khi load trang.

### 4.8. Xuất Dữ Liệu Excel (CSV UTF-8 BOM)
- Tạo chuỗi CSV có tiền tố `\uFEFF`.
- Cột: STT, Ngày, Loại giao dịch, Danh mục, Ghi chú, Số tiền (VNĐ).
- Escape các ký tự đặc biệt (`"`, dấu phẩy, ngắt dòng).
- Kích hoạt tải về tự động qua thẻ `<a download="...">` và `Blob([content], { type: 'text/csv;charset=utf-8;' })`.

---

## 5. Kế hoạch Kiểm Thử & Nghiệm Thu
1. Kiểm thử tạo mới khoản thu / khoản chi với các giá trị biên (0, số âm, ký tự lạ).
2. Kiểm thử sửa và xóa giao dịch kèm xác nhận.
3. Kiểm thử reload trình duyệt, kiểm tra dữ liệu còn nguyên vẹn trong `localStorage`.
4. Kiểm thử các bộ lọc theo tháng, loại, danh mục và tìm kiếm ghi chú.
5. Kiểm thử đặt hạn mức và kích hoạt cảnh báo vượt hạn mức (>100%).
6. Kiểm thử biểu đồ Donut SVG tính đúng % và hiển thị tooltip.
7. Kiểm thử giao diện trên màn hình mobile (375px, 414px) và desktop.
8. Kiểm thử nút chuyển Dark/Light mode.
9. Tải file CSV mở trên Excel kiểm tra font tiếng Việt hiển thị chuẩn xác.

