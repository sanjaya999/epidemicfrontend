"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Play, Pause, RotateCcw, Gauge, Home, Syringe, Shield } from "lucide-react";
import { DotReplayEngine, EventVisual } from "@/lib/dot-engine";
import { SimulationStats } from "@/types/simulation";
import { cn } from "@/lib/utils";

interface DotCanvasProps {
  engine: DotReplayEngine;
  stats: SimulationStats;
}

const SPEEDS = [0.5, 1, 2, 4, 8];

interface Palette {
  S: string;
  E: string;
  I: string;
  R: string;
  grid: string;
  muted: string;
  vaccine: string;
}

function resolvePalette(): Palette {
  const cs = getComputedStyle(document.documentElement);
  const get = (name: string, fallback: string) => cs.getPropertyValue(name).trim() || fallback;
  return {
    S: get("--color-susceptible", "#3b82f6"),
    E: get("--color-exposed", "#f59e0b"),
    I: get("--color-infected", "#ef4444"),
    R: get("--color-recovered", "#22c55e"),
    grid: get("--border", "#e5e5e5"),
    muted: get("--muted-foreground", "#888888"),
    vaccine: "#14b8a6",
  };
}

const VISUAL_META: Record<EventVisual["kind"], { icon: typeof Home; color: string; label: string }> = {
  distancing: { icon: Home, color: "#8b5cf6", label: "Distancing" },
  vaccination: { icon: Syringe, color: "#14b8a6", label: "Vaccination" },
  quarantine: { icon: Shield, color: "#f97316", label: "Quarantine" },
  slowdown: { icon: Gauge, color: "#06b6d4", label: "Contact reduction" },
};

