import * as THREE from "three";

const SEGMENTS = 20;
const BASE_Y = 0.012;

// One small, reusable geometry per beaker. Its surface stays horizontal in
// world space while the glass tilts; every vertex remains inside the glass.
export function createBeakerLiquid(radius: number, beakerHeight: number): THREE.BufferGeometry {
  const positions = new Float32Array(((SEGMENTS + 1) * 2 + 2) * 3);
  const indices: number[] = [];
  const topCenter = (SEGMENTS + 1) * 2;
  const bottomCenter = topCenter + 1;
  for (let i = 0; i <= SEGMENTS; i++) {
    const angle = (i / SEGMENTS) * Math.PI * 2;
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius;
    positions.set([x, BASE_Y, z], i * 6);
    positions.set([x, BASE_Y + beakerHeight * 0.5, z], i * 6 + 3);
    if (i === SEGMENTS) continue;
    const bottom = i * 2;
    const top = bottom + 1;
    const nextBottom = bottom + 2;
    const nextTop = bottom + 3;
    indices.push(bottom, top, nextBottom, top, nextTop, nextBottom);
    indices.push(topCenter, nextTop, top);
    indices.push(bottomCenter, bottom, nextBottom);
  }
  positions.set([0, BASE_Y + beakerHeight * 0.5, 0], topCenter * 3);
  positions.set([0, BASE_Y, 0], bottomCenter * 3);
  const geometry = new THREE.BufferGeometry();
  const attribute = new THREE.BufferAttribute(positions, 3);
  attribute.setUsage(THREE.DynamicDrawUsage);
  geometry.setAttribute("position", attribute);
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

export function updateBeakerLiquid(geometry: THREE.BufferGeometry, remaining: number, tilt: number, beakerHeight: number): void {
  const positions = geometry.getAttribute("position") as THREE.BufferAttribute;
  const level = beakerHeight * 0.5 * remaining;
  const slope = -Math.tan(tilt);
  for (let i = 0; i <= SEGMENTS; i++) {
    const x = positions.getX(i * 2 + 1);
    const top = THREE.MathUtils.clamp(level + slope * x, 0.003, beakerHeight - BASE_Y - 0.006);
    positions.setY(i * 2 + 1, BASE_Y + top);
  }
  positions.setY((SEGMENTS + 1) * 2, BASE_Y + level);
  positions.needsUpdate = true;
  geometry.computeVertexNormals();
  geometry.computeBoundingSphere();
}
