# 🎬 Autonomous Real Estate Reels Engine (Hollywood 3D CGI + 2D Broadcast)

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Format: 9:16 Vertical Reel](https://img.shields.io/badge/Format-9%3A16%20Reels-gradient)](https://instagram.com)
[![Engine: Blender 5.2 + FFmpeg + Edge-TTS](https://img.shields.io/badge/Engine-Blender%205.2%20%2B%20FFmpeg%20%2B%20Edge--TTS-orange)](https://github.com/jvcodes/autonomous-real-estate-reels)
[![Tokens: ZERO Recurring Cost](https://img.shields.io/badge/LLM%20Tokens-0%20Recurring%20Cost-brightgreen)](https://github.com/jvcodes/autonomous-real-estate-reels)

An **industry-leading autonomous AI pipeline** designed to produce viral, Hollywood-grade **9:16 vertical video reels** (for Instagram Reels, YouTube Shorts, and TikTok) showcasing residential and commercial real estate layouts.

Combines **Blender 5.2 3D CGI drone flyovers**, **glowing neon road trajectory splines**, **holographic plot boundary extrusions**, **3D bouncing location pins**, **regional neural voiceovers (English & Kannada)**, and **full-bleed ground walkthrough videos** with broadcast motion graphics.

---

## 🌟 Why This Pipeline Leads The Field

| Feature | Ordinary Video Tools | Paid Cloud AI Reel Apps | This Autonomous Engine |
| :--- | :--- | :--- | :--- |
| **Recurring Cost** | Manual editor ($50-$200/reel) | $30-$100/mo + token credits | **$0.00 / 0 Tokens (100% Free & Local)** |
| **3D CGI Aerials** | Not included or slow CGI | Flat 2D satellite screenshots | **Blender 5.2 Eevee 3D (RTX GPU accelerated)** |
| **Access Route** | Static arrows | 2D lines | **3D Glowing Neon Splines with speed-ramp dive** |
| **Plot Boundaries** | Flat 2D outline | Flat colored shapes | **3D Holographic Volumetric Extrusions** |
| **Pin Drop** | Static graphic | 2D sticker | **3D Conical Pin with impact shockwave ripple** |
| **Voiceover** | Paid ElevenLabs ($$$) | Generic robotic voice | **Edge-TTS Neural (English & Kannada, 0 cost)** |
| **Production Speed** | 2-4 hours per video | 5-15 mins in queue | **~1.5 mins per reel on RTX 3050 Ti** |

---

## 📐 Hybrid 3D Pipeline Architecture

```
[ Layout Metadata: data/featured_reels_master.json ]
                         │
      ┌──────────────────┴──────────────────┐
      ▼                                     ▼
[ Blender 5.2 Eevee 3D Engine ]   [ Microsoft Edge Neural TTS ]
  - 3D Neon Road Spline             - English (en-IN-NeerjaNeural)
  - Holographic Plot Extrusion      - Kannada (kn-IN-GaganNeural)
  - 3D Bouncing Location Pin Drop   - Zero token consumption
  - Terminal Speed-Ramp Dive        
      │                                     │
      ▼                                     ▼
[ 1080x1920 3D Flyover MP4 ]       [ Crystal Clear Regional MP3 ]
      │                                     │
      └──────────────────┬──────────────────┘
                         │
                         ▼
        [ Puppeteer Headless Broadcast Overlays ]
          - Top 5-Segment Story Progress Tracker
          - Live Telemetry (● REC TUMKUR REEL)
          - Glassmorphism Price & Landmark Card
                         │
                         ▼
             [ Standalone FFmpeg Muxer ]
          - Concatenates 3D Intro + Walkthrough
          - Whip-zoom speed-ramp transition
          - Muxes regional voiceover + audio bed
                         │
                         ▼
     [ Finished 1080x1920 Master Reel (~14.0s) ]
```

---

## 🚀 Quick Start & CLI Runbook

### 1. Prerequisites
- **Node.js** (v18+)
- **Blender 5.2 LTS** (installed on default path or set in PATH)
- **NVIDIA GPU** recommended (tested on RTX 3050 Ti with OptiX/CUDA)

### 2. Install Dependencies
```bash
npm install
```

### 3. Generate Regional Voiceovers (Zero Tokens)
Synthesizes English and Kannada voiceovers for all layouts:
```bash
npm run voiceover
```

### 4. Render 3D CGI Drone Flyovers (Blender Eevee)
Single site:
```bash
npm run render:3d -- --site 01_PNK_Township
```
Batch render all 5 featured layouts:
```bash
npm run render:3d:all
```

### 5. Compile Hollywood 3D Hybrid Master Reels
Composite 3D CGI flyover + on-site phone walkthrough + broadcast HUD + audio:
```bash
# Single site (English + Kannada)
npm run composite:3d -- --site 01_PNK_Township --lang both

# Batch compile all layouts
npm run composite:3d:all
```

### 6. Full End-to-End Autonomous Pipeline
Runs voiceovers $\rightarrow$ 3D CGI rendering $\rightarrow$ Walkthrough stitching for all properties in one click:
```bash
npm run pipeline:all
```

---

## 📁 Repository Structure

```
autonomous-real-estate-reels/
├── data/
│   ├── featured_reels_master.json   # Single source of truth (coordinates, prices, 3D splines)
│   └── layouts_master_catalog.json  # Full 10-layout Tumkur catalog
├── scripts/
│   ├── blender_3d_flyover.py        # Parametric Blender 3D Eevee generator
│   ├── generate_voiceovers.js       # MsEdgeTTS dual-language synthesizer (EN + KN)
│   ├── render_hybrid_3d_reel.js     # Hollywood 3D + Walkthrough hybrid compositor
│   ├── build_reels.js               # 2D Map/Overlay compositor
│   └── server.js                    # HTTP 206 Partial Content MP4 streaming server
├── output/
│   ├── audio/                       # Generated .mp3 voiceovers (en & kn)
│   ├── overlays/                    # Transparent 1080x1920 broadcast PNG graphics
│   ├── blender/                     # 3D CGI .mp4 flyover clips
│   └── reels/                       # Finished 1080x1920 master video reels
├── .agents/skills/                  # Custom Antigravity agent skill definition
├── ADR/                             # Architecture Decision Records
└── package.json                     # NPM lifecycle commands
```

---

## 📄 License
MIT © 2026 [jvcodes](https://github.com/jvcodes)
