import * as THREE from 'three';
import { mergeGeometries, mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

/* ===========================================================
   MODELAGEM PROCEDURAL
   Tudo aqui é gerado por código (sem arquivos externos):
   geometrias arredondadas, texturas desenhadas em canvas e
   materiais com reflexo. Para usar modelos 3D reais (.glb),
   basta trocar as funções create...Model por um GLTFLoader.
   =========================================================== */

let ENV = null;
export function setEnvMap(texture) {
  ENV = texture;
}

const rand = (a, b) => a + Math.random() * (b - a);
const randInt = (a, b) => Math.floor(rand(a, b + 1));
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const clamp = THREE.MathUtils.clamp;
const dummy = new THREE.Object3D();

/* ---------- utilidades de textura ---------- */
function canvasTexture(w, h, draw, repX = 1, repY = 1, srgb = true) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(repX, repY);
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

const cache = {};
const cached = (key, fn) => (cache[key] ??= fn());

function speckle(ctx, w, h, count, rgb, alphaMin, alphaMax, sizeMin, sizeMax) {
  for (let i = 0; i < count; i++) {
    ctx.fillStyle = `rgba(${rgb}, ${rand(alphaMin, alphaMax)})`;
    const s = rand(sizeMin, sizeMax);
    ctx.fillRect(rand(0, w), rand(0, h), s, s);
  }
}

const dirtTexture = () => cached('dirt', () =>
  canvasTexture(128, 128, (ctx, w, h) => {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 260; i++) {
      ctx.fillStyle = `rgba(40, 30, 20, ${rand(0.04, 0.18)})`;
      ctx.beginPath();
      ctx.arc(rand(0, w), rand(0, h), rand(2, 12), 0, 6.283);
      ctx.fill();
    }
    speckle(ctx, w, h, 500, '255,255,255', 0.05, 0.2, 1, 2);
  }));

const woodTexture = () => cached('wood', () =>
  canvasTexture(64, 128, (ctx, w, h) => {
    ctx.fillStyle = '#8a6a4a';
    ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 90; i++) {
      ctx.fillStyle = `rgba(${randInt(30, 70)}, ${randInt(20, 45)}, 10, ${rand(0.08, 0.3)})`;
      ctx.fillRect(0, rand(0, h), w, rand(0.5, 2));
    }
  }));

const barkTexture = () => cached('bark', () =>
  canvasTexture(64, 256, (ctx, w, h) => {
    ctx.fillStyle = '#5a4632';
    ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 160; i++) {
      const dark = Math.random() < 0.6;
      ctx.fillStyle = dark ? `rgba(25, 16, 8, ${rand(0.15, 0.5)})` : `rgba(130, 105, 80, ${rand(0.1, 0.3)})`;
      ctx.fillRect(rand(0, w), rand(0, h), rand(1, 3), rand(20, 90));
    }
  }, 2, 3));

const rockTexture = () => cached('rock', () =>
  canvasTexture(128, 128, (ctx, w, h) => {
    ctx.fillStyle = '#9a9a94';
    ctx.fillRect(0, 0, w, h);
    speckle(ctx, w, h, 900, '60,60,58', 0.1, 0.4, 1, 3);
    speckle(ctx, w, h, 500, '210,210,200', 0.08, 0.3, 1, 2);
    ctx.strokeStyle = 'rgba(30,30,28,0.35)';
    for (let i = 0; i < 9; i++) {
      ctx.beginPath();
      ctx.moveTo(rand(0, w), rand(0, h));
      ctx.lineTo(rand(0, w), rand(0, h));
      ctx.stroke();
    }
  }));

const sidingTexture = () => cached('siding', () =>
  canvasTexture(256, 256, (ctx, w, h) => {
    ctx.fillStyle = '#d6cdb9';
    ctx.fillRect(0, 0, w, h);
    for (let y = 0; y < h; y += 32) {
      ctx.fillStyle = 'rgba(0,0,0,0.35)';
      ctx.fillRect(0, y, w, 2);
      ctx.fillStyle = 'rgba(255,255,255,0.12)';
      ctx.fillRect(0, y + 2, w, 3);
    }
    for (let i = 0; i < 400; i++) {
      ctx.fillStyle = `rgba(60, 45, 30, ${rand(0.03, 0.12)})`;
      ctx.fillRect(rand(0, w), rand(0, h), rand(1, 2), rand(6, 28));
    }
    for (let i = 0; i < 14; i++) {
      ctx.fillStyle = `rgba(70, 55, 40, ${rand(0.06, 0.18)})`;
      ctx.fillRect(rand(0, w), rand(0, h), rand(15, 60), rand(10, 40));
    }
  }));

const shingleTexture = () => cached('shingle', () =>
  canvasTexture(128, 128, (ctx, w, h) => {
    ctx.fillStyle = '#4b3f3a';
    ctx.fillRect(0, 0, w, h);
    for (let row = 0; row < 8; row++) {
      const y = row * 16;
      const off = row % 2 ? 8 : 0;
      for (let x = -8; x < w; x += 16) {
        const v = randInt(45, 80);
        ctx.fillStyle = `rgb(${v + 8}, ${v}, ${v - 4})`;
        ctx.fillRect(x + off, y, 15, 15);
      }
    }
  }, 0.5, 0.5));

const brickTexture = () => cached('brick', () =>
  canvasTexture(128, 128, (ctx, w, h) => {
    ctx.fillStyle = '#a89c8a';
    ctx.fillRect(0, 0, w, h);
    for (let row = 0; row < 16; row++) {
      const off = row % 2 ? 8 : 0;
      for (let x = -16; x < w; x += 16) {
        ctx.fillStyle = `rgb(${randInt(110, 150)}, ${randInt(50, 75)}, ${randInt(38, 55)})`;
        ctx.fillRect(x + off + 1, row * 8 + 1, 14, 6);
      }
    }
  }));

const plankFloorTexture = () => cached('floor', () =>
  canvasTexture(256, 256, (ctx, w, h) => {
    for (let x = 0; x < w; x += 32) {
      ctx.fillStyle = `rgb(${randInt(95, 125)}, ${randInt(70, 90)}, ${randInt(48, 62)})`;
      ctx.fillRect(x, 0, 32, h);
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(x, 0, 1.5, h);
    }
    for (let i = 0; i < 300; i++) {
      ctx.fillStyle = `rgba(20, 12, 6, ${rand(0.05, 0.2)})`;
      ctx.fillRect(rand(0, w), rand(0, h), 1, rand(8, 40));
    }
  }));

