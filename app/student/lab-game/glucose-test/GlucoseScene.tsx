"use client";

/**
 * Chemistry XII · Stage III — detection of glucose as a reducing sugar.
 *
 * Guided, scripted flow (click reagents in order, then heat):
 *   0  add Glucose solution     → pale solution
 *   1  add Fehling's A          → light blue
 *   2  add Fehling's B          → deep blue
 *   3  heat over the Bunsen     → blue → green → brick-red precipitate (Cu2O)
 *
 * The scene owns the ordered state machine and reports each phase up to the
 * page, which shows the matching instruction and (once done) the answer form.
 */

import { Suspense, useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, ContactShadows, Html } from "@react-three/drei";
import * as THREE from "three";
import { LabRoom, GlassMat, MediaBottle } from "../_scene/LabRoom";

const TUBE = new THREE.Vector3(0.15, 0, 0.1); // tube x/z on the bench
const TUBE_BOTTOM = 1.11;

const C_PALE = new THREE.Color("#e9f2c9");
const C_LTBLUE = new THREE.Color("#3b82f6");
const C_BLUE = new THREE.Color("#1d4ed8");
const C_GREEN = new THREE.Color("#16a34a");
const C_RED = new THREE.Color("#b91c1c");

// ---- The reacting test tube ------------------------------------------------

function Reaction({ phase, onDone }: { phase: number; onDone: () => void }) {
  const liquidRef = useRef<THREE.Mesh>(null);
  const matRef = useRef<THREE.MeshStandardMaterial>(null);
  const precipRef = useRef<THREE.InstancedMesh>(null);
  const bubbleRef = useRef<THREE.InstancedMesh>(null);

  const fill = useRef(0);
  const cur = useMemo(() => new THREE.Color("#e9f2c9"), []);
  const heatT = useRef(0);
  const doneFired = useRef(false);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  // Fixed random layout for precipitate + bubbles.
  const precip = useMemo(
    () =>
      Array.from({ length: 30 }, () => ({
        x: TUBE.x + (Math.random() - 0.5) * 0.11,
        y: TUBE_BOTTOM + 0.01 + Math.random() * 0.06,
        z: TUBE.z + (Math.random() - 0.5) * 0.11,
      })),
    [],
  );
  const bubbles = useMemo(
    () => Array.from({ length: 8 }, () => ({ x: (Math.random() - 0.5) * 0.1, z: (Math.random() - 0.5) * 0.1, off: Math.random() })),
    [],
  );

  const targetFill = phase === 0 ? 0 : phase === 1 ? 0.5 : phase === 2 ? 0.58 : 0.66;

  useFrame((state, dt) => {
    // Liquid volume
    fill.current += (targetFill - fill.current) * 0.12;
    if (liquidRef.current) {
      const h = 0.55 * fill.current;
      liquidRef.current.scale.y = Math.max(0.0001, fill.current);
      liquidRef.current.position.y = TUBE_BOTTOM + h / 2;
      liquidRef.current.visible = fill.current > 0.02;
    }

    // Colour
    if (phase < 4) {
      const target = phase <= 1 ? C_PALE : phase === 2 ? C_LTBLUE : C_BLUE;
      cur.lerp(target, 0.1);
      heatT.current = 0;
    } else {
      heatT.current = Math.min(1, heatT.current + dt / 3.5);
      const t = heatT.current;
      if (t < 0.5) cur.copy(C_BLUE).lerp(C_GREEN, t / 0.5);
      else cur.copy(C_GREEN).lerp(C_RED, (t - 0.5) / 0.5);
      if (t >= 1 && !doneFired.current) {
        doneFired.current = true;
        onDone();
      }
    }
    if (matRef.current) matRef.current.color.copy(cur);

    // Precipitate grows in during heating
    if (precipRef.current) {
      const shown = Math.floor(heatT.current * precip.length);
      precip.forEach((p, i) => {
        const s = i < shown ? 1 : 0.0001;
        dummy.position.set(p.x, p.y, p.z);
        dummy.scale.setScalar(s);
        dummy.updateMatrix();
        precipRef.current!.setMatrixAt(i, dummy.matrix);
      });
      precipRef.current.instanceMatrix.needsUpdate = true;
    }

    // Rising bubbles while actively heating
    if (bubbleRef.current) {
      const active = phase === 4 && heatT.current < 1;
      const top = TUBE_BOTTOM + 0.55 * fill.current;
      bubbles.forEach((b, i) => {
        const prog = active ? (state.clock.elapsedTime * 0.6 + b.off) % 1 : -1;
        const s = active ? 1 : 0.0001;
        dummy.position.set(TUBE.x + b.x, TUBE_BOTTOM + prog * (top - TUBE_BOTTOM), TUBE.z + b.z);
        dummy.scale.setScalar(s);
        dummy.updateMatrix();
        bubbleRef.current!.setMatrixAt(i, dummy.matrix);
      });
      bubbleRef.current.instanceMatrix.needsUpdate = true;
    }
  });

  return (
    <group>
      {/* Glass tube */}
      <mesh position={[TUBE.x, TUBE_BOTTOM + 0.35, TUBE.z]}>
        <cylinderGeometry args={[0.09, 0.09, 0.7, 24, 1, true]} />
        <GlassMat tint="#ffffff" thickness={0.06} />
      </mesh>
      {/* rounded bottom */}
      <mesh position={[TUBE.x, TUBE_BOTTOM, TUBE.z]}>
        <sphereGeometry args={[0.09, 24, 16, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2]} />
        <GlassMat tint="#ffffff" thickness={0.06} />
      </mesh>
      {/* rim */}
      <mesh position={[TUBE.x, TUBE_BOTTOM + 0.7, TUBE.z]}>
        <torusGeometry args={[0.09, 0.007, 8, 24]} />
        <meshStandardMaterial color="#dfe6ea" />
      </mesh>

      {/* Liquid */}
      <mesh ref={liquidRef} position={[TUBE.x, TUBE_BOTTOM, TUBE.z]}>
        <cylinderGeometry args={[0.083, 0.083, 0.55, 24]} />
        <meshStandardMaterial ref={matRef} color="#e9f2c9" transparent opacity={0.92} roughness={0.2} envMapIntensity={0.5} />
      </mesh>

      <instancedMesh ref={precipRef} args={[undefined, undefined, precip.length]}>
        <sphereGeometry args={[0.016, 6, 6]} />
        <meshStandardMaterial color="#9e2f14" roughness={0.7} />
      </instancedMesh>
      <instancedMesh ref={bubbleRef} args={[undefined, undefined, bubbles.length]}>
        <sphereGeometry args={[0.012, 6, 6]} />
        <meshStandardMaterial color="#ffffff" transparent opacity={0.6} />
      </instancedMesh>
    </group>
  );
}

