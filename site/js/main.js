/* HOBBYTAN AI — scroll-driven scenes, guide star, canvases. No dependencies. */
(() => {
'use strict';

/* ================= utils ================= */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const seg = (p, a, b) => clamp((p - a) / (b - a));
const lerp = (a, b, t) => a + (b - a) * t;
const eio = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
const eo = t => 1 - Math.pow(1 - t, 3);
const REDUCE = matchMedia('(prefers-reduced-motion: reduce)').matches;
let VW = innerWidth, VH = innerHeight;

function makeCanvas(el) {
  const c = { el, ctx: el.getContext('2d'), W: 0, H: 0 };
  c.fit = () => {
    const dpr = Math.min(devicePixelRatio || 1, 2), w = el.clientWidth, h = el.clientHeight;
    if (w === c.W && h === c.H) return false;
    c.W = w; c.H = h; el.width = w * dpr; el.height = h * dpr;
    c.ctx.setTransform(dpr, 0, 0, dpr, 0, 0); return true;
  };
  c.fit(); return c;
}
function glow(ctx, x, y, r, a) {
  if (a <= 0) return;
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, `rgba(255,255,255,${a})`); g.addColorStop(.22, `rgba(220,232,255,${a * .38})`); g.addColorStop(1, 'rgba(190,210,255,0)');
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill();
  ctx.fillStyle = `rgba(255,255,255,${a})`; ctx.beginPath(); ctx.arc(x, y, Math.max(1.6, r * .085), 0, 7); ctx.fill();
}
const visible = el => { const r = el.getBoundingClientRect(); return r.bottom > -50 && r.top < VH + 50; };

/* pinned-section progress, smoothed (lenis-like feel without hijacking scroll) */
function scene(el) {
  const s = { el, p: 0, target: 0 };
  s.read = () => { const r = el.getBoundingClientRect(), span = r.height - VH; s.target = span > 0 ? clamp(-r.top / span) : 0; };
  s.step = () => { s.p += (s.target - s.p) * (REDUCE ? 1 : .1); if (Math.abs(s.target - s.p) < 1e-4) s.p = s.target; };
  return s;
}

/* ================= nav ================= */
const nav = $('#nav'), burger = $('#burger');
burger.addEventListener('click', () => {
  const open = nav.classList.toggle('open'); burger.setAttribute('aria-expanded', open);
});
$$('#mmenu a').forEach(a => a.addEventListener('click', () => { nav.classList.remove('open'); burger.setAttribute('aria-expanded', false); }));

/* ================= reveal + counters ================= */
function countUp(el) {
  const to = +el.dataset.count, em = el.querySelector('em'), t0 = performance.now(), dur = 1600;
  const tick = now => {
    const k = eo(clamp((now - t0) / dur)), v = Math.round(to * k).toLocaleString('ko-KR');
    el.firstChild.nodeType === 3 ? (el.firstChild.nodeValue = v) : el.prepend(v);
    if (k < 1) requestAnimationFrame(tick);
  };
  if (!em && el.firstChild?.nodeType !== 3) el.textContent = '0';
  requestAnimationFrame(tick);
}
/* checked from the main loop (robust to jump-scrolls and anchor links) */
let pendingReveal = $$('.rv, .chat p, .bento, .tcard');
function checkReveal() {
  if (!pendingReveal.length) return;
  pendingReveal = pendingReveal.filter(el => {
    const r = el.getBoundingClientRect();
    if (r.top < VH * .9 && r.bottom > 0) {
      el.classList.add('in');
      $$('[data-count]', el).forEach(countUp);
      return false;
    }
    return true;
  });
}

/* ================= SCENE A · hero → star → radar → warp ================= */
const A = (() => {
  const sc = scene($('[data-scene="A"]')), cv = makeCanvas($('#cvA')), ctx = cv.ctx;
  const L = { hero: $('#A-hero'), words: $('#A-words'), warp: $('#A-warp') };
  const words = $$('#A-words span, #A-words .dot');
  const cursor = $('#heroCursor'), typed = $('#typed'), send = $('#send');
  const Q = '견적서 가격 비교를 AI로 자동화할 수 있을까요?';
  let stars = [];
  const seed = () => { stars = Array.from({ length: Math.round(cv.W * cv.H / 4800) }, () => ({ x: Math.random() * cv.W, y: Math.random() * cv.H, r: Math.random() * 1.1 + .25, ph: Math.random() * 6.3, sp: .4 + Math.random() * 1.6 })); };
  seed();
  const star = { x: 0, y: 0, a: 0 };

  function planet(a, shift) {
    if (a <= 0) return;
    const W = cv.W, H = cv.H, R = Math.max(W, H) * .52, cx = W * .47, cy = H * .62 - shift;
    ctx.save(); ctx.globalAlpha = a;
    const body = ctx.createRadialGradient(cx - R * .2, cy, R * .2, cx, cy, R);
    body.addColorStop(0, '#020304'); body.addColorStop(.86, '#06080d'); body.addColorStop(.97, '#151b28'); body.addColorStop(1, '#323d56');
    ctx.fillStyle = body; ctx.beginPath(); ctx.arc(cx, cy, R, 0, 7); ctx.fill();
    const lg = ctx.createLinearGradient(cx - R, 0, cx + R, 0);
    lg.addColorStop(0, 'rgba(200,215,255,0)'); lg.addColorStop(.55, 'rgba(200,215,255,0)'); lg.addColorStop(.9, 'rgba(210,222,255,.55)'); lg.addColorStop(1, 'rgba(240,245,255,.95)');
    ctx.strokeStyle = lg; ctx.lineWidth = 2.5; ctx.shadowColor = 'rgba(190,205,255,.9)'; ctx.shadowBlur = 40;
    ctx.beginPath(); ctx.arc(cx, cy, R, -1.45, 1.45); ctx.stroke();
    ctx.lineWidth = 16; ctx.globalAlpha = a * .22; ctx.beginPath(); ctx.arc(cx, cy, R - 9, -1.2, 1.2); ctx.stroke();
    ctx.restore();
  }
  function orbit(a, t, shift) {
    if (a <= 0) return;
    const W = cv.W, H = cv.H, rx = Math.min(W * .17, 260), ry = H * .33;
    ctx.save(); ctx.translate(W * .5, H * .63 - shift); ctx.rotate(-.35); ctx.globalAlpha = a;
    ctx.strokeStyle = 'rgba(255,255,255,.2)'; ctx.lineWidth = 1;
    const s0 = -2.3, len = 4.6;
    ctx.beginPath(); ctx.ellipse(0, 0, rx, ry, 0, s0, s0 + len); ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,.75)'; ctx.shadowColor = '#fff'; ctx.shadowBlur = 8;
    for (let i = 0; i < 9; i++) {
      const th = s0 + ((i / 9 + t * .012) % 1) * len;
      ctx.beginPath(); ctx.arc(Math.cos(th) * rx, Math.sin(th) * ry, 1.6, 0, 7); ctx.fill();
    }
    ctx.restore();
  }
  function radar(p, a, b, cx, cy) {
    if (a <= 0) return;
    const W = cv.W, H = cv.H, m = Math.min(W, H);
    ctx.save(); ctx.lineWidth = 1; ctx.globalAlpha = 1 - seg(p, .43, .5);
    const vl = eo(seg(a, 0, .4)) * H * .6;
    ctx.strokeStyle = 'rgba(255,255,255,.28)';
    ctx.beginPath(); ctx.moveTo(cx, cy - vl); ctx.lineTo(cx, cy + vl); ctx.stroke();
    const hl = eo(seg(a, .15, .55)) * W * .55;
    ctx.setLineDash([4, 6]); ctx.strokeStyle = 'rgba(255,255,255,.22)';
    ctx.beginPath(); ctx.moveTo(cx - hl, cy); ctx.lineTo(cx + hl, cy); ctx.stroke(); ctx.setLineDash([]);
    [m * .14, m * .35, m * .55].forEach((r, i) => {
      const k = eo(seg(a, .25 + i * .15, .7 + i * .1)); if (k <= 0) return;
      ctx.strokeStyle = `rgba(255,255,255,${.2 - i * .04})`;
      ctx.beginPath(); ctx.arc(cx, cy, r, -Math.PI / 2, -Math.PI / 2 + k * Math.PI * 2); ctx.stroke();
    });
    const qa = seg(a, .3, .8) * (1 - b);
    if (qa > 0) { ctx.strokeStyle = `rgba(255,255,255,${.35 * qa})`; ctx.beginPath(); ctx.arc(cx, cy, m * .1, -Math.PI / 2, -Math.PI / 2 + Math.PI * qa); ctx.stroke(); }
    if (b > 0) {
      ctx.setLineDash([3, 7]); ctx.strokeStyle = 'rgba(255,255,255,.18)';
      const d = eo(b) * Math.max(W, H) * .45;
      [[1, 1], [1, -1], [-1, 1], [-1, -1]].forEach(([x, y]) => { ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + x * d, cy + y * d); ctx.stroke(); });
      ctx.setLineDash([]);
    }
    ctx.restore();
  }
  function warp(a, lift, t) {
    if (a <= 0) return;
    const W = cv.W, H = cv.H, cx = W / 2, cy = H * .66 - lift, f = Math.min(W, H * 1.6) * .62;
    const cp = Math.cos(.42), sp = Math.sin(.42), dist = 7.2;
    const depth = r => -2.2 / (r * .85 + .28) + .25;
    const proj = (x, y, z) => { const y2 = y * cp - z * sp, z2 = y * sp + z * cp + dist; return z2 < .4 ? null : [cx + x * f / z2, cy - y2 * f / z2]; };
    const rings = Array.from({ length: 18 }, (_, i) => .34 * Math.pow(1.24, i));
    ctx.save(); ctx.lineWidth = 1;
    for (const r of rings) {
      ctx.beginPath(); let first = true;
      for (let k = 0; k <= 96; k++) {
        const th = k / 96 * Math.PI * 2, q = proj(Math.cos(th) * r, depth(r), Math.sin(th) * r);
        if (!q) { first = true; continue; } first ? ctx.moveTo(q[0], q[1]) : ctx.lineTo(q[0], q[1]); first = false;
      }
      ctx.strokeStyle = `rgba(255,255,255,${a * clamp(.32 - r * .012, .06, .3)})`; ctx.stroke();
    }
    ctx.strokeStyle = `rgba(255,255,255,${a * .14})`;
    for (let s = 0; s < 32; s++) {
      const th = s / 32 * Math.PI * 2; ctx.beginPath(); let first = true;
      for (const r of rings) {
        const q = proj(Math.cos(th) * r, depth(r), Math.sin(th) * r);
        if (!q) { first = true; continue; } first ? ctx.moveTo(q[0], q[1]) : ctx.lineTo(q[0], q[1]); first = false;
      }
      ctx.stroke();
    }
    for (let i = 0; i < 4; i++) {
      const ph = (t * .08 + i * .27) % 1, r = lerp(rings[15], rings[1], eio(ph)), th = i * 1.7 + .6;
      const q = proj(Math.cos(th) * r, depth(r), Math.sin(th) * r);
      if (q) glow(ctx, q[0], q[1], 10, a * (1 - ph) * .9);
    }
    ctx.restore();
  }

  function render(t) {
    sc.read(); sc.step();
    if (!visible(sc.el)) { star.a = 0; return; }
    if (cv.fit()) seed();
    const p = sc.p, W = cv.W, H = cv.H;
    ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);

    const heroOut = eio(seg(p, .03, .16)), flight = eio(seg(p, .06, .18));
    const radarA = seg(p, .17, .3), diagB = seg(p, .33, .4);
    const warpIn = eo(seg(p, .42, .52)), typing = seg(p, .55, .7), lift = eio(seg(p, .8, .97));

    const starA = 1 - seg(p, .18, .3) * .75;
    for (const s of stars) {
      ctx.fillStyle = `rgba(255,255,255,${starA * (.45 + .55 * Math.sin(t * s.sp + s.ph)) * .8})`;
      ctx.fillRect(s.x, ((s.y - heroOut * 40) % H + H) % H, s.r, s.r);
    }
    planet(1 - seg(p, .08, .2), heroOut * H * .45);
    orbit(1 - seg(p, .06, .15), t, heroOut * H * .3);

    const cr = cursor.getBoundingClientRect(), stR = sc.el.firstElementChild.getBoundingClientRect();
    const sx0 = cr.left + cr.width * .25, sy0 = cr.top - stR.top + cr.height * .2;
    let sx = lerp(sx0, W / 2, flight), sy = lerp(sy0, H / 2, flight);
    sy = lerp(sy, H * .47, eo(seg(p, .4, .5)));
    sx = lerp(sx, W * .5, lift); sy = lerp(sy, H * .2, lift);
    radar(p, radarA, diagB, W / 2, H / 2);
    warp(warpIn * (1 - eo(lift)), lift * H * .35, t);
    const hideWords = seg(p, .235, .255) * (1 - seg(p, .39, .42));
    star.x = sx; star.y = sy + stR.top; star.a = clamp(flight * 1.4) * (1 - hideWords);
    // while pinned the scene owns the star; after unpin the guide star takes over
    if (p < .999) glow(ctx, sx, sy, lerp(6, 34, flight) + Math.sin(t * 2) * 2, star.a * (.85 + .15 * Math.sin(t * 3)));

    L.hero.style.opacity = 1 - heroOut;
    L.hero.style.transform = `translateY(${-heroOut * H * .35}px)`;
    L.hero.style.filter = heroOut > .001 ? `blur(${heroOut * 6}px)` : 'none';
    L.hero.style.visibility = heroOut >= 1 ? 'hidden' : 'visible';
    cursor.style.opacity = 1 - seg(p, .12, .17);
    cursor.style.transform = `translate(${(W / 2 - sx0) * flight}px,${(H / 2 - sy0 + heroOut * H * .35) * flight}px) scale(${1 - flight * .8}) rotate(${flight * 40}deg)`;
    cursor.style.animationPlayState = flight > 0 ? 'paused' : 'running';

    L.words.style.opacity = p > .24 && p < .44 ? 1 : 0;
    words.forEach((w, i) => {
      const k = eo(seg(p, .25 + i * .018, .29 + i * .018)), out = seg(p, .36, .42);
      w.style.opacity = k * (1 - out); w.style.filter = `blur(${(1 - k) * 12 + out * 8}px)`; w.style.transform = `translateY(${(1 - k) * 14}px)`;
    });
    L.warp.style.opacity = warpIn * (1 - seg(p, .8, .9));
    L.warp.style.transform = `translateY(${(1 - warpIn) * 30 - lift * H * .4}px)`;
    L.warp.style.filter = warpIn < .999 ? `blur(${(1 - warpIn) * 8}px)` : 'none';
    const n = Math.round(typing * Q.length);
    if (typed.textContent.length !== n) typed.textContent = Q.slice(0, n);
    send.classList.toggle('on', typing >= 1);
  }
  return { render, sc, star };
})();

