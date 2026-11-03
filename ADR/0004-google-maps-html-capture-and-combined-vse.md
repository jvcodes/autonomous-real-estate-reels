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

### B. Master 5-Reel Combined Timeline Hierarchy (Hollywood Director's Cut - 1:30 Standard)
Built via `scripts/blender_vse_combined_reels.py`:
* **App Template**: Initialized via `bpy.ops.wm.read_homefile(app_template='Video_Editing')`.
* **Master Scene**: `Scene_Master_5_Reels` (2,700 frames = Exactly 90.0s / 1:30 mins @ 30 FPS).
* **Architectural Platinum Light Cartography**:
  * Platinum/ivory base (`#f8fafc`) with high-contrast road corridors.
  * Crystal sky-blue lakes (`#7dd3fc`, prominently showing **Amani Kere Lake**), fresh mint greenery (`#dcfce7`), and warm golden highways (`#fed7aa`).
  * High-contrast neighborhood and landmark labels enabled (`administrative.neighborhood`, `administrative.locality`, `poi.school`, `transit.station`) with deep slate typography and `#ffffff` text strokes.
* **Cinematic Slow Sinusoidal Drone Flight (60 FPS WebGL Flights)**:
  * Google Maps `isFractionalZoomEnabled: true` + `map.moveCamera()` running at 60 FPS.
  * **Sinusoidal Easing (`easeInOutSine`)**: Replaced cubic easing with sinusoidal easing to eliminate mid-flight velocity spikes, ensuring a gentle, linear-biased glide where all text remains crisp and readable.
  * **1.5s Wide Overview**: High-altitude (Zoom 12.3) establishing Tumkur city geography, lake perimeters, and layout pin.
  * **6.0s Slow Majestic Drone Dive**: Long, continuous zoom glide (Zoom 12.3 $\rightarrow$ 16.3) allowing viewers ample time to identify surrounding localities (S.S. Puram, Ashok Nagar, Batawadi, Kuvempunagara, Kyatsandra, SIT Campus).
  * **Progressive In-Flight Landmark Banners**: Banners update at 2.2s and 4.2s during the descent to orient buyers.
  * **2.5s Ground-Level Hold & Neon Route Trace**: Arrives at Zoom 16.3; glowing neon access road traces with distance badge (*"📏 500m (1 Min Drive) from Highway"*).
  * **1.2s Luxurious Melt Dissolve (`GAMMA_CROSS`)**: Seamless transition into the ground walkthrough tour.
* **Pacing & Timing Standards (18.0s / 540 Frames per Property)**:
  * **Channel 1 (Google Maps Slow Flight)**: 285 frames (9.5s) per property (1.5s wide overview + 6.0s slow dive + 2.0s settled ground view).
  * **Channel 2 (Walkthrough Tours)**: 291 frames (9.7s) per property streaming real phone footage from `C:\sites\agent_project\`.
  * **Channel 3 (Transitions)**: 36 frames (1.2s) luxurious `GAMMA_CROSS` melt dissolve between Map Flight and Walkthrough Tour.
  * **Channel 4 (HUD Overlays)**: Transparent 1080×1920 broadcast graphics with `blend_type = 'ALPHA_OVER'`.
  * **Channel 5 (Voiceovers)**: Neural bilingual narration (English `en-IN-NeerjaNeural` / Kannada `kn-IN-GaganNeural`).
* **Timeline Scene Markers**:
  * Frame 1: `Site 1: P.N.K TOWNSHIP`
  * Frame 541: `Site 2: GREEN MEADOWS SMART`
  * Frame 1081: `Site 3: ROYAL PALMS LUXURY`
  * Frame 1621: `Site 4: AMANI LAKEVIEW COU`
  * Frame 2161: `Site 5: HIGHWAY GATEWAY SM`

### C. Zero-Token Hardware-Accelerated Local Rendering
* No third-party rendering APIs, cloud subscriptions, or LLM token fees.
* Rendered directly by Blender 5.2's internal FFmpeg encoder into:
  - `00_Master_5_Reels_Combined_EN.mp4` (126.59 MB, 90.0s / 1:30 min)
  - `00_Master_5_Reels_Combined_KN.mp4` (~120 MB, 90.0s / 1:30 min)

---

## 3. Results & Benchmarks

| Metric | Initial Test Reels | Master 5-Reel Director's Cut (1:30) |
| :--- | :--- | :--- |
| **Duration** | 14.0s - 15.0s | **90.0s / 1:30 min (2,700 frames)** |
| **Map Theme** | Dark/Low Contrast | **Architectural Platinum Light (`PLATINUM_LIGHT_STYLE`)** |
| **Locality Visibility** | Hidden | **High-contrast Neighborhood & Landmark Labels Enabled** |
| **Zoom Duration** | 2.3s rushed | **6.0s Slow, Steady, Panoramic Drone Descent** |
| **Camera Easing** | Cubic (300% mid-flight rush) | **Sinusoidal (`easeInOutSine` - Silky & Legible)** |
| **Settled Map Hold** | 0s (cut off before bottom) | **2.5s Settled View with Route & Distance Badge** |
| **Resolution** | 1080×1920 (9:16 Vertical) | **1080×1920 (9:16 Vertical Broadcast)** |
| **Properties Included** | 1 | **All 5 Featured Townships Sequenced** |
| **GUI Editability** | Standalone .blend | **Full 5-scene timeline .blend with chapter markers** |
| **Render Engine** | Blender 5.2 VSE (Direct) | **Blender 5.2 VSE (Direct, ~126 MB MP4)** |
| **LLM Token Cost** | 0 tokens | **0 tokens** |
| **Resolution** | 1080×1920 (9:16 Vertical) | **1080×1920 (9:16 Vertical Broadcast)** |
| **Properties Included** | 1 | **All 5 Featured Townships Sequenced** |
| **GUI Editability** | Standalone .blend | **Full 5-scene timeline .blend with chapter markers** |
| **Render Engine** | Blender 5.2 VSE (Direct) | **Blender 5.2 VSE (Direct, ~120 MB MP4)** |
| **LLM Token Cost** | 0 tokens | **0 tokens** |
