import * as THREE from 'three';

// A canvas that remembers where each piece of Japanese text was drawn, so a
// raycast UV hit on the finished texture can be mapped back to its reading.

export const FONTS = {
  gothic: '"Noto Sans JP", "Hiragino Sans", sans-serif',
  round: '"Zen Maru Gothic", "Hiragino Maru Gothic ProN", sans-serif',
  mincho: '"Noto Serif JP", "Hiragino Mincho ProN", serif',
  pop: '"Mochiy Pop One", "Zen Maru Gothic", sans-serif',
};

// Every word that has been drawn somewhere in the world (for the collection count).
export const allWords = new Map();

export class Label {
  constructor(w = 512, h = 512) {
    this.canvas = document.createElement('canvas');
    this.canvas.width = w;
    this.canvas.height = h;
    this.ctx = this.canvas.getContext('2d');
    this.w = w;
    this.h = h;
    this.regions = [];
  }

  fill(color) {
    this.ctx.fillStyle = color;
    this.ctx.fillRect(0, 0, this.w, this.h);
    return this;
  }

  rect(x, y, w, h, color, r = 0) {
    const c = this.ctx;
    c.fillStyle = color;
    c.beginPath();
    c.roundRect(x, y, w, h, r);
    c.fill();
    return this;
  }

  circle(x, y, r, color) {
    const c = this.ctx;
    c.fillStyle = color;
    c.beginPath();
    c.arc(x, y, r, 0, Math.PI * 2);
    c.fill();
    return this;
  }

  // Draw text horizontally. `t` is either a plain string or a word entry
  // { jp, kana, romaji, en } which becomes hoverable.
  text(t, x, y, { size = 40, font = FONTS.gothic, weight = 700, color = '#222', align = 'center', maxW = this.w * 0.9, stroke = null, strokeW = 0, base = 'middle' } = {}) {
    const str = typeof t === 'string' ? t : t.jp;
    const c = this.ctx;
    let s = size;
    c.font = `${weight} ${s}px ${font}`;
    while (c.measureText(str).width > maxW && s > 8) {
      s -= 2;
      c.font = `${weight} ${s}px ${font}`;
    }
    c.textAlign = align;
    c.textBaseline = base;
    if (stroke) {
      c.lineJoin = 'round';
      c.strokeStyle = stroke;
      c.lineWidth = strokeW;
      c.strokeText(str, x, y);
    }
    c.fillStyle = color;
    c.fillText(str, x, y);
    const w = c.measureText(str).width;
    const left = align === 'center' ? x - w / 2 : align === 'right' ? x - w : x;
    const top = base === 'middle' ? y - s * 0.6 : base === 'top' ? y : y - s;
    if (typeof t !== 'string') this.region(t, left, top, w, s * 1.2);
    return this;
  }

  // Stacked vertical text (tategaki), common on tea bottles and onigiri.
  vtext(t, x, y, { size = 60, font = FONTS.mincho, weight = 700, color = '#222', gap = 1.05 } = {}) {
    const str = typeof t === 'string' ? t : t.jp;
    const c = this.ctx;
    c.font = `${weight} ${size}px ${font}`;
    c.textAlign = 'center';
    c.textBaseline = 'top';
    c.fillStyle = color;
    [...str].forEach((ch, i) => c.fillText(ch, x, y + i * size * gap));
    if (typeof t !== 'string') this.region(t, x - size * 0.6, y, size * 1.2, str.length * size * gap);
    return this;
  }

  region(word, x, y, w, h) {
    allWords.set(word.jp, word);
    this.regions.push({ word, u0: x / this.w, u1: (x + w) / this.w, v0: 1 - (y + h) / this.h, v1: 1 - y / this.h });
  }

  texture() {
    const t = new THREE.CanvasTexture(this.canvas);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 8;
    return t;
  }

  // A material whose userData carries the hover regions.
  material(opts = {}) {
    const m = new THREE.MeshStandardMaterial({ map: this.texture(), roughness: 0.55, ...opts });
    m.userData.regions = this.regions;
    return m;
  }
}

// Look up the word under a raycast hit, if any.
export function wordAt(hit) {
  if (!hit || !hit.uv) return null;
  const obj = hit.object;
  let mat = obj.material;
  if (Array.isArray(mat)) mat = hit.face ? mat[hit.face.materialIndex] : null;
  const regions = mat?.userData?.regions;
  if (!regions) return obj.userData.word || null;
  const { x: u, y: v } = hit.uv;
  // pad regions a little so small text is easy to hit
  for (const r of regions) {
    if (u >= r.u0 - 0.01 && u <= r.u1 + 0.01 && v >= r.v0 - 0.01 && v <= r.v1 + 0.01) return r.word;
  }
  return null;
}

// Simple procedural textures --------------------------------------------------

export function canvasTex(w, h, draw, { repeat = [1, 1], srgb = true } = {}) {
  const cv = document.createElement('canvas');
  cv.width = w;
  cv.height = h;
  draw(cv.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(cv);
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(...repeat);
  t.anisotropy = 8;
  return t;
}

export function noise(ctx, w, h, amount = 18, alpha = 0.08) {
  const img = ctx.getImageData(0, 0, w, h);
  for (let i = 0; i < img.data.length; i += 4) {
    const n = (Math.random() - 0.5) * amount;
    img.data[i] += n;
    img.data[i + 1] += n;
    img.data[i + 2] += n;
  }
  ctx.putImageData(img, 0, 0);
}
