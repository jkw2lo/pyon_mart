import * as THREE from 'three';
import { addBox, std, sign } from './common.js';
import { Label, FONTS, canvasTex, noise } from '../label.js';
import { words as w } from '../data/words.js';
import { logoRim, logoBadge } from '../logo.js';

export function svgImage(svg) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  });
}

// Facade with a window grid; returns colour + emissive maps so windows glow at night.
function facade({ cols, rows, wall = '#d9d4ca', frame = '#555', glass = '#4a5a6a', lit = 0.35, balcony = false, seed = 1 }) {
  const W = 512, H = 512;
  let s = seed;
  const rnd = () => ((s = (s * 9301 + 49297) % 233280) / 233280);
  const lights = [];
  const map = canvasTex(W, H, (c) => {
    c.fillStyle = wall; c.fillRect(0, 0, W, H); noise(c, W, H, 14);
    const cw = W / cols, rh = H / rows;
    for (let r = 0; r < rows; r++) for (let k = 0; k < cols; k++) {
      const x = k * cw + cw * 0.18, y = r * rh + rh * 0.2, ww = cw * 0.64, hh = rh * 0.55;
      c.fillStyle = frame; c.fillRect(x - 3, y - 3, ww + 6, hh + 6);
      c.fillStyle = glass; c.fillRect(x, y, ww, hh);
      c.fillStyle = 'rgba(255,255,255,0.12)'; c.fillRect(x, y, ww * 0.4, hh);
      if (balcony) { c.fillStyle = '#bdb8ad'; c.fillRect(k * cw + 2, y + hh + 4, cw - 4, rh * 0.18); }
      lights.push({ x, y, ww, hh, on: rnd() < lit, warm: rnd() < 0.6 });
    }
  });
  const emissive = canvasTex(W, H, (c) => {
    c.fillStyle = '#000'; c.fillRect(0, 0, W, H);
    for (const L of lights) if (L.on) { c.fillStyle = L.warm ? '#ffcf8a' : '#dfe9ff'; c.fillRect(L.x, L.y, L.ww, L.hh); }
  });
  return { map, emissive };
}

function building(parent, { x, z, w, d, h, cols, rows, wall, balcony, seed, nightMats, roof = '#5a5d63' }) {
  const fz = facade({ cols, rows, wall, balcony, seed });
  const fx = facade({ cols: Math.max(2, Math.round(cols * d / w)), rows, wall, seed: seed + 7 });
  for (const f of [fz, fx]) f.map.repeat.set(1, 1);
  const mk = (f) => {
    const m = std('#ffffff', { map: f.map, emissiveMap: f.emissive, emissive: '#ffffff', emissiveIntensity: 0, roughness: 0.85 });
    nightMats.push(m);
    return m;
  };
  const front = mk(fz), side = mk(fx);
  const top = std(roof, { roughness: 0.9 });
  addBox(parent, [w, h, d], [side, side, top, top, front, front], [x, h / 2, z]);
}

function pole(parent, mats, x, z, h = 9) {
  const g = new THREE.Group();
  const p = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.17, h, 12), mats.concrete);
  p.position.y = h / 2;
  p.castShadow = true;
  g.add(p);
  for (const [y, len] of [[h - 0.4, 1.6], [h - 1.0, 1.2]]) {
    const arm = new THREE.Mesh(new THREE.BoxGeometry(len, 0.08, 0.08), mats.darkMetal);
    arm.position.y = y;
    g.add(arm);
  }
  const tr = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.7, 12), std('#8a9096', { metalness: 0.4, roughness: 0.5 }));
  tr.position.set(0.32, h - 2.2, 0);
  g.add(tr);
  // stripes on the bottom (yellow/black guard)
  const guard = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 1.6, 12), canvasStripeMat());
  guard.position.y = 0.8;
  g.add(guard);
  g.position.set(x, 0, z);
  parent.add(g);
  return g;
}

let stripeMat;
function canvasStripeMat() {
  if (stripeMat) return stripeMat;
  const t = canvasTex(128, 128, (c) => {
    c.fillStyle = '#e8c43a'; c.fillRect(0, 0, 128, 128);
    c.fillStyle = '#222';
    for (let i = -4; i < 8; i++) { c.beginPath(); c.moveTo(i * 32, 128); c.lineTo(i * 32 + 16, 128); c.lineTo(i * 32 + 16 + 64, 0); c.lineTo(i * 32 + 64, 0); c.fill(); }
  }, { repeat: [2, 2] });
  stripeMat = std('#ffffff', { map: t });
  return stripeMat;
}

