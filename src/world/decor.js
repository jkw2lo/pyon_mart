import * as THREE from 'three';
import { addBox, std, sign } from './common.js';
import { Label, FONTS, shown } from '../label.js';
import { drawArt, brandArt } from '../art.js';
import { words as w } from '../data/words.js';

// Everything that makes the shop feel lived-in: POP signage, posters, the clock,
// oden on the counter, nobori flags, bikes, the post box…

const TAU = Math.PI * 2;
const FACE = { px: Math.PI / 2, nx: -Math.PI / 2, pz: 0, nz: Math.PI };

function plane(L, w, h, opts = {}) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), L.material({ roughness: 0.5, ...opts }));
  m.userData.sign = true;
  return m;
}

function doubleSided(L, w, h, opts) {
  const g = new THREE.Group();
  const a = plane(L, w, h, opts);
  const b = plane(L, w, h, opts);
  a.position.z = 0.001;
  b.position.z = -0.001;
  b.rotation.y = Math.PI;
  g.add(a, b);
  return g;
}

// --- printed pieces ------------------------------------------------------------

function autumnPoster(W = 512, H = 720) {
  const L = new Label(W, H);
  const c = L.ctx;
  const g = c.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, '#1d2a4a');
  g.addColorStop(1, '#3a2a4a');
  c.fillStyle = g;
  c.fillRect(0, 0, W, H);
  c.fillStyle = 'rgba(255,255,255,0.7)';
  for (let i = 0; i < 40; i++) c.fillRect((i * 97) % W, (i * 61) % (H * 0.5), 2, 2);
  drawArt(c, 'moon', W * 0.5, H * 0.42, W * 0.75, ['#f2d675']);
  // falling maple leaves
  for (let i = 0; i < 9; i++) {
    c.save();
    c.translate((i * 131) % W, H * 0.1 + ((i * 173) % (H * 0.5)));
    c.rotate(i);
    c.fillStyle = ['#d0451b', '#e8a23a', '#c4302b'][i % 3];
    c.beginPath();
    for (let k = 0; k < 10; k++) { const t = (k / 10) * TAU, r = k % 2 ? 6 : 16; c.lineTo(Math.cos(t) * r, Math.sin(t) * r); }
    c.fill();
    c.restore();
  }
  L.text(w.akiNoMikaku, W / 2, H * 0.75, { size: 92, color: '#f2d675', font: FONTS.mincho, maxW: W * 0.9 });
  L.text(w.tsukimiDango, W / 2, H * 0.86, { size: 40, color: '#ffffff', font: FONTS.round });
  L.text(w.kikanGentei, W / 2, H * 0.94, { size: 28, color: '#f2d675' });
  return L;
}

function foodPoster(word, sub, bg, fg, art, artColors, W = 512, H = 512) {
  const L = new Label(W, H).fill(bg);
  L.circle(W / 2, H * 0.42, W * 0.32, 'rgba(255,255,255,0.25)');
  drawArt(L.ctx, art, W / 2, H * 0.42, W * 0.55, artColors);
  L.text(word, W / 2, H * 0.82, { size: 96, color: fg, font: FONTS.pop, maxW: W * 0.9, stroke: '#ffffff', strokeW: 12 });
  if (sub) L.text(sub, W / 2, H * 0.94, { size: 32, color: fg });
  return L;
}

// Shelf talker: a little card sticking out from the shelf edge.
function talker(word, bg, fg) {
  const L = new Label(256, 200);
  L.rect(0, 0, 256, 200, bg, 26);
  L.ctx.strokeStyle = '#ffffff';
  L.ctx.lineWidth = 8;
  L.ctx.beginPath();
  L.ctx.roundRect(10, 10, 236, 180, 20);
  L.ctx.stroke();
  L.text(word, 128, 104, { size: 64, color: fg, font: FONTS.pop, maxW: 220 });
  const mat = L.material({ roughness: 0.5, transparent: true, alphaTest: 0.1, side: THREE.DoubleSide });
  const m = new THREE.Mesh(new THREE.PlaneGeometry(0.11, 0.086), mat);
  m.userData.sign = true;
  return m;
}

function noboriFlag(word, bg, fg) {
  const L = new Label(160, 640).fill(bg);
  L.rect(0, 0, 160, 40, fg);
  L.rect(0, 600, 160, 40, fg);
  const n = [...shown(word)].length;
  L.vtext(word, 80, 70, { size: Math.min(110, 520 / n), color: fg, font: FONTS.pop });
  const geo = new THREE.PlaneGeometry(0.45, 1.8, 6, 12);
  const m = new THREE.Mesh(geo, L.material({ roughness: 0.8, side: THREE.DoubleSide }));
  m.userData.sign = true;
  m.userData.base = geo.attributes.position.array.slice();
  return m;
}

