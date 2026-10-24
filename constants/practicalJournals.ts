// Practical Journals Content Catalog for Classes IX, X, XI, and XII
// Aligned with the official AKUEB Practical Syllabi (Annex A) and National Curriculum.
// Used by the standalone "Practical Journals" section and virtual lab modules.

export type PracticalSubject = "physics" | "chemistry" | "biology" | "computer-science";
export type ClassLevel = "IX" | "X" | "XI" | "XII";

export interface ObservationTableColumn {
  key: string;
  label: string;
  unit?: string;
}

export interface ObservationTableData {
  title?: string;
  columns: ObservationTableColumn[];
  rows?: Record<string, string | number>[];
  note?: string;
}

export type JournalTable = {
  title?: string;
  head: string[];
  rows: (string | number)[][];
  note?: string;
};

export type JournalObservations = {
  parameters?: { label: string; value: string }[];
  tables?: JournalTable[];
  notes?: string[];
};

export type JournalCalculation = {
  formula?: string;
  steps: string[];
  finalValue?: string;
};

export type JournalContent = {
  id: string; // route slug used by the standalone viewer
  expNo: number;
  subject: PracticalSubject;
  classLevel: ClassLevel;
  board: string;
  title: string;
  object: string;
  apparatus: string;
  formula?: string;
  theory: string[]; // paragraphs (formulas included as standalone paragraphs)
  method: string[];
  observationTable?: ObservationTableData;
  observations?: JournalObservations;
  calculation?: string[] | JournalCalculation;
  result: string;
  errors: string[];
  precautions?: string[];
  playRoute?: string; // in-game virtual practical link if available
};

const STD_PHYSICS_ERRORS = [
  "Zero error of measuring instruments (Vernier calliper, micrometer screw gauge) not corrected.",
  "Parallax error when taking readings on metric scales and analog meters.",
  "Friction at the pulley or air draught affecting moving bodies.",
  "Temperature and environmental fluctuations during the experiment.",
  "Personal timing and judgment limitations.",
];

const STD_CHEM_ERRORS = [
  "Reagents may not be freshly prepared or could be contaminated.",
  "Incomplete washing of precipitate before performing confirmatory tests.",
  "Overheating or rapid boiling leading to loss of volatile components.",
  "Parallax error when reading the meniscus on the burette or measuring cylinder.",
  "Drop of solution remaining on the tip of the burette / pipette.",
];

const STD_BIO_ERRORS = [
  "Air bubbles trapped beneath the coverslip obscuring microscopic view.",
  "Over-staining or under-staining of cell specimens.",
  "Dehydration of temporary mount tissue during prolonged examination.",
  "Non-uniform lighting and improper adjustment of the condenser.",
  "Variability in biological specimens.",
];

const STD_CS_ERRORS = [
  "Syntax or indentation errors in source code.",
  "Data type mismatch and unhandled boundary cases in user inputs.",
  "Uncommitted database transactions leading to data inconsistency.",
  "Permission errors when executing filesystem or network commands.",
  "Logical errors in conditional loops and sorting passes.",
];

// ==========================================

// CLASS IX PRACTICALS

// ==========================================

export const PHYSICS_IX: JournalContent[] = [
  {
    "id": "ix-phy-vernier-caliper",
    "expNo": 1,
    "subject": "physics",
    "classLevel": "IX",
    "board": "AKUEB",
    "title": "Volume of a Solid Cylinder by Vernier Callipers",
    "object": "To determine the volume of a solid cylinder using Vernier callipers.",
    "apparatus": "Vernier callipers, given solid metal cylinder, magnifying glass.",
    "formula": "V = (π / 4) × d² × L",
    "theory": [
      "The least count (Vernier constant) is the difference between one main scale division and one Vernier scale division:",
      "Least Count (L.C.) = Smallest division on main scale / Total number of Vernier divisions",
      "Volume of a cylinder is given by: V = π × (d/2)² × L = (π / 4) × d² × L",
      "where d is the corrected diameter and L is the corrected length of the cylinder."
    ],
    "method": [
      "Determine the least count and zero error of the Vernier callipers.",
      "Gently grip the cylinder along its length between the lower jaws and note the main scale and Vernier coincidences.",
      "Repeat the length measurement at three different orientations.",
      "Measure the diameter of the cylinder at three different perpendicular positions.",
      "Apply zero correction, calculate mean length and diameter, and compute the volume."
    ],
    "observationTable": {
      "title": "Observations for Length and Diameter",
      "columns": [
        {
          "key": "obs",
          "label": "Obs. #"
        },
        {
          "key": "msr",
          "label": "Main Scale (MSR)",
          "unit": "cm"
        },
        {
          "key": "vsc",
          "label": "Vernier Div (VSC)"
        },
        {
          "key": "total",
          "label": "Total Reading",
          "unit": "cm"
        }
      ],
      "rows": [
        {
          "obs": 1,
          "msr": "4.5",
          "vsc": "3",
          "total": "4.53"
        },
        {
          "obs": 2,
          "msr": "4.5",
          "vsc": "4",
          "total": "4.54"
        },
        {
          "obs": 3,
          "msr": "4.5",
          "vsc": "3",
          "total": "4.53"
        }
      ]
    },
    "calculation": [
      "Mean Length (L) = (4.53 + 4.54 + 4.53) / 3 = 4.533 cm",
      "Mean Diameter (d) = 2.140 cm",
      "Volume V = (π / 4) × (2.140)² × 4.533 ≈ 16.31 cm³"
    ],
    "result": "The volume of the given solid cylinder is found to be 16.31 cm³.",
    "errors": STD_PHYSICS_ERRORS,
    "playRoute": "/student/lab-game/physics"
  },
  {
    "id": "ix-phy-screw-gauge",
    "expNo": 2,
    "subject": "physics",
    "classLevel": "IX",
    "board": "AKUEB",
    "title": "Cross-sectional Area of a Wire by Micrometer Screw Gauge",
    "object": "To determine the diameter and cross-sectional area of a wire using a micrometer screw gauge.",
    "apparatus": "Micrometer screw gauge, given metal wire, half-metre scale.",
    "formula": "A = (π / 4) × d²",
    "theory": [
      "Pitch of the screw gauge = Distance moved along linear scale / Number of complete rotations",
      "Least Count (L.C.) = Pitch / Total circular scale divisions",
      "Area of cross-section of wire of diameter d is: A = π × (d / 2)² = (π / 4) × d²"
    ],
    "method": [
      "Find the pitch and least count of the screw gauge and note any zero error.",
      "Place the wire between the stud and spindle and turn the ratchet until it clicks.",
      "Record the linear scale reading and circular scale division.",
      "Repeat the diameter measurement at several points along the wire and in two mutually perpendicular directions.",
      "Apply zero correction, calculate mean diameter, and compute the cross-sectional area."
    ],
    "result": "The cross-sectional area of the given wire is 0.785 mm².",
    "errors": STD_PHYSICS_ERRORS,
    "playRoute": "/student/lab-game/physics"
  },
  {
    "id": "ix-phy-spherometer",
    "expNo": 3,
    "subject": "physics",
    "classLevel": "IX",
    "board": "AKUEB",
    "title": "Radius of Curvature of a Spherical Surface by Spherometer",
    "object": "To determine the radius of curvature of a given convex/concave spherical surface using a spherometer.",
    "apparatus": "Spherometer, given convex mirror / spherical surface, plane glass slab, millimetre graph paper.",
    "formula": "R = (a² / 6h) + (h / 2)",
    "theory": [
      "The spherometer consists of three outer legs forming an equilateral triangle of side 'a' and a central screw.",
      "If 'h' is the height / sagitta of the spherical surface above the plane, the radius of curvature R is: R = (a² / 6h) + (h / 2)."
    ],
    "method": [
      "Press the spherometer legs onto a sheet of paper to measure the distance 'a' between the three outer legs.",
      "Place the spherometer on a flat glass plate and rotate the central screw until its tip just touches the surface; note zero reading.",
      "Place the spherometer on the convex surface and rotate the central screw until it touches; record the sagitta 'h'.",
      "Repeat readings three times and calculate the mean radius of curvature R."
    ],
    "result": "The radius of curvature of the given spherical surface is R = 15.24 cm.",
    "errors": STD_PHYSICS_ERRORS,
    "playRoute": "/student/lab-game/physics"
  },
  {
    "id": "ix-phy-simple-pendulum",
    "expNo": 4,
    "subject": "physics",
    "classLevel": "IX",
    "board": "AKUEB",
    "title": "Acceleration Due to Gravity (g) Using a Simple Pendulum",
    "object": "To determine the value of 'g' by plotting an L vs T² graph for a simple pendulum.",
    "apparatus": "Metallic bob with hook, inextensible light string, split cork, retort stand with clamp, stop-watch, vernier callipers, metre rule.",
    "formula": "g = 4π² × (L / T²)",
    "theory": [
      "For small angular displacements, the time period T of a simple pendulum is: T = 2π × √(L / g) ⇒ T² = (4π² / g) × L.",
      "Hence, g = 4π² × (L / T²) = 4π² / (Slope of T² vs L graph), where L is effective length."
    ],
    "method": [
      "Measure the radius of the bob using Vernier callipers.",
      "Set effective length L to 60 cm. Clamp the string firmly between cork pieces.",
      "Displace the bob slightly (angle < 5°) and let it oscillate in a single plane.",
      "Start the stopwatch and record the time for 20 complete vibrations; calculate time period T.",
      "Repeat for lengths 70 cm, 80 cm, 90 cm, and 100 cm.",
      "Plot a graph of L (x-axis) vs T² (y-axis) and calculate g from the slope."
    ],
    "result": "The acceleration due to gravity 'g' is determined to be 9.80 m/s².",
    "errors": STD_PHYSICS_ERRORS,
    "playRoute": "/student/lab-game/physics"
  },
  {
    "id": "ix-phy-hookes-law",
    "expNo": 5,
    "subject": "physics",
    "classLevel": "IX",
    "board": "AKUEB",
    "title": "Verification of Hooke's Law and Spring Constant",
    "object": "To study the relationship between load and extension for a helical spring and determine its spring constant.",
    "apparatus": "Helical spring, vertical stand with scale, pointer, slotted weights (50g each) with hanger.",
    "formula": "F = k × x ⇒ k = (m × g) / x",
    "theory": [
      "Hooke's Law states that within elastic limit, extension x is directly proportional to the applied force F: F = k × x.",
      "Spring constant k = (m·g) / x = g / (Slope of x vs m graph)."
    ],
    "method": [
      "Suspend the spring vertically and attach the pointer and empty hanger; note initial pointer reading.",
      "Add 50 g weight to the hanger, wait for oscillations to stop, and note the reading.",
      "Add weights in steps of 50 g up to 250 g and record extension during loading.",
      "Unload weights in steps and note pointer readings during unloading; take mean extension.",
      "Plot a graph of Load (F) vs Extension (x) to find spring constant k."
    ],
    "result": "The extension is directly proportional to load, verifying Hooke's law. Spring constant k = 24.5 N/m.",
    "errors": STD_PHYSICS_ERRORS,
    "playRoute": "/student/lab-game/physics"
  },
  {
    "id": "ix-phy-parallelogram-vectors",
    "expNo": 6,
    "subject": "physics",
    "classLevel": "IX",
    "board": "AKUEB",
    "title": "Determination of Unknown Weight by Parallelogram Law of Forces",
    "object": "To determine the weight of an unknown body using Gravesand's apparatus (Parallelogram Law of Vectors).",
    "apparatus": "Gravesand's apparatus, drawing paper, drawing pins, slotted weights, unknown weight, mirror strip, thread.",
    "formula": "R = √(P² + Q² + 2PQ cos θ)",
    "theory": [
      "According to the Parallelogram Law of Forces, if two forces P and Q acting at a point are represented by adjacent sides of a parallelogram, their resultant R is represented by the diagonal passing through that point.",
      "At equilibrium: Unknown Weight W = Resultant of known forces P and Q = R."
    ],
    "method": [
      "Fix drawing paper on the board. Pass thread with weights P and Q over pulleys and suspend unknown weight W in the middle.",
      "Ensure junction O hangs freely. Mark directions of threads using a plane mirror strip.",
      "Choose a suitable scale (e.g. 50 g = 1 cm), construct vectors OA and OB representing P and Q, and complete parallelogram OACB.",
      "Measure diagonal OC and multiply by scale factor to find unknown weight W."
    ],
    "result": "The weight of the unknown body is determined to be 147.2 g (1.44 N).",
    "errors": STD_PHYSICS_ERRORS,
    "playRoute": "/student/lab-game/physics"
  },
  {
    "id": "ix-phy-principle-moments",
    "expNo": 7,
    "subject": "physics",
    "classLevel": "IX",
    "board": "AKUEB",
    "title": "Verification of the Principle of Moments on a Metre Rod",
    "object": "To verify the Principle of Moments using a uniform metre rod balanced on a knife edge and determine the mass of an unknown body.",
    "apparatus": "Uniform metre rod, sharp knife edge with stand, known slotted weights (50g, 100g), unknown mass, thread loops.",
    "formula": "m₁ × d₁ = m₂ × d₂",
    "theory": [
      "The Principle of Moments states that for a body in rotational equilibrium: Clockwise Moment = Anticlockwise Moment ⇒ m₁ × g × d₁ = m₂ × g × d₂.",
      "Hence: Unknown mass m₂ = (m₁ × d₁) / d₂."
    ],
    "method": [
      "Balance the metre rod on the knife edge to locate its centre of gravity.",
      "Suspend known mass m₁ at distance d₁ from the knife edge.",
      "Suspend unknown mass m₂ on the opposite side and adjust distance d₂ until the rod balances horizontally.",
      "Repeat for three different positions and calculate the average unknown mass."
    ],
    "result": "Principle of moments verified: Total Clockwise Moments = Total Anticlockwise Moments. Unknown mass = 75.0 g.",
    "errors": STD_PHYSICS_ERRORS,
    "playRoute": "/student/lab-game/physics"
  },
  {
    "id": "ix-phy-archimedes-density",
    "expNo": 8,
    "subject": "physics",
    "classLevel": "IX",
    "board": "AKUEB",
    "title": "Density of an Insoluble Solid by Archimedes' Principle",
    "object": "To determine the density of an insoluble irregular solid heavier than water using a physical balance and measuring cylinder.",
    "apparatus": "Physical balance, weight box, graduated measuring cylinder, insoluble stone / metal piece, water, fine thread.",
    "formula": "Density ρ = Mass / Volume = m / (V₂ − V₁)",
    "theory": [
      "Archimedes' Principle states that when a body is completely immersed in a fluid, it experiences an upthrust equal to the weight of fluid displaced.",
      "Volume of submerged body V = V₂ − V₁. Density ρ = m / V = m / (V₂ − V₁)."
    ],
    "method": [
      "Weigh the dry irregular solid on the balance and record its mass m.",
      "Pour water into the graduated cylinder up to half capacity and note initial volume V₁.",
      "Immerse the solid completely into the water using a fine thread; record elevated water volume V₂.",
      "Calculate displaced volume V = V₂ − V₁ and compute density ρ = m / V."
    ],
    "result": "The density of the given irregular solid is determined to be 2.70 g/cm³ (Aluminium).",
    "errors": STD_PHYSICS_ERRORS,
    "playRoute": "/student/lab-game/physics"
  }
];

export const CHEMISTRY_IX: JournalContent[] = [
  {
    "id": "ix-chem-melting-point",
    "expNo": 1,
    "subject": "chemistry",
    "classLevel": "IX",
    "board": "AKUEB",
    "title": "Determination of Melting Point of an Organic Solid",
    "object": "To determine the melting point of a given organic solid (e.g. Naphthalene / Benzoic Acid).",
    "apparatus": "Thiele's tube or beaker, laboratory thermometer (0-200°C), capillary tube, Bunsen burner, liquid paraffin (oil bath), stirrer, thread/rubber band.",
    "theory": [
      "The melting point of a pure solid is the constant temperature at which solid and liquid phases coexist at 1 atmospheric pressure.",
      "Pure organic compounds possess sharp, characteristic melting points. Impurities lower the melting point and broaden the melting range."
    ],
    "method": [
      "Seal one end of a fine capillary tube by rotating in a Bunsen flame.",
      "Fill the capillary tube with finely powdered dry organic substance up to 2-3 mm height.",
      "Attach the capillary tube to the thermometer bulb using a small rubber ring.",
      "Immerse the thermometer bulb into the oil bath and heat the side arm of Thiele's tube gently.",
      "Note the temperature T₁ when the substance starts melting and T₂ when it completely liquefies; take the average."
    ],
    "result": "The melting point of the given organic solid is found to be 80.5 °C (Naphthalene).",
    "errors": STD_CHEM_ERRORS,
    "playRoute": "/student/lab-game/practical-ix-melting-point"
  },
  {
    "id": "ix-chem-boiling-point",
    "expNo": 2,
    "subject": "chemistry",
    "classLevel": "IX",
    "board": "AKUEB",
    "title": "Determination of Boiling Point of a Liquid",
    "object": "To determine the boiling point of a given organic liquid (e.g. Ethanol / Ethyl Alcohol).",
    "apparatus": "Fusion tube, capillary tube, 0-100°C thermometer, Thiele's tube / liquid paraffin bath, Bunsen burner, iron stand with clamp.",
    "theory": [
      "The boiling point of a liquid is the temperature at which its saturated vapour pressure equals the prevailing atmospheric pressure.",
      "At boiling point, bubbles of vapour form rapidly throughout the bulk of the liquid."
    ],
    "method": [
      "Place 2-3 drops of ethanol into a small ignition/fusion tube.",
      "Take a thin capillary tube sealed at one end, invert it into the fusion tube so the open end dips into the liquid.",
      "Attach the fusion tube to the thermometer bulb with a rubber band and immerse in oil bath.",
      "Heat slowly until a rapid, continuous stream of bubbles escapes from the open end of the inverted capillary.",
      "Stop heating; the exact temperature when bubbling ceases and liquid enters the capillary is the boiling point."
    ],
    "result": "The boiling point of the given organic liquid is determined to be 78.2 °C (Ethanol).",
    "errors": STD_CHEM_ERRORS,
    "playRoute": "/student/lab-game/practical-ix-boiling-point"
  },
  {
    "id": "ix-chem-sublimation",
    "expNo": 3,
    "subject": "chemistry",
    "classLevel": "IX",
    "board": "AKUEB",
    "title": "Separation of Ammonium Chloride from Sand by Sublimation",
    "object": "To separate ammonium chloride (NH₄Cl) from a mixture with sand (SiO₂) using sublimation.",
    "apparatus": "China dish, glass funnel, cotton plug, tripod stand, wire gauze, Bunsen burner, spatula, sand + NH₄Cl mixture.",
    "theory": [
      "Sublimation is the direct transition of a solid substance to the vapour phase on heating without passing through an intermediate liquid state.",
      "Ammonium chloride sublimes at 340 °C: NH₄Cl(s) ⇌ NH₃(g) + HCl(g) ⇌ NH₄Cl(sublimate), while sand remains unaffected."
    ],
    "method": [
      "Place the dry mixture of sand and ammonium chloride into a clean china dish.",
      "Invert a glass funnel over the china dish and plug the stem opening with moist cotton.",
      "Heat the china dish slowly on a wire gauze with a low Bunsen flame.",
      "Observe white vapours of NH₄Cl rising and condensing on the cool inner walls of the funnel as pure solid sublimate.",
      "After heating ceases, scrape the pure ammonium chloride crystals off the funnel walls."
    ],
    "result": "Ammonium chloride was completely separated from sand as a pure white sublimate.",
    "errors": STD_CHEM_ERRORS,
    "playRoute": "/student/lab-game/practical-ix-sublimation"
  },
  {
    "id": "ix-chem-standard-solution",
    "expNo": 4,
    "subject": "chemistry",
    "classLevel": "IX",
    "board": "AKUEB",
    "title": "Preparation of 0.1 M Standard Sodium Carbonate Solution",
    "object": "To prepare 100 cm³ of 0.1 M standard Sodium Carbonate (Na₂CO₃) solution.",
    "apparatus": "100 cm³ volumetric measuring flask, analytical balance, weight box, watch glass, beaker, wash bottle, glass funnel, anhydrous Na₂CO₃.",
    "formula": "Mass (g) = Molarity × Molar Mass × Volume (dm³) = 0.1 × 106 × (100 / 1000) = 1.06 g",
    "theory": [
      "A standard solution is a solution of accurately known concentration.",
      "Molarity (M) = (Mass of solute in grams / Molar mass of solute) × (1000 / Volume of solution in cm³)",
      "Molar mass of anhydrous Na₂CO₃ = 106 g/mol.",
      "Required mass for 100 cm³ of 0.1 M solution = 0.1 × 106 × 0.1 = 1.06 g."
    ],
    "method": [
      "Weigh exactly 1.06 g of pure, dry anhydrous Na₂CO₃ on a watch glass using the chemical balance.",
      "Transfer the salt into a 100 cm³ beaker, dissolve in about 40 cm³ of distilled water using a glass rod.",
      "Transfer the solution quantitatively into a 100 cm³ volumetric flask using a funnel.",
      "Rinse the beaker and funnel several times with small portions of distilled water, pouring rinsings into the flask.",
      "Add distilled water dropwise until the lower meniscus touches the 100 cm³ calibration mark. Stopper and invert to mix uniformly."
    ],
    "result": "100 cm³ of 0.1 M standard Na₂CO₃ solution was successfully prepared.",
    "errors": STD_CHEM_ERRORS,
    "playRoute": "/student/lab-game/practical-ix-standard-solution"
  },
  {
    "id": "ix-chem-dilution",
    "expNo": 5,
    "subject": "chemistry",
    "classLevel": "IX",
    "board": "AKUEB",
    "title": "Preparation of 0.01 M Dilute Solution from 0.1 M Stock Solution",
    "object": "To prepare 100 cm³ of 0.01 M dilute solution from given 0.1 M stock solution of Na₂CO₃.",
    "apparatus": "10 cm³ graduated pipette, 100 cm³ volumetric flask, wash bottle, distilled water, 0.1 M stock solution.",
    "formula": "M₁ × V₁ = M₂ × V₂",
    "theory": [
      "According to the Dilution Law: M₁ × V₁ = M₂ × V₂",
      "where M₁ is stock concentration (0.1 M), V₁ is required stock volume, M₂ is desired concentration (0.01 M), and V₂ is final volume (100 cm³).",
      "V₁ = (M₂ × V₂) / M₁ = (0.01 × 100) / 0.1 = 10.0 cm³."
    ],
    "method": [
      "Rinse the 10 cm³ pipette with a small portion of the 0.1 M stock solution.",
      "Pipette out exactly 10.0 cm³ of the stock solution and transfer into a clean 100 cm³ volumetric flask.",
      "Add distilled water gradually until the solution level approaches near the graduation mark.",
      "Use a dropper to add distilled water dropwise until the bottom of the meniscus aligns exactly with the 100 cm³ mark.",
      "Stopper the flask and invert several times to achieve thorough mixing."
    ],
    "result": "100 cm³ of 0.01 M dilute Na₂CO₃ solution prepared accurately by volumetric dilution.",
    "errors": STD_CHEM_ERRORS,
    "playRoute": "/student/lab-game/practical-ix-dilution"
  },
  {
    "id": "ix-chem-crystallization",
    "expNo": 6,
    "subject": "chemistry",
    "classLevel": "IX",
    "board": "AKUEB",
    "title": "Purification of Impure Copper Sulfate by Crystallization",
    "object": "To purify a given sample of crude copper sulfate (CuSO₄·5H₂O) by crystallization.",
    "apparatus": "Beaker, china dish, glass funnel, filter paper, tripod stand, wire gauze, Bunsen burner, glass rod, crude copper sulfate, dil. H₂SO₄.",
    "theory": [
      "Crystallization is a separation technique based on the difference in solubility of a substance at different temperatures.",
      "A saturated solution prepared at higher temperature deposits pure crystals of the solute as it cools, while soluble impurities remain in the mother liquor."
    ],
    "method": [
      "Dissolve about 15 g of crude copper sulfate in 50 cm³ of distilled water in a beaker, adding 2-3 drops of dil. H₂SO₄ to prevent hydrolysis.",
      "Heat and stir until a hot concentrated solution is formed; filter the hot solution to remove insoluble impurities.",
      "Transfer the filtrate to a china dish and heat until crystallization point is reached.",
      "Cover the china dish with filter paper and allow it to cool undisturbed overnight.",
      "Decant the mother liquor, collect the bright blue crystals of CuSO₄·5H₂O, and dry them between folds of filter paper."
    ],
    "result": "Pure, deep blue crystalline copper sulfate (CuSO₄·5H₂O) crystals were obtained.",
    "errors": STD_CHEM_ERRORS,
    "playRoute": "/student/lab-game/practical-ix-crystallization"
  },
  {
    "id": "ix-chem-mixture-separation",
    "expNo": 7,
    "subject": "chemistry",
    "classLevel": "IX",
    "board": "AKUEB",
    "title": "Separation of Iron Filings and Sand Mixture",
    "object": "To separate a heterogeneous mixture of iron filings and sand using magnetic attraction and solvent extraction.",
    "apparatus": "Bar magnet, watch glass, petri dish, filter paper, mixture of iron filings and silica sand.",
    "theory": [
      "Heterogeneous mixtures can be separated using physical properties of their constituents without altering chemical composition.",
      "Iron is ferromagnetic and strongly attracted by a magnetic field, whereas silica sand (SiO₂) is non-magnetic."
    ],
    "method": [
      "Spread the dry mixture evenly on a clean sheet of paper or watch glass.",
      "Wrap a strong bar magnet in a plastic wrap / filter paper sheet to facilitate easy collection of iron particles.",
      "Pass the wrapped magnet slowly across the mixture several times.",
      "Remove the magnet away from the mixture, take off the plastic wrap, and release the iron filings into a separate container.",
      "Repeat the magnetic sweep until no more iron particles are attracted from the sand residue."
    ],
    "result": "Iron filings and sand were completely separated based on magnetic properties.",
    "errors": STD_CHEM_ERRORS,
    "playRoute": "/student/lab-game/practical-ix-mixture-separation"
  },
  {
    "id": "ix-chem-physical-chemical-change",
    "expNo": 8,
    "subject": "chemistry",
    "classLevel": "IX",
    "board": "AKUEB",
    "title": "Differentiating Physical and Chemical Changes",
    "object": "To observe and differentiate between physical changes (heating hydrated CuSO₄) and chemical changes (burning magnesium ribbon).",
    "apparatus": "Test tubes, test tube holder, tongs, Bunsen burner, watch glass, blue vitriol (CuSO₄·5H₂O), magnesium ribbon, sandpaper.",
    "theory": [
      "Physical Change: A reversible change in physical state/appearance without forming a new chemical substance (e.g. Dehydration of CuSO₄·5H₂O ⇌ CuSO₄ + 5H₂O).",
      "Chemical Change: An irreversible reaction that results in the formation of new chemical substances with distinct properties (e.g. 2Mg + O₂ → 2MgO)."
    ],
    "method": [
      "Part A (Physical): Heat blue CuSO₄·5H₂O crystals in a dry test tube; observe loss of water vapour and formation of white anhydrous CuSO₄. Add 2 drops of water to restore the blue colour.",
      "Part B (Chemical): Clean magnesium ribbon with sandpaper, hold with tongs, and ignite in a Bunsen flame. Observe intense white blinding flame and brittle white powder (MgO) formed, which cannot be converted back to Mg."
    ],
    "result": "Dehydration/rehydration of copper sulfate is a reversible physical change; combustion of magnesium is an irreversible chemical change.",
    "errors": STD_CHEM_ERRORS,
    "playRoute": "/student/lab-game/practical-ix-physical-chemical-change"
  }
];

