---
name: real-estate-reel
description: >-
  Generic, zero-token 9:16 real estate reel workflow using HyperFrames + GSAP 3.15,
  Edge Neural TTS (WordBoundary captions), common/ brand logo pickup, and DaVinci Resolve.
  Use whenever the user drops new site footage or asks to create a property layout reel.
---

# Real Estate Reel Studio (Generic 5-Stage 9:16 Workflow)

This workspace converts raw phone/drone property clips into broadcast-grade **1080×1920 @ 30 FPS Instagram Reels & YouTube Shorts** with shared branding from `common/` and zero recurring API token costs.

---

## 1. Repository Layout

```text
autonomous-real-estate-reels/
├── .agents/skills/real-estate-reel/SKILL.md  # Always-on generic workflow skill
├── common/                                   # Shared across ALL properties
│   ├── logo/                                 # Auto-picks logo.png / logo.svg
│   ├── brand.json                            # Page handle, follow CTA, voice defaults
│   ├── fonts/                                # NIRMALA.TTF / NIRMALAB.TTF
│   └── music/                                # Optional BGM (else pure-Node chord bed)
├── core/                                     # 3-script engine (no legacy bloat)
│   ├── prepare.js                            # Probes clips, builds TTS, HyperFrames & XML
│   ├── render.js                             # check / studio / mp4 / alpha / reel
│   └── resolve_import.py                     # DaVinci Resolve Utility script
├── setup.toml & setup.ps1                    # Unified winget + npm installer
└── sites/<YYYY-MM-DD>_<site_slug>/           # One isolated folder per recorded property
    ├── clips/                                # Raw MP4s (auto-mapped sequentially if video="auto")
    ├── site.json                             # Standardized 5-Stage Property Sheet
    ├── work/                                 # Generated HyperFrames + Alpha + TTS artifacts
    └── out/                                  # Final .mp4, _hud_alpha.mov, _sfx_master.wav, .xml
```

---

## 2. Standardized 5-Stage Property Reel Format

Every site reel follows the same high-converting sequence defined in `sites/_template/site.json`:

1. **`scene_01_road_and_area` — Road & Area Hook:** Which main road/highway it's near + locality/corridor name (`hero_title`, `route_tracker`). *(Top HUD displays `common/logo/` + area badge.)*
2. **`scene_02_site_approvals` — Approvals & Civic Features:** Legal status (**TUDA / BMRDA / RERA / A-Khata / DC Conversion**) and ready utilities (`verified_shield`, `checklist_live`).
3. **`scene_03_dimensions_vastu` — Plot Dimensions & Facing:** Standard sizes (`30×40`, `30×50`, corner plots), internal road width, and **East/North Vastu** (`blueprint_draw`, `vastu_compass`).
4. **`scene_04_pricing` — Pricing Breakdown:** Rate per sq.ft + total plot investment + transparent direct-owner / loan details (`price_odometer`, `price_calc`).
5. **`scene_05_follow_page` — Follow Our Page + CTA:** Automatically renders `common/logo/` + `common/brand.json` `@page_handle` + animated **"+ FOLLOW"** pointer tap (`follow_cta`).

---

## 3. Daily Agent Runbook (When User Drops New Footage)

### Step A: Scaffold Today's Site Folder
```powershell
npm run new -- my_layout_name
# Creates sites/YYYY-MM-DD_my_layout_name/ with clips/ and 5-stage site.json
```
Have the user drop their recorded clips into `sites/YYYY-MM-DD_my_layout_name/clips/` (sorted `01_...`, `02_...`, or phone order if using `"video": "auto"`, OR map explicit filenames per stage).

### Step B: Author `site.json` from Site Notes
Fill the 5 stages (`voice_text` in natural Kannada `kn-IN-GaganNeural` or English `en-IN-NeerjaNeural`, plus concise on-screen metrics).  
**Critical Authoring Rules:**
* Keep `01_road_and_area` hero card visible from `t = 0.0` (`opacity: 0.92` initial) so frame 0 is never blank.
* Keep beat cards inside safe zones (`left: 48px; width: 880px; top: 196px or 975px`), with frosted glass (`rgba(8,12,24,0.90)`).
* Never scale adjacent Kannada caption words (`column-gap: 18px`), exit beat `i` cleanly before beat `i+1` starts, and verify captions + beats leave breathing room around video subjects.

### Step C: Prepare, Check, Preview, Render
```powershell
npm run prep    -- sites/YYYY-MM-DD_my_layout_name   # Builds TTS, word captions, HyperFrames & XML
npm run check   -- sites/YYYY-MM-DD_my_layout_name   # Must report ok: true, 0 critical errors
npm run studio  -- sites/YYYY-MM-DD_my_layout_name   # Interactive browser preview
npm run mp4     -- sites/YYYY-MM-DD_my_layout_name   # Fast ready-to-upload 1080x1920 MP4 + WAV + XML
# OR full DaVinci package (+ transparent ProRes 4444 Alpha HUD MOV):
npm run reel    -- sites/YYYY-MM-DD_my_layout_name
```

---

## 4. Environment Install (`setup.toml`)
On a clean Windows workstation, install all required tools (`Node 22+`, `Gyan.FFmpeg.Essentials`, `hyperframes`, `gsap`, `msedge-tts`, fonts, and DaVinci Resolve bridge) via:
```powershell
.\setup.ps1 -InstallApps
```
