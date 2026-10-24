import "dotenv/config";
import { db } from "@/lib/db";

interface QuestionPart {
  partNumber: string;
  partText: string;
  solution: string;
  explanation?: string;
}

interface ExerciseQuestion {
  questionNumber: string;
  questionText: string;
  parts: QuestionPart[];
}

interface SeedExerciseText {
  classLevel: string;
  chapterNumber: number;
  exerciseNumber: string;
  title: string;
  questions: ExerciseQuestion[];
}

const SEED_DATA: SeedExerciseText[] = [
  {
    classLevel: "X",
    chapterNumber: 17,
    exerciseNumber: "Exercise 17.1",
    title: "Sets and Functions - Exercise 17.1",
    questions: [
      {
        questionNumber: "Q.1",
        questionText: "Write the following sets in tabular (roster) form:",
        parts: [
          {
            partNumber: "i",
            partText: "A = Set of all natural numbers less than 10",
            solution: "$A = \\{1, 2, 3, 4, 5, 6, 7, 8, 9\\}$",
            explanation: "Natural numbers start from $1$. Numbers strictly less than $10$ are $1$ through $9$."
          },
          {
            partNumber: "ii",
            partText: "B = Set of all prime numbers between 10 and 25",
            solution: "$B = \\{11, 13, 17, 19, 23\\}$",
            explanation: "Prime numbers have only two distinct positive divisors ($1$ and itself)."
          },
          {
            partNumber: "iii",
            partText: "C = Set of all integers between -3 and 4",
            solution: "$C = \\{-2, -1, 0, 1, 2, 3\\}$",
            explanation: "Integers strictly between $-3$ and $4$ are $-2, -1, 0, 1, 2, 3$."
          },
          {
            partNumber: "iv",
            partText: "D = Set of all whole numbers less than or equal to 8",
            solution: "$D = \\{0, 1, 2, 3, 4, 5, 6, 7, 8\\}$",
            explanation: "Whole numbers $\\mathbb{W}$ begin at $0$. Numbers $\\le 8$ include $0$ through $8$."
          },
          {
            partNumber: "v",
            partText: "E = Set of even numbers between 1 and 15",
            solution: "$E = \\{2, 4, 6, 8, 10, 12, 14\\}$",
            explanation: "Even integers divisible by $2$ within the range $(1, 15)$."
          }
        ]
      },
      {
        questionNumber: "Q.2",
        questionText: "Write the following sets in set builder form:",
        parts: [
          {
            partNumber: "i",
            partText: "A = Set of all rational numbers between 5 and 6",
            solution: "$A = \\{x \\mid x \\in \\mathbb{Q} \\wedge 5 < x < 6\\}$",
            explanation: "Rational numbers are represented by $\\mathbb{Q}$. The condition $5 < x < 6$ defines the bounded interval."
          },
          {
            partNumber: "ii",
            partText: "B = {1, 2, 3, 4, 6, 12}",
            solution: "$B = \\{x \\mid x \\text{ is a positive divisor of } 12\\}$",
            explanation: "All elements are the exact factors/divisors of $12$."
          },
          {
            partNumber: "iii",
            partText: "C = {0, ±1, ±2, ... ±40}",
            solution: "$C = \\{x \\mid x \\in \\mathbb{Z} \\wedge -40 \\le x \\le 40\\}$",
            explanation: "Integers $\\mathbb{Z}$ from $-40$ to $+40$ inclusive."
          },
          {
            partNumber: "iv",
            partText: "D = {-4, -2, 0, 2, 4}",
            solution: "$D = \\{x \\mid x \\in \\mathbb{E} \\wedge -4 \\le x \\le 4\\}$",
            explanation: "Even integers $\\mathbb{E}$ bounded between $-4$ and $4$."
          },
          {
            partNumber: "v",
            partText: "E = {1, 4, 9, 16, 25}",
            solution: "$E = \\{x \\mid x = n^2, n \\in \\mathbb{N} \\wedge 1 \\le n \\le 5\\}$",
            explanation: "Each element is the perfect square of the first five natural numbers ($1^2, 2^2, 3^2, 4^2, 5^2$)."
          },
          {
            partNumber: "vi",
            partText: "F = {-1, -3, -5, -7}",
            solution: "$F = \\{x \\mid x \\in \\mathbb{O}^- \\wedge x \\ge -7\\}$",
            explanation: "Negative odd integers greater than or equal to $-7$."
          }
        ]
      },
      {
        questionNumber: "Q.3",
        questionText: "If $A = \\{1, 2, 3, 4, 5\\}$ and $B = \\{2, 4, 6, 8\\}$, find the following operations:",
        parts: [
          {
            partNumber: "i",
            partText: "A \\cup B",
            solution: "$A \\cup B = \\{1, 2, 3, 4, 5\\} \\cup \\{2, 4, 6, 8\\} = \\{1, 2, 3, 4, 5, 6, 8\\}$",
            explanation: "Union contains all elements present in set $A$, set $B$, or both without duplication."
          },
          {
            partNumber: "ii",
            partText: "A \\cap B",
            solution: "$A \\cap B = \\{1, 2, 3, 4, 5\\} \\cap \\{2, 4, 6, 8\\} = \\{2, 4\\}$",
            explanation: "Intersection contains only the elements common to both set $A$ and set $B$."
          },
          {
            partNumber: "iii",
            partText: "A - B",
            solution: "$A - B = \\{1, 2, 3, 4, 5\\} - \\{2, 4, 6, 8\\} = \\{1, 3, 5\\}$",
            explanation: "Difference $A - B$ consists of elements in $A$ that are not in $B$."
          },
          {
            partNumber: "iv",
            partText: "B - A",
            solution: "$B - A = \\{2, 4, 6, 8\\} - \\{1, 2, 3, 4, 5\\} = \\{6, 8\\}$",
            explanation: "Difference $B - A$ consists of elements in $B$ that are not in $A$."
          },
          {
            partNumber: "v",
            partText: "A \\Delta B \\text{ (Symmetric Difference)}",
            solution: "$A \\Delta B = (A - B) \\cup (B - A) = \\{1, 3, 5\\} \\cup \\{6, 8\\} = \\{1, 3, 5, 6, 8\\}$",
            explanation: "Symmetric difference contains elements in either $A$ or $B$, but not in both."
          }
        ]
      },
      {
        questionNumber: "Q.4",
        questionText: "If the universal set $U = \\{1, 2, 3, 4, 5, 6, 7, 8, 9, 10\\}$, $A = \\{2, 4, 6, 8, 10\\}$, and $B = \\{1, 3, 5, 7, 9\\}$, verify:",
        parts: [
          {
            partNumber: "i",
            partText: "A' = B",
            solution: "$A' = U - A = \\{1, 2, 3, 4, 5, 6, 7, 8, 9, 10\\} - \\{2, 4, 6, 8, 10\\} = \\{1, 3, 5, 7, 9\\} = B$",
            explanation: "Complement of even numbers in $U$ equals the set of odd numbers $B$."
          },
          {
            partNumber: "ii",
            partText: "B' = A",
            solution: "$B' = U - B = \\{1, 2, 3, 4, 5, 6, 7, 8, 9, 10\\} - \\{1, 3, 5, 7, 9\\} = \\{2, 4, 6, 8, 10\\} = A$",
            explanation: "Complement of odd numbers in $U$ equals the set of even numbers $A$."
          },
          {
            partNumber: "iii",
            partText: "De Morgan's First Law: (A \\cup B)' = A' \\cap B'",
            solution: "**LHS:**\n$$A \\cup B = \\{1, 2, 3, 4, 5, 6, 7, 8, 9, 10\\} = U$$\n$$(A \\cup B)' = U - U = \\phi$$\n\n**RHS:**\n$$A' = \\{1, 3, 5, 7, 9\\}, \\quad B' = \\{2, 4, 6, 8, 10\\}$$\n$$A' \\cap B' = \\{1, 3, 5, 7, 9\\} \\cap \\{2, 4, 6, 8, 10\\} = \\phi$$\n\n$$\\text{Since LHS} = \\text{RHS} = \\phi, \\text{ hence verified.}$$",
            explanation: "The complement of the union equals the intersection of the individual complements."
          },
          {
            partNumber: "iv",
            partText: "De Morgan's Second Law: (A \\cap B)' = A' \\cup B'",
            solution: "**LHS:**\n$$A \\cap B = \\phi$$\n$$(A \\cap B)' = U - \\phi = U = \\{1, 2, 3, 4, 5, 6, 7, 8, 9, 10\\}$$\n\n**RHS:**\n$$A' \\cup B' = \\{1, 3, 5, 7, 9\\} \\cup \\{2, 4, 6, 8, 10\\} = \\{1, 2, 3, 4, 5, 6, 7, 8, 9, 10\\} = U$$\n\n$$\\text{Since LHS} = \\text{RHS} = U, \\text{ hence verified.}$$",
            explanation: "The complement of the intersection equals the union of the individual complements."
          }
        ]
      }
    ]
  },
  {
    classLevel: "X",
    chapterNumber: 17,
    exerciseNumber: "Exercise 17.2",
    title: "Sets and Functions - Exercise 17.2",
    questions: [
      {
        questionNumber: "Q.1",
        questionText: "If $A = \\{1, 2\\}$ and $B = \\{a, b, c\\}$, find Cartesian products and verify their cardinalities:",
        parts: [
          {
            partNumber: "i",
            partText: "A \\times B",
            solution: "$A \\times B = \\{(1, a), (1, b), (1, c), (2, a), (2, b), (2, c)\\}$\n$$n(A \\times B) = n(A) \\times n(B) = 2 \\times 3 = 6$$",
            explanation: "Cartesian product consists of all ordered pairs $(x, y)$ where $x \\in A$ and $y \\in B$."
          },
          {
            partNumber: "ii",
            partText: "B \\times A",
            solution: "$B \\times A = \\{(a, 1), (a, 2), (b, 1), (b, 2), (c, 1), (c, 2)\\}$\n$$n(B \\times A) = 3 \\times 2 = 6$$",
            explanation: "Note that $A \\times B \\ne B \\times A$ because ordered pairs are directional."
          },
          {
            partNumber: "iii",
            partText: "A \\times A",
            solution: "$A \\times A = \\{(1, 1), (1, 2), (2, 1), (2, 2)\\}$\n$$n(A \\times A) = 2 \\times 2 = 4$$",
            explanation: "Cartesian product of set $A$ with itself."
          }
        ]
      },
      {
        questionNumber: "Q.2",
        questionText: "Find the domain and range for each of the following binary relations on $\\mathbb{R}$:",
        parts: [
          {
            partNumber: "i",
            partText: "R_1 = \\{(1, 2), (2, 3), (3, 4), (4, 5)\\}",
            solution: "$$\\text{Domain}(R_1) = \\{1, 2, 3, 4\\}$$\n$$\\text{Range}(R_1) = \\{2, 3, 4, 5\\}$$",
            explanation: "Domain is the set of all first components; Range is the set of all second components."
          },
          {
            partNumber: "ii",
            partText: "R_2 = \\{(x, y) \\mid y = 2x + 1, x \\in \\{0, 1, 2, 3\\}\\}",
            solution: "Calculate $y$ values:\n- $x = 0 \\implies y = 1$\n- $x = 1 \\implies y = 3$\n- $x = 2 \\implies y = 5$\n- $x = 3 \\implies y = 7$\n\n$$R_2 = \\{(0, 1), (1, 3), (2, 5), (3, 7)\\}$$\n$$\\text{Domain}(R_2) = \\{0, 1, 2, 3\\}, \\quad \\text{Range}(R_2) = \\{1, 3, 5, 7\\}$$",
            explanation: "Substitute each value from the domain into the relation formula."
          }
        ]
      }
    ]
  },
  {
    classLevel: "X",
    chapterNumber: 18,
    exerciseNumber: "Exercise 18.1",
    title: "Variations - Exercise 18.1",
    questions: [
      {
        questionNumber: "Q.1",
        questionText: "Find the ratio $x : y$ in simplest form:",
        parts: [
          {
            partNumber: "i",
            partText: "3(4x - 5y) = 2(x + 2y)",
            solution: "$$12x - 15y = 2x + 4y$$\n$$12x - 2x = 4y + 15y$$\n$$10x = 19y$$\n$$\\frac{x}{y} = \\frac{19}{10} \\implies x : y = 19 : 10$$",
            explanation: "Distribute, group like terms with $x$ on LHS and $y$ on RHS, then divide to find $\\frac{x}{y}$."
          },
          {
            partNumber: "ii",
            partText: "(2x + 3y) : (3x - 2y) = 4 : 5",
            solution: "$$\\frac{2x + 3y}{3x - 2y} = \\frac{4}{5}$$\n$$5(2x + 3y) = 4(3x - 2y)$$\n$$10x + 15y = 12x - 8y$$\n$$15y + 8y = 12x - 10x$$\n$$23y = 2x$$\n$$\\frac{x}{y} = \\frac{23}{2} \\implies x : y = 23 : 2$$",
            explanation: "Cross-multiply the proportion equation to isolate the variables."
          }
        ]
      },
      {
        questionNumber: "Q.2",
        questionText: "Find the value of $m$ in the following proportion:",
        parts: [
          {
            partNumber: "i",
            partText: "(3m - 4) : 5 :: (2m + 1) : 3",
            solution: "$$\\text{Product of Extremes} = \\text{Product of Means}$$\n$$3(3m - 4) = 5(2m + 1)$$\n$$9m - 12 = 10m + 5$$\n$$9m - 10m = 5 + 12$$\n$$-m = 17 \\implies m = -17$$",
            explanation: "In any proportion $a : b :: c : d$, the product of extremes ($ad$) equals the product of means ($bc$)."
          }
        ]
      }
    ]
  },
  {
    classLevel: "X",
    chapterNumber: 19,
    exerciseNumber: "Exercise 19.1",
    title: "Matrices and Determinants - Exercise 19.1",
    questions: [
      {
        questionNumber: "Q.1",
        questionText: "Find the order of the following matrices and state whether they are row, column, square, or rectangular:",
        parts: [
          {
            partNumber: "i",
            partText: "A = \\begin{bmatrix} 2 & 5 & -1 \\end{bmatrix}",
            solution: "$$\\text{Order of } A = 1 \\times 3$$\n$$\\text{Type: Row Matrix (and Rectangular Matrix)}$$",
            explanation: "It has $1$ row and $3$ columns."
          },
          {
            partNumber: "ii",
            partText: "B = \\begin{bmatrix} 3 \\\\ -4 \\\\ 7 \\end{bmatrix}",
            solution: "$$\\text{Order of } B = 3 \\times 1$$\n$$\\text{Type: Column Matrix (and Rectangular Matrix)}$$",
            explanation: "It has $3$ rows and $1$ column."
          },
          {
            partNumber: "iii",
            partText: "C = \\begin{bmatrix} 1 & 0 \\\\ 0 & 1 \\end{bmatrix}",
            solution: "$$\\text{Order of } C = 2 \\times 2$$\n$$\\text{Type: Square Matrix (Identity / Unit Matrix } I_2\\text{)}$$",
            explanation: "Number of rows equals number of columns with $1$ on the main diagonal."
          }
        ]
      },
      {
        questionNumber: "Q.2",
        questionText: "Find the determinant and inverse (if possible) of the matrix $M = \\begin{bmatrix} 4 & 2 \\\\ 3 & 2 \\end{bmatrix}$:",
        parts: [
          {
            partNumber: "i",
            partText: "\\text{Find } |M| \\text{ and determine if it is singular or non-singular.}",
            solution: "$$|M| = (4)(2) - (2)(3) = 8 - 6 = 2$$\n$$\\text{Since } |M| = 2 \\ne 0, M \\text{ is non-singular and } M^{-1} \\text{ exists.}$$",
            explanation: "Formula for $2 \\times 2$ determinant: $|\\begin{bmatrix} a & b \\\\ c & d \\end{bmatrix}| = ad - bc$."
          },
          {
            partNumber: "ii",
            partText: "\\text{Find } M^{-1}",
            solution: "$$\\text{Adj}(M) = \\begin{bmatrix} 2 & -2 \\\\ -3 & 4 \\end{bmatrix}$$\n$$M^{-1} = \\frac{1}{|M|} \\text{Adj}(M) = \\frac{1}{2} \\begin{bmatrix} 2 & -2 \\\\ -3 & 4 \\end{bmatrix} = \\begin{bmatrix} 1 & -1 \\\\ -\\frac{3}{2} & 2 \\end{bmatrix}$$",
            explanation: "Adjoint is formed by swapping diagonal elements and negating off-diagonal elements."
          }
        ]
      }
    ]
  },
  {
    classLevel: "X",
    chapterNumber: 20,
    exerciseNumber: "Exercise 20.1",
    title: "Theory of Quadratic Equations - Exercise 20.1",
    questions: [
      {
        questionNumber: "Q.1",
        questionText: "Find the discriminant of the following quadratic equations and discuss the nature of roots:",
        parts: [
          {
            partNumber: "i",
            partText: "2x^2 - 7x + 3 = 0",
            solution: "Comparing with $ax^2 + bx + c = 0$:\n$$a = 2, \\quad b = -7, \\quad c = 3$$\n$$\\text{Discriminant } D = b^2 - 4ac = (-7)^2 - 4(2)(3) = 49 - 24 = 25$$\n\n$$\\text{Since } D > 0 \\text{ and is a perfect square } (25 = 5^2):$$\n$$\\mathbf{\\text{The roots are real, rational, and unequal (distinct).}}$$",
            explanation: "When $D > 0$ and is a perfect square of a rational number, roots are rational and distinct."
          },
          {
            partNumber: "ii",
            partText: "x^2 - 6x + 9 = 0",
            solution: "$$a = 1, \\quad b = -6, \\quad c = 9$$\n$$D = b^2 - 4ac = (-6)^2 - 4(1)(9) = 36 - 36 = 0$$\n\n$$\\text{Since } D = 0:$$\n$$\\mathbf{\\text{The roots are real, rational, and equal.}}$$",
            explanation: "When discriminant $D = 0$, the quadratic is a perfect square with identical roots."
          },
          {
            partNumber: "iii",
            partText: "3x^2 + 2x + 1 = 0",
            solution: "$$a = 3, \\quad b = 2, \\quad c = 1$$\n$$D = b^2 - 4ac = (2)^2 - 4(3)(1) = 4 - 12 = -8$$\n\n$$\\text{Since } D < 0:$$\n$$\\mathbf{\\text{The roots are imaginary (complex conjugates) and unequal.}}$$",
            explanation: "Negative discriminant produces square roots of negative numbers, yielding complex conjugate roots."
          }
        ]
      }
    ]
  },
  {
    classLevel: "X",
    chapterNumber: 30,
    exerciseNumber: "Exercise 30.1",
    title: "Introduction to Trigonometry - Exercise 30.1",
    questions: [
      {
        questionNumber: "Q.1",
        questionText: "Convert the following angles from degree measure to radian measure:",
        parts: [
          {
            partNumber: "i",
            partText: "30^\\circ",
            solution: "$$30^\\circ = 30 \\times \\frac{\\pi}{180} = \\frac{\\pi}{6} \\text{ radians}$$",
            explanation: "To convert degrees to radians, multiply by $\\frac{\\pi}{180^\\circ}$."
          },
          {
            partNumber: "ii",
            partText: "45^\\circ",
            solution: "$$45^\\circ = 45 \\times \\frac{\\pi}{180} = \\frac{\\pi}{4} \\text{ radians}$$",
            explanation: "Simplify the fraction $\\frac{45}{180} = \\frac{1}{4}$."
          },
          {
            partNumber: "iii",
            partText: "60^\\circ",
            solution: "$$60^\\circ = 60 \\times \\frac{\\pi}{180} = \\frac{\\pi}{3} \\text{ radians}$$",
            explanation: "Simplify $\\frac{60}{180} = \\frac{1}{3}$."
          },
          {
            partNumber: "iv",
            partText: "90^\\circ",
            solution: "$$90^\\circ = 90 \\times \\frac{\\pi}{180} = \\frac{\\pi}{2} \\text{ radians}$$",
            explanation: "Right angle in radian measure."
          }
        ]
      },
      {
        questionNumber: "Q.2",
        questionText: "Verify the fundamental trigonometric identities:",
        parts: [
          {
            partNumber: "i",
            partText: "\\sin^2 \\theta + \\cos^2 \\theta = 1 \\text{ for } \\theta = 30^\\circ",
            solution: "$$\\sin 30^\\circ = \\frac{1}{2}, \\quad \\cos 30^\\circ = \\frac{\\sqrt{3}}{2}$$\n$$\\text{LHS} = \\left(\\frac{1}{2}\\right)^2 + \\left(\\frac{\\sqrt{3}}{2}\\right)^2 = \\frac{1}{4} + \\frac{3}{4} = \\frac{4}{4} = 1 = \\text{RHS}$$\n$$\\text{Hence verified.}$$",
            explanation: "Substitute standard trigonometric values into the Pythagorean identity."
          }
        ]
      }
    ]
  },
  {
    classLevel: "IX",
    chapterNumber: 1,
    exerciseNumber: "Exercise 1.1",
    title: "Real and Complex Numbers - Exercise 1.1",
    questions: [
      {
        questionNumber: "Q.1",
        questionText: "Identify which of the following numbers are Rational ($\\mathbb{Q}$) and which are Irrational ($\\mathbb{Q}'$):",
        parts: [
          {
            partNumber: "i",
            partText: "\\frac{1}{5}",
            solution: "$$\\frac{1}{5} = 0.2 \\implies \\text{Rational Number } (\\mathbb{Q})$$",
            explanation: "Terminating decimal is always a rational number."
          },
          {
            partNumber: "ii",
            partText: "\\sqrt{2}",
            solution: "$$\\sqrt{2} = 1.4142135... \\implies \\text{Irrational Number } (\\mathbb{Q}')$$",
            explanation: "Square root of a non-perfect square is a non-terminating and non-recurring decimal."
          },
          {
            partNumber: "iii",
            partText: "\\pi",
            solution: "$$\\pi = 3.14159265... \\implies \\text{Irrational Number } (\\mathbb{Q}')$$",
            explanation: "Pi is the ratio of a circle's circumference to its diameter, which cannot be expressed as a ratio of two integers."
          },
          {
            partNumber: "iv",
            partText: "0.\\overline{3} = 0.3333...",
            solution: "$$0.\\overline{3} = \\frac{1}{3} \\implies \\text{Rational Number } (\\mathbb{Q})$$",
            explanation: "A repeating/recurring decimal can always be expressed in $\\frac{p}{q}$ form."
          }
        ]
      }
    ]
  },
  {
    classLevel: "IX",
    chapterNumber: 2,
    exerciseNumber: "Exercise 2.1",
    title: "Logarithms - Exercise 2.1",
    questions: [
      {
        questionNumber: "Q.1",
        questionText: "Express the following in scientific notation (standard form):",
        parts: [
          {
            partNumber: "i",
            partText: "5700",
            solution: "$$5700 = 5.7 \\times 10^3$$",
            explanation: "Move the decimal point $3$ places to the left."
          },
          {
            partNumber: "ii",
            partText: "0.00000643",
            solution: "$$0.00000643 = 6.43 \\times 10^{-6}$$",
            explanation: "Move the decimal point $6$ places to the right."
          }
        ]
      },
      {
        questionNumber: "Q.2",
        questionText: "Convert from exponential form to logarithmic form ($a^x = y \\iff \\log_a y = x$):",
        parts: [
          {
            partNumber: "i",
            partText: "2^5 = 32",
            solution: "$$\\log_2 32 = 5$$",
            explanation: "The base is $2$, argument is $32$, and exponent is $5$."
          },
          {
            partNumber: "ii",
            partText: "10^3 = 1000",
            solution: "$$\\log_{10} 1000 = 3$$",
            explanation: "Common logarithm with base $10$."
          }
        ]
      }
    ]
  }
];

