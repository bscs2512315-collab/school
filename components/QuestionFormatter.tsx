"use client";

import { memo } from "react";
import ScientificTextPreview from "@/components/editor/ScientificTextPreview";

interface QuestionFormatterProps {
  text: string;
  className?: string;
}

function QuestionFormatterComponent({ text, className }: QuestionFormatterProps) {
  if (!text) return null;
  return <ScientificTextPreview text={text} className={className} />;
}

const QuestionFormatter = memo(QuestionFormatterComponent);
export default QuestionFormatter;
export { QuestionFormatter };
