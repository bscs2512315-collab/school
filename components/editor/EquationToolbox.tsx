"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Superscript,
  Subscript,
  Divide,
  Percent,
  Plus,
  Minus,
  Sparkles,
  FlaskConical,
  Sigma,
  Omega,
  ChevronDown,
  Eye,
  EyeOff,
  Copy,
  Check,
  Search,
  BookOpen,
  Atom,
  Binary,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface EquationToolboxProps {
  onInsert: (insertText: string, wrapMode?: "superscript" | "subscript" | "fraction" | "sqrt" | "parens") => void;
  showPreviewToggle?: boolean;
  isPreviewOpen?: boolean;
  onTogglePreview?: () => void;
  className?: string;
  size?: "sm" | "md";
  activeTargetName?: string;
}

// ---------------- Math Symbols Data ----------------
interface SymbolCategory {
  title: string;
  items: { label: string; insert: string; desc?: string }[];
}

const MATH_CATEGORIES: SymbolCategory[] = [
  {
    title: "Basic & Arithmetic",
    items: [
      { label: "±", insert: "±", desc: "Plus-Minus" },
      { label: "∓", insert: "∓", desc: "Minus-Plus" },
      { label: "×", insert: "×", desc: "Multiply" },
      { label: "÷", insert: "÷", desc: "Divide" },
      { label: "·", insert: "·", desc: "Dot Product" },
      { label: "≠", insert: "≠", desc: "Not Equal" },
      { label: "≈", insert: "≈", desc: "Approximately" },
      { label: "≤", insert: "≤", desc: "Less or Equal" },
      { label: "≥", insert: "≥", desc: "Greater or Equal" },
      { label: "∝", insert: "∝", desc: "Proportional To" },
      { label: "∞", insert: "∞", desc: "Infinity" },
      { label: "°", insert: "°", desc: "Degree" },
    ],
  },
  {
    title: "Algebra & Calculus",
    items: [
      { label: "√x", insert: "√", desc: "Square Root" },
      { label: "∛x", insert: "∛", desc: "Cube Root" },
      { label: "∑", insert: "∑", desc: "Summation" },
      { label: "∏", insert: "∏", desc: "Product" },
      { label: "∫", insert: "∫", desc: "Integral" },
      { label: "∬", insert: "∬", desc: "Double Integral" },
      { label: "∂", insert: "∂", desc: "Partial Derivative" },
      { label: "∇", insert: "∇", desc: "Nabla / Del" },
      { label: "lim", insert: "lim(x→0) ", desc: "Limit" },
      { label: "dx/dt", insert: "dx/dt", desc: "Derivative" },
      { label: "|x|", insert: "|x|", desc: "Absolute Value" },
      { label: "f(x)", insert: "f(x)", desc: "Function" },
    ],
  },
  {
    title: "Geometry & Trigonometry",
    items: [
      { label: "θ", insert: "θ", desc: "Theta" },
      { label: "π", insert: "π", desc: "Pi (3.14159...)" },
      { label: "sin(θ)", insert: "sin(θ)", desc: "Sine" },
      { label: "cos(θ)", insert: "cos(θ)", desc: "Cosine" },
      { label: "tan(θ)", insert: "tan(θ)", desc: "Tangent" },
      { label: "sec(θ)", insert: "sec(θ)", desc: "Secant" },
      { label: "csc(θ)", insert: "cosec(θ)", desc: "Cosecant" },
      { label: "cot(θ)", insert: "cot(θ)", desc: "Cotangent" },
      { label: "∠", insert: "∠", desc: "Angle" },
      { label: "⊥", insert: "⊥", desc: "Perpendicular" },
      { label: "∥", insert: "∥", desc: "Parallel" },
      { label: "△", insert: "△", desc: "Triangle" },
    ],
  },
  {
    title: "Sets & Logic",
    items: [
      { label: "∈", insert: "∈", desc: "Element Of" },
      { label: "∉", insert: "∉", desc: "Not Element Of" },
      { label: "⊂", insert: "⊂", desc: "Subset Of" },
      { label: "⊆", insert: "⊆", desc: "Subset or Equal" },
      { label: "∪", insert: "∪", desc: "Union" },
      { label: "∩", insert: "∩", desc: "Intersection" },
      { label: "∅", insert: "∅", desc: "Empty Set" },
      { label: "∀", insert: "∀", desc: "For All" },
      { label: "∃", insert: "∃", desc: "There Exists" },
      { label: "∴", insert: "∴", desc: "Therefore" },
      { label: "∵", insert: "∵", desc: "Because" },
      { label: "≡", insert: "≡", desc: "Equivalent" },
    ],
  },
];

