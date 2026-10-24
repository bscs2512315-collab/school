import { normalizeClassLevel } from "@/lib/teacher/class-level";

// Lab practicals catalogue, keyed by subject + class.
// For Class XII practicals, 3D simulations are linked directly.
// For Classes IX, X, XI practicals, dedicated digital lab notebooks and interactive writeups are linked.

export type Practical = {
  id: string;
  title: string;
  objective: string;
  route?: string; // set when simulation or digital journal exists
};

export type LabSubject = "chemistry" | "physics" | "biology";

// =========================================================================
// CLASS IX (SSC-I) PRACTICALS
// =========================================================================

const chemistryIX: Practical[] = [
  { id: "P1", title: "Melting Point of an Organic Solid", objective: "Determine melting point of an organic solid (Naphthalene) using Thiele's tube.", route: "/student/lab-game/practical-ix-melting-point" },
  { id: "P2", title: "Boiling Point of a Liquid", objective: "Determine boiling point of an organic liquid (Ethanol) using micro-ignition tube & oil bath.", route: "/student/lab-game/practical-ix-boiling-point" },
  { id: "P3", title: "Sublimation of Ammonium Chloride", objective: "Separate NH₄Cl from sand mixture by direct thermal sublimation.", route: "/student/lab-game/practical-ix-sublimation" },
  { id: "P4", title: "Preparation of 0.1 M Standard Na₂CO₃", objective: "Prepare 100 cm³ of 0.1 M standard Na₂CO₃ solution accurately in volumetric flask.", route: "/student/lab-game/practical-ix-standard-solution" },
  { id: "P5", title: "Preparation of 0.01 M Dilute Solution", objective: "Prepare 100 cm³ of 0.01 M dilute solution from 0.1 M stock by dilution law.", route: "/student/lab-game/practical-ix-dilution" },
  { id: "P6", title: "Crystallization of Copper Sulfate", objective: "Purify crude copper sulfate by hot filtration and slow crystallization.", route: "/student/lab-game/practical-ix-crystallization" },
  { id: "P7", title: "Separation of Iron Filings and Sand", objective: "Separate heterogeneous mixture of iron filings and sand using magnetic attraction.", route: "/student/lab-game/practical-ix-mixture-separation" },
  { id: "P8", title: "Physical and Chemical Changes", objective: "Differentiate physical changes (CuSO₄ hydration) from chemical changes (Mg burning).", route: "/student/lab-game/practical-ix-physical-chemical-change" },
];

const physicsIX: Practical[] = [
  { id: "P1", title: "Volume of Cylinder by Vernier Callipers", objective: "Measure the diameter and length of a solid cylinder using Vernier callipers.", route: "/student/practical-journals/physics/ix-phy-vernier-caliper" },
  { id: "P2", title: "Cross-sectional Area of Wire by Screw Gauge", objective: "Determine diameter and cross-sectional area of a wire using a micrometer screw gauge.", route: "/student/practical-journals/physics/ix-phy-screw-gauge" },
  { id: "P3", title: "Radius of Curvature by Spherometer", objective: "Determine radius of curvature of a spherical surface using a spherometer.", route: "/student/practical-journals/physics/ix-phy-spherometer" },
  { id: "P4", title: "Acceleration Due to Gravity by Pendulum", objective: "Determine 'g' by plotting an L vs T² graph for a simple pendulum.", route: "/student/practical-journals/physics/ix-phy-simple-pendulum" },
  { id: "P5", title: "Hooke's Law and Spring Constant", objective: "Study relationship between load and extension for a helical spring.", route: "/student/practical-journals/physics/ix-phy-hookes-law" },
  { id: "P6", title: "Parallelogram Law of Forces (Gravesand's)", objective: "Determine the weight of an unknown body using Gravesand's apparatus.", route: "/student/practical-journals/physics/ix-phy-parallelogram-vectors" },
  { id: "P7", title: "Principle of Moments on a Metre Rod", objective: "Verify the Principle of Moments on a balanced metre rod and determine unknown mass.", route: "/student/practical-journals/physics/ix-phy-principle-moments" },
  { id: "P8", title: "Density by Archimedes' Principle", objective: "Determine density of an insoluble solid heavier than water using a measuring cylinder.", route: "/student/practical-journals/physics/ix-phy-archimedes-density" },
];

