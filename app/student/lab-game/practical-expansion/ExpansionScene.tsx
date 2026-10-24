"use client";

import { useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { LabRoom } from "../_scene/LabRoom";
import { ChemLab } from "../walk/ChemLab";
import { ApparatusTourTag } from "../_practical/ApparatusTourTag";
import { DigitalProbe } from "../_practical/physics/DigitalProbe";

const BENCH_Y = 1.08;
const BENCH_Z = 0.14;
const JACKET_Y = BENCH_Y + 0.12;
const DIAL_X = -0.57;
const BOILER_X = -0.85;
const RECEIVER_X = 0.82;

export const TOUR_FOCUS: { target: [number, number, number]; label: [number, number, number]; name: string }[] = [
  { target: [0, JACKET_Y, BENCH_Z], label: [0, JACKET_Y + 0.16, BENCH_Z], name: "Pullinger's steam jacket" },
  { target: [-0.36, JACKET_Y, BENCH_Z], label: [-0.34, JACKET_Y + 0.1, BENCH_Z], name: "Steel expansion rod" },
  { target: [BOILER_X, BENCH_Y + 0.33, BENCH_Z], label: [BOILER_X, BENCH_Y + 0.65, BENCH_Z], name: "Copper steam boiler and hot plate" },
  { target: [-0.23, JACKET_Y - 0.02, BENCH_Z + 0.1], label: [-0.24, JACKET_Y + 0.13, BENCH_Z + 0.1], name: "Steam inlet and outlet" },
  { target: [0.05, JACKET_Y + 0.3, BENCH_Z], label: [0.05, JACKET_Y + 0.57, BENCH_Z], name: "Thermometer probe" },
  { target: [DIAL_X, JACKET_Y, BENCH_Z + 0.12], label: [DIAL_X, JACKET_Y + 0.16, BENCH_Z + 0.12], name: "Dial gauge" },
  { target: [0, BENCH_Y + 0.02, BENCH_Z + 0.32], label: [0, BENCH_Y + 0.09, BENCH_Z + 0.32], name: "Metre scale" },
  { target: [RECEIVER_X, BENCH_Y + 0.08, BENCH_Z + 0.2], label: [RECEIVER_X, BENCH_Y + 0.2, BENCH_Z + 0.2], name: "Condensate receiver" },
];

const INLET_HOSE: [number, number, number][] = [
  [BOILER_X + 0.136, BENCH_Y + 0.53, BENCH_Z],
  [BOILER_X + 0.19, BENCH_Y + 0.56, BENCH_Z + 0.012],
  [-0.48, JACKET_Y + 0.12, BENCH_Z + 0.24],
  [-0.27, JACKET_Y + 0.015, BENCH_Z + 0.24],
  [-0.23, JACKET_Y - 0.02, BENCH_Z + 0.15],
  [-0.23, JACKET_Y - 0.02, BENCH_Z + 0.119],
];
const OUTLET_HOSE: [number, number, number][] = [
  [0.24, JACKET_Y - 0.02, BENCH_Z + 0.119],
  [0.24, JACKET_Y - 0.02, BENCH_Z + 0.17],
  [0.36, JACKET_Y + 0.07, BENCH_Z + 0.26],
  [0.62, BENCH_Y + 0.27, BENCH_Z + 0.26],
  [RECEIVER_X - 0.025, BENCH_Y + 0.21, BENCH_Z + 0.2],
  [RECEIVER_X, BENCH_Y + 0.13, BENCH_Z + 0.2],
];

function Hose({ points }: { points: [number, number, number][] }) {
  const curve = useMemo(() => new THREE.CatmullRomCurve3(points.map((p) => new THREE.Vector3(...p))), [points]);
  return <mesh castShadow><tubeGeometry args={[curve, 72, 0.014, 14, false]} /><meshStandardMaterial color="#ce7a37" roughness={0.83} /></mesh>;
}

function makeDialTexture(): THREE.CanvasTexture {
  const size = 512;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const g = canvas.getContext("2d")!;
  const c = size / 2;
  g.fillStyle = "#fbfaf4";
  g.beginPath(); g.arc(c, c, c - 6, 0, Math.PI * 2); g.fill();
  g.strokeStyle = "#2a3034"; g.fillStyle = "#2a3034";
  g.textAlign = "center"; g.textBaseline = "middle";
  for (let i = 0; i < 100; i++) {
    const a = i / 100 * Math.PI * 2 - Math.PI / 2;
    const major = i % 10 === 0;
    const medium = i % 5 === 0;
    const outer = 231;
    const inner = outer - (major ? 37 : medium ? 26 : 16);
    g.lineWidth = major ? 4 : 2;
    g.beginPath(); g.moveTo(c + Math.cos(a) * outer, c + Math.sin(a) * outer);
    g.lineTo(c + Math.cos(a) * inner, c + Math.sin(a) * inner); g.stroke();
    if (major) { g.font = "bold 32px sans-serif"; g.fillText(String(i), c + Math.cos(a) * 163, c + Math.sin(a) * 163); }
  }
  g.font = "bold 20px sans-serif"; g.fillText("0.001 mm / div", c, c + 80);
  g.font = "16px sans-serif"; g.fillText("0.1 mm / revolution", c, c + 105);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  return texture;
}

function makeRulerTexture(): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 1024; canvas.height = 80;
  const g = canvas.getContext("2d")!;
  g.fillStyle = "#d9be8a"; g.fillRect(0, 0, 1024, 80);
  g.strokeStyle = "#352e25"; g.fillStyle = "#352e25";
  for (let i = 0; i <= 60; i++) {
    const x = 62 + i * 15;
    g.lineWidth = i % 10 === 0 ? 3 : 1.5;
    g.beginPath(); g.moveTo(x, 6); g.lineTo(x, i % 10 === 0 ? 43 : i % 5 === 0 ? 33 : 25); g.stroke();
    if (i % 10 === 0) { g.font = "bold 21px sans-serif"; g.fillText(String(i), x - 10, 68); }
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  return texture;
}

function makeMeasureMarker(label: string): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 256; canvas.height = 96;
  const g = canvas.getContext("2d")!;
  g.fillStyle = "#fff6cd"; g.fillRect(0, 0, 256, 96);
  g.strokeStyle = "#b36b13"; g.lineWidth = 8; g.strokeRect(4, 4, 248, 88);
  g.fillStyle = "#4e3219"; g.font = "bold 54px Arial"; g.textAlign = "center"; g.textBaseline = "middle";
  g.fillText(label, 128, 51);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function makeEquipmentLabel(title: string, subtitle: string): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 512; canvas.height = 128;
  const g = canvas.getContext("2d")!;
  g.fillStyle = "#f5f1e8"; g.fillRect(0, 0, 512, 128);
  g.strokeStyle = "#7b7770"; g.lineWidth = 5; g.strokeRect(4, 4, 504, 120);
  g.fillStyle = "#733e3c"; g.textAlign = "center";
  g.font = "bold 48px sans-serif"; g.fillText(title, 256, 63);
  g.fillStyle = "#53565a"; g.font = "bold 25px sans-serif"; g.fillText(subtitle, 256, 100);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  return texture;
}