// --- 3D props ------------------------------------------------------------------

function basketStack(parent, x, z, n = 6) {
  const g = new THREE.Group();
  const col = std('#3a4150', { roughness: 0.5 });
  const rim = std('#f2d675', { roughness: 0.5 });
  for (let i = 0; i < n; i++) {
    const b = new THREE.Group();
    addBox(b, [0.48, 0.012, 0.32], col, [0, 0.006, 0], { cast: false });
    for (const [sx, sz, px, pz] of [[0.48, 0.012, 0, 0.16], [0.48, 0.012, 0, -0.16], [0.012, 0.32, 0.24, 0], [0.012, 0.32, -0.24, 0]]) {
      addBox(b, [sx, 0.2, sz], col, [px, 0.1, pz], { cast: false });
    }
    addBox(b, [0.49, 0.02, 0.33], rim, [0, 0.2, 0], { cast: false });
    b.position.y = i * 0.055;
    b.rotation.y = (i % 2) * 0.03;
    g.add(b);
  }
  // handles flopped over the top basket
  for (const dz of [-0.06, 0.06]) {
    const h = new THREE.Mesh(new THREE.TorusGeometry(0.13, 0.008, 6, 20, Math.PI), std('#2b3140'));
    h.position.set(0, (n - 1) * 0.055 + 0.2, dz);
    h.rotation.x = dz > 0 ? 1.2 : -1.2;
    g.add(h);
  }
  g.position.set(x, 0, z);
  parent.add(g);
  const s = sign(w.kago, { w: 0.26, h: 0.08, bg: '#f2d675', fg: '#2b3140', res: 256 });
  s.position.set(x, (n - 1) * 0.055 + 0.12, z - 0.166);
  s.rotation.y = Math.PI;
  parent.add(s);
  return g;
}

function odenPot(parent, x, y, z) {
  const g = new THREE.Group();
  const steel = std('#c9ced4', { metalness: 0.9, roughness: 0.25 });
  addBox(g, [0.36, 0.14, 0.5], steel, [0, 0.07, 0]);
  const broth = new THREE.Mesh(new THREE.BoxGeometry(0.33, 0.01, 0.47), std('#c9953a', { roughness: 0.15, emissive: '#5a3a10', emissiveIntensity: 0.2 }));
  broth.position.y = 0.125;
  g.add(broth);
  for (const dz of [-0.08, 0.08]) addBox(g, [0.34, 0.03, 0.006], steel, [0, 0.13, dz], { cast: false });
  addBox(g, [0.006, 0.03, 0.48], steel, [0, 0.13, 0], { cast: false });
  // ingredients
  const daikon = std('#e8d4a0', { roughness: 0.6 });
  const egg = std('#b8823a', { roughness: 0.4 });
  const konnyaku = std('#5a5a62', { roughness: 0.7 });
  const kombu = std('#2a3a2a', { roughness: 0.6 });
  const cells = [[-0.08, -0.16], [0.08, -0.16], [-0.08, 0], [0.08, 0], [-0.08, 0.16], [0.08, 0.16]];
  cells.forEach(([cx, cz], i) => {
    for (let k = 0; k < 3; k++) {
      const dx = cx + (k - 1) * 0.045, dz = cz + ((k % 2) - 0.5) * 0.04;
      let m;
      if (i === 0 || i === 3) { m = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.02, 14), daikon); }
      else if (i === 1) { m = new THREE.Mesh(new THREE.SphereGeometry(0.018, 12, 10), egg); m.scale.y = 1.25; }
      else if (i === 2) { m = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.012, 3), konnyaku); }
      else if (i === 4) { m = new THREE.Mesh(new THREE.TorusKnotGeometry(0.012, 0.004, 24, 4), kombu); }
      else { m = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.012, 0.03), std('#f2e6c8')); }
      m.position.set(dx, 0.128, dz);
      g.add(m);
    }
  });
  const lid = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.006, 0.25), new THREE.MeshStandardMaterial({ color: '#ffffff', transparent: true, opacity: 0.25, roughness: 0.05 }));
  lid.position.set(0, 0.2, 0.12);
  lid.rotation.x = -0.5;
  lid.userData.noHit = true;
  g.add(lid);
  const s = sign(w.oden, { w: 0.3, h: 0.1, bg: '#a3502a', fg: '#fff', res: 256 });
  s.position.set(-0.181, 0.07, 0);
  s.rotation.y = FACE.nx;
  g.add(s);
  g.position.set(x, y, z);
  parent.add(g);
  return { group: g, broth };
}

