"use client";

import { useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { LabRoom } from "../_scene/LabRoom";
import { ApparatusTourTag } from "../_practical/ApparatusTourTag";
import { getReagentLabel } from "../_practical/reagentLabel";
import { BeakerGlassShell } from "../_practical/BeakerGlassShell";
import { createBeakerLiquid, updateBeakerLiquid } from "../_practical/beakerLiquid";
import { Beaker, ChemLab } from "../walk/ChemLab";

export type ApparatusId = "flask_a" | "empty_tube" | "koh_box" | "delivery_tube" | "beaker_a" | "flask_b" | "beaker_b" | "colored_water";
export const DYE = "#bf526b";
const BENCH_Y = 1.08;
const A_X = -0.64;
const B_X = 0.62;

function progress(assembly: number, step: number) {
  return THREE.MathUtils.clamp(assembly - step + 1, 0, 1);
}

function GlassBend({ points }: { points: [number, number, number][] }) {
  const geometry = useMemo(() => new THREE.TubeGeometry(
    new THREE.CatmullRomCurve3(points.map((point) => new THREE.Vector3(...point)), false, "centripetal"),
    48, 0.014, 12, false,
  ), [points]);
  return <mesh geometry={geometry}><meshStandardMaterial color="#d6e8e8" transparent opacity={0.55} depthWrite={false} metalness={0.12} roughness={0.045} /></mesh>;
}

function GramSeed({ index, living }: { index: number; living: boolean }) {
  const theta = index * 2.399;
  const radius = 0.035 + Math.sqrt(index / 10) * 0.12;
  const x = Math.cos(theta) * radius;
  const z = Math.sin(theta) * radius * 0.72;
  return <group position={[x, 0.045 + (index % 3) * 0.024, z]} rotation={[index * 0.39, index * 1.11, index * 0.24]}>
    <mesh castShadow scale={[1.08, 0.76, 0.93]}><sphereGeometry args={[0.034 + (index % 3) * 0.003, 18, 12]} /><meshStandardMaterial color={living ? (index % 2 ? "#b7874b" : "#c79a5c") : "#9c896e"} roughness={0.96} /></mesh>
    <mesh position={[-0.023, 0.006, 0.016]} scale={[0.49, 0.26, 0.51]}><sphereGeometry args={[0.033, 12, 8]} /><meshStandardMaterial color={living ? "#e0b777" : "#b6a282"} roughness={1} /></mesh>
    <mesh position={[0.029, 0.004, 0.008]} scale={[0.2, 0.12, 0.24]}><sphereGeometry args={[0.025, 10, 8]} /><meshStandardMaterial color="#76583b" roughness={1} /></mesh>
    {living && <mesh position={[0.05, 0.028, 0]} rotation={[0, 0, -0.55]}><cylinderGeometry args={[0.002, 0.005, 0.07, 8]} /><meshStandardMaterial color="#e6e0c2" roughness={1} /></mesh>}
  </group>;
}

function KohTestTube({ filled }: { filled: number }) {
  return <group>
    {/* The same 0.028-radius, 0.30-high rounded test tube and dark mouth used by Chemistry XII. */}
    <mesh renderOrder={4} position={[0, 0.164, 0]}><cylinderGeometry args={[0.028, 0.028, 0.272, 24, 1, true]} /><meshStandardMaterial transparent opacity={0.56} depthWrite={false} roughness={0.05} metalness={0.15} color="#c2cace" side={THREE.DoubleSide} /></mesh>
    <mesh renderOrder={4} position={[0, 0.028, 0]}><sphereGeometry args={[0.028, 20, 14, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2]} /><meshStandardMaterial transparent opacity={0.56} depthWrite={false} roughness={0.05} metalness={0.15} color="#c2cace" side={THREE.DoubleSide} /></mesh>
    <mesh renderOrder={5} position={[-0.025, 0.16, 0.006]}><boxGeometry args={[0.002, 0.24, 0.002]} /><meshBasicMaterial color="#f1f7f6" transparent opacity={0.56} depthWrite={false} /></mesh>
    <mesh renderOrder={5} position={[0.025, 0.16, 0.006]}><boxGeometry args={[0.002, 0.24, 0.002]} /><meshBasicMaterial color="#f1f7f6" transparent opacity={0.56} depthWrite={false} /></mesh>
    <mesh renderOrder={5} position={[0, 0.3, 0]} rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[0.029, 0.006, 10, 24]} /><meshStandardMaterial color="#2a2a2a" roughness={0.5} /></mesh>
    {Array.from({ length: Math.floor(filled * 8) }, (_, i) => <mesh key={i} renderOrder={5} position={[Math.sin(i * 2.4) * 0.015, 0.029 + Math.floor(i / 3) * 0.012, Math.cos(i * 2.4) * 0.011]}><dodecahedronGeometry args={[0.009, 0]} /><meshStandardMaterial color="#e5e8db" roughness={0.82} /></mesh>)}
  </group>;
}

