const { Pool } = require("pg");
require("dotenv").config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function checkQuestions() {
  try {
    const papers = await pool.query(
      "SELECT id, subject, year, status FROM past_papers WHERE UPPER(status) = 'COMPLETED' LIMIT 5",
    );
    console.log("Completed Papers:", papers.rows);

    for (const paper of papers.rows) {
      const questionsCount = await pool.query(
        "SELECT count(*) FROM questions WHERE past_paper_id = $1",
        [paper.id],
      );
      console.log(
        `Paper ${paper.id} (${paper.subject} ${paper.year}) has ${questionsCount.rows[0].count} questions`,
      );

      if (parseInt(questionsCount.rows[0].count) > 0) {
        const sampleQuestion = await pool.query(
          "SELECT question_type, mcq_data FROM questions WHERE past_paper_id = $1 LIMIT 1",
          [paper.id],
        );
        console.log(
          "Sample Question Type:",
          sampleQuestion.rows[0].question_type,
        );
        console.log(
          "Sample MCQ Data (first 50 chars):",
          JSON.stringify(sampleQuestion.rows[0].mcq_data).substring(0, 50),
        );
      }
    }
  } catch (err) {
    console.error("DB Error:", err);
  } finally {
    await pool.end();
  }
}

checkQuestions();
