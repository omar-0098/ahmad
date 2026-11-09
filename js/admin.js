import { auth, db } from "./firebase.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import { collection, getDocs, getDoc, setDoc, doc, updateDoc, deleteDoc, addDoc, serverTimestamp, writeBatch, Bytes } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

const ADMIN_EMAIL = '01028604523@ahmed.app';
const $ = id => document.getElementById(id);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const GR = ['الأول الثانوي','الثاني الثانوي','الثالث الثانوي'];
let users = [], editing = null;

function toast(t){ const e=$('toast'); e.textContent=t; e.classList.add('on'); setTimeout(()=>e.classList.remove('on'),2500); }

onAuthStateChanged(auth, async u => {
  const ts = Number(sessionStorage.getItem('adm_ok') || 0);
  const ok = u && (u.email || '').toLowerCase() === ADMIN_EMAIL && Date.now() - ts < 2 * 3600 * 1000;
  if (!ok) { location.replace('profile.html'); return; }
  try {
    await load();
    $('loading').classList.add('hide'); $('app').classList.remove('hide');
  } catch (ex) {
    console.error(ex);
    $('loading').textContent = ex.code === 'permission-denied' ? 'قواعد Firestore مش بتسمح بقراءة المستخدمين. حدّثها بالقواعد المرفقة.' : 'حصلت مشكلة في التحميل. حدّث الصفحة.';
  }
});

async function load(){
  const snap = await getDocs(collection(db, 'users'));
  users = snap.docs.map(d => ({ id: d.id, ...d.data() }))
    .sort((a,b) => (b.createdAt?.seconds||0) - (a.createdAt?.seconds||0));
  stats(); render();
  try { await loadBooks(); } catch (ex) { console.error(ex); $('brows').innerHTML = '<tr><td colspan="5" class="empty">مش قادر أقرا الكتب، ضيف قاعدة books في Firestore.</td></tr>'; }
  try { await loadCourses(); } catch (ex) { console.error(ex); $('crows').innerHTML = '<tr><td colspan="9" class="empty">مش قادر أقرا الكورسات، حدّث قواعد Firestore.</td></tr>'; }
}

/* ===== الكورسات ===== */
let courses = [], editingC = null;
const fTs = t => t?.toDate ? t.toDate().toLocaleString('ar-EG',{year:'numeric',month:'short',day:'numeric',hour:'numeric',minute:'2-digit'}) : '-';
const fD = d => d ? new Date(d + 'T00:00').toLocaleDateString('ar-EG',{year:'numeric',month:'short',day:'numeric'}) : '-';
const nf = n => Number(n).toLocaleString('ar-EG');

async function loadCourses(){
  const sn = await getDocs(collection(db, 'courses'));
  courses = sn.docs.map(d => ({ id: d.id, ...d.data() })).sort((a,b) => (b.createdAt?.seconds||0) - (a.createdAt?.seconds||0));
  $('crows').innerHTML = courses.length ? courses.map(c => `
    <tr>
      <td><div class="th"><img src="${esc(c.image)}" alt="">${esc(c.title)}</div></td>
      <td>${c.price > 0 ? `<b>${nf(c.price)} جنيه</b>${c.oldPrice > c.price ? `<span class="old">${nf(c.oldPrice)} جنيه</span>` : ''}` : '<span class="tag on">مجاني</span>'}</td>
      <td>${c.lectures != null ? nf(c.lectures) : '-'}</td>
      <td>${fD(c.start)}</td><td>${fD(c.end)}</td>
      <td><span class="tag ${c.visible ? 'on' : 'off'}">${c.visible ? 'ظاهر' : 'مخفي'}</span></td>
      <td>${fTs(c.createdAt)}</td><td>${fTs(c.updatedAt)}</td>
      <td><div class="act"><button class="btn sm" data-cl="${c.id}">+ ضيف</button><button class="btn g sm" data-ce="${c.id}">تعديل</button><button class="btn r sm" data-cd="${c.id}">حذف</button></div></td>
    </tr>`).join('') : '<tr><td colspan="9" class="empty">لسه مفيش كورسات. دوس "كورس جديد".</td></tr>';
}

let imgData = '';
function setImg(v){
  imgData = v || '';
  const pv = $('cprev'), has = !!imgData;
  if (has) pv.src = imgData;
  pv.classList.toggle('hide', !has); $('cph').classList.toggle('hide', has); $('cdel').classList.toggle('hide', !has);
  $('cf').elements.imgurl.value = /^https?:/.test(imgData) ? imgData : '';
}
function compress(file, maxW = 900){
  return new Promise((res, rej) => {
    const img = new Image(), u = URL.createObjectURL(file);
    img.onload = () => {
      const r = Math.min(1, maxW / img.width), c = document.createElement('canvas');
      c.width = Math.round(img.width * r); c.height = Math.round(img.height * r);
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(u);
      let out = c.toDataURL('image/jpeg', 0.82);
      for (let q = 0.7; out.length > 330000 && q > 0.3; q -= 0.1) out = c.toDataURL('image/jpeg', q);
      res(out);
    };
    img.onerror = () => rej(new Error('bad image')); img.src = u;
  });
}
$('cfile').addEventListener('change', async e => {
  const f = e.target.files[0]; if (!f) return;
  try { setImg(await compress(f)); } catch { toast('الصورة دي مش مدعومة، جرّب صورة تانية'); }
  e.target.value = '';
});
$('cdel').addEventListener('click', () => setImg(''));
$('cf').elements.imgurl.addEventListener('input', e => setImg(e.target.value.trim()));
$('ccx2').addEventListener('click', () => $('cmod').classList.remove('on'));

let pImg = '';
function setPImg(v){
  pImg = v || '';
  const pv = $('pprev'), has = !!pImg;
  if (has) pv.src = pImg;
  pv.classList.toggle('hide', !has); $('pph').classList.toggle('hide', has); $('pdel').classList.toggle('hide', !has);
  $('cf').elements.pimgurl.value = /^https?:/.test(pImg) ? pImg : '';
}
$('pfile').addEventListener('change', async e => {
  const f = e.target.files[0]; if (!f) return;
  try { setPImg(await compress(f, 1000)); } catch { toast('الصورة دي مش مدعومة، جرّب صورة تانية'); }
  e.target.value = '';
});
$('pdel').addEventListener('click', () => setPImg(''));
$('cf').elements.pimgurl.addEventListener('input', e => setPImg(e.target.value.trim()));

async function openC(c){
  editingC = c; const f = $('cf'); f.reset();
  $('cft').textContent = c ? 'تعديل الكورس' : 'كورس جديد';
  $('cst').textContent = c ? `تاريخ النزول: ${fTs(c.createdAt)}  |  آخر تحديث: ${fTs(c.updatedAt)}` : '';
  if (c) {
    ['title','price','oldPrice','lectures','grade','start','end','details'].forEach(k => f.elements[k].value = c[k] ?? '');
    f.elements.visible.checked = !!c.visible;
  }
  setImg(c ? (c.image || '') : ''); setPImg('');
  $('cmod').classList.add('on');
  if (c) {
    try {
      const ps = await getDoc(doc(db, 'coursePages', c.id));
      if (ps.exists() && editingC === c) {
        const p = ps.data();
        f.elements.ptitle.value = p.heroTitle || ''; f.elements.pmark.value = p.heroMark || '';
        f.elements.pdesc.value = p.heroDesc || ''; f.elements.pfacts.value = p.facts || '';
        f.elements.pnote.value = p.note || ''; setPImg(p.image || '');
      }
    } catch (ex) { console.error(ex); toast('مقدرتش أقرا بيانات صفحة الكورس، راجع القواعد'); }
  }
}
$('addC').addEventListener('click', () => openC(null));
$('ccx').addEventListener('click', () => $('cmod').classList.remove('on'));

