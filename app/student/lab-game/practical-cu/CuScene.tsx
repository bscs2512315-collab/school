"use client";

/**
 * Detection of Pb²⁺ (lead(II)) — Group I salt analysis.
 * A guided 14-step simulation in the first-person lab. The page owns the step
 * machine; this scene renders the bench apparatus and the evolving test-tube
 * visuals, and reports when the student clicks the glowing active item.
 */

import { useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { LabRoom, getLabelTexture } from "../_scene/LabRoom";
import { ChemLab } from "../walk/ChemLab";
import { MIN_X, MAX_X, MIN_Z, MAX_Z, blocked } from "../walk/CharacterScene";

// Three tube slots — raised so the tubes stand IN the rack, not sunk in the bench.
// Five tubes seated in the rack. Tubes 0–2 are the working tubes used by the
// practical; 3 & 4 are spares that stay in the stand.
const TUBES: [number, number, number][] = [
  [-0.27, 1.27, 0.4],
  [-0.11, 1.27, 0.4],
  [0.05, 1.27, 0.4],
  [0.21, 1.27, 0.4],
  [0.37, 1.27, 0.4],
];

export type TubeVis = {
  fill: number; // 0..1 liquid level
  color: string;
  opacity: number;
  powder: boolean; // dry salt at bottom
  precip: string | null; // precipitate colour or null
  precipAmt: number; // 0..1
};

// ---- One test tube in the stand -------------------------------------------

function Tube({ p, vis, off = [0, 0, 0], shake = false, tilt = 0 }: { p: [number, number, number]; vis: TubeVis; off?: [number, number, number]; shake?: boolean; tilt?: number }) {
  const gref = useRef<THREE.Group>(null);
  const matRef = useRef<THREE.MeshStandardMaterial>(null);
  const precipRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const cur = useMemo(() => new THREE.Color(vis.color), []);
  const pAmt = useRef(0); // smoothed precipitate amount (for fade in/out)
  const parts = useMemo(
    () => Array.from({ length: 34 }, () => ({ x: (Math.random() - 0.5) * 0.03, y: Math.random(), z: (Math.random() - 0.5) * 0.03 })),
    [],
  );
  const baseY = p[1] - 0.17; // the tube's bottom — the pivot point
  useFrame((s) => {
    const gr = gref.current;
    if (gr) {
      // translate the tube out of the rack (lift, or relocate over another tube)
      gr.position.x = THREE.MathUtils.lerp(gr.position.x, p[0] + off[0], 0.15);
      gr.position.y = THREE.MathUtils.lerp(gr.position.y, baseY + off[1], 0.15);
      gr.position.z = THREE.MathUtils.lerp(gr.position.z, p[2] + off[2], 0.15);
      // shake (rock about the base) or tilt (pour out)
      const targetRot = shake ? Math.sin(s.clock.elapsedTime * 26) * 0.16 : tilt;
      gr.rotation.z = THREE.MathUtils.lerp(gr.rotation.z, targetRot, shake ? 0.5 : 0.22);
    }
    if (matRef.current) {
      cur.lerp(new THREE.Color(vis.color), 0.12);
      matRef.current.color.copy(cur);
      matRef.current.opacity = vis.opacity;
    }
    if (precipRef.current && (vis.precip || pAmt.current > 0.001)) {
      // ease the precipitate amount toward its target so it forms / dissolves smoothly
      const target = vis.precip ? vis.precipAmt : 0;
      pAmt.current = THREE.MathUtils.lerp(pAmt.current, target, 0.05);
      if (pAmt.current < 0.001) pAmt.current = 0;
      const shownF = pAmt.current * parts.length;
      parts.forEach((pt, i) => {
        // positions are relative to the base pivot now
        dummy.position.set(pt.x, 0.02 + pt.y * 0.07, pt.z);
        const sc = THREE.MathUtils.clamp(shownF - i, 0, 1); // boundary sphere grows/shrinks
        dummy.scale.setScalar(sc < 0.03 ? 0.0001 : sc);
        dummy.updateMatrix();
        precipRef.current!.setMatrixAt(i, dummy.matrix);
      });
      precipRef.current.instanceMatrix.needsUpdate = true;
      const m = precipRef.current.material as THREE.MeshStandardMaterial;
      if (vis.precip) m.color.lerp(new THREE.Color(vis.precip), 0.1);
    }
  });
  return (
    <group ref={gref} position={[p[0], baseY, p[2]]}>
      {/* realistic grey glass tube with a ROUNDED bottom (children are base-relative) */}
      <mesh position={[0, 0.028 + 0.272 / 2, 0]}><cylinderGeometry args={[0.028, 0.028, 0.272, 24, 1, true]} /><meshStandardMaterial transparent opacity={0.42} roughness={0.05} metalness={0.15} color="#c2cace" side={THREE.DoubleSide} /></mesh>
      {/* hemispherical rounded base */}
      <mesh position={[0, 0.028, 0]}><sphereGeometry args={[0.028, 20, 14, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2]} /><meshStandardMaterial transparent opacity={0.45} roughness={0.05} metalness={0.15} color="#c2cace" side={THREE.DoubleSide} /></mesh>
      {/* rim — flat black ring at the tube mouth, for clear visibility */}
      <mesh position={[0, 0.3, 0]} rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[0.029, 0.006, 10, 24]} /><meshStandardMaterial color="#2a2a2a" roughness={0.5} /></mesh>
      {/* powder heap (salt) at the bottom */}
      {vis.powder && (
        <mesh position={[0, 0.035, 0]}><cylinderGeometry args={[0.024, 0.02, 0.05, 18]} /><meshStandardMaterial color="#f6f6f2" roughness={1} /></mesh>
      )}
      {/* liquid (rounded base cap + column) */}
      {vis.fill > 0.02 && (
        <mesh position={[0, 0.02 + (vis.fill * 0.25) / 2, 0]}>
          <cylinderGeometry args={[0.024, 0.024, vis.fill * 0.25, 18]} />
          <meshStandardMaterial ref={matRef} color={vis.color} transparent opacity={vis.opacity} roughness={0.25} />
        </mesh>
      )}
      <instancedMesh ref={precipRef} args={[undefined, undefined, parts.length]}>
        <sphereGeometry args={[0.012, 8, 8]} />
        <meshStandardMaterial color="#ffffff" roughness={0.55} />
      </instancedMesh>
    </group>
  );
}