function wires(parent, mat, poles, heights) {
  for (const h of heights) {
    for (let i = 0; i < poles.length - 1; i++) {
      const a = poles[i], b = poles[i + 1];
      const pts = [];
      for (let k = 0; k <= 16; k++) {
        const t = k / 16;
        pts.push(new THREE.Vector3(a[0] + (b[0] - a[0]) * t, h - Math.sin(t * Math.PI) * 0.45, a[1] + (b[1] - a[1]) * t));
      }
      const tube = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 24, 0.012, 4), mat);
      parent.add(tube);
    }
  }
}

function car(parent, x, z, color, rotY = 0) {
  const g = new THREE.Group();
  const body = std(color, { roughness: 0.25, metalness: 0.5 });
  const glass = std('#1d2630', { roughness: 0.05, metalness: 0.6 });
  const tyre = std('#151515', { roughness: 0.9 });
  addBox(g, [1.45, 0.6, 3.3], body, [0, 0.58, 0]);
  addBox(g, [1.36, 0.16, 2.2], body, [0, 0.95, -0.2]);
  addBox(g, [1.32, 0.12, 1.9], body, [0, 1.52, -0.3]);
  addBox(g, [1.34, 0.44, 1.8], glass, [0, 1.24, -0.3], { cast: false });
  for (const dz of [-0.3, 0.5, -1.15]) addBox(g, [1.36, 0.46, 0.08], body, [0, 1.24, dz], { cast: false });
  const shield = addBox(g, [1.3, 0.5, 0.04], glass, [0, 1.22, 0.66], { cast: false });
  shield.rotation.x = -0.5;
  for (const [dx, dz] of [[-0.65, 1.05], [0.65, 1.05], [-0.65, -1.05], [0.65, -1.05]]) {
    const wh = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.2, 18), tyre);
    wh.rotation.z = Math.PI / 2;
    wh.position.set(dx, 0.3, dz);
    g.add(wh);
  }
  const lamp = std('#fff6d0', { emissive: '#fff2c0', emissiveIntensity: 0.2 });
  addBox(g, [0.3, 0.12, 0.04], lamp, [-0.5, 0.7, 1.66]);
  addBox(g, [0.3, 0.12, 0.04], lamp, [0.5, 0.7, 1.66]);
  g.position.set(x, 0, z);
  g.rotation.y = rotY;
  parent.add(g);
  return g;
}

function vendingFace() {
  const L = new Label(512, 980).fill('#f4f6f8');
  const c = L.ctx;
  L.rect(0, 0, 512, 90, '#1d4f9c');
  L.text(w.moriShizuku, 256, 48, { size: 50, color: '#fff' });
  L.rect(24, 110, 464, 560, '#eaf2f8', 10);
  const cols = ['#5aa04a', '#a0662e', '#e0a623', '#62b3e3', '#ff9a1f', '#2a1a12', '#9fd8f2', '#c4302b'];
  for (let r = 0; r < 3; r++) {
    for (let k = 0; k < 6; k++) {
      const x = 44 + k * 74, y = 130 + r * 182;
      const col = cols[(r * 3 + k) % cols.length];
      c.fillStyle = col;
      if ((r + k) % 3 === 0) { c.fillRect(x + 14, y + 40, 40, 92); c.fillStyle = '#ccc'; c.fillRect(x + 14, y + 36, 40, 6); }
      else { c.beginPath(); c.roundRect(x + 12, y + 30, 44, 102, 10); c.fill(); c.fillStyle = '#fff'; c.fillRect(x + 24, y + 14, 20, 18); }
      const hot = r === 2 && k > 3;
      L.rect(x + 4, y + 142, 60, 24, hot ? '#d0302b' : '#2a6ad0', 4);
      c.fillStyle = '#fff'; c.font = '700 16px sans-serif'; c.textAlign = 'center'; c.fillText(hot ? '¥140' : '¥130', x + 34, y + 160);
    }
  }
  L.rect(40, 690, 200, 50, '#2a6ad0', 25);
  L.text(w.tsumetai, 140, 715, { size: 30, color: '#fff' });
  L.rect(272, 690, 200, 50, '#d0302b', 25);
  L.text(w.attaka, 372, 715, { size: 28, color: '#fff' });
  L.rect(330, 770, 140, 90, '#2b2f36', 8);
  c.fillStyle = '#8ef08e'; c.font = '700 26px monospace'; c.textAlign = 'center'; c.fillText('0', 400, 830);
  L.rect(60, 880, 330, 80, '#1b1d22', 8);
  const m = L.material({ roughness: 0.3, emissive: new THREE.Color('#ffffff'), emissiveIntensity: 0.35 });
  m.emissiveMap = m.map;
  return m;
}

