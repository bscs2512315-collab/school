"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

function makeMistTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 128;
  const g = canvas.getContext("2d")!;
  const fade = g.createRadialGradient(64, 64, 3, 64, 64, 62);
  fade.addColorStop(0, "rgba(255,255,255,.54)");
  fade.addColorStop(0.36, "rgba(245,250,251,.25)");
  fade.addColorStop(1, "rgba(245,250,251,0)");
  g.fillStyle = fade;
  g.fillRect(0, 0, 128, 128);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export default function SteamPlume({ x, y, z, show }: { x: number; y: number; z: number; show: boolean }) {
  const group = useRef<THREE.Group>(null);
  const mist = useMemo(makeMistTexture, []);
  useEffect(() => () => mist.dispose(), [mist]);
  const particles = useMemo(() => Array.from({ length: 9 }, (_, i) => ({ offset: i / 9, drift: Math.sin(i * 2.7) * 0.037, speed: 0.13 + (i % 3) * 0.035 })), []);
  useFrame(({ clock }) => {
    if (!group.current) return;
    group.current.children.forEach((child, i) => {
      const p = particles[i];
      const t = (clock.elapsedTime * p.speed + p.offset) % 1;
      child.position.set(p.drift + Math.sin(t * 4 + i) * 0.012, t * 0.3, (i % 3 - 1) * 0.027);
      child.scale.setScalar(0.065 + t * 0.1);
      ((child as THREE.Sprite).material as THREE.SpriteMaterial).opacity = show ? Math.sin(Math.PI * t) * 0.3 : 0;
    });
  });
  return <group ref={group} position={[x, y, z]}>{particles.map((_, i) => <sprite key={i}><spriteMaterial map={mist} color="#f8fcff" transparent opacity={0} depthWrite={false} /></sprite>)}</group>;
}
