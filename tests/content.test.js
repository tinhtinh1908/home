import assert from 'node:assert/strict';
import test from 'node:test';
import content from '../js/content.js?v=__BUILD__';
import { contactUrl, isContactWebUrl, externalUrl, escapeHtml } from '../js/utils.js?v=__BUILD__';

test('email liên hệ được giữ lại, video vẫn chỉ nhận HTTPS', () => {
  const email = 'mailto:test@example.com';
  assert.equal(contactUrl(email), email);
  assert.equal(externalUrl(email), '');
  const valid = [
    'https://zalo.me/0876006982', 'http://example.com/support',
    'mailto:test@example.com?subject=H%E1%BB%97%20tr%E1%BB%A3',
    'tel:+84876006982', 'sms:0876006982?body=Hello',
    './huongdan.html#support', '/huongdan.html', '#faq'
  ];
  for (const value of valid) assert.equal(contactUrl(value), value);
  assert.equal(contactUrl('  https://example.com  '), 'https://example.com/');
  assert.equal(contactUrl('//example.com/help'), 'https://example.com/help');
  assert.equal(isContactWebUrl('http://example.com'), true);
  assert.equal(isContactWebUrl('https://example.com'), true);
  assert.equal(isContactWebUrl('./huongdan.html'), false);
  assert.equal(isContactWebUrl(email), false);
  for (const value of [undefined, null, 123, '', 'javascript:alert(1)', 'data:text/html,test',
    'file:///etc/passwd', 'vbscript:msgbox(1)', 'mailto:', 'mailto:abc', 'tel:abc',
    'https://user:pass@example.com', 'java\nscript:alert(1)']) {
    assert.equal(contactUrl(value), '');
  }
  assert.ok(content.more.every((item) => contactUrl(item.url)));

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
