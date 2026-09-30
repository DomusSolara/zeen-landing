/* ZEEN core site. Vanilla, no dependencies. */
(() => {
'use strict';
const $  = (s, c = document) => c.querySelector(s);
const $$ = (s, c = document) => [...c.querySelectorAll(s)];
const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ── reveals ─────────────────────────────────────────────── */
const revealed = new WeakSet();
const rvObs = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (!e.isIntersecting || revealed.has(e.target)) return;
    revealed.add(e.target);
    e.target.classList.add('on');
    if (e.target.matches('[data-count]') || $('[data-count]', e.target)) countUp(e.target);
  });
}, { threshold: .18, rootMargin: '0px 0px -8% 0px' });
$$('.rv').forEach(el => rvObs.observe(el));

/* ── number count up ─────────────────────────────────────── */
function countUp(scope) {
  $$('[data-count]', scope).concat(scope.matches?.('[data-count]') ? [scope] : []).forEach(el => {
    const target = parseFloat(el.dataset.count);
    const suffix = el.dataset.suffix || '';
    const decimals = (el.dataset.count.split('.')[1] || '').length;
    if (REDUCED) { el.textContent = target.toFixed(decimals) + suffix; return; }
    const dur = 1500, t0 = performance.now();
    (function step(now) {
      const p = Math.min(1, (now - t0) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = (target * eased).toFixed(decimals) + suffix;
      if (p < 1) requestAnimationFrame(step);
    })(t0);
  });
}

/* ── header + progress ───────────────────────────────────── */
const hd = $('#hd'), prog = $('#prog');
const onScroll = () => {
  const y = scrollY;
  hd.classList.toggle('stuck', y > 40);
  const max = document.documentElement.scrollHeight - innerHeight;
  prog.style.width = `${max > 0 ? (y / max) * 100 : 0}%`;
  markRail(y);
};
addEventListener('scroll', onScroll, { passive: true });

/* ── section rail ────────────────────────────────────────── */
const sections = $$('[data-rail]');
const rail = $('#rail');
const dots = sections.map(sec => {
  const b = document.createElement('button');
  b.dataset.t = sec.dataset.rail;
  b.setAttribute('aria-label', sec.dataset.rail);
  b.addEventListener('click', () => sec.scrollIntoView({ behavior: REDUCED ? 'auto' : 'smooth' }));
  rail.appendChild(b);
  return b;
});
function markRail(y) {
  let active = -1;
  sections.forEach((sec, i) => { if (sec.offsetTop <= y + innerHeight * .42) active = i; });
  dots.forEach((d, i) => d.classList.toggle('on', i === active));
}


/* ── hero constellation field ────────────────────────────── */
const cv = $('#field');
if (cv && !REDUCED) {
  const ctx = cv.getContext('2d');
  let W, H, pts = [], mx = 0, my = 0;
  const size = () => {
    const r = Math.min(devicePixelRatio || 1, 2);
    W = cv.width = cv.offsetWidth * r;
    H = cv.height = cv.offsetHeight * r;
    ctx.scale(1, 1);
    const count = Math.min(62, Math.round(cv.offsetWidth / 22));
    pts = Array.from({ length: count }, () => ({
      x: Math.random() * W, y: Math.random() * H,
      vx: (Math.random() - .5) * .16 * r, vy: (Math.random() - .5) * .16 * r,
      r: (Math.random() * 1.5 + .5) * r,
    }));
    LINK = 150 * r;
  };
  let LINK = 150;
  size();
  addEventListener('resize', size);
  addEventListener('pointermove', e => { mx = (e.clientX / innerWidth - .5) * 16; my = (e.clientY / innerHeight - .5) * 16; }, { passive: true });
  let running = true;
  new IntersectionObserver(([e]) => { running = e.isIntersecting; if (running) draw(); }, { threshold: 0 }).observe(cv);
  function draw() {
    if (!running) return;
    ctx.clearRect(0, 0, W, H);
    ctx.save();
    ctx.translate(mx, my);
    for (let i = 0; i < pts.length; i++) {
      const p = pts[i];
      p.x += p.vx; p.y += p.vy;
      if (p.x < 0 || p.x > W) p.vx *= -1;
      if (p.y < 0 || p.y > H) p.vy *= -1;
      for (let j = i + 1; j < pts.length; j++) {
        const q = pts[j], dx = p.x - q.x, dy = p.y - q.y;
        const d = Math.hypot(dx, dy);
        if (d < LINK) {
          ctx.strokeStyle = `rgba(212,175,122,${(1 - d / LINK) * .16})`;
          ctx.lineWidth = 1;
          ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y); ctx.stroke();
        }
      }
      ctx.fillStyle = 'rgba(212,175,122,.5)';
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.283); ctx.fill();
    }
    ctx.restore();
    requestAnimationFrame(draw);
  }
  draw();
}


/* ── subtle image parallax ───────────────────────────────── */
if (!REDUCED) {
  const shots = $$('.shot.wide img, .blk .bg.fade img');
  let ticking = false;
  addEventListener('scroll', () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      shots.forEach(img => {
        const r = img.getBoundingClientRect();
        if (r.bottom < 0 || r.top > innerHeight) return;
        const p = (r.top + r.height / 2 - innerHeight / 2) / innerHeight;
        img.style.transform = `translate3d(0, ${(-p * 22).toFixed(2)}px, 0) scale(1.06)`;
      });
      ticking = false;
    });
  }, { passive: true });
}

onScroll();
})();
