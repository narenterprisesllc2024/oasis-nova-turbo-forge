# Sovi link protocol

The HUD talks to this gateway over HTTPS. All authenticated routes use:

```
Authorization: Bearer <SOVI_TOKEN>
Content-Type: application/json
```

## Handshake

`GET /sovi/handshake`

Returns the live discovery document (paths, model id, auth). The HUD **Ping link** button reads this and locks CONFIG automatically.

## Chat (OpenAI-compatible)

`POST /v1/chat/completions`

```json
{
  "model": "<model id from handshake>",
  "max_tokens": 400,
  "temperature": 0.6,
  "messages": [
    { "role": "system", "content": "..." },
    { "role": "user", "content": "..." }
  ]
}
```

Response is a normal OpenAI completion. The HUD reads `choices[0].message.content`.

Preferred content is a single JSON object:

```json
{
  "speak": "short voice line",
  "hud": "optional extra readout",
  "alert": { "title": "...", "body": "...", "level": "info" }
}
```

`alert` may be `null`. Streaming is not used.

## Command bus

`POST /sovi/command`

```json
{ "agent": "sovi", "text": "<operator utterance>", "ts": "<ISO-8601>" }
```

Returns `{ "ok": true, "detail": "...", "speak": "..." }`.

With `SOVI_EXECUTE=0` (default) the gateway only logs the command. Set `SOVI_EXECUTE=1` to run `hooks/command.mjs`.

## Health

`GET /` and `GET /health` are unauthenticated liveness checks.

## HUD CONFIG values

| Field | Value |
|---|---|
| VPS base URL | `PUBLIC_BASE_URL` (https) |
| Access token | `SOVI_TOKEN` |
| Chat path | `/v1/chat/completions` |
| Command path | `/sovi/command` |
| Brain | `VPS` or `Hybrid` |
