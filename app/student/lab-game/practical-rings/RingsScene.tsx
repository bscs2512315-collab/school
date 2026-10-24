"use client";

import { useMemo, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";

export type TreeAspectId = "bark" | "cambium" | "spring_autumn" | "pith" | "dendro";

export interface TreeAspect {
  id: TreeAspectId;
  index: number;
  name: string;
  clue: string;
  description: string;
}

const R0 = 0.12; // pith radius (3D)
const R1 = 0.90; // outer wood radius / vascular cambium (3D)
const TOTAL_RINGS = 12;

// ── Procedural end-grain texture: concentric growth rings on warm wood, with a
// dark pith, radial cracks and a ragged dark bark edge. Mapped so 3D radius r
// (0…1) lands at canvas radius r·(S/2) from the centre.
function makeRingTexture(count: number): THREE.CanvasTexture {
  const S = 1024;
  const c = document.createElement("canvas");
  c.width = c.height = S;
  const g = c.getContext("2d")!;
  const cx = S / 2;
  const cy = S / 2;
  const px = (r: number) => r * (S / 2); // 3D radius → canvas px

  // sapwood base (pale honey wood)
  g.fillStyle = "#d9b784";
  g.fillRect(0, 0, S, S);
  const rad = g.createRadialGradient(cx, cy, px(R0), cx, cy, px(R1));
  rad.addColorStop(0, "#c9995e");
  rad.addColorStop(0.55, "#d8b07c");
  rad.addColorStop(1, "#c59a63");
  g.fillStyle = rad;
  g.beginPath();
  g.arc(cx, cy, px(R1), 0, Math.PI * 2);
  g.fill();

  // fine background micro-rings (springwood fibrous texture)
  g.lineWidth = 1.4;
  for (let i = 0; i < count * 3; i++) {
    const r = R0 + ((R1 - R0) * (i + 0.5)) / (count * 3);
    g.strokeStyle = `rgba(120,80,44,${0.12 + Math.random() * 0.1})`;
    wavyRing(g, cx, cy, px(r), 0.004 * S);
  }

  // major annual rings — one per counted ring (autumnwood late growth boundary)
  for (let i = 0; i < count; i++) {
    const r = R0 + ((R1 - R0) * (i + 1)) / count;
    g.lineWidth = 3 + Math.random() * 1.5;
    g.strokeStyle = `rgba(92,58,28,${0.75 + Math.random() * 0.2})`;
    wavyRing(g, cx, cy, px(r), 0.006 * S);
  }

  // radial medullary rays / cracks fanning out from near the centre
  g.strokeStyle = "rgba(60,38,20,0.55)";
  for (let k = 0; k < 7; k++) {
    const a = (k / 7) * Math.PI * 2 + Math.random() * 0.5;
    const rEnd = px(R1) * (0.5 + Math.random() * 0.45);
    g.lineWidth = 1 + Math.random() * 2.5;
    g.beginPath();
    g.moveTo(cx + Math.cos(a) * px(R0) * 0.4, cy + Math.sin(a) * px(R0) * 0.4);
    let r = px(R0);
    while (r < rEnd) {
      r += 8 + Math.random() * 10;
      const jitter = (Math.random() - 0.5) * 0.12;
      g.lineTo(cx + Math.cos(a + jitter) * r, cy + Math.sin(a + jitter) * r);
    }
    g.stroke();
  }

  // dark heartwood pith at the very centre
  const pith = g.createRadialGradient(cx, cy, 0, cx, cy, px(R0));
  pith.addColorStop(0, "#5a3a1e");
  pith.addColorStop(1, "rgba(120,80,44,0)");
  g.fillStyle = pith;
  g.beginPath();
  g.arc(cx, cy, px(R0), 0, Math.PI * 2);
  g.fill();

  // ragged dark bark ring around the outside
  g.fillStyle = "#3c2814";
  g.beginPath();
  for (let a = 0; a <= Math.PI * 2 + 0.01; a += 0.05) {
    const rr = px(R1) + (4 + Math.random() * 14);
    const x = cx + Math.cos(a) * rr;
    const y = cy + Math.sin(a) * rr;
    a === 0 ? g.moveTo(x, y) : g.lineTo(x, y);
  }
  for (let a = Math.PI * 2; a >= 0; a -= 0.05) {
    const rr = px(R1) - 2;
    g.lineTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr);
  }
  g.fill();

  const tex = new THREE.CanvasTexture(c);
  tex.anisotropy = 8;
  return tex;
}

