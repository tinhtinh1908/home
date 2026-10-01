// Tải độc lập để một file lỗi không làm mất tất cả các trang.
const sources = [
  ['../content/site.js?v=__BUILD__', {}],
  ['../content/pages.js?v=__BUILD__', {}],
  ['../content/themes.js?v=__BUILD__', []],
  ['../content/update.js?v=__BUILD__', []],
  ['../content/faq.js?v=__BUILD__', []],
  ['../content/donate.js?v=__BUILD__', {}],
  ['../content/links.js?v=__BUILD__', []]
];
const [site, pages, themeData, updateData, faqData, donate, linkData] = await Promise.all(
  sources.map(async ([path, fallback]) => {
    try { return (await import(path)).default ?? fallback; }
    catch (error) {
      console.error(`Không tải được ${path}:`, error);
      return fallback;
    }
  })
);
const records = (value) => (Array.isArray(value) ? value : [value])
  .filter((item) => item && typeof item === 'object' && !Array.isArray(item));
const themes = records(themeData);
const update = records(updateData);
const faq = records(faqData);
const more = records(linkData);
// Ghép dữ liệu phẳng trong content thành cấu trúc mà giao diện đang dùng.
const { footer, ...labels } = site;
const releases = update.map(({ title, description, color, ...release }) => ({
  ...release,
  changes: records(release.changes ?? [{ title, description, color }])
}));

export default { footer, ui: { ...labels, pages }, themes, update: releases, faq, donate, more };
