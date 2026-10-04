import * as THREE from 'three';
import { Label, FONTS, canvasTex, noise } from '../label.js';

export function addBox(parent, size, mat, pos, { cast = true, receive = true, rotY = 0 } = {}) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(...size), mat);
  m.position.set(...pos);
  m.rotation.y = rotY;
  m.castShadow = cast;
  m.receiveShadow = receive;
  parent.add(m);
  return m;
}

export const std = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.7, ...o });

// Axis-aligned collision rectangles on the XZ plane.
export class Colliders {
  constructor() {
    this.list = [];
  }
  add(x0, x1, z0, z1, tag) {
    const c = { x0: Math.min(x0, x1), x1: Math.max(x0, x1), z0: Math.min(z0, z1), z1: Math.max(z0, z1), tag, enabled: true };
    this.list.push(c);
    return c;
  }
  // around a mesh-like footprint centred at (x, z)
  rect(x, z, w, d, tag) {
    return this.add(x - w / 2, x + w / 2, z - d / 2, z + d / 2, tag);
  }
}

// A flat sign with one hoverable word, optionally with an English line.
export function sign(word, { w = 1, h = 0.3, bg = '#ffffff', fg = '#333', font = FONTS.round, sub = null, subColor = null, res = 512, emissive = 0, border = null, align = 'center' } = {}) {
  const W = res, H = Math.max(32, Math.round((res * h) / w));
  const L = new Label(W, H).fill(bg);
  if (border) {
    L.ctx.strokeStyle = border;
    L.ctx.lineWidth = H * 0.06;
    L.ctx.strokeRect(H * 0.03, H * 0.03, W - H * 0.06, H - H * 0.06);
  }
  const x = align === 'left' ? H * 0.3 : W / 2;
  if (sub) {
    L.text(word, x, H * 0.4, { size: H * 0.5, color: fg, font, maxW: W * 0.9, align });
    L.text(sub, x, H * 0.8, { size: H * 0.2, color: subColor || fg, font: FONTS.gothic, weight: 500, maxW: W * 0.9, align });
  } else {
    L.text(word, x, H * 0.52, { size: H * 0.62, color: fg, font, maxW: W * 0.9, align });
  }
  const mat = L.material({ roughness: 0.5 });
  if (emissive) {
    mat.emissive = new THREE.Color('#ffffff');
    mat.emissiveMap = mat.map;
    mat.emissiveIntensity = emissive;
  }
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
  m.userData.sign = true;
  return m;
}

// --- shared materials ----------------------------------------------------------

export function makeMaterials() {
  const floorTex = canvasTex(512, 512, (c, w, h) => {
    c.fillStyle = '#e9e8e3';
    c.fillRect(0, 0, w, h);
    noise(c, w, h, 10);
    c.strokeStyle = '#c9c7c0';
    c.lineWidth = 3;
    for (let i = 0; i <= 2; i++) {
      c.beginPath(); c.moveTo(i * w / 2, 0); c.lineTo(i * w / 2, h); c.stroke();
      c.beginPath(); c.moveTo(0, i * h / 2); c.lineTo(w, i * h / 2); c.stroke();
    }
  }, { repeat: [10, 8.5] });

  const ceilTex = canvasTex(256, 256, (c, w, h) => {
    c.fillStyle = '#f4f4f2';
    c.fillRect(0, 0, w, h);
    noise(c, w, h, 8);
    c.fillStyle = '#d8d8d4';
    c.fillRect(0, 0, w, 4);
    c.fillRect(0, 0, 4, h);
    c.fillStyle = '#c9c9c4';
    for (let i = 0; i < 160; i++) c.fillRect(Math.random() * w, Math.random() * h, 2, 2);
  }, { repeat: [20, 17] });

  const asphalt = canvasTex(512, 512, (c, w, h) => {
    c.fillStyle = '#3d3f43';
    c.fillRect(0, 0, w, h);
    noise(c, w, h, 40);
    for (let i = 0; i < 2000; i++) {
      c.fillStyle = Math.random() < 0.5 ? '#4a4c50' : '#2f3134';
      c.fillRect(Math.random() * w, Math.random() * h, 2, 2);
    }
  }, { repeat: [12, 6] });

  const pavement = canvasTex(256, 256, (c, w, h) => {
    c.fillStyle = '#b9b6ae';
    c.fillRect(0, 0, w, h);
    noise(c, w, h, 20);
    c.strokeStyle = '#9d9a92';
    c.lineWidth = 2;
    for (let i = 0; i <= 4; i++) {
      c.beginPath(); c.moveTo(i * w / 4, 0); c.lineTo(i * w / 4, h); c.stroke();
      c.beginPath(); c.moveTo(0, i * h / 4); c.lineTo(w, i * h / 4); c.stroke();
    }
  }, { repeat: [30, 1] });

  const wallTile = canvasTex(256, 256, (c, w, h) => {
    c.fillStyle = '#ebe9e4';
    c.fillRect(0, 0, w, h);
    noise(c, w, h, 8);
    c.fillStyle = '#d4d1ca';
    for (let y = 0; y < h; y += 32) c.fillRect(0, y, w, 2);
    for (let y = 0; y < h; y += 32) for (let x = (y / 32) % 2 ? 0 : 32; x < w; x += 64) c.fillRect(x, y, 2, 32);
  }, { repeat: [6, 2] });

  return {
    floor: std('#ffffff', { map: floorTex, roughness: 0.22, metalness: 0 }),
    ceiling: std('#ffffff', { map: ceilTex, roughness: 0.9 }),
    asphalt: std('#ffffff', { map: asphalt, roughness: 0.92 }),
    pavement: std('#ffffff', { map: pavement, roughness: 0.85 }),
    wallOut: std('#ffffff', { map: wallTile, roughness: 0.8 }),
    wallIn: std('#f3f2ee', { roughness: 0.85 }),
    slate: std('#3a4150', { roughness: 0.5, metalness: 0.2 }),
    aluminium: std('#9aa0a8', { roughness: 0.35, metalness: 0.85 }),
    darkMetal: std('#2a2d33', { roughness: 0.4, metalness: 0.6 }),
    shelfWhite: std('#f1f1ee', { roughness: 0.45, metalness: 0.1 }),
    shelfEdge: std('#d7dade', { roughness: 0.4, metalness: 0.3 }),
    concrete: std('#a9a7a1', { roughness: 0.95 }),
    white: std('#ffffff', { roughness: 0.6 }),
    glass: new THREE.MeshStandardMaterial({ color: '#cfe3ea', roughness: 0.04, metalness: 0.1, transparent: true, opacity: 0.16, depthWrite: false, envMapIntensity: 1.5 }),
    fridgeGlass: new THREE.MeshStandardMaterial({ color: '#dceef2', roughness: 0.03, metalness: 0.1, transparent: true, opacity: 0.1, depthWrite: false, envMapIntensity: 1.5 }),
    lightPanel: new THREE.MeshStandardMaterial({ color: '#ffffff', emissive: '#f4f8ff', emissiveIntensity: 3 }),
    fridgeLight: new THREE.MeshStandardMaterial({ color: '#ffffff', emissive: '#eef6ff', emissiveIntensity: 0.85 }),
    paint: std('#f4f4f0', { roughness: 0.6 }),
    yellowPaint: std('#e8c43a', { roughness: 0.6 }),
  };
}
