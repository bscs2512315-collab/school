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
import { ChemLab } from "../walk/ChemLab";
import { createBeakerLiquid, updateBeakerLiquid } from "../_practical/beakerLiquid";
import { ApparatusTourTag } from "../_practical/ApparatusTourTag";
import { getReagentLabel } from "../_practical/reagentLabel";
import { BeakerGlassShell, BEAKER_LIP_EXTENSION, BEAKER_LIP_RISE } from "../_practical/BeakerGlassShell";
import { SaltJarVisual } from "../_practical/SaltJarVisual";
import { TestTubeStand } from "../_practical/TestTubeStand";
import { Precipitate } from "../_practical/Precipitate";
import { POUR_FLOW_END, POUR_MOVE_END, POUR_RETURN_END, POUR_TILT_END, smoothPourStep, transferredFraction } from "../_practical/pourMotion";

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

function Tube({ p, vis, off = [0, 0, 0], shake = false, tilt = 0, labelled = false, receiving }: { p: [number, number, number]; vis: TubeVis; off?: [number, number, number]; shake?: boolean; tilt?: number; labelled?: boolean; receiving?: { progress: { current: number }; targetFill: number; color: string; targetColor: string } }) {
  const gref = useRef<THREE.Group>(null);
  const liquidRef = useRef<THREE.Mesh>(null);
  const mixingRef = useRef<THREE.Mesh>(null);
  const mixingMatRef = useRef<THREE.MeshStandardMaterial>(null);
  const matRef = useRef<THREE.MeshStandardMaterial>(null);
  const cur = useMemo(() => new THREE.Color(vis.color), []);
  const blended = useMemo(() => new THREE.Color(), []);
  const reactionColor = useMemo(() => new THREE.Color(), []);
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
  });
  return (
    <group ref={gref} position={[p[0], baseY, p[2]]}>
      {/* realistic grey glass tube with a ROUNDED bottom (children are base-relative) */}
      <mesh position={[0, 0.028 + 0.272 / 2, 0]}><cylinderGeometry args={[0.028, 0.028, 0.272, 24, 1, true]} /><meshStandardMaterial transparent opacity={0.42} depthWrite={false} roughness={0.05} metalness={0.15} color="#c2cace" side={THREE.DoubleSide} /></mesh>
      {/* hemispherical rounded base */}
      <mesh position={[0, 0.028, 0]}><sphereGeometry args={[0.028, 20, 14, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2]} /><meshStandardMaterial transparent opacity={0.45} depthWrite={false} roughness={0.05} metalness={0.15} color="#c2cace" side={THREE.DoubleSide} /></mesh>
      {/* rim — flat black ring at the tube mouth, for clear visibility */}
      <mesh position={[0, 0.3, 0]} rotation={[Math.PI / 2, 0, 0]} renderOrder={10}><torusGeometry args={[0.029, 0.006, 10, 24]} /><meshStandardMaterial color="#2a2a2a" transparent opacity={1} depthWrite={false} roughness={0.5} /></mesh>
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
      <Precipitate color={vis.precip} amount={vis.precipAmt} agitated={shake || Boolean(receiving)} />
      {/* Paper label follows the tube itself and curves around its front, like a real jar label. */}
      {labelled && <TubeLabel />}
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
  // The beaker pivots about its BASE. Keep the actual pouring lip just above the
  // tube rim; the stream itself bridges the last few centimetres seamlessly.
  const TILT = -1.1;
  const over = useMemo(() => {
    // Position the actual pouring lip—not the beaker centre—over the tube.
    // This is deliberately the same point used by the live stream below.
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
    // Draw a live stream from the moving lip to the tube opening. Keeping both
    // endpoints tied to real geometry eliminates the detached-stream gap.
    if (stream.current) {
      const e = t0.current === null ? 0 : s.clock.elapsedTime - t0.current;
      const isPouring = pouring && e >= POUR_TILT_END && e <= POUR_FLOW_END;
      if (isPouring) {
        spout.set(R + BEAKER_LIP_EXTENSION, H + BEAKER_LIP_RISE, 0);
        g.current.localToWorld(spout);
        // The stream reaches the current liquid surface and shortens as the
        // receiving tube fills.
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
          const pulse = 1 + Math.sin(s.clock.elapsedTime * 18) * 0.15;
          splash.current.scale.setScalar(pulse);
          splash.current.visible = true;
        }
        drops.current.forEach((drop, i) => {
          const travel = (s.clock.elapsedTime * 2.7 + i / drops.current.length) % 1;
          drop.position.lerpVectors(spout, tubeSurface, travel);
          const scale = 0.55 + travel * 0.45;
          drop.scale.setScalar(scale);
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
        {/* Bounded liquid with a world-level surface as the beaker tips. */}
        <mesh geometry={liquidGeometry}><meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.06} transparent opacity={0.78} depthWrite={false} roughness={0.12} metalness={0} /></mesh>
        {/* graduation ticks on the +z front */}
        <mesh position={[0, H / 2, 0]}><cylinderGeometry args={[R + 0.002, R + 0.002, H * 0.9, 26, 1, true, -0.5, 1.0]} /><meshStandardMaterial map={grad} transparent={false} alphaTest={0.5} side={THREE.DoubleSide} /></mesh>
        {/* white name label wrapped on the lower front */}
        <mesh position={[0, H * 0.33, 0]}><cylinderGeometry args={[R + 0.003, R + 0.003, 0.068, 34, 1, true, -0.68, 1.36]} /><meshStandardMaterial map={labelTex} roughness={0.82} side={THREE.DoubleSide} /></mesh>
      </group>
      {/* Narrow liquid stream from the moving lip to the rising tube surface. */}
      <mesh ref={stream} visible={false} renderOrder={5} position={[target[0] - 0.01, target[1] + 0.0, target[2]]}>
        {/* Cylinder +Y points at the receiving tube, so the second radius is
            the beaker-lip end: keep it fine for a realistic narrow pour. */}
        <cylinderGeometry args={[0.006, 0.009, 1, 12]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.08} transparent opacity={0.82} depthWrite={false} depthTest={false} roughness={0.12} metalness={0.08} />
      </mesh>
      <mesh ref={splash} visible={false} renderOrder={6} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.005, 0.013, 16]} />
        <meshStandardMaterial color={color} transparent opacity={0.48} depthWrite={false} depthTest={false} roughness={0.1} side={THREE.DoubleSide} />
      </mesh>
      {[0, 1, 2].map((i) => (
        <mesh
          key={i}
          ref={(node) => { if (node) drops.current[i] = node; }}
          visible={false}
          renderOrder={6}
        >
          <sphereGeometry args={[0.0035, 8, 6]} />
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.26} transparent opacity={0.94} depthWrite={false} depthTest={false} roughness={0.08} />
        </mesh>
      ))}
    </group>
  );
}