function wavyRing(g: CanvasRenderingContext2D, cx: number, cy: number, r: number, amp: number) {
  const wobble = 3 + Math.floor(Math.random() * 4);
  const phase = Math.random() * Math.PI * 2;
  g.beginPath();
  for (let a = 0; a <= Math.PI * 2 + 0.02; a += 0.03) {
    const rr = r + Math.sin(a * wobble + phase) * amp;
    const x = cx + Math.cos(a) * rr;
    const y = cy + Math.sin(a) * rr;
    a === 0 ? g.moveTo(x, y) : g.lineTo(x, y);
  }
  g.closePath();
  g.stroke();
}

// ── Procedural bark for the cylinder side: rough vertical brown furrows.
function makeBarkTexture(): THREE.CanvasTexture {
  const W = 1024;
  const H = 256;
  const c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  const g = c.getContext("2d")!;
  g.fillStyle = "#5a3c20";
  g.fillRect(0, 0, W, H);
  // vertical furrows (bark runs along the trunk)
  for (let i = 0; i < 260; i++) {
    const x = Math.random() * W;
    const w = 2 + Math.random() * 9;
    const shade = 30 + Math.random() * 70;
    g.fillStyle = `rgba(${shade},${shade * 0.62},${shade * 0.32},${0.35 + Math.random() * 0.4})`;
    g.beginPath();
    let y = 0;
    g.moveTo(x, 0);
    while (y < H) {
      y += 12 + Math.random() * 20;
      g.lineTo(x + (Math.random() - 0.5) * 10, y);
    }
    g.lineWidth = w;
    g.strokeStyle = g.fillStyle;
    g.stroke();
  }
  // lighter flecks
  for (let i = 0; i < 400; i++) {
    g.fillStyle = `rgba(190,150,90,${Math.random() * 0.25})`;
    g.fillRect(Math.random() * W, Math.random() * H, 2 + Math.random() * 4, 2 + Math.random() * 6);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(3, 1);
  tex.anisotropy = 8;
  return tex;
}

function TourAspectHighlight({ aspect }: { aspect?: TreeAspect }) {
  if (!aspect) return null;

  if (aspect.id === "bark") {
    return (
      <group position={[0, 0, 0.007]}>
        <mesh>
          <ringGeometry args={[0.88, 1.02, 96]} />
          <meshBasicMaterial color="#f59e0b" transparent opacity={0.65} side={THREE.DoubleSide} depthWrite={false} />
        </mesh>
      </group>
    );
  }

  if (aspect.id === "cambium") {
    return (
      <group position={[0, 0, 0.007]}>
        <mesh>
          <ringGeometry args={[0.87, 0.91, 96]} />
          <meshBasicMaterial color="#06b6d4" transparent opacity={0.85} side={THREE.DoubleSide} depthWrite={false} />
        </mesh>
      </group>
    );
  }

  if (aspect.id === "spring_autumn") {
    const rSpring = R0 + ((R1 - R0) * 5.4) / TOTAL_RINGS;
    const rAutumn = R0 + ((R1 - R0) * 6) / TOTAL_RINGS;
    return (
      <group position={[0, 0, 0.007]}>
        {/* Early wood band */}
        <mesh>
          <ringGeometry args={[rSpring - 0.04, rSpring + 0.02, 96]} />
          <meshBasicMaterial color="#fbbf24" transparent opacity={0.5} side={THREE.DoubleSide} depthWrite={false} />
        </mesh>
        {/* Late wood boundary line */}
        <mesh position={[0, 0, 0.001]}>
          <ringGeometry args={[rAutumn - 0.015, rAutumn + 0.015, 96]} />
          <meshBasicMaterial color="#ef4444" transparent opacity={0.85} side={THREE.DoubleSide} depthWrite={false} />
        </mesh>
      </group>
    );
  }

  if (aspect.id === "pith") {
    return (
      <group position={[0, 0, 0.007]}>
        <mesh>
          <circleGeometry args={[R0 * 1.15, 64]} />
          <meshBasicMaterial color="#f97316" transparent opacity={0.7} side={THREE.DoubleSide} depthWrite={false} />
        </mesh>
      </group>
    );
  }

  if (aspect.id === "dendro") {
    return (
      <group position={[0, 0, 0.007]}>
        {/* Radial line across rings from pith to bark */}
        <mesh position={[R1 / 2, 0, 0]}>
          <planeGeometry args={[R1, 0.018]} />
          <meshBasicMaterial color="#10b981" transparent opacity={0.9} side={THREE.DoubleSide} depthWrite={false} />
        </mesh>
      </group>
    );
  }

  return null;
}

function Log({
  count,
  counted,
  onToggle,
  activeAspect,
  nextTargetIndex,
  isTourMode,
}: {
  count: number;
  counted: Set<number>;
  onToggle: (i: number) => void;
  activeAspect?: TreeAspect;
  nextTargetIndex?: number;
  isTourMode?: boolean;
}) {
  const ringTex = useMemo(() => makeRingTexture(count), [count]);
  const barkTex = useMemo(() => makeBarkTexture(), []);
  const radii = useMemo(
    () => Array.from({ length: count }, (_, i) => R0 + ((R1 - R0) * (i + 1)) / count),
    [count]
  );
  const [hoveredRing, setHoveredRing] = useState<number | null>(null);

  return (
    <group rotation={[-0.28, 0, 0]}>
      {/* 3D log body — bark on the curved cylindrical side */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, -0.45]} castShadow receiveShadow>
        <cylinderGeometry args={[1, 1, 0.9, 64, 1, true]} />
        <meshStandardMaterial map={barkTex} roughness={0.92} side={THREE.DoubleSide} />
      </mesh>

      {/* realistic end-grain face (front) */}
      <mesh position={[0, 0, 0.001]}>
        <circleGeometry args={[1, 96]} />
        <meshStandardMaterial map={ringTex} roughness={0.8} />
      </mesh>

      {/* matching end-grain face (back) */}
      <mesh position={[0, 0, -0.901]} rotation={[0, Math.PI, 0]}>
        <circleGeometry args={[1, 96]} />
        <meshStandardMaterial map={ringTex} roughness={0.8} />
      </mesh>

      {/* Guided Tour Highlighting */}
      {isTourMode && <TourAspectHighlight aspect={activeAspect} />}

      {/* Clickable + highlight rings, on BOTH ends */}
      <RingLayer
        radii={radii}
        counted={counted}
        onToggle={onToggle}
        hoveredRing={hoveredRing}
        setHoveredRing={setHoveredRing}
        nextTargetIndex={nextTargetIndex}
        z={0.006}
        back={false}
      />
      <RingLayer
        radii={radii}
        counted={counted}
        onToggle={onToggle}
        hoveredRing={hoveredRing}
        setHoveredRing={setHoveredRing}
        nextTargetIndex={nextTargetIndex}
        z={-0.906}
        back={true}
      />
    </group>
  );
}

