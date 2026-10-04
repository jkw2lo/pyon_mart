import * as THREE from 'three';

// First-person walker. The mouse stays free so you can hover anything to read
// it: drag to look around, WASD / arrows to walk, a clean click to interact.
export class Player {
  constructor(camera, dom, colliders) {
    this.camera = camera;
    this.dom = dom;
    this.colliders = colliders;
    this.pos = new THREE.Vector3(3, 0, 24);
    this.yaw = 0;          // 0 = looking toward -z (the store)
    this.pitch = -0.04;
    this.yawV = 0;         // smoothed look velocity for a softer feel
    this.pitchV = 0;
    this.radius = 0.28;
    this.eye = 1.58;
    this.keys = new Set();
    this.enabled = false;
    this.bob = 0;
    this.speed = 0;
    this.drag = null;       // { x, y, moved }

    addEventListener('keydown', (e) => {
      if (e.target instanceof HTMLInputElement) return;
      this.keys.add(e.code);
    });
    addEventListener('keyup', (e) => this.keys.delete(e.code));
    addEventListener('blur', () => this.keys.clear());

    dom.addEventListener('pointerdown', (e) => {
      if (!this.enabled || (e.button !== 0 && e.button !== 2)) return;
      this.drag = { x: e.clientX, y: e.clientY, sx: e.clientX, sy: e.clientY, moved: 0, t: performance.now() };
      dom.setPointerCapture(e.pointerId);
    });
    dom.addEventListener('pointermove', (e) => {
      if (!this.drag) return;
      const dx = e.clientX - this.drag.x, dy = e.clientY - this.drag.y;
      this.drag.x = e.clientX;
      this.drag.y = e.clientY;
      this.drag.moved = Math.max(this.drag.moved, Math.hypot(e.clientX - this.drag.sx, e.clientY - this.drag.sy));
      // only start turning once it's clearly a drag, so clicks never nudge the view
      if (this.drag.moved > 6) this.look(dx, dy);
    });
    dom.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  // returns true if the pointer-up should count as a click
  endDrag() {
    const d = this.drag;
    this.drag = null;
    return !!d && d.moved <= 6 && performance.now() - d.t < 600;
  }

  get dragging() {
    return !!this.drag && this.drag.moved > 6;
  }

  look(dx, dy) {
    this.yaw -= dx * 0.0035;
    this.pitch = THREE.MathUtils.clamp(this.pitch - dy * 0.0035, -1.3, 1.3);
  }

  update(dt) {
    const k = this.keys;
    let f = 0, r = 0, turn = 0;
    if (this.enabled) {
      if (k.has('KeyW') || k.has('ArrowUp')) f += 1;
      if (k.has('KeyS') || k.has('ArrowDown')) f -= 1;
      if (k.has('KeyD')) r += 1;
      if (k.has('KeyA')) r -= 1;
      if (k.has('KeyQ') || k.has('ArrowLeft')) turn += 1;
      if (k.has('KeyE') || k.has('ArrowRight')) turn -= 1;
    }
    this.yawV += (turn * 1.9 - this.yawV) * Math.min(1, dt * 10);
    this.yaw += this.yawV * dt;

    const target = (k.has('ShiftLeft') || k.has('ShiftRight') ? 4.0 : 2.1) * (f || r ? 1 : 0);
    this.speed += (target - this.speed) * Math.min(1, dt * 8);
    const len = Math.hypot(f, r);
    if (len > 0) { this.dirF = f / len; this.dirR = r / len; }
    if (this.speed > 0.01 && this.dirF !== undefined) {
      const sin = Math.sin(this.yaw), cos = Math.cos(this.yaw);
      const dx = (-sin * this.dirF + cos * this.dirR) * this.speed * dt;
      const dz = (-cos * this.dirF - sin * this.dirR) * this.speed * dt;
      this.move(dx, dz);
      this.bob += dt * this.speed * 3.4;
    }
    const bobY = Math.sin(this.bob) * 0.018 * Math.min(1, this.speed / 2);
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