// ---- Floating name tags (shown during the intro) --------------------------

// Keep Three.js labels aligned with the app's `primary` design token (#005f02).
const PRIMARY_GREEN = "#005f02";
const tubeLabelCache = new Map<string, THREE.CanvasTexture>();
function makeTubeLabelTexture(name: string): THREE.CanvasTexture {
  const cached = tubeLabelCache.get(name);
  if (cached) return cached;
  const c = document.createElement("canvas");
  // Match the compact sticker's real portrait aspect ratio. The former
  // landscape bitmap was being squeezed sideways onto the tube, softening and
  // distorting every glyph.
  c.width = 1024;
  c.height = 800;
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = "rgba(255,255,255,0.94)";
  ctx.roundRect(24, 24, 976, 752, 64);
  ctx.fill();
  ctx.strokeStyle = PRIMARY_GREEN;
  ctx.lineWidth = 18;
  ctx.stroke();
  ctx.fillStyle = "#063b10";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = "900 270px Arial, sans-serif";
  ctx.fillText("SALT", 512, 290);
  // Keep the long second word tall enough to read on a narrow tube by
  // condensing only its width, as on real small-vial labels.
  ctx.save();
  ctx.translate(512, 520);
  ctx.scale(0.76, 1);
  ctx.font = "900 200px Arial, sans-serif";
  ctx.fillText("SOLUTION", 0, 0);
  ctx.restore();
  const tex = new THREE.CanvasTexture(c);
  // This very small decal is often viewed at an angle. Avoid mipmap
  // downsampling, which softens the type into an unreadable grey smudge.
  tex.generateMipmaps = false;
  tex.minFilter = THREE.LinearFilter;
  tex.magFilter = THREE.LinearFilter;
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 16;
  tubeLabelCache.set(name, tex);
  return tex;
}