function bicycle(parent, x, z, rotY, color) {
  const g = new THREE.Group();
  const frame = std(color, { metalness: 0.4, roughness: 0.35 });
  const dark = std('#1b1c1f', { roughness: 0.8 });
  const chrome = std('#c9ced4', { metalness: 0.9, roughness: 0.25 });
  for (const dz of [-0.52, 0.52]) {
    const wheel = new THREE.Mesh(new THREE.TorusGeometry(0.31, 0.022, 8, 32), dark);
    wheel.position.set(0, 0.33, dz);
    wheel.rotation.y = Math.PI / 2;
    g.add(wheel);
    const hub = new THREE.Mesh(new THREE.TorusGeometry(0.29, 0.006, 4, 32), chrome);
    hub.position.copy(wheel.position);
    hub.rotation.y = Math.PI / 2;
    g.add(hub);
  }
  const tube = (a, b, r = 0.016, m = frame) => {
    const d = new THREE.Vector3().subVectors(b, a);
    const t = new THREE.Mesh(new THREE.CylinderGeometry(r, r, d.length(), 8), m);
    t.position.copy(a).addScaledVector(d, 0.5);
    t.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize());
    g.add(t);
  };
  const V = (y, z) => new THREE.Vector3(0, y, z);
  // a mamachari: low step-through frame, basket at the front
  tube(V(0.33, -0.52), V(0.38, -0.05));
  tube(V(0.38, -0.05), V(0.75, -0.15));
  tube(V(0.38, -0.05), V(0.62, 0.38));
  tube(V(0.62, 0.38), V(0.33, 0.52));
  tube(V(0.62, 0.38), V(0.95, 0.42));
  tube(V(0.33, -0.52), V(0.75, -0.15));
  addBox(g, [0.5, 0.025, 0.03], chrome, [0, 0.98, 0.42]);
  addBox(g, [0.12, 0.05, 0.24], dark, [0, 0.8, -0.18]);
  const basket = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.22, 0.26), new THREE.MeshStandardMaterial({ color: '#c9ced4', metalness: 0.8, roughness: 0.3, wireframe: true }));
  basket.position.set(0, 0.86, 0.68);
  g.add(basket);
  addBox(g, [0.04, 0.38, 0.04], chrome, [0.06, 0.18, -0.1], { cast: false });
  g.position.set(x, 0, z);
  g.rotation.y = rotY;
  g.rotation.z = 0.05;
  parent.add(g);
}

function postBox(parent, x, z) {
  const g = new THREE.Group();
  const red = std('#d0201b', { roughness: 0.35, metalness: 0.2 });
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.26, 1.1, 24), red);
  body.position.y = 0.75;
  g.add(body);
  const dome = new THREE.Mesh(new THREE.SphereGeometry(0.27, 24, 12, 0, TAU, 0, Math.PI / 2), red);
  dome.position.y = 1.3;
  g.add(dome);
  addBox(g, [0.6, 0.04, 0.6], red, [0, 1.28, 0], { cast: false });
  addBox(g, [0.3, 0.2, 0.3], std('#2a2d33'), [0, 0.1, 0]);
  addBox(g, [0.24, 0.03, 0.04], std('#1a1a1a'), [0, 1.1, 0.25], { cast: false });
  const L = new Label(256, 160).fill('#ffffff');
  L.ctx.fillStyle = '#d0201b';
  L.ctx.font = '900 64px sans-serif';
  L.ctx.textAlign = 'center';
  L.ctx.fillText('〒', 60, 100);
  L.text(w.yubin, 160, 80, { size: 64, color: '#d0201b' });
  const s = new THREE.Mesh(new THREE.PlaneGeometry(0.26, 0.16), L.material());
  s.position.set(0, 0.8, 0.262);
  s.userData.sign = true;
  g.add(s);
  g.position.set(x, 0, z);
  parent.add(g);
}

function planter(parent, x, z, w = 1.2) {
  addBox(parent, [w, 0.45, 0.4], std('#5a5d63', { roughness: 0.9 }), [x, 0.225, z]);
  const leaf = std('#3f6b3a', { roughness: 0.8 });
  const leaf2 = std('#5a8a4a', { roughness: 0.8 });
  for (let i = 0; i < Math.round(w * 6); i++) {
    const b = new THREE.Mesh(new THREE.IcosahedronGeometry(0.14 + (i % 3) * 0.03, 0), i % 2 ? leaf : leaf2);
    b.position.set(x - w / 2 + 0.1 + (i / (w * 6)) * (w - 0.2), 0.55 + (i % 2) * 0.05, z + ((i % 3) - 1) * 0.08);
    b.rotation.set(i, i * 2, 0);
    b.castShadow = true;
    parent.add(b);
  }
}

