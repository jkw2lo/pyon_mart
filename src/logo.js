// Pyon Mart logo: a bunny at full stretch running over the curve of the moon.
// Everything is generated from polar coordinates around the moon's centre so the
// bunny's spine, legs and ears all follow the moon's curvature.

export const PALETTE = {
  bunny: '#7d838d',
  bunnyDark: '#5c626b',
  moon: '#ffffff',
  moonLine: '#c9cdd3',
  crater: '#eef0f3',
  ink: '#3d424a',
  night: '#2b3140',
};

function polar(cx, cy, deg, r) {
  const a = (deg * Math.PI) / 180;
  return [cx + r * Math.cos(a), cy - r * Math.sin(a)];
}
const f = (n) => n.toFixed(2);

// SVG arc along a circle from angle a0 to a1 (clockwise when a0 > a1 in math angles)
function arc(cx, cy, r, a0, a1) {
  const [x0, y0] = polar(cx, cy, a0, r);
  const [x1, y1] = polar(cx, cy, a1, r);
  const large = Math.abs(a1 - a0) > 180 ? 1 : 0;
  const sweep = a0 > a1 ? 1 : 0;
  return `M${f(x0)} ${f(y0)} A${f(r)} ${f(r)} 0 ${large} ${sweep} ${f(x1)} ${f(y1)}`;
}

// --- Flat bunny ------------------------------------------------------------
// Drawn flat (x → running direction, y ↑ above the ground, feet at y≈0), then
// bent onto the moon by mapping x to an angle and y to a radius. That warp is
// what makes the spine, legs and ears follow the moon's curve.
const FLAT = {
  fills: [
    // body: big haunch at the back, slim waist, deep chest
    'M84 24 C86 30 79 33 71 32 C62 31 55 28 47 29 C37 30 28 37 17 34 C8 31 6 22 12 17 C17 13 25 15 33 17 C47 21 61 18 73 17 C80 17 83 20 84 24 Z',
  ],
  ellipses: [
    [85, 28, 8.5, 7.5, 0],     // neck
    [94, 31, 11.5, 8.5, -14],  // head
  ],
  strokes: [
    ['M89 38 Q78 50 58 51', 6],    // far ear
    ['M96 37 Q87 43 72 41', 5],    // near ear (sits lower so a gap separates them)
    ['M78 20 Q93 9 112 1', 6.5],    // front legs reaching forward
    ['M73 17 Q87 6 101 -0.5', 5.5],
    ['M14 21 Q0 9 -16 1', 7.5],     // hind legs pushing off
    ['M21 15 Q8 5 -6 -0.5', 6.5],
  ],
  dots: [[5, 30, 5.5]],              // tail
  eye: [99, 33, 1.7],
};
const FLAT_MID = 48;

function parsePath(d) {
  const toks = d.match(/[MCQLZ]|-?[\d.]+/g);
  const segs = [];
  let i = 0, cur = null, start = null, cmd = null;
  const num = () => parseFloat(toks[i++]);
  while (i < toks.length) {
    if (/[MCQLZ]/.test(toks[i])) cmd = toks[i++];
    if (cmd === 'M') { cur = [num(), num()]; start = cur; }
    else if (cmd === 'L') { const p = [num(), num()]; segs.push(['L', cur, p]); cur = p; }
    else if (cmd === 'Q') { const c = [num(), num()], p = [num(), num()]; segs.push(['Q', cur, c, p]); cur = p; }
    else if (cmd === 'C') { const c1 = [num(), num()], c2 = [num(), num()], p = [num(), num()]; segs.push(['C', cur, c1, c2, p]); cur = p; }
    else if (cmd === 'Z') { if (cur[0] !== start[0] || cur[1] !== start[1]) segs.push(['L', cur, start]); cur = start; }
  }
  return segs;
}
function sample(segs, n = 14) {
  const out = [];
  for (const s of segs) {
    for (let k = 0; k < n; k++) {
      const t = k / n, u = 1 - t;
      if (s[0] === 'L') out.push([s[1][0] * u + s[2][0] * t, s[1][1] * u + s[2][1] * t]);
      else if (s[0] === 'Q') out.push([0, 1].map((j) => u * u * s[1][j] + 2 * u * t * s[2][j] + t * t * s[3][j]));
      else out.push([0, 1].map((j) => u * u * u * s[1][j] + 3 * u * u * t * s[2][j] + 3 * u * t * t * s[3][j] + t * t * t * s[4][j]));
    }
  }
  const last = segs[segs.length - 1];
  out.push(last[last.length - 1]);
  return out;
}
function ellipsePts([cx, cy, rx, ry, rot], n = 40) {
  const a = (rot * Math.PI) / 180, pts = [];
  for (let k = 0; k <= n; k++) {
    const t = (k / n) * Math.PI * 2;
    const x = rx * Math.cos(t), y = ry * Math.sin(t);
    pts.push([cx + x * Math.cos(a) - y * Math.sin(a), cy + x * Math.sin(a) + y * Math.cos(a)]);
  }
  return pts;
}