$('crows').addEventListener('click', async e => {
  const eb = e.target.closest('[data-ce]'), db_ = e.target.closest('[data-cd]');
  const lb = e.target.closest('[data-cl]');
  if (lb) openLecs(courses.find(c => c.id === lb.dataset.cl));
  if (eb) openC(courses.find(c => c.id === eb.dataset.ce));
  if (db_) {
    const c = courses.find(c => c.id === db_.dataset.cd);
    if (!confirm(`متأكد إنك عايز تحذف كورس "${c.title}"؟`)) return;
    try { await deleteDoc(doc(db, 'courses', c.id)); await loadCourses(); toast('تم حذف الكورس'); }
    catch (ex) { console.error(ex); toast('فشل الحذف، راجع قواعد Firestore'); }
  }
});

$('cf').addEventListener('submit', async e => {
  e.preventDefault();
  const f = e.target, v = k => f.elements[k].value.trim();
  const data = {
    title: v('title'), price: v('price') ? Number(v('price')) : 0, oldPrice: v('oldPrice') ? Number(v('oldPrice')) : null,
    lectures: v('lectures') ? Number(v('lectures')) : null, grade: v('grade'),
    start: v('start'), end: v('end'), details: v('details'), image: imgData,
    visible: f.elements.visible.checked, updatedAt: serverTimestamp()
  };
  try {
    let cid;
    if (editingC) { cid = editingC.id; await updateDoc(doc(db, 'courses', cid), data); }
    else { cid = (await addDoc(collection(db, 'courses'), { ...data, createdAt: serverTimestamp() })).id; }
    await setDoc(doc(db, 'coursePages', cid), {
      heroTitle: v('ptitle'), heroMark: v('pmark'), heroDesc: v('pdesc'), facts: v('pfacts'),
      note: v('pnote'), image: pImg, updatedAt: serverTimestamp()
    }, { merge: true });
    $('cmod').classList.remove('on'); await loadCourses(); toast('تم حفظ الكورس');
  } catch (ex) { console.error(ex); toast('فشل الحفظ، راجع قواعد Firestore'); }
});

/* ===== محتوى الكورس: حصص + عناصر ===== */
const KIND = { video:'🎬', pdf:'📄', file:'📎', link:'🔗', text:'📝', exam:'🎯' };
const TNAME = { video:'فيديو', pdf:'ملف PDF', file:'ملف أو صورة', link:'رابط', text:'نص / ملاحظة', exam:'امتحان' };
const DZ = { video:['🎬','اسحب الفيديو هنا أو اضغط للاختيار','MP4 • حتى ١٠٠ ميجا'], pdf:['📄','اسحب ملف الـ PDF هنا أو اضغط للاختيار','PDF • حتى ١٠٠ ميجا'], file:['📎','اسحب الملف هنا أو اضغط للاختيار','أي ملف أو صورة • حتى ١٠٠ ميجا'] };
const ORD = ['الأولى','الثانية','الثالثة','الرابعة','الخامسة','السادسة','السابعة','الثامنة','التاسعة','العاشرة'];
const MAX_MB = 100, CH = 900000, LEG = '__none';
let lecCourse = null, sessions = [], items = [], curS = null, curKind = 'video';
let editingL = null, pickedFile = null, keepOld = null, cancelUp = false, uploading = false;
const lf = () => $('lf');
const col = () => collection(db, 'courses', lecCourse.id, 'lectures');
const mb = n => (n / 1048576).toFixed(1) + ' MB';
const pid = i => String(i).padStart(5, '0');
const byOrd = (a, b) => (a.order || 0) - (b.order || 0);
const sidOf = x => x.sessionId || LEG;
const itemsOf = sid => items.filter(x => sidOf(x) === sid).sort(byOrd);
const nextOrd = sid => { const a = itemsOf(sid); return a.length ? Math.max(...a.map(x => x.order || 0)) + 1 : 1; };

async function loadAll(){
  const sn = await getDocs(col());
  const all = sn.docs.map(d => ({ id: d.id, ...d.data() }));
  sessions = all.filter(x => x.kind === 'session').sort(byOrd);
  items = all.filter(x => x.kind !== 'session');
  const hasLeg = items.some(x => !x.sessionId);
  if (!curS || (curS === LEG ? !hasLeg : !sessions.find(x => x.id === curS))) curS = sessions[0] ? sessions[0].id : (hasLeg ? LEG : null);
  renderSessions(); renderPane();
}
function renderSessions(){
  const hasLeg = items.some(x => !x.sessionId);
  $('sname').placeholder = 'مثال: الحصة ' + (ORD[sessions.length] || nf(sessions.length + 1));
  $('slist').innerHTML = sessions.map((x, i) => `
    <div class="sc ${x.id === curS ? 'on' : ''}" data-s="${x.id}"><span class="sn">${nf(i + 1)}</span>
      <div><b>${esc(x.title)}</b><small>${nf(itemsOf(x.id).length)} عنصر${x.visible === false ? ' • مخفية' : ''}</small></div></div>`).join('')
    + (hasLeg ? `<div class="sc ${curS === LEG ? 'on' : ''}" data-s="${LEG}"><span class="sn">•</span><div><b>محتوى بدون حصة</b><small>${nf(itemsOf(LEG).length)} عنصر</small></div></div>` : '')
    || '<p class="empty">لسه مفيش حصص.</p>';
}
function renderPane(){
  const none = !curS;
  $('pempty').classList.toggle('hide', !none); $('pmain').classList.toggle('hide', none);
  if (none) return;
  const isL = curS === LEG, ss = isL ? { title: 'محتوى بدون حصة', visible: true } : sessions.find(x => x.id === curS);
  const idx = sessions.findIndex(x => x.id === curS);
  $('ph').innerHTML = `<h2>${esc(ss.title)} ${ss.visible === false ? '<span class="tag off">مخفية</span>' : ''}</h2>` + (isL ? '' : `
    <button class="ibtn" data-sm="-1" title="تقديم" ${idx <= 0 ? 'disabled' : ''}>↑</button>
    <button class="ibtn" data-sm="1" title="تأخير" ${idx >= sessions.length - 1 ? 'disabled' : ''}>↓</button>
    <button class="ibtn" data-rn title="تغيير الاسم">✏️</button>
    <button class="ibtn" data-tg title="${ss.visible === false ? 'إظهار' : 'إخفاء'}">${ss.visible === false ? '🙈' : '👁'}</button>
    <button class="ibtn rd" data-sd title="حذف الحصة">🗑</button>`);
  const its = itemsOf(curS);
  $('items').innerHTML = its.length ? its.map((l, i) => { const k = l.kind || 'video'; return `
    <div class="it ${l.visible === false ? 'hid' : ''}"><span class="ic">${KIND[k]}</span>
      <div class="lt"><b>${esc(l.title)}</b><small>${TNAME[k]}${k === 'exam' && l.exam ? ' • ' + nf((l.exam.questions || []).length) + ' سؤال • نجاح ' + nf(l.exam.passPct || 50) + '٪' + (l.exam.gate ? ' • بيقفل اللي بعده' : '') : ''}${l.fileId ? ' • مرفوع ' + mb(l.size || 0) : ''}${l.visible === false ? ' • مخفي' : ''}${l.duration ? ' • ' + esc(l.duration) : ''}</small></div>
      <div class="act">
        <button class="ibtn" data-im="-1" data-id="${l.id}" ${i === 0 ? 'disabled' : ''}>↑</button>
        <button class="ibtn" data-im="1" data-id="${l.id}" ${i === its.length - 1 ? 'disabled' : ''}>↓</button>
        <button class="ibtn" data-ie="${l.id}" title="تعديل">✏️</button>
        <button class="ibtn rd" data-idl="${l.id}" title="حذف">🗑</button>
      </div></div>`; }).join('') : '<p class="empty">الحصة دي لسه فاضية. ضيف أول محتوى من تحت 👇</p>';
}
async function syncCount(){
  const hid = new Set(sessions.filter(x => x.visible === false).map(x => x.id));
  const n = items.filter(l => l.visible !== false && (l.kind || 'video') === 'video' && !hid.has(l.sessionId)).length;
  try { await updateDoc(doc(db, 'courses', lecCourse.id), { lectures: n }); lecCourse.lectures = n; await loadCourses(); } catch (ex) { console.error(ex); }
}
async function openLecs(c){
  lecCourse = c; sessions = []; items = []; curS = null; closeForm(true);
  $('lht').textContent = c.title; $('slist').innerHTML = ''; renderPane(); $('lmod').classList.add('on');
  try { await loadAll(); } catch (ex) { console.error(ex); toast('مش قادر أقرا المحتوى، راجع قواعد Firestore'); }
}
$('lx').addEventListener('click', () => { if (uploading) cancelUp = true; $('lmod').classList.remove('on'); });