/* ================= SERVICES · sticky AI panel ================= */
const SVC = (() => {
  const cards = $$('.svc-card'), tabs = $$('#svcTabs button'), msgs = $('#msgs'), route = $('#route');
  const DATA = [
    { r: '/strategy', q: '우리 팀은 어떤 업무부터 AI를 적용해야 할까요?', s: ['업무 목록 12개 읽기', '효과와 실행 난이도 평가', '첫 과제 3개 선정'], a: '견적서 가격 비교, 주간 재고 리포트, 배송 지연 분류부터 추천드려요. 효과가 크고 바로 실행할 수 있는 순서입니다.' },
    { r: '/workshop', q: '우리 팀 슈퍼유저는 어떻게 키우나요?', s: ['현재 AI 활용 수준 확인', '실무 과제 배정', '도구 제작 · 결과 검증'], a: '4주 동안 자기 업무로 직접 도구를 만들고 검증합니다. 마지막 주에는 동료에게 방법을 공유해요.' },
    { r: '/tools/quote', q: '견적서 3개 가격이랑 납기 비교해줘', s: ['견적서 3건 읽기', '단가 · 납기 · 조건 추출', '추천 공급사 표시'], a: 'B 상사를 추천해요. 단가는 C 테크가 가장 낮지만 납기가 21일이라 일정에 맞지 않습니다.' },
    { r: '/ops', q: '이 도구를 우리 팀이 직접 관리하려면?', s: ['운영 담당자 지정', '역할과 권한 설정', '관리 문서 4종 작성'], a: '김하비님이 운영 책임, 이수진님이 기준 관리를 맡습니다. 박준호님에게 사용 권한 초대를 보냈어요.' },
  ];
  let active = -1, timers = [];
  const later = (fn, ms) => timers.push(setTimeout(fn, ms));
  function play(i) {
    timers.forEach(clearTimeout); timers = [];
    const d = DATA[i]; route.textContent = d.r; msgs.innerHTML = '';
    const add = html => { msgs.insertAdjacentHTML('beforeend', html); return msgs.lastElementChild; };
    add(`<div class="m-user">${d.q}</div>`);
    later(() => add(`<div class="m-bot"><span class="bot"></span>하비탄 AI</div>`), 450);
    later(() => {
      const th = add(`<div class="thinking live">생각하는 중 ⌄</div>`);
      const box = add(`<div class="steps"></div>`);
      d.s.forEach((s, k) => {
        later(() => { box.insertAdjacentHTML('beforeend', `<div class="step run"><i></i>${s}</div>`); }, k * 700);
        later(() => { box.children[k]?.classList.replace('run', 'done'); }, k * 700 + 600);
      });
      later(() => { th.classList.remove('live'); th.textContent = '정리했어요 ⌄'; }, d.s.length * 700 + 200);
    }, 900);
    later(() => add(`<div class="m-ans">${d.a}</div>`), 900 + DATA[i].s.length * 700 + 450);
  }
  function setActive(i) {
    if (i === active) return; active = i;
    cards.forEach((c, k) => c.classList.toggle('on', k === i));
    tabs.forEach((b, k) => b.classList.toggle('on', k === i));
    cards[i].querySelectorAll('.bar i').forEach(b => { const w = b.style.getPropertyValue('--w'); b.style.setProperty('--w', '0%'); requestAnimationFrame(() => requestAnimationFrame(() => b.style.setProperty('--w', w))); });
    play(i);
  }
  tabs.forEach((b, k) => b.addEventListener('click', () => cards[k].scrollIntoView({ behavior: REDUCE ? 'auto' : 'smooth', block: 'center' })));
  function render() {
    if (!visible($('#services'))) return;
    let best = 0, bd = 1e9;
    cards.forEach((c, k) => { const r = c.getBoundingClientRect(), d = Math.abs(r.top + r.height / 2 - VH * .5); if (d < bd) { bd = d; best = k; } });
    setActive(best);
  }
  return { render };
})();

