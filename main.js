import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';
import { Sky } from 'three/addons/objects/Sky.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { createFire } from './fire.js';
import {
  setEnvMap, createZombieModel, createLootModel, createTreeMeshes, createRockMesh,
  makeWallMaterial, makeFloorMaterial, createGableRoof, createHouseDecor, createTable,
  createCarModel, createPistolModel,
} from './models.js';

/* ===========================================================
   CONFIGURAÇÃO
   =========================================================== */
const EYE = 1.65;          // altura dos olhos
const RADIUS = 0.35;       // raio de colisão do jogador
const DOOR_W = 1.8;        // largura da porta das casas
const MAP = 170;           // metade do tamanho do mapa
const MAG = 12;            // tamanho do pente
const ZOMBIE_DMG = 12;
const SHOT_DMG = 35;
const MELEE_DMG = 40;
const MAX_ZOMBIES = 12;

const LOOT_NAMES = { food: 'lata de feijão', water: 'garrafa de água', bandage: 'kit de primeiros socorros', ammo: 'caixa de munição', wood: 'madeira' };
const LOOT_Y = { food: 0.07, water: 0.15, bandage: 0.12, ammo: 0.07, wood: 0.05 };
const LOOT_TYPES = ['food', 'food', 'water', 'water', 'bandage', 'ammo', 'ammo', 'wood', 'wood'];
const HOUSES = [
  { x: -34, z: -42, w: 9, d: 7, h: 3.2, tint: 0xffffff },
  { x: 36, z: -28, w: 8, d: 8, h: 3.4, tint: 0xe6dccb },
  { x: 8, z: 58, w: 10, d: 7, h: 3.2, tint: 0xc9c0ab },
  { x: -58, z: 30, w: 7, d: 6, h: 3.0, tint: 0xf0ead8 },
];
const CAR = { x: 18, z: 12, yaw: 0.5 };

const rand = (a, b) => a + Math.random() * (b - a);
const $ = (id) => document.getElementById(id);

/* ===========================================================
   RENDERER, CENA E CÂMERA
   =========================================================== */
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.95;
document.body.prepend(renderer.domElement);

const scene = new THREE.Scene();
scene.fog = new THREE.Fog(0xb9c4cc, 70, 340);

const camera = new THREE.PerspectiveCamera(72, innerWidth / innerHeight, 0.05, 500);
camera.position.set(0, EYE, 4);
scene.add(camera);

/* Pós-processamento: bloom no fogo e no sol, e acabamento com tone mapping */
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const bloom = new UnrealBloomPass(new THREE.Vector2(innerWidth, innerHeight), 0.35, 0.5, 0.92);
composer.addPass(bloom);
composer.addPass(new OutputPass());

/* Céu com dispersão atmosférica e sol baixo; o mesmo céu gera o reflexo dos metais */
const sunDir = new THREE.Vector3().setFromSphericalCoords(
  1, THREE.MathUtils.degToRad(62), THREE.MathUtils.degToRad(150)
);
const sky = new Sky();
sky.scale.setScalar(450000);
sky.material.uniforms.turbidity.value = 6;
sky.material.uniforms.rayleigh.value = 1.4;
sky.material.uniforms.mieCoefficient.value = 0.004;
sky.material.uniforms.sunPosition.value.copy(sunDir);
const envScene = new THREE.Scene();
envScene.add(sky);
const pmrem = new THREE.PMREMGenerator(renderer);
const envTex = pmrem.fromScene(envScene, 0, 0.1, 1000).texture;
setEnvMap(envTex);
scene.environment = envTex;
scene.add(sky);

const hemi = new THREE.HemisphereLight(0xcfe2ff, 0x3b3328, 0.45);
scene.add(hemi);
const sun = new THREE.DirectionalLight(0xffe0b0, 2.2);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
Object.assign(sun.shadow.camera, { left: -50, right: 50, top: 50, bottom: -50, near: 1, far: 260 });
sun.shadow.camera.updateProjectionMatrix();
sun.shadow.bias = -0.0004;
sun.shadow.normalBias = 0.03;
scene.add(sun, sun.target);

