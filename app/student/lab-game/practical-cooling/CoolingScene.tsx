"use client";

import { useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { LabRoom } from "../_scene/LabRoom";
import { ChemLab } from "../walk/ChemLab";
import { DigitalProbe } from "../_practical/physics/DigitalProbe";
import { ApparatusTourTag } from "../_practical/ApparatusTourTag";

const TROOM = 28;
const T0 = 90;
const BENCH_Y = 1.08;
const BENCH_Z = 0.14;
const BEAKER_X = 0.11;
const STAND_X = -0.27;
const BEAKER_R = 0.13;
const BEAKER_H = 0.27;
const WATER_H = 0.205;

export const COOLING_TOUR_FOCUS: { target: [number, number, number]; label: [number, number, number]; name: string }[] = [
  { target: [BEAKER_X, BENCH_Y + 0.14, BENCH_Z], label: [BEAKER_X + 0.1, BENCH_Y + 0.36, BENCH_Z], name: "Graduated beaker of hot water" },
  { target: [BEAKER_X, BENCH_Y + 0.39, BENCH_Z], label: [BEAKER_X + 0.1, BENCH_Y + 0.59, BENCH_Z], name: "Digital thermometer probe" },
  { target: [STAND_X, BENCH_Y + 0.42, BENCH_Z], label: [STAND_X, BENCH_Y + 0.7, BENCH_Z], name: "Retort stand and clamp" },
];
export const COOLING_TOUR_ITEMS = COOLING_TOUR_FOCUS.map((item) => item.name);

function makeVaporTexture(): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 128; canvas.height = 256;
  const g = canvas.getContext("2d")!;
  g.filter = "blur(8px)";
  for (let i = 0; i < 4; i++) {
    const x = 35 + i * 18;
    const grad = g.createLinearGradient(0, 248, 0, 12);
    grad.addColorStop(0, "rgba(255,255,255,0)");
    grad.addColorStop(0.2, "rgba(255,255,255,0.36)");
    grad.addColorStop(0.55, "rgba(255,255,255,0.22)");
    grad.addColorStop(1, "rgba(255,255,255,0)");
    g.strokeStyle = grad;
    g.lineWidth = i % 2 ? 15 : 11;
    g.lineCap = "round";
    g.beginPath();
    g.moveTo(x, 244);
    g.bezierCurveTo(x - 25, 196, x + 22, 164, x + 3, 118);
    g.bezierCurveTo(x - 18, 79, x + 16, 42, x + 4, 8);
    g.stroke();
  }
  return new THREE.CanvasTexture(canvas);
}

