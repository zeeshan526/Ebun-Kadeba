import * as THREE from "three";

// Palette: blush, berry, rose (her scrubs), blossom, white
const C = {
  blush: 0xfdf2f6,
  berry: 0x5a1240,
  pink: 0xec4899,
  rose: 0xe0458f,
  roseDeep: 0xb8306f,
  blossom: 0xf9b4d0,
  blossomDeep: 0xf28ab5,
  skin: 0x8a5536,
  hair: 0x1e1220,
  hairHi: 0x4a1d3e,
  gold: 0xe9b44c,
  lip: 0xa9445f,
  white: 0xfbf7f9,
};

function noiseCanvas(size = 256, amp = 40, base = 128) {
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const g = c.getContext("2d")!;
  const d = g.createImageData(size, size);
  for (let i = 0; i < d.data.length; i += 4) {
    const v = base + (Math.random() - 0.5) * amp * 2;
    d.data[i] = d.data[i + 1] = d.data[i + 2] = v;
    d.data[i + 3] = 255;
  }
  g.putImageData(d, 0, 0);
  // a few soft blotches for a hand-made clay feel
  for (let k = 0; k < 60; k++) {
    const r = 4 + Math.random() * 18;
    const x = Math.random() * size;
    const y = Math.random() * size;
    const grd = g.createRadialGradient(x, y, 0, x, y, r);
    const s = Math.random() < 0.5 ? 0 : 255;
    grd.addColorStop(0, `rgba(${s},${s},${s},.10)`);
    grd.addColorStop(1, `rgba(${s},${s},${s},0)`);
    g.fillStyle = grd;
    g.fillRect(x - r, y - r, r * 2, r * 2);
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}

function braidCanvas() {
  const c = document.createElement("canvas");
  c.width = 64;
  c.height = 64;
  const g = c.getContext("2d")!;
  g.fillStyle = "#808080";
  g.fillRect(0, 0, 64, 64);
  g.strokeStyle = "#fff";
  g.lineWidth = 9;
  for (let k = -1; k < 3; k++) {
    g.beginPath();
    g.moveTo(k * 32, 0);
    g.lineTo(k * 32 + 32, 32);
    g.lineTo(k * 32, 64);
    g.stroke();
  }
  g.strokeStyle = "#000";
  g.lineWidth = 3;
  for (let k = -1; k < 3; k++) {
    g.beginPath();
    g.moveTo(k * 32 + 10, 0);
    g.lineTo(k * 32 + 42, 32);
    g.lineTo(k * 32 + 10, 64);
    g.stroke();
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}

function pathCanvas() {
  const c = document.createElement("canvas");
  c.width = 256;
  c.height = 512;
  const g = c.getContext("2d")!;
  g.fillStyle = "#efd6e1";
  g.fillRect(0, 0, 256, 512);
  const cols = ["#fbeef4", "#f6e1ea", "#ffffff", "#f3dbe6"];
  for (let y = 0; y < 512; y += 64)
    for (let x = (y / 64) % 2 ? -64 : 0; x < 256; x += 128) {
      g.fillStyle = cols[(x / 64 + y / 64 + 8) % 4 | 0];
      g.beginPath();
      g.roundRect(x + 4, y + 4, 120, 56, 10);
      g.fill();
    }
  const d = g.getImageData(0, 0, 256, 512);
  for (let i = 0; i < d.data.length; i += 4) {
    const n = (Math.random() - 0.5) * 18;
    d.data[i] += n;
    d.data[i + 1] += n;
    d.data[i + 2] += n;
  }
  g.putImageData(d, 0, 0);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

type Vec3 = [number, number, number];
export type CameraPose = { pos: Vec3; target: Vec3; fov?: number };

export function buildScene(
  canvas: HTMLCanvasElement,
  { width, height, pixelRatio = 1, shadowSize = 2048 }: { width: number; height: number; pixelRatio?: number; shadowSize?: number },
) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
  renderer.setPixelRatio(pixelRatio);
  renderer.setSize(width, height, false);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(C.blush);
  scene.fog = new THREE.Fog(C.blush, 6, 16);
  const camera = new THREE.PerspectiveCamera(32, width / height, 0.1, 60);

  scene.add(new THREE.HemisphereLight(0xfff4f8, 0xd99ab8, 1.15));
  const sun = new THREE.DirectionalLight(0xffe6ee, 2.5);
  sun.position.set(3, 6, 3);
  sun.castShadow = true;
  sun.shadow.mapSize.set(shadowSize, shadowSize);
  Object.assign(sun.shadow.camera, { left: -3, right: 3, top: 3, bottom: -3, near: 0.5, far: 20 });
  sun.shadow.radius = 4;
  sun.shadow.bias = -0.0005;
  sun.shadow.normalBias = 0.02;
  scene.add(sun);
  const rim = new THREE.DirectionalLight(0xffd0e4, 1.3);
  rim.position.set(-3, 3, -4);
  scene.add(rim);

  const clay = noiseCanvas();
  const mat = (color: number, o: THREE.MeshStandardMaterialParameters = {}) =>
    new THREE.MeshStandardMaterial({ color, roughness: 0.62, metalness: 0, bumpMap: clay, bumpScale: 0.6, ...o });
  const M = {
    skin: mat(C.skin, { roughness: 0.5 }),
    rose: mat(C.rose),
    roseDeep: mat(C.roseDeep),
    hair: mat(C.hair, { roughness: 0.45 }),
    white: mat(C.white),
    eyeW: mat(0xffffff, { roughness: 0.2, bumpScale: 0 }),
    iris: mat(0x1a1210, { roughness: 0.1, bumpScale: 0 }),
    gold: new THREE.MeshStandardMaterial({ color: C.gold, metalness: 0.9, roughness: 0.25 }),
    lip: mat(C.lip, { roughness: 0.35 }),
    lipLo: mat(0xbc5772, { roughness: 0.3 }),
    brow: mat(0x120d0c),
    pink: mat(C.pink),
    lanyard: mat(C.white),
    blossom: mat(C.blossom),
    blossomDeep: mat(C.blossomDeep),
    berry: mat(C.berry),
  };
  const braidTex = braidCanvas();
  braidTex.repeat.set(26, 1);

  const mesh = (
    geo: THREE.BufferGeometry,
    m: THREE.Material,
    parent: THREE.Object3D,
    pos: Vec3 = [0, 0, 0],
    scale: Vec3 = [1, 1, 1],
    rot: Vec3 = [0, 0, 0],
  ) => {
    const o = new THREE.Mesh(geo, m);
    o.position.set(...pos);
    o.scale.set(...scale);
    o.rotation.set(...rot);
    o.castShadow = true;
    o.receiveShadow = true;
    parent.add(o);
    return o;
  };
  const group = (parent: THREE.Object3D, pos: Vec3 = [0, 0, 0]) => {
    const g = new THREE.Group();
    g.position.set(...pos);
    parent.add(g);
    return g;
  };
  const cap = (r: number, l: number) => new THREE.CapsuleGeometry(r, l, 8, 20);
  const sph = (r: number) => new THREE.SphereGeometry(r, 40, 28);

  // ---------- world ----------
  const ground = mesh(new THREE.PlaneGeometry(60, 60), mat(0xfbe4ee, { bumpScale: 0.3 }), scene, [0, 0, 0], [1, 1, 1], [-Math.PI / 2, 0, 0]);
  ground.castShadow = false;
  const pathTex = pathCanvas();
  pathTex.repeat.set(1, 6);
  const pathTop = mesh(
    new THREE.PlaneGeometry(1.3, 30),
    new THREE.MeshStandardMaterial({ map: pathTex, roughness: 0.9 }),
    scene,
    [0, 0.021, 0],
    [1, 1, 1],
    [-Math.PI / 2, 0, 0],
  );
  pathTop.castShadow = false;

  const props: THREE.Group[] = [];
  const rng = (() => {
    let s = 7;
    return () => (s = (s * 16807) % 2147483647) / 2147483647;
  })();
  // cherry-blossom trees
  const makeTree = () => {
    const g = new THREE.Group();
    mesh(new THREE.CylinderGeometry(0.05, 0.07, 0.9, 12), mat(0x7a4a52), g, [0, 0.45, 0]);
    const k = 0.8 + rng() * 0.5;
    mesh(new THREE.IcosahedronGeometry(0.45 * k, 2), M.blossomDeep, g, [0, 1.15 * k, 0]);
    mesh(new THREE.IcosahedronGeometry(0.32 * k, 2), M.blossom, g, [0.18, 1.4 * k, 0.1]);
    return g;
  };
  const makeBush = () => {
    const g = new THREE.Group();
    mesh(new THREE.IcosahedronGeometry(0.28, 2), M.blossom, g, [0, 0.2, 0], [1.3, 0.8, 1]);
    for (let i = 0; i < 6; i++) {
      const a = rng() * Math.PI * 2;
      mesh(sph(0.045), i % 2 ? M.white : M.pink, g, [Math.cos(a) * 0.28, 0.3 + rng() * 0.12, Math.sin(a) * 0.22]);
    }
    return g;
  };
  const makeLamp = () => {
    const g = new THREE.Group();
    mesh(new THREE.CylinderGeometry(0.025, 0.035, 1.8, 10), M.berry, g, [0, 0.9, 0]);
    mesh(
      sph(0.09),
      new THREE.MeshStandardMaterial({ color: 0xffe9f2, emissive: 0xec4899, emissiveIntensity: 0.3, roughness: 0.3 }),
      g,
      [0, 1.85, 0],
    );
    return g;
  };
  const SPAN = 24;
  for (let i = 0; i < 18; i++) {
    const side = i % 3 === 0 ? 1 : -1;
    const kind = side > 0 ? makeBush() : i % 4 === 1 ? makeLamp() : rng() < 0.6 ? makeTree() : makeBush();
    kind.position.set(side > 0 ? 2.7 + rng() * 0.8 : -(1.15 + rng() * 1.6), 0, -12 + (i / 18) * SPAN + rng() * 0.6);
    kind.rotation.y = rng() * 6;
    kind.userData.z0 = kind.position.z;
    scene.add(kind);
    props.push(kind);
  }

  // ---------- character ----------
  const root = group(scene);
  const body = group(root, [0, 0, 0]);

  // legs
  const legs: { hip: THREE.Group; knee: THREE.Group }[] = [];
  for (const s of [-1, 1]) {
    const hip = group(body, [s * 0.085, 0.86, 0]);
    mesh(cap(0.078, 0.26), M.rose, hip, [0, -0.19, 0]);
    const knee = group(hip, [0, -0.4, 0]);
    mesh(cap(0.068, 0.28), M.rose, knee, [0, -0.18, 0]);
    mesh(new THREE.CylinderGeometry(0.072, 0.072, 0.04, 20), M.roseDeep, knee, [0, -0.355, 0]);
    // trainer
    const shoe = group(knee, [0, -0.42, 0.04]);
    mesh(cap(0.062, 0.12), M.white, shoe, [0, 0, 0], [1, 0.75, 1], [Math.PI / 2, 0, 0]);
    mesh(new THREE.BoxGeometry(0.105, 0.02, 0.22), M.pink, shoe, [0, -0.042, 0]);
    mesh(new THREE.BoxGeometry(0.005, 0.03, 0.1), M.pink, shoe, [s * 0.062, 0, -0.01]);
    legs.push({ hip, knee });
  }
  // pelvis + torso (scrubs)
  mesh(sph(0.18), M.rose, body, [0, 0.9, 0], [1, 0.55, 0.78]);
  const chest = group(body, [0, 0, 0]);
  const prof = [
    [0, 0.86], [0.17, 0.87], [0.19, 0.93], [0.17, 1.03], [0.158, 1.09], [0.172, 1.18],
    [0.182, 1.25], [0.17, 1.31], [0.12, 1.355], [0.05, 1.37], [0, 1.372],
  ].map(([r, y]) => new THREE.Vector2(r, y));
  mesh(new THREE.LatheGeometry(prof, 48), M.rose, chest, [0, 0, 0], [1.08, 1, 0.74]);
  mesh(new THREE.CylinderGeometry(0.19, 0.2, 0.05, 30), M.roseDeep, chest, [0, 0.935, 0], [1.06, 1, 0.78]);
  // V-neck: skin diamond with darker trim
  {
    const sh = new THREE.Shape();
    sh.moveTo(-0.05, 0.035);
    sh.lineTo(0.05, 0.035);
    sh.lineTo(0, -0.06);
    sh.closePath();
    mesh(new THREE.ShapeGeometry(sh), M.skin, chest, [0, 1.325, 0.117], [1, 1, 1], [-0.38, 0, 0]);
  }
  for (const s of [-1, 1])
    mesh(cap(0.007, 0.09), M.roseDeep, chest, [s * 0.026, 1.305, 0.121], [1, 1, 1], [-0.38, 0, s * 0.55]);
  // pocket + badge on lanyard
  mesh(new THREE.BoxGeometry(0.09, 0.08, 0.01), M.roseDeep, chest, [-0.085, 1.17, 0.128]);
  for (const s of [-1, 1]) {
    mesh(new THREE.BoxGeometry(0.012, 0.2, 0.006), M.lanyard, chest, [s * 0.042, 1.2, 0.132], [1, 1, 1], [-0.1, 0, s * -0.13]);
  }
  const badge = group(chest, [0, 1.07, 0.14]);
  badge.scale.setScalar(0.8);
  mesh(new THREE.BoxGeometry(0.07, 0.095, 0.008), M.white, badge);
  mesh(new THREE.BoxGeometry(0.07, 0.022, 0.009), M.berry, badge, [0, 0.036, 0.001]);
  mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.01, 16), mat(0xf3c6da), badge, [0, 0.005, 0.006], [1, 1, 1], [Math.PI / 2, 0, 0]);

  // arms
  const arms: { sh: THREE.Group; el: THREE.Group; s: number }[] = [];
  for (const s of [-1, 1]) {
    const sh = group(chest, [s * 0.215, 1.29, 0]);
    mesh(cap(0.06, 0.08), M.rose, sh, [s * 0.008, -0.06, 0], [1, 1, 0.95]);
    mesh(cap(0.048, 0.18), M.skin, sh, [s * 0.012, -0.17, 0]);
    const el = group(sh, [s * 0.012, -0.29, 0]);
    mesh(cap(0.043, 0.18), M.skin, el, [0, -0.12, 0]);
    mesh(sph(0.052), M.skin, el, [0, -0.27, 0.01], [0.85, 1.1, 0.9]);
    arms.push({ sh, el, s });
  }
  // coffee cup in her right hand
  const cup = group(arms[1].el, [0, -0.3, 0.06]);
  mesh(new THREE.CylinderGeometry(0.05, 0.04, 0.14, 24), M.white, cup);
  mesh(new THREE.CylinderGeometry(0.051, 0.046, 0.05, 24), M.pink, cup, [0, -0.005, 0]);
  mesh(new THREE.CylinderGeometry(0.055, 0.055, 0.02, 24), M.berry, cup, [0, 0.078, 0]);

  // neck + head
  const neckG = group(chest);
  mesh(new THREE.CylinderGeometry(0.052, 0.058, 0.13, 20), M.skin, neckG, [0, 1.385, 0]);
  const head = group(neckG, [0, 1.58, 0]);
  const headGeo = new THREE.SphereGeometry(0.16, 64, 48);
  {
    const p = headGeo.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const y = p.getY(i) / 0.16;
      const k = y < 0 ? 1 - 0.28 * Math.pow(-y, 1.6) : 1 - 0.04 * y;
      p.setX(i, p.getX(i) * k);
      p.setZ(i, p.getZ(i) * (y < 0 ? 1 - 0.1 * Math.pow(-y, 2) : 1));
    }
    headGeo.computeVertexNormals();
  }
  mesh(headGeo, M.skin, head, [0, 0, 0], [1, 1.16, 0.98]);
  // ears + hoops
  const hoops: THREE.Group[] = [];
  for (const s of [-1, 1]) {
    mesh(sph(0.034), M.skin, head, [s * 0.157, -0.01, -0.01], [0.5, 1, 0.8]);
    const hg = group(head, [s * 0.165, -0.05, 0]);
    mesh(new THREE.TorusGeometry(0.024, 0.0045, 10, 40), M.gold, hg, [0, -0.024, 0], [1, 1, 1], [0, Math.PI / 2, 0]);
    hoops.push(hg);
  }
  // eyes
  const eyes: THREE.Group[] = [];
  for (const s of [-1, 1]) {
    const e = group(head, [s * 0.057, 0.025, 0.13]);
    mesh(sph(0.034), M.eyeW, e, [0, 0, 0], [1.1, 0.78, 0.45]);
    mesh(sph(0.019), M.iris, e, [0, -0.002, 0.011], [1, 1, 0.55]);
    mesh(sph(0.0055), M.eyeW, e, [0.007, 0.007, 0.018]);
    mesh(new THREE.TorusGeometry(0.036, 0.0045, 8, 24, 2.2), M.brow, e, [0, -0.006, 0.008], [1, 0.78, 1], [0, 0, Math.PI / 2 - 1.1]);
    mesh(cap(0.0035, 0.016), M.brow, e, [s * 0.038, 0.016, 0.006], [1, 1, 1], [0, 0, -s * 0.8]);
    mesh(new THREE.TorusGeometry(0.05, 0.0055, 8, 24, 1.1), M.brow, head, [s * 0.06, 0.045, 0.128], [1, 0.7, 0.6], [0, 0, Math.PI / 2 - 0.55 + s * -0.08]);
    eyes.push(e);
  }
  // nose
  mesh(sph(0.02), M.skin, head, [0, -0.032, 0.155], [1.3, 0.75, 0.7]);
  for (const s of [-1, 1]) mesh(sph(0.012), mat(0x6a3f28), head, [s * 0.014, -0.04, 0.15], [0.7, 0.5, 0.5]);
  // lips with a soft closed smile
  mesh(sph(0.028), M.lip, head, [0, -0.088, 0.133], [1.15, 0.3, 0.5]);
  mesh(sph(0.028), M.lipLo, head, [0, -0.108, 0.13], [1.0, 0.42, 0.5]);
  {
    const pts = [-1, -0.5, 0, 0.5, 1].map((u) => new THREE.Vector3(u * 0.04, -0.097 + 0.012 * u * u, 0.147 - 0.02 * u * u));
    mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 20, 0.0028, 6), mat(0x4a1a26), head);
  }

  // hair cap with cornrows
  const hairG = group(head);
  const capGeo = new THREE.SphereGeometry(0.168, 48, 32, 0, Math.PI * 2, 0, 1.3);
  mesh(capGeo, M.hair, hairG, [0, 0.012, -0.012], [1, 1.16, 1], [-0.72, 0, 0]);
  const rowMat = new THREE.MeshStandardMaterial({ color: C.hairHi, roughness: 0.4, bumpMap: braidTex, bumpScale: 2 });
  for (let i = -5; i <= 5; i++) {
    const ph = i * 0.19;
    const pts: THREE.Vector3[] = [];
    for (let k = 0; k <= 24; k++) {
      const a = 0.78 + k * 0.08;
      pts.push(new THREE.Vector3(Math.sin(ph) * 0.172, Math.sin(a) * 0.196 * Math.cos(ph) + 0.012, Math.cos(a) * 0.17 * Math.cos(ph) - 0.006));
    }
    mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 48, 0.011, 8, false), rowMat, hairG);
  }
  // braids
  const braidSet = (
    n: number,
    startFn: (u: number) => THREE.Vector3,
    endFn: (u: number) => THREE.Vector3,
    len: number,
    parent: THREE.Object3D,
  ) => {
    const g = group(parent);
    for (let i = 0; i < n; i++) {
      const u = n === 1 ? 0.5 : i / (n - 1);
      const a = startFn(u);
      const b = endFn(u);
      const mid1 = a.clone().lerp(b, 0.33).add(new THREE.Vector3(0, 0, -0.04));
      const mid2 = a.clone().lerp(b, 0.66).add(new THREE.Vector3(0, 0, -0.02));
      const curve = new THREE.CatmullRomCurve3([a, mid1, mid2, b]);
      const tex = braidTex.clone();
      tex.repeat.set(len * 22, 1);
      tex.needsUpdate = true;
      const m = new THREE.MeshStandardMaterial({ color: i % 3 ? C.hair : C.hairHi, roughness: 0.4, bumpMap: tex, bumpScale: 3 });
      mesh(new THREE.TubeGeometry(curve, 48, 0.017, 8, false), m, g);
      // pink bead at each braid tip
      mesh(sph(0.02), i % 2 ? M.pink : M.white, g, [b.x, b.y, b.z]);
    }
    return g;
  };
  // down the back
  const backBraids = braidSet(
    14,
    (u) => new THREE.Vector3((u - 0.5) * 0.26, 0.02 - Math.abs(u - 0.5) * 0.1, -0.13 + Math.abs(u - 0.5) * 0.05),
    (u) => new THREE.Vector3((u - 0.5) * 0.3, -0.58 - Math.sin(u * 3.1) * 0.05, -0.25),
    0.7,
    head,
  );
  // over her right shoulder, in front
  const frontBraids = braidSet(
    5,
    (u) => new THREE.Vector3(0.13 + u * 0.03, -0.02 - u * 0.03, -0.04 + u * 0.02),
    (u) => new THREE.Vector3(0.15 + u * 0.04, -0.5 - u * 0.05, 0.1 + u * 0.03),
    0.55,
    head,
  );

  // ---------- animation ----------
  const P = 1.1; // stride cycle seconds
  const speed = 1.15; // m/s the world moves past her
  function pose(t: number) {
    const w = (t / P) * Math.PI * 2;
    legs.forEach((L, i) => {
      const ph = w + (i ? Math.PI : 0);
      L.hip.rotation.x = -0.38 * Math.cos(ph);
      L.knee.rotation.x = 0.08 + 1.05 * Math.pow(Math.max(0, -Math.sin(ph)), 1.3);
    });
    arms.forEach((A, i) => {
      const ph = w + (i ? Math.PI : 0);
      A.sh.rotation.x = 0.34 * Math.cos(ph);
      A.sh.rotation.z = A.s * 0.05;
      A.el.rotation.x = -0.35 - 0.25 * Math.max(0, -Math.cos(ph));
    });
    arms[1].el.rotation.x -= 0.35; // cup arm stays bent
    body.position.y = -0.025 * Math.cos(2 * w) - 0.012;
    body.rotation.y = 0.06 * Math.sin(w);
    chest.rotation.y = -0.1 * Math.sin(w);
    chest.rotation.x = 0.04;
    head.rotation.y = 0.1 * Math.sin(w) + 0.05;
    head.rotation.z = 0.03 * Math.sin(w);
    backBraids.rotation.x = 0.08 + 0.06 * Math.sin(2 * w - 0.8);
    backBraids.rotation.z = 0.05 * Math.sin(w - 0.6);
    frontBraids.rotation.x = -0.05 + 0.05 * Math.sin(2 * w - 0.6);
    hoops.forEach((h, i) => {
      h.rotation.x = 0.35 * Math.sin(2 * w - 0.7 + i);
    });
    // blink every ~3.7s
    const bt = t % 3.7;
    const blink = bt > 3.55 ? Math.sin(((bt - 3.55) / 0.15) * Math.PI) : 0;
    eyes.forEach((e) => (e.scale.y = 1 - 0.9 * blink));
    // world scroll
    const off = t * speed;
    pathTex.offset.y = off / 5;
    props.forEach((p) => {
      const z = p.userData.z0 - off;
      p.position.z = (((z + 12) % SPAN) + SPAN) % SPAN - 12;
    });
  }

  function render(t: number, cam: CameraPose) {
    pose(t);
    camera.position.set(...cam.pos);
    camera.lookAt(...cam.target);
    if (cam.fov) {
      camera.fov = cam.fov;
      camera.updateProjectionMatrix();
    }
    renderer.render(scene, camera);
  }
  function resize(w: number, h: number) {
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  function dispose() {
    scene.traverse((o) => {
      if (o instanceof THREE.Mesh) {
        o.geometry.dispose();
        (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) => m.dispose());
      }
    });
    clay.dispose();
    braidTex.dispose();
    pathTex.dispose();
    renderer.dispose();
  }
  return { render, resize, dispose };
}
