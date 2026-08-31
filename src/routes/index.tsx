import { createFileRoute } from "@tanstack/react-router";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { HudApp } from "@/components/hud/HudApp";
import { GateScreen } from "@/components/hud/gate";
import { LoginForm } from "@/components/hud/login-form";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  const { user, isPending } = useCurrentUserState();

  if (isPending) {
    return (
      <GateScreen kicker="Identity scan" title="LOCK">
        <div className="hud-panel p-5">
          <p className="hud-label text-cyan">Authenticating</p>
          <h2 className="mt-1 font-display text-2xl font-semibold tracking-wide">SOVEREIGN KERNEL</h2>
          <p className="mt-2 font-mono text-sm leading-relaxed text-muted">
            Verifying operator clearance. Voice bus, HUD projector, and comm channel coming online.
          </p>
          <ul className="mt-4 space-y-1 font-mono text-xs text-cyan">
            <li>VOICE BUS ................ WAIT</li>
            <li>HUD PROJECTOR ............ WAIT</li>
            <li>IDENTITY TOKEN ........... SCAN</li>
          </ul>
        </div>
      </GateScreen>
    );
  }

  if (!user) {
    return (
      <GateScreen kicker="Identity gate" title="LOCK">
        <LoginForm />
      </GateScreen>
    );
  }

  const name = user.displayName?.trim() || user.primaryEmail?.split("@")[0] || "Operator";
  return <HudApp operatorName={name} />;
}
