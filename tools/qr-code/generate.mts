import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { buildBadge, cutOutLogo } from './logo.mts';
import { renderQr } from './qr.mts';

const REPO_ROOT = new URL('../../', import.meta.url);
const INDEX_HTML = 'apps/fiveOfHeart/src/index.html';
const OUT_DIR = 'tools/qr-code/out';
const BADGE_PX = 512;

/** Returns the href of the page's `rel="canonical"` link. */
export function readCanonicalUrl(html: string, source: string): string {
  for (const tag of html.match(/<link\b[^>]*>/gi) ?? []) {
    if (/\brel\s*=\s*["']canonical["']/i.test(tag)) {
      const href = tag.match(/\bhref\s*=\s*["']([^"']+)["']/i);
      if (href) return href[1];
    }
  }
  throw new Error(`No <link rel="canonical"> with an href found in ${source}`);
}

async function main(): Promise<void> {
  const html = await readFile(new URL(INDEX_HTML, REPO_ROOT), 'utf8');
  const address = readCanonicalUrl(html, INDEX_HTML);

  const logo = await cutOutLogo(
    new URL('./assets/logo-hd.jpeg', import.meta.url),
  );
  const { svg, png } = await renderQr(
    address,
    await buildBadge(logo, BADGE_PX),
  );

  await mkdir(new URL(`${OUT_DIR}/`, REPO_ROOT), { recursive: true });
  const files = [
    [`${OUT_DIR}/qr-code.svg`, svg],
    [`${OUT_DIR}/qr-code.png`, png],
  ] as const;
  for (const [path, content] of files) {
    await writeFile(new URL(path, REPO_ROOT), content);
  }

  console.log(`Encoded: ${address}`);
  for (const [path] of files) console.log(`Wrote: ${path}`);
}

if (import.meta.main) {
  await main();
}
