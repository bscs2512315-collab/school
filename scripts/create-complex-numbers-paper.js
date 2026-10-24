const { Pool } = require("pg");
const { randomUUID } = require("crypto");
require("dotenv").config({ path: "/Users/muhammadtahatalib/Projects/ExBoardAI/.env" });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

const CLASSROOM_ID = "f69fd798-8a66-44a5-8634-3abcd82c04f0__Mathematics__X__private";
const TEACHER_ID = "f69fd798-8a66-44a5-8634-3abcd82c04f0";
const CHAPTER_ID = "b41e3c8b-249f-4458-8b8f-01198ddb0a94";
const CHAPTER_NAME = "Complex Numbers";

function buildQuestionsForSet(setLetter) {
  if (setLetter === "A") {
    return [
      // 1. Reference Image 1: Powers of iota (Q1, Q2)
      {
        id: randomUUID(),
        questionNumber: 1,
        questionPart: "CRQ",
        questionType: "CRQ",
        marks: 3,
        chapterName: CHAPTER_NAME,
        chapterId: CHAPTER_ID,
        imageUrl: null,
        questionText: "Evaluate the following powers of iota (i = √(-1)) and simplify your answers:\n\n(i) i¹⁰³\n(ii) (-i)¹⁹",
        correctAnswer: "(i) -i, (ii) i",
        paperIIData: {
          betterResponse:
            "Part (i): i¹⁰³\nStep 1: Express i¹⁰³ in terms of i² = -1:\ni¹⁰³ = i¹⁰² · i = (i²)⁵¹ · i\nStep 2: Substitute i² = -1:\n(i²)⁵¹ · i = (-1)⁵¹ · i = (-1) · i = -i.\n\nPart (ii): (-i)¹⁹\nStep 1: Distribute exponent:\n(-i)¹⁹ = (-1)¹⁹ · i¹⁹ = -1 · i¹⁹\nStep 2: Express i¹⁹ using i² = -1:\ni¹⁹ = i¹⁸ · i = (i²)⁹ · i = (-1)⁹ · i = (-1) · i = -i\nStep 3: Combine with (-1):\n-1 · (-i) = i.",
          weakerResponse:
            "Student computes power incorrectly (e.g. dividing 103 by 2 and ignoring remainder) or drops the negative sign in part (ii) resulting in -i instead of i.",
          markingNotes:
            "• 1.5 marks for Part (i): 0.5 mark for breaking into (i²)⁵¹ · i, 1 mark for evaluating to -i.\n• 1.5 marks for Part (ii): 0.5 mark for handling (-1)¹⁹, 1 mark for correct final value i."
        }
      },
      {
        id: randomUUID(),
        questionNumber: 2,
        questionPart: "CRQ",
        questionType: "CRQ",
        marks: 3,
        chapterName: CHAPTER_NAME,
        chapterId: CHAPTER_ID,
        imageUrl: null,
        questionText: "Simplify and evaluate the following expression involving consecutive powers of iota:\n\n(i⁴ + i³ + i² + i)²",
        correctAnswer: "0",
        paperIIData: {
          betterResponse:
            "Step 1: Evaluate each individual power of i inside the brackets:\ni⁴ = (i²)² = (-1)² = 1\ni³ = i² · i = (-1) · i = -i\ni² = -1\ni = i\n\nStep 2: Sum the terms inside the parentheses:\ni⁴ + i³ + i² + i = 1 + (-i) + (-1) + i = (1 - 1) + (-i + i) = 0\n\nStep 3: Square the result:\n(0)² = 0.",
          weakerResponse:
            "Student attempts to expand the 4-term bracket using polynomial expansion instead of simplifying the cyclic sum of powers inside first, leading to algebraic errors.",
          markingNotes:
            "• 1.5 marks for simplifying individual powers: i⁴=1, i³=-i, i²=-1, i=i.\n• 1 mark for showing sum inside equals 0.\n• 0.5 mark for final squared answer 0."
        }
      },

      // 2. Equality of Complex Numbers (Q3, Q4)
      {
        id: randomUUID(),
        questionNumber: 3,
        questionPart: "CRQ",
        questionType: "CRQ",
        marks: 4,
        chapterName: CHAPTER_NAME,
        chapterId: CHAPTER_ID,
        imageUrl: null,
        questionText: "Find the real values of x and y that satisfy the equation:\n\n(2x + 5) + (y - 3)i = 1 + 2i",
        correctAnswer: "x = -2, y = 5",
        paperIIData: {
          betterResponse:
            "Step 1: State the condition for equality of complex numbers:\nTwo complex numbers are equal if and only if their real parts are equal and their imaginary parts are equal.\n\nStep 2: Equate real parts:\n2x + 5 = 1\n2x = 1 - 5\n2x = -4\nx = -2\n\nStep 3: Equate imaginary parts:\ny - 3 = 2\ny = 2 + 3\ny = 5\n\nTherefore, x = -2 and y = 5.",
          weakerResponse:
            "Student forgets to equate real and imaginary parts separately, mixing terms with i, or makes sign arithmetic mistakes during transposing (e.g. y = 2 - 3 = -1).",
          markingNotes:
            "• 1 mark for stating/applying equality of real and imaginary parts.\n• 1.5 marks for solving 2x + 5 = 1 to get x = -2.\n• 1.5 marks for solving y - 3 = 2 to get y = 5."
        }
      },
      {
        id: randomUUID(),
        questionNumber: 4,
        questionPart: "CRQ",
        questionType: "CRQ",
        marks: 4,
        chapterName: CHAPTER_NAME,
        chapterId: CHAPTER_ID,
        imageUrl: null,
        questionText: "Find the real values of x and y that satisfy the following complex equation:\n\n(2 + i)x + (1 - 2i)y = 3 + 4i",
        correctAnswer: "x = 2, y = -1",
        paperIIData: {
          betterResponse:
            "Step 1: Expand the left-hand side:\n2x + ix + y - 2iy = 3 + 4i\n\nStep 2: Group real and imaginary terms:\n(2x + y) + (x - 2y)i = 3 + 4i\n\nStep 3: Equate real and imaginary parts to form a system of simultaneous equations:\n(1) 2x + y = 3\n(2) x - 2y = 4\n\nStep 4: Solve the simultaneous equations:\nFrom (1): y = 3 - 2x\nSubstitute y into (2):\nx - 2(3 - 2x) = 4\nx - 6 + 4x = 4\n5x = 10 ⟹ x = 2\n\nStep 5: Substitute x = 2 into y = 3 - 2x:\ny = 3 - 2(2) = 3 - 4 = -1\n\nTherefore, x = 2 and y = -1.",
          weakerResponse:
            "Student fails to group real and imaginary parts correctly, or makes elimination mistakes when solving the simultaneous system.",
          markingNotes:
            "• 1 mark for correct expansion and grouping: (2x + y) + (x - 2y)i.\n• 1 mark for setting up equations: 2x + y = 3 and x - 2y = 4.\n• 1 mark for correct value x = 2.\n• 1 mark for correct value y = -1."
        }
      },

      // 3. Addition of Complex Numbers (Q5, Q6)
      {
        id: randomUUID(),
        questionNumber: 5,
        questionPart: "CRQ",
        questionType: "CRQ",
        marks: 3,
        chapterName: CHAPTER_NAME,
        chapterId: CHAPTER_ID,
        imageUrl: null,
        questionText: "Add the following complex numbers and write your answer in the standard form a + ib:\n\n(16 - 3i) + (9 + 2i)",
        correctAnswer: "25 - i",
        paperIIData: {
          betterResponse:
            "Step 1: Group real parts together and imaginary parts together:\n(16 - 3i) + (9 + 2i) = (16 + 9) + (-3 + 2)i\n\nStep 2: Simplify each component:\n16 + 9 = 25\n-3 + 2 = -1\n\nStep 3: Write in standard form a + ib:\n25 - i (where a = 25, b = -1).",
          weakerResponse:
            "Student adds real part to imaginary part or makes sign error with -3 + 2 resulting in 25 + 5i.",
          markingNotes:
            "• 1 mark for grouping real parts (16 + 9) and imaginary parts (-3 + 2)i.\n• 1 mark for calculating real part 25.\n• 1 mark for calculating imaginary part -i."
        }
      },
      {
        id: randomUUID(),
        questionNumber: 6,
        questionPart: "CRQ",
        questionType: "CRQ",
        marks: 4,
        chapterName: CHAPTER_NAME,
        chapterId: CHAPTER_ID,
        imageUrl: null,
        questionText: "Given z₁ = 3 + 4i and z₂ = 2 - 5i, compute the linear combination 2z₁ + 3z₂ in standard form a + ib.",
        correctAnswer: "12 - 7i",
        paperIIData: {
          betterResponse:
            "Step 1: Multiply each complex number by its scalar:\n2z₁ = 2(3 + 4i) = 6 + 8i\n3z₂ = 3(2 - 5i) = 6 - 15i\n\nStep 2: Add the two resulting complex numbers:\n2z₁ + 3z₂ = (6 + 8i) + (6 - 15i)\n\nStep 3: Combine real and imaginary parts:\n(6 + 6) + (8 - 15)i = 12 - 7i.",
          weakerResponse:
            "Student forgets to distribute scalar multiplication across both real and imaginary terms (e.g. 6 + 4i instead of 6 + 8i).",
          markingNotes:
            "• 1 mark for scalar multiplication 2z₁ = 6 + 8i.\n• 1 mark for scalar multiplication 3z₂ = 6 - 15i.\n• 1 mark for grouping like terms (6 + 6) and (8 - 15)i.\n• 1 mark for final answer 12 - 7i."
        }
      },

      // 4. Subtraction of Complex Numbers (Q7, Q8)
      {
        id: randomUUID(),
        questionNumber: 7,
        questionPart: "CRQ",
        questionType: "CRQ",
        marks: 3,
        chapterName: CHAPTER_NAME,
        chapterId: CHAPTER_ID,
        imageUrl: null,
        questionText: "Subtract the following complex numbers and write the result in standard form a + ib:\n\n(11 + 9i) - (9 - 7i)",
        correctAnswer: "2 + 16i",
        paperIIData: {
          betterResponse:
            "Step 1: Distribute the negative sign across the second bracket:\n(11 + 9i) - (9 - 7i) = 11 + 9i - 9 + 7i\n\nStep 2: Group real parts and imaginary parts:\n(11 - 9) + (9 + 7)i\n\nStep 3: Simplify:\n2 + 16i.",
          weakerResponse:
            "Student fails to distribute the negative sign to the imaginary part, writing 9i - 7i = 2i instead of 9i + 7i = 16i.",
          markingNotes:
            "• 1 mark for correct signs after expansion: 11 - 9 + 9i + 7i.\n• 1 mark for real part 2.\n• 1 mark for imaginary part 16i."
        }
      },
      {
        id: randomUUID(),
        questionNumber: 8,
        questionPart: "CRQ",
        questionType: "CRQ",
        marks: 4,
        chapterName: CHAPTER_NAME,
        chapterId: CHAPTER_ID,
        imageUrl: null,
        questionText: "Given z₁ = 8 + 3i and z₂ = 3 - 2i, find the value of z₁ - 2z₂ in standard form a + ib.",
        correctAnswer: "2 + 7i",
        paperIIData: {
          betterResponse:
            "Step 1: Compute 2z₂:\n2z₂ = 2(3 - 2i) = 6 - 4i\n\nStep 2: Set up subtraction z₁ - 2z₂:\nz₁ - 2z₂ = (8 + 3i) - (6 - 4i)\n\nStep 3: Distribute negative sign:\n= 8 + 3i - 6 + 4i\n\nStep 4: Group like terms:\n= (8 - 6) + (3 + 4)i\n= 2 + 7i.",
          weakerResponse:
            "Student calculates 2z₂ correctly as 6 - 4i but forgets to flip the sign when subtracting -4i, writing 3i - 4i = -i instead of +7i.",
          markingNotes:
            "• 1 mark for scalar calculation 2z₂ = 6 - 4i.\n• 1 mark for distributing negative sign: (8 + 3i) - 6 + 4i.\n• 1 mark for real part 2.\n• 1 mark for imaginary part 7i."
        }
      },

      // 5. Division of Complex Numbers (Q9, Q10)
      {
        id: randomUUID(),
        questionNumber: 9,
        questionPart: "CRQ",
        questionType: "CRQ",
        marks: 4,
        chapterName: CHAPTER_NAME,
        chapterId: CHAPTER_ID,
        imageUrl: null,
        questionText: "Divide the complex numbers and express in standard form a + ib:\n\n(2 + 3i) / (1 - 2i)",
        correctAnswer: "-4/5 + (7/5)i",
        paperIIData: {
          betterResponse:
            "Step 1: Identify the conjugate of the denominator:\nConjugate of 1 - 2i is 1 + 2i.\n\nStep 2: Multiply numerator and denominator by 1 + 2i:\n(2 + 3i)(1 + 2i) / [(1 - 2i)(1 + 2i)]\n\nStep 3: Expand numerator:\n(2 + 3i)(1 + 2i) = 2(1) + 2(2i) + 3i(1) + 3i(2i)\n= 2 + 4i + 3i + 6i²\n= 2 + 7i + 6(-1)\n= -4 + 7i\n\nStep 4: Expand denominator using (a - b)(a + b) = a² - b²:\n1² - (2i)² = 1 - 4i² = 1 - 4(-1) = 1 + 4 = 5\n\nStep 5: Separate into real and imaginary parts:\n(-4 + 7i) / 5 = -4/5 + (7/5)i.",
          weakerResponse:
            "Student does not multiply by conjugate, or computes denominator as 1² - 2² = -3 instead of 1 - 4(-1) = 5.",
          markingNotes:
            "• 1 mark for multiplying top and bottom by conjugate 1 + 2i.\n• 1 mark for correct expansion of numerator to -4 + 7i.\n• 1 mark for correct evaluation of denominator to 5.\n• 1 mark for final separated standard form -4/5 + (7/5)i."
        }
      },
      {
        id: randomUUID(),
        questionNumber: 10,
        questionPart: "CRQ",
        questionType: "CRQ",
        marks: 4,
        chapterName: CHAPTER_NAME,
        chapterId: CHAPTER_ID,
        imageUrl: null,
        questionText: "Simplify and express the following quotient in standard complex form a + ib:\n\n(4 + 5i) / (3 - 2i)",
        correctAnswer: "2/13 + (23/13)i",
        paperIIData: {
          betterResponse:
            "Step 1: Multiply numerator and denominator by the conjugate of the denominator (3 + 2i):\n[(4 + 5i)(3 + 2i)] / [(3 - 2i)(3 + 2i)]\n\nStep 2: Expand the numerator:\n(4)(3) + (4)(2i) + (5i)(3) + (5i)(2i)\n= 12 + 8i + 15i + 10i²\n= 12 + 23i + 10(-1)\n= 2 + 23i\n\nStep 3: Calculate the denominator:\n3² - (2i)² = 9 - 4i² = 9 - 4(-1) = 9 + 4 = 13\n\nStep 4: Express in standard form a + ib:\n(2 + 23i) / 13 = 2/13 + (23/13)i.",
          weakerResponse:
            "Student expands numerator correctly but makes an arithmetic error with 10i² (adding 10 instead of subtracting 10) or forgets to separate real and imaginary parts.",
          markingNotes:
            "• 1 mark for multiplying by conjugate (3 + 2i).\n• 1 mark for numerator expansion to 2 + 23i.\n• 1 mark for denominator calculation to 13.\n• 1 mark for final answer 2/13 + (23/13)i."
        }
      },

      // 6. Properties of Complex Numbers (Q11, Q12, Q13)
      {
        id: randomUUID(),
        questionNumber: 11,
        questionPart: "CRQ",
        questionType: "CRQ",
        marks: 4,
        chapterName: CHAPTER_NAME,
        chapterId: CHAPTER_ID,
        imageUrl: null,
        questionText: "If z₁ = 1 - 2i and z₂ = 2 + i, verify the property that the conjugate of a product equals the product of the conjugates:\n\nconj(z₁ · z₂) = conj(z₁) · conj(z₂)",
        correctAnswer: "Verified: LHS = RHS = 4 + 3i",
        paperIIData: {
          betterResponse:
            "Step 1: Calculate Left-Hand Side conj(z₁ · z₂):\nCompute z₁ · z₂:\nz₁ · z₂ = (1 - 2i)(2 + i)\n= 1(2) + 1(i) - 2i(2) - 2i(i)\n= 2 + i - 4i - 2i²\n= 2 - 3i - 2(-1)\n= 4 - 3i\nNow take the conjugate:\nconj(z₁ · z₂) = conj(4 - 3i) = 4 + 3i  --- (Equation 1)\n\nStep 2: Calculate Right-Hand Side conj(z₁) · conj(z₂):\nconj(z₁) = conj(1 - 2i) = 1 + 2i\nconj(z₂) = conj(2 + i) = 2 - i\nMultiply them:\nconj(z₁) · conj(z₂) = (1 + 2i)(2 - i)\n= 1(2) - 1(i) + 2i(2) - 2i(i)\n= 2 - i + 4i - 2i²\n= 2 + 3i - 2(-1)\n= 4 + 3i  --- (Equation 2)\n\nStep 3: Conclusion:\nFrom (1) and (2), LHS = RHS = 4 + 3i. Hence, conj(z₁ · z₂) = conj(z₁) · conj(z₂) is verified.",
          weakerResponse:
            "Student conjugates the numbers before multiplying in LHS or miscalculates -2i² = -2 instead of +2.",
          markingNotes:
            "• 1 mark for multiplying z₁ · z₂ = 4 - 3i.\n• 1 mark for finding LHS conj(z₁ · z₂) = 4 + 3i.\n• 1 mark for finding individual conjugates and multiplying to get 4 + 3i.\n• 1 mark for explicit comparison demonstrating LHS = RHS."
        }
      },
      {
        id: randomUUID(),
        questionNumber: 12,
        questionPart: "CRQ",
        questionType: "CRQ",
        marks: 5,
        chapterName: CHAPTER_NAME,
        chapterId: CHAPTER_ID,
        imageUrl: null,
        questionText: "If z₁ = 2 + 3i and z₂ = 1 - i, verify the property that the conjugate of a quotient equals the quotient of the conjugates:\n\nconj(z₁ / z₂) = conj(z₁) / conj(z₂)",
        correctAnswer: "Verified: LHS = RHS = -1/2 - (5/2)i",
        paperIIData: {
          betterResponse:
            "Step 1: Evaluate Left-Hand Side conj(z₁ / z₂):\nCompute z₁ / z₂:\nz₁ / z₂ = (2 + 3i) / (1 - i)\nMultiply by conjugate of denominator (1 + i):\n= [(2 + 3i)(1 + i)] / [(1 - i)(1 + i)]\n= [2 + 2i + 3i + 3i²] / [1 - i²]\n= [2 + 5i - 3] / [1 - (-1)]\n= (-1 + 5i) / 2 = -1/2 + (5/2)i\nTaking the conjugate:\nconj(z₁ / z₂) = -1/2 - (5/2)i  --- (Equation 1)\n\nStep 2: Evaluate Right-Hand Side conj(z₁) / conj(z₂):\nconj(z₁) = 2 - 3i\nconj(z₂) = 1 + i\nCompute quotient:\nconj(z₁) / conj(z₂) = (2 - 3i) / (1 + i)\nMultiply by conjugate of denominator (1 - i):\n= [(2 - 3i)(1 - i)] / [(1 + i)(1 - i)]\n= [2 - 2i - 3i + 3i²] / [1 - i²]\n= [2 - 5i - 3] / 2\n= (-1 - 5i) / 2 = -1/2 - (5/2)i  --- (Equation 2)\n\nStep 3: Conclusion:\nSince Equation (1) = Equation (2) = -1/2 - (5/2)i, the property is verified.",
          weakerResponse:
            "Student makes algebraic errors during fraction division or fails to show both sides evaluated independently.",
          markingNotes:
            "• 1.5 marks for computing z₁ / z₂ = -1/2 + (5/2)i and LHS = -1/2 - (5/2)i.\n• 1.5 marks for finding conj(z₁) and conj(z₂) and setting up quotient.\n• 1 mark for computing RHS quotient = -1/2 - (5/2)i.\n• 1 mark for final verification conclusion LHS = RHS."
        }
      },
      {
        id: randomUUID(),
        questionNumber: 13,
        questionPart: "CRQ",
        questionType: "CRQ",
        marks: 5,
        chapterName: CHAPTER_NAME,
        chapterId: CHAPTER_ID,
        imageUrl: null,
        questionText: "Given z₁ = 3 - 4i and z₂ = 1 + 2i, prove the following properties:\n\n(a) conj(z₁ + z₂) = conj(z₁) + conj(z₂)\n(b) z₁ · conj(z₁) = |z₁|²",
        correctAnswer: "Proved: (a) LHS = RHS = 4 + 2i; (b) z₁ · conj(z₁) = |z₁|² = 25",
        paperIIData: {
          betterResponse:
            "Part (a): Verify conj(z₁ + z₂) = conj(z₁) + conj(z₂):\nLHS: z₁ + z₂ = (3 - 4i) + (1 + 2i) = (3 + 1) + (-4 + 2)i = 4 - 2i\nconj(z₁ + z₂) = conj(4 - 2i) = 4 + 2i\nRHS: conj(z₁) = 3 + 4i, conj(z₂) = 1 - 2i\nconj(z₁) + conj(z₂) = (3 + 4i) + (1 - 2i) = 4 + 2i\nLHS = RHS = 4 + 2i (Verified).\n\nPart (b): Verify z₁ · conj(z₁) = |z₁|²:\nLHS: z₁ · conj(z₁) = (3 - 4i)(3 + 4i) = 3² - (4i)² = 9 - 16i² = 9 - 16(-1) = 9 + 16 = 25\nRHS: |z₁| = √(3² + (-4)²) = √(9 + 16) = √25 = 5\n|z₁|² = 5² = 25\nSince LHS = RHS = 25, z₁ · conj(z₁) = |z₁|² is proved.",
          weakerResponse:
            "Student calculates modulus without squaring or forgets the minus sign squared (-4)² = +16.",
          markingNotes:
            "• 2 marks for Part (a): 1 mark for LHS conj(z₁ + z₂) = 4 + 2i, 1 mark for RHS = 4 + 2i.\n• 3 marks for Part (b): 1.5 marks for multiplying z₁ · conj(z₁) = 25, 1.5 marks for calculating |z₁| = 5 and |z₁|² = 25."
        }
      },

      // 7. Multiplicative Inverse (Q14, Q15)
      {
        id: randomUUID(),
        questionNumber: 14,
        questionPart: "CRQ",
        questionType: "CRQ",
        marks: 4,
        chapterName: CHAPTER_NAME,
        chapterId: CHAPTER_ID,
        imageUrl: null,
        questionText: "Find the multiplicative inverse of the complex number z = 7 - 3i and write it in the form a + ib.",
        correctAnswer: "7/58 + (3/58)i",
        paperIIData: {
          betterResponse:
            "Step 1: State the definition of multiplicative inverse:\nMultiplicative inverse of z is z⁻¹ = 1 / z = 1 / (7 - 3i).\n\nStep 2: Multiply numerator and denominator by the complex conjugate (7 + 3i):\nz⁻¹ = [1 · (7 + 3i)] / [(7 - 3i)(7 + 3i)]\n\nStep 3: Simplify denominator using (a - bi)(a + bi) = a² + b²:\nDenominator = 7² - (3i)² = 49 - 9i² = 49 - 9(-1) = 49 + 9 = 58\n\nStep 4: Write in standard form a + ib:\nz⁻¹ = (7 + 3i) / 58 = 7/58 + (3/58)i.",
          weakerResponse:
            "Student writes reciprocal 1 / (7 - 3i) without rationalizing the denominator, or computes denominator as 49 - 9 = 40.",
          markingNotes:
            "• 1 mark for reciprocal definition z⁻¹ = 1 / (7 - 3i).\n• 1 mark for multiplying by conjugate (7 + 3i).\n• 1 mark for denominator evaluation to 58.\n• 1 mark for standard form 7/58 + (3/58)i."
        }
      },
      {
        id: randomUUID(),
        questionNumber: 15,
        questionPart: "CRQ",
        questionType: "CRQ",
        marks: 3,
        chapterName: CHAPTER_NAME,
        chapterId: CHAPTER_ID,
        imageUrl: null,
        questionText: "Find the multiplicative inverse of the following fractional complex number:\n\nz = 2 / (5 - i)",
        correctAnswer: "5/2 - (1/2)i",
        paperIIData: {
          betterResponse:
            "Step 1: Take the reciprocal of the fraction to find the multiplicative inverse:\nz⁻¹ = 1 / z = 1 / [2 / (5 - i)]\nz⁻¹ = (5 - i) / 2\n\nStep 2: Separate into real and imaginary parts:\n(5 - i) / 2 = 5/2 - (1/2)i\n\nThis is in standard form a + ib where a = 5/2 and b = -1/2.",
          weakerResponse:
            "Student inverts incorrectly or attempts unnecessary complex multiplication when the reciprocal already has a real denominator.",
          markingNotes:
            "• 1.5 marks for reciprocal operation: z⁻¹ = (5 - i) / 2.\n• 1.5 marks for separating into standard form 5/2 - (1/2)i."
        }
      }
    ];
  } else if (setLetter === "B") {
    return [
      // 1. Reference Image 1: Powers of iota (Q1, Q2)
      {
        id: randomUUID(),
        questionNumber: 1,
        questionPart: "CRQ",
        questionType: "CRQ",
        marks: 3,
        chapterName: CHAPTER_NAME,
        chapterId: CHAPTER_ID,
        imageUrl: null,
        questionText: "Evaluate the following powers of iota (i = √(-1)) and simplify your answers:\n\n(i) i⁷⁹\n(ii) (-i)²³",
        correctAnswer: "(i) -i, (ii) i",
        paperIIData: {
          betterResponse:
            "Part (i): i⁷⁹\nStep 1: Express i⁷⁹ in terms of i² = -1:\ni⁷⁹ = i⁷⁸ · i = (i²)³⁹ · i\nStep 2: Substitute i² = -1:\n(-1)³⁹ · i = (-1) · i = -i.\n\nPart (ii): (-i)²³\nStep 1: Distribute exponent:\n(-i)²³ = (-1)²³ · i²³ = -1 · i²³\nStep 2: Express i²³ using i² = -1:\ni²³ = i²² · i = (i²)¹¹ · i = (-1)¹¹ · i = -i\nStep 3: Combine with (-1):\n-1 · (-i) = i.",
          weakerResponse:
            "Student calculates power of i incorrectly or misplaces the negative sign in part (ii).",
          markingNotes:
            "• 1.5 marks for Part (i): 0.5 mark for breaking into (i²)³⁹ · i, 1 mark for -i.\n• 1.5 marks for Part (ii): 0.5 mark for (-1)²³, 1 mark for i."
        }
      },
      {
        id: randomUUID(),
        questionNumber: 2,
        questionPart: "CRQ",
        questionType: "CRQ",
        marks: 3,
        chapterName: CHAPTER_NAME,
        chapterId: CHAPTER_ID,
        imageUrl: null,
        questionText: "Simplify and evaluate the following expression involving consecutive powers of iota:\n\n(i⁸ + i⁷ + i⁶ + i⁵)²",
        correctAnswer: "0",
        paperIIData: {
          betterResponse:
            "Step 1: Evaluate each individual power of i inside the brackets:\ni⁸ = (i²)⁴ = (-1)⁴ = 1\ni⁷ = i⁶ · i = (i²)³ · i = (-1)³ · i = -i\ni⁶ = (i²)³ = (-1)³ = -1\ni⁵ = i⁴ · i = (1) · i = i\n\nStep 2: Sum the terms inside the parentheses:\ni⁸ + i⁷ + i⁶ + i⁵ = 1 + (-i) + (-1) + i = 0\n\nStep 3: Square the result:\n(0)² = 0.",
          weakerResponse:
            "Student expands terms before simplifying, making arithmetic errors in signs.",
          markingNotes:
            "• 1.5 marks for evaluating i⁸=1, i⁷=-i, i⁶=-1, i⁵=i.\n• 1 mark for sum = 0.\n• 0.5 mark for final answer 0."
        }
      },

      // 2. Equality of Complex Numbers (Q3, Q4)
      {
        id: randomUUID(),
        questionNumber: 3,
        questionPart: "CRQ",
        questionType: "CRQ",
        marks: 4,
        chapterName: CHAPTER_NAME,
        chapterId: CHAPTER_ID,
        imageUrl: null,
        questionText: "Find the real values of x and y that satisfy the equation:\n\n(3x + 4) + (2y - 1)i = 13 + 7i",
        correctAnswer: "x = 3, y = 4",
        paperIIData: {
          betterResponse:
            "Step 1: Equate real parts:\n3x + 4 = 13\n3x = 13 - 4\n3x = 9\nx = 3\n\nStep 2: Equate imaginary parts:\n2y - 1 = 7\n2y = 7 + 1\n2y = 8\ny = 4\n\nTherefore, x = 3 and y = 4.",
          weakerResponse:
            "Student mixes i with real numbers or makes transposing error.",
          markingNotes:
            "• 1 mark for equating real and imaginary parts.\n• 1.5 marks for x = 3.\n• 1.5 marks for y = 4."
        }
      },
      {
        id: randomUUID(),
        questionNumber: 4,
        questionPart: "CRQ",
        questionType: "CRQ",
        marks: 4,
        chapterName: CHAPTER_NAME,
        chapterId: CHAPTER_ID,
        imageUrl: null,
        questionText: "Find the real values of x and y that satisfy the following complex equation:\n\n(1 - i)x + (2 + i)y = 4 - i",
        correctAnswer: "x = 2, y = 1",
        paperIIData: {
          betterResponse:
            "Step 1: Expand the left-hand side:\nx - ix + 2y + iy = 4 - i\n\nStep 2: Group real and imaginary terms:\n(x + 2y) + (-x + y)i = 4 - i\n\nStep 3: Equate real and imaginary parts:\n(1) x + 2y = 4\n(2) -x + y = -1\n\nStep 4: Solve simultaneously:\nAdd equations (1) and (2):\n(x + 2y) + (-x + y) = 4 + (-1)\n3y = 3 ⟹ y = 1\n\nStep 5: Substitute y = 1 into (1):\nx + 2(1) = 4 ⟹ x = 2\n\nTherefore, x = 2 and y = 1.",
          weakerResponse:
            "Student makes an error in adding the simultaneous equations or in expanding (1 - i)x.",
          markingNotes:
            "• 1 mark for expansion and grouping: (x + 2y) + (-x + y)i.\n• 1 mark for simultaneous system x + 2y = 4 and -x + y = -1.\n• 1 mark for y = 1.\n• 1 mark for x = 2."
        }
      },

      // 3. Addition of Complex Numbers (Q5, Q6)
      {
        id: randomUUID(),
        questionNumber: 5,
        questionPart: "CRQ",
        questionType: "CRQ",
        marks: 3,
        chapterName: CHAPTER_NAME,
        chapterId: CHAPTER_ID,
        imageUrl: null,
        questionText: "Add the following complex numbers and write your answer in the standard form a + ib:\n\n(14 - 5i) + (8 + 3i)",
        correctAnswer: "22 - 2i",
        paperIIData: {
          betterResponse:
            "Step 1: Group real parts together and imaginary parts together:\n(14 - 5i) + (8 + 3i) = (14 + 8) + (-5 + 3)i\n\nStep 2: Simplify:\n14 + 8 = 22\n-5 + 3 = -2\n\nStep 3: Standard form a + ib:\n22 - 2i.",
          weakerResponse:
            "Student writes -5 + 3 = -8i or miscalculates 14 + 8.",
          markingNotes:
            "• 1 mark for grouping real and imaginary parts.\n• 1 mark for real part 22.\n• 1 mark for imaginary part -2i."
        }
      },
      {
        id: randomUUID(),
        questionNumber: 6,
        questionPart: "CRQ",
        questionType: "CRQ",
        marks: 4,
        chapterName: CHAPTER_NAME,
        chapterId: CHAPTER_ID,
        imageUrl: null,
        questionText: "Given z₁ = 4 + 3i and z₂ = 3 - 2i, compute the linear combination 3z₁ + 2z₂ in standard form a + ib.",
        correctAnswer: "18 + 5i",
        paperIIData: {
          betterResponse:
            "Step 1: Compute scalar multiples:\n3z₁ = 3(4 + 3i) = 12 + 9i\n2z₂ = 2(3 - 2i) = 6 - 4i\n\nStep 2: Add the two complex numbers:\n3z₁ + 2z₂ = (12 + 9i) + (6 - 4i)\n\nStep 3: Combine real and imaginary parts:\n(12 + 6) + (9 - 4)i = 18 + 5i.",
          weakerResponse:
            "Student fails to multiply scalar across imaginary terms.",
          markingNotes:
            "• 1 mark for 3z₁ = 12 + 9i.\n• 1 mark for 2z₂ = 6 - 4i.\n• 1 mark for grouping terms.\n• 1 mark for final answer 18 + 5i."
        }
      },

      // 4. Subtraction of Complex Numbers (Q7, Q8)
      {
        id: randomUUID(),
        questionNumber: 7,
        questionPart: "CRQ",
        questionType: "CRQ",
        marks: 3,
        chapterName: CHAPTER_NAME,
        chapterId: CHAPTER_ID,
        imageUrl: null,
        questionText: "Subtract the following complex numbers and write the result in standard form a + ib:\n\n(13 + 8i) - (7 - 5i)",
        correctAnswer: "6 + 13i",
        paperIIData: {
          betterResponse:
            "Step 1: Distribute negative sign:\n(13 + 8i) - (7 - 5i) = 13 + 8i - 7 + 5i\n\nStep 2: Group real and imaginary parts:\n(13 - 7) + (8 + 5)i\n\nStep 3: Simplify:\n6 + 13i.",
          weakerResponse:
            "Student writes 8i - 5i = 3i instead of 8i - (-5i) = 13i.",
          markingNotes:
            "• 1 mark for sign distribution: 13 - 7 + 8i + 5i.\n• 1 mark for real part 6.\n• 1 mark for imaginary part 13i."
        }
      },
      {
        id: randomUUID(),
        questionNumber: 8,
        questionPart: "CRQ",
        questionType: "CRQ",
        marks: 4,
        chapterName: CHAPTER_NAME,
        chapterId: CHAPTER_ID,
        imageUrl: null,
        questionText: "Given z₁ = 9 + 4i and z₂ = 2 - 3i, find the value of z₁ - 3z₂ in standard form a + ib.",
        correctAnswer: "3 + 13i",
        paperIIData: {
          betterResponse:
            "Step 1: Compute 3z₂:\n3z₂ = 3(2 - 3i) = 6 - 9i\n\nStep 2: Set up subtraction z₁ - 3z₂:\nz₁ - 3z₂ = (9 + 4i) - (6 - 9i)\n\nStep 3: Distribute negative sign:\n= 9 + 4i - 6 + 9i\n\nStep 4: Group like terms:\n= (9 - 6) + (4 + 9)i = 3 + 13i.",
          weakerResponse:
            "Student makes sign mistake on -(-9i).",
          markingNotes:
            "• 1 mark for 3z₂ = 6 - 9i.\n• 1 mark for negative distribution.\n• 1 mark for real part 3.\n• 1 mark for imaginary part 13i."
        }
      },

      // 5. Division of Complex Numbers (Q9, Q10)
      {
        id: randomUUID(),
        questionNumber: 9,
        questionPart: "CRQ",
        questionType: "CRQ",
        marks: 4,
        chapterName: CHAPTER_NAME,
        chapterId: CHAPTER_ID,
        imageUrl: null,
        questionText: "Divide the complex numbers and express in standard form a + ib:\n\n(3 + 2i) / (2 - i)",
        correctAnswer: "4/5 + (7/5)i",
        paperIIData: {
          betterResponse:
            "Step 1: Multiply numerator and denominator by conjugate of denominator (2 + i):\n[(3 + 2i)(2 + i)] / [(2 - i)(2 + i)]\n\nStep 2: Expand numerator:\n(3 + 2i)(2 + i) = 3(2) + 3(i) + 2i(2) + 2i(i)\n= 6 + 3i + 4i + 2i² = 6 + 7i - 2 = 4 + 7i\n\nStep 3: Expand denominator:\n2² - i² = 4 - (-1) = 5\n\nStep 4: Write in standard form:\n(4 + 7i) / 5 = 4/5 + (7/5)i.",
          weakerResponse:
            "Student evaluates denominator as 4 - 1 = 3.",
          markingNotes:
            "• 1 mark for multiplying by conjugate 2 + i.\n• 1 mark for numerator expansion 4 + 7i.\n• 1 mark for denominator 5.\n• 1 mark for 4/5 + (7/5)i."
        }
      },
      {
        id: randomUUID(),
        questionNumber: 10,
        questionPart: "CRQ",
        questionType: "CRQ",
        marks: 4,
        chapterName: CHAPTER_NAME,
        chapterId: CHAPTER_ID,
        imageUrl: null,
        questionText: "Simplify and express the following quotient in standard complex form a + ib:\n\n(5 + 2i) / (2 - 3i)",
        correctAnswer: "4/13 + (19/13)i",
        paperIIData: {
          betterResponse:
            "Step 1: Multiply numerator and denominator by the conjugate of denominator (2 + 3i):\n[(5 + 2i)(2 + 3i)] / [(2 - 3i)(2 + 3i)]\n\nStep 2: Expand numerator:\n5(2) + 5(3i) + 2i(2) + 2i(3i) = 10 + 15i + 4i + 6i²\n= 10 + 19i + 6(-1) = 4 + 19i\n\nStep 3: Expand denominator:\n2² - (3i)² = 4 - 9(-1) = 4 + 9 = 13\n\nStep 4: Separate into real and imaginary parts:\n(4 + 19i) / 13 = 4/13 + (19/13)i.",
          weakerResponse:
            "Student makes sign mistake in numerator expansion.",
          markingNotes:
            "• 1 mark for conjugate multiplication.\n• 1 mark for numerator 4 + 19i.\n• 1 mark for denominator 13.\n• 1 mark for standard form 4/13 + (19/13)i."
        }
      },

      // 6. Properties of Complex Numbers (Q11, Q12, Q13)
      {
        id: randomUUID(),
        questionNumber: 11,
        questionPart: "CRQ",
        questionType: "CRQ",
        marks: 4,
        chapterName: CHAPTER_NAME,
        chapterId: CHAPTER_ID,
        imageUrl: null,
        questionText: "If z₁ = 2 - i and z₂ = 3 + 2i, verify the property that the conjugate of a product equals the product of the conjugates:\n\nconj(z₁ · z₂) = conj(z₁) · conj(z₂)",
        correctAnswer: "Verified: LHS = RHS = 8 - i",
        paperIIData: {
          betterResponse:
            "Step 1: Calculate Left-Hand Side conj(z₁ · z₂):\nz₁ · z₂ = (2 - i)(3 + 2i) = 6 + 4i - 3i - 2i² = 6 + i - 2(-1) = 8 + i\nconj(z₁ · z₂) = conj(8 + i) = 8 - i  --- (1)\n\nStep 2: Calculate Right-Hand Side conj(z₁) · conj(z₂):\nconj(z₁) = 2 + i\nconj(z₂) = 3 - 2i\nconj(z₁) · conj(z₂) = (2 + i)(3 - 2i) = 6 - 4i + 3i - 2i² = 6 - i + 2 = 8 - i  --- (2)\n\nStep 3: Conclusion:\nFrom (1) and (2), LHS = RHS = 8 - i. The property is verified.",
          weakerResponse:
            "Student miscalculates expansion of brackets or fails to compare both sides.",
          markingNotes:
            "• 1 mark for z₁ · z₂ = 8 + i.\n• 1 mark for LHS = 8 - i.\n• 1 mark for RHS = (2 + i)(3 - 2i) = 8 - i.\n• 1 mark for conclusion LHS = RHS."
        }
      },
      {
        id: randomUUID(),
        questionNumber: 12,
        questionPart: "CRQ",
        questionType: "CRQ",
        marks: 5,
        chapterName: CHAPTER_NAME,
        chapterId: CHAPTER_ID,
        imageUrl: null,
        questionText: "If z₁ = 3 + 2i and z₂ = 1 + i, verify the property that the conjugate of a quotient equals the quotient of the conjugates:\n\nconj(z₁ / z₂) = conj(z₁) / conj(z₂)",
        correctAnswer: "Verified: LHS = RHS = 5/2 + (1/2)i",
        paperIIData: {
          betterResponse:
            "Step 1: Evaluate LHS conj(z₁ / z₂):\nz₁ / z₂ = (3 + 2i) / (1 + i) = [(3 + 2i)(1 - i)] / [(1 + i)(1 - i)]\n= [3 - 3i + 2i - 2i²] / [1 - (-1)] = [3 - i + 2] / 2 = 5/2 - (1/2)i\nconj(z₁ / z₂) = 5/2 + (1/2)i  --- (1)\n\nStep 2: Evaluate RHS conj(z₁) / conj(z₂):\nconj(z₁) = 3 - 2i, conj(z₂) = 1 - i\nconj(z₁) / conj(z₂) = (3 - 2i) / (1 - i) = [(3 - 2i)(1 + i)] / [(1 - i)(1 + i)]\n= [3 + 3i - 2i - 2i²] / 2 = [3 + i + 2] / 2 = 5/2 + (1/2)i  --- (2)\n\nStep 3: Conclusion:\nLHS = RHS = 5/2 + (1/2)i, verifying the property.",
          weakerResponse:
            "Student fails to show both sides equal or makes mistake during rationalization.",
          markingNotes:
            "• 1.5 marks for LHS = 5/2 + (1/2)i.\n• 1.5 marks for setting up conjugates.\n• 1 mark for RHS = 5/2 + (1/2)i.\n• 1 mark for final verification statement."
        }
      },
      {
        id: randomUUID(),
        questionNumber: 13,
        questionPart: "CRQ",
        questionType: "CRQ",
        marks: 5,
        chapterName: CHAPTER_NAME,
        chapterId: CHAPTER_ID,
        imageUrl: null,
        questionText: "Given z₁ = 4 - 3i and z₂ = 2 + 5i, prove the following properties:\n\n(a) conj(z₁ + z₂) = conj(z₁) + conj(z₂)\n(b) z₁ · conj(z₁) = |z₁|²",
        correctAnswer: "Proved: (a) LHS = RHS = 6 - 2i; (b) z₁ · conj(z₁) = |z₁|² = 25",
        paperIIData: {
          betterResponse:
            "Part (a): Verify conj(z₁ + z₂) = conj(z₁) + conj(z₂):\nLHS: z₁ + z₂ = (4 - 3i) + (2 + 5i) = 6 + 2i ⟹ conj(z₁ + z₂) = 6 - 2i\nRHS: conj(z₁) = 4 + 3i, conj(z₂) = 2 - 5i ⟹ conj(z₁) + conj(z₂) = (4 + 2) + (3 - 5)i = 6 - 2i\nLHS = RHS = 6 - 2i (Verified).\n\nPart (b): Verify z₁ · conj(z₁) = |z₁|²:\nLHS: z₁ · conj(z₁) = (4 - 3i)(4 + 3i) = 4² - (3i)² = 16 - 9(-1) = 16 + 9 = 25\nRHS: |z₁| = √(4² + (-3)²) = √(16 + 9) = √25 = 5 ⟹ |z₁|² = 5² = 25\nLHS = RHS = 25 (Proved).",
          weakerResponse:
            "Student mixes up modulus formula or drops square root.",
          markingNotes:
            "• 2 marks for Part (a): 1 mark for LHS, 1 mark for RHS.\n• 3 marks for Part (b): 1.5 marks for LHS product 25, 1.5 marks for RHS modulus squared 25."
        }
      },

      // 7. Multiplicative Inverse (Q14, Q15)
      {
        id: randomUUID(),
        questionNumber: 14,
        questionPart: "CRQ",
        questionType: "CRQ",
        marks: 4,
        chapterName: CHAPTER_NAME,
        chapterId: CHAPTER_ID,
        imageUrl: null,
        questionText: "Find the multiplicative inverse of the complex number z = 6 - 2i and write it in the form a + ib.",
        correctAnswer: "3/20 + (1/20)i",
        paperIIData: {
          betterResponse:
            "Step 1: Definition of multiplicative inverse:\nz⁻¹ = 1 / (6 - 2i)\n\nStep 2: Multiply by conjugate (6 + 2i):\nz⁻¹ = (6 + 2i) / [(6 - 2i)(6 + 2i)]\n\nStep 3: Calculate denominator:\n6² - (2i)² = 36 - 4(-1) = 36 + 4 = 40\n\nStep 4: Simplify into standard form:\nz⁻¹ = (6 + 2i) / 40 = 6/40 + (2/40)i = 3/20 + (1/20)i.",
          weakerResponse:
            "Student does not reduce fraction 6/40 and 2/40 to lowest terms or makes calculation error.",
          markingNotes:
            "• 1 mark for reciprocal 1 / (6 - 2i).\n• 1 mark for multiplying by conjugate.\n• 1 mark for denominator 40.\n• 1 mark for simplified answer 3/20 + (1/20)i."
        }
      },
      {
        id: randomUUID(),
        questionNumber: 15,
        questionPart: "CRQ",
        questionType: "CRQ",
        marks: 3,
        chapterName: CHAPTER_NAME,
        chapterId: CHAPTER_ID,
        imageUrl: null,
        questionText: "Find the multiplicative inverse of the following fractional complex number:\n\nz = 3 / (4 - i)",
        correctAnswer: "4/3 - (1/3)i",
        paperIIData: {
          betterResponse:
            "Step 1: Invert the fraction:\nz⁻¹ = 1 / z = (4 - i) / 3\n\nStep 2: Separate real and imaginary parts:\n(4 - i) / 3 = 4/3 - (1/3)i.",
          weakerResponse:
            "Student inverts incorrectly.",
          markingNotes:
            "• 1.5 marks for reciprocal operation (4 - i) / 3.\n• 1.5 marks for standard form 4/3 - (1/3)i."
        }
      }
    ];
  } else if (setLetter === "C") {
    return [
      // 1. Reference Image 1: Powers of iota (Q1, Q2)
      {
        id: randomUUID(),
        questionNumber: 1,
        questionPart: "CRQ",
        questionType: "CRQ",
        marks: 3,
        chapterName: CHAPTER_NAME,
        chapterId: CHAPTER_ID,
        imageUrl: null,
        questionText: "Evaluate the following powers of iota (i = √(-1)) and simplify your answers:\n\n(i) i⁶⁵\n(ii) (-i)¹⁷",
        correctAnswer: "(i) i, (ii) -i",
        paperIIData: {
          betterResponse:
            "Part (i): i⁶⁵\nStep 1: Express i⁶⁵ in terms of i² = -1:\ni⁶⁵ = i⁶⁴ · i = (i²)³² · i\nStep 2: Substitute i² = -1:\n(-1)³² · i = 1 · i = i.\n\nPart (ii): (-i)¹⁷\nStep 1: Distribute exponent:\n(-i)¹⁷ = (-1)¹⁷ · i¹⁷ = -1 · i¹⁷\nStep 2: Express i¹⁷:\ni¹⁷ = i¹⁶ · i = (i²)⁸ · i = (-1)⁸ · i = 1 · i = i\nStep 3: Combine with (-1):\n-1 · (i) = -i.",
          weakerResponse:
            "Student computes power incorrectly or drops negative sign in part (ii).",
          markingNotes:
            "• 1.5 marks for Part (i): (i²)³² · i = i.\n• 1.5 marks for Part (ii): (-1)¹⁷ · i¹⁷ = -i."
        }
      },
      {
        id: randomUUID(),
        questionNumber: 2,
        questionPart: "CRQ",
        questionType: "CRQ",
        marks: 3,
        chapterName: CHAPTER_NAME,
        chapterId: CHAPTER_ID,
        imageUrl: null,
        questionText: "Simplify and evaluate the following expression involving consecutive powers of iota:\n\n(i¹² + i¹¹ + i¹⁰ + i⁹)³",
        correctAnswer: "0",
        paperIIData: {
          betterResponse:
            "Step 1: Evaluate each individual power of i inside the brackets:\ni¹² = (i²)⁶ = (-1)⁶ = 1\ni¹¹ = i¹⁰ · i = (i²)⁵ · i = (-1)⁵ · i = -i\ni¹⁰ = (i²)⁵ = (-1)⁵ = -1\ni⁹ = i⁸ · i = (i²)⁴ · i = 1 · i = i\n\nStep 2: Sum the terms inside the parentheses:\ni¹² + i¹¹ + i¹⁰ + i⁹ = 1 + (-i) + (-1) + i = 0\n\nStep 3: Cube the result:\n(0)³ = 0.",
          weakerResponse:
            "Student expands terms before simplifying, making algebraic sign errors.",
          markingNotes:
            "• 1.5 marks for evaluating powers: 1, -i, -1, i.\n• 1 mark for sum = 0.\n• 0.5 mark for final answer 0."
        }
      },

      // 2. Equality of Complex Numbers (Q3, Q4)
      {
        id: randomUUID(),
        questionNumber: 3,
        questionPart: "CRQ",
        questionType: "CRQ",
        marks: 4,
        chapterName: CHAPTER_NAME,
        chapterId: CHAPTER_ID,
        imageUrl: null,
        questionText: "Find the real values of x and y that satisfy the equation:\n\n(4x - 1) + (3y + 2)i = 15 - 7i",
        correctAnswer: "x = 4, y = -3",
        paperIIData: {
          betterResponse:
            "Step 1: Equate real parts:\n4x - 1 = 15\n4x = 16\nx = 4\n\nStep 2: Equate imaginary parts:\n3y + 2 = -7\n3y = -7 - 2\n3y = -9\ny = -3\n\nTherefore, x = 4 and y = -3.",
          weakerResponse:
            "Student makes sign mistake when solving 3y + 2 = -7, resulting in y = -5/3.",
          markingNotes:
            "• 1 mark for equating real and imaginary parts.\n• 1.5 marks for solving x = 4.\n• 1.5 marks for solving y = -3."
        }
      },
      {
        id: randomUUID(),
        questionNumber: 4,
        questionPart: "CRQ",
        questionType: "CRQ",
        marks: 4,
        chapterName: CHAPTER_NAME,
        chapterId: CHAPTER_ID,
        imageUrl: null,
        questionText: "Find the real values of x and y that satisfy the following complex equation:\n\n(3 + 2i)x + (1 - i)y = 9 + i",
        correctAnswer: "x = 2, y = 3",
        paperIIData: {
          betterResponse:
            "Step 1: Expand the left-hand side:\n3x + 2ix + y - iy = 9 + i\n\nStep 2: Group real and imaginary terms:\n(3x + y) + (2x - y)i = 9 + i\n\nStep 3: Equate real and imaginary parts:\n(1) 3x + y = 9\n(2) 2x - y = 1\n\nStep 4: Solve simultaneously:\nAdd equations (1) and (2):\n(3x + y) + (2x - y) = 9 + 1\n5x = 10 ⟹ x = 2\n\nStep 5: Substitute x = 2 into (1):\n3(2) + y = 9 ⟹ 6 + y = 9 ⟹ y = 3\n\nTherefore, x = 2 and y = 3.",
          weakerResponse:
            "Student groups terms incorrectly or makes elimination error.",
          markingNotes:
            "• 1 mark for grouping real and imaginary parts.\n• 1 mark for setting up simultaneous system.\n• 1 mark for x = 2.\n• 1 mark for y = 3."
        }
      },

      // 3. Addition of Complex Numbers (Q5, Q6)
      {
        id: randomUUID(),
        questionNumber: 5,
        questionPart: "CRQ",
        questionType: "CRQ",
        marks: 3,
        chapterName: CHAPTER_NAME,
        chapterId: CHAPTER_ID,
        imageUrl: null,
        questionText: "Add the following complex numbers and write your answer in the standard form a + ib:\n\n(12 - 7i) + (11 + 4i)",
        correctAnswer: "23 - 3i",
        paperIIData: {
          betterResponse:
            "Step 1: Group real parts together and imaginary parts together:\n(12 - 7i) + (11 + 4i) = (12 + 11) + (-7 + 4)i\n\nStep 2: Simplify:\n12 + 11 = 23\n-7 + 4 = -3\n\nStep 3: Standard form a + ib:\n23 - 3i.",
          weakerResponse:
            "Student adds incorrectly, writing -7 + 4 = -11.",
          markingNotes:
            "• 1 mark for grouping real and imaginary parts.\n• 1 mark for real part 23.\n• 1 mark for imaginary part -3i."
        }
      },
      {
        id: randomUUID(),
        questionNumber: 6,
        questionPart: "CRQ",
        questionType: "CRQ",
        marks: 4,
        chapterName: CHAPTER_NAME,
        chapterId: CHAPTER_ID,
        imageUrl: null,
        questionText: "Given z₁ = 5 + 2i and z₂ = 1 - 4i, compute the linear combination 2z₁ + 4z₂ in standard form a + ib.",
        correctAnswer: "14 - 12i",
        paperIIData: {
          betterResponse:
            "Step 1: Multiply each complex number by its scalar:\n2z₁ = 2(5 + 2i) = 10 + 4i\n4z₂ = 4(1 - 4i) = 4 - 16i\n\nStep 2: Add the two complex numbers:\n2z₁ + 4z₂ = (10 + 4i) + (4 - 16i)\n\nStep 3: Combine real and imaginary parts:\n(10 + 4) + (4 - 16)i = 14 - 12i.",
          weakerResponse:
            "Student makes error in scalar distribution.",
          markingNotes:
            "• 1 mark for 2z₁ = 10 + 4i.\n• 1 mark for 4z₂ = 4 - 16i.\n• 1 mark for combining terms.\n• 1 mark for 14 - 12i."
        }
      },

      // 4. Subtraction of Complex Numbers (Q7, Q8)
      {
        id: randomUUID(),
        questionNumber: 7,
        questionPart: "CRQ",
        questionType: "CRQ",
        marks: 3,
        chapterName: CHAPTER_NAME,
        chapterId: CHAPTER_ID,
        imageUrl: null,
        questionText: "Subtract the following complex numbers and write the result in standard form a + ib:\n\n(15 + 6i) - (8 - 4i)",
        correctAnswer: "7 + 10i",
        paperIIData: {
          betterResponse:
            "Step 1: Distribute negative sign:\n(15 + 6i) - (8 - 4i) = 15 + 6i - 8 + 4i\n\nStep 2: Group real and imaginary parts:\n(15 - 8) + (6 + 4)i\n\nStep 3: Simplify:\n7 + 10i.",
          weakerResponse:
            "Student writes 6i - 4i = 2i.",
          markingNotes:
            "• 1 mark for correct sign distribution: 15 - 8 + 6i + 4i.\n• 1 mark for real part 7.\n• 1 mark for imaginary part 10i."
        }
      },
      {
        id: randomUUID(),
        questionNumber: 8,
        questionPart: "CRQ",
        questionType: "CRQ",
        marks: 4,
        chapterName: CHAPTER_NAME,
        chapterId: CHAPTER_ID,
        imageUrl: null,
        questionText: "Given z₁ = 7 + 5i and z₂ = 1 - 2i, find the value of z₁ - 4z₂ in standard form a + ib.",
        correctAnswer: "3 + 13i",
        paperIIData: {
          betterResponse:
            "Step 1: Compute 4z₂:\n4z₂ = 4(1 - 2i) = 4 - 8i\n\nStep 2: Set up subtraction z₁ - 4z₂:\nz₁ - 4z₂ = (7 + 5i) - (4 - 8i)\n\nStep 3: Distribute negative sign:\n= 7 + 5i - 4 + 8i\n\nStep 4: Group like terms:\n= (7 - 4) + (5 + 8)i = 3 + 13i.",
          weakerResponse:
            "Student writes 5i - 8i = -3i instead of 5i + 8i = 13i.",
          markingNotes:
            "• 1 mark for 4z₂ = 4 - 8i.\n• 1 mark for negative distribution.\n• 1 mark for real part 3.\n• 1 mark for imaginary part 13i."
        }
      },

      // 5. Division of Complex Numbers (Q9, Q10)
      {
        id: randomUUID(),
        questionNumber: 9,
        questionPart: "CRQ",
        questionType: "CRQ",
        marks: 4,
        chapterName: CHAPTER_NAME,
        chapterId: CHAPTER_ID,
        imageUrl: null,
        questionText: "Divide the complex numbers and express in standard form a + ib:\n\n(4 + i) / (1 - 2i)",
        correctAnswer: "2/5 + (9/5)i",
        paperIIData: {
          betterResponse:
            "Step 1: Multiply numerator and denominator by conjugate of denominator (1 + 2i):\n[(4 + i)(1 + 2i)] / [(1 - 2i)(1 + 2i)]\n\nStep 2: Expand numerator:\n(4 + i)(1 + 2i) = 4(1) + 4(2i) + i(1) + i(2i)\n= 4 + 8i + i + 2i² = 4 + 9i + 2(-1) = 2 + 9i\n\nStep 3: Expand denominator:\n1² - (2i)² = 1 - 4(-1) = 1 + 4 = 5\n\nStep 4: Separate into real and imaginary parts:\n(2 + 9i) / 5 = 2/5 + (9/5)i.",
          weakerResponse:
            "Student does not multiply by conjugate or makes sign error with 2i².",
          markingNotes:
            "• 1 mark for multiplying by conjugate 1 + 2i.\n• 1 mark for numerator expansion to 2 + 9i.\n• 1 mark for denominator 5.\n• 1 mark for final form 2/5 + (9/5)i."
        }
      },
      {
        id: randomUUID(),
        questionNumber: 10,
        questionPart: "CRQ",
        questionType: "CRQ",
        marks: 4,
        chapterName: CHAPTER_NAME,
        chapterId: CHAPTER_ID,
        imageUrl: null,
        questionText: "Simplify and express the following quotient in standard complex form a + ib:\n\n(3 + 4i) / (3 - 2i)",
        correctAnswer: "1/13 + (18/13)i",
        paperIIData: {
          betterResponse:
            "Step 1: Multiply numerator and denominator by conjugate of denominator (3 + 2i):\n[(3 + 4i)(3 + 2i)] / [(3 - 2i)(3 + 2i)]\n\nStep 2: Expand numerator:\n3(3) + 3(2i) + 4i(3) + 4i(2i) = 9 + 6i + 12i + 8i²\n= 9 + 18i + 8(-1) = 1 + 18i\n\nStep 3: Expand denominator:\n3² - (2i)² = 9 - 4(-1) = 9 + 4 = 13\n\nStep 4: Express in standard form:\n(1 + 18i) / 13 = 1/13 + (18/13)i.",
          weakerResponse:
            "Student makes sign mistake when substituting i² = -1.",
          markingNotes:
            "• 1 mark for conjugate multiplication.\n• 1 mark for numerator 1 + 18i.\n• 1 mark for denominator 13.\n• 1 mark for answer 1/13 + (18/13)i."
        }
      },

      // 6. Properties of Complex Numbers (Q11, Q12, Q13)
      {
        id: randomUUID(),
        questionNumber: 11,
        questionPart: "CRQ",
        questionType: "CRQ",
        marks: 4,
        chapterName: CHAPTER_NAME,
        chapterId: CHAPTER_ID,
        imageUrl: null,
        questionText: "If z₁ = 3 - 2i and z₂ = 1 + 3i, verify the property that the conjugate of a product equals the product of the conjugates:\n\nconj(z₁ · z₂) = conj(z₁) · conj(z₂)",
        correctAnswer: "Verified: LHS = RHS = 9 - 7i",
        paperIIData: {
          betterResponse:
            "Step 1: Calculate Left-Hand Side conj(z₁ · z₂):\nz₁ · z₂ = (3 - 2i)(1 + 3i) = 3 + 9i - 2i - 6i² = 3 + 7i - 6(-1) = 9 + 7i\nconj(z₁ · z₂) = conj(9 + 7i) = 9 - 7i  --- (1)\n\nStep 2: Calculate Right-Hand Side conj(z₁) · conj(z₂):\nconj(z₁) = 3 + 2i, conj(z₂) = 1 - 3i\nconj(z₁) · conj(z₂) = (3 + 2i)(1 - 3i) = 3 - 9i + 2i - 6i² = 3 - 7i + 6 = 9 - 7i  --- (2)\n\nStep 3: Conclusion:\nLHS = RHS = 9 - 7i, hence verified.",
          weakerResponse:
            "Student makes sign mistake in -6i² = +6.",
          markingNotes:
            "• 1 mark for product z₁ · z₂ = 9 + 7i.\n• 1 mark for LHS = 9 - 7i.\n• 1 mark for RHS = 9 - 7i.\n• 1 mark for conclusion LHS = RHS."
        }
      },
      {
        id: randomUUID(),
        questionNumber: 12,
        questionPart: "CRQ",
        questionType: "CRQ",
        marks: 5,
        chapterName: CHAPTER_NAME,
        chapterId: CHAPTER_ID,
        imageUrl: null,
        questionText: "If z₁ = 4 + i and z₂ = 1 - i, verify the property that the conjugate of a quotient equals the quotient of the conjugates:\n\nconj(z₁ / z₂) = conj(z₁) / conj(z₂)",
        correctAnswer: "Verified: LHS = RHS = 3/2 - (5/2)i",
        paperIIData: {
          betterResponse:
            "Step 1: Evaluate LHS conj(z₁ / z₂):\nz₁ / z₂ = (4 + i) / (1 - i) = [(4 + i)(1 + i)] / [(1 - i)(1 + i)]\n= [4 + 4i + i + i²] / 2 = [4 + 5i - 1] / 2 = 3/2 + (5/2)i\nconj(z₁ / z₂) = 3/2 - (5/2)i  --- (1)\n\nStep 2: Evaluate RHS conj(z₁) / conj(z₂):\nconj(z₁) = 4 - i, conj(z₂) = 1 + i\nconj(z₁) / conj(z₂) = (4 - i) / (1 + i) = [(4 - i)(1 - i)] / [(1 + i)(1 - i)]\n= [4 - 4i - i + i²] / 2 = [4 - 5i - 1] / 2 = 3/2 - (5/2)i  --- (2)\n\nStep 3: Conclusion:\nLHS = RHS = 3/2 - (5/2)i, verifying the property.",
          weakerResponse:
            "Student makes error in rationalizing denominators.",
          markingNotes:
            "• 1.5 marks for LHS = 3/2 - (5/2)i.\n• 1.5 marks for conjugates set up.\n• 1 mark for RHS = 3/2 - (5/2)i.\n• 1 mark for conclusion."
        }
      },
      {
        id: randomUUID(),
        questionNumber: 13,
        questionPart: "CRQ",
        questionType: "CRQ",
        marks: 5,
        chapterName: CHAPTER_NAME,
        chapterId: CHAPTER_ID,
        imageUrl: null,
        questionText: "Given z₁ = 5 - 12i and z₂ = 2 + 3i, prove the following properties:\n\n(a) conj(z₁ + z₂) = conj(z₁) + conj(z₂)\n(b) z₁ · conj(z₁) = |z₁|²",
        correctAnswer: "Proved: (a) LHS = RHS = 7 + 9i; (b) z₁ · conj(z₁) = |z₁|² = 169",
        paperIIData: {
          betterResponse:
            "Part (a): Verify conj(z₁ + z₂) = conj(z₁) + conj(z₂):\nLHS: z₁ + z₂ = (5 - 12i) + (2 + 3i) = 7 - 9i ⟹ conj(z₁ + z₂) = 7 + 9i\nRHS: conj(z₁) = 5 + 12i, conj(z₂) = 2 - 3i ⟹ conj(z₁) + conj(z₂) = (5 + 2) + (12 - 3)i = 7 + 9i\nLHS = RHS = 7 + 9i (Verified).\n\nPart (b): Verify z₁ · conj(z₁) = |z₁|²:\nLHS: z₁ · conj(z₁) = (5 - 12i)(5 + 12i) = 5² - (12i)² = 25 - 144(-1) = 25 + 144 = 169\nRHS: |z₁| = √(5² + (-12)²) = √(25 + 144) = √169 = 13 ⟹ |z₁|² = 13² = 169\nLHS = RHS = 169 (Proved).",
          weakerResponse:
            "Student miscalculates (-12)² or 5² + 12².",
          markingNotes:
            "• 2 marks for Part (a): 1 mark for LHS, 1 mark for RHS.\n• 3 marks for Part (b): 1.5 marks for product 169, 1.5 marks for modulus squared 169."
        }
      },

      // 7. Multiplicative Inverse (Q14, Q15)
      {
        id: randomUUID(),
        questionNumber: 14,
        questionPart: "CRQ",
        questionType: "CRQ",
        marks: 4,
        chapterName: CHAPTER_NAME,
        chapterId: CHAPTER_ID,
        imageUrl: null,
        questionText: "Find the multiplicative inverse of the complex number z = 5 - 4i and write it in the form a + ib.",
        correctAnswer: "5/41 + (4/41)i",
        paperIIData: {
          betterResponse:
            "Step 1: Multiplicative inverse definition:\nz⁻¹ = 1 / (5 - 4i)\n\nStep 2: Multiply by conjugate (5 + 4i):\nz⁻¹ = (5 + 4i) / [(5 - 4i)(5 + 4i)]\n\nStep 3: Calculate denominator:\n5² - (4i)² = 25 - 16(-1) = 25 + 16 = 41\n\nStep 4: Standard form:\nz⁻¹ = (5 + 4i) / 41 = 5/41 + (4/41)i.",
          weakerResponse:
            "Student computes 25 - 16 = 9 instead of 25 + 16 = 41.",
          markingNotes:
            "• 1 mark for reciprocal 1 / (5 - 4i).\n• 1 mark for conjugate multiplication.\n• 1 mark for denominator 41.\n• 1 mark for answer 5/41 + (4/41)i."
        }
      },
      {
        id: randomUUID(),
        questionNumber: 15,
        questionPart: "CRQ",
        questionType: "CRQ",
        marks: 3,
        chapterName: CHAPTER_NAME,
        chapterId: CHAPTER_ID,
        imageUrl: null,
        questionText: "Find the multiplicative inverse of the following fractional complex number:\n\nz = 2 / (3 - 2i)",
        correctAnswer: "3/2 - i",
        paperIIData: {
          betterResponse:
            "Step 1: Take the reciprocal of the fraction:\nz⁻¹ = 1 / z = (3 - 2i) / 2\n\nStep 2: Separate real and imaginary parts:\n(3 - 2i) / 2 = 3/2 - (2/2)i = 3/2 - i.",
          weakerResponse:
            "Student leaves answer as 3/2 - (2/2)i without reducing 2/2 = 1.",
          markingNotes:
            "• 1.5 marks for reciprocal operation (3 - 2i) / 2.\n• 1.5 marks for simplifying to 3/2 - i."
        }
      }
    ];
  } else {
    // Set D
    return [
      // 1. Reference Image 1: Powers of iota (Q1, Q2)
      {
        id: randomUUID(),
        questionNumber: 1,
        questionPart: "CRQ",
        questionType: "CRQ",
        marks: 3,
        chapterName: CHAPTER_NAME,
        chapterId: CHAPTER_ID,
        imageUrl: null,
        questionText: "Evaluate the following powers of iota (i = √(-1)) and simplify your answers:\n\n(i) i⁹³\n(ii) (-i)²¹",
        correctAnswer: "(i) i, (ii) -i",
        paperIIData: {
          betterResponse:
            "Part (i): i⁹³\nStep 1: Express in terms of i² = -1:\ni⁹³ = i⁹² · i = (i²)⁴⁶ · i\nStep 2: Substitute i² = -1:\n(-1)⁴⁶ · i = 1 · i = i.\n\nPart (ii): (-i)²¹\nStep 1: Distribute exponent:\n(-i)²¹ = (-1)²¹ · i²¹ = -1 · i²¹\nStep 2: Express i²¹:\ni²¹ = i²⁰ · i = (i²)¹⁰ · i = (-1)¹⁰ · i = 1 · i = i\nStep 3: Multiply by (-1):\n-1 · (i) = -i.",
          weakerResponse:
            "Student miscalculates exponent division or ignores negative sign.",
          markingNotes:
            "• 1.5 marks for Part (i): (i²)⁴⁶ · i = i.\n• 1.5 marks for Part (ii): (-1)²¹ · i²¹ = -i."
        }
      },
      {
        id: randomUUID(),
        questionNumber: 2,
        questionPart: "CRQ",
        questionType: "CRQ",
        marks: 3,
        chapterName: CHAPTER_NAME,
        chapterId: CHAPTER_ID,
        imageUrl: null,
        questionText: "Simplify and evaluate the following expression involving consecutive powers of iota:\n\n(i¹⁶ + i¹⁵ + i¹⁴ + i¹³)⁴",
        correctAnswer: "0",
        paperIIData: {
          betterResponse:
            "Step 1: Evaluate each individual power of i inside the brackets:\ni¹⁶ = (i²)⁸ = (-1)⁸ = 1\ni¹⁵ = i¹⁴ · i = (i²)⁷ · i = (-1)⁷ · i = -i\ni¹⁴ = (i²)⁷ = (-1)⁷ = -1\ni¹³ = i¹² · i = (i²)⁶ · i = 1 · i = i\n\nStep 2: Sum the terms inside the parentheses:\ni¹⁶ + i¹⁵ + i¹⁴ + i¹³ = 1 + (-i) + (-1) + i = 0\n\nStep 3: Raise to power:\n(0)⁴ = 0.",
          weakerResponse:
            "Student expands terms before simplifying.",
          markingNotes:
            "• 1.5 marks for individual powers 1, -i, -1, i.\n• 1 mark for sum = 0.\n• 0.5 mark for final answer 0."
        }
      },

      // 2. Equality of Complex Numbers (Q3, Q4)
      {
        id: randomUUID(),
        questionNumber: 3,
        questionPart: "CRQ",
        questionType: "CRQ",
        marks: 4,
        chapterName: CHAPTER_NAME,
        chapterId: CHAPTER_ID,
        imageUrl: null,
        questionText: "Find the real values of x and y that satisfy the equation:\n\n(5x + 3) + (4y - 5)i = 8 + 11i",
        correctAnswer: "x = 1, y = 4",
        paperIIData: {
          betterResponse:
            "Step 1: Equate real parts:\n5x + 3 = 8\n5x = 8 - 3\n5x = 5\nx = 1\n\nStep 2: Equate imaginary parts:\n4y - 5 = 11\n4y = 11 + 5\n4y = 16\ny = 4\n\nTherefore, x = 1 and y = 4.",
          weakerResponse:
            "Student confuses real and imaginary coefficients or makes subtraction error.",
          markingNotes:
            "• 1 mark for setting up real and imaginary equations.\n• 1.5 marks for solving x = 1.\n• 1.5 marks for solving y = 4."
        }
      },
      {
        id: randomUUID(),
        questionNumber: 4,
        questionPart: "CRQ",
        questionType: "CRQ",
        marks: 4,
        chapterName: CHAPTER_NAME,
        chapterId: CHAPTER_ID,
        imageUrl: null,
        questionText: "Find the real values of x and y that satisfy the following complex equation:\n\n(1 + 2i)x + (3 - i)y = 6 + 5i",
        correctAnswer: "x = 3, y = 1",
        paperIIData: {
          betterResponse:
            "Step 1: Expand the left-hand side:\nx + 2ix + 3y - iy = 6 + 5i\n\nStep 2: Group real and imaginary terms:\n(x + 3y) + (2x - y)i = 6 + 5i\n\nStep 3: Equate real and imaginary parts:\n(1) x + 3y = 6\n(2) 2x - y = 5\n\nStep 4: Solve simultaneously:\nFrom (2): y = 2x - 5\nSubstitute into (1):\nx + 3(2x - 5) = 6\nx + 6x - 15 = 6\n7x = 21 ⟹ x = 3\n\nStep 5: Substitute x = 3 into y = 2x - 5:\ny = 2(3) - 5 = 6 - 5 = 1\n\nTherefore, x = 3 and y = 1.",
          weakerResponse:
            "Student makes substitution error in simultaneous equation.",
          markingNotes:
            "• 1 mark for grouping: (x + 3y) + (2x - y)i.\n• 1 mark for system x + 3y = 6 and 2x - y = 5.\n• 1 mark for x = 3.\n• 1 mark for y = 1."
        }
      },

      // 3. Addition of Complex Numbers (Q5, Q6)
      {
        id: randomUUID(),
        questionNumber: 5,
        questionPart: "CRQ",
        questionType: "CRQ",
        marks: 3,
        chapterName: CHAPTER_NAME,
        chapterId: CHAPTER_ID,
        imageUrl: null,
        questionText: "Add the following complex numbers and write your answer in the standard form a + ib:\n\n(15 - 4i) + (7 + 6i)",
        correctAnswer: "22 + 2i",
        paperIIData: {
          betterResponse:
            "Step 1: Group real parts together and imaginary parts together:\n(15 - 4i) + (7 + 6i) = (15 + 7) + (-4 + 6)i\n\nStep 2: Simplify:\n15 + 7 = 22\n-4 + 6 = 2\n\nStep 3: Standard form a + ib:\n22 + 2i.",
          weakerResponse:
            "Student makes sign error -4 + 6 = -2i.",
          markingNotes:
            "• 1 mark for grouping real and imaginary parts.\n• 1 mark for real part 22.\n• 1 mark for imaginary part 2i."
        }
      },
      {
        id: randomUUID(),
        questionNumber: 6,
        questionPart: "CRQ",
        questionType: "CRQ",
        marks: 4,
        chapterName: CHAPTER_NAME,
        chapterId: CHAPTER_ID,
        imageUrl: null,
        questionText: "Given z₁ = 2 + 5i and z₂ = 4 - 3i, compute the linear combination 4z₁ + 2z₂ in standard form a + ib.",
        correctAnswer: "16 + 14i",
        paperIIData: {
          betterResponse:
            "Step 1: Compute scalar multiples:\n4z₁ = 4(2 + 5i) = 8 + 20i\n2z₂ = 2(4 - 3i) = 8 - 6i\n\nStep 2: Add the two complex numbers:\n4z₁ + 2z₂ = (8 + 20i) + (8 - 6i)\n\nStep 3: Combine real and imaginary parts:\n(8 + 8) + (20 - 6)i = 16 + 14i.",
          weakerResponse:
            "Student does not multiply imaginary part by scalar.",
          markingNotes:
            "• 1 mark for 4z₁ = 8 + 20i.\n• 1 mark for 2z₂ = 8 - 6i.\n• 1 mark for grouping terms.\n• 1 mark for 16 + 14i."
        }
      },

      // 4. Subtraction of Complex Numbers (Q7, Q8)
      {
        id: randomUUID(),
        questionNumber: 7,
        questionPart: "CRQ",
        questionType: "CRQ",
        marks: 3,
        chapterName: CHAPTER_NAME,
        chapterId: CHAPTER_ID,
        imageUrl: null,
        questionText: "Subtract the following complex numbers and write the result in standard form a + ib:\n\n(14 + 7i) - (6 - 8i)",
        correctAnswer: "8 + 15i",
        paperIIData: {
          betterResponse:
            "Step 1: Distribute negative sign:\n(14 + 7i) - (6 - 8i) = 14 + 7i - 6 + 8i\n\nStep 2: Group real and imaginary parts:\n(14 - 6) + (7 + 8)i\n\nStep 3: Simplify:\n8 + 15i.",
          weakerResponse:
            "Student forgets to change -(-8i) to +8i.",
          markingNotes:
            "• 1 mark for correct sign distribution.\n• 1 mark for real part 8.\n• 1 mark for imaginary part 15i."
        }
      },
      {
        id: randomUUID(),
        questionNumber: 8,
        questionPart: "CRQ",
        questionType: "CRQ",
        marks: 4,
        chapterName: CHAPTER_NAME,
        chapterId: CHAPTER_ID,
        imageUrl: null,
        questionText: "Given z₁ = 10 + 2i and z₂ = 4 - i, find the value of z₁ - 2z₂ in standard form a + ib.",
        correctAnswer: "2 + 4i",
        paperIIData: {
          betterResponse:
            "Step 1: Compute 2z₂:\n2z₂ = 2(4 - i) = 8 - 2i\n\nStep 2: Set up subtraction z₁ - 2z₂:\nz₁ - 2z₂ = (10 + 2i) - (8 - 2i)\n\nStep 3: Distribute negative sign:\n= 10 + 2i - 8 + 2i\n\nStep 4: Group like terms:\n= (10 - 8) + (2 + 2)i = 2 + 4i.",
          weakerResponse:
            "Student writes 2i - 2i = 0.",
          markingNotes:
            "• 1 mark for 2z₂ = 8 - 2i.\n• 1 mark for negative distribution.\n• 1 mark for real part 2.\n• 1 mark for imaginary part 4i."
        }
      },

      // 5. Division of Complex Numbers (Q9, Q10)
      {
        id: randomUUID(),
        questionNumber: 9,
        questionPart: "CRQ",
        questionType: "CRQ",
        marks: 4,
        chapterName: CHAPTER_NAME,
        chapterId: CHAPTER_ID,
        imageUrl: null,
        questionText: "Divide the complex numbers and express in standard form a + ib:\n\n(1 + 4i) / (2 - i)",
        correctAnswer: "-2/5 + (9/5)i",
        paperIIData: {
          betterResponse:
            "Step 1: Multiply numerator and denominator by conjugate of denominator (2 + i):\n[(1 + 4i)(2 + i)] / [(2 - i)(2 + i)]\n\nStep 2: Expand numerator:\n(1 + 4i)(2 + i) = 2 + i + 8i + 4i² = 2 + 9i + 4(-1) = -2 + 9i\n\nStep 3: Expand denominator:\n2² - i² = 4 - (-1) = 5\n\nStep 4: Separate into real and imaginary parts:\n(-2 + 9i) / 5 = -2/5 + (9/5)i.",
          weakerResponse:
            "Student makes sign mistake in numerator.",
          markingNotes:
            "• 1 mark for multiplying by conjugate 2 + i.\n• 1 mark for numerator -2 + 9i.\n• 1 mark for denominator 5.\n• 1 mark for standard form -2/5 + (9/5)i."
        }
      },
      {
        id: randomUUID(),
        questionNumber: 10,
        questionPart: "CRQ",
        questionType: "CRQ",
        marks: 4,
        chapterName: CHAPTER_NAME,
        chapterId: CHAPTER_ID,
        imageUrl: null,
        questionText: "Simplify and express the following quotient in standard complex form a + ib:\n\n(2 + 5i) / (3 - 2i)",
        correctAnswer: "-4/13 + (19/13)i",
        paperIIData: {
          betterResponse:
            "Step 1: Multiply numerator and denominator by conjugate of denominator (3 + 2i):\n[(2 + 5i)(3 + 2i)] / [(3 - 2i)(3 + 2i)]\n\nStep 2: Expand numerator:\n2(3) + 2(2i) + 5i(3) + 5i(2i) = 6 + 4i + 15i + 10i²\n= 6 + 19i + 10(-1) = -4 + 19i\n\nStep 3: Expand denominator:\n3² - (2i)² = 9 - 4(-1) = 9 + 4 = 13\n\nStep 4: Express in standard form:\n(-4 + 19i) / 13 = -4/13 + (19/13)i.",
          weakerResponse:
            "Student writes 6 + 10 = 16 instead of 6 - 10 = -4.",
          markingNotes:
            "• 1 mark for conjugate multiplication.\n• 1 mark for numerator -4 + 19i.\n• 1 mark for denominator 13.\n• 1 mark for standard form -4/13 + (19/13)i."
        }
      },

      // 6. Properties of Complex Numbers (Q11, Q12, Q13)
      {
        id: randomUUID(),
        questionNumber: 11,
        questionPart: "CRQ",
        questionType: "CRQ",
        marks: 4,
        chapterName: CHAPTER_NAME,
        chapterId: CHAPTER_ID,
        imageUrl: null,
        questionText: "If z₁ = 2 - 3i and z₂ = 1 + 2i, verify the property that the conjugate of a product equals the product of the conjugates:\n\nconj(z₁ · z₂) = conj(z₁) · conj(z₂)",
        correctAnswer: "Verified: LHS = RHS = 8 - i",
        paperIIData: {
          betterResponse:
            "Step 1: Calculate Left-Hand Side conj(z₁ · z₂):\nz₁ · z₂ = (2 - 3i)(1 + 2i) = 2 + 4i - 3i - 6i² = 2 + i - 6(-1) = 8 + i\nconj(z₁ · z₂) = conj(8 + i) = 8 - i  --- (1)\n\nStep 2: Calculate Right-Hand Side conj(z₁) · conj(z₂):\nconj(z₁) = 2 + 3i, conj(z₂) = 1 - 2i\nconj(z₁) · conj(z₂) = (2 + 3i)(1 - 2i) = 2 - 4i + 3i - 6i² = 2 - i + 6 = 8 - i  --- (2)\n\nStep 3: Conclusion:\nLHS = RHS = 8 - i, hence the property is verified.",
          weakerResponse:
            "Student makes arithmetic mistake in expansion.",
          markingNotes:
            "• 1 mark for product z₁ · z₂ = 8 + i.\n• 1 mark for LHS = 8 - i.\n• 1 mark for RHS = 8 - i.\n• 1 mark for conclusion LHS = RHS."
        }
      },
      {
        id: randomUUID(),
        questionNumber: 12,
        questionPart: "CRQ",
        questionType: "CRQ",
        marks: 5,
        chapterName: CHAPTER_NAME,
        chapterId: CHAPTER_ID,
        imageUrl: null,
        questionText: "If z₁ = 1 + 4i and z₂ = 1 + i, verify the property that the conjugate of a quotient equals the quotient of the conjugates:\n\nconj(z₁ / z₂) = conj(z₁) / conj(z₂)",
        correctAnswer: "Verified: LHS = RHS = 5/2 - (3/2)i",
        paperIIData: {
          betterResponse:
            "Step 1: Evaluate LHS conj(z₁ / z₂):\nz₁ / z₂ = (1 + 4i) / (1 + i) = [(1 + 4i)(1 - i)] / [(1 + i)(1 - i)]\n= [1 - i + 4i - 4i²] / 2 = [1 + 3i + 4] / 2 = 5/2 + (3/2)i\nconj(z₁ / z₂) = 5/2 - (3/2)i  --- (1)\n\nStep 2: Evaluate RHS conj(z₁) / conj(z₂):\nconj(z₁) = 1 - 4i, conj(z₂) = 1 - i\nconj(z₁) / conj(z₂) = (1 - 4i) / (1 - i) = [(1 - 4i)(1 + i)] / [(1 - i)(1 + i)]\n= [1 + i - 4i - 4i²] / 2 = [1 - 3i + 4] / 2 = 5/2 - (3/2)i  --- (2)\n\nStep 3: Conclusion:\nLHS = RHS = 5/2 - (3/2)i, verifying the property.",
          weakerResponse:
            "Student makes mistake during quotient rationalization.",
          markingNotes:
            "• 1.5 marks for LHS = 5/2 - (3/2)i.\n• 1.5 marks for setting up conjugates.\n• 1 mark for RHS = 5/2 - (3/2)i.\n• 1 mark for conclusion."
        }
      },
      {
        id: randomUUID(),
        questionNumber: 13,
        questionPart: "CRQ",
        questionType: "CRQ",
        marks: 5,
        chapterName: CHAPTER_NAME,
        chapterId: CHAPTER_ID,
        imageUrl: null,
        questionText: "Given z₁ = 6 - 8i and z₂ = 1 + 4i, prove the following properties:\n\n(a) conj(z₁ + z₂) = conj(z₁) + conj(z₂)\n(b) z₁ · conj(z₁) = |z₁|²",
        correctAnswer: "Proved: (a) LHS = RHS = 7 + 4i; (b) z₁ · conj(z₁) = |z₁|² = 100",
        paperIIData: {
          betterResponse:
            "Part (a): Verify conj(z₁ + z₂) = conj(z₁) + conj(z₂):\nLHS: z₁ + z₂ = (6 - 8i) + (1 + 4i) = 7 - 4i ⟹ conj(z₁ + z₂) = 7 + 4i\nRHS: conj(z₁) = 6 + 8i, conj(z₂) = 1 - 4i ⟹ conj(z₁) + conj(z₂) = (6 + 1) + (8 - 4)i = 7 + 4i\nLHS = RHS = 7 + 4i (Verified).\n\nPart (b): Verify z₁ · conj(z₁) = |z₁|²:\nLHS: z₁ · conj(z₁) = (6 - 8i)(6 + 8i) = 6² - (8i)² = 36 - 64(-1) = 36 + 64 = 100\nRHS: |z₁| = √(6² + (-8)²) = √(36 + 64) = √100 = 10 ⟹ |z₁|² = 10² = 100\nLHS = RHS = 100 (Proved).",
          weakerResponse:
            "Student miscalculates modulus or squares incorrectly.",
          markingNotes:
            "• 2 marks for Part (a): 1 mark for LHS, 1 mark for RHS.\n• 3 marks for Part (b): 1.5 marks for product 100, 1.5 marks for modulus squared 100."
        }
      },

      // 7. Multiplicative Inverse (Q14, Q15)
      {
        id: randomUUID(),
        questionNumber: 14,
        questionPart: "CRQ",
        questionType: "CRQ",
        marks: 4,
        chapterName: CHAPTER_NAME,
        chapterId: CHAPTER_ID,
        imageUrl: null,
        questionText: "Find the multiplicative inverse of the complex number z = 8 - 3i and write it in the form a + ib.",
        correctAnswer: "8/73 + (3/73)i",
        paperIIData: {
          betterResponse:
            "Step 1: Multiplicative inverse definition:\nz⁻¹ = 1 / (8 - 3i)\n\nStep 2: Multiply by conjugate (8 + 3i):\nz⁻¹ = (8 + 3i) / [(8 - 3i)(8 + 3i)]\n\nStep 3: Calculate denominator:\n8² - (3i)² = 64 - 9(-1) = 64 + 9 = 73\n\nStep 4: Standard form:\nz⁻¹ = (8 + 3i) / 73 = 8/73 + (3/73)i.",
          weakerResponse:
            "Student computes denominator as 64 - 9 = 55.",
          markingNotes:
            "• 1 mark for reciprocal 1 / (8 - 3i).\n• 1 mark for conjugate multiplication.\n• 1 mark for denominator 73.\n• 1 mark for answer 8/73 + (3/73)i."
        }
      },
      {
        id: randomUUID(),
        questionNumber: 15,
        questionPart: "CRQ",
        questionType: "CRQ",
        marks: 3,
        chapterName: CHAPTER_NAME,
        chapterId: CHAPTER_ID,
        imageUrl: null,
        questionText: "Find the multiplicative inverse of the following fractional complex number:\n\nz = 4 / (5 - 3i)",
        correctAnswer: "5/4 - (3/4)i",
        paperIIData: {
          betterResponse:
            "Step 1: Take the reciprocal of the fraction:\nz⁻¹ = 1 / z = (5 - 3i) / 4\n\nStep 2: Separate real and imaginary parts:\n(5 - 3i) / 4 = 5/4 - (3/4)i.",
          weakerResponse:
            "Student inverts incorrectly.",
          markingNotes:
            "• 1.5 marks for reciprocal operation (5 - 3i) / 4.\n• 1.5 marks for standard form 5/4 - (3/4)i."
        }
      }
    ];
  }
}

