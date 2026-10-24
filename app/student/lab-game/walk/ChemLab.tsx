"use client";

/**
 * Chemistry-lab equipment for the first-person scene:
 *   • wall shelves packed with chemical bottles + flasks
 *   • a sink on the bench
 *   • a tripod + Bunsen "stove" with a toggleable flame (F)
 *   • a fire extinguisher (pickable, and its spray puts the flame out)
 *
 * Interaction state (stoveOn / holding / spraying) is owned by the scene and
 * passed in; this module is the visuals + the flame/spray animation.
 */

import { Suspense, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { RoundedBox, useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { BlueGlass, AmberGlass, getLabelTexture, HX, HZ, LAB_BOARD_SURFACE } from "../_scene/LabRoom";

// Procedural flame texture: a flame-shaped RGBA gradient (white-hot core →
// yellow → orange → red → transparent tips). Billboarded + additive = fire.
function makeFlameTexture(): THREE.Texture {
  const w = 128;
  const h = 256;
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const ctx = c.getContext("2d")!;
  const cx = w / 2;
  const grad = ctx.createLinearGradient(0, h, 0, 0);
  grad.addColorStop(0.0, "rgba(255,255,220,1)");
  grad.addColorStop(0.2, "rgba(255,205,70,1)");
  grad.addColorStop(0.5, "rgba(255,120,20,0.92)");
  grad.addColorStop(0.8, "rgba(200,35,10,0.5)");
  grad.addColorStop(1.0, "rgba(120,10,0,0)");
  // Slim candle/Bunsen flame: narrow at the base (from the tube), bulges a
  // little, tapers to a pointed tip.
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.moveTo(cx - 22, h);
  ctx.bezierCurveTo(cx - 30, h * 0.74, cx - 22, h * 0.52, cx - 12, h * 0.36);
  ctx.bezierCurveTo(cx - 6, h * 0.24, cx - 9, h * 0.15, cx - 3, h * 0.05);
  ctx.quadraticCurveTo(cx, -3, cx + 3, h * 0.05);
  ctx.bezierCurveTo(cx + 9, h * 0.15, cx + 6, h * 0.24, cx + 12, h * 0.36);
  ctx.bezierCurveTo(cx + 22, h * 0.52, cx + 30, h * 0.74, cx + 22, h);
  ctx.closePath();
  ctx.fill();
  // brighter inner core (slim)
  const g2 = ctx.createLinearGradient(0, h, 0, h * 0.2);
  g2.addColorStop(0, "rgba(255,255,255,0.95)");
  g2.addColorStop(0.5, "rgba(255,225,130,0.8)");
  g2.addColorStop(1, "rgba(255,150,40,0)");
  ctx.fillStyle = g2;
  ctx.beginPath();
  ctx.ellipse(cx, h * 0.72, 8, h * 0.24, 0, 0, Math.PI * 2);
  ctx.fill();
  const tex = new THREE.CanvasTexture(c);
  return tex;
}

// Fire-extinguisher label texture: warning triangle + text.
function makeExtLabelTexture(): THREE.Texture {
  const w = 256;
  const h = 300;
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = "#f6f6f2";
  ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = "#d33a2a";
  ctx.lineWidth = 8;
  ctx.strokeRect(6, 6, w - 12, h - 12);
  // warning triangle
  const cx = w / 2;
  ctx.fillStyle = "#f2b90c";
  ctx.beginPath();
  ctx.moveTo(cx, 40);
  ctx.lineTo(cx + 52, 130);
  ctx.lineTo(cx - 52, 130);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = "#1a1a1a";
  ctx.lineWidth = 5;
  ctx.stroke();
  ctx.fillStyle = "#1a1a1a";
  ctx.font = "bold 62px system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("!", cx, 122);
  // text
  ctx.fillStyle = "#b71c1c";
  ctx.font = "bold 28px system-ui, sans-serif";
  ctx.fillText("FIRE", cx, 180);
  ctx.fillText("EXTINGUISHER", cx, 212);
  ctx.strokeStyle = "#cbcbc6";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(30, 240); ctx.lineTo(w - 30, 240);
  ctx.moveTo(40, 262); ctx.lineTo(w - 40, 262);
  ctx.stroke();
  const tex = new THREE.CanvasTexture(c);
  tex.anisotropy = 4;
  return tex;
}
let extLabelTex: THREE.Texture | null = null;
function getExtLabelTex() {
  if (!extLabelTex) extLabelTex = makeExtLabelTexture();
  return extLabelTex;
}

// World anchors the scene uses for proximity checks.
export const STOVE = new THREE.Vector3(1.2, 1.08, 0.1);
export const EXT = new THREE.Vector3(-4.2, 1.1, -HZ + 0.25); // mounted on back wall

// Real chemical reagents — each bottle gets a name + matching liquid colour.
const REAGENTS: { name: string; color: string }[] = [
  { name: "HCl", color: "#efe3c0" },
  { name: "NaOH", color: "#8fd15a" },
  { name: "H₂SO₄", color: "#e9c94a" },
  { name: "HNO₃", color: "#f0b36a" },
  { name: "Ethanol", color: "#e7e2cf" },
  { name: "CuSO₄", color: "#3f8fd6" },
  { name: "KMnO₄", color: "#7a2fb0" },
  { name: "FeCl₃", color: "#c47a2f" },
  { name: "NH₃", color: "#cfe3f0" },
  { name: "AgNO₃", color: "#d8d8dc" },
  { name: "Na₂CO₃", color: "#eae7dd" },
  { name: "CH₃COOH", color: "#ecd9a0" },
  { name: "KI", color: "#e0c93f" },
  { name: "BaCl₂", color: "#dbe7ef" },
];

// Lightweight shelf bottle (fewer meshes than MediaBottle) so we can pack
// hundreds without tanking the frame rate. Same silhouette + black cap + a
// flat cached label facing +z.
const LB_R = 0.13;
const LB_H = 0.5;
const lightProfile = [
  [0.001, 0],
  [LB_R * 0.6, 0],
  [LB_R * 0.92, 0.02],
  [LB_R, 0.05],
  [LB_R, LB_H],
  [LB_R * 0.84, LB_H + 0.1],
  [LB_R * 0.45, LB_H + 0.2],
  [0.05, LB_H + 0.27],
  [0.05, LB_H + 0.36],
].map(([x, y]) => new THREE.Vector2(x, y));

function LightBottle({ color, fill, label }: { color: string; fill: number; label: string }) {
  const tex = useMemo(() => getLabelTexture(label, color), [label, color]);
  return (
    <group>
      {/* dark amber reagent-bottle glass */}
      <mesh>
        <latheGeometry args={[lightProfile, 18]} />
        <AmberGlass />
      </mesh>
      <mesh position={[0, (LB_H * fill) / 2 + 0.02, 0]}>
        <cylinderGeometry args={[LB_R - 0.01, LB_R - 0.01, LB_H * fill, 14]} />
        <meshStandardMaterial color="#3a1c07" roughness={0.35} />
      </mesh>
      {/* black cap */}
      <mesh position={[0, LB_H + 0.42, 0]}>
        <cylinderGeometry args={[0.058, 0.058, 0.12, 16]} />
        <meshStandardMaterial color="#161616" roughness={0.5} />
      </mesh>
      {/* curved label wrapped on the front of the bottle (reads as stuck-on) */}
      <mesh position={[0, LB_H * 0.42, 0]}>
        <cylinderGeometry args={[LB_R + 0.004, LB_R + 0.004, 0.22, 24, 1, true, -0.95, 1.9]} />
        <meshStandardMaterial map={tex} roughness={0.7} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

// Side-wall glass shelves hold the reagents in the full walk-through lab.
// `side` = +1 for the right wall (x=+HX), -1 for the left (x=-HX).
function ChemWall({ side, skipZ = [] }: { side: 1 | -1; skipZ?: number[] }) {
  const depth = 0.6; // how far the unit projects from the wall
  const wallX = side * (HX - 0.02);
  const rotY = -side * (Math.PI / 2); // face the bottles into the room
  const zLen = HZ * 2 - 0.3; // span the wall corner-to-corner
  const shelfW = depth * 0.72;
  const bottleX = side * (HX - shelfW / 2 - 0.02);

  // Bottle packing along z — very dense (~1px gap) so the wall reads as packed.
  const bScale = 0.6;
  const bStep = 0.18;
  const half = zLen / 2 - 0.22;
  const zs: number[] = [];
  for (let z = -half; z <= half; z += bStep) zs.push(z);

  const shelfYs = [1.6, 2.35, 3.1];

  return (
    <group>
      {shelfYs.map((y, si) => (
        <group key={si}>
          {/* glass shelf slab */}
          <mesh position={[bottleX, y - 0.03, 0]}>
            <boxGeometry args={[shelfW, 0.02, zLen]} />
            <meshStandardMaterial color="#cfeaf2" transparent opacity={0.28} roughness={0.08} metalness={0.1} />
          </mesh>
          {/* metal shelf brackets */}
          {[-zLen / 2 + 0.3, 0, zLen / 2 - 0.3].map((bz, bi) => (
            <mesh key={bi} position={[wallX - side * 0.06, y - 0.12, bz]}>
              <boxGeometry args={[0.03, 0.2, 0.04]} />
              <meshStandardMaterial color="#9a9da1" metalness={0.6} roughness={0.4} />
            </mesh>
          ))}
          {/* packed reagent bottles (bottom shelf leaves gaps for reserved slots) */}
          {zs.map((z, i) => {
            if (si === 0 && skipZ.some((sz) => Math.abs(sz - z) < 0.14)) return null;
            const r = REAGENTS[(i + si * 3) % REAGENTS.length];
            return (
              <group key={i} position={[bottleX, y, z]} rotation={[0, rotY, 0]} scale={bScale}>
                <LightBottle color={r.color} fill={[0.7, 0.75, 0.8, 0.9, 0.95][(i + si) % 5]} label={r.name} />
              </group>
            );
          })}
        </group>
      ))}
    </group>
  );
}

// Notice board texture — app logo + Poppins font (matches the app). The logo
// and fonts load asynchronously, so we redraw and flag the texture when ready.
function makeNoticeTexture(): THREE.Texture {
  const w = 512;
  const h = 400;
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const ctx = c.getContext("2d")!;
  const tex = new THREE.CanvasTexture(c);
  tex.anisotropy = 4;

  const logo = new Image();
  let logoReady = false;
  const FONT = "Poppins, system-ui, sans-serif";

  const draw = () => {
    ctx.fillStyle = LAB_BOARD_SURFACE;
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = "#005f02";
    ctx.fillRect(0, 0, w, 12);
    ctx.fillRect(0, h - 12, w, 12);
    // app logo, centred near the top
    if (logoReady) {
      const lw = 220;
      const lh = (logo.height / logo.width) * lw || 70;
      ctx.drawImage(logo, w / 2 - lw / 2, 20, lw, lh);
    }
    ctx.textAlign = "center";
    ctx.fillStyle = "#0f2e12";
    ctx.font = `700 58px ${FONT}`;
    ctx.fillText("Virtual Lab", w / 2, 210);
    ctx.fillStyle = "#444";
    ctx.font = `500 22px ${FONT}`;
    ctx.fillText("Developed by Muhammad Taha Talib", w / 2, 290);
    ctx.font = `400 20px ${FONT}`;
    ctx.fillStyle = "#666";
    ctx.fillText("Powered by MacroPulse Systems", w / 2, 326);
    tex.needsUpdate = true;
  };

  draw();
  logo.onload = () => {
    logoReady = true;
    draw();
  };
  logo.src = "/exboard-logo-transparent.png";
  if (typeof document !== "undefined" && document.fonts?.ready) {
    document.fonts.ready.then(draw).catch(() => {});
  }
  return tex;
}

// Glowing "EXIT" sign text (white on transparent).
function makeExitTexture(): THREE.Texture {
  const c = document.createElement("canvas");
  c.width = 256;
  c.height = 72;
  const ctx = c.getContext("2d")!;
  ctx.clearRect(0, 0, 256, 72);
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 54px system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("EXIT", 128, 40);
  const tex = new THREE.CanvasTexture(c);
  tex.anisotropy = 4;
  return tex;
}
let exitTex: THREE.Texture | null = null;
function getExitTex() {
  if (!exitTex) exitTex = makeExitTexture();
  return exitTex;
}

// Front wall (with the AC, at -HZ): the branded notice board on the left.
// Exit door stays on the opposite wall (+HZ).
function BackWallFeatures() {
  const wz = HZ - 0.02;
  const notice = useMemo(makeNoticeTexture, []);
  return (
    <group>
      {/* Branded notice board — on the AC wall (-HZ), upper-left corner, facing +z */}
      <group position={[-5, 3.6, -HZ + 0.07]}>
        <mesh><boxGeometry args={[2.4, 1.75, 0.06]} /><meshStandardMaterial color="#111111" roughness={0.5} /></mesh>
        <mesh position={[0, 0, 0.035]}><planeGeometry args={[2.2, 1.58]} /><meshStandardMaterial map={notice} roughness={0.8} /></mesh>
      </group>

      {/* Glass exit door (on the +HZ wall) — wider double door */}
      <group position={[3.3, 0, wz]} rotation={[0, Math.PI, 0]}>
        {/* frame */}
        <mesh position={[0, 1.4, 0]}><boxGeometry args={[2.1, 2.8, 0.12]} /><meshStandardMaterial color="#3a3d41" metalness={0.5} roughness={0.4} /></mesh>
        {/* two glass panels */}
        <mesh position={[-0.52, 1.4, 0.03]}><boxGeometry args={[0.94, 2.6, 0.04]} /><meshStandardMaterial color="#bcd6e6" transparent opacity={0.35} roughness={0.05} metalness={0.1} /></mesh>
        <mesh position={[0.52, 1.4, 0.03]}><boxGeometry args={[0.94, 2.6, 0.04]} /><meshStandardMaterial color="#bcd6e6" transparent opacity={0.35} roughness={0.05} metalness={0.1} /></mesh>
        {/* centre mullion */}
        <mesh position={[0, 1.4, 0.03]}><boxGeometry args={[0.05, 2.6, 0.05]} /><meshStandardMaterial color="#3a3d41" metalness={0.5} roughness={0.4} /></mesh>
        {/* push bars */}
        {[-0.2, 0.2].map((x, i) => (
          <mesh key={i} position={[x, 1.15, 0.08]}><boxGeometry args={[0.04, 0.55, 0.04]} /><meshStandardMaterial color="#cdd0d2" metalness={0.8} roughness={0.3} /></mesh>
        ))}
        {/* EXIT sign above (green with white EXIT text) */}
        <mesh position={[0, 2.95, 0.05]}><boxGeometry args={[0.8, 0.26, 0.06]} /><meshStandardMaterial color="#0f7a1e" emissive="#0f7a1e" emissiveIntensity={0.4} /></mesh>
        <mesh position={[0, 2.95, 0.082]}><planeGeometry args={[0.7, 0.18]} /><meshBasicMaterial map={getExitTex()} transparent toneMapped={false} /></mesh>
      </group>
    </group>
  );
}

// Real imported skeleton model (Poly Pizza, CC0), normalised to ~1.75m on a
// white base + chrome rod. Falls back to the procedural one while loading.
useGLTF.preload("/models/skeleton.glb");
function Skeleton({ position }: { position: [number, number, number] }) {
  const { scene } = useGLTF("/models/skeleton.glb");
  const model = useMemo(() => {
    const c = scene.clone(true);
    const box = new THREE.Box3().setFromObject(c);
    const size = new THREE.Vector3();
    box.getSize(size);
    const s = 2.15 / (size.y || 1);
    c.traverse((o) => {
      if ((o as THREE.Mesh).isMesh) (o as THREE.Mesh).castShadow = true;
    });
    return { c, s, y: -box.min.y * s };
  }, [scene]);
  return (
    <group position={position}>
      {/* white rectangular base + chrome support rod */}
      <mesh position={[0, 0.02, 0]}><boxGeometry args={[0.5, 0.04, 0.32]} /><meshStandardMaterial color="#f2f2f0" roughness={0.6} /></mesh>
      <mesh position={[0, 0.95, -0.13]}><cylinderGeometry args={[0.012, 0.012, 1.9, 12]} /><meshStandardMaterial color="#c7ccd0" metalness={0.8} roughness={0.25} /></mesh>
      <primitive object={model.c} scale={model.s} position={[0, model.y + 0.04, 0]} />
    </group>
  );
}

// Procedural skeleton (kept as a fallback while the model loads).
function SkeletonFallback({ position }: { position: [number, number, number] }) {
  const bone = <meshStandardMaterial color="#f1ede2" roughness={0.55} metalness={0.02} />;
  const metal = <meshStandardMaterial color="#c7ccd0" metalness={0.8} roughness={0.25} />;
  const Leg = ({ x }: { x: number }) => (
    <group position={[x, 0, 0]}>
      <mesh position={[0, 0.03, 0.06]}>{/* foot */}<boxGeometry args={[0.09, 0.05, 0.18]} />{bone}</mesh>
      <mesh position={[0, 0.28, 0]}>{/* shin */}<capsuleGeometry args={[0.028, 0.42, 4, 10]} />{bone}</mesh>
      <mesh position={[0, 0.5, 0]}><sphereGeometry args={[0.04, 12, 12]} />{bone}</mesh>{/* knee */}
      <mesh position={[0, 0.72, 0]}>{/* thigh */}<capsuleGeometry args={[0.034, 0.4, 4, 10]} />{bone}</mesh>
    </group>
  );
  const Arm = ({ x }: { x: number }) => (
    <group position={[x, 1.44, 0]}>
      <mesh position={[0, 0, 0]}><sphereGeometry args={[0.04, 12, 12]} />{bone}</mesh>{/* shoulder */}
      <mesh position={[0, -0.17, 0]}>{/* upper arm */}<capsuleGeometry args={[0.024, 0.28, 4, 10]} />{bone}</mesh>
      <mesh position={[0, -0.34, 0]}><sphereGeometry args={[0.03, 10, 10]} />{bone}</mesh>{/* elbow */}
      <mesh position={[0, -0.5, 0]}>{/* forearm */}<capsuleGeometry args={[0.02, 0.26, 4, 10]} />{bone}</mesh>
      {/* hand: palm + finger stubs */}
      <mesh position={[0, -0.64, 0.01]}><boxGeometry args={[0.045, 0.05, 0.02]} />{bone}</mesh>
      {[-0.014, 0, 0.014].map((fx, i) => (
        <mesh key={i} position={[fx, -0.69, 0.01]}><capsuleGeometry args={[0.006, 0.03, 4, 6]} />{bone}</mesh>
      ))}
    </group>
  );
  return (
    <group position={position}>
      {/* white rectangular base + chrome support rod (like the reference) */}
      <mesh position={[0, 0.02, 0]}><boxGeometry args={[0.5, 0.04, 0.32]} /><meshStandardMaterial color="#f2f2f0" roughness={0.6} /></mesh>
      <mesh position={[0, 0.95, -0.13]}><cylinderGeometry args={[0.012, 0.012, 1.9, 12]} />{metal}</mesh>

      <Leg x={-0.09} />
      <Leg x={0.09} />
      {/* pelvis */}
      <mesh position={[0, 0.95, 0]} rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[0.1, 0.03, 10, 20]} />{bone}</mesh>
      {/* spine */}
      {Array.from({ length: 9 }, (_, i) => (
        <mesh key={i} position={[0, 1.0 + i * 0.05, -0.02]}><cylinderGeometry args={[0.026, 0.026, 0.03, 10]} />{bone}</mesh>
      ))}
      {/* ribcage — tapered rings */}
      {[0, 1, 2, 3, 4].map((i) => (
        <mesh key={i} position={[0, 1.08 + i * 0.07, 0.0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.13 - i * 0.012, 0.011, 8, 24]} />
          {bone}
        </mesh>
      ))}
      {/* sternum */}
      <mesh position={[0, 1.2, 0.115]}><boxGeometry args={[0.03, 0.2, 0.02]} />{bone}</mesh>
      {/* clavicles (spine top → shoulders) */}
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * 0.09, 1.44, 0.02]} rotation={[0, 0, s * 1.3]}><capsuleGeometry args={[0.012, 0.14, 4, 8]} />{bone}</mesh>
      ))}
      <Arm x={-0.19} />
      <Arm x={0.19} />
      {/* neck */}
      <mesh position={[0, 1.5, -0.02]}><cylinderGeometry args={[0.028, 0.028, 0.1, 10]} />{bone}</mesh>
      {/* skull: cranium + jaw + teeth + sockets */}
      <mesh position={[0, 1.67, 0]} scale={[1, 1.05, 1.02]}><sphereGeometry args={[0.11, 22, 20]} />{bone}</mesh>
      <mesh position={[0, 1.585, 0.045]}><boxGeometry args={[0.12, 0.06, 0.1]} />{bone}</mesh>{/* jaw */}
      {[-0.045, 0.045].map((ex, i) => (
        <mesh key={i} position={[ex, 1.68, 0.088]}><sphereGeometry args={[0.026, 12, 12]} /><meshStandardMaterial color="#2b2b2b" roughness={0.9} /></mesh>
      ))}
      <mesh position={[0, 1.635, 0.1]}><coneGeometry args={[0.018, 0.035, 4]} /><meshStandardMaterial color="#2b2b2b" /></mesh>{/* nasal */}
      {[-0.03, -0.01, 0.01, 0.03].map((tx, i) => (
        <mesh key={i} position={[tx, 1.565, 0.093]}><boxGeometry args={[0.012, 0.02, 0.008]} />{bone}</mesh>
      ))}
    </group>
  );
}