// ---- The stand + apparatus -------------------------------------------------

function Stand() {
  const woodC = "#c69a63";
  const W = 0.82;
  const holeXs = TUBES.map((t) => t[0] - 0.05); // relative to the stand centre
  const wood = (extra?: object) => <meshStandardMaterial color={woodC} roughness={0.7} {...extra} />;
  return (
    <group position={[0.05, 1.08, 0.4]}>
      {/* solid bottom board (tube bottoms rest here) */}
      <mesh position={[0, 0.0, 0]}><boxGeometry args={[W, 0.03, 0.17]} />{wood()}</mesh>
      {/* top rack: front + back rails, with an open RING (hole) per tube between them */}
      <mesh position={[0, 0.22, 0.07]}><boxGeometry args={[W, 0.03, 0.024]} />{wood()}</mesh>
      <mesh position={[0, 0.22, -0.07]}><boxGeometry args={[W, 0.03, 0.024]} />{wood()}</mesh>
      {holeXs.map((x, i) => (
        <group key={i}>
          {/* the hole the tube passes through */}
          <mesh position={[x, 0.22, 0]} rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[0.041, 0.011, 12, 26]} />{wood()}</mesh>
          {/* short bridges connecting the ring to the front/back rails */}
          <mesh position={[x, 0.22, 0.058]}><boxGeometry args={[0.024, 0.028, 0.03] } />{wood()}</mesh>
          <mesh position={[x, 0.22, -0.058]}><boxGeometry args={[0.024, 0.028, 0.03]} />{wood()}</mesh>
          {/* shallow cradle on the bottom board for the rounded tube base */}
          <mesh position={[x, 0.02, 0]}><cylinderGeometry args={[0.031, 0.031, 0.012, 18]} /><meshStandardMaterial color="#5a4126" roughness={0.9} /></mesh>
        </group>
      ))}
      {/* end legs joining bottom board to the top rails */}
      {[-W / 2 + 0.02, W / 2 - 0.02].map((x, i) => (
        <mesh key={i} position={[x, 0.115, 0]}><boxGeometry args={[0.03, 0.24, 0.17]} />{wood()}</mesh>
      ))}
    </group>
  );
}

