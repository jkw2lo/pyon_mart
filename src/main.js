import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { GTAOPass } from 'three/addons/postprocessing/GTAOPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { words } from './data/words.js';
import { byId } from './data/products.js';
import { allWords, wordAt } from './label.js';
import { preloadBrandArt } from './art.js';
import { productTemplate } from './products.js';
import { makeMaterials, Colliders } from './world/common.js';
import { buildExterior } from './world/exterior.js';
import { buildInterior } from './world/interior.js';
import { createEnvironment } from './environment.js';
import { Player } from './player.js';
import { Inspector } from './inspect.js';
import { logoLockup, logoBadge } from './logo.js';
import { createAudio } from './audio.js';

const $ = (s) => document.querySelector(s);

// --- fonts + brand art first: labels are drawn onto canvases ---------------------
async function loadFonts() {
  const text = [...new Set(Object.values(words).map((w) => w.jp).join('') + 'PYONMART0123456789¥')].join('');
  const faces = ['700 40px "Noto Sans JP"', '800 40px "Noto Sans JP"', '500 40px "Noto Sans JP"', '700 40px "Zen Maru Gothic"',
    '700 40px "Noto Serif JP"', '400 40px "Mochiy Pop One"', '800 40px "M PLUS Rounded 1c"'];
  const all = Promise.all(faces.map((f) => document.fonts.load(f, text).catch(() => {})));
  await Promise.race([all, new Promise((r) => setTimeout(r, 6000))]);
}

$('#start-logo').innerHTML = logoLockup({ width: 560, dark: true });
$('#mini-logo').innerHTML = logoBadge({ size: 44 });

await Promise.all([loadFonts(), preloadBrandArt()]);

// --- renderer / scene ---------------------------------------------------------
const renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
$('#app').appendChild(renderer.domElement);

const scene = new THREE.Scene();
const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

const camera = new THREE.PerspectiveCamera(66, innerWidth / innerHeight, 0.05, 1200);

// post: ambient occlusion grounds every product on its shelf, bloom makes signs glow
const rt = new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType, samples: 4 });
const composer = new EffectComposer(renderer, rt);
composer.addPass(new RenderPass(scene, camera));
const gtao = new GTAOPass(scene, camera, innerWidth, innerHeight);
gtao.updateGtaoMaterial({ radius: 0.35, distanceExponent: 1.5, thickness: 1.2, scale: 1.0, samples: 8 });
gtao.blendIntensity = 0.85;
composer.addPass(gtao);
const bloom = new UnrealBloomPass(new THREE.Vector2(innerWidth, innerHeight), 0.3, 0.3, 3.5);
composer.addPass(bloom);
composer.addPass(new OutputPass());

function resize() {
  renderer.setSize(innerWidth, innerHeight);
  composer.setSize(innerWidth, innerHeight);
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
}
addEventListener('resize', resize);
resize();

const mats = makeMaterials();
const colliders = new Colliders();
const ext = buildExterior(scene, mats, colliders);
const int = buildInterior(scene, mats, colliders);
const env = createEnvironment(scene, renderer);
const player = new Player(camera, renderer.domElement, colliders);
const audio = createAudio();

// --- word collection ------------------------------------------------------------
let found = new Set();
try { found = new Set(JSON.parse(localStorage.getItem('pyon-words') || '[]')); } catch { /* fresh start */ }
const updateWordCount = () => {
  $('#word-count').textContent = [...found].filter((j) => allWords.has(j)).length;
  $('#word-total').textContent = allWords.size;
};
function collect(word) {
  if (!word || found.has(word.jp)) return;
  found.add(word.jp);
  try { localStorage.setItem('pyon-words', JSON.stringify([...found])); } catch { /* not persisted */ }
  updateWordCount();
  toast(`<span class="jp">新しい言葉</span> · ${word.jp} (${word.romaji})`);
  audio.blip();
}
let toastTimer;
function toast(html) {
  const t = $('#toast');
  t.innerHTML = html;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 1800);
}

