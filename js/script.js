const hd = document.getElementById('top');
  const onScroll = () => hd.classList.toggle('solid', scrollY > 40);
  addEventListener('scroll', onScroll); onScroll();

  const s = document.getElementById('srch'), q = document.getElementById('q');
  document.getElementById('sb').addEventListener('click', () => {
    s.classList.toggle('open'); if (s.classList.contains('open')) q.focus();
  });
  const cards = [...document.querySelectorAll('.card')], none = document.getElementById('none');
  q.addEventListener('input', () => {
    const t = q.value.trim(); let n = 0;
    cards.forEach(c => { const hit = !t || c.textContent.includes(t); c.style.display = hit ? '' : 'none'; n += hit; });
    none.style.display = n ? 'none' : 'block';
    if (t) document.getElementById('courses').scrollIntoView({behavior:'smooth'});
  });

  /* carousel */
  const track = document.getElementById('track'), dots = document.getElementById('dots');
  const nx = document.getElementById('cnext'), pv = document.getElementById('cprev');
  const step = () => (cards[0] ? cards[0].offsetWidth + 24 : 300);
  const visible = () => cards.filter(c => c.style.display !== 'none');
  function sync() {
    const max = track.scrollWidth - track.clientWidth - 2, pos = Math.abs(track.scrollLeft);
    pv.disabled = pos < 2; nx.disabled = pos >= max;
    const n = Math.max(1, Math.ceil(visible().length - track.clientWidth / step() + 1));
    if (dots.children.length !== n) dots.innerHTML = '<i></i>'.repeat(n);
    const idx = Math.min(n - 1, Math.round(pos / step()));
    [...dots.children].forEach((d, i) => d.classList.toggle('on', i === idx));
  }
  nx.addEventListener('click', () => track.scrollBy({left: -step(), behavior: 'smooth'}));
  pv.addEventListener('click', () => track.scrollBy({left: step(), behavior: 'smooth'}));
  track.addEventListener('scroll', sync); addEventListener('resize', sync);
  q.addEventListener('input', () => setTimeout(sync, 0)); sync();



  