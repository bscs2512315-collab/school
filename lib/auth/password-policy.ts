import { z } from "zod";

export const PASSWORD_REQUIREMENTS = [
  { id: "length", label: "At least 8 characters", message: "Password must be at least 8 characters", test: (value: string) => value.length >= 8 },
  { id: "letter", label: "At least one letter", message: "Password must contain at least one letter", test: (value: string) => /[A-Za-z]/.test(value) },
  { id: "number", label: "At least one number", message: "Password must contain at least one number", test: (value: string) => /[0-9]/.test(value) },
] as const;

export function getPasswordChecks(password: string) {
  return PASSWORD_REQUIREMENTS.map((rule) => ({
    id: rule.id,
    label: rule.label,
    message: rule.message,
    valid: rule.test(password),
  }));
}

export const passwordSchema = z.string().superRefine((password, context) => {
  for (const rule of PASSWORD_REQUIREMENTS) {
    if (!rule.test(password)) {
      context.addIssue({ code: "custom", message: rule.message });
    }
  }
});
