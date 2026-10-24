"use client";

/**
 * ApparatusArt — hand-drawn SVG glassware for the pre-practical intro.
 *
 * The old intro showed one generic lucide flask for every slide, so "test tube
 * stand", "given salt" and "Bunsen burner" all looked identical. This library
 * instead draws the ACTUAL piece of apparatus the journal lists — a glass test
 * tube with its own coloured liquid + precipitate, a salt jar with an amber lid
 * and a "Salt" label, a beaker of reagent, a live Bunsen flame, a tripod, a
 * thermometer, a dropper, a watch glass — using the same pale-glass palette as
 * the 3D bench props, so each intro slide reads like Nova zooming the lab camera
 * on the real thing that's about to appear on the bench.
 *
 *   <ApparatusArt name="Test tube" />
 *   <ApparatusArt name="Given salt" zoom />
 */

import { useId } from "react";

export type ApparatusVariant =
  | "tube"
  | "beaker"
  | "jar"
  | "rack"
  | "burner"
  | "funnel"
  | "dropper"
  | "thermometer"
  | "tripod"
  | "watchglass"
  | "spoon";

// Liquids exactly as Nova renders them on the bench, so the intro is a look
// through the lab camera rather than a cartoon.
export const LIQUIDS = {
  pb: "#dfe6ea",
  cu: "#8fb6e0",
  fe: "#e7c39a",
  nh3: "#e2def2",
  k2cro4: "#f0dd4a",
  ki: "#e6c35c",
  naoh: "#eef0f2",
  hcl: "#e2e9ee",
  h2so4: "#e0e7ea",
  hno3: "#e6ebe4",
  water: "#cfe3f0",
  salt: "#e9e2d2",
};

const GLASS = "#b7c2c9";

function TestTube({
  liquid,
  ppt,
  pptColor,
  id,
  zoom,
}: {
  liquid: string;
  ppt: boolean;
  pptColor: string;
  id: string;
  zoom: boolean;
}) {
  return (
    <svg
      viewBox="0 0 46 112"
      className={`relative h-28 w-12 sm:h-32 sm:w-14 transition-transform duration-500 ${zoom ? "scale-105" : "scale-100"}`}
    >
      <defs>
        <clipPath id={id}>
          <path d="M14 10 L14 70 A9 9 0 0 0 32 70 L32 42 Z" clipRule="evenodd" />
        </clipPath>
      </defs>
      {/* liquid + precipitate inside the glass */}
      <g clipPath={`url(#${id})`}>
        <rect x="14" y="40" width="22" height="44" fill={liquid} opacity="0.85" />
        {ppt && (
          <g>
            <circle cx="19" cy="66" r="4.6" fill={pptColor} />
            <circle cx="26" cy="70" r="5" fill={pptColor} />
            <circle cx="29" cy="66" r="3.9" fill={pptColor} />
            <circle cx="22" cy="63" r="3.4" fill={pptColor} />
          </g>
        )}
      </g>
      {/* glass wall */}
      <path d="M14 10 A11 11 0 0 1 22 54 L22 72 A9 9 0 0 0 36 80 L38 74" fill="none" stroke={GLASS} strokeWidth="2.4" />
      <path d="M28 11 L28 78" fill="none" stroke={GLASS} strokeWidth="2.4" />
      <rect x="12" y="7" width="24" height="7" rx="3.5" fill="#cdd5db" />
    </svg>
  );
}

