
export function getThemeId(theme) {
  try {
    const id = atob(theme.themeCode || '');
    return /^[a-f\d]{8}(?:-[a-f\d]{4}){3}-[a-f\d]{12}$/i.test(id) ? id : '';
  } catch { return ''; }
}

export function externalUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' ? url.href : '';
  } catch { return ''; }
}

// Link liên hệ hỗ trợ web, trang nội bộ và các hành động liên hệ.
// Giữ externalUrl riêng để link video vẫn chỉ nhận HTTPS.
export function contactUrl(value) {
  if (typeof value !== 'string') return '';
  const input = value.trim();
  if (!input || /[\u0000-\u001f\u007f]/.test(input) || input.includes('\\')) return '';
  try {
    const url = new URL(input, 'https://contact.invalid/');
    if (url.protocol === 'https:' || url.protocol === 'http:') {
      if (url.username || url.password) return '';
      // Giữ đường dẫn tương đối để dùng được ở cả domain riêng và GitHub Pages.
      return /^[a-z][a-z\d+.-]*:/i.test(input) || input.startsWith('//') ? url.href : input;
    }
    if (url.protocol === 'mailto:') {
      return /^[^\s@?,;]+@[^\s@?,;]+\.[^\s@?,;]+$/.test(url.pathname)
        && !url.hash ? url.href : '';
    }
    if (url.protocol === 'tel:' || url.protocol === 'sms:') {
      return /^\+?[\d(). -]+$/.test(url.pathname) && /\d/.test(url.pathname)
        && !url.hash ? url.href : '';
    }
    return '';
  } catch { return ''; }
}

export function isContactWebUrl(value) {
  const href = contactUrl(value);
  return /^https?:\/\//i.test(href);
}

export function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[character]);
}
