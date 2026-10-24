# Loading and perceived performance audit — 23 September 2026

## Scope and confidence

Static review of the Next.js app, route middleware, shared shell, query and mutation hooks, dashboard endpoints, navigation cards, loading components, timers, and public assets. The search covered 709 TypeScript/TSX files under `app`, `components`, `services`, and `lib`, plus the hooks and PWA code. Follow-up work added read-only database plans and single-run authenticated cold/warm browser traces of a local production build. These are not production latency percentiles. Asset directory size is repository footprint, not the amount downloaded on every page.

## Authenticated startup: why the loader can last

1. A returning user commonly opens `/`. `middleware.ts` verifies the cookie and redirects to a role dashboard. That adds one navigation before the dashboard starts. `/dashboard` adds another redirect if used as an entry URL.
2. The private layouts previously rendered `<AppLoader />` until a post-hydration local-storage check, even though middleware had already verified the cookie and role. The guard now renders on the first pass and still redirects if the local browser session is inconsistent. The same correction was applied to the admin guard. Protected data APIs continue to authorize requests independently.
3. The student dashboard previously withheld the whole page until both `/api/student/me` and `/api/student/history?limit=8` completed. This whole-page wait has been removed; the dashboard renders after session hydration, with local points as a temporary value and panel skeletons for history and papers. Limited history previews now select the newest rows first and calculate their attempt numbers separately; unlimited history preserves the original ranking query.
4. The teacher dashboard previously waited for `/api/teacher/students`, which called `ensureClassroomSchema()` and loaded every paper and attempt including large `questions_snapshot` and `answers_data` fields. It now requests a compact SQL summary returning only counts and the top five, and renders the shell while independent classroom, queue, and summary panels load. The detailed report remains on the students page. Classroom schema checks are now read-only at request time; migration is an explicit deployment command.
5. The admin dashboard requests a nine-query aggregate. Its polling was reduced from every 10 seconds to every five minutes, with a one-minute stale window; the slow-changing statistics no longer contend with startup requests as frequently. The query is still unsplit and its first load needs profiling.
6. The shell mounts sidebars twice (desktop and mobile), plus a header. Their `useUserProfile()` subscriptions share a React Query key, so this does **not** imply three HTTP profile calls, but it does mean repeated component work. The header and sidebar notification bells also mounted push setup; this has been deferred until a bell opens.
7. First paint includes global Poppins weights 300–900, a Google-hosted Urdu font stylesheet, global providers, a PWA updater, and the client shell. The mobile dashboard dynamically imports a separate dashboard component. The priority `/nova-tutor.png` source is 6.4 MB; its `unoptimized` override has been removed on dashboard hero images so Next can serve responsive variants. Confirm actual transfer and optimizer support in the deployment environment.
   The production build reports 106 kB of shared first-load JavaScript, about 297 kB for `/student/dashboard`, and about 307 kB for `/admin/dashboard`. These are build estimates, not measured network transfer or execution time.
8. The production build identified `/api/boards` and `/api/subjects` as static routes, and both queried the database during prerender. When the database DNS lookup failed, the build still succeeded using fallback results. These routes now run at request time and return HTTP 503 on an uncached database failure, instead of reporting fake boards or an empty subject list as success.

## Confirmed artificial or misleading loading

| Location | Finding | Resolution |
| --- | --- | --- |
| `components/lab-game/LabPracticalCard.tsx` | A percentage was advanced by an 80 ms interval, held for 700 ms, then a full-page `window.location.href` was scheduled another 120 ms later. It did not track loading. | Removed fabricated percentage and delay. Navigation now uses the Next `Link` immediately with an indeterminate opening spinner. |
| `components/PastPaperCard.tsx` | Every click showed an inline spinner that auto-stopped after 800 ms, regardless of actual navigation or mutation completion. | Removed timer. Modal actions no longer show a false wait; navigation actions keep feedback until the route unmounts. |
| `app/admin/stories/page.tsx` | “Publish to Student App” changed to “Published to Library!” without a request or persistence. | Disabled and labelled as unavailable until a real publish workflow exists. |
| `app/api/stories/generate/route.ts` | AI failures returned the Lahore Resolution sample with `success: true`. Topic keywords also returned predefined samples while the UI said it was using Gemini. | Failures now return an error and POST always calls the AI generator. Curated samples remain available through the separate preset picker/GET route. |
| `app/student/onboarding/page.tsx` | Successful onboarding waited two seconds, then navigated to `/student`, which has no page. | Redirects immediately to `/student/dashboard`. |
| `components/classroom/GenerateChapterTestModal.tsx` | After successful publishing, the modal waited another 700 ms before closing. | Removed the post-success wait. Its multi-set progress still reflects completed publish requests. |

