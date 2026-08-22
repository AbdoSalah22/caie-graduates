/**
 * Processes raw company logos into uniform transparent squares with small
 * rounded corners, matching the LogoNode component (borderRadius = 10%).
 *
 * For each image in the input directory:
 * 1. Trims surrounding empty/transparent borders
 * 2. Fits the mark into a square canvas (transparent background)
 * 3. Clips corners with a rounded-rect mask (10% radius)
 * 4. Writes a PNG ready for upload to Firebase Storage
 *
 * Usage:
 *   node scripts/processLogos.js [inputDir] [outputDir]
 *
 * Defaults: input  -> <project>/logos
 *           output -> <project>/logos-processed
 */

const sharp = require("sharp");
const fs = require("fs");
const path = require("path");

const SIZE = 512;
const RADIUS_RATIO = 0.1; // matches borderRadius ratio in components/LogoNode.tsx
const PAD_RATIO = 0.04; // breathing room so marks don't touch the clipped edges

const inputDir = path.resolve(process.argv[2] || path.join(__dirname, "../logos"));
const outputDir = path.resolve(
  process.argv[3] || path.join(__dirname, "../logos-processed"),
);

if (!fs.existsSync(inputDir)) {
  console.error(`Input directory not found: ${inputDir}`);
  process.exit(1);
}
fs.mkdirSync(outputDir, { recursive: true });

const TRANSPARENT = { r: 0, g: 0, b: 0, alpha: 0 };

function roundedRectMask(size, radius) {
  return Buffer.from(
    `<svg width="${size}" height="${size}">` +
      `<rect x="0" y="0" width="${size}" height="${size}" rx="${radius}" ry="${radius}" fill="#fff"/>` +
      `</svg>`,
  );
}

async function processLogo(filePath) {
  const outSize = Math.round(SIZE * (1 - PAD_RATIO * 2));
  const radius = Math.round(SIZE * RADIUS_RATIO);
  const mask = roundedRectMask(SIZE, radius);

  // Trim empty margins; fall back to untrimmed if the image is uniform
  let inner;
  try {
    inner = await sharp(filePath).trim().toBuffer();
  } catch {
    inner = await sharp(filePath).toBuffer();
  }

  inner = await sharp(inner)
    .resize(outSize, outSize, {
      fit: "contain",
      background: TRANSPARENT,
    })
    .png()
    .toBuffer();

  const outputFile = path.join(
    outputDir,
    path.parse(filePath).name + ".png",
  );

  await sharp({
    create: {
      width: SIZE,
      height: SIZE,
      channels: 4,
      background: TRANSPARENT,
    },
  })
    .composite([
      { input: inner, gravity: "center" },
      { input: mask, blend: "dest-in" },
    ])
    .png()
    .toFile(outputFile);

  console.log(`✓ ${path.basename(filePath)} -> ${path.relative(process.cwd(), outputFile)}`);
}

async function main() {
  const files = fs
    .readdirSync(inputDir)
    .filter((f) => /\.(png|jpe?g|webp|svg)$/i.test(f));

  if (!files.length) {
    console.error(`No images found in ${inputDir}`);
    process.exit(1);
  }

  for (const file of files) {
    try {
      await processLogo(path.join(inputDir, file));
    } catch (err) {
      console.error(`✗ Failed to process ${file}:`, err.message);
    }
  }

  console.log("\nDone! Upload the processed folder with: node scripts/uploadLogos.js");
}

main();
