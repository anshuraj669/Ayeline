"use client";

import { useEffect, useRef } from "react";

/**
 * A slow flight down a city avenue toward City Hall, drawn on a canvas. Buildings with lit
 * windows stream past on both sides, streetlights and traffic rush by below, and far-off
 * blocks rise out of the evening haze. The camera leans toward the pointer and picks up a
 * little speed when you scroll. On the first visit of a session it dives in from high and
 * fast, and glides down to cruising height as the headline lands. Purely decorative.
 */

// World units are roughly meters. The camera flies along +Z, a few meters above the road.
const ROAD = 17; // distance from the center line to the first building line: a wide boulevard
const LENGTH = 560; // one loop of the street, after which it repeats
const FAR = 520; // draw distance
const NEAR = 1;
const CAM_Y = 6;
const SPEED = 9; // m/s, a calm glide
const ARRIVAL_S = 3.2; // how long the opening dive takes to settle
const ARRIVAL_SPEED = 150; // extra m/s at the very start
const ARRIVAL_LIFT = 26; // extra meters of height at the very start
const SKY_FOG: [number, number, number] = [10, 44, 52]; // what far buildings fade into

interface Building {
  side: -1 | 1;
  x: number; // inner edge, distance from the center line
  w: number;
  z: number; // start along the street
  d: number;
  h: number;
  tone: number;
  cols: number;
  sideCols: number;
  rows: number;
  /** 0 dark, 1 warm, 2 cool, one per window: front first, then the face along the road. */
  win: Uint8Array;
}

interface Car {
  lane: number; // X position
  z: number;
  speed: number; // relative to the camera, m/s; negative comes toward you
  head: boolean; // white headlights (oncoming) or red tail lights
}

function seeded(seed: number) {
  return () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };
}

function makeStreet(): Building[] {
  const rand = seeded(2026);
  const out: Building[] = [];
  for (const side of [-1, 1] as const) {
    let z = rand() * 10;
    while (z < LENGTH - 10) {
      const d = 9 + rand() * 18;
      const w = 10 + rand() * 16;
      const tall = rand();
      const h = 12 + tall * tall * 85;
      const cols = Math.max(2, Math.floor(w / 3.4));
      const sideCols = Math.max(2, Math.floor(d / 3.4));
      const rows = Math.max(3, Math.floor(h / 3.6));
      const win = new Uint8Array(rows * (cols + sideCols));
      const litRate = 0.12 + rand() * 0.2;
      for (let i = 0; i < win.length; i++) {
        const r = rand();
        win[i] = r < litRate ? (rand() < 0.72 ? 1 : 2) : 0;
      }
      out.push({ side, x: ROAD + rand() * 3, w, z, d, h, tone: rand(), cols, sideCols, rows, win });
      z += d + 2 + rand() * 7;
    }
  }
  return out;
}

const STREET = makeStreet();

/** Low silhouettes on the horizon, around City Hall. */
const SKYLINE = (() => {
  const rand = seeded(77);
  const out: { x: number; w: number; h: number }[] = [];
  for (let x = -260; x < 260; ) {
    const w = 8 + rand() * 22;
    if (Math.abs(x + w / 2) > 26) out.push({ x, w, h: 10 + rand() * 46 });
    x += w + rand() * 4;
  }
  return out;
})();

const mix = (a: number, b: number, t: number) => Math.round(a + (b - a) * t);
const fogAt = (z: number) => Math.min(1, Math.max(0, (z - 40) / (FAR - 40)));
/** Lights fade as they rush past, so nothing big and bright flashes behind the text. */
const nearFade = (z: number) => Math.min(1, Math.max(0, (z - 8) / 40));

