import type { jsPDF } from "jspdf";

/** Brand greens — match ExBoard primary (#005F02) */
const GREEN = { r: 0, g: 95, b: 2 };
const GREEN_LIGHT = { r: 0, g: 133, b: 3 };
const GREEN_DARK = { r: 0, g: 74, b: 2 };
const INK = { r: 15, g: 23, b: 42 };
const MUTED = { r: 100, g: 116, b: 139 };
const SOFT = { r: 241, g: 245, b: 249 };
const WHITE = { r: 255, g: 255, b: 255 };

/** Stamp teal from approved-badge screenshot */
const TEAL = { r: 91, g: 168, b: 148 };
const TEAL_DARK = { r: 64, g: 140, b: 122 };
const TEAL_SOFT = { r: 232, g: 245, b: 241 };

export interface AchievementCertificateInput {
  subject: string;
  score: number;
  totalMarks: number;
  createdAt: string;
  studentName?: string;
  schoolName?: string;
  board?: string | null;
  paperLabel?: string | null;
}

function gradeFromPercentage(percentage: number): string {
  if (percentage >= 90) return "A+";
  if (percentage >= 80) return "A";
  if (percentage >= 70) return "B";
  if (percentage >= 60) return "C";
  return "D";
}

function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = src;
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
  });
}

async function fetchAsBase64(url: string): Promise<string | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const buffer = await res.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    let binary = "";
    const chunk = 0x8000;
    for (let i = 0; i < bytes.length; i += chunk) {
      binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
    }
    return btoa(binary);
  } catch {
    return null;
  }
}

async function registerPoppins(doc: jsPDF): Promise<boolean> {
  const [regular, bold, semiBold] = await Promise.all([
    fetchAsBase64("/fonts/Poppins-Regular.ttf"),
    fetchAsBase64("/fonts/Poppins-Bold.ttf"),
    fetchAsBase64("/fonts/Poppins-SemiBold.ttf"),
  ]);

  if (!regular || !bold) return false;

  doc.addFileToVFS("Poppins-Regular.ttf", regular);
  doc.addFont("Poppins-Regular.ttf", "Poppins", "normal");
  doc.addFileToVFS("Poppins-Bold.ttf", bold);
  doc.addFont("Poppins-Bold.ttf", "Poppins", "bold");
  if (semiBold) {
    doc.addFileToVFS("Poppins-SemiBold.ttf", semiBold);
    doc.addFont("Poppins-SemiBold.ttf", "Poppins", "semibold");
  }
  return true;
}

function setFill(doc: jsPDF, color: { r: number; g: number; b: number }) {
  doc.setFillColor(color.r, color.g, color.b);
}

function setDraw(doc: jsPDF, color: { r: number; g: number; b: number }) {
  doc.setDrawColor(color.r, color.g, color.b);
}

function setText(doc: jsPDF, color: { r: number; g: number; b: number }) {
  doc.setTextColor(color.r, color.g, color.b);
}

function setFont(
  doc: jsPDF,
  hasPoppins: boolean,
  style: "normal" | "bold" | "italic" | "semibold" = "normal",
) {
  if (hasPoppins) {
    if (style === "italic") {
      doc.setFont("Poppins", "normal");
      return;
    }
    if (style === "semibold") {
      try {
        doc.setFont("Poppins", "semibold");
        return;
      } catch {
        doc.setFont("Poppins", "bold");
        return;
      }
    }
    doc.setFont("Poppins", style === "bold" ? "bold" : "normal");
    return;
  }
  doc.setFont("helvetica", style === "semibold" ? "bold" : style === "italic" ? "italic" : style);
}

function drawArcText(
  ctx: CanvasRenderingContext2D,
  text: string,
  cx: number,
  cy: number,
  radius: number,
  startAngle: number,
  endAngle: number,
  options?: { inward?: boolean },
) {
  const chars = text.split("");
  const inward = options?.inward ?? false;
  const totalAngle = endAngle - startAngle;
  const step = totalAngle / Math.max(chars.length - 1, 1);

  ctx.save();
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  chars.forEach((char, index) => {
    const angle = startAngle + step * index;
    const x = cx + radius * Math.cos(angle);
    const y = cy + radius * Math.sin(angle);
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle + Math.PI / 2 + (inward ? Math.PI : 0));
    ctx.fillText(char, 0, 0);
    ctx.restore();
  });

  ctx.restore();
}

