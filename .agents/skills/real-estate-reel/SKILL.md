---
name: real-estate-reel
description: >-
  Generic, zero-token 9:16 real estate reel workflow using HyperFrames + GSAP 3.15,
  Edge Neural TTS (WordBoundary captions), common/ brand logo pickup, strict non-blocking
  overlay size budgets, and DaVinci Resolve. Use whenever the user gives a site script/notes
  or raw footage to prepare a 9:16 real estate reel.
---

# Real Estate Reel Studio (`1080×1920 @ 30 FPS`)

Builds vertical **Instagram Reels & YouTube Shorts** at **$0 recurring API cost** from:
1. Shared branding in `common/` (`Tumkur Sites Real Estate Badge.png`, `brand.json`, `fonts/`, optional `music/`).
2. Per-site raw clips + plain notes (`sites/<YYYY-MM-DD>_<site_slug>/clips/` + `script.txt` -> compiled `site.json`).
3. Modular engine in `core/` (HyperFrames + GSAP 3.15 + Edge Neural TTS + FFmpeg + DaVinci Resolve XML).

---

## Modular Reference Guides (Read As Needed)

Because geometry, format rules, and widget specs live in focused documents, consult the exact reference for your task:

* **Exact Overlay Sizes, Safe Zones & Fonts:** [`references/layout_and_sizes.md`](references/layout_and_sizes.md) -> Defines pixel/percentage budgets (`110×110` top-right logo, `440–1190px` clear center showcase, `840×175–298px` timed cards, `>= 28px` copy floor, `1525px` caption rail). Enforced in code by [`core/layout_spec.js`](../../../core/layout_spec.js).
* **Generic Stage Sequence, Kanglish Voice & Clip Slicing Rules:** [`references/timing_and_format.md`](references/timing_and_format.md) -> Standard property flow (`Location -> Approvals -> Features -> Dimensions -> Price -> Follow CTA`), **mandatory daily spoken Tumakuru Kanglish `voice_text` style + TTS pronunciation rules**, `5.2s` / `8.5s` dwell caps, and multi-scene slicing (`clip_start`, `clip_end`, `clip_speed`, `clip_reverse`) when `< 5` raw clips are provided.
* **Engine Modules & 12 HyperFrames Widgets:** [`references/widgets_and_modules.md`](references/widgets_and_modules.md) -> Complete `core/*.js` module map, all 12 pre-built GSAP/SVG widgets, and how to extend [`core/widgets.js`](../../../core/widgets.js). *(Also read `node_modules/hyperframes/dist/skills/hyperframes/SKILL.md` before writing custom HTML/GSAP scenes.)*

---

## Agent Checklist (Script-to-Reel Execution)

1. **Create or locate site folder:**
   ```powershell
   npm run new -- <site_slug>
   ```
2. **Inspect `clips/` visually + Read `script.txt`:**
   - Probe clip durations, orientation/rotation (`ffprobe`), and key visual frames so overlays and voice match what is actually on screen.
   - If the folder has fewer than 5–6 clips (e.g., 1 long road video + 1 site pan), segment them across scenes via `clip_start` / `clip_end` / `clip_speed` / `clip_reverse` so voice duration always fits inside video duration with B-roll breathing room.
   - Write natural **daily spoken Kanglish** `voice_text` per [`references/timing_and_format.md`](references/timing_and_format.md) (avoid stiff textbook Kannada or mispronounced acronyms) and compile `site.json` using [`references/layout_and_sizes.md`](references/layout_and_sizes.md).
3. **Prepare, audit, preview & render:**
   ```powershell
   npm run prep   -- sites/<folder>   # TTS + WordBoundary + chord synth + -15 LUFS mix + HF HTML + XML
   npm run check  -- sites/<folder>   # Chromium audit (lint, runtime, layout, motion, WCAG AA, craft, audio)
   npm run studio -- sites/<folder>   # Interactive browser preview
   npm run mp4    -- sites/<folder>   # 1080x1920 MP4 + synced SFX WAV + Resolve XML
   npm run reel   -- sites/<folder>   # Full export: MP4 + ProRes 4444 Alpha MOV + DaVinci Resolve script
   ```
4. **Verify quality:** `npm run check` MUST pass with `0 errors` and `0 warnings` before delivering outputs; inspect PNG snapshots after layout or widget changes.