const paintTexture = () => cached('paint', () =>
  canvasTexture(256, 256, (ctx, w, h) => {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 40; i++) {
      ctx.fillStyle = `rgba(${randInt(90, 140)}, ${randInt(45, 70)}, 20, ${rand(0.15, 0.5)})`;
      ctx.beginPath();
      ctx.ellipse(rand(0, w), rand(0, h), rand(4, 26), rand(3, 16), rand(0, 3), 0, 6.283);
      ctx.fill();
    }
    for (let i = 0; i < 700; i++) {
      ctx.fillStyle = `rgba(70, 55, 40, ${rand(0.05, 0.2)})`;
      ctx.fillRect(rand(0, w), rand(0, h), rand(1, 4), rand(1, 4));
    }
    for (let i = 0; i < 25; i++) {
      ctx.fillStyle = `rgba(30, 25, 20, ${rand(0.08, 0.2)})`;
      ctx.fillRect(rand(0, w), rand(0, h), 2, rand(10, 50));
    }
  }, 0.35, 0.35));

const glowTexture = () => cached('glow', () =>
  canvasTexture(64, 64, (ctx, w, h) => {
    const g = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
    g.addColorStop(0, 'rgba(255,255,255,1)');
    g.addColorStop(0.4, 'rgba(255,255,255,0.35)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  }));

/* ---------- geometrias compartilhadas ---------- */
const geoCache = new Map();
function G(kind, ...args) {
  const key = kind + args.join(',');
  if (!geoCache.has(key)) {
    let g;
    switch (kind) {
      case 'cap': g = new THREE.CapsuleGeometry(args[0], args[1], 6, 12); break;
      case 'sph': g = new THREE.SphereGeometry(args[0], 16, 12); break;
      case 'box': g = new THREE.BoxGeometry(...args); break;
      case 'cyl': g = new THREE.CylinderGeometry(...args); break;
      case 'hemi': g = new THREE.SphereGeometry(args[0], 16, 10, 0, Math.PI * 2, 0, Math.PI * 0.55); break;
      default: throw new Error('geometria desconhecida: ' + kind);
    }
    geoCache.set(key, g);
  }
  return geoCache.get(key);
}

function noise3(x, y, z) {
  return Math.sin(x * 1.7 + y * 2.3) * Math.cos(z * 1.9 - x * 1.1) + 0.5 * Math.sin(y * 3.7 + z * 2.9 + 1.3);
}

/* ===========================================================
   ZUMBI / PERSONAGEM HUMANOIDE
   Corpo com cápsulas e esferas, articulações (ombro, cotovelo,
   quadril, joelho), cabeça com rosto, mandíbula, cabelo, roupas
   rasgadas, mochila, sangue e variações aleatórias.
   =========================================================== */
const bloodMat = () => cached('blood', () => new THREE.MeshStandardMaterial({ color: 0x5a0c0c, roughness: 0.35 }));

export function createZombieModel() {
  const root = new THREE.Group();
  root.rotation.order = 'YXZ';
  root.scale.set(rand(0.95, 1.08), rand(0.95, 1.07), rand(0.95, 1.08));
  const parts = [];
  const dirt = dirtTexture();

  const skinColor = new THREE.Color().setHSL(rand(0.06, 0.22), rand(0.12, 0.3), rand(0.5, 0.68));
  const skin = new THREE.MeshStandardMaterial({ color: skinColor, map: dirt, roughness: 0.72 });
  const cloth = (c) => new THREE.MeshStandardMaterial({ color: c, map: dirt, roughness: 0.95 });
  const shirtColor = new THREE.Color().setHSL(Math.random(), rand(0.1, 0.45), rand(0.2, 0.45));
  const shirt = cloth(shirtColor);
  const pants = cloth(pick([0x2b3445, 0x3a3a3f, 0x4a4233, 0x23272e, 0x39485c]));
  const shoe = new THREE.MeshStandardMaterial({ color: 0x1b1b1d, roughness: 0.8 });
  const dark = new THREE.MeshStandardMaterial({ color: 0x120a0a, roughness: 1 });
  const eyeMat = new THREE.MeshStandardMaterial({ color: 0xd9d3a3, emissive: 0x553300, emissiveIntensity: 0.7, roughness: 0.4 });
  const blood = bloodMat();
  const outfit = pick(['tee', 'hoodie', 'jacket']);

  const add = (parent, geo, mat, x, y, z, o = {}) => {
    const m = new THREE.Mesh(geo, mat);
    m.position.set(x, y, z);
    m.castShadow = o.cast ?? true;
    m.userData.isHead = !!o.head;
    if (o.scale) m.scale.set(...o.scale);
    if (o.rot) m.rotation.set(...o.rot);
    parts.push(m);
    parent.add(m);
    return m;
  };

  /* Tronco */
  const spine = new THREE.Group();
  spine.position.y = 0.92;
  root.add(spine);

  add(root, G('sph', 0.16), pants, 0, 0.9, 0, { scale: [1.15, 0.75, 0.85] });
  add(spine, G('cap', 0.16, 0.23), shirt, 0, 0.28, 0, { scale: [1.2, 1, 0.72] });
  add(spine, G('cyl', 0.05, 0.056, 0.1, 10), skin, 0, 0.57, 0);
  if (outfit !== 'jacket') {
    add(spine, new THREE.TorusGeometry(0.075, 0.02, 8, 16), shirt, 0, 0.53, 0, { rot: [Math.PI / 2, 0, 0], cast: false });
  }

  // Barra rasgada da camisa e manchas de sangue (cada grupo vira uma única malha)
  {
    const hem = [];
    for (let i = 0; i < 9; i++) {
      const a = (i / 9) * Math.PI * 2;
      const hh = rand(0.08, 0.17);
      const g = new THREE.BoxGeometry(0.07, hh, 0.012);
      g.translate(0, -hh / 2, 0);
      dummy.position.set(Math.cos(a) * 0.2, 0.05, Math.sin(a) * 0.125);
      dummy.rotation.set(0, Math.atan2(Math.cos(a), Math.sin(a)), rand(-0.25, 0.25));
      dummy.updateMatrix();
      g.applyMatrix4(dummy.matrix);
      hem.push(g);
    }
    add(spine, mergeGeometries(hem), shirt, 0, 0, 0, { cast: false });

    const stains = [];
    const n = randInt(3, 6);
    for (let i = 0; i < n; i++) {
      const a = rand(-1.6, 1.6) + Math.PI / 2;
      const g = new THREE.SphereGeometry(1, 8, 6);
      dummy.position.set(Math.cos(a) * 0.19, rand(0.12, 0.5), Math.sin(a) * 0.118);
      dummy.rotation.set(0, Math.atan2(Math.cos(a), Math.sin(a)), 0);
      dummy.scale.set(rand(0.03, 0.07), rand(0.04, 0.1), 0.008);
      dummy.updateMatrix();
      g.applyMatrix4(dummy.matrix);
      stains.push(g);
    }
    dummy.scale.set(1, 1, 1);
    add(spine, mergeGeometries(stains), blood, 0, 0, 0, { cast: false });
  }

  if (Math.random() < 0.25) {
    add(spine, new RoundedBoxGeometry(0.3, 0.38, 0.14, 2, 0.04), cloth(pick([0x2a3a2a, 0x3a2a2a, 0x2a2f3a, 0x4a4030])), 0, 0.3, -0.17);
  }
  if (Math.random() < 0.6) {
    add(spine, G('sph', 0.03), blood, 0.05, 0.55, 0.05, { scale: [1, 1, 0.5], cast: false });
  }

  /* Cabeça */
  const headPivot = new THREE.Group();
  headPivot.position.set(0, 0.62, 0);
  headPivot.rotation.x = 0.2;
  spine.add(headPivot);

  add(headPivot, G('sph', 0.105), skin, 0, 0.12, 0, { head: true, scale: [0.92, 1.12, 1.0] });
  add(headPivot, G('sph', 0.026), skin, -0.098, 0.12, 0, { head: true, scale: [0.5, 1, 0.8], cast: false });
  add(headPivot, G('sph', 0.026), skin, 0.098, 0.12, 0, { head: true, scale: [0.5, 1, 0.8], cast: false });
  add(headPivot, G('sph', 0.02), skin, 0, 0.11, 0.108, { head: true, scale: [0.8, 1.2, 1.3], cast: false });
  for (const sx of [-1, 1]) {
    add(headPivot, G('sph', 0.03), dark, sx * 0.042, 0.14, 0.088, { head: true, scale: [1, 0.8, 0.5], cast: false });
    add(headPivot, G('sph', 0.018), eyeMat, sx * 0.042, 0.14, 0.097, { head: true, cast: false });
  }
  add(headPivot, G('box', 0.06, 0.012, 0.012), new THREE.MeshStandardMaterial({ color: 0xcfc9b0, roughness: 0.6 }), 0, 0.068, 0.098, { head: true, cast: false });

  const jaw = new THREE.Group();
  jaw.position.set(0, 0.065, 0);
  headPivot.add(jaw);
  add(jaw, G('sph', 0.07), skin, 0, -0.025, 0.035, { head: true, scale: [1, 0.6, 0.95], cast: false });
  add(jaw, G('box', 0.07, 0.012, 0.06), dark, 0, 0.005, 0.05, { head: true, cast: false });
  add(jaw, G('sph', 0.025), blood, 0, -0.05, 0.07, { head: true, scale: [1.4, 1, 0.7], cast: false });

  // Cabelo, cabelo longo ou boné
  const hairMat = new THREE.MeshStandardMaterial({ color: pick([0x1a1410, 0x3a2a1a, 0x6b5030, 0x8a8a84, 0x2a1a10]), roughness: 0.9 });
  const roll = Math.random();
  if (roll < 0.55) {
    add(headPivot, G('hemi', 0.108), hairMat, 0, 0.125, -0.004, { head: true, scale: [0.95, 1.15, 1.04], cast: false });
    if (Math.random() < 0.35) {
      add(headPivot, G('cap', 0.07, 0.12), hairMat, 0, 0.04, -0.06, { head: true, scale: [1.2, 1, 0.7], cast: false });
    }
  } else if (roll < 0.7) {
    const hat = cloth(pick([0x1f2a44, 0x7a1e1e, 0x2b2b2b, 0x3c4a2f]));
    add(headPivot, G('hemi', 0.112), hat, 0, 0.13, -0.004, { head: true, scale: [0.95, 1.12, 1.04], cast: false });
    add(headPivot, new THREE.CylinderGeometry(0.115, 0.115, 0.01, 16, 1, false, -Math.PI / 2, Math.PI), hat, 0, 0.175, 0.03, { head: true, cast: false });
  }

  /* Braços (ombro -> cotovelo -> mão) */
  const arms = {};
  for (const side of [-1, 1]) {
    const shoulder = new THREE.Group();
    shoulder.position.set(side * 0.215, 0.47, 0);
    spine.add(shoulder);
    add(shoulder, G('sph', 0.062), shirt, 0, 0, 0);
    add(shoulder, G('cap', 0.05, 0.2), shirt, 0, -0.15, 0);

    const elbow = new THREE.Group();
    elbow.position.y = -0.3;
    shoulder.add(elbow);
    add(elbow, G('cap', 0.043, 0.2), outfit === 'tee' ? skin : shirt, 0, -0.14, 0);
    add(elbow, G('sph', 0.04), skin, 0, -0.3, 0, { scale: [0.9, 1.3, 0.7] });
    if (Math.random() < 0.4) add(elbow, G('sph', 0.03), blood, 0, -0.12, 0.04, { scale: [1, 1.4, 0.5], cast: false });

    arms[side < 0 ? 'L' : 'R'] = { shoulder, elbow };
  }

  /* Pernas (quadril -> joelho -> bota) */
  const legs = {};
  for (const side of [-1, 1]) {
    const hip = new THREE.Group();
    hip.position.set(side * 0.09, 0.92, 0);
    root.add(hip);
    add(hip, G('cap', 0.085, 0.29), pants, 0, -0.22, 0);

    const knee = new THREE.Group();
    knee.position.y = -0.45;
    hip.add(knee);
    add(knee, G('cap', 0.06, 0.28), pants, 0, -0.2, 0);
    add(knee, G('cap', 0.055, 0.12), shoe, 0, -0.42, 0.055, { rot: [Math.PI / 2, 0, 0], scale: [1.15, 1, 1] });

    legs[side < 0 ? 'L' : 'R'] = { hip, knee };
  }

  return {
    root,
    parts,
    spine,
    headPivot,
    jaw,
    legL: legs.L.hip, kneeL: legs.L.knee,
    legR: legs.R.hip, kneeR: legs.R.knee,
    armL: arms.L.shoulder, elbowL: arms.L.elbow,
    armR: arms.R.shoulder, elbowR: arms.R.elbow,
  };
}

/* ===========================================================
   ITENS DE LOOT (lata, garrafa, kit de primeiros socorros, munição)
   =========================================================== */
const metal = (color, rough = 0.4, metalness = 0.85) =>
  new THREE.MeshStandardMaterial({ color, roughness: rough, metalness, envMap: ENV, envMapIntensity: 0.9 });

function canLabelTexture() {
  return canvasTexture(256, 64, (ctx, w, h) => {
    ctx.fillStyle = '#a82e24';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#e8d27a';
    ctx.fillRect(0, 0, w, 6);
    ctx.fillRect(0, h - 6, w, 6);
    ctx.fillStyle = '#f4efe0';
    ctx.font = 'bold 30px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('FEIJÃO', w / 2, h / 2 + 1);
  }, 1, 1);
}

export function createLootModel(type) {
  const group = new THREE.Group();
  const inner = new THREE.Group();
  group.add(inner);
  let glow = 0xffffff;

  if (type === 'food') {
    glow = 0xff9a4a;
    const can = new THREE.Mesh(
      new THREE.LatheGeometry(
        [[0, 0], [0.038, 0], [0.043, 0.006], [0.043, 0.082], [0.047, 0.086], [0.047, 0.092], [0.04, 0.094], [0, 0.094]]
          .map(([x, y]) => new THREE.Vector2(x, y)),
        28
      ),
      metal(0xc4c8cc, 0.35, 0.9)
    );
    const label = new THREE.Mesh(
      new THREE.CylinderGeometry(0.0436, 0.0436, 0.06, 28, 1, true),
      new THREE.MeshStandardMaterial({ map: canLabelTexture(), roughness: 0.7, side: THREE.DoubleSide })
    );
    label.position.y = 0.047;
    inner.add(can, label);
    inner.position.y = -0.047;
  } else if (type === 'water') {
    glow = 0x6ec0ff;
    const profile = [[0, 0], [0.03, 0], [0.034, 0.01], [0.034, 0.12], [0.03, 0.16], [0.016, 0.19], [0.015, 0.212], [0, 0.212]]
      .map(([x, y]) => new THREE.Vector2(x, y));
    const glass = new THREE.Mesh(
      new THREE.LatheGeometry(profile, 24),
      new THREE.MeshPhysicalMaterial({
        color: 0xcfe8ff, transparent: true, opacity: 0.35, roughness: 0.05,
        envMap: ENV, envMapIntensity: 1.4, depthWrite: false,
      })
    );
    const waterProfile = [[0, 0.004], [0.027, 0.004], [0.031, 0.012], [0.031, 0.118], [0.027, 0.15], [0, 0.15]]
      .map(([x, y]) => new THREE.Vector2(x, y));
    const water = new THREE.Mesh(
      new THREE.LatheGeometry(waterProfile, 24),
      new THREE.MeshStandardMaterial({ color: 0x4aa8e8, transparent: true, opacity: 0.75, roughness: 0.1 })
    );
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.0175, 0.0175, 0.024, 16), new THREE.MeshStandardMaterial({ color: 0x1f5fc4, roughness: 0.5 }));
    cap.position.y = 0.222;
    const band = new THREE.Mesh(
      new THREE.CylinderGeometry(0.0345, 0.0345, 0.045, 24, 1, true),
      new THREE.MeshStandardMaterial({ color: 0xf2f6fa, roughness: 0.6, side: THREE.DoubleSide })
    );
    band.position.y = 0.07;
    inner.add(glass, water, cap, band);
    inner.position.y = -0.11;
  } else if (type === 'bandage') {
    glow = 0xff5a5a;
    const kit = new THREE.Mesh(new RoundedBoxGeometry(0.26, 0.17, 0.08, 3, 0.015), new THREE.MeshStandardMaterial({ color: 0xe9e9e4, roughness: 0.5 }));
    const red = new THREE.MeshStandardMaterial({ color: 0xc42222, roughness: 0.5 });
    for (const z of [0.0415, -0.0415]) {
      const a = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.03, 0.004), red);
      const b = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.1, 0.004), red);
      a.position.z = b.position.z = z;
      inner.add(a, b);
    }
    const handle = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.014, 0.014), metal(0x8a8a8a, 0.4, 0.8));
    handle.position.y = 0.095;
    inner.add(kit, handle);
    for (const x of [-0.08, 0.08]) {
      const latch = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.02, 0.01), metal(0x9a9a9a, 0.4, 0.8));
      latch.position.set(x, 0.02, 0.042);
      inner.add(latch);
    }
  } else {
    glow = 0xffd24a;
    const box = new THREE.Mesh(new RoundedBoxGeometry(0.2, 0.1, 0.12, 2, 0.01), metal(0x56603f, 0.55, 0.5));
    const lid = new THREE.Mesh(new THREE.BoxGeometry(0.202, 0.006, 0.122), new THREE.MeshStandardMaterial({ color: 0x1f2418, roughness: 0.8 }));
    lid.position.y = 0.025;
    const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.03, 0.002), new THREE.MeshStandardMaterial({ color: 0xe0b72a, roughness: 0.6 }));
    stripe.position.set(0, -0.01, 0.061);
    const handle = new THREE.Mesh(new THREE.TorusGeometry(0.03, 0.005, 6, 12, Math.PI), metal(0x2a2a2a, 0.5, 0.6));
    handle.position.y = 0.05;
    inner.add(box, lid, stripe, handle);
    const brass = metal(0xc9a24a, 0.3, 0.95);
    const tip = metal(0xb8693a, 0.35, 0.9);
    for (let i = 0; i < 3; i++) {
      const shell = new THREE.Mesh(new THREE.CylinderGeometry(0.0045, 0.0045, 0.03, 8), brass);
      const bullet = new THREE.Mesh(new THREE.ConeGeometry(0.0045, 0.014, 8), tip);
      bullet.position.y = 0.022;
      const c = new THREE.Group();
      c.add(shell, bullet);
      c.rotation.z = Math.PI / 2;
      c.position.set(0.04 + i * 0.012, -0.045, 0.085 + i * 0.002);
      inner.add(c);
    }
  }

  inner.traverse((m) => {
    if (m.isMesh) m.castShadow = true;
  });

  const halo = new THREE.Sprite(
    new THREE.SpriteMaterial({ map: glowTexture(), color: glow, transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending, depthWrite: false })
  );
  halo.scale.set(0.75, 0.75, 1);
  group.add(halo);

  group.scale.setScalar(1.3);
  return group;
}

