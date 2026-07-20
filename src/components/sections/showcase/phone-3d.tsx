"use client";

import { Suspense, useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useGLTF, Environment, Lightformer, ContactShadows } from "@react-three/drei";
import * as THREE from "three";
import type { MotionValue } from "framer-motion";

/*
 * Real iPhone 15 Pro Max model.
 * "iPhone 15 Pro Max" by MpPower™ — sketchfab.com/3d-models/
 * iphone-15-pro-max-5b7b35513a154ac69619dc2b2fe15686 (CC-BY-4.0).
 * Full license: /public/models/iphone/license.txt
 */
const MODEL = "/models/iphone/scene.gltf";
useGLTF.preload(MODEL);

/* Screen plate measured from the model: 1.643 × 3.53 at the front face. */
const SCREEN_MAT = "Material.001";
const SCR = { w: 1.6, h: 3.46, r: 0.22, z: 0.145 };
/* canvas window: the visible screen slice of the tall UI canvas */
const CANVAS_W = 640;
const CANVAS_H = 2400;
const WIN_FRAC = (CANVAS_W * (SCR.h / SCR.w)) / CANVAS_H; // ≈ 0.577

const lerp = (a: number, b: number, t: number) => a + (b - a) * Math.max(0, Math.min(1, t));
const smooth = (e0: number, e1: number, x: number) => {
  const t = Math.max(0, Math.min(1, (x - e0) / (e1 - e0)));
  return t * t * (3 - 2 * t);
};

function roundedRectShape(w: number, h: number, r: number) {
  const s = new THREE.Shape();
  const x = -w / 2;
  const y = -h / 2;
  s.moveTo(x + r, y);
  s.lineTo(x + w - r, y);
  s.quadraticCurveTo(x + w, y, x + w, y + r);
  s.lineTo(x + w, y + h - r);
  s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  s.lineTo(x + r, y + h);
  s.quadraticCurveTo(x, y + h, x, y + h - r);
  s.lineTo(x, y + r);
  s.quadraticCurveTo(x, y, x + r, y);
  s.closePath();
  return s;
}

