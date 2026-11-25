/* api.js — shared by all three pages.
 * 1) CONFIG: paste the Web App URL (Deployment A) into API_URL. Leave it '' to run the DEMO.
 * 2) api(action, data): sends one request to the school server and returns its answer.
 * 3) Small helpers: esc(), brand(), session token storage, demo bar.
 * Nothing secret lives here: this file is public on GitHub. The server checks every PIN.
 */
const CONFIG = {
  API_URL: '',                 // e.g. 'https://script.google.com/macros/s/AKfy.../exec'
  COMPANY: 'Accounting and Database Management Customized Software By: A.I. Software Solutions · 08065725007, 08166565829'
};
const DEMO = !CONFIG.API_URL;
const DemoNet = { off: false };          // demo only: pretend the network is down
// A network failure (not a wrong PIN or score): the page keeps the work on the phone
function offline_(m) { const e = new Error(m); e.offline = true; return e; }

/* Offline drafts: kept on THIS phone (localStorage) until sent. Never holds a PIN or token. */
const local = {
  get: k => { try { return JSON.parse(localStorage.getItem(k) || 'null'); } catch (e) { return null; } },
  set: (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } },
  del: k => { try { localStorage.removeItem(k); } catch (e) {} },
  keys: pre => { try { return Object.keys(localStorage).filter(k => k.indexOf(pre) === 0); } catch (e) { return []; } }
};

const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const $ = id => document.getElementById(id);

let demoReady = null;
function loadDemo() {
  if (!demoReady) demoReady = new Promise((res, rej) => { const s = document.createElement('script'); s.src = 'assets/demo.js'; s.onload = res; s.onerror = () => rej(new Error('Demo data missing')); document.head.appendChild(s); });
  return demoReady;
}

async function api(action, data) {
  const body = Object.assign({ action: action }, data || {});
  let out;
  if (DEMO) {
    if (DemoNet.off) throw offline_('No connection. Check your internet and try again.');
    await loadDemo();
    await new Promise(r => setTimeout(r, 350));          // feel like a real network
    out = DemoServer.handle(JSON.parse(JSON.stringify(body)));
  } else {
    let res;
    try {
      // text/plain avoids the CORS "preflight" that Apps Script cannot answer
      res = await fetch(CONFIG.API_URL, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(body) });
    } catch (e) { throw offline_('No connection. Check your internet and try again.'); }
    if (!res.ok) throw offline_('The server did not answer (' + res.status + '). Try again shortly.');
    out = await res.json();
  }
  if (!out || !out.ok) throw new Error((out && out.error) || 'Something went wrong.');
  return out.data;
}

/* School name / logo / motto come from General Settings through the server */
async function brand() {
  try {
    const b = await api('branding');
    if (b.logo) { $('sLogo').src = b.logo; $('sLogo').hidden = false; }
    $('sName').textContent = b.name || '';
    $('sMotto').textContent = b.motto ? 'MOTTO: ' + b.motto : '';
    document.title = (b.name ? b.name + ' · ' : '') + document.title;
    return b;
  } catch (e) { $('sName').textContent = 'School Portal'; return {}; }
}

/* Token kept only for this browser tab; cleared on Sign out */
const store = {
  get: k => { try { return sessionStorage.getItem(k); } catch (e) { return null; } },
  set: (k, v) => { try { sessionStorage.setItem(k, v); } catch (e) {} },
  del: k => { try { sessionStorage.removeItem(k); } catch (e) {} }
};

function msg(el, text, kind) { el.innerHTML = text ? `<div class="msg ${kind || 'err'}">${esc(text)}</div>` : ''; }

function chrome() {
  // Company name + logo are fixed on every page; drop your logo file in assets/company-logo.png
  document.querySelectorAll('footer.co').forEach(f => { f.innerHTML = '<img src="assets/company-logo.png" alt="" onerror="this.remove()"><span></span>'; f.querySelector('span').textContent = CONFIG.COMPANY; });
  if (DEMO) {
    const d = document.createElement('div'); d.className = 'demo';
    d.innerHTML = '<b>DEMO with sample data. Nothing is saved to the school sheet.</b><button type="button" id="demoHelp">Demo sign-in details</button><button type="button" id="demoNet">Network: ON</button>';
    document.body.prepend(d);
    $('demoHelp').onclick = async () => { await loadDemo(); alertBox(DemoServer.help()); };
    $('demoNet').onclick = () => { DemoNet.off = !DemoNet.off; $('demoNet').textContent = 'Network: ' + (DemoNet.off ? 'OFF' : 'ON'); window.dispatchEvent(new Event(DemoNet.off ? 'offline' : 'online')); };
  }
}
function alertBox(html) {
  let b = $('alertBox');
  if (!b) { b = document.createElement('div'); b.id = 'alertBox'; b.className = 'card'; b.style.cssText = 'position:fixed;left:12px;right:12px;bottom:12px;z-index:9;box-shadow:0 6px 24px #0004;max-width:560px;margin:auto'; document.body.appendChild(b); }
  b.innerHTML = html + '<p><button class="btn2" type="button" onclick="this.closest(\'#alertBox\').remove()">Close</button></p>';
}
