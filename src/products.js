import * as THREE from 'three';
import { Label, FONTS, canvasTex } from './label.js';
import { drawArt, drawMark } from './art.js';

// Builds a product as a small Group (origin at the bottom centre, front facing +z)
// from a catalogue row. Labels are drawn on canvases so their text is hoverable.

const TAU = Math.PI * 2;

// ============================================================================
// Label designs. Each draws a front panel into the rectangle (x, y, w, h).
// ============================================================================

const titleFont = (def) =>
  def.style === 'tea' ? FONTS.mincho : def.style === 'pop' ? FONTS.pop : FONTS.round;

function pill(L, word, cx, cy, w, h, bg, fg = '#fff') {
  L.rect(cx - w / 2, cy - h / 2, w, h, bg, h / 2);
  L.text(word, cx, cy + h * 0.03, { size: h * 0.62, color: fg, maxW: w * 0.88 });
}

function burst(L, cx, cy, r, color, n = 14) {
  const c = L.ctx;
  c.fillStyle = color;
  c.beginPath();
  for (let i = 0; i < n * 2; i++) {
    const t = (i / (n * 2)) * TAU, rr = i % 2 ? r * 0.78 : r;
    c.lineTo(cx + Math.cos(t) * rr, cy + Math.sin(t) * rr);
  }
  c.fill();
}

function rays(L, cx, cy, r, color) {
  const c = L.ctx;
  c.save();
  c.globalAlpha = 0.16;
  c.fillStyle = color;
  for (let i = 0; i < 16; i++) {
    const t = (i / 16) * TAU;
    c.beginPath();
    c.moveTo(cx, cy);
    c.lineTo(cx + Math.cos(t) * r, cy + Math.sin(t) * r);
    c.lineTo(cx + Math.cos(t + 0.18) * r, cy + Math.sin(t + 0.18) * r);
    c.fill();
  }
  c.restore();
}

// Store-brand band: hare mark + brand wordmark, gold rule underneath.
function selectBand(L, def, x, y, w, bh) {
  L.rect(x, y, w, bh, def.band);
  L.rect(x, y + bh, w, Math.max(2, bh * 0.07), '#f2d675');
  const mh = bh * 0.8;
  const tw = Math.min(w * 0.62, bh * 3.2);
  const total = mh * 1.15 + tw;
  const mx = x + (w - total) / 2;
  drawMark(L.ctx, mx, y + bh * 0.1, mh, def.band);
  L.text(def.brand, mx + mh * 1.15, y + bh * 0.53, { size: bh * 0.44, color: '#fff', font: FONTS.round, align: 'left', maxW: tw });
}

function design(L, def, x, y, w, h, { compact = false } = {}) {
  const c = L.ctx;
  const land = w > h * 1.35;
  const vertical = def.style === 'tea' && (def.vertical ?? def.shape === 'pet');
  const art = !compact && def.art;
  const cx = x + w / 2;

  // backgrounds and frames per style
  if (def.style === 'select') {
    L.rect(x, y, w, h, def.bg);
    const bh = land ? h * 0.24 : Math.min(h * 0.17, w * 0.24);
    selectBand(L, def, x, y, w, bh);
    // soft moon behind the illustration
    if (!compact && h > w * 0.9) {
      // faint polka of little moons, the store-brand texture
      c.save();
      c.globalAlpha = 0.09;
      c.fillStyle = def.fg;
      const step = w / 7;
      for (let yy = y + bh * 1.6; yy < y + h * 0.95; yy += step) for (let xx = x + step / 2 + ((yy / step) % 2) * step / 2; xx < x + w; xx += step) { c.beginPath(); c.arc(xx, yy, step * 0.09, 0, TAU); c.fill(); }
      c.restore();
      // footer rule
      L.rect(x + w * 0.38, y + h * 0.965, w * 0.24, Math.max(2, h * 0.006), def.band);
    }
    if (art) L.circle(land ? x + w * 0.23 : cx, land ? y + h * 0.62 : y + h * 0.44, Math.min(w, h) * (land ? 0.27 : 0.23), def.bg);
    if (art) L.circle(land ? x + w * 0.23 : cx, land ? y + h * 0.62 : y + h * 0.44, Math.min(w, h) * (land ? 0.27 : 0.23), def.accent + '40');
    y += bh * 1.07;
    h -= bh * 1.07;
  } else if (def.style === 'pop') {
    L.rect(x, y, w, h, def.bg);
    rays(L, land ? x + w * 0.25 : cx, land ? y + h * 0.55 : y + h * 0.5, Math.max(w, h), '#ffffff');
    L.text(def.brand, cx, y + h * 0.075, { size: Math.min(h * 0.06, w * 0.09), color: def.fg, font: FONTS.gothic, maxW: w * 0.8 });
  } else if (def.style === 'tea') {
    const g = c.createLinearGradient(0, y, 0, y + h);
    g.addColorStop(0, def.bg);
    g.addColorStop(1, def.accent + '55');
    c.fillStyle = g;
    c.fillRect(x, y, w, h);
    c.strokeStyle = def.fg + '30';
    c.lineWidth = Math.max(1, w * 0.004);
    for (let i = 0; i < 9; i++) { c.beginPath(); c.moveTo(x, y + h * (0.1 + i * 0.1)); c.bezierCurveTo(x + w * 0.3, y + h * (0.06 + i * 0.1), x + w * 0.7, y + h * (0.14 + i * 0.1), x + w, y + h * (0.1 + i * 0.1)); c.stroke(); }
  } else if (def.style === 'dark') {
    L.rect(x, y, w, h, def.bg);
    c.strokeStyle = def.accent;
    c.lineWidth = Math.max(2, w * 0.012);
    c.strokeRect(x + w * 0.05, y + h * 0.04, w * 0.9, h * 0.92);
  } else {
    // clean
    L.rect(x, y, w, h, def.bg);
    c.fillStyle = def.accent;
    c.beginPath(); c.moveTo(x, y + h * 0.84); c.lineTo(x + w, y + h * 0.74); c.lineTo(x + w, y + h); c.lineTo(x, y + h); c.fill();
    c.fillStyle = def.accent + '66';
    c.beginPath(); c.moveTo(x, y + h * 0.8); c.lineTo(x + w, y + h * 0.7); c.lineTo(x + w, y + h * 0.73); c.lineTo(x, y + h * 0.83); c.fill();
  }

  const brandOnTop = def.style !== 'select' && def.style !== 'pop';
  const font = titleFont(def);
  const dark = def.style === 'pop' && def.bg !== '#ffffff' ? '#00000055' : null;

  if (land) {
    if (brandOnTop) L.text(def.brand, cx, y + h * 0.12, { size: h * 0.1, color: def.fg, font: FONTS.gothic, maxW: w * 0.8 });
    if (art) drawArt(c, def.art, x + w * 0.24, y + h * 0.58, Math.min(w * 0.36, h * 0.75), def.artColors);
    const tx = art ? x + w * 0.64 : cx, tw = art ? w * 0.6 : w * 0.9;
    L.text(def.title, tx, y + h * 0.47, { size: h * 0.24, color: def.fg, font, maxW: tw, stroke: dark ? def.bg : null, strokeW: h * 0.03 });
    if (def.sub) L.text(def.sub, tx, y + h * 0.72, { size: h * 0.11, color: def.fg, font: FONTS.gothic, maxW: tw });
    if (def.badge) pill(L, def.badge, x + w * 0.86, y + h * 0.14, w * 0.22, h * 0.13, '#c4302b');
    return;
  }

  if (vertical) {
    L.text(def.brand, cx, y + h * 0.075, { size: Math.min(h * 0.06, w * 0.1), color: def.fg, font: FONTS.mincho, maxW: w * 0.86 });
    if (art) drawArt(c, def.art, x + w * 0.24, y + h * 0.78, Math.min(w, h) * 0.28, def.artColors);
    const n = [...def.title.jp].length;
    const size = Math.min(w * 0.36, (h * 0.66) / n);
    L.vtext(def.title, cx + w * 0.06, y + h * 0.15, { size, color: def.fg, font: FONTS.mincho });
    if (def.sub) L.vtext(def.sub, x + w * 0.84, y + h * 0.18, { size: Math.min(w * 0.09, (h * 0.5) / [...def.sub.jp].length), color: def.fg, font: FONTS.gothic, weight: 500 });
    if (def.note) L.text(def.note, x + w * 0.2, y + h * 0.94, { size: h * 0.045, color: def.fg, weight: 500 });
    return;
  }

  if (brandOnTop) L.text(def.brand, cx, y + h * 0.085, { size: Math.min(h * 0.065, w * 0.09), color: def.fg, font: def.style === 'tea' ? FONTS.mincho : FONTS.gothic, maxW: w * 0.84 });
  if (art) drawArt(c, def.art, cx, y + h * (def.style === 'select' ? 0.3 : 0.62), Math.min(w * 0.62, h * 0.42), def.artColors);
  const ty = def.style === 'select' ? (art ? 0.66 : 0.4) : 0.3;
  L.text(def.title, cx, y + h * ty, {
    size: Math.min(h * (compact ? 0.26 : 0.17), w * 0.34), color: def.fg, font, maxW: w * 0.9,
    stroke: dark ? '#ffffff' : null, strokeW: h * 0.018,
  });
  if (def.sub) L.text(def.sub, cx, y + h * (ty + (compact ? 0.24 : 0.13)), { size: Math.min(h * (compact ? 0.13 : 0.065), w * 0.1), color: def.style === 'select' ? '#555' : def.fg, font: FONTS.gothic, maxW: w * 0.88 });
  if (def.badge && !compact) {
    if (def.style === 'pop') {
      const r = Math.min(w, h) * 0.13;
      burst(L, x + w - r * 1.05, y + h * 0.17 + r, r, '#ffd23a');
      L.text(def.badge, x + w - r * 1.05, y + h * 0.17 + r, { size: r * 0.42, color: '#c4302b', maxW: r * 1.5 });
    } else {
      pill(L, def.badge, cx, y + h * (def.style === 'select' ? 0.9 : 0.47), w * 0.7, Math.min(h * 0.07, w * 0.1), def.style === 'select' ? def.fg : def.accent);
    }
  }
  if (def.note) L.text(def.note, x + w * 0.92, y + h * 0.955, { size: Math.min(h * 0.045, w * 0.07), color: def.style === 'clean' ? '#ffffff' : def.fg, align: 'right', weight: 500 });
}

