"use client";

import { useMemo } from "react";
import * as THREE from "three";

// Realistic lab-thermometer scale face: white frosted strip, a light central
// capillary channel, black graduations (1° minor / 5° medium / 10° major with
// numbers), like a real mercury/alcohol thermometer.
export function makeThermoFace(min: number, max: number): THREE.CanvasTexture {
  const W = 160, H = 1024;
  const c = document.createElement("canvas");
  c.width = W; c.height = H;
  const g = c.getContext("2d")!;
  // frosted white body with soft rounded ends
  g.fillStyle = "#f7f5ef";
  const rr = 30;
  g.beginPath();
  g.moveTo(rr, 2); g.lineTo(W - rr, 2); g.quadraticCurveTo(W - 2, 2, W - 2, rr);
  g.lineTo(W - 2, H - rr); g.quadraticCurveTo(W - 2, H - 2, W - rr, H - 2);
  g.lineTo(rr, H - 2); g.quadraticCurveTo(2, H - 2, 2, H - rr);
  g.lineTo(2, rr); g.quadraticCurveTo(2, 2, rr, 2);
  g.closePath(); g.fill();
  // central capillary channel (where the red column sits)
  g.fillStyle = "#efece4"; g.fillRect(70, 0, 24, H);

  const yFor = (v: number) => H * (1 - (v - min) / (max - min));
  g.strokeStyle = "#0d0d0d"; g.fillStyle = "#0d0d0d"; g.textBaseline = "middle"; g.textAlign = "left";
  // every 1° gets a line; 5° is longer; 10° is longest and numbered
  for (let v = Math.ceil(min); v <= max; v++) {
    const y = yFor(v); g.beginPath();
    if (v % 10 === 0) {
      g.lineWidth = 4.5; g.moveTo(8, y); g.lineTo(64, y); g.stroke();
      g.font = "bold 36px Georgia, serif"; g.fillText(String(v), 102, y);
    } else if (v % 5 === 0) {
      g.lineWidth = 3.2; g.moveTo(8, y); g.lineTo(56, y); g.stroke();
    } else {
      g.lineWidth = 2.2; g.moveTo(8, y); g.lineTo(42, y); g.stroke();
    }
  }
  g.font = "bold 30px Georgia, serif"; g.textAlign = "center"; g.fillText("°C", 118, 34);
  const tex = new THREE.CanvasTexture(c); tex.anisotropy = 8; return tex;
}

const RED = "#e01b1b";

export function Thermometer3D({ temp, min = 15, max = 100, x, z, bulbY, scaleBot, scaleTop, faceRot = -0.42 }: {
  temp: number; min?: number; max?: number; x: number; z: number; bulbY: number; scaleBot: number; scaleTop: number; faceRot?: number;
}) {
  const face = useMemo(() => makeThermoFace(min, max), [min, max]);
  const frac = Math.max(0, Math.min(1, (temp - min) / (max - min)));
  const meniscus = scaleBot + frac * (scaleTop - scaleBot);
  const faceMid = (scaleBot + scaleTop) / 2;
  const tubeTop = scaleTop + 0.05;
  const tubeR = 0.017;

  return (
    <group position={[x, 0, z]}>
      {/* clear glass tube */}
      <mesh position={[0, (bulbY + tubeTop) / 2, 0]}>
        <cylinderGeometry args={[tubeR, tubeR, tubeTop - bulbY, 24]} />
        <meshStandardMaterial color="#eef2f6" transparent opacity={0.28} roughness={0.05} metalness={0.1} />
      </mesh>
      {/* rounded glass top + hanging loop */}
      <mesh position={[0, tubeTop, 0]}><sphereGeometry args={[tubeR, 18, 18]} /><meshStandardMaterial color="#eef2f6" transparent opacity={0.35} roughness={0.05} /></mesh>
      <mesh position={[0, tubeTop + 0.02, 0]} rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[0.01, 0.003, 8, 16]} /><meshStandardMaterial color="#dfe3e6" roughness={0.4} /></mesh>

      {/* frosted scale face + red capillary, sharing one orientation */}
      <group position={[0.004, 0, tubeR * 0.5]} rotation={[0, faceRot, 0]}>
        <mesh position={[0, faceMid, 0]}>
          <planeGeometry args={[0.05, scaleTop - scaleBot + 0.02]} />
          <meshBasicMaterial map={face} transparent depthWrite={false} side={THREE.DoubleSide} />
        </mesh>
        {/* red capillary column */}
        <mesh position={[0, (bulbY + meniscus) / 2, 0.004]}>
          <boxGeometry args={[0.007, Math.max(0.01, meniscus - bulbY), 0.003]} />
          <meshBasicMaterial color={RED} />
        </mesh>
        {/* rounded meniscus */}
        <mesh position={[0, meniscus, 0.004]}><sphereGeometry args={[0.005, 12, 12]} /><meshBasicMaterial color={RED} /></mesh>
      </group>

      {/* red bulb */}
      <mesh position={[0, bulbY, 0]} castShadow><sphereGeometry args={[0.026, 20, 20]} /><meshStandardMaterial color={RED} roughness={0.35} /></mesh>
      <mesh position={[0, bulbY + 0.024, 0]}><cylinderGeometry args={[0.01, 0.026, 0.03, 16]} /><meshStandardMaterial color={RED} roughness={0.35} /></mesh>
    </group>
  );
}
