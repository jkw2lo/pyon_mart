import * as THREE from 'three';
import { Label, FONTS } from './label.js';

// Builds a product as a small Group (origin at the bottom centre, front facing +z)
// from a catalogue row. Labels are drawn on canvases so their text is hoverable.

const TAU = Math.PI * 2;

// --- label layouts -----------------------------------------------------------

function decorate(L, def, x, y, w, h) {
  const c = L.ctx;
  c.save();
  c.globalAlpha = 0.22;
  c.fillStyle = def.accent;
  c.beginPath();
  c.arc(x + w * 0.5, y + h * 0.48, Math.min(w, h) * 0.36, 0, TAU);
  c.fill();
  c.globalAlpha = 1;
  c.fillRect(x, y + h * 0.9, w, h * 0.02);
  c.restore();
}

// Draws the main panel of a package into the rectangle (x, y, w, h).
function panel(L, def, x, y, w, h, { small = false } = {}) {
  decorate(L, def, x, y, w, h);
  const cx = x + w / 2;
  const font = def.vertical ? FONTS.mincho : def.cat === 'snack' || def.cat === 'ice' ? FONTS.pop : FONTS.round;
  L.text(def.brand, cx, y + h * 0.1, { size: h * 0.085, color: def.fg, weight: 700, maxW: w * 0.9, font: FONTS.gothic });
  if (def.vertical) {
    const n = [...def.title.jp].length;
    const size = Math.min(w * 0.4, (h * 0.62) / n);
    L.vtext(def.title, cx, y + h * 0.19, { size, color: def.fg, font: FONTS.mincho });
    if (def.sub) L.text(def.sub, cx, y + h * 0.88, { size: h * 0.075, color: def.fg, maxW: w * 0.9 });
  } else {
    const stroke = def.bg === '#ffffff' ? null : def.bg;
    L.text(def.title, cx, y + h * 0.42, { size: h * (small ? 0.2 : 0.24), color: def.fg, font, maxW: w * 0.92, stroke, strokeW: h * 0.02 });
    if (def.sub) L.text(def.sub, cx, y + h * 0.64, { size: h * 0.1, color: def.fg, maxW: w * 0.9, font: FONTS.gothic });
  }
  if (def.badge) {
    const bw = w * 0.86, bh = h * 0.1, by = def.vertical ? y + h * 0.75 : y + h * 0.76;
    if (!def.vertical) {
      L.rect(cx - bw / 2, by, bw, bh, def.accent, bh / 2);
      L.text(def.badge, cx, by + bh / 2, { size: bh * 0.66, color: '#fff', maxW: bw * 0.92 });
    }
  }
  if (def.note) L.text(def.note, x + w * 0.94, y + h * 0.95, { size: h * 0.06, color: def.fg, align: 'right', weight: 500 });
}

function backPanel(L, def, x, y, w, h) {
  const cx = x + w / 2;
  L.rect(x + w * 0.08, y + h * 0.08, w * 0.84, h * 0.84, 'rgba(255,255,255,0.85)', 8);
  L.text(def.title, cx, y + h * 0.18, { size: h * 0.09, color: '#333', maxW: w * 0.8 });
  L.text(def.brand, cx, y + h * 0.3, { size: h * 0.06, color: '#555', maxW: w * 0.8, weight: 500 });
  const c = L.ctx;
  c.fillStyle = '#9a9a9a';
  for (let i = 0; i < 7; i++) c.fillRect(x + w * 0.16, y + h * (0.42 + i * 0.06), w * (0.68 - (i % 3) * 0.1), h * 0.018);
  // barcode
  c.fillStyle = '#111';
  for (let i = 0; i < 34; i++) if ((i * 7) % 3) c.fillRect(x + w * 0.3 + i * w * 0.012, y + h * 0.84, w * 0.007, h * 0.06);
}

function wrapLabel(def, circ, height, { pxPerM = 4200 } = {}) {
  const W = 1024, H = Math.max(64, Math.round((height / circ) * W));
  const L = new Label(W, H).fill(def.bg);
  // the front faces the viewer at u = 0.5; the visible arc is ~ a third of the wrap
  const fw = W * 0.36;
  panel(L, def, W / 2 - fw / 2, 0, fw, H);
  backPanel(L, def, 0, 0, W * 0.2, H);
  backPanel(L, def, W * 0.8, 0, W * 0.2, H);
  return L;
}