function Beaker({ liquid, id, label }: { liquid: string; id: string; label?: string }) {
  return (
    <svg viewBox="0 0 120 122" className="relative h-28 w-32 sm:h-32 sm:w-36">
      <defs>
        <clipPath id={id}>
          <path d="M32 16 L24 88 A10 10 0 0 1 42 106 L86 106 A8 8 0 0 0 96 96 L92 16 Z" />
        </clipPath>
      </defs>
      <path d="M32 16 L24 88 A10 10 0 0 1 42 106 L86 106 A8 8 0 0 0 96 96 L92 16 Z" fill="#eef2f5" opacity="0.5" />
      <g clipPath={`url(#${id})`}>
        <rect x="26" y="52" width="64" height="54" fill={liquid} opacity="0.85" />
        <path d="M28 52 Q58 46 90 52 L90 60 Q60 54 28 60 Z" fill="#ffffff" opacity="0.3" />
      </g>
      {label && (
        <g>
          <rect x="42" y="66" width="38" height="24" rx="4" fill="#fff" stroke="#e3cfa0" strokeWidth="1.6" />
          <text x="61" y="82" textAnchor="middle" fontFamily="ui-sans-serif, system-ui" fontSize="11" fontWeight="900" fill="#7a5b28">
            {label}
          </text>
        </g>
      )}
      <path d="M30 14 L96 18" stroke="#cdd5db" strokeWidth="6" strokeLinecap="round" />
      <path d="M28 22 L22 90 A10 10 0 0 1 30 100 M84 104 L94 92 L90 22" fill="none" stroke={GLASS} strokeWidth="2.6" strokeLinejoin="round" />
    </svg>
  );
}

function SaltJar({ id }: { id: string }) {
  return (
    <svg viewBox="0 0 56 96" className="relative h-28 w-16 sm:h-32 sm:w-[4.6rem]">
      <defs>
        <clipPath id={id}>
          <path d="M6 34 L6 78 A8 8 0 0 0 14 94 L42 94 A8 8 0 0 0 50 78 L50 34 Z" />
        </clipPath>
      </defs>
      <rect x="6" y="34" width="44" height="60" fill="#f4f0e4" clipPath={`url(#${id})`} />
      <path d="M6 34 Q30 28 50 36 L50 44 Q30 36 6 44 Z" fill="#fffdf6" clipPath={`url(#${id})`} />
      <rect x="8" y="62" width="40" height="20" rx="3" fill="#fff" stroke="#e3cfa0" strokeWidth="1.6" />
      <text x="28" y="76" textAnchor="middle" fontFamily="ui-sans-serif, system-ui" fontSize="10" fontWeight="900" fill="#7a5b28">
        Salt
      </text>
      <path d="M6 24 L50 32" stroke={GLASS} strokeWidth="2.6" />
      <rect x="4" y="8" width="50" height="26" rx="4" fill="#c9a24f" />
      <rect x="10" y="16" width="38" height="12" rx="2" fill="#d8b76a" />
    </svg>
  );
}

function Burner() {
  return (
    <svg viewBox="0 0 64 98" className="relative h-28 w-16 sm:h-32 sm:w-20">
      <path d="M24 54 L24 48 A8 8 0 0 1 40 48 L40 54" fill="none" stroke={GLASS} strokeWidth="4" />
      <rect x="22" y="54" width="20" height="26" rx="3" fill="#8a969e" />
      <path d="M32 22 C25 32 22 40 26 48 C28 54 36 56 38 50 C42 46 42 30 32 22 Z" fill="#f5a623" />
      <path d="M32 26 C27 34 26 40 28 44 C30 48 34 48 35 44 C37 40 36 32 32 26 Z" fill="#fff8e1" />
      <rect x="36" y="80" width="8" height="10" rx="1" fill="#6b7680" />
      <line x1="22" y1="92" x2="42" y2="92" stroke="#6b7680" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

function Tripod() {
  return (
    <svg viewBox="0 0 140 124" className="relative h-28 w-32 sm:h-32 sm:w-36">
      <path d="M26 44 L118 44" stroke="#6b7680" strokeWidth="6" strokeLinecap="round" />
      <path d="M36 44 L14 118 M104 44 L126 118 M70 44 L70 120" stroke="#6b7680" strokeWidth="6" strokeLinecap="round" />
      <g stroke={GLASS} strokeWidth="5" strokeLinecap="round">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <line key={i} x1={34 + i * 12} y1="44" x2={30 + i * 12} y2="52" />
        ))}
      </g>
    </svg>
  );
}

function Thermometer() {
  return (
    <svg viewBox="0 0 40 126" className="relative h-28 w-8 sm:h-32 sm:w-10">
      <line x1="20" y1="14" x2="20" y2="116" stroke="#dfe6ea" strokeWidth="6" strokeLinecap="round" />
      <circle cx="20" cy="114" r="14" fill="#e06b47" />
      <rect x="17" y="88" width="6" height="30" fill="#f0876a" />
      <text x="30" y="28" fontSize="8" fontWeight="900" fill="#7a7f85">
        40
      </text>
    </svg>
  );
}

