const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 5050;

const securityHeaders = {
  'Strict-Transport-Security': 'max-age=63072000; includeSubDomains',
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'Content-Security-Policy': "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'",
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'X-XSS-Protection': '0'
};

const server = http.createServer((req, res) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.writeHead(405, { ...securityHeaders, 'Allow': 'GET, HEAD' });
    res.end('Method Not Allowed');
    return;
  }

  if (req.url === '/' || req.url === '/index.html') {
    res.writeHead(200, { ...securityHeaders, 'Content-Type': 'text/html' });
    res.end(fs.readFileSync(path.join(__dirname, 'index.html')));
  } else {
    res.writeHead(404, securityHeaders);
    res.end('Not found');
  }
});

server.listen(PORT, () => {
  console.log(`Dashboard UI running at http://localhost:${PORT}`);
});
