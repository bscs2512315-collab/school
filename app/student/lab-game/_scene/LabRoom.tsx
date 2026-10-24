"use client";

/**
 * Shared 3D lab room — ExBoard-green themed, reflective, realistic-ish.
 *
 * Realism comes from a procedural image-based environment (three's built-in
 * RoomEnvironment via PMREM — no network) so glass + surfaces actually reflect
 * light, plus rounded/bevelled furniture, bar handles, toe-kicks and worktop
 * overhangs. Everything is procedural: nothing to fetch, nothing to block.
 *
 * A practical renders <LabRoom>{apparatus}</LabRoom> and drops its own
 * interactive apparatus in as children (the main bench top is at y ≈ 1.08,
 * centred at z ≈ 0.1).
 */

import { useMemo, type ReactNode } from "react";
import { RoundedBox, useTexture } from "@react-three/drei";
import * as THREE from "three";

// ExBoard AI green theme
export const GREEN = "#005f02"; // brand primary (dark green)
export const GREEN_DARK = "#004a02";
export const LAB_SAGE_WALL = "#9fbdab";
export const LAB_BOARD_SURFACE = "#edf4ee";
export const CABINET = "#343b3f"; // satin charcoal door faces
export const BODYGAP = "#1e2529"; // dark frame and door reveals
export const WORKTOP = "#e9edef"; // pale, wipe-clean lab work surfaces
export const HANDLE = "#f5f7f8"; // light brushed-metal handles
export const TRIM = GREEN;

export const ROOM_W = 15;
export const ROOM_D = 13;
export const ROOM_H = 5;
export const HX = ROOM_W / 2;
export const HZ = ROOM_D / 2;
export const BENCH_TOP_Y = 1.08;

// ---- Procedural textures ---------------------------------------------------

function makeFloorTexture(): THREE.Texture {
  const c = document.createElement("canvas");
  c.width = c.height = 256;
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = "#f8f9f8";
  ctx.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 700; i++) {
    ctx.fillStyle = `rgba(0,0,0,${Math.random() * 0.018})`;
    ctx.fillRect(Math.random() * 256, Math.random() * 256, 1, 1);
  }
  ctx.strokeStyle = "#cbd1d2";
  ctx.lineWidth = 4;
  ctx.strokeRect(0, 0, 256, 256);
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(6, 5);
  tex.anisotropy = 4;
  return tex;
}

function makeWallTexture(): THREE.Texture {
  const c = document.createElement("canvas");
  c.width = c.height = 256;
  const ctx = c.getContext("2d")!;
  // Keep the existing lightweight texture neutral so wall colors come from
  // material tints, without adding textures or geometry for each wall.
  ctx.fillStyle = "#f4f7f2";
  ctx.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 400; i++) {
    ctx.fillStyle = `rgba(0,0,0,${Math.random() * 0.015})`;
    const s = 2 + Math.random() * 5;
    ctx.fillRect(Math.random() * 256, Math.random() * 256, s, s);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(2, 1);
  return tex;
}

export type VirtualLabBoardDetails = {
  practicalNo: string;
  title: string;
};

function makeVirtualLabBoardTexture({ practicalNo, title }: VirtualLabBoardDetails): THREE.Texture {
  const W = 1600;
  const H = 600;
  const c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  const ctx = c.getContext("2d")!;

  const rounded = (x: number, y: number, w: number, h: number, r: number) => {
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, r);
    ctx.closePath();
  };

  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, "#062b1a");
  bg.addColorStop(1, "#0b4a26");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // Subtle technical grid, so the board reads as a deliberate lab instrument.
  ctx.strokeStyle = "rgba(160, 240, 183, 0.09)";
  ctx.lineWidth = 1;
  for (let x = 0; x <= W; x += 42) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
  }
  for (let y = 0; y <= H; y += 42) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
  }

  ctx.fillStyle = "#f6c453";
  ctx.font = "800 42px system-ui, sans-serif";
  ctx.fillText("VIRTUAL LAB", 66, 120);
  ctx.fillStyle = "rgba(233,255,240,0.82)";
  ctx.font = "700 34px system-ui, sans-serif";
  ctx.fillText(practicalNo.toUpperCase(), 66, 172);

  ctx.fillStyle = "#ffffff";
  ctx.font = "800 86px system-ui, sans-serif";
  ctx.fillText(title, 66, 300);

  rounded(62, 374, 780, 104, 22);
  ctx.fillStyle = "rgba(0,0,0,0.24)";
  ctx.fill();
  ctx.strokeStyle = "rgba(177, 244, 192, 0.32)";
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.fillStyle = "#f6c453";
  ctx.font = "800 26px system-ui, sans-serif";
  ctx.fillText("SALT ANALYSIS", 96, 418);
  ctx.fillStyle = "#effff3";
  ctx.font = "700 34px system-ui, sans-serif";
  ctx.fillText("Group I qualitative analysis", 96, 458);

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 16;
  tex.generateMipmaps = false;
  tex.minFilter = THREE.LinearFilter;
  tex.magFilter = THREE.LinearFilter;
  return tex;
}

