"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { useTheme } from "@/components/providers/theme-provider";

/* Ashima 3D simplex noise (snoise) */
const SNOISE = /* glsl */ `
  vec4 permute(vec4 x){return mod(((x*34.0)+1.0)*x,289.0);}
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
    vec3 x1 = x0 - i1 + 1.0 * C.xxx;
    vec3 x2 = x0 - i2 + 2.0 * C.xxx;
    vec3 x3 = x0 - 1.0 + 3.0 * C.xxx;
    i = mod(i, 289.0);
    vec4 p = permute(permute(permute(
              i.z + vec4(0.0, i1.z, i2.z, 1.0))
            + i.y + vec4(0.0, i1.y, i2.y, 1.0))
            + i.x + vec4(0.0, i1.x, i2.x, 1.0));
    float n_ = 1.0/7.0;
    vec3 ns = n_ * D.wyz - D.xzx;
    vec4 j = p - 49.0 * floor(p * ns.z *ns.z);
    vec4 x_ = floor(j * ns.z);
    vec4 y_ = floor(j - 7.0 * x_);
    vec4 x = x_ *ns.x + ns.yyyy;
    vec4 y = y_ *ns.x + ns.yyyy;
    vec4 h = 1.0 - abs(x) - abs(y);
    vec4 b0 = vec4(x.xy, y.xy);
    vec4 b1 = vec4(x.zw, y.zw);
    vec4 s0 = floor(b0)*2.0 + 1.0;
    vec4 s1 = floor(b1)*2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));
    vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
    vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;
    vec3 p0 = vec3(a0.xy,h.x);
    vec3 p1 = vec3(a0.zw,h.y);
    vec3 p2 = vec3(a1.xy,h.z);
    vec3 p3 = vec3(a1.zw,h.w);
    vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
    p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
    vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
    m = m * m;
    return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
  }
`;

const VERT = /* glsl */ `
  uniform float uTime;
  uniform float uSize;
  uniform float uAmp;
  attribute float aScale;
  ${SNOISE}
  void main() {
    vec3 dir = normalize(position);
    float n = snoise(dir * 1.4 + uTime * 0.12);
    vec3 p = position + dir * n * uAmp;
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = aScale * uSize * (1.0 / max(0.1, -mv.z));
  }
`;

const FRAG = /* glsl */ `
  precision mediump float;
  uniform vec3 uColor;
  void main() {
    vec2 c = gl_PointCoord - 0.5;
    float d = length(c);
    if (d > 0.5) discard;
    float a = smoothstep(0.5, 0.12, d);
    gl_FragColor = vec4(uColor, a);
  }
`;

function fibSphere(count: number, radius: number, jitter: number) {
  const pos = new Float32Array(count * 3);
  const scl = new Float32Array(count);
  const golden = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < count; i++) {
    const y = 1 - (i / (count - 1)) * 2;
    const r = Math.sqrt(1 - y * y);
    const theta = golden * i;
    const jr = radius * (1 + (Math.random() - 0.5) * jitter);
    pos[i * 3] = Math.cos(theta) * r * jr;
    pos[i * 3 + 1] = y * jr;
    pos[i * 3 + 2] = Math.sin(theta) * r * jr;
    scl[i] = 0.5 + Math.random();
  }
  return { pos, scl };
}

