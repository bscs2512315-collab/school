const { chromium } = require("playwright");
const path = require("path");
const fs = require("fs");

const SHOTS_DIR = path.join(__dirname, "../public/guide-shots");
const LANDING_SHOTS_DIR = path.join(__dirname, "../public/landing");
const PDF_OUT = path.join(__dirname, "../public/ExBoard_AI_Student_Feature_Guide.pdf");
const HTML_OUT = path.join(__dirname, "../public/ExBoard_AI_Student_Feature_Guide.html");

function getBase64(filePath) {
  if (fs.existsSync(filePath)) {
    const ext = path.extname(filePath).slice(1);
    const data = fs.readFileSync(filePath).toString("base64");
    return `data:image/${ext};base64,${data}`;
  }
  return "";
}

const PUBLIC_DIR = path.join(__dirname, "../public");

// Map of real screenshots (authenticated desktop shots & mobile shots)
const shots = {
  appLogoDark: getBase64(path.join(PUBLIC_DIR, "AppLogoDark.png")),
  appLogoLight: getBase64(path.join(PUBLIC_DIR, "AppLogoLight.png")),
  dashDesk: getBase64(path.join(SHOTS_DIR, "desk-dashboard.png")),
  dashMob: getBase64(path.join(LANDING_SHOTS_DIR, "mobile-dashboard.png")),
  p1ListDesk: getBase64(path.join(SHOTS_DIR, "desk-past-papers-1.png")),
  p1ListMob: getBase64(path.join(LANDING_SHOTS_DIR, "mobile-past-papers.png")),
  p1AttemptDesk: getBase64(path.join(SHOTS_DIR, "desk-past-paper-1-attempt.png")),
  p2ListDesk: getBase64(path.join(SHOTS_DIR, "desk-past-papers-2.png")),
  p2DetailDesk: getBase64(path.join(SHOTS_DIR, "desk-past-paper-2-detail.png")),
  p2AttemptDesk: getBase64(path.join(LANDING_SHOTS_DIR, "paper-attempt-shot.png")),
  labDesk: getBase64(path.join(SHOTS_DIR, "desk-lab-game.png")),
  leadDesk: getBase64(path.join(SHOTS_DIR, "desk-leaderboard.png")),
  leadMob: getBase64(path.join(LANDING_SHOTS_DIR, "mobile-leaderboard.png")),
  novaDesk: getBase64(path.join(SHOTS_DIR, "desk-nova.png")),
  novaMob: getBase64(path.join(LANDING_SHOTS_DIR, "mobile-nova.png")),
  genDesk: getBase64(path.join(SHOTS_DIR, "desk-generate.png")),
  genMob: getBase64(path.join(LANDING_SHOTS_DIR, "mobile-generate.png")),
  notesDesk: getBase64(path.join(SHOTS_DIR, "desk-solved-notes.png")),
  journalDesk: getBase64(path.join(SHOTS_DIR, "desk-practical-journals.png")),
  curricDesk: getBase64(path.join(SHOTS_DIR, "desk-curriculum.png")),
  challDesk: getBase64(path.join(SHOTS_DIR, "desk-challenge.png")),
  classDesk: getBase64(path.join(SHOTS_DIR, "desk-classrooms.png")),
  regDesk: getBase64(path.join(SHOTS_DIR, "desk-register.png")),
  regMob: getBase64(path.join(LANDING_SHOTS_DIR, "mobile-dashboard.png")),
};

function renderMacBook(imgSrc, title = "ExBoard AI Desktop", width = "100%") {
  return `
    <div class="macbook-mockup" style="${width !== "100%" ? `width: ${width}; max-width: ${width};` : ""}">
      <div class="macbook-lid">
        <div class="macbook-notch">
          <span class="notch-cam"></span>
          <span class="notch-led"></span>
        </div>
        <div class="macbook-screen">
          <img src="${imgSrc}" alt="${title}" class="screen-img" />
          <div class="screen-glare"></div>
        </div>
      </div>
      <div class="macbook-hinge"></div>
      <div class="macbook-base">
        <div class="macbook-thumb"></div>
      </div>
    </div>
  `;
}

function renderIPhone(imgSrc, title = "ExBoard AI Mobile", width = "100%") {
  return `
    <div class="iphone-mockup" style="${width !== "100%" ? `width: ${width}; max-width: ${width};` : ""}">
      <div class="iphone-bezel">
        <div class="iphone-screen">
          <div class="iphone-statusbar">
            <span class="sb-time">16:31</span>
            <div class="iphone-notch">
              <span class="notch-speaker"></span>
              <span class="notch-lens"></span>
            </div>
            <div class="sb-icons">
              <svg class="icon-svg" viewBox="0 0 17 12"><rect x="0.5" y="8.5" width="2.5" height="3.5" rx="0.6" fill="white"/><rect x="4.5" y="6" width="2.5" height="6" rx="0.6" fill="white"/><rect x="8.5" y="3" width="2.5" height="9" rx="0.6" fill="white"/><rect x="12.5" y="0.5" width="2.5" height="11.5" rx="0.6" fill="white"/></svg>
              <svg class="icon-svg" viewBox="0 0 16 12"><path d="M8 10.5a1.2 1.2 0 1 1 0-2.4 1.2 1.2 0 0 1 0 2.4Z" fill="white"/><path fill-rule="evenodd" clip-rule="evenodd" d="M4.65 6.65a4.75 4.75 0 0 1 6.7 0 .75.75 0 0 0 1.06-1.06 6.25 6.25 0 0 0-8.82 0 .75.75 0 1 0 1.06 1.06Z" fill="white"/><path fill-rule="evenodd" clip-rule="evenodd" d="M1.82 3.82a8.75 8.75 0 0 1 12.36 0 .75.75 0 1 0 1.06-1.06 10.25 10.25 0 0 0-14.48 0 .75.75 0 1 0 1.06 1.06Z" fill="white"/></svg>
              <svg class="icon-svg" viewBox="0 0 26 12" fill="none"><rect x="0.75" y="0.75" width="21.5" height="10.5" rx="3" stroke="white" stroke-width="1.3"/><rect x="2.5" y="2.5" width="15" height="7" rx="1.5" fill="white"/><path d="M23.5 4.2C24.4 4.5 25 5.2 25 6s-.6 1.5-1.5 1.8v-3.6Z" fill="white"/></svg>
            </div>
          </div>
          <div class="iphone-content">
            <img src="${imgSrc}" alt="${title}" class="screen-img" />
            <div class="screen-glare"></div>
          </div>
          <div class="iphone-homebar"></div>
        </div>
      </div>
    </div>
  `;
}

