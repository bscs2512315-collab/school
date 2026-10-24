import * as THREE from "three";

const cache = new Map<string, THREE.CanvasTexture>();

// A small printed laboratory reagent sticker, reused by every chemistry scene.
export function getReagentLabel(name: string): THREE.CanvasTexture {
  const cached = cache.get(name);
  if (cached) return cached;

  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 300;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#f5f2e8";
  ctx.fillRect(0, 0, 512, 300);
  ctx.strokeStyle = "#d5d0c2";
  ctx.lineWidth = 5;
  ctx.strokeRect(7, 7, 498, 286);
  ctx.fillStyle = "#005f02";
  ctx.fillRect(12, 12, 488, 34);
  ctx.fillStyle = "#28442c";
  ctx.font = "700 26px system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("LABORATORY REAGENT", 256, 88);

  let fontSize = 66;
  do {
    ctx.font = `800 ${fontSize}px system-ui, sans-serif`;
    if (ctx.measureText(name).width <= 450) break;
    fontSize -= 3;
  } while (fontSize > 32);
  ctx.fillStyle = "#17241a";
  ctx.textBaseline = "middle";
  ctx.fillText(name, 256, 166);

  ctx.strokeStyle = "#b7b1a4";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(40, 226);
  ctx.lineTo(472, 226);
  ctx.stroke();
  ctx.fillStyle = "#4b554c";
  ctx.font = "600 24px system-ui, sans-serif";
  ctx.fillText("REAGENT  •  100 mL", 256, 264);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  cache.set(name, texture);
  return texture;
}

// White paper label used by the amber dropper bottles. Keep the reagent name
// legible at bench scale while matching the plain photographic reference.
export function getDropperLabel(name: string): THREE.CanvasTexture {
  const key = `dropper:${name}`;
  const cached = cache.get(key);
  if (cached) return cached;

  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 300;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#faf9f6";
  ctx.fillRect(0, 0, 512, 300);
  ctx.fillStyle = "#484b4b";
  ctx.font = "600 24px system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("LABORATORY REAGENT", 256, 72);
  let size = 56;
  while (size > 25) {
    ctx.font = `700 ${size}px system-ui, sans-serif`;
    if (ctx.measureText(name).width < 460) break;
    size -= 2;
  }
  ctx.fillStyle = "#202427";
  ctx.textBaseline = "middle";
  ctx.fillText(name, 256, 156);
  ctx.fillStyle = "#767b7b";
  ctx.font = "500 21px system-ui, sans-serif";
  ctx.fillText("DROPPER BOTTLE", 256, 243);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  cache.set(key, texture);
  return texture;
}
