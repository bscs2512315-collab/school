import assert from "node:assert/strict";
import { test } from "node:test";
import { AxiosError } from "axios";
import { getPasswordChecks, passwordSchema } from "../lib/auth/password-policy";
import { sanitizeErrorMessage } from "../lib/api-instance";
import { db } from "../lib/db";
import { allowAuthRequest, allowPublicSignup, allowPublicSignupAttempt } from "../lib/security/rate-limit";
import { POST as registerStudent } from "../app/api/auth/register/route";

test("signup password rules match the API schema", () => {
  const weak = getPasswordChecks("123");
  assert.deepEqual(weak.map((check) => check.valid), [false, false, true]);
  assert.equal(passwordSchema.safeParse("123").success, false);
  assert.equal(passwordSchema.safeParse("Study2026").success, true);
  assert.equal(getPasswordChecks("Study2026").every((check) => check.valid), true);
});

test("signup validation errors retain their specific message", () => {
  const error = new AxiosError("Request failed");
  error.response = {
    data: { success: false, error: [{ message: "Password must be at least 8 characters", path: ["password"] }] },
    status: 400,
    statusText: "Bad Request",
    headers: {},
    config: { headers: {} } as never,
  };
  assert.equal(sanitizeErrorMessage(error), "Password must be at least 8 characters");
});

test("visitors without a trusted IP do not share the five-account quota", async () => {
  const originalQuery = db.query;
  const keys: string[] = [];
  db.query = (async (_sql: string, values: unknown[]) => {
    keys.push(String(values[0]));
    return { rows: [{ hits: 1 }] };
  }) as typeof db.query;
  try {
    const request = new Request("https://exboardai.tech/api/auth/register");
    assert.equal(await allowPublicSignupAttempt(request), true);
    assert.equal(await allowPublicSignup(request), true);
    assert.deepEqual(keys, ["signup:attempt:global", "signup:validated:global"]);
  } finally {
    db.query = originalQuery;
  }
});

test("an invalid password never consumes the account-creation quota", async () => {
  const originalQuery = db.query;
  const keys: string[] = [];
  db.query = (async (_sql: string, values: unknown[]) => {
    keys.push(String(values[0]));
    return { rows: [{ hits: 1 }] };
  }) as typeof db.query;
  try {
    const response = await registerStudent(new Request("https://exboardai.tech/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "QA Student", fatherName: "QA Parent", email: "qa@example.invalid",
        username: "qa_student", password: "123", confirmPassword: "123",
        class: "IX", schoolName: "QA School", city: "Karachi",
      }),
    }));
    assert.equal(response.status, 400);
    assert.deepEqual(keys, ["signup:attempt:global"]);
  } finally {
    db.query = originalQuery;
  }
});

test("unknown IPs do not share the login lockout bucket", async () => {
  const originalQuery = db.query;
  const keys: string[] = [];
  db.query = (async (_sql: string, values: unknown[]) => {
    keys.push(String(values[0]));
    return { rows: [{ hits: 1 }] };
  }) as typeof db.query;
  try {
    assert.equal(await allowAuthRequest(new Request("https://exboardai.tech/api/auth/login"), "login", 50, 5000, 900), true);
    assert.deepEqual(keys, ["login:global"]);
  } finally {
    db.query = originalQuery;
  }
});

test("trusted IPs retain both per-IP and site-wide login ceilings", async () => {
  const originalQuery = db.query;
  const keys: string[] = [];
  db.query = (async (_sql: string, values: unknown[]) => {
    keys.push(String(values[0]));
    return { rows: [{ hits: 1 }] };
  }) as typeof db.query;
  try {
    const request = new Request("https://exboardai.tech/api/auth/login", {
      headers: { "x-nf-client-connection-ip": "203.0.113.10" },
    });
    assert.equal(await allowAuthRequest(request, "login", 50, 5000, 900), true);
    assert.deepEqual(keys, ["login:ip:203.0.113.10", "login:global"]);
  } finally {
    db.query = originalQuery;
  }
});
