import assert from "node:assert/strict";
import test from "node:test";
import {
  isImagePaperIntent,
  parseImagePaperPrefs,
  buildImagePaperWizard,
} from "../lib/ai/bot-image-paper";

test("isImagePaperIntent correctly identifies various user intents", () => {
  assert.equal(isImagePaperIntent("Extract gamma MCQs from this image"), true);
  assert.equal(isImagePaperIntent("Create paper from these MCQs"), true);
  assert.equal(isImagePaperIntent("Create paper form these MCQS"), true);
  assert.equal(isImagePaperIntent("Extract alpha MCQs from this image"), true);
  assert.equal(isImagePaperIntent("turn this image into paper"), true);
  assert.equal(isImagePaperIntent("make same MCQs in ExBoardAI MCQ form"), true);
  assert.equal(isImagePaperIntent("generate 5 questions from image"), true);
  assert.equal(isImagePaperIntent("explain this physics formula"), false);
});

test("parseImagePaperPrefs correctly parses Gamma difficulty and MCQ paper type", () => {
  const prefs = parseImagePaperPrefs("Extract gamma MCQs from this image");
  assert.equal(prefs.difficulty, "Gamma");
  assert.equal(prefs.paperType, 1);
  assert.equal(prefs.isExtractOnly, true);
  assert.equal(prefs.questionCount, null);
});

test("parseImagePaperPrefs correctly parses Alpha difficulty with explicit count", () => {
  const prefs = parseImagePaperPrefs("Extract 10 alpha MCQs from this image");
  assert.equal(prefs.difficulty, "Alpha");
  assert.equal(prefs.paperType, 1);
  assert.equal(prefs.isExtractOnly, true);
  assert.equal(prefs.questionCount, 10);
});

test("parseImagePaperPrefs correctly parses Beta difficulty and Paper 2", () => {
  const prefs = parseImagePaperPrefs("Create Paper 2 with beta questions from this image");
  assert.equal(prefs.difficulty, "Beta");
  assert.equal(prefs.paperType, 2);
});

test("buildImagePaperWizard immediately provides action button for extract request without asking question count", () => {
  const wizard = buildImagePaperWizard({
    paperType: 1,
    questionCount: null,
    role: "student",
    difficulty: "Gamma",
    userPrompt: "Extract gamma MCQs from this image",
    isExtractOnly: true,
  });

  const generateAction = wizard.actions.find((a) => a.type === "generate_paper_from_image");
  assert.ok(generateAction);
  assert.equal((generateAction as any).difficulty, "Gamma");
  assert.equal((generateAction as any).paperType, 1);
  // Ensure difficulty chips are present
  assert.ok(wizard.actions.some((a) => a.type === "difficulty_chip" && (a as any).difficulty === "Alpha"));
  assert.ok(wizard.actions.some((a) => a.type === "difficulty_chip" && (a as any).difficulty === "Beta"));
});