function flatLabel(def, w, h, { back = false, res = 512 } = {}) {
  const W = w >= h ? res : Math.round((res * w) / h);
  const H = w >= h ? Math.round((res * h) / w) : res;
  const L = new Label(W, H).fill(def.bg);
  if (back) backPanel(L, def, 0, 0, W, H);
  else panel(L, def, 0, 0, W, H, { small: H < W });
  return L;
}

const plain = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.6, ...o });

// --- shape builders ----------------------------------------------------------

function pet(def) {
  const g = new THREE.Group();
  const r = 0.034, h = 0.21;
  const prof = [
    [0, 0], [0.027, 0], [0.033, 0.004], [0.034, 0.012], [0.032, 0.03], [0.034, 0.045], [0.034, 0.14],
    [0.032, 0.155], [0.024, 0.176], [0.015, 0.19], [0.0135, 0.196], [0.0135, 0.2],
  ].map(([x, y]) => new THREE.Vector2(x, y));
  const body = new THREE.Mesh(
    new THREE.LatheGeometry(prof, 40),
    new THREE.MeshStandardMaterial({ color: def.liquid, roughness: 0.08, metalness: 0, transparent: true, opacity: def.clear ? 0.35 : 0.88 }),
  );
  g.add(body);
  const lh = 0.085, ly = 0.052;
  const L = wrapLabel(def, TAU * r, lh);
  const label = new THREE.Mesh(new THREE.CylinderGeometry(r + 0.0006, r + 0.0006, lh, 48, 1, true, Math.PI), L.material({ roughness: 0.35 }));
  label.position.y = ly + lh / 2;
  g.add(label);
  const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.0148, 0.0148, 0.016, 24), plain(def.accent, { roughness: 0.4 }));
  cap.position.y = h - 0.008 + 0.002;
  g.add(cap);
  return g;
}

function can(def) {
  const g = new THREE.Group();
  const small = def.size === 'small';
  const r = small ? 0.0265 : 0.033, h = small ? 0.105 : 0.122;
  const L = wrapLabel(def, TAU * r, h * 0.9);
  const metal = plain('#cfd3d8', { metalness: 0.9, roughness: 0.3 });
  const body = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h * 0.9, 40, 1, true, Math.PI), L.material({ metalness: 0.45, roughness: 0.32 }));
  body.position.y = h / 2;
  g.add(body);
  // tapered neck + lid and base
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.86, r, h * 0.06, 40, 1, true), metal);
  neck.position.y = h * 0.95 + h * 0.0;
  g.add(neck);
  const lid = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.86, r * 0.86, 0.003, 40), metal);
  lid.position.y = h * 0.98;
  g.add(lid);
  const tab = new THREE.Mesh(new THREE.BoxGeometry(r * 0.35, 0.0015, r * 0.6), metal);
  tab.position.set(0, h * 0.985, r * 0.2);
  g.add(tab);
  const base = new THREE.Mesh(new THREE.CylinderGeometry(r, r * 0.85, h * 0.05, 40), metal);
  base.position.y = h * 0.025;
  g.add(base);
  return g;
}