/* Chão com variação de terra e grama */
const groundTex = (() => {
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const g = c.getContext('2d');
  g.fillStyle = '#56643a';
  g.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 1400; i++) {
    const dark = Math.random() < 0.5;
    g.fillStyle = `rgba(${dark ? 40 : 90}, ${(60 + Math.random() * 60) | 0}, ${(30 + Math.random() * 30) | 0}, ${rand(0.2, 0.6)})`;
    g.fillRect(rand(0, 256), rand(0, 256), rand(1, 4), rand(1, 4));
  }
  for (let i = 0; i < 50; i++) {
    g.fillStyle = 'rgba(95, 75, 50, 0.25)';
    g.beginPath();
    g.arc(rand(0, 256), rand(0, 256), rand(4, 14), 0, Math.PI * 2);
    g.fill();
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(160, 160);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
})();
const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(420, 420),
  new THREE.MeshStandardMaterial({ map: groundTex, roughness: 1 })
);
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);

/* ===========================================================
   COLISÕES E ÁREAS
   =========================================================== */
const colliders = { boxes: [], circles: [] };
const blockers = [];    // objetos que bloqueiam tiros
const houseZones = [];
const doors = [];

function blocked(x, z, pad) {
  for (const b of colliders.boxes) {
    if (b.off) continue;
    if (x > b.minX - pad && x < b.maxX + pad && z > b.minZ - pad && z < b.maxZ + pad) return true;
  }
  for (const c of colliders.circles) if (Math.hypot(x - c.x, z - c.z) < c.r + pad) return true;
  return false;
}

function free(x, z) {
  if (Math.hypot(x, z) < 6 || Math.hypot(x - CAR.x, z - CAR.z) < 8) return false;
  return !houseZones.some((h) => Math.hypot(x - h.x, z - h.z) < h.r + 2);
}

/* Empurra o ponto p para fora de todos os obstáculos (raio R) */
function pushOut(p, R) {
  for (const b of colliders.boxes) {
    if (b.off) continue;
    const cx = Math.min(Math.max(p.x, b.minX), b.maxX);
    const cz = Math.min(Math.max(p.z, b.minZ), b.maxZ);
    const dx = p.x - cx, dz = p.z - cz, d = Math.hypot(dx, dz);
    if (d > 1e-6 && d < R) {
      p.x += (dx / d) * (R - d);
      p.z += (dz / d) * (R - d);
    }
  }
  for (const c of colliders.circles) {
    const dx = p.x - c.x, dz = p.z - c.z, d = Math.hypot(dx, dz), min = R + c.r;
    if (d < min) {
      if (d > 1e-6) { p.x = c.x + (dx / d) * min; p.z = c.z + (dz / d) * min; }
      else p.x = c.x + min;
    }
  }
}

function move(p, dx, dz, R) {
  p.x += dx; pushOut(p, R);
  p.z += dz; pushOut(p, R);
}

/* ===========================================================
   CASAS (paredes com porta, janelas, telhado, mesa)
   =========================================================== */