Animations and timers in the lab simulations, exam countdowns, search debounces, and temporary copy/toast messages are not general app-loading delays. `NextTopLoader` is a navigation indicator with simulated progress; its percentage is not a measurement of data completion.

## Action feedback audit

The app already has extensive mutation feedback: exam submission, school student/teacher creation, classroom creation, votes, candidate registration, friend follow, quiz sharing, and many admin save flows disable the action and render a spinner while pending. This audit found and addressed missing feedback in Nova admin exemplar saving, settings saving, and test execution; notification “mark all read” and push enable now show spinners and busy state. The shared `AppButton` now exposes `aria-busy` when `isLoading` is set.

This does not assert that every one of the roughly 900 click/submit bindings was manually exercised. Navigation-only actions generally rely on the global route progress bar; synchronous toggles and modal openings should not display loaders. Remaining manually checked gaps worth follow-up include hard-coded router navigations inside older screens, generic retry buttons that refetch without a local pending indicator, and “save and quit” flows that should be verified with real network throttling.

## Prioritized work remaining

1. **Validate after deployment and across roles.** Repeat `/` → dashboard cold/warm traces against the deployed build for student, teacher, school, and admin accounts, with multiple samples and server-cold runs. The local production-mode student trace and endpoint timings below establish a baseline, not a production percentile. Avoid judging from `next dev`, which compiles routes on demand.
2. **Run schema preflight in deployment.** Run `db:check:classrooms` and `db:check:notifications` before serving; for an incomplete environment run the corresponding migration command first. Runtime requests now do read-only schema checks rather than DDL.
3. **Profile history query plans.** The limited preview no longer sorts/ranks all attempts, but the per-row attempt count can still scan old rows without suitable indexes. Verify numbering and add indexes based on `EXPLAIN ANALYZE` against production-sized data.
4. **Split admin queue refresh from slow aggregates.** The five-minute polling interval reduces load but makes the grading queue less live. Give the queue a small independent endpoint and refresh it more frequently after database profiling.
5. **Reduce first-paint work.** Keep one notification/push controller in the shell, lazy-load lower dashboard sections and heavy chart code, produce a smaller modern Nova source asset if deployment image optimization is insufficient, and audit font weights actually used. Avoid reading `public/` size as a bundle metric.
6. **Complete the lectures studio product flow.** Add a real publish endpoint and persisted story library before enabling the button; keep curated presets visually distinct from AI-generated episodes.
7. **Standardize action states.** Prefer `AppButton isLoading` for requests, `AppSkeleton` for independent panels, and errors with retry for failed queries. Avoid timeout-based completion signals. Validate representative student, teacher, school, and admin actions under throttled network conditions.

## Verification performed

`npx tsc --noEmit --pretty false`, focused ESLint, and `npm run build` passed for the initial audit fixes. The follow-up teacher summary, guard, history, image, and notification changes passed TypeScript and an isolated production build. The build lists `/api/boards` and `/api/subjects` as dynamic routes and completes without the prior database DNS errors during prerender. Both schema preflight commands passed on the configured database. The read-only profile and browser traces below were then run.

The final focused lint pass passed for the new notification/query/timing/font and migration files. A broader lint selection still reports five existing findings in `app/api/notifications/route.ts` and `lib/teacher/classroom-schema.ts` (unused legacy parameters and explicit `any`); these were not introduced by the latency changes. A subsequent workspace-root `tsc` invocation was inconclusive because generated `.next/types` files disappeared during the check while the shared build directory was in use; the isolated production build had already passed its TypeScript stage.

## Follow-up database measurements

Read-only `EXPLAIN (ANALYZE, BUFFERS)` samples were run against the configured Neon database with a three-second statement timeout. `scripts/profile-loading.js` prints only estimated table sizes, index names, and aggregate timing/plan metrics. These figures describe the current small dataset, not future scale or complete HTTP latency:

| Measurement | First sample | Warm repeat |
| --- | ---: | ---: |
| Student history preview (8 rows) | 0.18 ms | 0.19 ms |
| Teacher enrollment aggregate | 0.60 ms | 0.09 ms |
| Teacher graded-attempt aggregate | 38.45 ms | 0.12 ms |
| Admin Paper II queue aggregate | 0.07 ms | 0.07 ms |
| Admin student class distribution | 0.10 ms | 0.09 ms |

The database statistics reported approximately 52 exam attempts, 23 teacher classrooms, 25 teacher papers, 45 users, and 202 notifications. The existing `idx_exam_attempts_user_created` and teacher classroom indexes are present. Sampled fresh connection time varied from roughly 650 ms to 6.37 s; a warm notification query executed in about 4.25 ms after its initial disk reads. Consequently, the long loader is not explained by these sampled SQL execution times on the current small dataset. Server-Timing's `db` duration includes connection acquisition and network wait, not just SQL execution.

