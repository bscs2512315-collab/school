const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function insertEx11() {
  const chapterId = 'b735c589-1e3b-4fd1-ad08-4ca8ab2ac212';
  const curriculumId = '569225d4-ff0d-4c95-a4ac-af7047da4d04';

  // Delete existing if any
  await pool.query(`
    DELETE FROM solved_exercises
    WHERE curriculum_id = $1 AND chapter_number = 1 AND exercise_number = 'Exercise 1.1';
  `, [curriculumId]);

  const sections = [
    {
      questionNumber: 'Q.1',
      questionText: 'Simplify the following powers of $i$ (iota):',
      parts: [
        {
          partNumber: 'i',
          partText: 'Evaluate $i^{101}$',
          solution: 'Express in terms of $i^4 = 1$:\n$$i^{101} = (i^4)^{25} \\cdot i = (1)^{25} \\cdot i = 1 \\cdot i = i$$\n**Answer:** $i$',
          explanation: 'Since $i^4 = 1$, divide the exponent 101 by 4 (quotient 25, remainder 1).'
        },
        {
          partNumber: 'ii',
          partText: 'Evaluate $(-i)^{50}$',
          solution: '$$(-i)^{50} = (-1)^{50} \\cdot i^{50} = 1 \\cdot (i^2)^{25} = (-1)^{25} = -1$$\n**Answer:** $-1$',
          explanation: 'Even power makes the negative sign positive, then use $i^2 = -1$.'
        },
        {
          partNumber: 'iii',
          partText: 'Evaluate $i^{-3}$',
          solution: '$$i^{-3} = \\frac{1}{i^3} = \\frac{1}{-i} = \\frac{1}{-i} \\times \\frac{i}{i} = \\frac{i}{-i^2} = \\frac{i}{-(-1)} = i$$\n**Answer:** $i$',
          explanation: 'Multiply numerator and denominator by $i$ to eliminate $i$ from the denominator.'
        },
        {
          partNumber: 'iv',
          partText: 'Evaluate $(-\\sqrt{-1})^{4n+3}$ where $n \\in \\mathbb{N}$',
          solution: 'Since $\\sqrt{-1} = i$:\n$$(-\\sqrt{-1})^{4n+3} = (-i)^{4n+3} = (-i)^{4n} \\cdot (-i)^3 = [(-i)^4]^n \\cdot (-i^3) = (1)^n \\cdot (-(-i)) = 1 \\cdot i = i$$\n**Answer:** $i$',
          explanation: '$(-i)^4 = 1$ for any integer exponent $n$.'
        }
      ]
    },
    {
      questionNumber: 'Q.2',
      questionText: 'Find the Real part $\\text{Re}(z)$ and Imaginary part $\\text{Im}(z)$ of each complex number:',
      parts: [
        {
          partNumber: 'i',
          partText: '$z = \\frac{1}{2 + 3i}$',
          solution: 'Multiply numerator and denominator by the complex conjugate $(2 - 3i)$:\n$$z = \\frac{1}{2 + 3i} \\times \\frac{2 - 3i}{2 - 3i} = \\frac{2 - 3i}{2^2 + 3^2} = \\frac{2 - 3i}{4 + 9} = \\frac{2 - 3i}{13} = \\frac{2}{13} - \\frac{3}{13}i$$\n$$\\text{Re}(z) = \\frac{2}{13}, \\quad \\text{Im}(z) = -\\frac{3}{13}$$',
          explanation: 'Standard form requires a real denominator by multiplying with the complex conjugate.'
        },
        {
          partNumber: 'ii',
          partText: '$z = \\frac{(1 + i)^2}{1 - i}$',
          solution: 'Expand the numerator:\n$$(1 + i)^2 = 1 + 2i + i^2 = 1 + 2i - 1 = 2i$$\nNow rationalize the fraction:\n$$z = \\frac{2i}{1 - i} \\times \\frac{1 + i}{1 + i} = \\frac{2i(1 + i)}{1^2 + 1^2} = \\frac{2i + 2i^2}{2} = \\frac{2i - 2}{2} = -1 + i$$\n$$\\text{Re}(z) = -1, \\quad \\text{Im}(z) = 1$$',
          explanation: 'First expand algebraic squares before rationalizing the denominator.'
        }
      ]
    },
    {
      questionNumber: 'Q.3',
      questionText: 'Find the complex conjugate $\\bar{z}$ and modulus $|z|$ of each complex number:',
      parts: [
        {
          partNumber: 'i',
          partText: '$z = -3 + 4i$',
          solution: 'Conjugate $\\bar{z}$ is obtained by changing the sign of the imaginary part:\n$$\\bar{z} = -3 - 4i$$\nModulus $|z| = \\sqrt{a^2 + b^2}$:\n$$|z| = \\sqrt{(-3)^2 + 4^2} = \\sqrt{9 + 16} = \\sqrt{25} = 5$$',
          explanation: 'Modulus is the distance from the origin in the complex plane and is always non-negative.'
        },
        {
          partNumber: 'ii',
          partText: '$z = \\frac{\\bar{z}}{2} \\text{ or } z = 15 - 3i$',
          solution: 'For $z = 15 - 3i$:\n$$\\bar{z} = 15 + 3i$$\nModulus:\n$$|z| = \\sqrt{15^2 + (-3)^2} = \\sqrt{225 + 9} = \\sqrt{234} = 3\\sqrt{26}$$\n\nRatio with conjugate:\n$$\\frac{\\bar{z}}{z} = \\frac{15 + 3i}{15 - 3i} = \\frac{5 + i}{5 - i} = \\frac{(5 + i)^2}{5^2 + 1^2} = \\frac{24 + 10i}{26} = \\frac{12}{13} + \\frac{5}{13}i$$',
          explanation: 'Conjugate of $a - ib$ is $a + ib$.'
        }
      ]
    },
    {
      questionNumber: 'Q.4',
      questionText: 'Verify the properties of complex conjugates for the given numbers:',
      parts: [
        {
          partNumber: 'i',
          partText: 'Verify $\\overline{z_1 + z_2} = \\bar{z_1} + \\bar{z_2}$ for $z_1 = 2 + 3i$ and $z_2 = 1 - i$',
          solution: '**L.H.S:**\n$$z_1 + z_2 = (2 + 3i) + (1 - i) = (2 + 1) + (3 - 1)i = 3 + 2i$$\n$$\\overline{z_1 + z_2} = 3 - 2i$$\n\n**R.H.S:**\n$$\\bar{z_1} = 2 - 3i, \\quad \\bar{z_2} = 1 + i$$\n$$\\bar{z_1} + \\bar{z_2} = (2 - 3i) + (1 + i) = (2 + 1) + (-3 + 1)i = 3 - 2i$$\n\nSince $\\text{L.H.S} = \\text{R.H.S} = 3 - 2i$, the property is verified.',
          explanation: 'The conjugate of a sum is equal to the sum of the conjugates.'
        },
        {
          partNumber: 'ii',
          partText: 'Verify $\\overline{z_1 \\cdot z_2} = \\bar{z_1} \\cdot \\bar{z_2}$ for $z_1 = -10 + 5i$ and $z_2 = 5 - 10i$',
          solution: '**L.H.S:**\n$$z_1 \\cdot z_2 = (-10 + 5i)(5 - 10i) = -50 + 100i + 25i - 50i^2$$\n$$= -50 + 125i - 50(-1) = -50 + 125i + 50 = 125i$$\n$$\\overline{z_1 \\cdot z_2} = -125i$$\n\n**R.H.S:**\n$$\\bar{z_1} = -10 - 5i, \\quad \\bar{z_2} = 5 + 10i$$\n$$\\bar{z_1} \\cdot \\bar{z_2} = (-10 - 5i)(5 + 10i) = -50 - 100i - 25i - 50i^2$$\n$$= -50 - 125i - 50(-1) = -50 - 125i + 50 = -125i$$\n\nSince $\\text{L.H.S} = \\text{R.H.S} = -125i$, the property is verified.',
          explanation: 'The conjugate of a product is equal to the product of the conjugates.'
        }
      ]
    },
    {
      questionNumber: 'Q.5',
      questionText: 'Solve the following simultaneous equations for complex numbers $z$ and $w$:',
      parts: [
        {
          partNumber: 'i',
          partText: 'Solve: $3z + (2+i)w = 11 - i \\dots (1)$ and $(2-i)z - w = -1 + i \\dots (2)$',
          solution: 'From equation (2), express $w$ in terms of $z$:\n$$w = (2 - i)z - (-1 + i) = (2 - i)z + 1 - i \\dots (3)$$\n\nSubstitute equation (3) into equation (1):\n$$3z + (2 + i)[(2 - i)z + 1 - i] = 11 - i$$\n$$3z + (2 + i)(2 - i)z + (2 + i)(1 - i) = 11 - i$$\n\nSince $(2 + i)(2 - i) = 2^2 + 1^2 = 5$ and $(2 + i)(1 - i) = 2 - 2i + i - i^2 = 2 - i - (-1) = 3 - i$:\n$$3z + 5z + 3 - i = 11 - i$$\n$$8z + 3 - i = 11 - i$$\n$$8z = (11 - i) - (3 - i) = 8$$\n$$\\boxed{z = 1}$$\n\nNow substitute $z = 1$ back into equation (3):\n$$w = (2 - i)(1) + 1 - i = 2 - i + 1 - i$$\n$$\\boxed{w = 3 - 2i}$$\n\n**Solution Set:** $z = 1, \\quad w = 3 - 2i$',
          explanation: 'Solve by substitution method: express $w$ from the second linear equation and substitute into the first.'
        }
      ]
    }
  ];

  const markdown = `### Chapter 1: Complex Numbers — Exercise 1.1 Summary & Core Theory

- **Definition of Complex Numbers:** Any number of the form $z = a + ib$, where $a, b \\in \\mathbb{R}$ and $i = \\sqrt{-1}$ ($i^2 = -1$).
  - $a = \\text{Re}(z)$ is the **Real Part**.
  - $b = \\text{Im}(z)$ is the **Imaginary Part**.
- **Complex Conjugate:** If $z = a + ib$, its conjugate is $\\bar{z} = a - ib$.
  - $\\overline{z_1 + z_2} = \\bar{z_1} + \\bar{z_2}$
  - $\\overline{z_1 \\cdot z_2} = \\bar{z_1} \\cdot \\bar{z_2}$
  - $\\overline{\\left(\\frac{z_1}{z_2}\\right)} = \\frac{\\bar{z_1}}{\\bar{z_2}}$
  - $z \\cdot \\bar{z} = a^2 + b^2 = |z|^2$
- **Modulus (Absolute Value):** $|z| = \\sqrt{a^2 + b^2} \\ge 0$.
- **Fundamental Operations:**
  - Addition: $(a + ib) + (c + id) = (a + c) + i(b + d)$
  - Multiplication: $(a + ib)(c + id) = (ac - bd) + i(ad + bc)$
  - Division: $\\frac{a + ib}{c + id} = \\frac{(a + ib)(c - id)}{c^2 + d^2} = \\frac{ac + bd}{c^2 + d^2} + i\\frac{bc - ad}{c^2 + d^2}$`;

  const insRes = await pool.query(`
    INSERT INTO solved_exercises (
      chapter_id, curriculum_id, board, class, subject, chapter_number,
      exercise_number, title, page_count, image_urls, thumbnail_url,
      solution_video_url, source_credit, is_published, content_markdown,
      sections, created_at, updated_at
    ) VALUES (
      $1, $2, 'Sindh Board', 'XI', 'Mathematics', 1,
      'Exercise 1.1', 'Complex Numbers - Exercise 1.1', 5, '{}', '',
      '', 'ExBoard AI Official Sindh Textbook Board Edition', true, $3,
      $4::jsonb, NOW(), NOW()
    ) RETURNING id, title;
  `, [chapterId, curriculumId, markdown, JSON.stringify(sections)]);

  console.log('✓ Successfully inserted:', insRes.rows[0]);
  await pool.end();
}

insertEx11().catch(err => {
  console.error('Error inserting Ex 1.1:', err);
  process.exit(1);
});
