// The single source for every Amr logo file.
// Run: node scripts/export-logo.mjs
// Writes: src/app/icon.svg, public/logo.svg, public/logo-mark.svg, public/brand/*.png
//
// The "a" is the italic lowercase a from Instrument Serif (the site's serif),
// converted to an outline path, so it renders identically everywhere: no
// font lookup, no Georgia fallback. The ring's outer edge sits exactly on
// the viewBox edge, so nothing is clipped.

import sharp from "sharp";
import { mkdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join, resolve } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const outDir = join(root, "public", "brand");
await mkdir(outDir, { recursive: true });

const INK = "#000000";
const BONE = "#EFEAE2";

// Instrument Serif Italic "a", laid out and centred in a 64×64 box.
const A_PATH =
  "M25.40 44.68L25.40 44.68Q23.74 44.68 22.82 43.25Q21.90 41.82 21.90 39.06L21.90 39.06Q21.90 36.44 22.64 33.80Q23.38 31.15 24.66 28.76Q25.95 26.37 27.58 24.53Q29.22 22.69 31.03 21.61Q32.85 20.53 34.64 20.53L34.64 20.53Q35.52 20.53 36.30 20.87Q37.08 21.22 37.59 21.95L37.59 21.95Q37.86 22.37 38.14 22.37L38.14 22.37Q38.42 22.37 38.69 21.95L38.69 21.95Q39.20 21.22 39.52 21.01Q39.84 20.80 40.12 20.80L40.12 20.80Q40.72 20.80 40.58 21.45L40.58 21.45L36.48 39.06Q35.80 42.05 37.41 42.05L37.41 42.05Q38.46 42.05 39.31 40.63Q40.16 39.20 41.04 36.21L41.04 36.21Q41.18 35.71 41.64 35.71L41.64 35.71Q41.96 35.71 42.05 35.98Q42.14 36.26 42.05 36.63L42.05 36.63Q41.18 40.95 39.70 42.81Q38.23 44.68 36.16 44.68L36.16 44.68Q34.37 44.68 33.61 43.16Q32.85 41.64 33.45 39.02L33.45 39.02L34.05 36.49Q34.14 36.17 33.93 36.12Q33.73 36.07 33.59 36.35L33.59 36.35Q31.06 41.00 29.10 42.84Q27.15 44.68 25.40 44.68ZM26.55 42.33L26.55 42.33Q27.65 42.33 28.99 41.00Q30.32 39.66 31.63 37.55Q32.94 35.43 34.05 32.99Q35.15 30.55 35.82 28.30Q36.48 26.05 36.48 24.48L36.48 24.48Q36.48 21.68 34.51 21.68L34.51 21.68Q33.31 21.68 31.98 22.76Q30.64 23.84 29.42 25.68Q28.20 27.52 27.22 29.84Q26.23 32.16 25.63 34.67Q25.03 37.18 25.03 39.57L25.03 39.57Q25.03 41.18 25.42 41.75Q25.81 42.33 26.55 42.33Z";

