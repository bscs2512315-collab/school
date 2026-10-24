import fs from 'fs';
import path from 'path';
import { db } from '../lib/db';
import { uploadToCloudinary } from '../lib/storage/cloudinary';

async function run() {
  const { rows: questions } = await db.query<{
    id: string;
    image_url: string;
    question_number: number;
    past_paper_id: string;
  }>(`
    SELECT id, image_url, question_number, past_paper_id 
    FROM questions 
    WHERE image_url LIKE '/diagrams/%' OR image_url LIKE '/PastPapers/%' OR image_url LIKE 'diagrams/%' OR image_url LIKE 'PastPapers/%'
    ORDER BY question_number
  `);
  console.log('Remaining questions to migrate:', questions.length);

  for (const q of questions) {
    const rawPath = q.image_url.trim();
    const cleanRelative = rawPath.startsWith('/') ? rawPath.slice(1) : rawPath;
    const absolutePath = path.join(process.cwd(), 'public', cleanRelative);

    if (!fs.existsSync(absolutePath)) {
      console.warn('Missing file:', absolutePath);
      continue;
    }

    try {
      const fileBuffer = fs.readFileSync(absolutePath);
      const fileName = path.basename(absolutePath);
      const res = await uploadToCloudinary(fileBuffer, fileName, 'questions');
      await db.query('UPDATE questions SET image_url = $1, updated_at = NOW() WHERE id = $2', [res.url, q.id]);
      console.log(`✅ Q${q.question_number} (${q.id}) -> ${res.url}`);
    } catch (err: any) {
      console.error(`❌ Failed Q${q.question_number}: ${err.message}`);
    }
  }

  const remaining = await db.query(`
    SELECT COUNT(*) as count 
    FROM questions 
    WHERE image_url LIKE '/diagrams/%' OR image_url LIKE '/PastPapers/%' OR image_url LIKE 'diagrams/%' OR image_url LIKE 'PastPapers/%'
  `);
  console.log('Total remaining after pass:', remaining.rows[0].count);
  process.exit(0);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
