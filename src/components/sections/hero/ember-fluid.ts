/*
 * EmberFluid — the hero headline, burning.
 *
 * A real-time fluid simulation (Navier–Stokes on the GPU: advection,
 * vorticity confinement, a pressure solve) where the headline's letters are
 * the fuel. Every frame the letter shapes inject heat and upward velocity,
 * heat keeps rising on its own (buoyancy), and the result is drawn through
 * a fire palette: violet smoke → ember → gold → white-hot. On top of that:
 *
 *   • bloom:      the hottest light bleeds into the dark around it
 *   • embers:     thousands of sparks shed by the letters, carried by the
 *                 simulated airflow (they swirl around the cursor)
 *   • volume:     the smoke is shaded from the slope of the heat field
 *   • heat haze:  the fire shimmers where the air is hottest
 *   • letters:    crisp (full-resolution mask) with white-hot edges
 *   • wind:       a soft breeze now and then so it is never still
 *
 * Interaction: lighter() carries a small real flame (the hero animates a
 * lighter and feeds its nozzle position in); ignite(x, y) catches the
 * title at that point and the fire spreads outward, softly and unevenly,
 * like flame across paper; the pointer stirs the air (no heat of its own);
 * blast() puffs warm air; scroll() lets the letters burn out.
 *
 * Tuned calm for light-sensitive eyes: no fast flicker anywhere (every
 * oscillation is slow), warm gold rather than white-hot, gentle bloom,
 * unhurried smoke.
 *
 * WebGL2 + renderable float textures are required; the constructor throws
 * if they are missing so the caller can fall back.
 */

type FBO = { tex: WebGLTexture; fbo: WebGLFramebuffer; w: number; h: number; attach: (id: number) => number };
type DoubleFBO = { w: number; h: number; read: FBO; write: FBO; swap: () => void };

/** A headline line; `bar` also burns an underline beneath it. */
export type EmberLine = { el: HTMLElement; heat: number; bar?: boolean };

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

