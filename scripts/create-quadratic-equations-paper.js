const { Pool } = require("pg");
const { randomUUID } = require("crypto");
require("dotenv").config({ path: "/Users/muhammadtahatalib/Projects/ExBoardAI/.env" });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

const CLASSROOM_ID = "f69fd798-8a66-44a5-8634-3abcd82c04f0__Mathematics__X__private";
const TEACHER_ID = "f69fd798-8a66-44a5-8634-3abcd82c04f0";
const CHAPTER_ID = "4778209c-b63e-4119-aa02-5725b17b057c";

const questions = [
  // 1- Make Standard Form of Quadratic Equation (Q1, Q2)
  {
    id: randomUUID(),
    questionNumber: 1,
    questionPart: "CRQ",
    questionType: "CRQ",
    marks: 3,
    chapterName: "Quadratic Equations",
    chapterId: CHAPTER_ID,
    imageUrl: null,
    questionText: "Write the following equation in the standard form of a quadratic equation ax² + bx + c = 0:\n\n2x(x + 1) = 4(2x + 3)",
    correctAnswer: "2x² - 6x - 12 = 0 (or x² - 3x - 6 = 0)",
    paperIIData: {
      betterResponse:
        "Step 1: Expand both sides of the equation:\n2x(x + 1) = 2x² + 2x\n4(2x + 3) = 8x + 12\n\nStep 2: Equate both sides:\n2x² + 2x = 8x + 12\n\nStep 3: Transpose all terms to the left-hand side to make the right-hand side zero:\n2x² + 2x - 8x - 12 = 0\n2x² - 6x - 12 = 0\n\nOptionally dividing throughout by 2:\nx² - 3x - 6 = 0\n\nThis is in standard form ax² + bx + c = 0 where a = 2, b = -6, c = -12 (or a = 1, b = -3, c = -6).",
      weakerResponse:
        "Student expands correctly to 2x² + 2x = 8x + 12 but makes a sign error when transposing terms (e.g. 2x² + 10x - 12 = 0) or leaves 2x² - 6x = 12 without equating to zero.",
      markingNotes:
        "• 1 mark for correct expansion of brackets on both sides (2x² + 2x and 8x + 12).\n• 1 mark for collecting like terms on one side (2x² + 2x - 8x - 12 = 0).\n• 1 mark for final standard form 2x² - 6x - 12 = 0 or x² - 3x - 6 = 0."
    }
  },
  {
    id: randomUUID(),
    questionNumber: 2,
    questionPart: "CRQ",
    questionType: "CRQ",
    marks: 3,
    chapterName: "Quadratic Equations",
    chapterId: CHAPTER_ID,
    imageUrl: null,
    questionText: "Express the following fractional equation in the standard quadratic form ax² + bx + c = 0:\n\n(6x + 6) / (20 - x) = 1/x",
    correctAnswer: "6x² + 7x - 20 = 0",
    paperIIData: {
      betterResponse:
        "Step 1: Cross-multiply the fractions:\nx(6x + 6) = 1(20 - x)\n\nStep 2: Expand both sides:\n6x² + 6x = 20 - x\n\nStep 3: Transpose all terms to the left-hand side:\n6x² + 6x + x - 20 = 0\n\nStep 4: Combine like terms:\n6x² + 7x - 20 = 0\n\nThis is in standard form ax² + bx + c = 0 where a = 6, b = 7, c = -20.",
      weakerResponse:
        "Student cross-multiplies correctly but forgets to distribute x to both terms (6x² + 6 instead of 6x² + 6x) or makes sign errors when moving terms across the equals sign.",
      markingNotes:
        "• 1 mark for cross-multiplication: x(6x + 6) = 20 - x.\n• 1 mark for expanding and collecting like terms: 6x² + 6x + x - 20 = 0.\n• 1 mark for the final simplified standard form: 6x² + 7x - 20 = 0."
    }
  },

  // 2- Solve by Factorization (Q3, Q4)
  {
    id: randomUUID(),
    questionNumber: 3,
    questionPart: "CRQ",
    questionType: "CRQ",
    marks: 4,
    chapterName: "Quadratic Equations",
    chapterId: CHAPTER_ID,
    imageUrl: null,
    questionText: "Solve the following quadratic equation by factorisation method:\n\nx² + 3x - 28 = 0",
    correctAnswer: "Solution Set = {-7, 4}",
    paperIIData: {
      betterResponse:
        "Step 1: Find two numbers whose product is -28 and sum is +3. The numbers are +7 and -4.\n\nStep 2: Split the middle term:\nx² + 7x - 4x - 28 = 0\n\nStep 3: Factor by grouping:\nx(x + 7) - 4(x + 7) = 0\n(x + 7)(x - 4) = 0\n\nStep 4: Apply zero product property:\nEither x + 7 = 0 ⟹ x = -7\nOr x - 4 = 0 ⟹ x = 4\n\nSolution Set = {-7, 4}",
      weakerResponse:
        "Student identifies factors with reversed signs like (x - 7)(x + 4) = 0, giving incorrect roots x = 7, -4.",
      markingNotes:
        "• 1 mark for correctly splitting the middle term (+7x - 4x).\n• 1 mark for factoring by grouping to obtain (x + 7)(x - 4) = 0.\n• 1 mark for solving each linear factor (x = -7, x = 4).\n• 1 mark for stating the final solution set {-7, 4}."
    }
  },
  {
    id: randomUUID(),
    questionNumber: 4,
    questionPart: "CRQ",
    questionType: "CRQ",
    marks: 4,
    chapterName: "Quadratic Equations",
    chapterId: CHAPTER_ID,
    imageUrl: null,
    questionText: "Solve the following quadratic equation by factorisation method:\n\n6x² + 13x - 5 = 0",
    correctAnswer: "Solution Set = {-5/2, 1/3}",
    paperIIData: {
      betterResponse:
        "Step 1: The product of a and c is 6 × (-5) = -30. The middle coefficient is +13.\nTwo factors of -30 that add up to +13 are +15 and -2.\n\nStep 2: Split the middle term:\n6x² + 15x - 2x - 5 = 0\n\nStep 3: Factor by grouping:\n3x(2x + 5) - 1(2x + 5) = 0\n(2x + 5)(3x - 1) = 0\n\nStep 4: Set each linear factor to zero:\nEither 2x + 5 = 0 ⟹ 2x = -5 ⟹ x = -5/2\nOr 3x - 1 = 0 ⟹ 3x = 1 ⟹ x = 1/3\n\nSolution Set = {-5/2, 1/3}",
      weakerResponse:
        "Student splits term incorrectly (e.g. +10x + 3x giving wrong product) or groups incorrectly without common factor.",
      markingNotes:
        "• 1 mark for correct split of middle term (15x - 2x).\n• 1 mark for correct factorization (2x + 5)(3x - 1) = 0.\n• 1 mark for isolating x from both linear factors (x = -5/2, x = 1/3).\n• 1 mark for correct final solution set."
    }
  },

  // 3- Solve by Completing Square Method (Q5, Q6, Q7)
  {
    id: randomUUID(),
    questionNumber: 5,
    questionPart: "CRQ",
    questionType: "CRQ",
    marks: 4,
    chapterName: "Quadratic Equations",
    chapterId: CHAPTER_ID,
    imageUrl: null,
    questionText: "Solve the following quadratic equation by completing the square method:\n\n2x² + 5x + 2 = 0",
    correctAnswer: "Solution Set = {-2, -1/2}",
    paperIIData: {
      betterResponse:
        "Step 1: Move the constant term to the right-hand side:\n2x² + 5x = -2\n\nStep 2: Divide both sides by the coefficient of x², which is 2:\nx² + (5/2)x = -1\n\nStep 3: Add the square of half the coefficient of x, i.e., [1/2 × (5/2)]² = (5/4)² = 25/16, to both sides:\nx² + 2(x)(5/4) + (5/4)² = -1 + 25/16\n(x + 5/4)² = (-16 + 25) / 16 = 9/16\n\nStep 4: Take the square root of both sides:\nx + 5/4 = ± √(9/16) = ± 3/4\n\nStep 5: Solve for x:\nx = -5/4 ± 3/4\nEither x = (-5 + 3) / 4 = -2/4 = -1/2\nOr x = (-5 - 3) / 4 = -8/4 = -2\n\nSolution Set = {-2, -1/2}",
      weakerResponse:
        "Student forgets to divide the constant term -2 by 2, or adds (5/2)² instead of (5/4)², failing to form a valid square.",
      markingNotes:
        "• 1 mark for dividing throughout by 2 and moving constant term: x² + (5/2)x = -1.\n• 1 mark for adding (5/4)² = 25/16 to both sides and writing (x + 5/4)² = 9/16.\n• 1 mark for taking square root with ± 3/4.\n• 1 mark for correct final roots and solution set {-2, -1/2}."
    }
  },
  {
    id: randomUUID(),
    questionNumber: 6,
    questionPart: "CRQ",
    questionType: "CRQ",
    marks: 4,
    chapterName: "Quadratic Equations",
    chapterId: CHAPTER_ID,
    imageUrl: null,
    questionText: "Solve the quadratic equation by completing the square method:\n\nx² - 6x - 7 = 0",
    correctAnswer: "Solution Set = {-1, 7}",
    paperIIData: {
      betterResponse:
        "Step 1: Shift the constant term to the right side:\nx² - 6x = 7\n\nStep 2: Half the coefficient of x is -6/2 = -3. Its square is (-3)² = 9. Add 9 to both sides:\nx² - 6x + 9 = 7 + 9\n\nStep 3: Write the left side as a perfect square:\n(x - 3)² = 16\n\nStep 4: Take the square root on both sides:\nx - 3 = ± √16 = ± 4\n\nStep 5: Solve for x:\nEither x = 3 + 4 = 7\nOr x = 3 - 4 = -1\n\nSolution Set = {-1, 7}",
      weakerResponse:
        "Student adds 6 instead of 9 to the right-hand side, or writes (x + 3)² = 16 ignoring the negative middle sign.",
      markingNotes:
        "• 1 mark for isolating variable terms: x² - 6x = 7.\n• 1 mark for adding (6/2)² = 9 to both sides.\n• 1 mark for writing as (x - 3)² = 16 and taking square roots ± 4.\n• 1 mark for finding both roots x = 7, -1 and stating the solution set."
    }
  },
  {
    id: randomUUID(),
    questionNumber: 7,
    questionPart: "CRQ",
    questionType: "CRQ",
    marks: 4,
    chapterName: "Quadratic Equations",
    chapterId: CHAPTER_ID,
    imageUrl: null,
    questionText: "Solve the quadratic equation by completing the square method:\n\n4x² + 12x + 5 = 0",
    correctAnswer: "Solution Set = {-5/2, -1/2}",
    paperIIData: {
      betterResponse:
        "Step 1: Move constant to the right:\n4x² + 12x = -5\n\nStep 2: Divide throughout by 4 to make the coefficient of x² unity:\nx² + 3x = -5/4\n\nStep 3: Half of the coefficient of x is 3/2. Add (3/2)² = 9/4 to both sides:\nx² + 3x + 9/4 = -5/4 + 9/4\n(x + 3/2)² = 4/4 = 1\n\nStep 4: Take square root of both sides:\nx + 3/2 = ± 1\n\nStep 5: Compute roots:\nEither x = -3/2 + 1 = -1/2\nOr x = -3/2 - 1 = -5/2\n\nSolution Set = {-5/2, -1/2}",
      weakerResponse:
        "Student forgets to divide -5 by 4 when dividing the equation, or adds 3² = 9 without taking half first.",
      markingNotes:
        "• 1 mark for dividing throughout by 4: x² + 3x = -5/4.\n• 1 mark for adding (3/2)² = 9/4 to both sides and writing (x + 3/2)² = 1.\n• 1 mark for taking square root: x + 3/2 = ± 1.\n• 1 mark for obtaining roots -1/2, -5/2 and writing the solution set."
    }
  },

  // 4- Solve by Quadratic Formula (Q8, Q9)
  {
    id: randomUUID(),
    questionNumber: 8,
    questionPart: "CRQ",
    questionType: "CRQ",
    marks: 4,
    chapterName: "Quadratic Equations",
    chapterId: CHAPTER_ID,
    imageUrl: null,
    questionText: "Solve the following quadratic equation using the quadratic formula:\n\n2x² - 5x + 3 = 0",
    correctAnswer: "Solution Set = {1, 3/2}",
    paperIIData: {
      betterResponse:
        "Step 1: Compare with standard form ax² + bx + c = 0:\na = 2,  b = -5,  c = 3\n\nStep 2: State the quadratic formula:\nx = [-b ± √(b² - 4ac)] / (2a)\n\nStep 3: Substitute the values:\nx = [-(-5) ± √((-5)² - 4(2)(3))] / (2 × 2)\nx = [5 ± √(25 - 24)] / 4\nx = [5 ± √1] / 4 = (5 ± 1) / 4\n\nStep 4: Evaluate both cases:\nEither x = (5 + 1) / 4 = 6/4 = 3/2\nOr x = (5 - 1) / 4 = 4/4 = 1\n\nSolution Set = {3/2, 1}",
      weakerResponse:
        "Student writes -(-5) as -5, or calculates (-5)² as -25, leading to a negative discriminant.",
      markingNotes:
        "• 1 mark for correctly identifying a = 2, b = -5, c = 3 and stating the formula.\n• 1 mark for correct substitution into the discriminant: (-5)² - 4(2)(3) = 25 - 24 = 1.\n• 1 mark for simplifying to (5 ± 1) / 4.\n• 1 mark for calculating final roots x = 3/2, 1 and stating the solution set."
    }
  },
  {
    id: randomUUID(),
    questionNumber: 9,
    questionPart: "CRQ",
    questionType: "CRQ",
    marks: 4,
    chapterName: "Quadratic Equations",
    chapterId: CHAPTER_ID,
    imageUrl: null,
    questionText: "Solve the quadratic equation using the quadratic formula:\n\n3x² - 7x - 6 = 0",
    correctAnswer: "Solution Set = {-2/3, 3}",
    paperIIData: {
      betterResponse:
        "Step 1: Identify coefficients from ax² + bx + c = 0:\na = 3,  b = -7,  c = -6\n\nStep 2: State the quadratic formula:\nx = [-b ± √(b² - 4ac)] / (2a)\n\nStep 3: Substitute values into formula:\nx = [-(-7) ± √((-7)² - 4(3)(-6))] / (2 × 3)\nx = [7 ± √(49 + 72)] / 6\nx = [7 ± √121] / 6\nSince √121 = 11:\nx = (7 ± 11) / 6\n\nStep 4: Calculate both roots:\nEither x = (7 + 11) / 6 = 18/6 = 3\nOr x = (7 - 11) / 6 = -4/6 = -2/3\n\nSolution Set = {-2/3, 3}",
      weakerResponse:
        "Student miscalculates -4(3)(-6) as -72 instead of +72, yielding √(49 - 72) = √(-23).",
      markingNotes:
        "• 1 mark for identifying a = 3, b = -7, c = -6 and writing the quadratic formula.\n• 1 mark for evaluating discriminant D = (-7)² - 4(3)(-6) = 49 + 72 = 121.\n• 1 mark for evaluating √121 = 11 and writing x = (7 ± 11) / 6.\n• 1 mark for both correct roots x = 3, -2/3 and stating solution set."
    }
  },

  // 5- Find Nature of Roots (4 Questions covering each case: Q10, Q11, Q12, Q13)
  {
    id: randomUUID(),
    questionNumber: 10,
    questionPart: "CRQ",
    questionType: "CRQ",
    marks: 3,
    chapterName: "Quadratic Equations",
    chapterId: CHAPTER_ID,
    imageUrl: null,
    questionText: "Without solving, examine the nature of the roots of the quadratic equation:\n\n2x² - 7x + 3 = 0",
    correctAnswer: "Roots are rational (real) and unequal (D = 25 > 0, perfect square)",
    paperIIData: {
      betterResponse:
        "Step 1: Identify coefficients:\na = 2,  b = -7,  c = 3\n\nStep 2: Calculate Discriminant D = b² - 4ac:\nD = (-7)² - 4(2)(3)\nD = 49 - 24 = 25\n\nStep 3: Analyze nature of roots:\nSince D = 25 > 0 and 25 is a perfect square (25 = 5²):\nConclusion: The roots are real, rational, and unequal.",
      weakerResponse:
        "Student calculates D = 25 but fails to identify that 25 is a perfect square, concluding only that roots are real and unequal without mentioning rational.",
      markingNotes:
        "• 1 mark for stating the discriminant formula D = b² - 4ac and identifying a, b, c.\n• 1 mark for correctly calculating D = 25.\n• 1 mark for stating the correct conclusion: roots are rational (real) and unequal."
    }
  },
  {
    id: randomUUID(),
    questionNumber: 11,
    questionPart: "CRQ",
    questionType: "CRQ",
    marks: 3,
    chapterName: "Quadratic Equations",
    chapterId: CHAPTER_ID,
    imageUrl: null,
    questionText: "Without solving, determine the nature of the roots of the quadratic equation:\n\n3x² - 9x - 2 = 0",
    correctAnswer: "Roots are irrational (real) and unequal (D = 105 > 0, not a perfect square)",
    paperIIData: {
      betterResponse:
        "Step 1: Identify coefficients:\na = 3,  b = -9,  c = -2\n\nStep 2: Calculate Discriminant D = b² - 4ac:\nD = (-9)² - 4(3)(-2)\nD = 81 + 24 = 105\n\nStep 3: Determine nature of roots:\nSince D = 105 > 0 and 105 is not a perfect square:\nConclusion: The roots are real, irrational, and unequal.",
      weakerResponse:
        "Student calculates D = 81 - 24 = 57 due to sign error with c = -2, or incorrectly claims roots are rational.",
      markingNotes:
        "• 1 mark for identifying a = 3, b = -9, c = -2 and writing D = b² - 4ac.\n• 1 mark for correctly computing D = 81 + 24 = 105.\n• 1 mark for the correct conclusion: roots are irrational (real) and unequal."
    }
  },
  {
    id: randomUUID(),
    questionNumber: 12,
    questionPart: "CRQ",
    questionType: "CRQ",
    marks: 3,
    chapterName: "Quadratic Equations",
    chapterId: CHAPTER_ID,
    imageUrl: null,
    questionText: "Without solving the equation, examine the nature of the roots of:\n\n2x² - 3x + 4 = 0",
    correctAnswer: "Roots are imaginary (complex) and unequal (D = -23 < 0)",
    paperIIData: {
      betterResponse:
        "Step 1: Identify coefficients:\na = 2,  b = -3,  c = 4\n\nStep 2: Calculate Discriminant D = b² - 4ac:\nD = (-3)² - 4(2)(4)\nD = 9 - 32 = -23\n\nStep 3: Determine nature of roots:\nSince D = -23 < 0 (negative):\nConclusion: The roots are imaginary (complex conjugates / not real) and unequal.",
      weakerResponse:
        "Student writes D = 9 + 32 = 41 failing to subtract 4ac, or erroneously states roots are real.",
      markingNotes:
        "• 1 mark for identifying a = 2, b = -3, c = 4 and using D = b² - 4ac.\n• 1 mark for correctly evaluating D = 9 - 32 = -23.\n• 1 mark for stating the conclusion: roots are imaginary (complex) and unequal."
    }
  },
  {
    id: randomUUID(),
    questionNumber: 13,
    questionPart: "CRQ",
    questionType: "CRQ",
    marks: 3,
    chapterName: "Quadratic Equations",
    chapterId: CHAPTER_ID,
    imageUrl: null,
    questionText: "Examine the nature of the roots of the quadratic equation without solving it:\n\nx² + 6x + 9 = 0",
    correctAnswer: "Roots are real, rational, and equal (repeated) (D = 0)",
    paperIIData: {
      betterResponse:
        "Step 1: Identify coefficients:\na = 1,  b = 6,  c = 9\n\nStep 2: Calculate Discriminant D = b² - 4ac:\nD = (6)² - 4(1)(9)\nD = 36 - 36 = 0\n\nStep 3: Determine nature of roots:\nSince D = 0:\nConclusion: The roots are real, rational, and equal (repeated / coincident).",
      weakerResponse:
        "Student evaluates D = 0 correctly but states roots are unequal or does not state the conclusion clearly.",
      markingNotes:
        "• 1 mark for identifying a = 1, b = 6, c = 9 and stating D = b² - 4ac.\n• 1 mark for calculating D = 36 - 36 = 0.\n• 1 mark for concluding that roots are real and equal."
    }
  },

  // 6- Simultaneous Equation (Q14, Q15)
  {
    id: randomUUID(),
    questionNumber: 14,
    questionPart: "ERQ",
    questionType: "ERQ",
    marks: 5,
    chapterName: "Quadratic Equations",
    chapterId: CHAPTER_ID,
    imageUrl: null,
    questionText: "Solve the following simultaneous equations consisting of one linear equation and one quadratic equation:\n\nx - y = 1    --- (1)\nx² + y² = 25    --- (2)",
    correctAnswer: "Solution Set = {(4, 3), (-3, -4)}",
    paperIIData: {
      betterResponse:
        "Step 1: From linear equation (1), express x in terms of y:\nx = y + 1    --- (3)\n\nStep 2: Substitute equation (3) into quadratic equation (2):\n(y + 1)² + y² = 25\ny² + 2y + 1 + y² = 25\n2y² + 2y + 1 - 25 = 0\n2y² + 2y - 24 = 0\n\nStep 3: Divide by 2 to simplify:\ny² + y - 12 = 0\n\nStep 4: Factor the quadratic equation in y:\ny² + 4y - 3y - 12 = 0\ny(y + 4) - 3(y + 4) = 0\n(y + 4)(y - 3) = 0\nEither y = 3 or y = -4\n\nStep 5: Find corresponding values of x using x = y + 1:\n• When y = 3: x = 3 + 1 = 4 ⟹ (4, 3)\n• When y = -4: x = -4 + 1 = -3 ⟹ (-3, -4)\n\nSolution Set = {(4, 3), (-3, -4)}",
      weakerResponse:
        "Student substitutes correctly to get 2y² + 2y - 24 = 0 and finds y = 3, -4, but forgets to find the corresponding x values, or pairs x and y incorrectly.",
      markingNotes:
        "• 1 mark for expressing x = y + 1 from the linear equation.\n• 1 mark for substituting into quadratic equation: (y + 1)² + y² = 25.\n• 1 mark for simplifying to standard form y² + y - 12 = 0.\n• 1 mark for solving y = 3, y = -4.\n• 1 mark for finding corresponding x = 4, -3 and stating the solution set as ordered pairs {(4, 3), (-3, -4)}."
    }
  },
  {
    id: randomUUID(),
    questionNumber: 15,
    questionPart: "ERQ",
    questionType: "ERQ",
    marks: 5,
    chapterName: "Quadratic Equations",
    chapterId: CHAPTER_ID,
    imageUrl: null,
    questionText: "Solve the following system of simultaneous quadratic equations where both equations are quadratic:\n\nx² + y² = 25    --- (1)\nx² - y² = 7    --- (2)",
    correctAnswer: "Solution Set = {(4, 3), (4, -3), (-4, 3), (-4, -3)}",
    paperIIData: {
      betterResponse:
        "Step 1: Add equation (1) and equation (2) to eliminate y²:\n(x² + y²) + (x² - y²) = 25 + 7\n2x² = 32\nx² = 16\nx = ± √16 = ± 4\n\nStep 2: Subtract equation (2) from equation (1) to eliminate x²:\n(x² + y²) - (x² - y²) = 25 - 7\n2y² = 18\ny² = 9\ny = ± √9 = ± 3\n\nStep 3: Form all possible combinations of (x, y):\nSince x² = 16 and y² = 9, any combination of x = ± 4 and y = ± 3 satisfies both equations:\n(4, 3),  (4, -3),  (-4, 3),  (-4, -3)\n\nSolution Set = {(4, 3), (4, -3), (-4, 3), (-4, -3)}",
      weakerResponse:
        "Student finds x² = 16 and y² = 9 but writes only positive roots (4, 3), missing negative roots (-4, -3), (4, -3), (-4, 3).",
      markingNotes:
        "• 1 mark for adding the equations to eliminate y²: 2x² = 32.\n• 1 mark for solving x² = 16 ⟹ x = ± 4.\n• 1 mark for eliminating x² to get 2y² = 18 ⟹ y² = 9.\n• 1 mark for solving y = ± 3.\n• 1 mark for writing all four ordered pairs in the solution set: {(4, 3), (4, -3), (-4, 3), (-4, -3)}."
    }
  }
];

