import * as THREE from 'three';
import { addBox, std, sign } from './common.js';
import { Label, FONTS, canvasTex } from '../label.js';
import { words as w } from '../data/words.js';
import { byId } from '../data/products.js';
import { ShelfStocker, productTemplate } from '../products.js';
import { brandArt } from '../art.js';

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

// Fill a straight run of shelf with the given product ids. Each product gets a
// few facings (side-by-side copies), sized so the run looks full but varied.
// start: front-left corner at shelf top, along: unit vector down the shelf,
// inward: unit vector from the front edge toward the back.
function stockRun(stocker, tagParent, ids, { start, along, inward, length, depth, rotY, gap = 0.008, rows = 2, tag = true, lie = false, tagY = -0.03, maxFacings = 4, tilt = 0 }) {
  const items = ids.map((id) => {
    const def = byId[id];
    const size = productTemplate(def).userData.size;
    return { def, size, w: size.x + gap, d: (lie ? size.y : size.z) + gap, n: 1 };
  });
  const pad = 0.03;
  const used = () => items.reduce((s, it) => s + it.n * it.w + pad, 0);
  // grow the narrowest groups first until the shelf is full
  for (let guard = 0; guard < 200; guard++) {
    const cand = items.filter((it) => it.n < maxFacings && used() + it.w <= length).sort((a, b) => a.n * a.w - b.n * b.w)[0];
    if (!cand) break;
    cand.n++;
  }
  while (used() > length && items.some((it) => it.n > 1)) items.filter((it) => it.n > 1).sort((a, b) => b.n - a.n)[0].n--;
  const spare = Math.max(0, length - used()) / items.length;
  let off = 0;
  for (const it of items) {
    const groupW = it.n * it.w + pad + spare;
    const first = off + (groupW - it.n * it.w) / 2 + it.w / 2;
    const nd = Math.max(1, Math.min(rows, Math.floor(depth / it.d)));
    for (let k = 0; k < it.n; k++) {
      for (let r = 0; r < nd; r++) {
        const p = start.clone().addScaledVector(along, first + k * it.w).addScaledVector(inward, 0.015 + it.d / 2 + r * it.d);
        if (lie) p.y += it.size.z / 2;
        stocker.add(it.def, p, rotY, lie ? -Math.PI / 2 : tilt);
      }
    }
    if (tag) {
      const t = new THREE.Mesh(new THREE.PlaneGeometry(0.1, 0.05), priceTag(it.def));
      const p = start.clone().addScaledVector(along, off + groupW / 2).addScaledVector(inward, -0.012);
      p.y += tagY;
      t.position.copy(p);
      t.rotation.y = rotY;
      tagParent.add(t);
    }
    off += groupW;
  }
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


// Soft contact shadow on the floor under a fixture (a blurred rounded-rect decal).
let shadowTex;
function floorShadow(parent, x, z, w, d, strength = 0.38) {
  shadowTex ??= canvasTex(128, 128, (c) => {
    const g = c.createRadialGradient(64, 64, 10, 64, 64, 64);
    g.addColorStop(0, 'rgba(0,0,0,1)');
    g.addColorStop(0.55, 'rgba(0,0,0,0.75)');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    c.fillStyle = g;
    c.fillRect(0, 0, 128, 128);
  }, { srgb: false });
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w + 0.5, d + 0.5), new THREE.MeshBasicMaterial({ color: '#000', alphaMap: shadowTex, transparent: true, opacity: strength, depthWrite: false }));
  m.rotation.x = -Math.PI / 2;
  m.position.set(x, 0.004, z);
  m.renderOrder = 1;
  m.userData.noHit = true;
  parent.add(m);
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
    const L = new THREE.PointLight('#f4f7ff', 2.0, 7.5, 1.5);
    L.position.set(x, 2.5, z);
    g.add(L);
    lights.push(L);
  }
  // shadow-casting downlights over each aisle: products shade the shelves below them
  for (const [x, z] of [[-4.4, -0.6], [-2.0, -0.2], [0.4, -0.2], [2.85, -0.2], [-1.0, -3.5], [2.0, -3.5]]) {
    const S = new THREE.SpotLight('#f6f8ff', 21, 9, 1.25, 0.8, 1.4);
    S.position.set(x, 2.66, z);
    S.target.position.set(x, 0, z + 0.01);
    S.castShadow = true;
    S.shadow.mapSize.set(1024, 1024);
    S.shadow.bias = -0.0006;
    S.shadow.normalBias = 0.015;
    S.shadow.radius = 2;
    S.shadow.camera.near = 0.3;
    S.shadow.camera.far = 4;
    g.add(S, S.target);
    lights.push(S);
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
    [['ryokucha', 'koicha', 'hojicha', 'genmaicha'], ['ryokucha', 'koicha', 'hojicha'], ['genmaicha', 'mugicha', 'jasmine'], ['kocha', 'milktea', 'jasmine'], ['mugicha', 'ryokucha', 'hojicha']],
    [['tennensui', 'tansansui', 'sports'], ['orange', 'ringo', 'budo'], ['sports', 'tennensui', 'tansansui'], ['ringo', 'budo', 'orange'], ['tennensui', 'mugicha', 'sports']],
    [['bito', 'black', 'milkcoffee', 'cafelatte'], ['black', 'bito', 'cafelatte', 'milkcoffee'], ['milkcoffee', 'cafelatte', 'bito', 'black'], ['cafelatte', 'black', 'milkcoffee', 'bito'], ['bito', 'milkcoffee', 'black', 'cafelatte']],
    [['ramune', 'cola', 'melonsoda'], ['cider', 'genki', 'ramune'], ['cola', 'melonsoda', 'cider'], ['genki', 'ramune', 'cola'], ['melonsoda', 'cider', 'genki']],
    [['gyunyu', 'ichigo', 'coffeemilk'], ['cafeaulait', 'tonyu', 'yogurt'], ['ichigo', 'gyunyu', 'coffeemilk'], ['yogurt', 'tonyu', 'cafeaulait'], ['gyunyu', 'yogurt', 'ichigo']],
    [['koicha', 'kocha', 'milktea'], ['jasmine', 'genmaicha', 'ryokucha'], ['hojicha', 'mugicha', 'koicha'], ['milktea', 'kocha', 'jasmine'], ['ryokucha', 'genmaicha', 'hojicha']],
    [['cafelatte', 'bito', 'black', 'milkcoffee'], ['cola', 'ramune', 'genki'], ['cider', 'melonsoda', 'cola'], ['budo', 'orange', 'ringo'], ['tansansui', 'tennensui', 'sports']],
    [['beer', 'lemonsour', 'highball'], ['highball', 'beer', 'lemonsour'], ['lemonsour', 'highball', 'beer'], ['beer', 'lemonsour', 'highball'], ['highball', 'beer', 'lemonsour']],
    [['beer', 'highball', 'lemonsour'], ['lemonsour', 'beer', 'highball'], ['beer', 'lemonsour', 'highball'], ['highball', 'lemonsour', 'beer'], ['beer', 'highball', 'lemonsour']],
    [['genki', 'cola', 'cider'], ['tennensui', 'sports', 'tansansui'], ['ryokucha', 'koicha', 'mugicha'], ['orange', 'ringo', 'budo'], ['gyunyu', 'ichigo', 'yogurt']],
  ];
  const shelfYs = [1.72, 1.35, 0.98, 0.61, 0.24];
  for (let d = 0; d < nDoors; d++) {
    const x0 = fx0 + d * dw;
    addBox(g, [0.05, 2.05, 0.06], mats.darkMetal, [x0, 1.175, fz], { cast: false });
    addBox(g, [0.025, 0.9, 0.04], mats.aluminium, [x0 + dw - 0.09, 1.2, fz + 0.04], { cast: false });
    if (d % 2 === 0) {
      const t = new Label(128, 48).fill('#0b0d10');
      t.ctx.fillStyle = '#ff5a3a'; t.ctx.font = '700 30px monospace'; t.ctx.textAlign = 'center'; t.ctx.fillText(`${3 + (d % 3)}.0℃`, 64, 35);
      const tm = t.material();
      tm.emissive = new THREE.Color('#ffffff'); tm.emissiveMap = tm.map; tm.emissiveIntensity = 0.7;
      const disp = new THREE.Mesh(new THREE.PlaneGeometry(0.1, 0.0375), tm);
      disp.position.set(x0 + dw / 2, 2.28, -4.095);
      g.add(disp);
    }
    addBox(g, [0.02, 1.95, 0.02], mats.fridgeLight, [x0 + 0.04, 1.175, fz - 0.06], { cast: false, receive: false });
    shelfYs.forEach((y, s) => {
      addBox(g, [dw - 0.04, 0.02, shelfDepth], mats.shelfWhite, [x0 + dw / 2, y - 0.01, -4.6], { cast: false });
      stockRun(stocker, tags, sections[d][s], {
        start: V(x0 + 0.03, y, -4.27), along: V(1, 0, 0), inward: V(0, 0, -1), length: dw - 0.06, depth: shelfDepth - 0.04, rotY: FACE.pz, rows: 2, tagY: -0.03,
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
  // two runs per tier: onigiri/bento at the front end, sandwiches & desserts further back
  const split = -0.1;
  const cShelves = [
    { y: 1.6, d: 0.36, a: ['tunamayo', 'benishake', 'ume', 'konbu', 'mentaiko', 'okaka'], b: ['purin', 'parfait', 'rollcake', 'daifuku', 'shucream', 'purin', 'parfait'] },
    { y: 1.26, d: 0.42, a: ['sekihan', 'shiomusubi', 'tunamayo', 'mentaiko', 'benishake'], b: ['tamago', 'katsu', 'mixsando', 'fruitsando', 'tamago', 'katsu'] },
    { y: 0.92, d: 0.5, a: ['okaka', 'ume', 'konbu', 'shiomusubi', 'sekihan'], b: ['mixsando', 'fruitsando', 'rollcake', 'daifuku', 'tamago'] },
    { y: 0.55, d: 0.75, a: ['karaage', 'makunouchi', 'noriben'], b: ['yakiniku', 'zarusoba', 'napolitan', 'karaage', 'noriben'] },
  ];
  for (const s of cShelves) {
    if (s.y > 0.6) addBox(g, [s.d, 0.02, cLen - 0.06], mats.shelfWhite, [cx + 0.04 + s.d / 2, s.y - 0.01, (cz0 + cz1) / 2], { cast: false });
    const run = (ids, z0, z1) => stockRun(stocker, tags, ids, {
      start: V(cx + 0.04 + s.d, s.y, z0), along: V(0, 0, -1), inward: V(-1, 0, 0), length: z0 - z1, depth: s.d - 0.03, rotY: FACE.px, rows: s.y < 0.6 ? 3 : 2,
    });
    run(s.a, cz1 - 0.03, split + 0.03);
    run(s.b, split - 0.03, cz0 + 0.03);
  }
  addBox(g, [0.8, 1.35, 0.02], std('#e9ebee', { roughness: 0.4 }), [cx + 0.42, 1.25, split], { cast: false });
  colliders.add(-6, cx + 0.9, cz0 - 0.03, cz1 + 0.03);
  hangingSign(g, w.onigiri, -5.2, 2.32, 0.6, FACE.px, { w: 1.3 });
  hangingSign(g, w.obento, -5.2, 2.32, -0.9, FACE.px, { w: 1.3 });
  hangingSign(g, w.pyonSweets, -5.2, 2.32, -2.5, FACE.px, { w: 1.3, bg: '#c86a7e' });

  // --- centre gondolas -----------------------------------------------------
  const gz0 = -2.2, gz1 = 2.0, gLen = gz1 - gz0;
  const gondolas = [
    { x: -3.2, sign: w.kappumen,
      nx: [['kitsune', 'curryudon', 'tenpura', 'tonkotsu', 'shio', 'seafood', 'miso', 'shoyu'], ['shoyu', 'miso', 'shio', 'seafood', 'tonkotsu', 'kitsune', 'curryudon'], ['yakisoba', 'shoyu', 'tonkotsu', 'miso', 'tenpura', 'shio'], ['seafood', 'kitsune', 'curryudon', 'tenpura', 'shoyu', 'miso', 'shio']],
      px: [['kakinotane', 'senbei', 'ebisen', 'popcorn', 'chips-select', 'chips-usushio'], ['chips-usushio', 'chips-norishio', 'chips-consomme', 'chips-select', 'ebisen', 'popcorn'], ['popcorn', 'senbei', 'kakinotane', 'chips-norishio', 'chips-consomme', 'ebisen'], ['gummy', 'gummy-budo', 'nodoame', 'caramel', 'gummy', 'gummy-budo', 'nodoame', 'caramel']] },
    { x: -0.8, sign: w.okashi, sign2: w.nichiyohin,
      nx: [['cookie', 'biscuit', 'milkchoco', 'almondchoco', 'matchachoco', 'pyonstick', 'caramel'], ['pyonstick', 'matchachoco', 'almondchoco', 'milkchoco', 'cookie', 'biscuit', 'dango'], ['gummy', 'gummy-budo', 'nodoame', 'pyonstick', 'caramel', 'milkchoco', 'gummy'], ['dango', 'cookie', 'biscuit', 'matchachoco', 'almondchoco', 'dango']],
      px: [['tissue', 'mask', 'menbo', 'bansoko', 'tissue', 'mask'], ['kutsushita', 'cable', 'denchi', 'kutsushita', 'cable'], ['haburashi', 'hamigaki', 'note', 'ballpen', 'haburashi', 'gum'], ['denchi', 'cable', 'ballpen', 'bansoko', 'gum', 'note']] },
    { x: 1.6, sign: w.pyonBeauty, signBg: '#8a7fae',
      // the beauty aisle: skincare & cosmetics on one side, hair & body on the other
      nx: [['keshosui', 'nyueki', 'keshosui-select', 'biyoeki', 'cleansing'], ['sengan', 'hiyakedome', 'handcream', 'sheetmask', 'cotton', 'sengan'], ['lip-rose', 'lip-coral', 'mascara', 'eyeliner', 'polish-sakura', 'polish-yozora', 'foundation'], ['aburatori', 'lipcream', 'hairtie', 'cotton', 'sheetmask', 'aburatori']],
      px: [['shampoo', 'conditioner', 'bodysoap', 'shampoo-refill'], ['shampoo', 'conditioner', 'cleansing', 'seikan', 'bodysoap'], ['hairwax', 'seikan', 'nyuyokuzai', 'hairwax', 'nyuyokuzai'], ['haburashi', 'hamigaki', 'menbo', 'lipcream', 'hairtie', 'haburashi']] },
  ];
  const levels = [0.12, 0.5, 0.88, 1.26];
  const gDepth = 0.4;
  for (const G of gondolas) {
    const zc = (gz0 + gz1) / 2;
    addBox(g, [0.9, 0.12, gLen], mats.shelfWhite, [G.x, 0.06, zc]);
    for (const side of [-1, 1]) addBox(g, [0.012, 0.1, gLen], std('#3a4150', { roughness: 0.5 }), [G.x + side * 0.452, 0.05, zc], { cast: false });
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
    hangingSign(g, G.sign, G.x, 2.3, 0.6, FACE.pz, { w: 1.3, bg: G.signBg || '#3a4150' });
    if (G.sign2) hangingSign(g, G.sign2, G.x + 0.6, 2.32, -1.3, FACE.px, { w: 1.1 });
  }
  // endcaps facing the entrance (promo: moon-viewing dumplings for October)
  const ez = gz1 + 0.17;
  for (const [x, ids] of [[-3.2, ['chips-select', 'chips-usushio']], [-0.8, ['dango', 'dango']], [1.6, ['lip-rose', 'polish-sakura', 'lip-coral', 'polish-yozora']]]) {
    addBox(g, [0.9, 0.12, 0.32], mats.shelfWhite, [x, 0.06, ez]);
    for (const y of [0.12, 0.55, 0.98]) {
      if (y > 0.2) addBox(g, [0.88, 0.02, 0.3], mats.shelfWhite, [x, y - 0.01, ez], { cast: false });
      stockRun(stocker, tags, ids, { start: V(x - 0.43, y, ez + 0.15), along: V(1, 0, 0), inward: V(0, 0, -1), length: 0.86, depth: 0.28, rotY: FACE.pz, rows: 1, tagY: -0.03, maxFacings: 3 });
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
  stockRun(stocker, tags, ['vanilla', 'matchaice', 'chocoice'], { start: V(fzx - 0.85, 0.82, fzz + 0.32), along: V(1, 0, 0), inward: V(0, 0, -1), length: 0.85, depth: 0.6, rotY: 0, rows: 5, tag: false, gap: 0.012, maxFacings: 2 });
  stockRun(stocker, tags, ['azuki', 'soda', 'monaka'], { start: V(fzx + 0.02, 0.82, fzz + 0.32), along: V(1, 0, 0), inward: V(0, 0, -1), length: 0.85, depth: 0.6, rotY: 0, rows: 3, tag: false, lie: true, gap: 0.012, maxFacings: 3 });
  for (const [x, id] of [[fzx - 0.72, 'vanilla'], [fzx - 0.43, 'matchaice'], [fzx - 0.14, 'chocoice'], [fzx + 0.16, 'azuki'], [fzx + 0.45, 'soda'], [fzx + 0.74, 'monaka']]) {
    const t = new THREE.Mesh(new THREE.PlaneGeometry(0.1, 0.05), priceTag(byId[id]));
    t.position.set(x, 0.86, fzz + fD / 2 + 0.002);
    g.add(t);
  }
  const iceSign = sign(w.aisu, { w: 0.9, h: 0.2, bg: '#5ac0f0', fg: '#fff', res: 512 });
  iceSign.position.set(fzx, 0.6, fzz + fD / 2 + 0.003);
  g.add(iceSign);
  const reitoSign = sign(w.reito, { w: 0.4, h: 0.14, bg: '#1d4f9c', fg: '#fff', res: 256 });
  reitoSign.position.set(fzx + 0.62, 0.38, fzz + fD / 2 + 0.003);
  g.add(reitoSign);
  colliders.rect(fzx, fzz, fW + 0.04, fD + 0.04);

  // --- magazine rack along the window ---------------------------------------
  const mx0 = -5.7, mx1 = -0.8;
  addBox(g, [mx1 - mx0, 0.45, 0.38], mats.shelfWhite, [(mx0 + mx1) / 2, 0.225, 4.72]);
  addBox(g, [mx1 - mx0, 1.15, 0.04], mats.shelfWhite, [(mx0 + mx1) / 2, 0.575, 4.9]);
  const mags = [['mag-jump', 'mag-game', 'mag-kuruma', 'mag-jump', 'mag-neko'], ['mag-ryori', 'mag-fashion', 'mag-ryoko', 'mag-neko', 'mag-ryori'], ['mag-fashion', 'mag-ryoko', 'mag-game', 'mag-kuruma', 'mag-fashion']];
  [[0.48, 4.66], [0.8, 4.76], [1.08, 4.84]].forEach(([y, z], i) => {
    addBox(g, [mx1 - mx0, 0.02, 0.14], mats.shelfEdge, [(mx0 + mx1) / 2, y - 0.02, z]);
    addBox(g, [mx1 - mx0, 0.05, 0.012], mats.shelfEdge, [(mx0 + mx1) / 2, y + 0.005, z - 0.07]);
    // magazines face into the store and lean back against the rack
    stockRun(stocker, tags, mags[i], {
      start: V(mx1 - 0.05, y, z - 0.065), along: V(-1, 0, 0), inward: V(0, 0, 1), length: mx1 - mx0 - 0.1, depth: 0.05,
      rotY: Math.PI, rows: 1, tilt: -0.24, maxFacings: 4, gap: 0.012, tagY: -0.035,
    });
  });
  const zs = sign(w.zasshi, { w: 0.6, h: 0.2, bg: '#3a4150', fg: '#fff', res: 256 });
  zs.position.set(-3.2, 1.42, 4.875);
  zs.rotation.y = Math.PI;
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
    const parts = [
      addBox(g, [0.32, 0.1, 0.36], std('#2a2d33', { roughness: 0.4 }), [kx + 0.1, 1.04, z]),
      addBox(g, [0.04, 0.24, 0.3], std('#1a1c20', { emissive: '#7ab8ff', emissiveIntensity: 0.6 }), [kx - 0.1, 1.2, z]),
      addBox(g, [0.03, 0.12, 0.03], mats.darkMetal, [kx - 0.06, 1.05, z]),
      addBox(g, [0.22, 0.03, 0.16], std('#c8ccd2', { metalness: 0.6, roughness: 0.3 }), [kx - 0.22, 1.0, z + 0.25]),
    ];
    for (const p of parts) p.userData.register = true;
  }
  // little wire rack of impulse buys on the customer side of the counter
  {
    const rx = kx - 0.3, rz = 0.5;
    const wire = std('#c9ced4', { metalness: 0.8, roughness: 0.3 });
    for (const [y, dz] of [[1.0, 0], [1.13, 0]]) {
      addBox(g, [0.14, 0.008, 0.36], wire, [rx, y, rz + dz], { cast: false });
    }
    addBox(g, [0.008, 0.18, 0.36], wire, [rx + 0.07, 1.08, rz], { cast: false });
    stockRun(stocker, tags, ['gum', 'caramel'], { start: V(rx - 0.07, 1.004, rz + 0.17), along: V(0, 0, -1), inward: V(1, 0, 0), length: 0.34, depth: 0.12, rotY: FACE.nx, rows: 1, tag: false, maxFacings: 3 });
    stockRun(stocker, tags, ['lipcream', 'gum'], { start: V(rx - 0.07, 1.134, rz + 0.17), along: V(0, 0, -1), inward: V(1, 0, 0), length: 0.34, depth: 0.12, rotY: FACE.nx, rows: 1, tag: false, maxFacings: 2 });
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
  // behind the clerk: a warm wood-slat wall with the store roundel, and a hot-drink warmer
  const slats = canvasTex(512, 256, (c) => {
    c.fillStyle = '#b48a5e'; c.fillRect(0, 0, 512, 256);
    for (let x = 0; x < 512; x += 32) {
      c.fillStyle = x % 64 ? '#c49a6c' : '#b9905f';
      c.fillRect(x + 2, 0, 28, 256);
      c.fillStyle = 'rgba(0,0,0,0.18)';
      c.fillRect(x, 0, 2, 256);
      for (let k = 0; k < 6; k++) { c.fillStyle = 'rgba(90,55,25,0.12)'; c.fillRect(x + 4 + Math.random() * 22, Math.random() * 256, 2, 30 + Math.random() * 60); }
    }
  }, { repeat: [3, 1] });
  const wall = new THREE.Mesh(new THREE.PlaneGeometry(4.6, 1.15), std('#ffffff', { map: slats, roughness: 0.7 }));
  wall.position.set(5.99, 1.52, 0.5);
  wall.rotation.y = FACE.nx;
  g.add(wall);
  if (brandArt.badge) {
    const cv = document.createElement('canvas');
    cv.width = cv.height = 256;
    cv.getContext('2d').drawImage(brandArt.badge, 0, 0, 256, 256);
    const t = new THREE.CanvasTexture(cv);
    t.colorSpace = THREE.SRGBColorSpace;
    const roundel = new THREE.Mesh(new THREE.CircleGeometry(0.3, 48), new THREE.MeshStandardMaterial({ map: t, transparent: true, roughness: 0.5 }));
    roundel.position.set(5.975, 1.55, 1.75);
    roundel.rotation.y = FACE.nx;
    g.add(roundel);
  }
  // hot drink warmer (glass-front cabinet on the back counter)
  const hx = 5.7, hz = -1.3;
  addBox(g, [0.5, 0.5, 0.9], std('#c4302b', { roughness: 0.4 }), [hx, 1.15, hz]);
  addBox(g, [0.46, 0.44, 0.86], std('#ffe8c8', { emissive: '#ff9a4a', emissiveIntensity: 0.35 }), [hx + 0.01, 1.15, hz], { cast: false });
  const warmGlass = addBox(g, [0.01, 0.44, 0.86], mats.fridgeGlass, [hx - 0.255, 1.15, hz], { cast: false, receive: false });
  warmGlass.userData.noHit = true;
  for (const y of [0.93, 1.15]) {
    addBox(g, [0.44, 0.012, 0.84], mats.shelfWhite, [hx, y, hz], { cast: false });
    stockRun(stocker, tags, y < 1 ? ['milktea', 'hojicha', 'cafelatte'] : ['bito', 'milkcoffee', 'black', 'cafelatte'], {
      start: V(hx - 0.24, y + 0.006, hz + 0.41), along: V(0, 0, -1), inward: V(1, 0, 0), length: 0.82, depth: 0.3, rotY: FACE.nx, rows: 1, tag: false, maxFacings: 3,
    });
  }
  const hot = sign(w.hotDrink, { w: 0.42, h: 0.1, bg: '#c4302b', fg: '#fff', res: 256 });
  hot.position.set(hx - 0.256, 1.43, hz);
  hot.rotation.y = FACE.nx;
  g.add(hot);
  // stacked coffee cups by the machine side of the back counter
  for (let i = 0; i < 3; i++) {
    const stack = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.035, 0.28, 16), std('#ffffff', { roughness: 0.5 }));
    stack.position.set(5.72, 1.04, 1.9 + i * 0.12);
    g.add(stack);
  }
  colliders.add(5.45, 6, -2.4, 3.0);

  // コスメ corner: a lit wall unit on the right wall by the entrance
  {
    const z0 = 3.2, z1 = 4.85, zc = (z0 + z1) / 2, len = z1 - z0, x = 5.62;
    const body = std('#f6f1f4', { roughness: 0.45 });
    addBox(g, [0.4, 0.12, len], body, [x + 0.18, 0.06, zc]);
    addBox(g, [0.04, 1.9, len], std('#efe4ec', { roughness: 0.5 }), [5.98, 0.95, zc]);
    for (const z of [z0, z1]) addBox(g, [0.42, 1.95, 0.03], body, [x + 0.19, 0.975, z]);
    addBox(g, [0.42, 0.06, len + 0.03], std('#8a7fae', { roughness: 0.4 }), [x + 0.19, 1.98, zc]);
    addBox(g, [0.35, 0.015, len - 0.04], mats.fridgeLight, [x + 0.2, 1.945, zc], { cast: false });
    const levels = [0.12, 0.48, 0.84, 1.2, 1.55];
    const plan = [['shampoo-refill', 'nyuyokuzai', 'cotton'], ['keshosui', 'biyoeki', 'nyueki', 'cleansing'], ['lip-rose', 'lip-coral', 'mascara', 'eyeliner', 'foundation'], ['polish-sakura', 'polish-yozora', 'lipcream', 'hairtie', 'aburatori'], ['sheetmask', 'handcream', 'hiyakedome', 'sheetmask']];
    levels.forEach((y, i) => {
      if (i > 0) addBox(g, [0.36, 0.015, len - 0.04], std('#ffffff', { roughness: 0.3 }), [x + 0.2, y - 0.008, zc], { cast: false });
      addBox(g, [0.012, 0.035, len - 0.04], std('#d9b46a', { metalness: 0.8, roughness: 0.3 }), [x + 0.015, y - 0.02, zc], { cast: false });
      stockRun(stocker, tags, plan[i], { start: V(x + 0.01, y, z0 + 0.03), along: V(0, 0, 1), inward: V(1, 0, 0), length: len - 0.06, depth: 0.3, rotY: FACE.nx, rows: 2, maxFacings: 3, tagY: -0.03 });
    });
    const head = sign(w.kosume, { w: 1.2, h: 0.32, bg: '#8a7fae', fg: '#ffffff', res: 512 });
    head.position.set(5.6, 2.22, zc);
    head.rotation.y = FACE.nx;
    g.add(head);
    // a vanity mirror strip
    const mirrorTex = canvasTex(128, 128, (c) => {
      const gr = c.createLinearGradient(0, 0, 128, 128);
      gr.addColorStop(0, '#f4f6fa'); gr.addColorStop(0.45, '#d8dee8'); gr.addColorStop(0.5, '#f8fafc'); gr.addColorStop(1, '#c9d0db');
      c.fillStyle = gr; c.fillRect(0, 0, 128, 128);
    });
    const mirror = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.32), new THREE.MeshBasicMaterial({ map: mirrorTex }));
    mirror.position.set(5.96, 1.7, z1 - 0.3);
    mirror.rotation.y = FACE.nx;
    g.add(mirror);
    colliders.add(x - 0.02, 6, z0 - 0.02, z1 + 0.02);
  }

  // umbrella stand by the door, stocked with clear umbrellas you can pick up
  {
    const ux = 1.55, uz = 4.5;
    const stand = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.18, 0.5, 24, 1, true), std('#9aa0a8', { metalness: 0.8, roughness: 0.35, side: THREE.DoubleSide }));
    stand.position.set(ux, 0.25, uz);
    g.add(stand);
    addBox(g, [0.36, 0.02, 0.36], mats.darkMetal, [ux, 0.01, uz]);
    for (let i = 0; i < 7; i++) {
      const a = (i / 7) * Math.PI * 2;
      stocker.add(byId.kasa, V(ux + Math.cos(a) * 0.08, 0.02, uz + Math.sin(a) * 0.08), a * 1.7, 0.08 + (i % 3) * 0.03);
    }
    const ks = sign(w.jumbo, { w: 0.42, h: 0.1, bg: '#2b3140', fg: '#fff', res: 256 });
    ks.position.set(ux, 0.38, uz - 0.205);
    ks.rotation.y = Math.PI;
    g.add(ks);
    colliders.rect(ux, uz, 0.44, 0.44);
  }

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

  // contact shadows under the big fixtures
  for (const x of [-3.2, -0.8, 1.6]) floorShadow(g, x, -0.05, 0.95, 4.6);
  floorShadow(g, -5.55, -0.6, 0.9, 5.6);                 // chiller
  floorShadow(g, -1.2, -4.55, 9.3, 0.95, 0.3);           // fridges
  floorShadow(g, -2.0, 3.45, 1.8, 0.75);                 // freezer
  floorShadow(g, 4.25, 0.3, 0.75, 5.4);                  // counter
  floorShadow(g, -3.25, 4.72, 4.9, 0.4, 0.3);            // magazine rack
  floorShadow(g, 5.8, 4.02, 0.4, 1.65);                  // cosme corner
  const products = stocker.build(byId);
  g.add(products);

  return { group: g, products, lights, stocker };
}