// Glass display cabinet holding the skeleton, with a dark back panel so the
// pale bones stand out against the wall.
function SkeletonCase({ position }: { position: [number, number, number] }) {
  const W = 1.2;
  const D = 0.8;
  const H = 2.5;
  const frame = <meshStandardMaterial color="#2b2f33" metalness={0.4} roughness={0.5} />;
  const glass = <meshStandardMaterial color="#cfe0ea" transparent opacity={0.16} roughness={0.05} metalness={0.1} side={THREE.DoubleSide} />;
  return (
    <group position={position}>
      {/* plinth base */}
      <mesh position={[0, 0.06, 0]} castShadow receiveShadow><boxGeometry args={[W + 0.1, 0.12, D + 0.1]} /><meshStandardMaterial color="#3a3d41" roughness={0.6} /></mesh>
      {/* dark back panel (contrast) */}
      <mesh position={[0, H / 2 + 0.12, -D / 2]}><boxGeometry args={[W, H, 0.03]} /><meshStandardMaterial color="#39505f" roughness={0.7} /></mesh>
      {/* glass sides + front + top */}
      <mesh position={[-W / 2, H / 2 + 0.12, 0]} rotation={[0, Math.PI / 2, 0]}><planeGeometry args={[D, H]} />{glass}</mesh>
      <mesh position={[W / 2, H / 2 + 0.12, 0]} rotation={[0, Math.PI / 2, 0]}><planeGeometry args={[D, H]} />{glass}</mesh>
      <mesh position={[0, H / 2 + 0.12, D / 2]}><planeGeometry args={[W, H]} />{glass}</mesh>
      <mesh position={[0, H + 0.12, 0]} rotation={[Math.PI / 2, 0, 0]}><planeGeometry args={[W, D]} />{glass}</mesh>
      {/* corner posts */}
      {[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([sx, sz], i) => (
        <mesh key={i} position={[(sx * W) / 2, H / 2 + 0.12, (sz * D) / 2]}><boxGeometry args={[0.04, H, 0.04]} />{frame}</mesh>
      ))}
      {/* top + bottom frame rails */}
      {[0.12, H + 0.12].map((y, i) => (
        <mesh key={i} position={[0, y, 0]}><boxGeometry args={[W + 0.04, 0.05, D + 0.04]} />{frame}</mesh>
      ))}
      {/* the skeleton inside */}
      <Suspense fallback={<SkeletonFallback position={[0, 0.12, 0]} />}>
        <Skeleton position={[0, 0.12, 0]} />
      </Suspense>
    </group>
  );
}

