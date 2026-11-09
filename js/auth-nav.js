import { auth } from "./firebase.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";

/* يستبدل (تسجيل الدخول / حساب جديد) بأيقونة اليوزر لو الطالب مسجّل دخول */
const nav = document.querySelector('.acct');
if (nav) {
  nav.style.visibility = 'hidden';           // عشان ميظهرش وميختفيش فجأة

  const st = document.createElement('style');
  st.textContent = `
    .uicon{display:inline-flex;align-items:center;justify-content:center;width:44px;height:44px;border-radius:50%;
      background:#F2A900;color:#17255E;transition:transform .2s,box-shadow .2s}
    .uicon:hover{transform:translateY(-2px);box-shadow:0 6px 16px rgba(0,0,0,.2)}
    .uicon svg{width:22px;height:22px;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}`;
  document.head.appendChild(st);

  onAuthStateChanged(auth, user => {
    if (user) {
      nav.innerHTML = `<a href="profile.html" class="uicon" aria-label="حسابي" title="حسابي">
        <svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7"/></svg></a>`;
    }
    nav.style.visibility = 'visible';
  });
}
