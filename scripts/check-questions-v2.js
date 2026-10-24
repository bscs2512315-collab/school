const { Pool } = require("pg");
require("dotenv").config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function checkQuestions() {
  try {
    const papers = await pool.query(
      "SELECT id, subject, year, status FROM past_papers WHERE UPPER(status) = 'COMPLETED' LIMIT 1",
    );
    if (papers.rows.length === 0) {
      console.log("No completed papers found.");
      return;
    }
    const paper = papers.rows[0];
    console.log(`Checking paper: ${paper.subject} ${paper.year} (${paper.id})`);

    const questions = await pool.query(
      "SELECT question_type, mcq_data FROM questions WHERE past_paper_id = $1 LIMIT 5",
      [paper.id],
    );

    questions.rows.forEach((q, i) => {
      console.log(`Question ${i + 1}: Type=${q.question_type}`);
      console.log(
        `MCQ Data:`,
        typeof q.mcq_data === "string"
          ? q.mcq_data
          : JSON.stringify(q.mcq_data),
      );
    });
  } catch (err) {
    console.error("DB Error:", err);
  } finally {
    await pool.end();
  }
}

checkQuestions();
