# ADR 0004: Google Maps HTML Video Capture & Master 5-Reel Combined VSE Pipeline

## Status
**Accepted & Deployed** (November 2026)

---

## 1. Context & User Requirements
Following the successful implementation of Blender's Video Sequence Editor (VSE) for individual site reels (ADR 0003), the user required:
1. **Google Maps Cartography Conversion**: Directly capturing the dynamic, animated Google Maps HTML broadcast stage (`http://localhost:3000`) into broadcast-grade 1080×1920 MP4 video clips without manual screen recording.
2. **Master 5-Reel Compilation**: Combining all 5 featured Tumkur residential layouts into a single, cohesive, long-form vertical video reel.
3. **Blender VSE Project Portability**: Assembling the entire 5-reel sequence into an editable Blender VSE project file (`00_Master_5_Reels_Combined_VSE.blend`) configured with the native `Video_Editing` workspace, 5 distinct channels, transitions, audio tracks, and chapter markers.

---

## 2. Architectural Decisions

### A. Headless CDP Screencast Google Maps Video Capture
* **Engine**: Headless Microsoft Edge / Chromium via `puppeteer-core`.
* **CDP Screencast Stream**: Uses Chrome DevTools Protocol `Page.startScreencast` with:
  * Dimensions: `1080x1920` (9:16 Vertical)
  * Format: High-quality JPEG (`quality: 92`)
  * Target Framerate: 30 FPS
* **Direct FFmpeg Pipe**: Piped directly into `@ffmpeg-installer/ffmpeg` via `image2pipe` stdin:
  * Codec: H.264 (`-c:v libx264`), `preset: fast`, `CRF: 18`, `pix_fmt: yuv420p`.
* **Output Deliverables**:
  * `output/maps/01_PNK_Township_Map.mp4`
  * `output/maps/02_Batawadi_Junction_Map.mp4`
  * `output/maps/03_Kuvempunagara_Map.mp4`
  * `output/maps/04_Amani_Lakeview_Map.mp4`
  * `output/maps/05_Kyatsandra_Gateway_Map.mp4`
  * `output/maps/00_Google_Maps_5_Sites_Presentation.mp4`

### B. Master 5-Reel Combined Timeline Hierarchy (Hollywood Director's Cut)
Built via `scripts/blender_vse_combined_reels.py`:
* **App Template**: Initialized via `bpy.ops.wm.read_homefile(app_template='Video_Editing')`.
* **Master Scene**: `Scene_Master_5_Reels` (2,520 frames = 84.0s @ 30 FPS).
* **Cinematic Camera Easing (60 FPS WebGL Flights)**:
  * Google Maps `isFractionalZoomEnabled: true` and `map.moveCamera()` at 60 FPS.
  * **Smooth Crane Dive**: Smooth continuous zoom glide from city overview (Zoom 12.6) down to layout gate (Zoom 16.8) over 2.4s using `easeInOutCubic`.
  * **Smooth Crane Pull-Back**: When transitioning across properties, smoothly swoops up from Zoom 16.8 to Zoom 12.6 over 2.2s, banking across the Tumkur city sky.
* **Pacing & Timing Standards**:
  * **Channel 1 (Google Maps Flight)**: 180 frames (6.0s) per property (Establishing wide shot + continuous drone dive + neon road trace).
  * **Channel 2 (Walkthrough Tours)**: 360 frames (12.0s) per property streaming real phone footage from `C:\sites\agent_project\`.
  * **Channel 3 (Transitions)**: 36 frames (1.2s) luxurious `GAMMA_CROSS` melt dissolve between Map Flight and Walkthrough Tour, plus inter-site dissolves.
  * **Channel 4 (HUD Overlays)**: Transparent 1080×1920 broadcast graphics with `blend_type = 'ALPHA_OVER'`.
  * **Channel 5 (Voiceovers)**: Neural bilingual narration (English `en-IN-NeerjaNeural` / Kannada `kn-IN-GaganNeural`).
* **Timeline Scene Markers**:
  * Frame 1: `Site 1: P.N.K TOWNSHIP`
  * Frame 505: `Site 2: GREEN MEADOWS SMART`
  * Frame 1009: `Site 3: ROYAL PALMS LUXURY`
  * Frame 1513: `Site 4: AMANI LAKEVIEW COU`
  * Frame 2017: `Site 5: HIGHWAY GATEWAY SM`

### C. Zero-Token Hardware-Accelerated Local Rendering
* No third-party rendering APIs, cloud subscriptions, or LLM token fees.
* Rendered directly by Blender 5.2's internal FFmpeg encoder into:
  - `00_Master_5_Reels_Combined_EN.mp4` (97.31 MB, 84.0s)
  - `00_Master_5_Reels_Combined_KN.mp4` (~96 MB, 84.0s)

---

## 3. Results & Benchmarks

| Metric | Initial Test Reels | Master 5-Reel Director's Cut |
| :--- | :--- | :--- |
| **Duration** | 14.0s - 15.0s | **84.0s (2,520 frames)** |
| **Pacing & Rhythm** | Rushed (3.5s map / 0.5s cut) | **Hollywood Paced (6.0s map / 1.2s dissolve / 12.0s tour)** |
| **Camera Movement** | Instant Zoom Snap | **60 FPS Continuous Crane Dive & Pull-Back (`easeInOutCubic`)** |
| **Resolution** | 1080×1920 (9:16 Vertical) | **1080×1920 (9:16 Vertical Broadcast)** |
| **Properties Included** | 1 | **All 5 Featured Townships Sequenced** |
| **GUI Editability** | Standalone .blend | **Full 5-scene timeline .blend with chapter markers** |
| **Render Engine** | Blender 5.2 VSE (Direct) | **Blender 5.2 VSE (Direct, 97 MB MP4)** |
| **LLM Token Cost** | 0 tokens | **0 tokens** |
