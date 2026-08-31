import { useCallback, useEffect, useRef, useState } from "react";
import { Settings2, LayoutGrid, Send } from "lucide-react";
import { signOut } from "@/lib/auth/client";
import { askSovi, clearTranscript, loadHud, markAlertRead, saveSettings, testVpsLink, transcribeUtterance } from "@/lib/sovi/server";
import { useSovi } from "@/lib/sovi/store";
import type { SoviSettings } from "@/lib/sovi/types";
import {
  enableWakeLock,
  getSpeechRecognition,
  notifyBrowser,
  playBase64Audio,
  recordClip,
  requestMic,
  requestNotify,
  speakFallback,
  stripWake,
} from "@/lib/sovi/voice";
import { AlertsPanel, StatusPanel, TranscriptPanel } from "./panels";
import { Reactor } from "./reactor";
import { SettingsDrawer } from "./settings";
import { BootOverlay } from "./boot";
import { CornerBrackets, HudClock, ScanSweep } from "./chrome";

export function HudApp({ operatorName }: { operatorName: string }) {
  const store = useSovi();
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);
  const [testMsg, setTestMsg] = useState<string | null>(null);
  const [signingOut, setSigningOut] = useState(false);
  const holdRef = useRef(false);
  const recRef = useRef<{ start: () => void; stop: () => void; abort: () => void } | null>(null);
  const busyRef = useRef(false);
  const wakeLock = useRef<WakeLockSentinel | null>(null);
  const handsRef = useRef(false);
  const settingsRef = useRef(store.settings);
  const startRecRef = useRef<(wakeOnly: boolean) => boolean>(() => false);

  useEffect(() => {
    settingsRef.current = store.settings;
  }, [store.settings]);
  useEffect(() => {
    handsRef.current = store.handsFree;
  }, [store.handsFree]);

  useEffect(() => {
    try {
      if (sessionStorage.getItem("sovi-booted") === "1") store.setBooted(true);
    } catch {
      /* ignore */
    }
    const on = () => store.setOnline(true);
    const off = () => store.setOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    void loadHud()
      .then((data) => {
        store.setSettings(data.settings);
        store.setMessages(data.messages);
        store.setAlerts(data.alerts);
        store.setOps(data.ops);
        store.setHandsFree(data.settings.alwaysListen);
      })
      .catch(() => store.setError("Could not load HUD state."));
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const stopRec = useCallback(() => {
    try {
      recRef.current?.stop();
    } catch {
      /* already stopped */
    }
  }, []);

  const sendText = useCallback(
    async (text: string) => {
      const clean = text.trim();
      if (!clean || busyRef.current) return;
      busyRef.current = true;
      store.setError(null);
      store.setInterim("");
      store.setVoice("processing");
      store.addMessage({
        id: Date.now(),
        role: "user",
        content: clean,
        createdAt: new Date().toISOString(),
      });
      try {
        const res = await askSovi({ data: { text: clean, operatorName } });
        if (!res.ok) {
          store.setError(res.error);
          store.setVoice("idle");
          return;
        }
        store.addMessage({
          id: Date.now() + 1,
          role: "sovi",
          content: res.hud ? `${res.speak}\n${res.hud}` : res.speak,
          createdAt: new Date().toISOString(),
        });
        if (res.alert) {
          store.prependAlert(res.alert);
          if (store.settings?.notifyPush) notifyBrowser(res.alert.title, res.alert.body);
        }
        store.setVoice("speaking");
        if (res.audio) {
          try {
            await playBase64Audio(res.audio, res.audioType);
          } catch {
            await speakFallback(res.speak);
          }
        } else {
          await speakFallback(res.speak);
        }
      } catch (err) {
        store.setError(err instanceof Error ? err.message : "Transmission failed.");
      } finally {
        busyRef.current = false;
        store.setVoice("idle");
        if (handsRef.current) startRecRef.current(true);
        void loadHud()
          .then((data) => {
            store.setOps(data.ops);
            store.setAlerts(data.alerts);
          })
          .catch(() => undefined);
      }
    },
    [operatorName, store],
  );

  const startRec = useCallback(
    (wakeOnly: boolean) => {
      const Ctor = getSpeechRecognition();
      if (!Ctor) return false;
      try {
        recRef.current?.abort();
      } catch {
        /* ignore */
      }
      const rec = new Ctor();
      rec.continuous = wakeOnly;
      rec.interimResults = true;
      rec.lang = "en-US";
      rec.onresult = (ev) => {
        let interim = "";
        let finalText = "";
        for (let i = ev.resultIndex; i < ev.results.length; i += 1) {
          const piece = ev.results[i];
          if (!piece) continue;
          const t = piece[0]?.transcript ?? "";
          if (piece.isFinal) finalText += t;
          else interim += t;
        }
        store.setInterim(interim || finalText);
        if (!finalText.trim()) return;
        if (wakeOnly) {
          const rest = stripWake(finalText, settingsRef.current?.wakeWord || "Sovi");
          if (rest === null) return;
          if (rest === "") {
            store.setInterim("Awaiting command…");
            return;
          }
          stopRec();
          void sendText(rest);
          return;
        }
        if (!holdRef.current) {
          stopRec();
          void sendText(finalText);
        }
      };
      rec.onerror = (ev) => {
        if (ev.error === "not-allowed") store.setMicReady(false);
      };
      rec.onend = () => {
        if (handsRef.current && !busyRef.current && !holdRef.current) {
          try {
            rec.start();
          } catch {
            /* restart failed */
          }
        }
      };
      recRef.current = rec;
      rec.start();
      return true;
    },
    [sendText, stopRec, store],
  );

  startRecRef.current = startRec;

  const armHandsFree = useCallback(async () => {
    const ok = await requestMic();
    store.setMicReady(ok);
    if (!ok) {
      store.setError("Microphone blocked. Allow mic access, then retry.");
      return;
    }
    wakeLock.current = await enableWakeLock();
    if (store.settings?.notifyPush) void requestNotify();
    store.setHandsFree(true);
    store.setVoice("listening");
    if (!startRec(true)) {
      store.setError("This browser has no live speech engine. Use hold-to-talk or type.");
      store.setHandsFree(false);
      store.setVoice("idle");
    }
  }, [startRec, store]);

  const disarmHandsFree = useCallback(() => {
    store.setHandsFree(false);
    handsRef.current = false;
    stopRec();
    store.setVoice("idle");
    void wakeLock.current?.release().catch(() => undefined);
    wakeLock.current = null;
  }, [stopRec, store]);

  const onPress = useCallback(() => {
    if (busyRef.current) return;
    holdRef.current = true;
    store.setVoice("listening");
    store.setInterim("");
    if (!startRec(false)) {
      store.setError("Live speech unavailable. Type a command, or use Chrome.");
    }
  }, [startRec, store]);

  const onRelease = useCallback(() => {
    if (!holdRef.current) return;
    holdRef.current = false;
    const leftover = useSovi.getState().interim.trim();
    stopRec();
    if (leftover && !busyRef.current) void sendText(leftover);
    else if (!busyRef.current && !handsRef.current) store.setVoice("idle");
  }, [sendText, stopRec, store]);

  const onReactorClick = useCallback(() => {
    if (store.handsFree) disarmHandsFree();
  }, [disarmHandsFree, store.handsFree]);

  const fallbackRecord = useCallback(async () => {
    if (busyRef.current) return;
    const ok = await requestMic();
    store.setMicReady(ok);
    if (!ok) return;
    store.setVoice("listening");
    const clip = await recordClip(5000);
    if (!clip) {
      store.setVoice("idle");
      return;
    }
    store.setVoice("processing");
    const res = await transcribeUtterance({ data: clip });
    if (!res.ok) {
      store.setError(res.error);
      store.setVoice("idle");
      return;
    }
    await sendText(res.text);
  }, [sendText, store]);

  const onSave = async (patch: Partial<SoviSettings> & { vpsToken?: string }) => {
    setSaving(true);
    setTestMsg(null);
    try {
      const res = await saveSettings({ data: patch });
      if (!res.ok) {
        setTestMsg(res.error);
        return;
      }
      store.setSettings(res.settings);
      store.setHandsFree(res.settings.alwaysListen);
      setTestMsg("Configuration committed.");
      if (res.settings.alwaysListen) void armHandsFree();
      else disarmHandsFree();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="relative min-h-dvh overflow-hidden bg-bg text-fg">
      <div className="hud-grid absolute inset-0 opacity-80" />
      <div className="hud-scan absolute inset-0" />
      <div className="hud-vignette absolute inset-0" />
      <ScanSweep />
      <CornerBrackets />

      {!store.booted ? (
        <BootOverlay
          name={operatorName}
          onDone={() => {
            store.setBooted(true);
            try {
              sessionStorage.setItem("sovi-booted", "1");
            } catch {
              /* ignore */
            }
          }}
        />
      ) : null}

      <header className="relative z-10 flex items-start justify-between gap-3 px-4 pt-5 pb-2 sm:px-8">
        <div>
          <div className="hud-label text-cyan">Sovereign OS</div>
          <h1 className="font-display text-3xl font-semibold tracking-[0.28em] text-fg">SOVI</h1>
        </div>
        <HudClock />
      </header>

      <div className="relative z-10 mx-auto grid max-w-6xl gap-3 px-3 pb-28 sm:px-6 lg:grid-cols-[minmax(0,16rem)_1fr_minmax(0,18rem)] lg:items-start">
        <StatusPanel
          voice={store.voice}
          online={store.online}
          micReady={store.micReady}
          linked={Boolean(store.settings?.vpsUrl)}
          brain={store.settings?.brainMode ?? "cloud"}
          name={operatorName}
        />

        <div className="flex flex-col items-center">
          <Reactor
            voice={store.voice}
            onPress={onPress}
            onRelease={onRelease}
            onClick={onReactorClick}
          />
          {store.error ? <p className="mt-2 max-w-sm text-center font-mono text-xs text-warn">{store.error}</p> : null}
          <div className="mt-3 flex flex-wrap justify-center gap-2">
            <button
              type="button"
              className="hud-btn hud-btn-ghost text-xs"
              onClick={() => (store.handsFree ? disarmHandsFree() : void armHandsFree())}
            >
              {store.handsFree ? "Hands-free on" : "Hands-free"}
            </button>
            <button type="button" className="hud-btn hud-btn-ghost text-xs" onClick={() => void fallbackRecord()}>
              Record 5s
            </button>
            <button
              type="button"
              className="hud-btn hud-btn-ghost text-xs"
              onClick={() => store.setPanel(store.panel === "settings" ? "none" : "settings")}
            >
              <Settings2 className="size-3.5" />
              Config
            </button>
            <button
              type="button"
              className="hud-btn hud-btn-ghost text-xs"
              onClick={() => void clearTranscript().then(() => store.setMessages([]))}
            >
              <LayoutGrid className="size-3.5" />
              Clear
            </button>
          </div>
        </div>

        <div className="grid gap-3">
          <AlertsPanel
            alerts={store.alerts}
            ops={store.ops}
            onRead={(id) => {
              void markAlertRead({ data: id });
              store.setAlerts(store.alerts.map((a) => (a.id === id ? { ...a, read: true } : a)));
            }}
          />
          <TranscriptPanel messages={store.messages} interim={store.interim} voice={store.voice} />
        </div>
      </div>

      <form
        className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-void/90 px-3 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-6"
        onSubmit={(e) => {
          e.preventDefault();
          const t = draft;
          setDraft("");
          void sendText(t);
        }}
      >
        <div className="mx-auto flex max-w-6xl gap-2">
          <input
            className="hud-input"
            placeholder="Transmit a command…"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            maxLength={4000}
          />
          <button type="submit" className="hud-btn shrink-0 px-4" aria-label="Send">
            <Send className="size-4" />
          </button>
        </div>
      </form>

      <SettingsDrawer
        open={store.panel === "settings"}
        settings={store.settings}
        saving={saving}
        testMsg={testMsg}
        onClose={() => store.setPanel("none")}
        onSave={(patch) => void onSave(patch)}
        onTest={() => {
          void testVpsLink()
            .then((r) => {
              if (r.ok) {
                if (r.settings) store.setSettings(r.settings);
                setTestMsg(r.detail);
              } else {
                setTestMsg(r.error);
              }
            })
            .catch(() => setTestMsg("Ping failed."));
        }}
        onSignOut={() => {
          if (signingOut) return;
          setSigningOut(true);
          void signOut("/login").catch(() => setSigningOut(false));
        }}
      />
    </div>
  );
}
