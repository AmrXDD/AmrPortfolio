/*
 * EmberFluid — the hero headline, burning.
 *
 * A real-time fluid simulation (Navier–Stokes on the GPU: advection,
 * vorticity confinement, a pressure solve) where the headline's letters are
 * the fuel. Every frame the letter shapes inject heat and upward velocity,
 * heat keeps rising on its own (buoyancy), and the result is drawn through
 * a fire palette: violet smoke → ember → gold → white-hot. The letters
 * themselves stay crisp because the display pass reads the full-resolution
 * letter mask, not the low-resolution simulation.
 *
 *   • ignite():  a fuse runs along the title and each letter catches
 *   • pointer:   moving stirs the smoke (velocity + a little heat)
 *   • blast():   a fireball pushed outward from the click
 *   • scroll():  the letters stop burning and the smoke carries them away
 *
 * WebGL2 + renderable half-float textures are required; the constructor
 * throws if they are missing so the caller can fall back.
 */

type FBO = { tex: WebGLTexture; fbo: WebGLFramebuffer; w: number; h: number; attach: (id: number) => number };
type DoubleFBO = { w: number; h: number; read: FBO; write: FBO; swap: () => void };

export type EmberLine = { el: HTMLElement; heat: number };

const VERT = `#version 300 es
precision highp float;
in vec2 aPosition;
out vec2 vUv; out vec2 vL; out vec2 vR; out vec2 vT; out vec2 vB;
uniform vec2 texelSize;
void main () {
  vUv = aPosition * 0.5 + 0.5;
  vL = vUv - vec2(texelSize.x, 0.0);
  vR = vUv + vec2(texelSize.x, 0.0);
  vT = vUv + vec2(0.0, texelSize.y);
  vB = vUv - vec2(0.0, texelSize.y);
  gl_Position = vec4(aPosition, 0.0, 1.0);
}`;

const HEAD = `#version 300 es
precision highp float;
precision highp sampler2D;
in vec2 vUv; in vec2 vL; in vec2 vR; in vec2 vT; in vec2 vB;
out vec4 fragColor;
`;

const CLEAR = `${HEAD}
uniform sampler2D uTexture; uniform float value;
void main () { fragColor = value * texture(uTexture, vUv); }`;

const SPLAT = `${HEAD}
uniform sampler2D uTarget; uniform float aspectRatio; uniform vec3 color; uniform vec2 point; uniform float radius;
void main () {
  vec2 p = vUv - point; p.x *= aspectRatio;
  vec3 s = exp(-dot(p, p) / radius) * color;
  fragColor = vec4(texture(uTarget, vUv).xyz + s, 1.0);
}`;

// the letters as fuel: heat into the dye, lift (with a flicker) into the velocity
const SOURCE = `${HEAD}
uniform sampler2D uTarget; uniform sampler2D uMask;
uniform float heat; uniform float lift; uniform float time; uniform float isVel;
uniform float sweep; uniform float rtl;
void main () {
  vec4 base = texture(uTarget, vUv);
  float m = texture(uMask, vUv).r;
  // the fuse: only what it has passed is burning, and its front burns hottest
  float x = rtl > 0.5 ? 1.0 - vUv.x : vUv.x;
  float lit = smoothstep(sweep + 0.01, sweep - 0.01, x);
  float front = exp(-pow((x - sweep) * 26.0, 2.0)) * step(sweep, 1.0);
  m = m * (lit + front * 2.5);
  if (isVel > 0.5) {
    float n = sin(vUv.x * 91.0 + time * 3.7) * 0.6 + sin(vUv.x * 37.0 - time * 2.3 + vUv.y * 23.0) * 0.4;
    fragColor = vec4(base.xy + vec2(n * lift * 0.35, lift) * m, 0.0, 1.0);
  } else {
    fragColor = vec4(base.xyz + vec3(heat) * m, 1.0);
  }
}`;

// hot fluid keeps rising after it leaves the letters
const BUOYANCY = `${HEAD}
uniform sampler2D uVelocity; uniform sampler2D uDye; uniform float k; uniform float dt;
void main () {
  vec2 v = texture(uVelocity, vUv).xy;
  float h = texture(uDye, vUv).r;
  fragColor = vec4(v + vec2(0.0, h * k * dt), 0.0, 1.0);
}`;

