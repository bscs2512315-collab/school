"use client";

/**
 * Glucose practical — Increment 1: grab & place in the first-person lab.
 *
 * Same lab as /walk (LabRoom + ChemLab). Nothing is pre-placed on the centre
 * table. The student must:
 *   • walk (arrows) + look (drag)
 *   • look at a required item (glowing) → Click to grab → it rides in hand
 *   • walk to the centre table → Click to place
 *   • press D to drop a wrong item back
 * A guidance panel (rendered by the page) tracks which items are collected.
 *
 * Reagents (Glucose / Fehling's A / Fehling's B) live on the right-wall shelf;
 * the conical flask + funnel live on the back instruments counter.
 */

import { useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { LabRoom, MediaBottle, BlueGlass, HX, HZ } from "../_scene/LabRoom";
import { ChemLab, STOVE } from "../walk/ChemLab";
import { MIN_X, MAX_X, MIN_Z, MAX_Z, blocked } from "../walk/CharacterScene";
import { playStep } from "../_scene/labAudio";

export type ItemId = "glucose" | "fehlingA" | "fehlingB" | "flask" | "funnel";

export type ItemDef = {
  id: ItemId;
  label: string;
  kind: "reagent" | "flask" | "funnel";
  color: string;
  home: [number, number, number];
  hint: string;
};

// Left-wall shelf geometry (matches ChemWall). Reagents stand IN the packed row
// with the generic bottle behind them removed (see REAGENT_GAP_Z), so lifting
// one leaves a clean empty slot.
const SHELF_W = 0.6 * 0.72;
const GEN_X = -(HX - SHELF_W / 2 - 0.02); // packed-row x on the left wall
const SHELF_Y = 1.6; // bottom shelf (same seat as the generic bottles)
const COUNTER_Y = 1.08; // back / centre worktop top

// z slots on the left-wall bottom shelf kept empty for the reagents.
export const REAGENT_GAP_Z = [-0.6, 0.0, 0.6];

export const ITEMS: ItemDef[] = [
  // Realistic solution colours: glucose colourless, Fehling's A blue, Fehling's B colourless.
  { id: "glucose", label: "Glucose", kind: "reagent", color: "#e2edf3", home: [GEN_X, SHELF_Y, -0.6], hint: "Left wall · bottom shelf" },
  { id: "fehlingA", label: "Fehling's A", kind: "reagent", color: "#1f5fd0", home: [GEN_X, SHELF_Y, 0.0], hint: "Left wall · bottom shelf" },
  { id: "fehlingB", label: "Fehling's B", kind: "reagent", color: "#e8eef2", home: [GEN_X, SHELF_Y, 0.6], hint: "Left wall · bottom shelf" },
  { id: "flask", label: "Conical flask", kind: "flask", color: "#ffffff", home: [-1.4, COUNTER_Y, -HZ + 0.5], hint: "Back counter (glassware)" },
  { id: "funnel", label: "Funnel", kind: "funnel", color: "#ffffff", home: [-0.9, COUNTER_Y, -HZ + 0.5], hint: "Back counter (glassware)" },
];

// Table slots — front row of the centre bench, away from the sink (x≈-1.5) and
// stove (x≈1.2), so placed items are clearly visible.
const TABLE_SLOTS: Record<ItemId, [number, number, number]> = {
  flask: [0.3, COUNTER_Y, 0.5],
  funnel: [0.3, COUNTER_Y + 0.21, 0.5],
  glucose: [-0.9, COUNTER_Y, 0.5],
  fehlingA: [-0.5, COUNTER_Y, 0.5],
  fehlingB: [-0.1, COUNTER_Y, 0.5],
};
// Centre of the table, used for the "can I place here?" facing check.
const TABLE_CENTER = new THREE.Vector3(0, COUNTER_Y, 0.4);

// The order reagents are poured into the flask.
export const REAGENT_ORDER: ItemId[] = ["glucose", "fehlingA", "fehlingB"];

// ---- Item visuals ----------------------------------------------------------

function ReagentModel({ color, label }: { color: string; label?: string }) {
  return (
    <group scale={0.6}>
      <MediaBottle position={[0, 0, 0]} color={color} fill={0.55} label={label} />
    </group>
  );
}

function FlaskModel() {
  const prof = [
    [0.001, 0], [0.11, 0], [0.11, 0.03], [0.04, 0.19], [0.035, 0.28], [0.04, 0.31],
  ].map(([x, y]) => new THREE.Vector2(x, y));
  return (
    <group>
      <mesh><latheGeometry args={[prof, 20]} /><BlueGlass /></mesh>
      <mesh position={[0, 0.31, 0]}><torusGeometry args={[0.04, 0.005, 6, 16]} /><BlueGlass /></mesh>
    </group>
  );
}

function FunnelModel() {
  return (
    <group>
      <mesh position={[0, 0.14, 0]}><cylinderGeometry args={[0.09, 0.012, 0.14, 20, 1, true]} /><BlueGlass /></mesh>
      <mesh position={[0, 0.04, 0]}><cylinderGeometry args={[0.014, 0.014, 0.12, 12, 1, true]} /><BlueGlass /></mesh>
    </group>
  );
}

function ItemModel({ def }: { def: ItemDef }) {
  if (def.kind === "reagent") return <ReagentModel color={def.color} label={def.label} />;
  if (def.kind === "flask") return <FlaskModel />;
  return <FunnelModel />;
}

// Realistic flask colour by reagents added (glucose colourless, A blue, B
// colourless → Fehling's mixture is blue): 1=clear, 2=blue, 3=blue.
const C_CLEAR = new THREE.Color("#e2edf3");
const C_BLUE = new THREE.Color("#1f5fd0");
const C_GREEN = new THREE.Color("#3aa856");
const C_RED = new THREE.Color("#8f2a12"); // brick-red Cu₂O precipitate

function preheatColor(out: THREE.Color, n: number) {
  out.copy(n >= 2 ? C_BLUE : C_CLEAR);
}

// The reaction flask — liquid colour is the MIX of the reagents added, then on
// heating animates mixture → green → brick-red, with rising bubbles.
function ReactionFlask({
  added,
  heating,
  reactionDone,
  onHeatDone,
}: {
  added: number;
  heating: boolean;
  reactionDone: boolean;
  onHeatDone: () => void;
}) {
  const matRef = useRef<THREE.MeshStandardMaterial>(null);
  const bubbleRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const cur = useMemo(() => new THREE.Color("#e2edf3"), []);
  const tgt = useMemo(() => new THREE.Color(), []);
  const heatT = useRef(0);
  const done = useRef(false);
  const bubbles = useMemo(
    () => Array.from({ length: 14 }, () => ({ x: (Math.random() - 0.5) * 0.11, z: (Math.random() - 0.5) * 0.11, off: Math.random(), sp: 0.5 + Math.random() * 0.6 })),
    [],
  );

  useFrame((s, dt) => {
    if (!matRef.current) return;
    if (reactionDone && !heating) {
      // hold the final brick-red result after heating
      tgt.copy(C_RED);
      heatT.current = 1;
    } else if (!heating) {
      heatT.current = 0;
      done.current = false;
      preheatColor(tgt, added); // clear (glucose) → blue (Fehling's added)
    } else {
      heatT.current = Math.min(1, heatT.current + dt / 8); // slower reaction (~8s)
      const t = heatT.current;
      if (t < 0.5) tgt.copy(C_BLUE).lerp(C_GREEN, t / 0.5);
      else tgt.copy(C_GREEN).lerp(C_RED, (t - 0.5) / 0.5);
      if (t >= 1 && !done.current) {
        done.current = true;
        onHeatDone();
      }
    }
    cur.lerp(tgt, 0.1);
    matRef.current.color.copy(cur);

    // Rising bubbles while heating.
    if (bubbleRef.current) {
      const active = heating && heatT.current < 1;
      bubbles.forEach((b, i) => {
        const prog = active ? (s.clock.elapsedTime * b.sp + b.off) % 1 : -1;
        const sc = active ? 1 : 0.0001;
        dummy.position.set(b.x, 0.01 + prog * 0.13, b.z);
        dummy.scale.setScalar(sc);
        dummy.updateMatrix();
        bubbleRef.current!.setMatrixAt(i, dummy.matrix);
      });
      bubbleRef.current.instanceMatrix.needsUpdate = true;
    }
  });

  return (
    <group>
      <FlaskModel />
      {(added > 0 || heating) && (
        <>
          {/* liquid: wide bottom, narrow top — fills the lower flask body */}
          <mesh position={[0, 0.055, 0]}>
            <cylinderGeometry args={[0.06, 0.108, 0.11, 24]} />
            <meshStandardMaterial ref={matRef} color="#e2edf3" roughness={0.2} transparent opacity={0.72} />
          </mesh>
          <instancedMesh ref={bubbleRef} args={[undefined, undefined, bubbles.length]}>
            <sphereGeometry args={[0.008, 6, 6]} />
            <meshStandardMaterial color="#ffffff" transparent opacity={0.7} />
          </instancedMesh>
        </>
      )}
    </group>
  );
}

// A reagent bottle tilted over the flask, pouring a coloured stream, shown for
// the pour duration. Positioned above the table flask slot.
function PouringReagent({ def }: { def: ItemDef }) {
  const g = useRef<THREE.Group>(null);
  const t0 = useRef<number | null>(null);
  const fx = TABLE_SLOTS.flask[0];
  const fy = TABLE_SLOTS.flask[1];
  const fz = TABLE_SLOTS.flask[2];
  useFrame((s) => {
    if (t0.current === null) t0.current = s.clock.elapsedTime;
    const t = Math.min(1, (s.clock.elapsedTime - t0.current) / 1.3);
    const tilt = t < 0.3 ? (t / 0.3) * 2.1 : t > 0.85 ? (1 - (t - 0.85) / 0.15) * 2.1 : 2.1;
    if (g.current) g.current.rotation.z = -tilt;
  });
  return (
    <group position={[fx - 0.15, fy + 0.34, fz]}>
      <group ref={g}>
        <group scale={0.42}>
          <ItemModel def={def} />
        </group>
      </group>
      {/* pouring stream into the flask */}
      <mesh position={[0.05, -0.2, 0]}>
        <cylinderGeometry args={[0.008, 0.012, 0.34, 8]} />
        <meshStandardMaterial color={def.color} transparent opacity={0.85} roughness={0.3} />
      </mesh>
    </group>
  );
}

// The whole current item glows translucent green and blinks — a tall green
// "ghost" enclosing the bottle, drawn through walls (depthTest off) so it's
// unmistakable from every angle, including from behind the shelf.
function BlinkHighlight({ targeted }: { targeted: boolean }) {
  const ref = useRef<THREE.MeshBasicMaterial>(null);
  useFrame((s) => {
    if (ref.current) ref.current.opacity = 0.18 + Math.abs(Math.sin(s.clock.elapsedTime * 3.2)) * (targeted ? 0.5 : 0.32);
  });
  return (
    <mesh position={[0, 0.26, 0]} renderOrder={999}>
      <cylinderGeometry args={[0.13, 0.13, 0.56, 16]} />
      <meshBasicMaterial ref={ref} color="#1dff44" transparent depthWrite={false} depthTest={false} toneMapped={false} side={THREE.DoubleSide} />
    </mesh>
  );
}

// ---- First-person controller with grab -------------------------------------

function Player({
  collected,
  held,
  activeId,
  phase,
  added,
  onTarget,
  onGrab,
  onPlace,
  onDrop,
  onStove,
  onWater,
  onNavHint,
  onReact,
}: {
  collected: Set<ItemId>;
  held: ItemId | null;
  activeId: ItemId | null;
  phase: "gather" | "react" | "heating" | "cooldown" | "form";
  added: number;
  onTarget: (id: ItemId | null, canPlace: boolean, reactReady: boolean) => void;
  onGrab: (id: ItemId) => void;
  onPlace: () => void;
  onDrop: () => void;
  onStove: () => void;
  onWater: () => void;
  onNavHint: (hint: string) => void;
  onReact: () => void;
}) {
  const { camera } = useThree();
  const rig = useRef<THREE.Group>(null);
  const bobPhase = useRef(0);
  const keys = useRef<Record<string, boolean>>({});
  const yaw = useRef(0); // 0 faces -z, into the room (toward the bench)
  const pitch = useRef(-0.03);
  const dragging = useRef(false);
  const last = useRef({ x: 0, y: 0 });
  // Spawn centred near the door (+HZ), looking down the lab at the bench.
  const pos = useRef(new THREE.Vector3(0, 1.55, HZ - 1.7));
  const targetId = useRef<ItemId | null>(null);
  const canPlaceRef = useRef(false);
  const reactReadyRef = useRef(false);
  const phaseRef = useRef(phase);
  const addedRef = useRef(added);
  phaseRef.current = phase;
  addedRef.current = added;
  const fwd = useMemo(() => new THREE.Vector3(), []);
  const toItem = useMemo(() => new THREE.Vector3(), []);
  const navAccum = useRef(0);
  const stepAccum = useRef(0);
  const lastHint = useRef("");

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      const wasDown = keys.current[k]; // edge-detect so held keys don't re-toggle
      keys.current[k] = true;
      if (["arrowup", "arrowdown", "arrowleft", "arrowright"].includes(k)) e.preventDefault();
      if (!wasDown) {
        if (k === "f") onStove();
        if (k === "d") onDrop();
        if (k === "t") onWater();
      }
    };
    const up = (e: KeyboardEvent) => {
      keys.current[e.key.toLowerCase()] = false;
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, [onStove, onDrop, onWater]);

  useEffect(() => {
    const isUI = (t: EventTarget | null) => t instanceof HTMLElement && t.closest("[data-ui]");
    const down = (e: PointerEvent) => {
      if (isUI(e.target)) return;
      dragging.current = true;
      last.current = { x: e.clientX, y: e.clientY };
    };
    const move = (e: PointerEvent) => {
      if (!dragging.current) return;
      const dx = e.clientX - last.current.x;
      const dy = e.clientY - last.current.y;
      last.current = { x: e.clientX, y: e.clientY };
      yaw.current -= dx * 0.004;
      pitch.current = THREE.MathUtils.clamp(pitch.current - dy * 0.004, -1.1, 0.7);
    };
    const up = () => (dragging.current = false);
    // A quick click (no drag) grabs / places / performs the next reaction step.
    const click = (e: MouseEvent) => {
      if (isUI(e.target)) return;
      if (held) {
        if (canPlaceRef.current) onPlace();
      } else if (reactReadyRef.current) {
        onReact();
      } else if (targetId.current) {
        onGrab(targetId.current);
      }
    };
    window.addEventListener("pointerdown", down);
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("click", click);
    return () => {
      window.removeEventListener("pointerdown", down);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("click", click);
    };
  }, [held, onGrab, onPlace, onReact]);

  useFrame((_, dt) => {
    const k = keys.current;
    let mv = 0;
    let turn = 0;
    if (k["arrowup"] || k["w"]) mv += 1;
    if (k["arrowdown"] || k["s"]) mv -= 1;
    if (k["arrowleft"] || k["a"]) turn += 1;
    if (k["arrowright"] || k["d"]) turn -= 1;
    if (turn !== 0) yaw.current += turn * 1.9 * dt;
    if (mv !== 0) {
      const fx = -Math.sin(yaw.current);
      const fz = -Math.cos(yaw.current);
      const sp = 2.4 * mv;
      const nx = THREE.MathUtils.clamp(pos.current.x + fx * sp * dt, MIN_X, MAX_X);
      if (!blocked(nx, pos.current.z)) pos.current.x = nx;
      const nz = THREE.MathUtils.clamp(pos.current.z + fz * sp * dt, MIN_Z, MAX_Z);
      if (!blocked(pos.current.x, nz)) pos.current.z = nz;
    }

    camera.position.copy(pos.current);
    camera.rotation.set(pitch.current, yaw.current, 0, "YXZ");
    if (rig.current) {
      rig.current.position.copy(camera.position);
      rig.current.quaternion.copy(camera.quaternion);
    }

    // Bob + step sounds while walking, for a realistic gait.
    const walking = mv !== 0;
    if (walking) {
      bobPhase.current += dt * 9;
      stepAccum.current += dt;
      if (stepAccum.current > 0.42) {
        stepAccum.current = 0;
        playStep();
      }
    } else {
      stepAccum.current = 0.42; // next step fires immediately when you start
    }

    // Targeting: nearest grabbable item within a small view cone.
    camera.getWorldDirection(fwd);
    let best: ItemId | null = null;
    let bestScore = Infinity;
    if (!held) {
      for (const it of ITEMS) {
        if (collected.has(it.id)) continue;
        toItem.set(it.home[0], it.home[1], it.home[2]).sub(camera.position);
        const dist = toItem.length();
        if (dist > 2.8) continue;
        toItem.normalize();
        const dot = toItem.dot(fwd);
        if (dot < 0.9) continue; // must be roughly centred
        const score = dist * (2 - dot);
        if (score < bestScore) {
          bestScore = score;
          best = it.id;
        }
      }
    }
    // Near-table + facing-it check (shared by placing and reacting).
    const nearTable =
      Math.hypot(pos.current.x, pos.current.z - 0.4) < 2.0 &&
      (toItem.copy(TABLE_CENTER).sub(camera.position).normalize(), toItem.dot(fwd) > 0.5);
    const canPlace = !!held && nearTable;
    const reactReady = !held && phaseRef.current === "react" && addedRef.current < 3 && nearTable;
    if (best !== targetId.current || canPlace !== canPlaceRef.current || reactReady !== reactReadyRef.current) {
      targetId.current = best;
      canPlaceRef.current = canPlace;
      reactReadyRef.current = reactReady;
      onTarget(best, canPlace, reactReady);
    }

    // Navigation coaching (throttled): tell the student where to go / turn.
    navAccum.current += dt;
    if (navAccum.current > 0.2) {
      navAccum.current = 0;
      let hint = "";
      if (held && canPlace) hint = "Click to place it on the table";
      else if (!held && best) hint = "Look at the glowing bottle — click to grab";
      else {
        const t = held ? TABLE_CENTER : (() => {
          const a = ITEMS.find((i) => i.id === activeId);
          return a ? new THREE.Vector3(a.home[0], a.home[1], a.home[2]) : null;
        })();
        if (t) {
          const dx = t.x - pos.current.x;
          const dz = t.z - pos.current.z;
          const dist = Math.hypot(dx, dz);
          const fdot = (dx * fwd.x + dz * fwd.z) / (dist || 1);
          const rdot = (dx * -fwd.z + dz * fwd.x) / (dist || 1);
          if (held && dist < 1.4) hint = "Turn to face the table";
          else if (!held && dist < 1.2) hint = "Turn to face the glowing bottle";
          else if (fdot > 0.75) hint = held ? "Carry it forward" : "Move forward";
          else if (fdot < -0.4) hint = "Turn around";
          else hint = rdot > 0 ? "Turn right" : "Turn left";
        }
      }
      if (hint && hint !== lastHint.current) {
        lastHint.current = hint;
        onNavHint(hint);
      }
    }
  });

  const heldDef = held ? ITEMS.find((i) => i.id === held)! : null;
  const heldScale = heldDef?.kind === "reagent" ? 0.42 : 0.55;
  return (
    <group ref={rig}>
      {heldDef && (
        // Held item floats in front of the camera (label toward the viewer).
        <group position={[0.19, -0.32, -0.52]} rotation={[0.02, 0, 0]} scale={heldScale}>
          <ItemModel def={heldDef} />
        </group>
      )}
    </group>
  );
}

