const { Pool } = require("pg");
const { randomUUID } = require("crypto");
require("dotenv").config({ path: "/Users/muhammadtahatalib/Projects/ExBoardAI/.env" });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

const TEACHER_ID = "f69fd798-8a66-44a5-8634-3abcd82c04f0";
const CLASSROOM_ID = `${TEACHER_ID}__Mathematics__IX__private`;

const questions = [
  {
    id: randomUUID(),
    questionNumber: 1,
    questionPart: "CRQ",
    questionType: "CRQ",
    marks: 3,
    chapterName: "Variations",
    chapterId: null,
    imageUrl: null,
    mcqOptions: null,
    questionText: "Find the mean proportional between 8 and 18.",
    correctAnswer: "12",
    paperIIData: {
      markingNotes: "• 1 mark for setting up continued proportion 8 : x :: x : 18.\n• 1 mark for equating product of extremes and means: x² = 8 × 18 = 144.\n• 1 mark for finding square root x = 12.",
      betterResponse: "Let the mean proportional be x.\nThen 8 : x :: x : 18\nProduct of Extremes = Product of Means\n8 × 18 = x × x\nx² = 144\nTaking square root on both sides:\nx = √144 = 12\n\nThe mean proportional is 12.",
      weakerResponse: "Student calculates arithmetic mean (8+18)/2 = 13 instead of geometric/mean proportional."
    }
  },
  {
    id: randomUUID(),
    questionNumber: 2,
    questionPart: "CRQ",
    questionType: "CRQ",
    marks: 3,
    chapterName: "Variations",
    chapterId: null,
    imageUrl: null,
    mcqOptions: null,
    questionText: "Find the fourth proportional to 8, 4, and 2.",
    correctAnswer: "1",
    paperIIData: {
      markingNotes: "• 1 mark for setting up proportion 8 : 4 :: 2 : x.\n• 1 mark for applying Product of Extremes = Product of Means: 8x = 4 × 2 = 8.\n• 1 mark for finding x = 1.",
      betterResponse: "Let x be the fourth proportional.\n8 : 4 :: 2 : x\nProduct of Extremes = Product of Means\n8 × x = 4 × 2\n8x = 8\nx = 8 / 8 = 1\n\nThe fourth proportional is 1.",
      weakerResponse: "Student writes proportion with incorrect position of terms."
    }
  },
  {
    id: randomUUID(),
    questionNumber: 3,
    questionPart: "CRQ",
    questionType: "CRQ",
    marks: 4,
    chapterName: "Variations",
    chapterId: null,
    imageUrl: null,
    mcqOptions: null,
    questionText: "Find the fourth proportional to:\n\na³ + b³, a² - b², a² - ab + b²",
    correctAnswer: "a - b",
    paperIIData: {
      markingNotes: "• 1 mark for setting up proportion: (a³ + b³) : (a² - b²) :: (a² - ab + b²) : x.\n• 1 mark for equating product of extremes and means: x(a³ + b³) = (a² - b²)(a² - ab + b²).\n• 1 mark for factoring a³ + b³ = (a + b)(a² - ab + b²) and a² - b² = (a + b)(a - b).\n• 1 mark for simplifying to get x = a - b.",
      betterResponse: "Let x be the fourth proportional.\n(a³ + b³) : (a² - b²) :: (a² - ab + b²) : x\nProduct of Extremes = Product of Means\nx(a³ + b³) = (a² - b²)(a² - ab + b²)\nx = [(a² - b²)(a² - ab + b²)] / (a³ + b³)\n\nApplying algebraic formulas:\na² - b² = (a + b)(a - b)\na³ + b³ = (a + b)(a² - ab + b²)\n\nx = [(a + b)(a - b)(a² - ab + b²)] / [(a + b)(a² - ab + b²)]\nx = a - b\n\nThe fourth proportional is (a - b).",
      weakerResponse: "Student expands brackets instead of factoring and cancels terms incorrectly."
    }
  },
  {
    id: randomUUID(),
    questionNumber: 4,
    questionPart: "CRQ",
    questionType: "CRQ",
    marks: 4,
    chapterName: "Variations",
    chapterId: null,
    imageUrl: null,
    mcqOptions: null,
    questionText: "Find the value of x in the proportion:\n\n(2x + 5) : 5 = (3x - 2) : 7",
    correctAnswer: "x = 45",
    paperIIData: {
      markingNotes: "• 1 mark for cross-multiplying: 7(2x + 5) = 5(3x - 2).\n• 1 mark for expanding: 14x + 35 = 15x - 10.\n• 1 mark for grouping terms: 35 + 10 = 15x - 14x.\n• 1 mark for obtaining x = 45.",
      betterResponse: "(2x + 5) : 5 :: (3x - 2) : 7\nProduct of Extremes = Product of Means\n7(2x + 5) = 5(3x - 2)\n14x + 35 = 15x - 10\n35 + 10 = 15x - 14x\n45 = x\nx = 45\n\nThe value of x is 45.",
      weakerResponse: "Student makes sign error when shifting negative 10 across the equals sign."
    }
  },
  {
    id: randomUUID(),
    questionNumber: 5,
    questionPart: "CRQ",
    questionType: "CRQ",
    marks: 4,
    chapterName: "Variations",
    chapterId: null,
    imageUrl: null,
    mcqOptions: null,
    questionText: "Find the value of x in the following proportion:\n\n(11 - x) : (8 - x) :: (25 - x) : (16 - x)",
    correctAnswer: "x = 4",
    paperIIData: {
      markingNotes: "• 1 mark for applying Product of Extremes = Product of Means: (11 - x)(16 - x) = (8 - x)(25 - x).\n• 1 mark for expanding both sides: 176 - 27x + x² = 200 - 33x + x².\n• 1 mark for cancelling x² and collecting linear terms: 33x - 27x = 200 - 176 ⇒ 6x = 24.\n• 1 mark for obtaining x = 4.",
      betterResponse: "Product of Extremes = Product of Means\n(11 - x)(16 - x) = (8 - x)(25 - x)\n176 - 11x - 16x + x² = 200 - 8x - 25x + x²\n176 - 27x + x² = 200 - 33x + x²\nSubtracting x² from both sides:\n176 - 27x = 200 - 33x\n33x - 27x = 200 - 176\n6x = 24\nx = 24 / 6 = 4\n\nThe value of x is 4.",
      weakerResponse: "Student forgets to square binomials accurately or miscalculates product of constants 11×16."
    }
  },
  {
    id: randomUUID(),
    questionNumber: 6,
    questionPart: "CRQ",
    questionType: "CRQ",
    marks: 4,
    chapterName: "Variations",
    chapterId: null,
    imageUrl: null,
    mcqOptions: null,
    questionText: "If a : b = 5 : 8, find the value of the ratio:\n\n(3a + 4b) : (5a + 7b)",
    correctAnswer: "47 : 81",
    paperIIData: {
      markingNotes: "• 1 mark for stating a/b = 5/8.\n• 1 mark for dividing numerator and denominator of expression by b: [3(a/b) + 4] / [5(a/b) + 7].\n• 1 mark for substitution: [3(5/8) + 4] / [5(5/8) + 7] = (47/8) / (81/8).\n• 1 mark for simplifying to 47/81 or 47 : 81.",
      betterResponse: "Given: a : b = 5 : 8 ⇒ a/b = 5/8\n\nTo find: (3a + 4b) / (5a + 7b)\nDividing both numerator and denominator by b:\n= [3(a/b) + 4] / [5(a/b) + 7]\n= [3(5/8) + 4] / [5(5/8) + 7]\n= [15/8 + 4] / [25/8 + 7]\n= [(15 + 32)/8] / [(25 + 56)/8]\n= (47/8) / (81/8)\n= 47 / 81\n\nTherefore, (3a + 4b) : (5a + 7b) = 47 : 81.",
      weakerResponse: "Student assumes a=5, b=8 without stating proportionality constant or dividing by b."
    }
  },
  {
    id: randomUUID(),
    questionNumber: 7,
    questionPart: "CRQ",
    questionType: "CRQ",
    marks: 3,
    chapterName: "Variations",
    chapterId: null,
    imageUrl: null,
    mcqOptions: null,
    questionText: "If 5(4x - 2y) = 3x - 4y, find the ratio x : y.",
    correctAnswer: "x : y = 6 : 17",
    paperIIData: {
      markingNotes: "• 1 mark for expanding LHS: 20x - 10y = 3x - 4y.\n• 1 mark for rearranging terms: 20x - 3x = 10y - 4y ⇒ 17x = 6y.\n• 1 mark for finding x/y = 6/17 ⇒ x : y = 6 : 17.",
      betterResponse: "5(4x - 2y) = 3x - 4y\n20x - 10y = 3x - 4y\n20x - 3x = -4y + 10y\n17x = 6y\nx / y = 6 / 17\nx : y = 6 : 17\n\nHence, the ratio x : y is 6 : 17.",
      weakerResponse: "Student inverts the ratio and writes 17 : 6 instead of 6 : 17."
    }
  },
  {
    id: randomUUID(),
    questionNumber: 8,
    questionPart: "CRQ",
    questionType: "CRQ",
    marks: 3,
    chapterName: "Variations",
    chapterId: null,
    imageUrl: null,
    mcqOptions: null,
    questionText: "Find the value of 'a' if the ratios (3a + 4) : (2a + 5) and 4 : 3 are equal.",
    correctAnswer: "a = 8",
    paperIIData: {
      markingNotes: "• 1 mark for equating ratios: (3a + 4)/(2a + 5) = 4/3.\n• 1 mark for cross-multiplying: 3(3a + 4) = 4(2a + 5) ⇒ 9a + 12 = 8a + 20.\n• 1 mark for solving 9a - 8a = 20 - 12 ⇒ a = 8.",
      betterResponse: "Given that the ratios are equal:\n(3a + 4) / (2a + 5) = 4 / 3\nCross-multiplying:\n3(3a + 4) = 4(2a + 5)\n9a + 12 = 8a + 20\n9a - 8a = 20 - 12\na = 8\n\nThe value of 'a' is 8.",
      weakerResponse: "Student forgets to multiply entire binomial by 3 or 4."
    }
  },
  {
    id: randomUUID(),
    questionNumber: 9,
    questionPart: "CRQ",
    questionType: "CRQ",
    marks: 4,
    chapterName: "Variations",
    chapterId: null,
    imageUrl: null,
    mcqOptions: null,
    questionText: "Find the third proportional to (x - y) and (x² - y²).",
    correctAnswer: "(x - y)(x + y)²",
    paperIIData: {
      markingNotes: "• 1 mark for setting up continued proportion: (x - y) : (x² - y²) :: (x² - y²) : c.\n• 1 mark for Product of Extremes = Product of Means: c(x - y) = (x² - y²)².\n• 1 mark for factoring (x² - y²) = (x - y)(x + y).\n• 1 mark for finding c = (x - y)(x + y)².",
      betterResponse: "Let c be the third proportional.\nThen:\n(x - y) : (x² - y²) :: (x² - y²) : c\nProduct of Extremes = Product of Means\nc(x - y) = (x² - y²)²\nc = (x² - y²)² / (x - y)\nc = [(x - y)(x + y)]² / (x - y)\nc = [(x - y)²(x + y)²] / (x - y)\nc = (x - y)(x + y)²\n\nThe third proportional is (x - y)(x + y)².",
      weakerResponse: "Student treats third proportional as fourth proportional with only 2 given values."
    }
  },
  {
    id: randomUUID(),
    questionNumber: 10,
    questionPart: "CRQ",
    questionType: "CRQ",
    marks: 4,
    chapterName: "Variations",
    chapterId: null,
    imageUrl: null,
    mcqOptions: null,
    questionText: "Find the mean proportional between (x² - y²) and (x - y)/(x + y).",
    correctAnswer: "±(x - y)",
    paperIIData: {
      markingNotes: "• 1 mark for setting up continued proportion with mean m: (x² - y²) : m :: m : (x - y)/(x + y).\n• 1 mark for equating product of means and extremes: m² = (x² - y²) × [(x - y)/(x + y)].\n• 1 mark for factoring (x² - y²) = (x - y)(x + y) and simplifying: m² = (x - y)².\n• 1 mark for taking square root: m = ±(x - y).",
      betterResponse: "Let m be the mean proportional.\n(x² - y²) : m :: m : (x - y)/(x + y)\nProduct of Means = Product of Extremes\nm² = (x² - y²) × [(x - y)/(x + y)]\nm² = (x - y)(x + y) × [(x - y)/(x + y)]\nm² = (x - y)²\nTaking square root on both sides:\nm = ±√(x - y)²\nm = ±(x - y)\n\nThe mean proportional is ±(x - y).",
      weakerResponse: "Student cancels terms incorrectly in the fraction."
    }
  }
];