function makeBeakerScale(): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 256; canvas.height = 512;
  const g = canvas.getContext("2d")!;
  g.clearRect(0, 0, 256, 512);
  g.strokeStyle = "rgba(40,67,75,.88)";
  g.fillStyle = "rgba(35,61,69,.95)";
  g.lineWidth = 3;
  g.font = "bold 42px Arial";
  g.fillText("mL", 128, 48);
  for (let ml = 25; ml <= 200; ml += 25) {
    const y = 465 - ml * 1.85;
    g.beginPath();
    g.moveTo(ml % 50 === 0 ? 22 : 49, y);
    g.lineTo(105, y);
    g.stroke();
    if (ml % 50 === 0) g.fillText(String(ml), 115, y + 13);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function Vapor({ intensity }: { intensity: number }) {
  const group = useRef<THREE.Group>(null);
  const texture = useMemo(makeVaporTexture, []);
  useEffect(() => () => texture.dispose(), [texture]);
  const puffs = useMemo(() => Array.from({ length: 10 }, (_, i) => ({ phase: i / 10, x: ((i * 7) % 9 - 4) * 0.014 })), []);
  useFrame((state) => {
    group.current?.children.forEach((child, i) => {
      const t = (state.clock.elapsedTime * 0.19 + puffs[i].phase) % 1;
      child.position.set(BEAKER_X + puffs[i].x + Math.sin(t * 6 + i) * 0.012, BENCH_Y + BEAKER_H + 0.035 + t * 0.21, BENCH_Z + 0.035);
      child.scale.set(0.075 + t * 0.065, 0.15 + t * 0.13, 1);
      ((child as THREE.Sprite).material as THREE.SpriteMaterial).opacity = Math.pow(1 - t, 1.5) * 0.65 * intensity;
    });
  });
  return <group ref={group}>{puffs.map((_, i) => <sprite key={i}><spriteMaterial map={texture} color="#ffffff" transparent opacity={0} blending={THREE.AdditiveBlending} depthWrite={false} depthTest={false} /></sprite>)}</group>;
}

function CoolingApparatus({ temp }: { temp: number }) {
  const heat = THREE.MathUtils.clamp((temp - TROOM) / (T0 - TROOM), 0, 1);
  const waterColor = useMemo(() => new THREE.Color("#b9d0cf").lerp(new THREE.Color("#d5ded8"), heat), [heat]);
  const scale = useMemo(makeBeakerScale, []);
  useEffect(() => () => scale.dispose(), [scale]);
  return <group>
    {/* Heavy stand, adjustable arm and rubber-padded jaws support the probe body. */}
    <mesh position={[STAND_X, BENCH_Y + 0.015, BENCH_Z]} castShadow><cylinderGeometry args={[0.14, 0.15, 0.03, 40]} /><meshStandardMaterial color="#262b2f" metalness={0.32} roughness={0.62} /></mesh>
    <mesh position={[STAND_X, BENCH_Y + 0.39, BENCH_Z]} castShadow><cylinderGeometry args={[0.012, 0.012, 0.75, 24]} /><meshStandardMaterial color="#a5adb1" metalness={0.78} roughness={0.25} /></mesh>
    <mesh position={[STAND_X, BENCH_Y + 0.46, BENCH_Z]} castShadow><boxGeometry args={[0.052, 0.052, 0.05]} /><meshStandardMaterial color="#30363b" metalness={0.28} roughness={0.58} /></mesh>
    <mesh position={[(STAND_X + BEAKER_X) / 2, BENCH_Y + 0.46, BENCH_Z]} rotation={[0, 0, Math.PI / 2]} castShadow><cylinderGeometry args={[0.009, 0.009, BEAKER_X - STAND_X, 16]} /><meshStandardMaterial color="#adb7b9" metalness={0.78} roughness={0.23} /></mesh>
    <mesh position={[BEAKER_X, BENCH_Y + 0.46, BENCH_Z - 0.018]}><boxGeometry args={[0.078, 0.035, 0.022]} /><meshStandardMaterial color="#30363b" roughness={0.64} /></mesh>
    <mesh position={[BEAKER_X, BENCH_Y + 0.46, BENCH_Z + 0.026]}><boxGeometry args={[0.078, 0.035, 0.014]} /><meshStandardMaterial color="#30363b" roughness={0.64} /></mesh>
    <mesh position={[STAND_X + 0.025, BENCH_Y + 0.46, BENCH_Z + 0.043]} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.024, 0.024, 0.013, 20]} /><meshStandardMaterial color="#24292c" roughness={0.48} /></mesh>

    {/* Thin transparent glass, water volume and a visible meniscus. */}
    <mesh position={[BEAKER_X, BENCH_Y + BEAKER_H / 2, BENCH_Z]}><cylinderGeometry args={[BEAKER_R, BEAKER_R * 0.96, BEAKER_H, 48, 1, true]} /><meshPhysicalMaterial color="#d7e8e9" transparent opacity={0.24} roughness={0.07} side={THREE.DoubleSide} depthWrite={false} /></mesh>
    <mesh position={[BEAKER_X, BENCH_Y + 0.004, BENCH_Z]}><cylinderGeometry args={[BEAKER_R * 0.96, BEAKER_R * 0.96, 0.008, 48]} /><meshPhysicalMaterial color="#d7e8e9" transparent opacity={0.36} roughness={0.08} depthWrite={false} /></mesh>
    <mesh position={[BEAKER_X, BENCH_Y + BEAKER_H, BENCH_Z]} rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[BEAKER_R, 0.0045, 10, 48]} /><meshStandardMaterial color="#d5e5e7" metalness={0.08} roughness={0.12} transparent opacity={0.62} /></mesh>
    <mesh position={[BEAKER_X, BENCH_Y + 0.012 + WATER_H / 2, BENCH_Z]}><cylinderGeometry args={[BEAKER_R * 0.945, BEAKER_R * 0.93, WATER_H, 48]} /><meshPhysicalMaterial color={waterColor} transparent opacity={0.42} roughness={0.08} transmission={0.12} thickness={0.08} depthWrite={false} /></mesh>
    <mesh position={[BEAKER_X, BENCH_Y + 0.012 + WATER_H, BENCH_Z]} rotation={[-Math.PI / 2, 0, 0]}><circleGeometry args={[BEAKER_R * 0.945, 48]} /><meshPhysicalMaterial color="#d8e6e2" transparent opacity={0.57} roughness={0.12} side={THREE.DoubleSide} depthWrite={false} /></mesh>
    <mesh position={[BEAKER_X, BENCH_Y + 0.012 + WATER_H, BENCH_Z]} rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[BEAKER_R * 0.945, 0.0024, 8, 48]} /><meshStandardMaterial color="#a8c4c3" transparent opacity={0.48} roughness={0.17} /></mesh>
    <mesh position={[BEAKER_X - 0.012, BENCH_Y + 0.13, BENCH_Z + BEAKER_R * 0.966]}><planeGeometry args={[0.125, 0.242]} /><meshBasicMaterial map={scale} transparent opacity={0.95} depthWrite={false} side={THREE.DoubleSide} /></mesh>

    {/* Slender glass stirrer: immersed tip, with its upper end resting at the rim. */}
    <mesh position={[BEAKER_X + 0.062, BENCH_Y + 0.175, BENCH_Z + 0.018]} rotation={[0, 0, -0.2]}><cylinderGeometry args={[0.003, 0.003, 0.27, 12]} /><meshPhysicalMaterial color="#e7f3f2" transparent opacity={0.62} roughness={0.05} /></mesh>

    <DigitalProbe temp={temp} position={[BEAKER_X, BENCH_Y + 0.012, BENCH_Z]} />
    <Vapor intensity={heat} />
  </group>;
}

