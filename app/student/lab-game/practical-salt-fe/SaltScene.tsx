"use client";

/**
 * Salt Analysis — Basic radical: detection of Fe³⁺ (Group III).
 * First-person lab. A test tube of "Sample A" sits on the centre bench; the
 * student walks up and clicks to add each group reagent in sequence:
 *   0  dil. HCl        → no ppt   (Group I absent)
 *   1  pass H2S        → no ppt   (Groups IB/IIB absent)
 *   2  NH4Cl + NH4OH   → reddish-brown Fe(OH)3 ppt  (Group III)
 *   3  C.T: + KSCN     → blood-red solution → Fe³⁺ confirmed
 * The tube visual updates at each step; the page records observations + grades.
 */

import { useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { LabRoom, BlueGlass, MediaBottle } from "../_scene/LabRoom";
import { ChemLab } from "../walk/ChemLab";
import { MIN_X, MAX_X, MIN_Z, MAX_Z, blocked } from "../walk/CharacterScene";
import { playStep } from "../_scene/labAudio";

export const REAGENTS = [
  { id: "hcl", label: "dil. HCl", color: "#e7eef3" },
  { id: "h2s", label: "H₂S", color: "#eae7cf" },
  { id: "nh4oh", label: "NH₄OH", color: "#dfeaf0" },
  { id: "kscn", label: "KSCN", color: "#e9dfcf" },
] as const;

// Tube liquid colour after each step (Fe³⁺ path).
const STEP_COLORS = [
  new THREE.Color("#d97706"), // Sample A: amber-brown (Fe³⁺ solution)
  new THREE.Color("#d97706"), // + HCl: no change
  new THREE.Color("#d97706"), // + H₂S: no change
  new THREE.Color("#9a3412"), // + NH₄OH: reddish-brown ppt
  new THREE.Color("#991b1b"), // + KSCN: blood-red
];

const TUBE = new THREE.Vector3(0.1, 1.14, 0.35);

// The reacting test tube in a stand.
function TestTube({ step }: { step: number }) {
  const matRef = useRef<THREE.MeshStandardMaterial>(null);
  const precipRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const cur = useMemo(() => new THREE.Color("#dcae6b"), []);
  const precip = useMemo(
    () => Array.from({ length: 22 }, () => ({ x: (Math.random() - 0.5) * 0.045, y: Math.random() * 0.14, z: (Math.random() - 0.5) * 0.045 })),
    [],
  );
  useFrame(() => {
    if (matRef.current) {
      cur.lerp(STEP_COLORS[Math.min(step, 4)], 0.1);
      matRef.current.color.copy(cur);
    }
    // precipitate appears at step 2 (reddish-brown Fe(OH)3)
    if (precipRef.current) {
      const show = step >= 2;
      precip.forEach((p, i) => {
        dummy.position.set(TUBE.x + p.x, TUBE.y - 0.16 + p.y, TUBE.z + p.z);
        dummy.scale.setScalar(show ? 1 : 0.0001);
        dummy.updateMatrix();
        precipRef.current!.setMatrixAt(i, dummy.matrix);
      });
      precipRef.current.instanceMatrix.needsUpdate = true;
    }
  });
  return (
    <group>
      {/* stand: base + a single rod behind the tube + a clamp ring (no rod through the tube) */}
      <mesh position={[TUBE.x, 1.09, TUBE.z - 0.02]}><boxGeometry args={[0.18, 0.02, 0.14]} /><meshStandardMaterial color="#3a3d41" metalness={0.4} roughness={0.5} /></mesh>
      <mesh position={[TUBE.x, 1.24, TUBE.z - 0.08]}><cylinderGeometry args={[0.01, 0.01, 0.32, 10]} /><meshStandardMaterial color="#8a8f96" metalness={0.6} roughness={0.4} /></mesh>
      <mesh position={[TUBE.x, 1.2, TUBE.z - 0.05]} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.008, 0.008, 0.06, 8]} /><meshStandardMaterial color="#8a8f96" metalness={0.6} roughness={0.4} /></mesh>
      <mesh position={[TUBE.x, 1.2, TUBE.z]} rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[0.032, 0.006, 8, 18]} /><meshStandardMaterial color="#8a8f96" metalness={0.6} roughness={0.4} /></mesh>
      {/* tube */}
      <mesh position={[TUBE.x, TUBE.y - 0.02, TUBE.z]}><cylinderGeometry args={[0.03, 0.03, 0.32, 20, 1, true]} /><BlueGlass /></mesh>
      <mesh position={[TUBE.x, TUBE.y - 0.18, TUBE.z]}><sphereGeometry args={[0.03, 16, 12, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2]} /><BlueGlass /></mesh>
      {/* liquid */}
      <mesh position={[TUBE.x, TUBE.y - 0.08, TUBE.z]}><cylinderGeometry args={[0.026, 0.026, 0.18, 18]} /><meshStandardMaterial ref={matRef} color="#dcae6b" transparent opacity={0.85} roughness={0.25} /></mesh>
      {/* precipitate */}
      <instancedMesh ref={precipRef} args={[undefined, undefined, precip.length]}>
        <sphereGeometry args={[0.008, 6, 6]} />
        <meshStandardMaterial color="#6e3216" roughness={0.7} />
      </instancedMesh>
    </group>
  );
}

