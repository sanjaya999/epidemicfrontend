import { ModelType, SimulationData } from "@/types/simulation";
import { InterventionEvent } from "@/services/intervention.service";

export type DotState = "S" | "E" | "I" | "R";

export interface Dot {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  homeX: number;
  homeY: number;
  state: DotState;
  /** Day the dot entered its current state. */
  stateSince: number;
  /** Frozen at home for the duration of a distancing window. */
  staysHome: boolean;
  /** Immune marker (teal ring). Still counted as Susceptible for data fidelity. */
  vaccinated: boolean;
  /** Frozen + ringed while a quarantine window is active. */
  isolated: boolean;
}

export interface CompartmentCounts {
  S: number;
  E: number;
  I: number;
  R: number;
}

/** Visual behavior derived from a backend intervention event. */
export type EventVisual =
  | { kind: "distancing"; index: number; day: number; endDay: number; fraction: number; label: string }
  | { kind: "vaccination"; index: number; day: number; fraction: number; label: string }
  | { kind: "quarantine"; index: number; day: number; endDay: number; label: string }
  | { kind: "slowdown"; index: number; day: number; endDay: number; fraction: number; label: string };

/** Deterministic PRNG (mulberry32) so a replay is reproducible for a given seed. */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Map a backend intervention event (whose `type`/`label`/`math_effect` are only
 * known at runtime) onto a dot-level visual behavior via keyword matching.
 */
export function classifyEvent(event: InterventionEvent, index: number): EventVisual {
  const text = `${event.type} ${event.label} ${event.math_effect}`.toLowerCase();
  const fraction = Math.min(1, Math.max(0, (event.intensity ?? 0) / 100));
  const label = event.label || event.type;

  if (/vaccin|immun/.test(text)) {
    return { kind: "vaccination", index, day: event.day, fraction, label };
  }
  if (/quarantin|isolat/.test(text)) {
    return { kind: "quarantine", index, day: event.day, endDay: event.end_day, label };
  }
  if (/distanc|lockdown|stay.?home|closure|gather|school|work.?from/.test(text)) {
    return { kind: "distancing", index, day: event.day, endDay: event.end_day, fraction, label };
  }
  if (/mask|travel|screen|test|hygiene|beta/.test(text)) {
    return { kind: "slowdown", index, day: event.day, endDay: event.end_day, fraction, label };
  }
  // Default: treat unknown interventions as a contact-reduction (slowdown) visual.
  return { kind: "slowdown", index, day: event.day, endDay: event.end_day, fraction, label };
}

export interface DotReplayEngineOptions {
  data: SimulationData;
  modelType: ModelType;
  population: number;
  initialInfected: number;
  initialExposed?: number | null;
  events?: InterventionEvent[];
  dotCount: number;
  width: number;
  height: number;
  seed?: number;
}

/**
 * Replay a saved SIR/SEIR simulation as moving dots. The number of dots in each
 * compartment is driven to match the saved daily curve exactly; *which* dots
 * transition is chosen to look contact-driven (new infections happen near
 * infectious dots), and intervention events are rendered as dot behaviors.
 */
export class DotReplayEngine {
  readonly totalDays: number;
  readonly dotCount: number;
  readonly modelType: ModelType;
  /** Logical world size; renderer maps this onto the canvas. */
  width: number;
  height: number;
  /** Current integer day that has been applied (0 = initial state). */
  day = 0;

  dots: Dot[] = [];
  visuals: EventVisual[] = [];
  /** Movement multiplier from active slowdown windows (1 = full speed). */
  speedFactor = 1;

  private data: SimulationData;
  private population: number;
  private initialInfected: number;
  private initialExposed: number;
  private events: InterventionEvent[];
  private seed: number;
  private rng: () => number;
  /** Stable per-visual set of dot ids held at home during distancing windows. */
  private distancingSets = new Map<number, Set<number>>();