/* ================= INTERFACE scene ================= */
const IFX = (() => {
  const sc = scene($('[data-scene="ifx"]')), cv = makeCanvas($('#cvIfx')), ctx = cv.ctx;
  const heads = $$('#ifxHead [data-h]'), dash = $('#dash'), beam = $('#beam'), cat = $('#catalog');
  const tags = $$('#dash .tagged'), togs = $$('#catalog .tog'), doms = $$('#doms span'), judgeEl = $('#dash [data-x=".4"]');
  const ranges = [[-1, .24], [.24, .5], [.5, .76], [.76, 2]];
  let domI = 0, domT = 0;
  function grid(t, p) {
    const W = cv.W, H = cv.H; ctx.clearRect(0, 0, W, H);
    const cx = W / 2, cy = H * .12, f = W * .7, pitch = .32, cp = Math.cos(pitch), sp = Math.sin(pitch);
    const proj = (x, y, z) => { const y2 = y * cp - z * sp, z2 = y * sp + z * cp + 4; return z2 < .3 ? null : [cx + x * f / z2, cy - y2 * f / z2, z2]; };
    const off = (p * 3) % 1;
    ctx.lineWidth = 1;
    for (let i = -14; i <= 14; i++) {           // lines receding
      const a = proj(i, -1.6, 0), b = proj(i, -1.6, 26); if (!a || !b) continue;
      const g = ctx.createLinearGradient(a[0], a[1], b[0], b[1]);
      g.addColorStop(0, 'rgba(255,255,255,.16)'); g.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.strokeStyle = g; ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke();
    }
    for (let j = 0; j < 26; j++) {              // cross lines + glowing dots
      const z = j - off; if (z < 0) continue;
      const a = proj(-14, -1.6, z), b = proj(14, -1.6, z); if (!a || !b) continue;
      const al = clamp(.16 - z * .006, 0, .16);
      ctx.strokeStyle = `rgba(255,255,255,${al})`; ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke();
      for (let i = -14; i <= 14; i += 2) {
        const q = proj(i, -1.6, z); if (!q) continue;
        const tw = .5 + .5 * Math.sin(t * 1.3 + i * 1.7 + j * 2.3);
        ctx.fillStyle = `rgba(255,255,255,${al * 3 * tw})`; ctx.fillRect(q[0] - 1, q[1] - 1, 2, 2);
      }
    }
    // vertical back wall lines
    for (let i = -14; i <= 14; i += 2) {
      const a = proj(i, -1.6, 26), b = proj(i, 6, 26); if (!a || !b) continue;
      ctx.strokeStyle = 'rgba(255,255,255,.035)'; ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke();
    }
  }
  function render(t, dt) {
    sc.read(); sc.step();
    if (!visible(sc.el)) return;
    cv.fit();
    const p = sc.p; grid(t, p);
    heads.forEach((h, i) => {
      const [s, e] = ranges[i], v = seg(p, s - .03, s + .02) * (1 - seg(p, e - .02, e + .03));
      h.querySelectorAll('span').forEach((sp, k) => {
        const vv = clamp(v * 1.4 - k * .2);
        sp.style.opacity = vv; sp.style.filter = vv < .999 ? `blur(${(1 - vv) * 12}px)` : 'none';
      });
      h.setAttribute('aria-hidden', v < .5);
    });
    const tilt = eo(seg(p, 0, .24)), lift = eio(seg(p, .86, 1));
    const mobile = VW < 820;
    dash.style.transform = `translateY(${(1 - tilt) * 60 - lift * 60}px) rotateX(${lerp(30, 7, tilt) - lift * 4}deg) rotateY(${lerp(-4, 0, tilt)}deg) scale(${lerp(.9, mobile ? .98 : 1, tilt)})`;
    const bx = seg(p, .27, .5);
    beam.style.opacity = bx > 0 && bx < 1 ? Math.sin(Math.PI * bx) : 0;
    beam.style.left = `${bx * 100}%`;
    tags.forEach(el => el.classList.toggle('lit', p > .27 && bx >= +el.dataset.x && p < .995));
    judgeEl.classList.toggle('judge', p > .78);
    const ca = eo(seg(p, .52, .6));
    cat.style.opacity = ca * (1 - seg(p, .96, 1));
    cat.style.transform = `translateY(${(1 - ca) * 20}px) scale(${lerp(.96, 1, ca)})`;
    togs.forEach((tg, i) => tg.classList.toggle('on', p > .58 + i * .04));
    if (ca > .5 && (domT += dt) > 1.1) { domT = 0; domI = (domI + 1) % doms.length; doms.forEach((d, i) => d.classList.toggle('on', i === domI)); }
  }
  return { render };
})();

