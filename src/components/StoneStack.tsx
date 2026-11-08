"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";

type LevelView = { name: string; description: string; modules: { slug: string; title: string }[] };

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const ease = (t: number) => 1 - Math.pow(1 - t, 3);
const easeOutBack = (t: number) => { const c1 = 1.3, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); };

function hash(x: number, y: number, z: number) { const s = Math.sin(x * 127.1 + y * 311.7 + z * 74.7) * 43758.5453; return s - Math.floor(s); }
function vnoise(x: number, y: number, z: number) {
  const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z), xf = x - xi, yf = y - yi, zf = z - zi;
  const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf), w = zf * zf * (3 - 2 * zf);
  const L = (a: number, b: number, t: number) => a + (b - a) * t;
  const n = (a: number, b: number, c: number) => hash(xi + a, yi + b, zi + c);
  return L(L(L(n(0, 0, 0), n(1, 0, 0), u), L(n(0, 1, 0), n(1, 1, 0), u), v), L(L(n(0, 0, 1), n(1, 0, 1), u), L(n(0, 1, 1), n(1, 1, 1), u), v), w);
}

const SIZES = [1.25, 1.02, 0.82, 0.62];
const COLORS = ["#0a4f68", "#1f7f90", "#4fa9ad", "#a0e1c6"];
const XOFF = [0, 0.1, -0.08, 0.05];