// --- tooltip ----------------------------------------------------------------------
const tip = $('#tooltip');
let tipWord = null, tipTimer = 0;
function showTip(word, x, y) {
  if (!word) { tip.classList.add('hidden'); tipWord = null; return; }
  if (tipWord !== word) {
    tip.querySelector('.tt-jp').textContent = word.jp;
    tip.querySelector('.tt-kana').textContent = word.kana === word.jp ? '' : word.kana;
    tip.querySelector('.tt-romaji').textContent = word.romaji;
    tip.querySelector('.tt-en').textContent = word.en;
    tipWord = word;
    tipTimer = performance.now();
  }
  // count it as "found" once you've actually lingered on it for a moment
  if (performance.now() - tipTimer > 350) collect(word);
  tip.classList.remove('hidden');
  const r = tip.getBoundingClientRect();
  tip.style.left = `${Math.min(innerWidth - r.width - 10, x + 18)}px`;
  tip.style.top = `${Math.min(innerHeight - r.height - 10, y + 22)}px`;
}

// --- inspector ----------------------------------------------------------------------
const inspector = new Inspector($('#inspect'), { onHover: (w, x, y) => showTip(w, x, y) });
let inspecting = null;   // { def, id, index }
const basket = [];
function openInspect(id, index = null) {
  const def = byId[id];
  inspecting = { def, id, index };
  if (index !== null) int.stocker.setVisible(id, index, false);
  player.enabled = false;
  clearHover();
  inspector.open(def);
  $('#inspect').classList.remove('hidden');
  $('#hud').classList.add('hidden');
  $('.ip-brand').textContent = def.brand.jp;
  $('.ip-title').textContent = def.title.jp;
  $('.ip-reading').textContent = `${def.title.kana} · ${def.title.romaji}`;
  $('.ip-en').textContent = def.title.en[0].toUpperCase() + def.title.en.slice(1) + (def.sub ? ` — ${def.sub.en}` : '');
  $('.ip-price').innerHTML = `¥${def.price}<small>税込 (tax incl.)</small>`;
  collect(def.title);
  audio.rustle();
}
function closeInspect(keep = false) {
  if (!inspecting) return;
  const { id, index } = inspecting;
  if (!keep && index !== null) int.stocker.setVisible(id, index, true);
  inspecting = null;
  inspector.close();
  showTip(null);
  $('#inspect').classList.add('hidden');
  $('#hud').classList.remove('hidden');
  player.enabled = true;
}
function addToBasket() {
  if (!inspecting) return;
  const { def } = inspecting;
  basket.push(def);
  $('#basket-count').textContent = basket.length;
  $('#basket-total').textContent = basket.reduce((s, d) => s + d.price, 0);
  toast(`<span class="jp">${def.title.jp}</span> added to your basket`);
  closeInspect(true);
}
$('#btn-back').onclick = () => closeInspect();
$('#btn-basket').onclick = addToBasket;
$('#btn-turn').onclick = () => inspector.turnOver();
$('#btn-reset').onclick = () => inspector.reset();

// --- word book --------------------------------------------------------------------
function toggleWordbook(force) {
  const wb = $('#wordbook');
  const open = force ?? wb.classList.contains('hidden');
  wb.classList.toggle('hidden', !open);
  if (open) {
    player.enabled = false;
    clearHover();
    $('#wb-list').innerHTML = [...allWords.values()]
      .sort((a, b) => found.has(b.jp) - found.has(a.jp))
      .map((w) => found.has(w.jp)
        ? `<div class="wb-item"><div class="j">${w.jp}</div><div class="k">${w.kana} · ${w.romaji}</div><div class="e">${w.en}</div></div>`
        : `<div class="wb-item locked"><div class="j">${'？'.repeat(Math.min(5, [...w.jp].length))}</div><div class="k">not found yet</div></div>`)
      .join('');
  } else if (!inspecting) {
    player.enabled = true;
  }
}
$('#words-btn').onclick = () => toggleWordbook(true);
$('#wb-close').onclick = () => toggleWordbook(false);