const ADVECT = `${HEAD}
uniform sampler2D uVelocity; uniform sampler2D uSource; uniform vec2 texelSize; uniform float dt; uniform float dissipation;
void main () {
  vec2 coord = vUv - dt * texture(uVelocity, vUv).xy * texelSize;
  fragColor = texture(uSource, coord) / (1.0 + dissipation * dt);
}`;

const DIVERGENCE = `${HEAD}
uniform sampler2D uVelocity;
void main () {
  float L = texture(uVelocity, vL).x; float R = texture(uVelocity, vR).x;
  float T = texture(uVelocity, vT).y; float B = texture(uVelocity, vB).y;
  vec2 C = texture(uVelocity, vUv).xy;
  if (vL.x < 0.0) { L = -C.x; } if (vR.x > 1.0) { R = -C.x; }
  if (vT.y > 1.0) { T = -C.y; } if (vB.y < 0.0) { B = -C.y; }
  fragColor = vec4(0.5 * (R - L + T - B), 0.0, 0.0, 1.0);
}`;

const CURL = `${HEAD}
uniform sampler2D uVelocity;
void main () {
  float L = texture(uVelocity, vL).y; float R = texture(uVelocity, vR).y;
  float T = texture(uVelocity, vT).x; float B = texture(uVelocity, vB).x;
  fragColor = vec4(0.5 * (R - L - T + B), 0.0, 0.0, 1.0);
}`;

const VORTICITY = `${HEAD}
uniform sampler2D uVelocity; uniform sampler2D uCurl; uniform float curl; uniform float dt;
void main () {
  float L = texture(uCurl, vL).x; float R = texture(uCurl, vR).x;
  float T = texture(uCurl, vT).x; float B = texture(uCurl, vB).x;
  float C = texture(uCurl, vUv).x;
  vec2 force = 0.5 * vec2(abs(T) - abs(B), abs(R) - abs(L));
  force /= length(force) + 0.0001;
  force *= curl * C; force.y *= -1.0;
  vec2 v = texture(uVelocity, vUv).xy + force * dt;
  fragColor = vec4(clamp(v, -1000.0, 1000.0), 0.0, 1.0);
}`;

const PRESSURE = `${HEAD}
uniform sampler2D uPressure; uniform sampler2D uDivergence;
void main () {
  float L = texture(uPressure, vL).x; float R = texture(uPressure, vR).x;
  float T = texture(uPressure, vT).x; float B = texture(uPressure, vB).x;
  float d = texture(uDivergence, vUv).x;
  fragColor = vec4((L + R + B + T - d) * 0.25, 0.0, 0.0, 1.0);
}`;

const GRADIENT = `${HEAD}
uniform sampler2D uPressure; uniform sampler2D uVelocity;
void main () {
  float L = texture(uPressure, vL).x; float R = texture(uPressure, vR).x;
  float T = texture(uPressure, vT).x; float B = texture(uPressure, vB).x;
  vec2 v = texture(uVelocity, vUv).xy - vec2(R - L, T - B);
  fragColor = vec4(v, 0.0, 1.0);
}`;

// heat → fire. Letters read from the full-resolution mask so they stay sharp.
const DISPLAY = `${HEAD}
uniform sampler2D uTexture; uniform sampler2D uMask;
uniform float core; uniform float time; uniform float sweep; uniform float rtl;
vec3 ramp (float t) {
  vec3 c0 = vec3(0.0);
  vec3 c1 = vec3(0.17, 0.035, 0.24);
  vec3 c2 = vec3(0.62, 0.07, 0.05);
  vec3 c3 = vec3(1.0, 0.30, 0.12);
  vec3 c4 = vec3(1.0, 0.66, 0.36);
  vec3 c5 = vec3(1.0, 0.96, 0.88);
  if (t < 0.16) return mix(c0, c1, t / 0.16);
  if (t < 0.36) return mix(c1, c2, (t - 0.16) / 0.20);
  if (t < 0.60) return mix(c2, c3, (t - 0.36) / 0.24);
  if (t < 0.82) return mix(c3, c4, (t - 0.60) / 0.22);
  return mix(c4, c5, (t - 0.82) / 0.18);
}
void main () {
  float h = texture(uTexture, vUv).r;
  float x = rtl > 0.5 ? 1.0 - vUv.x : vUv.x;
  float lit = smoothstep(sweep + 0.004, sweep - 0.004, x);
  float m = texture(uMask, vUv).r * core * lit;
  float t = clamp(1.0 - exp(-(h * 1.15)), 0.0, 1.0);
  vec3 col = ramp(t);
  float a = clamp(t * 1.5, 0.0, 1.0);
  // the letters: a hot core that breathes a little
  float flick = 0.05 * sin(time * 8.0 + vUv.x * 47.0) + 0.03 * sin(time * 13.0 + vUv.y * 61.0);
  vec3 hot = ramp(clamp(0.74 + 0.22 * m + flick, 0.0, 1.0));
  col = mix(col, hot, clamp(m, 0.0, 1.0));
  a = max(a, clamp(m, 0.0, 1.0));
  fragColor = vec4(col * a, a);
}`;