function Plaque({ text: label }: { text: string }) {
  const map = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 2048; canvas.height = 384;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "#265a3b"; ctx.fillRect(0, 0, 2048, 384);
    ctx.fillStyle = "#fff8de"; ctx.font = "bold 146px Arial";
    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText(label, 1024, 192);
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 16;
    texture.minFilter = THREE.LinearMipmapLinearFilter;
    return texture;
  }, [label]);
  return <mesh rotation={[-0.38, 0, 0]}><planeGeometry args={[0.58, 0.11]} /><meshBasicMaterial map={map} side={THREE.DoubleSide} /></mesh>;
}

function LabSpoon({ loaded }: { loaded: boolean }) {
  const metal = <meshStandardMaterial color="#b8c3c5" metalness={0.82} roughness={0.2} side={THREE.DoubleSide} />;
  const bowl = useMemo(() => [
    new THREE.Vector2(0, -0.012),
    new THREE.Vector2(0.014, -0.011),
    new THREE.Vector2(0.023, -0.006),
    new THREE.Vector2(0.028, 0.004),
    new THREE.Vector2(0.027, 0.006),
  ], []);
  return <group>
    <mesh position={[0.024, 0.004, 0]} rotation={[0, 0, -Math.PI / 2]}><cylinderGeometry args={[0.0035, 0.005, 0.13, 14]} />{metal}</mesh>
    <mesh position={[0.089, 0.004, 0]} scale={[1, 0.7, 1]}><sphereGeometry args={[0.006, 14, 8]} />{metal}</mesh>
    <mesh position={[-0.052, 0, 0]} scale={[1.12, 1, 0.85]}><latheGeometry args={[bowl, 24]} />{metal}</mesh>
    {loaded && [0, 1, 2, 3, 4].map((i) => <mesh key={i} position={[-0.052 + Math.sin(i * 2.3) * 0.014, 0.001 + (i % 2) * 0.006, Math.cos(i * 2.3) * 0.01]}><dodecahedronGeometry args={[0.006, 0]} /><meshStandardMaterial color="#eff0e7" roughness={0.9} /></mesh>)}
  </group>;
}

