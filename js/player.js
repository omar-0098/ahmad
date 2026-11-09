/* ===========================================================
   مشغّل فيديو مخصوص + طبقات حماية (رادعة)
   createPlayer(host, { kind:'html5'|'youtube'|'iframe', src, ytId, title, mark:{name,phone} })
   protectPage()  ← بتتنادى مرة واحدة في صفحة الكورس
   =========================================================== */

const STRICT = true;   // true = الفيديو يقف لو الطالب خرج من الصفحة أو النافذة

const I = {
  play:  '<svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>',
  pause: '<svg viewBox="0 0 24 24"><path d="M6 5h4v14H6zM14 5h4v14h-4z"/></svg>',
  back:  '<svg viewBox="0 0 24 24"><path d="M12 5V2L7 6l5 4V7a6 6 0 1 1-6 6H4a8 8 0 1 0 8-8z"/><text x="12" y="16.500" font-size="7" text-anchor="middle" font-weight="800">10</text></svg>',
  fwd:   '<svg viewBox="0 0 24 24"><path d="M12 5V2l5 4-5 4V7a6 6 0 1 0 6 6h2a8 8 0 1 1-8-8z"/><text x="12" y="16.500" font-size="7" text-anchor="middle" font-weight="800">10</text></svg>',
  vol:   '<svg viewBox="0 0 24 24"><path d="M3 9v6h4l5 5V4L7 9H3zm13.500 3A4.500 4.500 0 0 0 14 8v8a4.500 4.500 0 0 0 2.500-4zM14 3.200v2.100a7 7 0 0 1 0 13.400v2.100a9 9 0 0 0 0-17.600z"/></svg>',
  mute:  '<svg viewBox="0 0 24 24"><path d="M3 9v6h4l5 5V4L7 9H3zm13.600 3 2.400-2.400-1.400-1.400-2.400 2.400-2.400-2.400-1.400 1.400 2.400 2.400-2.400 2.400 1.400 1.400 2.400-2.400 2.400 2.400 1.400-1.400z"/></svg>',
  fs:    '<svg viewBox="0 0 24 24"><path d="M5 5h5v2H7v3H5V5zm9 0h5v5h-2V7h-3V5zM5 14h2v3h3v2H5v-5zm12 0h2v5h-5v-2h3v-3z"/></svg>',
  fsx:   '<svg viewBox="0 0 24 24"><path d="M8 5v3H5v2h5V5H8zm8 0h-2v5h5V8h-3V5zM5 14v2h3v3h2v-5H5zm9 0v5h2v-3h3v-2h-5z"/></svg>',
  redo:  '<svg viewBox="0 0 24 24"><path d="M12 5V1L7 6l5 5V7a6 6 0 1 1-6 6H4a8 8 0 1 0 8-8z"/></svg>'
};
const RATES = [0.75, 1, 1.25, 1.5, 2];