function makeHotPlatePanel(): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 768; canvas.height = 312;
  const g = canvas.getContext("2d")!;
  const metal = g.createLinearGradient(0, 0, 0, 312);
  metal.addColorStop(0, "#f0f1ee"); metal.addColorStop(0.5, "#d8dbd8"); metal.addColorStop(1, "#bec2bf");
  g.fillStyle = metal; g.fillRect(0, 0, 768, 312);
  g.strokeStyle = "#282d2d"; g.lineWidth = 8; g.strokeRect(7, 7, 754, 298);
  g.fillStyle = "#9b2824"; g.textAlign = "center"; g.font = "bold 48px sans-serif"; g.fillText("HOT PLATE", 567, 64);
  g.fillStyle = "#353b3b"; g.font = "bold 22px sans-serif";
  for (const [x, name, radius] of [[190, "HEAT", 77], [590, "POWER", 86]] as const) {
    for (let i = -5; i <= 5; i++) {
      const a = (i / 6) * Math.PI * 0.8 - Math.PI / 2;
      const x1 = x + Math.cos(a) * radius, y1 = 170 + Math.sin(a) * radius;
      const x2 = x + Math.cos(a) * (radius + 12), y2 = 170 + Math.sin(a) * (radius + 12);
      g.lineWidth = i === -5 || i === 5 ? 5 : 3;
      g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.stroke();
    }
    g.fillText(name, x, 292);
  }
  g.font = "bold 18px sans-serif"; g.fillText("MAINS", 391, 112); g.fillText("LOAD", 391, 292);
  g.fillStyle = "#d3b23a"; g.beginPath(); g.moveTo(35, 258); g.lineTo(53, 225); g.lineTo(71, 258); g.closePath(); g.fill();
  g.fillStyle = "#272b2b"; g.font = "bold 23px sans-serif"; g.fillText("!", 53, 252);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  return texture;
}

