"use client";

import { Suspense, useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useGLTF, Environment, Lightformer } from "@react-three/drei";
import * as THREE from "three";
import type { MotionValue } from "framer-motion";
import { drawCodeMatrix, CANVAS_W, CANVAS_H } from "./code-matrix-draw";

/*
 * Real MacBook Pro M3 16" model.
 * "macbook pro M3 16 inch 2024" by jackbaeten — sketchfab.com/3d-models/
 * macbook-pro-m3-16-inch-2024-8e34fc2b303144f78490007d91ff57c4 (CC-BY-4.0).
 * Full license: /public/models/macbook/license.txt
 */
const MODEL = "/models/macbook/scene.gltf";

useGLTF.preload(MODEL);

/* Display plate measured from the model's geometry (cm units):
   34.4 × 22.25 slope, centered [0, 11.75, −16.96], leaning back ~20°. */
const SCREEN_MAT = "sfCQkHOWyrsLmor"; // the model's baked wallpaper material
const SCREEN_TILT = -0.3487;

/* Lid rig: the model's display group, re-pivoted at the hinge line so the lid
   opens on scroll exactly like the old hand-built model. */
const LID_NODE = "VCQqxpxkUlzqcJI_62";
const HINGE = new THREE.Vector3(0, 0.05, -11.9); // hinge line in model space
const LID_CLOSED = 1.95; // rad — lid folded flat onto the base

const lerp = (a: number, b: number, t: number) => a + (b - a) * Math.max(0, Math.min(1, t));
const smooth = (e0: number, e1: number, x: number) => {
  const t = Math.max(0, Math.min(1, (x - e0) / (e1 - e0)));
  return t * t * (3 - 2 * t);
};

/* The live "code-to-UI matrix" screen, projected exactly onto the display
   plate. A 2D canvas is painted every frame (typing bound to scroll) and used
   as the screen texture. It rides the lid: once the lid pivot exists, the mesh
   re-parents itself into it so it opens and closes with the screen. */
function ReelScreen({
  progress,
  activeRef,
  pivotRef,
}: {
  progress: MotionValue<number>;
  activeRef: React.MutableRefObject<boolean>;
  pivotRef: React.MutableRefObject<THREE.Group | null>;
}) {
  const mesh = useRef<THREE.Mesh>(null);

  const canvas = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = CANVAS_W;
    c.height = CANVAS_H;
    return c;
  }, []);
  const ctx = useMemo(() => canvas.getContext("2d"), [canvas]);
  const texture = useMemo(() => {
    const t = new THREE.CanvasTexture(canvas);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 4;
    t.minFilter = THREE.LinearFilter;
    return t;
  }, [canvas]);
  useEffect(() => () => texture.dispose(), [texture]);
  const frame = useRef(0);

  useFrame((state) => {
    // self-healing attach: join the lid rig as soon as it exists
    if (mesh.current && pivotRef.current && mesh.current.parent !== pivotRef.current) {
      pivotRef.current.attach(mesh.current);
    }
    if (!activeRef.current || !ctx) return;
    // repaint at ~30fps (every other frame) — the canvas redraw is the pricey
    // part; the texture upload dominates, so halving it keeps the scene smooth
    frame.current = (frame.current + 1) % 2;
    if (frame.current !== 0) return;
    // map the scroll window where the lid is open to 0..1 typing progress
    const local = smooth(0.16, 0.9, progress.get());
    drawCodeMatrix(ctx, local, state.clock.elapsedTime);
    texture.needsUpdate = true;
  });

  return (
    <mesh ref={mesh} position={[0, 11.78, -16.82]} rotation={[SCREEN_TILT, 0, 0]}>
      {/* match the model's display glass exactly (34.4 × 22.25) */}
      <planeGeometry args={[34.4, 22.25]} />
      <meshBasicMaterial map={texture} toneMapped={false} />
    </mesh>
  );
}

function Macbook({ progress, activeRef }: { progress: MotionValue<number>; activeRef: React.MutableRefObject<boolean> }) {
  const group = useRef<THREE.Group>(null);
  const pivotRef = useRef<THREE.Group | null>(null);
  const { camera } = useThree();
  const { scene } = useGLTF(MODEL);

  useEffect(() => {
    // black out the baked wallpaper so the live reel owns the display
    scene.traverse((o) => {
      const mesh = o as THREE.Mesh;
      if (!mesh.isMesh) return;
      const m = mesh.material as THREE.MeshStandardMaterial;
      if (m?.name === SCREEN_MAT) {
        m.emissive = new THREE.Color(0x000000);
        m.emissiveMap = null;
        m.color = new THREE.Color(0x020203);
        m.needsUpdate = true;
      }
    });

    // rig the lid: insert a pivot group on the hinge line and re-parent the
    // display group into it (attach() preserves the pose), so rotating the
    // pivot opens/closes the lid like the old build
    const lid = scene.getObjectByName(LID_NODE);
    if (lid && lid.parent && lid.parent.name !== "__lidPivot") {
      scene.updateMatrixWorld(true);
      const parent = lid.parent;
      const pivot = new THREE.Group();
      pivot.name = "__lidPivot";
      parent.add(pivot);
      const hingeWorld = scene.localToWorld(HINGE.clone());
      pivot.position.copy(parent.worldToLocal(hingeWorld));
      pivot.updateMatrixWorld(true);
      pivot.attach(lid);
      pivotRef.current = pivot;
    } else if (lid?.parent?.name === "__lidPivot") {
      pivotRef.current = lid.parent as THREE.Group;
    }
  }, [scene]);

  useFrame(() => {
    if (!activeRef.current) return;
    const p = progress.get();
    // the lid opens over the first beat — just like the old model
    if (pivotRef.current) {
      pivotRef.current.rotation.x = lerp(LID_CLOSED, 0, smooth(0, 0.16, p));
    }
    // presentation swing: angled like a product shot, settling to face you
    if (group.current) {
      const t = smooth(0.04, 0.46, p);
      group.current.rotation.y = lerp(-0.55, 0, t);
      group.current.rotation.x = lerp(0.13, 0.005, t);
    }
    // camera dolly into the display for the reel close-up, then back out
    const inn = smooth(0.34, 0.56, p) * (1 - smooth(0.72, 0.88, p));
    camera.position.set(0, lerp(0.7, 1.05, inn), lerp(5.2, 3.1, inn));
    camera.lookAt(0, lerp(0.25, 0.85, inn), -0.6);
  });

  return (
    <group ref={group} position={[0, -0.35, 0]} scale={0.1}>
      <primitive object={scene} />
      <Suspense fallback={null}>
        <ReelScreen progress={progress} activeRef={activeRef} pivotRef={pivotRef} />
      </Suspense>
    </group>
  );
}

export default function LaptopCanvas({
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
      camera={{ position: [0, 0.7, 5.2], fov: 35 }}
      dpr={[1, 1.4]}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = 1.05;
      }}
      style={{ position: "absolute", inset: 0 }}
    >
      {/* neutral studio — big soft key, cool rim, side fills */}
      <ambientLight intensity={0.4} />
      <directionalLight position={[3, 6, 4]} intensity={1.4} />
      <directionalLight position={[-4, 2, 3]} intensity={0.4} />
      <Suspense fallback={null}>
        <Macbook progress={progress} activeRef={activeRef} />
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