// Back of pack: name, ingredients-style lines, nutrition box, barcode, recycle mark.
function backPanel(L, def, x, y, w, h) {
  const c = L.ctx;
  const cx = x + w / 2;
  L.rect(x, y, w, h, def.style === 'select' ? def.bg : def.bg);
  L.rect(x + w * 0.07, y + h * 0.06, w * 0.86, h * 0.88, 'rgba(255,255,255,0.9)', 8);
  L.text(def.title, cx, y + h * 0.14, { size: Math.min(h * 0.07, w * 0.12), color: '#333', maxW: w * 0.78 });
  L.text(def.brand, cx, y + h * 0.23, { size: Math.min(h * 0.045, w * 0.08), color: '#666', maxW: w * 0.78, weight: 500 });
  c.fillStyle = '#b4b4b4';
  for (let i = 0; i < 5; i++) c.fillRect(x + w * 0.14, y + h * (0.31 + i * 0.045), w * (0.72 - (i % 3) * 0.12), Math.max(2, h * 0.014));
  c.strokeStyle = '#888';
  c.lineWidth = 1.5;
  c.strokeRect(x + w * 0.14, y + h * 0.56, w * 0.5, h * 0.2);
  c.fillStyle = '#c4c4c4';
  for (let i = 0; i < 4; i++) c.fillRect(x + w * 0.17, y + h * (0.59 + i * 0.04), w * 0.4, Math.max(2, h * 0.01));
  // recycle mark
  c.strokeStyle = '#666';
  c.lineWidth = Math.max(1.5, w * 0.008);
  c.beginPath();
  c.arc(x + w * 0.76, y + h * 0.65, Math.min(w, h) * 0.06, 0, TAU);
  c.stroke();
  // barcode
  c.fillStyle = '#111';
  for (let i = 0; i < 40; i++) if ((i * 7) % 5 > 1) c.fillRect(x + w * 0.28 + i * w * 0.011, y + h * 0.82, w * (i % 3 ? 0.005 : 0.008), h * 0.08);
}

function wrapLabel(def, circ, height) {
  const W = 1024, H = Math.max(96, Math.round((height / circ) * W));
  const L = new Label(W, H);
  const fw = W * 0.36;
  // the whole wrap carries the brand's colours so the sides read as one design
  L.rect(0, 0, W, H, def.bg);
  if (def.style === 'select') {
    const bh = Math.min(H * 0.17, fw * 0.24);
    L.rect(0, 0, W, bh, def.band);
    L.rect(0, bh, W, Math.max(2, bh * 0.07), '#f2d675');
  }
  design(L, def, W / 2 - fw / 2, 0, fw, H);
  backPanel(L, def, W * 0.02, 0, W * 0.2, H);
  backPanel(L, def, W * 0.78, 0, W * 0.2, H);
  return L;
}

function flatLabel(def, w, h, { back = false, res = 640, compact = false } = {}) {
  const W = w >= h ? res : Math.round((res * w) / h);
  const H = w >= h ? Math.round((res * h) / w) : res;
  const L = new Label(W, H);
  if (back) backPanel(L, def, 0, 0, W, H);
  else design(L, def, 0, 0, W, H, { compact });
  return L;
}

// ============================================================================
// Shared materials
// ============================================================================

const plain = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.6, ...o });
let crinkle;
function crinkleMap() {
  if (crinkle) return crinkle;
  crinkle = canvasTex(256, 256, (c, w, h) => {
    c.fillStyle = '#808080';
    c.fillRect(0, 0, w, h);
    for (let i = 0; i < 140; i++) {
      c.strokeStyle = Math.random() < 0.5 ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.25)';
      c.lineWidth = 1 + Math.random() * 3;
      c.beginPath();
      const x = Math.random() * w, y = Math.random() * h;
      c.moveTo(x, y);
      c.lineTo(x + (Math.random() - 0.5) * 80, y + (Math.random() - 0.5) * 30);
      c.stroke();
    }
  }, { srgb: false });
  return crinkle;
}
const clearPlastic = () => new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.08, metalness: 0, transparent: true, opacity: 0.22, depthWrite: false });

// ============================================================================
// Shape builders
// ============================================================================

function pet(def) {
  const g = new THREE.Group();
  const r = 0.034, h = 0.21;
  // ribbed base, smooth label zone, grip waist, shoulder and neck
  const prof = [[0.0, 0], [0.024, 0], [0.031, 0.003], [0.034, 0.01]];
  for (let i = 0; i < 4; i++) prof.push([0.034 - (i % 2) * 0.0018, 0.016 + i * 0.008]);
  prof.push([0.034, 0.048], [0.034, 0.138], [0.0325, 0.152], [0.027, 0.17], [0.018, 0.186], [0.0142, 0.192], [0.0142, 0.199]);
  const pts = prof.map(([x, y]) => new THREE.Vector2(x, y));
  const shell = new THREE.Mesh(new THREE.LatheGeometry(pts, 40), new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.05, transparent: true, opacity: 0.2, depthWrite: false }));
  shell.renderOrder = 2;
  g.add(shell);
  const fill = 0.168;
  const inner = pts.filter((p) => p.y <= fill).map((p) => new THREE.Vector2(Math.max(0, p.x - 0.0015), p.y));
  inner.push(new THREE.Vector2(inner[inner.length - 1].x, fill), new THREE.Vector2(0, fill));
  const liquid = new THREE.Mesh(new THREE.LatheGeometry(inner, 32), new THREE.MeshStandardMaterial({ color: def.liquid, roughness: 0.15, transparent: true, opacity: def.clear ? 0.25 : 0.9 }));
  liquid.renderOrder = 1;
  g.add(liquid);
  const lh = 0.088, ly = 0.05;
  const L = wrapLabel(def, TAU * r, lh);
  const label = new THREE.Mesh(new THREE.CylinderGeometry(r + 0.0007, r + 0.0007, lh, 48, 1, true, Math.PI), L.material({ roughness: 0.32 }));
  label.position.y = ly + lh / 2;
  g.add(label);
  const capMat = plain(def.style === 'select' ? def.band : def.accent, { roughness: 0.45 });
  const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.0152, 0.0152, 0.017, 28), capMat);
  cap.position.y = 0.2075;
  g.add(cap);
  const ring = new THREE.Mesh(new THREE.CylinderGeometry(0.0158, 0.0158, 0.003, 28), capMat);
  ring.position.y = 0.1985;
  g.add(ring);
  return g;
}

function can(def) {
  const g = new THREE.Group();
  const small = def.size === 'small';
  const r = small ? 0.0265 : 0.033, h = small ? 0.105 : 0.122;
  const L = wrapLabel(def, TAU * r, h * 0.86);
  const metal = plain('#d5d9de', { metalness: 0.95, roughness: 0.28 });
  const body = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h * 0.86, 44, 1, true, Math.PI), L.material({ metalness: 0.5, roughness: 0.3 }));
  body.position.y = h * 0.5;
  g.add(body);
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.84, r, h * 0.06, 44, 1, true), metal);
  neck.position.y = h * 0.96;
  g.add(neck);
  const lid = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.8, r * 0.8, 0.002, 40), metal);
  lid.position.y = h * 0.985;
  g.add(lid);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(r * 0.84, 0.0016, 8, 40), metal);
  rim.rotation.x = Math.PI / 2;
  rim.position.y = h * 0.992;
  g.add(rim);
  const tab = new THREE.Mesh(new THREE.BoxGeometry(r * 0.32, 0.0014, r * 0.55), metal);
  tab.position.set(0, h * 0.99, r * 0.22);
  g.add(tab);
  const base = new THREE.Mesh(new THREE.CylinderGeometry(r, r * 0.82, h * 0.07, 44), metal);
  base.position.y = h * 0.035;
  g.add(base);
  return g;
}

