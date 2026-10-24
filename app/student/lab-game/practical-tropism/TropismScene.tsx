"use client";

import { useMemo, useRef, useState, useEffect } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, Line, Html, RoundedBox, useTexture } from "@react-three/drei";
import * as THREE from "three";
import { Check, Sun as SunIcon, RotateCcw } from "lucide-react";

export type TropismAspect = {
  id: string;
  name: string;
  index: number;
  mode: "photo" | "geo";
  sunPosition: "left" | "top" | "right" | "none";
  clue: string;
  description: string;
  targetPos: [number, number, number]; // Key spot on plant
  labelPos: [number, number, number]; // Leader label offset
  cameraPos: [number, number, number];
  cameraLookAt: [number, number, number];
};

const ROOM_W = 12;
const ROOM_D = 10;
const ROOM_H = 5.2;
const HX = ROOM_W / 2;
const HZ = ROOM_D / 2;

// Floor texture matching Chemistry / Biology Labs
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

// Wall texture matching Chemistry Lab
function makeWallTexture(): THREE.Texture {
  const c = document.createElement("canvas");
  c.width = c.height = 256;
  const ctx = c.getContext("2d")!;
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



// 2. Branded Virtual Lab Notice Board (Matches Chemistry Lab signature notice board)
function makeWalkLabNoticeTexture(): THREE.Texture {
  const w = 512;
  const h = 400;
  const canvas = document.createElement("canvas");
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
    ctx.fillStyle = "#edf4ee";
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = "#005f02";
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
  logo.onload = () => {
    logoReady = true;
    draw();
  };
  logo.src = "/AppLogoLight.png";
  if (typeof document !== "undefined" && document.fonts?.ready) {
    document.fonts.ready.then(draw).catch(() => {});
  }
  return texture;
}

function WalkLabNoticeBoard({
  position = [-3.2, 2.7, -HZ + 0.08],
  rotation = [0, 0, 0],
}: {
  position?: [number, number, number];
  rotation?: [number, number, number];
}) {
  const texture = useMemo(makeWalkLabNoticeTexture, []);
  return (
    <group position={position} rotation={rotation}>
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

// 3. Lab Bench Table
function LabBenchTable({ position = [0, 0, 0] }: { position?: [number, number, number] }) {
  const topMaterial = <meshStandardMaterial color="#6b3714" roughness={0.42} metalness={0.06} />;
  const legMaterial = <meshStandardMaterial color="#3b1c09" roughness={0.55} metalness={0.12} />;

  return (
    <group position={position}>
      {/* Table Top (Warm Polished Wood) */}
      <mesh position={[0, 0.88, 0]} castShadow receiveShadow>
        <boxGeometry args={[2.4, 0.08, 1.2]} />
        {topMaterial}
      </mesh>
      {/* Table Underframe (Dark Chestnut Wood) */}
      <mesh position={[0, 0.82, 0]} castShadow>
        <boxGeometry args={[2.2, 0.04, 1.0]} />
        <meshStandardMaterial color="#4a220c" roughness={0.5} metalness={0.08} />
      </mesh>
      {/* 4 Sturdy Legs */}
      {[[-1.05, -0.45], [1.05, -0.45], [-1.05, 0.45], [1.05, 0.45]].map(([lx, lz], i) => (
        <mesh key={i} position={[lx, 0.42, lz]} castShadow receiveShadow>
          <cylinderGeometry args={[0.035, 0.035, 0.84, 16]} />
          {legMaterial}
        </mesh>
      ))}
    </group>
  );
}

// 4. Clean Lab Environment
function CleanLabRoom() {
  const floorTex = useMemo(makeFloorTexture, []);
  const wallTex = useMemo(makeWallTexture, []);

  const wallMat = (color: string) => (
    <meshStandardMaterial map={wallTex} color={color} roughness={0.98} envMapIntensity={0.12} side={THREE.DoubleSide} />
  );

  return (
    <group>
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
        {wallMat("#9fbdab")}
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
      {[-2.6, 2.6].map((x, i) => (
        <mesh key={i} position={[x, ROOM_H - 0.06, 0.5]} rotation={[Math.PI / 2, 0, 0]}>
          <planeGeometry args={[3, 1.1]} />
          <meshStandardMaterial color="#f4f4f2" emissive="#f4f4f2" emissiveIntensity={0.75} />
        </mesh>
      ))}
      <WalkLabNoticeBoard position={[-HX + 0.08, 2.7, -1.7]} rotation={[0, Math.PI / 2, 0]} />
    </group>
  );
}

// 5. Realistic Glowing 3D Sun
function RealisticSun({
  position,
  active = true,
}: {
  position: [number, number, number];
  active?: boolean;
}) {
  const sunGroup = useRef<THREE.Group>(null);
  const targetPos = useMemo(() => new THREE.Vector3(...position), [position]);
  const glow = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 128;
    const context = canvas.getContext("2d")!;
    const gradient = context.createRadialGradient(64, 64, 8, 64, 64, 64);
    gradient.addColorStop(0, "rgba(255,247,199,0.7)");
    gradient.addColorStop(0.28, "rgba(255,211,103,0.42)");
    gradient.addColorStop(1, "rgba(255,190,69,0)");
    context.fillStyle = gradient;
    context.fillRect(0, 0, 128, 128);
    return new THREE.CanvasTexture(canvas);
  }, []);
  const disk = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 128;
    const context = canvas.getContext("2d")!;
    const surface = context.createRadialGradient(54, 48, 5, 64, 64, 64);
    surface.addColorStop(0, "#fffbe1");
    surface.addColorStop(0.68, "#ffe5a2");
    surface.addColorStop(1, "#f4b95f");
    context.fillStyle = surface;
    context.fillRect(0, 0, 128, 128);
    for (let i = 0; i < 90; i++) {
      const angle = i * 2.39996;
      const radius = Math.sqrt((i + 0.5) / 90) * 55;
      context.fillStyle = i % 3 ? "rgba(255,255,235,.08)" : "rgba(194,118,44,.05)";
      context.beginPath();
      context.arc(64 + Math.cos(angle) * radius, 64 + Math.sin(angle) * radius, 1.5 + i % 3, 0, Math.PI * 2);
      context.fill();
    }
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  }, []);

  useFrame((_, delta) => {
    if (!sunGroup.current) return;
    sunGroup.current.position.lerp(targetPos, Math.min(1, delta * 4));
  });

  if (!active) return null;

  return (
    <group ref={sunGroup} position={position}>
      <pointLight intensity={2.6} distance={4} decay={2} color="#fff2bb" />
      <sprite scale={[0.64, 0.64, 1]}>
        <spriteMaterial map={glow} transparent depthWrite={false} opacity={0.68} />
      </sprite>
      <mesh>
        <sphereGeometry args={[0.095, 32, 24]} />
        <meshBasicMaterial map={disk} toneMapped={false} />
      </mesh>
    </group>
  );
}