function aFrame(parent, x, z, rotY) {
  const g = new THREE.Group();
  const L = new Label(320, 440).fill('#2b3a2f');
  L.ctx.strokeStyle = '#c9a45a';
  L.ctx.lineWidth = 12;
  L.ctx.strokeRect(10, 10, 300, 420);
  L.text(w.honjitsu, 160, 70, { size: 36, color: '#f6f2e6', font: FONTS.round, maxW: 280 });
  L.text(w.karaage, 160, 170, { size: 56, color: '#f2d675', font: FONTS.round });
  L.text('¥220', 160, 230, { size: 40, color: '#ffffff' });
  L.text(w.oden, 160, 310, { size: 56, color: '#f2a6b8', font: FONTS.round });
  L.text(w.akiNoMikaku, 160, 385, { size: 34, color: '#f6f2e6', font: FONTS.round });
  const mat = L.material({ roughness: 0.9 });
  for (const s of [1, -1]) {
    const board = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.7, 0.02), [std('#7a5a3a'), std('#7a5a3a'), std('#7a5a3a'), std('#7a5a3a'), mat, std('#7a5a3a')]);
    // the two boards lean in and meet at the top, like a real sandwich board
    board.rotation.order = 'YXZ';
    board.rotation.y = s < 0 ? Math.PI : 0;
    board.rotation.x = -0.26;
    board.position.set(0, 0.37, s * 0.1);
    board.userData.sign = true;
    g.add(board);
  }
  addBox(g, [0.5, 0.03, 0.05], std('#5a4030'), [0, 0.72, 0], { cast: false });
  g.position.set(x, 0, z);
  g.rotation.y = rotY;
  parent.add(g);
}


