"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { RoundedBox } from "@react-three/drei";
import * as THREE from "three";

// Needle angular sweep in radians (≈ 96 degrees total deflection)
const SWEEP = 1.68;

function makeSupplyFace(voltage: number, on: boolean): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 900; canvas.height = 570;
  const g = canvas.getContext("2d")!;
  g.fillStyle = "#e7e8e4"; g.fillRect(0, 0, 900, 570);
  g.fillStyle = "#24333b"; g.fillRect(0, 0, 900, 105);
  g.fillStyle = "#ffffff"; g.font = "bold 42px Arial"; g.fillText("DC REGULATED POWER SUPPLY", 38, 69);
  g.fillStyle = "#151d20"; g.fillRect(48, 159, 386, 206);
  g.fillStyle = on ? "#b5e8bd" : "#77817a"; g.fillRect(64, 175, 354, 174);
  g.fillStyle = on ? "#183c30" : "#333b37"; g.font = "bold 105px monospace"; g.fillText(`${voltage.toFixed(2)}V`, 74, 300);
  g.fillStyle = "#384b51"; g.font = "bold 33px Arial";
  g.fillText("VOLTAGE", 102, 418); g.fillText("ADJUST", 596, 418);
  g.fillText("POWER", 45, 526); g.fillText("OUTPUT", 476, 390);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  return texture;
}

function makeResistanceFace(rValue: number): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 1000; canvas.height = 160;
  const g = canvas.getContext("2d")!;
  g.fillStyle = "#ecdfc6"; g.fillRect(0, 0, 1000, 160);
  g.strokeStyle = "#8b6c3a"; g.lineWidth = 10; g.strokeRect(6, 6, 988, 148);
  g.fillStyle = "#28221b"; g.textAlign = "center";
  g.font = "bold 65px Georgia"; g.fillText(`RESISTANCE  ·  ${rValue} Ω`, 500, 101);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function makeResistanceScale(): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 2048; canvas.height = 320;
  const g = canvas.getContext("2d")!;
  g.fillStyle = "#35383a"; g.fillRect(0, 0, 2048, 320);
  g.fillStyle = "#ffffff"; g.textAlign = "center"; g.font = "bold 102px Arial";
  ["5kΩ", "2kΩ", "1kΩ", "500Ω", "200Ω", "100Ω", "50Ω", "20Ω"].forEach((value, i) => g.fillText(value, 128 + i * 256, 211));
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 16;
  return texture;
}

