import assert from 'node:assert/strict';
import test from 'node:test';
import { cp, mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

test('file FAQ lỗi cú pháp không làm mất chủ đề, cập nhật và liên hệ', async () => {
  const folder = await mkdtemp(join(tmpdir(), 'dtinh-content-test-'));
  try {
    await mkdir(join(folder, 'js'));
    await writeFile(join(folder, 'package.json'), '{"type":"module"}');
    await cp(new URL('../content/', import.meta.url), join(folder, 'content'), { recursive: true });
    await cp(new URL('../js/content.js', import.meta.url), join(folder, 'js/content.js'));
    await writeFile(join(folder, 'content/faq.js'), 'export default [ { title: ; } ];');
    const errors = [];
    const originalError = console.error;
    let content;
    try {
      console.error = (...args) => errors.push(args);
      content = (await import(pathToFileURL(join(folder, 'js/content.js')).href)).default;
    } finally {
      console.error = originalError;
    }
    assert.deepEqual(content.faq, []);
    assert.ok(content.themes.length > 0);
    assert.ok(content.update.length > 0);
    assert.ok(content.more.some((item) => item.url.startsWith('mailto:')));
    assert.equal(errors.length, 1);
    assert.ok(String(errors[0][0]).includes('faq.js'));
  } finally {
    await rm(folder, { recursive: true, force: true });
  }
});
