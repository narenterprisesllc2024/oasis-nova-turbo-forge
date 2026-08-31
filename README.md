# Sovi

Sovereign Voice Interface — a JARVIS-class holographic HUD plus the VPS gateway that lets it run a personal stack by voice.

## Two pieces

**HUD** — the live voice console (this app). Sign in, open LINK, paste the gateway URL.

**Gateway** — [`vps/`](vps/) — clone that folder onto the VPS. It is an OpenAI-compatible brain + command bus with zero npm dependencies. Handshake lets the HUD lock paths and model id automatically.

```
HUD  --Bearer token-->  Sovi Gateway (this repo, vps/)  -->  existing LLM
                                                    \-->  hooks/command.mjs
```

## On the VPS

See [`vps/README.md`](vps/README.md) and [`vps/PROTOCOL.md`](vps/PROTOCOL.md).

1. Clone this repository onto the server.
2. Copy `vps/env.example` to `vps/.env` and fill `SOVI_TOKEN`, `UPSTREAM_URL`, `PUBLIC_BASE_URL`.
3. Start `vps/server.mjs` (or compose / systemd).
4. Put HTTPS in front of it.
5. In the HUD LINK panel: public URL + token → **Ping link** → Brain **VPS** or **Hybrid**.

Do not put live tokens in git. The HUD stores the token on the operator account, not in this repo.
