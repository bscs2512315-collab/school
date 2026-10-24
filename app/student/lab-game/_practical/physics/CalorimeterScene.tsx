"use client";

import { useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { LabRoom } from "../../_scene/LabRoom";
import { Beaker, AirConditioner } from "../../walk/ChemLab";
import { Thermometer3D } from "./thermo";
import { Meter3D } from "./meter3d";
import { ApparatusTourTag } from "../../_practical/ApparatusTourTag";
import SteamPlume from "./SteamPlume";

const BENCH_Y = 1.08;
const BENCH_Z = 0.16;
const BX = 0.12; // beaker / thermometer x
const SX = -0.12; // stand x
const PSX = 0.62; // power-supply x
const BEAKER_R = 0.15;
const BEAKER_H = 0.3;
const BULB_Y = BENCH_Y + 0.05;
const SCALE_BOT = BENCH_Y + 0.33;
const SCALE_TOP = BENCH_Y + 0.84;

export const CAL_TOUR_FOCUS: { target: [number, number, number]; label: [number, number, number]; name: string }[] = [
  { target: [BX, BENCH_Y + 0.15, BENCH_Z], label: [BX, BENCH_Y + 0.44, BENCH_Z], name: "Calorimeter & water" },
  { target: [BX, BENCH_Y + 0.35, BENCH_Z], label: [BX, BENCH_Y + 0.65, BENCH_Z], name: "Immersion heater" },
  { target: [BX + 0.08, BENCH_Y + 0.45, BENCH_Z], label: [BX + 0.08, BENCH_Y + 0.78, BENCH_Z], name: "Laboratory thermometer" },
  { target: [-0.55, BENCH_Y + 0.12, BENCH_Z], label: [-0.55, BENCH_Y + 0.38, BENCH_Z], name: "Voltmeter & ammeter" },
  { target: [PSX, BENCH_Y + 0.12, BENCH_Z], label: [PSX, BENCH_Y + 0.38, BENCH_Z], name: "DC power supply" },
];
export const CAL_TOUR_ITEMS = CAL_TOUR_FOCUS.map((t) => t.name);

// Glowing power (⏻) symbol for the ON/OFF button.
function makePowerIcon(color: string): THREE.CanvasTexture {
  const S = 256;
  const c = document.createElement("canvas");
  c.width = c.height = S;
  const g = c.getContext("2d")!;
  const cx = S / 2, cy = S / 2, r = 58;
  g.strokeStyle = color; g.lineWidth = 22; g.lineCap = "round";
  g.shadowColor = color; g.shadowBlur = 24;
  // ring with a gap at the top
  g.beginPath(); g.arc(cx, cy, r, -Math.PI / 2 + 0.5, Math.PI * 1.5 - 0.5); g.stroke();
  // vertical bar
  g.beginPath(); g.moveTo(cx, cy - r - 14); g.lineTo(cx, cy - 6); g.stroke();
  const tex = new THREE.CanvasTexture(c); tex.anisotropy = 8; return tex;
}

function PowerButton({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  const iconOff = useMemo(() => makePowerIcon("#5aa9ff"), []);
  const iconOn = useMemo(() => makePowerIcon("#39d353"), []);
  return (
    <group
      position={[0, 0.07, 0.1]}
      onClick={(e) => { e.stopPropagation(); onToggle(); }}
      onPointerOver={(e) => { e.stopPropagation(); document.body.style.cursor = "pointer"; }}
      onPointerOut={() => { document.body.style.cursor = "auto"; }}
    >
      {/* raised dark bezel */}
      <mesh rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.04, 0.042, 0.022, 40]} /><meshStandardMaterial color="#2a2a2a" roughness={0.35} metalness={0.2} /></mesh>
      {/* inner button cap */}
      <mesh position={[0, 0, 0.012]} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.03, 0.032, 0.014, 40]} /><meshStandardMaterial color="#141414" roughness={0.45} /></mesh>
      {/* glowing power symbol on the face */}
      <mesh position={[0, 0, 0.021]}><circleGeometry args={[0.028, 40]} /><meshBasicMaterial map={on ? iconOn : iconOff} transparent toneMapped={false} /></mesh>
    </group>
  );
}

