import type { ReactNode } from "react";
import { CornerBrackets, HudClock, HudRings, ScanSweep } from "./chrome";

export function GateScreen({
  kicker,
  title,
  children,
}: {
  kicker: string;
  title: string;
  children?: ReactNode;
}) {
  return (
    <main className="relative min-h-dvh overflow-hidden bg-bg text-fg">
      <div className="hud-grid absolute inset-0" />
      <div className="hud-scan absolute inset-0" />
      <div className="hud-vignette absolute inset-0" />
      <ScanSweep />
      <CornerBrackets />

      <header className="relative z-10 flex items-start justify-between px-5 pt-6 sm:px-10">
        <div>
          <div className="hud-label text-cyan">{kicker}</div>
          <h1 className="font-display text-4xl font-semibold tracking-[0.28em] sm:text-5xl">SOVI</h1>
          <p className="mt-1 font-mono text-xs tracking-[0.2em] text-muted">SOVEREIGN OS</p>
        </div>
        <HudClock />
      </header>

      <div className="relative z-10 mx-auto mt-4 grid max-w-5xl items-center gap-6 px-5 pb-16 lg:grid-cols-[1fr_minmax(0,24rem)]">
        <div className="relative mx-auto aspect-square w-[min(70vw,20rem)]">
          <HudRings active />
          <div className="absolute top-1/2 left-1/2 grid size-24 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-cyan/70 bg-void/80 core-glow anim-core">
            <span className="hud-label text-cyan">{title}</span>
          </div>
        </div>
        <div className="relative">{children}</div>
      </div>
    </main>
  );
}