function carton(def) {
  const g = new THREE.Group();
  const s = 0.072, h = 0.15;
  const front = flatLabel(def, s, h).material();
  const back = flatLabel(def, s, h, { back: true }).material();
  const side = plain(def.bg);
  const top = plain('#f4f4f4');
  const body = new THREE.Mesh(new THREE.BoxGeometry(s, h, s), [side, side, top, top, front, back]);
  body.position.y = h / 2;
  g.add(body);
  const tri = new THREE.Shape([new THREE.Vector2(-s / 2, 0), new THREE.Vector2(s / 2, 0), new THREE.Vector2(0, 0.028)]);
  const gable = new THREE.Mesh(new THREE.ExtrudeGeometry(tri, { depth: s, bevelEnabled: false }), side);
  // ExtrudeGeometry extrudes along +z; rotate so the ridge runs left-right
  gable.rotation.y = Math.PI / 2;
  gable.position.set(-s / 2, h, 0);
  g.add(gable);
  const fin = new THREE.Mesh(new THREE.BoxGeometry(s, 0.012, 0.004), plain(def.bg));
  fin.position.y = h + 0.032;
  g.add(fin);
  return g;
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

function triangleCanvas(def, side, h, draw) {
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
  const rice = new THREE.MeshPhysicalMaterial({ color: '#f6f3ea', roughness: 0.55, clearcoat: 1, clearcoatRoughness: 0.15 });
  const body = new THREE.Mesh(new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: true, bevelSize: 0.004, bevelThickness: 0.004, bevelSegments: 3, curveSegments: 6 }), rice);
  body.position.set(0, h * 0.38 + 0.004, -depth / 2);
  g.add(body);
  const L = triangleCanvas(def, side, h, (L, c) => {
    c.fillStyle = 'rgba(0,0,0,0)';
    c.clearRect(0, 0, L.w, L.h);
    // nori
    c.fillStyle = '#1d2a1f';
    c.fillRect(0, L.h * 0.62, L.w, L.h);
    // tear strip
    c.fillStyle = def.accent;
    c.fillRect(L.w * 0.44, 0, L.w * 0.12, L.h);
    // sticker
    L.rect(L.w * 0.22, L.h * 0.36, L.w * 0.56, L.h * 0.34, '#ffffff', 10);
    c.strokeStyle = def.fg;
    c.lineWidth = 4;
    c.strokeRect(L.w * 0.23, L.h * 0.37, L.w * 0.54, L.h * 0.32);
    L.text(def.title, L.w / 2, L.h * 0.48, { size: 64, color: def.fg, font: FONTS.round, maxW: L.w * 0.5 });
    L.text(def.sub, L.w / 2, L.h * 0.6, { size: 26, color: '#333', maxW: L.w * 0.5 });
    L.text(def.brand, L.w / 2, L.h * 0.76, { size: 24, color: '#fff', maxW: L.w * 0.4 });
    if (def.badge) {
      L.rect(L.w * 0.36, L.h * 0.25, L.w * 0.28, L.h * 0.08, '#c4302b', 12);
      L.text(def.badge, L.w / 2, L.h * 0.29, { size: 26, color: '#fff', maxW: L.w * 0.26 });
    }
    c.fillStyle = '#fff';
    c.font = '700 26px sans-serif';
    c.textAlign = 'center';
    c.fillText('1', L.w / 2, L.h * 0.15);
  });
  const mat = L.material({ transparent: true, alphaTest: 0.05, roughness: 0.3 });
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
  const crust = new THREE.MeshPhysicalMaterial({ color: '#efe0bf', roughness: 0.7, clearcoat: 1, clearcoatRoughness: 0.2 });
  const body = new THREE.Mesh(new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: false }), crust);
  body.position.set(0, h * 0.38, -depth / 2);
  g.add(body);
  const L = triangleCanvas(def, side, h, (L, c) => {
    c.fillStyle = '#f7ecd2';
    c.fillRect(0, 0, L.w, L.h);
    c.fillStyle = def.filling;
    c.fillRect(0, L.h * 0.42, L.w, L.h * 0.2);
    c.fillStyle = '#e9d6a8';
    for (let i = 0; i < 160; i++) c.fillRect(Math.random() * L.w, Math.random() * L.h, 3, 3);
    L.rect(L.w * 0.3, L.h * 0.68, L.w * 0.4, L.h * 0.24, def.bg, 10);
    L.text(def.title, L.w / 2, L.h * 0.76, { size: 40, color: def.fg, font: FONTS.round, maxW: L.w * 0.36 });
    L.text(def.brand, L.w / 2, L.h * 0.86, { size: 20, color: '#555', maxW: L.w * 0.34 });
  });
  const plane = new THREE.Mesh(new THREE.PlaneGeometry(side, h), L.material({ transparent: true, alphaTest: 0.05, roughness: 0.25 }));
  plane.position.set(0, h / 2, depth / 2 + 0.0008);
  g.add(plane);
  return g;
}