// The clerk: ぴょんさん, a round, friendly hare in the Pyon Mart uniform.
// Chibi proportions — big head, big glossy eyes, blush — so it reads as a mascot.
function hareClerk(parent, x, z, rotY) {
  const g = new THREE.Group();
  const fur = std('#dcdde3', { roughness: 0.9 });
  const furLight = std('#f6f5f3', { roughness: 0.9 });
  const pink = std('#f4b8c4', { roughness: 0.8 });
  const uniform = std('#2b3140', { roughness: 0.6 });
  const shirt = std('#ffffff', { roughness: 0.7 });
  const gold = std('#f2d675', { roughness: 0.5 });

  const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.2, 0.3, 8, 20), shirt);
  torso.position.y = 0.98;
  torso.scale.set(1, 1, 0.85);
  g.add(torso);
  const apron = new THREE.Mesh(new THREE.CapsuleGeometry(0.2, 0.26, 8, 20), uniform);
  apron.scale.set(1.04, 1, 0.9);
  apron.position.set(0, 0.94, 0.012);
  g.add(apron);
  const collar = new THREE.Mesh(new THREE.TorusGeometry(0.15, 0.018, 8, 28), gold);
  collar.rotation.x = Math.PI / 2;
  collar.position.y = 1.2;
  g.add(collar);
  if (brandArt.badge) {
    const cv = document.createElement('canvas');
    cv.width = cv.height = 128;
    cv.getContext('2d').drawImage(brandArt.badge, 0, 0, 128, 128);
    const t = new THREE.CanvasTexture(cv);
    t.colorSpace = THREE.SRGBColorSpace;
    const badge = new THREE.Mesh(new THREE.CircleGeometry(0.035, 24), new THREE.MeshStandardMaterial({ map: t, transparent: true }));
    badge.position.set(-0.08, 1.07, 0.17);
    g.add(badge);
  }

  const headG = new THREE.Group();
  headG.position.y = 1.47;
  g.add(headG);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.21, 32, 24), fur);
  head.scale.set(1.08, 0.95, 1);
  headG.add(head);
  const muzzle = new THREE.Mesh(new THREE.SphereGeometry(0.1, 24, 16), furLight);
  muzzle.scale.set(1.25, 0.8, 0.7);
  muzzle.position.set(0, -0.065, 0.15);
  headG.add(muzzle);
  const nose = new THREE.Mesh(new THREE.SphereGeometry(0.017, 12, 10), std('#e88a9c', { roughness: 0.4 }));
  nose.scale.set(1.3, 0.8, 1);
  nose.position.set(0, -0.035, 0.215);
  headG.add(nose);
  // little ω mouth
  for (const s of [-1, 1]) {
    const m = new THREE.Mesh(new THREE.TorusGeometry(0.014, 0.0035, 6, 16, Math.PI), std('#6a4a50'));
    m.rotation.z = Math.PI;
    m.position.set(s * 0.014, -0.06, 0.212);
    headG.add(m);
  }
  const eyes = [];
  for (const s of [-1, 1]) {
    const eye = new THREE.Group();
    const ball = new THREE.Mesh(new THREE.SphereGeometry(0.034, 20, 16), std('#22252e', { roughness: 0.15 }));
    ball.scale.set(0.9, 1.15, 0.6);
    eye.add(ball);
    const shine = new THREE.Mesh(new THREE.SphereGeometry(0.011, 10, 8), new THREE.MeshBasicMaterial({ color: '#ffffff' }));
    shine.position.set(s * -0.008 + 0.006, 0.014, 0.02);
    eye.add(shine);
    const shine2 = new THREE.Mesh(new THREE.SphereGeometry(0.005, 8, 6), new THREE.MeshBasicMaterial({ color: '#ffffff' }));
    shine2.position.set(-0.008, -0.012, 0.02);
    eye.add(shine2);
    eye.position.set(s * 0.085, 0.0, 0.178);
    eye.rotation.y = s * 0.35;
    headG.add(eye);
    eyes.push(eye);
    const cheek = new THREE.Mesh(new THREE.CircleGeometry(0.032, 20), new THREE.MeshBasicMaterial({ color: '#f6a0b4', transparent: true, opacity: 0.55, depthWrite: false }));
    cheek.scale.set(1.3, 0.8, 1);
    cheek.position.set(s * 0.13, -0.05, 0.16);
    cheek.rotation.y = s * 0.7;
    headG.add(cheek);
  }
  // ears: one up, one flopped forward
  const ears = [];
  for (const s of [-1, 1]) {
    const ear = new THREE.Group();
    const outer = new THREE.Mesh(new THREE.CapsuleGeometry(0.052, 0.16, 8, 16), fur);
    outer.scale.set(1, 1, 0.55);
    outer.position.y = 0.12;
    ear.add(outer);
    const inner = new THREE.Mesh(new THREE.CapsuleGeometry(0.03, 0.12, 6, 12), pink);
    inner.scale.set(1, 1, 0.3);
    inner.position.set(0, 0.12, 0.022);
    ear.add(inner);
    ear.position.set(s * 0.085, 0.15, -0.02);
    ear.rotation.set(s > 0 ? 0.9 : -0.12, 0, s * 0.22);
    ear.userData.base = ear.rotation.clone();
    ear.userData.side = s;
    headG.add(ear);
    ears.push(ear);
  }
  for (const s of [-1, 1]) {
    const arm = new THREE.Mesh(new THREE.CapsuleGeometry(0.055, 0.18, 6, 12), shirt);
    arm.position.set(s * 0.21, 1.02, 0.08);
    arm.rotation.set(-0.9, 0, s * 0.25);
    g.add(arm);
    const paw = new THREE.Mesh(new THREE.SphereGeometry(0.06, 16, 12), furLight);
    paw.position.set(s * 0.22, 0.98, 0.24);
    g.add(paw);
  }
  // name tag
  const L = new Label(160, 64).fill('#ffffff');
  L.rect(0, 0, 160, 18, '#2b3140');
  L.text(w.pyonMart, 80, 41, { size: 22, color: '#2b3140', maxW: 150 });
  const tag = new THREE.Mesh(new THREE.PlaneGeometry(0.1, 0.04), L.material());
  tag.position.set(0.08, 1.08, 0.18);
  tag.userData.sign = true;
  g.add(tag);
  g.traverse((o) => { if (o.isMesh) { o.castShadow = true; if (!o.userData.sign) o.userData.register = true; } });
  g.position.set(x, 0, z);
  g.rotation.y = rotY;
  parent.add(g);
  g.userData = { headG, eyes, ears };
  return g;
}

// ============================================================================

