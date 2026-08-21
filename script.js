const root = document.documentElement;
const content = window.WEB_CONTENT;
const ui = content.ui || {};
const pages = [...document.querySelectorAll('[data-page]')];
const navButtons = [...document.querySelectorAll('[data-tab]')];
const releaseRequests = new Map();
const countFormatter = new Intl.NumberFormat('vi-VN');
const releaseCacheTime = 30 * 60 * 1000;

// Đổ toàn bộ tiêu đề và nhãn từ content.js để HTML chỉ giữ vai trò khung.
pages.forEach((page) => {
  const pageContent = ui.pages?.[page.dataset.page];
  if (!pageContent) return;
  page.querySelector('.eyebrow').textContent = pageContent.eyebrow;
  page.querySelector('h1').textContent = pageContent.title;
  page.querySelector('.page-subtitle').textContent = pageContent.subtitle;
  const navLabel = document.querySelector(`[data-tab="${page.dataset.page}"] small`);
  if (navLabel) navLabel.textContent = pageContent.nav;
});
document.querySelector('#latest-themes').textContent = ui.latestTitle || 'Mới phát hành';
document.querySelector('.live-dot').lastChild.textContent = ui.latestBadge || 'Mới nhất';

function getThemeButtonAction(theme) {
  return theme.buttonAction === 'themeApp' ? 'themeApp' : 'download';
}

function getThemeAppUrl(theme) {
  const themeId = String(theme.themeAppId || '').trim();
  return themeId ? `theme://zhuti.xiaomi.com/detail/${encodeURIComponent(themeId)}` : '';
}

function renderThemeButton(theme) {
  const action = getThemeButtonAction(theme);

  if (action === 'themeApp') {
    const url = getThemeAppUrl(theme);
    return url
      ? `<a class="download-button" href="${url}" rel="noreferrer" aria-label="Mở ${theme.name} trong ứng dụng Chủ đề">${ui.openThemeApp || 'Mở Chủ đề'}</a>`
      : '';
  }

  if (theme.download && theme.downloadUrl) {
    return `<a class="download-button" href="${theme.downloadUrl}" target="_blank" rel="noreferrer" aria-label="Tải xuống ${theme.name}">${ui.download || 'Tải về'}</a>`;
  }

  return '';
}

document.querySelector('#themeList').innerHTML = content.themes.map((theme, themeIndex) => `
  <article class="theme-card">
    <span class="theme-art ${theme.thumbnail ? 'has-thumbnail' : `art-${theme.art}`}" aria-hidden="true">
      ${theme.thumbnail
        ? `<img src="${theme.thumbnail}" alt="" width="96" height="96" loading="${themeIndex === 0 ? 'eager' : 'lazy'}" decoding="async" fetchpriority="${themeIndex === 0 ? 'high' : 'low'}" style="object-position:${theme.thumbnailPosition || 'center'}">`
        : `<i class="orb orb-a"></i><i class="orb orb-b"></i><i class="glass-pill"></i><span class="art-mark">${theme.mark}</span>`}
    </span>
    <span class="theme-info">
      <span class="theme-heading">
        <span class="theme-title">${theme.name}</span>
        <span class="theme-version">v${theme.version}</span>
      </span>
      <span class="meta-row">
        <span class="support"><i></i>${theme.support}</span>
        <span class="theme-mode">${theme.mode}</span>
      </span>
      <span class="theme-links">
        ${theme.previewImages?.length ? `<button class="preview-hint" type="button" data-preview-theme="${themeIndex}">${ui.preview || 'Xem ảnh preview'}</button>` : ''}
        ${getThemeButtonAction(theme) === 'download' && theme.download && theme.downloadUrl ? `<small class="download-count" data-download-url="${theme.downloadUrl}">${ui.loadingDownloads || 'Đang lấy lượt tải...'}</small>` : ''}
      </span>
    </span>
    ${renderThemeButton(theme)}
  </article>
`).join('');

document.querySelectorAll('.theme-art img').forEach((image) => {
  const reveal = () => image.parentElement.classList.add('is-loaded');
  if (image.complete) reveal();
  else image.addEventListener('load', reveal, { once: true });
});