  constructor(opts: DotReplayEngineOptions) {
    this.data = opts.data;
    this.modelType = opts.modelType;
    this.population = opts.population;
    this.initialInfected = opts.initialInfected;
    this.initialExposed = opts.initialExposed ?? 0;
    this.events = opts.events ?? [];
    this.dotCount = opts.dotCount;
    this.width = opts.width;
    this.height = opts.height;
    this.seed = opts.seed ?? 1337;
    this.totalDays = Math.max(0, opts.data.days.length - 1);
    this.visuals = this.events.map((e, i) => classifyEvent(e, i));
    this.rng = mulberry32(this.seed);
    this.reset();
  }

  /** People represented by a single dot. */
  get peoplePerDot(): number {
    return this.dotCount > 0 ? Math.round(this.population / this.dotCount) : 0;
  }

  /** Dot radius in logical units, adapted to density. */
  get radius(): number {
    const area = this.width * this.height;
    const r = Math.sqrt(area / this.dotCount) * 0.32;
    return Math.min(10, Math.max(3, r));
  }

  /** Base speed in logical units / second. */
  get baseSpeed(): number {
    return Math.min(this.width, this.height) * 0.09;
  }

  /** Re-seed and rebuild the initial (day 0) state deterministically. */
  reset(): void {
    this.rng = mulberry32(this.seed);
    this.day = 0;
    this.speedFactor = 1;
    this.distancingSets.clear();
    this.dots = this.buildDots();
  }

  /** Replay from day 0 up to (and including) the given day. Used for scrubbing. */
  rebuildToDay(target: number): void {
    this.reset();
    const clamped = Math.min(Math.max(0, target), this.totalDays);
    for (let d = 1; d <= clamped; d++) this.stepDay();
  }

  /** Advance the replay by one day, applying exact compartment transitions + event visuals. */
  stepDay(): void {
    if (this.day >= this.totalDays) return;
    this.day += 1;
    const d = this.day;

    // Targets are in DOT units (the backend curve is in raw people). Susceptible is
    // derived so the four compartments always sum to exactly the dot total.
    const targetI = this.targetInfectedDots(d);
    const targetE = this.modelType === "SEIR" ? this.targetExposedDots(d) : 0;
    const targetR = this.targetRecoveredDots(d);
    const targetS = Math.max(0, this.dotCount - targetI - targetE - targetR);

    const cur = this.counts();

    if (this.modelType === "SEIR") {
      const fSE = Math.max(0, cur.S - targetS); // S -> E
      const fEI = Math.max(0, cur.E + fSE - targetE); // E -> I
      const fIR = Math.max(0, cur.I + fEI - targetI); // I -> R
      this.infectClosest(fSE, "E");
      this.progressOldest("E", "I", fEI);
      this.progressOldest("I", "R", fIR);
    } else {
      const fSI = Math.max(0, cur.S - targetS); // S -> I
      const fIR = Math.max(0, cur.I + fSI - targetI); // I -> R
      this.infectClosest(fSI, "I");
      this.progressOldest("I", "R", fIR);
    }

    this.reconcile(targetS, targetE, targetI, targetR);
    this.applyEventVisualsForDay(d);
  }

  /** Current compartment counts derived from the dots. */
  counts(): CompartmentCounts {
    const c: CompartmentCounts = { S: 0, E: 0, I: 0, R: 0 };
    for (const dot of this.dots) c[dot.state] += 1;
    return c;
  }

  /** Visuals whose window includes the given day (for the HUD / timeline). */
  visualsActiveOn(d: number): EventVisual[] {
    return this.visuals.filter((v) => {
      const end = v.kind === "vaccination" ? this.totalDays : v.endDay;
      return d >= v.day && d <= end;
    });
  }

  /** Advance physics by dt seconds. Called every animation frame. */
  updateMotion(dt: number): void {
    const r = this.radius;
    const speed = this.baseSpeed * this.speedFactor;
    const w = this.width;
    const h = this.height;

    for (const dot of this.dots) {
      if (dot.staysHome) {
        dot.x = dot.homeX;
        dot.y = dot.homeY;
        continue;
      }
      if (dot.isolated) continue;

      dot.x += dot.vx * speed * dt;
      dot.y += dot.vy * speed * dt;

      if (dot.x < r) {
        dot.x = r;
        dot.vx = Math.abs(dot.vx);
      } else if (dot.x > w - r) {
        dot.x = w - r;
        dot.vx = -Math.abs(dot.vx);
      }
      if (dot.y < r) {
        dot.y = r;
        dot.vy = Math.abs(dot.vy);
      } else if (dot.y > h - r) {
        dot.y = h - r;
        dot.vy = -Math.abs(dot.vy);
      }
    }

    this.collide(r);
  }

