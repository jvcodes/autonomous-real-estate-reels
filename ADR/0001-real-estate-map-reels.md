# ADR 0001: Automated 9:16 Broadcast Reel Composition Pipeline

* **Status:** Accepted (Architectural Pivot to Autonomous Video Engine)
* **Date:** 2026-11-02
* **Project:** Tumkur Real Estate Map & Reel Generator (`C:\sites\map`)

---

## 1. Context & Fundamental Architectural Pivot

* **Original Concept:** Interactive web app where users click buttons to navigate map properties and view videos.
* **New Reality & Architectural Pivot:**
  * **No user will touch or interact with this page.**
  * The web page functions exclusively as an **autonomous 9:16 broadcast motion graphics & reel composition pipeline**.
  * Its sole purpose is to mix and render animated Google Maps cartography, glowing access road trajectories, distance metrics, and property walkthrough videos into broadcast-grade Instagram Reels and YouTube Shorts.

---

## 2. Core Decisions & Specifications

1. **Zero Interactive Chrome (100% Non-Interactive Stage)**
   * **Decision:** Eliminated all website navigation bars, headers, floating button pills, close buttons ("✕"), navigation arrows ("▲", "▼"), and back buttons.
   * **Rationale:** Interactive web UI elements ruin the illusion of a finished, professional motion graphics video reel.
   * **Result:** Pristine, spotless video capture canvas without any website UI buttons.

2. **Autonomous Self-Running Execution**
   * On page load (`DOMContentLoaded`), the map initializes and begins the automated sequence immediately without requiring any clicks or touch inputs.
   * Runs in a continuous broadcast loop (Property 1 $\rightarrow$ 2 $\rightarrow$ 3 $\rightarrow$ 4 $\rightarrow$ 5 $\rightarrow$ loops back to 1) so screen recording tools or video renderers can capture footage at any time.

3. **Dedicated 9:16 Vertical Video Canvas (1080x1920 Target)**
   * Locked to 9:16 aspect ratio across both map and video stages.
   * Styled with deep obsidian twilight canvas (`#080C14`), removing all default Google POIs, icons, and clutter.

4. **Broadcast Motion Graphics Overlay System**
   * **Top 5-Segment Story Progress Tracker:** Displays an Instagram/TikTok Stories-style segmented bar that fills progressively as each property's sequence plays.
   * **Top Telemetry Badge:** Shows recording indicator (`● REC`) and property count (`PROPERTY 1 OF 5`).
   * **Map Orientation Stage (5.0 Seconds):** Pulls back to Tumkur city altitude (`zoom: 12.8`), lights up target polygon + adjacent zones, and counts down 5 seconds with a live caption chip.
   * **Camera Dive (0.7 Seconds):** Smooth glide into layout altitude (`zoom: 17.0`).
   * **Road-to-Site Distance Curved Arrow (3.5 Seconds Hold):** Traces an animated curved neon polyline from the main connecting road/highway to the site gate, displays distance callout badge (`📏 500m (1 Min Drive) from Vijayanagar Main Rd`), and pulses at 60 FPS.
   * **Full-Bleed Walkthrough Video (8.5 Seconds):** Slides up full-screen within the 9:16 canvas, plays the actual property walkthrough video from `agent_project`, and displays professional lower-third cards (price per sq.ft, starting price, landmark, adjacent zones, and feature tags).
   * **Seamless Transition:** Retracts video, glides back to wide city map, and advances to the next property.

5. **Invisible Creator Controls**
   * Silent keyboard shortcuts for screen recording setup:
     * `Space`: Pause / Resume autonomous pipeline.
     * `M`: Toggle audio mute.
     * `T`: Toggle map theme (Cinema Dark / Satellite).

---

## 3. Tech Stack & Directory Structure

* **Rendering Engine:** Vanilla HTML5, CSS3 Motion Graphics, Google Maps JavaScript API (OverlayView, Polygon, Polyline).
* **Streaming Backend:** Zero-dependency Node.js HTTP server supporting HTTP 206 Partial Content (Range requests) for smooth video playback.
* **Storage Architecture:**
  * Broadcast canvas: `C:\sites\map`
  * Processed video walkthroughs & catalog: `C:\sites\agent_project`
  * Raw source archive: `C:\sites\sits 18.10.2026`
