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

### B. Master 5-Reel Combined Timeline Hierarchy
Built via `scripts/blender_vse_combined_reels.py`:
* **App Template**: Initialized via `bpy.ops.wm.read_homefile(app_template='Video_Editing')`.
* **Master Scene**: `Scene_Master_5_Reels` (2,100 frames = 70.0s @ 30 FPS).
* **Multi-Track Channel Architecture**:
  * **Channel 1 (Google Maps Intros)**: 105 frames (3.5s) per property showcasing city altitude overview, camera dive, and glowing neon road trajectory.
  * **Channel 2 (Walkthrough Tours)**: 330 frames (11.0s) per property streaming real phone footage from `C:\sites\agent_project\`.
  * **Channel 3 (Transitions)**: Native `GAMMA_CROSS` effect strips between Map Intros and Walkthrough Tours, and between successive property chapters.
  * **Channel 4 (HUD Overlays)**: Transparent 1080×1920 broadcast graphics with `blend_type = 'ALPHA_OVER'`.
  * **Channel 5 (Voiceovers)**: Neural bilingual narration (English `en-IN-NeerjaNeural` / Kannada `kn-IN-GaganNeural`).
* **Timeline Scene Markers**:
  * Frame 1: `Site 1: P.N.K TOWNSHIP`
  * Frame 421: `Site 2: GREEN MEADOWS SMART`
  * Frame 841: `Site 3: ROYAL PALMS LUXURY`
  * Frame 1261: `Site 4: AMANI LAKEVIEW COU`
  * Frame 1681: `Site 5: HIGHWAY GATEWAY SM`

### C. Zero-Token Hardware-Accelerated Local Rendering
* No third-party rendering APIs, cloud subscriptions, or LLM token fees.
* Rendered directly by Blender 5.2's internal FFmpeg encoder into `00_Master_5_Reels_Combined_EN.mp4` (80.13 MB) and `_KN.mp4`.

---

## 3. Results & Benchmarks

| Metric | Individual Site Reels | Master 5-Reel Combined Pipeline |
| :--- | :--- | :--- |
| **Duration** | 15.0s (450 frames) | **70.0s (2,100 frames)** |
| **Resolution** | 1080×1920 (9:16 Vertical) | **1080×1920 (9:16 Vertical)** |
| **Properties Included** | 1 | **All 5 Featured Townships** |
| **Map Source** | Procedural 3D CGI | **Google Maps HTML Stage Video + 3D Options** |
| **GUI Editability** | Standalone .blend | **Full 5-scene timeline .blend with chapter markers** |
| **Render Engine** | Blender 5.2 VSE (Direct) | **Blender 5.2 VSE (Direct, 80 MB MP4)** |
| **LLM Token Cost** | 0 tokens | **0 tokens** |
