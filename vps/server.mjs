#!/usr/bin/env node
/**
 * Sovi Gateway — OpenAI-compatible brain + command bus for the Sovi HUD.
 * Zero npm dependencies. Node 18+.
 */
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const VERSION = "1.0.0";

function env(name, fallback = "") {
  return (process.env[name] ?? fallback).trim();
}

const PORT = Number(env("PORT", "8787")) || 8787;
const HOST = env("HOST", "0.0.0.0") || "0.0.0.0";
const TOKEN = env("SOVI_TOKEN");
const PUBLIC_BASE = env("PUBLIC_BASE_URL");
const UPSTREAM_URL = env("UPSTREAM_URL").replace(/\/+$/, "");
const UPSTREAM_KEY = env("UPSTREAM_KEY");
const UPSTREAM_MODEL = env("UPSTREAM_MODEL", "sovi") || "sovi";
const EXECUTE = env("SOVI_EXECUTE") === "1";
const DATA_DIR = env("SOVI_DATA", path.join(__dirname, "data"));

fs.mkdirSync(DATA_DIR, { recursive: true });

export function handshake() {
  return {
    ok: true,
    service: "sovi-gateway",
    version: VERSION,
    public_base_url: PUBLIC_BASE || null,
    tls: {
      https: (PUBLIC_BASE || "").startsWith("https"),
      publicly_reachable: Boolean(PUBLIC_BASE),
    },
    auth: {
      type: TOKEN ? "bearer" : "none",
      header_name: "Authorization",
      header_scheme: "Bearer",
      query_param: null,
    },
    chat: {
      path: "/v1/chat/completions",
      model_id: UPSTREAM_MODEL,
      alternate_models: [],
      streaming: false,
      supports_tools: false,
      supports_json_mode: true,
      extra_headers: {},
      extra_body_fields: {},
      system_prompt_allowed: true,
    },
    tools: {
      style: "webhook",
      available_tools: [],
    },
    command_webhook: {
      exists: true,
      method: "POST",
      path: "/sovi/command",
      request_example: { agent: "sovi", text: "system status", ts: new Date().toISOString() },
      success_response_example: { ok: true, detail: "nominal", speak: "All systems nominal." },
    },
    other_interfaces: [
      { name: "health", method: "GET", path: "/health", purpose: "liveness", auth_same_as_chat: false },
      { name: "models", method: "GET", path: "/v1/models", purpose: "list models", auth_same_as_chat: true },
    ],
    healthcheck: { method: "GET", path: "/health", ok_status: [200] },
    constraints: {
      max_request_seconds: 25,
      ip_allowlist: false,
      cors_required: false,
      self_signed_cert: false,
    },
    notes: UPSTREAM_URL
      ? "Chat is proxied to the configured upstream OpenAI-compatible model."
      : "No UPSTREAM_URL set — onboard fallback brain. Set UPSTREAM_URL to your existing LLM.",
  };
}

function authorized(req) {
  if (!TOKEN) return true;
  const h = String(req.headers.authorization || "");
  return h === `Bearer ${TOKEN}` || h === TOKEN;
}

function send(res, status, body, extra = {}) {
  const json = typeof body === "string" ? body : JSON.stringify(body);
  res.writeHead(status, {
    "content-type": extra.type || "application/json; charset=utf-8",
    "access-control-allow-origin": "*",
    "access-control-allow-headers": "Authorization, Content-Type",
    "access-control-allow-methods": "GET, POST, OPTIONS",
    ...(extra.headers || {}),
  });
  res.end(json);
}

async function readBody(req, limit = 1_000_000) {
  const chunks = [];
  let n = 0;
  for await (const c of req) {
    n += c.length;
    if (n > limit) throw new Error("body too large");
    chunks.push(c);
  }
  if (!chunks.length) return "";
  return Buffer.concat(chunks).toString("utf8");
}

function lastUserText(messages) {
  const users = (messages || []).filter((m) => m && m.role === "user");
  const last = users[users.length - 1];
  return typeof last?.content === "string" ? last.content : "";
}

export function localBrain(messages) {
  const text = lastUserText(messages).toLowerCase();
  let speak = "Online. Gateway linked. Awaiting orders.";
  let hud = UPSTREAM_URL ? `Upstream: ${UPSTREAM_MODEL}` : "Onboard fallback brain — set UPSTREAM_URL to your model.";
  const alert = null;
  if (/status|health|system/.test(text)) {
    const used = Math.round((1 - os.freemem() / os.totalmem()) * 100);
    speak = `Host ${os.hostname()} is up ${Math.round(os.uptime() / 3600)} hours. Memory ${used} percent committed.`;
    hud = `load ${os.loadavg().map((n) => n.toFixed(2)).join(" / ")}`;
  } else if (/who are you|introduce|name/.test(text)) {
    speak = "I am Sovi. This gateway is the sovereign link between the HUD and your stack.";
    hud = `sovi-gateway ${VERSION}`;
  }
  return JSON.stringify({ speak, hud, alert });
}

