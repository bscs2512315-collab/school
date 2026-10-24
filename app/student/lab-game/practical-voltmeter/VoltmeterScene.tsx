"use client";

import { useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import { LabRoom } from "../_scene/LabRoom";
import { AirConditioner } from "../walk/ChemLab";
import { Meter3D, LabWire, PowerSupply3D, ResistanceBox3D, PlugKey3D } from "../_practical/physics/meter3d";
import { ApparatusTourTag } from "../_practical/ApparatusTourTag";

const BENCH_Y = 1.08;
const BENCH_Z = 0.14;

const SUPPLY_POS: [number, number, number] = [-0.48, BENCH_Y, BENCH_Z];
const RBOX_POS: [number, number, number] = [0.0, BENCH_Y, BENCH_Z];
const VMETER_POS: [number, number, number] = [0.48, BENCH_Y, BENCH_Z];
const KEY_POS: [number, number, number] = [-0.18, BENCH_Y, BENCH_Z + 0.16];
type ConnectionFocus = "source_pos" | "meter_pos" | "meter_neg" | "key_right" | "key_left" | "source_neg" | "resistor_input" | "resistor_output";
const CONNECTION_TARGETS: Record<ConnectionFocus, { at: [number, number, number]; label: string; color: string }> = {
  source_pos: { at: [SUPPLY_POS[0] + 0.03, BENCH_Y + 0.035, SUPPLY_POS[2] + 0.112], label: "Supply + · red", color: "#dc2626" },
  source_neg: { at: [SUPPLY_POS[0] + 0.075, BENCH_Y + 0.035, SUPPLY_POS[2] + 0.112], label: "Supply − · black", color: "#0f172a" },
  meter_pos: { at: [VMETER_POS[0] - 0.072, BENCH_Y + 0.044, VMETER_POS[2] + 0.094], label: "Voltmeter + · red", color: "#dc2626" },
  meter_neg: { at: [VMETER_POS[0] + 0.072, BENCH_Y + 0.044, VMETER_POS[2] + 0.094], label: "Voltmeter − · black", color: "#0f172a" },
  key_right: { at: [KEY_POS[0] + 0.036, BENCH_Y + 0.06, KEY_POS[2] + 0.012], label: "Key · right post", color: "#0f172a" },
  key_left: { at: [KEY_POS[0] - 0.036, BENCH_Y + 0.06, KEY_POS[2] + 0.012], label: "Key · left post", color: "#0f172a" },
  resistor_input: { at: [RBOX_POS[0] - 0.13, BENCH_Y + 0.115, RBOX_POS[2] + 0.06], label: "Resistance box · input", color: "#dc2626" },
  resistor_output: { at: [RBOX_POS[0] + 0.13, BENCH_Y + 0.115, RBOX_POS[2] + 0.06], label: "Resistance box · output", color: "#dc2626" },
};

export const VOLTMETER_TOUR_FOCUS: { target: [number, number, number]; label: [number, number, number]; name: string }[] = [
  { target: [SUPPLY_POS[0], BENCH_Y + 0.12, BENCH_Z], label: [SUPPLY_POS[0], BENCH_Y + 0.38, BENCH_Z], name: "Regulated DC power source (3.0 V)" },
  { target: [RBOX_POS[0], BENCH_Y + 0.1, BENCH_Z], label: [RBOX_POS[0], BENCH_Y + 0.36, BENCH_Z], name: "Precision resistance box (known R)" },
  { target: [VMETER_POS[0], BENCH_Y + 0.12, BENCH_Z], label: [VMETER_POS[0], BENCH_Y + 0.38, BENCH_Z], name: "Moving-coil DC voltmeter (0–3 V)" },
  { target: [KEY_POS[0], BENCH_Y + 0.05, KEY_POS[2]], label: [KEY_POS[0], BENCH_Y + 0.28, KEY_POS[2]], name: "One-way key switch" },
];
export const VOLTMETER_TOUR_ITEMS = VOLTMETER_TOUR_FOCUS.map((t) => t.name);

function CameraRig({ zoom, intro, introIdx, connectionFocus }: { zoom: boolean; intro?: boolean; introIdx?: number; connectionFocus: ConnectionFocus | null }) {
  const { camera, size } = useThree();
  const look = useRef(new THREE.Vector3(0, BENCH_Y + 0.2, BENCH_Z));
  const tmp = useMemo(() => new THREE.Vector3(), []);
  const tgt = useMemo(() => new THREE.Vector3(), []);
  useEffect(() => {
    if (!(camera instanceof THREE.PerspectiveCamera)) return;
    camera.fov = size.width < 550 ? 70 : size.width < 800 ? 55 : 46;
    camera.updateProjectionMatrix();
  }, [camera, size.width]);
  useFrame((_, delta) => {
    if (intro && introIdx && introIdx > 0) {
      const focus = VOLTMETER_TOUR_FOCUS[Math.min(introIdx - 1, VOLTMETER_TOUR_FOCUS.length - 1)];
      tgt.set(...focus.target);
      const resistanceTour = introIdx === 2;
      tmp.set(
        focus.target[0] + (resistanceTour ? 0.025 : 0.08),
        focus.target[1] + (resistanceTour ? (size.width < 550 ? 0.42 : 0.33) : 0.22),
        focus.target[2] + (resistanceTour ? (size.width < 550 ? 1.0 : 0.47) : size.width < 550 ? 1.5 : size.width < 800 ? 0.95 : 0.82),
      );
    } else if (connectionFocus) {
      const focus = CONNECTION_TARGETS[connectionFocus].at;
      const topView = connectionFocus.startsWith("resistor") || connectionFocus.startsWith("key");
      const centerX = connectionFocus.startsWith("source") ? SUPPLY_POS[0] : connectionFocus.startsWith("meter") ? VMETER_POS[0] : connectionFocus.startsWith("key") ? KEY_POS[0] : RBOX_POS[0];
      tgt.set(centerX, focus[1] + (topView ? 0.015 : 0.025), focus[2]);
      tmp.set(centerX + 0.025, focus[1] + (topView ? (size.width < 550 ? 0.27 : 0.31) : 0.15), focus[2] + (size.width < 550 ? (topView ? 0.46 : 0.42) : topView ? 0.37 : 0.32));
    } else if (zoom) {
      tmp.set(VMETER_POS[0] + 0.04, BENCH_Y + 0.32, VMETER_POS[2] + (size.width < 550 ? 1.7 : 0.52));
      tgt.set(VMETER_POS[0], BENCH_Y + 0.18, VMETER_POS[2]);
    } else {
      tmp.set(0.0, BENCH_Y + (size.width < 550 ? 0.45 : 0.65), size.width < 550 ? 2.85 : size.width < 800 ? 2.1 : 1.65);
      tgt.set(0.0, BENCH_Y + (size.width < 550 ? 0.04 : 0.18), BENCH_Z);
    }
    const follow = 1 - Math.exp(-6 * delta);
    camera.position.lerp(tmp, follow);
    look.current.lerp(tgt, follow);
    camera.lookAt(look.current);
  });
  return null;
}

export default function VoltmeterScene({
  voltage,
  seriesOn,
  seriesConnection,
  rValue,
  connectionCount,
  keyClosed,
  connectionFocus,
  zoom,
  intro = false,
  introIdx = 0,
}: {
  voltage: number;
  seriesOn: boolean;
  seriesConnection: number;
  rValue: number;
  connectionCount: number;
  keyClosed: boolean;
  connectionFocus: ConnectionFocus | null;
  zoom: boolean;
  intro?: boolean;
  introIdx?: number;
}) {
  return (
    <Canvas shadows camera={{ position: [0.0, BENCH_Y + 0.65, 1.65], fov: 46 }} dpr={[1, 2]}>
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
      <PowerSupply3D pos={SUPPLY_POS} voltage={3.0} on={true} />
      <ResistanceBox3D pos={RBOX_POS} seriesOn={seriesOn} rValue={rValue} />
      <group position={VMETER_POS} scale={[1.3, 1.3, 1.2]}><Meter3D label="V" value={voltage} max={3} pos={[0, 0, 0]} casingColor="#b8bfbe" bezelColor="#7d898b" /></group>
      <PlugKey3D pos={KEY_POS} closed={keyClosed} />

      {/* Realistic Flexible Silicone Wires with Catenary Drape & Brass Terminals */}
      {/* Red Wire: Supply (+) Red Terminal -> R-Box Left (or Voltmeter + when direct) */}
      {connectionCount >= 1 && <LabWire
        points={
          seriesOn
            ? [
                [SUPPLY_POS[0] + 0.03, BENCH_Y + 0.035, SUPPLY_POS[2] + 0.112],
                [SUPPLY_POS[0] + 0.03, BENCH_Y + 0.035, SUPPLY_POS[2] + 0.145],
                [SUPPLY_POS[0] + 0.06, BENCH_Y + 0.023, BENCH_Z + 0.27],
                [RBOX_POS[0] - 0.2, BENCH_Y + 0.014, BENCH_Z + 0.29],
                [RBOX_POS[0] - 0.13, BENCH_Y + 0.15, RBOX_POS[2] + 0.065],
                [RBOX_POS[0] - 0.13, BENCH_Y + 0.115, RBOX_POS[2] + 0.06],
              ]
            : [
                [SUPPLY_POS[0] + 0.03, BENCH_Y + 0.035, SUPPLY_POS[2] + 0.112],
                [SUPPLY_POS[0] + 0.03, BENCH_Y + 0.035, SUPPLY_POS[2] + 0.145],
                [SUPPLY_POS[0] + 0.08, BENCH_Y + 0.022, BENCH_Z + 0.27],
                [0.0, BENCH_Y + 0.013, BENCH_Z + 0.36],
                [VMETER_POS[0] - 0.14, BENCH_Y + 0.022, BENCH_Z + 0.3],
                [VMETER_POS[0] - 0.072, BENCH_Y + 0.044, VMETER_POS[2] + 0.13],
                [VMETER_POS[0] - 0.072, BENCH_Y + 0.044, VMETER_POS[2] + 0.094],
              ]
        }
        color="#dc2626"
        terminalEnds={seriesOn ? ["front", "top"] : ["front", "front"]}
      />}

      {/* Red Wire: R-Box Right -> Voltmeter (+) Red Terminal */}
      {seriesConnection >= 2 && connectionCount >= 1 && (
        <LabWire
          points={[
            [RBOX_POS[0] + 0.13, BENCH_Y + 0.115, RBOX_POS[2] + 0.06],
            [RBOX_POS[0] + 0.13, BENCH_Y + 0.15, RBOX_POS[2] + 0.065],
            [RBOX_POS[0] + 0.2, BENCH_Y + 0.019, BENCH_Z + 0.28],
            [VMETER_POS[0] - 0.13, BENCH_Y + 0.017, BENCH_Z + 0.31],
            [VMETER_POS[0] - 0.072, BENCH_Y + 0.044, VMETER_POS[2] + 0.13],
            [VMETER_POS[0] - 0.072, BENCH_Y + 0.044, VMETER_POS[2] + 0.094],
          ]}
          color="#dc2626"
          terminalEnds={["top", "front"]}
        />
      )}

      {/* Black Wire: Voltmeter (-) Black Terminal -> Key Right Terminal */}
      {connectionCount >= 2 && <LabWire
        points={[
          [VMETER_POS[0] + 0.072, BENCH_Y + 0.044, VMETER_POS[2] + 0.094],
          [VMETER_POS[0] + 0.072, BENCH_Y + 0.044, VMETER_POS[2] + 0.13],
          [VMETER_POS[0] + 0.1, BENCH_Y + 0.021, BENCH_Z + 0.33],
          [0.08, BENCH_Y + 0.014, BENCH_Z + 0.39],
          [KEY_POS[0] + 0.06, BENCH_Y + 0.062, KEY_POS[2] + 0.07],
          [KEY_POS[0] + 0.036, BENCH_Y + 0.06, KEY_POS[2] + 0.012],
        ]}
        color="#0f172a"
        terminalEnds={["front", "top"]}
      />}

      {/* Black Wire: Key Left Terminal -> Supply (-) Black Terminal */}
      {connectionCount >= 3 && <LabWire
        points={[
          [KEY_POS[0] - 0.036, BENCH_Y + 0.06, KEY_POS[2] + 0.012],
          [KEY_POS[0] - 0.06, BENCH_Y + 0.062, KEY_POS[2] + 0.07],
          [KEY_POS[0] - 0.11, BENCH_Y + 0.016, BENCH_Z + 0.35],
          [SUPPLY_POS[0] + 0.13, BENCH_Y + 0.018, BENCH_Z + 0.33],
          [SUPPLY_POS[0] + 0.075, BENCH_Y + 0.035, SUPPLY_POS[2] + 0.145],
          [SUPPLY_POS[0] + 0.075, BENCH_Y + 0.035, SUPPLY_POS[2] + 0.112],
        ]}
        color="#0f172a"
        terminalEnds={["top", "front"]}
      />}

      {!intro && connectionFocus && (() => {
        const focus = CONNECTION_TARGETS[connectionFocus];
        return <group position={focus.at}>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.009, 0]}><torusGeometry args={[0.024, 0.003, 8, 40]} /><meshBasicMaterial color={focus.color} depthTest={false} /></mesh>
          <Html position={[0, 0.085, 0]} center distanceFactor={0.7} occlude={false} style={{ pointerEvents: "none" }}>
            <div style={{ whiteSpace: "nowrap", border: `1px solid ${focus.color}`, borderRadius: 7, background: "rgba(255,255,255,.96)", boxShadow: "0 3px 12px #0005", color: focus.color, padding: "4px 7px", fontSize: 11, fontWeight: 800 }}>{focus.label}</div>
          </Html>
        </group>;
      })()}

      {intro && introIdx > 0 && (
        <ApparatusTourTag
          at={VOLTMETER_TOUR_FOCUS[Math.min(introIdx - 1, VOLTMETER_TOUR_FOCUS.length - 1)].label}
          name={VOLTMETER_TOUR_FOCUS[Math.min(introIdx - 1, VOLTMETER_TOUR_FOCUS.length - 1)].name}
          number={introIdx}
        />
      )}
      <CameraRig zoom={zoom} intro={intro} introIdx={introIdx} connectionFocus={intro ? null : connectionFocus} />
    </Canvas>
  );
}
