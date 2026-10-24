import nodemailer from "nodemailer";
import { OtpType } from "@/types/enums";
import { OTP_CONFIG, APP_NAME, FRONTEND_ROUTES } from "@/constants";
import {
  wrapEmail,
  emailButton,
  emailNotice,
  emailDetailCard,
  escapeHtml,
  getSiteUrl,
  getNovaImageUrl,
  EMAIL_STYLES,
} from "@/lib/email-layout";
import { formatMathToUnicode } from "@/lib/utils/math-notation";

export type EmailSendResult = {
  messageId?: string;
};

function isResendConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY);
}

function isNodemailerConfigured(): boolean {
  return Boolean(
    process.env.EMAIL_HOST && process.env.EMAIL_USER && process.env.EMAIL_PASS,
  );
}

function isEmailConfigured(): boolean {
  return isResendConfigured() || isNodemailerConfigured();
}

function getFromAddress(): string {
  if (isResendConfigured()) {
    const from = process.env.EMAIL_FROM;
    if (!from) {
      throw new Error(
        "EMAIL_FROM is required when using Resend (e.g. support@exboardai.tech).",
      );
    }
    return `"${APP_NAME}" <${from}>`;
  }

  if (!process.env.EMAIL_USER) {
    throw new Error("EMAIL_USER is required when using SMTP.");
  }

  return `"${APP_NAME}" <${process.env.EMAIL_USER}>`;
}

function getNodemailerTransporter() {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT || "587", 10),
    secure: process.env.EMAIL_SECURE === "true",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
}

async function sendViaResend(
  from: string,
  to: string,
  subject: string,
  html: string,
): Promise<EmailSendResult> {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from, to, subject, html }),
  });

  const result = (await response.json()) as {
    id?: string;
    message?: string;
  };

  if (!response.ok) {
    console.error("Failed to send email via Resend:", result);
    throw new Error(result.message || "Failed to send email via Resend.");
  }

  console.log("Email sent successfully via Resend:", result.id);
  return { messageId: result.id };
}

async function sendHtmlEmail(
  to: string,
  subject: string,
  html: string,
): Promise<EmailSendResult> {
  if (!isEmailConfigured()) {
    console.error(
      "Email configuration missing. Set RESEND_API_KEY + EMAIL_FROM, or EMAIL_HOST, EMAIL_USER, and EMAIL_PASS.",
    );
    throw new Error("Email service is not configured. Please contact support.");
  }

  const from = getFromAddress();

  if (isResendConfigured()) {
    return sendViaResend(from, to, subject, html);
  }

  const info = await getNodemailerTransporter().sendMail({
    from,
    to,
    subject,
    html,
  });
  console.log("Email sent successfully via SMTP:", info.messageId);
  return { messageId: info.messageId };
}

function greeting(name?: string): string {
  const safeName = name ? escapeHtml(name) : "";
  return `
    <p style="margin: 0 0 12px; font-family: ${EMAIL_STYLES.FONT}; font-size: 15.5px; font-weight: 700; line-height: 22px; color: ${EMAIL_STYLES.INK};">
      Hi${safeName ? ` ${safeName}` : " there"},
    </p>
  `;
}

function bodyCopy(text: string): string {
  return `
    <p style="margin: 0 0 18px; font-family: ${EMAIL_STYLES.FONT}; font-size: 14.5px; line-height: 23px; color: #334155;">
      ${text}
    </p>
  `;
}