// Animated lab spoon: scoops salt from the jar and tips it into tube 0.
// The spoon (handle + bowl) tilts so the bowl pours DOWN over the tube mouth;
// the falling salt is a separate element that drops straight INSIDE the tube.
function Spoon({ lift }: { lift: number }) {
  const g = useRef<THREE.Group>(null);
  const salt = useRef<THREE.Group>(null);
  const inBowl = useRef<THREE.Mesh>(null);
  const t0 = useRef<number | null>(null);
  const jar = useMemo(() => new THREE.Vector3(-0.7, 1.16, 0.4), []);
  const pourPos = useMemo(() => new THREE.Vector3(TUBES[0][0] + 0.02, TUBES[0][1] + 0.16 + lift, TUBES[0][2]), [lift]);
  const from = useMemo(() => new THREE.Vector3(jar.x, 1.15, jar.z), [jar]);
  useFrame((s) => {
    if (t0.current === null) t0.current = s.clock.elapsedTime;
    const t = Math.min(1, (s.clock.elapsedTime - t0.current) / 1.5);
    if (!g.current) return;
    if (t < 0.28) {
      const k = t / 0.28;
      g.current.position.set(jar.x, 1.26 - k * 0.12, jar.z);
      g.current.rotation.z = 0;
    } else if (t < 0.58) {
      const k = (t - 0.28) / 0.3;
      g.current.position.lerpVectors(from, pourPos, k);
      g.current.rotation.z = 0;
    } else {
      g.current.position.copy(pourPos);
      // positive z-rotation raises the handle (+x) and tips the bowl (−x) down
      g.current.rotation.z = THREE.MathUtils.lerp(g.current.rotation.z, 1.15, 0.25);
    }
    if (inBowl.current) inBowl.current.visible = t < 0.62;
    if (salt.current) salt.current.visible = t > 0.72 && t < 0.98;
  });
  const metal = <meshStandardMaterial color="#c9cdd0" metalness={0.6} roughness={0.35} />;
  return (
    <group>
      <group ref={g}>
        <mesh position={[0.11, 0, 0]}><boxGeometry args={[0.2, 0.008, 0.012]} />{metal}</mesh>
        {/* bowl (cup open upward) */}
        <mesh position={[-0.02, 0, 0]} scale={[1, 0.5, 1]}><sphereGeometry args={[0.035, 16, 12, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2]} />{metal}</mesh>
        <mesh ref={inBowl} position={[-0.02, 0.006, 0]}><sphereGeometry args={[0.026, 12, 8, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2]} /><meshStandardMaterial color="#f6f6f2" roughness={1} /></mesh>
      </group>
      {/* salt pouring straight down inside the tube (fine powder stream) */}
      <group ref={salt} position={[TUBES[0][0], TUBES[0][1] - 0.04 + lift, TUBES[0][2]]}>
        <mesh><cylinderGeometry args={[0.012, 0.016, 0.22, 10]} /><meshStandardMaterial color="#f6f6f2" transparent opacity={0.85} roughness={1} /></mesh>
      </group>
    </group>
  );
}