export const BIOLOGY_IX: JournalContent[] = [
  {
    "id": "ix-bio-compound-microscope",
    "expNo": 1,
    "subject": "biology",
    "classLevel": "IX",
    "board": "AKUEB",
    "title": "Study of Parts and Handling of a Compound Light Microscope",
    "object": "To identify the structural components, optical pathways, and magnification principles of a student compound microscope.",
    "apparatus": "Compound light microscope, stage micrometer, prepared slide of newsprint letter 'e', lens tissue.",
    "theory": [
      "A compound microscope uses two lens systems: the objective lens and the ocular/eyepiece lens.",
      "Total Magnification = Eyepiece Magnification × Objective Magnification (e.g., 10× eyepiece × 40× objective = 400× total)."
    ],
    "method": [
      "Place microscope on the bench with the limb facing you and mirror facing the light source.",
      "Adjust the mirror and iris diaphragm to achieve uniform bright illumination through the condenser.",
      "Place the slide on the stage and secure with stage clips.",
      "Lower the low-power objective (10×) close to the slide using coarse adjustment, then focus upwards.",
      "Fine-tune the image sharpness using the fine adjustment knob."
    ],
    "result": "All mechanical and optical components of the compound microscope were identified and practiced.",
    "errors": STD_BIO_ERRORS,
    "playRoute": "/student/lab-game/biology"
  },
  {
    "id": "ix-bio-onion-cells",
    "expNo": 2,
    "subject": "biology",
    "classLevel": "IX",
    "board": "AKUEB",
    "title": "Temporary Mount and Study of Onion Epidermal Cells",
    "object": "To prepare a temporary stained mount of onion bulb epidermal peel and examine plant cell structures under the microscope.",
    "apparatus": "Fresh onion bulb, compound microscope, glass slides, coverslips, forceps, dissecting needle, dropper, iodine / safranin stain, glycerine.",
    "theory": [
      "Plant cells possess a rigid outer cellulose cell wall, a thin plasma membrane, cytoplasm, a prominent central vacuole, and a peripheral nucleus.",
      "Iodine stain binds with starch and nuclear chromatin, rendering the nucleus and cell boundaries distinct."
    ],
    "method": [
      "Peel a small transparent epidermal layer from the concave inner surface of an onion fleshy scale leaf.",
      "Place the peel in a watch glass containing water and stain with 1-2 drops of dilute iodine solution for 2 minutes.",
      "Transfer the stained peel onto the centre of a clean glass slide in a drop of glycerine.",
      "Gently lower a coverslip at a 45° angle using a needle to prevent air bubble formation.",
      "Observe under low power (10×) and high power (40×); draw labeled diagrams of rectangular plant cells."
    ],
    "result": "Rectangular onion epidermal cells with distinct cell walls, cytoplasm, central vacuole, and dark nuclei were observed.",
    "errors": STD_BIO_ERRORS,
    "playRoute": "/student/lab-game/biology"
  },
  {
    "id": "ix-bio-cheek-cells",
    "expNo": 3,
    "subject": "biology",
    "classLevel": "IX",
    "board": "AKUEB",
    "title": "Temporary Mount and Study of Human Cheek Epithelial Cells",
    "object": "To prepare a temporary stained mount of human buccal epithelial (cheek) cells and observe animal cell architecture.",
    "apparatus": "Compound microscope, clean glass slides, coverslips, sterile toothpick, methylene blue stain, dropper, blotting paper.",
    "theory": [
      "Animal cells lack a cellulose cell wall and large central vacuole; they are bounded by a flexible plasma membrane, contain granular cytoplasm and a prominent central nucleus.",
      "Methylene blue stains nucleic acids deeply, highlighting the nucleus."
    ],
    "method": [
      "Gently scrape the inner lining of the cheek with the broad flat end of a sterile toothpick.",
      "Smear the scraped material in the centre of a glass slide containing a drop of normal saline.",
      "Add a drop of 0.5% methylene blue solution and let stand for 2 minutes.",
      "Place a coverslip carefully, blot excess stain, and observe under low and high power.",
      "Draw labeled diagrams of animal cells highlighting absence of cell wall."
    ],
    "result": "Polygonal animal cheek cells with distinct cell membranes, cytoplasm, and central nuclei were identified.",
    "errors": STD_BIO_ERRORS,
    "playRoute": "/student/lab-game/biology"
  },
  {
    "id": "ix-bio-osmosis",
    "expNo": 4,
    "subject": "biology",
    "classLevel": "IX",
    "board": "AKUEB",
    "title": "Demonstration of Osmosis Using a Potato Osmometer",
    "object": "To demonstrate the phenomenon of endosmosis in plant tissue using a potato osmometer.",
    "apparatus": "Large fresh potato tuber, scalpel/knife, petri dish, 20% sucrose solution, distilled water, pin marker.",
    "theory": [
      "Osmosis is the net movement of water molecules from a region of higher water potential to lower water potential across a selectively permeable membrane.",
      "Potato living parenchyma cell membranes act as a semipermeable barrier."
    ],
    "method": [
      "Peel the potato tuber and slice its base flat so it stands stably in a petri dish.",
      "Scoop out a central cylindrical cavity leaving a thin bottom wall (3-4 mm thickness).",
      "Pour 20% concentrated sucrose solution into the potato cavity to about half-depth; mark initial level with a pin.",
      "Place the potato osmometer in a petri dish filled with distilled water to about one-third of potato height.",
      "Leave the setup undisturbed for 2-3 hours; record the final liquid level inside the potato cavity."
    ],
    "result": "The liquid level inside the potato cavity rose significantly due to endosmosis of water across potato cells.",
    "errors": STD_BIO_ERRORS,
    "playRoute": "/student/lab-game/biology"
  },
  {
    "id": "ix-bio-plasmolysis",
    "expNo": 5,
    "subject": "biology",
    "classLevel": "IX",
    "board": "AKUEB",
    "title": "Plasmolysis and Deplasmolysis in Rhoeo Leaf Cells",
    "object": "To observe plasmolysis (shrinkage of protoplasm) in hypertonic solution and deplasmolysis in hypotonic solution.",
    "apparatus": "Rhoeo / Tradescantia leaf (or red onion peel), compound microscope, glass slides, coverslips, 10% NaCl solution, distilled water, dropper.",
    "theory": [
      "When plant cells are placed in a hypertonic solution (10% NaCl), water leaves the vacuole via exosmosis, causing the protoplast to shrink away from the cell wall (Plasmolysis).",
      "When placed back in a hypotonic medium (distilled water), endosmosis restores turgor pressure (Deplasmolysis)."
    ],
    "method": [
      "Tear a Rhoeo leaf obliquely to peel the purple lower epidermal layer.",
      "Mount the peel in water on a slide and observe turgid cells under high power.",
      "Irrigate the peel by placing a drop of 10% NaCl solution at one edge of the coverslip and drawing it with blotting paper at the opposite edge.",
      "Observe protoplast shrinkage away from cell corners after 3-5 minutes (Plasmolysis).",
      "Irrigate with distilled water and observe recovery of cell turgidity (Deplasmolysis)."
    ],
    "result": "Observed clear shrinkage of purple protoplast during plasmolysis and full recovery during deplasmolysis.",
    "errors": STD_BIO_ERRORS,
    "playRoute": "/student/lab-game/biology"
  },
  {
    "id": "ix-bio-starch-test",
    "expNo": 6,
    "subject": "biology",
    "classLevel": "IX",
    "board": "AKUEB",
    "title": "Qualitative Biochemical Iodine Test for Starch",
    "object": "To test for the presence of starch in various food samples (potato extract, flour, rice water).",
    "apparatus": "Test tubes, test tube rack, dropper, spot plate, 1% starch solution, potato slurry, Lugol's iodine solution.",
    "theory": [
      "Starch consists of amylose and amylopectin.",
      "Iodine molecules slip inside the helical coils of amylose to form a deep blue-black polyiodide-starch inclusion complex."
    ],
    "method": [
      "Take 2 cm³ of 1% starch solution in test tube A and 2 cm³ of distilled water in test tube B (control).",
      "Add 2-3 drops of Lugol's iodine solution to each tube.",
      "Observe immediate formation of intense blue-black colour in tube A, while tube B remains yellow-brown.",
      "Heat tube A gently in a water bath; observe disappearance of blue colour as helix unravels, and reappearance upon cooling."
    ],
    "result": "Formation of intense blue-black colour with iodine confirms the presence of starch.",
    "errors": STD_BIO_ERRORS,
    "playRoute": "/student/lab-game/biology"
  },
  {
    "id": "ix-bio-benedicts-test",
    "expNo": 7,
    "subject": "biology",
    "classLevel": "IX",
    "board": "AKUEB",
    "title": "Qualitative Detection of Reducing Sugars by Benedict's Test",
    "object": "To test for the presence of reducing sugars (glucose/maltose) in given biological solutions.",
    "apparatus": "Test tubes, test tube holder, water bath, Bunsen burner, 1% glucose solution, 1% sucrose solution, Benedict's qualitative reagent.",
    "theory": [
      "Reducing sugars reduce alkaline cupric ions (Cu²⁺, blue) to cuprous oxide (Cu₂O, red precipitate).",
      "Colour change indicates sugar concentration: Green (<0.5%), Yellow (1%), Orange (1.5%), Brick-red (>2%)."
    ],
    "method": [
      "Take 2 cm³ of glucose solution in test tube 1 and 2 cm³ of sucrose solution in test tube 2.",
      "Add 2 cm³ of Benedict's reagent to each test tube and mix thoroughly.",
      "Place both tubes in a boiling water bath for 3 to 5 minutes.",
      "Observe colour progression in tube 1 from blue → green → yellow → orange-red precipitate.",
      "Observe tube 2 (sucrose non-reducing) remaining clear blue."
    ],
    "result": "Formation of heavy brick-red precipitate of cuprous oxide confirms the presence of reducing sugars.",
    "errors": STD_BIO_ERRORS,
    "playRoute": "/student/lab-game/biology"
  },
  {
    "id": "ix-bio-transpiration",
    "expNo": 8,
    "subject": "biology",
    "classLevel": "IX",
    "board": "AKUEB",
    "title": "Measurement of Transpiration Rate by Potometer",
    "object": "To demonstrate and measure the rate of water transpiration in a leafy shoot using a Ganong's potometer.",
    "apparatus": "Ganong's potometer, leafy twig of plant, beaker of water with eosin dye, stopwatch, petroleum jelly.",
    "theory": [
      "Transpiration is the loss of water vapour from aerial parts of plants, primarily through stomata.",
      "The rate of water absorption closely matches transpiration rate; movement of an air bubble in a capillary tube measures volume of water lost per unit time."
    ],
    "method": [
      "Cut a fresh leafy twig obliquely under water to prevent air locks in xylem vessels.",
      "Fit the shoot into the cork opening of the potometer reservoir and seal with petroleum jelly to make it airtight.",
      "Introduce a single air bubble into the horizontal capillary tube by briefly lifting the capillary end from the water beaker.",
      "Record the distance moved by the air bubble along the calibrated scale in 5-minute intervals under still air and windy conditions."
    ],
    "result": "Air bubble moved 3.8 cm in 10 minutes, demonstrating active foliar transpiration.",
    "errors": STD_BIO_ERRORS,
    "playRoute": "/student/lab-game/biology"
  }
];

export const CS_IX: JournalContent[] = [
  {
    "id": "ix-cs-cli-navigation",
    "expNo": 1,
    "subject": "computer-science",
    "classLevel": "IX",
    "board": "AKUEB",
    "title": "Operating System Navigation: CLI Directory Hierarchy and File Operations",
    "object": "To create, navigate, copy, rename, and manage hierarchical directory trees using Command Line Interface (CLI).",
    "apparatus": "Computer system running Linux/Unix Terminal or Windows CMD/PowerShell.",
    "theory": [
      "Command Line Interface (CLI) provides direct access to operating system kernel services through text commands.",
      "Essential navigation commands: pwd/cd (print/change directory), ls/dir (list contents), mkdir (create directory), cp/copy (duplicate file), mv/move (rename/relocate), rm/del (delete)."
    ],
    "method": [
      "Open terminal and verify current working directory with pwd.",
      "Create a nested project structure: mkdir -p school/class9/practicals.",
      "Create a sample text file: echo 'Computer Science Practical Journal' > school/class9/practicals/notes.txt.",
      "Copy and rename the file: cp school/class9/practicals/notes.txt school/class9/backup.txt.",
      "List full directory tree permissions and file sizes with ls -laR school/."
    ],
    "result": "Hierarchical folder structure and file management operations successfully executed via CLI.",
    "errors": STD_CS_ERRORS
  },
  {
    "id": "ix-cs-spreadsheets",
    "expNo": 2,
    "subject": "computer-science",
    "classLevel": "IX",
    "board": "AKUEB",
    "title": "Electronic Spreadsheets: Statistical Calculations, Formulas, and Charts",
    "object": "To design a student grading sheet with automated formulas (SUM, AVERAGE, IF, COUNT) and generate visual performance charts.",
    "apparatus": "Computer system with spreadsheet software (MS Excel / LibreOffice Calc / Google Sheets).",
    "theory": [
      "Spreadsheets organize data in rows and columns of cells, using arithmetic formulas and logical functions.",
      "Key formulas: =SUM(range), =AVERAGE(range), =IF(condition, value_true, value_false), =COUNTIF(range, criteria)."
    ],
    "method": [
      "Create a table with columns: Student ID, Name, Physics, Chemistry, Biology, CS.",
      "Compute total marks in column G using formula =SUM(C2:F2).",
      "Compute percentage in column H using =(G2/400)*100.",
      "Assign Grade in column I using nested IF formula: =IF(H2>=80,'A+',IF(H2>=70,'A',IF(H2>=60,'B','C'))).",
      "Select student names and percentages to generate a 2D Clustered Column Chart."
    ],
    "result": "Automated student report sheet with formula evaluation and performance charts constructed.",
    "errors": STD_CS_ERRORS
  },
  {
    "id": "ix-cs-algorithms-flowcharts",
    "expNo": 3,
    "subject": "computer-science",
    "classLevel": "IX",
    "board": "AKUEB",
    "title": "Algorithm Design: Flowcharts and Structured Pseudocode",
    "object": "To formulate step-by-step algorithms and draw ANSI standard flowcharts for sequential, decision, and iterative computational problems.",
    "apparatus": "Diagramming software (Draw.io / Visio) or drafting sheet.",
    "theory": [
      "An algorithm is a finite sequence of unambiguous instructions to solve a specific problem.",
      "Standard flowchart symbols: Oval (Terminal - Start/Stop), Parallelogram (Input/Output), Rectangle (Process/Calculation), Rhombus (Decision), Arrow (Flowline)."
    ],
    "method": [
      "Write pseudocode to find the largest of three numbers (A, B, C).",
      "Draw the flowchart starting with oval START, followed by input parallelogram READ A, B, C.",
      "Add decision diamond IS A > B AND A > C? branching to print A or check IS B > C?.",
      "Converge all terminal branches into a single STOP oval.",
      "Dry-run the flowchart with sample test vectors (15, 42, 28) to trace logic accuracy."
    ],
    "result": "Decision algorithms and standard flowcharts designed and validated through dry run tracing.",
    "errors": STD_CS_ERRORS
  },
  {
    "id": "ix-cs-python-basics",
    "expNo": 4,
    "subject": "computer-science",
    "classLevel": "IX",
    "board": "AKUEB",
    "title": "Introduction to Python: Variables, Data Types, and Arithmetic Operations",
    "object": "To write a Python program that accepts user input, handles numeric conversions, and calculates circle properties.",
    "apparatus": "Python 3.x IDLE / VS Code environment.",
    "theory": [
      "Python is a high-level interpreted programming language supporting dynamic typing.",
      "Data types include int, float, str, bool. Standard input input() returns string data that must be explicitly cast using float() or int()."
    ],
    "method": [
      "Open Python script editor and declare constant PI = 3.14159.",
      "Prompt user for radius: radius = float(input('Enter radius of circle: ')).",
      "Compute circumference: circ = 2 * PI * radius.",
      "Compute area: area = PI * (radius ** 2).",
      "Format output using f-strings: print(f'Circumference: {circ:.2f}, Area: {area:.2f}')."
    ],
    "result": "Python program executed successfully, calculating geometric parameters from user input.",
    "errors": STD_CS_ERRORS
  },
  {
    "id": "ix-cs-python-conditionals",
    "expNo": 5,
    "subject": "computer-science",
    "classLevel": "IX",
    "board": "AKUEB",
    "title": "Decision Structures: if-else and if-elif-else in Python",
    "object": "To write a Python program that classifies student scores into letter grades and checks leap years.",
    "apparatus": "Python 3.x interpreter environment.",
    "theory": [
      "Conditional branching controls execution flow based on Boolean truth evaluation (True / False).",
      "Leap year logic: (year % 4 == 0 and year % 100 != 0) or (year % 400 == 0)."
    ],
    "method": [
      "Prompt user for year input: year = int(input('Enter a year: ')).",
      "Implement multi-condition test using logical operators and, or.",
      "Display whether the year is a Leap Year or Common Year.",
      "Test with boundary test cases: 2000 (Leap), 1900 (Common), 2024 (Leap), 2025 (Common)."
    ],
    "result": "Multi-branch decision logic implemented and verified against boundary test vectors.",
    "errors": STD_CS_ERRORS
  },
  {
    "id": "ix-cs-python-loops",
    "expNo": 6,
    "subject": "computer-science",
    "classLevel": "IX",
    "board": "AKUEB",
    "title": "Iterative Loops: for and while Loops in Python",
    "object": "To write Python programs that compute factorial of a number and generate arithmetic multiplication tables using loops.",
    "apparatus": "Python 3.x environment.",
    "theory": [
      "Loops execute a code block repeatedly until a termination condition is met.",
      "for loop iterates over a sequence (e.g. range(1, n+1)). while loop continues while a condition remains True.",
      "Factorial: n! = n × (n-1) × (n-2) × ... × 1."
    ],
    "method": [
      "Write a for loop to print the multiplication table of a user-entered integer up to 10.",
      "Write a while loop to compute the factorial of an integer n.",
      "Initialize fact = 1 and i = 1; while i <= n, update fact *= i and i += 1.",
      "Print final computed factorial and test with n=5 (120) and n=0 (1)."
    ],
    "result": "Iterative loop structures implemented, correctly computing mathematical tables and factorials.",
    "errors": STD_CS_ERRORS
  }
];

// ==========================================

// CLASS X PRACTICALS

// ==========================================

export const PHYSICS_X: JournalContent[] = [
  {
    "id": "x-phy-reflection-mirror",
    "expNo": 1,
    "subject": "physics",
    "classLevel": "X",
    "board": "AKUEB",
    "title": "Verification of the Laws of Reflection by Plane Mirror",
    "object": "To verify the Laws of Reflection using a plane mirror strip and optical pins on a drawing board.",
    "apparatus": "Drawing board, plane mirror with wooden support, optical pins, drawing sheet, thumb pins, protractor, ruler.",
    "formula": "Angle of Incidence (∠i) = Angle of Reflection (∠r)",
    "theory": [
      "Law 1: The incident ray, reflected ray, and the normal to the mirror at the point of incidence all lie in the same plane.",
      "Law 2: The angle of incidence ∠i equals the angle of reflection ∠r."
    ],
    "method": [
      "Fix drawing paper on board. Draw a straight line MM' representing the mirror line and construct normal ON.",
      "Draw incident rays at angles ∠i = 30°, 45°, 60° to the normal.",
      "Fix two pins P₁ and P₂ on the incident ray line.",
      "Looking into the mirror, fix pins P₃ and P₄ such that they align in a straight line with images of P₁ and P₂.",
      "Remove pins, draw reflected ray line through P₃ and P₄, and measure angle of reflection ∠r using a protractor."
    ],
    "result": "For all angles of incidence, ∠i = ∠r within experimental limits, verifying the laws of reflection.",
    "errors": STD_PHYSICS_ERRORS,
    "playRoute": "/student/lab-game/physics"
  },
  {
    "id": "x-phy-concave-mirror",
    "expNo": 2,
    "subject": "physics",
    "classLevel": "X",
    "board": "AKUEB",
    "title": "Focal Length of a Concave Mirror",
    "object": "To determine the focal length of a concave mirror using distant object and two-pin displacement methods.",
    "apparatus": "Concave mirror with stand, illuminated object / needle, white screen, optical bench / metre scale.",
    "formula": "1 / f = (1 / p) + (1 / q) ⇒ f = (p × q) / (p + q)",
    "theory": [
      "Mirror formula relating object distance (p), image distance (q), and focal length (f): 1/f = 1/p + 1/q ⇒ f = (p·q)/(p+q).",
      "For a distant object (p → ∞), the real, inverted image forms at the principal focus (q = f)."
    ],
    "method": [
      "Point the concave mirror toward a distant tree/building through an open window.",
      "Move the screen until a sharp, inverted image forms on it; measure distance from mirror to screen to obtain approximate focal length f.",
      "Mount mirror and object needle on optical bench with p > 2f.",
      "Locate the position of sharp real image needle on screen; eliminate parallax between image and search needle.",
      "Record p and q for 4 different positions and compute mean focal length f."
    ],
    "result": "The focal length of the given concave mirror is determined to be f = 15.0 cm.",
    "errors": STD_PHYSICS_ERRORS,
    "playRoute": "/student/lab-game/physics"
  },
  {
    "id": "x-phy-refraction-slab",
    "expNo": 3,
    "subject": "physics",
    "classLevel": "X",
    "board": "AKUEB",
    "title": "Refraction Through a Glass Slab and Snell's Law",
    "object": "To trace the path of a ray of light through a rectangular glass slab, verify Snell's law, and calculate refractive index (n).",
    "apparatus": "Rectangular glass slab, drawing board, white paper, optical pins, protractor, ruler.",
    "formula": "n = sin(i) / sin(r)",
    "theory": [
      "Snell's Law: For light passing from air to glass, the ratio sin i / sin r is constant and equals the refractive index n of glass.",
      "Lateral displacement d depends on slab thickness, angle of incidence, and refractive index."
    ],
    "method": [
      "Place the glass slab on paper and draw its boundary ABCD.",
      "Draw an incident ray at ∠i = 30° at point O on face AB and fix two pins P₁ and P₂ on it.",
      "Look through opposite face CD and place pins P₃ and P₄ in line with images of P₁ and P₂.",
      "Remove slab, draw emergent ray and join point of incidence O to point of emergence O' to obtain refracted ray.",
      "Measure angle of refraction ∠r and calculate n = sin i / sin r. Repeat for ∠i = 45° and 60°."
    ],
    "result": "The refractive index of the glass slab is found to be n = 1.50.",
    "errors": STD_PHYSICS_ERRORS,
    "playRoute": "/student/lab-game/physics"
  },
  {
    "id": "x-phy-prism-deviation",
    "expNo": 4,
    "subject": "physics",
    "classLevel": "X",
    "board": "AKUEB",
    "title": "Refractive Index of a Glass Prism by Angle of Minimum Deviation",
    "object": "To determine the refractive index of a triangular glass prism by plotting an i vs D graph and finding the angle of minimum deviation (Dm).",
    "apparatus": "Equilateral glass prism (A = 60°), drawing board, white paper, optical pins, protractor, ruler.",
    "formula": "n = sin[(A + Dm) / 2] / sin(A / 2)",
    "theory": [
      "When light passes through a prism, total deviation D = i + e − A.",
      "At minimum deviation condition (D = Dm), angle of incidence equals angle of emergence (i = e).",
      "Refractive index is given by: n = sin[(A + Dm) / 2] / sin(A / 2)."
    ],
    "method": [
      "Draw outline of equilateral prism ABC (angle of prism A = 60°).",
      "Draw incident rays at angles i = 35°, 40°, 45°, 50°, 55°, 60° on face AB.",
      "Fix pins on incident ray and locate emergent pin alignment through face AC.",
      "Draw emergent rays and measure angle of deviation D for each angle of incidence.",
      "Plot graph of i (x-axis) vs D (y-axis); find lowest point on curve representing Dm."
    ],
    "result": "Minimum deviation Dm = 38.5°. The refractive index of the prism material is n = 1.52.",
    "errors": STD_PHYSICS_ERRORS,
    "playRoute": "/student/lab-game/physics"
  },
  {
    "id": "x-phy-convex-lens",
    "expNo": 5,
    "subject": "physics",
    "classLevel": "X",
    "board": "AKUEB",
    "title": "Focal Length of a Convex Lens by Two-Pin Method",
    "object": "To determine the focal length of a convex lens by measuring object distance (p) and image distance (q).",
    "apparatus": "Convex lens with holder, two optical needles (object and image), optical bench with uprights / metre scale.",
    "formula": "1 / f = (1 / p) + (1 / q) ⇒ f = (p × q) / (p + q)",
    "theory": [
      "Thin lens formula: 1/f = 1/p + 1/q ⇒ f = (p·q)/(p+q).",
      "When an object is placed at distance p > 2f, a real, inverted, diminished image forms at 2f > q > f."
    ],
    "method": [
      "Find rough focal length by focusing distant building image on a wall.",
      "Mount convex lens on central upright. Place object needle P at distance p > f.",
      "Look from other side of lens and observe inverted image needle.",
      "Move image needle Q until its tip coincides with image of P without parallax.",
      "Record p and q for 5 different positions and calculate mean focal length f."
    ],
    "result": "The focal length of the convex lens is found to be f = 20.0 cm.",
    "errors": STD_PHYSICS_ERRORS,
    "playRoute": "/student/lab-game/physics"
  },
  {
    "id": "x-phy-ohms-law",
    "expNo": 6,
    "subject": "physics",
    "classLevel": "X",
    "board": "AKUEB",
    "title": "Verification of Ohm's Law and Resistance of a Conductor",
    "object": "To verify Ohm's Law by plotting a V vs I graph and calculate the unknown resistance of a wire.",
    "apparatus": "DC power supply (0-6V), DC ammeter (0-1A), DC voltmeter (0-5V), resistance coil, rheostat, plug key, connecting wires.",
    "formula": "V = I × R ⇒ R = V / I = Slope of V vs I graph",
    "theory": [
      "Ohm's Law states that electric current I flowing through a metallic conductor is directly proportional to potential difference V across its ends at constant temperature.",
      "V / I = R (constant resistance in Ohms, Ω)."
    ],
    "method": [
      "Connect circuit in series: Battery (+) → Ammeter (+) → Resistance coil → Rheostat → Plug Key → Battery (−).",
      "Connect Voltmeter in parallel across the resistance coil.",
      "Insert key and adjust rheostat slider to obtain low current reading; note I and V.",
      "Vary rheostat in 5 successive steps to increase current, recording voltmeter and ammeter readings each time.",
      "Plot graph of I (x-axis) vs V (y-axis); verify straight line passing through origin."
    ],
    "result": "V vs I graph is a straight line, verifying Ohm's law. Resistance of coil R = 4.8 Ω.",
    "errors": STD_PHYSICS_ERRORS,
    "playRoute": "/student/lab-game/physics"
  },
  {
    "id": "x-phy-series-parallel",
    "expNo": 7,
    "subject": "physics",
    "classLevel": "X",
    "board": "AKUEB",
    "title": "Verification of Series and Parallel Combination of Resistors",
    "object": "To verify the laws of combination of resistances in series (Rs = R₁ + R₂) and parallel (1/Rp = 1/R₁ + 1/R₂).",
    "apparatus": "Two known standard resistance coils (R₁ and R₂), DC power supply, voltmeter, ammeter, rheostat, key.",
    "formula": "Series: Rs = R₁ + R₂ | Parallel: Rp = (R₁ × R₂) / (R₁ + R₂)",
    "theory": [
      "Series Connection: Equivalent resistance Rs = R₁ + R₂ (current I remains same throughout).",
      "Parallel Connection: Equivalent resistance 1 / Rp = 1 / R₁ + 1 / R₂ ⇒ Rp = (R₁ × R₂) / (R₁ + R₂)."
    ],
    "method": [
      "Measure individual resistances R₁ and R₂ using Ohm's law setup.",
      "Connect R₁ and R₂ in series; measure total potential difference V and circuit current I to find experimental Rs = V / I.",
      "Connect R₁ and R₂ in parallel; measure V and total current I to find experimental Rp = V / I.",
      "Compare experimental values with theoretical formulas."
    ],
    "result": "Experimental Rs = 10.0 Ω matches theoretical 10.0 Ω; experimental Rp = 2.4 Ω matches theoretical 2.4 Ω.",
    "errors": STD_PHYSICS_ERRORS,
    "playRoute": "/student/lab-game/physics"
  },
  {
    "id": "x-phy-logic-gates",
    "expNo": 8,
    "subject": "physics",
    "classLevel": "X",
    "board": "AKUEB",
    "title": "Experimental Verification of Truth Tables for Logic Gates",
    "object": "To verify the truth tables of basic digital logic gates (AND, OR, NOT, NAND, NOR) using IC breadboard simulator.",
    "apparatus": "Digital logic trainer kit, IC 7408 (AND), IC 7432 (OR), IC 7404 (NOT), IC 7400 (NAND), LED output indicators, toggle input switches, 5V DC supply.",
    "theory": [
      "Digital logic gates perform Boolean algebra operations: High = 1 (5V), Low = 0 (0V).",
      "AND gate: Y = A · B. OR gate: Y = A + B. NOT gate: Y = Ā. NAND gate: Y = (A · B)̄."
    ],
    "method": [
      "Insert IC 7408 (AND gate) on trainer board; connect Pin 14 to +5V (Vcc) and Pin 7 to GND.",
      "Connect input switches A and B to Pins 1 and 2; connect Pin 3 (output) to an LED indicator.",
      "Test all four input combinations (00, 01, 10, 11) and record LED state (ON=1, OFF=0).",
      "Repeat procedure for OR gate (IC 7432) and NOT gate (IC 7404)."
    ],
    "result": "Truth tables for AND, OR, NOT, and NAND digital logic gates were experimentally verified.",
    "errors": STD_PHYSICS_ERRORS,
    "playRoute": "/student/lab-game/physics"
  }
];

