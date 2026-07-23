// Tạo link tải từ bất kỳ GitHub Release nào.
// Mỗi mục có thể dùng owner, repo và tag khác nhau.
const githubReleaseUrl = (owner, repo, tag, assetName) => {
  const values = [owner, repo, tag, assetName];

  if (values.some((value) => !String(value || "").trim())) {
    console.warn("Thiếu thông tin GitHub Release:", {
      owner,
      repo,
      tag,
      assetName
    });
    return "";
  }

  return `https://github.com/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/releases/download/${encodeURIComponent(tag)}/${encodeURIComponent(assetName)}`;
};

// Chỉ cần sửa nội dung trong file này rồi lưu lại.
window.PROFILE = {
  name: "DTINH",
  initials: "DT",
  handle: "@tinhtinh1908",
  bio:"Ghi nguồn khi sử dụng tài nguyên của tôi",
  avatar: "avt.jpeg",
  socials: [
    //{ label: "Facebook", icon: "facebook", url: "" },
    { label: "TikTok", icon: "tiktok", url: "https://www.tiktok.com/@dtinh12" },
    { label: "Telegram", icon: "telegram", url: "https://t.me/tinhtinh122333" },
    { label: "Github", icon: "github", url: "https://github.com/tinhtinh1908" },
    { label: "Zalo", icon: "zalo", url: "https://zalo.me/g/ngmiprot9untroxqusd8" },
  ],
  links: [
    {
      id: "theme-hyperos-dark",
      title: "Theme Việt hóa (dark)",
      subtitle: "Update 23/07/2026",
      icon: "theme",
      url: githubReleaseUrl(
        "tinhtinh1908",
        "Theme-Hyper-OS-3-viethoa",
        "download",
        "DarkBlue.mtz"
      ),
      download: true,
      previewFolder: "themedark",
    },
    {
      id: "theme-hyperos-light",
      title: "Theme Việt hóa (light)",
      subtitle: "Update 23/07/2026",
      icon: "theme",
      url: githubReleaseUrl(
        "tinhtinh1908",
        "Theme-Hyper-OS-3-viethoa",
        "download",
        "LightBlue.mtz"
      ),
      download: true,
      previewFolder: "themelight",
    },
    {
      id: "font-backup-vietnamese",
      title: "File backup phông chữ tiếng Việt",
      subtitle: "Update 22/07/2026",
      icon: "theme",
      url: githubReleaseUrl(
        "tinhtinh1908",
        "home",
        "download",
        "backupfont.zip"
      ),
      download: true,
      previewFolder: "phongchu",
    },
    {
      id: "am-lich",
      title: "App Âm Lịch Việt Nam",
      subtitle: "Update 22/07/2026",
      icon: "lich",
      url: githubReleaseUrl(
        "tinhtinh1908",
        "Am-lich-Viet-Nam",
        "download",
        "Lich_Viet_opensrc.apk"
      ),
      download: true,
      previewFolder: "lichpr",
    },
  ],
  footer: "Copyright © 2026 DTINH. All rights reserved."
};
