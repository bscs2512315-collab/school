import * as THREE from "three";

let cachedBuretteTexture: THREE.CanvasTexture | null = null;

export function getBuretteScaleTexture(): THREE.CanvasTexture {
  if (cachedBuretteTexture) return cachedBuretteTexture;

  const width = 512;
  const height = 2048;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d")!;

  // Clear background (transparent glass texture overlay)
  ctx.clearRect(0, 0, width, height);

  // Subtle glass vertical highlight / column boundary
  ctx.strokeStyle = "rgba(255, 255, 255, 0.15)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(width * 0.25, 0);
  ctx.lineTo(width * 0.25, height);
  ctx.stroke();

  // Draw burette graduations (0.0 cm³ at top ~10% down to 50.0 cm³ at bottom ~90%)
  const topY = height * 0.08;
  const bottomY = height * 0.92;
  const totalMarks = 50; // 0 to 50 mL
  const stepY = (bottomY - topY) / totalMarks;

  // Header label
  ctx.fillStyle = "#111827";
  ctx.font = "bold 26px system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("EXBOARD AI 50 cm³", width * 0.55, topY - 50);
  ctx.font = "italic 20px system-ui, sans-serif";
  ctx.fillStyle = "#374151";
  ctx.fillText("± 0.05 cm³  20°C", width * 0.55, topY - 25);

  for (let i = 0; i <= totalMarks; i++) {
    const y = topY + i * stepY;

    // Major mark every 1 mL
    const isFive = i % 5 === 0;
    const isTen = i % 10 === 0;

    ctx.strokeStyle = "#0f172a";
    ctx.lineWidth = isFive ? 4 : 2.5;

    const lineLen = isFive ? 120 : 70;
    const startX = width * 0.38;

    ctx.beginPath();
    ctx.moveTo(startX, y);
    ctx.lineTo(startX + lineLen, y);
    ctx.stroke();

    // Minor sub-divisions (0.1 mL = 10 subdivisions per 1 mL)
    if (i < totalMarks) {
      const subStep = stepY / 10;
      for (let s = 1; s < 10; s++) {
        const subY = y + s * subStep;
        const subLen = s === 5 ? 50 : 30;
        ctx.strokeStyle = s === 5 ? "rgba(15, 23, 42, 0.85)" : "rgba(15, 23, 42, 0.6)";
        ctx.lineWidth = s === 5 ? 2.2 : 1.4;
        ctx.beginPath();
        ctx.moveTo(startX, subY);
        ctx.lineTo(startX + subLen, subY);
        ctx.stroke();
      }
    }

    // Numbers for every 5 or 10 mL
    if (isFive) {
      ctx.fillStyle = "#0f172a";
      ctx.font = isTen ? "bold 34px system-ui, sans-serif" : "bold 28px system-ui, sans-serif";
      ctx.textAlign = "right";
      ctx.fillText(String(i), startX - 16, y + 10);
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  cachedBuretteTexture = texture;
  return texture;
}