function makeHotPlateHousing(): THREE.BufferGeometry {
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute([
    -0.17, 0, 0.175, 0.17, 0, 0.175,
    -0.17, 0.145, 0.125, 0.17, 0.145, 0.125,
    -0.17, 0, -0.15, 0.17, 0, -0.15,
    -0.17, 0.145, -0.15, 0.17, 0.145, -0.15,
  ], 3));
  geometry.setIndex([
    0, 1, 3, 0, 3, 2,
    2, 3, 7, 2, 7, 6,
    4, 6, 7, 4, 7, 5,
    0, 4, 5, 0, 5, 1,
    0, 2, 6, 0, 6, 4,
    1, 5, 7, 1, 7, 3,
  ]);
  const flatFaces = geometry.toNonIndexed();
  flatFaces.computeVertexNormals();
  geometry.dispose();
  return flatFaces;
}

function makeCopperTexture(): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 512; canvas.height = 256;
  const g = canvas.getContext("2d")!;
  g.fillStyle = "#c88b59"; g.fillRect(0, 0, 512, 256);
  for (let x = 0; x < 512; x++) {
    const sheen = Math.cos((x / 512) * Math.PI * 2);
    const grain = Math.sin(x * 0.73) * Math.sin(x * 0.19);
    g.fillStyle = sheen > 0
      ? `rgba(255,225,177,${0.025 + sheen * 0.11 + Math.max(0, grain) * 0.024})`
      : `rgba(80,42,24,${0.02 - sheen * 0.055 + Math.max(0, -grain) * 0.02})`;
    g.fillRect(x, 0, 1, 256);
  }
  for (let i = 0; i < 90; i++) {
    const x = (i * 73) % 512;
    g.fillStyle = i % 3 === 0 ? "rgba(255,232,198,0.045)" : "rgba(76,41,26,0.035)";
    g.fillRect(x, (i * 29) % 190, i % 4 === 0 ? 2 : 1, 20 + (i * 11) % 64);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.anisotropy = 8;
  return texture;
}

function makeSteamTexture(): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 128; canvas.height = 256;
  const g = canvas.getContext("2d")!;
  for (const [x, y, radius, strength] of [[62, 207, 29, 0.5], [77, 162, 39, 0.43], [49, 115, 35, 0.35], [73, 60, 38, 0.23]] as const) {
    const haze = g.createRadialGradient(x, y, 2, x, y, radius);
    haze.addColorStop(0, `rgba(250,253,253,${strength})`);
    haze.addColorStop(0.5, `rgba(248,252,252,${strength * 0.5})`);
    haze.addColorStop(1, "rgba(248,252,252,0)");
    g.fillStyle = haze;
    g.fillRect(x - radius, y - radius, radius * 2, radius * 2);
  }
  return new THREE.CanvasTexture(canvas);
}

function Steam({ show, pos }: { show: boolean; pos: [number, number, number] }) {
  const group = useRef<THREE.Group>(null);
  const texture = useMemo(makeSteamTexture, []);
  useEffect(() => () => texture.dispose(), [texture]);
  const particles = useMemo(() => Array.from({ length: 9 }, (_, i) => ({ x: (i - 4) * 0.006, phase: i / 9 })), []);
  useFrame((state) => {
    if (!group.current) return;
    group.current.children.forEach((child, i) => {
      const t = (state.clock.elapsedTime * 0.22 + particles[i].phase) % 1;
      child.position.set(pos[0] + particles[i].x + Math.sin(t * 6 + i) * 0.012, pos[1] + 0.055 + t * 0.24, pos[2] + 0.025);
      child.scale.set(0.055 + t * 0.045, 0.12 + t * 0.1, 1);
      ((child as THREE.Sprite).material as THREE.SpriteMaterial).opacity = show ? Math.pow(1 - t, 1.3) * 0.48 : 0;
    });
  });
  return <group ref={group}>{particles.map((_, i) => <sprite key={i}><spriteMaterial map={texture} transparent opacity={0} depthWrite={false} depthTest={false} /></sprite>)}</group>;
}

