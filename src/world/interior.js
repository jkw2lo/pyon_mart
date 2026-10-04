import * as THREE from 'three';
import { addBox, std, sign } from './common.js';
import { Label, FONTS, canvasTex } from '../label.js';
import { words as w } from '../data/words.js';
import { byId } from '../data/products.js';
import { ShelfStocker, productTemplate } from '../products.js';

// Store interior: x ∈ [-6, 6], z ∈ [-5, 5], entrance at the front (+z) around x = 3.

const V = (x, y, z) => new THREE.Vector3(x, y, z);
const FACE = { px: Math.PI / 2, nx: -Math.PI / 2, pz: 0, nz: Math.PI };

const tagCache = new Map();
function priceTag(def) {
  if (tagCache.has(def.id)) return tagCache.get(def.id);
  const L = new Label(256, 128).fill('#ffffff');
  L.rect(0, 0, 256, 30, '#3a4150');
  L.text(def.title, 128, 15, { size: 22, color: '#fff', maxW: 240 });
  L.ctx.fillStyle = '#c4302b';
  L.ctx.font = '800 54px "Noto Sans JP", sans-serif';
  L.ctx.textAlign = 'right';
  L.ctx.textBaseline = 'middle';
  L.ctx.fillText(`¥${def.price}`, 200, 76);
  L.text(w.zeikomi, 228, 82, { size: 18, color: '#555', weight: 500 });
  L.text(def.note || '', 50, 110, { size: 16, color: '#777', weight: 500 });
  const m = L.material({ roughness: 0.5 });
  tagCache.set(def.id, m);
  return m;
}

// Fill a straight run of shelf with the given product ids.
// start: front-left corner at shelf top, along: unit vector down the shelf,
// inward: unit vector from the front edge toward the back.
function stockRun(stocker, tagParent, ids, { start, along, inward, length, depth, rotY, gap = 0.008, rows = 3, tag = true, lie = false, tagY = -0.03 }) {
  const seg = length / ids.length;
  ids.forEach((id, i) => {
    const def = byId[id];
    const size = productTemplate(def).userData.size;
    const wdt = (lie ? size.x : size.x) + gap;
    const dep = (lie ? size.y : size.z) + gap;
    const n = Math.max(1, Math.floor((seg - 0.02) / wdt));
    const nd = Math.max(1, Math.min(rows, Math.floor(depth / dep)));
    const off = i * seg + (seg - n * wdt) / 2 + wdt / 2;
    for (let k = 0; k < n; k++) {
      for (let r = 0; r < nd; r++) {
        const p = start.clone().addScaledVector(along, off + k * wdt).addScaledVector(inward, 0.015 + dep / 2 + r * dep);
        if (lie) p.y += size.z / 2;
        stocker.add(def, p, rotY, lie ? -Math.PI / 2 : 0);
      }
    }
    if (tag) {
      const t = new THREE.Mesh(new THREE.PlaneGeometry(0.1, 0.05), priceTag(def));
      const p = start.clone().addScaledVector(along, i * seg + seg / 2).addScaledVector(inward, -0.012);
      p.y += tagY;
      t.position.copy(p);
      t.rotation.y = rotY;
      tagParent.add(t);
    }
  });
}

function hangingSign(parent, word, x, y, z, rotY, { w = 1.3, h = 0.36, bg = '#3a4150', fg = '#ffffff' } = {}) {
  const g = new THREE.Group();
  for (const s of [1, -1]) {
    const m = sign(word, { w, h, bg, fg, font: FONTS.round, res: 512 });
    m.position.z = s * 0.011;
    if (s < 0) m.rotation.y = Math.PI;
    g.add(m);
  }
  addBox(g, [w, h, 0.02], std(bg), [0, 0, 0], { cast: false });
  for (const dx of [-w / 2 + 0.1, w / 2 - 0.1]) addBox(g, [0.01, 2.7 - y - h / 2, 0.01], std('#999'), [dx, (2.7 - y) / 2 + h / 4, 0], { cast: false });
  g.position.set(x, y, z);
  g.rotation.y = rotY;
  parent.add(g);
  return g;
}

