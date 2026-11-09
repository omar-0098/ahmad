import { db } from "./firebase.js";
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

const track = document.getElementById('track');
if (track) {
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const num = n => Number(n).toLocaleString('ar-EG');
  const day = d => new Date(d + 'T00:00').toLocaleDateString('ar-EG', { weekday:'long', year:'numeric', month:'long', day:'numeric' }).replace('،', '');
  const CAL = '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/></svg>';
  const CLK = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>';

  let LIST = [];
  const card = (c, i) => {
    const free = !(c.price > 0);
    const hasOld = !free && c.oldPrice && c.oldPrice > c.price;
    const price = free ? '<div class="price"><b>مجاني</b></div>' : `<div class="price"><b>${num(c.price)}</b> جنيه</div>`;
    const txt = (c.details || c.desc || '').replace(/\s+/g, ' ').trim();
    const priceBlock = hasOld
      ? `<div class="all_price">${price}<div class="old"><s>${num(c.oldPrice)} جنيه</s><span>بدلاً من</span></div></div>` : price;
    const cnt = c.lectures != null ? `<span class="cnt">${num(c.lectures)} ${c.lectures > 10 ? 'محاضرة' : 'محاضرات'}</span>` : '';
    const dates = (c.start ? `<span>${CAL}يبدأ ${day(c.start)}</span>` : '') + (c.end ? `<span>${CLK}ينتهي ${day(c.end)}</span>` : '');
    return `<article class="card" data-i="${i}">
      <a href="cours.html?id=${esc(c.id)}" class="thumb t${i % 4 + 1}">${c.image ? `<img src="${esc(c.image)}" alt="" onerror="this.remove()">` : ''}</a>
      <div class="body">
        <div class="row"><h3>${esc(c.title)}</h3>${cnt}</div>
        ${priceBlock}
        ${txt ? `<p class="pv"><span class="pt">${esc(txt)}</span><a href="#" class="more">عرض باقي التفاصيل</a></p>` : ''}
        <div class="dates">${dates}</div>
      </div>
      <div class="btns"><a href="cours.html?id=${esc(c.id)}" class="b-go">الدخول للكورس</a><a href="subscribe.html?id=${esc(c.id)}" class="b-sub">الاشتراك في الكورس!</a></div>
    </article>`;
  };

  try {
    const snap = await getDocs(collection(db, 'courses'));
    const list = snap.docs.map(d => ({ id: d.id, ...d.data() })).filter(c => c.visible)
      .sort((a, b) => (a.start || '9999').localeCompare(b.start || '9999') || (a.createdAt?.seconds || 0) - (b.createdAt?.seconds || 0));
    LIST = list;
    track.innerHTML = list.length ? list.map(card).join('')
      : '<p style="padding:30px;text-align:center;font-weight:700">الكورسات هتنزل قريبًا.</p>';
    window.dispatchEvent(new Event('resize'));
  } catch (ex) {
    console.error(ex);
    track.innerHTML = '<p style="padding:30px;text-align:center;font-weight:700;color:#fff">تعذّر تحميل الكورسات دلوقتي. حدّث الصفحة وجرّب تاني.</p>';
  }

  /* نافذة التفاصيل */
  const st = document.createElement('style');
  st.textContent = `.card .pv{display:flex;align-items:baseline;gap:2px;font-size: 12.5px;}
    .card .pv .pt{flex:0 1 auto;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
    .card .pv .more{flex:none;white-space:nowrap}
    .dm{position:fixed;inset:0;background:rgba(20,27,61,.7);display:none;place-items:center;z-index:200;padding:18px}
    .dm.on{display:grid}
    .dm .bx{background:#fff;border-radius:20px;max-width:560px;width:100%;max-height:88vh;overflow:auto;padding:26px;font-family:inherit}
    .dm img{width:100%;border-radius:12px;margin-bottom:14px;display:block}
    .dm h2{color:#17255E;    margin-bottom: 3px;font-size: 18px;}
    .dm .meta{color:#0E5C63;font-weight:700;margin-bottom:12px}
    .dm .ds{color:#5B6585;margin-bottom:12px}
    .dm .dt{white-space:pre-line;line-height:1.9;font-size: 13.5px;}
    .dm button{    margin-top: 14px;
    border: 0;
    border-radius: 12px;
    padding: 6px 24px;
    background: #17255E;
    color: #fff;
    font: inherit;
    font-weight: 600;
    cursor: pointer;
}`;
  document.head.appendChild(st);
  const dm = document.createElement('div');
  dm.className = 'dm'; dm.innerHTML = '<div class="bx" role="dialog" aria-modal="true"></div>';
  document.body.appendChild(dm);
  const close = () => dm.classList.remove('on');
  dm.addEventListener('click', e => { if (e.target === dm || e.target.closest('[data-x]')) close(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
  track.addEventListener('click', e => {
    const m = e.target.closest('.more'); if (!m) return;
    e.preventDefault();
    const c = LIST[Number(m.closest('.card').dataset.i)]; if (!c) return;
    dm.firstChild.innerHTML =
      (c.image ? `<img src="${esc(c.image)}" alt="">` : '') +
      `<h2>${esc(c.title)}</h2>` +
      `<div class="meta">${c.price > 0 ? num(c.price) + ' جنيه' : 'مجاني'}${c.lectures != null ? ' • ' + num(c.lectures) + ' محاضرة' : ''}</div>` +
      `<div class="dt">${esc(c.details || c.desc || 'التفاصيل هتتضاف قريبًا.')}</div>` +
      '<button type="button" data-x>إغلاق</button>';
    dm.classList.add('on');
  });
}