function Boiler({ heating }: { heating: boolean }) {
  const panel = useMemo(makeHotPlatePanel, []);
  const housing = useMemo(makeHotPlateHousing, []);
  const copper = useMemo(makeCopperTexture, []);
  useEffect(() => () => { panel.dispose(); housing.dispose(); copper.dispose(); }, [panel, housing, copper]);
  const profile = useMemo(() => [
    new THREE.Vector2(0, 0.22), new THREE.Vector2(0.102, 0.22),
    new THREE.Vector2(0.112, 0.235), new THREE.Vector2(0.112, 0.39),
    new THREE.Vector2(0.031, 0.52), new THREE.Vector2(0.029, 0.58),
  ], []);
  return <group position={[BOILER_X, BENCH_Y, BENCH_Z]}>
    {/* Hot plate used as the steam source in the supplied laboratory reference. */}
    <mesh geometry={housing} castShadow><meshStandardMaterial color="#e5e3de" metalness={0.14} roughness={0.56} side={THREE.DoubleSide} /></mesh>
    {[-0.125, 0.125].map((x) => <mesh key={x} position={[x, 0.006, 0.04]}><boxGeometry args={[0.028, 0.012, 0.05]} /><meshStandardMaterial color="#222426" roughness={0.8} /></mesh>)}
    <mesh position={[0, 0.164, 0]} castShadow><cylinderGeometry args={[0.075, 0.075, 0.024, 40]} /><meshStandardMaterial color="#303334" metalness={0.38} roughness={0.55} /></mesh>
    {[-0.075, 0, 0.075].map((x) => <mesh key={x} position={[x, 0.188, 0]}><cylinderGeometry args={[0.011, 0.011, 0.04, 16]} /><meshStandardMaterial color="#8e9698" metalness={0.72} roughness={0.27} /></mesh>)}
    <mesh position={[0, 0.21, 0]} castShadow><cylinderGeometry args={[0.128, 0.128, 0.017, 48]} /><meshStandardMaterial color={heating ? "#47403e" : "#3b3d3d"} metalness={0.4} roughness={0.49} /></mesh>
    <mesh position={[0, 0.219, 0]}><cylinderGeometry args={[0.122, 0.122, 0.002, 48]} /><meshStandardMaterial color="#575a5a" metalness={0.56} roughness={0.42} /></mesh>
    <mesh position={[0, 0.077, 0.152]} rotation={[-0.333, 0, 0]}><planeGeometry args={[0.304, 0.12]} /><meshBasicMaterial map={panel} /></mesh>
    {[-0.074, 0.078].map((x, i) => <group key={x} position={[x, 0.072, 0.157]} rotation={[Math.PI / 2 - 0.333, 0, 0]}>
      <mesh position={[0, -0.004, 0]}><cylinderGeometry args={[i === 0 ? 0.028 : 0.035, i === 0 ? 0.028 : 0.035, 0.005, 32]} /><meshStandardMaterial color="#8f9492" metalness={0.66} roughness={0.29} /></mesh>
      <mesh><cylinderGeometry args={[i === 0 ? 0.024 : 0.031, i === 0 ? 0.024 : 0.031, 0.015, 32]} /><meshStandardMaterial color="#222628" roughness={0.42} /></mesh>
      {Array.from({ length: 20 }, (_, n) => {
        const a = n / 20 * Math.PI * 2;
        const radius = i === 0 ? 0.0235 : 0.0305;
        return <mesh key={n} position={[Math.cos(a) * radius, 0, Math.sin(a) * radius]}><cylinderGeometry args={[0.0013, 0.0013, 0.013, 6]} /><meshStandardMaterial color="#111719" roughness={0.78} /></mesh>;
      })}
      <mesh position={[0, 0.0085, 0]}><cylinderGeometry args={[i === 0 ? 0.021 : 0.028, i === 0 ? 0.021 : 0.028, 0.002, 32]} /><meshStandardMaterial color="#191d1f" roughness={0.36} /></mesh>
      <mesh position={[0, 0.009, 0]}><boxGeometry args={[0.003, 0.003, i === 0 ? 0.027 : 0.034]} /><meshBasicMaterial color="#f0eee8" /></mesh>
    </group>)}
    {[[0.096, 0.15, "#38a56d", "#267c4c"], [0.033, 0.17, "#df4234", "#bd2c1f"]].map(([y, z, color, glow], i) => <group key={i} position={[0.005, Number(y), Number(z)]} rotation={[Math.PI / 2 - 0.333, 0, 0]}>
      <mesh><cylinderGeometry args={[0.0105, 0.0105, 0.004, 24]} /><meshStandardMaterial color="#8a9292" metalness={0.7} roughness={0.28} /></mesh>
      <mesh position={[0, 0.004, 0]} scale={[1, 0.45, 1]}><sphereGeometry args={[0.008, 24, 12]} /><meshPhysicalMaterial color={heating ? String(color) : i === 0 ? "#3d7257" : "#aa4940"} emissive={heating ? String(glow) : "#000000"} emissiveIntensity={heating ? 0.45 : 0} roughness={0.16} clearcoat={0.8} /></mesh>
    </group>)}
    {/* Opaque spun copper vessel, with a closed neck and a brazed steam outlet. */}
    <mesh castShadow><latheGeometry args={[profile, 48]} /><meshPhysicalMaterial map={copper} color="#ffffff" metalness={0.42} roughness={0.28} clearcoat={0.28} clearcoatRoughness={0.25} /></mesh>
    {[0.25, 0.37].map((y) => <mesh key={y} position={[0, y, 0]} rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[0.113, 0.002, 6, 48]} /><meshStandardMaterial color="#784729" metalness={0.72} roughness={0.35} /></mesh>)}
    <mesh position={[0, 0.583, 0]}><cylinderGeometry args={[0.034, 0.032, 0.035, 24]} /><meshStandardMaterial color="#7e4b33" metalness={0.45} roughness={0.6} /></mesh>
    <group position={[0.067, 0.49, 0]} rotation={[0, 0, -Math.PI / 3]}>
      <mesh position={[0, -0.025, 0]}><cylinderGeometry args={[0.019, 0.03, 0.042, 32]} /><meshStandardMaterial color="#c48a59" metalness={0.43} roughness={0.29} /></mesh>
      <mesh><cylinderGeometry args={[0.018, 0.018, 0.115, 24]} /><meshStandardMaterial color="#c48a59" metalness={0.43} roughness={0.27} /></mesh>
      <mesh position={[0, 0.027, 0]}><cylinderGeometry args={[0.023, 0.023, 0.009, 24]} /><meshStandardMaterial color="#a86c43" metalness={0.46} roughness={0.34} /></mesh>
      <mesh position={[0, 0.055, 0]}><cylinderGeometry args={[0.019, 0.019, 0.05, 24]} /><meshStandardMaterial color="#c46b2c" roughness={0.8} /></mesh>
      {[0.064, 0.078].map((y) => <mesh key={y} position={[0, y, 0]}><cylinderGeometry args={[0.0204, 0.0204, 0.003, 24]} /><meshStandardMaterial color="#b7bcc0" metalness={0.8} roughness={0.24} /></mesh>)}
    </group>
  </group>;
}

