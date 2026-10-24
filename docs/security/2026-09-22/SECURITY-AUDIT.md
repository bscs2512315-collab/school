# ExBoardAI security audit

Date: 2026-09-22. Baseline commit: `75591008f35e63fe6076d6263b9a4c743d0964c0`, including the current working tree.

## Executive assessment

**Overall risk: High. Remediate the application flaws below before treating the application as ready for sensitive student data or trusted election results.** The dependency inventory additionally contains critical advisories whose deployment-specific exploitability has not been established.

The most consequential application issues are unsafe HTML rendering, missing object ownership checks, unrestricted server-side URL fetching, an administrator-only shell injection, and unauthenticated consumption of external services. Authentication alone is insufficient: several authenticated routes accept another user's object identifier without proving access to that object.

This is a source-assisted VAPT assessment with isolated local reproductions, not a completed penetration test of the deployed infrastructure. All 157 API route files were inventoried and security-sensitive code paths were reviewed by risk. Local tests use real application functions with mocked DB, authentication, and AI dependencies; they do not prove production data exposure. No production application requests, database changes, email sends, AI calls, credential extraction, load tests, or weaponized dependency exploits were performed. Application code and the user's pre-existing edits were preserved.

## Evidence and method

- [Route inventory](route-inventory.md): all API route files, methods, and direct authentication indicators. This is not a claim that every method received exhaustive manual testing.
- [Local reproduction harness](validate.cjs) and [results](validation-results.json): actual TypeScript functions transpiled into isolated test contexts; unexpected application imports fail closed.
- [Full dependency audit](npm-audit.json): **24 affected packages: 2 critical, 16 high, 6 moderate**.
- [Production dependency audit](npm-audit-production.json): **19 affected packages: 2 critical, 13 high, 4 moderate**.
- Manual inspection covered authentication/recovery, role and object authorization, HTML rendering, SQL construction, uploads, outbound requests, grading/rewards, election integrity, push subscriptions, configuration, and credential patterns.
- Secret checks inspected tracked text files for selected credential formats and checked `.env` tracking/history without displaying values. No matching tracked credentials or `.env` history were found. This was not a comprehensive history-wide secret scan.

Severity is contextual engineering judgment, not an assigned CVSS score. **Reproduced** means a local component/handler demonstrated the behavior; **source-confirmed** means a complete relevant code path was traced; **dependency match** means a known affected version is present, with runtime prerequisites assessed separately.

## Prioritized findings

| ID | Severity | Finding | Evidence level |
|---|---|---|---|
| S01 | High | Stored XSS through the math HTML sanitizer | Local browser + source flow |
| S02 | High | Admin syllabus URL permits shell command substitution | Local shell primitive + source flow |
| S03 | High | Student image URLs permit SSRF and unbounded response buffering | Local loopback reproduction |
| S04 | High | Chat writes do not enforce session ownership | Mocked handler dependency reproduction |
| S05 | High | Unaffiliated teachers can read/grade unrelated unaffiliated students | Mocked grading reproduction + source |
| S06 | Medium | Generated-paper submission ignores paper ownership | Mocked handler reproduction |
| S07 | High | Public AI, speech, and election upload endpoints lack abuse controls | Mocked AI invocation + source |
| S08 | High | Election votes authenticate neither voter identity nor eligibility | Source-confirmed |
| S09 | High | Password reset and logout do not revoke existing JWTs | Source-confirmed |
| S10 | Medium | Login/OTP limits are local to each worker | Isolated-worker reproduction |
| S11 | Medium | Regrading repeatedly awards progress points | Mocked handler reproduction |
| S12 | Medium | Database TLS certificate verification is disabled | Source-confirmed configuration |
| S13 | Medium | Push subscription mutation lacks owner scoping | Source-confirmed |
| S14 | Medium | School-created passwords use non-cryptographic randomness | Source-confirmed |
| S15 | Low | Password-reset responses disclose account existence | Source-confirmed |
| D01 | Critical advisory priority | Vulnerable framework and dependency versions | Registry and vendor advisory matches |

### S01 — Stored XSS in shared question content

**CWE-79.** `lib/utils/math-notation.ts:22` uses regular expressions to sanitize HTML. Its event-attribute expression requires whitespace before `on...`; HTML parsers also accept malformed slash-separated attributes. `convertMathToHTML` returns this sanitizer's output. Custom quiz validation accepts arbitrary question/option strings, and the shared quiz solve page inserts converted content using `dangerouslySetInnerHTML`.

