import { APP_NAME, APP_DESCRIPTION } from "@/constants";
import { resolveSiteUrl } from "@/lib/site";

const GREEN = "#005F02";
const GREEN_DARK = "#004702";
const GREEN_SOFT = "#F0F8F1";
const GREEN_BORDER = "#D6E8D8";
const INK = "#0F172A";
const INK_BODY = "#334155";
const MUTED = "#64748B";
const BORDER = "#DCE8DD";
const PAGE_BG = "#EEF2EF";
const WHITE = "#FFFFFF";
const FONT = "'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

function isLocalDevUrl(url: string): boolean {
  return /localhost|127\.0\.0\.1|0\.0\.0\.0/i.test(url);
}

/** Public logo URL for email headers — defaults to dark variant for primary green headers */
export function getEmailLogoUrl(variant: "light" | "dark" = "dark"): string {
  const filename = variant === "dark" ? "AppLogoDark.png" : "AppLogoLight.png";
  if (process.env.EMAIL_LOGO_URL) {
    return process.env.EMAIL_LOGO_URL;
  }

  const candidates = [
    process.env.EMAIL_SITE_URL,
    process.env.NEXT_PUBLIC_SITE_URL,
  ].filter(Boolean) as string[];

  for (const candidate of candidates) {
    const siteUrl = candidate.replace(/\/$/, "");
    if (isLocalDevUrl(siteUrl)) {
      continue;
    }
    return `${siteUrl}/${filename}`;
  }

  return `${resolveSiteUrl()}/${filename}`;
}

/** Public Nova avatar URL for email reports — never use localhost */
export function getNovaImageUrl(): string {
  if (process.env.NOVA_AVATAR_URL) {
    return process.env.NOVA_AVATAR_URL;
  }

  const candidates = [
    process.env.EMAIL_SITE_URL,
    process.env.NEXT_PUBLIC_SITE_URL,
  ].filter(Boolean) as string[];

  for (const candidate of candidates) {
    const siteUrl = candidate.replace(/\/$/, "");
    if (isLocalDevUrl(siteUrl)) {
      continue;
    }
    return `${siteUrl}/nova-tutor.png`;
  }

  return `${resolveSiteUrl()}/nova-tutor.png`;
}

export function getSiteUrl(): string {
  return resolveSiteUrl();
}

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function emailButton(href: string, label: string): string {
  return `
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" style="margin: 22px auto 8px;">
      <tr>
        <td align="center" bgcolor="${GREEN}" style="background-color: ${GREEN}; border-radius: 12px; box-shadow: 0 4px 14px rgba(0, 95, 2, 0.28);">
          <a href="${href}" target="_blank" rel="noopener noreferrer" style="display: inline-block; padding: 14px 34px; font-family: ${FONT}; font-size: 14px; font-weight: 700; line-height: 20px; color: ${WHITE}; text-decoration: none; border-radius: 12px; letter-spacing: 0.02em;">
            ${escapeHtml(label)}
          </a>
        </td>
      </tr>
    </table>
    <p style="margin: 8px 0 0; font-family: ${FONT}; font-size: 11px; line-height: 16px; color: ${MUTED}; text-align: center;">
      If the button does not work, <a href="${href}" target="_blank" rel="noopener noreferrer" style="color: ${GREEN}; font-weight: 600; text-decoration: underline;">open this link</a>.
    </p>
  `;
}

export function emailNotice(
  messageHtml: string,
  variant: "warning" | "success" | "info" = "info",
): string {
  const styles = {
    warning: { bg: "#FFFBEB", border: "#FDE68A", leftBar: "#D97706", color: "#92400E" },
    success: { bg: "#F0FDF4", border: "#BBF7D0", leftBar: "#16A34A", color: "#166534" },
    info: { bg: "#F2F9F3", border: "#D2E8D5", leftBar: GREEN, color: GREEN_DARK },
  }[variant];

  return `
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin: 0 0 18px;">
      <tr>
        <td style="background-color: ${styles.bg}; border: 1px solid ${styles.border}; border-left: 4px solid ${styles.leftBar}; border-radius: 10px; padding: 13px 16px; font-family: ${FONT}; font-size: 13px; line-height: 20px; color: ${styles.color};">
          ${messageHtml}
        </td>
      </tr>
    </table>
  `;
}

