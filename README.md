# Autonomous Real Estate Reels Studio (9:16 Vertical)

Turn raw site tour clips into broadcast-quality **1080×1920 @ 30 FPS Instagram Reels & YouTube Shorts** with modular GSAP 3.15 motion graphics, word-synced Kannada/English Edge Neural voiceovers, non-blocking overlay size budgets, shared brand logo overlays, and DaVinci Resolve multi-track timelines — **at $0 recurring API cost**.

*(Looking for the original Blender 3D CGI + Google Maps v1 pipeline? Switch to tag `v1-blender-maps` / branch `main`.)*

---

## Folder Layout

```text
autonomous-real-estate-reels/
├── .agents/skills/real-estate-reel/          <-- Modular agent skill & specs
│   ├── SKILL.md                              <-- Concise router & checklist
│   └── references/
│       ├── layout_and_sizes.md               <-- Exact px / % budgets for every overlay
│       ├── timing_and_format.md              <-- 5-Stage flow + 5.2s timed cards + breathers
│       └── widgets_and_modules.md            <-- 12 HyperFrames/GSAP widgets & module map
├── setup.toml & setup.ps1                    <-- Single-command Windows setup (winget + npm + Resolve)
├── package.json & .gitignore                 <-- Local deps (hyperframes, gsap, msedge-tts)
├── common/                                   <-- Shared once across ALL reels
│   ├── brand.json                            <-- Page @handle, default voice, "Follow Page" CTA
│   ├── logo/                                 <-- Drop badge/logo PNG/SVG here (auto top-right coin)
│   ├── fonts/                                <-- NIRMALA.TTF / NIRMALAB.TTF
│   └── music/                                <-- Optional custom BGM (else built-in chord bed)
├── core/                                     <-- Focused modular Node/Resolve engine
│   ├── layout_spec.js                        <-- Canvas geometry, safe zones & size budgets
│   ├── widgets.js                            <-- 12 GSAP 3.15 + SVG property widgets
│   ├── templates.js                          <-- Top HUD chrome, captions, transitions & HF HTML
│   ├── audio_tts.js                          <-- Edge TTS WordBoundary sync + chord bed + -15 LUFS
│   ├── resolve_xml.js                        <-- DaVinci Resolve FCP7 XMEML sequence writer
│   ├── prepare.js                            <-- Slim orchestrator (--new & prep)
│   ├── render.js                             <-- Studio preview, check, MP4 & ProRes 4444 Alpha
│   └── resolve_import.py                     <-- DaVinci Resolve Workspace > Scripts importer
└── sites/
    ├── _template/                            <-- Starter 5-Stage Property Sheet & script.txt
    └── <YYYY-MM-DD>_<site_name>/             <-- One isolated folder per property you shoot
        ├── clips/                            <-- Drop today's MP4s here
        ├── script.txt                        <-- Optional plain-text site script for the AI agent
        ├── site.json                         <-- 5-stage property details (auto-built from script.txt)
        ├── work/                             <-- Generated build artifacts (gitignored)
        └── out/                              <-- Finished .mp4, _hud_alpha.mov, .wav, .xml (gitignored)
```

---

## One-Time Setup (`setup.toml`)

```powershell
# Installs Node 22+, Gyan.FFmpeg, hyperframes, gsap, msedge-tts, fonts & DaVinci Resolve script
.\setup.ps1 -InstallApps
```
Drop your brand logo inside `common/logo/` and update your `@page_handle` in `common/brand.json`.

---

## Daily Reel Workflow

1. **Create today's site folder:**
   ```powershell
   npm run new -- vasanthanarasapura
   ```
2. **Add footage & fill `script.txt` / `site.json`:**
   Drop your recorded clips into `sites/<date>_vasanthanarasapura/clips/` and write your 5 standard stages:
   - `scene_01_road_and_area` (Nearest highway/road + locality)
   - `scene_02_site_approvals` (TUDA / RERA / A-Khata + utilities)
   - `scene_03_dimensions_vastu` (Dimensions, facing, Vastu)
   - `scene_04_pricing` (Rate per sq.ft + total plot cost)
   - `scene_05_follow_page` (Brand logo from `common/logo/` + `@handle` Follow CTA)
3. **Prepare, audit, preview & render:**
   ```powershell
   npm run prep   -- sites/<date>_vasanthanarasapura
   npm run check  -- sites/<date>_vasanthanarasapura
   npm run studio -- sites/<date>_vasanthanarasapura   # Interactive browser preview
   npm run mp4    -- sites/<date>_vasanthanarasapura   # Upload-ready MP4 + SFX WAV + XML
   npm run reel   -- sites/<date>_vasanthanarasapura   # MP4 + ProRes 4444 Alpha MOV + DaVinci script
   ```
4. **DaVinci Resolve (Optional Fine-Tuning):**
   Launch with `open_davinci.bat` and click **Workspace -> Scripts -> `Build_Reel_Studio`**, or press `Ctrl+Shift+I` to import `sites/<site>/out/<timeline>.xml`.
