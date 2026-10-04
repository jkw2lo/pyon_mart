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
export function hare(cx, cy, R, color, { at = 96, eye = '#ffffff', span = 84, gap = 0.06 } = {}) {
  const u = R / 60;
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
    pts.push(polar(cx, cy, a, Ro - keyed(belly, t) * u));
  }
  const body = 'M' + pts.map(([x, y]) => `${f(x)} ${f(y)}`).join(' L') + ' Z';
  const [hx, hy] = polar(cx, cy, back - 3, Ro - 10.5 * u);    // haunch
  const [nx, ny] = polar(cx, cy, front + 1, Ro - 6.5 * u);    // neck
  const [kx, ky] = polar(cx, cy, front - 6.5, Ro - 4 * u);     // head
  const [ex, ey] = polar(cx, cy, front - 9.5, Ro - 2 * u);     // eye
  const [tx, ty] = polar(cx, cy, back + 4, Ro - 3 * u);        // tail
  const headRot = -(front - 6.5) + 90 + 14;
  const g0 = R * (1 + gap);                                     // the feet's track, just above the moon
  const sw = (n) => f(n * u);
  return `<g fill="${color}" stroke="${color}" stroke-linecap="round" stroke-linejoin="round">
    <path d="${body}" stroke="none"/>
    <circle cx="${f(hx)}" cy="${f(hy)}" r="${sw(11)}" stroke="none"/>
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
export function logoRim({ size = 240 } = {}) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 240" width="${size}" height="${size}">
    <circle cx="120" cy="146" r="64" fill="${PALETTE.moonTint}"/>
    ${hare(120, 146, 64, PALETTE.bunny, { eye: PALETTE.moonTint })}
  </svg>`;
}

// The sign badge: rounded square, night sky, white moon, pale hare.
export function logoBadge({ size = 240 } = {}) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 240" width="${size}" height="${size}">
    <defs><clipPath id="pb"><rect x="6" y="6" width="228" height="228" rx="52"/></clipPath></defs>
    <g clip-path="url(#pb)">
      <rect x="0" y="0" width="240" height="240" fill="${PALETTE.slate}"/>
      <circle cx="120" cy="164" r="64" fill="${PALETTE.moon}"/>
      ${hare(120, 164, 64, PALETTE.bunnyLight, { eye: PALETTE.slate })}
      <rect x="0" y="194" width="240" height="46" fill="${PALETTE.slate}"/>
      <rect x="0" y="194" width="240" height="9" fill="${PALETTE.gold}"/>
    </g>
  </svg>`;
}

// Round coin version (app icon / stickers).
export function logoRing({ size = 240 } = {}) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 240" width="${size}" height="${size}">
    <circle cx="120" cy="120" r="114" fill="${PALETTE.slate}"/>
    <circle cx="120" cy="140" r="56" fill="${PALETTE.moon}"/>
    ${hare(120, 140, 56, PALETTE.bunnyLight, { eye: PALETTE.slate })}
  </svg>`;
}

// One-colour version, for packaging and stamps.
export function logoMono({ size = 240, color = PALETTE.slate } = {}) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 240" width="${size}" height="${size}">
    <circle cx="120" cy="146" r="64" fill="none" stroke="${color}" stroke-width="5"/>
    ${hare(120, 146, 64, color, { eye: '#ffffff', gap: 0.1 })}
  </svg>`;
}

// Horizontal lockup.
export function logoLockup({ width = 720, dark = false } = {}) {
  const ink = dark ? '#ffffff' : PALETTE.ink;
  const sub = dark ? PALETTE.bunnyLight : PALETTE.bunny;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 780 240" width="${width}" height="${width * 240 / 780}">
    <g transform="translate(6,0)">${dark ? `<circle cx="120" cy="146" r="60" fill="#fff"/>${hare(120, 146, 60, PALETTE.bunnyLight, { eye: PALETTE.slate })}` : `<circle cx="120" cy="146" r="64" fill="${PALETTE.moonTint}"/>${hare(120, 146, 64, PALETTE.bunny, { eye: PALETTE.moonTint })}`}</g>
    <text x="262" y="138" font-family="'M PLUS Rounded 1c','Zen Maru Gothic','Hiragino Maru Gothic ProN',sans-serif"
      font-weight="800" font-size="86" letter-spacing="1" fill="${ink}">PYON MART</text>
    <rect x="266" y="160" width="40" height="6" rx="3" fill="${PALETTE.gold}"/>
    <text x="318" y="178" font-family="'M PLUS Rounded 1c','Zen Maru Gothic',sans-serif"
      font-weight="700" font-size="32" letter-spacing="9" fill="${sub}">ぴょんマート</text>
  </svg>`;
}

export const VARIANTS = { rim: logoRim, badge: logoBadge, ring: logoRing, mono: logoMono };