Relevant flow: `lib/custom-quiz.ts` → `app/api/student/custom-quizzes/route.ts` → `app/api/student/custom-quizzes/[id]/share/route.ts` → `app/student/custom-quizzes/[id]/solve/page.tsx:325`. The share handler permits recipients by username without requiring a mutual friendship.

**Safe reproduction:** pass `<img/src="x"/onerror="window.auditMarker=1">` through the real custom quiz validator and `convertMathToHTML`, insert the result into a disconnected browser DOM, and observe `window.auditMarker`. The harness blocks browser network requests and uses only a harmless in-memory marker. This validates the rendering primitive; the cross-account storage/share path was traced in source rather than exercised against a database.

**Impact:** a user viewing a malicious shared quiz can execute attacker-controlled script in the application's origin. `lib/auth-session.ts` stores JWTs in both localStorage and a JavaScript-readable cookie, making session theft possible after script execution. Admin compromise through this exact sharing flow was not demonstrated. No Content-Security-Policy is configured in `next.config.ts`; deployed headers were not inspected.

**Fix:** use a maintained parser-based sanitizer with an explicit minimal tag/attribute allowlist, or render a structured math AST without accepting HTML. Sanitize after all transformations. Remove event handlers, unsafe URLs, embedded documents, SVG/MathML unless deliberately supported, and arbitrary CSS. Move authentication to server-set HttpOnly cookies and implement corresponding CSRF protection. Add CSP as defense in depth.

**Retest:** malformed attributes, entity-encoded URLs, mixed-case tags, nested markup and SVG/MathML inputs must not execute; ordinary formulas and shared quizzes must still render correctly.

### S02 — Administrator URL input reaches a shell

**CWE-78; administrator credentials required.** `app/api/admin/syllabus/auto-extract/route.ts:89` applies `encodeURI(decodeURI(pdfUrl))` and interpolates it inside a double-quoted `execSync` command. URL encoding preserves `$()` shell syntax. An admin can therefore execute commands as the application process, beyond ordinary syllabus administration.

**Safe reproduction:** the harness passes `https://example.invalid/$(auditmarker).pdf` through the same encoding and a local shell with an `auditmarker` function that prints `AUDIT`. The resulting string contains `AUDIT`, proving command substitution. It substitutes `printf` for curl and performs no remote request. The endpoint's admin guard exists; this is not unauthenticated RCE.

The same endpoint also permits arbitrary remote destinations and redirects and invokes curl with `-k`, disabling certificate verification. Protocol/address restrictions, download size limits and a command timeout are absent.

**Fix:** remove shell interpolation. Use a validated bounded HTTP downloader, or `execFile`/`spawn` with an argument array and no shell. Allow only approved HTTPS hosts; reject private/link-local/loopback destinations and revalidate every redirect. Verify TLS, enforce byte/time limits, and run PDF processing in a constrained worker.

**Retest:** command substitution characters must remain inert, redirects to private destinations must fail, and oversized/slow responses must terminate safely.

### S03 — Authenticated SSRF through image generation/chat

**CWE-918, CWE-400.** `app/api/student/chat/generate-from-image/route.ts:16` validates only URL syntax. Its image generation flow calls `lib/ai/vision-image.ts:25`, which runs `fetch(imageUrl)` without a hostname/protocol/IP allowlist and buffers the entire response. The chat endpoint also accepts an image URL reaching this helper. The fallback MIME logic labels even a non-image response as JPEG, rather than rejecting it.

**Safe reproduction:** a temporary HTTP server listens only on `127.0.0.1`; the actual helper retrieves its plain-text marker and returns it as base64 with `image/jpeg`. No private infrastructure or metadata service was contacted.

**Impact:** an authenticated student or teacher can induce server-side requests to reachable internal services; redirects and large/slow responses expand the risk. Responses may be forwarded to the AI provider. Arbitrary secret extraction back to the caller was not demonstrated and depends on downstream processing.

**Fix:** accept an owned upload ID instead of an arbitrary URL; resolve it to a trusted storage object server-side. Otherwise strictly allowlist HTTPS host/path, check resolved IPs and redirects, apply egress controls, timeout and streamed byte limits, and verify decoded image type and dimensions.