export class EmberFluid {
  private gl: WebGL2RenderingContext;
  private programs: Record<string, { prog: WebGLProgram; u: Record<string, WebGLUniformLocation | null> }> = {};
  private velocity!: DoubleFBO;
  private dye!: DoubleFBO;
  private divergence!: FBO;
  private curlFbo!: FBO;
  private pressure!: DoubleFBO;
  private mask: WebGLTexture;
  private raf = 0;
  private running = false;
  private last = 0;
  private time = 0;
  private sweep = -0.1; // fuse position, 0..1 across the title (−: not lit)
  private igniteAt = -1;
  private scrollP = 0;
  private pointerPrev: { x: number; y: number } | null = null;
  private splats: { x: number; y: number; dx: number; dy: number; heat: number; r: number }[] = [];
  private rtl = false;
  private cssW = 1;
  private cssH = 1;
  private mobile: boolean;
  private cfg: { sim: number; dye: number; iters: number; dpr: number };

  constructor(private canvas: HTMLCanvasElement, private host: HTMLElement, private lines: EmberLine[]) {
    const gl = canvas.getContext("webgl2", { alpha: true, premultipliedAlpha: true, depth: false, stencil: false, antialias: false, powerPreference: "high-performance" });
    if (!gl) throw new Error("webgl2 unavailable");
    if (!gl.getExtension("EXT_color_buffer_float") && !gl.getExtension("EXT_color_buffer_half_float")) throw new Error("no float render targets");
    this.gl = gl;
    this.mobile = window.matchMedia("(max-width: 767px)").matches;
    this.cfg = this.mobile ? { sim: 80, dye: 512, iters: 14, dpr: 1 } : { sim: 128, dye: 1024, iters: 20, dpr: Math.min(1.5, window.devicePixelRatio || 1) };

    // full-screen triangle pair
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, -1, 1, 1, 1, 1, -1]), gl.STATIC_DRAW);
    const ibuf = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibuf);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array([0, 1, 2, 0, 2, 3]), gl.STATIC_DRAW);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(0);

    const vs = this.shader(gl.VERTEX_SHADER, VERT);
    const defs: Record<string, string> = { clear: CLEAR, splat: SPLAT, source: SOURCE, buoyancy: BUOYANCY, advect: ADVECT, divergence: DIVERGENCE, curl: CURL, vorticity: VORTICITY, pressure: PRESSURE, gradient: GRADIENT, display: DISPLAY };
    for (const [name, src] of Object.entries(defs)) {
      const prog = gl.createProgram()!;
      gl.attachShader(prog, vs);
      gl.attachShader(prog, this.shader(gl.FRAGMENT_SHADER, src));
      gl.bindAttribLocation(prog, 0, "aPosition");
      gl.linkProgram(prog);
      if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(`link ${name}: ${gl.getProgramInfoLog(prog)}`);
      const u: Record<string, WebGLUniformLocation | null> = {};
      const n = gl.getProgramParameter(prog, gl.ACTIVE_UNIFORMS) as number;
      for (let i = 0; i < n; i++) {
        const info = gl.getActiveUniform(prog, i);
        if (info) u[info.name] = gl.getUniformLocation(prog, info.name);
      }
      this.programs[name] = { prog, u };
    }

    this.mask = gl.createTexture()!;
    this.resize();
  }

  private shader(type: number, src: string) {
    const gl = this.gl;
    const s = gl.createShader(type)!;
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s) || "shader");
    return s;
  }

  private fbo(w: number, h: number, internal: number, format: number): FBO {
    const gl = this.gl;
    const tex = gl.createTexture()!;
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, internal, w, h, 0, format, gl.HALF_FLOAT, null);
    const fbo = gl.createFramebuffer()!;
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
    if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) throw new Error("fbo incomplete");
    gl.viewport(0, 0, w, h);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    return {
      tex,
      fbo,
      w,
      h,
      attach: (id: number) => {
        gl.activeTexture(gl.TEXTURE0 + id);
        gl.bindTexture(gl.TEXTURE_2D, tex);
        return id;
      },
    };
  }

  private double(w: number, h: number, internal: number, format: number): DoubleFBO {
    let a = this.fbo(w, h, internal, format);
    let b = this.fbo(w, h, internal, format);
    return {
      w,
      h,
      get read() {
        return a;
      },
      get write() {
        return b;
      },
      swap() {
        const t = a;
        a = b;
        b = t;
      },
    } as DoubleFBO;
  }

  private res(n: number) {
    const w = this.gl.drawingBufferWidth;
    const h = this.gl.drawingBufferHeight;
    let aspect = w / h;
    if (aspect < 1) aspect = 1 / aspect;
    const min = Math.round(n);
    const max = Math.round(n * aspect);
    return w > h ? { w: max, h: min } : { w: min, h: max };
  }

  /** Size the canvas and the simulation to the hero. Re-draws the letters. */
  resize() {
    const gl = this.gl;
    const r = this.host.getBoundingClientRect();
    this.cssW = Math.max(1, r.width);
    this.cssH = Math.max(1, r.height);
    const w = Math.max(1, Math.round(r.width * this.cfg.dpr));
    const h = Math.max(1, Math.round(r.height * this.cfg.dpr));
    if (this.canvas.width !== w || this.canvas.height !== h || !this.velocity) {
      this.canvas.width = w;
      this.canvas.height = h;
      this.canvas.style.width = `${r.width}px`;
      this.canvas.style.height = `${r.height}px`;
      const s = this.res(this.cfg.sim);
      const d = this.res(this.cfg.dye);
      this.velocity = this.double(s.w, s.h, gl.RG16F, gl.RG);
      this.dye = this.double(d.w, d.h, gl.R16F, gl.RED);
      this.divergence = this.fbo(s.w, s.h, gl.R16F, gl.RED);
      this.curlFbo = this.fbo(s.w, s.h, gl.R16F, gl.RED);
      this.pressure = this.double(s.w, s.h, gl.R16F, gl.RED);
    }
    this.drawMask();
  }

  /** The letters, where the DOM put them, as a fuel mask (red = heat). */
  drawMask() {
    const gl = this.gl;
    const host = this.host.getBoundingClientRect();
    const W = Math.round(host.width);
    const H = Math.round(host.height);
    const off = document.createElement("canvas");
    off.width = W;
    off.height = H;
    const o = off.getContext("2d")!;
    o.fillStyle = "#000";
    o.fillRect(0, 0, W, H);
    let rtl = false;
    for (const line of this.lines) {
      const cs = getComputedStyle(line.el);
      const r = line.el.getBoundingClientRect();
      const size = parseFloat(cs.fontSize);
      o.font = `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
      const ls = o as CanvasRenderingContext2D & { letterSpacing?: string };
      if ("letterSpacing" in o) ls.letterSpacing = cs.letterSpacing === "normal" ? "0px" : cs.letterSpacing;
      rtl = cs.direction === "rtl";
      o.direction = rtl ? "rtl" : "ltr";
      o.textAlign = rtl ? "right" : "left";
      o.textBaseline = "alphabetic";
      const text = line.el.textContent ?? "";
      const m = o.measureText(text);
      const asc = m.fontBoundingBoxAscent ?? size * 0.8;
      const desc = m.fontBoundingBoxDescent ?? size * 0.2;
      const y = r.top - host.top + (r.height - (asc + desc)) / 2 + asc;
      const x = rtl ? r.right - host.left : r.left - host.left;
      const v = Math.round(255 * line.heat);
      o.fillStyle = `rgb(${v},${v},${v})`;
      o.fillText(text, x, y);
    }
    this.rtl = rtl;
    gl.bindTexture(gl.TEXTURE_2D, this.mask);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, off);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  }

  /** Light the fuse. */
  ignite() {
    // wall clock, so the fuse takes the same time on a slow machine
    if (this.igniteAt < 0) this.igniteAt = performance.now();
  }

  pointer(x: number, y: number, active: boolean) {
    if (!active) {
      this.pointerPrev = null;
      return;
    }
    const p = this.pointerPrev;
    this.pointerPrev = { x, y };
    if (!p) return;
    const dx = x - p.x;
    const dy = y - p.y;
    if (Math.abs(dx) + Math.abs(dy) < 0.5) return;
    this.splats.push({ x, y, dx: dx * 9, dy: -dy * 9, heat: 0.05, r: 0.0022 });
  }

  /** A fireball pushed out from (x, y). */
  blast(x: number, y: number) {
    const n = 10;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      this.splats.push({ x: x + Math.cos(a) * 6, y: y + Math.sin(a) * 6, dx: Math.cos(a) * 900, dy: -Math.sin(a) * 900, heat: 0.0, r: 0.0016 });
    }
    this.splats.push({ x, y, dx: 0, dy: 300, heat: 2.2, r: 0.006 });
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
      const dt = Math.max(0, Math.min(0.0167, (now - this.last) / 1000));
      this.last = now;
      this.time += dt;
      this.step(dt);
      this.render();
    };
    this.raf = requestAnimationFrame(loop);
  }

  stop() {
    this.running = false;
    cancelAnimationFrame(this.raf);
  }

  private use(name: string) {
    const p = this.programs[name];
    this.gl.useProgram(p.prog);
    return p.u;
  }

  private blit(target: FBO | null) {
    const gl = this.gl;
    if (target) {
      gl.viewport(0, 0, target.w, target.h);
      gl.bindFramebuffer(gl.FRAMEBUFFER, target.fbo);
    } else {
      gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    }
    gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);
  }

  private splat(x: number, y: number, dx: number, dy: number, heat: number, r: number) {
    const gl = this.gl;
    const aspect = this.canvas.width / this.canvas.height;
    let u = this.use("splat");
    gl.uniform1i(u.uTarget, this.velocity.read.attach(0));
    gl.uniform1f(u.aspectRatio, aspect);
    gl.uniform2f(u.point, x, y);
    gl.uniform3f(u.color, dx, dy, 0);
    gl.uniform1f(u.radius, r * (aspect > 1 ? 1 : aspect));
    this.blit(this.velocity.write);
    this.velocity.swap();
    if (heat > 0) {
      u = this.use("splat");
      gl.uniform1i(u.uTarget, this.dye.read.attach(0));
      gl.uniform1f(u.aspectRatio, aspect);
      gl.uniform2f(u.point, x, y);
      gl.uniform3f(u.color, heat, 0, 0);
      gl.uniform1f(u.radius, r * 1.4);
      this.blit(this.dye.write);
      this.dye.swap();
    }
  }

  private step(dt: number) {
    const gl = this.gl;
    gl.disable(gl.BLEND);
    const sp = this.scrollP;

    // the fuse: ~1.3s across the title after ignition
    if (this.igniteAt >= 0) this.sweep = Math.min(1.2, (performance.now() - this.igniteAt) / 1300);
    const burning = Math.max(0, 1 - sp * 2.2); // the letters stop feeding the fire as you scroll

    // pointer + click splats (screen px → uv)
    // (sizes are cached on resize: no layout reads inside the frame)
    for (const s of this.splats.splice(0)) this.splat(s.x / this.cssW, 1 - s.y / this.cssH, s.dx, s.dy, s.heat, s.r);

    // the letters feed the fire
    if (this.sweep > 0 && burning > 0) {
      let u = this.use("source");
      gl.uniform1i(u.uTarget, this.dye.read.attach(0));
      gl.uniform1i(u.uMask, this.attachMask(1));
      gl.uniform1f(u.heat, (this.mobile ? 2.6 : 2.2) * dt * burning);
      gl.uniform1f(u.lift, 0);
      gl.uniform1f(u.time, this.time);
      gl.uniform1f(u.isVel, 0);
      gl.uniform1f(u.sweep, this.sweep);
      gl.uniform1f(u.rtl, this.rtl ? 1 : 0);
      this.blit(this.dye.write);
      this.dye.swap();

      u = this.use("source");
      gl.uniform1i(u.uTarget, this.velocity.read.attach(0));
      gl.uniform1i(u.uMask, this.attachMask(1));
      gl.uniform1f(u.heat, 0);
      gl.uniform1f(u.lift, 380 * dt * burning);
      gl.uniform1f(u.time, this.time);
      gl.uniform1f(u.isVel, 1);
      gl.uniform1f(u.sweep, this.sweep);
      gl.uniform1f(u.rtl, this.rtl ? 1 : 0);
      this.blit(this.velocity.write);
      this.velocity.swap();
    }

    // heat rises (harder as the page scrolls, carrying the title away)
    let u = this.use("buoyancy");
    gl.uniform1i(u.uVelocity, this.velocity.read.attach(0));
    gl.uniform1i(u.uDye, this.dye.read.attach(1));
    gl.uniform1f(u.k, 70 + sp * 260);
    gl.uniform1f(u.dt, dt);
    this.blit(this.velocity.write);
    this.velocity.swap();

    const vt = [1 / this.velocity.w, 1 / this.velocity.h];

    u = this.use("curl");
    gl.uniform2f(u.texelSize, vt[0], vt[1]);
    gl.uniform1i(u.uVelocity, this.velocity.read.attach(0));
    this.blit(this.curlFbo);

    u = this.use("vorticity");
    gl.uniform2f(u.texelSize, vt[0], vt[1]);
    gl.uniform1i(u.uVelocity, this.velocity.read.attach(0));
    gl.uniform1i(u.uCurl, this.curlFbo.attach(1));
    gl.uniform1f(u.curl, 26);
    gl.uniform1f(u.dt, dt);
    this.blit(this.velocity.write);
    this.velocity.swap();

    u = this.use("divergence");
    gl.uniform2f(u.texelSize, vt[0], vt[1]);
    gl.uniform1i(u.uVelocity, this.velocity.read.attach(0));
    this.blit(this.divergence);

    u = this.use("clear");
    gl.uniform1i(u.uTexture, this.pressure.read.attach(0));
    gl.uniform1f(u.value, 0.8);
    this.blit(this.pressure.write);
    this.pressure.swap();

    u = this.use("pressure");
    gl.uniform2f(u.texelSize, vt[0], vt[1]);
    gl.uniform1i(u.uDivergence, this.divergence.attach(0));
    for (let i = 0; i < this.cfg.iters; i++) {
      gl.uniform1i(u.uPressure, this.pressure.read.attach(1));
      this.blit(this.pressure.write);
      this.pressure.swap();
    }

    u = this.use("gradient");
    gl.uniform2f(u.texelSize, vt[0], vt[1]);
    gl.uniform1i(u.uPressure, this.pressure.read.attach(0));
    gl.uniform1i(u.uVelocity, this.velocity.read.attach(1));
    this.blit(this.velocity.write);
    this.velocity.swap();

    u = this.use("advect");
    gl.uniform2f(u.texelSize, vt[0], vt[1]);
    gl.uniform1i(u.uVelocity, this.velocity.read.attach(0));
    gl.uniform1i(u.uSource, this.velocity.read.attach(0));
    gl.uniform1f(u.dt, dt);
    gl.uniform1f(u.dissipation, 0.25);
    this.blit(this.velocity.write);
    this.velocity.swap();

    u = this.use("advect");
    gl.uniform2f(u.texelSize, vt[0], vt[1]);
    gl.uniform1i(u.uVelocity, this.velocity.read.attach(0));
    gl.uniform1i(u.uSource, this.dye.read.attach(1));
    gl.uniform1f(u.dt, dt);
    gl.uniform1f(u.dissipation, 0.9 + sp * 1.5);
    this.blit(this.dye.write);
    this.dye.swap();
  }

  private attachMask(id: number) {
    const gl = this.gl;
    gl.activeTexture(gl.TEXTURE0 + id);
    gl.bindTexture(gl.TEXTURE_2D, this.mask);
    return id;
  }

  private render() {
    const gl = this.gl;
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    const u = this.use("display");
    gl.uniform1i(u.uTexture, this.dye.read.attach(0));
    gl.uniform1i(u.uMask, this.attachMask(1));
    gl.uniform1f(u.core, Math.max(0, 1 - this.scrollP * 2.4));
    gl.uniform1f(u.time, this.time);
    gl.uniform1f(u.sweep, this.sweep);
    gl.uniform1f(u.rtl, this.rtl ? 1 : 0);
    this.blit(null);
  }

  dispose() {
    this.stop();
    const lose = this.gl.getExtension("WEBGL_lose_context");
    lose?.loseContext();
  }
}