async function main() {
  try {
    console.log("Creating Paper 2 for Variations in classroom:", CLASSROOM_ID);

    const totalMarks = questions.reduce((acc, q) => acc + q.marks, 0);
    const totalQuestions = questions.length;
    const title = "Variations · Paper 2 (Sindh Board)";
    const description = "Paper 2 on Variations covering Ratios, Proportions, Mean Proportional, Fourth Proportional, Continued Proportions, and Algebraic Reductions.";

    // Insert into teacher_papers
    const { rows } = await pool.query(
      `INSERT INTO teacher_papers
         (teacher_id, classroom_id, title, description, paper_type, subject, class_level, board,
          chapter_ids, question_ids, questions_snapshot, total_marks, total_questions, due_date, strict_mode, allow_resume)
       VALUES ($1, $2, $3, $4, 'paper2', 'Mathematics', 'IX', 'Sindh Board',
               $5, $6, $7, $8, $9, NULL, true, false)
       RETURNING id, title, total_marks, total_questions, created_at`,
      [
        TEACHER_ID,
        CLASSROOM_ID,
        title,
        description,
        JSON.stringify([]),
        JSON.stringify(questions.map(q => q.id)),
        JSON.stringify(questions),
        totalMarks,
        totalQuestions
      ]
    );

    const createdPaper = rows[0];
    console.log("Successfully created Variations Paper 2!");
    console.log("Paper ID:", createdPaper.id);
    console.log("Title:", createdPaper.title);
    console.log("Total Marks:", createdPaper.total_marks);
    console.log("Total Questions:", createdPaper.total_questions);

  } catch (err) {
    console.error("Error creating paper:", err);
  } finally {
    await pool.end();
  }
}

main();