**Retest:** loopback, private IPv4/IPv6, link-local, redirects, oversized images and non-image bodies must fail before downstream AI use.

### S04 — Cross-user chat modification and attachment disclosure

**CWE-639/862.** `app/api/student/chat/route.ts:11` accepts a caller-supplied UUID `sessionId`. `lib/ai/bot-chat.ts:169` only creates a session when none was supplied; it does not verify ownership when one is supplied. `insertUserMessage` writes to that session, assistant replies are inserted there, and `updated_at` is modified. Image-paper requests can read prior attachments through `getLatestSessionImageUrl` and return image URLs in actions. In contrast, `getChatMessages` correctly checks both session ID and user ID.

**Reproduction:** use a synthetic attacker user and a victim session ID with a mock DB and a blocked query classification. The actual function inserts both user and assistant messages into the supplied session without an ownership query. No AI is needed to trigger the unauthorized write.

**Precondition:** knowledge of another session UUID; UUID entropy limits discovery but is not authorization.

**Fix:** require `SELECT id FROM chat_sessions WHERE id=$1 AND user_id=$2` before every read/write path; use scoped queries or transactional ownership enforcement. Return 404/403 with no side effects for foreign or missing sessions.

### S05 — Null school IDs bypass teacher authorization

**CWE-863.** `app/api/teacher/grade-paper/route.ts:46` compares `attempt.student_school_id !== teacherSchoolId`; when both are `null`, the check passes if the teacher's subject list includes the subject. `app/api/teacher/pending-papers/[attemptId]/route.ts:44` uses the same pattern for answer reads. Public teacher registration permits an absent `schoolId` and self-selected subjects; ordinary student registration does not establish `school_id`.

**Reproduction:** an unrelated teacher and student both have null school IDs in the mock DB. A request naming the student's attempt and matching subject succeeds and updates the attempt. Foreign attempt ID knowledge is still required; the pending-list query's SQL null comparison does not itself enumerate these attempts.

Teacher registration also accepts a caller-selected valid school UUID without institutional approval. Whether it maps to a real tenant depends on the installation's school ID model; treat this as a related membership verification gap rather than a separately proven cross-tenant exploit.

**Fix:** require verified teacher membership and explicit assignment to the student's classroom/exam. At minimum deny missing school IDs on either side. Bind question IDs and maximum marks to the actual paper instead of accepting them from `grades`.

**Retest:** null/null, foreign-school, matching-subject-only and unapproved teacher accounts must be denied; an explicitly assigned teacher must succeed.

### S06 — Generated paper ownership is not checked at submission

**CWE-639.** `app/api/student/generate-paper/submit/route.ts:48` loads generated papers by ID alone in both branches although generation stores `user_id`. A caller can submit against a foreign paper and receive Paper 1 correct answers. Subject and paper type also come from the request rather than the stored paper.

**Reproduction:** mocked foreign paper snapshot, empty answers and an authenticated attacker yield a successful response disclosing the correct answer. The lookup has no owner condition.

**Fix:** query by both paper ID and authenticated owner, or an explicit share entitlement. Derive subject/type from the row; reject nonexistent papers consistently, validate answers against its questions and apply the intended retry/reward policy.

**Retest:** a foreign UUID returns 404/403 without an attempt insert, answer disclosure, reward or grading job.

### S07 — Unauthenticated resource consumption

**CWE-306/400/770.** Middleware protects dashboard paths, not `/api`; route handlers must authenticate themselves.

- `app/api/lab/grade/route.ts:69`: unauthenticated requests invoke Gemini. The local harness confirms invocation with a stub AI provider and no auth header.
- `app/api/stories/generate/route.ts:33`: non-sample topics invoke AI without authentication or a rate limit; topic length is unbounded in this route.
- `app/api/tts/route.ts:110`: anonymous GET/POST synthesizes arbitrary text; no request quota or text length cap. The cache bounds entry count, not total bytes; wildcard CORS makes third-party browser reuse easy. Wildcard CORS alone is not the vulnerability.
- Election registration/voting invokes Cloudinary without anti-automation controls. Vote uploads occur before candidate and duplicate-vote checks, so rejected requests can still create orphaned uploads. Public signup also performs bcrypt/DB/email work without a signup quota.

**Impact:** AI/storage charges, outbound traffic, DB/email abuse and availability degradation. No load test or actual third-party spending was performed.

