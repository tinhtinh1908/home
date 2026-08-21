/*
 * DANH SÁCH PHIÊN BẢN
 * Muốn thêm phiên bản: sao chép nguyên một khối { ... }.
 * name là tên theme/app của bản cập nhật để phân biệt khi có nhiều theme.
 */
window.CONTENT_UPDATE = [
  {
    name: "Light Blue",
    version: "1.3.1",
    date: "20 tháng 8, 2026",
    latest: true,

    thumbnail: "assets/lightblue.webp",
    thumbnailPosition: "center",

    changes: [
      {
        color: "blue",
        title: "Fix lỗi",
        description: "Sửa lỗi hiển thị Light Blue V1.3, bổ sung thêm ngày giờ ở màn hình khóa."
      }
    ]
  }
];