async function run() {
  const client = await pool.connect();
  try {
    const totalMarks = questions.reduce((sum, q) => sum + q.marks, 0);
    const totalQuestions = questions.length;
    const questionIds = questions.map(q => q.id);
    const title = "Quadratic Equations (Paper 2)";
    const description = "Chapter 15: Quadratic Equations - Standard Form, Factorization, Completing Square Method, Quadratic Formula, Nature of Roots, and Simultaneous Equations.";

    console.log(`Updating paper with clean, formatted ${totalQuestions} questions and ${totalMarks} total marks...`);

    const existing = await client.query(
      `SELECT id FROM teacher_papers WHERE classroom_id = $1 AND title = $2`,
      [CLASSROOM_ID, title]
    );

    let paperId;
    if (existing.rows.length > 0) {
      paperId = existing.rows[0].id;
      console.log(`Updating existing paper ${paperId}...`);
      await client.query(
        `UPDATE teacher_papers
         SET description = $1,
             questions_snapshot = $2,
             question_ids = $3,
             chapter_ids = $4,
             total_marks = $5,
             total_questions = $6,
             paper_type = 'paper2'
         WHERE id = $7`,
        [
          description,
          JSON.stringify(questions),
          JSON.stringify(questionIds),
          JSON.stringify([CHAPTER_ID]),
          totalMarks,
          totalQuestions,
          paperId
        ]
      );
    } else {
      console.log("Inserting new paper...");
      const insertRes = await client.query(
        `INSERT INTO teacher_papers
           (teacher_id, classroom_id, title, description, paper_type, subject, class_level, board,
            chapter_ids, question_ids, questions_snapshot, total_marks, total_questions)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
         RETURNING id, created_at`,
        [
          TEACHER_ID,
          CLASSROOM_ID,
          title,
          description,
          "paper2",
          "Mathematics",
          "X",
          "AKUEB",
          JSON.stringify([CHAPTER_ID]),
          JSON.stringify(questionIds),
          JSON.stringify(questions),
          totalMarks,
          totalQuestions
        ]
      );
      paperId = insertRes.rows[0].id;
    }

    console.log(`Paper successfully updated with clean formatting! ID: ${paperId}`);
  } catch (err) {
    console.error("Error updating paper:", err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

run();