function carton(def) {
  const g = new THREE.Group();
  const s = 0.072, h = 0.15;
  const front = flatLabel(def, s, h).material({ roughness: 0.5 });
  const back = flatLabel(def, s, h, { back: true }).material({ roughness: 0.5 });
  const side = def.style === 'select' ? flatSide(def, s, h) : plain(def.bg, { roughness: 0.5 });
  const top = plain('#f6f6f4', { roughness: 0.5 });
  const body = new THREE.Mesh(new THREE.BoxGeometry(s, h, s), [side, side, top, top, front, back]);
  body.position.y = h / 2;
  g.add(body);
  const tri = new THREE.Shape([new THREE.Vector2(-s / 2, 0), new THREE.Vector2(s / 2, 0), new THREE.Vector2(0, 0.028)]);
  const gable = new THREE.Mesh(new THREE.ExtrudeGeometry(tri, { depth: s, bevelEnabled: false }), plain(def.style === 'select' ? def.band : def.bg, { roughness: 0.5 }));
  gable.rotation.y = Math.PI / 2;
  gable.position.set(-s / 2, h, 0);
  g.add(gable);
  const fin = new THREE.Mesh(new THREE.BoxGeometry(s, 0.012, 0.004), gable.material);
  fin.position.y = h + 0.032;
  g.add(fin);
  return g;
}

// Side panel for store-brand boxes: band at the top so the brand wraps round.
function flatSide(def, w, h) {
  const L = new Label(128, Math.round((128 * h) / w));
  L.rect(0, 0, L.w, L.h, def.bg);
  const bh = Math.min(L.h * 0.17, L.w * 0.24);
  L.rect(0, 0, L.w, bh, def.band);
  L.rect(0, bh, L.w, Math.max(2, bh * 0.07), '#f2d675');
  return L.material({ roughness: 0.5 });
}

function roundedTriangle(side, rad) {
  const h = (side * Math.sqrt(3)) / 2;
  const pts = [new THREE.Vector2(0, h * 0.62), new THREE.Vector2(-side / 2, -h * 0.38), new THREE.Vector2(side / 2, -h * 0.38)];
  const sh = new THREE.Shape();
  for (let i = 0; i < 3; i++) {
    const p = pts[i], prev = pts[(i + 2) % 3], next = pts[(i + 1) % 3];
    const a = p.clone().add(prev.clone().sub(p).setLength(rad));
    const b = p.clone().add(next.clone().sub(p).setLength(rad));
    if (i === 0) sh.moveTo(a.x, a.y);
    else sh.lineTo(a.x, a.y);
    sh.quadraticCurveTo(p.x, p.y, b.x, b.y);
  }
  sh.closePath();
  return { shape: sh, h };
}

function triangleLabel(side, h, draw) {
  const L = new Label(512, Math.round((512 * h) / side));
  const c = L.ctx;
  c.save();
  c.beginPath();
  c.moveTo(L.w / 2, 0);
  c.lineTo(L.w, L.h);
  c.lineTo(0, L.h);
  c.closePath();
  c.clip();
  draw(L, c);
  c.restore();
  return L;
}

function onigiri(def) {
  const g = new THREE.Group();
  const side = 0.105, depth = 0.034;
  const { shape, h } = roundedTriangle(side, 0.014);
  const rice = new THREE.MeshPhysicalMaterial({ color: def.rice || '#f6f3ea', roughness: 0.6, clearcoat: 1, clearcoatRoughness: 0.12 });
  const body = new THREE.Mesh(new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: true, bevelSize: 0.004, bevelThickness: 0.004, bevelSegments: 3, curveSegments: 6 }), rice);
  body.position.set(0, h * 0.38 + 0.004, -depth / 2);
  g.add(body);
  const L = triangleLabel(side, h, (L, c) => {
    c.clearRect(0, 0, L.w, L.h);
    if (def.nori !== false) { c.fillStyle = '#1b261d'; c.fillRect(0, L.h * 0.6, L.w, L.h); }
    // grains of rice through the wrapper
    c.fillStyle = 'rgba(255,255,255,0.35)';
    for (let i = 0; i < 160; i++) c.fillRect(Math.random() * L.w, Math.random() * L.h * 0.6, 5, 2);
    // tear strip in the store's gold, numbered 1-2-3 like the real thing
    c.fillStyle = '#f2d675';
    c.fillRect(L.w * 0.455, 0, L.w * 0.09, L.h);
    c.fillStyle = '#2b3140';
    c.font = '800 22px sans-serif';
    c.textAlign = 'center';
    c.fillText('1', L.w / 2, L.h * 0.13);
    // the sticker: store-brand band + filling name
    const sx = L.w * 0.24, sy = L.h * 0.35, sw = L.w * 0.52, sh = L.h * 0.36;
    L.rect(sx, sy, sw, sh, '#ffffff', 10);
    design(L, def, sx, sy, sw, sh, { compact: true });
    if (def.badge) pill(L, def.badge, L.w / 2, L.h * 0.29, L.w * 0.26, L.h * 0.07, '#c4302b');
  });
  const mat = L.material({ transparent: true, alphaTest: 0.05, roughness: 0.25 });
  const plane = new THREE.Mesh(new THREE.PlaneGeometry(side, h), mat);
  plane.position.set(0, h / 2 + 0.004, depth / 2 + 0.0045);
  g.add(plane);
  const backPlane = plane.clone();
  backPlane.rotation.y = Math.PI;
  backPlane.position.z = -depth / 2 - 0.0045;
  g.add(backPlane);
  return g;
}

function sandwich(def) {
  const g = new THREE.Group();
  const side = 0.13, depth = 0.06;
  const { shape, h } = roundedTriangle(side, 0.008);
  const crust = new THREE.MeshPhysicalMaterial({ color: '#efe0bf', roughness: 0.7, clearcoat: 1, clearcoatRoughness: 0.15 });
  const body = new THREE.Mesh(new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: false }), crust);
  body.position.set(0, h * 0.38, -depth / 2);
  g.add(body);
  const L = triangleLabel(side, h, (L, c) => {
    c.fillStyle = '#f7ecd2';
    c.fillRect(0, 0, L.w, L.h);
    c.fillStyle = '#e8d6b0';
    c.fillRect(0, 0, L.w, L.h * 0.04);
    c.fillStyle = def.filling;
    c.fillRect(0, L.h * 0.4, L.w, L.h * 0.2);
    if (def.fruit) for (let i = 0; i < 6; i++) { c.fillStyle = ['#e8344f', '#ffb03a', '#7ac04a'][i % 3]; c.beginPath(); c.arc(L.w * (0.25 + i * 0.1), L.h * 0.5, L.h * 0.06, 0, TAU); c.fill(); }
    c.fillStyle = '#ead9b0';
    for (let i = 0; i < 160; i++) c.fillRect(Math.random() * L.w, Math.random() * L.h, 3, 3);
    const sx = L.w * 0.27, sy = L.h * 0.66, sw = L.w * 0.46, sh = L.h * 0.3;
    L.rect(sx, sy, sw, sh, '#ffffff', 8);
    design(L, def, sx, sy, sw, sh, { compact: true });
  });
  const plane = new THREE.Mesh(new THREE.PlaneGeometry(side, h), L.material({ transparent: true, alphaTest: 0.05, roughness: 0.22 }));
  plane.position.set(0, h / 2, depth / 2 + 0.0008);
  g.add(plane);
  return g;
}

