"use client";

import React from "react";
import {
  GenerateStepFooter,
  GenerateStepShell,
} from "@/components/generate/GeneratePaperUI";
import GenerateModeSelector, {
  type GenerateMode,
} from "@/components/generate/GenerateModeSelector";

interface GenerateModeStepProps {
  mode: GenerateMode;
  onModeChange: (mode: GenerateMode) => void;
  onContinue: () => void;
  showLightning?: boolean;
}

export default function GenerateModeStep({
  mode,
  onModeChange,
  onContinue,
  showLightning = false,
}: GenerateModeStepProps) {
  return (
    <GenerateStepShell>
      {/* 1. Mode Selector Grid */}
      <GenerateModeSelector
        mode={mode}
        onChange={onModeChange}
        showLightning={showLightning}
        label="Step 1: Choose Generation Source"
      />

      {/* 2. Continue Footer */}
      <GenerateStepFooter
        nextHint={
          mode === "custom"
            ? "Configure custom exam title, prompt, and paper format"
            : "Select paper format and curriculum subject"
        }
        continueLabel="Next: Configure Details"
        onContinue={onContinue}
      />
    </GenerateStepShell>
  );
}
