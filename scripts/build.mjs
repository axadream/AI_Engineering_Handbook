// Static site generator: AI Engineering Bible (markdown) -> dist/index.html
// Zero dependencies. Exports parse, render, build. CLI runs only when invoked directly.
import { readFileSync, writeFileSync, mkdirSync, existsSync, copyFileSync, realpathSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const CARD_RE = /^#### (L\d+-\d+)\s+(.+?)\s*$/;
const TITLELESS_CARD_RE = /^#### L\d+-\d+\s*$/;
const HEADING_RE = /^(#{1,6})\s+(.*?)\s*$/;
const FENCE_RE = /^\s*```/;
const HR_RE = /^(-{3,}|\*{3,})$/;

// ---------- helpers ----------

const isHr = (l) => HR_RE.test(l.trim());
const hasPending = (s) => s.includes('PENDING');

export function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function slugify(s) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

function trimEdges(lines) {
  const dead = (l) => l.trim() === '' || isHr(l);
  let start = 0;
  let end = lines.length;
  while (start < end && dead(lines[start])) start++;
  while (end > start && dead(lines[end - 1])) end--;
  return lines.slice(start, end);
}

// ---------- parse ----------

export function parse(md) {
  const lines = md.replace(/\r\n?/g, '\n').split('\n');
  const preamble = { chapters: [], mindset: [], errors: [], howto: [] };
  const levels = [];
  const cardIds = [];
  const seen = new Set();

  let inFence = false;
  let privateLevel = 0; // heading level that started a private block, 0 = none
  let top = null; // 'chapters' | 'howto' | 'mindset' | 'errors' | 'level' | null (dropped)
  let level = null;
  let section = null;
  let card = null;

  const ensureLevel = () => {
    if (!level) {
      level = { n: -1, name: 'Cards', sections: [], intro: [] };
      levels.push(level);
    }
    return level;
  };
  const ensureSection = () => {
    const l = ensureLevel();
    if (!section) {
      section = { heading: null, lines: [], cards: [] };
      l.sections.push(section);
    }
    return section;
  };

  for (let line of lines) {
    const fenceLine = FENCE_RE.test(line);
    if (fenceLine) inFence = !inFence;
    const hm = !inFence && !fenceLine ? HEADING_RE.exec(line) : null;

    if (hm) {
      const depth = hm[1].length;
      const text = hm[2];
      const cm = CARD_RE.exec(line);

      if (!cm && TITLELESS_CARD_RE.test(line)) throw new Error(`Card heading without title: ${line}`);

      if (cm) {
        // Cards are found by heading regex only; a card always ends a private block.
        privateLevel = 0;
        const id = cm[1];
        if (hasPending(cm[2])) {
          // Unconfirmed card: dropped entirely, its ID is not registered.
          card = null;
          privateLevel = depth;
          continue;
        }
        if (seen.has(id)) throw new Error(`Duplicate card ID: ${id}`);
        seen.add(id);
        cardIds.push(id);
        card = { id, title: cm[2], lines: [] };
        ensureSection().cards.push(card);
        continue;
      }

      if (privateLevel && depth <= privateLevel) privateLevel = 0;
      if (privateLevel) continue;

      if (depth === 1) {
        top = null; level = section = card = null;
        continue;
      }
      if (depth === 2) {
        section = card = null;
        level = null;
        const lm = /^Level (\d+):\s*(.*)$/.exec(text);
        if (lm) {
          top = 'level';
          level = { n: Number(lm[1]), name: lm[2], sections: [], intro: [] };
          levels.push(level);
        } else if (/^Chapters\b/i.test(text)) top = 'chapters';
        else if (/^How to use/i.test(text)) top = 'howto';
        else if (/^Mindset rules/i.test(text)) top = 'mindset';
        else if (/^Error quick reference/i.test(text)) top = 'errors';
        else {
          top = null;
          if (/^Practice queue/i.test(text)) privateLevel = 2;
        }
        continue;
      }
      if (depth === 3) {
        card = null;
        if (/^Not yet solid/i.test(text) || hasPending(text)) {
          privateLevel = 3;
          section = null;
          continue;
        }
        if (top === 'level') {
          section = { heading: text, lines: [], cards: [] };
          level.sections.push(section);
        } else if (top && preamble[top]) {
          preamble[top].push(`**${text}**`);
        }
        continue;
      }
      // deeper non-card headings: keep as a bold paragraph in the current block
      line = `**${text}**`;
    }

    if (privateLevel) continue;
    if (!inFence && /^<!--.*-->\s*$/.test(line)) continue;

    if (card) card.lines.push(line);
    else if (top === 'level') (section ? section.lines : level.intro).push(line);
    else if (top && preamble[top]) preamble[top].push(line);
  }

  for (const k of Object.keys(preamble)) preamble[k] = trimEdges(preamble[k]);
  for (const l of levels) {
    l.intro = trimEdges(l.intro);
    for (const s of l.sections) {
      s.lines = trimEdges(s.lines);
      for (const c of s.cards) Object.assign(c, splitCard(c.lines));
    }
    l.sections = l.sections.filter((s) => s.heading || s.lines.length || s.cards.length);
  }
  return { preamble, levels, cardIds };
}

function splitCard(rawLines) {
  const lines = trimEdges(rawLines);
  let confirmed = null;
  const fields = [];
  let cur = null;
  let fence = false;
  for (const line of lines) {
    const fenceLine = FENCE_RE.test(line);
    if (fenceLine) fence = !fence;
    if (!fence && !fenceLine) {
      if (/^_Confirmed.*_\s*$/.test(line.trim())) {
        confirmed = line.trim().slice(1, -1);
        continue;
      }
      if (/^\*\*[^*]+\*\*/.test(line)) {
        cur = { lines: [] };
        fields.push(cur);
      }
    }
    if (!cur) {
      cur = { lines: [] };
      fields.push(cur);
    }
    cur.lines.push(line);
  }
  return { fields: fields.map((f) => trimEdges(f.lines)), confirmed };
}

// ---------- markdown subset renderer ----------

function inline(text) {
  const parts = text.split(/(`[^`]+`)/);
  return parts
    .map((p, i) => {
      if (i % 2 === 1) return `<code>${escapeHtml(p.slice(1, -1))}</code>`;
      let s = escapeHtml(p);
      s = s.replace(/\[([^\]]+)\]\((#[\w-]+)\)/g, '<a href="$2">$1</a>');
      s = s.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
      s = s.replace(/(^|[^\w*])\*(?!\s)(.+?)\*(?![\w*])/g, '$1<em>$2</em>');
      s = s.replace(/(^|[^\w])_(?!\s)(.+?)_(?!\w)/g, '$1<em>$2</em>');
      return s;
    })
    .join('');
}

const LIST_RE = /^\s*([-*+]|\d+\.)\s+(.*)$/;
const isTableSep = (l) => /^\s*\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)*\|?\s*$/.test(l) && l.includes('-');
const splitRow = (l) => l.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map((c) => c.trim());

export function renderMarkdown(src) {
  const lines = Array.isArray(src) ? src : String(src).split('\n');
  const out = [];
  let i = 0;
  const startsBlock = (idx) => {
    const l = lines[idx];
    return (
      FENCE_RE.test(l) || LIST_RE.test(l) || /^\s*>/.test(l) || isHr(l) ||
      (/^\s*\|/.test(l) && idx + 1 < lines.length && isTableSep(lines[idx + 1]))
    );
  };

  while (i < lines.length) {
    const line = lines[i];
    if (line.trim() === '') { i++; continue; }

    const fm = /^\s*```\s*([\w+-]*)/.exec(line);
    if (fm) {
      const code = [];
      i++;
      while (i < lines.length && !FENCE_RE.test(lines[i])) code.push(lines[i++]);
      i++;
      const cls = fm[1] ? ` class="language-${escapeHtml(fm[1])}"` : '';
      out.push(`<pre><code${cls}>${escapeHtml(code.join('\n'))}</code></pre>`);
      continue;
    }
    if (isHr(line)) { out.push('<hr>'); i++; continue; }

    if (/^\s*>/.test(line)) {
      const q = [];
      while (i < lines.length && /^\s*>/.test(lines[i])) q.push(lines[i++].replace(/^\s*>\s?/, ''));
      out.push(`<blockquote>${renderMarkdown(q)}</blockquote>`);
      continue;
    }
    if (/^\s*\|/.test(line) && i + 1 < lines.length && isTableSep(lines[i + 1])) {
      const head = splitRow(line);
      i += 2;
      const rows = [];
      while (i < lines.length && /^\s*\|/.test(lines[i])) {
        if (!hasPending(lines[i])) rows.push(splitRow(lines[i]));
        i++;
      }
      const th = head.map((c) => `<th>${inline(c)}</th>`).join('');
      const body = rows.map((r) => `<tr>${r.map((c) => `<td>${inline(c)}</td>`).join('')}</tr>`).join('');
      out.push(`<table><thead><tr>${th}</tr></thead><tbody>${body}</tbody></table>`);
      continue;
    }
    const lm = LIST_RE.exec(line);
    if (lm) {
      const ordered = /\d/.test(lm[1]);
      const items = [];
      while (i < lines.length) {
        const m = LIST_RE.exec(lines[i]);
        if (m && /\d/.test(m[1]) === ordered) items.push(m[2]);
        else if (m || lines[i].trim() === '' || !/^\s+\S/.test(lines[i])) break;
        else items[items.length - 1] += ' ' + lines[i].trim();
        i++;
      }
      const tag = ordered ? 'ol' : 'ul';
      const kept = items.filter((t) => !hasPending(t));
      if (kept.length) out.push(`<${tag}>${kept.map((t) => `<li>${inline(t)}</li>`).join('')}</${tag}>`);
      continue;
    }
    const para = [line];
    i++;
    while (i < lines.length && lines[i].trim() !== '' && !startsBlock(i)) para.push(lines[i++]);
    const text = para.map((l) => l.trim()).join('\n');
    if (!hasPending(text)) out.push(`<p>${inline(text)}</p>`);
  }
  return out.join('\n');
}

// ---------- render ----------

function renderCard(c) {
  const fields = c.fields.map((f) => `<div class="field">${renderMarkdown(f)}</div>`).join('\n');
  const conf = c.confirmed ? `\n<p class="confirmed">${inline(c.confirmed)}</p>` : '';
  return (
    `<article id="${c.id.toLowerCase()}" class="card">\n` +
    `<h4><span class="card-id">${escapeHtml(c.id)}</span> ${inline(c.title)}</h4>\n${fields}${conf}\n</article>`
  );
}

export function render(model, opts = {}) {
  const date = opts.date || new Date().toISOString().slice(0, 10);
  const { preamble, levels, cardIds } = model;
  const block = (id, title, lines) =>
    lines.length ? `<section id="${id}">\n<h2>${escapeHtml(title)}</h2>\n${renderMarkdown(lines)}\n</section>` : '';

  const levelHtml = levels
    .map((l) => {
      const title = l.n >= 0 ? `Level ${l.n}: ${l.name}` : l.name;
      const secs = l.sections
        .map((s) => {
          const h = s.heading ? `<h3>${escapeHtml(s.heading)}</h3>\n` : '';
          const body = s.lines.length ? renderMarkdown(s.lines) + '\n' : '';
          return `<section class="group">\n${h}${body}${s.cards.map(renderCard).join('\n')}\n</section>`;
        })
        .join('\n');
      const intro = l.intro.length ? renderMarkdown(l.intro) + '\n' : '';
      return `<section id="${slugify(title)}" class="level">\n<h2>${escapeHtml(title)}</h2>\n${intro}${secs}\n</section>`;
    })
    .join('\n');

  const parts = [
    '<!doctype html>',
    '<html lang="en">',
    '<head>',
    '<meta charset="utf-8">',
    '<meta name="viewport" content="width=device-width, initial-scale=1">',
    '<title>AI Engineering Handbook</title>',
    '<link rel="stylesheet" href="site.css">',
    '</head>',
    '<body>',
    '<header>',
    '<h1>AI Engineering Handbook</h1>',
    '<p class="purpose">A personal handbook of AI engineering lessons, each one proved by my own run and confirmed by my mentor.</p>',
    '</header>',
    '<main>',
    block('chapters', 'Chapters', preamble.chapters),
    block('mindset-rules', 'Mindset rules', preamble.mindset),
    block('error-quick-reference', 'Error quick reference', preamble.errors),
    block('how-to-use', 'How to use this manual', preamble.howto),
    levelHtml,
    '</main>',
    `<footer><p>CC BY 4.0 · generated ${date} from the Bible, ${cardIds.length} cards</p></footer>`,
    '</body>',
    '</html>',
    '',
  ];
  return parts.filter((p) => p !== '').join('\n') + '\n';
}

export function build(md, opts = {}) {
  const model = parse(md);
  return { html: render(model, opts), cards: model.cardIds.length };
}

// ---------- CLI ----------

// Optional argv: [2] = source markdown path (default: the real Bible), [3] = output dir.
// Without [2] the output goes to ROOT/dist. With a custom [2] the build writes only if [3]
// is given (to that dir); otherwise it just parses and prints the card count. This lets
// tests exercise the CLI on fixtures without touching dist/.
function main() {
  const customSrc = process.argv[2];
  const src = customSrc ? resolve(customSrc) : join(ROOT, 'source', 'AI_Engineering_Bible.md');
  const outDir = customSrc ? (process.argv[3] ? resolve(process.argv[3]) : null) : join(ROOT, 'dist');
  const { html, cards } = build(readFileSync(src, 'utf8'));
  if (outDir) {
    mkdirSync(outDir, { recursive: true });
    writeFileSync(join(outDir, 'index.html'), html, 'utf8');
    const css = join(ROOT, 'site.css');
    if (existsSync(css)) copyFileSync(css, join(outDir, 'site.css'));
  }
  console.log(`cards: ${cards}`);
}

// Compare real paths (case-insensitive on Windows) so symlinks, relative paths and
// drive-letter casing do not defeat the check.
const normPath = (p) => {
  const r = realpathSync(resolve(p));
  return process.platform === 'win32' ? r.toLowerCase() : r;
};

function isMain() {
  if (!process.argv[1]) return false;
  try {
    return normPath(process.argv[1]) === normPath(fileURLToPath(import.meta.url));
  } catch {
    return false;
  }
}

if (isMain()) {
  try {
    main();
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }
}
