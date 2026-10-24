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
import { LabRoom } from "../_scene/LabRoom";
import { ChemLab, STOVE } from "../walk/ChemLab";
import { createBeakerLiquid, updateBeakerLiquid } from "./beakerLiquid";
import { ApparatusTourTag } from "./ApparatusTourTag";
import { getDropperLabel, getReagentLabel } from "./reagentLabel";
import { BeakerGlassShell, BEAKER_LIP_EXTENSION, BEAKER_LIP_RISE } from "./BeakerGlassShell";
import { SaltJarVisual } from "./SaltJarVisual";
import { TestTubeStand } from "./TestTubeStand";
import { Precipitate } from "./Precipitate";
import { POUR_FLOW_END, POUR_MOVE_END, POUR_RETURN_END, POUR_TILT_END, smoothPourStep, transferredFraction } from "./pourMotion";

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
  fizz?: boolean; // rising gas bubbles (effervescence)
  ring?: string; // a coloured ring band at the liquid junction (e.g. NO₃⁻ brown ring)
  layer?: string; // a coloured immiscible bottom layer (e.g. the CS₂ layer)
  fumes?: boolean; // dense white fumes rising above the tube mouth
  mirror?: boolean; // a silver mirror coating on the inner wall (Tollens' test)
};

export type Reagent = { id: string; color: string; label: string };

// ---- Intro apparatus tour ------------------------------------------------
// The tour tags each piece of apparatus actually on the bench, in the order the
// student should learn them: stand, salt jar (salt-analysis practicals), the
// reagent beakers, then the burner / gas rig when those instruments are used.
export type IntroTag = { at: [number, number, number]; name: string };
export type IntroTagOpts = { reagents: Reagent[]; showSalt: boolean; hasHeat: boolean; hasDeliver: boolean };

// Reagent beakers sit in a tight row (fixed ~0.27 spacing), centred on the bench.
export function benchX(i: number, n: number) {
  const sp = Math.min(0.27, 1.42 / Math.max(1, n - 1));
  return 1.06 - ((n - 1) * sp) / 2 + i * sp;
}

// Canonical tagged apparatus for a chemistry practical — single source of truth
// for the intro HUD names and the in-scene camera positions / labels.
export function introTagsFor({ reagents, showSalt, hasHeat, hasDeliver }: IntroTagOpts): IntroTag[] {
  const tags: IntroTag[] = [{ at: [0.05, 1.55, 0.4], name: "Test tube stand" }];
  if (showSalt) tags.push({ at: [-0.7, 1.5, 0.4], name: "Salt sample" });
  reagents.forEach((r, i) => tags.push({ at: [benchX(i, reagents.length), 1.52, 0.62], name: r.label }));
  if (hasHeat) tags.push({ at: [STOVE.x, STOVE.y + 0.52, STOVE.z], name: "Iron stand & burner" });
  if (hasDeliver) tags.push({ at: [0.05, 1.62, 0.4], name: "Gas delivery" });
  return tags;
}

// ---- One test tube in the stand -------------------------------------------