function makeLeafGeometry(): THREE.BufferGeometry {
  const vertices: number[] = [];
  const colors: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];
  const rows = 28;
  const columns = 12;
  const dark = new THREE.Color("#3d7844");
  const light = new THREE.Color("#86ae62");
  for (let row = 0; row <= rows; row++) {
    const t = row / rows;
    const width = Math.pow(Math.sin(Math.PI * t), 0.96) * (0.088 + 0.012 * t);
    for (let column = 0; column <= columns; column++) {
      const across = column / columns * 2 - 1;
      const unevenEdge = 1 + 0.025 * Math.sin(t * Math.PI * 9 + (across < 0 ? 0.8 : 0));
      const twist = 0.012 * Math.sin(t * Math.PI * 1.5) * across;
      vertices.push(width * across * unevenEdge, 0.018 + t * 0.3, Math.sin(Math.PI * t) * (0.013 + 0.028 * (1 - across * across)) + twist);
      const mottling = Math.sin(row * 1.9 + column * 3.4) * 0.045;
      const color = dark.clone().lerp(light, 0.28 + 0.27 * (1 - Math.abs(across)) + 0.08 * (1 - t) + mottling);
      colors.push(color.r, color.g, color.b);
      uvs.push(column / columns, t);
      if (row < rows && column < columns) {
        const a = row * (columns + 1) + column;
        indices.push(a, a + columns + 1, a + 1, a + 1, a + columns + 1, a + columns + 2);
      }
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

function leafSurface(t: number, across: number): [number, number, number] {
  const width = Math.pow(Math.sin(Math.PI * t), 0.96) * (0.088 + 0.012 * t);
  const unevenEdge = 1 + 0.025 * Math.sin(t * Math.PI * 9 + (across < 0 ? 0.8 : 0));
  const twist = 0.012 * Math.sin(t * Math.PI * 1.5) * across;
  return [width * across * unevenEdge, 0.018 + t * 0.3, Math.sin(Math.PI * t) * (0.013 + 0.028 * (1 - across * across)) + twist + 0.002];
}

function makeLeafTexture(): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 512;
  const context = canvas.getContext("2d")!;
  const image = context.createImageData(canvas.width, canvas.height);
  for (let y = 0; y < canvas.height; y++) {
    for (let x = 0; x < canvas.width; x++) {
      const wave = Math.sin(x * 0.11 + y * 0.035) * 5 + Math.sin(x * 0.27 - y * 0.071) * 3;
      const grain = ((x * 67 + y * 97) % 23) - 11;
      const brightness = Math.max(204, Math.min(255, 232 + wave + grain * 0.7));
      const offset = (y * canvas.width + x) * 4;
      image.data[offset] = brightness;
      image.data[offset + 1] = brightness;
      image.data[offset + 2] = brightness * 0.93;
      image.data[offset + 3] = 255;
    }
  }
  context.putImageData(image, 0, 0);
  context.strokeStyle = "rgba(63,105,49,.28)";
  context.lineWidth = 3;
  context.beginPath();
  context.moveTo(128, 20);
  context.quadraticCurveTo(125, 255, 128, 492);
  context.stroke();
  context.lineWidth = 1.6;
  for (let y = 90; y < 460; y += 54) {
    for (const side of [-1, 1]) {
      context.beginPath();
      context.moveTo(128, y);
      context.quadraticCurveTo(128 + side * 42, y - 18, 128 + side * 112, y - 46);
      context.stroke();
    }
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  return texture;
}

// Thin, curved blades and visible veins read as living tissue rather than plastic ovals.
function RealisticLeaf({
  position,
  rotation,
  scale = [1, 1, 1],
}: {
  position: [number, number, number];
  rotation: [number, number, number];
  scale?: [number, number, number];
}) {
  const geometry = useMemo(makeLeafGeometry, []);
  const texture = useMemo(makeLeafTexture, []);
  return (
    <group position={position} rotation={rotation} scale={scale}>
      <group rotation={[-0.18, 0, 0]}>
        <mesh geometry={geometry} castShadow receiveShadow>
          <meshStandardMaterial map={texture} vertexColors side={THREE.DoubleSide} roughness={0.91} metalness={0} />
        </mesh>
        <Line points={[leafSurface(0.12, 0), leafSurface(0.5, 0), leafSurface(0.91, 0)]} color="#466f39" lineWidth={0.7} transparent opacity={0.55} />
        {[0.25, 0.43, 0.61, 0.77].flatMap((t, i) => [-1, 1].map((side) => (
          <Line key={`${i}-${side}`} points={[leafSurface(t, 0), leafSurface(t + 0.09, side * 0.76)]} color="#4e7941" lineWidth={0.5} transparent opacity={0.38} />
        )))}
      </group>
    </group>
  );
}

// Stem curvature calculation based on phototropism or geotropism
function calculateStemPoints(mode: "photo" | "geo", sun: "left" | "top" | "right" | "none", preview: boolean): THREE.Vector3[] {
  const points: THREE.Vector3[] = [];
  const segments = 30;
  const baseY = mode === "geo" ? 1.14 : 1.31;

  if (mode === "geo") {
    // Horizontal pot on bench: shoot emerges horizontal (+X) and curves upwards (+Y)
    const len = preview ? 0.14 : 0.66;
    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const angle = preview ? 0 : (t * Math.PI) / 2;
      const x = preview ? 0.04 + t * len : 0.04 + Math.sin(angle) * len;
      const y = baseY + (1 - Math.cos(angle)) * len;
      points.push(new THREE.Vector3(x, y, 0));
    }
  } else {
    // Upright pot: shoot bends toward the light source
    const leanSign = sun === "left" ? -1 : sun === "right" ? 1 : 0;
    const height = preview ? 0.16 : 0.7;
    const maxLean = 0.38;

    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      // Quadratic curvature toward light
      const x = preview ? 0 : leanSign * maxLean * (t * t);
      const y = baseY + t * height;
      points.push(new THREE.Vector3(x, y, 0));
    }
  }
  return points;
}

