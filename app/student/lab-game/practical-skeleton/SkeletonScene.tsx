"use client";

import { Suspense, useMemo, useRef, useState, useEffect } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, useGLTF, Html, Line, RoundedBox, useTexture } from "@react-three/drei";
import * as THREE from "three";
import { Check, RotateCcw } from "lucide-react";

useGLTF.preload("/models/skeleton.glb");
useTexture.preload("/AppLogoDark.png");

export type BoneDefinition = {
  id: string;
  name: string;
  index: number;
  clue: string;
  pos: [number, number, number]; // Target on bone
  labelPos: [number, number, number]; // Offset for leader label
  tourCam: {
    pos: [number, number, number];
    lookAt: [number, number, number];
  };
  tourDescription: string;
};

const ROOM_W = 12;
const ROOM_D = 10;
const ROOM_H = 5.2;
const HX = ROOM_W / 2; // 6
const HZ = ROOM_D / 2; // 5

// Floor texture matching Chemistry Lab
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

// Wall plaster texture matching Chemistry Lab
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

// 1. Air Conditioner Unit (Wall-Mounted)
function AirConditioner() {
  return (
    <group position={[0, 4.25, -HZ + 0.14]}>
      <RoundedBox args={[2.2, 0.6, 0.28]} radius={0.065} smoothness={3} castShadow>
        <meshStandardMaterial color="#e9eeec" roughness={0.56} metalness={0.03} />
      </RoundedBox>
      <mesh position={[0, 0.07, 0.146]}>
        <boxGeometry args={[2.02, 0.34, 0.012]} />
        <meshStandardMaterial color="#f6f8f6" roughness={0.62} />
      </mesh>
      <mesh position={[0, -0.115, 0.153]}>
        <boxGeometry args={[1.96, 0.008, 0.012]} />
        <meshStandardMaterial color="#b6c0bd" roughness={0.8} />
      </mesh>
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
        <meshStandardMaterial color="#59b97c" emissive="#2c8e4e" emissiveIntensity={0.6} />
      </mesh>
    </group>
  );
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

// Clean Lab Environment (Matches Chemistry Lab Room: Sage Walls, Light Floor & Virtual Lab Notice Board)
function CleanLabRoom() {
  const floorTex = useMemo(makeFloorTexture, []);
  const wallTex = useMemo(makeWallTexture, []);

  const wallMat = (color: string) => (
    <meshStandardMaterial map={wallTex} color={color} roughness={0.98} envMapIntensity={0.12} side={THREE.DoubleSide} />
  );

  return (
    <group>
      {/* Floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[ROOM_W, ROOM_D]} />
        <meshStandardMaterial map={floorTex} color="#BFC9C2" roughness={0.42} metalness={0} envMapIntensity={0.25} />
      </mesh>

      {/* Ceiling */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, ROOM_H, 0]}>
        <planeGeometry args={[ROOM_W, ROOM_D]} />
        {wallMat("#bed4c8")}
      </mesh>

      {/* Back Wall (Matches Chemistry Lab Sage Wall) */}
      <mesh position={[0, ROOM_H / 2, -HZ]} receiveShadow>
        <planeGeometry args={[ROOM_W, ROOM_H]} />
        {wallMat("#9fbdab")}
      </mesh>

      {/* Front Wall */}
      <mesh position={[0, ROOM_H / 2, HZ]} rotation={[0, Math.PI, 0]} receiveShadow>
        <planeGeometry args={[ROOM_W, ROOM_H]} />
        {wallMat("#bed4c8")}
      </mesh>

      {/* Left Wall */}
      <mesh position={[-HX, ROOM_H / 2, 0]} rotation={[0, Math.PI / 2, 0]} receiveShadow>
        <planeGeometry args={[ROOM_D, ROOM_H]} />
        {wallMat("#bed4c8")}
      </mesh>

      {/* Right Wall */}
      <mesh position={[HX, ROOM_H / 2, 0]} rotation={[0, -Math.PI / 2, 0]} receiveShadow>
        <planeGeometry args={[ROOM_D, ROOM_H]} />
        {wallMat("#bed4c8")}
      </mesh>

      {/* Overhead Ceiling Light Panels */}
      {[-2.6, 2.6].map((x, i) => (
        <mesh key={i} position={[x, ROOM_H - 0.06, 0.5]} rotation={[Math.PI / 2, 0, 0]}>
          <planeGeometry args={[3, 1.1]} />
          <meshStandardMaterial color="#f4f4f2" emissive="#f4f4f2" emissiveIntensity={0.75} />
        </mesh>
      ))}

      {/* 1. AC */}
      <AirConditioner />

      {/* 2. Virtual Lab Notice Board (Matches Chemistry Lab) */}
      <WalkLabNoticeBoard position={[-3.2, 2.7, -HZ + 0.08]} />
    </group>
  );
}

