"use client";

import Calorimeter from "../_practical/physics/Calorimeter";

const M_KG = 0.15; // kg of liquid
const C_TRUE = 4186; // specific heat of water, J/(kg·K)

export default function SpecificHeatPage() {
  return (
    <Calorimeter
      badge="Physics · Practical 8"
      title="Specific heat capacity of a liquid"
      intro={<>Heat a known mass of liquid electrically. From the <b>electrical energy VIt</b> and the <b>temperature rise ΔT</b>, find the liquid&apos;s specific heat capacity c.</>}
      massLabel={`${M_KG} kg water`}
      // VIt = m·c·ΔT ⇒ ΔT = VIt / (m·c)
      deltaTFor={(E) => E / (M_KG * C_TRUE)}
      // c = VIt / (m·ΔT)
      result={(E, dT) => E / (M_KG * dT)}
      formula="c = VIt / (m·ΔT)"
      unit="J/(kg·K)"
      expected={{ value: C_TRUE, label: "water" }}
      note="Electrical energy equals heat gained by the liquid, so c = VIt / (m·ΔT) ≈ 4200 J/(kg·K) for water."
      expNo={8}
      object="To determine the specific heat capacity of a liquid by the electrical method."
      apparatus="Calorimeter with immersion heater and stirrer, ammeter, voltmeter, rheostat, battery/power supply, thermometer, stop-watch and a known mass of the liquid."
      theory={<>
        <p>The electrical energy supplied by the heater is W = VIt. Assuming no heat loss, this equals the heat gained by the liquid:</p>
        <p className="my-2 text-center font-bold">VIt = m·c·Δθ ⇒ c = VIt / (m·Δθ)</p>
        <p>where m is the mass of the liquid, Δθ its temperature rise and c its specific heat capacity.</p>
      </>}
      method={[
        "Take a known mass m of the liquid in the calorimeter and note its initial temperature.",
        "Switch on the heater and note the steady voltmeter (V) and ammeter (I) readings.",
        "Run the heater for a measured time t, stirring gently.",
        "Note the final temperature and find the rise Δθ.",
        "Compute c = VIt / (m·Δθ).",
      ]}
      resultText={(v) => <p>The specific heat capacity of the liquid, c = <b>{v != null ? `${v.toPrecision(3)} J/(kg·K)` : "—"}</b>.</p>}
    />
  );
}
