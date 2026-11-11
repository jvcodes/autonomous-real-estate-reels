#!/usr/bin/env node
/**
 * core/render.js
 * Unified CLI runner for HyperFrames + DaVinci Resolve.
 * Automatically resolves Node 22+ & Gyan FFmpeg without altering global PATH.
 * Usage:
 *   node core/render.js <studio|check|mp4|alpha|reel> [sites/<site_folder>]
 */

const fs = require('fs');
const path = require('path');
const { execSync, spawn } = require('child_process');
const { resolveTargetSiteDir, writeResolveXml } = require('./prepare');

const REPO_ROOT = path.resolve(__dirname, '..');
const SITES_DIR = path.join(REPO_ROOT, 'sites');
const ACTIVE_SITE_PTR = path.join(SITES_DIR, '.active_site.json');
const HF_CLI = path.join(REPO_ROOT, 'node_modules', 'hyperframes', 'bin', 'hyperframes.mjs');

function findNode22Plus() {
  const candidates = [
    process.execPath,
    path.join(REPO_ROOT, '.tools', 'node22', 'node.exe'),
    path.join(REPO_ROOT, 'core', 'node22', 'node.exe'),
    'C:\\sites\\single_site_agent\\.tools\\node22\\node.exe'
  ];
  for (const exe of candidates) {
    if (!exe || !fs.existsSync(exe)) continue;
    try {
      const major = parseInt(execSync(`"${exe}" -p "process.versions.node.split('.')[0]"`, { encoding: 'utf8' }).trim(), 10);
      if (major >= 22) return exe;
    } catch {}
  }
  return process.execPath;
}

function findFfmpegBin() {
  const wingetBase = path.join(process.env.LOCALAPPDATA || '', 'Microsoft', 'WinGet', 'Packages');
  if (fs.existsSync(wingetBase)) {
    const dirs = fs.readdirSync(wingetBase).filter((d) => d.startsWith('Gyan.FFmpeg'));
    for (const d of dirs) {
      const pkgRoot = path.join(wingetBase, d);
      const sub = fs.readdirSync(pkgRoot).find((x) => x.startsWith('ffmpeg-'));
      if (sub) {
        const bin = path.join(pkgRoot, sub, 'bin');
        if (fs.existsSync(path.join(bin, 'ffmpeg.exe'))) return bin;
      }
    }
  }
  return '';
}

function sanitizeName(raw) {
  return String(raw || '').trim().replace(/[^A-Za-z0-9_-]+/g, '_').replace(/^_+|_+$/g, '') || 'Property_Reel';
}

function deployResolveUtility() {
  const resolveUtilDir = path.join(
    process.env.APPDATA || '',
    'Blackmagic Design',
    'DaVinci Resolve',
    'Support',
    'Fusion',
    'Scripts',
    'Utility'
  );
  const srcPy = path.join(REPO_ROOT, 'core', 'resolve_import.py');
  if (fs.existsSync(resolveUtilDir) && fs.existsSync(srcPy)) {
    const destPy = path.join(resolveUtilDir, 'Build_Reel_Studio.py');
    const pyText = fs.readFileSync(srcPy, 'utf8').replace('__REPO_ROOT__', REPO_ROOT.replace(/\\/g, '\\\\'));
    fs.writeFileSync(destPy, pyText, 'utf8');
    console.log(`Deployed DaVinci Resolve Script -> ${destPy}`);
  }
}