function buildHouse(H) {
  const g = new THREE.Group();
  const mat = makeWallMaterial(H.w, H.d, H.h, H.tint);
  const T = 0.2;
  const fz = H.z + H.d / 2;
  const side = (H.w - DOOR_W) / 2;

  const wall = (x, z, sx, sz) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(sx, H.h, sz), mat);
    m.position.set(x, H.h / 2, z);
    m.castShadow = m.receiveShadow = true;
    g.add(m);
    colliders.boxes.push({ minX: x - sx / 2, maxX: x + sx / 2, minZ: z - sz / 2, maxZ: z + sz / 2 });
  };
  wall(H.x, H.z - H.d / 2, H.w, T);
  wall(H.x - H.w / 2, H.z, T, H.d);
  wall(H.x + H.w / 2, H.z, T, H.d);
  wall(H.x - H.w / 2 + side / 2, fz, side, T);
  wall(H.x + H.w / 2 - side / 2, fz, side, T);

  const lintel = new THREE.Mesh(new THREE.BoxGeometry(DOOR_W, H.h - 2.45, T), mat);
  lintel.position.set(H.x, 2.45 + (H.h - 2.45) / 2, fz);
  lintel.castShadow = lintel.receiveShadow = true;
  g.add(lintel);

  const floor = new THREE.Mesh(new THREE.PlaneGeometry(H.w, H.d), makeFloorMaterial(H.w, H.d));
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(H.x, 0.03, H.z);
  floor.receiveShadow = true;

  const roof = createGableRoof(H.d, H.w, H.tint);
  roof.rotation.y = Math.PI / 2;
  roof.position.set(H.x, H.h, H.z);

  const decor = createHouseDecor(H.x, H.z, H.w, H.d, H.h);

  // Porta articulada: remove a porta decorativa aberta e cria uma na dobradiça
  const oldDoor = decor.group.children.find((c) => c.isGroup && Math.abs(c.rotation.y + 1.25) < 1e-6);
  if (oldDoor) decor.group.remove(oldDoor);
  const hingeX = H.x - DOOR_W / 2 + 0.02;
  const doorPivot = new THREE.Group();
  doorPivot.position.set(hingeX, 0, fz);
  const leaf = new THREE.Mesh(
    new THREE.BoxGeometry(DOOR_W - 0.04, 2.1, 0.05),
    new THREE.MeshStandardMaterial({ color: 0x6e4d30, roughness: 0.9 })
  );
  leaf.position.set((DOOR_W - 0.04) / 2, 1.05, 0);
  leaf.castShadow = leaf.receiveShadow = true;
  const knob = new THREE.Mesh(
    new THREE.SphereGeometry(0.03, 10, 8),
    new THREE.MeshStandardMaterial({ color: 0xb09a50, metalness: 0.9, roughness: 0.4 })
  );
  knob.position.set(DOOR_W - 0.2, 1.0, 0.04);
  doorPivot.add(leaf, knob);
  scene.add(doorPivot);
  blockers.push(doorPivot);
  const doorCol = { minX: hingeX - 0.02, maxX: hingeX + DOOR_W, minZ: fz - 0.06, maxZ: fz + 0.06, off: false };
  colliders.boxes.push(doorCol);
  doors.push({ pivot: doorPivot, col: doorCol, open: false, angle: 0, hx: hingeX, fz });

  const table = createTable();
  const tx = H.x + 0.6, tz = H.z - H.d * 0.18;
  table.position.set(tx, 0.03, tz);
  table.rotation.y = 0.3;
  colliders.circles.push({ x: tx, z: tz, r: 0.85 });

  scene.add(g, floor, roof, decor.group, table);
  for (const s of decor.solids) {
    const bb = new THREE.Box3().setFromObject(s);
    colliders.boxes.push({ minX: bb.min.x, maxX: bb.max.x, minZ: bb.min.z, maxZ: bb.max.z });
  }
  blockers.push(g, decor.group, roof);
  houseZones.push({ x: H.x, z: H.z, r: Math.max(H.w, H.d) / 2 });
}
HOUSES.forEach(buildHouse);

/* ===========================================================
   CARRO ABANDONADO
   =========================================================== */
const car = createCarModel();
car.group.position.set(CAR.x, 0, CAR.z);
car.group.rotation.y = CAR.yaw;
scene.add(car.group);
blockers.push(car.group);
car.group.updateMatrixWorld(true);
{
  const bb = new THREE.Box3().setFromObject(car.group);
  colliders.boxes.push({ minX: bb.min.x, maxX: bb.max.x, minZ: bb.min.z, maxZ: bb.max.z });
}

/* ===========================================================
   ÁRVORES E PEDRAS
   =========================================================== */
const treeSpots = [];
while (treeSpots.length < 260) {
  const x = rand(-MAP, MAP), z = rand(-MAP, MAP);
  if (!free(x, z)) continue;
  const s = rand(0.9, 1.5);
  treeSpots.push({ x, z, s, species: Math.random() < 0.55 ? 'pine' : 'oak' });
  colliders.circles.push({ x, z, r: 0.35 * s });
}
for (const m of createTreeMeshes(treeSpots).meshes) scene.add(m);

const rockSpots = [];
while (rockSpots.length < 140) {
  const x = rand(-MAP, MAP), z = rand(-MAP, MAP);
  if (!free(x, z)) continue;
  const s = rand(0.4, 1.6);
  rockSpots.push({ x, z, s });
  colliders.circles.push({ x, z, r: s * 0.85 });
}
scene.add(createRockMesh(rockSpots));

/* ===========================================================
   LOOT
   =========================================================== */
const lootList = [];
for (let i = 0; i < 55; i++) {
  let x, z;
  do {
    x = rand(-MAP * 0.9, MAP * 0.9);
    z = rand(-MAP * 0.9, MAP * 0.9);
  } while (!free(x, z) || blocked(x, z, 0.5));
  const type = LOOT_TYPES[Math.floor(Math.random() * LOOT_TYPES.length)];
  const g = makeLoot(type);
  g.position.set(x, LOOT_Y[type], z);
  g.rotation.y = rand(0, Math.PI * 2);
  g.userData.loot = type;
  scene.add(g);
  lootList.push(g);
}