function TubeLabel() {
  const tex = useMemo(() => makeTubeLabelTexture("Salt solution"), []);
  return (
    <group>
      {/* Compact two-line label with clear space below the tube rim. */}
      <mesh position={[0, 0.25, 0]} renderOrder={50}>
        {/* Kept below the stand's front rail so no text is obscured. */}
        <cylinderGeometry args={[0.0292, 0.0292, 0.064, 28, 1, true, -1.03, 2.06]} />
        {/* An unlit material keeps the printed paper bright and clean. */}
        {/* Keep this in the transparent render pass (at full opacity) so it is
            painted after the translucent pouring stream. The stream is then
            hidden only where it passes behind the sticker, and remains visible
            again below the sticker. */}
        <meshBasicMaterial map={tex} side={THREE.DoubleSide} toneMapped={false} transparent opacity={1} depthTest={false} depthWrite={false} />
      </mesh>
    </group>
  );
}

// Each item actually used in this Pb²⁺ practical, tagged above its position.
// `INTRO_TAG_NAMES` is the canonical tour order (1, 2, 3, …) so the intro HUD
// and the numbered scene badges always match.
const INTRO_TAGS: { at: [number, number, number]; name: string }[] = [
  { at: [-0.7, 1.5, 0.4], name: "Salt sample" },
  { at: [0.05, 1.55, 0.4], name: "Test tube stand" },
  { at: [0.5, 1.52, 0.62], name: "Distilled water" },
  { at: [0.8, 1.52, 0.62], name: "Diluted HCl" },
  { at: [1.1, 1.52, 0.62], name: "NH₄OH" },
  { at: [1.4, 1.52, 0.62], name: "K₂CrO₄" },
  { at: [1.7, 1.52, 0.62], name: "NaOH" },
];
export const INTRO_TAG_NAMES = INTRO_TAGS.map((t) => t.name);

// ---- First-person controller ----------------------------------------------

