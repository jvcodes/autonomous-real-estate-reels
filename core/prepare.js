#!/usr/bin/env node
/**
 * core/prepare.js
 * Generic, self-contained HyperFrames + GSAP 3.15 + Edge-TTS compiler.
 * Features:
 *  - Shared Brand Kit auto-pickup: common/brand.json, common/logo/*, common/fonts/*, common/music/*, common/sfx/*
 *  - Per-site isolation under sites/<site_folder>/ (clips/, site.json, work/, out/)
 *  - Standardized 5-Stage Property Flow: Road & Area -> Approvals -> Dimensions & Vastu -> Pricing -> Follow Page CTA
 *  - Zero external Python or cross-repo paths (pure Node chord ambient synth + native DaVinci XML output)
 * Usage:
 *   node core/prepare.js --new <site_name>
 *   node core/prepare.js [sites/<site_folder>]
 */

const fs = require('fs');
const path = require('path');
const { execSync, spawnSync } = require('child_process');
const { MsEdgeTTS, OUTPUT_FORMAT } = require('msedge-tts');

const REPO_ROOT = path.resolve(__dirname, '..');
const COMMON_DIR = path.join(REPO_ROOT, 'common');
const SITES_DIR = path.join(REPO_ROOT, 'sites');
const TEMPLATE_DIR = path.join(SITES_DIR, '_template');
const ACTIVE_SITE_PTR = path.join(SITES_DIR, '.active_site.json');

function findFfmpeg() {
  const candidates = [];
  const wingetBase = path.join(process.env.LOCALAPPDATA || '', 'Microsoft', 'WinGet', 'Packages');
  if (fs.existsSync(wingetBase)) {
    const dirs = fs.readdirSync(wingetBase).filter((d) => d.startsWith('Gyan.FFmpeg'));
    for (const d of dirs) {
      const pkgRoot = path.join(wingetBase, d);
      const sub = fs.readdirSync(pkgRoot).find((x) => x.startsWith('ffmpeg-'));
      if (sub) {
        const p = path.join(pkgRoot, sub, 'bin', 'ffmpeg.exe');
        if (fs.existsSync(p)) candidates.push(p);
      }
    }
  }
  candidates.push('ffmpeg');
  return candidates.find((c) => c === 'ffmpeg' || fs.existsSync(c)) || 'ffmpeg';
}

const FFMPEG = findFfmpeg();
const FFPROBE =
  FFMPEG.endsWith('ffmpeg.exe') && fs.existsSync(FFMPEG.replace(/ffmpeg\.exe$/, 'ffprobe.exe'))
    ? FFMPEG.replace(/ffmpeg\.exe$/, 'ffprobe.exe')
    : 'ffprobe';

function getMediaDurationSec(filePath) {
  const res = spawnSync(FFPROBE, ['-v', 'error', '-show_entries', 'format=duration', '-of', 'default=nw=1:nk=1', filePath], {
    encoding: 'utf8'
  });
  const v = parseFloat((res.stdout || '').trim());
  if (!Number.isNaN(v) && v > 0) return v;
  const r2 = spawnSync(FFMPEG, ['-i', filePath], { encoding: 'utf8' });
  const m = (r2.stderr || '').match(/Duration:\s*(\d+):(\d+):(\d+\.\d+)/);
  if (!m) throw new Error(`Could not probe duration for ${filePath}`);
  return parseInt(m[1], 10) * 3600 + parseInt(m[2], 10) * 60 + parseFloat(m[3]);
}

function linkOrCopy(src, dest) {
  if (!src || !fs.existsSync(src)) return false;
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  try {
    if (fs.existsSync(dest)) fs.unlinkSync(dest);
    fs.linkSync(src, dest);
  } catch {
    fs.copyFileSync(src, dest);
  }
  return true;
}

function linkDirContents(srcDir, destDir) {
  if (!fs.existsSync(srcDir)) return;
  fs.mkdirSync(destDir, { recursive: true });
  for (const entry of fs.readdirSync(srcDir, { withFileTypes: true })) {
    const s = path.join(srcDir, entry.name);
    const d = path.join(destDir, entry.name);
    if (entry.isDirectory()) linkDirContents(s, d);
    else linkOrCopy(s, d);
  }
}

function escHtml(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function escXml(s) {
  return escHtml(s).replace(/'/g, '&apos;');
}

function sanitizeName(raw) {
  return String(raw || '')
    .trim()
    .replace(/[^A-Za-z0-9_-]+/g, '_')
    .replace(/^_+|_+$/g, '') || 'Property_Reel';
}

function ensureCssId(raw) {
  const s = sanitizeName(raw);
  return /^[A-Za-z]/.test(s) ? s : `sc_${s}`;
}

function toFcpUrl(absPath) {
  let norm = absPath.replace(/\\/g, '/');
  if (norm.length >= 2 && norm[1] === ':') {
    norm = norm[0] + '%3a' + norm.slice(2);
  }
  return 'file://localhost/' + encodeURI(norm).replace(/%253a/i, '%3a');
}

function listVideoClips(clipsDir) {
  if (!fs.existsSync(clipsDir)) return [];
  const exts = new Set(['.mp4', '.mov', '.mkv', '.webm', '.m4v']);
  return fs
    .readdirSync(clipsDir)
    .filter((f) => exts.has(path.extname(f).toLowerCase()))
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }))
    .map((f) => path.join(clipsDir, f));
}

function resolveCommonLogo(brand) {
  const logoDir = path.join(COMMON_DIR, 'logo');
  if (!fs.existsSync(logoDir)) return null;
  const preferred = [
    brand.logo_file,
    'logo.png',
    'logo.svg',
    'logo.webp',
    'logo.jpg',
    'logo.jpeg'
  ].filter(Boolean);

  for (const name of preferred) {
    const p = path.join(logoDir, name);
    if (fs.existsSync(p) && fs.statSync(p).isFile()) return p;
  }

  const imageExts = new Set(['.png', '.svg', '.webp', '.jpg', '.jpeg']);
  const entries = fs
    .readdirSync(logoDir)
    .filter((f) => imageExts.has(path.extname(f).toLowerCase()) && f !== 'brand_logo.svg')
    .sort();
  if (entries.length > 0) return path.join(logoDir, entries[0]);

  const fallbackSvg = path.join(logoDir, 'brand_logo.svg');
  return fs.existsSync(fallbackSvg) ? fallbackSvg : null;
}

function resolveCommonMusic(config, brand) {
  if (config.ambient_music_file) {
    const custom = path.resolve(REPO_ROOT, config.ambient_music_file);
    if (fs.existsSync(custom)) return custom;
  }
  const musicDir = path.join(COMMON_DIR, 'music');
  if (!fs.existsSync(musicDir)) return null;
  const audioExts = new Set(['.wav', '.mp3', '.m4a', '.aac', '.flac']);
  const files = fs
    .readdirSync(musicDir)
    .filter((f) => audioExts.has(path.extname(f).toLowerCase()))
    .sort();
  return files.length > 0 ? path.join(musicDir, files[0]) : null;
}

/**
 * Pure Node.js warm ambient chord synthesizer (zero Python dependency).
 * Generates Cmaj9 -> Am9 -> Fmaj9 -> G6 stereo 48kHz 16-bit PCM WAV.
 */
function synthesizeAmbientBedWav(durationSec, outWavPath, sampleRate = 48000) {
  const nSamples = Math.max(sampleRate, Math.ceil(durationSec * sampleRate));
  const left = new Float64Array(nSamples);
  const right = new Float64Array(nSamples);

  const chords = [
    [130.81, 196.0, 246.94, 293.66, 329.63], // Cmaj9
    [110.0, 196.0, 246.94, 261.63, 329.63],  // Am9
    [174.61, 220.0, 261.63, 329.63, 392.0],  // Fmaj9
    [196.0, 246.94, 293.66, 329.63, 440.0]   // G6
  ];
  const barSec = 8.0;
  const xfadeSec = 2.2;
  const twoPi = 2.0 * Math.PI;
  const totalBars = Math.ceil(durationSec / barSec) + 1;

  for (let barIdx = 0; barIdx < totalBars; barIdx++) {
    const startS = barIdx * barSec;
    const endS = startS + barSec + xfadeSec;
    const i0 = Math.max(0, Math.floor(startS * sampleRate));
    const i1 = Math.min(nSamples, Math.floor(endS * sampleRate));
    if (i0 >= i1) continue;

    const segLen = endS - startS;
    const freqs = chords[barIdx % chords.length];

    for (let i = i0; i < i1; i++) {
      const segT = i / sampleRate;
      const localT = segT - startS;
      let env = 1.0;
      if (localT < xfadeSec) {
        env = 0.5 * (1.0 - Math.cos((Math.PI * localT) / xfadeSec));
      } else if (localT > segLen - xfadeSec) {
        env = 0.5 * (1.0 + Math.cos((Math.PI * (localT - (segLen - xfadeSec))) / xfadeSec));
      }
      const breath = 0.85 + 0.15 * Math.sin(twoPi * 0.25 * localT);
      let padL = 0;
      let padR = 0;
      for (let k = 0; k < freqs.length; k++) {
        const f = freqs[k];
        const detune = 0.35 + 0.08 * k;
        const w = 1.0 / (1.0 + 0.25 * k);
        padL += w * Math.sin(twoPi * (f - detune) * segT);
        padR += w * Math.sin(twoPi * (f + detune) * segT);
      }
      left[i] += (padL / freqs.length) * env * breath;
      right[i] += (padR / freqs.length) * env * breath;
    }
  }

  // Soft melodic pulse every 2.0s for gentle pacing
  const pulseInterval = 2.0;
  const numPulses = Math.floor(durationSec / pulseInterval);
  const melodyDegrees = [4, 2, 3, 1];
  for (let pIdx = 0; pIdx < numPulses; pIdx++) {
    const pTime = pIdx * pulseInterval + 0.15;
    const barIdx = Math.floor(pTime / barSec);
    const freqs = chords[barIdx % chords.length];
    const noteF = freqs[melodyDegrees[pIdx % melodyDegrees.length] % freqs.length] * 2.0;
    const pDur = 2.4;
    const i0 = Math.max(0, Math.floor(pTime * sampleRate));
    const i1 = Math.min(nSamples, Math.floor((pTime + pDur) * sampleRate));
    const pan = pIdx % 2 === 0 ? 0.35 : 0.65;
    for (let i = i0; i < i1; i++) {
      const pt = i / sampleRate - pTime;
      const tone = (1.0 - Math.exp(-pt / 0.03)) * Math.exp(-pt / 0.9) * (Math.sin(twoPi * noteF * pt) + 0.18 * Math.sin(twoPi * 2.0 * noteF * pt));
      left[i] += 0.28 * (1.0 - pan) * tone;
      right[i] += 0.28 * pan * tone;
    }
  }

  const fadeSamples = Math.min(Math.floor(nSamples / 4), Math.floor(1.8 * sampleRate));
  for (let i = 0; i < fadeSamples; i++) {
    const rIn = i / fadeSamples;
    const rOut = 1.0 - i / fadeSamples;
    left[i] *= rIn;
    right[i] *= rIn;
    left[nSamples - fadeSamples + i] *= rOut;
    right[nSamples - fadeSamples + i] *= rOut;
  }

  let peak = 1e-6;
  for (let i = 0; i < nSamples; i++) {
    const al = Math.abs(left[i]);
    const ar = Math.abs(right[i]);
    if (al > peak) peak = al;
    if (ar > peak) peak = ar;
  }
  const scale = (0.18 / peak) * 32767.0;

  const dataByteLen = nSamples * 4;
  const buf = Buffer.allocUnsafe(44 + dataByteLen);
  buf.write('RIFF', 0);
  buf.writeUInt32LE(36 + dataByteLen, 4);
  buf.write('WAVE', 8);
  buf.write('fmt ', 12);
  buf.writeUInt32LE(16, 16);
  buf.writeUInt16LE(1, 20);
  buf.writeUInt16LE(2, 22);
  buf.writeUInt32LE(sampleRate, 24);
  buf.writeUInt32LE(sampleRate * 4, 28);
  buf.writeUInt16LE(4, 32);
  buf.writeUInt16LE(16, 34);
  buf.write('data', 36);
  buf.writeUInt32LE(dataByteLen, 40);

  let offset = 44;
  for (let i = 0; i < nSamples; i++) {
    const sL = Math.max(-32767, Math.min(32767, Math.round(left[i] * scale)));
    const sR = Math.max(-32767, Math.min(32767, Math.round(right[i] * scale)));
    buf.writeInt16LE(sL, offset);
    buf.writeInt16LE(sR, offset + 2);
    offset += 4;
  }
  fs.mkdirSync(path.dirname(outWavPath), { recursive: true });
  fs.writeFileSync(outWavPath, buf);
}

