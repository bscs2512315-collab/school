import "dotenv/config";
import { db } from "../lib/db";

// Helper function to test math classification
export function classifyMathQuestion(subject: string, classLevel: string, text: string): number | null {
  const t = (text || "").toLowerCase();

  // ==========================================
  // 1. BUSINESS MATHEMATICS
  // ==========================================
  if (subject === "Business Mathematics") {
    if (classLevel === "XI") {
      if (t.includes("matrix") || t.includes("matrices") || t.includes("determinant") || t.includes("cramer") || t.includes("adjoint") || t.includes("singular") || t.includes("transpose") || t.includes("<sup>t</sup>") || t.includes("^t")) return 6;
      if (t.includes("derivative") || t.includes("differentiat") || t.includes("marginal cost") || t.includes("marginal revenue") || t.includes("marginal profit") || t.includes("dy/dx")) return 7;
      if (t.includes("interest") || t.includes("annuity") || t.includes("annuities") || t.includes("compound interest") || t.includes("simple interest") || t.includes("present value") || t.includes("future value") || t.includes("accumulated amount") || t.includes("principal amount") || t.includes("rate of interest")) return 2;
      if (t.includes("sequence") || t.includes("series") || t.includes("arithmetic progression") || t.includes("geometric progression") || t.includes("a.p.") || t.includes("g.p.") || t.includes("common difference") || t.includes("common ratio")) return 8;
      if (t.includes("simultaneous") || t.includes("linear inequalities") || t.includes("inequality") || t.includes("feasible region") || t.includes("market equilibrium") || t.includes("supply and demand")) return 5;
      if (t.includes("quadratic") || t.includes("parabola") || t.includes("maximum profit") || t.includes("minimum cost") || t.includes("discriminant") || t.includes("roots of")) return 4;
      if (t.includes("linear equation") || t.includes("straight line") || t.includes("break-even") || t.includes("slope") || t.includes("cost function") || t.includes("revenue function") || t.includes("profit function") || t.includes("intercept")) return 3;
      if (t.includes("ratio") || t.includes("proportion") || t.includes("percentage") || t.includes("profit") || t.includes("loss") || t.includes("discount") || t.includes("commission") || t.includes("partnership") || t.includes("depreciation") || t.includes("mark-up") || t.includes("markup") || t.includes("trade discount") || t.includes("cash discount")) return 1;
      return 1;
    }
    if (classLevel === "XII") {
      if (t.includes("index number") || t.includes("laspeyre") || t.includes("paasche") || t.includes("fisher") || t.includes("price index") || t.includes("quantity index") || t.includes("weighted index")) return 13;
      if (t.includes("scatter diagram") || t.includes("correlation") || t.includes("pearson") || t.includes("rank correlation") || t.includes("regression")) return 15;
      if (t.includes("probability") || t.includes("counting") || t.includes("permutation") || t.includes("combination") || t.includes("sample space") || t.includes("factorial") || t.includes("event") || t.includes("drawn at random")) return 14;
      if (t.includes("dispersion") || t.includes("variance") || t.includes("standard deviation") || t.includes("mean deviation") || t.includes("range") || t.includes("quartile deviation") || t.includes("coefficient of variation")) return 12;
      if (t.includes("mean") || t.includes("median") || t.includes("mode") || t.includes("quartile") || t.includes("decile") || t.includes("percentile") || t.includes("geometric mean") || t.includes("harmonic mean") || t.includes("central tendency") || t.includes("average")) return 11;
      if (t.includes("presentation") || t.includes("frequency distribution") || t.includes("histogram") || t.includes("frequency polygon") || t.includes("pie chart") || t.includes("ogive") || t.includes("cumulative frequency") || t.includes("bar chart") || t.includes("tabulation") || t.includes("table")) return 10;
      if (t.includes("statistics") || t.includes("data") || t.includes("sample") || t.includes("population") || t.includes("variable") || t.includes("primary data") || t.includes("secondary data")) return 9;
      return 9;
    }
  }

  // ==========================================
  // 2. MATHEMATICS / GENERAL MATHEMATICS CLASS IX
  // (Chapters 1 to 14)
  // ==========================================
  if (classLevel === "IX") {
    // Unit 14: Trigonometry
    if (
      t.includes("sin ") || t.includes("sinθ") || t.includes("cos ") || t.includes("cosθ") || t.includes("tan ") || t.includes("tanθ") ||
      t.includes("cot ") || t.includes("sec ") || t.includes("cosec") || t.includes("trigonometr") || t.includes("pythagor") ||
      t.includes("hypotenuse") || t.includes("sin 30") || t.includes("sin 45") || t.includes("cos 60") || t.includes("tan 45") ||
      t.includes("sin^2") || t.includes("cos^2") || t.includes("tan^2") || t.includes("sec^2") || t.includes("cosec^2") ||
      t.includes("radian") || t.includes("right angled triangle") || t.includes("right-angled triangle") || t.includes("right triangle") ||
      t.includes("acute angle") || t.includes("obtuse angle") || t.includes("d°m's''") || t.includes("degree, minute")
    ) {
      return 14;
    }

    // Unit 13: Polygons
    if (
      t.includes("regular polygon") || t.includes("polygon") || t.includes("interior angle") || t.includes("exterior angle") ||
      t.includes("pentagon") || t.includes("hexagon") || t.includes("octagon") || t.includes("decagon") || t.includes("n-sided") ||
      t.includes("sum of interior angles")
    ) {
      return 13;
    }

    // Unit 12: Similar Figures / Congruence / Parallelograms / Triangles
    if (
      t.includes("similar") || t.includes("similarity") || t.includes("congruent") || t.includes("congruence") ||
      t.includes("ratio of areas") || t.includes("scale factor") || t.includes("parallelogram") || t.includes("congruent triangle") ||
      t.includes("ratio of corresponding sides") || t.includes("(triangle)") || t.includes("triangle") || t.includes("Δ") ||
      t.includes("parallel to") || t.includes("trapezium") || t.includes("quadrilateral") || t.includes("bisector of angle") ||
      t.includes("angle bisector") || t.includes("midpoint theorem") || t.includes("proportionality theorem") ||
      t.includes("side ab") || t.includes("side bc") || t.includes("side ac") || t.includes("(angle)") || t.includes("angle")
    ) {
      return 12;
    }

    // Unit 11: Logic
    if (
      t.includes("logic") || t.includes("truth value") || t.includes("truth table") || t.includes("implication") ||
      t.includes("conjunction") || t.includes("disjunction") || t.includes("negation") || t.includes("tautology") ||
      t.includes("conditional statement") || t.includes("converse") || t.includes("contrapositive") || t.includes("p ∧ q") ||
      t.includes("p ∨ q") || t.includes("p → q") || t.includes("p ↔ q") || (t.includes("hypothesis") && t.includes("conclusion"))
    ) {
      return 11;
    }

    // Unit 10: Loci
    if (t.includes("loci") || t.includes("locus") || t.includes("equidistant from two points") || t.includes("perpendicular bisector locus")) {
      return 10;
    }

    // Unit 9: Coordinate Geometry
    if (
      t.includes("coordinate geometry") || t.includes("distance formula") || t.includes("midpoint formula") ||
      t.includes("distance between points") || t.includes("midpoint of") || t.includes("collinear") ||
      t.includes("cartesian plane") || t.includes("abscissa") || t.includes("ordinate") || t.includes("ordered pair") ||
      (t.includes("quadrant") && (t.includes("point") || t.includes("lies in"))) ||
      t.includes("coordinates of") || t.includes("vertices of a triangle") || t.includes("vertices of") ||
      t.includes("line segment") || (t.includes("point") && t.includes("(") && t.includes(","))
    ) {
      return 9;
    }

    // Unit 8: Vectors
    if (
      t.includes("vector") || t.includes("magnitude of vector") || t.includes("direction of vector") ||
      t.includes("unit vector") || t.includes("position vector") || t.includes("parallel vector") ||
      t.includes("resultant vector") || t.includes("scalar multiplication")
    ) {
      return 8;
    }

    // Unit 7: Linear Equations and Inequalities
    if (
      t.includes("linear equation") || t.includes("inequality") || t.includes("inequalities") ||
      t.includes("absolute value") || t.includes("number line") || (t.includes("solution set of") && (t.includes("<") || t.includes(">") || t.includes("≤") || t.includes("≥") || t.includes("<=") || t.includes(">="))) ||
      t.includes("|x") || t.includes("|2x") || t.includes("|3x") || t.includes("|ax") || t.includes("solve for x:") ||
      t.includes("simultaneous linear") || t.includes("elimination method") || t.includes("substitution method") ||
      t.includes("linear inequality")
    ) {
      return 7;
    }

    // Unit 6: Algebraic Manipulation (HCF, LCM, square roots of expressions, rational expressions)
    if (
      t.includes("hcf") || t.includes("highest common factor") || t.includes("lcm") || t.includes("least common multiple") ||
      t.includes("square root of") || t.includes("division method") || t.includes("algebraic fraction") ||
      t.includes("partial fraction") || t.includes("rational expression") || t.includes("lowest terms") ||
      t.includes("simplest form of the algebraic") || t.includes("simplified form of") || t.includes("algebraic manipulation")
    ) {
      return 6;
    }

    // Unit 5: Factorisation / Polynomials
    if (
      t.includes("factoris") || t.includes("factoriz") || t.includes("factors of") ||
      t.includes("a^2 - b^2") || t.includes("a^3 + b^3") || t.includes("a^3 - b^3") ||
      t.includes("b^3 - 1/b^3") || t.includes("complete square") ||
      t.includes("polynomial") || t.includes("divided by x") || t.includes("remainder is") ||
      t.includes("zeros of the polynomial") || t.includes("factor theorem") || t.includes("remainder theorem")
    ) {
      return 5;
    }

    // Unit 4: Functions and Graphs
    if (
      t.includes("binary relation") || t.includes("domain of the relation") || t.includes("range of the relation") ||
      t.includes("domain and range") || t.includes("onto function") || t.includes("one-one function") || t.includes("bijective") ||
      t.includes("injective") || t.includes("surjective") || t.includes("inverse of function") || t.includes("composite function") ||
      t.includes("graph of linear function") || (t.includes("function") && (t.includes("f(x)") || t.includes("g(x)")))
    ) {
      return 4;
    }

    // Unit 3: Sets Theory
    if (
      t.includes("set ") || t.includes("sets") || t.includes("subset") || t.includes("power set") ||
      t.includes("universal set") || t.includes("null set") || t.includes("empty set") || t.includes("union") ||
      t.includes("intersection") || t.includes("venn diagram") || t.includes("de morgan") || t.includes("cartesian product") ||
      t.includes("ordered pairs") || t.includes("a ∪ b") || t.includes("a ∩ b") || t.includes("a \\ b") || t.includes("a - b") ||
      t.includes("complement of set") || t.includes("disjoint sets") || t.includes("overlapping sets")
    ) {
      return 3;
    }

    // Unit 2: Logarithms
    if (
      t.includes("logarithm") || t.includes("log_") || t.includes("log10") || t.includes("characteristic") ||
      t.includes("mantissa") || t.includes("scientific notation") || t.includes("laws of logarithm") ||
      t.includes("log ") || t.includes("log(") || t.includes("anti-log") || t.includes("antilog")
    ) {
      return 2;
    }

    // Unit 1: Real Numbers / Radicals / Exponents
    if (
      t.includes("real number") || t.includes("rational number") || t.includes("irrational number") ||
      t.includes("radical") || t.includes("radicand") || t.includes("exponent") || t.includes("indices") ||
      t.includes("laws of exponents") || t.includes("surd") || t.includes("terminating decimal") ||
      t.includes("recurring decimal") || t.includes("non-terminating")
    ) {
      return 1;
    }

    return 1;
  }

  // ==========================================
  // 3. MATHEMATICS / GENERAL MATHEMATICS CLASS X
  // (Chapters 15 to 23)
  // ==========================================
  if (classLevel === "X") {
    // Unit 23: Probability
    if (
      t.includes("probability") || t.includes("sample space") || t.includes("favourable outcome") ||
      t.includes("possible outcome") || t.includes("dice is rolled") || t.includes("die is rolled") ||
      t.includes("coin is tossed") || t.includes("deck of 52 cards") || t.includes("mutually exclusive") ||
      t.includes("randomly drawn") || t.includes("drawn at random") || t.includes("p(e)") || t.includes("p(a)")
    ) {
      return 23;
    }

    // Unit 22: Basic Statistics
    if (
      t.includes("mean") || t.includes("median") || t.includes("mode") || t.includes("variance") ||
      t.includes("standard deviation") || t.includes("frequency distribution") || t.includes("frequency table") ||
      t.includes("grouped data") || t.includes("ungrouped data") || t.includes("histogram") ||
      t.includes("frequency polygon") || t.includes("cumulative frequency") || t.includes("ogive") ||
      t.includes("class boundary") || t.includes("class mark") || t.includes("mid-point of the class") ||
      t.includes("modal class") || t.includes("range of the data") || t.includes("range of x") ||
      t.includes("pie chart") || t.includes("bar chart") || t.includes("arithmetic mean") ||
      t.includes("geometric mean") || t.includes("harmonic mean") || t.includes("weighted mean") ||
      (t.includes("scores") && (t.includes("frequency") || t.includes("observations"))) ||
      t.includes("grouped frequency") || t.includes("measure of dispersion") || t.includes("central tendency") ||
      t.includes("favourite colour") || t.includes("favourite sports") || t.includes("favourite fruit") ||
      (t.includes("number of participants") && t.includes("age limit")) || t.includes("cumulative frequency curve")
    ) {
      return 22;
    }

    // Unit 21: Practical Geometry (Constructions)
    if (
      t.includes("practical geometry") || t.includes("circumscribe") || t.includes("inscribe") ||
      t.includes("escribe") || t.includes("draw an inscribed") || t.includes("draw a circumscribed") ||
      t.includes("draw a circle") || t.includes("construct a tangent") || t.includes("construction of circle") ||
      t.includes("inscribed square") || t.includes("inscribed regular hexagon") || t.includes("inscribed triangle") ||
      t.includes("circumscribed circle") || t.includes("escribed circle") || t.includes("concurrency of")
    ) {
      return 21;
    }

    // Unit 20: Circles
    if (
      t.includes("circle") || t.includes("chord") || t.includes("tangent") || t.includes("secant") ||
      t.includes("arc ") || t.includes("arcs") || t.includes("sector") || t.includes("segment of circle") ||
      t.includes("cyclic quadrilateral") || t.includes("central angle") || t.includes("subtended by an arc") ||
      t.includes("subtended by a chord") || t.includes("diameter of the circle") || t.includes("radius of the circle") ||
      t.includes("two circles touch") || t.includes("tangent segment") || t.includes("concentric circles") ||
      t.includes("circle theorems") || t.includes("centre o") || t.includes("centre at o") ||
      (t.includes("circle") && (t.includes("radius") || t.includes("diameter") || t.includes("chord")))
    ) {
      return 20;
    }

    // Unit 19: Application of Trigonometry
    if (
      t.includes("trigonometr") || t.includes("angle of elevation") || t.includes("angle of depression") ||
      t.includes("heights and distances") || t.includes("ladder") || t.includes("sin ") || t.includes("sinθ") ||
      t.includes("cos ") || t.includes("cosθ") || t.includes("tan ") || t.includes("tanθ") || t.includes("cot ") ||
      t.includes("cotθ") || t.includes("sec ") || t.includes("secθ") || t.includes("cosec") || t.includes("sin^2") ||
      t.includes("cos^2") || t.includes("tan^2") || t.includes("sec^2") || t.includes("cosec^2") ||
      t.includes("sin 30") || t.includes("sin 45") || t.includes("sin 60") || t.includes("cos 30") ||
      t.includes("cos 45") || t.includes("cos 60") || t.includes("tan 30") || t.includes("tan 45") ||
      t.includes("tan 60") || t.includes("sec30") || t.includes("sec45") || t.includes("sec60") ||
      t.includes("cosec 45") || t.includes("cot 45") || t.includes("radian") || t.includes("radians") ||
      (t.includes("quadrant") && (t.includes("signs of") || t.includes("terminal ray") || t.includes("trigonometric ratio"))) ||
      t.includes("d°m's''") || t.includes("right angled triangle") || t.includes("right-angled triangle") ||
      t.includes("right triangle") || t.includes("pythagor") || t.includes("hypotenuse") ||
      (t.includes("prove that") && (t.includes("sin") || t.includes("cos") || t.includes("tan"))) ||
      t.includes("sides of a right-angled triangle") || t.includes("sides of the right angled triangle")
    ) {
      return 19;
    }

    // Unit 18: Matrices and Determinants
    if (
      t.includes("matrix") || t.includes("matrices") || t.includes("determinant") || t.includes("cramer") ||
      t.includes("adjoint") || t.includes("inverse of a matrix") || t.includes("singular matrix") ||
      t.includes("non-singular matrix") || t.includes("order of a matrix") || t.includes("row matrix") ||
      t.includes("column matrix") || t.includes("identity matrix") || t.includes("null matrix") ||
      t.includes("transpose of a matrix") || t.includes("matrix inversion method")
    ) {
      return 18;
    }

    // Unit 17: Complex Numbers
    if (
      t.includes("complex number") || t.includes("imaginary") || t.includes("modulus") ||
      t.includes("conjugate of") || t.includes("real part") || t.includes("imaginary part") ||
      t.includes("iota") || t.includes("i^2") || t.includes("sqrt(-")
    ) {
      return 17;
    }

    // Unit 16: Plotting and Interpreting Graphs / Real-world Graphs & Coordinate Plane
    if (
      t.includes("graph") || t.includes("plotting") || t.includes("plot ") || t.includes("parabola") ||
      t.includes("x-intercept") || t.includes("y-intercept") || t.includes("intercept") ||
      t.includes("abscissa") || t.includes("ordinate") || t.includes("ordered pair") ||
      t.includes("cartesian plane") || t.includes("rectangular plane") || t.includes("coordinate plane") ||
      t.includes("straight line") || t.includes("line 2x") || t.includes("line x+y") ||
      t.includes("draw another line") || t.includes("points that lies on the given line") ||
      t.includes("points lies on the line") || t.includes("solution set from the graph") ||
      t.includes("slope of") || t.includes("gradient") || t.includes("us dollars and pakistani rupees") ||
      t.includes("tax payment") || t.includes("gross salary") || t.includes("basic salary") ||
      t.includes("allowance") || t.includes("income tax") || t.includes("zakat") || t.includes("mark-up") ||
      t.includes("instalment") || t.includes("installment") || t.includes("currency of") ||
      t.includes("usd =") || t.includes("depreciat") || t.includes("cash price") ||
      t.includes("call rates and taxes") || t.includes("shopping trip") || t.includes("ice-cream") ||
      (t.includes("cone") && (t.includes("diameter") || t.includes("volume") || t.includes("height"))) ||
      (t.includes("cylinder") && (t.includes("diameter") || t.includes("volume") || t.includes("height"))) ||
      (t.includes("sphere") && t.includes("volume")) || (t.includes("hemisphere") && t.includes("volume")) ||
      (t.includes("cube") && t.includes("volume")) || (t.includes("cuboid") && t.includes("volume")) ||
      t.includes("parallelogram") || t.includes("congruent triangle") || t.includes("similar") ||
      t.includes("midpoint of") || t.includes("distance between point") || t.includes("collinear") ||
      t.includes("equilateral triangle") || t.includes("linear equations") || t.includes("solve the inequality") ||
      t.includes("inequality") || t.includes("hcf") || t.includes("lcm") || t.includes("partial fraction") ||
      t.includes("square root of the expression") || t.includes("algebraic expression") ||
      t.includes("arithmetic progression") || t.includes("geometric progression") || t.includes("arithmetic sequence") ||
      t.includes("geometric sequence") || t.includes("common difference") || t.includes("common ratio") ||
      t.includes("arithmetic mean between") || t.includes("geometric mean between") || t.includes("arithmetic means") ||
      t.includes("sum of the ages") || t.includes("vertical opposite angles") || t.includes("corresponding angles")
    ) {
      return 16;
    }

    // Unit 15: Quadratic Equations (STRICT AND PRECISE!)
    if (
      t.includes("quadratic equation") || t.includes("quadratic formula") || t.includes("discriminant") ||
      t.includes("roots of the equation") || t.includes("roots of the quadratic") || t.includes("nature of the roots") ||
      t.includes("completing square") || t.includes("complete the square") || t.includes("perfect square") ||
      t.includes("sum of the roots") || t.includes("product of the roots") || t.includes("standard quadratic form") ||
      t.includes("reduced to quadratic") || t.includes("reducible to quadratic") ||
      t.includes("x^2") || t.includes("x<sup>2</sup>") || (t.includes("standard form of") && t.includes("x")) ||
      (t.includes("consecutive positive") && t.includes("product")) ||
      (t.includes("area of a rectangle") && (t.includes("x^2") || t.includes("x<sup>2</sup>") || t.includes("quadratic")))
    ) {
      return 15;
    }

    // Default for remaining strictly unclassified questions in Class X
    return 16;
  }

  // ==========================================
  // 4. MATHEMATICS CLASS XI
  // (Chapters 1 to 11)
  // ==========================================
  if (classLevel === "XI") {
    // Unit 2: Matrices and Determinants
    if (
      t.includes("matrix") || t.includes("matrices") || t.includes("determinant") || t.includes("cramer") ||
      t.includes("adjoint") || t.includes("inverse of") || t.includes("singular") || t.includes("rank of matrix") ||
      t.includes("echelon form") || t.includes("symmetric matrix") || t.includes("skew-symmetric") ||
      t.includes("hermitian") || t.includes("skew-hermitian") || t.includes("transpose") ||
      t.includes("<sup>t</sup>") || t.includes("^t") ||
      t.includes("minor of the element") || t.includes("cofactor of the element") || t.includes("upper triangular") ||
      t.includes("matrix equation")
    ) {
      return 2;
    }

    // Unit 5: Permutation and Combination / Probability
    if (
      t.includes("permutation") || t.includes("combination") || t.includes("factorial") || t.includes("npr") ||
      t.includes("ncr") || t.includes("ways of arranging") || t.includes("ways of selecting") ||
      t.includes("circular permutation") || t.includes("passwords that can be formed") ||
      t.includes("passwords that start") || t.includes("distinct objects") || t.includes("drawn randomly") ||
      t.includes("drawn at random") || t.includes("cubical die") || t.includes("spinner") || t.includes("probability") ||
      t.includes("p(e") || t.includes("p(a") || t.includes("distinct 4-digit") || t.includes("digit numbers")
    ) {
      return 5;
    }

    // Unit 4: Miscellaneous Series
    if (
      t.includes("arithmetico-geometric") || t.includes("sum of n terms of the series") || t.includes("sigma") ||
      t.includes("sum of squares") || t.includes("sum of cubes") || t.includes("1^2 + 2^2") || t.includes("1^3 + 2^3")
    ) {
      return 4;
    }

    // Unit 3: Sequence and Series
    if (
      t.includes("arithmetic progression") || t.includes("geometric progression") || t.includes("harmonic progression") ||
      t.includes("a.p.") || t.includes("g.p.") || t.includes("h.p.") || t.includes("arithmetic sequence") ||
      t.includes("geometric sequence") || t.includes("harmonic sequence") || t.includes("arithmetic mean") ||
      t.includes("geometric mean") || t.includes("harmonic mean") || t.includes("common difference") ||
      t.includes("common ratio") || t.includes("nth term") || t.includes("infinite geometric") ||
      t.includes("sum of the infinite geometric") || t.includes("term of a sequence") || t.includes("term of an arithmetic") ||
      t.includes("arithmetic (am)") || t.includes("geometric (gm)") || t.includes("harmonic (hm)") ||
      t.includes("s_n") || t.includes("s_∞") || t.includes("s<sub>n</sub>") || t.includes("s<sub>∞</sub>")
    ) {
      return 3;
    }

    // Unit 6: Mathematical Induction and Binomial Theorem
    if (
      t.includes("mathematical induction") || t.includes("binomial theorem") || t.includes("binomial expansion") ||
      t.includes("general term in the expansion") || t.includes("middle term") || t.includes("coefficient of x^")
    ) {
      return 6;
    }

    // Unit 7: Factor and Remainder Theorems / Polynomials & Quadratic Equations
    if (
      t.includes("factor theorem") || t.includes("remainder theorem") || t.includes("synthetic division") ||
      t.includes("polynomial") || t.includes("roots of the polynomial") || t.includes("divided by x") || t.includes("factor of") ||
      t.includes("quadratic equation") || t.includes("roots of the equation") || t.includes("sum of the roots") ||
      t.includes("product of the roots") || t.includes("nature of roots") || t.includes("roots are reciprocal") ||
      t.includes("roots α and β") || t.includes("sum of roots is") || t.includes("product of roots") ||
      t.includes("suitable quadratic form") || t.includes("solution set of x^2") || t.includes("roots of a quadratic")
    ) {
      return 7;
    }

    // Unit 11: Vectors
    if (
      t.includes("vector") || t.includes("dot product") || t.includes("cross product") || t.includes("scalar product") ||
      t.includes("unit vector") || t.includes("projection") || t.includes("orthogonal")
    ) {
      return 11;
    }

    // Unit 10: Inverse Trigonometric Functions and Trigonometric Equations
    if (
      t.includes("inverse trigonometric") || t.includes("arcsin") || t.includes("arccos") || t.includes("arctan") ||
      t.includes("sin^-1") || t.includes("cos^-1") || t.includes("tan^-1") || t.includes("trigonometric equation") ||
      t.includes("general solution")
    ) {
      return 10;
    }

    // Unit 9: Trigonometric Functions and their Graphs
    if (
      t.includes("period of") || t.includes("period of the function") || t.includes("graph of sin") ||
      t.includes("graph of cos") || t.includes("graph of tan") || t.includes("domain and range of trigonometric")
    ) {
      return 9;
    }

    // Unit 8: Trigonometric Identities & Fundamentals
    if (
      t.includes("sin") || t.includes("cos") || t.includes("tan") || t.includes("cot") || t.includes("sec") ||
      t.includes("cosec") || t.includes("trigonometr") || t.includes("radian") || t.includes("degree") ||
      t.includes("law of sines") || t.includes("law of cosines") || t.includes("law of tangents") ||
      t.includes("solution of triangles") || t.includes("circumradius") || t.includes("inradius") ||
      t.includes("escribed radius") || t.includes("terminal ray") || t.includes("area of the triangle") ||
      t.includes("hypotenuse") || t.includes("right angled triangle") || t.includes("m∠")
    ) {
      return 8;
    }

    // Unit 1: Complex Numbers (Strict)
    if (
      t.includes("complex number") || t.includes("argand") || t.includes("modulus") || t.includes("conjugate") ||
      t.includes("polar form") || t.includes("de moivre") || t.includes("cube roots of unity") || t.includes("omega") ||
      t.includes("ω") || t.includes("fourth roots of unity") || t.includes("real part") || t.includes("imaginary part") ||
      t.includes("i^2 = -1") || t.includes("sqrt(-1)") || (t.includes("imaginary") && !t.includes("matrix"))
    ) {
      return 1;
    }

    return 7; // XI General algebra fallback
  }

  // ==========================================
  // 5. MATHEMATICS CLASS XII
  // (Chapters 12 to 23)
  // ==========================================
  if (classLevel === "XII") {
    // Unit 23: MAPLE
    if (t.includes("maple") || t.includes("command in maple")) return 23;

    // Unit 22: Hyperbola
    if (t.includes("hyperbola") || t.includes("asymptote") || t.includes("eccentricity of hyperbola") || t.includes("conjugate axis") || t.includes("transverse axis")) return 22;

    // Unit 21: Ellipse
    if (t.includes("ellipse") || t.includes("major axis") || t.includes("minor axis") || t.includes("eccentricity of ellipse") || t.includes("foci of ellipse") || t.includes("vertices of ellipse") || t.includes("x^2/a^2 + y^2/b^2")) return 21;

    // Unit 20: Parabola
    if (t.includes("parabola") || t.includes("focus of parabola") || t.includes("vertex of parabola") || t.includes("directrix") || t.includes("latus rectum") || t.includes("y^2 = 4ax") || t.includes("x^2 = 4ay") || t.includes("axis of parabola")) return 20;

    // Unit 19: Circles
    if (t.includes("circle") || t.includes("radius of circle") || t.includes("centre of circle") || t.includes("tangent to circle") || t.includes("normal to circle") || t.includes("length of tangent") || t.includes("concentric") || (t.includes("diameter") && t.includes("circle"))) return 19;

    // Unit 18: Numerical Solution of Nonlinear Equations
    if (t.includes("numerical solution") || t.includes("bisection method") || t.includes("newton-raphson") || t.includes("newton raphson") || t.includes("regula falsi") || t.includes("iteration method") || t.includes("root of equation using")) return 18;

    // Unit 17: Integration
    if (t.includes("integrat") || t.includes("integral") || t.includes("∫") || t.includes("dx") || t.includes("area under the curve") || t.includes("area bounded by") || t.includes("integration by parts") || t.includes("definite integral") || t.includes("differential equation")) return 17;

    // Unit 16: Vector Differentiation
    if (t.includes("vector differentiation") || t.includes("scalar triple product") || t.includes("vector triple product") || t.includes("velocity vector") || t.includes("acceleration vector") || t.includes("dr/dt") || t.includes("gradient of scalar") || t.includes("divergence") || t.includes("curl") || (t.includes("velocity") && t.includes("height"))) return 16;

    // Unit 15: Higher Order Derivatives and their Applications
    if (t.includes("higher order derivative") || t.includes("d^2y/dx^2") || t.includes("second derivative") || t.includes("maxima") || t.includes("minima") || t.includes("maximum value") || t.includes("minimum value") || t.includes("point of inflection") || t.includes("rate of change") || t.includes("tangent and normal") || t.includes("equation of tangent") || t.includes("equation of normal") || (t.includes("slope of tangent") || t.includes("slope of normal"))) return 15;

    // Unit 14: Differentiation
    if (t.includes("differentiat") || t.includes("derivative") || t.includes("dy/dx") || t.includes("first principle") || t.includes("chain rule") || t.includes("product rule") || t.includes("quotient rule") || t.includes("implicit differentiation") || t.includes("derivative of")) return 14;

    // Unit 13: Functions and Limits
    if (t.includes("limit") || t.includes("lim(") || t.includes("lim_") || t.includes("continuous") || t.includes("continuity") || t.includes("domain of the function") || t.includes("even function") || t.includes("odd function") || t.includes("inverse function") || t.includes("piecewise") || t.includes("composition function") || t.includes("f ∘ g")) return 13;

    // Unit 12: Straight Line & Linear Programming
    if (t.includes("straight line") || t.includes("slope") || t.includes("gradient") || t.includes("parallel lines") || t.includes("perpendicular lines") || t.includes("angle between lines") || t.includes("distance from point to line") || t.includes("intercept") || t.includes("linear programming") || t.includes("constraints") || t.includes("objective function") || t.includes("corner points") || t.includes("feasible region") || t.includes("translation of axes") || t.includes("rotation of axes") || t.includes("homogeneous equation") || t.includes("pair of straight lines")) return 12;

    return 12;
  }

  return null;
}

