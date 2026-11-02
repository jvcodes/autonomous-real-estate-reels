/**
 * Autonomous 1080x1920 Real Estate Reel Compiler
 * 
 * Takes raw walkthrough MP4 footage + dynamic HTML/CSS broadcast overlays + Edge-TTS voiceovers
 * and compiles them with FFmpeg into high-definition Instagram Reels / YouTube Shorts.
 */

const puppeteer = require('puppeteer-core');
const ffmpeg = require('@ffmpeg-installer/ffmpeg').path;
const { spawnSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const REELS_OUTPUT_DIR = path.join(__dirname, '..', 'output', 'reels');
const OVERLAYS_DIR = path.join(__dirname, '..', 'output', 'overlays');

fs.mkdirSync(REELS_OUTPUT_DIR, { recursive: true });
fs.mkdirSync(OVERLAYS_DIR, { recursive: true });

const MASTER_CATALOG = path.join(__dirname, '..', 'data', 'featured_reels_master.json');
const rawCatalog = JSON.parse(fs.readFileSync(MASTER_CATALOG, 'utf-8'));
const LAYOUTS = rawCatalog.map(l => ({
  ...l,
  color: l.colorHex,
  audioEn: path.join(__dirname, '..', 'output', 'audio', `${l.id}_en.mp3`),
  audioKn: path.join(__dirname, '..', 'output', 'audio', `${l.id}_kn.mp3`)
}));

// Helper to generate a 1080x1920 Transparent Broadcast Motion Graphics Overlay
async function generateOverlayImage(browser, layout, outputPath) {
  const page = await browser.newPage();
  await page.setViewport({ width: 1080, height: 1920, deviceScaleFactor: 1 });

  let storySegmentsHtml = '';
  const currentIdx = parseInt(layout.num) - 1;
  for (let i = 0; i < 5; i++) {
    const width = i <= currentIdx ? '100%' : '0%';
    storySegmentsHtml += `<div style="flex:1;height:8px;background:rgba(255,255,255,0.3);border-radius:4px;overflow:hidden;"><div style="width:${width};height:100%;background:#ffffff;border-radius:4px;"></div></div>`;
  }

  const tagsHtml = layout.tags.map(t => `<span style="background:rgba(255,255,255,0.16);border:1.5px solid rgba(255,255,255,0.25);padding:8px 18px;border-radius:12px;font-size:22px;font-weight:700;color:#f8fafc;">${t}</span>`).join(' ');

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; }
        body { width: 1080px; height: 1920px; background: transparent; overflow: hidden; position: relative; }
        
        .top-container {
          position: absolute;
          top: 40px;
          left: 40px;
          right: 40px;
          display: flex;
          flex-direction: column;
          gap: 25px;
        }
        .story-bar {
          display: flex;
          gap: 12px;
          width: 100%;
        }
        .header-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .rec-pill {
          display: flex;
          align-items: center;
          gap: 14px;
          background: rgba(11, 15, 23, 0.88);
          backdrop-filter: blur(20px);
          padding: 12px 28px;
          border-radius: 9999px;
          border: 2px solid rgba(255, 255, 255, 0.2);
          box-shadow: 0 10px 30px rgba(0,0,0,0.7);
        }
        .rec-dot {
          width: 16px;
          height: 16px;
          background: #ef4444;
          border-radius: 50%;
          box-shadow: 0 0 16px #ef4444;
        }
        .rec-text {
          font-size: 22px;
          font-weight: 900;
          color: #fff;
          letter-spacing: 1px;
        }
        .counter-badge {
          background: ${layout.color};
          color: #000;
          font-size: 22px;
          font-weight: 900;
          padding: 12px 28px;
          border-radius: 9999px;
          letter-spacing: 0.8px;
          box-shadow: 0 0 25px ${layout.color};
        }

        .road-badge-wrap {
          position: absolute;
          top: 175px;
          left: 40px;
        }
        .road-badge {
          background: rgba(11, 15, 23, 0.95);
          border: 2.5px solid ${layout.color};
          border-radius: 9999px;
          padding: 12px 26px;
          color: #ffffff;
          font-size: 24px;
          font-weight: 800;
          box-shadow: 0 15px 40px rgba(0,0,0,0.9), 0 0 30px ${layout.color};
          display: inline-block;
        }

        .bottom-card {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          padding: 80px 48px 60px;
          background: linear-gradient(0deg, rgba(0,0,0,0.98) 0%, rgba(0,0,0,0.85) 65%, transparent 100%);
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        .price-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .rate-badge {
          font-size: 46px;
          font-weight: 900;
          color: #34d399;
          text-shadow: 0 4px 20px rgba(52, 211, 153, 0.6);
          letter-spacing: -1px;
        }
        .start-price {
          font-size: 26px;
          font-weight: 800;
          background: rgba(255, 255, 255, 0.16);
          padding: 10px 22px;
          border-radius: 12px;
          color: #f1f5f9;
        }
        .title {
          font-size: 52px;
          font-weight: 900;
          color: #ffffff;
          letter-spacing: -1px;
          line-height: 1.1;
        }
        .landmark {
          font-size: 25px;
          color: #cbd5e1;
          line-height: 1.35;
        }
        .surrounding {
          display: flex;
          align-items: center;
          gap: 14px;
          background: rgba(255, 255, 255, 0.10);
          border: 1.5px solid rgba(255, 255, 255, 0.15);
          padding: 12px 24px;
          border-radius: 9999px;
          font-size: 22px;
          color: #e2e8f0;
          width: fit-content;
        }
        .surrounding-tag {
          color: ${layout.color};
          font-weight: 900;
          text-transform: uppercase;
        }
        .tags-row {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
          margin-top: 4px;
        }
      </style>
    </head>
    <body>
      <div class="top-container">
        <div class="story-bar">${storySegmentsHtml}</div>
        <div class="header-row">
          <div class="rec-pill">
            <div class="rec-dot"></div>
            <div class="rec-text">TUMKUR REEL</div>
          </div>
          <div class="counter-badge">SITE ${layout.num} OF ${layout.total}</div>
        </div>
      </div>

      <div class="road-badge-wrap">
        <div class="road-badge">${layout.roadDistance}</div>
      </div>

      <div class="bottom-card">
        <div class="price-row">
          <div class="rate-badge">${layout.rate}</div>
          <div class="start-price">${layout.startPrice}</div>
        </div>
        <div class="title">${layout.name}</div>
        <div class="landmark">📍 ${layout.landmark}</div>
        <div class="surrounding">
          <span class="surrounding-tag">Near:</span>
          <span>${layout.adjacent}</span>
        </div>
        <div class="tags-row">${tagsHtml}</div>
      </div>
    </body>
    </html>
  `;

  await page.setContent(html, { waitUntil: 'load' });
  await page.screenshot({ path: outputPath, omitBackground: true });
  await page.close();
}

async function renderReel(browser, layout, lang = 'en') {
  const audioFile = lang === 'kn' ? layout.audioKn : layout.audioEn;
  const outputMp4 = path.join(REELS_OUTPUT_DIR, `${layout.id}_Reel_${lang.toUpperCase()}.mp4`);
  const overlayPng = path.join(OVERLAYS_DIR, `${layout.id}_Overlay.png`);

  console.log(`\n======================================================`);
  console.log(`🎬 Compiling Reel: ${layout.name} (${lang.toUpperCase()})`);

  // 1. Generate Overlay PNG if missing
  if (!fs.existsSync(overlayPng)) {
    console.log(`Rendering 1080x1920 overlay graphics...`);
    await generateOverlayImage(browser, layout, overlayPng);
    console.log(`  -> Overlay saved: ${overlayPng}`);
  }

  // 2. Composite with FFmpeg
  console.log(`Executing FFmpeg render...`);
  const ffmpegArgs = [
    '-y',
    '-ss', '00:00:03',               // Skip initial 3s jitter
    '-t', '15',                      // 15s Reel length
    '-i', layout.rawVideo,           // Input 0: Raw Phone Walkthrough MP4
    '-i', overlayPng,                // Input 1: 1080x1920 Broadcast Overlay
    '-i', audioFile,                 // Input 2: Edge-TTS Voiceover MP3
    '-filter_complex',
    '[0:v]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,setsar=1[bg];[bg][1:v]overlay=0:0[vout]',
    '-map', '[vout]',
    '-map', '2:a',
    '-c:v', 'libx264',
    '-preset', 'fast',
    '-crf', '19',                    // High-quality broadcast bitstream
    '-pix_fmt', 'yuv420p',
    '-c:a', 'aac',
    '-b:a', '192k',
    '-shortest',
    outputMp4
  ];

  const result = spawnSync(ffmpeg, ffmpegArgs, { stdio: 'inherit' });
  if (result.status === 0) {
    const sizeMb = (fs.statSync(outputMp4).size / (1024 * 1024)).toFixed(2);
    console.log(`✅ Complete: ${outputMp4} (${sizeMb} MB)`);
    return outputMp4;
  } else {
    console.error(`❌ Error compiling reel:`, result.status);
    return null;
  }
}

async function main() {
  const isAll = process.argv.includes('--all');
  console.log('🚀 Starting Autonomous Real Estate Reel Compiler...');
  console.log(`Mode: ${isAll ? 'Batch Render ALL Layouts (EN & KN)' : 'Single Layout Render'}`);

  const browser = await puppeteer.launch({
    executablePath: EDGE_PATH,
    headless: "new",
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    if (isAll) {
      for (const layout of LAYOUTS) {
        await renderReel(browser, layout, 'en');
        await renderReel(browser, layout, 'kn');
      }
    } else {
      await renderReel(browser, LAYOUTS[0], 'en');
      await renderReel(browser, LAYOUTS[0], 'kn');
    }
  } finally {
    await browser.close();
  }

  console.log('\n======================================================');
  console.log('🎉 Done! All exported MP4 reels are ready in:');
  console.log(REELS_OUTPUT_DIR);
}

main().catch(console.error);
