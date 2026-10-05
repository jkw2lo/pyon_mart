import * as THREE from 'three';
import { addBox, std, sign } from './common.js';
import { Label, FONTS, canvasTex } from '../label.js';
import { words as w } from '../data/words.js';

// Small, unglamorous things that make a shop look real: ceiling services,
// counter clutter, building services outside, road furniture.

const TAU = Math.PI * 2;
const FACE = { px: Math.PI / 2, nx: -Math.PI / 2, pz: 0, nz: Math.PI };

function grilleTex() {
  return canvasTex(128, 128, (c) => {
    c.fillStyle = '#eceeef'; c.fillRect(0, 0, 128, 128);
    c.fillStyle = '#c9cdd2';
    for (let i = 6; i < 122; i += 6) c.fillRect(i, 30, 3, 68);
    c.strokeStyle = '#d6d9dd'; c.lineWidth = 4; c.strokeRect(4, 4, 120, 120);
    c.fillStyle = '#d9dcdf';
    for (const [x, y, ww, hh] of [[14, 10, 100, 14], [14, 104, 100, 14], [10, 14, 14, 100], [104, 14, 14, 100]]) c.fillRect(x, y, ww, hh);
  });
}

function cassetteAC(parent, x, z) {
  const g = new THREE.Group();
  addBox(g, [0.86, 0.04, 0.86], std('#f2f3f4', { roughness: 0.5 }), [0, 0, 0], { cast: false });
  const face = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 0.8), std('#ffffff', { map: grilleTex(), roughness: 0.6 }));
  face.rotation.x = Math.PI / 2;
  face.position.y = -0.021;
  g.add(face);
  for (const [dx, dz, ry] of [[0, 0.33, 0], [0, -0.33, 0], [0.33, 0, Math.PI / 2], [-0.33, 0, Math.PI / 2]]) {
    const vane = addBox(g, [0.5, 0.008, 0.06], std('#e2e4e6', { roughness: 0.5 }), [dx, -0.03, dz], { cast: false });
    vane.rotation.y = ry;
    vane.rotation.x = 0.4 * (dz || dx > 0 ? 1 : -1);
  }
  g.position.set(x, 2.68, z);
  parent.add(g);
}

function ceilingBits(parent, x, z, kind) {
  const white = std('#f4f4f2', { roughness: 0.5 });
  if (kind === 'sprinkler') {
    const b = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.012, 14), std('#c9ced4', { metalness: 0.8, roughness: 0.3 }));
    b.position.set(x, 2.69, z);
    parent.add(b);
    const head = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.03, 8), std('#d9b46a', { metalness: 0.8, roughness: 0.3 }));
    head.position.set(x, 2.67, z);
    parent.add(head);
  } else if (kind === 'smoke') {
    const b = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.065, 0.03, 20), white);
    b.position.set(x, 2.685, z);
    parent.add(b);
    const led = new THREE.Mesh(new THREE.SphereGeometry(0.004, 6, 6), new THREE.MeshBasicMaterial({ color: '#3ae06a' }));
    led.position.set(x + 0.03, 2.668, z);
    parent.add(led);
  } else {
    const b = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.012, 24), white);
    b.position.set(x, 2.69, z);
    parent.add(b);
    const grill = new THREE.Mesh(new THREE.CircleGeometry(0.085, 24), std('#d6d9dc', { roughness: 0.8 }));
    grill.rotation.x = Math.PI / 2;
    grill.position.set(x, 2.683, z);
    parent.add(grill);
  }
}

function extinguisher(parent, x, z, rotY) {
  const g = new THREE.Group();
  const red = std('#d0201b', { roughness: 0.35, metalness: 0.2 });
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.075, 0.32, 6, 16), red);
  body.position.y = 0.3;
  g.add(body);
  addBox(g, [0.06, 0.04, 0.03], std('#1a1a1a'), [0, 0.53, 0], { cast: false });
  const hose = new THREE.Mesh(new THREE.TorusGeometry(0.07, 0.01, 6, 16, Math.PI), std('#1a1a1a'));
  hose.position.set(0.06, 0.42, 0);
  hose.rotation.z = -Math.PI / 2;
  g.add(hose);
  addBox(g, [0.3, 0.06, 0.2], std('#d0201b'), [0, 0.03, 0]);
  const s = sign(w.shokaki, { w: 0.34, h: 0.12, bg: '#d0201b', fg: '#fff', res: 256 });
  s.position.set(0, 1.1, -0.11);
  g.add(s);
  g.position.set(x, 0, z);
  g.rotation.y = rotY;
  parent.add(g);
}

