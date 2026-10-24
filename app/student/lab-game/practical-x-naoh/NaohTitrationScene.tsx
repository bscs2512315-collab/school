"use client";

import { useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { LabRoom } from "../_scene/LabRoom";
import { ApparatusTourTag } from "../_practical/ApparatusTourTag";
import { getReagentLabel } from "../_practical/reagentLabel";
import { getBuretteScaleTexture } from "./BuretteScale";
import { playClink, playPour, playGrab } from "../_scene/labAudio";

export type TitrationStep = {
  id: number;
  buretteFill: number; // 0 to 50 ml equivalent (0 = empty, 1 = filled to 0 mark, drops to 10.1 mL consumed)
  flaskVolume: number; // 0 = empty, 10 = oxalic acid added, 20.1 = titrated
  flaskColor: string;
  flaskOpacity: number;
  stopcockOpen: boolean;
  isSwirling: boolean;
  pipetteState: "rest" | "drawing" | "dispensing" | "done";
  dropperState: "rest" | "dropping" | "done";
  activeApparatus: "burette" | "flask" | "pipette" | "dropper" | "tile" | "naoh" | "oxalic" | null;
};

// Tour items mapped to 3D world positions
export const TITRATION_TOUR_ITEMS = [
  "Burette & Stand",
  "Conical Flask",
  "White Ceramic Tile",
  "10 cm³ Volumetric Pipette",
  "Standard 0.1 M Oxalic Acid",
  "NaOH Solution",
  "Phenolphthalein Indicator",
];

const TOUR_TARGETS: { pos: [number, number, number]; look: [number, number, number]; tagPos: [number, number, number] }[] = [
  // 1. Burette & Stand
  { pos: [0.35, 1.75, 1.2], look: [0.0, 1.65, 0.4], tagPos: [0.0, 1.95, 0.4] },
  // 2. Conical Flask
  { pos: [0.25, 1.35, 0.95], look: [0.0, 1.15, 0.4], tagPos: [0.0, 1.32, 0.4] },
  // 3. White Ceramic Tile
  { pos: [0.15, 1.32, 0.85], look: [0.0, 1.09, 0.4], tagPos: [0.0, 1.15, 0.4] },
  // 4. 10 cm³ Pipette
  { pos: [-0.15, 1.42, 1.1], look: [-0.22, 1.25, 0.52], tagPos: [-0.22, 1.48, 0.52] },
  // 5. Standard 0.1 M Oxalic Acid
  { pos: [-0.25, 1.35, 1.1], look: [-0.42, 1.15, 0.52], tagPos: [-0.42, 1.38, 0.52] },
  // 6. NaOH Solution
  { pos: [0.32, 1.35, 1.1], look: [0.42, 1.18, 0.48], tagPos: [0.42, 1.42, 0.48] },
  // 7. Phenolphthalein Indicator
  { pos: [0.22, 1.32, 1.0], look: [0.26, 1.12, 0.55], tagPos: [0.26, 1.32, 0.55] },
];

// ---- Camera Controller with smooth lerp & zoom modes ---------------------
function CameraRig({
  intro,
  introIdx,
  zoom,
  zoomTarget = "meniscus",
}: {
  intro: boolean;
  introIdx: number;
  zoom: boolean;
  zoomTarget?: "meniscus" | "flask";
}) {
  const { camera } = useThree();
  const targetPos = useMemo(() => new THREE.Vector3(), []);
  const targetLook = useMemo(() => new THREE.Vector3(), []);
  const curLook = useRef(new THREE.Vector3(0, 1.4, 0.4));

  useFrame(() => {
    if (intro && introIdx > 0 && introIdx <= TOUR_TARGETS.length) {
      const t = TOUR_TARGETS[introIdx - 1];
      targetPos.set(...t.pos);
      targetLook.set(...t.look);
    } else if (zoom) {
      if (zoomTarget === "meniscus") {
        // Extreme close-up on the burette meniscus around 10.1 mL (y ≈ 1.62)
        targetPos.set(0.0, 1.60, 0.72);
        targetLook.set(0.0, 1.60, 0.4);
      } else {
        // Close-up on the conical flask on the white tile
        targetPos.set(0.12, 1.25, 0.78);
        targetLook.set(0.0, 1.15, 0.4);
      }
    } else {
      // Standard practical bench view
      targetPos.set(0.0, 1.52, 1.28);
      targetLook.set(0.0, 1.38, 0.4);
    }

    camera.position.lerp(targetPos, 0.08);
    curLook.current.lerp(targetLook, 0.08);
    camera.lookAt(curLook.current);
  });

  return null;
}

// ---- Droplet System (falling liquid from burette to flask) ----------------
function DropletStream({ active, count = 6 }: { active: boolean; count?: number }) {
  const gRef = useRef<THREE.Group>(null);
  const drops = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        speed: 1.6 + Math.random() * 0.4,
        offset: i / count,
      })),
    [count]
  );
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const instRef = useRef<THREE.InstancedMesh>(null);

  useFrame((s) => {
    if (!instRef.current) return;
    const t = s.clock.elapsedTime;
    const topY = 1.22;
    const botY = 1.11;
    const dist = topY - botY;

    drops.forEach((d, i) => {
      if (!active) {
        dummy.position.set(0, -10, 0);
        dummy.scale.setScalar(0.0001);
      } else {
        const prog = (t * d.speed + d.offset) % 1;
        const y = topY - prog * dist;
        // tear-drop stretch
        dummy.position.set(0, y, 0.38);
        dummy.scale.set(0.003, 0.007 * (1 + prog * 0.5), 0.003);
      }
      dummy.updateMatrix();
      instRef.current!.setMatrixAt(i, dummy.matrix);
    });
    instRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <group ref={gRef}>
      <instancedMesh ref={instRef} args={[undefined, undefined, count]}>
        <sphereGeometry args={[1, 8, 8]} />
        <meshStandardMaterial color="#f0f7ff" transparent opacity={0.85} roughness={0.1} metalness={0.1} />
      </instancedMesh>
    </group>
  );
}

