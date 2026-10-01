import assert from 'node:assert/strict';
import test from 'node:test';
import content from '../js/content.js?v=__BUILD__';
import { contactUrl, externalUrl, escapeHtml } from '../js/utils.js?v=__BUILD__';

test('email liên hệ được giữ lại, video vẫn chỉ nhận HTTPS', () => {
  const email = content.more.find((item) => item.url.startsWith('mailto:'));
  assert.ok(email);
  assert.equal(contactUrl(email.url), email.url);
  assert.equal(externalUrl(email.url), '');
  assert.equal(contactUrl('https://zalo.me/g/example'), 'https://zalo.me/g/example');
  for (const value of ['javascript:alert(1)', 'data:text/html,test', 'http://example.com', 'mailto:', 'mailto:abc', 'mailto:a@b.com?body=test']) {
    assert.equal(contactUrl(value), '');
  }
});

test('cập nhật hiện tại và thông báo thiếu phiên bản đều render được', async () => {
  const target = { innerHTML: '' };
  const originalDocument = globalThis.document;
  const originalUpdates = content.update;
  globalThis.document = { querySelector: () => target };
  try {
    await import('../js/updates.js?test=current');
    assert.equal((target.innerHTML.match(/class="update-card"/g) || []).length, originalUpdates.length);
    for (const release of originalUpdates) {
      for (const change of release.changes) {
        assert.ok(target.innerHTML.includes(escapeHtml(change.description)));
      }
    }
    assert.ok(!target.innerHTML.includes('undefined'));

    content.update = [
      { date: '2 tháng 10, 2026', changes: [{ description: '<Thông báo>' }] },
      { name: 'Bản kiểm tra', version: 2.4, latest: true, changes: [{ description: 'Nội dung' }] },
      { version: '1.2', changes: [] }
    ];
    await import('../js/updates.js?test=optional');
    assert.ok(target.innerHTML.includes('Thông báo'));
    assert.ok(target.innerHTML.includes('&lt;Thông báo&gt;'));
    assert.ok(target.innerHTML.includes('v2.4'));
    assert.ok(target.innerHTML.includes('v1.2'));
    assert.ok(!target.innerHTML.includes('undefined'));
  } finally {
    content.update = originalUpdates;
    globalThis.document = originalDocument;
  }
});