function parseBoundaryObjects(rawChunks) {
  const raw = rawChunks.join('');
  const words = [];
  let depth = 0;
  let start = -1;
  let inString = false;
  let escape = false;
  for (let i = 0; i < raw.length; i++) {
    const ch = raw[i];
    if (inString) {
      if (escape) escape = false;
      else if (ch === '\\') escape = true;
      else if (ch === '"') inString = false;
      continue;
    }
    if (ch === '"') inString = true;
    else if (ch === '{') {
      if (depth === 0) start = i;
      depth++;
    } else if (ch === '}') {
      depth--;
      if (depth === 0 && start !== -1) {
        try {
          const obj = JSON.parse(raw.slice(start, i + 1));
          for (const item of obj.Metadata || []) {
            if (item.Type === 'WordBoundary' && item.Data?.text?.Text) {
              const offsetSec = Number(item.Data.Offset || 0) / 10_000_000;
              const durSec = Math.max(0.08, Number(item.Data.Duration || 0) / 10_000_000);
              words.push({
                text: String(item.Data.text.Text).trim(),
                start: Number(offsetSec.toFixed(3)),
                end: Number((offsetSec + durSec).toFixed(3))
              });
            }
          }
        } catch {}
        start = -1;
      }
    }
  }
  return words;
}

function inferVoiceLocale(voice, lang) {
  if (typeof voice === 'string' && /^[a-z]{2}-[A-Z]{2}/.test(voice)) return voice.slice(0, 5);
  if (lang === 'en') return 'en-IN';
  return 'kn-IN';
}

function findAnchorTime(wordTimings, candidateKeywords, fallbackSec, minSec, maxSec) {
  if (!Array.isArray(wordTimings) || wordTimings.length === 0 || !candidateKeywords?.length) return fallbackSec;
  for (const kw of candidateKeywords) {
    const needle = String(kw).toLowerCase();
    if (needle.length < 2) continue;
    const match = wordTimings.find((w) => w.text.toLowerCase().includes(needle) && w.start >= minSec - 0.5 && w.start <= maxSec);
    if (match) return Math.max(minSec, Math.min(maxSec, match.start - 0.12));
  }
  return fallbackSec;
}

function inferKeywordsForBeat(beat) {
  const keys = new Set();
  const txt = `${beat.widget || ''} ${beat.badge || ''} ${beat.value || ''} ${beat.count_to || ''} ${beat.width_label || ''} ${beat.depth_label || ''} ${beat.route_end || ''} ${(beat.items || []).join(' ')}`.toLowerCase();

  // Dynamic numbers directly from beat fields (generic for any highway, plot size, price!)
  const nums = txt.match(/\d[\d.,]*/g) || [];
  nums.forEach((n) => keys.add(n.replace(/,/g, '')));

  if (txt.includes('highway') || txt.includes('road') || beat.widget === 'route_tracker') {
    ['ಹೆದ್ದಾರಿ', 'ರಸ್ತೆ', 'highway', 'road', 'meters', 'ಮೀಟರ್', 'ಕಿಲೋಮೀಟರ್'].forEach((k) => keys.add(k));
  }
  if (txt.includes('tuda') || txt.includes('rera') || txt.includes('katha') || txt.includes('khata') || beat.widget === 'verified_shield') {
    ['ಟುಡಾ', 'tuda', 'ಖಾತಾ', 'khata', 'rera', 'ಅಪ್ರೂವ್', 'approved', 'ಟೈಟಲ್', 'title'].forEach((k) => keys.add(k));
  }
  if (beat.widget === 'checklist_live') {
    ['ನೀರು', 'ನೀರಿನ', 'ವಿದ್ಯುತ್', 'ಬೋರ್', 'ರಸ್ತೆ', 'water', 'power', 'park'].forEach((k) => keys.add(k));
  }
  if (beat.widget === 'blueprint_draw') {
    ['ಅಳತೆ', 'ಚದರಡಿ', 'ವಿಸ್ತೀರ್ಣ', 'dimension', 'sq.ft'].forEach((k) => keys.add(k));
  }
  if (beat.widget === 'vastu_compass') {
    ['ವಾಸ್ತು', 'ಪೂರ್ವ', 'ಉತ್ತರ', 'vastu', 'east', 'north', 'facing'].forEach((k) => keys.add(k));
  }
  if (beat.widget === 'price_odometer' || beat.widget === 'price_calc') {
    ['ಬೆಲೆ', 'ರೂಪಾಯಿ', 'ಲಕ್ಷ', 'ಕೋಟಿ', 'ಚದರಡಿ', 'price', 'lakhs', 'rupees'].forEach((k) => keys.add(k));
  }
  if (beat.widget === 'follow_cta' || beat.widget === 'interactive_cta') {
    ['ಫಾಲೋ', 'ಪೇಜ್', 'ಕರೆ', 'ಭೇಟಿ', 'follow', 'page', 'visit', 'call'].forEach((k) => keys.add(k));
  }
  return Array.from(keys);
}

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
      padding: 8px 18px;
      border-radius: 999px;
      font-family: "Space Mono", "Inter", monospace;
      font-size: 22px;
      font-weight: 700;
      letter-spacing: 0.12em;
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
    <div id="root" data-composition-id="${compId}" data-duration="${dur.toFixed(3)}" data-fps="${fps}" data-width="1080" data-height="1920">
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

