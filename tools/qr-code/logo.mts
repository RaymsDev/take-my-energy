import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

// The source JPEG has a grey/white checkerboard painted into its pixels in
// place of real transparency. The hand is a saturated brown while the
// checkerboard is neutral grey, so saturation tells the two apart.
const CHROMA_TRANSPARENT_BELOW = 24;
const CHROMA_OPAQUE_FROM = 48;
const SOLID_BROWN_FROM = 56;

// The logo takes this share of the badge's height.
const LOGO_SHARE_OF_BADGE = 0.74;

type Source = string | URL | Buffer;

function chroma(r: number, g: number, b: number): number {
  return Math.max(r, g, b) - Math.min(r, g, b);
}

/** Returns the logo as a PNG with a transparent background, cropped to the hand. */
export async function cutOutLogo(source: Source): Promise<Buffer> {
  const input = source instanceof URL ? fileURLToPath(source) : source;
  const { data, info } = await sharp(input)
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const { width, height } = info;

  let sumR = 0;
  let sumG = 0;
  let sumB = 0;
  let solid = 0;
  for (let i = 0; i < data.length; i += 3) {
    if (chroma(data[i], data[i + 1], data[i + 2]) >= SOLID_BROWN_FROM) {
      sumR += data[i];
      sumG += data[i + 1];
      sumB += data[i + 2];
      solid++;
    }
  }
  const brown = [sumR / solid, sumG / solid, sumB / solid];

  const rgba = Buffer.alloc(width * height * 4);
  let minX = width;
  let minY = height;
  let maxX = -1;
  let maxY = -1;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 3;
      const o = (y * width + x) * 4;
      const c = chroma(data[i], data[i + 1], data[i + 2]);
      const ramp =
        (c - CHROMA_TRANSPARENT_BELOW) /
        (CHROMA_OPAQUE_FROM - CHROMA_TRANSPARENT_BELOW);
      const alpha = Math.round(255 * Math.min(1, Math.max(0, ramp)));
      // Edge pixels blend the brown with the grey checker; paint them with
      // the plain brown so no grey halo survives.
      const edge = alpha < 255;
      rgba[o] = edge ? brown[0] : data[i];
      rgba[o + 1] = edge ? brown[1] : data[i + 1];
      rgba[o + 2] = edge ? brown[2] : data[i + 2];
      rgba[o + 3] = alpha;
      if (alpha > 0) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }

  return sharp(rgba, { raw: { width, height, channels: 4 } })
    .extract({
      left: minX,
      top: minY,
      width: maxX - minX + 1,
      height: maxY - minY + 1,
    })
    .png()
    .toBuffer();
}

/** Places the cut-out logo on a white disc of `size` pixels, as a PNG. */
export async function buildBadge(
  logoPng: Buffer,
  size: number,
): Promise<Buffer> {
  const box = Math.round(size * LOGO_SHARE_OF_BADGE);
  const logo = await sharp(logoPng)
    .resize(box, box, { fit: 'inside' })
    .png()
    .toBuffer();
  const disc = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">` +
      `<circle cx="${size / 2}" cy="${size / 2}" r="${size / 2}" fill="#ffffff"/></svg>`,
  );
  return sharp(disc)
    .composite([{ input: logo, gravity: 'centre' }])
    .png()
    .toBuffer();
}
