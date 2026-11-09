/* ===========================================================
   محرّك الامتحانات (جهة الطالب)
   runExam(host, exam, { title, desc, key, prior, hasNext, onFinish(r), onNext() }) → { destroy() }
   exam = { passPct, gate, timeLimit, shuffle, maxAttempts, questions:[{q, img, topic, why, opts:[...], correct}] }
   =========================================================== */

const CSS = `
.cp .vid.ex{aspect-ratio:auto;display:block!important;place-items:stretch!important;padding:0;background:#fff;color:var(--ink);text-align:start;min-height:420px;width:100%}
.xm{width:100%;box-sizing:border-box;padding:22px 22px 26px;font-family:inherit;color:var(--ink,#16213E);line-height:1.7;position:relative;overflow:clip}
.xm button{font:inherit;cursor:pointer;color:var(--ink,#16213E)}
.xk{display:inline-block;background:var(--marker,#FFC83D);border:2px solid var(--ink,#16213E);border-radius:999px;padding:0 14px;font-weight:800;font-size:.85rem;margin-bottom:8px}
.xm h3{font-size:1.5rem;font-weight:900;margin-bottom:6px}
.xd{color:var(--muted,#5B6678);white-space:pre-line;margin-bottom:10px}
.xc{display:flex;flex-wrap:wrap;gap:8px;margin:12px 0}
.xc span{border:2px solid var(--ink,#16213E);border-radius:10px;padding:2px 12px;font-weight:700;font-size:.9rem;background:#fff}
.xb{border-radius:12px;padding:10px 14px;background:#F4F7F2;border:2px dashed var(--ink,#16213E);font-weight:600;margin:10px 0}
.xb.ok{background:#E6F6EC}.xb.gate{background:#FFF6D9}
.xt{margin:12px 0 18px;padding-inline-start:20px;color:#34405a;font-size:.95rem}
.xa{display:flex;flex-wrap:wrap;gap:10px}
.xp,.xs,.xf button,.xr .xa button{border:2px solid var(--ink,#16213E);border-radius:10px;padding:9px 20px;font-weight:800;background:#fff}
.xp{background:var(--marker,#FFC83D)!important;box-shadow:-3px 3px 0 var(--ink,#16213E);transition:box-shadow .15s,transform .15s}
.xp:hover{box-shadow:-1px 1px 0 var(--ink,#16213E);transform:translate(-2px,2px)}
.xs:hover,.xf button:hover:not(:disabled),.xr .xa button:hover{background:#fff8e1}
.xf button:disabled{opacity:.4;cursor:default}
.xh{display:flex;justify-content:space-between;align-items:center;gap:10px;font-weight:800;margin-bottom:8px}
.xtm{border:2px solid var(--ink,#16213E);border-radius:999px;padding:0 14px;background:#fff;font-variant-numeric:tabular-nums}
.xtm.low{background:var(--pen,#D7263D);color:#fff;animation:xpl 1s infinite}
@keyframes xpl{50%{opacity:.6}}
.xpb{height:10px;border:2px solid var(--ink,#16213E);border-radius:8px;background:#fff;overflow:hidden;margin-bottom:12px}
.xpb i{display:block;height:100%;background:var(--board,#1E4A42);transition:width .3s}
.xn{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:16px}
.xn button{width:32px;height:32px;border-radius:8px;border:2px solid var(--ink,#16213E);background:#fff;font-weight:800;font-size:.8rem;position:relative}
.xn .a{background:#cfe3dd}.xn .r{background:#bfe8cd}.xn .w{background:#f6c0c6}
.xn .f::after{content:"🚩";position:absolute;top:-10px;inset-inline-end:-6px;font-size:.7rem}
.xn .cur{background:var(--marker,#FFC83D)}
.xqt{font-size:1.2rem;font-weight:800;margin-bottom:12px}
.xim{max-width:100%;max-height:260px;border-radius:10px;border:2px solid var(--ink,#16213E);margin-bottom:12px;display:block}
.xo{display:grid;gap:10px;margin-bottom:14px}
.xop{display:flex;align-items:center;gap:12px;text-align:start;width:100%;padding:10px 14px;border:2px solid var(--ink,#16213E);border-radius:12px;background:#fff;font-weight:600}
.xop i{flex:none;width:32px;height:32px;border-radius:50%;border:2px solid var(--ink,#16213E);display:grid;place-items:center;font-style:normal;font-weight:800;background:#fff}
.xop:hover:not(:disabled){background:#fff8e1}
.xop.sel{background:#fff1bf;box-shadow:-3px 3px 0 var(--ink,#16213E)}.xop.sel i{background:var(--ink,#16213E);color:#fff}
.xop.ok{background:#d9f3e2}.xop.ok i{background:#1E8E4E;color:#fff;border-color:#1E8E4E}
.xop.no{background:#fbd6da}.xop.no i{background:var(--pen,#D7263D);color:#fff;border-color:var(--pen,#D7263D)}
.xop.dim{opacity:.55}
.xop:disabled{cursor:default}
.xo.grid{grid-template-columns:1fr 1fr}
.xo.row{display:flex;flex-wrap:wrap}.xo.row .xop{width:auto;flex:1 1 150px}
.xmeta{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:10px;font-size:.82rem;font-weight:700;color:var(--muted,#5B6678)}
.xmeta span{border:1.5px solid #cfd6df;border-radius:999px;padding:0 10px;background:#fafbfc}
.xq1{border:2px solid var(--ink,#16213E);border-radius:14px;padding:14px;margin-bottom:14px;background:#fff}
.xq1 .xo{margin-bottom:8px}
.xfb{border:2px solid var(--ink,#16213E);border-radius:10px;padding:2px 14px;background:#fff;font-weight:700;font-size:.85rem}
.xfb.on{background:var(--marker,#FFC83D)}
.xh.stk{position:sticky;top:0;z-index:3;background:#fff;padding:8px 0;margin-bottom:0}
.xw{border-radius:12px;padding:10px 14px;margin-bottom:12px;font-weight:700}
.xw.ok{background:#d9f3e2}.xw.no{background:#fbd6da}.xw p{font-weight:500;margin-top:4px}
.xf{display:flex;flex-wrap:wrap;gap:10px;justify-content:space-between}
.xf .on{background:var(--marker,#FFC83D)}
.xov{position:fixed;inset:0;z-index:300;background:rgba(22,33,62,.72);display:grid;place-items:center;padding:20px}
.xov>div{background:#fff;border:2px solid var(--ink,#16213E);border-radius:16px;padding:22px;max-width:380px;text-align:center}
.xov p{font-weight:700;margin-bottom:14px}.xov .xa{justify-content:center}
.xr{text-align:center}
.xg{width:160px;height:160px;margin:4px auto 6px;position:relative}
.xg svg{width:100%;height:100%;transform:rotate(-90deg)}
.xg circle{fill:none;stroke-width:12}
.xg .bg{stroke:#e3e9ee}
.xg .fg{stroke-linecap:round;animation:xring 1.1s ease-out}
@keyframes xring{from{stroke-dasharray:0 327}}
.xg b{position:absolute;inset:0;display:grid;place-items:center;font-size:2.1rem;font-weight:900}
.xv{font-size:1.4rem;font-weight:900;margin:2px 0 4px}
.xm .xs2{color:var(--muted,#5B6678);font-weight:700;margin-bottom:8px}
.xst{display:flex;justify-content:center;flex-wrap:wrap;gap:8px;margin:10px 0}
.xst span{border:2px solid var(--ink,#16213E);border-radius:10px;padding:2px 12px;font-weight:700;background:#fff}
.xst .g{background:#d9f3e2}.xst .b{background:#fbd6da}
.xtp{display:grid;grid-template-columns:110px 1fr 46px;gap:10px;align-items:center;text-align:start;margin:6px 0;font-weight:700;font-size:.9rem}
.xtp div{height:10px;border-radius:6px;background:#e3e9ee;overflow:hidden}.xtp i{display:block;height:100%;background:var(--board,#1E4A42)}
.xtp.weak i{background:var(--pen,#D7263D)}
.xrv .xrc{border:2px solid var(--ink,#16213E);border-radius:14px;padding:14px;margin-bottom:12px;text-align:start;background:#fff}
.xrv .xrc.bad{border-color:var(--pen,#D7263D)}
.xrv .xqt{font-size:1.05rem}
.xrv .xop{cursor:default;font-size:.95rem;padding:6px 12px}
.xrv .xop em{margin-inline-start:auto;font-style:normal;font-size:.78rem;font-weight:800}
.xflt{display:flex;gap:8px;margin-bottom:12px;flex-wrap:wrap}
.xflt button{border:2px solid var(--ink,#16213E);border-radius:999px;padding:2px 14px;background:#fff;font-weight:700}
.xflt .on{background:var(--ink,#16213E);color:#fff}
.xwhy{background:#FFF6D9;border-radius:10px;padding:8px 12px;margin-top:8px;font-weight:500}
.xcf{position:absolute;inset:0;pointer-events:none;overflow:hidden}
.xcf i{position:absolute;top:-12px;width:9px;height:14px;border-radius:2px;animation:xfall 2.6s linear forwards}
@keyframes xfall{to{transform:translateY(560px) rotate(540deg);opacity:.9}}
@media (prefers-reduced-motion:reduce){.xcf{display:none}.xg .fg,.xtm.low{animation:none}}
@media (max-width:560px){.xo.grid{grid-template-columns:1fr}.xm{padding:16px 12px 20px}.xtp{grid-template-columns:80px 1fr 40px}.xf{justify-content:center}}
`;
let styled = false;
const injectCSS = () => { if (styled) return; styled = true; const s = document.createElement('style'); s.textContent = CSS; document.head.appendChild(s); };