function parseGitHubReleaseUrl(value) {
  try {
    const url = new URL(value);
    if (url.hostname !== 'github.com') return null;
    const tagged = url.pathname.match(/^\/([^/]+)\/([^/]+)\/releases\/download\/([^/]+)\/(.+)$/);
    if (!tagged) return null;
    return {
      owner: decodeURIComponent(tagged[1]),
      repo: decodeURIComponent(tagged[2]),
      tag: decodeURIComponent(tagged[3]),
      assetName: decodeURIComponent(tagged[4])
    };
  } catch { return null; }
}

async function getReleaseData(release) {
  const endpoint = release.tag === 'latest'
  ? `https://api.github.com/repos/${encodeURIComponent(release.owner)}/${encodeURIComponent(release.repo)}/releases/latest`
  : `https://api.github.com/repos/${encodeURIComponent(release.owner)}/${encodeURIComponent(release.repo)}/releases/tags/${encodeURIComponent(release.tag)}`;
  const cacheKey = `github-release:${endpoint}`;
  try {
    const cached = JSON.parse(localStorage.getItem(cacheKey));
    if (cached && Date.now() - cached.savedAt < releaseCacheTime) return cached.data;
  } catch {}
  if (!releaseRequests.has(endpoint)) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    const request = fetch(endpoint, { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error(`GitHub API: ${response.status}`);
        return response.json();
      })
      .finally(() => clearTimeout(timeout));
    releaseRequests.set(endpoint, request);
    request.catch(() => releaseRequests.delete(endpoint));
  }
  const data = await releaseRequests.get(endpoint);
  try { localStorage.setItem(cacheKey, JSON.stringify({ savedAt: Date.now(), data })); } catch {}
  return data;
}

async function loadDownloadCount(counter) {
  if (counter.dataset.loaded) return;
  counter.dataset.loaded = 'true';
  const release = parseGitHubReleaseUrl(counter.dataset.downloadUrl);
  if (!release) { counter.hidden = true; return; }
  try {
    const data = await getReleaseData(release);
    const asset = (data.assets || []).find((item) => item.name === release.assetName);
    if (!asset) throw new Error('Không tìm thấy file Release');
    counter.textContent = `${countFormatter.format(asset.download_count || 0)} ${ui.downloads || 'lượt tải'}`;
  } catch (error) {
    counter.textContent = `— ${ui.downloads || 'lượt tải'}`;
    console.warn(error.message);
  }
}

const counters = document.querySelectorAll('.download-count');
if ('IntersectionObserver' in window) {
  const counterObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      observer.unobserve(entry.target);
      loadDownloadCount(entry.target);
    });
  }, { rootMargin: '160px' });
  counters.forEach((counter) => counterObserver.observe(counter));
} else {
  counters.forEach(loadDownloadCount);
}

const updates = Array.isArray(content.update) ? content.update : [content.update];
const updateList = document.querySelector('#updateList');

updateList.innerHTML = updates.map((release, releaseIndex) => `
  <article class="update-card">
    <div class="update-top">
      <div class="version-icon${release.thumbnail ? ' has-thumbnail' : ''}">
        ${release.thumbnail
          ? `<img src="${release.thumbnail}" alt="" width="96" height="96" loading="lazy" decoding="async" style="object-position:${release.thumbnailPosition || 'center'}">`
          : release.version.split('.')[0]}
      </div>
      <div>
        <span>${releaseIndex === 0 ? ui.currentVersion || 'Phiên bản hiện tại' : 'Phiên bản'}</span>
        <strong>v${release.version}</strong>
      </div>
      ${release.latest ? `<span class="status-chip">${ui.latestStatus || 'Mới nhất'}</span>` : ''}
    </div>
    <div class="divider"></div>
    <div class="change-list">
      ${(release.changes || []).map((change) => `
        <div>
          <span class="change-dot ${change.color}"></span>
          <p><strong>${change.title}</strong><small>${change.description}</small></p>
        </div>
      `).join('')}
    </div>
    <time>${release.date}</time>
  </article>
`).join('');

