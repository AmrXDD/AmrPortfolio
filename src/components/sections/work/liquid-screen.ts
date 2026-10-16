/*
 * LiquidScreen — one WebGL quad that shows a project screenshot and melts it
 * into the next one.
 *
 * The transition front sweeps top → bottom along a ragged fbm edge; both
 * images are displaced by the same noise (the outgoing one "drips" away), RGB
 * splits at the peak of the move, and a molten line in the incoming client's
 * accent colour rides the front. A small lens bulges under the cursor.
 *
 * Kept deliberately light so it can't hitch the page: the shader compiles in
 * the background (KHR_parallel_shader_compile — we poll for completion each
 * frame instead of blocking on it), images decode off the main thread with
 * img.decode() and upload one per frame, and the loop only runs while the
 * screen is near the viewport.
 */

const VERT = `
attribute vec2 aPos;
varying vec2 vUv;
void main() {
  vUv = aPos * 0.5 + 0.5;
  gl_Position = vec4(aPos, 0.0, 1.0);
}`;

const FRAG = `
precision highp float;
varying vec2 vUv;
uniform sampler2D uA;
uniform sampler2D uB;
uniform vec2 uSizeA;
uniform vec2 uSizeB;
uniform float uReadyA;
uniform float uReadyB;
uniform vec3 uBgA;
uniform vec3 uBgB;
uniform vec3 uAccent;
uniform vec2 uRes;
uniform float uMix;
uniform float uTime;
uniform vec2 uMouse;
uniform float uHover;

float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
             mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}
float fbm(vec2 p) {
  float v = 0.0, a = 0.5;
  for (int i = 0; i < 5; i++) { v += a * noise(p); p *= 2.03; a *= 0.5; }
  return v;
}

// object-fit: cover, anchored to the top of the screenshot
vec2 cover(vec2 uv, vec2 img) {
  float ca = uRes.x / uRes.y;
  float ia = img.x / max(img.y, 1.0);
  vec2 s = ca > ia ? vec2(1.0, ia / ca) : vec2(ca / ia, 1.0);
  return uv * s + vec2((1.0 - s.x) * 0.5, 1.0 - s.y);
}

vec3 sampleImg(sampler2D t, vec2 uv, vec2 size, float ready, vec3 bg, float ca) {
  if (ready < 0.5) return bg;
  uv = clamp(uv, 0.001, 0.999);
  vec2 dir = uv - 0.5;
  return vec3(
    texture2D(t, cover(uv + dir * ca, size)).r,
    texture2D(t, cover(uv, size)).g,
    texture2D(t, cover(uv - dir * ca, size)).b
  );
}

void main() {
  vec2 uv = vUv;

  // cursor lens
  vec2 d = uv - uMouse;
  d.x *= uRes.x / uRes.y;
  float lens = exp(-dot(d, d) * 16.0) * uHover;
  uv -= (uv - uMouse) * lens * 0.07;

  float t = uMix;
  float wave = sin(t * 3.14159265);
  float n = fbm(uv * vec2(3.2, 2.0) + vec2(0.0, uTime * 0.08));
  float n2 = fbm(uv * 4.1 + 7.3 + uTime * 0.05);

  // the front: top → bottom with a ragged, living edge
  float front = (1.0 - uv.y) * 0.62 + n * 0.38;
  float w = 0.09;
  float m = smoothstep(front - w, front + w, t * (1.0 + 2.0 * w) - w);

  vec2 disp = (vec2(n, n2) - 0.5) * 0.18 * wave;
  vec2 uvA = uv + disp * (0.35 + m) + vec2(0.0, m * 0.06 * wave);
  vec2 uvB = uv - disp * (1.0 - m);

  float ca = 0.007 * wave + lens * 0.012;
  vec3 a = sampleImg(uA, uvA, uSizeA, uReadyA, uBgA, ca);
  vec3 b = sampleImg(uB, uvB, uSizeB, uReadyB, uBgB, ca);
  vec3 col = mix(a, b, m);

  // molten line on the front
  float edge = 1.0 - abs(m * 2.0 - 1.0);
  col += uAccent * pow(edge, 4.0) * 1.5 * wave;
  col += vec3(1.0, 0.86, 0.72) * pow(edge, 18.0) * 0.9 * wave;

  // faint scanlines only while it moves, plus a soft vignette
  col *= 1.0 - 0.07 * wave * (0.5 + 0.5 * sin(vUv.y * uRes.y * 1.1));
  vec2 q = vUv - 0.5;
  col *= 1.0 - dot(q, q) * 0.32;
  col += lens * 0.03;

  gl_FragColor = vec4(col, 1.0);
}`;

export type Slide = { src: string; bg: string; accent: string };

const hex = (h: string): [number, number, number] => {
  const m = h.replace("#", "").match(/.{2}/g) ?? ["00", "00", "00"];
  return m.slice(0, 3).map((x) => parseInt(x, 16) / 255) as [number, number, number];
};

/** Optimised, resized copy from Next's image endpoint (falls back to the original). */
const optimised = (src: string) => `/_next/image?url=${encodeURIComponent(src)}&w=1920&q=75`;

export class LiquidScreen {
  private gl: WebGLRenderingContext;
  private prog: WebGLProgram;
  private u: Record<string, WebGLUniformLocation | null> = {};
  private tex: (WebGLTexture | null)[] = [];
  private size: [number, number][] = [];
  private ready: boolean[] = [];
  private pending: { i: number; img: HTMLImageElement }[] = [];
  private raf = 0;
  private running = false;
  private t0 = performance.now();
  private linked = false;
  private parallel: { COMPLETION_STATUS_KHR: number } | null = null;
  private onFail?: () => void;
  private state = { a: 0, b: 1, mix: 0 };
  private mouse = { x: 0.5, y: 0.5, hover: 0, tx: 0.5, ty: 0.5, th: 0 };

