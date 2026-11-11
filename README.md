# Autonomous Real Estate Reels Studio (`9:16` Vertical)

Turn raw property tour clips into crisp **1080×1920 @ 30 FPS Instagram Reels & YouTube Shorts** with modular **HyperFrames + GSAP 3.15** motion graphics, natural daily spoken **Kanglish (Kannada + English)** Edge Neural voiceovers, word-synced captions, shared brand logo overlays, non-blocking screen geometry, and **DaVinci Resolve** multi-track timelines — **at $0 recurring API cost**.

*(Need the legacy Blender 3D CGI + Google Maps pipeline? Check branch `main` / tag `v1-blender-maps`.)*

---

## Key Features

- **Zero Black Screen Scrims — Pure Sharp Footage:** Raw camera footage plays full-brightness end-to-end with Lanczos portrait scaling and zero dark screen fog. Every motion card and caption pill carries its own self-contained frosted backdrop.
- **Unobstructed Center Showcase (`750px` Clear Window):** Main plot/road footage stays completely visible through the center band (`y = 440..1190px`), while info cards dock cleanly in the lower showcase band (or top band for highway routes) and auto-exit after `5.2s` so raw B-roll breathes between facts.
- **Natural Daily Spoken Kanglish Voice (`kn-IN-GaganNeural`):** Conversational Tumakuru spoken Kannada mixed with natural everyday English words, phonetic acronym guards (`ಎನ್ ಎಚ್ 48`, `ಎಸ್ ಐ ಟಿ ಕಾಲೇಜ್`, `ಟುಡಾ`, `ಡಿಸಿ`), and word-level synced captions.
- **Automatic Multi-Scene Clip Slicing:** Drop 5–6 separate clips **or just 1–2 continuous videos** (`01_road.mp4` + `02_site_video.mp4`) — the engine automatically crops, rotates, slow-mos, or reverse-pans exact timestamp windows per stage.
- **Standalone + Editable Outputs:** Exports both a ready-to-post `.mp4` (`-15.6 LUFS`, `0` clipping) **and** a transparent **ProRes 4444 `_hud_alpha.mov`**, stereo `_sfx_master.wav`, and `.xml` timeline for DaVinci Resolve.

---

## 1. One-Time Setup (`Windows`)

Dependencies are declared in `setup.toml` and `package.json`:

```powershell
# Installs Node 22+, Gyan.FFmpeg, npm deps (hyperframes, gsap, msedge-tts), Kannada fonts & Resolve script
.\setup.ps1 -InstallApps
```

Then configure your shared brand once inside `common/`:
1. **Logo Badge:** Place your transparent/square logo PNG in `common/logo/` (automatically picked up for the top-right `110×110` coin watermark and final Follow CTA card).
2. **Channel Identity & Voice:** Edit `common/brand.json`:
   - `page_handle` (`@tumkursites`), `default_phone`, `follow_button_text`
   - `voice` (`kn-IN-GaganNeural` or `en-IN-NeerjaNeural`), `voice_rate` (`"+2%"`), `voice_pitch` (`"+0Hz"`)
3. **Optional Custom BGM:** Drop an `.mp3`/`.wav` into `common/music/` (or leave empty to use the built-in stereo chord underscore mixed at `-15 LUFS`).

---

## 2. How to Create Your Next Reel (Step-by-Step)

### Step A — Create a new site folder
```powershell
npm run new -- my_new_layout
```
This creates `sites/<YYYY-MM-DD>_my_new_layout/` with `clips/`, `script.txt`, `site.json`, `work/`, and `out/`.

### Step B — Drop your raw videos into `clips/`
Copy today's phone/camera MP4 clips into:
```text
sites/<YYYY-MM-DD>_my_new_layout/clips/
```
*(Landscape `1920×1080`, portrait `1080×1920`, or `-90°` rotated mobile videos are all supported automatically.)*