export function CityFlight() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current!;
    const ctx = canvas.getContext("2d")!;
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let W = 0;
    let H = 0;
    let dpr = 1;
    let small = false;

    // Soft glows, drawn once and stamped wherever a light is.
    const glow = makeGlow("255,226,170", "255,190,110");
    const headGlow = makeGlow("240,250,255", "190,230,255");
    const tailGlow = makeGlow("255,120,110", "255,60,70");

    const cars: Car[] = [
      { lane: -3.4, z: 60, speed: -16, head: true },
      { lane: -6.6, z: 220, speed: -12, head: true },
      { lane: 3.4, z: 90, speed: 3, head: false },
      { lane: 6.6, z: 30, speed: 2, head: false },
      { lane: 3.4, z: 300, speed: 4, head: false },
    ];

    let camZ = 0;
    let camX = 0;
    let camLift = 0;
    let targetX = 0;
    let targetLift = 0;
    let boost = 0;
    // 1 at the start of the opening dive, easing to 0. Once per browser tab session.
    let arrival = 0;
    if (!still) {
      try {
        if (!sessionStorage.getItem("ayeline:arrived")) {
          sessionStorage.setItem("ayeline:arrived", "1");
          arrival = 1;
        }
      } catch {}
    }
    if (arrival) canvas.classList.add("city-arrive");

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      W = window.innerWidth;
      H = window.innerHeight;
      small = W < 640;
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      if (still) draw();
    };

    const draw = () => {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);
      const cx = W / 2;
      const hy = H * (small ? 0.6 : 0.56); // horizon
      const f = Math.max(W, H * 1.2) * 0.62; // focal length
      // Squared, so the dive decelerates smoothly instead of stopping short.
      const camY = CAM_Y + camLift + ARRIVAL_LIFT * arrival * arrival;
      const px = (x: number, z: number) => cx + ((x - camX) * f) / z;
      const py = (y: number, z: number) => hy + ((camY - y) * f) / z;

      // Ground: dark, with the city's warm glow pooling at the horizon.
      const ground = ctx.createLinearGradient(0, hy, 0, H);
      ground.addColorStop(0, "rgb(16,48,52)");
      ground.addColorStop(0.25, "rgb(5,26,32)");
      ground.addColorStop(1, "rgb(2,14,19)");
      ctx.fillStyle = ground;
      ctx.fillRect(0, hy, W, H - hy);
      const halo = ctx.createRadialGradient(cx, hy, 0, cx, hy, Math.max(W, H) * 0.55);
      halo.addColorStop(0, "rgba(255,176,110,0.45)");
      halo.addColorStop(0.35, "rgba(255,143,122,0.12)");
      halo.addColorStop(1, "rgba(255,143,122,0)");
      ctx.fillStyle = halo;
      ctx.fillRect(0, 0, W, H);

      // The far skyline, and City Hall waiting at the end of the avenue.
      const zH = FAR + 60;
      ctx.fillStyle = "rgb(18,64,72)";
      for (const b of SKYLINE) ctx.fillRect(px(b.x, zH), py(b.h, zH), (b.w * f) / zH, py(0, zH) - py(b.h, zH));
      drawCityHall(ctx, px, py, zH, f);

      // The road, its edge lines and the dashed center line.
      ctx.fillStyle = "rgba(4,22,28,0.85)";
      quad(ctx, px(-ROAD + 1, NEAR), py(0, NEAR), px(ROAD - 1, NEAR), py(0, NEAR), px(ROAD - 1, FAR), py(0, FAR), px(-ROAD + 1, FAR), py(0, FAR));
      ctx.lineWidth = 1.5;
      for (const x of [-ROAD + 1.6, ROAD - 1.6]) {
        const edge = ctx.createLinearGradient(0, H, 0, hy);
        edge.addColorStop(0, "rgba(111,240,216,0.55)");
        edge.addColorStop(1, "rgba(111,240,216,0)");
        ctx.strokeStyle = edge;
        ctx.beginPath();
        ctx.moveTo(px(x, NEAR), py(0, NEAR));
        ctx.lineTo(px(x, FAR), py(0, FAR));
        ctx.stroke();
      }
      const DASH = 14;
      for (let z = DASH - (camZ % DASH); z < 260; z += DASH) {
        if (z < NEAR + 0.5) continue;
        const z2 = z + 5;
        ctx.fillStyle = `rgba(255,197,110,${0.65 * (1 - fogAt(z) * 1.6)})`;
        quad(ctx, px(-0.15, z), py(0, z), px(0.15, z), py(0, z), px(0.15, z2), py(0, z2), px(-0.15, z2), py(0, z2));
      }

      // Buildings, far to near, so nearer ones cover farther ones.
      const visible: { b: Building; rel: number }[] = [];
      for (const b of STREET) {
        let rel = (((b.z - camZ) % LENGTH) + LENGTH) % LENGTH;
        if (rel > LENGTH - b.d) rel -= LENGTH; // straddling the camera
        if (rel + b.d > NEAR && rel < FAR) visible.push({ b, rel });
      }
      visible.sort((a, c) => c.rel - a.rel);

      // Streetlights and cars are interleaved with buildings by depth.
      const LAMP = 32;
      const lamps: number[] = [];
      for (let z = LAMP - (camZ % LAMP); z < 300; z += LAMP) if (z > NEAR + 1) lamps.push(z);
      let li = lamps.length - 1;
      const drawLampsBeyond = (limit: number) => {
        while (li >= 0 && lamps[li] > limit) {
          drawLamp(lamps[li]);
          li--;
        }
      };
      const drawLamp = (z: number) => {
        const fade = (1 - fogAt(z)) * (0.35 + 0.65 * nearFade(z));
        for (const side of [-1, 1]) {
          const x = side * (ROAD - 0.6);
          ctx.strokeStyle = `rgba(20,70,76,${fade})`;
          ctx.lineWidth = Math.max(1, (0.25 * f) / z);
          ctx.beginPath();
          ctx.moveTo(px(x, z), py(0, z));
          ctx.lineTo(px(x, z), py(8, z));
          ctx.lineTo(px(x - side * 1.6, z), py(8.3, z));
          ctx.stroke();
          const s = Math.min(160, (5 * f) / z);
          ctx.globalAlpha = 0.75 * fade;
          ctx.drawImage(glow, px(x - side * 1.6, z) - s / 2, py(8.2, z) - s / 2, s, s);
          // A pool of light on the road below.
          ctx.globalAlpha = 0.18 * fade;
          ctx.drawImage(glow, px(x - side * 2.4, z) - s, py(0, z) - s * 0.18, s * 2, s * 0.36);
          ctx.globalAlpha = 1;
        }
      };

      for (const { b, rel } of visible) {
        drawLampsBeyond(rel + b.d);
        drawBuilding(b, rel);
      }
      drawLampsBeyond(0);

      for (const c of cars) {
        if (c.z < NEAR + 1 || c.z > FAR * 0.7) continue;
        const fade = (1 - fogAt(c.z)) * nearFade(c.z);
        const s = Math.min(70, ((c.head ? 3.2 : 2.2) * f) / c.z);
        ctx.globalAlpha = fade;
        for (const dx of [-0.75, 0.75]) ctx.drawImage(c.head ? headGlow : tailGlow, px(c.lane + dx, c.z) - s / 2, py(0.8, c.z) - s / 2, s, s);
        ctx.globalAlpha = 1;
      }

      function drawBuilding(b: Building, rel: number) {
        const zn = Math.max(rel, NEAR);
        const zf = rel + b.d;
        const inner = b.side * b.x; // the face along the road
        const outer = b.side * (b.x + b.w);
        const fog = fogAt(zn);
        const base = 6 + b.tone * 8;
        const front = `rgb(${mix(base - 2, SKY_FOG[0], fog)},${mix(base + 18, SKY_FOG[1], fog)},${mix(base + 24, SKY_FOG[2], fog)})`;
        const sideLit = `rgb(${mix(base + 4, SKY_FOG[0], fog)},${mix(base + 32, SKY_FOG[1], fog)},${mix(base + 38, SKY_FOG[2], fog)})`;

        // The face along the road catches the streetlights, so it's a touch lighter.
        ctx.fillStyle = sideLit;
        quad(ctx, px(inner, zn), py(0, zn), px(inner, zf), py(0, zf), px(inner, zf), py(b.h, zf), px(inner, zn), py(b.h, zn));
        if (rel >= NEAR) {
          ctx.fillStyle = front;
          const x1 = px(Math.min(inner, outer), rel);
          ctx.fillRect(x1, py(b.h, rel), px(Math.max(inner, outer), rel) - x1, py(0, rel) - py(b.h, rel));
        }
        // A faint rim along the roofline.
        ctx.strokeStyle = `rgba(111,240,216,${0.22 * (1 - fog)})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(px(inner, zf), py(b.h, zf));
        ctx.lineTo(px(inner, zn), py(b.h, zn));
        if (rel >= NEAR) ctx.lineTo(px(outer, rel), py(b.h, rel));
        ctx.stroke();

        if (zn > (small ? 200 : 280)) return; // too far for windows to read
        // On narrow screens the buildings sit behind the text, so their windows glow less.
        const alpha = (small ? 0.45 : 0.75) * (1 - fog * 1.15) * nearFade(zn);
        if (alpha <= 0) return;
        const rowH = b.h / b.rows;
        const warm = `rgba(255,201,130,${alpha})`;
        const cool = `rgba(143,245,226,${alpha * 0.7})`;
        // Windows on the front.
        if (rel >= NEAR) {
          const colW = b.w / b.cols;
          const scale = f / rel;
          for (let r = 0; r < b.rows; r++) {
            for (let c = 0; c < b.cols; c++) {
              const v = b.win[r * (b.cols + b.sideCols) + c];
              if (!v) continue;
              ctx.fillStyle = v === 1 ? warm : cool;
              const wx = Math.min(inner, outer) + (c + 0.25) * colW;
              ctx.fillRect(px(wx, rel), py((r + 0.75) * rowH, rel), colW * 0.5 * scale, rowH * 0.45 * scale);
            }
          }
        }
        // Windows along the road, in perspective.
        const colD = b.d / b.sideCols;
        for (let c = 0; c < b.sideCols; c++) {
          const z0 = rel + (c + 0.2) * colD;
          const z1 = z0 + colD * 0.55;
          if (z0 < 8) continue;
          const winAlpha = nearFade(z0);
          if (winAlpha < 1) ctx.globalAlpha = winAlpha;
          const x0 = px(inner, z0);
          const x1 = px(inner, z1);
          for (let r = 0; r < b.rows; r++) {
            const v = b.win[r * (b.cols + b.sideCols) + b.cols + c];
            if (!v) continue;
            const yb = (r + 0.3) * rowH;
            const yt = yb + rowH * 0.45;
            ctx.fillStyle = v === 1 ? warm : cool;
            quad(ctx, x0, py(yb, z0), x1, py(yb, z1), x1, py(yt, z1), x0, py(yt, z0));
          }
          ctx.globalAlpha = 1;
        }
      }
    };

    let frame = 0;
    let last = performance.now();
    const loop = (now: number) => {
      frame = requestAnimationFrame(loop);
      const dt = Math.min(0.05, (now - last) / 1000);
      // About 40 frames a second is plenty for a slow glide, and kinder to batteries.
      if (dt < 1 / 42) return;
      last = now;
      boost *= Math.pow(0.12, dt);
      arrival = Math.max(0, arrival - dt / ARRIVAL_S);
      const v = SPEED + boost + ARRIVAL_SPEED * arrival * arrival;
      camZ += v * dt;
      camX += (targetX - camX) * Math.min(1, dt * 2.5);
      camLift += (targetLift - camLift) * Math.min(1, dt * 2.5);
      for (const c of cars) {
        c.z += c.speed * dt - v * dt;
        if (c.z < NEAR) c.z += FAR * 0.7;
        if (c.z > FAR * 0.7) c.z -= FAR * 0.7 - NEAR;
      }
      draw();
    };

    const onPointer = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      targetX = (e.clientX / W - 0.5) * 5;
      targetLift = (0.5 - e.clientY / H) * 2.5;
    };
    let lastY = window.scrollY;
    const onScroll = () => {
      boost = Math.min(30, boost + Math.abs(window.scrollY - lastY) * 0.08);
      lastY = window.scrollY;
    };
    const onVisibility = () => {
      cancelAnimationFrame(frame);
      if (document.visibilityState === "visible" && !still) {
        last = performance.now();
        frame = requestAnimationFrame(loop);
      }
    };

    resize();
    window.addEventListener("resize", resize);
    if (still) {
      draw();
    } else {
      window.addEventListener("pointermove", onPointer, { passive: true });
      window.addEventListener("scroll", onScroll, { passive: true });
      document.addEventListener("visibilitychange", onVisibility);
      frame = requestAnimationFrame(loop);
    }
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onPointer);
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  return <canvas ref={ref} aria-hidden="true" className="city-flight absolute inset-0 h-full w-full" />;
}

function makeGlow(core: string, edge: string) {
  const c = document.createElement("canvas");
  c.width = c.height = 64;
  const g = c.getContext("2d")!;
  const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  grad.addColorStop(0, `rgba(${core},1)`);
  grad.addColorStop(0.25, `rgba(${edge},0.55)`);
  grad.addColorStop(1, `rgba(${edge},0)`);
  g.fillStyle = grad;
  g.fillRect(0, 0, 64, 64);
  return c;
}

function quad(ctx: CanvasRenderingContext2D, ...p: number[]) {
  ctx.beginPath();
  ctx.moveTo(p[0], p[1]);
  for (let i = 2; i < p.length; i += 2) ctx.lineTo(p[i], p[i + 1]);
  ctx.closePath();
  ctx.fill();
}

/** City Hall at the vanishing point: a lit dome on a colonnade, with a flag. */
function drawCityHall(
  ctx: CanvasRenderingContext2D,
  px: (x: number, z: number) => number,
  py: (y: number, z: number) => number,
  z: number,
  f: number,
) {
  const s = f / z;
  ctx.fillStyle = "rgb(12,54,62)";
  ctx.fillRect(px(-24, z), py(16, z), 48 * s, 16 * s);
  quad(ctx, px(-27, z), py(16, z), px(0, z), py(26, z), px(27, z), py(16, z));
  ctx.fillRect(px(-8, z), py(34, z), 16 * s, 9 * s);
  ctx.beginPath();
  ctx.ellipse(px(0, z), py(34, z), 8.5 * s, 9 * s, 0, Math.PI, 0);
  ctx.fill();
  ctx.fillRect(px(-0.25, z), py(52, z), 0.5 * s, 9 * s);
  ctx.fillStyle = "rgba(255,197,110,0.9)";
  quad(ctx, px(0.25, z), py(52, z), px(5, z), py(50.6, z), px(0.25, z), py(49.2, z));
  // Lit windows between the columns, and the glowing drum of the dome.
  ctx.fillStyle = "rgba(255,197,110,0.35)";
  for (let i = -5; i <= 4; i++) ctx.fillRect(px(i * 4.4 + 0.9, z), py(13, z), 2 * s, 11 * s);
  ctx.fillStyle = "rgba(255,216,138,0.75)";
  ctx.fillRect(px(-2.4, z), py(32, z), 4.8 * s, 5 * s);
}