function KohBox({ x, y = BENCH_Y, z = 0.62, spoonOut = false }: { x: number; y?: number; z?: number; spoonOut?: boolean }) {
  const label = useMemo(() => getReagentLabel("KOH pellets"), []);
  return <group position={[x, y, z]}>
    <mesh position={[0, 0.012, 0]}><boxGeometry args={[0.18, 0.024, 0.15]} /><meshStandardMaterial color="#dedbd2" roughness={0.8} /></mesh>
    <mesh position={[-0.082, 0.083, 0]}><boxGeometry args={[0.016, 0.14, 0.15]} /><meshStandardMaterial color="#e9e6dd" roughness={0.72} /></mesh>
    <mesh position={[0.082, 0.083, 0]}><boxGeometry args={[0.016, 0.14, 0.15]} /><meshStandardMaterial color="#e9e6dd" roughness={0.72} /></mesh>
    <mesh position={[0, 0.083, -0.067]}><boxGeometry args={[0.18, 0.14, 0.016]} /><meshStandardMaterial color="#e9e6dd" roughness={0.72} /></mesh>
    <mesh position={[0, 0.083, 0.067]}><boxGeometry args={[0.18, 0.14, 0.016]} /><meshStandardMaterial color="#e9e6dd" roughness={0.72} /></mesh>
    <mesh position={[0, 0.073, 0.078]}><planeGeometry args={[0.145, 0.105]} /><meshBasicMaterial map={label} side={THREE.DoubleSide} /></mesh>
    <mesh position={[0, 0.034, 0]}><boxGeometry args={[0.145, 0.005, 0.115]} /><meshStandardMaterial color="#465c4d" roughness={0.9} /></mesh>
    {Array.from({ length: 24 }, (_, i) => <mesh key={i} position={[Math.sin(i * 2.4) * 0.052, 0.068 + (i % 4) * 0.014, Math.cos(i * 2.4) * 0.041]}><dodecahedronGeometry args={[0.012, 0]} /><meshStandardMaterial color={i % 3 === 0 ? "#e0e6da" : "#f2f1e8"} roughness={0.84} /></mesh>)}
    {!spoonOut && <group position={[-0.005, 0.113, 0]} rotation={[0, -0.35, 0]}><LabSpoon loaded /></group>}
  </group>;
}

