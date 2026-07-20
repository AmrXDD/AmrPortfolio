"use client";

/**
 * CosmicField — a full-viewport, space-black (#000000) cinematic dust field.
 *
 * Built in vanilla Three.js (WebGL2). This is the RELIABLE direct-render build:
 *   • 50k particles in ONE draw call via InstancedBufferGeometry (all motion on
 *     the GPU).
 *   • Analytic 3D Simplex CURL NOISE in the vertex shader — the dust flows like
 *     cosmic wind / smoke eddies.
 *   • Cursor interaction — particles swirl and push away from the pointer.
 *   • Additive glow on pure black, gentle scroll dolly.
 *
 * Rendered straight to the screen (no EffectComposer / FBO / depth passes) so it
 * is guaranteed to draw on every GPU. Mounted fixed behind everything (z-0),
 * pointer-events:none, so it never blocks clicks or scroll.
 */

import { useEffect, useRef } from "react";
import * as THREE from "three";

/* ---- shared noise (Ashima 3D Simplex + analytic curl) ---- */
const SIMPLEX = /* glsl */ `
vec4 permute(vec4 x){return mod(((x*34.0)+1.0)*x, 289.0);}
vec4 taylorInvSqrt(vec4 r){return 1.79284291400159 - 0.85373472095314 * r;}
float snoise(vec3 v){
  const vec2 C = vec2(1.0/6.0, 1.0/3.0);
  const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
  vec3 i  = floor(v + dot(v, C.yyy));
  vec3 x0 = v - i + dot(i, C.xxx);
  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min(g.xyz, l.zxy);
  vec3 i2 = max(g.xyz, l.zxy);
  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + C.yyy;
  vec3 x3 = x0 - D.yyy;
  i = mod(i, 289.0);
  vec4 p = permute(permute(permute(
            i.z + vec4(0.0, i1.z, i2.z, 1.0))
          + i.y + vec4(0.0, i1.y, i2.y, 1.0))
          + i.x + vec4(0.0, i1.x, i2.x, 1.0));
  float n_ = 1.0/7.0;
  vec3 ns = n_ * D.wyz - D.xzx;
  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_);
  vec4 x = x_ * ns.x + ns.yyyy;
  vec4 y = y_ * ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);
  vec4 b0 = vec4(x.xy, y.xy);
  vec4 b1 = vec4(x.zw, y.zw);
  vec4 s0 = floor(b0)*2.0 + 1.0;
  vec4 s1 = floor(b1)*2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));
  vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
  vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;
  vec3 p0 = vec3(a0.xy, h.x);
  vec3 p1 = vec3(a0.zw, h.y);
  vec3 p2 = vec3(a1.xy, h.z);
  vec3 p3 = vec3(a1.zw, h.w);
  vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
  p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
  vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
  m = m * m;
  return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
}
vec3 curlNoise(vec3 p){
  const float e = 0.1;
  vec3 dx = vec3(e,0.0,0.0), dy = vec3(0.0,e,0.0), dz = vec3(0.0,0.0,e);
  vec3 pa = p;
  vec3 pb = p + vec3(31.416, -47.853, 12.793);
  vec3 pc = p + vec3(-12.345, 67.890, -34.560);
  float cx = (snoise(pc + dy) - snoise(pc - dy)) - (snoise(pb + dz) - snoise(pb - dz));
  float cy = (snoise(pa + dz) - snoise(pa - dz)) - (snoise(pc + dx) - snoise(pc - dx));
  float cz = (snoise(pb + dx) - snoise(pb - dx)) - (snoise(pa + dy) - snoise(pa - dy));
  return vec3(cx, cy, cz) / (2.0 * e);
}
`;