const biologyIX: Practical[] = [
  { id: "B1", title: "Compound Light Microscope Handling", objective: "Identify structural components and optical pathways of a compound microscope.", route: "/student/practical-journals/biology/ix-bio-compound-microscope" },
  { id: "B2", title: "Onion Epidermal Cells Mount", objective: "Prepare temporary stained mount of onion epidermal peel to study plant cells.", route: "/student/practical-journals/biology/ix-bio-onion-cells" },
  { id: "B3", title: "Human Cheek Epithelial Cells", objective: "Prepare temporary stained mount of buccal epithelial cells to observe animal cells.", route: "/student/practical-journals/biology/ix-bio-cheek-cells" },
  { id: "B4", title: "Osmosis in Potato Osmometer", objective: "Demonstrate endosmosis across living plant cell membranes using a potato osmometer.", route: "/student/practical-journals/biology/ix-bio-osmosis" },
  { id: "B5", title: "Plasmolysis and Deplasmolysis", objective: "Observe protoplast shrinkage in hypertonic NaCl and recovery in water.", route: "/student/practical-journals/biology/ix-bio-plasmolysis" },
  { id: "B6", title: "Iodine Test for Starch", objective: "Perform biochemical iodine test to detect starch in food samples.", route: "/student/practical-journals/biology/ix-bio-starch-test" },
  { id: "B7", title: "Benedict's Test for Reducing Sugars", objective: "Detect reducing sugars through cuprous oxide precipitate formation.", route: "/student/practical-journals/biology/ix-bio-benedicts-test" },
  { id: "B8", title: "Transpiration Rate by Potometer", objective: "Measure rate of foliar water transpiration using a Ganong's potometer.", route: "/student/practical-journals/biology/ix-bio-transpiration" },
];

// =========================================================================
// CLASS X (SSC-II) PRACTICALS
// =========================================================================

const chemistryX: Practical[] = [
  { id: "P1", title: "Standardization of NaOH Solution", objective: "Determine exact molarity of NaOH by titrating against standard 0.1 M oxalic acid with phenolphthalein.", route: "/student/lab-game/practical-x-naoh" },
  { id: "P2", title: "Molarity of HCl with Standard Na₂CO₃", objective: "Determine exact molarity of HCl by titrating against standard 0.1 M Na₂CO₃ with methyl orange.", route: "/student/lab-game/practical-x-hcl" },
  { id: "P3", title: "Determination of pH of Solutions", objective: "Measure the pH of various household and laboratory solutions using pH paper and indicators.", route: "/student/lab-game/practical-x-ph" },
  { id: "P4", title: "Identification & Removal of Water Hardness", objective: "Identify temporary and permanent hardness in water and soften samples by boiling/chemicals.", route: "/student/lab-game/practical-x-water-hardness" },
  { id: "P5", title: "Characteristic Reactions of Acids", objective: "Observe reactions of dilute acids with reactive metals, carbonates, and bases.", route: "/student/lab-game/practical-x-acid-reactions" },
  { id: "P6", title: "Qualitative Identification of Anions", objective: "Identify Cl⁻, SO₄²⁻, and CO₃²⁻ radicals in aqueous salt solutions.", route: "/student/lab-game/practical-x-anions" },
  { id: "P7", title: "Preparation of Copper Sulfate Crystals", objective: "Prepare pure hydrated CuSO₄·5H₂O crystals by reacting CuO with dilute H₂SO₄.", route: "/student/lab-game/practical-x-copper-sulfate" },
];