Classroom startup now checks required tables, columns, and indexes in one read-only catalog query and performs no DDL during requests. The configured database passed that readiness check. A dedicated `db:migrate:classrooms` command runs the migration for new environments and must be executed before serving them; no live migration was needed or applied here.

Notification startup likewise no longer performs DDL. Its list and counts are fetched in one SQL round trip. The configured notification table/index passed `db:check:notifications`; `db:migrate:notifications` is available for an incomplete environment. No live migration was needed or applied here.

## Browser baseline (unauthenticated)

The deployed canonical public landing page was traced in headless Chrome before deployment of the latest local changes. A cache-cold navigation took about 2.9 seconds to first contentful paint and a warm reload about 0.27 seconds. The direct document response was about 1.37 seconds cold and 0.21 seconds warm in that sample. Going through `https://exboardai.tech` adds a 301 to `https://www.exboardai.tech`; the redirect was about 0.8–0.9 seconds in sampled runs. These are single-run observations, not percentiles.

The first cold trace fetched a Google-hosted Urdu font stylesheet even though the landing page uses no Urdu; one request took roughly 1.7 seconds. The duplicate render-blocking CSS import/link have been removed. The existing stylesheet now loads only when an element with the app's `.font-urdu` class appears. Self-hosting was evaluated but the isolated build stalled while fetching that font, so it was not shipped. The updated isolated production build passed and its public landing-page trace showed no Google font request. A post-deploy browser check remains necessary. Its cache-cold first paint was affected by several on-demand local image transformations, so it is not used as an apples-to-apples speed comparison with the deployed site.

The landing headline first appeared at the first-contentful-paint time, then its rotating text produced a second largest-contentful-paint candidate around three seconds later. Thus the reported ~3–6 second LCP on this page is partly a carousel metric effect and does not mean the first text was invisible that long. The authenticated dashboard trace remains the relevant measurement for the user's loader complaint.

## Authenticated student-dashboard trace

A test account signed in through an instrumented Chrome window against a local production build. Navigating from `/` then redirected to `/student/dashboard`. This is a single cache-cold/warm pair, not a production percentile or server-cold benchmark. The first cache-cold navigation began immediately after login, so some in-flight requests from the login landing may overlap its request list; the follow-up trace waits for network idle before navigating.

| Metric | Cache-cold | Warm reload |
| --- | ---: | ---: |
| First contentful paint | 2.30 s | 0.13 s |
| Largest contentful paint (Nova image) | 4.43 s | 0.28 s |
| `/` role redirect | 0.10 s | 0.01 s |
| `/student/dashboard` document | 0.03 s | 0.005 s |
| History API observed request | 0.69 s | 0.88 s |

The history endpoint's server timing attributed ~0.60–0.67 seconds to the database call, while direct warm `EXPLAIN ANALYZE` execution of the preview SQL was ~0.2 ms. This points to connection acquisition/network latency rather than the query itself on this dataset. Several JavaScript chunks took about 2.1 seconds to load on the cache-cold browser run. A notification resource lasted over four seconds on the warm run, after the visible page had already painted. Its original path executed two schema DDL statements and three serial reads. The live notification schema/index was confirmed complete, then runtime DDL was removed and those reads consolidated into one SQL round trip. A migration command remains for new environments.

### Final-build confirmation

The same test account signed in again to a fresh instrumented Chrome window on the final local production build. The tracer waited for network idle after login before navigating from `/`, avoiding overlapping login requests. The following is one cache-cold/warm pair, not a controlled A/B test or a production percentile:

| Metric | Cache-cold | Warm reload |
| --- | ---: | ---: |
| First contentful paint | 328 ms | 148 ms |
| Largest contentful paint (Nova image) | 628 ms | 316 ms |
| `/` role redirect | 78 ms | 26 ms |
| `/student/dashboard` document | 37 ms | 7 ms |
| History API | 335 ms (DB 281 ms) | 271 ms (DB 252 ms) |
| Notifications API | 333 ms (DB 294 ms) | 267 ms (DB 256 ms) |
| Past-paper preview API | 360 ms | 275 ms |

Both runs completed without failed requests. The notification endpoint returned successfully within the dashboard's initial request group; the previous over-four-second observation did not recur. Because the two traces differed in server/cache/connection state as well as code, their difference does not prove an exact speedup from the notification change. The current warm dashboard's remaining ~250–275 ms API waits are mostly recorded within `db` time despite sub-millisecond warm SQL execution in the read-only profile. A post-deployment trace and multi-sample connection profiling are needed to establish real-user improvement and distinguish Neon connection/network time from server work.
