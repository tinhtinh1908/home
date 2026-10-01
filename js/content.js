import site from '../content/site.js?v=__BUILD__';
import pages from '../content/pages.js?v=__BUILD__';
import themes from '../content/themes.js?v=__BUILD__';
import update from '../content/update.js?v=__BUILD__';
import faq from '../content/faq.js?v=__BUILD__';
import donate from '../content/donate.js?v=__BUILD__';
import more from '../content/links.js?v=__BUILD__';
// Ghép dữ liệu phẳng trong content thành cấu trúc mà giao diện đang dùng.
const { footer, ...labels } = site;
const releases = update.map(({ title, description, color, ...release }) => ({
  ...release,
  changes: release.changes || [{ title, description, color }]
}));

export default { footer, ui: { ...labels, pages }, themes, update: releases, faq, donate, more };