function generateMarkdownFromSections(title: string, questions: ExerciseQuestion[]): string {
  let md = `# ${title}\n\n`;
  for (const q of questions) {
    md += `## ${q.questionNumber}: ${q.questionText}\n\n`;
    for (const p of q.parts) {
      md += `### (${p.partNumber}) ${p.partText}\n`;
      md += `**Solution:**\n${p.solution}\n\n`;
      if (p.explanation) {
        md += `*Note:* ${p.explanation}\n\n`;
      }
      md += `---\n\n`;
    }
  }
  return md;
}

async function seedTextNotes() {
  console.log("🚀 Seeding digitized clean LaTeX mathematical text into solved_exercises...");

  for (const item of SEED_DATA) {
    const md = generateMarkdownFromSections(item.title, item.questions);

    const res = await db.query(
      `UPDATE solved_exercises
       SET 
         content_markdown = $1,
         sections = $2,
         source_credit = 'Sindh Textbook Board (Standard Curriculum)'
       WHERE class = $3 AND chapter_number = $4 AND exercise_number = $5`,
      [
        md,
        JSON.stringify(item.questions),
        item.classLevel,
        item.chapterNumber,
        item.exerciseNumber
      ]
    );

    if (res.rowCount && res.rowCount > 0) {
      console.log(`✅ Updated Class ${item.classLevel} Unit ${item.chapterNumber} -> ${item.exerciseNumber} with ${item.questions.length} questions.`);
    } else {
      console.log(`⚠️ Exercise not found in DB: Class ${item.classLevel} Unit ${item.chapterNumber} ${item.exerciseNumber}`);
    }
  }

  console.log("🎉 Seeding finished successfully!");
}

seedTextNotes().then(() => process.exit(0));
