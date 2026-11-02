# Architecture: Autonomous 9:16 Real Estate Reel Engine

This document outlines the software architecture, design principles, and rendering pipeline of the **Autonomous Real Estate Reels Engine**.

---

## 1. Executive Summary

Traditional real estate video marketing requires hours of manual drone piloting, video editing in Premiere/CapCut, and graphic overlays. This engine replaces manual editing with an **autonomous programmatic pipeline** that converts raw property data and GPS coordinates into broadcast-grade 9:16 vertical reels for Instagram Reels and YouTube Shorts.

```
┌────────────────────────┐      ┌───────────────────────────┐      ┌─────────────────────────┐
│ Raw Property Metadata  │ ───> │ Autonomous 9:16 Stage     │ ───> │ Broadcast 1080x1920 MP4 │
│ GPS, Boundary, Videos  │      │ Map Flight + Road + Video │      │ Instagram & Shorts      │
└────────────────────────┘      └───────────────────────────┘      └─────────────────────────┘
```

---

## 2. The 4-Pillar System Architecture

### Pillar 1: Cinematic Vector Cartography (Google Maps API)
* **Custom Obsidian Canvas (`#080C14`):** Eliminates 100% of default commercial POI clutter (stores, cafes, transit icons) so only geographical context remains.
* **Organic District Boundaries:** Multi-vertex SVG polygons tracing real roads, lakes, and administrative zones with 20% cartographic wash and hairline borders.
* **Dynamic Altitude Control:** Programmatic camera transitions from city-wide altitude (`zoom: 12.8`) to layout gate altitude (`zoom: 17.0`).

### Pillar 2: Motion Graphics & Trajectory Engine (Canvas + SVG)
* **Progressive Road Vector Animation:** A 60 FPS animated curved arrow tracing the exact access road path from the highway to the property entrance.
* **Dual-Layer Neon Glow:** Core white polyline with a pulsing neon halo (`requestAnimationFrame`).
* **Telemetry Callouts:** Distance badges calculated from road paths (e.g. `📏 500m (1 Min Drive) from Vijayanagar Main Rd`).

### Pillar 3: Streaming Media & Broadcast Overlays
* **Zero-Dependency HTTP 206 Streaming:** Node.js HTTP server supporting `Range` headers for smooth video seeking and instant MP4 streaming.
* **Story Progress Tracker:** 5-segment Story tracker (Instagram/TikTok style) across the top filling progressively.
* **Broadcast Lower Thirds:** Non-interactive typography displaying property title, price per sq.ft (`₹/sq.ft`), starting price, landmarks, and surrounding neighborhoods.

### Pillar 4: Autonomous Agent & MCP Orchestration
* **Antigravity Custom Skill:** Packaged in `.agents/skills/autonomous-real-estate-reels/SKILL.md` allowing AI agents to generate, configure, and inspect property reels on demand.
* **Deterministic Timeline Loop:** Self-running state machine requiring zero user interaction.

---

## 3. Deterministic Timeline Choreography

Each property layout receives approximately **17.7 seconds** of broadcast airtime in the master reel:

```
0.0s                   5.0s        5.7s                9.2s                          17.7s
├───────────────────────┼───────────┼───────────────────┼──────────────────────────────┤
│ City Map Overview     │ Glide Dive│ Road Curve Hold   │ Full-Bleed Video Walkthrough │
│ Zoom: 12.8 (5.0s)     │ Zoom: 17  │ 60 FPS Neon (3.5s)│ MP4 Stream + Lower 3rd (8.5s)│
```

1. **City Map Overview (5.0s):**
   * Sets top Story segment active.
   * Highlights target layout (55% fill) and adjacent zones (30% fill).
   * Displays countdown caption chip: `📍 [5s] TUMKUR OVERVIEW: P.N.K TOWNSHIP`.
2. **Camera Dive (0.7s):**
   * Smoothly pans to property GPS center and zooms in to `17.0`.
3. **Road Curve Trajectory (3.5s):**
   * Traces access road from connecting highway.
   * Displays distance callout badge and holds for 3.5 seconds.
4. **Walkthrough Video Overlay (8.5s):**
   * Slides in full 9:16 frame.
   * Plays layout footage with lower-third metadata.
5. **Auto-Advance & Loop:**
   * Advances to the next layout, looping infinitely from Property 1 through 5.

---

## 4. Security & Credential Isolation

* **Local Secret Isolation:** Google Maps API keys are isolated in `config.local.js` (gitignored).
* **Sample Fallback:** Public repositories include `config.sample.js` with sanitized placeholders to prevent token exposure.
