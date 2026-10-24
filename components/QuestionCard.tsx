"use client";

import { Edit, Loader2 } from "lucide-react";
import DeleteSVG from "@/public/svgs/DeleteSVG";
import EyeSVG from "@/public/svgs/EyeSVG";
import { Typography } from "./ui/Typography";
import { convertMathToHTML, isUrduText } from "@/lib/utils/math-notation";
import { getSubjectShortName, formatClassLevel } from "@/lib/paper/subject-mapping";
import { cn } from "@/lib/utils";
import QuestionImage from "@/components/exam/QuestionImage";

import QuestionQABugButton from "@/components/qa/QuestionQABugButton";

interface QuestionCardProps {
  questionId?: string;
  pastPaperId?: string;
  questionNumber: number;
  questionPart?: string | null;
  questionText: string;
  questionType?: string | null;
  chapterName?: string | null;
  pastPaperInfo?: {
    class: string;
    board: string;
    subject: string;
    year: number;
  };
  onView?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  isDeleting?: boolean;
  className?: string;
  showPreview?: boolean;
  previewLength?: number;
  imageUrl?: string | null;
}

export default function QuestionCard({
  questionId,
  pastPaperId,
  questionNumber,
  questionPart,
  questionText,
  questionType,
  chapterName,
  pastPaperInfo,
  onView,
  onEdit,
  onDelete,
  isDeleting = false,
  className = "",
  showPreview = true,
  previewLength = 150,
  imageUrl,
}: QuestionCardProps) {
  return (
    <div
      className={cn(
        "bg-card border border-border rounded-xl p-4 hover:border-primary/50 transition-colors",
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          {(() => {
            const isUrdu = isUrduText(questionText);
            return (
              <>
                {chapterName ? (
                  <div className="mb-1.5 flex items-center sm:hidden">
                    <span className="inline-flex items-center rounded-lg bg-black text-white dark:bg-white dark:text-black px-2.5 py-0.5 text-xs font-bold shadow-xs">
                      <span>{chapterName}</span>
                    </span>
                  </div>
                ) : null}
                <div className="flex items-center gap-2 sm:gap-3 mb-2 flex-wrap">
                  <span className={cn(
                    "bg-primary/10 text-primary dark:bg-muted dark:text-foreground px-3 py-1 rounded-lg font-bold text-sm",
                    isUrdu && "font-urdu"
                  )}>
                    {isUrdu ? `س ${questionNumber}` : `Q${questionNumber}`}{questionPart || ""}
                  </span>
                  {questionType && (
                    <span className="bg-muted px-2 py-1 rounded text-xs text-muted-foreground">
                      {questionType}
                    </span>
                  )}
                  {pastPaperInfo && (
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground flex-wrap">
                      <span className="font-semibold text-foreground/90">{getSubjectShortName(pastPaperInfo.subject)}</span>
                      <span className="size-1 rounded-full bg-muted-foreground/60 shrink-0" aria-hidden="true" />
                      <span>{formatClassLevel(pastPaperInfo.class)}</span>
                      <span className="size-1 rounded-full bg-muted-foreground/60 shrink-0" aria-hidden="true" />
                      <span>{pastPaperInfo.year}</span>
                      {pastPaperInfo.board ? (
                        <>
                          <span className="size-1 rounded-full bg-muted-foreground/60 shrink-0" aria-hidden="true" />
                          <span>{pastPaperInfo.board}</span>
                        </>
                      ) : null}
                      {chapterName ? (
                        <>
                          <span className="hidden sm:inline-block size-1 rounded-full bg-muted-foreground/60 shrink-0" aria-hidden="true" />
                          <span className="hidden sm:inline-block font-semibold text-foreground/90">
                            {chapterName}
                          </span>
                        </>
                      ) : null}
                    </div>
                  )}
                  {questionId && (
                    <QuestionQABugButton
                      questionId={questionId}
                      questionNumber={questionNumber}
                      pastPaperId={pastPaperId}
                      subject={pastPaperInfo?.subject}
                      classNameStr={pastPaperInfo?.class}
                      year={pastPaperInfo?.year}
                      board={pastPaperInfo?.board}
                      currentChapter={chapterName || undefined}
                      questionText={questionText}
                      imageUrl={imageUrl}
                    />
                  )}
                </div>
                {showPreview ? (
                  <Typography
                    variant="small"
                    dir={isUrdu ? "rtl" : "ltr"}
                    className={cn(
                      "text-foreground line-clamp-2",
                      isUrdu && "font-urdu text-right leading-[2.0]"
                    )}
                  >
                    <span
                      dangerouslySetInnerHTML={{
                        __html: convertMathToHTML(
                          questionText.substring(0, previewLength)
                        ),
                      }}
                    />
                    {questionText.length > previewLength ? "..." : ""}
                  </Typography>
                ) : (
                  <div
                    dir={isUrdu ? "rtl" : "ltr"}
                    className={cn(
                      "text-foreground whitespace-pre-wrap",
                      isUrdu && "font-urdu text-right leading-[2.2]"
                    )}
                  >
                    <span
                      dangerouslySetInnerHTML={{ __html: convertMathToHTML(questionText) }}
                    />
                  </div>
                )}
              </>
            );
          })()}
          {imageUrl && (
            <div className="mt-3 relative z-10">
              <QuestionImage
                src={imageUrl}
                alt={`Question ${questionNumber} Asset`}
                className="max-h-32 rounded-lg border border-border/60 bg-muted/20"
                skeletonHeightClass="h-28 sm:h-32"
                containerClassName="!items-start !mx-0 max-w-xs"
              />
            </div>
          )}
        </div>
        {(onView || onEdit || onDelete) && (
          <div className="flex items-center gap-2 ml-4">
            {onView && (
              <button
                type="button"
                onClick={onView}
                className="p-2 hover:bg-muted rounded-lg text-blue-500 dark:text-blue-400 transition-colors"
                title="View"
              >
                <EyeSVG className="size-4" />
              </button>
            )}
            {onEdit && (
              <button
                type="button"
                onClick={onEdit}
                className="p-2 hover:bg-muted rounded-lg text-green-500 dark:text-green-400 transition-colors"
                title="Edit"
              >
                <Edit className="h-4 w-4" />
              </button>
            )}
            {onDelete && (
              <button
                type="button"
                onClick={onDelete}
                disabled={isDeleting}
                className="p-2 hover:bg-muted rounded-lg text-red-500 dark:text-red-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Delete"
              >
                {isDeleting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <DeleteSVG className="h-4 w-4" />
                )}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

