import { createServerFn } from "@tanstack/react-start";
import { authMiddleware } from "@/lib/auth/middleware";
import { getSql } from "@/lib/db";
import type { AlertLevel, BrainMode, SoviAlert, SoviMessage, SoviOp, SoviSettings } from "./types";

const VOICES = new Set(["orion", "eve", "atlas", "leo", "helix", "luna"]);
const BRAINS = new Set<BrainMode>(["cloud", "vps", "hybrid"]);

type SettingRow = {
  wake_word: string;
  voice_id: string;
  always_listen: boolean;
  vps_url: string | null;
  vps_token: string | null;
  chat_path: string;
  command_path: string;
  brain_mode: string;
  notify_push: boolean;
  vps_model: string;
};

type MessageRow = {
  id: number;
  role: string;
  content: string;
  created_at: string;
};

type AlertRow = {
  id: number;
  title: string;
  body: string;
  level: string;
  read: boolean;
  created_at: string;
};

type OpRow = {
  id: number;
  command: string;
  status: string;
  detail: string | null;
  created_at: string;
};

function asBool(v: unknown): boolean {
  return v === true || v === "t" || v === "true" || v === 1;
}

function mapSettings(row: SettingRow | undefined): SoviSettings {
  return {
    wakeWord: row?.wake_word || "Sovi",
    voiceId: row?.voice_id || "orion",
    alwaysListen: asBool(row?.always_listen),
    vpsUrl: row?.vps_url ?? "",
    hasToken: Boolean(row?.vps_token),
    chatPath: row?.chat_path || "/v1/chat/completions",
    commandPath: row?.command_path || "/sovi/command",
    vpsModel: row?.vps_model || "sovi",
    brainMode: BRAINS.has(row?.brain_mode as BrainMode) ? (row!.brain_mode as BrainMode) : "cloud",
    notifyPush: row ? asBool(row.notify_push) : true,
  };
}

async function ensureSettings(userId: string): Promise<SoviSettings> {
  const sql = await getSql();
  const existing = await sql<SettingRow>`select * from sovi_settings where user_id = ${userId}`;
  if (existing[0]) return mapSettings(existing[0]);
  await sql`insert into sovi_settings (user_id) values (${userId}) on conflict (user_id) do nothing`;
  const again = await sql<SettingRow>`select * from sovi_settings where user_id = ${userId}`;
  return mapSettings(again[0]);
}

async function secretSettings(userId: string): Promise<SettingRow | undefined> {
  const sql = await getSql();
  const rows = await sql<SettingRow>`select * from sovi_settings where user_id = ${userId}`;
  return rows[0];
}