const physicsX: Practical[] = [
  { id: "P1", title: "Laws of Reflection by Plane Mirror", objective: "Verify the laws of reflection using a plane mirror and optical pins.", route: "/student/practical-journals/physics/x-phy-reflection-mirror" },
  { id: "P2", title: "Focal Length of Concave Mirror", objective: "Determine focal length of a concave mirror by distant object and two-pin methods.", route: "/student/practical-journals/physics/x-phy-concave-mirror" },
  { id: "P3", title: "Refraction and Snell's Law in Glass Slab", objective: "Trace ray through rectangular glass slab and verify Snell's law (sin i / sin r = n).", route: "/student/practical-journals/physics/x-phy-refraction-slab" },
  { id: "P4", title: "Prism Minimum Deviation & Refractive Index", objective: "Determine refractive index of a triangular prism using angle of minimum deviation (Dm).", route: "/student/practical-journals/physics/x-phy-prism-deviation" },
  { id: "P5", title: "Focal Length of Convex Lens", objective: "Determine focal length of a convex lens by two-pin displacement method.", route: "/student/practical-journals/physics/x-phy-convex-lens" },
  { id: "P6", title: "Verification of Ohm's Law", objective: "Verify V = IR and determine resistance of a conductor by plotting V vs I.", route: "/student/practical-journals/physics/x-phy-ohms-law" },
  { id: "P7", title: "Series and Parallel Resistor Combinations", objective: "Verify equivalent resistance formulas for series and parallel circuits.", route: "/student/practical-journals/physics/x-phy-series-parallel" },
  { id: "P8", title: "Digital Logic Gates Truth Tables", objective: "Verify truth tables for AND, OR, NOT, and NAND digital logic gates.", route: "/student/practical-journals/physics/x-phy-logic-gates" },
];

const biologyX: Practical[] = [
  { id: "B1", title: "CO₂ Release in Seed Respiration", objective: "Demonstrate CO₂ gas evolution during aerobic respiration of germinating seeds.", route: "/student/lab-game/practical-x-respiration-co2" },
  { id: "B2", title: "Heat Energy Release in Respiration", objective: "Measure temperature rise from exothermic respiration using vacuum flasks.", route: "/student/lab-game/practical-x-respiration-heat" },
  { id: "B3", title: "Bell Jar Foliar Transpiration", objective: "Demonstrate transpiration in potted plants using a sealed bell jar.", route: "/student/lab-game/practical-x-transpiration-belljar" },
  { id: "B4", title: "Light in Photosynthesis (Starch Test)", objective: "Prove light is essential for photosynthesis using destarched leaves.", route: "/student/lab-game/practical-x-photosynthesis-starch" },
  { id: "B5", title: "Mammalian Kidney Anatomy (L.S.)", objective: "Study longitudinal section of mammalian kidney showing cortex, medulla, and nephrons.", route: "/student/lab-game/practical-x-kidney-anatomy" },
  { id: "B6", title: "Floral Whorls of Brassica", objective: "Dissect complete floral whorls (calyx, corolla, androecium, gynoecium) of Mustard flower.", route: "/student/lab-game/practical-x-flower-whorls" },
  { id: "B7", title: "Mitosis in Onion Root Tip", objective: "Observe successive mitotic stages (Prophase, Metaphase, Anaphase, Telophase).", route: "/student/lab-game/practical-x-mitosis-stages" },
];

// =========================================================================
// CLASS XI (HSSC-I) PRACTICALS
// =========================================================================

const chemistryXI: Practical[] = [
  { id: "P1", title: "Preparation of 0.1 M Standard Oxalic Acid", objective: "Prepare 250 cm³ of 0.1 M primary standard hydrated oxalic acid solution.", route: "/student/lab-game/practical-xi-oxalic-acid" },
  { id: "P2", title: "Standardization of KMnO₄ Solution", objective: "Determine exact molarity of KMnO₄ by redox titration against standard oxalic acid.", route: "/student/lab-game/practical-xi-kmno4" },
  { id: "P3", title: "Percentage of Iron in Mohr's Salt", objective: "Determine percentage of Fe²⁺ in Mohr's salt by KMnO₄ redox titration.", route: "/student/lab-game/practical-xi-mohrs-salt" },
  { id: "P4", title: "Iodometric Standardization of Thiosulphate", objective: "Standardize Na₂S₂O₃ solution by iodometric titration against KIO₃.", route: "/student/lab-game/practical-xi-iodometry" },
  { id: "P5", title: "Heat of Neutralization (HCl + NaOH)", objective: "Determine enthalpy of neutralization (ΔHneut) using a polystyrene calorimeter.", route: "/student/lab-game/practical-xi-heat-neutralization" },
  { id: "P6", title: "Enthalpy of Solution of NH₄Cl", objective: "Determine molar heat of solution of NH₄Cl in water.", route: "/student/lab-game/practical-xi-heat-solution" },
  { id: "P7", title: "Reaction Kinetics (Na₂S₂O₃ + HCl)", objective: "Study the effect of reactant concentration on reaction rate.", route: "/student/lab-game/practical-xi-reaction-kinetics" },
  { id: "P8", title: "Paper Chromatography of Plant Pigments", objective: "Separate leaf chloroplast pigments and calculate Rf values.", route: "/student/lab-game/practical-xi-chromatography" },
];

