export interface GuideStep {
  title: string;
  subtitle?: string;
  description: string;
  details?: string[];
  tips?: string[];
  callout?: {
    type: "tip" | "important" | "note";
    text: string;
  };
}

export interface GuideArticle {
  slug: string;
  title: string;
  shortTitle: string;
  category: "Getting Started" | "Exam Prep" | "AI & Features" | "Teachers & Schools" | "Gamification";
  badge: string;
  description: string;
  readTime: string;
  lastUpdated: string;
  heroHighlight: string;
  steps: GuideStep[];
  faqs: { question: string; answer: string }[];
  relatedSlugs: string[];
}

export const GUIDE_CATEGORIES = [
  "All Guides",
  "Getting Started",
  "Exam Prep",
  "AI & Features",
  "Teachers & Schools",
  "Gamification",
] as const;

export const GUIDES: GuideArticle[] = [
  {
    slug: "how-to-sign-up",
    title: "How to Sign Up & Create Your Account",
    shortTitle: "Account Creation",
    category: "Getting Started",
    badge: "✦ 1 min setup",
    description:
      "Step-by-step guide to registering as a Student or Teacher on ExBoard AI, choosing your examination board (AKUEB / Sindh Board), and customizing your academic stream.",
    readTime: "2 min read",
    lastUpdated: "October 2026",
    heroHighlight: "Get started for free in under 60 seconds. No credit card required.",
    steps: [
      {
        title: "Step 1: Navigate to the Registration Page",
        subtitle: "Visit the Sign Up portal",
        description:
          "Open exboardai.tech on any mobile or desktop browser and click the 'Sign Up' or 'Get Started Free' button located in the top navigation bar.",
        tips: [
          "You can also install ExBoard AI as a Progressive Web App (PWA) directly to your home screen for instant 1-tap access.",
        ],
      },
      {
        title: "Step 2: Choose Your Account Role",
        subtitle: "Student vs Teacher vs School",
        description:
          "Select whether you are joining as a Student (to practice past papers, battle friends, and receive AI tutor help) or as a Teacher / School (to manage classrooms, assign papers, and monitor class performance).",
        details: [
          "Students get access to Play & Prep, Nova AI Tutor, Solved Notes, and Leaderboards.",
          "Teachers get the Paper Generator, Anti-Cheat Exam Lockdown, and Automated Grading Suite.",
        ],
      },
      {
        title: "Step 3: Enter Your Profile & Academic Details",
        subtitle: "Board, Class & Subject Group",
        description:
          "Fill in your basic information (Full Name, Username, Email, Password). Then specify your examination details:",
        details: [
          "Examination Board: Aga Khan University Examination Board (AKUEB) or Sindh Board (Karachi, Sukkur, Hyderabad, etc.).",
          "Grade / Class Level: Class IX (SSC-I), Class X (SSC-II), Class XI (HSC-I), or Class XII (HSC-II).",
          "Academic Stream: Pre-Medical, Pre-Engineering, Computer Science, or General Science.",
        ],
        callout: {
          type: "tip",
          text: "Selecting the correct Board and Class ensures your syllabus, SLO learning outcomes, and past papers are 100% aligned with your exact exam.",
        },
      },
      {
        title: "Step 4: Verify Your Email & Log In",
        subtitle: "Instant OTP Confirmation",
        description:
          "Check your email inbox for a 6-digit verification code. Enter the code on screen to activate your account. You will be redirected straight to your personalized Student Dashboard!",
        tips: [
          "If you don't receive the OTP within 60 seconds, check your spam/promotions folder or click 'Resend Code'.",
        ],
      },
    ],
    faqs: [
      {
        question: "Is signing up on ExBoard AI completely free?",
        answer:
          "Yes! Creating an account and practicing past papers, accessing practical journals, and chatting with Nova AI tutor is completely free during our public beta.",
      },
      {
        question: "Can I change my class or subjects after signing up?",
        answer:
          "Yes. You can update your class grade, subject stream, or switch boards at any time from your Account Settings page.",
      },
    ],
    relatedSlugs: ["what-is-play-and-prep", "how-to-solve-past-papers", "asking-nova-ai-tutor"],
  },
  {
    slug: "what-is-play-and-prep",
    title: "What is Play & Prep? (Smart Exam Practice)",
    shortTitle: "Play & Prep Explained",
    category: "Exam Prep",
    badge: "★ Core Feature",
    description:
      "Learn how to use Play & Prep to generate customized chapter-wise papers, choose between Paper 1 (MCQs) and Paper 2 (CRQs), and train for your board exams.",
    readTime: "3 min read",
    lastUpdated: "October 2026",
    heroHighlight: "Transform boring revision into active, game-like mastery with tailored exam practice modes.",
    steps: [
      {
        title: "Step 1: Open the Play & Prep Generator",
        subtitle: "From your Student Dashboard",
        description:
          "Click 'Play & Prep' on the left navigation sidebar or tap the quick action button on your dashboard. This opens the Practice Mode Selector.",
        details: [
          "Full Past Papers: Real board examination papers from 2017 to 2024.",
          "SLO Chapter-Wise Papers: Targeted exams generated across specific syllabus chapters you pick.",
          "Custom Material Quiz: Create tests based on your lecture notes or uploaded text.",
        ],
      },
      {
        title: "Step 2: Select Your Paper Type (Paper 1 vs Paper 2)",
        subtitle: "MCQs vs Constructed Response Questions",
        description:
          "Choose the format you want to practice for your upcoming examination:",
        details: [
          "Paper 1 (Multiple Choice Questions): 25 to 50 MCQs with instant answer validation, per-question timer countdown, and score breakdowns.",
          "Paper 2 (Constructed & Extended Response): Short CRQs and detailed ERQs with step-by-step marking rubrics and model answers.",
        ],
      },
      {
        title: "Step 3: Pick Your Subject & Target Chapters",
        subtitle: "Zero in on your weak topics",
        description:
          "Select the subject you want to master (e.g., Physics, Chemistry, Biology, Mathematics, Computer Science, Urdu, Islamiat). Use the multi-select chapter pills to focus on the exact units you are currently revising in school.",
        callout: {
          type: "tip",
          text: "Practicing 2-3 chapters at a time is proven to improve retention by 40% compared to studying an entire textbook at once.",
        },
      },
      {
        title: "Step 4: Choose Your Challenge Mode",
        subtitle: "Solo Grind vs 1v1 Arena",
        description:
          "Pick how you want to attempt the session:",
        details: [
          "Solo Practice: Untimed or self-paced revision with instant hint reveals and explanations.",
          "Live Mock Exam: Full exam conditions with timer countdown and strict anti-cheat mode.",
          "1v1 Friend Challenge: Battle a classmate live in a rapid-fire arena to earn streak XP.",
        ],
      },
    ],
    faqs: [
      {
        question: "Can I save my generated papers to practice again later?",
        answer:
          "Yes! All generated papers are saved in your Exam History and can be shared to the community Papers Bank.",
      },
      {
        question: "How are marks calculated in Play & Prep?",
        answer:
          "MCQs award 1 mark per correct answer with zero penalty for wrong guesses. CRQs follow the official board rubrics (method marks + final answer marks).",
      },
    ],
    relatedSlugs: ["how-to-solve-past-papers", "asking-nova-ai-tutor", "leaderboards-and-rewards"],
  },
  {
    slug: "how-to-solve-past-papers",
    title: "How to Solve Past Papers & Submit Answers",
    shortTitle: "Solving Past Papers",
    category: "Exam Prep",
    badge: "📝 Step-by-Step",
    description:
      "A complete guide to navigating the digital exam interface, managing time per question, submitting Paper 1 and Paper 2 answers, and reviewing detailed solution breakdowns.",
    readTime: "3 min read",
    lastUpdated: "October 2026",
    heroHighlight: "Master the exam interface before your real board exam day.",
    steps: [
      {
        title: "Step 1: Launch Your Paper Attempt",
        subtitle: "Entering the Exam View",
        description:
          "Navigate to 'Past Papers' or start a paper from 'Play & Prep'. Click 'Start Attempt'. You will see the exam header with the remaining time countdown and subject details.",
      },
      {
        title: "Step 2: Answer Multiple Choice Questions (Paper 1)",
        subtitle: "Selecting & Reviewing Options",
        description:
          "Click on option A, B, C, or D. Your answer is automatically saved in real-time so you never lose progress even if your connection drops.",
        details: [
          "Use the bottom Question Navigator pills (1, 2, 3...) to jump between questions.",
          "Check the Progress Indicator at top-right to see how many questions remain unanswered.",
        ],
      },
      {
        title: "Step 3: Solve Constructed Response Questions (Paper 2)",
        subtitle: "CRQs & Numerical Problems",
        description:
          "For Paper 2, type your structured answer into the response box, or write your steps on paper and use the 'Upload Solution Photo' camera button to submit clear step-by-step workings.",
        callout: {
          type: "important",
          text: "Always include given data, formulas, substitution with units, and clear final statements for maximum method marks.",
        },
      },
      {
        title: "Step 4: Submit & Review Instant Results",
        subtitle: "Scoring, Solutions & Nova AI Feedback",
        description:
          "When finished, click 'Submit Exam'. You will immediately receive your final score, percentage, grade (A++, A+, B, etc.), XP points earned, and a question-by-question breakdown showing correct vs incorrect answers with full explanations.",
      },
    ],
    faqs: [
      {
        question: "What happens if my internet disconnects during an exam?",
        answer:
          "ExBoard AI automatically caches your responses locally. When your connection resumes, your progress syncs smoothly without losing your answers.",
      },
      {
        question: "Can I re-attempt a past paper to improve my score?",
        answer:
          "Yes! You can re-attempt any past paper as many times as you like from the Past Papers archive or your History page.",
      },
    ],
    relatedSlugs: ["what-is-play-and-prep", "asking-nova-ai-tutor", "papers-bank-guide"],
  },
  {
    slug: "asking-nova-ai-tutor",
    title: "Mastering Nova AI Tutor (24/7 Doubt Solver)",
    shortTitle: "Nova AI Tutor",
    category: "AI & Features",
    badge: "✦ 24/7 AI Tutor",
    description:
      "Learn how to ask Nova AI for concept explanations, step-by-step mathematical derivations, CRQ marking rubrics, and personalized study tips.",
    readTime: "2 min read",
    lastUpdated: "October 2026",
    heroHighlight: "Never get stuck on a difficult question again with your personalized board tutor.",
    steps: [
      {
        title: "Step 1: Open Nova AI Chat",
        subtitle: "Available on sidebar or in-exam help",
        description:
          "Click 'Nova AI Tutor' in the main menu or click the glowing 'Ask Nova' button whenever you encounter a tricky question during paper solving.",
      },
      {
        title: "Step 2: Ask Concept or Syllabus Questions",
        subtitle: "Clear, conversational prompts",
        description:
          "Type any question in English, Urdu, or mixed Roman Urdu. You can ask Nova about physics concepts, chemical equations, mathematical proofs, or biology diagrams.",
        tips: [
          "Example: 'Explain Lenz's Law and why it obeys the Law of Conservation of Energy.'",
          "Example: 'Show me step-by-step how to integrate sin^2(x) dx.'",
          "Example: 'What are the main differences between Mitosis and Meiosis for Class 10?'",
        ],
      },
      {
        title: "Step 3: Request Hints Instead of Direct Answers",
        subtitle: "Active Learning Mode",
        description:
          "Ask Nova: 'Give me a hint for Question 4 without telling me the answer' to test your own understanding first.",
      },
      {
        title: "Step 4: Understand the Marking Rubric",
        subtitle: "How to score full marks",
        description:
          "Ask Nova how board examiners grade specific 3-mark and 5-mark questions to ensure you include all required keywords and units in your actual exam.",
      },
    ],
    faqs: [
      {
        question: "Does Nova know the specific AKUEB and Sindh Board syllabi?",
        answer:
          "Yes! Nova is specifically trained on the official National Curriculum SLOs, past marking schemes, and standard textbook references.",
      },
    ],
    relatedSlugs: ["what-is-play-and-prep", "practical-journals-guide", "how-to-solve-past-papers"],
  },
  {
    slug: "practical-journals-guide",
    title: "Using Solved Practical Journals (Physics, Chemistry & Biology)",
    shortTitle: "Practical Journals",
    category: "Exam Prep",
    badge: "🔬 Lab Books",
    description:
      "How to access verified practical write-ups, apparatus lists, experimental procedures, observation tables, calculations, and viva questions for Class IX–XII.",
    readTime: "3 min read",
    lastUpdated: "October 2026",
    heroHighlight: "Complete your board practical journals with 100% verified experimental data and diagrams.",
    steps: [
      {
        title: "Step 1: Open Practical Journals",
        subtitle: "From navigation menu",
        description:
          "Click 'Practical Journals' on the sidebar or navigate to /practical-journals from the top bar.",
      },
      {
        title: "Step 2: Select Your Subject & Experiment",
        subtitle: "Physics, Chemistry, or Biology",
        description:
          "Browse the catalog of experiments organized by class grade. Click on any experiment (e.g., 'Determine the specific heat capacity of a solid', 'Newton\\'s Law of Cooling', 'Salt Analysis').",
      },
      {
        title: "Step 3: Review Full Journal Sections",
        subtitle: "Method, Observations & Graphs",
        description:
          "Each experiment includes complete write-up sections ready for your lab notebook:",
        details: [
          "Statement of Aim & Principle",
          "Required Apparatus & Labeled Diagrams",
          "Step-by-Step Procedure",
          "Observation Table with Sample Readings",
          "Formulae, Calculations & Percentage Error",
          "Precautions & Sources of Error",
        ],
      },
      {
        title: "Step 4: Practice Interactive 3D Lab Simulations",
        subtitle: "Virtual hands-on testing",
        description:
          "Click 'Open Interactive Lab' to experiment with virtual calorimeters, voltmeters, optical benches, and chemical reagents in real-time.",
      },
    ],
    faqs: [
      {
        question: "Are these practical journals accepted by AKUEB and Sindh Board examiners?",
        answer:
          "Yes. All write-ups strictly follow the official board practical syllabus and standard laboratory guidelines.",
      },
    ],
    relatedSlugs: ["what-is-play-and-prep", "how-to-solve-past-papers", "asking-nova-ai-tutor"],
  },
  {
    slug: "classrooms-and-teacher-tools",
    title: "Digital Classrooms, Assignments & Teacher Tools",
    shortTitle: "Teacher Classrooms",
    category: "Teachers & Schools",
    badge: "👨‍🏫 Educator Hub",
    description:
      "How teachers and schools create classrooms, generate custom exam papers in 30 seconds, schedule timed assignments with anti-cheat lockdown, and track student cohort analytics.",
    readTime: "3 min read",
    lastUpdated: "October 2026",
    heroHighlight: "Save 10+ hours a week on exam creation and grading with automated classroom tools.",
    steps: [
      {
        title: "Step 1: Create a Digital Classroom",
        subtitle: "For Teachers & School Admins",
        description:
          "Log in to your Teacher portal and click 'Classrooms' > 'Create New Classroom'. Name your classroom (e.g., 'Grade 10 Physics - Section A') and select your subject and board.",
      },
      {
        title: "Step 2: Invite Students with 6-Character Join Code",
        subtitle: "Zero-friction enrollment",
        description:
          "Share the generated 6-character classroom code with your students. Students enter this code on their dashboard to instantly join your classroom roster.",
      },
      {
        title: "Step 3: Generate and Assign Custom Exam Papers",
        subtitle: "Paper Generator in 30 Seconds",
        description:
          "Click 'Create Paper', pick your chapter topics, select question distribution, and configure exam settings:",
        details: [
          "Set assignment deadline and duration limit.",
          "Enable Strict Exam Mode (fullscreen lock + anti-cheat tab-switch detection).",
          "Allow or restrict pausing/resuming attempts.",
        ],
      },
      {
        title: "Step 4: View Real-Time Class Analytics & Gradebook",
        subtitle: "Automated scoring and student insights",
        description:
          "Access the Teacher Dashboard to view average class scores, identify common topic misconceptions, review individual student answer sheets, and export gradebooks.",
      },
    ],
    faqs: [
      {
        question: "Can a teacher assign papers to multiple classrooms at once?",
        answer:
          "Yes! You can multi-select any number of classrooms when publishing an exam paper.",
      },
      {
        question: "Can teachers conduct live in-class battle rounds?",
        answer:
          "Yes! Launch a 'Lightning Battle Arena' for real-time live interactive quizzes on the classroom projector.",
      },
    ],
    relatedSlugs: ["papers-bank-guide", "what-is-play-and-prep", "how-to-sign-up"],
  },
  {
    slug: "leaderboards-and-rewards",
    title: "Leaderboards, Streaks & Achievement Badges",
    shortTitle: "Leaderboard & XP",
    category: "Gamification",
    badge: "🏆 Climb the Ranks",
    description:
      "Understand how ExBoard AI's gamification system works: earning XP points, maintaining daily study streaks, ranking on the provincial leaderboard, and unlocking tier badges.",
    readTime: "2 min read",
    lastUpdated: "October 2026",
    heroHighlight: "Make board exam revision competitive, motivating, and fun.",
    steps: [
      {
        title: "Step 1: Earn Experience Points (XP)",
        subtitle: "Every solved question counts",
        description:
          "You earn XP points for solving MCQs, submitting Paper 2 answers, completing daily quizzes, and maintaining study streaks.",
        details: [
          "+10 XP for every correct MCQ.",
          "+50 XP for completing a full past paper section.",
          "+100 XP for maintaining a 7-day study streak.",
          "+25 XP for winning a 1v1 Battle Arena match.",
        ],
      },
      {
        title: "Step 2: Maintain Your Daily Streak",
        subtitle: "Build consistent study habits",
        description:
          "Complete at least one practice quiz or solve 5 questions every day to keep your streak flame alive and multiply your weekly bonus XP.",
      },
      {
        title: "Step 3: Climb the Board Leaderboards",
        subtitle: "School, City & Provincial Rankings",
        description:
          "Check the 'Leaderboard' page to see your live position among students from your school, your city, and across all AKUEB and Sindh Board test-takers.",
      },
      {
        title: "Step 4: Unlock Achievement Badges & Tiers",
        subtitle: "From Novice to Grandmaster",
        description:
          "Progress through mastery tiers (Novice → Apprentice → Warrior → Scholar → Master → Grandmaster → Mythic → Legend) and display your rank badge on your public student profile.",
      },
    ],
    faqs: [
      {
        question: "When are leaderboard rankings updated?",
        answer:
          "Leaderboards update in real-time immediately as you finish and submit question attempts.",
      },
    ],
    relatedSlugs: ["what-is-play-and-prep", "how-to-solve-past-papers", "how-to-sign-up"],
  },
  {
    slug: "papers-bank-guide",
    title: "Exploring & Publishing in the Papers Bank",
    shortTitle: "Papers Bank",
    category: "Exam Prep",
    badge: "📚 Community Bank",
    description:
      "How to search, clone, practice, and share teacher-verified prelim papers, school mock exams, and chapter-wise tests in the public Papers Bank repository.",
    readTime: "2 min read",
    lastUpdated: "October 2026",
    heroHighlight: "Access thousands of curated mock tests created by top teachers and high-scoring students.",
    steps: [
      {
        title: "Step 1: Browse the Papers Bank",
        subtitle: "Discover community test papers",
        description:
          "Navigate to 'Papers Bank' from the student or teacher portal. Filter by Subject, Board, Class Grade, or Chapter Unit.",
      },
      {
        title: "Step 2: Inspect Paper Details & Question Previews",
        subtitle: "Verify syllabus alignment",
        description:
          "Click on any paper card to see total marks, question count, creator credentials (verified teacher or student), and chapter coverage tags.",
      },
      {
        title: "Step 3: Attempt or Clone the Paper",
        subtitle: "Instant Practice or Teacher Re-use",
        description:
          "Students can click 'Start Attempt' to solve the paper immediately under timed conditions. Teachers can click 'Assign to Class' to reuse the paper without consuming AI token quota.",
      },
      {
        title: "Step 4: Publish Your Own Practice Papers",
        subtitle: "Share with the community",
        description:
          "When generating custom papers in Play & Prep or the Teacher portal, toggle 'Visibility: Public' to add your paper to the community Papers Bank for others to benefit from.",
      },
    ],
    faqs: [
      {
        question: "Are all papers in the Papers Bank verified?",
        answer:
          "Yes! Papers published by verified school faculty display a green 'Verified Teacher' badge.",
      },
    ],
    relatedSlugs: ["what-is-play-and-prep", "classrooms-and-teacher-tools", "how-to-solve-past-papers"],
  },
  {
    slug: "how-to-reset-password",
    title: "How to Reset & Recover Your Password",
    shortTitle: "Password Recovery",
    category: "Getting Started",
    badge: "✦ 2 min recovery",
    description:
      "Step-by-step instructions for resetting your ExBoard AI account password using email OTP verification and setting a strong new password.",
    readTime: "2 min read",
    lastUpdated: "October 2026",
    heroHighlight: "Regain instant access to your student dashboard in 3 quick steps.",
    steps: [
      {
        title: "Step 1: Go to the Forgot Password Page",
        subtitle: "Request password reset",
        description:
          "Click 'Forgot your password?' on the Sign In page or navigate directly to /forgot-password. Enter the email address registered with your ExBoard AI account.",
      },
      {
        title: "Step 2: Enter the 6-Digit OTP Code",
        subtitle: "Check your email inbox",
        description:
          "Open your email to find the 6-digit security code. Enter it on the verification screen. If you don't receive it within 60 seconds, check spam or click Resend OTP.",
      },
      {
        title: "Step 3: Create Your New Secure Password",
        subtitle: "Set new credentials",
        description:
          "Enter your new password and confirm it. Ensure it meets the security criteria (at least 8 characters, with letters and numbers). Click 'Reset Password' to log in immediately.",
        tips: [
          "Once reset, all previous active sessions are refreshed, and you can immediately continue your exam preparation.",
        ],
      },
    ],
    faqs: [
      {
        question: "How long is the password reset OTP valid for?",
        answer:
          "Reset OTP codes expire after 10 minutes for your account security. You can request a fresh code anytime if it expires.",
      },
      {
        question: "What if I forgot my registered email address?",
        answer:
          "If you are linked to a school classroom, your teacher or institute administrator can look up your registered account identifier from the Teacher Console.",
      },
    ],
    relatedSlugs: ["how-to-sign-up", "how-to-solve-past-papers"],
  },
];

export function getGuideBySlug(slug: string): GuideArticle | undefined {
  return GUIDES.find((g) => g.slug === slug);
}
