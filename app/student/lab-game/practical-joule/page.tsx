"use client";

import Calorimeter from "../_practical/physics/Calorimeter";

const M_G = 100; // grams of water
const J_TRUE = 4.186; // joules per calorie

export default function JoulePage() {
  return (
    <Calorimeter
      badge="Physics · Practical 7"
      title="Mechanical equivalent of heat, J"
      intro={<>Heat water electrically. Compare the <b>electrical energy VIt</b> (joules) with the <b>heat produced</b> (calories) to find J, the mechanical equivalent of heat.</>}
      massLabel={`${M_G} g water`}
      // heat produced (cal) = m(g)·c(1 cal/g°C)·ΔT ⇒ ΔT = VIt / (J·m)
      deltaTFor={(E) => E / (J_TRUE * M_G)}
      // J = electrical energy (J) / heat (cal) = VIt / (m·ΔT)
      result={(E, dT) => E / (M_G * dT)}
      formula="J = VIt / (m·ΔT)"
      unit="J/cal"
      expected={{ value: J_TRUE, label: "accepted value" }}
      note="Electrical energy in joules divided by heat produced in calories gives J ≈ 4.19 J/cal — the mechanical equivalent of heat."
      expNo={7}
      object="To determine the mechanical equivalent of heat, J, by the electrical method."
      apparatus="Calorimeter with immersion heater and stirrer, ammeter, voltmeter, rheostat, battery/power supply, thermometer, stop-watch and a known mass of water."
      theory={<>
        <p>When a current flows through the heater, the electrical energy converted is W = VIt (in joules). This energy heats the water; the heat produced is Q = m·c·Δθ (in calories, with c = 1 cal g⁻¹ °C⁻¹ for water). The mechanical equivalent of heat is</p>
        <p className="my-2 text-center font-bold">J = W / Q = VIt / (m·Δθ)</p>
      </>}
      method={[
        "Take a known mass m of water in the calorimeter and note its initial temperature.",
        "Switch on the heater and note the steady voltmeter (V) and ammeter (I) readings.",
        "Run the heater for a measured time t, stirring gently.",
        "Note the final temperature and find the rise Δθ.",
        "Compute J = VIt / (m·Δθ).",
      ]}
      resultText={(v) => <p>The mechanical equivalent of heat, J = <b>{v != null ? `${v.toPrecision(3)} J/cal` : "—"}</b>, close to the accepted 4.19 J/cal.</p>}
    />
  );
}