async function runTest() {
  console.log("Testing Classification Accuracy on all Math Questions...");
  const { rows: questions } = await db.query(`
    SELECT q.id, q.question_number, q.question_text, pp.subject, pp.class, pp.year, pp.paper_number
    FROM questions q
    JOIN past_papers pp ON q.past_paper_id = pp.id
    WHERE pp.subject ILIKE '%Math%'
    ORDER BY pp.subject, pp.class, pp.year, pp.paper_number, q.question_number
  `);

  console.log(`Loaded ${questions.length} total math questions.`);

  const distribution: Record<string, Record<number, number>> = {};
  const mathXUnit15Questions: any[] = [];

  for (const q of questions) {
    const key = `${q.subject} Class ${q.class}`;
    if (!distribution[key]) distribution[key] = {};
    const chapNum = classifyMathQuestion(q.subject, q.class, q.question_text) || 0;
    distribution[key][chapNum] = (distribution[key][chapNum] || 0) + 1;

    if (q.subject === "Mathematics" && q.class === "X" && chapNum === 15) {
      mathXUnit15Questions.push(q);
    }
  }

  console.log("\n=== CLASSIFICATION DISTRIBUTION BY SUBJECT & CLASS ===");
  for (const [key, dist] of Object.entries(distribution)) {
    console.log(`\n📚 [${key}]:`);
    for (const [chapNum, count] of Object.entries(dist).sort(([a], [b]) => Number(a) - Number(b))) {
      console.log(`   Chapter ${chapNum}: ${count} questions`);
    }
  }

  console.log(`\n\n🎯 === MATHEMATICS CLASS X: CHAPTER 15 (QUADRATIC EQUATIONS) AUDIT ===`);
  console.log(`Total questions classified to Chapter 15: ${mathXUnit15Questions.length}`);
  for (const q of mathXUnit15Questions) {
    console.log(`   [${q.year} P${q.paper_number} Q${q.question_number}] ${q.question_text.replace(/\n/g, ' ').slice(0, 100)}...`);
  }

  process.exit(0);
}

runTest().catch(console.error);
