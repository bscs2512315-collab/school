"use client";

import { useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { LabRoom } from "../_scene/LabRoom";
import { Beaker, AirConditioner } from "../walk/ChemLab";
import { ApparatusTourTag } from "../_practical/ApparatusTourTag";
import SteamPlume from "../_practical/physics/SteamPlume";

const BENCH_Y = 1.08;
const BENCH_Z = 0.14;
const BX = -0.16; // bath x
const MX = 0.34; // manometer x
const BASE = BENCH_Y + 0.12; // mercury base level
const MID = BENCH_Y + 0.34; // mercury mid level (equal-pressure)

export const GAS_TOUR_FOCUS: { target: [number, number, number]; label: [number, number, number]; name: string }[] = [
  { target: [BX, BENCH_Y + 0.14, BENCH_Z], label: [BX, BENCH_Y + 0.44, BENCH_Z], name: "Water bath & burner" },
  { target: [BX, BENCH_Y + 0.12, BENCH_Z], label: [BX, BENCH_Y + 0.32, BENCH_Z], name: "Constant-volume air bulb" },
  { target: [MX, MID + 0.02, BENCH_Z], label: [MX, MID + 0.34, BENCH_Z], name: "Mercury manometer & ruler" },
];
export const GAS_TOUR_ITEMS = GAS_TOUR_FOCUS.map((t) => t.name);

function makeRuler(): THREE.CanvasTexture {
  const W = 96, H = 640;
  const c = document.createElement("canvas"); c.width = W; c.height = H;
  const g = c.getContext("2d")!;
  g.fillStyle = "rgba(255,255,255,0.9)"; g.fillRect(0, 0, W, H);
  g.strokeStyle = "#334155"; g.fillStyle = "#334155"; g.textBaseline = "middle";
  for (let cm = 0; cm <= 30; cm++) {
    const y = H - (cm / 30) * (H - 20) - 10; const major = cm % 5 === 0;
    g.lineWidth = major ? 3 : 1.5; g.beginPath(); g.moveTo(4, y); g.lineTo(major ? 34 : 20, y); g.stroke();
    if (major) { g.font = "bold 24px sans-serif"; g.fillText(String(cm), 42, y); }
  }
  const tex = new THREE.CanvasTexture(c); tex.anisotropy = 8; return tex;
}

function Flame({ on }: { on: boolean }) {
  const m = useRef<THREE.Mesh>(null);
  useFrame((s) => { if (m.current) m.current.scale.y = 1 + Math.sin(s.clock.elapsedTime * 14) * 0.15; });
  if (!on) return null;
  return (
    <group position={[BX, BENCH_Y - 0.12, BENCH_Z]}>
      <pointLight position={[0, 0.1, 0.1]} intensity={0.8} distance={1} color="#ff8a2a" />
      <mesh ref={m} position={[0, 0.06, 0]}><coneGeometry args={[0.03, 0.14, 12]} /><meshBasicMaterial color="#ff9a2a" /></mesh>
      <mesh position={[0, 0.04, 0]}><coneGeometry args={[0.016, 0.08, 12]} /><meshBasicMaterial color="#4a9cff" /></mesh>
    </group>
  );
}

function Apparatus({ temp, pressure, heating }: { temp: number; pressure: number; heating: boolean }) {
  const hot = Math.max(0, Math.min(1, (temp - 20) / 80));
  const liquidCol = new THREE.Color(`rgb(${Math.round(150 + hot * 25)}, ${Math.round(198 - hot * 12)}, ${Math.round(230 - hot * 12)})`);
  const rulerTex = useMemo(makeRuler, []);
  const airTube = useMemo(() => new THREE.TubeGeometry(new THREE.CatmullRomCurve3([
    new THREE.Vector3(BX, BENCH_Y + 0.16, BENCH_Z),
    new THREE.Vector3(BX, BENCH_Y + 0.39, BENCH_Z),
    new THREE.Vector3(BX + 0.03, BENCH_Y + 0.58, BENCH_Z),
    new THREE.Vector3(MX - 0.04, BENCH_Y + 0.61, BENCH_Z),
    new THREE.Vector3(MX - 0.04, MID + 0.245, BENCH_Z),
  ]), 64, 0.006, 12, false), []);
  const uBend = useMemo(() => new THREE.TubeGeometry(new THREE.CatmullRomCurve3([
    new THREE.Vector3(MX - 0.04, BASE + 0.015, BENCH_Z),
    new THREE.Vector3(MX - 0.035, BASE - 0.02, BENCH_Z),
    new THREE.Vector3(MX, BASE - 0.038, BENCH_Z),
    new THREE.Vector3(MX + 0.035, BASE - 0.02, BENCH_Z),
    new THREE.Vector3(MX + 0.04, BASE + 0.015, BENCH_Z),
  ]), 40, 0.012, 16, false), []);
  useEffect(() => () => { rulerTex.dispose(); airTube.dispose(); uBend.dispose(); }, [rulerTex, airTube, uBend]);
  const h = pressure - 76; // gauge difference (cmHg)
  const sc = 0.008; // world units per cm
  const openLevel = MID + (h / 2) * sc; // open limb rises
  const closedLevel = MID - (h / 2) * sc; // closed limb falls
  const merc = <meshStandardMaterial color="#9ca3af" metalness={0.5} roughness={0.3} />;
  const glass = <meshStandardMaterial color="#cdd7e0" transparent opacity={0.3} roughness={0.1} />;

  return (
    <group>
      {/* tripod under the bath */}
      {[0, 2.1, 4.2].map((a, i) => <mesh key={i} position={[BX + Math.cos(a) * 0.12, BENCH_Y - 0.06, BENCH_Z + Math.sin(a) * 0.12]}><cylinderGeometry args={[0.006, 0.006, 0.12, 8]} /><meshStandardMaterial color="#8a9096" metalness={0.6} roughness={0.4} /></mesh>)}
      <mesh position={[BX, BENCH_Y - 0.005, BENCH_Z]}><boxGeometry args={[0.24, 0.008, 0.24]} /><meshStandardMaterial color="#9a9d9f" metalness={0.5} roughness={0.5} /></mesh>
      <Flame on={heating} />

      {/* water bath + water */}
      <Beaker p={[BX, BENCH_Y, BENCH_Z]} r={0.15} h={0.3} />
      <mesh position={[BX, BENCH_Y + 0.14, BENCH_Z]}><cylinderGeometry args={[0.14, 0.14, 0.24, 48]} /><meshPhysicalMaterial color={liquidCol} transparent opacity={0.48} roughness={0.12} transmission={0.38} depthWrite={false} /></mesh>
      <mesh position={[BX, BENCH_Y + 0.26, BENCH_Z]} rotation={[-Math.PI / 2, 0, 0]}><circleGeometry args={[0.139, 48]} /><meshPhysicalMaterial color="#d6edf7" transparent opacity={0.55} roughness={0.08} side={THREE.DoubleSide} depthWrite={false} /></mesh>
      {[0.04, 0.09, 0.14, 0.19].map((rise, i) => <group key={i} position={[BX, BENCH_Y + rise, BENCH_Z + 0.149]}><mesh position={[-0.111, 0, 0]}><boxGeometry args={[0.016, 0.0016, 0.001]} /><meshBasicMaterial color="#58717e" /></mesh><mesh position={[0.102, 0, 0]}><boxGeometry args={[0.011, 0.0016, 0.001]} /><meshBasicMaterial color="#58717e" /></mesh></group>)}
      {/* air bulb submerged */}
      <mesh position={[BX, BENCH_Y + 0.12, BENCH_Z]}><sphereGeometry args={[0.05, 20, 20]} /><meshStandardMaterial color="#dbeafe" transparent opacity={0.6} roughness={0.1} /></mesh>
      {/* thermometer in the bath */}
      <mesh position={[BX + 0.09, BENCH_Y + 0.22, BENCH_Z]}><cylinderGeometry args={[0.008, 0.008, 0.34, 12]} /><meshStandardMaterial color="#eef2f6" transparent opacity={0.5} /></mesh>
      <mesh position={[BX + 0.09, BENCH_Y + 0.1 + hot * 0.08, BENCH_Z]}><cylinderGeometry args={[0.004, 0.004, 0.04 + hot * 0.16, 10]} /><meshStandardMaterial color="#d9463b" /></mesh>
      <SteamPlume show={hot > 0.3} x={BX} y={BENCH_Y + 0.3} z={BENCH_Z} />

      {/* tube from bulb up to the manometer closed limb */}
      <mesh geometry={airTube}><meshPhysicalMaterial color="#d2e4e9" transparent opacity={0.75} transmission={0.45} roughness={0.08} metalness={0.05} /></mesh>
      <mesh position={[BX, BENCH_Y + 0.19, BENCH_Z]}><cylinderGeometry args={[0.012, 0.012, 0.022, 16]} /><meshStandardMaterial color="#747f81" metalness={0.62} roughness={0.28} /></mesh>

      {/* manometer board + ruler */}
      <mesh position={[MX, MID + 0.02, BENCH_Z - 0.02]}><boxGeometry args={[0.16, 0.5, 0.01]} /><meshStandardMaterial color="#e7ebe7" /></mesh>
      <mesh position={[MX + 0.055, MID + 0.02, BENCH_Z - 0.01]}><planeGeometry args={[0.05, 0.48]} /><meshBasicMaterial map={rulerTex} transparent /></mesh>
      {/* two glass limbs */}
      {[MX - 0.04, MX + 0.04].map((x, i) => <mesh key={i} position={[x, MID + 0.02, BENCH_Z]}><cylinderGeometry args={[0.014, 0.014, 0.46, 16, 1, true]} />{glass}</mesh>)}
      {/* U base */}
      <mesh geometry={uBend}>{merc}</mesh>
      {/* mercury columns */}
      <mesh position={[MX - 0.04, (BASE + closedLevel) / 2, BENCH_Z]}><cylinderGeometry args={[0.012, 0.012, Math.max(0.01, closedLevel - BASE), 16]} />{merc}</mesh>
      <mesh position={[MX + 0.04, (BASE + openLevel) / 2, BENCH_Z]}><cylinderGeometry args={[0.012, 0.012, Math.max(0.01, openLevel - BASE), 16]} />{merc}</mesh>
    </group>
  );
}

function CameraRig({ zoom, intro, introIdx }: { zoom: boolean; intro?: boolean; introIdx?: number }) {
  const { camera, size } = useThree();
  const look = useRef(new THREE.Vector3(0.05, MID, BENCH_Z));
  const tmp = useMemo(() => new THREE.Vector3(), []);
  const tgt = useMemo(() => new THREE.Vector3(), []);
  useFrame(() => {
    if (intro && introIdx && introIdx > 0) {
      const focus = GAS_TOUR_FOCUS[Math.min(introIdx - 1, GAS_TOUR_FOCUS.length - 1)];
      tgt.set(...focus.target);
      tmp.set(focus.target[0] + 0.1, focus.target[1] + 0.22, focus.target[2] + (size.width < 800 ? 0.95 : 0.82));
    } else if (zoom) {
      tmp.set(MX + 0.02, MID + 0.06, BENCH_Z + (size.width < 800 ? 0.95 : 0.55));
      tgt.set(MX, MID, BENCH_Z);
    } else {
      tmp.set(size.width < 800 ? 0.34 : 0.55, BENCH_Y + 0.75, size.width < 800 ? 2.5 : 1.85);
      tgt.set(0.08, BENCH_Y + (size.width < 800 ? 0.07 : 0.34), BENCH_Z);
    }
    camera.position.lerp(tmp, 0.05);
    look.current.lerp(tgt, 0.05);
    camera.lookAt(look.current);
  });
  return null;
}

export default function GasScene({
  temp,
  pressure,
  heating,
  zoom,
  intro = false,
  introIdx = 0,
}: {
  temp: number;
  pressure: number;
  heating: boolean;
  zoom: boolean;
  intro?: boolean;
  introIdx?: number;
}) {
  return (
    <Canvas shadows camera={{ position: [0.55, BENCH_Y + 0.75, 1.85], fov: 46 }} dpr={[1, 2]}>
      <ambientLight intensity={0.65} />
      <directionalLight position={[3, 6, 4]} intensity={1.1} castShadow />
      <directionalLight position={[-3, 3, -2]} intensity={0.3} />
      <LabRoom walkLabNoticeBoard />
      <AirConditioner />
      <Apparatus temp={temp} pressure={pressure} heating={heating} />
      {intro && introIdx > 0 && (
        <ApparatusTourTag
          at={GAS_TOUR_FOCUS[Math.min(introIdx - 1, GAS_TOUR_FOCUS.length - 1)].label}
          name={GAS_TOUR_FOCUS[Math.min(introIdx - 1, GAS_TOUR_FOCUS.length - 1)].name}
          number={introIdx}
        />
      )}
      <CameraRig zoom={zoom} intro={intro} introIdx={introIdx} />
    </Canvas>
  );
}