const ar = s => String(s).replace(/\d/g, d => '٠١٢٣٤٥٦٧٨٩'[d]);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const LET = ['أ', 'ب', 'ج', 'د', 'هـ', 'و'];
const shuf = a => { a = [...a]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const mmss = s => { s = Math.max(0, Math.floor(s)); return ar(Math.floor(s / 60)) + ':' + ar(String(s % 60).padStart(2, '0')); };
const dur = s => { const m = Math.floor(s / 60); return m ? `${ar(m)} دقيقة${s % 60 ? ' و' + ar(s % 60) + ' ثانية' : ''}` : `${ar(s)} ثانية`; };

export function runExam(host, exam, ctx){
  injectCSS();
  const cfg = { pass: Number(exam.passPct) || 50, time: Number(exam.timeLimit) || 0, max: Number(exam.maxAttempts) || 0, shuf: exam.shuffle !== false, gate: !!exam.gate,
    view: exam.view === 'all' ? 'all' : 'single', ol: ['grid', 'row'].includes(exam.optLayout) ? exam.optLayout : 'col' };
  const QS = exam.questions;
  const skey = 'exs:' + ctx.key;
  let prior = ctx.prior ? { ...ctx.prior } : null;
  let S = null, timer = null, dead = false;
  // المحاولات المحدودة بتتحسب على الرسوب بس. لو الطالب نجح قبل كده يعيد براحته.
  const left = () => (prior && prior.passed) || !cfg.max ? Infinity : Math.max(0, cfg.max - (prior ? prior.attempts || 0 : 0));

  const root = document.createElement('div'); root.className = 'xm';
  host.innerHTML = ''; host.appendChild(root);

  const saveS = () => { if (S && S.screen === 'q') try { localStorage.setItem(skey, JSON.stringify({ perm: S.perm, ans: S.ans, flags: S.flags, i: S.i, deadline: S.deadline, t0: S.t0 })); } catch {} };
  const clearS = () => { try { localStorage.removeItem(skey); } catch {} };
  const loadS = () => {
    try {
      const x = JSON.parse(localStorage.getItem(skey) || 'null');
      if (x && Array.isArray(x.perm) && x.perm.length === QS.length && x.perm.every(([s, o]) => QS[s] && o.length === QS[s].opts.length) && x.ans.length === x.perm.length) return x;
    } catch {}
    return null;
  };

  const makeRun = () => {
    let idx = QS.map((_, i) => i);
    if (cfg.shuf) idx = shuf(idx);
    return idx.map(s => [s, cfg.shuf ? shuf(QS[s].opts.map((_, i) => i)) : QS[s].opts.map((_, i) => i)]);
  };
  const view = perm => perm.map(([s, o]) => { const q = QS[s]; return { src: s, q: q.q, img: q.img || '', topic: q.topic || '', why: q.why || '', opts: o.map(i => ({ t: q.opts[i], ok: i === q.correct })) }; });

  function start(resume){
    if (ctx.onLock) ctx.onLock(true);
    const perm = resume ? resume.perm : makeRun(), run = view(perm);
    S = { perm, run, ans: resume ? resume.ans : run.map(() => -1), flags: resume ? resume.flags : run.map(() => false),
      i: resume ? Math.min(resume.i, run.length - 1) : 0, t0: resume ? resume.t0 : Date.now(),
      deadline: cfg.time ? (resume ? resume.deadline : Date.now() + cfg.time * 60000) : 0, screen: 'q', rf: 'all' };
    clearInterval(timer);
    if (S.deadline) timer = setInterval(tick, 1000);
    if (S.deadline && Date.now() >= S.deadline) return finish(true);
    saveS(); render();
  }
  function tick(){
    if (dead || !S || !S.deadline || S.screen !== 'q') return;
    const t = Math.ceil((S.deadline - Date.now()) / 1000), el = root.querySelector('#xtm');
    if (el) { el.querySelector('span').textContent = mmss(t); el.classList.toggle('low', t <= 60); }
    if (t <= 0) finish(true);
  }

  /* ---------- لو المحاولات خلصت ---------- */
  function blocked(){
    clearInterval(timer); S = null; if (ctx.onLock) ctx.onLock(false);
    root.innerHTML = `<div class="xr"><span class="xk">🎯 ${esc(ctx.title)}</span>
      <div class="xv">🚫 خلصت محاولاتك</div>
      <div class="xb gate">استنفدت ${ar(cfg.max)} ${cfg.max > 10 ? 'محاولة' : 'محاولات'} من غير ما تنجح (أعلى درجة جبتها ${ar(prior ? prior.best || 0 : 0)}٪).<br>كلّم المدرّس لو محتاج محاولة تانية.</div></div>`;
  }

  /* ---------- أجزاء مشتركة ---------- */
  const meta = () => { const l = left(); return `<div class="xmeta"><span>✅ النجاح من ${ar(cfg.pass)}٪</span><span>⏱ ${cfg.time ? ar(cfg.time) + ' دقيقة' : 'من غير وقت'}</span>${cfg.max ? `<span>🔁 ${l === Infinity ? 'إعادة مفتوحة (انت عدّيت)' : ar(l) + ' ' + (l > 10 ? 'محاولة' : 'محاولات') + ' متبقية'}</span>` : ''}${cfg.gate && !(prior && prior.passed) ? '<span>🔒 النجاح بيفتح الحصة اللي بعدها</span>' : ''}</div>`; };
  const topBar = (sticky, txt) => `<div class="xh ${sticky ? 'stk' : ''}"><div>${txt}</div>${S.deadline ? '<div class="xtm" id="xtm">⏱ <span></span></div>' : ''}</div>`;
  const dotsHTML = all => S.run.map((x, k) => `<button type="button" ${all ? `data-sc="${k}"` : `data-j="${k}"`} class="${k === S.i && !all ? 'cur' : S.ans[k] >= 0 ? 'a' : ''} ${S.flags[k] ? 'f' : ''}" aria-label="سؤال ${k + 1}">${ar(k + 1)}</button>`).join('');
  const optsHTML = (q, k) => `<div class="xo ${cfg.ol}">${q.opts.map((o, j) => `<button type="button" class="xop ${S.ans[k] === j ? 'sel' : ''}" data-q="${k}" data-o="${j}"><i>${LET[j]}</i><span>${esc(o.t)}</span></button>`).join('')}</div>`;
  const qHTML = q => `<div class="xqt">${esc(q.q).replace(/\n/g, '<br>')}</div>${q.img ? `<img class="xim" src="${esc(q.img)}" alt="" onerror="this.remove()">` : ''}`;
  const doneN = () => S.ans.filter(x => x >= 0).length;

  function render(){
    S.screen = 'q';
    if (cfg.view === 'all') return renderAll();
    const n = S.run.length, q = S.run[S.i], last = S.i === n - 1;
    root.innerHTML = `${meta()}${topBar(false, `📝 سؤال ${ar(S.i + 1)} من ${ar(n)}`)}
      <div class="xpb"><i style="width:${doneN() / n * 100}%"></i></div>
      <div class="xn">${dotsHTML(false)}</div>
      ${qHTML(q)}${optsHTML(q, S.i)}
      <div class="xf">
        <button type="button" data-n="-1" ${S.i === 0 ? 'disabled' : ''}>→ السابق</button>
        <button type="button" data-flagq="${S.i}" class="${S.flags[S.i] ? 'on' : ''}">🚩 ${S.flags[S.i] ? 'متعلّم للمراجعة' : 'علّم للمراجعة'}</button>
        ${last ? '<button type="button" class="xp" data-fin>تسليم الإجابات</button>' : '<button type="button" class="xp" data-n="1">التالي ←</button>'}
      </div>`;
    tick();
  }
  function renderAll(){
    const n = S.run.length;
    root.innerHTML = `${meta()}${topBar(true, `📝 ${ar(n)} سؤال في صفحة واحدة`)}
      <div class="xpb"><i style="width:${doneN() / n * 100}%"></i></div>
      <div class="xn">${dotsHTML(true)}</div>
      ${S.run.map((q, k) => `<div class="xq1" data-qb="${k}"><div class="xqt" style="font-size:1.1rem">${ar(k + 1)}. ${esc(q.q).replace(/\n/g, '<br>')}</div>${q.img ? `<img class="xim" src="${esc(q.img)}" alt="" onerror="this.remove()">` : ''}${optsHTML(q, k)}
        <button type="button" class="xfb ${S.flags[k] ? 'on' : ''}" data-flagq="${k}">🚩 ${S.flags[k] ? 'متعلّم للمراجعة' : 'علّم للمراجعة'}</button></div>`).join('')}
      <div class="xf"><span></span><button type="button" class="xp" data-fin>تسليم الإجابات</button></div>`;
    tick();
  }
  /* تحديث في مكانه (من غير ما الصفحة تنط) */
  function upd(k){
    if (cfg.view !== 'all') return render();
    const b = root.querySelector(`[data-qb="${k}"]`);
    b.querySelectorAll('.xop').forEach((x, j) => x.classList.toggle('sel', j === S.ans[k]));
    const f = b.querySelector('.xfb'); f.classList.toggle('on', !!S.flags[k]); f.textContent = '🚩 ' + (S.flags[k] ? 'متعلّم للمراجعة' : 'علّم للمراجعة');
    const d = root.querySelector(`[data-sc="${k}"]`); d.classList.toggle('a', S.ans[k] >= 0); d.classList.toggle('f', !!S.flags[k]);
    root.querySelector('.xpb i').style.width = doneN() / S.run.length * 100 + '%';
  }

  /* ---------- التسليم ---------- */
  function ask(){
    const un = S.ans.filter(x => x < 0).length, fl = S.flags.filter(Boolean).length;
    const d = document.createElement('div'); d.className = 'xov';
    d.innerHTML = `<div><p>هل انت متأكد من تسليم الامتحان؟</p>
      ${un || fl ? `<p style="font-weight:600;font-size:.92rem;color:var(--muted,#5B6678)">${un ? `لسه ${ar(un)} سؤال من غير إجابة.` : ''} ${fl ? `وعندك ${ar(fl)} سؤال متعلّم عليه 🚩.` : ''}</p>` : ''}
      <div class="xa"><button type="button" class="xp" data-sure>أيوه، سلّم</button><button type="button" class="xs" data-back>لا، رجوع</button></div></div>`;
    root.appendChild(d);
  }
  function finish(auto){
    if (S.screen === 'res') return;
    clearInterval(timer);
    const n = S.run.length; let c = 0, w = 0, b = 0; const tp = {};
    S.run.forEach((q, k) => {
      const a = S.ans[k], ok = a >= 0 && q.opts[a].ok;
      if (a < 0) b++; else if (ok) c++; else w++;
      if (q.topic) { const t = tp[q.topic] || (tp[q.topic] = { c: 0, n: 0 }); t.n++; if (ok) t.c++; }
    });
    const raw = c / n * 100, was = !!(prior && prior.passed);
    S.result = { pct: Math.round(raw), correct: c, wrong: w, blank: b, total: n, secs: Math.round((Date.now() - S.t0) / 1000), passed: raw >= cfg.pass, topics: tp, auto: !!auto, was };
    S.screen = 'res';
    clearS(); if (ctx.onLock) ctx.onLock(false);
    prior = { best: Math.max(prior ? prior.best || 0 : 0, S.result.pct), attempts: (prior ? prior.attempts || 0 : 0) + 1, passed: was || S.result.passed };
    try { ctx.onFinish && ctx.onFinish({ pct: S.result.pct, correct: c, total: n, passed: S.result.passed }); } catch (ex) { console.error(ex); }
    result();
  }
  function result(){
    const R = S.result, n = R.total, l = left();
    const tier = R.pct >= 90 ? ['🥇', 'ممتاز'] : R.pct >= 75 ? ['🥈', 'جيد جدًا'] : R.passed ? ['🥉', 'ناجح'] : ['💪', 'كمّل وهتوصل'];
    const col = R.pct >= 75 ? '#1E8E4E' : (R.passed ? '#E0A800' : '#D7263D');
    const need = Math.max(0, Math.ceil(cfg.pass / 100 * n) - R.correct);
    const msgs = R.pct >= 90 ? 'مستوى عالي جدًا، كمّل بنفس الشغل!' : R.pct >= 75 ? 'شغل جامد! شوية تركيز كمان وتوصل للدرجة النهائية.' : R.passed ? 'عدّيت، بس راجع الأخطاء عشان تثبّت المعلومة.' : 'مفيش مشكلة، الغلط بيعلّم. راجع الشرح وجرّب تاني.';
    const topics = Object.entries(R.topics).map(([k, v]) => ({ k, p: Math.round(v.c / v.n * 100), w: v.n - v.c })).sort((a, b) => a.p - b.p);
    const weak = topics.find(t => t.w > 0 && t.p < 70);
    const banner = R.passed ? `<div class="xb ok">🎉 مبروك! عدّيت الامتحان.${cfg.gate && !R.was ? ' <b>🔓 اتفتحت لك الحصة اللي بعدها.</b>' : ''}</div>`
      : R.was ? `<div class="xb ok">انت عدّيت الامتحان ده قبل كده ✅ (أعلى درجة ${ar(prior.best)}٪) والحصة اللي بعده لسه مفتوحة.</div>`
      : `<div class="xb gate">محتاج ${ar(cfg.pass)}٪ عشان تنجح وجبت ${ar(R.pct)}٪ — ناقصك ${ar(need)} ${need > 10 ? 'سؤال' : 'أسئلة'} بس.${l !== Infinity ? (l > 0 ? `<br>فاضل لك ${ar(l)} ${l > 10 ? 'محاولة' : 'محاولات'}.` : '<br>خلصت محاولاتك، كلّم المدرّس لو محتاج محاولة تانية.') : ''}</div>`;
    root.innerHTML = `<div class="xr">
      <div class="xg"><svg viewBox="0 0 120 120"><circle class="bg" cx="60" cy="60" r="52"/><circle class="fg" cx="60" cy="60" r="52" stroke="${col}" stroke-dasharray="${R.pct * 3.267} 327"/></svg><b>${ar(R.pct)}٪</b></div>
      <div class="xv">${tier[0]} ${tier[1]}</div>
      ${banner}
      ${R.auto ? '<div class="xb gate">⏱ الوقت خلص واتسلّمت إجاباتك تلقائيًا.</div>' : ''}
      <p class="xs2">${msgs}</p>
      <div class="xst"><span class="g">✅ ${ar(R.correct)} صح</span><span class="b">❌ ${ar(R.wrong)} غلط</span>${R.blank ? `<span>⚪ ${ar(R.blank)} من غير إجابة</span>` : ''}<span>⏱ ${dur(R.secs)}</span></div>
      ${topics.length ? `<div style="margin:14px 0"><div class="xs2">📊 مستواك في كل باب</div>${topics.map(t => `<div class="xtp ${t === weak ? 'weak' : ''}"><span>${esc(t.k)}</span><div><i style="width:${t.p}%"></i></div><b>${ar(t.p)}٪</b></div>`).join('')}${weak ? `<p class="xs2" style="margin-top:8px">🎯 ركّز على: <b>${esc(weak.k)}</b></p>` : ''}</div>` : ''}
      <div class="xa" style="justify-content:center">
        ${!R.passed && !R.was && l > 0 ? '<button type="button" class="xp" data-act="retry">🔁 أعد المحاولة</button>' : ''}
        ${R.passed || R.was ? '<button type="button" data-act="retry">🔁 أعد الامتحان</button>' : ''}
        ${(R.passed || R.was) && cfg.gate && ctx.hasNext ? '<button type="button" class="xp" data-act="next">كمّل للحصة اللي بعدها ←</button>' : ''}
      </div>
      <div class="xrv" id="xrv" style="text-align:start">${reviewHTML()}</div></div>`;
    if (R.passed) confetti();
    host.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
  function confetti(){
    const c = document.createElement('div'); c.className = 'xcf';
    const cols = ['#FFC83D', '#D7263D', '#1E4A42', '#16213E', '#4FC3F7'];
    c.innerHTML = Array.from({ length: 30 }, () => `<i style="left:${Math.random() * 100}%;background:${cols[Math.floor(Math.random() * cols.length)]};animation-delay:${Math.random() * .8}s;animation-duration:${2 + Math.random() * 1.6}s"></i>`).join('');
    root.appendChild(c); setTimeout(() => c.remove(), 4500);
  }

  /* ---------- مراجعة الإجابات ---------- */
  function reviewHTML(){
    const list = S.run.map((q, k) => ({ q, k })).filter(({ q, k }) => {
      const ok = S.ans[k] >= 0 && q.opts[S.ans[k]].ok;
      return S.rf === 'wrong' ? !ok : S.rf === 'flag' ? S.flags[k] : true;
    });
    return `<h3 style="margin:22px 0 10px">📋 إجاباتك والإجابات الصح</h3>
      <div class="xflt">${[['all', 'الكل'], ['wrong', 'الغلط بس'], ['flag', '🚩 المتعلّم عليها']].map(([k, t]) => `<button type="button" data-rf="${k}" class="${S.rf === k ? 'on' : ''}">${t}</button>`).join('')}</div>
      ${list.length ? list.map(({ q, k }) => {
        const a = S.ans[k], ok = a >= 0 && q.opts[a].ok;
        return `<div class="xrc ${ok ? '' : 'bad'}"><div class="xqt">${ok ? '✅' : a < 0 ? '⚪' : '❌'} ${ar(k + 1)}. ${esc(q.q).replace(/\n/g, '<br>')}</div>
          ${q.img ? `<img class="xim" src="${esc(q.img)}" alt="">` : ''}
          <div class="xo ${cfg.ol}">${q.opts.map((o, j) => `<div class="xop ${o.ok ? 'ok' : j === a ? 'no' : 'dim'}"><i>${LET[j]}</i><span>${esc(o.t)}</span>${o.ok ? '<em>✔ الإجابة الصح</em>' : j === a ? '<em>إجابتك</em>' : ''}</div>`).join('')}</div>
          ${a < 0 ? '<div class="xs2">ما جاوبتش على السؤال ده.</div>' : ''}
          ${q.why ? `<div class="xwhy">💡 ${esc(q.why)}</div>` : ''}</div>`;
      }).join('') : '<p class="xs2" style="text-align:center;padding:20px">مفيش أسئلة هنا 👌</p>'}`;
  }

  /* ---------- الأحداث ---------- */
  const choose = (k, j) => { S.ans[k] = S.ans[k] === j ? -1 : j; saveS(); upd(k); };
  const go = j => { if (j < 0 || j >= S.run.length) return; S.i = j; saveS(); render(); };
  root.addEventListener('click', e => {
    const t = e.target.closest('button'); if (!t || dead) return;
    const d = t.dataset;
    if (d.o !== undefined && S && S.screen === 'q') return choose(Number(d.q), Number(d.o));
    if (d.n !== undefined && S) return go(S.i + Number(d.n));
    if (d.j !== undefined && S) return go(Number(d.j));
    if (d.sc !== undefined) { const b = root.querySelector(`[data-qb="${d.sc}"]`); if (b) b.scrollIntoView({ behavior: 'smooth', block: 'center' }); return; }
    if (d.flagq !== undefined && S) { const k = Number(d.flagq); S.flags[k] = !S.flags[k]; saveS(); return upd(k); }
    if (d.fin !== undefined) return ask();
    if (d.sure !== undefined) return finish(false);
    if (d.back !== undefined) { const ov = root.querySelector('.xov'); if (ov) ov.remove(); return; }
    if (d.rf) { S.rf = d.rf; const v = root.querySelector('#xrv'); if (v) v.innerHTML = reviewHTML(); return; }
    if (d.act) {
      if (d.act === 'retry') { clearS(); return start(); }
      if (d.act === 'next') return ctx.onNext && ctx.onNext();
    }
  });
  const onKey = e => {
    if (dead || !S || S.screen !== 'q' || cfg.view === 'all' || !root.isConnected || e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.target && /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName)) return;
    if (/^[1-6]$/.test(e.key)) { const k = Number(e.key) - 1; if (k < S.run[S.i].opts.length) { e.preventDefault(); choose(S.i, k); } }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); go(S.i + 1); }
    else if (e.key === 'ArrowRight') { e.preventDefault(); go(S.i - 1); }
  };
  document.addEventListener('keydown', onKey);

  /* الدخول على الامتحان على طول (أو كمّل من حيث وقف) */
  const saved = loadS();
  if (saved) start(saved); else if (left() > 0) start(); else blocked();
  return { destroy(){ dead = true; clearInterval(timer); document.removeEventListener('keydown', onKey); host.innerHTML = ''; } };
}   