const physicsXI: Practical[] = [
  { id: "P1", title: "Parallelogram Law of Vectors", objective: "Verify Parallelogram Law of Forces and determine unknown weight using Gravesand's apparatus.", route: "/student/practical-journals/physics/xi-phy-parallelogram-law" },
  { id: "P2", title: "Principle of Moments & Triangle of Forces", objective: "Verify conditions of rotational and translational equilibrium on a meter bar.", route: "/student/practical-journals/physics/xi-phy-moments-triangle-forces" },
  { id: "P3", title: "Free-Fall Acceleration Due to Gravity", objective: "Determine 'g' by measuring time of fall using photo-gate electronic timer.", route: "/student/practical-journals/physics/xi-phy-freefall-g" },
  { id: "P4", title: "Compound (Bar) Pendulum", objective: "Determine 'g' and radius of gyration (k) using a symmetrical bar pendulum.", route: "/student/practical-journals/physics/xi-phy-compound-pendulum" },
  { id: "P5", title: "Dynamic Oscillations of Spiral Spring", objective: "Determine spring constant (k) and unknown mass from dynamic oscillations.", route: "/student/practical-journals/physics/xi-phy-spiral-spring-oscillations" },
  { id: "P6", title: "Young's Modulus by Searle's Apparatus", objective: "Determine Young's Modulus of elasticity (Y) of a metal wire.", route: "/student/practical-journals/physics/xi-phy-youngs-modulus-searle" },
  { id: "P7", title: "Surface Tension by Capillary Rise", objective: "Determine surface tension of water at room temperature by capillary rise method.", route: "/student/practical-journals/physics/xi-phy-surface-tension-capillary" },
  { id: "P8", title: "Velocity of Sound by Resonance Tube", objective: "Determine velocity of sound in air at 0°C using resonance tube and tuning forks.", route: "/student/practical-journals/physics/xi-phy-resonance-tube-sound" },
];

const biologyXI: Practical[] = [
  { id: "B1", title: "Mitosis Squash Mount Preparation", objective: "Prepare acetocarmine squash mount of onion root tip to identify mitotic figures.", route: "/student/practical-journals/biology/xi-bio-mitosis-squash" },
  { id: "B2", title: "Differential Human Blood Smear", objective: "Stain blood smear with Leishman's stain to identify differential WBC types and RBCs.", route: "/student/practical-journals/biology/xi-bio-blood-smear-wbc" },
  { id: "B3", title: "Temperature Effect on Salivary Amylase", objective: "Determine optimum temperature (37°C) for amylase digestion of starch.", route: "/student/practical-journals/biology/xi-bio-amylase-temperature" },
  { id: "B4", title: "pH Effect on Catalase Enzyme", objective: "Study enzyme kinetics of potato catalase decomposing H₂O₂ across pH 3–11.", route: "/student/practical-journals/biology/xi-bio-catalase-ph-substrate" },
  { id: "B5", title: "Macromolecule Biochemical Tests", objective: "Systematic identification of carbohydrates, proteins, and lipids in food extracts.", route: "/student/practical-journals/biology/xi-bio-biochemical-tests-macromolecules" },
  { id: "B6", title: "Chromatography of Chloroplast Pigments", objective: "Separate Chlorophyll a, b, Carotenes, and Xanthophylls on paper strip.", route: "/student/practical-journals/biology/xi-bio-photosynthetic-pigments-chromatography" },
  { id: "B7", title: "Oxygen Evolution in Hydrilla", objective: "Demonstrate light-dependent evolution of O₂ during photosynthesis in aquatic plant.", route: "/student/practical-journals/biology/xi-bio-oxygen-evolution-hydrilla" },
  { id: "B8", title: "Comparative Anatomy of Stems (T.S.)", objective: "Compare vascular bundles in transverse sections of Dicot and Monocot stems.", route: "/student/practical-journals/biology/xi-bio-plant-anatomy-ts-root-stem" },
];