/* ================= logos + stories ================= */
const COMPANIES = [['01-echoit', '에코아이티'], ['02-sict', '에스아이시티'], ['03-bytesmix', '바이츠믹스'], ['04-big3', '큰삼촌컴퍼니'], ['05-enclu', '엔클루'], ['06-bsn', '빌사남'], ['07-forpeople', '포피플'], ['08-hiuplus', '하이유플'], ['09-hiphone', '하이폰'], ['10-shurim', '슈림컴퍼니'], ['11-maehong', '매홍엘앤에프'], ['12-bltech', '비엘테크'], ['13-nextbio', '넥스트바이오'], ['14-shinjeong', '신정개발'], ['15-dchoi', '디초이글로벌'], ['16-humanis', '휴먼이즈'], ['17-plenty', '더플렌티'], ['18-bb5', 'bb5'], ['19-yulip', '율립'], ['20-leejiyoung', '이지영디자인'], ['21-dokdo', '독도문방구'], ['22-kigle', '(주)키글']];
const logo = ([f, n]) => `<img src="assets/logos/${f}-black.webp" alt="${n}" loading="lazy" height="26">`;
$('#logos').innerHTML = COMPANIES.map(logo).join('') + COMPANIES.map(c => logo(c).replace(`alt="${c[1]}"`, 'alt="" aria-hidden="true"')).join('');
$('#rail').innerHTML = COMPANIES.map(([f, n], i) => `
  <article class="story"><div class="l">${logo([f, n])}<small>${n}</small></div>
  <div class="r"><b>슈퍼AI워크샵</b><span>수료생 소속 기업<br>No. ${String(i + 1).padStart(2, '0')}</span></div></article>`).join('');