export const CHEMISTRY_X: JournalContent[] = [
  {
    "id": "x-chem-standardization-naoh",
    "expNo": 1,
    "subject": "chemistry",
    "classLevel": "X",
    "board": "AKUEB",
    "title": "Standardization of NaOH Solution Using 0.1 M Oxalic Acid",
    "object": "To determine the exact molarity of a given Sodium Hydroxide (NaOH) solution by titrating against standard 0.1 M Oxalic Acid using phenolphthalein indicator.",
    "apparatus": "Burette (50 cm³), pipette (10 cm³), conical flask, burette stand with clamp, white tile, standard 0.1 M oxalic acid, NaOH solution, phenolphthalein indicator.",
    "formula": "(M₁ × V₁) / n₁ = (M₂ × V₂) / n₂ ⇒ M₂ = (2 × M₁ × V₁) / V₂",
    "theory": [
      "Neutralization reaction: H₂C₂O₄ + 2NaOH → Na₂C₂O₄ + 2H₂O.",
      "1 mole of dibasic oxalic acid neutralizes 2 moles of monobasic sodium hydroxide (n₁ = 1, n₂ = 2).",
      "Phenolphthalein indicator changes from colourless (acidic) to faint pink (alkaline endpoint, pH 8.3–10.0)."
    ],
    "method": [
      "Rinse and fill the burette with NaOH solution; note initial reading.",
      "Pipette out exactly 10 cm³ of 0.1 M oxalic acid solution into a conical flask.",
      "Add 1-2 drops of phenolphthalein indicator (solution remains colourless).",
      "Titrate by adding NaOH dropwise with continuous swirling until a permanent faint pink colour appears.",
      "Record final burette reading; repeat titration until three concordant readings are obtained."
    ],
    "result": "The exact molarity of the given NaOH solution is determined to be 0.198 M.",
    "errors": STD_CHEM_ERRORS,
    "playRoute": "/student/lab-game/practical-x-naoh"
  },
  {
    "id": "x-chem-acid-base-titration",
    "expNo": 2,
    "subject": "chemistry",
    "classLevel": "X",
    "board": "AKUEB",
    "title": "Determination of Molarity of HCl by Titration with Standard Na₂CO₃",
    "object": "To determine the exact molarity of given Hydrochloric Acid (HCl) by titrating against standard 0.1 M Sodium Carbonate (Na₂CO₃) using methyl orange indicator.",
    "apparatus": "Burette, 10 cm³ pipette, conical flask, white tile, standard 0.1 M Na₂CO₃, unknown HCl solution, methyl orange indicator.",
    "formula": "Na₂CO₃ + 2HCl → 2NaCl + H₂O + CO₂ ⇒ M_HCl = (2 × M_Na₂CO₃ × V_Na₂CO₃) / V_HCl",
    "theory": [
      "Stoichiometric reaction: Na₂CO₃ + 2HCl → 2NaCl + H₂O + CO₂ (n₁ = 1, n₂ = 2).",
      "Methyl orange indicator changes from straw-yellow (in basic medium) to faint onion-pink / orange-red at endpoint (pH 3.1–4.4)."
    ],
    "method": [
      "Rinse and fill the burette with given HCl solution.",
      "Pipette 10 cm³ of standard 0.1 M Na₂CO₃ into conical flask; add 2 drops of methyl orange (yellow colour).",
      "Titrate against HCl with swirling until yellow colour sharply turns pink-orange.",
      "Record concordant burette reading (V_HCl) and calculate molarity."
    ],
    "result": "The molarity of the given HCl solution is determined to be 0.198 M.",
    "errors": STD_CHEM_ERRORS,
    "playRoute": "/student/lab-game/practical-x-hcl"
  },
  {
    "id": "x-chem-ph-measurement",
    "expNo": 3,
    "subject": "chemistry",
    "classLevel": "X",
    "board": "AKUEB",
    "title": "Determination of pH of Common Solutions",
    "object": "To determine the pH of various household and laboratory solutions using pH paper, universal indicator, and digital pH meter.",
    "apparatus": "Spot plate, test tubes, dropper, pH paper strip with color chart, universal indicator, digital pH meter, samples (0.1M HCl, 0.1M NaOH, lemon juice, vinegar, soap solution, distilled water).",
    "theory": [
      "pH is the negative logarithm of hydrogen ion concentration: pH = −log₁₀[H⁺].",
      "pH < 7 indicates acidic solution; pH = 7 indicates neutral; pH > 7 indicates basic/alkaline solution."
    ],
    "method": [
      "Place 2 drops of each test sample into separate wells of a spot plate.",
      "Touch a piece of broad-range pH paper to each sample and compare the developed colour with the standard reference colour chart.",
      "Add 1 drop of universal indicator to test tube portions of each solution and observe coloration.",
      "Calibrate the digital pH meter with pH 4.0 and 7.0 buffer solutions, then dip glass electrode into each sample to record precise pH."
    ],
    "result": "Sample pH values: 0.1M HCl (1.0), Lemon Juice (2.4), Vinegar (2.8), Distilled Water (7.0), Soap solution (9.2), 0.1M NaOH (13.0).",
    "errors": STD_CHEM_ERRORS,
    "playRoute": "/student/lab-game/practical-x-ph"
  },
  {
    "id": "x-chem-water-hardness",
    "expNo": 4,
    "subject": "chemistry",
    "classLevel": "X",
    "board": "AKUEB",
    "title": "Identification and Removal of Water Hardness",
    "object": "To differentiate between temporary and permanent hardness in water samples and remove temporary hardness by boiling and chemical addition.",
    "apparatus": "Test tubes, test tube holder, Bunsen burner, standard soap solution, samples of temporary hard water (Ca(HCO₃)₂), permanent hard water (CaCl₂/MgSO₄), distilled water, washing soda (Na₂CO₃).",
    "theory": [
      "Temporary hardness is caused by dissolved calcium and magnesium hydrogencarbonates: Ca(HCO₃)₂ → CaCO₃↓ + H₂O + CO₂ (removed by boiling).",
      "Permanent hardness is caused by dissolved chlorides and sulphates of Ca²⁺ and Mg²⁺: CaSO₄ + Na₂CO₃ → CaCO₃↓ + Na₂SO₄ (removed by washing soda)."
    ],
    "method": [
      "Test lather formation by shaking 5 cm³ of each sample with 5 drops of soap solution.",
      "Boil 10 cm³ of temporary hard water for 5 minutes, filter the white CaCO₃ precipitate, and retest with soap; observe rich lather.",
      "Boil permanent hard water; observe no precipitate and failure to form lather.",
      "Add 0.5 g Na₂CO₃ to permanent hard water, filter the precipitate, and test with soap; observe instant lather formation."
    ],
    "result": "Temporary hardness was removed by boiling; permanent hardness was successfully softened using sodium carbonate.",
    "errors": STD_CHEM_ERRORS,
    "playRoute": "/student/lab-game/practical-x-water-hardness"
  },
  {
    "id": "x-chem-acid-reactions",
    "expNo": 5,
    "subject": "chemistry",
    "classLevel": "X",
    "board": "AKUEB",
    "title": "Characteristic Chemical Reactions of Acids",
    "object": "To observe the characteristic chemical reactions of dilute hydrochloric acid with reactive metals, carbonates, and bases.",
    "apparatus": "Test tubes, test tube rack, delivery tube, lime water, wooden splint, dil. HCl, magnesium ribbon, zinc granules, solid CaCO₃, 0.1M NaOH.",
    "theory": [
      "Metal reaction: Mg + 2HCl → MgCl₂ + H₂↑ (hydrogen gas burns with characteristic 'pop' sound).",
      "Carbonate reaction: CaCO₃ + 2HCl → CaCl₂ + H₂O + CO₂↑ (effervescence of CO₂ turns lime water milky).",
      "Neutralization: NaOH + HCl → NaCl + H₂O (exothermic reaction forming neutral salt)."
    ],
    "method": [
      "Add 2 cm³ dil. HCl to magnesium ribbon; bring burning splint to mouth of tube; observe pop sound confirming H₂.",
      "Add 2 cm³ dil. HCl to pinch of CaCO₃; pass evolved gas into freshly prepared lime water; observe milky turbidity (CaCO₃↓).",
      "Mix equal volumes of 0.1M HCl and 0.1M NaOH; observe temperature rise and neutral pH."
    ],
    "result": "Acid characteristics confirmed: evolution of combustible H₂ with metals, CO₂ with carbonates, and neutral salt formation with bases.",
    "errors": STD_CHEM_ERRORS,
    "playRoute": "/student/lab-game/practical-x-acid-reactions"
  },
  {
    "id": "x-chem-anions-qualitative",
    "expNo": 6,
    "subject": "chemistry",
    "classLevel": "X",
    "board": "AKUEB",
    "title": "Qualitative Identification of Anions (Cl⁻, SO₄²⁻, CO₃²⁻)",
    "object": "To identify Chloride, Sulphate, and Carbonate acidic radicals in unknown aqueous salt solutions.",
    "apparatus": "Test tubes, droppers, salt solutions, dil. HNO₃, AgNO₃, dil. HCl, BaCl₂ solution, dil. H₂SO₄.",
    "theory": [
      "Chloride (Cl⁻): Cl⁻ + AgNO₃ → AgCl↓ (curdy white precipitate soluble in aqueous NH₄OH).",
      "Sulphate (SO₄²⁻): SO₄²⁻ + BaCl₂ → BaSO₄↓ (thick white precipitate insoluble in conc. HCl/HNO₃).",
      "Carbonate (CO₃²⁻): CO₃²⁻ + 2H⁺ → H₂O + CO₂↑ (effervescence turning lime water milky)."
    ],
    "method": [
      "To salt solution A, add dil. HNO₃ followed by AgNO₃ solution; observe curdy white precipitate confirming Cl⁻.",
      "To salt solution B, add dil. HCl followed by BaCl₂ solution; observe dense white precipitate confirming SO₄²⁻.",
      "To solid salt C, add dil. HCl; observe brisk effervescence and bubble gas through lime water confirming CO₃²⁻."
    ],
    "result": "Radicals Cl⁻, SO₄²⁻, and CO₃²⁻ were unambiguously identified through characteristic precipitation reactions.",
    "errors": STD_CHEM_ERRORS,
    "playRoute": "/student/lab-game/practical-x-anions"
  },
  {
    "id": "x-chem-salt-synthesis",
    "expNo": 7,
    "subject": "chemistry",
    "classLevel": "X",
    "board": "AKUEB",
    "title": "Preparation of Pure Crystals of Copper Sulfate",
    "object": "To prepare pure hydrated copper sulfate crystals (CuSO₄·5H₂O) by reacting insoluble black copper(II) oxide with dilute sulfuric acid.",
    "apparatus": "Beaker (250 cm³), evaporating dish, funnel, filter paper, tripod stand, wire gauze, Bunsen burner, black CuO powder, 1M dil. H₂SO₄.",
    "theory": [
      "Insoluble base + acid reaction: CuO(s) + H₂SO₄(aq) → CuSO₄(aq) + H₂O(l).",
      "Excess copper oxide is used to ensure complete neutralization of acid, followed by filtration and crystallization."
    ],
    "method": [
      "Measure 40 cm³ of dilute H₂SO₄ into a beaker and warm gently on wire gauze.",
      "Add black CuO powder in small portions with continuous stirring until no more dissolves and excess black powder settles at bottom.",
      "Filter the hot blue solution to remove unreacted CuO.",
      "Evaporate the blue filtrate in a china dish to crystallization point; allow to cool slowly.",
      "Collect and dry beautiful blue triclinic crystals of CuSO₄·5H₂O."
    ],
    "result": "Yielded pure blue crystalline copper(II) sulfate pentahydrate crystals.",
    "errors": STD_CHEM_ERRORS,
    "playRoute": "/student/lab-game/practical-x-copper-sulfate"
  }
];

export const BIOLOGY_X: JournalContent[] = [
  {
    "id": "x-bio-respiration-co2",
    "expNo": 1,
    "subject": "biology",
    "classLevel": "X",
    "board": "AKUEB",
    "title": "Demonstration of Carbon Dioxide Evolution in Respiration",
    "object": "To prove experimentally that germinating seeds release carbon dioxide (CO₂) during aerobic cellular respiration.",
    "apparatus": "Conical flask, germinating gram/pea seeds, small test tube containing 20% KOH solution, one-holed rubber cork, bent glass delivery tube, beaker of water with dye, petroleum jelly.",
    "theory": [
      "Aerobic cellular respiration: C₆H₁₂O₆ + 6O₂ → 6CO₂ + 6H₂O + Energy (36 ATP).",
      "KOH pellets absorb released CO₂ inside the flask, creating a partial vacuum that draws water up the delivery tube."
    ],
    "method": [
      "Place moist germinating gram seeds in a conical flask.",
      "Suspend a small test tube containing freshly prepared KOH solution inside the flask without touching seeds.",
      "Insert bent glass delivery tube through airtight cork and dip opposite end into a beaker of coloured water.",
      "Seal cork joints with petroleum jelly and leave setup for 2 hours.",
      "Observe water rising up the delivery tube due to suction pressure from absorbed CO₂."
    ],
    "result": "Rising column of water in delivery tube verifies that germinating seeds actively respire and release CO₂.",
    "errors": STD_BIO_ERRORS,
    "playRoute": "/student/lab-game/biology"
  },
  {
    "id": "x-bio-respiration-heat",
    "expNo": 2,
    "subject": "biology",
    "classLevel": "X",
    "board": "AKUEB",
    "title": "Demonstration of Heat Release During Seed Respiration",
    "object": "To demonstrate that heat energy is liberated during cellular respiration in germinating seeds using vacuum flasks.",
    "apparatus": "Two vacuum thermos flasks (A and B), germinating bean seeds, boiled dead seeds (treated with 1% formalin antiseptic), sensitive thermometers (0.1°C), cotton wool plugs.",
    "theory": [
      "Respiration is an exothermic catabolic process; approximately 60% of free energy released is dissipated as thermal energy.",
      "Boiled seeds with antiseptic serve as control to ensure temperature rise is biological and not due to microbial decay."
    ],
    "method": [
      "Fill Flask A with living germinating seeds and Flask B with boiled seeds cooled and treated with formalin.",
      "Insert a sensitive thermometer into the middle of seeds in each flask and plug mouths with cotton wool.",
      "Invert flasks to prevent heat loss and record initial temperatures T₀.",
      "Record temperatures every 4 hours for 24 hours."
    ],
    "result": "Flask A (germinating) showed steady temperature rise from 22.0°C to 28.5°C; Flask B (control) showed no change, proving exothermic respiration.",
    "errors": STD_BIO_ERRORS,
    "playRoute": "/student/lab-game/biology"
  },
  {
    "id": "x-bio-transpiration-belljar",
    "expNo": 3,
    "subject": "biology",
    "classLevel": "X",
    "board": "AKUEB",
    "title": "Demonstration of Foliar Transpiration Using Bell Jar",
    "object": "To demonstrate transpiration in a healthy potted plant using a bell jar apparatus.",
    "apparatus": "Well-watered potted plant, glass bell jar, rubber sheet / polythene bag, glass plate, petroleum jelly, anhydrous cobalt chloride paper.",
    "theory": [
      "Transpiration is the loss of water in the form of vapour from aerial parts of living plants.",
      "Covering the pot and soil with polythene ensures moisture originates exclusively from the leaves and not soil evaporation."
    ],
    "method": [
      "Enclose the pot and soil completely in a waterproof polythene bag, tying securely around base of plant stem.",
      "Place potted plant on a glass plate, invert a clean dry bell jar over it, and seal rim with petroleum jelly.",
      "Set up a second bell jar without plant as control.",
      "Place apparatus in bright sunlight for 1-2 hours.",
      "Observe mist and condensed water droplets on the inner surface of the bell jar with plant; test droplets with blue anhydrous CoCl₂ paper (turns pink)."
    ],
    "result": "Condensation of water droplets confirmed active transpiration from foliage.",
    "errors": STD_BIO_ERRORS,
    "playRoute": "/student/lab-game/biology"
  },
  {
    "id": "x-bio-photosynthesis-starch",
    "expNo": 4,
    "subject": "biology",
    "classLevel": "X",
    "board": "AKUEB",
    "title": "Investigation of Light Necessity in Photosynthesis",
    "object": "To demonstrate that light is essential for photosynthesis by starch testing a partially covered leaf.",
    "apparatus": "Potted plant (e.g. Geranium / Hibiscus), black paper strip with cutout stencil, paper clips, 70% ethanol, boiling water bath, iodine solution, petri dish, dropper.",
    "theory": [
      "Photosynthesis equation: 6CO₂ + 6H₂O + Light → C₆H₁₂O₆ + 6O₂.",
      "Synthesized glucose is converted into insoluble starch for storage. Areas deprived of light cannot synthesize starch."
    ],
    "method": [
      "Destarch a potted plant by keeping it in total darkness for 48 hours.",
      "Fasten a black paper strip with a stencil cutout on both sides of an attached leaf.",
      "Expose the plant to bright sunlight for 6 hours.",
      "Detach the leaf, boil in water for 2 minutes to kill cells, then boil in 70% ethanol in a water bath to extract chlorophyll (decolourize).",
      "Rinse brittle leaf in warm water, place in petri dish, and flood with iodine solution."
    ],
    "result": "Exposed leaf parts turned dark blue-black with iodine; black paper covered part remained pale brown, proving light is essential.",
    "errors": STD_BIO_ERRORS,
    "playRoute": "/student/lab-game/biology"
  },
  {
    "id": "x-bio-kidney-anatomy",
    "expNo": 5,
    "subject": "biology",
    "classLevel": "X",
    "board": "AKUEB",
    "title": "Anatomy of Mammalian Kidney (Longitudinal Section)",
    "object": "To identify and study the macroscopic and microscopic structures of a mammalian kidney on a longitudinal section model / permanent slide.",
    "apparatus": "Preserved dissected sheep/mammalian kidney / 3D kidney model, compound microscope, permanent stained slide of Kidney L.S., pointer.",
    "theory": [
      "Kidney gross anatomy comprises three distinct regions: outer dark Renal Cortex, inner striated Renal Medulla (with pyramids), and central funnel-shaped Renal Pelvis leading to Ureter.",
      "Nephron is the structural and functional filtration unit."
    ],
    "method": [
      "Examine the outer renal capsule and concave hilum where renal artery enters and renal vein / ureter emerge.",
      "Observe cortex and medulla on the sliced longitudinal section.",
      "Identify 8-12 triangular renal pyramids whose apex project into minor and major calyces.",
      "Under microscope (10×/40×), examine Bowman's capsules with glomeruli in the cortex."
    ],
    "result": "All anatomical regions (cortex, medulla, pyramids, pelvis, nephrons) of the mammalian kidney were identified and sketched.",
    "errors": STD_BIO_ERRORS,
    "playRoute": "/student/lab-game/biology"
  },
  {
    "id": "x-bio-flower-whorls",
    "expNo": 6,
    "subject": "biology",
    "classLevel": "X",
    "board": "AKUEB",
    "title": "Dissection and Study of Floral Whorls of Brassica",
    "object": "To dissect a typical dicot flower (Brassica campestris / Mustard) and identify all four floral whorls.",
    "apparatus": "Fresh Brassica campestris flowers, dissecting microscope / hand lens, fine forceps, dissecting needles, white card sheet, razor blade.",
    "theory": [
      "A complete flower consists of four concentric floral whorls on a receptacle:",
      "1. Calyx: 4 green sepals. 2. Corolla: 4 yellow petals. 3. Androecium: 6 stamens (tetradynamous). 4. Gynoecium: Bicarpellary superior ovary."
    ],
    "method": [
      "Hold flower by pedicel and observe outer calyx; remove 4 sepals carefully using forceps and mount on white card.",
      "Remove 4 cruciform petals of corolla and arrange on card.",
      "Observe tetradynamous stamens, count 2 outer short stamens and 4 inner long stamens; sketch anthers and filaments.",
      "Isolate central pistil; make a thin transverse section (T.S.) of ovary and observe two locules under dissecting lens."
    ],
    "result": "All four floral whorls (Calyx, Corolla, Androecium, Gynoecium) dissected and mounted in proper botanical sequence.",
    "errors": STD_BIO_ERRORS,
    "playRoute": "/student/lab-game/biology"
  },
  {
    "id": "x-bio-mitosis-stages",
    "expNo": 7,
    "subject": "biology",
    "classLevel": "X",
    "board": "AKUEB",
    "title": "Microscopic Observation of Mitotic Stages in Onion Root Tip",
    "object": "To identify different stages of Mitosis (Prophase, Metaphase, Anaphase, Telophase) in permanent slides of onion root tip squash.",
    "apparatus": "Compound microscope, permanent stained slides of onion root tip (Allium cepa) showing mitotic cell division, lens paper.",
    "theory": [
      "Mitosis is equational somatic cell division producing two genetically identical daughter cells:",
      "Prophase: Chromatin condenses into chromosomes; nuclear envelope disappears.",
      "Metaphase: Chromosomes align along equatorial metaphase plate.",
      "Anaphase: Sister chromatids separate and migrate to opposite poles.",
      "Telophase: Chromosomes decondense at poles; nuclear envelopes reform."
    ],
    "method": [
      "Place the onion root tip slide on microscope stage and focus under low power (10×) to locate meristematic zone.",
      "Switch to high power (40×) and scan cells to locate distinct mitotic figures.",
      "Identify cells in Prophase, Metaphase, Anaphase, and Telophase.",
      "Draw labeled high-power schematic sketches of each mitotic phase."
    ],
    "result": "Identified and documented all successive morphological stages of mitotic karyokinesis.",
    "errors": STD_BIO_ERRORS,
    "playRoute": "/student/lab-game/biology"
  }
];

export const CS_X: JournalContent[] = [
  {
    "id": "x-cs-multiway-branching",
    "expNo": 1,
    "subject": "computer-science",
    "classLevel": "X",
    "board": "AKUEB",
    "title": "Multiway Branching: Switch-Case and Menu-Driven Applications",
    "object": "To implement a menu-driven arithmetic and geometric computation program using multiway branching (switch-case / match-case).",
    "apparatus": "C / Python programming IDE (VS Code / GCC).",
    "theory": [
      "Multiway branching evaluates an expression against multiple constant values or patterns for efficient dispatcher logic.",
      "Reduces nested conditional overhead and improves code readability."
    ],
    "method": [
      "Display interactive console menu: 1. Add, 2. Subtract, 3. Multiply, 4. Divide, 5. Exit.",
      "Read user choice and operands from standard input.",
      "Implement multiway branch dispatcher handling each arithmetic operation with divide-by-zero validation.",
      "Add default fallback for invalid menu selections and test in a continuous loop."
    ],
    "result": "Menu-driven console application with multiway branching successfully created and tested.",
    "errors": STD_CS_ERRORS
  },
  {
    "id": "x-cs-nested-loops",
    "expNo": 2,
    "subject": "computer-science",
    "classLevel": "X",
    "board": "AKUEB",
    "title": "Nested Loops: Pattern Printing and Prime Number Generation",
    "object": "To write programs utilizing nested loop constructs for 2D star/number pyramid patterns and finding prime numbers in a range.",
    "apparatus": "C / Python programming environment.",
    "theory": [
      "Nested loops consist of an outer loop controlling row progression and an inner loop managing column iterations.",
      "A number p > 1 is prime if it has no positive divisors other than 1 and p (tested up to √p)."
    ],
    "method": [
      "Write nested for loop to print a right-angled triangle number pyramid of height n.",
      "Write program to find all prime numbers between 1 and 100.",
      "Outer loop iterates through numbers 2 to 100; inner loop tests divisibility from 2 up to √n.",
      "Print all verified prime numbers with tab formatting."
    ],
    "result": "Nested loop algorithms generated pyramid patterns and correctly identified all primes from 1 to 100.",
    "errors": STD_CS_ERRORS
  },
  {
    "id": "x-cs-functions-modularity",
    "expNo": 3,
    "subject": "computer-science",
    "classLevel": "X",
    "board": "AKUEB",
    "title": "Modular Programming: User-Defined Functions and Scope",
    "object": "To implement modular user-defined functions with parameter passing by value, calculating mathematical combinations (nCr) and power (x^y).",
    "apparatus": "Python / C compiler environment.",
    "theory": [
      "Functions encapsulate reusable logic, enabling modularity and unit testability.",
      "Combination formula: nCr = n! / [r! × (n-r)!], computed using a reusable factorial() function."
    ],
    "method": [
      "Define function factorial(n) returning n!.",
      "Define function combination(n, r) calling factorial() to evaluate nCr.",
      "Implement validation checking n >= r >= 0.",
      "Execute test cases for 5C2 = 10 and 10C3 = 120."
    ],
    "result": "Modular function architecture implemented with clean parameter passing and accurate combinatorial results.",
    "errors": STD_CS_ERRORS
  },
  {
    "id": "x-cs-1d-array-operations",
    "expNo": 4,
    "subject": "computer-science",
    "classLevel": "X",
    "board": "AKUEB",
    "title": "One-Dimensional Arrays: Traversal, Linear Search, and Min/Max",
    "object": "To store, traverse, search, and compute minimum, maximum, and average values in a 1D numeric array.",
    "apparatus": "C / Python programming environment.",
    "theory": [
      "An array is a contiguous memory collection of elements of homogeneous data type accessed via zero-based indices array[i].",
      "Linear search scans elements sequentially from index 0 to N-1 with time complexity O(n)."
    ],
    "method": [
      "Declare an array of size N=10 and populate with integer inputs.",
      "Traverse array in a single loop to find minimum, maximum, and sum.",
      "Prompt user for search key; perform linear search and report found index or 'Not Found'.",
      "Display summary statistics (Min, Max, Mean)."
    ],
    "result": "Array traversal and linear search operations successfully executed with correct boundary detection.",
    "errors": STD_CS_ERRORS
  },
  {
    "id": "x-cs-2d-matrices",
    "expNo": 5,
    "subject": "computer-science",
    "classLevel": "X",
    "board": "AKUEB",
    "title": "Two-Dimensional Arrays: Matrix Addition and Transposition",
    "object": "To implement matrix addition and matrix transpose operations on 3x3 two-dimensional arrays.",
    "apparatus": "C / Python environment.",
    "theory": [
      "A 2D array represents mathematical matrices with rows and columns: matrix[row][col].",
      "Matrix addition: C[i][j] = A[i][j] + B[i][j]. Matrix transpose: A^T[j][i] = A[i][j]."
    ],
    "method": [
      "Input elements of two 3x3 matrices A and B using nested loops.",
      "Compute sum matrix C where C[i][j] = A[i][j] + B[i][j].",
      "Compute transpose A^T by assigning A^T[j][i] = A[i][j].",
      "Print formatted matrix grids to console."
    ],
    "result": "2D array matrix addition and transpose operations verified with sample test matrices.",
    "errors": STD_CS_ERRORS
  },
  {
    "id": "x-cs-web-layouts-css",
    "expNo": 6,
    "subject": "computer-science",
    "classLevel": "X",
    "board": "AKUEB",
    "title": "Web Development: Semantic HTML5 Structure and CSS Responsive Layouts",
    "object": "To design a multi-column responsive school web portal using semantic HTML5 elements, CSS Flexbox, and Media Queries.",
    "apparatus": "Code Editor (VS Code), Web Browser (Chrome/Firefox).",
    "theory": [
      "HTML5 semantic tags (<header>, <nav>, <main>, <article>, <section>, <footer>) improve document structure.",
      "CSS Flexbox provides flexible one-dimensional alignment, and @media queries enable responsive mobile adapting."
    ],
    "method": [
      "Write semantic HTML document containing header, navigation bar with links, 3-column content grid, and footer.",
      "Apply CSS reset, typography, and color tokens.",
      "Use display: flex; flex-wrap: wrap; gap: 1rem; for the responsive grid.",
      "Add media query @media (max-width: 768px) stacking cards into a single column on mobile viewports."
    ],
    "result": "Responsive multi-column web portal constructed and tested across mobile and desktop viewport sizes.",
    "errors": STD_CS_ERRORS
  }
];

// ==========================================

// CLASS XI PRACTICALS

// ==========================================

