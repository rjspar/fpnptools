"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const ease = (t: number) => 1 - Math.pow(1 - t, 3);

function sprite() {
  const c = document.createElement("canvas");
  c.width = c.height = 64;
  const g = c.getContext("2d")!;
  const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  gr.addColorStop(0, "rgba(255,255,255,1)");
  gr.addColorStop(0.35, "rgba(255,255,255,.65)");
  gr.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = gr;
  g.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(c);
}

/** Hero: de FP&P-ampersand uit deeltjes. Scroll en je vliegt erdoorheen. */
export default function HeroAmpersand() {
  const sectionRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const copyRef = useRef<HTMLDivElement>(null);
  const hintRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const section = sectionRef.current!, canvas = canvasRef.current!, stick = canvas.parentElement!;
    const copy = copyRef.current!, hint = hintRef.current!;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    } catch {
      return; // geen WebGL: de tekst staat er gewoon
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    const scene = new THREE.Scene();
    const cam = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
    cam.position.set(0, 0, 7);
    const group = new THREE.Group();
    scene.add(group);

    const N = 5200, R = 2.3;
    const pos = new Float32Array(N * 3), vel = new Float32Array(N * 3), tgt = new Float32Array(N * 3);
    const col = new Float32Array(N * 3), seed = new Float32Array(N);
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    geo.setAttribute("color", new THREE.BufferAttribute(col, 3));
    const tex = sprite();
    const mat = new THREE.PointsMaterial({ size: 0.042, map: tex, vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.95 });
    group.add(new THREE.Points(geo, mat));

    const DN = 700, dpos = new Float32Array(DN * 3);
    for (let i = 0; i < DN; i++) {
      dpos[i * 3] = (Math.random() - 0.5) * 18;
      dpos[i * 3 + 1] = (Math.random() - 0.5) * 10;
      dpos[i * 3 + 2] = -2 - Math.random() * 6;
    }
    const dgeo = new THREE.BufferGeometry();
    dgeo.setAttribute("position", new THREE.BufferAttribute(dpos, 3));
    const dmat = new THREE.PointsMaterial({ size: 0.03, map: tex, color: 0x5ec8d6, transparent: true, opacity: 0.35, depthWrite: false, blending: THREE.AdditiveBlending });
    const dust = new THREE.Points(dgeo, dmat);
    scene.add(dust);

    const cA = new THREE.Color("#5ec8d6"), cB = new THREE.Color("#a0e1c6"), cW = new THREE.Color("#f2f7ed");
    let formed = false, t0 = 0, alive = true;

    (async () => {
      const family = getComputedStyle(document.body).fontFamily;
      try { await document.fonts.ready; } catch {}
      if (!alive) return;
      const S = 560, oc = document.createElement("canvas");
      oc.width = oc.height = S;
      const g = oc.getContext("2d")!;
      g.fillStyle = "#fff";
      g.textAlign = "center";
      g.textBaseline = "middle";
      g.font = `900 500px ${family}`;
      g.fillText("&", S / 2, S / 2 + 20);
      const d = g.getImageData(0, 0, S, S).data;
      const pts: [number, number][] = [];
      for (let y = 0; y < S; y += 3) for (let x = 0; x < S; x += 3) if (d[(y * S + x) * 4 + 3] > 140) pts.push([x, y]);
      for (let i = pts.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [pts[i], pts[j]] = [pts[j], pts[i]]; }
      for (let i = 0; i < N; i++) {
        const p = pts[i % pts.length];
        const x = ((p[0] - S / 2) / (S / 2)) * R + (Math.random() - 0.5) * 0.02;
        const y = -((p[1] - S / 2) / (S / 2)) * R + (Math.random() - 0.5) * 0.02;
        tgt[i * 3] = x; tgt[i * 3 + 1] = y; tgt[i * 3 + 2] = (Math.random() - 0.5) * 0.35;
        const th = Math.random() * Math.PI * 2, ph = Math.acos(2 * Math.random() - 1), r = 4 + Math.random() * 5;
        pos[i * 3] = r * Math.sin(ph) * Math.cos(th);
        pos[i * 3 + 1] = r * Math.sin(ph) * Math.sin(th);
        pos[i * 3 + 2] = r * Math.cos(ph) - 2;
        if (reduce) { pos[i * 3] = x; pos[i * 3 + 1] = y; pos[i * 3 + 2] = tgt[i * 3 + 2]; }
        seed[i] = Math.random() * 1000;
        const k = clamp(((x + R) / (2 * R)) * 0.8 + ((y + R) / (2 * R)) * 0.2, 0, 1);
        const c = Math.random() < 0.04 ? cW : cA.clone().lerp(cB, k);
        col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
      }
      geo.attributes.position.needsUpdate = true;
      geo.attributes.color.needsUpdate = true;
      formed = true;
      t0 = performance.now();
    })();

    const mouse = new THREE.Vector2(9, 9), mWorld = new THREE.Vector3(99, 99, 0);
    const ray = new THREE.Raycaster(), plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
    let mouseActive = false;
    const onMove = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      mouse.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
      mouseActive = true;
    };
    const onLeave = () => { mouseActive = false; };
    stick.addEventListener("pointermove", onMove);
    stick.addEventListener("pointerleave", onLeave);

    let baseY = -1;
    const resize = () => {
      const w = stick.clientWidth, h = stick.clientHeight;
      renderer.setSize(w, h, false);
      cam.aspect = w / h;
      cam.updateProjectionMatrix();
      const wide = w > 860;
      baseY = wide ? -1.05 : -1.2;
      group.scale.setScalar(wide ? 0.82 : 0.55);
    };
    resize();
    window.addEventListener("resize", resize);

    let raf = 0;
    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      const vh = window.innerHeight, sy = window.scrollY;
      const top = section.offsetTop, span = section.offsetHeight - vh;
      if (sy > top + section.offsetHeight || !formed) return;
      const hp = clamp((sy - top) / span, 0, 1);
      const t = (now - t0) / 1000;
      const pull = reduce ? 1 : clamp((t - 0.25) / 1.6, 0, 1);
      const k = 0.018 + 0.05 * ease(pull);
      const fly = hp * hp * (3 - 2 * hp);
      group.position.set(0, baseY * (1 - ease(clamp(hp * 1.6, 0, 1))), 0);
      cam.position.z = 7 - fly * 8.6;
      const depth = 1 + fly * 9;
      copy.style.opacity = String(clamp(1 - hp * 3.2, 0, 1));
      copy.style.transform = `translateY(${-hp * 160}px)`;
      hint.style.opacity = String(clamp(1 - hp * 6, 0, 1));

      if (mouseActive) {
        ray.setFromCamera(mouse, cam);
        ray.ray.intersectPlane(plane, mWorld);
        mWorld.sub(group.position).divideScalar(group.scale.x);
      } else mWorld.set(99, 99, 0);

      for (let i = 0; i < N; i++) {
        const j = i * 3, s = seed[i];
        const tx = tgt[j] + Math.sin(t * 0.7 + s) * 0.015;
        const ty = tgt[j + 1] + Math.cos(t * 0.6 + s) * 0.015;
        const tz = tgt[j + 2] * depth;
        let ax = (tx - pos[j]) * k, ay = (ty - pos[j + 1]) * k;
        let az = (tz - pos[j + 2]) * k;
        const dx = pos[j] - mWorld.x, dy = pos[j + 1] - mWorld.y, d2 = dx * dx + dy * dy;
        if (d2 < 0.7) {
          const dd = Math.sqrt(d2) + 0.0001, f = (0.84 - dd) * 0.09;
          ax += (dx / dd) * f; ay += (dy / dd) * f; az += (Math.random() - 0.5) * 0.02;
        }
        vel[j] = (vel[j] + ax) * 0.86; vel[j + 1] = (vel[j + 1] + ay) * 0.86; vel[j + 2] = (vel[j + 2] + az) * 0.86;
        pos[j] += vel[j]; pos[j + 1] += vel[j + 1]; pos[j + 2] += vel[j + 2];
      }
      geo.attributes.position.needsUpdate = true;
      group.rotation.y = Math.sin(t * 0.25) * 0.18 + (mouseActive ? mouse.x * 0.12 : 0);
      group.rotation.x = Math.sin(t * 0.2) * 0.05 + (mouseActive ? -mouse.y * 0.06 : 0);
      mat.opacity = 0.95 * (1 - clamp((hp - 0.78) / 0.2, 0, 1));
      dust.rotation.y = t * 0.01;
      renderer.render(scene, cam);
    };
    raf = requestAnimationFrame(frame);

    return () => {
      alive = false;
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      stick.removeEventListener("pointermove", onMove);
      stick.removeEventListener("pointerleave", onLeave);
      geo.dispose(); dgeo.dispose(); mat.dispose(); dmat.dispose(); tex.dispose();
      renderer.dispose();
    };
  }, []);

  return (
    <section className="hero" ref={sectionRef} aria-label="Introductie">
      <div className="hero-stick">
        <canvas ref={canvasRef} className="hero-canvas" aria-hidden="true" />
        <div className="hero-copy" ref={copyRef}>
          <span className="mono accent">Intern · tools.fpnp.nl</span>
          <h1 className="glow">FP&amp;P in een AI-native wereld</h1>
          <p>Automatiseren wat kan, zodat we er helemaal zijn waar het telt: in het contact met mensen.</p>
        </div>
        <div className="hero-hint mono" ref={hintRef} aria-hidden="true">
          Scroll erdoorheen<i />
        </div>
      </div>
    </section>
  );
}
