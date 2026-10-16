/*
 * Paints the MacBook screen: one scroll-bound reel that walks through the
 * three services in order, on a single canvas.
 *
 *   01 · Brand   the Amr Studio ring mark is constructed from guide lines,
 *                then the palette and type specimen drop in.
 *   02 · Design  the mark flies up into a nav bar, a 12-column grid fades in
 *                and wireframe blocks snap onto it.
 *   03 · Build   the wireframe fills with the real UI, a deploy log types
 *                itself out, and a cursor clicks the call to action.
 *
 * Scroll drives the story (forward builds, backward un-builds); `time` only
 * drives ambient motion (ring spin, orb drift, caret blink). Pure canvas 2D, no
 * shadows in hot loops, so it stays cheap as a texture on the 3D plane.
 */

export const CANVAS_W = 1024;
export const CANVAS_H = 662;

const C = {
  bg: "#07080c",
  panel: "#0d0f16",
  rail: "#0a0b11",
  line: "rgba(255,255,255,0.07)",
  guide: "rgba(90,209,255,0.45)",
  bone: "#efeae2",
  dim: "rgba(239,234,226,0.45)",
  faint: "rgba(239,234,226,0.18)",
  ember: "#ff4d1f",
  violet: "#7c3aed",
  cyan: "#22d3ee",
  green: "#7dd3a8",
};

const MONO = "'JetBrains Mono', ui-monospace, monospace";
const SERIF = "'Instrument Serif', Georgia, serif";
const SANS = "Inter, system-ui, sans-serif";

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const ease = (t: number) => 1 - Math.pow(1 - clamp01(t), 3);
/** 0..1 progress of a sub-window [a,b] inside a phase. */
const win = (t: number, a: number, b: number) => clamp01((t - a) / (b - a));

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

// Stage = the area right of the phase rail.
const RAIL_W = 168;
const TOP = 46;
const SX = RAIL_W + 28;
const SY = TOP + 26;
const SW = CANVAS_W - SX - 28;
const SH = CANVAS_H - SY - 26;

// Where the mark sits in each phase.
const MARK_BIG = { x: SX + 200, y: SY + 250, r: 118 };
const MARK_NAV = { x: SX + 40, y: SY + 34, r: 13 };

/* ── the mark ─────────────────────────────────────────────────────────── */

function ringFill(ctx: CanvasRenderingContext2D, x: number, y: number, spin: number) {
  // Conic sweep like the real logo; linear fallback for older canvases.
  const anyCtx = ctx as CanvasRenderingContext2D & {
    createConicGradient?: (a: number, x: number, y: number) => CanvasGradient;
  };
  const g = anyCtx.createConicGradient
    ? anyCtx.createConicGradient(spin, x, y)
    : ctx.createLinearGradient(x - 100, y - 100, x + 100, y + 100);
  g.addColorStop(0, C.ember);
  g.addColorStop(0.38, C.violet);
  g.addColorStop(0.68, C.cyan);
  g.addColorStop(1, C.ember);
  return g;
}