// Root curvature calculation for geotropism
function calculateRootPoints(mode: "photo" | "geo", preview: boolean): THREE.Vector3[] {
  const points: THREE.Vector3[] = [];
  const segments = 24;
  const baseY = mode === "geo" ? 1.14 : 1.31;

  if (mode === "geo") {
    // The exposed root emerges from the sideways pot and curves toward gravity.
    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const angle = preview ? 0 : (t * Math.PI) / 2;
      const x = preview ? 0.04 + t * 0.1 : 0.04 + Math.sin(angle) * 0.35;
      const y = baseY - (1 - Math.cos(angle)) * 0.2;
      points.push(new THREE.Vector3(x, y, 0.06));
    }
  } else {
    // Upright pot: roots grow straight downward (+ve geotropism)
    const depth = 0.39;
    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const x = Math.sin(t * 8) * 0.02;
      const y = baseY - t * depth;
      points.push(new THREE.Vector3(x, y, 0));
    }
  }
  return points;
}

// 7. Realistic 3D Plant Model
function RealisticPlant({
  mode,
  sun,
  preview = false,
}: {
  mode: "photo" | "geo";
  sun: "left" | "top" | "right" | "none";
  preview?: boolean;
}) {
  const stemPoints = useMemo(() => calculateStemPoints(mode, sun, preview), [mode, sun, preview]);
  const rootPoints = useMemo(() => calculateRootPoints(mode, preview), [mode, preview]);

  const stemCurve = useMemo(() => new THREE.CatmullRomCurve3(stemPoints), [stemPoints]);
  const rootCurve = useMemo(() => new THREE.CatmullRomCurve3(rootPoints), [rootPoints]);

  const shootTip = useMemo(() => stemCurve.getPoint(1.0), [stemCurve]);
  const shootMid = useMemo(() => stemCurve.getPoint(0.55), [stemCurve]);
  const shootLow = useMemo(() => stemCurve.getPoint(0.30), [stemCurve]);

  const shootTan = useMemo(() => stemCurve.getTangent(1.0), [stemCurve]);
  const tipAngle = Math.atan2(shootTan.y, shootTan.x) - Math.PI / 2;

  const rootTip = useMemo(() => rootCurve.getPoint(1.0), [rootCurve]);

  return (
    <group>
      {/* 3D Curved Shoot Stem */}
      <mesh castShadow receiveShadow>
        <tubeGeometry args={[stemCurve, 64, 0.022, 16, false]} />
        <meshStandardMaterial color="#457f42" roughness={0.84} metalness={0} />
      </mesh>

      {/* 3D Curved Root System */}
      <mesh castShadow receiveShadow>
        <tubeGeometry args={[rootCurve, 48, 0.016, 12, false]} />
        <meshStandardMaterial color="#d2b897" roughness={0.92} metalness={0} />
      </mesh>

      {/* Keep the question seedling small so its eventual direction is unknown. */}
      {!preview && <>
      <RealisticLeaf
        position={[shootLow.x - 0.015, shootLow.y, shootLow.z]}
        rotation={[0.12, -0.25, 1.0]}
        scale={[0.7, 0.72, 0.8]}
      />
      <RealisticLeaf
        position={[shootLow.x + 0.015, shootLow.y, shootLow.z]}
        rotation={[-0.1, 0.25, -1.0]}
        scale={[0.7, 0.72, 0.8]}
      />

      {/* Mid Foliage Leaves */}
      <RealisticLeaf
        position={[shootMid.x - 0.01, shootMid.y + 0.01, shootMid.z]}
        rotation={[0.25, -0.35, 0.95 + tipAngle * 0.2]}
        scale={[1.05, 1.2, 1]}
      />
      <RealisticLeaf
        position={[shootMid.x + 0.01, shootMid.y + 0.01, shootMid.z]}
        rotation={[-0.2, 0.35, -0.95 + tipAngle * 0.2]}
        scale={[1.05, 1.2, 1]}
      />
      </>}

      {/* Apical Shoot Terminal Leaves (at the bending tip) */}
      <group position={[shootTip.x, shootTip.y, shootTip.z]} rotation={[0, 0, tipAngle]}>
        {!preview && <RealisticLeaf
          position={[-0.01, 0, 0]}
          rotation={[0.18, -0.25, 0.75]}
          scale={[0.8, 0.82, 0.8]}
        />}
        {!preview && <RealisticLeaf
          position={[0.01, 0, 0]}
          rotation={[-0.14, 0.25, -0.75]}
          scale={[0.8, 0.82, 0.8]}
        />}
        {/* Terminal Bud */}
        <mesh position={[0, 0.055, 0]}>
          <sphereGeometry args={[0.018, 12, 12]} />
          <meshStandardMaterial color="#86a65a" roughness={0.85} />
        </mesh>
      </group>

      {/* Root Branchlets (for geotropism) */}
      {mode === "geo" && !preview && (
        <group position={[rootTip.x, rootTip.y, rootTip.z]}>
          <mesh position={[0.03, 0.02, 0]} rotation={[0, 0, -0.6]}>
            <cylinderGeometry args={[0.008, 0.004, 0.12, 8]} />
            <meshStandardMaterial color="#d4b996" roughness={0.8} />
          </mesh>
          <mesh position={[-0.03, 0.02, 0]} rotation={[0, 0, 0.6]}>
            <cylinderGeometry args={[0.008, 0.004, 0.12, 8]} />
            <meshStandardMaterial color="#d4b996" roughness={0.8} />
          </mesh>
        </group>
      )}
    </group>
  );
}