function terminal(parent, x, y, z, rotY) {
  const g = new THREE.Group();
  addBox(g, [0.08, 0.03, 0.16], std('#1f2228', { roughness: 0.4 }), [0, 0.015, 0], { cast: false });
  const screen = addBox(g, [0.065, 0.002, 0.05], std('#0b1220', { emissive: '#3a8aff', emissiveIntensity: 0.5 }), [0, 0.031, 0.04], { cast: false });
  screen.userData.noHit = true;
  for (let i = 0; i < 9; i++) addBox(g, [0.014, 0.004, 0.012], std('#e8e8e8'), [-0.02 + (i % 3) * 0.02, 0.032, -0.02 - Math.floor(i / 3) * 0.018], { cast: false });
  g.position.set(x, y, z);
  g.rotation.set(0, rotY, 0.25);
  parent.add(g);
}

function manhole(parent, x, z) {
  const t = canvasTex(256, 256, (c) => {
    c.fillStyle = '#3a3b3e'; c.beginPath(); c.arc(128, 128, 126, 0, TAU); c.fill();
    c.strokeStyle = '#55575b'; c.lineWidth = 6;
    for (let r = 30; r < 120; r += 22) { c.beginPath(); c.arc(128, 128, r, 0, TAU); c.stroke(); }
    // a little hare in the middle, the way Japanese towns decorate their covers
    c.fillStyle = '#5f6266';
    c.beginPath(); c.ellipse(128, 136, 30, 20, 0, 0, TAU); c.fill();
    c.beginPath(); c.ellipse(108, 104, 7, 26, -0.4, 0, TAU); c.fill();
    c.beginPath(); c.ellipse(124, 100, 7, 26, -0.1, 0, TAU); c.fill();
  });
  const m = new THREE.Mesh(new THREE.CircleGeometry(0.33, 32), std('#ffffff', { map: t, roughness: 0.6, metalness: 0.4, transparent: true }));
  m.rotation.x = -Math.PI / 2;
  m.position.set(x, 0.004, z);
  m.receiveShadow = true;
  parent.add(m);
}

function drainGrate(parent, x, z) {
  const t = canvasTex(128, 32, (c) => {
    c.fillStyle = '#2a2b2e'; c.fillRect(0, 0, 128, 32);
    c.fillStyle = '#151618';
    for (let i = 4; i < 124; i += 8) c.fillRect(i, 4, 4, 24);
  });
  const m = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.22), std('#ffffff', { map: t, roughness: 0.5, metalness: 0.6 }));
  m.rotation.x = -Math.PI / 2;
  m.position.set(x, 0.003, z);
  parent.add(m);
}

function outdoorAC(parent, x, z, rotY) {
  const g = new THREE.Group();
  addBox(g, [0.8, 0.6, 0.3], std('#e6e6e2', { roughness: 0.6 }), [0, 0.3, 0]);
  const fan = canvasTex(128, 128, (c) => {
    c.fillStyle = '#d9d9d4'; c.fillRect(0, 0, 128, 128);
    c.fillStyle = '#4a4c50'; c.beginPath(); c.arc(64, 64, 56, 0, TAU); c.fill();
    c.strokeStyle = '#d9d9d4'; c.lineWidth = 3;
    for (let r = 14; r < 60; r += 9) { c.beginPath(); c.arc(64, 64, r, 0, TAU); c.stroke(); }
    for (let i = 0; i < 4; i++) { c.beginPath(); c.moveTo(64, 64); c.lineTo(64 + Math.cos(i * 1.57) * 56, 64 + Math.sin(i * 1.57) * 56); c.stroke(); }
  });
  const face = new THREE.Mesh(new THREE.PlaneGeometry(0.46, 0.46), std('#ffffff', { map: fan, roughness: 0.6 }));
  face.position.set(-0.13, 0.32, 0.151);
  g.add(face);
  for (const dx of [-0.32, 0.32]) addBox(g, [0.06, 0.08, 0.34], std('#6a6c70'), [dx, 0.04, 0], { cast: false });
  // insulated pipes climbing the wall
  const pipe = std('#f0eee8', { roughness: 0.7 });
  addBox(g, [0.07, 1.6, 0.07], pipe, [0.3, 1.3, -0.1]);
  g.position.set(x, 0.08, z);
  g.rotation.y = rotY;
  parent.add(g);
}

function meter(parent, x, y, z, rotY) {
  const g = new THREE.Group();
  addBox(g, [0.24, 0.32, 0.12], std('#d8d9d4', { roughness: 0.5 }), [0, 0, 0]);
  const glass = new THREE.Mesh(new THREE.CircleGeometry(0.08, 24), std('#9aa8b4', { roughness: 0.05, metalness: 0.3 }));
  glass.position.set(0, 0.04, 0.061);
  g.add(glass);
  addBox(g, [0.12, 0.03, 0.01], std('#1a1a1a'), [0, -0.09, 0.061], { cast: false });
  g.position.set(x, y, z);
  g.rotation.y = rotY;
  parent.add(g);
}

