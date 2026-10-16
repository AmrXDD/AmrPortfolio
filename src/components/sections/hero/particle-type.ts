/*
 * ParticleType — the hero headline, rebuilt from thousands of points of light.
 *
 * The real <h1> stays in the DOM (transparent) and owns the layout, so the
 * words are where CSS puts them, in either language and direction. On init we
 * redraw each line into an offscreen canvas with the line's own computed font,
 * sample the ink into particle "homes", and from then on the particles are the
 * visible headline:
 *
 *   • assemble: they swirl in from a nebula and spring into the letters
 *   • cursor:   points within reach are pushed aside and glow ember
 *   • click:    a shockwave blasts the letters apart; they find their way back
 *   • scroll:   the words come undone and drift down after the comet line
 *
 * Pure 2D canvas: particles are batched into a handful of colour buckets so
 * the whole headline is a few fillStyle changes and a few thousand fillRects.
 */

type P = {
  hx: number; // home
  hy: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  c: number; // colour bucket
  heat: number; // 0..1, raised by the cursor
  seed: number;
};

export type LineSpec = { el: HTMLElement; color: "bone" | "boneSoft" | "accent" };

const ACCENT = ["255,77,31", "255,138,76", "255,176,102"];

export class ParticleType {
  private ctx: CanvasRenderingContext2D;
  private parts: P[] = [];
  private W = 0;
  private H = 0;
  private dpr = 1;
  private raf = 0;
  private running = false;
  private last = 0;
  private t = 0;
  private assembledAt = -1; // time the assemble started; -1 = still a nebula
  private mouse = { x: -9999, y: -9999, active: false };
  private scrollP = 0;
  private bone = "239,234,226";
  private size = 2;
  private onCount?: (n: number) => void;

  constructor(private canvas: HTMLCanvasElement, private host: HTMLElement, private lines: LineSpec[], opts: { onCount?: (n: number) => void } = {}) {
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("2d unavailable");
    this.ctx = ctx;
    this.onCount = opts.onCount;
  }