// ---------------- Chemistry Data ----------------
const CHEMISTRY_CATEGORIES: SymbolCategory[] = [
  {
    title: "Reactions & Arrows",
    items: [
      { label: "→", insert: " -> ", desc: "Forward Reaction" },
      { label: "⇌", insert: " ⇌ ", desc: "Equilibrium Reaction" },
      { label: "⇄", insert: " ⇄ ", desc: "Reversible Reaction" },
      { label: "↑", insert: "↑", desc: "Gas Evolved" },
      { label: "↓", insert: "↓", desc: "Precipitate Formed" },
      { label: "Δ", insert: "Δ", desc: "Heat Added" },
      { label: "", insert: "", desc: "Electrolysis" },
      { label: "hν", insert: "hν", desc: "Light Energy" },
    ],
  },
  {
    title: "States of Matter",
    items: [
      { label: "(s)", insert: "(s)", desc: "Solid State" },
      { label: "(l)", insert: "(l)", desc: "Liquid State" },
      { label: "(g)", insert: "(g)", desc: "Gas State" },
      { label: "(aq)", insert: "(aq)", desc: "Aqueous Solution" },
      { label: "(conc)", insert: "(conc)", desc: "Concentrated" },
      { label: "(dil)", insert: "(dil)", desc: "Dilute" },
    ],
  },
  {
    title: "Ions & Radicals",
    items: [
      { label: "H⁺", insert: "H(superscript=+)", desc: "Hydrogen Ion" },
      { label: "OH⁻", insert: "OH(superscript=-)", desc: "Hydroxide Ion" },
      { label: "e⁻", insert: "e(superscript=-)", desc: "Electron" },
      { label: "Na⁺", insert: "Na(superscript=+)", desc: "Sodium Ion" },
      { label: "Cl⁻", insert: "Cl(superscript=-)", desc: "Chloride Ion" },
      { label: "SO₄²⁻", insert: "SO(subscript=4)(superscript=2-)", desc: "Sulfate Ion" },
      { label: "CO₃²⁻", insert: "CO(subscript=3)(superscript=2-)", desc: "Carbonate Ion" },
      { label: "NO₃⁻", insert: "NO(subscript=3)(superscript=-)", desc: "Nitrate Ion" },
      { label: "NH₄⁺", insert: "NH(subscript=4)(superscript=+)", desc: "Ammonium Ion" },
      { label: "PO₄³⁻", insert: "PO(subscript=4)(superscript=3-)", desc: "Phosphate Ion" },
      { label: "Fe²⁺", insert: "Fe(superscript=2+)", desc: "Iron(II) Ion" },
      { label: "Fe³⁺", insert: "Fe(superscript=3+)", desc: "Iron(III) Ion" },
    ],
  },
  {
    title: "Common Formulas",
    items: [
      { label: "H₂O", insert: "H(subscript=2)O", desc: "Water" },
      { label: "CO₂", insert: "CO(subscript=2)", desc: "Carbon Dioxide" },
      { label: "O₂", insert: "O(subscript=2)", desc: "Oxygen Gas" },
      { label: "N₂", insert: "N(subscript=2)", desc: "Nitrogen Gas" },
      { label: "H₂SO₄", insert: "H(subscript=2)SO(subscript=4)", desc: "Sulfuric Acid" },
      { label: "HCl", insert: "HCl", desc: "Hydrochloric Acid" },
      { label: "HNO₃", insert: "HNO(subscript=3)", desc: "Nitric Acid" },
      { label: "NaOH", insert: "NaOH", desc: "Sodium Hydroxide" },
      { label: "Ca(OH)₂", insert: "Ca(OH)(subscript=2)", desc: "Calcium Hydroxide" },
      { label: "NaCl", insert: "NaCl", desc: "Sodium Chloride" },
      { label: "CH₄", insert: "CH(subscript=4)", desc: "Methane" },
      { label: "C₆H₁₂O₆", insert: "C(subscript=6)H(subscript=12)O(subscript=6)", desc: "Glucose" },
      { label: "NH₃", insert: "NH(subscript=3)", desc: "Ammonia" },
      { label: "CaCO₃", insert: "CaCO(subscript=3)", desc: "Calcium Carbonate" },
    ],
  },
  {
    title: "Bonds & Organic",
    items: [
      { label: "—", insert: "—", desc: "Single Bond" },
      { label: "=", insert: "=", desc: "Double Bond" },
      { label: "≡", insert: "≡", desc: "Triple Bond" },
      { label: "•", insert: "•", desc: "Free Radical" },
      { label: "CH₃—", insert: "CH(subscript=3)—", desc: "Methyl Group" },
      { label: "—COOH", insert: "—COOH", desc: "Carboxyl Group" },
      { label: "—OH", insert: "—OH", desc: "Hydroxyl Group" },
      { label: "—NH₂", insert: "—NH(subscript=2)", desc: "Amino Group" },
    ],
  },
];