/* ================= bento loops ================= */
(() => {
  const steps = $$('#skillSteps .sk'), rec = $('#recTime'), bars = $$('#bars .bar i'), policy = $$('#policy .tog');
  const convo = $$('#convo .it'), convoN = $('#convoN'), esc = $('#esc');
  let started = false, sec = 0;
  const run = () => {
    if (started) return; started = true;
    bars.forEach(b => b.style.setProperty('--w', b.dataset.w));
    policy.forEach((p, i) => setTimeout(() => p.classList.add('on'), 600 + i * 450));
    let k = 0;
    setInterval(() => {                       // record-steps loop
      if (k < steps.length) steps[k++].classList.add('in');
      else if (k++ > steps.length + 2) { steps.forEach(s => s.classList.remove('in')); k = 0; }
    }, 900);
    setInterval(() => { sec++; rec.textContent = `REC 00:${String(sec % 60).padStart(2, '0')}`; }, 1000);
    let f = 0;
    setInterval(() => {                       // search-filter loop
      f = (f + 1) % 2;
      convo.forEach((c, i) => c.style.opacity = f && !(i === 0 || i === 2) ? .15 : 1);
      convoN.textContent = f ? '"견적" · 2개' : '5개';
    }, 2600);
    setInterval(() => { esc.querySelectorAll('div').forEach(d => { d.style.animation = 'none'; d.offsetWidth; d.style.animation = ''; }); }, 7000);
  };
  new IntersectionObserver(es => es.some(e => e.isIntersecting) && run(), { threshold: .15 }).observe($('.bento'));
})();