function makeClayTexture(): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 256;
  const context = canvas.getContext("2d")!;
  context.fillStyle = "#b96b49";
  context.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 1100; i++) {
    const x = (i * 97 + 23) % 256;
    const y = (i * 59 + 13) % 256;
    context.fillStyle = i % 3 ? "rgba(91,42,27,.09)" : "rgba(255,219,171,.12)";
    context.fillRect(x, y, 1 + i % 3, 1 + i % 2);
  }
  for (let y = 12; y < 256; y += 38) {
    context.fillStyle = "rgba(103,51,31,.06)";
    context.fillRect(0, y, 256, 2);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  return texture;
}

// The base sits on the bench; soil, rim and body remain visible above it.
function TerracottaPot({ mode }: { mode: "photo" | "geo" }) {
  const isHorizontal = mode === "geo";
  const clay = useMemo(makeClayTexture, []);

  return (
    <group
      position={isHorizontal ? [0, 1.14, 0] : [0, 1.27, 0]}
      rotation={[0, 0, isHorizontal ? -Math.PI / 2 : 0]}
    >
      <mesh position={[0, -0.34, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.22, 0.2, 0.025, 48]} />
        <meshStandardMaterial color="#a75d3d" roughness={0.94} />
      </mesh>
      <mesh position={[0, -0.155, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.245, 0.155, 0.35, 48]} />
        <meshStandardMaterial map={clay} roughness={0.94} metalness={0} />
      </mesh>
      <mesh position={[0, 0.014, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.265, 0.255, 0.06, 48, 1, true]} />
        <meshStandardMaterial color="#ac603f" side={THREE.DoubleSide} roughness={0.9} />
      </mesh>
      <mesh position={[0, 0.046, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.248, 0.018, 10, 48]} />
        <meshStandardMaterial color="#ce8156" roughness={0.88} />
      </mesh>
      <mesh position={[0, 0.027, 0]}>
        <cylinderGeometry args={[0.235, 0.235, 0.025, 48]} />
        <meshStandardMaterial color="#3c3025" roughness={1} />
      </mesh>
      {Array.from({ length: 64 }).map((_, i) => {
        const a = i * 2.39996;
        const r = Math.sqrt((i + 0.5) / 64) * 0.218;
        return (
          <mesh key={i} position={[Math.cos(a) * r, 0.045, Math.sin(a) * r]}>
            <dodecahedronGeometry args={[0.006 + (i % 4) * 0.002, 0]} />
            <meshStandardMaterial color={i % 3 ? "#574536" : "#7c6550"} roughness={1} />
          </mesh>
        );
      })}
    </group>
  );
}

