import { useEffect, useState } from "react";

function ticks(count: number, r: number, majorEvery: number, innerShort: number, innerLong: number) {
  const out: { x1: number; y1: number; x2: number; y2: number; major: boolean }[] = [];
  for (let i = 0; i < count; i += 1) {
    const a = (i / count) * Math.PI * 2 - Math.PI / 2;
    const major = i % majorEvery === 0;
    const inner = major ? innerLong : innerShort;
    out.push({
      x1: round(Math.cos(a) * inner),
      y1: round(Math.sin(a) * inner),
      x2: round(Math.cos(a) * r),
      y2: round(Math.sin(a) * r),
      major,
    });
  }
  return out;
}

function round(n: number): number {
  return Math.round(n * 100) / 100;
}

export function HudRings({ active }: { active: boolean }) {
  const outer = ticks(72, 118, 6, 110, 104);
  const inner = ticks(36, 78, 4, 72, 68);
  return (
    <svg
      viewBox="-140 -140 280 280"
      className="pointer-events-none absolute inset-0 h-full w-full"
      aria-hidden="true"
    >
      <circle r="132" fill="none" stroke="currentColor" className="text-cyan/20" strokeWidth="0.6" />
      <circle r="96" fill="none" stroke="currentColor" className="text-cyan/25" strokeWidth="0.7" />
      <g className={active ? "anim-ring origin-center" : "anim-ring origin-center opacity-70"}>
        {outer.map((t, i) => (
          <line
            key={`o-${i}`}
            x1={t.x1}
            y1={t.y1}
            x2={t.x2}
            y2={t.y2}
            stroke="currentColor"
            className={t.major ? "text-cyan/80" : "text-cyan/35"}
            strokeWidth={t.major ? 1.4 : 0.7}
          />
        ))}
        <circle
          r="118"
          fill="none"
          stroke="currentColor"
          className="text-cyan/50"
          strokeWidth="1.1"
          strokeDasharray="8 10"
          style={{ animation: "dash-move 12s linear infinite" }}
        />
      </g>
      <g className="anim-ring-rev origin-center">
        {inner.map((t, i) => (
          <line
            key={`i-${i}`}
            x1={t.x1}
            y1={t.y1}
            x2={t.x2}
            y2={t.y2}
            stroke="currentColor"
            className="text-cyan/45"
            strokeWidth="0.8"
          />
        ))}
        <circle r="52" fill="none" stroke="currentColor" className="text-cyan/40" strokeWidth="0.6" />
      </g>
      <path
        d="M -18 -128 L 0 -138 L 18 -128"
        fill="none"
        stroke="currentColor"
        className="text-cyan"
        strokeWidth="1.2"
      />
      <path
        d="M -18 128 L 0 138 L 18 128"
        fill="none"
        stroke="currentColor"
        className="text-cyan"
        strokeWidth="1.2"
      />
    </svg>
  );
}

export function CornerBrackets() {
  const arm = "absolute h-5 w-5 border-cyan/70";
  return (
    <div className="pointer-events-none absolute inset-3 sm:inset-5" aria-hidden="true">
      <span className={`${arm} top-0 left-0 border-t border-l`} />
      <span className={`${arm} top-0 right-0 border-t border-r`} />
      <span className={`${arm} bottom-0 left-0 border-b border-l`} />
      <span className={`${arm} bottom-0 right-0 border-b border-r`} />
    </div>
  );
}

export function HudClock() {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const id = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(id);
  }, []);
  const hh = now
    ? now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false })
    : "--:--:--";
  const day = now
    ? now.toLocaleDateString([], { weekday: "short", month: "short", day: "2-digit" }).toUpperCase()
    : "SYSTEM TIME";
  return (
    <div className="text-right">
      <div className="hud-readout text-lg leading-none text-cyan sm:text-xl">{hh}</div>
      <div className="hud-label mt-1">{day}</div>
    </div>
  );
}

export function ScanSweep() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      <div
        className="absolute inset-x-0 h-1/3 bg-linear-to-b from-transparent via-cyan/10 to-transparent"
        style={{ animation: "scan-sweep 7s linear infinite" }}
      />
    </div>
  );
}

export function WaveBars({ active }: { active: boolean }) {
  const bars = [8, 14, 22, 18, 28, 16, 24, 12, 20, 10, 18, 26, 14, 22, 9];
  return (
    <div className="flex h-8 items-end justify-center gap-0.5" aria-hidden="true">
      {bars.map((h, i) => (
        <span
          key={i}
          className="w-0.5 bg-cyan/80"
          style={{
            height: active ? `${h}px` : "4px",
            animation: active ? `listen-breathe ${0.7 + (i % 5) * 0.12}s ease-in-out ${i * 40}ms infinite` : "none",
            transformOrigin: "bottom",
          }}
        />
      ))}
    </div>
  );
}
