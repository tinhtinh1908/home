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
    themeAppId: "",

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
    themeAppId: "",

    previewImages: [
      "assets/pink.webp"
    ]
  }
];