// ---- Clamp stand + Bunsen burner -------------------------------------------

function ClampStand() {
  return (
    <group position={[TUBE.x, 0, TUBE.z - 0.3]}>
      <mesh position={[0, 1.1, 0]} castShadow>
        <boxGeometry args={[0.5, 0.04, 0.35]} />
        <meshStandardMaterial color="#3a3d41" metalness={0.4} roughness={0.5} />
      </mesh>
      <mesh position={[0.18, 1.5, 0]} castShadow>
        <cylinderGeometry args={[0.022, 0.022, 0.85, 12]} />
        <meshStandardMaterial color="#8a8f96" metalness={0.6} roughness={0.4} />
      </mesh>
      {/* clamp arm reaching the tube */}
      <mesh position={[0.02, 1.46, 0.3]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.018, 0.018, 0.34, 10]} />
        <meshStandardMaterial color="#5a5f66" metalness={0.5} roughness={0.5} />
      </mesh>
    </group>
  );
}

function Bunsen({ on, active, glow, onClick }: { on: boolean; active: boolean; glow: number; onClick: () => void }) {
  const flameRef = useRef<THREE.Mesh>(null);
  useFrame((s) => {
    if (flameRef.current) {
      const f = 1 + Math.sin(s.clock.elapsedTime * 18) * 0.08;
      flameRef.current.scale.set(1, f, 1);
    }
  });
  return (
    <group
      position={[TUBE.x, 1.08, TUBE.z]}
      onClick={(e) => {
        e.stopPropagation();
        if (active) onClick();
      }}
      onPointerOver={() => active && (document.body.style.cursor = "pointer")}
      onPointerOut={() => (document.body.style.cursor = "default")}
    >
      <mesh position={[0, 0.02, 0]} castShadow>
        <cylinderGeometry args={[0.13, 0.16, 0.04, 20]} />
        <meshStandardMaterial color="#2b2e33" emissive="#ff8a3b" emissiveIntensity={glow} roughness={0.5} />
      </mesh>
      <mesh position={[0, 0.16, 0]} castShadow>
        <cylinderGeometry args={[0.03, 0.035, 0.26, 16]} />
        <meshStandardMaterial color="#5a5f66" metalness={0.6} roughness={0.4} />
      </mesh>
      {on && (
        <>
          <pointLight position={[0, 0.4, 0]} intensity={0.6} distance={1.5} color="#ffb04a" decay={0} />
          <mesh ref={flameRef} position={[0, 0.42, 0]}>
            <coneGeometry args={[0.05, 0.28, 16]} />
            <meshBasicMaterial color="#ff7a1a" transparent opacity={0.85} />
          </mesh>
          <mesh position={[0, 0.36, 0]}>
            <coneGeometry args={[0.03, 0.16, 16]} />
            <meshBasicMaterial color="#4aa3ff" transparent opacity={0.9} />
          </mesh>
        </>
      )}
    </group>
  );
}

// ---- Realistic glass pipette (dropper) -------------------------------------