// =========================================================================
// CLASS XII (HSSC-II) PRACTICALS
// =========================================================================

// Class XII (Grade 12) Chemistry practicals.
const chemistryXII: Practical[] = [
  { id: "P1", title: "Detection of Pb²⁺", objective: "Identify lead(II) basic radical in a salt sample by wet tests and a confirmatory test (K₂CrO₄ → yellow ppt).", route: "/student/lab-game/practical-pb" },
  { id: "P2", title: "Detection of Cu²⁺", objective: "Identify copper(II) basic radical; brownish-black CuS with H₂S, blue Cu(OH)₂ with NaOH, chocolate-brown with K₄[Fe(CN)₆].", route: "/student/lab-game/practical-cu" },
  { id: "P3", title: "Detection of Fe³⁺", objective: "Identify iron(III); Group III reddish-brown Fe(OH)₃ with NH₄OH; C.T: Prussian-blue with K₄[Fe(CN)₆].", route: "/student/lab-game/practical-fe" },
  { id: "P4", title: "Detection of Fe²⁺", objective: "Group III iron(II); reddish-brown with NH₄OH; C.T: green with NaOH, white with Na₂CO₃.", route: "/student/lab-game/practical-fe2" },
  { id: "P5", title: "Detection of Al³⁺", objective: "Group III aluminium; white gelatinous Al(OH)₃; C.T: blue lake, white AlPO₄ with Na₃PO₄.", route: "/student/lab-game/practical-al" },
  { id: "P6", title: "Detection of Zn²⁺", objective: "Group IV zinc; greyish-white ZnS; C.T: white Zn(OH)₂ soluble in excess NaOH / NH₄OH.", route: "/student/lab-game/practical-zn" },
  { id: "P7", title: "Detection of Ni²⁺", objective: "Group IV nickel; black NiS; C.T: light-green Ni(OH)₂ with NaOH.", route: "/student/lab-game/practical-ni" },
  { id: "P8", title: "Detection of Co²⁺", objective: "Group IV cobalt; black CoS; C.T: blue Co(OH)₂ with NaOH.", route: "/student/lab-game/practical-co" },
  { id: "P9", title: "Detection of Ba²⁺", objective: "Group V barium; white BaCO₃; C.T: yellow BaCrO₄ with K₂CrO₄, white BaSO₄ with H₂SO₄.", route: "/student/lab-game/practical-ba" },
  { id: "P10", title: "Detection of Ca²⁺", objective: "Group V calcium; white CaCO₃; C.T: white with Na₂CO₃ and with dil. H₂SO₄.", route: "/student/lab-game/practical-ca" },
  { id: "P11", title: "Detection of Mg²⁺", objective: "Group VI magnesium; C.T: white MgCO₃ with Na₂CO₃, white Mg(OH)₂ with NaOH.", route: "/student/lab-game/practical-mg" },
  { id: "P12", title: "Detection of NH₄⁺", objective: "Group VI ammonium; smell of ammonia; C.T: brown with Nessler's, NH₃ on heating with Na₂CO₃.", route: "/student/lab-game/practical-nh4" },
  { id: "P13", title: "Detection of CO₃²⁻", objective: "Dilute-acid group; CO₂ effervescence, lime water milky; C.T: white BaCO₃/MgCO₃.", route: "/student/lab-game/practical-co3" },
  { id: "P14", title: "Detection of SO₃²⁻", objective: "Dilute-acid group; pungent gas turns K₂Cr₂O₇ green; C.T: discharges bromine & KMnO₄.", route: "/student/lab-game/practical-so3" },
  { id: "P15", title: "Detection of NO₂⁻", objective: "Dilute-acid group; brown fumes, FeSO₄ black; C.T: brown I₂ with KI, white AgNO₂.", route: "/student/lab-game/practical-no2" },
  { id: "P16", title: "Detection of Cl⁻", objective: "Conc.-acid group; white fumes with NH₄OH rod; C.T: white AgCl, chromyl-chloride yellow.", route: "/student/lab-game/practical-cl" },
  { id: "P17", title: "Detection of Br⁻", objective: "Conc.-acid group; reddish-brown gas, no FeSO₄ blackening; C.T: CS₂ orange-red, light-yellow AgBr.", route: "/student/lab-game/practical-br" },
  { id: "P18", title: "Detection of I⁻", objective: "Conc.-acid group; violet fumes, starch blue; C.T: CS₂ violet, deep-yellow AgI.", route: "/student/lab-game/practical-i" },
  { id: "P19", title: "Detection of NO₃⁻", objective: "Conc.-acid group; FeSO₄ black; C.T: brown-ring test.", route: "/student/lab-game/practical-no3" },
  { id: "P20", title: "Detection of C₂O₄²⁻", objective: "Conc.-acid group; gas turns lime water milky; C.T: white Ag₂C₂O₄ & BaC₂O₄.", route: "/student/lab-game/practical-c2o4" },
  { id: "P21", title: "Detection of SO₄²⁻", objective: "Special group; white BaSO₄ insoluble in conc. HNO₃; C.T: white PbSO₄.", route: "/student/lab-game/practical-so4" },
  { id: "P22", title: "Detection of CrO₄²⁻", objective: "Dilute-acid group; orange with H₂SO₄; C.T: yellow BaCrO₄, red Ag₂CrO₄.", route: "/student/lab-game/practical-cro4" },
  { id: "P23", title: "Identify the phenol group", objective: "—COOH absent (no CO₂); green/blue/violet colour with neutral FeCl₃.", route: "/student/lab-game/practical-phenol" },
  { id: "P24", title: "Identify aldehyde / ketone", objective: "—COOH absent; silver mirror with Tollens', brick-red Cu₂O with Fehling's.", route: "/student/lab-game/practical-aldehyde" },
  { id: "P25", title: "Identify carboxylic acid", objective: "–COOH; CO₂ effervescence turns lime water milky; buff ppt with neutral FeCl₃.", route: "/student/lab-game/practical-cooh" },
  { id: "P26", title: "Starch / amylase digestion", objective: "Iodine → blue-black with starch; no colour after amylase digestion.", route: "/student/lab-game/practical-starch" },
  { id: "P27", title: "Detect glucose as a reducing sugar", objective: "Fehling's / Benedict's test → brick-red Cu₂O precipitate on warming.", route: "/student/lab-game/practical-glucose" },
  { id: "P28", title: "Protein denaturation", objective: "Egg-white coagulates on heating; urea denatures it (no coagulation).", route: "/student/lab-game/practical-protein" },
];

