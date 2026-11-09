import { db } from "./firebase.js";
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

/* يعرض الكتب اللي من لوحة التحكم بس */
const shelf = document.getElementById('shelf');
if (shelf) {
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const num = n => Number(n).toLocaleString('ar-EG');
  const fg = hex => { const h = String(hex || '').replace('#', ''); if (h.length !== 6) return '#fff';
    const [r, g, b] = [0, 2, 4].map(i => parseInt(h.substr(i, 2), 16)); return (r * 299 + g * 587 + b * 114) / 1000 > 150 ? '#141B3D' : '#fff'; };
  const WA = '201000000000';

  const card = (b, i) => {
    const img = b.mode === 'image' && b.image;
    const cover = img
      ? `<div class="cover k${i % 3 + 1}" style="background:url('${esc(b.image)}') center/cover no-repeat"></div>`
      : `<div class="cover k${i % 3 + 1}" style="background:${esc(b.color || '#17255E')};color:${fg(b.color)}">
           <div class="by">أ. أحمد رمضان</div>
           <div class="mid"><b>${esc(b.coverMain || b.title)}</b>${b.coverSub ? `<span>${esc(b.coverSub)}</span>` : ''}</div>
           ${b.coverTag ? `<div class="ft">${esc(b.coverTag)}</div>` : '<div class="ft"></div>'}
         </div>`;
    const hasOld = b.oldPrice && b.oldPrice > b.price;
    const price = b.price > 0
      ? `<div class="pr">${hasOld ? `<s style="opacity:.55;font-size:.8em;margin-inline-end:8px">${num(b.oldPrice)} جنيه</s>` : ''}${num(b.price)} جنيه</div>`
      : '<div class="pr">&nbsp;</div>';
    const msg = encodeURIComponent('عايز أطلب ' + b.title);
    return `<div class="bk">
      <div class="base">${cover}</div>
      <h3>${esc(b.title)}</h3>${price}
      <a class="btn line" href="https://wa.me/${WA}?text=${msg}" target="_blank" rel="noopener">اطلب الكتاب</a>
    </div>`;
  };

  try {
    const snap = await getDocs(collection(db, 'books'));
    const list = snap.docs.map(d => d.data()).filter(b => b.visible)
      .sort((a, b) => (a.order || 999) - (b.order || 999));
    shelf.innerHTML = list.length ? list.map(card).join('')
      : '<p style="padding:30px;text-align:center;font-weight:700;grid-column:1/-1">الكتب هتنزل قريبًا.</p>';
  } catch (ex) {
    console.error(ex);
    shelf.innerHTML = '<p style="padding:30px;text-align:center;font-weight:700;grid-column:1/-1">تعذّر تحميل الكتب دلوقتي.</p>';
  }
}