function stopSign(parent, x, z, rotY) {
  const g = new THREE.Group();
  addBox(g, [0.06, 2.3, 0.06], std('#c9ced4', { metalness: 0.7, roughness: 0.35 }), [0, 1.15, 0]);
  const L = new Label(256, 230);
  const c = L.ctx;
  c.fillStyle = '#ffffff';
  c.beginPath(); c.moveTo(8, 8); c.lineTo(248, 8); c.lineTo(128, 222); c.closePath(); c.fill();
  c.fillStyle = '#d0201b';
  c.beginPath(); c.moveTo(24, 18); c.lineTo(232, 18); c.lineTo(128, 204); c.closePath(); c.fill();
  L.text(w.tomare, 128, 70, { size: 54, color: '#ffffff', font: FONTS.gothic, weight: 800 });
  const m = new THREE.Mesh(new THREE.PlaneGeometry(0.62, 0.56), L.material({ transparent: true, alphaTest: 0.1, side: THREE.DoubleSide }));
  m.position.set(0, 2.1, 0.035);
  m.userData.sign = true;
  g.add(m);
  g.position.set(x, 0, z);
  g.rotation.y = rotY;
  parent.add(g);
}

function roadText(parent, word, x, z, rotY) {
  const L = new Label(256, 512);
  L.ctx.save();
  L.ctx.translate(128, 256);
  L.ctx.scale(1, 2.2);    // painted road text is stretched so it reads from a car
  L.text(word, 0, 0, { size: 110, color: '#f4f4f0', font: FONTS.gothic, weight: 800 });
  L.ctx.restore();
  // record the stretched region by hand so it's still hoverable
  L.regions.length = 0;
  L.region(word, 0, 60, 256, 392);
  const m = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 2.4), L.material({ transparent: true, roughness: 0.8 }));
  m.rotation.x = -Math.PI / 2;
  m.rotation.z = rotY;
  m.position.set(x, 0.006, z);
  m.userData.sign = true;
  parent.add(m);
}

