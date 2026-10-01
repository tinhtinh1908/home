import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

test('cache phục hồi trang và JavaScript khi máy chủ trả lỗi 503', async () => {
  const listeners = {};
  const cached = new Response('cached content', { status: 200 });
  const context = vm.createContext({
    URL,
    self: { location: { origin: 'https://example.test' }, addEventListener: (type, callback) => { listeners[type] = callback; } },
    fetch: async () => new Response('unavailable', { status: 503 }),
    caches: { match: async () => cached }
  });
  vm.runInContext(await readFile(new URL('../sw.js', import.meta.url), 'utf8'), context);
  for (const request of [
    { method: 'GET', mode: 'navigate', url: 'https://example.test/' },
    { method: 'GET', mode: 'cors', url: 'https://example.test/js/app.js?v=test' }
  ]) {
    let response;
    listeners.fetch({ request, respondWith: (promise) => { response = promise; }, waitUntil: () => {} });
    assert.equal(await response, cached);
  }
  context.caches.match = async () => undefined;
  let response;
  listeners.fetch({ request: { method: 'GET', mode: 'navigate', url: 'https://example.test/' }, respondWith: (promise) => { response = promise; } });
  assert.equal((await response).status, 503);
});