// 3. Real skeleton model on a stand on the floor
function SkeletonInLab({
  position = [0, 0, 0],
}: {
  position?: [number, number, number];
}) {
  const { scene } = useGLTF("/models/skeleton.glb");

  const model = useMemo(() => {
    const cloned = scene.clone(true);
    const box = new THREE.Box3().setFromObject(cloned);
    const size = new THREE.Vector3();
    const center = new THREE.Vector3();
    box.getSize(size);
    box.getCenter(center);
    const s = 1.72 / (size.y || 1);

    cloned.position.set(-center.x, -box.min.y, -center.z);
    cloned.traverse((child) => {
      const name = (child.name || "").toLowerCase();
      if (
        name.includes("rod") ||
        name.includes("stand") ||
        name.includes("pole") ||
        name.includes("cylinder") ||
        name.includes("support") ||
        name.includes("pipe") ||
        name.includes("stick") ||
        name.includes("sphere") ||
        name.includes("ball") ||
        name.includes("locator") ||
        name.includes("helper") ||
        name.includes("point") ||
        name.includes("marker")
      ) {
        child.visible = false;
      }
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        mesh.castShadow = true;
        mesh.receiveShadow = true;
      }
    });

    const group = new THREE.Group();
    group.add(cloned);
    group.scale.setScalar(s);
    return group;
  }, [scene]);

  return (
    <group position={position}>
      {/* Clean floor stand base */}
      <mesh position={[0, 0.02, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.55, 0.04, 0.38]} />
        <meshStandardMaterial color="#f0f3f1" roughness={0.55} metalness={0.05} />
      </mesh>

      {/* Skeleton 3D Model (Free unobstructed 360 view) */}
      <primitive object={model} position={[0, 0.04, 0]} />
    </group>
  );
}

// Fallback while GLB loads
function SkeletonFallback({ position = [0, 0, 0] }: { position?: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.02, 0]}>
        <boxGeometry args={[0.55, 0.04, 0.38]} />
        <meshStandardMaterial color="#f0f3f1" roughness={0.55} />
      </mesh>
    </group>
  );
}