const VERT = /* glsl */ `
precision highp float;
${SIMPLEX}
attribute vec3 aSeed;
attribute vec4 aRnd;   // x:size y:phase z:speed w:colorMix
uniform float uTime;
uniform float uCurlScale;
uniform float uCurlSpeed;
uniform float uAmplitude;
uniform float uSize;
uniform vec2  uMouse;        // -1..1 NDC
uniform float uMouseStrength;
varying vec2  vUv;
varying vec3  vColor;
varying float vGlow;

vec3 dustColor(float m){
  vec3 white = vec3(0.92, 0.94, 1.0);
  vec3 gold  = vec3(1.0, 0.80, 0.52);
  vec3 blue  = vec3(0.55, 0.74, 1.0);
  vec3 c = mix(white, gold, smoothstep(0.5, 0.85, m));
  c = mix(c, blue, smoothstep(0.85, 1.0, m));
  return c;
}

void main(){
  vUv = uv;
  vColor = dustColor(aRnd.w);

  // curl-noise flow
  float t = uTime * uCurlSpeed + aRnd.y * 6.2831853;
  vec3 s = aSeed * uCurlScale + vec3(0.0, t * 0.15, t * 0.07);
  vec3 flow = curlNoise(s);
  vec3 worldPos = aSeed + flow * uAmplitude * (0.6 + aRnd.z);
  worldPos.y += sin(uTime * 0.2 + aRnd.y * 10.0) * 0.2;

  // camera basis (rows of the view matrix)
  vec3 camRight = vec3(viewMatrix[0][0], viewMatrix[1][0], viewMatrix[2][0]);
  vec3 camUp    = vec3(viewMatrix[0][1], viewMatrix[1][1], viewMatrix[2][1]);

  // cursor swirl + push (screen-space, no FBO needed)
  vec4 clip = projectionMatrix * viewMatrix * vec4(worldPos, 1.0);
  vec2 ndc = clip.xy / max(clip.w, 0.0001);
  vec2 toM = ndc - uMouse;
  float dist = length(toM);
  float infl = smoothstep(0.55, 0.0, dist) * uMouseStrength;
  vec2 dir = toM / max(dist, 0.0001);
  vec2 perp = vec2(-dir.y, dir.x);
  vec2 force = (perp * 0.6 + dir * 0.3) * infl;
  worldPos += (camRight * force.x + camUp * force.y);
  vGlow = clamp(length(flow) * 0.10 + infl * 0.7, 0.0, 0.85);

  // billboard the instanced quad
  float size = uSize * (0.35 + aRnd.x * 1.3);
  vec3 billboard = worldPos + (position.x * camRight + position.y * camUp) * size;
  gl_Position = projectionMatrix * viewMatrix * vec4(billboard, 1.0);
}
`;

const FRAG = /* glsl */ `
precision highp float;
varying vec2  vUv;
varying vec3  vColor;
varying float vGlow;
uniform float uOpacity;
uniform float uLight;   // 0 = dark mode (bright dust), 1 = light mode (ink dust)
void main(){
  vec2 c = vUv - 0.5;
  float d = length(c);
  if (d > 0.5) discard;
  float a = smoothstep(0.5, 0.0, d);   // soft round falloff
  vec3 col = vColor * (0.45 + vGlow * 0.5);
  // light mode: the same particles, repainted as ink dust on the pale page
  col = mix(col, vec3(0.10, 0.10, 0.13) * (0.55 + vGlow * 0.35), uLight);
  gl_FragColor = vec4(col, a * a * uOpacity);
}
`;

