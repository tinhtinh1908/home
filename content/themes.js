/*
 * DANH SÁCH THEME
 * Muốn thêm theme: sao chép nguyên một khối { ... }.
 */
window.CONTENT_THEMES = [
  {
    name: "Light Blue",
    support: "HyperOS 3",
    mode: "Chế độ tối",
    version: "1.3.1",
    art: "blue",
    mark: "L",

    thumbnail: "assets/lightblue.webp",
    thumbnailPosition: "center",

    buttonAction: "themeApp",
    download: false,
    downloadUrl: "",

    /* Chỉ điền ID nằm sau https://zhuti.xiaomi.com/detail/ */
    themeAppId: "6213ce34-d0f1-4a31-9825-50c6d12bf0c3",

    previewImages: [
      "assets/blue.webp",
    ]
  },

  {
    name: "Pink Galaxy",
    support: "HyperOS 3",
    mode: "Chế độ sáng",
    version: "1.2",
    art: "pink",
    mark: "P",

    thumbnail: "assets/pinkgalaxy.webp",
    thumbnailPosition: "center",

    buttonAction: "themeApp",
    download: false,
    downloadUrl: "",

    /* Chỉ điền ID nằm sau https://zhuti.xiaomi.com/detail/ */
    themeAppId: "57c07750-d8d1-4e68-8477-42090247d1bc",

    previewImages: [
      "assets/pink.webp"
    ]
  },

   {
    name: "Âm lịch Việt Nam",
    support: "Tất cả thiết bị ",
    mode: "",
    version: "2.1.0",

    thumbnail: "assets/lich.webp",
    thumbnailPosition: "center",

    buttonAction: "download",
    download: true,
    downloadUrl: "https://github.com/tinhtinh1908/Amlich/releases/latest/download/Amlich.apk",

    /* Chỉ điền ID nằm sau https://zhuti.xiaomi.com/detail/ */
    themeAppId: "",

    previewImages: [
      "lich/1.webp",
      "lich/2.webp",
      "lich/3.webp",
      "lich/4.webp",
      "lich/5.webp",
      "lich/6.webp",
    ]
  }
];