// the title catches from one point and the fire spreads outward with an
// irregular, paper-like front
const SPREAD = `
uniform vec2 igP; uniform float igR; uniform float aspect;
float spreadD (vec2 uv) {
  vec2 d = uv - igP; d.x *= aspect;
  float n = sin(uv.x * 23.0 + uv.y * 17.0) * 0.014 + sin(uv.x * 51.0 - uv.y * 37.0) * 0.009;
  return length(d) + n;
}
float litAt (vec2 uv) { return smoothstep(igR, igR - 0.08, spreadD(uv)); }
float frontAt (vec2 uv) { float e = spreadD(uv) - igR; return exp(-e * e * 700.0) * step(igR, 1.7); }
`;

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
${SPREAD}
void main () {
  vec4 base = texture(uTarget, vUv);
  float m = texture(uMask, vUv).r;
  // only what the spreading fire has reached burns; its edge a little more
  m = m * (litAt(vUv) + frontAt(vUv) * 0.6);
  if (isVel > 0.5) {
    // slow sway, not flicker
    float n = sin(vUv.x * 61.0 + time * 1.3) * 0.6 + sin(vUv.x * 29.0 - time * 0.9 + vUv.y * 17.0) * 0.4;
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

/* ── how heat looks: shared by the bloom source and the final picture ── */
const FIRE = `
uniform sampler2D uTexture; uniform sampler2D uMask;
uniform float core; uniform float time; uniform vec2 dyeTexel;
${SPREAD}
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
vec4 fire (vec2 uv, bool hq) {
  // heat haze: a slow, faint waver where the air is hottest
  float h0 = texture(uTexture, uv).r;
  vec2 haze = vec2(sin(uv.y * 60.0 + time * 2.2), cos(uv.x * 48.0 + time * 1.8)) * 0.0007 * clamp(h0, 0.0, 1.2);
  vec2 suv = uv + haze;
  float h = texture(uTexture, suv).r;
  // softer exposure: the smoke and flame never reach white
  float t = clamp(1.0 - exp(-h * 0.95), 0.0, 0.9);
  vec3 col = ramp(t);
  float a = clamp(t * 1.4, 0.0, 1.0);
  if (hq) {
    // volume: light the smoke from the front using the slope of the heat field
    float l = texture(uTexture, suv - vec2(dyeTexel.x, 0.0)).r;
    float r = texture(uTexture, suv + vec2(dyeTexel.x, 0.0)).r;
    float b = texture(uTexture, suv - vec2(0.0, dyeTexel.y)).r;
    float tp = texture(uTexture, suv + vec2(0.0, dyeTexel.y)).r;
    vec3 n = normalize(vec3(r - l, tp - b, length(dyeTexel) * 9.0));
    float diffuse = clamp(dot(n, vec3(-0.25, 0.35, 0.9)) + 0.45, 0.5, 1.15);
    col *= diffuse;
  }
  // the letters: warm gold, glowing slowly (no flicker)
  float raw = texture(uMask, uv).r * core;
  float lit = litAt(uv);
  float m = raw * lit;
  float glow = 0.025 * sin(time * 0.9 + uv.x * 3.0);
  vec3 hot = ramp(clamp(0.64 + 0.14 * m + glow, 0.0, 1.0));
  col = mix(col, hot, clamp(m, 0.0, 1.0));
  a = max(a, clamp(m, 0.0, 1.0));
  // before the fire reaches them the letters wait unlit: dark, like a wick
  float unlit = raw * (1.0 - lit);
  col = mix(col, vec3(0.16, 0.13, 0.12), clamp(unlit, 0.0, 1.0));
  a = max(a, clamp(unlit * 0.85, 0.0, 1.0));
  return vec4(col, a);
}
`;

// a low-resolution copy of the fire, premultiplied: what the bloom spreads
const SCENE = `${HEAD}${FIRE}
void main () { vec4 f = fire(vUv, false); fragColor = vec4(f.rgb * f.a, f.a); }`;

const BLOOM_PREFILTER = `${HEAD}
uniform sampler2D uTexture; uniform vec3 curve; uniform float threshold;
void main () {
  vec3 c = texture(uTexture, vUv).rgb;
  float br = max(c.r, max(c.g, c.b));
  float rq = clamp(br - curve.x, 0.0, curve.y);
  rq = curve.z * rq * rq;
  c *= max(rq, br - threshold) / max(br, 0.0001);
  fragColor = vec4(c, 0.0);
}`;

const BLOOM_BLUR = `${HEAD}
uniform sampler2D uTexture;
void main () {
  vec4 s = texture(uTexture, vL) + texture(uTexture, vR) + texture(uTexture, vT) + texture(uTexture, vB);
  fragColor = s * 0.25;
}`;

const BLOOM_FINAL = `${HEAD}
uniform sampler2D uTexture; uniform float intensity;
void main () {
  vec4 s = texture(uTexture, vL) + texture(uTexture, vR) + texture(uTexture, vT) + texture(uTexture, vB);
  fragColor = s * 0.25 * intensity;
}`;

const DISPLAY = `${HEAD}${FIRE}
uniform sampler2D uBloom; uniform float bloomI;
void main () {
  vec4 f = fire(vUv, true);
  vec3 c = f.rgb * f.a;
  float a = f.a;
  // white-hot edges on the letters (texelSize = one mask pixel)
  float mL = texture(uMask, vL).r; float mR = texture(uMask, vR).r;
  float mT = texture(uMask, vT).r; float mB = texture(uMask, vB).r;
  float edge = clamp(length(vec2(mR - mL, mT - mB)) * 1.6, 0.0, 1.0) * core * litAt(vUv);
  c += vec3(1.0, 0.8, 0.58) * edge * 0.26;
  a = max(a, edge * 0.26);
  // bloom: light spilling into the dark
  vec3 bl = texture(uBloom, vUv).rgb * bloomI;
  c += bl;
  a = clamp(max(a, max(bl.r, max(bl.g, bl.b))), 0.0, 1.0);
  fragColor = vec4(c, a);
}`;

/* ── embers: particle state lives in a texture, updated on the GPU ── */
const EMBER_UPDATE = `${HEAD}
uniform sampler2D uState; uniform sampler2D uVelocity; uniform sampler2D uMask;
uniform float dt; uniform float time; uniform float spawn; uniform vec2 velScale;
${SPREAD}
float hash (vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
void main () {
  vec4 s = texture(uState, vUv);
  vec2 p = s.xy; float life = s.z; float seed = s.w;
  life -= dt * (0.32 + seed * 0.45);
  if (life <= 0.0) {
    // reborn on a burning letter: a few tries to land on one. textureLod(…, 0):
    // neighbouring sparks pick far-apart spots, so automatic mip selection
    // would read a blurred-out mask and never find a letter
    vec2 q = vec2(hash(vUv + time), hash(vUv * 1.7 + time * 1.3));
    for (int i = 0; i < 10; i++) {
      if (textureLod(uMask, q, 0.0).r > 0.5 && litAt(q) > 0.5) break;
      q = vec2(hash(q + float(i) * 7.13 + time), hash(q.yx + float(i) * 3.37 + time));
    }
    float ok = step(0.5, textureLod(uMask, q, 0.0).r) * step(0.5, litAt(q)) * step(hash(q * 5.3 + time), spawn);
    p = q; seed = hash(q * 3.7 + time);
    life = ok * (0.55 + hash(q * 9.1) * 0.9);
  } else {
    // ride the air, rise on their own, wander a little
    vec2 v = texture(uVelocity, p).xy;
    p += v * velScale * dt;
    p.y += (0.018 + seed * 0.04) * dt;
    p.x += sin(time * 1.1 + seed * 40.0) * 0.004 * dt;
  }
  fragColor = vec4(p, life, seed);
}`;

const EMBER_VERT = `#version 300 es
precision highp float;
precision highp sampler2D;
uniform sampler2D uState; uniform int side; uniform float dpr; uniform float time;
out float vLife; out float vSeed;
void main () {
  ivec2 c = ivec2(gl_VertexID % side, gl_VertexID / side);
  vec4 s = texelFetch(uState, c, 0);
  vLife = s.z; vSeed = s.w;
  gl_Position = vec4(s.xy * 2.0 - 1.0, 0.0, 1.0);
  float alive = step(0.001, s.z);
  // a slow twinkle (well under one cycle a second): no strobing
  float twinkle = 0.85 + 0.15 * sin(time * 1.6 + s.w * 63.0);
  gl_PointSize = alive * (1.5 + s.w * 2.6) * dpr * twinkle;
}`;

const EMBER_FRAG = `#version 300 es
precision highp float;
in float vLife; in float vSeed;
out vec4 fragColor;
void main () {
  vec2 d = gl_PointCoord - 0.5;
  float a = smoothstep(0.5, 0.0, length(d)) * clamp(vLife * 1.3, 0.0, 1.0) * 0.75;
  vec3 c = mix(vec3(1.0, 0.32, 0.1), vec3(1.0, 0.78, 0.5), clamp(vLife * 1.1, 0.0, 1.0));
  fragColor = vec4(c * a, a);
}`;

export class EmberFluid {
  private gl: WebGL2RenderingContext;
  private programs: Record<string, { prog: WebGLProgram; u: Record<string, WebGLUniformLocation | null> }> = {};
  private quadVao: WebGLVertexArrayObject;
  private pointVao: WebGLVertexArrayObject;
  private velocity!: DoubleFBO;
  private dye!: DoubleFBO;
  private divergence!: FBO;
  private curlFbo!: FBO;
  private pressure!: DoubleFBO;
  private scene!: FBO;
  private bloom!: FBO;
  private bloomLevels: FBO[] = [];
  private embers!: DoubleFBO;
  private mask: WebGLTexture;
  private raf = 0;
  private running = false;
  private last = 0;
  private time = 0;
  private igniteAt = -1;
  private igP = { x: 0.2, y: 0.5 }; // where the title catches (uv)
  private igR = -1; // how far the fire has spread (−: not yet)
  private flame: { x: number; y: number; on: boolean } = { x: 0, y: 0, on: false };
  private scrollP = 0;
  private nextGust = 3;
  private pointerPrev: { x: number; y: number } | null = null;
  private splats: { x: number; y: number; dx: number; dy: number; heat: number; r: number }[] = [];
  private cssW = 1;
  private cssH = 1;
  private mobile: boolean;
  private float32: boolean;
  private cfg: { sim: number; dye: number; iters: number; dpr: number; bloomRes: number; bloomIters: number; embers: number };

  constructor(private canvas: HTMLCanvasElement, private host: HTMLElement, private lines: EmberLine[]) {
    const gl = canvas.getContext("webgl2", { alpha: true, premultipliedAlpha: true, depth: false, stencil: false, antialias: false, powerPreference: "high-performance" });
    if (!gl) throw new Error("webgl2 unavailable");
    this.float32 = !!gl.getExtension("EXT_color_buffer_float");
    if (!this.float32 && !gl.getExtension("EXT_color_buffer_half_float")) throw new Error("no float render targets");
    this.gl = gl;
    this.mobile = window.matchMedia("(max-width: 767px)").matches;
    this.cfg = this.mobile
      ? // phones: a lighter dye field and fewer solver passes (the dye was
        // larger than the canvas it is shown on, at 1.7x the pixels)
        { sim: 80, dye: 384, iters: 10, dpr: 1, bloomRes: 128, bloomIters: 3, embers: 28 }
      : { sim: 128, dye: 1024, iters: 20, dpr: Math.min(1.5, window.devicePixelRatio || 1), bloomRes: 256, bloomIters: 6, embers: 64 };

    // a full-screen quad (for every pass) and an empty array (for the embers,
    // which read their positions from a texture by vertex id)
    this.quadVao = gl.createVertexArray()!;
    gl.bindVertexArray(this.quadVao);
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, -1, 1, 1, 1, 1, -1]), gl.STATIC_DRAW);
    const ibuf = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibuf);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array([0, 1, 2, 0, 2, 3]), gl.STATIC_DRAW);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(0);
    this.pointVao = gl.createVertexArray()!;
    gl.bindVertexArray(this.quadVao);

    const vs = this.shader(gl.VERTEX_SHADER, VERT);
    const defs: Record<string, [WebGLShader | string, string]> = {
      clear: [vs, CLEAR],
      splat: [vs, SPLAT],
      source: [vs, SOURCE],
      buoyancy: [vs, BUOYANCY],
      advect: [vs, ADVECT],
      divergence: [vs, DIVERGENCE],
      curl: [vs, CURL],
      vorticity: [vs, VORTICITY],
      pressure: [vs, PRESSURE],
      gradient: [vs, GRADIENT],
      scene: [vs, SCENE],
      bloomPrefilter: [vs, BLOOM_PREFILTER],
      bloomBlur: [vs, BLOOM_BLUR],
      bloomFinal: [vs, BLOOM_FINAL],
      display: [vs, DISPLAY],
      emberUpdate: [vs, EMBER_UPDATE],
      emberDraw: [EMBER_VERT, EMBER_FRAG],
    };
    for (const [name, [v, src]] of Object.entries(defs)) {
      const prog = gl.createProgram()!;
      gl.attachShader(prog, typeof v === "string" ? this.shader(gl.VERTEX_SHADER, v) : v);
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

  private fbo(w: number, h: number, internal: number, format: number, type: number = this.gl.HALF_FLOAT, filter: number = this.gl.LINEAR): FBO {
    const gl = this.gl;
    const tex = gl.createTexture()!;
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filter);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filter);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, internal, w, h, 0, format, type, null);
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

  private double(w: number, h: number, internal: number, format: number, type?: number, filter?: number): DoubleFBO {
    let a = this.fbo(w, h, internal, format, type, filter);
    let b = this.fbo(w, h, internal, format, type, filter);
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
      // bloom chain: a base and halving levels below it
      const b = this.res(this.cfg.bloomRes);
      this.scene = this.fbo(b.w, b.h, gl.RGBA16F, gl.RGBA);
      this.bloom = this.fbo(b.w, b.h, gl.RGBA16F, gl.RGBA);
      this.bloomLevels = [];
      for (let i = 1; i <= this.cfg.bloomIters; i++) {
        const lw = Math.max(2, b.w >> i);
        const lh = Math.max(2, b.h >> i);
        this.bloomLevels.push(this.fbo(lw, lh, gl.RGBA16F, gl.RGBA));
      }
      // embers: one texel per spark (positions want 32-bit floats when we can)
      const side = this.cfg.embers;
      this.embers = this.float32
        ? this.double(side, side, gl.RGBA32F, gl.RGBA, gl.FLOAT, gl.NEAREST)
        : this.double(side, side, gl.RGBA16F, gl.RGBA, gl.HALF_FLOAT, gl.NEAREST);
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
    for (const line of this.lines) {
      const cs = getComputedStyle(line.el);
      const r = line.el.getBoundingClientRect();
      const size = parseFloat(cs.fontSize);
      o.font = `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
      const ls = o as CanvasRenderingContext2D & { letterSpacing?: string };
      if ("letterSpacing" in o) ls.letterSpacing = cs.letterSpacing === "normal" ? "0px" : cs.letterSpacing;
      const rtl = cs.direction === "rtl";
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
      // a burning wire under the line, where the accent underline sits
      if (line.bar) {
        const bw = Math.min(r.width, m.width);
        o.fillRect(rtl ? x - bw : x, r.bottom - host.top + 1, bw, Math.max(3, size * 0.035));
      }
    }
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

  /** The title catches at (x, y), in hero pixels, and the fire spreads from there. */
  ignite(x: number, y: number) {
    if (this.igniteAt >= 0) return;
    this.igP = { x: x / this.cssW, y: 1 - y / this.cssH };
    // wall clock, so the spread takes the same time on a slow machine
    this.igniteAt = performance.now();
  }

  /** Is the title already alight? (the hero skips the lighter after a re-mount) */
  get lit() {
    return this.igniteAt >= 0;
  }

  /** A small real flame at (x, y) in hero pixels: the lighter's nozzle. */
  lighter(x: number, y: number, on: boolean) {
    this.flame = { x, y, on };
  }

  /** The pointer moves the air only: no heat of its own, like a hand through smoke. */
  pointer(x: number, y: number, active: boolean) {
    if (!active) {
      this.pointerPrev = null;
      return;
    }
    const p = this.pointerPrev;
    this.pointerPrev = { x, y };
    if (!p) return;
    const cap = (v: number) => Math.max(-28, Math.min(28, v));
    const dx = cap(x - p.x);
    const dy = cap(y - p.y);
    if (Math.abs(dx) + Math.abs(dy) < 0.5) return;
    this.splats.push({ x, y, dx: dx * 3.0, dy: -dy * 3.0, heat: 0, r: 0.0014 });
  }

  /** A soft, warm puff from (x, y): no flash. */
  blast(x: number, y: number) {
    const n = 8;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      this.splats.push({ x: x + Math.cos(a) * 6, y: y + Math.sin(a) * 6, dx: Math.cos(a) * 380, dy: -Math.sin(a) * 380, heat: 0.0, r: 0.0016 });
    }
    this.splats.push({ x, y, dx: 0, dy: 160, heat: 0.75, r: 0.0042 });
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
      // 60 fps is the simulation's own rate (dt is capped to it): on 90/120 Hz
      // screens, skip the in-between frames instead of doubling the GPU work
      if (now - this.last < 15) return;
      const dt = Math.max(0, Math.min(0.0167, (now - this.last) / 1000));
      this.last = now;
      this.time += dt;
      this.step(dt);
      this.render(dt);
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
    gl.bindVertexArray(this.quadVao);
    gl.disable(gl.BLEND);
    const sp = this.scrollP;

    // the spread: an unhurried ease over ~2.8s from the point it caught
    if (this.igniteAt >= 0) {
      const k = Math.min(1, (performance.now() - this.igniteAt) / 2800);
      this.igR = -0.02 + (0.5 - 0.5 * Math.cos(Math.PI * k)) * 1.8;
    }
    const burning = Math.max(0, 1 - sp * 2.2); // the letters stop feeding the fire as you scroll

    // the lighter's flame: a small, steady tongue of real fire
    if (this.flame.on) this.splats.push({ x: this.flame.x, y: this.flame.y, dx: 0, dy: 80, heat: 0.13, r: 0.00024 });

    // a soft breeze now and then, so the fire is never still
    if (this.igR > 1 && this.time > this.nextGust) {
      this.nextGust = this.time + 4 + Math.random() * 4;
      const side = Math.random() < 0.5 ? -1 : 1;
      const yy = this.cssH * (0.3 + Math.random() * 0.3);
      this.splats.push({ x: this.cssW * (0.5 - side * 0.45), y: yy, dx: side * (70 + Math.random() * 60), dy: 10, heat: 0, r: 0.03 });
    }

    // pointer + click + wind splats (sizes cached on resize: no layout reads here)
    for (const s of this.splats.splice(0)) this.splat(s.x / this.cssW, 1 - s.y / this.cssH, s.dx, s.dy, s.heat, s.r);

    // the letters feed the fire
    if (this.igR > 0 && burning > 0) {
      let u = this.use("source");
      gl.uniform1i(u.uTarget, this.dye.read.attach(0));
      gl.uniform1i(u.uMask, this.attachMask(1));
      gl.uniform1f(u.heat, (this.mobile ? 1.9 : 1.6) * dt * burning);
      gl.uniform1f(u.lift, 0);
      gl.uniform1f(u.time, this.time);
      gl.uniform1f(u.isVel, 0);
      this.spreadUniforms(u);
      this.blit(this.dye.write);
      this.dye.swap();

      u = this.use("source");
      gl.uniform1i(u.uTarget, this.velocity.read.attach(0));
      gl.uniform1i(u.uMask, this.attachMask(1));
      gl.uniform1f(u.heat, 0);
      gl.uniform1f(u.lift, 240 * dt * burning);
      gl.uniform1f(u.time, this.time);
      gl.uniform1f(u.isVel, 1);
      this.spreadUniforms(u);
      this.blit(this.velocity.write);
      this.velocity.swap();
    }

    // heat rises (harder as the page scrolls, carrying the title away)
    let u = this.use("buoyancy");
    gl.uniform1i(u.uVelocity, this.velocity.read.attach(0));
    gl.uniform1i(u.uDye, this.dye.read.attach(1));
    gl.uniform1f(u.k, 48 + sp * 220);
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
    gl.uniform1f(u.curl, 15);
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
    gl.uniform1f(u.dissipation, 0.4);
    this.blit(this.velocity.write);
    this.velocity.swap();

    u = this.use("advect");
    gl.uniform2f(u.texelSize, vt[0], vt[1]);
    gl.uniform1i(u.uVelocity, this.velocity.read.attach(0));
    gl.uniform1i(u.uSource, this.dye.read.attach(1));
    gl.uniform1f(u.dt, dt);
    gl.uniform1f(u.dissipation, 1.15 + sp * 1.5);
    this.blit(this.dye.write);
    this.dye.swap();

    // embers ride the air the simulation just computed
    if (this.igR > 0) {
      u = this.use("emberUpdate");
      gl.uniform1i(u.uState, this.embers.read.attach(0));
      gl.uniform1i(u.uVelocity, this.velocity.read.attach(1));
      gl.uniform1i(u.uMask, this.attachMask(2));
      gl.uniform1f(u.dt, dt);
      gl.uniform1f(u.time, this.time);
      this.spreadUniforms(u);
      gl.uniform1f(u.spawn, burning * 0.26);
      gl.uniform2f(u.velScale, vt[0], vt[1]);
      this.blit(this.embers.write);
      this.embers.swap();
    }
  }

  private attachMask(id: number) {
    const gl = this.gl;
    gl.activeTexture(gl.TEXTURE0 + id);
    gl.bindTexture(gl.TEXTURE_2D, this.mask);
    return id;
  }

  /** Where the title caught and how far the fire has spread. */
  private spreadUniforms(u: Record<string, WebGLUniformLocation | null>) {
    const gl = this.gl;
    gl.uniform2f(u.igP, this.igP.x, this.igP.y);
    gl.uniform1f(u.igR, this.igR);
    gl.uniform1f(u.aspect, this.cssW / this.cssH);
  }

  /** The fire's look, set on whichever program is bound. */
  private fireUniforms(u: Record<string, WebGLUniformLocation | null>) {
    const gl = this.gl;
    gl.uniform1i(u.uTexture, this.dye.read.attach(0));
    gl.uniform1i(u.uMask, this.attachMask(1));
    gl.uniform1f(u.core, Math.max(0, 1 - this.scrollP * 2.4));
    gl.uniform1f(u.time, this.time);
    this.spreadUniforms(u);
    gl.uniform2f(u.dyeTexel, 1 / this.dye.w, 1 / this.dye.h);
  }

  private bloomPass() {
    const gl = this.gl;
    gl.disable(gl.BLEND);
    // 1) a small copy of the fire
    let u = this.use("scene");
    this.fireUniforms(u);
    this.blit(this.scene);
    // 2) keep only what is bright
    u = this.use("bloomPrefilter");
    const knee = 0.7 * 0.6 + 0.0001;
    gl.uniform3f(u.curve, 0.72 - knee, knee * 2, 0.25 / knee);
    gl.uniform1f(u.threshold, 0.72);
    gl.uniform1i(u.uTexture, this.scene.attach(0));
    this.blit(this.bloom);
    // 3) blur down the chain, then back up, adding as it goes
    u = this.use("bloomBlur");
    let last = this.bloom;
    for (const lvl of this.bloomLevels) {
      gl.uniform2f(u.texelSize, 1 / last.w, 1 / last.h);
      gl.uniform1i(u.uTexture, last.attach(0));
      this.blit(lvl);
      last = lvl;
    }
    gl.blendFunc(gl.ONE, gl.ONE);
    gl.enable(gl.BLEND);
    for (let i = this.bloomLevels.length - 2; i >= 0; i--) {
      const dst = this.bloomLevels[i];
      gl.uniform2f(u.texelSize, 1 / last.w, 1 / last.h);
      gl.uniform1i(u.uTexture, last.attach(0));
      this.blit(dst);
      last = dst;
    }
    gl.disable(gl.BLEND);
    u = this.use("bloomFinal");
    gl.uniform2f(u.texelSize, 1 / last.w, 1 / last.h);
    gl.uniform1i(u.uTexture, last.attach(0));
    gl.uniform1f(u.intensity, 0.6);
    this.blit(this.bloom);
  }

  private render(dt: number) {
    void dt;
    const gl = this.gl;
    gl.bindVertexArray(this.quadVao);
    this.bloomPass();

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    const u = this.use("display");
    this.fireUniforms(u);
    gl.uniform2f(u.texelSize, 1 / this.cssW, 1 / this.cssH);
    gl.uniform1i(u.uBloom, this.bloom.attach(2));
    gl.uniform1f(u.bloomI, 0.8);
    this.blit(null);

    // the embers, added on top
    if (this.igR > 0) {
      gl.blendFunc(gl.ONE, gl.ONE);
      const e = this.use("emberDraw");
      gl.uniform1i(e.uState, this.embers.read.attach(0));
      gl.uniform1i(e.side, this.cfg.embers);
      gl.uniform1f(e.dpr, this.cfg.dpr);
      gl.uniform1f(e.time, this.time);
      gl.bindVertexArray(this.pointVao);
      gl.drawArrays(gl.POINTS, 0, this.cfg.embers * this.cfg.embers);
      gl.bindVertexArray(this.quadVao);
    }
    gl.disable(gl.BLEND);
  }

  dispose() {
    this.stop();
    const lose = this.gl.getExtension("WEBGL_lose_context");
    lose?.loseContext();
  }
}