// ---- Root scene ------------------------------------------------------------

export default function PracticalScene({
  collected,
  held,
  stoveOn,
  waterOn,
  targetId,
  activeId,
  phase,
  added,
  heating,
  pouring,
  onTarget,
  onGrab,
  onPlace,
  onDrop,
  onStove,
  onWater,
  onNavHint,
  onReact,
  onHeatDone,
}: {
  collected: Set<ItemId>;
  held: ItemId | null;
  stoveOn: boolean;
  waterOn: boolean;
  targetId: ItemId | null;
  activeId: ItemId | null;
  phase: "gather" | "react" | "heating" | "cooldown" | "form";
  added: number;
  heating: boolean;
  pouring: ItemId | null;
  onTarget: (id: ItemId | null, canPlace: boolean, reactReady: boolean) => void;
  onGrab: (id: ItemId) => void;
  onPlace: () => void;
  onDrop: () => void;
  onStove: () => void;
  onWater: () => void;
  onNavHint: (hint: string) => void;
  onReact: () => void;
  onHeatDone: () => void;
}) {
  return (
    <Canvas
      shadows
      camera={{ position: [0, 1.55, 3.6], fov: 70, near: 0.05 }}
      dpr={[1, 2]}
      gl={{ antialias: true, toneMappingExposure: 1.0 }}
    >
      <color attach="background" args={["#e3e7e4"]} />
      <ambientLight intensity={0.6} />
      <hemisphereLight args={["#ffffff", "#c9ccce", 0.5]} />
      <spotLight position={[0, 4.6, 2.5]} angle={0.9} penumbra={0.9} intensity={1.1} decay={0} castShadow shadow-mapSize={[2048, 2048]} shadow-bias={-0.0004} />
      <pointLight position={[-2.6, 4.5, 0.5]} intensity={0.35} decay={0} />
      <pointLight position={[2.6, 4.5, 0.5]} intensity={0.35} decay={0} />

      <LabRoom chem />
      <ChemLab stoveOn={stoveOn} holding={false} waterOn={waterOn} gapLeftBottomZ={REAGENT_GAP_Z} />

      {/* Required items at their home spots (until collected/held). During the
          reaction the plain flask is swapped for the animated ReactionFlask. */}
      {ITEMS.map((it) => {
        if (held === it.id) return null;
        if (it.id === "flask" && phase !== "gather") return null;
        if (pouring === it.id) return null; // rendered separately, tilted
        const onTable = collected.has(it.id);
        const p = onTable ? TABLE_SLOTS[it.id] : it.home;
        const rot: [number, number, number] =
          !onTable && it.kind === "reagent" ? [0, Math.PI / 2, 0] : [0, 0, 0];
        // Highlight: the next item to gather, OR the next reagent to pour.
        const reactActive = phase === "react" && !pouring && it.id === REAGENT_ORDER[added];
        return (
          <group key={it.id} position={p} rotation={rot}>
            {((!onTable && it.id === activeId) || reactActive) && <BlinkHighlight targeted={targetId === it.id} />}
            <ItemModel def={it} />
          </group>
        );
      })}

      {/* Reagent currently being poured into the flask */}
      {pouring && <PouringReagent def={ITEMS.find((i) => i.id === pouring)!} />}

      {/* Reaction flask — on the table during react; on the burner while heating/after */}
      {phase !== "gather" && (
        <group position={phase === "react" ? TABLE_SLOTS.flask : [STOVE.x, STOVE.y + 0.47, STOVE.z]}>
          <ReactionFlask
            added={added}
            heating={heating}
            reactionDone={phase === "cooldown" || phase === "form"}
            onHeatDone={onHeatDone}
          />
        </group>
      )}

      <Player
        collected={collected}
        held={held}
        activeId={activeId}
        phase={phase}
        added={added}
        onTarget={onTarget}
        onGrab={onGrab}
        onPlace={onPlace}
        onDrop={onDrop}
        onStove={onStove}
        onWater={onWater}
        onNavHint={onNavHint}
        onReact={onReact}
      />
    </Canvas>
  );
}