export async function sendOTPEmail(
  email: string,
  otp: string,
  type: OtpType,
): Promise<EmailSendResult> {
  const isRegistration = type === OtpType.REGISTRATION;
  const subject = isRegistration
    ? `Welcome to ${APP_NAME} — verify your email`
    : `${APP_NAME} — reset your password`;
  const heading = isRegistration ? `Welcome to ${APP_NAME}` : "Reset your password";
  const subheading = isRegistration
    ? "One step left to start preparing"
    : "Use this code to continue securely";
  const message = isRegistration
    ? `Please use the one-time code below to verify your email and activate your account on ${APP_NAME}.`
    : "We received a request to reset your account password. Enter the one-time code below to choose a new password.";

  const html = wrapEmail({
    previewText: `${heading}. Your verification code is ${otp}. It expires in ${OTP_CONFIG.EXPIRY_MINUTES} minutes.`,
    heading,
    subheading,
    bodyHtml: `
      ${greeting()}
      ${bodyCopy(message)}
      <!-- Verification Code Hero Box -->
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin: 20px 0 20px;">
        <tr>
          <td align="center" style="background-color: #F4F9F5; border: 1.5px dashed #A5D6A7; border-radius: 14px; padding: 22px 18px;">
            <p style="margin: 0 0 9px; font-family: ${EMAIL_STYLES.FONT}; font-size: 10.5px; font-weight: 700; letter-spacing: 0.14em; text-transform: uppercase; color: #475569;">
              One-Time Verification Code
            </p>
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center">
              <tr>
                <td style="background-color: #FFFFFF; border: 1px solid #D5E5D8; border-radius: 12px; padding: 10px 28px; box-shadow: 0 4px 12px rgba(0, 95, 2, 0.06); text-align: center;">
                  <span style="font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace, ${EMAIL_STYLES.FONT}; font-size: 34px; font-weight: 800; letter-spacing: 9px; line-height: 40px; color: ${EMAIL_STYLES.GREEN}; display: inline-block; padding-left: 9px;">
                    ${escapeHtml(otp)}
                  </span>
                </td>
              </tr>
            </table>
            <p style="margin: 11px 0 0; font-family: ${EMAIL_STYLES.FONT}; font-size: 12px; color: #64748B; line-height: 17px;">
              ⏱ Valid for <strong>${OTP_CONFIG.EXPIRY_MINUTES} minutes</strong>. Please do not share this code.
            </p>
          </td>
        </tr>
      </table>
      ${emailNotice(
        `If you did not request this verification code, you can safely ignore this email. Your account remains secure.`,
        "info",
      )}
    `,
  });

  try {
    return await sendHtmlEmail(email, subject, html);
  } catch (error) {
    console.error("Failed to send email:", error);
    throw error;
  }
}

type GradeConfig = {
  label: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  accentColor: string;
  novaRemark: string;
  icon: string;
};

function getGradeConfig(percentage: number): GradeConfig {
  if (percentage >= 90) {
    return {
      label: "Distinction",
      badgeBg: "#DCFCE7",
      badgeText: "#14532D",
      badgeBorder: "#86EFAC",
      accentColor: "#16A34A",
      novaRemark:
        "Outstanding mastery! You demonstrated thorough conceptual understanding, exact formula application, and precise mathematical reasoning throughout.",
      icon: "🏆",
    };
  }
  if (percentage >= 75) {
    return {
      label: "Grade A (Excellent)",
      badgeBg: "#E8F5E9",
      badgeText: "#005F02",
      badgeBorder: "#A7F3D0",
      accentColor: "#005F02",
      novaRemark:
        "Impressive performance! You have a solid grasp of core syllabus topics. Review the examiner remarks below to pick up full method marks.",
      icon: "🌟",
    };
  }
  if (percentage >= 60) {
    return {
      label: "Grade B (Good)",
      badgeBg: "#E0F2FE",
      badgeText: "#0369A1",
      badgeBorder: "#BAE6FD",
      accentColor: "#0284C7",
      novaRemark:
        "Good effort! You understand the foundational steps well. Focus on writing out complete intermediate working to avoid minor deductions.",
      icon: "👍",
    };
  }
  if (percentage >= 45) {
    return {
      label: "Grade C (Pass)",
      badgeBg: "#FEF3C7",
      badgeText: "#92400E",
      badgeBorder: "#FDE68A",
      accentColor: "#D97706",
      novaRemark:
        "You met the passing benchmark. Practice targeted past paper problems to strengthen speed, precision, and multi-step questions.",
      icon: "📚",
    };
  }
  return {
    label: "Needs Improvement",
    badgeBg: "#FFE4E6",
    badgeText: "#9F1239",
    badgeBorder: "#FECDD3",
    accentColor: "#DC2626",
    novaRemark:
      "Every attempt helps you grow! Check Nova's step-by-step guidance for each question below, ensure your handwritten working is clearly legible, and retry to boost your score.",
    icon: "🎯",
  };
}