// 9. Gravity Direction Arrow (for Geotropism)
function GravityIndicator({ active = false }: { active?: boolean }) {
  if (!active) return null;

  return (
    <group position={[1.12, 1.42, 0]}>
      {/* Gravity Badge */}
      <Html position={[0, 0.29, 0]} center zIndexRange={[100, 0]}>
        <div className="flex items-center gap-1 rounded-full bg-black/75 px-2.5 py-1 text-[10px] font-black text-white shadow-lg border border-white/20 backdrop-blur-sm whitespace-nowrap">
          <span className="size-2 rounded-full bg-sky-400 animate-ping" />
          <span>Gravity (g ↓)</span>
        </div>
      </Html>

      {/* 3D Downward Gravity Arrow Shaft */}
      <mesh position={[0, 0.02, 0]}>
        <cylinderGeometry args={[0.012, 0.012, 0.3, 12]} />
        <meshStandardMaterial color="#59a9c5" roughness={0.75} metalness={0.04} />
      </mesh>

      {/* Downward Arrow Cone */}
      <mesh position={[0, -0.18, 0]} rotation={[Math.PI, 0, 0]}>
        <coneGeometry args={[0.045, 0.1, 12]} />
        <meshStandardMaterial color="#59a9c5" roughness={0.75} metalness={0.04} />
      </mesh>
    </group>
  );
}

