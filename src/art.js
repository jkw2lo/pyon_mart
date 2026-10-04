// Flat vector illustrations for packaging, drawn straight onto label canvases,
// plus the Pyon Mart brand marks preloaded as images for the store brand.
import { hare, logoBadge, PALETTE } from './logo.js';

const TAU = Math.PI * 2;

// --- brand art -------------------------------------------------------------------

export const brandArt = {};

function svgImage(svg) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  });
}

// Must be awaited before any label is drawn.
export async function preloadBrandArt() {
  const markOn = (fg, moon) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="20 40 200 180" width="400" height="360">
    <circle cx="120" cy="164" r="58" fill="${moon}"/>${hare(120, 164, 58, fg, { eye: moon })}</svg>`;
  const [badge, white, slate] = await Promise.all([
    svgImage(logoBadge({ size: 512 })),
    svgImage(markOn('#ffffff', 'rgba(255,255,255,0.28)')),
    svgImage(markOn(PALETTE.bunny, '#e7e9ee')),
  ]);
  Object.assign(brandArt, { badge, white, slate });
}

// --- helpers ---------------------------------------------------------------------

function blob(c, x, y, rx, ry, col, rot = 0) {
  c.fillStyle = col;
  c.beginPath();
  c.ellipse(x, y, rx, ry, rot, 0, TAU);
  c.fill();
}
function rr(c, x, y, w, h, r, col) {
  c.fillStyle = col;
  c.beginPath();
  c.roundRect(x, y, w, h, r);
  c.fill();
}
function shine(c, x, y, r) {
  c.save();
  c.globalAlpha = 0.35;
  blob(c, x - r * 0.35, y - r * 0.35, r * 0.28, r * 0.16, '#ffffff', -0.6);
  c.restore();
}
function leaf(c, x, y, s, col, rot = 0) {
  c.save();
  c.translate(x, y);
  c.rotate(rot);
  c.fillStyle = col;
  c.beginPath();
  c.moveTo(0, -s);
  c.quadraticCurveTo(s * 0.7, 0, 0, s);
  c.quadraticCurveTo(-s * 0.7, 0, 0, -s);
  c.fill();
  c.strokeStyle = 'rgba(255,255,255,0.5)';
  c.lineWidth = s * 0.06;
  c.beginPath();
  c.moveTo(0, -s * 0.85);
  c.lineTo(0, s * 0.85);
  c.stroke();
  c.restore();
}

// --- illustrations: draw(c, x, y, s) centred at (x, y), roughly s across ----------

const ART = {
  leaf(c, x, y, s, a) {
    leaf(c, x - s * 0.12, y, s * 0.42, a[0], -0.5);
    leaf(c, x + s * 0.16, y + s * 0.04, s * 0.36, a[1] || a[0], 0.55);
  },
  tea(c, x, y, s, a) {
    rr(c, x - s * 0.3, y - s * 0.05, s * 0.6, s * 0.38, s * 0.1, '#ffffff');
    rr(c, x - s * 0.24, y - s * 0.02, s * 0.48, s * 0.12, s * 0.05, a[0]);
    c.strokeStyle = '#ffffff'; c.lineWidth = s * 0.05;
    c.beginPath(); c.arc(x + s * 0.34, y + s * 0.12, s * 0.09, -1.4, 1.4); c.stroke();
    c.strokeStyle = 'rgba(255,255,255,0.7)'; c.lineWidth = s * 0.035;
    for (const dx of [-0.12, 0.04, 0.2]) { c.beginPath(); c.moveTo(x + dx * s, y - s * 0.12); c.bezierCurveTo(x + (dx - 0.08) * s, y - s * 0.25, x + (dx + 0.08) * s, y - s * 0.32, x + dx * s, y - s * 0.44); c.stroke(); }
    leaf(c, x - s * 0.38, y + s * 0.3, s * 0.14, a[1] || a[0], -1);
  },
  bean(c, x, y, s, a) {
    for (const [dx, dy, r] of [[-0.18, 0.05, -0.4], [0.16, -0.06, 0.5], [0.02, 0.22, 1.2]]) {
      blob(c, x + dx * s, y + dy * s, s * 0.2, s * 0.13, a[0], r);
      c.strokeStyle = a[1] || '#000'; c.lineWidth = s * 0.03;
      c.beginPath(); c.ellipse(x + dx * s, y + dy * s, s * 0.11, s * 0.02, r, 0, TAU); c.stroke();
    }
  },
  drop(c, x, y, s, a) {
    c.fillStyle = a[0];
    c.beginPath(); c.moveTo(x, y - s * 0.42);
    c.bezierCurveTo(x + s * 0.32, y - s * 0.02, x + s * 0.3, y + s * 0.36, x, y + s * 0.36);
    c.bezierCurveTo(x - s * 0.3, y + s * 0.36, x - s * 0.32, y - s * 0.02, x, y - s * 0.42); c.fill();
    shine(c, x + s * 0.02, y + s * 0.1, s * 0.3);
    c.strokeStyle = a[1] || a[0]; c.lineWidth = s * 0.03; c.globalAlpha = 0.5;
    for (const r of [0.48, 0.6]) { c.beginPath(); c.ellipse(x, y + s * 0.42, s * r * 0.6, s * r * 0.12, 0, 0, TAU); c.stroke(); }
    c.globalAlpha = 1;
  },
  fruit(c, x, y, s, a) { // round citrus / apple / peach depending on colours
    blob(c, x, y + s * 0.04, s * 0.32, s * 0.3, a[0]);
    shine(c, x, y, s * 0.3);
    leaf(c, x + s * 0.12, y - s * 0.3, s * 0.11, a[1] || '#3a8a3a', 0.9);
  },
  slice(c, x, y, s, a) { // citrus slice
    blob(c, x, y, s * 0.36, s * 0.36, a[1] || '#ffffff');
    blob(c, x, y, s * 0.31, s * 0.31, a[0]);
    c.strokeStyle = a[1] || '#ffffff'; c.lineWidth = s * 0.025;
    for (let i = 0; i < 8; i++) { const t = (i / 8) * TAU; c.beginPath(); c.moveTo(x, y); c.lineTo(x + Math.cos(t) * s * 0.3, y + Math.sin(t) * s * 0.3); c.stroke(); }
    blob(c, x, y, s * 0.05, s * 0.05, a[1] || '#ffffff');
  },
  grape(c, x, y, s, a) {
    const rows = [[0], [-0.5, 0.5], [-1, 0, 1], [-0.5, 0.5], [0]].reverse();
    rows.forEach((row, ri) => row.forEach((k) => { blob(c, x + k * s * 0.15, y - s * 0.24 + ri * s * 0.13, s * 0.085, s * 0.085, a[0]); shine(c, x + k * s * 0.15, y - s * 0.24 + ri * s * 0.13, s * 0.085); }));
    leaf(c, x + s * 0.12, y - s * 0.38, s * 0.12, a[1] || '#3a8a3a', 1.2);
  },
  strawberry(c, x, y, s, a) {
    c.fillStyle = a[0];
    c.beginPath(); c.moveTo(x - s * 0.3, y - s * 0.15);
    c.quadraticCurveTo(x, y - s * 0.32, x + s * 0.3, y - s * 0.15);
    c.quadraticCurveTo(x + s * 0.25, y + s * 0.25, x, y + s * 0.38);
    c.quadraticCurveTo(x - s * 0.25, y + s * 0.25, x - s * 0.3, y - s * 0.15); c.fill();
    c.fillStyle = '#ffe9a0';
    for (let i = 0; i < 9; i++) blob(c, x + ((i % 3) - 1) * s * 0.13 + (Math.floor(i / 3) % 2) * s * 0.05, y - s * 0.08 + Math.floor(i / 3) * s * 0.12, s * 0.018, s * 0.028, '#ffe9a0');
    for (const r of [-0.9, -0.3, 0.3, 0.9]) leaf(c, x + r * s * 0.12, y - s * 0.26, s * 0.1, '#3a9a3a', r * 1.2);
  },
  bubbles(c, x, y, s, a) {
    c.strokeStyle = a[0]; c.lineWidth = s * 0.035;
    for (const [dx, dy, r] of [[-0.2, 0.2, 0.12], [0.12, 0.05, 0.16], [-0.05, -0.22, 0.09], [0.26, -0.26, 0.07], [-0.3, -0.1, 0.06]]) {
      c.beginPath(); c.arc(x + dx * s, y + dy * s, r * s, 0, TAU); c.stroke();
      shine(c, x + dx * s, y + dy * s, r * s);
    }
  },
  milk(c, x, y, s, a) {
    c.fillStyle = a[0];
    c.beginPath(); c.moveTo(x - s * 0.42, y + s * 0.1);
    for (let i = 0; i <= 8; i++) { const t = i / 8; c.quadraticCurveTo(x - s * 0.42 + (t - 0.06) * s * 0.84, y - s * (i % 2 ? 0.28 : 0.02), x - s * 0.42 + t * s * 0.84, y + s * 0.02); }
    c.lineTo(x + s * 0.42, y + s * 0.4); c.lineTo(x - s * 0.42, y + s * 0.4); c.fill();
    for (const [dx, dy, r] of [[-0.2, -0.38, 0.05], [0.18, -0.42, 0.04], [0.02, -0.5, 0.03]]) blob(c, x + dx * s, y + dy * s, r * s, r * s, a[0]);
  },
  chips(c, x, y, s, a) {
    for (const [dx, dy, r] of [[-0.18, 0.08, -0.3], [0.16, 0.12, 0.4], [0, -0.12, 0.1]]) {
      c.save(); c.translate(x + dx * s, y + dy * s); c.rotate(r);
      c.fillStyle = a[0];
      c.beginPath(); c.moveTo(-s * 0.2, 0);
      c.bezierCurveTo(-s * 0.2, -s * 0.2, s * 0.22, -s * 0.18, s * 0.2, 0);
      c.bezierCurveTo(s * 0.2, s * 0.17, -s * 0.18, s * 0.16, -s * 0.2, 0); c.fill();
      c.strokeStyle = 'rgba(160,100,20,0.35)'; c.lineWidth = s * 0.015;
      c.beginPath(); c.moveTo(-s * 0.12, -s * 0.04); c.quadraticCurveTo(0, s * 0.04, s * 0.12, -s * 0.03); c.stroke();
      if (a[1]) for (let i = 0; i < 6; i++) blob(c, (Math.sin(i * 7) * 0.12) * s, (Math.cos(i * 5) * 0.07) * s, s * 0.018, s * 0.018, a[1]);
      c.restore();
    }
  },
  cracker(c, x, y, s, a) {
    for (const [dx, dy, r] of [[-0.12, 0.06, -0.2], [0.14, -0.06, 0.25]]) {
      c.save(); c.translate(x + dx * s, y + dy * s); c.rotate(r);
      blob(c, 0, 0, s * 0.24, s * 0.24, a[0]);
      blob(c, 0, 0, s * 0.2, s * 0.2, a[1] || '#d9a35a');
      if (a[2]) { c.fillStyle = a[2]; c.beginPath(); c.moveTo(-s * 0.2, s * 0.05); c.lineTo(s * 0.2, s * 0.05); c.lineTo(s * 0.2, s * 0.2); c.lineTo(-s * 0.2, s * 0.2); c.fill(); }
      c.restore();
    }
  },
  seeds(c, x, y, s, a) {
    for (let i = 0; i < 9; i++) {
      const t = i * 2.4, r = s * 0.06 * Math.sqrt(i + 1);
      c.save(); c.translate(x + Math.cos(t) * r, y + Math.sin(t) * r); c.rotate(t);
      blob(c, 0, 0, s * 0.1, s * 0.04, i % 4 === 0 ? (a[1] || '#d8b878') : a[0]);
      c.restore();
    }
  },
  shrimp(c, x, y, s, a) {
    c.strokeStyle = a[0]; c.lineCap = 'round';
    for (let i = 0; i < 6; i++) { c.lineWidth = s * (0.16 - i * 0.018); c.beginPath(); c.arc(x, y, s * 0.2, Math.PI * (0.9 + i * 0.13), Math.PI * (0.9 + (i + 1) * 0.13)); c.stroke(); }
    c.strokeStyle = 'rgba(255,255,255,0.6)'; c.lineWidth = s * 0.02;
    for (let i = 1; i < 6; i++) { const t = Math.PI * (0.9 + i * 0.13); c.beginPath(); c.moveTo(x + Math.cos(t) * s * 0.13, y + Math.sin(t) * s * 0.13); c.lineTo(x + Math.cos(t) * s * 0.27, y + Math.sin(t) * s * 0.27); c.stroke(); }
    leaf(c, x + s * 0.2, y + s * 0.02, s * 0.1, a[0], 0.3);
  },
  choco(c, x, y, s, a) {
    c.save(); c.translate(x, y); c.rotate(-0.25);
    rr(c, -s * 0.34, -s * 0.22, s * 0.68, s * 0.44, s * 0.04, a[0]);
    c.fillStyle = 'rgba(255,255,255,0.13)';
    for (let i = 0; i < 4; i++) for (let k = 0; k < 2; k++) rr(c, -s * 0.31 + i * s * 0.165, -s * 0.19 + k * s * 0.205, s * 0.14, s * 0.18, s * 0.02, 'rgba(255,255,255,0.14)');
    rr(c, -s * 0.36, s * 0.02, s * 0.72, s * 0.24, s * 0.02, a[1] || '#c4302b');
    c.restore();
  },
  sticks(c, x, y, s, a) {
    for (let i = 0; i < 5; i++) {
      c.save(); c.translate(x + (i - 2) * s * 0.1, y); c.rotate(-0.35 + i * 0.05);
      rr(c, -s * 0.03, -s * 0.4, s * 0.06, s * 0.8, s * 0.03, '#e8c27a');
      rr(c, -s * 0.036, -s * 0.4, s * 0.072, s * 0.55, s * 0.035, a[0]);
      c.restore();
    }
  },
  gummy(c, x, y, s, a) { // rabbit-shaped gummies, naturally
    for (const [dx, dy, i] of [[-0.18, 0.08, 0], [0.16, 0.12, 1], [0, -0.14, 2]]) {
      const col = a[i % a.length];
      const cx = x + dx * s, cy = y + dy * s;
      c.save(); c.globalAlpha = 0.9;
      blob(c, cx, cy, s * 0.12, s * 0.1, col);
      blob(c, cx - s * 0.05, cy - s * 0.14, s * 0.03, s * 0.08, col, -0.2);
      blob(c, cx + s * 0.04, cy - s * 0.14, s * 0.03, s * 0.08, col, 0.2);
      c.restore();
      shine(c, cx, cy, s * 0.1);
    }
  },
  candy(c, x, y, s, a) {
    for (const [dx, dy, i] of [[-0.16, 0.1, 0], [0.16, 0.0, 1], [0, -0.16, 0]]) {
      const cx = x + dx * s, cy = y + dy * s, col = a[i % a.length];
      c.fillStyle = col;
      c.beginPath(); c.moveTo(cx - s * 0.2, cy - s * 0.07); c.lineTo(cx - s * 0.1, cy); c.lineTo(cx - s * 0.2, cy + s * 0.07); c.fill();
      c.beginPath(); c.moveTo(cx + s * 0.2, cy - s * 0.07); c.lineTo(cx + s * 0.1, cy); c.lineTo(cx + s * 0.2, cy + s * 0.07); c.fill();
      blob(c, cx, cy, s * 0.1, s * 0.09, col);
      shine(c, cx, cy, s * 0.09);
    }
  },
  cookie(c, x, y, s, a) {
    for (const [dx, dy] of [[-0.12, 0.05], [0.14, -0.04]]) {
      blob(c, x + dx * s, y + dy * s, s * 0.22, s * 0.22, a[0]);
      for (let i = 0; i < 5; i++) blob(c, x + dx * s + Math.cos(i * 2.1) * s * 0.11, y + dy * s + Math.sin(i * 2.1) * s * 0.11, s * 0.03, s * 0.03, a[1] || '#5a3010');
    }
  },
  popcorn(c, x, y, s, a) {
    rr(c, x - s * 0.22, y, s * 0.44, s * 0.38, s * 0.03, a[1] || '#c4302b');
    c.fillStyle = '#ffffff';
    for (let i = 0; i < 3; i++) c.fillRect(x - s * 0.17 + i * s * 0.13, y, s * 0.06, s * 0.38);
    for (let i = 0; i < 9; i++) blob(c, x + ((i % 4) - 1.5) * s * 0.12, y - s * 0.04 - Math.floor(i / 4) * s * 0.1, s * 0.08, s * 0.07, a[0]);
  },
  bowl(c, x, y, s, a) {
    c.strokeStyle = 'rgba(255,255,255,0.75)'; c.lineWidth = s * 0.035; c.lineCap = 'round';
    for (const dx of [-0.14, 0, 0.14]) { c.beginPath(); c.moveTo(x + dx * s, y - s * 0.14); c.bezierCurveTo(x + (dx - 0.06) * s, y - s * 0.25, x + (dx + 0.06) * s, y - s * 0.3, x + dx * s, y - s * 0.42); c.stroke(); }
    blob(c, x, y + s * 0.0, s * 0.4, s * 0.1, a[1] || '#f2d9a8');
    c.strokeStyle = a[2] || '#f5e3a0'; c.lineWidth = s * 0.025;
    for (let i = 0; i < 6; i++) { c.beginPath(); c.moveTo(x - s * 0.3, y - s * 0.01 + i * s * 0.012); c.quadraticCurveTo(x, y + s * 0.06 * Math.sin(i), x + s * 0.3, y - s * 0.02 + i * s * 0.01); c.stroke(); }
    c.fillStyle = a[0];
    c.beginPath(); c.moveTo(x - s * 0.42, y); c.quadraticCurveTo(x - s * 0.4, y + s * 0.4, x, y + s * 0.4); c.quadraticCurveTo(x + s * 0.4, y + s * 0.4, x + s * 0.42, y); c.fill();
    c.fillStyle = 'rgba(255,255,255,0.85)'; c.fillRect(x - s * 0.2, y + s * 0.18, s * 0.4, s * 0.03);
  },
  fish(c, x, y, s, a) {
    blob(c, x, y, s * 0.3, s * 0.13, a[0]);
    c.fillStyle = a[0];
    c.beginPath(); c.moveTo(x + s * 0.24, y); c.lineTo(x + s * 0.42, y - s * 0.13); c.lineTo(x + s * 0.42, y + s * 0.13); c.fill();
    blob(c, x - s * 0.18, y - s * 0.03, s * 0.03, s * 0.03, '#ffffff');
    c.strokeStyle = 'rgba(255,255,255,0.45)'; c.lineWidth = s * 0.02;
    for (let i = 0; i < 3; i++) { c.beginPath(); c.arc(x - s * 0.05 + i * s * 0.08, y, s * 0.1, -1, 1); c.stroke(); }
  },
  rice(c, x, y, s, a) {
    c.fillStyle = '#ffffff';
    c.beginPath(); c.moveTo(x, y - s * 0.34); c.quadraticCurveTo(x + s * 0.06, y - s * 0.36, x + s * 0.34, y + s * 0.2); c.quadraticCurveTo(x + s * 0.36, y + s * 0.3, x, y + s * 0.3); c.quadraticCurveTo(x - s * 0.36, y + s * 0.3, x - s * 0.34, y + s * 0.2); c.quadraticCurveTo(x - s * 0.06, y - s * 0.36, x, y - s * 0.34); c.fill();
    rr(c, x - s * 0.2, y + s * 0.05, s * 0.4, s * 0.25, s * 0.02, '#1d2a1f');
    blob(c, x, y - s * 0.04, s * 0.07, s * 0.06, a[0]);
  },
  flame(c, x, y, s, a) {
    for (const [col, k] of [[a[0], 1], [a[1] || '#ffd23a', 0.6]]) {
      c.fillStyle = col;
      c.beginPath(); c.moveTo(x, y - s * 0.4 * k);
      c.bezierCurveTo(x + s * 0.32 * k, y - s * 0.1 * k, x + s * 0.24 * k, y + s * 0.34 * k, x, y + s * 0.34 * k);
      c.bezierCurveTo(x - s * 0.24 * k, y + s * 0.34 * k, x - s * 0.3 * k, y, x, y - s * 0.4 * k); c.fill();
    }
  },
  moon(c, x, y, s, a) { // tsukimi: dango pyramid under a full moon
    blob(c, x + s * 0.12, y - s * 0.14, s * 0.24, s * 0.24, a[0]);
    for (const [dx, dy] of [[-0.14, 0.26], [0.02, 0.26], [0.18, 0.26], [-0.06, 0.12], [0.1, 0.12], [0.02, -0.02]]) {
      blob(c, x + dx * s - s * 0.02, y + dy * s, s * 0.08, s * 0.075, '#ffffff');
      blob(c, x + dx * s - s * 0.02, y + dy * s + s * 0.02, s * 0.08, s * 0.03, 'rgba(0,0,0,0.06)');
    }
  },
  pudding(c, x, y, s, a) {
    c.fillStyle = a[0];
    c.beginPath(); c.moveTo(x - s * 0.22, y - s * 0.16); c.lineTo(x + s * 0.22, y - s * 0.16); c.lineTo(x + s * 0.32, y + s * 0.3); c.lineTo(x - s * 0.32, y + s * 0.3); c.fill();
    c.fillStyle = a[1] || '#7a3a10';
    c.beginPath(); c.moveTo(x - s * 0.22, y - s * 0.16); c.lineTo(x + s * 0.22, y - s * 0.16); c.lineTo(x + s * 0.24, y - s * 0.06); c.quadraticCurveTo(x + s * 0.1, y + s * 0.02, x, y - s * 0.04); c.quadraticCurveTo(x - s * 0.12, y + s * 0.02, x - s * 0.24, y - s * 0.06); c.fill();
    shine(c, x + s * 0.06, y + s * 0.1, s * 0.25);
  },
  mochi(c, x, y, s, a) {
    for (const dx of [-0.17, 0.17]) { blob(c, x + dx * s, y + s * 0.04, s * 0.22, s * 0.18, a[0]); blob(c, x + dx * s, y + s * 0.18, s * 0.2, s * 0.04, 'rgba(0,0,0,0.06)'); }
    c.save(); c.beginPath(); c.rect(x, y - s * 0.3, s * 0.5, s * 0.6); c.clip();
    blob(c, x + s * 0.17, y + s * 0.04, s * 0.11, s * 0.09, a[1] || '#5a2a2a');
    c.restore();
  },
  roll(c, x, y, s, a) {
    blob(c, x, y, s * 0.34, s * 0.3, a[0]);
    c.strokeStyle = a[1] || '#ffffff'; c.lineWidth = s * 0.08;
    c.beginPath();
    for (let t = 0; t < 12; t += 0.2) { const r = s * 0.02 * t; c.lineTo(x + Math.cos(t) * r, y + Math.sin(t) * r * 0.9); }
    c.stroke();
  },
  box(c, x, y, s, a) { // generic product box (daily goods)
    rr(c, x - s * 0.3, y - s * 0.22, s * 0.6, s * 0.44, s * 0.05, a[0]);
    rr(c, x - s * 0.3, y - s * 0.22, s * 0.6, s * 0.12, s * 0.05, a[1] || 'rgba(255,255,255,0.4)');
  },
  battery(c, x, y, s, a) {
    for (const dx of [-0.14, 0.14]) {
      rr(c, x + dx * s - s * 0.1, y - s * 0.3, s * 0.2, s * 0.62, s * 0.04, a[0]);
      rr(c, x + dx * s - s * 0.1, y - s * 0.3, s * 0.2, s * 0.2, s * 0.04, a[1] || '#ffd23a');
      rr(c, x + dx * s - s * 0.04, y - s * 0.36, s * 0.08, s * 0.06, s * 0.02, '#cccccc');
    }
  },
  sparkle(c, x, y, s, a) {
    c.fillStyle = a[0];
    for (const [dx, dy, k] of [[0, 0, 1], [0.28, -0.24, 0.45], [-0.26, 0.22, 0.35]]) {
      c.beginPath();
      for (let i = 0; i < 8; i++) { const t = (i / 8) * TAU, r = (i % 2 ? 0.08 : 0.3) * s * k; c.lineTo(x + dx * s + Math.cos(t) * r, y + dy * s + Math.sin(t) * r); }
      c.fill();
    }
  },
  can(c, x, y, s, a) { // a little glass for alcohol / drinks
    c.fillStyle = 'rgba(255,255,255,0.35)';
    c.beginPath(); c.moveTo(x - s * 0.2, y - s * 0.3); c.lineTo(x + s * 0.2, y - s * 0.3); c.lineTo(x + s * 0.16, y + s * 0.34); c.lineTo(x - s * 0.16, y + s * 0.34); c.fill();
    c.fillStyle = a[0];
    c.beginPath(); c.moveTo(x - s * 0.18, y - s * 0.12); c.lineTo(x + s * 0.18, y - s * 0.12); c.lineTo(x + s * 0.15, y + s * 0.32); c.lineTo(x - s * 0.15, y + s * 0.32); c.fill();
    for (let i = 0; i < 5; i++) blob(c, x + Math.sin(i * 3) * s * 0.1, y + s * (0.25 - i * 0.08), s * 0.018, s * 0.018, 'rgba(255,255,255,0.8)');
    if (a[1]) ART.slice(c, x + s * 0.24, y - s * 0.28, s * 0.32, [a[1], '#ffffff']);
  },
};

export function drawArt(c, kind, x, y, s, colors = ['#888']) {
  const fn = ART[kind];
  if (!fn) return;
  c.save();
  fn(c, x, y, s, colors);
  c.restore();
}

// A small round moon-and-hare stamp for the store brand.
export function drawMark(c, x, y, h, variant = 'white') {
  const img = brandArt[variant];
  if (img) c.drawImage(img, x, y, h * (400 / 360), h);
}
