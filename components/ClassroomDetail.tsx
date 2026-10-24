"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import TrophySVG from "@/public/svgs/TrophySVG";
import ChallengeSVG from "@/public/svgs/ChallengeSVG";
import BiologySVG from "@/public/svgs/BiologySVG";
import CheckCircleSVG from "@/public/svgs/CheckCircleSVG";
import ClockSVG from "@/public/svgs/ClockSVG";
import GenerateSVG from "@/public/svgs/GenerateSVG";
import LabGameSVG from "@/public/svgs/LabGameSVG";
import P1SVG from "@/public/svgs/P1SVG";
import PhysicsSVG from "@/public/svgs/PhysicsSVG";
import ReviewExamsSVG from "@/public/svgs/ReviewExamsSVG";
import SubjectsSVG from "@/public/svgs/SubjectsSVG";
import SyllabusSVG from "@/public/svgs/SyllabusSVG";
import UserAvatar from "@/components/UserAvatar";
import type { ComponentType, ReactNode, SVGProps } from "react";
import PageContainer from "@/components/PageContainer";
import AppButton from "@/components/AppButton";
import AppLoader from "@/components/AppLoader";
import AppState from "@/components/AppState";
import ClassroomStudentsPanel from "@/components/teacher/ClassroomStudentsPanel";
import ClassroomAttemptsPanel from "@/components/teacher/ClassroomAttemptsPanel";
import ClassroomSettingsPanel from "@/components/teacher/ClassroomSettingsPanel";
import ClassroomDraftsPanel from "@/components/teacher/ClassroomDraftsPanel";
import ClassroomStudentAttemptsPanel from "@/components/student/ClassroomStudentAttemptsPanel";
import ClassroomStudentPerformancePanel from "@/components/student/ClassroomStudentPerformancePanel";
import ClassroomCoveragePanel from "@/components/classroom/ClassroomCoveragePanel";
import GenerateChapterTestModal from "@/components/classroom/GenerateChapterTestModal";
import PastPaperCard from "@/components/PastPaperCard";
import TeacherPaperDetailModal from "@/components/teacher/TeacherPaperDetailModal";
import ExtendDeadlineModal from "@/components/teacher/ExtendDeadlineModal";
import { FRONTEND_ROUTES, API_ENDPOINTS } from "@/constants/endpoints";
import { apiGet } from "@/lib/api/api-client";
import apiInstance from "@/lib/api-instance";
import { cn } from "@/lib/utils";
import { usePageTitle } from "@/components/layout/PageTitleContext";
import { parsePaperDifficulty } from "@/lib/paper/difficulty";
import { parsePaperVariant } from "@/lib/paper/variant-parser";
import type { ClassroomCoverageReport } from "@/lib/paper/slo-coverage";
import SettingsSVG from "@/public/svgs/SettingsSVG";
import { ArrowRight, Copy, Check, Plus } from "lucide-react";
import { useTeacherDrafts } from "@/hooks/teacher/useTeacherDrafts";
import type { GeneratePaperChapter } from "@/types/challenge";
import toast from "react-hot-toast";
import P2SVG from "@/public/svgs/P2SCG";

const SET_TAB_LABELS: Record<string, string> = {
  A: "Alpha",
  B: "Beta",
  C: "Gamma",
  D: "Delta",
  E: "Epsilon",
};

/** Groups papers by their Set letter (A, B, C, D...), with an "Other" bucket. */
function groupPapersBySet(
  papersList: TeacherPaperItem[],
): Array<[string, TeacherPaperItem[]]> {
  const map = new Map<string, TeacherPaperItem[]>();
  for (const paper of papersList) {
    const diff = parsePaperDifficulty(paper.title || "");
    const { setLetter } = parsePaperVariant(diff.cleanTitle || paper.title || "");
    const key = setLetter && SET_TAB_LABELS[setLetter] ? setLetter : "Other";
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(paper);
  }
  return Array.from(map.entries()).sort(([a], [b]) => {
    if (a === "Other") return 1;
    if (b === "Other") return -1;
    return a.localeCompare(b);
  });
}

interface TeacherPaperItem {
  id: string;
  title: string;
  description: string | null;
  paperType: string;
  subject?: string;
  classLevel?: string;
  board?: string;
  totalMarks: number;
  totalQuestions: number;
  dueDate: string | null;
  strictMode?: boolean;
  allowResume?: boolean;
  hasSavedProgress?: boolean;
  attemptCount?: number;
  hasApprovedAttempt?: boolean;
  lastScore?: number | null;
  lastTotalMarks?: number | null;
  isRemedial?: boolean;
  stepInCycle?: number;
  cycleNumber?: number;
  createdAt: string;
}

interface ClassroomInfo {
  id: string;
  name?: string | null;
  teacherId: string;
  teacherName: string;
  teacherImage: string | null;
  subject: string;
  classLevel: string;
  board?: string;
  pinCode?: string | null;
  pin?: string | null;
  schoolName: string | null;
  visibility?: "school" | "private";
  settings?: {
    autoApprovePaper2?: boolean;
    allowPostApprovalEdit?: boolean;
  };
}

type ClassroomTab =
  | "assigned"
  | "coverage"
  | "drafts"
  | "attempted"
  | "result"
  | "students"
  | "performance"
  | "settings";

