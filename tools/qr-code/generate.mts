import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { buildBadge, cutOutLogo } from './logo.mts';
import { renderQr } from './qr.mts';

const REPO_ROOT = new URL('../../', import.meta.url);
const INDEX_HTML = 'apps/fiveOfHeart/src/index.html';
const OUT_DIR = 'tools/qr-code/out';
const BADGE_PX = 512;

// Review link from Google Business Profile ("Ask for reviews"). It opens the
// Google "write a review" form for the business.
const GOOGLE_REVIEW_URL = 'https://g.page/r/CZ8WsQXH4OtIEAE/review';

type Target = { fileName: string; address: () => Promise<string> };

const TARGETS: Record<string, Target> = {
  site: {
    fileName: 'qr-code',
    address: async () =>
      readCanonicalUrl(
        await readFile(new URL(INDEX_HTML, REPO_ROOT), 'utf8'),
        INDEX_HTML,
      ),
  },
  review: {
    fileName: 'qr-code-google-review',
    address: async () => GOOGLE_REVIEW_URL,
  },
};

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

async function main(targetName: string): Promise<void> {
  const target = TARGETS[targetName];
  if (!target) {
    throw new Error(
      `Unknown target "${targetName}". Valid targets: ${Object.keys(TARGETS).join(', ')}`,
    );
  }
  const address = await target.address();

  const logo = await cutOutLogo(
    new URL('./assets/logo-hd.jpeg', import.meta.url),
  );
  const { svg, png } = await renderQr(
    address,
    await buildBadge(logo, BADGE_PX),
  );

  await mkdir(new URL(`${OUT_DIR}/`, REPO_ROOT), { recursive: true });
  const files = [
    [`${OUT_DIR}/${target.fileName}.svg`, svg],
    [`${OUT_DIR}/${target.fileName}.png`, png],
  ] as const;
  for (const [path, content] of files) {
    await writeFile(new URL(path, REPO_ROOT), content);
  }

  console.log(`Encoded: ${address}`);
  for (const [path] of files) console.log(`Wrote: ${path}`);
}

if (import.meta.main) {
  await main(process.argv[2] ?? 'site');
}