// 3D Leader Spot / Pin Component
function LeaderSpot({
  bone,
  isFound,
  isTourFocus,
  isTourMode,
  onPick,
  skeletonOffset = [0, 0, 0],
}: {
  bone: BoneDefinition;
  isFound: boolean;
  isTourFocus: boolean;
  isTourMode: boolean;
  onPick: (id: string) => void;
  skeletonOffset?: [number, number, number];
}) {
  const [hovered, setHovered] = useState(false);

  const boneWorldPos: [number, number, number] = useMemo(
    () => [
      bone.pos[0] + skeletonOffset[0],
      bone.pos[1] + skeletonOffset[1] + 0.04,
      bone.pos[2] + skeletonOffset[2],
    ],
    [bone.pos, skeletonOffset]
  );

  const labelWorldPos: [number, number, number] = useMemo(
    () => [
      bone.labelPos[0] + skeletonOffset[0],
      bone.labelPos[1] + skeletonOffset[1] + 0.04,
      bone.labelPos[2] + skeletonOffset[2],
    ],
    [bone.labelPos, skeletonOffset]
  );

  const linePoints = useMemo(
    () => [
      new THREE.Vector3(...boneWorldPos),
      new THREE.Vector3(...labelWorldPos),
    ],
    [boneWorldPos, labelWorldPos]
  );

  const showLabel = isTourMode ? isTourFocus : isFound;

  return (
    <group>
      {/* 1. Visible Anchor Spot on the Bone ONLY when found or during tour focus */}
      {(isFound || isTourFocus) && (
        <>
          <mesh position={boneWorldPos}>
            <sphereGeometry args={[isFound ? 0.022 : 0.024, 16, 16]} />
            <meshStandardMaterial
              color="#005f02"
              emissive="#003d01"
              emissiveIntensity={1.0}
              roughness={0.2}
              metalness={0.2}
            />
          </mesh>

          {/* Ring around anchor dot */}
          <mesh position={boneWorldPos}>
            <ringGeometry args={[0.022, 0.030, 24]} />
            <meshBasicMaterial
              color="#005f02"
              transparent
              opacity={0.95}
              side={THREE.DoubleSide}
            />
          </mesh>
        </>
      )}

      {/* 2. Invisible larger click hitbox for direct tapping/clicking on the skeleton bone */}
      {!isTourMode && !isFound && (
        <mesh
          position={boneWorldPos}
          onClick={(e) => {
            e.stopPropagation();
            onPick(bone.id);
          }}
          onPointerOver={(e) => {
            e.stopPropagation();
            setHovered(true);
          }}
          onPointerOut={() => {
            setHovered(false);
          }}
          visible={false}
        >
          <sphereGeometry args={[0.18, 16, 16]} />
          <meshBasicMaterial transparent opacity={0} depthWrite={false} />
        </mesh>
      )}

      {/* 3. Leader Line (shown ONLY when found or during tour focus) */}
      {showLabel && (
        <Line
          points={linePoints}
          color="#005f02"
          lineWidth={2.4}
          transparent
          opacity={0.95}
        />
      )}

      {/* 3. Offset Label Badge (Primary background + Primary border & check) */}
      {showLabel && (
        <Html position={labelWorldPos} zIndexRange={[100, 0]}>
          <div className="flex items-center -translate-y-1/2 select-none pointer-events-none">
            <div
              className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] sm:text-xs font-bold shadow-xl transition-all duration-200 ${
                isTourMode
                  ? "border-primary bg-gradient-to-r from-primary via-primary to-primary-dark text-white ring-2 ring-primary/60 shadow-[0_2px_12px_rgba(0,0,0,0.35)] scale-100"
                  : "border-primary/85 bg-gradient-to-r from-primary to-primary-dark text-white ring-1 ring-primary/30 shadow-md scale-95"
              }`}
            >
              <span className="grid size-3.5 sm:size-4 shrink-0 place-items-center rounded-full bg-[#f6c453] text-[#0f2e12] text-[8px] sm:text-[9px] font-black shadow-sm">
                <Check size={8} strokeWidth={3.5} />
              </span>
              <span className="text-[11px] sm:text-xs font-bold tracking-tight text-white whitespace-nowrap">
                {bone.name}
              </span>
            </div>
          </div>
        </Html>
      )}
    </group>
  );
}

export const SKELETON_X_OFFSET = 0.45;

// Camera controller with smooth transitions and OrbitControls
function SceneCameraController({
  tourActive,
  tourTarget,
  isQuizMode,
  isComplete,
  resetTrigger,
  onResetComplete,
}: {
  tourActive: boolean;
  tourTarget?: { pos: [number, number, number]; lookAt: [number, number, number] };
  isQuizMode?: boolean;
  isComplete?: boolean;
  resetTrigger: number;
  onResetComplete: () => void;
}) {
  const { camera } = useThree();
  const controlsRef = useRef<any>(null);
  const animatingToCenterRef = useRef(false);

  useEffect(() => {
    if (resetTrigger > 0 && controlsRef.current) {
      animatingToCenterRef.current = true;
      onResetComplete();
    }
  }, [resetTrigger, onResetComplete]);

  // When entering quiz mode or completion, smoothly frame the skeleton
  useEffect(() => {
    if (isQuizMode || isComplete) {
      animatingToCenterRef.current = true;
    }
  }, [isQuizMode, isComplete]);

  useFrame((_, delta) => {
    if (!controlsRef.current) return;
    const step = Math.min(1, delta * 3.5);

    if (tourActive && tourTarget) {
      animatingToCenterRef.current = false;
      const targetPos = new THREE.Vector3(...tourTarget.pos);
      const targetLook = new THREE.Vector3(...tourTarget.lookAt);

      camera.position.lerp(targetPos, step);
      controlsRef.current.target.lerp(targetLook, step);
      controlsRef.current.update();
    } else if (animatingToCenterRef.current) {
      const targetPos = isComplete
        ? new THREE.Vector3(SKELETON_X_OFFSET + 0.35, 0.90, 2.15)
        : new THREE.Vector3(0.10, 0.90, 2.15);
      const targetLook = isComplete
        ? new THREE.Vector3(SKELETON_X_OFFSET + 0.35, 0.90, 0)
        : new THREE.Vector3(0.10, 0.90, 0);

      camera.position.lerp(targetPos, step);
      controlsRef.current.target.lerp(targetLook, step);
      controlsRef.current.update();

      if (camera.position.distanceTo(targetPos) < 0.02 && controlsRef.current.target.distanceTo(targetLook) < 0.02) {
        animatingToCenterRef.current = false;
      }
    } else {
      controlsRef.current.update();
    }
  });

  return (
    <OrbitControls
      ref={controlsRef}
      target={isComplete ? [SKELETON_X_OFFSET + 0.35, 0.90, 0] : [0.10, 0.90, 0]}
      enablePan={false}
      minDistance={0.8}
      maxDistance={3.5}
      minPolarAngle={Math.PI / 8}
      maxPolarAngle={Math.PI / 1.8}
      enableDamping={true}
      dampingFactor={0.08}
      onStart={() => {
        animatingToCenterRef.current = false;
      }}
    />
  );
}

export default function SkeletonScene({
  bones,
  spotsState,
  tourActive,
  tourIndex,
  isQuizMode,
  isComplete,
  onPick,
}: {
  bones: readonly BoneDefinition[];
  spotsState: Map<string, boolean>;
  tourActive: boolean;
  tourIndex: number;
  isQuizMode?: boolean;
  isComplete?: boolean;
  onPick: (id: string) => void;
}) {
  const [resetCount, setResetCount] = useState(0);

  const activeTourBone = tourActive && tourIndex >= 1 && tourIndex <= bones.length ? bones[tourIndex - 1] : undefined;

  const tourTarget = activeTourBone
    ? {
        pos: [
          activeTourBone.tourCam.pos[0] + SKELETON_X_OFFSET - 0.28,
          activeTourBone.tourCam.pos[1],
          activeTourBone.tourCam.pos[2],
        ] as [number, number, number],
        lookAt: [
          activeTourBone.tourCam.lookAt[0] + SKELETON_X_OFFSET - 0.28,
          activeTourBone.tourCam.lookAt[1],
          activeTourBone.tourCam.lookAt[2],
        ] as [number, number, number],
      }
    : { pos: [0.10, 0.90, 2.15] as [number, number, number], lookAt: [0.10, 0.90, 0] as [number, number, number] };

  return (
    <div className="relative h-full w-full select-none overflow-hidden bg-[#bed4c8]">
      {/* 3D Canvas rendering the clean room with only AC, Virtual Lab Board, and Skeleton */}
      <Canvas
        shadows
        camera={{ position: [0.10, 0.90, 2.15], fov: 50, near: 0.05 }}
        dpr={[1, 2]}
        gl={{ antialias: true, powerPreference: "high-performance", precision: "highp", toneMappingExposure: 1.0 }}
        style={{ touchAction: "none" }}
      >
        <color attach="background" args={["#bed4c8"]} />

        {/* Lighting matching Chemistry Lab */}
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
        <pointLight position={[-2.6, 4.5, 0.5]} intensity={0.4} decay={0} />
        <pointLight position={[2.6, 4.5, 0.5]} intensity={0.4} decay={0} />

        <Suspense fallback={<SkeletonFallback position={[SKELETON_X_OFFSET, 0, 0]} />}>
          {/* 1. Clean Room Shell with AC and Virtual Lab Notice Board */}
          <CleanLabRoom />

          {/* 2. Skeleton Model on Floor shifted to the right of the guide card */}
          <SkeletonInLab position={[SKELETON_X_OFFSET, 0, 0]} />

          {/* 3. Bone Markers / Hotspots */}
          {bones.map((bone, idx) => (
            <LeaderSpot
              key={bone.id}
              bone={bone}
              isFound={!!spotsState.get(bone.id)}
              isTourFocus={tourActive && tourIndex === idx + 1}
              isTourMode={tourActive}
              onPick={onPick}
              skeletonOffset={[SKELETON_X_OFFSET, 0, 0]}
            />
          ))}
        </Suspense>

        <SceneCameraController
          tourActive={tourActive}
          tourTarget={tourTarget}
          isQuizMode={isQuizMode}
          isComplete={isComplete}
          resetTrigger={resetCount}
          onResetComplete={() => {}}
        />
      </Canvas>
    </div>
  );
}
