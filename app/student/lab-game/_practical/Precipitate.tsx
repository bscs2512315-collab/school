"use client";

import { useLayoutEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

const COUNT = 34;
const random = (seed: number) => {
  const value = Math.sin(seed * 127.1 + 78.233) * 43758.5453;
  return value - Math.floor(value);
};

// Keep the earlier, clearly visible precipitate particles in both chemistry
// practicals. Instancing preserves the lightweight rendering path on mobile.
export function Precipitate({ color, amount }: { color: string | null; amount: number; agitated?: boolean }) {
  const particlesRef = useRef<THREE.InstancedMesh>(null);
  const shown = useRef(0);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const currentColor = useMemo(() => new THREE.Color("#ffffff"), []);
  const targetColor = useMemo(() => new THREE.Color("#ffffff"), []);
  const particles = useMemo(() => Array.from({ length: COUNT }, (_, i) => ({
    x: (random(i * 3 + 1) - 0.5) * 0.03,
    y: random(i * 3 + 2),
    z: (random(i * 3 + 3) - 0.5) * 0.03,
  })), []);

  useLayoutEffect(() => {
    if (!particlesRef.current) return;
    const hidden = new THREE.Object3D();
    hidden.scale.setScalar(0.0001);
    hidden.updateMatrix();
    for (let i = 0; i < COUNT; i++) particlesRef.current.setMatrixAt(i, hidden.matrix);
    particlesRef.current.instanceMatrix.needsUpdate = true;
  }, []);

  useFrame(() => {
    if (!particlesRef.current) return;
    const target = color ? THREE.MathUtils.clamp(amount, 0, 1) : 0;
    shown.current = THREE.MathUtils.lerp(shown.current, target, 0.05);
    if (shown.current < 0.001) shown.current = 0;
    const count = shown.current * COUNT;
    particles.forEach((particle, i) => {
      const visibility = THREE.MathUtils.clamp(count - i, 0, 1);
      dummy.position.set(particle.x, 0.02 + particle.y * 0.07, particle.z);
      dummy.scale.setScalar(visibility < 0.03 ? 0.0001 : visibility);
      dummy.updateMatrix();
      particlesRef.current!.setMatrixAt(i, dummy.matrix);
    });
    particlesRef.current.instanceMatrix.needsUpdate = true;

    if (color) targetColor.set(color);
    currentColor.lerp(targetColor, 0.1);
    (particlesRef.current.material as THREE.MeshStandardMaterial).color.copy(currentColor);
  });

  return (
    <instancedMesh ref={particlesRef} args={[undefined, undefined, COUNT]} frustumCulled={false}>
      <sphereGeometry args={[0.012, 8, 8]} />
      <meshStandardMaterial color="#ffffff" roughness={0.55} />
    </instancedMesh>
  );
}
