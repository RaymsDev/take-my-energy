import assert from 'node:assert/strict';
import { test } from 'node:test';
import sharp from 'sharp';
import { buildBadge, cutOutLogo, loadGoogleLogo } from './logo.mts';

const LOGO_PATH = new URL('./assets/logo-hd.jpeg', import.meta.url);

async function pixels(png: Buffer) {
  const { data, info } = await sharp(png)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  return { data, width: info.width, height: info.height };
}

function at(img: { data: Buffer; width: number }, x: number, y: number) {
  const i = (y * img.width + x) * 4;
  return {
    r: img.data[i],
    g: img.data[i + 1],
    b: img.data[i + 2],
    a: img.data[i + 3],
  };
}

test('cut-out logo has fully transparent corners', async () => {
  const img = await pixels(await cutOutLogo(LOGO_PATH));
  assert.equal(at(img, 0, 0).a, 0);
  assert.equal(at(img, img.width - 1, 0).a, 0);
  assert.equal(at(img, img.width - 1, img.height - 1).a, 0);
});

test('cut-out logo keeps the brown hand and drops the checkerboard', async () => {
  const img = await pixels(await cutOutLogo(LOGO_PATH));
  let opaque = 0;
  let greyOpaque = 0;
  let sumR = 0;
  for (let y = 0; y < img.height; y++) {
    for (let x = 0; x < img.width; x++) {
      const p = at(img, x, y);
      if (p.a === 255) {
        opaque++;
        sumR += p.r;
        const chroma = Math.max(p.r, p.g, p.b) - Math.min(p.r, p.g, p.b);
        if (chroma < 30) greyOpaque++;
      }
    }
  }
  const share = opaque / (img.width * img.height);
  assert.ok(share > 0.2 && share < 0.7, `hand covers ${share} of its box`);
  assert.equal(greyOpaque, 0);
  const meanR = sumR / opaque;
  assert.ok(meanR > 130 && meanR < 190, `mean red ${meanR} is not brown`);
});

test('badge is a square white disc with the logo on it', async () => {
  const size = 400;
  const img = await pixels(await buildBadge(await cutOutLogo(LOGO_PATH), size));
  assert.equal(img.width, size);
  assert.equal(img.height, size);
  assert.equal(at(img, 0, 0).a, 0);
  assert.equal(at(img, size - 1, size - 1).a, 0);
  let white = 0;
  let brown = 0;
  let checkerGrey = 0;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const p = at(img, x, y);
      if (p.a !== 255) continue;
      if (p.r > 250 && p.g > 250 && p.b > 250) white++;
      if (p.r - p.b > 50) brown++;
      if (p.r > 200 && p.r < 215 && Math.abs(p.r - p.g) <= 3) checkerGrey++;
    }
  }
  assert.ok(white > 0, 'badge has a white backing');
  assert.ok(brown > 0, 'badge shows the logo');
  assert.equal(checkerGrey, 0);
});

test('Google logo keeps its four brand colours on a transparent background', async () => {
  const img = await pixels(
    await loadGoogleLogo(new URL('./assets/google-g.svg', import.meta.url)),
  );
  assert.equal(at(img, 0, 0).a, 0);
  const near = (
    p: { r: number; g: number; b: number; a: number },
    rgb: number[],
  ) =>
    p.a === 255 &&
    Math.abs(p.r - rgb[0]) < 12 &&
    Math.abs(p.g - rgb[1]) < 12 &&
    Math.abs(p.b - rgb[2]) < 12;
  const found = { blue: 0, green: 0, yellow: 0, red: 0 };
  for (let y = 0; y < img.height; y++) {
    for (let x = 0; x < img.width; x++) {
      const p = at(img, x, y);
      if (near(p, [0x42, 0x85, 0xf4])) found.blue++;
      if (near(p, [0x34, 0xa8, 0x53])) found.green++;
      if (near(p, [0xfb, 0xbc, 0x05])) found.yellow++;
      if (near(p, [0xea, 0x43, 0x35])) found.red++;
    }
  }
  assert.ok(
    found.blue > 0 && found.green > 0 && found.yellow > 0 && found.red > 0,
  );
});