/**
 * Send grading result email to student after Paper II AI grading
 */
export async function sendGradingResultEmail(
  email: string,
  studentName: string,
  data: {
    attemptId: string;
    subject: string;
    score: number;
    totalMarks: number;
    percentage: number;
    pointsAwarded: number;
    gradingResults: Record<
      string,
      { score: number; maxMarks: number; feedback: string }
    >;
  },
): Promise<EmailSendResult> {
  const gradeConfig = getGradeConfig(data.percentage);
  const passed = data.percentage >= 50;
  const siteUrl = getSiteUrl();
  const novaAvatarUrl = getNovaImageUrl();
  const historyUrl = `${siteUrl}${FRONTEND_ROUTES.STUDENT_HISTORY_DETAIL(data.attemptId)}`;

  const questionCards = Object.entries(data.gradingResults)
    .map(([key, result], idx) => {
      const isZero = result.score === 0 || result.maxMarks <= 0;
      const ratio = result.maxMarks > 0 ? result.score / result.maxMarks : 0;
      const isFull = !isZero && result.score === result.maxMarks;

      // Solid 100% full opacity colors for badges and bars
      const statusColor = isFull
        ? "#16A34A"
        : ratio >= 0.5
          ? "#D97706"
          : "#DC2626";

      const pillBg = isFull
        ? "#DCFCE7"
        : ratio >= 0.5
          ? "#FEF3C7"
          : "#FFE4E6";

      const pillText = isFull
        ? "#15803D"
        : ratio >= 0.5
          ? "#92400E"
          : "#9F1239";

      const pillBorder = isFull
        ? "#86EFAC"
        : ratio >= 0.5
          ? "#FDE68A"
          : "#FECDD3";

      const barWidth = isZero ? 6 : Math.max(8, Math.min(100, Math.round(ratio * 100)));
      const formattedFeedback = formatMathToUnicode(result.feedback || "No feedback provided for this question.");
      const qLabel = key.match(/^(?:q|question)[\s_-]*(\d+)$/i)
        ? `Question ${key.replace(/^(?:q|question)[\s_-]*/i, "")}`
        : `Question ${idx + 1}`;

      return `
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin: 0 0 12px; background-color: #FFFFFF; border: 1px solid #CBD5E1; border-radius: 10px; overflow: hidden;">
          <tr>
            <td bgcolor="#F8FAFC" style="background-color: #F8FAFC; border-bottom: 1px solid #E2E8F0; padding: 10px 14px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td align="left" style="font-family: ${EMAIL_STYLES.FONT}; font-size: 13px; font-weight: 700; color: #0F172A;">
                    ${escapeHtml(qLabel)}
                  </td>
                  <td align="right">
                    <span style="display: inline-block; background-color: ${pillBg}; border: 1px solid ${pillBorder}; border-radius: 6px; padding: 3px 9px; font-family: ${EMAIL_STYLES.FONT}; font-size: 12px; font-weight: 700; color: ${pillText};">
                      ${result.score} / ${result.maxMarks} Marks
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding: 12px 14px 14px;">
              <!-- Progress Bar -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin: 0 0 10px; background-color: #E2E8F0; border-radius: 99px; height: 6px;">
                <tr>
                  <td width="${barWidth}%" bgcolor="${statusColor}" style="background-color: ${statusColor}; height: 6px; border-radius: 99px; font-size: 0; line-height: 0;">&nbsp;</td>
                  ${barWidth < 100 ? `<td width="${100 - barWidth}%" style="font-size: 0; line-height: 0;">&nbsp;</td>` : ""}
                </tr>
              </table>
              <!-- Feedback -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #F8FAFC; border-left: 3px solid ${statusColor}; border-radius: 4px;">
                <tr>
                  <td style="padding: 9px 12px; font-family: ${EMAIL_STYLES.FONT}; font-size: 12px; line-height: 19px; color: #334155;">
                    ${escapeHtml(formattedFeedback)}
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>`;
    })
    .join("");

  const html = wrapEmail({
    previewText: `Your ${data.subject} Paper II results are ready: ${data.score}/${data.totalMarks} (${data.percentage}%).`,
    heading: "Paper II Assessment Report",
    subheading: `${data.subject} · Graded by Nova AI`,
    headerBadge: "✦ AI-GRADED REPORT",
    avatarUrl: novaAvatarUrl,
    bodyHtml: `
      ${greeting(studentName)}
      ${bodyCopy(
        `Nova AI has completed grading your handwritten answers for <strong>${escapeHtml(data.subject)} Paper II</strong>. Below is your verified scorecard, performance summary, and question-by-question examiner remarks.`,
      )}

      <!-- Hero Scorecard -->
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin: 0 0 18px; background-color: #FFFFFF; border: 2px solid ${gradeConfig.accentColor}; border-radius: 14px; overflow: hidden;">
        <tr>
          <td align="center" bgcolor="${gradeConfig.badgeBg}" style="background-color: ${gradeConfig.badgeBg}; border-bottom: 1px solid ${gradeConfig.badgeBorder}; padding: 11px 16px;">
            <span style="font-family: ${EMAIL_STYLES.FONT}; font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: ${gradeConfig.badgeText};">
              ${gradeConfig.icon} ${escapeHtml(gradeConfig.label)}
            </span>
          </td>
        </tr>
        <tr>
          <td align="center" style="padding: 22px 20px 18px;">
            <p style="margin: 0 0 4px; font-family: ${EMAIL_STYLES.FONT}; font-size: 11px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: #64748B;">
              Total Score Obtained
            </p>
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center">
              <tr>
                <td style="font-family: ${EMAIL_STYLES.FONT}; font-size: 42px; font-weight: 800; line-height: 46px; color: #0F172A;">
                  ${data.score}
                </td>
                <td style="padding-left: 4px; font-family: ${EMAIL_STYLES.FONT}; font-size: 20px; font-weight: 600; line-height: 32px; color: #94A3B8;">
                  /${data.totalMarks}
                </td>
              </tr>
            </table>

            <!-- 3-Column Stats Grid -->
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin: 16px 0 0; background-color: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 10px;">
              <tr>
                <td align="center" width="33%" style="padding: 12px 6px; border-right: 1px solid #E2E8F0;">
                  <p style="margin: 0 0 2px; font-family: ${EMAIL_STYLES.FONT}; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: #64748B;">Percentage</p>
                  <p style="margin: 0; font-family: ${EMAIL_STYLES.FONT}; font-size: 16px; font-weight: 800; color: #0F172A;">${data.percentage}%</p>
                </td>
                <td align="center" width="34%" style="padding: 12px 6px; border-right: 1px solid #E2E8F0;">
                  <p style="margin: 0 0 2px; font-family: ${EMAIL_STYLES.FONT}; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: #64748B;">XP Earned</p>
                  <p style="margin: 0; font-family: ${EMAIL_STYLES.FONT}; font-size: 16px; font-weight: 800; color: #005F02;">+${data.pointsAwarded} XP</p>
                </td>
                <td align="center" width="33%" style="padding: 12px 6px;">
                  <p style="margin: 0 0 2px; font-family: ${EMAIL_STYLES.FONT}; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: #64748B;">Result</p>
                  <p style="margin: 0; font-family: ${EMAIL_STYLES.FONT}; font-size: 16px; font-weight: 800; color: ${passed ? "#16A34A" : "#DC2626"};">${passed ? "Passed " : "Retry ⟳"}</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>

      <!-- Nova AI Remarks Banner -->
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin: 0 0 18px; background-color: #F0FDF4; border: 1px solid #BBF7D0; border-left: 4px solid #005F02; border-radius: 10px;">
        <tr>
          <td style="padding: 14px 16px;">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
              <tr>
                <td width="38" valign="top" style="padding-right: 12px;">
                  <img src="${novaAvatarUrl}" alt="Nova AI" width="36" height="36" style="display: block; width: 36px; height: 36px; border-radius: 50%; border: 1.5px solid #005F02; background-color: #FFFFFF;" />
                </td>
                <td valign="top">
                  <p style="margin: 0 0 4px; font-family: ${EMAIL_STYLES.FONT}; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: #005F02;">
                    Nova AI Examiner Remarks
                  </p>
                  <p style="margin: 0; font-family: ${EMAIL_STYLES.FONT}; font-size: 13px; line-height: 20px; color: #166534;">
                    ${escapeHtml(gradeConfig.novaRemark)}
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>

      ${
        passed
          ? `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin: 0 0 18px; background-color: #F0FDF4; border: 1px solid #BBF7D0; border-radius: 10px;">
              <tr>
                <td style="padding: 12px 14px; font-family: ${EMAIL_STYLES.FONT}; font-size: 13px; line-height: 19px; color: #166534;">
                  🎓 <strong>Certificate Unlocked:</strong> You passed this paper! Your official certificate is available to view and download on your dashboard.
                </td>
              </tr>
            </table>`
          : ""
      }

      <!-- Question-by-Question Section Header -->
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin: 6px 0 12px;">
        <tr>
          <td align="left">
            <h2 style="margin: 0; font-family: ${EMAIL_STYLES.FONT}; font-size: 15px; font-weight: 700; color: #0F172A;">
              Question-by-Question Evaluation
            </h2>
          </td>
          <td align="right">
            <span style="font-family: ${EMAIL_STYLES.FONT}; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em; color: #64748B;">
              ${Object.keys(data.gradingResults).length} Questions
            </span>
          </td>
        </tr>
      </table>

      ${questionCards}

      <!-- CTA Button -->
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin: 14px 0 0;">
        <tr>
          <td align="center">
            ${emailButton(historyUrl, "View Full Paper & Solutions →")}
          </td>
        </tr>
      </table>
    `,
  });

  try {
    return await sendHtmlEmail(
      email,
      `${APP_NAME} — your Paper II results: ${data.subject} (${data.percentage}%)`,
      html,
    );
  } catch (error) {
    console.error("Failed to send grading result email:", error);
    throw error;
  }
}