// Printed bottle label: clean white paper, chemical name (wrapped to fit),
// a thin coloured accent underline + ruled lines. Maps onto a curved band.
function makeLabelTexture(name: string, accent: string): THREE.Texture {
  const W = 256;
  const H = 220;
  const c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = "#fafafa";
  ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = "#d8d8d3";
  ctx.lineWidth = 4;
  ctx.strokeRect(4, 4, W - 8, H - 8);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  const maxW = W - 48;
  const wrap = (font: number): string[] => {
    ctx.font = `bold ${font}px system-ui, sans-serif`;
    const words = name.split(" ");
    const lines: string[] = [];
    let cur = "";
    for (const w of words) {
      const t = cur ? `${cur} ${w}` : w;
      if (ctx.measureText(t).width > maxW && cur) {
        lines.push(cur);
        cur = w;
      } else {
        cur = t;
      }
    }
    if (cur) lines.push(cur);
    return lines;
  };

  let font = 42;
  let lines = wrap(font);
  while (lines.length > 2 && font > 24) {
    font -= 3;
    lines = wrap(font);
  }

  ctx.fillStyle = "#1a1a1a";
  const lineH = font + 8;
  const startY = 84 - ((lines.length - 1) * lineH) / 2;
  lines.forEach((ln, i) => ctx.fillText(ln, W / 2, startY + i * lineH));

  // accent underline
  ctx.strokeStyle = accent;
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(W / 2 - 42, 132);
  ctx.lineTo(W / 2 + 42, 132);
  ctx.stroke();
  // ruled lines
  ctx.strokeStyle = "#cececa";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(34, 164);
  ctx.lineTo(W - 34, 164);
  ctx.moveTo(52, 184);
  ctx.lineTo(W - 52, 184);
  ctx.stroke();

  const tex = new THREE.CanvasTexture(c);
  tex.anisotropy = 4;
  return tex;
}

// Cache label textures so packing a shelf with 100s of bottles reuses a handful
// of canvases instead of allocating one per bottle.
const labelCache = new Map<string, THREE.Texture>();
export function getLabelTexture(name: string, accent: string): THREE.Texture {
  const key = `${name}|${accent}`;
  let t = labelCache.get(key);
  if (!t) {
    t = makeLabelTexture(name, accent);
    labelCache.set(key, t);
  }
  return t;
}

// ---- Reusable glass material -----------------------------------------------

// Reflective transparent glass. `thickness` is accepted for call-site
// compatibility but unused. `opacity` lets glassware read as tinted lab glass.
export function GlassMat({ tint = "#ffffff", opacity = 0.32 }: { tint?: string; thickness?: number; opacity?: number }) {
  return (
    <meshStandardMaterial
      transparent
      opacity={opacity}
      roughness={0.05}
      metalness={0}
      color={tint}
      envMapIntensity={1.5}
    />
  );
}

// Realistic refractive lab glass (three's built-in transmission — light bends
// through it). Used only on the front-counter glassware (not the hundreds of
// shelf bottles) to keep the transmission pass affordable.
export const LAB_GLASS_BLUE = "#dfeaf2";
export function BlueGlass() {
  return (
    <meshStandardMaterial
      transparent
      opacity={0.38}
      roughness={0.08}
      metalness={0.1}
      color={LAB_GLASS_BLUE}
      envMapIntensity={1.2}
    />
  );
}

// Dark amber reagent-bottle glass (ref look).
export function AmberGlass() {
  return <meshStandardMaterial color="#4a2409" transparent opacity={0.8} roughness={0.18} metalness={0.05} />;
}

// ---- Reusable furniture ----------------------------------------------------

