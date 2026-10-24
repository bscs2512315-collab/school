import "dotenv/config";
import { db } from "../../lib/db";

export interface SeedSLONote {
  subject: string;
  class: string;
  chapterNumber: number;
  sloNumber: string;
  title: string;
  contentMarkdown: string;
  sections: Array<{
    sectionTitle?: string;
    questionNumber?: string;
    questionText?: string;
    parts?: Array<{
      partNumber: string;
      partText: string;
      solution: string;
      explanation?: string;
    }>;
    content?: string;
  }>;
}

export const AKUEB_SLO_NOTES_SEED: SeedSLONote[] = [
  // ==========================================
  // PAKISTAN STUDIES (CLASS XII)
  // ==========================================
  {
    subject: "Pakistan Studies",
    class: "XII",
    chapterNumber: 1,
    sloNumber: "1.1.1",
    title: "SLO 1.1.1: Basic Components of Pakistan's Ideology (Islam, Brotherhood, Justice, Equality)",
    contentMarkdown: `### Ideology of Pakistan
The ideology of Pakistan is firmly anchored in the foundational tenets of Islam. It is not merely a geographic or political construct, but a moral and socio-economic vision rooted in Islamic democracy, universal brotherhood, social justice, and equal rights for all citizens regardless of creed.

### Core Pillars of the Ideology of Pakistan
1. **Tawheed & Sovereignty of Allah:** Absolute sovereignty belongs to Allah Almighty alone, and state power is exercised as a sacred trust within His prescribed boundaries.
2. **Islamic Brotherhood (*Ukhuwwah*):** Transcends racial, ethnic, and linguistic divides to unify the community on shared spiritual values.
3. **Social Justice (*Adl*) and Equality (*Musawat*):** Eradication of caste discrimination, guaranteeing equitable access to law, resources, and civic dignities.
4. **Tolerance and Minority Rights:** Inviolable constitutional protection of minorities, in accordance with the historic speeches of Quaid-e-Azam Muhammad Ali Jinnah.`,
    sections: [
      {
        questionNumber: "Concept 1",
        questionText: "What are the fundamental components of the Ideology of Pakistan as per the Islamic framework?",
        parts: [
          {
            partNumber: "a",
            partText: "Explain the role of Tawheed, Brotherhood (Ukhuwwah), and Social Justice (Adl) in defining the ideology.",
            solution: "1. **Tawheed:** Acknowledges the absolute sovereignty of Allah, establishing that governance must be conducted with integrity and moral accountability.\n2. **Ukhuwwah:** Unifies believers across linguistic, racial, and cultural boundaries into a single fraternal community.\n3. **Adl and Musawat:** Guarantees equal treatment before the law, eliminating economic exploitation and social hierarchies.",
            explanation: "These principles formed the philosophical bedrock articulated by Allama Iqbal and Quaid-e-Azam Muhammad Ali Jinnah."
          }
        ]
      },
      {
        questionNumber: "Exam Application",
        questionText: "How did Quaid-e-Azam Muhammad Ali Jinnah delineate the status of religious minorities in Pakistan?",
        parts: [
          {
            partNumber: "a",
            partText: "Analyze Quaid-e-Azam's Address to the Constituent Assembly on August 11, 1947 regarding citizenship.",
            solution: "In his address of August 11, 1947, Quaid-e-Azam clearly stated: *'You are free; you are free to go to your temples, you are free to go to your mosques or to any other place of worship in this State of Pakistan. You may belong to any religion or caste or creed — that has nothing to do with the business of the State.'* This guaranteed absolute freedom of faith and equal civic rights to all minorities.",
            explanation: "Highlights the Islamic principle of religious tolerance and constitutional equality."
          }
        ]
      }
    ]
  },
  {
    subject: "Pakistan Studies",
    class: "XII",
    chapterNumber: 1,
    sloNumber: "1.1.2",
    title: "SLO 1.1.2: Significance of the Two-Nation Theory in the Establishment of Pakistan",
    contentMarkdown: `### The Two-Nation Theory
The Two-Nation Theory asserts that Muslims and Hindus in British India are two distinct nations with separate religions, cultural traditions, social customs, historical heritages, and civilizational outlooks.

### Intellectual Architecture & Key Figures
1. **Sir Syed Ahmad Khan:** Pioneered the concept following the Hindi-Urdu controversy of 1867, recognizing that Western parliamentary majority rule would reduce Muslims to a permanent minority.
2. **Allama Muhammad Iqbal (Allahabad Address 1930):** Enunciated the philosophical basis for a consolidated North-Western Muslim state.
3. **Quaid-e-Azam Muhammad Ali Jinnah:** Formulated the definitive political declaration at Lahore in March 1940, establishing that Muslims are a nation by any definition of nationhood.

### Historical Impact
The Two-Nation Theory provided the ideological blueprint that unified the diverse Muslim population of the subcontinent across linguistic and provincial boundaries into a singular political movement.`,
    sections: [
      {
        questionNumber: "Concept 1",
        questionText: "Explain the historical evolution and significance of the Two-Nation Theory.",
        parts: [
          {
            partNumber: "a",
            partText: "Describe the pivotal contributions of Sir Syed Ahmad Khan, Allama Iqbal, and Quaid-e-Azam Muhammad Ali Jinnah.",
            solution: "- **Sir Syed Ahmad Khan (1867):** First to articulate that Hindus and Muslims were two separate nations after the Hindi-Urdu controversy.\n- **Allama Iqbal (1930):** Proposed the political territorial consolidation of Muslim-majority provinces in North-West India.\n- **Quaid-e-Azam (1940):** Translated the philosophical concept into the Lahore Resolution, creating an independent sovereign state.",
            explanation: "The Two-Nation Theory became the legal and moral justification for partition."
          }
        ]
      }
    ]
  },
  {
    subject: "Pakistan Studies",
    class: "XII",
    chapterNumber: 1,
    sloNumber: "1.1.3",
    title: "SLO 1.1.3: Immediate Problems Faced by Pakistan at Independence (1947)",
    contentMarkdown: `### Early Crises Faced by Pakistan (1947)
Following partition on August 14, 1947, Pakistan was confronted with existential administrative, demographic, economic, and geopolitical crises.

### Major Immediate Challenges
1. **Radcliffe Award & Boundary Injustices:** Unfair demarcation of boundaries, particularly allocating Muslim-majority tehsils (Ferozepur, Zira, Gurdaspur) to India, granting India land access to Jammu & Kashmir.
2. **Refugee Rehabilitation:** Over 7 million displaced Muslims entered Pakistan amidst communal massacres, causing unprecedented humanitarian strain.
3. **Division of Financial & Military Assets:** Withholding of Pakistan's rightful share of cash balances (Rs. 750 million) and military ordnance by India.
4. **Canal Water Dispute (1948):** Unilateral stoppage of headwaters from Ferozepur and Madhopur headworks, threatening agricultural survival in West Punjab.
5. **Accession of Princely States:** Injustices surrounding Junagadh, Manavadar, Hyderabad Deccan, and the military invasion of Jammu and Kashmir.

### Administrative Recovery & National Stabilization
Under Quaid-e-Azam's resolute leadership, the Civil Service of Pakistan was established from scratch in Karachi, the State Bank of Pakistan was founded on July 1, 1948, and emergency refugee relief funds were mobilized.`,
    sections: [
      {
        questionNumber: "Crisis Analysis",
        questionText: "Examine the early administrative, financial, and refugee challenges faced by Pakistan in 1947.",
        parts: [
          {
            partNumber: "a",
            partText: "Explain how the Radcliffe Award created lasting geopolitical disputes for Pakistan.",
            solution: "The Radcliffe Award unjustifiably transferred Muslim-majority tehsils in Gurdaspur and Ferozepur to India. The allocation of Gurdaspur provided India with the only accessible land route to the princely state of Jammu & Kashmir, leading directly to the ongoing Kashmir dispute. Furthermore, control over the Ferozepur headworks gave India leverage over Pakistan's canal water supply.",
            explanation: "Crucial question frequently tested in AKUEB Higher Secondary examinations."
          }
        ]
      }
    ]
  },
  {
    subject: "Pakistan Studies",
    class: "XII",
    chapterNumber: 3,
    sloNumber: "3.1.2",
    title: "SLO 3.1.2: Federal Structure of Government in the 1973 Constitution",
    contentMarkdown: `### Federal Structure Under the 1973 Constitution
The Constitution of 1973 establishes Pakistan as a Federal Republic with a bicameral parliamentary system, dividing legislative and administrative powers between the Federation and the Provinces.

### Key Constitutional Components
1. **Bicameral Parliament (*Majlis-e-Shoora*):**
   - **National Assembly (Lower House):** Represents population on a proportional basis.
   - **Senate (Upper House):** Guarantees equal representation to all federating units (provinces), safeguarding provincial autonomy.
2. **Executive Branch:** Prime Minister as chief executive and head of government, answerable to the National Assembly; President as constitutional head of state.
3. **Council of Common Interests (CCI):** Constitutional body resolving disputes over shared natural resources, water, energy, and economic policy between the center and provinces.
4. **18th Constitutional Amendment (2010):** Abolished the Concurrent Legislative List, devolving extensive powers (education, health, local governance) directly to the provinces.`,
    sections: [
      {
        questionNumber: "Constitutional Structure",
        questionText: "Analyze the bicameral legislature and provincial autonomy safeguards in the 1973 Constitution.",
        parts: [
          {
            partNumber: "a",
            partText: "Explain how the Senate balances federal representation across provinces.",
            solution: "While the National Assembly is elected based on population (giving larger provinces more seats), the Senate provides equal seats to all four provinces regardless of population. This ensures that no single province can pass legislation or dominate federal policymaking without the consent of the other provinces.",
            explanation: "Essential institutional check that preserves federal unity in Pakistan."
          }
        ]
      }
    ]
  },

  // ==========================================
  // BIOLOGY (CLASS XII)
  // ==========================================
  {
    subject: "Biology",
    class: "XII",
    chapterNumber: 15,
    sloNumber: "15.1.1",
    title: "SLO 15.1.1: Define and Describe the Concept of Homeostasis",
    contentMarkdown: `### Concept of Homeostasis
Homeostasis is the dynamic mechanism by which living organisms maintain a relatively stable internal environment within narrow physiological limits, despite fluctuating external environmental conditions.

### Primary Regulatory Mechanisms
1. **Osmoregulation:** The regulation of solute concentration and water balance in bodily fluids.
2. **Excretion:** The elimination of toxic metabolic waste products, particularly nitrogenous wastes (ammonia, urea, uric acid).
3. **Thermoregulation:** The maintenance of internal body temperature within an optimal range for enzymatic catalysis.

### Biological Significance
Homeostasis preserves enzyme conformation and optimal metabolic reaction rates, preventing cellular lysis, dehydration, thermal denaturation, or metabolic toxicity.`,
    sections: [
      {
        questionNumber: "Concept 1",
        questionText: "Define Homeostasis and its three primary regulatory mechanisms.",
        parts: [
          {
            partNumber: "a",
            partText: "Distinguish between Osmoregulation, Excretion, and Thermoregulation.",
            solution: "- **Osmoregulation:** Active control of internal water potential and ionic concentration.\n- **Excretion:** Elimination of toxic by-products of nitrogenous metabolism (urea, uric acid).\n- **Thermoregulation:** Preservation of core thermal setpoints ($37^\\circ\\text{C}$ in humans) for optimal enzyme kinetics.",
            explanation: "Core definition tested in AKUEB Biology Paper 1 and Paper 2."
          }
        ]
      }
    ]
  },
  {
    subject: "Biology",
    class: "XII",
    chapterNumber: 15,
    sloNumber: "15.2.1",
    title: "SLO 15.2.1: Components of Biological Feedback Systems",
    contentMarkdown: `### Biological Feedback Systems
A feedback mechanism is a physiological regulatory pathway comprising five interdependent functional components:

$$\\text{Stimulus} \\longrightarrow \\text{Receptor/Sensor} \\longrightarrow \\text{Control Centre} \\longrightarrow \\text{Effector} \\longrightarrow \\text{Response}$$

### Components of a Feedback Loop
1. **Stimulus:** A detectable physical or chemical change in the internal or external environment (e.g., rise in blood glucose, drop in ambient temperature).
2. **Receptor (Detector):** Specialized sensory cells or neural endings that perceive the deviation from normal baseline set point.
3. **Control Centre (Integrator):** Analyzes incoming sensory afferent signals, compares them against the physiological set point, and initiates appropriate motor/endocrine commands (e.g., Hypothalamus, Pancreatic beta cells).
4. **Effector:** Muscles or endocrine/exocrine glands that execute the corrective physiological action.
5. **Response (Output):** The resulting physiological shift that either counteracts (negative feedback) or amplifies (positive feedback) the original stimulus.`,
    sections: [
      {
        questionNumber: "Feedback Loop Analysis",
        questionText: "Identify the five components of a feedback system in thermoregulation during cold exposure.",
        parts: [
          {
            partNumber: "a",
            partText: "Map the stimulus, receptor, control center, effector, and response when ambient temperature drops.",
            solution: "1. **Stimulus:** Drop in ambient/core blood temperature below $37^\\circ\\text{C}$.\n2. **Receptors:** Peripheral skin thermoreceptors and central hypothalamus thermoreceptors.\n3. **Control Centre:** Preoptic anterior hypothalamus.\n4. **Effectors:** Skeletal muscles (shivering), cutaneous arterioles (vasoconstriction), thyroid gland (increased thyroxine).\n5. **Response:** Increased metabolic heat generation and decreased heat dissipation, restoring body temperature.",
            explanation: "Classic negative feedback loop restoring physiological homeostasis."
          }
        ]
      }
    ]
  },
  {
    subject: "Biology",
    class: "XII",
    chapterNumber: 15,
    sloNumber: "15.6.2",
    title: "SLO 15.6.2: Steps of the Urea Cycle (Ornithine Cycle)",
    contentMarkdown: `### The Urea Cycle (Ornithine Cycle)
The Urea Cycle (Ornithine Cycle), discovered by Hans Krebs and Kurt Henseleit (1932), is a cyclic metabolic pathway taking place exclusively in hepatocytes (liver cells) that converts highly toxic ammonia ($\\text{NH}_3$) into significantly less toxic, water-soluble urea ($(\\text{NH}_2)_2\\text{CO}$).

### Overall Metabolic Reaction
The cycle spans two subcellular compartments: the **Mitochondrial Matrix** and the **Cytosol**.

$$\\text{Total Net Reaction:} \\quad 2\\text{NH}_3 + \\text{CO}_2 + 3\\text{ATP} + \\text{H}_2\\text{O} \\longrightarrow \\text{Urea} + 2\\text{ADP} + \\text{AMP} + 4\\text{P}_i$$

### Sequential Enzymatic Steps
1. **Synthesis of Carbamoyl Phosphate (Mitochondria):**
   $$\\text{NH}_4^+ + \\text{CO}_2 + 2\\text{ATP} \\xrightarrow{\\text{Carbamoyl Phosphate Synthetase I}} \\text{Carbamoyl Phosphate} + 2\\text{ADP} + \\text{P}_i$$
2. **Formation of Citrulline (Mitochondria):**
   $$\\text{Carbamoyl Phosphate} + \\text{Ornithine} \\xrightarrow{\\text{Ornithine Transcarbamoylase (OTC)}} \\text{Citrulline} + \\text{P}_i$$
   *Citrulline is then transported across the mitochondrial membrane into the cytosol.*
3. **Synthesis of Argininosuccinate (Cytosol):**
   $$\\text{Citrulline} + \\text{Aspartate} + \\text{ATP} \\xrightarrow{\\text{Argininosuccinate Synthetase}} \\text{Argininosuccinate} + \\text{AMP} + \\text{PP}_i$$
   *Aspartate supplies the second nitrogen atom of the urea molecule.*
4. **Cleavage into Arginine and Fumarate (Cytosol):**
   $$\\text{Argininosuccinate} \\xrightarrow{\\text{Argininosuccinase}} \\text{L-Arginine} + \\text{Fumarate}$$
   *Fumarate enters the Krebs TCA cycle for cellular respiration.*
5. **Hydrolysis of Arginine to Generate Urea (Cytosol):**
   $$\\text{L-Arginine} + \\text{H}_2\\text{O} \\xrightarrow{\\text{Arginase}} \\text{Urea} + \\text{L-Ornithine}$$
   *Ornithine is transported back into the mitochondrial matrix to re-initiate the cycle.*`,
    sections: [
      {
        questionNumber: "Biochemical Pathway",
        questionText: "Detail the steps, cellular compartments, and energetic cost of the Ornithine (Urea) Cycle.",
        parts: [
          {
            partNumber: "a",
            partText: "Where do the two nitrogen atoms in a urea molecule originate?",
            solution: "- The **first nitrogen atom** comes from free ammonium ion ($\\text{NH}_4^+$) in the mitochondrial matrix.\n- The **second nitrogen atom** is donated by the amino acid **Aspartate** in the cytosol.",
            explanation: "Frequently assessed in AKUEB Section B structural questions."
          },
          {
            partNumber: "b",
            partText: "Calculate the total high-energy phosphate bonds consumed per molecule of urea synthesized.",
            solution: "A total of **3 ATP molecules** are consumed, yielding 2 ADP and 1 AMP (which equals **4 high-energy phosphate bonds** consumed: 2 in Step 1, and 2 in Step 3 via ATP $\\to$ AMP + PPi).",
            explanation: "Essential energetic analysis for cognitive level [U / A]."
          }
        ]
      }
    ]
  },
  {
    subject: "Biology",
    class: "XII",
    chapterNumber: 15,
    sloNumber: "15.6.7",
    title: "SLO 15.6.7: Structure and Functions of the Nephron (Filtration, Reabsorption, Secretion)",
    contentMarkdown: `### Nephron Anatomy
The nephron is the structural and functional microscopic unit of the kidney, consisting of:
1. **Renal Corpuscle:**
   - **Glomerulus:** High-pressure fenestrated capillary tuft supplied by the afferent arteriole and drained by the efferent arteriole.
   - **Bowman's Capsule:** Double-walled epithelial cup with specialized podocytes creating filtration slits.
2. **Renal Tubule:**
   - **Proximal Convoluted Tubule (PCT):** Lined with brush-border microvilli for maximal selective reabsorption.
   - **Loop of Henle (Descent & Ascending limbs):** Generates medullary osmotic concentration gradient via counter-current multiplier.
   - **Distal Convoluted Tubule (DCT) & Collecting Duct:** Hormonally modulated facultative reabsorption of water (ADH) and sodium (Aldosterone).

### Primary Renal Processes
1. **Ultrafiltration (Glomerulus):** Net filtration pressure ($P_{\\text{net}} \\approx 10\\text{ mmHg}$) forces water, glucose, amino acids, ions, and urea into Bowman's space, while retaining RBCs, platelets, and large plasma proteins.
2. **Selective Reabsorption (PCT):** Active transport of 100% glucose and amino acids, and 65-70% of $\\text{Na}^+, \\text{Cl}^-, \\text{H}_2\\text{O}$.
3. **Tubular Secretion (DCT):** Active excretion of excess $\\text{H}^+, \\text{K}^+, \\text{NH}_4^+$, creatinine, and drug metabolites into tubular lumen to regulate blood pH.`,
    sections: [
      {
        questionNumber: "Nephron Physiology",
        questionText: "Explain the mechanisms of glomerular ultrafiltration, selective tubular reabsorption, and secretion.",
        parts: [
          {
            partNumber: "a",
            partText: "Why does the glomerulus generate higher hydrostatic pressure than other capillary beds in the body?",
            solution: "The diameter of the **efferent arteriole** is significantly narrower than that of the **afferent arteriole**, creating high resistance to outflow and elevating glomerular hydrostatic pressure to approximately $55\\text{ mmHg}$.",
            explanation: "This hydrostatic pressure overcomes plasma colloid osmotic pressure and capsular hydrostatic pressure to drive ultrafiltration."
          }
        ]
      }
    ]
  },

  // ==========================================
  // PHYSICS (CLASS XII)
  // ==========================================
  {
    subject: "Physics",
    class: "XII",
    chapterNumber: 11,
    sloNumber: "11.1.1",
    title: "SLO 11.1.1: Newton's Law of Universal Gravitation",
    contentMarkdown: `### Newton's Law of Universal Gravitation
Every point mass attracts every other point mass in the universe with an attractive gravitational force that is directly proportional to the product of their masses and inversely proportional to the square of the separation distance between their centers:

$$F = G \\frac{m_1 m_2}{r^2}$$

### Vector Form & Constants
$$\\vec{F}_{12} = -G \\frac{m_1 m_2}{r^2} \\hat{r}_{12}$$

Where:
- $G = 6.674 \\times 10^{-11} \\text{ N}\\cdot\\text{m}^2/\\text{kg}^2$ is the Universal Gravitational Constant.
- $\\hat{r}_{12}$ is the unit vector pointing from $m_1$ towards $m_2$.
- The negative sign indicates that gravitational force is always mutually attractive.`,
    sections: [
      {
        questionNumber: "Derivation & Problem Solving",
        questionText: "Apply Newton's Law of Gravitation to calculate forces between astronomical bodies.",
        parts: [
          {
            partNumber: "a",
            partText: "Calculate the gravitational force of attraction between the Earth ($M = 5.97 \\times 10^{24}\\text{ kg}$) and a $70\\text{ kg}$ student at sea level ($R = 6.38 \\times 10^6\\text{ m}$).",
            solution: "1. **Gravitational Force Formula:**\n   $$F = G \\frac{M m}{R^2}$$\n2. **Substitute Given Values:**\n   $$F = \\frac{(6.674 \\times 10^{-11})(5.97 \\times 10^{24})(70)}{(6.38 \\times 10^6)^2}$$\n3. **Intermediate Simplification:**\n   $$F = \\frac{2.789 \\times 10^{16}}{4.070 \\times 10^{13}}$$\n4. **Final Force of Attraction:**\n   $$F \\approx 685.2\\text{ N}$$",
            explanation: "Notice that $F = mg = 70 \\times 9.8 \\approx 686\\text{ N}$, demonstrating exact equivalence with weight."
          }
        ]
      }
    ]
  },
  {
    subject: "Physics",
    class: "XII",
    chapterNumber: 11,
    sloNumber: "11.3.1",
    title: "SLO 11.3.1: Analysis of Circular Orbits in Gravitational Fields (Orbital Velocity & Period)",
    contentMarkdown: `### Orbital Dynamics
For a satellite of mass $m$ orbiting a planet of mass $M$ in a stable circular orbit of radius $r = R + h$:
The required centripetal force is provided entirely by gravitational attraction:

$$F_c = F_g \\implies \\frac{m v^2}{r} = G \\frac{M m}{r^2}$$

### Orbital Speed ($v$)
$$v = \\sqrt{\\frac{GM}{r}}$$
- *Notice that orbital speed depends solely on the central mass $M$ and orbital radius $r$, completely independent of satellite mass $m$.*

### Orbital Period ($T$) & Kepler's Third Law
The distance traversed in one orbit is $2\\pi r$:
$$T = \\frac{2\\pi r}{v} = \\frac{2\\pi r}{\\sqrt{GM/r}} = 2\\pi \\sqrt{\\frac{r^3}{GM}}$$

Squaring both sides yields **Kepler's Third Law of Planetary Motion**:
$$T^2 = \\left( \\frac{4\\pi^2}{GM} \\right) r^3 \\implies T^2 \\propto r^3$$`,
    sections: [
      {
        questionNumber: "Orbital Mechanics",
        questionText: "Derive orbital velocity and demonstrate Kepler's Third Law for satellite orbits.",
        parts: [
          {
            partNumber: "a",
            partText: "Explain what happens to the orbital speed of a satellite if its orbital radius is increased by a factor of 4.",
            solution: "1. **Orbital Speed Formula:**\n   $$v = \\sqrt{\\frac{GM}{r}}$$\n2. **Substitute New Orbital Radius ($r' = 4r$):**\n   $$v' = \\sqrt{\\frac{GM}{4r}} = \\frac{1}{\\sqrt{4}} \\sqrt{\\frac{GM}{r}} = \\frac{1}{2}v$$\n3. **Conclusion:**\n   The orbital speed becomes $\\frac{1}{2}$ of its initial value (the orbital speed is **halved**).",
            explanation: "Higher altitude satellites travel at significantly lower orbital speeds."
          }
        ]
      }
    ]
  },

  // ==========================================
  // MATHEMATICS (CLASS XI)
  // ==========================================
  {
    subject: "Mathematics",
    class: "XI",
    chapterNumber: 1,
    sloNumber: "1.1.1",
    title: "SLO 1.1.1: Representation of Complex Numbers z = a + ib as Ordered Pairs (a, b)",
    contentMarkdown: `### Complex Numbers as Ordered Pairs
A complex number $z$ is defined as an ordered pair of real numbers $(a, b) \\in \\mathbb{R}^2$, conventionally written in standard algebraic form as:

$$z = a + ib$$

Where:
- $a = \\text{Re}(z)$ is the **Real Part**.
- $b = \\text{Im}(z)$ is the **Imaginary Part**.
- $i = \\sqrt{-1}$ is the imaginary unit satisfying the fundamental identity $i^2 = -1$.

### Integral Powers of $i$
$$i^0 = 1, \\quad i^1 = i, \\quad i^2 = -1, \\quad i^3 = -i, \\quad i^4 = 1$$
For any integer $n$, $i^n = i^{4q + r} = (i^4)^q \\cdot i^r = i^r$, where $r \\in \\{0, 1, 2, 3\\}$.`,
    sections: [
      {
        questionNumber: "Algebraic Representation",
        questionText: "Convert complex numbers between algebraic form $z = a + ib$ and Cartesian ordered pairs $(a, b)$.",
        parts: [
          {
            partNumber: "a",
            partText: "Simplify $i^{99}$ and express $z = 4 - 3i$ as an ordered pair.",
            solution: "1. **Simplify $i^{99}$:**\n   $$i^{99} = i^{4(24) + 3} = (i^4)^{24} \\cdot i^3 = (1)^{24}(-i) = -i$$\n2. **Express in Ordered Pair Notation:**\n   $$z = 4 - 3i \\iff (4, -3)$$",
            explanation: "Core algebraic property of complex numbers."
          }
        ]
      }
    ]
  },
  {
    subject: "Mathematics",
    class: "XI",
    chapterNumber: 1,
    sloNumber: "1.1.5",
    title: "SLO 1.1.5: Fundamental Operations on Complex Numbers (Addition, Subtraction, Multiplication, Division)",
    contentMarkdown: `### Fundamental Operations on Complex Numbers
Let $z_1 = a + ib$ and $z_2 = c + id$.

### Addition & Subtraction
$$z_1 \\pm z_2 = (a \\pm c) + i(b \\pm d)$$

### Multiplication
$$z_1 \\cdot z_2 = (a + ib)(c + id) = (ac - bd) + i(ad + bc)$$

### Division (Rationalization via Conjugate)
$$\\frac{z_1}{z_2} = \\frac{a + ib}{c + id} \\cdot \\frac{c - id}{c - id} = \\frac{(ac + bd) + i(bc - ad)}{c^2 + d^2} = \\left(\\frac{ac + bd}{c^2 + d^2}\\right) + i\\left(\\frac{bc - ad}{c^2 + d^2}\\right)$$`,
    sections: [
      {
        questionNumber: "Complex Arithmetic",
        questionText: "Perform operations on complex numbers and express the result in standard form $x + iy$.",
        parts: [
          {
            partNumber: "a",
            partText: "Simplify $\\frac{3 + 4i}{1 - 2i}$.",
            solution: "1. **Multiply Numerator & Denominator by Conjugate ($1 + 2i$):**\n   $$\\frac{3 + 4i}{1 - 2i} = \\frac{(3 + 4i)(1 + 2i)}{(1 - 2i)(1 + 2i)}$$\n2. **Expand and Substitute $i^2 = -1$:**\n   $$= \\frac{3 + 6i + 4i + 8i^2}{1 - 4i^2} = \\frac{3 + 10i - 8}{1 + 4}$$\n3. **Simplify to Standard Cartesian Form $a + ib$:**\n   $$= \\frac{-5 + 10i}{5} = -1 + 2i$$",
            explanation: "Multiplication by complex conjugate eliminates the imaginary unit from the denominator."
          }
        ]
      }
    ]
  },
  {
    subject: "Mathematics",
    class: "XI",
    chapterNumber: 1,
    sloNumber: "1.4.4",
    title: "SLO 1.4.4: Statement and Application of De Moivre's Theorem",
    contentMarkdown: `### Statement of De Moivre's Theorem
For any real number $\\theta$ and any integer $n \\in \\mathbb{Z}$:

$$(\\cos \\theta + i\\sin \\theta)^n = \\cos(n\\theta) + i\\sin(n\\theta)$$

In polar exponential form with $z = r(\\cos \\theta + i\\sin \\theta) = r e^{i\\theta}$:
$$z^n = [r(\\cos \\theta + i\\sin \\theta)]^n = r^n [\\cos(n\\theta) + i\\sin(n\\theta)]$$

### Applications of De Moivre's Theorem
1. Computing high powers of complex numbers without binomial expansion.
2. Determining the $n$-th roots of unity and general complex numbers:
   $$z_k^{1/n} = r^{1/n} \\left[ \\cos\\left(\\frac{\\theta + 2k\\pi}{n}\\right) + i\\sin\\left(\\frac{\\theta + 2k\\pi}{n}\\right) \\right], \\quad k = 0, 1, 2, \\dots, n-1$$`,
    sections: [
      {
        questionNumber: "De Moivre Theorem Application",
        questionText: "Compute high powers of complex numbers using polar form and De Moivre's Theorem.",
        parts: [
          {
            partNumber: "a",
            partText: "Evaluate $(\\sqrt{3} + i)^6$.",
            solution: "1. **Convert $z = \\sqrt{3} + i$ to Polar Form:**\n   - Modulus: $r = \\sqrt{(\\sqrt{3})^2 + 1^2} = \\sqrt{3 + 1} = 2$\n   - Argument: $\\theta = \\arctan\\left(\\frac{1}{\\sqrt{3}}\\right) = \\frac{\\pi}{6} = 30^\\circ$\n2. **Apply De Moivre's Theorem:**\n   $$z^6 = 2^6 \\left[\\cos\\left(6 \\times \\frac{\\pi}{6}\\right) + i\\sin\\left(6 \\times \\frac{\\pi}{6}\\right)\\right]$$\n3. **Evaluate Trigonometric Values & Simplify:**\n   $$= 64 [\\cos(\\pi) + i\\sin(\\pi)] = 64 (-1 + 0i) = -64$$",
            explanation: "Extremely clean and powerful method for calculating exponential powers of complex numbers."
          }
        ]
      }
    ]
  },

  // ==========================================
  // PHYSICS (CLASS XI)
  // ==========================================
  {
    subject: "Physics",
    class: "XI",
    chapterNumber: 2,
    sloNumber: "2.1.1",
    title: "SLO 2.1.1: Vectors, Dot Product, and Cross Product Derivations",
    contentMarkdown: `### Vectors & Products
Vectors are physical quantities possessing both magnitude and spatial direction that adhere to vector addition laws.

### Scalar (Dot) Product
$$\\vec{A} \\cdot \\vec{B} = |\\vec{A}||\\vec{B}| \\cos \\theta$$
**Properties:**
1. **Commutative:** $\\vec{A} \\cdot \\vec{B} = \\vec{B} \\cdot \\vec{A}$
2. **Orthogonal Vectors ($\\theta = 90^\\circ$):** $\\hat{i} \\cdot \\hat{j} = \\hat{j} \\cdot \\hat{k} = \\hat{k} \\cdot \\hat{i} = 0$
3. **Cartesian Form:** $\\vec{A} \\cdot \\vec{B} = A_x B_x + A_y B_y + A_z B_z$

### Vector (Cross) Product
$$\\vec{A} \\times \\vec{B} = |\\vec{A}||\\vec{B}| \\sin \\theta \\,\\hat{n}$$
**Properties:**
1. **Anti-Commutative:** $\\vec{A} \\times \\vec{B} = -(\\vec{B} \\times \\vec{A})$
2. **Determinant Form:**
$$\\vec{A} \\times \\vec{B} = \\begin{vmatrix} \\hat{i} & \\hat{j} & \\hat{k} \\\\ A_x & A_y & A_z \\\\ B_x & B_y & B_z \\end{vmatrix}$$`,
    sections: [
      {
        questionNumber: "Vector Product Properties",
        questionText: "Differentiate between scalar and vector products and calculate torque and work.",
        parts: [
          {
            partNumber: "a",
            partText: "Show that for two vectors $\\vec{A} = 2\\hat{i} + 3\\hat{j} - \\hat{k}$ and $\\vec{B} = \\hat{i} - 2\\hat{j} - 4\\hat{k}$, the scalar product is zero (perpendicular).",
            solution: "1. **Calculate Scalar Dot Product:**\n   $$\\vec{A} \\cdot \\vec{B} = (2)(1) + (3)(-2) + (-1)(-4) = 2 - 6 + 4 = 0$$\n2. **Evaluate Angle Between Vectors ($\\theta$):**\n   $$\\vec{A} \\cdot \\vec{B} = |\\vec{A}||\\vec{B}|\\cos\\theta = 0 \\implies \\cos\\theta = 0 \\implies \\theta = 90^\\circ$$\n3. **Conclusion:**\n   Since the dot product is zero, vectors $\\vec{A}$ and $\\vec{B}$ are **mutually perpendicular (orthogonal)**.",
            explanation: "Orthogonality condition is satisfied when scalar dot product is zero."
          }
        ]
      }
    ]
  },
  {
    subject: "Physics",
    class: "XI",
    chapterNumber: 3,
    sloNumber: "3.1.1",
    title: "SLO 3.1.1: Projectile Motion Derivations (Time of Flight, Height, and Range)",
    contentMarkdown: `### Projectile Motion Principles
A projectile is an object moving in two dimensions under the exclusive influence of gravity, neglecting air resistance ($a_x = 0, a_y = -g$).

### Derivations of Kinematic Parameters
1. **Time of Flight ($T$):**
   At landing, vertical displacement $y = 0$:
   $$y = v_{iy} t - \\frac{1}{2}gt^2 \\implies 0 = (v_o \\sin \\theta) T - \\frac{1}{2}g T^2 \\implies T = \\frac{2 v_o \\sin \\theta}{g}$$
2. **Maximum Height ($H$):**
   At peak height, $v_y = 0$:
   $$v_y^2 = v_{iy}^2 - 2gH \\implies 0 = (v_o \\sin \\theta)^2 - 2gH \\implies H = \\frac{v_o^2 \\sin^2 \\theta}{2g}$$
3. **Horizontal Range ($R$):**
   $$R = v_{ix} \\cdot T = (v_o \\cos \\theta) \\left( \\frac{2v_o \\sin \\theta}{g} \\right) = \\frac{v_o^2 (2 \\sin \\theta \\cos \\theta)}{g} = \\frac{v_o^2 \\sin(2\\theta)}{g}$$
   - **Maximum Range:** Occurs at $\\theta = 45^\\circ$, where $\\sin(90^\\circ) = 1 \\implies R_{\\text{max}} = \\frac{v_o^2}{g}$.`,
    sections: [
      {
        questionNumber: "Derivations",
        questionText: "Derive formulas for maximum height, time of flight, and range of a projectile.",
        parts: [
          {
            partNumber: "a",
            partText: "Prove that complementary launch angles ($\\theta$ and $90^\\circ - \\theta$) produce identical horizontal ranges.",
            solution: "1. **Range for Launch Angle $\\theta$:**\n   $$R_1 = \\frac{v_o^2 \\sin(2\\theta)}{g}$$\n2. **Range for Complementary Angle $\\theta' = (90^\\circ - \\theta)$:**\n   $$R_2 = \\frac{v_o^2 \\sin(2(90^\\circ - \\theta))}{g} = \\frac{v_o^2 \\sin(180^\\circ - 2\\theta)}{g}$$\n3. **Apply Trigonometric Identity:**\n   Using $\\sin(180^\\circ - x) = \\sin x$, we have $\\sin(180^\\circ - 2\\theta) = \\sin(2\\theta)$.\n4. **Conclusion:**\n   $$R_2 = \\frac{v_o^2 \\sin(2\\theta)}{g} = R_1$$\n   Therefore, complementary angles produce identical horizontal ranges.",
            explanation: "Fundamental kinematic theorem tested in AKUEB Section B."
          }
        ]
      }
    ]
  },

  // ==========================================
  // CHEMISTRY (CLASS X & XII)
  // ==========================================
  {
    subject: "Chemistry",
    class: "X",
    chapterNumber: 9,
    sloNumber: "9.1.1",
    title: "SLO 9.1.1: Chemical Equilibrium as a Dynamic State & Law of Mass Action",
    contentMarkdown: `### Chemical Equilibrium & Dynamic State
Chemical equilibrium is a dynamic state in reversible reactions where the forward reaction rate equals the reverse reaction rate ($R_f = R_r$), causing macroscopic concentrations of reactants and products to remain constant.

### Law of Mass Action
Formulated by Guldberg and Waage (1864): *The rate at which a substance reacts is directly proportional to its active mass (molar concentration), and the rate of a chemical reaction is directly proportional to the product of active masses of reacting substances.*

For a general reversible reaction:
$$aA + bB \\rightleftharpoons cC + dD$$
- **Forward rate:** $R_f = k_f [A]^a [B]^b$
- **Reverse rate:** $R_r = k_r [C]^c [D]^d$
At equilibrium: $R_f = R_r \\implies k_f [A]^a [B]^b = k_r [C]^c [D]^d$

$$K_c = \\frac{k_f}{k_r} = \\frac{[C]^c [D]^d}{[A]^a [B]^b}$$`,
    sections: [
      {
        questionNumber: "Equilibrium Constant Expression",
        questionText: "Derive the equilibrium constant expression $K_c$ for the Haber ammonia synthesis process.",
        parts: [
          {
            partNumber: "a",
            partText: "Write the balanced chemical equation and $K_c$ expression for the synthesis of ammonia from nitrogen and hydrogen.",
            solution: "1. Reaction: $\\text{N}_2(g) + 3\\text{H}_2(g) \\rightleftharpoons 2\\text{NH}_3(g)$\n2. Forward rate: $R_f = k_f [\\text{N}_2][\\text{H}_2]^3$\n3. Reverse rate: $R_r = k_r [\\text{NH}_3]^2$\n4. At equilibrium: $K_c = \\frac{[\\text{NH}_3]^2}{[\\text{N}_2][\\text{H}_2]^3}$\n5. Units of $K_c$: $\\frac{(\\text{mol/dm}^3)^2}{(\\text{mol/dm}^3)(\\text{mol/dm}^3)^3} = \\frac{1}{(\\text{mol/dm}^3)^2} = \\text{mol}^{-2}\\text{dm}^6$",
            explanation: "High yield equilibrium derivation in secondary chemistry."
          }
        ]
      }
    ]
  },
  {
    subject: "Chemistry",
    class: "XII",
    chapterNumber: 11,
    sloNumber: "11.1.1",
    title: "SLO 11.1.1: Demarcation of Periodic Table into s, p, d, and f-Blocks",
    contentMarkdown: `### Demarcation of the Periodic Table
The periodic table is divided into four distinct blocks based on the specific subshell in which the outermost (valence) differentiating electron enters during the Aufbau building-up process.

### Block Classification & Properties
1. **s-Block:** Elements of Group 1 (Alkali metals, $ns^1$) and Group 2 (Alkaline earth metals, $ns^2$). Highly electropositive, strong reducing agents, forming basic ionic oxides.
2. **p-Block:** Elements of Groups 13 through 18 ($ns^2 np^{1-6}$). Exhibits metallic, metalloid, and non-metallic character across periods, with variable oxidation states.
3. **d-Block (Transition Metals):** Groups 3 through 12 where the $(n-1)d$ subshell is progressively filled. Characteristic properties include variable oxidation states, coloured complexes, paramagnetic behavior, and catalytic activity.
4. **f-Block (Inner Transition Metals):** Lanthanides ($4f$) and Actinides ($5f$), characterized by progressive filling of the anti-penultimate $(n-2)f$ subshell.`,
    sections: [
      {
        questionNumber: "Periodic Classification",
        questionText: "Determine block classification, period, and group from electronic configuration.",
        parts: [
          {
            partNumber: "a",
            partText: "Determine the block, group, and period of an element with atomic number $Z = 26$ (Iron).",
            solution: "1. Electronic configuration: $1s^2 2s^2 2p^6 3s^2 3p^6 4s^2 3d^6$ or $[\\text{Ar}] 3d^6 4s^2$.\n2. Highest principal quantum number $n = 4 \\implies$ **Period 4**.\n3. Last differentiating electron enters the $3d$ orbital $\\implies$ **d-Block**.\n4. Valence electrons: $2 + 6 = 8 \\implies$ **Group 8 (VIII-B)**.",
            explanation: "Core electronic configuration application tested across AKUEB exams."
          }
        ]
      }
    ]
  },

  // ==========================================
  // BIOLOGY (CLASS X)
  // ==========================================
  {
    subject: "Biology",
    class: "X",
    chapterNumber: 11,
    sloNumber: "11.1.1",
    title: "SLO 11.1.1: Define and Describe Phases of the Cell Cycle (Interphase & M-Phase)",
    contentMarkdown: `### The Cell Cycle
The cell cycle is an ordered series of events leading to cell growth, DNA replication, and division into two daughter cells.

### Main Phases of the Cell Cycle
1. **Interphase (Non-dividing, Preparatory Phase ~90% of cycle):**
   - **$G_1$ Phase (First Gap):** Rapid cell growth, synthesis of enzymes and organelles, high metabolic activity.
   - **$S$ Phase (Synthesis):** DNA replication occurs; chromosome duplication yields two identical sister chromatids joined at the centromere.
   - **$G_2$ Phase (Second Gap):** Synthesis of spindle tubulin proteins, accumulation of ATP for chromosome movement.
   - **$G_0$ Phase (Quiescent / Resting Stage):** Inactive state where differentiated cells (e.g., neurons) arrest division temporarily or permanently.
2. **M-Phase (Mitotic / Division Phase):**
   - **Karyokinesis:** Nuclear division (Prophase, Metaphase, Anaphase, Telophase).
   - **Cytokinesis:** Division of cytoplasm into two distinct daughter cells.`,
    sections: [
      {
        questionNumber: "Cell Cycle Regulation",
        questionText: "Describe the sub-phases of interphase and explain their cellular significance.",
        parts: [
          {
            partNumber: "a",
            partText: "What critical event occurs during the S-phase of interphase, and what is its consequence?",
            solution: "During the **S-phase (Synthesis phase)**, the cell replicates its genomic DNA. As a consequence, each single-chromatid chromosome becomes duplicated into two identical sister chromatids joined at the centromere, doubling the total DNA content ($2C \\to 4C$) while keeping the ploidy chromosome count constant ($2n$).",
            explanation: "Ensures that both daughter cells receive exact identical copies of genetic material."
          }
        ]
      }
    ]
  },

  // ==========================================
  // PHYSICS (CLASS IX)
  // ==========================================
  {
    subject: "Physics",
    class: "IX",
    chapterNumber: 1,
    sloNumber: "1.1.1",
    title: "SLO 1.1.1: Physical Quantities, Base Quantities, and Derived Quantities",
    contentMarkdown: `### Physical Quantities
A physical quantity is any characteristic of a physical system that can be measured accurately and expressed as a numerical value with an appropriate unit.

### Base vs. Derived Quantities
1. **Base Quantities (7 Fundamental SI Units):**
   - Length (meter, $\\text{m}$)
   - Mass (kilogram, $\\text{kg}$)
   - Time (second, $\\text{s}$)
   - Electric Current (ampere, $\\text{A}$)
   - Thermodynamic Temperature (kelvin, $\\text{K}$)
   - Amount of Substance (mole, $\\text{mol}$)
   - Luminous Intensity (candela, $\\text{cd}$)
2. **Derived Quantities:**
   - Quantities defined in terms of base quantities through mathematical relations (e.g., Velocity $\\text{m/s}$, Force $\\text{N} = \\text{kg}\\cdot\\text{m/s}^2$, Pressure $\\text{Pa} = \\text{N/m}^2$, Energy $\\text{J} = \\text{N}\\cdot\\text{m}$).`,
    sections: [
      {
        questionNumber: "Classification",
        questionText: "Distinguish between base and derived quantities with SI unit derivations.",
        parts: [
          {
            partNumber: "a",
            partText: "Derive the SI base units of Force ($F = ma$) and Pressure ($P = F/A$).",
            solution: "1. **Force ($F = ma$):**\n   $$[F] = [m][a] = \\text{kg} \\times \\text{m/s}^2 = \\text{kg}\\cdot\\text{m}\\cdot\\text{s}^{-2}\\text{ (Newton, N)}$$\n2. **Pressure ($P = F/A$):**\n   $$[P] = \\frac{\\text{kg}\\cdot\\text{m}\\cdot\\text{s}^{-2}}{\\text{m}^2} = \\text{kg}\\cdot\\text{m}^{-1}\\cdot\\text{s}^{-2}\\text{ (Pascal, Pa)}$$",
            explanation: "Core SI dimensional analysis foundational to SSC physics."
          }
        ]
      }
    ]
  },
  {
    subject: "Physics",
    class: "IX",
    chapterNumber: 2,
    sloNumber: "2.1.1",
    title: "SLO 2.1.1: Derivation of the Three Kinematic Equations of Motion",
    contentMarkdown: `### Kinematics of Uniformly Accelerated Motion
For an object moving in a straight line with initial velocity $v_i$, uniform acceleration $a$, final velocity $v_f$, covering distance $S$ in time $t$:

### Derivation of the Three Kinematic Equations
1. **First Equation of Motion:**
   $$a = \\frac{v_f - v_i}{t} \\implies v_f = v_i + at$$
2. **Second Equation of Motion:**
   $$S = v_{\\text{avg}} \\times t = \\left(\\frac{v_i + v_f}{2}\\right)t = \\left(\\frac{v_i + v_i + at}{2}\\right)t = v_i t + \\frac{1}{2}at^2$$
3. **Third Equation of Motion:**
   From first equation: $t = \\frac{v_f - v_i}{a}$.
   $$S = \\left(\\frac{v_f + v_i}{2}\\right)\\left(\\frac{v_f - v_i}{a}\\right) = \\frac{v_f^2 - v_i^2}{2a} \\implies 2aS = v_f^2 - v_i^2$$`,
    sections: [
      {
        questionNumber: "Kinematics Derivations",
        questionText: "Derive the kinematic equations of motion algebraically or using speed-time graph.",
        parts: [
          {
            partNumber: "a",
            partText: "A car accelerating uniformly from rest reaches a velocity of $20\\text{ m/s}$ in $5\\text{ s}$. Calculate the acceleration and total distance covered.",
            solution: "1. **Given Data:**\n   $$v_i = 0\\text{ m/s}, \\quad v_f = 20\\text{ m/s}, \\quad t = 5\\text{ s}$$\n2. **Calculate Acceleration ($a$):**\n   $$a = \\frac{v_f - v_i}{t} = \\frac{20 - 0}{5} = 4\\text{ m/s}^2$$\n3. **Calculate Total Distance ($S$):**\n   $$S = v_i t + \\frac{1}{2}at^2 = (0)(5) + \\frac{1}{2}(4)(5^2) = 2(25) = 50\\text{ m}$$",
            explanation: "Direct application of kinematic formulas."
          }
        ]
      }
    ]
  },

  // ==========================================
  // CHEMISTRY (CLASS IX)
  // ==========================================
  {
    subject: "Chemistry",
    class: "IX",
    chapterNumber: 1,
    sloNumber: "1.1.1",
    title: "SLO 1.1.1: Atomic Mass, Mole Concept, and Avogadro's Number",
    contentMarkdown: `### Atomic Mass and the Mole Concept
1. **Atomic Mass Unit (amu):** Exactly $\\frac{1}{12}\\text{th}$ the mass of one carbon-12 ($^{12}\\text{C}$) atom ($1\\text{ amu} \\approx 1.66 \\times 10^{-24}\\text{ g}$).
2. **Mole (mol):** The amount of substance that contains as many elementary particles (atoms, molecules, or formula units) as there are atoms in exactly $12\\text{ g}$ of Carbon-12.
3. **Avogadro's Number ($N_A$):** $N_A = 6.022 \\times 10^{23}\\text{ particles/mol}$.

### Stoichiometric Calculations
$$\\text{Number of Moles } (n) = \\frac{\\text{Mass in grams } (m)}{\\text{Molar Mass } (M)}$$
$$\\text{Number of Particles } (N) = n \\times N_A = \\frac{m}{M} \\times 6.022 \\times 10^{23}$$`,
    sections: [
      {
        questionNumber: "Mole Calculations",
        questionText: "Calculate moles, mass, and number of molecules in chemical compounds.",
        parts: [
          {
            partNumber: "a",
            partText: "Calculate the number of molecules and total atoms present in $18\\text{ g}$ of water ($\\text{H}_2\\text{O}$).",
            solution: "1. **Determine Molar Mass of $\\text{H}_2\\text{O}$:**\n   $$M = 2(1.008) + 16.00 = 18.016\\text{ g/mol} \\approx 18\\text{ g/mol}$$\n2. **Calculate Number of Moles ($n$):**\n   $$n = \\frac{m}{M} = \\frac{18\\text{ g}}{18\\text{ g/mol}} = 1.0\\text{ mol}$$\n3. **Calculate Total Molecules ($N$):**\n   $$N = n \\times N_A = 1.0 \\times 6.022 \\times 10^{23} = 6.022 \\times 10^{23}\\text{ molecules}$$\n4. **Calculate Total Atoms (3 atoms per molecule):**\n   $$\\text{Total atoms} = 3 \\times 6.022 \\times 10^{23} = 1.807 \\times 10^{24}\\text{ atoms}$$",
            explanation: "Fundamental stoichiometric calculation in chemistry."
          }
        ]
      }
    ]
  },

  // ==========================================
  // BIOLOGY (CLASS IX)
  // ==========================================
  {
    subject: "Biology",
    class: "IX",
    chapterNumber: 1,
    sloNumber: "1.1.1",
    title: "SLO 1.1.1: Major Branches of Biology and Interdisciplinary Sciences",
    contentMarkdown: `### Major Divisions of Biology
1. **Zoology:** Study of animal life, physiology, and taxonomy.
2. **Botany:** Study of plant kingdom, photosynthesis, and morphology.
3. **Microbiology:** Study of microscopic organisms (bacteria, viruses, unicellular fungi).

### Specialized Branches
1. **Morphology & Anatomy:** External form and internal gross structures.
2. **Histology:** Microscopic study of tissues.
3. **Physiology:** Functions and operational mechanisms of living components.
4. **Genetics:** Heredity and variation of genetic material.
5. **Ecology:** Interrelationships between organisms and their biotic/abiotic environment.

### Interdisciplinary Sciences
1. **Biophysics:** Application of physics principles (e.g., optics in vision, mechanics in locomotion).
2. **Biochemistry:** Chemical compounds and metabolic pathways in living systems.
3. **Biomathematics / Biometry:** Mathematical modeling and statistical data analysis.`,
    sections: [
      {
        questionNumber: "Branches of Biology",
        questionText: "Define modern biological disciplines and their real-world medical and ecological applications.",
        parts: [
          {
            partNumber: "a",
            partText: "Explain how Biotechnology and Molecular Biology bridge science with healthcare and agriculture.",
            solution: "1. **Biotechnology:**\n   Utilizes living organisms, cells, and biocatalysts to manufacture life-saving pharmaceuticals (insulin, vaccines), disease-resistant crops, and industrial enzymes.\n2. **Molecular Biology:**\n   Investigates the molecular basis of biological activity, exploring DNA replication, transcription, RNA processing, and translation mechanisms.",
            explanation: "Core branch definitions for Class IX Biology."
          }
        ]
      }
    ]
  },
  {
    subject: "Biology",
    class: "IX",
    chapterNumber: 7,
    sloNumber: "7.1.1",
    title: "SLO 7.1.1: Concept of Bioenergetics and ATP as the Universal Energy Currency",
    contentMarkdown: `### Concept of Bioenergetics
Bioenergetics is the quantitative study of energy transformations and flow in living organisms.

### Structure of Adenosine Triphosphate (ATP)
ATP is the universal energy currency of cellular metabolism. It consists of:
1. **Adenine:** A nitrogenous purine base.
2. **Ribose:** A 5-carbon pentose sugar.
3. **Three Phosphate Groups:** Linked by high-energy phosphoanhydride bonds.

### ATP Hydrolysis & Energy Yield
$$\\text{ATP} + \\text{H}_2\\text{O} \\xrightarrow{\\text{ATPase}} \\text{ADP} + \\text{P}_i + \\Delta G \\approx 7.3\\text{ kcal/mol } (30.5\\text{ kJ/mol})$$

The terminal phosphate bond release powers mechanical work (muscle contraction), active transport (sodium-potassium pump), and chemical synthesis (protein synthesis).`,
    sections: [
      {
        questionNumber: "Bioenergetics",
        questionText: "Explain why ATP is called the energy currency of the cell and calculate hydrolysis yield.",
        parts: [
          {
            partNumber: "a",
            partText: "Describe the reversible ATP-ADP cycle in cellular bioenergetics.",
            solution: "1. **ATP Generation (Catabolism):**\n   Cellular respiration oxidizes organic fuels (e.g. glucose) to phosphorylate ADP into ATP:\n   $$\\text{ADP} + \\text{P}_i + \\text{Energy} \\longrightarrow \\text{ATP}$$\n2. **ATP Utilization (Anabolism & Cellular Work):**\n   Cellular processes hydrolyze ATP to release energy for biochemical work:\n   $$\\text{ATP} \\longrightarrow \\text{ADP} + \\text{P}_i + \\text{Energy}$$\n3. **Closed Regenerative Energy Cycle:**\n   Continuous shuttling between ADP and ATP provides instantaneous power for cellular metabolism.",
            explanation: "Key bioenergetic principle in Class IX Biology."
          }
        ]
      }
    ]
  }
];