// Lightweight split AC: one rounded casing with a recessed outlet and flap.
export function AirConditioner() {
  return (
    <group position={[0, 4.3, -HZ + 0.14]}>
      <RoundedBox args={[2.2, 0.6, 0.28]} radius={0.065} smoothness={3} castShadow>
        <meshStandardMaterial color="#e9eeec" roughness={0.56} metalness={0.03} />
      </RoundedBox>
      {/* Shallow front panel and separation line, like a wall-mounted split unit. */}
      <mesh position={[0, 0.07, 0.146]}>
        <boxGeometry args={[2.02, 0.34, 0.012]} />
        <meshStandardMaterial color="#f6f8f6" roughness={0.62} />
      </mesh>
      <mesh position={[0, -0.115, 0.153]}>
        <boxGeometry args={[1.96, 0.008, 0.012]} />
        <meshStandardMaterial color="#b6c0bd" roughness={0.8} />
      </mesh>
      {/* Dark interior is partly covered by the open, angled air-direction flap. */}
      <mesh position={[0, -0.22, 0.15]}>
        <boxGeometry args={[1.98, 0.09, 0.014]} />
        <meshStandardMaterial color="#2e3a3b" roughness={0.8} />
      </mesh>
      <mesh position={[0, -0.255, 0.177]} rotation={[-0.22, 0, 0]}>
        <boxGeometry args={[1.94, 0.027, 0.075]} />
        <meshStandardMaterial color="#d6ddda" roughness={0.65} />
      </mesh>
      <mesh position={[0.79, -0.07, 0.16]}>
        <sphereGeometry args={[0.012, 8, 6]} />
        <meshStandardMaterial color="#59b97c" emissive="#2c8e4e" emissiveIntensity={0.3} />
      </mesh>
    </group>
  );
}

