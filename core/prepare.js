#!/usr/bin/env node
/**
 * core/prepare.js
 * Slim pipeline orchestrator for the modular Real Estate Reel engine.
 * Delegates:
 *  - core/layout_spec.js -> 1080x1920 size budgets, typography floors & safe bands
 *  - core/audio_tts.js   -> msedge-tts WordBoundary sync, chord bed & FFmpeg -15 LUFS mix
 *  - core/widgets.js     -> 12 HyperFrames + GSAP 3.15 property widgets
 *  - core/templates.js   -> HUD chrome, captions, transitions & root HF/alpha HTML
 *  - core/resolve_xml.js -> DaVinci Resolve FCP7 XML sequence generator
 *
 * Usage:
 *   node core/prepare.js --new <site_name>
 *   node core/prepare.js [sites/<site_folder>]
 */

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const { MsEdgeTTS, OUTPUT_FORMAT } = require('msedge-tts');

const { LAYOUT, sanitizeName, ensureCssId } = require('./layout_spec');
const { inferVoiceLocale, parseBoundaryObjects, findAnchorTime, inferKeywordsForBeat, mixMasterAudio } = require('./audio_tts');
const {
  generateSceneCompositionHtml,
  generateHudChromeHtml,
  generateTransitionsHtml,
  generateCaptionsHtml,
  generateRootHtml
} = require('./templates');
const { writeResolveXml } = require('./resolve_xml');

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
  const preferred = [brand.logo_file, 'logo.png', 'logo.svg', 'logo.webp', 'logo.jpg', 'logo.jpeg'].filter(Boolean);
  for (const name of preferred) {
    const p = path.join(logoDir, name);
    if (fs.existsSync(p) && fs.statSync(p).isFile()) return p;
  }
  const imageExts = new Set(['.png', '.svg', '.webp', '.jpg', '.jpeg']);
  const entries = fs.readdirSync(logoDir).filter((f) => imageExts.has(path.extname(f).toLowerCase()) && f !== 'brand_logo.svg').sort();
  if (entries.length > 0) return path.join(logoDir, entries[0]);
  const fallbackSvg = path.join(logoDir, 'brand_logo.svg');
  return fs.existsSync(fallbackSvg) ? fallbackSvg : null;
}

function resolveCommonMusic(config) {
  if (config.ambient_music_file) {
    const custom = path.resolve(REPO_ROOT, config.ambient_music_file);
    if (fs.existsSync(custom)) return custom;
  }
  const musicDir = path.join(COMMON_DIR, 'music');
  if (!fs.existsSync(musicDir)) return null;
  const audioExts = new Set(['.wav', '.mp3', '.m4a', '.aac', '.flac']);
  const files = fs.readdirSync(musicDir).filter((f) => audioExts.has(path.extname(f).toLowerCase())).sort();
  return files.length > 0 ? path.join(musicDir, files[0]) : null;
}

