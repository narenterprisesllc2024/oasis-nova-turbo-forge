import { Mic, MicOff, LoaderCircle, Volume2 } from "lucide-react";
import type { VoiceState } from "@/lib/sovi/types";
import { cn } from "@/lib/utils";
import { HudRings } from "./chrome";

const LABEL: Record<VoiceState, string> = {
  idle: "STANDBY",
  listening: "LISTENING",
  processing: "THINKING",
  speaking: "SPEAKING",
};

export function Reactor({
  voice,
  onPress,
  onRelease,
  onClick,
  disabled,
}: {
  voice: VoiceState;
  onPress: () => void;
  onRelease: () => void;
  onClick: () => void;
  disabled?: boolean;
}) {
  const live = voice !== "idle";
  return (
    <div className="relative mx-auto mb-10 aspect-square w-[min(78vw,22rem)] sm:w-[22rem]">
      <HudRings active={live} />
      <button
        type="button"
        disabled={disabled}
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId);
          onPress();
        }}
        onPointerUp={onRelease}
        onPointerCancel={onRelease}
        onClick={onClick}
        className={cn(
          "absolute top-1/2 left-1/2 grid size-32 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full sm:size-36",
          "border border-cyan/70 bg-void/80 core-glow anim-core",
          "transition-transform duration-150 ease-out active:scale-95",
          live && "border-cyan",
        )}
        aria-label={voice === "listening" ? "Release to send" : "Hold to talk"}
      >
        <span className="absolute inset-2 rounded-full border border-cyan/30" />
        <span className="absolute inset-5 rounded-full border border-cyan/50" />
        <span className="absolute inset-9 rounded-full bg-cyan/15" />
        {voice === "processing" ? (
          <LoaderCircle className="relative size-8 text-cyan animate-spin" />
        ) : voice === "speaking" ? (
          <Volume2 className="relative size-8 text-cyan" />
        ) : voice === "listening" ? (
          <Mic className="relative size-8 text-cyan" />
        ) : (
          <MicOff className="relative size-8 text-muted" />
        )}
      </button>
      <div className="pointer-events-none absolute inset-x-0 -bottom-1 translate-y-full text-center">
        <div className="hud-label text-cyan">{LABEL[voice]}</div>
        <div className="mt-1 font-mono text-2xs text-muted">HOLD TO TALK  ·  TAP TO TOGGLE</div>
      </div>
    </div>
  );
}