function smooth(a: number, b: number, v: number) {
  const t = THREE.MathUtils.clamp((v - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
}

function KohSpoon({ assembly, compact }: { assembly: number; compact: boolean }) {
  const step = assembly >= 5 && assembly < 6 ? 5 : assembly >= 1 && assembly < 2 ? 1 : 0;
  if (!step) return null;
  const phase = assembly - step;
  const targetX = compact ? -0.28 - 0.33 : step === 1 ? A_X - 0.33 : B_X - 0.33;
  const source = new THREE.Vector3(-1.305, BENCH_Y + 0.113, 0.62);
  const target = new THREE.Vector3(targetX + 0.052, BENCH_Y + 0.44, 0.26);
  const travel = smooth(0.24, 0.62, phase);
  const scoop = smooth(0.03, 0.2, phase) * (1 - smooth(0.2, 0.28, phase));
  const position = source.clone().lerp(target, travel);
  position.y -= scoop * 0.035;
  const tip = 1.15 * smooth(0.61, 0.78, phase);
  const falling = phase > 0.71 && phase < 0.96;
  return <group>
    <group position={position.toArray()} rotation={[0, 0, tip]}><LabSpoon loaded={phase < 0.72} /></group>
    {falling && Array.from({ length: 5 }, (_, i) => <mesh key={i} position={[targetX + Math.sin(i * 2.1) * 0.006, BENCH_Y + 0.405 - (((phase - 0.71) * 5 + i * 0.2) % 1) * 0.11, 0.26]}><dodecahedronGeometry args={[0.004, 0]} /><meshStandardMaterial color="#eff0e7" roughness={0.9} /></mesh>)}
  </group>;
}

function ColoredWaterBeaker({ assembly, tour = false, compact = false, x = 1.38, baseY = BENCH_Y, z = 0.64 }: { assembly: number; tour?: boolean; compact?: boolean; x?: number; baseY?: number; z?: number }) {
  const label = useMemo(() => getReagentLabel("Colored water"), []);
  const liquid = useMemo(() => createBeakerLiquid(0.103, 0.22), []);
  useEffect(() => () => liquid.dispose(), [liquid]);
  const first = !tour && assembly >= 8 && assembly < 9;
  const second = !tour && assembly >= 9 && assembly < 10;
  const pour = first ? assembly - 8 : second ? assembly - 9 : 0;
  const targetX = compact ? -0.28 + 0.48 : first ? A_X + 0.48 : B_X + 0.48;
  const move = smooth(0.02, 0.28, pour) * (1 - smooth(0.82, 1, pour));
  const tilt = -1.06 * smooth(0.27, 0.42, pour) * (1 - smooth(0.82, 1, pour));
  const mouthLocalX = 0.11 * Math.cos(tilt) - 0.22 * Math.sin(tilt);
  const mouthLocalY = 0.11 * Math.sin(tilt) + 0.22 * Math.cos(tilt);
  const overX = targetX - (0.11 * Math.cos(-1.06) - 0.22 * Math.sin(-1.06));
  const bx = THREE.MathUtils.lerp(x, overX, move);
  const by = THREE.MathUtils.lerp(baseY, baseY + 0.37, move);
  const bz = THREE.MathUtils.lerp(z, 0.26, move);
  const tipX = bx + mouthLocalX;
  const tipY = by + mouthLocalY;
  const destinationY = baseY + 0.1;
  const dx = targetX - tipX;
  const dy = destinationY - tipY;
  const flow = pour > 0.42 && pour < 0.82;
  useFrame(() => updateBeakerLiquid(liquid, tour ? 0.92 : 0.92 - 0.22 * smooth(0.38, 0.82, progress(assembly, 9)) - 0.22 * smooth(0.38, 0.82, progress(assembly, 10)), tilt, 0.22));
  return <group>
    <group position={[bx, by, bz]} rotation={[0, 0, tilt]}>
      <BeakerGlassShell radius={0.11} height={0.22} />
      <mesh position={[0, 0.005, 0]}><cylinderGeometry args={[0.105, 0.105, 0.01, 30]} /><meshStandardMaterial color="#c9dcda" transparent opacity={0.48} /></mesh>
      <mesh geometry={liquid}><meshStandardMaterial color={DYE} transparent opacity={0.88} depthWrite={false} side={THREE.DoubleSide} roughness={0.15} /></mesh>
      <mesh position={[0, 0.115, 0]}><cylinderGeometry args={[0.112, 0.112, 0.09, 32, 1, true, -0.62, 1.24]} /><meshStandardMaterial map={label} roughness={0.8} side={THREE.DoubleSide} /></mesh>
    </group>
    {flow && <mesh position={[(tipX + targetX) / 2, (tipY + destinationY) / 2, bz]} rotation={[0, 0, -Math.atan2(dx, dy)]}><cylinderGeometry args={[0.006, 0.008, Math.hypot(dx, dy), 12]} /><meshStandardMaterial color={DYE} transparent opacity={0.92} depthWrite={false} /></mesh>}
  </group>;
}

function WallClock({ hours }: { hours: number }) {
  const face = useMemo(() => {
    const canvas = document.createElement("canvas"); canvas.width = 512; canvas.height = 512;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "#faf8eb"; ctx.beginPath(); ctx.arc(256, 256, 250, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = "#293b2f"; ctx.lineWidth = 8; ctx.beginPath(); ctx.arc(256, 256, 235, 0, Math.PI * 2); ctx.stroke();
    for (let i = 0; i < 12; i++) {
      const a = i * Math.PI / 6;
      ctx.beginPath(); ctx.lineWidth = i % 3 === 0 ? 8 : 5;
      ctx.moveTo(256 + Math.sin(a) * 199, 256 - Math.cos(a) * 199);
      ctx.lineTo(256 + Math.sin(a) * 219, 256 - Math.cos(a) * 219); ctx.stroke();
    }
    ctx.fillStyle = "#293b2f"; ctx.font = "bold 49px Arial"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    for (const [n, px, py] of [[12, 256, 96], [3, 417, 256], [6, 256, 417], [9, 95, 256]]) ctx.fillText(String(n), px, py);
    const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace; return texture;
  }, []);
  return <group position={[0, 3.28, -6.27]}>
    <mesh position={[0, 0, -0.025]}><circleGeometry args={[0.67, 48]} /><meshStandardMaterial color="#a89870" roughness={0.65} /></mesh>
    <mesh position={[0, 0, 0]}><circleGeometry args={[0.62, 48]} /><meshBasicMaterial map={face} /></mesh>
    <group position={[0, 0, 0.02]} rotation={[0, 0, -hours * Math.PI / 6]}><mesh position={[0, 0.16, 0]}><boxGeometry args={[0.035, 0.32, 0.008]} /><meshBasicMaterial color="#263b2f" /></mesh></group>
    <group position={[0, 0, 0.025]} rotation={[0, 0, -hours * Math.PI * 2]}><mesh position={[0, 0.23, 0]}><boxGeometry args={[0.018, 0.46, 0.008]} /><meshBasicMaterial color="#b65c50" /></mesh></group>
    <mesh position={[0, 0, 0.035]}><circleGeometry args={[0.035, 20]} /><meshBasicMaterial color="#b65c50" /></mesh>
  </group>;
}

function FlaskGlass() {
  const profile = useMemo(() => [[0.205, 0], [0.218, 0.015], [0.216, 0.055], [0.198, 0.105], [0.09, 0.47], [0.066, 0.535], [0.066, 0.64]].map(([r, y]) => new THREE.Vector2(r, y)), []);
  return <group>
    <mesh renderOrder={3}><latheGeometry args={[profile, 64]} /><meshPhysicalMaterial color="#e1f0ef" transparent opacity={0.18} depthWrite={false} roughness={0.045} metalness={0.04} clearcoat={1} clearcoatRoughness={0.035} side={THREE.DoubleSide} /></mesh>
    <mesh position={[0, 0.64, 0]} rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[0.066, 0.006, 10, 48]} /><meshStandardMaterial color="#b4ced0" transparent opacity={0.8} roughness={0.07} metalness={0.1} /></mesh>
    <mesh position={[0, 0.018, 0]} rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[0.206, 0.006, 8, 48]} /><meshStandardMaterial color="#c9dada" transparent opacity={0.62} roughness={0.08} /></mesh>
    <mesh position={[0, 0.026, 0.185]} rotation={[0, 0, 0.34]}><boxGeometry args={[0.004, 0.13, 0.002]} /><meshBasicMaterial color="#ffffff" transparent opacity={0.35} depthWrite={false} /></mesh>
  </group>;
}

function Respirometer({ x, living, assembly, hours, compact }: { x: number; living: boolean; assembly: number; hours: number; compact: boolean }) {
  const pickupStep = living ? 1 : 5;
  const kohStep = living ? 2 : 6;
  const suspendStep = living ? 3 : 7;
  const tubeStep = living ? 4 : 8;
  const waterStep = living ? 9 : 10;
  const pickup = progress(assembly, pickupStep);
  const koh = smooth(0.72, 0.96, progress(assembly, kohStep));
  const suspend = progress(assembly, suspendStep);
  const connected = progress(assembly, tubeStep);
  const water = smooth(0.38, 0.82, progress(assembly, waterStep));
  const rise = living ? (hours / 6) * 0.27 : 0;
  const beakerX = 0.48;
  const tubeX = 0.48;
  const bend = useMemo(() => [[0, 0.56, 0], [0, 0.72, 0], [0.015, 0.82, 0], [0.16, 0.86, 0], [0.44, 0.86, 0], [tubeX, 0.76, 0], [tubeX, 0.49, 0], [tubeX, 0.12, 0]] as [number, number, number][], []);

  return <group position={[x, BENCH_Y, 0.26]}>
    {/* A small, sealed conical respirometer flask seated directly on the worktop. */}
    <FlaskGlass />
    <mesh position={[0, 0.022, 0]}><cylinderGeometry args={[0.19, 0.19, 0.023, 30]} /><meshStandardMaterial color="#e7e7df" roughness={1} /></mesh>
    {Array.from({ length: 11 }, (_, index) => <GramSeed key={index} index={index} living={living} />)}

    {/* Real open, round-bottom test tube: on the bench, then suspended by a hook through the stopper. */}
    <group position={[THREE.MathUtils.lerp(THREE.MathUtils.lerp(-0.5, -0.33, pickup), -0.035, suspend), THREE.MathUtils.lerp(0.025, 0.28, suspend), 0]}>
      <KohTestTube filled={koh} />
    </group>
    {suspend > 0 && <group scale={[1, suspend, 1]}>
      <mesh position={[-0.035, 0.535, 0]}><cylinderGeometry args={[0.0025, 0.0025, 0.18, 8]} /><meshStandardMaterial color="#b7ac9b" metalness={0.55} roughness={0.38} /></mesh>
      <mesh position={[-0.035, 0.46, 0]} rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[0.036, 0.003, 8, 24]} /><meshStandardMaterial color="#a9a396" metalness={0.55} roughness={0.35} /></mesh>
    </group>}
    {suspend > 0 && <mesh position={[0, 0.655, 0]} scale={[1, suspend, 1]}><cylinderGeometry args={[0.081, 0.064, 0.12, 24]} /><meshStandardMaterial color="#554232" roughness={0.91} /></mesh>}
    {connected > 0 && <group scale={Math.max(0.001, connected)}>
      <GlassBend points={bend} />
      {/* One unbroken glass curve passes exactly through the stopper centre and into water. */}
      {water > 0 && <mesh position={[tubeX, 0.105 + rise / 2, 0]} renderOrder={3}><cylinderGeometry args={[0.009, 0.009, Math.max(0.001, rise + 0.04), 20]} /><meshStandardMaterial color={DYE} transparent opacity={0.88} depthWrite={false} roughness={0.1} /></mesh>}
    </group>}

    <group position={[beakerX, 0, 0]}>
      <Beaker p={[0, 0, 0]} r={0.13} h={0.22} />
      {water > 0 && <>
        <mesh position={[0, 0.055 * water, 0]}><cylinderGeometry args={[0.122, 0.122, Math.max(0.001, 0.11 * water), 32]} /><meshStandardMaterial color={DYE} transparent opacity={0.82} depthWrite={false} roughness={0.1} /></mesh>
        <mesh position={[0, 0.11 * water, 0]} rotation={[-Math.PI / 2, 0, 0]}><circleGeometry args={[0.122, 32]} /><meshStandardMaterial color={DYE} transparent opacity={0.48} depthWrite={false} roughness={0.08} side={THREE.DoubleSide} /></mesh>
      </>}
    </group>
    {!compact && <group position={[0.18, 0.082, 0.39]}><Plaque text={living ? "Living gram seeds" : "Boiled gram seeds"} /></group>}
  </group>;
}

