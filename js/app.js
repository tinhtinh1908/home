import content from './content.js?v=__BUILD__';
const root = document.documentElement;
const ui = content.ui || {};
const pages = [...document.querySelectorAll('[data-page]')];
const navButtons = [...document.querySelectorAll('[data-tab]')];
pages.forEach((page) => {
  const pageContent = ui.pages?.[page.dataset.page];
  if (!pageContent) return;
  page.querySelector('.eyebrow').textContent = pageContent.eyebrow;
  page.querySelector('h1').textContent = pageContent.title;
  page.querySelector('.page-subtitle').textContent = pageContent.subtitle;
  const navLabel = document.querySelector(`[data-tab="${page.dataset.page}"] small`);
  if (navLabel) {
    navLabel.textContent = pageContent.nav;
    navLabel.parentElement.setAttribute('aria-label', pageContent.nav);
  }
});
document.querySelector('#latest-themes').textContent = ui.latestTitle || 'Mới phát hành';
document.querySelector('.live-dot').lastChild.textContent = ui.latestBadge || 'Mới nhất';
pages.forEach((page) => {
  const footer = document.createElement('p');
  footer.className = 'site-copyright';
  footer.textContent = content.footer;
  page.append(footer);
});

document.querySelector('.bottom-nav').addEventListener('click', (event) => {
  const button = event.target.closest('[data-tab]');
  if (!button) return;
  navButtons.forEach((item) => {
    const selected = item === button;
    item.classList.toggle('is-selected', selected);
    item.setAttribute('aria-pressed', String(selected));
  });
  pages.forEach((page) => {
    const active = page.dataset.page === button.dataset.tab;
    page.hidden = !active;
    page.classList.toggle('is-active', active);
  });
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

const themeButton = document.querySelector('#themeButton');
let themeTransitionTimer;

function updateThemeButton() {
  const dark = root.dataset.theme === 'dark';
  themeButton.dataset.mode = dark ? 'dark' : 'light';
  themeButton.setAttribute('aria-label', `Chuyển sang chế độ ${dark ? 'sáng' : 'tối'}`);
  themeButton.title = `Chế độ ${dark ? 'sáng' : 'tối'}`;
}
themeButton.addEventListener('click', () => {
  root.classList.add('theme-changing');
  root.dataset.theme = root.dataset.theme === 'dark' ? 'light' : 'dark';
  try { localStorage.setItem('dtinh-theme', root.dataset.theme); } catch {}
  updateThemeButton();
  clearTimeout(themeTransitionTimer);
  themeTransitionTimer = setTimeout(() => root.classList.remove('theme-changing'), 420);
});
updateThemeButton();

// Khởi tạo điều hướng trước; lỗi ở một mục không khóa toàn bộ giao diện.
const sections = [
  './themes.js?v=__BUILD__',
  './updates.js?v=__BUILD__',
  './faq.js?v=__BUILD__',
  './donate.js?v=__BUILD__',
  './preview.js?v=__BUILD__',
  './notifications.js?v=__BUILD__'
];
Promise.allSettled(sections.map((path) => import(path))).then((results) => {
  results.forEach((result, index) => {
    if (result.status === 'rejected') console.error(`Không khởi tạo được ${sections[index]}:`, result.reason);
  });
});
