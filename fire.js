import * as THREE from 'three';

/* Textura circular suave usada pelas partículas */
const SOFT = (() => {
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const g = c.getContext('2d');
  const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  gr.addColorStop(0, 'rgba(255,255,255,1)');
  gr.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gr;
  g.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(c);
})();

/* Sistema de partículas genérico: sobe com "rise" e renasce na base quando expira */
function particleSystem(scene, o) {
  const { count, color, size, additive, rise, spread, life, opacity } = o;
  const pos = new Float32Array(count * 3);
  const age = new Float32Array(count);
  const span = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    span[i] = life * (0.6 + Math.random() * 0.8);
    age[i] = Math.random() * span[i];
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const mat = new THREE.PointsMaterial({
    color, size, map: SOFT, transparent: true, opacity, depthWrite: false,
    blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending,
  });
  const points = new THREE.Points(geo, mat);
  points.frustumCulled = false;
  scene.add(points);

  let ready = false;
  const reset = (i, b) => {
    age[i] = 0;
    pos[i * 3] = b.x + (Math.random() - 0.5) * spread;
    pos[i * 3 + 1] = b.y;
    pos[i * 3 + 2] = b.z + (Math.random() - 0.5) * spread;
  };

  return {
    update(dt, b) {
      if (!ready) {
        for (let i = 0; i < count; i++) reset(i, b);
        ready = true;
      }
      for (let i = 0; i < count; i++) {
        age[i] += dt;
        if (age[i] > span[i]) reset(i, b);
        else pos[i * 3 + 1] += rise * dt;
      }
      geo.attributes.position.needsUpdate = true;
    },
  };
}

/* Cria uma fogueira na posição (x, z) do chão */
export function createFire(scene, x, z) {
  const logs = new THREE.Group();
  const woodMat = new THREE.MeshStandardMaterial({ color: 0x4a3420, roughness: 0.95 });
  for (let i = 0; i < 4; i++) {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.8, 8), woodMat);
    m.rotation.set(0, (i * Math.PI) / 4, Math.PI / 2);
    m.position.y = 0.06;
    m.castShadow = true;
    logs.add(m);
  }
  logs.position.set(x, 0, z);
  scene.add(logs);

  const flame = particleSystem(scene, {
    count: 90, color: 0xff8a2a, size: 0.45, additive: true, rise: 1.5, spread: 0.3, life: 0.7, opacity: 0.9,
  });
  const smoke = particleSystem(scene, {
    count: 40, color: 0x777777, size: 0.9, additive: false, rise: 0.8, spread: 0.5, life: 3, opacity: 0.35,
  });

  const light = new THREE.PointLight(0xff8a3a, 4, 16, 1.5);
  light.position.set(x, 1, z);
  scene.add(light);

  const flameBase = { x, y: 0.2, z };
  const smokeBase = { x, y: 0.8, z };
  let t = 0;

  return {
    base: { x, z },
    update(dt) {
      t += dt;
      flame.update(dt, flameBase);
      smoke.update(dt, smokeBase);
      light.intensity = 3.6 + Math.sin(t * 17) * 0.5 + Math.sin(t * 31) * 0.3 + Math.random() * 0.5;
    },
  };
}