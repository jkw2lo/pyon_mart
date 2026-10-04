// Pyon Mart logo: a hare at full stretch, running over the top of the moon.
// Built like a real brand mark — from concentric arcs around the moon's centre —
// so the back line, ears and legs all share the moon's curvature.

export const PALETTE = {
  slate: '#2b3140',
  bunny: '#8a919c',
  bunnyLight: '#c3c8d0',
  moon: '#ffffff',
  moonTint: '#eef0f4',
  ink: '#2b3140',
  gold: '#f2d675',
};

const f = (n) => n.toFixed(2);
function polar(cx, cy, deg, r) {
  const a = (deg * Math.PI) / 180;
  return [cx + r * Math.cos(a), cy - r * Math.sin(a)];
}
const P = (cx, cy, deg, r) => polar(cx, cy, deg, r).map(f).join(' ');

// smooth step between keyframes [t, value]
function keyed(keys, t) {
  for (let i = 0; i < keys.length - 1; i++) {
    const [t0, v0] = keys[i], [t1, v1] = keys[i + 1];
    if (t >= t0 && t <= t1) {
      const u = (t - t0) / (t1 - t0), s = u * u * (3 - 2 * u);
      return v0 + (v1 - v0) * s;
    }
  }
  return keys[keys.length - 1][1];
}

// The hare. (cx, cy) = moon centre, R = moon radius. `at` is the angle of the
// middle of the body; the hare runs clockwise (left → right over the top).
export function hare(cx, cy, R, color, { at = 96, eye = '#ffffff', span = 84, gap = 0.06, thick = 1 } = {}) {
  const u = R / 60;
  const T = thick;
  const back = at + span / 2, front = at - span / 2;   // angles (deg)
  const Ro = R + 31 * u;                               // the back line: a perfect arc
  const belly = [[0, 22], [0.18, 20], [0.52, 12], [0.8, 15.5], [1, 13.5]];
  // body: outer edge is an exact arc, inner edge (belly) eases in and out
  const pts = [];
  const N = 40;
  for (let i = 0; i <= N; i++) {
    const t = i / N, a = back + (front - back) * t;
    pts.push(polar(cx, cy, a, Ro));
  }
  for (let i = N; i >= 0; i--) {
    const t = i / N, a = back + (front - back) * t;
    pts.push(polar(cx, cy, a, Ro - keyed(belly, t) * u * T));
  }
  const body = 'M' + pts.map(([x, y]) => `${f(x)} ${f(y)}`).join(' L') + ' Z';
  const [hx, hy] = polar(cx, cy, back - 3, Ro - 10.5 * u * T);    // haunch
  const [nx, ny] = polar(cx, cy, front + 1, Ro - 6.5 * u);    // neck
  const [kx, ky] = polar(cx, cy, front - 6.5, Ro - 4 * u);     // head
  const [ex, ey] = polar(cx, cy, front - 9.5, Ro - 2 * u);     // eye
  const [tx, ty] = polar(cx, cy, back + 4, Ro - 3 * u);        // tail
  const headRot = -(front - 6.5) + 90 + 14;
  const g0 = R * (1 + gap);                                     // the feet's track, just above the moon
  const sw = (n) => f(n * u * (1 + (T - 1) * 0.6));
  return `<g fill="${color}" stroke="${color}" stroke-linecap="round" stroke-linejoin="round">
    <path d="${body}" stroke="none"/>
    <circle cx="${f(hx)}" cy="${f(hy)}" r="${f(11 * u * T)}" stroke="none"/>
    <circle cx="${f(nx)}" cy="${f(ny)}" r="${sw(7)}" stroke="none"/>
    <ellipse cx="${f(kx)}" cy="${f(ky)}" rx="${sw(9.6)}" ry="${sw(7.4)}" transform="rotate(${f(headRot)} ${f(kx)} ${f(ky)})" stroke="none"/>
    <circle cx="${f(tx)}" cy="${f(ty)}" r="${sw(4.6)}" stroke="none"/>
    <path d="M${P(cx, cy, front - 3, Ro + 2 * u)} A${f(Ro + 7 * u)} ${f(Ro + 7 * u)} 0 0 0 ${P(cx, cy, front + 30, Ro + 7 * u)}" fill="none" stroke-width="${sw(6.2)}"/>
    <path d="M${P(cx, cy, front - 8, Ro - 0.5 * u)} A${f(Ro - 0.5 * u)} ${f(Ro - 0.5 * u)} 0 0 0 ${P(cx, cy, front + 17, Ro - 0.5 * u)}" fill="none" stroke-width="${sw(4.4)}" stroke="${eye || '#fff'}" opacity=".0"/>
    <path d="M${P(cx, cy, front - 4, Ro + 9.5 * u)} A${f(Ro + 13 * u)} ${f(Ro + 13 * u)} 0 0 0 ${P(cx, cy, front + 21, Ro + 13 * u)}" fill="none" stroke-width="${sw(5)}"/>
    <path d="M${P(cx, cy, front + 5, Ro - 11 * u)} Q${P(cx, cy, front - 6, g0 + 3 * u)} ${P(cx, cy, front - 21, g0)}" fill="none" stroke-width="${sw(5.4)}"/>
    <path d="M${P(cx, cy, front + 9, Ro - 12 * u)} Q${P(cx, cy, front - 1, g0 + 1 * u)} ${P(cx, cy, front - 13, g0 - 0.5 * u)}" fill="none" stroke-width="${sw(4.6)}"/>
    <path d="M${P(cx, cy, back - 8, Ro - 17 * u)} Q${P(cx, cy, back + 8, g0 + 1 * u)} ${P(cx, cy, back + 26, g0)}" fill="none" stroke-width="${sw(6.4)}"/>
    <path d="M${P(cx, cy, back - 13, Ro - 18 * u)} Q${P(cx, cy, back + 1, g0)} ${P(cx, cy, back + 17, g0 - 0.5 * u)}" fill="none" stroke-width="${sw(5.4)}"/>
    ${eye ? `<circle cx="${f(ex)}" cy="${f(ey)}" r="${sw(1.7)}" fill="${eye}" stroke="none"/>` : ''}
  </g>`;
}

