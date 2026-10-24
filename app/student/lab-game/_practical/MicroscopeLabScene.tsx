"use client";

import { useMemo, useRef, useState, useEffect } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, useTexture } from "@react-three/drei";
import * as THREE from "three";
import { Check, RotateCcw, ZoomIn } from "lucide-react";

useTexture.preload("/AppLogoDark.png");

export type MicroscopeSlidePart = {
  id: string;
  name: string;
  index: number;
  clue: string;
  description: string;
  x: number; // SVG coordinate (0..300)
  y: number; // SVG coordinate (0..300)
  lx?: number; // Leader label X offset
  ly?: number; // Leader label Y offset
};

const ROOM_W = 14;
const ROOM_D = 10;
const ROOM_H = 5.2;
const HZ = ROOM_D / 2;

// Procedural floor tile texture
function makeFloorTexture(): THREE.CanvasTexture {
  const w = 512;
  const h = 512;
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = "#e2e8e4";
  ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = "#c4cec8";
  ctx.lineWidth = 4;
  const step = 64;
  for (let x = 0; x <= w; x += step) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, h);
    ctx.stroke();
  }
  for (let y = 0; y <= h; y += step) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
    ctx.stroke();
  }
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(8, 6);
  tex.anisotropy = 8;
  return tex;
}

