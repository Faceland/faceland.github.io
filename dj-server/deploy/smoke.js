#!/usr/bin/env node
// End-to-end check of a deployed room server from the outside: TLS, the HTTP
// root, and a real WebSocket join through nginx.
//
//   node deploy/smoke.js wss://host [origin]
//
// It joins the room as "smoke test" for a fraction of a second, so anyone in
// the room at that moment sees a face blink in and out. Exit code 0 on success.
'use strict';

const WebSocket = require('ws');

const [, , wsUrl, origin = 'http://localhost:3000'] = process.argv;
if (!wsUrl) {
  console.error('usage: smoke.js wss://host [origin]');
  process.exit(2);
}
const httpUrl = wsUrl.replace(/^ws/, 'http');

const fail = (message) => {
  console.error(`FAIL: ${message}`);
  process.exit(1);
};
const timer = setTimeout(() => fail('timed out after 15 s'), 15000);

(async () => {
  const res = await fetch(httpUrl);
  const text = (await res.text()).trim();
  if (!res.ok || !text.startsWith('Faceland DJ server:')) {
    fail(`unexpected HTTP root: ${res.status} ${text}`);
  }
  console.log(`http  ${httpUrl} -> ${text}`);

  const ws = new WebSocket(wsUrl, { origin });
  const seen = [];
  ws.on('unexpected-response', (req, r) =>
    fail(`upgrade refused with ${r.statusCode} (is ${origin} in ALLOWED_ORIGINS?)`),
  );
  ws.on('error', (err) => fail(err.message));
  ws.on('message', (data) => {
    const msg = JSON.parse(data);
    seen.push(msg);
    if (msg.t === 'state' && seen.length === 1) {
      console.log(`ws    connected; ${msg.users.length} in the room, ${msg.current ? 'a song playing' : 'nothing playing'}`);
      ws.send(JSON.stringify({ t: 'hello', v: 2, name: 'smoke test' }));
    }
    if (msg.t === 'welcome') {
      console.log(`ws    joined as ${msg.name} (${msg.id}); hello/welcome round trip ok`);
      ws.close(1000, 'smoke done');
    }
  });
  ws.on('close', (code) => {
    clearTimeout(timer);
    if (seen.some((m) => m.t === 'welcome')) {
      console.log('OK');
      process.exit(0);
    }
    fail(`socket closed (${code}) before the welcome`);
  });
})().catch((err) => fail(err.message));