/* ===========================================================
   ÁRVORES (pinheiros e carvalhos) E PEDRAS
   =========================================================== */
function addShadeColors(g, y0, y1, minShade = 0.55) {
  const p = g.attributes.position;
  const arr = new Float32Array(p.count * 3);
  for (let i = 0; i < p.count; i++) {
    const t = clamp((p.getY(i) - y0) / (y1 - y0), 0, 1);
    const n = 0.08 * noise3(p.getX(i) * 3, p.getY(i) * 3, p.getZ(i) * 3);
    const s = clamp(minShade + (1 - minShade) * t + n, 0.3, 1.1);
    arr[i * 3] = arr[i * 3 + 1] = arr[i * 3 + 2] = s;
  }
  g.setAttribute('color', new THREE.BufferAttribute(arr, 3));
}

function buildPine() {
  const trunk = new THREE.CylinderGeometry(0.12, 0.28, 5.2, 8, 4);
  trunk.translate(0, 2.6, 0);

  const layers = [];
  for (let k = 0; k < 6; k++) {
    const r = 2.0 - 0.28 * k;
    const h = 1.9;
    const y = 1.5 + k * 0.85 + h / 2;
    const g = new THREE.ConeGeometry(r, h, 12, 1);
    g.deleteAttribute('uv');
    g.deleteAttribute('normal');
    const p = g.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i);
      const yy = p.getY(i);
      const z = p.getZ(i);
      if (yy < 0) {
        const n = noise3(x * 1.3 + k, 0, z * 1.3);
        const f = 0.85 + 0.11 * n;
        p.setXYZ(i, x * f, yy - Math.abs(n) * 0.18, z * f);
      }
    }
    g.translate(0, y, 0);
    g.computeVertexNormals();
    addShadeColors(g, y - h / 2, y + h / 2, 0.5);
    layers.push(g);
  }
  const foliage = mergeGeometries(layers);
  trunk.scale(0.7, 0.7, 0.7);
  foliage.scale(0.7, 0.7, 0.7);
  return { trunk, foliage };
}