**Fix:** authenticate paid features where appropriate; add distributed per-user/IP/event quotas, strict body/field limits and concurrency budgets. For intentionally public voting/registration, add suitable abuse controls and verify inexpensive eligibility/duplicate checks before uploads. Clean up files after failed transactions. Enforce body size limits before multipart buffering at the hosting layer.

### S08 — Election identity is entirely self-asserted

**CWE-287.** `app/api/elections/[slug]/vote/route.ts:35` accepts an arbitrary name, roll number and uploaded file. There is no roster lookup, identity token, verification challenge or server-side liveness validation. A unique index protects one vote per supplied roll/race, but the caller can choose another roll number or impersonate an eligible voter first. A file upload is not proof of a live selfie. The shared upload helper even accepts PDFs for this field.

**Impact:** ballot stuffing, impersonation and denial of a legitimate person's vote. Manual review may catch suspicious votes, but does not make eligibility cryptographically or institutionally verified at submission. This may be an intentional low-assurance poll design; it cannot support a claim of authenticated election integrity.

**Fix:** use a preapproved voter roster plus a single-use signed voter credential or school identity login; enforce eligibility and uniqueness atomically. Use image-specific validation. Keep manual review and an immutable audit trail. Device/localStorage controls cannot substitute for identity.

**Retest:** arbitrary roll numbers and reused credentials must fail; concurrency must not create duplicate ballots.

### S09 — JWTs survive credential reset/logout and retain stale privileges

**CWE-613.** `lib/auth.ts:24`, `lib/auth-utils.ts`, and both authentication wrappers verify signed claims without checking a live session, token version, account state or current role. `app/api/auth/reset-password/route.ts:84` updates the password/OTP but does not invalidate tokens. `lib/auth-session.ts:49` only removes the local browser's stored token during logout. Default JWT lifetime is seven days (`constants/index.ts:119`), subject to environment override.

**Impact:** a previously copied token remains useful after password recovery or logout until it expires; role changes are not centrally enforced by these wrappers. This amplifies S01. No real account token was extracted or replayed.

**Fix:** use revocable server-side sessions or a checked session/token version; invalidate on reset, logout, role change and account disablement. Use short-lived access tokens with rotated refresh credentials if needed. Set HttpOnly/Secure cookies server-side, with explicit CSRF protection for cookie-authenticated mutations.

**Retest:** a token issued before reset/logout/role removal must fail subsequent protected API requests.

### S10 — Distributed deployments bypass per-worker brute-force budgets

**CWE-307.** `lib/security/rate-limit.ts:16` uses a process-local map. Netlify deployment configuration and serverless DB settings indicate workers may scale independently. Login, reset, OTP verification and forgot-password limits reset with process lifetime and are independent across workers. The actual limiter loaded into two isolated contexts denies the exhausted budget in one and accepts the same account in the other. Chat uses another process-local counter.

**Fix:** atomic shared-store limits for account, trusted client IP and global budgets; normalize identifiers consistently. Do not trust client-supplied forwarded headers unless the ingress overwrites them. Store OTP attempt state with the challenge; atomically consume purpose-bound, hashed OTPs. The current registration/reset flows reuse the same OTP columns and consume via separate SELECT/UPDATE operations.

**Retest:** exhaustion must persist across instances/restarts; simultaneous OTP redemption must succeed once. Forged forwarded headers must not reset the effective account budget.

### S11 — Regrading is not reward-idempotent

**CWE-841.** `app/api/teacher/grade-paper/route.ts:78` calls `awardStudentProgressPoints` for every grading request. `lib/gamification/award-progress-points.ts:47` increments points without a unique attempt/reward key. No prior grading state prevents replay. The harness submits the same attempt twice and observes two award calls and two updates. This is exploitable together with S05 or by an authorized teacher repeatedly grading the same attempt.

**Fix:** store a unique reward ledger keyed by attempt and reward reason, with the grade update and reward in one transaction. For regrades apply a calculated delta or preserve the original award according to policy. Server-side validate question marks. Separately decide whether repeated generated practice attempts should earn rewards; do not assume retries are always malicious.

**Retest:** sequential and concurrent replay must result in exactly one reward; regrading must apply only the intended adjustment.

### S12 — Database TLS peer identity is not verified

