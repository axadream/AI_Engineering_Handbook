import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { build } from './build.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const source = readFileSync(join(root, 'source', 'AI_Engineering_Bible.md'), 'utf8');
const { html } = build(source);
const css = readFileSync(join(root, 'site.css'), 'utf8');

const count = (re) => (html.match(re) || []).length;

test('all id attributes are unique', () => {
  const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]);
  assert.ok(ids.length > 0);
  assert.equal(new Set(ids).size, ids.length, `duplicate ids: ${ids.filter((x, i) => ids.indexOf(x) !== i).join(', ')}`);
});

test('no external URLs in the output', () => {
  assert.ok(!/https?:\/\//i.test(html), 'output must not contain http:// or https://');
});

test('no script tags', () => {
  assert.ok(!/<script/i.test(html));
});

test('open and close tags balance', () => {
  for (const tag of ['article', 'section', 'table', 'pre', 'ul', 'ol', 'li', 'blockquote', 'p']) {
    const open = count(new RegExp(`<${tag}(?=[\\s>])`, 'g'));
    const close = count(new RegExp(`</${tag}>`, 'g'));
    assert.equal(open, close, `<${tag}> open=${open} close=${close}`);
  }
});

test('document has lang and viewport meta', () => {
  assert.match(html, /<html lang="en">/);
  assert.match(html, /<meta name="viewport" content="width=device-width, initial-scale=1">/);
});

test('footer reports 28 cards', () => {
  assert.ok(html.includes(', 28 cards'), 'footer must say ", 28 cards"');
});

test('site.css has no external or import-based loading', () => {
  assert.ok(!css.includes('http'), 'site.css must not contain "http"');
  assert.ok(!css.includes('@import'), 'site.css must not contain @import');
  assert.ok(!css.includes('@font-face'), 'site.css must not contain @font-face');
});