// The bunny bent around moon centre (cx, cy); feet land `gap` above radius R.
// `at` is the angle (deg) of the bunny's middle, s scales the bunny.
export function bunny(cx, cy, R, color, { at = 90, s = 1, gap = 3, eye = PALETTE.moon } = {}) {
  const track = R + gap;
  const warp = ([x, y]) => {
    const deg = at - ((x - FLAT_MID) * s / track) * (180 / Math.PI);
    return polar(cx, cy, deg, track + y * s);
  };
  const poly = (pts, close) => 'M' + pts.map(warp).map(([x, y]) => `${f(x)} ${f(y)}`).join(' L') + (close ? ' Z' : '');
  const parts = [];
  for (const d of FLAT.fills) parts.push(`<path d="${poly(sample(parsePath(d)), true)}"/>`);
  for (const e of FLAT.ellipses) parts.push(`<path d="${poly(ellipsePts(e), true)}"/>`);
  for (const [d, w] of FLAT.strokes) parts.push(`<path d="${poly(sample(parsePath(d)))}" fill="none" stroke="${color}" stroke-width="${f(w * s)}"/>`);
  for (const [x, y, r] of FLAT.dots) { const [px, py] = warp([x, y]); parts.push(`<circle cx="${f(px)}" cy="${f(py)}" r="${f(r * s)}"/>`); }
  const [ex, ey] = warp(FLAT.eye);
  if (eye) parts.push(`<circle cx="${f(ex)}" cy="${f(ey)}" r="${f(FLAT.eye[2] * s)}" fill="${eye}"/>`);
  return `<g fill="${color}" stroke-linecap="round" stroke-linejoin="round">${parts.join('')}</g>`;
}

function moon(cx, cy, r, { line = PALETTE.moonLine, craters = true, lineW = 3 } = {}) {
  const c = craters
    ? `<circle cx="${cx - r * 0.3}" cy="${cy + r * 0.22}" r="${r * 0.16}" fill="${PALETTE.crater}"/>
       <circle cx="${cx + r * 0.32}" cy="${cy + r * 0.4}" r="${r * 0.1}" fill="${PALETTE.crater}"/>
       <circle cx="${cx + r * 0.1}" cy="${cy - r * 0.05}" r="${r * 0.07}" fill="${PALETTE.crater}"/>`
    : '';
  return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${PALETTE.moon}" stroke="${line}" stroke-width="${lineW}"/>${c}`;
}

// --- Variants -------------------------------------------------------------

// A: grey bunny running over the top of a white moon.
export function logoRim({ size = 240 } = {}) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 240" width="${size}" height="${size}">
    ${moon(120, 142, 74)}
    ${bunny(120, 142, 74, PALETTE.bunny, { s: 1.22 })}
  </svg>`;
}

// B: same mark inside a night-sky badge — reads well on a bright storefront sign.
export function logoBadge({ size = 240 } = {}) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 240" width="${size}" height="${size}">
    <circle cx="120" cy="120" r="116" fill="${PALETTE.night}"/>
    ${moon(120, 140, 60, { line: 'none', lineW: 0 })}
    ${bunny(120, 140, 60, '#c3c8d0', { s: 1.05 })}
  </svg>`;
}

// C: silhouette — the moon is white, the bunny is cut out of a grey ring.
export function logoRing({ size = 240 } = {}) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 240" width="${size}" height="${size}">
    <circle cx="120" cy="120" r="112" fill="none" stroke="${PALETTE.bunny}" stroke-width="5"/>
    ${moon(120, 140, 58, { line: 'none', lineW: 0, craters: false })}
    <circle cx="120" cy="140" r="58" fill="none" stroke="${PALETTE.bunny}" stroke-width="3"/>
    ${bunny(120, 140, 58, PALETTE.bunnyDark, { s: 1.0 })}
  </svg>`;
}

// Horizontal lockup used on the storefront fascia.
export function logoLockup({ width = 720, mark = 'rim', dark = false } = {}) {
  const ink = dark ? '#ffffff' : PALETTE.ink;
  const sub = dark ? '#c3c8d0' : PALETTE.bunny;
  const m = mark === 'badge'
    ? `${moon(120, 140, 66, { line: 'none', lineW: 0 })}${bunny(120, 140, 66, '#9aa0a9', { s: 1.1 })}`
    : `${moon(120, 140, 72, dark ? { line: 'none', lineW: 0 } : {})}${bunny(120, 140, 72, dark ? '#9aa0a9' : PALETTE.bunny, { s: 1.2 })}`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 780 240" width="${width}" height="${width * 240 / 780}">
    <g transform="translate(0,-6)">${m}</g>
    <text x="250" y="132" font-family="'Zen Maru Gothic','Hiragino Maru Gothic ProN','Arial Rounded MT Bold',sans-serif"
      font-weight="700" font-size="84" letter-spacing="2" fill="${ink}">PYON MART</text>
    <text x="254" y="182" font-family="'Zen Maru Gothic','Hiragino Maru Gothic ProN',sans-serif"
      font-weight="500" font-size="36" letter-spacing="10" fill="${sub}">ぴょんマート</text>
  </svg>`;
}

export const VARIANTS = { rim: logoRim, badge: logoBadge, ring: logoRing };