// Salt jar with a curved "Salt" sticker (wrapped on the glass) + salt inside.
function SaltJar({ hideSpoon }: { hideSpoon: boolean }) {
  const tex = useMemo(() => getLabelTexture("Salt", "#8a6a3a"), []);
  const metal = <meshStandardMaterial color="#c9cdd0" metalness={0.6} roughness={0.35} />;
  return (
    <group position={[-0.7, 1.08, 0.4]}>
      {/* glassy grey jar body (matches the test tubes) */}
      <mesh position={[0, 0.09, 0]}><cylinderGeometry args={[0.09, 0.09, 0.18, 24, 1, true]} /><meshStandardMaterial transparent opacity={0.4} roughness={0.05} metalness={0.15} color="#c2cace" side={THREE.DoubleSide} /></mesh>
      <mesh position={[0, 0.04, 0]}><cylinderGeometry args={[0.084, 0.084, 0.08, 22]} /><meshStandardMaterial color="#f0f0ec" roughness={0.9} /></mesh>
      {/* glass base disk (mouth is open — the lid is set aside) */}
      <mesh position={[0, 0.004, 0]}><cylinderGeometry args={[0.088, 0.088, 0.008, 24]} /><meshStandardMaterial transparent opacity={0.5} roughness={0.05} metalness={0.15} color="#c2cace" /></mesh>
      {/* rounded rim on top (like the beakers) */}
      <mesh position={[0, 0.18, 0]} rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[0.09, 0.01, 12, 32]} /><meshStandardMaterial transparent opacity={0.55} roughness={0.05} metalness={0.15} color="#c2cace" /></mesh>
      {/* spoon resting in the jar — the one used to scoop salt (hidden while scooping) */}
      {!hideSpoon && (
        <group position={[0.015, 0.05, 0.02]} rotation={[0.1, 0, 1.12]}>
          <mesh position={[0.11, 0, 0]}><boxGeometry args={[0.2, 0.008, 0.012]} />{metal}</mesh>
          <mesh position={[-0.02, 0, 0]} scale={[1, 0.5, 1]}><sphereGeometry args={[0.033, 16, 12, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2]} />{metal}</mesh>
        </group>
      )}
      {/* the removed lid, lying on the bench beside the open jar */}
      <group position={[0.2, 0.02, 0.02]}>
        <mesh><cylinderGeometry args={[0.095, 0.095, 0.03, 24]} /><meshStandardMaterial color="#1a1a1a" roughness={0.5} /></mesh>
        <mesh position={[0, 0.022, 0]}><cylinderGeometry args={[0.055, 0.055, 0.014, 24]} /><meshStandardMaterial color="#222" roughness={0.5} /></mesh>
      </group>
      {/* curved wrapped label */}
      <mesh position={[0, 0.1, 0]}><cylinderGeometry args={[0.093, 0.093, 0.09, 24, 1, true, -0.95, 1.9]} /><meshStandardMaterial map={tex} roughness={0.7} side={THREE.DoubleSide} /></mesh>
    </group>
  );
}

// Graduation decal: dark tick marks + numbers on a transparent strip (cached).
let pbGradTex: THREE.Texture | null = null;
function getPbGrad(): THREE.Texture {
  if (pbGradTex) return pbGradTex;
  const w = 64, h = 256;
  const c = document.createElement("canvas");
  c.width = w; c.height = h;
  const ctx = c.getContext("2d")!;
  ctx.clearRect(0, 0, w, h);
  ctx.strokeStyle = "#333"; ctx.fillStyle = "#333";
  ctx.font = "bold 15px system-ui, sans-serif";
  for (let i = 1; i <= 10; i++) {
    const y = h - (i / 10) * (h - 20) - 8;
    const long = i % 2 === 0;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(6, y);
    ctx.lineTo(long ? 30 : 20, y);
    ctx.stroke();
    if (long) ctx.fillText(String(i * 10), 33, y + 5);
  }
  pbGradTex = new THREE.CanvasTexture(c);
  pbGradTex.anisotropy = 4;
  return pbGradTex;
}

