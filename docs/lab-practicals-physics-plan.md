# Physics Lab — Simulation Build Plan

Source: `588130874-Physics-XII-12th-Grade-Class-Practical-Journal.pdf` (scanned AKUEB
Physics XII practical journal, 8 experiments — index on pp. 1–2).

> Physics practicals are neither "pour reagents" (chemistry) nor "observe/label"
> (biology). They are **measure → record → graph → compute** experiments: set up
> apparatus, vary a parameter, read instruments, tabulate, plot a graph, and derive
> a physical constant. So the right primitive here is an **instrument + live-reading
> + data-table + graph + result** framework, with two apparatus flavours (thermal
> and electrical) on top of it.

Legend: `[ ]` not started · `[~]` in progress · `[x]` done

---

## 1. The 8 practicals, grouped by interaction type

### Type T — Thermal / calorimetry (heat, thermometer, timer, graph)
| # | Practical | What the student does | Result |
|---|-----------|-----------------------|--------|
| P1 | Coefficient of linear expansion — Pullinger's apparatus | Pass steam through a rod, read the micrometer/spherometer as it expands, note initial & final temperature and length | α = ΔL / (L₀·ΔT) |
| P2 | Verify Newton's law of cooling | Hot water in a calorimeter; log temperature every ½ min as it cools; plot T vs t and (dT/dt) vs (T−T_room) | cooling ∝ excess temperature (straight line) |
| P5 | Pressure coefficient of air at constant volume | Constant-volume air thermometer in a water bath; heat the bath, keep volume fixed, read pressure (manometer) vs temperature; plot P vs T | β_P = (1/P₀)(dP/dT) ≈ 1/273 K⁻¹ |
| P7 | Mechanical equivalent of heat, J (electrical) | Immersion coil heats water in a calorimeter; measure V, I, t and the temperature rise | J = VIt / (mcΔT) ≈ 4.2 J/cal |
| P8 | Specific heat capacity of a liquid (electrical) | Same electrical-calorimeter rig; from electrical energy and ΔT solve for c | c = VIt / (m·ΔT) |

### Type E — Electrical / circuit measurement (battery, rheostat, meters, graph)
| # | Practical | What the student does | Result |
|---|-----------|-----------------------|--------|
| P3 | Resistance of a voltmeter | Voltmeter + known high resistances in series with a cell; from readings deduce the voltmeter's own resistance | R_V |
| P4 | Resistance of a galvanometer — half-deflection | Galvanometer + series R + shunt S; note full deflection, then shunt for half deflection | G = (R·S)/(R−S) (with R≫G, G ≈ S) |
| P6 | I–V of a tungsten filament lamp | Vary the applied voltage with a rheostat, read current at each step; plot I vs V | non-ohmic (curved) — R rises with temperature |

---

## 2. Engines to build (2 apparatus flavours + 1 shared core)

### Core — `PhysicsRig` (shared, powers all 8)  ★ build first
The common shell every practical plugs into:
- **Apparatus stage** (left/large): a 3D or 2.5-D SVG scene of the specific rig.
- **Instrument read-outs**: analog dial(s) (thermometer column, ammeter/voltmeter
  needle, manometer height, micrometer barrel) with the **live value** driven by
  the physics model + a little sensor noise for realism.
- **Controls**: sliders/knobs (rheostat, heater on/off, steam on/off), a **"Take
  reading"** button, and a **timer** for time-series experiments.
- **Data table**: rows accumulate as the student takes readings.
- **Graph**: live SVG plot (auto-scaled axes, best-fit line where relevant).
- **Result card**: the derived constant with the formula, plus expected value.
- Reuses the Biology `BioHero`-style header (Nova avatar + Quit) and full-width layout.

### Engine T — `ThermalRig` (P1, P2, P5, P7, P8)
- Calorimeter / rod / gas-bulb visuals, a **thermometer** column, steam or an
  **electric immersion heater** (V·I·t energy), optional **manometer** (P5).
- A **clock** that advances (real-time or fast-forward) so temperature evolves via
  the model (Newton cooling for P2; linear ΔT from electrical power for P7/P8;
  Gay-Lussac P∝T for P5; ΔL∝ΔT for P1).
- Time-series logging + cooling/heating curve; computed α, β, J, c.

### Engine E — `CircuitRig` (P3, P4, P6)
- An SVG **circuit board**: cell, rheostat (draggable slider), series/shunt
  resistors, and the meter under test (voltmeter / galvanometer / ammeter) with an
  animated **needle** deflection.