  /** Rescale the logical world (and dot positions) to a new canvas size. */
  resize(width: number, height: number): void {
    if (width <= 0 || height <= 0) return;
    const sx = width / this.width;
    const sy = height / this.height;
    for (const dot of this.dots) {
      dot.x *= sx;
      dot.y *= sy;
      dot.homeX *= sx;
      dot.homeY *= sy;
    }
    this.width = width;
    this.height = height;
  }

  // ---------------------------------------------------------------- internals

  private rawAt(arr: number[] | null | undefined, d: number): number {
    if (!arr) return 0;
    return arr[Math.min(d, arr.length - 1)] ?? 0;
  }

  /** Convert a raw population count into (fractional) dot units. */
  private scale(real: number): number {
    return (real * this.dotCount) / Math.max(1, this.population);
  }

  /**
   * Target number of infected dots on day d. The backend curve is in raw people,
   * which can be far below one dot for large populations (e.g. 100 infected out of
   * 1M = 0.04 dots). Keep patient zero visible while the backend still reports at
   * least one infected person — comparing against the initial seed fails for SEIR
   * curves, which dip below the seed while the exposed pool incubates.
   */
  private targetInfectedDots(d: number): number {
    const real = this.rawAt(this.data.infected, d);
    let t = Math.round(this.scale(real));
    if (t === 0 && real >= 1) t = 1;
    return t;
  }

  private targetExposedDots(d: number): number {
    return Math.round(this.scale(this.rawAt(this.data.exposed, d)));
  }

  private targetRecoveredDots(d: number): number {
    return Math.round(this.scale(this.rawAt(this.data.recovered, d)));
  }

  private buildDots(): Dot[] {
    const n = this.dotCount;
    const dots: Dot[] = [];
    const margin = this.radius;

    for (let i = 0; i < n; i++) {
      const angle = this.rng() * Math.PI * 2;
      const jitter = 0.7 + this.rng() * 0.6;
      dots.push({
        id: i,
        x: margin + this.rng() * (this.width - margin * 2),
        y: margin + this.rng() * (this.height - margin * 2),
        vx: Math.cos(angle) * jitter,
        vy: Math.sin(angle) * jitter,
        homeX: 0,
        homeY: 0,
        state: "S",
        stateSince: 0,
        staysHome: false,
        vaccinated: false,
        isolated: false,
      });
    }

    // Seed the outbreak near the center so spread radiates outward.
    const cx = this.width / 2;
    const cy = this.height / 2;
    const byDist = [...dots].sort(
      (a, b) => (a.x - cx) ** 2 + (a.y - cy) ** 2 - ((b.x - cx) ** 2 + (b.y - cy) ** 2)
    );

    // Seed from the same dot-scaled targets used during playback so day 0 is
    // consistent with day 1 (patient zero stays visible, never instantly recovered).
    let infectedTarget = this.targetInfectedDots(0);
    if (this.initialInfected > 0) infectedTarget = Math.max(1, infectedTarget);
    const exposedTarget = this.modelType === "SEIR" ? this.targetExposedDots(0) : 0;

    let cursor = 0;
    for (let i = 0; i < infectedTarget && cursor < byDist.length; i++, cursor++) {
      byDist[cursor].state = "I";
      byDist[cursor].stateSince = 0;
    }
    for (let i = 0; i < exposedTarget && cursor < byDist.length; i++, cursor++) {
      byDist[cursor].state = "E";
      byDist[cursor].stateSince = 0;
    }

    return dots;
  }