updateList.querySelectorAll('.version-icon.has-thumbnail img').forEach((image) => {
  const reveal = () => image.parentElement.classList.add('is-loaded');
  if (image.complete) reveal();
  else image.addEventListener('load', reveal, { once: true });
});

const faqItems = Array.isArray(content.faq) ? content.faq : [];
document.querySelector('#faqList').innerHTML = faqItems.map((item, index) => `
  <article class="faq-card">
    <span class="faq-copy"><strong>${item.title}</strong><small>${item.description || ''}</small></span>
    <span class="faq-actions">
      ${item.text?.length ? `<button type="button" class="faq-read" data-faq-read="${index}">${ui.readGuide || 'Đọc hướng dẫn'}</button>` : ''}
      ${item.videoUrl ? `<a class="faq-video" href="${item.videoUrl}" target="_blank" rel="noreferrer">${item.videoLabel || ui.watchVideo || 'Xem video'}</a>` : ''}
    </span>
  </article>
`).join('');

const faqModal = document.createElement('div');
faqModal.className = 'faq-modal';
faqModal.hidden = true;
faqModal.innerHTML = `<button class="faq-backdrop" type="button" aria-label="Đóng"></button><section class="faq-dialog" role="dialog" aria-modal="true" aria-labelledby="faqModalTitle"><header><div><small>HƯỚNG DẪN</small><strong id="faqModalTitle"></strong></div><button class="faq-close" type="button" aria-label="Đóng"><svg aria-hidden="true"><use href="#i-close"/></svg></button></header><div class="faq-document"></div></section>`;
document.body.append(faqModal);
let faqCloseTimer;
function setFaqModal(open, item) {
  clearTimeout(faqCloseTimer);
  if (open) {
    faqModal.querySelector('#faqModalTitle').textContent = item.title;
    const paragraphs = Array.isArray(item.text) ? item.text : [item.text];
    faqModal.querySelector('.faq-document').replaceChildren(...paragraphs.filter(Boolean).map((text) => {
      const paragraph = document.createElement('p');
      paragraph.textContent = text;
      return paragraph;
    }));
    faqModal.hidden = false;
    document.body.classList.add('faq-open');
    requestAnimationFrame(() => faqModal.classList.add('is-open'));
    faqModal.querySelector('.faq-close').focus();
    return;
  }
  faqModal.classList.remove('is-open');
  document.body.classList.remove('faq-open');
  faqCloseTimer = setTimeout(() => { faqModal.hidden = true; }, 200);
}
document.querySelector('#faqList').addEventListener('click', (event) => {
  const button = event.target.closest('[data-faq-read]');
  if (button) setFaqModal(true, faqItems[Number(button.dataset.faqRead)]);
});
faqModal.querySelector('.faq-backdrop').addEventListener('click', () => setFaqModal(false));
faqModal.querySelector('.faq-close').addEventListener('click', () => setFaqModal(false));
document.querySelector('#moreList').innerHTML = content.more.map((item, index) => `
  <a class="more-card" href="${item.url}" target="_blank" rel="noreferrer" style="--delay:${index * 60}ms">
    <span class="more-icon${item.icon ? ' has-image' : ''}" aria-hidden="true">
      ${item.icon ? `<img src="${item.icon}" alt="" width="96" height="96" loading="lazy" decoding="async">` : item.mark}
    </span>
    <span class="more-copy"><strong>${item.title}</strong><small>${item.subtitle}</small></span>
    <svg class="more-arrow" aria-hidden="true"><use href="#i-chevron"/></svg>
  </a>
`).join('');

pages.forEach((page) => {
  const footer = document.createElement('p');
  footer.className = 'site-copyright';
  footer.textContent = content.footer;
  page.append(footer);
});