**CWE-295.** `lib/db.ts:29` configures `ssl: { rejectUnauthorized: false }`. Traffic can be encrypted without authenticating the database peer. A network/DNS attacker able to intercept a connection may impersonate the DB and expose credentials/data. Actual driver behavior can also depend on connection-string SSL parameters; production handshake settings were not tested.

**Fix:** use the provider's supported verified TLS settings and CA trust. Remove the false verification override; ensure connection-string options cannot re-disable it. Test that untrusted certificates and hostname mismatches fail.

### S13 — Push subscriptions can be removed or reassigned by another user

**CWE-639.** The unsubscribe route authenticates the caller but passes only an arbitrary `endpoint` to `deletePushSubscriptionByEndpoint`; `lib/push/push-subscriptions.ts:83` deletes without `user_id`. The subscription upsert also changes owner on endpoint conflict without proving ownership.

**Precondition/impact:** knowledge of another user's typically high-entropy endpoint URL permits subscription removal or reassignment. Notification plaintext interception is not established: encryption keys and push-service ownership impose additional constraints.

**Fix:** scope deletion/update to endpoint AND authenticated owner; handle account switching through a deliberate proof-backed flow. Validate endpoint/key types, sizes, HTTPS push-service destinations and subscription quotas. Outbound `webpush.sendNotification` also accepts stored endpoints without an application allowlist; assess SSRF reachability separately.

**Retest:** one user cannot mutate another's subscription even when its endpoint is known.

### S14 — Temporary account passwords are weakly generated and long-lived

**CWE-338.** `app/api/school/add-teacher/route.ts:41` and `app/api/school/add-student/route.ts:21` generate eight-character passwords using `Math.random`. They create verified accounts and return the password; the student flow emails it. The login path does not enforce password replacement based on onboarding state.

**Fix:** prefer a cryptographically random, single-use, expiring activation link allowing the recipient to set a password. If temporary passwords are unavoidable, use `crypto.randomBytes`/`randomInt`, sufficient entropy, expiration and enforced reset. Do not email a reusable password.

**Retest:** expired/used invitations fail, generated secrets use a CSPRNG, and temporary credentials cannot remain permanent.

### S15 — Forgot-password response enumeration

**CWE-204.** `app/api/auth/forgot-password/route.ts:58` returns “If an account exists...” for an unknown email but “Password reset OTP sent successfully.” for a known one. Despite the generic-response comment, both JSON message fields distinguish the branches. No live email addresses were tested.

**Fix:** return identical status/body for both branches and send through a queue; retain effective rate limits. Explicit signup duplicate messages are a separate product/privacy decision.

## D01 — Dependency assessment and deployment limits

`package.json`, `package-lock.json`, and `yarn.lock` pin Next.js 15.1.9. Netlify builds with Yarn, so npm's transitive inventory is not definitive evidence of the deployed Yarn tree. Reconcile the two lockfiles and audit the actual deployment artifact. The npm results count affected package entries, not independently exploitable application vulnerabilities.

| Package | npm-lock version | Registry severity | Context |
|---|---|---|---|
| next | 15.1.9 | Critical | App Router is present; RSC DoS applies by affected framework/version. Other advisories have additional prerequisites. |
| jspdf | 4.2.0 | Critical | PDF object/HTML injection advisories; affected APIs must receive attacker-controlled input for exploitation. Not locally exploited. |
| axios | 1.13.5 | High | Numerous transport/prototype-related advisories; individual preconditions not demonstrated. |
| js-cookie | 3.0.5 | High | Cookie attribute/prototype advisory; not a substitute for fixing S01/session design. |
| multer | 2.0.2 | High | Declared dependency; no application multer handler was established in this review. Remove if unused. |
| nodemailer | 8.0.1 | High | Multiple option/header/transport advisories; caller control of affected options was not demonstrated. |
| playwright | 1.49.1 | High | Development tooling; separate from production attack surface. |

Vendor confirmations:

