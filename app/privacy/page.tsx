import type { Metadata } from "next";
import Link from "next/link";
import { MarketingLayout } from "@/components/marketing/MarketingLayout";
import { SITE } from "@/lib/site";
import { APP_NAME } from "@/constants";
import { FRONTEND_ROUTES } from "@/constants/endpoints";
import SecureExamSVG from "@/public/svgs/SecureExamSVG";
import SparklesSVG from "@/public/svgs/SparklesSVG";

export const metadata: Metadata = {
  title: `Privacy Policy — ${APP_NAME}`,
  description:
    `Learn how ${APP_NAME} collects, protects, and uses your personal and academic information. Built with strict student privacy and data security standards.`,
  alternates: { canonical: "/privacy" },
  openGraph: {
    title: `Privacy Policy — ${APP_NAME}`,
    description:
      `Our commitment to student data protection, minor safety, and transparent AI handling at ${APP_NAME}.`,
    url: `${SITE.url}/privacy`,
    type: "website",
  },
};

const SECTIONS = [
  {
    id: "overview",
    title: "1. Introduction & Overview",
    content: (
      <>
        <p>
          Welcome to <strong>{APP_NAME}</strong> (&ldquo;we,&rdquo; &ldquo;our,&rdquo; or &ldquo;us&rdquo;), an educational technology platform powered by <strong>MacroPulse Systems</strong>. We provide digital examination preparation tools, past paper assessments, AI-driven marking, and interactive tutoring for secondary and higher secondary students (Classes IX through XII) preparing for <strong>Aga Khan University Examination Board (AKUEB)</strong> and <strong>Sindh Board</strong> exams, as well as tools for teachers, schools, and educational institutions.
        </p>
        <p className="mt-3">
          We believe that student data must be treated with the highest degree of respect, confidentiality, and care. This Privacy Policy outlines what information we collect, why we collect it, how it is secured, and your rights regarding your personal and academic records.
        </p>
        <p className="mt-3">
          By accessing or using {APP_NAME}, you acknowledge that you have read and understood this Privacy Policy. If you do not agree with our practices, please discontinue using the platform.
        </p>
      </>
    ),
  },
  {
    id: "data-collection",
    title: "2. Information We Collect",
    content: (
      <>
        <p>We collect information in three ways: information you provide directly, academic data generated during study, and technical usage telemetry.</p>
        
        <h4 className="mt-4 text-base font-bold text-foreground">A. Information You Provide Directly</h4>
        <ul className="mt-2 list-disc space-y-1.5 pl-5">
          <li><strong>Student Accounts:</strong> Full name, username, email address, password (stored using one-way cryptographic hashing), date of birth, gender, father&apos;s name (for verification), school name, class/grade level (Class IX–XII), and chosen study stream (e.g., Pre-Medical, Pre-Engineering, Computer Science, General Science).</li>
          <li><strong>Teacher Accounts:</strong> Full name, institutional or work email, school affiliation, subjects taught, classes managed, and examination board focus.</li>
          <li><strong>School Accounts:</strong> Institution name, city, official contact person, phone number, address, and estimated student count.</li>
        </ul>

        <h4 className="mt-4 text-base font-bold text-foreground">B. Academic &amp; Assessment Records</h4>
        <ul className="mt-2 list-disc space-y-1.5 pl-5">
          <li>Past paper attempts across Paper I (multiple-choice questions) and Paper II (constructed-response and extended-response questions).</li>
          <li>Practice quiz responses, completion timestamps, scores, confidence metrics, and chapter-wise mastery progress.</li>
          <li>Classroom assignment submissions, live challenge participations, milestone achievements, and leaderboard rankings.</li>
        </ul>

        <h4 className="mt-4 text-base font-bold text-foreground">C. AI Tutor &amp; Upload Data</h4>
        <ul className="mt-2 list-disc space-y-1.5 pl-5">
          <li>Prompts, academic questions, and conversation messages exchanged with our AI tutor, <strong>Nova</strong>.</li>
          <li>Uploaded images or scanned handwritten answers submitted for AI optical character recognition (OCR) and rubrics-based grading.</li>
        </ul>

        <h4 className="mt-4 text-base font-bold text-foreground">D. Technical &amp; Device Information</h4>
        <ul className="mt-2 list-disc space-y-1.5 pl-5">
          <li>IP address, browser type, device specifications, operating system, and anonymous diagnostic logs to maintain platform availability, prevent fraud, and optimize performance.</li>
        </ul>
      </>
    ),
  },
  {
    id: "how-we-use-data",
    title: "3. How We Use Your Information",
    content: (
      <>
        <p>We use your information exclusively for legitimate educational and operational purposes, including:</p>
        <ul className="mt-2 list-disc space-y-1.5 pl-5">
          <li><strong>Delivering Learning Services:</strong> Administering interactive past papers, evaluating answers against official board marking schemes, and diagnosing concept weaknesses.</li>
          <li><strong>Personalized Feedback:</strong> Providing step-by-step solutions, revision roadmaps, and custom practice papers generated around syllabus areas requiring focus.</li>
          <li><strong>Classroom &amp; Teacher Insights:</strong> Enabling authorized teachers and school administrators to view classroom rosters, track student performance, and assign targeted practice.</li>
          <li><strong>Competitive &amp; Motivation Features:</strong> Displaying student usernames and points on city-wide and national leaderboards, badges, and milestone trackers.</li>
          <li><strong>Security &amp; Abuse Prevention:</strong> Verifying account authenticity, preventing multi-account gaming or spam, and safeguarding student sessions.</li>
        </ul>
      </>
    ),
  },
  {
    id: "student-minor-privacy",
    title: "4. Student & Minor Privacy Commitment",
    content: (
      <>
        <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 sm:p-5 dark:border-logo-green/30 dark:bg-logo-green/10">
          <div className="flex items-center gap-2 font-bold text-primary dark:text-logo-green">
            <SecureExamSVG className="size-5 shrink-0 text-primary dark:text-logo-green" />
            <span>Zero Commercial Monetization of Student Data</span>
          </div>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            We do <strong>not</strong> sell, rent, or trade student personal records or academic histories to third parties. We do <strong>not</strong> build commercial behavioral advertising profiles around students.
          </p>
        </div>
        <p className="mt-4">
          Because many of our student learners are minors (under 18 years of age), we collect only the personal information strictly necessary to provide our educational services. Where students register through their schools, the institution acts as an authorized educational partner facilitating account creation. Parents or legal guardians may review or request deletion of their child&apos;s personal records at any time by contacting our support team.
        </p>
      </>
    ),
  },
  {
    id: "ai-data-handling",
    title: "5. Nova AI & Automated Grading Data Handling",
    content: (
      <>
        <p>
          Our AI tutor, <strong>Nova</strong>, and automated assessment grading engines use enterprise-grade, confidential AI processing pipelines.
        </p>
        <ul className="mt-2 list-disc space-y-1.5 pl-5">
          <li><strong>No Public Model Training:</strong> Your private questions, uploaded handwritten exam sheets, and study queries are <strong>not</strong> used to train public commercial AI models without explicit institutional or user consent.</li>
          <li><strong>Strict Context Boundaries:</strong> Nova operates under strict educational system guardrails aligned with official AKUEB and Sindh Board syllabi and student safety guidelines.</li>
          <li><strong>Human Oversight:</strong> AI-generated marks and feedback on Paper II submissions are intended as formative learning diagnostic aids. Teachers and students always have access to full original answer keys and rubric breakdowns.</li>
        </ul>
      </>
    ),
  },
  {
    id: "data-sharing",
    title: "6. When We Share Information",
    content: (
      <>
        <p>We do not disclose your personal information to third parties except under the following controlled circumstances:</p>
        <ul className="mt-2 list-disc space-y-1.5 pl-5">
          <li><strong>With Your School or Teacher:</strong> If you join a school-managed classroom or register with an institutional code, your verified teachers and school administrators can view your assignments, mock test attempts, scores, and attendance.</li>
          <li><strong>Public Leaderboards:</strong> Only your public screen username, school affiliation, and earned points appear on the public leaderboard. Your email address, phone number, and private account details are never made public.</li>
          <li><strong>Trusted Infrastructure Providers:</strong> We work with vetted cloud hosting, database management, and email delivery partners (e.g., secure data centers, transactional mail services) bound by strict confidentiality and data protection agreements.</li>
          <li><strong>Legal &amp; Safety Requirements:</strong> We may disclose information if required to comply with a valid legal court order, subpoena, or governmental regulation, or to prevent immediate physical harm or severe platform tampering.</li>
        </ul>
      </>
    ),
  },
  {
    id: "security",
    title: "7. Data Security & Encryption",
    content: (
      <>
        <p>We implement robust technical and organizational security measures to protect your data:</p>
        <ul className="mt-2 list-disc space-y-1.5 pl-5">
          <li><strong>In-Transit Encryption:</strong> All communications between your device and our servers are encrypted using modern Transport Layer Security (TLS 1.3 / HTTPS).</li>
          <li><strong>At-Rest Protection:</strong> Databases and sensitive credentials are encrypted at rest with industry-standard cryptographic primitives. Passwords are never stored in plaintext.</li>
          <li><strong>Access Controls:</strong> Access to production databases and student records is restricted strictly to authorized engineering personnel subject to multi-factor authentication and audit logging.</li>
        </ul>
      </>
    ),
  },
  {
    id: "retention-rights",
    title: "8. Data Retention, Export & Deletion Rights",
    content: (
      <>
        <p>
          We retain your personal data for as long as your account remains active or as needed to provide you with continuous academic revision records.
        </p>
        <p className="mt-3">
          You have the following rights at any time:
        </p>
        <ul className="mt-2 list-disc space-y-1.5 pl-5">
          <li><strong>Access &amp; Export:</strong> Request a summary or copy of your profile and assessment history.</li>
          <li><strong>Rectification:</strong> Correct or update inaccurate personal details directly in your account settings or by contacting support.</li>
          <li><strong>Account Deletion:</strong> Request permanent deletion of your account and associated personal data. Upon receiving a verified request, we will expunge your records from our active systems within 30 business days, retaining only what is legally required for compliance or fraud prevention.</li>
        </ul>
      </>
    ),
  },
  {
    id: "cookies",
    title: "9. Cookies & Local Storage",
    content: (
      <>
        <p>
          {APP_NAME} uses essential cookies and local storage tokens strictly necessary to maintain your authenticated login session, keep your light/dark theme preference, and preserve offline quiz attempt state. We do not use third-party behavioral advertising cookies to track you across external websites.
        </p>
      </>
    ),
  },
  {
    id: "policy-updates",
    title: "10. Updates to This Policy",
    content: (
      <>
        <p>
          We may periodically update this Privacy Policy to reflect enhancements in our educational features, AI capabilities, or applicable regulations. When material modifications occur, we will update the &ldquo;Last Updated&rdquo; date at the top of this document and notify active users via in-app banner or email. Your continued use of {APP_NAME} following notification signifies acceptance of the revised policy.
        </p>
      </>
    ),
  },
  {
    id: "contact",
    title: "11. Contact Our Privacy Team",
    content: (
      <>
        <p>
          If you have questions, feedback, or concerns regarding your privacy, minor safety, or data handling practices, please contact our team:
        </p>
        <div className="mt-4 rounded-2xl border border-border bg-card p-5">
          <p className="text-sm font-bold text-foreground">{APP_NAME} Privacy &amp; Legal Operations</p>
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

export default function PrivacyPolicyPage() {
  return (
    <MarketingLayout>
      <div className="relative overflow-hidden bg-background">
        <div className="pointer-events-none absolute -top-40 left-1/2 -z-0 h-96 w-full max-w-4xl -translate-x-1/2 rounded-full bg-primary/10 blur-3xl dark:bg-logo-green/10" />

        {/* Hero Header */}
        <section className="relative px-4 pt-28 pb-12 sm:px-6 sm:pt-36 sm:pb-16 lg:px-8">
          <div className="mx-auto max-w-4xl text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider text-primary dark:border-logo-green/30 dark:bg-logo-green/15 dark:text-logo-green">
              <SecureExamSVG className="size-3.5 text-primary dark:text-logo-green" /> Legal &amp; Transparency
            </span>
            <h1 className="mt-6 text-4xl font-black tracking-tight text-foreground sm:text-5xl lg:text-6xl">
              Privacy Policy
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-base text-muted-foreground sm:text-lg">
              How {APP_NAME} safeguards student academic records, protects minors, and maintains transparent, ethical AI practices.
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

        {/* Key Guarantees Row */}
        <section className="px-4 pb-12 sm:px-6 lg:px-8">
          <div className="mx-auto grid max-w-4xl gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-border bg-card p-5 shadow-xs transition-colors hover:border-primary/30 dark:hover:border-logo-green/30">
              <span className="flex size-10 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-primary dark:border-logo-green/30 dark:bg-logo-green/15 dark:text-logo-green shadow-xs">
                <SecureExamSVG className="size-5 text-primary dark:text-logo-green" />
              </span>
              <h3 className="mt-3.5 text-sm font-bold text-foreground">Zero Data Selling</h3>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                We never sell or rent student data or study records to third-party advertisers.
              </p>
            </div>
            <div className="rounded-2xl border border-border bg-card p-5 shadow-xs transition-colors hover:border-primary/30 dark:hover:border-logo-green/30">
              <span className="flex size-10 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-primary dark:border-logo-green/30 dark:bg-logo-green/15 dark:text-logo-green shadow-xs">
                <SparklesSVG className="size-5 text-primary dark:text-logo-green" />
              </span>
              <h3 className="mt-3.5 text-sm font-bold text-foreground">Private AI Tutoring</h3>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                Student queries and handwritten exam uploads are not fed into public foundation models.
              </p>
            </div>
            <div className="rounded-2xl border border-border bg-card p-5 shadow-xs transition-colors hover:border-primary/30 dark:hover:border-logo-green/30">
              <span className="flex size-10 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-primary dark:border-logo-green/30 dark:bg-logo-green/15 dark:text-logo-green shadow-xs">
                <SecureExamSVG className="size-5 text-primary dark:text-logo-green" />
              </span>
              <h3 className="mt-3.5 text-sm font-bold text-foreground">Student Safety First</h3>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                Designed to comply with rigorous minor data protection and classroom oversight standards.
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
                <p className="text-sm font-bold text-foreground">Need clarification on our terms or policies?</p>
                <p className="mt-0.5 text-xs text-muted-foreground">Our support and compliance desk is here to assist students, parents, and schools.</p>
              </div>
              <div className="flex gap-3">
                <Link
                  href={FRONTEND_ROUTES.TERMS}
                  className="rounded-xl border border-border bg-card px-4 py-2 text-xs font-bold text-foreground transition-colors hover:border-primary/40 hover:text-primary dark:hover:border-logo-green/40 dark:hover:text-logo-green"
                >
                  Terms &amp; Conditions
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
