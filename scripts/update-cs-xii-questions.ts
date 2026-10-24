import { db } from '../lib/db';

async function main() {
  await db.query(
    'UPDATE questions SET question_text = $1, updated_at = NOW() WHERE id = $2',
    [
      'Which of the following classes are related to C++ file handling with respect to output operations?\n\nI. ofstream\n\nII. ifstream\n\nIII. fstream',
      'd39bc3d7-2574-435c-8303-25a658b06c5b',
    ]
  );

  await db.query(
    'UPDATE questions SET question_text = $1, updated_at = NOW() WHERE id = $2',
    [
      'Which of the following is/ are allowed in variable names?\n\nI. Digits (0-9)\n\nII. Underscore (_)\n\nIII. Blank space',
      '02f67cfc-3c54-45a0-b174-d16a872b7264',
    ]
  );

  await db.query(
    'UPDATE questions SET question_text = $1, updated_at = NOW() WHERE id = $2',
    [
      'Consider the given tasks.\n\nI. Design the database\n\nII. Design the flowchart and algorithms\n\nIII. Design the actual user interface screen\n\nIV. Generate the code for dataflow process\n\nThe tasks performed in the development phase of System Development Life Cycle (SDLC) are',
      '9fde57c7-43d3-4924-b148-65c06c5d69cc',
    ]
  );

  await db.query(
    'UPDATE questions SET question_text = $1, updated_at = NOW() WHERE id = $2',
    [
      'Consider the given list of functions.\n\nI. div()\n\nII. add()\n\nIII. sub()\n\nIV. abs()\n\nThe built-in functions in this list are',
      'e1692bde-285a-4436-8858-0ca06926a901',
    ]
  );

  console.log('Successfully updated DB questions!');
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