/* ===========================================================
   ZUMBIS
   =========================================================== */
const zombies = [];
let spawnTimer = 5;

function spawnZombie() {
  let x, z, tries = 0;
  do {
    const a = rand(0, Math.PI * 2), d = rand(30, 65);
    x = camera.position.x + Math.cos(a) * d;
    z = camera.position.z + Math.sin(a) * d;
  } while (++tries < 20 && (!free(x, z) || blocked(x, z, 0.6)));

  const m = createZombieModel();
  const zb = {
    m, x, z, yaw: rand(-3.1, 3.1), state: 'wander', timer: 1, walking: false, wanderYaw: 0,
    hp: 100, cool: 0, alertUntil: 0, lost: 0, dead: false, deadT: 0, phase: rand(0, 6),
  };
  m.root.userData.zombie = zb;
  scene.add(m.root);
  zombies.push(zb);
}

function killZombie(zb) {
  zb.dead = true;
  zb.deadT = 0;
  kills++;
}

function updateZombie(zb, dt) {
  const dx = camera.position.x - zb.x, dz = camera.position.z - zb.z;
  const d = Math.hypot(dx, dz) || 1e-3;
  const facing = (Math.sin(zb.yaw) * dx + Math.cos(zb.yaw) * dz) / d;

  if (sprinting && d < 16 && Math.random() < dt * 0.4) zb.alertUntil = gameTime + 4;
  const seen = d < 14 && (facing > -0.1 || d < 3);
  const heard = zb.alertUntil > gameTime && d < 45;
  if (seen || heard) {
    zb.state = 'chase';
    zb.lost = 0;
  } else if (zb.state === 'chase' && (zb.lost += dt) > 6) {
    zb.state = 'wander';
  }

  let speed = 0, goal = zb.yaw;
  zb.cool -= dt;
  if (zb.state === 'chase') {
    goal = Math.atan2(dx, dz);
    if (d > 1.3) speed = 2.4;
    else if (zb.cool <= 0) { hurt(ZOMBIE_DMG); zb.cool = 1.1; }
  } else {
    if ((zb.timer -= dt) <= 0) {
      zb.wanderYaw = rand(-Math.PI, Math.PI);
      zb.timer = rand(2, 5);
      zb.walking = Math.random() < 0.6;
    }
    goal = zb.wanderYaw;
    speed = zb.walking ? 0.8 : 0;
  }

  const diff = Math.atan2(Math.sin(goal - zb.yaw), Math.cos(goal - zb.yaw));
  zb.yaw += diff * Math.min(1, dt * 5);

  const p = { x: zb.x, z: zb.z };
  move(p, Math.sin(zb.yaw) * speed * dt, Math.cos(zb.yaw) * speed * dt, 0.3);
  zb.x = p.x;
  zb.z = p.z;

  /* Animação: pernas, joelhos, braços (estendidos ao perseguir) e cabeça */
  zb.phase += dt * (speed > 0 ? (zb.state === 'chase' ? 7 : 4) : 1.5);
  const s = Math.sin(zb.phase), m = zb.m;
  const chase = zb.state === 'chase';
  m.legL.rotation.x = s * 0.5;
  m.legR.rotation.x = -s * 0.5;
  m.kneeL.rotation.x = Math.max(0, -s) * 0.6;
  m.kneeR.rotation.x = Math.max(0, s) * 0.6;
  const arm = chase ? -1.35 : -0.2, swing = chase ? 0.1 : 0.25;
  m.armL.rotation.x = arm + s * swing;
  m.armR.rotation.x = arm - s * swing;
  m.headPivot.rotation.x = chase ? 0.35 : 0.2;
  m.root.position.set(zb.x, 0, zb.z);
  m.root.rotation.y = zb.yaw;
}

function updateZombies(dt) {
  spawnTimer -= dt;
  const alive = zombies.filter((z) => !z.dead).length;
  if (spawnTimer <= 0 && alive < MAX_ZOMBIES) {
    spawnZombie();
    spawnTimer = 5;
  }
  for (let i = zombies.length - 1; i >= 0; i--) {
    const zb = zombies[i];
    if (zb.dead) {
      zb.deadT += dt;
      if (zb.deadT > 25) {
        scene.remove(zb.m.root);
        zombies.splice(i, 1);
      } else {
        zb.m.root.rotation.x = -Math.PI / 2 * Math.min(1, zb.deadT * 2.5);
      }
      continue;
    }
    updateZombie(zb, dt);
  }
}

