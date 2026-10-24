"use client";

import { memo } from "react";

interface ExamCanaryWatermarkProps {
  studentIdentifier?: string;
  className?: string;
}

/**
 * ExamCanaryWatermark
 *
 * Disabled per user request (returns null).
 */
function ExamCanaryWatermarkComponent(_props: ExamCanaryWatermarkProps) {
  return null;
}

export default memo(ExamCanaryWatermarkComponent);