// 10. 3D Leader Spot / Pin Component
function LeaderSpot({
  targetPos,
  labelPos,
  label,
  sublabel,
  visible = true,
  onClick,
}: {
  targetPos: [number, number, number];
  labelPos: [number, number, number];
  label: string;
  sublabel?: string;
  visible?: boolean;
  onClick?: () => void;
}) {
  if (!visible) return null;

  const linePoints = [new THREE.Vector3(...targetPos), new THREE.Vector3(...labelPos)];

  return (
    <group>
      {/* Anchor Dot on Structure */}
      <mesh position={targetPos}>
        <sphereGeometry args={[0.018, 16, 16]} />
        <meshStandardMaterial color="#f6c453" emissive="#a06615" emissiveIntensity={0.5} />
      </mesh>

      {/* Anchor Pulse Ring */}
      <mesh position={targetPos}>
        <ringGeometry args={[0.018, 0.025, 24]} />
        <meshBasicMaterial color="#f6c453" transparent opacity={0.85} side={THREE.DoubleSide} />
      </mesh>

      {/* Clickable Hitbox for Quiz Mode */}
      {onClick && (
        <mesh
          position={targetPos}
          onClick={(e) => {
            e.stopPropagation();
            onClick();
          }}
        >
          <sphereGeometry args={[0.22, 16, 16]} />
          <meshBasicMaterial transparent opacity={0} depthWrite={false} />
        </mesh>
      )}

      {/* Leader Line (Primary Brand Green) */}
      <Line points={linePoints} color="#f6c453" lineWidth={2.1} transparent opacity={0.95} />

      {/* Label Badge (Primary background + Primary border & check) */}
      <Html position={labelPos} zIndexRange={[100, 0]}>
        <div className={`hidden lg:flex items-center -translate-y-1/2 select-none pointer-events-none ${labelPos[0] < 0 ? "-translate-x-full" : labelPos[0] === 0 ? "-translate-x-1/2" : ""}`}>
          <div className="flex w-[220px] items-center gap-1.5 rounded-xl border border-[#b3d4b7] bg-[#173a29]/95 px-2.5 py-1.5 text-[11px] font-bold text-white shadow-xl">
            <span className="grid size-3.5 sm:size-4 shrink-0 place-items-center rounded-full bg-[#f6c453] text-[#0f2e12] text-[8px] sm:text-[9px] font-black shadow-sm">
              <Check size={8} strokeWidth={3.5} />
            </span>
            <div className="flex min-w-0 flex-col">
              <span className="text-[11px] sm:text-xs font-bold leading-tight tracking-tight text-white">
                {label}
              </span>
              {sublabel && (
                <span className="mt-0.5 text-[9px] font-medium leading-tight text-[#f6c453]">{sublabel}</span>
              )}
            </div>
          </div>
        </div>
      </Html>
    </group>
  );
}