/* ===========================================================
   ARMA, MIRA E INTERAÇÃO
   =========================================================== */
const pistol = createPistolModel();
pistol.group.position.set(0.2, -0.22, -0.42);
camera.add(pistol.group);

const flashTex = (() => {
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const g = c.getContext('2d');
  const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  gr.addColorStop(0, '#ffffff');
  gr.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gr;
  g.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(c);
})();
const flash = new THREE.Sprite(new THREE.SpriteMaterial({
  map: flashTex, color: 0xffb347, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false,
}));
flash.position.copy(pistol.muzzle);
flash.scale.setScalar(0.2);
flash.visible = false;
pistol.group.add(flash);

const controls = new PointerLockControls(camera, document.body);
const keys = {};
const items = { food: 0, water: 0, bandage: 0, ammo: 0, wood: 3 };   // ammo = reserva
const ray = new THREE.Raycaster();
const center = new THREE.Vector2(0, 0);

let gameTime = 0, sprinting = false, dead = false, invOpen = false;
let mag = MAG, lastShot = -1, recoil = 0, meleeT = 0, flashT = 0;
let health = 100, hunger = 100, thirst = 100, stamina = 100, damageFlash = 0, kills = 0;
let lootTarget = null, vy = 0, grounded = true;
let temp = 100, dayT = 0.2, daylight = 1, fire = null, tremX = 0, tremY = 0;

const fwd = new THREE.Vector3(), right = new THREE.Vector3(), dir = new THREE.Vector3();
const UP = new THREE.Vector3(0, 1, 0);

function findTagged(obj, key) {
  for (let o = obj; o; o = o.parent) if (o.userData[key] !== undefined) return o;
  return null;
}

function toast(msg) {
  const el = $('toast');
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => el.classList.remove('show'), 1800);
}

function refreshInv() {
  for (const k in items) $('inv-' + k).textContent = items[k];
}

function hurt(n) {
  if (dead) return;
  health -= n;
  damageFlash = 1;
  if (health <= 0) die();
}

function die() {
  dead = true;
  health = 0;
  controls.unlock();
  $('death').classList.remove('hidden');
}

/* Hitbox por zumbi: caixa do corpo e caixa da cabeça, independentes da malha */
function zombieHit(zb) {
  if (zb.dead) return null;
  const tmp = new THREE.Vector3();
  const head = new THREE.Box3(new THREE.Vector3(zb.x - 0.2, 1.45, zb.z - 0.2), new THREE.Vector3(zb.x + 0.2, 1.9, zb.z + 0.2));
  const body = new THREE.Box3(new THREE.Vector3(zb.x - 0.3, 0, zb.z - 0.3), new THREE.Vector3(zb.x + 0.3, 1.45, zb.z + 0.3));
  let best = null;
  for (const [box, isHead] of [[head, true], [body, false]]) {
    if (ray.ray.intersectBox(box, tmp)) {
      const dist = ray.ray.origin.distanceTo(tmp);
      if (!best || dist < best.dist) best = { dist, head: isHead };
    }
  }
  return best;
}

function attack() {
  if (dead || invOpen || !controls.isLocked) return;
  if (mag <= 0) return melee();
  if (gameTime - lastShot < 0.25) return;
  lastShot = gameTime;
  mag--;
  recoil = 1;
  flashT = 0.05;

  /* O tiro atrai zumbis próximos */
  for (const zb of zombies) {
    if (!zb.dead && Math.hypot(zb.x - camera.position.x, zb.z - camera.position.z) < 45 && Math.random() < 0.7) {
      zb.alertUntil = gameTime + 8;
    }
  }

  ray.setFromCamera(center, camera);
  const wall = ray.intersectObjects(blockers, true)[0];
  let limit = Math.min(200, wall ? wall.distance : Infinity);
  let target = null;
  for (const zb of zombies) {
    const hit = zombieHit(zb);
    if (hit && hit.dist < limit) { target = { zb, head: hit.head }; limit = hit.dist; }
  }

  if (target) {
    const { zb, head } = target;
    if (head) {
      killZombie(zb);
      toast('Tiro na cabeça!');
    } else {
      zb.hp -= SHOT_DMG;
      zb.state = 'chase';
      zb.alertUntil = gameTime + 8;
      if (zb.hp <= 0) { killZombie(zb); toast('Zumbi eliminado'); }
      else toast('Acertou!');
    }
  }
}

