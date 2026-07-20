/*
 * Paints the "Scroll-Linked Matrix" onto a 2D canvas that is used as the live
 * texture for the MacBook screen. Left: a code editor whose visible character
 * count is bound to scroll progress (typing forward, deleting backward). Right:
 * a wireframe UI that lights up section-by-section as the matching code lands.
 *
 * Ultra-premium obsidian theme with vivid neon tokens + a pulsing terminal
 * cursor. Pure canvas 2D so it stays crisp and cheap on the 3D plane.
 */

export const CANVAS_W = 1024;
export const CANVAS_H = 662;

// neon token palette
const C = {
  bg: "#090a10",
  panel: "#0c0e17",
  line: "rgba(255,255,255,0.06)",
  gutter: "rgba(230,225,255,0.25)",
  key: "#ff5c8a", // keywords — hot pink
  fn: "#5ad1ff", // functions — cyan
  str: "#b6f36a", // strings — green
  num: "#ffc46b", // numbers — amber
  type: "#c792ff", // types — purple
  com: "#5a6172", // comments — slate
  var: "#e7e2ff", // variables — lavender
  pun: "#8b93a7", // punctuation
  accent: "#ff6a3d", // ember cursor / UI accent
  cyan: "#5ad1ff",
};

type Tok = [string, keyof typeof C];
// Each inner array is a line of tokens. Deliberately high-impact "chef's
// secrets" logic — motion hooks, shaders, scroll-bound math — not boilerplate.
const LINES: Tok[][] = [
  [["// Bind the type to scroll, tight as a physical instrument", "com"]],
  [["const ", "key"], ["compile", "fn"], [" = (", "pun"], ["p", "var"], [") => ", "pun"], ["SRC", "var"], [".", "pun"], ["slice", "fn"], ["(0, p * ", "pun"], ["SRC", "var"], [".len)", "pun"]],
  [["", "pun"]],
  [["// Custom reveal, because layout shift is the enemy", "com"]],
  [["export const ", "key"], ["useReveal", "fn"], [" = (", "pun"], ["ref", "var"], [") => {", "pun"]],
  [["  const ", "key"], ["{ scrollYProgress: p }", "var"], [" = ", "pun"], ["useScroll", "fn"], ["(ref)", "pun"]],
  [["  const ", "key"], ["y", "var"], [" = ", "pun"], ["useTransform", "fn"], ["(p, [", "pun"], ["0", "num"], [",", "pun"], ["1", "num"], ["], [", "pun"], ["\"40px\"", "str"], [",", "pun"], ["\"0\"", "str"], ["])", "pun"]],
  [["  return ", "key"], ["useSpring", "fn"], ["(y, { damping: ", "pun"], ["26", "num"], [" })", "pun"]],
  [["}", "pun"]],
  [["", "pun"]],
  [["// GPU: volumetric ember god rays", "com"]],
  [["uniform ", "key"], ["float", "type"], [" iTime;", "var"]],
  [["vec3 ", "type"], ["col", "var"], [" = ", "pun"], ["godRays", "fn"], ["(uv, ", "pun"], ["1.6", "num"], [") * ", "pun"], ["ember", "var"], [";", "pun"]],
  [["float ", "type"], ["glow", "var"], [" = ", "pun"], ["pow", "fn"], ["(", "pun"], ["dot", "fn"], ["(n, l), ", "pun"], ["3.0", "num"], [");", "pun"]],
  [["gl_FragColor", "var"], [" = ", "pun"], ["vec4", "type"], ["(col + glow, ", "pun"], ["1.0", "num"], [");", "pun"]],
];

// flatten to a single char stream, remembering token colour + line/col
type Cell = { ch: string; color: string; line: number };
const STREAM: Cell[] = [];
LINES.forEach((toks, li) => {
  toks.forEach(([text, key]) => {
    for (const ch of text) STREAM.push({ ch, color: C[key], line: li });
  });
  STREAM.push({ ch: "\n", color: C.pun, line: li });
});
const TOTAL = STREAM.length;