// --- time of day ------------------------------------------------------------------
let hours = 16.5;
const timeInput = $('#time');
function setTime(h) {
  hours = ((h % 24) + 24) % 24;
  timeInput.value = hours;
  const hh = Math.floor(hours), mm = Math.floor((hours - hh) * 60);
  $('#time-label').textContent = `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
  const st = env.update(hours);
  $('#time-icon').textContent = st.night > 0.5 ? '☾' : '☀';
  for (const m of ext.nightMats) m.emissiveIntensity = st.night * 1.2;
  for (const s of ext.signMats) s.mat.emissiveIntensity = s.day + (s.night - s.day) * st.night;
  for (const L of ext.streetLights) L.intensity = st.night * 18;
  for (const L of ext.canopyLights) L.intensity = st.night * 25;
  bloom.enabled = st.night > 0.25;
  bloom.strength = st.night * 0.35;
}
timeInput.addEventListener('input', () => setTime(parseFloat(timeInput.value)));
setTime(hours);

// --- doors ------------------------------------------------------------------------
const door = { amt: 0, target: 0, idle: 0, center: new THREE.Vector3(3, 0, 5.1) };
function openDoors() {
  if (door.target === 0) audio.chime();
  door.target = 1;
  door.idle = 0;
}
function updateDoors(dt) {
  const d = Math.hypot(player.pos.x - door.center.x, player.pos.z - door.center.z);
  // inside, the sensor opens the door for you; outside you click it
  if (d < 1.9 && (door.target === 1 || player.inside)) openDoors();
  if (door.target === 1 && d > 2.2) {
    door.idle += dt;
    if (door.idle > 1.6) door.target = 0;
  }
  door.amt += (door.target - door.amt) * Math.min(1, dt * 4.5);
  for (const p of ext.doorPanels) p.position.x = p.userData.closedX + p.userData.side * door.amt * 0.9;
  ext.doorCollider.enabled = door.amt < 0.8;
}

// --- hovering with the mouse --------------------------------------------------------
const ray = new THREE.Raycaster();
const mouse = { x: innerWidth / 2, y: innerHeight / 2, inside: false };
const ndc = new THREE.Vector2();
const targets = [ext.group, int.group];
const REACH = 2.8;
let aim = null;

renderer.domElement.addEventListener('pointermove', (e) => { if (mouse.frozen) return; mouse.x = e.clientX; mouse.y = e.clientY; mouse.inside = true; });
renderer.domElement.addEventListener('pointerleave', () => { if (!mouse.frozen) mouse.inside = false; });

// soft glow shell shown over the product under the cursor
const glowMat = new THREE.MeshBasicMaterial({ color: '#fff6d8', transparent: true, opacity: 0.22, depthWrite: false, blending: THREE.AdditiveBlending });
const glow = new THREE.Group();
scene.add(glow);
let glowKey = '';
function showGlow(id, index) {
  const key = `${id}:${index}`;
  if (key === glowKey) return;
  glowKey = key;
  glow.clear();
  const m = int.stocker.placement(id, index);
  if (!m) return;
  const tpl = productTemplate(byId[id]).clone();
  tpl.traverse((o) => { if (o.isMesh) { o.material = glowMat; o.renderOrder = 10; } });
  tpl.scale.setScalar(1.04);
  glow.add(tpl);
  m.decompose(glow.position, glow.quaternion, glow.scale);
  glow.scale.multiplyScalar(1);
}
function clearHover() {
  aim = null;
  glow.clear();
  glowKey = '';
  showTip(null);
  $('#hint').innerHTML = '';
  renderer.domElement.style.cursor = '';
}

function updateAim() {
  if (!mouse.inside || player.dragging) {
    if (player.dragging) { clearHover(); renderer.domElement.style.cursor = 'grabbing'; }
    return;
  }
  ndc.set((mouse.x / innerWidth) * 2 - 1, -(mouse.y / innerHeight) * 2 + 1);
  ray.setFromCamera(ndc, camera);
  ray.far = 16;
  const hits = ray.intersectObjects(targets, true);
  aim = null;
  for (const h of hits) {
    const o = h.object;
    if (o.userData.noHit || !o.visible) continue;
    if (o.userData.door) { if (h.distance < 7) aim = { kind: 'door', hit: h, word: wordAt(h) }; break; }
    if (o.userData.productId) {
      if (h.distance < REACH + 1.2) aim = { kind: 'product', id: o.userData.productId, index: h.instanceId, hit: h, word: wordAt(h), reach: h.distance < REACH };
      break;
    }
    const word = wordAt(h);
    if (word) aim = { kind: 'word', word, hit: h };
    break;
  }

  const hint = $('#hint');
  const place = () => { hint.style.left = `${mouse.x}px`; hint.style.top = `${mouse.y - 34}px`; };
  if (!aim) { clearHover(); return; }
  showTip(aim.word, mouse.x, mouse.y);
  if (aim.kind === 'door') {
    renderer.domElement.style.cursor = door.target ? '' : 'pointer';
    hint.innerHTML = door.target ? '' : 'Click to open';
    place();
    glow.clear(); glowKey = '';
  } else if (aim.kind === 'product') {
    renderer.domElement.style.cursor = aim.word ? 'help' : aim.reach ? 'pointer' : '';
    hint.innerHTML = aim.reach ? (aim.word ? '' : 'Click to pick up') : '';
    place();
    if (aim.reach) showGlow(aim.id, aim.index); else { glow.clear(); glowKey = ''; }
  } else {
    renderer.domElement.style.cursor = 'help';
    hint.innerHTML = '';
    glow.clear(); glowKey = '';
  }
}

function interact() {
  if (!aim) return;
  if (aim.kind === 'door') openDoors();
  else if (aim.kind === 'product' && aim.reach) openInspect(aim.id, aim.index);
}

// a click only counts if the mouse barely moved (so looking around never grabs things)
renderer.domElement.addEventListener('pointerup', (e) => {
  const click = player.endDrag();
  renderer.domElement.style.cursor = '';
  if (!click || !player.enabled) return;
  // aim exactly where the click landed, even if no mousemove came first
  if (!mouse.frozen) { mouse.x = e.clientX; mouse.y = e.clientY; mouse.inside = true; }
  updateAim();
  interact();
});

addEventListener('keydown', (e) => {
  if (e.target instanceof HTMLInputElement) return;
  if (inspecting) {
    if (e.code === 'Escape') closeInspect();
    else if (e.code === 'KeyB' || e.code === 'Enter') addToBasket();
    else if (e.code === 'KeyF' || e.code === 'Space') { e.preventDefault(); inspector.turnOver(); }
    else if (e.code === 'KeyR') inspector.reset();
    return;
  }
  if (e.code === 'KeyJ' && started) toggleWordbook();
  else if (e.code === 'Escape' && !$('#wordbook').classList.contains('hidden')) toggleWordbook(false);
  else if (e.code === 'KeyT' && started) setTime(hours < 6 || hours >= 18.5 ? 12 : 21);
});

// --- start ------------------------------------------------------------------------
let started = false;
const enter = $('#enter');
enter.disabled = false;
enter.textContent = 'Enter';
enter.onclick = () => {
  started = true;
  $('#start').classList.add('hidden');
  $('#hud').classList.remove('hidden');
  player.enabled = true;
  audio.start();
};
updateWordCount();

// --- loop -------------------------------------------------------------------------
let last = performance.now();
let fps = 60;
function frame() {
  const now = performance.now();
  const dt = Math.min((now - last) / 1000, 0.05);
  last = now;
  fps += (1 / Math.max(dt, 1e-3) - fps) * 0.05;
  if ($('#time-auto').checked && !inspecting) setTime(hours + dt * 0.05);
  player.update(dt);
  updateDoors(dt);
  if (player.enabled) updateAim();
  audio.update(player.inside, door.amt);
  if (inspecting) {
    // the scene behind the viewer is blurred anyway; skip the expensive passes
    renderer.render(scene, camera);
  } else {
    composer.render(dt);
  }
  inspector.render(dt);
  requestAnimationFrame(frame);
}
player.update(0);
frame();

// handy for debugging from the console
window.pyon = {
  player, setTime, openInspect, closeInspect, scene, camera, renderer, int, gtao, bloom,
  get fps() { return Math.round(fps); },
  get aim() { return aim && { kind: aim.kind, id: aim.id, word: aim.word?.jp, reach: aim.reach }; },
  get mouse() { return mouse; },
  go(x, z, yaw = 0, pitch = 0) { player.pos.set(x, 0, z); player.yaw = yaw; player.pitch = pitch; player.update(0); },
  hoverAt(x, y, freeze = false) { mouse.x = x; mouse.y = y; mouse.inside = true; mouse.frozen = freeze; },
  start() { enter.onclick(); },
};