function magazineCover(i) {
  const titles = ['PYON WEEKLY', 'MOON', 'TOKYO WALK', 'CAMERA+', 'GAME DASH', 'KITCHEN', 'STYLE', 'MANGA JUMP'];
  const cols = ['#e8423a', '#2a6ad0', '#f2c230', '#1d8a6a', '#7a3ac0', '#ff8a3a', '#d03a8a', '#3a4150'];
  const t = canvasTex(128, 170, (c) => {
    c.fillStyle = '#f4f2ee'; c.fillRect(0, 0, 128, 170);
    c.fillStyle = cols[i % 8]; c.fillRect(0, 0, 128, 40);
    c.fillStyle = '#fff'; c.font = '900 18px sans-serif'; c.textAlign = 'center'; c.fillText(titles[i % 8], 64, 27);
    c.fillStyle = `hsl(${(i * 47) % 360},40%,60%)`; c.fillRect(10, 48, 108, 90);
    c.fillStyle = `hsl(${(i * 47 + 180) % 360},50%,40%)`; c.beginPath(); c.arc(64, 100, 28, 0, 7); c.fill();
    c.fillStyle = '#333'; for (let k = 0; k < 3; k++) c.fillRect(12, 144 + k * 8, 70 - k * 14, 4);
  });
  return std('#fff', { map: t, roughness: 0.4 });
}

