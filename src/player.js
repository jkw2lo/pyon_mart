import * as THREE from 'three';

// First-person walker: pointer-lock mouse look (drag-to-look fallback), WASD,
// circle-vs-rectangle collision against the world's colliders.
export class Player {
  constructor(camera, dom, colliders) {
    this.camera = camera;
    this.dom = dom;
    this.colliders = colliders;
    this.pos = new THREE.Vector3(3, 0, 24);
    this.yaw = 0;          // 0 = looking toward -z (the store)
    this.pitch = -0.04;
    this.radius = 0.28;
    this.eye = 1.58;
    this.keys = new Set();
    this.enabled = false;
    this.locked = false;
    this.bob = 0;
    this.dragging = false;

    addEventListener('keydown', (e) => this.keys.add(e.code));
    addEventListener('keyup', (e) => this.keys.delete(e.code));
    addEventListener('blur', () => this.keys.clear());
    document.addEventListener('pointerlockchange', () => {
      this.locked = document.pointerLockElement === dom;
    });
    document.addEventListener('mousemove', (e) => {
      if (!this.enabled) return;
      if (this.locked || this.dragging) this.look(e.movementX, e.movementY);
    });
    dom.addEventListener('mousedown', (e) => { if (!this.locked && e.button === 0) this.dragging = true; });
    addEventListener('mouseup', () => (this.dragging = false));
  }

  lock() {
    try {
      const p = this.dom.requestPointerLock?.();
      if (p && p.catch) p.catch(() => {});
    } catch { /* drag-to-look still works */ }
  }

  unlock() {
    if (document.pointerLockElement) document.exitPointerLock();
  }

  look(dx, dy) {
    const s = this.locked ? 0.0022 : 0.004;
    this.yaw -= dx * s;
    this.pitch = THREE.MathUtils.clamp(this.pitch - dy * s, -1.35, 1.35);
  }

  update(dt) {
    const k = this.keys;
    let f = 0, r = 0;
    if (this.enabled) {
      if (k.has('KeyW') || k.has('ArrowUp')) f += 1;
      if (k.has('KeyS') || k.has('ArrowDown')) f -= 1;
      if (k.has('KeyD') || k.has('ArrowRight')) r += 1;
      if (k.has('KeyA') || k.has('ArrowLeft')) r -= 1;
      if (k.has('KeyQ')) this.yaw += dt * 1.8;
      if (k.has('KeyE')) this.yaw -= dt * 1.8;
    }
    const speed = k.has('ShiftLeft') || k.has('ShiftRight') ? 4.2 : 2.2;
    const len = Math.hypot(f, r);
    if (len > 0) {
      f /= len; r /= len;
      const sin = Math.sin(this.yaw), cos = Math.cos(this.yaw);
      const dx = (-sin * f + cos * r) * speed * dt;
      const dz = (-cos * f - sin * r) * speed * dt;
      this.move(dx, dz);
      this.bob += dt * speed * 3.2;
    }
    const bobY = Math.sin(this.bob) * 0.025;
    this.camera.position.set(this.pos.x, this.pos.y + this.eye + bobY, this.pos.z);
    this.camera.rotation.set(this.pitch, this.yaw, 0, 'YXZ');
  }

  move(dx, dz) {
    // axis-separated so the player slides along walls
    this.pos.x += dx;
    this.resolve();
    this.pos.z += dz;
    this.resolve();
  }

  resolve() {
    const p = this.pos, rad = this.radius;
    for (const c of this.colliders.list) {
      if (!c.enabled) continue;
      const nx = THREE.MathUtils.clamp(p.x, c.x0, c.x1);
      const nz = THREE.MathUtils.clamp(p.z, c.z0, c.z1);
      const dx = p.x - nx, dz = p.z - nz;
      const d2 = dx * dx + dz * dz;
      if (d2 < rad * rad) {
        if (d2 > 1e-8) {
          const d = Math.sqrt(d2);
          p.x = nx + (dx / d) * rad;
          p.z = nz + (dz / d) * rad;
        } else {
          // centre inside the box: push out along the shallowest axis
          const opts = [[c.x0 - rad - p.x, 0], [c.x1 + rad - p.x, 0], [0, c.z0 - rad - p.z], [0, c.z1 + rad - p.z]];
          opts.sort((a, b) => Math.abs(a[0] + a[1]) - Math.abs(b[0] + b[1]));
          p.x += opts[0][0];
          p.z += opts[0][1];
        }
      }
    }
  }

  get inside() {
    return this.pos.x > -6 && this.pos.x < 6 && this.pos.z > -5 && this.pos.z < 5;
  }
}