function main() {
  const mode = process.argv[2] || 'reel';
  const siteArg = process.argv[3];
  const nodeExe = findNode22Plus();
  const ffBin = findFfmpegBin();
  const envWithTools = {
    ...process.env,
    PATH: `${path.dirname(nodeExe)}${ffBin ? path.delimiter + ffBin : ''}${path.delimiter}${process.env.PATH || ''}`
  };

  if (!fs.existsSync(HF_CLI)) {
    console.error(`Missing HyperFrames CLI at ${HF_CLI}. Run: npm install (or .\\setup.ps1)`);
    process.exit(1);
  }

  const siteDir = resolveTargetSiteDir(siteArg);
  const siteFolder = path.basename(siteDir);
  const workDir = path.join(siteDir, 'work');
  const hfDir = path.join(workDir, 'hf');
  const hfAlphaDir = path.join(workDir, 'hf_alpha');
  const outDir = path.join(siteDir, 'out');
  const timelineJson = path.join(hfDir, 'generated_timeline.json');

  if (mode === 'reel') {
    console.log(`[Pipeline] Preparing site: ${siteFolder}`);
    execSync(`"${nodeExe}" "${path.join(__dirname, 'prepare.js')}" "${siteDir}"`, {
      cwd: REPO_ROOT,
      env: envWithTools,
      stdio: 'inherit'
    });
  }

  if (!fs.existsSync(timelineJson)) {
    console.error(`Missing ${timelineJson}. Run: npm run prep -- sites/${siteFolder}`);
    process.exit(1);
  }

  const data = JSON.parse(fs.readFileSync(timelineJson, 'utf8'));
  const tlBase = sanitizeName(data.timeline_name || data.site_id);
  fs.writeFileSync(ACTIVE_SITE_PTR, JSON.stringify({ siteDir, siteFolder, timelineName: tlBase }, null, 2));

  if (mode === 'studio' || mode === 'preview') {
    console.log(`Launching HyperFrames Studio for ${siteFolder} ...`);
    const child = spawn(nodeExe, [HF_CLI, 'preview', '.'], {
      cwd: hfDir,
      env: envWithTools,
      stdio: 'inherit'
    });
    child.on('exit', (code) => process.exit(code || 0));
    return;
  }

  if (mode === 'check') {
    console.log(`Validating HyperFrames project (${siteFolder}) ...`);
    execSync(`"${nodeExe}" "${HF_CLI}" check`, {
      cwd: hfDir,
      env: envWithTools,
      stdio: 'inherit'
    });
    return;
  }

  const outMp4 = path.join(outDir, `${tlBase}.mp4`);
  const outAlphaMov = path.join(outDir, `${tlBase}_hud_alpha.mov`);
  const outSfxWav = path.join(outDir, `${tlBase}_sfx_master.wav`);
  const outXml = path.join(outDir, `${tlBase}.xml`);
  fs.mkdirSync(outDir, { recursive: true });

  if (mode === 'mp4' || mode === 'reel') {
    console.log(`\n[HyperFrames] Rendering 9:16 MP4 -> ${outMp4}`);
    execSync(
      `"${nodeExe}" "${HF_CLI}" render . --output "${outMp4}" --fps ${data.fps || 30} --quality delivery --gpu --browser-gpu --workers 4`,
      { cwd: hfDir, env: envWithTools, stdio: 'inherit' }
    );

    const ffExe = ffBin ? path.join(ffBin, 'ffmpeg.exe') : 'ffmpeg';
    console.log(`\n[FFmpeg] Extracting synced mix audio w/ SFX -> ${outSfxWav}`);
    execSync(`"${ffExe}" -y -i "${outMp4}" -vn -acodec pcm_s16le -ar 48000 -ac 2 "${outSfxWav}"`, { stdio: 'ignore' });

    console.log('\n[HyperFrames] Measuring output loudness & peak...');
    execSync(`"${nodeExe}" "${HF_CLI}" audio "${outMp4}" --json`, {
      cwd: hfDir,
      env: envWithTools,
      stdio: 'inherit'
    });
  }

  if (mode === 'alpha' || mode === 'reel') {
    console.log(`\n[HyperFrames] Rendering ProRes 4444 Alpha HUD MOV -> ${outAlphaMov}`);
    execSync(
      `"${nodeExe}" "${HF_CLI}" render . --output "${outAlphaMov}" --format mov --prores-profile 4444 --fps ${data.fps || 30} --quality delivery --browser-gpu --workers 4`,
      { cwd: hfAlphaDir, env: envWithTools, stdio: 'inherit' }
    );
  }

  const bestAudio = fs.existsSync(outSfxWav) ? outSfxWav : data.masterAudioAbsPath;
  writeResolveXml(data, `${tlBase}_Editable`, fs.existsSync(outAlphaMov) ? outAlphaMov : null, bestAudio, outXml);
  console.log(`\n[Resolve XML] Updated -> ${outXml}`);
  deployResolveUtility();
}

main();