export async function importAKUEBNotes() {
  console.log("==========================================================================");
  console.log("🚀 INGESTING OFFICIAL AKUEB SOLVED NOTES (EXAMINATION 2027 ALIGNED)");
  console.log("==========================================================================\n");

  let totalImported = 0;
  let skipped = 0;

  for (const note of AKUEB_SLO_NOTES_SEED) {
    const { rows: currRows } = await db.query(
      `SELECT id FROM curriculums WHERE board = 'AKUEB' AND class = $1 AND subject = $2 LIMIT 1`,
      [note.class, note.subject]
    );

    if (currRows.length === 0) {
      console.warn(`⚠️ Curriculum not found for AKUEB ${note.class} ${note.subject}`);
      skipped++;
      continue;
    }

    const curriculumId = currRows[0].id;

    const { rows: chRows } = await db.query(
      `SELECT id, chapter_name FROM chapters WHERE curriculum_id = $1 AND chapter_number = $2 LIMIT 1`,
      [curriculumId, note.chapterNumber]
    );

    if (chRows.length === 0) {
      console.warn(`⚠️ Chapter ${note.chapterNumber} not found in ${note.subject} Class ${note.class}`);
      skipped++;
      continue;
    }

    const chapterId = chRows[0].id;
    const chapterName = chRows[0].chapter_name;
    const exerciseNumber = `SLO ${note.sloNumber}`;

    await db.query(
      `INSERT INTO solved_exercises (
        id, chapter_id, curriculum_id, board, class, subject,
        chapter_number, exercise_number, title, page_count,
        content_markdown, sections, source_credit, is_published, created_at, updated_at
      ) VALUES (
        gen_random_uuid(), $1, $2, 'AKUEB', $3, $4,
        $5, $6, $7, 1,
        $8, $9, 'AKUEB Examination 2027 Curriculum Standard', true, NOW(), NOW()
      )
      ON CONFLICT (curriculum_id, chapter_number, exercise_number)
      DO UPDATE SET
        title = EXCLUDED.title,
        content_markdown = EXCLUDED.content_markdown,
        sections = EXCLUDED.sections,
        chapter_id = EXCLUDED.chapter_id,
        updated_at = NOW()`,
      [
        chapterId,
        curriculumId,
        note.class,
        note.subject,
        note.chapterNumber,
        exerciseNumber,
        note.title,
        note.contentMarkdown,
        JSON.stringify(note.sections),
      ]
    );

    console.log(`✅ Ingested: [${note.class} ${note.subject}] Ch ${note.chapterNumber} (${chapterName}) -> ${exerciseNumber}`);
    totalImported++;
  }

  console.log(`\n==========================================================================`);
  console.log(`🎉 Ingestion Complete: ${totalImported} AKUEB Solved Notes Ingested/Updated, ${skipped} Skipped.`);
  console.log(`==========================================================================\n`);

  // Generate audit of available vs missing SLOs across all subjects
  await generateMissingSLOsAudit();
}