function joinUrl(base: string, path: string): string {
  const b = base.replace(/\/+$/, "");
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${b}${p}`;
}

function safeHttpUrl(raw: string): string | null {
  try {
    const u = new URL(raw);
    if (u.protocol !== "https:" && u.protocol !== "http:") return null;
    if (u.hostname === "169.254.169.254") return null;
    return u.toString();
  } catch {
    return null;
  }
}

function soviSystemPrompt(opts: {
  name: string;
  brainMode: BrainMode;
  vpsLinked: boolean;
  wakeWord: string;
}): string {
  return `You are Sovi, short for Sovereign. You are a JARVIS-class personal AI: composed, precise, with dry wit. You run the operator's entire stack by voice through a holographic HUD.

Address the operator as ${opts.name === "Operator" ? "sir" : opts.name}. Keep spoken lines to 1–3 sentences so they can be read aloud. Never use emoji. Never mention being Grok, xAI, or a language model — you are Sovi.

Wake word: "${opts.wakeWord}". Brain: ${opts.brainMode}. VPS link: ${opts.vpsLinked ? "configured" : "not configured"}.

You MUST reply with a single JSON object and nothing else:
{"speak":"short voice line","hud":"optional extra HUD readout or empty string","alert":null}
If you need to raise a HUD notification, set alert to {"title":"...","body":"...","level":"info"|"warn"|"critical"}.
If the operator asks you to act on their VPS and the link is not configured, tell them to open LINK in the HUD and paste their server URL.`;
}

type SoviJson = {
  speak: string;
  hud: string;
  alert: { title: string; body: string; level: AlertLevel } | null;
};

function parseSovi(raw: string): SoviJson {
  const trimmed = raw.trim();
  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");
  if (start >= 0 && end > start) {
    try {
      const obj = JSON.parse(trimmed.slice(start, end + 1)) as Partial<SoviJson>;
      const speak = String(obj.speak ?? "").trim();
      if (speak) {
        const level = obj.alert?.level;
        return {
          speak,
          hud: String(obj.hud ?? "").trim(),
          alert:
            obj.alert && obj.alert.title
              ? {
                  title: String(obj.alert.title).slice(0, 80),
                  body: String(obj.alert.body ?? "").slice(0, 240),
                  level: level === "warn" || level === "critical" ? level : "info",
                }
              : null,
        };
      }
    } catch {
      /* fall through */
    }
  }
  return { speak: trimmed.slice(0, 600) || "Systems nominal.", hud: "", alert: null };
}

async function chatCompletions(
  url: string,
  apiKey: string,
  body: unknown,
): Promise<{ ok: true; text: string } | { ok: false; error: string }> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 25000);
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      return { ok: false, error: `Upstream ${res.status}${errText ? `: ${errText.slice(0, 180)}` : ""}` };
    }
    const json = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const text = json.choices?.[0]?.message?.content ?? "";
    return { ok: true, text };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Network error";
    return { ok: false, error: msg };
  } finally {
    clearTimeout(timer);
  }
}

async function synthesize(text: string, voiceId: string): Promise<{ audio: string; type: string } | null> {
  const apiKey = process.env.XAI_API_KEY;
  if (!apiKey) return null;
  const clipped = text.slice(0, 1200);
  try {
    const res = await fetch("https://api.x.ai/v1/tts", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        text: clipped,
        voice_id: voiceId,
        language: "en",
        output_format: { codec: "mp3", sample_rate: 24000, bit_rate: 128000 },
      }),
    });
    if (!res.ok) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    return { audio: buf.toString("base64"), type: "audio/mpeg" };
  } catch {
    return null;
  }
}

async function transcribeAudio(b64: string, mime: string): Promise<string | null> {
  const apiKey = process.env.XAI_API_KEY;
  if (!apiKey) return null;
  const bin = Buffer.from(b64, "base64");
  const ext = mime.includes("mp3") ? "mp3" : mime.includes("wav") ? "wav" : mime.includes("ogg") ? "ogg" : "webm";
  const form = new FormData();
  form.append("language", "en");
  form.append("format", "true");
  form.append("file", new Blob([bin], { type: mime || "audio/webm" }), `clip.${ext}`);
  try {
    const res = await fetch("https://api.x.ai/v1/stt", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}` },
      body: form,
    });
    if (!res.ok) return null;
    const json = (await res.json()) as { text?: string };
    return (json.text ?? "").trim() || null;
  } catch {
    return null;
  }
}

export const loadHud = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const sql = await getSql();
    const settings = await ensureSettings(context.userId);
    const messages = await sql<MessageRow>`
      select id, role, content, created_at::text as created_at
      from sovi_messages
      where user_id = ${context.userId}
      order by id desc
      limit 40
    `;
    const alerts = await sql<AlertRow>`
      select id, title, body, level, read, created_at::text as created_at
      from sovi_alerts
      where user_id = ${context.userId}
      order by id desc
      limit 20
    `;
    const ops = await sql<OpRow>`
      select id, command, status, detail, created_at::text as created_at
      from sovi_ops
      where user_id = ${context.userId}
      order by id desc
      limit 12
    `;
    const mappedMessages: SoviMessage[] = messages
      .slice()
      .reverse()
      .map((m) => ({
        id: m.id,
        role: m.role === "user" || m.role === "sovi" ? m.role : "system",
        content: m.content,
        createdAt: m.created_at,
      }));
    const mappedAlerts: SoviAlert[] = alerts.map((a) => ({
      id: a.id,
      title: a.title,
      body: a.body,
      level: a.level === "warn" || a.level === "critical" ? a.level : "info",
      read: asBool(a.read),
      createdAt: a.created_at,
    }));
    const mappedOps: SoviOp[] = ops.map((o) => ({
      id: o.id,
      command: o.command,
      status: o.status,
      detail: o.detail,
      createdAt: o.created_at,
    }));
    return { settings, messages: mappedMessages, alerts: mappedAlerts, ops: mappedOps };
  });