/* ================= OWN IT · code typing, window stack, dot wave ================= */
const OWN = (() => {
  const code = $('#code');
  const LINES = [
    [['k', 'import'], ['', ' { Hobbytan } '], ['k', 'from'], ['s', ' "@hobbytan/tools"'], ['', ';']],
    [['k', 'const'], ['', ' tool = '], ['k', 'new'], ['f', ' Hobbytan'], ['', '('], ['s', '"견적-비교"'], ['', ');']],
    [['', 'tool.'], ['f', 'connect'], ['', '('], ['s', '"google-sheets"'], ['', ', { sheet: '], ['s', '"견적서"'], ['', ' });']],
    [['', 'tool.'], ['f', 'notify'], ['', '('], ['s', '"slack"'], ['', ', '], ['s', '"#구매팀"'], ['', ');']],
    [['', 'tool.owner = '], ['s', '"구매팀 김하비"'], ['', ';'], ['c', ' // 팀이 직접 관리']],
  ];
  const total = LINES.map(l => l.reduce((n, [, s]) => n + s.length, 0));
  let chars = 0, hold = 0, on = false;
  const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
  function draw() {
    let left = chars, html = '';
    LINES.forEach((l, i) => {
      let line = '';
      for (const [k, s] of l) { if (left <= 0) break; const part = s.slice(0, left); left -= part.length; line += k ? `<span class="tk-${k}">${esc(part)}</span>` : esc(part); }
      const done = chars >= total.slice(0, i + 1).reduce((a, b) => a + b, 0);
      const cur = !done && chars >= total.slice(0, i).reduce((a, b) => a + b, 0);
      html += `<div class="ln"><i>${i + 1}</i><span class="${cur ? 'caret' : ''}">${line}</span></div>`;
    });
    code.innerHTML = html;
  }
  draw();
  const sum = total.reduce((a, b) => a + b, 0);
  setInterval(() => {
    if (!on) return;
    if (chars < sum) { chars += 2; draw(); } else if (++hold > 90) { chars = 0; hold = 0; draw(); }
  }, 45);
  new IntersectionObserver(es => { on = es[0].isIntersecting; }, { threshold: .3 }).observe(code);

  const wins = $$('#stack .win'); let order = [0, 1, 2];
  const place = () => order.forEach((w, pos) => {
    const el = wins[w];
    el.style.transform = `translateY(${[84, 42, 0][pos]}px) scale(${[1, .95, .9][pos]})`;
    el.style.opacity = [1, .75, .45][pos]; el.style.zIndex = 3 - pos;
    el.style.filter = pos ? `brightness(${1 - pos * .25})` : 'none';
  });
  place(); setInterval(() => { if (visible($('#stack'))) { order.push(order.shift()); place(); } }, 3200);

  const cv = makeCanvas($('#cvWave')), ctx = cv.ctx;
  function render(t) {
    if (!visible(cv.el)) return; cv.fit();
    const W = cv.W, H = cv.H; ctx.clearRect(0, 0, W, H);
    const cx = W / 2, f = W * .9;
    for (let z = 1; z < 18; z += .5) for (let x = -20; x <= 20; x += .5) {
      const y = -1.2 + .18 * Math.sin(x * .45 + t * 1.1) * Math.cos(z * .5 - t * .8);
      const zz = z + 1.5, sx = cx + x * f / zz, sy = H * .1 - y * f / zz * .55;
      if (sx < 0 || sx > W || sy > H) continue;
      const a = clamp(.55 - z * .028) * (.6 + .4 * Math.sin(x + z + t));
      ctx.fillStyle = `rgba(255,255,255,${a})`; ctx.fillRect(sx, sy, 1.4, 1.4);
    }
  }
  return { render };
})();