const roundRect = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) => {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
};

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

/**
 * @param ctx   2d context of a CANVAS_W×CANVAS_H canvas
 * @param p     section scroll progress 0..1
 * @param time  seconds (for the pulsing cursor)
 */
export function drawCodeMatrix(ctx: CanvasRenderingContext2D, p: number, time: number) {
  const W = CANVAS_W;
  const H = CANVAS_H;

  // background
  ctx.fillStyle = C.bg;
  ctx.fillRect(0, 0, W, H);
  // subtle vertical vignette
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, "rgba(90,209,255,0.05)");
  g.addColorStop(1, "rgba(255,106,61,0.05)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);

  // window chrome
  ctx.fillStyle = C.panel;
  ctx.fillRect(0, 0, W, 46);
  ctx.fillStyle = "#ff5f57"; dot(ctx, 26, 23);
  ctx.fillStyle = "#febc2e"; dot(ctx, 48, 23);
  ctx.fillStyle = "#28c840"; dot(ctx, 70, 23);
  ctx.fillStyle = C.var;
  ctx.font = "500 15px 'JetBrains Mono', ui-monospace, monospace";
  ctx.textBaseline = "middle";
  ctx.fillText("compile.tsx", 100, 24);
  ctx.fillStyle = C.com;
  ctx.fillText("live · scroll compiled", W - 210, 24);

  // divider between code + preview
  const splitX = 600;
  ctx.strokeStyle = C.line;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(splitX, 46);
  ctx.lineTo(splitX, H);
  ctx.stroke();

  // ---- code column ----
  const padX = 30;
  const gutterW = 34;
  const top = 72;
  const lineH = 24;
  const fontPx = 15;
  ctx.font = `${fontPx}px 'JetBrains Mono', ui-monospace, monospace`;
  ctx.textBaseline = "alphabetic";

  // clip code strictly to the left column so long lines can never bleed into
  // the preview panel
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, 48, splitX - 6, H - 48);
  ctx.clip();

  // how many characters are "typed" — bound to scroll (forward types, back deletes)
  const typed = Math.round(clamp01((p - 0.1) / 0.8) * TOTAL);

  // pen position
  let curX = padX + gutterW;
  let curY = top;
  let curLine = -1;
  let cursorX = curX;
  let cursorY = curY;

  const drawGutter = (ln: number, y: number) => {
    ctx.fillStyle = C.gutter;
    ctx.font = `13px 'JetBrains Mono', ui-monospace, monospace`;
    ctx.fillText(String(ln + 1).padStart(2, " "), padX, y);
    ctx.font = `${fontPx}px 'JetBrains Mono', ui-monospace, monospace`;
  };

  for (let i = 0; i < typed && i < TOTAL; i++) {
    const cell = STREAM[i];
    if (cell.line !== curLine) {
      curLine = cell.line;
      curY = top + curLine * lineH;
      curX = padX + gutterW;
      drawGutter(curLine, curY);
    }
    if (cell.ch === "\n") {
      cursorX = curX;
      cursorY = curY;
      continue;
    }
    // flat neon fill — no per-glyph shadow (that was the frame-rate killer)
    ctx.fillStyle = cell.color;
    ctx.fillText(cell.ch, curX, curY);
    curX += fontPx * 0.6;
    cursorX = curX;
    cursorY = curY;
  }
  // ensure first gutter shows even before first char lands
  if (typed === 0) drawGutter(0, top);

  // pulsing neon terminal cursor at the pen (single shadowed draw — cheap)
  const pulse = 0.5 + 0.5 * Math.sin(time * 6);
  ctx.fillStyle = C.accent;
  ctx.shadowColor = C.accent;
  ctx.shadowBlur = 12 * pulse + 4;
  ctx.globalAlpha = 0.5 + 0.5 * pulse;
  ctx.fillRect(cursorX + 1, cursorY - fontPx + 2, 8, fontPx + 2);
  ctx.globalAlpha = 1;
  ctx.shadowBlur = 0;

  ctx.restore(); // end code-column clip

  // ---- preview column: wireframe UI that lights up as code lands ----
  drawPreview(ctx, splitX, typed / TOTAL, time);
}