function leafBlob(cx, cy, cz, r, sy = 0.8, seed = 0) {
  let g = new THREE.IcosahedronGeometry(r, 2);
  g.deleteAttribute('uv');
  g.deleteAttribute('normal');
  g = mergeVertices(g);
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i);
    const y = p.getY(i);
    const z = p.getZ(i);
    const f = 1 + 0.16 * noise3(x * 1.6 + seed, y * 1.6, z * 1.6);
    p.setXYZ(i, x * f + cx, y * f * sy + cy, z * f + cz);
  }
  g.computeVertexNormals();
  addShadeColors(g, cy - r * sy, cy + r * sy, 0.5);
  return g;
}

function buildOak() {
  const parts = [];
  const trunk = new THREE.CylinderGeometry(0.2, 0.34, 2.6, 10, 6);
  trunk.translate(0, 1.3, 0);
  const tp = trunk.attributes.position;
  for (let i = 0; i < tp.count; i++) tp.setX(i, tp.getX(i) + 0.1 * Math.sin(tp.getY(i) * 1.8));
  trunk.computeVertexNormals();
  parts.push(trunk.toNonIndexed());

  for (let i = 0; i < 3; i++) {
    const b = new THREE.CylinderGeometry(0.07, 0.12, 1.4, 6);
    b.translate(0, 0.7, 0);
    b.rotateZ(-rand(0.7, 1.0));
    b.rotateY((i / 3) * Math.PI * 2 + rand(0, 1));
    b.translate(0, 2.0 + rand(0, 0.5), 0);
    parts.push(b.toNonIndexed());
  }
  const trunkGeo = mergeGeometries(parts);

  const blobs = [
    leafBlob(0, 3.7, 0, 1.7, 0.8, 0),
    leafBlob(1.4, 3.2, 0.3, 1.2, 0.85, 1),
    leafBlob(-1.3, 3.3, -0.4, 1.3, 0.85, 2),
    leafBlob(0.2, 4.5, -1.0, 1.1, 0.85, 3),
    leafBlob(-0.3, 4.4, 1.1, 1.1, 0.85, 4),
    leafBlob(1.0, 4.3, 0.9, 0.9, 0.85, 5),
  ];
  const foliage = mergeGeometries(blobs);
  trunkGeo.scale(0.9, 0.9, 0.9);
  foliage.scale(0.9, 0.9, 0.9);
  return { trunk: trunkGeo, foliage };
}

