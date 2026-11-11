// js/voice.js — تسجيل صوتي بسيط بالميكروفون، بيرجّع الصوت كـ data URL
// الاستخدام: const v = voiceRecorder(element, { maxSec: 60 });  v.value / v.busy / v.reset()
export function voiceRecorder(root, {
  maxSec = 60, maxChars = 600000,
  btnClass = 'btn', stopClass = 'btn', teacher = false, label = 'تسجيل صوت'
} = {}) {
  root.innerHTML = `<div class="vr-row"><button type="button" class="${btnClass}"></button><span class="vr-time" hidden></span></div><voice-player hidden${teacher ? ' teacher' : ''}></voice-player><div class="vr-err" role="alert"></div>`;
  const btn = root.querySelector('button'), timeEl = root.querySelector('.vr-time'),
        audio = root.querySelector('voice-player'), err = root.querySelector('.vr-err');
  let mode = 'idle', rec = null, stream = null, timer = null, t0 = 0, value = '';

  const mmss = s => Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');
  const stopTracks = () => { stream?.getTracks().forEach(t => t.stop()); stream = null; };
  const show = m => {
    mode = m;
    btn.textContent = m === 'rec' ? 'إيقاف التسجيل' : m === 'done' ? 'مسح التسجيل' : label;
    btn.className = m === 'idle' ? btnClass : stopClass;
    timeEl.hidden = m !== 'rec';
    audio.hidden = m !== 'done';
  };

  function reset() {
    err.textContent = '';
    clearInterval(timer);
    if (rec && rec.state === 'recording') { rec._cancel = true; rec.stop(); }
    stopTracks();
    audio.removeAttribute('src');
    value = ''; show('idle');
  }

  async function start() {
    if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
      err.textContent = 'المتصفح ده مش بيدعم التسجيل الصوتي.'; return;
    }
    try { stream = await navigator.mediaDevices.getUserMedia({ audio: true }); }
    catch { err.textContent = 'لازم تسمح للمتصفح باستخدام الميكروفون.'; return; }

    const mime = ['audio/webm;codecs=opus', 'audio/mp4', 'audio/webm'].find(m => MediaRecorder.isTypeSupported?.(m));
    let r;
    try { r = new MediaRecorder(stream, { ...(mime ? { mimeType: mime } : {}), audioBitsPerSecond: 20000 }); }
    catch { stopTracks(); err.textContent = 'مقدرتش أبدأ التسجيل على الجهاز ده.'; return; }

    const chunks = [];
    rec = r;
    r.ondataavailable = e => { if (e.data && e.data.size) chunks.push(e.data); };
    r.onstop = async () => {
      clearInterval(timer); stopTracks();
      if (r._cancel) return;
      const blob = new Blob(chunks, { type: r.mimeType || mime || 'audio/webm' });
      if (!blob.size) { err.textContent = 'التسجيل طلع فاضي، جرّب تاني.'; show('idle'); return; }
      const url = await new Promise(res => { const fr = new FileReader(); fr.onload = () => res(fr.result); fr.readAsDataURL(blob); });
      if (url.length > maxChars) { err.textContent = 'التسجيل طويل أوي، سجّل حاجة أقصر.'; show('idle'); return; }
      value = url; audio.setAttribute('src', url); show('done');
    };
    r.start(); t0 = Date.now(); show('rec');
    timeEl.textContent = mmss(0) + ' / ' + mmss(maxSec);
    timer = setInterval(() => {
      const s = Math.floor((Date.now() - t0) / 1000);
      timeEl.textContent = mmss(Math.min(s, maxSec)) + ' / ' + mmss(maxSec);
      if (s >= maxSec && r.state === 'recording') r.stop();
    }, 250);
  }

  btn.onclick = () => {
    err.textContent = '';
    if (mode === 'idle') start();
    else if (mode === 'rec') rec?.stop();
    else reset();
  };

  show('idle');
  return { get value() { return value; }, get busy() { return mode === 'rec'; }, reset };
}