  /** Convert the `count` susceptibles closest to infectious dots (contact-plausible). */
  private infectClosest(count: number, to: "E" | "I"): void {
    if (count <= 0) return;
    const susceptible = this.dots.filter((d) => d.state === "S");
    if (susceptible.length === 0) return;
    const infectious = this.dots.filter((d) => d.state === "I");

    const take = Math.min(count, susceptible.length);

    if (infectious.length === 0) {
      // No infectious dots (edge case): fall back to random selection.
      for (let i = 0; i < take; i++) {
        const idx = Math.floor(this.rng() * susceptible.length);
        this.transition(susceptible.splice(idx, 1)[0], to);
      }
      return;
    }

    // Score each susceptible dot by distance to its nearest infectious neighbor,
    // with multiplicative noise so the pick is contact-driven but not deterministic.
    const scored = susceptible.map((dot) => {
      let best = Infinity;
      for (const inf of infectious) {
        const dx = dot.x - inf.x;
        const dy = dot.y - inf.y;
        const dist = dx * dx + dy * dy;
        if (dist < best) best = dist;
      }
      return { dot, score: best * (0.4 + this.rng() * 1.2) };
    });
    scored.sort((a, b) => a.score - b.score);

    for (let i = 0; i < take; i++) this.transition(scored[i].dot, to);
  }

  /** Progress the `count` dots that have spent the longest in `from`. */
  private progressOldest(from: DotState, to: DotState, count: number): void {
    if (count <= 0) return;
    const candidates = this.dots
      .filter((d) => d.state === from)
      .sort((a, b) => a.stateSince - b.stateSince);
    const take = Math.min(count, candidates.length);
    for (let i = 0; i < take; i++) this.transition(candidates[i], to);
  }

  /**
   * Force the compartment counts to match the saved curve exactly, correcting any
   * rounding drift left over after the nominal flows. Adjusts one dot at a time.
   */
  private reconcile(targetS: number, targetE: number, targetI: number, targetR: number): void {
    // Recovered only ever grows: fill any shortfall first so the surplus checks
    // below see the adjusted counts.
    let cur = this.counts();
    const deficitR = targetR - cur.R;
    if (deficitR > 0) this.progressOldest("I", "R", deficitR);

    // Susceptible only ever decreases: convert any surplus S forward.
    cur = this.counts();
    const surplusS = cur.S - targetS;
    if (surplusS > 0) {
      this.infectClosest(surplusS, this.modelType === "SEIR" ? "E" : "I");
    }

    if (this.modelType === "SEIR") {
      cur = this.counts();
      const surplusE = cur.E - targetE;
      if (surplusE > 0) this.progressOldest("E", "I", surplusE);
    }

    cur = this.counts();
    const surplusI = cur.I - targetI;
    if (surplusI > 0) this.progressOldest("I", "R", surplusI);

    // If Infectious is short (e.g. Recovered overshot after the curve dropped
    // sharply), refill from the oldest Exposed, then from Susceptible.
    cur = this.counts();
    const deficitI = targetI - cur.I;
    if (deficitI > 0) {
      const fromE = this.modelType === "SEIR" ? Math.min(deficitI, cur.E) : 0;
      if (fromE > 0) this.progressOldest("E", "I", fromE);
      if (deficitI > fromE) this.infectClosest(deficitI - fromE, "I");
    }

    // If Exposed is short (possibly after the Infectious refill), top up from S.
    if (this.modelType === "SEIR") {
      cur = this.counts();
      const deficitE = targetE - cur.E;
      if (deficitE > 0) this.infectClosest(deficitE, "E");
    }
  }

  private transition(dot: Dot, to: DotState): void {
    dot.state = to;
    dot.stateSince = this.day;
    if (to !== "I") dot.isolated = false;
  }

  /** Apply intervention visuals for the given day (idempotent per day). */
  private applyEventVisualsForDay(d: number): void {
    // Reset transient per-day flags, then re-apply active windows.
    for (const dot of this.dots) {
      dot.staysHome = false;
      dot.isolated = false;
    }

    let speed = 1;

    for (const v of this.visuals) {
      if (v.kind === "vaccination") {
        if (d === v.day) this.vaccinate(v.fraction);
        continue;
      }

      const active = d >= v.day && d <= v.endDay;
      if (!active) continue;

      if (v.kind === "distancing") {
        let set = this.distancingSets.get(v.index);
        if (!set) {
          set = this.pickDistancingSet(v.fraction);
          this.distancingSets.set(v.index, set);
        }
        for (const id of set) {
          const dot = this.dots[id];
          if (!dot) continue;
          if (!dot.staysHome) {
            dot.homeX = dot.x;
            dot.homeY = dot.y;
          }
          dot.staysHome = true;
        }
      } else if (v.kind === "quarantine") {
        for (const dot of this.dots) {
          if (dot.state === "I") dot.isolated = true;
        }
      } else if (v.kind === "slowdown") {
        speed = Math.min(speed, 1 - v.fraction);
      }
    }

    this.speedFactor = Math.max(0.05, speed);
  }