### Step C — Fill `script.txt` (Plain Text)
Open `sites/<YYYY-MM-DD>_my_new_layout/script.txt` and type your property details in plain language — no JSON editing required:
1. **Site Name & Location:** Area, nearest main road/highway & distance, nearby landmark.
2. **Approvals & Civic Utilities:** TUDA / RERA / A-Khata / DC Conversion, water, power, roads, UGD drainage.
3. **Dimensions & Vastu:** Plot sizes (`30×40`, `30×50`, `40×60`), facing (`East/North`), corner sites.
4. **Price & Payment:** Rate per sq.ft, plot prices, bank loan, zero brokerage, registration notes.
5. **Follow & CTA:** `@handle`, phone number, closing call-to-action line.

### Step D — Generate `site.json` & Render the Reel
Ask your AI coding agent (with the loaded `real-estate-reel` skill):
> *"Read `sites/<YYYY-MM-DD>_my_new_layout/script.txt` and inspect `clips/`, then update `site.json` and build the reel."*

Or run the CLI pipeline directly after editing `site.json`:

| Command | What It Does |
| --- | --- |
| `npm run prep -- sites/<folder>` | Slices/normalizes clips (`1080×1920 @ 30fps`), generates Edge TTS voiceovers + WordBoundary captions, synthesizes `-15 LUFS` mix, builds HyperFrames HTML & DaVinci XML. |
| `npm run check -- sites/<folder>` | Runs headless Chromium audit (layout bounds, overlap, WCAG AA contrast, runtime errors, audio loudness). |
| `npm run studio -- sites/<folder>` | Opens interactive **HyperFrames Studio** in your browser to scrub, inspect widgets frame-by-frame, and preview timing. |
| `npm run mp4 -- sites/<folder>` | Fast upload-ready export: renders `out/<Timeline>.mp4` + synced `_sfx_master.wav` + `.xml` + measures LUFS/peak. |
| `npm run reel -- sites/<folder>` | **Full Studio Export:** runs `prep` + high-quality `out/<Timeline>.mp4` + **ProRes 4444 transparent `_hud_alpha.mov`** + WAV + XML + DaVinci Resolve script deploy. |

---

## 3. Standard Reel Flow & Multi-Scene Clip Slicing

Unless you specify a custom order in `script.txt`, every reel follows this viewer retention sequence:

| Stage | Narrative Focus | Default Widgets (`beats[]`) | Placement |
| --- | --- | --- | --- |
| **1. Location & Road** | Project hook + highway / landmark distance | `hero_title` -> `route_tracker` | `bottom` -> `top` |
| **2. Approvals & Trust** | TUDA / DC / RERA + Bank Loan / Zero Brokerage | `verified_shield` -> `dual_metric` | `bottom` |
| **3. Site Utilities** | 30/40-ft wide roads, borewell water, power, UGD | `checklist_live` | `bottom` |
| **4. Dimensions & Vastu** | Plot sizes (`30×40 = 1,200 sq.ft`) + East/North/Corner | `blueprint_draw` -> `vastu_compass` | `bottom` |
| **5. Pricing Breakdown** | Rate per sq.ft odometer + total plot calculation | `price_odometer` -> `price_calc` | `bottom` |
| **6. Follow Page CTA** | Common brand logo coin + `@handle` + tap cursor + phone | `follow_cta` (held to end) | `bottom` |

### Using Only 1 or 2 Long Videos (`< 5` Raw Clips)
If you only shot 1 road clip (`01_road.mp4`) and 1 site walkthrough (`02_site_video.mp4`), each scene in `site.json` can slice an exact window with smooth speed pacing:

```json
{
  "id": "scene_03_site_features",
  "video": "02_site_video.mp4",
  "clip_start": 0.0,
  "clip_end": 6.0,
  "clip_speed": 0.60,
  "clip_reverse": false
}
```

