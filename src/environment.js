import * as THREE from 'three';
import { Sky } from 'three/addons/objects/Sky.js';

const smooth = (a, b, x) => {
  const t = THREE.MathUtils.clamp((x - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
};

// Sky, sun/moon light, stars. `update(hours)` moves everything for a time of day.
export function createEnvironment(scene, renderer) {
  const sky = new Sky();
  sky.scale.setScalar(900);
  scene.add(sky);
  const u = sky.material.uniforms;
  u.turbidity.value = 6;
  u.rayleigh.value = 1.6;
  u.mieCoefficient.value = 0.005;
  u.mieDirectionalG.value = 0.8;

  const sun = new THREE.DirectionalLight('#fff4e0', 3);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  const sc = sun.shadow.camera;
  sc.left = -28; sc.right = 28; sc.top = 28; sc.bottom = -28; sc.near = 1; sc.far = 120;
  sun.shadow.bias = -0.0004;
  sun.shadow.normalBias = 0.03;
  scene.add(sun, sun.target);

  const hemi = new THREE.HemisphereLight('#bcd4ff', '#6a6458', 0.6);
  scene.add(hemi);

  // stars + moon for the night sky
  const starGeo = new THREE.BufferGeometry();
  const pos = [];
  for (let i = 0; i < 1500; i++) {
    const v = new THREE.Vector3().randomDirection();
    if (v.y < 0.05) v.y = Math.abs(v.y) + 0.05;
    pos.push(...v.normalize().multiplyScalar(400).toArray());
  }
  starGeo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  const starMat = new THREE.PointsMaterial({ color: '#ffffff', size: 1.4, sizeAttenuation: false, transparent: true, opacity: 0, depthWrite: false, fog: false });
  const stars = new THREE.Points(starGeo, starMat);
  scene.add(stars);
  const moonMat = new THREE.MeshBasicMaterial({ color: '#fdfbf2', transparent: true, opacity: 0, fog: false });
  const moon = new THREE.Mesh(new THREE.SphereGeometry(9, 32, 16), moonMat);
  scene.add(moon);

  // night sky gradient laid over the (black) scattering sky after dusk
  const domeMat = new THREE.ShaderMaterial({
    side: THREE.BackSide, transparent: true, depthWrite: false, fog: false,
    uniforms: { opacity: { value: 0 } },
    vertexShader: 'varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
    fragmentShader: 'uniform float opacity; varying vec3 vP; void main(){ float h = clamp(vP.y, 0.0, 1.0); vec3 c = mix(vec3(0.16,0.2,0.33), vec3(0.015,0.025,0.06), pow(h, 0.45)); gl_FragColor = vec4(c, opacity); }',
  });
  const dome = new THREE.Mesh(new THREE.SphereGeometry(500, 32, 16), domeMat);
  dome.renderOrder = -1;
  scene.add(dome);
  stars.renderOrder = 0;

  const fogDay = new THREE.Color('#c9d6e3'), fogNight = new THREE.Color('#0d1220'), fogDusk = new THREE.Color('#e3a78a');
  scene.fog = new THREE.Fog(fogDay.clone(), 40, 260);

  const sunDir = new THREE.Vector3();
  const state = { night: 0 };

  function update(hours) {
    // sun rises at 6, sets at 18, peaks ~60° in the south
    const a = ((hours - 6) / 12) * Math.PI;
    const elev = Math.sin(a) * 62;                       // degrees
    const az = THREE.MathUtils.degToRad(100 + ((hours - 6) / 12) * 160);
    const phi = THREE.MathUtils.degToRad(90 - elev);
    sunDir.setFromSphericalCoords(1, phi, az);
    u.sunPosition.value.copy(sunDir);

    const day = smooth(-4, 8, elev);
    const night = 1 - smooth(-8, 2, elev);
    const dusk = Math.max(0, 1 - Math.abs(elev - 2) / 10) * (1 - night * 0.6);
    state.night = night;
    state.day = day;

    // the key light follows the sun by day and the moon by night
    const moonDir = sunDir.clone().negate();
    moonDir.y = Math.max(0.35, moonDir.y);
    moonDir.normalize();
    const key = day > 0.05 ? sunDir : moonDir;
    sun.position.copy(key).multiplyScalar(60).add(new THREE.Vector3(0, 0, 4));
    sun.target.position.set(0, 0, 4);
    sun.intensity = day * 2.8 + night * 0.12;
    sun.color.set(day > 0.05 ? '#fff1dc' : '#9fb4ff').lerp(new THREE.Color('#ff9a5a'), dusk * 0.7);

    hemi.intensity = 0.05 + day * 0.4;
    hemi.color.set('#bcd4ff').lerp(new THREE.Color('#2a3a6a'), night);
    hemi.groundColor.set('#6a6458').lerp(new THREE.Color('#141418'), night);

    u.rayleigh.value = 1.2 + dusk * 1.5;
    starMat.opacity = night;
    domeMat.uniforms.opacity.value = night * 0.97;
    moon.position.copy(moonDir).multiplyScalar(420);
    moonMat.opacity = night;

    scene.fog.color.copy(fogDay).lerp(fogDusk, dusk * 0.5).lerp(fogNight, night);
    scene.environmentIntensity = 0.12 + day * 0.38;
    renderer.toneMappingExposure = 0.95;
    return state;
  }

  return { update, state, sun };
}