// Class XII Biology practicals (AKUEB Biology Practical Manual).
const biologyXII: Practical[] = [
  { id: "B1", title: "Locate annual rings in a tree log", objective: "Count annual growth rings in a tree stem cross-section to estimate its age.", route: "/student/lab-game/practical-rings" },
  { id: "B2", title: "Phototropism & geotropism", objective: "Observe shoots bending toward light and roots bending down with gravity.", route: "/student/lab-game/practical-tropism" },
  { id: "B3", title: "Bones of girdles & limbs", objective: "Identify pectoral/pelvic girdle, arm and leg bones on a 3D skeleton.", route: "/student/lab-game/practical-skeleton" },
  { id: "B4", title: "Frog muscle slides", objective: "Distinguish skeletal, smooth and cardiac muscle under the microscope.", route: "/student/lab-game/practical-muscle" },
  { id: "B5", title: "Female rabbit reproductive system", objective: "Identify ovary, oviduct, uterus, cervix and vagina on a model.", route: "/student/lab-game/practical-rabbit" },
  { id: "B6", title: "Mammalian ovary histology", objective: "Identify primary, secondary and Graafian follicles under the microscope.", route: "/student/lab-game/practical-ovary" },
  { id: "B7", title: "Chick embryo stages (48 h & 72 h)", objective: "Identify key structures in 48-hour and 72-hour chick embryos.", route: "/student/lab-game/practical-chick" },
  { id: "B8", title: "Gene mixing with dice", objective: "Simulate random gamete fusion and watch the 1:2:1 genotype ratio emerge.", route: "/student/lab-game/practical-genetics" },
  { id: "B9", title: "Continuous variation — height", objective: "Measure class heights and build a histogram showing a bell-shaped distribution.", route: "/student/lab-game/practical-height" },
  { id: "B10", title: "Blood-group survey & pie chart", objective: "Collect A/B/AB/O data and construct a pie chart of the distribution.", route: "/student/lab-game/practical-bloodgroup" },
  { id: "B11", title: "Food chains & food web", objective: "Classify organisms into trophic levels and trace energy flow through a food chain.", route: "/student/lab-game/practical-foodweb" },
];

