---
name: autonomous-real-estate-reels
description: >-
  Autonomous pipeline to generate, composite, and render 9:16 vertical real estate video reels
  (Instagram Reels & YouTube Shorts). Combines Google Maps aerial flyovers, animated road access curves,
  distance telemetry badges, and full-bleed property walkthrough videos with motion graphic lower-thirds.
---

# Autonomous Real Estate Reels Generator

This skill teaches the agent how to autonomously orchestrate, compose, and produce broadcast-grade **9:16 vertical video reels** for real estate layouts by blending Google Maps dynamic aerial flights with on-site walkthrough videos.

---

## 1. Pipeline Overview

The pipeline operates in 5 deterministic, automated phases:

```
[ Layout Metadata & GPS ]
           │
           ▼
[ Phase 1: 5.0s Wide City Overview ] ──> Zoom 12.8, adjacent zones illuminated, live countdown
           │
           ▼
[ Phase 2: 0.7s Camera Glide Dive ]  ──> Zoom 17.0, centering layout entrance
           │
           ▼
[ Phase 3: 3.5s Road Curve & Hold ]  ──> Tracing neon arrow from highway to gate, distance metric hold
           │
           ▼
[ Phase 4: 8.5s Walkthrough Video ]  ──> Full-bleed 9:16 video + broadcast lower-third price/landmarks
           │
           ▼
[ Phase 5: Autonomous Transition ]   ──> Cycles to next layout in continuous loop
```

---

## 2. Core Visual & Timing Standards

| Stage | Duration | Viewport | Visual Elements |
| :--- | :--- | :--- | :--- |
| **City Overview** | `5000 ms` | `zoom: 12.8` | Deep Obsidian canvas (`#080C14`), target polygon (55% opacity), adjacent areas (30% opacity), top Story tracker segment filling, live countdown caption. |
| **Camera Dive** | `700 ms` | `zoom: 17.0` | Smooth pan & dive from city altitude to property gate. |
| **Road Curve Trajectory** | `3500 ms` | `zoom: 17.0` | Animated polyline tracing from main highway to site gate, closed arrowhead icon, floating badge `📏 [Distance] ([DriveTime]) from [RoadName]`, 60 FPS neon pulse. |
| **Walkthrough Video** | `8500 ms` | Full 9:16 | Seamless slide-up overlay, streaming MP4 with HTTP 206 Partial Content, lower-third rate badge (`₹/sq.ft`), starting cost, landmark, and surrounding areas. |

---

## 3. Cartography & Design Rules

1. **Zero Clutter**:
   * All Google default business icons, stores, restaurants, and transit pins MUST be suppressed (`styles: CINEMA_DARK_STYLE`).
   * Disable all default Google Maps UI controls (`disableDefaultUI: true`, `gestureHandling: "none"`).
2. **Dedicated 9:16 Aspect Ratio**:
   * The container must strictly follow `aspect-ratio: 9 / 16` (`1080x1920` video canvas).
3. **No Interactive Web Chrome**:
   * Do not display website navigation headers, close buttons (`✕`), navigation arrows, or clickable buttons in the video frame. All elements must appear as motion graphics broadcast graphics.
4. **Broadcast Overlays**:
   * **Top Story Progress Tracker**: 5-segment bar (like Instagram/TikTok Stories) indicating progress across the reel.
   * **Telemetry Badge**: `● REC • TUMKUR REEL` + `PROPERTY X OF Y`.
   * **Lower Thirds**: High-contrast typography (`text-rendering: optimizeLegibility`), vibrant neon accent colors (`#34D399` rate green, `#F59E0B` amber).

---

## 4. Autonomous Execution Runbook

When instructed to create or extend real estate reels:

1. **Inspect / Ingest Metadata**:
   * Read layout GPS boundaries, road access path, distance, drive time, and pricing from `data/layouts_master_catalog.json` or `properties.js`.
2. **Verify Video Assets**:
   * Ensure walkthrough videos are available in `agent_project/[layout_folder]/reel_walkthrough.mp4`.
3. **Run the Streaming Server**:
   * Launch `server.js` (Node.js HTTP server supporting HTTP 206 Range requests for MP4 streaming):
     ```bash
     node server.js
     ```
4. **Autonomous Video Capture**:
   * Open `http://localhost:3000` to preview the infinite autonomous loop.
   * Run headless capture script (`scripts/headless_reel_capture.js`) to render directly into MP4 format.