/** The ring mark. `build` 0..1 sweeps the ring and fades in the italic "a". */
function drawMark(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, build: number, spin: number) {
  if (build <= 0) return;
  const sweep = ease(win(build, 0, 0.7)) * Math.PI * 2;
  const thick = r * 0.24;

  ctx.save();
  ctx.lineWidth = thick;
  ctx.lineCap = "round";
  ctx.strokeStyle = ringFill(ctx, x, y, spin);
  ctx.beginPath();
  ctx.arc(x, y, r - thick / 2, -Math.PI / 2, -Math.PI / 2 + sweep);
  ctx.stroke();

  const a = ease(win(build, 0.55, 1));
  if (a > 0) {
    ctx.globalAlpha = a;
    ctx.fillStyle = C.bone;
    ctx.font = `italic ${Math.round(r * 1.25)}px ${SERIF}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("a", x, y - r * 0.08);
  }
  ctx.restore();
}

/** Construction lines that precede the mark. */
function drawGuides(ctx: CanvasRenderingContext2D, t: number, alpha: number) {
  if (alpha <= 0) return;
  const { x, y, r } = MARK_BIG;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = C.guide;
  ctx.lineWidth = 1;
  ctx.setLineDash([4, 6]);

  const h = ease(win(t, 0, 0.35));
  ctx.beginPath();
  ctx.moveTo(x - r * 1.6 * h, y);
  ctx.lineTo(x + r * 1.6 * h, y);
  ctx.moveTo(x, y - r * 1.6 * h);
  ctx.lineTo(x, y + r * 1.6 * h);
  ctx.stroke();

  const circ = ease(win(t, 0.15, 0.5));
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2 * circ);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(x, y, r * 0.76, 0, Math.PI * 2 * circ);
  ctx.stroke();
  ctx.setLineDash([]);

  // dimension label
  const d = win(t, 0.35, 0.55);
  if (d > 0) {
    ctx.globalAlpha = alpha * d;
    ctx.fillStyle = C.guide;
    ctx.font = `11px ${MONO}`;
    ctx.textAlign = "center";
    ctx.fillText("ø 1.00 · ring 0.24 · x-height 0.62", x, y + r * 1.6 + 22);
  }
  ctx.restore();
}

/* ── phase 1 · brand ──────────────────────────────────────────────────── */

const PALETTE: [string, string][] = [
  ["#FF4D1F", "Ember"],
  ["#7C3AED", "Plasma"],
  ["#22D3EE", "Cyan"],
  ["#EFEAE2", "Bone"],
  ["#0A0A0A", "Ink"],
];

function drawBrandBoard(ctx: CanvasRenderingContext2D, a: number, fade: number) {
  if (fade <= 0) return;
  ctx.save();
  ctx.globalAlpha = fade;
  const px = SX + 430;

  // palette
  const pal = win(a, 0.45, 0.8);
  if (pal > 0) {
    ctx.fillStyle = C.dim;
    ctx.font = `11px ${MONO}`;
    ctx.textAlign = "left";
    ctx.fillText("PALETTE", px, SY + 120);
    PALETTE.forEach(([hex, name], i) => {
      const k = ease(win(pal, i * 0.12, i * 0.12 + 0.5));
      if (k <= 0) return;
      const cx = px + 22 + i * 64;
      const cy = SY + 160 + (1 - k) * 18;
      ctx.globalAlpha = fade * k;
      ctx.fillStyle = hex;
      ctx.beginPath();
      ctx.arc(cx, cy, 20, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,0.22)";
      ctx.stroke();
      ctx.fillStyle = C.dim;
      ctx.font = `10px ${MONO}`;
      ctx.textAlign = "center";
      ctx.fillText(name, cx, cy + 38);
    });
  }

  // type specimen
  const ty = win(a, 0.65, 1);
  if (ty > 0) {
    ctx.globalAlpha = fade * ease(ty);
    ctx.textAlign = "left";
    ctx.fillStyle = C.dim;
    ctx.font = `11px ${MONO}`;
    ctx.fillText("TYPE", px, SY + 262);
    ctx.fillStyle = C.bone;
    ctx.font = `italic 92px ${SERIF}`;
    ctx.fillText("Aa", px, SY + 352);
    ctx.font = `600 54px ${SANS}`;
    ctx.fillText("Aa", px + 128, SY + 350);
    ctx.fillStyle = C.dim;
    ctx.font = `11px ${MONO}`;
    ctx.fillText("Instrument Serif · display accents", px, SY + 384);
    ctx.fillText("Sans · body & UI", px, SY + 402);
  }
  ctx.restore();
}

/* ── phase 2 + 3 · layout ─────────────────────────────────────────────── */

type Block = { x: number; y: number; w: number; h: number; tag: string };
// Layout of the page being designed, in stage coordinates.
const BLOCKS: Block[] = [
  { x: 0, y: 0, w: SW, h: 68, tag: "NAV" },
  { x: 24, y: 104, w: SW * 0.52, h: 34, tag: "H1" },
  { x: 24, y: 148, w: SW * 0.4, h: 34, tag: "H1" },
  { x: 24, y: 206, w: SW * 0.34, h: 12, tag: "P" },
  { x: 24, y: 252, w: 168, h: 42, tag: "CTA" },
  { x: SW * 0.6, y: 96, w: SW * 0.4 - 24, h: 214, tag: "IMG" },
  { x: 24, y: 340, w: (SW - 72) / 3, h: 112, tag: "CARD" },
  { x: 48 + (SW - 72) / 3, y: 340, w: (SW - 72) / 3, h: 112, tag: "CARD" },
  { x: 72 + ((SW - 72) / 3) * 2, y: 340, w: (SW - 72) / 3, h: 112, tag: "CARD" },
];

function drawGrid(ctx: CanvasRenderingContext2D, alpha: number) {
  if (alpha <= 0) return;
  ctx.save();
  ctx.globalAlpha = alpha;
  const cols = 12;
  const gutter = 12;
  const colW = (SW - 48 - gutter * (cols - 1)) / cols;
  ctx.fillStyle = "rgba(255,77,31,0.06)";
  for (let i = 0; i < cols; i++) {
    ctx.fillRect(SX + 24 + i * (colW + gutter), SY + 68, colW, SH - 68);
  }
  ctx.restore();
}

function drawWire(ctx: CanvasRenderingContext2D, b: Block, k: number) {
  const x = SX + b.x;
  const y = SY + b.y + (1 - k) * 22;
  ctx.save();
  ctx.globalAlpha = k;
  ctx.strokeStyle = "rgba(90,209,255,0.7)";
  ctx.setLineDash([5, 5]);
  ctx.lineWidth = 1.2;
  roundRect(ctx, x, y, b.w, b.h, b.tag === "CTA" ? 21 : 10);
  ctx.stroke();
  ctx.setLineDash([]);
  if (b.tag !== "NAV") {
    ctx.fillStyle = "rgba(90,209,255,0.8)";
    ctx.font = `10px ${MONO}`;
    ctx.textAlign = "left";
    ctx.fillText(b.tag, x + 8, y + 14);
  }
  ctx.restore();
}

/** The built version of a block. */
function drawReal(ctx: CanvasRenderingContext2D, b: Block, k: number, time: number, i: number) {
  if (k <= 0) return;
  const x = SX + b.x;
  const y = SY + b.y;
  ctx.save();
  ctx.globalAlpha = ease(k);
  switch (b.tag) {
    case "NAV": {
      ctx.strokeStyle = C.line;
      ctx.beginPath();
      ctx.moveTo(x, y + b.h);
      ctx.lineTo(x + b.w, y + b.h);
      ctx.stroke();
      ctx.fillStyle = C.bone;
      ctx.font = `12px ${MONO}`;
      ctx.textAlign = "left";
      ctx.fillText("AMR/STUDIO", x + 64, y + 39);
      ctx.fillStyle = C.dim;
      ["Work", "Craft", "Contact"].forEach((l, j) => ctx.fillText(l, x + b.w - 250 + j * 74, y + 39));
      break;
    }
    case "H1": {
      ctx.fillStyle = C.bone;
      ctx.textAlign = "left";
      const first = i === 1;
      ctx.font = first ? `500 34px ${SANS}` : `italic 40px ${SERIF}`;
      ctx.fillStyle = first ? C.bone : C.ember;
      ctx.fillText(first ? "Spaces, scripted" : "into reality.", x, y + 30);
      break;
    }
    case "P": {
      ctx.fillStyle = C.faint;
      ctx.fillRect(x, y, b.w, 4);
      ctx.fillRect(x, y + 10, b.w * 0.7, 4);
      break;
    }
    case "CTA": {
      roundRect(ctx, x, y, b.w, b.h, 21);
      ctx.fillStyle = C.bone;
      ctx.fill();
      ctx.fillStyle = "#0a0a0a";
      ctx.font = `600 13px ${MONO}`;
      ctx.textAlign = "center";
      ctx.fillText("START A PROJECT", x + b.w / 2, y + 26);
      break;
    }
    case "IMG": {
      ctx.save();
      roundRect(ctx, x, y, b.w, b.h, 14);
      ctx.clip();
      ctx.fillStyle = "#0f0b14";
      ctx.fillRect(x, y, b.w, b.h);
      // drifting orb, the hero art of the built page
      const ox = x + b.w * (0.5 + 0.12 * Math.sin(time * 0.7));
      const oy = y + b.h * (0.5 + 0.1 * Math.cos(time * 0.9));
      const g = ctx.createRadialGradient(ox, oy, 4, ox, oy, b.w * 0.6);
      g.addColorStop(0, "rgba(255,77,31,0.95)");
      g.addColorStop(0.35, "rgba(124,58,237,0.55)");
      g.addColorStop(0.7, "rgba(34,211,238,0.18)");
      g.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = g;
      ctx.fillRect(x, y, b.w, b.h);
      ctx.restore();
      break;
    }
    case "CARD": {
      roundRect(ctx, x, y, b.w, b.h, 12);
      ctx.fillStyle = C.panel;
      ctx.fill();
      ctx.strokeStyle = C.line;
      ctx.stroke();
      const labels = ["01 · Web development", "02 · Design & consult", "03 · Brand identity"];
      ctx.fillStyle = C.ember;
      ctx.font = `10px ${MONO}`;
      ctx.textAlign = "left";
      ctx.fillText(labels[i - 6] ?? "", x + 14, y + 24);
      ctx.fillStyle = C.faint;
      ctx.fillRect(x + 14, y + 44, b.w * 0.7, 8);
      ctx.fillRect(x + 14, y + 60, b.w * 0.5, 8);
      ctx.fillStyle = "rgba(239,234,226,0.08)";
      ctx.fillRect(x + 14, y + 86, b.w - 28, b.h - 100);
      break;
    }
  }
  ctx.restore();
}

/* ── deploy log + cursor (phase 3) ────────────────────────────────────── */

const LOG = [
  "$ next build",
  "✓ compiled · 0 type errors",
  "✓ en + ar · rtl verified",
  "▲ deployed → production",
];

function drawLog(ctx: CanvasRenderingContext2D, c: number, time: number) {
  const k = ease(win(c, 0.35, 0.55));
  if (k <= 0) return;
  const h = 92;
  const x = SX + SW - 300;
  const y = SY + SH - h + 4 + (1 - k) * 30;
  ctx.save();
  ctx.globalAlpha = k;
  roundRect(ctx, x, y, 292, h, 12);
  ctx.fillStyle = "rgba(5,6,9,0.92)";
  ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,0.12)";
  ctx.stroke();

  // characters typed so far, across all lines
  const total = LOG.reduce((n, l) => n + l.length, 0);
  let budget = Math.round(win(c, 0.45, 0.9) * total);
  ctx.font = `11px ${MONO}`;
  ctx.textAlign = "left";
  let lastX = x + 14;
  let lastY = y + 22;
  LOG.forEach((line, i) => {
    if (budget <= 0) return;
    const shown = line.slice(0, budget);
    budget -= line.length;
    ctx.fillStyle = i === 0 ? C.dim : i === LOG.length - 1 ? C.ember : C.green;
    const ly = y + 22 + i * 19;
    ctx.fillText(shown, x + 14, ly);
    lastX = x + 14 + ctx.measureText(shown).width;
    lastY = ly;
  });
  if (Math.sin(time * 6) > 0) {
    ctx.fillStyle = C.ember;
    ctx.fillRect(lastX + 2, lastY - 10, 6, 12);
  }
  ctx.restore();
}

function drawCursor(ctx: CanvasRenderingContext2D, c: number) {
  const k = win(c, 0.55, 0.85);
  if (k <= 0) return;
  const cta = BLOCKS[4];
  const tx = SX + cta.x + cta.w * 0.62;
  const ty = SY + cta.y + cta.h * 0.6;
  const e = ease(k);
  const x = lerp(SX + SW * 0.82, tx, e);
  const y = lerp(SY + SH * 0.9, ty, e);

  ctx.save();
  // click ripple once the cursor lands
  const click = win(c, 0.86, 1);
  if (click > 0) {
    ctx.strokeStyle = `rgba(255,77,31,${0.8 * (1 - click)})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(tx, ty, 6 + click * 36, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.translate(x, y);
  ctx.fillStyle = "#ffffff";
  ctx.strokeStyle = "#000000";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(0, 22);
  ctx.lineTo(6, 16);
  ctx.lineTo(11, 27);
  ctx.lineTo(15, 25);
  ctx.lineTo(10, 15);
  ctx.lineTo(18, 15);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

/* ── chrome: tabs + phase rail ────────────────────────────────────────── */

const PHASES = [
  { no: "01", name: "Brand", file: "identity.fig" },
  { no: "02", name: "Design", file: "layout.fig" },
  { no: "03", name: "Build", file: "page.tsx" },
];

function drawChrome(ctx: CanvasRenderingContext2D, active: number, phaseP: number[]) {
  ctx.fillStyle = C.panel;
  ctx.fillRect(0, 0, CANVAS_W, TOP);
  ["#ff5f57", "#febc2e", "#28c840"].forEach((col, i) => {
    ctx.fillStyle = col;
    ctx.beginPath();
    ctx.arc(26 + i * 22, 23, 6, 0, Math.PI * 2);
    ctx.fill();
  });

  ctx.font = `13px ${MONO}`;
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  PHASES.forEach((ph, i) => {
    const x = 110 + i * 150;
    const on = i === active;
    if (on) {
      roundRect(ctx, x - 12, 9, 138, 28, 8);
      ctx.fillStyle = "rgba(255,255,255,0.06)";
      ctx.fill();
    }
    ctx.fillStyle = on ? C.bone : C.dim;
    ctx.fillText(ph.file, x, 24);
  });
  ctx.fillStyle = C.dim;
  ctx.textAlign = "right";
  ctx.fillText("amr/studio · reel", CANVAS_W - 22, 24);
  ctx.textBaseline = "alphabetic";

  // rail
  ctx.fillStyle = C.rail;
  ctx.fillRect(0, TOP, RAIL_W, CANVAS_H - TOP);
  ctx.strokeStyle = C.line;
  ctx.beginPath();
  ctx.moveTo(RAIL_W, TOP);
  ctx.lineTo(RAIL_W, CANVAS_H);
  ctx.stroke();

  const top = TOP + 60;
  const gap = 150;
  // progress spine
  ctx.fillStyle = "rgba(255,255,255,0.08)";
  ctx.fillRect(38, top, 2, gap * 2);
  const spine = (phaseP[0] + phaseP[1]) / 2; // reaches step 03 as Design completes
  ctx.fillStyle = C.ember;
  ctx.fillRect(38, top, 2, gap * 2 * spine);

  PHASES.forEach((ph, i) => {
    const y = top + i * gap;
    const done = phaseP[i] >= 1;
    const on = i === active;
    ctx.beginPath();
    ctx.arc(39, y, on ? 9 : 7, 0, Math.PI * 2);
    ctx.fillStyle = on || done ? C.ember : C.rail;
    ctx.fill();
    ctx.strokeStyle = on || done ? C.ember : C.dim;
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.textAlign = "left";
    ctx.fillStyle = on ? C.bone : C.dim;
    ctx.font = `11px ${MONO}`;
    ctx.fillText(ph.no, 62, y - 8);
    ctx.font = on ? `italic 30px ${SERIF}` : `24px ${SERIF}`;
    ctx.fillText(ph.name, 62, y + 22);
  });
}

/**
 * @param ctx   2d context of a CANVAS_W×CANVAS_H canvas
 * @param p     scroll progress 0..1 while the lid is open
 * @param time  seconds, for ambient motion only
 */
export function drawStudioReel(ctx: CanvasRenderingContext2D, p: number, time: number) {
  const a = clamp01(p / 0.36); // brand
  const b = clamp01((p - 0.33) / 0.33); // design
  const c = clamp01((p - 0.64) / 0.34); // build
  const active = c > 0 ? 2 : b > 0 ? 1 : 0;

  ctx.fillStyle = C.bg;
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

  // dot field
  ctx.fillStyle = "rgba(255,255,255,0.05)";
  for (let gx = SX; gx < CANVAS_W; gx += 28) {
    for (let gy = SY; gy < CANVAS_H; gy += 28) ctx.fillRect(gx, gy, 1.5, 1.5);
  }

  const spin = time * 0.35;

  // phase 1 — construction, mark, brand board (fading out as layout arrives)
  const boardFade = 1 - ease(win(b, 0, 0.3));
  drawGuides(ctx, a, boardFade * (1 - ease(win(a, 0.7, 1)) * 0.6));
  drawBrandBoard(ctx, a, boardFade);

  // phase 2 — grid + wireframes snapping in
  const gridA = ease(win(b, 0.15, 0.45)) * (1 - ease(win(c, 0.2, 0.5)));
  drawGrid(ctx, gridA);
  BLOCKS.forEach((blk, i) => {
    const k = ease(win(b, 0.25 + i * 0.06, 0.45 + i * 0.06));
    const built = win(c, i * 0.04, 0.3 + i * 0.04);
    if (k > 0 && built < 1) drawWire(ctx, blk, k * (1 - built));
    drawReal(ctx, blk, built, time, i);
  });

  // the mark travels from the brand board into the nav bar
  const fly = ease(win(b, 0, 0.4));
  const mx = lerp(MARK_BIG.x, MARK_NAV.x, fly);
  const my = lerp(MARK_BIG.y, MARK_NAV.y, fly);
  const mr = lerp(MARK_BIG.r, MARK_NAV.r, fly);
  drawMark(ctx, mx, my, mr, win(a, 0.2, 0.75), spin);

  // phase 3 — deploy log and the click
  drawLog(ctx, c, time);
  drawCursor(ctx, c);

  drawChrome(ctx, active, [a, b, c]);
}