function Tube({ p, vis, off = [0, 0, 0], shake = false, tilt = 0, receiving }: { p: [number, number, number]; vis: TubeVis; off?: [number, number, number]; shake?: boolean; tilt?: number; receiving?: { progress: { current: number }; targetFill: number; color: string; targetColor: string } }) {
  const gref = useRef<THREE.Group>(null);
  const liquidRef = useRef<THREE.Mesh>(null);
  const mixingRef = useRef<THREE.Mesh>(null);
  const mixingMatRef = useRef<THREE.MeshStandardMaterial>(null);
  const matRef = useRef<THREE.MeshStandardMaterial>(null);
  const fizzRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const cur = useMemo(() => new THREE.Color(vis.color), []);
  const blended = useMemo(() => new THREE.Color(), []);
  const reactionColor = useMemo(() => new THREE.Color(), []);
  const bubbles = useMemo(
    () => Array.from({ length: 16 }, () => ({ x: (Math.random() - 0.5) * 0.036, z: (Math.random() - 0.5) * 0.036, off: Math.random(), spd: 0.5 + Math.random() * 0.6, r: 0.4 + Math.random() * 0.6 })),
    [],
  );
  const fumesRef = useRef<THREE.InstancedMesh>(null);
  const fumeParts = useMemo(
    () => Array.from({ length: 14 }, () => ({ x: (Math.random() - 0.5) * 0.05, z: (Math.random() - 0.5) * 0.05, off: Math.random(), spd: 0.25 + Math.random() * 0.3, r: 0.6 + Math.random() * 0.9 })),
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
      blended.set(vis.fill > 0.02 ? vis.color : receiving?.color ?? vis.color);
      if (receiving) blended.lerp(reactionColor.set(receiving.targetColor), receiving.progress.current);
      cur.lerp(blended, 0.16);
      matRef.current.color.copy(cur);
      matRef.current.emissive.copy(cur);
      matRef.current.emissiveIntensity = receiving ? 0.08 : 0;
      matRef.current.opacity = receiving ? Math.max(0.82, vis.opacity) : vis.opacity;
    }
    if (liquidRef.current) {
      const fill = receiving ? THREE.MathUtils.lerp(vis.fill, receiving.targetFill, receiving.progress.current) : vis.fill;
      liquidRef.current.scale.y = fill;
      liquidRef.current.position.y = 0.02 + fill * 0.125;
      if (mixingRef.current && mixingMatRef.current && receiving) {
        const progress = receiving.progress.current;
        const spread = Math.min(1, progress * 1.25);
        const height = fill * 0.25 * spread;
        mixingRef.current.visible = progress > 0.02 && progress < 0.98 && height > 0.002;
        mixingRef.current.scale.y = height;
        mixingRef.current.position.y = 0.02 + fill * 0.25 - height / 2;
        mixingMatRef.current.opacity = 0.34 * Math.sin(Math.PI * progress);
      }
    }
    if (fizzRef.current) {
      const t = s.clock.elapsedTime;
      const top = 0.02 + Math.max(0.12, vis.fill * 0.25); // rise up to the liquid surface
      bubbles.forEach((b, i) => {
        const prog = (t * b.spd + b.off) % 1;
        dummy.position.set(b.x, 0.02 + prog * top, b.z);
        dummy.scale.setScalar(vis.fizz ? b.r * (1 - prog * 0.4) : 0.0001);
        dummy.updateMatrix();
        fizzRef.current!.setMatrixAt(i, dummy.matrix);
      });
      fizzRef.current.instanceMatrix.needsUpdate = true;
    }
    if (fumesRef.current) {
      const t = s.clock.elapsedTime;
      fumeParts.forEach((b, i) => {
        const prog = (t * b.spd + b.off) % 1;
        // fumes billow UP out of the tube mouth (above the rim at ~0.30)
        dummy.position.set(b.x * (0.5 + prog), 0.31 + prog * 0.26, b.z * (0.5 + prog));
        dummy.scale.setScalar(vis.fumes ? b.r * (0.4 + prog * 1.1) : 0.0001);
        dummy.updateMatrix();
        fumesRef.current!.setMatrixAt(i, dummy.matrix);
      });
      fumesRef.current.instanceMatrix.needsUpdate = true;
    }
  });
  return (
    <group ref={gref} position={[p[0], baseY, p[2]]}>
      {/* realistic grey glass tube with a ROUNDED bottom (children are base-relative) */}
      <mesh position={[0, 0.028 + 0.272 / 2, 0]}><cylinderGeometry args={[0.028, 0.028, 0.272, 24, 1, true]} /><meshStandardMaterial transparent opacity={0.42} depthWrite={false} roughness={0.05} metalness={0.15} color="#c2cace" side={THREE.DoubleSide} /></mesh>
      {/* hemispherical rounded base */}
      <mesh position={[0, 0.028, 0]}><sphereGeometry args={[0.028, 20, 14, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2]} /><meshStandardMaterial transparent opacity={0.45} depthWrite={false} roughness={0.05} metalness={0.15} color="#c2cace" side={THREE.DoubleSide} /></mesh>
      {/* rim — flat black ring at the tube mouth, for clear visibility */}
      <mesh position={[0, 0.3, 0]} rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[0.029, 0.006, 10, 24]} /><meshStandardMaterial color="#2a2a2a" roughness={0.5} /></mesh>
      {/* powder heap (salt) at the bottom */}
      {vis.powder && (
        <mesh position={[0, 0.035, 0]}><cylinderGeometry args={[0.024, 0.02, 0.05, 18]} /><meshStandardMaterial color="#f6f6f2" roughness={1} /></mesh>
      )}
      {/* liquid (rounded base cap + column) */}
      {(vis.fill > 0.02 || receiving) && (
        <mesh ref={liquidRef} position={[0, 0.02 + vis.fill * 0.125, 0]} scale={[1, vis.fill, 1]}>
          <cylinderGeometry args={[0.024, 0.024, 0.25, 18]} />
          <meshStandardMaterial ref={matRef} color={vis.fill > 0.02 ? vis.color : receiving?.color} transparent opacity={vis.fill > 0.02 ? vis.opacity : 0.75} depthWrite={false} roughness={0.25} />
        </mesh>
      )}
      {receiving && (
        <mesh ref={mixingRef} visible={false} renderOrder={4}>
          <cylinderGeometry args={[0.023, 0.023, 1, 14]} />
          <meshStandardMaterial ref={mixingMatRef} color={receiving.color} transparent opacity={0} depthWrite={false} roughness={0.2} />
        </mesh>
      )}
      {/* immiscible dense bottom layer (e.g. the CS₂ layer) */}
      {vis.layer && (
        <mesh position={[0, 0.02 + (vis.fill * 0.25 * 0.3) / 2, 0]}>
          <cylinderGeometry args={[0.0242, 0.0242, vis.fill * 0.25 * 0.3, 18]} />
          <meshStandardMaterial color={vis.layer} transparent opacity={0.92} roughness={0.2} />
        </mesh>
      )}
      {/* silver mirror coating on the inner wall (Tollens' test) */}
      {vis.mirror && (
        <mesh position={[0, 0.02 + vis.fill * 0.25 + 0.075, 0]}>
          <cylinderGeometry args={[0.0264, 0.0264, 0.15, 26, 1, true]} />
          <meshStandardMaterial color="#eef0f2" metalness={0.98} roughness={0.06} side={THREE.DoubleSide} />
        </mesh>
      )}
      {/* coloured ring band at the junction (e.g. the brown ring) */}
      {vis.ring && (
        <mesh position={[0, 0.02 + vis.fill * 0.25 * 0.62, 0]}>
          <cylinderGeometry args={[0.0244, 0.0244, 0.018, 18]} />
          <meshStandardMaterial color={vis.ring} transparent opacity={0.95} roughness={0.4} />
        </mesh>
      )}
      <Precipitate color={vis.precip} amount={vis.precipAmt} agitated={shake || Boolean(receiving)} />
      {/* effervescence bubbles (gas evolving) */}
      <instancedMesh ref={fizzRef} args={[undefined, undefined, bubbles.length]}>
        <sphereGeometry args={[0.009, 8, 8]} />
        <meshStandardMaterial color="#ffffff" transparent opacity={0.7} roughness={0.15} metalness={0.1} />
      </instancedMesh>
      {/* dense white fumes billowing out of the mouth */}
      <instancedMesh ref={fumesRef} args={[undefined, undefined, fumeParts.length]}>
        <sphereGeometry args={[0.02, 8, 8]} />
        <meshStandardMaterial color="#f4f6f8" transparent opacity={0.35} roughness={0.9} depthWrite={false} />
      </instancedMesh>
      {/* a glass rod held near the mouth while fumes form (NH₄OH-rod test) */}
      {vis.fumes && (
        <mesh position={[0.06, 0.4, 0.05]} rotation={[0.5, 0, -0.7]}>
          <cylinderGeometry args={[0.006, 0.006, 0.22, 10]} />
          <meshStandardMaterial color="#cdd6db" transparent opacity={0.7} roughness={0.1} metalness={0.1} />
        </mesh>
      )}
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
  const metal = <meshStandardMaterial color="#bcc6c8" metalness={0.72} roughness={0.25} />;
  return (
    <group>
      <group ref={g}>
        <mesh position={[0.09, 0, 0]} rotation={[0, 0, -Math.PI / 2]}><cylinderGeometry args={[0.0035, 0.005, 0.19, 10]} />{metal}</mesh>
        {/* bowl (cup open upward) */}
        <mesh position={[-0.018, -0.002, 0]} scale={[1, 0.35, 0.68]}><sphereGeometry args={[0.032, 16, 8, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2]} />{metal}</mesh>
        <mesh ref={inBowl} position={[-0.02, 0.006, 0]}><sphereGeometry args={[0.026, 12, 8, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2]} /><meshStandardMaterial color="#f6f6f2" roughness={1} /></mesh>
      </group>
      {/* salt pouring straight down inside the tube (fine powder stream) */}
      <group ref={salt} position={[TUBES[0][0], TUBES[0][1] - 0.04 + lift, TUBES[0][2]]}>
        <mesh><cylinderGeometry args={[0.012, 0.016, 0.22, 10]} /><meshStandardMaterial color="#f6f6f2" transparent opacity={0.85} roughness={1} /></mesh>
      </group>
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
function ReagentBeaker({ x, color, pouring, target, label, progress, receiverFill }: { x: number; color: string; pouring: boolean; target: [number, number, number]; label: string; progress: { current: number }; receiverFill: { base: number; target: number } }) {
  const g = useRef<THREE.Group>(null);
  const stream = useRef<THREE.Mesh>(null);
  const splash = useRef<THREE.Mesh>(null);
  const drops = useRef<THREE.Mesh[]>([]);
  const t0 = useRef<number | null>(null);
  const remaining = useRef(1);
  const startRemaining = useRef(1);
  const home = useMemo(() => new THREE.Vector3(x, 1.08, 0.62), [x]);
  const R = 0.078, H = 0.17;
  const liquidGeometry = useMemo(() => createBeakerLiquid(R * 0.9, H), [R, H]);
  const lastShape = useRef({ tilt: Number.NaN, remaining: Number.NaN });
  useEffect(() => () => liquidGeometry.dispose(), [liquidGeometry]);
  const spout = useMemo(() => new THREE.Vector3(), []);
  const tubeSurface = useMemo(() => new THREE.Vector3(), []);
  const streamMid = useMemo(() => new THREE.Vector3(), []);
  const streamDir = useMemo(() => new THREE.Vector3(), []);
  const up = useMemo(() => new THREE.Vector3(0, 1, 0), []);
  // The beaker pivots about its BASE. We want its mouth (top, at height H once
  // upright) to end up just above the tube's rim after tilting by TILT. Solve the
  // base position so mouth = tube rim + a small gap.
  const TILT = -1.1;
  const over = useMemo(() => {
    const lipX = R + BEAKER_LIP_EXTENSION;
    const lipY = H + BEAKER_LIP_RISE;
    const mx = lipX * Math.cos(TILT) - lipY * Math.sin(TILT);
    const my = lipX * Math.sin(TILT) + lipY * Math.cos(TILT);
    const mouthX = target[0];
    const mouthY = target[1] + 0.17;
    return new THREE.Vector3(mouthX - mx, mouthY - my, target[2]);
  }, [target]);
  const labelTex = useMemo(() => getReagentLabel(label), [label]);
  const grad = getPbGrad();
  useFrame((s) => {
    if (!g.current) return;
    if (pouring) {
      if (t0.current === null) {
        t0.current = s.clock.elapsedTime;
        startRemaining.current = remaining.current;
      }
      const e = s.clock.elapsedTime - t0.current;
      const returnAmount = smoothPourStep(POUR_FLOW_END, POUR_RETURN_END, e);
      const positionAmount = smoothPourStep(0, POUR_MOVE_END, e) * (1 - returnAmount);
      const tiltAmount = smoothPourStep(POUR_MOVE_END, POUR_TILT_END, e) * (1 - returnAmount);
      g.current.position.lerpVectors(home, over, positionAmount);
      g.current.rotation.z = TILT * tiltAmount;
      progress.current = transferredFraction(e);
      remaining.current = startRemaining.current - Math.min(0.28, Math.max(0, startRemaining.current - 0.08)) * progress.current;
    } else {
      t0.current = null;
      g.current.position.lerp(home, 0.12);
      g.current.rotation.z = THREE.MathUtils.lerp(g.current.rotation.z, 0, 0.16);
    }
    if (!Number.isFinite(lastShape.current.tilt) || Math.abs(g.current.rotation.z - lastShape.current.tilt) > 0.002 || Math.abs(remaining.current - lastShape.current.remaining) > 0.002) {
      updateBeakerLiquid(liquidGeometry, remaining.current, g.current.rotation.z, H);
      lastShape.current = { tilt: g.current.rotation.z, remaining: remaining.current };
    }
    if (stream.current) {
      const e = t0.current === null ? 0 : s.clock.elapsedTime - t0.current;
      const isPouring = pouring && e >= POUR_TILT_END && e <= POUR_FLOW_END;
      if (isPouring) {
        spout.set(R + BEAKER_LIP_EXTENSION, H + BEAKER_LIP_RISE, 0);
        g.current.localToWorld(spout);
        // The stream ends at the rising liquid surface, not at a fixed point
        // below it; the splash climbs as the receiving tube fills.
        const fill = THREE.MathUtils.lerp(receiverFill.base, receiverFill.target, progress.current);
        tubeSurface.set(target[0], target[1] - 0.15 + fill * 0.25, target[2]);
        streamDir.subVectors(tubeSurface, spout);
        const length = streamDir.length();
        streamMid.addVectors(spout, tubeSurface).multiplyScalar(0.5);
        stream.current.position.copy(streamMid);
        stream.current.quaternion.setFromUnitVectors(up, streamDir.normalize());
        stream.current.scale.set(1, length, 1);
        stream.current.visible = length > 0.01;
        if (splash.current) {
          splash.current.position.copy(tubeSurface);
          splash.current.scale.setScalar(1 + Math.sin(s.clock.elapsedTime * 18) * 0.15);
          splash.current.visible = true;
        }
        drops.current.forEach((drop, i) => {
          const travel = (s.clock.elapsedTime * 2.7 + i / drops.current.length) % 1;
          drop.position.lerpVectors(spout, tubeSurface, travel);
          drop.scale.setScalar(0.55 + travel * 0.45);
          drop.visible = true;
        });
      } else {
        stream.current.visible = false;
        if (splash.current) splash.current.visible = false;
        drops.current.forEach((drop) => { drop.visible = false; });
      }
    }
  });
  return (
    <group>
      <group ref={g} position={home.toArray()}>
        {/* Open glass body with a smooth lip integrated into the wall. */}
        <BeakerGlassShell radius={R} height={H} />
        <mesh position={[0, H / 2, 0]}><cylinderGeometry args={[R + 0.001, R + 0.001, H * 0.8, 26, 1, true, 0.34, 0.12]} /><meshBasicMaterial color="#ffffff" transparent opacity={0.13} depthWrite={false} side={THREE.DoubleSide} /></mesh>
        {/* base disk */}
        <mesh position={[0, 0.005, 0]}><cylinderGeometry args={[R * 0.98, R * 0.98, 0.01, 26]} /><meshStandardMaterial transparent opacity={0.45} roughness={0.08} color="#dae8e6" /></mesh>
        <mesh position={[0, 0.011, 0]} rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[R * 0.98, 0.002, 6, 26]} /><meshStandardMaterial color="#e2efed" transparent opacity={0.46} depthWrite={false} /></mesh>
        {/* One bounded liquid volume, with a surface that stays level as the beaker tips. */}
        <mesh geometry={liquidGeometry}><meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.03} transparent opacity={0.92} depthWrite={false} roughness={0.15} metalness={0.02} /></mesh>
        {/* graduation ticks on the +z front */}
        <mesh position={[0, H / 2, 0]}><cylinderGeometry args={[R + 0.002, R + 0.002, H * 0.9, 26, 1, true, -0.5, 1.0]} /><meshStandardMaterial map={grad} transparent={false} alphaTest={0.5} side={THREE.DoubleSide} /></mesh>
        {/* white name label wrapped on the lower front */}
        <mesh position={[0, H * 0.33, 0]}><cylinderGeometry args={[R + 0.003, R + 0.003, 0.068, 34, 1, true, -0.68, 1.36]} /><meshStandardMaterial map={labelTex} roughness={0.82} side={THREE.DoubleSide} /></mesh>
      </group>
      {/* Narrow liquid stream from the moving lip to the rising tube surface. */}
      <mesh ref={stream} visible={false} renderOrder={5} position={[target[0] - 0.01, target[1], target[2]]}>
        <cylinderGeometry args={[0.006, 0.009, 1, 12]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.03} transparent opacity={0.92} depthWrite={false} depthTest={false} roughness={0.15} metalness={0.02} />
      </mesh>
      <mesh ref={splash} visible={false} renderOrder={6} rotation={[-Math.PI / 2, 0, 0]}><ringGeometry args={[0.005, 0.013, 16]} /><meshStandardMaterial color={color} transparent opacity={0.82} depthWrite={false} depthTest={false} roughness={0.15} side={THREE.DoubleSide} /></mesh>
      {[0, 1, 2].map((i) => (
        <mesh key={i} ref={(node) => { if (node) drops.current[i] = node; }} visible={false} renderOrder={6}>
          <sphereGeometry args={[0.0035, 8, 6]} />
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.05} transparent opacity={0.94} depthWrite={false} depthTest={false} roughness={0.08} />
        </mesh>
      ))}
    </group>
  );
}