// 1. Branded Virtual Lab Notice Board (Matches Chemistry Lab signature notice board)
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
  position = [-3.5, 2.8, -HZ + 0.08],
}: {
  position?: [number, number, number];
}) {
  const texture = useMemo(makeWalkLabNoticeTexture, []);
  return (
    <group position={position}>
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

// 3. Virtual Lab Room Shell
function VirtualLabRoom({ slideTitle }: { slideTitle?: string }) {
  const floorTex = useMemo(makeFloorTexture, []);
  const wallColor = "#bed4c8";

  return (
    <group>
      {/* Floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[ROOM_W, ROOM_D]} />
        <meshStandardMaterial map={floorTex} color="#cbd5cf" roughness={0.4} metalness={0.05} />
      </mesh>

      {/* Ceiling */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, ROOM_H, 0]}>
        <planeGeometry args={[ROOM_W, ROOM_D]} />
        <meshStandardMaterial color="#d1ded7" roughness={0.9} />
      </mesh>

      {/* Back Wall */}
      <mesh position={[0, ROOM_H / 2, -HZ]} receiveShadow>
        <planeGeometry args={[ROOM_W, ROOM_H]} />
        <meshStandardMaterial color={wallColor} roughness={0.9} side={THREE.DoubleSide} />
      </mesh>

      {/* Front Wall */}
      <mesh position={[0, ROOM_H / 2, HZ]} rotation={[0, Math.PI, 0]} receiveShadow>
        <planeGeometry args={[ROOM_W, ROOM_H]} />
        <meshStandardMaterial color={wallColor} roughness={0.9} side={THREE.DoubleSide} />
      </mesh>

      {/* Left Wall */}
      <mesh position={[-ROOM_W / 2, ROOM_H / 2, 0]} rotation={[0, Math.PI / 2, 0]} receiveShadow>
        <planeGeometry args={[ROOM_D, ROOM_H]} />
        <meshStandardMaterial color={wallColor} roughness={0.9} side={THREE.DoubleSide} />
      </mesh>

      {/* Right Wall */}
      <mesh position={[ROOM_W / 2, ROOM_H / 2, 0]} rotation={[0, -Math.PI / 2, 0]} receiveShadow>
        <planeGeometry args={[ROOM_D, ROOM_H]} />
        <meshStandardMaterial color={wallColor} roughness={0.9} side={THREE.DoubleSide} />
      </mesh>

      {/* Room Objects */}
      <WalkLabNoticeBoard position={[-3.5, 2.8, -HZ + 0.08]} />
    </group>
  );
}

// 4. Lab Room Camera Controller
function MicroscopeCameraController({
  resetTrigger,
  onResetComplete,
}: {
  resetTrigger: number;
  onResetComplete: () => void;
}) {
  const { camera } = useThree();
  const controlsRef = useRef<any>(null);

  useEffect(() => {
    if (controlsRef.current) {
      camera.position.set(0, 2.0, 3.2);
      controlsRef.current.target.set(0, 1.8, 0);
      controlsRef.current.update();
      if (resetTrigger > 0) onResetComplete();
    }
  }, [resetTrigger, camera, onResetComplete]);

  return (
    <OrbitControls
      ref={controlsRef}
      target={[0, 1.8, 0]}
      enableRotate={false}
      enableZoom={false}
      enablePan={false}
    />
  );
}

export default function MicroscopeLabScene({
  parts,
  foundSet,
  currentId,
  isTourMode,
  activeTourIndex,
  isComplete,
  viewMode,
  setViewMode,
  slideRenderer,
  onPick,
  slideTitle,
  mag: controlledMag,
  setMag: controlledSetMag,
}: {
  parts: MicroscopeSlidePart[];
  foundSet: Set<string>;
  currentId: string;
  isTourMode: boolean;
  activeTourIndex: number;
  isComplete?: boolean;
  viewMode: "lab" | "eyepiece";
  setViewMode: (mode: "lab" | "eyepiece") => void;
  slideRenderer: (found: Set<string>, activeId: string) => React.ReactNode;
  onPick: (id: string) => void;
  slideTitle: string;
  mag?: number;
  setMag?: (m: number) => void;
}) {
  const [resetCount, setResetCount] = useState(0);
  const [internalMag, setInternalMag] = useState<number>(1);
  const mag = controlledMag !== undefined ? controlledMag : internalMag;
  const setMag = controlledSetMag || setInternalMag;

  return (
    <div className="relative h-full w-full select-none overflow-hidden bg-[#f4f7f5]">
      {/* 3D Canvas rendering the clean Virtual Laboratory Room Environment */}
      <Canvas
        shadows
        camera={{ position: [0, 2.0, 3.2], fov: 60, near: 0.1 }}
        dpr={[1, 2]}
        gl={{ antialias: true, powerPreference: "high-performance", precision: "highp", toneMappingExposure: 1.0 }}
        style={{ touchAction: "none" }}
      >
        <color attach="background" args={["#f4f7f5"]} />

        {/* Ambient & Lab Lighting */}
        <ambientLight intensity={0.75} />
        <hemisphereLight args={["#ffffff", "#bed4c8", 0.65]} />
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
        <pointLight position={[-2.6, 4.2, 0.5]} intensity={0.4} decay={0} />
        <pointLight position={[2.6, 4.2, 0.5]} intensity={0.4} decay={0} />

        {/* Virtual Lab Room Environment */}
        <VirtualLabRoom slideTitle={slideTitle} />

        <MicroscopeCameraController
          resetTrigger={resetCount}
          onResetComplete={() => {}}
        />
      </Canvas>

      {/* OVERLAY: Interactive Microscope Eyepiece Lens View shifted to the right of guide modal */}
      {viewMode === "eyepiece" && (
        <div
          className={`absolute inset-0 z-20 flex items-center pointer-events-none p-2 sm:p-4 transition-all duration-500 ease-out ${
            isComplete
              ? "justify-center sm:justify-start sm:pl-8 md:pl-16 lg:pl-24"
              : "justify-center landscape:justify-end landscape:pr-3 sm:landscape:pr-6 md:landscape:pr-10 sm:justify-end sm:pr-6 md:pr-10 lg:pr-14"
          }`}
        >
          {/* Microscope Field of View Optical Aperture (Realistic Brushed Chrome & Silver Eyepiece Bezel) */}
          <div
            className={`pointer-events-auto relative aspect-square w-full rounded-full overflow-hidden border-[10px] sm:border-[16px] border-[#334155] bg-[#f8f1f4] shadow-[0_12px_45px_rgba(0,0,0,0.55),0_0_90px_rgba(0,0,0,0.35),inset_0_0_45px_rgba(0,0,0,0.35)] ring-4 sm:ring-8 ring-[#94a3b8] ring-offset-2 sm:ring-offset-4 ring-offset-[#475569] outline outline-2 sm:outline-4 outline-[#cbd5e1] transition-all duration-500 ease-out ${
              isComplete
                ? "max-w-[min(65dvh,460px)] sm:max-w-[min(78dvh,580px)] md:max-w-[min(84dvh,680px)] -translate-y-16 sm:translate-y-0"
                : "max-w-[min(85dvh,94vw)] landscape:max-w-[min(88dvh,58vw)] sm:max-w-[min(88dvh,660px)] md:max-w-[min(90dvh,760px)] lg:max-w-[min(92dvh,860px)]"
            }`}
          >
            {/* Slide SVG Layer with Optical Zoom */}
            <div
              className="absolute inset-0 transition-transform duration-300 ease-out"
              style={{ transform: `scale(${mag})`, transformOrigin: "center" }}
            >
              {slideRenderer(foundSet, currentId)}

              {/* Anatomical Leader Line Markers inside the Lens (ONLY shown when found or during tour focus) */}
              <svg className="absolute inset-0 h-full w-full pointer-events-none" viewBox="0 0 300 300">
                {parts.map((part, idx) => {
                  const isFound = foundSet.has(part.id);
                  const isTourFocus = isTourMode && activeTourIndex === idx + 1;
                  const showLabel = isTourMode ? isTourFocus : isFound || isComplete;

                  const lx = part.lx ?? (part.x > 150 ? 228 : 72);
                  const ly = part.ly ?? part.y;

                  return (
                    <g key={part.id} className="transition-all duration-200">
                      {/* Outer Ring on Anchor Dot */}
                      <circle
                        cx={part.x}
                        cy={part.y}
                        r={isFound || isTourFocus || isComplete ? 5.5 : 4.0}
                        fill="none"
                        stroke="#005f02"
                        strokeWidth="1.4"
                        opacity={isFound || isTourFocus || isComplete ? 0.95 : 0.75}
                      />
                      {/* Anchor Dot on Structure */}
                      <circle
                        cx={part.x}
                        cy={part.y}
                        r={isFound || isTourFocus || isComplete ? 3.0 : 2.0}
                        fill="#005f02"
                        stroke="#003d01"
                        strokeWidth="1.2"
                      />
                      {/* Leader Line to Offset Label (Primary Brand Green) */}
                      {showLabel && (
                        <line
                          x1={part.x}
                          y1={part.y}
                          x2={lx}
                          y2={ly}
                          stroke="#005f02"
                          strokeWidth={2.0}
                          opacity={0.95}
                        />
                      )}
                    </g>
                  );
                })}
              </svg>

              {/* Clickable Spots on the Slide */}
              {parts.map((part, idx) => {
                const isFound = foundSet.has(part.id);
                const isTourFocus = isTourMode && activeTourIndex === idx + 1;
                const showLabel = isTourMode ? isTourFocus : isFound || isComplete;

                const lx = part.lx ?? (part.x > 150 ? 228 : 72);
                const ly = part.ly ?? part.y;

                return (
                  <div key={part.id}>
                    {/* Clickable hotspot over the exact structure on the slide */}
                    {!isTourMode && !isFound && !isComplete && (
                      <button
                        type="button"
                        onClick={() => onPick(part.id)}
                        aria-label={`Locate ${part.name}`}
                        className="group absolute -translate-x-1/2 -translate-y-1/2 size-8 sm:size-9 rounded-full border border-white/40 bg-white/15 hover:bg-primary/30 hover:border-primary transition cursor-pointer"
                        style={{ left: `${(part.x / 300) * 100}%`, top: `${(part.y / 300) * 100}%` }}
                      >
                        <span className="sr-only">{part.name}</span>
                      </button>
                    )}

                    {/* Label Badge (Primary background + Primary border & check) */}
                    {showLabel && (
                      <div
                        className={`absolute -translate-y-1/2 flex items-center gap-1 rounded-full border px-2 py-0.5 sm:px-2.5 sm:py-1 text-[10px] sm:text-xs font-black shadow-lg bg-gradient-to-r from-primary to-primary-dark text-white border-primary/90 ring-1 sm:ring-2 ring-primary/40 whitespace-nowrap transition-all duration-200 pointer-events-none ${
                          lx < 150 ? "translate-x-0" : "-translate-x-full"
                        }`}
                        style={{ left: `${(lx / 300) * 100}%`, top: `${(ly / 300) * 100}%` }}
                      >
                        <span className="grid size-3.5 sm:size-4 shrink-0 place-items-center rounded-full bg-[#f6c453] text-[#0f2e12] text-[8px] sm:text-[9px] font-black shadow-sm">
                          <Check size={9} strokeWidth={3.5} />
                        </span>
                        <span className="max-w-[170px] sm:max-w-[220px] font-bold text-white whitespace-nowrap">{part.name}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Lens Eyepiece Glass Vignette Frame */}
            <div className="pointer-events-none absolute inset-0 rounded-full shadow-[inset_0_0_35px_rgba(0,0,0,0.5)] border border-black/20" />
          </div>
        </div>
      )}

    </div>
  );
}