function Thermometer({ temp }: { temp: number }) {
  return <group position={[0.05, JACKET_Y, BENCH_Z]}>
    {/* The welded well holds a rubber bung around the shared digital probe. */}
    <mesh position={[0, 0.056, 0]}><cylinderGeometry args={[0.029, 0.029, 0.052, 24]} /><meshStandardMaterial color="#b7bec0" metalness={0.82} roughness={0.2} /></mesh>
    <mesh position={[0, 0.05, 0]} rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[0.035, 0.003, 8, 32]} /><meshStandardMaterial color="#8b969a" metalness={0.77} roughness={0.26} /></mesh>
    <mesh position={[0, 0.083, 0]}><cylinderGeometry args={[0.025, 0.027, 0.039, 24]} /><meshStandardMaterial color="#854c3d" roughness={0.87} /></mesh>
    <DigitalProbe temp={temp} />
  </group>;
}

function Apparatus({ temp, extensionMm, steamOn, rulerAligned }: { temp: number; extensionMm: number; steamOn: boolean; rulerAligned: boolean }) {
  const dialTex = useMemo(makeDialTexture, []);
  const rulerTex = useMemo(makeRulerTexture, []);
  const zeroMarker = useMemo(() => makeMeasureMarker("0 cm"), []);
  const sixtyMarker = useMemo(() => makeMeasureMarker("60 cm"), []);
  const baseLabel = useMemo(() => makeEquipmentLabel("EXPANSION", "STEEL ROD · 600 MM"), []);
  const needle = useRef<THREE.Group>(null);
  const counterNeedle = useRef<THREE.Group>(null);
  const ruler = useRef<THREE.Group>(null);
  useFrame((_, delta) => {
    if (ruler.current) {
      ruler.current.position.y = THREE.MathUtils.damp(ruler.current.position.y, rulerAligned ? BENCH_Y + 0.05 : BENCH_Y + 0.007, 5, delta);
      ruler.current.position.z = THREE.MathUtils.damp(ruler.current.position.z, rulerAligned ? BENCH_Z + 0.08 : BENCH_Z + 0.32, 5, delta);
    }
    if (needle.current) {
      const difference = -extensionMm * Math.PI * 20 - needle.current.rotation.z;
      needle.current.rotation.z += THREE.MathUtils.clamp(difference, -1.6 * delta, 1.6 * delta);
    }
    if (counterNeedle.current) {
      const difference = -extensionMm * Math.PI * 2 - counterNeedle.current.rotation.z;
      counterNeedle.current.rotation.z += THREE.MathUtils.clamp(difference, -0.32 * delta, 0.32 * delta);
    }
  });
  const steel = <meshStandardMaterial color="#dce4e7" metalness={0.55} roughness={0.17} />;
  const blue = <meshStandardMaterial color="#164376" metalness={0.28} roughness={0.52} />;
  const dark = <meshStandardMaterial color="#303438" metalness={0.3} roughness={0.65} />;
  return <group>
    {/* Heavy enamelled base and two bolted instrument supports. */}
    <mesh position={[0, BENCH_Y + 0.018, BENCH_Z]} castShadow receiveShadow><boxGeometry args={[1.17, 0.036, 0.34]} />{blue}</mesh>
    <mesh position={[0.08, BENCH_Y + 0.019, BENCH_Z + 0.171]}><planeGeometry args={[0.18, 0.044]} /><meshBasicMaterial map={baseLabel} /></mesh>
    {[-0.44, 0.45].map((x) => <group key={x}>
      <mesh position={[x, BENCH_Y + 0.076, BENCH_Z]} castShadow><boxGeometry args={[0.018, 0.12, 0.19]} />{blue}</mesh>
      <mesh position={[x, BENCH_Y + 0.034, BENCH_Z + 0.105]}><cylinderGeometry args={[0.009, 0.009, 0.008, 12]} />{steel}</mesh>
    </group>)}
    <mesh position={[0, JACKET_Y, BENCH_Z]} rotation={[0, 0, Math.PI / 2]} castShadow><cylinderGeometry args={[0.048, 0.048, 0.78, 48]} />{steel}</mesh>
    {/* Polished jacket seam, red end seals and the exposed ends of the steel rod. */}
    <mesh position={[0, JACKET_Y - 0.032, BENCH_Z + 0.037]}><boxGeometry args={[0.72, 0.002, 0.002]} /><meshStandardMaterial color="#7c898f" metalness={0.9} roughness={0.16} /></mesh>
    {[-0.392, 0.392].map((x) => <mesh key={x} position={[x, JACKET_Y, BENCH_Z]} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.051, 0.051, 0.023, 40]} /><meshStandardMaterial color="#9d4b50" roughness={0.7} /></mesh>)}
    <mesh position={[-0.413 - extensionMm * 0.02, JACKET_Y, BENCH_Z]} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.009, 0.009, 0.058, 20]} />{steel}</mesh>
    <mesh position={[0.416, JACKET_Y, BENCH_Z]} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.009, 0.009, 0.056, 20]} />{steel}</mesh>
    {/* End screw braces the right end; the left end remains free against the gauge. */}
    <mesh position={[0.53, JACKET_Y, BENCH_Z]} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.009, 0.009, 0.25, 16]} />{steel}</mesh>
    {Array.from({ length: 10 }, (_, i) => <mesh key={i} position={[0.465 + i * 0.012, JACKET_Y, BENCH_Z]} rotation={[0, 0, Math.PI / 2]}><torusGeometry args={[0.011, 0.0014, 5, 12]} /><meshStandardMaterial color="#78848a" metalness={0.78} roughness={0.25} /></mesh>)}
    <mesh position={[0.62, JACKET_Y, BENCH_Z]} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.017, 0.017, 0.05, 20]} />{steel}</mesh>
    <mesh position={[0.665, JACKET_Y, BENCH_Z]} rotation={[0, 0, Math.PI / 2]} castShadow><cylinderGeometry args={[0.05, 0.05, 0.065, 14]} />{dark}</mesh>
    {/* Welded bosses, metal nipples, rubber sleeves and clamp bands hold each hose. */}
    {[-0.23, 0.24].map((x) => <group key={x} position={[x, JACKET_Y - 0.02, BENCH_Z + 0.05]} rotation={[Math.PI / 2, 0, 0]}>
      <mesh><cylinderGeometry args={[0.026, 0.026, 0.015, 24]} />{steel}</mesh>
      <mesh position={[0, 0.039, 0]}><cylinderGeometry args={[0.013, 0.013, 0.075, 24]} />{steel}</mesh>
      <mesh position={[0, 0.072, 0]}><cylinderGeometry args={[0.018, 0.018, 0.055, 24]} /><meshStandardMaterial color="#c57435" roughness={0.82} /></mesh>
      {[0.058, 0.088].map((y) => <mesh key={y} position={[0, y, 0]}><cylinderGeometry args={[0.0194, 0.0194, 0.0035, 24]} /><meshStandardMaterial color="#afb8b9" metalness={0.83} roughness={0.25} /></mesh>)}
    </group>)}
    <Boiler heating={steamOn} />
    <Hose points={INLET_HOSE} />
    <Hose points={OUTLET_HOSE} />
    <Steam show={steamOn} pos={[RECEIVER_X, BENCH_Y + 0.14, BENCH_Z + 0.2]} />
    <mesh position={[RECEIVER_X, BENCH_Y + 0.13, BENCH_Z + 0.2]} rotation={[0, 0, -0.3]}><circleGeometry args={[0.009, 20]} /><meshBasicMaterial color="#4d3727" side={THREE.DoubleSide} /></mesh>
    <Thermometer temp={temp} />
    {/* Clear condensate receiver with an open rim; the hose stops above it. */}
    <group position={[RECEIVER_X, BENCH_Y + 0.075, BENCH_Z + 0.2]}>
      <mesh><cylinderGeometry args={[0.06, 0.052, 0.14, 32, 1, true]} /><meshPhysicalMaterial color="#d3e3e6" transparent opacity={0.25} roughness={0.05} side={THREE.DoubleSide} depthWrite={false} /></mesh>
      <mesh position={[0, 0.071, 0]} rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[0.06, 0.0035, 8, 32]} /><meshStandardMaterial color="#c7d9de" roughness={0.14} /></mesh>
      <mesh position={[0, -0.067, 0]}><cylinderGeometry args={[0.052, 0.052, 0.006, 32]} /><meshPhysicalMaterial color="#a8c6cc" transparent opacity={0.38} /></mesh>
      {steamOn && <mesh position={[0, -0.045, 0]}><cylinderGeometry args={[0.05, 0.05, 0.025, 32]} /><meshPhysicalMaterial color="#9dbec6" transparent opacity={0.4} depthWrite={false} /></mesh>}
    </group>
    <group ref={ruler} position={[0, BENCH_Y + 0.007, BENCH_Z + 0.32]}>
      <mesh><boxGeometry args={[1.01, 0.014, 0.044]} /><meshStandardMaterial color="#c5a46c" roughness={0.78} /></mesh>
      <mesh position={[0, 0.008, 0]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[1.01, 0.044]} /><meshBasicMaterial map={rulerTex} /></mesh>
      {rulerAligned && [-0.445, 0.445].map((x) => <mesh key={x} position={[x, 0.01, 0.01]}><boxGeometry args={[0.004, 0.002, 0.035]} /><meshBasicMaterial color="#b2501e" /></mesh>)}
    </group>
    {rulerAligned && <group>
      <mesh position={[0, JACKET_Y + 0.115, BENCH_Z + 0.09]}><boxGeometry args={[0.89, 0.003, 0.003]} /><meshBasicMaterial color="#e8ad34" /></mesh>
      {[-0.445, 0.445].map((x) => <mesh key={x} position={[x, JACKET_Y + 0.105, BENCH_Z + 0.09]}><boxGeometry args={[0.004, 0.028, 0.004]} /><meshBasicMaterial color="#e8ad34" /></mesh>)}
      <mesh position={[-0.445, JACKET_Y + 0.15, BENCH_Z + 0.09]}><planeGeometry args={[0.085, 0.032]} /><meshBasicMaterial map={zeroMarker} depthTest={false} /></mesh>
      <mesh position={[0.445, JACKET_Y + 0.15, BENCH_Z + 0.09]}><planeGeometry args={[0.1, 0.032]} /><meshBasicMaterial map={sixtyMarker} depthTest={false} /></mesh>
    </group>}
    {/* Gauge body and axial probe are aligned with the free rod end. */}
    <mesh position={[-0.49, JACKET_Y, BENCH_Z]} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.008, 0.008, 0.15, 16]} />{steel}</mesh>
    <group position={[DIAL_X, JACKET_Y, BENCH_Z + 0.06]}>
      <mesh rotation={[Math.PI / 2, 0, 0]} castShadow><cylinderGeometry args={[0.084, 0.084, 0.025, 48]} />{dark}</mesh>
      <mesh position={[0, 0, 0.014]}><circleGeometry args={[0.075, 48]} /><meshBasicMaterial map={dialTex} /></mesh>
      <group ref={needle} position={[0, 0, 0.017]}><mesh position={[0, 0.03, 0]}><boxGeometry args={[0.004, 0.063, 0.002]} /><meshBasicMaterial color="#b43830" /></mesh></group>
      <mesh position={[-0.028, -0.027, 0.018]}><circleGeometry args={[0.016, 24]} /><meshBasicMaterial color="#eee9dc" /></mesh>
      <group ref={counterNeedle} position={[-0.028, -0.027, 0.02]}><mesh position={[0, 0.006, 0]}><boxGeometry args={[0.002, 0.013, 0.002]} /><meshBasicMaterial color="#b43830" /></mesh></group>
      <mesh position={[0, 0, 0.021]}><sphereGeometry args={[0.005, 12, 8]} /><meshBasicMaterial color="#2a2a2a" /></mesh>
    </group>
  </group>;
}