/**
 * Renders a circular QA-approved stamp matching the product screenshot.
 */
async function renderApprovalBadge(params: {
  dateLabel: string;
  approvedBy: string;
}): Promise<string> {
  try {
    await Promise.all([
      document.fonts.load("700 34px Poppins"),
      document.fonts.load("700 28px Poppins"),
    ]);
  } catch {
    // Fall back to system sans if Poppins isn't ready
  }

  const size = 520;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";

  const cx = size / 2;
  const cy = size / 2;
  const outerR = size * 0.46;

  // Soft fill
  ctx.beginPath();
  ctx.arc(cx, cy, outerR, 0, Math.PI * 2);
  ctx.fillStyle = `rgb(${TEAL_SOFT.r}, ${TEAL_SOFT.g}, ${TEAL_SOFT.b})`;
  ctx.fill();

  // Outer thick ring
  ctx.beginPath();
  ctx.arc(cx, cy, outerR, 0, Math.PI * 2);
  ctx.strokeStyle = `rgb(${TEAL.r}, ${TEAL.g}, ${TEAL.b})`;
  ctx.lineWidth = 18;
  ctx.stroke();

  // Inner thin ring
  ctx.beginPath();
  ctx.arc(cx, cy, outerR - 28, 0, Math.PI * 2);
  ctx.strokeStyle = `rgb(${TEAL.r}, ${TEAL.g}, ${TEAL.b})`;
  ctx.lineWidth = 4;
  ctx.stroke();

  // Top arc text
  ctx.fillStyle = `rgb(${TEAL_DARK.r}, ${TEAL_DARK.g}, ${TEAL_DARK.b})`;
  ctx.font = "700 34px Poppins, sans-serif";
  drawArcText(ctx, "QA APPROVED", cx, cy, outerR - 58, -Math.PI * 0.78, -Math.PI * 0.22);

  // Checkmark badge
  const checkY = cy - 58;
  ctx.beginPath();
  ctx.arc(cx, checkY, 28, 0, Math.PI * 2);
  ctx.fillStyle = `rgb(${TEAL.r}, ${TEAL.g}, ${TEAL.b})`;
  ctx.fill();
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 5;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.beginPath();
  ctx.moveTo(cx - 12, checkY);
  ctx.lineTo(cx - 2, checkY + 10);
  ctx.lineTo(cx + 14, checkY - 10);
  ctx.stroke();

  // Diagonal date banner
  ctx.save();
  ctx.translate(cx, cy + 18);
  ctx.rotate((-18 * Math.PI) / 180);
  const bannerW = 290;
  const bannerH = 56;
  const radius = 14;
  ctx.fillStyle = `rgb(${TEAL.r}, ${TEAL.g}, ${TEAL.b})`;
  ctx.beginPath();
  ctx.moveTo(-bannerW / 2 + radius, -bannerH / 2);
  ctx.lineTo(bannerW / 2 - radius, -bannerH / 2);
  ctx.quadraticCurveTo(bannerW / 2, -bannerH / 2, bannerW / 2, -bannerH / 2 + radius);
  ctx.lineTo(bannerW / 2, bannerH / 2 - radius);
  ctx.quadraticCurveTo(bannerW / 2, bannerH / 2, bannerW / 2 - radius, bannerH / 2);
  ctx.lineTo(-bannerW / 2 + radius, bannerH / 2);
  ctx.quadraticCurveTo(-bannerW / 2, bannerH / 2, -bannerW / 2, bannerH / 2 - radius);
  ctx.lineTo(-bannerW / 2, -bannerH / 2 + radius);
  ctx.quadraticCurveTo(-bannerW / 2, -bannerH / 2, -bannerW / 2 + radius, -bannerH / 2);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "#ffffff";
  ctx.font = "700 28px Poppins, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(params.dateLabel, 0, 1);
  ctx.restore();

  // Bottom arc text
  ctx.fillStyle = `rgb(${TEAL_DARK.r}, ${TEAL_DARK.g}, ${TEAL_DARK.b})`;
  ctx.font = "700 28px Poppins, sans-serif";
  const byLabel = `BY ${params.approvedBy}`.toUpperCase();
  drawArcText(ctx, byLabel, cx, cy, outerR - 58, Math.PI * 0.28, Math.PI * 0.72, {
    inward: true,
  });

  return canvas.toDataURL("image/png");
}

