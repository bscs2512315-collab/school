import assert from "node:assert/strict";
import test from "node:test";
import { parseBotQuery, STRUCTURED_QUERY_TYPE } from "../lib/ai/bot-query-parser";
import { fetchStructuredContext } from "../lib/ai/bot-structured-data";

test("a worked mathematics problem reaches the tutor instead of the syllabus reply", async () => {
  const result = await fetchStructuredContext({
    message: "Solve the quadratic equation 2x^2 + 5x - 3 = 0 using factorization and show each step clearly.",
    board: "Sindh Board",
    classLevel: "XI",
  });

  assert.equal(result, null);
});

test("parseBotQuery correctly identifies 'I want paper of chapter acid bases and salts grade X' as CREATE_PAPER", () => {
  const parsed = parseBotQuery("I want paper of chapter acid bases and salts grade X", {});
  assert.equal(parsed.type, STRUCTURED_QUERY_TYPE.CREATE_PAPER);
  assert.equal(parsed.classLevel, "X");
  assert.equal(parsed.subject, "Chemistry");
  assert.equal(parsed.topic, "acid bases and salts");
});

test("parseBotQuery correctly identifies 'I want paper of acid bases and salt' as CREATE_PAPER", () => {
  const parsed = parseBotQuery("I want paper of acid bases and salt", {});
  assert.equal(parsed.type, STRUCTURED_QUERY_TYPE.CREATE_PAPER);
  assert.equal(parsed.subject, "Chemistry");
  assert.equal(parsed.topic, "acid bases and salt");
});

test("parseBotQuery correctly identifies 'give me paper of chapter 2' as CREATE_PAPER", () => {
  const parsed = parseBotQuery("give me paper of chapter 2", { subject: "Physics", classLevel: "X" });
  assert.equal(parsed.type, STRUCTURED_QUERY_TYPE.CREATE_PAPER);
  assert.equal(parsed.chapterNumber, 2);
});

test("parseBotQuery correctly identifies 'quiz on matrices and determinants' as CREATE_PAPER", () => {
  const parsed = parseBotQuery("quiz on matrices and determinants", {});
  assert.equal(parsed.type, STRUCTURED_QUERY_TYPE.CREATE_PAPER);
  assert.equal(parsed.subject, "Mathematics");
  assert.equal(parsed.topic, "matrices and determinants");
});

test("fetchStructuredContext asks how to use paper rather than returning syllabus when user asks for paper", async () => {
  const result = await fetchStructuredContext({
    message: "I want paper of chapter acid bases and salts grade X",
    board: "AKUEB",
    classLevel: "X",
  });

  assert.ok(result);
  assert.ok(result.directReply?.includes("How would you like to use this paper"));
  assert.ok(result.actions?.some((a) => a.label === "Practice for Myself"));
  assert.ok(result.actions?.some((a) => a.label === "Challenge Friends"));
});

test("fetchStructuredContext asks how to use paper for 'I want paper of acid bases and salt'", async () => {
  const result = await fetchStructuredContext({
    message: "I want paper of acid bases and salt",
    board: "AKUEB",
    classLevel: "X",
  });

  assert.ok(result);
  assert.ok(result.directReply?.includes("How would you like to use this paper"));
  assert.ok(result.actions?.some((a) => a.label === "Practice for Myself"));
});

test("fetchStructuredContext directly creates generate_paper action with 25 questions for Past Papers mode without asking for question count", async () => {
  const result = await fetchStructuredContext({
    message: "Generate Paper 1 for myself for class X Chemistry from past papers chapter 1",
    board: "AKUEB",
    classLevel: "X",
  });

  assert.ok(result);
  // Must NOT ask how many questions
  assert.equal(result.directReply?.includes("How many questions should I include"), false);
  // Must have generate_paper action directly
  const generateAction = result.actions?.find((a) => a.type === "generate_paper");
  assert.ok(generateAction);
  assert.equal(generateAction?.questionCount, 25);
  assert.equal(generateAction?.useSlos, false);
});


