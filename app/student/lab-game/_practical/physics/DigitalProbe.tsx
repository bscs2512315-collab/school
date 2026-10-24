"use client";

import { useEffect, useMemo } from "react";
import { RoundedBox } from "@react-three/drei";
import * as THREE from "three";

function makeDisplay(temp: number): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 256; canvas.height = 384;
  const g = canvas.getContext("2d")!;
  const lcd = g.createLinearGradient(0, 0, 0, 384);
  lcd.addColorStop(0, "#d1ddd0"); lcd.addColorStop(1, "#acbfaf");
  g.fillStyle = lcd; g.fillRect(0, 0, 256, 384);
  g.strokeStyle = "rgba(37,57,57,0.26)"; g.lineWidth = 5; g.strokeRect(5, 5, 246, 374);
  g.fillStyle = "#29383a"; g.textAlign = "center";
  g.font = "bold 92px monospace"; g.fillText(temp.toFixed(1), 128, 207);
  g.font = "bold 38px sans-serif"; g.fillText("°C", 128, 288);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  return texture;
}

export function DigitalProbe({ temp, position = [0, 0, 0] }: { temp: number; position?: [number, number, number] }) {
  const display = useMemo(() => makeDisplay(temp), [temp]);
  useEffect(() => () => display.dispose(), [display]);
  return <group position={position}>
    <mesh position={[0, 0.162, 0]}><cylinderGeometry args={[0.0035, 0.0035, 0.18, 16]} /><meshStandardMaterial color="#d0d6d5" metalness={0.86} roughness={0.15} /></mesh>
    <mesh position={[0, 0.27, 0]} rotation={[0, 0, Math.PI]}><coneGeometry args={[0.025, 0.055, 32]} /><meshStandardMaterial color="#22282b" roughness={0.55} /></mesh>
    <mesh position={[0, 0.39, 0]} castShadow><cylinderGeometry args={[0.034, 0.034, 0.22, 40]} /><meshStandardMaterial color="#202428" metalness={0.18} roughness={0.43} /></mesh>
    <mesh position={[0, 0.5, 0]} scale={[1, 0.4, 1]}><sphereGeometry args={[0.034, 32, 16]} /><meshStandardMaterial color="#202428" metalness={0.18} roughness={0.43} /></mesh>
    {[0.296, 0.488].map((y) => <mesh key={y} position={[0, y, 0]} rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[0.0344, 0.0018, 8, 40]} /><meshStandardMaterial color="#ab5847" roughness={0.48} /></mesh>)}
    <RoundedBox args={[0.052, 0.177, 0.006]} radius={0.006} smoothness={4} position={[0, 0.39, 0.032]}><meshStandardMaterial color="#d3d8d7" metalness={0.38} roughness={0.34} /></RoundedBox>
    <RoundedBox args={[0.044, 0.091, 0.003]} radius={0.002} smoothness={3} position={[0, 0.39, 0.037]}><meshStandardMaterial color="#252e30" metalness={0.28} roughness={0.4} /></RoundedBox>
    <mesh position={[0, 0.39, 0.039]}><planeGeometry args={[0.039, 0.083]} /><meshBasicMaterial map={display} /></mesh>
    {[[-0.014, 0.455], [0.014, 0.455], [-0.014, 0.325], [0.014, 0.325]].map(([x, y]) => <group key={`${x}-${y}`} position={[x, y, 0.037]}>
      <mesh><torusGeometry args={[0.0055, 0.0009, 6, 20]} /><meshStandardMaterial color="#3e4444" metalness={0.5} roughness={0.31} /></mesh>
      <mesh position={[0, 0, 0.002]}><sphereGeometry args={[0.0048, 18, 12]} /><meshPhysicalMaterial color="#d17654" metalness={0.1} roughness={0.27} clearcoat={0.55} /></mesh>
    </group>)}
  </group>;
}
