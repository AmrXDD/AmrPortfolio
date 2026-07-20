// Export the Amr logo to PNG at Instagram-ready sizes.
// Run: node scripts/export-logo.mjs
// Output: ./public/brand/*.png

import sharp from "sharp";
import { mkdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join, resolve } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = resolve(__dirname, "..", "public", "brand");
await mkdir(outDir, { recursive: true });

// Build an SVG string programmatically so we can tune ring thickness per size
function buildSVG({
  bg = "#0A0A0A",        // disc color, or "transparent"
  letter = "a",
  letterColor = "#EFEAE2",
  ringThicknessRatio = 0.105,  // ring as % of viewbox
  showLetter = true,
  viewbox = 64,
} = {}) {
  const r = viewbox / 2;
  const ringR = r - viewbox * ringThicknessRatio * 0.5;
  const strokeW = viewbox * ringThicknessRatio;
  const cx = r;
  const cy = r;
  const top = `M ${cx} ${cy - ringR}`;
  const right = `A ${ringR} ${ringR} 0 0 1 ${cx + ringR} ${cy}`;
  const bottom = `A ${ringR} ${ringR} 0 0 1 ${cx} ${cy + ringR}`;
  const left = `A ${ringR} ${ringR} 0 0 1 ${cx - ringR} ${cy}`;
  const back = `A ${ringR} ${ringR} 0 0 1 ${cx} ${cy - ringR}`;
  const fontSize = viewbox * 0.55;
  const letterY = cy + fontSize * 0.36;

  const bgCircle =
    bg === "transparent"
      ? ""
      : `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${bg}"/>`;
  const letterEl = showLetter
    ? `<text x="${cx}" y="${letterY}" text-anchor="middle"
        font-family="Georgia, 'Times New Roman', serif"
        font-style="italic" font-size="${fontSize}"
        fill="${letterColor}">${letter}</text>`
    : "";

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${viewbox} ${viewbox}">
  <defs>
    <linearGradient id="g1" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#FF4D1F"/>
      <stop offset="1" stop-color="#FF6A3D"/>
    </linearGradient>
    <linearGradient id="g2" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#FF6A3D"/>
      <stop offset="1" stop-color="#7C3AED"/>
    </linearGradient>
    <linearGradient id="g3" x1="1" y1="0" x2="0" y2="0">
      <stop offset="0" stop-color="#7C3AED"/>
      <stop offset="1" stop-color="#22D3EE"/>
    </linearGradient>
    <linearGradient id="g4" x1="0" y1="1" x2="0" y2="0">
      <stop offset="0" stop-color="#22D3EE"/>
      <stop offset="1" stop-color="#FF4D1F"/>
    </linearGradient>
  </defs>
  ${bgCircle}
  <g fill="none" stroke-width="${strokeW}" stroke-linecap="butt">
    <path d="${top} ${right}" stroke="url(#g1)"/>
    <path d="${right.replace(`A ${ringR} ${ringR} 0 0 1 ${cx + ringR} ${cy}`, `M ${cx + ringR} ${cy}`)} ${bottom}" stroke="url(#g2)"/>
    <path d="M ${cx} ${cy + ringR} ${left}" stroke="url(#g3)"/>
    <path d="M ${cx - ringR} ${cy} ${back}" stroke="url(#g4)"/>
  </g>
  ${letterEl}
</svg>`;
}

// Render an SVG string at a target px size
async function renderPng({ svg, size, file, padBg = null }) {
  const buf = Buffer.from(svg);
  let img = sharp(buf, { density: 600 }).resize(size, size, {
    fit: "contain",
    background: padBg ?? { r: 0, g: 0, b: 0, alpha: 0 },
  });
  await img.png({ compressionLevel: 9 }).toFile(join(outDir, file));
  console.log(`  ✓ ${file}  (${size}×${size})`);
}

async function renderStory({ svg, file, bg = "#0A0A0A", logoSize = 720 }) {
  const w = 1080;
  const h = 1920;
  const buf = Buffer.from(svg);
  const logoBuf = await sharp(buf, { density: 600 })
    .resize(logoSize, logoSize)
    .png()
    .toBuffer();
  const canvas = sharp({
    create: { width: w, height: h, channels: 4, background: bg },
  });
  await canvas
    .composite([{ input: logoBuf, gravity: "center" }])
    .png({ compressionLevel: 9 })
    .toFile(join(outDir, file));
  console.log(`  ✓ ${file}  (${w}×${h})`);
}

console.log("Exporting Amr logo to /public/brand…\n");

// 1) Profile picture — dark, full bleed (disc to edge), letter inside
const darkSvg = buildSVG({ bg: "#0A0A0A", showLetter: true });
await renderPng({ svg: darkSvg, size: 1080, file: "amr-logo-ig-profile-dark-1080.png" });
await renderPng({ svg: darkSvg, size: 2048, file: "amr-logo-dark-2048.png" });
await renderPng({ svg: darkSvg, size: 512, file: "amr-logo-dark-512.png" });

// 2) Light / bone variant — for light Instagram themes, business cards on white
const boneSvg = buildSVG({ bg: "#EFEAE2", letterColor: "#0A0A0A", showLetter: true });
await renderPng({ svg: boneSvg, size: 1080, file: "amr-logo-ig-profile-bone-1080.png" });
await renderPng({ svg: boneSvg, size: 2048, file: "amr-logo-bone-2048.png" });

// 3) Transparent — halo + letter only, no disc (overlays / stories / stickers)
const transSvg = buildSVG({ bg: "transparent", showLetter: true });
await renderPng({ svg: transSvg, size: 1080, file: "amr-logo-transparent-1080.png" });
await renderPng({ svg: transSvg, size: 2048, file: "amr-logo-transparent-2048.png" });

// 4) Mark only (no letter) — watermark, app icon, sticker
const markSvg = buildSVG({ bg: "#0A0A0A", showLetter: false });
await renderPng({ svg: markSvg, size: 1080, file: "amr-mark-only-dark-1080.png" });

// 5) Story-ready 1080×1920 with the logo centered on ink, comfy padding
const storyLogoSvg = buildSVG({ bg: "transparent", showLetter: true });
await renderStory({ svg: storyLogoSvg, file: "amr-logo-ig-story-1080x1920.png", bg: "#0A0A0A", logoSize: 720 });

console.log("\nDone. Files written to /public/brand/");
