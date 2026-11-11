/**
 * core/templates.js
 * HyperFrames HTML/GSAP sub-composition and root index builders:
 *  - Scene overlays (delegates widgets to core/widgets.js)
 *  - Persistent Top Header Chrome (top-right circular badge + left counters/pills)
 *  - Scene transitions + lower caption rail
 *  - Root HTML for both full MP4 and transparent ProRes 4444 alpha overlay
 */

const { LAYOUT, escHtml } = require('./layout_spec');
const { renderBeatWidget } = require('./widgets');
const { buildSfxSchedule } = require('./audio_tts');

function getBaseStyles(relAssetPrefix = '../assets') {
  return `
    @font-face {
      font-family: "NirmalaKannada";
      src: url("${relAssetPrefix}/fonts/NIRMALA.TTF") format("truetype");
      font-weight: 400;
      font-style: normal;
    }
    @font-face {
      font-family: "NirmalaKannada";
      src: url("${relAssetPrefix}/fonts/NIRMALAB.TTF") format("truetype");
      font-weight: 700;
      font-style: normal;
    }
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    #root {
      position: absolute;
      inset: 0;
      overflow: hidden;
      font-family: "Outfit", "Inter", "NirmalaKannada", sans-serif;
      color: #ffffff;
    }
    .eyebrow {
      display: inline-flex;
      align-items: center;
      gap: 10px;
      padding: 6px 15px;
      border-radius: 999px;
      font-family: "Space Mono", "Inter", monospace;
      font-size: ${LAYOUT.font.eyebrowPx}px;
      font-weight: 700;
      letter-spacing: 0.11em;
      text-transform: uppercase;
      color: #ffffff;
      background: rgba(8, 12, 24, 0.90);
    }
    .mono { font-family: "Space Mono", monospace; font-variant-numeric: tabular-nums; }
    .num { font-variant-numeric: tabular-nums; }
  `;
}