/* ----- الحصص ----- */
async function addSession(){
  const inp = $('sname'), t = inp.value.trim() || 'الحصة ' + (ORD[sessions.length] || nf(sessions.length + 1));
  try {
    const r = await addDoc(col(), { kind: 'session', title: t, order: (sessions.length ? Math.max(...sessions.map(x => x.order || 0)) : 0) + 1, visible: true, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
    inp.value = ''; curS = r.id; closeForm(true); await loadAll(); toast('تمت إضافة الحصة');
  } catch (ex) { console.error(ex); toast('فشل الإضافة، راجع قواعد Firestore'); }
}
$('sadd').addEventListener('click', addSession);
$('sname').addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); addSession(); } });
$('slist').addEventListener('click', e => { const c = e.target.closest('[data-s]'); if (!c || uploading) return; curS = c.dataset.s; closeForm(true); renderSessions(); renderPane(); });

async function reorder(arr, id, dir){
  const i = arr.findIndex(x => x.id === id), j = i + dir; if (i < 0 || j < 0 || j >= arr.length) return;
  const a = [...arr]; [a[i], a[j]] = [a[j], a[i]];
  const b = writeBatch(db); a.forEach((x, k) => b.update(doc(col(), x.id), { order: k + 1 }));
  try { await b.commit(); await loadAll(); } catch (ex) { console.error(ex); toast('فشل الترتيب'); }
}
async function delParts(fid, n){
  if (!fid) return;
  for (let s0 = 0; s0 < n; s0 += 400) {
    const b = writeBatch(db);
    for (let i = s0; i < Math.min(n, s0 + 400); i++) b.delete(doc(db, 'files', fid, 'parts', pid(i)));
    try { await b.commit(); } catch (ex) { console.warn(ex); }
  }
}
async function delItem(l){ await deleteDoc(doc(col(), l.id)); await delParts(l.fileId, l.parts || 0); }

document.querySelector('.pane').addEventListener('click', async e => {
  if (uploading) return;
  const g = sel => e.target.closest(sel), ss = sessions.find(x => x.id === curS);
  try {
    let b;
    if ((b = g('[data-sm]'))) return reorder(sessions, curS, Number(b.dataset.sm));
    if (g('[data-rn]')) { const t = prompt('اسم الحصة:', ss.title); if (t && t.trim()) { await updateDoc(doc(col(), ss.id), { title: t.trim(), updatedAt: serverTimestamp() }); await loadAll(); } return; }
    if (g('[data-tg]')) { await updateDoc(doc(col(), ss.id), { visible: ss.visible === false, updatedAt: serverTimestamp() }); await loadAll(); await syncCount(); return; }
    if (g('[data-sd]')) {
      const its = itemsOf(ss.id);
      if (!confirm(`حذف "${ss.title}" بكل اللي فيها (${its.length} عنصر)؟\nمش هتقدر ترجّعها.`)) return;
      for (const l of its) await delItem(l);
      await deleteDoc(doc(col(), ss.id)); curS = null; closeForm(true); await loadAll(); await syncCount(); toast('تم حذف الحصة'); return;
    }
    if ((b = g('[data-im]'))) return reorder(itemsOf(curS), b.dataset.id, Number(b.dataset.im));
    if ((b = g('[data-ie]'))) { const l = items.find(x => x.id === b.dataset.ie); return (l.kind === 'exam' ? openExam(l) : openForm(l.kind || 'video', l)); }
    if ((b = g('[data-idl]'))) {
      const l = items.find(x => x.id === b.dataset.idl);
      if (!confirm(`حذف "${l.title}"؟${l.fileId ? '\nالملف المرفوع هيتمسح كمان.' : ''}`)) return;
      await delItem(l); await loadAll(); await syncCount(); toast('تم الحذف'); return;
    }
    if ((b = g('[data-new]'))) return b.dataset.new === 'exam' ? openExam(null) : openForm(b.dataset.new, null);
  } catch (ex) { console.error(ex); toast('حصلت مشكلة، راجع قواعد Firestore'); }
});

/* ----- نموذج المحتوى ----- */
function syncKind(){
  const k = curKind, f = lf();
  $('lsrc').classList.toggle('hide', !DZ[k]);
  $('lurlw').classList.toggle('hide', k === 'text');
  $('lurlt').textContent = k === 'link' ? 'الرابط (مطلوب)' : k === 'video' ? 'أو الصق رابط الفيديو (يوتيوب / فيميو / درايف)' : 'أو الصق رابط الملف';
  $('ldlt').textContent = k === 'text' ? 'النص (مطلوب)' : 'وصف (اختياري)';
  f.elements.ldesc.rows = k === 'text' ? 7 : 3;
  $('lfile').accept = k === 'video' ? 'video/mp4,video/webm,video/*' : k === 'pdf' ? 'application/pdf' : '';
  document.querySelectorAll('.tp').forEach(t => t.classList.toggle('on', t.dataset.new === k));
}
function showFile(){
  const d = DZ[curKind]; if (!d) return;
  const has = !!pickedFile || !!keepOld;
  $('dzi').textContent = has ? '✅' : d[0];
  $('dzt').textContent = pickedFile ? pickedFile.name : keepOld ? 'الملف الحالي: ' + (keepOld.fileName || 'مرفوع') : d[1];
  $('dzs').textContent = pickedFile ? mb(pickedFile.size) : keepOld ? mb(keepOld.size || 0) + ' • اضغط لاستبداله' : d[2];
  $('lfdel').classList.toggle('hide', !has);
}
function pick(f){
  if (!f) return;
  if (f.size > MAX_MB * 1048576) return toast(`الملف أكبر من ${MAX_MB} ميجا. للفيديوهات الكبيرة استخدم رابط يوتيوب.`);
  pickedFile = f; showFile();
  const t = lf().elements.ltitle; if (!t.value.trim()) t.value = f.name.replace(/\.[^.]+$/, '');
}
$('lfile').addEventListener('change', e => { const f = e.target.files[0]; e.target.value = ''; pick(f); });
const dz = $('dz');
['dragenter','dragover'].forEach(n => dz.addEventListener(n, e => { e.preventDefault(); dz.classList.add('over'); }));
['dragleave','drop'].forEach(n => dz.addEventListener(n, e => { e.preventDefault(); dz.classList.remove('over'); }));
dz.addEventListener('drop', e => pick(e.dataTransfer.files[0]));
$('lfdel').addEventListener('click', () => { pickedFile = null; keepOld = null; showFile(); });
$('lcancel').addEventListener('click', () => { cancelUp = true; });
$('lclose').addEventListener('click', () => closeForm());