// ---- Retort Stand & Burette Clamp ----------------------------------------
function RetortStand() {
  const ironMat = <meshStandardMaterial color="#22252a" roughness={0.65} metalness={0.7} />;
  const chromeMat = <meshStandardMaterial color="#e2e8f0" roughness={0.15} metalness={0.95} />;
  const rubberMat = <meshStandardMaterial color="#334155" roughness={0.8} metalness={0.2} />;

  return (
    <group position={[-0.18, 1.08, 0.38]}>
      {/* Heavy cast-iron rectangular base */}
      <mesh position={[0, 0.012, 0]}>
        <boxGeometry args={[0.18, 0.024, 0.30]} />
        {ironMat}
      </mesh>
      {/* Rubber feet */}
      {[-0.07, 0.07].map((x) =>
        [-0.12, 0.12].map((z) => (
          <mesh key={`${x}-${z}`} position={[x, 0.002, z]}>
            <cylinderGeometry args={[0.012, 0.012, 0.004, 12]} />
            <meshBasicMaterial color="#0f172a" />
          </mesh>
        ))
      )}

      {/* Upright stainless steel rod */}
      <mesh position={[0.04, 0.65, -0.09]}>
        <cylinderGeometry args={[0.006, 0.006, 1.28, 16]} />
        {chromeMat}
      </mesh>

      {/* Clamp Bosshead 1 (lower) */}
      <group position={[0.04, 0.58, -0.09]}>
        <mesh>
          <boxGeometry args={[0.026, 0.034, 0.026]} />
          {ironMat}
        </mesh>
        {/* Clamp Arm extending to burette */}
        <mesh position={[0.07, 0, 0.045]} rotation={[0, -0.58, 0]}>
          <cylinderGeometry args={[0.004, 0.004, 0.16, 12]} />
          {chromeMat}
        </mesh>
        {/* Lower clamp jaw */}
        <group position={[0.14, 0, 0.09]}>
          <mesh rotation={[0, 0, Math.PI / 2]}>
            <torusGeometry args={[0.017, 0.004, 8, 16, Math.PI * 1.5]} />
            {rubberMat}
          </mesh>
        </group>
      </group>

      {/* Clamp Bosshead 2 (upper stabilizer) */}
      <group position={[0.04, 0.88, -0.09]}>
        <mesh>
          <boxGeometry args={[0.026, 0.034, 0.026]} />
          {ironMat}
        </mesh>
        <mesh position={[0.07, 0, 0.045]} rotation={[0, -0.58, 0]}>
          <cylinderGeometry args={[0.004, 0.004, 0.16, 12]} />
          {chromeMat}
        </mesh>
        <group position={[0.14, 0, 0.09]}>
          <mesh rotation={[0, 0, Math.PI / 2]}>
            <torusGeometry args={[0.017, 0.004, 8, 16, Math.PI * 1.5]} />
            {rubberMat}
          </mesh>
        </group>
      </group>
    </group>
  );
}

