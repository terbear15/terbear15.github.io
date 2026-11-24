// Background: pure topographic contours, drawn once as smooth curves.
// A soft, slow "breathing" glow is a CSS opacity animation on a second layer,
// so nothing is redrawn per frame (no flicker).
(function () {
  const host = document.querySelector('.bg');
  if (!host) return;
  const DPR = Math.min(window.devicePixelRatio || 1, 2);
  const mk = (cls) => { const c = document.createElement('canvas'); if (cls) c.className = cls; host.appendChild(c); return c; };
  const base = mk(''), glow = mk('glow');

  // smooth value noise (fixed seed so every page shares the same terrain)
  const hash = (x, y) => { const s = Math.sin(x * 127.1 + y * 311.7 + 7.31) * 43758.5453; return s - Math.floor(s); };
  const sm = (t) => t * t * t * (t * (t * 6 - 15) + 10);
  const noise = (x, y) => {
    const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
    const a = hash(xi, yi), b = hash(xi + 1, yi), c = hash(xi, yi + 1), d = hash(xi + 1, yi + 1);
    const u = sm(xf), v = sm(yf);
    return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
  };
  const field = (x, y) => noise(x, y) * .66 + noise(x * 1.9 + 5.2, y * 1.9 + 3.1) * .26 + noise(x * 3.7 + 11, y * 3.7 + 7) * .08;

  // Marching squares -> segments keyed by grid edge -> chained polylines
  function contourPaths(w, h) {
    const step = 9, cols = Math.ceil(w / step) + 2, rows = Math.ceil(h / step) + 2, sc = 0.0032;
    const v = new Float32Array(cols * rows);
    for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) v[j * cols + i] = field(i * step * sc, j * step * sc);
    const paths = [];
    const levels = 14;
    for (let L = 1; L < levels; L++) {
      const t = 0.18 + 0.64 * L / levels;
      const pts = new Map(), adj = new Map();
      const key = (i, j, o) => (o ? 'v' : 'h') + i + ',' + j;
      const pt = (k, x, y) => { if (!pts.has(k)) pts.set(k, [x, y]); };
      const link = (a, b) => { (adj.get(a) || adj.set(a, []).get(a)).push(b); (adj.get(b) || adj.set(b, []).get(b)).push(a); };
      for (let j = 0; j < rows - 1; j++) for (let i = 0; i < cols - 1; i++) {
        const a = v[j * cols + i], b = v[j * cols + i + 1], c = v[(j + 1) * cols + i + 1], d = v[(j + 1) * cols + i];
        const idx = (a > t) | ((b > t) << 1) | ((c > t) << 2) | ((d > t) << 3);
        if (idx === 0 || idx === 15) continue;
        const x = i * step, y = j * step, f = (p, q) => (t - p) / (q - p);
        const T = key(i, j, 0), B = key(i, j + 1, 0), Lk = key(i, j, 1), R = key(i + 1, j, 1);
        pt(T, x + step * f(a, b), y); pt(B, x + step * f(d, c), y + step);
        pt(Lk, x, y + step * f(a, d)); pt(R, x + step, y + step * f(b, c));
        switch (idx) {
          case 1: case 14: link(Lk, T); break; case 2: case 13: link(T, R); break;
          case 3: case 12: link(Lk, R); break; case 4: case 11: link(R, B); break;
          case 5: link(Lk, T); link(R, B); break; case 6: case 9: link(T, B); break;
          case 7: case 8: link(Lk, B); break; case 10: link(T, R); link(Lk, B); break;
        }
      }
      const seen = new Set();
      const walk = (s) => {
        const line = []; let cur = s;
        while (cur !== undefined && !seen.has(cur)) {
          seen.add(cur); line.push(pts.get(cur));
          cur = adj.get(cur).find((n) => !seen.has(n));
        }
        // close loops
        if (line.length > 2 && adj.get(s).length === 2) line.push(pts.get(s));
        if (line.length > 6) paths.push(line);
      };
      for (const k of adj.keys()) if (adj.get(k).length === 1 && !seen.has(k)) walk(k); // open chains first
      for (const k of adj.keys()) if (!seen.has(k)) walk(k);                              // then closed loops
    }
    return paths;
  }

  function stroke(ctx, paths, style, width) {
    ctx.strokeStyle = style; ctx.lineWidth = width; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    ctx.beginPath();
    for (const p of paths) {
      // light smoothing (Chaikin) then quadratic curves through midpoints
      let q = p;
      for (let r = 0; r < 2; r++) {
        const o = [q[0]];
        for (let k = 0; k < q.length - 1; k++) {
          const [x0, y0] = q[k], [x1, y1] = q[k + 1];
          o.push([x0 * .75 + x1 * .25, y0 * .75 + y1 * .25], [x0 * .25 + x1 * .75, y0 * .25 + y1 * .75]);
        }
        o.push(q[q.length - 1]); q = o;
      }
      ctx.moveTo(q[0][0], q[0][1]);
      for (let k = 1; k < q.length - 1; k++) {
        const mx = (q[k][0] + q[k + 1][0]) / 2, my = (q[k][1] + q[k + 1][1]) / 2;
        ctx.quadraticCurveTo(q[k][0], q[k][1], mx, my);
      }
      ctx.lineTo(q[q.length - 1][0], q[q.length - 1][1]);
    }
    ctx.stroke();
  }

  let W = 0, H = 0;
  function size(c) { c.width = W * DPR; c.height = H * DPR; const x = c.getContext('2d'); x.setTransform(DPR, 0, 0, DPR, 0, 0); return x; }
  function draw() {
    // Draw once at a fixed, generous size so resizing or mobile URL-bar changes never re-shuffle lines.
    W = Math.max(innerWidth, 1280); H = Math.max(innerHeight, 800);
    const paths = contourPaths(W, H);
    stroke(size(base), paths, 'rgba(214,222,234,.085)', 1);
    const g = size(glow); g.shadowColor = 'rgba(200,222,255,.8)'; g.shadowBlur = 8;
    stroke(g, paths, 'rgba(225,236,255,.22)', 1);
  }
  draw();
  let rw = innerWidth, rt;
  addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(() => { if (Math.abs(innerWidth - rw) > 200) { rw = innerWidth; draw(); } }, 300); });
})();