function openForm(kind, item){
  if (uploading) return;
  curKind = kind; editingL = item || null; pickedFile = null; keepOld = null;
  const f = lf(); f.reset();
  f.elements.lsess.innerHTML = sessions.map(x => `<option value="${x.id}">${esc(x.title)}</option>`).join('') + (items.some(x => !x.sessionId) ? `<option value="${LEG}">بدون حصة</option>` : '');
  f.elements.lsess.value = item ? sidOf(item) : curS;
  if (item) {
    f.elements.ltitle.value = item.title || ''; f.elements.lurl.value = item.fileId ? '' : (item.url || '');
    f.elements.ldesc.value = item.desc || ''; f.elements.ldur.value = item.duration || '';
    keepOld = item.fileId ? { fileId: item.fileId, parts: item.parts, mime: item.mime, size: item.size, fileName: item.fileName } : null;
  }
  f.elements.lvis.checked = item ? item.visible !== false : true;
  $('lft').textContent = (item ? 'تعديل: ' : 'إضافة: ') + TNAME[kind];
  $('lbw').classList.add('hide'); $('lpct').textContent = ''; $('lbar').style.width = '0';
  syncKind(); showFile(); f.classList.remove('hide');
  f.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); f.elements.ltitle.focus({ preventScroll: true });
}
function closeForm(force){
  if (uploading && !force) return;
  lf().classList.add('hide'); editingL = null; pickedFile = null; keepOld = null;
  document.querySelectorAll('.tp').forEach(t => t.classList.remove('on'));
}

/* ----- رفع الملف مقسّم قطع داخل Firestore ----- */
async function upload(file){
  const fid = (crypto.randomUUID ? crypto.randomUUID() : Date.now() + '-' + Math.random().toString(36).slice(2));
  const n = Math.max(1, Math.ceil(file.size / CH)); let done = 0, next = 0; cancelUp = false;
  $('lbw').classList.remove('hide'); $('lcancel').classList.remove('hide'); $('lbar').style.width = '0';
  const worker = async () => {
    for (;;) {
      if (cancelUp) throw Object.assign(new Error('cancel'), { code: 'cancel' });
      const i = next++; if (i >= n) return;
      const u8 = new Uint8Array(await file.slice(i * CH, (i + 1) * CH).arrayBuffer());
      await setDoc(doc(db, 'files', fid, 'parts', pid(i)), { i, d: Bytes.fromUint8Array(u8) });
      done++; const p = done / n * 100;
      $('lbar').style.width = p + '%';
      $('lpct').textContent = `جاري الرفع ${Math.round(p)}%  (${mb(Math.min(file.size, done * CH))} / ${mb(file.size)}) — ما تقفلش الصفحة`;
    }
  };
  const res = await Promise.allSettled([worker(), worker(), worker()]);
  const bad = res.find(r => r.status === 'rejected');
  if (bad) { cancelUp = true; await delParts(fid, n); throw bad.reason; }
  return { fileId: fid, parts: n, mime: file.type || 'application/octet-stream', size: file.size };
}

lf().addEventListener('submit', async e => {
  e.preventDefault();
  if (uploading) return;
  const f = e.target, v = k => f.elements[k].value.trim(), kind = curKind, sv = $('lsave');
  const needFile = !!DZ[kind];
  if (kind === 'text' && !v('ldesc')) return toast('اكتب النص الأول');
  if (kind === 'link' && !v('lurl')) return toast('الصق الرابط الأول');
  if (needFile && !pickedFile && !keepOld && !v('lurl')) return toast('اختار ملف من جهازك أو الصق رابط');
  sv.disabled = true; uploading = true;
  const sess = v('lsess') === LEG ? '' : v('lsess');
  const data = { kind, title: v('ltitle'), desc: v('ldesc'), duration: v('ldur'), sessionId: sess,
    order: (editingL && (editingL.sessionId || '') === sess) ? (editingL.order || 1) : nextOrd(sess || LEG),
    visible: f.elements.lvis.checked, updatedAt: serverTimestamp(),
    url: '', fileId: '', parts: 0, mime: '', size: 0, fileName: '' };
  let oldDel = null, newFile = null;
  try {
    if (needFile && pickedFile) {
      newFile = await upload(pickedFile);
      Object.assign(data, newFile, { fileName: pickedFile.name });
      if (editingL && editingL.fileId) oldDel = editingL;
    } else if (needFile && keepOld) {
      Object.assign(data, keepOld);
    } else {
      data.url = kind === 'text' ? '' : v('lurl');
      if (editingL && editingL.fileId) oldDel = editingL;
    }
    try {
      if (editingL) await updateDoc(doc(col(), editingL.id), data);
      else await addDoc(col(), { ...data, createdAt: serverTimestamp() });
    } catch (ex) { if (newFile) await delParts(newFile.fileId, newFile.parts); throw ex; }
    if (oldDel) await delParts(oldDel.fileId, oldDel.parts || 0);
    uploading = false; curS = sess || LEG; closeForm(true);
    await loadAll(); await syncCount(); toast('تم الحفظ ✅');
  } catch (ex) {
    console.error(ex);
    toast(ex.code === 'cancel' ? 'اتلغى الرفع'
      : ex.code === 'permission-denied' ? 'قواعد Firestore مش بتسمح، ضيف قاعدة files'
      : 'فشل الحفظ، حاول تاني');
    $('lbw').classList.add('hide'); $('lpct').textContent = '';
  }
  sv.disabled = false; uploading = false; $('lcancel').classList.add('hide');
});

/* ===== الكتب ===== */
let books = [], editingB = null, bMode = 'color', bImg = '';
const SW = ['#17255E','#0E5C63','#F2A900','#D7263D','#1E4A42','#6C5FFC','#2A3547','#0B7A4B'];
const fg = hex => { const h = String(hex || '').replace('#', ''); if (h.length !== 6) return '#fff';
  const [r, g, b] = [0, 2, 4].map(i => parseInt(h.substr(i, 2), 16)); return (r * 299 + g * 587 + b * 114) / 1000 > 150 ? '#141B3D' : '#fff'; };
const bf = () => $('bf');
const coverStyle = b => (b.mode === 'image' && b.image) ? `background:url('${esc(b.image)}') center/cover no-repeat` : `background:${esc(b.color || '#17255E')};color:${fg(b.color)}`;

