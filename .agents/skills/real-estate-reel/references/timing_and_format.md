# Generic 5-Stage Property Format, Kanglish Voice Style & Clip Slicing

Unless the user's `script.txt` or prompt specifies a custom sequence, organize every site reel cleanly around this proven narrative flow.

---

## 1. Standard Reel Flow ("What Comes After What")

| Stage | Scene Role | Narrative Focus | Primary Widgets (`beats[]`) | Default Slot (`glide_to`) |
| --- | --- | --- | --- | --- |
| **1** | **Location & Road Hook** | Project name + area + Nearest Highway / Landmark distance | `hero_title` -> `route_tracker` | `bottom` -> `top` (or `bottom`) |
| **2** | **Approvals & Trust** | Legal approvals (**TUDA / BMRDA / RERA / A-Khata / DC**) + Loan / Zero Brokerage | `verified_shield` -> `dual_metric` | `bottom` |
| **3** | **Site Features & Utilities** | Internal 30/40-ft asphalt roads, borewell water, power poles, UGD drainage | `checklist_live` | `bottom` |
| **4** | **Dimensions & Vastu** | Plot sizes (`30×40`, `30×50`, `40×60`), Facing (`East/North`), Corner sites | `blueprint_draw` -> `vastu_compass` | `bottom` |
| **5** | **Pricing** | Rate per sq.ft + total plot breakdown + loan/registration note | `price_odometer` -> `price_calc` | `bottom` |
| **6** | **Follow Page CTA** | Brand badge from `common/logo/` + `@handle` + Phone + Cursor Follow tap | `follow_cta` | `bottom` |

*(If shooting strictly 5 clips, Stages 2 & 3 merge cleanly into `scene_02_site_approvals` via `verified_shield` -> `checklist_live`.)*

---

## 2. Natural Daily Kanglish Voiceover Rules (REQUIRED)

Always write `voice_text` like a **real Tumakuru / Karnataka reel host speaking casually face-to-face** — a natural daily mix of conversational Kannada + everyday English words (never stiff formal textbook Kannada):

1. **Tone & Connectors:**
   - Open warmly: *"ಹಾಯ್ ಫ್ರೆಂಡ್ಸ್! ಇವತ್ತು ನಾವು..."* instead of formal *"ನಮಸ್ಕಾರ! ಇಂದು ನಾವು..."*
   - Use natural daily Kannada-English phrases: *"ಹತ್ರ ಇರೋ"*, *"ನೋಡೋಣ ಬನ್ನಿ"*, *"ಜಸ್ಟ್ ... ಕಿಲೋಮೀಟರ್ ಅಷ್ಟೇ"*, *"ಫುಲ್ ರೆಡಿ ಇದೆ"*, *"ಆರಾಮಾಗಿ ಲೋನ್ ಸಿಗುತ್ತೆ"*, *"ಬ್ರೋಕರೇಜ್ ಏನೂ ಇರಲ್ಲ"*, *"ಬೆಲೆ ಬಂದ್ಬಿಟ್ಟು"*, *"ಈಗಲೇ ಫಾಲೋ ಮಾಡಿ"*, *"ಕಾಲ್ ಮಾಡಿ"*.
   - Keep everyday English nouns spoken naturally: `ವೈಡ್ ರೋಡ್`, `ಬೋರ್‌ವೆಲ್ ವಾಟರ್`, `ಕರೆಂಟ್`, `ಅಂಡರ್‌ಗ್ರೌಂಡ್ ಡ್ರೈನೇಜ್`, `ಸೈಟ್ ಡೈಮೆನ್ಷನ್ಸ್`, `ಕಾರ್ನರ್ ಸೈಟ್ಸ್`, `ಅವೈಲಬಲ್ ಇದೆ`, `ಸ್ಕ್ವೇರ್ ಫೀಟ್`, `ರಿಜಿಸ್ಟ್ರೇಷನ್ ಎಕ್ಸ್ಟ್ರಾ`, `ಅಪ್‌ಡೇಟ್ಸ್`, `ಪೇಜ್`.
2. **TTS Pronunciation Guards (`kn-IN-GaganNeural`):**
   - Write uppercase initials phonetically with spaces in Kannada script so TTS speaks them cleanly instead of guessing:
     - `NH 48` -> **`ಎನ್ ಎಚ್ 48`**
     - `SIT College` -> **`ಎಸ್ ಐ ಟಿ ಕಾಲೇಜ್`**
     - `TUDA` -> **`ಟುಡಾ`**, `DC` -> **`ಡಿಸಿ`**
   - **AVOID `"ಲೇಔಟ್"`** (`kn-IN-GaganNeural` reads the `ಲೇ+ಔ` diphthong awkwardly as *"le-pat"*). Use **`ಪ್ರಾಜೆಕ್ಟ್`** (`project`) or **`ಬಡಾವಣೆ`** / **`ಸೈಟ್ಸ್`** instead.
   - Default cadence: `"voice_rate": "+2%"`, `"voice_pitch": "+0Hz"` in `common/brand.json`, using commas `,` and dashes `—` for relaxed natural pauses.

---

## 3. Timed Pop-In Pacing & B-Roll Breathers

* **Default Card Dwell (`card_max_display_sec: 5.2s`):** Each info card slides in (`~0.4s`), holds **`5.2s`** (or **`8.5s` / `hold: true`** for Stage `follow_cta`), and exits cleanly so the audience sees clean raw footage between cards.
* **WordBoundary Beat Syncing:** Beats `1+` automatically search TTS timestamps (`core/audio_tts.js`) for Kannada/English keywords so each card pops in right as the narrator says that number or feature.
* **Strict Visual-to-Audio Fit:** Never make a spoken voice line longer than its scene's video duration! Keep `~1.0–4.0s` visual breathing room inside every clip.

---

## 4. Multi-Scene Clip Slicing When Fewer Raw Clips Exist (`< 5 clips`)

When a creator drops **only 1 or 2 continuous videos** (e.g., `01_road.mp4` `33s` + `02_site_video.mp4` `16s`) instead of 5–6 separate clips:
1. **Inspect actual clips & frames first:** Run `ffprobe` for exact duration + rotation metadata AND extract key frames so every voice line & overlay widget matches what is literally visible at those timestamps.
2. **Slice & pace inside `site.json`:** Use optional properties on any `scenes[]` item (`core/prepare.js` auto-bakes `1080×1920 @ 30fps` CFR segments inside `work/segs/`):
   - `"video": "02_site_video.mp4"`
   - `"clip_start": 0.0`, `"clip_end": 6.0` — exact window in seconds
   - `"clip_speed": 0.62` — smooth slow-motion factor (`0.55–1.0`) when a great panoramic shot needs extra narration seconds
   - `"clip_reverse": true` — smooth return pan for closing `follow_cta` hold
3. **Never add empty/black slides:** Keep real site or approach footage playing continuously behind every frame.