// A labelled, graduated reagent beaker. Sits on the bench and tilts to pour
// its coloured contents into the active test tube.
function ReagentBeaker({ x, color, pouring, target, label }: { x: number; color: string; pouring: boolean; target: [number, number, number]; label: string }) {
  const g = useRef<THREE.Group>(null);
  const stream = useRef<THREE.Mesh>(null);
  const liquid = useRef<THREE.Mesh>(null);
  const meniscus = useRef<THREE.Mesh>(null);
  const insideFlow = useRef<THREE.Mesh>(null);
  const t0 = useRef<number | null>(null);
  const home = useMemo(() => new THREE.Vector3(x, 1.08, 0.62), [x]);
  // The beaker pivots about its BASE. We want its mouth (top, at height H once
  // upright) to end up just above the tube's rim after tilting by TILT. Solve the
  // base position so mouth = tube rim + a small gap.
  const TILT = -1.1;
  const H_ = 0.17;
  const over = useMemo(() => {
    // mouth offset from base after rotating [0,H] by TILT about z
    const mx = -H_ * Math.sin(TILT);
    const my = H_ * Math.cos(TILT);
    // desired mouth position: centred over the tube opening, just above its rim
    // (rim ≈ target[1] + 0.13) so the stream falls straight INTO the tube
    const mouthX = target[0] - 0.015;
    const mouthY = target[1] + 0.19;
    return new THREE.Vector3(mouthX - mx, mouthY - my, target[2]);
  }, [target]);
  const labelTex = useMemo(() => getLabelTexture(label, "#24406b"), [label]);
  const grad = getPbGrad();
  useFrame((s) => {
    if (!g.current) return;
    if (pouring) {
      if (t0.current === null) t0.current = s.clock.elapsedTime;
      const e = s.clock.elapsedTime - t0.current;
      const MOVE = 1.3; // slow travel-to-position phase (upright), then pour
      if (e < MOVE) {
        // 1) move the beaker into position, staying upright — no pour yet
        g.current.position.lerp(over, 0.06);
        g.current.rotation.z = THREE.MathUtils.lerp(g.current.rotation.z, 0, 0.15);
      } else {
        // 2) settled over the tube → tilt slowly and pour
        g.current.position.lerp(over, 0.25);
        g.current.rotation.z = THREE.MathUtils.lerp(g.current.rotation.z, TILT, 0.06);
      }
    } else {
      t0.current = null;
      g.current.position.lerp(home, 0.12);
      g.current.rotation.z = THREE.MathUtils.lerp(g.current.rotation.z, 0, 0.16);
    }
    const pourAmount = THREE.MathUtils.clamp((-g.current.rotation.z - 0.38) / 0.72, 0, 1);
    const liquidScale = 1 - pourAmount * 0.38;
    if (liquid.current) {
      liquid.current.scale.y = liquidScale;
      liquid.current.position.y = 0.012 + (H * 0.5 * liquidScale) / 2;
    }
    if (meniscus.current) {
      meniscus.current.position.set(R * 0.28 * pourAmount, 0.012 + H * 0.5 * liquidScale, 0);
      meniscus.current.rotation.z = -g.current.rotation.z;
    }
    if (insideFlow.current) insideFlow.current.visible = pourAmount > 0.06;
    // the stream shows whenever the beaker is tilted — perfectly in sync with the pour pose
    if (stream.current) stream.current.visible = g.current.rotation.z < -0.55;
  });
  const R = 0.078, H = 0.17;
  const glass = <meshStandardMaterial transparent opacity={0.34} roughness={0.05} metalness={0.12} color="#dfe6ea" side={THREE.DoubleSide} />;
  return (
    <group>
      <group ref={g} position={home.toArray()}>
        {/* glass body (slightly tapered), open top */}
        <mesh position={[0, H / 2, 0]}><cylinderGeometry args={[R, R * 0.94, H, 26, 1, true]} />{glass}</mesh>
        {/* base disk */}
        <mesh position={[0, 0.005, 0]}><cylinderGeometry args={[R * 0.94, R * 0.94, 0.01, 26]} /><meshStandardMaterial transparent opacity={0.5} roughness={0.05} color="#dfe6ea" /></mesh>
        {/* rim — flat ring lying in the mouth plane (the beaker's top edge) */}
        <mesh position={[0, H, 0]} rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[R, 0.005, 8, 26]} /><meshStandardMaterial transparent opacity={0.55} roughness={0.05} color="#dfe6ea" /></mesh>
        <mesh position={[R - 0.004, H - 0.003, 0]} rotation={[0, 0, -1.35]} scale={[1, 1, 0.5]}><coneGeometry args={[0.018, 0.032, 3, 1, true]} /><meshStandardMaterial transparent opacity={0.42} roughness={0.05} metalness={0.12} color="#dfe6ea" side={THREE.DoubleSide} /></mesh>
        {/* coloured contents — translucent, like real dilute reagent liquid */}
        <mesh ref={liquid} position={[0, 0.012 + (H * 0.5) / 2, 0]}><cylinderGeometry args={[R * 0.9, R * 0.9, H * 0.5, 26]} /><meshStandardMaterial color={color} transparent opacity={0.5} roughness={0.06} metalness={0} /></mesh>
        {/* liquid surface — a brighter reflective meniscus disk */}
        <mesh ref={meniscus} position={[0, 0.012 + H * 0.5, 0]}><cylinderGeometry args={[R * 0.9, R * 0.9, 0.004, 26]} /><meshStandardMaterial color={color} transparent opacity={0.85} roughness={0.03} metalness={0.15} /></mesh>
        <mesh ref={insideFlow} visible={false} position={[R * 0.39, H * 0.66, 0]} rotation={[0, 0, -0.82]}><cylinderGeometry args={[0.013, 0.024, 0.11, 14]} /><meshStandardMaterial color={color} transparent opacity={0.72} roughness={0.08} metalness={0} /></mesh>
        {/* graduation ticks on the +z front */}
        <mesh position={[0, H / 2, 0]}><cylinderGeometry args={[R + 0.002, R + 0.002, H * 0.9, 26, 1, true, -0.5, 1.0]} /><meshStandardMaterial map={grad} transparent={false} alphaTest={0.5} side={THREE.DoubleSide} /></mesh>
        {/* white name label wrapped on the lower front */}
        <mesh position={[0, H * 0.3, 0]}><cylinderGeometry args={[R + 0.004, R + 0.004, 0.062, 34, 1, true, -0.95, 1.9]} /><meshStandardMaterial map={labelTex} roughness={0.7} side={THREE.DoubleSide} /></mesh>
      </group>
      {/* liquid stream falling from the tipped mouth straight down into the tube */}
      <mesh ref={stream} visible={false} position={[target[0] - 0.01, target[1] + 0.0, target[2]]}>
        <cylinderGeometry args={[0.012, 0.017, 0.32, 14]} />
        <meshStandardMaterial color="#b6d4ea" transparent opacity={0.9} roughness={0.15} metalness={0.1} />
      </mesh>
    </group>
  );
}