async function loadBooks(){
  const sn = await getDocs(collection(db, 'books'));
  books = sn.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => (a.order || 999) - (b.order || 999) || (a.createdAt?.seconds || 0) - (b.createdAt?.seconds || 0));
  $('brows').innerHTML = books.length ? books.map(b => `
    <tr>
      <td><div class="th"><span class="bthumb" style="${coverStyle(b)}">${b.mode === 'image' && b.image ? '' : esc(b.coverMain || '')}</span>${esc(b.title)}</div></td>
      <td>${b.price > 0 ? `<b>${nf(b.price)} جنيه</b>${b.oldPrice > b.price ? `<span class="old">${nf(b.oldPrice)} جنيه</span>` : ''}` : '-'}</td>
      <td><span class="tag ${b.visible ? 'on' : 'off'}">${b.visible ? 'ظاهر' : 'مخفي'}</span></td>
      <td>${fTs(b.updatedAt || b.createdAt)}</td>
      <td><div class="act"><button class="btn g sm" data-be="${b.id}">تعديل</button><button class="btn r sm" data-bd="${b.id}">حذف</button></div></td>
    </tr>`).join('') : '<tr><td colspan="5" class="empty">لسه مفيش كتب. دوس «كتاب جديد».</td></tr>';
}

function bPreview(){
  const f = bf().elements, color = f.bcolor.value, img = bMode === 'image' && bImg;
  const cv = $('bcv');
  cv.style.cssText = img ? `background:url('${bImg}') center/cover no-repeat` : `background:${color};color:${fg(color)}`;
  cv.innerHTML = img ? '' : `<div class="by">أ. أحمد رمضان</div><div><b>${esc(f.bmain.value || f.btitle.value.slice(0, 6) || 'كتاب')}</b><span>${esc(f.bsub.value)}</span></div><div class="ft">${esc(f.btag.value)}</div>`;
  const p = Number(f.bprice.value) || 0, o = Number(f.bold.value) || 0;
  $('bpp').innerHTML = p ? `${o > p ? `<s>${nf(o)} جنيه</s>` : ''}${nf(p)} جنيه` : '';
  document.querySelectorAll('#sw button').forEach(x => x.classList.toggle('on', x.dataset.c.toLowerCase() === color.toLowerCase()));
}
function setBMode(m){
  bMode = m;
  document.querySelectorAll('.modes button').forEach(x => x.classList.toggle('on', x.dataset.m === m));
  $('m-color').classList.toggle('hide', m !== 'color'); $('m-image').classList.toggle('hide', m !== 'image');
  bPreview();
}
function setBImg(v){
  bImg = v || '';
  const pv = $('bprevimg'), has = !!bImg;
  if (has) pv.src = bImg;
  pv.classList.toggle('hide', !has); $('bph').classList.toggle('hide', has); $('bdel').classList.toggle('hide', !has);
  bf().elements.bimgurl.value = /^https?:/.test(bImg) ? bImg : '';
  bPreview();
}
$('sw').innerHTML = SW.map(c => `<button type="button" data-c="${c}" style="background:${c}" aria-label="${c}"></button>`).join('');
$('sw').addEventListener('click', e => { const b = e.target.closest('[data-c]'); if (b) { bf().elements.bcolor.value = b.dataset.c; bPreview(); } });
document.querySelector('.modes').addEventListener('click', e => { const b = e.target.closest('[data-m]'); if (b) setBMode(b.dataset.m); });
bf().addEventListener('input', e => { if (e.target.name === 'bimgurl') { setBImg(e.target.value.trim()); return; } bPreview(); });
$('bfile').addEventListener('change', async e => {
  const f = e.target.files[0]; e.target.value = ''; if (!f) return;
  try { setBImg(await compress(f, 600)); } catch { toast('الصورة دي مش مدعومة، جرّب صورة تانية'); }
});
$('bdel').addEventListener('click', () => setBImg(''));

function openB(b){
  editingB = b; const f = bf(); f.reset(); const el = f.elements;
  $('bft').textContent = b ? 'تعديل الكتاب' : 'كتاب جديد';
  if (b) {
    el.btitle.value = b.title || ''; el.bprice.value = b.price ?? ''; el.bold.value = b.oldPrice || ''; el.border.value = b.order || '';
    el.bcolor.value = b.color || '#17255E'; el.bmain.value = b.coverMain || ''; el.bsub.value = b.coverSub || ''; el.btag.value = b.coverTag || '';
    el.bvis.checked = !!b.visible;
  } else { el.bcolor.value = SW[books.length % SW.length]; el.border.value = books.length + 1; }
  setBImg(b ? (b.image || '') : ''); setBMode(b ? (b.mode === 'image' && b.image ? 'image' : 'color') : 'color');
  $('bmod').classList.add('on');
}
$('addB').addEventListener('click', () => openB(null));
$('bx').addEventListener('click', () => $('bmod').classList.remove('on'));
$('bcx').addEventListener('click', () => $('bmod').classList.remove('on'));
$('brows').addEventListener('click', async e => {
  const eb = e.target.closest('[data-be]'), db_ = e.target.closest('[data-bd]');
  if (eb) openB(books.find(b => b.id === eb.dataset.be));
  if (db_) {
    const b = books.find(b => b.id === db_.dataset.bd);
    if (!confirm(`حذف كتاب "${b.title}"؟`)) return;
    try { await deleteDoc(doc(db, 'books', b.id)); await loadBooks(); toast('تم حذف الكتاب'); } catch (ex) { console.error(ex); toast('فشل الحذف، راجع قواعد Firestore'); }
  }
});
bf().addEventListener('submit', async e => {
  e.preventDefault();
  const el = bf().elements, v = k => el[k].value.trim();
  const price = Number(v('bprice')), old = v('bold') ? Number(v('bold')) : 0;
  if (!(price >= 0) || v('bprice') === '') return toast('اكتب سعر الكتاب');
  if (old && old <= price) return toast('السعر قبل الخصم لازم يكون أكبر من السعر الحالي');
  if (bMode === 'image' && !bImg) return toast('اختار صورة الغلاف أو اختار «لون بس»');
  const data = { title: v('btitle'), price, oldPrice: old || null, order: v('border') ? Number(v('border')) : books.length + 1,
    mode: bMode, color: el.bcolor.value, image: bImg, coverMain: v('bmain'), coverSub: v('bsub'), coverTag: v('btag'),
    visible: el.bvis.checked, updatedAt: serverTimestamp() };
  $('bsave').disabled = true;
  try {
    if (editingB) await updateDoc(doc(db, 'books', editingB.id), data);
    else await addDoc(collection(db, 'books'), { ...data, createdAt: serverTimestamp() });
    $('bmod').classList.remove('on'); await loadBooks(); toast('تم حفظ الكتاب ✅');
  } catch (ex) { console.error(ex); toast(ex.code === 'permission-denied' ? 'قواعد Firestore مش بتسمح، ضيف قاعدة books' : 'فشل الحفظ، حاول تاني'); }
  $('bsave').disabled = false;
});

function stats(){
  const n = g => users.filter(x => x.grade === g).length;
  $('c-all').textContent = users.length;
  GR.forEach((g,i) => $('c-'+(i+1)).textContent = n(g));
  const wk = Date.now()/1000 - 7*86400;
  $('c-w').textContent = users.filter(x => (x.createdAt?.seconds||0) > wk).length;
  $('c-g').textContent = new Set(users.map(x => x.governorate).filter(Boolean)).size;

  const t = users.length || 1, a = n(GR[0])/t*100, b = a + n(GR[1])/t*100;
  $('donut').style.background = users.length
    ? `conic-gradient(#5D87FF 0 ${a}%,#49BEFF ${a}% ${b}%,#FFAE1F ${b}% 100%)` : '#ECF2FF';

  const now = new Date(), buckets = [];
  for (let i=11;i>=0;i--) { const d = new Date(now.getFullYear(), now.getMonth()-i, 1); buckets.push({y:d.getFullYear(), m:d.getMonth(), c:0}); }
  users.forEach(x => { if (!x.createdAt?.toDate) return; const d = x.createdAt.toDate();
    const k = buckets.find(k => k.y===d.getFullYear() && k.m===d.getMonth()); if (k) k.c++; });
  const mx = Math.max(1, ...buckets.map(k => k.c));
  $('bars').innerHTML = buckets.map(k => `<div>${k.c||''}<i style="height:${k.c/mx*85}%"></i></div>`).join('');
  $('months').innerHTML = buckets.map(k => `<span>${new Date(k.y,k.m,1).toLocaleDateString('ar-EG',{month:'short'})}</span>`).join('');
}

