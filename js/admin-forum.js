import { auth, db } from "./firebase.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import { collection, doc, addDoc, updateDoc, deleteDoc, onSnapshot, query, orderBy, limit, serverTimestamp, increment } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

import { voiceRecorder } from "./voice.js";

const ADMIN_EMAIL = '01028604523@ahmed.app';
const $ = id => document.getElementById(id);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt = t => t?.toDate ? t.toDate().toLocaleString('ar-EG',{day:'numeric',month:'short',hour:'numeric',minute:'2-digit'}) : 'الآن';
let posts = [], openId = null, unsubR = null, reps = [], started = false;
const fVoice = voiceRecorder($('fvoice'), { maxSec: 180, maxChars: 900000, btnClass: 'btn g', stopClass: 'btn r', teacher: true, label: '🎙️ سجّل ردك بصوتك' });
const aud = (s, t) => (typeof s === 'string' && s.startsWith('data:audio/')) ? `<voice-player${t?' teacher':''} src="${esc(s)}"></voice-player>` : '';

onAuthStateChanged(auth, u => {
  if (started || !u || (u.email||'').toLowerCase() !== ADMIN_EMAIL) return;
  started = true;
  onSnapshot(query(collection(db,'forum_posts'), orderBy('createdAt','desc'), limit(200)), s => {
    posts = s.docs.map(d => ({id:d.id, ...d.data()}));
    renderInbox(); if (openId) renderHead();
  }, ex => { console.error(ex); $('finbox').innerHTML = '<p class="empty">مش قادر أقرا المنتدى، حدّث قواعد Firestore.</p>'; });
});

const needs = p => !p.teacherReplied;
function renderInbox(){
  const n = posts.filter(needs).length, b = $('fbdg');
  b.textContent = n; b.classList.toggle('hide', !n);
  const f = $('ffil').value;
  const L = posts.filter(p => f==='all' || (f==='pin' ? p.pinned : needs(p)));
  $('finbox').innerHTML = L.length ? L.map(p => `
    <button class="fq" type="button" data-id="${p.id}">
      <div class="m">${needs(p)?'<span class="tag red">محتاج رد</span>':'<span class="tag grn">اتردّ عليه</span>'}${p.pinned?'<span class="tag">📌 مثبّت</span>':''}<span class="tag">${esc(p.cat)}</span>${p.lesson?`<span class="tag">${esc(p.lesson)}</span>`:''}</div>
      <h4>${esc(p.title)}</h4>${p.body?`<p>${esc(p.body.slice(0,140))}</p>`:''}
      <div class="m" style="margin-top:6px"><b>${esc(p.name)}</b><span>${esc(p.grade||'')}</span><span>•</span><span>${fmt(p.createdAt)}</span><span>•</span><span>💬 ${p.replyCount||0}</span>${p.image?'<span>📷</span>':''}${p.audio?'<span>🎙️</span>':''}</div>
    </button>`).join('') : '<p class="empty">مفيش حاجة هنا. 🎉</p>';
}
$('ffil').onchange = renderInbox;
$('finbox').onclick = e => { const c = e.target.closest('[data-id]'); if (c) openPost(c.dataset.id); };

