#!/usr/bin/env node
process.env.SOVI_TOKEN = process.env.SOVI_TOKEN || "test-token";
process.env.UPSTREAM_MODEL = process.env.UPSTREAM_MODEL || "sovi";

const { createSoviServer } = await import("./server.mjs");

const server = createSoviServer();

await new Promise((resolve, reject) => {
  server.listen(0, "127.0.0.1", resolve);
  server.on("error", reject);
});

const { port } = server.address();
const base = `http://127.0.0.1:${port}`;
const headers = { authorization: "Bearer test-token", "content-type": "application/json" };

async function check(name, fn) {
  try {
    await fn();
    console.log(`ok  ${name}`);
  } catch (err) {
    console.error(`fail ${name}: ${err instanceof Error ? err.message : err}`);
    server.close();
    process.exit(1);
  }
}

await check("health", async () => {
  const res = await fetch(`${base}/health`);
  const json = await res.json();
  if (!res.ok || json.service !== "sovi-gateway") throw new Error(JSON.stringify(json));
});

await check("unauthorized", async () => {
  const res = await fetch(`${base}/sovi/handshake`);
  if (res.status !== 401) throw new Error(`expected 401 got ${res.status}`);
});

await check("handshake", async () => {
  const res = await fetch(`${base}/sovi/handshake`, { headers });
  const json = await res.json();
  if (!json.ok || json.chat.path !== "/v1/chat/completions") throw new Error(JSON.stringify(json));
  if (json.command_webhook.path !== "/sovi/command") throw new Error("missing command path");
});

await check("chat", async () => {
  const res = await fetch(`${base}/v1/chat/completions`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      model: "sovi",
      messages: [
        { role: "system", content: "You are Sovi." },
        { role: "user", content: "who are you" },
      ],
    }),
  });
  const json = await res.json();
  const text = json.choices?.[0]?.message?.content || "";
  const parsed = JSON.parse(text);
  if (!parsed.speak) throw new Error(text);
});

await check("command", async () => {
  const res = await fetch(`${base}/sovi/command`, {
    method: "POST",
    headers,
    body: JSON.stringify({ agent: "sovi", text: "system status", ts: new Date().toISOString() }),
  });
  const json = await res.json();
  if (!json.ok) throw new Error(JSON.stringify(json));
});

server.close();
console.log("sovi-gateway tests passed");