const bank = content.donate;
document.querySelector('.donate-heading strong').textContent = ui.donateTitle || 'Ủng hộ dự án';
document.querySelector('.donate-heading>div span').textContent = ui.donateHint || 'Quét mã để chuyển khoản';
document.querySelector('.bank-details>div span').textContent = ui.accountOwner || 'Chủ tài khoản';
document.querySelector('.copy-account small').textContent = ui.accountNumber || 'Số tài khoản';
document.querySelector('.copy-account em').textContent = ui.copyHint || 'Chạm để sao chép';
document.querySelector('.thank-you').textContent = ui.thankYou || '';
const qr = document.querySelector('#bankQr');
qr.dataset.src = `https://img.vietqr.io/image/${bank.bankCode}-${bank.accountNumber}-compact2.png?accountName=${encodeURIComponent(bank.accountName)}`;
qr.alt = `Mã QR chuyển khoản tới tài khoản ${bank.accountNumber}`;
function loadDonateQr() {
  if (!qr.getAttribute('src')) qr.src = qr.dataset.src;
}
document.querySelector('#accountName').textContent = bank.accountName;
document.querySelector('#accountNumber').textContent = bank.accountNumber;
document.querySelector('.copy-account').dataset.copy = bank.accountNumber;

const donorModal = document.querySelector('#donorModal');
const donorButton = document.querySelector('#donorButton');
const donorList = document.querySelector('#donorList');
let donorCloseTimer;
let donors = Array.isArray(bank.donors) ? bank.donors : [];
let donorRequest;

/*
 * Đưa modal ra khỏi .page để không bị stacking context của trang giữ lại.
 * Nhờ vậy nút giao diện và thanh điều hướng không thể nằm đè lên modal.
 */
document.body.append(donorModal);

document.querySelector('#donorTitle').textContent = ui.donorsTitle || 'Những người đã ủng hộ';
document.querySelector('.donor-summary span:first-child').lastChild.textContent = ` ${ui.donorsLabel || 'người ủng hộ'}`;
document.querySelector('.donor-summary span:last-child').textContent = ui.donorsSubtitle || 'Từng đóng góp đều đáng quý';

function renderDonors() {
  document.querySelector('#donorCount').textContent = countFormatter.format(donors.length);
  donorList.replaceChildren();

  if (!donors.length) {
    const empty = document.createElement('p');
    empty.className = 'donor-empty';
    empty.textContent = ui.emptyDonors || 'Danh sách người ủng hộ sẽ xuất hiện tại đây.';
    donorList.append(empty);
    return;
  }

  const items = donors.map((donor) => {
    const item = document.createElement('article');
    const avatar = document.createElement('span');
    const copy = document.createElement('span');
    const name = document.createElement('strong');

    item.className = 'donor-item';
    avatar.className = 'donor-avatar';
    avatar.ariaHidden = 'true';
    avatar.textContent = (donor.name || '?').trim().charAt(0).toUpperCase();
    copy.className = 'donor-copy';
    name.textContent = donor.name || 'Ẩn danh';
    copy.append(name);

    if (donor.message) {
      const message = document.createElement('small');
      message.textContent = donor.message;
      copy.append(message);
    }

    item.append(avatar, copy);

    if (donor.amount) {
      const amount = document.createElement('b');
      amount.textContent = donor.amount;
      item.append(amount);
    }

    return item;
  });

  donorList.append(...items);
}

function getGoogleSheetId(url) {
  return String(url || '').match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/)?.[1] || '';
}

function readSheetDonors(payload) {
  const columns = payload.table?.cols || [];
  const rows = payload.table?.rows || [];
  const labels = columns.map((column) => String(column.label || '').trim().toLowerCase());
  const findColumn = (...names) => labels.findIndex((label) => names.includes(label));

  const nameColumn = findColumn('name', 'tên', 'ten');
  const amountColumn = findColumn('amount', 'số tiền', 'so tien');
  const messageColumn = findColumn('message', 'lời nhắn', 'loi nhan');

  const valueAt = (row, index, fallback) => {
    const cell = row.c?.[index >= 0 ? index : fallback];
    return String(cell?.f ?? cell?.v ?? '').trim();
  };

  return rows.map((row) => ({
    name: valueAt(row, nameColumn, 0),
    amount: valueAt(row, amountColumn, 1),
    message: valueAt(row, messageColumn, 2)
  })).filter((donor) => {
    const name = donor.name.toLowerCase();
    const amount = donor.amount.toLowerCase();
    const message = donor.message.toLowerCase();
    const isHeader = name === 'name' && amount === 'amount' && message === 'message';
    return !isHeader && (donor.name || donor.amount || donor.message);
  });
}

