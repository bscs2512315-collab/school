"use client";

import { useMemo } from "react";
import * as THREE from "three";

const GREEN = "#005f02";
const tagCache = new Map<string, THREE.CanvasTexture>();

function tagTexture(name: string, number: number) {
  const key = `${number}:${name}`;
  const cached = tagCache.get(key);
  if (cached) return cached;

  const dpr = 3;
  const height = 64;
  const font = "800 31px system-ui, -apple-system, sans-serif";
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d")!;
  ctx.font = font;
  const width = Math.ceil(ctx.measureText(name).width) + 116;
  canvas.width = width * dpr;
  canvas.height = height * dpr;
  ctx.scale(dpr, dpr);

  // Keep the border and number in the same texture so they cannot drift apart
  // as the camera moves or the sprite is scaled for a long apparatus name.
  ctx.fillStyle = "#080a08";
  ctx.strokeStyle = GREEN;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect(2, 2, width - 4, height - 4, 20);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = GREEN;
  ctx.beginPath();
  ctx.arc(34, height / 2, 24, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#fff";
  ctx.font = "800 32px system-ui, -apple-system, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(String(number), 34, height / 2 + 1);

  ctx.font = font;
  ctx.textAlign = "left";
  ctx.fillText(name, 73, height / 2 + 1);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  tagCache.set(key, texture);
  return texture;
}

export function ApparatusTourTag({ at, name, number }: { at: [number, number, number]; name: string; number: number }) {
  const texture = useMemo(() => tagTexture(name, number), [name, number]);
  const image = texture.image as HTMLCanvasElement;
  const naturalWidth = (image.width / image.height) * 0.09;
  const scale = Math.min(1, 0.95 / naturalWidth);
  const height = 0.09 * scale;
  const width = naturalWidth * scale;

  return (
    <sprite position={at} scale={[width, height, 1]} renderOrder={30}>
      <spriteMaterial map={texture} transparent depthWrite={false} depthTest={false} />
    </sprite>
  );
}
