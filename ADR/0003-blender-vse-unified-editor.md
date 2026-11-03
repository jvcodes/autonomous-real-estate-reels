# ADR 0003: Unified Video Sequence Editor (VSE) Architecture

## Status
**Accepted & Implemented** (November 2026)

---

## 1. Context & Motivation
Previously, the real estate video reel generation relied on a decoupled two-engine pipeline:
1. **Blender 5.2 (Eevee)**: Rendered 3D drone flyovers to PNG frame sequences or intermediate MP4s.
2. **External FFmpeg**: Ran multiple command-line subprocesses to trim footage, apply HTML/PNG overlays, crossfade scenes, and multiplex audio tracks.

While effective, this separation required:
- Intermediate disk reads/writes of video and frame sequences.
- Dependency on external FFmpeg command-line tools for stitching.
- No visual timeline interface for human editors to inspect, scrub, or fine-tune.

Blender 5.2 LTS comes equipped with an enterprise-grade **Video Sequence Editor (VSE)** capable of acting as an all-in-one Non-Linear Editor (NLE).

---

## 2. Decision: Migrate to Blender VSE Unified Pipeline

### A. Dual-Scene Hierarchy (3D Stage + VSE Master NLE)
* **`Scene_3D`**: Encapsulates 3D CGI stage geometry, lighting, camera animation, glowing neon road splines, holographic boundary extrusions, and bouncing pins.
* **`Scene_VSE`**: Operates as the master sequence editor containing all broadcast channels:
  * **Channel 1 (Scene Strip)**: References `Scene_3D` directly as a live strip without intermediate disk caching (Frames 1–90 = 3.0s).
  * **Channel 2 (Movie Strip)**: Streams the physical ground walkthrough footage (`reel_walkthrough.mp4`) with automatic aspect ratio and orientation detection (1080×1920).
  * **Channel 3 (Transition Strip)**: Applies native `GAMMA_CROSS` or `CROSS` transitions between the 3D speed-ramp dive and the phone tour.
  * **Channel 4 (Image Strip)**: Overlays transparent 1080×1920 broadcast HUD motion graphics using native `ALPHA_OVER` blending.
  * **Channel 5 (Sound Strip)**: Synchronizes the regional neural voiceover (`.mp3`).

### B. Single-Pass Direct Video Encoding
By setting Blender 5.2's `media_type = 'VIDEO'` and `file_format = 'FFMPEG'`, Blender's internal encoder outputs directly to **MPEG-4 / H.264 / AAC** with `constant_rate_factor = 'HIGH'` and `preset = 'GOOD'`.
No secondary encoding or external FFmpeg binary is required.

### C. Visual Inspection & GUI Portability
The pipeline saves an editable **`01_PNK_Township_VSE_Project.blend`** file during execution.
This provides the unique advantage of dual-mode operation:
1. **Headless Execution**: Fast, autonomous, batch rendering via CLI for automated pipelines.
2. **Visual GUI Editing**: Users can double-click the `.blend` file, open Blender, and visually scrub the timeline, trim clips, adjust audio levels, or modify 3D cameras.

---

## 3. Measurable Benefits
* **Single Tool Stack**: Zero external video tool dependencies; 100% self-contained inside Blender 5.2.
* **Inspectable Timelines**: Generates native `.blend` files for visual pair programming and manual fine-tuning.
* **Seamless 3D-to-Video Integration**: 3D scene strips integrate seamlessly with live phone walkthrough video.
* **Zero Recurring Cost**: 100% free and local, consuming 0 LLM tokens.
