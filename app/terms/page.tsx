import type { Metadata } from "next";
import Link from "next/link";
import { MarketingLayout } from "@/components/marketing/MarketingLayout";
import { SITE } from "@/lib/site";
import { APP_NAME } from "@/constants";
import { FRONTEND_ROUTES } from "@/constants/endpoints";
import BookOpenSVG from "@/public/svgs/BookOpenSVG";
import SparklesSVG from "@/public/svgs/SparklesSVG";
import SecureExamSVG from "@/public/svgs/SecureExamSVG";

export const metadata: Metadata = {
  title: `Terms & Conditions — ${APP_NAME}`,
  description:
    `Read the Terms and Conditions for using ${APP_NAME}, the AI-powered board exam preparation and study platform for AKUEB and Sindh Board students, teachers, and institutions.`,
  alternates: { canonical: "/terms" },
  openGraph: {
    title: `Terms & Conditions — ${APP_NAME}`,
    description:
      `Terms of service, academic integrity policies, and acceptable use guidelines for ${APP_NAME}.`,
    url: `${SITE.url}/terms`,
    type: "website",
  },
};

const SECTIONS = [
  {
    id: "acceptance",
    title: "1. Acceptance of Terms & Eligibility",
    content: (
      <>
        <p>
          These Terms and Conditions (&ldquo;Terms&rdquo;) constitute a legally binding agreement between you (&ldquo;User,&rdquo; &ldquo;Student,&rdquo; &ldquo;Teacher,&rdquo; or &ldquo;School&rdquo;) and <strong>{APP_NAME}</strong>, operated by <strong>MacroPulse Systems</strong> (&ldquo;we,&rdquo; &ldquo;our,&rdquo; or &ldquo;us&rdquo;). By registering for an account, accessing our web application, or using our educational features, you agree to comply with and be bound by these Terms.
        </p>
        <p className="mt-3">
          <strong>Age &amp; Guardianship:</strong> {APP_NAME} is intended for secondary and higher secondary school students (Classes IX to XII), educators, and educational institutions. If you are under the legal age of majority in your jurisdiction (typically under 18 years of age), you confirm that you have obtained permission from your parent, legal guardian, or an authorized school official to use the platform.
        </p>
      </>
    ),
  },
  {
    id: "services",
    title: "2. Description of Platform & Services",
    content: (
      <>
        <p>{APP_NAME} provides a specialized exam preparation ecosystem, which includes:</p>
        <ul className="mt-2 list-disc space-y-1.5 pl-5">
          <li><strong>Digital Past Paper Practice:</strong> Interactive Paper I (multiple-choice questions) and Paper II (constructed and extended response questions) with detailed marking breakdowns.</li>
          <li><strong>Nova AI Tutor:</strong> An interactive artificial intelligence conversational tutor designed to explain complex science and mathematics concepts, solve doubts, and suggest revision strategies.</li>
          <li><strong>AI Automated Marking:</strong> Natural language and optical character recognition (OCR) evaluation of written responses mapped to curriculum rubrics.</li>
          <li><strong>Dynamic Question Generation:</strong> Customized chapter-specific and topic-focused mock assessments.</li>
          <li><strong>Interactive Labs &amp; Gamification:</strong> Simulated science practical experiments, 1v1 student challenges, study streaks, and competitive leaderboards.</li>
          <li><strong>Classrooms &amp; Institutional Portals:</strong> Tools for teachers and schools to create cohorts, distribute assignments, track progress, and review student performance analytics.</li>
        </ul>
      </>
    ),
  },
  {
    id: "disclaimer-boards",
    title: "3. Educational Disclaimer & Independent Platform Notice",
    content: (
      <>
        <div className="rounded-2xl border border-amber-400/30 bg-amber-400/10 p-4 sm:p-5">
          <div className="flex items-center gap-2 font-bold text-amber-600 dark:text-amber-400">
            <SecureExamSVG className="size-5 shrink-0" />
            <span>Independent Prep Platform Notice</span>
          </div>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            {APP_NAME} is an independent educational technology platform developed to assist students in preparing for their board examinations. Unless explicitly stated, {APP_NAME} is <strong>not officially affiliated with, sponsored by, or endorsed by</strong> the Aga Khan University Examination Board (AKUEB), the Board of Secondary Education Karachi (BSEK), the Board of Intermediate Education Karachi (BIEK), or other regional examination boards. All board names, examination titles, and syllabi references are used solely for descriptive educational indexing purposes under fair use.
          </p>
        </div>
        <p className="mt-4">
          <strong>AI Output Advisory:</strong> Nova AI and our automated marking mechanisms are designed as diagnostic study aids. While we continually calibrate our models against official syllabi and marking rubrics, AI evaluations are generated computationally and do not guarantee specific official examination grades or outcomes. Students should verify critical syllabus requirements with their official school instructors.
        </p>
      </>
    ),
  },
  {
    id: "accounts",
    title: "4. Account Registration, Security & Roles",
    content: (
      <>
        <p>
          When you register on {APP_NAME}, you agree to provide truthful, accurate, and current information. You are solely responsible for safeguarding the secrecy of your login credentials and for all activities occurring under your account.
        </p>
        <ul className="mt-2 list-disc space-y-1.5 pl-5">
          <li><strong>Student Accounts:</strong> Must accurately reflect your enrolled school, grade level, and examination board focus to ensure proper curriculum delivery.</li>
          <li><strong>Teacher Accounts:</strong> Must represent legitimate instructional staff affiliated with an educational institution.</li>
          <li><strong>School Accounts:</strong> Authorized representatives registering an institution warrant that they possess legal authority to enroll students and manage school data.</li>
        </ul>
        <p className="mt-3">
          You must immediately notify us at <a href="mailto:support@exboardai.tech" className="font-semibold text-primary dark:text-logo-green underline underline-offset-2 hover:opacity-80">support@exboardai.tech</a> if you suspect any unauthorized access or breach of account security.
        </p>
      </>
    ),
  },
  {
    id: "acceptable-use",
    title: "5. Academic Integrity & Acceptable Use Policy",
    content: (
      <>
        <p>We are dedicated to fostering a supportive, honest, and productive academic community. You agree <strong>not</strong> to:</p>
        <ul className="mt-2 list-disc space-y-1.5 pl-5">
          <li>Use the platform or Nova AI to cheat during live, proctored school examinations or formal assessments.</li>
          <li>Circulate abusive, harassing, defamatory, obscene, or hateful text or images in chat sessions, usernames, or challenge rooms.</li>
          <li>Attempt to reverse engineer, decompile, scrape, crawl, or extract questions, answer banks, or proprietary code from the platform using automated bots or scripts.</li>
          <li>Bypass or tamper with rate limits, subscription boundaries, anti-cheat mechanisms, or security verifications.</li>
          <li>Impersonate any student, teacher, school administrator, or {APP_NAME} staff member.</li>
          <li>Introduce viruses, malware, trojans, or malicious payloads into the system.</li>
        </ul>
        <p className="mt-3">
          Violations of this policy will result in immediate suspension or permanent termination of your account, and may be reported to your registered school.
        </p>
      </>
    ),
  },
  {
    id: "intellectual-property",
    title: "6. Intellectual Property Rights",
    content: (
      <>
        <p>
          All software, visual interfaces, website designs, graphics, interactive laboratory engines, Nova AI persona, sound effects, algorithms, and documentation are the exclusive property of {APP_NAME} and MacroPulse Systems or our licensors, protected by copyright, trademark, and intellectual property laws.
        </p>
        <p className="mt-3">
          We grant you a non-exclusive, non-transferable, revocable license to access and use {APP_NAME} solely for your personal, non-commercial study, or internal instructional use within your authorized school classrooms. You may not sell, redistribute, license, or create derivative works based upon platform software without our express written permission.
        </p>
      </>
    ),
  },
  {
    id: "user-content",
    title: "7. User Submissions & Uploaded Work",
    content: (
      <>
        <p>
          You retain full ownership of the original text, notes, and handwritten answers you submit to {APP_NAME}. By uploading your responses or questions, you grant us a limited, worldwide, royalty-free license to store, process, digitize, and analyze such content solely to generate assessment scores, feedback, and study analytics for you and your assigned educators.
        </p>
      </>
    ),
  },
  {
    id: "beta-pricing",
    title: "8. Public Beta Access, Subscriptions & Fees",
    content: (
      <>
        <p>
          {APP_NAME} is currently offered to students and schools in a public beta release. During this promotional period, access to core past papers, Nova AI queries, and standard features is provided free of charge.
        </p>
        <p className="mt-3">
          We reserve the right to introduce premium tiers, institutional subscriptions, or optional paid features in future releases. Any transition to paid tiers will be clearly announced in advance, and no charges will ever be applied to your account without your explicit affirmative consent.
        </p>
      </>
    ),
  },
  {
    id: "termination",
    title: "9. Termination & Account Cancellation",
    content: (
      <>
        <p>
          You may terminate your account at any time through your Profile Settings or by emailing <a href="mailto:support@exboardai.tech" className="text-primary underline">support@exboardai.tech</a>. We reserve the right, without prior notice or liability, to suspend or terminate accounts that breach these Terms, engage in academic dishonesty, or compromise platform infrastructure.
        </p>
      </>
    ),
  },
  {
    id: "limitation-liability",
    title: "10. Disclaimers & Limitation of Liability",
    content: (
      <>
        <p>
          {APP_NAME} is provided on an &ldquo;as is&rdquo; and &ldquo;as available&rdquo; basis without warranties of any kind, whether express or implied, including but not limited to implied warranties of merchantability, fitness for a particular academic purpose, or non-infringement.
        </p>
        <p className="mt-3">
          To the maximum extent permitted by applicable law, MacroPulse Systems and {APP_NAME} will not be liable for any indirect, incidental, punitive, or consequential damages, or any loss of data, grades, academic standing, or exam outcomes arising from your use of or inability to access the platform.
        </p>
      </>
    ),
  },
  {
    id: "governing-law",
    title: "11. Governing Law & Dispute Resolution",
    content: (
      <>
        <p>
          These Terms and any dispute arising from or related to your use of {APP_NAME} shall be governed by and construed in accordance with the laws of Pakistan, without regard to its conflict of law provisions. Any dispute shall first be addressed through good-faith informal negotiations between the parties before seeking legal relief in competent courts.
        </p>
      </>
    ),
  },
  {
    id: "modifications",
    title: "12. Modifications to Terms",
    content: (
      <>
        <p>
          We reserve the right to modify or replace these Terms at any time. When material changes are made, we will update the date at the top of this page and post a notification in the app. Your continued use of the platform after the effective date of revised Terms constitutes your acceptance of the changes.
        </p>
      </>
    ),
  },
  {
    id: "contact",
    title: "13. Contact & Inquiries",
    content: (
      <>
        <p>For legal inquiries, institutional agreements, or questions about these Terms, reach out to us:</p>
        <div className="mt-4 rounded-2xl border border-border bg-card p-5">
          <p className="text-sm font-bold text-foreground">{APP_NAME} Legal &amp; Compliance</p>
          <p className="mt-1 text-sm text-muted-foreground">MacroPulse Systems</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Email:{" "}
            <a href="mailto:support@exboardai.tech" className="font-semibold text-primary dark:text-logo-green underline underline-offset-2 hover:opacity-80">
              support@exboardai.tech
            </a>
          </p>
          <p className="mt-1 text-sm text-muted-foreground">Response window: 24–48 business hours</p>
        </div>
      </>
    ),
  },
];

