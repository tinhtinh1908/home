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

test('tài nguyên theo commit dùng cache, bản phát triển vẫn kiểm tra máy chủ', async () => {
  const listeners = {};
  const cached = new Response('cached module');
  let fetches = 0;
  const writes = [];
  const context = vm.createContext({
    URL,
    self: { location: { origin: 'https://example.test' }, addEventListener: (type, callback) => { listeners[type] = callback; } },
    fetch: async () => { fetches++; return new Response('fresh module'); },
    caches: {
      match: async () => cached,
      open: async () => ({ put: async (request) => { writes.push(request.url); } })
    }
  });
  vm.runInContext(await readFile(new URL('../sw.js', import.meta.url), 'utf8'), context);
  const requestAsset = async (path) => {
    let response;
    const pending = [];
    listeners.fetch({
      request: { method: 'GET', mode: 'cors', url: `https://example.test/${path}` },
      respondWith: (promise) => { response = promise; },
      waitUntil: (promise) => { pending.push(promise); }
    });
    const result = await response;
    await Promise.all(pending);
    return result;
  };
  for (const path of ['js/app.js?v=d230b61', 'style.css?v=d230b61']) {
    assert.equal(await requestAsset(path), cached);
  }
  assert.equal(fetches, 0);
  for (const path of ['js/app.js?v=__BUILD__', 'js/app.js', 'content/site.js?v=next']) {
    assert.equal(await (await requestAsset(path)).text(), 'fresh module');
  }
  assert.equal(fetches, 3);
  assert.equal(writes.length, 3);

  context.caches.match = async () => undefined;
  assert.equal(await (await requestAsset('js/app.js?v=d230b61')).text(), 'fresh module');
  assert.equal(fetches, 4);
  assert.equal(writes.length, 4);
});