async function run() {
  const client = await pool.connect();
  try {
    const sets = ["A", "B", "C", "D"];
    const createdPapers = [];

    for (const s of sets) {
      const title = `Complex Numbers Alpha - Set ${s}`;
      const questions = buildQuestionsForSet(s);
      const totalMarks = questions.reduce((sum, q) => sum + q.marks, 0);
      const totalQuestions = questions.length;
      const questionIds = questions.map((q) => q.id);
      const description = `Classroom Practice Test for Chapter 17: Complex Numbers (Paper 2, Set ${s}). Covers powers of iota, equality of complex numbers, addition, subtraction, division, algebraic properties of conjugates/moduli, and multiplicative inverse. Total Marks: ${totalMarks}.`;

      console.log(`Creating/updating ${title} with ${totalQuestions} questions, ${totalMarks} marks...`);

      // Check if paper with this title already exists in classroom
      const checkRes = await client.query(
        `SELECT id FROM teacher_papers WHERE classroom_id = $1 AND title = $2`,
        [CLASSROOM_ID, title]
      );

      let paperId;
      if (checkRes.rows.length > 0) {
        paperId = checkRes.rows[0].id;
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
            paperId,
          ]
        );
        console.log(`Updated existing paper ${title} (ID: ${paperId})`);
      } else {
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
            totalQuestions,
          ]
        );
        paperId = insertRes.rows[0].id;
        console.log(`Inserted new paper ${title} (ID: ${paperId})`);
      }

      createdPapers.push({ set: s, title, id: paperId, marks: totalMarks, questions: totalQuestions });
    }

    console.log("\n=== ALL 4 SETS SUCCESSFULLY SAVED TO DATABASE ===");
    console.table(createdPapers);
  } catch (err) {
    console.error("Error creating papers:", err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

run();
