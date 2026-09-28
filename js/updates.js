import content from './content.js?v=__BUILD__';
import {escapeHtml} from './utils.js?v=__BUILD__';
const ui = content.ui || {};
const updates = Array.isArray(content.update) ? content.update : [content.update];
const updateList = document.querySelector('#updateList');

updateList.innerHTML = updates.map((release) => {
  const label = release.latest ? ui.currentVersion || 'Phiên bản hiện tại' : 'Phiên bản';
  return `
  <article class="update-card">
    <div class="update-top">
      <div class="version-icon${release.thumbnail ? ' has-thumbnail' : ''}">
        ${release.thumbnail
          ? `<img src="${escapeHtml(release.thumbnail)}" alt="" width="96" height="96" loading="lazy" decoding="async">`
          : escapeHtml(release.version.split('.')[0])}
      </div>
      <div>
        <strong>${escapeHtml(release.name || `v${release.version}`)}</strong>
        <span>${escapeHtml(release.name ? `${label} · v${release.version}` : label)}</span>
      </div>
      ${release.latest ? `<span class="status-chip">${escapeHtml(ui.latestStatus || 'Mới nhất')}</span>` : ''}
    </div>
    <div class="divider"></div>
    <div class="change-list">
      ${(release.changes || []).map((change) => `
        <div>
          <span class="change-dot ${change.color === 'red' ? 'red' : 'green'}"></span>
          <p>${change.title ? `<strong>${escapeHtml(change.title)}</strong>` : ''}<small>${escapeHtml(change.description)}</small></p>
        </div>
      `).join('')}
    </div>
    <time>${escapeHtml(release.date)}</time>
  </article>
  `;
}).join('');