// Amber glass bottle and removable ribbed cap with an integral glass pipette.
function ReagentDropperBottle({
  x,
  color,
  pouring,
  target,
  label,
  progress,
  receiverFill,
  dropCount,
}: {
  x: number;
  color: string;
  pouring: boolean;
  target: [number, number, number];
  label: string;
  progress: { current: number };
  receiverFill: { base: number; target: number };
  dropCount: number;
}) {
  const bottleGroup = useRef<THREE.Group>(null);
  const dropperGroup = useRef<THREE.Group>(null);
  const bulbRef = useRef<THREE.Mesh>(null);
  const ripples = useRef<THREE.Mesh[]>([]);
  const impacts = useRef<THREE.Mesh[]>([]);
  const drops = useRef<THREE.Mesh[]>([]);
  const t0 = useRef<number | null>(null);

  const homeBottle = useMemo(() => new THREE.Vector3(x, 1.08, 0.62), [x]);
  const homeDropper = useMemo(() => new THREE.Vector3(0, 0.165, 0), []);
  const hoverDropper = useMemo(
    () => new THREE.Vector3(target[0] - x, target[1] + 0.35 - 1.08, target[2] - 0.62),
    [target, x],
  );

  const tubeSurface = useMemo(() => new THREE.Vector3(), []);
  const dropTipWorld = useMemo(() => new THREE.Vector3(), []);
  const pipetteTip = useMemo(() => new THREE.Vector3(0, -0.123, 0), []);
  const labelTex = useMemo(() => getDropperLabel(label), [label]);
  const dropGeometry = useMemo(() => new THREE.LatheGeometry([
    new THREE.Vector2(0, -0.005), new THREE.Vector2(0.0028, -0.004),
    new THREE.Vector2(0.004, -0.001), new THREE.Vector2(0.0037, 0.002),
    new THREE.Vector2(0.0022, 0.005), new THREE.Vector2(0, 0.008),
  ], 20), []);
  useEffect(() => () => dropGeometry.dispose(), [dropGeometry]);
  const bottleShape = useMemo(() => new THREE.LatheGeometry([
    new THREE.Vector2(0, 0), new THREE.Vector2(0.034, 0),
    new THREE.Vector2(0.043, 0.006), new THREE.Vector2(0.046, 0.014),
    new THREE.Vector2(0.046, 0.105), new THREE.Vector2(0.043, 0.116),
    new THREE.Vector2(0.029, 0.134), new THREE.Vector2(0.021, 0.14),
    new THREE.Vector2(0.021, 0.166), new THREE.Vector2(0.017, 0.169),
  ], 48), []);
  useEffect(() => () => bottleShape.dispose(), [bottleShape]);

  const count = Math.max(1, Math.min(6, dropCount));
  const dropStarts = useMemo(() => Array.from({ length: count }, (_, i) => 0.22 + i * (2.35 / Math.max(1, count - 1))), [count]);
  const dropDuration = 0.48;

  useFrame((s) => {
    if (!bottleGroup.current || !dropperGroup.current) return;

    if (pouring) {
      if (t0.current === null) {
        t0.current = s.clock.elapsedTime;
      }
      const e = s.clock.elapsedTime - t0.current;
      const returnAmount = smoothPourStep(POUR_FLOW_END, POUR_RETURN_END, e);
      const moveAmount = smoothPourStep(0, POUR_MOVE_END, e) * (1 - returnAmount);

      // Dropper lifts up out of bottle and glides to hover over tube
      const liftY = Math.sin(Math.min(1, Math.max(0, moveAmount)) * Math.PI) * 0.14;
      dropperGroup.current.position.lerpVectors(homeDropper, hoverDropper, moveAmount);
      dropperGroup.current.position.y += liftY;

      const dropTime = e - POUR_MOVE_END;
      const landed = dropStarts.filter((start) => dropTime >= start + dropDuration).length;
      progress.current = landed / count;

      // World coordinates for the nozzle tip and the tube's internal liquid surface
      dropTipWorld.copy(pipetteTip);
      dropperGroup.current.localToWorld(dropTipWorld);

      const fill = THREE.MathUtils.lerp(receiverFill.base, receiverFill.target, progress.current);
      tubeSurface.set(target[0], target[1] - 0.15 + fill * 0.25, target[2]);

      // Dropping phase (POUR_MOVE_END to POUR_FLOW_END)
      const isDropping = e >= POUR_MOVE_END && e <= POUR_FLOW_END;
      let bulbSqueeze = 0;

      if (isDropping) {
        drops.current.forEach((drop, i) => {
          if (!drop) return;
          const tRel = dropTime - dropStarts[i];

          if (tRel >= 0 && tRel <= dropDuration) {
            drop.visible = true;

            // Squeeze rubber bulb as drop forms
            if (tRel >= 0 && tRel <= 0.25) {
              const sq = Math.sin((tRel / 0.25) * Math.PI);
              if (sq > bulbSqueeze) bulbSqueeze = sq;
            }

            if (tRel <= 0.14) {
              // Forming at nozzle tip
              const grow = Math.sin((tRel / 0.14) * (Math.PI / 2));
              drop.position.set(dropTipWorld.x, dropTipWorld.y - 0.003 * grow, dropTipWorld.z);
              drop.scale.set(0.85 * grow, 1.15 * grow, 0.85 * grow);
            } else {
              // Falling inside test tube cavity (accelerating under gravity)
              const fallK = (tRel - 0.14) / (dropDuration - 0.14);
              const fallY = Math.pow(fallK, 1.7);
              drop.position.set(
                dropTipWorld.x,
                THREE.MathUtils.lerp(dropTipWorld.y, tubeSurface.y, fallY),
                dropTipWorld.z,
              );
              drop.scale.set(0.9, 1.45, 0.9);
            }
          } else {
            drop.visible = false;
          }
        });

        ripples.current.forEach((ring, i) => {
          const age = dropTime - dropStarts[i] - dropDuration;
          ring.visible = age >= 0 && age < 0.45 && receiverFill.base > 0.02;
          if (ring.visible) {
            ring.position.set(target[0], tubeSurface.y + 0.002, target[2]);
            ring.scale.setScalar(0.35 + age * 2.2);
            (ring.material as THREE.MeshStandardMaterial).opacity = 0.65 * (1 - age / 0.45);
          }
          const impact = impacts.current[i];
          if (!impact) return;
          impact.visible = age >= 0 && age < 0.3 && receiverFill.base > 0.02;
          if (impact.visible) {
            impact.position.set(target[0], tubeSurface.y - 0.004 - age * 0.025, target[2]);
            impact.scale.setScalar(0.45 + age * 2.5);
            (impact.material as THREE.MeshStandardMaterial).opacity = 0.52 * (1 - age / 0.3);
          }
        });
      } else {
        ripples.current.forEach((ring) => { if (ring) ring.visible = false; });
        impacts.current.forEach((impact) => { if (impact) impact.visible = false; });
        drops.current.forEach((drop) => {
          if (drop) drop.visible = false;
        });
      }

      // Bulb squeeze animation
      if (bulbRef.current) {
        bulbRef.current.scale.set(1 + bulbSqueeze * 0.12, 1.8 * (1 - bulbSqueeze * 0.22), 1 + bulbSqueeze * 0.12);
      }
    } else {
      t0.current = null;
      dropperGroup.current.position.lerp(homeDropper, 0.15);
      if (bulbRef.current) bulbRef.current.scale.set(1, 1.8, 1);
      ripples.current.forEach((ring) => { if (ring) ring.visible = false; });
      impacts.current.forEach((impact) => { if (impact) impact.visible = false; });
      drops.current.forEach((drop) => {
        if (drop) drop.visible = false;
      });
    }
  });

  return (
    <group>
      {/* Amber Glass Dropper Bottle (Stays stationary on bench) */}
      <group ref={bottleGroup} position={homeBottle.toArray()}>
        {/* Rounded brown glass, thick base, visible reagent and reflected highlights. */}
        <mesh position={[0, 0.044, 0]}>
          <cylinderGeometry args={[0.039, 0.039, 0.072, 40]} />
          <meshPhysicalMaterial color={color} transparent opacity={0.78} roughness={0.09} metalness={0} depthWrite={false} />
        </mesh>
        <mesh geometry={bottleShape}>
          <meshPhysicalMaterial color="#8a3e17" transparent opacity={0.75} roughness={0.1} metalness={0.02} clearcoat={1} clearcoatRoughness={0.08} side={THREE.DoubleSide} depthWrite={false} />
        </mesh>
        <mesh position={[-0.029, 0.085, 0.029]} rotation={[0, 0, -0.13]}>
          <capsuleGeometry args={[0.0025, 0.07, 4, 8]} />
          <meshBasicMaterial color="#fff8e8" transparent opacity={0.32} depthWrite={false} />
        </mesh>
        <mesh position={[0, 0.006, 0]}>
          <cylinderGeometry args={[0.043, 0.039, 0.012, 40]} />
          <meshPhysicalMaterial color="#612d18" roughness={0.13} clearcoat={1} transparent opacity={0.8} />
        </mesh>
        {/* Paper label wraps the bottle while leaving amber glass visible above and below. */}
        <mesh position={[0, 0.067, 0]}>
          <cylinderGeometry args={[0.0464, 0.0464, 0.064, 48, 1, true]} />
          <meshStandardMaterial color="#f8f7f2" roughness={0.87} side={THREE.DoubleSide} />
        </mesh>
        <mesh position={[0, 0.066, 0]}>
          <cylinderGeometry args={[0.0467, 0.0467, 0.058, 48, 1, true, -0.55, 1.1]} />
          <meshStandardMaterial map={labelTex} roughness={0.88} side={THREE.DoubleSide} />
        </mesh>

        {/* Dropper Pipette Assembly (Lifts and drops) */}
        <group ref={dropperGroup} position={homeDropper.toArray()}>
          {/* The cap moves with the pipette. Fine ribs catch the lab lighting. */}
          <mesh position={[0, 0.015, 0]}>
            <cylinderGeometry args={[0.027, 0.027, 0.046, 48]} />
            <meshStandardMaterial color="#111318" roughness={0.52} />
          </mesh>
          {Array.from({ length: 36 }, (_, i) => {
            const a = (i / 36) * Math.PI * 2;
            return <mesh key={i} position={[Math.cos(a) * 0.0272, 0.015, Math.sin(a) * 0.0272]}>
              <cylinderGeometry args={[0.0007, 0.0007, 0.043, 5]} />
              <meshStandardMaterial color="#414249" roughness={0.55} />
            </mesh>;
          })}
          <mesh position={[0, -0.011, 0]}><cylinderGeometry args={[0.029, 0.029, 0.006, 48]} /><meshStandardMaterial color="#101116" roughness={0.4} /></mesh>
          {/* Glass Pipette tube */}
          <mesh position={[0, -0.069, 0]}>
            <cylinderGeometry args={[0.0042, 0.0015, 0.105, 20]} />
            <meshPhysicalMaterial color="#dcebf0" transparent opacity={0.42} roughness={0.04} clearcoat={1} depthWrite={false} />
          </mesh>
          {/* Liquid column inside pipette */}
          <mesh position={[0, -0.073, 0]}>
            <cylinderGeometry args={[0.0023, 0.0008, 0.087, 16]} />
            <meshStandardMaterial color={color} transparent opacity={0.87} roughness={0.08} />
          </mesh>
          {/* Rubber Bulb (Teat) */}
          <mesh ref={bulbRef} position={[0, 0.067, 0]} scale={[1, 1.8, 1]}>
            <sphereGeometry args={[0.017, 28, 24]} />
            <meshStandardMaterial color="#111216" roughness={0.83} />
          </mesh>
        </group>
      </group>

      {dropStarts.map((_, i) => <group key={`impact-${i}`}>
        <mesh ref={(node) => { if (node) ripples.current[i] = node; }} visible={false} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.005, 0.008, 28]} />
          <meshStandardMaterial color="#e8f8ff" transparent opacity={0.65} depthWrite={false} side={THREE.DoubleSide} />
        </mesh>
        <mesh ref={(node) => { if (node) impacts.current[i] = node; }} visible={false}>
          <sphereGeometry args={[0.007, 16, 12]} />
          <meshStandardMaterial color={color} transparent opacity={0.5} depthWrite={false} roughness={0.16} />
        </mesh>
      </group>)}
      {dropStarts.map((_, i) => (
        <mesh key={i} ref={(node) => { if (node) drops.current[i] = node; }} geometry={dropGeometry} visible={false}>
          <meshStandardMaterial
            color={color}
            emissive={color}
            emissiveIntensity={0.25}
            transparent
            opacity={0.92}
            roughness={0.06}
            metalness={0.1}
          />
        </mesh>
      ))}
    </group>
  );
}

