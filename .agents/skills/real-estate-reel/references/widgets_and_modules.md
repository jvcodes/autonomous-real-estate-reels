# Modular Architecture & Widget Catalog

The engine is split into small, focused files under `core/` and supports 12 pre-built WCAG-checked GSAP 3.15 + SVG widgets inside **HyperFrames**.

---

## 1. Modular `core/` File Map

| File | Responsibility |
| --- | --- |
| [`core/layout_spec.js`](../../../core/layout_spec.js) | Single source of truth for `1080×1920` geometry, safe zones, per-overlay size/height budgets, min/max font scale, and dwell timings. |
| [`core/widgets.js`](../../../core/widgets.js) | Renders all 12 animated HyperFrames + GSAP 3.15 property widgets wired strictly to `LAYOUT`. |
| [`core/templates.js`](../../../core/templates.js) | Generates scene HTML, top HUD chrome (top-right logo coin + counter + stories bar), transitions, WordBoundary captions, and root/alpha `index.html`. |
| [`core/audio_tts.js`](../../../core/audio_tts.js) | Parses `msedge-tts` WordBoundary timestamps, anchors beats to spoken words, synthesizes Cmaj9->Am9->Fmaj9->G6 chord bed, mixes `-15 LUFS` audio via FFmpeg, and schedules SFX cues. |
| [`core/resolve_xml.js`](../../../core/resolve_xml.js) | Emits FCP7 XMEML `.xml` (`V1` raw clips, `V2` ProRes 4444 alpha overlay, `A1` synced mix audio + scene markers). |
| [`core/prepare.js`](../../../core/prepare.js) | Slim pipeline orchestrator (`--new` site scaffolding, `common/logo/` normalization to `assets/brand/brand_logo.*`, calls above modules). |
| [`core/render.js`](../../../core/render.js) | Unified CLI runner injecting Node 22+ & Gyan FFmpeg for `studio`, `check`, `mp4`, `alpha`, and `reel`. |
| [`core/resolve_import.py`](../../../core/resolve_import.py) | DaVinci Resolve Studio menu importer (`Workspace -> Scripts -> Build_Reel_Studio`). |

---

## 2. Built-In HyperFrames + GSAP 3.15 Widget Catalog (`core/widgets.js`)

Select any of these inside `scenes[].beats[].widget` in `site.json`:

| Widget (`widget`) | Band Slot | Key JSON Fields | Visual Motion |
| --- | --- | --- | --- |
| `hero_title` | `bottom` (default) | `badge`, `value`, `sub` | Opening kinetic title (`opacity: 0.92` at `t=0` on Stage 1), word blur-in + gradient sweep bar |
| `route_tracker` | `top` or `bottom` | `badge`, `count_from`, `count_to`, `count_suffix`, `route_start`, `route_end`, `sub` | Dashed SVG road spline + `MotionPathPlugin` sliding destination pin + distance odometer |
| `verified_shield` | `bottom` | `badge`, `value`, `sub` | Self-drawing emerald SVG shield (`strokeDashoffset`) + double checkmark verify draw |
| `checklist_live` | `bottom` (tall) | `badge`, `value`, `items[]` (3 items) | 3 infrastructure pills pre-lit at `0.42` opacity that ignite green sequentially |
| `blueprint_draw` | `bottom` (tall) | `badge`, `width_label`, `depth_label`, `count_to`, `count_suffix`, `sub` | Blueprint grid + perimeter stroke draw + corner snaps + live sq.ft counter |
| `vastu_compass` | `bottom` | `badge`, `value`, `sub` | Subtle radial spotlight vignette + spring-rotated SVG Vastu compass needle |
| `price_odometer` | `bottom` | `badge`, `count_from`, `count_to`, `count_prefix`, `count_suffix`, `sub` | Warm amber high-contrast card with rapid rate roll-up (`₹1,850 / SQ.FT`) |
| `price_calc` | `bottom` | `badge`, `eq_left`, `eq_mid`, `count_to`, `count_decimals`, `count_prefix`, `count_suffix`, `sub` | Animated equation chips (`1,200 SQ.FT × ₹1,850 = ₹22.2 LAKHS`) |
| `growth_curve` | `bottom` | `badge`, `value`, `growth_tag`, `sub` | Appreciation trajectory Bézier curve + milestone dots + neon growth pill |
| `dual_metric` | `bottom` | `badge`, `left_label`/`left_value`, `right_label`/`right_value` | Left/right opposing comparison wings sliding inward |
| `follow_cta` | `bottom` (tall) | `badge`, `value`, `handle`, `button_text`, `sub` | Reads `common/logo/` + `brand.json` handle; animates mouse cursor glide + click tap + ripple (`8.5s` dwell) |
| `highlight_pill` | `bottom` | `badge`, `value`, `sub` | Fallback gradient-sweep text highlight card |

---

## 3. Adding Custom Widgets Beyond the 12 Built-Ins

If a property requires a custom visual (e.g., bank EMI breakdown chart, milestone timeline, or drone map callout):
1. **First read HyperFrames' native authoring spec:** `node_modules/hyperframes/dist/skills/hyperframes/SKILL.md`.
2. Add the new widget branch cleanly inside `core/widgets.js`, importing `LAYOUT` constants from `core/layout_spec.js` so it respects the `440–1190 px` open center band, `width: 840 px`, `maxHeightPx: 298 px`, and `>= 28 px` subtext floor.
3. Run `npm run check -- sites/<folder>` and visually inspect with `hyperframes snapshot` to verify `0` lint/layout/contrast warnings.