// Class XII Physics practicals (AKUEB Physics XII practical journal).
const physicsXII: Practical[] = [
  { id: "P1", title: "Coefficient of linear expansion", objective: "Pass steam through a rod in Pullinger's apparatus; from ΔL, L₀ and ΔT find the linear expansivity α.", route: "/student/lab-game/practical-expansion" },
  { id: "P2", title: "Verify Newton's law of cooling", objective: "Log the temperature of cooling water over time and show the cooling rate is proportional to the excess temperature.", route: "/student/lab-game/practical-cooling" },
  { id: "P3", title: "Resistance of a voltmeter", objective: "Using a cell and known series resistances, deduce the internal resistance of a voltmeter.", route: "/student/lab-game/practical-voltmeter" },
  { id: "P4", title: "Galvanometer resistance (half-deflection)", objective: "Find a galvanometer's resistance by the half-deflection method using a series resistance and a shunt.", route: "/student/lab-game/practical-galvanometer" },
  { id: "P5", title: "Pressure coefficient of air", objective: "Heat air at constant volume and plot pressure against temperature to find the pressure coefficient (≈ 1/273 K⁻¹).", route: "/student/lab-game/practical-gas-pressure" },
  { id: "P6", title: "I–V of a tungsten filament lamp", objective: "Vary the applied voltage and read the current to plot the non-ohmic I–V characteristic of a filament lamp.", route: "/student/lab-game/practical-iv-lamp" },
  { id: "P7", title: "Mechanical equivalent of heat, J", objective: "Heat water electrically and compare electrical energy (VIt) with heat gained (mcΔT) to find J.", route: "/student/lab-game/practical-joule" },
  { id: "P8", title: "Specific heat capacity of a liquid", objective: "Use an electrical calorimeter to find the specific heat capacity of a liquid from VIt and its temperature rise.", route: "/student/lab-game/practical-specific-heat" },
];

export const LAB_PRACTICALS: Record<LabSubject, Record<string, Practical[]>> = {
  chemistry: {
    IX: chemistryIX,
    X: chemistryX,
    XI: chemistryXI,
    XII: chemistryXII,
  },
  physics: {
    IX: physicsIX,
    X: physicsX,
    XI: physicsXI,
    XII: physicsXII,
  },
  biology: {
    IX: biologyIX,
    X: biologyX,
    XI: biologyXI,
    XII: biologyXII,
  },
};

export function getPracticals(subject: LabSubject, cls?: string | null): Practical[] {
  const normalized = normalizeClassLevel(cls) || "XII";
  const subjectMap = LAB_PRACTICALS[subject];
  if (!subjectMap) return [];
  return subjectMap[normalized] || subjectMap["XII"] || Object.values(subjectMap)[0] || [];
}

export function getAllLabPracticals(cls?: string | null): (Practical & { subject: LabSubject; classLevel: string; expNo: number })[] {
  const normalized = cls ? normalizeClassLevel(cls) : "XII";
  const subjects: LabSubject[] = ["chemistry", "physics", "biology"];
  const classes = ["IX", "X", "XI", "XII"];
  const all: (Practical & { subject: LabSubject; classLevel: string; expNo: number })[] = [];

  for (const sub of subjects) {
    for (const c of classes) {
      if (!cls || cls === "all" || normalized === c) {
        const practicals = LAB_PRACTICALS[sub]?.[c] || [];
        practicals.forEach((p, idx) => {
          all.push({ ...p, subject: sub, classLevel: c, expNo: idx + 1 });
        });
      }
    }
  }
  return all;
}
