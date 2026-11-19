// Take the entry's screenshots with headless Chromium over CDP (Node 22
// built-in WebSocket client — no dependency to install). For each shot in
// shots.json it seeds localStorage (earned trophies, counts, spoiler
// setting), opens the view, waits for the app to render, then captures a
// 1280x800 JPEG. It also reports console errors and every network request,
// so the offline claim can be checked, and the JPEG's bytes and dimensions.
//
//   CHROME=/path/to/chrome node tools/shots.mjs [--port 8123]
import { spawn } from 'node:child_process';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const repo = join(dirname(fileURLToPath(import.meta.url)), '..');
const shots = JSON.parse(readFileSync(join(repo, 'shots.json'), 'utf8'));
const chrome = process.env.CHROME ?? `${process.env.HOME}/.cache/ms-playwright/chromium-1255/chrome-linux64/chrome`;
const port = Number(process.argv.find((a) => a.startsWith('--port='))?.split('=')[1] ?? 8123);
const debugPort = 9333;
const profileDir = `/tmp/gta6-shots-profile-${process.pid}`;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function jpegSize(buf) {
  // Walk JPEG markers to the first SOF frame for width/height.
  let i = 2;
  while (i < buf.length - 1) {
    if (buf[i] !== 0xff) { i += 1; continue; }
    const marker = buf[i + 1];
    if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) {
      return { height: buf.readUInt16BE(i + 5), width: buf.readUInt16BE(i + 7) };
    }
    const len = buf.readUInt16BE(i + 2);
    i += 2 + len;
  }
  return { height: 0, width: 0 };
}

async function main() {
  const server = spawn('node', ['serve.ts', '--port', String(port)], { cwd: repo, stdio: 'pipe' });
  let serverLog = '';
  server.stdout.on('data', (d) => { serverLog += d; });
  server.stderr.on('data', (d) => { serverLog += d; });
  await sleep(800);

  const browser = spawn(chrome, [
    '--headless=new', '--no-sandbox', '--disable-gpu',
    `--remote-debugging-port=${debugPort}`,
    `--user-data-dir=${profileDir}`, 'about:blank',
  ], { stdio: 'pipe' });
  // Wait for the DevTools endpoint to answer (cold start can take a while).
  for (let attempt = 0; attempt < 30; attempt += 1) {
    try {
      const res = await fetch(`http://127.0.0.1:${debugPort}/json/version`);
      if (res.ok) break;
    } catch { /* not up yet */ }
    await sleep(1000);
  }

  let failures = 0;
  for (const shot of shots) {
    const target = await (await fetch(`http://127.0.0.1:${debugPort}/json/new?about:blank`, { method: 'PUT' })).json();
    const ws = new WebSocket(target.webSocketDebuggerUrl);
    await new Promise((r) => { ws.onopen = r; });
    let id = 0;
    const pending = new Map();
    const consoleErrors = [];
    const requests = [];
    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.id && pending.has(msg.id)) { pending.get(msg.id)(msg); pending.delete(msg.id); }
      if (msg.method === 'Runtime.exceptionThrown') {
        consoleErrors.push(msg.params.exceptionDetails?.text ?? 'exception');
      }
      if (msg.method === 'Runtime.consoleAPICalled' && msg.params.type === 'error') {
        consoleErrors.push(msg.params.args.map((a) => a.value ?? a.description ?? '').join(' '));
      }
      if (msg.method === 'Network.requestWillBeSent') requests.push(msg.params.request.url);
    };
    const send = (method, params = {}) => new Promise((resolve) => {
      const mid = ++id;
      pending.set(mid, resolve);
      ws.send(JSON.stringify({ id: mid, method, params }));
    });
    await send('Runtime.enable');
    await send('Page.enable');
    await send('Network.enable');
    await send('Emulation.setDeviceMetricsOverride', { width: 1280, height: 800, deviceScaleFactor: 1, mobile: false });

    // First load so localStorage exists for this origin, then seed, then
    // reload so the app boots with the seeded state (a hash-only navigation
    // would not reload the page, and the app reads the store at boot).
    const base = `http://127.0.0.1:${port}/`;
    await send('Page.navigate', { url: base });
    await sleep(1200);
    const seed = shot.seed ?? {};
    await send('Runtime.evaluate', { expression: `
      localStorage.setItem('leonida-ledger.earned.v1', JSON.stringify(${JSON.stringify(seed.earned ?? [])}));
      localStorage.setItem('leonida-ledger.counts.v1', JSON.stringify(${JSON.stringify(seed.counts ?? {})}));
      localStorage.setItem('leonida-ledger.settings.v1', JSON.stringify(${JSON.stringify(seed.settings ?? { hideSpoilers: false })}));
      'seeded';
    `, awaitPromise: true });
    await send('Runtime.evaluate', { expression: `location.hash = '${shot.path.slice(1)}'; 'hash-set';` });
    await send('Page.reload', { ignoreCache: true });
    await sleep(1500);
    const rendered = await send('Runtime.evaluate', {
      expression: `({ rows: document.querySelectorAll('.trophy').length, progress: document.getElementById('progressText')?.textContent ?? '', url: location.href, detail: document.querySelector('.detail')?.innerText.slice(0, 60) ?? '', title: document.title })`,
      returnByValue: true,
    });
    console.log('  rendered:', JSON.stringify(rendered.result?.result?.value ?? rendered.result));
    const shot1 = await send('Page.captureScreenshot', { format: 'jpeg', quality: 82 });
    let buf = Buffer.from(shot1.result.data, 'base64');
    if (buf.length > 262144) {
      const shot2 = await send('Page.captureScreenshot', { format: 'jpeg', quality: 70 });
      buf = Buffer.from(shot2.result.data, 'base64');
    }
    const outPath = join(repo, 'screenshots', shot.file);
    mkdirSync(join(repo, 'screenshots'), { recursive: true });
    writeFileSync(outPath, buf);
    const dims = jpegSize(buf);
    const offOrigin = requests.filter((u) => !u.startsWith(`http://127.0.0.1:${port}`) && !u.startsWith('data:'));
    console.log(`${shot.file}: ${buf.length} bytes, ${dims.width}x${dims.height}, rows=${rendered.result.result.value.rows}, consoleErrors=${consoleErrors.length}, requests=${requests.length}, offOrigin=${offOrigin.length}`);
    if (consoleErrors.length) { console.log('  console errors:', consoleErrors); failures += 1; }
    if (offOrigin.length) { console.log('  off-origin requests:', offOrigin); failures += 1; }
    if (buf.length > 262144) { console.log('  TOO BIG'); failures += 1; }
    if (dims.width !== 1280 || dims.height !== 800) { console.log('  WRONG DIMENSIONS'); failures += 1; }
    ws.close();
  }
  browser.kill();
  server.kill();
  console.log(failures === 0 ? 'SHOTS OK' : `SHOTS: ${failures} problem(s)`);
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((err) => { console.error(err); process.exit(1); });