function dot(ctx: CanvasRenderingContext2D, x: number, y: number) {
  ctx.beginPath();
  ctx.arc(x, y, 6, 0, Math.PI * 2);
  ctx.fill();
}

function drawPreview(ctx: CanvasRenderingContext2D, x0: number, frac: number, time: number) {
  const px = x0 + 28;
  const pw = CANVAS_W - px - 30;
  const py = 74;
  const ph = CANVAS_H - py - 30;

  // device shell
  ctx.strokeStyle = "rgba(255,255,255,0.10)";
  ctx.lineWidth = 1.5;
  roundRect(ctx, px, py, pw, ph, 14);
  ctx.stroke();

  // helper: reveal alpha for a block that arms at threshold t
  const reveal = (t: number) => clamp01((frac - t) / 0.12);

  const neon = (color: string, a: number) => {
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.globalAlpha = a;
    ctx.shadowColor = color;
    ctx.shadowBlur = 12 * a;
  };
  const reset = () => {
    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;
  };

  const ix = px + 22;
  const iw = pw - 44;

  // 1) nav bar
  let a = reveal(0.08);
  if (a > 0) {
    neon(C.cyan, a);
    ctx.lineWidth = 2;
    roundRect(ctx, ix, py + 22, iw, 26, 8);
    ctx.stroke();
    ctx.globalAlpha = a;
    for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.arc(ix + iw - 20 - i * 18, py + 35, 3, 0, 7); ctx.fill(); }
    reset();
  }

  // 2) big heading lines
  a = reveal(0.3);
  if (a > 0) {
    neon("#e7e2ff", a);
    ctx.lineWidth = 10;
    ctx.lineCap = "round";
    [0.85, 0.62].forEach((wf, i) => {
      ctx.beginPath();
      ctx.moveTo(ix, py + 92 + i * 26);
      ctx.lineTo(ix + iw * wf, py + 92 + i * 26);
      ctx.stroke();
    });
    ctx.lineCap = "butt";
    reset();
  }

  // 3) live chart / sparkline
  a = reveal(0.55);
  if (a > 0) {
    const cx = ix, cy = py + 168, cw = iw, ch = 96;
    neon("rgba(255,255,255,0.35)", a * 0.5);
    ctx.lineWidth = 1;
    roundRect(ctx, cx, cy, cw, ch, 8);
    ctx.stroke();
    // animated ember curve
    neon(C.accent, a);
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    const n = 40;
    for (let i = 0; i <= n; i++) {
      const t = i / n;
      const yy = cy + ch * (0.5 - 0.34 * Math.sin(t * 7 + time * 1.5) * (0.4 + 0.6 * t));
      const xx = cx + cw * t;
      if (i === 0) ctx.moveTo(xx, yy);
      else ctx.lineTo(xx, yy);
    }
    ctx.stroke();
    reset();
  }

  // 4) CTA button
  a = reveal(0.8);
  if (a > 0) {
    const bw = 150, bh = 40;
    neon(C.accent, a);
    ctx.lineWidth = 2;
    roundRect(ctx, ix, py + ph - 66, bw, bh, 20);
    ctx.globalAlpha = a * 0.18; ctx.fill();
    ctx.globalAlpha = a; ctx.stroke();
    ctx.globalAlpha = a;
    ctx.fillStyle = C.accent;
    ctx.font = "600 14px 'JetBrains Mono', ui-monospace, monospace";
    ctx.textBaseline = "middle";
    ctx.fillText("Ship it →", ix + 34, py + ph - 46);
    reset();
  }

  ctx.textBaseline = "alphabetic";
}