/**
 * Builds a landscape A4 achievement certificate PDF and triggers download.
 */
export async function downloadAchievementCertificate(
  input: AchievementCertificateInput,
): Promise<void> {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a4",
  });

  const hasPoppins = await registerPoppins(doc);
  const font = (style: "normal" | "bold" | "italic" | "semibold" = "normal") =>
    setFont(doc, hasPoppins, style);

  const width = doc.internal.pageSize.getWidth();
  const height = doc.internal.pageSize.getHeight();
  const cx = width / 2;
  const percentage = Math.round((input.score / input.totalMarks) * 100);
  const grade = gradeFromPercentage(percentage);
  const studentName = (input.studentName || "Enthusiastic Student").trim();
  const schoolName = (input.schoolName || "Exboard AI Excellence").trim();
  const issueDate = new Date(input.createdAt).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  const badgeDate = new Date(input.createdAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  const approvedBy = "EXBOARD";

  // Soft page wash
  setFill(doc, WHITE);
  doc.rect(0, 0, width, height, "F");

  // Side accent panels
  setFill(doc, GREEN_DARK);
  doc.rect(0, 0, 6, height, "F");
  doc.rect(width - 6, 0, 6, height, "F");

  setFill(doc, GREEN);
  doc.rect(6, 0, 1.2, height, "F");
  doc.rect(width - 7.2, 0, 1.2, height, "F");

  // Outer elegant frame
  setDraw(doc, GREEN_DARK);
  doc.setLineWidth(1.2);
  doc.rect(10, 8, width - 20, height - 16);

  setDraw(doc, GREEN_LIGHT);
  doc.setLineWidth(0.35);
  doc.rect(12.5, 10.5, width - 25, height - 21);

  // Corner ornaments
  const corner = 14;
  setDraw(doc, GREEN);
  doc.setLineWidth(1.4);
  doc.line(10, 8 + corner, 10, 8);
  doc.line(10, 8, 10 + corner, 8);
  doc.line(width - 10 - corner, 8, width - 10, 8);
  doc.line(width - 10, 8, width - 10, 8 + corner);
  doc.line(10, height - 8 - corner, 10, height - 8);
  doc.line(10, height - 8, 10 + corner, height - 8);
  doc.line(width - 10 - corner, height - 8, width - 10, height - 8);
  doc.line(width - 10, height - 8, width - 10, height - 8 - corner);

  // Top ribbon band
  setFill(doc, { r: 236, g: 253, b: 245 });
  doc.rect(14, 13, width - 28, 8, "F");
  setText(doc, GREEN);
  font("bold");
  doc.setFontSize(8);
  doc.text("EXBOARD AI  ·  OFFICIAL CERTIFICATE OF ACHIEVEMENT", cx, 18.2, {
    align: "center",
  });

  // Logo
  const logo = await loadImage("/Logo.png");
  if (logo) {
    try {
      const logoWidth = 42;
      const logoHeight = (logo.height * logoWidth) / logo.width;
      doc.addImage(logo, "PNG", cx - logoWidth / 2, 24, logoWidth, logoHeight);
    } catch {
      // continue without logo
    }
  }

  // Title
  setText(doc, INK);
  font("bold");
  doc.setFontSize(26);
  doc.text("CERTIFICATE OF ACHIEVEMENT", cx, 58, { align: "center" });

  // Decorative title rule
  setDraw(doc, GREEN);
  doc.setLineWidth(0.6);
  doc.line(cx - 55, 63, cx - 6, 63);
  doc.line(cx + 6, 63, cx + 55, 63);
  setFill(doc, GREEN);
  doc.circle(cx, 63, 1.6, "F");

  // Awarded to
  setText(doc, MUTED);
  font("normal");
  doc.setFontSize(11);
  doc.text("This certificate is proudly awarded to", cx, 74, { align: "center" });

  // Name
  setText(doc, INK);
  font("bold");
  doc.setFontSize(24);
  const displayName = studentName.toUpperCase();
  doc.text(displayName, cx, 88, { align: "center" });

  const nameWidth = Math.min(doc.getTextWidth(displayName) + 8, width - 60);
  setDraw(doc, GREEN_LIGHT);
  doc.setLineWidth(0.45);
  doc.line(cx - nameWidth / 2, 92, cx + nameWidth / 2, 92);

  // Achievement copy
  setText(doc, MUTED);
  font("normal");
  doc.setFontSize(11);
  const subjectLine = input.paperLabel
    ? `For outstanding performance in ${input.subject} · ${input.paperLabel}`
    : `For outstanding performance in ${input.subject}`;
  doc.text(subjectLine, cx, 102, { align: "center" });
  doc.setFontSize(10);
  doc.text("Conducted by ExBoard AI Portal", cx, 110, { align: "center" });
  doc.text(`at ${schoolName}`, cx, 117, { align: "center" });
  if (input.board) {
    setText(doc, GREEN);
    font("bold");
    doc.setFontSize(9);
    doc.text(String(input.board).toUpperCase(), cx, 124, { align: "center" });
  }

  // Stats panel
  const panelY = 130;
  const panelH = 26;
  const panelX = 38;
  const panelW = width - 76;

  setFill(doc, SOFT);
  setDraw(doc, { r: 226, g: 232, b: 240 });
  doc.setLineWidth(0.3);
  doc.roundedRect(panelX, panelY, panelW, panelH, 3, 3, "FD");

  setFill(doc, GREEN);
  doc.roundedRect(panelX, panelY, panelW, 2.2, 1, 1, "F");
  setFill(doc, SOFT);
  doc.rect(panelX, panelY + 1.4, panelW, 1.2, "F");

  const col1 = panelX + panelW * 0.17;
  const col2 = cx;
  const col3 = panelX + panelW * 0.83;
  const labelY = panelY + 10;
  const valueY = panelY + 19.5;

  setText(doc, MUTED);
  font("bold");
  doc.setFontSize(8);
  doc.text("SCORE", col1, labelY, { align: "center" });
  doc.text("GRADE", col2, labelY, { align: "center" });
  doc.text("PERCENTAGE", col3, labelY, { align: "center" });

  setText(doc, GREEN_DARK);
  font("bold");
  doc.setFontSize(15);
  doc.text(`${input.score}/${input.totalMarks}`, col1, valueY, { align: "center" });
  doc.text(grade, col2, valueY, { align: "center" });
  doc.text(`${percentage}%`, col3, valueY, { align: "center" });

  setDraw(doc, { r: 203, g: 213, b: 225 });
  doc.setLineWidth(0.25);
  doc.line(panelX + panelW / 3, panelY + 6, panelX + panelW / 3, panelY + panelH - 4);
  doc.line(
    panelX + (panelW * 2) / 3,
    panelY + 6,
    panelX + (panelW * 2) / 3,
    panelY + panelH - 4,
  );

  // Footer meta
  const footerY = height - 14;
  setDraw(doc, { r: 226, g: 232, b: 240 });
  doc.setLineWidth(0.3);
  doc.line(20, footerY - 18, width - 20, footerY - 18);

  setText(doc, MUTED);
  font("normal");
  doc.setFontSize(8);
  doc.text(`Issue Date: ${issueDate}`, 22, footerY);
  doc.text("Powered by ExBoard AI · Advanced Exam Preparation", width - 22, footerY, {
    align: "right",
  });

  // Approval badge replaces authorized signatory
  const badgeDataUrl = await renderApprovalBadge({
    dateLabel: badgeDate,
    approvedBy,
  });
  if (badgeDataUrl) {
    const badgeSize = 34;
    doc.addImage(
      badgeDataUrl,
      "PNG",
      cx - badgeSize / 2,
      height - 52,
      badgeSize,
      badgeSize,
    );
  }

  const safeSubject = input.subject.replace(/[^\w\s-]/g, "").trim() || "Achievement";
  doc.save(`${safeSubject}_ExBoardAI_Certificate.pdf`);
}
