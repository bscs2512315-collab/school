const ROUTE_TITLES: Record<string, string> = {
  generate: "Generate Paper",
  "past-papers-1": "Past Papers 1",
  "past-papers-2": "Past Papers 2",
  "attempt-paper2": "Attempt",
  nova: "Nova AI Tutor",
  curriculums: "Syllabus",
  classrooms: "Classrooms",
  "lab-game": "Lab Game",
  leaderboard: "Leaderboard",
  history: "History",
  friends: "Search Friends",
  challenge: "Challenge",
  settings: "Settings",
  notifications: "Notifications",
  "question-bank": "Question Bank",
  "review-questions": "Review Questions",
  "train-bot": "Train Bot",
  "teacher-papers": "Practice Test",
  "create-paper": "Create Paper",
  students: "Students",
  attempts: "Review Result",
  "practical-journals": "Practicals",
  "solved-notes": "Solved Notes",
  users: "User Management",
  network: "Network",
  bugs: "QA Bugs Tracker",
};

/** UUID / ObjectId / classroom composite ids should never appear as page titles */
function isDynamicIdSegment(segment: string): boolean {
  const seg = decodeURIComponent(segment);
  if (/^[0-9a-fA-F-]{24,36}$/.test(seg)) return true;
  // Classroom ids: `{uuid}__{subject}__{class}` or `...__private`
  if (seg.includes("__")) return true;
  // Generic long opaque tokens
  if (seg.length > 40) return true;
  return false;
}

export function getDashboardPageTitle(path: string, fallback = "Dashboard"): string {
  const segments = path.split("/").filter(Boolean);
  if (segments.length <= 1) return fallback;

  const filteredSegments = segments.filter((seg) => !isDynamicIdSegment(seg));
  const lastSegment = filteredSegments[filteredSegments.length - 1];

  if (!lastSegment || lastSegment === segments[0] || lastSegment === "dashboard") {
    return fallback;
  }

  // Detail under classrooms → "Classroom" until page sets subject
  if (
    lastSegment === "classrooms" &&
    segments.some((seg) => isDynamicIdSegment(seg))
  ) {
    return "Classroom";
  }

  // Detail under friends / public profile → "Profile" until page sets user's first name
  if (
    lastSegment === "friends" &&
    segments.some((seg) => isDynamicIdSegment(seg))
  ) {
    return "Profile";
  }

  // Subject lists under practical journals share one header label
  if (
    segments.includes("practical-journals") &&
    lastSegment !== "practical-journals"
  ) {
    return "Practicals";
  }

  if (ROUTE_TITLES[lastSegment]) {
    return ROUTE_TITLES[lastSegment];
  }

  return lastSegment
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}