// ---------------- Greek Alphabet Data ----------------
const GREEK_CATEGORIES: SymbolCategory[] = [
  {
    title: "Greek Letters (Lowercase)",
    items: [
      { label: "α", insert: "α", desc: "Alpha" },
      { label: "β", insert: "β", desc: "Beta" },
      { label: "γ", insert: "γ", desc: "Gamma" },
      { label: "δ", insert: "δ", desc: "Delta" },
      { label: "ε", insert: "ε", desc: "Epsilon" },
      { label: "ζ", insert: "ζ", desc: "Zeta" },
      { label: "η", insert: "η", desc: "Eta" },
      { label: "θ", insert: "θ", desc: "Theta" },
      { label: "λ", insert: "λ", desc: "Lambda" },
      { label: "μ", insert: "μ", desc: "Micro / Mu" },
      { label: "ν", insert: "ν", desc: "Nu" },
      { label: "ξ", insert: "ξ", desc: "Xi" },
      { label: "π", insert: "π", desc: "Pi" },
      { label: "ρ", insert: "ρ", desc: "Density / Rho" },
      { label: "σ", insert: "σ", desc: "Sigma" },
      { label: "τ", insert: "τ", desc: "Tau" },
      { label: "φ", insert: "φ", desc: "Phi" },
      { label: "ψ", insert: "ψ", desc: "Psi" },
      { label: "ω", insert: "ω", desc: "Angular Velocity / Omega" },
    ],
  },
  {
    title: "Greek Letters (Uppercase)",
    items: [
      { label: "Γ", insert: "Γ", desc: "Capital Gamma" },
      { label: "Δ", insert: "Δ", desc: "Capital Delta (Change)" },
      { label: "Θ", insert: "Θ", desc: "Capital Theta" },
      { label: "Λ", insert: "Λ", desc: "Capital Lambda" },
      { label: "Ξ", insert: "Ξ", desc: "Capital Xi" },
      { label: "Π", insert: "Π", desc: "Capital Pi" },
      { label: "Σ", insert: "Σ", desc: "Capital Sigma (Sum)" },
      { label: "Φ", insert: "Φ", desc: "Capital Phi (Flux)" },
      { label: "Ψ", insert: "Ψ", desc: "Capital Psi" },
      { label: "Ω", insert: "Ω", desc: "Ohm / Capital Omega" },
    ],
  },
];