// Raised stainless basin with a stone drainboard and a pull-down faucet.
// The basin floor sits above the shared worktop, so its depth remains visible
// without cutting a hole in every practical's bench geometry.
function Sink({ waterOn }: { waterOn: boolean }) {
  // ============================================================
  // REALISTIC STAINLESS-STEEL MATERIALS
  // ============================================================

  // Main stainless-steel countertop / drainboard.
  // Slightly darker than chrome so the faucet remains visible.
  // Main sink / counter
const stainlessSteel = {
  color: "#B8BDBD",
  metalness: 0.72,
  roughness: 0.24,
};

// Sink walls / rim
const sinkSteel = {
  color: "#C8CDCD",
  metalness: 0.76,
  roughness: 0.21,
};

// Inside basin — slightly darker
const basinSteel = {
  color: "#969E9E",
  metalness: 0.68,
  roughness: 0.29,
};

// Faucet
const chrome = {
  color: "#E1E4E3",
  metalness: 0.82,
  roughness: 0.14,
};

// Spring
const springChrome = {
  color: "#D0D5D4",
  metalness: 0.8,
  roughness: 0.16,
};

// Drain ring
const drainSteel = {
  color: "#E4E7E6",
  metalness: 0.84,
  roughness: 0.12,
};

// Only the drain opening should be dark
const drainDark = {
  color: "#303738",
  metalness: 0.2,
  roughness: 0.5,
};

  // ============================================================
  // FAUCET SHAPE
  // ============================================================

  const spoutTip = useMemo(
    () => new THREE.Vector3(-0.13, 0.3, 0.02),
    [],
  );

  // Curved commercial gooseneck faucet.
  const curve = useMemo(
    () =>
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(0.2, 0.06, -0.16),
        new THREE.Vector3(0.2, 0.34, -0.16),
        new THREE.Vector3(0.12, 0.48, -0.1),
        new THREE.Vector3(-0.04, 0.47, -0.02),
        new THREE.Vector3(-0.13, 0.4, 0.02),
        spoutTip,
      ]),
    [spoutTip],
  );

  return (
    <group position={[-1.5, 1.09, 0.1]}>
      {/* ========================================================
          STAINLESS-STEEL COUNTER / DRAINBOARD
      ======================================================== */}

      {/* Right side */}
      <mesh
        position={[0.18, 0.035, 0]}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[0.4, 0.05, 0.56]} />

        <meshStandardMaterial
          color={stainlessSteel.color}
          metalness={stainlessSteel.metalness}
          roughness={stainlessSteel.roughness}
        />
      </mesh>

      {/* Section underneath the sink */}
      <mesh
        position={[-0.14, 0.035, 0]}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[0.44, 0.05, 0.56]} />

        <meshStandardMaterial
          color={stainlessSteel.color}
          metalness={stainlessSteel.metalness}
          roughness={stainlessSteel.roughness}
        />
      </mesh>

      {/* ========================================================
          SINK BASIN
      ======================================================== */}

      <group position={[-0.14, 0, 0]}>
        {/* ------------------------------------------------------
            BASIN FLOOR
        ------------------------------------------------------ */}

        <mesh
          position={[0, 0.068, 0]}
          receiveShadow
        >
          <boxGeometry args={[0.36, 0.016, 0.46]} />

          <meshStandardMaterial
            color={basinSteel.color}
            metalness={basinSteel.metalness}
            roughness={basinSteel.roughness}
          />
        </mesh>

        {/* ------------------------------------------------------
            BASIN WALLS / RIM
        ------------------------------------------------------ */}

        {[
          [0, 0.105, -0.245, 0.42, 0.1, 0.035],
          [0, 0.105, 0.245, 0.42, 0.1, 0.035],
          [-0.195, 0.105, 0, 0.035, 0.1, 0.46],
          [0.195, 0.105, 0, 0.035, 0.1, 0.46],
        ].map((b, i) => (
          <mesh
            key={i}
            position={[b[0], b[1], b[2]]}
            castShadow
            receiveShadow
          >
            <boxGeometry
              args={[b[3], b[4], b[5]]}
            />

            <meshStandardMaterial
              color={sinkSteel.color}
              metalness={sinkSteel.metalness}
              roughness={sinkSteel.roughness}
            />
          </mesh>
        ))}

        {/* ======================================================
            DRAIN
        ====================================================== */}

        {/* Polished steel outer drain ring */}
        <mesh position={[0, 0.08, 0]}>
          <cylinderGeometry
            args={[
              0.043,
              0.043,
              0.01,
              24,
            ]}
          />

          <meshStandardMaterial
            color={drainSteel.color}
            metalness={drainSteel.metalness}
            roughness={drainSteel.roughness}
          />
        </mesh>

        {/* Dark drain opening */}
        <mesh position={[0, 0.087, 0]}>
          <cylinderGeometry
            args={[
              0.025,
              0.025,
              0.004,
              24,
            ]}
          />

          <meshStandardMaterial
            color={drainDark.color}
            metalness={drainDark.metalness}
            roughness={drainDark.roughness}
          />
        </mesh>
      </group>

      {/* ========================================================
          FAUCET BASE
      ======================================================== */}

      <mesh
        position={[0.2, 0.05, -0.16]}
        castShadow
        receiveShadow
      >
        <cylinderGeometry
          args={[
            0.035,
            0.04,
            0.05,
            24,
          ]}
        />

        <meshStandardMaterial
          color={chrome.color}
          metalness={chrome.metalness}
          roughness={chrome.roughness}
        />
      </mesh>

      {/* ========================================================
          CURVED CHROME FAUCET
      ======================================================== */}

      <mesh castShadow receiveShadow>
        <tubeGeometry
          args={[
            curve,
            64,
            0.014,
            16,
          ]}
        />

        <meshStandardMaterial
          color={chrome.color}
          metalness={chrome.metalness}
          roughness={chrome.roughness}
        />
      </mesh>

      {/* ========================================================
          SPRING COILS
      ======================================================== */}

      {Array.from({ length: 9 }, (_, i) => (
        <mesh
          key={i}
          position={[
            0.2,
            0.12 + i * 0.024,
            -0.16,
          ]}
          rotation={[
            Math.PI / 2,
            0,
            0,
          ]}
          castShadow
          receiveShadow
        >
          <torusGeometry
            args={[
              0.028,
              0.006,
              8,
              24,
            ]}
          />

          <meshStandardMaterial
            color={springChrome.color}
            metalness={springChrome.metalness}
            roughness={springChrome.roughness}
          />
        </mesh>
      ))}

      {/* ========================================================
          SPOUT / NOZZLE
      ======================================================== */}

      <mesh
        position={[
          -0.13,
          0.27,
          0.02,
        ]}
        castShadow
        receiveShadow
      >
        <cylinderGeometry
          args={[
            0.022,
            0.018,
            0.06,
            24,
          ]}
        />

        <meshStandardMaterial
          color={chrome.color}
          metalness={chrome.metalness}
          roughness={chrome.roughness}
        />
      </mesh>

      {/* ========================================================
          FAUCET HANDLE CONNECTION
      ======================================================== */}

      <mesh
        position={[
          0.215,
          0.078,
          -0.16,
        ]}
        castShadow
      >
        <cylinderGeometry
          args={[
            0.023,
            0.023,
            0.025,
            16,
          ]}
        />

        <meshStandardMaterial
          color={chrome.color}
          metalness={chrome.metalness}
          roughness={chrome.roughness}
        />
      </mesh>

      {/* ========================================================
          FAUCET HANDLE
      ======================================================== */}

      <mesh
        position={[
          0.27,
          0.09,
          -0.16,
        ]}
        rotation={[
          0,
          0,
          -0.12,
        ]}
        castShadow
      >
        <boxGeometry
          args={[
            0.12,
            0.018,
            0.035,
          ]}
        />

        <meshStandardMaterial
          color={chrome.color}
          metalness={chrome.metalness}
          roughness={chrome.roughness}
        />
      </mesh>

      {/* ========================================================
          RUNNING WATER
      ======================================================== */}

      {waterOn && (
        <Water tip={spoutTip} />
      )}
    </group>
  );
}