function view(){
  const q = $('q').value.trim().toLowerCase(), g = $('fg').value;
  return users.filter(x => (!g || x.grade === g) &&
    (!q || [x.student,x.father,x.studentPhone,x.fatherPhone,x.motherPhone,x.governorate].join(' ').toLowerCase().includes(q)));
}

function render(){
  const list = view();
  $('rows').innerHTML = list.length ? list.map(x => `
    <tr>
      <td><div class="who"><b>${esc((x.student||'?').trim().charAt(0))}</b>${esc(x.student)}</div></td>
      <td><span class="tag">${esc(x.grade)}</span></td>
      <td>${esc(x.governorate)}</td>
      <td class="n">${esc(x.studentPhone)}</td>
      <td>${esc(x.father)}</td>
      <td class="n">${esc(x.fatherPhone)}</td>
      <td>${x.createdAt?.toDate ? x.createdAt.toDate().toLocaleDateString('ar-EG',{year:'numeric',month:'short',day:'numeric'}) : '-'}</td>
      <td><div class="act"><button class="btn g sm" data-e="${x.id}">تعديل</button><button class="btn r sm" data-d="${x.id}">حذف</button></div></td>
    </tr>`).join('') : `<tr><td colspan="8" class="empty">مفيش طلاب مطابقين.</td></tr>`;
}

$('q').addEventListener('input', render);
$('fg').addEventListener('change', render);

$('rows').addEventListener('click', async e => {
  const eb = e.target.closest('[data-e]'), db_ = e.target.closest('[data-d]');
  if (eb) {
    editing = users.find(x => x.id === eb.dataset.e);
    const f = $('ef');
    ['student','father','studentPhone','fatherPhone','motherPhone','governorate','grade'].forEach(k => f.elements[k].value = editing[k] || '');
    $('mod').classList.add('on');
  }
  if (db_) {
    const x = users.find(x => x.id === db_.dataset.d);
    if (!confirm(`متأكد إنك عايز تحذف بيانات "${x.student}"؟\nملحوظة: ده بيمسح بياناته بس، ومش بيمسح حساب الدخول.`)) return;
    try { await deleteDoc(doc(db, 'users', x.id)); users = users.filter(u => u.id !== x.id); stats(); render(); toast('تم حذف بيانات الطالب'); }
    catch (ex) { console.error(ex); toast('فشل الحذف، راجع قواعد Firestore'); }
  }
});

$('cx').addEventListener('click', () => $('mod').classList.remove('on'));
$('ef').addEventListener('submit', async e => {
  e.preventDefault();
  const f = e.target, data = {};
  ['student','father','fatherPhone','motherPhone','governorate','grade'].forEach(k => data[k] = f.elements[k].value.trim());
  try {
    await updateDoc(doc(db, 'users', editing.id), data);
    Object.assign(editing, data); stats(); render();
    $('mod').classList.remove('on'); toast('تم حفظ التعديلات');
  } catch (ex) { console.error(ex); toast('فشل الحفظ، راجع قواعد Firestore'); }
});

$('csv').addEventListener('click', () => {
  const h = ['الاسم','الصف','المحافظة','رقم الطالب','ولي الأمر','رقم ولي الأمر','رقم الوالدة'];
  const r = view().map(x => [x.student,x.grade,x.governorate,x.studentPhone,x.father,x.fatherPhone,x.motherPhone]
    .map(v => `"${String(v ?? '').replace(/"/g,'""')}"`).join(','));
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob(['\ufeff' + [h.join(','), ...r].join('\n')], { type:'text/csv;charset=utf-8' }));
  a.download = 'students.csv'; a.click();
});

function show(v){
  if (!['top','courses','books','users'].includes(v)) v = 'top';
  document.querySelectorAll('[data-view]').forEach(e => e.classList.toggle('on', e.dataset.view === v));
  document.querySelectorAll('[data-go]').forEach(b => b.classList.toggle('on', b.dataset.go === v));
  history.replaceState(null, '', '#' + v);
  window.scrollTo(0, 0);
}
document.querySelectorAll('[data-go]').forEach(b => b.addEventListener('click', () => show(b.dataset.go)));
$('q').addEventListener('input', () => show('users'));
show(location.hash.slice(1));

$('out').addEventListener('click', async () => {
  sessionStorage.removeItem('adm_ok'); await signOut(auth); location.href = 'index.html';
});

/* ===================================================================
   ===== الامتحانات: محرر الأسئلة والإجابات والإعدادات =====
   =================================================================== */
const LT = ['أ', 'ب', 'ج', 'د', 'هـ', 'و'];
let exEdit = null, exQs = [], exSaving = false;
const blankQ = (tf) => ({ q: '', img: '', topic: '', why: '', opts: tf ? ['صح', 'خطأ'] : ['', '', '', ''], correct: -1 });

const exCss = document.createElement('style');
exCss.textContent = `
.exbox{max-width:860px!important}
.exbox input:not([type=checkbox]):not([type=radio]),.exbox textarea,.exbox select{width:100%;border:1px solid var(--line);border-radius:8px;padding:8px 12px;font:inherit;background:#fff;color:var(--ink);margin-top:4px}
.exbox textarea{resize:vertical}
.exbox .ck{display:flex;align-items:center;gap:8px;color:var(--ink);font-weight:600;margin-bottom:8px;font-size:.92rem}
.exbox .ck input{width:auto;margin:0}
.exh{display:flex;justify-content:space-between;align-items:center;margin:18px 0 10px}
.exh h4{font-size:1.02rem}
.eq{border:1.5px solid var(--line);border-radius:12px;padding:14px;margin-bottom:12px;background:#FBFCFE}
.eq.bad{border-color:var(--red);background:#FFF8F5}
.eqh{display:flex;justify-content:space-between;align-items:center;margin-bottom:8px}
.eqh .ibtn{width:30px;height:30px;font-size:.85rem}
.eo{display:flex;align-items:center;gap:8px;margin-top:6px}
.eo input[type=radio]{width:20px;height:20px;accent-color:#13DEB9;flex:none;margin:0}
.eo .lt2{flex:none;width:26px;font-weight:800;color:var(--muted)}
.eo input[type=text]{margin-top:0}
.eo.ok input[type=text]{border-color:#13DEB9;background:#E6FFFA}
.eqn{font-size:.78rem;color:var(--muted);margin:6px 0 2px}
.exbk{background:var(--pri-l);border-radius:10px;padding:12px;margin-bottom:12px}
.exbk small{display:block;color:var(--muted);margin:6px 0;line-height:1.7;white-space:pre-line}
`;
document.head.appendChild(exCss);