// ---------------- Formula Templates Data ----------------
const TEMPLATE_CATEGORIES: SymbolCategory[] = [
  {
    title: "Mathematics & Algebra",
    items: [
      {
        label: "Fraction: (a)/(b)",
        insert: "(a)/(b)",
        desc: "Vertical mathematical fraction bar",
      },
      {
        label: "Quadratic Formula",
        insert: "x = (-b ± √(b(superscript=2) - 4ac)) / (2a)",
        desc: "Roots of ax² + bx + c = 0",
      },
      {
        label: "Pythagorean Theorem",
        insert: "a(superscript=2) + b(superscript=2) = c(superscript=2)",
        desc: "Right angle triangle relation",
      },
      {
        label: "Linear Equation",
        insert: "y = mx + c",
        desc: "Slope-intercept line formula",
      },
      {
        label: "Exponents: xⁿ",
        insert: "x(superscript=n)",
        desc: "Power / Exponent notation",
      },
      {
        label: "Subscript Index: xᵢ",
        insert: "x(subscript=i)",
        desc: "Index / Sequence notation",
      },
    ],
  },
  {
    title: "Physics & Mechanics",
    items: [
      {
        label: "Kinetic Energy",
        insert: "E(subscript=k) = (1)/(2) · m · v(superscript=2)",
        desc: "Energy of moving mass",
      },
      {
        label: "Gravitational Potential",
        insert: "E(subscript=p) = m · g · h",
        desc: "Potential energy at height h",
      },
      {
        label: "Newton's Second Law",
        insert: "F = m · a",
        desc: "Force = mass × acceleration",
      },
      {
        label: "Ohm's Law",
        insert: "V = I · R",
        desc: "Voltage = Current × Resistance",
      },
      {
        label: "Wave Speed",
        insert: "v = f · λ",
        desc: "Velocity = Frequency × Wavelength",
      },
      {
        label: "Einstein Mass-Energy",
        insert: "E = m · c(superscript=2)",
        desc: "Equivalence of mass & energy",
      },
    ],
  },
  {
    title: "Chemistry Equations",
    items: [
      {
        label: "Photosynthesis Reaction",
        insert: "6CO(subscript=2)(g) + 6H(subscript=2)O(l) -> C(subscript=6)H(subscript=12)O(subscript=6)(s) + 6O(subscript=2)(g)",
        desc: "Light-driven glucose synthesis",
      },
      {
        label: "Acid-Base Neutralization",
        insert: "HCl(aq) + NaOH(aq) -> NaCl(aq) + H(subscript=2)O(l)",
        desc: "Standard neutralization",
      },
      {
        label: "Combustion of Methane",
        insert: "CH(subscript=4)(g) + 2O(subscript=2)(g) -> CO(subscript=2)(g) + 2H(subscript=2)O(g) + Δ",
        desc: "Hydrocarbon burning with heat release",
      },
      {
        label: "Ideal Gas Equation",
        insert: "P · V = n · R · T",
        desc: "Pressure, Volume, Temperature law",
      },
      {
        label: "Molar Concentration",
        insert: "M = (moles of solute) / (volume of solution in L)",
        desc: "Molarity formula",
      },
    ],
  },
];