export function Cabinet({
  position,
  size,
  doors = 2,
  rotation = [0, 0, 0],
}: {
  position: [number, number, number];
  size: [number, number, number];
  doors?: number;
  rotation?: [number, number, number];
}) {
  const [w, h, d] = size;
  const toe = 0.09;
  const bodyH = h - toe;
  const bodyY = -h / 2 + toe + bodyH / 2;
  const doorW = w / doors;

  return (
    <group position={position} rotation={rotation}>
      {/* recessed toe-kick */}
      <mesh position={[0, -h / 2 + toe / 2, d / 2 - 0.07]}>
        <boxGeometry args={[w - 0.06, toe, 0.05]} />
        <meshStandardMaterial color="#3a3d41" roughness={0.7} />
      </mesh>
      {/* carcass (shows as the reveal between doors) */}
      <RoundedBox args={[w, bodyH, d]} radius={0.02} smoothness={4} position={[0, bodyY, 0]} castShadow receiveShadow>
        <meshStandardMaterial color={BODYGAP} roughness={0.55} envMapIntensity={0.4} />
      </RoundedBox>
      {/* proud door faces + bar handles */}
      {Array.from({ length: doors }, (_, i) => {
        const x = -w / 2 + doorW * (i + 0.5);
        const handleX = x + (i % 2 === 0 ? doorW / 2 - 0.06 : -doorW / 2 + 0.06);
        return (
          <group key={i}>
            <RoundedBox
              args={[doorW - 0.045, bodyH - 0.05, 0.04]}
              radius={0.012}
              smoothness={4}
              position={[x, bodyY, d / 2]}
              castShadow
            >
              <meshStandardMaterial color={CABINET} roughness={0.48} metalness={0.08} envMapIntensity={0.35} />
            </RoundedBox>
            <mesh position={[handleX, bodyY, d / 2 + 0.05]} castShadow>
              <boxGeometry args={[0.022, 0.3, 0.03]} />
              <meshStandardMaterial color={HANDLE} metalness={0.45} roughness={0.24} envMapIntensity={1} />
            </mesh>
          </group>
        );
      })}
      {/* slim green brand accent under the top edge */}
    </group>
  );
}

export function Worktop({
  position,
  size,
}: {
  position: [number, number, number];
  size: [number, number, number];
}) {
  const [w, h, d] = size;
  return (
    <group position={position}>
      <RoundedBox args={[w, h, d]} radius={0.012} smoothness={4} castShadow receiveShadow>
        <meshStandardMaterial color={WORKTOP} roughness={0.38} metalness={0.03} envMapIntensity={0.35} />
      </RoundedBox>
    </group>
  );
}

export function MediaBottle({
  position,
  color,
  fill = 0.5,
  label,
}: {
  position: [number, number, number];
  color: string;
  fill?: number;
  label?: string;
}) {
  const bodyH = 0.5;
  const r = 0.13;
  const neckR = 0.05;
  const labelTex = useMemo(() => (label ? getLabelTexture(label, color) : null), [label, color]);

  // Lathe profile (radius, height) → realistic bottle: rounded heel, straight
  // body, curved shoulder, short neck. Revolved 360° into clear glass.
  const profile = useMemo(() => {
    return [
      [0.001, 0.0],
      [r * 0.55, 0.0],
      [r * 0.9, 0.015],
      [r, 0.045],
      [r, bodyH],
      [r * 0.99, bodyH + 0.03],
      [r * 0.86, bodyH + 0.09],
      [r * 0.62, bodyH + 0.16],
      [r * 0.42, bodyH + 0.21],
      [neckR, bodyH + 0.26],
      [neckR, bodyH + 0.37],
    ].map(([x, y]) => new THREE.Vector2(x, y));
  }, []);

  const capY = bodyH + 0.37;
  return (
    <group position={position}>
      {/* dark amber reagent-bottle glass (lathed) */}
      <mesh castShadow>
        <latheGeometry args={[profile, 40]} />
        <AmberGlass />
      </mesh>
      {/* amber contents (barely visible through the dark glass, as real bottles) */}
      <mesh position={[0, (bodyH * fill) / 2 + 0.02, 0]}>
        <cylinderGeometry args={[r - 0.006, r - 0.006, bodyH * fill, 32]} />
        <meshStandardMaterial color="#3a1c07" roughness={0.35} />
      </mesh>
      {/* curved label — arc centred on the +z front (theta 0) so it reads fully */}
      {labelTex && (
        <mesh position={[0, bodyH * 0.44, 0]}>
          <cylinderGeometry args={[r + 0.004, r + 0.004, 0.24, 40, 1, true, -0.95, 1.9]} />
          <meshStandardMaterial map={labelTex} roughness={0.7} side={THREE.DoubleSide} />
        </mesh>
      )}
      {/* black screw cap (two-tier, ridged like the reference) */}
      <group position={[0, capY, 0]}>
        <mesh position={[0, 0.025, 0]} castShadow>
          <cylinderGeometry args={[0.062, 0.062, 0.05, 28]} />
          <meshStandardMaterial color="#131313" roughness={0.5} />
        </mesh>
        <mesh position={[0, 0.06, 0]}>
          <cylinderGeometry args={[0.06, 0.06, 0.02, 28]} />
          <meshStandardMaterial color="#0c0c0c" roughness={0.6} />
        </mesh>
        <mesh position={[0, 0.105, 0]} castShadow>
          <cylinderGeometry args={[0.058, 0.058, 0.08, 28]} />
          <meshStandardMaterial color="#1a1a1a" roughness={0.5} />
        </mesh>
        <mesh position={[0, 0.15, 0]}>
          <cylinderGeometry args={[0.058, 0.05, 0.02, 28]} />
          <meshStandardMaterial color="#1a1a1a" roughness={0.5} />
        </mesh>
      </group>
    </group>
  );
}