function drawFood(c, kind, x, y, w, h) {
  const blob = (bx, by, r, col) => { c.fillStyle = col; c.beginPath(); c.ellipse(bx, by, r, r * 0.8, Math.random(), 0, TAU); c.fill(); };
  if (kind === 'soba') {
    c.fillStyle = '#2b3a4a'; c.fillRect(x, y, w, h);
    c.strokeStyle = '#7a6a52'; c.lineWidth = 5;
    for (let i = 0; i < 70; i++) { c.beginPath(); c.moveTo(x + Math.random() * w * 0.65, y + Math.random() * h); c.bezierCurveTo(x + Math.random() * w * 0.65, y + Math.random() * h, x + Math.random() * w * 0.65, y + Math.random() * h, x + Math.random() * w * 0.65, y + Math.random() * h); c.stroke(); }
    c.fillStyle = '#1d1a14'; c.beginPath(); c.arc(x + w * 0.82, y + h * 0.35, h * 0.2, 0, TAU); c.fill();
    blob(x + w * 0.82, y + h * 0.75, h * 0.1, '#7aa04a');
    return;
  }
  c.fillStyle = '#121212'; c.fillRect(x, y, w, h);
  // rice
  c.fillStyle = '#f7f5ee'; c.fillRect(x + w * 0.03, y + h * 0.05, w * 0.47, h * 0.9);
  c.fillStyle = '#e8e4d8'; for (let i = 0; i < 400; i++) c.fillRect(x + w * 0.03 + Math.random() * w * 0.47, y + h * 0.05 + Math.random() * h * 0.9, 4, 2);
  if (kind === 'makunouchi') {
    c.fillStyle = '#111'; for (let i = 0; i < 24; i++) c.fillRect(x + w * 0.05 + Math.random() * w * 0.42, y + h * 0.1 + Math.random() * h * 0.8, 3, 3);
    blob(x + w * 0.26, y + h * 0.5, h * 0.07, '#b3243a');
    blob(x + w * 0.66, y + h * 0.25, h * 0.14, '#e88a5a');
    blob(x + w * 0.86, y + h * 0.25, h * 0.1, '#f2d16a');
    blob(x + w * 0.66, y + h * 0.7, h * 0.1, '#7a4a2a');
    blob(x + w * 0.86, y + h * 0.72, h * 0.12, '#6a9a3a');
  } else {
    blob(x + w * 0.26, y + h * 0.5, h * 0.07, '#b3243a');
    for (let i = 0; i < 5; i++) blob(x + w * (0.62 + (i % 2) * 0.2), y + h * (0.22 + Math.floor(i / 2) * 0.3), h * 0.15, ['#b8732f', '#a5622a', '#c4843a'][i % 3]);
    blob(x + w * 0.9, y + h * 0.85, h * 0.08, '#7ab84a');
  }
}

function bento(def) {
  const g = new THREE.Group();
  const w = 0.21, d = 0.155, h = 0.045;
  const tray = new THREE.Mesh(new THREE.BoxGeometry(w, h * 0.7, d), plain('#151515', { roughness: 0.4 }));
  tray.position.y = (h * 0.7) / 2;
  g.add(tray);
  const L = new Label(768, Math.round((768 * d) / w));
  drawFood(L.ctx, def.food, 0, 0, L.w, L.h);
  // sticker on the lid
  const sx = L.w * 0.08, sy = L.h * 0.62, sw = L.w * 0.5, sh = L.h * 0.32;
  L.rect(sx, sy, sw, sh, def.bg, 12);
  L.rect(sx, sy, sw, sh * 0.22, def.accent, 12);
  L.text(def.brand, sx + sw / 2, sy + sh * 0.11, { size: sh * 0.16, color: '#fff', maxW: sw * 0.9 });
  L.text(def.title, sx + sw / 2, sy + sh * 0.48, { size: sh * 0.28, color: def.fg, font: FONTS.round, maxW: sw * 0.92 });
  L.text(def.sub, sx + sw / 2, sy + sh * 0.8, { size: sh * 0.12, color: '#444', maxW: sw * 0.92 });
  L.text(`¥${def.price}`, sx + sw + L.w * 0.12, sy + sh * 0.6, { size: sh * 0.3, color: '#fff', stroke: '#c4302b', strokeW: 10 });
  const food = new THREE.Mesh(new THREE.PlaneGeometry(w * 0.97, d * 0.97), L.material({ roughness: 0.5 }));
  food.rotation.x = -Math.PI / 2;
  food.position.y = h * 0.7 + 0.0008;
  g.add(food);
  const lid = new THREE.Mesh(
    new THREE.BoxGeometry(w * 1.01, h * 0.45, d * 1.01),
    new THREE.MeshStandardMaterial({ color: '#ffffff', transparent: true, opacity: 0.18, roughness: 0.05, depthWrite: false }),
  );
  lid.position.y = h * 0.7 + (h * 0.45) / 2;
  lid.userData.noHit = true;
  g.add(lid);
  return g;
}