export function isDropperReagent(r: { id: string; label: string; isDropper?: boolean }): boolean {
  if (r.isDropper) return true;
  const s = `${r.id} ${r.label}`.toLowerCase();
  return /indicator|phenolphthalein|methyl\s*orange|litmus|dropper/i.test(s);
}

// ---- First-person controller ----------------------------------------------

function Player({ zoom, zoomTarget, delivering, intro, introIdx, introTags, onAct, onNav, onReady }: { zoom: boolean; zoomTarget: [number, number, number]; delivering: boolean; intro: boolean; introIdx: number; introTags: IntroTag[]; onAct: () => void; onNav: (h: string) => void; onReady: (r: boolean) => void }) {
  const { camera, size } = useThree();
  const compactView = size.width <= 950 && size.height <= 650;
  const rig = useRef<THREE.Group>(null);
  const yaw = useRef(0);
  const pitch = useRef(-0.08);
  // Player starts directly in front of the bench — no walk-in step.
  const pos = useRef(new THREE.Vector3(0, 1.55, 1.4));
  const navA = useRef(0);
  const readyRef = useRef(false);
  const fwd = useMemo(() => new THREE.Vector3(), []);
  const tmp = useMemo(() => new THREE.Vector3(), []);
  const zoomRef = useRef(zoom);
  zoomRef.current = zoom;
  // Overview camera for the intro: a raised front-on shot that frames the whole
  // bench so every tagged apparatus is visible at once.
  const overview = useMemo(() => new THREE.Vector3(0.55, 2.15, 2.7), []);
  const introTagsRef = useRef(introTags);
  introTagsRef.current = introTags;

  useEffect(() => {
    if (!(camera instanceof THREE.PerspectiveCamera)) return;
    // Short landscape phone viewports need a wider vertical frame. The former
    // 58° compact FOV cropped the lower half of apparatus below the screen.
    camera.fov = compactView ? 72 : 70;
    camera.updateProjectionMatrix();
  }, [camera, compactView]);

  useEffect(() => {
    // The practical uses a guided, stable camera. Pointer drags are deliberately
    // ignored so students cannot tilt the scene and make later prompt cards look
    // detached from the lab's bottom edge.
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "x" && readyRef.current) onAct();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
    };
  }, [onAct]);

  useFrame((s, dt) => {
    // Intro camera tour: the "aim" slide frames the whole bench; each apparatus
    // slide flies the camera to a direct front-on view and lerps toward it, so
    // switching elements (Next) glides smoothly.
    if (intro) {
      if (introIdx >= 1 && introTagsRef.current[introIdx - 1]) {
        const tag = introTagsRef.current[introIdx - 1].at;
        tmp.set(
          tag[0],
          tag[1] + (compactView ? 0.08 : 0.12),
          tag[2] + (compactView ? 0.84 : 0.55),
        );
        camera.position.lerp(tmp, 0.08);
        // Tour tags sit above their objects. Aim below the tag on phones so the
        // whole apparatus—not empty wall above it—occupies the centre frame.
        camera.lookAt(tag[0], tag[1] - (compactView ? 0.22 : 0), tag[2]);
      } else {
        tmp.copy(overview);
        if (compactView) tmp.z = 2.35;
        camera.position.lerp(tmp, 0.05);
        camera.lookAt(0.45, 1.12, 0.5);
      }
      if (rig.current) {
        rig.current.position.copy(camera.position);
        rig.current.quaternion.copy(camera.quaternion);
      }
      return;
    }
    // No walking or manual look controls — the view is kept stable throughout
    // the guided sequence.

    // Camera: zoom onto the tube when requested, else first-person.
    if (zoomRef.current) {
      // Gas-delivery observations need both connected tubes, the bent tube,
      // and the lime-water level in view — not the tight single-tube close-up.
      const xOffset = compactView ? 0.18 : 0;
      tmp.set(
        zoomTarget[0] + xOffset,
        zoomTarget[1] + (delivering ? 0.08 : 0.04),
        zoomTarget[2] + (delivering ? (compactView ? 0.64 : 0.72) : compactView ? 0.48 : 0.55),
      );
      camera.position.lerp(tmp, 0.08);
      camera.lookAt(zoomTarget[0] + xOffset, zoomTarget[1], zoomTarget[2]);
    } else {
      tmp.copy(pos.current);
      if (compactView) {
        tmp.x = 0.16;
        tmp.z = 1.25;
      }
      camera.position.lerp(tmp, 0.2);
      if (compactView) camera.lookAt(0.26, 1.28, 0.4);
      else camera.rotation.set(pitch.current, yaw.current, 0, "YXZ");
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
      onNav(zoomRef.current || ready ? "" : "Aim at the bench");
    }
  });

  return (
    <group ref={rig} />
  );
}

