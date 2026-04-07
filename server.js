'use strict';

const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

const PORT = parseInt(process.env.PORT, 10) || 3000;
const ROOT = __dirname;

const MIME_TYPES = {
  '.html':  'text/html; charset=utf-8',
  '.css':   'text/css; charset=utf-8',
  '.js':    'application/javascript; charset=utf-8',
  '.json':  'application/json; charset=utf-8',
  '.svg':   'image/svg+xml',
  '.png':   'image/png',
  '.jpg':   'image/jpeg',
  '.jpeg':  'image/jpeg',
  '.webp':  'image/webp',
  '.ico':   'image/x-icon',
  '.woff':  'font/woff',
  '.woff2': 'font/woff2',
  '.xml':   'application/xml',
  '.txt':   'text/plain; charset=utf-8',
  '.webmanifest': 'application/manifest+json',
};

/** Security headers applied to every response */
const SECURITY_HEADERS = {
  'X-Frame-Options':        'SAMEORIGIN',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy':        'strict-origin-when-cross-origin',
  'Permissions-Policy':     'camera=(), microphone=(), geolocation=(), payment=()',
};

/** Blocked filename patterns (basename match) */
const BLOCKED_EXTENSIONS = /\.(sql|log|env|bak|zip|gz|tar)$/i;
const BLOCKED_BASENAMES = new Set(['.env', '.gitignore', '.htaccess', 'config.php']);

/** Allowed URL characters — reject anything suspicious early */
const SAFE_URL_CHARS = /^[a-zA-Z0-9_.~:/?#[\]@!$&'()*+,;=%-]+$/;

/**
 * Resolve a URL pathname to a safe file path under ROOT.
 * Returns null if the path escapes ROOT (directory traversal).
 */
function safePath(urlPath) {
  const raw = urlPath.split('?')[0];
  if (!SAFE_URL_CHARS.test(raw)) return null;
  const decoded = decodeURIComponent(raw);
  // Reject paths with null bytes or explicit traversal
  if (decoded.includes('\0') || decoded.includes('..')) return null;
  const normalized = path.normalize(decoded);
  const resolved = path.join(ROOT, normalized);
  if (!resolved.startsWith(ROOT + path.sep) && resolved !== ROOT) return null;
  // When ROOT itself is requested, serve the index
  if (resolved === ROOT) return path.join(ROOT, 'index.html');
  return resolved;
}

/**
 * Check if a file path should be blocked from serving.
 */
function isBlocked(filePath) {
  const base = path.basename(filePath);
  return BLOCKED_EXTENSIONS.test(base) || BLOCKED_BASENAMES.has(base);
}

function cacheHeader(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === '.html' || path.basename(filePath) === 'sw.js') return 'no-cache';
  if (filePath.startsWith(path.join(ROOT, 'assets') + path.sep)) {
    return 'public, max-age=31536000, immutable';
  }
  return 'public, max-age=86400';
}

function serveFile(res, filePath, statusCode) {
  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(500, { ...SECURITY_HEADERS, 'Content-Type': 'text/plain' });
      res.end('Internal Server Error');
      return;
    }
    res.writeHead(statusCode, {
      ...SECURITY_HEADERS,
      'Content-Type': contentType,
      'Cache-Control': cacheHeader(filePath),
    });
    res.end(data);
  });
}

/** Path to the index.html file (constant, not user-derived) */
const INDEX_HTML = path.join(ROOT, 'index.html');

const server = http.createServer((req, res) => {
  // Only allow GET and HEAD for a static server
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.writeHead(405, { ...SECURITY_HEADERS, 'Content-Type': 'text/plain' });
    res.end('Method Not Allowed');
    return;
  }

  const filePath = safePath(req.url);
  if (!filePath) {
    res.writeHead(400, { ...SECURITY_HEADERS, 'Content-Type': 'text/plain' });
    res.end('Bad Request');
    return;
  }

  // Block sensitive files
  if (isBlocked(filePath)) {
    res.writeHead(403, { ...SECURITY_HEADERS, 'Content-Type': 'text/plain' });
    res.end('Forbidden');
    return;
  }

  fs.stat(filePath, (err, stats) => {
    if (!err && stats.isFile()) {
      serveFile(res, filePath, 200);
      return;
    }

    // Try index.html in directory
    if (!err && stats.isDirectory()) {
      const indexFile = path.join(filePath, 'index.html');
      fs.access(indexFile, fs.constants.R_OK, (err2) => {
        if (!err2) {
          serveFile(res, indexFile, 200);
        } else {
          serveFile(res, INDEX_HTML, 200);
        }
      });
      return;
    }

    // SPA fallback: serve index.html for any unmatched route
    serveFile(res, INDEX_HTML, 200);
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Lolanceizi server listening on http://0.0.0.0:${PORT}`);
});