function makeReadout(v: number, i: number, on: boolean) {
  const canvas = document.createElement("canvas"); canvas.width = 512; canvas.height = 128;
  const g = canvas.getContext("2d")!; g.fillStyle = "#26312b"; g.fillRect(0, 0, 512, 128);
  g.fillStyle = on ? "#a9e9b1" : "#748979"; g.font = "bold 59px monospace"; g.textAlign = "center";
  g.fillText(`${v.toFixed(1)}V  ${i.toFixed(1)}A`, 256, 83);
  const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace; texture.anisotropy = 8; return texture;
}

// A connecting wire that drapes down from the heater terminal, across the bench,
// and up to the supply terminal — so it clearly joins the two.
function Wire({ a, b, color }: { a: [number, number, number]; b: [number, number, number]; color: string }) {
  const geo = useMemo(() => {
    const pts = [
      new THREE.Vector3(...a),
      new THREE.Vector3(a[0] + 0.01, BENCH_Y + 0.18, a[2] + 0.02), // down the side of the heater
      new THREE.Vector3((a[0] + b[0]) / 2, BENCH_Y + 0.07, (a[2] + b[2]) / 2 + 0.03), // across the bench
      new THREE.Vector3(b[0], b[1] + 0.04, b[2]),
      new THREE.Vector3(...b),
    ];
    return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 64, 0.0032, 10, false);
  }, [a, b]);
  return <mesh geometry={geo} castShadow><meshStandardMaterial color={color} roughness={0.5} /></mesh>;
}

// heater terminal world positions (top of the screw terminals)
export const HEATER_POS_RED: [number, number, number] = [BX - 0.016, BENCH_Y + 0.525, BENCH_Z];
export const HEATER_POS_BLK: [number, number, number] = [BX + 0.016, BENCH_Y + 0.525, BENCH_Z];

// Realistic immersion heater: moulded head with screw terminals, chrome shaft
// into the water, and a glowing looped element at the bottom.
function ImmersionHeater({ power }: { power: number }) {
  const glow = Math.min(1, power / 40);
  const elem = useMemo(() => {
    const pts: THREE.Vector3[] = [];
    const N = 50, rad = 0.05;
    for (let k = 0; k <= N; k++) { const a = (k / N) * Math.PI * 2 * 2.5; const y = -(k / N) * 0.08; pts.push(new THREE.Vector3(Math.cos(a) * rad, y, Math.sin(a) * rad)); }
    return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 70, 0.007, 8, false);
  }, []);
  const col = new THREE.Color(`rgb(${Math.round(120 + glow * 135)}, ${Math.round(100 - glow * 50)}, ${Math.round(90 - glow * 60)})`);
  return (
    <group position={[BX, 0, BENCH_Z]}>
      {/* moulded bakelite head */}
      <mesh position={[0, BENCH_Y + 0.44, 0]} castShadow><cylinderGeometry args={[0.034, 0.038, 0.09, 24]} /><meshStandardMaterial color="#161616" roughness={0.45} /></mesh>
      <mesh position={[0, BENCH_Y + 0.485, 0]}><sphereGeometry args={[0.034, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2]} /><meshStandardMaterial color="#161616" roughness={0.45} /></mesh>
      {/* screw terminals (red +, black −) */}
      <mesh position={[-0.016, BENCH_Y + 0.51, 0]}><cylinderGeometry args={[0.007, 0.007, 0.03, 10]} /><meshStandardMaterial color="#c0392b" metalness={0.4} roughness={0.4} /></mesh>
      <mesh position={[0.016, BENCH_Y + 0.51, 0]}><cylinderGeometry args={[0.007, 0.007, 0.03, 10]} /><meshStandardMaterial color="#1f2937" metalness={0.4} roughness={0.4} /></mesh>
      {/* chrome shaft into the water */}
      <mesh position={[0, BENCH_Y + 0.28, 0]}><cylinderGeometry args={[0.011, 0.011, 0.26, 14]} /><meshStandardMaterial color="#cfd3d7" metalness={0.8} roughness={0.25} /></mesh>
      {/* glowing element near the bottom */}
      <group position={[0, BENCH_Y + 0.16, 0]}>
        <mesh geometry={elem}><meshStandardMaterial color={col} emissive={col} emissiveIntensity={glow * 0.9} roughness={0.4} /></mesh>
      </group>
    </group>
  );
}

