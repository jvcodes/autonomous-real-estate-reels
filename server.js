// High-performance local web server for Real Estate Map & Video Reels
// Supports Range requests (HTTP 206) for smooth video seeking & streaming
// Serves both C:\sites\map and C:\sites\agent_project

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const MAP_DIR = __dirname;
const AGENT_PROJECT_DIR = path.resolve('C:\\sites\\agent_project');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.ico': 'image/x-icon'
};

const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  let reqPath = decodeURI(req.url.split('?')[0]);
  let filePath;

  // Route requests for agent_project files
  if (reqPath.startsWith('/agent_project/')) {
    const subPath = reqPath.replace(/^\/agent_project\//, '');
    filePath = path.join(AGENT_PROJECT_DIR, subPath);
    if (!filePath.startsWith(AGENT_PROJECT_DIR)) {
      res.writeHead(403);
      res.end('Forbidden');
      return;
    }
  } else {
    if (reqPath === '/' || reqPath === '') reqPath = '/index.html';
    filePath = path.join(MAP_DIR, reqPath);
    if (!filePath.startsWith(MAP_DIR)) {
      res.writeHead(403);
      res.end('Forbidden');
      return;
    }
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('File Not Found: ' + reqPath);
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    const range = req.headers.range;

    // HTTP 206 Partial Content (critical for MP4 video streaming)
    if (range && (ext === '.mp4' || ext === '.webm')) {
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : stats.size - 1;
      const chunksize = (end - start) + 1;
      const file = fs.createReadStream(filePath, { start, end });

      res.writeHead(206, {
        'Content-Range': `bytes ${start}-${end}/${stats.size}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunksize,
        'Content-Type': contentType
      });
      file.pipe(res);
    } else {
      res.writeHead(200, {
        'Content-Length': stats.size,
        'Content-Type': contentType,
        'Cache-Control': 'no-cache'
      });
      fs.createReadStream(filePath).pipe(res);
    }
  });
});

server.listen(PORT, () => {
  const url = `http://localhost:${PORT}`;
  console.log(`====================================================`);
  console.log(`🚀 Real Estate Map & Reels Server Running!`);
  console.log(`📍 Open in Browser: ${url}`);
  console.log(`📁 Serving Map: ${MAP_DIR}`);
  console.log(`📁 Serving Videos: ${AGENT_PROJECT_DIR}`);
  console.log(`====================================================`);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.log(`Port ${PORT} is busy, retrying or already running.`);
  } else {
    console.error(err);
  }
});
