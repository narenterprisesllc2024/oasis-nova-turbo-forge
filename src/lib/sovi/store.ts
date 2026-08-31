import { create } from "zustand";
import type { SoviAlert, SoviMessage, SoviOp, SoviSettings, VoiceState } from "./types";

type Panel = "none" | "settings" | "commands";

type SoviStore = {
  voice: VoiceState;
  interim: string;
  messages: SoviMessage[];
  alerts: SoviAlert[];
  ops: SoviOp[];
  settings: SoviSettings | null;
  booted: boolean;
  panel: Panel;
  micReady: boolean | null;
  online: boolean;
  error: string | null;
  handsFree: boolean;
  setVoice: (voice: VoiceState) => void;
  setInterim: (interim: string) => void;
  setMessages: (messages: SoviMessage[]) => void;
  addMessage: (message: SoviMessage) => void;
  setAlerts: (alerts: SoviAlert[]) => void;
  prependAlert: (alert: SoviAlert) => void;
  setOps: (ops: SoviOp[]) => void;
  setSettings: (settings: SoviSettings) => void;
  setBooted: (booted: boolean) => void;
  setPanel: (panel: Panel) => void;
  setMicReady: (ready: boolean | null) => void;
  setOnline: (online: boolean) => void;
  setError: (error: string | null) => void;
  setHandsFree: (on: boolean) => void;
};

export const useSovi = create<SoviStore>((set) => ({
  voice: "idle",
  interim: "",
  messages: [],
  alerts: [],
  ops: [],
  settings: null,
  booted: false,
  panel: "none",
  micReady: null,
  online: typeof navigator === "undefined" ? true : navigator.onLine,
  error: null,
  handsFree: false,
  setVoice: (voice) => set({ voice }),
  setInterim: (interim) => set({ interim }),
  setMessages: (messages) => set({ messages }),
  addMessage: (message) => set((s) => ({ messages: [...s.messages, message].slice(-80) })),
  setAlerts: (alerts) => set({ alerts }),
  prependAlert: (alert) => set((s) => ({ alerts: [alert, ...s.alerts].slice(0, 20) })),
  setOps: (ops) => set({ ops }),
  setSettings: (settings) => set({ settings }),
  setBooted: (booted) => set({ booted }),
  setPanel: (panel) => set({ panel }),
  setMicReady: (micReady) => set({ micReady }),
  setOnline: (online) => set({ online }),
  setError: (error) => set({ error }),
  setHandsFree: (handsFree) => set({ handsFree }),
}));
