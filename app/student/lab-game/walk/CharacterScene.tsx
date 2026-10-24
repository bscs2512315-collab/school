"use client";

/**
 * First-person lab POV. You ARE the student: the camera is your eyes and your
 * gloved hands (blue nitrile) with white lab-coat sleeves sit in view.
 *
 *   • Up/Down (W/S)      walk forward / back
 *   • Left/Right (A/D)   turn
 *   • drag mouse         look around
 */

import { useEffect, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { RoundedBox } from "@react-three/drei";
import * as THREE from "three";
import { LabRoom } from "../_scene/LabRoom";
import { ChemLab, HeldExtinguisher, STOVE, EXT } from "./ChemLab";
import { useLoopSound, playStep } from "../_scene/labAudio";

// Room bounds + furniture footprints to walk around (not through).
export const MIN_X = -6.8;
export const MAX_X = 6.8;
export const MIN_Z = -5.3;
export const MAX_Z = 5.8;
const CHAR_R = 0.4;
const OBSTACLES = [
  { minX: -2.8, maxX: 2.8, minZ: -0.8, maxZ: 1.05 }, // main bench
  { minX: -3.7, maxX: 3.7, minZ: -6.5, maxZ: -5.5 }, // back counter
];
export function blocked(x: number, z: number): boolean {
  return OBSTACLES.some(
    (o) => x > o.minX - CHAR_R && x < o.maxX + CHAR_R && z > o.minZ - CHAR_R && z < o.maxZ + CHAR_R,
  );
}

const GLOVE = "#3f7fd6"; // blue nitrile glove
const GLOVE_D = "#356fc0";
const SLEEVE = "#f4f5f6"; // white lab-coat sleeve

function GloveMat() {
  return <meshStandardMaterial color={GLOVE} roughness={0.32} metalness={0.05} />;
}

// A finger: two capsule segments with a knuckle bend, for a natural curl.
function Finger({
  base,
  len1,
  len2,
  r,
  bend,
  spread,
}: {
  base: [number, number, number];
  len1: number;
  len2: number;
  r: number;
  bend: number;
  spread: number;
}) {
  return (
    <group position={base} rotation={[-0.3, spread, 0]}>
      {/* proximal segment (points -z) */}
      <mesh position={[0, 0, -len1 / 2]} rotation={[Math.PI / 2, 0, 0]}>
        <capsuleGeometry args={[r, len1, 4, 12]} />
        <GloveMat />
      </mesh>
      {/* distal segment, bent at the knuckle */}
      <group position={[0, 0, -len1]} rotation={[bend, 0, 0]}>
        <mesh position={[0, 0, -len2 / 2]} rotation={[Math.PI / 2, 0, 0]}>
          <capsuleGeometry args={[r * 0.88, len2, 4, 12]} />
          <GloveMat />
        </mesh>
      </group>
    </group>
  );
}

// One gloved hand + sleeve, posed in view space (fingers pointing away, -z).
export function Hand({ side }: { side: number }) {
  // index, middle, ring, pinky — varying length + slight fan
  const cols = [
    { x: -0.036, l1: 0.05, l2: 0.042, sp: -0.14, r: 0.0135 },
    { x: -0.012, l1: 0.056, l2: 0.048, sp: -0.05, r: 0.0145 },
    { x: 0.012, l1: 0.05, l2: 0.044, sp: 0.05, r: 0.0135 },
    { x: 0.035, l1: 0.04, l2: 0.036, sp: 0.15, r: 0.012 },
  ];
  return (
    <group position={[0.19 * side, -0.32, -0.52]} rotation={[-0.5, side * 0.22, side * -0.12]}>
      {/* white lab-coat sleeve (recedes toward the viewer) */}
      <mesh position={[0, 0, 0.26]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.058, 0.075, 0.4, 20]} />
        <meshStandardMaterial color={SLEEVE} roughness={0.55} />
      </mesh>
      {/* blue glove cuff */}
      <mesh position={[0, 0, 0.055]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.056, 0.06, 0.09, 20]} />
        <meshStandardMaterial color={GLOVE_D} roughness={0.35} />
      </mesh>
      {/* rounded palm (back of hand) */}
      <RoundedBox args={[0.095, 0.05, 0.14]} radius={0.023} smoothness={4} position={[0, 0, -0.05]} castShadow>
        <GloveMat />
      </RoundedBox>
      {/* knuckle ridge */}
      <RoundedBox args={[0.088, 0.036, 0.03]} radius={0.014} smoothness={4} position={[0, 0.006, -0.12]}>
        <GloveMat />
      </RoundedBox>
      {/* fingers */}
      {cols.map((c, i) => (
        <Finger key={i} base={[c.x, 0, -0.13]} len1={c.l1} len2={c.l2} r={c.r} bend={-0.5} spread={c.sp} />
      ))}
      {/* thumb (inner side, two segments) */}
      <group position={[side * -0.045, -0.005, -0.02]} rotation={[-0.15, side * 0.5, side * 0.9]}>
        <mesh position={[0, 0, -0.03]} rotation={[Math.PI / 2, 0, 0]}>
          <capsuleGeometry args={[0.016, 0.05, 4, 12]} />
          <GloveMat />
        </mesh>
        <group position={[0, 0, -0.055]} rotation={[-0.4, 0, 0]}>
          <mesh position={[0, 0, -0.022]} rotation={[Math.PI / 2, 0, 0]}>
            <capsuleGeometry args={[0.014, 0.04, 4, 12]} />
            <GloveMat />
          </mesh>
        </group>
      </group>
    </group>
  );
}

