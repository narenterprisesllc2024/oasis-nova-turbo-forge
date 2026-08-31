import { useEffect, useState, type ReactNode } from "react";
import { X } from "lucide-react";
import { VOICE_OPTIONS, type SoviSettings } from "@/lib/sovi/types";
import { cn } from "@/lib/utils";

export function SettingsDrawer({
  open,
  settings,
  onClose,
  onSave,
  onTest,
  onSignOut,
  saving,
  testMsg,
}: {
  open: boolean;
  settings: SoviSettings | null;
  onClose: () => void;
  onSave: (patch: Partial<SoviSettings> & { vpsToken?: string }) => void;
  onTest: () => void;
  onSignOut: () => void;
  saving: boolean;
  testMsg: string | null;
}) {
  const [wake, setWake] = useState("Sovi");
  const [voice, setVoice] = useState("orion");
  const [vpsUrl, setVpsUrl] = useState("");
  const [token, setToken] = useState("");
  const [chatPath, setChatPath] = useState("/v1/chat/completions");
  const [commandPath, setCommandPath] = useState("/sovi/command");
  const [vpsModel, setVpsModel] = useState("sovi");
  const [brain, setBrain] = useState<SoviSettings["brainMode"]>("cloud");
  const [hands, setHands] = useState(false);
  const [notify, setNotify] = useState(true);

  useEffect(() => {
    if (!open || !settings) return;
    setWake(settings.wakeWord);
    setVoice(settings.voiceId);
    setVpsUrl(settings.vpsUrl);
    setToken("");
    setChatPath(settings.chatPath);
    setCommandPath(settings.commandPath);
    setVpsModel(settings.vpsModel || "sovi");
    setBrain(settings.brainMode);
    setHands(settings.alwaysListen);
    setNotify(settings.notifyPush);
  }, [open, settings]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center sm:items-center">
      <button type="button" className="absolute inset-0 bg-void/70" aria-label="Close settings" onClick={onClose} />
      <div className="hud-panel relative z-10 max-h-[88dvh] w-full max-w-lg overflow-y-auto p-4 sm:p-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-xl font-semibold tracking-wide text-cyan">LINK / CONFIG</h2>
          <button type="button" onClick={onClose} className="grid size-11 place-items-center text-muted hover:text-fg" aria-label="Close">
            <X className="size-5" />
          </button>
        </div>

        <Field label="Wake word">
          <input className="hud-input" value={wake} onChange={(e) => setWake(e.target.value)} maxLength={32} />
        </Field>

        <Field label="Voice">
          <div className="grid grid-cols-2 gap-2">
            {VOICE_OPTIONS.map((v) => (
              <button
                key={v.id}
                type="button"
                onClick={() => setVoice(v.id)}
                className={cn(
                  "min-h-11 border px-2 py-1 text-left",
                  voice === v.id ? "border-cyan bg-cyan/10 text-cyan" : "border-line text-muted",
                )}
              >
                <div className="font-display text-sm font-semibold tracking-wide">{v.label}</div>
                <div className="font-mono text-2xs">{v.note}</div>
              </button>
            ))}
          </div>
        </Field>

        <Field label="Brain">
          <div className="grid grid-cols-3 gap-2">
            {(["cloud", "vps", "hybrid"] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setBrain(m)}
                className={cn(
                  "min-h-11 border font-display text-xs font-semibold tracking-widest uppercase",
                  brain === m ? "border-cyan bg-cyan/10 text-cyan" : "border-line text-muted",
                )}
              >
                {m}
              </button>
            ))}
          </div>
          <p className="mt-2 font-mono text-2xs leading-relaxed text-muted">
            Cloud uses Sovi core. VPS sends every line to your gateway. Hybrid talks here and dispatches run/execute commands to the stack.
          </p>
        </Field>

        <Field label="Gateway URL">
          <input
            className="hud-input"
            placeholder="https://sovi.yourdomain.com"
            value={vpsUrl}
            onChange={(e) => setVpsUrl(e.target.value)}
          />
        </Field>
        <Field label={`Access token${settings?.hasToken ? " (set)" : ""}`}>
          <input
            className="hud-input"
            type="password"
            placeholder={settings?.hasToken ? "Leave blank to keep" : "Bearer token from vps/.env"}
            value={token}
            onChange={(e) => setToken(e.target.value)}
            autoComplete="off"
          />
        </Field>
        <Field label="Model id">
          <input className="hud-input" value={vpsModel} onChange={(e) => setVpsModel(e.target.value)} placeholder="sovi" />
        </Field>
        <div className="grid grid-cols-2 gap-2">
          <Field label="Chat path">
            <input className="hud-input" value={chatPath} onChange={(e) => setChatPath(e.target.value)} />
          </Field>
          <Field label="Command path">
            <input className="hud-input" value={commandPath} onChange={(e) => setCommandPath(e.target.value)} />
          </Field>
        </div>

        <label className="mt-3 flex min-h-11 items-center gap-3">
          <input type="checkbox" checked={hands} onChange={(e) => setHands(e.target.checked)} className="size-4 accent-cyan" />
          <span className="font-mono text-sm text-fg">Hands-free (wake word, Bluetooth headset)</span>
        </label>
        <label className="flex min-h-11 items-center gap-3">
          <input type="checkbox" checked={notify} onChange={(e) => setNotify(e.target.checked)} className="size-4 accent-cyan" />
          <span className="font-mono text-sm text-fg">Browser notifications</span>
        </label>

        <div className="mt-4 rounded-sm border border-line p-3">
          <div className="hud-label mb-1">GitHub → VPS</div>
          <p className="font-mono text-2xs leading-relaxed text-muted">
            Clone the Sovi repo onto the server and run the gateway in vps/. Point UPSTREAM at your OpenAI-compatible model. Paste the public HTTPS URL and SOVI_TOKEN here, then Ping link — handshake fills paths and model. Brain VPS for full stack talk, Hybrid to keep voice here and only dispatch run/execute lines.
          </p>
        </div>

        {testMsg ? <p className="mt-3 font-mono text-xs text-cyan">{testMsg}</p> : null}

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            className="hud-btn flex-1"
            disabled={saving}
            onClick={() =>
              onSave({
                wakeWord: wake,
                voiceId: voice,
                vpsUrl,
                vpsToken: token,
                chatPath,
                commandPath,
                vpsModel,
                brainMode: brain,
                alwaysListen: hands,
                notifyPush: notify,
              })
            }
          >
            {saving ? "Saving" : "Commit"}
          </button>
          <button type="button" className="hud-btn hud-btn-ghost" onClick={onTest}>
            Ping link
          </button>
          <button type="button" className="hud-btn hud-btn-ghost" onClick={onSignOut}>
            Sign out
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="mt-3 block">
      <span className="hud-label mb-1 block">{label}</span>
      {children}
    </div>
  );
}