// ---- First-person controller ----------------------------------------------

function Player({ zoom, zoomTarget, onAct, onNav, onReady }: { zoom: boolean; zoomTarget: [number, number, number]; onAct: () => void; onNav: (h: string) => void; onReady: (r: boolean) => void }) {
  const { camera } = useThree();
  const rig = useRef<THREE.Group>(null);
  const keys = useRef<Record<string, boolean>>({});
  const yaw = useRef(0);
  const pitch = useRef(-0.08);
  const drag = useRef(false);
  const last = useRef({ x: 0, y: 0 });
  const pos = useRef(new THREE.Vector3(0, 1.55, 4.4));
  const bob = useRef(0);
  const navA = useRef(0);
  const readyRef = useRef(false);
  const fwd = useMemo(() => new THREE.Vector3(), []);
  const tmp = useMemo(() => new THREE.Vector3(), []);
  const zoomRef = useRef(zoom);
  zoomRef.current = zoom;

  useEffect(() => {
    const d = (e: KeyboardEvent) => {
      keys.current[e.key.toLowerCase()] = true;
      if (["arrowup", "arrowdown", "arrowleft", "arrowright"].includes(e.key.toLowerCase())) e.preventDefault();
    };
    const u = (e: KeyboardEvent) => (keys.current[e.key.toLowerCase()] = false);
    window.addEventListener("keydown", d);
    window.addEventListener("keyup", u);
    return () => {
      window.removeEventListener("keydown", d);
      window.removeEventListener("keyup", u);
    };
  }, []);

  useEffect(() => {
    const isUI = (t: EventTarget | null) => t instanceof HTMLElement && t.closest("[data-ui]");
    const d = (e: PointerEvent) => {
      // Disallow drag on touch devices to avoid jerkiness & pull-to-refresh reload
      if (isUI(e.target) || e.pointerType === "touch") return;
      drag.current = true;
      last.current = { x: e.clientX, y: e.clientY };
    };
    const m = (e: PointerEvent) => {
      if (!drag.current) return;
      yaw.current -= (e.clientX - last.current.x) * 0.004;
      pitch.current = THREE.MathUtils.clamp(pitch.current - (e.clientY - last.current.y) * 0.004, -1.1, 0.7);
      last.current = { x: e.clientX, y: e.clientY };
    };
    const u = () => (drag.current = false);
    // Drag now only looks around — the action is performed with the X key.
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "x" && readyRef.current) onAct();
      if (e.key === "camreset") {
        pitch.current = -0.15;
        yaw.current = 0;
      }
    };
    window.addEventListener("pointerdown", d);
    window.addEventListener("pointermove", m);
    window.addEventListener("pointerup", u);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("pointerdown", d);
      window.removeEventListener("pointermove", m);
      window.removeEventListener("pointerup", u);
      window.removeEventListener("keydown", onKey);
    };
  }, [onAct]);

  useFrame((s, dt) => {
    const k = keys.current;
    let mv = 0;
    let turn = 0;
    if (k["arrowup"] || k["w"]) mv += 1;
    if (k["arrowdown"] || k["s"]) mv -= 1;
    if (k["arrowleft"] || k["a"]) turn += 1;
    if (k["arrowright"] || k["d"]) turn -= 1;
    if (turn) yaw.current += turn * 1.9 * dt;

    // Dedicated camera controls (smooth continuous movement)
    if (k["camup"] || k["i"]) pitch.current = THREE.MathUtils.clamp(pitch.current + 1.8 * dt, -1.1, 0.7);
    if (k["camdown"] || k["k"]) pitch.current = THREE.MathUtils.clamp(pitch.current - 1.8 * dt, -1.1, 0.7);
    if (k["camleft"] || k["j"]) yaw.current += 1.8 * dt;
    if (k["camright"] || k["l"]) yaw.current -= 1.8 * dt;
    if (k["camreset"]) {
      pitch.current = -0.15;
      yaw.current = 0;
    }
    const moving = mv !== 0 && !zoomRef.current;
    if (moving) {
      const fx = -Math.sin(yaw.current);
      const fz = -Math.cos(yaw.current);
      const nx = THREE.MathUtils.clamp(pos.current.x + fx * 2.4 * mv * dt, MIN_X, MAX_X);
      if (!blocked(nx, pos.current.z)) pos.current.x = nx;
      const nz = THREE.MathUtils.clamp(pos.current.z + fz * 2.4 * mv * dt, MIN_Z, MAX_Z);
      if (!blocked(pos.current.x, nz)) pos.current.z = nz;
      bob.current += dt * 9;
    }

    // Camera: zoom onto the tube when requested, else first-person.
    if (zoomRef.current) {
      tmp.set(zoomTarget[0], zoomTarget[1] + 0.05, zoomTarget[2] + 0.55);
      camera.position.lerp(tmp, 0.08);
      camera.lookAt(zoomTarget[0], zoomTarget[1], zoomTarget[2]);
    } else {
      camera.position.lerp(pos.current, 0.2);
      camera.rotation.set(pitch.current, yaw.current, 0, "YXZ");
    }
    if (rig.current) {
      rig.current.position.copy(camera.position);
      rig.current.quaternion.copy(camera.quaternion);
    }

    camera.getWorldDirection(fwd);
    const nearBench = Math.hypot(pos.current.x, pos.current.z - 0.4) < 2.2;
    tmp.set(0, 1.1, 0.4).sub(camera.position).normalize();
    const ready = !zoomRef.current && nearBench && tmp.dot(fwd) > 0.45;
    if (ready !== readyRef.current) {
      readyRef.current = ready;
      onReady(ready);
    }

    navA.current += dt;
    if (navA.current > 0.25) {
      navA.current = 0;
      let hint = "";
      if (zoomRef.current) hint = "";
      else if (ready) hint = "Press X to perform this step";
      else {
        const dx = -pos.current.x;
        const dz = 0.4 - pos.current.z;
        const dist = Math.hypot(dx, dz);
        const fdot = (dx * fwd.x + dz * fwd.z) / (dist || 1);
        const rdot = (dx * -fwd.z + dz * fwd.x) / (dist || 1);
        if (dist < 1.4) hint = "Turn to face the bench";
        else if (fdot > 0.75) hint = "Move forward to the bench";
        else if (fdot < -0.4) hint = "Turn around";
        else hint = rdot > 0 ? "Turn right" : "Turn left";
      }
      onNav(hint);
    }
  });

  return (
    <group ref={rig}>
    </group>
  );
}

