# Student portal QA audit — 2026-10-01

## Scope and evidence

Production: `https://www.exboardai.tech`. Checked public signup/login in Chrome, the registration API with one invalid synthetic request, route guards, read-only schema queries, Netlify function error logs, and page/network timings from this workstation. Reviewed student chat and grading code. On 2026-10-02, a supplied student test account allowed signed-in browser checks of dashboard, Nova, leaderboard, past papers, classrooms, lectures, and history, plus a short Nova text prompt. No production account was created.

## Confirmed defects

| ID | Severity | Area | Evidence and impact | Status and verification |
| --- | --- | --- | --- | --- |
| QA-01 | Critical | Paper II grading | Production function logs on 2026-10-01 repeatedly show `[Nova] Async grading failed` with PostgreSQL `42703: column "section" does not exist`. A read-only production schema query confirmed `questions` has `paper_ii_data` and `question_part`, but no `section`. Both question-loading queries selected the missing column. Submitted work can remain failed instead of receiving a grade. | Both queries now project `NULL::text AS section` and are deployed. A subsequent read-only check found no `failed` Paper II attempts; 14 were `graded` and four were `awaiting_approval`. No new Paper II submission was made for an end-to-end grading test. |
| QA-02 | High | Student signup | The production student form had no password criteria beside the password field. An invalid synthetic request with `password: "123"` returned HTTP 400 and specific password issues, while the form previously displayed a generic registration error. | Shared password rules and a live checklist were added for student, teacher, and school registration; API error parsing now preserves validation messages. Deployed; a fresh real registration was not attempted. |
| QA-03 | High | Signup throttling | Registration routes consumed the five-per-hour account-creation quota before validating fields. Several weak-password submissions could therefore block a legitimate signup. If the trusted client-IP header is absent, all visitors shared an `unknown` five-hit bucket. | Invalid requests now use a separate, larger attempt quota; the small quota applies after validation and uniqueness checks, and no per-IP account quota is applied to `unknown`. Deployed and covered by regression tests. |
| QA-04 | High | Nova chat | The exact fallback shown in the supplied screenshot is rendered when the SSE response closes without any answer delta. The Gemini stream helper previously treated a zero-text provider stream as successful, and the chat generator then emitted `done` without a delta. This is a confirmed code path that produces the reported symptom; the particular production request cannot be attributed to it without its request trace. | Empty model streams now try another model; the chat generator also emits a fallback delta if its stream is empty. Deployed. Later production QA recorded three nonempty Nova responses, but intermittent provider failures remain possible. |
| QA-05 | Medium | Student profile | The registration form sends `gender`, and the production `users` table has a `gender` column, but the student registration API schema stripped that field and the `INSERT` did not save it. | Registration now validates and stores the form value. Deployed; no new account was created to check persistence end to end. |
| QA-06 | High | Login and OTP | The same shared `unknown` IP quota pattern also affected login, OTP verification, password reset requests, and reset completion when a trusted IP header was absent. One visitor could exhaust a small bucket for everyone. | Per-account quotas remain; trusted IPs retain their own quota, and a larger site-wide abuse ceiling replaces the shared `unknown` bucket. Deployed and covered by regression tests. |
| QA-07 | Medium | Password reset | The reset page had no password checklist or local strength/match check even though the API enforces the same rules as signup. | The reset form now shows the rules and blocks invalid submissions before calling the API. Deployed; no password was changed in production. |
| QA-08 | High | Nova streaming | The Gemini streaming helper accepted `timeoutMs` but did not use it; a stalled provider stream could run until the host terminated the response. The SSE route sent no bytes while it prepared context. | The provider stream now has a bounded deadline and abort signal; the route flushes immediately and sends keep-alive comments. Deployed. |
| QA-09 | Medium | Nova cold start | The first chat request on each serverless worker ran a sequence of schema DDL/check queries before loading settings. This adds avoidable database round trips to the response path on an already migrated database. | A single read-only readiness query now skips that migration path when the required tables and columns are present. The production schema returned `ready: true` to the same query. Deployed. |
| QA-10 | High | Nova answer routing | During production QA, “Solve the quadratic equation 2x² + 5x − 3 = 0 ... show each step” received a Mathematics syllabus link instead of a solution. Saved chat messages confirmed the mismatch. The structured fallback treated the word “show” plus an inferred subject as a syllabus request. | The fallback now requires explicit syllabus/chapter/topic intent and recognizes solve/calculate/derive/prove/show-how as tutoring requests. A regression test passes locally. **Pending deployment and live retest.** |

Google's [current Gemini model list](https://ai.google.dev/gemini-api/docs/models) identifies both `gemini-3.5-flash-lite` and `gemini-3.1-flash-lite` as stable models. The model-priority change does not establish the cause of the screenshot's individual failed request.

## Performance observations

These are network measurements from one workstation, not lab or field Core Web Vitals. They do not measure authenticated dashboard interactions.

| Request | Observation |
| --- | --- |
| Landing HTML, first request | 2.09 s time to first byte; 2.44 s total; 228 KB transferred. |
| Landing HTML, three repeats | 0.83–1.08 s time to first byte; 1.39–1.43 s total. |
| Signup and login HTML | 2.13 s and 2.00 s time to first byte on first request. |
| Privacy, terms, and forgot-password pages | All returned HTTP 200. Forgot-password had one 6.09 s time-to-first-byte outlier; three repeats were 0.34–1.17 s. This requires browser and region-based measurement before assigning a cause. |
| Nova landing illustration | Original PNG is 6.76 MB, but the page uses Next image optimization. A 384 px WebP response was 18 KB and took 1.13 s; the same request without WebP support was 265 KB and took 2.07 s. The original file size is not the browser transfer size. |

With a signed-in mobile Chrome session, the dashboard's Top Performers heading appeared about 3.4 s after navigation and `/api/student/dashboard/overview` returned HTTP 200. A short Nova text prompt received SSE `meta`, `delta`, and `done` events in 4.7 s from request start; that single successful request does not explain the earlier intermittent screenshot failure. The first direct scripted POST returned HTTP 403 because it omitted the browser `Origin` header and was correctly rejected by CSRF protection; the corrected request returned HTTP 200.

A read-only database check initially found one Paper II attempt marked `failed`. A later check after deployment found none. The account owner or an automated recovery may have processed it; this audit did not run a recovery mutation.

## Student feature coverage

| Flow | Production result |
| --- | --- |
| Landing, login, signup role selection and student form | Opened and inspected; privacy, terms, and forgot-password returned HTTP 200. |
| Weak-password registration API | HTTP 400 with specific issues; no account created. |
| Protected dashboard and Nova navigation | Correctly redirected to login without a session; opened with the supplied student test account. |
| Dashboard, leaderboard, past papers I/II, classrooms, lectures, history, and Nova | Opened in a signed-in desktop browser. The dashboard overview and a short Nova text response completed. The mobile leaderboard filter is being checked separately. |
| Onboarding, answers and grading, syllabus, solved notes, custom/generated papers, challenges, friends, notifications, labs, journals, account/settings, and signed-in Nova image chat | Not yet functionally exercised end to end. Opening a page and reviewing code do not prove its full flow works. |

## Verification before release

Local checks: TypeScript, targeted ESLint, and 12 targeted regression tests passed, including the QA-10 intent test. Production deployments through 2026-10-02 include QA-01 through QA-09. QA-10 still needs deployment and a live retest. A fresh weak/strong registration, a new Paper II submission, Nova image prompts, and full student flows on a Huawei device remain untested; page-open checks do not cover those interactions.