- [Next.js RSC security update](https://nextjs.org/blog/security-update-2025-12-11): vulnerable App Router versions include this release; denial of service and Server Function source disclosure are separate issues. Source disclosure depends on relevant Server Functions. **15.1.9 already contains the original React2Shell fix**; this report does not label it vulnerable to that original RCE merely because newer fixes are missing.
- [Middleware authorization bypass](https://github.com/vercel/next.js/security/advisories/GHSA-f82v-jwr5-mffw): version matches CVE-2025-29927. This app's API helpers perform their own JWT checks, so a middleware bypass alone does not establish admin API access. Actual Netlify/ingress mitigations were not tested.
- [AVIF image optimization RCE advisory](https://github.com/vercel/next.js/security/advisories/GHSA-2xp9-vwfh-vxw4): affected versions include 15.1.9. Exploitation depends on native decoder/hosting behavior and AVIF reaching optimization. `next.config.ts` allows all `res.cloudinary.com` image paths, including other accounts' assets. The deployed native libraries and adapter behavior need verification; no exploit image was created or sent.

**Action:** upgrade Next.js and aligned tooling to a currently supported patched release; the registry audit recommends 15.5.25 for the current 15.x dependency. Validate all advisories again at implementation time. Restrict image hosts to the intended Cloudinary account/path. Upgrade other affected packages selectively and test relevant features; do not apply a blind major-version `npm audit fix --force`. Keep one authoritative lockfile and pin the deployment toolchain.

## Additional hardening and unresolved checks

These observations are not counted as independently proven exploits:

- Uploads use publicly delivered Cloudinary URLs, including voter selfies and student work. Verify private/authenticated delivery, retention, deletion, and who can obtain those URLs. URL entropy is not an access policy. Storage account settings were not accessed.
- Runtime code performs table creation/ALTER operations. Move migrations to a deployment identity and reduce runtime DB privileges. Actual grants were not inspected.
- `next.config.ts` skips TypeScript and ESLint build failures. Restore required CI checks and add authorization regression tests; this setting is not itself a vulnerability.
- Cookie-authenticated APIs lack explicit origin/CSRF checks. SameSite=Lax mitigates many cross-site requests but does not cover all same-site attacker scenarios. No standalone CSRF exploit was demonstrated.
- The legacy local-file deletion helper joins `/uploads/` paths without checking the final canonical directory. Reachability requires an attacker-controlled stored file URL and an admin deletion action; that write path was not established, so arbitrary file deletion is not asserted.
- HTML email interpolation, user-controlled image URLs, raw exception responses, unbounded notification recipient lists and AI prompt injection merit targeted follow-up. Prompt injection was not demonstrated to grant privileged tool access.
- SQL queries inspected use parameters for values; dynamic admin sort fields and activity intervals are allowlisted. No SQL injection was confirmed. This is not an exhaustive proof of absence.

## Existing controls worth preserving

JWT signing fails when the secret is missing; no insecure fallback was found. Passwords use bcrypt. OTP generation uses `crypto.randomInt` and timing-safe comparison. Upload validation checks signatures and excludes SVG. Many admin routes use explicit role guards; teacher election routes check ownership; chat message reads check ownership; vote uniqueness has a database index and insertion uses a transaction. Security headers include HSTS, nosniff, frame restrictions and referrer policy. These controls reduce risk but do not cover the gaps above.

## Remediation order and acceptance criteria

1. **Immediate:** fix S01–S05, restrict/disable unneeded public expensive endpoints, and upgrade affected framework/runtime dependencies. Review logs for exploitation indicators; do not infer compromise solely from a vulnerable version.
2. **Next release:** enforce election eligibility, revocable sessions, generated-paper ownership, shared abuse budgets and idempotent grading. Scope push mutations and fix TLS validation.
3. **Hardening:** invitation-based onboarding, identical recovery responses, private sensitive storage, least-privilege DB access, authoritative lockfile and mandatory CI checks.
4. **Before closing the audit:** test in a staging deployment with two students, two unrelated teachers, an approved teacher and an admin; verify negative authorization cases, stale-token rejection, concurrent reward/OTP/vote handling, effective ingress/body limits, and hosted image processing. Confirm actual deployed dependencies, TLS, Cloudinary permissions and edge protections.

Run the local evidence harness from the repository root:

```sh
node docs/security/2026-09-22/validate.cjs
```

If Playwright's browser is unavailable, set `AUDIT_BROWSER_PATH` to an installed compatible Chromium executable. The initial local browser cache was incomplete; the completed run uses an existing alternate headless Chromium. The harness asserts vulnerable behavior for audit evidence, so it should be converted into rejection-oriented regression tests as fixes land. It must never be interpreted as a passing security gate.

No fixes have been applied by this audit. Production exploitability and remediation closure remain separate work.