const CSS = `
.pl{position:absolute;inset:0;background:#000;overflow:hidden;direction:rtl;user-select:none;-webkit-user-select:none;-webkit-touch-callout:none;font-family:'Cairo',sans-serif;color:#fff;outline:none}
.pl-stage,.pl-stage video,.pl-stage iframe{position:absolute;inset:0;width:100%;height:100%;border:0;background:#000}
.pl-stage video{object-fit:contain}
.pl-shield{position:absolute;inset:0;z-index:2;cursor:pointer}
.pl-ifr .pl-shield,.pl-ifr .pl-bar,.pl-ifr .pl-big,.pl-ifr .pl-top,.pl-ifr .pl-spin{display:none}
.pl-wm{position:absolute;inset:0;z-index:3;pointer-events:none;overflow:hidden}
.pl-wm-m{position:absolute;top:0;left:0;padding:3px 10px;border-radius:6px;background:rgba(0,0,0,.28);color:#fff;font-weight:700;font-size:clamp(.7rem,1.6vw,.95rem);opacity:.55;white-space:nowrap;direction:ltr;will-change:transform;text-shadow:0 1px 2px rgba(0,0,0,.6)}
.pl-top{position:absolute;top:0;inset-inline:0;z-index:4;padding:14px 18px 30px;background:linear-gradient(rgba(0,0,0,.65),transparent);font-weight:800;transition:opacity .3s;pointer-events:none;overflow:hidden;white-space:nowrap;text-overflow:ellipsis}
.pl-spin{position:absolute;z-index:5;top:50%;left:50%;width:54px;height:54px;margin:-27px 0 0 -27px;border-radius:50%;border:5px solid rgba(255,255,255,.25);border-top-color:#F2A900;animation:pls .8s linear infinite;display:none;pointer-events:none}
.pl.buf .pl-spin{display:block}
@keyframes pls{to{transform:rotate(360deg)}}
.pl-big{position:absolute;z-index:5;top:50%;left:50%;translate:-50% -50%;width:86px;height:86px;border-radius:50%;border:0;background:#F2A900;color:#17255E;display:grid;place-items:center;cursor:pointer;box-shadow:0 10px 30px rgba(0,0,0,.45);transition:transform .2s,opacity .25s}
.pl-big svg{width:44px;height:44px;fill:currentColor}
.pl-big::after{content:"";position:absolute;inset:-10px;border-radius:50%;border:3px solid #F2A900;opacity:.6;animation:plp 1.800s ease-out infinite}
@keyframes plp{to{transform:scale(1.35);opacity:0}}
.pl.playing .pl-big{opacity:0;pointer-events:none;transform:scale(.7)}
.pl-bar{position:absolute;z-index:6;inset-inline:12px;bottom:12px;padding:10px 14px 6px;border-radius:16px;background:rgba(20,27,61,.84);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);transition:opacity .3s,transform .3s}
.pl.idle.playing .pl-bar,.pl.idle.playing .pl-top{opacity:0;transform:translateY(8px)}
.pl.idle.playing{cursor:none}
.pl-prog{position:relative;height:6px;border-radius:6px;background:rgba(255,255,255,.22);cursor:pointer;margin:6px 0 8px;touch-action:none}
.pl-prog::before{content:"";position:absolute;inset:-12px 0}
.pl-buf,.pl-fill{position:absolute;top:0;bottom:0;right:0;border-radius:6px;width:0}
.pl-buf{background:rgba(255,255,255,.3)}.pl-fill{background:#F2A900}
.pl-knob{position:absolute;top:50%;right:0;width:14px;height:14px;border-radius:50%;background:#fff;translate:50% -50%;box-shadow:0 0 0 3px rgba(242,169,0,.55);transition:transform .15s}
.pl-prog:hover .pl-knob{transform:scale(1.3)}
.pl-row{display:flex;justify-content:space-between;align-items:center;gap:8px}
.pl-g{display:flex;align-items:center;gap:2px}
.pl-bar button{border:0;background:none;color:#fff;width:38px;height:38px;border-radius:10px;display:grid;place-items:center;cursor:pointer;font:inherit;font-weight:800}
.pl-bar button:hover{background:rgba(255,255,255,.14);color:#F2A900}
.pl-bar svg{width:24px;height:24px;fill:currentColor}
.pl-vol{display:flex;align-items:center}
.pl-vol input{width:0;opacity:0;transition:width .2s,opacity .2s;accent-color:#F2A900;margin:0;direction:ltr}
.pl-vol:hover input,.pl-vol:focus-within input{width:80px;opacity:1}
.pl-t{font-size:.85rem;direction:ltr;opacity:.92;padding-inline:8px;font-variant-numeric:tabular-nums;white-space:nowrap}
.pl-sp{position:relative}
.pl-sp>button{width:auto;padding:0 10px;font-size:.9rem}
.pl-menu{position:absolute;bottom:46px;inset-inline-end:0;display:none;background:#141B3D;border-radius:12px;padding:6px;box-shadow:0 10px 30px rgba(0,0,0,.45)}
.pl-menu.on{display:block}
.pl-bar .pl-menu button{width:100%;height:auto;padding:6px 18px;font-size:.9rem;border-radius:8px;white-space:nowrap;display:block}
.pl-bar .pl-menu button.on{background:#F2A900;color:#17255E}
.pl-msg{position:absolute;inset:0;z-index:9;background:rgba(8,11,28,.98);display:none;place-items:center;text-align:center;padding:20px}
.pl-msg.on{display:grid}
.pl-msg b{display:block;font-size:2.6rem}
.pl-msg p{margin:8px 0 16px;font-weight:700;line-height:1.7}
.pl-msg button{border:0;border-radius:10px;background:#F2A900;color:#17255E;font:inherit;font-weight:800;padding:10px 26px;cursor:pointer}
@media (max-width:560px){.pl-vol input{display:none}.pl-bar{inset-inline:6px;bottom:6px;padding:8px 8px 4px}.pl-big{width:68px;height:68px}.pl-big svg{width:34px;height:34px}.pl-t{padding-inline:4px;font-size:.78rem}}
@media print{.pl{display:none!important}}
`;
let styled = false;
function injectCSS(){ if (styled) return; styled = true; const s = document.createElement('style'); s.textContent = CSS; document.head.appendChild(s); }

