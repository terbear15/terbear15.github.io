// Background: faint topographic contours with a slow moving glow,
// plus city plans (parking lots from real downtowns) fading in and out.
(function () {
  const host = document.querySelector('.bg');
  if (!host) return;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const DPR = Math.min(window.devicePixelRatio || 1, 2);
  const mk = (cls) => { const c = document.createElement('canvas'); if (cls) c.className = cls; host.appendChild(c); return c; };
  const base = mk(''), glow = mk('glow');
  const usePlans = host.dataset.plans !== 'off';
  const planA = usePlans ? mk('plan') : null, planB = usePlans ? mk('plan') : null;

  // --- smooth value noise ---
  const seed = 7.31;
  const hash = (x, y) => { const s = Math.sin(x * 127.1 + y * 311.7 + seed) * 43758.5453; return s - Math.floor(s); };
  const sm = (t) => t * t * (3 - 2 * t);
  const noise = (x, y) => {
    const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
    const a = hash(xi, yi), b = hash(xi + 1, yi), c = hash(xi, yi + 1), d = hash(xi + 1, yi + 1);
    const u = sm(xf), v = sm(yf);
    return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
  };
  const field = (x, y) => noise(x, y) * .6 + noise(x * 2.1 + 5, y * 2.1 + 3) * .28 + noise(x * 4.3 + 11, y * 4.3 + 7) * .12;

  function contours(ctx, w, h, stroke, width, blur) {
    const step = 14, cols = Math.ceil(w / step) + 1, rows = Math.ceil(h / step) + 1, sc = 0.0042;
    const v = new Float32Array(cols * rows);
    for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) v[j * cols + i] = field(i * step * sc, j * step * sc);
    ctx.clearRect(0, 0, w, h);
    ctx.strokeStyle = stroke; ctx.lineWidth = width;
    if (blur) { ctx.shadowColor = 'rgba(190,215,255,.9)'; ctx.shadowBlur = blur; }
    const levels = 16;
    ctx.beginPath();
    for (let L = 1; L < levels; L++) {
      const t = L / levels;
      for (let j = 0; j < rows - 1; j++) for (let i = 0; i < cols - 1; i++) {
        const a = v[j * cols + i], b = v[j * cols + i + 1], c = v[(j + 1) * cols + i + 1], d = v[(j + 1) * cols + i];
        const idx = (a > t) | ((b > t) << 1) | ((c > t) << 2) | ((d > t) << 3);
        if (idx === 0 || idx === 15) continue;
        const x = i * step, y = j * step;
        const lerp = (p, q) => (t - p) / (q - p);
        const T = [x + step * lerp(a, b), y], R = [x + step, y + step * lerp(b, c)];
        const B = [x + step * lerp(d, c), y + step], Lp = [x, y + step * lerp(a, d)];
        const seg = (p, q) => { ctx.moveTo(p[0], p[1]); ctx.lineTo(q[0], q[1]); };
        switch (idx) {
          case 1: case 14: seg(Lp, T); break; case 2: case 13: seg(T, R); break;
          case 3: case 12: seg(Lp, R); break; case 4: case 11: seg(R, B); break;
          case 5: seg(Lp, T); seg(R, B); break; case 6: case 9: seg(T, B); break;
          case 7: case 8: seg(Lp, B); break; case 10: seg(T, R); seg(Lp, B); break;
        }
      }
    }
    ctx.stroke(); ctx.shadowBlur = 0;
  }

  let W = 0, H = 0;
  function size(c) { c.width = W * DPR; c.height = H * DPR; const x = c.getContext('2d'); x.setTransform(DPR, 0, 0, DPR, 0, 0); return x; }
  function draw() {
    W = innerWidth; H = innerHeight;
    contours(size(base), W, H, 'rgba(210,220,235,.075)', 1, 0);
    contours(size(glow), W, H, 'rgba(220,235,255,.34)', 1, 5);
    if (usePlans) { size(planA); size(planB); }
  }

  // --- city plans ---
  let plans = null, pi = 0, flip = false;
  function drawPlan(cv, p) {
    const ctx = cv.getContext('2d'); ctx.clearRect(0, 0, W, H);
    const s = Math.min(W, H) * 0.86, ox = W - s * (W > 900 ? 0.92 : 0.8), oy = (H - s) / 2 + H * .04;
    ctx.save(); ctx.translate(ox, oy);
    ctx.strokeStyle = 'rgba(220,228,240,.16)'; ctx.lineWidth = 1;
    for (const o of p.outline) { ctx.beginPath(); o.forEach((q, k) => k ? ctx.lineTo(q[0] * s, q[1] * s) : ctx.moveTo(q[0] * s, q[1] * s)); ctx.closePath(); ctx.stroke(); }
    ctx.fillStyle = 'rgba(220,230,245,.07)'; ctx.strokeStyle = 'rgba(220,230,245,.12)'; ctx.lineWidth = .6;
    for (const l of p.lots) { ctx.beginPath(); l.forEach((q, k) => k ? ctx.lineTo(q[0] * s, q[1] * s) : ctx.moveTo(q[0] * s, q[1] * s)); ctx.closePath(); ctx.fill(); ctx.stroke(); }
    ctx.restore();
  }
  function cycle() {
    if (!plans || document.hidden) return;
    const on = flip ? planA : planB, off = flip ? planB : planA;
    drawPlan(on, plans[pi % plans.length]); pi++;
    on.classList.add('on'); off.classList.remove('on'); flip = !flip;
  }
  if (usePlans) {
    const src = host.dataset.src || 'assets/data/city-plans.json';
    fetch(src).then(r => r.json()).then(d => { plans = d.sort(() => Math.random() - .5); cycle(); if (!reduce) setInterval(cycle, 7000); }).catch(() => {});
  }

  // --- moving glow ---
  let t0 = performance.now(), last = 0;
  function tick(t) {
    if (t - last > 33) {
      const k = (t - t0) / 1000;
      host.style.setProperty('--gx', (50 + 34 * Math.sin(k * .07) + 8 * Math.sin(k * .23)) + '%');
      host.style.setProperty('--gy', (45 + 28 * Math.cos(k * .053) + 6 * Math.sin(k * .17)) + '%');
      last = t;
    }
    requestAnimationFrame(tick);
  }
  draw(); if (!reduce) requestAnimationFrame(tick);
  let rt; addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(() => { draw(); if (plans) { flip = !flip; pi--; cycle(); } }, 250); });
})();
