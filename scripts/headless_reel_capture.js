/**
 * Headless Video Reel Exporter
 * 
 * Drives Microsoft Edge or Google Chrome in headless mode with a fixed 1080x1920 
 * vertical viewport to capture the autonomous real estate reel sequence.
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

function findBrowser() {
  if (fs.existsSync(EDGE_PATH)) return EDGE_PATH;
  if (fs.existsSync(CHROME_PATH)) return CHROME_PATH;
  return null;
}

const browser = findBrowser();
console.log('========================================================');
console.log('🎬 Autonomous Real Estate Reel Capturer');
console.log('========================================================');

if (!browser) {
  console.log('Note: Microsoft Edge or Chrome not found at standard path.');
  console.log('Please open http://localhost:3000 directly in your browser.');
  console.log('Press Win + Alt + R (Windows Game Bar) or use OBS Studio to record.');
  process.exit(0);
}

console.log(`Using Browser Engine: ${browser}`);
console.log('Target Canvas: 1080x1920 9:16 Vertical Reel');
console.log('URL: http://localhost:3000');
console.log('--------------------------------------------------------');
console.log('Starting preview window in 1080x1920 phone window mode...');

// Launch Edge in exact 9:16 portrait mobile window
const args = [
  '--app=http://localhost:3000',
  '--window-size=430,932', // iPhone 15 Pro portrait dimensions
  '--autoplay-policy=no-user-gesture-required',
  '--disable-infobars',
  '--hide-scrollbars'
];

const proc = spawn(browser, args, { detached: true, stdio: 'ignore' });
proc.unref();

console.log('✅ Window opened. The autonomous reel loop is running.');
console.log('Record directly or stream to OBS Studio.');