const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>ExBoard AI — Student Portal Feature Guide</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&family=Outfit:wght@500;600;700;800;900&display=swap');

    @page {
      size: A4 portrait;
      margin: 0;
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }

    body {
      font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background-color: #002b01;
      color: #0f172a;
      line-height: 1.45;
      font-size: 12.5px;
    }

    .page {
      width: 210mm;
      height: 297mm;
      position: relative;
      overflow: hidden;
      page-break-after: always;
      page-break-inside: avoid;
      background: #ffffff;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      padding: 14mm 16mm 12mm 16mm;
    }

    /* Cover Page */
    .page.cover-page {
      background: linear-gradient(145deg, #005f02 0%, #004501 50%, #002601 100%);
      color: #ffffff;
      padding: 18mm 18mm 14mm 18mm;
    }

    /* Common Header & Footer */
    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1.5px solid #e2e8f0;
      padding-bottom: 8px;
      margin-bottom: 12px;
    }

    .page-header .brand {
      display: flex;
      align-items: center;
      gap: 8px;
      font-family: 'Outfit', sans-serif;
      font-weight: 800;
      font-size: 12px;
      color: #94a3b8;
    }

    .page-header .brand img {
      height: 30px;
      width: auto;
      max-width: 150px;
      object-fit: contain;
    }

    .page-header .brand span {
      color: #64748b;
      font-weight: 700;
      font-size: 11.5px;
    }

    .page-header .section-tag {
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.12em;
      color: #64748b;
      background: #f1f5f9;
      padding: 3px 10px;
      border-radius: 999px;
    }

    .page-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-top: 1.5px solid #e2e8f0;
      padding-top: 8px;
      margin-top: 10px;
      font-size: 10px;
      color: #64748b;
      font-weight: 600;
    }

    .page-footer .left-info {
      display: flex;
      gap: 12px;
    }

    /* Cover Page Elements */
    .cover-top {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .cover-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: rgba(251, 191, 36, 0.15);
      border: 1px solid rgba(251, 191, 36, 0.35);
      border-radius: 999px;
      padding: 4px 14px;
      font-size: 11px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.15em;
      color: #fbbf24;
    }

    .cover-title-box {
      margin-top: 16px;
    }

    .cover-title {
      font-family: 'Outfit', sans-serif;
      font-size: 38px;
      font-weight: 900;
      line-height: 1.08;
      letter-spacing: -0.04em;
    }

    .cover-title .gold-text,
    .cover-title .green-text {
      color: #fbbf24;
      text-shadow: 0 0 25px rgba(251, 191, 36, 0.45);
    }

    .cover-subtitle {
      font-size: 14px;
      line-height: 1.5;
      color: rgba(255, 255, 255, 0.9);
      margin-top: 10px;
      max-width: 580px;
      font-weight: 500;
    }

    .cover-pills {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
      margin-top: 14px;
    }

    .cover-pill {
      background: rgba(251, 191, 36, 0.14);
      border: 1px solid rgba(251, 191, 36, 0.35);
      padding: 4px 10px;
      border-radius: 8px;
      font-size: 11px;
      font-weight: 700;
      color: #fde68a;
    }

    .cover-hero-mockups {
      position: relative;
      margin-top: 16px;
      display: flex;
      justify-content: center;
      align-items: flex-end;
    }

    .cover-hero-mockups .desk-wrap {
      width: 480px;
    }

    .cover-hero-mockups .mob-wrap {
      position: absolute;
      right: 15px;
      bottom: -6px;
      width: 148px;
      z-index: 10;
    }

    .cover-footer-meta {
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: rgba(0, 0, 0, 0.35);
      border: 1px solid rgba(255, 255, 255, 0.12);
      border-radius: 14px;
      padding: 10px 16px;
      margin-top: 12px;
    }

    .cover-meta-item {
      display: flex;
      flex-direction: column;
    }

    .cover-meta-item .label {
      font-size: 9px;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: rgba(255, 255, 255, 0.6);
      font-weight: 700;
    }

    .cover-meta-item .val {
      font-size: 12px;
      font-weight: 800;
      color: #ffffff;
    }

    /* Section Cards Layout */
    .section-headline {
      margin-bottom: 12px;
    }

    .section-headline h2 {
      font-family: 'Outfit', sans-serif;
      font-size: 22px;
      font-weight: 900;
      letter-spacing: -0.03em;
      color: #0f172a;
      line-height: 1.15;
    }

    .section-headline h2 span {
      color: #005f02;
    }

    .section-headline p {
      font-size: 12px;
      color: #475569;
      margin-top: 3px;
      font-weight: 500;
    }

    .feature-grid-2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
      flex: 1;
    }

    .feature-card {
      background: #f8fafc;
      border: 1.5px solid #e2e8f0;
      border-radius: 16px;
      padding: 12px 14px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }

    .feature-card.dark-theme {
      background: linear-gradient(145deg, #005f02 0%, #004201 100%);
      border-color: #008503;
      color: #ffffff;
    }

    .feature-card.dark-theme p {
      color: rgba(255, 255, 255, 0.9);
    }

    .feature-card.dark-theme .feature-num {
      background: rgba(251, 191, 36, 0.2);
      color: #fbbf24;
    }

    .feature-card.dark-theme .feature-badge-soft {
      background: rgba(251, 191, 36, 0.2);
      color: #fbbf24;
    }

    .feature-card-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 8px;
    }

    .feature-num {
      font-family: 'Outfit', sans-serif;
      font-size: 10px;
      font-weight: 900;
      background: rgba(0, 95, 2, 0.08);
      color: #005f02;
      padding: 3px 8px;
      border-radius: 6px;
      letter-spacing: 0.05em;
    }

    .feature-badge-soft {
      font-size: 9.5px;
      font-weight: 800;
      text-transform: uppercase;
      background: rgba(0, 95, 2, 0.1);
      color: #005f02;
      padding: 2.5px 8px;
      border-radius: 999px;
    }

    .feature-title {
      font-family: 'Outfit', sans-serif;
      font-size: 16px;
      font-weight: 800;
      color: #0f172a;
      letter-spacing: -0.02em;
      margin-bottom: 4px;
    }

    .feature-card.dark-theme .feature-title {
      color: #ffffff;
    }

    .feature-desc {
      font-size: 11.5px;
      color: #475569;
      line-height: 1.45;
      font-weight: 500;
      margin-bottom: 8px;
    }

    .feature-points {
      list-style: none;
      display: flex;
      flex-direction: column;
      gap: 5px;
      margin-bottom: 8px;
    }

    .feature-points li {
      display: flex;
      align-items: flex-start;
      gap: 6px;
      font-size: 11px;
      font-weight: 600;
      color: #334155;
    }

    .feature-card.dark-theme .feature-points li {
      color: rgba(255, 255, 255, 0.95);
    }

    .feature-points li::before {
      content: '✓';
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 14px;
      height: 14px;
      background: #005f02;
      color: #ffffff;
      border-radius: 50%;
      font-size: 8.5px;
      font-weight: 900;
      flex-shrink: 0;
      margin-top: 1px;
    }

    .feature-card.dark-theme .feature-points li::before {
      background: #fbbf24;
      color: #004a02;
      font-weight: 900;
    }

    .mockup-container {
      margin-top: auto;
      display: flex;
      justify-content: center;
      align-items: center;
      padding: 4px 0 2px 0;
    }

    /* Comparison Box (Problem vs Solution) */
    .vs-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 14px;
      margin: 6px 0 10px 0;
    }

    .problem-box {
      background: #fff1f2;
      border: 1.5px solid #fecdd3;
      border-radius: 16px;
      padding: 12px 14px;
    }

    .problem-box h3 {
      font-family: 'Outfit', sans-serif;
      font-size: 14px;
      font-weight: 800;
      color: #e11d48;
      display: flex;
      align-items: center;
      gap: 6px;
      margin-bottom: 8px;
    }

    .solution-box {
      background: rgba(0, 95, 2, 0.05);
      border: 1.5px solid rgba(0, 95, 2, 0.22);
      border-radius: 16px;
      padding: 12px 14px;
    }

    .solution-box h3 {
      font-family: 'Outfit', sans-serif;
      font-size: 14px;
      font-weight: 800;
      color: #005f02;
      display: flex;
      align-items: center;
      gap: 6px;
      margin-bottom: 8px;
    }

    .vs-list {
      list-style: none;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .vs-list li {
      display: flex;
      align-items: flex-start;
      gap: 7px;
      font-size: 11px;
      line-height: 1.35;
    }

    .problem-box .vs-list li strong {
      color: #be123c;
      min-width: 90px;
    }

    .solution-box .vs-list li strong {
      color: #005f02;
      min-width: 90px;
    }

    /* Highlight Banner */
    .highlight-banner {
      background: linear-gradient(135deg, #004a02 0%, #005f02 100%);
      border: 1.5px solid #008503;
      border-radius: 12px;
      padding: 10px 14px;
      color: #ffffff;
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin: 8px 0;
    }

    .highlight-banner .text {
      font-size: 11.5px;
      font-weight: 600;
    }

    .highlight-banner .text strong {
      color: #fbbf24;
    }

    .highlight-banner .badge {
      background: #fbbf24;
      color: #004a02;
      font-family: 'Outfit', sans-serif;
      font-weight: 900;
      font-size: 10px;
      padding: 4px 10px;
      border-radius: 6px;
      letter-spacing: 0.05em;
      text-transform: uppercase;
      flex-shrink: 0;
    }

    /* Dual Mockup Showcase */
    .dual-mockup-showcase {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 16px;
      background: #f8fafc;
      border: 1.5px solid #e2e8f0;
      border-radius: 16px;
      padding: 14px 18px;
      margin-top: 10px;
    }

    .dual-mockup-showcase.dark-wrap {
      background: linear-gradient(145deg, #004a02 0%, #003001 100%);
      border-color: #008503;
    }

    /* Step flow on Sign up page */
    .step-flow {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 10px;
      margin-bottom: 12px;
    }

    .step-card {
      background: #f8fafc;
      border: 1.5px solid #e2e8f0;
      border-radius: 14px;
      padding: 12px;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .step-card .step-badge {
      font-family: 'Outfit', sans-serif;
      font-size: 9.5px;
      font-weight: 900;
      background: #005f02;
      color: #ffffff;
      padding: 2px 7px;
      border-radius: 6px;
      align-self: flex-start;
    }

    .step-card .step-title {
      font-family: 'Outfit', sans-serif;
      font-size: 13.5px;
      font-weight: 800;
      color: #0f172a;
    }

    .step-card .step-desc {
      font-size: 10.5px;
      color: #475569;
      line-height: 1.4;
    }

    /* ========================================================================= */
    /* REALISTIC MACBOOK PRO MOCKUP (Pure CSS Vector Construction) */
    /* ========================================================================= */
    .macbook-mockup {
      width: 100%;
      max-width: 330px;
      display: flex;
      flex-direction: column;
      align-items: center;
      filter: drop-shadow(0 14px 20px rgba(0, 0, 0, 0.22));
    }

    .macbook-lid {
      width: 100%;
      background: #1e2124;
      border: 2px solid #363a3e;
      border-bottom: 1px solid #141618;
      border-radius: 9px 9px 2px 2px;
      padding: 4px 4px 5px 4px;
      position: relative;
      box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.2);
    }

    .macbook-notch {
      position: absolute;
      top: 4px;
      left: 50%;
      transform: translateX(-50%);
      width: 34px;
      height: 4px;
      background: #141618;
      border-radius: 0 0 3px 3px;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 3px;
      z-index: 10;
    }

    .notch-cam {
      width: 2.2px;
      height: 2.2px;
      background: #1d4ed8;
      border-radius: 50%;
      box-shadow: 0 0 2px #3b82f6;
    }

    .notch-led {
      width: 1.2px;
      height: 1.2px;
      background: #22c55e;
      border-radius: 50%;
      opacity: 0.7;
    }

    .macbook-screen {
      width: 100%;
      aspect-ratio: 16 / 10;
      background: #090d16;
      border-radius: 5px;
      overflow: hidden;
      position: relative;
    }

    .macbook-screen .screen-img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      object-position: top center;
      display: block;
    }

    .screen-glare {
      position: absolute;
      top: 0;
      right: 0;
      width: 50%;
      height: 100%;
      background: linear-gradient(120deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0) 60%);
      pointer-events: none;
    }

    .macbook-hinge {
      width: 90px;
      height: 3px;
      background: #111315;
      border-radius: 1px 1px 0 0;
    }

    .macbook-base {
      width: 110%;
      height: 6px;
      background: linear-gradient(180deg, #32363b 0%, #1c1e21 100%);
      border-radius: 0 0 8px 8px;
      position: relative;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.4);
      display: flex;
      justify-content: center;
    }

    .macbook-thumb {
      width: 44px;
      height: 2.5px;
      background: #111315;
      border-radius: 0 0 3px 3px;
    }

    /* ========================================================================= */
    /* ========================================================================= */
    /* REALISTIC IPHONE 13 PRO MOCKUP (Flush Notch, Status Bar & Icons) */
    /* ========================================================================= */
    .iphone-mockup {
      width: 100%;
      max-width: 115px;
      filter: drop-shadow(0 14px 20px rgba(0, 0, 0, 0.25));
    }

    .iphone-bezel {
      background: #1c1e21;
      border: 2px solid #363a3e;
      border-radius: 20px;
      padding: 3px;
      box-shadow: inset 0 0 2px rgba(255, 255, 255, 0.25);
    }

    .iphone-screen {
      width: 100%;
      background: #005f02;
      border-radius: 17px;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      position: relative;
    }

    .iphone-statusbar {
      position: relative;
      width: 100%;
      height: 15px;
      background: #005f02;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 7px;
      z-index: 20;
      flex-shrink: 0;
    }

    .sb-time {
      font-size: 7px;
      font-weight: 800;
      color: #ffffff;
      letter-spacing: -0.02em;
      line-height: 1;
      z-index: 25;
    }

    .iphone-notch {
      position: absolute;
      top: 0;
      left: 50%;
      transform: translateX(-50%);
      width: 36px;
      height: 9.5px;
      background: #000000;
      border-radius: 0 0 7px 7px;
      z-index: 30;
      display: block;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
    }

    .notch-speaker {
      position: absolute;
      top: 0.8px;
      left: 50%;
      transform: translateX(-50%);
      width: 11px;
      height: 1.2px;
      background: #232730;
      border-radius: 1px;
      box-shadow: inset 0 0 0.5px rgba(255, 255, 255, 0.15);
    }

    .notch-lens {
      position: absolute;
      left: 6px;
      top: 50%;
      transform: translateY(-50%);
      width: 2.8px;
      height: 2.8px;
      background: #0b101c;
      border-radius: 50%;
      box-shadow: inset 0 0 1px #0284c7, 0 0 0.5px rgba(255, 255, 255, 0.2);
    }

    .notch-lens::after {
      content: '';
      position: absolute;
      top: 0.6px;
      left: 0.6px;
      width: 1px;
      height: 1px;
      background: #38bdf8;
      border-radius: 50%;
      opacity: 0.8;
    }

    .sb-icons {
      display: flex;
      align-items: center;
      gap: 2.5px;
      z-index: 25;
    }

    .sb-icons .icon-svg {
      width: 8px;
      height: 8px;
      display: block;
    }

    .iphone-content {
      width: 100%;
      aspect-ratio: 390 / 844;
      position: relative;
      overflow: hidden;
      margin-top: 0;
      background: #ffffff;
      display: block;
    }

    .iphone-content .screen-img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      object-position: top center;
      display: block;
    }

    .iphone-homebar {
      position: absolute;
      bottom: 2px;
      left: 50%;
      transform: translateX(-50%);
      width: 28px;
      height: 1.5px;
      background: rgba(0, 0, 0, 0.35);
      border-radius: 999px;
      z-index: 25;
    }
  </style>