function CameraRig({ zoom, intro, introIdx }: { zoom: boolean; intro: boolean; introIdx: number }) {
  const { camera, size } = useThree();
  const look = useRef(new THREE.Vector3(0, BENCH_Y + 0.34, BENCH_Z));
  const destination = useMemo(() => new THREE.Vector3(), []);
  const target = useMemo(() => new THREE.Vector3(), []);
  useEffect(() => {
    if (!(camera instanceof THREE.PerspectiveCamera)) return;
    camera.fov = size.width < 550 ? 66 : size.width < 800 ? 55 : 45;
    camera.updateProjectionMatrix();
  }, [camera, size.width]);
  useFrame(() => {
    if (intro && introIdx > 0) {
      const focus = COOLING_TOUR_FOCUS[Math.min(introIdx - 1, COOLING_TOUR_FOCUS.length - 1)];
      target.set(...focus.target);
      destination.set(focus.target[0] + 0.04, focus.target[1] + 0.18, focus.target[2] + (size.width < 800 ? 0.95 : 0.78));
    } else {
      target.set(0, BENCH_Y + (size.width < 550 ? 0.12 : 0.3), BENCH_Z);
      destination.set(0.06, BENCH_Y + (size.width < 550 ? 0.45 : 0.51), BENCH_Z + (size.width < 550 ? 1.35 : size.width < 800 ? 1.48 : zoom ? 1.18 : 1.55));
    }
    camera.position.lerp(destination, 0.07);
    look.current.lerp(target, 0.07);
    camera.lookAt(look.current);
  });
  return null;
}

export default function CoolingScene({ temp, zoom, intro = false, introIdx = 0, compact = false }: {
  temp: number; zoom: boolean; intro?: boolean; introIdx?: number; compact?: boolean;
}) {
  return <Canvas shadows camera={{ position: [0.06, BENCH_Y + 0.51, 1.55], fov: 45 }} dpr={compact ? [1, 1.25] : [1, 2]} gl={{ antialias: !compact, powerPreference: "high-performance" }}>
    <ambientLight intensity={0.7} />
    <directionalLight position={[3, 6, 4]} intensity={1.2} castShadow shadow-mapSize-width={compact ? 512 : 1024} shadow-mapSize-height={compact ? 512 : 1024} />
    <directionalLight position={[-3, 3, -2]} intensity={0.38} />
    <LabRoom walkLabNoticeBoard />
    <ChemLab stoveOn={false} holding={false} waterOn={false} simplified />
    <CoolingApparatus temp={temp} />
    {intro && introIdx > 0 && <ApparatusTourTag at={COOLING_TOUR_FOCUS[Math.min(introIdx - 1, COOLING_TOUR_FOCUS.length - 1)].label} name={COOLING_TOUR_FOCUS[Math.min(introIdx - 1, COOLING_TOUR_FOCUS.length - 1)].name} number={introIdx} />}
    <CameraRig zoom={zoom} intro={intro} introIdx={introIdx} />
  </Canvas>;
}