function CameraRig({ zoom, measuringLength, intro, introIdx }: { zoom: boolean; measuringLength: boolean; intro: boolean; introIdx: number }) {
  const { camera, size } = useThree();
  const look = useRef(new THREE.Vector3(0, JACKET_Y, BENCH_Z));
  const position = useMemo(() => new THREE.Vector3(), []);
  const target = useMemo(() => new THREE.Vector3(), []);
  useEffect(() => {
    if (!(camera instanceof THREE.PerspectiveCamera)) return;
    camera.fov = size.width < 550 ? 72 : size.width < 800 ? 55 : 45;
    camera.updateProjectionMatrix();
  }, [camera, size.width]);
  useFrame(() => {
    if (intro && introIdx > 0) {
      const focus = TOUR_FOCUS[Math.min(introIdx - 1, TOUR_FOCUS.length - 1)];
      target.set(...focus.target);
      position.set(focus.target[0] + 0.05, focus.target[1] + 0.25, focus.target[2] + (size.width < 800 ? 1.2 : 0.9));
    } else if (measuringLength && !intro) {
      // Look along the full rule from slightly above: both endpoints and the rod stay in view.
      target.set(0, BENCH_Y + 0.105, BENCH_Z + 0.04);
      position.set(0, BENCH_Y + 0.38, BENCH_Z + (size.width < 700 ? 1.18 : 0.82));
    } else if (zoom && !intro) {
      target.set(DIAL_X, JACKET_Y, BENCH_Z + 0.06);
      position.set(DIAL_X - 0.06, JACKET_Y + 0.12, BENCH_Z + 0.65);
    } else {
      target.set(0, size.width < 550 ? BENCH_Y - 0.03 : JACKET_Y + 0.06, BENCH_Z);
      const fov = size.width < 800 ? 55 : 45;
      const fitDistance = 2.9 / (2 * Math.tan(THREE.MathUtils.degToRad(fov / 2)) * (size.width / size.height));
      position.set(0.1, BENCH_Y + 0.49, size.width < 550 ? 3.55 : Math.max(1.75, fitDistance));
    }
    camera.position.lerp(position, 0.07);
    look.current.lerp(target, 0.07);
    camera.lookAt(look.current);
  });
  return null;
}