function renderHead(){
  const p = posts.find(x => x.id === openId);
  if (!p) { $('fhead').innerHTML = '<p class="empty">السؤال اتمسح.</p>'; return; }
  $('fhead').innerHTML = `
    <div class="m" style="display:flex;gap:8px;flex-wrap:wrap"><span class="tag">${esc(p.cat)}</span>${p.lesson?`<span class="tag">${esc(p.lesson)}</span>`:''}</div>
    <h3 style="margin-top:8px">${esc(p.title)}</h3>
    <p style="color:var(--muted);font-size:.85rem">${esc(p.name)} ${p.grade?'- '+esc(p.grade):''} • ${fmt(p.createdAt)}</p>
    <p style="white-space:pre-wrap;line-height:1.8;margin-top:8px">${esc(p.body)}</p>${aud(p.audio)}${p.image?`<img class="fpic" src="${esc(p.image)}" alt="">`:''}
    <p style="margin-top:8px"><span class="tag ${p.replyVis==='private'?'red':'grn'}">${p.replyVis==='private'?'🔒 الطالب اختار إن ردك يظهر له بس':'🌐 ردك هيظهر لكل الطلبة'}</span></p>
    <div style="display:flex;gap:8px;margin-top:12px"><button class="btn g sm" data-pin="1">${p.pinned?'إلغاء التثبيت':'📌 تثبيت'}</button><button class="btn r sm" data-delp="1">مسح السؤال</button></div>`;
}
function renderReps(){
  const R = [...reps].sort((a,b)=>(b.verified?1:0)-(a.verified?1:0)||(a.createdAt?.seconds||9e12)-(b.createdAt?.seconds||9e12));
  $('frep').innerHTML = R.length ? R.map(r => `
    <div class="frp ${r.verified?'v':''}">
      <div style="font-size:.82rem;color:var(--muted)">${r.teacher?'<span class="tag">المدرس</span> ':''}<b>${esc(r.name)}</b> • ${fmt(r.createdAt)} • 👍 ${r.voters?.length||0}</div>
      ${r.body?`<p style="white-space:pre-wrap;margin-top:4px">${esc(r.body)}</p>`:''}${aud(r.audio, r.teacher)}${r.image?`<img class="fpic" src="${esc(r.image)}" alt="">`:''}
      <div style="display:flex;gap:6px;margin-top:6px"><button class="btn sm ${r.verified?'g':''}" data-ver="${r.id}">${r.verified?'إلغاء الاعتماد':'✔ اعتماد'}</button><button class="btn r sm" data-delr="${r.id}">مسح</button></div>
    </div>`).join('') : '<p class="empty">لسه مفيش ردود.</p>';
}
function openPost(id){
  unsubR?.(); openId = id; reps = []; renderHead(); $('frep').innerHTML=''; $('frf').reset(); fVoice.reset();
  unsubR = onSnapshot(query(collection(db,'forum_posts',id,'replies'), orderBy('createdAt','asc')), s => { reps = s.docs.map(d=>({id:d.id,...d.data()})); renderReps(); });
  $('fmod').classList.add('on');
}
const closeM = () => { unsubR?.(); unsubR=null; openId=null; fVoice.reset(); $('fmod').classList.remove('on'); };
$('fcl').onclick = closeM;

$('frf').onsubmit = async e => {
  e.preventDefault();
  const body = $('frb').value.trim();
  if (fVoice.busy) { alert('وقّف التسجيل الأول.'); return; }
  if (!body && !fVoice.value) { alert('اكتب ردك أو سجّل ردّ صوتي.'); return; }
  const b = $('frs'); b.disabled = true;
  try {
    await addDoc(collection(db,'forum_posts',openId,'replies'), { uid:auth.currentUser.uid, name:'أ. أحمد رمضان', teacher:true, body, audio:fVoice.value, image:'', voters:[], verified:false, createdAt:serverTimestamp() });
    await updateDoc(doc(db,'forum_posts',openId), { replyCount: increment(1), teacherReplied:true });
    $('frf').reset(); fVoice.reset(); $('toast').textContent='اتبعت الرد'; $('toast').classList.add('on'); setTimeout(()=>$('toast').classList.remove('on'),2000);
  } catch(ex){ console.error(ex); alert('الرد ما اتبعتش، جرّب تاني. (لو الصوت طويل جرّب أقصر)'); }
  b.disabled = false;
};
$('fmod').onclick = async e => {
  if (e.target === $('fmod')) return closeM();
  const t = e.target.closest('button'); if (!t || !openId) return;
  try {
    if (t.dataset.pin) await updateDoc(doc(db,'forum_posts',openId), { pinned: !posts.find(x=>x.id===openId).pinned });
    else if (t.dataset.delp) { if (confirm('تمسح السؤال ده؟')) { await deleteDoc(doc(db,'forum_posts',openId)); closeM(); } }
    else if (t.dataset.ver) { const r = reps.find(x=>x.id===t.dataset.ver), v = !r.verified;
      await updateDoc(doc(db,'forum_posts',openId,'replies',r.id), { verified:v });
      await updateDoc(doc(db,'forum_posts',openId), { hasVerified: v || reps.some(x=>x.id!==r.id && x.verified) }); }
    else if (t.dataset.delr) { if (confirm('تمسح الرد ده؟')) { await deleteDoc(doc(db,'forum_posts',openId,'replies',t.dataset.delr)); await updateDoc(doc(db,'forum_posts',openId), { replyCount: increment(-1) }); } }
  } catch(ex){ console.error(ex); alert('العملية مانفعتش.'); }
};