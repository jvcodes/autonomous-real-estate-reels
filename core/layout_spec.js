/**
 * core/layout_spec.js
 * Single Source of Truth for 1080x1920 (9:16) overlay geometry,
 * strict pixel size budgets, safe zones, typography floors, and card dwell caps.
 * Prevents overlays from either blocking the center site/road view or shrinking too small.
 */

const LAYOUT = {
  canvas: {
    width: 1080,
    height: 1920,
    fps: 30
  },

  // Platform UI exclusion margins (Instagram Reels & YouTube Shorts)
  safe: {
    statusBarTopPx: 56,          // Clears top status bar / Stories chrome
    leftMarginPx: 44,            // Left safe inset
    rightRailClearancePx: 196,   // x > 884px kept free for Like/Comment/Share buttons
    bottomUiDeadzonePx: 270      // y >= 1650px kept free for reel description / audio bar
  },

  // Top Header Chrome (5.7% height max)
  header: {
    topPx: 56,
    horizontalInsetPx: 40,
    progressBarHeightPx: 6,
    logoRightSizePx: 110,        // Top-right circular brand emblem (110x110px)
    logoLeftSizePx: 52,          // Optional compact emblem if set top-left
    leftClusterMaxWidthPx: 820,  // Stops well clear before top-right badge
    pillMaxHeightPx: 44
  },

  // Center Unobstructed Property / Road Showcase (39.1% height guaranteed clean!)
  showcaseWindow: {
    topY: 440,
    bottomY: 1190,
    minClearHeightPx: 750
  },

  // Overlay Cards (never exceed 15.6% of screen height; width = 77.8% of 1080px)
  card: {
    leftPx: 44,
    widthPx: 840,
    topBandY: 212,               // For glide_to: "top" (e.g. highway route tracker)
    topTallBandY: 204,
    bottomBandY: 1225,           // Standard lower band (stays clear of 440..1190 center)
    bottomTallBandY: 1192,       // Blueprint, checklist, Follow CTA (~280-295px tall -> ends <= 1488px)
    maxHeightPx: 298,
    paddingX: 26,
    paddingY: 18,
    borderRadiusPx: 24
  },

  // Captions Band (anchored cleanly below cards and above IG bottom chrome)
  captions: {
    leftPx: 44,
    widthPx: 840,
    topY: 1525,                  // Leaves 30px+ gap under tallest bottom card & 35px+ above IG UI
    maxCharsPerLine: 20,
    maxWordsPerGroup: 3,
    maxHeightPx: 95
  },

  // Minimum & Maximum Typography Scale (Readable on 6" mobile, passes WCAG + Craft check)
  font: {
    eyebrowPx: 19,
    hudPillPx: 19,
    bodySubPx: 28,               // Craft readability floor (never < 28px for main copy)
    captionPx: 31,
    ctaHeadPx: 36,
    cardTitlePx: 44,             // Range 42-48px depending on widget density
    heroDisplayPx: 48,
    statHugePx: 64               // Rate/area hero odometer numbers
  },

  // Timed Dwell Controls (guarantees B-roll breathers on long clips)
  timing: {
    cardDefaultDwellSec: 5.2,
    followCtaDwellSec: 8.5,
    minBeatSec: 1.4,
    beatGapSec: 0.20,
    exitAnimSec: 0.22
  },

  // Explicit Per-Overlay Screen Occupancy Budgets (% of 1080x1920 = 2,073,600 px^2)
  budgets: {
    progressBar:  { widthPx: 1000, heightPx: 6,   screenHeightPct: 0.3,  screenAreaPct: 0.3 },
    headerPills:  { maxWidthPx: 820, heightPx: 44, screenHeightPct: 2.3,  screenAreaPct: 1.3 },
    topRightLogo: { widthPx: 110,  heightPx: 110, screenHeightPct: 5.7,  screenAreaPct: 0.6 },
    standardCard: { widthPx: 840,  minHeightPx: 175, maxHeightPx: 260, screenHeightPctMax: 13.5, screenAreaPctMax: 10.5 },
    tallCard:     { widthPx: 840,  minHeightPx: 250, maxHeightPx: 298, screenHeightPctMax: 15.5, screenAreaPctMax: 12.1 },
    captionPill:  { maxWidthPx: 840, minHeightPx: 68,  maxHeightPx: 95,  screenHeightPctMax: 4.9,  screenAreaPctMax: 3.8 },
    centerOpen:   { widthPx: 1080, heightPx: 750, screenHeightPct: 39.1, screenAreaPct: 39.1 },
    rightSafeGap: { widthPx: 196,  note: 'Instagram Reels / YT Shorts action buttons zone' },
    bottomDeadzone: { heightPx: 270, startY: 1650, note: 'Reels / Shorts description & audio bar zone' }
  }
};

function escHtml(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function sanitizeName(raw) {
  return String(raw || '')
    .trim()
    .replace(/[^A-Za-z0-9_-]+/g, '_')
    .replace(/^_+|_+$/g, '') || 'Property_Reel';
}

function ensureCssId(raw) {
  const s = sanitizeName(raw);
  return /^[A-Za-z]/.test(s) ? s : `sc_${s}`;
}

module.exports = { LAYOUT, escHtml, sanitizeName, ensureCssId };