export function createTreeMeshes(spots) {
  const meshes = [];
  const trunks = [];
  const barkMat = new THREE.MeshStandardMaterial({ color: 0xffffff, map: barkTexture(), roughness: 1 });
  const leafMat = new THREE.MeshStandardMaterial({ color: 0xffffff, vertexColors: true, roughness: 0.9 });

  for (const species of ['pine', 'oak']) {
    const list = spots.filter((s) => s.species === species);
    if (!list.length) continue;
    const { trunk: trunkGeo, foliage: foliageGeo } = species === 'pine' ? buildPine() : buildOak();
    const trunk = new THREE.InstancedMesh(trunkGeo, barkMat, list.length);
    const foliage = new THREE.InstancedMesh(foliageGeo, leafMat, list.length);
    const col = new THREE.Color();

    list.forEach((t, i) => {
      dummy.position.set(t.x, 0, t.z);
      dummy.rotation.set(0, rand(0, Math.PI * 2), 0);
      dummy.scale.set(t.s, t.s * rand(0.9, 1.2), t.s);
      dummy.updateMatrix();
      trunk.setMatrixAt(i, dummy.matrix);
      foliage.setMatrixAt(i, dummy.matrix);
      if (species === 'pine') col.setHSL(rand(0.28, 0.36), rand(0.3, 0.5), rand(0.16, 0.26));
      else col.setHSL(rand(0.2, 0.3), rand(0.35, 0.55), rand(0.2, 0.32));
      foliage.setColorAt(i, col);
    });
    dummy.scale.set(1, 1, 1);

    for (const m of [trunk, foliage]) {
      m.castShadow = true;
      m.receiveShadow = true;
      m.frustumCulled = false;
      meshes.push(m);
    }
    trunks.push(trunk);
  }
  return { meshes, trunks };
}