// ============================================================
// WATER
// ============================================================

function Water({
  tip,
}: {
  tip: THREE.Vector3;
}) {
  const splash =
    useRef<THREE.Mesh>(null);

  const basinY = 0.08;

  const streamH =
    tip.y - basinY;

  useFrame((state) => {
    if (splash.current) {
      const scale =
        1 +
        Math.sin(
          state.clock.elapsedTime * 18,
        ) *
          0.25;

      splash.current.scale.set(
        scale,
        scale,
        1,
      );
    }
  });

  return (
    <group>
      {/* ========================================================
          WATER STREAM
      ======================================================== */}

      <mesh
        position={[
          tip.x,
          basinY + streamH / 2,
          tip.z,
        ]}
      >
        <cylinderGeometry
          args={[
            0.008,
            0.013,
            streamH,
            12,
          ]}
        />

        <meshPhysicalMaterial
          color="#B7E7F3"
          transparent
          opacity={0.58}
          roughness={0.05}
          metalness={0}
          transmission={0.25}
          thickness={0.02}
        />
      </mesh>

      {/* ========================================================
          WATER SPLASH
      ======================================================== */}

      <mesh
        ref={splash}
        position={[
          tip.x,
          basinY + 0.005,
          tip.z,
        ]}
        rotation={[
          -Math.PI / 2,
          0,
          0,
        ]}
      >
        <ringGeometry
          args={[
            0.02,
            0.055,
            24,
          ]}
        />

        <meshPhysicalMaterial
          color="#D2F1F7"
          transparent
          opacity={0.45}
          roughness={0.04}
          metalness={0}
          transmission={0.3}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
}

// Realistic billboard flame (only when `on`). Two additive flame sprites that
// flicker independently, plus a warm point light.
function Flame({ on }: { on: boolean }) {
  const tex = useMemo(makeFlameTexture, []);
  const grp = useRef<THREE.Group>(null);
  const light = useRef<THREE.PointLight>(null);
  useFrame((s) => {
    const t = s.clock.elapsedTime;
    if (grp.current) grp.current.scale.set(1 + Math.sin(t * 17) * 0.06, 1 + Math.sin(t * 12) * 0.12, 1 + Math.cos(t * 15) * 0.06);
    if (light.current) light.current.intensity = 1.4 + Math.sin(t * 25) * 0.4;
  });
  if (!on) return null;
  // Crossed flame planes (two at 90°) give volume from ALL angles and root the
  // flame into the burner. The base sits just inside the barrel top (≈0.29) so
  // the opaque tube occludes it → the flame reads as coming from inside the pipe.
  const plane = (rotY: number, extra = false) => (
    <mesh rotation={[0, rotY, 0]} position={extra ? [0, -0.01, 0] : [0, 0, 0]}>
      <planeGeometry args={extra ? [0.09, 0.22] : [0.14, 0.3]} />
      <meshBasicMaterial
        map={tex}
        transparent
        depthWrite={false}
        opacity={extra ? 0.85 : 1}
        blending={extra ? THREE.AdditiveBlending : THREE.NormalBlending}
        side={THREE.DoubleSide}
        toneMapped={false}
      />
    </mesh>
  );
  return (
    <group position={[0, 0.42, 0]}>
      <pointLight ref={light} color="#ff8a2a" intensity={1.4} distance={2.8} decay={2} position={[0, 0, 0]} />
      <group ref={grp}>
        {plane(0)}
        {plane(Math.PI / 2)}
        {plane(0, true)}
        {plane(Math.PI / 2, true)}
      </group>
    </group>
  );
}

// Shared burner used by chemistry and the steam-heated physics apparatus.
export function BunsenBurner({ on }: { on: boolean }) {
  const metal = <meshStandardMaterial color="#1b1d1d" metalness={0.42} roughness={0.52} />;
  return (
    <group>
      <mesh position={[0, 0.02, 0]} castShadow>
        <cylinderGeometry args={[0.11, 0.14, 0.04, 20]} />
        <meshStandardMaterial color="#2b2e33" roughness={0.5} />
      </mesh>
      <mesh position={[0, 0.16, 0]} castShadow>
        <cylinderGeometry args={[0.028, 0.033, 0.26, 16]} />
        {metal}
      </mesh>
      <mesh position={[0, 0.285, 0]}><cylinderGeometry args={[0.034, 0.034, 0.026, 20]} />{metal}</mesh>
      <mesh position={[0.047, 0.07, 0]} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.014, 0.014, 0.095, 12]} />{metal}</mesh>
      <mesh position={[0, 0.14, 0]} rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[0.029, 0.006, 8, 20]} />{metal}</mesh>
      <Flame on={on} />
    </group>
  );
}

