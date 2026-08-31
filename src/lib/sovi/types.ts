export type BrainMode = "cloud" | "vps" | "hybrid";
export type VoiceState = "idle" | "listening" | "processing" | "speaking";
export type AlertLevel = "info" | "warn" | "critical";
export type MessageRole = "user" | "sovi" | "system";

export type SoviSettings = {
  wakeWord: string;
  voiceId: string;
  alwaysListen: boolean;
  vpsUrl: string;
  hasToken: boolean;
  chatPath: string;
  commandPath: string;
  vpsModel: string;
  brainMode: BrainMode;
  notifyPush: boolean;
};

export type SoviMessage = {
  id: number;
  role: MessageRole;
  content: string;
  createdAt: string;
};

export type SoviAlert = {
  id: number;
  title: string;
  body: string;
  level: AlertLevel;
  read: boolean;
  createdAt: string;
};

export type SoviOp = {
  id: number;
  command: string;
  status: string;
  detail: string | null;
  createdAt: string;
};

export const VOICE_OPTIONS = [
  { id: "orion", label: "Orion", note: "Cinematic, resonant" },
  { id: "eve", label: "Eve", note: "Clear, composed" },
  { id: "atlas", label: "Atlas", note: "Steady, formal" },
  { id: "leo", label: "Leo", note: "Warm, direct" },
  { id: "helix", label: "Helix", note: "Bold, dynamic" },
  { id: "luna", label: "Luna", note: "Calm, precise" },
] as const;