export function createRockMesh(spots) {
  const geo = new THREE.IcosahedronGeometry(1, 2);
  const p = geo.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i);
    const y = p.getY(i);
    const z = p.getZ(i);
    const f = 1 + 0.15 * noise3(x * 2.1, y * 2.1, z * 2.1);
    p.setXYZ(i, x * f, y * f, z * f);
  }
  geo.computeVertexNormals();

  const rocks = new THREE.InstancedMesh(
    geo,
    new THREE.MeshStandardMaterial({ color: 0xffffff, map: rockTexture(), roughness: 0.95 }),
    spots.length
  );
  const col = new THREE.Color();
  spots.forEach((r, i) => {
    dummy.position.set(r.x, r.s * 0.35, r.z);
    dummy.rotation.set(rand(0, 1), rand(0, Math.PI * 2), rand(0, 1));
    dummy.scale.set(r.s, r.s * 0.7, r.s * rand(0.8, 1.2));
    dummy.updateMatrix();
    rocks.setMatrixAt(i, dummy.matrix);
    col.setHSL(0.1, 0.06, rand(0.55, 0.85));
    rocks.setColorAt(i, col);
  });
  dummy.scale.set(1, 1, 1);
  rocks.castShadow = true;
  rocks.receiveShadow = true;
  rocks.frustumCulled = false;
  return rocks;
}

/* ===========================================================
   CASAS: paredes com textura, telhado de duas águas, chaminé,
   porta aberta, janelas tampadas com tábuas, piso e mesa
   =========================================================== */
export function makeWallMaterial(sx, sz, h, tint = 0xffffff) {
  const tex = sidingTexture().clone();
  tex.needsUpdate = true;
  tex.repeat.set(Math.max(sx, sz) / 2.4, h / 2.4);
  return new THREE.MeshStandardMaterial({ map: tex, color: tint, roughness: 0.95 });
}

export function makeFloorMaterial(w, d) {
  const tex = plankFloorTexture().clone();
  tex.needsUpdate = true;
  tex.repeat.set(w / 3, d / 3);
  return new THREE.MeshStandardMaterial({ map: tex, roughness: 0.85 });
}

export function createGableRoof(w, d, tint = 0xffffff) {
  const rh = w * 0.22;
  const shape = new THREE.Shape();
  shape.moveTo(-w / 2 - 0.45, 0);
  shape.lineTo(w / 2 + 0.45, 0);
  shape.lineTo(0, rh);
  shape.closePath();

  const depth = d + 0.9;
  const geo = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: false });
  geo.translate(0, 0, -depth / 2);

  const capTex = sidingTexture().clone();
  capTex.needsUpdate = true;
  capTex.repeat.set(0.4, 0.4);
  const capMat = new THREE.MeshStandardMaterial({ map: capTex, color: tint, roughness: 0.95 });
  const roofMat = new THREE.MeshStandardMaterial({ map: shingleTexture(), roughness: 0.95 });

  const roof = new THREE.Mesh(geo, [capMat, roofMat]);
  roof.castShadow = true;
  roof.receiveShadow = true;
  return roof;
}

export function createHouseDecor(cx, cz, w, d, h) {
  const group = new THREE.Group();
  const solids = [];

  const frameMat = new THREE.MeshStandardMaterial({ color: 0xcfc8b8, roughness: 0.8 });
  const plankMat = new THREE.MeshStandardMaterial({ color: 0x6a5038, map: woodTexture(), roughness: 0.95 });
  const doorMat = new THREE.MeshStandardMaterial({ color: 0x7a5a3a, map: woodTexture(), roughness: 0.9 });
  const glassMat = new THREE.MeshPhysicalMaterial({ color: 0x0d1417, roughness: 0.05, metalness: 0.2, envMap: ENV, envMapIntensity: 1.0 });
  const brickMat = new THREE.MeshStandardMaterial({ map: brickTexture(), roughness: 0.95 });

  const add = (parent, geo, mat, x, y, z, rx = 0, ry = 0, rz = 0) => {
    const m = new THREE.Mesh(geo, mat);
    m.position.set(x, y, z);
    m.rotation.set(rx, ry, rz);
    m.castShadow = true;
    m.receiveShadow = true;
    parent.add(m);
    return m;
  };

  const doorW = 1.8;
  const fz = cz + d / 2;

  // Batente e porta entreaberta
  add(group, new THREE.BoxGeometry(0.12, 2.45, 0.36), frameMat, cx - doorW / 2 + 0.06, 1.225, fz);
  add(group, new THREE.BoxGeometry(0.12, 2.45, 0.36), frameMat, cx + doorW / 2 - 0.06, 1.225, fz);
  add(group, new THREE.BoxGeometry(doorW, 0.12, 0.36), frameMat, cx, 2.42, fz);

  const pivot = new THREE.Group();
  pivot.position.set(cx - doorW / 2 + 0.12, 0, fz);
  pivot.rotation.y = -1.25;
  group.add(pivot);
  add(pivot, new THREE.BoxGeometry(0.86, 2.05, 0.05), doorMat, 0.43, 1.03, 0);
  add(pivot, new THREE.SphereGeometry(0.03, 10, 8), metal(0xb09a50, 0.4, 0.9), 0.78, 1.0, 0.04);

  // Degrau
  add(group, new THREE.BoxGeometry(2.4, 0.12, 0.9), new THREE.MeshStandardMaterial({ color: 0x8a8a84, map: rockTexture(), roughness: 1 }), cx, 0.06, fz + 0.55);

  // Janelas tampadas com tábuas
  const addWindow = (x, y, z, rotY) => {
    const g = new THREE.Group();
    g.position.set(x, y, z);
    g.rotation.y = rotY;
    add(g, new THREE.BoxGeometry(1.3, 1.1, 0.08), frameMat, 0, 0, 0);
    add(g, new THREE.BoxGeometry(1.08, 0.88, 0.03), glassMat, 0, 0, 0.03);
    add(g, new THREE.BoxGeometry(1.45, 0.13, 0.04), plankMat, 0, 0.12, 0.07, 0, 0, 0.1);
    add(g, new THREE.BoxGeometry(1.45, 0.13, 0.04), plankMat, 0, -0.16, 0.07, 0, 0, -0.08);
    group.add(g);
  };
  const off = 0.17;
  const segOff = doorW / 2 + (w - doorW) / 4;
  addWindow(cx - segOff, 1.7, fz + off, 0);
  addWindow(cx + segOff, 1.7, fz + off, 0);
  addWindow(cx - w * 0.22, 1.7, cz - d / 2 - off, Math.PI);
  addWindow(cx + w * 0.22, 1.7, cz - d / 2 - off, Math.PI);
  addWindow(cx - w / 2 - off, 1.7, cz - d * 0.2, -Math.PI / 2);
  addWindow(cx - w / 2 - off, 1.7, cz + d * 0.2, -Math.PI / 2);
  addWindow(cx + w / 2 + off, 1.7, cz - d * 0.2, Math.PI / 2);
  addWindow(cx + w / 2 + off, 1.7, cz + d * 0.2, Math.PI / 2);

  // Chaminé
  const chimney = add(group, new THREE.BoxGeometry(0.75, 2.9, 0.75), brickMat, cx + w * 0.28, h + 0.95, cz - d * 0.2);
  add(group, new THREE.BoxGeometry(0.92, 0.1, 0.92), new THREE.MeshStandardMaterial({ color: 0x77736a, roughness: 1 }), cx + w * 0.28, h + 2.43, cz - d * 0.2);
  solids.push(chimney);

  return { group, solids };
}