export default function ExpansionScene({ temp, extensionMm, steamOn, rulerAligned, measuringLength, zoom, intro, introIdx, compact }: {
  temp: number; extensionMm: number; steamOn: boolean; rulerAligned: boolean; measuringLength: boolean; zoom: boolean; intro: boolean; introIdx: number; compact: boolean;
}) {
  return <Canvas shadows camera={{ position: [0.1, BENCH_Y + 0.49, 1.75], fov: 45 }} dpr={compact ? [1, 1.25] : [1, 2]} gl={{ antialias: !compact, powerPreference: "high-performance" }}>
    <ambientLight intensity={0.7} />
    <directionalLight position={[3, 6, 4]} intensity={1.2} castShadow shadow-mapSize-width={compact ? 512 : 1024} shadow-mapSize-height={compact ? 512 : 1024} />
    <directionalLight position={[-3, 3, -2]} intensity={0.38} />
    <LabRoom walkLabNoticeBoard />
    <ChemLab stoveOn={false} holding={false} waterOn={false} simplified />
    <Apparatus temp={temp} extensionMm={extensionMm} steamOn={steamOn} rulerAligned={rulerAligned} />
    {intro && introIdx > 0 && <ApparatusTourTag at={TOUR_FOCUS[Math.min(introIdx - 1, TOUR_FOCUS.length - 1)].label} name={TOUR_FOCUS[Math.min(introIdx - 1, TOUR_FOCUS.length - 1)].name} number={introIdx} />}
    <CameraRig zoom={zoom} measuringLength={measuringLength} intro={intro} introIdx={introIdx} />
  </Canvas>;
}
