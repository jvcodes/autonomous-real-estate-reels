# Autonomous Real Estate Reels Studio (9:16 Vertical)

Turn raw site tour clips into broadcast-quality **1080×1920 @ 30 FPS Instagram Reels & YouTube Shorts** with animated GSAP 3.15 motion graphics, word-synced Kannada/English Edge Neural voiceovers, shared brand logo overlays, and DaVinci Resolve multi-track timelines — **at $0 recurring API cost**.

*(Looking for the original Blender 3D CGI + Google Maps v1 pipeline? Switch to tag `v1-blender-maps` / branch `main`.)*

---

## Folder Layout

```text
autonomous-real-estate-reels/
├── .agents/skills/real-estate-reel/SKILL.md  <-- Always-on generic agent skill
├── setup.toml & setup.ps1                    <-- Single-command Windows setup (winget + npm + Resolve)
├── package.json & .gitignore                 <-- Local deps (hyperframes, gsap, msedge-tts)
├── common/                                   <-- Shared once across ALL reels
│   ├── brand.json                            <-- Page @handle, default voice, "Follow Page" copy
│   ├── logo/                                 <-- Drop logo.png or logo.svg here (auto-picked up!)
│   ├── fonts/                                <-- NIRMALA.TTF / NIRMALAB.TTF
│   └── music/                                <-- Optional custom BGM (else built-in chord bed)
├── core/                                     <-- Only 3 slim engine files (zero legacy clutter)
│   ├── prepare.js                            <-- Clips + common/ -> HyperFrames HTML/TTS/XML
│   ├── render.js                             <-- Studio preview, check, MP4 & ProRes 4444 Alpha
│   └── resolve_import.py                     <-- DaVinci Resolve Workspace > Scripts importer
└── sites/
    ├── _template/                            <-- Starter 5-Stage Property Sheet
    └── <YYYY-MM-DD>_<site_name>/             <-- One folder per property you shoot
        ├── clips/                            <-- Drop today's MP4s here
        ├── site.json                         <-- 5-stage property details
        ├── work/                             <-- Generated build artifacts (gitignored)
        └── out/                              <-- Finished .mp4, _hud_alpha.mov, .wav, .xml (gitignored)
```

---

## One-Time Setup (`setup.toml`)

```powershell
# Installs Node 22+, Gyan.FFmpeg, hyperframes, gsap, msedge-tts, fonts & DaVinci Resolve script
.\setup.ps1 -InstallApps
```
Drop your brand logo inside `common/logo/logo.png` (or `logo.svg`) and update your `@page_handle` in `common/brand.json`.

---

## Daily Reel Workflow

1. **Create today's site folder:**
   ```powershell
   npm run new -- vasanthanarasapura
   ```
2. **Add footage & edit `site.json`:**
   Drop your recorded clips into `sites/<date>_vasanthanarasapura/clips/` and update the 5 standard stages in `site.json`:
   - `scene_01_road_and_area` (Nearest highway/road + locality)
   - `scene_02_site_approvals` (TUDA / RERA / A-Khata + utilities)
   - `scene_03_dimensions_vastu` (Dimensions, facing, Vastu)
   - `scene_04_pricing` (Rate per sq.ft + total plot cost)
   - `scene_05_follow_page` (Brand logo from `common/logo/` + `@handle` Follow CTA)
3. **Prepare, preview & render:**
   ```powershell
   npm run prep   -- sites/<date>_vasanthanarasapura
   npm run check  -- sites/<date>_vasanthanarasapura
   npm run studio -- sites/<date>_vasanthanarasapura   # Interactive browser preview
   npm run mp4    -- sites/<date>_vasanthanarasapura   # Upload-ready MP4 + SFX WAV + XML
   npm run reel   -- sites/<date>_vasanthanarasapura   # MP4 + ProRes 4444 Alpha MOV + DaVinci script
   ```
4. **DaVinci Resolve (Optional Fine-Tuning):**
   Launch with `open_davinci.bat` and click **Workspace → Scripts → `Build_Reel_Studio`**, or press `Ctrl+Shift+I` to import `sites/<site>/out/<timeline>.xml`.
