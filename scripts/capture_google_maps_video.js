/**
 * Google Maps HTML Stage Video Capture Engine
 * 
 * Drives headless Edge at 1080x1920 to capture the Google Maps cartography
 * (city altitude overview, camera dive, pulsing neon road trajectory, distance badge)
 * and exports broadcast-grade MP4 video clips ready for Blender VSE.
 */

const puppeteer = require('puppeteer-core');
const ffmpeg = require('@ffmpeg-installer/ffmpeg').path;
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const MAPS_OUT_DIR = path.join(__dirname, '..', 'output', 'maps');
fs.mkdirSync(MAPS_OUT_DIR, { recursive: true });

const SITES = [
  { num: 1, id: "01_PNK_Township", name: "P.N.K TOWNSHIP" },
  { num: 2, id: "02_Batawadi_Junction", name: "GREEN MEADOWS SMART TOWNSHIP" },
  { num: 3, id: "03_Kuvempunagara", name: "ROYAL PALMS LUXURY ENCLAVE" },
  { num: 4, id: "04_Amani_Lakeview", name: "AMANI LAKEVIEW COUNTY" },
  { num: 5, id: "05_Kyatsandra_Gateway", name: "HIGHWAY GATEWAY SMART CITY" }
];

async function captureMapVideo(site, browser) {
  const outputPath = path.join(MAPS_OUT_DIR, `${site.id}_Map.mp4`);
  console.log(`\n======================================================`);
  console.log(`🗺️  Capturing Google Maps Video: Site ${site.num} - ${site.name}`);
  console.log(`Target: ${outputPath}`);

  const page = await browser.newPage();
  await page.setViewport({ width: 1080, height: 1920, deviceScaleFactor: 1 });

  const ffmpegProc = spawn(ffmpeg, [
    '-y',
    '-f', 'image2pipe',
    '-vcodec', 'mjpeg',
    '-r', '30',
    '-i', '-',
    '-c:v', 'libx264',
    '-preset', 'fast',
    '-crf', '18',
    '-pix_fmt', 'yuv420p',
    outputPath
  ]);

  let isCapturing = false;
  let frameCount = 0;
  const client = await page.target().createCDPSession();

  client.on('Page.screencastFrame', async ({ data, sessionId }) => {
    if (isCapturing) {
      frameCount++;
      ffmpegProc.stdin.write(Buffer.from(data, 'base64'));
    }
    try {
      await client.send('Page.screencastFrameAck', { sessionId });
    } catch (e) {}
  });

  const url = `http://localhost:3000/?site=${site.num}&mapsOnly=true&single=true&autostart=false`;
  await page.goto(url, { waitUntil: 'domcontentloaded' });

  // Wait 1.0s for Google Maps tiles and platinum styling to settle
  await new Promise(r => setTimeout(r, 1000));

  // Start Screencast
  isCapturing = true;
  await client.send('Page.startScreencast', {
    format: 'jpeg',
    quality: 92,
    maxWidth: 1080,
    maxHeight: 1920,
    everyNthFrame: 1
  });

  // Allow 300ms for CDP screencast pipeline to warm up
  await new Promise(r => setTimeout(r, 300));

  // Trigger the slow cinematic flight precisely from frame 0
  await page.evaluate(() => {
    if (window.startAutonomousReelPipeline) {
      window.startAutonomousReelPipeline();
    }
  });

  console.log(`Recording Slow Cinematic Flight (1.5s Wide Overview + 6.0s Slow Majestic Dive + 2.5s Ground Hold)...`);

  // Wait for animation to finish or maximum 16 seconds
  const startTime = Date.now();
  while (Date.now() - startTime < 16000) {
    const isDone = await page.evaluate(() => window.__ALL_REELS_COMPLETE || window.__SITE_MAP_COMPLETE);
    if (isDone) {
      // Allow 500ms tail buffer
      await new Promise(r => setTimeout(r, 500));
      break;
    }
    await new Promise(r => setTimeout(r, 150));
  }

  isCapturing = false;
  try {
    await client.send('Page.stopScreencast');
  } catch (e) {}

  ffmpegProc.stdin.end();
  await new Promise(r => ffmpegProc.on('close', r));
  await page.close();

  if (fs.existsSync(outputPath)) {
    const sizeMb = (fs.statSync(outputPath).size / (1024 * 1024)).toFixed(2);
    console.log(`✅ Google Maps Video Saved: ${outputPath} (${sizeMb} MB, ${frameCount} frames)`);
    return outputPath;
  }
  return null;
}