function melee() {
  meleeT = 0.3;
  const look = camera.getWorldDirection(new THREE.Vector3());
  const lookLen = Math.hypot(look.x, look.z) || 1;
  for (const zb of zombies) {
    if (zb.dead) continue;
    const dx = zb.x - camera.position.x, dz = zb.z - camera.position.z;
    const d = Math.hypot(dx, dz) || 1e-3;
    const cos = (dx * look.x + dz * look.z) / (d * lookLen);
    if (d < 2 && cos > 0.3) {
      zb.hp -= MELEE_DMG;
      zb.alertUntil = gameTime + 8;
      if (zb.hp <= 0) { killZombie(zb); toast('Golpe fatal!'); }
      else toast('Golpe!');
      return;
    }
  }
}

function reload() {
  if (dead || invOpen) return;
  const take = Math.min(MAG - mag, items.ammo);
  if (take <= 0) return toast(mag >= MAG ? 'Pente já está cheio.' : 'Sem munição reserva.');
  items.ammo -= take;
  mag += take;
  refreshInv();
  toast('Recarregou.');
}

function useItem(type) {
  if (dead) return;
  if (items[type] <= 0) return toast(`Sem ${LOOT_NAMES[type]}.`);
  if (type === 'bandage' && health >= 100) return toast('Você não precisa de bandagem agora.');
  items[type]--;
  if (type === 'food') { hunger = Math.min(100, hunger + 40); toast('Você comeu feijão.'); }
  if (type === 'water') { thirst = Math.min(100, thirst + 45); toast('Você bebeu água.'); }
  if (type === 'bandage') { health = Math.min(100, health + 35); toast('Você se enfaixou.'); }
  refreshInv();
}

function updatePrompt() {
  ray.setFromCamera(center, camera);
  ray.far = 2.6;
  const hit = ray.intersectObjects(lootList, true)[0];
  ray.far = Infinity;
  const g = hit && findTagged(hit.object, 'loot');
  lootTarget = g || null;
  const door = lootTarget ? null : nearestDoor();
  $('prompt').textContent = lootTarget
    ? `[E] Pegar ${LOOT_NAMES[lootTarget.userData.loot]}`
    : door ? (door.open ? '[E] Fechar porta' : '[E] Abrir porta') : '';
}

function pickup() {
  if (!lootTarget || dead || invOpen) return;
  const type = lootTarget.userData.loot;
  items[type] += type === 'ammo' ? 6 : 1;
  scene.remove(lootTarget);
  lootList.splice(lootList.indexOf(lootTarget), 1);
  lootTarget = null;
  refreshInv();
  toast(`Pegou: ${LOOT_NAMES[type]}`);
}

function toggleInv() {
  if (dead) return;
  invOpen = !invOpen;
  $('inventory').classList.toggle('hidden', !invOpen);
  if (invOpen) {
    refreshInv();
    controls.unlock();
  } else {
    controls.lock();
  }
}

/* ===========================================================
   JOGADOR E SOBREVIVÊNCIA
   =========================================================== */
function updatePlayer(dt) {
  const active = controls.isLocked && !invOpen;

  camera.getWorldDirection(fwd);
  fwd.y = 0;
  fwd.normalize();
  right.crossVectors(fwd, UP);

  dir.set(0, 0, 0);
  if (active) {
    if (keys.KeyW) dir.add(fwd);
    if (keys.KeyS) dir.sub(fwd);
    if (keys.KeyD) dir.add(right);
    if (keys.KeyA) dir.sub(right);
  }
  const moving = dir.lengthSq() > 0;
  if (moving) dir.normalize();

  sprinting = active && moving && (keys.ShiftLeft || keys.ShiftRight) && stamina > 1;
  stamina = sprinting ? Math.max(0, stamina - 22 * dt) : Math.min(100, stamina + 14 * dt);

  const step = (sprinting ? 7.5 : 4.2) * dt;
  const p = { x: camera.position.x, z: camera.position.z };
  move(p, dir.x * step, dir.z * step, RADIUS);
  camera.position.x = p.x;
  camera.position.z = p.z;

  if (active && keys.Space && grounded) {
    vy = 6.2;
    grounded = false;
  }
  vy -= 18 * dt;
  camera.position.y += vy * dt;
  if (camera.position.y <= EYE) {
    camera.position.y = EYE;
    vy = 0;
    grounded = true;
  }
  return moving;
}