const fmt = s => { s = Math.max(0, Math.floor(s || 0)); const h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60), x = s % 60, p = n => String(n).padStart(2, '0'); return (h ? h + ':' + p(m) : m) + ':' + p(x); };
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

/* ---------- محرّكات التشغيل ---------- */
function html5Engine(stage, src){
  const v = document.createElement('video');
  v.src = src; v.playsInline = true; v.preload = 'metadata'; v.controls = false; v.draggable = false;
  v.disablePictureInPicture = true; v.disableRemotePlayback = true;
  v.setAttribute('controlsList', 'nodownload noremoteplayback'); v.setAttribute('disablepictureinpicture', '');
  stage.appendChild(v);
  return {
    el: v,
    play: () => v.play().catch(() => {}), pause: () => v.pause(),
    seek: t => { v.currentTime = t; }, time: () => v.currentTime, dur: () => v.duration || 0,
    playing: () => !v.paused && !v.ended, ended: () => v.ended,
    buffering: () => !v.paused && v.readyState < 3 && !v.ended,
    buffered: () => (v.buffered.length && v.duration) ? v.buffered.end(v.buffered.length - 1) / v.duration : 0,
    setVol: x => { v.volume = x; if (x > 0) v.muted = false; }, vol: () => v.volume,
    setMuted: m => { v.muted = m; }, muted: () => v.muted || v.volume === 0,
    setRate: r => { v.playbackRate = r; },
    destroy: () => { try { v.pause(); v.removeAttribute('src'); v.load(); } catch {} }
  };
}

let ytLoading;
function loadYT(){
  if (window.YT && window.YT.Player) return Promise.resolve();
  if (ytLoading) return ytLoading;
  ytLoading = new Promise(res => {
    const prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => { if (prev) prev(); res(); };
    const s = document.createElement('script'); s.src = 'https://www.youtube.com/iframe_api'; document.head.appendChild(s);
  });
  return ytLoading;
}
function ytEngine(stage, id){
  const holder = document.createElement('div'); stage.appendChild(holder);
  let p = null, ok = false, st = -1, dead = false;
  loadYT().then(() => {
    if (dead) return;
    p = new window.YT.Player(holder, {
      host: 'https://www.youtube-nocookie.com', videoId: id, width: '100%', height: '100%',
      playerVars: { controls: 0, modestbranding: 1, rel: 0, disablekb: 1, fs: 0, iv_load_policy: 3, playsinline: 1, cc_load_policy: 0, origin: location.origin },
      events: { onReady: () => { ok = true; }, onStateChange: e => { st = e.data; } }
    });
  });
  const g = (f, d) => { try { return ok ? p[f]() : d; } catch { return d; } };
  return {
    play: () => ok && p.playVideo(), pause: () => ok && p.pauseVideo(),
    seek: t => ok && p.seekTo(t, true), time: () => g('getCurrentTime', 0), dur: () => g('getDuration', 0),
    playing: () => st === 1 || st === 3, ended: () => st === 0, buffering: () => st === 3,
    buffered: () => g('getVideoLoadedFraction', 0),
    setVol: x => { if (!ok) return; p.setVolume(Math.round(x * 100)); if (x > 0) p.unMute(); },
    vol: () => g('getVolume', 100) / 100,
    setMuted: m => ok && (m ? p.mute() : p.unMute()), muted: () => g('isMuted', false),
    setRate: r => ok && p.setPlaybackRate(r),
    destroy: () => { dead = true; try { p && p.destroy(); } catch {} }
  };
}

/* ---------- المشغّل ---------- */
const players = new Set();