export function DotCanvas({ engine, stats }: DotCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef(engine);
  const paletteRef = useRef<Palette | null>(null);
  const themeClassRef = useRef<string>("");
  const sizeRef = useRef({ w: 1000, h: 600 });

  const playingRef = useRef(false);
  const speedRef = useRef(2);
  const simTimeRef = useRef(0);

  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(2);
  const [currentDay, setCurrentDay] = useState(0);
  const [ended, setEnded] = useState(false);

  const totalDays = engine.totalDays;

  // Keep refs in sync with state for the persistent rAF loop.
  useEffect(() => {
    playingRef.current = playing;
  }, [playing]);
  useEffect(() => {
    speedRef.current = speed;
  }, [speed]);

  // Reset playback when a new engine (new simulation / dot count) arrives, and
  // fit it to the canvas size measured so far.
  useEffect(() => {
    engineRef.current = engine;
    engine.resize(sizeRef.current.w, sizeRef.current.h);
    simTimeRef.current = 0;
    setCurrentDay(0);
    setPlaying(false);
    setEnded(false);
  }, [engine]);

  const draw = useCallback((ctx: CanvasRenderingContext2D, cssW: number, cssH: number) => {
    const eng = engineRef.current;
    const pal = paletteRef.current ?? resolvePalette();

    ctx.clearRect(0, 0, cssW, cssH);

    // Faint background grid for depth.
    ctx.strokeStyle = pal.grid;
    ctx.globalAlpha = 0.35;
    ctx.lineWidth = 1;
    const step = 48;
    ctx.beginPath();
    for (let x = step; x < cssW; x += step) {
      ctx.moveTo(x, 0);
      ctx.lineTo(x, cssH);
    }
    for (let y = step; y < cssH; y += step) {
      ctx.moveTo(0, y);
      ctx.lineTo(cssW, y);
    }
    ctx.stroke();
    ctx.globalAlpha = 1;

    const r = eng.radius;

    for (const dot of eng.dots) {
      // At-home bubble.
      if (dot.staysHome) {
        ctx.beginPath();
        ctx.arc(dot.x, dot.y, r * 2.1, 0, Math.PI * 2);
        ctx.strokeStyle = pal.muted;
        ctx.globalAlpha = 0.4;
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.globalAlpha = 1;
      }

      const color =
        dot.state === "S" ? pal.S : dot.state === "E" ? pal.E : dot.state === "I" ? pal.I : pal.R;

      // Infected halo (soft glow) to draw the eye to active spread.
      if (dot.state === "I") {
        ctx.beginPath();
        ctx.arc(dot.x, dot.y, r * 2.4, 0, Math.PI * 2);
        ctx.fillStyle = pal.I;
        ctx.globalAlpha = 0.14;
        ctx.fill();
        ctx.globalAlpha = 1;
      }

      ctx.beginPath();
      ctx.arc(dot.x, dot.y, r, 0, Math.PI * 2);
      ctx.fillStyle = color;
      // Exposed dots read as "carrying but not yet infectious" — slightly translucent.
      ctx.globalAlpha = dot.state === "E" ? 0.55 : 1;
      ctx.fill();
      ctx.globalAlpha = 1;

      // Vaccinated marker ring.
      if (dot.vaccinated) {
        ctx.beginPath();
        ctx.arc(dot.x, dot.y, r + 2, 0, Math.PI * 2);
        ctx.strokeStyle = pal.vaccine;
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }

      // Quarantine ring.
      if (dot.isolated) {
        ctx.beginPath();
        ctx.arc(dot.x, dot.y, r + 2.5, 0, Math.PI * 2);
        ctx.strokeStyle = "#f97316";
        ctx.lineWidth = 1.5;
        ctx.setLineDash([3, 2]);
        ctx.stroke();
        ctx.setLineDash([]);
      }
    }
  }, []);

  // Main animation loop: motion every frame, disease steps at `speed` days/sec.
  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    let last = performance.now();
    let cssW = 0;
    let cssH = 0;

    const fit = () => {
      const rect = wrap.getBoundingClientRect();
      cssW = Math.max(1, rect.width);
      cssH = Math.max(1, rect.height);
      const dpr = window.devicePixelRatio || 1;
      canvas.width = Math.round(cssW * dpr);
      canvas.height = Math.round(cssH * dpr);
      canvas.style.width = `${cssW}px`;
      canvas.style.height = `${cssH}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      sizeRef.current = { w: cssW, h: cssH };
      engineRef.current.resize(cssW, cssH);
    };

    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(wrap);

    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;

      // Re-resolve palette if the theme class changed (light/dark).
      const themeClass = document.documentElement.className;
      if (!paletteRef.current || themeClass !== themeClassRef.current) {
        paletteRef.current = resolvePalette();
        themeClassRef.current = themeClass;
      }

      const eng = engineRef.current;

      // Dots keep mingling even while paused — only the disease clock stops.
      eng.updateMotion(dt);

      if (playingRef.current) {
        simTimeRef.current += dt * speedRef.current;
        let stepped = false;
        while (simTimeRef.current >= 1 && eng.day < eng.totalDays) {
          eng.stepDay();
          simTimeRef.current -= 1;
          stepped = true;
        }
        if (stepped) setCurrentDay(eng.day);
        if (eng.day >= eng.totalDays) {
          playingRef.current = false;
          setPlaying(false);
          setEnded(true);
        }
      }

      draw(ctx, cssW, cssH);
      raf = requestAnimationFrame(loop);
    };

    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [draw]);

  const handleScrub = (value: number) => {
    const eng = engineRef.current;
    simTimeRef.current = 0;
    eng.rebuildToDay(value);
    setCurrentDay(eng.day);
    setEnded(eng.day >= eng.totalDays);
  };

  const togglePlay = () => {
    if (ended) {
      handleScrub(0);
      setEnded(false);
      setPlaying(true);
      return;
    }
    setPlaying((p) => !p);
  };

  const handleRestart = () => {
    handleScrub(0);
    setEnded(false);
    setPlaying(true);
  };

  const counts = engine.counts();
  const activeVisuals = engine.visualsActiveOn(currentDay);
  const population = counts.S + counts.E + counts.I + counts.R;

  const compartmentChip = (label: string, value: number, colorVar: string) => (
    <div className="flex items-center gap-2 px-3 py-1.5 border border-border rounded-md bg-background/60">
      <span className="w-2.5 h-2.5 rounded-full" style={{ background: `var(${colorVar})` }} />
      <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{label}</span>
      <span className="text-sm font-semibold tabular-nums">{value.toLocaleString()}</span>
      <span className="text-[10px] text-muted-foreground tabular-nums">
        {population > 0 ? Math.round((value / population) * 100) : 0}%
      </span>
    </div>
  );

  return (
    <div className="flex flex-col gap-4">
      {/* Canvas stage */}
      <div
        ref={wrapRef}
        className="relative w-full h-[480px] border border-border rounded-xl overflow-hidden bg-card"
      >
        <canvas ref={canvasRef} className="block w-full h-full" />

        {/* Day counter */}
        <div className="absolute top-4 left-4 pointer-events-none select-none">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Day</p>
          <p className="text-4xl font-bold tabular-nums leading-none">
            {currentDay}
            <span className="text-base font-medium text-muted-foreground"> / {totalDays}</span>
          </p>
        </div>

        {/* Active intervention chips */}
        {activeVisuals.length > 0 && (
          <div className="absolute top-4 right-4 flex flex-col items-end gap-1.5 pointer-events-none">
            {activeVisuals.map((v) => {
              const meta = VISUAL_META[v.kind];
              const Icon = meta.icon;
              return (
                <div
                  key={v.index}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold text-white shadow-sm"
                  style={{ background: meta.color }}
                >
                  <Icon className="w-3 h-3" />
                  {v.label}
                </div>
              );
            })}
          </div>
        )}

        {/* End-of-run summary */}
        {ended && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/70 backdrop-blur-[2px]">
            <div className="p-8 border border-border rounded-2xl bg-card shadow-lg text-center space-y-4 max-w-sm">
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
                Outbreak over
              </p>
              <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                <div>
                  <p className="text-2xl font-bold tabular-nums">{stats.peak_day}</p>
                  <p className="text-[11px] text-muted-foreground uppercase tracking-widest">Peak day</p>
                </div>
                <div>
                  <p className="text-2xl font-bold tabular-nums">{stats.peak_infected.toLocaleString()}</p>
                  <p className="text-[11px] text-muted-foreground uppercase tracking-widest">Peak infected</p>
                </div>
                <div className="col-span-2">
                  <p className="text-2xl font-bold tabular-nums">{stats.total_infected.toLocaleString()}</p>
                  <p className="text-[11px] text-muted-foreground uppercase tracking-widest">Total infected</p>
                </div>
              </div>
              <button
                onClick={handleRestart}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
              >
                <RotateCcw className="w-4 h-4" /> Replay
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Timeline with event markers */}
      <div className="relative px-1">
        <div className="relative h-6 flex items-center">
          <input
            type="range"
            min={0}
            max={totalDays}
            value={currentDay}
            onChange={(e) => handleScrub(Number(e.target.value))}
            className="w-full h-1.5 cursor-pointer appearance-none rounded-full bg-border accent-foreground"
            aria-label="Replay timeline"
          />
          {/* Event markers */}
          <div className="absolute inset-x-0 top-0 h-full pointer-events-none">
            {engine.visuals.map((v) => {
              const meta = VISUAL_META[v.kind];
              const left = totalDays > 0 ? (v.day / totalDays) * 100 : 0;
              return (
                <span
                  key={v.index}
                  title={`${v.label} — day ${v.day}`}
                  className="absolute top-0 w-1 h-2 rounded-sm"
                  style={{ left: `${left}%`, background: meta.color }}
                />
              );
            })}
          </div>
        </div>
      </div>

      {/* Controls + live counts */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <button
            onClick={togglePlay}
            className="inline-flex items-center justify-center w-11 h-11 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
            aria-label={playing ? "Pause" : "Play"}
          >
            {playing ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
          </button>
          <button
            onClick={handleRestart}
            className="inline-flex items-center justify-center w-9 h-9 rounded-full border border-border text-muted-foreground hover:text-foreground hover:border-foreground transition-colors"
            aria-label="Restart"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>

        {/* Speed selector */}
        <div className="flex items-center gap-1 px-1 py-1 border border-border rounded-md bg-background/60">
          <Gauge className="w-3.5 h-3.5 text-muted-foreground ml-1.5 mr-0.5" />
          {SPEEDS.map((s) => (
            <button
              key={s}
              onClick={() => setSpeed(s)}
              className={cn(
                "px-2 py-0.5 rounded text-[11px] font-semibold tabular-nums transition-colors",
                speed === s
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {s}×
            </button>
          ))}
        </div>

        <div className="flex-1" />

        {/* Live compartment counts */}
        <div className="flex flex-wrap items-center gap-2">
          {compartmentChip("S", counts.S, "--color-susceptible")}
          {engine.modelType === "SEIR" && compartmentChip("E", counts.E, "--color-exposed")}
          {compartmentChip("I", counts.I, "--color-infected")}
          {compartmentChip("R", counts.R, "--color-recovered")}
        </div>
      </div>
    </div>
  );
}