function Apparatus({ temp, power, on, V, I, onToggle }: { temp: number; power: number; on: boolean; V: number; I: number; onToggle: () => void }) {
  const hot = Math.max(0, Math.min(1, power / 40));
  const liquidH = BEAKER_H * 0.78;
  const liquidCol = new THREE.Color(`rgb(${Math.round(150 + hot * 25)}, ${Math.round(198 - hot * 12)}, ${Math.round(230 - hot * 12)})`);
  const metal = <meshStandardMaterial color="#a1a1aa" metalness={0.6} roughness={0.35} />;
  const dark = <meshStandardMaterial color="#3f3f46" metalness={0.4} roughness={0.5} />;
  const readout = useMemo(() => makeReadout(V, I, on), [V, I, on]);
  useEffect(() => () => readout.dispose(), [readout]);

  return (
    <group>
      {/* stand holds the thermometer */}
      <mesh position={[SX, BENCH_Y + 0.012, BENCH_Z]} castShadow><cylinderGeometry args={[0.13, 0.14, 0.024, 32]} />{dark}</mesh>
      <mesh position={[SX, BENCH_Y + 0.42, BENCH_Z]} castShadow><cylinderGeometry args={[0.012, 0.012, 0.84, 16]} />{metal}</mesh>
      <mesh position={[SX + 0.02, BENCH_Y + 0.5, BENCH_Z]} castShadow><boxGeometry args={[0.05, 0.05, 0.05]} />{dark}</mesh>
      <mesh position={[(SX + BX) / 2 + 0.06, BENCH_Y + 0.5, BENCH_Z]} castShadow><boxGeometry args={[Math.abs(BX - SX) - 0.04, 0.018, 0.018]} />{metal}</mesh>

      {/* beaker + water */}
      <Beaker p={[BX, BENCH_Y, BENCH_Z]} r={BEAKER_R} h={BEAKER_H} />
      <mesh position={[BX, BENCH_Y + 0.012 + liquidH / 2, BENCH_Z]}><cylinderGeometry args={[BEAKER_R * 0.93, BEAKER_R * 0.93, liquidH, 48]} /><meshPhysicalMaterial color={liquidCol} transparent opacity={0.5} transmission={0.35} roughness={0.12} depthWrite={false} /></mesh>
      <mesh position={[BX, BENCH_Y + 0.012 + liquidH, BENCH_Z]} rotation={[-Math.PI / 2, 0, 0]}><circleGeometry args={[BEAKER_R * 0.93, 48]} /><meshPhysicalMaterial color="#d7edf5" transparent opacity={0.54} roughness={0.08} side={THREE.DoubleSide} depthWrite={false} /></mesh>

      <ImmersionHeater power={power} />
      <Thermometer3D temp={temp} min={15} max={100} x={BX + 0.08} z={BENCH_Z} bulbY={BULB_Y} scaleBot={SCALE_BOT} scaleTop={SCALE_TOP} />

      {/* analog meters on the bench (clear of the stand) */}
      <Meter3D label="V" value={V} max={12} pos={[-0.66, BENCH_Y, BENCH_Z + 0.02]} casingColor="#b8bfbe" bezelColor="#7d898b" />
      <Meter3D label="A" value={I} max={5} pos={[-0.44, BENCH_Y, BENCH_Z + 0.02]} casingColor="#b8bfbe" bezelColor="#7d898b" />

      {/* power supply with a clickable ON/OFF button */}
      <group position={[PSX, BENCH_Y, BENCH_Z]}>
        <mesh position={[0, 0.09, 0]} castShadow><boxGeometry args={[0.26, 0.18, 0.18]} /><meshStandardMaterial color="#b8bfbe" roughness={0.38} metalness={0.38} /></mesh>
        <mesh position={[0, 0.09, 0.091]}><planeGeometry args={[0.245, 0.16]} /><meshStandardMaterial color="#e7e8e4" roughness={0.5} /></mesh>
        <mesh position={[0, 0.15, 0.094]}><planeGeometry args={[0.18, 0.047]} /><meshBasicMaterial map={readout} /></mesh>
        <PowerButton on={on} onToggle={onToggle} />
        {/* terminals */}
        <mesh position={[-0.06, 0.02, 0.095]}><cylinderGeometry args={[0.01, 0.01, 0.03, 10]} /><meshStandardMaterial color="#b91c1c" metalness={0.4} /></mesh>
        <mesh position={[0.06, 0.02, 0.095]}><cylinderGeometry args={[0.01, 0.01, 0.03, 10]} /><meshStandardMaterial color="#1f2937" metalness={0.4} /></mesh>
      </group>
      {/* wires actually joining the heater terminals to the power supply */}
      <Wire a={HEATER_POS_RED} b={[PSX - 0.06, BENCH_Y + 0.03, BENCH_Z + 0.1]} color="#c0392b" />
      <Wire a={HEATER_POS_BLK} b={[PSX + 0.06, BENCH_Y + 0.03, BENCH_Z + 0.1]} color="#1a1a1a" />

      <SteamPlume show={hot > 0.25 && temp > 40} x={BX} y={BENCH_Y + 0.32} z={BENCH_Z} />
    </group>
  );
}