/**
 * Send challenge invitation email
 */
export async function sendChallengeInviteEmail(
  email: string,
  inviteeName: string,
  creatorName: string,
  subject: string,
  challengeId: string,
): Promise<EmailSendResult> {
  const siteUrl = getSiteUrl();
  const challengeLink = `${siteUrl}${FRONTEND_ROUTES.STUDENT_CHALLENGE_DETAIL(challengeId)}`;

  const html = wrapEmail({
    previewText: `${creatorName} challenged you in ${subject}. Join the challenge on ${APP_NAME}.`,
    heading: "You've been challenged",
    subheading: "A classmate wants to test your knowledge",
    bodyHtml: `
      ${greeting(inviteeName)}
      ${bodyCopy(
        `<strong style="color: ${EMAIL_STYLES.INK};">${escapeHtml(creatorName)}</strong> invited you to a study challenge in <strong style="color: ${EMAIL_STYLES.INK};">${escapeHtml(subject)}</strong>. Join now to put your knowledge to the test and climb the leaderboard.`,
      )}
      ${emailDetailCard([
        { label: "Subject", value: escapeHtml(subject), accent: true },
        { label: "Challenged by", value: escapeHtml(creatorName) },
      ])}
      ${emailButton(challengeLink, "Join challenge")}
    `,
  });

  try {
    return await sendHtmlEmail(
      email,
      `${creatorName} challenged you in ${subject}`,
      html,
    );
  } catch (error) {
    console.error("Failed to send challenge invite email:", error);
    throw error;
  }
}