/* ---------- مشغّل الصوت: <voice-player src="data:audio/..."> ---------- */
if (!document.getElementById('vp-css')) {
  const st = document.createElement('style'); st.id = 'vp-css';
  st.textContent = `
voice-player{display:block;direction:ltr;margin: 12px 0;}
voice-player[hidden]{display:none!important}
.vp{display:flex;align-items:center;gap:12px;background:#3F7BD0;border-radius:999px;padding:7px 18px 7px 7px;color:#fff;max-width:420px;box-shadow:0 4px 10px rgba(63,123,208,.35)}
.vp-b{flex:none;width:38px;height:38px;border-radius:50%;border:0;background:#fff;cursor:pointer;display:grid;place-items:center;padding:0}
.vp-b svg{width:16px;height:16px;fill:#3F7BD0}
.vp-b:focus-visible,.vp-w:focus-visible{outline:3px solid #F2A900;outline-offset:2px}
.vp-w{flex:1;min-width:0;height:34px;display:flex;align-items:center;gap:2px;cursor:pointer}
.vp-w i{display:block;flex:1;max-width:3px;min-width:1px;border-radius:2px;background:#fff;opacity:.5}
.vp-w i.on{opacity:1}
voice-player[teacher] .vp{background:#F2A900;color:#1B2236;box-shadow:0 4px 10px rgba(242,169,0,.4)}
voice-player[teacher] .vp-b{background:#1F2A5C}
voice-player[teacher] .vp-b svg{fill:#fff}
voice-player[teacher] .vp-w i{background:#1B2236}
.vp-t{font-size:.85rem;font-variant-numeric:tabular-nums;min-width:34px;text-align:right}`;
  document.head.appendChild(st);
}

const PLAY = '<path d="M8 5v14l11-7z"/>', PAUSE = '<path d="M7 5h4v14H7zM13 5h4v14h-4z"/>';
const mmss = s => { s = Math.max(0, Math.floor(s || 0)); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); };
let nowPlaying = null;

class VoicePlayer extends HTMLElement {
  static get observedAttributes() { return ['src']; }
  connectedCallback() { this.build(); }
  attributeChangedCallback() { if (this.isConnected) this.build(); }
  disconnectedCallback() { this.a?.pause(); }

  build() {
    this.a?.pause();
    const src = this.getAttribute('src');
    if (!src) { this.innerHTML = ''; this.a = null; return; }
    const N = 44; let seed = src.length % 997 + 7;
    const rnd = () => (seed = (seed * 9301 + 49297) % 233280) / 233280;
    let bars = '';
    for (let i = 0; i < N; i++) bars += `<i style="height:${Math.round(14 + 86 * Math.pow(Math.sin(Math.PI * (i + .5) / N), .7) * (.35 + .65 * rnd()))}%"></i>`;
    this.innerHTML = `<div class="vp"><button type="button" class="vp-b" aria-label="تشغيل"><svg viewBox="0 0 24 24">${PLAY}</svg></button><div class="vp-w" role="slider" tabindex="0" aria-label="مكان التشغيل">${bars}</div><span class="vp-t">0:00</span></div>`;
    const btn = this.querySelector('.vp-b'), icon = btn.firstChild, wave = this.querySelector('.vp-w'),
          t = this.querySelector('.vp-t'), bs = [...wave.children];
    const a = this.a = new Audio(); a.preload = 'metadata'; a.src = src;

    const upd = () => {
      const d = isFinite(a.duration) ? a.duration : 0, c = a.currentTime || 0;
      t.textContent = mmss((!a.paused || c > .05) ? c : d);
      const k = d ? Math.round(c / d * N) : 0;
      bs.forEach((b, i) => b.classList.toggle('on', i < k));
    };
    const setIcon = playing => { icon.innerHTML = playing ? PAUSE : PLAY; btn.setAttribute('aria-label', playing ? 'إيقاف مؤقت' : 'تشغيل'); };

    a.onloadedmetadata = () => {
      // تسجيلات المتصفح ساعات بتيجي بمدة Infinity، بنخليه يقرأ لآخر الملف مرة عشان نعرف المدة
      if (a.duration === Infinity) {
        a.currentTime = 1e101;
        a.ontimeupdate = () => { a.ontimeupdate = upd; a.currentTime = 0; upd(); };
      } else upd();
    };
    a.ontimeupdate = upd;
    a.onplay = () => setIcon(true);
    a.onpause = () => { setIcon(false); upd(); };
    a.onended = () => { a.currentTime = 0; setIcon(false); upd(); };

    btn.onclick = () => {
      if (a.paused) { if (nowPlaying && nowPlaying !== a) nowPlaying.pause(); nowPlaying = a; a.play().catch(() => {}); }
      else a.pause();
    };
    const seek = f => { if (isFinite(a.duration)) { a.currentTime = Math.min(Math.max(f, 0), 1) * a.duration; upd(); } };
    wave.onclick = e => { const r = wave.getBoundingClientRect(); seek((e.clientX - r.left) / r.width); };
    wave.onkeydown = e => {
      if (e.key === 'ArrowRight') { a.currentTime += 5; e.preventDefault(); }
      else if (e.key === 'ArrowLeft') { a.currentTime -= 5; e.preventDefault(); }
    };
  }
}
if (!customElements.get('voice-player')) customElements.define('voice-player', VoicePlayer);