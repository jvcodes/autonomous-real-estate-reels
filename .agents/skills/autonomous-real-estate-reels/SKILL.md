---
name: autonomous-real-estate-reels
description: >-
  Autonomous pipeline to generate, composite, and render 9:16 vertical real estate video reels
  (Instagram Reels & YouTube Shorts). Combines Blender 3D CGI aerial flyovers with glowing neon road
  splines, extruded holographic plot boundaries, bouncing 3D location pins, regional Edge-TTS voiceovers,
  and full-bleed ground walkthrough videos with motion graphic lower-thirds. Zero LLM token cost.
---

# Autonomous Real Estate Reels Generator (Hollywood-Grade 3D & 2D)

This skill equips the agent to autonomously produce broadcast-grade **1080x1920 9:16 vertical video reels** for real estate layouts by blending **Blender 5.2 3D CGI drone flyovers**, dynamic access road curves, bouncing location pins, regional neural voiceovers, and high-definition ground walkthrough footage.

---

## 1. Zero-Token Architecture Overview

The system is engineered to consume **0 recurring LLM tokens** after code setup:

```
[ Layout Catalog: featured_reels_master.json ]
                    │
      ┌─────────────┴─────────────┐
      ▼                           ▼
[ Blender 5.2 Eevee 3D ]   [ Edge Neural TTS ]
  - 3D Neon Road Spline      - English (en-IN-Neerja)
  - Holographic Extrusion     - Kannada (kn-IN-Gagan)
  - 3D Bouncing Pin Drop      - 100% Free / Zero Token
  - Speed-Ramp Camera Dive   
      │                           │
      ▼                           ▼
[ 3D Drone Flyover MP4 ]   [ Regional MP3 Audio ]
      │                           │
      └─────────────┬─────────────┘
                    │
                    ▼
  [ Node.js + Headless Puppeteer + Edge ]
    - 1080x1920 Transparent HUD Overlay
    - Story Progress Tracker (5-Segment)
    - Price, Landmark & Surrounding Badges
                    │
                    ▼
     [ Hardware-Accelerated FFmpeg ]
    - Stitches 3D Flyover (Part 1, 3.0s)
    - Cut/Whip into Ground Walkthrough (Part 2, 11.0s)
    - Muxes Neural Audio & Ambient Audio Bed
                    │
                    ▼
 [ Finished 1080x1920 Reel (14.0s, ~15 MB) ]
```

---

## 2. Visual & Motion Standards (Hollywood 9:16)

| Layer | Specifications | Production Value |
| :--- | :--- | :--- |
| **Blender 3D CGI** | `1080x1920`, 30 FPS, Eevee engine on RTX GPU (~1.2s/frame). | Cinematic high-orbit drone dive tracking along a glowing neon access route directly into the site entrance. |
| **Holographic Boundary** | Volumetric 3D curve extrusion with emission shader (`#F59E0B`, `#0284C7`, etc.). | Gives buyers an unmistakable volumetric view of the plot footprint. |
| **3D Location Pin** | 3D conical pin with spherical cap, falling from sky with squash-and-bounce physics + ground shockwave ripple. | Dramatic visual impact at the property entrance. |
| **Speed-Ramp Dive** | Final frames (78-90) surge forward into the gate with motion blur. | Seamless visual bridge into the physical ground walkthrough video. |
| **Walkthrough Footage** | 1080x1920 portrait video shot on site, stabilized, cropped to 9:16. | Shows actual asphalt roads, streetlights, and plot boundaries. |
| **Broadcast Overlays** | Top 5-segment Story tracker + Live `● REC TUMKUR REEL` badge + Bottom glassmorphism card. | High-converting social media format for Instagram Reels & YouTube Shorts. |

---

## 3. Project File Structure

```
C:\sites\map/
├── data/
│   ├── featured_reels_master.json   # Single source of truth (GPS, boundaries, roads, prices)
│   └── layouts_master_catalog.json  # Complete 10-layout dataset
├── scripts/
│   ├── blender_3d_flyover.py        # Parametric Blender 3D Eevee generator
│   ├── generate_voiceovers.js       # MsEdgeTTS dual-language synthesizer (EN + KN)
│   ├── render_hybrid_3d_reel.js     # Hollywood 3D + Walkthrough hybrid compositor
│   ├── build_reels.js               # 2D Map/Overlay compositor
│   └── server.js                    # Streaming server supporting HTTP 206 Partial Content
├── output/
│   ├── audio/                       # Generated .mp3 voiceovers (en & kn)
│   ├── overlays/                    # Transparent 1080x1920 .png broadcast cards
│   ├── blender/                     # 3D CGI .mp4 flyover clips
│   └── reels/                       # Finished 1080x1920 master video reels
└── package.json                     # Automated npm execution scripts
```

---

## 4. Master Runbook Commands

All tasks can be executed autonomously via standard CLI commands:

### A. Generate Neural Regional Voiceovers (Zero Tokens)
```bash
npm run voiceover
```

### B. Render 3D CGI Drone Flyover in Blender
Single site:
```bash
npm run render:3d -- --site 01_PNK_Township
```
Batch render all sites:
```bash
npm run render:3d:all
```

### C. Compile Hollywood Hybrid 3D Master Reels
Single site:
```bash
npm run composite:3d -- --site 01_PNK_Township --lang both
```
Batch compile all layouts in English & Kannada:
```bash
npm run composite:3d:all
```

### D. Unified Blender Video Sequence Editor (VSE) Pipeline
Renders 3D CGI flyover, phone walkthrough footage, HUD overlays, and voiceovers in a single pass directly inside Blender VSE, saving an editable `.blend` project file:
```bash
# Render Layout 1 (P.N.K Township)
npm run render:vse:site1

# Render any layout with custom language
npm run render:vse -- --site 02_Batawadi_Junction --lang kn
```

### E. Google Maps HTML Stage Video Capture (Zero Tokens)
Captures the live Google Maps HTML stage (city overview, camera dive, pulsing neon road trajectory, distance badge) directly into 1080×1920 MP4 clips:
```bash
# Capture individual map video clips for all 5 sites
npm run capture:maps

# Capture the full 5-site continuous Google Maps presentation loop (~90s)
npm run capture:maps:full
```

### F. Master 5-Reel Combined Video Sequence Editor Project
Combines all 5 properties into a single long-form master vertical reel (70.0s @ 30 FPS, 2,100 frames) with multi-track channels, chapter markers, and transitions:
```bash
# Assemble and save editable master .blend project file (00_Master_5_Reels_Combined_VSE.blend)
npm run vse:combined

# Assemble, save project, AND render master 80 MB combined MP4 reel
npm run render:vse:combined
```

### G. Full End-to-End Autonomous Pipeline
Runs voiceovers $\rightarrow$ 3D CGI rendering $\rightarrow$ Walkthrough stitching for all properties:
```bash
npm run pipeline:all
```