function makeWoodGrain(): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 512; canvas.height = 256;
  const g = canvas.getContext("2d")!;
  g.fillStyle = "#d3ad7b"; g.fillRect(0, 0, 512, 256);
  for (let i = 0; i < 100; i++) {
    const y = (i * 67) % 256;
    g.strokeStyle = i % 3 ? "rgba(102,64,37,.10)" : "rgba(255,240,205,.19)";
    g.lineWidth = i % 7 === 0 ? 2 : 1;
    g.beginPath(); g.moveTo(0, y);
    g.bezierCurveTo(170, y + Math.sin(i) * 5, 330, y - Math.cos(i) * 6, 512, y + Math.sin(i * 2) * 4);
    g.stroke();
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/**
 * Ultra-crisp high-resolution 1024x1024 procedural dial face texture.
 * Exactly calibrated to match the 3D needle pivot and radius.
 */
export function makeMeterFace(
  label: string,
  max: number,
  isGalvo: boolean = false
): THREE.CanvasTexture {
  const S = 1024;
  const c = document.createElement("canvas");
  c.width = c.height = S;
  const g = c.getContext("2d")!;

  // 1. Off-white crisp dial plate background
  g.fillStyle = "#ffffff";
  g.fillRect(0, 0, S, S);

  // Subtle outer border line
  g.strokeStyle = "#e2e8f0";
  g.lineWidth = 4;
  g.strokeRect(12, 12, S - 24, S - 24);

  // Exact geometric center of the arc on 1024x1024 canvas
  const cx = 512;
  const cy = 850; // Pivot center in canvas pixels
  const R = 580; // Radius to primary arc in canvas pixels

  // 2. Anti-parallax Mirror Arc Strip
  const mirrorR = R - 32;
  g.strokeStyle = "#cbd5e1";
  g.lineWidth = 14;
  g.beginPath();
  for (let k = 0; k <= 100; k++) {
    const phi = (0.5 - k / 100) * SWEEP;
    const x = cx - Math.sin(phi) * mirrorR;
    const y = cy - Math.cos(phi) * mirrorR;
    if (k === 0) g.moveTo(x, y);
    else g.lineTo(x, y);
  }
  g.stroke();

  // 3. Primary Calibration Arc Line
  g.strokeStyle = "#09090b";
  g.lineWidth = 4;
  g.beginPath();
  for (let k = 0; k <= 100; k++) {
    const phi = (0.5 - k / 100) * SWEEP;
    const x = cx - Math.sin(phi) * R;
    const y = cy - Math.cos(phi) * R;
    if (k === 0) g.moveTo(x, y);
    else g.lineTo(x, y);
  }
  g.stroke();

  // 4. Tick Marks & Numbers
  g.fillStyle = "#09090b";
  g.textAlign = "center";
  g.textBaseline = "middle";

  if (isGalvo) {
    // Center-Zero Galvanometer: -30 to +30 (0 at center)
    const totalDivs = 30; // 30 each side
    for (let i = -totalDivs; i <= totalDivs; i++) {
      const f = (i + totalDivs) / (totalDivs * 2);
      const phi = (0.5 - f) * SWEEP;
      const isMajor = i % 10 === 0;
      const isMedium = i % 5 === 0 && !isMajor;

      const r1 = R;
      const r2 = R - (isMajor ? 40 : isMedium ? 24 : 14);

      g.lineWidth = isMajor ? 4.5 : isMedium ? 2.5 : 1.8;
      g.strokeStyle = i === 0 ? "#dc2626" : "#09090b";

      g.beginPath();
      g.moveTo(cx - Math.sin(phi) * r1, cy - Math.cos(phi) * r1);
      g.lineTo(cx - Math.sin(phi) * r2, cy - Math.cos(phi) * r2);
      g.stroke();

      if (isMajor) {
        const rn = R - 72;
        g.font = "bold 38px 'Segoe UI', -apple-system, Roboto, sans-serif";
        g.fillStyle = i === 0 ? "#dc2626" : "#09090b";
        g.fillText(String(Math.abs(i)), cx - Math.sin(phi) * rn, cy - Math.cos(phi) * rn);
      }
    }
  } else {
    // Unidirectional Meters (0 to max)
    // Determine clean step increments based on max range
    let majorCount = 5;
    if (max === 3) majorCount = 3;
    if (max === 8) majorCount = 4;
    if (max === 1) majorCount = 5;

    const totalSubDivs = majorCount * 10;
    for (let i = 0; i <= totalSubDivs; i++) {
      const f = i / totalSubDivs;
      const phi = (0.5 - f) * SWEEP;
      const isMajor = i % 10 === 0;
      const isMedium = i % 5 === 0 && !isMajor;

      const r1 = R;
      const r2 = R - (isMajor ? 40 : isMedium ? 24 : 14);

      g.lineWidth = isMajor ? 4.5 : isMedium ? 2.5 : 1.8;
      g.strokeStyle = "#09090b";

      g.beginPath();
      g.moveTo(cx - Math.sin(phi) * r1, cy - Math.cos(phi) * r1);
      g.lineTo(cx - Math.sin(phi) * r2, cy - Math.cos(phi) * r2);
      g.stroke();

      if (isMajor) {
        const val = f * max;
        const rn = R - 72;
        g.font = "bold 38px 'Segoe UI', -apple-system, Roboto, sans-serif";
        g.fillStyle = "#09090b";
        const valStr = Number.isInteger(max) ? String(Math.round(val)) : val.toFixed(1);
        g.fillText(valStr, cx - Math.sin(phi) * rn, cy - Math.cos(phi) * rn);
      }
    }
  }

  // 5. Clean Central Unit Letter & Typography (no overlapping text)
  g.font = "bold 120px Georgia, 'Times New Roman', serif";
  g.fillStyle = "#0f172a";
  g.fillText(label, cx, cy - R * 0.42);

  g.font = "bold 24px 'Segoe UI', Roboto, sans-serif";
  g.fillStyle = "#475569";
  const title = label === "V" ? "VOLTMETER" : label === "A" ? "AMMETER" : "GALVANOMETER";
  g.fillText(title, cx, cy - R * 0.22);

  g.font = "bold 16px 'Segoe UI', Roboto, sans-serif";
  g.fillStyle = "#94a3b8";
  g.fillText("MOVING COIL · CLASS 1.0", cx, cy - R * 0.08);

  // Bottom corner badges
  g.font = "bold 15px monospace";
  g.textAlign = "left";
  g.fillText("DC ONLY ⎓", 40, cy + 40);

  g.textAlign = "right";
  g.fillText("2000 Ω/V", S - 40, cy + 40);

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 16;
  tex.needsUpdate = true;
  return tex;
}

/**
 * Ultra-realistic Desktop Moving-Coil Meter.
 * Zero shadow acne: internal dial face uses basic material, needle is perfectly centered,
 * and transparent glass cover uses non-occluding physical properties.
 */
export function Meter3D({
  label,
  value,
  max,
  pos,
  isGalvo = false,
  casingColor = "#1e2430",
  bezelColor = "#0f172a",
}: {
  label: string;
  value: number;
  max: number;
  pos: [number, number, number];
  isGalvo?: boolean;
  casingColor?: string;
  bezelColor?: string;
}) {
  const face = useMemo(() => makeMeterFace(label, max, isGalvo), [label, max, isGalvo]);
  const needle = useRef<THREE.Group>(null);

  useFrame(() => {
    if (needle.current) {
      let f: number;
      if (isGalvo) {
        // -30 to +30, 0 is center (f = 0.5)
        const clamped = Math.max(-30, Math.min(30, value));
        f = (clamped + 30) / 60;
      } else {
        f = Math.max(0, Math.min(1, value / max));
      }
      needle.current.rotation.z = (0.5 - f) * SWEEP;
    }
  });

  const width = 0.17;
  const height = 0.17;
  const depth = 0.09;
  const tiltAngle = -0.22; // ~12.5 deg tilt backwards

  // Exact 3D coordinates aligned with 2D Canvas:
  // Dial plane is 0.145 x 0.145 at center y = 0.008
  // Pivot is at y = -0.0415
  const pivotY = -0.0415;

  return (
    <group position={pos}>
      {/* 1. MOLDED MATTE WEDGE BENCH CASING */}
      <group rotation={[tiltAngle, 0, 0]} position={[0, 0.09, 0]}>
        {/* Main Body Housing */}
        <mesh castShadow receiveShadow={false}>
          <boxGeometry args={[width, height, depth]} />
          <meshStandardMaterial color={casingColor} roughness={0.45} metalness={0.15} />
        </mesh>

        {/* Front Bezel Frame Border */}
        <mesh position={[0, 0, depth / 2 + 0.001]} receiveShadow={false}>
          <boxGeometry args={[width - 0.006, height - 0.006, 0.004]} />
          <meshStandardMaterial color={bezelColor} roughness={0.35} metalness={0.3} />
        </mesh>
        {[-0.076, 0.076].flatMap((x) => [-0.076, 0.076].map((y) => <mesh key={`${x}-${y}`} position={[x, y, depth / 2 + 0.005]} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.003, 0.003, 0.002, 12]} /><meshStandardMaterial color="#aab4b9" metalness={0.85} roughness={0.24} /></mesh>))}

        {/* 2. RECESSED CRISP DIAL FACE (Zero shadow acne: MeshBasicMaterial) */}
        <mesh position={[0, 0.008, depth / 2 + 0.004]} castShadow={false} receiveShadow={false}>
          <planeGeometry args={[0.145, 0.145]} />
          <meshBasicMaterial map={face} depthWrite={true} />
        </mesh>

        {/* 3. MATHEMATICALLY ALIGNED NEEDLE MECHANISM */}
        <group position={[0, pivotY, depth / 2 + 0.008]}>
          <group ref={needle}>
            {/* Tapered Knife-Edge Red Pointer Needle */}
            <mesh position={[0, 0.044, 0]} castShadow={false} receiveShadow={false}>
              <cylinderGeometry args={[0.0006, 0.0016, 0.088, 8]} />
              <meshBasicMaterial color="#dc2626" />
            </mesh>
            {/* Black Counterbalance Tail */}
            <mesh position={[0, -0.014, 0]} castShadow={false} receiveShadow={false}>
              <boxGeometry args={[0.005, 0.018, 0.001]} />
              <meshBasicMaterial color="#0f172a" />
            </mesh>
          </group>

          {/* Central Jeweled Brass Pivot Cap */}
          <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0.002]} castShadow={false} receiveShadow={false}>
            <cylinderGeometry args={[0.007, 0.007, 0.005, 20]} />
            <meshStandardMaterial color="#ca8a04" metalness={0.9} roughness={0.2} />
          </mesh>
        </group>

        {/* 4. MECHANICAL ZERO-ADJUSTER SCREW ON LOWER BEZEL */}
        <group position={[0, -0.065, depth / 2 + 0.006]} rotation={[Math.PI / 2, 0, 0]}>
          <mesh castShadow={false} receiveShadow={false}>
            <cylinderGeometry args={[0.0065, 0.0065, 0.004, 16]} />
            <meshStandardMaterial color="#94a3b8" metalness={0.8} roughness={0.3} />
          </mesh>
          <mesh position={[0, 0.0022, 0]} castShadow={false} receiveShadow={false}>
            <boxGeometry args={[0.009, 0.0018, 0.002]} />
            <meshStandardMaterial color="#0f172a" roughness={0.6} />
          </mesh>
        </group>

        {/* 5. CRYSTAL-CLEAR GLASS WINDOW COVER (DepthWrite false to eliminate all z-fighting & shadow acne) */}
        <mesh position={[0, 0.008, depth / 2 + 0.012]} castShadow={false} receiveShadow={false}>
          <planeGeometry args={[0.145, 0.145]} />
          <meshPhysicalMaterial
            color="#ffffff"
            transparent
            opacity={0.12}
            roughness={0.05}
            transmission={0.98}
            thickness={0.01}
            ior={1.5}
            clearcoat={1.0}
            clearcoatRoughness={0.05}
            depthWrite={false}
          />
        </mesh>

        {/* 6. COLOR-CODED BRASS BINDING POST TERMINALS */}
        {/* Red Positive (+) Terminal */}
        <group position={[-width / 2 + 0.03, -height / 2 + 0.016, depth / 2 + 0.005]} rotation={[Math.PI / 2, 0, 0]}>
          <mesh position={[0, 0.008, 0]} castShadow receiveShadow={false}>
            <cylinderGeometry args={[0.006, 0.006, 0.016, 16]} />
            <meshStandardMaterial color="#dc2626" roughness={0.3} metalness={0.2} />
          </mesh>
          <mesh position={[0, 0.016, 0]} castShadow receiveShadow={false}>
            <cylinderGeometry args={[0.009, 0.009, 0.01, 16]} />
            <meshStandardMaterial color="#d97706" metalness={0.9} roughness={0.2} />
          </mesh>
        </group>

        {/* Black Negative (-) Terminal */}
        <group position={[width / 2 - 0.03, -height / 2 + 0.016, depth / 2 + 0.005]} rotation={[Math.PI / 2, 0, 0]}>
          <mesh position={[0, 0.008, 0]} castShadow receiveShadow={false}>
            <cylinderGeometry args={[0.006, 0.006, 0.016, 16]} />
            <meshStandardMaterial color="#0f172a" roughness={0.4} metalness={0.2} />
          </mesh>
          <mesh position={[0, 0.016, 0]} castShadow receiveShadow={false}>
            <cylinderGeometry args={[0.009, 0.009, 0.01, 16]} />
            <meshStandardMaterial color="#d97706" metalness={0.9} roughness={0.2} />
          </mesh>
        </group>
      </group>

      {/* 7. RUBBER FEET UNDER CASING */}
      {[
        [-width / 2 + 0.02, 0.003, -depth / 2 + 0.02],
        [width / 2 - 0.02, 0.003, -depth / 2 + 0.02],
        [-width / 2 + 0.02, 0.003, depth / 2 - 0.02],
        [width / 2 - 0.02, 0.003, depth / 2 - 0.02],
      ].map((p, i) => (
        <mesh key={i} position={p as [number, number, number]}>
          <cylinderGeometry args={[0.008, 0.008, 0.006, 12]} />
          <meshStandardMaterial color="#09090b" roughness={0.8} />
        </mesh>
      ))}
    </group>
  );
}