function updateSurvival(dt) {
  const k = sprinting ? 1.6 : 1;   // correr acelera fome e sede
  hunger = Math.max(0, hunger - 0.25 * k * dt);
  thirst = Math.max(0, thirst - 0.4 * k * dt);
  if (hunger === 0 || thirst === 0) {
    health -= 2 * dt;
    if (health <= 0) die();
  } else if (hunger > 50 && thirst > 50) {
    health = Math.min(100, health + 0.6 * dt);
  }
}

/* ---------- ciclo dia/noite, neblina e fogueira ---------- */
const DAY_SEC = 240;                       // duração de um dia completo, em segundos
const DAY_FOG = new THREE.Color(0xb9c4cc);
const NIGHT_FOG = new THREE.Color(0x0b1119);

function updateEnv(dt) {
  dayT = (dayT + dt / DAY_SEC) % 1;
  const a = dayT * Math.PI * 2;
  sunDir.set(Math.cos(a) * 0.7, Math.sin(a), 0.5).normalize();
  daylight = THREE.MathUtils.clamp(sunDir.y * 2.5, 0, 1);
  sun.intensity = daylight * 2.4;
  hemi.intensity = 0.08 + daylight * 0.37;
  sky.material.uniforms.sunPosition.value.copy(sunDir);
  scene.fog.color.lerpColors(NIGHT_FOG, DAY_FOG, daylight);
  if (fire) fire.update(dt);
}

/* Temperatura corporal: cai mais à noite e ao correr; a fogueira aquece; frio causa tremor e perda de vida */
function updateMetabolism(dt) {
  const warm = fire && Math.hypot(camera.position.x - fire.base.x, camera.position.z - fire.base.z) < 4.5;
  temp -= (0.12 + (sprinting ? 0.25 : 0) + (1 - daylight) * 0.15) * dt;
  if (warm) temp += 3 * dt;
  temp = THREE.MathUtils.clamp(temp, 0, 100);

  const cold = Math.max(0, (35 - temp) / 35);
  camera.position.x -= tremX;
  camera.position.y -= tremY;
  tremX = (Math.random() - 0.5) * 0.02 * cold;
  tremY = (Math.random() - 0.5) * 0.02 * cold;
  camera.position.x += tremX;
  camera.position.y += tremY;

  if (temp <= 0) {
    health -= 1.2 * dt;
    if (health <= 0) die();
  }
}

function lightFire() {
  if (dead || invOpen) return;
  if (fire) return toast('Já existe uma fogueira.');
  if (items.wood < 1) return toast('Você precisa de madeira.');
  items.wood--;
  fire = createFire(scene, camera.position.x + fwd.x * 1.5, camera.position.z + fwd.z * 1.5);
  refreshInv();
  toast('Fogueira acesa.');
}

/* Madeira usa modelo próprio; os demais itens vêm do models.js */
function makeLoot(type) {
  if (type !== 'wood') return createLootModel(type);
  const g = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({ color: 0x6b4a2b, roughness: 0.9 });
  for (let i = 0; i < 3; i++) {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.4, 10), mat);
    m.rotation.z = Math.PI / 2;
    m.position.set((i - 1) * 0.06, 0.035, 0);
    m.castShadow = true;
    g.add(m);
  }
  return g;
}

/* ---------- portas ---------- */
function nearestDoor() {
  let best = null, bestD = 2.2;
  for (const d of doors) {
    const cx = d.hx + DOOR_W / 2, cz = d.fz;
    const dist = Math.hypot(camera.position.x - cx, camera.position.z - cz) || 1e-3;
    const facing = ((cx - camera.position.x) * fwd.x + (cz - camera.position.z) * fwd.z) / dist;
    if (dist < bestD && facing > 0.3) { best = d; bestD = dist; }
  }
  return best;
}

function toggleDoor() {
  if (dead || invOpen) return;
  const d = nearestDoor();
  if (d) d.open = !d.open;
}

function updateDoors(dt) {
  for (const d of doors) {
    const target = d.open ? -1.7 : 0;   // abre para fora, em direção ao jogador
    d.angle += (target - d.angle) * Math.min(1, dt * 6);
    d.pivot.rotation.y = d.angle;
    d.col.off = d.angle < -0.6;          // passagem livre só com a porta aberta
  }
}

