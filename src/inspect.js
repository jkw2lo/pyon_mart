import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { productTemplate } from './products.js';
import { wordAt } from './label.js';

const damp = (a, b, k, dt) => a + (b - a) * (1 - Math.exp(-k * dt));

// Close-up product viewer drawn on its own transparent canvas above the game.
// Turntable-style: drag left/right spins it, up/down tilts it (clamped so it
// never ends up upside-down), with easing and a little inertia.
export class Inspector {
  constructor(container, { onHover }) {
    this.container = container;
    this.onHover = onHover;
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.domElement.className = 'inspect-canvas';
    container.prepend(this.renderer.domElement);

    this.scene = new THREE.Scene();
    const pm = new THREE.PMREMGenerator(this.renderer);
    this.scene.environment = pm.fromScene(new RoomEnvironment(), 0.04).texture;
    this.scene.environmentIntensity = 0.85;
    const key = new THREE.DirectionalLight('#fff8ee', 1.7);
    key.position.set(1.5, 2.5, 3);
    const rim = new THREE.DirectionalLight('#cfe0ff', 1.0);
    rim.position.set(-2, 1.5, -2.5);
    this.scene.add(key, rim);

    this.camera = new THREE.PerspectiveCamera(28, 1, 0.01, 10);
    this.spin = new THREE.Group();   // yaw
    this.tilt = new THREE.Group();   // pitch (applied after yaw)
    this.tilt.add(this.spin);
    this.scene.add(this.tilt);
    this.ray = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    this.active = false;
    this.state = { yaw: 0, pitch: 0, tYaw: 0, tPitch: 0, vYaw: 0, dist: 0.5, tDist: 0.5, lift: 0 };
    this.keys = new Set();

    const el = this.renderer.domElement;
    let drag = null;
    el.addEventListener('pointerdown', (e) => {
      drag = { x: e.clientX, y: e.clientY, moved: 0, t: performance.now() };
      el.setPointerCapture(e.pointerId);
      this.state.vYaw = 0;
    });
    el.addEventListener('pointerup', () => {
      if (drag && drag.moved > 4) this.state.vYaw = drag.v || 0;
      drag = null;
      el.style.cursor = '';
    });
    el.addEventListener('pointermove', (e) => {
      if (drag) {
        const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
        drag.moved += Math.abs(dx) + Math.abs(dy);
        drag.x = e.clientX;
        drag.y = e.clientY;
        if (drag.moved > 4) {
          el.style.cursor = 'grabbing';
          this.state.tYaw += dx * 0.011;
          this.state.tPitch = THREE.MathUtils.clamp(this.state.tPitch + dy * 0.008, -1.25, 1.25);
          drag.v = dx * 0.011 * 60;
          this.onHover(null);
          return;
        }
      }
      this.hover(e);
    });
    el.addEventListener('pointerleave', () => this.onHover(null));
    el.addEventListener('wheel', (e) => {
      e.preventDefault();
      const s = this.state;
      s.tDist = THREE.MathUtils.clamp(s.tDist * (1 + Math.sign(e.deltaY) * Math.min(0.25, Math.abs(e.deltaY) * 0.0015)), this.minDist, this.maxDist);
    }, { passive: false });
    el.addEventListener('dblclick', () => this.reset());
    addEventListener('keydown', (e) => this.active && this.keys.add(e.code));
    addEventListener('keyup', (e) => this.keys.delete(e.code));
    addEventListener('resize', () => this.resize());
    this.resize();
  }

  resize() {
    const w = this.container.clientWidth || innerWidth, h = this.container.clientHeight || innerHeight;
    this.renderer.setSize(w, h);
    this.camera.aspect = w / h;
    // keep the product centred in the space left of the info panel
    if (w > 760) this.camera.setViewOffset(w, h, Math.min(170, w * 0.13), 0, w, h);
    else this.camera.clearViewOffset();
    this.camera.updateProjectionMatrix();
  }

  open(def) {
    this.spin.clear();
    const obj = productTemplate(def).clone();
    const size = obj.userData.size || new THREE.Box3().setFromObject(obj).getSize(new THREE.Vector3());
    obj.position.y = -size.y / 2;
    this.spin.add(obj);
    this.def = def;
    const r = Math.max(size.x, size.y, size.z);
    this.r = r;
    this.minDist = r * 1.3;
    this.maxDist = r * 5;
    // flat things (bento, trays, lids) are best seen from above
    const flat = size.y < Math.max(size.x, size.z) * 0.6;
    const lidded = ['cup', 'icecup', 'dessert'].includes(def.shape);
    this.home = { yaw: -0.3, pitch: flat ? 0.75 : lidded ? 0.38 : 0.12, dist: r * 3.5 };
    const s = this.state;
    Object.assign(s, { yaw: this.home.yaw - 1.2, tYaw: this.home.yaw, pitch: this.home.pitch, tPitch: this.home.pitch, vYaw: 0, dist: this.home.dist * 1.4, tDist: this.home.dist, lift: 0 });
    this.active = true;
    this.resize();
  }

  reset() {
    const s = this.state;
    // spin back the short way round
    s.tYaw = this.home.yaw + Math.round((s.yaw - this.home.yaw) / (Math.PI * 2)) * Math.PI * 2;
    s.tPitch = this.home.pitch;
    s.tDist = this.home.dist;
    s.vYaw = 0;
  }

  turnOver() {
    this.state.tYaw += Math.PI;
    this.state.vYaw = 0;
  }

  close() {
    this.active = false;
    this.spin.clear();
    this.keys.clear();
  }

  hover(e) {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.mouse.set(((e.clientX - rect.left) / rect.width) * 2 - 1, -((e.clientY - rect.top) / rect.height) * 2 + 1);
    this.ray.setFromCamera(this.mouse, this.camera);
    const hits = this.ray.intersectObject(this.spin, true).filter((h) => !h.object.userData.noHit);
    const word = hits.length ? wordAt(hits[0]) : null;
    this.renderer.domElement.style.cursor = word ? 'help' : '';
    this.onHover(word, e.clientX, e.clientY);
  }

  render(dt) {
    if (!this.active) return;
    const s = this.state, k = this.keys;
    // keyboard: A/D or ←/→ spin, W/S or ↑/↓ tilt
    const kx = (k.has('KeyD') || k.has('ArrowRight') ? 1 : 0) - (k.has('KeyA') || k.has('ArrowLeft') ? 1 : 0);
    const ky = (k.has('KeyS') || k.has('ArrowDown') ? 1 : 0) - (k.has('KeyW') || k.has('ArrowUp') ? 1 : 0);
    if (kx) { s.tYaw += kx * dt * 2.4; s.vYaw = 0; }
    if (ky) s.tPitch = THREE.MathUtils.clamp(s.tPitch + ky * dt * 1.8, -1.25, 1.25);
    // inertia after a flick, decaying quickly
    if (Math.abs(s.vYaw) > 0.01) { s.tYaw += s.vYaw * dt; s.vYaw *= Math.exp(-dt * 4); }
    s.yaw = damp(s.yaw, s.tYaw, 10, dt);
    s.pitch = damp(s.pitch, s.tPitch, 10, dt);
    s.dist = damp(s.dist, s.tDist, 8, dt);
    s.lift = damp(s.lift, 1, 6, dt);
    this.spin.rotation.y = s.yaw;
    this.tilt.rotation.x = s.pitch;
    this.tilt.position.y = (1 - s.lift) * -0.3 * this.r;
    this.camera.position.set(0, 0, s.dist);
    this.camera.lookAt(0, 0, 0);
    this.renderer.render(this.scene, this.camera);
  }
}