/**
 * Send classroom invitation email with a Join Classroom CTA
 */
export async function sendClassroomInviteEmail(params: {
  email: string;
  inviteeName: string;
  teacherName: string;
  subject: string;
  classLevel: string;
  classroomId: string;
  visibility: "school" | "private";
}): Promise<EmailSendResult | null> {
  if (!isEmailConfigured()) {
    console.error("Email configuration missing — skipping classroom invite email.");
    return null;
  }

  const siteUrl = getSiteUrl();
  const joinLink = `${siteUrl}${FRONTEND_ROUTES.STUDENT_CLASSROOM_JOIN(params.classroomId)}`;
  const visibilityLabel = params.visibility === "private" ? "Private classroom" : "School classroom";

  const html = wrapEmail({
    previewText: `${params.teacherName} invited you to join ${params.subject} · Class ${params.classLevel} on ${APP_NAME}.`,
    heading: "Classroom invitation",
    subheading: "Your teacher is waiting for you to join",
    bodyHtml: `
      ${greeting(params.inviteeName)}
      ${bodyCopy(
        `<strong style="color: ${EMAIL_STYLES.INK};">${escapeHtml(params.teacherName)}</strong> invited you to join a classroom on ${APP_NAME}.`,
      )}
      ${emailDetailCard([
        { label: "Subject", value: escapeHtml(params.subject), accent: true },
        { label: "Class", value: `Class ${escapeHtml(params.classLevel)}` },
        { label: "Type", value: visibilityLabel },
        { label: "Invited by", value: escapeHtml(params.teacherName) },
      ])}
      ${emailButton(joinLink, "Join classroom")}
    `,
  });

  try {
    return await sendHtmlEmail(
      params.email,
      `${params.teacherName} invited you to join ${params.subject} Class ${params.classLevel}`,
      html,
    );
  } catch (error) {
    console.error("Failed to send classroom invite email:", error);
    return null;
  }
}