export const PHYSICS_XI: JournalContent[] = [
  {
    "id": "xi-phy-parallelogram-law",
    "expNo": 1,
    "subject": "physics",
    "classLevel": "XI",
    "board": "AKUEB",
    "title": "Verification of Parallelogram Law of Vectors",
    "object": "To verify the Parallelogram Law of Forces and determine the weight of an unknown body using Gravesand's apparatus.",
    "apparatus": "Gravesand's apparatus, two frictionless pulleys, slotted weights, unknown weight, mirror strip, drawing paper, metric ruler, protractor.",
    "formula": "R = √(P² + Q² + 2PQ cos θ) | W_unknown = R",
    "theory": [
      "If two forces P and Q acting simultaneously at a point are represented in magnitude and direction by two adjacent sides of a parallelogram, their resultant R is represented by the diagonal passing through that point.",
      "In three-force equilibrium: P + Q + W = 0 ⇒ Resultant R of P and Q is equal and opposite to W."
    ],
    "method": [
      "Fix drawing sheet on the vertical board. Pass threads with known weights P and Q over pulleys and suspend unknown weight W from junction O.",
      "Ensure junction O is free from friction. Mark the directions of the three strings using a plane mirror strip.",
      "Choose a suitable force scale (e.g. 50 g = 1 cm) and construct vectors OA (P) and OB (Q).",
      "Complete the parallelogram OACB; measure diagonal length OC to determine resultant R.",
      "Verify that OC is collinear with and equal in magnitude to suspended weight W."
    ],
    "result": "Parallelogram law verified; the weight of the unknown body is determined to be 1.96 N (200.0 g).",
    "errors": STD_PHYSICS_ERRORS,
    "playRoute": "/student/lab-game/physics"
  },
  {
    "id": "xi-phy-moments-triangle-forces",
    "expNo": 2,
    "subject": "physics",
    "classLevel": "XI",
    "board": "AKUEB",
    "title": "Verification of Principle of Moments and Triangle Law of Forces",
    "object": "To verify the conditions of rotational and translational equilibrium on a suspended meter bar.",
    "apparatus": "Uniform meter bar, sharp knife edges, spring balances (0-500g), slotted weights, thread loops.",
    "formula": "Σ F = 0 (Translational) | Σ τ = 0 (Rotational: Clockwise = Anticlockwise)",
    "theory": [
      "First condition of equilibrium: The vector sum of all coplanar forces acting on a body is zero (Σ F = 0).",
      "Second condition of equilibrium: The algebraic sum of all torques about any pivot point is zero (Σ τ = 0)."
    ],
    "method": [
      "Suspend the meter bar horizontally from two spring balances S₁ and S₂.",
      "Suspend known weights W₁ and W₂ at different positions along the bar.",
      "Record balance readings S₁ and S₂; verify that S₁ + S₂ = Total Weight (W_bar + W₁ + W₂).",
      "Take moments about the left suspension point: calculate Clockwise Moments and Anticlockwise Moments.",
      "Verify that Total Clockwise Moments equal Total Anticlockwise Moments."
    ],
    "result": "Both conditions of equilibrium verified: Net force ΣF = 0 and net torque Στ = 0.",
    "errors": STD_PHYSICS_ERRORS,
    "playRoute": "/student/lab-game/physics"
  },
  {
    "id": "xi-phy-freefall-g",
    "expNo": 3,
    "subject": "physics",
    "classLevel": "XI",
    "board": "AKUEB",
    "title": "Acceleration Due to Gravity by Free-Fall Method",
    "object": "To determine the acceleration due to gravity (g) by measuring the time of fall of a steel sphere using electronic photo-gates.",
    "apparatus": "Free-fall apparatus with electromagnet release, digital millisecond timer, electronic photo-gate sensors, steel sphere, plumb line, metric scale.",
    "formula": "h = (1/2) × g × t² ⇒ g = (2h) / t²",
    "theory": [
      "Under uniform gravitational acceleration with initial velocity u = 0, distance fallen h in time t is: h = (1/2) g t² ⇒ g = 2h / t².",
      "A graph of h (y-axis) vs t² (x-axis) yields a straight line with slope = g / 2."
    ],
    "method": [
      "Align the apparatus vertically using a plumb line.",
      "Set height h between the electromagnetic release and the lower optical photo-gate sensor to 100 cm.",
      "Release the steel sphere; the timer starts automatically and stops when the sphere triggers the photo-gate.",
      "Record fall time t in milliseconds; repeat for heights 120 cm, 140 cm, 160 cm, and 180 cm.",
      "Plot h vs t² and compute g from slope: g = 2 × Slope."
    ],
    "result": "The acceleration due to gravity is determined to be g = 9.81 m/s².",
    "errors": STD_PHYSICS_ERRORS,
    "playRoute": "/student/lab-game/physics"
  },
  {
    "id": "xi-phy-compound-pendulum",
    "expNo": 4,
    "subject": "physics",
    "classLevel": "XI",
    "board": "AKUEB",
    "title": "Acceleration Due to Gravity Using a Compound (Bar) Pendulum",
    "object": "To determine the value of 'g' and the radius of gyration (k) using a symmetric bar pendulum.",
    "apparatus": "Bar pendulum with holes drilled along its length, sharp knife-edge support, rigid wall bracket, stopwatch, telescopic vernier scale.",
    "formula": "g = 4π² × (L / T²) | k = √(l₁ × l₂)",
    "theory": [
      "For a rigid bar pendulum oscillating about a knife edge at distance l from centre of gravity (C.G.):",
      "Time Period T = 2π √[(l² + k²) / (g·l)] = 2π √(L / g), where L = l + (k² / l) is equivalent simple pendulum length.",
      "By plotting T vs distance from C.G. for both halves, L is obtained from distance between collinear points of equal time period."
    ],
    "method": [
      "Suspend the bar pendulum through hole 1 on the knife edge and oscillate through a small arc (< 4°).",
      "Record the time for 30 oscillations and compute time period T.",
      "Repeat for all consecutive holes towards the centre, invert the bar, and repeat for the opposite half.",
      "Plot T (y-axis) vs distance from C.G. (x-axis) to obtain two symmetrical U-shaped curves.",
      "Draw horizontal lines across curves to measure equivalent length L and compute g and k."
    ],
    "result": "Acceleration due to gravity g = 9.80 m/s²; radius of gyration about C.G. k = 28.8 cm.",
    "errors": STD_PHYSICS_ERRORS,
    "playRoute": "/student/lab-game/physics"
  },
  {
    "id": "xi-phy-spiral-spring-oscillations",
    "expNo": 5,
    "subject": "physics",
    "classLevel": "XI",
    "board": "AKUEB",
    "title": "Spring Constant by Dynamic Oscillations of a Spiral Spring",
    "object": "To determine the spring constant (k) and mass of an unknown body from vertical dynamic oscillations of a helical spring.",
    "apparatus": "Helical spring, vertical stand, slotted weights with hanger, unknown body, stopwatch, pointer with metric scale.",
    "formula": "T = 2π √(m_eff / k) ⇒ T² = (4π² / k) × (m + m_s/3)",
    "theory": [
      "The time period T of vertical simple harmonic oscillations of a loaded spring is: T = 2π √[(m + m_s / 3) / k].",
      "T² = (4π² / k) × m + C ⇒ Slope of T² vs m graph = 4π² / k."
    ],
    "method": [
      "Suspend spring with empty hanger (50g); pull down slightly and record time for 20 oscillations to calculate T.",
      "Add weights in steps of 50 g up to 300 g and measure oscillation period T for each load.",
      "Plot graph of T² (y-axis) vs suspended mass m (x-axis).",
      "Calculate spring constant k from slope: k = 4π² / Slope.",
      "Suspend unknown mass, measure its time period T_u, and read mass from the calibrated graph."
    ],
    "result": "Spring constant k = 29.4 N/m; mass of unknown body = 145.0 g.",
    "errors": STD_PHYSICS_ERRORS,
    "playRoute": "/student/lab-game/physics"
  },
  {
    "id": "xi-phy-youngs-modulus-searle",
    "expNo": 6,
    "subject": "physics",
    "classLevel": "XI",
    "board": "AKUEB",
    "title": "Young's Modulus of Elasticity by Searle's Apparatus",
    "object": "To determine Young's Modulus of elasticity (Y) of the material of a metal wire using Searle's apparatus.",
    "apparatus": "Searle's apparatus (two identical long wires with spirit level and micrometer screw), slotted weights (0.5 kg each), screw gauge, metric tape.",
    "formula": "Y = (M × g × L) / (π × r² × l)",
    "theory": [
      "Young's Modulus is the ratio of longitudinal tensile stress to longitudinal strain within elastic limit:",
      "Stress = (M · g) / (π · r²), Strain = l / L ⇒ Y = (M · g · L) / (π · r² · l)."
    ],
    "method": [
      "Measure length L of the experimental wire with a tape and its diameter at multiple points with a micrometer screw gauge to find radius r.",
      "Apply dead load (1 kg) to keep wires taut; adjust spirit level bubble to centre using micrometer screw; note initial reading.",
      "Add weights in increments of 0.5 kg up to 4.0 kg; level bubble and record micrometer reading during loading.",
      "Unload weights in steps, recording readings during unloading; compute mean elongation l for each load M.",
      "Plot elongation l vs mass M and compute Young's modulus Y from the linear slope."
    ],
    "result": "Young's modulus of the steel wire is determined to be Y = 2.0 × 10¹¹ N/m² (Pa).",
    "errors": STD_PHYSICS_ERRORS,
    "playRoute": "/student/lab-game/physics"
  },
  {
    "id": "xi-phy-surface-tension-capillary",
    "expNo": 7,
    "subject": "physics",
    "classLevel": "XI",
    "board": "AKUEB",
    "title": "Surface Tension of Water by Capillary Rise Method",
    "object": "To determine the surface tension (T) of water at room temperature using the capillary rise method.",
    "apparatus": "Travelling microscope, clean capillary tube of uniform fine bore, beaker of distilled water, adjustable clamp stand, pointer, thermometer.",
    "formula": "T = (r × h × ρ × g) / (2 × cos θ) ≈ (r × h × ρ × g) / 2",
    "theory": [
      "When a clean glass capillary dips into water (angle of contact θ ≈ 0°), upward surface tension force along circumference balances the weight of liquid column:",
      "2π · r · T · cos θ = π · r² · h · ρ · g ⇒ T = (r · h · ρ · g) / 2."
    ],
    "method": [
      "Clean capillary tube with chromic acid and rinse with distilled water.",
      "Mount capillary vertically in a beaker of water; attach pointer so its tip just touches the water surface.",
      "Focus travelling microscope crosswire on the bottom of meniscus of water inside the capillary; record vertical reading h₁.",
      "Focus microscope on the pointer tip touching the free liquid surface; record reading h₂; calculate capillary rise h = h₁ − h₂.",
      "Cut the capillary at the meniscus level, mount horizontally, and measure internal diameter 2r under travelling microscope."
    ],
    "result": "The surface tension of water at 25°C is determined to be T = 7.22 × 10⁻² N/m (72.2 dynes/cm).",
    "errors": STD_PHYSICS_ERRORS,
    "playRoute": "/student/lab-game/physics"
  },
  {
    "id": "xi-phy-resonance-tube-sound",
    "expNo": 8,
    "subject": "physics",
    "classLevel": "XI",
    "board": "AKUEB",
    "title": "Velocity of Sound in Air Using Resonance Tube",
    "object": "To determine the velocity of sound in air at room temperature and 0°C using a resonance tube apparatus and tuning forks of known frequencies.",
    "apparatus": "Resonance tube apparatus with water reservoir, set of calibrated tuning forks (256 Hz, 384 Hz, 512 Hz), rubber striking pad, vernier calipers, thermometer.",
    "formula": "v = 2 × f × (l₂ − l₁) | v₀ = v_t − 0.61 × t",
    "theory": [
      "In a closed resonance tube, resonance occurs at odd quarter wavelengths: l₁ + e = λ / 4 and l₂ + e = 3λ / 4.",
      "Subtracting eliminates end correction e: l₂ − l₁ = λ / 2 ⇒ λ = 2(l₂ − l₁).",
      "Velocity of sound at room temperature t °C: v = f · λ = 2f(l₂ − l₁). Normalized to 0°C: v₀ = v_t − 0.61·t."
    ],
    "method": [
      "Record room temperature t and measure internal diameter of resonance tube with Vernier calipers.",
      "Strike tuning fork (e.g. 512 Hz) on rubber pad and hold horizontally over tube mouth.",
      "Lower water level slowly until first loud resonance sound is heard; record air column length l₁.",
      "Lower water level further to locate second resonance length l₂; verify l₂ ≈ 3l₁.",
      "Repeat with 384 Hz and 256 Hz tuning forks; compute velocity of sound v and normalize to 0°C."
    ],
    "result": "Velocity of sound in air at 25°C is v = 346.5 m/s; normalized velocity at 0°C is v₀ = 331.2 m/s.",
    "errors": STD_PHYSICS_ERRORS,
    "playRoute": "/student/lab-game/physics"
  }
];

export const CHEMISTRY_XI: JournalContent[] = [
  {
    "id": "xi-chem-standard-oxalic-acid",
    "expNo": 1,
    "subject": "chemistry",
    "classLevel": "XI",
    "board": "AKUEB",
    "title": "Preparation of 0.1 M Standard Oxalic Acid Solution",
    "object": "To prepare 250 cm³ of 0.1 M primary standard hydrated Oxalic Acid (H₂C₂O₄·2H₂O) solution.",
    "apparatus": "250 cm³ volumetric flask, analytical balance, weight box, watch glass, beaker, wash bottle, glass funnel, pure crystalline hydrated oxalic acid.",
    "formula": "Mass (g) = M × Molar Mass × V(dm³) = 0.1 × 126.07 × 0.250 = 3.152 g",
    "theory": [
      "Hydrated oxalic acid (H₂C₂O₄·2H₂O, Molar Mass = 126.07 g/mol) is an excellent primary standard because it is available in high purity, has a stable crystalline composition, and is non-hygroscopic."
    ],
    "method": [
      "Accurately weigh 3.152 g of dry, pure oxalic acid crystals on a watch glass.",
      "Dissolve in 100 cm³ of distilled water in a beaker with gentle stirring.",
      "Transfer quantitatively into 250 cm³ measuring flask with washings.",
      "Add distilled water until lower meniscus touches calibration mark; invert flask 10 times to homogenize."
    ],
    "result": "250 cm³ of 0.100 M primary standard oxalic acid solution was successfully prepared.",
    "errors": STD_CHEM_ERRORS,
    "playRoute": "/student/lab-game/practical-xi-oxalic-acid"
  },
  {
    "id": "xi-chem-redox-titration-kmno4",
    "expNo": 2,
    "subject": "chemistry",
    "classLevel": "XI",
    "board": "AKUEB",
    "title": "Standardization of KMnO₄ Solution Against Oxalic Acid",
    "object": "To determine the exact molarity of Potassium Permanganate (KMnO₄) solution by redox titration against standard 0.1 M Oxalic Acid.",
    "apparatus": "Burette, 10 cm³ pipette, conical flask, thermometer, water bath / burner, standard 0.1 M oxalic acid, dil. H₂SO₄, KMnO₄ solution.",
    "formula": "2KMnO₄ + 5H₂C₂O₄ + 3H₂SO₄ → K₂SO₄ + 2MnSO₄ + 10CO₂ + 8H₂O ⇒ M_KMnO₄ = (2 × M_acid × V_acid) / (5 × V_KMnO₄)",
    "theory": [
      "Redox reaction in acidic medium: MnO₄⁻ + 8H⁺ + 5e⁻ → Mn²⁺ + 4H₂O | C₂O₄²⁻ → 2CO₂ + 2e⁻.",
      "KMnO₄ acts as its own self-indicator: endpoint is marked by the first persistent faint pink colour.",
      "Reaction must be carried out at 60–70 °C because the uncatalyzed initial reaction is slow."
    ],
    "method": [
      "Fill burette with dark purple KMnO₄ solution (read upper meniscus).",
      "Pipette 10 cm³ of 0.1 M oxalic acid into flask, add 10 cm³ of 1M dil. H₂SO₄.",
      "Heat the mixture to 60–70 °C on wire gauze.",
      "Titrate hot solution by adding KMnO₄ dropwise with vigorous swirling until faint pink colour persists for 30 seconds.",
      "Obtain three concordant readings and calculate molarity."
    ],
    "result": "The exact molarity of the KMnO₄ solution is determined to be 0.0202 M.",
    "errors": STD_CHEM_ERRORS,
    "playRoute": "/student/lab-game/practical-xi-kmno4"
  },
  {
    "id": "xi-chem-iron-mohrs-salt",
    "expNo": 3,
    "subject": "chemistry",
    "classLevel": "XI",
    "board": "AKUEB",
    "title": "Determination of Percentage of Iron in Mohr's Salt",
    "object": "To determine the percentage of Fe²⁺ in Mohr's salt (FeSO₄·(NH₄)₂SO₄·6H₂O) by titration against standardized 0.02 M KMnO₄.",
    "apparatus": "Burette, pipette, conical flask, standard 0.02 M KMnO₄, unknown Mohr's salt solution, dil. H₂SO₄.",
    "formula": "MnO₄⁻ + 5Fe²⁺ + 8H⁺ → Mn²⁺ + 5Fe³⁺ + 4H₂O ⇒ % Fe = (Mass of Fe calculated / Sample mass) × 100",
    "theory": [
      "Quantitative oxidation: 5Fe²⁺ ions are oxidized to 5Fe³⁺ by 1 MnO₄⁻ ion in cold acidic solution without heating.",
      "Theoretical percentage of Fe in pure Mohr's salt (M = 392.14 g/mol) = (55.85 / 392.14) × 100 = 14.24%."
    ],
    "method": [
      "Pipette 10 cm³ of Mohr's salt solution into conical flask; add 10 cm³ dil. H₂SO₄.",
      "Titrate against standard 0.02 M KMnO₄ in cold solution until permanent pale pink colour.",
      "Repeat for concordant burette readings.",
      "Calculate mass of Fe²⁺ in solution and compute percentage purity."
    ],
    "result": "The percentage of iron (Fe²⁺) in the given Mohr's salt sample is found to be 14.18%.",
    "errors": STD_CHEM_ERRORS,
    "playRoute": "/student/lab-game/practical-xi-mohrs-salt"
  },
  {
    "id": "xi-chem-iodometry-thiosulphate",
    "expNo": 4,
    "subject": "chemistry",
    "classLevel": "XI",
    "board": "AKUEB",
    "title": "Iodometric Titration: Standardization of Sodium Thiosulphate",
    "object": "To standardize Sodium Thiosulphate (Na₂S₂O₃) solution by iodometric titration against standard Potassium Iodate (KIO₃).",
    "apparatus": "Burette, pipette, conical flask, standard 0.01 M KIO₃, 10% KI solution, dil. H₂SO₄, Na₂S₂O₃ solution, freshly prepared 1% starch indicator.",
    "formula": "IO₃⁻ + 5I⁻ + 6H⁺ → 3I₂ + 3H₂O | I₂ + 2S₂O₃²⁻ → 2I⁻ + S₄O₆²⁻",
    "theory": [
      "Potassium iodate liberates an equivalent quantity of iodine (I₂) when treated with excess KI in acid medium.",
      "Liberated iodine is titrated with thiosulphate: I₂ + 2S₂O₃²⁻ → 2I⁻ + S₄O₆²⁻.",
      "Starch indicator is added near the endpoint (straw yellow) forming deep blue complex; sharp discharge of blue colour marks endpoint."
    ],
    "method": [
      "Pipette 10 cm³ standard KIO₃ into flask; add 10 cm³ of 10% KI and 5 cm³ dil. H₂SO₄.",
      "Titrate against Na₂S₂O₃ until colour fades to light straw yellow.",
      "Add 1 cm³ starch indicator (solution turns deep navy blue).",
      "Continue dropwise titration until blue colour is completely discharged to colourless."
    ],
    "result": "The exact molarity of the Sodium Thiosulphate solution is determined to be 0.0985 M.",
    "errors": STD_CHEM_ERRORS,
    "playRoute": "/student/lab-game/practical-xi-iodometry"
  },
  {
    "id": "xi-chem-heat-of-neutralization",
    "expNo": 5,
    "subject": "chemistry",
    "classLevel": "XI",
    "board": "AKUEB",
    "title": "Determination of Heat of Neutralization of Strong Acid and Base",
    "object": "To determine the enthalpy change of neutralization (ΔHneut) of strong acid (HCl) with strong base (NaOH) using a polystyrene calorimeter.",
    "apparatus": "Polystyrene cup calorimeter with lid and stirrer, sensitive 0.1°C thermometer, measuring cylinders, 1.0 M HCl, 1.0 M NaOH.",
    "formula": "q = (m_total × c × ΔT) + (W_cal × ΔT) ⇒ ΔH_neut = − (q / moles of water formed)",
    "theory": [
      "Heat of neutralization is the enthalpy change when one mole of water is formed by neutralization of hydrogen ions with hydroxide ions:",
      "H⁺(aq) + OH⁻(aq) → H₂O(l); theoretical standard value ΔH°neut = −57.3 kJ/mol for strong acid-strong base pairs."
    ],
    "method": [
      "Measure 50 cm³ of 1.0 M HCl into the calorimeter; record initial temperature T₁.",
      "Measure 50 cm³ of 1.0 M NaOH into a separate beaker; record temperature T₂ (take average T_initial).",
      "Quickly pour NaOH into calorimeter, close lid, stir continuously, and record highest temperature reached T_max.",
      "Calculate temperature rise ΔT = T_max − T_initial and compute ΔHneut per mole."
    ],
    "result": "The enthalpy of neutralization of HCl by NaOH is determined to be ΔHneut = −56.8 kJ/mol.",
    "errors": STD_CHEM_ERRORS,
    "playRoute": "/student/lab-game/practical-xi-heat-neutralization"
  },
  {
    "id": "xi-chem-heat-of-solution",
    "expNo": 6,
    "subject": "chemistry",
    "classLevel": "XI",
    "board": "AKUEB",
    "title": "Determination of Enthalpy of Solution of Ammonium Chloride",
    "object": "To determine the molar enthalpy of solution (ΔHsol) of Ammonium Chloride (NH₄Cl) in water.",
    "apparatus": "Polystyrene calorimeter, 0.1°C thermometer, balance, pure dry NH₄Cl powder, distilled water.",
    "formula": "ΔH_sol = (m_water × c × ΔT) / (m_salt / Molar Mass)",
    "theory": [
      "Dissolution of ammonium chloride is an endothermic process where lattice energy exceeds hydration enthalpy:",
      "NH₄Cl(s) + H₂O → NH₄⁺(aq) + Cl⁻(aq); ΔH_sol > 0 (temperature of water drops)."
    ],
    "method": [
      "Weigh 5.35 g (0.10 mol) of dry NH₄Cl.",
      "Measure 100 cm³ of distilled water into calorimeter; record initial steady temperature T₁.",
      "Add NH₄Cl powder quickly, stir continuously until dissolved, and record lowest temperature reached T₂.",
      "Calculate temperature drop ΔT = T₁ − T₂ and compute molar heat of solution."
    ],
    "result": "Enthalpy of solution of NH₄Cl is determined to be ΔHsol = +15.2 kJ/mol (endothermic).",
    "errors": STD_CHEM_ERRORS,
    "playRoute": "/student/lab-game/practical-xi-heat-solution"
  },
  {
    "id": "xi-chem-reaction-kinetics-thiosulphate",
    "expNo": 7,
    "subject": "chemistry",
    "classLevel": "XI",
    "board": "AKUEB",
    "title": "Reaction Kinetics: Effect of Concentration on Reaction Rate",
    "object": "To study the effect of concentration of reactants on the rate of reaction between Sodium Thiosulphate and Hydrochloric Acid.",
    "apparatus": "Conical flasks (100 cm³), graduated measuring cylinders, stopwatch, white tile marked with a dark cross 'X', 0.1 M Na₂S₂O₃, 1.0 M HCl.",
    "formula": "Na₂S₂O₃(aq) + 2HCl(aq) → 2NaCl(aq) + SO₂(g) + S(s)↓ + H₂O(l) ⇒ Rate ∝ (1 / t)",
    "theory": [
      "Colloidal sulfur precipitate gradually increases turbidity until the black cross 'X' beneath the flask becomes invisible.",
      "According to Collision Theory, reaction rate is directly proportional to reactant concentration: Rate ∝ [Na₂S₂O₃]."
    ],
    "method": [
      "Place conical flask over the cross mark on white tile.",
      "Add 50 cm³ 0.1 M Na₂S₂O₃, add 5 cm³ 1.0 M HCl, and start stopwatch immediately with gentle swirl.",
      "Look vertically down through the solution and stop the timer when the cross disappears completely; record time t.",
      "Repeat for 40 cm³, 30 cm³, 20 cm³, 10 cm³ of thiosulphate (diluted with water to 50 cm³ total volume).",
      "Plot graph of Concentration (x-axis) vs (1/t) (y-axis); verify direct proportionality."
    ],
    "result": "Graph of 1/t vs concentration is a straight line, confirming reaction rate is directly proportional to concentration.",
    "errors": STD_CHEM_ERRORS,
    "playRoute": "/student/lab-game/practical-xi-reaction-kinetics"
  },
  {
    "id": "xi-chem-paper-chromatography",
    "expNo": 8,
    "subject": "chemistry",
    "classLevel": "XI",
    "board": "AKUEB",
    "title": "Separation of Plant Pigments by Paper Chromatography",
    "object": "To separate chloroplast pigments (chlorophyll a, b, carotene, xanthophyll) from spinach leaves using ascending paper chromatography and determine Rf values.",
    "apparatus": "Whatman No. 1 chromatography paper strip, chromatographic chamber / boiling tube, capillary tube, mortar & pestle, fresh spinach leaves, acetone, petroleum ether solvent mixture (9:1).",
    "formula": "R_f = (Distance travelled by solute band) / (Distance travelled by solvent front)",
    "theory": [
      "Paper chromatography separates solutes based on relative partition coefficients between stationary cellulose water phase and mobile organic solvent phase.",
      "Pigment migration speed: Carotene (top/yellow-orange) > Xanthophyll (yellow) > Chlorophyll a (blue-green) > Chlorophyll b (bottom/yellow-green)."
    ],
    "method": [
      "Grind spinach leaves with 5 cm³ acetone and sand in mortar to prepare concentrated dark green pigment extract.",
      "Draw baseline 2 cm from bottom of chromatography strip; apply tiny spot of pigment extract using capillary, drying repeatedly to concentrate spot.",
      "Suspend strip vertically in chromatography chamber containing petroleum ether-acetone (9:1) solvent without submerging the spot.",
      "Allow solvent front to ascend 12-15 cm; remove strip, immediately mark solvent front with pencil, and outline coloured pigment bands.",
      "Measure migration distances and calculate Rf value for each pigment."
    ],
    "result": "Separated 4 distinct pigment bands: Chlorophyll b (Rf = 0.28), Chlorophyll a (Rf = 0.45), Xanthophyll (Rf = 0.71), Carotene (Rf = 0.95).",
    "errors": STD_CHEM_ERRORS,
    "playRoute": "/student/lab-game/practical-xi-chromatography"
  }
];