</head>
<body>

  <!-- ===================================================================== -->
  <!-- PAGE 1: COVER / THUMBNAIL (ULTRA PREMIUM DARK EMERALD) -->
  <!-- ===================================================================== -->
  <div class="page cover-page">
    <div class="cover-top">
      <div class="cover-badge">
        <span>★</span> OFFICIAL STUDENT FEATURE GUIDE · 2026 EDITION
      </div>
      <img src="${shots.appLogoDark}" alt="ExBoard AI" style="height: 52px; width: auto; max-width: 230px; object-fit: contain;" />
    </div>

    <div class="cover-title-box">
      <h1 class="cover-title">
        The Complete <span class="gold-text">Student Portal</span><br>Feature &amp; Practice Guide.
      </h1>
      <p class="cover-subtitle">
        Everything AKUEB &amp; Sindh Board students (Classes IX–XII) need to ace their board exams with instant AI feedback, interactive virtual labs, and real solved past papers.
      </p>

      <div class="cover-pills">
        <span class="cover-pill">✓ AKUEB &amp; Sindh Board Syllabi</span>
        <span class="cover-pill">✓ Instant MCQ Grading</span>
        <span class="cover-pill">✓ Paper 2 Theory Examiner AI</span>
        <span class="cover-pill">✓ 3D Interactive Lab Games</span>
        <span class="cover-pill">✓ 24/7 Nova AI Tutor</span>
        <span class="cover-pill">✓ Chapter &amp; SLO Generator</span>
      </div>
    </div>

    <!-- Dual Hero Mockups (MacBook + iPhone Overlap) -->
    <div class="cover-hero-mockups">
      <div class="desk-wrap">
        ${renderMacBook(shots.dashDesk, "ExBoard AI Student Dashboard")}
      </div>
      <div class="mob-wrap">
        ${renderIPhone(shots.dashMob, "ExBoard AI Mobile Dashboard")}
      </div>
    </div>

    <div class="cover-footer-meta">
      <div class="cover-meta-item">
        <span class="label">TARGET BOARDS</span>
        <span class="val">AKUEB &amp; Sindh Board</span>
      </div>
      <div class="cover-meta-item">
        <span class="label">TARGET CLASSES</span>
        <span class="val">Classes IX, X, XI &amp; XII</span>
      </div>
      <div class="cover-meta-item">
        <span class="label">PLATFORM ACCESS</span>
        <span class="val">Web, iOS PWA &amp; Android</span>
      </div>
      <div class="cover-meta-item">
        <span class="label">OFFICIAL PORTAL</span>
        <span class="val"><a href="https://exboardai.tech" target="_blank" style="color: #fbbf24; text-decoration: underline; text-underline-offset: 2px;">exboardai.tech</a></span>
      </div>
    </div>
  </div>

  <!-- ===================================================================== -->
  <!-- PAGE 2: INTRODUCTION (PROBLEM OF CLASSIC PREP VS EXBOARD AI SOLUTION) -->
  <!-- ===================================================================== -->
  <div class="page">
    <div>
      <div class="page-header">
        <div class="brand"><img src="${shots.appLogoLight}" alt="ExBoard AI" /> · <span>Student Feature Guide</span></div>
        <div class="section-tag">Overview &amp; Problem vs Solution</div>
      </div>

      <div class="section-headline">
        <h2>Why Classic Board Prep is <span>Broken</span> (and How We Fixed It).</h2>
        <p>Thousands of board students in Pakistan face the exact same daily study frustrations when attempting to prepare for AKUEB and Sindh Board examinations.</p>
      </div>

      <!-- Problem vs Solution Comparison Grid -->
      <div class="vs-grid">
        <div class="problem-box">
          <h3>
            <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="m15 9-6 6M9 9l6 6"/></svg>
            The Classic Prep Pain Points
          </h3>
          <ul class="vs-list">
            <li><strong>✕ Frustrating Spam &amp; Pop-up Ads:</strong> Free study websites are flooded with intrusive ads and malware download buttons.</li>
            <li><strong>✕ Scattered, Blurred PDFs:</strong> Finding legitimate board past papers requires downloading dozens of broken Google Drive links.</li>
            <li><strong>✕ Tedious Manual Answer Keys:</strong> Flipping back and forth between question booklets and answer sheets wastes precious revision hours.</li>
            <li><strong>✕ Zero Chapter-Wise Practice:</strong> You can only attempt full 3-hour yearly papers with no option to drill specific weak chapters.</li>
            <li><strong>✕ Nobody to Check Paper 2 (Theory):</strong> CRQs and ERQs sit unchecked with zero rubric feedback or constructive guidance.</li>
            <li><strong>✕ Outdated Syllabi:</strong> Students memorize obsolete topics that were removed from recent AKUEB SLO guidelines.</li>
          </ul>
        </div>

        <div class="solution-box">
          <h3>
            <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>
            The ExBoard AI Smart Solution
          </h3>
          <ul class="vs-list">
            <li><strong>★ Ad-Free, Pure Focus UI:</strong> Clean, high-performance web and mobile portal built exclusively for productive board revision.</li>
            <li><strong>★ One-Tap Solved Paper Bank:</strong> Complete digital repository of authentic yearly past papers for Classes IX to XII.</li>
            <li><strong>★ Instant MCQ Auto-Grading:</strong> Immediate correct answer reveal with complete mathematical and conceptual step-by-step explanations.</li>
            <li><strong>★ Custom Chapter &amp; SLO Generator:</strong> Pick any 2–3 chapters or specific syllabus learning outcomes to generate tailored drills.</li>
            <li><strong>★ Subjective AI Examiner:</strong> Submit typed or handwritten Paper 2 answers for instant rubric-aligned scoring.</li>
            <li><strong>★ 24/7 AI Personal Tutor (Nova):</strong> Ask Nova about any difficult derivation, concept, or marking scheme question anytime.</li>
          </ul>
        </div>
      </div>

      <div class="highlight-banner">
        <div class="text">
          <strong>The Result:</strong> Students prepare 3× faster, identify knowledge gaps instantly, and walk into board exams with full confidence.
        </div>
        <div class="badge">Next: Core Features</div>
      </div>

      <!-- Overview Hardware Showcase -->
      <div class="dual-mockup-showcase">
        ${renderMacBook(shots.dashDesk, "Student Dashboard", "340px")}
        ${renderIPhone(shots.dashMob, "Mobile View", "115px")}
      </div>
    </div>

    <div class="page-footer">
      <div class="left-info">
        <span>ExBoard AI Academic Guide</span>
        <span>•</span>
        <span>Problem vs Solution</span>
      </div>
      <div>Page 2 of 9</div>
    </div>
  </div>

  <!-- ===================================================================== -->
  <!-- PAGE 3: FEATURE 1 (PAST PAPER 1 - MCQS) - FULL DEDICATED SHOWCASE -->
  <!-- ===================================================================== -->
  <div class="page">
    <div>
      <div class="page-header">
        <div class="brand"><img src="${shots.appLogoLight}" alt="ExBoard AI" /> · <span>Student Feature Guide</span></div>
        <div class="section-tag">Feature 01 · Past Paper 1 (MCQs)</div>
      </div>

      <div class="section-headline">
        <h2>Feature 1: <span>Past Paper 1 (MCQs)</span> — Instant Grading, No Answer Keys.</h2>
        <p>Attempt authentic AKUEB and Sindh Board Paper 1 exams with zero manual checking and instant step-by-step solutions.</p>
      </div>

      <div class="feature-card" style="margin-bottom: 12px; padding: 12px 16px;">
        <div class="feature-card-header">
          <span class="feature-num">FEATURE 01 · CORE ENGINE</span>
          <span class="feature-badge-soft">No More Checking Answer Keys</span>
        </div>
        <h3 class="feature-title" style="font-size: 17px;">Paper 1 · Real-Time MCQ Simulation &amp; Detailed Explanations</h3>
        <p class="feature-desc" style="font-size: 12px;">
          Forget flipping between question booklets and scattered answer keys at the back of past papers. ExBoard AI's MCQ engine simulates exact board conditions and evaluates your score immediately upon completion.
        </p>
        <ul class="feature-points" style="grid-template-columns: 1fr 1fr; display: grid; gap: 6px 14px;">
          <li><strong>No Need to Check Answer Keys:</strong> Immediate score reveal with full breakdown of right and wrong options.</li>
          <li><strong>Step-by-Step Mathematical Steps:</strong> Nova AI explains every derivation, calculation, and conceptual reasoning.</li>
          <li><strong>Authentic Timed Countdown:</strong> Live countdown timer and average time-per-question velocity analytics.</li>
          <li><strong>Question Matrix &amp; Flagging:</strong> Jump between questions, flag doubts for review, and submit with confidence.</li>
          <li><strong>Complete Yearly Bank:</strong> Authentic papers from 2018–2025 across all major science and general subjects.</li>
          <li><strong>Performance Diagnostics:</strong> Pinpoints weak topics to target in your next revision session.</li>
        </ul>
      </div>

      <div class="section-headline" style="margin-bottom: 6px;">
        <h2 style="font-size: 15px;">Hardware Showcase: <span>Paper Attempt Engine &amp; Paper Listing Directory</span></h2>
      </div>

      <!-- Dual Mockups: Paper 1 Attempt MacBook + Paper 1 Listing iPhone -->
      <div class="dual-mockup-showcase">
        <div style="flex: 1.6; display: flex; flex-direction: column; align-items: center;">
          <div style="font-size: 10.5px; font-weight: 800; color: #005f02; margin-bottom: 4px; text-transform: uppercase;">1. Active MCQ Attempt Engine (Real Test)</div>
          ${renderMacBook(shots.p1AttemptDesk, "Paper 1 Attempt Engine", "330px")}
        </div>
        <div style="flex: 0.9; display: flex; flex-direction: column; align-items: center;">
          <div style="font-size: 10.5px; font-weight: 800; color: #005f02; margin-bottom: 4px; text-transform: uppercase;">2. Mobile Paper Listing</div>
          ${renderIPhone(shots.p1ListMob, "Mobile Paper 1 Directory", "110px")}
        </div>
      </div>
    </div>

    <div class="page-footer">
      <div class="left-info">
        <span>ExBoard AI Academic Guide</span>
        <span>•</span>
        <span>Feature 1: Past Paper 1 (MCQs)</span>
      </div>
      <div>Page 3 of 9</div>
    </div>
  </div>

  <!-- ===================================================================== -->
  <!-- PAGE 4: FEATURE 2 (PAST PAPER 2 - THEORY & AI PAPER CHECK) -->
  <!-- ===================================================================== -->
  <div class="page">
    <div>
      <div class="page-header">
        <div class="brand"><img src="${shots.appLogoLight}" alt="ExBoard AI" /> · <span>Student Feature Guide</span></div>
        <div class="section-tag">Feature 02 · Past Paper 2 (Theory)</div>
      </div>

      <div class="section-headline">
        <h2>Feature 2: <span>Past Paper 2 (Theory)</span> — AI Examiner &amp; Paper Check.</h2>
        <p>Solve constructed response questions (CRQs) and extended response questions (ERQs) with dedicated rubric checking.</p>
      </div>

      <div class="feature-card dark-theme" style="margin-bottom: 12px; padding: 12px 16px;">
        <div class="feature-card-header">
          <span class="feature-num" style="background: rgba(251,191,36,0.2); color: #fbbf24;">FEATURE 02 · CORE ENGINE</span>
          <span class="feature-badge-soft" style="background: rgba(251,191,36,0.2); color: #fbbf24;">Explicit Paper Check Functionality</span>
        </div>
        <h3 class="feature-title" style="font-size: 17px;">Paper 2 · Subjective Theory Examiner &amp; Rubric Feedback</h3>
        <p class="feature-desc" style="font-size: 12px;">
          The biggest roadblock in subjective board preparation is that nobody checks your written answers. ExBoard AI's dedicated Paper Check feature evaluates your descriptive answers against official board marking rubrics.
        </p>
        <ul class="feature-points" style="grid-template-columns: 1fr 1fr; display: grid; gap: 6px 14px;">
          <li><strong>Explicit Paper Check Functionality:</strong> Submit typed solutions or photos of handwritten sheets for instant rubric scoring.</li>
          <li><strong>Step-Mark Evaluation:</strong> Checks formula substitution, intermediate working, SI units, and diagram mentions.</li>
          <li><strong>Official Marking Scheme Alignment:</strong> Evaluates answers using authentic AKUEB and Sindh Board criteria.</li>
          <li><strong>Missing Keyword Alerts:</strong> Highlights critical scientific terms required to earn full credit from board examiners.</li>
          <li><strong>Model Solution Comparison:</strong> View ideal full-mark answers to learn exactly how to format subjective responses.</li>
          <li><strong>Chapter-Wise CRQ/ERQ Filters:</strong> Filter subjective past papers by specific units to practice targeted topics.</li>
        </ul>
      </div>

      <div class="section-headline" style="margin-bottom: 6px;">
        <h2 style="font-size: 15px;">Hardware Showcase: <span>Paper 2 Subject Explorer &amp; Subjective Solver</span></h2>
      </div>

      <!-- Dual Mockups: Paper 2 Listing MacBook + Subjective Attempt Screen -->
      <div class="dual-mockup-showcase dark-wrap">
        <div style="flex: 1.3; display: flex; flex-direction: column; align-items: center;">
          <div style="font-size: 10.5px; font-weight: 800; color: #fbbf24; margin-bottom: 4px; text-transform: uppercase;">1. Paper 2 Subject Selection Directory</div>
          ${renderMacBook(shots.p2ListDesk, "Paper 2 Listing", "310px")}
        </div>
        <div style="flex: 1.3; display: flex; flex-direction: column; align-items: center;">
          <div style="font-size: 10.5px; font-weight: 800; color: #fbbf24; margin-bottom: 4px; text-transform: uppercase;">2. Yearly Subjective Papers &amp; Start Exam</div>
          ${renderMacBook(shots.p2DetailDesk, "Paper 2 Yearly Exam Portal", "310px")}
        </div>
      </div>
    </div>

    <div class="page-footer">
      <div class="left-info">
        <span>ExBoard AI Academic Guide</span>
        <span>•</span>
        <span>Feature 2: Past Paper 2 (Theory)</span>
      </div>
      <div>Page 4 of 9</div>
    </div>
  </div>

  <!-- ===================================================================== -->
  <!-- PAGE 5: FEATURES 3 & 4 (3D LAB GAME & LIVE LEADERBOARD) -->
  <!-- ===================================================================== -->
  <div class="page">
    <div>
      <div class="page-header">
        <div class="brand"><img src="${shots.appLogoLight}" alt="ExBoard AI" /> · <span>Student Feature Guide</span></div>
        <div class="section-tag">Interactive Labs &amp; Gamification</div>
      </div>

      <div class="section-headline">
        <h2>Features 3 &amp; 4: <span>3D Virtual Lab Games</span> &amp; <span>Live Leaderboard</span></h2>
        <p>Interactive 3D science practicals combined with city and nationwide academic competition.</p>
      </div>

      <div class="feature-grid-2">
        <!-- Feature 3 -->
        <div class="feature-card">
          <div>
            <div class="feature-card-header">
              <span class="feature-num">FEATURE 03</span>
              <span class="feature-badge-soft">Class XII Ready</span>
            </div>
            <h3 class="feature-title">3D Interactive Lab Games</h3>
            <p class="feature-desc">Gamified 3D virtual science laboratories where students manipulate real apparatus, perform chemical titrations, and observe physics mechanics.</p>
            <ul class="feature-points">
              <li><strong>AKUEB Class XII Practicals Ready:</strong> Full acid–base titration, redox reactions, and calorimetry simulations available.</li>
              <li><strong>Class IX–XI Under Active Development:</strong> Physics optics and biology microscopy games arriving soon.</li>
              <li><strong>Viva Voce Prep:</strong> Virtual lab quizzes ensure full marks in external practical examinations.</li>
            </ul>
          </div>
          <div class="mockup-container">
            ${renderMacBook(shots.labDesk, "3D Lab Game")}
          </div>
        </div>

        <!-- Feature 4 -->
        <div class="feature-card">
          <div>
            <div class="feature-card-header">
              <span class="feature-num">FEATURE 04</span>
              <span class="feature-badge-soft">Competitive Ranks</span>
            </div>
            <h3 class="feature-title">Live Student Leaderboard</h3>
            <p class="feature-desc">Compete with classmates, school peers, and board toppers across Karachi, Hyderabad, and nationwide standings.</p>
            <ul class="feature-points">
              <li><strong>Real-Time XP &amp; Score Standings:</strong> Earn XP for every paper solved, quiz completed, and streak maintained.</li>
              <li><strong>School &amp; City Filters:</strong> Check where your school ranks in AKUEB and Sindh Board performance.</li>
              <li><strong>Milestones &amp; Badges:</strong> Unlock Master, Scholar, and Legend tiers as your preparation progresses.</li>
            </ul>
          </div>
          <div class="mockup-container">
            ${renderMacBook(shots.leadDesk, "Leaderboard Standings")}
          </div>
        </div>
      </div>
    </div>

    <div class="page-footer">
      <div class="left-info">
        <span>ExBoard AI Academic Guide</span>
        <span>•</span>
        <span>Features 3 &amp; 4: Lab &amp; Competition</span>
      </div>
      <div>Page 5 of 9</div>
    </div>
  </div>

  <!-- ===================================================================== -->
  <!-- PAGE 6: FEATURES 5 & 6 (NOVA AI TUTOR & CHAPTER-WISE GENERATOR) -->
  <!-- ===================================================================== -->
  <div class="page">
    <div>
      <div class="page-header">
        <div class="brand"><img src="${shots.appLogoLight}" alt="ExBoard AI" /> · <span>Student Feature Guide</span></div>
        <div class="section-tag">AI Intelligence &amp; Custom Prep</div>
      </div>

      <div class="section-headline">
        <h2>Features 5 &amp; 6: <span>24/7 Nova AI Tutor</span> &amp; <span>Chapter-Wise Paper Generation</span></h2>
        <p>Your on-demand private tutor paired with flexible custom practice builders (Play &amp; Prep).</p>
      </div>

      <div class="feature-grid-2">
        <!-- Feature 5 -->
        <div class="feature-card dark-theme">
          <div>
            <div class="feature-card-header">
              <span class="feature-num" style="background: rgba(251,191,36,0.2); color: #fbbf24;">FEATURE 05</span>
              <span class="feature-badge-soft" style="background: rgba(251,191,36,0.2); color: #fbbf24;">Always Online</span>
            </div>
            <h3 class="feature-title">24/7 Nova AI Tutor Chat</h3>
            <p class="feature-desc">A specialized AI tutor trained on AKUEB and Sindh Board textbooks, marking schemes, and past paper trends.</p>
            <ul class="feature-points">
              <li><strong>Instant Concept Clarification:</strong> Ask doubts at 2 AM before exam day and get clear, concise explanations.</li>
              <li><strong>Step-by-Step Derivations:</strong> Breaks down complex physics formulas and mathematics solutions logically.</li>
              <li><strong>Exam Strategy Advice:</strong> Guides you on time allocation, high-yield topics, and common student errors.</li>
            </ul>
          </div>
          <div class="mockup-container">
            ${renderMacBook(shots.novaDesk, "Nova AI Tutor Chat")}
          </div>
        </div>

        <!-- Feature 6 -->
        <div class="feature-card">
          <div>
            <div class="feature-card-header">
              <span class="feature-num">FEATURE 06</span>
              <span class="feature-badge-soft">Play &amp; Prep</span>
            </div>
            <h3 class="feature-title">Custom Chapter-Wise Generator</h3>
            <p class="feature-desc">Build personalized past paper tests by selecting specific chapters you want to master instead of doing full yearly papers.</p>
            <ul class="feature-points">
              <li><strong>Targeted Weak Spots:</strong> Select 1, 2, or 3 specific units (e.g. Thermodynamics + Electromagnetism).</li>
              <li><strong>Custom Question Counts:</strong> Generate quick 10-question sprints or comprehensive 40-question mock exams.</li>
              <li><strong>Instant Assessment:</strong> See chapter mastery percentages and recommended remedial topics.</li>
            </ul>
          </div>
          <div class="mockup-container">
            ${renderMacBook(shots.genDesk, "Custom Paper Generator")}
          </div>
        </div>
      </div>
    </div>

    <div class="page-footer">
      <div class="left-info">
        <span>ExBoard AI Academic Guide</span>
        <span>•</span>
        <span>Features 5 &amp; 6: AI &amp; Custom Papers</span>
      </div>
      <div>Page 6 of 9</div>
    </div>
  </div>

  <!-- ===================================================================== -->
  <!-- PAGE 7: FEATURES 7 & 8 (SLO-WISE GENERATION & SINDH BOARD NOTES) -->
  <!-- ===================================================================== -->
  <div class="page">
    <div>
      <div class="page-header">
        <div class="brand"><img src="${shots.appLogoLight}" alt="ExBoard AI" /> · <span>Student Feature Guide</span></div>
        <div class="section-tag">SLO Mastery &amp; Solved Notes</div>
      </div>

      <div class="section-headline">
        <h2>Features 7 &amp; 8: <span>SLO-Wise Generation</span> &amp; <span>Sindh Board Solved Notes</span></h2>
        <p>Curriculum-aligned precision practice and structured chapter notes.</p>
      </div>

      <div class="feature-grid-2">
        <!-- Feature 7 -->
        <div class="feature-card">
          <div>
            <div class="feature-card-header">
              <span class="feature-num">FEATURE 07</span>
              <span class="feature-badge-soft">Curriculum Precision</span>
            </div>
            <h3 class="feature-title">Custom SLO-Wise Paper Generator</h3>
            <p class="feature-desc">Drill down into individual Student Learning Outcomes (SLOs) to ensure 100% syllabus alignment for AKUEB exams.</p>
            <ul class="feature-points">
              <li><strong>SLO Code Filtering:</strong> Filter questions by specific cognitive domains: Knowledge (K), Understanding (U), Application (A).</li>
              <li><strong>Zero Syllabus Gaps:</strong> Verify every official syllabus bullet point has been thoroughly tested and solved.</li>
              <li><strong>Mastery Analytics:</strong> Track green/amber/red indicators for every syllabus topic.</li>
            </ul>
          </div>
          <div class="mockup-container">
            ${renderMacBook(shots.genDesk, "SLO Generation")}
          </div>
        </div>

        <!-- Feature 8 -->
        <div class="feature-card">
          <div>
            <div class="feature-card-header">
              <span class="feature-num">FEATURE 08</span>
              <span class="feature-badge-soft">Sindh Board Ready</span>
            </div>
            <h3 class="feature-title">Solved Notes for Sindh Board</h3>
            <p class="feature-desc">Comprehensive, board-verified chapter notes, short questions, long derivations, and formula sheets for Sindh Board students.</p>
            <ul class="feature-points">
              <li><strong>Matric &amp; Intermediate:</strong> Complete coverage for Physics, Chemistry, Biology, Mathematics &amp; Computer Science.</li>
              <li><strong>Urdu &amp; English Mediums:</strong> Clean typography formatted for fast digital reading and offline revision.</li>
              <li><strong>AKUEB Notes Coming Soon:</strong> Specialized AKUEB conceptual summary notes currently in production.</li>
            </ul>
          </div>
          <div class="mockup-container">
            ${renderMacBook(shots.notesDesk, "Sindh Board Solved Notes")}
          </div>
        </div>
      </div>
    </div>

    <div class="page-footer">
      <div class="left-info">
        <span>ExBoard AI Academic Guide</span>
        <span>•</span>
        <span>Features 7 &amp; 8: SLOs &amp; Notes</span>
      </div>
      <div>Page 7 of 9</div>
    </div>
  </div>

  <!-- ===================================================================== -->
  <!-- PAGE 8: FEATURES 9, 10, 11 & 12 (JOURNALS, CURRICULUM, CHALLENGES, CLASSROOMS) -->
  <!-- ===================================================================== -->
  <div class="page">
    <div>
      <div class="page-header">
        <div class="brand"><img src="${shots.appLogoLight}" alt="ExBoard AI" /> · <span>Student Feature Guide</span></div>
        <div class="section-tag">Practicals, Curriculum, 1v1 &amp; Classrooms</div>
      </div>

      <div class="section-headline">
        <h2>Features 9 to 12: <span>Journals, Curriculum, 1v1 Battles &amp; Classrooms</span></h2>
        <p>Everything else you need for a complete school and board preparation lifecycle.</p>
      </div>

      <div class="feature-grid-2" style="grid-template-rows: 1fr 1fr; margin-bottom: 10px;">
        <!-- Feature 9 -->
        <div class="feature-card" style="padding: 10px 12px;">
          <div class="feature-card-header">
            <span class="feature-num">FEATURE 09</span>
            <span class="feature-badge-soft">Under Progress</span>
          </div>
          <h3 class="feature-title" style="font-size: 14px;">Practical Journals</h3>
          <p class="feature-desc" style="font-size: 11px;">Digital practical journal logs, apparatus diagrams, observation tables, and calculation guides for board practical exams.</p>
        </div>

        <!-- Feature 10 -->
        <div class="feature-card" style="padding: 10px 12px;">
          <div class="feature-card-header">
            <span class="feature-num">FEATURE 10</span>
            <span class="feature-badge-soft">Official Syllabi</span>
          </div>
          <h3 class="feature-title" style="font-size: 14px;">AKUEB Updated Curriculum &amp; SLOs</h3>
          <p class="feature-desc" style="font-size: 11px;">Complete syllabus explorer with official cognitive weightages, command words, and exam format breakdowns for 2025–2026.</p>
        </div>

        <!-- Feature 11 -->
        <div class="feature-card dark-theme" style="padding: 10px 12px;">
          <div class="feature-card-header">
            <span class="feature-num" style="background: rgba(251,191,36,0.2); color: #fbbf24;">FEATURE 11</span>
            <span class="feature-badge-soft" style="background: rgba(251,191,36,0.2); color: #fbbf24;">Multiplayer Arena</span>
          </div>
          <h3 class="feature-title" style="font-size: 14px;">1v1 Friend Challenges</h3>
          <p class="feature-desc" style="font-size: 11px;">Create instant quiz challenge links and battle friends in real-time speed &amp; accuracy MCQ showdowns.</p>
        </div>

        <!-- Feature 12 -->
        <div class="feature-card" style="padding: 10px 12px;">
          <div class="feature-card-header">
            <span class="feature-num">FEATURE 12</span>
            <span class="feature-badge-soft">Teacher Portal Linked</span>
          </div>
          <h3 class="feature-title" style="font-size: 14px;">Student Classrooms</h3>
          <p class="feature-desc" style="font-size: 11px;">Join school classrooms using join codes, access pinned teacher worksheets, and submit assigned mock exams.</p>
        </div>
      </div>

      <!-- Dual Mockup Showcase -->
      <div class="dual-mockup-showcase">
        <div style="flex: 1.3; display: flex; flex-direction: column; align-items: center;">
          <div style="font-size: 10px; font-weight: 800; color: #005f02; margin-bottom: 4px; text-transform: uppercase;">1v1 Challenge Arena</div>
          ${renderMacBook(shots.challDesk, "1v1 Challenges", "310px")}
        </div>
        <div style="flex: 1.3; display: flex; flex-direction: column; align-items: center;">
          <div style="font-size: 10px; font-weight: 800; color: #005f02; margin-bottom: 4px; text-transform: uppercase;">Student Classrooms</div>
          ${renderMacBook(shots.classDesk, "Student Classrooms", "310px")}
        </div>
      </div>
    </div>

    <div class="page-footer">
      <div class="left-info">
        <span>ExBoard AI Academic Guide</span>
        <span>•</span>
        <span>Features 9–12: Complete Ecosystem</span>
      </div>
      <div>Page 8 of 9</div>
    </div>
  </div>

  <!-- ===================================================================== -->
  <!-- PAGE 9: HOW TO SIGN UP & GET STARTED GUIDE -->
  <!-- ===================================================================== -->
  <div class="page">
    <div>
      <div class="page-header">
        <div class="brand"><img src="${shots.appLogoLight}" alt="ExBoard AI" /> · <span>Student Feature Guide</span></div>
        <div class="section-tag">Getting Started</div>
      </div>

      <div class="section-headline">
        <h2>How to <span>Sign Up</span> &amp; Start Preparing in 60 Seconds.</h2>
        <p>Follow these 3 simple steps to create your free student account on ExBoard AI.</p>
      </div>

      <div class="step-flow">
        <div class="step-card">
          <span class="step-badge">STEP 01</span>
          <h4 class="step-title">Visit &amp; Register</h4>
          <p class="step-desc">Go to <a href="https://exboardai.tech" target="_blank" style="color: #005f02; font-weight: 800; text-decoration: underline;">exboardai.tech</a> and click <strong>Create Free Account</strong>. Enter your name, email, and secure password.</p>
        </div>

        <div class="step-card">
          <span class="step-badge">STEP 02</span>
          <h4 class="step-title">Select Board &amp; Class</h4>
          <p class="step-desc">Choose your examination board (<strong>AKUEB</strong> or <strong>Sindh Board</strong>) and select your class (<strong>IX, X, XI, or XII</strong>).</p>
        </div>

        <div class="step-card">
          <span class="step-badge">STEP 03</span>
          <h4 class="step-title">Start Solving!</h4>
          <p class="step-desc">Pick any past paper, attempt your first MCQ test, or generate a custom chapter quiz with instant Nova AI feedback.</p>
        </div>
      </div>

      <div class="dual-mockup-showcase">
        <div style="flex: 1.5; display: flex; flex-direction: column; align-items: center;">
          <div style="font-size: 10px; font-weight: 800; color: #005f02; margin-bottom: 4px; text-transform: uppercase;">Desktop Registration Portal</div>
          ${renderMacBook(shots.regDesk, "Student Registration Portal", "330px")}
        </div>
        <div style="flex: 0.9; display: flex; flex-direction: column; align-items: center;">
          <div style="font-size: 10px; font-weight: 800; color: #005f02; margin-bottom: 4px; text-transform: uppercase;">Instant Mobile Dashboard</div>
          ${renderIPhone(shots.dashMob, "Mobile View", "110px")}
        </div>
      </div>

      <!-- Final CTA Callout -->
      <div class="highlight-banner" style="margin-top: 14px; background: linear-gradient(135deg, #004a02 0%, #005f02 100%); border: 1.5px solid #008503; padding: 12px 16px;">
        <div>
          <div style="font-family: 'Outfit'; font-size: 15px; font-weight: 900; color: #ffffff;">Ready to ace your next board exam?</div>
          <div style="font-size: 11px; color: rgba(255,255,255,0.9); margin-top: 2px;">Join thousands of toppers across AKUEB and Sindh Board today — 100% Free during Beta.</div>
        </div>
        <a href="https://exboardai.tech" target="_blank" class="badge" style="background: #fbbf24; color: #004a02; font-weight: 900; font-size: 11px; padding: 6px 14px; text-decoration: none; border-radius: 6px; display: inline-block;">exboardai.tech ↗</a>
      </div>
    </div>

    <div class="page-footer">
      <div class="left-info">
        <span>ExBoard AI Academic Guide</span>
        <span>•</span>
        <span>© 2026 ExBoard AI Technologies · Developed by Muhammad Taha Talib</span>
      </div>
      <div>Page 9 of 9</div>
    </div>
  </div>

</body>
</html>
`;

async function main() {
  fs.writeFileSync(HTML_OUT, htmlContent, "utf8");
  console.log("Wrote HTML template to", HTML_OUT);

  const browser = await chromium.launch({
    channel: "chrome",
    headless: true,
  });

  const page = await browser.newPage();
  await page.goto("file://" + HTML_OUT, { waitUntil: "networkidle" });
  await page.waitForTimeout(2000);

  await page.pdf({
    path: PDF_OUT,
    format: "A4",
    printBackground: true,
    margin: { top: "0mm", right: "0mm", bottom: "0mm", left: "0mm" },
    preferCSSPageSize: true,
  });

  console.log("Successfully generated high-resolution PDF at:", PDF_OUT);
  await browser.close();
}

main().catch(console.error);
