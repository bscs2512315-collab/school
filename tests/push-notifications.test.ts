import assert from "node:assert/strict";
import { test } from "node:test";
import {
  INACTIVITY_TEMPLATES,
  getDailyInactivityNotification,
  getFirstName,
  getLeaderboardLeadingNotification,
  getLeaderboardOvertakenNotification,
} from "../lib/push/inactivity-reminders";

test("Daily inactivity templates adhere strictly to Roman Urdu / GenZ specs", () => {
  const bookBand = getDailyInactivityNotification("Zainab", "book_band");
  assert.equal(bookBand.title, "Book band kr k so gaye kya? 👀");
  assert.equal(
    bookBand.body,
    "Zainab, aaj papers solve nhi krney? Sirf 10 min do aur past papers clear kro!",
  );
  assert.equal(bookBand.url, "/student/generate");

  const boardExams = getDailyInactivityNotification("Zainab", "board_exams");
  assert.equal(boardExams.title, "Board exams wait nhi krengy 😭");
  assert.equal(
    boardExams.body,
    "Thori si prep aaj kr lo, exam hall mein regret na ho. Ek quick quiz attempt kro! ⚡",
  );

  const novaWaiting = getDailyInactivityNotification("Zainab", "nova_waiting");
  assert.equal(novaWaiting.title, "Nova is waiting for you! 🤖");
  assert.equal(
    novaWaiting.body,
    "Zainab, Nova tumhare difficult topics ready kr k baitha hai. Let's solve 5 questions today.",
  );
  // Verify Nova gender: Nova is male ("baitha hai"), NOT female ("baithi hai")
  assert.match(novaWaiting.body, /baitha hai/);
  assert.doesNotMatch(novaWaiting.body, /baithi hai/);
  // Verify Title does not use "missing you"
  assert.doesNotMatch(novaWaiting.title, /missing you/i);
});

test("First name extractor handles full names, quotes, and whitespace", () => {
  assert.equal(getFirstName("Zainab Kashaf"), "Zainab");
  assert.equal(getFirstName('"Zainab" Kashaf Nisar'), "Zainab");
  assert.equal(getFirstName("Maheen"), "Maheen");
  assert.equal(getFirstName(""), "Champion");
  assert.equal(getFirstName(null), "Champion");
});

test("Leaderboard overtaken notification matches format", () => {
  const notification = getLeaderboardOvertakenNotification(
    "Zainab",
    "Maheen",
    "Kashaf Nisar",
  );
  assert.equal(notification.title, "Position khatray mein hai! 🚨");
  assert.equal(
    notification.body,
    'Maheen "Kashaf Nisar" ne tmhe beat krk top position lelii hai, now its time to comeback!',
  );
  assert.equal(notification.url, "/student/leaderboard");
});

test("Leaderboard leading notification matches format", () => {
  const notification = getLeaderboardLeadingNotification("Zainab", "Kashaf Nisar");
  assert.equal(notification.title, "Leaderboard Champion! 🏆");
  assert.equal(
    notification.body,
    'Zainab "Kashaf Nisar" is leading the leaderboard. Top rank defend karne k liye tayyar raho!',
  );
});