  /** Mark `fraction` of current susceptibles as vaccinated (teal ring). */
  private vaccinate(fraction: number): void {
    const susceptible = this.dots.filter((d) => d.state === "S" && !d.vaccinated);
    const count = Math.min(susceptible.length, Math.round(susceptible.length * fraction));
    for (let i = 0; i < count; i++) {
      const idx = Math.floor(this.rng() * susceptible.length);
      susceptible.splice(idx, 1)[0].vaccinated = true;
    }
  }

  /** Choose a stable set of dot ids to hold at home for a distancing window. */
  private pickDistancingSet(fraction: number): Set<number> {
    const set = new Set<number>();
    const target = Math.round(this.dotCount * fraction);
    const ids = this.dots.map((d) => d.id);
    // Fisher–Yates shuffle, take the first `target`.
    for (let i = ids.length - 1; i > 0; i--) {
      const j = Math.floor(this.rng() * (i + 1));
      [ids[i], ids[j]] = [ids[j], ids[i]];
    }
    for (let i = 0; i < target && i < ids.length; i++) set.add(ids[i]);
    return set;
  }

  /** Lightweight grid-based elastic collisions between moving dots. */
  private collide(r: number): void {
    const cell = r * 2.5;
    const cols = Math.max(1, Math.ceil(this.width / cell));
    const grid = new Map<number, Dot[]>();

    const key = (cx: number, cy: number) => cy * cols + cx;

    for (const dot of this.dots) {
      if (dot.staysHome || dot.isolated) continue;
      const cx = Math.min(cols - 1, Math.max(0, Math.floor(dot.x / cell)));
      const cy = Math.min(
        Math.max(1, Math.ceil(this.height / cell)) - 1,
        Math.max(0, Math.floor(dot.y / cell))
      );
      const k = key(cx, cy);
      const bucket = grid.get(k);
      if (bucket) bucket.push(dot);
      else grid.set(k, [dot]);
    }

    const minD = r * 2;
    const minD2 = minD * minD;

    for (const [k, bucket] of grid) {
      const cy = Math.floor(k / cols);
      const cx = k - cy * cols;
      const neighbors: Dot[] = [];
      for (let oy = 0; oy <= 1; oy++) {
        for (let ox = -1; ox <= 1; ox++) {
          if (oy === 0 && ox < 0) continue;
          const nk = key(
            Math.min(cols - 1, Math.max(0, cx + ox)),
            Math.min(Math.max(1, Math.ceil(this.height / cell)) - 1, Math.max(0, cy + oy))
          );
          const nb = grid.get(nk);
          if (nb) neighbors.push(...nb);
        }
      }
      for (const a of bucket) {
        for (const b of neighbors) {
          if (a.id >= b.id) continue;
          const dx = b.x - a.x;
          const dy = b.y - a.y;
          const d2 = dx * dx + dy * dy;
          if (d2 >= minD2 || d2 === 0) continue;
          const d = Math.sqrt(d2);
          const nx = dx / d;
          const ny = dy / d;
          // Separate overlap.
          const overlap = (minD - d) / 2;
          a.x -= nx * overlap;
          a.y -= ny * overlap;
          b.x += nx * overlap;
          b.y += ny * overlap;
          // Swap velocity components along the collision normal (equal mass).
          const aDotN = a.vx * nx + a.vy * ny;
          const bDotN = b.vx * nx + b.vy * ny;
          a.vx += (bDotN - aDotN) * nx;
          a.vy += (bDotN - aDotN) * ny;
          b.vx += (aDotN - bDotN) * nx;
          b.vy += (aDotN - bDotN) * ny;
        }
      }
    }
  }
}