function subjectIcon(subject: string): ComponentType<SVGProps<SVGSVGElement>> {
  const key = subject.trim().toLowerCase();
  if (key.includes("math")) return SubjectsSVG;
  if (key.includes("physics") || key.includes("physic")) return PhysicsSVG;
  if (key.includes("chem")) return LabGameSVG;
  if (key.includes("bio")) return BiologySVG;
  if (key.includes("botany") || key.includes("plant")) return BiologySVG;
  return SyllabusSVG;
}

export default function ClassroomDetail() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const classroomId = decodeURIComponent(params.classroomId as string);
  const pageTitleContext = usePageTitle();
  const setPageTitle = pageTitleContext?.setPageTitle;
  const setHeaderBack = pageTitleContext?.setHeaderBack;

  const [classroom, setClassroom] = useState<ClassroomInfo | null>(null);
  const [papers, setPapers] = useState<TeacherPaperItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isTeacher, setIsTeacher] = useState(false);
  const [activeTab, setActiveTab] = useState<ClassroomTab>("assigned");
  const { activeDraftsCount } = useTeacherDrafts(classroomId);
  const [selectedPaperIdForView, setSelectedPaperIdForView] = useState<string | null>(null);
  const [selectedPaperForDeadline, setSelectedPaperForDeadline] = useState<TeacherPaperItem | null>(null);
  const [selectedChapterName, setSelectedChapterName] = useState<string | null>(null);
  const [activeSetLetter, setActiveSetLetter] = useState<string | null>(null);
  const [copiedPin, setCopiedPin] = useState(false);
  const [totalChapters, setTotalChapters] = useState<number | null>(null);
  const [curriculumChapters, setCurriculumChapters] = useState<GeneratePaperChapter[]>([]);
  const [generateModalOpen, setGenerateModalOpen] = useState(false);
  const [generatePaperType, setGeneratePaperType] = useState<"1" | "2">("1");
  const [generateDifficulty, setGenerateDifficulty] = useState<"Alpha" | "Beta" | "Gamma">("Beta");
  const [reloadKey, setReloadKey] = useState(0);

  interface ChapterPaperGroup {
    chapterKey: string;
    chapterName: string;
    chapterNumber: number | null;
    papers: TeacherPaperItem[];
    setLetters: string[];
    classLevel: string;
    board: string;
    paperTypeNumber: number;
    totalQuestions: number;
    badgeLabel: string;
    year: number;
    unattemptedCount: number;
    completedCount: number;
    inProgressCount: number;
  }

  function extractChapterInfo(title: string, fallbackSubject?: string) {
    const diff = parsePaperDifficulty(title || "");
    const clean = diff.cleanTitle || title || fallbackSubject || "";
    const { baseTitle } = parsePaperVariant(clean);
    const target = (baseTitle || clean || fallbackSubject || "General Practice").trim();

    // Match "Chapter 15: Quadratic Equations", "Ch 15: Quadratic Equations", "15. Quadratic Equations", "Chapter 15 - Quadratic Equations"
    const chMatch = target.match(/^(?:Chapter|Ch)\s*(\d+)[\s:\-–—.]+(.*)$/i);
    let chapterNumber: number | null = null;
    let coreName = target;

    if (chMatch) {
      chapterNumber = parseInt(chMatch[1], 10);
      coreName = chMatch[2] ? chMatch[2].trim() : target;
    } else {
      const numPrefixMatch = target.match(/^(\d+)[\.\:\-–—\s]+(.*)$/);
      if (numPrefixMatch) {
        chapterNumber = parseInt(numPrefixMatch[1], 10);
        coreName = numPrefixMatch[2] ? numPrefixMatch[2].trim() : target;
      }
    }

    // Strip generic suffixes like "Mastery Test", "Practice Test", "Quiz", "Paper 1 (Sindh Board)"
    coreName = coreName
      .replace(/\s*[-–—·•]\s*Paper\s*[12].*$/i, "")
      .replace(/\s*(?:Mastery Test|Practice Test|Test|Quiz)\s*$/i, "")
      .replace(/[\s·•\-–—:|]+$/, "")
      .replace(/^[\s·•\-–—:|]+/, "")
      .trim();

    if (!coreName) coreName = target;

    const normalizedKey = coreName.toLowerCase().replace(/[^a-z0-9]/g, "");

    let displayTitle = target;
    if (chapterNumber) {
      displayTitle = `Chapter ${chapterNumber}: ${coreName}`;
    } else {
      displayTitle = coreName;
    }

    return {
      normalizedKey: normalizedKey || "general",
      chapterNumber,
      coreName,
      displayTitle,
    };
  }

  const chapterNumberByName = useMemo(() => {
    const map = new Map<string, number>();
    for (const chapter of curriculumChapters) {
      const key = (chapter.chapterName || "").toLowerCase().replace(/[^a-z0-9]/g, "");
      if (key && chapter.chapterNumber != null) map.set(key, chapter.chapterNumber);
    }
    return map;
  }, [curriculumChapters]);

  const chapterIdByName = useMemo(() => {
    const map = new Map<string, string>();
    for (const chapter of curriculumChapters) {
      const key = (chapter.chapterName || "").toLowerCase().replace(/[^a-z0-9]/g, "");
      if (key && chapter.id) map.set(key, chapter.id);
    }
    return map;
  }, [curriculumChapters]);

  const chapterGroups = useMemo(() => {
    const map = new Map<string, ChapterPaperGroup>();

    for (const paper of papers) {
      const diff = parsePaperDifficulty(paper.title || "");
      const { setLetter } = parsePaperVariant(diff.cleanTitle || paper.title || "");
      const { normalizedKey, chapterNumber: parsedChapterNumber, coreName } = extractChapterInfo(
        paper.title,
        paper.subject || classroom?.subject,
      );
      const chapterNumber =
        parsedChapterNumber ?? chapterNumberByName.get(normalizedKey) ?? null;

      const isPaper2 = String(paper.paperType).includes("2");
      const year = paper.createdAt
        ? new Date(paper.createdAt).getFullYear()
        : new Date().getFullYear();

      if (!map.has(normalizedKey)) {
        map.set(normalizedKey, {
          chapterKey: normalizedKey,
          chapterName: coreName,
          chapterNumber,
          papers: [],
          setLetters: [],
          classLevel: paper.classLevel || classroom?.classLevel || "X",
          board: paper.board || "AKUEB",
          paperTypeNumber: isPaper2 ? 2 : 1,
          totalQuestions: paper.totalQuestions || 0,
          badgeLabel: diff.badgeLabel || "Practice Test",
          year,
          unattemptedCount: 0,
          completedCount: 0,
          inProgressCount: 0,
        });
      }

      const grp = map.get(normalizedKey)!;
      grp.papers.push(paper);

      // If this paper resolves an explicit chapter number, keep the card in sync.
      if (chapterNumber != null) {
        grp.chapterNumber = chapterNumber;
        grp.chapterName = coreName;
      }

      if (setLetter && !grp.setLetters.includes(setLetter)) {
        grp.setLetters.push(setLetter);
      }
      if ((paper.totalQuestions || 0) > grp.totalQuestions) {
        grp.totalQuestions = paper.totalQuestions;
      }
    }

    // Sort papers inside each group and calculate attempt stats
    for (const grp of map.values()) {
      grp.setLetters.sort();
      grp.papers.sort((a, b) => {
        const aSet = parsePaperVariant(a.title).setLetter || a.title;
        const bSet = parsePaperVariant(b.title).setLetter || b.title;
        return aSet.localeCompare(bSet);
      });

      grp.unattemptedCount = grp.papers.filter(
        (p) => !p.hasApprovedAttempt && (!p.attemptCount || p.attemptCount === 0),
      ).length;
      grp.completedCount = grp.papers.filter(
        (p) => p.hasApprovedAttempt || (p.attemptCount && p.attemptCount > 0),
      ).length;
      grp.inProgressCount = grp.papers.filter((p) => p.hasSavedProgress).length;
    }

    return Array.from(map.values()).sort((a, b) => {
      if (a.chapterNumber !== null && b.chapterNumber !== null) {
        return a.chapterNumber - b.chapterNumber;
      }
      if (a.chapterNumber !== null) return -1;
      if (b.chapterNumber !== null) return 1;
      return a.chapterName.localeCompare(b.chapterName);
    });
  }, [papers, classroom, chapterNumberByName]);

  const activeChapterGroup = useMemo(() => {
    if (!selectedChapterName) return null;
    return (
      chapterGroups.find(
        (g) =>
          g.chapterKey === selectedChapterName ||
          g.chapterName === selectedChapterName,
      ) || null
    );
  }, [chapterGroups, selectedChapterName]);

  // Group the active chapter's papers SET-WISE (Set A, B, C, D...) for the set tabs.
  const activeChapterSetGroups = useMemo(
    () => (activeChapterGroup ? groupPapersBySet(activeChapterGroup.papers) : []),
    [activeChapterGroup],
  );

  const currentSetLetter =
    activeSetLetter &&
      activeChapterSetGroups.some(([letter]) => letter === activeSetLetter)
      ? activeSetLetter
      : activeChapterSetGroups[0]?.[0] ?? null;

  const activeSetPapers = useMemo(
    () =>
      activeChapterSetGroups.find(([letter]) => letter === currentSetLetter)?.[1] ??
      [],
    [activeChapterSetGroups, currentSetLetter],
  );

  // Group the active chapter's papers TIER-WISE (Alpha/Beta/Gamma/Standard) so we
  // can offer to create the missing Paper 1 / Paper 2 within each tier.
  const activeChapterTierGroups = useMemo(() => {
    const map = new Map<string, TeacherPaperItem[]>();
    if (!activeChapterGroup) return [] as Array<[string, TeacherPaperItem[]]>;
    for (const paper of activeChapterGroup.papers) {
      const { tier } = parsePaperDifficulty(paper.title || "");
      const key = tier ?? "Standard";
      const list = map.get(key) ?? [];
      list.push(paper);
      map.set(key, list);
    }
    return Array.from(map.entries());
  }, [activeChapterGroup]);

  const chapterGenerateTarget = useMemo(() => {
    if (!activeChapterGroup) return null;
    return {
      chapterId: chapterIdByName.get(activeChapterGroup.chapterKey) ?? "",
      chapterNumber: activeChapterGroup.chapterNumber ?? 0,
      chapterName: activeChapterGroup.chapterName,
      totalSlos: 0,
      coveredSlos: 0,
    };
  }, [activeChapterGroup, chapterIdByName]);

  // Reset the selected set tab whenever the chapter changes.
  useEffect(() => {
    setActiveSetLetter(null);
  }, [selectedChapterName]);

  useEffect(() => {
    const mainEl = document.querySelector("main");
    if (mainEl) {
      mainEl.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [selectedChapterName]);

  useEffect(() => {
    const tab = searchParams.get("tab");
    if (
      tab === "assigned" ||
      tab === "coverage" ||
      tab === "attempted" ||
      tab === "students" ||
      tab === "performance" ||
      tab === "settings"
    ) {
      setActiveTab(tab);
    } else if ((tab === "result" || tab === "drafts") && isTeacher) {
      setActiveTab(tab);
    }
  }, [searchParams, isTeacher]);

  useEffect(() => {
    (async () => {
      try {
        const userStr = localStorage.getItem("exboard_user");
        let currentUserId = "";
        let role = "";
        if (userStr) {
          const u = JSON.parse(userStr) as {
            id?: string;
            userId?: string;
            role?: string;
          };
          currentUserId = u.id || u.userId || "";
          role = u.role || "";
        }

        const res = (await apiInstance.get(
          `/classrooms/${encodeURIComponent(classroomId)}`,
        )) as {
          success?: boolean;
          data?: {
            classroom: ClassroomInfo;
            papers?: TeacherPaperItem[];
          };
        };

        if (res?.success && res.data) {
          setClassroom(res.data.classroom);

          // Resolve chapter numbers from the curriculum so chapter cards show
          // them even when a paper title omits the "Chapter N" prefix.
          try {
            const cls = res.data.classroom;
            const chapterParams = new URLSearchParams({
              subject: cls.subject,
              class: cls.classLevel,
              board: cls.board || "AKUEB",
              paperType: "1",
            });
            const chaptersRes = await apiGet<GeneratePaperChapter[]>(
              `${API_ENDPOINTS.STUDENT.GENERATE_PAPER_CHAPTERS}?${chapterParams.toString()}`,
            );
            if (chaptersRes.success) setCurriculumChapters(chaptersRes.data);
          } catch {
            // non-fatal: fall back to parsing the chapter number from the title
          }

          const teacherView =
            role === "TEACHER" &&
            res.data.classroom.teacherId === currentUserId;
          setIsTeacher(teacherView);

          if (teacherView) {
            const papersRes = await apiGet<TeacherPaperItem[]>(
              `${API_ENDPOINTS.TEACHER.PAPERS}?classroomId=${encodeURIComponent(classroomId)}`,
            );
            if (papersRes.success) setPapers(papersRes.data);
          } else if (Array.isArray(res.data.papers)) {
            setPapers(res.data.papers);
          }
        }
      } catch {
        // keep empty
      } finally {
        setLoading(false);
      }
    })();
  }, [classroomId, reloadKey]);

  useEffect(() => {
    const inChapter = activeTab === "assigned" && activeChapterGroup;
    setPageTitle?.(inChapter ? activeChapterGroup!.chapterName : classroom?.subject ?? "Classroom");
    return () => {
      setPageTitle?.(null);
    };
  }, [classroom, activeTab, activeChapterGroup, setPageTitle]);

  useEffect(() => {
    setHeaderBack?.(activeTab === "assigned" && activeChapterGroup
      ? () => setSelectedChapterName(null)
      : null);
    return () => setHeaderBack?.(null);
  }, [activeTab, activeChapterGroup, setHeaderBack]);

  useEffect(() => {
    let cancelled = false;
    apiGet<ClassroomCoverageReport>(
      API_ENDPOINTS.CLASSROOMS.COVERAGE(classroomId),
    )
      .then((res) => {
        if (!cancelled && res.success && res.data) {
          setTotalChapters(res.data.summary.totalChapters);
        }
      })
      .catch(() => {
        // keep total chapters unknown
      });
    return () => {
      cancelled = true;
    };
  }, [classroomId]);

  const tabs = useMemo(() => {
    const base: Array<{
      key: ClassroomTab;
      label: string;
      icon: ComponentType<SVGProps<SVGSVGElement>>;
    }> = [
        { key: "assigned", label: "Assigned", icon: ReviewExamsSVG },
        { key: "coverage", label: "Coverage", icon: SyllabusSVG },
        { key: "performance", label: "Performance", icon: TrophySVG },
      ];
    if (isTeacher) {
      base.push(
        {
          key: "drafts",
          label: activeDraftsCount > 0 ? `Drafts (${activeDraftsCount})` : "Drafts",
          icon: P2SVG,
        },
        { key: "attempted", label: "Attempted", icon: ClockSVG },
        { key: "result", label: "Result", icon: CheckCircleSVG },
        { key: "students", label: "Students", icon: ChallengeSVG },
        { key: "settings", label: "Settings", icon: SettingsSVG },
      );
    } else {
      base.push(
        { key: "attempted", label: "Attempted", icon: ClockSVG },
      );
    }
    return base;
  }, [isTeacher, activeDraftsCount]);

  const setTab = (tab: ClassroomTab) => {
    setActiveTab(tab);
    const url = new URL(window.location.href);
    url.searchParams.set("tab", tab);
    router.replace(`${url.pathname}?${url.searchParams.toString()}`, {
      scroll: false,
    });
  };

  const renderPaperCards = (
    papersList: TeacherPaperItem[],
    keyPrefix: string,
    layout: "grid" | "flow" = "grid",
    trailing?: ReactNode,
  ) => (
    <div
      className={
        layout === "flow"
          ? "flex flex-wrap gap-3 sm:gap-4"
          : "grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5"
      }
    >
      {papersList.map((paper) => {
        const isPaper2 = String(paper.paperType).includes("2");
        const year = paper.createdAt
          ? new Date(paper.createdAt).getFullYear()
          : new Date().getFullYear();
        const diff = parsePaperDifficulty(paper.title || "");
        const { setLetter, isRemedial: parsedRemedial } = parsePaperVariant(paper.title || "");
        const isRemedialPaper = Boolean(paper.isRemedial || parsedRemedial);

        let badgeLabel = isTeacher && setLetter
          ? `Set ${setLetter} • ${diff.tierOnlyLabel || "Practice"}`
          : isRemedialPaper
            ? `Weak Areas • ${diff.tierOnlyLabel || "Practice"}`
            : diff.badgeLabel || "Practice Test";

        if (paper.dueDate) {
          const isOverdue = new Date() > new Date(paper.dueDate);
          const dateStr = new Date(paper.dueDate).toLocaleDateString(undefined, {
            month: "short",
            day: "numeric",
          });
          badgeLabel = isOverdue
            ? `Overdue • ${badgeLabel}`
            : `Due ${dateStr} • ${badgeLabel}`;
        }

        if (paper.hasSavedProgress) {
          badgeLabel = `In Progress • ${badgeLabel}`;
        } else if (paper.allowResume) {
          badgeLabel = `${badgeLabel} • Resumable`;
        }

        const rawChapterName =
          parsePaperVariant(diff.cleanTitle || paper.title || "").baseTitle ||
          diff.cleanTitle ||
          paper.title ||
          paper.subject ||
          classroom?.subject ||
          "";
        const cleanVariantTitle =
          rawChapterName.replace(/^chapter\s*\d+\s*[:\-–—]?\s*/i, "").trim() ||
          rawChapterName;

        const baseDisplay = isTeacher
          ? diff.cleanTitle || paper.title || paper.subject || classroom?.subject
          : cleanVariantTitle;
        const displaySubject = diff.tier || baseDisplay;
        const attemptLabel = paper.hasSavedProgress
          ? "Resume Exam"
          : paper.hasApprovedAttempt || (paper.attemptCount && paper.attemptCount > 0)
            ? "Re-Attempt"
            : "Start Exam";

        const cardNode = (
          <PastPaperCard
            key={`${keyPrefix}-paper-${paper.id}`}
            badgeLabel={badgeLabel}
            attemptLabel={attemptLabel}
            tone={diff.tier ? (diff.tier.toLowerCase() as "alpha" | "beta" | "gamma") : undefined}
            subtitle={diff.tier ? cleanVariantTitle : undefined}
            score={!isTeacher ? paper.lastScore : undefined}
            maxScore={!isTeacher ? paper.lastTotalMarks : undefined}
            unattempted={!isTeacher && !paper.hasApprovedAttempt && !paper.hasSavedProgress}
            variant="student"
            paper={{
              id: paper.id,
              subject: displaySubject || "",
              year,
              session: null,
              board: paper.board || "AKUEB",
              class: paper.classLevel || classroom?.classLevel || "X",
              paperNumber: isPaper2 ? 2 : 1,
              questionCount: paper.totalQuestions,
            }}
            onAttempt={
              isTeacher
                ? undefined
                : (id) =>
                  router.push(
                    FRONTEND_ROUTES.STUDENT_TEACHER_PAPER_ATTEMPT(id),
                  )
            }
            onView={
              isTeacher
                ? (id) => setSelectedPaperIdForView(id)
                : undefined
            }
            onEdit={
              isTeacher
                ? (id) => {
                  const target = papers.find((p) => p.id === id);
                  if (target) setSelectedPaperForDeadline(target);
                }
                : undefined
            }
          />
        );

        if (layout === "flow") {
          return (
            <div
              key={`${keyPrefix}-paper-${paper.id}-wrap`}
              className="w-[calc(50vw-2.75rem)] sm:w-48 lg:w-52"
            >
              {cardNode}
            </div>
          );
        }

        return cardNode;
      })}
      {trailing}
    </div>
  );

  if (loading) {
    return (
      <div className="flex min-h-[calc(100dvh-12rem)] w-full flex-1 items-center justify-center">
        <AppLoader className="min-h-0" />
      </div>
    );
  }

  if (!classroom) {
    return (
      <PageContainer>
        <AppState
          isEmpty
          title="Classroom not found"
          description="This classroom may have been removed or you do not have access."
          fullScreen={false}
        />
      </PageContainer>
    );
  }

  const isPrivate = classroom.visibility === "private";
  const SubjectIcon = subjectIcon(classroom.subject);

  const classroomTitle = (classroom.name && !classroom.name.includes("__")
    ? classroom.name
    : classroom.subject
  )
    .replace(/\s*\(Private\)\s*/gi, "")
    .trim();

  const isInsideChapter = activeTab === "assigned" && activeChapterGroup != null;

  const chapterHeroTitle = isInsideChapter
    ? activeChapterGroup!.chapterNumber != null
      ? `Chapter ${activeChapterGroup!.chapterNumber}: ${activeChapterGroup!.chapterName}`
      : activeChapterGroup!.chapterName
    : null;

  const displayHeaderTitle = chapterHeroTitle ?? classroomTitle;

  const isSubjectLevelTitle =
    chapterHeroTitle == null &&
    classroomTitle.toLowerCase() === classroom.subject.toLowerCase();
  const headerSubtitle = `${isSubjectLevelTitle ? "" : `${classroom.subject} · `}Class ${classroom.classLevel
    }${classroom.board ? ` · ${classroom.board}` : ""}`;

  return (
    <PageContainer maxWidth="full" className="w-full space-y-4 pb-24 sm:space-y-6 lg:space-y-8">
      <section className="relative shrink-0 overflow-hidden rounded-2xl bg-primary p-5 sm:rounded-3xl sm:p-7 sm:px-8">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute inset-0 bg-linear-to-br from-primary via-primary/95 to-primary-dark" />
          <div className="absolute -right-10 -top-10 size-48 rounded-full bg-white/10 blur-3xl sm:size-64" />
          <div className="absolute -bottom-14 left-4 size-40 rounded-full bg-primary-light/30 blur-3xl" />
          <div
            className="absolute inset-0 opacity-[0.06]"
            style={{
              backgroundImage:
                "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
              backgroundSize: "18px 18px",
            }}
          />
          {/* Single clean watermark icon */}
          <SubjectIcon
            aria-hidden
            className="absolute -bottom-4 -right-4 size-36 text-white/[0.09] transition-transform duration-500 sm:size-48"
          />
        </div>

        <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3 min-w-0 flex-1">
            <div className="min-w-0 flex-1">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                {classroom.pinCode || classroom.pin ? (
                  <button
                    type="button"
                    onClick={() => {
                      const activePin = classroom.pinCode || classroom.pin || "";
                      navigator.clipboard.writeText(activePin);
                      setCopiedPin(true);
                      setTimeout(() => setCopiedPin(false), 2000);
                      toast.success(`PIN code ${activePin} copied!`);
                    }}
                    className="inline-flex items-center gap-1.5 rounded-full bg-linear-to-br from-amber-400 to-yellow-600 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-amber-950 shadow-md ring-1 ring-amber-200/60 backdrop-blur-md transition-all duration-200 hover:from-amber-300 hover:to-yellow-500 hover:scale-105 active:scale-95 cursor-pointer"
                    title="Click to copy Class PIN"
                  >
                    {copiedPin ? <Check className="size-3 text-amber-900" /> : <Copy className="size-3" />}
                    PIN: {classroom.pinCode || classroom.pin}
                  </button>
                ) : null}
              </div>

              <h1 className="text-2xl font-bold tracking-tight text-primary-foreground sm:text-3xl lg:text-4xl">
                {displayHeaderTitle}
              </h1>

              <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-primary-foreground/90">
                {headerSubtitle}
              </p>
            </div>
          </div>

          <div className="flex shrink-0 flex-col gap-3 sm:flex-row sm:items-center">
            {!isTeacher ? (
              <div className="flex items-center gap-3 rounded-2xl border border-white/15 bg-white/15 px-3.5 py-2.5 backdrop-blur-md">
                <UserAvatar
                  src={classroom.teacherImage}
                  name={classroom.teacherName}
                  size={40}
                  showRing
                  ringClassName="ring-2 ring-white/25"
                  className="size-10 shrink-0"
                />
                <div className="min-w-0">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-primary-foreground/65">
                    Teacher
                  </p>
                  <p className="truncate text-sm font-semibold text-primary-foreground">
                    {classroom.teacherName}
                  </p>
                </div>
              </div>
            ) : null}

            {isTeacher ? (
              <AppButton
                type="button"
                className="h-11 w-full rounded-full bg-background px-6 text-sm font-semibold text-primary shadow-sm hover:bg-primary-foreground dark:bg-white dark:text-primary dark:hover:bg-white/90 sm:w-auto"
                onClick={() =>
                  router.push(
                    `${FRONTEND_ROUTES.TEACHER_CREATE_PAPER}?classroomId=${encodeURIComponent(classroomId)}`,
                  )
                }
              >
                <GenerateSVG className="size-4" />
                Create Practice Test
              </AppButton>
            ) : null}
          </div>
        </div>
      </section>

      <div className="flex shrink-0 gap-1 overflow-x-auto rounded-2xl border border-border/50 bg-muted/40 p-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setTab(tab.key)}
            className={cn(
              "flex shrink-0 sm:flex-1 items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors whitespace-nowrap",
              {
                "bg-background text-primary shadow-sm dark:bg-primary dark:text-primary-foreground dark:shadow-md":
                  activeTab === tab.key,
                "text-muted-foreground hover:text-foreground dark:text-white/70 dark:hover:text-white":
                  activeTab !== tab.key,
              },
            )}
          >
            <tab.icon className="size-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "drafts" && isTeacher ? (
        <ClassroomDraftsPanel
          classroomId={classroomId}
          isTeacher={isTeacher}
          onNavigateToCoverage={() => setTab("coverage")}
          onPaperPublished={() => {
            setReloadKey((k) => k + 1);
            setTab("assigned");
          }}
        />
      ) : null}

      {activeTab === "coverage" ? (
        <ClassroomCoveragePanel
          classroomId={classroomId}
          isTeacher={isTeacher}
          onNavigateToDrafts={() => setTab("drafts")}
          onNavigateToCreateTest={(chapterId) =>
            router.push(
              `${FRONTEND_ROUTES.TEACHER_CREATE_PAPER}?classroomId=${encodeURIComponent(
                classroomId,
              )}${chapterId ? `&chapterId=${chapterId}` : ""}`,
            )
          }
        />
      ) : null}

      {activeTab === "students" && isTeacher ? (
        <ClassroomStudentsPanel
          classroomId={classroomId}
          classLevel={classroom.classLevel}
          isTeacher={isTeacher}
          visibility={isPrivate ? "private" : "school"}
        />
      ) : null}

      {activeTab === "settings" && isTeacher ? (
        <ClassroomSettingsPanel
          classroomId={classroomId}
          classroom={classroom}
          settings={classroom.settings}
          onSettingsSaved={(updated) =>
            setClassroom((prev) =>
              prev ? { ...prev, settings: { ...prev.settings, ...updated } } : prev,
            )
          }
          onClassroomUpdated={(updated) =>
            setClassroom((prev) => (prev ? { ...prev, ...updated } : prev))
          }
        />
      ) : null}

      {activeTab === "attempted" && isTeacher ? (
        <ClassroomAttemptsPanel classroomId={classroomId} mode="attempted" />
      ) : null}

      {activeTab === "attempted" && !isTeacher ? (
        <ClassroomStudentAttemptsPanel classroomId={classroomId} />
      ) : null}

      {activeTab === "result" && isTeacher ? (
        <ClassroomAttemptsPanel classroomId={classroomId} mode="result" />
      ) : null}

      {activeTab === "performance" ? (
        <ClassroomStudentPerformancePanel
          classroomId={classroomId}
          isTeacher={isTeacher}
        />
      ) : null}

      {activeTab === "assigned" ? (
        <section className="space-y-4">
          {papers.length === 0 ? (
            <div className="flex min-h-[440px] sm:min-h-[500px] w-full items-center justify-center rounded-2xl border border-dashed border-border/60 bg-card/40 p-6 sm:rounded-3xl sm:p-12">
              <AppState
                isEmpty
                title="No Practice Tests assigned"
                description={
                  isTeacher
                    ? "Generate a Paper 1 or Paper 2, preview it, then publish to this class."
                    : "Your teacher has not assigned a Practice Test yet."
                }
                icon={P1SVG}
                fullScreen={false}
                action={
                  isTeacher
                    ? {
                      label: "Create Practice Test",
                      onClick: () =>
                        router.push(
                          `${FRONTEND_ROUTES.TEACHER_CREATE_PAPER}?classroomId=${encodeURIComponent(classroomId)}`,
                        ),
                    }
                    : undefined
                }
              />
            </div>
          ) : activeChapterGroup ? (
            /* Drill-down View: Showing sets for the clicked chapter */
            isTeacher ? (
              <div className="space-y-5">
                {/* Per-tier action: create the missing Paper 1 / Paper 2 */}
                {(() => {
                  const pending = activeChapterTierGroups
                    .map(([tier, tierPapers]) => {
                      if (tier === "Standard") return null;
                      const hasPaper1 = tierPapers.some(
                        (p) => !String(p.paperType).includes("2"),
                      );
                      const hasPaper2 = tierPapers.some((p) =>
                        String(p.paperType).includes("2"),
                      );
                      const missing =
                        hasPaper1 && !hasPaper2
                          ? "2"
                          : hasPaper2 && !hasPaper1
                            ? "1"
                            : null;
                      return missing
                        ? { tier: tier as "Alpha" | "Beta" | "Gamma", missing: missing as "1" | "2" }
                        : null;
                    })
                    .filter(
                      (v): v is { tier: "Alpha" | "Beta" | "Gamma"; missing: "1" | "2" } =>
                        v !== null,
                    );

                  if (pending.length === 0) return null;

                  return (
                    <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-dashed border-primary/30 bg-primary/5 p-3">
                      <span className="text-[11px] font-black uppercase tracking-wider text-primary">
                        Complete this chapter
                      </span>
                      {pending.map(({ tier, missing }) => (
                        <button
                          key={`${tier}-${missing}`}
                          type="button"
                          onClick={() => {
                            setGenerateDifficulty(tier);
                            setGeneratePaperType(missing);
                            setGenerateModalOpen(true);
                          }}
                          className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-primary/30 bg-background px-3 py-1.5 text-xs font-bold text-primary transition-colors hover:bg-primary hover:text-primary-foreground"
                        >
                          <Plus className="size-3.5" />
                          Create {tier} Paper {missing}
                        </button>
                      ))}
                    </div>
                  );
                })()}

                {/* Set tabs (Set A, Set B, ...) */}
                <div className="flex shrink-0 gap-1 overflow-x-auto rounded-2xl border border-border/50 bg-muted/40 p-1">
                  {activeChapterSetGroups.map(([letter]) => (
                    <button
                      key={letter}
                      type="button"
                      onClick={() => setActiveSetLetter(letter)}
                      className={cn(
                        "flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors whitespace-nowrap",
                        {
                          "bg-background text-primary shadow-sm dark:bg-primary dark:text-primary-foreground dark:shadow-md":
                            currentSetLetter === letter,
                          "text-muted-foreground hover:text-foreground dark:text-white/70 dark:hover:text-white":
                            currentSetLetter !== letter,
                        },
                      )}
                    >
                      {letter === "Other" ? "Other" : `Set ${letter}`}
                    </button>
                  ))}
                </div>

                {currentSetLetter ? (
                  renderPaperCards(activeSetPapers, `set-${currentSetLetter}`, "grid")
                ) : (
                  <div className="rounded-2xl border border-dashed border-border bg-muted/20 p-8 text-center text-sm font-medium text-muted-foreground">
                    No sets available for this chapter yet.
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {renderPaperCards(activeChapterGroup.papers, "chapter")}
              </div>
            )
          ) : (
            /* Chapter Cards View: First show chapter cards like Quadratic Equations, Complex Numbers */
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-black tracking-tight text-foreground">
                    Assigned Chapters (
                    {chapterGroups.length}
                    {totalChapters ? ` / ${totalChapters}` : ""})
                  </h3>
                  <p className="text-xs font-medium text-muted-foreground">
                    {isTeacher
                      ? "Select a chapter card to view and manage its test sets (Sets A, B, C, D)"
                      : "Select a chapter card to view available practice tests"}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                {chapterGroups.map((grp) => {
                  const badgeCount = isTeacher ? grp.papers.length : grp.unattemptedCount;
                  return (
                    <div
                      key={grp.chapterKey}
                      onClick={() => setSelectedChapterName(grp.chapterKey)}
                      className="group relative flex h-full min-h-60 sm:min-h-68 flex-col overflow-hidden rounded-3xl bg-primary p-5 sm:p-6 text-primary-foreground shadow-lg transition-all duration-500 text-center hover:-translate-y-1.5 hover:shadow-xl cursor-pointer"
                    >
                      {/* Ambient Lighting & Glows */}
                      <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]">
                        <div className="absolute inset-0 bg-linear-to-br from-primary via-primary to-primary-dark" />
                        <div className="absolute -right-8 -top-10 size-44 rounded-full bg-primary-foreground/10 blur-3xl transition-colors duration-700 group-hover:bg-primary-foreground/15" />
                        <div className="absolute -bottom-12 -left-8 size-40 rounded-full bg-primary-foreground/5 blur-2xl" />

                        {/* Dual Watermark Icons */}
                        <SubjectIcon
                          aria-hidden
                          className="pointer-events-none absolute -right-4 -top-2 size-36 text-primary-foreground/10 transition-transform duration-700 group-hover:scale-110 group-hover:rotate-6 sm:size-40"
                        />
                        <SubjectIcon
                          aria-hidden
                          className="pointer-events-none absolute -bottom-6 -left-4 size-24 text-primary-foreground/10 sm:size-28"
                        />
                      </div>

                      {/* Top Bar: Notification-Style Count */}
                      <div className="relative z-20 flex items-start justify-end w-full gap-2">
                        {badgeCount > 0 ? (
                          <span className="inline-flex size-6 shrink-0 items-center justify-center rounded-full bg-red-500 text-[10px] font-black text-white shadow-md ring-2 ring-white/50">
                            {badgeCount > 99 ? "99+" : badgeCount}
                          </span>
                        ) : null}
                      </div>

                      {/* Centered Hero Body */}
                      <div className="relative z-10 flex flex-1 flex-col items-center justify-center mt-2">
                        <div className="mb-4 flex size-14 sm:size-16 items-center justify-center rounded-full bg-primary-foreground/15 ring-1 ring-primary-foreground/25 backdrop-blur-sm shadow-md transition-transform duration-500 group-hover:scale-105">
                          {grp.chapterNumber != null ? (
                            <span className="text-2xl sm:text-3xl font-black tabular-nums text-primary-foreground">
                              {grp.chapterNumber}
                            </span>
                          ) : (
                            <SubjectIcon className="size-7 sm:size-8 text-primary-foreground" />
                          )}
                        </div>

                        <h3 className="text-xl sm:text-2xl font-black tracking-tight text-primary-foreground line-clamp-2">
                          {grp.chapterName}
                        </h3>
                      </div>

                      {/* Centered Pill Action Button */}
                      <div className="relative z-10 mt-4 flex items-center justify-center">
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-foreground px-4 py-2 text-xs font-black uppercase tracking-widest text-primary shadow-md transition-transform duration-300 group-hover:scale-105">
                          <ArrowRight className="size-3.5" />
                          {isTeacher ? "View" : "Open"}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </section>
      ) : null}

      {selectedPaperIdForView && (
        <TeacherPaperDetailModal
          paperId={selectedPaperIdForView}
          onClose={() => setSelectedPaperIdForView(null)}
          onPaperUpdated={(updated) => {
            setPapers((prev) =>
              prev.map((p) => {
                const isAffected =
                  p.id === updated.id ||
                  (updated.affectedPaperIds &&
                    updated.affectedPaperIds.includes(p.id));
                if (isAffected) {
                  return {
                    ...p,
                    title: p.id === updated.id ? updated.title : p.title,
                    dueDate:
                      updated.dueDate !== undefined
                        ? updated.dueDate
                        : p.dueDate,
                    strictMode: updated.strictMode ?? p.strictMode,
                    allowResume: updated.allowResume ?? p.allowResume,
                  };
                }
                return p;
              }),
            );
          }}
          onViewAttempts={() => {
            setSelectedPaperIdForView(null);
            setTab("attempted");
          }}
        />
      )}

      {selectedPaperForDeadline && (
        <ExtendDeadlineModal
          isOpen={Boolean(selectedPaperForDeadline)}
          onClose={() => setSelectedPaperForDeadline(null)}
          paperId={selectedPaperForDeadline.id}
          paperTitle={selectedPaperForDeadline.title}
          currentDueDate={selectedPaperForDeadline.dueDate}
          classroomId={classroomId}
          onSuccess={(updated) => {
            setPapers((prev) =>
              prev.map((p) => {
                const isAffected =
                  p.id === updated.id ||
                  (updated.affectedPaperIds &&
                    updated.affectedPaperIds.includes(p.id));
                if (isAffected) {
                  return {
                    ...p,
                    dueDate: updated.dueDate,
                  };
                }
                return p;
              }),
            );
          }}
        />
      )}

      <GenerateChapterTestModal
        isOpen={generateModalOpen}
        onClose={() => setGenerateModalOpen(false)}
        classroomId={classroomId}
        chapter={chapterGenerateTarget}
        classroom={{
          subject: classroom.subject,
          classLevel: classroom.classLevel,
          board: classroom.board || "AKUEB",
          name: classroom.name,
        }}
        initialPaperType={generatePaperType}
        initialDifficulty={generateDifficulty}
        onDraftCreated={() => {
          setTab("drafts");
        }}
        onSuccess={() => {
          setReloadKey((k) => k + 1);
        }}
      />
    </PageContainer>
  );
}
