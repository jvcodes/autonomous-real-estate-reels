# 🎬 Autonomous Real Estate Reels Engine

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Format: 9:16 Vertical Reel](https://img.shields.io/badge/Format-9%3A16%20Reels-gradient)](https://instagram.com)
[![Engine: Google Maps + Node](https://img.shields.io/badge/Engine-Google%20Maps%20%2B%20Node.js-orange)](https://github.com/jvcodes/autonomous-real-estate-reels)

An **autonomous AI agent and broadcast motion graphics pipeline** designed to produce high-converting **9:16 vertical video reels** (for Instagram Reels and YouTube Shorts) showcasing real estate properties, plots, and layouts.

Blending **dynamic aerial Google Maps flights**, **60 FPS animated road curves**, **distance telemetry badges**, and **full-bleed walkthrough footage** with broadcast-grade lower-third motion graphics.

---

## 🌟 Highlights

* 🎯 **100% Autonomous Pipeline:** Self-running broadcast timeline — no manual button clicking or video editing required.
* 📱 **Native 9:16 Vertical Canvas (1080×1920 Target):** Built specifically for mobile phone screens and social video formats.
* 🌌 **Zero-Clutter Obsidian Cartography:** Suppresses all default commercial POI icons, business pins, and traffic noise.
* ⏱️ **5-Second City Orientation Pause:** Pulls back to city altitude with a live countdown so buyers understand the exact geographical location.
* 📏 **Road-to-Site Distance Curve:** Traces an animated glowing neon arrow along the access road from highway to property entrance with a 3.5s metric hold.
* 🎥 **HTTP 206 Partial Content Streaming:** Node.js backend streaming walkthrough MP4 clips smoothly with sub-second seeks.
* 🤖 **Antigravity / Agent Skill Included:** Ready for autonomous coding agents with `.agents/skills/autonomous-real-estate-reels/SKILL.md`.

---

## 📐 Deterministic Timeline Choreography

Each layout receives approximately **17.7 seconds** of broadcast airtime in the master reel:

| Stage | Duration | Visual Choreography |
| :--- | :--- | :--- |
| **1. City Overview** | `5.0s` | Pulls back to city altitude (`zoom: 12.8`), lights up target polygon (55% wash) & adjacent neighborhoods (30% wash) with live countdown badge. |
| **2. Camera Dive** | `0.7s` | Smooth pan & dive from city altitude down to layout gate (`zoom: 17.0`). |
| **3. Road Access Curve** | `3.5s` | Traces animated neon polyline from highway to gate with `📏 [Distance] ([DriveTime]) from [RoadName]` badge. Pulses at 60 FPS. |
| **4. Walkthrough Video** | `8.5s` | Seamless full-bleed video slide-up playing site footage with broadcast lower-third (rate/sqft, starting price, landmarks). |
| **5. Auto-Advance Loop** | Instant | Retracts video, glides back to wide city map, and cycles to the next layout in an infinite broadcast loop. |

---

## 🚀 Quick Start

### 1. Clone the Repository
```bash
git clone https://github.com/jvcodes/autonomous-real-estate-reels.git
cd autonomous-real-estate-reels
```

### 2. Configure Google Maps API Key
Copy `config.sample.js` to `config.local.js` (gitignored for security) and add your API key:
```javascript
const LOCAL_CONFIG = {
  GOOGLE_MAPS_API_KEY: "YOUR_GOOGLE_MAPS_API_KEY_HERE"
};
```

### 3. Launch the Streaming Server
```bash
node server.js
```
Open **`http://localhost:3000`** in any browser. The autonomous reel pipeline will start immediately on its own.

### 4. Headless 9:16 Video Capture
To launch the dedicated 9:16 vertical preview window:
```bash
npm run export
```
Record the window directly via OBS Studio or Windows Game Bar (`Win + Alt + R`).

---

## 📂 Repository Structure

```
autonomous-real-estate-reels/
├── .agents/
│   └── skills/
│       └── autonomous-real-estate-reels/
│           └── SKILL.md            # Antigravity agent skill definition
├── ADR/
│   ├── 0001-real-estate-map-reels.md # Architecture Decision Record
│   └── README.md
├── data/
│   └── layouts_master_catalog.json # Structured metadata & pricing for 10 layouts
├── scripts/
│   └── headless_reel_capture.js    # Automated 1080x1920 capture launcher
├── skills/
│   └── autonomous-real-estate-reels/
│       └── SKILL.md                # Mirrored skill definition
├── app.js                          # Autonomous playback & timeline engine
├── config.js                       # Google Maps config with local secret fallback
├── config.sample.js                # Sanitized config template
├── index.html                      # Native 9:16 broadcast motion graphics canvas
├── package.json                    # Metadata & scripts
├── properties.js                   # Tumkur layout boundaries & access road paths
├── server.js                       # Zero-dependency HTTP 206 video streaming server
├── style.css                       # Broadcast 9:16 CSS styling
├── ARCHITECTURE.md                 # Deep architectural dive
├── LICENSE                         # MIT License
└── README.md
```

---

## ⌨️ Silent Creator Shortcuts

During recording, use these invisible hotkeys:
* `Space`: Pause / Resume autonomous pipeline.
* `M`: Toggle walkthrough audio mute.
* `T`: Toggle map theme (Cinema Dark / Satellite Hybrid).

---

## 📜 License

MIT License © 2026 [jvcodes](https://github.com/jvcodes)