function drawFood(c, kind, x, y, w, h) {
  const blob = (bx, by, r, col, k = 0.8) => { c.fillStyle = col; c.beginPath(); c.ellipse(bx, by, r, r * k, Math.random() * 3, 0, TAU); c.fill(); };
  c.fillStyle = '#111'; c.fillRect(x, y, w, h);
  if (kind === 'soba') {
    c.fillStyle = '#2b3a4a'; c.fillRect(x, y, w, h);
    c.strokeStyle = '#7a6a52'; c.lineWidth = 5;
    for (let i = 0; i < 80; i++) { c.beginPath(); c.moveTo(x + Math.random() * w * 0.65, y + Math.random() * h); c.bezierCurveTo(x + Math.random() * w * 0.65, y + Math.random() * h, x + Math.random() * w * 0.65, y + Math.random() * h, x + Math.random() * w * 0.65, y + Math.random() * h); c.stroke(); }
    blob(x + w * 0.82, y + h * 0.35, h * 0.2, '#1d1a14', 1);
    blob(x + w * 0.82, y + h * 0.75, h * 0.1, '#7aa04a');
    return;
  }
  if (kind === 'pasta') {
    c.fillStyle = '#f2f0ea'; c.fillRect(x, y, w, h);
    c.strokeStyle = '#d9542b'; c.lineWidth = 6;
    for (let i = 0; i < 90; i++) { c.beginPath(); c.moveTo(x + Math.random() * w, y + Math.random() * h); c.quadraticCurveTo(x + Math.random() * w, y + Math.random() * h, x + Math.random() * w, y + Math.random() * h); c.stroke(); }
    for (let i = 0; i < 10; i++) blob(x + Math.random() * w, y + Math.random() * h, h * 0.05, i % 2 ? '#3a8a3a' : '#b8432a');
    return;
  }
  c.fillStyle = '#f7f5ee'; c.fillRect(x + w * 0.03, y + h * 0.05, w * 0.47, h * 0.9);
  c.fillStyle = '#e8e4d8'; for (let i = 0; i < 400; i++) c.fillRect(x + w * 0.03 + Math.random() * w * 0.47, y + h * 0.05 + Math.random() * h * 0.9, 4, 2);
  if (kind === 'nori') {
    c.fillStyle = '#1b261d'; c.fillRect(x + w * 0.03, y + h * 0.05, w * 0.47, h * 0.9);
    blob(x + w * 0.66, y + h * 0.3, h * 0.18, '#e8c27a', 0.5);
    blob(x + w * 0.86, y + h * 0.3, h * 0.12, '#c48a3a');
    blob(x + w * 0.75, y + h * 0.72, h * 0.15, '#f2d16a', 0.6);
    return;
  }
  if (kind === 'yakiniku') {
    for (let i = 0; i < 9; i++) blob(x + w * (0.08 + (i % 3) * 0.14), y + h * (0.2 + Math.floor(i / 3) * 0.28), h * 0.13, ['#6a2a1a', '#7a3a20', '#5a2010'][i % 3], 0.5);
    blob(x + w * 0.72, y + h * 0.35, h * 0.2, '#7ab84a');
    blob(x + w * 0.78, y + h * 0.75, h * 0.12, '#e8a23a');
    return;
  }
  if (kind === 'makunouchi') {
    c.fillStyle = '#111'; for (let i = 0; i < 24; i++) c.fillRect(x + w * 0.05 + Math.random() * w * 0.42, y + h * 0.1 + Math.random() * h * 0.8, 3, 3);
    blob(x + w * 0.26, y + h * 0.5, h * 0.07, '#b3243a');
    blob(x + w * 0.66, y + h * 0.25, h * 0.14, '#e88a5a');
    blob(x + w * 0.86, y + h * 0.25, h * 0.1, '#f2d16a');
    blob(x + w * 0.66, y + h * 0.7, h * 0.1, '#7a4a2a');
    blob(x + w * 0.86, y + h * 0.72, h * 0.12, '#6a9a3a');
    return;
  }
  blob(x + w * 0.26, y + h * 0.5, h * 0.07, '#b3243a');
  for (let i = 0; i < 5; i++) blob(x + w * (0.62 + (i % 2) * 0.2), y + h * (0.22 + Math.floor(i / 2) * 0.3), h * 0.15, ['#b8732f', '#a5622a', '#c4843a'][i % 3]);
  blob(x + w * 0.9, y + h * 0.85, h * 0.08, '#7ab84a');
}

function bento(def) {
  const g = new THREE.Group();
  const w = 0.21, d = 0.155, h = 0.045;
  const tray = new THREE.Mesh(new THREE.BoxGeometry(w, h * 0.7, d), plain('#151515', { roughness: 0.35 }));
  tray.position.y = (h * 0.7) / 2;
  g.add(tray);
  const L = new Label(768, Math.round((768 * d) / w));
  drawFood(L.ctx, def.food, 0, 0, L.w, L.h);
  const sx = L.w * 0.06, sy = L.h * 0.58, sw = L.w * 0.5, sh = L.h * 0.36;
  design(L, def, sx, sy, sw, sh);
  L.text(`¥${def.price}`, sx + sw + L.w * 0.14, sy + sh * 0.6, { size: sh * 0.3, color: '#fff', stroke: '#c4302b', strokeW: 10 });
  const food = new THREE.Mesh(new THREE.PlaneGeometry(w * 0.97, d * 0.97), L.material({ roughness: 0.4 }));
  food.rotation.x = -Math.PI / 2;
  food.position.y = h * 0.7 + 0.0008;
  g.add(food);
  const lid = new THREE.Mesh(new THREE.BoxGeometry(w * 1.01, h * 0.45, d * 1.01), clearPlastic());
  lid.position.y = h * 0.7 + (h * 0.45) / 2;
  lid.userData.noHit = true;
  g.add(lid);
  return g;
}

function pillow(w, h, d, segX = 12, segY = 14) {
  const geo = new THREE.BoxGeometry(w, h, d, segX, segY, 2);
  const p = geo.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i) / (w / 2), y = p.getY(i) / (h / 2), z = p.getZ(i);
    const k = (1 - Math.pow(Math.abs(x), 3)) * (1 - Math.pow(Math.abs(y), 4));
    p.setZ(i, z * (0.15 + 0.85 * Math.max(0, k)));
  }
  geo.computeVertexNormals();
  return geo;
}

function bag(def) {
  const g = new THREE.Group();
  const [w, h, d] = def.size === 'small' ? [0.12, 0.16, 0.035] : def.size === 'bar' ? [0.075, 0.19, 0.022] : def.size === 'sachet' ? [0.1, 0.15, 0.008] : [0.17, 0.235, 0.065];
  const foil = { roughness: 0.3, metalness: 0.25, bumpMap: crinkleMap(), bumpScale: 0.8 };
  const front = flatLabel(def, w, h).material(foil);
  const back = flatLabel(def, w, h, { back: true }).material(foil);
  const side = plain(def.style === 'select' ? def.band : def.bg, foil);
  const body = new THREE.Mesh(pillow(w, h, d), [side, side, side, side, front, back]);
  body.position.y = h / 2 + 0.012;
  g.add(body);
  for (const y of [0.006, h + 0.018]) {
    const seal = new THREE.Mesh(new THREE.BoxGeometry(w, 0.012, 0.004), side);
    seal.position.y = y;
    g.add(seal);
  }
  return g;
}

function box(def) {
  const g = new THREE.Group();
  const [w, h, d] = def.dims;
  const side = def.style === 'select' ? flatSide(def, d, h) : plain(def.bg, { roughness: 0.45 });
  let mats;
  if (def.top) {
    const top = flatLabel(def, w, d).material({ roughness: 0.4 });
    const band = flatLabel(def, w, h, { compact: true }).material({ roughness: 0.4 });
    mats = [side, side, top, side, band, side];
  } else {
    mats = [side, side, plain(def.style === 'select' ? def.band : def.bg), side, flatLabel(def, w, h).material({ roughness: 0.4 }), flatLabel(def, w, h, { back: true }).material({ roughness: 0.45 })];
  }
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mats);
  m.position.y = h / 2;
  g.add(m);
  return g;
}

// Clear tray with the goods visible on top (roll cake, daifuku).
function tray(def) {
  const g = new THREE.Group();
  const [w, h, d] = def.dims;
  const base = new THREE.Mesh(new THREE.BoxGeometry(w, h * 0.35, d), plain('#ffffff', { roughness: 0.4 }));
  base.position.y = h * 0.175;
  g.add(base);
  const lid = new THREE.Mesh(new THREE.BoxGeometry(w * 1.02, h * 0.68, d * 1.02), clearPlastic());
  lid.position.y = h * 0.35 + h * 0.32;
  lid.userData.noHit = true;
  g.add(lid);
  const top = new THREE.Mesh(new THREE.PlaneGeometry(w, d), flatLabel(def, w, d).material({ roughness: 0.4 }));
  top.rotation.x = -Math.PI / 2;
  top.position.y = h + 0.001;
  g.add(top);
  const front = new THREE.Mesh(new THREE.PlaneGeometry(w, h * 0.35), flatLabel(def, w, h * 0.35, { compact: true }).material());
  front.position.set(0, h * 0.175, d / 2 + 0.0006);
  g.add(front);
  return g;
}

function lidLabel(def, size = 512) {
  const L = new Label(size, size).fill(def.style === 'select' ? def.band : def.bg);
  if (def.style === 'select') {
    L.circle(size / 2, size / 2, size * 0.44, def.bg);
    L.ctx.save();
    L.ctx.beginPath(); L.ctx.arc(size / 2, size / 2, size * 0.44, 0, TAU); L.ctx.clip();
    selectBand(L, def, 0, size * 0.1, size, size * 0.17);
    L.ctx.restore();
    L.text(def.title, size / 2, size * 0.52, { size: size * 0.14, color: def.fg, font: FONTS.round, maxW: size * 0.7 });
    if (def.sub) L.text(def.sub, size / 2, size * 0.68, { size: size * 0.06, color: '#555', maxW: size * 0.6 });
    return L;
  }
  L.circle(size / 2, size / 2, size * 0.47, def.accent);
  L.circle(size / 2, size / 2, size * 0.42, def.bg);
  if (def.art) drawArt(L.ctx, def.art, size * 0.5, size * 0.72, size * 0.28, def.artColors);
  L.text(def.brand, size / 2, size * 0.24, { size: size * 0.065, color: def.fg, maxW: size * 0.56 });
  L.text(def.title, size / 2, size * 0.42, { size: size * 0.15, color: def.fg, font: titleFont(def), maxW: size * 0.7 });
  if (def.sub) L.text(def.sub, size / 2, size * 0.56, { size: size * 0.06, color: def.fg, maxW: size * 0.6 });
  return L;
}