// ---- White Ceramic Tile ---------------------------------------------------
function WhiteTile() {
  return (
    <group position={[0.0, 1.08, 0.38]}>
      {/* Glazed porcelain slab with subtle bevel */}
      <mesh position={[0, 0.006, 0]}>
        <boxGeometry args={[0.24, 0.012, 0.24]} />
        <meshStandardMaterial color="#ffffff" roughness={0.06} metalness={0.02} />
      </mesh>
      {/* Glossy ceramic surface top sheet */}
      <mesh position={[0, 0.0125, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.236, 0.236]} />
        <meshStandardMaterial color="#ffffff" roughness={0.04} metalness={0.05} />
      </mesh>
    </group>
  );
}

// ---- 50 cm³ Precision Graduated Burette -----------------------------------
function Burette({
  fillProgress, // 0 = empty, 1 = filled to 0 mL mark, decreases to ~0.798 as 10.1 mL is discharged
  stopcockOpen,
  onClickStopcock,
}: {
  fillProgress: number;
  stopcockOpen: boolean;
  onClickStopcock?: () => void;
}) {
  const scaleTex = useMemo(() => getBuretteScaleTexture(), []);
  const stopcockHandleRef = useRef<THREE.Group>(null);
  const liquidRef = useRef<THREE.Mesh>(null);
  const meniscusRef = useRef<THREE.Mesh>(null);

  useFrame((_, delta) => {
    if (stopcockHandleRef.current) {
      const targetRot = stopcockOpen ? Math.PI / 2 : 0;
      stopcockHandleRef.current.rotation.z = THREE.MathUtils.damp(
        stopcockHandleRef.current.rotation.z,
        targetRot,
        14,
        delta
      );
    }

    if (liquidRef.current && meniscusRef.current) {
      // Burette graduated tube is from y = 1.36 to y = 1.94 (total span 0.58m)
      const topY = 1.92;
      const bottomY = 1.36;
      const span = topY - bottomY;
      const currentHeight = Math.max(0.001, fillProgress * span);
      const currentLiquidTop = bottomY + currentHeight;

      liquidRef.current.scale.y = currentHeight / span;
      liquidRef.current.position.y = bottomY + currentHeight / 2;

      meniscusRef.current.position.y = currentLiquidTop;
      meniscusRef.current.visible = fillProgress > 0.02;
    }
  });

  return (
    <group position={[0.0, 0, 0.38]}>
      {/* 1. Main graduated glass tube */}
      <mesh position={[0, 1.65, 0]}>
        <cylinderGeometry args={[0.0125, 0.0125, 0.62, 32, 1, true]} />
        <meshStandardMaterial
          transparent
          opacity={0.35}
          roughness={0.05}
          metalness={0.15}
          color="#dbeafe"
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>

      {/* Graduation scale texture overlay cylinder */}
      <mesh position={[0, 1.65, 0]}>
        <cylinderGeometry args={[0.0127, 0.0127, 0.60, 32, 1, true]} />
        <meshBasicMaterial map={scaleTex} transparent opacity={0.9} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>

      {/* Burette top flare / rim */}
      <mesh position={[0, 1.96, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.0135, 0.003, 8, 24]} />
        <meshStandardMaterial color="#cbd5e1" roughness={0.1} metalness={0.2} transparent opacity={0.6} />
      </mesh>

      {/* 2. Liquid column inside burette */}
      <mesh ref={liquidRef} position={[0, 1.64, 0]}>
        <cylinderGeometry args={[0.011, 0.011, 0.58, 24]} />
        <meshStandardMaterial
          color="#e0f2fe"
          transparent
          opacity={fillProgress > 0.01 ? 0.68 : 0}
          roughness={0.2}
          depthWrite={false}
        />
      </mesh>

      {/* Curved Meniscus surface disk */}
      <mesh ref={meniscusRef} position={[0, 1.92, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.011, 24]} />
        <meshStandardMaterial color="#bae6fd" roughness={0.1} metalness={0.3} transparent opacity={0.8} />
      </mesh>

      {/* 3. Lower glass funnel taper into stopcock */}
      <mesh position={[0, 1.34, 0]}>
        <cylinderGeometry args={[0.0125, 0.005, 0.04, 24, 1, true]} />
        <meshStandardMaterial transparent opacity={0.4} color="#dbeafe" side={THREE.DoubleSide} depthWrite={false} />
      </mesh>

      {/* 4. Stopcock Barrel & Rotatable Valve */}
      <group position={[0, 1.30, 0]}>
        {/* Glass housing cross */}
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.008, 0.008, 0.038, 16]} />
          <meshStandardMaterial color="#cbd5e1" transparent opacity={0.5} roughness={0.1} depthWrite={false} />
        </mesh>
        {/* Rotatable Valve Key / Handle */}
        <group ref={stopcockHandleRef} onClick={onClickStopcock}>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.006, 0.006, 0.046, 16]} />
            <meshStandardMaterial color="#0284c7" roughness={0.3} metalness={0.4} />
          </mesh>
          {/* Valve Wing Handle tabs */}
          <mesh position={[0, 0, 0.024]} rotation={[0, 0, 0]}>
            <boxGeometry args={[0.022, 0.008, 0.006]} />
            <meshStandardMaterial color="#0369a1" roughness={0.3} metalness={0.4} />
          </mesh>
        </group>
      </group>

      {/* 5. Narrow glass jet tip */}
      <mesh position={[0, 1.25, 0]}>
        <cylinderGeometry args={[0.004, 0.0018, 0.06, 16, 1, true]} />
        <meshStandardMaterial transparent opacity={0.45} color="#dbeafe" side={THREE.DoubleSide} depthWrite={false} />
      </mesh>
    </group>
  );
}