/* ================= TICKETS scene ================= */
const TIX = (() => {
  const sc = scene($('[data-scene="tix"]')), cv = makeCanvas($('#cvTix')), ctx = cv.ctx;
  const Qs = [['견적서 비교 언제 끝나요?', 18, 47, '김', '#fda4af'], ['재고 엑셀 최신본 어디 있어요?', 37, 41, '이', '#93c5fd'], ['이번 달 매출 집계 기준이 뭐죠?', 63, 38, '박', '#86efac'], ['배송 지연 건 누가 확인해요?', 82, 46, '최', '#fcd34d'],
    ['광고 성과 보고서 어떻게 뽑아요?', 14, 70, '정', '#c4b5fd'], ['발주 승인은 누구한테 받나요?', 54, 61, '한', '#fdba74'], ['수요 예측 자료 있나요?', 78, 72, '윤', '#67e8f9'], ['고객 안내 문자 양식 있나요?', 34, 80, '서', '#f9a8d4']];
  const wrap = $('#bubbles'), count = $('#tixCount'), stats = $('#tixStats');
  wrap.innerHTML = Qs.map(([q, x, y, n, c], i) => `<div class="qb ${i % 2 ? 'hide-sm' : ''}" style="left:${x}%;top:${y}%"><div class="row"><span class="q">${q}</span><span class="av" style="background:${c}">${n}</span></div><span class="ok">✓ AI 도구로 해결</span><span class="stem"></span></div>`).join('');
  const bs = $$('.qb', wrap);
  function render(t) {
    sc.read(); sc.step();
    if (!visible(sc.el)) return; cv.fit();
    const p = sc.p, W = cv.W, H = cv.H; ctx.clearRect(0, 0, W, H);
    const cx = W / 2, f = W * .8;
    for (let z = 2; z < 30; z += .6) for (let x = -26; x <= 26; x += .65) {
      const y = -1 + .1 * Math.sin(x * .3 + z * .4 + t * .7);
      const zz = z + 1, sx = cx + x * f / zz, sy = H * .3 - y * f / zz;
      if (sx < 0 || sx > W || sy > H || sy < 0) continue;
      ctx.fillStyle = `rgba(255,255,255,${clamp(.75 - z * .022) * .75})`; ctx.fillRect(sx, sy, 1.4, 1.4);
    }
    const into = eo(seg(p, 0, .12));
    let solved = 0;
    bs.forEach((b, i) => {
      const s = .16 + i * .075, isS = p > s, gone = seg(p, s + .05, s + .09);
      if (isS) solved++;
      b.classList.toggle('solved', isS);
      b.style.opacity = into * (1 - gone);
      b.style.transform = `translate(-50%,calc(-100% + ${(1 - into) * 30 - gone * 20}px))`;
      if (gone < 1 && getComputedStyle(b).display !== 'none') {     // dot cluster under each bubble
        const r = b.getBoundingClientRect(), stR = sc.el.firstElementChild.getBoundingClientRect();
        const bx = r.left + r.width / 2, by = r.bottom - stR.top + 8;
        for (let k = 0; k < 6; k++) {
          const ang = k / 6 * Math.PI * 2 + t * .3, dx = Math.cos(ang) * 16, dy = Math.sin(ang) * 6 + 10;
          glow(ctx, bx + dx, by + dy, 7, (isS ? .95 : .55) * into * (1 - gone));
        }
      }
    });
    const n = Math.round(40 * (1 - seg(p, .14, .8)));
    if (count.textContent !== String(n)) count.textContent = n;
    const sa = eo(seg(p, .82, .92));
    stats.style.opacity = sa; stats.style.transform = `translateY(${(1 - sa) * 20}px)`;
  }
  return { render };
})();

/* ================= QUOTE galaxy ================= */
const GAL = (() => {
  const cv = makeCanvas($('#cvGal')), ctx = cv.ctx;
  const P = Array.from({ length: 1500 }, () => { const r = Math.pow(Math.random(), 1.6); return { r, th: Math.random() * 6.283, s: .6 + Math.random() * .8, z: Math.random() }; });
  function render(t) {
    if (!visible(cv.el)) return; cv.fit();
    const W = cv.W, H = cv.H; ctx.clearRect(0, 0, W, H);
    const cx = W / 2, cy = H * .62, R = Math.min(W * .32, 460);
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, R * .7);
    g.addColorStop(0, 'rgba(150,175,230,.22)'); g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    for (const q of P) {
      const th = q.th + t * .05 * q.s / (q.r + .25), rr = (.08 + q.r) * R;
      const x = cx + Math.cos(th) * rr, y = cy + Math.sin(th) * rr * .36 - q.z * 6;
      const a = (.25 + .75 * (1 - q.r)) * (.5 + .5 * Math.sin(t * 2 + q.th * 9));
      ctx.fillStyle = `rgba(230,236,255,${a * .8})`; ctx.fillRect(x, y, 1.3, 1.3);
    }
  }
  return { render };
})();