async function captureFullPresentation(browser) {
  const outputPath = path.join(MAPS_OUT_DIR, `00_Google_Maps_5_Sites_Presentation.mp4`);
  console.log(`\n======================================================`);
  console.log(`🗺️  Capturing Full 5-Site Google Maps Presentation...`);
  console.log(`Target: ${outputPath}`);

  const page = await browser.newPage();
  await page.setViewport({ width: 1080, height: 1920, deviceScaleFactor: 1 });

  const ffmpegProc = spawn(ffmpeg, [
    '-y',
    '-f', 'image2pipe',
    '-vcodec', 'mjpeg',
    '-r', '30',
    '-i', '-',
    '-c:v', 'libx264',
    '-preset', 'fast',
    '-crf', '19',
    '-pix_fmt', 'yuv420p',
    outputPath
  ]);

  let isCapturing = false;
  let frameCount = 0;
  const client = await page.target().createCDPSession();

  client.on('Page.screencastFrame', async ({ data, sessionId }) => {
    if (isCapturing) {
      frameCount++;
      ffmpegProc.stdin.write(Buffer.from(data, 'base64'));
    }
    try {
      await client.send('Page.screencastFrameAck', { sessionId });
    } catch (e) {}
  });

  await page.goto('http://localhost:3000/?loop=true', { waitUntil: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 1500));

  isCapturing = true;
  await client.send('Page.startScreencast', {
    format: 'jpeg',
    quality: 90,
    maxWidth: 1080,
    maxHeight: 1920,
    everyNthFrame: 1
  });

  console.log(`Recording 5 sites continuous presentation (~90 seconds)...`);

  const startTime = Date.now();
  // Maximum duration: 92 seconds (5 sites * 17.7s)
  while (Date.now() - startTime < 92000) {
    const isCycleDone = await page.evaluate(() => window.__REEL_CYCLE_COMPLETE);
    if (isCycleDone) {
      console.log(`Full 5-site cycle finished!`);
      break;
    }
    await new Promise(r => setTimeout(r, 1000));
  }

  isCapturing = false;
  try {
    await client.send('Page.stopScreencast');
  } catch (e) {}

  ffmpegProc.stdin.end();
  await new Promise(r => ffmpegProc.on('close', r));
  await page.close();

  if (fs.existsSync(outputPath)) {
    const sizeMb = (fs.statSync(outputPath).size / (1024 * 1024)).toFixed(2);
    console.log(`✅ Full Presentation Video Saved: ${outputPath} (${sizeMb} MB, ${frameCount} frames)`);
    return outputPath;
  }
  return null;
}

async function main() {
  const args = process.argv.slice(2);
  const isAll = args.includes('--all');
  const isFull = args.includes('--full');
  const siteArg = args.includes('--site') ? parseInt(args[args.indexOf('--site') + 1]) : 1;

  const browser = await puppeteer.launch({
    executablePath: EDGE_PATH,
    headless: 'new',
    defaultViewport: { width: 1080, height: 1920, deviceScaleFactor: 1 },
    args: [
      '--no-sandbox',
      '--window-size=1080,1920',
      '--autoplay-policy=no-user-gesture-required',
      '--disable-gpu-vsync'
    ]
  });

  try {
    if (isFull) {
      await captureFullPresentation(browser);
    } else if (isAll) {
      for (const site of SITES) {
        await captureMapVideo(site, browser);
      }
    } else {
      const target = SITES.find(s => s.num === siteArg) || SITES[0];
      await captureMapVideo(target, browser);
    }
  } finally {
    await browser.close();
  }

  console.log(`\n🎉 Google Maps Video capture finished! Output in: ${MAPS_OUT_DIR}`);
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { captureMapVideo, captureFullPresentation };
