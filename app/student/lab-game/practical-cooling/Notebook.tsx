"use client";

import { useMemo } from "react";
import Journal, { JTable, type JournalConfig } from "../_practical/physics/Journal";
import { Graph, type Pt } from "../_practical/physics/kit";

type Reading = { t: number; temp: number };

export default function Notebook({ readings, room, t0, onClose }: { readings: Reading[]; room: number; t0: number; onClose: () => void }) {
  // Method 1 — log(excess) vs time (straight line ⇒ verified)
  const logPts: Pt[] = readings.filter((r) => r.temp - room > 0).map((r) => ({ x: r.t / 60, y: +Math.log10(r.temp - room).toFixed(3) }));

  // Method 2 — cooling constant per whole minute
  const perMin = useMemo(() => {
    const rows: { m: number; fall: number; meanExcess: number; k: number }[] = [];
    const byT = new Map(readings.map((r) => [r.t, r.temp]));
    for (let m = 1; m * 60 <= (readings[readings.length - 1]?.t ?? 0); m++) {
      const a = byT.get((m - 1) * 60), b = byT.get(m * 60);
      if (a == null || b == null) continue;
      const fall = +(a - b).toFixed(1), meanExcess = +((a + b) / 2 - room).toFixed(1);
      rows.push({ m, fall, meanExcess, k: +(fall / meanExcess).toFixed(3) });
    }
    return rows;
  }, [readings, room]);
  const avgK = perMin.length ? +(perMin.reduce((s, r) => s + r.k, 0) / perMin.length).toFixed(3) : 0;

  const config: JournalConfig = {
    expNo: 2,
    title: "Verification of Newton's Law of Cooling",
    object: "To study how a hot liquid cools and thereby verify Newton's law of cooling.",
    apparatus: "Graduated glass beaker, hot water (~90 °C), digital immersion probe, retort stand and clamp, glass stirrer, and stopwatch.",
    theory: (
      <>
        <p>Newton&apos;s law of cooling states that the rate of loss of heat of a body is directly proportional to the excess of its temperature over the surroundings, provided the excess is small. If θ is the temperature of the body and θ<sub>r</sub> that of the room,</p>
        <p className="my-2 text-center font-bold">−dθ/dt ∝ (θ − θ<sub>r</sub>) ⇒ −dθ/dt = k(θ − θ<sub>r</sub>)</p>
        <p>Hence a graph of log(θ − θ<sub>r</sub>) against time is a straight line, and the cooling constant k found for equal intervals stays the same.</p>
      </>
    ),
    method: [
      "Record the room temperature θr.",
      "Place the graduated beaker on the bench and fill it about three-fourths with hot water (~90 °C).",
      "Clamp the digital probe so its metal tip is immersed but does not touch the glass.",
      "Start the stopwatch. Stir gently and record a temperature every 30 s for 5 minutes.",
      "Find the excess temperature (θ − θr) for each reading.",
    ],
    observation: (
      <>
        <p className="mb-1">Room temperature θ<sub>r</sub> = {room} °C · Initial temperature = {t0} °C</p>
        <JTable head={["Time (s)", "Temp θ (°C)", "Excess (θ − θr)", "log(excess)"]} rows={readings.map((r) => [r.t, r.temp.toFixed(1), (r.temp - room).toFixed(1), r.temp - room > 0 ? Math.log10(r.temp - room).toFixed(3) : "—"])} />
      </>
    ),
    calculation: (
      <>
        <p className="font-bold">Method 1 — graph of log(θ − θ<sub>r</sub>) vs time</p>
        <div className="my-2 rounded-lg bg-white/80 p-2"><Graph points={logPts} xLabel="Time (min)" yLabel="log(θ − θ_r)" mode="fit" color="#166534" heightPx={180} /></div>
        <p>The points lie on a straight line, so log(θ − θ<sub>r</sub>) falls uniformly with time.</p>
        <p className="mt-3 font-bold">Method 2 — cooling constant per interval</p>
        <p className="text-[13px]">k = (fall of temperature in the interval) ÷ (mean temperature in interval − θ<sub>r</sub>)</p>
        <JTable head={["Minute", "Fall (°C)", "Mean − θr (°C)", "k"]} rows={perMin.map((r) => [r.m, r.fall, r.meanExcess, r.k])} />
        <p className="mt-2">Average cooling constant k = <b>{avgK}</b> — nearly the same for each interval.</p>
      </>
    ),
    result: (
      <>
        <p><b>Method 1:</b> The graph between time and log(θ − θ<sub>r</sub>) is a straight line — Newton&apos;s law of cooling is verified.</p>
        <p className="mt-1"><b>Method 2:</b> The cooling constant is the same (≈ {avgK}) within experimental error for different intervals — Newton&apos;s law of cooling is verified.</p>
      </>
    ),
    errors: [
      "The draught of air over the apparatus may not be constant.",
      "The temperature of the surroundings may change during the experiment.",
      "Heat may escape through the beaker base and probe stem.",
      "The digital probe resolution limits the reading accuracy.",
      "Error in reading the thermometer and in timing (human error).",
    ],
  };

  return <Journal config={config} onClose={onClose} />;
}