function Dropper() {
  return (
    <svg viewBox="0 0 40 132" className="relative h-28 w-8 sm:h-32 sm:w-10">
      <rect x="16" y="14" width="8" height="72" rx="2" fill="#dfe6ea" />
      <path d="M16 16 L26 16 L26 52 L40 62 L26 88 L22 88 Z" fill="#cfd6da" />
      <circle cx="20" cy="8" r="12" fill="#e06b47" />
      <circle cx="20" cy="8" r="5" fill="#f0876a" />
    </svg>
  );
}

function WatchGlass() {
  return (
    <svg viewBox="0 0 86 46" className="relative h-14 w-24 sm:h-16 sm:w-28">
      <path d="M6 16 A38 16 0 1 0 80 16 A38 16 0 1 0 6 16 Z" fill="#eef2f5" stroke={GLASS} strokeWidth="2.6" />
      <path d="M12 16 A32 12 0 1 0 74 16 Z" fill="#ffffff" opacity="0.35" />
    </svg>
  );
}

/** Resolve a journal apparatus sentence to a concrete drawing. Greedy keywords,
 *  always falling back to a test tube so nothing renders as a "?" box. */
export function variantFor(name: string): ApparatusVariant {
  const t = name.toLowerCase();
  if (/bunsen|burner|spirit lamp|spirit lamp|lamp/i.test(t)) return "burner";
  if (/test tube stand|tube stand|rack|stand/i.test(t)) return "rack";
  if (/dropper|pipette/i.test(t)) return "dropper";
  if (/thermo/i.test(t)) return "thermometer";
  if (/tripod/i.test(t)) return "tripod";
  if (/watch glass|watchglass/i.test(t)) return "watchglass";
  if (/funnel/i.test(t)) return "funnel";
  if (/spoon|spatula/i.test(t)) return "spoon";
  if (/salt|sample|given salt|powder|spatula/i.test(t)) return "jar";
  if (/beaker|kjeldahl|erlenmeyer|reagent|solution|acid|hcl|h2so4|hno3|k2cro4|ki|cuso4|test tube|tube/i.test(t))
    return "tube";
  return "tube";
}

function liquidFor(name: string): string {
  const t = name.toLowerCase();
  if (/pb|lead/i.test(t)) return LIQUIDS.pb;
  if (/cu|cuso4|copper/i.test(t)) return LIQUIDS.cu;
  if (/fe|ferric|iron/i.test(t)) return LIQUIDS.fe;
  if (/k2cro4|chromate/i.test(t)) return LIQUIDS.k2cro4;
  if (/ki\b|iodide/i.test(t)) return LIQUIDS.ki;
  if (/salt|sample/i.test(t)) return LIQUIDS.salt;
  return LIQUIDS.water;
}

function pptFor(name: string): { show: boolean; color: string } {
  const t = name.toLowerCase();
  if (/pb|lead/i.test(t)) return { show: true, color: "#f2f3f4" };
  return { show: false, color: "#fff" };
}

export function ApparatusArt({
  name,
  className = "",
  zoom = false,
}: {
  name: string;
  className?: string;
  zoom?: boolean;
}) {
  const id = useId().replace(/:/g, "");
  const v = variantFor(name);
  const liquid = liquidFor(name);
  const ppt = pptFor(name);

  if (v === "jar") return <SaltJar id={id} />;
  if (v === "burner") return <Burner />;
  if (v === "tripod") return <Tripod />;
  if (v === "thermometer") return <Thermometer />;
  if (v === "dropper") return <Dropper />;
  if (v === "watchglass") return <WatchGlass />;
  if (v === "beaker" || v === "rack" || v === "funnel" || v === "spoon")
    return <Beaker liquid={liquid} id={id} label="apparatus" />;
  return <TestTube liquid={liquid} ppt={ppt.show} pptColor={ppt.color} id={id} zoom={zoom} />;
}
