"use client";

import { useEffect, useRef } from "react";
import type { CameraPose } from "./build-scene";

const WIDE = 760;

function cameraFor(t: number, yaw: number, reduce: boolean): CameraPose {
  const wide = window.innerWidth > WIDE;
  const a = ((yaw + (reduce ? 0 : Math.sin(t * 0.15) * 6)) * Math.PI) / 180;
  const r = wide ? 5.4 : 5.0;
  const tx = wide ? -1.25 : 0;
  return {
    pos: [Math.sin(a) * r + tx, wide ? 1.6 : 1.5, Math.cos(a) * r],
    target: [tx, wide ? 0.95 : 0.9, 0],
    fov: wide ? 30 : 34,
  };
}

export function EbunStage() {
  const stageRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const stage = stageRef.current!;
    const canvas = canvasRef.current!;
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    let cancelled = false;
    let raf = 0;
    let cleanup = () => {};

    import("./build-scene").then(({ buildScene }) => {
      if (cancelled) return;
      const size = () => {
        const r = stage.getBoundingClientRect();
        return [Math.max(1, r.width), Math.max(1, r.height)] as const;
      };

      let S: ReturnType<typeof buildScene>;
      try {
        const [w, h] = size();
        S = buildScene(canvas, { width: w, height: h, pixelRatio: Math.min(devicePixelRatio, 2), shadowSize: 1024 });
      } catch {
        document.documentElement.classList.add("no-webgl");
        return;
      }

      let yaw = -20;
      let drag: { x: number; yaw: number } | null = null;
      const t0 = performance.now();
      const frozenT = 0.3;

      const frame = (now: number) => {
        const t = reduce ? frozenT : (now - t0) / 1000;
        S.render(t, cameraFor(t, yaw, reduce));
        if (!reduce) raf = requestAnimationFrame(frame);
      };
      raf = requestAnimationFrame(frame);

      const ro = new ResizeObserver(() => {
        const [w, h] = size();
        S.resize(w, h);
        if (reduce) frame(0);
      });
      ro.observe(stage);

      const onDown = (e: PointerEvent) => {
        drag = { x: e.clientX, yaw };
        stage.setPointerCapture(e.pointerId);
      };
      const onMove = (e: PointerEvent) => {
        if (!drag) return;
        yaw = drag.yaw - (e.clientX - drag.x) * 0.35;
        if (reduce) frame(0);
      };
      const onUp = () => (drag = null);
      stage.addEventListener("pointerdown", onDown);
      stage.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp);

      cleanup = () => {
        cancelAnimationFrame(raf);
        ro.disconnect();
        stage.removeEventListener("pointerdown", onDown);
        stage.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onUp);
        S.dispose();
      };
    });

    return () => {
      cancelled = true;
      cleanup();
    };
  }, []);

  return (
    <div ref={stageRef} className="stage" aria-hidden="true">
      <canvas ref={canvasRef} />
    </div>
  );
}