export default function TermsPage() {
  return (
    <MarketingLayout>
      <div className="relative overflow-hidden bg-background">
        <div className="pointer-events-none absolute -top-40 left-1/2 -z-0 h-96 w-full max-w-4xl -translate-x-1/2 rounded-full bg-primary/10 blur-3xl dark:bg-logo-green/10" />

        {/* Hero Header */}
        <section className="relative px-4 pt-28 pb-12 sm:px-6 sm:pt-36 sm:pb-16 lg:px-8">
          <div className="mx-auto max-w-4xl text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider text-primary dark:border-logo-green/30 dark:bg-logo-green/15 dark:text-logo-green">
              <BookOpenSVG className="size-3.5 text-primary dark:text-logo-green" /> Legal Terms of Service
            </span>
            <h1 className="mt-6 text-4xl font-black tracking-tight text-foreground sm:text-5xl lg:text-6xl">
              Terms &amp; Conditions
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-base text-muted-foreground sm:text-lg">
              The rules, rights, and academic integrity commitments that govern your use of {APP_NAME}.
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-4 text-xs font-medium text-muted-foreground">
              <span>Effective Date: October 1, 2026</span>
              <span>•</span>
              <span>App Version: 2.4.0</span>
              <span>•</span>
              <span>MacroPulse Systems</span>
            </div>
          </div>
        </section>

        {/* Highlights Row */}
        <section className="px-4 pb-12 sm:px-6 lg:px-8">
          <div className="mx-auto grid max-w-4xl gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-border bg-card p-5 shadow-xs transition-colors hover:border-primary/30 dark:hover:border-logo-green/30">
              <span className="flex size-10 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-primary dark:border-logo-green/30 dark:bg-logo-green/15 dark:text-logo-green shadow-xs">
                <BookOpenSVG className="size-5 text-primary dark:text-logo-green" />
              </span>
              <h3 className="mt-3.5 text-sm font-bold text-foreground">Academic Integrity</h3>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                Platform tools and Nova AI are intended strictly to enhance learning and revision.
              </p>
            </div>
            <div className="rounded-2xl border border-border bg-card p-5 shadow-xs transition-colors hover:border-primary/30 dark:hover:border-logo-green/30">
              <span className="flex size-10 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-primary dark:border-logo-green/30 dark:bg-logo-green/15 dark:text-logo-green shadow-xs">
                <SparklesSVG className="size-5 text-primary dark:text-logo-green" />
              </span>
              <h3 className="mt-3.5 text-sm font-bold text-foreground">Transparent AI</h3>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                AI feedback and marking are formative study diagnostics calibrated to board rubrics.
              </p>
            </div>
            <div className="rounded-2xl border border-border bg-card p-5 shadow-xs transition-colors hover:border-primary/30 dark:hover:border-logo-green/30">
              <span className="flex size-10 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-primary dark:border-logo-green/30 dark:bg-logo-green/15 dark:text-logo-green shadow-xs">
                <SecureExamSVG className="size-5 text-primary dark:text-logo-green" />
              </span>
              <h3 className="mt-3.5 text-sm font-bold text-foreground">Protected Content</h3>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                You retain ownership of your submitted work while enjoying secure learning tools.
              </p>
            </div>
          </div>
        </section>

        {/* Content Body */}
        <section className="px-4 pb-24 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl rounded-3xl border border-border bg-card/70 p-6 shadow-sm backdrop-blur-xs sm:p-10 lg:p-12">
            <div className="divide-y divide-border/60">
              {SECTIONS.map((sec, idx) => (
                <div key={sec.id} className={idx === 0 ? "pb-8" : "py-8"}>
                  <h2 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
                    {sec.title}
                  </h2>
                  <div className="mt-4 text-sm leading-relaxed text-muted-foreground sm:text-base">
                    {sec.content}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-12 flex flex-col items-center justify-between gap-4 rounded-2xl border border-primary/20 bg-primary/5 p-6 text-center sm:flex-row sm:text-left dark:border-logo-green/30 dark:bg-logo-green/10">
              <div>
                <p className="text-sm font-bold text-foreground">Have questions about our terms?</p>
                <p className="mt-0.5 text-xs text-muted-foreground">Review our Privacy Policy or reach out to our legal team.</p>
              </div>
              <div className="flex gap-3">
                <Link
                  href={FRONTEND_ROUTES.PRIVACY}
                  className="rounded-xl border border-border bg-card px-4 py-2 text-xs font-bold text-foreground transition-colors hover:border-primary/40 hover:text-primary dark:hover:border-logo-green/40 dark:hover:text-logo-green"
                >
                  Privacy Policy
                </Link>
                <a
                  href="mailto:support@exboardai.tech"
                  className="rounded-xl bg-primary px-4 py-2 text-xs font-bold text-primary-foreground transition-opacity hover:opacity-90 dark:bg-logo-green dark:text-black"
                >
                  Contact Support
                </a>
              </div>
            </div>
          </div>
        </section>
      </div>
    </MarketingLayout>
  );
}