function cup(def, { rt = 0.048, rb = 0.036, h = 0.105 } = {}) {
  const g = new THREE.Group();
  const L = wrapLabel(def, TAU * ((rt + rb) / 2), h);
  const side = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, 48, 1, true, Math.PI), L.material({ roughness: 0.45 }));
  side.position.y = h / 2;
  g.add(side);
  const bottom = new THREE.Mesh(new THREE.CircleGeometry(rb, 32), plain(def.bg));
  bottom.rotation.x = Math.PI / 2;
  bottom.position.y = 0.0005;
  g.add(bottom);
  const lip = new THREE.Mesh(new THREE.TorusGeometry(rt, 0.0018, 8, 48), plain('#f4f4f4', { roughness: 0.4 }));
  lip.rotation.x = Math.PI / 2;
  lip.position.y = h;
  g.add(lip);
  const lid = new THREE.Mesh(new THREE.CircleGeometry(rt + 0.002, 48), lidLabel(def).material({ roughness: 0.25, metalness: 0.35 }));
  lid.rotation.x = -Math.PI / 2;
  lid.position.y = h + 0.0018;
  g.add(lid);
  const tab = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.001, 0.014), plain(def.accent, { metalness: 0.3 }));
  tab.position.set(0, h + 0.0018, rt + 0.006);
  g.add(tab);
  return g;
}

// Clear dessert cup: layered contents visible, label on the lid.
function dessert(def) {
  const g = new THREE.Group();
  const rt = 0.042, rb = 0.032, h = 0.065;
  const shell = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, 36, 1, true), clearPlastic());
  shell.position.y = h / 2;
  shell.userData.noHit = true;
  g.add(shell);
  const fill = new THREE.Mesh(new THREE.CylinderGeometry(rt * 0.94, rb * 0.96, h * 0.82, 32), plain(def.fill, { roughness: 0.35 }));
  fill.position.y = h * 0.41;
  g.add(fill);
  const topLayer = new THREE.Mesh(new THREE.CylinderGeometry(rt * 0.96, rt * 0.94, h * 0.12, 32), plain(def.top, { roughness: 0.3 }));
  topLayer.position.y = h * 0.84;
  g.add(topLayer);
  const lid = new THREE.Mesh(new THREE.CircleGeometry(rt + 0.003, 40), lidLabel(def).material({ roughness: 0.3 }));
  lid.rotation.x = -Math.PI / 2;
  lid.position.y = h + 0.001;
  g.add(lid);
  // a printed sleeve round the lower half carries the brand and the name
  const bandH = h * 0.42, r0 = rb + (rt - rb) * 0.05, r1 = rb + (rt - rb) * 0.47;
  const B = new Label(1024, 150);
  B.rect(0, 0, B.w, B.h, def.bg);
  B.rect(0, 0, B.w, 40, def.band);
  B.rect(0, 40, B.w, 4, '#f2d675');
  drawMark(B.ctx, 512 - 120, 4, 32, def.band);
  B.text(def.brand, 512 + 10, 21, { size: 24, color: '#fff', font: FONTS.round, maxW: 200 });
  B.text(def.title, 512, 92, { size: 56, color: def.fg, font: FONTS.round, maxW: 330 });
  if (def.sub) B.text(def.sub, 512, 134, { size: 20, color: '#555', maxW: 300 });
  const sleeve = new THREE.Mesh(new THREE.CylinderGeometry(r1 + 0.0008, r0 + 0.0008, bandH, 40, 1, true, Math.PI), B.material({ roughness: 0.4 }));
  sleeve.position.y = h * 0.05 + bandH / 2;
  g.add(sleeve);
  return g;
}


// Small skincare bottle with a shoulder and a tall cap.
function bottle(def) {
  const g = new THREE.Group();
  const r = 0.026, h = 0.13;
  const prof = [[0, 0], [0.022, 0], [0.026, 0.004], [0.026, 0.105], [0.022, 0.118], [0.011, 0.124], [0.011, 0.13]].map(([x, y]) => new THREE.Vector2(x, y));
  const glass = new THREE.Mesh(new THREE.LatheGeometry(prof, 36), new THREE.MeshPhysicalMaterial({ color: def.liquid || '#ffffff', roughness: 0.08, transmission: 0, transparent: true, opacity: 0.85, clearcoat: 1 }));
  g.add(glass);
  const lh = 0.07;
  const L = wrapLabel(def, TAU * r, lh);
  const label = new THREE.Mesh(new THREE.CylinderGeometry(r + 0.0006, r + 0.0006, lh, 40, 1, true, Math.PI), L.material({ roughness: 0.3 }));
  label.position.y = 0.014 + lh / 2;
  g.add(label);
  const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.0145, 0.045, 28), plain(def.style === 'select' ? def.band : def.fg, { roughness: 0.25, metalness: 0.4 }));
  cap.position.y = h + 0.0225;
  g.add(cap);
  return g;
}

// Squeeze tube standing on its cap, flattening toward the crimped end.
function tube(def) {
  const g = new THREE.Group();
  const h = def.small ? 0.1 : 0.15, r = def.small ? 0.017 : 0.022;
  const geo = new THREE.CylinderGeometry(r, r, h, 40, 12, true, Math.PI);
  const p = geo.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const t = Math.min(1, Math.max(0, (p.getY(i) + h / 2) / h));   // 0 at cap, 1 at crimp
    const flat = 1 - 0.85 * Math.pow(t, 1.6);
    p.setZ(i, p.getZ(i) * flat);
    p.setX(i, p.getX(i) * (1 + 0.25 * t));
  }
  geo.computeVertexNormals();
  const L = wrapLabel(def, TAU * r, h);
  const body = new THREE.Mesh(geo, L.material({ roughness: 0.35, side: THREE.DoubleSide }));
  body.position.y = 0.018 + h / 2;
  g.add(body);
  const crimp = new THREE.Mesh(new THREE.BoxGeometry(r * 2.6, 0.008, 0.004), plain(def.style === 'select' ? def.band : def.bg));
  crimp.position.y = 0.018 + h + 0.003;
  g.add(crimp);
  const cap = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.75, r * 0.85, 0.018, 24), plain(def.style === 'select' ? def.band : def.fg, { roughness: 0.3 }));
  cap.position.y = 0.009;
  g.add(cap);
  return g;
}

// Side surface of a rounded-rectangle prism with "wrap" UVs: u runs once round
// the perimeter (back → left → front at u=0.5 → right → back), v runs up. So a
// wrap label printed on it follows the rounded corners like a real sleeve.
// `taper(t)` scales the cross-section with height (for shoulders).
function roundedPerimeter(w, d, r, n = 96) {
  const p = new THREE.Path();
  p.moveTo(0, -d / 2);
  p.lineTo(-w / 2 + r, -d / 2);
  p.absarc(-w / 2 + r, -d / 2 + r, r, -Math.PI / 2, -Math.PI, true);
  p.lineTo(-w / 2, d / 2 - r);
  p.absarc(-w / 2 + r, d / 2 - r, r, Math.PI, Math.PI / 2, true);
  p.lineTo(w / 2 - r, d / 2);
  p.absarc(w / 2 - r, d / 2 - r, r, Math.PI / 2, 0, true);
  p.lineTo(w / 2, -d / 2 + r);
  p.absarc(w / 2 - r, -d / 2 + r, r, 0, -Math.PI / 2, true);
  p.lineTo(0, -d / 2);
  return p.getSpacedPoints(n);
}

