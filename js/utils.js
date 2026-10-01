
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

// Link liên hệ được dùng email; các link video vẫn chỉ nhận HTTPS.
export function contactUrl(value) {
  const webUrl = externalUrl(value);
  if (webUrl) return webUrl;
  try {
    const url = new URL(value);
    return url.protocol === 'mailto:' && /^[^\s@?]+@[^\s@?]+\.[^\s@?]+$/.test(url.pathname)
      && !url.search && !url.hash ? url.href : '';
  } catch { return ''; }
}

export function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[character]);
}