/* ================= PROCESS scene ================= */
const PROC = (() => {
  const sc = scene($('[data-scene="proc"]')), cv = makeCanvas($('#cvProc')), ctx = cv.ctx;
  const VAL = [10, 40, 70, 90];
  const DESC = ['<b>01 진단</b> · 현재 업무와 AI 활용 수준을 확인하고, 효과가 크고 실행 가능한 첫 과제를 고릅니다.',
    '<b>02 교육</b> · 실제 업무를 바탕으로 도구를 만들고 검증하며, 팀의 AI 활용을 이끌 담당자를 교육합니다.',
    '<b>03 구현</b> · 업무 도구를 함께 구현하고, 실제 사용 과정에서 발견한 오류와 예외를 보완합니다.',
    '<b>04 이관</b> · 담당자와 관리 기준을 확정하고, 고객의 팀이 수정과 개선을 이어가도록 운영을 이관합니다.'];
  const digits = $('#digits'), desc = $('#procDesc'), knob = $('#knob'), fill = $('#sfill');
  const dots = $$('#slider button'), labels = $$('#slabels span'), segs = $$('#procSeg span');
  digits.innerHTML = [0, 1].map(() => `<span class="digit">${[...Array(10).keys()].map(d => `<span>${d}</span>`).join('')}</span>`).join('');
  const cols = $$('.digit', digits);
  let cur = -1, scrollStep = -1, manual = null;
  function set(i) {
    if (i === cur) return; cur = i;
    const v = String(VAL[i]).padStart(2, '0');
    cols.forEach((c, k) => c.style.transform = `translateY(${-+v[k] * .95}em)`);
    desc.innerHTML = DESC[i];
    const x = i / 3 * 100; knob.style.left = x + '%'; fill.style.width = x + '%';
    dots.forEach((d, k) => d.classList.toggle('on', k <= i));
    labels.forEach((l, k) => l.classList.toggle('on', k === i));
    segs.forEach((s, k) => s.classList.toggle('on', (i >= 2) === (k === 1)));
  }
  dots.forEach((d, k) => d.addEventListener('click', () => { manual = k; set(k); }));
  labels.forEach((l, k) => { l.style.cursor = 'pointer'; l.addEventListener('click', () => { manual = k; set(k); }); });
  set(0);
  let stars = [];
  function render(t) {
    sc.read(); sc.step();
    if (!visible(sc.el)) return;
    if (cv.fit() || !stars.length) stars = Array.from({ length: 420 }, () => ({ x: Math.random(), y: Math.random(), r: Math.random() * 1.2 + .2, ph: Math.random() * 6 }));
    const W = cv.W, H = cv.H; ctx.clearRect(0, 0, W, H);
    const g = ctx.createRadialGradient(W / 2, H * .3, 0, W / 2, H * .3, Math.max(W, H) * .5);
    g.addColorStop(0, 'rgba(110,140,200,.28)'); g.addColorStop(.5, 'rgba(40,55,90,.12)'); g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    for (const s of stars) {
      const dx = Math.abs(s.x - .5) * 2, a = (.3 + .7 * dx) * (.5 + .5 * Math.sin(t * 1.4 + s.ph));
      ctx.fillStyle = `rgba(255,255,255,${a * .7})`; ctx.fillRect(s.x * W, s.y * H, s.r, s.r);
    }
    const st = Math.min(3, Math.floor(seg(sc.p, .08, .92) * 4));
    if (st !== scrollStep) { scrollStep = st; manual = null; }
    set(manual ?? st);
  }
  return { render };
})();

/* ================= final outline draw ================= */
(() => {
  const svg = $('#outline'), parts = $$('path,rect,circle', svg);
  parts.forEach(p => { const L = p.getTotalLength(); p.style.strokeDasharray = L; p.style.strokeDashoffset = L; p.style.transition = 'stroke-dashoffset 2.4s cubic-bezier(.22,1,.36,1)'; });
  new IntersectionObserver(es => { if (es[0].isIntersecting) parts.forEach((p, i) => setTimeout(() => p.style.strokeDashoffset = 0, i * 120)); }, { threshold: .2 }).observe(svg);
})();

/* ================= GUIDE STAR (fixed layer that travels between sections) ================= */
const GUIDE = (() => {
  const cv = makeCanvas($('#guide')), ctx = cv.ctx;
  const anchors = $$('[data-star]');
  const pos = { x: VW / 2, y: VH / 2 }, trail = [];
  let alpha = 0;
  function target() {
    const pts = [{ x: A.star.x, y: A.star.y }].concat(anchors.map(a => { const r = a.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; }));
    const c = VH * .5;
    if (pts[0].y > c) return pts[0];
    for (let i = 0; i < pts.length - 1; i++) {
      const a = pts[i], b = pts[i + 1];
      if (a.y <= c && b.y >= c) { const k = eio(clamp((c - a.y) / Math.max(1, b.y - a.y))); return { x: lerp(a.x, b.x, k), y: lerp(a.y, b.y, k) }; }
    }
    return pts[pts.length - 1];
  }
  function render(t) {
    cv.fit(); ctx.clearRect(0, 0, cv.W, cv.H);
    const owned = A.sc.p < .999;                       // scene A draws its own star while pinned
    const tg = owned ? { x: A.star.x, y: A.star.y } : target();
    const k = owned || REDUCE ? 1 : .085;
    pos.x += (tg.x - pos.x) * k; pos.y += (tg.y - pos.y) * k;
    const onScreen = tg.y > -40 && tg.y < VH + 40;
    alpha += ((owned || !onScreen ? 0 : 1) - alpha) * (owned ? 1 : .1);
    if (alpha < .01) { trail.length = 0; return; }
    trail.push({ x: pos.x, y: pos.y }); if (trail.length > 14) trail.shift();
    trail.forEach((p, i) => { ctx.fillStyle = `rgba(200,215,255,${alpha * i / trail.length * .12})`; ctx.beginPath(); ctx.arc(p.x, p.y, 1.5 + i * .12, 0, 7); ctx.fill(); });
    glow(ctx, pos.x, pos.y, 26 + Math.sin(t * 2) * 2, alpha * (.85 + .15 * Math.sin(t * 3)));
  }
  return { render };
})();

/* ================= main loop ================= */
let last = performance.now();
function frame(now) {
  const t = now / 1000, dt = Math.min(.1, (now - last) / 1000); last = now;
  nav.classList.toggle('scrolled', scrollY > 40);
  checkReveal();
  A.render(t); SVC.render(); IFX.render(t, dt); OWN.render(t); TIX.render(t); GAL.render(t); PROC.render(t); GUIDE.render(t);
  requestAnimationFrame(frame);
}
addEventListener('resize', () => { VW = innerWidth; VH = innerHeight; });
requestAnimationFrame(frame);
})();
