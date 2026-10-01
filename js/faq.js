import content from './content.js?v=__BUILD__';
import {escapeHtml, externalUrl, contactUrl} from './utils.js?v=__BUILD__';
const ui = content.ui || {};
const faqItems = Array.isArray(content.faq) ? content.faq : [];
document.querySelector('#faqList').innerHTML = faqItems.map((item, index) => `
  <article class="faq-card">
    <span class="faq-copy"><strong>${escapeHtml(item.title)}</strong><small>${escapeHtml(item.description || '')}</small></span>
    <span class="faq-actions">
      ${item.text?.length ? `<button type="button" class="faq-read" data-faq-read="${index}">${escapeHtml(ui.readGuide || 'Đọc hướng dẫn')}</button>` : ''}
      ${externalUrl(item.videoUrl) ? `<a class="faq-video" href="${escapeHtml(externalUrl(item.videoUrl))}" target="_blank" rel="noopener noreferrer">${escapeHtml(item.videoLabel || ui.watchVideo || 'Xem video')}</a>` : ''}
    </span>
  </article>
`).join('');

const faqModal = document.createElement('div');
faqModal.className = 'faq-modal';
faqModal.hidden = true;
faqModal.innerHTML = `<button class="faq-backdrop" type="button" aria-label="Đóng"></button><section class="faq-dialog" role="dialog" aria-modal="true" aria-labelledby="faqModalTitle"><header><div><small>HƯỚNG DẪN</small><strong id="faqModalTitle"></strong></div><button class="faq-close" type="button" aria-label="Đóng"><svg aria-hidden="true"><use href="#i-close"/></svg></button></header><div class="faq-document"></div></section>`;
document.body.append(faqModal);
let faqCloseTimer;
let faqLastFocus;
function setFaqModal(open, item) {
  clearTimeout(faqCloseTimer);
  if (open) {
    faqLastFocus = document.activeElement;
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
  faqLastFocus?.focus?.();
  faqCloseTimer = setTimeout(() => { faqModal.hidden = true; }, 200);
}
document.querySelector('#faqList').addEventListener('click', (event) => {
  const button = event.target.closest('[data-faq-read]');
  if (button) setFaqModal(true, faqItems[Number(button.dataset.faqRead)]);
});
faqModal.querySelector('.faq-backdrop').addEventListener('click', () => setFaqModal(false));
faqModal.querySelector('.faq-close').addEventListener('click', () => setFaqModal(false));
document.querySelector('#moreList').innerHTML = content.more.filter((item) => contactUrl(item.url)).map((item) => `
  <a class="more-card" href="${escapeHtml(contactUrl(item.url))}"${externalUrl(item.url) ? ' target="_blank" rel="noopener noreferrer"' : ''}>
    <span class="more-icon${item.icon ? ' has-image' : ''}" aria-hidden="true">
      ${item.icon ? `<img src="${escapeHtml(item.icon)}" alt="" width="96" height="96" loading="lazy" decoding="async">` : escapeHtml(item.mark)}
    </span>
    <span class="more-copy"><strong>${escapeHtml(item.title)}</strong><small>${escapeHtml(item.subtitle)}</small></span>
    <svg class="more-arrow" aria-hidden="true"><use href="#i-chevron"/></svg>
  </a>
`).join('');


document.addEventListener('keydown', (event) => { if (event.key === 'Escape' && !faqModal.hidden) setFaqModal(false); });
