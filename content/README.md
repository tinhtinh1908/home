# Chỉnh nội dung web

| File | Nội dung cần sửa |
| --- | --- |
| `themes.js` | Thẻ chủ đề, ứng dụng, link tải và ảnh xem trước |
| `update.js` | Lịch sử cập nhật, bản mới đặt ở đầu |
| `faq.js` | Câu hỏi, hướng dẫn và video |
| `links.js` | TikTok, Zalo, email liên hệ |
| `donate.js` | Tài khoản nhận ủng hộ và bảng Google Sheets |
| `pages.js` | Tiêu đề trang và tên nút điều hướng |
| `site.js` | Chữ dùng chung và dòng bản quyền |

## Cách sửa

- Giữ tên trường ở bên trái dấu `:`, sửa giá trị ở bên phải.
- Chữ và đường dẫn đặt trong dấu `"..."`. Nếu nội dung có dấu ngoặc kép, viết `\"`.
- Mỗi mục trong danh sách nằm trong một cặp `{ ... }`; các mục cách nhau bằng dấu phẩy. Sao chép một mục cùng loại để thêm nội dung.
- Thứ tự các mục trong file cũng là thứ tự hiển thị trên web.
- `themeCode` và `downloadCode` là Base64: giữ định dạng này khi thay link/mã.
- Với cập nhật có một nội dung, sửa trực tiếp `title`, `description`, `color`. `title` và `color` có thể bỏ; `color: "red"` hiển thị chấm đỏ.
- Nếu một bản có nhiều nội dung, dùng `changes: [{ title: "...", description: "..." }, { description: "..." }]` thay cho các trường nội dung trực tiếp.
- Chỉ đặt `latest: true` ở bản muốn đánh dấu mới nhất.
- Thông báo chung trong `update.js` có thể chỉ có `date` và `description`, không bắt buộc có `name`, `version` hay `thumbnail`.

Các file này chỉ chứa dữ liệu. Phần ghép dữ liệu cho giao diện nằm ở `js/content.js`.
