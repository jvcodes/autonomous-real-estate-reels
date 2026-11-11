---
name: real-estate-reel
description: >-
  Generic, zero-token 9:16 real estate reel workflow using HyperFrames + GSAP 3.15,
  Edge Neural TTS (WordBoundary captions), common/ brand logo pickup, and DaVinci Resolve.
  Use whenever the user provides a site script/notes (script.txt or chat) or raw footage to build a property reel.
---

# Real Estate Reel Studio (Script-to-Reel 9:16 Agent Guide)

Converts raw site footage + a plain-text site script (`script.txt` or chat notes) into broadcast-grade **1080×1920 @ 30 FPS Instagram Reels & YouTube Shorts** with shared branding from `common/` and **$0 recurring API token cost**.

---

## 1. Repository Layout

```text
autonomous-real-estate-reels/
├── .agents/skills/real-estate-reel/SKILL.md  # This skill (generic format + HyperFrames rules)
├── common/                                   # Shared brand kit across ALL properties
│   ├── logo/                                 # Auto-picks logo.png / logo.svg -> Top HUD + Stage 5
│   ├── brand.json                            # Page @handle, follow CTA, default voice & resolution
│   ├── fonts/                                # NIRMALA.TTF / NIRMALAB.TTF (Kannada subtitles)
│   └── music/                                # Optional BGM (else pure-Node chord bed)
├── core/                                     # Minimal 3-script engine
│   ├── prepare.js                            # Probes clips, runs msedge-tts, builds HyperFrames + XML
│   ├── render.js                             # Wraps HyperFrames check / studio / mp4 / alpha / reel
│   └── resolve_import.py                     # DaVinci Resolve Workspace > Scripts importer
├── setup.toml & setup.ps1                    # One-step Node 22+, FFmpeg, npm & Resolve setup
└── sites/<YYYY-MM-DD>_<site_slug>/           # One isolated folder per recorded property
    ├── clips/                                # Raw MP4s (auto-mapped sequentially if video="auto")
    ├── script.txt                            # Plain-text property notes / script (written by user)
    ├── site.json                             # Compiled 5-Stage HyperFrames/GSAP config (written by agent)
    ├── work/                                 # Generated work/hf (MP4), work/hf_alpha (ProRes), audio/
    └── out/                                  # Final .mp4, _hud_alpha.mov, _sfx_master.wav, .xml
```

---

## 2. Standard 5-Stage Reel Format ("What Comes After What")

Unless the user's `script.txt` explicitly requests a custom scene order, ALWAYS organize every property reel in this sequence:

| Stage | Scene ID | What It Covers | Recommended HyperFrames Widgets (`beats[]`) | Default Slot (`glide_to`) |
| --- | --- | --- | --- | --- |
| **1** | `scene_01_road_and_area` | Locality + distance to highway/main road hook | `hero_title` -> `route_tracker` | `bottom` -> `top` |
| **2** | `scene_02_site_approvals` | Legal status (**TUDA / RERA / A-Khata / DC**) + utilities | `verified_shield` -> `checklist_live` | `bottom` |
| **3** | `scene_03_dimensions_vastu` | Plot sizes (`30×40`), sq.ft counter, East/North Vastu | `blueprint_draw` -> `vastu_compass` | `bottom` |
| **4** | `scene_04_pricing` | Rate per sq.ft + total plot price calculation | `price_odometer` -> `price_calc` | `bottom` |
| **5** | `scene_05_follow_page` | Brand logo from `common/logo/` + `@page_handle` + Tap CTA | `follow_cta` | `bottom` |

* **Top-Right Circular Brand Badge (`right: 40px; top: 76px; 110×110px`):** `common/logo/Tumkur Sites Real Estate Badge.png` is ALWAYS visible in the top-right corner across every scene (`logo_hud_position: "top-right"` in `common/brand.json`).
* **Top-Left Header Pill (`left: 40px; top: 76px`):** Compact `[01/05]` stage counter + `[AREA • ROAD]` live pill below the 5-stage progress strip (`y = 56px`).

---

## 3. Non-Blocking Screen Zone Map & Timed Card Pacing ("Never Block the Road/Site")

To ensure viewers always see the real site, road, compound wall, and plots clearly in **1080×1920**:

| Canvas Vertical Zone | Y Coordinates | Purpose | Visibility / Duration |
| --- | --- | --- | --- |
| **Top Header** | `56 – 190 px` | Story bar + Left location pill + **Top-Right Logo (`110×110`)** | Always visible (`100%`) |
| **Upper Safe Strip** | `212 – 435 px` | Optional `"glide_to": "top"` cards (e.g. `route_tracker`) | **4.2 – 5.2s** timed pop-in |
| **OPEN CENTER STAGE** | **`440 – 1190 px`** | **100% UNOBSTRUCTED SITE / ROAD VIEW (~750px open!)** | **NEVER place cards here** |
| **Lower Card Band** | `1192 – 1495 px` | Timed metric cards (`hero`, `shield`, `checklist`, `blueprint`, `price`, `follow_cta`), `left: 44px; width: 840px` (clear of right Reels buttons) | **5.2s default** (`follow_cta` **8.5s**), exits cleanly for B-roll breathers! |
| **Caption Rail** | `1525 – 1615 px` | Kannada / English synced subtitles (single compact strip ABOVE bottom Reels UI `1650px+`) | Only while voice speaks |

*Override timing on any beat inside `site.json` using `"display_sec": 4.8` (shorter/longer pop-in) or `"hold": true` (pin until clip ends). Global default lives in `common/brand.json` (`"card_max_display_sec": 5.2`).*

---

## 4. Built-In HyperFrames + GSAP Widget Catalog ("How the Reel Looks")