// --- marks -------------------------------------------------------------------

// On light backgrounds: tinted moon, slate-grey hare.

// The sign badge: rounded square, night sky, white moon, pale hare.



// Horizontal lockup.



// --- v3: the circular mark ------------------------------------------------------
// The hare lives inside the moon, so the mark is a single clean circle. A tapered
// gold arc trails behind it around half the moon — the line of its leap.

// Tapered arc from angle a0 (thick) to a1 (thin), sitting outside radius r.
export function trail(cx, cy, r, a0, a1, w, color) {
  const N = 48, out = [], inn = [];
  for (let i = 0; i <= N; i++) {
    const t = i / N, a = a0 + (a1 - a0) * t;
    const k = Math.pow(1 - t, 0.85);           // taper
    out.push(polar(cx, cy, a, r + w * k));
    inn.push(polar(cx, cy, a, r));
  }
  const pts = out.concat(inn.reverse());
  return `<path d="M${pts.map(([x, y]) => `${f(x)} ${f(y)}`).join(' L')} Z" fill="${color}"/>`;
}





function craters(cx, cy, R, col = '#eef0f4') {
  return `<circle cx="${f(cx - R * 0.34)}" cy="${f(cy + R * 0.42)}" r="${f(R * 0.15)}" fill="${col}"/>
    <circle cx="${f(cx + R * 0.16)}" cy="${f(cy + R * 0.58)}" r="${f(R * 0.09)}" fill="${col}"/>
    <circle cx="${f(cx + R * 0.42)}" cy="${f(cy + R * 0.3)}" r="${f(R * 0.06)}" fill="${col}"/>`;
}


// ============================================================================
// Official mark (v3). Use these everywhere.
// ============================================================================

// The moon-and-hare roundel as an SVG group, centred at (cx, cy) with moon radius R.
export function roundel(cx, cy, R, { moon = PALETTE.moon, hareCol = PALETTE.bunny, gold = PALETTE.gold, crater = '#eef0f4', eye } = {}) {
  return `${`<circle cx="${cx}" cy="${cy}" r="${R}" fill="${moon}"/>`}
    ${crater ? craters(cx, cy, R, crater) : ''}
    ${hare(cx, cy + R * 0.16, R * 0.53, hareCol, { gap: 0, span: 100, at: 90, eye: eye ?? moon, thick: 1.3 })}
    ${trail(cx, cy, R + R * 0.075, 152, 335, R * 0.11, gold)}`;
}

// Primary mark: slate disc with a slim margin.
export function logoBadge({ size = 240 } = {}) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 240" width="${size}" height="${size}">
    <circle cx="120" cy="120" r="118" fill="${PALETTE.slate}"/>
    ${roundel(120, 121, 92)}
  </svg>`;
}

// On light backgrounds: the moon gets a soft tint so it holds its shape.
export function logoRim({ size = 240 } = {}) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 240" width="${size}" height="${size}">
    ${roundel(120, 121, 100, { moon: PALETTE.moonTint, crater: '#e2e5ea' })}
  </svg>`;
}

// Small white roundel for packaging bands (hare in the band colour).
export function bandMark(band) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 240" width="240" height="240">
    ${roundel(120, 121, 100, { moon: '#ffffff', hareCol: band, crater: 'rgba(0,0,0,0.05)' })}
  </svg>`;
}

export function logoLockup({ width = 720, dark = false } = {}) {
  const ink = dark ? '#ffffff' : PALETTE.ink;
  const sub = dark ? PALETTE.bunnyLight : PALETTE.bunny;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 780 240" width="${width}" height="${width * 240 / 780}">
    ${dark ? roundel(122, 120, 92) : roundel(122, 120, 92, { moon: PALETTE.moonTint, crater: '#e2e5ea' })}
    <text x="262" y="132" font-family="'M PLUS Rounded 1c','Zen Maru Gothic','Hiragino Maru Gothic ProN',sans-serif"
      font-weight="800" font-size="86" letter-spacing="1" fill="${ink}">PYON MART</text>
    <rect x="266" y="156" width="40" height="6" rx="3" fill="${PALETTE.gold}"/>
    <text x="318" y="174" font-family="'M PLUS Rounded 1c','Zen Maru Gothic',sans-serif"
      font-weight="700" font-size="32" letter-spacing="9" fill="${sub}">ぴょんマート</text>
  </svg>`;
}

export const VARIANTS = { badge: logoBadge, rim: logoRim };