export function buildInterior(scene, mats, colliders) {
  const g = new THREE.Group();
  scene.add(g);
  const stocker = new ShelfStocker();
  const tags = new THREE.Group();
  g.add(tags);

  // floor, ceiling, wall linings
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(12, 10), mats.floor);
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = 0.002;
  floor.receiveShadow = true;
  g.add(floor);
  const ceil = new THREE.Mesh(new THREE.PlaneGeometry(12, 10), mats.ceiling);
  ceil.rotation.x = Math.PI / 2;
  ceil.position.y = 2.7;
  g.add(ceil);
  const lin = (wd, x, z, ry) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(wd, 2.7), mats.wallIn);
    m.position.set(x, 1.35, z);
    m.rotation.y = ry;
    m.receiveShadow = true;
    g.add(m);
  };
  lin(10, -5.995, 0, FACE.px);
  lin(10, 5.995, 0, FACE.nx);
  lin(12, 0, -4.995, 0);
  // band above the front windows on the inside
  addBox(g, [8.2, 0.15, 0.04], mats.wallIn, [-2.1, 2.62, 4.93], { cast: false });

  // ceiling light troffers + the lights that actually light the room
  for (let x = -4.5; x <= 4.6; x += 1.8) {
    for (let z = -3.6; z <= 3.7; z += 1.8) {
      addBox(g, [1.2, 0.03, 0.22], mats.lightPanel, [x, 2.685, z], { cast: false, receive: false });
    }
  }
  const lights = [];
  for (const [x, z] of [[-3.6, -2.6], [0, -2.6], [3.6, -2.6], [-3.6, 1.6], [0, 1.6], [3.6, 1.6]]) {
    const L = new THREE.PointLight('#f4f7ff', 10, 7.5, 1.5);
    L.position.set(x, 2.5, z);
    g.add(L);
    lights.push(L);
  }

  // --- back wall: walk-in drink fridges -------------------------------------
  const fx0 = -5.85, nDoors = 10, dw = 0.92, fz = -4.12, shelfDepth = 0.68;
  const fx1 = fx0 + nDoors * dw;
  addBox(g, [fx1 - fx0, 0.15, 0.9], mats.darkMetal, [(fx0 + fx1) / 2, 0.075, -4.55]);
  addBox(g, [fx1 - fx0, 0.5, 0.9], mats.slate, [(fx0 + fx1) / 2, 2.45, -4.55]);
  addBox(g, [fx1 - fx0, 2.05, 0.04], mats.fridgeLight, [(fx0 + fx1) / 2, 1.175, -4.98], { cast: false });
  addBox(g, [0.06, 2.7, 0.9], mats.darkMetal, [fx1 + 0.03, 1.35, -4.55]);
  const glass = addBox(g, [fx1 - fx0, 2.05, 0.012], mats.fridgeGlass, [(fx0 + fx1) / 2, 1.175, fz], { cast: false, receive: false });
  glass.userData.noHit = true;
  addBox(g, [fx1 - fx0, 0.05, 0.05], mats.darkMetal, [(fx0 + fx1) / 2, 2.2, fz]);
  addBox(g, [fx1 - fx0, 0.05, 0.05], mats.darkMetal, [(fx0 + fx1) / 2, 0.17, fz]);
  const sections = [
    ['ryokucha', 'ryokucha', 'hojicha', 'hojicha', 'mugicha'],
    ['mugicha', 'tennensui', 'tennensui', 'orange', 'orange'],
    ['hojicha', 'ryokucha', 'tennensui', 'mugicha', 'ryokucha'],
    ['bito', 'black', 'bito', 'black', 'bito'],
    ['ramune', 'genki', 'ramune', 'genki', 'ramune'],
    ['gyunyu', 'ichigo', 'cafeaulait', 'gyunyu', 'ichigo'],
    ['cafeaulait', 'ichigo', 'gyunyu', 'orange', 'tennensui'],
    ['beer', 'beer', 'beer', 'beer', 'beer'],
    ['beer', 'beer', 'genki', 'ramune', 'beer'],
    ['tennensui', 'ryokucha', 'orange', 'hojicha', 'mugicha'],
  ];
  const shelfYs = [1.72, 1.35, 0.98, 0.61, 0.24];
  for (let d = 0; d < nDoors; d++) {
    const x0 = fx0 + d * dw;
    addBox(g, [0.05, 2.05, 0.06], mats.darkMetal, [x0, 1.175, fz], { cast: false });
    addBox(g, [0.025, 0.9, 0.04], mats.aluminium, [x0 + dw - 0.09, 1.2, fz + 0.04], { cast: false });
    addBox(g, [0.02, 1.95, 0.02], mats.fridgeLight, [x0 + 0.04, 1.175, fz - 0.06], { cast: false, receive: false });
    shelfYs.forEach((y, s) => {
      addBox(g, [dw - 0.04, 0.02, shelfDepth], mats.shelfWhite, [x0 + dw / 2, y - 0.01, -4.6], { cast: false });
      stockRun(stocker, tags, [sections[d][s]], {
        start: V(x0 + 0.03, y, -4.27), along: V(1, 0, 0), inward: V(0, 0, -1), length: dw - 0.06, depth: shelfDepth - 0.04, rotY: FACE.pz, rows: 3, tagY: -0.03,
      });
    });
  }
  colliders.add(fx0 - 0.1, fx1 + 0.06, -5, -4.08);
  const drinksSign = sign(w.nomimono, { w: 2.2, h: 0.36, bg: '#3a4150', fg: '#fff', res: 512 });
  drinksSign.position.set(-1.2, 2.45, -4.095);
  g.add(drinksSign);
  const coldSign = sign(w.tsumetai, { w: 1.1, h: 0.26, bg: '#2a6ad0', fg: '#fff', res: 512 });
  coldSign.position.set(1.8, 2.45, -4.095);
  g.add(coldSign);
  // staff door
  addBox(g, [1.0, 2.1, 0.05], std('#c8ccd2', { roughness: 0.5 }), [5.0, 1.05, -4.96]);
  const staff = new Label(256, 64).fill('#3a4150');
  staff.ctx.fillStyle = '#fff'; staff.ctx.font = '700 30px sans-serif'; staff.ctx.textAlign = 'center'; staff.ctx.fillText('STAFF ONLY', 128, 44);
  const st = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.125), staff.material());
  st.position.set(5.0, 1.6, -4.93);
  g.add(st);

  // --- left wall: open chiller with onigiri, sandwiches, bento ---------------
  const cz0 = -3.4, cz1 = 2.2, cLen = cz1 - cz0, cx = -5.98;
  addBox(g, [0.85, 0.55, cLen], std('#e9ebee', { roughness: 0.4 }), [cx + 0.425, 0.275, (cz0 + cz1) / 2]);
  addBox(g, [0.04, 2.1, cLen], mats.fridgeLight, [cx + 0.02, 1.05, (cz0 + cz1) / 2], { cast: false });
  addBox(g, [0.6, 0.22, cLen], mats.slate, [cx + 0.3, 2.0, (cz0 + cz1) / 2]);
  addBox(g, [0.45, 0.015, cLen], mats.fridgeLight, [cx + 0.3, 1.885, (cz0 + cz1) / 2], { cast: false });
  for (const z of [cz0, cz1]) addBox(g, [0.88, 2.1, 0.05], std('#e9ebee', { roughness: 0.4 }), [cx + 0.44, 1.05, z]);
  addBox(g, [0.06, 0.12, cLen], mats.shelfEdge, [cx + 0.85, 0.5, (cz0 + cz1) / 2]);
  const cShelves = [
    { y: 1.6, d: 0.36, ids: ['konbu', 'mentaiko', 'tunamayo', 'benishake', 'ume'] },
    { y: 1.26, d: 0.42, ids: ['tunamayo', 'benishake', 'ume', 'konbu', 'mentaiko'] },
    { y: 0.92, d: 0.5, ids: ['tamago', 'katsu', 'tamago', 'katsu'] },
    { y: 0.55, d: 0.75, ids: ['karaage', 'makunouchi', 'zarusoba', 'karaage'], rows: 4 },
  ];
  for (const s of cShelves) {
    if (s.y > 0.6) addBox(g, [s.d, 0.02, cLen - 0.06], mats.shelfWhite, [cx + 0.04 + s.d / 2, s.y - 0.01, (cz0 + cz1) / 2], { cast: false });
    stockRun(stocker, tags, s.ids, {
      start: V(cx + 0.04 + s.d, s.y, cz1 - 0.03), along: V(0, 0, -1), inward: V(-1, 0, 0), length: cLen - 0.06, depth: s.d - 0.03, rotY: FACE.px, rows: s.rows || 3,
    });
  }
  colliders.add(-6, cx + 0.9, cz0 - 0.03, cz1 + 0.03);
  hangingSign(g, w.onigiri, -5.2, 2.32, 0.6, FACE.px, { w: 1.3 });
  hangingSign(g, w.obento, -5.2, 2.32, -2.0, FACE.px, { w: 1.3 });

  // --- centre gondolas -----------------------------------------------------
  const gz0 = -2.6, gz1 = 2.0, gLen = gz1 - gz0;
  const gondolas = [
    { x: -3.2, nx: [['kitsune', 'curryudon'], ['miso', 'shoyu'], ['shoyu', 'kitsune'], ['yakisoba', 'miso']],
      px: [['kakinotane', 'ebisen'], ['chips-usushio', 'chips-norishio'], ['chips-norishio', 'chips-consomme'], ['gummy', 'ebisen', 'gummy']],
      sign: w.kappumen },
    { x: -0.8, nx: [['chips-consomme', 'chips-usushio'], ['pyonstick', 'matchachoco'], ['gummy', 'pyonstick', 'gummy'], ['matchachoco', 'dango']],
      px: [['dango', 'dango'], ['pyonstick', 'gummy', 'pyonstick'], ['matchachoco', 'matchachoco'], ['kakinotane', 'ebisen']],
      sign: w.okashi },
    { x: 1.6, nx: [['mask', 'denchi'], ['hamigaki', 'denchi'], ['mask', 'hamigaki'], ['denchi', 'denchi']],
      px: [['yakisoba', 'shoyu'], ['miso', 'curryudon'], ['gummy', 'pyonstick'], ['kitsune', 'shoyu']],
      sign: w.nichiyohin },
  ];
  const levels = [0.12, 0.5, 0.88, 1.26];
  const gDepth = 0.4;
  for (const G of gondolas) {
    const zc = (gz0 + gz1) / 2;
    addBox(g, [0.9, 0.12, gLen], mats.shelfWhite, [G.x, 0.06, zc]);
    addBox(g, [0.06, 1.55, gLen], mats.shelfWhite, [G.x, 0.775, zc]);
    addBox(g, [0.9, 0.03, gLen], mats.shelfEdge, [G.x, 1.56, zc]);
    for (const z of [gz0, gz1]) addBox(g, [0.92, 1.58, 0.03], mats.shelfWhite, [G.x, 0.79, z]);
    for (const side of [-1, 1]) {
      const list = side < 0 ? G.nx : G.px;
      const front = G.x + side * 0.45;
      levels.forEach((y, li) => {
        if (li > 0) addBox(g, [gDepth, 0.02, gLen - 0.04], mats.shelfWhite, [G.x + side * (0.03 + gDepth / 2), y - 0.01, zc], { cast: false });
        addBox(g, [0.012, 0.045, gLen - 0.04], mats.shelfEdge, [front + side * 0.006, y - 0.03, zc], { cast: false, receive: false });
        stockRun(stocker, tags, list[li], {
          start: V(front, y, side < 0 ? gz1 - 0.02 : gz0 + 0.02),
          along: V(0, 0, side < 0 ? -1 : 1), inward: V(-side, 0, 0),
          length: gLen - 0.04, depth: gDepth - 0.05, rotY: side < 0 ? FACE.nx : FACE.px, rows: 2, tagY: -0.03,
        });
      });
    }
    colliders.add(G.x - 0.47, G.x + 0.47, gz0 - 0.03, gz1 + 0.36);
    hangingSign(g, G.sign, G.x, 2.3, 0.6, FACE.pz, { w: 1.2 });
  }
  // endcaps facing the entrance (promo: moon-viewing dumplings for October)
  const ez = gz1 + 0.17;
  for (const [x, ids] of [[-3.2, ['chips-usushio', 'chips-consomme']], [-0.8, ['dango']], [1.6, ['gummy', 'pyonstick']]]) {
    addBox(g, [0.9, 0.12, 0.32], mats.shelfWhite, [x, 0.06, ez]);
    for (const y of [0.12, 0.55, 0.98]) {
      if (y > 0.2) addBox(g, [0.88, 0.02, 0.3], mats.shelfWhite, [x, y - 0.01, ez], { cast: false });
      stockRun(stocker, tags, ids, { start: V(x - 0.43, y, ez + 0.15), along: V(1, 0, 0), inward: V(0, 0, -1), length: 0.86, depth: 0.28, rotY: FACE.pz, rows: 1, tagY: -0.03 });
    }
  }
  const promo = sign(w.kikanGentei, { w: 0.86, h: 0.22, bg: '#2b3140', fg: '#f2d675', res: 512 });
  promo.position.set(-0.8, 1.66, gz1 + 0.035);
  g.add(promo);
  const promo2 = sign(w.tsukimiDango, { w: 0.86, h: 0.18, bg: '#f2d675', fg: '#2b3140', res: 512 });
  promo2.position.set(-0.8, 1.45, gz1 + 0.035);
  g.add(promo2);

  // --- chest freezer --------------------------------------------------------
  const fzx = -2.0, fzz = 3.45, fW = 1.8, fD = 0.75;
  addBox(g, [fW, 0.8, fD], std('#f2f4f6', { roughness: 0.35 }), [fzx, 0.4, fzz]);
  addBox(g, [fW - 0.1, 0.02, fD - 0.1], std('#3d6a9a', { roughness: 0.6 }), [fzx, 0.81, fzz]);
  const lid = addBox(g, [fW, 0.02, fD], mats.fridgeGlass, [fzx, 0.95, fzz], { cast: false, receive: false });
  lid.userData.noHit = true;
  addBox(g, [fW, 0.15, 0.04], std('#f2f4f6', { roughness: 0.35 }), [fzx, 0.88, fzz + fD / 2 - 0.02]);
  addBox(g, [fW, 0.15, 0.04], std('#f2f4f6', { roughness: 0.35 }), [fzx, 0.88, fzz - fD / 2 + 0.02]);
  addBox(g, [0.04, 0.15, fD], std('#f2f4f6', { roughness: 0.35 }), [fzx - fW / 2 + 0.02, 0.88, fzz]);
  addBox(g, [0.04, 0.15, fD], std('#f2f4f6', { roughness: 0.35 }), [fzx + fW / 2 - 0.02, 0.88, fzz]);
  stockRun(stocker, tags, ['vanilla', 'matchaice'], { start: V(fzx - 0.85, 0.82, fzz + 0.32), along: V(1, 0, 0), inward: V(0, 0, -1), length: 0.85, depth: 0.6, rotY: 0, rows: 6, tag: false, gap: 0.01 });
  stockRun(stocker, tags, ['azuki', 'soda'], { start: V(fzx + 0.02, 0.82, fzz + 0.32), along: V(1, 0, 0), inward: V(0, 0, -1), length: 0.85, depth: 0.6, rotY: 0, rows: 3, tag: false, lie: true, gap: 0.01 });
  for (const [x, id] of [[fzx - 0.62, 'vanilla'], [fzx - 0.2, 'matchaice'], [fzx + 0.22, 'azuki'], [fzx + 0.64, 'soda']]) {
    const t = new THREE.Mesh(new THREE.PlaneGeometry(0.1, 0.05), priceTag(byId[id]));
    t.position.set(x, 0.86, fzz + fD / 2 + 0.002);
    g.add(t);
  }
  const iceSign = sign(w.aisu, { w: 0.9, h: 0.2, bg: '#5ac0f0', fg: '#fff', res: 512 });
  iceSign.position.set(fzx, 0.58, fzz + fD / 2 + 0.003);
  g.add(iceSign);
  const reitoSign = sign(w.reito, { w: 0.4, h: 0.14, bg: '#1d4f9c', fg: '#fff', res: 256 });
  reitoSign.position.set(fzx + 0.6, 0.58, fzz + fD / 2 + 0.003);
  g.add(reitoSign);
  colliders.rect(fzx, fzz, fW + 0.04, fD + 0.04);

  // --- magazine rack along the window ---------------------------------------
  const mx0 = -5.7, mx1 = -0.8;
  addBox(g, [mx1 - mx0, 0.45, 0.38], mats.shelfWhite, [(mx0 + mx1) / 2, 0.225, 4.72]);
  addBox(g, [mx1 - mx0, 1.15, 0.04], mats.shelfWhite, [(mx0 + mx1) / 2, 0.575, 4.9]);
  let mi = 0;
  for (const [y, z] of [[0.48, 4.66], [0.8, 4.76], [1.08, 4.84]]) {
    addBox(g, [mx1 - mx0, 0.02, 0.14], mats.shelfEdge, [(mx0 + mx1) / 2, y - 0.02, z]);
    for (let x = mx0 + 0.15; x < mx1 - 0.1; x += 0.24) {
      const m = new THREE.Mesh(new THREE.BoxGeometry(0.21, 0.28, 0.01), [mats.white, mats.white, mats.white, mats.white, magazineCover(mi++), mats.white]);
      m.position.set(x, y + 0.13, z - 0.02);
      m.rotation.x = -0.22;
      g.add(m);
    }
  }
  const zs = sign(w.zasshi, { w: 0.6, h: 0.2, bg: '#3a4150', fg: '#fff', res: 256 });
  zs.position.set(-3.2, 1.28, 4.875);
  g.add(zs);
  colliders.add(mx0, mx1, 4.5, 5);

  // --- copier + ATM ---------------------------------------------------------
  addBox(g, [0.7, 1.0, 0.65], std('#e8e8e4', { roughness: 0.4 }), [-5.6, 0.5, 2.85]);
  addBox(g, [0.7, 0.08, 0.65], std('#3a3d42'), [-5.6, 1.04, 2.85]);
  addBox(g, [0.3, 0.12, 0.2], std('#2a2d33', { emissive: '#3a6ad0', emissiveIntensity: 0.6 }), [-5.3, 1.0, 2.85]);
  const cs = sign(w.kopi, { w: 0.5, h: 0.16, bg: '#2a6ad0', fg: '#fff', res: 256 });
  cs.position.set(-5.24, 0.75, 2.85);
  cs.rotation.y = FACE.px;
  g.add(cs);
  addBox(g, [0.6, 1.4, 0.7], std('#d9dde2', { roughness: 0.4 }), [-5.65, 0.7, 3.85]);
  addBox(g, [0.04, 0.3, 0.4], std('#1d2a4a', { emissive: '#4aa0ff', emissiveIntensity: 0.8 }), [-5.34, 1.1, 3.85]);
  const atm = new Label(256, 128).fill('#1d4f9c');
  atm.ctx.fillStyle = '#fff'; atm.ctx.font = '900 64px sans-serif'; atm.ctx.textAlign = 'center'; atm.ctx.fillText('ATM', 128, 66);
  atm.text(w.hikidashi, 128, 104, { size: 26, color: '#fff' });
  const atmS = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.25), atm.material());
  atmS.position.set(-5.34, 1.5, 3.85);
  atmS.rotation.y = FACE.px;
  atmS.userData.sign = true;
  g.add(atmS);
  colliders.add(-6, -5.25, 2.5, 4.25);

  // --- counter --------------------------------------------------------------
  const kx = 4.25, kz0 = -2.4, kz1 = 3.0, kLen = kz1 - kz0, kzc = (kz0 + kz1) / 2;
  addBox(g, [0.7, 0.95, kLen], std('#f3f1ec', { roughness: 0.5 }), [kx, 0.475, kzc]);
  addBox(g, [0.8, 0.04, kLen + 0.06], std('#c9b28f', { roughness: 0.45 }), [kx, 0.97, kzc]);
  addBox(g, [0.02, 0.14, kLen], mats.slate, [kx - 0.36, 0.8, kzc], { cast: false });
  addBox(g, [0.02, 0.025, kLen], std('#f2d675'), [kx - 0.36, 0.71, kzc], { cast: false });
  for (const z of [-0.4, 1.4]) {
    addBox(g, [0.32, 0.1, 0.36], std('#2a2d33', { roughness: 0.4 }), [kx + 0.1, 1.04, z]);
    addBox(g, [0.04, 0.24, 0.3], std('#1a1c20', { emissive: '#7ab8ff', emissiveIntensity: 0.6 }), [kx - 0.1, 1.2, z]);
    addBox(g, [0.03, 0.12, 0.03], mats.darkMetal, [kx - 0.06, 1.05, z]);
  }
  // hot snack case
  addBox(g, [0.5, 0.05, 0.9], std('#2a2d33'), [kx, 1.015, -1.6]);
  const hotGlass = addBox(g, [0.5, 0.45, 0.9], new THREE.MeshStandardMaterial({ color: '#ffe8c0', transparent: true, opacity: 0.18, roughness: 0.05, depthWrite: false }), [kx, 1.26, -1.6], { cast: false, receive: false });
  hotGlass.userData.noHit = true;
  addBox(g, [0.48, 0.02, 0.88], std('#ffcf8a', { emissive: '#ff9a3a', emissiveIntensity: 0.9 }), [kx, 1.47, -1.6], { cast: false });
  const chicken = std('#c98a3a', { roughness: 0.75 });
  const sleeve = std('#ffffff', { roughness: 0.6 });
  for (let i = 0; i < 6; i++) {
    const z = -1.95 + i * 0.14;
    addBox(g, [0.09, 0.1, 0.1], chicken, [kx - 0.06, 1.1, z], { cast: false });
    addBox(g, [0.1, 0.06, 0.11], sleeve, [kx - 0.06, 1.07, z], { cast: false });
    addBox(g, [0.08, 0.08, 0.08], chicken, [kx + 0.12, 1.32, z], { cast: false });
  }
  const hs = sign(w.hotSnack, { w: 0.86, h: 0.12, bg: '#c4302b', fg: '#fff', res: 512 });
  hs.position.set(kx - 0.255, 1.42, -1.6);
  hs.rotation.y = FACE.nx;
  g.add(hs);
  const pc = sign(w.pyonChiki, { w: 0.3, h: 0.1, bg: '#ffd23a', fg: '#c4302b', res: 256, sub: null });
  pc.position.set(kx - 0.255, 1.12, -1.75);
  pc.rotation.y = FACE.nx;
  g.add(pc);
  // coffee machine at the front end of the counter
  addBox(g, [0.45, 0.62, 0.42], std('#1b1c1f', { roughness: 0.35, metalness: 0.3 }), [kx, 1.3, 2.6]);
  addBox(g, [0.02, 0.18, 0.28], std('#202733', { emissive: '#ffffff', emissiveIntensity: 0.5 }), [kx - 0.23, 1.45, 2.6]);
  addBox(g, [0.18, 0.14, 0.18], std('#ffffff'), [kx - 0.1, 1.06, 2.6]);
  const cof = sign(w.coffee, { w: 0.4, h: 0.12, bg: '#2a1a12', fg: '#f2d9a8', res: 256 });
  cof.position.set(kx - 0.231, 1.66, 2.6);
  cof.rotation.y = FACE.nx;
  g.add(cof);
  const heat = sign(w.atatamemasu, { w: 0.7, h: 0.12, bg: '#ffffff', fg: '#c4302b', res: 512, border: '#c4302b' });
  heat.position.set(kx - 0.362, 0.55, 0.5);
  heat.rotation.y = FACE.nx;
  g.add(heat);
  const brand = sign(w.pyonMart, { w: 0.9, h: 0.11, bg: '#3a4150', fg: '#fff', res: 512 });
  brand.position.set(kx - 0.362, 0.8, -0.9);
  brand.rotation.y = FACE.nx;
  g.add(brand);
  hangingSign(g, w.reji, kx - 0.2, 2.3, 0.5, FACE.px, { w: 0.9, bg: '#f2d675', fg: '#2b3140' });
  colliders.add(kx - 0.4, 6, kz0, kz1 + 0.03);
  // back counter: microwaves, wall of goods behind the clerk
  addBox(g, [0.5, 0.9, 4.5], std('#e8e6e0', { roughness: 0.5 }), [5.73, 0.45, 0.5]);
  for (const z of [-0.6, 0.0]) {
    addBox(g, [0.4, 0.28, 0.48], std('#dcdcd8', { roughness: 0.4 }), [5.7, 1.04, z]);
    addBox(g, [0.01, 0.2, 0.3], std('#111', { roughness: 0.1 }), [5.495, 1.04, z - 0.04], { cast: false });
  }
  const backWall = canvasTex(512, 256, (c) => {
    c.fillStyle = '#f0eee8'; c.fillRect(0, 0, 512, 256);
    for (let r = 0; r < 6; r++) for (let k = 0; k < 24; k++) {
      c.fillStyle = `hsl(${(k * 37 + r * 90) % 360},${30 + (k % 3) * 20}%,${45 + (r % 2) * 15}%)`;
      c.fillRect(6 + k * 21, 10 + r * 40, 16, 26);
    }
  });
  const bw = new THREE.Mesh(new THREE.PlaneGeometry(4.2, 1.0), std('#fff', { map: backWall }));
  bw.position.set(5.99, 1.7, 0.5);
  bw.rotation.y = FACE.nx;
  g.add(bw);
  colliders.add(5.45, 6, -2.4, 3.0);

  // welcome mat
  const mat = new Label(512, 320).fill('#3a3d42');
  mat.ctx.strokeStyle = '#5a5d63'; mat.ctx.lineWidth = 14; mat.ctx.strokeRect(14, 14, 484, 292);
  mat.text(w.irasshaimase, 256, 150, { size: 64, color: '#e8e8e4', font: FONTS.round });
  mat.ctx.fillStyle = '#9aa0a9'; mat.ctx.font = '700 28px sans-serif'; mat.ctx.textAlign = 'center'; mat.ctx.fillText('PYON MART', 256, 230);
  const matMesh = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 1.0), mat.material({ roughness: 0.95 }));
  matMesh.rotation.x = -Math.PI / 2;
  matMesh.position.set(3, 0.006, 4.3);
  matMesh.userData.sign = true;
  g.add(matMesh);
  const ns = sign(w.kinen, { w: 0.3, h: 0.1, bg: '#ffffff', fg: '#c4302b', res: 256, border: '#c4302b' });
  ns.position.set(4.6, 1.8, 4.97);
  ns.rotation.y = Math.PI;
  g.add(ns);

  const products = stocker.build(byId);
  g.add(products);

  return { group: g, products, lights };
}
