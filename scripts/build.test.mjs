import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync, mkdtempSync, rmSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';
import { parse, build } from './build.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const fixture = (n) => readFileSync(join(here, 'fixtures', n), 'utf8');
const fixturePath = (n) => join(here, 'fixtures', n);
const source = readFileSync(join(here, '..', 'source', 'AI_Engineering_Bible.md'), 'utf8');
const sourceIds = [...source.matchAll(/^#### (L\d+-\d+)\b/gm)].map((m) => m[1]);

// Runs the build CLI in a child process. Argv: [src?, outDir?]; with no args it builds the real source into dist/.
const cli = (...args) => spawnSync(process.execPath, [join(here, 'build.mjs'), ...args], { encoding: 'utf8' });

test('card after a "Not yet solid" block is found', () => {
  const { cardIds } = parse(fixture('private.md'));
  assert.deepEqual(cardIds, ['L0-001', 'L0-002', 'L0-003']);
  const { html } = build(fixture('private.md'));
  assert.match(html, /<article id="l0-002"/);
});

test('private sections and PENDING content are absent', () => {
  const { html } = build(fixture('private.md'));
  for (const bad of ['SECRETNOTE', 'PRIVATEQUEUE', 'PENDING', 'Not yet solid', 'Practice queue', 'END:L0']) {
    assert.ok(!html.includes(bad), `output must not contain ${bad}`);
  }
  assert.ok(html.includes('Kept gotcha'));
  assert.match(html, /id="level-0-foundations"/);
});

test('every card ID in the real source is an id in the HTML', () => {
  assert.ok(sourceIds.length > 0);
  const { html, cards } = build(source);
  assert.equal(cards, sourceIds.length);
  for (const id of sourceIds) assert.ok(html.includes(`id="${id.toLowerCase()}"`), id);
  assert.match(html, /CC BY 4\.0 · generated \d{4}-\d{2}-\d{2} from the Bible, \d+ cards/);
});

test('duplicate card ID makes build throw', () => {
  assert.throws(() => build(fixture('duplicate.md')), /Duplicate card ID: L0-001/);
});

test('code blocks are HTML-escaped', () => {
  const { html } = build(fixture('code.md'));
  assert.ok(html.includes('<pre><code class="language-html">'));
  assert.ok(html.includes('&lt;script&gt;'));
  assert.ok(!html.includes('<script>'));
});

test('a ### heading inside How to use survives as bold text', () => {
  const { html } = build(fixture('howto.md'));
  assert.ok(html.includes('<strong>Tips for reading</strong>'));
  assert.ok(!html.includes('### Tips'));
  assert.ok(html.includes('Read the cards in order.'));
});

test('PENDING card title is excluded, PENDING in a code fence is kept', () => {
  const { cardIds, levels } = parse(fixture('pending.md'));
  assert.deepEqual(cardIds, ['L0-001', 'L0-003', 'L0-005']);
  const { html } = build(fixture('pending.md'));
  assert.ok(!html.includes('PENDING card title'));
  assert.ok(!html.includes('Private prose'));
  assert.ok(!html.includes('PENDING section'));
  assert.ok(html.includes('<pre><code class="language-text">PENDING inside code stays</code></pre>'));
  assert.ok(!html.includes('PENDING only item'));
  assert.ok(!html.includes('<ul></ul>'), 'an all-filtered list must emit no empty ul');
  assert.equal(levels[0].sections.length, 2);
});

test('a card heading without a title throws', () => {
  assert.throws(() => build(fixture('titleless.md')), /Card heading without title: #### L0-001/);
});

test('CLI on the real source exits 0 and writes dist/index.html', () => {
  const r = cli();
  assert.equal(r.status, 0, r.stderr);
  assert.equal(r.stdout.trim(), `cards: ${sourceIds.length}`);
  assert.ok(existsSync(join(here, '..', 'dist', 'index.html')));
});

test('CLI on a duplicate-ID fixture exits 1 with the error on stderr', () => {
  const r = cli(fixturePath('duplicate.md'));
  assert.equal(r.status, 1);
  assert.match(r.stderr, /Duplicate card ID: L0-001/);
});

test('CLI with a custom source and no output dir parses without writing', () => {
  const r = cli(fixturePath('howto.md'));
  assert.equal(r.status, 0, r.stderr);
  assert.equal(r.stdout.trim(), 'cards: 1');
});

test('CLI with a custom source and output dir writes only there', () => {
  const out = mkdtempSync(join(tmpdir(), 'handbook-build-'));
  try {
    const r = cli(fixturePath('howto.md'), out);
    assert.equal(r.status, 0, r.stderr);
    assert.ok(existsSync(join(out, 'index.html')));
  } finally {
    rmSync(out, { recursive: true, force: true });
  }
});