// ---- Root scene ------------------------------------------------------------

export default function PbScene({
  step,
  tubeVis,
  activeTube,
  pourItem,
  zoom,
  acting,
  onAct,
  onNav,
  onReady,
}: {
  step: number;
  tubeVis: TubeVis[];
  activeTube: number;
  pourItem: string | null;
  zoom: boolean;
  acting: boolean;
  onAct: () => void;
  onNav: (h: string) => void;
  onReady: (r: boolean) => void;
}) {
  // Only the tube being worked on is lifted out of the rack; it settles back once
  // its turn is done. Tube 0 = salt-solution + group + NH₄OH (steps 1–5); tube 1 =
  // K₂CrO₄ test (step 6); tube 2 = NaOH test (step 7).
  const LIFT = 0.2;
  const lifts = [
    step >= 1 && step <= 5 ? LIFT : 0,
    step === 6 ? LIFT : 0,
    step === 7 ? LIFT : 0,
    0, // spare tubes stay seated in the rack
    0,
  ];
  const tubePos = (i: number): [number, number, number] => [TUBES[i][0], TUBES[i][1] + lifts[i], TUBES[i][2]];
  const tubeOff = (i: number): [number, number, number] => [0, lifts[i], 0];
  const zoomTarget: [number, number, number] = tubePos(activeTube);
  // reagent beakers: water, hcl, h2s, naoh, k4[Fe(CN)6]
  const reagents = [
    { id: "water", x: 0.5, color: "#dbe9f4", label: "Dist. Water" },
    { id: "hcl", x: 0.8, color: "#e4eef4", label: "Diluted HCl" },
    { id: "h2s", x: 1.1, color: "#eceee0", label: "H₂S" },
    { id: "naoh", x: 1.4, color: "#eef0f2", label: "NaOH" },
    { id: "k4", x: 1.7, color: "#fef08a", label: "K₄[Fe(CN)₆]" },
  ];
  return (
    <Canvas shadows camera={{ position: [0, 1.55, 4.4], fov: 70, near: 0.05 }} dpr={[1, 1.25]} gl={{ antialias: true, powerPreference: "high-performance", precision: "mediump", toneMappingExposure: 1.0 }} style={{ touchAction: "none" }}>
      <color attach="background" args={["#e3e7e4"]} />
      <ambientLight intensity={0.6} />
      <hemisphereLight args={["#ffffff", "#c9ccce", 0.5]} />
      <spotLight position={[0, 4.6, 2.5]} angle={0.9} penumbra={0.9} intensity={1.1} decay={0} castShadow shadow-mapSize={[512, 512]} shadow-bias={-0.0004} />
      <pointLight position={[-2.6, 4.5, 0.5]} intensity={0.35} decay={0} />
      <pointLight position={[2.6, 4.5, 0.5]} intensity={0.35} decay={0} />

      <LabRoom chem />
      <ChemLab stoveOn={false} holding={false} waterOn={false} simplified />

      <Stand />
      {TUBES.map((p, i) => (
        <Tube
          key={i}
          p={p}
          vis={tubeVis[i]}
          off={tubeOff(i)}
          shake={acting && step === 3 && i === 0}
        />
      ))}
      <SaltJar hideSpoon={acting && step === 1} />
      {reagents.map((r) => (
        <ReagentBeaker key={r.id} x={r.x} color={r.color} label={r.label} pouring={pourItem === r.id} target={tubePos(activeTube)} />
      ))}
      {/* action animations */}
      {acting && step === 1 && <Spoon lift={LIFT} />}

      <Player zoom={zoom} zoomTarget={zoomTarget} onAct={onAct} onNav={onNav} onReady={onReady} />
    </Canvas>
  );
}