export function RoundFlask({ position, color }: { position: [number, number, number]; color: string }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.18, 0]}>
        <sphereGeometry args={[0.16, 28, 28]} />
        <GlassMat tint="#ffffff" />
      </mesh>
      <mesh position={[0, 0.15, 0]}>
        <sphereGeometry args={[0.135, 28, 28]} />
        <meshStandardMaterial color={color} transparent opacity={0.95} roughness={0.15} envMapIntensity={0.5} />
      </mesh>
      <mesh position={[0, 0.42, 0]}>
        <cylinderGeometry args={[0.035, 0.045, 0.28, 16]} />
        <GlassMat tint="#ffffff" />
      </mesh>
      <mesh position={[0, 0.56, 0]}>
        <torusGeometry args={[0.04, 0.008, 8, 20]} />
        <meshStandardMaterial color="#dfe6ea" metalness={0.3} roughness={0.4} />
      </mesh>
    </group>
  );
}

export function Stool({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.9, 0]} castShadow>
        <cylinderGeometry args={[0.23, 0.23, 0.07, 32]} />
        <meshStandardMaterial color="#26282b" roughness={0.55} envMapIntensity={0.6} />
      </mesh>
      <mesh position={[0, 0.55, 0]} castShadow>
        <cylinderGeometry args={[0.035, 0.035, 0.7, 16]} />
        <meshStandardMaterial color="#3a3d41" metalness={0.6} roughness={0.35} envMapIntensity={1} />
      </mesh>
      {Array.from({ length: 5 }, (_, i) => {
        const a = (i / 5) * Math.PI * 2;
        return (
          <group key={i}>
            <mesh position={[Math.cos(a) * 0.16, 0.07, Math.sin(a) * 0.16]} rotation={[0, -a, 0]} castShadow>
              <boxGeometry args={[0.34, 0.05, 0.07]} />
              <meshStandardMaterial color="#26282b" roughness={0.55} />
            </mesh>
            <mesh position={[Math.cos(a) * 0.32, 0.03, Math.sin(a) * 0.32]}>
              <sphereGeometry args={[0.035, 10, 10]} />
              <meshStandardMaterial color="#111" />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

export function Poster({
  position,
  rotation = [0, 0, 0],
  color,
}: {
  position: [number, number, number];
  rotation?: [number, number, number];
  color: string;
}) {
  return (
    <group position={position} rotation={rotation}>
      <RoundedBox args={[0.94, 1.22, 0.04]} radius={0.02} smoothness={4}>
        <meshStandardMaterial color="#2b2f33" roughness={0.6} />
      </RoundedBox>
      <mesh position={[0, 0, 0.03]}>
        <planeGeometry args={[0.8, 1.06]} />
        <meshStandardMaterial color={color} roughness={0.7} />
      </mesh>
    </group>
  );
}

function VirtualLabBoard({ practicalNo, title }: VirtualLabBoardDetails) {
  const texture = useMemo(
    () => makeVirtualLabBoardTexture({ practicalNo, title }),
    [practicalNo, title],
  );
  const logoTexture = useTexture("/AppLogoDark.png");
  logoTexture.colorSpace = THREE.SRGBColorSpace;
  logoTexture.anisotropy = 16;

  return (
    <group position={[0, 2.3, -HZ + 0.18]}>
      <RoundedBox args={[5.65, 2.12, 0.12]} radius={0.06} smoothness={6} castShadow receiveShadow>
        <meshStandardMaterial color="#10271b" roughness={0.4} metalness={0.28} />
      </RoundedBox>
      <mesh position={[0, 0, 0.078]}>
        <planeGeometry args={[5.45, 1.92]} />
        <meshBasicMaterial map={texture} toneMapped={false} />
      </mesh>
      <mesh position={[1.56, 0.43, 0.084]}>
        <planeGeometry args={[1.48, 0.82]} />
        <meshBasicMaterial map={logoTexture} transparent toneMapped={false} />
      </mesh>
      <mesh position={[0, -1.13, 0]}>
        <boxGeometry args={[5.85, 0.08, 0.22]} />
        <meshStandardMaterial color="#153b22" roughness={0.45} metalness={0.35} />
      </mesh>
    </group>
  );
}

// Matches the branded notice board used in the first-person walking lab.
// Its logo redraw happens after the transparent asset finishes loading.
function makeWalkLabNoticeTexture(): THREE.Texture {
  const w = 512;
  const h = 400;
  const canvas = document.createElement("canvas");
  // A high-density canvas keeps the small lettering crisp at this camera distance.
  const resolution = 4;
  canvas.width = w * resolution;
  canvas.height = h * resolution;
  const ctx = canvas.getContext("2d")!;
  ctx.scale(resolution, resolution);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 16;
  texture.generateMipmaps = false;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;

  const logo = new Image();
  let logoReady = false;
  const font = "Poppins, system-ui, sans-serif";
  const draw = () => {
    ctx.fillStyle = LAB_BOARD_SURFACE;
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = GREEN;
    ctx.fillRect(0, 0, w, 12);
    ctx.fillRect(0, h - 12, w, 12);
    if (logoReady) {
      const logoWidth = 220;
      const logoHeight = (logo.height / logo.width) * logoWidth || 70;
      ctx.drawImage(logo, w / 2 - logoWidth / 2, 20, logoWidth, logoHeight);
    }
    ctx.textAlign = "center";
    ctx.fillStyle = "#0f2e12";
    ctx.font = `700 58px ${font}`;
    ctx.fillText("Virtual Lab", w / 2, 210);
    ctx.fillStyle = "#444";
    ctx.font = `500 22px ${font}`;
    ctx.fillText("Developed by Muhammad Taha Talib", w / 2, 290);
    ctx.font = `400 20px ${font}`;
    ctx.fillStyle = "#666";
    ctx.fillText("Powered by MacroPulse Systems", w / 2, 326);
    texture.needsUpdate = true;
  };

  draw();
  logo.onload = () => { logoReady = true; draw(); };
  // Same light-background brand asset used by components/AppLogo.tsx.
  logo.src = "/AppLogoLight.png";
  if (document.fonts?.ready) document.fonts.ready.then(draw).catch(() => {});
  return texture;
}

function WalkLabNoticeBoard() {
  const texture = useMemo(makeWalkLabNoticeTexture, []);
  return (
    <group position={[-4.25, 3.08, -HZ + 0.18]}>
      <mesh castShadow receiveShadow>
        <boxGeometry args={[2.4, 1.75, 0.06]} />
        <meshStandardMaterial color="#111111" roughness={0.5} />
      </mesh>
      <mesh position={[0, 0, 0.035]}>
        <planeGeometry args={[2.2, 1.58]} />
        <meshBasicMaterial map={texture} toneMapped={false} />
      </mesh>
    </group>
  );
}

// ---- The room --------------------------------------------------------------

export function LabRoom({
  children,
  chem = false,
  virtualLabBoard,
  walkLabNoticeBoard = true,
  decorativeChemicals = false,
}: {
  children?: ReactNode;
  chem?: boolean;
  virtualLabBoard?: VirtualLabBoardDetails;
  walkLabNoticeBoard?: boolean;
  decorativeChemicals?: boolean;
}) {
  const floorTex = useMemo(makeFloorTexture, []);
  const wallTex = useMemo(makeWallTexture, []);
  const wallMat = (color: string) => (
    <meshStandardMaterial map={wallTex} color={color} roughness={0.98} envMapIntensity={0.12} side={THREE.DoubleSide} />
  );

  return (
    <group>
      {/* Shell */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[ROOM_W, ROOM_D]} />
        <meshStandardMaterial map={floorTex} color="#BFC9C2" roughness={0.42} metalness={0} envMapIntensity={0.25} />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, ROOM_H, 0]}>
        <planeGeometry args={[ROOM_W, ROOM_D]} />
        {wallMat("#bed4c8")}
      </mesh>
      <mesh position={[0, ROOM_H / 2, -HZ]} receiveShadow>
        <planeGeometry args={[ROOM_W, ROOM_H]} />
        {wallMat(LAB_SAGE_WALL)}
      </mesh>
      <mesh position={[0, ROOM_H / 2, HZ]} rotation={[0, Math.PI, 0]} receiveShadow>
        <planeGeometry args={[ROOM_W, ROOM_H]} />
        {wallMat("#bed4c8")}
      </mesh>
      <mesh position={[-HX, ROOM_H / 2, 0]} rotation={[0, Math.PI / 2, 0]} receiveShadow>
        <planeGeometry args={[ROOM_D, ROOM_H]} />
        {wallMat("#bed4c8")}
      </mesh>
      <mesh position={[HX, ROOM_H / 2, 0]} rotation={[0, -Math.PI / 2, 0]} receiveShadow>
        <planeGeometry args={[ROOM_D, ROOM_H]} />
        {wallMat("#bed4c8")}
      </mesh>

      {/* Ceiling light panels */}
      {[-2.6, 2.6].map((x, i) => (
        <mesh key={i} position={[x, ROOM_H - 0.06, 0.5]} rotation={[Math.PI / 2, 0, 0]}>
          <planeGeometry args={[3, 1.1]} />
          <meshStandardMaterial color="#f4f4f2" emissive="#f4f4f2" emissiveIntensity={0.75} />
        </mesh>
      ))}

      {/* Side wall decor */}
      {!chem && <Poster position={[-HX + 0.06, 3, -1.2]} rotation={[0, Math.PI / 2, 0]} color="#0f9d58" />}

      {/* Main (interactive) bench — narrower "centred table" in chem mode */}
      <Cabinet position={[0, 0.5, 0.15]} size={chem ? [3.4, 1, 1.3] : [5, 1, 1.4]} doors={chem ? 3 : 4} />
      <Worktop position={[0, 1.03, 0.12]} size={chem ? [3.7, 0.1, 1.6] : [5.4, 0.1, 1.8]} />

      {/* Back counter: bottom cabinets and worktop only (no upper hanging cabinets or center board) */}
      <Cabinet position={[0, 0.5, -HZ + 0.45]} size={[7, 1, 0.7]} doors={5} />
      <Worktop position={[0, 1.03, -HZ + 0.5]} size={[7.3, 0.09, 0.85]} />
      {walkLabNoticeBoard ? (
        <WalkLabNoticeBoard />
      ) : virtualLabBoard ? (
        <VirtualLabBoard {...virtualLabBoard} />
      ) : null}
      {/* decorative flasks/bottles on the back shelf — only if explicitly enabled */}
      {decorativeChemicals &&
        [
          { x: -2.4, c: "#e0219a" },
          { x: -1.5, c: "#2ec16b" },
          { x: -0.6, c: "#e23b3b" },
          { x: 0.6, c: "#f4c020" },
          { x: 1.5, c: "#8e44ec" },
          { x: 2.4, c: "#20c4d6" },
        ].map((f, i) => <RoundFlask key={i} position={[f.x, 2.34, -HZ + 0.35]} color={f.c} />)}
      {decorativeChemicals &&
        [
          { x: -2.75, c: "#3fb0f0", l: "Distilled Water" },
          { x: -2.05, c: "#57c477", l: "NaOH" },
          { x: 2.05, c: "#f0a53f", l: "Ethanol" },
          { x: 2.75, c: "#ef6a6a", l: "HCl" },
        ].map((b, i) => (
          <MediaBottle key={i} position={[b.x, 1.08, -HZ + 0.55]} color={b.c} fill={0.4 + i * 0.08} label={b.l} />
        ))}

      {!chem && <Stool position={[-1.6, 0, 1.95]} />}

      {children}
    </group>
  );
}
