import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { productTemplate } from './products.js';
import { wordAt } from './label.js';

// Close-up product viewer drawn on its own transparent canvas above the game.
export class Inspector {
  constructor(container, { onHover }) {
    this.container = container;
    this.onHover = onHover;
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.0;
    this.renderer.domElement.className = 'inspect-canvas';
    container.appendChild(this.renderer.domElement);

    this.scene = new THREE.Scene();
    const pm = new THREE.PMREMGenerator(this.renderer);
    this.scene.environment = pm.fromScene(new RoomEnvironment(), 0.04).texture;
    this.scene.environmentIntensity = 0.9;
    const key = new THREE.DirectionalLight('#ffffff', 1.6);
    key.position.set(1, 2, 3);
    const rim = new THREE.DirectionalLight('#cfe0ff', 0.8);
    rim.position.set(-2, 1, -2);
    this.scene.add(key, rim);

    this.camera = new THREE.PerspectiveCamera(30, 1, 0.01, 10);
    this.pivot = new THREE.Group();
    this.scene.add(this.pivot);
    this.ray = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    this.active = false;
    this.dist = 0.5;
    this.spin = new THREE.Vector2();

    const el = this.renderer.domElement;
    let down = null;
    el.addEventListener('pointerdown', (e) => { down = { x: e.clientX, y: e.clientY }; el.setPointerCapture(e.pointerId); });
    el.addEventListener('pointerup', () => (down = null));
    el.addEventListener('pointermove', (e) => {
      if (down) {
        const dx = e.clientX - down.x, dy = e.clientY - down.y;
        down = { x: e.clientX, y: e.clientY };
        this.rotate(dx * 0.008, dy * 0.008);
        this.onHover(null);
        return;
      }
      this.hover(e);
    });
    el.addEventListener('pointerleave', () => this.onHover(null));
    el.addEventListener('wheel', (e) => {
      e.preventDefault();
      this.dist = THREE.MathUtils.clamp(this.dist * (1 + e.deltaY * 0.001), this.minDist, this.maxDist);
    }, { passive: false });
    el.addEventListener('dblclick', () => this.pivot.quaternion.identity());
    addEventListener('resize', () => this.resize());
    this.resize();
  }

  resize() {
    const w = this.container.clientWidth || innerWidth, h = this.container.clientHeight || innerHeight;
    this.renderer.setSize(w, h);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  }

  open(def) {
    this.pivot.clear();
    const obj = productTemplate(def).clone();
    const size = obj.userData.size || new THREE.Box3().setFromObject(obj).getSize(new THREE.Vector3());
    obj.position.y = -size.y / 2;
    this.pivot.add(obj);
    this.pivot.quaternion.identity();
    this.pivot.rotation.set(0.12, -0.35, 0);
    // flat items (bento, ice bars) read better seen from above
    if (def.shape === 'bento') this.pivot.rotation.set(0.9, 0, 0);
    const r = Math.max(size.x, size.y, size.z);
    this.dist = r * 3.1;
    this.minDist = r * 0.9;
    this.maxDist = r * 5;
    this.active = true;
    this.resize();
  }

  close() {
    this.active = false;
    this.pivot.clear();
  }

  rotate(dx, dy) {
    const qy = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), dx);
    const qx = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), dy);
    this.pivot.quaternion.premultiply(qy).premultiply(qx);
  }

  hover(e) {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.mouse.set(((e.clientX - rect.left) / rect.width) * 2 - 1, -((e.clientY - rect.top) / rect.height) * 2 + 1);
    this.ray.setFromCamera(this.mouse, this.camera);
    const hits = this.ray.intersectObject(this.pivot, true);
    this.onHover(hits.length ? wordAt(hits[0]) : null, e.clientX, e.clientY);
  }

  render(dt) {
    if (!this.active) return;
    // slight offset to the left so the info panel has room
    this.camera.position.set(0, 0, this.dist);
    this.camera.lookAt(0, 0, 0);
    this.renderer.render(this.scene, this.camera);
  }
}
