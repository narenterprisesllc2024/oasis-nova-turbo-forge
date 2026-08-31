import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { GateScreen } from "@/components/hud/gate";
import { LoginForm } from "@/components/hud/login-form";

export const Route = createFileRoute("/login")({ component: Login });

function Login() {
  const { user, isPending } = useCurrentUserState();
  if (!isPending && user) return <Navigate to="/" />;
  return (
    <GateScreen kicker="Identity gate" title="LOCK">
      <LoginForm />
    </GateScreen>
  );
}
