import QRCode from 'qrcode';
import sharp from 'sharp';

// Dark shade of the brand brown (theme_color #8d6d51): the brand colour
// itself is too light against white to scan reliably.
const MODULE_COLOR = '#4a3828';
const QUIET_ZONE_MODULES = 4;
const PNG_MIN_WIDTH_PX = 2048;

/** Share of the code's module grid, edge to edge, that the badge may cover. */
export const BADGE_SHARE_OF_CODE = 0.25;

function modulesPath(
  qr: ReturnType<typeof QRCode.create>,
  offset: number,
): string {
  const { size } = qr.modules;
  let d = '';
  for (let row = 0; row < size; row++) {
    let col = 0;
    while (col < size) {
      if (!qr.modules.get(row, col)) {
        col++;
        continue;
      }
      const start = col;
      while (col < size && qr.modules.get(row, col)) col++;
      d += `M${start + offset} ${row + offset}h${col - start}v1h-${col - start}z`;
    }
  }
  return d;
}

/**
 * Renders `text` as a QR code with `badgePng` centred on it, as an SVG
 * string and a print-size PNG. Both come from the same SVG.
 */
export async function renderQr(
  text: string,
  badgePng: Buffer,
): Promise<{ svg: string; png: Buffer }> {
  const qr = QRCode.create(text, { errorCorrectionLevel: 'H' });
  const modules = qr.modules.size;
  const total = modules + 2 * QUIET_ZONE_MODULES;
  const scale = Math.ceil(PNG_MIN_WIDTH_PX / total);

  const badge = modules * BADGE_SHARE_OF_CODE;
  const badgeOffset = (total - badge) / 2;

  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" ` +
    `xmlns:xlink="http://www.w3.org/1999/xlink" ` +
    `width="${total * scale}" height="${total * scale}" ` +
    `viewBox="0 0 ${total} ${total}" shape-rendering="crispEdges">` +
    `<rect width="${total}" height="${total}" fill="#ffffff"/>` +
    `<path fill="${MODULE_COLOR}" d="${modulesPath(qr, QUIET_ZONE_MODULES)}"/>` +
    `<image x="${badgeOffset}" y="${badgeOffset}" width="${badge}" ` +
    `height="${badge}" shape-rendering="auto" ` +
    `xlink:href="data:image/png;base64,${badgePng.toString('base64')}"/>` +
    `</svg>`;

  const png = await sharp(Buffer.from(svg)).png().toBuffer();
  return { svg, png };
}