export function roundedPrism(w, d, h, r, { rows = 8, taper = () => 1, n = 96 } = {}) {
  const ring = roundedPerimeter(w, d, r, n);
  const pos = [], uv = [], idx = [];
  for (let j = 0; j <= rows; j++) {
    const t = j / rows, k = taper(t);
    for (let i = 0; i <= n; i++) {
      const q = ring[i % ring.length];
      pos.push(q.x * k, t * h, q.y * k);
      uv.push(i / n, t);
    }
  }
  for (let j = 0; j < rows; j++) {
    for (let i = 0; i < n; i++) {
      const a = j * (n + 1) + i, b = a + n + 1;
      idx.push(a, a + 1, b, b, a + 1, b + 1);
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  geo.setIndex(idx);
  geo.computeVertexNormals();
  return geo;
}

function roundedCap(w, d, r, y, k = 1, up = true) {
  const pts = roundedPerimeter(w * k, d * k, r * k, 48).map((q) => new THREE.Vector2(q.x, -q.y));
  const geo = new THREE.ShapeGeometry(new THREE.Shape(pts));
  geo.rotateX(up ? -Math.PI / 2 : Math.PI / 2);
  geo.translate(0, y, 0);
  return geo;
}

// Pump bottle: rounded body printed all the way round, with collar and pump head.
function pump(def) {
  const g = new THREE.Group();
  const small = def.small;
  const w = small ? 0.06 : 0.078, d = small ? 0.04 : 0.052, h = small ? 0.13 : 0.17, r = d * 0.42;
  const shoulder = (t) => (t < 0.86 ? 1 : 1 - 0.32 * Math.sin(((t - 0.86) / 0.14) * Math.PI / 2));
  const perim = 2 * (w + d) - 8 * r + 2 * Math.PI * r;
  const L = wrapLabel(def, perim, h);
  const body = new THREE.Mesh(roundedPrism(w, d, h, r, { rows: 14, taper: shoulder }), L.material({ roughness: 0.28, metalness: 0.05 }));
  g.add(body);
  const capMat = plain(def.style === 'select' ? def.band : def.bg, { roughness: 0.3 });
  g.add(new THREE.Mesh(roundedCap(w, d, r, h, 0.68), capMat));
  g.add(new THREE.Mesh(roundedCap(w, d, r, 0.0005, 1, false), capMat));
  const headMat = plain(def.style === 'select' ? def.band : def.fg, { roughness: 0.3 });
  const collar = new THREE.Mesh(new THREE.CylinderGeometry(0.013, 0.015, 0.02, 24), headMat);
  collar.position.y = h + 0.01;
  g.add(collar);
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.005, 0.005, 0.025, 12), headMat);
  stem.position.y = h + 0.032;
  g.add(stem);
  const head = new THREE.Mesh(new THREE.BoxGeometry(0.024, 0.014, 0.03), headMat);
  head.position.set(0, h + 0.048, 0.006);
  g.add(head);
  const nozzle = new THREE.Mesh(new THREE.BoxGeometry(0.008, 0.008, 0.024), headMat);
  nozzle.position.set(0, h + 0.049, 0.032);
  g.add(nozzle);
  return g;
}

// Small wrap band (for tiny cosmetics) — brand + name in a strip.
function bandLabel(def, circ, height) {
  const W = 1024, H = Math.max(80, Math.round((height / circ) * W));
  const L = new Label(W, H).fill(def.style === 'select' ? def.band : def.bg);
  const fw = W * 0.4, x = W / 2 - fw / 2;
  L.text(def.brand, W / 2, H * 0.24, { size: H * 0.16, color: def.style === 'select' ? '#ffffff' : def.fg, maxW: fw * 0.95, font: FONTS.gothic });
  L.text(def.title, W / 2, H * 0.56, { size: H * 0.24, color: def.style === 'select' ? '#ffffff' : def.fg, maxW: fw, font: FONTS.round });
  if (def.sub) L.text(def.sub, W / 2, H * 0.84, { size: H * 0.12, color: def.style === 'select' ? '#f2d675' : def.accent, maxW: fw * 0.9 });
  L.rect(x - 8, 0, 3, H, def.accent + '88');
  L.rect(x + fw + 5, 0, 3, H, def.accent + '88');
  return L;
}

function lipstick(def) {
  const g = new THREE.Group();
  const r = 0.0105, h = 0.052;
  const L = bandLabel(def, TAU * r, h * 0.6);
  const caseMat = plain(def.bg, { metalness: 0.7, roughness: 0.25 });
  const gold = plain('#d9b46a', { metalness: 0.9, roughness: 0.25 });
  const base = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, 28, 1, true, Math.PI), L.material({ metalness: 0.5, roughness: 0.3 }));
  base.position.y = h / 2;
  g.add(base);
  const bottom = new THREE.Mesh(new THREE.CircleGeometry(r, 24), caseMat);
  bottom.rotation.x = Math.PI / 2;
  g.add(bottom);
  const ring = new THREE.Mesh(new THREE.CylinderGeometry(r * 1.02, r * 1.02, 0.006, 28), gold);
  ring.position.y = h + 0.003;
  g.add(ring);
  const sleeve = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.8, r * 0.8, 0.012, 24), gold);
  sleeve.position.y = h + 0.012;
  g.add(sleeve);
  // the bullet: a cylinder whose top is sliced at an angle, edges softly rounded
  const br = r * 0.66, bh = 0.03, slant = 0.012;
  const bulletGeo = new THREE.CylinderGeometry(br, br, bh, 32, 6);
  const bp = bulletGeo.attributes.position;
  for (let i = 0; i < bp.count; i++) {
    const x = bp.getX(i), y = bp.getY(i), zz = bp.getZ(i);
    const t = (y + bh / 2) / bh;                                  // 0 bottom → 1 top
    const cut = ((x / br) + 1) / 2 * slant;                       // lower on the +x side
    bp.setY(i, y - cut * Math.pow(t, 1.5));
    // round the rim of the slanted face a touch
    const rr = Math.hypot(x, zz);
    if (t > 0.99 && rr > br * 0.9) { const k = 0.92; bp.setX(i, x * k); bp.setZ(i, zz * k); bp.setY(i, bp.getY(i) - 0.0008); }
  }
  bulletGeo.computeVertexNormals();
  const bullet = new THREE.Mesh(bulletGeo, plain(def.shade, { roughness: 0.22 }));
  bullet.position.y = h + 0.018 + bh / 2;
  g.add(bullet);
  return g;
}

function wand(def) {
  const g = new THREE.Group();
  const r = def.slim ? 0.0065 : 0.0085, h = def.slim ? 0.13 : 0.12;
  const L = bandLabel(def, TAU * r, h * 0.55);
  const body = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h * 0.55, 24, 1, true, Math.PI), L.material({ roughness: 0.3, metalness: 0.3 }));
  body.position.y = h * 0.275;
  g.add(body);
  const capMat = plain(def.style === 'select' ? def.band : def.bg, { roughness: 0.25, metalness: 0.4 });
  const cap = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.96, r, h * 0.45, 24), capMat);
  cap.position.y = h * 0.55 + h * 0.225;
  g.add(cap);
  const end = new THREE.Mesh(new THREE.SphereGeometry(r * 0.96, 16, 8, 0, TAU, 0, Math.PI / 2), capMat);
  end.position.y = h;
  g.add(end);
  const foot = new THREE.Mesh(new THREE.CircleGeometry(r, 20), capMat);
  foot.rotation.x = Math.PI / 2;
  g.add(foot);
  return g;
}

function polish(def) {
  const g = new THREE.Group();
  const w = 0.034, d = 0.024, h = 0.036, r = 0.008;
  const glass = new THREE.Mesh(roundedPrism(w, d, h, r, { rows: 2 }), new THREE.MeshPhysicalMaterial({ color: def.shade, roughness: 0.05, clearcoat: 1, metalness: 0.1 }));
  g.add(glass);
  g.add(new THREE.Mesh(roundedCap(w, d, r, h, 1), glass.material));
  // a printed band that wraps the rounded glass
  const perim = 2 * (w + d) - 8 * r + 2 * Math.PI * r;
  const band = new THREE.Mesh(roundedPrism(w + 0.0012, d + 0.0012, 0.016, r + 0.0006, { rows: 1 }), bandLabel(def, perim, 0.016).material({ roughness: 0.3 }));
  band.position.y = 0.008;
  g.add(band);
  const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.009, 0.04, 20), plain('#1d1d22', { roughness: 0.2, metalness: 0.3 }));
  cap.position.y = h + 0.02;
  g.add(cap);
  return g;
}

function compact(def) {
  const g = new THREE.Group();
  const r = 0.036, h = 0.016;
  const side = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, 40), plain(def.style === 'select' ? def.band : '#d9b46a', { metalness: 0.85, roughness: 0.25 }));
  side.position.y = h / 2;
  g.add(side);
  const lid = new THREE.Mesh(new THREE.CircleGeometry(r * 0.96, 40), lidLabel(def).material({ roughness: 0.3, metalness: 0.2 }));
  lid.rotation.x = -Math.PI / 2;
  lid.position.y = h + 0.0006;
  g.add(lid);
  return g;
}

function jar(def) {
  const g = new THREE.Group();
  const r = 0.033, h = 0.034;
  const L = bandLabel(def, TAU * r, h);
  const body = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, 36, 1, true, Math.PI), L.material({ roughness: 0.35 }));
  body.position.y = h / 2;
  g.add(body);
  const lidSide = new THREE.Mesh(new THREE.CylinderGeometry(r * 1.03, r * 1.03, 0.014, 36), plain(def.accent, { metalness: 0.7, roughness: 0.3 }));
  lidSide.position.y = h + 0.007;
  g.add(lidSide);
  const top = new THREE.Mesh(new THREE.CircleGeometry(r * 1.03, 36), lidLabel(def).material({ roughness: 0.35 }));
  top.rotation.x = -Math.PI / 2;
  top.position.y = h + 0.0145;
  g.add(top);
  return g;
}