function pillow(w, h, d, segX = 10, segY = 12) {
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
  const [w, h, d] = def.size === 'small' ? [0.12, 0.16, 0.035] : def.size === 'bar' ? [0.075, 0.19, 0.022] : [0.17, 0.235, 0.065];
  const front = flatLabel(def, w, h).material({ roughness: 0.28, metalness: 0.15 });
  const back = flatLabel(def, w, h, { back: true }).material({ roughness: 0.3, metalness: 0.15 });
  const side = plain(def.bg, { roughness: 0.3, metalness: 0.15 });
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
  const side = plain(def.bg, { roughness: 0.45 });
  let mats;
  if (def.top) {
    const top = flatLabel(def, w, d).material({ roughness: 0.4 });
    const band = flatLabel(def, w, h).material({ roughness: 0.4 });
    mats = [side, side, top, side, band, side];
  } else {
    mats = [side, side, side, side, flatLabel(def, w, h).material({ roughness: 0.4 }), flatLabel(def, w, h, { back: true }).material({ roughness: 0.45 })];
  }
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mats);
  m.position.y = h / 2;
  g.add(m);
  return g;
}

function lidLabel(def, size = 512) {
  const L = new Label(size, size).fill(def.bg);
  L.circle(size / 2, size / 2, size * 0.47, def.accent);
  L.circle(size / 2, size / 2, size * 0.42, def.bg);
  L.text(def.brand, size / 2, size * 0.28, { size: size * 0.07, color: def.fg, maxW: size * 0.6 });
  L.text(def.title, size / 2, size * 0.47, { size: size * 0.15, color: def.fg, font: FONTS.pop, maxW: size * 0.7 });
  if (def.sub) L.text(def.sub, size / 2, size * 0.64, { size: size * 0.065, color: def.fg, maxW: size * 0.62 });
  return L;
}

function cup(def, { rt = 0.048, rb = 0.036, h = 0.105 } = {}) {
  const g = new THREE.Group();
  const L = wrapLabel(def, TAU * ((rt + rb) / 2), h);
  const side = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, 48, 1, true, Math.PI), L.material({ roughness: 0.5 }));
  side.position.y = h / 2;
  g.add(side);
  const bottom = new THREE.Mesh(new THREE.CircleGeometry(rb, 32), plain(def.bg));
  bottom.rotation.x = Math.PI / 2;
  bottom.position.y = 0.0005;
  g.add(bottom);
  const lid = new THREE.Mesh(new THREE.CircleGeometry(rt + 0.002, 48), lidLabel(def).material({ roughness: 0.3, metalness: 0.3 }));
  lid.rotation.x = -Math.PI / 2;
  lid.position.y = h + 0.001;
  g.add(lid);
  const tab = new THREE.Mesh(new THREE.BoxGeometry(0.018, 0.001, 0.014), plain(def.accent, { metalness: 0.3 }));
  tab.position.set(0, h + 0.001, rt + 0.005);
  g.add(tab);
  return g;
}

const BUILDERS = { pet, can, carton, onigiri, sandwich, bento, bag, box, cup, icecup: (d) => cup(d, { rt: 0.043, rb: 0.036, h: 0.058 }) };

const cache = new Map();

// One template group per product; shelves instance it, the inspector clones it.
export function productTemplate(def) {
  if (cache.has(def.id)) return cache.get(def.id);
  const g = BUILDERS[def.shape](def);
  g.userData.product = def;
  g.traverse((o) => {
    if (o.isMesh) {
      o.castShadow = false;
      o.receiveShadow = false;
    }
  });
  const box3 = new THREE.Box3().setFromObject(g);
  g.userData.size = box3.getSize(new THREE.Vector3());
  cache.set(def.id, g);
  return g;
}

// Collects product placements and turns them into InstancedMeshes (one per part).
export class ShelfStocker {
  constructor() {
    this.placements = new Map();
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
      tpl.traverse((part) => {
        if (!part.isMesh) return;
        const im = new THREE.InstancedMesh(part.geometry, part.material, mats.length);
        mats.forEach((m, i) => im.setMatrixAt(i, tmp.multiplyMatrices(m, part.matrixWorld)));
        im.instanceMatrix.needsUpdate = true;
        im.computeBoundingSphere();
        im.userData.productId = id;
        im.userData.noHit = part.userData.noHit;
        group.add(im);
      });
    }
    return group;
  }
}
