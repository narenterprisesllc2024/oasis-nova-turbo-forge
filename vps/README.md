# Sovi Gateway

Drop-in brain for the Sovi HUD. Clone this folder onto the VPS, point it at the existing OpenAI-compatible model, expose it on HTTPS, then paste the public URL and token into the HUD **LINK** panel.

It already speaks the HUD dialect:

- `POST /v1/chat/completions` — OpenAI-compatible chat
- `POST /sovi/command` — command bus
- `GET /sovi/handshake` — auto-config for the HUD

## Quick start

1. Copy `env.example` to `.env` and set `SOVI_TOKEN` to a long random string.
2. Set `UPSTREAM_URL` / `UPSTREAM_KEY` / `UPSTREAM_MODEL` to the existing LLM (Ollama, vLLM, llama.cpp, LiteLLM, OpenAI-compatible proxy). Leave them blank to use the onboard fallback brain.
3. Set `PUBLIC_BASE_URL` to the public HTTPS hostname in front of this process.
4. Start with `node server.mjs`, or `docker compose up -d`, or the included systemd unit.
5. Put Caddy / nginx / Cloudflare Tunnel in front using `Caddyfile.example`.
6. In the HUD: LINK → paste the public URL and token → **Ping link**. Handshake fills the rest.
7. Set Brain to **VPS** (all talk through this host) or **Hybrid** (talk in the HUD, dispatch run/execute lines here).

Node 18+ is enough. There are no npm dependencies.

## Safety

Commands are **logged only** until `SOVI_EXECUTE=1`. Then `hooks/command.mjs` runs. Edit that file to drive the real stack — keep an allowlist, do not shell out on raw operator text.

## Files

| File | Role |
|---|---|
| `server.mjs` | Gateway |
| `hooks/command.mjs` | Optional command hook |
| `env.example` | Environment template |
| `docker-compose.yml` | Container run |
| `sovi.service` | systemd unit |
| `PROTOCOL.md` | Wire contract |