const exMod = document.createElement('div'); exMod.className = 'mod'; exMod.id = 'exmod';
exMod.innerHTML = `<div class="mbox exbox">
  <h3 id="exh">🎯 امتحان</h3>
  <form id="exf" novalidate>
    <label>عنوان الامتحان<input name="title" placeholder="مثال: امتحان على الحصة الأولى"></label>
    <label>تعليمات / وصف (اختياري)<textarea name="desc" rows="2"></textarea></label>
    <div class="g2">
      <label>نسبة النجاح ٪<input name="pass" type="number" min="1" max="100" value="50"></label>
      <label>الوقت بالدقايق (٠ = من غير وقت)<input name="time" type="number" min="0" value="0"></label>
      <label>محاولات الطالب لو ما نجحش (٠ = مفتوح)<input name="tries" type="number" min="0" value="0"></label>
      <label>الحصة<select name="sess"></select></label>
      <label>طريقة عرض الأسئلة<select name="view"><option value="single">سؤال سؤال (كل سؤال في شاشة)</option><option value="all">كل الأسئلة في صفحة واحدة</option></select></label>
      <label>شكل الإجابات<select name="optl"><option value="col">بالطول (تحت بعض)</option><option value="grid">بالعرض (عمودين جنب بعض)</option><option value="row">في صف واحد</option></select></label>
    </div>
    <p class="eqn" style="margin:-4px 0 10px">المحاولات بتتحسب على الرسوب بس، ولو الطالب نجح يعيد الامتحان براحته. الطالب بيدخل الامتحان على طول أول ما يفتحه.</p>
    <label class="ck"><input type="checkbox" name="gate" checked> لازم الطالب ينجح عشان تتفتح له الحصة اللي بعد دي (لو غلط يفضل واقف عندها)</label>
    <label class="ck"><input type="checkbox" name="shuf" checked> اخلط ترتيب الأسئلة والاختيارات في كل محاولة</label>
    <label class="ck"><input type="checkbox" name="vis" checked> ظاهر للطلاب</label>
    <div class="exh"><h4>الأسئلة (<span id="exn">0</span>)</h4><button type="button" class="btn g sm" id="exbulk">📋 لصق أسئلة بالجملة</button></div>
    <div class="exbk hide" id="exbw">
      <small>الصق الأسئلة بالشكل ده (علّم الصح بنجمة * قبل الاختيار أو اكتب سطر الإجابة):
س: عاصمة مصر؟
أ) الإسكندرية
*ب) القاهرة
ج) أسوان
الشرح: القاهرة هي العاصمة من سنة ٩٦٩م</small>
      <textarea id="exbt" rows="9" placeholder="س: ..."></textarea>
      <button type="button" class="btn sm" id="exbgo" style="margin-top:8px">إضافة الأسئلة</button>
    </div>
    <div id="exq"></div>
    <div class="foot" style="justify-content:flex-start;gap:10px;margin:6px 0 16px">
      <button type="button" class="btn g" id="exaq">➕ سؤال اختيار من متعدد</button>
      <button type="button" class="btn g" id="exatf">➕ سؤال صح / خطأ</button>
    </div>
    <div class="foot"><button type="submit" class="btn" id="exsv">حفظ الامتحان</button><button type="button" class="btn g" id="exx">إلغاء</button></div>
  </form></div>`;
document.body.appendChild(exMod);
const ef = () => $('exf');

function openExam(item){
  if (uploading) return;
  exEdit = item || null;
  const f = ef(), ex = (item && item.exam) || {};
  f.reset();
  f.elements.sess.innerHTML = sessions.map(x => `<option value="${x.id}">${esc(x.title)}</option>`).join('') + (items.some(x => !x.sessionId) ? `<option value="${LEG}">بدون حصة</option>` : '');
  f.elements.sess.value = item ? sidOf(item) : curS;
  f.elements.title.value = item ? item.title || '' : '';
  f.elements.desc.value = item ? item.desc || '' : '';
  f.elements.view.value = ex.view === 'all' ? 'all' : 'single'; f.elements.optl.value = ['grid', 'row'].includes(ex.optLayout) ? ex.optLayout : 'col';
  f.elements.pass.value = ex.passPct || 50; f.elements.time.value = ex.timeLimit || 0; f.elements.tries.value = ex.maxAttempts || 0;
  f.elements.gate.checked = item ? !!ex.gate : true; f.elements.shuf.checked = item ? ex.shuffle !== false : true;
  f.elements.vis.checked = item ? item.visible !== false : true;
  exQs = (ex.questions || []).map(q => ({ q: q.q || '', img: q.img || '', topic: q.topic || '', why: q.why || '', opts: [...q.opts], correct: q.correct }));
  if (!exQs.length) exQs = [blankQ()];
  $('exh').textContent = item ? '🎯 تعديل الامتحان' : '🎯 امتحان جديد';
  $('exbw').classList.add('hide'); $('exbt').value = '';
  renderQs(); exMod.classList.add('on');
  exMod.querySelector('.mbox').scrollTop = 0;
}
function closeExam(){ exMod.classList.remove('on'); exEdit = null; exQs = []; }

function renderQs(){
  $('exn').textContent = nf(exQs.length);
  $('exq').innerHTML = exQs.map((q, qi) => `
    <div class="eq" data-qi="${qi}">
      <div class="eqh"><b>سؤال ${nf(qi + 1)}</b><span>
        <button type="button" class="ibtn" data-qm="-1" ${qi === 0 ? 'disabled' : ''} title="تقديم">↑</button>
        <button type="button" class="ibtn" data-qm="1" ${qi === exQs.length - 1 ? 'disabled' : ''} title="تأخير">↓</button>
        <button type="button" class="ibtn" data-qdup title="نسخ">⧉</button>
        <button type="button" class="ibtn rd" data-qdel title="حذف">🗑</button></span></div>
      <textarea data-f="q" rows="2" placeholder="نص السؤال">${esc(q.q)}</textarea>
      <div class="g2">
        <input type="text" data-f="img" dir="ltr" placeholder="رابط صورة للسؤال (اختياري)" value="${esc(q.img)}">
        <input type="text" data-f="topic" placeholder="الباب / الموضوع (اختياري — بيطلّع للطالب نقط ضعفه)" value="${esc(q.topic)}">
      </div>
      <div class="eqn">اختيارات الإجابة — دوّس على الدايرة عند الإجابة الصح ✅</div>
      ${q.opts.map((o, oi) => `<div class="eo ${q.correct === oi ? 'ok' : ''}"><input type="radio" name="c${qi}" data-c="${oi}" ${q.correct === oi ? 'checked' : ''} title="الإجابة الصح"><span class="lt2">${LT[oi]}</span><input type="text" data-o="${oi}" placeholder="الاختيار ${LT[oi]}" value="${esc(o)}"><button type="button" class="ibtn rd" data-od="${oi}" ${q.opts.length <= 2 ? 'disabled' : ''}>✕</button></div>`).join('')}
      ${q.opts.length < 6 ? '<button type="button" class="btn g sm" data-oa style="margin-top:8px">+ اختيار</button>' : ''}
      <div class="eqn">شرح الإجابة الصح (بيظهر للطالب بعد الحل — اختياري لكن مفيد جدًا)</div>
      <textarea data-f="why" rows="2" placeholder="ليه الإجابة دي هي الصح؟">${esc(q.why)}</textarea>
    </div>`).join('');
}