function bin(parent, mats, x, z, word, color) {
  addBox(parent, [0.5, 0.95, 0.45], std('#e9ecef', { roughness: 0.5 }), [x, 0.475, z]);
  addBox(parent, [0.5, 0.08, 0.45], std(color, { roughness: 0.5 }), [x, 0.99, z]);
  const s = sign(word, { w: 0.42, h: 0.12, bg: color, fg: '#fff', font: FONTS.gothic, res: 256 });
  s.position.set(x, 0.78, z + 0.226);
  parent.add(s);
  addBox(parent, [0.22, 0.07, 0.02], std('#222'), [x, 0.55, z + 0.226], { cast: false });
}

export function buildExterior(scene, mats, colliders) {
  const g = new THREE.Group();
  scene.add(g);
  const nightMats = [];   // emissive that switches on at night
  const signMats = [];    // lit signs (always on, brighter at night)

  // --- ground ---
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), std('#7d7a72', { roughness: 1 }));
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.03;
  ground.receiveShadow = true;
  g.add(ground);
  const lot = new THREE.Mesh(new THREE.PlaneGeometry(32, 8.6), mats.asphalt);
  lot.rotation.x = -Math.PI / 2;
  lot.position.set(0, -0.01, 9.3);
  lot.receiveShadow = true;
  g.add(lot);
  const apron = addBox(g, [14, 0.06, 1.6], mats.concrete, [0, -0.02, 6.0], { cast: false });
  apron.receiveShadow = true;
  // parking lines + wheel stops
  const linePaint = std('#f4f4f0', { roughness: 0.8 });
  for (const x of [-7.5, -5, -2.5, 0, 5, 7.5, 10]) addBox(g, [0.12, 0.012, 4.6], linePaint, [x, 0.0, 9.4], { cast: false });
  for (const x of [-6.25, -3.75, -1.25, 6.25, 8.75]) addBox(g, [1.2, 0.12, 0.2], mats.concrete, [x, 0.06, 7.4]);
  // walkway hatch toward the door
  for (let i = 0; i < 6; i++) addBox(g, [1.6, 0.012, 0.4], linePaint, [3, 0.0, 7.4 + i * 0.85], { cast: false });
  car(g, -3.75, 9.6, '#f2f2ee', Math.PI);
  car(g, 8.75, 9.4, '#2a4a7a', Math.PI);
  colliders.rect(-3.75, 9.6, 1.6, 3.4);
  colliders.rect(8.75, 9.4, 1.6, 3.4);

  // sidewalk, road, far sidewalk
  addBox(g, [200, 0.14, 2], mats.pavement, [0, 0.0, 14]);
  addBox(g, [200, 0.16, 0.2], mats.concrete, [0, 0.01, 15]);
  const road = new THREE.Mesh(new THREE.PlaneGeometry(200, 8), mats.asphalt.clone());
  road.material.color.set('#8a8c90');
  road.rotation.x = -Math.PI / 2;
  road.position.set(0, -0.015, 19);
  road.receiveShadow = true;
  g.add(road);
  for (let x = -100; x < 100; x += 6) addBox(g, [3, 0.01, 0.15], linePaint, [x, 0, 19], { cast: false });
  addBox(g, [200, 0.01, 0.15], linePaint, [0, 0, 15.5], { cast: false });
  addBox(g, [200, 0.01, 0.15], linePaint, [0, 0, 22.5], { cast: false });
  addBox(g, [200, 0.14, 2.4], mats.pavement, [0, 0.0, 24.2]);
  // crosswalk
  for (let i = 0; i < 7; i++) addBox(g, [0.5, 0.012, 7], linePaint, [-12 + i * 1, 0, 19], { cast: false });

  // --- the store shell ---
  const wallOut = mats.wallOut;
  addBox(g, [0.2, 3.65, 10.4], wallOut, [-6.1, 1.825, 0]);
  addBox(g, [0.2, 3.65, 10.4], wallOut, [6.1, 1.825, 0]);
  addBox(g, [12.4, 3.65, 0.2], wallOut, [0, 1.825, -5.1]);
  addBox(g, [12.8, 0.18, 10.8], mats.slate, [0, 3.74, 0]);
  colliders.add(-6.2, -6.0, -5.2, 5.2);
  colliders.add(6.0, 6.2, -5.2, 5.2);
  colliders.add(-6.2, 6.2, -5.2, -5.0);
  // front: window wall on the left, door, solid wall on the right
  addBox(g, [8.2, 0.4, 0.22], mats.slate, [-2.1, 0.2, 5.05]);
  const glass = addBox(g, [8.2, 2.15, 0.02], mats.glass, [-2.1, 1.475, 5.05], { cast: false, receive: false });
  glass.userData.noHit = true;
  for (const x of [-6.1, -4.05, -2.0, 0.05, 2.0, 4.0]) addBox(g, [0.08, 2.75, 0.16], mats.aluminium, [x, 1.375, 5.05]);
  addBox(g, [8.2, 0.08, 0.16], mats.aluminium, [-2.1, 2.55, 5.05]);
  addBox(g, [12.4, 0.2, 0.2], mats.slate, [0, 2.65, 5.05]);
  addBox(g, [2.2, 2.75, 0.2], wallOut, [5.1, 1.375, 5.1]);
  addBox(g, [2.0, 0.3, 0.16], mats.aluminium, [3, 2.45, 5.05]);
  colliders.add(-6.2, 2.0, 4.95, 5.2);
  colliders.add(4.0, 6.2, 4.95, 5.2);
  colliders.add(-6.2, 2.0, 5.2, 5.5); // bins/sill zone

  // sliding doors
  const doorGroup = new THREE.Group();
  g.add(doorGroup);
  const doorPanels = [];
  for (const side of [-1, 1]) {
    const p = new THREE.Group();
    const frame = mats.aluminium;
    addBox(p, [0.96, 0.05, 0.05], frame, [0, 2.27, 0]);
    addBox(p, [0.96, 0.08, 0.05], frame, [0, 0.04, 0]);
    addBox(p, [0.05, 2.3, 0.05], frame, [-0.455, 1.15, 0]);
    addBox(p, [0.05, 2.3, 0.05], frame, [0.455, 1.15, 0]);
    const gl = addBox(p, [0.9, 2.2, 0.015], mats.glass, [0, 1.15, 0], { cast: false, receive: false });
    gl.userData.door = true;
    for (const dz of [0.012, -0.012]) {
      const st = sign(w.jidoDoa, { w: 0.42, h: 0.1, bg: '#1d4f9c', fg: '#fff', font: FONTS.gothic, res: 256 });
      st.position.set(0, 1.25, dz);
      if (dz < 0) st.rotation.y = Math.PI;
      st.userData.door = true;
      p.add(st);
    }
    if (side < 0) {
      const open = sign(w.eigyochu, { w: 0.3, h: 0.14, bg: '#ffffff', fg: '#c4302b', font: FONTS.gothic, border: '#c4302b', res: 256 });
      open.position.set(0, 1.6, 0.012);
      open.userData.door = true;
      p.add(open);
    }
    p.traverse((o) => { if (o.isMesh) o.userData.door = true; });
    p.userData.closedX = 3 + side * 0.47;
    p.userData.side = side;
    p.position.set(p.userData.closedX, 0, 5.12);
    doorGroup.add(p);
    doorPanels.push(p);
  }
  const doorCollider = colliders.add(2.0, 4.0, 4.95, 5.2, 'door');

  // fascia sign
  const fascia = new Label(2048, 150);
  const fasciaMat = fascia.material({ roughness: 0.4 });
  fasciaMat.emissive = new THREE.Color('#ffffff');
  fasciaMat.emissiveMap = fasciaMat.map;
  fasciaMat.emissiveIntensity = 0.2;
  signMats.push({ mat: fasciaMat, day: 0.15, night: 1.0 });
  const fasciaMesh = new THREE.Mesh(new THREE.PlaneGeometry(12.8, 0.94), fasciaMat);
  fasciaMesh.position.set(0, 3.2, 5.52);
  fasciaMesh.userData.sign = true;
  g.add(fasciaMesh);
  addBox(g, [12.8, 0.94, 0.3], mats.slate, [0, 3.2, 5.36]);
  addBox(g, [0.3, 0.94, 10.8], mats.slate, [-6.25, 3.2, 0]);
  addBox(g, [0.3, 0.94, 10.8], mats.slate, [6.25, 3.2, 0]);
  // canopy with downlights
  addBox(g, [12.8, 0.12, 1.2], mats.white, [0, 2.7, 5.8]);
  const downlight = new THREE.MeshStandardMaterial({ color: '#fff', emissive: '#fff5e0', emissiveIntensity: 0.3 });
  signMats.push({ mat: downlight, day: 0.3, night: 3 });
  for (let x = -5; x <= 5; x += 2.5) {
    const d = new THREE.Mesh(new THREE.CircleGeometry(0.1, 20), downlight);
    d.rotation.x = Math.PI / 2;
    d.position.set(x, 2.635, 5.8);
    g.add(d);
  }

  // light spilling from the canopy onto the forecourt at night
  const canopyLights = [];
  for (const x of [-3, 3]) {
    const L = new THREE.SpotLight('#fff3dc', 0, 14, 1.1, 0.7, 1.6);
    L.position.set(x, 2.6, 5.9);
    L.target.position.set(x, 0, 8.5);
    g.add(L, L.target);
    canopyLights.push(L);
  }

  const drawFascia = (mark) => {
    const c = fascia.ctx, W = 2048, H = 150;
    fascia.regions.length = 0;
    fascia.fill('#ffffff');
    // stripes along the bottom
    c.fillStyle = '#3a4150'; c.fillRect(0, H - 22, W, 22);
    c.fillStyle = '#f2d675'; c.fillRect(0, H - 28, W, 6);
    c.drawImage(mark, 170, 0, 128, 128);
    fascia.text('PYON MART', 320, 62, { size: 74, color: '#3d424a', font: FONTS.round, align: 'left', maxW: 600 });
    fascia.text(w.pyonMart, 860, 64, { size: 46, color: '#7d838d', font: FONTS.round, align: 'left' });
    fascia.text(w.open24, 1800, 64, { size: 44, color: '#3d424a', font: FONTS.gothic });
    fasciaMat.map.needsUpdate = true;
  };

  // tall pole sign by the road
  addBox(g, [0.3, 6, 0.3], mats.slate, [7.4, 3, 12.6]);
  const poleSignMat = new THREE.MeshStandardMaterial({ color: '#fff', roughness: 0.4, emissive: '#fff', emissiveIntensity: 0.2 });
  signMats.push({ mat: poleSignMat, day: 0.2, night: 1.1 });
  addBox(g, [1.8, 1.8, 0.4], mats.slate, [7.4, 6.6, 12.6]);
  for (const dz of [0.205, -0.205]) {
    const face = new THREE.Mesh(new THREE.PlaneGeometry(1.7, 1.7), poleSignMat);
    face.position.set(7.4, 6.6, 12.6 + dz);
    if (dz < 0) face.rotation.y = Math.PI;
    g.add(face);
  }
  colliders.rect(7.4, 12.6, 0.4, 0.4);

  Promise.all([svgImage(logoRim({ size: 512 })), svgImage(logoBadge({ size: 512 }))]).then(([rim, badge]) => {
    drawFascia(rim);
    const cv = document.createElement('canvas');
    cv.width = cv.height = 512;
    const c = cv.getContext('2d');
    c.fillStyle = '#2b3140'; c.fillRect(0, 0, 512, 512);
    c.drawImage(badge, 26, 16, 460, 460);
    c.fillStyle = '#f2d675'; c.fillRect(0, 488, 512, 24);
    const t = new THREE.CanvasTexture(cv);
    t.colorSpace = THREE.SRGBColorSpace;
    poleSignMat.map = t;
    poleSignMat.emissiveMap = t;
    poleSignMat.needsUpdate = true;
  });

  // vending machines + bins
  const vfMat = vendingFace();
  signMats.push({ mat: vfMat, day: 0.25, night: 0.9 });
  for (const x of [4.55, 5.55]) {
    addBox(g, [0.95, 1.83, 0.72], std('#e9edf1', { roughness: 0.4 }), [x, 0.915, 5.6]);
    const face = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 1.72), vfMat);
    face.position.set(x, 0.92, 5.965);
    g.add(face);
  }
  colliders.add(4.05, 6.05, 5.2, 6.0);
  bin(g, mats, 0.45, 5.45, w.moeruGomi, '#c4302b');
  bin(g, mats, 1.0, 5.45, w.petBottle, '#2a6ad0');
  bin(g, mats, 1.55, 5.45, w.kanBin, '#2a8a3a');

  // parking sign
  addBox(g, [0.08, 2.4, 0.08], mats.aluminium, [-10.5, 1.2, 12.8]);
  const pSign = new Label(256, 320).fill('#1d4f9c');
  pSign.ctx.fillStyle = '#fff'; pSign.ctx.font = '900 190px sans-serif'; pSign.ctx.textAlign = 'center'; pSign.ctx.fillText('P', 128, 190);
  pSign.text(w.chusha, 128, 270, { size: 54, color: '#fff' });
  const pMesh = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 0.75), pSign.material());
  pMesh.position.set(-10.5, 2.2, 12.85);
  pMesh.userData.sign = true;
  g.add(pMesh);

  // utility poles with wires, two carrying street lights
  const poleXs = [-34, -12, 10, 32];
  for (const x of poleXs) pole(g, mats, x, 13.5);
  for (const x of poleXs) colliders.rect(x, 13.5, 0.4, 0.4);
  const wireMat = std('#1a1a1a', { roughness: 0.6 });
  wires(g, wireMat, poleXs.map((x) => [x, 13.5]), [8.6, 8.0, 7.4]);
  const lampMat = new THREE.MeshStandardMaterial({ color: '#fff', emissive: '#ffe6b0', emissiveIntensity: 0 });
  nightMats.push(lampMat);
  const streetLights = [];
  for (const x of [-12, 10]) {
    addBox(g, [0.06, 0.06, 1.6], mats.darkMetal, [x, 6.2, 14.2]);
    addBox(g, [0.3, 0.1, 0.5], lampMat, [x, 6.12, 14.9]);
    const L = new THREE.PointLight('#ffd9a0', 0, 20, 2);
    L.position.set(x, 5.9, 14.9);
    g.add(L);
    streetLights.push(L);
  }

  // neighbouring buildings
  building(g, { x: -21, z: -1, w: 18, d: 12, h: 12.5, cols: 6, rows: 4, wall: '#d8d2c6', balcony: true, seed: 3, nightMats });
  building(g, { x: 17.5, z: -0.5, w: 11, d: 10, h: 6.5, cols: 4, rows: 2, wall: '#cfc8bb', seed: 11, nightMats, roof: '#3a4a5a' });
  colliders.add(-30, -12, -7, 5);
  colliders.add(12, 23, -5.5, 4.5);
  const across = [[-28, 9, 14, '#bfb7a8'], [-16, 12, 9, '#d4cfc4'], [-3, 10, 16, '#a9a296'], [10, 12, 7, '#ddd6c6'], [23, 11, 19, '#c4beb3'], [37, 14, 10, '#b9b3a6']];
  across.forEach(([x, wd, h, col], i) => building(g, { x, z: 31, w: wd, d: 10, h, cols: Math.round(wd / 2.6), rows: Math.round(h / 3), wall: col, seed: 20 + i, balcony: i % 2 === 0, nightMats }));
  // a ramen shop sign across the road
  const ramenSign = sign(w.ramen, { w: 2.6, h: 0.8, bg: '#c4302b', fg: '#fff', font: FONTS.mincho, res: 512, emissive: 0.4 });
  ramenSign.position.set(-3, 3.4, 25.97);
  ramenSign.rotation.y = Math.PI;
  g.add(ramenSign);
  signMats.push({ mat: ramenSign.material, day: 0.3, night: 1.2 });
  colliders.add(-60, 60, 25.4, 26);
  colliders.add(-60, 60, -30, -20);
  colliders.add(-40, -39, -30, 30);
  colliders.add(39, 40, -30, 30);

  return { group: g, doorPanels, doorCollider, nightMats, signMats, streetLights, canopyLights };
}