function FirstPerson({
  holding,
  stoveOn,
  onToggleStove,
  onToggleHold,
  onToggleWater,
  sprayingRef,
  onExtinguish,
}: {
  holding: boolean;
  stoveOn: boolean;
  onToggleStove: () => void;
  onToggleHold: (nearExt: boolean) => void;
  onToggleWater: () => void;
  sprayingRef: { current: boolean };
  onExtinguish: () => void;
}) {
  const { camera } = useThree();
  const hands = useRef<THREE.Group>(null);
  const keys = useRef<Record<string, boolean>>({});
  const yaw = useRef(0);
  const pitch = useRef(-0.25); // start looking slightly down toward the bench
  const dragging = useRef(false);
  const last = useRef({ x: 0, y: 0 });
  const pos = useRef(new THREE.Vector3(0, 1.55, 3.6));
  const bobPhase = useRef(0);
  const stepAccum = useRef(0);
  const fDown = useRef(false);
  const eDown = useRef(false);
  const wDown = useRef(false);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      keys.current[k] = true;
      if (["arrowup", "arrowdown", "arrowleft", "arrowright", " "].includes(k)) e.preventDefault();
      if (k === " ") sprayingRef.current = true;
      if (k === "f" && !fDown.current) {
        fDown.current = true;
        onToggleStove();
      }
      if (k === "e" && !eDown.current) {
        eDown.current = true;
        onToggleHold(pos.current.distanceTo(EXT) < 2.6);
      }
      if (k === "t" && !wDown.current) {
        wDown.current = true;
        onToggleWater();
      }
    };
    const up = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      keys.current[k] = false;
      if (k === " ") sprayingRef.current = false;
      if (k === "f") fDown.current = false;
      if (k === "e") eDown.current = false;
      if (k === "t") wDown.current = false;
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, [onToggleStove, onToggleHold, onToggleWater, sprayingRef]);

  useEffect(() => {
    const down = (e: PointerEvent) => {
      dragging.current = true;
      last.current = { x: e.clientX, y: e.clientY };
      document.body.style.cursor = "grabbing";
    };
    const move = (e: PointerEvent) => {
      if (!dragging.current) return;
      const dx = e.clientX - last.current.x;
      const dy = e.clientY - last.current.y;
      last.current = { x: e.clientX, y: e.clientY };
      yaw.current -= dx * 0.004;
      pitch.current = THREE.MathUtils.clamp(pitch.current - dy * 0.004, -1.1, 0.9);
    };
    const up = () => {
      dragging.current = false;
      document.body.style.cursor = "default";
    };
    window.addEventListener("pointerdown", down);
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    return () => {
      window.removeEventListener("pointerdown", down);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
  }, []);

  useFrame((_, dt) => {
    const k = keys.current;
    let mv = 0;
    let turn = 0;
    // Arrow keys or WASD move; water is on T, stove on F.
    if (k["arrowup"] || k["w"]) mv += 1;
    if (k["arrowdown"] || k["s"]) mv -= 1;
    if (k["arrowleft"] || k["a"]) turn += 1;
    if (k["arrowright"] || k["d"]) turn -= 1;

    if (turn !== 0) yaw.current += turn * 1.9 * dt;

    const moving = mv !== 0;
    if (moving) {
      const fx = -Math.sin(yaw.current);
      const fz = -Math.cos(yaw.current);
      const sp = 2.4 * mv;
      const nx = THREE.MathUtils.clamp(pos.current.x + fx * sp * dt, MIN_X, MAX_X);
      if (!blocked(nx, pos.current.z)) pos.current.x = nx;
      const nz = THREE.MathUtils.clamp(pos.current.z + fz * sp * dt, MIN_Z, MAX_Z);
      if (!blocked(pos.current.x, nz)) pos.current.z = nz;
      bobPhase.current += dt * 9;
      stepAccum.current += dt;
      if (stepAccum.current > 0.42) {
        stepAccum.current = 0;
        playStep();
      }
    } else {
      stepAccum.current = 0.42;
    }

    // Spraying the extinguisher near the lit stove puts the flame out.
    if (sprayingRef.current && holding && stoveOn) {
      const dx = pos.current.x - STOVE.x;
      const dz = pos.current.z - STOVE.z;
      if (Math.hypot(dx, dz) < 3) onExtinguish();
    }

    camera.position.copy(pos.current);
    camera.rotation.set(pitch.current, yaw.current, 0, "YXZ");
    if (moving) camera.position.y += Math.sin(bobPhase.current) * 0.012;

    if (hands.current) {
      hands.current.position.copy(camera.position);
      hands.current.quaternion.copy(camera.quaternion);
    }
  });

  return (
    <group ref={hands}>
      <Hand side={1} />
      <Hand side={-1} />
      {holding && <HeldExtinguisher sprayingRef={sprayingRef} />}
    </group>
  );
}

