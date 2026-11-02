import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { test } from 'node:test';
import { readCanonicalUrl } from './generate.mts';

test('reads the canonical address from the page head', () => {
  const html =
    '<head><link rel="canonical" href="https://cinqdecoeur.fr/" /></head>';
  assert.equal(readCanonicalUrl(html, 'index.html'), 'https://cinqdecoeur.fr/');
});

test('reads it when href comes before rel', () => {
  const html = '<link href="https://example.org/x" rel="canonical">';
  assert.equal(readCanonicalUrl(html, 'index.html'), 'https://example.org/x');
});

test('fails with the file name when there is no canonical tag', () => {
  assert.throws(
    () => readCanonicalUrl('<head></head>', 'apps/site/index.html'),
    /apps\/site\/index\.html/,
  );
});

test('the command writes a PNG and an SVG and reports them', () => {
  const output = execFileSync(
    process.execPath,
    [new URL('./generate.mts', import.meta.url).pathname],
    { encoding: 'utf8' },
  );
  const png = new URL('./out/qr-code.png', import.meta.url);
  const svg = new URL('./out/qr-code.svg', import.meta.url);
  assert.ok(existsSync(png));
  assert.ok(existsSync(svg));
  assert.match(output, /qr-code\.png/);
  assert.match(output, /qr-code\.svg/);
  assert.match(output, /https:\/\/cinqdecoeur\.fr\//);
});
