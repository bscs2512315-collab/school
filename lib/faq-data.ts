export interface FAQItem {
  question: string;
  answer: string;
}

export const FAQS: FAQItem[] = [
  {
    question: "What examination boards and classes does ExBoard AI support?",
    answer:
      "ExBoard AI is tailored specifically for the Aga Khan University Examination Board (AKUEB) and all Sindh Educational Boards (BSEK/BIEK Karachi, Hyderabad, Sukkur, Larkana, Mirpurkhas, Nawabshah). We support Class IX (SSC-I), Class X (SSC-II), Class XI (HSC-I), and Class XII (HSC-II) across Pre-Medical, Pre-Engineering, Computer Science, and General Science groups.",
  },
  {
    question: "How does Nova AI evaluate Paper 2 Constructed Response Questions (CRQs)?",
    answer:
      "Our AI engine is trained on official board marks distribution schemes and Student Learning Outcomes (SLOs). When you submit written answers, it grades method steps, formula derivations, key technical terminology, diagrams, and numerical units, returning a point-by-point breakdown with model answers and tips for improvement.",
  },
  {
    question: "Is ExBoard AI free for students?",
    answer:
      "Yes! During our public launch, students can access all Paper 1 (MCQs) practice simulations, Paper 2 (CRQ) questions, verified practical journal write-ups (Physics, Chemistry, Biology), SLO curriculum maps, solved notes, and Nova AI assistance completely free of charge.",
  },
  {
    question: "How do teachers and schools utilize ExBoard AI?",
    answer:
      "Teachers can set up digital classrooms, generate customized chapter-wise papers in under 30 seconds using our Papers Bank or SLO generator, schedule timed assignments with anti-cheat fullscreen lock, launch live Lightning Battle Arenas for interactive revision, and track cohort analytics effortlessly.",
  },
  {
    question: "Can I install ExBoard AI on my phone or laptop?",
    answer:
      "Yes! ExBoard AI is built as a lightweight Progressive Web App (PWA). You can install it directly onto Android, iPhone, iPad, Windows, or Mac from your browser with zero app store delays, complete with offline resilience and instant loading.",
  },
  {
    question: "What is the Papers Bank and how does it save study time?",
    answer:
      "The Papers Bank is a centralized library of community-created and teacher-verified mock exams, prelim papers, and chapter-wise tests. Instead of searching across disconnected PDFs, students and educators can instantly solve, clone, or assign ready-made tests with full answer keys.",
  },
];
