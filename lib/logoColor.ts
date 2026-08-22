/**
 * Detects whether a company logo has a solid, uniform background color and
 * returns it as an "r, g, b" CSS triplet for coloring the company's square.
 *
 * Rules:
 * - All four borders of the logo image one exact solid color (small tolerance
 *   absorbs JPEG/antialiasing noise) -> square takes that exact color.
 * - Transparent borders + greyscale/dark artwork -> square becomes a
 *   matching black/grey.
 * - Any other case (multi-color art on transparency, white/gray borders,
 *   load failures) -> null (square stays white).
 *
 * Results are cached per URL so each logo is only analyzed once.
 */

const cache = new Map<string, Promise<string | null>>();

/** Max per-channel difference between border pixels to count as "same" */
const EDGE_TOLERANCE = 10;
/** Border/mark colors below this saturation are considered non-colors */
const MIN_SATURATION = 0.12;
/** Share of colorful pixels below which a mark counts as fully greyscale */
const COLORFUL_SHARE = 0.03;
/** Dark marks never get a tile darker than this lightness (keeps them visible) */
const MIN_TILE_LIGHTNESS = 0.22;

function rgbToHsl(r: number, g: number, b: number) {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 510;
  const s = max === min ? 0 : (max - min) / (255 * (1 - Math.abs(2 * l - 1)));
  let h = 0;
  if (max !== min) {
    if (max === r) h = 60 * (((g - b) / (max - min)) % 6);
    else if (max === g) h = 60 * ((b - r) / (max - min) + 2);
    else h = 60 * ((r - g) / (max - min) + 4);
  }
  return { h, s, l };
}

function hslToTriplet(h: number, s: number, l: number): string {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const hp = (((h % 360) + 360) % 360) / 60;
  const x = c * (1 - Math.abs((hp % 2) - 1));
  let r = 0,
    g = 0,
    b = 0;
  if (hp < 1) [r, g, b] = [c, x, 0];
  else if (hp < 2) [r, g, b] = [x, c, 0];
  else if (hp < 3) [r, g, b] = [0, c, x];
  else if (hp < 4) [r, g, b] = [0, x, c];
  else if (hp < 5) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];

  const m = l - c / 2;
  const to = (v: number) => Math.round((v + m) * 255);
  return `${to(r)}, ${to(g)}, ${to(b)}`;
}

const triplet = (r: number, g: number, b: number) =>
  `${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)}`;

async function extractSquareColor(url: string): Promise<string | null> {
  if (typeof window === "undefined") return null;

  try {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = url;
    await img.decode();

    // Cap resolution for speed — edges stay proportional when scaled
    const scale = Math.min(
      1,
      256 / Math.max(img.naturalWidth, img.naturalHeight),
    );
    const w = Math.max(1, Math.round(img.naturalWidth * scale));
    const h = Math.max(1, Math.round(img.naturalHeight * scale));

    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return null;

    ctx.drawImage(img, 0, 0, w, h);

    let data: Uint8ClampedArray;
    try {
      data = ctx.getImageData(0, 0, w, h).data;
    } catch {
      return null; // tainted canvas (no CORS headers)
    }

    const ref = { r: -1, g: -1, b: -1 };
    let transparentBorder = false;

    // Walk the 1px border ring: top row, bottom row, left/right columns
    outer: for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const isBorder = y === 0 || y === h - 1 || x === 0 || x === w - 1;
        if (!isBorder) continue;

        const i = (y * w + x) * 4;
        const r = data[i],
          g = data[i + 1],
          b = data[i + 2],
          a = data[i + 3];

        if (a < 128) {
          transparentBorder = true;
          break outer;
        }

        if (ref.r === -1) {
          ref.r = r;
          ref.g = g;
          ref.b = b;
          continue;
        }

        // Border must be one uniform color
        if (
          Math.abs(r - ref.r) > EDGE_TOLERANCE ||
          Math.abs(g - ref.g) > EDGE_TOLERANCE ||
          Math.abs(b - ref.b) > EDGE_TOLERANCE
        ) {
          return null;
        }
      }
    }

    // ── Case 1: transparent background ────────────────────────────────
    if (transparentBorder) {
      // If the artwork itself is greyscale/dark, give the square a
      // matching black/grey instead of white
      let count = 0,
        colorful = 0,
        sr = 0,
        sg = 0,
        sb = 0;

      for (let i = 0; i < data.length; i += 4) {
        if (data[i + 3] < 128) continue;
        count++;
        const { s } = rgbToHsl(data[i], data[i + 1], data[i + 2]);
        if (s >= MIN_SATURATION) colorful++;
        sr += data[i];
        sg += data[i + 1];
        sb += data[i + 2];
      }

      if (!count || colorful / count >= COLORFUL_SHARE) return null;

      const { h: hue, s, l } = rgbToHsl(sr / count, sg / count, sb / count);
      if (l > 0.55) return null; // light grey marks read fine on white

      // Exact average tone, just lifted enough to keep the mark visible
      return hslToTriplet(hue, s, Math.max(l, MIN_TILE_LIGHTNESS));
    }

    // ── Case 2: uniform solid border ──────────────────────────────────
    if (ref.r === -1) return null;

    const { s } = rgbToHsl(ref.r, ref.g, ref.b);
    if (s < MIN_SATURATION) return null; // white/grey/black bg -> white square

    // Exact background color — no brightening, matches the brand precisely
    return triplet(ref.r, ref.g, ref.b);
  } catch {
    return null;
  }
}

export function getDominantColor(logoUrl: string): Promise<string | null> {
  let cached = cache.get(logoUrl);
  if (!cached) {
    cached = extractSquareColor(logoUrl);
    cache.set(logoUrl, cached);
  }
  return cached;
}