- Ohm's-law/divider model computes meter readings; half-deflection logic for P4;
  I–V sweep + plotted curve for P6.

---

## 3. Reuse from the existing Chemistry & Biology labs
- **Fullscreen routing** (`lib/quiz-screen.ts::isFullscreenPath`) — add each `practical-*` route.
- **Catalogue pattern** (`constants/labPracticals.ts`) — add a `physics: { XII: [...] }` block (already typed as a `LabSubject`) + a Physics Lab menu page mirroring `biology/page.tsx`.
- **`BioHero`** header (Nova avatar + Quit) → generalise to a shared `LabHero` for both Biology and Physics.
- **SVG graph/data tooling** from the biology data tools (histogram/pie) → the graph + table primitives.
- **Procedural 3D stack** (R3F, `Canvas`, `useFrame`) from the chemistry/biology scenes for the apparatus, if we go 3D; otherwise crisp 2.5-D SVG (faster, and enough for meters/calorimeters).

## 3a. Recommended rendering choice
- **SVG-first** for meters, circuits, graphs, manometer, thermometer — sharp, cheap,
  easy to animate needles/columns. Use **R3F only where a 3-D apparatus adds real
  value** (e.g. the calorimeter/rod). Start SVG; upgrade individual rigs to 3D later.

---

## 4. Asset requirements (low — mostly procedural)
| Asset | Needed by | Source |
|---|---|---|
| Thermometer, meters, dials, needles | all | Procedural SVG ✅ |
| Calorimeter, rod, gas bulb, manometer, rheostat | T & E rigs | Procedural SVG / R3F ✅ |
| Graph + data table | all | Procedural SVG (reuse bio tooling) ✅ |
| Nova avatar | all | `public/nova-tutor.png` (already have) ✅ |

**No external/licensed assets required** — physics apparatus is all drawable.

---

## 5. Recommended build order (value ÷ effort)
1. **Core `PhysicsRig`** shell (header, table, graph, result card, reading/timer plumbing).
2. **P6 — I–V lamp** (Engine E, simplest: sweep V, read I, plot) — proves the circuit + graph loop.
3. **P2 — Newton's law of cooling** (Engine T, the canonical data-logging + graph experiment).
4. **P4 — Galvanometer half-deflection** and **P3 — Voltmeter resistance** (Engine E, share the meter/needle rig).
5. **P7 + P8 — J and specific heat** (Engine T, share the electrical-calorimeter rig; two configs of one scene).
6. **P5 — Pressure coefficient** (Engine T + manometer).
7. **P1 — Linear expansion / Pullinger's** (Engine T + micrometer + steam; most bespoke apparatus).

Front-loads the shared core + one rig per flavour, then the rest are configs.

---

## 6. Physics teaching model (accuracy notes)
- Each rig runs the **real formula** with small Gaussian noise on readings so
  tabulated data looks authentic and the best-fit line/derived constant lands near
  the textbook value (α≈1.2×10⁻⁵/°C for steel, J≈4.2 J/cal, β_P≈1/273, water c≈4200 J/kg·K).
- Show the **formula** and **% error vs accepted value** in the result card for
  pedagogy, matching the chemistry/biology "milestone" completion style.

---

## Progress (Physics): 8 / 8 simulated. ✅
- [x] Core kit (`_practical/physics/kit.tsx`: LabHero, Panel, Slider, Meter, Graph, DataTable, ResultCard) + shared `Calorimeter.tsx`
- [x] P1 — Linear expansion (Pullinger's, steam + micrometer) → `practical-expansion`
- [x] P2 — Newton's law of cooling (live thermometer, cooling curve, rate-vs-excess fit) → `practical-cooling`
- [x] P3 — Resistance of a voltmeter (V₀/V₁ divider method) → `practical-voltmeter`
- [x] P4 — Galvanometer (half-deflection, shunt) → `practical-galvanometer`
- [x] P5 — Pressure coefficient of air (bulb + manometer, P–T fit) → `practical-gas-pressure`
- [x] P6 — I–V of tungsten lamp (glowing lamp, non-ohmic curve) → `practical-iv-lamp`
- [x] P7 — Mechanical equivalent of heat J (electrical calorimeter) → `practical-joule`
- [x] P8 — Specific heat of a liquid (electrical calorimeter) → `practical-specific-heat`

Infrastructure done: `physics` catalogue in `constants/labPracticals.ts`, Physics Lab
menu (`/student/lab-game/physics`), main lab card enabled, fullscreen routes registered.
P7 & P8 share one `Calorimeter` rig; all rigs compose the shared `kit.tsx` primitives.