export default function CosmicField() {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const coarse = window.matchMedia("(pointer: coarse)").matches;
    // budget-conscious: the field is ambient texture, not the show — half the
    // particles at a lower DPR reads identically and frees the GPU for the
    // device scenes
    const COUNT = reduce ? 4000 : coarse ? 10000 : 24000;
    const DPR = Math.min(window.devicePixelRatio || 1, coarse ? 1.1 : 1.25);

    let W = window.innerWidth;
    let H = window.innerHeight;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: false, alpha: false, powerPreference: "high-performance" });
    } catch {
      return;
    }
    renderer.setPixelRatio(DPR);
    renderer.setSize(W, H);
    renderer.setClearColor(0x000000, 1);
    mount.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(58, W / H, 0.1, 100);
    camera.position.set(0, 0, 14);
    camera.lookAt(0, 0, 0);

    // instanced billboard quad
    const geo = new THREE.InstancedBufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(new Float32Array([-0.5, -0.5, 0, 0.5, -0.5, 0, 0.5, 0.5, 0, -0.5, 0.5, 0]), 3));
    geo.setAttribute("uv", new THREE.BufferAttribute(new Float32Array([0, 0, 1, 0, 1, 1, 0, 1]), 2));
    geo.setIndex([0, 1, 2, 0, 2, 3]);

    const seed = new Float32Array(COUNT * 3);
    const rnd = new Float32Array(COUNT * 4);
    const R = 13;
    for (let i = 0; i < COUNT; i++) {
      seed[i * 3] = (Math.random() * 2 - 1) * R * 1.5;
      seed[i * 3 + 1] = (Math.random() * 2 - 1) * R * 0.95;
      seed[i * 3 + 2] = (Math.random() * 2 - 1) * R * 0.85;
      rnd[i * 4] = Math.random();
      rnd[i * 4 + 1] = Math.random();
      rnd[i * 4 + 2] = Math.random();
      rnd[i * 4 + 3] = Math.random();
    }
    geo.setAttribute("aSeed", new THREE.InstancedBufferAttribute(seed, 3));
    geo.setAttribute("aRnd", new THREE.InstancedBufferAttribute(rnd, 4));
    geo.instanceCount = COUNT;

    const mat = new THREE.ShaderMaterial({
      vertexShader: VERT,
      fragmentShader: FRAG,
      transparent: true,
      depthTest: false,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uTime: { value: 0 },
        uCurlScale: { value: 0.07 },
        uCurlSpeed: { value: 0.12 },   // slow, ambient drift (was darting "flies")
        uAmplitude: { value: 0.9 },    // barely moves across the screen
        uSize: { value: 0.05 },
        uOpacity: { value: 0.32 },     // much dimmer — atmosphere, not headlights
        uLight: { value: 0 },
        uMouse: { value: new THREE.Vector2(0, 0) },
        uMouseStrength: { value: 0.5 },
      },
    });

    const mesh = new THREE.Mesh(geo, mat);
    mesh.frustumCulled = false;
    scene.add(mesh);

    // ---- interaction ----
    const mouse = new THREE.Vector2(0, 0);
    const mouseTarget = new THREE.Vector2(0, 0);
    const onMove = (e: MouseEvent) => {
      mouseTarget.set((e.clientX / window.innerWidth) * 2 - 1, -((e.clientY / window.innerHeight) * 2 - 1));
    };
    const onTouch = (e: TouchEvent) => {
      const t = e.touches[0];
      if (t) mouseTarget.set((t.clientX / window.innerWidth) * 2 - 1, -((t.clientY / window.innerHeight) * 2 - 1));
    };
    window.addEventListener("mousemove", onMove, { passive: true });
    window.addEventListener("touchmove", onTouch, { passive: true });

    let scrollN = 0;
    const onScroll = () => {
      const max = Math.max(1, document.body.scrollHeight - window.innerHeight);
      scrollN = window.scrollY / max;
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    const resize = () => {
      W = window.innerWidth;
      H = window.innerHeight;
      renderer.setSize(W, H);
      camera.aspect = W / H;
      camera.updateProjectionMatrix();
    };
    window.addEventListener("resize", resize);

    // ---- loop ----
    let raf = 0;
    let running = true;
    const clock = new THREE.Clock();
    const onVis = () => {
      running = !document.hidden;
      if (running) {
        clock.start();
        raf = requestAnimationFrame(tick);
      } else cancelAnimationFrame(raf);
    };
    document.addEventListener("visibilitychange", onVis);

    let lastLight = false;
    function tick() {
      if (!running) return;
      const t = clock.getElapsedTime();
      mouse.lerp(mouseTarget, 0.08);
      mat.uniforms.uTime.value = t;
      mat.uniforms.uMouse.value.copy(mouse);
      // theme-aware repaint: same particles, light clear + ink dust in light mode
      const lightNow = document.documentElement.classList.contains("light") ? 1 : 0;
      mat.uniforms.uLight.value += (lightNow - mat.uniforms.uLight.value) * 0.08;
      const isLight = mat.uniforms.uLight.value > 0.5;
      if (isLight !== lastLight) {
        lastLight = isLight;
        renderer.setClearColor(isLight ? 0xf9f9f6 : 0x000000, 1);
        // additive glow washes out on white — switch to normal blending there
        mat.blending = isLight ? THREE.NormalBlending : THREE.AdditiveBlending;
      }
      // gentle scroll dolly + parallax
      camera.position.z += (14 - scrollN * 5 - camera.position.z) * 0.04;
      camera.position.x += (mouse.x * 0.45 - camera.position.x) * 0.02;
      camera.position.y += (mouse.y * 0.3 - camera.position.y) * 0.02;
      camera.lookAt(0, 0, 0);
      renderer.render(scene, camera);
      raf = requestAnimationFrame(tick);
    }
    // draw one frame immediately so the field is visible even before rAF kicks
    // in (and so it never starts on a blank/black frame).
    mat.uniforms.uTime.value = 0.01;
    renderer.render(scene, camera);
    raf = requestAnimationFrame(tick);

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("touchmove", onTouch);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", onVis);
      geo.dispose();
      mat.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === mount) mount.removeChild(renderer.domElement);
    };
  }, []);

  return <div ref={mountRef} aria-hidden className="cosmic-field pointer-events-none fixed inset-0 z-0 bg-ink" />;
}