// A shelf-style labelled reagent bottle on the bench. When `pouring`, it lifts
// above the tube and tilts, with a coloured stream falling into the tube.
function ReagentBottle({ x, color, label, active, pouring }: { x: number; color: string; label: string; active: boolean; pouring: boolean }) {
  const g = useRef<THREE.Group>(null);
  const t0 = useRef<number | null>(null);
  const home = useMemo(() => new THREE.Vector3(x, 1.08, 0.55), [x]);
  const over = useMemo(() => new THREE.Vector3(TUBE.x - 0.17, 1.54, TUBE.z), []);
  useFrame((s) => {
    if (!g.current) return;
    if (pouring) {
      if (t0.current === null) t0.current = s.clock.elapsedTime;
      const t = Math.min(1, (s.clock.elapsedTime - t0.current) / 1.2);
      g.current.position.lerp(over, 0.18);
      const tilt = t < 0.3 ? (t / 0.3) * 2.0 : t > 0.85 ? (1 - (t - 0.85) / 0.15) * 2.0 : 2.0;
      g.current.rotation.z = -tilt;
    } else {
      t0.current = null;
      g.current.position.lerp(home, 0.2);
      g.current.rotation.z = THREE.MathUtils.lerp(g.current.rotation.z, 0, 0.2);
    }
  });
  return (
    <group>
      <group ref={g} position={home.toArray()} scale={0.5}>
        <MediaBottle position={[0, 0, 0]} color={color} fill={0.6} label={label} />
      </group>
      {active && !pouring && (
        <mesh position={[x, 1.24, 0.55]} renderOrder={999}>
          <cylinderGeometry args={[0.09, 0.09, 0.34, 14]} />
          <meshBasicMaterial color="#1dff44" transparent opacity={0.24} depthWrite={false} depthTest={false} toneMapped={false} side={THREE.DoubleSide} />
        </mesh>
      )}
    </group>
  );
}