function chatCompletionsUrl() {
  if (!UPSTREAM_URL) return "";
  if (/\/chat\/completions$/i.test(UPSTREAM_URL)) return UPSTREAM_URL;
  return `${UPSTREAM_URL}/chat/completions`;
}

async function upstreamChat(body) {
  const url = chatCompletionsUrl();
  const model = body.model && body.model !== "sovi" ? body.model : UPSTREAM_MODEL;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...(UPSTREAM_KEY ? { authorization: `Bearer ${UPSTREAM_KEY}` } : {}),
    },
    body: JSON.stringify({ ...body, model, stream: false }),
    signal: AbortSignal.timeout(24000),
  });
  if (!res.ok) {
    const t = await res.text().catch(() => "");
    throw new Error(`upstream ${res.status} ${t.slice(0, 200)}`);
  }
  return res.json();
}

export function openaiWrap(content, model) {
  return {
    id: `chatcmpl-sovi-${Date.now()}`,
    object: "chat.completion",
    created: Math.floor(Date.now() / 1000),
    model,
    choices: [{ index: 0, message: { role: "assistant", content }, finish_reason: "stop" }],
  };
}

function appendLog(file, row) {
  fs.appendFileSync(path.join(DATA_DIR, file), `${JSON.stringify(row)}\n`);
}

export async function runCommand(payload) {
  appendLog("commands.jsonl", { ts: new Date().toISOString(), payload, execute: EXECUTE });
  const hook = path.join(__dirname, "hooks", "command.mjs");
  if (!EXECUTE || !fs.existsSync(hook)) {
    const text = String(payload.text || "");
    if (/status|health/i.test(text)) {
      return {
        ok: true,
        detail: `host=${os.hostname()} uptime_s=${Math.round(os.uptime())}`,
        speak: `Host ${os.hostname()} reporting.`,
      };
    }
    return {
      ok: true,
      detail: "logged",
      speak: "Command logged on the gateway. Enable execution to run the stack hook.",
    };
  }
  return new Promise((resolve) => {
    const child = spawn(process.execPath, [hook], {
      cwd: __dirname,
      env: process.env,
      stdio: ["pipe", "pipe", "pipe"],
    });
    const timer = setTimeout(() => child.kill("SIGKILL"), 20000);
    let out = "";
    let err = "";
    child.stdout.on("data", (d) => {
      out += d;
    });
    child.stderr.on("data", (d) => {
      err += d;
    });
    child.on("close", (code) => {
      clearTimeout(timer);
      try {
        resolve(JSON.parse(out));
      } catch {
        resolve({
          ok: code === 0,
          detail: out || err || `exit ${code}`,
          speak: (out || "Hook returned.").slice(0, 200),
        });
      }
    });
    child.stdin.end(JSON.stringify(payload));
  });
}

export function createSoviServer() {
  return http.createServer(async (req, res) => {
    try {
      if (req.method === "OPTIONS") return send(res, 204, "");
      const url = new URL(req.url || "/", "http://sovi.local");
      const p = url.pathname.replace(/\/+$/, "") || "/";

      if (req.method === "GET" && (p === "/" || p === "/health")) {
        return send(res, 200, {
          ok: true,
          service: "sovi-gateway",
          version: VERSION,
          upstream: Boolean(UPSTREAM_URL),
        });
      }

      if (!authorized(req)) return send(res, 401, { error: "unauthorized" });

      if (req.method === "GET" && p === "/sovi/handshake") {
        return send(res, 200, handshake());
      }
      if (req.method === "GET" && p === "/v1/models") {
        return send(res, 200, {
          object: "list",
          data: [{ id: UPSTREAM_MODEL, object: "model", owned_by: "sovi" }],
        });
      }
      if (req.method === "POST" && p === "/v1/chat/completions") {
        const raw = await readBody(req);
        const body = raw ? JSON.parse(raw) : {};
        if (UPSTREAM_URL) {
          const json = await upstreamChat(body);
          return send(res, 200, json);
        }
        const content = localBrain(body.messages || []);
        return send(res, 200, openaiWrap(content, body.model || UPSTREAM_MODEL));
      }
      if (req.method === "POST" && p === "/sovi/command") {
        const raw = await readBody(req);
        const payload = raw ? JSON.parse(raw) : {};
        const result = await runCommand(payload);
        return send(res, 200, result);
      }
      send(res, 404, { error: "not found" });
    } catch (err) {
      send(res, 500, { error: err instanceof Error ? err.message : "internal" });
    }
  });
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isMain) {
  const server = createSoviServer();
  server.listen(PORT, HOST, () => {
    console.log(`sovi-gateway ${VERSION} on ${HOST}:${PORT}`);
    if (!TOKEN) console.warn("SOVI_TOKEN is empty — set a token before exposing this host.");
    if (!UPSTREAM_URL) console.warn("UPSTREAM_URL is empty — using onboard fallback brain.");
  });
}