export default function CharacterScene() {
  const [stoveOn, setStoveOn] = useState(false);
  const [holding, setHolding] = useState(false);
  const [waterOn, setWaterOn] = useState(false);
  const sprayingRef = useRef(false);

  useLoopSound(stoveOn, "flame");
  useLoopSound(waterOn, "water");

  return (
    <Canvas
      shadows
      camera={{ position: [0, 1.55, 3.6], fov: 70, near: 0.05 }}
      dpr={[1, 2]}
      gl={{ antialias: true, toneMappingExposure: 1.0 }}
    >
      <color attach="background" args={["#e3e7e4"]} />
      <ambientLight intensity={0.6} />
      <hemisphereLight args={["#ffffff", "#c9ccce", 0.5]} />
      <spotLight
        position={[0, 4.6, 2.5]}
        angle={0.9}
        penumbra={0.9}
        intensity={1.1}
        decay={0}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0004}
      />
      <pointLight position={[-2.6, 4.5, 0.5]} intensity={0.35} decay={0} />
      <pointLight position={[2.6, 4.5, 0.5]} intensity={0.35} decay={0} />

      <LabRoom chem />
      <ChemLab stoveOn={stoveOn} holding={holding} waterOn={waterOn} />
      <FirstPerson
        holding={holding}
        stoveOn={stoveOn}
        sprayingRef={sprayingRef}
        onToggleStove={() => setStoveOn((v) => !v)}
        onToggleHold={(nearExt) => setHolding((v) => (v ? false : nearExt))}
        onToggleWater={() => setWaterOn((v) => !v)}
        onExtinguish={() => setStoveOn(false)}
      />
    </Canvas>
  );
}