async function fetchSheetDonors() {
  const sheetId = getGoogleSheetId(bank.sheetUrl);
  if (!sheetId) return donors;

  const cacheKey = `donors-sheet:${sheetId}:${bank.sheetName || 'Sheet1'}`;
  const cacheTime = Math.max(1, Number(bank.sheetCacheMinutes) || 10) * 60 * 1000;

  try {
    const cached = JSON.parse(localStorage.getItem(cacheKey));
    if (cached && Date.now() - cached.savedAt < cacheTime) return cached.donors;
  } catch {}

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  const sheetName = encodeURIComponent(bank.sheetName || 'Sheet1');
  const endpoint = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:json&sheet=${sheetName}`;

  try {
    const response = await fetch(endpoint, { signal: controller.signal });
    if (!response.ok) throw new Error(`Google Sheets: ${response.status}`);

    const text = await response.text();
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    if (start < 0 || end < start) throw new Error('Dữ liệu Google Sheets không hợp lệ');

    const sheetDonors = readSheetDonors(JSON.parse(text.slice(start, end + 1)));
    localStorage.setItem(cacheKey, JSON.stringify({
      savedAt: Date.now(),
      donors: sheetDonors
    }));
    return sheetDonors;
  } finally {
    clearTimeout(timeout);
  }
}

async function loadSheetDonors() {
  if (!getGoogleSheetId(bank.sheetUrl)) return;
  if (!donorRequest) donorRequest = fetchSheetDonors();

  try {
    donors = await donorRequest;
    renderDonors();
  } catch (error) {
    donorRequest = null;
    console.warn('Không tải được danh sách ủng hộ:', error.message);
  }
}

renderDonors();

function setDonorModal(open) {
  clearTimeout(donorCloseTimer);
  if (open) {
    donorModal.hidden = false;
    document.body.classList.add('donor-open');
    requestAnimationFrame(() => donorModal.classList.add('is-open'));
    loadSheetDonors();
    donorModal.querySelector('.donor-close').focus();
    return;
  }
  donorModal.classList.remove('is-open');
  document.body.classList.remove('donor-open');
  donorCloseTimer = setTimeout(() => { donorModal.hidden = true; }, 200);
}
donorButton.addEventListener('click', () => setDonorModal(true));
donorModal.querySelector('.donor-backdrop').addEventListener('click', () => setDonorModal(false));
donorModal.querySelector('.donor-close').addEventListener('click', () => setDonorModal(false));

/* Một trình xử lý bàn phím dùng chung cho các modal của trang. */
document.addEventListener('keydown', (event) => {
  if (event.key !== 'Escape') return;
  if (!faqModal.hidden) setFaqModal(false);
  if (!donorModal.hidden) setDonorModal(false);
});

document.querySelector('.bottom-nav').addEventListener('click', (event) => {
  const button = event.target.closest('[data-tab]');
  if (!button) return;
  navButtons.forEach((item) => item.classList.toggle('is-selected', item === button));
  pages.forEach((page) => {
    const active = page.dataset.page === button.dataset.tab;
    page.hidden = !active;
    page.classList.toggle('is-active', active);
  });
  if (button.dataset.tab === 'donate') loadDonateQr();
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

const toast = document.querySelector('.toast');
let toastTimer;

/* Toast dùng chung cho sao chép và phản hồi từ Android bridge. */
document.body.append(toast);

function showToast(message, duration = 1800) {
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), duration);
}

window.addEventListener('hyperos-native-message', (event) => {
  showToast(event.detail?.message || 'Không thể thực hiện thao tác', 2400);
});

document.querySelector('.copy-account').addEventListener('click', async (event) => {
  const value = event.currentTarget.dataset.copy;
  try { await navigator.clipboard.writeText(value); }
  catch { const area = document.createElement('textarea'); area.value = value; document.body.append(area); area.select(); document.execCommand('copy'); area.remove(); }
  showToast('Đã sao chép số tài khoản');
});
