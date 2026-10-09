import content from './content.js?v=__BUILD__';
import {getThemeId, escapeHtml} from './utils.js?v=__BUILD__';
const ui = content.ui || {};
const releaseRequests = new Map();
const countFormatter = new Intl.NumberFormat('vi-VN');
const releaseCacheTime = 10 * 60 * 1000;
function getDownloadUrl(theme) {
  try {
    const url = atob(theme.downloadCode || '');
    if (!parseGitHubReleaseUrl(url)) return '';
    return url;
  } catch { return ''; }
}

function renderThemeButton(theme, themeIndex) {
  if (theme.themeCode) {
    return `<button class="download-button" type="button" data-open-theme="${themeIndex}" aria-label="Mở ${escapeHtml(theme.name)} trong ứng dụng Chủ đề">${escapeHtml(ui.openThemeApp || 'Mở Chủ đề')}</button>`;
  }

  if (theme.downloadCode) {
    return `<button class="download-button" type="button" data-download-theme="${themeIndex}" aria-label="Tải xuống ${escapeHtml(theme.name)}">${escapeHtml(ui.download || 'Tải về')}</button>`;
  }

  return '';
}

const firstThumbnailIndex = content.themes.findIndex((theme) => theme.thumbnail);

document.querySelector('#themeList').innerHTML = content.themes.map((theme, themeIndex) => `
  <article class="theme-card">
    <span class="theme-art ${theme.thumbnail ? 'has-thumbnail' : 'art-default'}" aria-hidden="true">
      ${theme.thumbnail
        ? `<img src="${escapeHtml(theme.thumbnail)}" alt="" width="96" height="96" loading="${themeIndex < 3 ? 'eager' : 'lazy'}" decoding="async" fetchpriority="${themeIndex === firstThumbnailIndex && themeIndex < 3 ? 'high' : 'auto'}">`
        : `<i class="orb orb-a"></i><i class="orb orb-b"></i><i class="glass-pill"></i><span class="art-mark">${escapeHtml(theme.mark)}</span>`}
    </span>
    <span class="theme-info">
      <span class="theme-heading">
        <span class="theme-title">${escapeHtml(theme.name)}</span>
        ${theme.version ? `<span class="theme-version">v${escapeHtml(theme.version)}</span>` : ''}
      </span>
      <span class="meta-row">
        <span class="support"><i></i>${escapeHtml(theme.support)}</span>
        ${theme.mode ? `<span class="theme-mode">${escapeHtml(theme.mode)}</span>` : ''}
      </span>
      <span class="theme-links">
        ${theme.previewImages?.some(Boolean) ? `<button class="preview-hint" type="button" data-preview-theme="${themeIndex}">${escapeHtml(ui.preview || 'Xem ảnh preview')}</button>` : ''}
        ${!theme.themeCode && theme.downloadCode ? `<small class="download-count" data-download-theme="${themeIndex}">${escapeHtml(ui.loadingDownloads || 'Đang lấy lượt tải...')}</small>` : ''}
      </span>
    </span>
    ${renderThemeButton(theme, themeIndex)}
  </article>
`).join('');

document.querySelector('#themeList').addEventListener('click', (event) => {
  const themeButton = event.target.closest('button[data-open-theme]');
  if (themeButton) {
    const id = getThemeId(content.themes[Number(themeButton.dataset.openTheme)]);
    if (id) window.location.href = `theme://zhuti.xiaomi.com/detail/${id}`;
    return;
  }
  const button = event.target.closest('button.download-button[data-download-theme]');
  if (!button) return;
  const url = getDownloadUrl(content.themes[Number(button.dataset.downloadTheme)]);
  if (url) window.open(url, '_blank', 'noopener,noreferrer');
});