// Tripod + gauze + the shared Bunsen burner = the chemistry "stove".
export function StoveUnit({ on }: { on: boolean }) {
  const metal = <meshStandardMaterial color="#1b1d1d" metalness={0.42} roughness={0.52} />;
  return (
    <group>
      <BunsenBurner on={on} />
      {/* tripod ring + legs */}
      <mesh position={[0, 0.46, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.15, 0.01, 8, 24]} />
        {metal}
      </mesh>
      {[0, 2.1, 4.2].map((a, i) => (
        <mesh key={i} position={[Math.cos(a) * 0.14, 0.23, Math.sin(a) * 0.14]} castShadow>
          <cylinderGeometry args={[0.01, 0.01, 0.46, 8]} />
          {metal}
        </mesh>
      ))}
      {/* Open wire gauze: a real mesh lets the Bunsen flame show through,
          unlike the previous solid plate. */}
      <group position={[0, 0.47, 0]}>
        {[-0.14, 0.14].flatMap((edge) => [
          <mesh key={`x-${edge}`} position={[0, 0, edge]}><boxGeometry args={[0.29, 0.008, 0.008]} />{metal}</mesh>,
          <mesh key={`z-${edge}`} position={[edge, 0, 0]}><boxGeometry args={[0.008, 0.008, 0.29]} />{metal}</mesh>,
        ])}
        {Array.from({ length: 9 }, (_, i) => -0.11 + i * 0.0275).flatMap((offset, i) => [
          <mesh key={`wire-x-${i}`} position={[0, 0, offset]}><boxGeometry args={[0.27, 0.004, 0.004]} />{metal}</mesh>,
          <mesh key={`wire-z-${i}`} position={[offset, 0.002, 0]}><boxGeometry args={[0.004, 0.004, 0.27]} />{metal}</mesh>,
        ])}
      </group>
    </group>
  );
}

function Stove({ on }: { on: boolean }) {
  return <group position={[STOVE.x, STOVE.y, STOVE.z]}><StoveUnit on={on} /></group>;
}

