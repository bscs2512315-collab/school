"use client";

import { useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { LabRoom } from "../_scene/LabRoom";
import { AirConditioner } from "../walk/ChemLab";
import { Meter3D, LabWire, PowerSupply3D } from "../_practical/physics/meter3d";
import { ApparatusTourTag } from "../_practical/ApparatusTourTag";

const BENCH_Y = 1.08;
const BENCH_Z = 0.14;

const SUPPLY_POS: [number, number, number] = [-0.55, BENCH_Y, BENCH_Z];
const RHEO_POS: [number, number, number] = [-0.18, BENCH_Y, BENCH_Z];
const LAMP_POS: [number, number, number] = [0.18, BENCH_Y, BENCH_Z];
const VMETER_POS: [number, number, number] = [0.55, BENCH_Y, BENCH_Z];
const AMETER_POS: [number, number, number] = [-0.18, BENCH_Y, BENCH_Z + 0.16];

export const IV_TOUR_FOCUS: { target: [number, number, number]; label: [number, number, number]; name: string }[] = [
  { target: [SUPPLY_POS[0], BENCH_Y + 0.12, BENCH_Z], label: [SUPPLY_POS[0], BENCH_Y + 0.38, BENCH_Z], name: "Regulated DC power supply" },
  { target: [RHEO_POS[0], BENCH_Y + 0.1, BENCH_Z], label: [RHEO_POS[0], BENCH_Y + 0.36, BENCH_Z], name: "Heavy wirewound sliding rheostat" },
  { target: [LAMP_POS[0], BENCH_Y + 0.14, BENCH_Z], label: [LAMP_POS[0], BENCH_Y + 0.42, BENCH_Z], name: "Tungsten filament laboratory bulb" },
  { target: [VMETER_POS[0], BENCH_Y + 0.12, BENCH_Z], label: [VMETER_POS[0], BENCH_Y + 0.38, BENCH_Z], name: "Moving-coil DC voltmeter (0–8 V)" },
  { target: [AMETER_POS[0], BENCH_Y + 0.08, AMETER_POS[2]], label: [AMETER_POS[0], BENCH_Y + 0.32, AMETER_POS[2]], name: "Moving-coil DC ammeter (0–1 A)" },
];
export const IV_TOUR_ITEMS = IV_TOUR_FOCUS.map((t) => t.name);

/**
 * Realistic Heavy Wirewound Laboratory Sliding Rheostat.
 * Cast-iron end frames, insulated ceramic tube wound with resistance wire turns,
 * hexagonal chrome guide rod, slider carriage with brass contact, and 3 knurled binding posts.
 */
function Rheostat3D({ sliderFraction }: { sliderFraction: number }) {
  const sliderX = (sliderFraction - 0.5) * 0.18;

  return (
    <group position={RHEO_POS}>
      {/* 1. Cast-Iron Heavy End Brackets */}
      {[-0.12, 0.12].map((x, i) => (
        <group key={i} position={[x, 0.045, 0]}>
          <mesh castShadow receiveShadow>
            <boxGeometry args={[0.024, 0.09, 0.075]} />
            <meshStandardMaterial color="#687174" roughness={0.52} metalness={0.52} />
          </mesh>
          {/* Base mounting feet */}
          <mesh position={[0, -0.042, 0]}>
            <boxGeometry args={[0.03, 0.008, 0.09]} />
            <meshStandardMaterial color="#444d50" roughness={0.62} metalness={0.24} />
          </mesh>
          {/* Bottom terminal post on each end bracket */}
          <group position={[0, -0.015, 0.04]} rotation={[Math.PI / 2, 0, 0]}>
            <mesh castShadow>
              <cylinderGeometry args={[0.005, 0.005, 0.016, 14]} />
              <meshStandardMaterial color="#ca8a04" metalness={0.9} roughness={0.2} />
            </mesh>
            <mesh position={[0, 0.008, 0]} castShadow>
              <cylinderGeometry args={[0.008, 0.008, 0.008, 16]} />
              <meshStandardMaterial color="#eab308" metalness={0.9} roughness={0.25} />
            </mesh>
          </group>
        </group>
      ))}

      {/* 2. Ceramic Tube with Fine Resistance Wire Coil Turns */}
      <mesh position={[0, 0.045, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.025, 0.025, 0.22, 32]} />
        <meshStandardMaterial color="#78350f" roughness={0.75} metalness={0.2} />
      </mesh>
      {/* Resistance wire coil texture highlights */}
      {Array.from({ length: 18 }).map((_, i) => (
        <mesh key={i} position={[-0.095 + i * 0.011, 0.045, 0]} rotation={[0, 0, Math.PI / 2]}>
          <torusGeometry args={[0.0253, 0.001, 8, 24]} />
          <meshStandardMaterial color="#b45309" metalness={0.85} roughness={0.3} />
        </mesh>
      ))}

      {/* 3. Hexagonal Chrome-Plated Slider Guide Rod */}
      <mesh position={[0, 0.082, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.0055, 0.0055, 0.24, 6]} />
        <meshStandardMaterial color="#e2e8f0" metalness={0.95} roughness={0.15} />
      </mesh>

      {/* Top Guide Bar Terminal Post on right end */}
      <group position={[0.12, 0.082, 0.025]} rotation={[Math.PI / 2, 0, 0]}>
        <mesh castShadow>
          <cylinderGeometry args={[0.005, 0.005, 0.016, 14]} />
          <meshStandardMaterial color="#ca8a04" metalness={0.9} roughness={0.2} />
        </mesh>
        <mesh position={[0, 0.008, 0]} castShadow>
          <cylinderGeometry args={[0.008, 0.008, 0.008, 16]} />
          <meshStandardMaterial color="#eab308" metalness={0.9} roughness={0.25} />
        </mesh>
      </group>

      {/* 4. Sliding Carriage Contact with Knurled Bakelite Knob & Brass Leaf */}
      <group position={[sliderX, 0.082, 0]}>
        {/* Brass Slider Collar */}
        <mesh castShadow>
          <boxGeometry args={[0.028, 0.034, 0.038]} />
          <meshStandardMaterial color="#ca8a04" metalness={0.9} roughness={0.2} />
        </mesh>
        {/* Fluted Bakelite Knob on Top */}
        <mesh position={[0, 0.025, 0]} castShadow>
          <cylinderGeometry args={[0.011, 0.01, 0.024, 20]} />
          <meshStandardMaterial color="#09090b" roughness={0.5} />
        </mesh>
        {/* Spring-loaded brass contact leaf rubbing on the coil */}
        <mesh position={[0, -0.022, 0]} castShadow>
          <boxGeometry args={[0.016, 0.018, 0.02]} />
          <meshStandardMaterial color="#eab308" metalness={0.95} roughness={0.2} />
        </mesh>
      </group>
    </group>
  );
}

/**
 * High-detail Incandescent Laboratory Tungsten Filament Bulb.
 */
function LampBulb3D({ voltage, maxVoltage = 8 }: { voltage: number; maxVoltage?: number }) {
  const norm = Math.min(1, Math.max(0, voltage / maxVoltage));

  // Dynamic vibrant yellow filament emission and illumination
  const glow = useMemo(() => {
    if (norm <= 0.01) {
      return {
        filamentColor: "#475569",
        emissiveColor: "#000000",
        emissiveIntensity: 0,
        lightIntensity: 0,
        lightColor: "#facc15",
        glassTint: "#ffffff",
        innerGlowColor: "#facc15",
      };
    }
    return {
      filamentColor: norm > 0.6 ? "#fffbeb" : "#fde047",
      emissiveColor: "#facc15",
      emissiveIntensity: 3.0 + norm * 8.0,
      lightIntensity: 1.0 + norm * 4.5,
      lightColor: "#facc15",
      glassTint: "#fef9c3",
      innerGlowColor: "#f59e0b",
      glowScale: 0.014 + norm * 0.018,
      glowOpacity: 0.25 + norm * 0.55,
    };
  }, [norm]);

  // Teardrop glass bulb envelope geometry using a smooth lathe curve
  const bulbEnvelopeGeo = useMemo(() => {
    const points: THREE.Vector2[] = [
      new THREE.Vector2(0.026, 0.052), // base neck
      new THREE.Vector2(0.027, 0.062),
      new THREE.Vector2(0.032, 0.076), // flare starts
      new THREE.Vector2(0.045, 0.096),
      new THREE.Vector2(0.058, 0.120), // equator
      new THREE.Vector2(0.062, 0.138),
      new THREE.Vector2(0.059, 0.158),
      new THREE.Vector2(0.048, 0.178), // upper dome
      new THREE.Vector2(0.030, 0.192),
      new THREE.Vector2(0.000, 0.198), // apex tip
    ];
    return new THREE.LatheGeometry(points, 36);
  }, []);

  // Coiled arched tungsten filament geometry
  const filamentGeo = useMemo(() => {
    const pts = [
      new THREE.Vector3(-0.015, 0.118, 0),
      new THREE.Vector3(-0.013, 0.136, 0.003),
      new THREE.Vector3(-0.006, 0.148, 0.001),
      new THREE.Vector3(0.0, 0.143, -0.002),
      new THREE.Vector3(0.006, 0.148, 0.001),
      new THREE.Vector3(0.013, 0.136, 0.003),
      new THREE.Vector3(0.015, 0.118, 0),
    ];
    const curve = new THREE.CatmullRomCurve3(pts);
    return new THREE.TubeGeometry(curve, 32, 0.0015, 8, false);
  }, []);

  // Support lead wire left curve
  const leftLeadGeo = useMemo(() => {
    const pts = [
      new THREE.Vector3(-0.005, 0.088, 0),
      new THREE.Vector3(-0.007, 0.104, 0),
      new THREE.Vector3(-0.015, 0.118, 0),
    ];
    const curve = new THREE.CatmullRomCurve3(pts);
    return new THREE.TubeGeometry(curve, 16, 0.0012, 6, false);
  }, []);

  // Support lead wire right curve
  const rightLeadGeo = useMemo(() => {
    const pts = [
      new THREE.Vector3(0.005, 0.088, 0),
      new THREE.Vector3(0.007, 0.104, 0),
      new THREE.Vector3(0.015, 0.118, 0),
    ];
    const curve = new THREE.CatmullRomCurve3(pts);
    return new THREE.TubeGeometry(curve, 16, 0.0012, 6, false);
  }, []);

  return (
    <group position={LAMP_POS}>
      {/* 1. MOLDED BAKELITE / CERAMIC SOCKET BASE */}
      <mesh position={[0, 0.016, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.076, 0.082, 0.032, 36]} />
        <meshStandardMaterial color="#1e2430" roughness={0.35} metalness={0.15} />
      </mesh>
      <mesh position={[0, 0.033, 0]} castShadow>
        <cylinderGeometry args={[0.065, 0.076, 0.006, 36]} />
        <meshStandardMaterial color="#181d26" roughness={0.4} />
      </mesh>

      {/* 2. BRASS SCREW TERMINAL POSTS ON SIDES */}
      {/* Left binding post (-X) */}
      <group position={[-0.055, 0.032, 0]}>
        <mesh position={[0, 0.008, 0]} castShadow>
          <cylinderGeometry args={[0.004, 0.004, 0.024, 16]} />
          <meshStandardMaterial color="#d97706" metalness={0.88} roughness={0.25} />
        </mesh>
        <mesh position={[0, 0.015, 0]} castShadow>
          <cylinderGeometry args={[0.011, 0.011, 0.012, 20]} />
          <meshStandardMaterial color="#eab308" metalness={0.85} roughness={0.3} />
        </mesh>
        <mesh position={[0, 0.002, 0]} castShadow>
          <cylinderGeometry args={[0.014, 0.014, 0.003, 20]} />
          <meshStandardMaterial color="#ca8a04" metalness={0.9} roughness={0.2} />
        </mesh>
      </group>

      {/* Right binding post (+X) */}
      <group position={[0.055, 0.032, 0]}>
        <mesh position={[0, 0.008, 0]} castShadow>
          <cylinderGeometry args={[0.004, 0.004, 0.024, 16]} />
          <meshStandardMaterial color="#d97706" metalness={0.88} roughness={0.25} />
        </mesh>
        <mesh position={[0, 0.015, 0]} castShadow>
          <cylinderGeometry args={[0.011, 0.011, 0.012, 20]} />
          <meshStandardMaterial color="#eab308" metalness={0.85} roughness={0.3} />
        </mesh>
        <mesh position={[0, 0.002, 0]} castShadow>
          <cylinderGeometry args={[0.014, 0.014, 0.003, 20]} />
          <meshStandardMaterial color="#ca8a04" metalness={0.9} roughness={0.2} />
        </mesh>
      </group>

      {/* 3. BULB METAL THREADED SCREW CAP */}
      <mesh position={[0, 0.044, 0]} castShadow>
        <cylinderGeometry args={[0.028, 0.030, 0.022, 32]} />
        <meshStandardMaterial color="#cbd5e1" metalness={0.85} roughness={0.28} />
      </mesh>
      {[-0.006, 0.0, 0.006].map((dy, idx) => (
        <mesh key={idx} position={[0, 0.044 + dy, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.0285, 0.0022, 10, 32]} />
          <meshStandardMaterial color="#94a3b8" metalness={0.9} roughness={0.25} />
        </mesh>
      ))}

      {/* 4. INTERNAL GLASS STEM & MOUNT */}
      <mesh position={[0, 0.062, 0]}>
        <cylinderGeometry args={[0.012, 0.022, 0.016, 24]} />
        <meshPhysicalMaterial
          color="#f8fafc"
          transparent
          opacity={0.6}
          roughness={0.1}
          transmission={0.85}
          thickness={0.02}
        />
      </mesh>
      <mesh position={[0, 0.078, 0]}>
        <cylinderGeometry args={[0.005, 0.005, 0.026, 16]} />
        <meshPhysicalMaterial
          color="#f8fafc"
          transparent
          opacity={0.65}
          roughness={0.08}
          transmission={0.9}
        />
      </mesh>
      <mesh position={[0, 0.092, 0]}>
        <boxGeometry args={[0.018, 0.006, 0.008]} />
        <meshPhysicalMaterial
          color="#f8fafc"
          transparent
          opacity={0.7}
          roughness={0.1}
          transmission={0.85}
        />
      </mesh>

      {/* 5. INTERNAL SUPPORT / LEAD-IN WIRES */}
      <mesh geometry={leftLeadGeo}>
        <meshStandardMaterial color="#cbd5e1" metalness={0.92} roughness={0.2} />
      </mesh>
      <mesh geometry={rightLeadGeo}>
        <meshStandardMaterial color="#cbd5e1" metalness={0.92} roughness={0.2} />
      </mesh>
      {[-0.015, 0.015].map((x, i) => (
        <mesh key={i} position={[x, 0.118, 0]} rotation={[0, 0, i === 0 ? 0.3 : -0.3]}>
          <cylinderGeometry args={[0.0018, 0.0018, 0.005, 10]} />
          <meshStandardMaterial color="#e2e8f0" metalness={0.95} roughness={0.15} />
        </mesh>
      ))}

      {/* 6. COILED TUNGSTEN FILAMENT */}
      <mesh geometry={filamentGeo}>
        <meshStandardMaterial
          color={glow.filamentColor}
          emissive={glow.emissiveColor}
          emissiveIntensity={glow.emissiveIntensity}
          roughness={0.2}
          metalness={0.5}
        />
      </mesh>

      {/* Volumetric filament yellow glow core when active */}
      {norm > 0.02 && (
        <mesh position={[0, 0.138, 0]}>
          <sphereGeometry args={[glow.glowScale ?? 0.022, 20, 20]} />
          <meshBasicMaterial
            color={glow.emissiveColor}
            transparent
            opacity={glow.glowOpacity ?? 0.5}
          />
        </mesh>
      )}

      {/* 7. REALISTIC TEARDROP GLASS ENVELOPE */}
      <mesh geometry={bulbEnvelopeGeo}>
        <meshPhysicalMaterial
          color={glow.glassTint}
          transparent
          opacity={0.88}
          roughness={0.04}
          transmission={0.95}
          thickness={0.035}
          ior={1.52}
          specularIntensity={1.0}
          clearcoat={1.0}
          clearcoatRoughness={0.04}
        />
      </mesh>

      {/* 8. RADIANT YELLOW ILLUMINATION POINT LIGHT */}
      {glow.lightIntensity > 0.01 && (
        <>
          <pointLight
            position={[0, 0.138, 0]}
            intensity={glow.lightIntensity}
            distance={2.8}
            color={glow.lightColor}
            castShadow
            shadow-bias={-0.001}
          />
          <pointLight
            position={[0, 0.05, 0]}
            intensity={glow.lightIntensity * 0.4}
            distance={1.2}
            color="#fbbf24"
          />
        </>
      )}
    </group>
  );
}

function CameraRig({ zoom, intro, introIdx }: { zoom: boolean; intro?: boolean; introIdx?: number }) {
  const { camera, size } = useThree();
  const look = useRef(new THREE.Vector3(0, BENCH_Y + 0.2, BENCH_Z));
  const tmp = useMemo(() => new THREE.Vector3(), []);
  const tgt = useMemo(() => new THREE.Vector3(), []);
  useFrame(() => {
    if (intro && introIdx && introIdx > 0) {
      const focus = IV_TOUR_FOCUS[Math.min(introIdx - 1, IV_TOUR_FOCUS.length - 1)];
      tgt.set(...focus.target);
      tmp.set(focus.target[0] + 0.08, focus.target[1] + 0.22, focus.target[2] + (size.width < 800 ? 0.95 : 0.82));
    } else if (zoom) {
      tmp.set(LAMP_POS[0] + 0.06, BENCH_Y + 0.28, LAMP_POS[2] + (size.width < 800 ? 0.95 : 0.52));
      tgt.set(LAMP_POS[0], BENCH_Y + 0.15, LAMP_POS[2]);
    } else {
      tmp.set(0.0, BENCH_Y + 0.65, size.width < 800 ? 3.1 : 1.65);
      tgt.set(0.0, BENCH_Y + (size.width < 800 ? -0.08 : 0.18), BENCH_Z);
    }
    camera.position.lerp(tmp, 0.05);
    look.current.lerp(tgt, 0.05);
    camera.lookAt(look.current);
  });
  return null;
}

export default function IVLampScene({
  voltage,
  current,
  zoom,
  intro = false,
  introIdx = 0,
}: {
  voltage: number;
  current: number;
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
      <PowerSupply3D pos={SUPPLY_POS} voltage={voltage} on={true} />
      <Rheostat3D sliderFraction={voltage / 8} />
      <LampBulb3D voltage={voltage} maxVoltage={8} />
      <Meter3D label="V" value={voltage} max={8} pos={VMETER_POS} casingColor="#b8bfbe" bezelColor="#7d898b" />
      <Meter3D label="A" value={current} max={1} pos={AMETER_POS} casingColor="#b8bfbe" bezelColor="#7d898b" />

      {/* Flexible Patch Wires with Catenary Drape & Brass Terminals */}
      {/* 1. Supply Red (+) -> Rheostat Left Bottom Terminal */}
      <LabWire
        points={[
          [SUPPLY_POS[0] + 0.03, BENCH_Y + 0.035, SUPPLY_POS[2] + 0.112],
          [SUPPLY_POS[0] + 0.14, BENCH_Y + 0.015, SUPPLY_POS[2] + 0.06],
          [RHEO_POS[0] - 0.18, BENCH_Y + 0.015, RHEO_POS[2] + 0.04],
          [RHEO_POS[0] - 0.12, BENCH_Y + 0.035, RHEO_POS[2] + 0.04],
        ]}
        color="#dc2626"
        terminalEnds={["front", "front"]}
      />

      {/* 2. Rheostat Slider Contact -> Ammeter (+) Red Terminal */}
      <LabWire
        points={[
          [RHEO_POS[0] + (voltage / 8 - 0.5) * 0.18, BENCH_Y + 0.095, RHEO_POS[2]],
          [RHEO_POS[0] + (voltage / 8 - 0.5) * 0.18, BENCH_Y + 0.04, RHEO_POS[2] + 0.08],
          [AMETER_POS[0] - 0.12, BENCH_Y + 0.015, AMETER_POS[2] + 0.02],
          [AMETER_POS[0] - 0.055, BENCH_Y + 0.03, AMETER_POS[2] + 0.079],
        ]}
        color="#dc2626"
        terminalEnds={["top", "front"]}
      />

      {/* 3. Ammeter (-) Black Terminal -> Bulb Left Binding Post */}
      <LabWire
        points={[
          [AMETER_POS[0] + 0.055, BENCH_Y + 0.03, AMETER_POS[2] + 0.079],
          [(AMETER_POS[0] + LAMP_POS[0]) / 2, BENCH_Y + 0.015, BENCH_Z + 0.1],
          [LAMP_POS[0] - 0.1, BENCH_Y + 0.015, LAMP_POS[2] + 0.02],
          [LAMP_POS[0] - 0.055, BENCH_Y + 0.042, LAMP_POS[2]],
        ]}
        color="#dc2626"
        terminalEnds={["front", "top"]}
      />

      {/* 4. Voltmeter connected in parallel across the lamp. */}
      <LabWire
        points={[
          [LAMP_POS[0] - 0.055, BENCH_Y + 0.042, LAMP_POS[2]],
          [LAMP_POS[0] - 0.12, BENCH_Y + 0.018, LAMP_POS[2] + 0.08],
          [VMETER_POS[0] - 0.12, BENCH_Y + 0.015, VMETER_POS[2] + 0.04],
          [VMETER_POS[0] - 0.055, BENCH_Y + 0.03, VMETER_POS[2] + 0.079],
        ]}
        color="#dc2626"
        terminalEnds={["top", "front"]}
      />

      {/* 5. Lamp right post to voltmeter negative, with a separate return to source negative. */}
      <LabWire
        points={[
          [LAMP_POS[0] + 0.055, BENCH_Y + 0.042, LAMP_POS[2]],
          [LAMP_POS[0] + 0.12, BENCH_Y + 0.018, LAMP_POS[2] + 0.1],
          [VMETER_POS[0] + 0.1, BENCH_Y + 0.018, VMETER_POS[2] + 0.12],
          [VMETER_POS[0] + 0.055, BENCH_Y + 0.03, VMETER_POS[2] + 0.079],
        ]}
        color="#0f172a"
        terminalEnds={["top", "front"]}
      />
      <LabWire points={[
        [LAMP_POS[0] + 0.055, BENCH_Y + 0.042, LAMP_POS[2]],
        [LAMP_POS[0] + 0.14, BENCH_Y + 0.015, LAMP_POS[2] + 0.26],
        [0.0, BENCH_Y + 0.015, BENCH_Z + 0.34],
        [SUPPLY_POS[0] + 0.1, BENCH_Y + 0.015, BENCH_Z + 0.31],
        [SUPPLY_POS[0] + 0.075, BENCH_Y + 0.035, SUPPLY_POS[2] + 0.112],
      ]} color="#0f172a" terminalEnds={["top", "front"]} />

      {intro && introIdx > 0 && (
        <ApparatusTourTag
          at={IV_TOUR_FOCUS[Math.min(introIdx - 1, IV_TOUR_FOCUS.length - 1)].label}
          name={IV_TOUR_FOCUS[Math.min(introIdx - 1, IV_TOUR_FOCUS.length - 1)].name}
          number={introIdx}
        />
      )}
      <CameraRig zoom={zoom} intro={intro} introIdx={introIdx} />
    </Canvas>
  );
}