function dropper(def) {
  const g = new THREE.Group();
  const r = 0.019, h = 0.075;
  const prof = [[0, 0], [0.016, 0], [0.019, 0.004], [0.019, 0.062], [0.014, 0.072], [0.009, 0.075]].map(([x, y]) => new THREE.Vector2(x, y));
  const glass = new THREE.Mesh(new THREE.LatheGeometry(prof, 32), new THREE.MeshPhysicalMaterial({ color: def.liquid, roughness: 0.05, clearcoat: 1, transparent: true, opacity: 0.9 }));
  g.add(glass);
  const L = wrapLabel(def, TAU * r, 0.045);
  const label = new THREE.Mesh(new THREE.CylinderGeometry(r + 0.0005, r + 0.0005, 0.045, 32, 1, true, Math.PI), L.material({ roughness: 0.3 }));
  label.position.y = 0.008 + 0.0225;
  g.add(label);
  const collar = new THREE.Mesh(new THREE.CylinderGeometry(0.011, 0.011, 0.012, 20), plain('#d9b46a', { metalness: 0.9, roughness: 0.25 }));
  collar.position.y = h + 0.006;
  g.add(collar);
  const bulb = new THREE.Mesh(new THREE.CapsuleGeometry(0.009, 0.018, 6, 16), plain('#2b2b30', { roughness: 0.6 }));
  bulb.position.y = h + 0.03;
  g.add(bulb);
  return g;
}

function spray(def) {
  const g = new THREE.Group();
  const r = 0.024, h = 0.15;
  const L = wrapLabel(def, TAU * r, h);
  const body = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, 36, 1, true, Math.PI), L.material({ metalness: 0.45, roughness: 0.3 }));
  body.position.y = h / 2;
  g.add(body);
  const metal = plain('#d5d9de', { metalness: 0.9, roughness: 0.28 });
  const shoulder = new THREE.Mesh(new THREE.SphereGeometry(r, 28, 10, 0, TAU, 0, Math.PI / 2), metal);
  shoulder.scale.y = 0.45;
  shoulder.position.y = h;
  g.add(shoulder);
  const cap = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.92, r * 0.92, 0.035, 28), plain(def.accent, { roughness: 0.3 }));
  cap.position.y = h + 0.024;
  g.add(cap);
  const foot = new THREE.Mesh(new THREE.CircleGeometry(r, 28), metal);
  foot.rotation.x = Math.PI / 2;
  g.add(foot);
  return g;
}

// Stand-up spout pouch (refills, jelly drinks).
function pouch(def) {
  const g = new THREE.Group();
  const [w, h, d] = def.small ? [0.09, 0.14, 0.03] : [0.12, 0.2, 0.045];
  const foil = { roughness: 0.3, metalness: 0.2, bumpMap: crinkleMap(), bumpScale: 0.5 };
  const front = flatLabel(def, w, h).material(foil);
  const back = flatLabel(def, w, h, { back: true }).material(foil);
  const side = plain(def.style === 'select' ? def.band : def.bg, foil);
  const geo = pillow(w, h, d, 12, 14);
  // flat-bottomed: widen the base so it stands up
  const p = geo.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const y = p.getY(i) / (h / 2);
    if (y < -0.6) p.setZ(i, Math.sign(p.getZ(i) || 1) * (d / 2) * (0.6 + 0.4 * Math.min(1, (-0.6 - y) * 3)));
  }
  geo.computeVertexNormals();
  const body = new THREE.Mesh(geo, [side, side, side, side, front, back]);
  body.position.y = h / 2;
  g.add(body);
  const spout = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.009, 0.018, 16), plain('#ffffff', { roughness: 0.4 }));
  spout.position.set(def.small ? 0 : w * 0.28, h + 0.006, 0);
  g.add(spout);
  const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.013, 0.013, 0.016, 16), plain(def.accent, { roughness: 0.4 }));
  cap.position.set(spout.position.x, h + 0.022, 0);
  g.add(cap);
  return g;
}

// Blister card: printed backing card with the item under a clear bubble.
function card(def) {
  const g = new THREE.Group();
  const w = def.big ? 0.11 : 0.08, h = def.big ? 0.2 : 0.17, t = 0.003;
  const F = new Label(320, Math.round((320 * h) / w));
  F.rect(0, 0, F.w, F.h, def.bg);
  const bh = F.h * 0.13;
  if (def.style === 'select') selectBand(F, def, 0, bh * 0.6, F.w, bh);
  F.circle(F.w / 2, bh * 0.3, bh * 0.16, '#d8d8d8');                 // peg hole
  F.rect(F.w * 0.12, F.h * 0.22, F.w * 0.76, F.h * 0.52, def.accent + '33', 14);
  F.text(def.title, F.w / 2, F.h * 0.83, { size: F.h * 0.08, color: def.fg, font: FONTS.round, maxW: F.w * 0.88 });
  if (def.sub) F.text(def.sub, F.w / 2, F.h * 0.92, { size: F.h * 0.045, color: '#555', maxW: F.w * 0.8 });
  const front = F.material({ roughness: 0.45 });
  const back = flatLabel(def, w, h, { back: true }).material({ roughness: 0.5 });
  const side = plain(def.band || def.bg);
  const cardMesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, t), [side, side, side, side, front, back]);
  cardMesh.position.y = h / 2;
  g.add(cardMesh);
  const im = plain(def.itemColor, { roughness: 0.35 });
  const item = new THREE.Group();
  if (def.item === 'stick') {
    const c = new THREE.Mesh(new THREE.CylinderGeometry(0.0085, 0.0085, 0.065, 20), im);
    c.rotation.z = 0.15;
    item.add(c);
  } else if (def.item === 'brush') {
    const handle = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.12, 0.006), im);
    item.add(handle);
    const bristles = new THREE.Mesh(new THREE.BoxGeometry(0.011, 0.025, 0.012), plain('#ffffff'));
    bristles.position.set(0, 0.05, 0.008);
    item.add(bristles);
  } else if (def.item === 'socks') {
    for (const dx of [-0.018, 0.018]) {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.1, 0.01), im);
      leg.position.set(dx, 0.01, 0);
      item.add(leg);
      const foot = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.03, 0.01), im);
      foot.position.set(dx + 0.006, -0.05, 0);
      item.add(foot);
    }
  } else if (def.item === 'cable') {
    const curve = new THREE.CatmullRomCurve3(Array.from({ length: 30 }, (_, i) => new THREE.Vector3(Math.cos(i * 0.7) * 0.022, -0.04 + i * 0.0028, 0)));
    item.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 80, 0.0022, 6), im));
    const plug = new THREE.Mesh(new THREE.BoxGeometry(0.01, 0.018, 0.005), plain('#d5d9de', { metalness: 0.9, roughness: 0.3 }));
    plug.position.y = 0.05;
    item.add(plug);
  } else if (def.item === 'ties') {
    for (let i = 0; i < 6; i++) {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.014, 0.003, 8, 24), i % 2 ? im : plain('#c8a0b0'));
      ring.position.set(((i % 2) - 0.5) * 0.03, 0.04 - Math.floor(i / 2) * 0.035, 0);
      item.add(ring);
    }
  } else if (def.item === 'pen') {
    for (const dx of [-0.01, 0.01]) {
      const pen = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.12, 12), dx < 0 ? im : plain('#c4302b'));
      pen.position.x = dx;
      item.add(pen);
    }
  }
  item.position.set(0, h * 0.48, t / 2 + 0.012);
  g.add(item);
  const bubble = new THREE.Mesh(new THREE.BoxGeometry(w * 0.7, h * 0.52, 0.022), clearPlastic());
  bubble.position.set(0, h * 0.48, t / 2 + 0.011);
  bubble.userData.noHit = true;
  g.add(bubble);
  return g;
}

