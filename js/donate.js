import content from './content.js?v=__BUILD__';
import {showToast} from './notifications.js?v=__BUILD__';
const ui = content.ui || {};
const countFormatter = new Intl.NumberFormat('vi-VN');
const bank = content.donate;
document.querySelector('.donate-heading strong').textContent = ui.donateTitle || 'Ủng hộ dự án';
document.querySelector('.donate-heading>div span').textContent = ui.donateHint || 'Quét mã để chuyển khoản';
document.querySelector('.bank-details>div span').textContent = ui.accountOwner || 'Chủ tài khoản';
document.querySelector('.copy-account small').textContent = ui.accountNumber || 'Số tài khoản';
document.querySelector('.copy-account em').textContent = ui.copyHint || 'Chạm để sao chép';
document.querySelector('.thank-you').textContent = ui.thankYou || '';
const qr = document.querySelector('#bankQr');
qr.src = `https://img.vietqr.io/image/${bank.bankCode}-${bank.accountNumber}-compact2.png?accountName=${encodeURIComponent(bank.accountName)}`;
qr.alt = `Mã QR chuyển khoản tới tài khoản ${bank.accountNumber}`;
document.querySelector('#accountName').textContent = bank.accountName;
document.querySelector('#accountNumber').textContent = bank.accountNumber;
document.querySelector('.copy-account').dataset.copy = bank.accountNumber;

const donorModal = document.querySelector('#donorModal');
const donorButton = document.querySelector('#donorButton');
const donorList = document.querySelector('#donorList');
let donorCloseTimer;
let donorLastFocus;
let donors = Array.isArray(bank.donors) ? bank.donors : [];
let donorRequest;

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
    if (cached && Array.isArray(cached.donors) && Date.now() - cached.savedAt < cacheTime) return cached.donors;
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
    try {
      localStorage.setItem(cacheKey, JSON.stringify({
        savedAt: Date.now(),
        donors: sheetDonors
      }));
    } catch {}
    return sheetDonors;
  } finally {
    clearTimeout(timeout);
  }
}

async function loadSheetDonors() {
  if (!getGoogleSheetId(bank.sheetUrl)) return;
  if (!donorRequest) donorRequest = fetchSheetDonors().finally(() => { donorRequest = null; });

  try {
    donors = await donorRequest;
    renderDonors();
  } catch (error) {
    console.warn('Không tải được danh sách ủng hộ:', error.message);
  }
}

renderDonors();

function setDonorModal(open) {
  clearTimeout(donorCloseTimer);
  if (open) {
    donorLastFocus = document.activeElement;
    donorModal.hidden = false;
    document.body.classList.add('donor-open');
    requestAnimationFrame(() => donorModal.classList.add('is-open'));
    loadSheetDonors();
    donorModal.querySelector('.donor-close').focus();
    return;
  }
  donorModal.classList.remove('is-open');
  document.body.classList.remove('donor-open');
  donorLastFocus?.focus?.();
  donorCloseTimer = setTimeout(() => { donorModal.hidden = true; }, 200);
}
donorButton.addEventListener('click', () => setDonorModal(true));
donorModal.querySelector('.donor-backdrop').addEventListener('click', () => setDonorModal(false));
donorModal.querySelector('.donor-close').addEventListener('click', () => setDonorModal(false));

document.querySelector('.copy-account').addEventListener('click', async (event) => {
  const value = event.currentTarget.dataset.copy;
  try {
    if (!navigator.clipboard?.writeText) throw new Error('Clipboard API unavailable');
    await navigator.clipboard.writeText(value);
  } catch {
    const area = document.createElement('textarea');
    area.value = value;
    document.body.append(area);
    area.select();
    const copied = document.execCommand('copy');
    area.remove();
    if (!copied) { showToast('Không thể sao chép số tài khoản'); return; }
  }
  showToast('Đã sao chép số tài khoản');
});

document.addEventListener('keydown', (event) => { if (event.key === 'Escape' && !donorModal.hidden) setDonorModal(false); });