export function buildDetails(scene) {
  const g = new THREE.Group();
  scene.add(g);

  // --- ceiling services ---
  cassetteAC(g, -1.8, 0.9);
  cassetteAC(g, 1.8, -2.7);
  for (const [x, z] of [[-3.6, 0.9], [0, 0.9], [3.6, 0.9], [-3.6, -2.7], [0, -2.7], [3.6, -2.7], [-1.8, 2.7], [1.8, 2.7], [-1.8, -0.9], [1.8, -0.9]]) ceilingBits(g, x, z, 'sprinkler');
  for (const [x, z] of [[-4.5, 2.7], [2.7, 0.9], [-0.9, -2.7]]) ceilingBits(g, x, z, 'smoke');
  for (const [x, z] of [[0, 2.7], [-2.7, -0.9], [3.6, -0.9]]) ceilingBits(g, x, z, 'speaker');

  // --- fire extinguisher by the staff door ---
  extinguisher(g, 4.25, -4.82, 0);

  // --- counter clutter ---
  const acrylic = new THREE.MeshStandardMaterial({ color: '#ffffff', transparent: true, opacity: 0.12, roughness: 0.02, depthWrite: false });
  for (const z of [-0.4, 1.4]) {
    const panel = addBox(g, [0.006, 0.55, 0.7], acrylic, [3.92, 1.27, z], { cast: false, receive: false });
    panel.userData.noHit = true;
    addBox(g, [0.012, 0.02, 0.7], std('#c9ced4', { metalness: 0.6 }), [3.92, 1.0, z], { cast: false });
    terminal(g, 4.05, 0.99, z + 0.42, Math.PI / 2);
    // coin tray
    addBox(g, [0.14, 0.012, 0.2], std('#2a5aa0', { roughness: 0.4 }), [4.08, 0.996, z - 0.32], { cast: false });
    // receipt printer behind the register
    addBox(g, [0.14, 0.1, 0.14], std('#e8e8e4', { roughness: 0.4 }), [4.42, 1.04, z + 0.25]);
    addBox(g, [0.06, 0.002, 0.04], std('#ffffff'), [4.34, 1.091, z + 0.25], { cast: false });
  }
  // chopsticks / wet-wipe caddy beside the hot case
  const caddy = new THREE.Group();
  addBox(caddy, [0.16, 0.08, 0.24], std('#ffffff', { roughness: 0.5 }), [0, 0.04, 0]);
  for (let i = 0; i < 10; i++) addBox(caddy, [0.008, 0.1, 0.012], std('#d9b88a'), [-0.04 + (i % 5) * 0.012, 0.11, -0.06 + Math.floor(i / 5) * 0.02], { cast: false });
  for (let i = 0; i < 6; i++) addBox(caddy, [0.05, 0.004, 0.07], std('#f2f4f6'), [0.035, 0.083 + i * 0.004, 0.06], { cast: false });
  const cs = sign(w.hashi, { w: 0.14, h: 0.05, bg: '#2b3140', fg: '#fff', res: 128 });
  cs.position.set(-0.081, 0.05, 0);
  cs.rotation.y = FACE.nx;
  caddy.add(cs);
  caddy.position.set(4.12, 0.99, -0.95);
  g.add(caddy);
  // sanitiser at the end of the counter
  const san = new THREE.Group();
  const bottle = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.16, 20), std('#f4f8fb', { roughness: 0.3 }));
  bottle.position.y = 0.08;
  san.add(bottle);
  addBox(san, [0.02, 0.04, 0.05], std('#2a6ad0'), [0, 0.18, 0.015], { cast: false });
  const ss = sign(w.shodoku, { w: 0.06, h: 0.03, bg: '#2a6ad0', fg: '#fff', res: 128 });
  ss.position.set(-0.036, 0.09, 0);
  ss.rotation.y = FACE.nx;
  san.add(ss);
  san.position.set(4.1, 0.99, -2.25);
  g.add(san);
  // coffee condiments by the machine
  const cond = new THREE.Group();
  addBox(cond, [0.2, 0.09, 0.26], std('#2b3140', { roughness: 0.5 }), [0, 0.045, 0]);
  for (let i = 0; i < 3; i++) {
    const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.025, 0.08, 14), std(['#ffffff', '#c98a3a', '#f2e6c8'][i], { roughness: 0.5 }));
    cup.position.set(0, 0.13, -0.08 + i * 0.08);
    cond.add(cup);
  }
  cond.position.set(4.15, 0.99, 2.15);
  g.add(cond);
  // carrier bags hanging behind the counter
  for (let i = 0; i < 3; i++) addBox(g, [0.02, 0.32, 0.26], std('#f4f4f2', { roughness: 0.9 }), [5.42, 0.62, -1.9 + i * 0.03], { cast: false });

  // --- building services outside (left side wall) ---
  outdoorAC(g, -6.55, -2.4, -Math.PI / 2);
  outdoorAC(g, -6.55, -3.6, -Math.PI / 2);
  meter(g, -6.27, 1.4, -1.0, -Math.PI / 2);
  meter(g, -6.27, 1.4, -0.6, -Math.PI / 2);
  for (const [x, z] of [[-6.32, 5.32], [6.32, 5.32], [-6.32, -5.32], [6.32, -5.32]]) {
    const dp = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 3.7, 12), std('#8a8e94', { roughness: 0.5, metalness: 0.3 }));
    dp.position.set(x, 1.85, z);
    dp.castShadow = true;
    g.add(dp);
  }
  for (const z of [-3, 1]) {
    const lamp = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.18, 0.18), std('#2b3140'));
    lamp.position.set(-6.27, 2.4, z);
    g.add(lamp);
    const glow = new THREE.Mesh(new THREE.PlaneGeometry(0.12, 0.08), new THREE.MeshStandardMaterial({ color: '#fff', emissive: '#ffe2b0', emissiveIntensity: 0.6 }));
    glow.rotation.x = Math.PI / 2;
    glow.position.set(-6.3, 2.305, z);
    g.add(glow);
  }

  // --- can recycling bin beside the vending machines ---
  const rb = new THREE.Group();
  addBox(rb, [0.4, 0.75, 0.4], std('#2a6ad0', { roughness: 0.4 }), [0, 0.375, 0]);
  const hole = new THREE.Mesh(new THREE.CircleGeometry(0.06, 20), std('#111'));
  hole.position.set(0, 0.62, 0.201);
  rb.add(hole);
  const rs = sign(w.kanSenyo, { w: 0.34, h: 0.1, bg: '#ffffff', fg: '#2a6ad0', res: 256 });
  rs.position.set(0, 0.45, 0.202);
  rb.add(rs);
  rb.position.set(6.3, 0, 5.75);
  g.add(rb);

  // --- road furniture ---
  manhole(g, -4.0, 18.0);
  manhole(g, 9.0, 20.2);
  for (const x of [-15, -7, 1, 9, 17]) drainGrate(g, x, 15.75);
  stopSign(g, -12.6, 14.6, 0);
  roadText(g, w.tomare, -13.5, 16.8, 0);
  addBox(g, [3.6, 0.01, 0.35], std('#f4f4f0', { roughness: 0.8 }), [-14.2, 0.005, 15.9], { cast: false });

  return { group: g };
}
