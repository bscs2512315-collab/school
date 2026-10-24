"use client";

import { useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import { LabRoom } from "../_scene/LabRoom";
import { AirConditioner } from "../walk/ChemLab";
import { Meter3D, LabWire, PowerSupply3D, ResistanceBox3D, PlugKey3D } from "../_practical/physics/meter3d";
import { ApparatusTourTag } from "../_practical/ApparatusTourTag";

const BENCH_Y = 1.08;
const BENCH_Z = 0.14;

const SUPPLY_POS: [number, number, number] = [-0.52, BENCH_Y, BENCH_Z];
const RBOX_POS: [number, number, number] = [-0.18, BENCH_Y, BENCH_Z];
const GALVO_POS: [number, number, number] = [0.22, BENCH_Y, BENCH_Z];
const SHUNT_POS: [number, number, number] = [0.55, BENCH_Y, BENCH_Z];
const KEY_POS: [number, number, number] = [-0.42, BENCH_Y, BENCH_Z + 0.25];
export type GalvoFocus = "source_pos" | "source_neg" | "series_input" | "series_output" | "galvo_pos" | "galvo_neg" | "key_right" | "key_left" | "shunt_input" | "shunt_output";
const TARGETS: Record<GalvoFocus, { at: [number, number, number]; label: string; color: string }> = {
  source_pos: { at: [SUPPLY_POS[0] + 0.03, BENCH_Y + 0.035, BENCH_Z + 0.112], label: "Source + · red", color: "#dc2626" },
  source_neg: { at: [SUPPLY_POS[0] + 0.075, BENCH_Y + 0.035, BENCH_Z + 0.112], label: "Source − · black", color: "#0f172a" },
  series_input: { at: [RBOX_POS[0] - 0.13, BENCH_Y + 0.115, BENCH_Z + 0.06], label: "R input", color: "#dc2626" },
  series_output: { at: [RBOX_POS[0] + 0.13, BENCH_Y + 0.115, BENCH_Z + 0.06], label: "R output", color: "#dc2626" },
  galvo_pos: { at: [GALVO_POS[0] - 0.055, BENCH_Y + 0.03, BENCH_Z + 0.079], label: "Galvanometer +", color: "#dc2626" },
  galvo_neg: { at: [GALVO_POS[0] + 0.055, BENCH_Y + 0.03, BENCH_Z + 0.079], label: "Galvanometer −", color: "#0f172a" },
  key_right: { at: [KEY_POS[0] + 0.036, BENCH_Y + 0.06, KEY_POS[2] + 0.012], label: "Key · right", color: "#0f172a" },
  key_left: { at: [KEY_POS[0] - 0.036, BENCH_Y + 0.06, KEY_POS[2] + 0.012], label: "Key · left", color: "#0f172a" },
  shunt_input: { at: [SHUNT_POS[0] - 0.08, BENCH_Y + 0.105, BENCH_Z + 0.04], label: "Shunt S · input", color: "#2563eb" },
  shunt_output: { at: [SHUNT_POS[0] + 0.08, BENCH_Y + 0.105, BENCH_Z + 0.04], label: "Shunt S · output", color: "#2563eb" },
};

export const GALVO_TOUR_FOCUS: { target: [number, number, number]; label: [number, number, number]; name: string }[] = [
  { target: [SUPPLY_POS[0], BENCH_Y + 0.12, BENCH_Z], label: [SUPPLY_POS[0], BENCH_Y + 0.38, BENCH_Z], name: "Regulated DC cell source (2.0 V)" },
  { target: [RBOX_POS[0], BENCH_Y + 0.1, BENCH_Z], label: [RBOX_POS[0], BENCH_Y + 0.36, BENCH_Z], name: "High resistance box (series R)" },
  { target: [GALVO_POS[0], BENCH_Y + 0.12, BENCH_Z], label: [GALVO_POS[0], BENCH_Y + 0.38, BENCH_Z], name: "Center-zero moving coil galvanometer (G)" },
  { target: [SHUNT_POS[0], BENCH_Y + 0.08, BENCH_Z], label: [SHUNT_POS[0], BENCH_Y + 0.34, BENCH_Z], name: "Low-resistance shunt box (S)" },
];
export const GALVO_TOUR_ITEMS = GALVO_TOUR_FOCUS.map((t) => t.name);

function CameraRig({ zoom, intro, introIdx, focus }: { zoom: boolean; intro?: boolean; introIdx?: number; focus: GalvoFocus | null }) {
  const { camera, size } = useThree();
  const look = useRef(new THREE.Vector3(0, BENCH_Y + 0.2, BENCH_Z));
  const tmp = useMemo(() => new THREE.Vector3(), []);
  const tgt = useMemo(() => new THREE.Vector3(), []);
  useFrame((_, delta) => {
    if (intro && introIdx && introIdx > 0) {
      const focus = GALVO_TOUR_FOCUS[Math.min(introIdx - 1, GALVO_TOUR_FOCUS.length - 1)];
      tgt.set(...focus.target);
      tmp.set(focus.target[0] + 0.08, focus.target[1] + 0.22, focus.target[2] + (size.width < 800 ? 0.95 : 0.82));
    } else if (focus) {
      const target = TARGETS[focus].at;
      const centerX = focus.startsWith("source") ? SUPPLY_POS[0] : focus.startsWith("series") ? RBOX_POS[0] : focus.startsWith("galvo") ? GALVO_POS[0] : focus.startsWith("shunt") ? SHUNT_POS[0] : KEY_POS[0];
      tgt.set(centerX, target[1] + 0.015, target[2]);
      tmp.set(centerX + 0.025, target[1] + (focus.startsWith("series") || focus.startsWith("shunt") || focus.startsWith("key") ? 0.3 : 0.16), target[2] + (size.width < 550 ? 0.55 : 0.4));
    } else if (zoom) {
      tmp.set(GALVO_POS[0] + 0.02, BENCH_Y + 0.28, GALVO_POS[2] + 0.5);
      tgt.set(GALVO_POS[0], BENCH_Y + 0.15, GALVO_POS[2]);
    } else {
      tmp.set(0.05, BENCH_Y + 0.65, 1.65);
      tgt.set(0.05, BENCH_Y + 0.18, BENCH_Z);
    }
    const follow = 1 - Math.exp(-6 * delta);
    camera.position.lerp(tmp, follow);
    look.current.lerp(tgt, follow);
    camera.lookAt(look.current);
  });
  return null;
}

export default function GalvanometerScene({
  deflectionDivs,
  shuntOn,
  connectionCount,
  shuntConnection,
  keyClosed,
  focus,
  seriesResistance,
  shuntResistance,
  zoom,
  intro = false,
  introIdx = 0,
}: {
  deflectionDivs: number;
  shuntOn: boolean;
  connectionCount: number;
  shuntConnection: number;
  keyClosed: boolean;
  focus: GalvoFocus | null;
  seriesResistance: number;
  shuntResistance: number;
  zoom: boolean;
  intro?: boolean;
  introIdx?: number;
}) {
  return (
    <Canvas shadows camera={{ position: [0.05, BENCH_Y + 0.65, 1.65], fov: 46 }} dpr={[1, 2]}>
      <ambientLight intensity={0.7} />
      <directionalLight
        position={[3, 6, 4]}
        intensity={1.15}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0002}
      />
      <directionalLight position={[-3, 3, -2]} intensity={0.35} />
      <LabRoom walkLabNoticeBoard />
      <AirConditioner />

      {/* Realistic Physics Lab Instruments */}
      <PowerSupply3D pos={SUPPLY_POS} voltage={2.0} on={true} />
      <ResistanceBox3D pos={RBOX_POS} seriesOn={connectionCount > 0} rValue={seriesResistance} />
      <Meter3D label="G" value={deflectionDivs} max={30} pos={GALVO_POS} isGalvo casingColor="#b8bfbe" bezelColor="#7d898b" />
      <ResistanceBox3D pos={SHUNT_POS} seriesOn={shuntOn} rValue={shuntResistance} isShunt={true} />
      <PlugKey3D pos={KEY_POS} closed={keyClosed} />

      {/* Red Wire: Supply (+) -> High R-Box Left */}
      {connectionCount >= 1 && <LabWire
        points={[
          [SUPPLY_POS[0] + 0.03, BENCH_Y + 0.035, SUPPLY_POS[2] + 0.112],
          [SUPPLY_POS[0] + 0.12, BENCH_Y + 0.015, SUPPLY_POS[2] + 0.06],
          [RBOX_POS[0] - 0.18, BENCH_Y + 0.015, RBOX_POS[2] + 0.05],
          [RBOX_POS[0] - 0.13, BENCH_Y + 0.115, RBOX_POS[2] + 0.06],
        ]}
        color="#dc2626"
        terminalEnds={["front", "top"]}
      />}

      {/* Red Wire: High R-Box Right -> Galvanometer (+) Red Terminal */}
      {connectionCount >= 2 && <LabWire
        points={[
          [RBOX_POS[0] + 0.13, BENCH_Y + 0.115, RBOX_POS[2] + 0.06],
          [RBOX_POS[0] + 0.22, BENCH_Y + 0.015, RBOX_POS[2] + 0.05],
          [GALVO_POS[0] - 0.12, BENCH_Y + 0.015, GALVO_POS[2] + 0.04],
          [GALVO_POS[0] - 0.055, BENCH_Y + 0.03, GALVO_POS[2] + 0.079],
        ]}
        color="#dc2626"
        terminalEnds={["top", "front"]}
      />}

      {/* Black Wire: Galvanometer (-) Black Terminal -> Supply (-) Black Terminal */}
      {connectionCount >= 3 && <LabWire
        points={[
          [GALVO_POS[0] + 0.055, BENCH_Y + 0.03, GALVO_POS[2] + 0.079],
          [GALVO_POS[0] + 0.08, BENCH_Y + 0.02, GALVO_POS[2] + 0.25],
          [KEY_POS[0] + 0.10, BENCH_Y + 0.018, KEY_POS[2] + 0.09],
          [KEY_POS[0] + 0.06, BENCH_Y + 0.062, KEY_POS[2] + 0.07],
          [KEY_POS[0] + 0.036, BENCH_Y + 0.06, KEY_POS[2] + 0.012],
        ]}
        color="#0f172a"
        terminalEnds={["front", "top"]}
      />}
      {connectionCount >= 4 && <LabWire points={[
        [KEY_POS[0] - 0.036, BENCH_Y + 0.06, KEY_POS[2] + 0.012],
        [KEY_POS[0] - 0.06, BENCH_Y + 0.062, KEY_POS[2] + 0.07],
        [SUPPLY_POS[0] + 0.09, BENCH_Y + 0.017, KEY_POS[2] + 0.09],
        [SUPPLY_POS[0] + 0.075, BENCH_Y + 0.035, SUPPLY_POS[2] + 0.112],
      ]} color="#0f172a" terminalEnds={["top", "front"]} />}

      {/* Shunt Circuit Blue Wires (Parallel across Galvanometer terminals) */}
      {shuntConnection > 0 && (
        <>
          <LabWire
            points={[
              [GALVO_POS[0] - 0.055, BENCH_Y + 0.03, GALVO_POS[2] + 0.079],
              [(GALVO_POS[0] + SHUNT_POS[0]) / 2 - 0.04, BENCH_Y + 0.02, BENCH_Z + 0.12],
              [SHUNT_POS[0] - 0.08, BENCH_Y + 0.105, SHUNT_POS[2] + 0.04],
            ]}
            color="#2563eb"
            terminalEnds={["front", "top"]}
          />
          {shuntConnection > 1 && <LabWire
            points={[
              [SHUNT_POS[0] + 0.08, BENCH_Y + 0.105, SHUNT_POS[2] + 0.04],
              [(GALVO_POS[0] + SHUNT_POS[0]) / 2 + 0.04, BENCH_Y + 0.02, BENCH_Z + 0.12],
              [GALVO_POS[0] + 0.055, BENCH_Y + 0.03, GALVO_POS[2] + 0.079],
            ]}
            color="#2563eb"
            terminalEnds={["top", "front"]}
          />}
        </>
      )}

      {!intro && focus && <group position={TARGETS[focus].at}><mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.008, 0]}><torusGeometry args={[0.023, 0.003, 8, 32]} /><meshBasicMaterial color={TARGETS[focus].color} depthTest={false} /></mesh><Html position={[0, 0.08, 0]} center distanceFactor={0.7} style={{ pointerEvents: "none" }}><div style={{ whiteSpace: "nowrap", border: `1px solid ${TARGETS[focus].color}`, borderRadius: 7, background: "white", padding: "4px 7px", color: TARGETS[focus].color, fontSize: 11, fontWeight: 800 }}>{TARGETS[focus].label}</div></Html></group>}

      {intro && introIdx > 0 && (
        <ApparatusTourTag
          at={GALVO_TOUR_FOCUS[Math.min(introIdx - 1, GALVO_TOUR_FOCUS.length - 1)].label}
          name={GALVO_TOUR_FOCUS[Math.min(introIdx - 1, GALVO_TOUR_FOCUS.length - 1)].name}
          number={introIdx}
        />
      )}
      <CameraRig zoom={zoom} intro={intro} introIdx={introIdx} focus={intro ? null : focus} />
    </Canvas>
  );
}