function wrapSubComp({ compId, dur, fps, htmlBody, styles, scriptBody }) {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <script src="../assets/vendor/gsap.min.js"></script>
  <script src="../assets/vendor/CustomEase.min.js"></script>
  <script src="../assets/vendor/MotionPathPlugin.min.js"></script>
</head>
<body>
  <template>
    <div id="root" data-composition-id="${compId}" data-duration="${dur.toFixed(3)}" data-fps="${fps}" data-width="${LAYOUT.canvas.width}" data-height="${LAYOUT.canvas.height}">
      <style>
        ${getBaseStyles('../assets')}
        ${styles}
      </style>
      ${htmlBody}
      <div id="${compId}-drv" class="clip" data-start="0" data-duration="${dur.toFixed(3)}" data-track-index="0" style="position:absolute;width:1px;height:1px;opacity:0;pointer-events:none"></div>
      <script>
        (function() {
          "use strict";
          window.__timelines = window.__timelines || {};
          if (window.gsap && window.CustomEase) gsap.registerPlugin(CustomEase);
          if (window.gsap && window.MotionPathPlugin) gsap.registerPlugin(MotionPathPlugin);
          const tl = gsap.timeline({ paused: true });
          ${scriptBody}
          tl.set({}, {}, ${dur.toFixed(3)});
          window.__timelines["${compId}"] = tl;
        })();
      </script>
    </div>
  </template>
</body>
</html>`;
}

function generateSceneCompositionHtml(scene, sceneIndex, _totalScenes, fps, brandMeta) {
  const dur = scene.durationSec;
  const acc = scene.accent || '#00D4FF';
  const acc2 = scene.accent_secondary || '#6366F1';
  const compId = scene.id;

  const htmlParts = [];
  const cssParts = [];
  const jsParts = [];

  scene.beats.forEach((b, bIdx) => {
    const out = renderBeatWidget({
      beat: { ...b, glide_to: b.glide_to || scene.glide_to || 'bottom', _isLastInScene: bIdx === scene.beats.length - 1 },
      bIdx,
      sceneIndex,
      dur,
      acc,
      acc2,
      brandMeta
    });
    htmlParts.push(out.html);
    cssParts.push(out.css);
    jsParts.push(out.js);
  });

  return wrapSubComp({ compId, dur, fps, htmlBody: htmlParts.join('\n'), styles: cssParts.join('\n'), scriptBody: jsParts.join('\n') });
}

function generateHudChromeHtml(timelineData, brandMeta) {
  const dur = timelineData.totalDurationSec;
  const fps = timelineData.fps;
  const scenes = timelineData.scenes;
  const showLogo = brandMeta.logo_hud_watermark !== false && brandMeta.hfLogoRelPath;
  const logoRight = String(brandMeta.logo_hud_position || 'top-right').toLowerCase() !== 'top-left';

  const counterHtml = `
    <div class="scene-counter" data-layout-ignore>
      <span id="sc-cur">01</span><span>/${String(scenes.length).padStart(2, '0')}</span>
    </div>`;
  const locPillHtml = `
    <div class="loc-pill" data-layout-ignore>
      <span class="live-dot"></span>
      <span>${escHtml(timelineData.location_badge || 'SITE TOUR')}</span>
      <span class="eq-bars" aria-hidden="true"><i id="eq-0"></i><i id="eq-1"></i><i id="eq-2"></i><i id="eq-3"></i></span>
    </div>`;
  const logoHtml = showLogo
    ? `<div class="brand-chip ${logoRight ? 'brand-corner-right' : 'brand-corner-left'}" data-layout-ignore>
         <img class="brand-logo" src="../${brandMeta.hfLogoRelPath}" alt="Brand Logo" />
       </div>`
    : '';

  const htmlBody = `
    <div class="hud-top">
      <div class="stories-bar">
        ${scenes.map((s, idx) => `<div class="sb-track"><div class="sb-fill" id="sb-${idx}" style="background:linear-gradient(90deg, ${s.accent}, ${s.accent_secondary});"></div></div>`).join('')}
      </div>
      <div class="hud-row">
        <div class="hud-left-cluster">${logoRight ? counterHtml + locPillHtml : logoHtml + locPillHtml}</div>
        <div class="hud-right-cluster">${logoRight ? logoHtml : counterHtml}</div>
      </div>
    </div>`;

  const styles = `
    .hud-top { position: absolute; left: ${LAYOUT.header.horizontalInsetPx}px; right: ${LAYOUT.header.horizontalInsetPx}px; top: ${LAYOUT.header.topPx}px; pointer-events: none; }
    .stories-bar { display: flex; gap: 8px; width: 100%; height: ${LAYOUT.header.progressBarHeightPx}px; margin-bottom: 12px; }
    .sb-track { flex: 1; height: 100%; background: rgba(255,255,255,0.28); border-radius: 99px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.4); }
    .sb-fill { width: 100%; height: 100%; transform-origin: left center; }
    .hud-row { display: flex; justify-content: space-between; align-items: flex-start; gap: 14px; }
    .hud-left-cluster { display: flex; align-items: center; gap: 10px; max-width: ${LAYOUT.header.leftClusterMaxWidthPx}px; margin-top: 4px; }
    .hud-right-cluster { display: flex; align-items: center; justify-content: flex-end; flex-shrink: 0; }
    .brand-chip.brand-corner-right {
      width: ${LAYOUT.header.logoRightSizePx}px; height: ${LAYOUT.header.logoRightSizePx}px; border-radius: 50%; padding: 2px; overflow: hidden;
      background: #faf9f6; border: 2.5px solid rgba(255,255,255,0.92);
      display: flex; align-items: center; justify-content: center; box-shadow: 0 12px 30px rgba(0,0,0,0.55);
    }
    .brand-chip.brand-corner-left {
      width: ${LAYOUT.header.logoLeftSizePx}px; height: ${LAYOUT.header.logoLeftSizePx}px; border-radius: 50%; padding: 2px; overflow: hidden;
      background: #faf9f6; border: 2px solid rgba(255,255,255,0.85);
      display: flex; align-items: center; justify-content: center; box-shadow: 0 10px 26px rgba(0,0,0,0.45);
    }
    .brand-logo { width: 100%; height: 100%; object-fit: cover; border-radius: 50%; }
    .loc-pill {
      display: inline-flex; align-items: center; gap: 10px; padding: 9px 18px; border-radius: 999px;
      background: rgba(8, 12, 24, 0.88); border: 1.5px solid rgba(255,255,255,0.22);
      font-family: "Space Mono", monospace; font-size: ${LAYOUT.font.hudPillPx}px; font-weight: 700; letter-spacing: 0.08em; color: #ffffff;
      box-shadow: 0 10px 26px rgba(0,0,0,0.45); white-space: nowrap;
    }
    .live-dot { width: 10px; height: 10px; border-radius: 50%; background: #10B981; display: inline-block; flex-shrink: 0; }
    .eq-bars { display: inline-flex; align-items: flex-end; gap: 3px; height: 16px; margin-left: 4px; }
    .eq-bars i { width: 3.5px; height: 16px; border-radius: 2px; background: #38bdf8; display: block; transform-origin: bottom center; }
    .scene-counter {
      padding: 9px 15px; border-radius: 999px;
      background: rgba(8, 12, 24, 0.88); border: 1.5px solid rgba(255,255,255,0.22);
      font-family: "Space Mono", monospace; font-size: ${LAYOUT.font.hudPillPx}px; font-weight: 700; color: #38bdf8; flex-shrink: 0;
    }`;

  const scenesJson = JSON.stringify(scenes.map((s, idx) => ({ start: s.startSec, end: s.endSec, label: String(idx + 1).padStart(2, '0') })));
  const scriptBody = `
    const scCur = document.getElementById("sc-cur");
    const eqBars = [0, 1, 2, 3].map((i) => document.getElementById("eq-" + i));
    const sceneSpans = ${scenesJson};
    tl.eventCallback("onUpdate", () => {
      const t = tl.time();
      if (scCur) {
        let active = "01";
        for (let i = 0; i < sceneSpans.length; i++) if (t >= sceneSpans[i].start - 0.01) active = sceneSpans[i].label;
        if (scCur.textContent !== active) scCur.textContent = active;
      }
      for (let b = 0; b < eqBars.length; b++) {
        if (eqBars[b]) eqBars[b].style.transform = "scaleY(" + (0.28 + 0.72 * Math.abs(Math.sin(t * (5.6 + b * 1.85) + b * 1.15))).toFixed(2) + ")";
      }
    });
    ${scenes.map((s, idx) => `gsap.set("#sb-${idx}", { scaleX: 0 }); tl.fromTo("#sb-${idx}", { scaleX: 0 }, { scaleX: 1, duration: ${s.durationSec.toFixed(3)}, ease: "none" }, ${s.startSec.toFixed(3)});`).join('\n')}`;

  return wrapSubComp({ compId: 'hud_chrome', dur, fps, htmlBody, styles, scriptBody });
}

function generateTransitionsHtml(timelineData) {
  const dur = timelineData.totalDurationSec;
  const fps = timelineData.fps;
  const scenes = timelineData.scenes;
  const htmlParts = [];
  const jsParts = [];

  for (let i = 1; i < scenes.length; i++) {
    const cutT = scenes[i].startSec;
    const acc = scenes[i].accent || '#00D4FF';
    const tid = `tr-${i}`;
    const kind = (i - 1) % 4;
    if (kind === 0) {
      htmlParts.push(`<div id="${tid}" class="tr-whip" data-layout-allow-overflow style="background:linear-gradient(90deg, transparent, ${acc}cc, #ffffffdd, ${acc}cc, transparent);"></div>`);
      jsParts.push(`tl.fromTo("#${tid}", { opacity: 0, x: -1200 }, { opacity: 0.92, x: 0, duration: 0.16, ease: "power3.in" }, ${(cutT - 0.16).toFixed(3)});
                    tl.to("#${tid}", { opacity: 0, x: 1200, duration: 0.22, ease: "power3.out" }, ${(cutT + 0.01).toFixed(3)});`);
    } else if (kind === 1) {
      htmlParts.push(`<div id="${tid}" class="tr-ring" data-layout-allow-overflow style="border-color:${acc};"></div>`);
      jsParts.push(`tl.fromTo("#${tid}", { opacity: 0, scale: 0.15 }, { opacity: 0.95, scale: 1.5, duration: 0.20, ease: "expo.out" }, ${(cutT - 0.08).toFixed(3)});
                    tl.to("#${tid}", { opacity: 0, scale: 1.9, duration: 0.16, ease: "power2.in" }, ${(cutT + 0.14).toFixed(3)});`);
    } else if (kind === 2) {
      htmlParts.push(`<div id="${tid}" class="tr-slice" data-layout-allow-overflow style="background:linear-gradient(115deg, transparent 35%, ${acc}bb 48%, #ffffff 50%, ${acc}bb 52%, transparent 65%);"></div>`);
      jsParts.push(`tl.fromTo("#${tid}", { opacity: 0, x: -900, y: -400 }, { opacity: 0.9, x: 900, y: 400, duration: 0.36, ease: "power2.inOut" }, ${(cutT - 0.14).toFixed(3)});
                    tl.set("#${tid}", { opacity: 0 }, ${(cutT + 0.24).toFixed(3)});`);
    } else {
      htmlParts.push(`<div id="${tid}" class="tr-bloom" data-layout-allow-overflow style="background:radial-gradient(circle at 50% 50%, ${acc}66 0%, rgba(255,255,255,0.22) 35%, transparent 72%);"></div>`);
      jsParts.push(`tl.fromTo("#${tid}", { opacity: 0, scale: 0.7 }, { opacity: 0.95, scale: 1.35, duration: 0.17, ease: "power2.out" }, ${(cutT - 0.12).toFixed(3)});
                    tl.to("#${tid}", { opacity: 0, scale: 1.8, duration: 0.22, ease: "power3.in" }, ${(cutT + 0.06).toFixed(3)});`);
    }
  }

  const styles = `
    .tr-whip { position: absolute; left: 0; top: 0; width: 1080px; height: 1920px; opacity: 0; pointer-events: none; }
    .tr-ring { position: absolute; left: 190px; top: 610px; width: 700px; height: 700px; border-radius: 50%; border: 18px solid; opacity: 0; pointer-events: none; }
    .tr-slice { position: absolute; left: -300px; top: -300px; width: 1680px; height: 2520px; opacity: 0; pointer-events: none; }
    .tr-bloom { position: absolute; inset: 0; opacity: 0; pointer-events: none; }`;

  return wrapSubComp({ compId: 'transitions', dur, fps, htmlBody: htmlParts.join('\n'), styles, scriptBody: jsParts.join('\n') });
}

function buildCaptionGroups(scenes) {
  const groups = [];
  for (const sc of scenes) {
    const words = sc.wordTimings || [];
    if (!words.length) continue;
    let cur = [];
    for (let wi = 0; wi < words.length; wi++) {
      const w = words[wi];
      const next = words[wi + 1];
      cur.push(w);
      const hasPunct = /[.,!?]$/.test(w.text);
      const pause = next ? next.start - w.end : 0;
      const charCount = cur.reduce((a, b) => a + b.text.length, 0);
      if (cur.length >= LAYOUT.captions.maxWordsPerGroup || charCount > LAYOUT.captions.maxCharsPerLine || hasPunct || pause > 0.24 || !next) {
        groups.push({
          y: LAYOUT.captions.topY,
          acc: sc.accent || '#00D4FF',
          s: Number(Math.max(sc.startSec + 0.08, cur[0].globalStart).toFixed(3)),
          e: Number(Math.min(sc.endSec - 0.12, cur[cur.length - 1].globalEnd + 0.18).toFixed(3)),
          w: cur.map((cw) => ({ t: cw.text, s: Number(Math.max(sc.startSec + 0.08, cw.globalStart).toFixed(3)) }))
        });
        cur = [];
      }
    }
  }
  return groups;
}

function generateCaptionsHtml(timelineData) {
  const dur = timelineData.totalDurationSec;
  const fps = timelineData.fps;
  const groups = buildCaptionGroups(timelineData.scenes);
  const htmlBody = `<div id="cap-layer" class="cap-layer"></div>`;
  const styles = `
    .cap-layer { position: absolute; inset: 0; pointer-events: none; overflow: visible; }
    .cap-group { position: absolute; left: ${LAYOUT.captions.leftPx}px; width: ${LAYOUT.captions.widthPx}px; display: flex; justify-content: flex-start; pointer-events: none; overflow: visible; opacity: 0; visibility: hidden; }
    .cap-pill { display: inline-flex; flex-wrap: wrap; column-gap: 18px; row-gap: 8px; align-items: center; padding: 11px 22px; border-radius: 16px; background: rgba(6, 10, 20, 0.90); border: 1.5px solid; box-shadow: 0 10px 28px rgba(0,0,0,0.52); overflow: visible; }
    .cap-w { font-family: "NirmalaKannada", "Inter", sans-serif; font-weight: 700; font-size: ${LAYOUT.font.captionPx}px; line-height: 1.32; letter-spacing: 0.015em; color: #cbd5e1; display: inline-block; padding: 0 2px; border-bottom: 3px solid transparent; }`;
  const scriptBody = `
    const GROUPS = ${JSON.stringify(groups)};
    const layer = document.getElementById("cap-layer");
    GROUPS.forEach((g, idx) => {
      const grp = document.createElement("div");
      grp.className = "cap-group";
      grp.style.top = g.y + "px";
      const pill = document.createElement("div");
      pill.className = "cap-pill";
      pill.style.borderColor = g.acc + "88";
      const wordEls = g.w.map((word) => {
        const sp = document.createElement("span");
        sp.className = "cap-w";
        sp.textContent = word.t;
        pill.appendChild(sp);
        return { el: sp, s: word.s };
      });
      grp.appendChild(pill);
      layer.appendChild(grp);
      const next = GROUPS[idx + 1];
      const visEnd = Math.max(g.s + 0.16, next ? Math.min(g.e, next.s - 0.02) : g.e);
      tl.set(grp, { visibility: "visible" }, g.s);
      tl.fromTo(grp, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.12, ease: "power2.out" }, g.s);
      wordEls.forEach((we) => tl.to(we.el, { color: "#ffffff", borderBottomColor: g.acc, y: -2, textShadow: "0 0 16px " + g.acc, duration: 0.10, ease: "power1.out" }, we.s));
      tl.to(grp, { opacity: 0, duration: 0.10, ease: "power2.in" }, Math.max(g.s + 0.04, visEnd - 0.10));
      tl.set(grp, { opacity: 0, visibility: "hidden" }, visEnd);
    });`;
  return wrapSubComp({ compId: 'captions', dur, fps, htmlBody, styles, scriptBody });
}

function generateRootHtml(timelineData, { transparentOverlay = false } = {}) {
  const dur = timelineData.totalDurationSec;
  const fps = timelineData.fps;
  const scenes = timelineData.scenes;
  const sfxCues = transparentOverlay ? [] : buildSfxSchedule(timelineData);
  const bgCss = transparentOverlay ? 'background: transparent;' : 'background: #060913;';
  const compId = transparentOverlay ? 'hud-overlay-master' : 'main';

  const videoMarkup = transparentOverlay
    ? ''
    : scenes
        .map(
          (s, idx) => `
      <div id="cam-wrap-${idx}" class="cam-wrap" data-layout-allow-overflow>
        <video id="vid-${idx}" class="clip bg-vid" src="${s.hfVideoRelPath}" muted playsinline data-start="${s.startSec.toFixed(3)}" data-duration="${s.durationSec.toFixed(3)}" data-track-index="0"></video>
      </div>`
        )
        .join('\n');

  const audioMarkup =
    transparentOverlay || !timelineData.hfAudioRelPath
      ? ''
      : `
      <audio id="vo-master" class="clip" src="${timelineData.hfAudioRelPath}" data-start="0" data-duration="${dur.toFixed(3)}" data-volume="1" data-track-index="4"></audio>
      ${sfxCues.map((c) => `<audio id="${c.id}" class="clip" src="${c.src}" data-start="${c.start.toFixed(3)}" data-duration="${c.dur.toFixed(3)}" data-volume="${c.vol}" data-track-index="${c.track}"></audio>`).join('\n')}`;

  const camTweens = transparentOverlay
    ? ''
    : scenes
        .map((s, idx) => {
          const st = s.startSec;
          const d = s.durationSec;
          if (idx === 0) {
            return `tl.fromTo("#cam-wrap-0", { scale: 1.0, y: 0 }, { scale: 1.025, y: -8, duration: ${(d * 0.85).toFixed(3)}, ease: "power2.inOut" }, 0.15);`;
          }
          return `
          tl.fromTo("#cam-wrap-${idx}", { scale: 1.0, x: 0, y: 0 }, { scale: 1.025, x: ${idx % 2 === 0 ? -5 : 5}, y: -6, duration: ${(Math.min(7.5, d * 0.5)).toFixed(3)}, ease: "power2.inOut" }, ${(st + 0.35).toFixed(3)});
          tl.to("#cam-wrap-${idx}", { scale: 1.0, x: 0, y: 0, duration: ${(Math.min(5.0, d * 0.32)).toFixed(3)}, ease: "power2.inOut" }, ${(st + d * 0.62).toFixed(3)});`;
        })
        .join('\n');

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>${escHtml(timelineData.project_title)}</title>
  <script src="assets/vendor/gsap.min.js"></script>
  <script src="assets/vendor/CustomEase.min.js"></script>
  <script src="assets/vendor/MotionPathPlugin.min.js"></script>
  <style>
    ${getBaseStyles('assets')}
    html, body { width: ${LAYOUT.canvas.width}px; height: ${LAYOUT.canvas.height}px; margin: 0; overflow: hidden; ${bgCss} }
    #root { position: relative; width: ${LAYOUT.canvas.width}px; height: ${LAYOUT.canvas.height}px; overflow: hidden; ${bgCss} }
    .cam-wrap { position: absolute; inset: 0; overflow: hidden; }
    video.bg-vid { position: absolute; left: 0; top: 0; width: ${LAYOUT.canvas.width}px; height: ${LAYOUT.canvas.height}px; object-fit: cover; }
    .comp-layer { position: absolute; inset: 0; pointer-events: none; }
    ${!transparentOverlay ? `.bg-grid-stage {
      position: absolute; inset: 0;
      background:
        radial-gradient(circle at 20% 20%, rgba(0,212,255,0.12), transparent 50%),
        radial-gradient(circle at 80% 80%, rgba(99,102,241,0.14), transparent 55%),
        repeating-linear-gradient(0deg, rgba(255,255,255,0.03) 0 1px, transparent 1px 60px),
        repeating-linear-gradient(90deg, rgba(255,255,255,0.03) 0 1px, transparent 1px 60px);
    }` : ''}
  </style>
</head>
<body>
  <div id="root" data-composition-id="${compId}" data-start="0" data-duration="${dur.toFixed(3)}" data-fps="${fps}" data-width="${LAYOUT.canvas.width}" data-height="${LAYOUT.canvas.height}">
    ${transparentOverlay
      ? `<div id="ov-drv" class="clip" data-start="0" data-duration="${dur.toFixed(3)}" data-track-index="0" style="position:absolute;width:1px;height:1px;opacity:0;pointer-events:none"></div>`
      : '<div class="bg-grid-stage" data-layout-ignore></div>'}
    ${videoMarkup}
    ${scenes.map((s) => `<div id="${s.id}" class="comp-layer" data-composition-id="${s.id}" data-composition-src="compositions/${s.id}.html" data-start="${s.startSec.toFixed(3)}" data-duration="${s.durationSec.toFixed(3)}" data-track-index="1" data-width="${LAYOUT.canvas.width}" data-height="${LAYOUT.canvas.height}"></div>`).join('\n')}
    <div id="transitions" class="comp-layer" data-composition-id="transitions" data-composition-src="compositions/transitions.html" data-start="0" data-duration="${dur.toFixed(3)}" data-track-index="2" data-width="${LAYOUT.canvas.width}" data-height="${LAYOUT.canvas.height}"></div>
    <div id="hud_chrome" class="comp-layer" data-composition-id="hud_chrome" data-composition-src="compositions/hud_chrome.html" data-start="0" data-duration="${dur.toFixed(3)}" data-track-index="2" data-width="${LAYOUT.canvas.width}" data-height="${LAYOUT.canvas.height}"></div>
    <div id="captions" class="comp-layer" data-track-kind="captions" data-composition-id="captions" data-composition-src="compositions/captions.html" data-start="0" data-duration="${dur.toFixed(3)}" data-track-index="3" data-width="${LAYOUT.canvas.width}" data-height="${LAYOUT.canvas.height}"></div>
    ${audioMarkup}
    <script>
      window.__timelines = window.__timelines || {};
      if (window.gsap && window.CustomEase) gsap.registerPlugin(CustomEase);
      if (window.gsap && window.MotionPathPlugin) gsap.registerPlugin(MotionPathPlugin);
      const tl = gsap.timeline({ paused: true });
      ${camTweens}
      tl.set({}, {}, ${dur.toFixed(3)});
      window.__timelines["${compId}"] = tl;
    </script>
  </div>
</body>
</html>`;
}

module.exports = {
  generateSceneCompositionHtml,
  generateHudChromeHtml,
  generateTransitionsHtml,
  generateCaptionsHtml,
  generateRootHtml
};
