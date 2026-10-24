# Biology Lab — Simulation Build Plan

Source: `909397818-Biology-Practicals.docx` (AKUEB Biology Practical Manual, 11 practicals).

> Unlike the Chemistry lab (a single "pour reagents into test tubes" engine), the
> Biology practicals split into **four fundamentally different interaction types**.
> Trying to force them into the chemistry engine would be wrong — this plan defines
> the right engine per type and reuses the shared lab shell where it makes sense.

Legend: `[ ]` not started · `[~]` in progress · `[x]` done

---

## 1. The 11 practicals, grouped by interaction type

### Type A — 3D model observation / labelling (first-person or model-viewer)
| # | Practical (SLO) | What the student does |
|---|---|---|
| B1 | Locate annual rings in a tree log (16.1.1) | Rotate a 3D log cross-section, **count the rings**, estimate age |
| B2 | Phototropism & geotropism (16.2.5) | Watch a plant **bend toward light** / roots bend down (time-lapse) |
| B3 | Bones of girdles & limbs (16.4.2) | Rotate a **3D skeleton**, click to **label** pectoral/pelvic girdle, arm, leg bones |
| B5 | Female rabbit reproductive system (18.6.3) | Rotate a 3D model, **label** ovary, oviduct, uterus, cervix, vagina |

### Type B — Microscope viewer (prepared-slide / photomicrograph study)
| # | Practical (SLO) | What the student does |
|---|---|---|
| B4 | Frog muscle slides (16.5.3) | Under a **microscope**, view skeletal / smooth / cardiac muscle; identify features |
| B6 | Mammalian ovary histology (18.6.3) | View follicle stages (primary → secondary → Graafian); label |
| B7 | Chick embryo 48 h & 72 h (19.5.2) | Study **photomicrographs**; label head fold, heart, somites, optic cup, limb buds… |

### Type C — Data / probability tools (interactive, not 3D)
| # | Practical (SLO) | What the student does |
|---|---|---|
| B8 | Gene mixing with dice (22.2.2) | **Roll dice** for gametes, tally AA/Aa/aa, watch the **1:2:1** ratio emerge |
| B9 | Continuous variation — human height (22.2.2) | Enter/collect heights → **histogram** (bell curve) |
| B10 | AB blood-group survey (22.4.1) | Collect A/B/AB/O tallies → **pie chart** |

### Type D — Diagram / concept builder
| # | Practical (SLO) | What the student does |
|---|---|---|
| B11 | Food chains & food web (25.3.5) | **Drag** organisms into trophic levels, **link arrows** into a food web |

---

## 2. Engines to build (4)

### Engine 1 — `BioModelViewer` (Type A)  ★ highest reuse of existing 3D stack
- Reuses R3F + `useGLTF` + `GltfFit` normaliser (already used for the chemistry skeleton).
- Orbit/first-person camera, click-to-label **hotspots** (invisible spheres → label callout), a checklist of parts to find, and a "found X of N" progress + summary.
- Time-lapse variant for **B2** (animated bone/stem growth via keyframed rotation toward a light source).
- Ring-counting variant for **B1** (click each ring; running count → age).

### Engine 2 — `MicroscopeViewer` (Type B)  ★ image-based, no heavy 3D
- Full-screen microscope frame (eyepiece vignette, stage, focus knob).
- Layered slide **images** with pan/zoom, a **focus slider** (blur→sharp), magnification selector (4×/10×/40×).
- Clickable labels/hotspots over the image, plus a labelled reference diagram.
- **Blocking dependency:** licensed/CC0 histology & photomicrograph **images** (frog muscle, ovary follicles, chick embryo). See §4.

### Engine 3 — `DataTool` (Type C)  ★ pure React/SVG, fast to build
- `DiceCross` (B8): animated dice, allele mapping, live tally table + bar chart converging to 1:2:1.
- `HistogramTool` (B9): height input (or class dataset), binning, SVG histogram.
- `PieChartTool` (B10): tally input, proportion→angle, SVG pie chart with legend.
- All theme-matched (primary green), gamified summary like the chemistry practicals.

### Engine 4 — `DiagramBuilder` (B11)  ★ drag-and-drop canvas
- Palette of organisms (producers/consumers/decomposers) → drag onto trophic tiers → draw energy-flow arrows → validate a food web.

