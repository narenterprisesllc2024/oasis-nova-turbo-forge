import { useState, type FormEvent } from "react";
import { GROK_PROVIDERS, authClient, authEnabled, signIn } from "@/lib/auth/client";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [mode, setMode] = useState<"in" | "up">("in");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onEmail(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      if (mode === "up") {
        const { error: err } = await authClient.signUp.email({
          email,
          password,
          name: name.trim() || "Operator",
          callbackURL: "/",
        });
        if (err) throw new Error(err.message ?? "Sign-up failed");
      } else {
        const { error: err } = await authClient.signIn.email({
          email,
          password,
          callbackURL: "/",
        });
        if (err) throw new Error(err.message ?? "Sign-in failed");
      }
      await authClient.getSession();
      window.location.href = "/";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Access denied.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="hud-panel p-5 sm:p-6">
      <p className="hud-label text-cyan">Biometric lock / fallback</p>
      <h2 className="mt-1 font-display text-2xl font-semibold tracking-wide">IDENTITY REQUIRED</h2>
      <p className="mt-2 font-mono text-xs leading-relaxed text-muted">
        This HUD is sealed to your account. Sign in to bring Sovi online on this device — phone, desktop, or Chromebook.
      </p>

      {authEnabled ? (
        <div className="mt-5 grid gap-2">
          {GROK_PROVIDERS.map((p) => (
            <button
              key={p.providerId}
              type="button"
              className="hud-btn hud-btn-ghost w-full"
              onClick={() => void signIn(p.providerId, { callbackURL: "/" })}
            >
              Continue with {p.label}
            </button>
          ))}
        </div>
      ) : (
        <p className="mt-4 font-mono text-sm text-muted">Sign-in is disabled.</p>
      )}

      <div className="my-5 flex items-center gap-3">
        <span className="h-px flex-1 bg-line" />
        <span className="hud-label">Local credential</span>
        <span className="h-px flex-1 bg-line" />
      </div>

      <form onSubmit={onEmail} className="grid gap-3">
        {mode === "up" ? (
          <input
            className="hud-input"
            placeholder="Callsign"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoComplete="name"
          />
        ) : null}
        <input
          className="hud-input"
          type="email"
          required
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
        />
        <input
          className="hud-input"
          type="password"
          required
          minLength={8}
          placeholder="Passphrase (8+)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete={mode === "up" ? "new-password" : "current-password"}
        />
        {error ? <p className="font-mono text-xs text-warn">{error}</p> : null}
        <button type="submit" className="hud-btn w-full" disabled={busy || !authEnabled}>
          {busy ? "Verifying…" : mode === "up" ? "Create clearance" : "Authorize"}
        </button>
      </form>
      <button
        type="button"
        className="mt-3 w-full font-mono text-xs text-muted underline-offset-4 hover:text-cyan hover:underline"
        onClick={() => setMode((m) => (m === "in" ? "up" : "in"))}
      >
        {mode === "in" ? "No clearance? Create an identity." : "Already cleared? Authorize."}
      </button>
    </div>
  );
}