function buildSVG({
  bg = INK, // disc colour, or "transparent"
  letterColor = BONE,
  ringThicknessRatio = 0.105, // ring thickness as a share of the box
  showLetter = true,
  viewbox = 64,
  pixelSize = null, // width/height attributes (icons), or none for scalable
} = {}) {
  const r = viewbox / 2;
  const strokeW = viewbox * ringThicknessRatio;
  const ringR = r - strokeW / 2; // outer edge = r: inside the viewBox
  const c = r;
  const arc = (x, y) => `A ${ringR} ${ringR} 0 0 1 ${x} ${y}`;
  const N = [c, c - ringR];
  const E = [c + ringR, c];
  const S = [c, c + ringR];
  const W = [c - ringR, c];
  const k = viewbox / 64;

  const bgCircle = bg === "transparent" ? "" : `<circle cx="${c}" cy="${c}" r="${r}" fill="${bg}"/>`;
  const letter = showLetter
    ? `<path d="${A_PATH}" fill="${letterColor}"${k !== 1 ? ` transform="scale(${k})"` : ""}/>`
    : "";
  const size = pixelSize ? ` width="${pixelSize}" height="${pixelSize}"` : "";

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${viewbox} ${viewbox}"${size}>
  <defs>
    <linearGradient id="g1" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#FF4D1F"/><stop offset="1" stop-color="#FF6A3D"/></linearGradient>
    <linearGradient id="g2" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FF6A3D"/><stop offset="1" stop-color="#7C3AED"/></linearGradient>
    <linearGradient id="g3" x1="1" y1="0" x2="0" y2="0"><stop offset="0" stop-color="#7C3AED"/><stop offset="1" stop-color="#22D3EE"/></linearGradient>
    <linearGradient id="g4" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#22D3EE"/><stop offset="1" stop-color="#FF4D1F"/></linearGradient>
  </defs>
  ${bgCircle}
  <g fill="none" stroke-width="${strokeW}" stroke-linecap="butt">
    <path d="M ${N.join(" ")} ${arc(...E)}" stroke="url(#g1)"/>
    <path d="M ${E.join(" ")} ${arc(...S)}" stroke="url(#g2)"/>
    <path d="M ${S.join(" ")} ${arc(...W)}" stroke="url(#g3)"/>
    <path d="M ${W.join(" ")} ${arc(...N)}" stroke="url(#g4)"/>
  </g>
  ${letter}
</svg>
`;
}

async function renderPng({ svg, size, file }) {
  await sharp(Buffer.from(svg), { density: 600 })
    .resize(size, size, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png({ compressionLevel: 9 })
    .toFile(join(outDir, file));
  console.log(`  ✓ ${file}  (${size}×${size})`);
}

async function renderStory({ svg, file, bg = INK, logoSize = 720 }) {
  const logo = await sharp(Buffer.from(svg), { density: 600 }).resize(logoSize, logoSize).png().toBuffer();
  await sharp({ create: { width: 1080, height: 1920, channels: 4, background: bg } })
    .composite([{ input: logo, gravity: "center" }])
    .png({ compressionLevel: 9 })
    .toFile(join(outDir, file));
  console.log(`  ✓ ${file}  (1080×1920)`);
}

console.log("Exporting the Amr logo…\n");

// SVGs used by the site
await writeFile(join(root, "src", "app", "icon.svg"), buildSVG({ pixelSize: 64 }));
await writeFile(join(root, "public", "logo.svg"), buildSVG({ pixelSize: 64 }));
await writeFile(join(root, "public", "logo-mark.svg"), buildSVG({ pixelSize: 64, showLetter: false }));
console.log("  ✓ src/app/icon.svg, public/logo.svg, public/logo-mark.svg");

// 1) Dark, full bleed
const dark = buildSVG({ bg: INK });
await renderPng({ svg: dark, size: 1080, file: "amr-logo-ig-profile-dark-1080.png" });
await renderPng({ svg: dark, size: 2048, file: "amr-logo-dark-2048.png" });
await renderPng({ svg: dark, size: 512, file: "amr-logo-dark-512.png" });

// 2) Bone (light) variant
const bone = buildSVG({ bg: BONE, letterColor: INK });
await renderPng({ svg: bone, size: 1080, file: "amr-logo-ig-profile-bone-1080.png" });
await renderPng({ svg: bone, size: 2048, file: "amr-logo-bone-2048.png" });

// 3) Transparent: ring + letter, no disc
const trans = buildSVG({ bg: "transparent" });
await renderPng({ svg: trans, size: 1080, file: "amr-logo-transparent-1080.png" });
await renderPng({ svg: trans, size: 2048, file: "amr-logo-transparent-2048.png" });

// 4) Mark only
await renderPng({ svg: buildSVG({ bg: INK, showLetter: false }), size: 1080, file: "amr-mark-only-dark-1080.png" });

// 5) Story 1080×1920
await renderStory({ svg: trans, file: "amr-logo-ig-story-1080x1920.png" });

console.log("\nDone.");