/**
 * Send welcome email to student registered by a school with their credentials
 */
export async function sendRegistrationEmail(
  email: string,
  name: string,
  username: string,
  password: string,
  schoolName: string,
): Promise<EmailSendResult> {
  const siteUrl = getSiteUrl();
  const loginUrl = `${siteUrl}${FRONTEND_ROUTES.LOGIN}`;

  const html = wrapEmail({
    previewText: `${schoolName} registered you on ${APP_NAME}. Your login details are inside.`,
    heading: `Welcome to ${APP_NAME}`,
    subheading: "Your school has created your account",
    bodyHtml: `
      ${greeting(name)}
      ${bodyCopy(
        `<strong style="color: ${EMAIL_STYLES.INK};">${escapeHtml(schoolName)}</strong> registered you on ${APP_NAME}, the AI-powered exam preparation platform. Use the details below to sign in and start preparing.`,
      )}
      ${emailDetailCard([
        { label: "Email address", value: escapeHtml(email) },
        { label: "Username", value: escapeHtml(username) },
        {
          label: "Temporary password",
          value: `<span style="font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; letter-spacing: 0.04em;">${escapeHtml(password)}</span>`,
          accent: true,
        },
      ])}
      ${emailNotice(
        "For your security, you will be asked to <strong>complete your profile and change this password</strong> the first time you log in.",
        "warning",
      )}
      ${emailButton(loginUrl, "Log in to your dashboard")}
    `,
  });

  try {
    return await sendHtmlEmail(
      email,
      `Welcome to ${APP_NAME} — your login details`,
      html,
    );
  } catch (error) {
    console.error("Failed to send registration email:", error);
    throw error;
  }
}