function Pipette({ position, rotation = [0, 0, 0] }: { position: [number, number, number]; rotation?: [number, number, number] }) {
  return (
    <group position={position} rotation={rotation}>
      {/* black ribbed rubber teat */}
      <mesh position={[0, 0.47, 0]} castShadow>
        <cylinderGeometry args={[0.026, 0.03, 0.14, 16]} />
        <meshStandardMaterial color="#141414" roughness={0.6} />
      </mesh>
      <mesh position={[0, 0.55, 0]}>
        <sphereGeometry args={[0.028, 16, 16]} />
        <meshStandardMaterial color="#141414" roughness={0.6} />
      </mesh>
      {/* glass stem */}
      <mesh position={[0, 0.25, 0]}>
        <cylinderGeometry args={[0.015, 0.015, 0.42, 16]} />
        <GlassMat tint="#ffffff" />
      </mesh>
      {/* amber liquid column */}
      <mesh position={[0, 0.17, 0]}>
        <cylinderGeometry args={[0.011, 0.011, 0.24, 12]} />
        <meshStandardMaterial color="#a5641b" transparent opacity={0.9} roughness={0.3} />
      </mesh>
      {/* tapered tip */}
      <mesh position={[0, 0.02, 0]}>
        <coneGeometry args={[0.015, 0.08, 16]} />
        <GlassMat tint="#ffffff" />
      </mesh>
    </group>
  );
}

// ---- Reagent bottle (labelled, click-to-use) -------------------------------

function ReagentBottle({
  position,
  color,
  label,
  fill,
  active,
  onClick,
}: {
  position: [number, number, number];
  color: string;
  label: string;
  fill: number;
  active: boolean;
  onClick: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  return (
    <group
      position={position}
      onClick={(e) => {
        e.stopPropagation();
        if (active) onClick();
      }}
      onPointerOver={() => {
        if (active) {
          setHovered(true);
          document.body.style.cursor = "pointer";
        }
      }}
      onPointerOut={() => {
        setHovered(false);
        document.body.style.cursor = "default";
      }}
    >
      {active && (
        <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.2, 0.014, 12, 36]} />
          <meshStandardMaterial color="#005f02" emissive="#0a9d2a" emissiveIntensity={hovered ? 2 : 1.2} toneMapped={false} />
        </mesh>
      )}
      <MediaBottle position={[0, 0, 0]} color={color} fill={fill} label={label} />
      {active && (
        <Html position={[0, 0.95, 0]} center distanceFactor={6} pointerEvents="none">
          <div
            style={{
              padding: "3px 10px",
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 800,
              whiteSpace: "nowrap",
              color: "#fff",
              background: "#005f02",
              boxShadow: "0 2px 6px rgba(0,0,0,0.2)",
              fontFamily: "system-ui, sans-serif",
            }}
          >
            Draw &amp; add {label} ←
          </div>
        </Html>
      )}
    </group>
  );
}

// ---- Root scene ------------------------------------------------------------

export default function GlucoseScene({
  onPhase,
  onDone,
}: {
  onPhase: (p: number) => void;
  onDone: () => void;
}) {
  const [phase, setPhase] = useState(0); // 0 glucose, 1 A, 2 B, 3 heat, 4 heating/done

  const advance = (to: number) => {
    setPhase(to);
    onPhase(to);
  };

  return (
    <Canvas
      shadows
      camera={{ position: [2.4, 2.2, 3.1], fov: 45 }}
      dpr={[1, 2]}
      gl={{ antialias: true, toneMappingExposure: 1.0 }}
    >
      <color attach="background" args={["#e3e7e4"]} />
      <ambientLight intensity={0.6} />
      <hemisphereLight args={["#ffffff", "#c9ccce", 0.5]} />
      <spotLight
        position={[0, 4.6, 1.2]}
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

      <Suspense fallback={null}>
        <LabRoom>
          <ClampStand />
          <Reaction phase={phase} onDone={onDone} />
          <Bunsen
            on={phase >= 4}
            active={phase === 3}
            glow={phase === 3 ? 0.5 : 0}
            onClick={() => advance(4)}
          />
          <ReagentBottle position={[0.85, 1.08, 0.5]} color="#c9b85a" label="Glucose" fill={0.5} active={phase === 0} onClick={() => advance(1)} />
          <ReagentBottle position={[1.45, 1.08, 0.5]} color="#2f6fd0" label="Fehling's A" fill={0.55} active={phase === 1} onClick={() => advance(2)} />
          <ReagentBottle position={[2.05, 1.08, 0.5]} color="#3b7d3b" label="Fehling's B" fill={0.6} active={phase === 2} onClick={() => advance(3)} />
          {/* Glass pipette resting on the bench */}
          <Pipette position={[-0.7, 1.09, 0.55]} />
        </LabRoom>
        <ContactShadows position={[0, 0.015, 0.1]} opacity={0.28} scale={12} blur={2.5} far={3} />
      </Suspense>

      <OrbitControls
        enablePan={false}
        minDistance={2}
        maxDistance={6}
        maxPolarAngle={Math.PI / 2.15}
        target={[0.15, 1.4, 0.1]}
      />
    </Canvas>
  );
}