function Player({ zoom, zoomTarget, intro, introIdx, onAct, onNav, onReady }: { zoom: boolean; zoomTarget: [number, number, number]; intro: boolean; introIdx: number; onAct: () => void; onNav: (h: string) => void; onReady: (r: boolean) => void }) {
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

  useEffect(() => {
    if (!(camera instanceof THREE.PerspectiveCamera)) return;
    // A wider compact FOV keeps the whole apparatus inside short landscape
    // phone viewports instead of cropping its lower half.
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
    // Intro camera tour: the "aim" slide shows the whole bench; each apparatus
    // slide moves the camera to a direct front-on framing of that appliance and
    // lerps toward it, so switching elements (Next) glides smoothly.
    if (intro) {
      if (introIdx >= 1 && INTRO_TAGS[introIdx - 1]) {
        const tag = INTRO_TAGS[introIdx - 1].at;
        tmp.set(
          tag[0],
          tag[1] + (compactView ? 0.08 : 0.12),
          tag[2] + (compactView ? 0.84 : 0.6),
        );
        camera.position.lerp(tmp, 0.08);
        camera.lookAt(tag[0], tag[1] - (compactView ? 0.22 : 0), tag[2]);
      } else {
        tmp.copy(overview);
        if (compactView) tmp.z = 2.35;
        camera.position.lerp(tmp, 0.05);
        camera.lookAt(0.45, 1.12, 0.5);
      }
      return;
    }
    // No walking or manual look controls — the view is kept stable throughout
    // the guided sequence.

    // Camera: zoom onto the tube when requested, else first-person.
    if (zoomRef.current) {
      const xOffset = compactView ? 0.18 : 0;
      tmp.set(zoomTarget[0] + xOffset, zoomTarget[1] + 0.04, zoomTarget[2] + (compactView ? 0.48 : 0.55));
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

export default function PbScene({
  step,
  tubeVis,
  pourTargetFill,
  pourTargetColor,
  activeTube,
  pourItem,
  zoom,
  acting,
  intro,
  introIdx,
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
  zoom: boolean;
  acting: boolean;
  intro: boolean;
  introIdx: number;
  onAct: () => void;
  onNav: (h: string) => void;
  onReady: (r: boolean) => void;
}) {
  const pourProgress = useRef(0);
  useEffect(() => { if (!pourItem) pourProgress.current = 0; }, [pourItem]);
  // Only the tube being worked on is lifted out of the rack; it settles back once
  // its turn is done. Tube 0 = salt-solution + group + NH₄OH (steps 1–6); tube 1 =
  // K₂CrO₄ test (step 7); tube 2 = NaOH test (step 8).
  const LIFT = 0.2;
  const lifts = [
    step >= 1 && step <= 6 ? LIFT : 0,
    step === 7 ? LIFT : 0,
    step === 8 ? LIFT : 0,
    0, // spare tubes stay seated in the rack
    0,
  ];
  const tubePos = (i: number): [number, number, number] => [TUBES[i][0], TUBES[i][1] + lifts[i], TUBES[i][2]];
  const tubeOff = (i: number): [number, number, number] => [0, lifts[i], 0];
  const zoomTarget: [number, number, number] = tubePos(activeTube);
  // reagent beakers: water, hcl, nh4oh, k2cro4, naoh
  const reagents = [
    { id: "water", x: 0.5, color: "#dbe9f4", label: "Dist. Water" },
    { id: "hcl", x: 0.8, color: "#e4eef4", label: "Diluted HCl" },
    { id: "nh4oh", x: 1.1, color: "#e7e2f0", label: "NH₄OH" },
    { id: "k2cro4", x: 1.4, color: "#eab308", label: "K₂CrO₄" },
    { id: "naoh", x: 1.7, color: "#eef0f2", label: "NaOH" },
  ];
  const receiverBaseFill = tubeVis[activeTube]?.fill ?? 0;
  const receiverTargetFill = Math.min(0.92, Math.max(receiverBaseFill, pourTargetFill));
  const pouringReagent = reagents.find((r) => r.id === pourItem);
  return (
    <Canvas shadows camera={{ position: [0, 1.55, 1.4], fov: 70, near: 0.05 }} dpr={[1, 2]} gl={{ antialias: true, powerPreference: "high-performance", precision: "highp", toneMappingExposure: 1.0 }} style={{ touchAction: "none" }}>
      <color attach="background" args={["#e3e7e4"]} />
      <ambientLight intensity={0.6} />
      <hemisphereLight args={["#ffffff", "#c9ccce", 0.5]} />
      <spotLight position={[0, 4.6, 2.5]} angle={0.9} penumbra={0.9} intensity={1.1} decay={0} castShadow shadow-mapSize={[512, 512]} shadow-bias={-0.0004} />
      <pointLight position={[-2.6, 4.5, 0.5]} intensity={0.35} decay={0} />
      <pointLight position={[2.6, 4.5, 0.5]} intensity={0.35} decay={0} />

      <LabRoom chem walkLabNoticeBoard />
      <ChemLab stoveOn={false} holding={false} waterOn={false} simplified />

      <TestTubeStand tubeXs={TUBES.map((tube) => tube[0])} />
      {TUBES.map((p, i) => (
        <Tube
          key={i}
          p={p}
          vis={tubeVis[i]}
          receiving={pourItem && i === activeTube ? { progress: pourProgress, targetFill: receiverTargetFill, color: pouringReagent?.color ?? tubeVis[i].color, targetColor: pourTargetColor } : undefined}
          off={tubeOff(i)}
          shake={acting && step === 3 && i === 0}
          labelled={step >= 5 && i < 3}
        />
      ))}
      <SaltJarVisual hideSpoon={acting && step === 1} />
      {reagents.map((r) => (
        <ReagentBeaker key={r.id} x={r.x} color={r.color} label={r.label} pouring={pourItem === r.id} target={tubePos(activeTube)} progress={pourProgress} receiverFill={{ base: receiverBaseFill, target: receiverTargetFill }} />
      ))}
      {/* action animations */}
      {acting && step === 1 && <Spoon lift={LIFT} />}

      {/* floating apparatus name/number tags while the intro is showing: only the
          ACTIVE apparatus shows its numbered badge and its name */}
      {intro &&
        INTRO_TAGS.map((t, i) =>
          introIdx - 1 === i ? (
            <ApparatusTourTag key={t.name} at={[t.at[0], t.at[1] + 0.02, t.at[2]]} name={t.name} number={i + 1} />
          ) : null,
        )}

      <Player zoom={zoom} zoomTarget={zoomTarget} intro={intro} introIdx={introIdx} onAct={onAct} onNav={onNav} onReady={onReady} />
    </Canvas>
  );
}