export function emailDetailCard(rows: { label: string; value: string; accent?: boolean }[]): string {
  const rowHtml = rows
    .map(
      (row, index) => `
        <tr>
          <td style="padding: ${index === 0 ? "2px 0 10px" : "10px 0"}; ${index === rows.length - 1 ? "" : `border-bottom: 1px solid #E6EFE8;`}">
            <p style="margin: 0 0 3px; font-family: ${FONT}; font-size: 10px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: ${MUTED};">
              ${escapeHtml(row.label)}
            </p>
            <p style="margin: 0; font-family: ${FONT}; font-size: 14px; font-weight: 600; line-height: 20px; color: ${row.accent ? GREEN : INK};">
              ${row.value}
            </p>
          </td>
        </tr>
      `,
    )
    .join("");

  return `
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin: 0 0 20px; background-color: #F8FAF8; border: 1.5px solid #E0EDE2; border-radius: 14px;">
      <tr>
        <td style="padding: 16px 20px;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
            ${rowHtml}
          </table>
        </td>
      </tr>
    </table>
  `;
}

export function wrapEmail({
  previewText,
  heading,
  subheading,
  headerBadge,
  avatarUrl,
  bodyHtml,
  footerNote,
}: {
  previewText: string;
  heading: string;
  subheading?: string;
  headerBadge?: string;
  avatarUrl?: string;
  bodyHtml: string;
  footerNote?: string;
}): string {
  const year = new Date().getFullYear();
  const siteUrl = getSiteUrl();

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <meta name="color-scheme" content="light" />
  <meta name="supported-color-schemes" content="light" />
  <title>${escapeHtml(heading)} · ${APP_NAME}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
  <style>
    @import url("https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&display=swap");
    :root {
      color-scheme: light;
      supported-color-schemes: light;
    }
    body, table, td, a, p, h1, h2, h3, span {
      font-family: ${FONT};
    }
    @media (prefers-color-scheme: dark) {
      .email-bg {
        background-color: ${PAGE_BG} !important;
      }
      .email-container {
        background-color: ${WHITE} !important;
      }
      .email-header-primary {
        background-color: ${GREEN} !important;
        background: ${GREEN} !important;
      }
    }
    [data-ogsc] .email-header-primary {
      background-color: ${GREEN} !important;
      background: ${GREEN} !important;
    }
    [data-ogsc] .email-container {
      background-color: ${WHITE} !important;
    }
  </style>
</head>
<body class="email-bg" style="margin: 0; padding: 0; background-color: ${PAGE_BG}; font-family: ${FONT}; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%;">
  <div style="display: none; max-height: 0; overflow: hidden; opacity: 0; color: transparent;">
    ${escapeHtml(previewText)}
    ${"&nbsp;&zwnj;".repeat(30)}
  </div>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" class="email-bg" style="background-color: ${PAGE_BG};">
    <tr>
      <td align="center" style="padding: 24px 12px 32px;">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" class="email-container" style="width: 100%; max-width: 580px; background-color: ${WHITE}; border: 1px solid #D8E4DA; border-radius: 18px; overflow: hidden; box-shadow: 0 10px 30px rgba(0, 60, 0, 0.06);">
          <!-- Brand Header: Primary Green with AppLogo Dark -->
          <tr>
            <td align="center" bgcolor="${GREEN}" class="email-header-primary" style="background-color: ${GREEN}; background: linear-gradient(145deg, #005F02 0%, #004502 100%); padding: 36px 28px 30px; text-align: center;">
              <!-- AppLogo Dark on Primary Green -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" style="margin: 0 auto;">
                <tr>
                  <td align="center">
                    <a href="${siteUrl}" target="_blank" rel="noopener noreferrer" style="text-decoration: none; display: inline-block;">
                      <img src="${getEmailLogoUrl("dark")}" alt="${APP_NAME}" width="160" height="88" style="display: block; margin: 0 auto; width: 160px; max-width: 160px; height: auto; border: 0; outline: none; text-decoration: none;" />
                    </a>
                  </td>
                </tr>
              </table>

              ${
                avatarUrl
                  ? `<table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" style="margin: 16px auto 4px;">
                      <tr>
                        <td align="center" style="padding: 0;">
                          <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                            <tr>
                              <td bgcolor="#FFFFFF" style="background-color: #FFFFFF; border: 3px solid #FFFFFF; border-radius: 50%; padding: 0; width: 68px; height: 68px; text-align: center; vertical-align: middle; box-shadow: 0 4px 16px rgba(0, 0, 0, 0.25);">
                                <img src="${avatarUrl}" alt="Nova AI" width="68" height="68" style="display: block; width: 68px; height: 68px; border-radius: 50%; object-fit: cover; border: 0;" />
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>`
                  : ""
              }

              ${
                headerBadge
                  ? `<table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" style="margin: 14px auto 8px;">
                      <tr>
                        <td align="center" style="background-color: rgba(255, 255, 255, 0.16); border: 1px solid rgba(255, 255, 255, 0.30); border-radius: 999px; padding: 5px 16px;">
                          <span style="font-family: ${FONT}; font-size: 11px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; color: #FFFFFF;">
                            ${escapeHtml(headerBadge)}
                          </span>
                        </td>
                      </tr>
                    </table>`
                  : ""
              }

              <h1 style="margin: ${avatarUrl || headerBadge ? "10px" : "14px"} 0 0; font-family: ${FONT}; font-size: 22px; font-weight: 800; line-height: 29px; letter-spacing: -0.3px; color: #FFFFFF;">
                ${escapeHtml(heading)}
              </h1>

              ${
                subheading
                  ? `<p style="margin: 6px 0 0; font-family: ${FONT}; font-size: 13.5px; font-weight: 500; line-height: 19px; color: #D1FAE5; letter-spacing: 0.01em;">${escapeHtml(subheading)}</p>`
                  : ""
              }
            </td>
          </tr>

          <!-- Email Body Content -->
          <tr>
            <td style="padding: 30px 28px 12px; font-family: ${FONT}; color: ${INK_BODY}; font-size: 14.5px; line-height: 23px;">
              ${bodyHtml}
            </td>
          </tr>

          <!-- Signoff -->
          <tr>
            <td style="padding: 6px 28px 24px;">
              <p style="margin: 0; font-family: ${FONT}; font-size: 13px; line-height: 20px; color: ${MUTED};">
                Warm regards,<br />
                <strong style="color: ${INK}; font-size: 14px;">The ${APP_NAME} Team</strong>
              </p>
            </td>
          </tr>

          <!-- Polished Footer -->
          <tr>
            <td align="center" bgcolor="#F7FAF7" style="background-color: #F7FAF7; border-top: 1px solid #E5EFE7; padding: 22px 24px 24px; text-align: center;">
              <p style="margin: 0 0 6px; font-family: ${FONT}; font-size: 11px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; color: ${GREEN};">
                Learn · Compete · Prepare
              </p>
              <p style="margin: 0 0 8px; font-family: ${FONT}; font-size: 12px; line-height: 18px; color: ${MUTED}; max-width: 440px;">
                ${APP_DESCRIPTION}
              </p>
              ${
                footerNote
                  ? `<p style="margin: 0 0 8px; font-family: ${FONT}; font-size: 11.5px; line-height: 17px; color: ${MUTED};">${footerNote}</p>`
                  : ""
              }
              <p style="margin: 0 0 10px; font-family: ${FONT}; font-size: 11px; line-height: 16px; color: #94A3B8;">
                <a href="${siteUrl}" target="_blank" rel="noopener noreferrer" style="color: ${GREEN}; text-decoration: none; font-weight: 600;">Website</a>
                &nbsp;&bull;&nbsp;
                <a href="${siteUrl}/terms" target="_blank" rel="noopener noreferrer" style="color: ${MUTED}; text-decoration: none;">Terms of Service</a>
                &nbsp;&bull;&nbsp;
                <a href="${siteUrl}/privacy" target="_blank" rel="noopener noreferrer" style="color: ${MUTED}; text-decoration: none;">Privacy Policy</a>
              </p>
              <p style="margin: 0; font-family: ${FONT}; font-size: 10.5px; line-height: 16px; color: #94A3B8;">
                &copy; ${year} ${APP_NAME} &bull; All rights reserved &bull; Powered by MacroPulse Systems
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export const EMAIL_STYLES = {
  GREEN,
  GREEN_DARK,
  GREEN_SOFT,
  GREEN_BORDER,
  INK,
  INK_BODY,
  MUTED,
  BORDER,
  WHITE,
  FONT,
};

