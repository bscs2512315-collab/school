"use client";

import { useMemo } from "react";
import * as THREE from "three";
import { getReagentLabel } from "./reagentLabel";

export function SaltJarVisual({ hideSpoon }: { hideSpoon: boolean }) {
  const label = useMemo(() => getReagentLabel("SALT"), []);
  return (
    <group position={[-0.7, 1.08, 0.4]}>
      {/* Clear, open glass storage jar with a heavier base and rolled neck. */}
      <mesh position={[0, 0.092, 0]}>
        <cylinderGeometry args={[0.087, 0.084, 0.176, 28, 1, true]} />
        <meshPhysicalMaterial color="#e7f1ef" transparent opacity={0.27} roughness={0.07} depthWrite={false} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, 0.007, 0]}>
        <cylinderGeometry args={[0.084, 0.084, 0.014, 28]} />
        <meshStandardMaterial color="#e0e9e7" transparent opacity={0.55} roughness={0.11} />
      </mesh>
      <mesh position={[0, 0.18, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.087, 0.005, 8, 28]} />
        <meshStandardMaterial color="#eef7f5" transparent opacity={0.7} roughness={0.07} depthWrite={false} />
      </mesh>
      {[0.16, 0.168].map((y) => (
        <mesh key={y} position={[0, y, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.088, 0.0015, 5, 28]} />
          <meshStandardMaterial color="#d4dedb" transparent opacity={0.4} depthWrite={false} />
        </mesh>
      ))}

      {/* Salt has its own visible surface, rather than a solid white jar. */}
      <mesh position={[0, 0.039, 0]}>
        <cylinderGeometry args={[0.077, 0.077, 0.06, 24]} />
        <meshStandardMaterial color="#e9e8e1" roughness={1} />
      </mesh>
      <mesh position={[0, 0.071, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.077, 24]} />
        <meshStandardMaterial color="#f2f0e9" roughness={1} />
      </mesh>

      <mesh position={[0, 0.109, 0]}>
        <cylinderGeometry args={[0.090, 0.090, 0.07, 32, 1, true, -0.75, 1.5]} />
        <meshStandardMaterial map={label} roughness={0.82} side={THREE.DoubleSide} />
      </mesh>

      {!hideSpoon && (
        <group position={[0.015, 0.055, 0.018]} rotation={[0.1, 0, 1.12]}>
          <mesh position={[0.09, 0, 0]} rotation={[0, 0, -Math.PI / 2]}>
            <cylinderGeometry args={[0.0035, 0.005, 0.19, 10]} />
            <meshStandardMaterial color="#b8c1c3" metalness={0.75} roughness={0.26} />
          </mesh>
          <mesh position={[-0.018, -0.002, 0]} scale={[1, 0.35, 0.68]}>
            <sphereGeometry args={[0.032, 16, 8, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2]} />
            <meshStandardMaterial color="#cbd2d3" metalness={0.7} roughness={0.25} side={THREE.DoubleSide} />
          </mesh>
        </group>
      )}

      {/* Open screw cap resting upright beside the jar. */}
      <group position={[0.205, 0.018, 0.025]}>
        <mesh>
          <cylinderGeometry args={[0.083, 0.083, 0.026, 28, 1, true]} />
          <meshStandardMaterial color="#202322" roughness={0.6} />
        </mesh>
        <mesh position={[0, 0.012, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.078, 0.005, 6, 28]} />
          <meshStandardMaterial color="#171a19" roughness={0.54} />
        </mesh>
        <mesh position={[0, -0.006, 0]}>
          <cylinderGeometry args={[0.07, 0.07, 0.004, 28]} />
          <meshStandardMaterial color="#323735" roughness={0.72} />
        </mesh>
        {Array.from({ length: 16 }, (_, i) => {
          const angle = (i / 16) * Math.PI * 2;
          return (
            <mesh key={i} position={[Math.cos(angle) * 0.083, 0, Math.sin(angle) * 0.083]} rotation={[0, -angle, 0]}>
              <boxGeometry args={[0.003, 0.018, 0.004]} />
              <meshStandardMaterial color="#353a37" roughness={0.7} />
            </mesh>
          );
        })}
      </group>
    </group>
  );
}