// One set of ring markers on an end face.
function RingLayer({
  radii,
  counted,
  onToggle,
  hoveredRing,
  setHoveredRing,
  nextTargetIndex,
  z,
  back,
}: {
  radii: number[];
  counted: Set<number>;
  onToggle: (i: number) => void;
  hoveredRing: number | null;
  setHoveredRing: (i: number | null) => void;
  nextTargetIndex?: number;
  z: number;
  back: boolean;
}) {
  return (
    <group position={[0, 0, z]} rotation={back ? [0, Math.PI, 0] : [0, 0, 0]}>
      {radii.map((r, i) => {
        const isCounted = counted.has(i);
        const isNext = i === nextTargetIndex;
        const isHovered = hoveredRing === i;

        // half the gap to neighbours → wide, easy-to-hit bands
        const half = i === 0 ? (radii[1] - radii[0]) / 2 : (radii[i] - radii[i - 1]) / 2;

        return (
          <group key={i}>
            {/* Wide transparent hit mesh */}
            <mesh
              onClick={(e) => {
                e.stopPropagation();
                onToggle(i);
              }}
              onPointerOver={(e) => {
                e.stopPropagation();
                setHoveredRing(i);
                document.body.style.cursor = "pointer";
              }}
              onPointerOut={() => {
                setHoveredRing(null);
                document.body.style.cursor = "auto";
              }}
            >
              <ringGeometry args={[Math.max(0.001, r - half), r + half, 96]} />
              <meshBasicMaterial transparent opacity={0} depthWrite={false} side={THREE.DoubleSide} />
            </mesh>

            {/* Counted ring glowing emerald green */}
            {isCounted && (
              <mesh position={[0, 0, 0.001]} raycast={() => null}>
                <ringGeometry args={[r - 0.016, r + 0.016, 96]} />
                <meshBasicMaterial color="#10b981" transparent opacity={0.95} depthWrite={false} side={THREE.DoubleSide} />
              </mesh>
            )}

            {/* Active next ring subtle amber guide */}
            {isNext && !isCounted && (
              <mesh position={[0, 0, 0.001]} raycast={() => null}>
                <ringGeometry args={[r - 0.014, r + 0.014, 96]} />
                <meshBasicMaterial color="#f59e0b" transparent opacity={0.65} depthWrite={false} side={THREE.DoubleSide} />
              </mesh>
            )}

            {/* Hover highlight ring */}
            {isHovered && !isCounted && (
              <mesh position={[0, 0, 0.001]} raycast={() => null}>
                <ringGeometry args={[r - 0.012, r + 0.012, 96]} />
                <meshBasicMaterial color="#38bdf8" transparent opacity={0.5} depthWrite={false} side={THREE.DoubleSide} />
              </mesh>
            )}
          </group>
        );
      })}
    </group>
  );
}