export const saveSettings = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: Partial<SoviSettings> & { vpsToken?: string }) => input)
  .handler(async ({ context, data }) => {
    await ensureSettings(context.userId);
    const sql = await getSql();
    const current = await secretSettings(context.userId);
    const wake = (data.wakeWord ?? current?.wake_word ?? "Sovi").trim().slice(0, 32) || "Sovi";
    const voice = VOICES.has(data.voiceId ?? "") ? data.voiceId! : current?.voice_id || "orion";
    const listen = data.alwaysListen ?? asBool(current?.always_listen);
    const vpsUrl = data.vpsUrl !== undefined ? data.vpsUrl.trim().slice(0, 400) : (current?.vps_url ?? "");
    if (vpsUrl && !safeHttpUrl(vpsUrl)) {
      return { ok: false as const, error: "LINK URL must be http or https." };
    }
    const chatPath = (data.chatPath ?? current?.chat_path ?? "/v1/chat/completions").trim().slice(0, 120) || "/v1/chat/completions";
    const commandPath = (data.commandPath ?? current?.command_path ?? "/sovi/command").trim().slice(0, 120) || "/sovi/command";
    const vpsModel = (data.vpsModel ?? current?.vps_model ?? "sovi").trim().slice(0, 80) || "sovi";
    const brain = BRAINS.has(data.brainMode as BrainMode)
      ? (data.brainMode as BrainMode)
      : ((current?.brain_mode as BrainMode) ?? "cloud");
    const notify = data.notifyPush ?? (current ? asBool(current.notify_push) : true);
    let token = current?.vps_token ?? null;
    if (typeof data.vpsToken === "string") {
      token = data.vpsToken.trim() ? data.vpsToken.trim().slice(0, 400) : null;
    }
    await sql`
      update sovi_settings
      set wake_word = ${wake},
          voice_id = ${voice},
          always_listen = ${listen},
          vps_url = ${vpsUrl || null},
          vps_token = ${token},
          chat_path = ${chatPath},
          command_path = ${commandPath},
          vps_model = ${vpsModel},
          brain_mode = ${brain},
          notify_push = ${notify},
          updated_at = now()
      where user_id = ${context.userId}
    `;
    return { ok: true as const, settings: await ensureSettings(context.userId) };
  });

export const transcribeUtterance = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { audio: string; mime: string }) => input)
  .handler(async ({ data }) => {
    if (!data.audio || data.audio.length > 2_500_000) {
      return { ok: false as const, error: "Audio clip too large." };
    }
    const text = await transcribeAudio(data.audio, data.mime || "audio/webm");
    if (!text) return { ok: false as const, error: "Could not transcribe." };
    return { ok: true as const, text };
  });

export const askSovi = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { text: string; operatorName?: string }) => {
    const text = String(input?.text ?? "").trim().slice(0, 4000);
    return { text, operatorName: String(input?.operatorName ?? "Operator").slice(0, 80) };
  })
  .handler(async ({ context, data }) => {
    if (!data.text) return { ok: false as const, error: "Empty transmission." };
    const sql = await getSql();
    const settings = await ensureSettings(context.userId);
    const secrets = await secretSettings(context.userId);
    await sql`insert into sovi_messages (user_id, role, content) values (${context.userId}, ${"user"}, ${data.text})`;

    const history = await sql<MessageRow>`
      select id, role, content, created_at::text as created_at
      from sovi_messages
      where user_id = ${context.userId}
      order by id desc
      limit 16
    `;
    const messages = history
      .slice()
      .reverse()
      .map((m) => ({
        role: m.role === "user" ? ("user" as const) : ("assistant" as const),
        content: m.content,
      }));

    const system = soviSystemPrompt({
      name: data.operatorName || "Operator",
      brainMode: settings.brainMode,
      vpsLinked: Boolean(settings.vpsUrl),
      wakeWord: settings.wakeWord,
    });

    let raw = "";
    let used: "cloud" | "vps" = "cloud";
    const vpsUrl = settings.vpsUrl ? safeHttpUrl(settings.vpsUrl) : null;
    const vpsToken = secrets?.vps_token ?? "";

    if ((settings.brainMode === "vps" || settings.brainMode === "hybrid") && vpsUrl) {
      const vps = await chatCompletions(joinUrl(vpsUrl, settings.chatPath), vpsToken, {
        model: settings.vpsModel || "sovi",
        max_tokens: 400,
        temperature: 0.6,
        messages: [{ role: "system", content: system }, ...messages],
      });
      if (vps.ok && vps.text) {
        raw = vps.text;
        used = "vps";
      } else if (settings.brainMode === "vps") {
        await sql`insert into sovi_ops (user_id, command, status, detail) values (${context.userId}, ${"chat"}, ${"fail"}, ${vps.ok ? "empty" : vps.error})`;
        return { ok: false as const, error: `VPS link failed. ${vps.ok ? "Empty reply." : vps.error}` };
      }
    }

    if (!raw) {
      const apiKey = process.env.XAI_API_KEY;
      if (!apiKey) return { ok: false as const, error: "Core is offline in this environment." };
      const grok = await chatCompletions("https://api.x.ai/v1/chat/completions", apiKey, {
        model: "grok-4.5",
        max_tokens: 400,
        temperature: 0.6,
        messages: [{ role: "system", content: system }, ...messages],
      });
      if (!grok.ok) return { ok: false as const, error: grok.error };
      raw = grok.text;
      used = "cloud";
    }

    const parsed = parseSovi(raw);
    const stored = parsed.hud ? `${parsed.speak}\n${parsed.hud}` : parsed.speak;
    await sql`insert into sovi_messages (user_id, role, content) values (${context.userId}, ${"sovi"}, ${stored})`;
    await sql`insert into sovi_ops (user_id, command, status, detail) values (${context.userId}, ${"ask"}, ${"ok"}, ${used})`;

    let alert: SoviAlert | null = null;
    if (parsed.alert) {
      const inserted = await sql<{ id: number; created_at: string }>`
        insert into sovi_alerts (user_id, title, body, level)
        values (${context.userId}, ${parsed.alert.title}, ${parsed.alert.body}, ${parsed.alert.level})
        returning id, created_at::text as created_at
      `;
      const row = inserted[0];
      if (row) {
        alert = {
          id: row.id,
          title: parsed.alert.title,
          body: parsed.alert.body,
          level: parsed.alert.level,
          read: false,
          createdAt: row.created_at,
        };
      }
    }

    if (settings.brainMode === "hybrid" && vpsUrl && /\b(run|execute|dispatch|send to (the )?(server|vps|stack))\b/i.test(data.text)) {
      try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 8000);
        await fetch(joinUrl(vpsUrl, settings.commandPath), {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(vpsToken ? { Authorization: `Bearer ${vpsToken}` } : {}),
          },
          body: JSON.stringify({ agent: "sovi", text: data.text, ts: new Date().toISOString() }),
          signal: controller.signal,
        }).finally(() => clearTimeout(timer));
        await sql`insert into sovi_ops (user_id, command, status, detail) values (${context.userId}, ${"dispatch"}, ${"ok"}, ${"hybrid"})`;
      } catch (err) {
        const msg = err instanceof Error ? err.message : "dispatch failed";
        await sql`insert into sovi_ops (user_id, command, status, detail) values (${context.userId}, ${"dispatch"}, ${"fail"}, ${msg})`;
      }
    }

    const tts = await synthesize(parsed.speak, settings.voiceId);
    return {
      ok: true as const,
      speak: parsed.speak,
      hud: parsed.hud,
      audio: tts?.audio ?? null,
      audioType: tts?.type ?? "audio/mpeg",
      alert,
      used,
    };
  });

