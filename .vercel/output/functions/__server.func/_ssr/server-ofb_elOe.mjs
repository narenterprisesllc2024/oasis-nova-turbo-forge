import { i as TSS_SERVER_FUNCTION, r as createServerFn } from "./ssr.mjs";
import { r as getSql } from "./db-BKFnQWon.mjs";
import { t as authMiddleware } from "./middleware-Bm49AV9k.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/server-ofb_elOe.js
var createServerRpc = (serverFnMeta, splitImportFn) => {
	const url = "/_serverFn/" + serverFnMeta.id;
	return Object.assign(splitImportFn, {
		url,
		serverFnMeta,
		[TSS_SERVER_FUNCTION]: true
	});
};
var VOICES = /* @__PURE__ */ new Set([
	"orion",
	"eve",
	"atlas",
	"leo",
	"helix",
	"luna"
]);
var BRAINS = /* @__PURE__ */ new Set([
	"cloud",
	"vps",
	"hybrid"
]);
function asBool(v) {
	return v === true || v === "t" || v === "true" || v === 1;
}
function mapSettings(row) {
	return {
		wakeWord: row?.wake_word || "Sovi",
		voiceId: row?.voice_id || "orion",
		alwaysListen: asBool(row?.always_listen),
		vpsUrl: row?.vps_url ?? "",
		hasToken: Boolean(row?.vps_token),
		chatPath: row?.chat_path || "/v1/chat/completions",
		commandPath: row?.command_path || "/sovi/command",
		vpsModel: row?.vps_model || "sovi",
		brainMode: BRAINS.has(row?.brain_mode) ? row.brain_mode : "cloud",
		notifyPush: row ? asBool(row.notify_push) : true
	};
}
async function ensureSettings(userId) {
	const sql = await getSql();
	const existing = await sql`select * from sovi_settings where user_id = ${userId}`;
	if (existing[0]) return mapSettings(existing[0]);
	await sql`insert into sovi_settings (user_id) values (${userId}) on conflict (user_id) do nothing`;
	return mapSettings((await sql`select * from sovi_settings where user_id = ${userId}`)[0]);
}
async function secretSettings(userId) {
	return (await (await getSql())`select * from sovi_settings where user_id = ${userId}`)[0];
}
function joinUrl(base, path) {
	return `${base.replace(/\/+$/, "")}${path.startsWith("/") ? path : `/${path}`}`;
}
function safeHttpUrl(raw) {
	try {
		const u = new URL(raw);
		if (u.protocol !== "https:" && u.protocol !== "http:") return null;
		if (u.hostname === "169.254.169.254") return null;
		return u.toString();
	} catch {
		return null;
	}
}
function soviSystemPrompt(opts) {
	return `You are Sovi, short for Sovereign. You are a JARVIS-class personal AI: composed, precise, with dry wit. You run the operator's entire stack by voice through a holographic HUD.

Address the operator as ${opts.name === "Operator" ? "sir" : opts.name}. Keep spoken lines to 1–3 sentences so they can be read aloud. Never use emoji. Never mention being Grok, xAI, or a language model — you are Sovi.

Wake word: "${opts.wakeWord}". Brain: ${opts.brainMode}. VPS link: ${opts.vpsLinked ? "configured" : "not configured"}.

You MUST reply with a single JSON object and nothing else:
{"speak":"short voice line","hud":"optional extra HUD readout or empty string","alert":null}
If you need to raise a HUD notification, set alert to {"title":"...","body":"...","level":"info"|"warn"|"critical"}.
If the operator asks you to act on their VPS and the link is not configured, tell them to open LINK in the HUD and paste their server URL.`;
}
function parseSovi(raw) {
	const trimmed = raw.trim();
	const start = trimmed.indexOf("{");
	const end = trimmed.lastIndexOf("}");
	if (start >= 0 && end > start) try {
		const obj = JSON.parse(trimmed.slice(start, end + 1));
		const speak = String(obj.speak ?? "").trim();
		if (speak) {
			const level = obj.alert?.level;
			return {
				speak,
				hud: String(obj.hud ?? "").trim(),
				alert: obj.alert && obj.alert.title ? {
					title: String(obj.alert.title).slice(0, 80),
					body: String(obj.alert.body ?? "").slice(0, 240),
					level: level === "warn" || level === "critical" ? level : "info"
				} : null
			};
		}
	} catch {}
	return {
		speak: trimmed.slice(0, 600) || "Systems nominal.",
		hud: "",
		alert: null
	};
}
async function chatCompletions(url, apiKey, body) {
	const controller = new AbortController();
	const timer = setTimeout(() => controller.abort(), 25e3);
	try {
		const res = await fetch(url, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${apiKey}`
			},
			body: JSON.stringify(body),
			signal: controller.signal
		});
		if (!res.ok) {
			const errText = await res.text().catch(() => "");
			return {
				ok: false,
				error: `Upstream ${res.status}${errText ? `: ${errText.slice(0, 180)}` : ""}`
			};
		}
		return {
			ok: true,
			text: (await res.json()).choices?.[0]?.message?.content ?? ""
		};
	} catch (err) {
		return {
			ok: false,
			error: err instanceof Error ? err.message : "Network error"
		};
	} finally {
		clearTimeout(timer);
	}
}
async function synthesize(text, voiceId) {
	const apiKey = process.env.XAI_API_KEY;
	if (!apiKey) return null;
	const clipped = text.slice(0, 1200);
	try {
		const res = await fetch("https://api.x.ai/v1/tts", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${apiKey}`
			},
			body: JSON.stringify({
				text: clipped,
				voice_id: voiceId,
				language: "en",
				output_format: {
					codec: "mp3",
					sample_rate: 24e3,
					bit_rate: 128e3
				}
			})
		});
		if (!res.ok) return null;
		return {
			audio: Buffer.from(await res.arrayBuffer()).toString("base64"),
			type: "audio/mpeg"
		};
	} catch {
		return null;
	}
}
async function transcribeAudio(b64, mime) {
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
			body: form
		});
		if (!res.ok) return null;
		return ((await res.json()).text ?? "").trim() || null;
	} catch {
		return null;
	}
}
var loadHud_createServerFn_handler = createServerRpc({
	id: "15fc56555351003ab9c039faf61191937c940e7ff35208836d8a34fd4fd750b1",
	name: "loadHud",
	filename: "src/lib/sovi/server.ts"
}, (opts) => loadHud.__executeServer(opts));
var loadHud = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(loadHud_createServerFn_handler, async ({ context }) => {
	const sql = await getSql();
	const settings = await ensureSettings(context.userId);
	const messages = await sql`
      select id, role, content, created_at::text as created_at
      from sovi_messages
      where user_id = ${context.userId}
      order by id desc
      limit 40
    `;
	const alerts = await sql`
      select id, title, body, level, read, created_at::text as created_at
      from sovi_alerts
      where user_id = ${context.userId}
      order by id desc
      limit 20
    `;
	const ops = await sql`
      select id, command, status, detail, created_at::text as created_at
      from sovi_ops
      where user_id = ${context.userId}
      order by id desc
      limit 12
    `;
	return {
		settings,
		messages: messages.slice().reverse().map((m) => ({
			id: m.id,
			role: m.role === "user" || m.role === "sovi" ? m.role : "system",
			content: m.content,
			createdAt: m.created_at
		})),
		alerts: alerts.map((a) => ({
			id: a.id,
			title: a.title,
			body: a.body,
			level: a.level === "warn" || a.level === "critical" ? a.level : "info",
			read: asBool(a.read),
			createdAt: a.created_at
		})),
		ops: ops.map((o) => ({
			id: o.id,
			command: o.command,
			status: o.status,
			detail: o.detail,
			createdAt: o.created_at
		}))
	};
});
var saveSettings_createServerFn_handler = createServerRpc({
	id: "3b22a510c847610121392428e904516fbb61d824f3350a6165f7c402e70d00b0",
	name: "saveSettings",
	filename: "src/lib/sovi/server.ts"
}, (opts) => saveSettings.__executeServer(opts));
var saveSettings = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => input).handler(saveSettings_createServerFn_handler, async ({ context, data }) => {
	await ensureSettings(context.userId);
	const sql = await getSql();
	const current = await secretSettings(context.userId);
	const wake = (data.wakeWord ?? current?.wake_word ?? "Sovi").trim().slice(0, 32) || "Sovi";
	const voice = VOICES.has(data.voiceId ?? "") ? data.voiceId : current?.voice_id || "orion";
	const listen = data.alwaysListen ?? asBool(current?.always_listen);
	const vpsUrl = data.vpsUrl !== void 0 ? data.vpsUrl.trim().slice(0, 400) : current?.vps_url ?? "";
	if (vpsUrl && !safeHttpUrl(vpsUrl)) return {
		ok: false,
		error: "LINK URL must be http or https."
	};
	const chatPath = (data.chatPath ?? current?.chat_path ?? "/v1/chat/completions").trim().slice(0, 120) || "/v1/chat/completions";
	const commandPath = (data.commandPath ?? current?.command_path ?? "/sovi/command").trim().slice(0, 120) || "/sovi/command";
	const vpsModel = (data.vpsModel ?? current?.vps_model ?? "sovi").trim().slice(0, 80) || "sovi";
	const brain = BRAINS.has(data.brainMode) ? data.brainMode : current?.brain_mode ?? "cloud";
	const notify = data.notifyPush ?? (current ? asBool(current.notify_push) : true);
	let token = current?.vps_token ?? null;
	if (typeof data.vpsToken === "string") token = data.vpsToken.trim() ? data.vpsToken.trim().slice(0, 400) : null;
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
	return {
		ok: true,
		settings: await ensureSettings(context.userId)
	};
});
var transcribeUtterance_createServerFn_handler = createServerRpc({
	id: "c33bad44684c41e0d42c5d01f7d2a6839fc0fb62c20d66d13dfb680b84716e89",
	name: "transcribeUtterance",
	filename: "src/lib/sovi/server.ts"
}, (opts) => transcribeUtterance.__executeServer(opts));
var transcribeUtterance = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => input).handler(transcribeUtterance_createServerFn_handler, async ({ data }) => {
	if (!data.audio || data.audio.length > 25e5) return {
		ok: false,
		error: "Audio clip too large."
	};
	const text = await transcribeAudio(data.audio, data.mime || "audio/webm");
	if (!text) return {
		ok: false,
		error: "Could not transcribe."
	};
	return {
		ok: true,
		text
	};
});
var askSovi_createServerFn_handler = createServerRpc({
	id: "a6d1932bcf20911a87be4610c4d81b7b4f64b10065f70a86e99ab4bd55ff97b3",
	name: "askSovi",
	filename: "src/lib/sovi/server.ts"
}, (opts) => askSovi.__executeServer(opts));
var askSovi = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => {
	return {
		text: String(input?.text ?? "").trim().slice(0, 4e3),
		operatorName: String(input?.operatorName ?? "Operator").slice(0, 80)
	};
}).handler(askSovi_createServerFn_handler, async ({ context, data }) => {
	if (!data.text) return {
		ok: false,
		error: "Empty transmission."
	};
	const sql = await getSql();
	const settings = await ensureSettings(context.userId);
	const secrets = await secretSettings(context.userId);
	await sql`insert into sovi_messages (user_id, role, content) values (${context.userId}, ${"user"}, ${data.text})`;
	const messages = (await sql`
      select id, role, content, created_at::text as created_at
      from sovi_messages
      where user_id = ${context.userId}
      order by id desc
      limit 16
    `).slice().reverse().map((m) => ({
		role: m.role === "user" ? "user" : "assistant",
		content: m.content
	}));
	const system = soviSystemPrompt({
		name: data.operatorName || "Operator",
		brainMode: settings.brainMode,
		vpsLinked: Boolean(settings.vpsUrl),
		wakeWord: settings.wakeWord
	});
	let raw = "";
	let used = "cloud";
	const vpsUrl = settings.vpsUrl ? safeHttpUrl(settings.vpsUrl) : null;
	const vpsToken = secrets?.vps_token ?? "";
	if ((settings.brainMode === "vps" || settings.brainMode === "hybrid") && vpsUrl) {
		const vps = await chatCompletions(joinUrl(vpsUrl, settings.chatPath), vpsToken, {
			model: settings.vpsModel || "sovi",
			max_tokens: 400,
			temperature: .6,
			messages: [{
				role: "system",
				content: system
			}, ...messages]
		});
		if (vps.ok && vps.text) {
			raw = vps.text;
			used = "vps";
		} else if (settings.brainMode === "vps") {
			await sql`insert into sovi_ops (user_id, command, status, detail) values (${context.userId}, ${"chat"}, ${"fail"}, ${vps.ok ? "empty" : vps.error})`;
			return {
				ok: false,
				error: `VPS link failed. ${vps.ok ? "Empty reply." : vps.error}`
			};
		}
	}
	if (!raw) {
		const apiKey = process.env.XAI_API_KEY;
		if (!apiKey) return {
			ok: false,
			error: "Core is offline in this environment."
		};
		const grok = await chatCompletions("https://api.x.ai/v1/chat/completions", apiKey, {
			model: "grok-4.5",
			max_tokens: 400,
			temperature: .6,
			messages: [{
				role: "system",
				content: system
			}, ...messages]
		});
		if (!grok.ok) return {
			ok: false,
			error: grok.error
		};
		raw = grok.text;
		used = "cloud";
	}
	const parsed = parseSovi(raw);
	const stored = parsed.hud ? `${parsed.speak}\n${parsed.hud}` : parsed.speak;
	await sql`insert into sovi_messages (user_id, role, content) values (${context.userId}, ${"sovi"}, ${stored})`;
	await sql`insert into sovi_ops (user_id, command, status, detail) values (${context.userId}, ${"ask"}, ${"ok"}, ${used})`;
	let alert = null;
	if (parsed.alert) {
		const row = (await sql`
        insert into sovi_alerts (user_id, title, body, level)
        values (${context.userId}, ${parsed.alert.title}, ${parsed.alert.body}, ${parsed.alert.level})
        returning id, created_at::text as created_at
      `)[0];
		if (row) alert = {
			id: row.id,
			title: parsed.alert.title,
			body: parsed.alert.body,
			level: parsed.alert.level,
			read: false,
			createdAt: row.created_at
		};
	}
	if (settings.brainMode === "hybrid" && vpsUrl && /\b(run|execute|dispatch|send to (the )?(server|vps|stack))\b/i.test(data.text)) try {
		const controller = new AbortController();
		const timer = setTimeout(() => controller.abort(), 8e3);
		await fetch(joinUrl(vpsUrl, settings.commandPath), {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				...vpsToken ? { Authorization: `Bearer ${vpsToken}` } : {}
			},
			body: JSON.stringify({
				agent: "sovi",
				text: data.text,
				ts: (/* @__PURE__ */ new Date()).toISOString()
			}),
			signal: controller.signal
		}).finally(() => clearTimeout(timer));
		await sql`insert into sovi_ops (user_id, command, status, detail) values (${context.userId}, ${"dispatch"}, ${"ok"}, ${"hybrid"})`;
	} catch (err) {
		const msg = err instanceof Error ? err.message : "dispatch failed";
		await sql`insert into sovi_ops (user_id, command, status, detail) values (${context.userId}, ${"dispatch"}, ${"fail"}, ${msg})`;
	}
	const tts = await synthesize(parsed.speak, settings.voiceId);
	return {
		ok: true,
		speak: parsed.speak,
		hud: parsed.hud,
		audio: tts?.audio ?? null,
		audioType: tts?.type ?? "audio/mpeg",
		alert,
		used
	};
});
var markAlertRead_createServerFn_handler = createServerRpc({
	id: "d208dfba17967b420fab93a238bcf086e7a50fc5bbd3c32d18e505d44cfd54b0",
	name: "markAlertRead",
	filename: "src/lib/sovi/server.ts"
}, (opts) => markAlertRead.__executeServer(opts));
var markAlertRead = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((id) => id).handler(markAlertRead_createServerFn_handler, async ({ context, data }) => {
	await (await getSql())`update sovi_alerts set read = true where id = ${data} and user_id = ${context.userId}`;
	return { ok: true };
});
var clearTranscript_createServerFn_handler = createServerRpc({
	id: "cc44d8ed6d37c9fd7637741ad323b243085dc8d4ab2b734a52e1c1db1ab0cf10",
	name: "clearTranscript",
	filename: "src/lib/sovi/server.ts"
}, (opts) => clearTranscript.__executeServer(opts));
var clearTranscript = createServerFn({ method: "POST" }).middleware([authMiddleware]).handler(clearTranscript_createServerFn_handler, async ({ context }) => {
	await (await getSql())`delete from sovi_messages where user_id = ${context.userId}`;
	return { ok: true };
});
var testVpsLink_createServerFn_handler = createServerRpc({
	id: "7670c691746d1e81bf6f705075ff133fdd1a2fe3367ddae750614dd53189ea57",
	name: "testVpsLink",
	filename: "src/lib/sovi/server.ts"
}, (opts) => testVpsLink.__executeServer(opts));
var testVpsLink = createServerFn({ method: "POST" }).middleware([authMiddleware]).handler(testVpsLink_createServerFn_handler, async ({ context }) => {
	const settings = await ensureSettings(context.userId);
	const secrets = await secretSettings(context.userId);
	const vpsUrl = settings.vpsUrl ? safeHttpUrl(settings.vpsUrl) : null;
	if (!vpsUrl) return {
		ok: false,
		error: "No LINK URL configured."
	};
	const headers = secrets?.vps_token ? { Authorization: `Bearer ${secrets.vps_token}` } : {};
	const controller = new AbortController();
	const timer = setTimeout(() => controller.abort(), 8e3);
	try {
		const shakeRes = await fetch(joinUrl(vpsUrl, "/sovi/handshake"), {
			method: "GET",
			signal: controller.signal,
			headers
		});
		if (shakeRes.ok) {
			const json = await shakeRes.json().catch(() => null);
			if (json && (json.service === "sovi-gateway" || json.chat?.path)) {
				const chatPath = json.chat?.path || settings.chatPath;
				const commandPath = json.command_webhook?.path || settings.commandPath;
				const vpsModel = json.chat?.model_id || settings.vpsModel;
				await (await getSql())`
            update sovi_settings
            set chat_path = ${chatPath},
                command_path = ${commandPath},
                vps_model = ${vpsModel},
                updated_at = now()
            where user_id = ${context.userId}
          `;
				const next = await ensureSettings(context.userId);
				return {
					ok: true,
					status: shakeRes.status,
					detail: `Handshake ${json.service || "ok"} ${json.version || ""}. Model ${vpsModel}.`.replace(/\s+/g, " ").trim(),
					settings: next
				};
			}
		}
		const res = await fetch(vpsUrl, {
			method: "GET",
			signal: controller.signal,
			headers
		});
		return {
			ok: true,
			status: res.status,
			detail: `Reached host (${res.status}).`,
			settings
		};
	} catch (err) {
		return {
			ok: false,
			error: err instanceof Error ? err.message : "Unreachable."
		};
	} finally {
		clearTimeout(timer);
	}
});
//#endregion
export { askSovi_createServerFn_handler, clearTranscript_createServerFn_handler, loadHud_createServerFn_handler, markAlertRead_createServerFn_handler, saveSettings_createServerFn_handler, testVpsLink_createServerFn_handler, transcribeUtterance_createServerFn_handler };