export function createTable() {
  const g = new THREE.Group();
  const wood = new THREE.MeshStandardMaterial({ color: 0x7a5a3a, map: woodTexture(), roughness: 0.85 });
  const top = new THREE.Mesh(new RoundedBoxGeometry(1.4, 0.06, 0.8, 2, 0.02), wood);
  top.position.y = 0.78;
  g.add(top);
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.75, 0.06), wood);
      leg.position.set(sx * 0.62, 0.375, sz * 0.33);
      g.add(leg);
    }
  }
  g.traverse((m) => {
    if (m.isMesh) {
      m.castShadow = true;
      m.receiveShadow = true;
    }
  });
  return g;
}

/* ===========================================================
   CARRO ABANDONADO (silhueta de sedã com curvas, vidros,
   para-choques, faróis, rodas com aro, pintura com ferrugem)
   =========================================================== */
export function createCarModel() {
  const group = new THREE.Group();
  const solids = [];

  const hue = pick([0.02, 0.58, 0.12, 0.33, 0.0, 0.62]);
  const color = new THREE.Color().setHSL(hue, rand(0.2, 0.6), rand(0.22, 0.4));
  const paint = new THREE.MeshPhysicalMaterial({
    color, map: paintTexture(), roughness: 0.5, metalness: 0.55,
    clearcoat: 0.5, clearcoatRoughness: 0.4, envMap: ENV, envMapIntensity: 0.9,
  });
  const glass = new THREE.MeshPhysicalMaterial({
    color: 0x0f171a, roughness: 0.05, metalness: 0.6, transparent: true, opacity: 0.88,
    envMap: ENV, envMapIntensity: 1.1,
  });
  const chrome = metal(0xc8ccd0, 0.2, 1.0);
  const rubber = new THREE.MeshStandardMaterial({ color: 0x141414, roughness: 1 });
  const black = new THREE.MeshStandardMaterial({ color: 0x0a0a0a, roughness: 0.9 });

  const mk = (geo, mat, x, y, z, o = {}) => {
    const m = new THREE.Mesh(geo, mat);
    m.position.set(x, y, z);
    if (o.rot) m.rotation.set(...o.rot);
    m.castShadow = true;
    m.receiveShadow = true;
    group.add(m);
    return m;
  };

  // Carroceria: perfil lateral extrudado com bordas arredondadas
  const s = new THREE.Shape();
  s.moveTo(-2.05, 0.3);
  s.lineTo(2.0, 0.3);
  s.quadraticCurveTo(2.2, 0.32, 2.2, 0.55);
  s.lineTo(2.18, 0.78);
  s.quadraticCurveTo(2.1, 0.92, 1.6, 0.95);
  s.lineTo(0.75, 1.02);
  s.quadraticCurveTo(0.45, 1.06, 0.1, 1.5);
  s.lineTo(-0.9, 1.52);
  s.quadraticCurveTo(-1.3, 1.5, -1.6, 1.08);
  s.lineTo(-1.95, 1.02);
  s.quadraticCurveTo(-2.2, 1.0, -2.2, 0.75);
  s.lineTo(-2.2, 0.5);
  s.quadraticCurveTo(-2.2, 0.3, -2.05, 0.3);

  const bodyGeo = new THREE.ExtrudeGeometry(s, {
    depth: 1.6, bevelEnabled: true, bevelThickness: 0.1, bevelSize: 0.1, bevelSegments: 4, curveSegments: 14,
  });
  bodyGeo.translate(0, 0, -0.8);
  const body = mk(bodyGeo, paint, 0, 0, 0);
  solids.push(body);

  // Vidros laterais, para-brisa e vidro traseiro
  const gs = new THREE.Shape();
  gs.moveTo(0.7, 1.04);
  gs.lineTo(0.2, 1.44);
  gs.lineTo(-0.9, 1.46);
  gs.lineTo(-1.5, 1.08);
  gs.lineTo(-1.5, 1.04);
  gs.closePath();
  const sideGlassGeo = new THREE.ExtrudeGeometry(gs, { depth: 1.84, bevelEnabled: false });
  sideGlassGeo.translate(0, 0, -0.92);
  solids.push(mk(sideGlassGeo, glass, 0, 0, 0));

  solids.push(mk(new THREE.BoxGeometry(0.02, 0.64, 1.5), glass, 0.45 + 0.02, 1.24 + 0.025, 0, { rot: [0, 0, 0.89] }));
  solids.push(mk(new THREE.BoxGeometry(0.02, 0.71, 1.5), glass, -1.2 - 0.016, 1.27 + 0.025, 0, { rot: [0, 0, 2.24] }));

  for (const sz of [-1, 1]) mk(new THREE.BoxGeometry(0.1, 0.46, 0.02), paint, -0.35, 1.27, sz * 0.915);

  // Parte de baixo, grade, para-choques, placas e faróis
  mk(new THREE.BoxGeometry(4.2, 0.2, 1.7), black, 0, 0.32, 0);
  mk(new THREE.BoxGeometry(0.05, 0.2, 0.9), black, 2.22, 0.66, 0);
  const plate = new THREE.MeshStandardMaterial({ color: 0xcfcfc4, roughness: 0.6 });
  mk(new RoundedBoxGeometry(0.16, 0.16, 1.9, 2, 0.05), chrome, 2.24, 0.42, 0);
  mk(new RoundedBoxGeometry(0.16, 0.16, 1.9, 2, 0.05), chrome, -2.24, 0.42, 0);
  mk(new THREE.BoxGeometry(0.02, 0.12, 0.3), plate, 2.335, 0.42, 0);
  mk(new THREE.BoxGeometry(0.02, 0.12, 0.3), plate, -2.335, 0.42, 0);
  for (const sz of [-1, 1]) {
    const lamp = mk(new THREE.SphereGeometry(0.1, 12, 10), metal(0xe4e4d8, 0.1, 0.4), 2.17, 0.8, sz * 0.62);
    lamp.scale.set(0.5, 0.8, 1.2);
    mk(new THREE.BoxGeometry(0.04, 0.1, 0.26), new THREE.MeshStandardMaterial({ color: 0x8a1a1a, emissive: 0x330000, roughness: 0.4 }), -2.2, 0.82, sz * 0.66);
  }

  // Frestas das portas
  for (const sz of [-1, 1]) {
    for (const x of [0.5, -0.55]) mk(new THREE.BoxGeometry(0.012, 0.52, 0.012), black, x, 0.82, sz * 0.915);
  }

  // Rodas
  const tireGeo = new THREE.CylinderGeometry(0.36, 0.36, 0.24, 22);
  tireGeo.rotateX(Math.PI / 2);
  const rimGeo = new THREE.CylinderGeometry(0.22, 0.22, 0.26, 16);
  rimGeo.rotateX(Math.PI / 2);
  const hubGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.28, 12);
  hubGeo.rotateX(Math.PI / 2);
  const flat = randInt(0, 3);
  let wi = 0;
  for (const wx of [1.35, -1.3]) {
    for (const sz of [-1, 1]) {
      const wheel = new THREE.Group();
      const tire = new THREE.Mesh(tireGeo, rubber);
      const rim = new THREE.Mesh(rimGeo, chrome);
      const hub = new THREE.Mesh(hubGeo, metal(0x6a6a6a, 0.4, 0.9));
      tire.castShadow = true;
      wheel.add(tire, rim, hub);
      if (wi === flat) wheel.scale.set(1, 0.82, 1);
      wheel.position.set(wx, wi === flat ? 0.3 : 0.36, sz * 0.86);
      group.add(wheel);

      const arch = new THREE.Mesh(new THREE.CircleGeometry(0.44, 24), black);
      arch.position.set(wx, 0.36, sz * 0.906);
      if (sz < 0) arch.rotation.y = Math.PI;
      group.add(arch);
      wi++;
    }
  }

  return { group, solids };
}