// Magazine: printed cover with masthead, cover lines and a "photo".
function coverArt(L, def, x, y, w, h) {
  const c = L.ctx;
  const g = c.createLinearGradient(0, y, 0, y + h);
  g.addColorStop(0, def.accent + '55');
  g.addColorStop(1, def.accent + 'cc');
  c.fillStyle = g;
  c.fillRect(x, y, w, h);
  const cx = x + w * 0.55, cy = y + h * 0.55, s = Math.min(w, h);
  if (def.cover === 'cat') {
    c.fillStyle = '#f2a65a';
    c.beginPath(); c.ellipse(cx, cy + s * 0.15, s * 0.3, s * 0.26, 0, 0, TAU); c.fill();
    c.beginPath(); c.arc(cx, cy - s * 0.16, s * 0.2, 0, TAU); c.fill();
    for (const dx of [-1, 1]) { c.beginPath(); c.moveTo(cx + dx * s * 0.17, cy - s * 0.26); c.lineTo(cx + dx * s * 0.08, cy - s * 0.42); c.lineTo(cx + dx * s * 0.02, cy - s * 0.3); c.fill(); }
    c.fillStyle = '#2b3140';
    for (const dx of [-1, 1]) { c.beginPath(); c.arc(cx + dx * s * 0.07, cy - s * 0.17, s * 0.022, 0, TAU); c.fill(); }
  } else if (def.cover === 'car') {
    c.fillStyle = '#c4302b';
    c.beginPath(); c.roundRect(cx - s * 0.4, cy, s * 0.8, s * 0.16, s * 0.05); c.fill();
    c.beginPath(); c.roundRect(cx - s * 0.22, cy - s * 0.12, s * 0.44, s * 0.16, s * 0.06); c.fill();
    c.fillStyle = '#111';
    for (const dx of [-0.24, 0.24]) { c.beginPath(); c.arc(cx + dx * s, cy + s * 0.17, s * 0.07, 0, TAU); c.fill(); }
  } else if (def.cover === 'manga') {
    c.fillStyle = '#ffffff';
    for (let i = 0; i < 4; i++) c.fillRect(x + w * (0.08 + (i % 2) * 0.46), y + h * (0.08 + Math.floor(i / 2) * 0.46), w * 0.4, h * 0.4);
    c.strokeStyle = '#1d2a4a'; c.lineWidth = 3;
    for (let i = 0; i < 4; i++) c.strokeRect(x + w * (0.08 + (i % 2) * 0.46), y + h * (0.08 + Math.floor(i / 2) * 0.46), w * 0.4, h * 0.4);
    drawArt(c, 'sparkle', x + w * 0.28, y + h * 0.28, s * 0.3, ['#c4302b']);
    drawArt(c, 'gummy', x + w * 0.74, y + h * 0.74, s * 0.35, ['#9aa0a9', '#8a919c', '#c3c8d0']);
  } else {
    const kind = { food: 'bowl', travel: 'bubbles', fashion: 'sparkle', game: 'sticks' }[def.cover] || 'sparkle';
    const cols = { food: ['#c4502b', '#f2d9a8'], travel: ['#ffffff'], fashion: ['#ffffff'], game: ['#e8ff3a'] }[def.cover] || ['#fff'];
    drawArt(c, kind, cx, cy, s * 0.7, cols);
  }
}

function magazine(def) {
  const g = new THREE.Group();
  const w = 0.21, h = 0.28, t = 0.008;
  const L = new Label(512, Math.round((512 * h) / w));
  L.rect(0, 0, L.w, L.h, def.bg);
  coverArt(L, def, 0, L.h * 0.2, L.w, L.h * 0.7);
  L.text(def.title, L.w / 2, L.h * 0.1, { size: L.h * 0.13, color: def.fg, font: FONTS.pop, maxW: L.w * 0.92, stroke: '#ffffff', strokeW: 10 });
  L.text(def.brand, L.w * 0.12, L.h * 0.215, { size: L.h * 0.035, color: def.fg, align: 'left' });
  L.rect(L.w * 0.06, L.h * 0.62, L.w * 0.42, L.h * 0.09, def.fg, 6);
  L.text(def.sub, L.w * 0.27, L.h * 0.665, { size: L.h * 0.05, color: def.bg, maxW: L.w * 0.38 });
  if (def.badge) {
    L.circle(L.w * 0.82, L.h * 0.3, L.w * 0.11, def.accent);
    L.text(def.badge, L.w * 0.82, L.h * 0.3, { size: L.w * 0.07, color: '#fff', maxW: L.w * 0.18 });
  }
  L.rect(0, L.h * 0.9, L.w, L.h * 0.1, '#ffffff');
  const c = L.ctx;
  c.fillStyle = '#111';
  for (let i = 0; i < 30; i++) if ((i * 7) % 5 > 1) c.fillRect(L.w * 0.62 + i * 5, L.h * 0.915, 3, L.h * 0.06);
  L.text(`¥${def.price}`, L.w * 0.15, L.h * 0.95, { size: L.h * 0.04, color: '#333' });
  const cover = L.material({ roughness: 0.35 });
  const pages = plain('#f6f3ec', { roughness: 0.9 });
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, t), [pages, plain(def.fg), pages, pages, cover, plain('#ffffff')]);
  m.position.y = h / 2;
  g.add(m);
  return g;
}

// Clear plastic umbrella, folded, standing on its tip.
function umbrella(def) {
  const g = new THREE.Group();
  const prof = [[0.0, 0.0], [0.006, 0.02], [0.03, 0.55], [0.022, 0.66], [0.004, 0.7]].map(([x, y]) => new THREE.Vector2(x, y));
  const canopy = new THREE.Mesh(new THREE.LatheGeometry(prof, 8), new THREE.MeshStandardMaterial({ color: '#e8f4f8', roughness: 0.15, transparent: true, opacity: 0.55, side: THREE.DoubleSide }));
  canopy.position.y = 0.05;
  g.add(canopy);
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.86, 8), plain('#d5d9de', { metalness: 0.8, roughness: 0.3 }));
  shaft.position.y = 0.43;
  g.add(shaft);
  const handle = new THREE.Mesh(new THREE.TorusGeometry(0.035, 0.008, 8, 16, Math.PI), plain('#ffffff', { roughness: 0.4 }));
  handle.position.set(0.035, 0.86, 0);
  g.add(handle);
  // a little paper band with the price and the name — hoverable
  const L = new Label(256, 96).fill('#ffffff');
  L.rect(0, 0, 256, 26, '#2b3140');
  L.text(def.title, 128, 58, { size: 30, color: '#2b3140', maxW: 230 });
  L.text(`¥${def.price}`, 128, 13, { size: 18, color: '#fff' });
  const tag = new THREE.Mesh(new THREE.CylinderGeometry(0.0255, 0.0255, 0.05, 20, 1, true, Math.PI), L.material());
  tag.position.y = 0.42;
  g.add(tag);
  return g;
}

const BUILDERS = {
  bottle, tube, pump, card, magazine, umbrella, lipstick, wand, polish, compact, jar, dropper, spray, pouch,
  pet, can, carton, onigiri, sandwich, bento, bag, box, cup, tray, dessert,
  icecup: (d) => cup(d, { rt: 0.043, rb: 0.036, h: 0.058 }),
};

const cache = new Map();

// One template group per product; shelves instance it, the inspector clones it.
export function productTemplate(def) {
  if (cache.has(def.id)) return cache.get(def.id);
  const g = BUILDERS[def.shape](def);
  g.userData.product = def;
  const box3 = new THREE.Box3().setFromObject(g);
  g.userData.size = box3.getSize(new THREE.Vector3());
  cache.set(def.id, g);
  return g;
}

// Collects product placements and turns them into InstancedMeshes (one per part).
// Remembers which instances belong to which product so one can be lifted off the shelf.
export class ShelfStocker {
  constructor() {
    this.placements = new Map();
    this.meshes = new Map();
  }

  add(def, position, rotY = 0, tilt = 0) {
    if (!this.placements.has(def.id)) this.placements.set(def.id, []);
    const m = new THREE.Matrix4().compose(
      position,
      new THREE.Quaternion().setFromEuler(new THREE.Euler(tilt, rotY, 0, 'YXZ')),
      new THREE.Vector3(1, 1, 1),
    );
    this.placements.get(def.id).push(m);
  }

  build(defsById) {
    const group = new THREE.Group();
    const tmp = new THREE.Matrix4();
    for (const [id, mats] of this.placements) {
      const tpl = productTemplate(defsById[id]);
      tpl.updateMatrixWorld(true);
      const list = [];
      tpl.traverse((part) => {
        if (!part.isMesh) return;
        const im = new THREE.InstancedMesh(part.geometry, part.material, mats.length);
        mats.forEach((m, i) => im.setMatrixAt(i, tmp.multiplyMatrices(m, part.matrixWorld)));
        im.instanceMatrix.needsUpdate = true;
        im.computeBoundingSphere();
        im.renderOrder = part.renderOrder;
        im.castShadow = !part.material.transparent;
        im.receiveShadow = true;
        im.userData.productId = id;
        im.userData.noHit = part.userData.noHit;
        im.userData.local = part.matrixWorld.clone();
        group.add(im);
        list.push(im);
      });
      this.meshes.set(id, list);
    }
    return group;
  }

  placement(id, index) {
    return this.placements.get(id)?.[index];
  }

  // Hide or restore one physical item (all of its parts).
  setVisible(id, index, visible) {
    const tmp = new THREE.Matrix4();
    const zero = new THREE.Matrix4().makeScale(0, 0, 0);
    const m = this.placements.get(id)[index];
    for (const im of this.meshes.get(id)) {
      im.setMatrixAt(index, visible ? tmp.multiplyMatrices(m, im.userData.local) : zero);
      im.instanceMatrix.needsUpdate = true;
    }
  }
}