export const BIOLOGY_XI: JournalContent[] = [
  {
    "id": "xi-bio-mitosis-squash",
    "expNo": 1,
    "subject": "biology",
    "classLevel": "XI",
    "board": "AKUEB",
    "title": "Preparation and Study of Mitosis in Onion Root Tip Squash",
    "object": "To prepare a temporary acetocarmine / aceto-orcein stained squash mount of onion root tips and identify mitotic phases.",
    "apparatus": "Actively growing onion root tips, 1N HCl, 1% acetocarmine stain, glass slides, coverslips, Bunsen burner, filter paper.",
    "theory": [
      "Root apical meristem exhibits high mitotic activity.",
      "Hydrolysis with 1N HCl dissolves middle lamella (pectin) allowing cell separation; basic acetocarmine binds specifically with acidic nucleic acids in chromosomes."
    ],
    "method": [
      "Cut 2-3 mm apical tip of growing onion root.",
      "Warm in 1N HCl at 60°C for 5 minutes (maceration).",
      "Transfer root tip to glass slide, add drop of 1% acetocarmine stain, and warm gently over low flame without boiling.",
      "Place coverslip, cover with folded filter paper, and press down firmly with thumb (squash).",
      "Examine under 100× / 400×; identify Prophase, Metaphase, Anaphase, and Telophase."
    ],
    "result": "Successfully prepared squash mount showing clear chromosomes across all mitotic stages.",
    "errors": STD_BIO_ERRORS,
    "playRoute": "/student/lab-game/biology"
  },
  {
    "id": "xi-bio-blood-smear-wbc",
    "expNo": 2,
    "subject": "biology",
    "classLevel": "XI",
    "board": "AKUEB",
    "title": "Differential Staining of Human Blood Smear",
    "object": "To prepare a thin blood film and identify different types of blood cells (RBCs, Platelets, and WBC differential types: Neutrophils, Lymphocytes, Monocytes, Eosinophils).",
    "apparatus": "Compound microscope, clean grease-free glass slides, sterile lancet, Leishman's stain / Giemsa stain, distilled water buffer (pH 6.8), cedarwood oil for 100× oil immersion.",
    "theory": [
      "Leishman's stain contains methylene blue and eosin.",
      "Granulocytes: Neutrophils, Eosinophils, Basophils. Agranulocytes: Lymphocytes, Monocytes."
    ],
    "method": [
      "Clean fingertip with alcohol, prick with sterile lancet, place small drop of blood near end of slide.",
      "Using a smooth spreader slide at 45°, draw blood across slide to produce a uniform tongue-shaped monolayer smear with feathery tail.",
      "Air-dry smear, cover with Leishman's stain for 2 minutes, then add equal volume of buffer water for 10 minutes.",
      "Rinse gently with distilled water, blot dry, and examine under 40× and 100× oil immersion lens."
    ],
    "result": "Identified biconcave enucleated RBCs, platelets, and differential leukocytes (65% Neutrophils, 28% Lymphocytes, 5% Monocytes, 2% Eosinophils).",
    "errors": STD_BIO_ERRORS,
    "playRoute": "/student/lab-game/biology"
  },
  {
    "id": "xi-bio-amylase-temperature",
    "expNo": 3,
    "subject": "biology",
    "classLevel": "XI",
    "board": "AKUEB",
    "title": "Effect of Temperature on Salivary Amylase Activity",
    "object": "To determine the optimum temperature for the catalytic action of salivary amylase (ptyalin) on starch digestion.",
    "apparatus": "Water baths maintained at 10°C, 37°C, 60°C, 90°C, test tubes, spot plates, stopwatch, 1% starch solution, salivary amylase extract, Lugol's iodine solution.",
    "theory": [
      "Salivary amylase catalyzes hydrolysis of starch into maltose.",
      "Enzyme activity increases with temperature up to optimum (~37°C); beyond optimum, thermal agitation disrupts tertiary hydrogen bonds leading to irreversible protein denaturation."
    ],
    "method": [
      "Collect fresh saliva, dilute 1:10 with distilled water to prepare enzyme solution.",
      "Prepare 4 tubes with 5 cm³ 1% starch + 1 cm³ buffer; incubate at 10°C, 37°C, 60°C, and 90°C.",
      "Add 1 cm³ amylase to each tube; at 1-minute intervals, remove a drop and mix with iodine on spot plate.",
      "Record the time required for achromic point (iodine no longer turns blue-black)."
    ],
    "result": "Achromic point reached fastest at 37°C (4 minutes); slow at 10°C (18 min); no digestion at 90°C (enzyme denatured). Optimum temperature = 37°C.",
    "errors": STD_BIO_ERRORS,
    "playRoute": "/student/lab-game/biology"
  },
  {
    "id": "xi-bio-catalase-ph-substrate",
    "expNo": 4,
    "subject": "biology",
    "classLevel": "XI",
    "board": "AKUEB",
    "title": "Enzyme Kinetics: Effect of pH on Catalase Activity",
    "object": "To study the effect of pH on catalase enzyme activity from potato extract decomposing hydrogen peroxide (H₂O₂).",
    "apparatus": "Test tubes, measuring cylinder, buffer solutions (pH 3, 5, 7, 9, 11), 3% H₂O₂ solution, liquid detergent, potato catalase extract, metric ruler.",
    "formula": "2H₂O₂ --(Catalase)--> 2H₂O + O₂↑",
    "theory": [
      "Catalase protects living cells from oxidative stress by rapidly decomposing hydrogen peroxide into water and oxygen.",
      "Adding liquid detergent traps evolved O₂ gas as foam; height of foam column formed in 2 minutes measures enzyme velocity."
    ],
    "method": [
      "Prepare 5 test tubes containing 2 cm³ of buffer at pH 3, 5, 7, 9, and 11 respectively.",
      "Add 1 cm³ potato catalase extract and 2 drops of detergent to each tube.",
      "Add 2 cm³ of 3% H₂O₂ to all tubes simultaneously and start timer.",
      "Measure height of oxygen foam column (in mm) produced after exactly 2 minutes.",
      "Plot graph of pH (x-axis) vs Foam Height (y-axis)."
    ],
    "result": "Catalase demonstrated bell-shaped activity curve with maximum foam height (45 mm) at neutral pH 7.0 (optimum pH).",
    "errors": STD_BIO_ERRORS,
    "playRoute": "/student/lab-game/biology"
  },
  {
    "id": "xi-bio-biochemical-tests-macromolecules",
    "expNo": 5,
    "subject": "biology",
    "classLevel": "XI",
    "board": "AKUEB",
    "title": "Qualitative Identification of Biological Macromolecules",
    "object": "To perform systematic biochemical tests to identify reducing sugars, non-reducing sugars, starch, proteins, and lipids in food extracts.",
    "apparatus": "Test tubes, water bath, spot plates, Benedict's reagent, Iodine solution, Biuret reagent (1% CuSO₄ + 40% NaOH), Sudan III / Ethanol emulsion reagents.",
    "theory": [
      "Biuret test: Peptide bonds (-CONH-) form violet coordination complex with Cu²⁺ ions in alkaline medium.",
      "Emulsion test: Lipids dissolve in absolute ethanol and precipitate as milky white colloidal suspension when mixed with water."
    ],
    "method": [
      "Reducing Sugars: Benedict's test heated in boiling water bath (brick-red ppt).",
      "Starch: Lugol's iodine test at room temperature (blue-black colour).",
      "Proteins: Add 2 cm³ 40% NaOH + 4 drops 1% CuSO₄ to egg albumin solution (intense purple/violet colour).",
      "Lipids: Dissolve oil in 2 cm³ ethanol, decant into water (milky emulsion formed)."
    ],
    "result": "All major macromolecular groups (carbohydrates, proteins, lipids) conclusively identified.",
    "errors": STD_BIO_ERRORS,
    "playRoute": "/student/lab-game/biology"
  },
  {
    "id": "xi-bio-photosynthetic-pigments-chromatography",
    "expNo": 6,
    "subject": "biology",
    "classLevel": "XI",
    "board": "AKUEB",
    "title": "Chromatographic Separation of Chloroplast Pigments",
    "object": "To extract and separate photosynthetic pigments from green leaves using paper chromatography and calculate Rf values.",
    "apparatus": "Whatman No. 1 paper strip, chromatography developing jar, fresh spinach leaves, acetone, petroleum ether, benzene, capillary tube.",
    "theory": [
      "Photosystem antenna complexes contain multiple accessory pigments with distinct molecular weights and polarities.",
      "Separation order: Carotenes (least polar, migrate fastest) > Xanthophylls > Chlorophyll a > Chlorophyll b (most polar, binds strongest to paper)."
    ],
    "method": [
      "Extract pigments by crushing leaves in acetone with pestle and mortar.",
      "Apply concentrated spot on chromatography paper strip baseline.",
      "Develop in 9:1 petroleum ether:acetone solvent chamber for 25 minutes.",
      "Mark four distinct bands and calculate Rf values."
    ],
    "result": "Separated 4 chloroplast pigments: Carotene (yellow-orange, Rf 0.94), Xanthophyll (yellow, Rf 0.70), Chlorophyll a (blue-green, Rf 0.44), Chlorophyll b (yellow-green, Rf 0.26).",
    "errors": STD_BIO_ERRORS,
    "playRoute": "/student/lab-game/biology"
  },
  {
    "id": "xi-bio-oxygen-evolution-hydrilla",
    "expNo": 7,
    "subject": "biology",
    "classLevel": "XI",
    "board": "AKUEB",
    "title": "Demonstration of Oxygen Evolution in Photosynthesis",
    "object": "To demonstrate the evolution of oxygen gas during the light-dependent photochemical reaction of photosynthesis in an aquatic plant (Hydrilla).",
    "apparatus": "Large glass beaker, glass funnel, test tube, freshly cut Hydrilla twigs, water with pinch of NaHCO₃ (carbon source), table lamp, glowing wooden splint.",
    "theory": [
      "Photolysis of water in Photosystem II: 2H₂O --(Light/Mn-cluster)--> O₂↑ + 4H⁺ + 4e⁻.",
      "Evolved gas displaces water in inverted test tube and rekindles a glowing splint, proving it is pure oxygen."
    ],
    "method": [
      "Place fresh Hydrilla twigs with cut ends pointing upwards inside a glass funnel in a beaker of water.",
      "Invert a water-filled test tube over the stem of the funnel without letting air enter.",
      "Add 0.5 g NaHCO₃ to supply dissolved CO₂.",
      "Place apparatus in bright sunlight or 100W lamp for 3-4 hours.",
      "Observe continuous stream of gas bubbles collecting in the test tube.",
      "Lift test tube and introduce a glowing splint into mouth of tube; observe instant relighting with bright flame."
    ],
    "result": "Glowing splint burst into flame, confirming that the evolved gas during photosynthesis is oxygen (O₂).",
    "errors": STD_BIO_ERRORS,
    "playRoute": "/student/lab-game/biology"
  },
  {
    "id": "xi-bio-plant-anatomy-ts-root-stem",
    "expNo": 8,
    "subject": "biology",
    "classLevel": "XI",
    "board": "AKUEB",
    "title": "Comparative Microscopic Anatomy of Dicot and Monocot Stems",
    "object": "To prepare and study stained transverse sections (T.S.) of herbaceous Dicot stem (Sunflower) and Monocot stem (Maize).",
    "apparatus": "Compound microscope, fresh stems of Helianthus and Zea mays, razor blade, watch glasses, safranin stain, fast green stain, glycerine, slides, coverslips.",
    "theory": [
      "Dicot Stem: Vascular bundles arranged in a distinct ring around central pith; bundles are conjoint, collateral, open with cambium.",
      "Monocot Stem: Vascular bundles scattered throughout ground tissue; bundles are closed (no cambium)."
    ],
    "method": [
      "Take a fresh stem segment between finger and thumb; cut thin uniform transverse sections using sharp razor blade.",
      "Transfer sections to watch glass containing water; select thinnest transparent slices.",
      "Stain with safranin for 1 minute (stains xylem red) and fast green for 30 seconds (stains phloem green).",
      "Mount in glycerine under coverslip; examine under 10× and 40× objectives.",
      "Draw labeled schematic and high-power sector diagrams."
    ],
    "result": "Dicot stem ringed open vascular bundles and monocot stem scattered closed vascular bundles clearly distinguished.",
    "errors": STD_BIO_ERRORS,
    "playRoute": "/student/lab-game/biology"
  }
];

export const CS_XI: JournalContent[] = [
  {
    "id": "xi-cs-pointers-dynamic-memory",
    "expNo": 1,
    "subject": "computer-science",
    "classLevel": "XI",
    "board": "AKUEB",
    "title": "Pointers and Dynamic Memory Allocation",
    "object": "To allocate, manipulate, and deallocate dynamic 1D and 2D arrays using pointers and runtime memory operators (new/delete or malloc/free).",
    "apparatus": "C++ / C compiler environment (GCC/Clang).",
    "theory": [
      "A pointer variable stores the hexadecimal memory address of another variable.",
      "Dynamic allocation allocates memory on the Heap at runtime, preventing stack overflow and fixed buffer constraints.",
      "Deallocation prevents memory leaks."
    ],
    "method": [
      "Prompt user for runtime array size N.",
      "Allocate heap array dynamically using new int[N].",
      "Populate and traverse array elements using pointer arithmetic *(ptr + i).",
      "Compute sum, maximum, and average values.",
      "Free memory using delete[] ptr; and set pointer to nullptr."
    ],
    "result": "Dynamic memory allocation and pointer arithmetic operations verified without memory leaks.",
    "errors": STD_CS_ERRORS
  },
  {
    "id": "xi-cs-stack-data-structure",
    "expNo": 2,
    "subject": "computer-science",
    "classLevel": "XI",
    "board": "AKUEB",
    "title": "Linear Data Structures: Array Implementation of Stack (LIFO)",
    "object": "To implement a Stack data structure with Push, Pop, Peek, and IsEmpty operations, handling Overflow and Underflow conditions.",
    "apparatus": "C++ / Python programming environment.",
    "theory": [
      "Stack operates on Last-In, First-Out (LIFO) order.",
      "Key operations: push(val), pop(), peek(), isEmpty(). Applications: Expression evaluation, function call call-stack, backtracking."
    ],
    "method": [
      "Declare class Stack with internal array arr[MAX] and integer top = -1.",
      "Implement member functions push(), pop(), peek(), isEmpty(), isFull().",
      "Write interactive menu loop testing element insertions, deletions, and stack inspection.",
      "Test boundary conditions: popping from empty stack (Underflow) and pushing beyond capacity (Overflow)."
    ],
    "result": "Stack LIFO data structure operations implemented and verified against boundary conditions.",
    "errors": STD_CS_ERRORS
  },
  {
    "id": "xi-cs-queue-data-structure",
    "expNo": 3,
    "subject": "computer-science",
    "classLevel": "XI",
    "board": "AKUEB",
    "title": "Queue Data Structure: Circular Queue Implementation (FIFO)",
    "object": "To implement a Circular Queue data structure using an array with Enqueue and Dequeue operations.",
    "apparatus": "C++ / Python programming environment.",
    "theory": [
      "Queue operates on First-In, First-Out (FIFO) discipline.",
      "Linear queues suffer from false-overflow problem. Circular queue overcomes this by circular index wrapping: front = (front + 1) % MAX and rear = (rear + 1) % MAX."
    ],
    "method": [
      "Implement class CircularQueue with variables front, rear, count, and array data[CAPACITY].",
      "Implement enqueue(val) inserting at rear and incrementing modulo capacity.",
      "Implement dequeue() removing from front.",
      "Test queue wrap-around behavior after multiple enqueues and dequeues."
    ],
    "result": "Circular queue data structure implemented with correct FIFO ordering and modulo indexing.",
    "errors": STD_CS_ERRORS
  },
  {
    "id": "xi-cs-binary-search-linear-search",
    "expNo": 4,
    "subject": "computer-science",
    "classLevel": "XI",
    "board": "AKUEB",
    "title": "Searching Algorithms: Linear Search vs Binary Search Comparison",
    "object": "To implement and empirically compare the performance of Linear Search (O(n)) and Binary Search (O(log n)) on sorted arrays.",
    "apparatus": "C++ / Python programming environment.",
    "theory": [
      "Linear Search: Compares search target with each element sequentially (O(n) comparisons).",
      "Binary Search: Divide-and-conquer on sorted array; compares target with midpoint and halves search space each step (O(log n) comparisons)."
    ],
    "method": [
      "Generate sorted array of 1,000,000 integers.",
      "Implement iterative binarySearch(arr, key) returning index and comparison count.",
      "Implement linearSearch(arr, key) recording comparison count.",
      "Execute search for element at last index and element not present.",
      "Compare recorded iterations (Linear: 1,000,000 steps vs Binary: <= 20 steps)."
    ],
    "result": "Binary Search demonstrated exponential speedup over Linear Search, executing in <= 20 iterations.",
    "errors": STD_CS_ERRORS
  },
  {
    "id": "xi-cs-sorting-algorithms",
    "expNo": 5,
    "subject": "computer-science",
    "classLevel": "XI",
    "board": "AKUEB",
    "title": "Sorting Algorithms: Implementation of Bubble Sort, Selection Sort, and Insertion Sort",
    "object": "To implement, trace pass-by-pass, and compare the number of comparisons and swaps in Bubble Sort, Selection Sort, and Insertion Sort.",
    "apparatus": "C++ / Python programming environment.",
    "theory": [
      "Bubble Sort: Repeatedly swaps adjacent out-of-order elements.",
      "Selection Sort: Finds minimum element in unsorted subarray and swaps to beginning.",
      "Insertion Sort: Inserts current element into its correct sorted position in left subarray."
    ],
    "method": [
      "Write separate functions bubbleSort(), selectionSort(), and insertionSort() taking an array and size N.",
      "Add counters tracking total comparisons and element swaps.",
      "Test each algorithm on identical unsorted integer arrays [64, 25, 12, 22, 11].",
      "Print array state after each outer pass and display total comparison/swap metrics."
    ],
    "result": "All three sorting algorithms successfully sorted input arrays in O(n^2) time with step-by-step tracing.",
    "errors": STD_CS_ERRORS
  },
  {
    "id": "xi-cs-sql-ddl-dml",
    "expNo": 6,
    "subject": "computer-science",
    "classLevel": "XI",
    "board": "AKUEB",
    "title": "Relational Database Management: SQL DDL Schema and DML Queries",
    "object": "To create relational tables with Primary/Foreign Key constraints, populate data, and execute complex SQL queries with Aggregate functions and Joins.",
    "apparatus": "Relational DBMS (PostgreSQL / SQLite / MySQL).",
    "theory": [
      "DDL (Data Definition Language): CREATE TABLE, ALTER TABLE, DROP TABLE.",
      "DML (Data Manipulation Language): INSERT, UPDATE, DELETE, SELECT.",
      "Relational integrity enforced via PRIMARY KEY, FOREIGN KEY, NOT NULL, CHECK."
    ],
    "method": [
      "Execute DDL script creating Students(student_id PK, name, email) and Courses(course_id PK, title, credits) and Enrollments(student_id FK, course_id FK, grade).",
      "Insert 10 sample student and enrollment records.",
      "Write query using INNER JOIN retrieving student name and course titles enrolled.",
      "Write query using GROUP BY and COUNT() calculating enrollment count per course."
    ],
    "result": "Relational schema created, foreign key integrity enforced, and multi-table SQL queries successfully executed.",
    "errors": STD_CS_ERRORS
  }
];

// ==========================================
// CLASS XII PRACTICALS
// ==========================================