const TOUR_X = [-1.46, -1.04, -0.62, -0.2, 0.22, 0.64, 1.06, 1.48];
function TourObjects({ focus }: { focus: ApparatusId | null }) {
  const names = ["Living gram seeds", "Empty test tube", "KOH pellets", "Bent glass tube", "Receiving beaker A", "Boiled gram seeds", "Receiving beaker B", "Colored water"];
  const ids: ApparatusId[] = ["flask_a", "empty_tube", "koh_box", "delivery_tube", "beaker_a", "flask_b", "beaker_b", "colored_water"];
  const bend = useMemo(() => [[-0.16, 0, 0], [-0.16, 0.21, 0], [-0.12, 0.28, 0], [0.1, 0.28, 0], [0.16, 0.21, 0], [0.16, 0.01, 0]] as [number, number, number][], []);
  return <group position={[0, BENCH_Y, 0.28]}>
    {[0, 5].map((i) => <group key={i} position={[TOUR_X[i], 0, 0]}>
      <group scale={0.65}>
        <FlaskGlass />
        <mesh position={[0, 0.022, 0]}><cylinderGeometry args={[0.19, 0.19, 0.02, 32]} /><meshStandardMaterial color="#f4f2e8" roughness={0.93} /></mesh>
        {Array.from({ length: 8 }, (_, j) => <GramSeed key={j} index={j} living={i === 0} />)}
      </group>
      <group position={[0, 0.082, 0.29]}><Plaque text={i === 0 ? "Living gram seeds" : "Boiled gram seeds"} /></group>
    </group>)}
    <group position={[TOUR_X[1], 0, 0]}><KohTestTube filled={0} /></group>
    <KohBox x={TOUR_X[2]} y={0} z={0} />
    <group position={[TOUR_X[3], 0.025, 0]}><GlassBend points={bend} /></group>
    <group position={[TOUR_X[4], 0, 0]}><Beaker p={[0, 0, 0]} r={0.13} h={0.22} /></group>
    <group position={[TOUR_X[6], 0, 0]}><Beaker p={[0, 0, 0]} r={0.13} h={0.22} /></group>
    <ColoredWaterBeaker assembly={0} tour x={TOUR_X[7]} baseY={0} z={0} />
    {focus && <ApparatusTourTag at={[TOUR_X[ids.indexOf(focus)], 0.42, 0]} name={names[ids.indexOf(focus)]} number={ids.indexOf(focus) + 1} />}
  </group>;
}