function Layer({
  count,
  radius,
  jitter,
  size,
  amp,
  target,
  activeRef,
}: {
  count: number;
  radius: number;
  jitter: number;
  size: number;
  amp: number;
  target: THREE.Color;
  activeRef: React.MutableRefObject<boolean>;
}) {
  const mat = useRef<THREE.ShaderMaterial>(null);
  const { pos, scl } = useMemo(() => fibSphere(count, radius, jitter), [count, radius, jitter]);
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uSize: { value: size },
      uAmp: { value: amp },
      uColor: { value: new THREE.Color("#f5f5f5") },
    }),
    [size, amp]
  );

  useFrame((_, dt) => {
    if (!activeRef.current) return;
    const u = mat.current?.uniforms;
    if (!u) return;
    u.uTime.value += Math.min(dt, 0.05);
    (u.uColor.value as THREE.Color).lerp(target, 0.05);
  });

  return (
    <points>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[pos, 3]} />
        <bufferAttribute attach="attributes-aScale" args={[scl, 1]} />
      </bufferGeometry>
      <shaderMaterial ref={mat} vertexShader={VERT} fragmentShader={FRAG} uniforms={uniforms} transparent depthWrite={false} />
    </points>
  );
}

/* A small glowing body smoothly orbiting the orb on a tilted ring. */
function Orbit({ activeRef, light }: { activeRef: React.MutableRefObject<boolean>; light: boolean }) {
  const sat = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    if (!activeRef.current || !sat.current) return;
    const a = state.clock.elapsedTime * 0.5;
    const R = 2.4;
    sat.current.position.set(Math.cos(a) * R, 0, Math.sin(a) * R);
  });
  return (
    <group rotation={[1.15, 0.35, 0]}>
      {/* orbit path — dark & more present on light backgrounds, faint on dark */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[2.4, light ? 0.01 : 0.006, 8, 160]} />
        <meshBasicMaterial color={light ? "#111111" : "#f5f5f5"} transparent opacity={light ? 0.4 : 0.16} toneMapped={false} />
      </mesh>
      {/* a small lit moon — directional light gives it a real crescent/terminator */}
      <mesh ref={sat}>
        <sphereGeometry args={[0.14, 48, 48]} />
        <meshStandardMaterial color={light ? "#3a3a40" : "#9a9aa0"} roughness={0.92} metalness={0.05} flatShading />
      </mesh>
    </group>
  );
}

function Orb({ target, activeRef, light }: { target: THREE.Color; activeRef: React.MutableRefObject<boolean>; light: boolean }) {
  const group = useRef<THREE.Group>(null);
  const mouse = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      mouse.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.current.y = (e.clientY / window.innerHeight) * 2 - 1;
    };
    window.addEventListener("mousemove", onMove, { passive: true });
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  useFrame((_, dt) => {
    if (!activeRef.current || !group.current) return;
    const g = group.current;
    g.rotation.y += dt * 0.045; // constant slow spin
    // gentle lerped tilt toward the cursor
    g.rotation.x += (-mouse.current.y * 0.3 - g.rotation.x) * 0.04;
    g.position.x += (mouse.current.x * 0.25 - g.position.x) * 0.04;
  });

  return (
    <group ref={group}>
      <Layer count={3600} radius={1.0} jitter={0.06} size={11} amp={0.12} target={target} activeRef={activeRef} />
      <Layer count={1500} radius={1.7} jitter={0.28} size={17} amp={0.22} target={target} activeRef={activeRef} />
      <Orbit activeRef={activeRef} light={light} />
    </group>
  );
}

export default function OrbitalCanvas() {
  const { theme } = useTheme();
  const light = theme === "light";
  const target = useMemo(() => new THREE.Color(theme === "light" ? "#111111" : "#f5f5f5"), [theme]);
  const activeRef = useRef(true);
  const [active, setActive] = useState(true);
  const wrap = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        activeRef.current = e.isIntersecting;
        setActive(e.isIntersecting);
      },
      { rootMargin: "10% 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={wrap} className="h-full w-full">
      <Canvas
        frameloop={active ? "always" : "never"}
        camera={{ position: [0, 0, 4.6], fov: 45 }}
        dpr={[1, 1.4]}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      >
        {/* sun + faint fill so the orbiting moon reads as a real lit body */}
        <ambientLight intensity={0.12} />
        <directionalLight position={[5, 2, 4]} intensity={2.6} />
        <Orb target={target} activeRef={activeRef} light={light} />
      </Canvas>
    </div>
  );
}