  /** (Re)sample the headline into particles. Keeps current positions when it can. */
  async build() {
    await document.fonts?.ready;
    const rect = this.host.getBoundingClientRect();
    this.W = Math.round(rect.width);
    this.H = Math.round(rect.height);
    this.dpr = Math.min(2, window.devicePixelRatio || 1);
    this.canvas.width = Math.round(this.W * this.dpr);
    this.canvas.height = Math.round(this.H * this.dpr);
    this.canvas.style.width = `${this.W}px`;
    this.canvas.style.height = `${this.H}px`;
    this.bone = (getComputedStyle(document.documentElement).getPropertyValue("--bone-rgb").trim() || "239 234 226").split(/\s+/).join(",");

    // draw each line where the DOM put it, in its own font
    const off = document.createElement("canvas");
    off.width = this.W;
    off.height = this.H;
    const o = off.getContext("2d", { willReadFrequently: true })!;
    const homes: { x: number; y: number; c: number }[] = [];
    const mobile = this.W < 768;
    const budget = mobile ? 2600 : 6200;

    // first pass: measure total ink to choose a sampling step that fits the budget
    const inks: { data: Uint8ClampedArray; c: number }[] = [];
    let ink = 0;
    for (const line of this.lines) {
      o.clearRect(0, 0, this.W, this.H);
      const cs = getComputedStyle(line.el);
      const r = line.el.getBoundingClientRect();
      const size = parseFloat(cs.fontSize);
      o.font = `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
      const ls = (o as CanvasRenderingContext2D & { letterSpacing?: string });
      if ("letterSpacing" in o) ls.letterSpacing = cs.letterSpacing === "normal" ? "0px" : cs.letterSpacing;
      const rtl = cs.direction === "rtl";
      o.direction = rtl ? "rtl" : "ltr";
      o.textAlign = rtl ? "right" : "left";
      o.textBaseline = "alphabetic";
      const text = line.el.textContent ?? "";
      const m = o.measureText(text);
      const asc = m.fontBoundingBoxAscent ?? size * 0.8;
      const desc = m.fontBoundingBoxDescent ?? size * 0.2;
      const y = r.top - rect.top + (r.height - (asc + desc)) / 2 + asc;
      const x = rtl ? r.right - rect.left : r.left - rect.left;
      o.fillStyle = "#fff";
      o.fillText(text, x, y);
      const data = o.getImageData(0, 0, this.W, this.H).data;
      for (let i = 3; i < data.length; i += 16) if (data[i] > 128) ink++;
      inks.push({ data, c: line.color === "accent" ? 2 : line.color === "boneSoft" ? 1 : 0 });
    }
    // ink was counted on a 4-px stride; pick a step so step² × points ≈ ink area
    const area = ink * 4;
    const step = Math.max(2, Math.round(Math.sqrt(area / budget)));
    this.size = Math.max(1.4, step * 0.62);
    for (const { data, c } of inks) {
      for (let y = 0; y < this.H; y += step) {
        for (let x = 0; x < this.W; x += step) {
          if (data[(y * this.W + x) * 4 + 3] > 128) homes.push({ x, y, c });
        }
      }
    }

    // keep existing particles flowing to their new homes on resize
    const old = this.parts;
    this.parts = homes.map((h, i) => {
      const prev = old[i];
      const ang = Math.random() * Math.PI * 2;
      const rad = (0.15 + Math.random() * 0.35) * Math.max(this.W, this.H);
      return {
        hx: h.x,
        hy: h.y,
        // nebula start: a loose ring where the old orb sat
        x: prev ? prev.x : this.W * 0.72 + Math.cos(ang) * rad,
        y: prev ? prev.y : this.H * 0.42 + Math.sin(ang) * rad * 0.6,
        vx: prev ? prev.vx : -Math.sin(ang) * 2,
        vy: prev ? prev.vy : Math.cos(ang) * 2,
        c: h.c === 2 ? 2 + ((Math.random() * 3) | 0) : h.c,
        heat: 0,
        seed: Math.random(),
      };
    });
    this.onCount?.(this.parts.length);
  }

  /** Re-read the theme colour without re-sampling. */
  recolor() {
    this.bone = (getComputedStyle(document.documentElement).getPropertyValue("--bone-rgb").trim() || "239 234 226").split(/\s+/).join(",");
  }

  /** Begin the swirl-in. */
  assemble() {
    if (this.assembledAt < 0) this.assembledAt = this.t;
  }

  pointer(x: number, y: number, active: boolean) {
    this.mouse.x = x;
    this.mouse.y = y;
    this.mouse.active = active;
  }

  /** A shockwave from (x, y). */
  blast(x: number, y: number) {
    for (const p of this.parts) {
      const dx = p.x - x;
      const dy = p.y - y;
      const d = Math.hypot(dx, dy) || 1;
      if (d > 260) continue;
      const f = (1 - d / 260) * 22;
      p.vx += (dx / d) * f + (Math.random() - 0.5) * 4;
      p.vy += (dy / d) * f + (Math.random() - 0.5) * 4;
      p.heat = 1;
    }
  }

  /** 0 at the top of the hero, 1 once it has scrolled away. */
  scroll(p: number) {
    this.scrollP = Math.max(0, Math.min(1, p));
  }

  start() {
    if (this.running) return;
    this.running = true;
    this.last = performance.now();
    const loop = (now: number) => {
      if (!this.running) return;
      this.raf = requestAnimationFrame(loop);
      const dt = Math.min(0.05, (now - this.last) / 1000);
      this.last = now;
      this.t += dt;
      this.step(dt);
      this.draw();
    };
    this.raf = requestAnimationFrame(loop);
  }

  stop() {
    this.running = false;
    cancelAnimationFrame(this.raf);
  }

  private step(dt: number) {
    const f = dt * 60;
    // The assemble takes ~2.4s: the pull eases in (cubic) while a sideways
    // swirl fades out, so the points spiral into the letters instead of
    // snapping straight to them. Damping tightens as they arrive.
    const since = this.assembledAt < 0 ? -1 : this.t - this.assembledAt;
    const a = since < 0 ? 0 : Math.min(1, since / 2.4);
    const ease = a * a * (3 - 2 * a);
    const k = since < 0 ? 0 : 0.0015 + ease ** 3 * 0.055;
    const swirl = since < 0 ? 0 : (1 - ease) * 0.045;
    const damp = Math.pow(since < 0 ? 0.995 : 0.955 - ease * 0.095, f);
    const sp = this.scrollP;
    const reach = 120;
    const { x: mx, y: my, active } = this.mouse;

    for (const p of this.parts) {
      // scroll undoes the words: homes sink and spread, each at its own pace
      const fall = sp * sp * (0.6 + p.seed) * this.H * 0.9;
      const hx = p.hx + (p.seed - 0.5) * sp * 260;
      const hy = p.hy + fall;

      if (since < 0) {
        // nebula: a slow orbit around the old orb position
        const cx = this.W * 0.72;
        const cy = this.H * 0.42;
        const dx = p.x - cx;
        const dy = p.y - cy;
        p.vx += (-dy * 0.0009 - dx * 0.0002) * f;
        p.vy += (dx * 0.0009 - dy * 0.0002) * f;
      } else {
        const dx = hx - p.x;
        const dy = hy - p.y;
        p.vx += (dx * k - dy * swirl * (0.6 + p.seed * 0.8)) * f;
        p.vy += (dy * k + dx * swirl * (0.6 + p.seed * 0.8)) * f;
      }

      if (active) {
        const dx = p.x - mx;
        const dy = p.y - my;
        const d2 = dx * dx + dy * dy;
        if (d2 < reach * reach) {
          const d = Math.sqrt(d2) || 1;
          const push = (1 - d / reach) * 2.4 * f;
          p.vx += (dx / d) * push;
          p.vy += (dy / d) * push;
          p.heat = Math.min(1, p.heat + 0.25 * f);
        }
      }

      // a faint living shimmer once settled
      p.vx += Math.sin(this.t * 1.3 + p.seed * 40) * 0.012 * f;
      p.vy += Math.cos(this.t * 1.1 + p.seed * 30) * 0.012 * f;

      p.vx *= damp;
      p.vy *= damp;
      p.x += p.vx * f;
      p.y += p.vy * f;
      p.heat *= Math.pow(0.96, f);
    }
  }

  private draw() {
    const { ctx } = this;
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.clearRect(0, 0, this.W, this.H);
    const s = this.size;
    const fade = Math.max(0, 1 - this.scrollP * 1.15);
    if (fade <= 0) return;

    // bucket 0 bone · 1 soft bone · 2-4 accent ramp · 5 heated (ember)
    const buckets: P[][] = [[], [], [], [], [], []];
    for (const p of this.parts) buckets[p.heat > 0.35 ? 5 : p.c].push(p);
    const colors = [
      `rgba(${this.bone},${0.95 * fade})`,
      `rgba(${this.bone},${0.72 * fade})`,
      `rgba(${ACCENT[0]},${fade})`,
      `rgba(${ACCENT[1]},${fade})`,
      `rgba(${ACCENT[2]},${fade})`,
      `rgba(255,96,48,${fade})`,
    ];
    for (let b = 0; b < buckets.length; b++) {
      const list = buckets[b];
      if (!list.length) continue;
      ctx.fillStyle = colors[b];
      for (const p of list) ctx.fillRect(p.x - s / 2, p.y - s / 2, s, s);
    }
  }

  dispose() {
    this.stop();
    this.parts = [];
  }
}