/**
 * Realistic Physics Lab Flexible Connecting Wire with natural catenary drape,
 * molded strain-relief boots, and brass banana plug pins.
 */
export function LabWire({
  points,
  color = "#dc2626",
  terminalEnds,
}: {
  points: [number, number, number][];
  color?: string;
  terminalEnds?: ["front" | "top", "front" | "top"];
}) {
  const { curveGeo, startBoot, endBoot, startRotation, endRotation } = useMemo(() => {
    const vectors = points.map((p) => new THREE.Vector3(...p));
    const curve = new THREE.CatmullRomCurve3(vectors, false, "catmullrom", 0.35);
    const curveGeo = new THREE.TubeGeometry(curve, 72, 0.0028, 12, false);

    const start = vectors[0];
    const end = vectors[vectors.length - 1];
    const up = new THREE.Vector3(0, 1, 0);

    return {
      curveGeo,
      startBoot: start,
      endBoot: end,
      startRotation: new THREE.Quaternion().setFromUnitVectors(up, curve.getTangent(0).normalize()),
      endRotation: new THREE.Quaternion().setFromUnitVectors(up, curve.getTangent(1).negate().normalize()),
    };
  }, [points]);
  useEffect(() => () => curveGeo.dispose(), [curveGeo]);

  return (
    <group>
      {/* Flexible Silicone Cable Jacket */}
      <mesh geometry={curveGeo} castShadow receiveShadow={false}>
        <meshStandardMaterial
          color={color}
          roughness={0.68}
          metalness={0}
        />
      </mesh>

      {/* Molded Strain-Relief Boots at Cable Ends */}
      <group position={[startBoot.x, startBoot.y, startBoot.z]} quaternion={terminalEnds ? undefined : startRotation} rotation={terminalEnds ? [terminalEnds[0] === "front" ? Math.PI / 2 : 0, 0, 0] : undefined}>
        {terminalEnds && <mesh position={[0, -0.005, 0]} castShadow><cylinderGeometry args={[0.0057, 0.0057, 0.013, 20]} /><meshStandardMaterial color="#c5a15d" metalness={0.75} roughness={0.28} /></mesh>}
        <mesh position={[0, 0.007, 0]} castShadow receiveShadow={false}>
          <cylinderGeometry args={[0.0034, 0.0068, 0.018, 20]} />
          <meshStandardMaterial color={color} roughness={0.4} />
        </mesh>
        <mesh position={[0, -0.002, 0]}>
          <cylinderGeometry args={[0.0035, 0.0035, 0.008, 12]} />
          <meshStandardMaterial color="#ca8a04" metalness={0.9} roughness={0.2} />
        </mesh>
      </group>

      <group position={[endBoot.x, endBoot.y, endBoot.z]} quaternion={terminalEnds ? undefined : endRotation} rotation={terminalEnds ? [terminalEnds[1] === "front" ? Math.PI / 2 : 0, 0, 0] : undefined}>
        {terminalEnds && <mesh position={[0, -0.005, 0]} castShadow><cylinderGeometry args={[0.0057, 0.0057, 0.013, 20]} /><meshStandardMaterial color="#c5a15d" metalness={0.75} roughness={0.28} /></mesh>}
        <mesh position={[0, 0.007, 0]} castShadow receiveShadow={false}>
          <cylinderGeometry args={[0.0034, 0.0068, 0.018, 20]} />
          <meshStandardMaterial color={color} roughness={0.4} />
        </mesh>
        <mesh position={[0, -0.002, 0]}>
          <cylinderGeometry args={[0.0035, 0.0035, 0.008, 12]} />
          <meshStandardMaterial color="#ca8a04" metalness={0.9} roughness={0.2} />
        </mesh>
      </group>
    </group>
  );
}

