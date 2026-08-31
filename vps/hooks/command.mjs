#!/usr/bin/env node
/**
 * Sovi command hook. The gateway posts JSON on stdin:
 *   { "agent": "sovi", "text": "<utterance>", "ts": "<ISO-8601>" }
 * Print a JSON object to stdout:
 *   { "ok": true, "detail": "...", "speak": "short voice line" }
 *
 * Edit this file to drive your real stack. Keep it allowlisted.
 * The gateway only runs this file when SOVI_EXECUTE=1.
 */
import os from "node:os";

const chunks = [];
for await (const c of process.stdin) chunks.push(c);
let payload = {};
try {
  payload = JSON.parse(Buffer.concat(chunks).toString("utf8") || "{}");
} catch {
  payload = {};
}

const text = String(payload.text || "").toLowerCase();
let result = {
  ok: true,
  detail: "acknowledged",
  speak: "Command received on the stack.",
};

if (/status|health|uptime|system/.test(text)) {
  const used = Math.round((1 - os.freemem() / os.totalmem()) * 100);
  result = {
    ok: true,
    detail: JSON.stringify({
      host: os.hostname(),
      load: os.loadavg(),
      mem_used_pct: used,
      uptime_s: Math.round(os.uptime()),
    }),
    speak: `${os.hostname()} is online. Memory ${used} percent committed.`,
  };
}

process.stdout.write(JSON.stringify(result));