// Funnel sitting in the tube mouth + the pouring streams (bottle→funnel→tube),
// shown during a pour (ref: pour through a funnel into the vessel).
function PourRig({ color }: { color: string }) {
  const dropRef = useRef<THREE.MeshStandardMaterial>(null);
  useFrame((s) => {
    if (dropRef.current) dropRef.current.opacity = 0.6 + Math.abs(Math.sin(s.clock.elapsedTime * 14)) * 0.3;
  });
  return (
    <group>
      {/* funnel */}
      <mesh position={[TUBE.x, 1.36, TUBE.z]}><cylinderGeometry args={[0.06, 0.012, 0.08, 20, 1, true]} /><BlueGlass /></mesh>
      <mesh position={[TUBE.x, 1.3, TUBE.z]}><cylinderGeometry args={[0.01, 0.01, 0.06, 12, 1, true]} /><BlueGlass /></mesh>
      {/* stream from the tilted bottle spout into the funnel */}
      <mesh position={[TUBE.x - 0.075, 1.46, TUBE.z]} rotation={[0, 0, 0.7]}>
        <cylinderGeometry args={[0.006, 0.009, 0.18, 8]} />
        <meshStandardMaterial color={color} transparent opacity={0.9} roughness={0.3} />
      </mesh>
      {/* drip from the funnel stem into the tube liquid */}
      <mesh position={[TUBE.x, 1.18, TUBE.z]}>
        <cylinderGeometry args={[0.005, 0.007, 0.2, 8]} />
        <meshStandardMaterial ref={dropRef} color={color} transparent opacity={0.8} roughness={0.3} />
      </mesh>
    </group>
  );
}

function Player({
  step,
  onReact,
  onNavHint,
  onReady,
}: {
  step: number;
  onReact: () => void;
  onNavHint: (h: string) => void;
  onReady: (r: boolean) => void;
}) {
  const { camera } = useThree();
  const rig = useRef<THREE.Group>(null);
  const keys = useRef<Record<string, boolean>>({});
  const yaw = useRef(0);
  const pitch = useRef(-0.05);
  const dragging = useRef(false);
  const last = useRef({ x: 0, y: 0 });
  const pos = useRef(new THREE.Vector3(0, 1.55, 4.6));
  const bob = useRef(0);
  const stepA = useRef(0);
  const navA = useRef(0);
  const readyRef = useRef(false);
  const stepRef = useRef(step);
  stepRef.current = step;
  const fwd = useMemo(() => new THREE.Vector3(), []);
  const tmp = useMemo(() => new THREE.Vector3(), []);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      keys.current[k] = true;
      if (["arrowup", "arrowdown", "arrowleft", "arrowright"].includes(k)) e.preventDefault();
    };
    const up = (e: KeyboardEvent) => (keys.current[e.key.toLowerCase()] = false);
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, []);

  useEffect(() => {
    const isUI = (t: EventTarget | null) => t instanceof HTMLElement && t.closest("[data-ui]");
    const down = (e: PointerEvent) => {
      if (isUI(e.target)) return;
      dragging.current = true;
      last.current = { x: e.clientX, y: e.clientY };
    };
    const move = (e: PointerEvent) => {
      if (!dragging.current) return;
      yaw.current -= (e.clientX - last.current.x) * 0.004;
      pitch.current = THREE.MathUtils.clamp(pitch.current - (e.clientY - last.current.y) * 0.004, -1.1, 0.7);
      last.current = { x: e.clientX, y: e.clientY };
    };
    const upp = () => (dragging.current = false);
    const click = (e: MouseEvent) => {
      if (isUI(e.target)) return;
      if (readyRef.current) onReact();
    };
    window.addEventListener("pointerdown", down);
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", upp);
    window.addEventListener("click", click);
    return () => {
      window.removeEventListener("pointerdown", down);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", upp);
      window.removeEventListener("click", click);
    };
  }, [onReact]);

  useFrame((s, dt) => {
    const k = keys.current;
    let mv = 0;
    let turn = 0;
    if (k["arrowup"] || k["w"]) mv += 1;
    if (k["arrowdown"] || k["s"]) mv -= 1;
    if (k["arrowleft"] || k["a"]) turn += 1;
    if (k["arrowright"] || k["d"]) turn -= 1;
    if (turn) yaw.current += turn * 1.9 * dt;
    const moving = mv !== 0;
    if (moving) {
      const fx = -Math.sin(yaw.current);
      const fz = -Math.cos(yaw.current);
      const nx = THREE.MathUtils.clamp(pos.current.x + fx * 2.4 * mv * dt, MIN_X, MAX_X);
      if (!blocked(nx, pos.current.z)) pos.current.x = nx;
      const nz = THREE.MathUtils.clamp(pos.current.z + fz * 2.4 * mv * dt, MIN_Z, MAX_Z);
      if (!blocked(pos.current.x, nz)) pos.current.z = nz;
      bob.current += dt * 9;
      stepA.current += dt;
      if (stepA.current > 0.42) {
        stepA.current = 0;
        playStep();
      }
    } else stepA.current = 0.42;

    camera.position.copy(pos.current);
    camera.rotation.set(pitch.current, yaw.current, 0, "YXZ");
    if (rig.current) {
      rig.current.position.copy(camera.position);
      rig.current.quaternion.copy(camera.quaternion);
    }

    // Ready to add the next reagent when near the bench, facing it.
    camera.getWorldDirection(fwd);
    const nearBench = Math.hypot(pos.current.x, pos.current.z - 0.4) < 2.0;
    tmp.set(0, 1.1, 0.4).sub(camera.position).normalize();
    const ready = stepRef.current < 4 && nearBench && tmp.dot(fwd) > 0.5;
    if (ready !== readyRef.current) {
      readyRef.current = ready;
      onReady(ready);
    }

    navA.current += dt;
    if (navA.current > 0.25) {
      navA.current = 0;
      let hint = "";
      if (readyRef.current) hint = "Click the tube to add the reagent";
      else {
        const dx = 0 - pos.current.x;
        const dz = 0.4 - pos.current.z;
        const dist = Math.hypot(dx, dz);
        const fdot = (dx * fwd.x + dz * fwd.z) / (dist || 1);
        const rdot = (dx * -fwd.z + dz * fwd.x) / (dist || 1);
        if (dist < 1.3) hint = "Turn to face the test tube";
        else if (fdot > 0.75) hint = "Move forward to the bench";
        else if (fdot < -0.4) hint = "Turn around";
        else hint = rdot > 0 ? "Turn right" : "Turn left";
      }
      onNavHint(hint);
    }
  });

  return (
    <group ref={rig}>
    </group>
  );
}