export const PHYSICS_XII: JournalContent[] = [
  {
    id: "practical-expansion",
    expNo: 1,
    subject: "physics",
    classLevel: "XII",
    board: "AKUEB",
    title: "Coefficient of Linear Expansion by Pullinger's Apparatus",
    object: "To determine the coefficient of linear expansion of the material of the given rod by Pullinger's apparatus.",
    apparatus: "Pullinger's apparatus with steel rod, dial gauge and adjustment screw, copper steam boiler, hot plate, heat-resistant rubber hoses with clamps, digital thermometer probe, condensate receiver and metre scale.",
    formula: "α = (L₂ − L₁) / [ L₀ (T₂ − T₁) ]",
    theory: [
      "The coefficient of linear expansion α of a solid is given by:",
      "α = (L₂ − L₁) / [ L₀ (T₂ − T₁) ]",
      "where (L₂ − L₁) is the increase in length of the rod; L₁ and L₂ are the initial and final dial gauge readings at temperatures T₁ and T₂. L₀ is the effective original length of the rod and (T₂ − T₁) is the rise in temperature.",
    ],
    method: [
      "Measure the effective length L₀ of the rod, fix its right end with the adjustment screw and bring the left end into light contact with the dial gauge probe.",
      "Clamp the boiler hose to the jacket inlet, leave the outlet hose open above a condensate receiver, and insert the digital thermometer probe into the central well.",
      "Note the initial temperature T₁ and the initial dial gauge reading (cold).",
      "Switch on the hot plate and pass steam from the boiler through the jacket until the thermometer and dial gauge readings are steady.",
      "Note the final temperature T₂ and the final dial gauge reading (hot), then switch off the hot plate.",
      "Find ΔL = (final − initial) reading and ΔT = T₂ − T₁, then compute α = ΔL / (L₀·ΔT).",
    ],
    observations: {
      parameters: [
        { label: "Original length of rod (L₀)", value: "60.0 cm = 0.60 m" },
        { label: "Least count of dial gauge", value: "0.001 mm" },
        { label: "Resolution of digital thermometer", value: "0.1 °C" },
        { label: "Initial temperature (T₁)", value: "30.0 °C" },
        { label: "Cold dial gauge reading (L₁)", value: "4.000 mm" },
        { label: "Final steady temperature (T₂)", value: "99.0 °C" },
        { label: "Hot dial gauge reading (L₂)", value: "4.497 mm" },
      ],
      tables: [
        {
          title: "Linear Expansion Readings Table",
          head: ["State", "Temperature (°C)", "Dial gauge reading (mm)", "ΔL (mm)"],
          rows: [
            ["Cold State (Initial)", "30.0", "4.000", "—"],
            ["Hot State (Steam passed)", "99.0", "4.497", "0.497"],
          ],
        },
      ],
      notes: [
        "Increase in length ΔL = L₂ − L₁ = 4.497 − 4.000 = 0.497 mm = 4.97 × 10⁻⁴ m",
        "Rise in temperature ΔT = T₂ − T₁ = 99.0 − 30.0 = 69.0 °C",
      ],
    },
    calculation: {
      formula: "α = (ΔL) / (L₀ · ΔT)",
      steps: [
        "Original length of the rod, L₀ = 0.60 m",
        "Measured increase in length, ΔL = 4.97 × 10⁻⁴ m",
        "Measured rise in temperature, ΔT = 69.0 °C",
        "α = (4.97 × 10⁻⁴) / (0.60 × 69.0)",
        "α = (4.97 × 10⁻⁴) / (41.4) = 1.20 × 10⁻⁵ °C⁻¹",
      ],
      finalValue: "1.20 × 10⁻⁵ °C⁻¹",
    },
    result: "The coefficient of linear expansion of the material of the rod = 1.20 × 10⁻⁵ °C⁻¹ (for steel).",
    errors: [
      "The whole rod may not attain the uniform temperature of the steam throughout.",
      "The resolution of the dial gauge and digital thermometer limits accuracy.",
      "Zero and parallax errors while taking readings on the dial gauge.",
      "Loss of heat from the exposed ends of the steam jacket.",
    ],
    precautions: [
      "Pass steam through the steam jacket steadily until the temperature becomes steady.",
      "Read the dial gauge square on and keep the digital thermometer probe seated in its well.",
      "Ensure the ends of the steam jacket are insulated to minimize heat losses.",
    ],
    playRoute: "/student/lab-game/practical-expansion",
  },
  {
    id: "practical-cooling",
    expNo: 2,
    subject: "physics",
    classLevel: "XII",
    board: "AKUEB",
    title: "Verification of Newton's Law of Cooling",
    object: "To study how a hot liquid cools and thereby verify Newton's law of cooling.",
    apparatus: "Graduated glass beaker, hot water (~90 °C), digital immersion probe, retort stand with clamp, glass stirrer, and stopwatch.",
    formula: "−dθ / dt = k(θ − θ_room)",
    theory: [
      "Newton's law of cooling states that the rate of loss of heat of a body is directly proportional to the excess of its temperature over the surroundings, provided the excess is small.",
      "−dθ / dt ∝ (θ − θ_room) ⇒ −dθ / dt = k(θ − θ_room)",
      "Hence a graph of log(θ − θ_room) against time is a straight line (Method 1), and the cooling constant found for equal intervals stays the same (Method 2).",
    ],
    method: [
      "Record room temperature θ_room and place the graduated beaker on the bench.",
      "Fill it about three-fourths with hot water (~90 °C). Clamp the digital probe with its metal tip immersed but clear of the glass.",
      "Start the stopwatch; stir gently and record the temperature every 30 s for 5 minutes.",
      "Find the excess temperature (θ − θ_room) for each reading and its log.",
      "Method 1: plot log(θ − θ_room) vs time. Method 2: find the cooling constant for each interval.",
    ],
    observations: {
      parameters: [
        { label: "Surrounding room temperature (θ_room)", value: "28.0 °C" },
        { label: "Initial hot water temperature", value: "90.0 °C" },
        { label: "Digital probe resolution", value: "0.1 °C" },
        { label: "Least count of stopwatch", value: "0.1 s" },
      ],
      tables: [
        {
          title: "Temperature vs Time Cooling Data",
          head: ["Time (min)", "Temp θ (°C)", "Excess Temp (θ − θ_room) (°C)", "log₁₀(θ − θ_room)", "Cooling Constant k (min⁻¹)"],
          rows: [
            ["0.0", "90.0", "62.0", "1.792", "—"],
            ["1.0", "81.6", "53.6", "1.729", "0.145"],
            ["2.0", "74.3", "46.3", "1.666", "0.146"],
            ["3.0", "68.0", "40.0", "1.602", "0.146"],
            ["4.0", "62.6", "34.6", "1.539", "0.145"],
            ["5.0", "57.9", "29.9", "1.475", "0.146"],
          ],
        },
      ],
      notes: [
        "Mean cooling constant k = (0.145 + 0.146 + 0.146 + 0.145 + 0.146) / 5 ≈ 0.146 min⁻¹",
      ],
    },
    calculation: {
      formula: "k = (Fall in Temp) / (Mean Excess Temp × Δt)",
      steps: [
        "For interval 1 (0–1 min): k₁ = (90.0 − 81.6) / (((90.0 + 81.6)/2 − 28.0) × 1) ≈ 0.145 min⁻¹",
        "Repeat for each one-minute interval using its measured temperature fall and mean excess temperature.",
        "Mean cooling constant k = (0.145 + 0.146 + 0.146 + 0.145 + 0.146) / 5 ≈ 0.146 min⁻¹",
      ],
      finalValue: "k ≈ 0.146 min⁻¹ (constant within ±5%)",
    },
    result: "Method 1: The graph of log(θ − θ_room) vs time is a downward straight line. Method 2: The rate of cooling per unit excess temperature remains constant (k ≈ 0.146 min⁻¹). Hence Newton's law of cooling is verified.",
    errors: [
      "Draughts of air over the beaker during the cooling cycle.",
      "Heat loss from conduction through the thermometer stem and base.",
      "The digital probe resolution limits fine reading accuracy.",
    ],
    precautions: [
      "Stir the liquid continuously and gently to ensure uniform temperature.",
      "Keep the beaker away from drafts of air and direct sunlight.",
      "Ensure the probe tip is fully immersed without touching the bottom or sides.",
    ],
    playRoute: "/student/lab-game/practical-cooling",
  },
  {
    id: "practical-voltmeter",
    expNo: 3,
    subject: "physics",
    classLevel: "XII",
    board: "AKUEB",
    title: "Resistance of a Voltmeter",
    object: "To determine the resistance of a voltmeter.",
    apparatus: "A moving-coil DC voltmeter (0–3 V), regulated 3.0 V supply, resistance box (0–5000 Ω), a one-way key, and insulated connecting leads.",
    formula: "X = (V · R) / (E − V)",
    theory: [
      "The resistance X of a voltmeter is given by:",
      "X = (V · R) / (E − V)",
      "where R is the resistance of the resistance box connected in series with the voltmeter, V is the voltage drop across the voltmeter, and E is the e.m.f. of the battery.",
    ],
    method: [
      "With the key open, connect source + to voltmeter +, voltmeter − to the key, and the key back to source −.",
      "Check polarity, close the key briefly, read E directly across the supply, then open the key.",
      "Insert the known resistance box between source + and voltmeter +, leaving the return leads in place.",
      "Set R, close the key briefly, and note the new voltmeter reading V.",
      "Compute the voltmeter resistance X = (V · R) / (E − V) each time and take the mean.",
    ],
    observations: {
      parameters: [
        { label: "Regulated supply voltage (E)", value: "3.00 V" },
        { label: "Least count of voltmeter", value: "0.05 V" },
        { label: "Resistance box range", value: "0 – 5000 Ω" },
      ],
      tables: [
        {
          title: "Voltmeter Deflection & Resistance Table",
          head: ["S.No.", "Series Res. R (Ω)", "Voltmeter V (V)", "Potential Drop (E − V) (V)", "Voltmeter Res. X (Ω)"],
          rows: [
            ["1", "1000", "2.00", "1.00", "2000"],
            ["2", "2000", "1.50", "1.50", "2000"],
            ["3", "3000", "1.20", "1.80", "2000"],
            ["4", "4000", "1.00", "2.00", "2000"],
          ],
        },
      ],
    },
    calculation: {
      formula: "X = (V · R) / (E − V)",
      steps: [
        "For R = 1000 Ω: X₁ = (2.00 × 1000) / (3.00 − 2.00) = 2000 Ω",
        "For R = 2000 Ω: X₂ = (1.50 × 2000) / (3.00 − 1.50) = 2000 Ω",
        "For R = 3000 Ω: X₃ = (1.20 × 3000) / (3.00 − 1.20) = 2000 Ω",
        "For R = 4000 Ω: X₄ = (1.00 × 4000) / (3.00 − 1.00) = 2000 Ω",
        "Mean resistance X = 2000 Ω",
      ],
      finalValue: "2000 Ω",
    },
    result: "The resistance of the given voltmeter, X = 2000 Ω.",
    errors: STD_PHYSICS_ERRORS,
    precautions: [
      "Check the red (+) and black (−) leads before closing the key.",
      "Insert keys firmly into the resistance box to avoid contact resistance.",
      "Open the key before changing connections and between readings.",
    ],
    playRoute: "/student/lab-game/practical-voltmeter",
  },
  {
    id: "practical-galvanometer",
    expNo: 4,
    subject: "physics",
    classLevel: "XII",
    board: "AKUEB",
    title: "Resistance of a Galvanometer by Half-Deflection Method",
    object: "To determine the resistance of a galvanometer by the half-deflection method.",
    apparatus: "A moving-coil galvanometer, a cell (1.5 V), a high-resistance box (H.R.B), a low-resistance box / shunt (L.R.B), two one-way keys (K₁, K₂) and connecting wires.",
    formula: "G = (R · S) / (R − S)",
    theory: [
      "With a high series resistance R the galvanometer gives a full deflection θ. When a shunt S is joined across it and adjusted so the deflection halves, the galvanometer resistance is:",
      "G = (R · S) / (R − S)",
      "Since R ≫ G, the shunt at half deflection is very nearly equal to G itself.",
    ],
    method: [
      "Connect the galvanometer in series with high resistance R, key K₁ and cell (shunt open).",
      "Take out high resistance R (say 4000 Ω) and adjust it for convenient full deflection θ; note R and θ.",
      "Close shunt key K₂ so shunt S is across the galvanometer.",
      "Adjust S until deflection falls to exactly half (θ/2); note S.",
      "Compute G = (R · S) / (R − S).",
    ],
    observations: {
      parameters: [
        { label: "Cell EMF (E)", value: "1.50 V" },
        { label: "Galvanometer full scale", value: "30 divisions" },
        { label: "High resistance box (HRB)", value: "0 – 10,000 Ω" },
        { label: "Shunt resistance box (LRB)", value: "0 – 100 Ω" },
      ],
      tables: [
        {
          title: "Half-Deflection Data Table",
          head: ["S.No.", "Series Res. R (Ω)", "Full Defl. θ (div)", "Shunt Res. S (Ω)", "Half Defl. θ/2 (div)", "Galvo Res. G (Ω)"],
          rows: [
            ["1", "2000", "30", "51.3", "15", "52.6"],
            ["2", "3000", "20", "50.8", "10", "51.7"],
            ["3", "4000", "15", "50.6", "7.5", "51.2"],
          ],
        },
      ],
    },
    calculation: {
      formula: "G = (R · S) / (R − S)",
      steps: [
        "Obs 1: G₁ = (2000 × 51.3) / (2000 − 51.3) = 102600 / 1948.7 = 52.6 Ω",
        "Obs 2: G₂ = (3000 × 50.8) / (3000 − 50.8) = 152400 / 2949.2 = 51.7 Ω",
        "Obs 3: G₃ = (4000 × 50.6) / (4000 − 50.6) = 202400 / 3949.4 = 51.2 Ω",
        "Mean Galvanometer Resistance G = (52.6 + 51.7 + 51.2) / 3 = 51.8 Ω ≈ 52 Ω",
      ],
      finalValue: "51.8 Ω ≈ 52 Ω",
    },
    result: "The resistance of the galvanometer G = 51.8 Ω ≈ 52 Ω.",
    errors: STD_PHYSICS_ERRORS,
    precautions: [
      "The series resistance R should be very large so that the full deflection θ remains on the scale.",
      "Ensure key K₁ is closed before K₂ to protect the galvanometer coil from sudden current surges.",
    ],
    playRoute: "/student/lab-game/practical-galvanometer",
  },
  {
    id: "practical-gas-pressure",
    expNo: 5,
    subject: "physics",
    classLevel: "XII",
    board: "AKUEB",
    title: "Pressure Coefficient of Air at Constant Volume",
    object: "To determine the pressure coefficient of air at constant volume.",
    apparatus: "A constant-volume air thermometer (Jolly's apparatus), a centigrade thermometer, a vertical stand, a beaker containing water and a stirrer, a tripod stand, a Bunsen burner, a spirit level and a set square.",
    formula: "γ = (P₁₀₀ − P₀) / (100 · P₀)",
    theory: [
      "The pressure coefficient of air γ at constant volume is given by:",
      "γ = (P₁₀₀ − P₀) / (100 · P₀)",
      "where P₀ and P₁₀₀ are the pressures of the gas at 0 °C and 100 °C respectively. A graph of pressure P against temperature θ is a straight line.",
    ],
    method: [
      "Note the atmospheric pressure from Fortin's barometer.",
      "Keep volume of trapped air fixed and place bulb in the water bath.",
      "Note manometer pressure P and bath temperature θ.",
      "Heat bath in steps, keeping volume constant, and record P and θ each time.",
      "Plot P against θ; slope ÷ P₀ gives the pressure coefficient.",
    ],
    observations: {
      parameters: [
        { label: "Atmospheric pressure (H)", value: "76.0 cm of Hg" },
        { label: "Pressure at 0 °C (ice bath) P₀", value: "76.0 cm of Hg" },
        { label: "Least count of manometer scale", value: "0.1 cm" },
        { label: "Least count of thermometer", value: "0.5 °C" },
      ],
      tables: [
        {
          title: "Pressure vs Temperature Readings Table",
          head: ["S.No.", "Bath Temp θ (°C)", "Manometer Diff h (cm)", "Total Pressure P = H + h (cm Hg)"],
          rows: [
            ["1", "0.0", "0.0", "76.0"],
            ["2", "25.0", "6.9", "82.9"],
            ["3", "50.0", "13.9", "89.9"],
            ["4", "75.0", "20.9", "96.9"],
            ["5", "100.0", "27.8", "103.8"],
          ],
        },
      ],
    },
    calculation: {
      formula: "γ = (P₁₀₀ − P₀) / (100 · P₀)",
      steps: [
        "Pressure at 0 °C, P₀ = 76.0 cm of Hg",
        "Pressure at 100 °C, P₁₀₀ = 103.8 cm of Hg",
        "Increase in pressure ΔP = P₁₀₀ − P₀ = 103.8 − 76.0 = 27.8 cm of Hg",
        "γ = 27.8 / (100 × 76.0) = 27.8 / 7600 = 0.00366 °C⁻¹",
        "γ ≈ (1) / (273.15) °C⁻¹",
      ],
      finalValue: "0.00366 °C⁻¹ (≈ 1/273 °C⁻¹)",
    },
    result: "The pressure coefficient of air at constant volume γ = 0.00366 °C⁻¹ (≈ 1/273 °C⁻¹).",
    errors: [
      "The air from the reference mark to the neck of the bulb may not be at the same temperature as the air in the bulb.",
      "The volume of air does not remain truly constant as the glass bulb expands with temperature.",
      "The enclosed air may not be totally free from moisture.",
    ],
    precautions: [
      "Keep mercury levels adjusted to the reference mark before taking each pressure reading to maintain constant volume.",
      "Stir water in the bath thoroughly so the whole air bulb reaches uniform temperature.",
    ],
    playRoute: "/student/lab-game/practical-gas-pressure",
  },
  {
    id: "practical-iv-lamp",
    expNo: 6,
    subject: "physics",
    classLevel: "XII",
    board: "AKUEB",
    title: "Current–Voltage Relation of a Tungsten Filament Lamp",
    object: "To study the relation between the current passing through a tungsten filament lamp and the potential difference applied across it.",
    apparatus: "A tungsten filament lamp, a battery / power supply, a rheostat, an ammeter, a voltmeter, a one-way key and connecting wires.",
    formula: "R = (V) / (I)",
    theory: [
      "For a metal at constant temperature, Ohm's law gives I ∝ V (a straight line). A filament heats up as current increases and resistance of tungsten rises with temperature.",
      "R = (V) / (I)  (increases as V increases)",
      "So the I–V graph is not a straight line — the lamp is a non-ohmic conductor.",
    ],
    method: [
      "Connect lamp in series with ammeter, rheostat, key and battery; voltmeter in parallel with lamp.",
      "Move rheostat to apply small voltage and note V and I.",
      "Increase voltage in steps and record V and I each time.",
      "Plot a graph of current I against voltage V.",
    ],
    observations: {
      parameters: [
        { label: "Lamp rating", value: "6 V, 0.6 A Tungsten Filament" },
        { label: "Least count of voltmeter", value: "0.1 V" },
        { label: "Least count of ammeter", value: "0.01 A" },
      ],
      tables: [
        {
          title: "Current vs Potential Difference Data Table",
          head: ["S.No.", "Voltage V (V)", "Current I (A)", "Calculated Resistance R = V/I (Ω)"],
          rows: [
            ["1", "1.0", "0.20", "5.00"],
            ["2", "2.0", "0.32", "6.25"],
            ["3", "3.0", "0.41", "7.32"],
            ["4", "4.0", "0.49", "8.16"],
            ["5", "5.0", "0.56", "8.93"],
            ["6", "6.0", "0.62", "9.68"],
          ],
        },
      ],
    },
    calculation: {
      formula: "R = (V) / (I)",
      steps: [
        "Plotting Current I (y-axis) against Voltage V (x-axis) yields a curve bending towards the voltage axis.",
        "The dynamic resistance R = (ΔV) / (ΔI) increases continuously from 5.00 Ω at 1.0 V to 9.68 Ω at 6.0 V.",
        "This non-linear characteristic confirms that tungsten does not obey Ohm's law over changing temperatures.",
      ],
      finalValue: "R increases from 5.00 Ω to 9.68 Ω (Non-Ohmic)",
    },
    result: "The current does not increase in direct proportion to voltage. The tungsten filament lamp is a non-ohmic conductor whose resistance increases with temperature.",
    errors: STD_PHYSICS_ERRORS,
    precautions: [
      "Do not exceed the maximum rated voltage of the tungsten filament lamp.",
      "Take readings promptly to avoid overheating the rheostat.",
    ],
    playRoute: "/student/lab-game/practical-iv-lamp",
  },
  {
    id: "practical-joule",
    expNo: 7,
    subject: "physics",
    classLevel: "XII",
    board: "AKUEB",
    title: "Mechanical Equivalent of Heat, J, by the Electrical Method",
    object: "To determine the mechanical equivalent of heat, J, by the electrical method.",
    apparatus: "A calorimeter with stirrer and immersion heating coil, ammeter, voltmeter, rheostat, battery, thermometer, stopwatch and known mass of water.",
    formula: "J = (V · I · t) / [ (m + w) · Δθ ]",
    theory: [
      "Electrical energy converted by heater: W = VIt (in joules). Heat gained by water: Q = (m + w)·Δθ (in calories, with c = 1 cal/g°C for water).",
      "J = (W) / (Q) = (V · I · t) / [ (m + w) · Δθ ]",
    ],
    method: [
      "Take known mass m of water in calorimeter and note initial temperature.",
      "Switch on heater and note steady voltmeter (V) and ammeter (I) readings.",
      "Run heater for measured time t, stirring gently.",
      "Note final temperature and calculate rise Δθ; compute J = (V · I · t) / [ (m + w) · Δθ ].",
    ],
    observations: {
      parameters: [
        { label: "Mass of empty copper calorimeter + stirrer (m₁)", value: "110.0 g" },
        { label: "Mass of calorimeter + stirrer + water (m₂)", value: "310.0 g" },
        { label: "Mass of water (m = m₂ − m₁)", value: "200.0 g" },
        { label: "Water equivalent of calorimeter (w)", value: "10.2 g" },
        { label: "Initial temperature (θ₁)", value: "22.0 °C" },
        { label: "Operating Voltage (V)", value: "6.00 V" },
        { label: "Operating Current (I)", value: "2.00 A" },
        { label: "Duration of heating (t)", value: "300 s (5.0 min)" },
        { label: "Final temperature (θ₂)", value: "26.2 °C" },
        { label: "Temperature rise (Δθ)", value: "4.2 °C" },
      ],
      tables: [
        {
          title: "Calorimetry & Electrical Readings Table",
          head: ["Parameter", "Measured Value", "Unit"],
          rows: [
            ["Mass of water (m)", "200.0", "g"],
            ["Water equivalent (w)", "10.2", "g"],
            ["Voltage (V)", "6.00", "V"],
            ["Current (I)", "2.00", "A"],
            ["Time (t)", "300", "s"],
            ["Temperature Rise (Δθ)", "4.2", "°C"],
          ],
        },
      ],
    },
    calculation: {
      formula: "J = (V · I · t) / [ (m + w) · Δθ ]",
      steps: [
        "Electrical Work W = V × I × t = 6.00 × 2.00 × 300 = 3600 Joules",
        "Heat Energy Q = (m + w) × Δθ = (200.0 + 10.2) × 4.2 = 210.2 × 4.2 = 882.8 Calories",
        "J = 3600 / 882.8 = 4.08 J cal⁻¹ (Standard accepted value: 4.184 J cal⁻¹)",
      ],
      finalValue: "4.08 J cal⁻¹ ≈ 4.18 J cal⁻¹",
    },
    result: "The mechanical equivalent of heat, J = 4.08 J cal⁻¹ ≈ 4.18 J cal⁻¹.",
    errors: [
      "Heat is lost from the calorimeter to surroundings via radiation and convection.",
      "The thermometer has a finite least count.",
      "The liquid may not be uniformly stirred throughout the heating cycle.",
    ],
    precautions: [
      "Keep the heating coil completely submerged below the water surface.",
      "Stir gently and continuously during heating and after switching off to record maximum temperature.",
    ],
    playRoute: "/student/lab-game/practical-joule",
  },
  {
    id: "practical-specific-heat",
    expNo: 8,
    subject: "physics",
    classLevel: "XII",
    board: "AKUEB",
    title: "Specific Heat Capacity of a Liquid by Electrical Method",
    object: "To determine the specific heat capacity of a liquid (water) by the electrical method.",
    apparatus: "Electrical calorimeter with stirrer and heating coil, ammeter, voltmeter, rheostat, power supply, thermometer, stopwatch, liquid sample.",
    formula: "c = (V · I · t) / (m · Δθ)",
    theory: [
      "Electrical energy supplied W = VIt. Heat gained Q = m·c·Δθ.",
      "c = (V · I · t) / (m · Δθ)",
      "where m is the mass of the liquid, Δθ its temperature rise and c its specific heat capacity.",
    ],
    method: [
      "Take known mass m of liquid in calorimeter and note initial temperature.",
      "Switch on heater and note steady voltmeter (V) and ammeter (I) readings.",
      "Run heater for measured time t, stirring gently.",
      "Note final temperature and find rise Δθ; compute c = (V · I · t) / (m · Δθ).",
    ],
    observations: {
      parameters: [
        { label: "Mass of calorimeter + stirrer (m₁)", value: "110.0 g" },
        { label: "Mass of calorimeter + liquid (m₂)", value: "310.0 g" },
        { label: "Mass of liquid (water) m", value: "200.0 g = 0.20 kg" },
        { label: "Initial temperature (θ₁)", value: "20.0 °C" },
        { label: "Voltmeter reading (V)", value: "12.00 V" },
        { label: "Ammeter reading (I)", value: "2.50 A" },
        { label: "Heating duration (t)", value: "240 s (4.0 min)" },
        { label: "Final temperature (θ₂)", value: "28.6 °C" },
        { label: "Temperature rise (Δθ)", value: "8.6 °C = 8.6 K" },
      ],
      tables: [
        {
          title: "Electrical Specific Heat Measurements Table",
          head: ["Parameter", "Value", "Unit"],
          rows: [
            ["Mass of liquid (m)", "0.20", "kg"],
            ["Voltage across coil (V)", "12.00", "V"],
            ["Current through coil (I)", "2.50", "A"],
            ["Heating time (t)", "240", "s"],
            ["Initial Temperature (θ₁)", "20.0", "°C"],
            ["Final Temperature (θ₂)", "28.6", "°C"],
            ["Temperature Rise (Δθ)", "8.6", "K"],
          ],
        },
      ],
    },
    calculation: {
      formula: "c = (V · I · t) / (m · Δθ)",
      steps: [
        "Electrical Energy Supplied W = V × I × t = 12.00 × 2.50 × 240 = 7200 Joules",
        "Heat Gained by Liquid Q = m × c × Δθ",
        "c = 7200 / (0.20 × 8.6) = 7200 / 1.72 = 4186 J kg⁻¹ K⁻¹",
        "Standard specific heat capacity of water = 4184 J kg⁻¹ K⁻¹",
      ],
      finalValue: "4186 J kg⁻¹ K⁻¹ (≈ 4.2 × 10³ J kg⁻¹ K⁻¹)",
    },
    result: "The specific heat capacity of the liquid (water), c ≈ 4200 J kg⁻¹ K⁻¹.",
    errors: [
      "Heat is lost from the calorimeter to the surroundings.",
      "The water equivalent of the calorimeter and stirrer is neglected.",
      "The thermometer has a finite least count.",
    ],
    precautions: [
      "Calorimeter should be well insulated within an outer jacket to minimize heat losses.",
      "Ensure ammeter and voltmeter readings remain constant throughout the heating interval.",
    ],
    playRoute: "/student/lab-game/practical-specific-heat",
  },
];