/* ===========================================================
   PISTOLA EM PRIMEIRA PESSOA (com mão e manga)
   =========================================================== */
export function createPistolModel() {
  const group = new THREE.Group();

  const steel = metal(0x24262a, 0.35, 0.85);
  const polymer = new THREE.MeshStandardMaterial({ color: 0x17181a, roughness: 0.6 });
  const gripTex = canvasTexture(64, 64, (ctx, w, h) => {
    ctx.fillStyle = '#1b1c1e';
    ctx.fillRect(0, 0, w, h);
    speckle(ctx, w, h, 500, '70,70,74', 0.3, 0.8, 1, 2);
  });
  const gripMat = new THREE.MeshStandardMaterial({ color: 0xffffff, map: gripTex, roughness: 0.85 });
  const skin = new THREE.MeshStandardMaterial({ color: 0xc9a58a, roughness: 0.7 });
  const sleeve = new THREE.MeshStandardMaterial({ color: 0x2f3a2e, map: dirtTexture(), roughness: 0.95 });

  const add = (geo, mat, x, y, z, rx = 0, ry = 0, rz = 0) => {
    const m = new THREE.Mesh(geo, mat);
    m.position.set(x, y, z);
    m.rotation.set(rx, ry, rz);
    group.add(m);
    return m;
  };

  add(new RoundedBoxGeometry(0.05, 0.05, 0.26, 2, 0.01), polymer, 0, 0, -0.02);
  add(new RoundedBoxGeometry(0.048, 0.05, 0.3, 2, 0.01), steel, 0, 0.05, -0.03);
  add(new THREE.CylinderGeometry(0.012, 0.012, 0.03, 10), steel, 0, 0.05, -0.19, Math.PI / 2, 0, 0);
  add(new RoundedBoxGeometry(0.045, 0.13, 0.06, 2, 0.012), gripMat, 0, -0.085, 0.07, 0.18, 0, 0);
  add(new THREE.BoxGeometry(0.008, 0.02, 0.02), steel, 0, 0.082, 0.1);
  add(new THREE.BoxGeometry(0.008, 0.015, 0.01), steel, 0, 0.08, -0.17);
  add(new THREE.BoxGeometry(0.012, 0.03, 0.012), steel, 0, -0.04, 0.02);
  for (let i = 0; i < 5; i++) {
    add(new THREE.BoxGeometry(0.05, 0.03, 0.003), polymer, 0, 0.052, 0.04 + i * 0.012);
  }

  // Mão e antebraço
  const A = new THREE.Vector3(0.005, -0.08, 0.075);
  const B = new THREE.Vector3(0.14, -0.28, 0.6);
  const dir = B.clone().sub(A);
  const len = dir.length();
  dir.normalize();
  const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);

  const hand = add(new THREE.SphereGeometry(0.038, 14, 10), skin, A.x, A.y, A.z);
  hand.scale.set(0.9, 1.3, 1.1);
  const thumb = add(new THREE.CapsuleGeometry(0.011, 0.04, 4, 8), skin, -0.03, -0.04, 0.0, 0.4, 0, 0.5);
  thumb.scale.set(1, 1, 1);

  const forearm = new THREE.Mesh(new THREE.CapsuleGeometry(0.032, len * 0.9, 4, 10), skin);
  forearm.position.copy(A).addScaledVector(dir, len * 0.5);
  forearm.quaternion.copy(q);
  group.add(forearm);

  const sleeveMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.046, 0.05, len * 0.55, 14), sleeve);
  sleeveMesh.position.copy(A).addScaledVector(dir, len * 0.72);
  sleeveMesh.quaternion.copy(q);
  group.add(sleeveMesh);

  group.traverse((m) => {
    if (m.isMesh) {
      m.castShadow = false;
      m.frustumCulled = false;
      m.material.fog = false;
    }
  });

  return { group, muzzle: new THREE.Vector3(0, 0.05, -0.23) };
}