// ---- Root scene ------------------------------------------------------------

// A rubber stopper on the source tube + a bent (U-shaped) glass delivery tube that
// carries the evolved gas over into the target tube (its end submerged in the liquid).
function GasApparatus({ from, to }: { from: [number, number, number]; to: [number, number, number] }) {
  const fRim = from[1] + 0.13; // tube rim (tubes seated in the rack)
  const tRim = to[1] + 0.13;
  const grp = useRef<THREE.Group>(null);
  const t0 = useRef<number | null>(null);
  const curve = useMemo(
    () =>
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(from[0], fRim + 0.04, from[2]),
        new THREE.Vector3(from[0], fRim + 0.24, from[2]),
        new THREE.Vector3(from[0], fRim + 0.32, from[2]),
        new THREE.Vector3((from[0] + to[0]) / 2, fRim + 0.36, (from[2] + to[2]) / 2),
        new THREE.Vector3(to[0], tRim + 0.30, to[2]),
        new THREE.Vector3(to[0], tRim + 0.16, to[2]),
        new THREE.Vector3(to[0], tRim - 0.16, to[2]), // submerged into the liquid
      ]),
    [from, to, fRim, tRim],
  );
  // Drop the whole assembly (stopper + delivery tube) DOWN from above, so it reads
  // as placing the cork on the tube — not rising up out of it.
  useFrame((s) => {
    if (t0.current === null) t0.current = s.clock.elapsedTime;
    const e = s.clock.elapsedTime - t0.current;
    const drop = THREE.MathUtils.clamp((e - 0.35) / 0.55, 0, 1);
    if (grp.current) grp.current.position.y = (1 - drop) * 0.34;
  });
  return (
    <group ref={grp}>
      {/* rubber stopper on the source tube */}
      <mesh position={[from[0], fRim + 0.015, from[2]]} castShadow>
        <cylinderGeometry args={[0.034, 0.028, 0.055, 18]} />
        <meshStandardMaterial color="#2b2b2b" roughness={0.75} />
      </mesh>
      {/* bent glass delivery tube */}
      <mesh>
        <tubeGeometry args={[curve, 60, 0.0075, 12, false]} />
        <meshStandardMaterial transparent opacity={0.5} roughness={0.05} metalness={0.15} color="#cdd6db" />
      </mesh>
    </group>
  );
}

