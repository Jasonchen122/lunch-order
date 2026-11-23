// 3D 聖誕樹：參考照片的「層層圓盤＋銀色吊球＋薄荷光環＋紫色底座」，換成我們自己的熊幣星星
import * as THREE from './three.module.min.js';

const PAL = { pine: 0x1F3B33, pine2: 0x2B5246, mint: 0x8FD3C7, lav: 0xC9B6E4, lav2: 0xB39DDB, silver: 0xD5DAE1, warm: 0xFFE7A3 };

export function makeTree(canvas, opt = {}) {
  const C = Object.assign({}, PAL, opt.pal || {});
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(2, devicePixelRatio || 1));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  const scene = new THREE.Scene();
  const cam = new THREE.PerspectiveCamera(opt.fov || 30, 1, 0.1, 100);
  cam.position.set(0, opt.camY || 2.6, opt.camZ || 11);
  cam.lookAt(0, opt.lookY || 2.1, 0);

  scene.add(new THREE.HemisphereLight(0xFFF6E8, 0x3A3450, 1.6));
  const key = new THREE.DirectionalLight(0xFFFFFF, 2.2); key.position.set(4, 8, 6); scene.add(key);
  const rim = new THREE.DirectionalLight(0xC9B6E4, 1.2); rim.position.set(-5, 3, -4); scene.add(rim);

  const root = new THREE.Group(); scene.add(root);

  // 底座：紫色圓台＋薄荷上緣
  const base = new THREE.Mesh(new THREE.CylinderGeometry(1.75, 1.85, 0.32, 48), new THREE.MeshPhongMaterial({ color: C.lav, shininess: 30 }));
  base.position.y = 0.16; root.add(base);
  const baseTop = new THREE.Mesh(new THREE.CylinderGeometry(1.78, 1.78, 0.06, 48), new THREE.MeshPhongMaterial({ color: C.mint, shininess: 60 }));
  baseTop.position.y = 0.34; root.add(baseTop);

  // 樹身：6 層截頭圓錐，每層下緣一圈薄荷光環
  const tiers = 6, H = 4.2, y0 = 0.37, rBottom = 1.35, rTop = 0.12;
  const pineMat = new THREE.MeshPhongMaterial({ color: C.pine, shininess: 8, flatShading: true });
  const ringMat = new THREE.MeshPhongMaterial({ color: C.mint, emissive: C.ringGlow || 0x4C8C82, emissiveIntensity: 0.35, shininess: 90 });
  const surf = [];
  for (let i = 0; i < tiers; i++) {
    const a = i / tiers, b = (i + 1) / tiers;
    const r1 = rBottom + (rTop - rBottom) * a, r2 = rBottom + (rTop - rBottom) * b;
    const h = H / tiers, y = y0 + H * a;
    const m = new THREE.Mesh(new THREE.CylinderGeometry(r2, r1, h, 28, 2), pineMat);
    m.position.y = y + h / 2; root.add(m);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(r1 + 0.05, 0.045, 10, 56), ringMat);
    ring.rotation.x = Math.PI / 2; ring.position.y = y + 0.02; root.add(ring);
    surf.push({ y, h, r1, r2 });
  }
  // 樹頂細尖
  const tip = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.5, 16), pineMat); tip.position.y = y0 + H + 0.2; root.add(tip);

  // 銀色吊球（照片最大的特色）
  const nBall = opt.balls || 120, ballGeo = new THREE.SphereGeometry(1, 16, 12);
  const balls = new THREE.InstancedMesh(ballGeo, new THREE.MeshPhongMaterial({ color: C.silver, specular: 0xFFFFFF, shininess: 120 }), nBall);
  const lights = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 8, 6), new THREE.MeshBasicMaterial({ color: 0xFFFFFF }), opt.lights || 90);
  const M = new THREE.Matrix4(), Q = new THREE.Quaternion(), S = new THREE.Vector3(), P = new THREE.Vector3();
  const rnd = mulberry(7), WSUM = surf.reduce((a, x) => a + x.r1 + x.r2, 0);
  function onSurface(out) {
    let w = rnd() * WSUM, t = surf[0]; for (const x of surf) { w -= x.r1 + x.r2; if (w <= 0) { t = x; break } } const k = rnd(), th = rnd() * Math.PI * 2;
    const r = t.r1 + (t.r2 - t.r1) * k + 0.02; out.set(Math.cos(th) * r, t.y + t.h * k, Math.sin(th) * r); return out;
  }
  const bc = new THREE.Color();
  for (let i = 0; i < nBall; i++) { const s = 0.07 + rnd() * 0.07; M.compose(onSurface(P), Q, S.set(s, s, s)); balls.setMatrixAt(i, M); if (C.ball2) balls.setColorAt(i, bc.setHex(rnd() < 0.62 ? C.silver : C.ball2)); }
  if (C.ball2) balls.material.color.setHex(0xFFFFFF);
  root.add(balls);
  const lc = new THREE.Color(), base0 = [];
  for (let i = 0; i < lights.count; i++) { const s = 0.025; M.compose(onSurface(P), Q, S.set(s, s, s)); lights.setMatrixAt(i, M); base0.push(rnd() * 6.28); lights.setColorAt(i, lc.setHex(C.warm)); }
  root.add(lights);

  // 頂端：我們的熊幣當星星（取代照片裡的品牌標誌）
  const coinTex = new THREE.TextureLoader().load(opt.coin || 'img/coin-64.png'); coinTex.colorSpace = THREE.SRGBColorSpace;
  const coin = new THREE.Sprite(new THREE.SpriteMaterial({ map: coinTex, transparent: true }));
  coin.scale.set(0.75, 0.75, 1); coin.position.y = y0 + H + 0.72; scene.add(coin);

  // 選用：TOM 站在樹旁（取代照片裡的卡通人物）
  if (opt.tom) {
    const tt = new THREE.TextureLoader().load(opt.tom, (t) => { const ar = t.image.width / t.image.height; tom.scale.set(1.5 * ar, 1.5, 1) }); tt.colorSpace = THREE.SRGBColorSpace;
    var tom = new THREE.Sprite(new THREE.SpriteMaterial({ map: tt, transparent: true })); tom.position.set(1.95, 1.1, 0.9); scene.add(tom);
  }

  // 小雪花（很少量）
  let snow = null;
  if (opt.snow) {
    const n = 140, g = new THREE.BufferGeometry(), pos = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) { pos[i * 3] = (rnd() - .5) * 9; pos[i * 3 + 1] = rnd() * 7; pos[i * 3 + 2] = (rnd() - .5) * 6; }
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    snow = new THREE.Points(g, new THREE.PointsMaterial({ color: 0xFFFFFF, size: 0.07, transparent: true, opacity: .85 })); scene.add(snow);
  }

  let spin = 0, boost = 0, running = true, visible = true, last = performance.now();
  function size() { const w = canvas.clientWidth, h = canvas.clientHeight; if (!w || !h) return; renderer.setSize(w, h, false); cam.aspect = w / h; cam.updateProjectionMatrix(); }
  size(); addEventListener('resize', size);
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    spin += dt * (0.35 + boost * 3); boost *= 0.96; root.rotation.y = spin;
    const tw = now / 1000;
    for (let i = 0; i < lights.count; i++) { const v = 0.55 + 0.45 * Math.sin(tw * (2 + boost * 6) + base0[i]); lights.setColorAt(i, lc.setRGB(1, 0.9 * v + 0.1, 0.55 * v + 0.1)); }
    lights.instanceColor.needsUpdate = true;
    coin.material.rotation = Math.sin(tw * 1.5) * 0.15;
    if (snow) { const p = snow.geometry.attributes.position; for (let i = 0; i < p.count; i++) { let y = p.getY(i) - dt * 0.5; if (y < 0) y = 7; p.setY(i, y) } p.needsUpdate = true; }
    renderer.render(scene, cam);
    if (running && visible && !reduce) requestAnimationFrame(frame);
  }
  const io = new IntersectionObserver((e) => { const was = visible; visible = e[0].isIntersecting; if (visible && !was && !reduce) { last = performance.now(); requestAnimationFrame(frame) } });
  io.observe(canvas);
  requestAnimationFrame(frame);
  canvas.addEventListener('click', () => { boost = 1; if (opt.onTap) opt.onTap(); if (reduce) renderer.render(scene, cam); });
  return { stop() { running = false } };
}
function mulberry(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; } }
