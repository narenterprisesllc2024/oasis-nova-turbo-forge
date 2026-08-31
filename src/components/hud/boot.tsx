import { useEffect, useState } from "react";

const LINES = [
  "SOVEREIGN KERNEL  7.4.1",
  "VOICE BUS ................ OK",
  "HUD PROJECTOR ............ OK",
  "IDENTITY TOKEN ........... OK",
  "COMM CHANNEL ............. OPEN",
];

export function BootOverlay({ onDone, name }: { onDone: () => void; name: string }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    if (n < LINES.length) {
      const t = window.setTimeout(() => setN((v) => v + 1), 280);
      return () => window.clearTimeout(t);
    }
    const t = window.setTimeout(onDone, 700);
    return () => window.clearTimeout(t);
  }, [n, onDone]);

  return (
    <div className="absolute inset-0 z-30 grid place-items-center bg-bg">
      <div className="hud-grid absolute inset-0 opacity-60" />
      <div className="relative w-full max-w-md px-6">
        <div className="hud-label text-cyan">Boot sequence</div>
        <h1 className="mt-2 font-display text-4xl font-semibold tracking-widest text-fg">SOVI</h1>
        <p className="font-mono text-sm text-muted">Welcome back, {name}.</p>
        <ul className="mt-6 space-y-1 font-mono text-xs text-cyan">
          {LINES.slice(0, n).map((line) => (
            <li key={line} className="anim-boot">
              {line}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
