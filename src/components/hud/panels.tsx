import { Activity, Radio, Shield, Wifi, Cpu, Link2 } from "lucide-react";
import type { SoviAlert, SoviMessage, SoviOp, VoiceState } from "@/lib/sovi/types";
import { cn } from "@/lib/utils";
import { WaveBars } from "./chrome";

function Module({
  icon: Icon,
  label,
  value,
  ok,
}: {
  icon: typeof Cpu;
  label: string;
  value: string;
  ok: boolean;
}) {
  return (
    <div className="flex items-center gap-2 border-b border-line/80 py-2 last:border-b-0">
      <Icon className={cn("size-3.5 shrink-0", ok ? "text-ok" : "text-warn")} />
      <div className="min-w-0 flex-1">
        <div className="hud-label">{label}</div>
        <div className="hud-readout truncate text-sm text-fg">{value}</div>
      </div>
      <span className={cn("size-1.5 rounded-full", ok ? "bg-ok" : "bg-warn")} />
    </div>
  );
}

export function StatusPanel({
  voice,
  online,
  micReady,
  linked,
  brain,
  name,
}: {
  voice: VoiceState;
  online: boolean;
  micReady: boolean | null;
  linked: boolean;
  brain: string;
  name: string;
}) {
  return (
    <aside className="hud-panel p-3 sm:p-4">
      <div className="mb-2 flex items-center justify-between">
        <span className="hud-label">System diagnostics</span>
        <Activity className="size-3.5 text-cyan" />
      </div>
      <Module icon={Cpu} label="Core" value={brain.toUpperCase()} ok />
      <Module
        icon={Radio}
        label="Comm"
        value={voice === "idle" ? "STANDBY" : voice.toUpperCase()}
        ok={voice !== "idle"}
      />
      <Module
        icon={Shield}
        label="Auth"
        value={name}
        ok
      />
      <Module
        icon={Wifi}
        label="Net"
        value={online ? "ONLINE" : "OFFLINE"}
        ok={online}
      />
      <Module
        icon={Activity}
        label="Sens"
        value={micReady === null ? "UNKNOWN" : micReady ? "MIC READY" : "MIC BLOCKED"}
        ok={micReady !== false}
      />
      <Module icon={Link2} label="Link" value={linked ? "VPS ARMED" : "NOT BOUND"} ok={linked} />
    </aside>
  );
}

export function TranscriptPanel({
  messages,
  interim,
  voice,
}: {
  messages: SoviMessage[];
  interim: string;
  voice: VoiceState;
}) {
  const last = messages.slice(-8);
  return (
    <section className="hud-panel flex min-h-40 flex-col p-3 sm:p-4">
      <div className="mb-2 flex items-center justify-between">
        <span className="hud-label">Comm log</span>
        <WaveBars active={voice === "listening" || voice === "speaking"} />
      </div>
      <div className="flex-1 space-y-2 overflow-y-auto pr-1">
        {last.length === 0 && !interim ? (
          <p className="font-mono text-sm text-muted">Awaiting transmission. Hold the core, or type below.</p>
        ) : (
          last.map((m) => (
            <div key={m.id} className="grid gap-0.5">
              <span className="hud-label">{m.role === "user" ? "Operator" : "Sovi"}</span>
              <p className={cn("text-sm leading-snug", m.role === "sovi" ? "text-cyan" : "text-fg")}>{m.content}</p>
            </div>
          ))
        )}
        {interim ? (
          <p className="font-mono text-sm text-muted italic">{interim}</p>
        ) : null}
      </div>
    </section>
  );
}

export function AlertsPanel({
  alerts,
  ops,
  onRead,
}: {
  alerts: SoviAlert[];
  ops: SoviOp[];
  onRead: (id: number) => void;
}) {
  return (
    <aside className="hud-panel p-3 sm:p-4">
      <div className="mb-2 flex items-center justify-between">
        <span className="hud-label">Alerts</span>
        <span className="hud-readout text-2xs text-cyan">{alerts.filter((a) => !a.read).length} OPEN</span>
      </div>
      <div className="max-h-40 space-y-2 overflow-y-auto sm:max-h-52">
        {alerts.length === 0 ? (
          <p className="font-mono text-xs text-muted">No active flags.</p>
        ) : (
          alerts.slice(0, 6).map((a) => (
            <button
              key={a.id}
              type="button"
              onClick={() => onRead(a.id)}
              className="block w-full border border-line/80 p-2 text-left transition-opacity duration-150 hover:opacity-80"
            >
              <div className="flex items-center justify-between gap-2">
                <span
                  className={cn(
                    "hud-label",
                    a.level === "critical" ? "text-crit" : a.level === "warn" ? "text-warn" : "text-cyan",
                  )}
                >
                  {a.level}
                </span>
                {!a.read ? <span className="size-1.5 rounded-full bg-cyan" /> : null}
              </div>
              <div className="text-sm text-fg">{a.title}</div>
              {a.body ? <div className="font-mono text-xs text-muted">{a.body}</div> : null}
            </button>
          ))
        )}
      </div>
      <div className="mt-3 border-t border-line pt-2">
        <span className="hud-label">Ops</span>
        <ul className="mt-1 space-y-1">
          {ops.slice(0, 4).map((o) => (
            <li key={o.id} className="flex justify-between gap-2 font-mono text-2xs text-muted">
              <span className="truncate">{o.command}</span>
              <span className={o.status === "ok" ? "text-ok" : "text-warn"}>{o.status}</span>
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
}
