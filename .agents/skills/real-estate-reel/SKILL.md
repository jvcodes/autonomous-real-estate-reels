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
* **Generic 5-Stage Sequence & Timing Rules:** [`references/timing_and_format.md`](references/timing_and_format.md) -> Standard scene flow (`Road & Area -> Approvals -> Dimensions & Vastu -> Pricing -> Follow Page CTA`), `5.2s` pop-in dwell + B-roll breathers, WordBoundary syncing, and `script.txt -> site.json` compilation guidelines.
* **Engine Modules & 12 HyperFrames Widgets:** [`references/widgets_and_modules.md`](references/widgets_and_modules.md) -> Complete `core/*.js` module map, all 12 pre-built GSAP/SVG widgets, and how to extend [`core/widgets.js`](../../../core/widgets.js). *(Also read `node_modules/hyperframes/dist/skills/hyperframes/SKILL.md` before writing custom HTML/GSAP scenes.)*

---

## Agent Checklist (Script-to-Reel Execution)

1. **Create or locate site folder:**
   ```powershell
   npm run new -- <site_slug>
   ```
2. **Read `script.txt` + probe `clips/`:** Verify speech duration stays cleanly inside each clip length (leaving natural B-roll breathing room) and compile `site.json` using the 5 stages & size rules from the references above.
3. **Prepare, audit, preview & render:**
   ```powershell
   npm run prep   -- sites/<folder>   # TTS + WordBoundary + chord synth + -15 LUFS mix + HF HTML + XML
   npm run check  -- sites/<folder>   # Chromium audit (lint, runtime, layout, motion, WCAG AA, craft, audio)
   npm run studio -- sites/<folder>   # Interactive browser preview
   npm run mp4    -- sites/<folder>   # 1080x1920 MP4 + synced SFX WAV + Resolve XML
   npm run reel   -- sites/<folder>   # Full export: MP4 + ProRes 4444 Alpha MOV + DaVinci Resolve script
   ```
4. **Verify quality:** `npm run check` MUST pass with `0 errors` and `0 warnings` before delivering outputs; inspect PNG snapshots after layout or widget changes.
