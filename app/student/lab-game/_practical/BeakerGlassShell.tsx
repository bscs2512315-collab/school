"use client";

import { useEffect, useMemo } from "react";
import * as THREE from "three";

export const BEAKER_LIP_EXTENSION = 0.0045;
export const BEAKER_LIP_RISE = 0.001;

// The wall and rim share the same rounded profile. This forms a real open
// pouring lip without the triangular cone previously floating beside the rim.
function createShell(radius: number, height: number) {
  const segments = 48;
  const rows = [0, 0.8, 0.94, 1];
  const positions: number[] = [];
  const indices: number[] = [];
  const rimPoints: THREE.Vector3[] = [];

  for (const level of rows) {
    for (let i = 0; i <= segments; i++) {
      const angle = (i / segments) * Math.PI * 2;
      const signedAngle = angle > Math.PI ? angle - Math.PI * 2 : angle;
      const lip = Math.exp(-0.5 * (signedAngle / 0.29) ** 2);
      const rimBlend = Math.pow(level, 8);
      const r = radius + BEAKER_LIP_EXTENSION * lip * rimBlend;
      const y = height * level + BEAKER_LIP_RISE * lip * rimBlend;
      const point = new THREE.Vector3(Math.cos(angle) * r, y, Math.sin(angle) * r);
      positions.push(point.x, point.y, point.z);
      if (level === 1 && i < segments) rimPoints.push(point);
    }
  }

  for (let row = 0; row < rows.length - 1; row++) {
    for (let i = 0; i < segments; i++) {
      const a = row * (segments + 1) + i;
      const b = a + segments + 1;
      indices.push(a, b, a + 1, b, b + 1, a + 1);
    }
  }

  const wall = new THREE.BufferGeometry();
  wall.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  wall.setIndex(indices);
  wall.computeVertexNormals();
  const rimCurve = new THREE.CatmullRomCurve3(rimPoints, true, "centripetal");
  const rim = new THREE.TubeGeometry(rimCurve, segments * 2, 0.0038, 6, true);
  return { wall, rim };
}

export function BeakerGlassShell({ radius, height }: { radius: number; height: number }) {
  const geometry = useMemo(() => createShell(radius, height), [radius, height]);
  useEffect(() => () => {
    geometry.wall.dispose();
    geometry.rim.dispose();
  }, [geometry]);

  return (
    <>
      <mesh geometry={geometry.wall}>
        <meshPhysicalMaterial transparent opacity={0.24} depthWrite={false} roughness={0.06} metalness={0} color="#e7f2f0" side={THREE.DoubleSide} envMapIntensity={1.15} />
      </mesh>
      <mesh geometry={geometry.rim}>
        <meshStandardMaterial transparent opacity={0.72} depthWrite={false} roughness={0.05} color="#eef7f5" />
      </mesh>
    </>
  );
}
