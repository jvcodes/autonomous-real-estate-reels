# Overlay Size Budgets & Non-Blocking Screen Map (`1080 × 1920`)

All pixel constants and budgets live in **`core/layout_spec.js`** (`LAYOUT`). Every widget in **`core/widgets.js`** and HUD chrome in **`core/templates.js`** reads directly from `LAYOUT` so overlays are **never too large** (never hide the property/road) and **never too small** (always legible on 6" phones and pass WCAG AA + HyperFrames Craft checks).

---

## 1. Vertical Band Architecture (`1080 × 1920`, `2,073,600 px²`)

```text
y = 0 ── 55 px      Status bar / Stories safe cushion (2.9% H — EMPTY)
y = 56 ── 190 px    TOP HEADER CHROME (~5.7% max height):
                      • 5-Stage Progress Bar (1000 × 6 px)
                      • Left Cluster: [01/05] + Location Pill (maxW 820px × 44px)
                      • Right Corner: Circular Brand Badge (110 × 110 px, 0.6% area)
y = 212 ── 438 px   OPTIONAL UPPER CARD SLOT (glide_to: "top", e.g. route_tracker)
                      • 840 px wide × <= 228 px tall (<= 11.9% H)
y = 440 ── 1190 px  ★ OPEN CENTER SITE / ROAD SHOWCASE (750 px = 39.1% H CLEAN!)
                      • 100% UNOBSTRUCTED — NEVER place cards, pills, or logos here
y = 1192 ── 1490 px LOWER POP-IN CARD BAND (timed 5.2s cards, auto-exits for B-roll!)
                      • Standard Card: y=1225, 840 px × 175–260 px (<= 13.5% H)
                      • Tall Card (blueprint/checklist/follow_cta): y=1192, 840 px × <= 298 px (<= 15.5% H)
                      • Ends by y <= 1490 px (35 px+ clean gap above captions)
y = 1525 ── 1615 px KANNADA / ENGLISH CAPTION RAIL (maxW 840 px × 68–95 px, <= 4.9% H)
y = 1650 ── 1920 px PLATFORM DEADZONE (270 px = 14.1% H kept empty for IG / Shorts UI)
```

---

## 2. Exact Element-by-Element Size Table

| Overlay Element | X / Width (`% of 1080px`) | Y / Max Height (`% of 1920px`) | Screen Area `%` | Right Clearance |
| --- | --- | --- | --- | --- |
| **5-Stage Progress Strip** | `x: 40`, `W: 1000 px` (`92.6%`) | `y: 56`, `H: 6 px` (`0.3%`) | `0.3%` | Symmetric `40 px` margins |
| **Top-Left Counter + Location Pill** | `x: 40`, `maxW: 820 px` (`75.9%`) | `y: 78`, `H: 44 px` (`2.3%`) | `~1.3%` | Stops `>= 70 px` left of badge |
| **Top-Right Brand Logo Coin** | `right: 40` (`x: 930`), **`110 × 110 px`** (`10.2%`) | `y: 74`, **`110 px`** (`5.7%`) | `0.6%` | Circular crop `#FAF9F6` coin |
| **Standard Pop-In Card** (`hero_title`, `route_tracker`, `verified_shield`, `vastu_compass`, `price_odometer`, `price_calc`, `growth_curve`, `dual_metric`, `highlight_pill`) | `x: 44`, **`W: 840 px`** (`77.8%`) | `y: 1225` (or `212` if top), **`H: 175–260 px`** (`9.1–13.5%`) | `7.1–10.5%` | Leaves **`196 px`** (`18.1%`) on right for Like/Comment/Share |
| **Tall Structured Card** (`blueprint_draw`, `checklist_live`, `follow_cta`) | `x: 44`, **`W: 840 px`** (`77.8%`) | `y: 1192`, **`H: 250–298 px`** (`13.0–15.5%`) | `10.1–12.1%` | Stays below `1190 px` window & `35 px` above captions |
| **Word-Synced Caption Pill** | `x: 44`, `maxW: 840 px` (`77.8%`) | `y: 1525`, `H: 68–95 px` (`3.5–4.9%`) | `~3.0–3.8%` | Clears `1650 px` bottom Reels/Shorts chrome |

### Screen Occupancy Guarantee
* **During pure B-roll breather** (after `5.2s` card exits): **Only ~3.2%–7.5%** covered — **92%+ unobstructed site/road footage!**
* **During an active metric pop-in card + caption:** **Maximum ~20%–25%** covered — **75%+ raw property footage remains clear, including 100% of the middle `440–1190 px` band.**

---

## 3. Minimum & Maximum Typography Scale (`LAYOUT.font`)

| Role | Size (`px`) | Weight / Font | Why This Bound Exists |
| --- | --- | --- | --- |
| **Eyebrow / HUD Pills** *(meta tags `[data-layout-ignore]`)* | `19 – 20 px` | `Space Mono 700` | Compact uppercase tags (`TUDA VERIFIED`, `[01/05]`) that never crowd header |
| **Subtext / Checklist Rows** *(Floor!)* | **`>= 28 px`** | `Outfit / Montserrat 600–800` | **Hard mobile readability floor** & satisfies HyperFrames Craft lint (`no sub-28px copy`) |
| **Voiceover Captions** | `31 px` (`gap: 18 px`) | `NirmalaKannada Bold` | Single crisp high-contrast row (`<= 3 words` / `20 chars`); zero word collisions |
| **CTA Button / Card Headlines** | `34 – 48 px` | `Montserrat 900` | High visual punch without wrapping into 3+ tall lines |
| **Odometer KPI Numbers** | `54 – 64 px` | `Montserrat 900 tabular-nums` | Instant thumb-stop hook (`₹1,850`, `1,200 SQ.FT`) |

---

## 4. Platform Safe Margins (Reels & Shorts)
* **Right Action Rail (`x: 884..1080 px`):** All cards and captions stop at `x = 884 px` (`left: 44 + width: 840`), reserving `196 px` on the right below `y = 200 px` for Like, Comment, Share, Save, and Audio icons.
* **Top Status / Stories Strip (`y: 0..55 px`):** Kept completely empty.
* **Bottom Caption/Audio Bar (`y: 1650..1920 px`):** `270 px` reserved empty at the bottom of every frame.