$('exq').addEventListener('input', e => {
  const card = e.target.closest('.eq'); if (!card) return;
  const q = exQs[Number(card.dataset.qi)], t = e.target;
  if (t.dataset.f) q[t.dataset.f] = t.value;
  else if (t.dataset.o !== undefined) q.opts[Number(t.dataset.o)] = t.value;
  card.classList.remove('bad');
});
$('exq').addEventListener('change', e => {
  const t = e.target, card = t.closest('.eq'); if (!card || t.dataset.c === undefined) return;
  exQs[Number(card.dataset.qi)].correct = Number(t.dataset.c);
  card.querySelectorAll('.eo').forEach((r, i) => r.classList.toggle('ok', i === Number(t.dataset.c)));
  card.classList.remove('bad');
});
$('exq').addEventListener('click', e => {
  const b = e.target.closest('button'), card = e.target.closest('.eq'); if (!b || !card) return;
  const qi = Number(card.dataset.qi), q = exQs[qi];
  if (b.dataset.qm) { const j = qi + Number(b.dataset.qm); if (j < 0 || j >= exQs.length) return; [exQs[qi], exQs[j]] = [exQs[j], exQs[qi]]; }
  else if (b.dataset.qdup !== undefined) exQs.splice(qi + 1, 0, { ...q, opts: [...q.opts] });
  else if (b.dataset.qdel !== undefined) { if (!confirm('حذف السؤال ده؟')) return; exQs.splice(qi, 1); if (!exQs.length) exQs.push(blankQ()); }
  else if (b.dataset.oa !== undefined) q.opts.push('');
  else if (b.dataset.od !== undefined) { const oi = Number(b.dataset.od); if (q.opts.length <= 2) return; q.opts.splice(oi, 1); q.correct = q.correct === oi ? -1 : q.correct > oi ? q.correct - 1 : q.correct; }
  else return;
  renderQs();
});
const addQ = tf => { exQs.push(blankQ(tf)); renderQs(); const c = $('exq').lastElementChild; if (c) { c.scrollIntoView({ behavior: 'smooth', block: 'center' }); c.querySelector('textarea').focus({ preventScroll: true }); } };
$('exaq').addEventListener('click', () => addQ(false));
$('exatf').addEventListener('click', () => addQ(true));
$('exx').addEventListener('click', () => { if (!exSaving && confirm('إغلاق من غير حفظ؟')) closeExam(); });
$('exbulk').addEventListener('click', () => $('exbw').classList.toggle('hide'));

/* ----- لصق أسئلة بالجملة ----- */
function parseBulk(txt){
  const out = []; let cur = null;
  const LI = { 'أ': 0, 'ا': 0, 'ب': 1, 'ج': 2, 'د': 3, 'ه': 4, 'هـ': 4, 'و': 5, a: 0, b: 1, c: 2, d: 3, e: 4, f: 5 };
  const push = () => { if (cur && cur.q && cur.opts.length >= 2) out.push(cur); cur = null; };
  txt.split(/\r?\n/).map(l => l.trim()).filter(Boolean).forEach(l => {
    let m;
    if ((m = l.match(/^(?:س\s*\d*\s*[:：]|\d+\s*[.)]|q\s*\d*\s*[:.)])\s*(.+)$/i))) { push(); cur = { q: m[1], img: '', topic: '', why: '', opts: [], correct: -1 }; return; }
    if (!cur) return;
    if ((m = l.match(/^(?:الإجابة|الاجابة|الجواب|answer)\s*[:：]\s*(\S+)/i))) { const k = LI[m[1].replace(/[).]/g, '').toLowerCase()]; if (k != null && k < cur.opts.length) cur.correct = k; return; }
    if ((m = l.match(/^(?:الشرح|التوضيح|السبب)\s*[:：]\s*(.+)$/))) { cur.why = m[1]; return; }
    if ((m = l.match(/^(\*?)\s*(?:([أابجدهوa-f]ـ?)\s*[).]|[-•])\s*(.+?)\s*(✓|✔)?$/i))) {
      cur.opts.push(m[3]); if (m[1] || m[4]) cur.correct = cur.opts.length - 1; return;
    }
    if (!cur.opts.length) cur.q += '\n' + l;
  });
  push(); return out;
}
$('exbgo').addEventListener('click', () => {
  const qs = parseBulk($('exbt').value);
  if (!qs.length) return toast('مقدرتش أفهم الأسئلة، راجع الشكل المكتوب فوق');
  if (exQs.length === 1 && !exQs[0].q.trim() && exQs[0].opts.every(o => !o.trim())) exQs = [];
  exQs.push(...qs); $('exbt').value = ''; $('exbw').classList.add('hide'); renderQs();
  toast(`تمت إضافة ${nf(qs.length)} سؤال` + (qs.some(q => q.correct < 0) ? ' — حدد الإجابة الصح في اللي معلّم بالأحمر' : ''));
  exq_markBad();
});
function exq_markBad(){ document.querySelectorAll('#exq .eq').forEach((c, i) => c.classList.toggle('bad', exQs[i].correct < 0)); }

/* ----- الحفظ ----- */
ef().addEventListener('submit', async e => {
  e.preventDefault();
  if (exSaving) return;
  const f = e.target, v = k => f.elements[k].value.trim();
  if (!v('title')) return toast('اكتب عنوان الامتحان');
  const pass = Number(v('pass')) || 50;
  if (pass < 1 || pass > 100) return toast('نسبة النجاح لازم تكون من ١ لـ ١٠٠');
  const questions = [];
  for (let i = 0; i < exQs.length; i++) {
    const q = exQs[i], card = $('exq').children[i];
    const o = q.opts.map((t, k) => ({ t: t.trim(), k })).filter(x => x.t);
    const bad = m => { card.classList.add('bad'); card.scrollIntoView({ behavior: 'smooth', block: 'center' }); toast(`سؤال ${nf(i + 1)}: ${m}`); };
    if (!q.q.trim()) return bad('اكتب نص السؤال');
    if (o.length < 2) return bad('لازم اختيارين على الأقل');
    const c = o.findIndex(x => x.k === q.correct);
    if (c < 0) return bad('حدد الإجابة الصح');
    questions.push({ q: q.q.trim(), img: q.img.trim(), topic: q.topic.trim(), why: q.why.trim(), opts: o.map(x => x.t), correct: c });
  }
  const sess = v('sess') === LEG ? '' : v('sess');
  const data = { kind: 'exam', title: v('title'), desc: v('desc'), duration: '', sessionId: sess,
    order: (exEdit && (exEdit.sessionId || '') === sess) ? (exEdit.order || 1) : nextOrd(sess || LEG),
    visible: f.elements.vis.checked, updatedAt: serverTimestamp(), url: '', fileId: '', parts: 0, mime: '', size: 0, fileName: '',
    exam: { passPct: pass, gate: f.elements.gate.checked, timeLimit: Math.max(0, Number(v('time')) || 0), maxAttempts: Math.max(0, Number(v('tries')) || 0), shuffle: f.elements.shuf.checked, view: v('view'), optLayout: v('optl'), questions } };
  exSaving = true; $('exsv').disabled = true;
  try {
    if (exEdit) await updateDoc(doc(col(), exEdit.id), data);
    else await addDoc(col(), { ...data, createdAt: serverTimestamp() });
    curS = sess || LEG; closeExam(); await loadAll(); toast('تم حفظ الامتحان ✅');
  } catch (ex) {
    console.error(ex);
    toast(ex.code === 'permission-denied' ? 'قواعد Firestore مش بتسمح بالحفظ' : 'فشل الحفظ، حاول تاني');
  }
  exSaving = false; $('exsv').disabled = false;
});