// A wooden-handled test-tube holder (tongs) gripping the tube while it heats.
function TubeHolder({ pos }: { pos: [number, number, number] }) {
  const wood = <meshStandardMaterial color="#7a5a34" roughness={0.7} />;
  const metal = <meshStandardMaterial color="#b9bdc1" metalness={0.7} roughness={0.3} />;
  return (
    <group position={pos}>
      {/* sprung clamp arcs wrapping the tube */}
      <mesh rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[0.034, 0.004, 8, 24, Math.PI * 1.5]} />{metal}</mesh>
      <mesh position={[0, -0.05, 0]} rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[0.034, 0.004, 8, 24, Math.PI * 1.5]} />{metal}</mesh>
      {/* pivot + shaft running back toward the handle (+z, player side) */}
      <mesh position={[0, -0.025, 0.06]} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.005, 0.005, 0.16, 10]} />{metal}</mesh>
      <mesh position={[0, -0.025, 0.18]} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.012, 0.012, 0.03, 12]} />{metal}</mesh>
      {/* wooden handle */}
      <mesh position={[0, -0.025, 0.28]} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.016, 0.02, 0.17, 14]} />{wood}</mesh>
    </group>
  );
}

export default function PracticalScene({
  step,
  tubeVis,
  pourTargetFill,
  pourTargetColor,
  activeTube,
  pourItem,
  dropCount,
  reagents,
  zoom,
  acting,
  actionAnim,
  deliver,
  introDeliver,
  cappedTubes,
  heating,
  showSalt,
  intro,
  introIdx,
  introTags,
  onAct,
  onNav,
  onReady,
}: {
  step: number;
  tubeVis: TubeVis[];
  pourTargetFill: number;
  pourTargetColor: string;
  activeTube: number;
  pourItem: string | null;
  dropCount: number;
  reagents: Reagent[];
  zoom: boolean;
  acting: boolean;
  actionAnim: "spoon" | "shake" | null; // which action animation is playing
  deliver: { from: number; to: number } | null; // gas delivery: source tube → target tube
  introDeliver: { from: number; to: number } | null;
  cappedTubes: number[]; // tubes that keep a cork on after a gas step
  heating: boolean; // the active tube is being heated on the Bunsen burner
  showSalt: boolean; // salt-analysis practicals show the salt jar on the bench
  intro: boolean; // intro camera tour is running
  introIdx: number; // the intro tour's current apparatus index
  introTags: IntroTag[]; // the tagged apparatus list the tour flies between
  onAct: () => void;
  onNav: (h: string) => void;
  onReady: (r: boolean) => void;
}) {
  const pourProgress = useRef(0);
  useEffect(() => { if (!pourItem) pourProgress.current = 0; }, [pourItem]);
  // On the gas-delivery intro slide, show the real stopper and tube assembly
  // rather than labeling an empty stand of tubes.
  const deliveryPreview = deliver ?? (intro && introTags[introIdx - 1]?.name === "Gas delivery" ? introDeliver : null);
  // Generic rule: only the tube for the CURRENT step (activeTube) is lifted out of
  // the rack. During a gas delivery both tubes stay seated (linked by the pipe).
  const LIFT = 0.2;
  const lifts = TUBES.map((_, i) => (!deliveryPreview && !heating && i === activeTube && step >= 1 ? LIFT : 0));
  const tubePos = (i: number): [number, number, number] => [TUBES[i][0], TUBES[i][1] + lifts[i], TUBES[i][2]];
  // Heating: keep the tube's rounded bottom just above the flame tip. This
  // reads as heat applied from below, without the flame intersecting the glass.
  const stoveOff: [number, number, number] = [STOVE.x - TUBES[activeTube][0], STOVE.y + 0.60 - (TUBES[activeTube][1] - 0.17), STOVE.z - TUBES[activeTube][2]];
  const tubeOff = (i: number): [number, number, number] => (heating && i === activeTube ? stoveOff : [0, lifts[i], 0]);
  const zoomTarget: [number, number, number] = heating
    ? [STOVE.x, STOVE.y + 0.52, STOVE.z]
    : deliveryPreview
    // During a delivery result, the receiving tube is the observation: focus
    // it directly so changes such as milky lime water are unmistakable.
    ? [TUBES[deliveryPreview.to][0], TUBES[deliveryPreview.to][1] + 0.12, TUBES[deliveryPreview.to][2]]
    : tubePos(activeTube);
  // Beakers sit in a tight row (fixed ~0.27 spacing), centred on the bench, so
  // they stay close together whether there are 3 of them or 7.
  const bx = benchX;
  const receiverBaseFill = tubeVis[activeTube]?.fill ?? 0;
  const receiverTargetFill = Math.min(0.92, Math.max(receiverBaseFill + 0.1, pourTargetFill));
  const pouringReagent = reagents.find((r) => r.id === pourItem);
  return (
    <Canvas shadows camera={{ position: [0, 1.55, 1.4], fov: 70, near: 0.05 }} dpr={[1, 2]} gl={{ antialias: true, powerPreference: "high-performance", precision: "highp", toneMappingExposure: 1.0 }} style={{ touchAction: "none" }}>
      <color attach="background" args={["#e3e7e4"]} />
      <ambientLight intensity={0.6} />
      <hemisphereLight args={["#ffffff", "#c9ccce", 0.5]} />
      <spotLight position={[0, 4.6, 2.5]} angle={0.9} penumbra={0.9} intensity={1.1} decay={0} castShadow shadow-mapSize={[512, 512]} shadow-bias={-0.0004} />
      <pointLight position={[-2.6, 4.5, 0.5]} intensity={0.35} decay={0} />
      <pointLight position={[2.6, 4.5, 0.5]} intensity={0.35} decay={0} />

      <LabRoom chem />
      <ChemLab stoveOn={heating} holding={false} waterOn={false} simplified />
      {/* test-tube holder gripping the tube while it heats on the burner */}
      {heating && <TubeHolder pos={[STOVE.x, STOVE.y + 0.78, STOVE.z]} />}

      <TestTubeStand tubeXs={TUBES.map((tube) => tube[0])} />
      {TUBES.map((p, i) => (
        <Tube
          key={i}
          p={p}
          vis={tubeVis[i]}
          receiving={pourItem && i === activeTube ? { progress: pourProgress, targetFill: receiverTargetFill, color: pouringReagent?.color ?? tubeVis[i].color, targetColor: pourTargetColor } : undefined}
          off={tubeOff(i)}
          shake={actionAnim === "shake" && i === activeTube}
        />
      ))}
      {showSalt && <SaltJarVisual hideSpoon={acting && step === 1} />}
      {reagents.map((r, i) => {
        const isDropper = isDropperReagent(r);
        return isDropper ? (
          <ReagentDropperBottle
            key={r.id}
            x={bx(i, reagents.length)}
            color={r.color}
            label={r.label}
            pouring={pourItem === r.id}
            dropCount={dropCount}
            target={tubePos(activeTube)}
            progress={pourProgress}
            receiverFill={{ base: receiverBaseFill, target: receiverTargetFill }}
          />
        ) : (
          <ReagentBeaker
            key={r.id}
            x={bx(i, reagents.length)}
            color={r.color}
            label={r.label}
            pouring={pourItem === r.id}
            target={tubePos(activeTube)}
            progress={pourProgress}
            receiverFill={{ base: receiverBaseFill, target: receiverTargetFill }}
          />
        );
      })}
      {/* gas delivery: stopper on the source tube + U-shaped pipe into the target */}
      {deliveryPreview && <GasApparatus from={TUBES[deliveryPreview.from]} to={TUBES[deliveryPreview.to]} />}
      {/* corks that remain on tubes after the gas has been passed */}
      {cappedTubes.map((i) => (
        <mesh key={i} position={[TUBES[i][0], TUBES[i][1] + 0.13 + lifts[i] + 0.015, TUBES[i][2]]}>
          <cylinderGeometry args={[0.034, 0.028, 0.055, 18]} />
          <meshStandardMaterial color="#2b2b2b" roughness={0.75} />
        </mesh>
      ))}
      {/* action animations */}
      {actionAnim === "spoon" && <Spoon lift={LIFT} />}

      {/* floating apparatus name/number tags while the intro is showing: only the
          ACTIVE apparatus shows its numbered badge and its name */}
      {intro &&
        introTags.map((t, i) =>
          introIdx - 1 === i ? (
            <ApparatusTourTag key={t.name} at={[t.at[0], t.at[1] + 0.02, t.at[2]]} name={t.name} number={i + 1} />
          ) : null,
        )}

      <Player zoom={zoom} zoomTarget={zoomTarget} delivering={Boolean(deliver)} intro={intro} introIdx={introIdx} introTags={introTags} onAct={onAct} onNav={onNav} onReady={onReady} />
    </Canvas>
  );
}