/* ---------- movimento em primeira pessoa: balanço, aterrissagem e sway com o mouse ---------- */
let bobT = 0, landDip = 0, swayX = 0, swayY = 0, mouseDX = 0, mouseDY = 0, wasGrounded = true;
document.addEventListener('mousemove', (e) => {
  if (controls.isLocked) { mouseDX += e.movementX; mouseDY += e.movementY; }
});

function updateFirstPerson(dt, moving) {
  bobT += dt * (moving && grounded ? (sprinting ? 13 : 8.5) : 0);
  if (grounded && !wasGrounded) landDip = 0.06;     // aterrissagem
  wasGrounded = grounded;
  landDip = Math.max(0, landDip - dt * 0.6);
  const tx = THREE.MathUtils.clamp(-mouseDX * 0.0006, -0.04, 0.04);
  const ty = THREE.MathUtils.clamp(-mouseDY * 0.0006, -0.03, 0.03);
  swayX += (tx - swayX) * Math.min(1, dt * 10);
  swayY += (ty - swayY) * Math.min(1, dt * 10);
  mouseDX = 0;
  mouseDY = 0;
}

function updateWeapon(dt, moving) {
  recoil = Math.max(0, recoil - dt * 9);
  meleeT = Math.max(0, meleeT - dt);
  flashT = Math.max(0, flashT - dt);
  flash.visible = flashT > 0;
  const bob = moving && grounded ? Math.sin(bobT) * (sprinting ? 0.014 : 0.008) : 0;
  pistol.group.position.set(0.2 + swayX, -0.22 + bob + swayY - landDip, -0.42 + recoil * 0.03);
  const swing = meleeT > 0 ? Math.sin((1 - meleeT / 0.3) * Math.PI) * 0.9 : 0;
  pistol.group.rotation.set(recoil * 0.12 - swing, 0, 0);
}

/* ===========================================================
   HUD
   =========================================================== */
function updateHUD() {
  $('bar-health').style.width = health + '%';
  $('bar-stamina').style.width = stamina + '%';
  $('bar-hunger').style.width = hunger + '%';
  $('bar-thirst').style.width = thirst + '%';
  $('bar-temp').style.width = temp + '%';
  $('ammo').textContent = `${mag} / ${items.ammo}`;
  $('kills').textContent = kills;
  $('damage').style.opacity = damageFlash;
}

/* ===========================================================
   EVENTOS
   =========================================================== */
controls.addEventListener('lock', () => $('start').classList.add('hidden'));
controls.addEventListener('unlock', () => {
  if (!dead && !invOpen) $('start').classList.remove('hidden');
});
$('start-btn').addEventListener('click', () => controls.lock());
$('restart').addEventListener('click', () => location.reload());

document.addEventListener('mousedown', (e) => {
  if (e.button === 0) attack();
});

document.addEventListener('keydown', (e) => {
  if (e.code === 'Space' || e.code === 'Tab') e.preventDefault();
  keys[e.code] = true;
  if (e.repeat) return;
  if (e.code === 'KeyE') { if (lootTarget) pickup(); else toggleDoor(); }
  else if (e.code === 'KeyR') reload();
  else if (e.code === 'Tab') toggleInv();
  else if (e.code === 'Digit1') useItem('food');
  else if (e.code === 'Digit2') useItem('water');
  else if (e.code === 'Digit3') useItem('bandage');
  else if (e.code === 'KeyF') lightFire();
});
document.addEventListener('keyup', (e) => { keys[e.code] = false; });

window.addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
  composer.setSize(innerWidth, innerHeight);
});

/* ===========================================================
   LOOP PRINCIPAL
   =========================================================== */
for (let i = 0; i < 10; i++) spawnZombie();
refreshInv();

const clock = new THREE.Clock();
renderer.setAnimationLoop(() => {
  const dt = Math.min(clock.getDelta(), 0.05);
  gameTime += dt;

  const moving = dead ? false : updatePlayer(dt);
  if (!dead) updateSurvival(dt);
  updateFirstPerson(dt, moving);
  updateWeapon(dt, moving);
  updateZombies(dt);
  for (const g of lootList) g.rotation.y += dt * 0.8;
  updatePrompt();

  sun.position.set(camera.position.x + sunDir.x * 90, sunDir.y * 90, camera.position.z + sunDir.z * 90);
  sun.target.position.set(camera.position.x, 0, camera.position.z);

  damageFlash = Math.max(0, damageFlash - dt * 1.5);
  if (!dead) updateMetabolism(dt);
  updateEnv(dt);
  updateDoors(dt);
  updateHUD();
  composer.render();
});