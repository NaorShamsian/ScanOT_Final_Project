const http = require('http');
const srv = http.createServer((req, res) => {
  const u = new URL(req.url, 'http://x');

  if (req.method === 'GET' && u.pathname === '/health') {
    res.writeHead(200, {'Content-Type':'application/json'});
    return res.end(JSON.stringify({ ok: true }));
  }

  if (req.method === 'GET' && u.pathname === '/targets') {
    res.writeHead(200, {'Content-Type':'application/json'});
    return res.end(JSON.stringify({ targets: ['10.0.0.1','example.com'] }));
  }

  if (req.method === 'POST' && u.pathname === '/scan') {
    let b = '';
    req.on('data', d => b += d);
    req.on('end', () => {
      let o = {};
      try { o = JSON.parse(b || '{}'); } catch(e) {}
      res.writeHead(202, {'Content-Type':'application/json'});
      return res.end(JSON.stringify({
        accepted: true,
        target: o.target || 'unknown',
        type: o.type || 'basic',
        id: 'scan_' + Date.now()
      }));
    });
    return;
  }

  res.writeHead(404);
  res.end();
});
srv.listen(8080, '0.0.0.0');