export default function RingsScene({
  count = TOTAL_RINGS,
  counted,
  onToggle,
  activeAspect,
  isTourMode = false,
  nextTargetIndex,
}: {
  count?: number;
  counted: Set<number>;
  onToggle: (i: number) => void;
  activeAspect?: TreeAspect;
  isTourMode?: boolean;
  nextTargetIndex?: number;
}) {
  return (
    <Canvas shadows camera={{ position: [0, 0.35, 2.8], fov: 42 }} dpr={[1, 2]}>
      <color attach="background" args={["#bed4c8"]} />
      <ambientLight intensity={0.8} />
      <directionalLight position={[2.5, 4.5, 3.5]} intensity={1.2} castShadow />
      <directionalLight position={[-3, 2, 1.5]} intensity={0.45} />
      <directionalLight position={[0, -2, -2]} intensity={0.3} />
      <Log
        count={count}
        counted={counted}
        onToggle={onToggle}
        activeAspect={activeAspect}
        nextTargetIndex={nextTargetIndex}
        isTourMode={isTourMode}
      />
      <OrbitControls
        enablePan={false}
        minDistance={1.8}
        maxDistance={4.8}
        minPolarAngle={0.4}
        maxPolarAngle={Math.PI / 1.85}
      />
    </Canvas>
  );
}