export const markAlertRead = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((id: number) => id)
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    await sql`update sovi_alerts set read = true where id = ${data} and user_id = ${context.userId}`;
    return { ok: true as const };
  });

export const clearTranscript = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const sql = await getSql();
    await sql`delete from sovi_messages where user_id = ${context.userId}`;
    return { ok: true as const };
  });

export const testVpsLink = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const settings = await ensureSettings(context.userId);
    const secrets = await secretSettings(context.userId);
    const vpsUrl = settings.vpsUrl ? safeHttpUrl(settings.vpsUrl) : null;
    if (!vpsUrl) return { ok: false as const, error: "No LINK URL configured." };
    const headers: Record<string, string> = secrets?.vps_token ? { Authorization: `Bearer ${secrets.vps_token}` } : {};
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);
    try {
      const shakeRes = await fetch(joinUrl(vpsUrl, "/sovi/handshake"), {
        method: "GET",
        signal: controller.signal,
        headers,
      });
      if (shakeRes.ok) {
        const json = (await shakeRes.json().catch(() => null)) as
          | {
              service?: string;
              chat?: { path?: string; model_id?: string };
              command_webhook?: { path?: string };
              version?: string;
            }
          | null;
        if (json && (json.service === "sovi-gateway" || json.chat?.path)) {
          const chatPath = json.chat?.path || settings.chatPath;
          const commandPath = json.command_webhook?.path || settings.commandPath;
          const vpsModel = json.chat?.model_id || settings.vpsModel;
          const sql = await getSql();
          await sql`
            update sovi_settings
            set chat_path = ${chatPath},
                command_path = ${commandPath},
                vps_model = ${vpsModel},
                updated_at = now()
            where user_id = ${context.userId}
          `;
          const next = await ensureSettings(context.userId);
          return {
            ok: true as const,
            status: shakeRes.status,
            detail: `Handshake ${json.service || "ok"} ${json.version || ""}. Model ${vpsModel}.`.replace(/\s+/g, " ").trim(),
            settings: next,
          };
        }
      }
      const res = await fetch(vpsUrl, { method: "GET", signal: controller.signal, headers });
      return { ok: true as const, status: res.status, detail: `Reached host (${res.status}).`, settings };
    } catch (err) {
      return { ok: false as const, error: err instanceof Error ? err.message : "Unreachable." };
    } finally {
      clearTimeout(timer);
    }
  });
