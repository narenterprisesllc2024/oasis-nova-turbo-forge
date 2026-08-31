import { o as __toESM } from "../_runtime.mjs";
import { y as require_jsx_runtime, z as require_react } from "../_libs/@tanstack/react-router+[...].mjs";
import { a as getServerFnById, i as TSS_SERVER_FUNCTION, r as createServerFn } from "./ssr.mjs";
import { i as signOut } from "./client-B40BzJxt.mjs";
import { a as LoginForm, c as useCurrentUserState, i as HudRings, n as GateScreen, o as ScanSweep, r as HudClock, s as WaveBars, t as CornerBrackets } from "./login-form-DCBfiEED.mjs";
import { a as Shield, c as Radio, d as LoaderCircle, f as Link2, h as Activity, l as Mic, m as Cpu, n as Wifi, o as Settings2, p as LayoutGrid, r as Volume2, s as Send, t as X, u as MicOff } from "../_libs/lucide-react.mjs";
import { t as authMiddleware } from "./middleware-Bm49AV9k.mjs";
import { t as create } from "../_libs/zustand.mjs";
import { t as clsx } from "../_libs/clsx.mjs";
import { t as twMerge } from "../_libs/tailwind-merge.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-GiKMkG7N.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var createSsrRpc = (functionId) => {
	const url = "/_serverFn/" + functionId;
	const serverFnMeta = { id: functionId };
	const fn = async (...args) => {
		return (await getServerFnById(functionId, { origin: "server" }))(...args);
	};
	return Object.assign(fn, {
		url,
		serverFnMeta,
		[TSS_SERVER_FUNCTION]: true
	});
};
var loadHud = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(createSsrRpc("15fc56555351003ab9c039faf61191937c940e7ff35208836d8a34fd4fd750b1"));
var saveSettings = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => input).handler(createSsrRpc("3b22a510c847610121392428e904516fbb61d824f3350a6165f7c402e70d00b0"));
var transcribeUtterance = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => input).handler(createSsrRpc("c33bad44684c41e0d42c5d01f7d2a6839fc0fb62c20d66d13dfb680b84716e89"));
var askSovi = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => {
	return {
		text: String(input?.text ?? "").trim().slice(0, 4e3),
		operatorName: String(input?.operatorName ?? "Operator").slice(0, 80)
	};
}).handler(createSsrRpc("a6d1932bcf20911a87be4610c4d81b7b4f64b10065f70a86e99ab4bd55ff97b3"));
var markAlertRead = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((id) => id).handler(createSsrRpc("d208dfba17967b420fab93a238bcf086e7a50fc5bbd3c32d18e505d44cfd54b0"));
var clearTranscript = createServerFn({ method: "POST" }).middleware([authMiddleware]).handler(createSsrRpc("cc44d8ed6d37c9fd7637741ad323b243085dc8d4ab2b734a52e1c1db1ab0cf10"));
var testVpsLink = createServerFn({ method: "POST" }).middleware([authMiddleware]).handler(createSsrRpc("7670c691746d1e81bf6f705075ff133fdd1a2fe3367ddae750614dd53189ea57"));
var useSovi = create((set) => ({
	voice: "idle",
	interim: "",
	messages: [],
	alerts: [],
	ops: [],
	settings: null,
	booted: false,
	panel: "none",
	micReady: null,
	online: typeof navigator === "undefined" ? true : navigator.onLine,
	error: null,
	handsFree: false,
	setVoice: (voice) => set({ voice }),
	setInterim: (interim) => set({ interim }),
	setMessages: (messages) => set({ messages }),
	addMessage: (message) => set((s) => ({ messages: [...s.messages, message].slice(-80) })),
	setAlerts: (alerts) => set({ alerts }),
	prependAlert: (alert) => set((s) => ({ alerts: [alert, ...s.alerts].slice(0, 20) })),
	setOps: (ops) => set({ ops }),
	setSettings: (settings) => set({ settings }),
	setBooted: (booted) => set({ booted }),
	setPanel: (panel) => set({ panel }),
	setMicReady: (micReady) => set({ micReady }),
	setOnline: (online) => set({ online }),
	setError: (error) => set({ error }),
	setHandsFree: (handsFree) => set({ handsFree })
}));
function getSpeechRecognition() {
	if (typeof window === "undefined") return null;
	return window.SpeechRecognition ?? window.webkitSpeechRecognition ?? null;
}
function stripWake(transcript, wakeWord) {
	const t = transcript.trim();
	if (!t) return null;
	const wake = wakeWord.trim() || "Sovi";
	const patterns = [new RegExp(`^\\s*(?:hey|ok|okay|hi)?\\s*${escapeReg(wake)}[,:]?\\s*`, "i"), new RegExp(`^\\s*sovereign[,:]?\\s*`, "i")];
	for (const p of patterns) if (p.test(t)) {
		const rest = t.replace(p, "").trim();
		return rest.length ? rest : "";
	}
	return null;
}
function escapeReg(s) {
	return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
async function playBase64Audio(b64, mime) {
	const url = `data:${mime};base64,${b64}`;
	const audio = new Audio(url);
	audio.preload = "auto";
	await new Promise((resolve, reject) => {
		audio.onended = () => resolve();
		audio.onerror = () => reject(/* @__PURE__ */ new Error("Playback failed"));
		audio.play().catch(reject);
	});
}
function speakFallback(text) {
	return new Promise((resolve) => {
		if (typeof window === "undefined" || !window.speechSynthesis) {
			resolve();
			return;
		}
		window.speechSynthesis.cancel();
		const u = new SpeechSynthesisUtterance(text);
		u.rate = 1.02;
		u.pitch = .92;
		u.onend = () => resolve();
		u.onerror = () => resolve();
		window.speechSynthesis.speak(u);
	});
}
async function recordClip(ms = 6e3) {
	if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) return null;
	const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
	const mime = MediaRecorder.isTypeSupported("audio/webm;codecs=opus") ? "audio/webm;codecs=opus" : MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : "";
	const rec = new MediaRecorder(stream, mime ? { mimeType: mime } : void 0);
	const chunks = [];
	rec.ondataavailable = (e) => {
		if (e.data.size) chunks.push(e.data);
	};
	rec.start();
	await new Promise((r) => setTimeout(r, ms));
	if (rec.state !== "inactive") rec.stop();
	const blob = await new Promise((resolve) => {
		rec.onstop = () => resolve(new Blob(chunks, { type: rec.mimeType || "audio/webm" }));
	});
	stream.getTracks().forEach((t) => t.stop());
	const buf = await blob.arrayBuffer();
	const bytes = new Uint8Array(buf);
	let binary = "";
	for (let i = 0; i < bytes.length; i += 1) binary += String.fromCharCode(bytes[i]);
	return {
		audio: btoa(binary),
		mime: blob.type || "audio/webm"
	};
}
async function requestMic() {
	try {
		(await navigator.mediaDevices.getUserMedia({ audio: true })).getTracks().forEach((t) => t.stop());
		return true;
	} catch {
		return false;
	}
}
async function enableWakeLock() {
	try {
		if (typeof navigator === "undefined" || !("wakeLock" in navigator)) return null;
		return await navigator.wakeLock.request("screen");
	} catch {
		return null;
	}
}
function notifyBrowser(title, body) {
	if (typeof window === "undefined" || !("Notification" in window)) return;
	if (Notification.permission === "granted") try {
		new Notification(title, {
			body,
			silent: false
		});
	} catch {}
}
async function requestNotify() {
	if (typeof window === "undefined" || !("Notification" in window)) return false;
	if (Notification.permission === "granted") return true;
	if (Notification.permission === "denied") return false;
	return await Notification.requestPermission() === "granted";
}
function cn(...inputs) {
	return twMerge(clsx(inputs));
}
function Module({ icon: Icon, label, value, ok }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex items-center gap-2 border-b border-line/80 py-2 last:border-b-0",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { className: cn("size-3.5 shrink-0", ok ? "text-ok" : "text-warn") }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "min-w-0 flex-1",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "hud-label",
					children: label
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "hud-readout truncate text-sm text-fg",
					children: value
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: cn("size-1.5 rounded-full", ok ? "bg-ok" : "bg-warn") })
		]
	});
}
function StatusPanel({ voice, online, micReady, linked, brain, name }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("aside", {
		className: "hud-panel p-3 sm:p-4",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mb-2 flex items-center justify-between",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "hud-label",
					children: "System diagnostics"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Activity, { className: "size-3.5 text-cyan" })]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Module, {
				icon: Cpu,
				label: "Core",
				value: brain.toUpperCase(),
				ok: true
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Module, {
				icon: Radio,
				label: "Comm",
				value: voice === "idle" ? "STANDBY" : voice.toUpperCase(),
				ok: voice !== "idle"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Module, {
				icon: Shield,
				label: "Auth",
				value: name,
				ok: true
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Module, {
				icon: Wifi,
				label: "Net",
				value: online ? "ONLINE" : "OFFLINE",
				ok: online
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Module, {
				icon: Activity,
				label: "Sens",
				value: micReady === null ? "UNKNOWN" : micReady ? "MIC READY" : "MIC BLOCKED",
				ok: micReady !== false
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Module, {
				icon: Link2,
				label: "Link",
				value: linked ? "VPS ARMED" : "NOT BOUND",
				ok: linked
			})
		]
	});
}
function TranscriptPanel({ messages, interim, voice }) {
	const last = messages.slice(-8);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		className: "hud-panel flex min-h-40 flex-col p-3 sm:p-4",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mb-2 flex items-center justify-between",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "hud-label",
				children: "Comm log"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(WaveBars, { active: voice === "listening" || voice === "speaking" })]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex-1 space-y-2 overflow-y-auto pr-1",
			children: [last.length === 0 && !interim ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "font-mono text-sm text-muted",
				children: "Awaiting transmission. Hold the core, or type below."
			}) : last.map((m) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid gap-0.5",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "hud-label",
					children: m.role === "user" ? "Operator" : "Sovi"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: cn("text-sm leading-snug", m.role === "sovi" ? "text-cyan" : "text-fg"),
					children: m.content
				})]
			}, m.id)), interim ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "font-mono text-sm text-muted italic",
				children: interim
			}) : null]
		})]
	});
}
function AlertsPanel({ alerts, ops, onRead }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("aside", {
		className: "hud-panel p-3 sm:p-4",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mb-2 flex items-center justify-between",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "hud-label",
					children: "Alerts"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
					className: "hud-readout text-2xs text-cyan",
					children: [alerts.filter((a) => !a.read).length, " OPEN"]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "max-h-40 space-y-2 overflow-y-auto sm:max-h-52",
				children: alerts.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "font-mono text-xs text-muted",
					children: "No active flags."
				}) : alerts.slice(0, 6).map((a) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					type: "button",
					onClick: () => onRead(a.id),
					className: "block w-full border border-line/80 p-2 text-left transition-opacity duration-150 hover:opacity-80",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center justify-between gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: cn("hud-label", a.level === "critical" ? "text-crit" : a.level === "warn" ? "text-warn" : "text-cyan"),
								children: a.level
							}), !a.read ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "size-1.5 rounded-full bg-cyan" }) : null]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "text-sm text-fg",
							children: a.title
						}),
						a.body ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "font-mono text-xs text-muted",
							children: a.body
						}) : null
					]
				}, a.id))
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-3 border-t border-line pt-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "hud-label",
					children: "Ops"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
					className: "mt-1 space-y-1",
					children: ops.slice(0, 4).map((o) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
						className: "flex justify-between gap-2 font-mono text-2xs text-muted",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "truncate",
							children: o.command
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: o.status === "ok" ? "text-ok" : "text-warn",
							children: o.status
						})]
					}, o.id))
				})]
			})
		]
	});
}
var LABEL = {
	idle: "STANDBY",
	listening: "LISTENING",
	processing: "THINKING",
	speaking: "SPEAKING"
};
function Reactor({ voice, onPress, onRelease, onClick, disabled }) {
	const live = voice !== "idle";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "relative mx-auto mb-10 aspect-square w-[min(78vw,22rem)] sm:w-[22rem]",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(HudRings, { active: live }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
				type: "button",
				disabled,
				onPointerDown: (e) => {
					e.currentTarget.setPointerCapture(e.pointerId);
					onPress();
				},
				onPointerUp: onRelease,
				onPointerCancel: onRelease,
				onClick,
				className: cn("absolute top-1/2 left-1/2 grid size-32 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full sm:size-36", "border border-cyan/70 bg-void/80 core-glow anim-core", "transition-transform duration-150 ease-out active:scale-95", live && "border-cyan"),
				"aria-label": voice === "listening" ? "Release to send" : "Hold to talk",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "absolute inset-2 rounded-full border border-cyan/30" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "absolute inset-5 rounded-full border border-cyan/50" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "absolute inset-9 rounded-full bg-cyan/15" }),
					voice === "processing" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "relative size-8 text-cyan animate-spin" }) : voice === "speaking" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Volume2, { className: "relative size-8 text-cyan" }) : voice === "listening" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Mic, { className: "relative size-8 text-cyan" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MicOff, { className: "relative size-8 text-muted" })
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "pointer-events-none absolute inset-x-0 -bottom-1 translate-y-full text-center",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "hud-label text-cyan",
					children: LABEL[voice]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mt-1 font-mono text-2xs text-muted",
					children: "HOLD TO TALK  ·  TAP TO TOGGLE"
				})]
			})
		]
	});
}
var VOICE_OPTIONS = [
	{
		id: "orion",
		label: "Orion",
		note: "Cinematic, resonant"
	},
	{
		id: "eve",
		label: "Eve",
		note: "Clear, composed"
	},
	{
		id: "atlas",
		label: "Atlas",
		note: "Steady, formal"
	},
	{
		id: "leo",
		label: "Leo",
		note: "Warm, direct"
	},
	{
		id: "helix",
		label: "Helix",
		note: "Bold, dynamic"
	},
	{
		id: "luna",
		label: "Luna",
		note: "Calm, precise"
	}
];
function SettingsDrawer({ open, settings, onClose, onSave, onTest, onSignOut, saving, testMsg }) {
	const [wake, setWake] = (0, import_react.useState)("Sovi");
	const [voice, setVoice] = (0, import_react.useState)("orion");
	const [vpsUrl, setVpsUrl] = (0, import_react.useState)("");
	const [token, setToken] = (0, import_react.useState)("");
	const [chatPath, setChatPath] = (0, import_react.useState)("/v1/chat/completions");
	const [commandPath, setCommandPath] = (0, import_react.useState)("/sovi/command");
	const [vpsModel, setVpsModel] = (0, import_react.useState)("sovi");
	const [brain, setBrain] = (0, import_react.useState)("cloud");
	const [hands, setHands] = (0, import_react.useState)(false);
	const [notify, setNotify] = (0, import_react.useState)(true);
	(0, import_react.useEffect)(() => {
		if (!open || !settings) return;
		setWake(settings.wakeWord);
		setVoice(settings.voiceId);
		setVpsUrl(settings.vpsUrl);
		setToken("");
		setChatPath(settings.chatPath);
		setCommandPath(settings.commandPath);
		setVpsModel(settings.vpsModel || "sovi");
		setBrain(settings.brainMode);
		setHands(settings.alwaysListen);
		setNotify(settings.notifyPush);
	}, [open, settings]);
	if (!open) return null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "fixed inset-0 z-40 flex items-end justify-center sm:items-center",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
			type: "button",
			className: "absolute inset-0 bg-void/70",
			"aria-label": "Close settings",
			onClick: onClose
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "hud-panel relative z-10 max-h-[88dvh] w-full max-w-lg overflow-y-auto p-4 sm:p-5",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mb-3 flex items-center justify-between",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "font-display text-xl font-semibold tracking-wide text-cyan",
						children: "LINK / CONFIG"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						onClick: onClose,
						className: "grid size-11 place-items-center text-muted hover:text-fg",
						"aria-label": "Close",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "size-5" })
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
					label: "Wake word",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						className: "hud-input",
						value: wake,
						onChange: (e) => setWake(e.target.value),
						maxLength: 32
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
					label: "Voice",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "grid grid-cols-2 gap-2",
						children: VOICE_OPTIONS.map((v) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							type: "button",
							onClick: () => setVoice(v.id),
							className: cn("min-h-11 border px-2 py-1 text-left", voice === v.id ? "border-cyan bg-cyan/10 text-cyan" : "border-line text-muted"),
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "font-display text-sm font-semibold tracking-wide",
								children: v.label
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "font-mono text-2xs",
								children: v.note
							})]
						}, v.id))
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Field, {
					label: "Brain",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "grid grid-cols-3 gap-2",
						children: [
							"cloud",
							"vps",
							"hybrid"
						].map((m) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							onClick: () => setBrain(m),
							className: cn("min-h-11 border font-display text-xs font-semibold tracking-widest uppercase", brain === m ? "border-cyan bg-cyan/10 text-cyan" : "border-line text-muted"),
							children: m
						}, m))
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-2 font-mono text-2xs leading-relaxed text-muted",
						children: "Cloud uses Sovi core. VPS sends every line to your gateway. Hybrid talks here and dispatches run/execute commands to the stack."
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
					label: "Gateway URL",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						className: "hud-input",
						placeholder: "https://sovi.yourdomain.com",
						value: vpsUrl,
						onChange: (e) => setVpsUrl(e.target.value)
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
					label: `Access token${settings?.hasToken ? " (set)" : ""}`,
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						className: "hud-input",
						type: "password",
						placeholder: settings?.hasToken ? "Leave blank to keep" : "Bearer token from vps/.env",
						value: token,
						onChange: (e) => setToken(e.target.value),
						autoComplete: "off"
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
					label: "Model id",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						className: "hud-input",
						value: vpsModel,
						onChange: (e) => setVpsModel(e.target.value),
						placeholder: "sovi"
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "grid grid-cols-2 gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
						label: "Chat path",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							className: "hud-input",
							value: chatPath,
							onChange: (e) => setChatPath(e.target.value)
						})
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
						label: "Command path",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							className: "hud-input",
							value: commandPath,
							onChange: (e) => setCommandPath(e.target.value)
						})
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
					className: "mt-3 flex min-h-11 items-center gap-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						type: "checkbox",
						checked: hands,
						onChange: (e) => setHands(e.target.checked),
						className: "size-4 accent-cyan"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "font-mono text-sm text-fg",
						children: "Hands-free (wake word, Bluetooth headset)"
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
					className: "flex min-h-11 items-center gap-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						type: "checkbox",
						checked: notify,
						onChange: (e) => setNotify(e.target.checked),
						className: "size-4 accent-cyan"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "font-mono text-sm text-fg",
						children: "Browser notifications"
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-4 rounded-sm border border-line p-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "hud-label mb-1",
						children: "GitHub → VPS"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "font-mono text-2xs leading-relaxed text-muted",
						children: "Clone the Sovi repo onto the server and run the gateway in vps/. Point UPSTREAM at your OpenAI-compatible model. Paste the public HTTPS URL and SOVI_TOKEN here, then Ping link — handshake fills paths and model. Brain VPS for full stack talk, Hybrid to keep voice here and only dispatch run/execute lines."
					})]
				}),
				testMsg ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-3 font-mono text-xs text-cyan",
					children: testMsg
				}) : null,
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-4 flex flex-wrap gap-2",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							className: "hud-btn flex-1",
							disabled: saving,
							onClick: () => onSave({
								wakeWord: wake,
								voiceId: voice,
								vpsUrl,
								vpsToken: token,
								chatPath,
								commandPath,
								vpsModel,
								brainMode: brain,
								alwaysListen: hands,
								notifyPush: notify
							}),
							children: saving ? "Saving" : "Commit"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							className: "hud-btn hud-btn-ghost",
							onClick: onTest,
							children: "Ping link"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							className: "hud-btn hud-btn-ghost",
							onClick: onSignOut,
							children: "Sign out"
						})
					]
				})
			]
		})]
	});
}
function Field({ label, children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mt-3 block",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "hud-label mb-1 block",
			children: label
		}), children]
	});
}
var LINES = [
	"SOVEREIGN KERNEL  7.4.1",
	"VOICE BUS ................ OK",
	"HUD PROJECTOR ............ OK",
	"IDENTITY TOKEN ........... OK",
	"COMM CHANNEL ............. OPEN"
];
function BootOverlay({ onDone, name }) {
	const [n, setN] = (0, import_react.useState)(0);
	(0, import_react.useEffect)(() => {
		if (n < LINES.length) {
			const t = window.setTimeout(() => setN((v) => v + 1), 280);
			return () => window.clearTimeout(t);
		}
		const t = window.setTimeout(onDone, 700);
		return () => window.clearTimeout(t);
	}, [n, onDone]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "absolute inset-0 z-30 grid place-items-center bg-bg",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "hud-grid absolute inset-0 opacity-60" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "relative w-full max-w-md px-6",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "hud-label text-cyan",
					children: "Boot sequence"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "mt-2 font-display text-4xl font-semibold tracking-widest text-fg",
					children: "SOVI"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "font-mono text-sm text-muted",
					children: [
						"Welcome back, ",
						name,
						"."
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
					className: "mt-6 space-y-1 font-mono text-xs text-cyan",
					children: LINES.slice(0, n).map((line) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", {
						className: "anim-boot",
						children: line
					}, line))
				})
			]
		})]
	});
}
function HudApp({ operatorName }) {
	const store = useSovi();
	const [draft, setDraft] = (0, import_react.useState)("");
	const [saving, setSaving] = (0, import_react.useState)(false);
	const [testMsg, setTestMsg] = (0, import_react.useState)(null);
	const [signingOut, setSigningOut] = (0, import_react.useState)(false);
	const holdRef = (0, import_react.useRef)(false);
	const recRef = (0, import_react.useRef)(null);
	const busyRef = (0, import_react.useRef)(false);
	const wakeLock = (0, import_react.useRef)(null);
	const handsRef = (0, import_react.useRef)(false);
	const settingsRef = (0, import_react.useRef)(store.settings);
	const startRecRef = (0, import_react.useRef)(() => false);
	(0, import_react.useEffect)(() => {
		settingsRef.current = store.settings;
	}, [store.settings]);
	(0, import_react.useEffect)(() => {
		handsRef.current = store.handsFree;
	}, [store.handsFree]);
	(0, import_react.useEffect)(() => {
		try {
			if (sessionStorage.getItem("sovi-booted") === "1") store.setBooted(true);
		} catch {}
		const on = () => store.setOnline(true);
		const off = () => store.setOnline(false);
		window.addEventListener("online", on);
		window.addEventListener("offline", off);
		loadHud().then((data) => {
			store.setSettings(data.settings);
			store.setMessages(data.messages);
			store.setAlerts(data.alerts);
			store.setOps(data.ops);
			store.setHandsFree(data.settings.alwaysListen);
		}).catch(() => store.setError("Could not load HUD state."));
		return () => {
			window.removeEventListener("online", on);
			window.removeEventListener("offline", off);
		};
	}, []);
	const stopRec = (0, import_react.useCallback)(() => {
		try {
			recRef.current?.stop();
		} catch {}
	}, []);
	const sendText = (0, import_react.useCallback)(async (text) => {
		const clean = text.trim();
		if (!clean || busyRef.current) return;
		busyRef.current = true;
		store.setError(null);
		store.setInterim("");
		store.setVoice("processing");
		store.addMessage({
			id: Date.now(),
			role: "user",
			content: clean,
			createdAt: (/* @__PURE__ */ new Date()).toISOString()
		});
		try {
			const res = await askSovi({ data: {
				text: clean,
				operatorName
			} });
			if (!res.ok) {
				store.setError(res.error);
				store.setVoice("idle");
				return;
			}
			store.addMessage({
				id: Date.now() + 1,
				role: "sovi",
				content: res.hud ? `${res.speak}\n${res.hud}` : res.speak,
				createdAt: (/* @__PURE__ */ new Date()).toISOString()
			});
			if (res.alert) {
				store.prependAlert(res.alert);
				if (store.settings?.notifyPush) notifyBrowser(res.alert.title, res.alert.body);
			}
			store.setVoice("speaking");
			if (res.audio) try {
				await playBase64Audio(res.audio, res.audioType);
			} catch {
				await speakFallback(res.speak);
			}
			else await speakFallback(res.speak);
		} catch (err) {
			store.setError(err instanceof Error ? err.message : "Transmission failed.");
		} finally {
			busyRef.current = false;
			store.setVoice("idle");
			if (handsRef.current) startRecRef.current(true);
			loadHud().then((data) => {
				store.setOps(data.ops);
				store.setAlerts(data.alerts);
			}).catch(() => void 0);
		}
	}, [operatorName, store]);
	const startRec = (0, import_react.useCallback)((wakeOnly) => {
		const Ctor = getSpeechRecognition();
		if (!Ctor) return false;
		try {
			recRef.current?.abort();
		} catch {}
		const rec = new Ctor();
		rec.continuous = wakeOnly;
		rec.interimResults = true;
		rec.lang = "en-US";
		rec.onresult = (ev) => {
			let interim = "";
			let finalText = "";
			for (let i = ev.resultIndex; i < ev.results.length; i += 1) {
				const piece = ev.results[i];
				if (!piece) continue;
				const t = piece[0]?.transcript ?? "";
				if (piece.isFinal) finalText += t;
				else interim += t;
			}
			store.setInterim(interim || finalText);
			if (!finalText.trim()) return;
			if (wakeOnly) {
				const rest = stripWake(finalText, settingsRef.current?.wakeWord || "Sovi");
				if (rest === null) return;
				if (rest === "") {
					store.setInterim("Awaiting command…");
					return;
				}
				stopRec();
				sendText(rest);
				return;
			}
			if (!holdRef.current) {
				stopRec();
				sendText(finalText);
			}
		};
		rec.onerror = (ev) => {
			if (ev.error === "not-allowed") store.setMicReady(false);
		};
		rec.onend = () => {
			if (handsRef.current && !busyRef.current && !holdRef.current) try {
				rec.start();
			} catch {}
		};
		recRef.current = rec;
		rec.start();
		return true;
	}, [
		sendText,
		stopRec,
		store
	]);
	startRecRef.current = startRec;
	const armHandsFree = (0, import_react.useCallback)(async () => {
		const ok = await requestMic();
		store.setMicReady(ok);
		if (!ok) {
			store.setError("Microphone blocked. Allow mic access, then retry.");
			return;
		}
		wakeLock.current = await enableWakeLock();
		if (store.settings?.notifyPush) requestNotify();
		store.setHandsFree(true);
		store.setVoice("listening");
		if (!startRec(true)) {
			store.setError("This browser has no live speech engine. Use hold-to-talk or type.");
			store.setHandsFree(false);
			store.setVoice("idle");
		}
	}, [startRec, store]);
	const disarmHandsFree = (0, import_react.useCallback)(() => {
		store.setHandsFree(false);
		handsRef.current = false;
		stopRec();
		store.setVoice("idle");
		wakeLock.current?.release().catch(() => void 0);
		wakeLock.current = null;
	}, [stopRec, store]);
	const onPress = (0, import_react.useCallback)(() => {
		if (busyRef.current) return;
		holdRef.current = true;
		store.setVoice("listening");
		store.setInterim("");
		if (!startRec(false)) store.setError("Live speech unavailable. Type a command, or use Chrome.");
	}, [startRec, store]);
	const onRelease = (0, import_react.useCallback)(() => {
		if (!holdRef.current) return;
		holdRef.current = false;
		const leftover = useSovi.getState().interim.trim();
		stopRec();
		if (leftover && !busyRef.current) sendText(leftover);
		else if (!busyRef.current && !handsRef.current) store.setVoice("idle");
	}, [
		sendText,
		stopRec,
		store
	]);
	const onReactorClick = (0, import_react.useCallback)(() => {
		if (store.handsFree) disarmHandsFree();
	}, [disarmHandsFree, store.handsFree]);
	const fallbackRecord = (0, import_react.useCallback)(async () => {
		if (busyRef.current) return;
		const ok = await requestMic();
		store.setMicReady(ok);
		if (!ok) return;
		store.setVoice("listening");
		const clip = await recordClip(5e3);
		if (!clip) {
			store.setVoice("idle");
			return;
		}
		store.setVoice("processing");
		const res = await transcribeUtterance({ data: clip });
		if (!res.ok) {
			store.setError(res.error);
			store.setVoice("idle");
			return;
		}
		await sendText(res.text);
	}, [sendText, store]);
	const onSave = async (patch) => {
		setSaving(true);
		setTestMsg(null);
		try {
			const res = await saveSettings({ data: patch });
			if (!res.ok) {
				setTestMsg(res.error);
				return;
			}
			store.setSettings(res.settings);
			store.setHandsFree(res.settings.alwaysListen);
			setTestMsg("Configuration committed.");
			if (res.settings.alwaysListen) armHandsFree();
			else disarmHandsFree();
		} finally {
			setSaving(false);
		}
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "relative min-h-dvh overflow-hidden bg-bg text-fg",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "hud-grid absolute inset-0 opacity-80" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "hud-scan absolute inset-0" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "hud-vignette absolute inset-0" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ScanSweep, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CornerBrackets, {}),
			!store.booted ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(BootOverlay, {
				name: operatorName,
				onDone: () => {
					store.setBooted(true);
					try {
						sessionStorage.setItem("sovi-booted", "1");
					} catch {}
				}
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
				className: "relative z-10 flex items-start justify-between gap-3 px-4 pt-5 pb-2 sm:px-8",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "hud-label text-cyan",
					children: "Sovereign OS"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "font-display text-3xl font-semibold tracking-[0.28em] text-fg",
					children: "SOVI"
				})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(HudClock, {})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "relative z-10 mx-auto grid max-w-6xl gap-3 px-3 pb-28 sm:px-6 lg:grid-cols-[minmax(0,16rem)_1fr_minmax(0,18rem)] lg:items-start",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatusPanel, {
						voice: store.voice,
						online: store.online,
						micReady: store.micReady,
						linked: Boolean(store.settings?.vpsUrl),
						brain: store.settings?.brainMode ?? "cloud",
						name: operatorName
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex flex-col items-center",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Reactor, {
								voice: store.voice,
								onPress,
								onRelease,
								onClick: onReactorClick
							}),
							store.error ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-2 max-w-sm text-center font-mono text-xs text-warn",
								children: store.error
							}) : null,
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "mt-3 flex flex-wrap justify-center gap-2",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
										type: "button",
										className: "hud-btn hud-btn-ghost text-xs",
										onClick: () => store.handsFree ? disarmHandsFree() : void armHandsFree(),
										children: store.handsFree ? "Hands-free on" : "Hands-free"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
										type: "button",
										className: "hud-btn hud-btn-ghost text-xs",
										onClick: () => void fallbackRecord(),
										children: "Record 5s"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
										type: "button",
										className: "hud-btn hud-btn-ghost text-xs",
										onClick: () => store.setPanel(store.panel === "settings" ? "none" : "settings"),
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Settings2, { className: "size-3.5" }), "Config"]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
										type: "button",
										className: "hud-btn hud-btn-ghost text-xs",
										onClick: () => void clearTranscript().then(() => store.setMessages([])),
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LayoutGrid, { className: "size-3.5" }), "Clear"]
									})
								]
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "grid gap-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AlertsPanel, {
							alerts: store.alerts,
							ops: store.ops,
							onRead: (id) => {
								markAlertRead({ data: id });
								store.setAlerts(store.alerts.map((a) => a.id === id ? {
									...a,
									read: true
								} : a));
							}
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TranscriptPanel, {
							messages: store.messages,
							interim: store.interim,
							voice: store.voice
						})]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("form", {
				className: "fixed inset-x-0 bottom-0 z-20 border-t border-line bg-void/90 px-3 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-6",
				onSubmit: (e) => {
					e.preventDefault();
					const t = draft;
					setDraft("");
					sendText(t);
				},
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mx-auto flex max-w-6xl gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						className: "hud-input",
						placeholder: "Transmit a command…",
						value: draft,
						onChange: (e) => setDraft(e.target.value),
						maxLength: 4e3
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "submit",
						className: "hud-btn shrink-0 px-4",
						"aria-label": "Send",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Send, { className: "size-4" })
					})]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SettingsDrawer, {
				open: store.panel === "settings",
				settings: store.settings,
				saving,
				testMsg,
				onClose: () => store.setPanel("none"),
				onSave: (patch) => void onSave(patch),
				onTest: () => {
					testVpsLink().then((r) => {
						if (r.ok) {
							if (r.settings) store.setSettings(r.settings);
							setTestMsg(r.detail);
						} else setTestMsg(r.error);
					}).catch(() => setTestMsg("Ping failed."));
				},
				onSignOut: () => {
					if (signingOut) return;
					setSigningOut(true);
					signOut("/login").catch(() => setSigningOut(false));
				}
			})
		]
	});
}
function Home() {
	const { user, isPending } = useCurrentUserState();
	if (isPending) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(GateScreen, {
		kicker: "Identity scan",
		title: "LOCK",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "hud-panel p-5",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "hud-label text-cyan",
					children: "Authenticating"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "mt-1 font-display text-2xl font-semibold tracking-wide",
					children: "SOVEREIGN KERNEL"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2 font-mono text-sm leading-relaxed text-muted",
					children: "Verifying operator clearance. Voice bus, HUD projector, and comm channel coming online."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ul", {
					className: "mt-4 space-y-1 font-mono text-xs text-cyan",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "VOICE BUS ................ WAIT" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "HUD PROJECTOR ............ WAIT" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "IDENTITY TOKEN ........... SCAN" })
					]
				})
			]
		})
	});
	if (!user) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(GateScreen, {
		kicker: "Identity gate",
		title: "LOCK",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoginForm, {})
	});
	const name = user.displayName?.trim() || user.primaryEmail?.split("@")[0] || "Operator";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(HudApp, { operatorName: name });
}
//#endregion
export { Home as component };
