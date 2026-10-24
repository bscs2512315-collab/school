const { Pool } = require("pg");
const { randomUUID } = require("crypto");
require("dotenv").config({ path: "/Users/muhammadtahatalib/Projects/ExBoardAI/.env" });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

const TEACHER_ID = "f69fd798-8a66-44a5-8634-3abcd82c04f0";
const CLASSROOM_ID = `${TEACHER_ID}__Mathematics__IX__private`;
const CHAPTER_ID = "14ff9290-1b66-41f5-a02e-f64eec57d795"; // Sets Theory

const questions = [
  {
    id: randomUUID(),
    questionNumber: 1,
    questionPart: "CRQ",
    questionType: "CRQ",
    marks: 4,
    chapterName: "Sets",
    chapterId: CHAPTER_ID,
    imageUrl: null,
    mcqOptions: null,
    questionText: "If the universal set U = {1, 2, 3, ..., 12}, A = {1, 2, 3, 4, 6, 8, 12}, and B = {2, 4, 6, 8}, verify De Morgan's First Law:\n\n(A ∪ B)' = A' ∩ B'",
    correctAnswer: "L.H.S = R.H.S = {5, 7, 9, 10, 11}",
    paperIIData: {
      markingNotes: "• 1 mark for finding A ∪ B = {1, 2, 3, 4, 6, 8, 12} and L.H.S = (A ∪ B)' = U - (A ∪ B) = {5, 7, 9, 10, 11}.\n• 1 mark for finding A' = U - A = {5, 7, 9, 10, 11}.\n• 1 mark for finding B' = U - B = {1, 3, 5, 7, 9, 10, 11, 12}.\n• 1 mark for evaluating R.H.S = A' ∩ B' = {5, 7, 9, 10, 11} and concluding L.H.S = R.H.S.",
      betterResponse: "Taking L.H.S: (A ∪ B)'\nA ∪ B = {1, 2, 3, 4, 6, 8, 12} ∪ {2, 4, 6, 8} = {1, 2, 3, 4, 6, 8, 12}\n(A ∪ B)' = U - (A ∪ B) = {1, 2, 3, ..., 12} - {1, 2, 3, 4, 6, 8, 12}\nL.H.S = {5, 7, 9, 10, 11}\n\nTaking R.H.S: A' ∩ B'\nA' = U - A = {1, 2, 3, ..., 12} - {1, 2, 3, 4, 6, 8, 12} = {5, 7, 9, 10, 11}\nB' = U - B = {1, 2, 3, ..., 12} - {2, 4, 6, 8} = {1, 3, 5, 7, 9, 10, 11, 12}\nA' ∩ B' = {5, 7, 9, 10, 11} ∩ {1, 3, 5, 7, 9, 10, 11, 12}\nR.H.S = {5, 7, 9, 10, 11}\n\nSince L.H.S = R.H.S = {5, 7, 9, 10, 11}, De Morgan's First Law is verified.",
      weakerResponse: "Student incorrectly finds B' or forgets elements when subtracting from the universal set."
    }
  },
  {
    id: randomUUID(),
    questionNumber: 2,
    questionPart: "CRQ",
    questionType: "CRQ",
    marks: 4,
    chapterName: "Sets",
    chapterId: CHAPTER_ID,
    imageUrl: null,
    mcqOptions: null,
    questionText: "Given U = {-3, -2, -1, 0, 1, 2, 3, 4, 5}, P = {-2, 0, 2, 4}, and Q = {2, 3, 5}, verify that:\n\n(P ∪ Q)' = P' ∩ Q'",
    correctAnswer: "L.H.S = R.H.S = {-3, -1, 1}",
    paperIIData: {
      markingNotes: "• 1 mark for finding P ∪ Q = {-2, 0, 2, 3, 4, 5}.\n• 1 mark for finding (P ∪ Q)' = U - (P ∪ Q) = {-3, -1, 1}.\n• 1 mark for calculating P' = {-3, -1, 1, 3, 5} and Q' = {-3, -2, -1, 0, 1, 4}.\n• 1 mark for finding P' ∩ Q' = {-3, -1, 1} and showing L.H.S = R.H.S.",
      betterResponse: "Taking L.H.S: (P ∪ Q)'\nP ∪ Q = {-2, 0, 2, 4} ∪ {2, 3, 5} = {-2, 0, 2, 3, 4, 5}\n(P ∪ Q)' = U - (P ∪ Q) = {-3, -2, -1, 0, 1, 2, 3, 4, 5} - {-2, 0, 2, 3, 4, 5}\nL.H.S = {-3, -1, 1}\n\nTaking R.H.S: P' ∩ Q'\nP' = U - P = {-3, -2, -1, 0, 1, 2, 3, 4, 5} - {-2, 0, 2, 4} = {-3, -1, 1, 3, 5}\nQ' = U - Q = {-3, -2, -1, 0, 1, 2, 3, 4, 5} - {2, 3, 5} = {-3, -2, -1, 0, 1, 4}\nP' ∩ Q' = {-3, -1, 1, 3, 5} ∩ {-3, -2, -1, 0, 1, 4} = {-3, -1, 1}\n\nSince L.H.S = R.H.S = {-3, -1, 1}, verified.",
      weakerResponse: "Student forgets negative integers when taking set complement with respect to U."
    }
  },
  {
    id: randomUUID(),
    questionNumber: 3,
    questionPart: "CRQ",
    questionType: "CRQ",
    marks: 4,
    chapterName: "Sets",
    chapterId: CHAPTER_ID,
    imageUrl: null,
    mcqOptions: null,
    questionText: "For the universal set U = {-3, -2, -1, 0, 1, 2, 3, 4, 5}, P = {-2, 0, 2, 4}, and Q = {2, 3, 5}, prove that:\n\nQ - P = Q ∩ P'",
    correctAnswer: "L.H.S = R.H.S = {3, 5}",
    paperIIData: {
      markingNotes: "• 1 mark for evaluating L.H.S = Q - P = {2, 3, 5} - {-2, 0, 2, 4} = {3, 5}.\n• 1 mark for finding P' = U - P = {-3, -1, 1, 3, 5}.\n• 1 mark for evaluating R.H.S = Q ∩ P' = {2, 3, 5} ∩ {-3, -1, 1, 3, 5} = {3, 5}.\n• 1 mark for stating L.H.S = R.H.S.",
      betterResponse: "Taking L.H.S: Q - P\nQ - P = {2, 3, 5} - {-2, 0, 2, 4}\nRemoving elements common with P: only '2' is removed.\nL.H.S = {3, 5}\n\nTaking R.H.S: Q ∩ P'\nP' = U - P = {-3, -2, -1, 0, 1, 2, 3, 4, 5} - {-2, 0, 2, 4} = {-3, -1, 1, 3, 5}\nQ ∩ P' = {2, 3, 5} ∩ {-3, -1, 1, 3, 5} = {3, 5}\nR.H.S = {3, 5}\n\nThus, L.H.S = R.H.S = {3, 5}. Hence proved.",
      weakerResponse: "Student confuses difference of sets with symmetric difference or intersection."
    }
  },
  {
    id: randomUUID(),
    questionNumber: 4,
    questionPart: "CRQ",
    questionType: "CRQ",
    marks: 3,
    chapterName: "Sets",
    chapterId: CHAPTER_ID,
    imageUrl: null,
    mcqOptions: null,
    questionText: "If A = {1, 2} and B = {2, 3}, find the Cartesian product A × B. State the total number of elements in A × B.",
    correctAnswer: "A × B = {(1, 2), (1, 3), (2, 2), (2, 3)}; Total elements = 4",
    paperIIData: {
      markingNotes: "• 2 marks for correctly listing all 4 ordered pairs in A × B.\n• 1 mark for stating n(A × B) = 4.",
      betterResponse: "A × B = {1, 2} × {2, 3}\n= {(1, 2), (1, 3), (2, 2), (2, 3)}\n\nTotal number of elements:\nn(A × B) = n(A) × n(B) = 2 × 2 = 4.",
      weakerResponse: "Student writes curly brackets around each pair or misses one of the ordered pairs."
    }
  },
  {
    id: randomUUID(),
    questionNumber: 5,
    questionPart: "CRQ",
    questionType: "CRQ",
    marks: 4,
    chapterName: "Sets",
    chapterId: CHAPTER_ID,
    imageUrl: null,
    mcqOptions: null,
    questionText: "If A = {1, 2}, B = {2, 3}, and C = {1, 3, 5}, find:\n\nA × (B ∪ C)",
    correctAnswer: "A × (B ∪ C) = {(1, 1), (1, 2), (1, 3), (1, 5), (2, 1), (2, 2), (2, 3), (2, 5)}",
    paperIIData: {
      markingNotes: "• 1 mark for finding B ∪ C = {1, 2, 3, 5}.\n• 3 marks for forming all 8 ordered pairs correctly.",
      betterResponse: "Step 1: Find (B ∪ C)\nB ∪ C = {2, 3} ∪ {1, 3, 5} = {1, 2, 3, 5}\n\nStep 2: Find A × (B ∪ C)\nA = {1, 2}\nA × (B ∪ C) = {1, 2} × {1, 2, 3, 5}\n= {(1, 1), (1, 2), (1, 3), (1, 5), (2, 1), (2, 2), (2, 3), (2, 5)}\n\nTotal elements = 2 × 4 = 8 ordered pairs.",
      weakerResponse: "Student calculates A × B ∪ C instead of finding (B ∪ C) first."
    }
  },
  {
    id: randomUUID(),
    questionNumber: 6,
    questionPart: "CRQ",
    questionType: "CRQ",
    marks: 4,
    chapterName: "Sets",
    chapterId: CHAPTER_ID,
    imageUrl: null,
    mcqOptions: null,
    questionText: "If A = {1, 2}, B = {2, 3}, and C = {1, 3, 5}, find:\n\n(A ∩ B) × (B ∩ C)",
    correctAnswer: "(A ∩ B) × (B ∩ C) = {(2, 3)}",
    paperIIData: {
      markingNotes: "• 1 mark for finding A ∩ B = {2}.\n• 1 mark for finding B ∩ C = {3}.\n• 2 marks for finding the Cartesian product {(2, 3)}.",
      betterResponse: "Step 1: Find A ∩ B\nA ∩ B = {1, 2} ∩ {2, 3} = {2}\n\nStep 2: Find B ∩ C\nB ∩ C = {2, 3} ∩ {1, 3, 5} = {3}\n\nStep 3: Find (A ∩ B) × (B ∩ C)\n(A ∩ B) × (B ∩ C) = {2} × {3} = {(2, 3)}.",
      weakerResponse: "Student forgets ordered pair notation and writes {2, 3} as a set instead of {(2, 3)}."
    }
  },
  {
    id: randomUUID(),
    questionNumber: 7,
    questionPart: "CRQ",
    questionType: "CRQ",
    marks: 4,
    chapterName: "Sets",
    chapterId: CHAPTER_ID,
    imageUrl: null,
    mcqOptions: null,
    questionText: "If A = {5, 6} and B = {1, 2, 3}:\n(a) Find A × B.\n(b) Write any three distinct binary relations from A to B.",
    correctAnswer: "(a) A × B = {(5, 1), (5, 2), (5, 3), (6, 1), (6, 2), (6, 3)}; (b) Any 3 subsets of A × B e.g. R₁={(5, 2), (5, 3)}, R₂={(5, 1), (5, 3)}, R₃={(6, 2)}",
    paperIIData: {
      markingNotes: "• 1 mark for listing A × B = {(5, 1), (5, 2), (5, 3), (6, 1), (6, 2), (6, 3)}.\n• 3 marks (1 mark each) for writing 3 distinct valid non-empty subsets of A × B as binary relations.",
      betterResponse: "(a) Cartesian Product A × B:\nA × B = {5, 6} × {1, 2, 3}\n= {(5, 1), (5, 2), (5, 3), (6, 1), (6, 2), (6, 3)}\n\n(b) Three binary relations in A × B:\nR₁ = {(5, 2), (5, 3)}\nR₂ = {(5, 1), (5, 3)}\nR₃ = {(6, 2)}",
      weakerResponse: "Student writes ordered pairs containing elements not in A × B (e.g., from B × A)."
    }
  },
  {
    id: randomUUID(),
    questionNumber: 8,
    questionPart: "CRQ",
    questionType: "CRQ",
    marks: 4,
    chapterName: "Sets",
    chapterId: CHAPTER_ID,
    imageUrl: null,
    mcqOptions: null,
    questionText: "If A = {5, 6} and B = {1, 2, 3}:\n(a) Find B × A.\n(b) Write any four distinct binary relations from B to A.",
    correctAnswer: "(a) B × A = {(1, 5), (1, 6), (2, 5), (2, 6), (3, 5), (3, 6)}; (b) Any 4 subsets of B × A e.g. R₁={(2, 5)}, R₂={(3, 5)}, R₃={(2, 5), (3, 5)}, R₄={(1, 5), (3, 5), (3, 6)}",
    paperIIData: {
      markingNotes: "• 1 mark for finding B × A = {(1, 5), (1, 6), (2, 5), (2, 6), (3, 5), (3, 6)}.\n• 3 marks for writing 4 distinct valid subsets of B × A.",
      betterResponse: "(a) Cartesian Product B × A:\nB × A = {1, 2, 3} × {5, 6}\n= {(1, 5), (1, 6), (2, 5), (2, 6), (3, 5), (3, 6)}\n\n(b) Four binary relations in B × A:\nR₁ = {(2, 5)}\nR₂ = {(3, 5)}\nR₃ = {(2, 5), (3, 5)}\nR₄ = {(1, 5), (3, 5), (3, 6)}",
      weakerResponse: "Student reverses the order of coordinates, confusing B × A with A × B."
    }
  },
  {
    id: randomUUID(),
    questionNumber: 9,
    questionPart: "CRQ",
    questionType: "CRQ",
    marks: 3,
    chapterName: "Sets",
    chapterId: CHAPTER_ID,
    imageUrl: null,
    mcqOptions: null,
    questionText: "Find the values of x and y from the equality of ordered pairs:\n\n(x - 5, 10) = (11, y - 7)",
    correctAnswer: "x = 16, y = 17",
    paperIIData: {
      markingNotes: "• 1 mark for equating corresponding elements: x - 5 = 11 and y - 7 = 10.\n• 1 mark for solving x = 11 + 5 = 16.\n• 1 mark for solving y = 10 + 7 = 17.",
      betterResponse: "By equality of ordered pairs (a, b) = (c, d) ⇔ a = c and b = d:\n\nEquating first components:\nx - 5 = 11\nx = 11 + 5\nx = 16\n\nEquating second components:\n10 = y - 7\ny = 10 + 7\ny = 17\n\nTherefore, x = 16 and y = 17.",
      weakerResponse: "Student swaps the equations or makes sign errors when isolating variables."
    }
  },
  {
    id: randomUUID(),
    questionNumber: 10,
    questionPart: "CRQ",
    questionType: "CRQ",
    marks: 4,
    chapterName: "Sets",
    chapterId: CHAPTER_ID,
    imageUrl: null,
    mcqOptions: null,
    questionText: "Find the values of x and y from the equality of ordered pairs:\n\n(5x + 8, 5y - 4) = (3x + 10, 2y + 2)",
    correctAnswer: "x = 1, y = 2",
    paperIIData: {
      markingNotes: "• 1 mark for setting up equations: 5x + 8 = 3x + 10 and 5y - 4 = 2y + 2.\n• 1.5 marks for solving 5x - 3x = 10 - 8 ⇒ 2x = 2 ⇒ x = 1.\n• 1.5 marks for solving 5y - 2y = 2 + 4 ⇒ 3y = 6 ⇒ y = 2.",
      betterResponse: "Equating corresponding components of the ordered pairs:\n\n1) For x:\n5x + 8 = 3x + 10\n5x - 3x = 10 - 8\n2x = 2\nx = 1\n\n2) For y:\n5y - 4 = 2y + 2\n5y - 2y = 2 + 4\n3y = 6\ny = 2\n\nHence, the values are x = 1 and y = 2.",
      weakerResponse: "Student mixes terms containing x and y together instead of solving two separate linear equations."
    }
  }
];

async function main() {
  try {
    console.log("Creating Paper 2 for Sets in classroom:", CLASSROOM_ID);

    const totalMarks = questions.reduce((acc, q) => acc + q.marks, 0);
    const totalQuestions = questions.length;
    const title = "Sets Theory · Paper 2 (Sindh Board)";
    const description = "Paper 2 on Sets covering De Morgan's Laws, Set Differences, Cartesian Products, Binary Relations, and Equality of Ordered Pairs.";

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
        JSON.stringify([CHAPTER_ID]),
        JSON.stringify(questions.map(q => q.id)),
        JSON.stringify(questions),
        totalMarks,
        totalQuestions
      ]
    );

    const createdPaper = rows[0];
    console.log("Successfully created Paper 2!");
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