// 11. Camera Controller with Smooth Transitions
function TropismCameraController({
  cameraPos,
  lookAtPos,
  isComplete,
  resetTrigger,
  onResetComplete,
}: {
  cameraPos: [number, number, number];
  lookAtPos: [number, number, number];
  isComplete?: boolean;
  resetTrigger: number;
  onResetComplete: () => void;
}) {
  const { camera } = useThree();
  const controlsRef = useRef<any>(null);

  useEffect(() => {
    if (resetTrigger > 0 && controlsRef.current) {
      camera.position.set(...cameraPos);
      controlsRef.current.target.set(...lookAtPos);
      controlsRef.current.update();
      onResetComplete();
    }
  }, [resetTrigger, cameraPos, lookAtPos, camera, onResetComplete]);

  useFrame((_, delta) => {
    if (!controlsRef.current) return;
    const step = Math.min(1, delta * 3.5);

    const targetPos = isComplete
      ? new THREE.Vector3(cameraPos[0] - 0.4, cameraPos[1], cameraPos[2])
      : new THREE.Vector3(...cameraPos);

    const targetLook = isComplete
      ? new THREE.Vector3(lookAtPos[0] - 0.4, lookAtPos[1], lookAtPos[2])
      : new THREE.Vector3(...lookAtPos);

    camera.position.lerp(targetPos, step);
    controlsRef.current.target.lerp(targetLook, step);
    controlsRef.current.update();
  });

  return (
    <OrbitControls
      ref={controlsRef}
      target={lookAtPos}
      enablePan={false}
      minDistance={1.2}
      maxDistance={4.0}
      minPolarAngle={Math.PI / 8}
      maxPolarAngle={Math.PI / 1.8}
      enableDamping={true}
      dampingFactor={0.08}
    />
  );
}

export const TROPISM_X_OFFSET = 0.52;

