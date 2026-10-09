const root = document.documentElement;
const pages = [...document.querySelectorAll('[data-page]')];
const navButtons = [...document.querySelectorAll('[data-tab]')];
function applyContent(content) {
  const ui = content.ui || {};
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
}

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
  loadSection(button.dataset.tab);
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

import('./content.js?v=__BUILD__').then(({ default: content }) => applyContent(content))
  .catch((error) => console.error('Không tải được chữ giao diện:', error));

// Only initialize a section when it is visible. Cache concurrent clicks and
// allow a failed import to be retried without breaking navigation.
const sectionPaths = {
  themes: './themes.js?v=__BUILD__',
  updates: './updates.js?v=__BUILD__',
  faq: './faq.js?v=__BUILD__',
  donate: './donate.js?v=__BUILD__'
};
const sectionRequests = new Map();
function loadSection(name) {
  const path = sectionPaths[name];
  if (!path) return Promise.resolve();
  if (!sectionRequests.has(name)) {
    const request = import(path).catch((error) => {
      sectionRequests.delete(name);
      console.error(`Không khởi tạo được ${path}:`, error);
    });
    sectionRequests.set(name, request);
  }
  return sectionRequests.get(name);
}
loadSection('themes');
// Native messages must work before the donation tab is visited.
import('./notifications.js?v=__BUILD__').catch((error) => console.error(error));

let previewRequest;
function loadPreview() {
  if (!previewRequest) {
    previewRequest = new Promise((resolve, reject) => {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'preview.css?v=__BUILD__';
      link.onload = resolve;
      link.onerror = () => {
        link.remove();
        reject(new Error('Không tải được giao diện xem ảnh'));
      };
      document.head.append(link);
    }).then(() => import('./preview.js?v=__BUILD__')).catch((error) => {
      previewRequest = undefined;
      throw error;
    });
  }
  return previewRequest;
}
let previewClick = 0;
document.addEventListener('click', async (event) => {
  const button = event.target.closest('[data-preview-theme]');
  if (!button) return;
  event.preventDefault();
  const click = ++previewClick;
  try {
    const { openPreview } = await loadPreview();
    // A later click or tab switch should not open an outdated selection.
    if (click === previewClick && !button.closest('[data-page]')?.hidden) {
      openPreview(Number(button.dataset.previewTheme));
    }
  } catch (error) {
    console.error('Không mở được ảnh xem trước:', error);
  }
});