export default function SaltScene({
  step,
  pouring,
  onReact,
  onNavHint,
  onReady,
}: {
  step: number;
  pouring: boolean;
  onReact: () => void;
  onNavHint: (h: string) => void;
  onReady: (r: boolean) => void;
}) {
  const reagentX = [-0.5, -0.1, 0.3, 0.7];
  return (
    <Canvas shadows camera={{ position: [0, 1.55, 4.6], fov: 70, near: 0.05 }} dpr={[1, 2]} gl={{ antialias: true, toneMappingExposure: 1.0 }}>
      <color attach="background" args={["#e3e7e4"]} />
      <ambientLight intensity={0.6} />
      <hemisphereLight args={["#ffffff", "#c9ccce", 0.5]} />
      <spotLight position={[0, 4.6, 2.5]} angle={0.9} penumbra={0.9} intensity={1.1} decay={0} castShadow shadow-mapSize={[2048, 2048]} shadow-bias={-0.0004} />
      <pointLight position={[-2.6, 4.5, 0.5]} intensity={0.35} decay={0} />
      <pointLight position={[2.6, 4.5, 0.5]} intensity={0.35} decay={0} />

      <LabRoom chem />
      <ChemLab stoveOn={false} holding={false} waterOn={false} simplified />
      <TestTube step={step} />
      {REAGENTS.map((r, i) => (
        <ReagentBottle key={r.id} x={reagentX[i]} color={r.color} label={r.label} active={step === i} pouring={pouring && step === i} />
      ))}
      {pouring && step < REAGENTS.length && <PourRig color={REAGENTS[step].color} />}
      <Player step={step} onReact={onReact} onNavHint={onNavHint} onReady={onReady} />
    </Canvas>
  );
}
