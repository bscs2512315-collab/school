import fs from 'fs';
import { db } from '../lib/db';

async function update() {
  const q5Url = 'https://res.cloudinary.com/deudkn2gw/image/upload/v1791120863/zentix/questions/1791120862416-q5_diagram.png';
  const q40Url = 'https://res.cloudinary.com/deudkn2gw/image/upload/v1791120866/zentix/questions/1791120864281-q40_diagram.png';

  await db.query('UPDATE questions SET image_url = $1, updated_at = NOW() WHERE id = $2', [
    q5Url,
    'e2bc7a02-358f-4ad4-9f27-588edb18bf95'
  ]);
  console.log('✅ Updated Q5 in DB to:', q5Url);

  await db.query('UPDATE questions SET image_url = $1, updated_at = NOW() WHERE id = $2', [
    q40Url,
    'd39e596d-61d1-4c51-811d-2fe8fc6b0bc0'
  ]);
  console.log('✅ Updated Q40 in DB to:', q40Url);

  fs.copyFileSync('/tmp/clean_q5_diagram.png', 'public/diagrams/physics_xii_2024_p1/q5_diagram.png');
  fs.copyFileSync('/tmp/clean_q40_diagram.png', 'public/diagrams/physics_xii_2024_p1/q40_diagram.png');
  console.log('✅ Copied clean crops to local public/diagrams/ folder');

  process.exit(0);
}

update().catch((err) => {
  console.error(err);
  process.exit(1);
});