In `site.json`, each stage's `beats[]` picks from these pre-built, WCAG-checked GSAP 3.15 SVG widgets inside `core/prepare.js`:

* `hero_title` — Kinetic opening card (`badge`, `value`, `sub`). Frame 0 stays visible (`opacity: 0.92`) on Stage 1.
* `route_tracker` — Animated dashed SVG road curve (`MotionPathPlugin` sliding pin) + odometer (`count_from`, `count_to`, `count_suffix`, `route_start`, `route_end`, `sub`).
* `verified_shield` — Animated SVG security shield + checkmark stroke draw (`badge`, `value`, `sub`).
* `checklist_live` — 3-row utility checklist (`items[]`) pre-populated at `0.42` opacity and lighting up emerald one by one.
* `blueprint_draw` — Self-drawing SVG parcel rectangle (`width_label`, `depth_label`, `count_to`, `count_suffix`, `sub`).
* `vastu_compass` — Spotlight dim cutout + spinning SVG compass needle (`badge`, `value`, `sub`).
* `price_odometer` — Bold amber price roll-up (`count_to`, `count_prefix`, `count_suffix`, `sub`).
* `price_calc` — Equation chips `area × rate = total LAKHS` (`eq_left`, `eq_mid`, `count_to`, `count_decimals`).
* `growth_curve` — Appreciation trajectory curve + glow badge (`growth_tag`, `value`, `sub`).
* `dual_metric` — Side-by-side split comparison cards (`left_label`/`left_value`, `right_label`/`right_value`).
* `follow_cta` — Reads `common/logo/` + `common/brand.json` `page_handle`, animates pointer cursor tap + ripple (`badge`, `value`, optional `handle`, `button_text`, `sub`).
* `highlight_pill` (default fallback) — Neon brush-sweep text card (`badge`, `value`, `sub`).

*(To invent custom HTML/GSAP scenes beyond these widgets, read HyperFrames' native spec first at `node_modules/hyperframes/dist/skills/hyperframes/SKILL.md` and edit `core/prepare.js`.)*

---

## 4. Script-to-Reel Agent Workflow

When the user drops raw clips + `script.txt` (or gives a site script in chat):

1. **Scaffold / Locate Site Folder:**
   - If not created yet: `npm run new -- <site_slug>` (creates `sites/<YYYY-MM-DD>_<site_slug>/` with `clips/`, `script.txt`, `site.json`).
2. **Read `script.txt` + Inspect `clips/`:**
   - Check clip count, filenames, and filenames/timestamps so each spoken segment fits comfortably inside its video clip length (`~10–35s` per clip; never cram 30s of speech into a 5s clip).
   - Pick explicit `"video": "clips_filename.mp4"` if filenames don't match alphabetical order, or keep `"video": "auto"` when sorted `01_...`, `02_...` matches the 5 stages.
3. **Compile `script.txt` -> `site.json`:**
   - Write natural spoken `voice_text` per stage (Kannada `kn-IN-GaganNeural` default, ~15–28 words per stage for crisp pacing) plus concise English/Kannada dashboard numbers on cards.
   - Follow non-blocking layout rules: keep `01_road_and_area` Stage 1 hero visible from `t = 0.0` in the lower band (`1225px`), keep ALL cards strictly out of the center `440–1190px` site/road showcase (`left: 44px; width: 840px`), let cards auto-exit after `display_sec` (`~5.2s`) so long clips get pure B-roll breathers, exit beat `i` before beat `i+1` enters, and never scale adjacent Kannada caption words (`column-gap: 18px`).
4. **Run Modules & Validate Before Exporting:**
   ```powershell
   npm run prep   -- sites/<folder>   # msedge-tts + WordBoundary + chord synth + FFmpeg -15 LUFS + HF HTML + Resolve XML
   npm run check  -- sites/<folder>   # HyperFrames Chromium audit (lint, runtime, layout, motion, WCAG AA, craft, audio)
   npm run studio -- sites/<folder>   # Live interactive HyperFrames Studio preview in browser
   npm run mp4    -- sites/<folder>   # Fast GPU render: 1080x1920 MP4 + SFX WAV + XML
   npm run reel   -- sites/<folder>   # Full export: MP4 + transparent ProRes 4444 Alpha MOV + DaVinci Resolve script
   ```
   - Inspect key frames via `hyperframes snapshot` if visuals change significantly, and ensure `npm run check` finishes cleanly with `0` errors.

---

## 5. Module Stack & Responsibilities

| Module | What It Does |
| --- | --- |
| **`core/prepare.js`** | Probes clip durations (`ffprobe`), parses `common/` brand assets + `site.json`, synthesizes Edge TTS (`msedge-tts`), synthesizes pure-Node chord underscore (if `common/music/` empty), mixes audio at `-15 LUFS`, emits `work/hf/` + `work/hf_alpha/`, writes Resolve FCP7 XML. |
| **`gsap@3.15.1`** | Drives timeline-seek-safe animations (`CustomEase`, `MotionPathPlugin`, SVG `strokeDashoffset`, odometer counters). |
| **`hyperframes@0.9.29`** | Headless Chrome frame-by-frame compiler, `Studio` timeline preview UI, WCAG/layout `check` linter, GPU multi-worker `.mp4` and transparent ProRes 4444 `.mov` renderer. |
| **`msedge-tts@2.1.1`** | Zero-cost neural Kannada/English TTS + word-level timestamps (`WordBoundary`) for karaoke captions. |
| **Gyan FFmpeg 9.0.1** | Video duration probing, delay/loudnorm `-15 LUFS` audio mixing, SFX extraction, ProRes packaging. |
| **`core/resolve_import.py`** | Imports `V1` clips, `V2` ProRes 4444 HUD alpha, and `A1` mix into DaVinci Resolve automatically (`Build_Reel_Studio`). |