export function createPlayer(host, opts){
  injectCSS();
  const { kind = 'html5', src = '', ytId = '', title = '', mark = {} } = opts || {};
  host.innerHTML = '';
  const root = document.createElement('div');
  root.className = 'pl' + (kind === 'iframe' ? ' pl-ifr' : '');
  root.tabIndex = 0;
  root.innerHTML = `
    <div class="pl-stage"></div>
    <div class="pl-shield"></div>
    <div class="pl-wm"></div>
    <div class="pl-top">${esc(title)}</div>
    <div class="pl-spin"></div>
    <button class="pl-big" type="button" aria-label="تشغيل">${I.play}</button>
    <div class="pl-bar">
      <div class="pl-prog" role="slider" aria-label="شريط التقدم"><div class="pl-buf"></div><div class="pl-fill"></div><div class="pl-knob"></div></div>
      <div class="pl-row">
        <div class="pl-g">
          <button type="button" data-a="pp" aria-label="تشغيل / إيقاف">${I.play}</button>
          <button type="button" data-a="b" aria-label="رجوع ١٠ ثواني">${I.back}</button>
          <button type="button" data-a="f" aria-label="تقديم ١٠ ثواني">${I.fwd}</button>
          <div class="pl-vol"><button type="button" data-a="mute" aria-label="الصوت">${I.vol}</button><input type="range" min="0" max="1" step="0.05" value="1" aria-label="مستوى الصوت"></div>
          <span class="pl-t">0:00 / 0:00</span>
        </div>
        <div class="pl-g">
          <div class="pl-sp"><button type="button" data-a="sp" aria-label="السرعة">1×</button>
            <div class="pl-menu">${RATES.map(r => `<button type="button" data-r="${r}" class="${r === 1 ? 'on' : ''}">${r}×</button>`).join('')}</div></div>
          <button type="button" data-a="fs" aria-label="ملء الشاشة">${I.fs}</button>
        </div>
      </div>
    </div>
    <div class="pl-msg"><div><b>🔒</b><p></p><button type="button">متابعة</button></div></div>`;
  host.appendChild(root);

  const $ = s => root.querySelector(s);
  const stage = $('.pl-stage');

  /* ===== العلامة المائية ===== */
  const label = [mark.name, mark.phone].filter(Boolean).join(' • ') || 'محمي';
  let wmRaf = 0;
  function buildWM(){
    const wm = $('.pl-wm'); wm.innerHTML = '';
    const m = document.createElement('div'); m.className = 'pl-wm-m'; m.textContent = label; wm.appendChild(m);
    cancelAnimationFrame(wmRaf);
    // حركة مستمرة وناعمة: الاسم والرقم يمشوا في الشاشة ويرتدّوا من الحواف ويغيّروا اتجاههم وسرعتهم كل كام ثانية
    let x = Math.random() * 200, y = Math.random() * 100;
    let ang = Math.random() * Math.PI * 2, sp = 60;
    let vx = Math.cos(ang) * sp, vy = Math.sin(ang) * sp;
    let last = performance.now(), turn = last + 3500;
    const step = now => {
      const dt = Math.min(.1, (now - last) / 1000); last = now;
      const W = wm.clientWidth - m.offsetWidth, H = wm.clientHeight - m.offsetHeight;
      if (W > 0 && H > 0) {
        if (now > turn) {
          ang = Math.atan2(vy, vx) + (Math.random() - .5) * 1.8; sp = 45 + Math.random() * 55;
          vx = Math.cos(ang) * sp; vy = Math.sin(ang) * sp; turn = now + 3000 + Math.random() * 3000;
        }
        x += vx * dt; y += vy * dt;
        if (x < 0) { x = 0; vx = Math.abs(vx); } else if (x > W) { x = W; vx = -Math.abs(vx); }
        if (y < 0) { y = 0; vy = Math.abs(vy); } else if (y > H) { y = H; vy = -Math.abs(vy); }
        m.style.transform = `translate(${x}px,${y}px)`;
      }
      wmRaf = requestAnimationFrame(step);
    };
    wmRaf = requestAnimationFrame(step);
  }
  buildWM();

  /* ===== المحرّك ===== */
  let eng = null;
  if (kind === 'html5') eng = html5Engine(stage, src);
  else if (kind === 'youtube') eng = ytEngine(stage, ytId);
  else {
    const f = document.createElement('iframe');
    f.src = src; f.title = title; f.allowFullscreen = true; f.referrerPolicy = 'strict-origin-when-cross-origin';
    f.setAttribute('allow', 'autoplay; encrypted-media; picture-in-picture; fullscreen');
    stage.appendChild(f);
  }

  const api = {
    root,
    halt(msg){ if (!eng || !eng.playing()) return; eng.pause(); show(msg); },
    flash(msg){ if (eng) eng.pause(); show(msg || 'تصوير الشاشة ممنوع.'); },
    destroy(){ clearInterval(tick); cancelAnimationFrame(wmRaf); clearInterval(guard); players.delete(api); if (eng) eng.destroy(); host.innerHTML = ''; }
  };
  players.add(api);

  function show(msg){ $('.pl-msg p').textContent = msg; $('.pl-msg').classList.add('on'); if (eng) update(); }
  $('.pl-msg button').addEventListener('click', () => $('.pl-msg').classList.remove('on'));

  if (!eng) {  // vimeo / drive: علامة مائية بس
    const guard = setInterval(checkWM, 1500);
    api.destroy = () => { cancelAnimationFrame(wmRaf); clearInterval(guard); players.delete(api); host.innerHTML = ''; };
    return api;
  }

  /* ===== التحكم ===== */
  const toggle = () => { if (eng.ended()) { eng.seek(0); eng.play(); } else if (eng.playing()) eng.pause(); else eng.play(); setTimeout(update, 60); wake(); };
  const skip = d => { eng.seek(Math.max(0, Math.min(eng.dur() || 1e9, eng.time() + d))); update(); wake(); };
  $('.pl-shield').addEventListener('click', toggle);
  $('.pl-big').addEventListener('click', toggle);

  const prog = $('.pl-prog');
  const seekAt = x => { const r = prog.getBoundingClientRect(), d = eng.dur(); if (!d) return; eng.seek(Math.max(0, Math.min(1, (r.right - x) / r.width)) * d); update(); };
  let drag = false;
  prog.addEventListener('pointerdown', e => { drag = true; prog.setPointerCapture(e.pointerId); seekAt(e.clientX); });
  prog.addEventListener('pointermove', e => { if (drag) seekAt(e.clientX); });
  prog.addEventListener('pointerup', () => { drag = false; });

  const vol = $('.pl-vol input');
  vol.addEventListener('input', () => { eng.setVol(Number(vol.value)); update(); });
  const menu = $('.pl-menu');

  root.addEventListener('click', e => {
    const b = e.target.closest('[data-a],[data-r]'); if (!b) { menu.classList.remove('on'); return; }
    if (b.dataset.r) { eng.setRate(Number(b.dataset.r)); menu.querySelectorAll('button').forEach(x => x.classList.toggle('on', x === b)); $('[data-a="sp"]').textContent = b.dataset.r + '×'; menu.classList.remove('on'); return; }
    switch (b.dataset.a) {
      case 'pp': toggle(); break;
      case 'b': skip(-10); break;
      case 'f': skip(10); break;
      case 'mute': eng.setMuted(!eng.muted()); if (!eng.muted() && eng.vol() === 0) eng.setVol(.6); update(); break;
      case 'sp': menu.classList.toggle('on'); break;
      case 'fs': {
        const fe = document.fullscreenElement || document.webkitFullscreenElement;
        if (fe) (document.exitFullscreen || document.webkitExitFullscreen).call(document);
        else if (root.requestFullscreen || root.webkitRequestFullscreen) (root.requestFullscreen || root.webkitRequestFullscreen).call(root);
        else if (eng.el && eng.el.webkitEnterFullscreen) eng.el.webkitEnterFullscreen();
        break;
      }
    }
  });

  root.addEventListener('keydown', e => {
    if (e.key === ' ' || e.key.toLowerCase() === 'k') { e.preventDefault(); toggle(); }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); skip(5); }
    else if (e.key === 'ArrowRight') { e.preventDefault(); skip(-5); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); eng.setVol(Math.min(1, eng.vol() + .1)); update(); }
    else if (e.key === 'ArrowDown') { e.preventDefault(); eng.setVol(Math.max(0, eng.vol() - .1)); update(); }
    else if (e.key.toLowerCase() === 'm') { eng.setMuted(!eng.muted()); update(); }
    else if (e.key.toLowerCase() === 'f') $('[data-a="fs"]').click();
  });

  /* إخفاء الأزرار تلقائيًا */
  let idleT;
  const wake = () => { root.classList.remove('idle'); clearTimeout(idleT); idleT = setTimeout(() => root.classList.add('idle'), 2600); };
  root.addEventListener('pointermove', wake); root.addEventListener('pointerdown', wake);

  /* تحديث الواجهة */
  const fill = $('.pl-fill'), buf = $('.pl-buf'), knob = $('.pl-knob'), tm = $('.pl-t');
  const ppBtn = $('[data-a="pp"]'), muteBtn = $('[data-a="mute"]'), fsBtn = $('[data-a="fs"]'), bigBtn = $('.pl-big');
  let last = '';
  function update(){
    const d = eng.dur(), t = eng.time(), pl = eng.playing(), en = eng.ended();
    const pct = d ? Math.min(100, t / d * 100) : 0;
    fill.style.width = pct + '%'; knob.style.right = pct + '%'; buf.style.width = Math.min(100, eng.buffered() * 100) + '%';
    tm.textContent = fmt(t) + ' / ' + fmt(d);
    root.classList.toggle('playing', pl && !en);
    root.classList.toggle('buf', !!eng.buffering());
    const k = [pl && !en, en, eng.muted(), !!(document.fullscreenElement || document.webkitFullscreenElement)].join();
    if (k !== last) {
      last = k;
      ppBtn.innerHTML = (pl && !en) ? I.pause : en ? I.redo : I.play;
      bigBtn.innerHTML = en ? I.redo : I.play;
      muteBtn.innerHTML = eng.muted() ? I.mute : I.vol;
      fsBtn.innerHTML = (document.fullscreenElement || document.webkitFullscreenElement) ? I.fsx : I.fs;
    }
    if (!eng.muted() && document.activeElement !== vol) vol.value = eng.vol();
  }
  const tick = setInterval(update, 200);
  update(); wake();

  /* حراسة العلامة المائية: لو اتشالت أو اتخبّت الفيديو يقف */
  function checkWM(){
    if (!root.isConnected) return;
    const m = root.querySelector('.pl-wm'), mv = m && m.querySelector('.pl-wm-m');
    let ok = !!(m && mv && m.isConnected);
    if (ok) { const a = getComputedStyle(m), b = getComputedStyle(mv); ok = a.display !== 'none' && a.visibility !== 'hidden' && +a.opacity > .5 && b.display !== 'none' && b.visibility !== 'hidden' && +b.opacity > .2 && mv.textContent === label; }
    if (!ok) { buildWM(); if (eng) eng.pause(); show('اتكشف تعديل في الصفحة. حدّث الصفحة وجرّب تاني.'); }
  }
  const guard = setInterval(checkWM, 1500);
  return api;
}