---

## 3. Reuse from the existing Chemistry lab
- **DashboardShell fullscreen routing** (`lib/quiz-screen.ts::isFullscreenPath`) — add each new bio route.
- **Lab menu + class filter** (`constants/labPracticals.ts` pattern) → add a `LabSubject: "biology"` catalogue + a Biology Lab menu page.
- **Nova tutor speech-bubble guide, milestone pops, pre/post cards, quit modal, mobile controls** from `PracticalRunner` — factor these into a shared `_shared/GuideShell` so all four bio engines get the same polished UX for free.
- **LabRoom / bench / first-person `Player`** for the Type-A 3D scenes.
- **AI grading** (`app/api/lab/grade`) pattern for open-ended observations if desired.

---

## 4. Asset requirements (the real gating factor)
| Asset | Needed by | Source strategy |
|---|---|---|
| Tree-log cross-section (rings) | B1 | Procedural (concentric lathe rings) — **no external asset** ✅ |
| Potted plant model | B2 | Poly Pizza CC0 or procedural stem+leaves |
| Human skeleton GLB | B3 | **Already have** `public/models/skeleton.glb` ✅ (add bone hotspots) |
| Female rabbit repro-system model | B5 | Hard to source as CC0 → **procedural stylised model** or a labelled 2.5D diagram fallback |
| Frog muscle / ovary / chick-embryo images | B4, B6, B7 | **Need CC0/licensed micrographs** — biggest blocker; may need user-provided or open-access (e.g. Wikimedia) images embedded as assets |
| Organism icons | B11 | Simple procedural/emoji or CC0 icon set |

**Honest note:** Types A, C, D are largely buildable now (procedural + our stack). **Type B (microscope) is asset-bound** — its realism depends on getting good slide images; without them it degrades to labelled diagrams.

---

## 5. Recommended build order (value ÷ asset-dependency)
1. **B8, B9, B10** (Type C data tools) — no assets, high pedagogical value, quick wins.
2. **B1** (annual rings) — fully procedural 3D, satisfying interaction.
3. **B3** (skeleton labelling) — we already have the model; add hotspots.
4. **B11** (food web) — self-contained drag-drop.
5. **B2** (phototropism/geotropism) — procedural plant + animation.
6. **B5** (rabbit repro) — needs a model or a strong diagram fallback.
7. **B4, B6, B7** (microscope) — **last**, once slide images are secured.

Build order also front-loads the **shared `GuideShell`** extraction (step 1) so every later engine reuses it.

---

## 6. Physics Lab (separate future track)
Physics practicals (pendulum, springs/Hooke's law, circuits, optics, refraction, resistivity…) need a **fifth engine**: a real-time **physics-sim + measurement** environment (apparatus, adjustable parameters, live readings, graphing). This is distinct from all four biology engines. **Provide the Physics practical manual** and I'll produce an equivalent plan.

---

## Progress (Biology): 11 / 11 simulated. ✅
- [x] B1 — Annual rings (3D log, click-to-count) → `practical-rings`
- [x] B2 — Phototropism & geotropism (time-lapse seedling, movable light) → `practical-tropism`
- [x] B3 — Skeleton bone labelling (3D `skeleton.glb`, hotspots) → `practical-skeleton`
- [x] B4 — Frog muscle types (microscope, skeletal/smooth/cardiac) → `practical-muscle`
- [x] B5 — Female reproductive system (labelled SVG diagram) → `practical-rabbit`
- [x] B6 — Mammalian ovary histology (microscope, follicle stages) → `practical-ovary`
- [x] B7 — Chick embryo 48 h & 72 h (microscope, labelled stages) → `practical-chick`
- [x] B8 — Gene mixing with dice (1:2:1) → `practical-genetics`
- [x] B9 — Height histogram → `practical-height`
- [x] B10 — Blood-group pie chart → `practical-bloodgroup`
- [x] B11 — Food chains / food web builder → `practical-foodweb`

The microscope trio (B4/B6/B7) uses original SVG histology diagrams via the shared
`_practical/Microscope.tsx` viewer (no licensed micrographs required).

Infrastructure done: Biology catalogue in `constants/labPracticals.ts`, Biology Lab menu (`/student/lab-game/biology`), main lab card enabled, fullscreen routes registered.