function CameraDirector({ intro, introIdx, compact }: { intro: boolean; introIdx: number; compact: boolean }) {
  const { camera } = useThree();
  const destination = useRef(new THREE.Vector3());
  const look = useRef(new THREE.Vector3(0, 1.47, 0.4));
  const aim = useRef(new THREE.Vector3());
  useFrame(() => {
    const targetX = TOUR_X[Math.max(0, introIdx - 1)] ?? 0;
    if (intro && introIdx > 0) {
      destination.current.set(targetX, 1.62, compact ? 1.58 : 0.83);
      aim.current.set(targetX, 1.45, 0.28);
    } else if (intro) {
      destination.current.set(0.55, 2.15, compact ? 2.35 : 2.7);
      aim.current.set(0.45, 1.12, 0.5);
    } else {
      // Identical working camera and pitch to the Chemistry X NaOH practical.
      destination.current.set(compact ? 0.12 : 0, 1.55, compact ? 1.65 : 1.4);
      aim.current.set(compact ? 0.1 : 0, 1.47, 0.4);
    }
    camera.position.lerp(destination.current, intro && introIdx === 0 ? 0.05 : 0.08);
    look.current.lerp(aim.current, 0.08);
    camera.lookAt(look.current);
  });
  return null;
}

export default function RespirationScene({ hours, assembly, compact, activeFlask, intro, introIdx, focus }: { hours: number; assembly: number; compact: boolean; activeFlask: "A" | "B"; intro: boolean; introIdx: number; focus: ApparatusId | null }) {
  return <Canvas key={compact ? "mobile" : "desktop"} shadows camera={{ position: compact ? [0.12, 1.55, 1.65] : [0, 1.55, 1.4], fov: compact ? 72 : 70, near: 0.05, far: 60 }} dpr={[1, 1.5]} gl={{ antialias: true, powerPreference: "high-performance", precision: "highp", toneMappingExposure: 1.0 }} style={{ touchAction: "none" }}>
    <color attach="background" args={["#e3e7e4"]} />
    <ambientLight intensity={0.65} />
    <hemisphereLight args={["#ffffff", "#c9ccce", 0.45]} />
    <spotLight position={[0, 4.6, 2.5]} angle={0.9} penumbra={0.9} intensity={1.1} decay={0} castShadow shadow-mapSize={[512, 512]} />
    <pointLight position={[-2.6, 4.5, 0.5]} intensity={0.35} decay={0} />
    <pointLight position={[2.6, 4.5, 0.5]} intensity={0.35} decay={0} />
    <LabRoom chem>
      <WallClock hours={hours} />
      {intro ? <TourObjects focus={focus} /> : compact ? <Respirometer x={-0.28} living={activeFlask === "A"} assembly={assembly} hours={hours} compact /> : <>
        <Respirometer x={A_X} living assembly={assembly} hours={hours} compact={false} />
        <Respirometer x={B_X} living={false} assembly={assembly} hours={hours} compact={false} />
      </>}
      {!intro && <>
        <KohBox x={-1.3} spoonOut={(assembly > 1 && assembly < 2) || (assembly > 5 && assembly < 6)} />
        <KohSpoon assembly={assembly} compact={compact} />
        <ColoredWaterBeaker assembly={assembly} compact={compact} x={compact ? 0.55 : 1.38} />
      </>}
    </LabRoom>
    <ChemLab stoveOn={false} holding={false} waterOn={false} simplified showSink={false} />
    <CameraDirector intro={intro} introIdx={introIdx} compact={compact} />
  </Canvas>;
}