// Realistic fire extinguisher mounted on the back wall (ref: red cylinder,
// black hose curving over the top to a nozzle, red lever, white label).
// Hidden once picked up.
function ExtinguisherStand({ visible }: { visible: boolean }) {
  const black = { color: "#1a1a1a", roughness: 0.55 };
  const red = { color: "#cf2222", roughness: 0.4, metalness: 0.15 };

  // Hose curving up from the valve, over the top, down the right side.
  const hose = useMemo(
    () =>
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(0.05, 0.62, 0.08),
        new THREE.Vector3(0.02, 0.78, 0.14),
        new THREE.Vector3(0.14, 0.86, 0.14),
        new THREE.Vector3(0.22, 0.74, 0.1),
        new THREE.Vector3(0.24, 0.5, 0.08),
        new THREE.Vector3(0.24, 0.2, 0.12),
      ]),
    [],
  );

  if (!visible) return null;
  return (
    <group position={[EXT.x, 0, EXT.z]}>
      {/* wall bracket */}
      <mesh position={[0, 0.45, -0.06]}>
        <boxGeometry args={[0.24, 0.06, 0.08]} />
        <meshStandardMaterial color="#2b2b2b" roughness={0.6} />
      </mesh>
      {/* red body */}
      <mesh position={[0, 0.4, 0.08]} castShadow>
        <cylinderGeometry args={[0.1, 0.1, 0.56, 24]} />
        <meshStandardMaterial {...red} />
      </mesh>
      {/* domed shoulder */}
      <mesh position={[0, 0.7, 0.08]} castShadow>
        <sphereGeometry args={[0.1, 20, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial {...red} />
      </mesh>
      {/* neck + valve body */}
      <mesh position={[0, 0.78, 0.08]}>
        <cylinderGeometry args={[0.03, 0.035, 0.06, 12]} />
        <meshStandardMaterial color="#b0b3b6" metalness={0.7} roughness={0.35} />
      </mesh>
      {/* red squeeze lever */}
      <mesh position={[0, 0.83, 0.08]} rotation={[0, 0, 0.15]}>
        <boxGeometry args={[0.14, 0.02, 0.03]} />
        <meshStandardMaterial {...red} />
      </mesh>
      {/* pressure gauge */}
      <mesh position={[-0.06, 0.76, 0.16]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.022, 0.022, 0.02, 14]} />
        <meshStandardMaterial color="#dfe2e4" metalness={0.5} roughness={0.4} />
      </mesh>
      {/* black hose over the top */}
      <mesh>
        <tubeGeometry args={[hose, 40, 0.014, 8]} />
        <meshStandardMaterial {...black} />
      </mesh>
      {/* nozzle at the hose end */}
      <mesh position={[0.24, 0.16, 0.12]}>
        <cylinderGeometry args={[0.018, 0.026, 0.08, 12]} />
        <meshStandardMaterial color="#8f9296" metalness={0.7} roughness={0.35} />
      </mesh>
      {/* curved instruction label wrapped on the red body (front-facing arc) */}
      <mesh position={[0, 0.36, 0.08]}>
        <cylinderGeometry args={[0.102, 0.102, 0.26, 28, 1, true, -0.85, 1.7]} />
        <meshStandardMaterial map={getExtLabelTex()} roughness={0.7} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

// ---- Lab instruments (empty graduated glassware) ---------------------------

// Graduation scale: transparent strip with dark tick marks + tiny numbers.
// Uses alphaTest so it renders in the opaque pass (no transparency flicker).
function makeGradTexture(): THREE.Texture {
  const w = 64;
  const h = 256;
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const ctx = c.getContext("2d")!;
  ctx.clearRect(0, 0, w, h);
  ctx.strokeStyle = "#3a3a3a";
  ctx.fillStyle = "#3a3a3a";
  ctx.font = "bold 15px system-ui, sans-serif";
  for (let i = 1; i <= 10; i++) {
    const y = h - (i / 10) * (h - 20) - 8;
    const long = i % 2 === 0;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(6, y);
    ctx.lineTo(long ? 30 : 20, y);
    ctx.stroke();
    if (long) ctx.fillText(String(i * 10), 33, y + 5);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.anisotropy = 4;
  return tex;
}

let gradTex: THREE.Texture | null = null;
function getGradTex() {
  if (!gradTex) gradTex = makeGradTexture();
  return gradTex;
}

// A vertical graduation decal wrapped on the front of a glass body.
function GradStrip({ r, h, y = 0 }: { r: number; h: number; y?: number }) {
  return (
    <mesh position={[0, y, 0]}>
      <cylinderGeometry args={[r + 0.002, r + 0.002, h, 24, 1, true, -0.5, 1.0]} />
      <meshStandardMaterial map={getGradTex()} transparent={false} alphaTest={0.5} side={THREE.DoubleSide} />
    </mesh>
  );
}

// Empty beaker with a measurement scale.
export function Beaker({ p, r = 0.09, h = 0.2 }: { p: [number, number, number]; r?: number; h?: number }) {
  return (
    <group position={p}>
      <mesh position={[0, h / 2, 0]}><cylinderGeometry args={[r, r * 0.95, h, 20, 1, true]} /><BlueGlass /></mesh>
      <mesh position={[0, 0.004, 0]}><cylinderGeometry args={[r * 0.95, r * 0.95, 0.008, 20]} /><BlueGlass /></mesh>
      <mesh position={[0, h, 0]} rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[r, 0.005, 6, 20]} /><BlueGlass /></mesh>
      <GradStrip r={r} h={h * 0.85} y={h / 2} />
    </group>
  );
}

// Empty Erlenmeyer (conical) flask with a scale on the body.
function ConicalFlask({ p }: { p: [number, number, number] }) {
  const prof = [
    [0.001, 0], [0.11, 0], [0.11, 0.02], [0.11, 0.03], [0.04, 0.19], [0.035, 0.28], [0.04, 0.31],
  ].map(([x, y]) => new THREE.Vector2(x, y));
  return (
    <group position={p}>
      <mesh><latheGeometry args={[prof, 20]} /><BlueGlass /></mesh>
      <mesh position={[0, 0.31, 0]}><torusGeometry args={[0.04, 0.005, 6, 16]} /><BlueGlass /></mesh>
      <GradStrip r={0.09} h={0.1} y={0.06} />
    </group>
  );
}

// Empty tall graduated measuring cylinder.
function MeasuringCylinder({ p }: { p: [number, number, number] }) {
  return (
    <group position={p}>
      <mesh position={[0, 0.02, 0]}><cylinderGeometry args={[0.06, 0.06, 0.04, 6]} /><meshStandardMaterial color="#dfe3e6" roughness={0.4} /></mesh>
      <mesh position={[0, 0.2, 0]}><cylinderGeometry args={[0.035, 0.035, 0.36, 18, 1, true]} /><BlueGlass /></mesh>
      <mesh position={[0, 0.38, 0]}><torusGeometry args={[0.035, 0.004, 6, 16]} /><BlueGlass /></mesh>
      <GradStrip r={0.035} h={0.32} y={0.2} />
    </group>
  );
}

// Empty volumetric / round-bottom flask with a single graduation ring.
function VolFlask({ p }: { p: [number, number, number] }) {
  return (
    <group position={p}>
      <mesh position={[0, 0.1, 0]}><sphereGeometry args={[0.1, 20, 20]} /><BlueGlass /></mesh>
      <mesh position={[0, 0.28, 0]}><cylinderGeometry args={[0.022, 0.03, 0.22, 14]} /><BlueGlass /></mesh>
      <mesh position={[0, 0.24, 0]}><torusGeometry args={[0.026, 0.003, 6, 14]} /><meshStandardMaterial color="#3a3a3a" /></mesh>
      <mesh position={[0, 0.39, 0]}><torusGeometry args={[0.024, 0.004, 6, 14]} /><BlueGlass /></mesh>
    </group>
  );
}

// Wooden test-tube rack with empty glass tubes.
function TestTubeRack({ p, rot = 0 }: { p: [number, number, number]; rot?: number }) {
  const wood = <meshStandardMaterial color="#c69a63" roughness={0.7} />;
  const xs = [-0.16, -0.096, -0.032, 0.032, 0.096, 0.16];
  return (
    <group position={p} rotation={[0, rot, 0]}>
      <mesh position={[0, 0.01, 0]}><boxGeometry args={[0.42, 0.02, 0.14]} />{wood}</mesh>
      <mesh position={[0, 0.14, 0]}><boxGeometry args={[0.42, 0.02, 0.14]} />{wood}</mesh>
      {[-0.2, 0.2].map((x, i) => (<mesh key={i} position={[x, 0.08, 0]}><boxGeometry args={[0.02, 0.14, 0.14]} />{wood}</mesh>))}
      {xs.map((x, i) => (
        <group key={i} position={[x, 0.1, 0]}>
          <mesh position={[0, 0.02, 0]}><cylinderGeometry args={[0.024, 0.024, 0.2, 14, 1, true]} /><BlueGlass /></mesh>
          <mesh position={[0, -0.08, 0]}><sphereGeometry args={[0.024, 12, 10, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2]} /><BlueGlass /></mesh>
        </group>
      ))}
    </group>
  );
}

// Front counter packed with empty glassware — a dense grid (rows front↔back).
function Instruments() {
  const y = 1.08;
  const zFront = -HZ + 0.32;
  const zBack = -HZ + 0.68;
  // one glassware factory per grid cell, cycled
  const kinds = ["beakerS", "conical", "cyl", "vol", "beakerL", "rack"] as const;
  const render = (kind: (typeof kinds)[number], key: string, x: number, z: number) => {
    const pos: [number, number, number] = [x, y, z];
    switch (kind) {
      case "beakerS": return <Beaker key={key} p={pos} r={0.07} h={0.15} />;
      case "beakerL": return <Beaker key={key} p={pos} r={0.09} h={0.2} />;
      case "conical": return <ConicalFlask key={key} p={pos} />;
      case "cyl": return <MeasuringCylinder key={key} p={pos} />;
      case "vol": return <VolFlask key={key} p={pos} />;
      case "rack": return <TestTubeRack key={key} p={pos} rot={0.05} />;
    }
  };

  const items: React.ReactNode[] = [];
  let n = 0;
  // back row: taller pieces
  for (let x = -3.3; x <= 3.35; x += 0.34) {
    items.push(render(kinds[n % 3 === 0 ? 3 : n % 2 === 0 ? 2 : 1], `b${n}`, x, zBack));
    n++;
  }
  // front row: beakers/short pieces, offset so it reads as packed
  let m = 0;
  for (let x = -3.15; x <= 3.35; x += 0.32) {
    items.push(render(m % 5 === 0 ? "rack" : m % 2 === 0 ? "beakerL" : "beakerS", `f${m}`, x, zFront));
    m++;
  }
  return <group>{items}</group>;
}

export function ChemLab({
  stoveOn,
  holding,
  waterOn,
  gapLeftBottomZ = [],
  simplified = false,
  showSink = true,
  showStove = true,
}: {
  stoveOn: boolean;
  holding: boolean;
  waterOn: boolean;
  gapLeftBottomZ?: number[]; // z slots to leave empty on the left-wall bottom shelf
  simplified?: boolean; // When true (bench practicals), skips distant shelf bottles for massive mobile FPS gain
  showSink?: boolean;
  showStove?: boolean;
}) {
  if (simplified) {
    return (
      <group>
        <AirConditioner />
        {showSink && <Sink waterOn={waterOn} />}
        {(showStove || stoveOn) && <Stove on={stoveOn} />}
      </group>
    );
  }

  return (
    <group>
      <ChemWall side={1} />
      <ChemWall side={-1} skipZ={gapLeftBottomZ} />
      <AirConditioner />
      <BackWallFeatures />
      {/* anatomy skeleton in a glass display case — front (AC) wall, right corner */}
      <SkeletonCase position={[5.2, 0, -HZ + 0.55]} />
      <Instruments />
      <Sink waterOn={waterOn} />
      <Stove on={stoveOn} />
      <ExtinguisherStand visible={!holding} />
    </group>
  );
}

// The extinguisher held in first-person view, with a spray burst when firing.
export function HeldExtinguisher({ sprayingRef }: { sprayingRef: { current: boolean } }) {
  const inst = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const parts = useMemo(() => Array.from({ length: 26 }, () => ({ off: Math.random(), sx: Math.random() - 0.5, sy: Math.random() - 0.5 })), []);

  useFrame((s) => {
    if (!inst.current) return;
    const on = sprayingRef.current;
    parts.forEach((p, i) => {
      const t = on ? (s.clock.elapsedTime * 1.6 + p.off) % 1 : 1;
      dummy.position.set(-0.16 + p.sx * 0.12 * t, -0.34 + p.sy * 0.1 * t, -0.35 - t * 0.9);
      dummy.scale.setScalar(on ? 0.03 + t * 0.09 : 0.0001);
      dummy.updateMatrix();
      inst.current!.setMatrixAt(i, dummy.matrix);
    });
    inst.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <group>
      {/* extinguisher body held low-left in view */}
      <group position={[-0.16, -0.34, -0.34]} rotation={[0.2, 0.3, 0.15]}>
        <mesh>
          <cylinderGeometry args={[0.06, 0.06, 0.24, 18]} />
          <meshStandardMaterial color="#c62828" roughness={0.45} />
        </mesh>
        <mesh position={[0, 0.15, 0]}>
          <cylinderGeometry args={[0.04, 0.06, 0.07, 18]} />
          <meshStandardMaterial color="#b71c1c" roughness={0.5} />
        </mesh>
        <mesh position={[0, 0.21, 0]}>
          <cylinderGeometry args={[0.025, 0.025, 0.06, 10]} />
          <meshStandardMaterial color="#1c1c1c" />
        </mesh>
        {/* nozzle pointing forward */}
        <mesh position={[0, 0.22, -0.08]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.012, 0.012, 0.14, 10]} />
          <meshStandardMaterial color="#111" />
        </mesh>
      </group>
      {/* spray particles */}
      <instancedMesh ref={inst} args={[undefined, undefined, parts.length]}>
        <sphereGeometry args={[0.04, 6, 6]} />
        <meshStandardMaterial color="#ffffff" transparent opacity={0.7} />
      </instancedMesh>
    </group>
  );
}