export default function EquationToolbox({
  onInsert,
  showPreviewToggle = true,
  isPreviewOpen = false,
  onTogglePreview,
  className,
  size = "md",
  activeTargetName,
}: EquationToolboxProps) {
  const [activeMenu, setActiveMenu] = useState<"math" | "chem" | "greek" | "templates" | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close popup when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setActiveMenu(null);
      }
    }
    if (activeMenu) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [activeMenu]);

  const handleMenuToggle = (menu: "math" | "chem" | "greek" | "templates") => {
    if (activeMenu === menu) {
      setActiveMenu(null);
    } else {
      setActiveMenu(menu);
      setSearchQuery("");
    }
  };

  const handleInsertItem = (insertText: string) => {
    onInsert(insertText);
    setActiveMenu(null);
  };

  // Filter categories by search
  const filterCategories = (cats: SymbolCategory[]) => {
    if (!searchQuery.trim()) return cats;
    const q = searchQuery.toLowerCase();
    return cats
      .map((cat) => ({
        ...cat,
        items: cat.items.filter(
          (item) =>
            item.label.toLowerCase().includes(q) ||
            item.insert.toLowerCase().includes(q) ||
            (item.desc && item.desc.toLowerCase().includes(q)),
        ),
      }))
      .filter((cat) => cat.items.length > 0);
  };

  const isSm = size === "sm";

  return (
    <div
      ref={dropdownRef}
      className={cn(
        "relative flex flex-wrap items-center justify-between gap-1.5 rounded-xl border border-border/70 bg-card/90 p-1.5 shadow-2xs backdrop-blur-md select-none",
        className,
      )}
    >
      {/* Primary Toolbar Action Buttons */}
      <div className="flex flex-wrap items-center gap-1">
        {/* Quick Format Wrappers */}
        <button
          type="button"
          onClick={() => onInsert("", "superscript")}
          className={cn(
            "group relative inline-flex items-center gap-1 rounded-lg border border-border/60 bg-background/80 px-2 py-1 font-mono font-bold text-foreground transition-all hover:border-primary/50 hover:bg-primary/10 hover:text-primary active:scale-95",
            isSm ? "text-[11px] h-7" : "text-xs h-8",
          )}
          title="Superscript / Power (e.g. x²)"
        >
          <span className="font-bold">x</span>
          <sup className="text-[9px] font-black text-primary">2</sup>
        </button>

        <button
          type="button"
          onClick={() => onInsert("", "subscript")}
          className={cn(
            "group relative inline-flex items-center gap-1 rounded-lg border border-border/60 bg-background/80 px-2 py-1 font-mono font-bold text-foreground transition-all hover:border-primary/50 hover:bg-primary/10 hover:text-primary active:scale-95",
            isSm ? "text-[11px] h-7" : "text-xs h-8",
          )}
          title="Subscript / Base (e.g. H₂O, x₁)"
        >
          <span className="font-bold">x</span>
          <sub className="text-[9px] font-black text-primary">2</sub>
        </button>

        <button
          type="button"
          onClick={() => onInsert("", "fraction")}
          className={cn(
            "group inline-flex items-center gap-1 rounded-lg border border-border/60 bg-background/80 px-2 py-1 font-bold text-foreground transition-all hover:border-primary/50 hover:bg-primary/10 hover:text-primary active:scale-95",
            isSm ? "text-[11px] h-7" : "text-xs h-8",
          )}
          title="Fraction bar: (numerator)/(denominator)"
        >
          <span className="text-[10px] font-black leading-none">a/b</span>
        </button>

        <button
          type="button"
          onClick={() => onInsert("", "sqrt")}
          className={cn(
            "group inline-flex items-center rounded-lg border border-border/60 bg-background/80 px-2 py-1 font-bold text-foreground transition-all hover:border-primary/50 hover:bg-primary/10 hover:text-primary active:scale-95",
            isSm ? "text-[11px] h-7" : "text-xs h-8",
          )}
          title="Square Root (√)"
        >
          <span className="font-bold text-xs">√x</span>
        </button>

        {/* Divider */}
        <div className="mx-0.5 h-4 w-px bg-border/80" />

        {/* High Frequency Single-Click Math & Chem Symbols */}
        <div className="flex items-center gap-0.5">
          {[
            { label: "±", insert: "±", tip: "Plus or Minus" },
            { label: "×", insert: "×", tip: "Multiplication" },
            { label: "÷", insert: "÷", tip: "Division" },
            { label: "→", insert: " -> ", tip: "Reaction Arrow" },
            { label: "⇌", insert: " ⇌ ", tip: "Equilibrium Reaction" },
            { label: "Δ", insert: "Δ", tip: "Delta / Heat" },
            { label: "°", insert: "°", tip: "Degree" },
            { label: "π", insert: "π", tip: "Pi" },
            { label: "θ", insert: "θ", tip: "Theta" },
          ].map((sym) => (
            <button
              key={sym.label}
              type="button"
              onClick={() => onInsert(sym.insert)}
              className={cn(
                "inline-flex items-center justify-center rounded-lg font-bold text-foreground transition-all hover:bg-primary/15 hover:text-primary active:scale-90",
                isSm ? "size-7 text-xs" : "size-8 text-sm",
              )}
              title={sym.tip}
            >
              {sym.label}
            </button>
          ))}
        </div>

        {/* Divider */}
        <div className="mx-0.5 h-4 w-px bg-border/80" />

        {/* Category Dropdowns */}
        <button
          type="button"
          onClick={() => handleMenuToggle("math")}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-bold transition-all",
            activeMenu === "math"
              ? "border-primary bg-primary text-primary-foreground shadow-xs"
              : "border-border/60 bg-background/80 text-foreground hover:border-primary/40 hover:bg-muted",
            isSm ? "h-7 text-[11px]" : "h-8",
          )}
        >
          <Sigma className="size-3.5 text-inherit" />
          <span>Math</span>
          <ChevronDown className={cn("size-3 transition-transform", activeMenu === "math" && "rotate-180")} />
        </button>

        <button
          type="button"
          onClick={() => handleMenuToggle("chem")}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-bold transition-all",
            activeMenu === "chem"
              ? "border-primary bg-primary text-primary-foreground shadow-xs"
              : "border-border/60 bg-background/80 text-foreground hover:border-primary/40 hover:bg-muted",
            isSm ? "h-7 text-[11px]" : "h-8",
          )}
        >
          <FlaskConical className="size-3.5 text-inherit" />
          <span>Chemistry</span>
          <ChevronDown className={cn("size-3 transition-transform", activeMenu === "chem" && "rotate-180")} />
        </button>

        <button
          type="button"
          onClick={() => handleMenuToggle("greek")}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-bold transition-all",
            activeMenu === "greek"
              ? "border-primary bg-primary text-primary-foreground shadow-xs"
              : "border-border/60 bg-background/80 text-foreground hover:border-primary/40 hover:bg-muted",
            isSm ? "h-7 text-[11px]" : "h-8",
          )}
        >
          <Omega className="size-3.5 text-inherit" />
          <span>Greek</span>
          <ChevronDown className={cn("size-3 transition-transform", activeMenu === "greek" && "rotate-180")} />
        </button>

        <button
          type="button"
          onClick={() => handleMenuToggle("templates")}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-bold transition-all",
            activeMenu === "templates"
              ? "border-primary bg-primary text-primary-foreground shadow-xs"
              : "border-border/60 bg-background/80 text-foreground hover:border-primary/40 hover:bg-muted",
            isSm ? "h-7 text-[11px]" : "h-8",
          )}
        >
          <Sparkles className="size-3.5 text-inherit" />
          <span>Formulas</span>
          <ChevronDown className={cn("size-3 transition-transform", activeMenu === "templates" && "rotate-180")} />
        </button>
      </div>

      {/* Right Controls: Target Indicator & Preview Toggle */}
      <div className="flex items-center gap-2">
        {activeTargetName && (
          <span className="hidden sm:inline-flex items-center gap-1 rounded-md bg-muted/60 px-2 py-0.5 text-[10px] font-bold text-muted-foreground">
            Target: <span className="text-foreground">{activeTargetName}</span>
          </span>
        )}

        {showPreviewToggle && onTogglePreview && (
          <button
            type="button"
            onClick={onTogglePreview}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-bold transition-all active:scale-95",
              isPreviewOpen
                ? "border-primary/30 bg-primary/10 text-primary"
                : "border-border/60 bg-background/80 text-muted-foreground hover:bg-muted hover:text-foreground",
              isSm ? "h-7 text-[11px]" : "h-8",
            )}
            title="Toggle Live Formula & Equation Preview"
          >
            {isPreviewOpen ? (
              <>
                <EyeOff className="size-3.5" />
                <span className="hidden sm:inline">Hide Preview</span>
              </>
            ) : (
              <>
                <Eye className="size-3.5" />
                <span className="hidden sm:inline">Live Preview</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* ==================== EXPANDED CATEGORY POPUP TOOLBOX ==================== */}
      {activeMenu && (
        <div className="absolute left-0 top-[calc(100%+6px)] z-40 w-full max-w-xl rounded-2xl border border-border/80 bg-popover/95 p-3.5 shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150 sm:w-[480px]">
          {/* Header & Search */}
          <div className="mb-3 flex items-center justify-between gap-2 border-b border-border/60 pb-2.5">
            <div className="flex items-center gap-2 text-primary font-black text-xs uppercase tracking-wider">
              {activeMenu === "math" && <Sigma className="size-4" />}
              {activeMenu === "chem" && <FlaskConical className="size-4" />}
              {activeMenu === "greek" && <Omega className="size-4" />}
              {activeMenu === "templates" && <Sparkles className="size-4" />}
              <span>
                {activeMenu === "math" && "Math Symbols & Operators"}
                {activeMenu === "chem" && "Chemistry Equation Toolbox"}
                {activeMenu === "greek" && "Greek Alphabet & Symbols"}
                {activeMenu === "templates" && "Ready-to-Use Equation Templates"}
              </span>
            </div>

            <div className="relative w-36 sm:w-44">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search..."
                className="h-7 w-full rounded-lg border border-border/60 bg-background/80 pl-7 pr-2 text-xs text-foreground placeholder:text-muted-foreground/50 focus:border-primary focus:outline-hidden"
              />
            </div>
          </div>

          {/* Body Content */}
          <div className="max-h-[300px] overflow-y-auto pr-1 space-y-3.5 custom-scrollbar">
            {(() => {
              const categories =
                activeMenu === "math"
                  ? MATH_CATEGORIES
                  : activeMenu === "chem"
                    ? CHEMISTRY_CATEGORIES
                    : activeMenu === "greek"
                      ? GREEK_CATEGORIES
                      : TEMPLATE_CATEGORIES;

              const filtered = filterCategories(categories);

              if (filtered.length === 0) {
                return (
                  <p className="py-6 text-center text-xs text-muted-foreground">
                    No symbols match &ldquo;{searchQuery}&rdquo;
                  </p>
                );
              }

              return filtered.map((cat) => (
                <div key={cat.title} className="space-y-1.5">
                  <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                    {cat.title}
                  </span>

                  {activeMenu === "templates" ? (
                    <div className="grid grid-cols-1 gap-1.5">
                      {cat.items.map((item) => (
                        <button
                          key={item.label}
                          type="button"
                          onClick={() => handleInsertItem(item.insert)}
                          className="group flex flex-col items-start rounded-xl border border-border/60 bg-background/60 p-2 text-left transition-all hover:border-primary/50 hover:bg-primary/5 active:scale-98"
                        >
                          <div className="flex w-full items-center justify-between gap-2">
                            <span className="font-mono text-xs font-bold text-foreground group-hover:text-primary">
                              {item.label}
                            </span>
                            <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[9px] font-bold text-primary opacity-0 transition-opacity group-hover:opacity-100">
                              Insert ↵
                            </span>
                          </div>
                          {item.desc && (
                            <span className="mt-0.5 text-[10px] text-muted-foreground">
                              {item.desc}
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="grid grid-cols-4 sm:grid-cols-6 gap-1.5">
                      {cat.items.map((item) => (
                        <button
                          key={item.label}
                          type="button"
                          onClick={() => handleInsertItem(item.insert)}
                          className="group relative flex min-h-[38px] flex-col items-center justify-center rounded-xl border border-border/60 bg-background/70 p-1.5 text-center transition-all hover:border-primary/50 hover:bg-primary/10 hover:text-primary active:scale-90"
                          title={item.desc || item.label}
                        >
                          <span className="font-bold text-sm text-foreground group-hover:text-primary">
                            {item.label}
                          </span>
                          {item.desc && (
                            <span className="line-clamp-1 text-[8px] text-muted-foreground group-hover:text-primary/80">
                              {item.desc}
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ));
            })()}
          </div>

          {/* Footer Tip */}
          <div className="mt-2.5 pt-2 border-t border-border/50 flex items-center justify-between text-[10px] text-muted-foreground">
            <span>Tip: Select text before clicking <b>x²</b> or <b>x₂</b> to wrap it</span>
            <button
              type="button"
              onClick={() => setActiveMenu(null)}
              className="text-xs font-bold text-primary hover:underline"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