export const CHEMISTRY_XII: JournalContent[] = [
  {
    id: "practical-pb",
    expNo: 1,
    subject: "chemistry",
    classLevel: "XII",
    board: "AKUEB",
    title: "Detection of Lead(II) Ion (Pb²⁺) in Given Salt",
    object: "To identify the lead(II) basic radical (Pb²⁺) in the given salt sample.",
    apparatus: "Test tubes, test tube holder, burner, dropper, salt sample, dil. HCl, KI, K₂CrO₄, dil. H₂SO₄.",
    theory: [
      "Pb²⁺ belongs to Group I basic radicals. It precipitates with dil. HCl as white lead chloride: Pb²⁺ + 2Cl⁻ → PbCl₂ ↓ (soluble in boiling water).",
      "Confirmatory test: Pb²⁺ + K₂CrO₄ → PbCrO₄ ↓ (bright yellow precipitate).",
      "Confirmatory test with KI: Pb²⁺ + 2I⁻ → PbI₂ ↓ (golden yellow spangles on cooling).",
    ],
    method: [
      "Dissolve a pinch of salt in distilled water, add dil. HCl; a white precipitate of PbCl₂ forms.",
      "Boil the precipitate in water: it dissolves completely and recrystallizes as golden/white needles on cooling.",
      "To the hot solution, add potassium chromate (K₂CrO₄): yellow precipitate of PbCrO₄ confirms Pb²⁺.",
      "To another portion, add potassium iodide (KI): yellow PbI₂ precipitate forms.",
    ],
    result: "The basic radical present in the given salt is Pb²⁺ (Lead II).",
    errors: STD_CHEM_ERRORS,
    playRoute: "/student/lab-game/practical-pb",
  },
  {
    id: "practical-cu",
    expNo: 2,
    subject: "chemistry",
    classLevel: "XII",
    board: "AKUEB",
    title: "Detection of Copper(II) Ion (Cu²⁺) in Given Salt",
    object: "To identify the copper(II) basic radical (Cu²⁺) in the given salt sample.",
    apparatus: "Test tubes, H₂S generator / gas water, dil. HCl, NH₄OH, K₄[Fe(CN)₆], NaOH, dropper.",
    theory: [
      "Cu²⁺ belongs to Group IIA basic radicals. It precipitates with H₂S gas in acidic medium as black CuS: Cu²⁺ + H₂S → CuS ↓ + 2H⁺.",
      "With aqueous NH₄OH: Cu²⁺ + 4NH₃ → [Cu(NH₃)₄]²⁺ (deep royal blue tetraamminecopper(II) complex).",
      "Confirmatory test: 2Cu²⁺ + K₄[Fe(CN)₆] → Cu₂[Fe(CN)₆] ↓ (chocolate-brown precipitate).",
    ],
    method: [
      "Pass H₂S gas through acidified salt solution: a brownish-black precipitate of CuS forms.",
      "Dissolve the precipitate in hot dil. HNO₃ and add excess NH₄OH: a deep royal blue solution forms.",
      "Acidify with acetic acid and add potassium ferrocyanide K₄[Fe(CN)₆]: chocolate-brown precipitate confirms Cu²⁺.",
    ],
    result: "The basic radical present in the given salt is Cu²⁺ (Copper II).",
    errors: STD_CHEM_ERRORS,
    playRoute: "/student/lab-game/practical-cu",
  },
  {
    id: "practical-fe",
    expNo: 3,
    subject: "chemistry",
    classLevel: "XII",
    board: "AKUEB",
    title: "Detection of Iron(III) Ion (Fe³⁺) in Given Salt",
    object: "To identify the iron(III) basic radical (Fe³⁺) in the given salt sample.",
    apparatus: "Test tubes, solid NH₄Cl, NH₄OH, K₄[Fe(CN)₆], KCNS/NH₄SCN, dil. HCl.",
    theory: [
      "Fe³⁺ belongs to Group III basic radicals. Precipitates with NH₄OH in the presence of NH₄Cl as reddish-brown Fe(OH)₃.",
      "Confirmatory test: 4Fe³⁺ + 3[Fe(CN)₆]⁴⁻ → Fe₄[Fe(CN)₆]₃ ↓ (deep Prussian blue precipitate).",
      "Thiocyanate test: Fe³⁺ + SCN⁻ → [Fe(SCN)]²⁺ (blood-red colouration).",
    ],
    method: [
      "To salt solution add solid NH₄Cl and excess NH₄OH: a reddish-brown gelatinous precipitate of Fe(OH)₃ forms.",
      "Dissolve the precipitate in dil. HCl and divide into two parts.",
      "Part 1: Add potassium ferrocyanide K₄[Fe(CN)₆] → intense Prussian blue colour confirms Fe³⁺.",
      "Part 2: Add potassium thiocyanate (KCNS) → blood-red colouration confirms Fe³⁺.",
    ],
    result: "The basic radical present in the given salt is Fe³⁺ (Iron III).",
    errors: STD_CHEM_ERRORS,
    playRoute: "/student/lab-game/practical-fe",
  },
  {
    id: "practical-fe2",
    expNo: 4,
    subject: "chemistry",
    classLevel: "XII",
    board: "AKUEB",
    title: "Detection of Iron(II) Ion (Fe²⁺) in Given Salt",
    object: "To identify the iron(II) basic radical (Fe²⁺) in the given salt sample.",
    apparatus: "Test tubes, NaOH, NH₄OH, K₃[Fe(CN)₆] (ferricyanide), dil. H₂SO₄.",
    theory: [
      "Fe²⁺ belongs to Group III basic radicals. Precipitates with NaOH/NH₄OH as dirty green Fe(OH)₂ which turns brown on standing due to aerial oxidation to Fe(OH)₃.",
      "Confirmatory test: 3Fe²⁺ + 2[Fe(CN)₆]³⁻ → Fe₃[Fe(CN)₆]₂ ↓ (Turnbull's blue precipitate with potassium ferricyanide).",
    ],
    method: [
      "To salt solution add NaOH solution: dirty green precipitate of Fe(OH)₂ forms.",
      "Add potassium ferricyanide K₃[Fe(CN)₆] solution: deep Turnbull's blue precipitate confirms Fe²⁺.",
      "Add K₄[Fe(CN)₆] solution: light blue precipitate forms.",
    ],
    result: "The basic radical present in the given salt is Fe²⁺ (Iron II).",
    errors: STD_CHEM_ERRORS,
    playRoute: "/student/lab-game/practical-fe2",
  },
  {
    id: "practical-al",
    expNo: 5,
    subject: "chemistry",
    classLevel: "XII",
    board: "AKUEB",
    title: "Detection of Aluminium Ion (Al³⁺) in Given Salt",
    object: "To identify the aluminium basic radical (Al³⁺) in the given salt sample.",
    apparatus: "Test tubes, NH₄Cl, NH₄OH, NaOH, cobalt nitrate, filter paper, blue litmus.",
    theory: [
      "Al³⁺ belongs to Group III. Precipitates with NH₄OH in presence of NH₄Cl as white gelatinous Al(OH)₃.",
      "Al(OH)₃ is amphoteric and dissolves in excess NaOH to form sodium aluminate: Al(OH)₃ + OH⁻ → [Al(OH)₄]⁻.",
      "Lake test: Gelatinous Al(OH)₃ adsorbs blue litmus dye in alkaline solution, forming a floating blue lake.",
    ],
    method: [
      "To salt solution add solid NH₄Cl and NH₄OH: white gelatinous precipitate of Al(OH)₃ forms.",
      "Add NaOH dropwise: precipitate dissolves in excess NaOH.",
      "Lake test: Dissolve precipitate in dil. HCl, add 1 drop blue litmus (turns red), then add NH₄OH dropwise: a floating blue lake forms.",
    ],
    result: "The basic radical present in the given salt is Al³⁺ (Aluminium).",
    errors: STD_CHEM_ERRORS,
    playRoute: "/student/lab-game/practical-al",
  },
  {
    id: "practical-zn",
    expNo: 6,
    subject: "chemistry",
    classLevel: "XII",
    board: "AKUEB",
    title: "Detection of Zinc Ion (Zn²⁺) in Given Salt",
    object: "To identify the zinc basic radical (Zn²⁺) in the given salt sample.",
    apparatus: "Test tubes, H₂S gas, NH₄Cl, NH₄OH, NaOH, K₄[Fe(CN)₆].",
    theory: [
      "Zn²⁺ belongs to Group IV. Precipitates with H₂S in alkaline ammoniacal medium as greyish-white ZnS.",
      "With NaOH: Forms white precipitate of Zn(OH)₂ which dissolves in excess NaOH forming zincate [Zn(OH)₄]²⁻.",
      "Confirmatory test: Zn²⁺ + K₄[Fe(CN)₆] → Zn₂[Fe(CN)₆] ↓ (white/bluish-white precipitate).",
    ],
    method: [
      "To salt solution add NH₄Cl, NH₄OH, and pass H₂S: greyish-white precipitate of ZnS forms.",
      "Dissolve in dil. HCl and add NaOH dropwise: white precipitate forms and dissolves in excess NaOH.",
      "Add potassium ferrocyanide K₄[Fe(CN)₆]: bluish-white precipitate confirms Zn²⁺.",
    ],
    result: "The basic radical present in the given salt is Zn²⁺ (Zinc).",
    errors: STD_CHEM_ERRORS,
    playRoute: "/student/lab-game/practical-zn",
  },
  {
    id: "practical-ni",
    expNo: 7,
    subject: "chemistry",
    classLevel: "XII",
    board: "AKUEB",
    title: "Detection of Nickel Ion (Ni²⁺) in Given Salt",
    object: "To identify the nickel basic radical (Ni²⁺) in the given salt sample.",
    apparatus: "Test tubes, NH₄Cl, NH₄OH, H₂S gas, Dimethylglyoxime (DMG), NaOH.",
    theory: [
      "Ni²⁺ belongs to Group IV. Precipitates with H₂S in ammoniacal medium as black NiS.",
      "Confirmatory test (DMG test): Ni²⁺ + 2(DMG) + 2NH₄OH → [Ni(DMG)₂] ↓ (rosy red / bright scarlet red precipitate).",
    ],
    method: [
      "To salt solution add NH₄Cl, NH₄OH, and pass H₂S: black precipitate of NiS forms.",
      "Dissolve precipitate in aqua regia or conc. HNO₃ and neutralize with NH₄OH.",
      "Add a few drops of dimethylglyoxime (DMG) reagent: brilliant scarlet-red precipitate confirms Ni²⁺.",
    ],
    result: "The basic radical present in the given salt is Ni²⁺ (Nickel).",
    errors: STD_CHEM_ERRORS,
    playRoute: "/student/lab-game/practical-ni",
  },
  {
    id: "practical-co",
    expNo: 8,
    subject: "chemistry",
    classLevel: "XII",
    board: "AKUEB",
    title: "Detection of Cobalt Ion (Co²⁺) in Given Salt",
    object: "To identify the cobalt basic radical (Co²⁺) in the given salt sample.",
    apparatus: "Test tubes, NH₄Cl, NH₄OH, H₂S gas, KNO₂ (potassium nitrite), acetic acid, acetone / ether, NH₄SCN.",
    theory: [
      "Co²⁺ belongs to Group IV. Precipitates with H₂S in alkaline medium as black CoS.",
      "Fischer's Salt test: Co²⁺ + 7KNO₂ + 2CH₃COOH → K₃[Co(NO₂)₆] ↓ (yellow precipitate of potassium cobaltinitrite).",
      "Vogel's test: Co²⁺ + 4SCN⁻ → [Co(SCN)₄]²⁻ (blue complex soluble in ether/amyl alcohol).",
    ],
    method: [
      "Pass H₂S in presence of NH₄Cl and NH₄OH: black CoS forms.",
      "Dissolve in dil. HNO₃, add excess potassium nitrite (KNO₂) and acetic acid, and warm gently: yellow crystalline precipitate forms.",
      "Add ammonium thiocyanate (NH₄SCN) and ether: ether layer turns intense blue, confirming Co²⁺.",
    ],
    result: "The basic radical present in the given salt is Co²⁺ (Cobalt).",
    errors: STD_CHEM_ERRORS,
    playRoute: "/student/lab-game/practical-co",
  },
  {
    id: "practical-ba",
    expNo: 9,
    subject: "chemistry",
    classLevel: "XII",
    board: "AKUEB",
    title: "Detection of Barium Ion (Ba²⁺) in Given Salt",
    object: "To identify the barium basic radical (Ba²⁺) in the given salt sample.",
    apparatus: "Test tubes, (NH₄)₂CO₃, NH₄Cl, NH₄OH, K₂CrO₄, dil. H₂SO₄, platinum wire for flame test.",
    theory: [
      "Ba²⁺ belongs to Group V. Precipitates with (NH₄)₂CO₃ in presence of NH₄Cl/NH₄OH as white BaCO₃.",
      "Confirmatory test: Ba²⁺ + K₂CrO₄ → BaCrO₄ ↓ (yellow precipitate insoluble in acetic acid).",
      "Flame test: Barium salts impart an apple-green colour to the non-luminous Bunsen flame.",
    ],
    method: [
      "To salt solution add NH₄Cl, NH₄OH, and (NH₄)₂CO₃: white precipitate of BaCO₃ forms.",
      "Dissolve precipitate in warm dil. acetic acid.",
      "Add potassium chromate (K₂CrO₄) solution: bright yellow precipitate of BaCrO₄ confirms Ba²⁺.",
      "Perform flame test: persistent apple-green flame confirms Ba²⁺.",
    ],
    result: "The basic radical present in the given salt is Ba²⁺ (Barium).",
    errors: STD_CHEM_ERRORS,
    playRoute: "/student/lab-game/practical-ba",
  },
  {
    id: "practical-ca",
    expNo: 10,
    subject: "chemistry",
    classLevel: "XII",
    board: "AKUEB",
    title: "Detection of Calcium Ion (Ca²⁺) in Given Salt",
    object: "To identify the calcium basic radical (Ca²⁺) in the given salt sample.",
    apparatus: "Test tubes, (NH₄)₂CO₃, NH₄Cl, NH₄OH, (NH₄)₂C₂O₄ (ammonium oxalate), platinum wire for flame test.",
    theory: [
      "Ca²⁺ belongs to Group V. Precipitates with (NH₄)₂CO₃ as white CaCO₃.",
      "Confirmatory test: Ca²⁺ + (NH₄)₂C₂O₄ → CaC₂O₄ ↓ (white precipitate insoluble in acetic acid, soluble in dil. HCl).",
      "Flame test: Imparts brick-red colour to the non-luminous Bunsen flame.",
    ],
    method: [
      "To salt solution add NH₄Cl, NH₄OH, and (NH₄)₂CO₃: white precipitate of CaCO₃ forms.",
      "Dissolve in dil. acetic acid and add ammonium oxalate (NH₄)₂C₂O₄ solution: white precipitate of CaC₂O₄ confirms Ca²⁺.",
      "Perform flame test with conc. HCl on platinum wire: brick-red flame confirms Ca²⁺.",
    ],
    result: "The basic radical present in the given salt is Ca²⁺ (Calcium).",
    errors: STD_CHEM_ERRORS,
    playRoute: "/student/lab-game/practical-ca",
  },
  {
    id: "practical-mg",
    expNo: 11,
    subject: "chemistry",
    classLevel: "XII",
    board: "AKUEB",
    title: "Detection of Magnesium Ion (Mg²⁺) in Given Salt",
    object: "To identify the magnesium basic radical (Mg²⁺) in the given salt sample.",
    apparatus: "Test tubes, NH₄Cl, NH₄OH, Na₂HPO₄ (disodium hydrogen phosphate), Magneson reagent, NaOH.",
    theory: [
      "Mg²⁺ belongs to Group VI. It does not precipitate in Groups I-V.",
      "Confirmatory test: Mg²⁺ + NH₄OH + Na₂HPO₄ → Mg(NH₄)PO₄ ↓ (white crystalline precipitate of magnesium ammonium phosphate).",
      "Magneson test: In alkaline medium with Magneson reagent (p-nitrobenzeneazoresorcinol), Mg²⁺ forms a sky-blue precipitate / lake.",
    ],
    method: [
      "To original salt solution add solid NH₄Cl, excess NH₄OH, and disodium hydrogen phosphate (Na₂HPO₄): scratch inner tube wall with glass rod → white crystalline precipitate forms.",
      "Magneson test: Add 2 drops of Magneson reagent to salt solution, then add excess NaOH: sky-blue precipitate confirms Mg²⁺.",
    ],
    result: "The basic radical present in the given salt is Mg²⁺ (Magnesium).",
    errors: STD_CHEM_ERRORS,
    playRoute: "/student/lab-game/practical-mg",
  },
  {
    id: "practical-nh4",
    expNo: 12,
    subject: "chemistry",
    classLevel: "XII",
    board: "AKUEB",
    title: "Detection of Ammonium Ion (NH₄⁺) in Given Salt",
    object: "To identify the ammonium basic radical (NH₄⁺) in the given salt sample.",
    apparatus: "Test tubes, burner, NaOH solution, Nessler's reagent [K₂HgI₄], red litmus paper, glass rod with conc. HCl.",
    theory: [
      "NH₄⁺ is a zero group radical. Heated with NaOH, it liberates ammonia gas: NH₄⁺ + OH⁻ → NH₃ ↑ + H₂O.",
      "Ammonia turns moist red litmus blue and gives dense white fumes of NH₄Cl with a glass rod dipped in conc. HCl.",
      "Nessler's test: 2[HgI₄]²⁻ + NH₃ + 3OH⁻ → [Hg₂O·NH₂]I ↓ (brown precipitate of iodide of Millon's base) + 7I⁻ + 2H₂O.",
    ],
    method: [
      "Heat salt with 2 mL NaOH solution: pungent ammonia gas is evolved.",
      "Hold moist red litmus paper over the tube mouth (turns blue).",
      "Hold a glass rod dipped in conc. HCl near the mouth: dense white fumes of NH₄Cl form.",
      "Pass gas or add Nessler's reagent: intense brown precipitate confirms NH₄⁺.",
    ],
    result: "The basic radical present in the given salt is NH₄⁺ (Ammonium).",
    errors: STD_CHEM_ERRORS,
    playRoute: "/student/lab-game/practical-nh4",
  },
  {
    id: "practical-co3",
    expNo: 13,
    subject: "chemistry",
    classLevel: "XII",
    board: "AKUEB",
    title: "Detection of Carbonate Radical (CO₃²⁻) in Given Salt",
    object: "To identify the carbonate acidic radical (CO₃²⁻) in the given salt sample.",
    apparatus: "Test tubes, delivery tube, lime water [Ca(OH)₂], dil. HCl / dil. H₂SO₄, MgSO₄ solution, BaCl₂ solution.",
    theory: [
      "Carbonate belongs to dilute acid group: CO₃²⁻ + 2H⁺ → CO₂ ↑ + H₂O.",
      "CO₂ gas turns clear lime water milky: CO₂ + Ca(OH)₂ → CaCO₃ ↓ + H₂O.",
      "Confirmatory test: Soluble carbonates give a white precipitate of MgCO₃ on boiling with MgSO₄.",
    ],
    method: [
      "Treat salt with dil. HCl: brisk effervescence of a colourless, odourless gas (CO₂) occurs.",
      "Pass gas through lime water: lime water turns milky.",
      "Add MgSO₄ solution to salt solution and boil: white precipitate confirms CO₃²⁻.",
    ],
    result: "The acidic radical present in the given salt is CO₃²⁻ (Carbonate).",
    errors: STD_CHEM_ERRORS,
    playRoute: "/student/lab-game/practical-co3",
  },
  {
    id: "practical-so3",
    expNo: 14,
    subject: "chemistry",
    classLevel: "XII",
    board: "AKUEB",
    title: "Detection of Sulphite Radical (SO₃²⁻) in Given Salt",
    object: "To identify the sulphite acidic radical (SO₃²⁻) in the given salt sample.",
    apparatus: "Test tubes, dil. H₂SO₄, K₂Cr₂O₇ paper, acidified KMnO₄ solution, BaCl₂ solution.",
    theory: [
      "Sulphite belongs to dilute acid group: SO₃²⁻ + 2H⁺ → SO₂ ↑ + H₂O.",
      "SO₂ is a pungent gas smelling of burning sulphur. It reduces orange acidified K₂Cr₂O₇ to green Cr³⁺: K₂Cr₂O₇ + 3SO₂ + H₂SO₄ → Cr₂(SO₄)₃ (green) + K₂SO₄ + H₂O.",
      "It decolourises pink acidified KMnO₄ solution.",
    ],
    method: [
      "Add dil. H₂SO₄ to salt and warm: choking gas smelling of burning sulphur (SO₂) is evolved.",
      "Hold filter paper dipped in acidified K₂Cr₂O₇ over the tube: orange paper turns bright green.",
      "Add BaCl₂ to aqueous salt solution: white precipitate of BaSO₃ forms, soluble in dil. HCl.",
    ],
    result: "The acidic radical present in the given salt is SO₃²⁻ (Sulphite).",
    errors: STD_CHEM_ERRORS,
    playRoute: "/student/lab-game/practical-so3",
  },
  {
    id: "practical-no2",
    expNo: 15,
    subject: "chemistry",
    classLevel: "XII",
    board: "AKUEB",
    title: "Detection of Nitrite Radical (NO₂⁻) in Given Salt",
    object: "To identify the nitrite acidic radical (NO₂⁻) in the given salt sample.",
    apparatus: "Test tubes, dil. H₂SO₄, FeSO₄ solution, KI solution, starch solution, diphenylamine.",
    theory: [
      "Nitrite belongs to dilute acid group: 2NO₂⁻ + 2H⁺ → NO ↑ + NO₂ ↑ + H₂O (reddish-brown fumes).",
      "Ferrous sulphate test: NO + FeSO₄ → [Fe(H₂O)₅(NO)]SO₄ (dark brown/black colouration in cold solution without adding conc. H₂SO₄).",
      "KI-starch test: 2NO₂⁻ + 2I⁻ + 4H⁺ → 2NO + I₂ + 2H₂O; liberated I₂ turns starch solution deep blue.",
    ],
    method: [
      "Add dil. H₂SO₄ to salt: pale blue solution forms, evolving reddish-brown NO₂ fumes on warming.",
      "To salt solution add freshly prepared FeSO₄ and dil. acetic acid: dark brown/black colouration appears immediately.",
      "Add KI solution, dil. H₂SO₄, and starch solution: intense blue colour confirms NO₂⁻.",
    ],
    result: "The acidic radical present in the given salt is NO₂⁻ (Nitrite).",
    errors: STD_CHEM_ERRORS,
    playRoute: "/student/lab-game/practical-no2",
  },
  {
    id: "practical-cl",
    expNo: 16,
    subject: "chemistry",
    classLevel: "XII",
    board: "AKUEB",
    title: "Detection of Chloride Radical (Cl⁻) in Given Salt",
    object: "To identify the chloride acidic radical (Cl⁻) in the given salt sample.",
    apparatus: "Test tubes, conc. H₂SO₄, AgNO₃ solution, dil. HNO₃, NH₄OH, solid K₂Cr₂O₇, NaOH, lead acetate.",
    theory: [
      "Chloride belongs to concentrated acid group: Cl⁻ + H₂SO₄ → HCl ↑ + HSO₄⁻ (pungent fumes giving dense white fumes with NH₄OH rod).",
      "Silver Nitrate test: Cl⁻ + AgNO₃ → AgCl ↓ (curdy white precipitate, insoluble in HNO₃, completely soluble in NH₄OH).",
      "Chromyl Chloride test: 4NaCl + K₂Cr₂O₇ + 6H₂SO₄ → 2CrO₂Cl₂ ↑ (reddish-brown vapours) + 2KHSO₄ + 4NaHSO₄ + 3H₂O.",
    ],
    method: [
      "Heat salt with conc. H₂SO₄: colourless pungent HCl gas is evolved, producing thick white fumes with NH₄OH-dipped glass rod.",
      "To acidified salt solution (with dil. HNO₃), add AgNO₃ solution: curdy white precipitate forms, readily soluble in NH₄OH.",
      "Chromyl Chloride test: Heat salt + solid K₂Cr₂O₇ + conc. H₂SO₄; pass red vapours into NaOH (turns yellow), then add acetic acid and lead acetate → yellow precipitate of PbCrO₄ confirms Cl⁻.",
    ],
    result: "The acidic radical present in the given salt is Cl⁻ (Chloride).",
    errors: STD_CHEM_ERRORS,
    playRoute: "/student/lab-game/practical-cl",
  },
  {
    id: "practical-br",
    expNo: 17,
    subject: "chemistry",
    classLevel: "XII",
    board: "AKUEB",
    title: "Detection of Bromide Radical (Br⁻) in Given Salt",
    object: "To identify the bromide acidic radical (Br⁻) in the given salt sample.",
    apparatus: "Test tubes, conc. H₂SO₄, MnO₂, AgNO₃ solution, dil. HNO₃, NH₄OH, chlorine water, carbon disulphide (CS₂) / CCl₄.",
    theory: [
      "Bromide belongs to concentrated acid group: 2Br⁻ + 2H₂SO₄ → SO₂ + Br₂ ↑ (reddish-brown pungent fumes) + SO₄²⁻ + 2H₂O.",
      "Silver Nitrate test: Br⁻ + AgNO₃ → AgBr ↓ (pale yellow / light cream precipitate, sparingly soluble in NH₄OH).",
      "Layer test: 2Br⁻ + Cl₂ → 2Cl⁻ + Br₂; in CS₂ or CCl₄ layer, liberated Br₂ dissolves giving an orange-red layer.",
    ],
    method: [
      "Heat salt with conc. H₂SO₄ and a pinch of MnO₂: dense reddish-brown fumes of Br₂ are evolved.",
      "To acidified salt solution add AgNO₃: pale yellow precipitate of AgBr forms, sparingly soluble in excess NH₄OH.",
      "Layer test: To salt solution add freshly prepared chlorine water and 1 mL CS₂/CCl₄, shake vigorously: organic layer turns orange-red, confirming Br⁻.",
    ],
    result: "The acidic radical present in the given salt is Br⁻ (Bromide).",
    errors: STD_CHEM_ERRORS,
    playRoute: "/student/lab-game/practical-br",
  },
  {
    id: "practical-i",
    expNo: 18,
    subject: "chemistry",
    classLevel: "XII",
    board: "AKUEB",
    title: "Detection of Iodide Radical (I⁻) in Given Salt",
    object: "To identify the iodide acidic radical (I⁻) in the given salt sample.",
    apparatus: "Test tubes, conc. H₂SO₄, MnO₂, AgNO₃ solution, dil. HNO₃, NH₄OH, chlorine water, CS₂ / CCl₄, starch paper.",
    theory: [
      "Iodide belongs to concentrated acid group: 2I⁻ + 2H₂SO₄ → I₂ ↑ (dense violet vapours condensing on cooler parts) + SO₂ + SO₄²⁻ + 2H₂O.",
      "Silver Nitrate test: I⁻ + AgNO₃ → AgI ↓ (bright yellow precipitate, completely insoluble in NH₄OH).",
      "Layer test: 2I⁻ + Cl₂ → 2Cl⁻ + I₂; in CS₂/CCl₄, liberated I₂ gives an intense violet/purple layer.",
    ],
    method: [
      "Heat salt with conc. H₂SO₄ and MnO₂: intense violet vapours of I₂ turn moist starch paper blue.",
      "To acidified salt solution add AgNO₃: bright yellow precipitate of AgI forms, completely insoluble in NH₄OH.",
      "Layer test: Add chlorine water and CS₂/CCl₄, shake: organic layer turns brilliant violet/purple, confirming I⁻.",
    ],
    result: "The acidic radical present in the given salt is I⁻ (Iodide).",
    errors: STD_CHEM_ERRORS,
    playRoute: "/student/lab-game/practical-i",
  },
  {
    id: "practical-no3",
    expNo: 19,
    subject: "chemistry",
    classLevel: "XII",
    board: "AKUEB",
    title: "Detection of Nitrate Radical (NO₃⁻) by Brown-Ring Test",
    object: "To identify the nitrate acidic radical (NO₃⁻) in the given salt sample.",
    apparatus: "Test tubes, conc. H₂SO₄, copper turnings, freshly prepared FeSO₄ solution.",
    theory: [
      "Nitrate belongs to concentrated acid group: NO₃⁻ + H₂SO₄ + Cu → Cu(NO₃)₂ + NO₂ ↑ (dense brown fumes) + SO₂ + H₂O.",
      "Brown-Ring Test: 2NO₃⁻ + 4H₂SO₄ + 6FeSO₄ → 3Fe₂(SO₄)₃ + 2NO + 4H₂O + 2SO₄²⁻.",
      "[Fe(H₂O)₆]²⁺ + NO → [Fe(H₂O)₅(NO)]²⁺ (pentaaquanitrosyliron(II) complex — dark brown ring at the junction of two liquid layers).",
    ],
    method: [
      "Heat salt with conc. H₂SO₄ and copper turnings: dense reddish-brown fumes of NO₂ evolve, solution turns blue.",
      "Brown Ring Test: In a clean test tube, mix salt solution with equal volume of freshly prepared FeSO₄ solution.",
      "Incline tube and slowly add conc. H₂SO₄ down the inner wall without shaking: a distinct dark brown ring forms at the interface of the two layers.",
    ],
    result: "The acidic radical present in the given salt is NO₃⁻ (Nitrate).",
    errors: STD_CHEM_ERRORS,
    playRoute: "/student/lab-game/practical-no3",
  },
  {
    id: "practical-c2o4",
    expNo: 20,
    subject: "chemistry",
    classLevel: "XII",
    board: "AKUEB",
    title: "Detection of Oxalate Radical (C₂O₄²⁻) in Given Salt",
    object: "To identify the oxalate acidic radical (C₂O₄²⁻) in the given salt sample.",
    apparatus: "Test tubes, conc. H₂SO₄, lime water, CaCl₂ solution, dil. acetic acid, acidified KMnO₄ solution.",
    theory: [
      "Oxalate belongs to concentrated acid group: C₂O₄²⁻ + H₂SO₄ → CO ↑ + CO₂ ↑ + H₂O + SO₄²⁻.",
      "CO₂ turns lime water milky; CO burns with a faint blue flame.",
      "Confirmatory test: C₂O₄²⁻ + Ca²⁺ → CaC₂O₄ ↓ (white precipitate insoluble in acetic acid, soluble in dil. HCl).",
      "KMnO₄ test: Warm acidified oxalate solution decolourises pink KMnO₄: 5C₂O₄²⁻ + 2MnO₄⁻ + 16H⁺ → 2Mn²⁺ + 10CO₂ + 8H₂O.",
    ],
    method: [
      "Heat salt with conc. H₂SO₄: gases evolve; pass through lime water (turns milky).",
      "To salt solution add CaCl₂ solution: white precipitate of CaC₂O₄ forms.",
      "Warm precipitate with dil. H₂SO₄ and add 2 drops KMnO₄: pink colour is discharged, confirming C₂O₄²⁻.",
    ],
    result: "The acidic radical present in the given salt is C₂O₄²⁻ (Oxalate).",
    errors: STD_CHEM_ERRORS,
    playRoute: "/student/lab-game/practical-c2o4",
  },
  {
    id: "practical-so4",
    expNo: 21,
    subject: "chemistry",
    classLevel: "XII",
    board: "AKUEB",
    title: "Detection of Sulphate Radical (SO₄²⁻) in Given Salt",
    object: "To identify the sulphate acidic radical (SO₄²⁻) in the given salt sample.",
    apparatus: "Test tubes, BaCl₂ solution, dil. HCl, conc. HNO₃, lead acetate solution, ammonium acetate.",
    theory: [
      "Sulphate belongs to the special group (does not react with dil. or conc. H₂SO₄).",
      "Barium Chloride test: SO₄²⁻ + BaCl₂ → BaSO₄ ↓ (heavy white precipitate completely insoluble in conc. HCl and conc. HNO₃).",
      "Lead Acetate test: SO₄²⁻ + (CH₃COO)₂Pb → PbSO₄ ↓ (white precipitate soluble in hot ammonium acetate solution).",
    ],
    method: [
      "To aqueous salt solution add BaCl₂ solution: thick white precipitate of BaSO₄ forms.",
      "Add conc. HCl and boil: precipitate remains completely insoluble.",
      "To another portion, add lead acetate solution: white precipitate of PbSO₄ forms, soluble in hot ammonium acetate.",
    ],
    result: "The acidic radical present in the given salt is SO₄²⁻ (Sulphate).",
    errors: STD_CHEM_ERRORS,
    playRoute: "/student/lab-game/practical-so4",
  },
  {
    id: "practical-cro4",
    expNo: 22,
    subject: "chemistry",
    classLevel: "XII",
    board: "AKUEB",
    title: "Detection of Chromate Radical (CrO₄²⁻) in Given Salt",
    object: "To identify the chromate acidic radical (CrO₄²⁻) in the given salt sample.",
    apparatus: "Test tubes, dil. H₂SO₄, AgNO₃ solution, BaCl₂ solution, lead acetate solution, hydrogen peroxide (H₂O₂), ether.",
    theory: [
      "Chromate salts are bright yellow. In acidic medium, yellow CrO₄²⁻ turns orange dichromate: 2CrO₄²⁻ + 2H⁺ ⇌ Cr₂O₇²⁻ (orange) + H₂O.",
      "Silver Nitrate test: CrO₄²⁻ + 2AgNO₃ → Ag₂CrO₄ ↓ (brick-red precipitate).",
      "Chromium Peroxide test: Acidified chromate + H₂O₂ + ether → deep blue CrO₅ (chromium pentoxide) in the upper ether layer.",
    ],
    method: [
      "Acidify yellow salt solution with dil. H₂SO₄: colour changes from bright yellow to orange.",
      "Add AgNO₃ solution: characteristic brick-red precipitate of Ag₂CrO₄ forms.",
      "Add BaCl₂ solution: yellow precipitate of BaCrO₄ forms.",
      "Peroxide test: Add dil. H₂SO₄, 1 mL ether, and 2 drops H₂O₂, shake: upper ether layer turns deep blue, confirming CrO₄²⁻.",
    ],
    result: "The acidic radical present in the given salt is CrO₄²⁻ (Chromate).",
    errors: STD_CHEM_ERRORS,
    playRoute: "/student/lab-game/practical-cro4",
  },
  {
    id: "practical-phenol",
    expNo: 23,
    subject: "chemistry",
    classLevel: "XII",
    board: "AKUEB",
    title: "Identification of Phenolic Functional Group (-OH)",
    object: "To identify the phenolic (-OH) functional group in an organic compound.",
    apparatus: "Test tubes, neutral FeCl₃ solution, bromine water, blue litmus paper, phthalic anhydride, conc. H₂SO₄, NaOH.",
    theory: [
      "Phenols are weak acids (turn moist blue litmus paper faint red; do not liberate CO₂ with NaHCO₃).",
      "Ferric Chloride test: 6C₆H₅OH + FeCl₃ → [Fe(OC₆H₅)₆]³⁻ (violet/blue/green coordination complex) + 3H⁺ + 3Cl⁻.",
      "Bromine Water test: C₆H₅OH + 3Br₂ → 2,4,6-tribromophenol ↓ (white precipitate with antiseptic medicinal smell) + 3HBr.",
    ],
    method: [
      "Litmus test: Place 1 drop of sample on moist blue litmus paper (turns red; no effervescence with NaHCO₃).",
      "FeCl₃ test: Take 1 mL of aqueous/alcoholic phenol in a test tube, add 2-3 drops of freshly prepared neutral FeCl₃: intense violet colouration forms.",
      "Bromine water test: Add bromine water dropwise with shaking: white precipitate of 2,4,6-tribromophenol confirms phenol.",
    ],
    result: "The organic compound contains the Phenolic (-OH) functional group.",
    errors: STD_CHEM_ERRORS,
    playRoute: "/student/lab-game/practical-phenol",
  },
  {
    id: "practical-aldehyde",
    expNo: 24,
    subject: "chemistry",
    classLevel: "XII",
    board: "AKUEB",
    title: "Identification of Aldehydic (-CHO) and Ketonic (>C=O) Functional Groups",
    object: "To identify the aldehyde and ketone carbonyl functional groups using 2,4-DNP, Tollens', and Fehling's reagents.",
    apparatus: "Test tubes, water bath, 2,4-DNP reagent, Tollens' reagent [Ag(NH₃)₂]⁺, Fehling's solutions A & B, Benedict's reagent, Schiff's reagent.",
    theory: [
      "Both aldehydes and ketones contain carbonyl (>C=O) and form orange-red hydrazone precipitates with 2,4-DNP.",
      "Aldehydes are strong reducing agents and reduce Tollens' reagent to metallic silver (silver mirror) and Fehling's to red Cu₂O.",
      "Ketones do not reduce Tollens' or Fehling's reagents.",
    ],
    method: [
      "2,4-DNP test: Add 2,4-dinitrophenylhydrazine to 1 mL sample: bright yellow/orange-red precipitate confirms carbonyl group.",
      "Tollens' test: In a clean test tube, mix 1 mL Tollens' reagent + 0.5 mL sample, warm in water bath (60°C): brilliant silver mirror forms on inner glass wall.",
      "Fehling's test: Mix 1 mL Fehling A + 1 mL Fehling B, add sample, boil: brick-red precipitate of Cu₂O confirms aldehyde.",
    ],
    result: "The organic compound contains the Aldehydic (-CHO) functional group.",
    errors: STD_CHEM_ERRORS,
    playRoute: "/student/lab-game/practical-aldehyde",
  },
  {
    id: "practical-cooh",
    expNo: 25,
    subject: "chemistry",
    classLevel: "XII",
    board: "AKUEB",
    title: "Identification of Carboxylic Acid Functional Group (-COOH)",
    object: "To identify the carboxylic acid (-COOH) functional group in an organic compound.",
    apparatus: "Test tubes, blue litmus paper, solid NaHCO₃ / Na₂CO₃, lime water, ethanol, conc. H₂SO₄, neutral FeCl₃.",
    theory: [
      "Carboxylic acids are moderately strong acids. They turn blue litmus red and liberate CO₂ gas with NaHCO₃: R-COOH + NaHCO₃ → R-COONa + H₂O + CO₂ ↑.",
      "Esterification test: R-COOH + R'-OH → (conc. H₂SO₄) → R-COOR' (fruity-smelling ester) + H₂O.",
      "Ferric Chloride test: Neutralized acid forms a buff-coloured precipitate with neutral FeCl₃.",
    ],
    method: [
      "Sodium bicarbonate test: Add a pinch of solid NaHCO₃ to 1 mL sample: brisk effervescence of CO₂ gas turns lime water milky.",
      "Ester test: Warm 1 mL acid + 1 mL ethanol + 3 drops conc. H₂SO₄ in water bath for 5 mins; pour into beaker of water containing Na₂CO₃: distinct sweet fruity smell confirms -COOH.",
    ],
    result: "The organic compound contains the Carboxylic Acid (-COOH) functional group.",
    errors: STD_CHEM_ERRORS,
    playRoute: "/student/lab-game/practical-cooh",
  },
  {
    id: "practical-starch",
    expNo: 26,
    subject: "chemistry",
    classLevel: "XII",
    board: "AKUEB",
    title: "Enzymatic Digestion of Starch by Salivary Amylase and Iodine Test",
    object: "To study the enzymatic hydrolysis of starch by salivary amylase using the iodine indicator test.",
    apparatus: "Test tubes, water bath (37°C), porcelain spotting tile, dropper, stopwatch, 1% starch solution, salivary amylase (dilute saliva), iodine solution.",
    theory: [
      "Starch is a helical polysaccharide (amylose + amylopectin) that traps I₂ molecules to form a deep blue-black coordination complex.",
      "Amylase enzyme breaks α-1,4-glycosidic bonds in starch, degrading it into dextrins, maltose, and glucose: (C₆H₁₀O₅)ₙ + nH₂O → nC₁₂H₂₂O₁₁.",
      "As starch is digested, the blue-black colour with iodine fades until the achromic point (no colour change) is reached.",
    ],
    method: [
      "Prepare wells of iodine drops on a white porcelain tile.",
      "Mix 5 mL of 1% starch solution and 1 mL of amylase enzyme at 37°C in a water bath.",
      "At 1-minute intervals, withdraw 1 drop of reaction mixture and add to an iodine spot.",
      "Observe progression: Blue-black → Violet → Red-brown → Light brown → Colourless (achromic point at ~4 minutes).",
    ],
    result: "Starch was successfully digested by amylase into non-iodine-reactive reducing sugars.",
    errors: STD_CHEM_ERRORS,
    playRoute: "/student/lab-game/practical-starch",
  },
  {
    id: "practical-glucose",
    expNo: 27,
    subject: "chemistry",
    classLevel: "XII",
    board: "AKUEB",
    title: "Detection of Glucose as a Reducing Sugar (Benedict's and Fehling's Tests)",
    object: "To detect glucose in a given biochemical sample using Benedict's and Fehling's reduction tests.",
    apparatus: "Test tubes, test tube holder, water bath / Bunsen burner, dropper, glucose sample solution, Benedict's qualitative reagent, Fehling's A & B.",
    theory: [
      "Glucose possesses a free open-chain aldehyde group (-CHO) capable of reducing cupric ions (Cu²⁺) in alkaline solution to insoluble red cuprous oxide (Cu₂O).",
      "Reaction: R-CHO + 2Cu²⁺ + 5OH⁻ → R-COO⁻ + Cu₂O ↓ (brick-red precipitate) + 3H₂O.",
      "Precipitate colour reflects sugar concentration: Green (<0.5%) → Yellow (1%) → Orange (1.5%) → Brick-red (≥2.0%).",
    ],
    method: [
      "Benedict's test: Add 2 mL Benedict's reagent to 1 mL glucose solution. Heat in boiling water bath for 3 minutes: colour changes from clear blue to green, yellow, orange, and finally heavy brick-red precipitate.",
      "Fehling's test: Mix equal volumes of Fehling A and B, add glucose sample, boil: brick-red precipitate of Cu₂O confirms reducing sugar.",
    ],
    result: "The sample contains Glucose (confirmed as an active reducing sugar).",
    errors: STD_CHEM_ERRORS,
    playRoute: "/student/lab-game/practical-glucose",
  },
  {
    id: "practical-protein",
    expNo: 28,
    subject: "chemistry",
    classLevel: "XII",
    board: "AKUEB",
    title: "Protein Denaturation and Precipitation Tests",
    object: "To demonstrate protein denaturation by heat, heavy metal salts (CuSO₄, Pb(CH₃COO)₂), and organic solvents/acids.",
    apparatus: "Test tubes, burner, egg albumin / milk casein solution, dil. HNO₃, 10% NaOH, 1% CuSO₄, 5% lead acetate, absolute ethanol, urea.",
    theory: [
      "Denaturation disrupts secondary, tertiary, and quaternary structures of globular proteins without cleaving primary peptide bonds.",
      "Heat and chemicals disrupt hydrogen bonds, ionic salt bridges, and hydrophobic interactions, causing unfolding and insoluble coagulation.",
      "Biuret test: Peptide bonds (-CONH-) react with Cu²⁺ in alkaline medium giving purple colour.",
      "Xanthoproteic test: Aromatic amino acids (tyrosine, tryptophan) react with conc. HNO₃ giving yellow colour turning orange with NH₄OH.",
    ],
    method: [
      "Heat coagulation: Heat 2 mL egg albumin in a test tube: protein coagulates into an opaque white solid curd.",
      "Heavy metal precipitation: Add lead acetate or CuSO₄ dropwise: dense white/blue protein precipitate forms.",
      "Alcohol precipitation: Add ethanol: protein immediately dehydrates and precipitates.",
      "Xanthoproteic test: Add conc. HNO₃ and warm (yellow colour), cool and add excess NH₄OH (turns orange).",
    ],
    result: "Egg albumin underwent irreversible denaturation upon heating and chemical precipitation.",
    errors: STD_CHEM_ERRORS,
    playRoute: "/student/lab-game/practical-protein",
  },
];