function generateSceneCompositionHtml(scene, sceneIndex, totalScenes, fps, brandMeta) {
  const dur = scene.durationSec;
  const acc = scene.accent || '#00D4FF';
  const acc2 = scene.accent_secondary || '#6366F1';
  const compId = scene.id;

  const htmlParts = [];
  const cssParts = [];
  const jsParts = [];

  const hasTopBeat = scene.beats.some((b) => (b.glide_to || scene.glide_to) === 'top');
  const hasBottomBeat = scene.beats.some((b) => (b.glide_to || scene.glide_to) !== 'top');
  htmlParts.push(`
    ${hasTopBeat ? `<div class="scrim-top" data-layout-ignore></div>` : ''}
    ${hasBottomBeat ? `<div class="scrim-bottom" data-layout-ignore></div>` : ''}
  `);
  cssParts.push(`
    .scrim-top {
      position: absolute; left: 0; right: 0; top: 0; height: 470px; pointer-events: none;
      background: linear-gradient(180deg, rgba(4,7,16,0.68) 0%, rgba(4,7,16,0.28) 58%, rgba(4,7,16,0) 100%);
    }
    .scrim-bottom {
      position: absolute; left: 0; right: 0; top: 1120px; height: 640px; pointer-events: none;
      background: linear-gradient(180deg, rgba(4,7,16,0) 0%, rgba(4,7,16,0.52) 32%, rgba(4,7,16,0.72) 72%, rgba(4,7,16,0.18) 100%);
    }
  `);

  scene.beats.forEach((beat, bIdx) => {
    const bid = `s${sceneIndex}-b${bIdx}`;
    const bStart = Math.max(bIdx === 0 ? 0.0 : 0.25, beat.startSec);
    const bEnd = Math.min(dur, beat.endSec);
    const bDur = Math.max(1.0, bEnd - bStart);
    const isTop = (beat.glide_to || scene.glide_to) === 'top';
    const slotTop = isTop ? 212 : 1225;
    const isLastBeat = bIdx === scene.beats.length - 1;
    const shouldHoldToEnd = Boolean(beat.hold) || (beat.widget === 'follow_cta' && beat.hold !== false && dur - bEnd <= 0.35 && bDur <= 10.5);
    const exitDur = 0.22;
    const exitAt = Math.max(bStart + 0.85, bEnd - exitDur);
    const shouldExit = !shouldHoldToEnd || !isLastBeat;
    const wType = beat.widget || 'highlight_pill';

    if (wType === 'hero_title') {
      const words = String(beat.value || '').split(/\s+/).filter(Boolean);
      const isOpening = sceneIndex === 0;
      const yPos = isTop ? 212 : 1225;
      htmlParts.push(`
        <div id="${bid}" class="hero-stage" style="top:${yPos}px;">
          <div class="hero-pin" id="${bid}-pin" data-layout-ignore>
            <span class="dot"></span>
            <span>${escHtml(beat.badge || 'LIVE SITE TOUR')}</span>
          </div>
          <h1 class="hero-words" id="${bid}-words">
            ${words.map((w, wi) => `<span class="hw" id="${bid}-w${wi}">${escHtml(w)}</span>`).join(' ')}
          </h1>
          <div class="hero-bar-wrap"><div class="hero-bar" id="${bid}-bar"></div></div>
          <div class="hero-sub" id="${bid}-sub">${escHtml(beat.sub || '')}</div>
        </div>
      `);
      cssParts.push(`
        #${bid} {
          position: absolute; left: 44px; width: 840px; pointer-events: none; opacity: 0;
          padding: 20px 28px; border-radius: 24px;
          background: linear-gradient(135deg, rgba(8,12,24,0.90), rgba(14,22,42,0.86));
          border: 2px solid ${acc}88; box-shadow: 0 24px 56px rgba(0,0,0,0.58);
        }
        #${bid} .hero-pin {
          display: inline-flex; align-items: center; gap: 10px; padding: 6px 14px; border-radius: 999px;
          background: ${acc}24; border: 1.5px solid ${acc};
          font-family: "Space Mono", monospace; font-size: 20px; font-weight: 700; letter-spacing: 0.1em; color: #ffffff; margin-bottom: 10px;
        }
        #${bid} .hero-pin .dot { width: 10px; height: 10px; border-radius: 50%; background: ${acc}; display: inline-block; }
        #${bid} .hero-words { font-family: "Montserrat", "Outfit", sans-serif; font-weight: 900; font-size: 48px; line-height: 1.06; letter-spacing: -0.02em; color: #ffffff; overflow: visible; }
        #${bid} .hw { display: inline-block; }
        #${bid} .hero-bar-wrap { margin: 10px 0 9px; width: 100%; height: 4px; background: rgba(255,255,255,0.16); border-radius: 4px; overflow: hidden; }
        #${bid} .hero-bar { width: 100%; height: 100%; background: linear-gradient(90deg, ${acc}, ${acc2}); transform-origin: left center; }
        #${bid} .hero-sub { font-size: 28px; font-weight: 600; color: #e2e8f0; letter-spacing: 0.015em; line-height: 1.22; }
      `);
      const tIn = isOpening ? 0.0 : bStart;
      jsParts.push(`
        ${isOpening
          ? `tl.fromTo("#${bid}", { opacity: 0.92, y: 12, scale: 0.98 }, { opacity: 1, y: 0, scale: 1, duration: 0.30, ease: "expo.out" }, 0.0);`
          : `tl.fromTo("#${bid}", { opacity: 0, y: 36, scale: 0.96 }, { opacity: 1, y: 0, scale: 1, duration: 0.42, ease: "expo.out" }, ${tIn.toFixed(3)});`}
        ${words.map((_, wi) => `
          tl.fromTo("#${bid}-w${wi}", { opacity: ${isOpening ? 0.85 : 0}, filter: "blur(${isOpening ? 2 : 8}px)", y: ${isOpening ? 4 : 12} }, { opacity: 1, filter: "blur(0px)", y: 0, duration: 0.22, ease: "power4.out" }, ${(tIn + (isOpening ? 0.02 : 0.05) + wi * 0.075).toFixed(3)});
        `).join('')}
        tl.fromTo("#${bid}-bar", { scaleX: ${isOpening ? 0.35 : 0} }, { scaleX: 1, duration: 0.50, ease: "power3.out" }, ${(tIn + (isOpening ? 0.05 : 0.14)).toFixed(3)});
        tl.fromTo("#${bid}-sub", { opacity: ${isOpening ? 0.8 : 0}, y: ${isOpening ? 4 : 8} }, { opacity: 1, y: 0, duration: 0.35, ease: "power3.out" }, ${(tIn + (isOpening ? 0.08 : 0.24)).toFixed(3)});
        ${shouldExit ? `tl.to("#${bid}", { opacity: 0, y: 18, duration: ${exitDur}, ease: "power3.in" }, ${exitAt.toFixed(3)});` : ''}
      `);
    } else if (wType === 'route_tracker') {
      const targetVal = Number(beat.count_to || 500);
      const suffix = beat.count_suffix || 'M';
      htmlParts.push(`
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
        </div>
      `);
      cssParts.push(`
        #${bid} {
          position: absolute; left: 44px; width: 840px; padding: 18px 26px; border-radius: 24px; opacity: 0;
          background: rgba(8, 12, 24, 0.90); border: 2px solid ${acc}99;
          box-shadow: 0 22px 54px rgba(0,0,0,0.58); pointer-events: none;
        }
        #${bid} .route-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
        #${bid} .route-eta { font-family: "Space Mono", monospace; font-size: 20px; font-weight: 700; color: #38bdf8; }
        #${bid} .route-val { font-family: "Montserrat", sans-serif; font-weight: 900; font-size: 54px; line-height: 1.04; color: #ffffff; margin-bottom: 4px; }
        #${bid} .route-svg { width: 100%; height: 64px; overflow: visible; }
        #${bid} .route-labels { display: flex; justify-content: space-between; font-size: 22px; font-weight: 800; letter-spacing: 0.06em; color: #e2e8f0; margin-top: 2px; }
      `);
      jsParts.push(`
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
            onUpdate: () => { if (numEl) numEl.textContent = Math.round(obj.v).toLocaleString(); }
          }, ${(bStart + 0.10).toFixed(3)});
          ${shouldExit ? `tl.to("#${bid}", { opacity: 0, y: ${isTop ? -20 : 20}, duration: ${exitDur}, ease: "power3.in" }, ${exitAt.toFixed(3)});` : ''}
        })();
      `);
    } else if (wType === 'growth_curve') {
      htmlParts.push(`
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
            <defs>
              <linearGradient id="${bid}-gfill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="${acc}" stop-opacity="0.38"/>
                <stop offset="100%" stop-color="${acc}" stop-opacity="0"/>
              </linearGradient>
            </defs>
            <line x1="20" y1="100" x2="780" y2="100" stroke="rgba(255,255,255,0.20)" stroke-width="2" stroke-dasharray="6 6"/>
            <path id="${bid}-area" d="M 30 96 C 180 94, 300 72, 460 44 C 580 22, 690 14, 770 10 L 770 100 L 30 100 Z" fill="url(#${bid}-gfill)" opacity="0"/>
            <path id="${bid}-curve" d="M 30 96 C 180 94, 300 72, 460 44 C 580 22, 690 14, 770 10" fill="none" stroke="${acc}" stroke-width="8" stroke-linecap="round" pathLength="100" stroke-dasharray="100 120" stroke-dashoffset="110"/>
            <circle id="${bid}-pt1" cx="30" cy="96" r="9" fill="#ffffff" stroke="${acc}" stroke-width="4" opacity="0"/>
            <circle id="${bid}-pt2" cx="460" cy="44" r="9" fill="#ffffff" stroke="${acc}" stroke-width="4" opacity="0"/>
            <circle id="${bid}-pt3" cx="770" cy="10" r="12" fill="${acc2}" stroke="#ffffff" stroke-width="4" opacity="0"/>
          </svg>
        </div>
      `);
      cssParts.push(`
        #${bid} {
          position: absolute; left: 44px; width: 840px; padding: 18px 26px; border-radius: 24px; opacity: 0;
          background: rgba(8, 12, 24, 0.90); border: 2px solid ${acc}99;
          box-shadow: 0 22px 54px rgba(0,0,0,0.58); pointer-events: none;
        }
        #${bid} .gc-head { display: flex; justify-content: space-between; align-items: flex-start; gap: 14px; margin-bottom: 10px; }
        #${bid} .gc-title { font-family: "Montserrat", sans-serif; font-weight: 900; font-size: 42px; line-height: 1.06; color: #ffffff; }
        #${bid} .gc-sub { font-size: 28px; font-weight: 600; color: #cbd5e1; margin-top: 4px; }
        #${bid} .gc-tag { padding: 8px 16px; border-radius: 14px; font-family: "Space Mono", monospace; font-weight: 700; font-size: 20px; color: #090d16; background: linear-gradient(135deg, ${acc}, #ffffff); white-space: nowrap; }
        #${bid} .gc-svg { width: 100%; height: 96px; overflow: visible; }
      `);
      jsParts.push(`
        tl.fromTo("#${bid}", { opacity: 0, y: 34, scale: 0.94 }, { opacity: 1, y: 0, scale: 1, duration: 0.40, ease: "expo.out" }, ${bStart.toFixed(3)});
        tl.fromTo("#${bid}-curve", { strokeDashoffset: 110 }, { strokeDashoffset: 0, duration: 1.15, ease: "power2.inOut" }, ${(bStart + 0.16).toFixed(3)});
        tl.fromTo("#${bid}-area", { opacity: 0 }, { opacity: 1, duration: 0.85, ease: "power2.out" }, ${(bStart + 0.45).toFixed(3)});
        tl.fromTo("#${bid}-pt1", { opacity: 0, scale: 0 }, { opacity: 1, scale: 1, duration: 0.22, ease: "back.out(1.6)" }, ${(bStart + 0.18).toFixed(3)});
        tl.fromTo("#${bid}-pt2", { opacity: 0, scale: 0 }, { opacity: 1, scale: 1, duration: 0.22, ease: "back.out(1.6)" }, ${(bStart + 0.72).toFixed(3)});
        tl.fromTo("#${bid}-pt3", { opacity: 0, scale: 0 }, { opacity: 1, scale: 1, duration: 0.26, ease: "back.out(1.8)" }, ${(bStart + 1.18).toFixed(3)});
        tl.fromTo("#${bid}-tag", { opacity: 0, scale: 0.8 }, { opacity: 1, scale: 1, duration: 0.35, ease: "back.out(1.6)" }, ${(bStart + 1.10).toFixed(3)});
        ${shouldExit ? `tl.to("#${bid}", { opacity: 0, y: 20, duration: ${exitDur}, ease: "power3.in" }, ${exitAt.toFixed(3)});` : ''}
      `);
    } else if (wType === 'dual_metric') {
      htmlParts.push(`
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
        </div>
      `);
      cssParts.push(`
        #${bid} { position: absolute; left: 44px; width: 840px; pointer-events: none; opacity: 0; }
        #${bid} .dual-badge { margin-bottom: 10px; }
        #${bid} .dual-grid { display: flex; gap: 18px; width: 100%; }
        #${bid} .dual-wing { flex: 1; padding: 18px 22px; border-radius: 22px; background: rgba(8, 12, 24, 0.90); border: 2px solid; box-shadow: 0 20px 48px rgba(0,0,0,0.55); }
        #${bid} .dw-k { font-family: "Space Mono", monospace; font-size: 20px; font-weight: 700; color: #94a3b8; letter-spacing: 0.08em; margin-bottom: 6px; }
        #${bid} .dw-v { font-family: "Montserrat", sans-serif; font-size: 40px; font-weight: 900; color: #ffffff; line-height: 1.05; }
      `);
      jsParts.push(`
        tl.fromTo("#${bid}", { opacity: 0 }, { opacity: 1, duration: 0.14 }, ${bStart.toFixed(3)});
        tl.fromTo("#${bid}-left", { opacity: 0, x: -70, filter: "blur(6px)" }, { opacity: 1, x: 0, filter: "blur(0px)", duration: 0.42, ease: "expo.out" }, ${bStart.toFixed(3)});
        tl.fromTo("#${bid}-right", { opacity: 0, x: 70, filter: "blur(6px)" }, { opacity: 1, x: 0, filter: "blur(0px)", duration: 0.42, ease: "expo.out" }, ${(bStart + 0.16).toFixed(3)});
        ${shouldExit ? `tl.to("#${bid}", { opacity: 0, scale: 0.96, duration: ${exitDur}, ease: "power3.in" }, ${exitAt.toFixed(3)});` : ''}
      `);
    } else if (wType === 'blueprint_draw') {
      const areaTo = Number(beat.count_to || 1200);
      htmlParts.push(`
        <div id="${bid}" class="bp-card" style="top:${isTop ? 204 : 1195}px;">
          <div class="bp-head">
            <span class="eyebrow" data-layout-ignore style="border:1.5px solid ${acc};">${escHtml(beat.badge || 'PLOT DIMENSIONS')}</span>
            <span class="bp-dims" data-layout-ignore>${escHtml(beat.width_label || '30 FT')} × ${escHtml(beat.depth_label || '40 FT')}</span>
          </div>
          <div class="bp-body">
            <svg class="bp-rect-svg" viewBox="0 0 260 210" data-layout-ignore>
              <defs>
                <pattern id="${bid}-grid" width="20" height="20" patternUnits="userSpaceOnUse">
                  <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(255,255,255,0.14)" stroke-width="1"/>
                </pattern>
              </defs>
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
        </div>
      `);
      cssParts.push(`
        #${bid} {
          position: absolute; left: 44px; width: 840px; padding: 18px 24px; border-radius: 24px; opacity: 0;
          background: rgba(8, 12, 24, 0.91); border: 2px solid ${acc};
          box-shadow: 0 22px 54px rgba(0,0,0,0.62); pointer-events: none;
        }
        #${bid} .bp-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
        #${bid} .bp-dims { font-family: "Space Mono", monospace; font-size: 22px; font-weight: 700; color: ${acc}; }
        #${bid} .bp-body { display: flex; align-items: center; gap: 18px; }
        #${bid} .bp-rect-svg { width: 205px; height: 165px; flex-shrink: 0; }
        #${bid} .bp-big { font-family: "Montserrat", sans-serif; font-weight: 900; font-size: 62px; color: #ffffff; line-height: 1.0; }
        #${bid} .bp-unit { font-size: 30px; color: ${acc}; font-weight: 800; }
        #${bid} .bp-sub { font-size: 28px; font-weight: 600; color: #cbd5e1; margin-top: 8px; line-height: 1.22; }
      `);
      jsParts.push(`
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
        })();
      `);
    } else if (wType === 'vastu_compass') {
      htmlParts.push(`
        <div id="${bid}-spot" class="yt-hl" data-layout-ignore></div>
        <div id="${bid}" class="compass-card" style="top:${slotTop}px;">
          <div class="comp-dial-wrap">
            <svg class="comp-svg" viewBox="0 0 180 180" data-layout-ignore>
              <circle cx="90" cy="90" r="56" fill="rgba(255,255,255,0.06)" stroke="${acc}" stroke-width="3.5" stroke-dasharray="9 7"/>
              <text x="90" y="21" text-anchor="middle" fill="#cbd5e1" font-family="Space Mono" font-size="18" font-weight="700">N</text>
              <text x="163" y="96" text-anchor="middle" fill="${acc}" font-family="Space Mono" font-size="24" font-weight="700">E</text>
              <text x="90" y="170" text-anchor="middle" fill="#cbd5e1" font-family="Space Mono" font-size="18" font-weight="700">S</text>
              <text x="17" y="96" text-anchor="middle" fill="#cbd5e1" font-family="Space Mono" font-size="18" font-weight="700">W</text>
              <g id="${bid}-needle" style="transform-origin:90px 90px;">
                <polygon points="90,90 138,90 100,77" fill="${acc}"/>
                <polygon points="90,90 138,90 100,103" fill="${acc2}"/>
                <circle cx="90" cy="90" r="9" fill="#ffffff"/>
              </g>
            </svg>
          </div>
          <div class="comp-copy">
            <span class="eyebrow" data-layout-ignore style="border:1.5px solid ${acc}; margin-bottom:8px;">${escHtml(beat.badge || 'FACING & VASTU')}</span>
            <div class="comp-val">${escHtml(beat.value || 'EAST FACING')}</div>
            <div class="comp-sub">${escHtml(beat.sub || '100% VASTU COMPLIANT')}</div>
          </div>
        </div>
      `);
      cssParts.push(`
        #${bid}-spot {
          --yt-hl-x: 52%; --yt-hl-y: 44%; --yt-hl-rx: 46%; --yt-hl-ry: 32%;
          position: absolute; inset: 0; pointer-events: none; opacity: 0; background: rgba(5, 8, 16, 0.16);
          -webkit-mask-image: radial-gradient(ellipse var(--yt-hl-rx) var(--yt-hl-ry) at var(--yt-hl-x) var(--yt-hl-y), transparent 0%, transparent 58%, black 92%);
          mask-image: radial-gradient(ellipse var(--yt-hl-rx) var(--yt-hl-ry) at var(--yt-hl-x) var(--yt-hl-y), transparent 0%, transparent 58%, black 92%);
        }
        #${bid} {
          position: absolute; left: 44px; width: 840px; padding: 18px 26px; border-radius: 24px; opacity: 0;
          display: flex; align-items: center; gap: 22px; background: rgba(8, 12, 24, 0.91); border: 2px solid ${acc};
          box-shadow: 0 22px 54px rgba(0,0,0,0.62); pointer-events: none;
        }
        #${bid} .comp-svg { width: 150px; height: 150px; flex-shrink: 0; }
        #${bid} .comp-val { font-family: "Montserrat", sans-serif; font-weight: 900; font-size: 48px; color: #ffffff; line-height: 1.05; }
        #${bid} .comp-sub { font-size: 28px; font-weight: 600; color: #fde68a; margin-top: 6px; }
      `);
      jsParts.push(`
        tl.fromTo("#${bid}-spot", { opacity: 0 }, { opacity: 1, duration: 0.40, ease: "power2.out" }, ${bStart.toFixed(3)});
        tl.fromTo("#${bid}", { opacity: 0, y: 34, scale: 0.94 }, { opacity: 1, y: 0, scale: 1, duration: 0.40, ease: "expo.out" }, ${bStart.toFixed(3)});
        tl.fromTo("#${bid}-needle", { rotation: -210 }, { rotation: 0, duration: 1.15, ease: "back.out(1.4)" }, ${(bStart + 0.14).toFixed(3)});
        ${shouldExit ? `
          tl.to("#${bid}-spot", { opacity: 0, duration: 0.24, ease: "power2.in" }, ${exitAt.toFixed(3)});
          tl.to("#${bid}", { opacity: 0, y: 20, duration: ${exitDur}, ease: "power3.in" }, ${exitAt.toFixed(3)});
        ` : ''}
      `);
    } else if (wType === 'checklist_live') {
      const items = beat.items || ['TUDA / CLEAR TITLE', 'DRINKING WATER & BOREWELL', '3-PHASE ELECTRICITY'];
      const itemGap = Math.min(1.2, (bDur * 0.55) / Math.max(1, items.length));
      htmlParts.push(`
        <div id="${bid}" class="chk-stage" style="top:${isTop ? 204 : 1190}px;">
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
              </div>
            `).join('')}
          </div>
        </div>
      `);
      cssParts.push(`
        #${bid} {
          position: absolute; left: 44px; width: 840px; padding: 18px 24px; border-radius: 24px; opacity: 0;
          background: rgba(8, 12, 24, 0.91); border: 2px solid ${acc}99;
          box-shadow: 0 22px 54px rgba(0,0,0,0.60); pointer-events: none;
        }
        #${bid} .chk-head { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 10px; }
        #${bid} .chk-title { font-family: "Space Mono", monospace; font-size: 20px; font-weight: 700; color: ${acc}; }
        #${bid} .chk-list { display: flex; flex-direction: column; gap: 8px; }
        #${bid} .chk-item { display: flex; align-items: center; gap: 14px; padding: 10px 14px; border-radius: 14px; background: rgba(255,255,255,0.06); border: 1.5px solid rgba(255,255,255,0.08); opacity: 0.42; }
        #${bid} .chk-ring { width: 38px; height: 38px; flex-shrink: 0; }
        #${bid} .chk-txt { font-family: "Montserrat", sans-serif; font-weight: 800; font-size: 28px; color: #ffffff; letter-spacing: 0.015em; }
      `);
      jsParts.push(`
        tl.fromTo("#${bid}", { opacity: 0, y: 32 }, { opacity: 1, y: 0, duration: 0.38, ease: "expo.out" }, ${bStart.toFixed(3)});
        ${items.map((_, idx) => {
          const at = bStart + 0.14 + idx * itemGap;
          return `
            tl.fromTo("#${bid}-i${idx}", { opacity: 0.42, x: -12, borderColor: "rgba(255,255,255,0.08)" }, { opacity: 1, x: 0, backgroundColor: "rgba(16,185,129,0.16)", borderColor: "#10B981", duration: 0.34, ease: "expo.out" }, ${at.toFixed(3)});
            tl.fromTo("#${bid}-t${idx}", { strokeDashoffset: 110 }, { strokeDashoffset: 0, duration: 0.34, ease: "power2.out" }, ${(at + 0.12).toFixed(3)});
          `;
        }).join('')}
        ${shouldExit ? `tl.to("#${bid}", { opacity: 0, y: 20, duration: ${exitDur}, ease: "power3.in" }, ${exitAt.toFixed(3)});` : ''}
      `);
    } else if (wType === 'verified_shield') {
      htmlParts.push(`
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
        </div>
      `);
      cssParts.push(`
        #${bid} {
          position: absolute; left: 44px; width: 840px; padding: 20px 26px; border-radius: 24px; opacity: 0;
          display: flex; align-items: center; gap: 22px; background: rgba(8, 12, 24, 0.92); border: 2px solid #10B981;
          box-shadow: 0 22px 54px rgba(0,0,0,0.62); pointer-events: none;
        }
        #${bid} .sh-svg { width: 82px; height: 86px; flex-shrink: 0; }
        #${bid} .sh-val { font-family: "Montserrat", sans-serif; font-weight: 900; font-size: 42px; color: #ffffff; line-height: 1.05; }
        #${bid} .sh-sub { font-size: 28px; font-weight: 600; color: #a7f3d0; margin-top: 6px; }
      `);
      jsParts.push(`
        tl.fromTo("#${bid}", { opacity: 0, y: 34, scale: 0.92 }, { opacity: 1, y: 0, scale: 1, duration: 0.40, ease: "expo.out" }, ${bStart.toFixed(3)});
        tl.fromTo("#${bid}-sp", { strokeDashoffset: 110 }, { strokeDashoffset: 0, duration: 0.65, ease: "power2.inOut" }, ${(bStart + 0.1).toFixed(3)});
        tl.fromTo("#${bid}-chk", { strokeDashoffset: 110 }, { strokeDashoffset: 0, duration: 0.42, ease: "back.out(1.4)" }, ${(bStart + 0.48).toFixed(3)});
        ${shouldExit ? `tl.to("#${bid}", { opacity: 0, y: 20, duration: ${exitDur}, ease: "power3.in" }, ${exitAt.toFixed(3)});` : ''}
      `);
    } else if (wType === 'price_odometer') {
      const pTo = Number(beat.count_to || 1850);
      htmlParts.push(`
        <div id="${bid}" class="price-hero" style="top:${slotTop}px;">
          <span class="eyebrow" data-layout-ignore style="border:1.5px solid ${acc}; margin-bottom:10px;">${escHtml(beat.badge || 'LAUNCH RATE')}</span>
          <div class="ph-main">
            <span class="ph-cur">${escHtml(beat.count_prefix || '₹')}</span><span id="${bid}-val" class="num">0</span><span class="ph-suf">${escHtml(beat.count_suffix || ' / SQ.FT')}</span>
          </div>
          <div class="ph-sub">${escHtml(beat.sub || '')}</div>
        </div>
      `);
      cssParts.push(`
        #${bid} {
          position: absolute; left: 44px; width: 840px; padding: 20px 28px; border-radius: 26px; opacity: 0;
          background: linear-gradient(135deg, rgba(16,12,8,0.92), rgba(28,18,6,0.90));
          border: 2.5px solid ${acc}; box-shadow: 0 24px 60px rgba(0,0,0,0.68); pointer-events: none;
        }
        #${bid} .ph-main { font-family: "Montserrat", sans-serif; font-weight: 900; font-size: 66px; line-height: 1.04; color: #ffffff; }
        #${bid} .ph-cur { color: ${acc}; }
        #${bid} .ph-suf { font-size: 32px; color: #fde68a; font-weight: 800; }
        #${bid} .ph-sub { font-size: 28px; font-weight: 600; color: #fef3c7; margin-top: 8px; }
      `);
      jsParts.push(`
        (function() {
          const obj = { v: ${Number(beat.count_from || 0)} };
          const el = document.getElementById("${bid}-val");
          tl.fromTo("#${bid}", { opacity: 0, scale: 0.90, filter: "blur(8px)" }, { opacity: 1, scale: 1, filter: "blur(0px)", duration: 0.40, ease: "expo.out" }, ${bStart.toFixed(3)});
          tl.to(obj, {
            v: ${pTo}, duration: 1.35, ease: "power4.out",
            onUpdate: () => { if (el) el.textContent = Math.round(obj.v).toLocaleString(); }
          }, ${(bStart + 0.08).toFixed(3)});
          ${shouldExit ? `tl.to("#${bid}", { opacity: 0, y: 18, duration: ${exitDur}, ease: "power3.in" }, ${exitAt.toFixed(3)});` : ''}
        })();
      `);
    } else if (wType === 'price_calc') {
      const cTo = Number(beat.count_to || 22.2);
      const dec = Number(beat.count_decimals || 1);
      htmlParts.push(`
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
        </div>
      `);
      cssParts.push(`
        #${bid} {
          position: absolute; left: 44px; width: 840px; padding: 18px 26px; border-radius: 24px; opacity: 0;
          background: rgba(8, 12, 24, 0.92); border: 2px solid ${acc2};
          box-shadow: 0 22px 54px rgba(0,0,0,0.62); pointer-events: none;
        }
        #${bid} .calc-row { display: flex; flex-wrap: wrap; align-items: center; gap: 10px; }
        #${bid} .c-chip { padding: 8px 16px; border-radius: 14px; background: rgba(255,255,255,0.12); font-family: "Space Mono", monospace; font-size: 28px; font-weight: 700; color: #ffffff; }
        #${bid} .c-op { font-size: 30px; font-weight: 900; color: ${acc}; }
        #${bid} .c-res { padding: 8px 20px; border-radius: 14px; background: linear-gradient(135deg, ${acc}, ${acc2}); font-family: "Montserrat", sans-serif; font-size: 32px; font-weight: 900; color: #ffffff; }
        #${bid} .calc-sub { font-size: 28px; font-weight: 600; color: #e2e8f0; margin-top: 10px; }
      `);
      jsParts.push(`
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
        })();
      `);
    } else if (wType === 'follow_cta' || wType === 'interactive_cta') {
      const isFollow = wType === 'follow_cta';
      const logoRel = brandMeta.hfLogoRelPath;
      const headline = beat.value || (isFollow ? brandMeta.follow_headline || 'FOLLOW OUR PAGE' : 'BOOK FREE SITE VISIT');
      const handleTxt = beat.handle || brandMeta.page_handle || '@tumkursites';
      const btnText = beat.button_text || (isFollow ? brandMeta.follow_button_text || `+ FOLLOW ${handleTxt}` : headline);
      const subTxt = beat.sub || (isFollow ? brandMeta.follow_subtext : 'EXPERIENCE THE PROPERTY LIVE IN PERSON');

      htmlParts.push(`
        <div id="${bid}" class="cta-stage" style="top:${isTop ? 204 : 1192}px;">
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
        </div>
      `);
      cssParts.push(`
        #${bid} {
          position: absolute; left: 44px; width: 840px; padding: 18px 26px; border-radius: 24px; opacity: 0;
          background: rgba(8, 12, 24, 0.93); border: 2px solid ${acc};
          box-shadow: 0 22px 56px rgba(0,0,0,0.64); pointer-events: none;
        }
        #${bid} .cta-top-row { display: flex; align-items: center; gap: 18px; margin-bottom: 12px; }
        #${bid} .cta-logo { width: 84px; height: 84px; border-radius: 50%; object-fit: cover; padding: 2px; background: #faf9f6; border: 2px solid ${acc}; flex-shrink: 0; }
        #${bid} .cta-head { font-family: "Montserrat", sans-serif; font-weight: 900; font-size: 36px; color: #ffffff; line-height: 1.06; }
        #${bid} .cta-handle { font-family: "Space Mono", monospace; font-size: 28px; font-weight: 700; color: ${acc}; margin-top: 2px; }
        #${bid} .cta-btn-wrap {
          position: relative; display: flex; align-items: center; justify-content: center;
          padding: 16px 64px 16px 26px; border-radius: 18px; overflow: visible;
          background: linear-gradient(135deg, #0369a1, #047857); border: 2px solid ${acc};
          box-shadow: 0 12px 32px ${acc}44;
        }
        #${bid} .cta-btn-txt { font-family: "Montserrat", sans-serif; font-weight: 900; font-size: 34px; color: #ffffff; letter-spacing: 0.02em; text-align: center; }
        #${bid} .cta-ripple { position: absolute; width: 72px; height: 72px; border-radius: 50%; border: 4px solid #ffffff; opacity: 0; right: 20px; top: 50%; margin-top: -36px; pointer-events: none; }
        #${bid} .cta-cursor { position: absolute; width: 46px; height: 54px; right: 20px; top: 34px; opacity: 0; filter: drop-shadow(0 6px 12px rgba(0,0,0,0.5)); pointer-events: none; }
        #${bid} .cta-sub { font-size: 28px; font-weight: 600; color: #cbd5e1; margin-top: 10px; text-align: center; }
      `);
      const tapAt = bStart + Math.min(1.8, bDur * 0.34);
      jsParts.push(`
        tl.fromTo("#${bid}", { opacity: 0, y: 34, scale: 0.94 }, { opacity: 1, y: 0, scale: 1, duration: 0.40, ease: "expo.out" }, ${bStart.toFixed(3)});
        tl.fromTo("#${bid}-cur", { opacity: 0, x: 96, y: 74 }, { opacity: 1, x: 0, y: 0, duration: Math.max(0.45, ${(tapAt - bStart - 0.15).toFixed(3)}), ease: "power2.out" }, ${(bStart + 0.15).toFixed(3)});
        tl.to("#${bid}-btn", { scale: 0.94, duration: 0.10, ease: "power2.in" }, ${tapAt.toFixed(3)});
        tl.to("#${bid}-btn", { scale: 1.03, duration: 0.24, ease: "back.out(1.8)" }, ${(tapAt + 0.10).toFixed(3)});
        tl.fromTo("#${bid}-rip", { opacity: 0.95, scale: 0.25 }, { opacity: 0, scale: 2.2, duration: 0.55, ease: "power2.out" }, ${(tapAt + 0.05).toFixed(3)});
        tl.to("#${bid}-cur", { opacity: 0, duration: 0.35, ease: "power2.in" }, ${(tapAt + 1.4).toFixed(3)});
        ${shouldExit ? `tl.to("#${bid}", { opacity: 0, y: 20, duration: ${exitDur}, ease: "power3.in" }, ${exitAt.toFixed(3)});` : ''}
      `);
    } else {
      htmlParts.push(`
        <div id="${bid}" class="hl-card" style="top:${slotTop}px;">
          <div class="hl-top"><span class="eyebrow" data-layout-ignore style="border:1.5px solid ${acc};">${escHtml(beat.badge || 'HIGHLIGHT')}</span></div>
          <div class="hl-val"><span class="hl-sweep" id="${bid}-sw">${escHtml(beat.value || '')}</span></div>
          <div class="hl-sub">${escHtml(beat.sub || '')}</div>
        </div>
      `);
      cssParts.push(`
        #${bid} {
          position: absolute; left: 44px; width: 840px; padding: 20px 26px; border-radius: 24px; opacity: 0;
          background: rgba(8, 12, 24, 0.91); border: 2px solid ${acc};
          box-shadow: 0 22px 54px rgba(0,0,0,0.58); pointer-events: none;
        }
        #${bid} .hl-top { margin-bottom: 8px; }
        #${bid} .hl-val { font-family: "Montserrat", sans-serif; font-weight: 900; font-size: 44px; line-height: 1.08; color: #ffffff; }
        #${bid} .hl-sweep {
          background-image: linear-gradient(90deg, ${acc}44, ${acc2}44); background-repeat: no-repeat; background-size: 0% 100%;
          padding: 2px 10px; border-radius: 10px; -webkit-box-decoration-break: clone; box-decoration-break: clone;
        }
        #${bid} .hl-sub { font-size: 28px; font-weight: 600; color: #cbd5e1; margin-top: 8px; line-height: 1.22; }
      `);
      jsParts.push(`
        tl.fromTo("#${bid}", { opacity: 0, x: ${bIdx % 2 === 0 ? -42 : 42}, filter: "blur(6px)" }, { opacity: 1, x: 0, filter: "blur(0px)", duration: 0.40, ease: "expo.out" }, ${bStart.toFixed(3)});
        tl.to("#${bid}-sw", { backgroundSize: "100% 100%", duration: 0.65, ease: "power2.out" }, ${(bStart + 0.18).toFixed(3)});
        ${shouldExit ? `tl.to("#${bid}", { opacity: 0, y: 20, duration: ${exitDur}, ease: "power3.in" }, ${exitAt.toFixed(3)});` : ''}
      `);
    }
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
    </div>
  `;
  const locPillHtml = `
    <div class="loc-pill" data-layout-ignore>
      <span class="live-dot"></span>
      <span>${escHtml(timelineData.location_badge || 'SITE TOUR')}</span>
      <span class="eq-bars" aria-hidden="true">
        <i id="eq-0"></i><i id="eq-1"></i><i id="eq-2"></i><i id="eq-3"></i>
      </span>
    </div>
  `;
  const logoHtml = showLogo
    ? `
      <div class="brand-chip ${logoRight ? 'brand-corner-right' : 'brand-corner-left'}" data-layout-ignore>
        <img class="brand-logo" src="../${brandMeta.hfLogoRelPath}" alt="Brand Logo" />
      </div>
    `
    : '';

  const htmlBody = `
    <div class="hud-top">
      <div class="stories-bar">
        ${scenes.map((s, idx) => `<div class="sb-track"><div class="sb-fill" id="sb-${idx}" style="background:linear-gradient(90deg, ${s.accent}, ${s.accent_secondary});"></div></div>`).join('')}
      </div>
      <div class="hud-row">
        <div class="hud-left-cluster">
          ${logoRight ? counterHtml + locPillHtml : logoHtml + locPillHtml}
        </div>
        <div class="hud-right-cluster">
          ${logoRight ? logoHtml : counterHtml}
        </div>
      </div>
    </div>
  `;

  const styles = `
    .hud-top { position: absolute; left: 40px; right: 40px; top: 56px; pointer-events: none; }
    .stories-bar { display: flex; gap: 8px; width: 100%; height: 6px; margin-bottom: 12px; }
    .sb-track { flex: 1; height: 100%; background: rgba(255,255,255,0.28); border-radius: 99px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.4); }
    .sb-fill { width: 100%; height: 100%; transform-origin: left center; }
    .hud-row { display: flex; justify-content: space-between; align-items: flex-start; gap: 14px; }
    .hud-left-cluster { display: flex; align-items: center; gap: 10px; max-width: 820px; margin-top: 4px; }
    .hud-right-cluster { display: flex; align-items: center; justify-content: flex-end; flex-shrink: 0; }
    .brand-chip.brand-corner-right {
      width: 110px; height: 110px; border-radius: 50%; padding: 2px; overflow: hidden;
      background: #faf9f6; border: 2.5px solid rgba(255,255,255,0.92);
      display: flex; align-items: center; justify-content: center; box-shadow: 0 12px 30px rgba(0,0,0,0.55);
    }
    .brand-chip.brand-corner-left {
      width: 52px; height: 52px; border-radius: 50%; padding: 2px; overflow: hidden;
      background: #faf9f6; border: 2px solid rgba(255,255,255,0.85);
      display: flex; align-items: center; justify-content: center; box-shadow: 0 10px 26px rgba(0,0,0,0.45);
    }
    .brand-logo { width: 100%; height: 100%; object-fit: cover; border-radius: 50%; }
    .loc-pill {
      display: inline-flex; align-items: center; gap: 10px; padding: 9px 18px; border-radius: 999px;
      background: rgba(8, 12, 24, 0.88); border: 1.5px solid rgba(255,255,255,0.22);
      font-family: "Space Mono", monospace; font-size: 19px; font-weight: 700; letter-spacing: 0.08em; color: #ffffff;
      box-shadow: 0 10px 26px rgba(0,0,0,0.45); white-space: nowrap;
    }
    .live-dot { width: 10px; height: 10px; border-radius: 50%; background: #10B981; display: inline-block; flex-shrink: 0; }
    .eq-bars { display: inline-flex; align-items: flex-end; gap: 3px; height: 16px; margin-left: 4px; }
    .eq-bars i { width: 3.5px; height: 16px; border-radius: 2px; background: #38bdf8; display: block; transform-origin: bottom center; }
    .scene-counter {
      padding: 9px 15px; border-radius: 999px;
      background: rgba(8, 12, 24, 0.88); border: 1.5px solid rgba(255,255,255,0.22);
      font-family: "Space Mono", monospace; font-size: 19px; font-weight: 700; color: #38bdf8; flex-shrink: 0;
    }
  `;

  const scenesJson = JSON.stringify(scenes.map((s, idx) => ({ start: s.startSec, end: s.endSec, label: String(idx + 1).padStart(2, '0') })));
  const scriptBody = `
    const scCur = document.getElementById("sc-cur");
    const eqBars = [0, 1, 2, 3].map((i) => document.getElementById("eq-" + i));
    const sceneSpans = ${scenesJson};
    const updateCounter = () => {
      const t = tl.time();
      if (scCur) {
        let active = "01";
        for (let i = 0; i < sceneSpans.length; i++) {
          if (t >= sceneSpans[i].start - 0.01) active = sceneSpans[i].label;
        }
        if (scCur.textContent !== active) scCur.textContent = active;
      }
      for (let b = 0; b < eqBars.length; b++) {
        if (!eqBars[b]) continue;
        const v = 0.28 + 0.72 * Math.abs(Math.sin(t * (5.6 + b * 1.85) + b * 1.15));
        eqBars[b].style.transform = "scaleY(" + v.toFixed(2) + ")";
      }
    };
    tl.eventCallback("onUpdate", updateCounter);
    ${scenes.map((s, idx) => `
      gsap.set("#sb-${idx}", { scaleX: 0 });
      tl.fromTo("#sb-${idx}", { scaleX: 0 }, { scaleX: 1, duration: ${s.durationSec.toFixed(3)}, ease: "none" }, ${s.startSec.toFixed(3)});
    `).join('\n')}
  `;

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
      htmlParts.push(`<div id="${tid}" class="tr-whip" style="background:linear-gradient(90deg, transparent, ${acc}cc, #ffffffdd, ${acc}cc, transparent);"></div>`);
      jsParts.push(`
        tl.fromTo("#${tid}", { opacity: 0, x: -1200 }, { opacity: 0.92, x: 0, duration: 0.16, ease: "power3.in" }, ${(cutT - 0.16).toFixed(3)});
        tl.to("#${tid}", { opacity: 0, x: 1200, duration: 0.22, ease: "power3.out" }, ${(cutT + 0.01).toFixed(3)});
      `);
    } else if (kind === 1) {
      htmlParts.push(`<div id="${tid}" class="tr-ring" style="border-color:${acc};"></div>`);
      jsParts.push(`
        tl.fromTo("#${tid}", { opacity: 0, scale: 0.15 }, { opacity: 0.95, scale: 1.5, duration: 0.20, ease: "expo.out" }, ${(cutT - 0.08).toFixed(3)});
        tl.to("#${tid}", { opacity: 0, scale: 1.9, duration: 0.16, ease: "power2.in" }, ${(cutT + 0.14).toFixed(3)});
      `);
    } else if (kind === 2) {
      htmlParts.push(`<div id="${tid}" class="tr-slice" style="background:linear-gradient(115deg, transparent 35%, ${acc}bb 48%, #ffffff 50%, ${acc}bb 52%, transparent 65%);"></div>`);
      jsParts.push(`
        tl.fromTo("#${tid}", { opacity: 0, x: -900, y: -400 }, { opacity: 0.9, x: 900, y: 400, duration: 0.36, ease: "power2.inOut" }, ${(cutT - 0.14).toFixed(3)});
        tl.set("#${tid}", { opacity: 0 }, ${(cutT + 0.24).toFixed(3)});
      `);
    } else {
      htmlParts.push(`<div id="${tid}" class="tr-bloom" style="background:radial-gradient(circle at 50% 50%, ${acc}66 0%, rgba(255,255,255,0.22) 35%, transparent 72%);"></div>`);
      jsParts.push(`
        tl.fromTo("#${tid}", { opacity: 0, scale: 0.7 }, { opacity: 0.95, scale: 1.35, duration: 0.17, ease: "power2.out" }, ${(cutT - 0.12).toFixed(3)});
        tl.to("#${tid}", { opacity: 0, scale: 1.8, duration: 0.22, ease: "power3.in" }, ${(cutT + 0.06).toFixed(3)});
      `);
    }
  }

  const styles = `
    .tr-whip { position: absolute; left: 0; top: 0; width: 1080px; height: 1920px; opacity: 0; pointer-events: none; }
    .tr-ring { position: absolute; left: 190px; top: 610px; width: 700px; height: 700px; border-radius: 50%; border: 18px solid; opacity: 0; pointer-events: none; }
    .tr-slice { position: absolute; left: -300px; top: -300px; width: 1680px; height: 2520px; opacity: 0; pointer-events: none; }
    .tr-bloom { position: absolute; inset: 0; opacity: 0; pointer-events: none; }
  `;

  return wrapSubComp({ compId: 'transitions', dur, fps, htmlBody: htmlParts.join('\n'), styles, scriptBody: jsParts.join('\n') });
}