async function generateMissingSLOsAudit() {
  console.log("📊 Generating Comprehensive AKUEB Missing SLOs Inventory...\n");

  const { rows: curriculums } = await db.query(`
    SELECT c.id, c.class, c.subject
    FROM curriculums c
    WHERE c.board = 'AKUEB'
    ORDER BY c.class, c.subject
  `);

  const { rows: publishedNotes } = await db.query(`
    SELECT curriculum_id, chapter_number, exercise_number
    FROM solved_exercises
    WHERE board = 'AKUEB' AND is_published = true
  `);

  const publishedSet = new Set(
    publishedNotes.map(
      (n: any) => `${n.curriculum_id}_${n.chapter_number}_${n.exercise_number.trim().toUpperCase()}`
    )
  );

  let totalSLOs = 0;
  let totalAvailable = 0;
  let totalMissing = 0;

  const subjectStats: Array<{
    class: string;
    subject: string;
    totalSLOs: number;
    availableCount: number;
    missingCount: number;
    coveragePct: string;
    sampleMissing: string[];
  }> = [];

  for (const curr of curriculums) {
    const { rows: chapters } = await db.query(
      `SELECT id, chapter_number, chapter_name, analyzed_content
       FROM chapters
       WHERE curriculum_id = $1
       ORDER BY chapter_number ASC`,
      [curr.id]
    );

    let currTotal = 0;
    let currAvailable = 0;
    let currMissing = 0;
    const missingList: string[] = [];

    for (const ch of chapters) {
      const subtopics = ch.analyzed_content?.subtopics || [];
      for (const sub of subtopics) {
        for (const slo of sub.slos || []) {
          currTotal++;
          totalSLOs++;
          const sloKey = `${curr.id}_${ch.chapter_number}_SLO ${slo.sloNumber}`.toUpperCase();

          if (publishedSet.has(sloKey)) {
            currAvailable++;
            totalAvailable++;
          } else {
            currMissing++;
            totalMissing++;
            if (missingList.length < 5) {
              missingList.push(`Ch ${ch.chapter_number} (${ch.chapter_name}) - SLO ${slo.sloNumber} [${slo.cognitiveLevel || "U"}]: ${slo.sloText.slice(0, 70)}...`);
            }
          }
        }
      }
    }

    if (currTotal > 0) {
      subjectStats.push({
        class: curr.class,
        subject: curr.subject,
        totalSLOs: currTotal,
        availableCount: currAvailable,
        missingCount: currMissing,
        coveragePct: ((currAvailable / currTotal) * 100).toFixed(1) + "%",
        sampleMissing: missingList,
      });
    }
  }

  console.log(`\n==========================================================================`);
  console.log(`📈 AKUEB 2027 SYLLABUS AUDIT SUMMARY:`);
  console.log(`   Total Official SLOs in DB: ${totalSLOs}`);
  console.log(`   Available Published Notes: ${totalAvailable}`);
  console.log(`   Missing SLOs (Locked / Coming Soon in UI): ${totalMissing}`);
  console.log(`==========================================================================\n`);

  console.table(
    subjectStats.map((s) => ({
      Class: s.class,
      Subject: s.subject,
      "Total SLOs": s.totalSLOs,
      "Available Notes": s.availableCount,
      "Missing / Coming Soon": s.missingCount,
      "Coverage %": s.coveragePct,
    }))
  );
}

if (process.argv[1]?.endsWith("import-akueb-solved-notes.ts")) {
  importAKUEBNotes()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error("❌ Fatal Error:", err);
      process.exit(1);
    });
}