export default function TropismScene({
  mode,
  sunPosition,
  activeAspect,
  isTourMode,
  isQuizQuestion = false,
  revealedChoice,
  isComplete,
}: {
  mode: "photo" | "geo";
  sunPosition: "left" | "top" | "right" | "none";
  activeAspect?: TropismAspect;
  isTourMode: boolean;
  isQuizQuestion?: boolean;
  revealedChoice?: string;
  isComplete?: boolean;
}) {
  const [resetCount, setResetCount] = useState(0);
  const [isNarrow, setIsNarrow] = useState(false);

  useEffect(() => {
    const update = () => setIsNarrow(window.innerWidth < 640);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  // Dynamic Sun 3D coordinates relative to plant offset
  const sun3DPos: [number, number, number] = useMemo(() => {
    switch (sunPosition) {
      case "left":
        return [-0.72 + TROPISM_X_OFFSET, isNarrow ? 2.38 : 2.28, 0.1];
      case "top":
        return [0 + TROPISM_X_OFFSET, 2.45, 0.1];
      case "right":
        return [0.72 + TROPISM_X_OFFSET, isNarrow ? 2.38 : 2.28, 0.1];
      default:
        return [0 + TROPISM_X_OFFSET, 2.45, 0.1];
    }
  }, [sunPosition, isNarrow]);

  const defaultCamPos: [number, number, number] = [0.10, 1.70, isNarrow ? 3.1 : 2.45];
  const defaultLookAt: [number, number, number] = [0.10, 1.50, 0];

  const sourceCameraPos = activeAspect ? activeAspect.cameraPos : defaultCamPos;
  const cameraPos: [number, number, number] = [sourceCameraPos[0] + 0.10, sourceCameraPos[1], isNarrow ? 3.1 : sourceCameraPos[2]];
  const lookAtPos: [number, number, number] = [
    activeAspect ? activeAspect.cameraLookAt[0] + 0.10 : defaultLookAt[0],
    activeAspect ? activeAspect.cameraLookAt[1] : defaultLookAt[1],
    activeAspect ? activeAspect.cameraLookAt[2] : defaultLookAt[2],
  ];

  return (
    <div className="relative h-full w-full select-none overflow-hidden bg-[#bed4c8]">
      <Canvas
        shadows
        camera={{ position: defaultCamPos, fov: 50, near: 0.05 }}
        dpr={[1, 2]}
        gl={{
          antialias: true,
          powerPreference: "high-performance",
          precision: "highp",
          toneMappingExposure: 1.0,
        }}
        style={{ touchAction: "none", cursor: "none" }}
      >
        <color attach="background" args={["#bed4c8"]} />

        {/* Lighting matching Chemistry Lab standards */}
        <ambientLight intensity={0.7} />
        <hemisphereLight args={["#ffffff", "#c9ccce", 0.6]} />
        <spotLight
          position={[0, 4.6, 2.5]}
          angle={0.9}
          penumbra={0.9}
          intensity={1.2}
          decay={0}
          castShadow
          shadow-mapSize={[1024, 1024]}
          shadow-bias={-0.0004}
        />

        {/* 1. Virtual Lab Room & Furniture placed with right offset */}
        <CleanLabRoom />
        <LabBenchTable position={[TROPISM_X_OFFSET, 0, 0]} />

        {/* 2. Realistic 3D Glowing Sun (active in phototropism mode) */}
        <RealisticSun position={sun3DPos} active={mode === "photo" && sunPosition !== "none"} />

        {/* 3. Plant, Pot & Gravity Indicator (placed on right side) */}
        <group position={[TROPISM_X_OFFSET, 0, 0]}>
          <GravityIndicator active={mode === "geo"} />
          <TerracottaPot mode={mode} />
          <RealisticPlant mode={mode} sun={sunPosition} preview={isQuizQuestion && !revealedChoice} />
        </group>

        {/* 5. Interactive Leader Spots during Tour Mode */}
        {isTourMode && activeAspect && (
          <LeaderSpot
            targetPos={[activeAspect.targetPos[0] + TROPISM_X_OFFSET, activeAspect.targetPos[1], activeAspect.targetPos[2]]}
            labelPos={[activeAspect.labelPos[0] + TROPISM_X_OFFSET, activeAspect.labelPos[1], activeAspect.labelPos[2]]}
            label={activeAspect.name}
            sublabel={activeAspect.clue}
            visible={true}
          />
        )}

        {/* Show only the outcome that the student just predicted. */}
        {isQuizQuestion && revealedChoice && (
          <LeaderSpot
            targetPos={
              revealedChoice === "root_down"
                ? [0.39 + TROPISM_X_OFFSET, 0.94, 0.06]
                : revealedChoice === "shoot_up"
                ? [0.65 + TROPISM_X_OFFSET, 1.82, 0]
                : revealedChoice === "left"
                ? [-0.38 + TROPISM_X_OFFSET, 1.99, 0]
                : revealedChoice === "right"
                ? [0.38 + TROPISM_X_OFFSET, 1.99, 0]
                : [0 + TROPISM_X_OFFSET, 2.01, 0]
            }
            labelPos={
              revealedChoice === "root_down"
                ? [0.78 + TROPISM_X_OFFSET, 1.1, 0.06]
                : revealedChoice === "shoot_up"
                ? [0.98 + TROPISM_X_OFFSET, 1.95, 0]
                : revealedChoice === "left"
                ? [0.10 + TROPISM_X_OFFSET, 2.15, 0]
                : revealedChoice === "right"
                ? [0.75 + TROPISM_X_OFFSET, 2.1, 0]
                : [0.45 + TROPISM_X_OFFSET, 2.1, 0]
            }
            label={
              revealedChoice === "root_down"
                ? "Roots Curve DOWN"
                : revealedChoice === "shoot_up"
                ? "Shoot Curves UP"
                : revealedChoice === "left"
                ? "Bend Left"
                : revealedChoice === "right"
                ? "Bend Right"
                : "Grow Upright"
            }
            visible
          />
        )}

        <TropismCameraController
          cameraPos={cameraPos}
          lookAtPos={lookAtPos}
          isComplete={isComplete}
          resetTrigger={resetCount}
          onResetComplete={() => {}}
        />
      </Canvas>
    </div>
  );
}
