/**
 * core/widgets.js
 * Clean modular library of all 12 HyperFrames + GSAP 3.15 property widgets.
 * All card positions and size bounds strictly follow LAYOUT (core/layout_spec.js).
 */

const { LAYOUT, escHtml } = require('./layout_spec');

function renderBeatWidget({ beat, bIdx, sceneIndex, dur, acc, acc2, brandMeta }) {
  const bid = `s${sceneIndex}-b${bIdx}`;
  const bStart = Math.max(bIdx === 0 ? 0.0 : 0.25, beat.startSec);
  const bEnd = Math.min(dur, beat.endSec);
  const bDur = Math.max(1.0, bEnd - bStart);
  const isTop = (beat.glide_to || 'bottom') === 'top';
  const slotTop = isTop ? LAYOUT.card.topBandY : LAYOUT.card.bottomBandY;
  const tallTop = isTop ? LAYOUT.card.topTallBandY : LAYOUT.card.bottomTallBandY;
  const cardLeft = LAYOUT.card.leftPx;
  const cardW = LAYOUT.card.widthPx;
  const exitDur = LAYOUT.timing.exitAnimSec;
  const isLastInScene = beat._isLastInScene;
  const shouldHoldToEnd =
    Boolean(beat.hold) ||
    (beat.widget === 'follow_cta' && beat.hold !== false && dur - bEnd <= 0.35 && bDur <= 10.5);
  const exitAt = Math.max(bStart + 0.85, bEnd - exitDur);
  const shouldExit = !shouldHoldToEnd || !isLastInScene;
  const wType = beat.widget || 'highlight_pill';

  if (wType === 'hero_title') {
    const words = String(beat.value || '').split(/\s+/).filter(Boolean);
    const isOpening = sceneIndex === 0;
    const tIn = isOpening ? 0.0 : bStart;
    return {
      html: `
        <div id="${bid}" class="hero-stage" style="top:${slotTop}px;">
          <div class="hero-pin" id="${bid}-pin" data-layout-ignore>
            <span class="dot"></span>
            <span>${escHtml(beat.badge || 'LIVE SITE TOUR')}</span>
          </div>
          <h1 class="hero-words" id="${bid}-words">
            ${words.map((w, wi) => `<span class="hw" id="${bid}-w${wi}">${escHtml(w)}</span>`).join(' ')}
          </h1>
          <div class="hero-bar-wrap"><div class="hero-bar" id="${bid}-bar"></div></div>
          <div class="hero-sub" id="${bid}-sub">${escHtml(beat.sub || '')}</div>
        </div>`,
      css: `
        #${bid} {
          position: absolute; left: ${cardLeft}px; width: ${cardW}px; pointer-events: none; opacity: 0;
          padding: 20px 28px; border-radius: ${LAYOUT.card.borderRadiusPx}px;
          background: linear-gradient(135deg, rgba(8,12,24,0.90), rgba(14,22,42,0.86));
          border: 2px solid ${acc}88; box-shadow: 0 24px 56px rgba(0,0,0,0.58);
        }
        #${bid} .hero-pin {
          display: inline-flex; align-items: center; gap: 10px; padding: 6px 14px; border-radius: 999px;
          background: ${acc}24; border: 1.5px solid ${acc};
          font-family: "Space Mono", monospace; font-size: 20px; font-weight: 700; letter-spacing: 0.1em; color: #ffffff; margin-bottom: 10px;
        }
        #${bid} .hero-pin .dot { width: 10px; height: 10px; border-radius: 50%; background: ${acc}; display: inline-block; }
        #${bid} .hero-words { font-family: "Montserrat", "Outfit", sans-serif; font-weight: 900; font-size: ${LAYOUT.font.heroDisplayPx}px; line-height: 1.06; letter-spacing: -0.02em; color: #ffffff; overflow: visible; }
        #${bid} .hw { display: inline-block; }
        #${bid} .hero-bar-wrap { margin: 10px 0 9px; width: 100%; height: 4px; background: rgba(255,255,255,0.16); border-radius: 4px; overflow: hidden; }
        #${bid} .hero-bar { width: 100%; height: 100%; background: linear-gradient(90deg, ${acc}, ${acc2}); transform-origin: left center; }
        #${bid} .hero-sub { font-size: ${LAYOUT.font.bodySubPx}px; font-weight: 600; color: #e2e8f0; letter-spacing: 0.015em; line-height: 1.22; }`,
      js: `
        ${isOpening
          ? `tl.fromTo("#${bid}", { opacity: 0.92, y: 12, scale: 0.98 }, { opacity: 1, y: 0, scale: 1, duration: 0.30, ease: "expo.out" }, 0.0);`
          : `tl.fromTo("#${bid}", { opacity: 0, y: 36, scale: 0.96 }, { opacity: 1, y: 0, scale: 1, duration: 0.42, ease: "expo.out" }, ${tIn.toFixed(3)});`}
        ${words.map((_, wi) => `tl.fromTo("#${bid}-w${wi}", { opacity: ${isOpening ? 0.85 : 0}, filter: "blur(${isOpening ? 2 : 8}px)", y: ${isOpening ? 4 : 12} }, { opacity: 1, filter: "blur(0px)", y: 0, duration: 0.22, ease: "power4.out" }, ${(tIn + (isOpening ? 0.02 : 0.05) + wi * 0.075).toFixed(3)});`).join('')}
        tl.fromTo("#${bid}-bar", { scaleX: ${isOpening ? 0.35 : 0} }, { scaleX: 1, duration: 0.50, ease: "power3.out" }, ${(tIn + (isOpening ? 0.05 : 0.14)).toFixed(3)});
        tl.fromTo("#${bid}-sub", { opacity: ${isOpening ? 0.8 : 0}, y: ${isOpening ? 4 : 8} }, { opacity: 1, y: 0, duration: 0.35, ease: "power3.out" }, ${(tIn + (isOpening ? 0.08 : 0.24)).toFixed(3)});
        ${shouldExit ? `tl.to("#${bid}", { opacity: 0, y: 18, duration: ${exitDur}, ease: "power3.in" }, ${exitAt.toFixed(3)});` : ''}`
    };
  }

  if (wType === 'route_tracker') {
    const targetVal = Number(beat.count_to || 500);
    const dec = Number(beat.count_decimals || 0);
    const suffix = beat.count_suffix || 'M';
    return {
      html: `
        <div id="${bid}" class="route-box" style="top:${slotTop}px;">
          <div class="route-top">
            <span class="eyebrow" data-layout-ignore style="border:1.5px solid ${acc};">${escHtml(beat.badge || 'PROXIMITY')}</span>
            <span class="route-eta" data-layout-ignore>${escHtml(beat.sub || 'QUICK DRIVE')}</span>
          </div>
          <div class="route-val"><span id="${bid}-num" class="num">0</span><span>${escHtml(suffix)}</span></div>
          <svg class="route-svg" viewBox="0 0 820 74" data-layout-ignore>
            <path d="M 32 48 Q 260 8 410 38 T 788 26" fill="none" stroke="rgba(255,255,255,0.22)" stroke-width="6" stroke-dasharray="10 10" stroke-linecap="round"/>
            <path id="${bid}-path" d="M 32 48 Q 260 8 410 38 T 788 26" fill="none" stroke="${acc}" stroke-width="7" stroke-linecap="round" pathLength="100" stroke-dasharray="100 120" stroke-dashoffset="110"/>
            <circle cx="32" cy="48" r="10" fill="#ffffff" stroke="${acc}" stroke-width="5"/>
            <circle cx="788" cy="26" r="11" fill="${acc2}" stroke="#ffffff" stroke-width="4"/>
            <circle id="${bid}-pin" cx="32" cy="48" r="13" fill="#ffffff" stroke="${acc}" stroke-width="5"/>
          </svg>
          <div class="route-labels" data-layout-ignore>
            <span>${escHtml(beat.route_start || 'YOUR PLOT')}</span>
            <span>${escHtml(beat.route_end || 'MAIN HIGHWAY')}</span>
          </div>
        </div>`,
      css: `
        #${bid} {
          position: absolute; left: ${cardLeft}px; width: ${cardW}px; padding: ${LAYOUT.card.paddingY}px ${LAYOUT.card.paddingX}px; border-radius: ${LAYOUT.card.borderRadiusPx}px; opacity: 0;
          background: rgba(8, 12, 24, 0.90); border: 2px solid ${acc}99;
          box-shadow: 0 22px 54px rgba(0,0,0,0.58); pointer-events: none;
        }
        #${bid} .route-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
        #${bid} .route-eta { font-family: "Space Mono", monospace; font-size: 20px; font-weight: 700; color: #38bdf8; }
        #${bid} .route-val { font-family: "Montserrat", sans-serif; font-weight: 900; font-size: 54px; line-height: 1.04; color: #ffffff; margin-bottom: 4px; }
        #${bid} .route-svg { width: 100%; height: 64px; overflow: visible; }
        #${bid} .route-labels { display: flex; justify-content: space-between; font-size: 22px; font-weight: 800; letter-spacing: 0.06em; color: #e2e8f0; margin-top: 2px; }`,
      js: `
        (function() {
          const obj = { v: ${Number(beat.count_from || 0)} };
          const numEl = document.getElementById("${bid}-num");
          tl.fromTo("#${bid}", { opacity: 0, y: ${isTop ? -28 : 28}, scale: 0.94 }, { opacity: 1, y: 0, scale: 1, duration: 0.38, ease: "expo.out" }, ${bStart.toFixed(3)});
          tl.fromTo("#${bid}-path", { strokeDashoffset: 110 }, { strokeDashoffset: 0, duration: ${(Math.min(1.4, bDur * 0.45)).toFixed(3)}, ease: "power2.inOut" }, ${(bStart + 0.12).toFixed(3)});
          tl.to("#${bid}-pin", {
            motionPath: { path: "#${bid}-path", align: "#${bid}-path", alignOrigin: [0.5, 0.5] },
            duration: ${(Math.min(1.4, bDur * 0.45)).toFixed(3)}, ease: "power2.inOut"
          }, ${(bStart + 0.12).toFixed(3)});
          tl.to(obj, {
            v: ${targetVal}, duration: ${(Math.min(1.3, bDur * 0.42)).toFixed(3)}, ease: "power3.out",
            onUpdate: () => { if (numEl) numEl.textContent = ${dec > 0 ? `obj.v.toFixed(${dec})` : 'Math.round(obj.v).toLocaleString()'}; }
          }, ${(bStart + 0.10).toFixed(3)});
          ${shouldExit ? `tl.to("#${bid}", { opacity: 0, y: ${isTop ? -20 : 20}, duration: ${exitDur}, ease: "power3.in" }, ${exitAt.toFixed(3)});` : ''}
        })();`
    };
  }

  if (wType === 'growth_curve') {
    return {
      html: `
        <div id="${bid}" class="growth-card" style="top:${slotTop}px;">
          <div class="gc-head">
            <div>
              <div class="eyebrow" data-layout-ignore style="border:1.5px solid ${acc}; margin-bottom:10px;">${escHtml(beat.badge || 'APPRECIATION')}</div>
              <div class="gc-title">${escHtml(beat.value || 'HIGH GROWTH ZONE')}</div>
              <div class="gc-sub">${escHtml(beat.sub || '')}</div>
            </div>
            <div class="gc-tag" data-layout-ignore id="${bid}-tag">${escHtml(beat.growth_tag || 'GROWTH')}</div>
          </div>
          <svg class="gc-svg" viewBox="0 0 800 120" data-layout-ignore>
            <defs><linearGradient id="${bid}-gfill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="${acc}" stop-opacity="0.38"/><stop offset="100%" stop-color="${acc}" stop-opacity="0"/></linearGradient></defs>
            <line x1="20" y1="100" x2="780" y2="100" stroke="rgba(255,255,255,0.20)" stroke-width="2" stroke-dasharray="6 6"/>
            <path id="${bid}-area" d="M 30 96 C 180 94, 300 72, 460 44 C 580 22, 690 14, 770 10 L 770 100 L 30 100 Z" fill="url(#${bid}-gfill)" opacity="0"/>
            <path id="${bid}-curve" d="M 30 96 C 180 94, 300 72, 460 44 C 580 22, 690 14, 770 10" fill="none" stroke="${acc}" stroke-width="8" stroke-linecap="round" pathLength="100" stroke-dasharray="100 120" stroke-dashoffset="110"/>
            <circle id="${bid}-pt1" cx="30" cy="96" r="9" fill="#ffffff" stroke="${acc}" stroke-width="4" opacity="0"/>
            <circle id="${bid}-pt2" cx="460" cy="44" r="9" fill="#ffffff" stroke="${acc}" stroke-width="4" opacity="0"/>
            <circle id="${bid}-pt3" cx="770" cy="10" r="12" fill="${acc2}" stroke="#ffffff" stroke-width="4" opacity="0"/>
          </svg>
        </div>`,
      css: `
        #${bid} {
          position: absolute; left: ${cardLeft}px; width: ${cardW}px; padding: ${LAYOUT.card.paddingY}px ${LAYOUT.card.paddingX}px; border-radius: ${LAYOUT.card.borderRadiusPx}px; opacity: 0;
          background: rgba(8, 12, 24, 0.90); border: 2px solid ${acc}99;
          box-shadow: 0 22px 54px rgba(0,0,0,0.58); pointer-events: none;
        }
        #${bid} .gc-head { display: flex; justify-content: space-between; align-items: flex-start; gap: 14px; margin-bottom: 10px; }
        #${bid} .gc-title { font-family: "Montserrat", sans-serif; font-weight: 900; font-size: 42px; line-height: 1.06; color: #ffffff; }
        #${bid} .gc-sub { font-size: ${LAYOUT.font.bodySubPx}px; font-weight: 600; color: #cbd5e1; margin-top: 4px; }
        #${bid} .gc-tag { padding: 8px 16px; border-radius: 14px; font-family: "Space Mono", monospace; font-weight: 700; font-size: 20px; color: #090d16; background: linear-gradient(135deg, ${acc}, #ffffff); white-space: nowrap; }
        #${bid} .gc-svg { width: 100%; height: 96px; overflow: visible; }`,
      js: `
        tl.fromTo("#${bid}", { opacity: 0, y: 34, scale: 0.94 }, { opacity: 1, y: 0, scale: 1, duration: 0.40, ease: "expo.out" }, ${bStart.toFixed(3)});
        tl.fromTo("#${bid}-curve", { strokeDashoffset: 110 }, { strokeDashoffset: 0, duration: 1.15, ease: "power2.inOut" }, ${(bStart + 0.16).toFixed(3)});
        tl.fromTo("#${bid}-area", { opacity: 0 }, { opacity: 1, duration: 0.85, ease: "power2.out" }, ${(bStart + 0.45).toFixed(3)});
        tl.fromTo("#${bid}-pt1", { opacity: 0, scale: 0 }, { opacity: 1, scale: 1, duration: 0.22, ease: "back.out(1.6)" }, ${(bStart + 0.18).toFixed(3)});
        tl.fromTo("#${bid}-pt2", { opacity: 0, scale: 0 }, { opacity: 1, scale: 1, duration: 0.22, ease: "back.out(1.6)" }, ${(bStart + 0.72).toFixed(3)});
        tl.fromTo("#${bid}-pt3", { opacity: 0, scale: 0 }, { opacity: 1, scale: 1, duration: 0.26, ease: "back.out(1.8)" }, ${(bStart + 1.18).toFixed(3)});
        tl.fromTo("#${bid}-tag", { opacity: 0, scale: 0.8 }, { opacity: 1, scale: 1, duration: 0.35, ease: "back.out(1.6)" }, ${(bStart + 1.10).toFixed(3)});
        ${shouldExit ? `tl.to("#${bid}", { opacity: 0, y: 20, duration: ${exitDur}, ease: "power3.in" }, ${exitAt.toFixed(3)});` : ''}`
    };
  }

  if (wType === 'dual_metric') {
    return {
      html: `
        <div id="${bid}" class="dual-stage" style="top:${slotTop}px;">
          <div class="dual-badge"><span class="eyebrow" data-layout-ignore style="border:1.5px solid ${acc};">${escHtml(beat.badge || 'KEY HIGHLIGHTS')}</span></div>
          <div class="dual-grid">
            <div class="dual-wing" id="${bid}-left" style="border-color:${acc};">
              <div class="dw-k" data-layout-ignore>${escHtml(beat.left_label || '')}</div>
              <div class="dw-v">${escHtml(beat.left_value || '')}</div>
            </div>
            <div class="dual-wing" id="${bid}-right" style="border-color:${acc2};">
              <div class="dw-k" data-layout-ignore>${escHtml(beat.right_label || '')}</div>
              <div class="dw-v">${escHtml(beat.right_value || '')}</div>
            </div>
          </div>
        </div>`,
      css: `
        #${bid} { position: absolute; left: ${cardLeft}px; width: ${cardW}px; pointer-events: none; opacity: 0; }
        #${bid} .dual-badge { margin-bottom: 10px; }
        #${bid} .dual-grid { display: flex; gap: 18px; width: 100%; }
        #${bid} .dual-wing { flex: 1; padding: 18px 22px; border-radius: 22px; background: rgba(8, 12, 24, 0.90); border: 2px solid; box-shadow: 0 20px 48px rgba(0,0,0,0.55); }
        #${bid} .dw-k { font-family: "Space Mono", monospace; font-size: 20px; font-weight: 700; color: #94a3b8; letter-spacing: 0.08em; margin-bottom: 6px; }
        #${bid} .dw-v { font-family: "Montserrat", sans-serif; font-size: 40px; font-weight: 900; color: #ffffff; line-height: 1.05; }`,
      js: `
        tl.fromTo("#${bid}", { opacity: 0 }, { opacity: 1, duration: 0.14 }, ${bStart.toFixed(3)});
        tl.fromTo("#${bid}-left", { opacity: 0, x: -70, filter: "blur(6px)" }, { opacity: 1, x: 0, filter: "blur(0px)", duration: 0.42, ease: "expo.out" }, ${bStart.toFixed(3)});
        tl.fromTo("#${bid}-right", { opacity: 0, x: 70, filter: "blur(6px)" }, { opacity: 1, x: 0, filter: "blur(0px)", duration: 0.42, ease: "expo.out" }, ${(bStart + 0.16).toFixed(3)});
        ${shouldExit ? `tl.to("#${bid}", { opacity: 0, scale: 0.96, duration: ${exitDur}, ease: "power3.in" }, ${exitAt.toFixed(3)});` : ''}`
    };
  }

  if (wType === 'blueprint_draw') {
    const areaTo = Number(beat.count_to || 1200);
    return {
      html: `
        <div id="${bid}" class="bp-card" style="top:${tallTop}px;">
          <div class="bp-head">
            <span class="eyebrow" data-layout-ignore style="border:1.5px solid ${acc};">${escHtml(beat.badge || 'PLOT DIMENSIONS')}</span>
            <span class="bp-dims" data-layout-ignore>${escHtml(beat.width_label || '30 FT')} × ${escHtml(beat.depth_label || '40 FT')}</span>
          </div>
          <div class="bp-body">
            <svg class="bp-rect-svg" viewBox="0 0 260 210" data-layout-ignore>
              <defs><pattern id="${bid}-grid" width="20" height="20" patternUnits="userSpaceOnUse"><path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(255,255,255,0.14)" stroke-width="1"/></pattern></defs>
              <rect x="44" y="18" width="188" height="146" fill="url(#${bid}-grid)" rx="6"/>
              <rect id="${bid}-fill" x="44" y="18" width="188" height="146" fill="${acc}" opacity="0" rx="6"/>
              <rect id="${bid}-stroke" x="44" y="18" width="188" height="146" fill="none" stroke="${acc}" stroke-width="5" rx="6" pathLength="100" stroke-dasharray="100 120" stroke-dashoffset="110"/>
              <circle id="${bid}-c1" cx="44" cy="18" r="6" fill="#ffffff" stroke="${acc}" stroke-width="3" opacity="0"/>
              <circle id="${bid}-c2" cx="232" cy="18" r="6" fill="#ffffff" stroke="${acc}" stroke-width="3" opacity="0"/>
              <circle id="${bid}-c3" cx="232" cy="164" r="6" fill="#ffffff" stroke="${acc}" stroke-width="3" opacity="0"/>
              <circle id="${bid}-c4" cx="44" cy="164" r="6" fill="#ffffff" stroke="${acc}" stroke-width="3" opacity="0"/>
              <text x="138" y="192" text-anchor="middle" fill="#ffffff" font-family="Space Mono, monospace" font-size="22" font-weight="700">${escHtml(beat.width_label || '30 FT')}</text>
              <text x="22" y="94" text-anchor="middle" fill="${acc2}" font-family="Space Mono, monospace" font-size="20" font-weight="700" transform="rotate(-90 22 94)">${escHtml(beat.depth_label || '40 FT')}</text>
            </svg>
            <div class="bp-stats">
              <div class="bp-big"><span id="${bid}-area" class="num">0</span><span class="bp-unit">${escHtml(beat.count_suffix || ' SQ.FT')}</span></div>
              <div class="bp-sub">${escHtml(beat.sub || '')}</div>
            </div>
          </div>
        </div>`,
      css: `
        #${bid} {
          position: absolute; left: ${cardLeft}px; width: ${cardW}px; padding: ${LAYOUT.card.paddingY}px 24px; border-radius: ${LAYOUT.card.borderRadiusPx}px; opacity: 0;
          background: rgba(8, 12, 24, 0.91); border: 2px solid ${acc};
          box-shadow: 0 22px 54px rgba(0,0,0,0.62); pointer-events: none;
        }
        #${bid} .bp-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
        #${bid} .bp-dims { font-family: "Space Mono", monospace; font-size: 22px; font-weight: 700; color: ${acc}; }
        #${bid} .bp-body { display: flex; align-items: center; gap: 18px; }
        #${bid} .bp-rect-svg { width: 205px; height: 165px; flex-shrink: 0; }
        #${bid} .bp-big { font-family: "Montserrat", sans-serif; font-weight: 900; font-size: 62px; color: #ffffff; line-height: 1.0; }
        #${bid} .bp-unit { font-size: 30px; color: ${acc}; font-weight: 800; }
        #${bid} .bp-sub { font-size: ${LAYOUT.font.bodySubPx}px; font-weight: 600; color: #cbd5e1; margin-top: 8px; line-height: 1.22; }`,
      js: `
        (function() {
          const obj = { a: ${Number(beat.count_from || 0)} };
          const areaEl = document.getElementById("${bid}-area");
          tl.fromTo("#${bid}", { opacity: 0, y: 34, scale: 0.94 }, { opacity: 1, y: 0, scale: 1, duration: 0.40, ease: "expo.out" }, ${bStart.toFixed(3)});
          tl.fromTo("#${bid}-stroke", { strokeDashoffset: 110 }, { strokeDashoffset: 0, duration: 1.25, ease: "power2.inOut" }, ${(bStart + 0.14).toFixed(3)});
          tl.fromTo("#${bid}-fill", { opacity: 0 }, { opacity: 0.18, duration: 0.85, ease: "power2.out" }, ${(bStart + 0.55).toFixed(3)});
          tl.fromTo(["#${bid}-c1","#${bid}-c2","#${bid}-c3","#${bid}-c4"], { opacity: 0, scale: 0 }, { opacity: 1, scale: 1, duration: 0.25, stagger: 0.14, ease: "back.out(1.6)" }, ${(bStart + 0.18).toFixed(3)});
          tl.to(obj, {
            a: ${areaTo}, duration: 1.25, ease: "power3.out",
            onUpdate: () => { if (areaEl) areaEl.textContent = Math.round(obj.a).toLocaleString(); }
          }, ${(bStart + 0.16).toFixed(3)});
          ${shouldExit ? `tl.to("#${bid}", { opacity: 0, y: 20, duration: ${exitDur}, ease: "power3.in" }, ${exitAt.toFixed(3)});` : ''}
        })();`
    };
  }

  if (wType === 'vastu_compass') {
    return {
      html: `
        <div id="${bid}" class="compass-card" style="top:${slotTop}px;">
          <div class="comp-dial-wrap">
            <svg class="comp-svg" viewBox="0 0 180 180" data-layout-ignore>
              <circle cx="90" cy="90" r="56" fill="rgba(255,255,255,0.06)" stroke="${acc}" stroke-width="3.5" stroke-dasharray="9 7"/>
              <text x="90" y="21" text-anchor="middle" fill="#cbd5e1" font-family="Space Mono" font-size="18" font-weight="700">N</text>
              <text x="163" y="96" text-anchor="middle" fill="${acc}" font-family="Space Mono" font-size="24" font-weight="700">E</text>
              <text x="90" y="170" text-anchor="middle" fill="#cbd5e1" font-family="Space Mono" font-size="18" font-weight="700">S</text>
              <text x="17" y="96" text-anchor="middle" fill="#cbd5e1" font-family="Space Mono" font-size="18" font-weight="700">W</text>
              <g id="${bid}-needle" style="transform-origin:90px 90px;">
                <polygon points="90,90 138,90 100,77" fill="${acc}"/><polygon points="90,90 138,90 100,103" fill="${acc2}"/><circle cx="90" cy="90" r="9" fill="#ffffff"/>
              </g>
            </svg>
          </div>
          <div class="comp-copy">
            <span class="eyebrow" data-layout-ignore style="border:1.5px solid ${acc}; margin-bottom:8px;">${escHtml(beat.badge || 'FACING & VASTU')}</span>
            <div class="comp-val">${escHtml(beat.value || 'EAST FACING')}</div>
            <div class="comp-sub">${escHtml(beat.sub || '100% VASTU COMPLIANT')}</div>
          </div>
        </div>`,
      css: `
        #${bid} {
          position: absolute; left: ${cardLeft}px; width: ${cardW}px; padding: ${LAYOUT.card.paddingY}px ${LAYOUT.card.paddingX}px; border-radius: ${LAYOUT.card.borderRadiusPx}px; opacity: 0;
          display: flex; align-items: center; gap: 22px; background: rgba(8, 12, 24, 0.91); border: 2px solid ${acc};
          box-shadow: 0 22px 54px rgba(0,0,0,0.62); pointer-events: none;
        }
        #${bid} .comp-svg { width: 150px; height: 150px; flex-shrink: 0; }
        #${bid} .comp-val { font-family: "Montserrat", sans-serif; font-weight: 900; font-size: ${LAYOUT.font.heroDisplayPx}px; color: #ffffff; line-height: 1.05; }
        #${bid} .comp-sub { font-size: ${LAYOUT.font.bodySubPx}px; font-weight: 600; color: #fde68a; margin-top: 6px; }`,
      js: `
        tl.fromTo("#${bid}", { opacity: 0, y: 34, scale: 0.94 }, { opacity: 1, y: 0, scale: 1, duration: 0.40, ease: "expo.out" }, ${bStart.toFixed(3)});
        tl.fromTo("#${bid}-needle", { rotation: -210 }, { rotation: 0, duration: 1.15, ease: "back.out(1.4)" }, ${(bStart + 0.14).toFixed(3)});
        ${shouldExit ? `tl.to("#${bid}", { opacity: 0, y: 20, duration: ${exitDur}, ease: "power3.in" }, ${exitAt.toFixed(3)});` : ''}`
    };
  }

  if (wType === 'checklist_live') {
    const items = beat.items || ['TUDA / CLEAR TITLE', 'DRINKING WATER & BOREWELL', '3-PHASE ELECTRICITY'];
    const itemGap = Math.min(1.2, (bDur * 0.55) / Math.max(1, items.length));
    return {
      html: `
        <div id="${bid}" class="chk-stage" style="top:${tallTop}px;">
          <div class="chk-head">
            <span class="eyebrow" data-layout-ignore style="border:1.5px solid ${acc};">${escHtml(beat.badge || 'UTILITIES')}</span>
            <span class="chk-title" data-layout-ignore>${escHtml(beat.value || 'READY INFRASTRUCTURE')}</span>
          </div>
          <div class="chk-list">
            ${items.map((txt, idx) => `
              <div class="chk-item" id="${bid}-i${idx}">
                <svg class="chk-ring" viewBox="0 0 44 44" data-layout-ignore>
                  <circle cx="22" cy="22" r="18" fill="rgba(16,185,129,0.16)" stroke="#10B981" stroke-width="3.5"/>
                  <path id="${bid}-t${idx}" d="M 14 22 L 20 28 L 31 15" fill="none" stroke="#ffffff" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" pathLength="100" stroke-dasharray="100 120" stroke-dashoffset="110"/>
                </svg>
                <span class="chk-txt">${escHtml(txt)}</span>
              </div>`).join('')}
          </div>
        </div>`,
      css: `
        #${bid} {
          position: absolute; left: ${cardLeft}px; width: ${cardW}px; padding: ${LAYOUT.card.paddingY}px 24px; border-radius: ${LAYOUT.card.borderRadiusPx}px; opacity: 0;
          background: rgba(8, 12, 24, 0.91); border: 2px solid ${acc}99;
          box-shadow: 0 22px 54px rgba(0,0,0,0.60); pointer-events: none;
        }
        #${bid} .chk-head { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 10px; }
        #${bid} .chk-title { font-family: "Space Mono", monospace; font-size: 20px; font-weight: 700; color: ${acc}; }
        #${bid} .chk-list { display: flex; flex-direction: column; gap: 8px; }
        #${bid} .chk-item { display: flex; align-items: center; gap: 14px; padding: 10px 14px; border-radius: 14px; background: rgba(255,255,255,0.06); border: 1.5px solid rgba(255,255,255,0.08); opacity: 0.42; }
        #${bid} .chk-ring { width: 38px; height: 38px; flex-shrink: 0; }
        #${bid} .chk-txt { font-family: "Montserrat", sans-serif; font-weight: 800; font-size: ${LAYOUT.font.bodySubPx}px; color: #ffffff; letter-spacing: 0.015em; }`,
      js: `
        tl.fromTo("#${bid}", { opacity: 0, y: 32 }, { opacity: 1, y: 0, duration: 0.38, ease: "expo.out" }, ${bStart.toFixed(3)});
        ${items.map((_, idx) => {
          const at = bStart + 0.14 + idx * itemGap;
          return `
            tl.fromTo("#${bid}-i${idx}", { opacity: 0.42, x: -12, borderColor: "rgba(255,255,255,0.08)" }, { opacity: 1, x: 0, backgroundColor: "rgba(16,185,129,0.16)", borderColor: "#10B981", duration: 0.34, ease: "expo.out" }, ${at.toFixed(3)});
            tl.fromTo("#${bid}-t${idx}", { strokeDashoffset: 110 }, { strokeDashoffset: 0, duration: 0.34, ease: "power2.out" }, ${(at + 0.12).toFixed(3)});`;
        }).join('')}
        ${shouldExit ? `tl.to("#${bid}", { opacity: 0, y: 20, duration: ${exitDur}, ease: "power3.in" }, ${exitAt.toFixed(3)});` : ''}`
    };
  }

  if (wType === 'verified_shield') {
    return {
      html: `
        <div id="${bid}" class="shield-card" style="top:${slotTop}px;">
          <div class="sh-icon">
            <svg viewBox="0 0 90 96" class="sh-svg" data-layout-ignore>
              <path id="${bid}-sp" d="M 45 6 L 80 20 L 80 48 C 80 72 45 90 45 90 C 45 90 10 72 10 48 L 10 20 Z" fill="rgba(16,185,129,0.20)" stroke="#10B981" stroke-width="5" pathLength="100" stroke-dasharray="100 120" stroke-dashoffset="110"/>
              <path id="${bid}-chk" d="M 28 48 L 40 60 L 64 34" fill="none" stroke="#ffffff" stroke-width="6.5" stroke-linecap="round" stroke-linejoin="round" pathLength="100" stroke-dasharray="100 120" stroke-dashoffset="110"/>
            </svg>
          </div>
          <div>
            <span class="eyebrow" data-layout-ignore style="border:1.5px solid #10B981; margin-bottom:8px;">${escHtml(beat.badge || 'APPROVALS VERIFIED')}</span>
            <div class="sh-val">${escHtml(beat.value || 'TUDA • A-KHATA')}</div>
            <div class="sh-sub">${escHtml(beat.sub || '')}</div>
          </div>
        </div>`,
      css: `
        #${bid} {
          position: absolute; left: ${cardLeft}px; width: ${cardW}px; padding: 20px ${LAYOUT.card.paddingX}px; border-radius: ${LAYOUT.card.borderRadiusPx}px; opacity: 0;
          display: flex; align-items: center; gap: 22px; background: rgba(8, 12, 24, 0.92); border: 2px solid #10B981;
          box-shadow: 0 22px 54px rgba(0,0,0,0.62); pointer-events: none;
        }
        #${bid} .sh-svg { width: 82px; height: 86px; flex-shrink: 0; }
        #${bid} .sh-val { font-family: "Montserrat", sans-serif; font-weight: 900; font-size: 42px; color: #ffffff; line-height: 1.05; }
        #${bid} .sh-sub { font-size: ${LAYOUT.font.bodySubPx}px; font-weight: 600; color: #a7f3d0; margin-top: 6px; }`,
      js: `
        tl.fromTo("#${bid}", { opacity: 0, y: 34, scale: 0.92 }, { opacity: 1, y: 0, scale: 1, duration: 0.40, ease: "expo.out" }, ${bStart.toFixed(3)});
        tl.fromTo("#${bid}-sp", { strokeDashoffset: 110 }, { strokeDashoffset: 0, duration: 0.65, ease: "power2.inOut" }, ${(bStart + 0.1).toFixed(3)});
        tl.fromTo("#${bid}-chk", { strokeDashoffset: 110 }, { strokeDashoffset: 0, duration: 0.42, ease: "back.out(1.4)" }, ${(bStart + 0.48).toFixed(3)});
        ${shouldExit ? `tl.to("#${bid}", { opacity: 0, y: 20, duration: ${exitDur}, ease: "power3.in" }, ${exitAt.toFixed(3)});` : ''}`
    };
  }

  if (wType === 'price_odometer') {
    const pTo = Number(beat.count_to || 1850);
    return {
      html: `
        <div id="${bid}" class="price-hero" style="top:${slotTop}px;">
          <span class="eyebrow" data-layout-ignore style="border:1.5px solid ${acc}; margin-bottom:10px;">${escHtml(beat.badge || 'LAUNCH RATE')}</span>
          <div class="ph-main">
            <span class="ph-cur">${escHtml(beat.count_prefix || '₹')}</span><span id="${bid}-val" class="num">0</span><span class="ph-suf">${escHtml(beat.count_suffix || ' / SQ.FT')}</span>
          </div>
          <div class="ph-sub">${escHtml(beat.sub || '')}</div>
        </div>`,
      css: `
        #${bid} {
          position: absolute; left: ${cardLeft}px; width: ${cardW}px; padding: 20px 28px; border-radius: 26px; opacity: 0;
          background: linear-gradient(135deg, rgba(16,12,8,0.92), rgba(28,18,6,0.90));
          border: 2.5px solid ${acc}; box-shadow: 0 24px 60px rgba(0,0,0,0.68); pointer-events: none;
        }
        #${bid} .ph-main { font-family: "Montserrat", sans-serif; font-weight: 900; font-size: ${LAYOUT.font.statHugePx}px; line-height: 1.04; color: #ffffff; }
        #${bid} .ph-cur { color: ${acc}; }
        #${bid} .ph-suf { font-size: 32px; color: #fde68a; font-weight: 800; }
        #${bid} .ph-sub { font-size: ${LAYOUT.font.bodySubPx}px; font-weight: 600; color: #fef3c7; margin-top: 8px; }`,
      js: `
        (function() {
          const obj = { v: ${Number(beat.count_from || 0)} };
          const el = document.getElementById("${bid}-val");
          tl.fromTo("#${bid}", { opacity: 0, scale: 0.90, filter: "blur(8px)" }, { opacity: 1, scale: 1, filter: "blur(0px)", duration: 0.40, ease: "expo.out" }, ${bStart.toFixed(3)});
          tl.to(obj, {
            v: ${pTo}, duration: 1.35, ease: "power4.out",
            onUpdate: () => { if (el) el.textContent = Math.round(obj.v).toLocaleString(); }
          }, ${(bStart + 0.08).toFixed(3)});
          ${shouldExit ? `tl.to("#${bid}", { opacity: 0, y: 18, duration: ${exitDur}, ease: "power3.in" }, ${exitAt.toFixed(3)});` : ''}
        })();`
    };
  }

  if (wType === 'price_calc') {
    const cTo = Number(beat.count_to || 22.2);
    const dec = Number(beat.count_decimals || 1);
    return {
      html: `
        <div id="${bid}" class="calc-card" style="top:${slotTop}px;">
          <span class="eyebrow" data-layout-ignore style="border:1.5px solid ${acc}; margin-bottom:10px;">${escHtml(beat.badge || 'TOTAL PLOT VALUE')}</span>
          <div class="calc-row">
            <span class="c-chip" id="${bid}-c1">${escHtml(beat.eq_left || '1,200 SQ.FT')}</span>
            <span class="c-op">×</span>
            <span class="c-chip" id="${bid}-c2">${escHtml(beat.eq_mid || '₹1,850')}</span>
            <span class="c-op">=</span>
            <span class="c-res" id="${bid}-res">${escHtml(beat.count_prefix || '₹')}<span id="${bid}-num">0.0</span>${escHtml(beat.count_suffix || ' LAKHS')}</span>
          </div>
          <div class="calc-sub">${escHtml(beat.sub || '')}</div>
        </div>`,
      css: `
        #${bid} {
          position: absolute; left: ${cardLeft}px; width: ${cardW}px; padding: ${LAYOUT.card.paddingY}px ${LAYOUT.card.paddingX}px; border-radius: ${LAYOUT.card.borderRadiusPx}px; opacity: 0;
          background: rgba(8, 12, 24, 0.92); border: 2px solid ${acc2};
          box-shadow: 0 22px 54px rgba(0,0,0,0.62); pointer-events: none;
        }
        #${bid} .calc-row { display: flex; flex-wrap: wrap; align-items: center; gap: 10px; }
        #${bid} .c-chip { padding: 8px 16px; border-radius: 14px; background: rgba(255,255,255,0.12); font-family: "Space Mono", monospace; font-size: ${LAYOUT.font.bodySubPx}px; font-weight: 700; color: #ffffff; }
        #${bid} .c-op { font-size: 30px; font-weight: 900; color: ${acc}; }
        #${bid} .c-res { padding: 8px 20px; border-radius: 14px; background: linear-gradient(135deg, ${acc}, ${acc2}); font-family: "Montserrat", sans-serif; font-size: 32px; font-weight: 900; color: #ffffff; }
        #${bid} .calc-sub { font-size: ${LAYOUT.font.bodySubPx}px; font-weight: 600; color: #e2e8f0; margin-top: 10px; }`,
      js: `
        (function() {
          const obj = { v: ${Number(beat.count_from || 0)} };
          const nEl = document.getElementById("${bid}-num");
          tl.fromTo("#${bid}", { opacity: 0, y: 34, scale: 0.94 }, { opacity: 1, y: 0, scale: 1, duration: 0.40, ease: "expo.out" }, ${bStart.toFixed(3)});
          tl.fromTo("#${bid}-c1", { opacity: 0, x: -24 }, { opacity: 1, x: 0, duration: 0.35, ease: "power3.out" }, ${(bStart + 0.1).toFixed(3)});
          tl.fromTo("#${bid}-c2", { opacity: 0, x: -24 }, { opacity: 1, x: 0, duration: 0.35, ease: "power3.out" }, ${(bStart + 0.32).toFixed(3)});
          tl.fromTo("#${bid}-res", { opacity: 0, scale: 0.85 }, { opacity: 1, scale: 1, duration: 0.45, ease: "back.out(1.6)" }, ${(bStart + 0.56).toFixed(3)});
          tl.to(obj, {
            v: ${cTo}, duration: 1.25, ease: "power3.out",
            onUpdate: () => { if (nEl) nEl.textContent = obj.v.toFixed(${dec}); }
          }, ${(bStart + 0.56).toFixed(3)});
          ${shouldExit ? `tl.to("#${bid}", { opacity: 0, y: 20, duration: ${exitDur}, ease: "power3.in" }, ${exitAt.toFixed(3)});` : ''}
        })();`
    };
  }

  if (wType === 'follow_cta' || wType === 'interactive_cta') {
    const isFollow = wType === 'follow_cta';
    const logoRel = brandMeta.hfLogoRelPath;
    const headline = beat.value || (isFollow ? brandMeta.follow_headline || 'FOLLOW OUR PAGE' : 'BOOK FREE SITE VISIT');
    const handleTxt = beat.handle || brandMeta.page_handle || '@tumkursites';
    const btnText = beat.button_text || (isFollow ? brandMeta.follow_button_text || `+ FOLLOW ${handleTxt}` : headline);
    const subTxt = beat.sub || (isFollow ? brandMeta.follow_subtext : 'EXPERIENCE THE PROPERTY LIVE IN PERSON');
    const tapAt = bStart + Math.min(1.8, bDur * 0.34);
    return {
      html: `
        <div id="${bid}" class="cta-stage" style="top:${tallTop}px;">
          <div class="cta-top-row">
            ${logoRel ? `<img class="cta-logo" src="../${logoRel}" alt="Brand Logo" data-layout-ignore/>` : ''}
            <div>
              <span class="eyebrow" data-layout-ignore style="border:1.5px solid ${acc}; margin-bottom:6px;">${escHtml(beat.badge || (isFollow ? brandMeta.follow_badge : 'SITE VISITS OPEN'))}</span>
              <div class="cta-head">${escHtml(headline)}</div>
              ${isFollow ? `<div class="cta-handle">${escHtml(handleTxt)}</div>` : ''}
            </div>
          </div>
          <div class="cta-btn-wrap" id="${bid}-btn">
            <span class="cta-btn-txt">${escHtml(btnText)}</span>
            <div class="cta-ripple" id="${bid}-rip"></div>
            <svg class="cta-cursor" id="${bid}-cur" viewBox="0 0 40 48" data-layout-ignore>
              <path d="M4 2 L34 26 L20 28 L27 43 L20 46 L13 31 L4 39 Z" fill="#ffffff" stroke="#090d16" stroke-width="3" stroke-linejoin="round"/>
            </svg>
          </div>
          <div class="cta-sub">${escHtml(subTxt || '')}</div>
        </div>`,
      css: `
        #${bid} {
          position: absolute; left: ${cardLeft}px; width: ${cardW}px; padding: ${LAYOUT.card.paddingY}px ${LAYOUT.card.paddingX}px; border-radius: ${LAYOUT.card.borderRadiusPx}px; opacity: 0;
          background: rgba(8, 12, 24, 0.93); border: 2px solid ${acc};
          box-shadow: 0 22px 56px rgba(0,0,0,0.64); pointer-events: none;
        }
        #${bid} .cta-top-row { display: flex; align-items: center; gap: 18px; margin-bottom: 12px; }
        #${bid} .cta-logo { width: 84px; height: 84px; border-radius: 50%; object-fit: cover; padding: 2px; background: #faf9f6; border: 2px solid ${acc}; flex-shrink: 0; }
        #${bid} .cta-head { font-family: "Montserrat", sans-serif; font-weight: 900; font-size: ${LAYOUT.font.ctaHeadPx}px; color: #ffffff; line-height: 1.06; }
        #${bid} .cta-handle { font-family: "Space Mono", monospace; font-size: ${LAYOUT.font.bodySubPx}px; font-weight: 700; color: ${acc}; margin-top: 2px; }
        #${bid} .cta-btn-wrap {
          position: relative; display: flex; align-items: center; justify-content: center;
          padding: 16px 64px 16px 26px; border-radius: 18px; overflow: visible;
          background: linear-gradient(135deg, #0369a1, #047857); border: 2px solid ${acc};
          box-shadow: 0 12px 32px ${acc}44;
        }
        #${bid} .cta-btn-txt { font-family: "Montserrat", sans-serif; font-weight: 900; font-size: 34px; color: #ffffff; letter-spacing: 0.02em; text-align: center; }
        #${bid} .cta-ripple { position: absolute; width: 72px; height: 72px; border-radius: 50%; border: 4px solid #ffffff; opacity: 0; right: 20px; top: 50%; margin-top: -36px; pointer-events: none; }
        #${bid} .cta-cursor { position: absolute; width: 46px; height: 54px; right: 20px; top: 34px; opacity: 0; filter: drop-shadow(0 6px 12px rgba(0,0,0,0.5)); pointer-events: none; }
        #${bid} .cta-sub { font-size: ${LAYOUT.font.bodySubPx}px; font-weight: 600; color: #cbd5e1; margin-top: 10px; text-align: center; }`,
      js: `
        tl.fromTo("#${bid}", { opacity: 0, y: 34, scale: 0.94 }, { opacity: 1, y: 0, scale: 1, duration: 0.40, ease: "expo.out" }, ${bStart.toFixed(3)});
        tl.fromTo("#${bid}-cur", { opacity: 0, x: 96, y: 74 }, { opacity: 1, x: 0, y: 0, duration: Math.max(0.45, ${(tapAt - bStart - 0.15).toFixed(3)}), ease: "power2.out" }, ${(bStart + 0.15).toFixed(3)});
        tl.to("#${bid}-btn", { scale: 0.94, duration: 0.10, ease: "power2.in" }, ${tapAt.toFixed(3)});
        tl.to("#${bid}-btn", { scale: 1.03, duration: 0.24, ease: "back.out(1.8)" }, ${(tapAt + 0.10).toFixed(3)});
        tl.fromTo("#${bid}-rip", { opacity: 0.95, scale: 0.25 }, { opacity: 0, scale: 2.2, duration: 0.55, ease: "power2.out" }, ${(tapAt + 0.05).toFixed(3)});
        tl.to("#${bid}-cur", { opacity: 0, duration: 0.35, ease: "power2.in" }, ${(tapAt + 1.4).toFixed(3)});
        ${shouldExit ? `tl.to("#${bid}", { opacity: 0, y: 20, duration: ${exitDur}, ease: "power3.in" }, ${exitAt.toFixed(3)});` : ''}`
    };
  }

  return {
    html: `
      <div id="${bid}" class="hl-card" style="top:${slotTop}px;">
        <div class="hl-top"><span class="eyebrow" data-layout-ignore style="border:1.5px solid ${acc};">${escHtml(beat.badge || 'HIGHLIGHT')}</span></div>
        <div class="hl-val"><span class="hl-sweep" id="${bid}-sw">${escHtml(beat.value || '')}</span></div>
        <div class="hl-sub">${escHtml(beat.sub || '')}</div>
      </div>`,
    css: `
      #${bid} {
        position: absolute; left: ${cardLeft}px; width: ${cardW}px; padding: 20px ${LAYOUT.card.paddingX}px; border-radius: ${LAYOUT.card.borderRadiusPx}px; opacity: 0;
        background: rgba(8, 12, 24, 0.91); border: 2px solid ${acc};
        box-shadow: 0 22px 54px rgba(0,0,0,0.58); pointer-events: none;
      }
      #${bid} .hl-top { margin-bottom: 8px; }
      #${bid} .hl-val { font-family: "Montserrat", sans-serif; font-weight: 900; font-size: ${LAYOUT.font.cardTitlePx}px; line-height: 1.08; color: #ffffff; }
      #${bid} .hl-sweep {
        background-image: linear-gradient(90deg, ${acc}44, ${acc2}44); background-repeat: no-repeat; background-size: 0% 100%;
        padding: 2px 10px; border-radius: 10px; -webkit-box-decoration-break: clone; box-decoration-break: clone;
      }
      #${bid} .hl-sub { font-size: ${LAYOUT.font.bodySubPx}px; font-weight: 600; color: #cbd5e1; margin-top: 8px; line-height: 1.22; }`,
    js: `
      tl.fromTo("#${bid}", { opacity: 0, x: ${bIdx % 2 === 0 ? -42 : 42}, filter: "blur(6px)" }, { opacity: 1, x: 0, filter: "blur(0px)", duration: 0.40, ease: "expo.out" }, ${bStart.toFixed(3)});
      tl.to("#${bid}-sw", { backgroundSize: "100% 100%", duration: 0.65, ease: "power2.out" }, ${(bStart + 0.18).toFixed(3)});
      ${shouldExit ? `tl.to("#${bid}", { opacity: 0, y: 20, duration: ${exitDur}, ease: "power3.in" }, ${exitAt.toFixed(3)});` : ''}`
  };
}

module.exports = { renderBeatWidget };