- `clip_start` / `clip_end`: Exact source seconds to extract cleanly via FFmpeg (`-ss` / `-t`).
- `clip_speed`: `0.45–0.75` extends a crisp short pan smoothly without black frames; `1.0` keeps normal speed.
- `clip_reverse`: `true` creates a smooth reverse reveal pan for the closing `follow_cta` card.

---

## 4. Screen Occupancy & Safe Zones (`1080×1920`)

| Element | Y Position / Size | Purpose |
| --- | --- | --- |
| **Progress Bar + Counter + Location Pill** | `top: 56px` (`<= 820px` wide) | Multi-stage progress bar + active scene pill |
| **Brand Logo Coin** (`common/logo/`) | Top-right (`110×110px`) | Always visible without blocking the subject |
| **Clear Center Window** | **`y = 440px .. 1190px` (`750px`)** | **100% open raw footage (39.1% center height clear)** |
| **Info Cards (`840×175–298px`)** | `y = 212px` (`top`) or `y = 1192..1490px` (`bottom`) | Pop in when spoken (`5.2s` max dwell), then exit cleanly |
| **Word-Synced Captions** | `y = 1525px` | Anchored neatly below cards & above Reels bottom UI |
| **Platform Deadzones** | Right `196px` & Bottom `270px` (`y >= 1650px`) | Reserved for Instagram / YouTube Shorts buttons |

---

## 5. Folder Architecture & Skills

```text
autonomous-real-estate-reels/
├── .agents/skills/real-estate-reel/          <-- AI Agent rules (format, Kanglish TTS, layout budgets)
│   ├── SKILL.md                              <-- Checklist & skill router
│   └── references/
│       ├── timing_and_format.md              <-- 6-stage flow, Tumakuru Kanglish voice rules & clip slicing
│       ├── layout_and_sizes.md               <-- Pixel size budgets & IG/YT safe zones
│       └── widgets_and_modules.md            <-- 12 HyperFrames + GSAP widgets & core module docs
├── setup.toml & setup.ps1                    <-- Single-command Windows toolchain installer
├── package.json & .gitignore                 <-- Keeps clips/, work/, and out/ local (uncommitted)
├── common/                                   <-- Shared logo, brand.json, Kannada fonts & music
├── core/
│   ├── layout_spec.js                        <-- Canvas geometry & typography minimums
│   ├── widgets.js                            <-- 12 animated SVG + GSAP real estate widgets
│   ├── templates.js                          <-- Top HUD chrome, captions, transitions & root HTML
│   ├── audio_tts.js                          <-- Edge TTS synthesis (with retries) & -15 LUFS mix
│   ├── resolve_xml.js                        <-- DaVinci Resolve FCP7 XML sequence generator
│   ├── prepare.js                            <-- `--new` scaffolding & scene/asset builder
│   ├── render.js                             <-- `studio`, `check`, `mp4`, `alpha`, and `reel` CLI
│   └── resolve_import.py                     <-- DaVinci Resolve Workspace > Scripts utility
└── sites/
    ├── _template/                            <-- Default `script.txt` & `site.json` template
    └── <YYYY-MM-DD>_<site_name>/             <-- Per-site folder: `clips/`, `script.txt`, `site.json`, `work/`, `out/`
```

---

## 6. Editing in DaVinci Resolve (Optional)

Every `npm run reel` (or `npm run mp4`) exports editable deliverables to `sites/<folder>/out/`:
1. `<Timeline>.mp4` — Finished upload-ready `1080×1920` reel.
2. `<Timeline>_hud_alpha.mov` — Transparent ProRes 4444 HUD + captions overlay track.
3. `<Timeline>_sfx_master.wav` — Synced `48 kHz` stereo voiceover + SFX + music bed.
4. `<Timeline>.xml` — Multi-track timeline referencing your sliced/raw video + alpha overlay + audio.

Launch DaVinci Resolve via `open_davinci.bat`, then click **Workspace -> Scripts -> `Build_Reel_Studio`** (or import `out/<Timeline>.xml` directly via `Ctrl+Shift+I`).
