import { access, mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'vite';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

const WEB_ROOT = fileURLToPath(new URL('.', import.meta.url));

/** Script types that are inert data. Every other type runs, so the CSP would block it inline. */
const DATA_SCRIPT_TYPES = new Set(['application/json', 'application/ld+json']);

/** Code the Content-Security-Policy refuses without 'unsafe-inline': inline scripts and handlers. */
function findInlineCode(html: string): string[] {
  const found: string[] = [];
  for (const [tag = '', attributes = '', body = ''] of html.matchAll(
    /<script\b([^>]*)>([\s\S]*?)<\/script\s*>/gi,
  )) {
    const type = /\btype\s*=\s*["']?([^"'\s>]+)/i.exec(attributes)?.[1]?.toLowerCase();
    const hasSource = /\bsrc\s*=/i.test(attributes);
    if (!hasSource && body.trim() !== '' && !DATA_SCRIPT_TYPES.has(type ?? '')) found.push(tag);
  }
  for (const [handler = ''] of html.matchAll(/<[a-z][^>]*\son[a-z]+\s*=[^>]*>/gi)) {
    found.push(handler);
  }
  for (const [url = ''] of html.matchAll(/\b(?:href|src|action)\s*=\s*["']?\s*javascript:/gi)) {
    found.push(url);
  }
  return found;
}

describe('findInlineCode', () => {
  it.each([
    '<script>document.title = "x";</script>',
    '<script type="module">import "/app.js";</script>',
    '<script type="text/javascript">run()</script>',
    '<img src="/x.png" onerror="run()">',
    '<a href="javascript:run()">Run</a>',
  ])('finds %s', (html) => {
    expect(findInlineCode(html)).toHaveLength(1);
  });

  it.each([
    '<script src="/theme-init.js"></script>',
    '<script type="module" crossorigin src="/assets/index.js"></script>',
    '<script type="application/ld+json">{"@type":"LocalBusiness"}</script>',
    '<a href="/admin/login">Sign in</a>',
  ])('allows %s', (html) => {
    expect(findInlineCode(html)).toEqual([]);
  });
});

describe('the built index.html', () => {
  let outDir = '';
  let html = '';

  beforeAll(async () => {
    outDir = await mkdtemp(join(tmpdir(), 'web-build-'));
    await build({
      root: WEB_ROOT,
      configFile: join(WEB_ROOT, 'vite.config.ts'),
      logLevel: 'silent',
      build: { outDir, emptyOutDir: true },
    });
    html = await readFile(join(outDir, 'index.html'), 'utf8');
  }, 120_000);

  afterAll(async () => {
    if (outDir) await rm(outDir, { recursive: true, force: true });
  });

  it("has no inline code, so the Content-Security-Policy needs no 'unsafe-inline'", () => {
    expect(html).toMatch(/<script\b/);
    expect(findInlineCode(html)).toEqual([]);
  });

  it('applies the theme from a same-origin file before first paint and before the app', async () => {
    const head = html.slice(0, html.indexOf('</head>'));
    const scripts = [...head.matchAll(/<script\b[^>]*>/gi)].map(([tag]) => tag);

    // Classic and synchronous: no async, defer or type="module", which would run after paint.
    expect(scripts[0]).toBe('<script src="/theme-init.js">');
    expect(scripts.slice(1).every((tag) => tag.includes('type="module"'))).toBe(true);
    await expect(access(join(outDir, 'theme-init.js'))).resolves.toBeUndefined();
  });
});
