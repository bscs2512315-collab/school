"use client";

/**
 * Phase 0 spike — separating iron filings from sand with a magnet.
 *
 * Scripted, not simulated: highlight the correct object, wait for the action,
 * play the effect, advance. The room comes from the shared <LabRoom>.
 */

import { Suspense, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, type ThreeEvent } from "@react-three/fiber";
import { OrbitControls, ContactShadows } from "@react-three/drei";
import * as THREE from "three";
import { LabRoom } from "../_scene/LabRoom";

type LabEvent = "grabbed" | "collected";

// ---- Iron filings + sand pile ---------------------------------------------

const PILE_CENTER = new THREE.Vector3(0, 1.08, 0.1);

type Particle = { base: THREE.Vector3; iron: boolean };

function makePile(): Particle[] {
  const parts: Particle[] = [];
  for (let i = 0; i < 90; i++) {
    const angle = Math.random() * Math.PI * 2;
    const radius = Math.random() * 0.4;
    parts.push({
      base: new THREE.Vector3(
        PILE_CENTER.x + Math.cos(angle) * radius,
        PILE_CENTER.y + Math.random() * 0.04,
        PILE_CENTER.z + Math.sin(angle) * radius,
      ),
      iron: Math.random() > 0.5,
    });
  }
  return parts;
}

function Mixture({
  magnetPos,
  active,
  onCollected,
}: {
  magnetPos: React.RefObject<THREE.Vector3>;
  active: boolean;
  onCollected: () => void;
}) {
  const particles = useMemo(makePile, []);
  const ironRef = useRef<THREE.InstancedMesh>(null);
  const sandRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const collectedFired = useRef(false);

  const iron = useMemo(() => particles.filter((p) => p.iron), [particles]);
  const sand = useMemo(() => particles.filter((p) => !p.iron), [particles]);
  const pull = useRef<number[]>(iron.map(() => 0));

  useFrame(() => {
    const m = magnetPos.current;
    const near = active && m.distanceTo(PILE_CENTER) < 1.1;

    if (ironRef.current) {
      let totalPull = 0;
      iron.forEach((p, i) => {
        const target = near ? Math.min(1, pull.current[i] + 0.06) : pull.current[i];
        pull.current[i] = target;
        totalPull += target;
        const cluster = new THREE.Vector3(
          m.x + ((i % 5) - 2) * 0.05,
          m.y - 0.14 + Math.floor(i / 5) * 0.015,
          m.z + ((i % 3) - 1) * 0.05,
        );
        const pos = p.base.clone().lerp(cluster, target);
        dummy.position.copy(pos);
        dummy.updateMatrix();
        ironRef.current!.setMatrixAt(i, dummy.matrix);
      });
      ironRef.current.instanceMatrix.needsUpdate = true;
      if (!collectedFired.current && iron.length && totalPull / iron.length > 0.9) {
        collectedFired.current = true;
        onCollected();
      }
    }

    if (sandRef.current && sandRef.current.userData.init !== true) {
      sand.forEach((p, i) => {
        dummy.position.copy(p.base);
        dummy.updateMatrix();
        sandRef.current!.setMatrixAt(i, dummy.matrix);
      });
      sandRef.current.instanceMatrix.needsUpdate = true;
      sandRef.current.userData.init = true;
    }
  });

  return (
    <group>
      <instancedMesh ref={ironRef} args={[undefined, undefined, iron.length]} castShadow>
        <sphereGeometry args={[0.028, 8, 8]} />
        <meshStandardMaterial color="#3a3a42" metalness={0.3} roughness={0.5} />
      </instancedMesh>
      <instancedMesh ref={sandRef} args={[undefined, undefined, sand.length]}>
        <sphereGeometry args={[0.03, 6, 6]} />
        <meshStandardMaterial color="#d8b57a" roughness={1} />
      </instancedMesh>
    </group>
  );
}

// ---- The bar magnet (red N / blue S) ---------------------------------------

function Magnet({
  magnetPos,
  grabbed,
  onGrab,
}: {
  magnetPos: React.RefObject<THREE.Vector3>;
  grabbed: boolean;
  onGrab: () => void;
}) {
  const group = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);
  const rest = useMemo(() => new THREE.Vector3(1.9, 1.14, 0.35), []);

  useFrame(() => {
    if (!group.current) return;
    const target = grabbed ? magnetPos.current : rest;
    group.current.position.lerp(target, 0.25);
    if (!grabbed) magnetPos.current.copy(group.current.position);
  });

  const glow = hovered && !grabbed ? 0.85 : grabbed ? 0.25 : 0.35;

  return (
    <group
      ref={group}
      position={rest.toArray()}
      onPointerOver={(e) => {
        e.stopPropagation();
        if (!grabbed) setHovered(true);
        document.body.style.cursor = grabbed ? "default" : "pointer";
      }}
      onPointerOut={() => {
        setHovered(false);
        document.body.style.cursor = "default";
      }}
      onClick={(e) => {
        e.stopPropagation();
        if (!grabbed) onGrab();
      }}
    >
      <mesh position={[-0.175, 0, 0]} castShadow>
        <boxGeometry args={[0.35, 0.15, 0.17]} />
        <meshStandardMaterial color="#d81f26" emissive="#ff3b3b" emissiveIntensity={glow} roughness={0.3} metalness={0.25} />
      </mesh>
      <mesh position={[0.175, 0, 0]} castShadow>
        <boxGeometry args={[0.35, 0.15, 0.17]} />
        <meshStandardMaterial color="#1f3fa8" emissive="#3b5bff" emissiveIntensity={glow * 0.8} roughness={0.3} metalness={0.25} />
      </mesh>
      <mesh>
        <boxGeometry args={[0.01, 0.16, 0.18]} />
        <meshStandardMaterial color="#111" />
      </mesh>
    </group>
  );
}

// ---- Root scene ------------------------------------------------------------

export default function LabScene({ onEvent }: { onEvent: (e: LabEvent) => void }) {
  const magnetPos = useRef(new THREE.Vector3(1.9, 1.14, 0.35));
  const [grabbed, setGrabbed] = useState(false);

  const onMove = (e: ThreeEvent<PointerEvent>) => {
    if (!grabbed) return;
    magnetPos.current.set(e.point.x, 1.35, e.point.z);
  };

  return (
    <Canvas
      shadows
      camera={{ position: [4.5, 3.2, 5], fov: 45 }}
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
      <directionalLight position={[-5, 5, 4]} intensity={0.35} color="#eef4fb" />

      <Suspense fallback={null}>
        <LabRoom>
          <Mixture magnetPos={magnetPos} active={grabbed} onCollected={() => onEvent("collected")} />
          <Magnet
            magnetPos={magnetPos}
            grabbed={grabbed}
            onGrab={() => {
              setGrabbed(true);
              onEvent("grabbed");
            }}
          />
          {/* Interaction plane just above the bench */}
          <mesh
            rotation={[-Math.PI / 2, 0, 0]}
            position={[0, 1.35, 0.1]}
            visible={false}
            onPointerMove={onMove}
          >
            <planeGeometry args={[5, 1.7]} />
          </mesh>
        </LabRoom>
        <ContactShadows position={[0, 0.015, 0.1]} opacity={0.28} scale={12} blur={2.5} far={3} />
      </Suspense>

      <OrbitControls
        enablePan={false}
        minDistance={3}
        maxDistance={8}
        maxPolarAngle={Math.PI / 2.15}
        target={[0, 1.3, 0.1]}
      />
    </Canvas>
  );
}