/** De leerlijn: vier stenen die stapelen tijdens het scrollen en van ruw naar rond slijpen. */
export default function StoneStack({ levels }: { levels: LevelView[] }) {
  const sectionRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [landed, setLanded] = useState(0);
  const [sel, setSel] = useState(-1);
  const selRef = useRef(-1);
  const userPicked = useRef(false);

  const select = (i: number, byUser: boolean) => {
    if (byUser) userPicked.current = true;
    selRef.current = i;
    setSel(i);
  };

  useEffect(() => {
    const section = sectionRef.current!, canvas = canvasRef.current!, stick = canvas.parentElement!;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    } catch {
      const t = setTimeout(() => setLanded(levels.length), 0);
      return () => clearTimeout(t);
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    const scene = new THREE.Scene();
    const cam = new THREE.PerspectiveCamera(36, 1, 0.1, 100);
    cam.position.set(0, 0.6, 9.5);
    cam.lookAt(0, 0.3, 0);
    scene.add(new THREE.HemisphereLight(0xcfeee6, 0x021d28, 0.55));
    const key = new THREE.DirectionalLight(0xffffff, 1.05);
    key.position.set(-3, 5, 4);
    scene.add(key);
    const rim = new THREE.PointLight(0xa0e1c6, 2.2, 14);
    rim.position.set(2.5, 2.5, -3);
    scene.add(rim);
    const rim2 = new THREE.PointLight(0x5ec8d6, 1.4, 12);
    rim2.position.set(-3, -1, -2);
    scene.add(rim2);
    const stack = new THREE.Group();
    scene.add(stack);

    type Stone = { mesh: THREE.Mesh; mat: THREE.MeshStandardMaterial; geo: THREE.BufferGeometry; smoothP: Float32Array; roughP: Float32Array; smoothN: Float32Array; roughN: Float32Array; y: number; x: number; rotY: number; lastR: number; lift: number };
    const stones: Stone[] = [];
    let yAcc = -2.1;
    SIZES.forEach((s, i) => {
      const geo = new THREE.IcosahedronGeometry(1, 5);
      const p = geo.attributes.position as THREE.BufferAttribute, n = p.count;
      const smoothP = new Float32Array(n * 3), roughP = new Float32Array(n * 3), smoothN = new Float32Array(n * 3);
      const off = i * 9.3;
      for (let k = 0; k < n; k++) {
        const x = p.getX(k), y = p.getY(k), z = p.getZ(k), l = Math.hypot(x, y, z);
        const nx = x / l, ny = y / l, nz = z / l;
        smoothP.set([nx, ny, nz], k * 3);
        smoothN.set([nx, ny, nz], k * 3);
        let d = (vnoise(nx * 1.6 + off, ny * 1.6, nz * 1.6) - 0.5) * 0.7 + (vnoise(nx * 4 + off, ny * 4, nz * 4) - 0.5) * 0.28;
        d = Math.round(d * 7) / 7;
        roughP.set([nx * (1 + d), ny * (1 + d), nz * (1 + d)], k * 3);
      }
      const rg = new THREE.BufferGeometry();
      rg.setAttribute("position", new THREE.BufferAttribute(roughP.slice(), 3));
      rg.computeVertexNormals();
      const roughN = (rg.attributes.normal.array as Float32Array).slice();
      rg.dispose();
      (p.array as Float32Array).set(roughP);
      (geo.attributes.normal.array as Float32Array).set(roughN);
      const mat = new THREE.MeshStandardMaterial({ color: COLORS[i], roughness: 0.62, metalness: 0.08, emissive: new THREE.Color(COLORS[i]).multiplyScalar(0.08) });
      const mesh = new THREE.Mesh(geo, mat);
      const sy = s * 0.58;
      mesh.scale.set(s, sy, s * 0.92);
      mesh.userData.i = i;
      const h = sy * 2 * 0.9;
      const y = yAcc + h / 2;
      yAcc += h;
      stack.add(mesh);
      stones.push({ mesh, mat, geo, smoothP, roughP, smoothN, roughN, y, x: XOFF[i], rotY: (i % 2 ? -1 : 1) * (0.25 + i * 0.07), lastR: -1, lift: 0 });
    });

    const morph = (st: Stone, r: number) => {
      if (Math.abs(r - st.lastR) < 0.004) return;
      st.lastR = r;
      const P = st.geo.attributes.position.array as Float32Array, Nn = st.geo.attributes.normal.array as Float32Array;
      const a = st.roughP, b = st.smoothP, na = st.roughN, nb = st.smoothN;
      for (let k = 0; k < P.length; k += 3) {
        P[k] = a[k] + (b[k] - a[k]) * r; P[k + 1] = a[k + 1] + (b[k + 1] - a[k + 1]) * r; P[k + 2] = a[k + 2] + (b[k + 2] - a[k + 2]) * r;
        const x = na[k] + (nb[k] - na[k]) * r, y = na[k + 1] + (nb[k + 1] - na[k + 1]) * r, z = na[k + 2] + (nb[k + 2] - na[k + 2]) * r;
        const l = Math.hypot(x, y, z) || 1;
        Nn[k] = x / l; Nn[k + 1] = y / l; Nn[k + 2] = z / l;
      }
      st.geo.attributes.position.needsUpdate = true;
      st.geo.attributes.normal.needsUpdate = true;
    };

    const resize = () => {
      const w = stick.clientWidth, h = window.innerHeight;
      renderer.setSize(w, h, false);
      cam.aspect = w / h;
      cam.updateProjectionMatrix();
      const wide = w > 860;
      stack.position.set(wide ? 2.1 : 0, wide ? 0 : -0.9, 0);
      stack.scale.setScalar(wide ? 1 : 0.78);
    };
    resize();
    window.addEventListener("resize", resize);

    const ray = new THREE.Raycaster(), m = new THREE.Vector2();
    let hoverI = -1;
    const pick = (e: PointerEvent | MouseEvent) => {
      const r = canvas.getBoundingClientRect();
      m.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
      ray.setFromCamera(m, cam);
      const hit = ray.intersectObjects(stones.filter((s) => s.mesh.visible).map((s) => s.mesh))[0];
      return hit ? (hit.object.userData.i as number) : -1;
    };
    const onMove = (e: PointerEvent) => { hoverI = pick(e); canvas.classList.toggle("hover", hoverI >= 0); };
    const onLeave = () => { hoverI = -1; };
    const onClick = (e: MouseEvent) => { const i = pick(e); if (i >= 0) select(i, true); };
    stick.addEventListener("pointermove", onMove);
    stick.addEventListener("pointerleave", onLeave);
    stick.addEventListener("click", onClick);

    let smooth = 0, last = performance.now(), raf = 0, lastLanded = -1;
    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const vh = window.innerHeight, sy = window.scrollY;
      const top = section.offsetTop, span = section.offsetHeight - vh;
      const raw = clamp((sy - top) / span, 0, 1);
      smooth += (raw - smooth) * (reduce ? 1 : clamp(dt * 6, 0, 1));
      if (sy + vh < top || sy > top + section.offsetHeight) return;
      let nLanded = 0;
      const sel = selRef.current;
      stones.forEach((st, i) => {
        const lt = reduce ? 1 : clamp(smooth * 5.4 - i, 0, 1);
        if (lt >= 0.98) nLanded++;
        const e = easeOutBack(lt);
        const lift = (i === sel ? 0.12 : 0) + (i === hoverI ? 0.06 : 0);
        st.lift += (lift - st.lift) * 0.12;
        st.mesh.position.set(st.x + (i === sel ? 0.05 : 0), st.y + (1 - e) * 7 + st.lift, 0);
        st.mesh.rotation.set((1 - lt) * 0.9, st.rotY + (1 - lt) * 2.2, (1 - lt) * -0.4);
        st.mesh.visible = lt > 0;
        st.mat.emissiveIntensity = 1 + (i === sel ? 2.2 : 0) + (i === hoverI ? 1 : 0);
        morph(st, reduce ? 1 : ease(clamp((smooth - 0.1 - i * 0.05) / 0.65, 0, 1)));
      });
      if (nLanded !== lastLanded) {
        lastLanded = nLanded;
        setLanded(nLanded);
        if (!userPicked.current && nLanded > 0) select(nLanded - 1, false);
      }
      stack.rotation.y = smooth * 0.9 + Math.sin(now / 4000) * 0.05;
      rim.intensity = 1.6 + smooth * 1.6;
      renderer.render(scene, cam);
    };
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      stick.removeEventListener("pointermove", onMove);
      stick.removeEventListener("pointerleave", onLeave);
      stick.removeEventListener("click", onClick);
      stones.forEach((s) => { s.geo.dispose(); s.mat.dispose(); });
      renderer.dispose();
    };
  }, [levels.length]);

  const current = sel >= 0 ? levels[sel] : null;

  return (
    <section className="stones" ref={sectionRef} aria-label="AI literacy: de leerlijn">
      <div className="stones-stick">
        <div className="stones-floor" aria-hidden="true" />
        <canvas ref={canvasRef} className="stones-canvas" aria-hidden="true" />
        <div className="stones-text">
          <span className="mono" style={{ color: "var(--cyan)" }}>AI literacy · de leerlijn</span>
          <h1 className="glow">Van onder op bouwen.</h1>
          <p className="lead">Vier niveaus, van ruw naar rond. Elke nieuwe module krijgt een plek onder het juiste niveau.</p>
          <ol className="levels">
            {levels.map((L, i) => (
              <li key={L.name}>
                <button
                  type="button"
                  className={`lvl${i < landed ? " on" : ""}${i === sel ? " sel" : ""}`}
                  aria-pressed={i === sel}
                  onClick={() => select(i, true)}
                >
                  <b />
                  {L.name}{" "}
                  <small>{L.modules.length ? `${L.modules.length} module${L.modules.length > 1 ? "s" : ""}` : "binnenkort"}</small>
                </button>
              </li>
            ))}
          </ol>
          {current ? (
            <div className="panel" key={sel} aria-live="polite">
              <h2>Niveau {sel + 1} · {current.name}</h2>
              <p className="muted">{current.description}</p>
              {current.modules.length ? (
                <ul>
                  {current.modules.map((mod) => (
                    <li key={mod.slug}>
                      <Link href={`/ai-literacy/${mod.slug}`}>
                        {mod.title}
                        <span>open →</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="empty">Hier komt de eerste module. Idee? Laat het Spar weten.</div>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