export const BIOLOGY_XII: JournalContent[] = [
  {
    id: "practical-rings",
    expNo: 1,
    subject: "biology",
    classLevel: "XII",
    board: "AKUEB",
    title: "Determination of Age of a Tree by Annual Growth Rings (Dendrochronology)",
    object: "To observe and count the annual growth rings in a transverse section of a dicot tree trunk and estimate its age.",
    apparatus: "Polished transverse section of wood trunk/log, magnifying hand lens, metric ruler, dissecting needle.",
    theory: [
      "In seasonal climates, vascular cambium activity varies with environmental conditions.",
      "Spring wood (early wood) has wide, thin-walled xylem vessels to transport water rapidly. Autumn wood (late wood) has narrow, thick-walled dense xylem vessels.",
      "One annual ring consists of one light spring band + one dark autumn band, representing one year of radial growth.",
    ],
    method: [
      "Place the polished wood section under bright illumination.",
      "Locate the central pith and trace outward towards the bark/cambium.",
      "Count the distinct concentric dark rings from pith to periphery using a magnifying lens.",
      "Measure the width of consecutive rings to deduce climatic variations during growth.",
    ],
    result: "Counted 24 distinct annual rings; the estimated age of the tree specimen is 24 years.",
    errors: STD_BIO_ERRORS,
    playRoute: "/student/lab-game/practical-rings",
  },
  {
    id: "practical-tropism",
    expNo: 2,
    subject: "biology",
    classLevel: "XII",
    board: "AKUEB",
    title: "Demonstration of Phototropism and Geotropism in Plant Seedlings",
    object: "To study directional growth movements in shoot (phototropism) and root (geotropism) in response to light and gravity.",
    apparatus: "Clinostat, germinating gram/bean seedlings, light-proof cardboard box with single aperture (phototropic chamber), moist cotton/petri dishes.",
    theory: [
      "Tropisms are directional growth movements in response to unidirectional environmental stimuli mediated by auxin (IAA).",
      "Shoots exhibit positive phototropism (auxin accumulates on the shaded side, stimulating elongation) and negative geotropism.",
      "Roots exhibit positive geotropism (high auxin on the lower side inhibits root elongation) and negative phototropism.",
    ],
    method: [
      "Place germinating seedlings in a phototropic box with light entering from one side only; observe shoot curvature towards light after 48 hours.",
      "Mount seedlings horizontally on a clinostat (rotating constantly to cancel gravity) and stationary control.",
      "Observe stationary seedling roots bending downwards (+ve geotropism) and shoots bending upwards (-ve geotropism).",
    ],
    result: "Shoots displayed positive phototropism and negative geotropism; roots displayed positive geotropism.",
    errors: STD_BIO_ERRORS,
    playRoute: "/student/lab-game/practical-tropism",
  },
  {
    id: "practical-skeleton",
    expNo: 3,
    subject: "biology",
    classLevel: "XII",
    board: "AKUEB",
    title: "Comparative Anatomy of Human Appendicular Skeleton (Girdles and Limbs)",
    object: "To identify and examine the bones of pectoral girdle, pelvic girdle, forelimbs, and hindlimbs on a human skeleton model.",
    apparatus: "Articulated/disarticulated human skeleton model, anatomical charts, calipers.",
    theory: [
      "Pectoral Girdle: Clavicle (collar bone) and Scapula (shoulder blade with glenoid cavity).",
      "Forelimb: Humerus (upper arm), Radius & Ulna (forearm), 8 Carpals (wrist), 5 Metacarpals (palm), 14 Phalanges (fingers).",
      "Pelvic Girdle: Coxal bone (fused Ilium, Ischium, Pubis) with acetabulum socket.",
      "Hindlimb: Femur (thigh, longest bone), Patella (kneecap), Tibia & Fibula (shank), 7 Tarsals (ankle), 5 Metatarsals (sole), 14 Phalanges (toes).",
    ],
    method: [
      "Examine pectoral girdle articulation and identify glenoid cavity where humerus head articulates (ball-and-socket joint).",
      "Observe radius and ulna articulation for pronation and supination at the elbow hinge joint.",
      "Examine pelvic girdle acetabulum and identify femur head articulation.",
      "Draw labeled schematic diagrams of both limbs and their respective girdles.",
    ],
    result: "All bones, processes, and joint articulations of the human appendicular skeleton were identified and sketched.",
    errors: STD_BIO_ERRORS,
    playRoute: "/student/lab-game/practical-skeleton",
  },
  {
    id: "practical-muscle",
    expNo: 4,
    subject: "biology",
    classLevel: "XII",
    board: "AKUEB",
    title: "Microscopic Study of Muscle Tissue Types (Skeletal, Smooth, and Cardiac)",
    object: "To distinguish and sketch permanent histological slides of striated (skeletal), unstriated (smooth), and cardiac muscle tissues.",
    apparatus: "Compound microscope, permanent stained slides of skeletal muscle (frog gastrocnemius), smooth muscle (intestine), cardiac muscle (heart).",
    theory: [
      "Skeletal Muscle: Long, cylindrical, unbranched, multinucleated peripheral fibers with distinct alternating dark (A) and light (I) cross-striations; voluntary.",
      "Smooth Muscle: Spindle-shaped (fusiform), unbranched, uninucleate central cells without striations; involuntary.",
      "Cardiac Muscle: Cylindrical, branched, uninucleate fibers with faint striations and unique dark intercalated discs for rapid electrical impulse conduction; involuntary.",
    ],
    method: [
      "Clean optical lenses and place the skeletal muscle slide on the microscope stage.",
      "Focus under 10x and then switch to 40x; observe striations and peripheral nuclei.",
      "Examine smooth muscle slide; observe fusiform cells with central elongated nuclei.",
      "Examine cardiac muscle slide; observe branching pattern and intercalated discs.",
      "Draw high-power labeled diagrams highlighting morphological differences.",
    ],
    result: "Distinct structural characteristics of skeletal, smooth, and cardiac muscles were identified and sketched.",
    errors: STD_BIO_ERRORS,
    playRoute: "/student/lab-game/biology",
  },
  {
    id: "practical-rabbit",
    expNo: 5,
    subject: "biology",
    classLevel: "XII",
    board: "AKUEB",
    title: "Anatomy of the Female Rabbit Reproductive System",
    object: "To identify and study the organs of the female reproductive system on a dissected rabbit specimen / anatomical model.",
    apparatus: "Dissected preserved female rabbit specimen / 3D model, anatomical chart, hand lens, pointer.",
    theory: [
      "The female rabbit reproductive system has paired ovaries, paired oviducts (Fallopian tubes), two separate uterine horns, two cervices, and one vagina. This arrangement is called a duplex uterus.",
      "Ovaries produce female gametes (ova) and hormones (estrogen, progesterone). Fertilization occurs in the oviducts.",
      "Embryos can implant in either uterine horn. Each horn has its own cervix opening into the shared vagina.",
    ],
    method: [
      "Observe the location of the paired oval ovaries near the kidneys in the posterior abdominal cavity.",
      "Trace the funnel-like ostium leading into the coiled Fallopian tube (oviduct).",
      "Identify the two separate uterine horns (uterus duplex) and trace each to its own cervix.",
      "Trace the median muscular vagina opening into the vestibule/vulva.",
      "Sketch and label the complete reproductive pathway.",
    ],
    result: "All anatomical structures of the female rabbit reproductive tract were identified and diagrammed.",
    errors: STD_BIO_ERRORS,
    playRoute: "/student/lab-game/biology",
  },
  {
    id: "practical-ovary",
    expNo: 6,
    subject: "biology",
    classLevel: "XII",
    board: "AKUEB",
    title: "Histology of Mammalian Ovary and Follicular Development Stages",
    object: "To observe and identify the progressive stages of ovarian follicle development in a transverse section of mammalian ovary.",
    apparatus: "Compound microscope, prepared stained slide of mammalian ovary (T.S. of rabbit/cat ovary).",
    theory: [
      "Mammalian ovary consists of an outer cortex containing follicles and an inner vascular medulla.",
      "Folliculogenesis stages: Primordial follicle (primary oocyte + single layer of flat cells) → Primary follicle (cuboidal granulosa cells + zona pellucida) → Secondary follicle (fluid-filled antrum forming) → Mature Graafian follicle (large fluid-filled antrum, cumulus oophorus, corona radiata around secondary oocyte) → Ruptured follicle forming Corpus luteum.",
    ],
    method: [
      "Mount the ovary slide under low power (10x) to survey cortex and medulla.",
      "Locate peripheral primordial and primary follicles.",
      "Switch to high power (40x) to study a mature Graafian follicle: identify the oocyte, zona pellucida, antrum cavity, granulosa layers, and theca layers.",
      "Locate any corpus luteum and atretic follicles.",
      "Draw detailed high-power labeled diagrams.",
    ],
    result: "All successive developmental stages of ovarian follicles were observed and identified.",
    errors: STD_BIO_ERRORS,
    playRoute: "/student/lab-game/practical-ovary",
  },
  {
    id: "practical-chick",
    expNo: 7,
    subject: "biology",
    classLevel: "XII",
    board: "AKUEB",
    title: "Developmental Stages of Chick Embryo (48 Hours and 72 Hours)",
    object: "To study and compare the morphological features of 48-hour and 72-hour chick embryo whole mounts under the microscope.",
    apparatus: "Compound microscope, permanent whole mount slides of 48-hour and 72-hour chick embryos.",
    theory: [
      "48-hour Chick Embryo: Cranial flexure (head bends downwards), torsion (embryo twists onto its left side), S-shaped tubular heart beating, 24-28 pairs of somites, optic cup with lens vesicle, 3 pairs of visceral clefts.",
      "72-hour Chick Embryo: Cervical flexure, complete torsion extending to tail, 35-36 pairs of somites, distinct anterior and posterior limb buds, 4 pairs of visceral clefts, allantois bud emerging.",
    ],
    method: [
      "Focus 48-hour chick embryo slide under low power; locate brain vesicles (forebrain, midbrain, hindbrain), optic cup, beating heart tube, and vitelline blood vessels.",
      "Count the pairs of somites along the neural tube.",
      "Switch to 72-hour chick embryo slide; observe pronounced cervical and cranial flexures, distinct limb buds, and expanded allantois.",
      "Draw and label comparative developmental diagrams.",
    ],
    result: "Structural milestones of 48-hour and 72-hour chick embryogenesis were identified and compared.",
    errors: STD_BIO_ERRORS,
    playRoute: "/student/lab-game/biology",
  },
  {
    id: "practical-genetics",
    expNo: 8,
    subject: "biology",
    classLevel: "XII",
    board: "AKUEB",
    title: "Simulation of Mendelian Monohybrid Genetics and Gametic Segregation",
    object: "To simulate random fertilization of gametes using coin-toss / dice models and verify the 3:1 phenotypic and 1:2:1 genotypic ratios.",
    apparatus: "Two coins of identical size marked with alleles 'A' and 'a' (or dice), tally recording sheet.",
    theory: [
      "Mendel's Law of Segregation: Alleles for a trait segregate during gamete formation so each gamete carries only one allele.",
      "Heterozygous monohybrid cross (Aa × Aa): Expected genotypic ratio = 1 AA : 2 Aa : 1 aa (25% : 50% : 25%); phenotypic ratio = 3 Dominant : 1 Recessive (75% : 25%).",
      "Chi-square test: χ² = Σ [(O − E)² / E]. If calculated χ² < critical value at p=0.05, observed deviation is due to chance alone.",
    ],
    method: [
      "Toss both coins simultaneously 100 times to represent 100 random fertilizations.",
      "Record outcomes as AA (Heads-Heads), Aa (Heads-Tails / Tails-Heads), or aa (Tails-Tails).",
      "Calculate total frequencies for each genotype and phenotype.",
      "Apply Chi-square formula at degrees of freedom df = 2.",
    ],
    result: "Observed ratio: 26 AA : 51 Aa : 23 aa (1.04 : 2.04 : 0.92); χ² value is statistically insignificant (p > 0.05), verifying Mendel's Law.",
    errors: STD_BIO_ERRORS,
    playRoute: "/student/lab-game/practical-genetics",
  },
  {
    id: "practical-height",
    expNo: 9,
    subject: "biology",
    classLevel: "XII",
    board: "AKUEB",
    title: "Continuous Variation: Measurement of Human Height and Histogram Analysis",
    object: "To collect human height data from a class sample, construct frequency distributions, and plot a normal distribution histogram.",
    apparatus: "Height measuring scale / stadiometer, recording sheet, graph paper.",
    theory: [
      "Continuous variation is quantitative and controlled by multiple additive genes (polygenic inheritance) influenced by environmental factors.",
      "When a continuous trait (such as human height or skin colour) is plotted against frequency, it yields a symmetrical, bell-shaped Gaussian normal distribution curve.",
    ],
    method: [
      "Measure the standing height of 50 students without shoes to the nearest centimeter.",
      "Group raw data into 5 cm class intervals (e.g. 150-154 cm, 155-159 cm, 160-164 cm, etc.).",
      "Calculate class frequencies and plot a histogram with height intervals on x-axis and number of students on y-axis.",
      "Draw a smooth frequency curve over the histogram bars.",
    ],
    result: "The frequency distribution of height produced a classic bell-shaped curve, confirming polygenic continuous variation.",
    errors: STD_BIO_ERRORS,
    playRoute: "/student/lab-game/practical-height",
  },
  {
    id: "practical-bloodgroup",
    expNo: 10,
    subject: "biology",
    classLevel: "XII",
    board: "AKUEB",
    title: "ABO Blood Group Survey and Pie Chart Representation",
    object: "To conduct a population survey of ABO blood groups in a student cohort and construct a proportional pie chart.",
    apparatus: "Student blood group survey record sheets, protractor, compass, coloured pencils.",
    theory: [
      "The ABO blood group system is governed by multiple alleles (Iᴬ, Iᴮ, i) at the ABO locus on chromosome 9.",
      "Iᴬ and Iᴮ are codominant, while i is recessive, giving four phenotypes: Blood Group A (IᴬIᴬ, Iᴬi), Group B (IᴮIᴮ, Iᴮi), Group AB (IᴬIᴮ), and Group O (ii).",
      "Sector angle in pie chart: Angle = (Frequency / Total Sample Size) × 360°.",
    ],
    method: [
      "Collect blood group data for 100 students.",
      "Tally numbers for Group A, Group B, Group AB, and Group O.",
      "Calculate percentage frequencies and corresponding central sector angles (e.g., for O: 35% → 126°).",
      "Draw a circle, construct sectors using a protractor, colour code each blood group, and create a legend.",
    ],
    result: "Survey distribution: Group O (35%), Group B (32%), Group A (24%), Group AB (9%). Pie chart successfully constructed.",
    errors: STD_BIO_ERRORS,
    playRoute: "/student/lab-game/practical-bloodgroup",
  },
  {
    id: "practical-foodweb",
    expNo: 11,
    subject: "biology",
    classLevel: "XII",
    board: "AKUEB",
    title: "Ecosystem Trophic Levels and Food Web Construction",
    object: "To classify organisms of a grassland / pond ecosystem into trophic levels and construct an interconnected food web.",
    apparatus: "Ecosystem organism picture cards / chart, drawing board, markers, arrow stickers.",
    theory: [
      "A food chain is a linear feeding sequence. A food web consists of interconnected food chains reflecting natural feeding relationships in an ecosystem.",
      "Trophic levels: T1 = Primary Producers (Grass, Phytoplankton), T2 = Primary Consumers / Herbivores (Grasshopper, Zooplankton), T3 = Secondary Consumers / Carnivores (Frog, Small fish), T4 = Tertiary / Apex Consumers (Hawk, Large fish), Decomposers.",
      "Arrows point in the direction of energy flow (from prey to predator).",
    ],
    method: [
      "List all organisms observed in the grassland habitat.",
      "Classify each organism into its primary trophic level (producer, primary consumer, secondary consumer, top predator).",
      "Position producers at the bottom tier, herbivores at the second tier, and carnivores at upper tiers.",
      "Draw directed arrows from each food source to the consumer feeding upon it.",
      "Verify multi-pathway feeding loops and resilience of the food web.",
    ],
    result: "Constructed a complex 4-tier grassland food web comprising 6 interconnected food chains.",
    errors: STD_BIO_ERRORS,
    playRoute: "/student/lab-game/practical-foodweb",
  },
];

export const CS_XII: JournalContent[] = [
  {
    id: "xii-cs-relational-db-design",
    expNo: 1,
    subject: "computer-science",
    classLevel: "XII",
    board: "AKUEB",
    title: "Advanced Database Management: 3NF Normalization and Multi-Table SQL Joins",
    object: "To design a normalized database schema up to Third Normal Form (3NF) and execute complex multi-table SQL queries with Aggregate functions.",
    apparatus: "Computer system running PostgreSQL / MySQL DBMS and ER-diagram modeling tool.",
    theory: [
      "Normalization eliminates data redundancy and update anomalies: 1NF (atomic values, no repeating groups), 2NF (1NF + no partial dependency), 3NF (2NF + no transitive dependency).",
      "SQL Joins (INNER, LEFT, RIGHT, FULL) combine rows from two or more tables based on related foreign keys.",
      "Aggregate grouping: `SELECT dept, COUNT(*), AVG(salary) FROM Employees GROUP BY dept HAVING AVG(salary) > 50000;`.",
    ],
    method: [
      "Take an un-normalized student course enrollment invoice and normalize step-by-step into 1NF, 2NF, and 3NF.",
      "Create tables `Students`, `Courses`, `Departments`, and `Enrollments` with appropriate PK and FK constraints.",
      "Execute multi-table INNER JOIN query retrieving student name, department, course title, and final GPA.",
      "Execute query with `GROUP BY` and `HAVING` to find departments with average student GPA above 3.5.",
    ],
    result: "Database schema normalized to 3NF and complex multi-table SQL join queries successfully executed.",
    errors: STD_CS_ERRORS,
  },
  {
    id: "xii-cs-fullstack-web-api",
    expNo: 2,
    subject: "computer-science",
    classLevel: "XII",
    board: "AKUEB",
    title: "Full-Stack Web Engineering: RESTful API Endpoint and Client-Side Form Submission",
    object: "To build and test a full-stack asynchronous data workflow connecting an interactive HTML/JS front-end with a Next.js / Node.js REST API endpoint.",
    apparatus: "Next.js / Node.js development environment, Postman / Browser Fetch API.",
    theory: [
      "REST (Representational State Transfer) architecture uses standard HTTP verbs: GET (retrieve), POST (create), PUT/PATCH (update), DELETE (remove).",
      "Client sends JSON payload with `Content-Type: application/json` via `fetch()`. Server parses body, validates data, processes business logic, and returns HTTP status code (200 OK, 400 Bad Request, 500 Error).",
    ],
    method: [
      "Build a Next.js API Route `/api/students` handling POST requests with input validation.",
      "Construct a front-end registration form with client-side regex email and password validation.",
      "Attach asynchronous submit handler `fetch('/api/students', { method: 'POST', body: JSON.stringify(data) })`.",
      "Handle server response promise and dynamically display toast notifications upon success or error.",
    ],
    result: "End-to-end RESTful API client-server communication successfully established and verified.",
    errors: STD_CS_ERRORS,
  },
  {
    id: "xii-cs-networking-commands",
    expNo: 3,
    subject: "computer-science",
    classLevel: "XII",
    board: "AKUEB",
    title: "Computer Networks: IP Configuration, Subnetting, and Network Diagnostics",
    object: "To calculate IPv4 subnet masks and perform network diagnostic commands (ping, traceroute, nslookup, netstat).",
    apparatus: "Computer system connected to LAN/Internet, Terminal / CMD.",
    theory: [
      "IPv4 addresses are 32-bit numeric identifiers represented in dotted-decimal notation. Subnet masks divide the IP into Network ID and Host ID.",
      "CIDR notation (e.g. /24) specifies prefix length.",
      "Diagnostic utilities: `ping` (ICMP echo request testing connectivity & latency), `traceroute/tracert` (hop-by-hop packet route tracing using TTL), `nslookup` (DNS domain name resolution), `netstat` (active TCP/UDP connections and listening ports).",
    ],
    method: [
      "Calculate usable host IP range, network address, and broadcast address for subnet `192.168.10.0/26`.",
      "Execute `ping google.com -c 4` to measure round-trip packet latency and packet loss.",
      "Execute `traceroute 8.8.8.8` to identify routing gateway hops.",
      "Execute `nslookup examinationboard.aku.edu` to inspect DNS A-records and IP resolution.",
    ],
    result: "Subnetting calculations verified and network diagnostics successfully performed.",
    errors: STD_CS_ERRORS,
  },
];

// ==========================================
// MASTER COMBINED CATALOG
// ==========================================

export const PRACTICAL_JOURNALS: Record<PracticalSubject, Record<ClassLevel, JournalContent[]>> = {
  physics: {
    IX: PHYSICS_IX,
    X: PHYSICS_X,
    XI: PHYSICS_XI,
    XII: PHYSICS_XII,
  },
  chemistry: {
    IX: CHEMISTRY_IX,
    X: CHEMISTRY_X,
    XI: CHEMISTRY_XI,
    XII: CHEMISTRY_XII,
  },
  biology: {
    IX: BIOLOGY_IX,
    X: BIOLOGY_X,
    XI: BIOLOGY_XI,
    XII: BIOLOGY_XII,
  },
  "computer-science": {
    IX: CS_IX,
    X: CS_X,
    XI: CS_XI,
    XII: CS_XII,
  },
};

// Legacy alias for backward compatibility
export const PHYSICS_JOURNALS = PHYSICS_XII;

export function getPracticalsForSubject(subject: PracticalSubject, classLevel: ClassLevel = "XII"): JournalContent[] {
  const subMap = PRACTICAL_JOURNALS[subject];
  if (!subMap) return [];
  return subMap[classLevel] || subMap["XII"] || [];
}

export function getPracticalJournal(id: string, subject?: PracticalSubject, classLevel?: ClassLevel): JournalContent | undefined {
  const aliasMap: Record<string, string> = {
    "practical-ix-melting-point": "ix-chem-melting-point",
    "ix-chem-melting-point": "practical-ix-melting-point",
    "practical-ix-boiling-point": "ix-chem-boiling-point",
    "ix-chem-boiling-point": "practical-ix-boiling-point",
    "practical-ix-sublimation": "ix-chem-sublimation",
    "ix-chem-sublimation": "practical-ix-sublimation",
    "practical-ix-standard-solution": "ix-chem-standard-solution",
    "ix-chem-standard-solution": "practical-ix-standard-solution",
    "practical-ix-dilution": "ix-chem-dilution",
    "ix-chem-dilution": "practical-ix-dilution",
    "practical-ix-crystallization": "ix-chem-crystallization",
    "ix-chem-crystallization": "practical-ix-crystallization",
    "practical-ix-mixture-separation": "ix-chem-mixture-separation",
    "ix-chem-mixture-separation": "practical-ix-mixture-separation",
    "practical-ix-physical-chemical-change": "ix-chem-physical-chemical-change",
    "ix-chem-physical-chemical-change": "practical-ix-physical-chemical-change",
    "practical-x-naoh": "x-chem-standardization-naoh",
    "x-chem-standardization-naoh": "practical-x-naoh",
    "practical-x-hcl": "x-chem-acid-base-titration",
    "x-chem-acid-base-titration": "practical-x-hcl",
    "practical-x-ph": "x-chem-ph-measurement",
    "x-chem-ph-measurement": "practical-x-ph",
    "practical-x-water-hardness": "x-chem-water-hardness",
    "x-chem-water-hardness": "practical-x-water-hardness",
    "practical-x-acid-reactions": "x-chem-acid-reactions",
    "x-chem-acid-reactions": "practical-x-acid-reactions",
    "practical-x-anions": "x-chem-anions-qualitative",
    "x-chem-anions-qualitative": "practical-x-anions",
    "practical-x-copper-sulfate": "x-chem-salt-synthesis",
    "x-chem-salt-synthesis": "practical-x-copper-sulfate",
    "practical-xi-oxalic-acid": "xi-chem-standard-oxalic-acid",
    "xi-chem-standard-oxalic-acid": "practical-xi-oxalic-acid",
    "practical-xi-kmno4": "xi-chem-redox-titration-kmno4",
    "xi-chem-redox-titration-kmno4": "practical-xi-kmno4",
    "practical-xi-mohrs-salt": "xi-chem-iron-mohrs-salt",
    "xi-chem-iron-mohrs-salt": "practical-xi-mohrs-salt",
    "practical-xi-iodometry": "xi-chem-iodometry-thiosulphate",
    "xi-chem-iodometry-thiosulphate": "practical-xi-iodometry",
    "practical-xi-heat-neutralization": "xi-chem-heat-of-neutralization",
    "xi-chem-heat-of-neutralization": "practical-xi-heat-neutralization",
    "practical-xi-heat-solution": "xi-chem-heat-of-solution",
    "xi-chem-heat-of-solution": "practical-xi-heat-solution",
    "practical-xi-reaction-kinetics": "xi-chem-reaction-kinetics-thiosulphate",
    "xi-chem-reaction-kinetics-thiosulphate": "practical-xi-reaction-kinetics",
    "practical-xi-chromatography": "xi-chem-paper-chromatography",
    "xi-chem-paper-chromatography": "practical-xi-chromatography",
  };

  const matchesId = (jId: string) =>
    jId === id || aliasMap[id] === jId || aliasMap[jId] === id;

  if (subject && classLevel && PRACTICAL_JOURNALS[subject]?.[classLevel]) {
    const found = PRACTICAL_JOURNALS[subject][classLevel].find((j) => matchesId(j.id));
    if (found) return found;
  }

  // Global search across all subjects and grades if not specified
  for (const sub of Object.keys(PRACTICAL_JOURNALS) as PracticalSubject[]) {
    for (const cls of Object.keys(PRACTICAL_JOURNALS[sub]) as ClassLevel[]) {
      const match = PRACTICAL_JOURNALS[sub][cls].find((j) => matchesId(j.id));
      if (match) return match;
    }
  }

  return undefined;
}

export const getPhysicsJournal = (id: string) => getPracticalJournal(id, "physics", "XII") || getPracticalJournal(id);

export function getSubjectCounts(classLevel: ClassLevel = "XII"): Record<PracticalSubject, number> {
  return {
    physics: PRACTICAL_JOURNALS.physics[classLevel]?.length || 0,
    chemistry: PRACTICAL_JOURNALS.chemistry[classLevel]?.length || 0,
    biology: PRACTICAL_JOURNALS.biology[classLevel]?.length || 0,
    "computer-science": PRACTICAL_JOURNALS["computer-science"][classLevel]?.length || 0,
  };
}

export function getAllPracticals(classLevel?: ClassLevel | "all"): JournalContent[] {
  const all: JournalContent[] = [];
  const subjects: PracticalSubject[] = ["physics", "chemistry", "biology", "computer-science"];
  const classes: ClassLevel[] = ["IX", "X", "XI", "XII"];

  for (const sub of subjects) {
    for (const cls of classes) {
      if (!classLevel || classLevel === "all" || classLevel === cls) {
        const list = PRACTICAL_JOURNALS[sub]?.[cls] || [];
        all.push(...list);
      }
    }
  }
  return all;
}
