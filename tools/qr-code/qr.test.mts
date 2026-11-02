import assert from 'node:assert/strict';
import { before, test } from 'node:test';
import jsQRModule from 'jsqr';
import sharp from 'sharp';
import { buildBadge, cutOutLogo } from './logo.mts';
import { BADGE_SHARE_OF_CODE, renderQr } from './qr.mts';

// jsqr ships CommonJS: Node hands back the function itself, while its
// typings describe it as the module's `default` member.
const jsQR = jsQRModule as unknown as typeof jsQRModule.default;

const URL_TO_ENCODE = 'https://cinqdecoeur.fr/';
const LOGO_PATH = new URL('./assets/logo-hd.jpeg', import.meta.url);

let rendered: { svg: string; png: Buffer };

before(async () => {
  const badge = await buildBadge(await cutOutLogo(LOGO_PATH), 512);
  rendered = await renderQr(URL_TO_ENCODE, badge);
});

async function decode(png: Buffer, width?: number): Promise<string | null> {
  const { data, info } = await sharp(png)
    .resize(width)
    .flatten({ background: '#ffffff' })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const result = jsQR(new Uint8ClampedArray(data), info.width, info.height);
  return result ? result.data : null;
}

test('PNG decodes to exactly the site address', async () => {
  assert.equal(await decode(rendered.png), URL_TO_ENCODE);
});

test('PNG still decodes at phone-camera resolution', async () => {
  assert.equal(await decode(rendered.png, 360), URL_TO_ENCODE);
});

test('SVG carries the badge, no wider than the allowed share of the code', () => {
  const view = rendered.svg.match(/viewBox="0 0 (\d+) \d+"/);
  const image = rendered.svg.match(/<image[^>]*\swidth="([\d.]+)"/);
  assert.ok(view, 'SVG has a viewBox');
  assert.ok(image, 'SVG embeds the badge image');
  const codeWidth = Number(view[1]);
  assert.ok(Number(image[1]) <= codeWidth * BADGE_SHARE_OF_CODE);
});

test('PNG is large enough for print', async () => {
  const { width } = await sharp(rendered.png).metadata();
  assert.ok((width ?? 0) >= 1500, `PNG is ${width}px wide`);
});