function resolveTargetSiteDir(arg) {
  if (arg) {
    const candidates = [path.resolve(process.cwd(), arg), path.resolve(REPO_ROOT, arg), path.join(SITES_DIR, arg)];
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
  console.log(`Next:\n  1) Drop raw clips into:  ${path.join(destDir, 'clips')}\n  2) Fill plain notes in:  ${path.join(destDir, 'script.txt')} (or edit site.json)\n  3) Run prep & studio:\n     npm run prep -- sites/${folderName}\n     npm run studio -- sites/${folderName}`);
}

async function main() {
  const args = process.argv.slice(2);
  if (args[0] === '--new' || args[0] === '-n') {
    createNewSite(args[1] || 'new_site');
    return;
  }

  const siteDir = resolveTargetSiteDir(args[0]);
  const brandPath = path.join(COMMON_DIR, 'brand.json');
  const brand = fs.existsSync(brandPath) ? JSON.parse(fs.readFileSync(brandPath, 'utf8')) : {};
  const siteCfg = JSON.parse(fs.readFileSync(path.join(siteDir, 'site.json'), 'utf8'));
  const config = { ...brand, ...siteCfg, resolution: { ...(brand.resolution || {}), ...(siteCfg.resolution || {}) } };

  const fps = config.fps || LAYOUT.canvas.fps;
  const width = config.resolution?.width || LAYOUT.canvas.width;
  const height = config.resolution?.height || LAYOUT.canvas.height;
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
  ['video', 'audio', 'fonts', 'vendor', 'sfx', 'brand'].forEach((sub) => fs.mkdirSync(path.join(hfAssets, sub), { recursive: true }));
  fs.writeFileSync(ACTIVE_SITE_PTR, JSON.stringify({ siteDir, siteFolder, timelineName: tlBase }, null, 2));

  console.log('=====================================================================');
  console.log(`Preparing Real Estate Reel: ${config.project_title || siteFolder}`);
  console.log(`Site Folder: ${siteDir}`);
  console.log(`FFmpeg:      ${FFMPEG}`);
  console.log(`Voice:       ${voice} (locale=${locale}, WordBoundary=ON)`);
  console.log('=====================================================================\n');

  const hfPkgDir = path.dirname(require.resolve('hyperframes/package.json', { paths: [REPO_ROOT] }));
  const gsapDist = path.join(hfPkgDir, 'dist', 'vendor', 'npm', 'gsap@3.15.0', 'dist');
  ['gsap.min.js', 'CustomEase.min.js', 'MotionPathPlugin.min.js'].forEach((f) =>
    fs.copyFileSync(path.join(gsapDist, f), path.join(hfAssets, 'vendor', f))
  );

  const bundledSfxDir = path.join(hfPkgDir, 'dist', 'skills', 'media-use', 'audio', 'assets', 'sfx');
  const customSfxDir = path.join(COMMON_DIR, 'sfx');
  ['whoosh.mp3', 'whoosh-short.mp3', 'pop.mp3', 'click.mp3', 'click-soft.mp3', 'chime.mp3', 'sparkle.mp3', 'impact-bass-1.mp3', 'ping.mp3'].forEach((f) => {
    const override = path.join(customSfxDir, f);
    linkOrCopy(fs.existsSync(override) ? override : path.join(bundledSfxDir, f), path.join(hfAssets, 'sfx', f));
  });

  ['NIRMALA.TTF', 'NIRMALAB.TTF'].forEach((f) => {
    const commonFont = path.join(COMMON_DIR, 'fonts', f);
    const winFont = path.join('C:\\Windows\\Fonts', f);
    const src = fs.existsSync(commonFont) ? commonFont : winFont;
    if (fs.existsSync(src)) linkOrCopy(src, path.join(hfAssets, 'fonts', f));
  });

  const logoSrc = resolveCommonLogo(config);
  let hfLogoRelPath = null;
  if (logoSrc) {
    const logoExt = path.extname(logoSrc).toLowerCase() || '.png';
    hfLogoRelPath = `assets/brand/brand_logo${logoExt}`;
    linkOrCopy(logoSrc, path.join(hfDir, hfLogoRelPath));
    console.log(`[Brand Kit] Logo loaded -> ${logoSrc}`);
  }
  const brandMeta = { ...config, hfLogoRelPath };

  const autoClips = listVideoClips(clipsDir);
  if (!Array.isArray(config.scenes) || config.scenes.length === 0) {
    throw new Error('site.json must define at least one scene inside scenes[]');
  }

  const tts = new MsEdgeTTS();
  const ttsFormat = OUTPUT_FORMAT.AUDIO_24KHZ_96KBITRATE_MONO_MP3 || OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3;
  await tts.setMetadata(voice, ttsFormat, { voiceLocale: locale, wordBoundaryEnabled: true, sentenceBoundaryEnabled: true });

  let currentFrame = 0;
  const preparedScenes = [];
  const globalMaxDwell = Number(config.card_max_display_sec || LAYOUT.timing.cardDefaultDwellSec);

  for (let i = 0; i < config.scenes.length; i++) {
    const s = config.scenes[i];
    const absVideo = !s.video || s.video === 'auto'
      ? autoClips[i] || null
      : [path.resolve(siteDir, s.video), path.resolve(clipsDir, s.video), path.resolve(REPO_ROOT, s.video)].find((p) => fs.existsSync(p)) || null;

    if (!absVideo || !fs.existsSync(absVideo)) {
      throw new Error(`Missing video for scene "${s.id}" (#${i + 1}). Drop MP4 clips into ${clipsDir} or set scene.video path.`);
    }

    const durationSec = getMediaDurationSec(absVideo);
    const durationFrames = Math.round(durationSec * fps);
    const startFrame = currentFrame;
    const startSec = Number((startFrame / fps).toFixed(3));
    currentFrame += durationFrames;

    const videoFilename = path.basename(absVideo);
    linkOrCopy(absVideo, path.join(hfAssets, 'video', videoFilename));

    const scId = ensureCssId(s.id || `scene_${i + 1}`);
    const absAudio = path.join(audioDir, `${scId}.mp3`);
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

    const rawBeats = Array.isArray(s.beats) && s.beats.length > 0
      ? s.beats
      : [{ widget: 'highlight_pill', start_pct: 0, end_pct: 1, badge: s.top_label, value: s.hero_value, sub: s.sub_value }];

    const resolvedBeats = rawBeats.map((b, bIdx) => {
      const sp = Math.max(0, Math.min(1, typeof b.start_pct === 'number' ? b.start_pct : bIdx / rawBeats.length));
      const ep = Math.max(sp + 0.1, Math.min(1, typeof b.end_pct === 'number' ? b.end_pct : (bIdx + 1) / rawBeats.length));
      const pctStartSec = bIdx === 0 && i === 0 ? 0.0 : bIdx === 0 ? Math.max(0.28, sp * durationSec) : sp * durationSec;
      const pctEndSec = bIdx === rawBeats.length - 1 ? durationSec : ep * durationSec;
      const kw = b.anchor_words || inferKeywordsForBeat(b);
      const syncedStartSec = bIdx === 0
        ? pctStartSec
        : findAnchorTime(wordTimings, kw, pctStartSec, Math.max(0.28, pctStartSec - 2.2), Math.min(pctEndSec - 1.4, pctStartSec + 2.5));
      const maxDwell = Number(b.display_sec || (b.widget === 'follow_cta' ? LAYOUT.timing.followCtaDwellSec : globalMaxDwell));
      const timedEndSec = b.hold ? pctEndSec : Math.min(pctEndSec, syncedStartSec + maxDwell);
      const safeEnd = Math.max(syncedStartSec + LAYOUT.timing.minBeatSec, timedEndSec);
      return {
        ...b,
        glide_to: b.glide_to || s.glide_to || 'bottom',
        startSec: Number(syncedStartSec.toFixed(3)),
        endSec: Number(safeEnd.toFixed(3)),
        startFrame: Math.floor(syncedStartSec * fps),
        endFrame: Math.ceil(safeEnd * fps)
      };
    });

    for (let bi = 1; bi < resolvedBeats.length; bi++) {
      if (resolvedBeats[bi].startSec < resolvedBeats[bi - 1].startSec + 1.6) {
        resolvedBeats[bi].startSec = Number((resolvedBeats[bi - 1].startSec + 1.8).toFixed(3));
      }
      resolvedBeats[bi - 1].endSec = Number(
        Math.min(resolvedBeats[bi - 1].endSec, Math.max(resolvedBeats[bi - 1].startSec + 1.2, resolvedBeats[bi].startSec - LAYOUT.timing.beatGapSec)).toFixed(3)
      );
      resolvedBeats[bi - 1].endFrame = Math.ceil(resolvedBeats[bi - 1].endSec * fps);
    }

    const fillPct = durationSec > 0 ? Math.round((audioDur / durationSec) * 100) : 0;
    console.log(`[${String(i + 1).padStart(2, '0')}] ${videoFilename.padEnd(25)} | ${durationSec.toFixed(2)}s | Voice: ${audioDur.toFixed(2)}s (${fillPct}%) | Words synced: ${wordTimings.length}`);

    preparedScenes.push({
      id: scId,
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
    mixMasterAudio({
      ffmpegExe: FFMPEG,
      audioScenes,
      totalDurationSec,
      voiceOnlyPath,
      masterAudioPath,
      ambientWavPath,
      customMusicPath: resolveCommonMusic(config),
      enableMusic: config.ambient_music !== false
    });
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

  fs.writeFileSync(path.join(hfAlphaDir, 'meta.json'), JSON.stringify({ width, height, fps }, null, 2));
  fs.writeFileSync(path.join(hfAlphaDir, 'index.html'), generateRootHtml(timelineData, { transparentOverlay: true }), 'utf8');
  linkDirContents(path.join(hfAssets, 'vendor'), path.join(hfAlphaDir, 'assets', 'vendor'));
  linkDirContents(path.join(hfAssets, 'fonts'), path.join(hfAlphaDir, 'assets', 'fonts'));
  linkDirContents(path.join(hfAssets, 'brand'), path.join(hfAlphaDir, 'assets', 'brand'));
  linkDirContents(hfComps, path.join(hfAlphaDir, 'compositions'));

  const outXml = path.join(outDir, `${tlBase}.xml`);
  const outOverlay = path.join(outDir, `${tlBase}_hud_alpha.mov`);
  const outWav = path.join(outDir, `${tlBase}_sfx_master.wav`);
  writeResolveXml(timelineData, `${tlBase}_Editable`, fs.existsSync(outOverlay) ? outOverlay : null, fs.existsSync(outWav) ? outWav : timelineData.masterAudioAbsPath, outXml);

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