  constructor(private canvas: HTMLCanvasElement, private slides: Slide[], onFail?: () => void) {
    this.onFail = onFail;
    const gl = canvas.getContext("webgl", { antialias: false, alpha: false, premultipliedAlpha: false, powerPreference: "high-performance" });
    if (!gl) throw new Error("webgl unavailable");
    this.gl = gl;

    // Kick off compile + link but don't ask for the result yet: querying the
    // status is what forces a synchronous compile on the main thread.
    this.parallel = gl.getExtension("KHR_parallel_shader_compile");
    const sh = (type: number, src: string) => {
      const s = gl.createShader(type)!;
      gl.shaderSource(s, src);
      gl.compileShader(s);
      return s;
    };
    const prog = gl.createProgram()!;
    gl.attachShader(prog, sh(gl.VERTEX_SHADER, VERT));
    gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(prog);
    this.prog = prog;

    slides.forEach((s, i) => {
      this.tex[i] = null;
      this.size[i] = [16, 9];
      this.ready[i] = false;
      this.load(i, optimised(s.src), s.src);
    });
    this.resize();
  }

  /** True once the program has linked; wires up attributes the first time. */
  private finishLink(): boolean {
    if (this.linked) return true;
    const gl = this.gl;
    const prog = this.prog;
    if (this.parallel && !gl.getProgramParameter(prog, this.parallel.COMPLETION_STATUS_KHR)) return false;
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      console.error("[work] shader link failed:", gl.getProgramInfoLog(prog));
      this.stop();
      this.onFail?.();
      return false;
    }
    gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, "aPos");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

    for (const name of ["uA", "uB", "uSizeA", "uSizeB", "uReadyA", "uReadyB", "uBgA", "uBgB", "uAccent", "uRes", "uMix", "uTime", "uMouse", "uHover"]) {
      this.u[name] = gl.getUniformLocation(prog, name);
    }
    gl.uniform1i(this.u.uA, 0);
    gl.uniform1i(this.u.uB, 1);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    this.linked = true;
    return true;
  }

  private load(i: number, url: string, fallback?: string) {
    const img = new Image();
    img.decoding = "async";
    img.src = url;
    img
      .decode()
      .then(() => this.pending.push({ i, img }))
      .catch(() => {
        if (fallback) this.load(i, fallback);
      });
  }

  /** Upload at most one decoded image per frame, so no frame pays for four. */
  private uploadOne() {
    const job = this.pending.shift();
    if (!job) return;
    const gl = this.gl;
    const t = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, t);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, job.img);
    this.tex[job.i] = t;
    this.size[job.i] = [job.img.naturalWidth, job.img.naturalHeight];
    this.ready[job.i] = true;
  }

  resize() {
    const r = this.canvas.getBoundingClientRect();
    const dpr = Math.min(1.5, window.devicePixelRatio || 1);
    const w = Math.max(2, Math.round(r.width * dpr));
    const h = Math.max(2, Math.round(r.height * dpr));
    // reallocating the drawing buffer is costly; only do it when the size changed
    if (w === this.canvas.width && h === this.canvas.height) return;
    this.canvas.width = w;
    this.canvas.height = h;
    this.gl.viewport(0, 0, w, h);
  }

  /** Which two slides are on screen, and how far the melt between them has gone. */
  set(a: number, b: number, mix: number) {
    this.state = { a, b, mix };
  }

  pointer(x: number, y: number, hover: boolean) {
    this.mouse.tx = x;
    this.mouse.ty = y;
    this.mouse.th = hover ? 1 : 0;
  }

  start() {
    if (this.running) return;
    this.running = true;
    const loop = () => {
      if (!this.running) return;
      this.raf = requestAnimationFrame(loop);
      // until the shader is ready the frame shows the client's colour (CSS)
      if (!this.finishLink()) return;
      this.uploadOne();
      this.draw();
    };
    this.raf = requestAnimationFrame(loop);
  }

  stop() {
    this.running = false;
    cancelAnimationFrame(this.raf);
  }

  private draw() {
    const gl = this.gl;
    const { a, b, mix } = this.state;
    const m = this.mouse;
    m.x += (m.tx - m.x) * 0.12;
    m.y += (m.ty - m.y) * 0.12;
    m.hover += (m.th - m.hover) * 0.08;

    gl.useProgram(this.prog);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.tex[a]);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, this.tex[b]);

    const sa = this.slides[a];
    const sb = this.slides[b];
    gl.uniform2f(this.u.uSizeA, this.size[a][0], this.size[a][1]);
    gl.uniform2f(this.u.uSizeB, this.size[b][0], this.size[b][1]);
    gl.uniform1f(this.u.uReadyA, this.ready[a] ? 1 : 0);
    gl.uniform1f(this.u.uReadyB, this.ready[b] ? 1 : 0);
    gl.uniform3fv(this.u.uBgA, hex(sa.bg));
    gl.uniform3fv(this.u.uBgB, hex(sb.bg));
    gl.uniform3fv(this.u.uAccent, hex(sb.accent));
    gl.uniform2f(this.u.uRes, this.canvas.width, this.canvas.height);
    gl.uniform1f(this.u.uMix, mix);
    gl.uniform1f(this.u.uTime, (performance.now() - this.t0) / 1000);
    gl.uniform2f(this.u.uMouse, m.x, m.y);
    gl.uniform1f(this.u.uHover, m.hover);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }

  dispose() {
    this.stop();
    const gl = this.gl;
    this.tex.forEach((t) => t && gl.deleteTexture(t));
    gl.deleteProgram(this.prog);
    gl.getExtension("WEBGL_lose_context")?.loseContext();
  }
}
