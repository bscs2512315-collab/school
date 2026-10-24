import assert from "node:assert/strict";
import { convertMathToHTML } from "../lib/utils/math-notation";

const limitCases = [
  "lim(<sub>x</sub>→4) 4 / (sqrt(x) - 4)",
  "lim(x->∞) (x - 1) / x",
  "lim<sub>Δx→0</sub> Δy/Δx",
  "\\lim_{x \\to 0} (sin x)/x",
  "\\lim_{x \\rightarrow \\infty} \\frac{1}{x}",
];

for (const input of limitCases) {
  const output = convertMathToHTML(input);
  assert.match(output, /class="math-limit"/);
  assert.doesNotMatch(output, /lim\s*\(/);
  assert.match(output, /→|math-arrow-right/);
}

for (const input of [
  "(<sup>3</sup>)sqrt((x + 3) / 3)",
  "³√((x + 3) / 3)",
  "\\sqrt[3]{(x + 3) / 3}",
]) {
  const output = convertMathToHTML(input);
  assert.match(output, /class="indexed-radical"/);
  assert.match(output, /class="root-index"[^>]*>3<\/span>/);
  assert.match(output, /<svg[^>]*viewBox="0 0 10 32"[^>]*preserveAspectRatio="none"/);
  assert.match(output, /class="radicand" style="border-top:1\.6px solid currentColor/);
}

for (const input of ["√(y - 1)", "&radic;3/2", "\\sqrt{x}"]) {
  const output = convertMathToHTML(input);
  assert.match(output, /class="square-radical"/);
  assert.match(output, /<svg[^>]*viewBox="0 0 10 32"[^>]*preserveAspectRatio="none"/);
  assert.match(output, /class="radicand" style="border-top:1\.6px solid currentColor/);
}

const compoundFraction = convertMathToHTML("(sin<sup>2</sup>θ + cos<sup>2</sup>θ) / (1 + tan<sup>2</sup>θ)");
assert.match(compoundFraction, /class="inline-fraction"/);
assert.match(compoundFraction, /sin<sup>2<\/sup>θ \+ cos<sup>2<\/sup>θ/);

const malicious = convertMathToHTML('<img/src="x"/onerror="alert(1)"><script>alert(2)</script>');
assert.doesNotMatch(malicious, /<(?:img|script)\b/i);
assert.match(malicious, /&lt;img/);

const trustedFormatting = convertMathToHTML("x<sup>2</sup><br>y<sub>1</sub>");
assert.match(trustedFormatting, /x<sup>2<\/sup><br\s*\/?>y<sub>1<\/sub>/);

const varianceNotation = convertMathToHTML("If &Sigma;X = 9 and &Sigma;X<sup>2</sup> = 19");
assert.match(varianceNotation, /ΣX = 9/);
assert.doesNotMatch(varianceNotation, /&amp;Sigma;/);

// Class X Mathematics Paper I (2021), Q7 has a plain X/Y fraction, followed
// by barred X and Y. This distinction changes the question's meaning.
const conjugateVariables = convertMathToHTML(
  "If \\frac{X}{Y} = \\frac{a}{2} and \\bar{X} = \\frac{a}{2}, then the value of \\bar{Y} is equal to",
);
assert.equal((conjugateVariables.match(/class="[^"]*\bmath-conjugate\b[^"]*"/g) ?? []).length, 2);
assert.equal((conjugateVariables.match(/class=\"inline-fraction\"/g) ?? []).length, 3);
assert.match(conjugateVariables, /class="numerator"[^>]*>X<\/span>/);
assert.match(conjugateVariables, /class="denominator"[^>]*>Y<\/span>/);

// Class X Mathematics 2025 Q35: English words like 'of' should not be captured in the fraction numerator
const q35Test = convertMathToHTML("On simplification of (sin<sup>2</sup>θ + cos<sup>2</sup>θ) / (1 + tan<sup>2</sup>θ), we get");
assert.match(q35Test, /On simplification of <span class="inline-fraction"/);
assert.match(q35Test, /<span class="numerator"[^>]*>sin<sup>2<\/sup>θ \+ cos<sup>2<\/sup>θ<\/span>/);
assert.doesNotMatch(q35Test, /<span class="numerator"[^>]*>of/);

// Class XII Mathematics 2025 Q11: Parenthesized coefficients like (49/10) should render as vertical fractions
const q11Test = convertMathToHTML("expressed as y = (49/10)t<sup>2</sup>, then");
assert.match(q11Test, /expressed as y = <span class="inline-fraction"/);
assert.match(q11Test, /<span class="numerator"[^>]*>49<\/span>/);
assert.match(q11Test, /<span class="denominator"[^>]*>10<\/span>/);
// Definite Integrals and Limit Stack Alignment tests
const integralCases = [
  "The value of ∫(<sub>-</sub>π)<sup>π</sup> x dx is equal to 0",
  "The value of ∫<sub>0</sub><sup>π</sup> sin x dx is equal to 2",
  "The value of \\int_{0}^{\\pi} sin x dx",
  "\\int_0^1 (x - 1) dx",
  "\\int_{-b}^{b} dx",
  "∫_b^-b dx",
];

for (const input of integralCases) {
  const output = convertMathToHTML(input);
  assert.match(output, /class="math-integral"/);
  assert.match(output, /line-height:1;margin-left:1px;margin-right:2px/);
  assert.match(output, /text-align:\s*center/);
  assert.doesNotMatch(output, /∫\s*<sub>/);
  assert.doesNotMatch(output, /\\int/);
}

// Check π upper limit alignment over -π lower limit
const piDefIntegral = convertMathToHTML("∫(<sub>-</sub>π)<sup>π</sup> x dx");
assert.match(piDefIntegral, />π<\/span><span style="margin-top:0\.2em;text-align:center(?:;)?"/);

// Check Roman Numeral multi-statement question line breaking
const q26FamilyOfLines = convertMathToHTML(
  "If l<sub>1</sub>: 2x + y - 3 = 0 and l<sub>2</sub>: x - y + 3 = 0 are two intersecting lines, then the family of lines passing through their intersecting point will be represented by I. (2x + y - 3) + 2(x - y + 3) = 0; II. (2x + y - 3) - 5(x - y + 3) = 0; III. (2x + y - 3) × (x - y + 3) = 0",
);
assert.match(q26FamilyOfLines, /represented by\s*<br \/><br \/>I\. /);
assert.match(q26FamilyOfLines, /<br \/><br \/>II\. /);
assert.match(q26FamilyOfLines, /<br \/><br \/>III\. /);

const q36BusinessExpenses = convertMathToHTML(
  "Following are the expenses incurred by a business: I. Wages paid for loading and unloading of machinery II. Salaries given to the factory security guard III. Annual license fee of the motor vehicle. The revenue expenditure(s) from the given expenses is/ are",
);
assert.match(q36BusinessExpenses, /<br \/><br \/>I\. /);
assert.match(q36BusinessExpenses, /<br \/><br \/>II\. /);
assert.match(q36BusinessExpenses, /<br \/><br \/>III\. /);

// Class XII Computer Science 2023 Q10: Roman numerals on new lines and literal underscore (_) in parentheses preserved
const csQ10Test = convertMathToHTML(
  "Which of the following is/ are allowed in variable names? I. Digits (0-9) II. Underscore (_) III. Blank space",
);
assert.match(
  csQ10Test,
  /Which of the following is\/ are allowed in variable names\?<br \/><br \/>I\. Digits \(0-9\)<br \/><br \/>II\. Underscore \(_\)<br \/><br \/>III\. Blank space/,
);
assert.match(csQ10Test, /Underscore \(_\)/);
assert.doesNotMatch(csQ10Test, /<sub>\)<\/sub>/);
assert.doesNotMatch(csQ10Test, /Underscore \(\)/);

const literalUnderscoreTest = convertMathToHTML("Underscore (_)");
assert.equal(literalUnderscoreTest, "Underscore (_)");

const varNameTest = convertMathToHTML("identifier _my_var and snake_case");
assert.match(varNameTest, /identifier _my_var and snake_case/);

// Class XII Computer Science 2023 Q6 Option A: I/O management should NOT be converted to a fraction
const ioOptionTest = convertMathToHTML("I/O management.");
assert.equal(ioOptionTest, "I/O management.");
assert.doesNotMatch(ioOptionTest, /class="inline-fraction"/);

const tcpIpTest = convertMathToHTML("TCP/IP protocol suite and (I/O) devices");
assert.equal(tcpIpTest, "TCP/IP protocol suite and (I/O) devices");
assert.doesNotMatch(tcpIpTest, /class="inline-fraction"/);

const sindhQ1 = convertMathToHTML("Which one is subset of \\mathbb{N}:");
assert.match(sindhQ1, /Which one is subset of <span class="math-bb[^>]*>ℕ<\/span>:/);
assert.doesNotMatch(sindhQ1, /\\mathbb/);

const sindhQ4 = convertMathToHTML("The order of matrix $\\begin{bmatrix} 1 & 5 & 8 \\end{bmatrix}$ is:");
assert.match(sindhQ4, /<td style="[^"]*padding:2px 8px[^"]*text-align:center[^"]*white-space:nowrap[^"]*">1<\/td>/);
assert.match(sindhQ4, /<td style="[^"]*padding:2px 8px[^"]*text-align:center[^"]*white-space:nowrap[^"]*">5<\/td>/);
assert.match(sindhQ4, /<td style="[^"]*padding:2px 8px[^"]*text-align:center[^"]*white-space:nowrap[^"]*">8<\/td>/);
assert.doesNotMatch(sindhQ4, /amp;/);

const sindhQ4Legacy = convertMathToHTML("The order of matrix [ 1 amp; 5 amp; 8 ] is:");
assert.match(sindhQ4Legacy, /<td style="[^"]*padding:2px 8px[^"]*text-align:center[^"]*white-space:nowrap[^"]*">1<\/td>/);
assert.match(sindhQ4Legacy, /<td style="[^"]*padding:2px 8px[^"]*text-align:center[^"]*white-space:nowrap[^"]*">5<\/td>/);
assert.match(sindhQ4Legacy, /<td style="[^"]*padding:2px 8px[^"]*text-align:center[^"]*white-space:nowrap[^"]*">8<\/td>/);
assert.doesNotMatch(sindhQ4Legacy, /amp;/);

const sindhQ9 = convertMathToHTML("100^\\circ, 90^\\circ, 80^\\circ, 110^\\circ, 60^{\\circ}, \\angle B = 60^\\circ");
assert.match(sindhQ9, /100°, 90°, 80°, 110°, 60°, <span class="math-angle"/);
assert.match(sindhQ9, /∠<\/span>B = 60°/);
assert.doesNotMatch(sindhQ9, /\\circ/);

const sindhTrig = convertMathToHTML("$$\\sqrt{\\frac{1 + \\cos\\theta}{1 - \\cos\\theta}} = \\frac{\\sin\\theta}{1 - \\cos\\theta}$$");
assert.match(sindhTrig, /class="square-radical"/);
assert.match(sindhTrig, /<svg[^>]*viewBox="0 0 10 32"[^>]*preserveAspectRatio="none"/);
assert.match(sindhTrig, /class="radicand"[^>]*style="border-top:1\.6px solid currentColor/);
assert.match(sindhTrig, /class="numerator"[^>]*>1 \+ cos θ<\/span>/);
assert.match(sindhTrig, /class="denominator"[^>]*>1 - cos θ<\/span>/);
assert.match(sindhTrig, /sin θ/);
assert.doesNotMatch(sindhTrig, /\\cos/);
assert.doesNotMatch(sindhTrig, /\\sin/);

// Class XII Computer Science 2023 Q16: C++ code block formatted with <pre><code> and line breaks
const csQ16Test = convertMathToHTML(
  'Use the given C++ program to answer Q.16 and Q.17: ```cpp #include <iostream> using namespace std; int x, y, z; int main () { int i=2, j=4; i==4; j=7; x=j-i; y=i*j; cout≪-x≪"\\n"; cout≪y; return 0; } ``` The number of global variables present in the given program is',
);
assert.match(csQ16Test, /<pre class="[^"]*" style="[^"]*" dir="ltr"><code>/);
assert.match(csQ16Test, /#include &lt;iostream&gt;/);
assert.match(csQ16Test, /cout&lt;&lt;-x&lt;&lt;/);
assert.doesNotMatch(csQ16Test, /cout≪/);
assert.match(csQ16Test, /<\/code><\/pre><br \/><br \/>The number of global variables/);

// Class XII Computer Science 2023 Q17: Options with newline delimiters ("5\n14", "-5\n-14") converted to <br />
const csQ17OptA = convertMathToHTML("5\\n14");
assert.equal(csQ17OptA, "5<br />14");

const csQ17OptC = convertMathToHTML("-5\\n14");
assert.equal(csQ17OptC, "-5<br />14");

// Class XII Computer Science 2023 Q48: I., II., III. on separate lines
const csQ48Test = convertMathToHTML(
  "Which of the following classes are related to C++ file handling with respect to output operations? I. ofstream II. ifstream III. fstream"
);
assert.match(csQ48Test, /operations\?<br \/><br \/>I\. ofstream<br \/><br \/>II\. ifstream<br \/><br \/>III\. fstream/);

// Class XII Computer Science 2023 Q7: List with trailing question conclusion
const csQ7Test = convertMathToHTML(
  "Consider the given tasks. I. Design the database II. Design the flowchart and algorithms III. Design the actual user interface screen IV. Generate the code for dataflow process The tasks performed in the development phase of System Development Life Cycle (SDLC) are"
);
assert.match(csQ7Test, /tasks\.<br \/><br \/>I\. Design/);
// Matrix tests: Cofactor and row/transpose questions
const cofactorQTest = convertMathToHTML(
  "The cofactor A_{22} of [ 1 2 4 \\ -1 2 5 \\ 0 1 -1 ] =:"
);
assert.match(cofactorQTest, /A<sub>22<\/sub>/);
assert.match(cofactorQTest, /<table style="border-collapse:collapse/);
assert.match(cofactorQTest, /<td[^>]*>1<\/td><td[^>]*>2<\/td><td[^>]*>4<\/td>/);
assert.match(cofactorQTest, /<td[^>]*>-1<\/td><td[^>]*>2<\/td><td[^>]*>5<\/td>/);
assert.match(cofactorQTest, /<td[^>]*>0<\/td><td[^>]*>1<\/td><td[^>]*>-1<\/td>/);
assert.match(cofactorQTest, /=\s*:\s*$/);

const matrixTransposeTest = convertMathToHTML("The matrix [ 1 2 3 ]^t is a:");
assert.match(matrixTransposeTest, /<td[^>]*>1<\/td><td[^>]*>2<\/td><td[^>]*>3<\/td>/);
assert.match(matrixTransposeTest, /<\/span><sup>t<\/sup> is a:/);

// Physics unit vector test (i_hat, j_hat)
const unitVectorTest = convertMathToHTML("Consider a uniform electric field E = 300 i_hat + 400 j_hat N/C .");
assert.match(unitVectorTest, /class="math-unit-vector"/);
assert.match(unitVectorTest, /class="unit-letter"[^>]*>i<\/span>/);
assert.match(unitVectorTest, /class="unit-letter"[^>]*>j<\/span>/);
assert.doesNotMatch(unitVectorTest, /i_hat/);
assert.doesNotMatch(unitVectorTest, /j_hat/);

// Physics radius subscript test (r1, r2)
const radiusSubscriptTest = convertMathToHTML("inner radius r1 and outer radius r2");
assert.match(radiusSubscriptTest, /r<sub>1<\/sub>/);
assert.match(radiusSubscriptTest, /r<sub>2<\/sub>/);

// Capacitance single-line option tests (1.5 * C, 1.5\n• C)
assert.equal(convertMathToHTML("1.5 * C"), "1.5 C");
assert.equal(convertMathToHTML("1.5\n• C"), "1.5 C");

// Electrostatic fraction test with negative sign and r_1^2
const electrostaticFractionTest = convertMathToHTML("-\\frac{Q}{4 * pi * r_1^2}");
assert.doesNotMatch(electrostaticFractionTest, /math-nuclide/);
assert.doesNotMatch(electrostaticFractionTest, /math-bullet/);
assert.match(electrostaticFractionTest, /4 [·×] π [·×] r<sub>1<\/sub><sup>2<\/sup>/);
assert.match(electrostaticFractionTest, /[−-]\s*<\/span><span class="inline-fraction"/);

// Complex number conjugates and overline vinculum tests
const conjugateTest1 = convertMathToHTML("\\overline{z_1 - z_2}");
assert.match(conjugateTest1, /class="math-overline math-conjugate" style="[^"]*border-top:1\.5px solid currentColor/);
assert.doesNotMatch(conjugateTest1, /text-decoration:overline/);
assert.match(conjugateTest1, /z<sub>1<\/sub> - z<sub>2<\/sub>/);

const nestedConjugateTest = convertMathToHTML("\\overline{\\bar{z}_1 - \\bar{z}_2}");
assert.match(nestedConjugateTest, /<span class="math-overline math-conjugate"[^>]*><span class="math-overline math-conjugate"[^>]*>z<\/span><sub>1<\/sub> - <span class="math-overline math-conjugate"[^>]*>z<\/span><sub>2<\/sub><\/span>/);

const doubleNestedConjugateTest = convertMathToHTML("\\overline{\\overline{z_1} - \\overline{z_2}}");
assert.match(doubleNestedConjugateTest, /<span class="math-overline math-conjugate"[^>]*><span class="math-overline math-conjugate"[^>]*>z<sub>1<\/sub><\/span> - <span class="math-overline math-conjugate"[^>]*>z<sub>2<\/sub><\/span><\/span>/);

// RC Circuit Exponential and Subscript Tests
const rcQuestion1 = convertMathToHTML(
  "The charge on the capacitor as a function of time t is given by q(t) = Q_max (1 - e^-\\frac{t}{RC}) and voltage V_0",
);
assert.match(rcQuestion1, /Q<sub>max<\/sub>/);
assert.match(rcQuestion1, /V<sub>0<\/sub>/);
assert.doesNotMatch(rcQuestion1, /class="math-unit-vector"/);
assert.match(rcQuestion1, /e<sup>/);
assert.match(rcQuestion1, /class="inline-fraction"/);

const rcQuestion2 = convertMathToHTML(
  "q(t) = Q_max (1 - e^{-\\frac{t}{RC}})",
);
assert.match(rcQuestion2, /Q<sub>max<\/sub>/);
assert.doesNotMatch(rcQuestion2, /class="math-unit-vector"/);
assert.match(rcQuestion2, /e<sup>/);

const rcQuestion3 = convertMathToHTML(
  "q(t) = Q_max (1 - e^-t/RC)",
);
assert.match(rcQuestion3, /Q<sub>max<\/sub>/);
assert.doesNotMatch(rcQuestion3, /class="math-unit-vector"/);
assert.match(rcQuestion3, /e<sup>/);

// Fractional Exponents Tests
const fracExp1 = convertMathToHTML("x^\\frac{1}{2} + y^\\frac{1}{2} = a^\\frac{1}{2}");
assert.doesNotMatch(fracExp1, /class="math-unit-vector"/);
assert.match(fracExp1, /x<sup><span class="inline-fraction"/);

const fracExp2 = convertMathToHTML("r^3/2 and x^1/2");
assert.doesNotMatch(fracExp2, /class="math-unit-vector"/);
assert.match(fracExp2, /r<sup><span class="inline-fraction"/);

// Physics Subscripts Tests
const physicsSubscripts = convertMathToHTML("I_rms = 5 A, v_avg = 20 m/s, P_max = 100 W, k_B, N_A, R_eq");
assert.match(physicsSubscripts, /I<sub>rms<\/sub>/);
assert.match(physicsSubscripts, /v<sub>avg<\/sub>/);
assert.match(physicsSubscripts, /P<sub>max<\/sub>/);
assert.match(physicsSubscripts, /k<sub>B<\/sub>/);
assert.match(physicsSubscripts, /N<sub>A<\/sub>/);
assert.match(physicsSubscripts, /R<sub>eq<\/sub>/);

// Fractions with Exponents / Parentheses (AKUEB Class XI Math Q13)
const q13OptA = convertMathToHTML("a<sup>n</sup> / a");
assert.match(q13OptA, /class="inline-fraction"/);
assert.match(q13OptA, /class="numerator"[^>]*>a<sup>n<\/sup><\/span>/);
assert.match(q13OptA, /class="denominator"[^>]*>a<\/span>/);

const q13OptB = convertMathToHTML("(-a)<sup>n</sup> / a");
assert.match(q13OptB, /class="inline-fraction"/);
assert.match(q13OptB, /class="numerator"[^>]*>\(-a\)<sup>n<\/sup><\/span>/);
assert.match(q13OptB, /class="denominator"[^>]*>a<\/span>/);

const q13OptAVariant = convertMathToHTML("a^n / a");
assert.match(q13OptAVariant, /class="inline-fraction"/);
assert.match(q13OptAVariant, /class="numerator"[^>]*>a<sup>n<\/sup><\/span>/);

const q13OptBVariant = convertMathToHTML("(-a)^n / a");
assert.match(q13OptBVariant, /class="inline-fraction"/);
assert.match(q13OptBVariant, /class="numerator"[^>]*>\(-a\)<sup>n<\/sup><\/span>/);

// AKUEB Class XI Math Q16: Fraction with exponent wrapped in tall parentheses and × for multiplication
const q16Test = convertMathToHTML("1.67 * (4/100)^8");
assert.match(q16Test, /1\.67 × /);
assert.match(q16Test, /<svg viewBox="0 0 8 32"/);
assert.match(q16Test, /class="inline-fraction"/);
assert.match(q16Test, /class="numerator"[^>]*>4<\/span>/);
assert.match(q16Test, /class="denominator"[^>]*>100<\/span>/);
assert.match(q16Test, /<\/svg><\/span><sup>8<\/sup>/);

// AKUEB Class XI Math Q21: Fraction inside brackets with factorials and × for multiplication
const q21Test = convertMathToHTML("1! * [0! * n! / (n-1)!]");
assert.match(q21Test, /1! × /);
assert.match(q21Test, /class="inline-fraction"/);
assert.match(q21Test, /class="numerator"[^>]*>0! × n!<\/span>/);
assert.match(q21Test, /class="denominator"[^>]*>\(n-1\)!<\/span>/);

// AKUEB Class XI Math Q27: Multi-factor numerators in question statement and options C & D
const q27Question = convertMathToHTML(
  "1³ + 2³ + 3³ + ... + K³ = K²(K+1)² / 4 is true for (K+1)th term, the term that should be added to both sides is",
);
assert.match(q27Question, /class="inline-fraction"/);
assert.match(q27Question, /class="numerator"[^>]*>K<sup>2<\/sup>\(K\+1\)<sup>2<\/sup><\/span>/);
assert.match(q27Question, /class="denominator"[^>]*>4<\/span>/);
assert.match(q27Question, /1<sup>3<\/sup> \+ 2<sup>3<\/sup> \+ 3<sup>3<\/sup> \+ \.\.\. \+ K<sup>3<\/sup>/);

const q27OptC = convertMathToHTML("(K+1)²(K+2)² / 4");
assert.match(q27OptC, /class="inline-fraction"/);
assert.match(q27OptC, /class="numerator"[^>]*>\(K\+1\)<sup>2<\/sup>\(K\+2\)<sup>2<\/sup><\/span>/);
assert.match(q27OptC, /class="denominator"[^>]*>4<\/span>/);

const q27OptD = convertMathToHTML("(K+1)³(K+2)³ / 4");
assert.match(q27OptD, /class="inline-fraction"/);
assert.match(q27OptD, /class="numerator"[^>]*>\(K\+1\)<sup>3<\/sup>\(K\+2\)<sup>3<\/sup><\/span>/);
assert.match(q27OptD, /class="denominator"[^>]*>4<\/span>/);

// AKUEB Class XI Math Q37: Fraction with square-rooted numerator or denominator
const q37OptA = convertMathToHTML("+/- sqrt(7)/4");
assert.match(q37OptA, />±<\/span>/);
assert.match(q37OptA, /class="inline-fraction"/);
assert.match(q37OptA, /class="numerator"[^>]*><span class="square-radical"[^>]*>.*class="radicand"[^>]*>7<\/span><\/span><\/span>/);
assert.match(q37OptA, /class="denominator"[^>]*>4<\/span>/);

const q37OptAVariant = convertMathToHTML("± √ 7/4");
assert.match(q37OptAVariant, /class="inline-fraction"/);
assert.match(q37OptAVariant, /class="numerator"[^>]*><span class="square-radical"[^>]*>.*class="radicand"[^>]*>7<\/span><\/span><\/span>/);
assert.match(q37OptAVariant, /class="denominator"[^>]*>4<\/span>/);

const q37OptB = convertMathToHTML("+/- 4/sqrt(7)");
assert.match(q37OptB, />±<\/span>/);
assert.match(q37OptB, /class="inline-fraction"/);
assert.match(q37OptB, /class="numerator"[^>]*>4<\/span>/);
assert.match(q37OptB, /class="denominator"[^>]*><span class="square-radical"[^>]*>.*class="radicand"[^>]*>7<\/span><\/span><\/span>/);

// Radical wrapping whole fraction: √(7/4)
const rootWholeFrac = convertMathToHTML("√(7/4)");
assert.match(rootWholeFrac, /class="square-radical"/);
assert.match(rootWholeFrac, /class="radicand"[^>]*><span class="inline-fraction"/);

// AKUEB Class XI Math Q39: Plain text 'theta' conversion to Greek symbol 'θ'
const q39Question = convertMathToHTML("On simplification of sec<sup>2</sup> theta - tan<sup>2</sup> theta - 1, we get");
assert.doesNotMatch(q39Question, /\btheta\b/i);
assert.match(q39Question, /sec<sup>2<\/sup> θ - tan<sup>2<\/sup> θ - 1/);

const q39OptC = convertMathToHTML("2tan<sup>2</sup> theta");
assert.doesNotMatch(q39OptC, /\btheta\b/i);
assert.match(q39OptC, /2tan<sup>2<\/sup> θ/);

const q39OptD = convertMathToHTML("2sec<sup>2</sup> theta");
assert.doesNotMatch(q39OptD, /\btheta\b/i);
assert.match(q39OptD, /2sec<sup>2<\/sup> θ/);

// AKUEB Class XI Math Q41: Roman numeral formulae with stacked fractions and theta
const q41Question = convertMathToHTML("Which of the following formulae is/ are equal to cos θ? I. sin(π/2 - θ) II. sin(π/2 + θ) III. sin(3π/2 - θ)");
assert.match(q41Question, /Which of the following formulae is\/ are equal to cos θ\?<br \/><br \/>/);
assert.match(q41Question, /I\. sin\(.*class="inline-fraction".*π.*2.* - θ\)<br \/><br \/>/);
assert.match(q41Question, /II\. sin\(.*class="inline-fraction".*π.*2.* \+ θ\)<br \/><br \/>/);
assert.match(q41Question, /III\. sin\(.*class="inline-fraction".*3π.*2.* - θ\)/);

// Physics notation tests: Greek symbols like epsilon and rho
const plasmaEquation = convertMathToHTML(
  "Consider a physical equation describing plasma oscillations: \\omega^2 = \\frac{n \\times e^2}{epsilon_0 \\times m}, where \\omega is angular frequency, n is number density (m^-3), e is elementary charge, epsilon_0 is permittivity of free space, and m is mass. Checking the homogeneity of this equation using SI base units reveals that the unit of \\omega^2 is:",
);
assert.match(plasmaEquation, /ε<sub>0<\/sub> × m/);
assert.match(plasmaEquation, /ε<sub>0<\/sub> is permittivity of free space/);
assert.doesNotMatch(plasmaEquation, /epsilon/);

const rhoDensityQuestion = convertMathToHTML(
  "The density of the fluid is rho = 1000 kg/m^3. Calculate P = rho * g * h where (Density unit) rho is in kg/m^3.",
);
assert.match(rhoDensityQuestion, /ρ = 1000/);
assert.match(rhoDensityQuestion, /P = ρ × g × h/);
assert.match(rhoDensityQuestion, /\(Density unit\) ρ/);
assert.doesNotMatch(rhoDensityQuestion, /\brho\b/);

console.log(JSON.stringify({
  limitCases: limitCases.length,
  integralCases: integralCases.length,
  romanCases: 3,
  indexedRadicalCases: 3,
  squareRadicalCases: 3,
  xssCases: 1,
  q35Case: "verified",
  q11Case: "verified",
  csQ10Case: "verified",
  csQ48Case: "verified",
  csQ7Case: "verified",
  ioCase: "verified",
  csQ16Case: "verified",
  csQ17Case: "verified",
  sindhBoardCases: "verified",
  rcCircuitCases: "verified",
  physicsSubscriptsCases: "verified",
  q13Cases: "verified",
  q16Case: "verified",
  q21Case: "verified",
  q27Cases: "verified",
  q37Cases: "verified",
  q39Cases: "verified",
  q41Cases: "verified",
  greekEpsilonRhoCases: "verified",
  status: "verified"
}));






