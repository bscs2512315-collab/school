# Security remediation retest — 2026-09-30

This records the source changes and local checks for the findings in
[`../2026-09-22/SECURITY-AUDIT.md`](../2026-09-22/SECURITY-AUDIT.md).
It is a local retest, not a penetration test of the deployed application.

| Findings | Remediation checked in source |
| --- | --- |
| S01 | Parser-based HTML sanitation after math rendering; active SVG, event attributes, and malformed image markup rejected. Authentication moved to server-set HttpOnly cookies. |
| S02–S03 | Shell URL interpolation removed. Bounded HTTPS downloads use exact trusted hosts and validate every redirect. Image responses require magic bytes, successful decoding, and bounded dimensions. PDF uploads require a PDF signature; Python extraction has a timeout. |
| S04 | A supplied chat session is owner-checked before rate limiting or AI work; missing or foreign sessions return 404 without creating a new session. |
| S05–S06 | Manual grading requires accepted classroom assignment and matching school/subject; generated-paper submissions require ownership and match the stored paper metadata. |
| S07–S08 | AI and speech routes require authentication and shared rate limits. Public election requests have shared quotas and bounded uploads. Voting requires a logged-in, school-created student whose registration details match the school roster. |
| S09–S10 | Protected API requests check live account role, verification, and token version. Reset and logout revoke existing tokens. Login/OTP limits use an atomic database table; OTPs are purpose-bound, hashed, and consumed atomically. |
| S11–S14 | Grading validates paper questions and awards points once in a transaction; database TLS verifies certificates; push subscription mutations are owner-scoped; school-created accounts use random unusable initial passwords and a reset flow. |
| S15, D01 | Password-reset responses remain nondisclosing. Framework/dependencies upgraded; `npm audit` reports zero known vulnerabilities in the current lockfile. |

## Checks performed

- `tsx --test tests/security-regressions.test.ts`: sanitizer, redirect, byte limit, multipart limit, and image validation checks.
- `tsc --noEmit` and `npm run build` for compile and production build validation.
- `npm audit --json`: zero reported vulnerabilities at retest time.

## Deployment checks required

1. Run `npm run db:migrate:security` before routing traffic to the new code. The Netlify build command runs it automatically; the build identity needs schema privileges. The database configured by this workspace's `.env` was migrated successfully on 2026-09-30 after login exposed the missing schema. Confirm the migration succeeds independently in every other environment.
2. Set `SYLLABUS_PDF_ALLOWED_HOSTS` to a comma-separated list of trusted PDF source hostnames if remote syllabus import is used. Without it, URL import fails closed. Confirm `CLOUDINARY_CLOUD_NAME`, `JWT_SECRET`, and verified database CA trust are correctly configured.
3. Existing school-created student rows need a correct `school_id` to vote. Backfill these from authoritative school records before an election; never infer the school from user-supplied ballot fields.
4. In staging, retest cross-account access, token revocation, concurrent OTP redemption/voting/grading, redirects, TLS failure, and legitimate PDF/image flows with real storage and database services. This local retest did not exercise those deployment paths.

Previously issued browser tokens will fail the new live account-version check. Users may need to sign in again after deployment.