function parseGitHubReleaseUrl(value) {
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:' || url.hostname !== 'github.com') return null;

    const latest = url.pathname.match(/^\/([^/]+)\/([^/]+)\/releases\/latest\/download\/([^/]+)$/);
    if (latest) {
      return {
        owner: decodeURIComponent(latest[1]),
        repo: decodeURIComponent(latest[2]),
        asset: decodeURIComponent(latest[3]),
        tag: null
      };
    }

    const tagged = url.pathname.match(/^\/([^/]+)\/([^/]+)\/releases\/download\/([^/]+)\/([^/]+)$/);
    if (!tagged) return null;
    return {
      owner: decodeURIComponent(tagged[1]),
      repo: decodeURIComponent(tagged[2]),
      tag: decodeURIComponent(tagged[3]),
      asset: decodeURIComponent(tagged[4])
    };
  } catch { return null; }
}

async function getTotalReleaseDownloads(release) {
  const extension = release.asset.match(/\.[a-z0-9]+$/i)?.[0].toLowerCase();
  if (!extension) throw new Error('File tải không có phần mở rộng');

  const releaseKey = `${release.owner}/${release.repo}/${extension}`;
  const cacheKey = `github-release-total:${releaseKey}`;
  let cached;
  try { cached = JSON.parse(localStorage.getItem(cacheKey)); } catch {}
  if (Number.isFinite(cached?.total) && Date.now() - cached.savedAt < releaseCacheTime) return cached.total;

  if (!releaseRequests.has(releaseKey)) {
    const request = (async () => {
      let total = 0;
      const base = `https://api.github.com/repos/${encodeURIComponent(release.owner)}/${encodeURIComponent(release.repo)}/releases`;

      for (let page = 1; ; page += 1) {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 8000);
        try {
          const response = await fetch(`${base}?per_page=100&page=${page}`, {
            signal: controller.signal,
            cache: 'no-store',
            headers: { Accept: 'application/vnd.github+json' }
          });
          if (!response.ok) throw new Error(`GitHub API: ${response.status}`);
          const releases = await response.json();
          if (!Array.isArray(releases)) throw new Error('Dữ liệu GitHub Releases không hợp lệ');

          for (const item of releases) {
            for (const asset of item.assets || []) {
              if (String(asset.name || '').toLowerCase().endsWith(extension)) {
                total += Math.max(0, Number(asset.download_count) || 0);
              }
            }
          }
          if (releases.length < 100) break;
        } finally {
          clearTimeout(timeout);
        }
      }
      try { localStorage.setItem(cacheKey, JSON.stringify({ savedAt: Date.now(), total })); } catch {}
      return total;
    })().finally(() => releaseRequests.delete(releaseKey));
    releaseRequests.set(releaseKey, request);
  }

  try {
    return await releaseRequests.get(releaseKey);
  } catch (error) {
    if (Number.isFinite(cached?.total)) return cached.total;
    throw error;
  }
}

async function loadDownloadCount(counter) {
  if (counter.dataset.loading === 'true') return;
  counter.dataset.loading = 'true';
  const release = parseGitHubReleaseUrl(getDownloadUrl(content.themes[Number(counter.dataset.downloadTheme)]));
  if (!release) {
    counter.hidden = true;
    counter.dataset.loading = 'false';
    return;
  }
  try {
    const total = await getTotalReleaseDownloads(release);
    counter.textContent = `${countFormatter.format(total)} ${ui.downloads || 'lượt tải'}`;
  } catch (error) {
    counter.textContent = `— ${ui.downloads || 'lượt tải'}`;
    console.warn(error.message);
  } finally {
    counter.dataset.loading = 'false';
  }
}

const counters = document.querySelectorAll('.download-count');
counters.forEach(loadDownloadCount);
if (counters.length) {
  setInterval(() => {
    if (!document.hidden) counters.forEach(loadDownloadCount);
  }, releaseCacheTime);
}
document.addEventListener('visibilitychange', () => {
  if (!document.hidden) counters.forEach(loadDownloadCount);
});