/**
 * Realistic Dual/Single Regulated DC Laboratory Power Supply.
 */
export function PowerSupply3D({
  pos,
  voltage = 3.0,
  on = true,
}: {
  pos: [number, number, number];
  voltage?: number;
  on?: boolean;
}) {
  const face = useMemo(() => makeSupplyFace(voltage, on), [voltage, on]);
  useEffect(() => () => face.dispose(), [face]);
  return (
    <group position={pos}>
      <mesh position={[0, 0.08, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.24, 0.16, 0.18]} />
        <meshStandardMaterial color="#b8bfbe" roughness={0.34} metalness={0.48} />
      </mesh>

      {/* Printed brushed-metal control fascia with a live LCD. */}
      <mesh position={[0, 0.08, 0.091]}>
        <planeGeometry args={[0.22, 0.14]} />
        <meshBasicMaterial map={face} />
      </mesh>
      {[[-0.102, 0.137], [0.102, 0.137], [-0.102, 0.023], [0.102, 0.023]].map(([x, y], i) => <mesh key={i} position={[x, y, 0.094]} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.003, 0.003, 0.001, 12]} /><meshStandardMaterial color="#58656a" metalness={0.75} roughness={0.25} /></mesh>)}
      {Array.from({ length: 6 }, (_, i) => <mesh key={i} position={[-0.065 + i * 0.026, 0.161, -0.035]}><boxGeometry args={[0.014, 0.0015, 0.058]} /><meshBasicMaterial color="#526068" /></mesh>)}
      {[-0.085, 0.085].map((x) => <mesh key={x} position={[x, 0.005, 0.05]}><boxGeometry args={[0.026, 0.01, 0.035]} /><meshStandardMaterial color="#171c20" roughness={0.8} /></mesh>)}

      {/* Voltage Knob */}
      <group position={[0.06, 0.085, 0.092]} rotation={[Math.PI / 2, 0, 0]}>
        <mesh castShadow>
          <cylinderGeometry args={[0.016, 0.016, 0.014, 24]} />
          <meshStandardMaterial color="#0f172a" roughness={0.5} />
        </mesh>
        <mesh position={[0, 0.008, 0]}>
          <cylinderGeometry args={[0.012, 0.012, 0.004, 20]} />
          <meshStandardMaterial color="#94a3b8" metalness={0.9} roughness={0.2} />
        </mesh>
      </group>

      {/* Power Toggle Switch */}
      <group position={[-0.06, 0.035, 0.092]}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.008, 0.008, 0.006, 16]} />
          <meshStandardMaterial color="#64748b" metalness={0.8} roughness={0.3} />
        </mesh>
        <mesh position={[0, 0.004, 0.008]} rotation={[on ? -0.3 : 0.3, 0, 0]}>
          <cylinderGeometry args={[0.003, 0.003, 0.014, 12]} />
          <meshStandardMaterial color="#e2e8f0" metalness={0.95} roughness={0.15} />
        </mesh>
      </group>

      {/* Power LED */}
      <mesh position={[-0.02, 0.035, 0.092]}>
        <sphereGeometry args={[0.004, 12, 12]} />
        <meshBasicMaterial color={on ? "#22c55e" : "#14532d"} />
      </mesh>

      {/* Red Positive (+) Output Terminal */}
      <group position={[0.03, 0.035, 0.092]} rotation={[Math.PI / 2, 0, 0]}>
        <mesh castShadow>
          <cylinderGeometry args={[0.007, 0.007, 0.018, 16]} />
          <meshStandardMaterial color="#dc2626" roughness={0.3} metalness={0.2} />
        </mesh>
        <mesh position={[0, 0.01, 0]}>
          <cylinderGeometry args={[0.009, 0.009, 0.008, 16]} />
          <meshStandardMaterial color="#d97706" metalness={0.9} roughness={0.2} />
        </mesh>
      </group>

      {/* Black Negative (-) Output Terminal */}
      <group position={[0.075, 0.035, 0.092]} rotation={[Math.PI / 2, 0, 0]}>
        <mesh castShadow>
          <cylinderGeometry args={[0.007, 0.007, 0.018, 16]} />
          <meshStandardMaterial color="#0f172a" roughness={0.4} metalness={0.2} />
        </mesh>
        <mesh position={[0, 0.01, 0]}>
          <cylinderGeometry args={[0.009, 0.009, 0.008, 16]} />
          <meshStandardMaterial color="#d97706" metalness={0.9} roughness={0.2} />
        </mesh>
      </group>
    </group>
  );
}