// ---- 250 cm³ Conical (Erlenmeyer) Flask ------------------------------------
function ConicalFlask({
  volume, // 0 = empty, 10 = oxalic acid (approx 0.35 fill), 20.1 = titrated (approx 0.65 fill)
  color,
  opacity,
  isSwirling,
  position = [0.0, 1.092, 0.38],
  onClick,
}: {
  volume: number;
  color: string;
  opacity: number;
  isSwirling: boolean;
  position?: [number, number, number];
  onClick?: () => void;
}) {
  const gRef = useRef<THREE.Group>(null);
  const liquidMatRef = useRef<THREE.MeshStandardMaterial>(null);
  const curColor = useMemo(() => new THREE.Color(color), []);

  useFrame((s, delta) => {
    if (!gRef.current) return;
    if (isSwirling) {
      const t = s.clock.elapsedTime * 14;
      gRef.current.position.x = position[0] + Math.cos(t) * 0.008;
      gRef.current.position.z = position[2] + Math.sin(t) * 0.008;
      gRef.current.rotation.z = Math.sin(t) * 0.04;
      gRef.current.rotation.x = Math.cos(t) * 0.04;
    } else {
      gRef.current.position.x = THREE.MathUtils.damp(gRef.current.position.x, position[0], 8, delta);
      gRef.current.position.z = THREE.MathUtils.damp(gRef.current.position.z, position[2], 8, delta);
      gRef.current.rotation.z = THREE.MathUtils.damp(gRef.current.rotation.z, 0, 8, delta);
      gRef.current.rotation.x = THREE.MathUtils.damp(gRef.current.rotation.x, 0, 8, delta);
    }

    if (liquidMatRef.current) {
      curColor.lerp(new THREE.Color(color), 0.12);
      liquidMatRef.current.color.copy(curColor);
      liquidMatRef.current.opacity = THREE.MathUtils.lerp(liquidMatRef.current.opacity, opacity, 0.12);
    }
  });

  const liquidFillRatio = Math.min(1, volume / 25); // 0 to 1
  const baseRadius = 0.052;
  const neckRadius = 0.016;

  return (
    <group ref={gRef} position={position} onClick={onClick}>
      {/* Flask Glass Body (conical body + cylindrical neck) */}
      {/* Lower conical base */}
      <mesh position={[0, 0.045, 0]}>
        <cylinderGeometry args={[neckRadius, baseRadius, 0.09, 32, 1, true]} />
        <meshStandardMaterial transparent opacity={0.38} color="#e2e8f0" roughness={0.06} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>
      {/* Flat base plate */}
      <mesh position={[0, 0.002, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[baseRadius, 32]} />
        <meshStandardMaterial transparent opacity={0.45} color="#cbd5e1" roughness={0.08} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>
      {/* Cylindrical neck */}
      <mesh position={[0, 0.11, 0]}>
        <cylinderGeometry args={[neckRadius, neckRadius, 0.045, 32, 1, true]} />
        <meshStandardMaterial transparent opacity={0.38} color="#e2e8f0" roughness={0.06} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>
      {/* Beaded Top Rim */}
      <mesh position={[0, 0.133, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[neckRadius + 0.0015, 0.0025, 8, 24]} />
        <meshStandardMaterial color="#cbd5e1" roughness={0.1} transparent opacity={0.6} />
      </mesh>

      {/* Graduation Rings on Conical Glass */}
      {[0.025, 0.045, 0.065].map((y, i) => {
        const r = THREE.MathUtils.lerp(baseRadius, neckRadius, y / 0.09);
        return (
          <mesh key={i} position={[0, y, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[r + 0.0005, 0.0006, 4, 24]} />
            <meshBasicMaterial color="#64748b" transparent opacity={0.5} />
          </mesh>
        );
      })}

      {/* Liquid Mesh inside Conical Flask */}
      {volume > 0.1 && (
        <group position={[0, 0.002, 0]}>
          <mesh position={[0, (0.075 * liquidFillRatio) / 2, 0]}>
            <cylinderGeometry
              args={[
                THREE.MathUtils.lerp(baseRadius - 0.003, neckRadius + 0.002, liquidFillRatio),
                baseRadius - 0.003,
                0.075 * liquidFillRatio,
                24,
              ]}
            />
            <meshStandardMaterial
              ref={liquidMatRef}
              color={color}
              transparent
              opacity={opacity}
              roughness={0.2}
              depthWrite={false}
            />
          </mesh>
          {/* Top surface meniscus inside flask */}
          <mesh
            position={[0, 0.075 * liquidFillRatio, 0]}
            rotation={[-Math.PI / 2, 0, 0]}
          >
            <circleGeometry
              args={[THREE.MathUtils.lerp(baseRadius - 0.003, neckRadius + 0.002, liquidFillRatio), 24]}
            />
            <meshStandardMaterial color={color} transparent opacity={opacity * 0.9} roughness={0.1} />
          </mesh>
        </group>
      )}
    </group>
  );
}

// ---- 10 cm³ Volumetric Pipette -------------------------------------------
function VolumetricPipette({
  state, // "rest" | "drawing" | "dispensing" | "done"
}: {
  state: "rest" | "drawing" | "dispensing" | "done";
}) {
  const gRef = useRef<THREE.Group>(null);
  const liquidRef = useRef<THREE.Mesh>(null);

  useFrame((_, delta) => {
    if (!gRef.current) return;
    let targetP: [number, number, number] = [-0.22, 1.25, 0.52]; // rest rack
    let targetR: [number, number, number] = [0, 0, 0.1];
    let liquidFill = 0;

    if (state === "drawing") {
      // Dips into oxalic acid beaker at [-0.42, 1.15, 0.52]
      targetP = [-0.42, 1.28, 0.52];
      targetR = [0, 0, 0];
      liquidFill = 1;
    } else if (state === "dispensing") {
      // Moves above conical flask at [0.0, 1.35, 0.38]
      targetP = [0.0, 1.32, 0.38];
      targetR = [0, 0, 0];
      liquidFill = 0.3;
    } else if (state === "done") {
      targetP = [-0.24, 1.22, 0.52];
      targetR = [0, 0, 0.15];
      liquidFill = 0;
    }

    gRef.current.position.x = THREE.MathUtils.damp(gRef.current.position.x, targetP[0], 6, delta);
    gRef.current.position.y = THREE.MathUtils.damp(gRef.current.position.y, targetP[1], 6, delta);
    gRef.current.position.z = THREE.MathUtils.damp(gRef.current.position.z, targetP[2], 6, delta);
    gRef.current.rotation.z = THREE.MathUtils.damp(gRef.current.rotation.z, targetR[2], 6, delta);

    if (liquidRef.current) {
      liquidRef.current.scale.y = THREE.MathUtils.lerp(liquidRef.current.scale.y, Math.max(0.001, liquidFill), 0.1);
    }
  });

  return (
    <group ref={gRef} position={[-0.22, 1.25, 0.52]}>
      {/* Pipette glass body: narrow upper stem, center expansion bulb, narrow jet tip */}
      {/* Upper Stem */}
      <mesh position={[0, 0.08, 0]}>
        <cylinderGeometry args={[0.0035, 0.0035, 0.16, 16, 1, true]} />
        <meshStandardMaterial transparent opacity={0.42} color="#dbeafe" side={THREE.DoubleSide} depthWrite={false} />
      </mesh>
      {/* 10 mL ring calibration mark on stem */}
      <mesh position={[0, 0.11, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.0038, 0.0007, 6, 16]} />
        <meshBasicMaterial color="#2563eb" />
      </mesh>

      {/* Center Bulb (10 cm³) */}
      <mesh position={[0, -0.04, 0]}>
        <cylinderGeometry args={[0.011, 0.011, 0.08, 20, 1, true]} />
        <meshStandardMaterial transparent opacity={0.42} color="#dbeafe" side={THREE.DoubleSide} depthWrite={false} />
      </mesh>
      {/* Tapers around bulb */}
      <mesh position={[0, 0.01, 0]}>
        <cylinderGeometry args={[0.0035, 0.011, 0.02, 16, 1, true]} />
        <meshStandardMaterial transparent opacity={0.42} color="#dbeafe" side={THREE.DoubleSide} depthWrite={false} />
      </mesh>
      <mesh position={[0, -0.09, 0]}>
        <cylinderGeometry args={[0.011, 0.003, 0.02, 16, 1, true]} />
        <meshStandardMaterial transparent opacity={0.42} color="#dbeafe" side={THREE.DoubleSide} depthWrite={false} />
      </mesh>

      {/* Lower jet tip */}
      <mesh position={[0, -0.15, 0]}>
        <cylinderGeometry args={[0.003, 0.0015, 0.10, 16, 1, true]} />
        <meshStandardMaterial transparent opacity={0.42} color="#dbeafe" side={THREE.DoubleSide} depthWrite={false} />
      </mesh>

      {/* Top Rubber Pipette Filler / Bulb */}
      <mesh position={[0, 0.18, 0]}>
        <sphereGeometry args={[0.016, 16, 16]} />
        <meshStandardMaterial color="#dc2626" roughness={0.7} metalness={0.1} />
      </mesh>

      {/* Liquid Column inside pipette */}
      <mesh ref={liquidRef} position={[0, -0.04, 0]}>
        <cylinderGeometry args={[0.009, 0.009, 0.075, 16]} />
        <meshStandardMaterial color="#f0f9ff" transparent opacity={0.75} roughness={0.2} depthWrite={false} />
      </mesh>
    </group>
  );
}

// ---- Phenolphthalein Dropper Bottle & Dropper -----------------------------
function PhenolphthaleinBottle({
  dropperState,
}: {
  dropperState: "rest" | "dropping" | "done";
}) {
  const labelTex = useMemo(() => getReagentLabel("Phenolphthalein"), []);
  const dropperGRef = useRef<THREE.Group>(null);

  useFrame((s, delta) => {
    if (!dropperGRef.current) return;
    let targetP: [number, number, number] = [0, 0.065, 0]; // seated in bottle neck
    let targetR: [number, number, number] = [0, 0, 0];

    if (dropperState === "dropping") {
      // Lifts and moves over conical flask
      const wobble = Math.sin(s.clock.elapsedTime * 6) * 0.01;
      targetP = [-0.26, 0.28 + wobble, -0.17];
      targetR = [0, 0, 0.1];
    } else {
      targetP = [0, 0.065, 0];
      targetR = [0, 0, 0];
    }

    dropperGRef.current.position.x = THREE.MathUtils.damp(dropperGRef.current.position.x, targetP[0], 6, delta);
    dropperGRef.current.position.y = THREE.MathUtils.damp(dropperGRef.current.position.y, targetP[1], 6, delta);
    dropperGRef.current.position.z = THREE.MathUtils.damp(dropperGRef.current.position.z, targetP[2], 6, delta);
    dropperGRef.current.rotation.z = THREE.MathUtils.damp(dropperGRef.current.rotation.z, targetR[2], 6, delta);
  });

  return (
    <group position={[0.26, 1.08, 0.55]}>
      {/* Amber Glass Dropper Bottle */}
      <mesh position={[0, 0.045, 0]}>
        <cylinderGeometry args={[0.024, 0.024, 0.09, 24]} />
        <meshStandardMaterial color="#78350f" transparent opacity={0.88} roughness={0.15} metalness={0.1} />
      </mesh>
      {/* Bottle Shoulder & Neck */}
      <mesh position={[0, 0.095, 0]}>
        <cylinderGeometry args={[0.012, 0.024, 0.02, 24]} />
        <meshStandardMaterial color="#78350f" transparent opacity={0.88} roughness={0.15} />
      </mesh>
      <mesh position={[0, 0.11, 0]}>
        <cylinderGeometry args={[0.012, 0.012, 0.018, 24]} />
        <meshStandardMaterial color="#78350f" transparent opacity={0.88} roughness={0.15} />
      </mesh>

      {/* Label Sticker */}
      <mesh position={[0, 0.045, 0.025]} rotation={[0, 0, 0]}>
        <planeGeometry args={[0.038, 0.038]} />
        <meshBasicMaterial map={labelTex} transparent side={THREE.DoubleSide} />
      </mesh>

      {/* Dropper Assembly (Pipette tube + black rubber teat) */}
      <group ref={dropperGRef} position={[0, 0.065, 0]}>
        {/* Glass dropper tube */}
        <mesh position={[0, 0, 0]}>
          <cylinderGeometry args={[0.003, 0.0015, 0.08, 12]} />
          <meshStandardMaterial transparent opacity={0.6} color="#ffffff" roughness={0.1} />
        </mesh>
        {/* Black Rubber Teat */}
        <mesh position={[0, 0.05, 0]}>
          <sphereGeometry args={[0.01, 16, 16]} />
          <meshStandardMaterial color="#1e293b" roughness={0.8} />
        </mesh>
      </group>
    </group>
  );
}

// ---- Standard 0.1 M Oxalic Acid Beaker ------------------------------------
function OxalicAcidBeaker() {
  const labelTex = useMemo(() => getReagentLabel("0.1 M Oxalic Acid"), []);
  return (
    <group position={[-0.42, 1.08, 0.52]}>
      {/* Glass Beaker */}
      <mesh position={[0, 0.055, 0]}>
        <cylinderGeometry args={[0.036, 0.036, 0.11, 28, 1, true]} />
        <meshStandardMaterial transparent opacity={0.4} color="#e0f2fe" side={THREE.DoubleSide} depthWrite={false} />
      </mesh>
      <mesh position={[0, 0.002, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.036, 28]} />
        <meshStandardMaterial transparent opacity={0.5} color="#cbd5e1" side={THREE.DoubleSide} depthWrite={false} />
      </mesh>
      {/* Solution inside beaker */}
      <mesh position={[0, 0.038, 0]}>
        <cylinderGeometry args={[0.034, 0.034, 0.075, 24]} />
        <meshStandardMaterial color="#f0f9ff" transparent opacity={0.65} roughness={0.2} depthWrite={false} />
      </mesh>
      {/* Label */}
      <mesh position={[0, 0.055, 0.037]}>
        <planeGeometry args={[0.046, 0.036]} />
        <meshBasicMaterial map={labelTex} transparent side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

// ---- NaOH Reagent Solution Bottle -----------------------------------------
function NaohBottle() {
  const labelTex = useMemo(() => getReagentLabel("NaOH Solution"), []);
  return (
    <group position={[0.42, 1.08, 0.48]}>
      {/* Reagent Bottle */}
      <mesh position={[0, 0.065, 0]}>
        <cylinderGeometry args={[0.038, 0.038, 0.13, 28]} />
        <meshStandardMaterial color="#f8fafc" transparent opacity={0.7} roughness={0.12} metalness={0.1} />
      </mesh>
      {/* Stopper cap */}
      <mesh position={[0, 0.145, 0]}>
        <cylinderGeometry args={[0.016, 0.018, 0.03, 20]} />
        <meshStandardMaterial color="#334155" roughness={0.3} metalness={0.2} />
      </mesh>
      {/* Solution inside */}
      <mesh position={[0, 0.05, 0]}>
        <cylinderGeometry args={[0.035, 0.035, 0.10, 24]} />
        <meshStandardMaterial color="#f0f9ff" transparent opacity={0.75} roughness={0.2} depthWrite={false} />
      </mesh>
      {/* Label */}
      <mesh position={[0, 0.065, 0.039]}>
        <planeGeometry args={[0.05, 0.04]} />
        <meshBasicMaterial map={labelTex} transparent side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

// ---- Main Scene Renderer --------------------------------------------------
export default function NaohTitrationScene({
  step,
  titrationState,
  intro,
  introIdx,
  zoom,
  onAct,
  onToggleStopcock,
}: {
  step: number;
  titrationState: TitrationStep;
  intro: boolean;
  introIdx: number;
  zoom: boolean;
  onAct?: () => void;
  onToggleStopcock?: () => void;
}) {
  return (
    <Canvas
      shadows
      camera={{ position: [0.0, 1.52, 1.28], fov: 58, near: 0.05 }}
      dpr={[1, 2]}
      gl={{ antialias: true, powerPreference: "high-performance", precision: "highp" }}
      style={{ touchAction: "none" }}
    >
      <CameraRig
        intro={intro}
        introIdx={introIdx}
        zoom={zoom}
        zoomTarget={step === 7 || step === 8 ? "meniscus" : "flask"}
      />

      {/* ExBoard Lab Lighting */}
      <ambientLight intensity={0.8} />
      <directionalLight position={[2, 4, 3]} intensity={1.5} castShadow shadow-mapSize={1024} />
      <directionalLight position={[-2, 3, -1]} intensity={0.6} />
      <pointLight position={[0, 2.2, 0.5]} intensity={0.9} distance={4} />

      {/* Shared 3D Lab Environment */}
      <LabRoom />

      {/* Bench Apparatus for Titration */}
      <RetortStand />
      <WhiteTile />
      <Burette
        fillProgress={titrationState.buretteFill}
        stopcockOpen={titrationState.stopcockOpen}
        onClickStopcock={onToggleStopcock}
      />
      <DropletStream active={titrationState.stopcockOpen} />
      <ConicalFlask
        volume={titrationState.flaskVolume}
        color={titrationState.flaskColor}
        opacity={titrationState.flaskOpacity}
        isSwirling={titrationState.isSwirling}
      />
      <VolumetricPipette state={titrationState.pipetteState} />
      <PhenolphthaleinBottle dropperState={titrationState.dropperState} />
      <OxalicAcidBeaker />
      <NaohBottle />

      {/* Intro Apparatus Tour 3D Tag (one active focused tag at a time) */}
      {intro && introIdx > 0 && introIdx <= TOUR_TARGETS.length && (
        <ApparatusTourTag
          at={TOUR_TARGETS[introIdx - 1].tagPos}
          name={TITRATION_TOUR_ITEMS[introIdx - 1]}
          number={introIdx}
        />
      )}
    </Canvas>
  );
}