function CameraRig({ zoom, intro, introIdx }: { zoom: boolean; intro?: boolean; introIdx?: number }) {
  const { camera, size } = useThree();
  const look = useRef(new THREE.Vector3(0.05, BENCH_Y + 0.3, BENCH_Z));
  const tmp = useMemo(() => new THREE.Vector3(), []);
  const tgt = useMemo(() => new THREE.Vector3(), []);
  useFrame(() => {
    if (intro && introIdx && introIdx > 0) {
      const focus = CAL_TOUR_FOCUS[Math.min(introIdx - 1, CAL_TOUR_FOCUS.length - 1)];
      tgt.set(...focus.target);
      tmp.set(focus.target[0] + 0.1, focus.target[1] + 0.22, focus.target[2] + (size.width < 800 ? 0.95 : 0.82));
    } else if (zoom) {
      tmp.set(0.35, BENCH_Y + 0.6, size.width < 800 ? 2.5 : 1.5);
      tgt.set(0.08, BENCH_Y + (size.width < 800 ? 0.08 : 0.35), BENCH_Z);
    } else {
      tmp.set(size.width < 800 ? 0.16 : 0.35, BENCH_Y + 0.72, size.width < 800 ? 2.6 : 1.85);
      tgt.set(0.05, BENCH_Y + (size.width < 800 ? 0.02 : 0.3), BENCH_Z);
    }
    camera.position.lerp(tmp, 0.05);
    look.current.lerp(tgt, 0.05);
    camera.lookAt(look.current);
  });
  return null;
}

export default function CalorimeterScene({
  temp,
  power,
  on,
  V,
  I,
  zoom,
  intro = false,
  introIdx = 0,
  onToggle,
}: {
  temp: number;
  power: number;
  on: boolean;
  V: number;
  I: number;
  zoom: boolean;
  intro?: boolean;
  introIdx?: number;
  onToggle: () => void;
}) {
  return (
    <Canvas shadows camera={{ position: [0.35, BENCH_Y + 0.72, 1.85], fov: 46 }} dpr={[1, 2]}>
      <ambientLight intensity={0.65} />
      <directionalLight position={[3, 6, 4]} intensity={1.1} castShadow />
      <directionalLight position={[-3, 3, -2]} intensity={0.3} />
      <LabRoom walkLabNoticeBoard />
      <AirConditioner />
      <Apparatus temp={temp} power={power} on={on} V={V} I={I} onToggle={onToggle} />
      {intro && introIdx > 0 && (
        <ApparatusTourTag
          at={CAL_TOUR_FOCUS[Math.min(introIdx - 1, CAL_TOUR_FOCUS.length - 1)].label}
          name={CAL_TOUR_FOCUS[Math.min(introIdx - 1, CAL_TOUR_FOCUS.length - 1)].name}
          number={introIdx}
        />
      )}
      <CameraRig zoom={zoom} intro={intro} introIdx={introIdx} />
    </Canvas>
  );
}
