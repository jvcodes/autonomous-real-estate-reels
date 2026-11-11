# Generic 5-Stage Property Format & Card Pacing Rules

Unless the user's `script.txt` or prompt specifies a custom sequence, **always** structure every site reel in this exact 5-stage order.

---

## 1. Standard 5-Stage Sequence ("What Comes After What")

| Stage | Scene ID | Narrative Role | Primary Widgets (`beats[]`) | Default Slot (`glide_to`) |
| --- | --- | --- | --- | --- |
| **1** | `scene_01_road_and_area` | Hook + Locality + Nearest Main Road / Highway distance | `hero_title` -> `route_tracker` | `bottom` -> `top` (or `bottom`) |
| **2** | `scene_02_site_approvals` | Legal approvals (**TUDA / RERA / A-Khata / DC**) + ready utilities | `verified_shield` -> `checklist_live` | `bottom` |
| **3** | `scene_03_dimensions_vastu` | Plot sizes (`30×40`), sq.ft counter, Facing / Vastu direction | `blueprint_draw` -> `vastu_compass` | `bottom` |
| **4** | `scene_04_pricing` | Launch price per sq.ft + total plot budget breakdown | `price_odometer` -> `price_calc` | `bottom` |
| **5** | `scene_05_follow_page` | Brand badge from `common/logo/` + `@handle` + animated Follow CTA | `follow_cta` | `bottom` |

* **Persistent Header Elements:**
  * **Top-Right Logo (`common/logo/`):** Pinned across every scene at `right: 40px; top: 74px` (`110×110px` circular coin).
  * **Top-Left Counter + Pill:** Shows live `[01/05]` scene counter + `[AREA • MAIN ROAD]` location tag.

---

## 2. Timed Pop-In Pacing & B-Roll Breathers

Visualizing the actual road width, drainage, corner stones, and surroundings matters more than keeping a static box on screen for 30 seconds:

1. **Default Card Dwell (`card_max_display_sec: 5.2s`):**
   - Set globally in `common/brand.json` and `LAYOUT.timing.cardDefaultDwellSec` (`core/layout_spec.js`).
   - Each info card animates in (`0.38–0.42s`), stays sharp for up to **`5.2s`**, then smoothly slides/fades out (`0.22s`).
   - On a 25-second road or layout clip with 2 beats, viewers get ~10 seconds of cards and ~15 seconds of **pure clean full-screen footage** between/after cards.
2. **Stage 5 Follow CTA Dwell (`8.5s`):**
   - `follow_cta` stays visible up to **`8.5s`** (or holds cleanly to clip end when near the finale) so the user's logo, cursor tap animation, and `@handle` register clearly.
3. **Per-Beat Timing Overrides in `site.json`:**
   - `"display_sec": 4.2` — shorten a quick punch-in card.
   - `"display_sec": 7.0` — extend a complex calculation card.
   - `"hold": true` — pin the beat until the end of that scene clip (only when justified).
4. **WordBoundary Beat Syncing:**
   - Beat 0 opens at `t = 0.0s` (Stage 1) or `t = 0.28s` (Stages 2–5).
   - Beat `1+` automatically searches the Edge TTS `WordBoundary` transcript (`core/audio_tts.js`) for Kannada/English keywords (`ಹೆದ್ದಾರಿ`, `ಟುಡಾ`, `ವಾಸ್ತು`, `ರೂಪಾಯಿ`, numbers, or custom `"anchor_words": [...]`) so the card pops in at the **exact word spoken by the narrator**.
   - Sequential beats enforce `>= 0.20s` exit gap (`LAYOUT.timing.beatGapSec`) so two cards NEVER overlap on screen.

---

## 3. Compiling `script.txt` -> `site.json`

When preparing a site folder (`sites/<YYYY-MM-DD>_<site_slug>/`):
1. Read `script.txt` (or user prompt) + `common/brand.json`.
2. Inspect clip lengths inside `clips/` (`ffprobe`). Aim for **~10–20 words of Kannada (`kn-IN-GaganNeural`) per 8–12s of video** (typically 22–45 spoken words for a 20–30s clip, leaving short breathers). Never pack more TTS seconds than the video clip length!
3. Write concise **English/Kannada KPI strings** onto cards (`<= 4` words for headlines, `<= 1` line for subtitles) so card heights stay strictly inside `LAYOUT.budgets`.
4. Keep `"video": "auto"` when clip filenames sort sequentially (`01_...`, `02_...`), or map exact filenames when order differs.
