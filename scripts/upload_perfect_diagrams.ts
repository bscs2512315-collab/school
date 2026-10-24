import fs from 'fs';
import { db } from '../lib/db';
import { uploadToCloudinary } from '../lib/storage/cloudinary';

async function main() {
  console.log('Uploading perfect Q5 diagram...');
  const buf5 = fs.readFileSync('/tmp/perfect_q5_diagram.png');
  const res5 = await uploadToCloudinary(buf5, 'q5_diagram_clean.png', 'questions');
  console.log('✅ Q5 Cloudinary URL:', res5.url);

  console.log('Uploading perfect Q40 diagram...');
  const buf40 = fs.readFileSync('/tmp/perfect_q40_diagram.png');
  const res40 = await uploadToCloudinary(buf40, 'q40_diagram_clean.png', 'questions');
  console.log('✅ Q40 Cloudinary URL:', res40.url);

  // Update Database
  await db.query('UPDATE questions SET image_url = $1, updated_at = NOW() WHERE id = $2', [
    res5.url,
    'e2bc7a02-358f-4ad4-9f27-588edb18bf95'
  ]);
  console.log('✅ Updated Q5 in database');

  await db.query('UPDATE questions SET image_url = $1, updated_at = NOW() WHERE id = $2', [
    res40.url,
    'd39e596d-61d1-4c51-811d-2fe8fc6b0bc0'
  ]);
  console.log('✅ Updated Q40 in database');

  // Copy locally
  fs.copyFileSync('/tmp/perfect_q5_diagram.png', 'public/diagrams/physics_xii_2024_p1/q5_diagram.png');
  fs.copyFileSync('/tmp/perfect_q40_diagram.png', 'public/diagrams/physics_xii_2024_p1/q40_diagram.png');
  console.log('✅ Saved clean local copies to public/diagrams/physics_xii_2024_p1/');

  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