export function buildDecor(scene, mats, colliders, { nightMats, signMats }) {
  const g = new THREE.Group();
  scene.add(g);
  const flags = [];

  // --- window posters (printed both sides, stuck to the glass) ---
  const posters = [
    [foodPoster(w.karaage, w.pyonChiki, '#ffd23a', '#c4302b', 'chips', ['#c98a3a']), -5.1, 1.0],
    [foodPoster(w.oden, w.daikon, '#f6efe3', '#7a3a10', 'bowl', ['#a3502a', '#e8c27a']), -3.05, 1.0],
    [foodPoster(w.cashless, null, '#2a6ad0', '#ffffff', 'sparkle', ['#ffffff']), -1.0, 0.8],
  ];
  for (const [L, x, s] of posters) {
    const p = doubleSided(L, 0.6 * s, 0.6 * s);
    p.position.set(x, 1.95, 5.035);
    g.add(p);
  }
  // autumn campaign poster on the right wall by the entrance
  const ap = plane(autumnPoster(), 0.52, 0.73);
  ap.position.set(-5.975, 2.02, 3.3);
  ap.rotation.y = FACE.px;
  g.add(ap);
  addBox(g, [0.02, 0.78, 0.57], std('#c9a45a', { metalness: 0.5, roughness: 0.4 }), [-5.985, 2.02, 3.3], { cast: false });

  // --- hanging campaign banner over the aisles ---
  const banner = new Label(1024, 200);
  const bc = banner.ctx;
  const gr = bc.createLinearGradient(0, 0, 1024, 0);
  gr.addColorStop(0, '#d0451b'); gr.addColorStop(1, '#e8a23a');
  bc.fillStyle = gr; bc.fillRect(0, 0, 1024, 200);
  for (let i = 0; i < 12; i++) drawArt(bc, 'leaf', 40 + i * 90, i % 2 ? 40 : 165, 60, ['#ffd27a', '#ffb03a']);
  banner.text(w.akiNoMikaku, 512, 104, { size: 110, color: '#ffffff', font: FONTS.mincho, stroke: '#a3320b', strokeW: 10 });
  const bn = doubleSided(banner, 2.2, 0.43);
  bn.position.set(-2.0, 2.2, -1.2);
  g.add(bn);
  for (const dx of [-1.0, 1.0]) addBox(g, [0.008, 0.28, 0.008], std('#999'), [-2.0 + dx, 2.56, -1.2], { cast: false });

  // --- pennant bunting along the inside of the front windows ---
  const colours = ['#2b3140', '#f2d675', '#ffffff', '#8a919c'];
  for (let i = 0; i < 34; i++) {
    const x = -5.9 + i * 0.235;
    const sag = Math.sin(((i % 17) / 17) * Math.PI) * 0.12;
    const tri = new THREE.Mesh(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-0.09, 0, 0), new THREE.Vector3(0.09, 0, 0), new THREE.Vector3(0, -0.17, 0)]), std(colours[i % 4], { side: THREE.DoubleSide, roughness: 0.8 }));
    tri.geometry.computeVertexNormals();
    tri.position.set(x, 2.5 - sag, 4.85);
    g.add(tri);
  }

  // --- shelf talkers on the gondolas ---
  const talk = [[w.osusume, '#ffd23a', '#c4302b'], [w.ninki, '#c4302b', '#ffffff'], [w.shinShohin, '#2a6ad0', '#ffffff'], [w.waribiki, '#f2d675', '#2b3140']];
  const spots = [[-3.2, -1, 0.5, 0.8], [-3.2, 1, 0.88, -0.6], [-3.2, -1, 1.26, -1.6], [-0.8, -1, 0.88, 1.2], [-0.8, 1, 0.5, -0.2], [-0.8, 1, 1.26, 1.0], [1.6, -1, 0.88, 0.3], [1.6, 1, 0.5, -1.2], [1.6, 1, 1.26, 1.4]];
  spots.forEach(([gx, side, y, z], i) => {
    const [word, bg, fg] = talk[i % talk.length];
    const t = talker(word, bg, fg);
    t.position.set(gx + side * 0.5, y - 0.02, z);
    t.rotation.y = 0;            // sticks straight out into the aisle, readable as you walk
    g.add(t);
  });

  // --- basket stack inside the entrance ---
  basketStack(g, 0.55, 4.5);
  colliders.rect(0.55, 4.5, 0.52, 0.36);

  // --- oden pot on the counter, menu board above ---
  const oden = odenPot(g, 4.22, 0.99, 0.5);
  const menu = new Label(1024, 300).fill('#2b3140');
  menu.rect(0, 0, 1024, 60, '#f2d675');
  menu.text(w.hotSnack, 512, 32, { size: 40, color: '#2b3140' });
  const items = [[w.pyonChiki, '¥198', 'chips', ['#c98a3a']], [w.karaage, '¥220', 'chips', ['#b8732f']], [w.oden, '¥120~', 'bowl', ['#a3502a', '#e8c27a']], [w.coffee, '¥120', 'bean', ['#7a4a2a', '#2a1a12']]];
  items.forEach(([word, price, art, cols], i) => {
    const x = 128 + i * 256;
    menu.circle(x, 140, 60, '#3d4558');
    drawArt(menu.ctx, art, x, 140, 100, cols);
    menu.text(word, x, 232, { size: 36, color: '#ffffff', maxW: 230 });
    menu.text(price, x, 274, { size: 30, color: '#f2d675' });
  });
  const menuMat = menu.material({ roughness: 0.5 });
  menuMat.emissive = new THREE.Color('#ffffff');
  menuMat.emissiveMap = menuMat.map;
  menuMat.emissiveIntensity = 0.5;
  const mm = new THREE.Mesh(new THREE.PlaneGeometry(2.0, 0.59), menuMat);
  mm.userData.sign = true;
  mm.position.set(5.97, 2.32, 0.6);
  mm.rotation.y = FACE.nx;
  g.add(mm);

  // --- clock above the staff door ---
  const clock = new THREE.Group();
  const face = new Label(256, 256);
  face.circle(128, 128, 126, '#2b3140');
  face.circle(128, 128, 112, '#ffffff');
  for (let i = 0; i < 12; i++) {
    const t = (i / 12) * TAU;
    face.ctx.fillStyle = '#2b3140';
    face.ctx.beginPath();
    face.ctx.arc(128 + Math.sin(t) * 94, 128 - Math.cos(t) * 94, i % 3 ? 4 : 8, 0, TAU);
    face.ctx.fill();
  }
  if (brandArt.badge) face.ctx.drawImage(brandArt.badge, 108, 150, 40, 40);
  const cf = new THREE.Mesh(new THREE.CircleGeometry(0.2, 40), face.material({ roughness: 0.4, transparent: true }));
  clock.add(cf);
  const hourHand = new THREE.Mesh(new THREE.BoxGeometry(0.014, 0.1, 0.004), std('#2b3140'));
  const minHand = new THREE.Mesh(new THREE.BoxGeometry(0.01, 0.15, 0.004), std('#2b3140'));
  for (const h of [hourHand, minHand]) { h.geometry.translate(0, h.geometry.parameters.height / 2 - 0.01, 0.006); clock.add(h); }
  clock.position.set(5.0, 2.4, -4.93);
  g.add(clock);

  // --- emergency exit sign (green running figure) ---
  const ex = new Label(384, 128).fill('#1d8a4a');
  ex.ctx.fillStyle = '#ffffff';
  ex.ctx.fillRect(24, 20, 88, 88);
  ex.ctx.fillStyle = '#1d8a4a';
  ex.ctx.beginPath(); ex.ctx.arc(70, 40, 9, 0, TAU); ex.ctx.fill();
  ex.ctx.lineWidth = 9; ex.ctx.strokeStyle = '#1d8a4a'; ex.ctx.lineCap = 'round';
  ex.ctx.beginPath(); ex.ctx.moveTo(64, 52); ex.ctx.lineTo(56, 76); ex.ctx.lineTo(70, 96); ex.ctx.moveTo(56, 76); ex.ctx.lineTo(40, 94); ex.ctx.moveTo(62, 58); ex.ctx.lineTo(84, 66); ex.ctx.stroke();
  ex.text(w.hijoguchi, 250, 66, { size: 60, color: '#ffffff' });
  const exMat = ex.material();
  exMat.emissive = new THREE.Color('#ffffff');
  exMat.emissiveMap = exMat.map;
  exMat.emissiveIntensity = 0.8;
  const es = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 0.14), exMat);
  es.userData.sign = true;
  es.position.set(5.0, 2.15, -4.93);
  g.add(es);
  clock.position.set(3.9, 2.35, -4.93);

  // --- security mirror + cameras ---
  const mirror = new THREE.Mesh(new THREE.SphereGeometry(0.28, 32, 16, 0, TAU, 0, Math.PI / 2), new THREE.MeshStandardMaterial({ color: '#ffffff', metalness: 1, roughness: 0.04 }));
  mirror.rotation.x = Math.PI / 2 + 0.6;
  mirror.rotation.z = -0.7;
  mirror.position.set(-5.72, 2.42, -3.85);
  g.add(mirror);
  for (const [x, z, r] of [[5.6, 4.6, 2.3], [-5.6, 4.6, -2.3], [5.6, -4.6, 0.8]]) {
    const cam = new THREE.Group();
    addBox(cam, [0.08, 0.06, 0.16], std('#e8e8e4'), [0, 0, 0.06], { cast: false });
    addBox(cam, [0.02, 0.08, 0.02], std('#e8e8e4'), [0, 0.06, 0], { cast: false });
    const lens = new THREE.Mesh(new THREE.CircleGeometry(0.022, 16), std('#111', { roughness: 0.05 }));
    lens.position.z = 0.141;
    cam.add(lens);
    cam.position.set(x, 2.58, z);
    cam.rotation.set(-0.35, r, 0);
    g.add(cam);
  }

  // ===== outside =====

  // nobori flags lining the forecourt
  const flagDefs = [[w.karaage, '#c4302b', '#ffffff'], [w.oden, '#f6efe3', '#7a3a10'], [w.aisu, '#5ac0f0', '#ffffff'], [w.akiNoMikaku, '#d0451b', '#ffd27a']];
  flagDefs.forEach(([word, bg, fg], i) => {
    const x = -5.6 + i * 1.9;
    addBox(g, [0.035, 2.6, 0.035], std('#d8dce0', { metalness: 0.6, roughness: 0.35 }), [x, 1.3, 6.5]);
    addBox(g, [0.5, 0.02, 0.02], std('#d8dce0', { metalness: 0.6, roughness: 0.35 }), [x + 0.24, 2.55, 6.5], { cast: false });
    addBox(g, [0.4, 0.12, 0.4], std('#3a3d42'), [x, 0.06, 6.5]);
    const f = noboriFlag(word, bg, fg);
    f.position.set(x + 0.245, 1.6, 6.5);
    f.castShadow = true;
    g.add(f);
    flags.push({ mesh: f, phase: i * 1.7 });
    colliders.rect(x, 6.5, 0.4, 0.4);
  });

  // bicycles + sign at the side of the store
  for (const [z, col] of [[2.0, '#c9d3dd'], [3.0, '#2a6a3a'], [4.0, '#c4302b']]) bicycle(g, 6.8, z, 0.0, col);
  addBox(g, [0.04, 0.6, 3.4], std('#9aa0a8', { metalness: 0.7, roughness: 0.35 }), [6.6, 0.3, 3.0]);
  const cs = sign(w.churinjo, { w: 0.6, h: 0.18, bg: '#2a6ad0', fg: '#fff', res: 256 });
  cs.position.set(6.21, 1.6, 3.0);
  cs.rotation.y = FACE.px;
  g.add(cs);
  colliders.add(6.2, 7.3, 1.4, 4.6);

  // post box by the sidewalk, planters and the A-frame board
  postBox(g, -8.2, 13.2);
  colliders.rect(-8.2, 13.2, 0.6, 0.6);
  planter(g, -6.9, 5.5, 1.2);
  colliders.rect(-6.9, 5.5, 1.2, 0.4);
  aFrame(g, 1.4, 6.25, 0.25);
  colliders.rect(1.4, 6.25, 0.6, 0.4);

  const clerk = hareClerk(g, 4.95, 1.4, -Math.PI / 2);
  const { headG, eyes, ears } = clerk.userData;
  let blink = 2;

  let t = 0;
  return {
    clerk,
    group: g,
    update(dt, hours) {
      t += dt;
      // flags ripple in the breeze
      for (const { mesh, phase } of flags) {
        const pos = mesh.geometry.attributes.position, base = mesh.userData.base;
        for (let i = 0; i < pos.count; i++) {
          const x = base[i * 3], y = base[i * 3 + 1];
          const k = (x + 0.225) / 0.45;
          pos.setZ(i, Math.sin(t * 2.2 + phase + y * 2.5 + x * 6) * 0.05 * k);
        }
        pos.needsUpdate = true;
      }
      // the clock tells the game's time
      const h = hours % 12;
      hourHand.rotation.z = -(h / 12) * TAU;
      minHand.rotation.z = -((hours % 1)) * TAU;
      // the clerk breathes, and twitches an ear now and then
      clerk.position.y = Math.sin(t * 1.6) * 0.006;
      headG.rotation.z = Math.sin(t * 0.5) * 0.06;
      headG.rotation.x = Math.sin(t * 0.37) * 0.04;
      blink -= dt;
      const closed = blink < 0.12;
      if (blink < 0) blink = 2.5 + Math.random() * 3;
      for (const e of eyes) e.scale.y = closed ? 0.12 : 1;
      for (const e of ears) {
        const twitch = Math.sin(t * 0.9 + e.userData.side * 2) > 0.97 ? 0.18 : 0;
        e.rotation.z = e.userData.base.z + e.userData.side * twitch;
      }
      // a little shimmer on the oden broth
      oden.broth.material.emissiveIntensity = 0.18 + Math.sin(t * 3) * 0.04;
    },
  };
}
