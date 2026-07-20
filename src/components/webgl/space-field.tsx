"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useTheme } from "@/components/providers/theme-provider";

const COUNT = 4200;
const SPAN_X = 16;
const SPAN_Y = 10;
const Z_NEAR = 4;
const Z_FAR = -24;
const CAM_START = 5;
const CAM_TRAVEL = 15;

const VERT = /* glsl */ `
  uniform float uTime;
  uniform float uSize;
  uniform float uWarp;
  attribute float aScale;
  varying float vWarp;
  void main() {
    vec3 p = position;
    // barely-perceptible solar-wind drift
    p.x += sin(uTime * 0.04 + p.y * 0.12 + p.z * 0.05) * 0.5;
    p.y += cos(uTime * 0.035 + p.x * 0.12) * 0.5;
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    // WARP: rush the points toward the camera (hyperspace / time-travel feel)
    mv.z += uWarp * (5.0 + aScale * 13.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = aScale * uSize * (1.0 / max(0.1, -mv.z)) * (1.0 + uWarp * 2.6);
    vWarp = uWarp;
  }
`;

const FRAG = /* glsl */ `
  precision mediump float;
  uniform vec3 uColor;
  varying float vWarp;
  void main() {
    vec2 c = gl_PointCoord - 0.5;
    float d = length(c);
    if (d > 0.5) discard;
    float a = smoothstep(0.5, 0.12, d);
    gl_FragColor = vec4(uColor, a * (0.95 + vWarp * 0.4));
  }
`;

function Dust({ target, wrapperRef }: { target: THREE.Color; wrapperRef: React.RefObject<HTMLDivElement | null> }) {
  const mat = useRef<THREE.ShaderMaterial>(null);
  const start = useRef(0);
  const { camera } = useThree();
  const prog = useRef(0);
  const paused = useRef(false);

  const { positions, scales } = useMemo(() => {
    const positions = new Float32Array(COUNT * 3);
    const scales = new Float32Array(COUNT);
    for (let i = 0; i < COUNT; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 2 * SPAN_X;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 2 * SPAN_Y;
      positions[i * 3 + 2] = Z_FAR + Math.random() * (Z_NEAR - Z_FAR);
      scales[i] = 0.4 + Math.random() * 1.5;
    }
    return { positions, scales };
  }, []);

  const warp = useRef(0);
  const vh = useRef(1);
  const maxScroll = useRef(1);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uSize: { value: 22 },
      uWarp: { value: 0 },
      uColor: { value: new THREE.Color("#f5f5f5") },
    }),
    []
  );

  useEffect(() => {
    const onVis = () => (paused.current = document.hidden);
    const measure = () => {
      vh.current = window.innerHeight;
      maxScroll.current = Math.max(1, document.body.scrollHeight - window.innerHeight);
    };
    const onScroll = () => (prog.current = window.scrollY / maxScroll.current);
    measure();
    onScroll();
    const settle = setTimeout(measure, 600); // re-measure once fonts/layout settle
    document.addEventListener("visibilitychange", onVis);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", measure);
    return () => {
      clearTimeout(settle);
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", measure);
    };
  }, []);

  useFrame((_, dt) => {
    if (paused.current) return;
    const u = mat.current?.uniforms;
    if (!u) return;
    u.uTime.value += Math.min(dt, 0.05);
    (u.uColor.value as THREE.Color).lerp(target, 0.05);

    const y = window.scrollY;
    const V = vh.current;

    // float the camera forward through the dust on scroll
    const targetZ = CAM_START - prog.current * CAM_TRAVEL;
    camera.position.z += (targetZ - camera.position.z) * 0.08;

    // WARP — the time-travel streak as the hero scrolls away.
    const h = y / V;
    const w = h > 0.08 && h < 1.0 ? Math.sin(((h - 0.08) / 0.92) * Math.PI) : 0;
    warp.current += (w - warp.current) * 0.14;
    u.uWarp.value = warp.current;

    // HERO-ONLY: the galaxy lives in the hero and fades the instant you scroll
    // past it, so every other section keeps its default dark background and the
    // desert sandstorm takes over.
    if (wrapperRef.current) {
      if (!start.current) start.current = performance.now();
      const fadeIn = Math.min(1, (performance.now() - start.current) / 1000);
      const e = Math.max(0, Math.min(1, (y - 0.7 * V) / (0.6 * V))); // 0 in hero → 1 just past it
      const fadeOut = 1 - e * e * (3 - 2 * e);
      wrapperRef.current.style.opacity = String(fadeIn * fadeOut);
    }
  });

  return (
    <points>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-aScale" args={[scales, 1]} />
      </bufferGeometry>
      <shaderMaterial
        ref={mat}
        vertexShader={VERT}
        fragmentShader={FRAG}
        uniforms={uniforms}
        transparent
        depthWrite={false}
      />
    </points>
  );
}

export default function SpaceField() {
  const { theme } = useTheme();
  const target = useMemo(() => new THREE.Color(theme === "light" ? "#111111" : "#f5f5f5"), [theme]);
  const wrapperRef = useRef<HTMLDivElement>(null);

  return (
    <div ref={wrapperRef} className="pointer-events-none fixed inset-0 z-0" style={{ opacity: 0 }}>
      <Canvas
        camera={{ position: [0, 0, CAM_START], fov: 55 }}
        dpr={[1, 1.5]}
        gl={{ antialias: false, alpha: true, powerPreference: "high-performance" }}
      >
        <Dust target={target} wrapperRef={wrapperRef} />
      </Canvas>
    </div>
  );
}
