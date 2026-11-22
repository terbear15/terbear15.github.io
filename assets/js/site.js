// Reveal on scroll, active nav, count-up numbers, gallery lightbox.
(function () {
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
  document.querySelectorAll('.reveal').forEach((el) => io.observe(el));

  // Count up
  const fmt = (n, d) => n.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });
  const counter = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      const el = e.target, end = parseFloat(el.dataset.count), dec = (el.dataset.count.split('.')[1] || '').length;
      const suffix = el.dataset.suffix || '', t0 = performance.now(), dur = 1400;
      const step = (t) => {
        const p = Math.min(1, (t - t0) / dur), k = 1 - Math.pow(1 - p, 3);
        el.textContent = fmt(end * k, dec) + suffix;
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
      counter.unobserve(el);
    });
  }, { threshold: 0.6 });
  document.querySelectorAll('[data-count]').forEach((el) => counter.observe(el));

  // Active nav link
  const links = [...document.querySelectorAll('.nav a.link[href^="#"]')];
  if (links.length) {
    const spy = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          links.forEach((l) => l.classList.toggle('active', l.getAttribute('href') === '#' + e.target.id));
        }
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    links.forEach((l) => { const s = document.querySelector(l.getAttribute('href')); if (s) spy.observe(s); });
  }

  // Lightbox
  const lb = document.querySelector('.lightbox');
  if (!lb) return;
  const data = window.GALLERY || {};
  const body = lb.querySelector('.lb-panel');
  const open = (key) => {
    const g = data[key]; if (!g) return;
    body.innerHTML =
      (g.title ? `<div class="lb-head glass"><small>${g.kicker || ''}</small><h3>${g.title}</h3>` +
        (g.meta ? `<div class="meta">${g.meta}</div>` : '') + (g.text ? `<p>${g.text}</p>` : '') +
        (g.link ? `<p style="margin-top:12px"><a class="pill-link" href="${g.link}" target="_blank" rel="noopener">${g.linkText || 'Open'} ↗</a></p>` : '') + `</div>` : '') +
      `<div class="lb-imgs">${g.images.map((s) => `<img src="${s}" alt="${g.title || ''}" loading="lazy">`).join('')}</div>`;
    lb.classList.add('open');
    lb.querySelector('.lb-inner').scrollTop = 0;
    document.body.style.overflow = 'hidden';
    requestAnimationFrame(() => lb.classList.add('show'));
  };
  const close = () => {
    lb.classList.remove('show');
    document.body.style.overflow = '';
    setTimeout(() => lb.classList.remove('open'), 350);
  };
  document.querySelectorAll('[data-gallery]').forEach((el) => {
    el.addEventListener('click', (ev) => { ev.preventDefault(); open(el.dataset.gallery); });
  });
  lb.querySelector('.lb-close').addEventListener('click', close);
  lb.addEventListener('click', (e) => { if (e.target.classList.contains('lb-inner')) close(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });
})();
