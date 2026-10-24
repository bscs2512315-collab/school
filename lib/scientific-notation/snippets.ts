import type { ScientificSnippet } from "@/lib/scientific-notation/types";

export const MATH_SNIPPETS: ScientificSnippet[] = [
  { id: "x2", label: "x²", insert: "x(superscript=2)", group: "math" },
  { id: "x3", label: "x³", insert: "x(superscript=3)", group: "math" },
  { id: "sqrt", label: "√", insert: "√", group: "math" },
  { id: "pi", label: "π", insert: "π", group: "math" },
  { id: "frac", label: "a/b", insert: "(a)/(b)", group: "math" },
  { id: "pm", label: "±", insert: "±", group: "math" },
  { id: "times", label: "×", insert: "×", group: "math" },
  { id: "div", label: "÷", insert: "÷", group: "math" },
];

export const CHEMISTRY_SNIPPETS: ScientificSnippet[] = [
  { id: "h2o", label: "H₂O", insert: "H(subscript=2)O", group: "chemistry" },
  { id: "co2", label: "CO₂", insert: "CO(subscript=2)", group: "chemistry" },
  { id: "o2", label: "O₂", insert: "O(subscript=2)", group: "chemistry" },
  { id: "h2so4", label: "H₂SO₄", insert: "H(subscript=2)SO(subscript=4)", group: "chemistry" },
  { id: "naoh", label: "NaOH", insert: "NaOH", group: "chemistry" },
  { id: "hcl", label: "HCl", insert: "HCl", group: "chemistry" },
  { id: "arrow", label: "→", insert: " -> ", group: "chemistry" },
  { id: "aqueous", label: "(aq)", insert: "(subscript=aq)", group: "chemistry" },
];

export const FORMAT_SNIPPETS: ScientificSnippet[] = [
  { id: "roman", label: "i.", insert: "\n\ni. ", group: "format" },
  { id: "list-alpha", label: "a.", insert: "\n\na. ", group: "format" },
];

// Greek letters + common scientific symbols. These are literal Unicode
// characters so they render as-is everywhere (no token expansion needed).
export const GREEK_SNIPPETS: ScientificSnippet[] = [
  { id: "alpha", label: "α", insert: "α", group: "greek" },
  { id: "beta", label: "β", insert: "β", group: "greek" },
  { id: "gamma", label: "γ", insert: "γ", group: "greek" },
  { id: "delta", label: "δ", insert: "δ", group: "greek" },
  { id: "Delta", label: "Δ", insert: "Δ", group: "greek" },
  { id: "theta", label: "θ", insert: "θ", group: "greek" },
  { id: "lambda", label: "λ", insert: "λ", group: "greek" },
  { id: "mu", label: "μ", insert: "μ", group: "greek" },
  { id: "pi", label: "π", insert: "π", group: "greek" },
  { id: "rho", label: "ρ", insert: "ρ", group: "greek" },
  { id: "sigma", label: "σ", insert: "σ", group: "greek" },
  { id: "Sigma", label: "Σ", insert: "Σ", group: "greek" },
  { id: "phi", label: "φ", insert: "φ", group: "greek" },
  { id: "psi", label: "ψ", insert: "ψ", group: "greek" },
  { id: "omega", label: "ω", insert: "ω", group: "greek" },
  { id: "Omega", label: "Ω", insert: "Ω", group: "greek" },
  { id: "degree", label: "°", insert: "°", group: "greek" },
  { id: "infinity", label: "∞", insert: "∞", group: "greek" },
];