/* ---------- حماية الصفحة ---------- */
let prot = false;
export function protectPage(){
  if (prot) return; prot = true;
  const each = f => players.forEach(f);
  const inCourse = t => t && t.closest && t.closest('.cp');

  document.addEventListener('contextmenu', e => { if (inCourse(e.target)) e.preventDefault(); });
  document.addEventListener('dragstart', e => { if (inCourse(e.target)) e.preventDefault(); });
  document.addEventListener('selectstart', e => { if (e.target.closest && e.target.closest('.pl')) e.preventDefault(); });

  document.addEventListener('keydown', e => {
    const k = e.key || '', c = e.ctrlKey || e.metaKey;
    if (k === 'F12' || (c && e.shiftKey && /^[ijc]$/i.test(k)) || (c && /^[usp]$/i.test(k))) { e.preventDefault(); e.stopPropagation(); }
    if (e.metaKey && e.shiftKey && /^[345s]$/i.test(k)) each(p => p.flash());
  }, true);
  document.addEventListener('keyup', e => {
    if (e.key === 'PrintScreen' || e.key === 'Snapshot') {
      try { navigator.clipboard.writeText(' '); } catch {}
      each(p => p.flash());
    }
  });

  if (STRICT) {
    document.addEventListener('visibilitychange', () => { if (document.hidden) each(p => p.halt('الفيديو اتوقف لأنك خرجت من الصفحة.')); });
    window.addEventListener('blur', () => each(p => p.halt('الفيديو اتوقف لأنك خرجت من نافذة المشاهدة.')));
  }
}