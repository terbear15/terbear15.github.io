// Site interactions. No dependencies.
(function () {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const ROOT = document.body.dataset.root || '';

  // ---------- Page transitions ----------
  $$('a[href]').forEach((a) => {
    const href = a.getAttribute('href');
    if (!href || href.startsWith('#') || href.startsWith('mailto:') || a.target === '_blank' || /^https?:/.test(href)) return;
    a.addEventListener('click', (e) => {
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.defaultPrevented || a.classList.contains('side')) return;
      e.preventDefault(); document.body.classList.add('leaving');
      setTimeout(() => (location.href = href), reduce ? 0 : 260);
    });
  });
  addEventListener('pageshow', (e) => { if (e.persisted) document.body.classList.remove('leaving'); });

  // ---------- Progress bar, back to top ----------
  const bar = $('.progress'), top = $('.to-top');
  const onScroll = () => {
    const h = document.documentElement.scrollHeight - innerHeight;
    if (bar) bar.style.transform = `scaleX(${h > 0 ? scrollY / h : 0})`;
    if (top) top.classList.toggle('show', scrollY > innerHeight * .8);
  };
  addEventListener('scroll', onScroll, { passive: true }); onScroll();
  if (top) top.addEventListener('click', () => scrollTo({ top: 0, behavior: 'smooth' }));

  // ---------- Cursor light ----------
  const cl = $('.cursor-light');
  if (cl && matchMedia('(pointer: fine)').matches) {
    let x = 0, y = 0, cx = 0, cy = 0, run = false;
    addEventListener('pointermove', (e) => { x = e.clientX; y = e.clientY; document.body.classList.add('has-pointer'); if (!run) { run = true; requestAnimationFrame(loop); } });
    function loop() { cx += (x - cx) * .12; cy += (y - cy) * .12; cl.style.transform = `translate(${cx - 260}px, ${cy - 260}px)`; if (Math.abs(x - cx) + Math.abs(y - cy) > .5) requestAnimationFrame(loop); else run = false; }
    cl.style.left = '0'; cl.style.top = '0';
  }

  // ---------- Reveal ----------
  const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: .12, rootMargin: '0px 0px -40px 0px' });
  $$('.rv, .rv-line').forEach((el) => io.observe(el));

  // ---------- Signature path lengths ----------
  $$('.sig .draw').forEach((p) => p.style.setProperty('--len', Math.ceil(p.getTotalLength()) + 2));

  // ---------- Count up ----------
  const cio = new IntersectionObserver((es) => es.forEach((e) => {
    if (!e.isIntersecting) return; cio.unobserve(e.target);
    const el = e.target, end = parseFloat(el.dataset.count), dec = (el.dataset.count.split('.')[1] || '').length, pre = el.dataset.pre || '', suf = el.dataset.suf || '';
    const t0 = performance.now(), dur = 1500;
    const f = (t) => { const p = Math.min(1, (t - t0) / dur), k = 1 - Math.pow(1 - p, 4); el.textContent = pre + (end * k).toLocaleString('en-US', { minimumFractionDigits: dec, maximumFractionDigits: dec }) + suf; if (p < 1) requestAnimationFrame(f); };
    requestAnimationFrame(f);
  }), { threshold: .6 });
  $$('[data-count]').forEach((el) => cio.observe(el));

  // ---------- Footer observation ----------
  const obs = $('#obs');
  if (obs) {
    const facts = [
      'St. Louis has 3.3 acres of surface parking for every 1,000 downtown jobs.',
      'Surface parking covers 20% of downtown Albuquerque, the highest share of 50 U.S. downtowns.',
      'Across 50 U.S. downtowns, 5,407 acres are surface parking lots.',
      'At 5 PM, 79% of what moved through Walnut & 37th Street was on foot.',
      'Raising the discount rate from 4% to 6% turned a road project’s NPV from +$31.3M to −$10.7M.',
      'An 800,000 sq ft office adds about 1,000 peak-hour car trips to a city centre.',
      'A shaded walking route is often only a minute longer than the fastest one.'
    ];
    obs.textContent = facts[Math.floor(Math.random() * facts.length)];
  }

  // ---------- Featured wheel ----------
  const wheel = $('.wheel');
  if (wheel) {
    const items = $$('.w-item', wheel), n = items.length, dots = $('.wheel-ui', wheel);
    let cur = 0, hoverT = null, auto = null, paused = false;
    items.forEach((_, i) => { const b = document.createElement('button'); b.setAttribute('aria-label', 'Show item ' + (i + 1)); b.onclick = () => go(i); dots.appendChild(b); });
    const off = (i) => { let k = (i - cur) % n; if (k > n / 2) k -= n; if (k < -n / 2) k += n; return k; };
    function layout() {
      const H = wheel.clientHeight, gap = Math.min(170, H * .27);
      items.forEach((el, i) => {
        const k = off(i), a = Math.abs(k);
        const vis = a <= 2;
        el.style.transform = `translate(-50%, -50%) translateY(${k * gap}px) translateZ(${-a * 160}px) rotateX(${-k * 16}deg) scale(${1 - a * .14})`;
        el.style.opacity = vis ? (a === 0 ? 1 : a === 1 ? .5 : .16) : 0;
        el.style.zIndex = 10 - a; el.style.pointerEvents = vis ? 'auto' : 'none';
        el.style.filter = a ? `blur(${a * .6}px) saturate(.6)` : 'none';
        el.classList.toggle('side', a !== 0);
        const v = $('video', el); if (v) { if (a === 0) v.play().catch(() => {}); else v.pause(); }
      });
      $$('button', dots).forEach((b, i) => b.classList.toggle('on', i === cur));
    }
    function go(i) { cur = (i + n) % n; layout(); }
    items.forEach((el, i) => {
      el.addEventListener('mouseenter', () => { paused = true; if (off(i) !== 0) { clearTimeout(hoverT); hoverT = setTimeout(() => go(i), 180); } });
      el.addEventListener('mouseleave', () => { paused = false; clearTimeout(hoverT); });
      el.addEventListener('click', (e) => { if (off(i) !== 0) { e.preventDefault(); go(i); } });
    });
    let wl = 0;
    wheel.addEventListener('wheel', (e) => { const now = Date.now(); if (Math.abs(e.deltaY) < 8) return; e.preventDefault(); if (now - wl < 650) return; wl = now; go(cur + (e.deltaY > 0 ? 1 : -1)); }, { passive: false });
    if (!reduce) auto = setInterval(() => { if (!paused && !document.hidden) go(cur + 1); }, 5200);
    addEventListener('resize', layout); layout();
  }

  // ---------- Segmented filter ----------
  const seg = $('.seg');
  if (seg) {
    const pill = $('.pill', seg), btns = $$('button', seg), count = $('.filter-bar .count');
    const place = (b) => { pill.style.left = b.offsetLeft + 'px'; pill.style.width = b.offsetWidth + 'px'; };
    const apply = (tag) => {
      let shown = 0;
      $$('[data-tags]').forEach((el) => { const ok = tag === 'all' || el.dataset.tags.split(' ').includes(tag); el.classList.toggle('hide', !ok); if (ok && el.dataset.count !== 'no') shown++; });
      if (count) count.textContent = shown + (shown === 1 ? ' project' : ' projects');
      $$('.rv').forEach((el) => el.classList.add('in'));
    };
    btns.forEach((b) => b.addEventListener('click', () => { btns.forEach((x) => x.classList.toggle('on', x === b)); place(b); apply(b.dataset.f); }));
    const first = btns.find((b) => b.classList.contains('on')) || btns[0];
    requestAnimationFrame(() => place(first)); addEventListener('resize', () => place(btns.find((b) => b.classList.contains('on'))));
    apply(first.dataset.f);
  }

  // ---------- Lightbox for single images (groups via data-group) ----------
  const lb = $('.lb');
  if (lb) {
    const img = $('img', lb), cap = $('.lb-cap', lb);
    let group = [], gi = 0;
    const show = () => { const el = group[gi]; img.src = el.dataset.full || $('img', el).src; cap.textContent = el.dataset.cap || ''; };
    $$('[data-lb]').forEach((el) => el.addEventListener('click', () => {
      group = $$(`[data-lb="${el.dataset.lb}"]`); gi = group.indexOf(el); show(); lb.classList.add('open'); document.body.style.overflow = 'hidden';
    }));
    const close = () => { lb.classList.remove('open'); document.body.style.overflow = ''; };
    $('.lb-close', lb).onclick = close;
    $('.lb-nav.p', lb).onclick = () => { gi = (gi - 1 + group.length) % group.length; show(); };
    $('.lb-nav.n', lb).onclick = () => { gi = (gi + 1) % group.length; show(); };
    lb.addEventListener('click', (e) => { if (e.target === lb) close(); });
    addEventListener('keydown', (e) => { if (!lb.classList.contains('open')) return; if (e.key === 'Escape') close(); if (e.key === 'ArrowRight') $('.lb-nav.n', lb).click(); if (e.key === 'ArrowLeft') $('.lb-nav.p', lb).click(); });
  }

  // ---------- Before / after slider ----------
  $$('.compare').forEach((c) => {
    const set = (x) => { const r = c.getBoundingClientRect(); c.style.setProperty('--x', Math.max(0, Math.min(100, (x - r.left) / r.width * 100)) + '%'); };
    let on = false;
    c.addEventListener('pointerdown', (e) => { on = true; c.setPointerCapture(e.pointerId); set(e.clientX); });
    c.addEventListener('pointermove', (e) => { if (on) set(e.clientX); });
    c.addEventListener('pointerup', () => (on = false));
  });

  // ---------- Case-study TOC highlight ----------
  const toc = $$('.toc a');
  if (toc.length) {
    const tio = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) toc.forEach((a) => a.classList.toggle('on', a.getAttribute('href') === '#' + e.target.id)); }), { rootMargin: '-30% 0px -60% 0px' });
    toc.forEach((a) => { const s = $(a.getAttribute('href')); if (s) tio.observe(s); });
  }

  // ---------- Click-to-load embeds ----------
  $$('[data-embed]').forEach((el) => el.addEventListener('click', () => {
    const f = document.createElement('iframe'); f.src = el.dataset.embed; f.loading = 'lazy'; f.allow = 'fullscreen';
    f.style.cssText = 'width:100%;aspect-ratio:16/10;border:0;display:block;background:#0d0e10';
    el.replaceWith(f);
  }));

  // ---------- Flipbook ----------
  const book = $('.book');
  if (book && window.BOOKS) {
    const spread = $('.spread', book), pg = $('.pg', spread), cnt = $('.cnt', book), title = $('.t', book), dots = $('.book-bottom', book);
    let pages = [], i = 0, busy = false, key = '';
    const src = (p, hi) => `${ROOT}assets/arch/${key}/${String(p + 1).padStart(2, '0')}${hi ? '' : '-s'}.webp`;
    const zsrc = (p) => `${ROOT}assets/arch/${key}/${String(p + 1).padStart(2, '0')}-z.webp`;
    const pre = (p) => { if (p >= 0 && p < pages.length) { const im = new Image(); im.src = src(p); } };
    function paint() {
      pg.style.backgroundImage = `url(${src(i)}), url(${src(i, false)})`;
      cnt.textContent = `${String(i + 1).padStart(2, '0')} / ${String(pages.length).padStart(2, '0')}`;
      $$('button', dots).forEach((b, k) => b.classList.toggle('on', k === i));
      pre(i + 1); pre(i - 1);
    }
    function open(k, start = 0) {
      const B = window.BOOKS[k]; if (!B) return; key = k; pages = Array.from({ length: B.n }); i = start;
      title.innerHTML = `<b>${B.title}</b>${B.sub || ''}`;
      dots.innerHTML = ''; pages.forEach((_, j) => { const b = document.createElement('button'); b.setAttribute('aria-label', 'Page ' + (j + 1)); b.onclick = () => jump(j); dots.appendChild(b); });
      paint(); book.classList.add('open'); document.body.style.overflow = 'hidden';
      history.replaceState(null, '', '#' + k);
    }
    function close() { book.classList.remove('open'); document.body.style.overflow = ''; history.replaceState(null, '', location.pathname); }
    function turn(dir) {
      const j = i + dir; if (busy || j < 0 || j >= pages.length) return;
      if (reduce) { i = j; paint(); return; }
      busy = true;
      const leaf = document.createElement('div'); leaf.className = 'leaf ' + (dir > 0 ? 'fwd' : 'back');
      const fr = document.createElement('div'), bk = document.createElement('div'), sh = document.createElement('div');
      fr.className = 'face front'; bk.className = 'face backf'; sh.className = 'shade';
      fr.style.backgroundImage = `url(${src(i)}), url(${src(i, false)})`; bk.style.backgroundImage = `url(${src(j)}), url(${src(j, false)})`;
      leaf.append(fr, bk); spread.appendChild(leaf);
      // under the leaf: the destination's half that the leaf uncovers
      const under = document.createElement('div'); under.className = 'pg';
      under.style.cssText = `background-image:url(${src(j)}),url(${src(j, false)});clip-path:${dir > 0 ? 'inset(0 0 0 50%)' : 'inset(0 50% 0 0)'};z-index:3`;
      spread.insertBefore(under, leaf);
      requestAnimationFrame(() => leaf.classList.add('go'));
      setTimeout(() => { i = j; paint(); leaf.remove(); under.remove(); busy = false; }, 920);
    }
    function jump(j) { if (j === i) return; i = j; paint(); }
    $$('[data-book]').forEach((el) => el.addEventListener('click', (e) => { e.preventDefault(); open(el.dataset.book); }));
    $('.hot.r', book).onclick = () => turn(1);
    $('.hot.l', book).onclick = () => turn(-1);
    $('.b-close', book).onclick = close;
    $('.b-zoom', book).onclick = () => zoomOpen(zsrc(i));
    spread.addEventListener('dblclick', () => zoomOpen(zsrc(i)));
    addEventListener('keydown', (e) => {
      if (!book.classList.contains('open') || zoom.classList.contains('open')) return;
      if (e.key === 'ArrowRight' || e.key === ' ') { e.preventDefault(); turn(1); }
      if (e.key === 'ArrowLeft') turn(-1);
      if (e.key === 'Escape') close();
    });
    let sx = null; spread.addEventListener('touchstart', (e) => (sx = e.touches[0].clientX), { passive: true });
    spread.addEventListener('touchend', (e) => { if (sx === null) return; const dx = e.changedTouches[0].clientX - sx; if (Math.abs(dx) > 40) turn(dx < 0 ? 1 : -1); sx = null; });
    const h = location.hash.slice(1); if (h && window.BOOKS[h]) setTimeout(() => open(h), 300);

    // ---------- Zoom viewer: full-resolution spread, wheel to zoom, drag to pan ----------
    const zoom = $('.zoom'), zimg = $('img', zoom);
    let s = 1, tx = 0, ty = 0, drag = null;
    const apply = () => (zimg.style.transform = `translate(${tx}px, ${ty}px) scale(${s})`);
    function fit() { const k = Math.min(innerWidth / zimg.naturalWidth, innerHeight / zimg.naturalHeight); s = k; tx = (innerWidth - zimg.naturalWidth * k) / 2; ty = (innerHeight - zimg.naturalHeight * k) / 2; apply(); }
    function zoomOpen(u) { zimg.onload = fit; zimg.src = u; zoom.classList.add('open'); if (zimg.complete && zimg.naturalWidth) fit(); }
    function zoomAt(f, cx, cy) { const ns = Math.max(.2, Math.min(4, s * f)); tx = cx - (cx - tx) * ns / s; ty = cy - (cy - ty) * ns / s; s = ns; apply(); }
    zoom.addEventListener('wheel', (e) => { e.preventDefault(); zoomAt(e.deltaY < 0 ? 1.12 : 1 / 1.12, e.clientX, e.clientY); }, { passive: false });
    zoom.addEventListener('dblclick', (e) => zoomAt(s < 1 ? 1 / s : 1 / 2, e.clientX, e.clientY));
    zoom.addEventListener('pointerdown', (e) => { if (e.target.closest('.z-ui')) return; drag = [e.clientX - tx, e.clientY - ty]; zoom.setPointerCapture(e.pointerId); zoom.style.cursor = 'grabbing'; });
    zoom.addEventListener('pointermove', (e) => { if (drag) { tx = e.clientX - drag[0]; ty = e.clientY - drag[1]; apply(); } });
    zoom.addEventListener('pointerup', () => { drag = null; zoom.style.cursor = ''; });
    $('.z-close', zoom).onclick = () => zoom.classList.remove('open');
    $('.z-in', zoom).onclick = () => zoomAt(1.4, innerWidth / 2, innerHeight / 2);
    $('.z-out', zoom).onclick = () => zoomAt(1 / 1.4, innerWidth / 2, innerHeight / 2);
    addEventListener('keydown', (e) => { if (zoom.classList.contains('open') && e.key === 'Escape') zoom.classList.remove('open'); });
  }

  // ---------- Videos: play only when visible ----------
  const vio = new IntersectionObserver((es) => es.forEach((e) => { const v = e.target; if (v.closest('.w-item')) return; if (e.isIntersecting) v.play().catch(() => {}); else v.pause(); }), { threshold: .25 });
  $$('video[data-auto]').forEach((v) => vio.observe(v));
})();