function rr(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/* The brand's mobile app, drawn as one tall canvas the screen scrolls through. */
function useMobileUITexture() {
  return useMemo(() => {
    const c = document.createElement("canvas");
    c.width = CANVAS_W;
    c.height = CANVAS_H;
    const x = c.getContext("2d")!;
    const BONE = "#F5F5F5";
    const MUT = "rgba(245,245,245,0.5)";
    const LINE = "rgba(245,245,245,0.1)";
    const CARD = "#101014";
    const ACCENT = "#FF4D1F";

    x.fillStyle = "#050507";
    x.fillRect(0, 0, CANVAS_W, CANVAS_H);

    const card = (px: number, py: number, w: number, h: number, r = 24) => {
      rr(x, px, py, w, h, r);
      x.fillStyle = CARD;
      x.fill();
      x.strokeStyle = LINE;
      x.lineWidth = 2;
      rr(x, px, py, w, h, r);
      x.stroke();
    };
    const mono = (size: number) => `600 ${size}px ui-monospace, Menlo, monospace`;
    const sans = (size: number, w = 600) => `${w} ${size}px ui-sans-serif, system-ui`;

    // status bar
    x.fillStyle = BONE;
    x.font = mono(26);
    x.fillText("9:41", 48, 64);
    x.fillStyle = MUT;
    x.font = mono(22);
    x.textAlign = "right";
    x.fillText("●●● ▂▄▆", CANVAS_W - 44, 62);
    x.textAlign = "left";

    // brand row
    x.fillStyle = ACCENT;
    x.beginPath();
    x.arc(70, 140, 22, 0, Math.PI * 2);
    x.fill();
    x.fillStyle = "#050507";
    x.font = "italic 700 28px Georgia, serif";
    x.fillText("a", 62, 150);
    x.fillStyle = BONE;
    x.font = mono(24);
    x.fillText("AMR/STUDIO", 110, 149);

    // hero card
    card(40, 196, 560, 320, 32);
    x.fillStyle = ACCENT;
    x.globalAlpha = 0.25;
    x.beginPath();
    x.arc(560, 230, 110, 0, Math.PI * 2);
    x.fill();
    x.globalAlpha = 1;
    x.fillStyle = MUT;
    x.font = mono(20);
    x.fillText("NOW BOOKING · Q3", 80, 256);
    x.fillStyle = BONE;
    x.font = sans(58, 700);
    x.fillText("Cinematic", 80, 330);
    x.fillText("interfaces.", 80, 396);
    rr(x, 80, 432, 280, 56, 28);
    x.fillStyle = BONE;
    x.fill();
    x.fillStyle = "#050507";
    x.font = mono(20);
    x.fillText("START A PROJECT →", 104, 467);

    // selected work
    x.fillStyle = MUT;
    x.font = mono(20);
    x.fillText("SELECTED WORK", 48, 590);
    const rows: [string, string, string][] = [
      ["Scenarios", "FEATURED", "#FF4D1F"],
      ["Quipmed", "LIVE", "#34d399"],
      ["LivFunctional", "SHIPPED", "#E0A45C"],
      ["Smartee", "BUILDING", "#E0303A"],
    ];
    rows.forEach((r, i) => {
      const y = 620 + i * 124;
      card(40, y, 560, 104, 24);
      rr(x, 70, y + 24, 56, 56, 14);
      const g = x.createLinearGradient(70, y + 24, 126, y + 80);
      g.addColorStop(0, r[2]);
      g.addColorStop(1, "#0a0a0a");
      x.fillStyle = g;
      x.fill();
      x.fillStyle = BONE;
      x.font = sans(28);
      x.fillText(r[0], 150, y + 50);
      x.fillStyle = MUT;
      x.font = mono(18);
      x.fillText(r[1], 150, y + 82);
      x.fillStyle = MUT;
      x.font = sans(30);
      x.fillText("↗", 548, y + 64);
    });

    // services
    x.fillStyle = MUT;
    x.font = mono(20);
    x.fillText("SERVICES", 48, 1180);
    const svc = ["Product Eng", "Motion", "3D / WebGL", "Brand"];
    svc.forEach((s, i) => {
      const px = 40 + (i % 2) * 292;
      const py = 1210 + Math.floor(i / 2) * 150;
      card(px, py, 268, 126, 24);
      x.fillStyle = BONE;
      x.font = sans(26);
      x.fillText(s, px + 28, py + 56);
      x.fillStyle = MUT;
      x.font = mono(17);
      x.fillText("↗ BUILD", px + 28, py + 94);
    });

    // stats
    const stats: [string, string][] = [["07+", "YEARS"], ["40+", "BUILDS"], ["98", "PERF"]];
    stats.forEach((s, i) => {
      const px = 40 + i * 192;
      card(px, 1546, 176, 130, 22);
      x.fillStyle = BONE;
      x.font = sans(44, 700);
      x.textAlign = "center";
      x.fillText(s[0], px + 88, 1606);
      x.fillStyle = MUT;
      x.font = mono(16);
      x.fillText(s[1], px + 88, 1644);
      x.textAlign = "left";
    });

    // quote
    card(40, 1716, 560, 220, 28);
    x.fillStyle = ACCENT;
    x.font = "italic 700 64px Georgia, serif";
    x.fillText("“", 76, 1790);
    x.fillStyle = "rgba(245,245,245,0.85)";
    x.font = sans(25, 500);
    x.fillText("He ships moments, not features.", 76, 1830);
    x.fillText("Clients notice in thirty seconds.", 76, 1866);
    x.fillStyle = MUT;
    x.font = mono(17);
    x.fillText("STUDIO FOUNDER", 76, 1908);

    // CTA
    card(40, 1976, 560, 250, 32);
    const cg = x.createLinearGradient(40, 1976, 600, 2226);
    cg.addColorStop(0, "rgba(255,77,31,0.25)");
    cg.addColorStop(1, "rgba(255,77,31,0.04)");
    rr(x, 40, 1976, 560, 250, 32);
    x.fillStyle = cg;
    x.fill();
    x.fillStyle = BONE;
    x.font = "italic 700 48px Georgia, serif";
    x.fillText("Let's build.", 80, 2056);
    x.fillStyle = MUT;
    x.font = mono(19);
    x.fillText("SALMIYA · GMT+3", 80, 2096);
    rr(x, 80, 2128, 240, 56, 28);
    x.fillStyle = "#23b35c";
    x.fill();
    x.fillStyle = "#fff";
    x.font = mono(19);
    x.fillText("WHATSAPP →", 110, 2163);

    // home indicator zone
    x.fillStyle = "rgba(245,245,245,0.3)";
    rr(x, CANVAS_W / 2 - 70, 2356, 140, 10, 5);
    x.fill();

    const tex = new THREE.CanvasTexture(c);
    tex.anisotropy = 8;
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }, []);
}

function Screen({ progress, activeRef }: { progress: MotionValue<number>; activeRef: React.MutableRefObject<boolean> }) {
  const ui = useMobileUITexture();
  const shape = useMemo(() => roundedRectShape(SCR.w, SCR.h, SCR.r), []);

  // ShapeGeometry UVs are in shape coords — remap into the canvas window
  useEffect(() => {
    ui.repeat.set(1 / SCR.w, WIN_FRAC / SCR.h);
    ui.offset.set(0.5, 1 - WIN_FRAC + WIN_FRAC / 2);
  }, [ui]);

  useFrame(() => {
    if (!activeRef.current) return;
    const off = lerp(1 - WIN_FRAC, 0, smooth(0.42, 0.84, progress.get()));
    ui.offset.y = off + WIN_FRAC / 2;
  });

  return (
    <mesh position={[0, 0, SCR.z]}>
      <shapeGeometry args={[shape, 18]} />
      <meshBasicMaterial map={ui} toneMapped={false} />
    </mesh>
  );
}

function Phone({ progress, activeRef }: { progress: MotionValue<number>; activeRef: React.MutableRefObject<boolean> }) {
  const group = useRef<THREE.Group>(null);
  const { camera } = useThree();
  const { scene } = useGLTF(MODEL);

  // black out the model's own screen plate behind the live UI
  useEffect(() => {
    scene.traverse((o) => {
      const mesh = o as THREE.Mesh;
      if (!mesh.isMesh) return;
      const m = mesh.material as THREE.MeshStandardMaterial;
      if (m?.name === SCREEN_MAT) {
        m.color = new THREE.Color(0x020203);
        m.emissive = new THREE.Color(0x000000);
        m.emissiveMap = null;
        m.needsUpdate = true;
      }
    });
  }, [scene]);

  useFrame(() => {
    if (!activeRef.current) return;
    const p = progress.get();
    if (group.current) {
      const t = smooth(0.02, 0.34, p);
      group.current.rotation.y = lerp(-1.05, 0, t);
      group.current.rotation.x = lerp(0.15, 0, t);
    }
    // dolly in for the scrolling UI, drift back out at the end
    const inn = smooth(0.34, 0.54, p) * (1 - smooth(0.82, 0.96, p));
    camera.position.set(0, 0, lerp(6.4, 4.7, inn));
    camera.lookAt(0, 0, 0);
  });

  return (
    <group ref={group}>
      {/* model centered at the origin (its own pivot is offset) */}
      <primitive object={scene} position={[-0.026, -0.744, 0.04]} />
      <Suspense fallback={null}>
        <Screen progress={progress} activeRef={activeRef} />
      </Suspense>
      <ContactShadows position={[0, -1.95, 0]} opacity={0.45} scale={10} blur={2.6} far={4} />
    </group>
  );
}

export default function PhoneCanvas({
  progress,
  activeRef,
  frameloop = "always",
}: {
  progress: MotionValue<number>;
  activeRef: React.MutableRefObject<boolean>;
  frameloop?: "always" | "never";
}) {
  return (
    <Canvas
      frameloop={frameloop}
      camera={{ position: [0, 0, 6.4], fov: 35 }}
      dpr={[1, 1.4]}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = 1.05;
      }}
      style={{ position: "absolute", inset: 0 }}
    >
      <ambientLight intensity={0.4} />
      <directionalLight position={[3, 6, 4]} intensity={1.4} />
      <directionalLight position={[-4, 2, 3]} intensity={0.4} />
      <Suspense fallback={null}>
        <Phone progress={progress} activeRef={activeRef} />
      </Suspense>
      <Environment resolution={256}>
        <Lightformer intensity={2.6} position={[0, 4, 4]} scale={[12, 7, 1]} />
        <Lightformer intensity={1.3} position={[0, 2, -6]} scale={[10, 6, 1]} color="#cfe0ff" />
        <Lightformer intensity={0.9} position={[-6, 1, 2]} scale={[4, 6, 1]} />
        <Lightformer intensity={0.8} position={[6, 0, 3]} scale={[4, 6, 1]} />
      </Environment>
    </Canvas>
  );
}