function buildCaptionGroups(scenes) {
  const groups = [];
  for (let sIdx = 0; sIdx < scenes.length; sIdx++) {
    const sc = scenes[sIdx];
    const words = sc.wordTimings || [];
    if (!words.length) continue;
    // Always keep captions in one crisp lower safe band (1525px) below card zone and above IG bottom chrome
    const slotY = 1525;
    let cur = [];
    for (let wi = 0; wi < words.length; wi++) {
      const w = words[wi];
      const next = words[wi + 1];
      cur.push(w);
      const hasPunct = /[.,!?]$/.test(w.text);
      const pause = next ? next.start - w.end : 0;
      const charCount = cur.reduce((a, b) => a + b.text.length, 0);
      if (cur.length >= 3 || charCount > 20 || hasPunct || pause > 0.24 || !next) {
        groups.push({
          y: slotY,
          acc: sc.accent || '#00D4FF',
          s: Number(Math.max(sc.startSec + 0.08, cur[0].globalStart).toFixed(3)),
          e: Number(Math.min(sc.endSec - 0.12, cur[cur.length - 1].globalEnd + 0.18).toFixed(3)),
          w: cur.map((cw) => ({
            t: cw.text,
            s: Number(Math.max(sc.startSec + 0.08, cw.globalStart).toFixed(3))
          }))
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
    .cap-group { position: absolute; left: 44px; width: 840px; display: flex; justify-content: flex-start; pointer-events: none; overflow: visible; opacity: 0; visibility: hidden; }
    .cap-pill { display: inline-flex; flex-wrap: wrap; column-gap: 18px; row-gap: 8px; align-items: center; padding: 11px 22px; border-radius: 16px; background: rgba(6, 10, 20, 0.90); border: 1.5px solid; box-shadow: 0 10px 28px rgba(0,0,0,0.52); overflow: visible; }
    .cap-w { font-family: "NirmalaKannada", "Inter", sans-serif; font-weight: 700; font-size: 31px; line-height: 1.32; letter-spacing: 0.015em; color: #cbd5e1; display: inline-block; padding: 0 2px; border-bottom: 3px solid transparent; }
  `;
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
      wordEls.forEach((we) => {
        tl.to(we.el, { color: "#ffffff", borderBottomColor: g.acc, y: -2, textShadow: "0 0 16px " + g.acc, duration: 0.10, ease: "power1.out" }, we.s);
      });
      tl.to(grp, { opacity: 0, duration: 0.10, ease: "power2.in" }, Math.max(g.s + 0.04, visEnd - 0.10));
      tl.set(grp, { opacity: 0, visibility: "hidden" }, visEnd);
    });
  `;
  return wrapSubComp({ compId: 'captions', dur, fps, htmlBody, styles, scriptBody });
}

function buildSfxSchedule(timelineData) {
  const cues = [];
  const scenes = timelineData.scenes;
  for (let i = 1; i < scenes.length; i++) {
    const file = i % 2 === 1 ? 'assets/sfx/whoosh-short.mp3' : 'assets/sfx/whoosh.mp3';
    cues.push({ id: `sfx-cut-${i}`, track: 5, src: file, start: Math.max(0.05, scenes[i].startSec - 0.08), dur: 0.56, vol: 0.28 });
  }
  let lastTrack6End = -1;
  scenes.forEach((sc, i) => {
    sc.beats.forEach((b, bi) => {
      const globalBeatStart = sc.startSec + b.startSec;
      let item = null;
      if (b.widget === 'price_odometer') {
        item = { id: `sfx-price-${i}`, track: 6, src: 'assets/sfx/impact-bass-1.mp3', start: globalBeatStart + 0.04, dur: 1.8, vol: 0.30 };
      } else if (b.widget === 'verified_shield') {
        item = { id: `sfx-shield-${i}`, track: 6, src: 'assets/sfx/chime.mp3', start: globalBeatStart + 0.18, dur: 2.2, vol: 0.26 };
      } else if (b.widget === 'follow_cta' || b.widget === 'interactive_cta') {
        const tapAt = globalBeatStart + Math.min(1.9, (b.endSec - b.startSec) * 0.38);
        item = { id: `sfx-cta-${i}`, track: 6, src: 'assets/sfx/click.mp3', start: tapAt + 0.03, dur: 0.36, vol: 0.34 };
      } else if (b.widget === 'vastu_compass') {
        item = { id: `sfx-ping-${i}`, track: 6, src: 'assets/sfx/ping.mp3', start: globalBeatStart + 0.20, dur: 1.2, vol: 0.24 };
      } else if (bi === 0 && i > 0) {
        item = { id: `sfx-pop-${i}`, track: 6, src: 'assets/sfx/pop.mp3', start: globalBeatStart + 0.12, dur: 0.65, vol: 0.24 };
      }
      if (item && item.start > lastTrack6End + 0.1) {
        cues.push(item);
        lastTrack6End = item.start + item.dur;
      }
    });
  });
  return cues;
}

function generateRootHtml(timelineData, { transparentOverlay = false } = {}) {
  const dur = timelineData.totalDurationSec;
  const fps = timelineData.fps;
  const scenes = timelineData.scenes;
  const sfxCues = transparentOverlay ? [] : buildSfxSchedule(timelineData);
  const bgCss = transparentOverlay ? 'background: transparent;' : 'background: #060913;';

  const videoMarkup = transparentOverlay
    ? ''
    : scenes.map((s, idx) => `
      <div id="cam-wrap-${idx}" class="cam-wrap" data-layout-allow-overflow>
        <video id="vid-${idx}" class="clip bg-vid" src="${s.hfVideoRelPath}" muted playsinline data-start="${s.startSec.toFixed(3)}" data-duration="${s.durationSec.toFixed(3)}" data-track-index="0"></video>
      </div>
    `).join('\n');

  const audioMarkup =
    transparentOverlay || !timelineData.hfAudioRelPath
      ? ''
      : `
      <audio id="vo-master" class="clip" src="${timelineData.hfAudioRelPath}" data-start="0" data-duration="${dur.toFixed(3)}" data-volume="1" data-track-index="4"></audio>
      ${sfxCues.map((c) => `
        <audio id="${c.id}" class="clip" src="${c.src}" data-start="${c.start.toFixed(3)}" data-duration="${c.dur.toFixed(3)}" data-volume="${c.vol}" data-track-index="${c.track}"></audio>
      `).join('\n')}
    `;

  const camTweens = transparentOverlay
    ? ''
    : scenes.map((s, idx) => {
        const st = s.startSec;
        const d = s.durationSec;
        if (idx === 0) {
          return `tl.fromTo("#cam-wrap-0", { scale: 1.0, y: 0 }, { scale: 1.08, y: -22, duration: ${(d * 0.85).toFixed(3)}, ease: "power2.inOut" }, 0.15);`;
        }
        return `
          tl.fromTo("#cam-wrap-${idx}", { scale: 1.0, x: 0, y: 0 }, { scale: 1.08, x: ${idx % 2 === 0 ? -12 : 12}, y: -18, duration: ${(Math.min(7.5, d * 0.5)).toFixed(3)}, ease: "power2.inOut" }, ${(st + 0.35).toFixed(3)});
          tl.to("#cam-wrap-${idx}", { scale: 1.0, x: 0, y: 0, duration: ${(Math.min(5.0, d * 0.32)).toFixed(3)}, ease: "power2.inOut" }, ${(st + d * 0.62).toFixed(3)});
        `;
      }).join('\n');

  const compId = transparentOverlay ? 'hud-overlay-master' : 'main';

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
    html, body { width: 1080px; height: 1920px; margin: 0; overflow: hidden; ${bgCss} }
    #root { position: relative; width: 1080px; height: 1920px; overflow: hidden; ${bgCss} }
    .cam-wrap { position: absolute; inset: 0; overflow: hidden; }
    video.bg-vid { position: absolute; left: 0; top: 0; width: 1080px; height: 1920px; object-fit: cover; }
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
  <div id="root" data-composition-id="${compId}" data-start="0" data-duration="${dur.toFixed(3)}" data-fps="${fps}" data-width="1080" data-height="1920">
    ${transparentOverlay
      ? `<div id="ov-drv" class="clip" data-start="0" data-duration="${dur.toFixed(3)}" data-track-index="0" style="position:absolute;width:1px;height:1px;opacity:0;pointer-events:none"></div>`
      : '<div class="bg-grid-stage" data-layout-ignore></div>'}
    ${videoMarkup}
    ${scenes.map((s) => `
      <div id="${s.id}" class="comp-layer" data-composition-id="${s.id}" data-composition-src="compositions/${s.id}.html" data-start="${s.startSec.toFixed(3)}" data-duration="${s.durationSec.toFixed(3)}" data-track-index="1" data-width="1080" data-height="1920"></div>
    `).join('\n')}
    <div id="transitions" class="comp-layer" data-composition-id="transitions" data-composition-src="compositions/transitions.html" data-start="0" data-duration="${dur.toFixed(3)}" data-track-index="2" data-width="1080" data-height="1920"></div>
    <div id="hud_chrome" class="comp-layer" data-composition-id="hud_chrome" data-composition-src="compositions/hud_chrome.html" data-start="0" data-duration="${dur.toFixed(3)}" data-track-index="2" data-width="1080" data-height="1920"></div>
    <div id="captions" class="comp-layer" data-track-kind="captions" data-composition-id="captions" data-composition-src="compositions/captions.html" data-start="0" data-duration="${dur.toFixed(3)}" data-track-index="3" data-width="1080" data-height="1920"></div>
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

function writeResolveXml(data, seqName, overlayPath, masterAudioPath, outXmlPath) {
  const fps = parseInt(data.fps || 30, 10);
  const w = parseInt(data.width || 1080, 10);
  const h = parseInt(data.height || 1920, 10);
  const totalFrames = parseInt(data.totalFrames, 10);

  const v1Clips = data.scenes.map((s, idx) => `
        <clipitem id="hf-clip-v1-${idx + 1}">
          <name>${escXml(path.basename(s.absVideoPath))}</name>
          <duration>${s.durationFrames}</duration>
          <rate><timebase>${fps}</timebase><ntsc>FALSE</ntsc></rate>
          <start>${s.startFrame}</start>
          <end>${s.endFrame}</end>
          <in>0</in>
          <out>${s.durationFrames}</out>
          <file id="hf-file-v1-${idx + 1}">
            <name>${escXml(path.basename(s.absVideoPath))}</name>
            <pathurl>${escXml(toFcpUrl(s.absVideoPath))}</pathurl>
            <rate><timebase>${fps}</timebase><ntsc>FALSE</ntsc></rate>
            <duration>${s.durationFrames}</duration>
            <media><video><samplecharacteristics><width>${w}</width><height>${h}</height></samplecharacteristics></video></media>
          </file>
        </clipitem>`).join('');

  const v2Track = overlayPath && fs.existsSync(overlayPath)
    ? `
      <track>
        <clipitem id="hf-clip-v2-overlay">
          <name>${escXml(path.basename(overlayPath))}</name>
          <duration>${totalFrames}</duration>
          <rate><timebase>${fps}</timebase><ntsc>FALSE</ntsc></rate>
          <start>0</start>
          <end>${totalFrames}</end>
          <in>0</in>
          <out>${totalFrames}</out>
          <file id="hf-file-v2-overlay">
            <name>${escXml(path.basename(overlayPath))}</name>
            <pathurl>${escXml(toFcpUrl(overlayPath))}</pathurl>
            <rate><timebase>${fps}</timebase><ntsc>FALSE</ntsc></rate>
            <duration>${totalFrames}</duration>
            <media><video><samplecharacteristics><width>${w}</width><height>${h}</height></samplecharacteristics></video></media>
          </file>
        </clipitem>
      </track>`
    : '';

  const a1Section = masterAudioPath && fs.existsSync(masterAudioPath)
    ? `
    <audio>
      <numOutputChannels>2</numOutputChannels>
      <format><samplecharacteristics><depth>16</depth><samplerate>48000</samplerate></samplecharacteristics></format>
      <track>
        <clipitem id="hf-clip-a1-audio">
          <name>${escXml(path.basename(masterAudioPath))}</name>
          <duration>${totalFrames}</duration>
          <rate><timebase>${fps}</timebase><ntsc>FALSE</ntsc></rate>
          <start>0</start>
          <end>${totalFrames}</end>
          <in>0</in>
          <out>${totalFrames}</out>
          <file id="hf-file-a1-audio">
            <name>${escXml(path.basename(masterAudioPath))}</name>
            <pathurl>${escXml(toFcpUrl(masterAudioPath))}</pathurl>
            <rate><timebase>${fps}</timebase><ntsc>FALSE</ntsc></rate>
            <duration>${totalFrames}</duration>
            <media><audio><samplecharacteristics><depth>16</depth><samplerate>48000</samplerate></samplecharacteristics><channelcount>2</channelcount></audio></media>
          </file>
          <sourcetrack><mediatype>audio</mediatype><trackindex>1</trackindex></sourcetrack>
        </clipitem>
      </track>
    </audio>`
    : '';

  const markers = data.scenes.map((s) => `
    <marker>
      <name>${escXml(s.hero_value || s.id)}</name>
      <comment>${escXml(s.sub_value || '')}</comment>
      <in>${s.startFrame}</in>
      <out>-1</out>
    </marker>`).join('');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE xmeml>
<xmeml version="5">
  <sequence id="sequence-reel-studio-1">
    <name>${escXml(seqName)}</name>
    <duration>${totalFrames}</duration>
    <rate><timebase>${fps}</timebase><ntsc>FALSE</ntsc></rate>
    <timecode>
      <rate><timebase>${fps}</timebase><ntsc>FALSE</ntsc></rate>
      <string>01:00:00:00</string>
      <frame>108000</frame>
      <displayformat>NDF</displayformat>
    </timecode>
    <media>
      <video>
        <format>
          <samplecharacteristics>
            <width>${w}</width>
            <height>${h}</height>
            <pixelaspectratio>square</pixelaspectratio>
            <rate><timebase>${fps}</timebase><ntsc>FALSE</ntsc></rate>
            <anamorphic>FALSE</anamorphic>
          </samplecharacteristics>
        </format>
        <track>${v1Clips}
        </track>${v2Track}
      </video>${a1Section}
    </media>${markers}
  </sequence>
</xmeml>
`;
  fs.mkdirSync(path.dirname(outXmlPath), { recursive: true });
  fs.writeFileSync(outXmlPath, xml, 'utf8');
}

function resolveTargetSiteDir(arg) {
  if (arg) {
    const candidates = [
      path.resolve(process.cwd(), arg),
      path.resolve(REPO_ROOT, arg),
      path.join(SITES_DIR, arg)
    ];
    const hit = candidates.find((p) => fs.existsSync(path.join(p, 'site.json')));
    if (hit) return hit;
    throw new Error(`Could not find site folder containing site.json for "${arg}"`);
  }

  if (fs.existsSync(ACTIVE_SITE_PTR)) {
    try {
      const ptr = JSON.parse(fs.readFileSync(ACTIVE_SITE_PTR, 'utf8'));
      if (ptr.siteDir && fs.existsSync(path.join(ptr.siteDir, 'site.json'))) return ptr.siteDir;
    } catch {}
  }

  if (fs.existsSync(SITES_DIR)) {
    const dirs = fs
      .readdirSync(SITES_DIR, { withFileTypes: true })
      .filter((d) => d.isDirectory() && !d.name.startsWith('_') && !d.name.startsWith('.'))
      .map((d) => path.join(SITES_DIR, d.name))
      .filter((p) => fs.existsSync(path.join(p, 'site.json')))
      .sort((a, b) => fs.statSync(path.join(b, 'site.json')).mtimeMs - fs.statSync(path.join(a, 'site.json')).mtimeMs);
    if (dirs.length > 0) return dirs[0];
  }
  throw new Error('No site folder found under sites/. Create one first with: npm run new -- my_layout_name');
}

function createNewSite(rawName) {
  const slug = sanitizeName(rawName);
  const d = new Date();
  const stamp = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const folderName = /^\d{4}-\d{2}-\d{2}_/.test(slug) ? slug : `${stamp}_${slug}`;
  const destDir = path.join(SITES_DIR, folderName);
  if (fs.existsSync(destDir)) throw new Error(`Site folder already exists: ${destDir}`);

  fs.mkdirSync(path.join(destDir, 'clips'), { recursive: true });
  fs.mkdirSync(path.join(destDir, 'out'), { recursive: true });
  fs.copyFileSync(path.join(TEMPLATE_DIR, 'site.json'), path.join(destDir, 'site.json'));
  const tmplScript = path.join(TEMPLATE_DIR, 'script.txt');
  if (fs.existsSync(tmplScript)) fs.copyFileSync(tmplScript, path.join(destDir, 'script.txt'));

  const cfg = JSON.parse(fs.readFileSync(path.join(destDir, 'site.json'), 'utf8'));
  cfg.site_id = folderName;
  cfg.timeline_name = folderName;
  fs.writeFileSync(path.join(destDir, 'site.json'), JSON.stringify(cfg, null, 2), 'utf8');

  fs.writeFileSync(ACTIVE_SITE_PTR, JSON.stringify({ siteDir: destDir, siteFolder: folderName }, null, 2));
  console.log(`Created new site folder -> ${destDir}`);
  console.log(`Next:\n  1) Drop your recorded clips into: ${path.join(destDir, 'clips')}\n  2) Update 5-stage details in:    ${path.join(destDir, 'site.json')}\n  3) Run prep & studio:\n     npm run prep -- sites/${folderName}\n     npm run studio -- sites/${folderName}`);
}

async function main() {
  const args = process.argv.slice(2);
  if (args[0] === '--new' || args[0] === '-n') {
    const name = args[1] || 'new_site';
    createNewSite(name);
    return;
  }

  const siteDir = resolveTargetSiteDir(args[0]);
  const siteCfgPath = path.join(siteDir, 'site.json');
  const brandPath = path.join(COMMON_DIR, 'brand.json');

  const brand = fs.existsSync(brandPath) ? JSON.parse(fs.readFileSync(brandPath, 'utf8')) : {};
  const siteCfg = JSON.parse(fs.readFileSync(siteCfgPath, 'utf8'));
  const config = {
    ...brand,
    ...siteCfg,
    resolution: { ...(brand.resolution || {}), ...(siteCfg.resolution || {}) }
  };

  const fps = config.fps || 30;
  const width = config.resolution?.width || 1080;
  const height = config.resolution?.height || 1920;
  const voiceRate = config.voice_rate || '+6%';
  const voicePitch = config.voice_pitch || '+2Hz';
  const voice = config.voice || 'kn-IN-GaganNeural';
  const locale = inferVoiceLocale(voice, config.language);
  const siteFolder = path.basename(siteDir);
  const siteId = sanitizeName(config.site_id || siteFolder);
  const tlBase = sanitizeName(config.timeline_name || siteId);

  const clipsDir = path.join(siteDir, 'clips');
  const workDir = path.join(siteDir, 'work');
  const hfDir = path.join(workDir, 'hf');
  const hfAlphaDir = path.join(workDir, 'hf_alpha');
  const hfAssets = path.join(hfDir, 'assets');
  const hfComps = path.join(hfDir, 'compositions');
  const audioDir = path.join(workDir, 'audio');
  const outDir = path.join(siteDir, 'out');

  fs.mkdirSync(audioDir, { recursive: true });
  fs.mkdirSync(hfComps, { recursive: true });
  for (const oldF of fs.readdirSync(hfComps)) {
    try { fs.unlinkSync(path.join(hfComps, oldF)); } catch {}
  }
  fs.mkdirSync(hfAlphaDir, { recursive: true });
  fs.mkdirSync(outDir, { recursive: true });
  ['video', 'audio', 'fonts', 'vendor', 'sfx', 'brand'].forEach((sub) =>
    fs.mkdirSync(path.join(hfAssets, sub), { recursive: true })
  );

  fs.writeFileSync(ACTIVE_SITE_PTR, JSON.stringify({ siteDir, siteFolder, timelineName: tlBase }, null, 2));

  console.log('=====================================================================');
  console.log(`Preparing Real Estate Reel: ${config.project_title || siteFolder}`);
  console.log(`Site Folder: ${siteDir}`);
  console.log(`FFmpeg:      ${FFMPEG}`);
  console.log(`Voice:       ${voice} (locale=${locale}, WordBoundary=ON)`);
  console.log('=====================================================================\n');

  // Vendor GSAP 3.15 + Bundled SFX from local node_modules/hyperframes
  const hfPkgDir = path.dirname(require.resolve('hyperframes/package.json', { paths: [REPO_ROOT] }));
  const gsapDist = path.join(hfPkgDir, 'dist', 'vendor', 'npm', 'gsap@3.15.0', 'dist');
  ['gsap.min.js', 'CustomEase.min.js', 'MotionPathPlugin.min.js'].forEach((f) => {
    fs.copyFileSync(path.join(gsapDist, f), path.join(hfAssets, 'vendor', f));
  });

  const bundledSfxDir = path.join(hfPkgDir, 'dist', 'skills', 'media-use', 'audio', 'assets', 'sfx');
  const customSfxDir = path.join(COMMON_DIR, 'sfx');
  ['whoosh.mp3', 'whoosh-short.mp3', 'pop.mp3', 'click.mp3', 'click-soft.mp3', 'chime.mp3', 'sparkle.mp3', 'impact-bass-1.mp3', 'ping.mp3'].forEach((f) => {
    const override = path.join(customSfxDir, f);
    const src = fs.existsSync(override) ? override : path.join(bundledSfxDir, f);
    linkOrCopy(src, path.join(hfAssets, 'sfx', f));
  });

  // Fonts: prefer common/fonts/, fallback to C:\Windows\Fonts
  ['NIRMALA.TTF', 'NIRMALAB.TTF'].forEach((f) => {
    const commonFont = path.join(COMMON_DIR, 'fonts', f);
    const winFont = path.join('C:\\Windows\\Fonts', f);
    const src = fs.existsSync(commonFont) ? commonFont : winFont;
    if (fs.existsSync(src)) linkOrCopy(src, path.join(hfAssets, 'fonts', f));
  });

  // Auto-discover Brand Logo from common/logo/ (normalize filename cleanly without spaces)
  const logoSrc = resolveCommonLogo(config);
  let hfLogoRelPath = null;
  if (logoSrc) {
    const logoExt = path.extname(logoSrc).toLowerCase() || '.png';
    hfLogoRelPath = `assets/brand/brand_logo${logoExt}`;
    linkOrCopy(logoSrc, path.join(hfDir, hfLogoRelPath));
    console.log(`[Brand Kit] Logo loaded -> ${logoSrc}`);
  }

  const brandMeta = {
    ...config,
    hfLogoRelPath
  };

  // Discover clips sequentially for "auto" video mapping
  const autoClips = listVideoClips(clipsDir);
  if (!Array.isArray(config.scenes) || config.scenes.length === 0) {
    throw new Error('site.json must define at least one scene inside scenes[]');
  }

  const tts = new MsEdgeTTS();
  const ttsFormat = OUTPUT_FORMAT.AUDIO_24KHZ_96KBITRATE_MONO_MP3 || OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3;
  await tts.setMetadata(voice, ttsFormat, { voiceLocale: locale, wordBoundaryEnabled: true, sentenceBoundaryEnabled: true });

  let currentFrame = 0;
  const preparedScenes = [];

  for (let i = 0; i < config.scenes.length; i++) {
    const s = config.scenes[i];
    let absVideo = null;
    if (!s.video || s.video === 'auto') {
      absVideo = autoClips[i] || null;
    } else {
      const tries = [
        path.resolve(siteDir, s.video),
        path.resolve(clipsDir, s.video),
        path.resolve(REPO_ROOT, s.video)
      ];
      absVideo = tries.find((p) => fs.existsSync(p)) || null;
    }

    if (!absVideo || !fs.existsSync(absVideo)) {
      throw new Error(
        `Missing video for scene "${s.id}" (scene #${i + 1}). Drop your MP4 clips into ${clipsDir} or set scene.video path.`
      );
    }

    const durationSec = getMediaDurationSec(absVideo);
    const durationFrames = Math.round(durationSec * fps);
    const startFrame = currentFrame;
    const startSec = Number((startFrame / fps).toFixed(3));
    currentFrame += durationFrames;

    const videoFilename = path.basename(absVideo);
    linkOrCopy(absVideo, path.join(hfAssets, 'video', videoFilename));

    const scId = ensureCssId(s.id || `scene_${i + 1}`);
    const audioFilename = `${scId}.mp3`;
    const absAudio = path.join(audioDir, audioFilename);
    let audioDur = 0;
    let hasAudio = false;
    let wordTimings = [];
    const audioOffsetInsideScene = 0.35;

    if (s.voice_text && s.voice_text.trim().length > 0) {
      const stream = fs.createWriteStream(absAudio);
      const { audioStream, metadataStream } = tts.toStream(s.voice_text.trim(), { rate: voiceRate, pitch: voicePitch });
      const metaChunks = [];
      if (metadataStream) metadataStream.on('data', (chunk) => metaChunks.push(chunk.toString('utf8')));
      await new Promise((res, rej) => {
        audioStream.pipe(stream);
        stream.on('finish', res);
        stream.on('error', rej);
      });
      audioDur = getMediaDurationSec(absAudio);
      hasAudio = true;
      wordTimings = parseBoundaryObjects(metaChunks).map((w) => ({
        ...w,
        start: Number((w.start + audioOffsetInsideScene).toFixed(3)),
        end: Number((w.end + audioOffsetInsideScene).toFixed(3)),
        globalStart: Number((startSec + w.start + audioOffsetInsideScene).toFixed(3)),
        globalEnd: Number((startSec + w.end + audioOffsetInsideScene).toFixed(3))
      }));
    }

    const rawBeats =
      Array.isArray(s.beats) && s.beats.length > 0
        ? s.beats
        : [{ widget: 'highlight_pill', start_pct: 0, end_pct: 1, badge: s.top_label, value: s.hero_value, sub: s.sub_value }];

    const globalMaxDwell = Number(config.card_max_display_sec || 5.2);
    const resolvedBeats = rawBeats.map((b, bIdx) => {
      const sp = Math.max(0, Math.min(1, typeof b.start_pct === 'number' ? b.start_pct : bIdx / rawBeats.length));
      const ep = Math.max(sp + 0.1, Math.min(1, typeof b.end_pct === 'number' ? b.end_pct : (bIdx + 1) / rawBeats.length));
      const pctStartSec = bIdx === 0 && i === 0 ? 0.0 : bIdx === 0 ? Math.max(0.28, sp * durationSec) : sp * durationSec;
      const pctEndSec = bIdx === rawBeats.length - 1 ? durationSec : ep * durationSec;
      const kw = b.anchor_words || inferKeywordsForBeat(b);
      const syncedStartSec =
        bIdx === 0
          ? pctStartSec
          : findAnchorTime(wordTimings, kw, pctStartSec, Math.max(0.28, pctStartSec - 2.2), Math.min(pctEndSec - 1.4, pctStartSec + 2.5));
      const maxDwell = Number(b.display_sec || (b.widget === 'follow_cta' ? 8.5 : globalMaxDwell));
      const timedEndSec = b.hold ? pctEndSec : Math.min(pctEndSec, syncedStartSec + maxDwell);
      return {
        ...b,
        glide_to: b.glide_to || s.glide_to || 'bottom',
        startSec: Number(syncedStartSec.toFixed(3)),
        endSec: Number(Math.max(syncedStartSec + 1.4, timedEndSec).toFixed(3)),
        startFrame: Math.floor(syncedStartSec * fps),
        endFrame: Math.ceil(Math.max(syncedStartSec + 1.4, timedEndSec) * fps)
      };
    });

    for (let bi = 1; bi < resolvedBeats.length; bi++) {
      if (resolvedBeats[bi].startSec < resolvedBeats[bi - 1].startSec + 1.6) {
        resolvedBeats[bi].startSec = Number((resolvedBeats[bi - 1].startSec + 1.8).toFixed(3));
      }
      resolvedBeats[bi - 1].endSec = Number(
        Math.min(resolvedBeats[bi - 1].endSec, Math.max(resolvedBeats[bi - 1].startSec + 1.2, resolvedBeats[bi].startSec - 0.20)).toFixed(3)
      );
      resolvedBeats[bi - 1].endFrame = Math.ceil(resolvedBeats[bi - 1].endSec * fps);
    }

    const fillPct = durationSec > 0 ? Math.round((audioDur / durationSec) * 100) : 0;
    console.log(`[${String(i + 1).padStart(2, '0')}] ${videoFilename.padEnd(25)} | ${durationSec.toFixed(2)}s | Voice: ${audioDur.toFixed(2)}s (${fillPct}%) | Words synced: ${wordTimings.length}`);

    preparedScenes.push({
      id: ensureCssId(s.id || `scene_${i + 1}`),
      hfVideoRelPath: `assets/video/${videoFilename}`,
      absVideoPath: absVideo,
      absAudioPath: hasAudio ? absAudio : null,
      durationSec: Number(durationSec.toFixed(3)),
      durationFrames,
      startFrame,
      endFrame: currentFrame,
      startSec,
      endSec: Number((currentFrame / fps).toFixed(3)),
      audioDelayMs: Math.round((startSec + audioOffsetInsideScene) * 1000),
      audioDurationSec: Number(audioDur.toFixed(3)),
      top_label: s.top_label || config.location_badge || config.default_location_badge || '',
      hero_value: s.hero_value || '',
      sub_value: s.sub_value || '',
      glide_to: s.glide_to || 'bottom',
      accent: s.accent || '#00D4FF',
      accent_secondary: s.accent_secondary || '#6366F1',
      voice_text: s.voice_text || '',
      wordTimings,
      beats: resolvedBeats
    });
  }

  try { tts.close(); } catch {}

  const totalFrames = currentFrame;
  const totalDurationSec = Number((totalFrames / fps).toFixed(2));
  const audioScenes = preparedScenes.filter((s) => s.absAudioPath);
  const voiceOnlyPath = path.join(audioDir, `${siteId}_voiceover_dry.mp3`);
  const masterAudioPath = path.join(audioDir, `${siteId}_voiceover_master.mp3`);
  const ambientWavPath = path.join(audioDir, `${siteId}_ambient_bed.wav`);
  let hfMasterAudioRel = null;

  if (audioScenes.length > 0) {
    console.log('\nMixing synced narration + chord underscore (-15 LUFS)...');
    let inputs = `-f lavfi -i anullsrc=r=48000:cl=stereo:d=${totalDurationSec} `;
    const filters = [];
    let mixInputs = '[0:a]';
    audioScenes.forEach((sc, idx) => {
      inputs += `-i "${sc.absAudioPath}" `;
      const d = sc.audioDelayMs;
      filters.push(`[${idx + 1}:a]aformat=sample_fmts=fltp:sample_rates=48000:channel_layouts=stereo,adelay=${d}|${d}[a${idx}]`);
      mixInputs += `[a${idx}]`;
    });
    const filterComplex = `${filters.join('; ')}; ${mixInputs}amix=inputs=${audioScenes.length + 1}:duration=first:normalize=0[aout]`;
    execSync(`"${FFMPEG}" ${inputs} -filter_complex "${filterComplex}" -map "[aout]" -c:a libmp3lame -b:a 192k "${voiceOnlyPath}" -y`, { stdio: 'ignore' });

    if (config.ambient_music !== false) {
      let bedInput = resolveCommonMusic(config, brand);
      if (!bedInput) {
        synthesizeAmbientBedWav(totalDurationSec, ambientWavPath);
        bedInput = ambientWavPath;
      }
      if (fs.existsSync(bedInput)) {
        const mixFilter =
          '[0:a]aformat=sample_fmts=fltp:sample_rates=48000:channel_layouts=stereo,volume=1.18[voice];' +
          '[1:a]aformat=sample_fmts=fltp:sample_rates=48000:channel_layouts=stereo,volume=0.22[music];' +
          '[voice][music]amix=inputs=2:duration=first:normalize=0,loudnorm=I=-15:TP=-1.5:LRA=11[final]';
        execSync(`"${FFMPEG}" -i "${voiceOnlyPath}" -i "${bedInput}" -filter_complex "${mixFilter}" -map "[final]" -c:a libmp3lame -b:a 192k "${masterAudioPath}" -y`, { stdio: 'ignore' });
      } else {
        fs.copyFileSync(voiceOnlyPath, masterAudioPath);
      }
    } else {
      fs.copyFileSync(voiceOnlyPath, masterAudioPath);
    }

    hfMasterAudioRel = `assets/audio/${path.basename(masterAudioPath)}`;
    linkOrCopy(masterAudioPath, path.join(hfDir, hfMasterAudioRel));
  }

  const timelineData = {
    site_id: siteId,
    site_folder: siteFolder,
    timeline_name: tlBase,
    project_title: config.project_title || siteFolder,
    location_badge: config.location_badge || config.default_location_badge || '',
    cta_phone: config.cta_phone || '',
    language: config.language || 'kn',
    voice,
    fps,
    width,
    height,
    totalFrames,
    totalDurationSec,
    masterAudioAbsPath: audioScenes.length > 0 ? masterAudioPath : null,
    hfAudioRelPath: hfMasterAudioRel,
    scenes: preparedScenes
  };

  fs.writeFileSync(path.join(hfDir, 'meta.json'), JSON.stringify({ width, height, fps }, null, 2));
  fs.writeFileSync(path.join(hfDir, 'generated_timeline.json'), JSON.stringify(timelineData, null, 2));

  preparedScenes.forEach((sc, idx) => {
    fs.writeFileSync(path.join(hfComps, `${sc.id}.html`), generateSceneCompositionHtml(sc, idx, preparedScenes.length, fps, brandMeta), 'utf8');
  });

  fs.writeFileSync(path.join(hfComps, 'hud_chrome.html'), generateHudChromeHtml(timelineData, brandMeta), 'utf8');
  fs.writeFileSync(path.join(hfComps, 'transitions.html'), generateTransitionsHtml(timelineData), 'utf8');
  fs.writeFileSync(path.join(hfComps, 'captions.html'), generateCaptionsHtml(timelineData), 'utf8');
  fs.writeFileSync(path.join(hfDir, 'index.html'), generateRootHtml(timelineData, { transparentOverlay: false }), 'utf8');

  // Populate sibling work/hf_alpha (transparent ProRes 4444 overlay project)
  fs.writeFileSync(path.join(hfAlphaDir, 'meta.json'), JSON.stringify({ width, height, fps }, null, 2));
  fs.writeFileSync(path.join(hfAlphaDir, 'index.html'), generateRootHtml(timelineData, { transparentOverlay: true }), 'utf8');
  linkDirContents(path.join(hfAssets, 'vendor'), path.join(hfAlphaDir, 'assets', 'vendor'));
  linkDirContents(path.join(hfAssets, 'fonts'), path.join(hfAlphaDir, 'assets', 'fonts'));
  linkDirContents(path.join(hfAssets, 'brand'), path.join(hfAlphaDir, 'assets', 'brand'));
  linkDirContents(hfComps, path.join(hfAlphaDir, 'compositions'));

  // Write Resolve FCP7 XML right away (works even before alpha MOV exists, updated again after render)
  const outXml = path.join(outDir, `${tlBase}.xml`);
  const outOverlay = path.join(outDir, `${tlBase}_hud_alpha.mov`);
  const outWav = path.join(outDir, `${tlBase}_sfx_master.wav`);
  const bestAudio = fs.existsSync(outWav) ? outWav : timelineData.masterAudioAbsPath;
  writeResolveXml(timelineData, `${tlBase}_Editable`, fs.existsSync(outOverlay) ? outOverlay : null, bestAudio, outXml);

  console.log(`\nDONE! Prepared HyperFrames project inside: ${workDir}`);
  console.log(`Generated DaVinci Resolve XML -> ${outXml}`);
  console.log(`Total Duration: ${totalDurationSec}s (${totalFrames} frames @ ${fps} FPS)`);
}

if (require.main === module) {
  main().catch((err) => {
    console.error('Prepare Error:', err.message || err);
    process.exit(1);
  });
}

module.exports = { resolveTargetSiteDir, writeResolveXml, findFfmpeg };
