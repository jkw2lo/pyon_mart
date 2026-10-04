import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { words } from './data/words.js';
import { byId } from './data/products.js';
import { allWords, wordAt } from './label.js';
import { makeMaterials, Colliders } from './world/common.js';
import { buildExterior } from './world/exterior.js';
import { buildInterior } from './world/interior.js';
import { createEnvironment } from './environment.js';
import { Player } from './player.js';
import { Inspector } from './inspect.js';
import { logoLockup, logoRim } from './logo.js';
import { createAudio } from './audio.js';

const $ = (s) => document.querySelector(s);

// --- fonts first: labels are drawn onto canvases, so the Japanese web fonts must be ready
async function loadFonts() {
  const text = [...new Set(Object.values(words).map((w) => w.jp).join('') + 'PYONMART0123456789¥')].join('');
  const faces = ['700 40px "Noto Sans JP"', '800 40px "Noto Sans JP"', '500 40px "Noto Sans JP"', '700 40px "Zen Maru Gothic"', '700 40px "Noto Serif JP"', '400 40px "Mochiy Pop One"'];
  const all = Promise.all(faces.map((f) => document.fonts.load(f, text).catch(() => {})));
  await Promise.race([all, new Promise((r) => setTimeout(r, 6000))]);
}

$('#start-logo').innerHTML = logoLockup({ width: 560, dark: true, mark: 'badge' });
$('#mini-logo').innerHTML = logoRim({ size: 44 });

await loadFonts();

// --- renderer / scene ---------------------------------------------------------
const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
$('#app').appendChild(renderer.domElement);

const scene = new THREE.Scene();
const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

const camera = new THREE.PerspectiveCamera(68, innerWidth / innerHeight, 0.05, 1200);
addEventListener('resize', () => {
  renderer.setSize(innerWidth, innerHeight);
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
});

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
let tipWord = null;
function showTip(word, x, y) {
  if (!word) { tip.classList.add('hidden'); tipWord = null; return; }
  if (tipWord !== word) {
    tip.querySelector('.tt-jp').textContent = word.jp;
    tip.querySelector('.tt-kana').textContent = word.kana === word.jp ? '' : word.kana;
    tip.querySelector('.tt-romaji').textContent = word.romaji;
    tip.querySelector('.tt-en').textContent = word.en;
    tipWord = word;
    collect(word);
  }
  tip.classList.remove('hidden');
  const r = tip.getBoundingClientRect();
  const px = Math.min(innerWidth - r.width - 10, x + 18);
  const py = Math.min(innerHeight - r.height - 10, y + 18);
  tip.style.left = `${px}px`;
  tip.style.top = `${py}px`;
}

// --- inspector ----------------------------------------------------------------------
const inspector = new Inspector($('#inspect'), { onHover: (w, x, y) => showTip(w, x, y) });
let inspecting = null;
const basket = [];
function openInspect(id) {
  const def = byId[id];
  inspecting = def;
  player.enabled = false;
  player.unlock();
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
function closeInspect() {
  if (!inspecting) return;
  inspecting = null;
  inspector.close();
  showTip(null);
  $('#inspect').classList.add('hidden');
  $('#hud').classList.remove('hidden');
  player.enabled = true;
  player.lock();
}
function addToBasket() {
  if (!inspecting) return;
  basket.push(inspecting);
  $('#basket-count').textContent = basket.length;
  $('#basket-total').textContent = basket.reduce((s, d) => s + d.price, 0);
  toast(`<span class="jp">${inspecting.title.jp}</span> added to your basket`);
  closeInspect();
}
$('#btn-back').onclick = closeInspect;
$('#btn-basket').onclick = addToBasket;

// --- word book --------------------------------------------------------------------
function toggleWordbook(force) {
  const wb = $('#wordbook');
  const open = force ?? wb.classList.contains('hidden');
  wb.classList.toggle('hidden', !open);
  if (open) {
    player.enabled = false;
    player.unlock();
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

// --- aiming / interaction ---------------------------------------------------------
const ray = new THREE.Raycaster();
const centre = new THREE.Vector2(0, 0);
const targets = [ext.group, int.group];
let aim = null;
function updateAim() {
  ray.setFromCamera(centre, camera);
  ray.far = 30;
  const hits = ray.intersectObjects(targets, true);
  aim = null;
  for (const h of hits) {
    const o = h.object;
    if (o.userData.noHit) continue;
    if (o.userData.door && h.distance < 6) { aim = { kind: 'door', hit: h }; break; }
    if (o.userData.productId && h.distance < 2.6) { aim = { kind: 'product', id: o.userData.productId, hit: h, word: wordAt(h) }; break; }
    const word = wordAt(h);
    if (word && h.distance < (o.userData.productId ? 2.6 : 14)) { aim = { kind: 'word', word, hit: h }; break; }
    if (!o.userData.productId) break;  // first solid thing blocks the view
    if (h.distance > 2.6) break;
  }
  const hint = $('#hint');
  const ch = $('#crosshair');
  ch.classList.toggle('active', !!aim);
  if (!aim) { hint.innerHTML = ''; showTip(null); return; }
  if (aim.kind === 'door') {
    hint.innerHTML = door.target ? '' : 'Click to open the door';
    showTip(aim.word || null);
  } else if (aim.kind === 'product') {
    hint.innerHTML = `<span class="jp">${byId[aim.id].title.jp}</span> · click to pick up`;
    showTip(aim.word, innerWidth / 2, innerHeight / 2);
  } else {
    hint.innerHTML = '';
    showTip(aim.word, innerWidth / 2, innerHeight / 2);
  }
}

function interact() {
  if (!aim) return;
  if (aim.kind === 'door') openDoors();
  else if (aim.kind === 'product') openInspect(aim.id);
}

// a click (not a drag) on the game canvas
let downAt = null;
renderer.domElement.addEventListener('mousedown', (e) => (downAt = { x: e.clientX, y: e.clientY, locked: player.locked }));
renderer.domElement.addEventListener('mouseup', (e) => {
  if (!downAt || !player.enabled) return;
  const moved = Math.hypot(e.clientX - downAt.x, e.clientY - downAt.y);
  if (downAt.locked) interact();
  else if (moved < 5) { if (aim) interact(); else player.lock(); }
  downAt = null;
});

addEventListener('keydown', (e) => {
  if (e.code === 'Escape' && inspecting) closeInspect();
  else if (e.code === 'KeyB' && inspecting) addToBasket();
  else if (e.code === 'KeyJ' && started) toggleWordbook();
  else if (e.code === 'KeyT' && started && !inspecting) setTime(hours < 6 || hours >= 18.5 ? 12 : 21);
  else if (e.code === 'KeyF' && player.enabled) interact();
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
  player.lock();
  audio.start();
};
updateWordCount();

// --- loop -------------------------------------------------------------------------
let last = performance.now();
function frame() {
  const now = performance.now();
  const dt = Math.min((now - last) / 1000, 0.05);
  last = now;
  if ($('#time-auto').checked && !inspecting) setTime(hours + dt * 0.05);
  player.update(dt);
  updateDoors(dt);
  if (player.enabled) updateAim();
  audio.update(player.inside, door.amt);
  renderer.render(scene, camera);
  inspector.render(dt);
  requestAnimationFrame(frame);
}
player.update(0);
frame();

// handy for debugging from the console
window.pyon = {
  player, setTime, openInspect, closeInspect, scene, camera, renderer,
  go(x, z, yaw = 0, pitch = 0) { player.pos.set(x, 0, z); player.yaw = yaw; player.pitch = pitch; player.update(0); },
  start() { enter.onclick(); },
};