/**
 * Authentic Physics Resistance Box.
 */
export function ResistanceBox3D({
  pos,
  seriesOn = false,
  rValue = 2000,
  isShunt = false,
}: {
  pos: [number, number, number];
  seriesOn?: boolean;
  rValue?: number;
  isShunt?: boolean;
}) {
  const width = isShunt ? 0.22 : 0.32;
  const length = isShunt ? 0.16 : 0.2;
  const height = 0.09;
  const face = useMemo(() => makeResistanceFace(rValue), [rValue]);
  const scale = useMemo(makeResistanceScale, []);
  const wood = useMemo(makeWoodGrain, []);
  useEffect(() => () => { face.dispose(); scale.dispose(); wood.dispose(); }, [face, scale, wood]);
  const spacing = (width - 0.066) / 8;
  const segments = Array.from({ length: 9 }, (_, i) => (i - 4) * spacing);
  const plugs = Array.from({ length: 8 }, (_, i) => (i - 3.5) * spacing);
  const rowZ = length * 0.18;
  const selectedPlugs = new Set<number>();
  let remainingResistance = rValue;
  [5000, 2000, 1000, 500, 200, 100, 50, 20].forEach((value, i) => {
    if (remainingResistance >= value) { selectedPlugs.add(i); remainingResistance -= value; }
  });

  return (
    <group position={pos}>
      <mesh position={[0, height / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[width, height, length]} />
        <meshStandardMaterial map={wood} roughness={0.64} metalness={0.02} />
      </mesh>

      <mesh position={[0, height * 0.5, length / 2 + 0.001]}><planeGeometry args={[width * 0.72, height * 0.4]} /><meshBasicMaterial map={face} /></mesh>
      {[-width / 2 + 0.01, width / 2 - 0.01].map((x) => <mesh key={x} position={[x, height / 2, length / 2 + 0.002]}><boxGeometry args={[0.003, height - 0.008, 0.003]} /><meshStandardMaterial color="#b99555" metalness={0.82} roughness={0.26} /></mesh>)}

      <mesh position={[0, 0.006, 0]}>
        <boxGeometry args={[width + 0.015, 0.012, length + 0.015]} />
        <meshStandardMaterial color="#a77b51" roughness={0.63} />
      </mesh>

      <mesh position={[0, height + 0.003, 0]}>
        <boxGeometry args={[width - 0.01, 0.006, length - 0.01]} />
        <meshStandardMaterial color="#525650" roughness={0.45} metalness={0.13} />
      </mesh>

      {/* Two rows of brass contact blocks and removable black-handled plugs. */}
      {[-rowZ, rowZ].map((z, row) => <group key={row}>
        {segments.map((x, i) => <mesh key={`block-${i}`} position={[x, height + 0.015, z]} castShadow>
          <boxGeometry args={[spacing * 0.78, 0.018, 0.029]} />
          <meshStandardMaterial color="#e8bd69" metalness={0.48} roughness={0.29} />
        </mesh>)}
        {plugs.map((x, i) => {
          const removed = seriesOn && row === 0 && selectedPlugs.has(i);
          return <group key={`plug-${i}`} position={[x, height + 0.025, z]}>
            <mesh position={[0, 0.001, 0]}><boxGeometry args={[spacing * 0.58, 0.003, 0.008]} /><meshStandardMaterial color={removed ? "#342e26" : "#c79950"} metalness={0.48} roughness={0.32} /></mesh>
            {!removed && <group>
              <mesh position={[0, 0.003, 0]} castShadow><cylinderGeometry args={[0.004, 0.004, 0.009, 12]} /><meshStandardMaterial color="#c39b56" metalness={0.5} roughness={0.3} /></mesh>
              <RoundedBox args={[spacing * 0.86, 0.019, 0.026]} radius={0.004} smoothness={3} position={[0, 0.011, 0]} rotation={[0, 0, i % 3 === 0 ? 0.07 : -0.04]} castShadow><meshStandardMaterial color="#22272b" roughness={0.62} /></RoundedBox>
            </group>}
          </group>;
        })}
      </group>)}
      <mesh position={[0, height + 0.007, length / 2 - 0.022]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[width - 0.022, 0.05]} /><meshBasicMaterial map={scale} /></mesh>

      {/* Terminals */}
      {[-width / 2 + 0.03, width / 2 - 0.03].map((x, i) => (
        <group key={i} position={[x, height + 0.015, length / 2 - 0.04]}>
          <mesh castShadow>
            <cylinderGeometry args={[0.007, 0.007, 0.026, 16]} />
            <meshStandardMaterial color="#e2b76a" metalness={0.55} roughness={0.28} />
          </mesh>
          <mesh position={[0, 0.012, 0]} castShadow>
            <cylinderGeometry args={[0.011, 0.011, 0.012, 18]} />
            <meshStandardMaterial color="#f1c97c" metalness={0.55} roughness={0.3} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

/**
 * Realistic One-Way Plug Key.
 */
export function PlugKey3D({
  pos,
  closed = true,
}: {
  pos: [number, number, number];
  closed?: boolean;
}) {
  const wood = useMemo(makeWoodGrain, []);
  useEffect(() => () => wood.dispose(), [wood]);
  return (
    <group position={pos}>
      <RoundedBox args={[0.14, 0.036, 0.086]} radius={0.004} smoothness={4} position={[0, 0.018, 0]} castShadow receiveShadow><meshStandardMaterial map={wood} roughness={0.7} /></RoundedBox>
      <mesh position={[0, 0.004, 0.044]}><boxGeometry args={[0.151, 0.007, 0.004]} /><meshStandardMaterial color="#9f734a" roughness={0.6} /></mesh>
      <RoundedBox args={[0.124, 0.004, 0.068]} radius={0.002} smoothness={3} position={[0, 0.039, 0]}><meshStandardMaterial color="#313331" metalness={0.12} roughness={0.45} /></RoundedBox>
      {[-0.029, 0.029].map((x) => <group key={`contact-${x}`}>
        <RoundedBox args={[0.047, 0.011, 0.047]} radius={0.002} smoothness={3} position={[x, 0.047, 0]} castShadow><meshStandardMaterial color="#dfb15d" metalness={0.6} roughness={0.26} /></RoundedBox>
        <mesh position={[x, 0.053, -0.014]}><cylinderGeometry args={[0.004, 0.004, 0.002, 18]} /><meshStandardMaterial color="#917039" metalness={0.7} roughness={0.28} /></mesh>
      </group>)}
      {[-0.036, 0.036].map((x) => <group key={`binding-${x}`} position={[x, 0.051, 0.012]}>
        <mesh castShadow><cylinderGeometry args={[0.005, 0.005, 0.016, 20]} /><meshStandardMaterial color="#c99b48" metalness={0.74} roughness={0.26} /></mesh>
        <mesh position={[0, 0.009, 0]} castShadow><cylinderGeometry args={[0.008, 0.008, 0.004, 20]} /><meshStandardMaterial color="#f0c778" metalness={0.64} roughness={0.26} /></mesh>
      </group>)}
      <mesh position={[0, 0.048, 0]} rotation={[-Math.PI / 2, 0, 0]}><torusGeometry args={[0.0085, 0.002, 8, 24]} /><meshStandardMaterial color="#6a5230" metalness={0.5} roughness={0.34} /></mesh>
      <group position={[0, closed ? 0.055 : 0.058, closed ? 0 : -0.029]}>
        {closed && <mesh position={[0, -0.002, 0]} castShadow><boxGeometry args={[0.024, 0.004, 0.013]} /><meshStandardMaterial color="#e6ba6a" metalness={0.64} roughness={0.26} /></mesh>}
        <mesh position={[0, 0.007, 0]} castShadow><cylinderGeometry args={[0.005, 0.005, 0.018, 18]} /><meshStandardMaterial color="#d5ab64" metalness={0.66} roughness={0.26} /></mesh>
        <RoundedBox args={[0.019, 0.016, 0.018]} radius={0.005} smoothness={4} position={[0, 0.019, 0]} castShadow><meshStandardMaterial color="#1b1d1c" roughness={0.44} /></RoundedBox>
      </group>
      {[-0.059, 0.059].flatMap((x) => [-0.031, 0.031].map((z) => <mesh key={`${x}-${z}`} position={[x, 0.042, z]}><cylinderGeometry args={[0.002, 0.002, 0.002, 10]} /><meshStandardMaterial color="#d2d5d1" metalness={0.8} roughness={0.26} /></mesh>))}
    </group>
  );
}
