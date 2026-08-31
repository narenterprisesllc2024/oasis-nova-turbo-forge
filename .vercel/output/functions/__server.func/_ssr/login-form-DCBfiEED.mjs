import { o as __toESM } from "../_runtime.mjs";
import { y as require_jsx_runtime, z as require_react } from "../_libs/@tanstack/react-router+[...].mjs";
import { r as signIn, t as authClient } from "./client-B40BzJxt.mjs";
import { t as GROK_PROVIDERS } from "./server-D3cu_fSe.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/login-form-DCBfiEED.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
/**
* Current user + loading state. Same behavior in live preview and when deployed:
*   - Auth enabled -> the real signed-in user; `user` is `null` while
*                            the session resolves (`isPending: true`) and when
*                            signed out (`isPending: false`). Session comes from
*                            Better Auth `useSession()` → `/api/auth/get-session`
*                            (cookie when deployed; bearer in live preview).
*   - Auth disabled (`VITE_AUTH_ENABLED=false`) -> `DEV_USER`, never pending.
*
* Protect a route by waiting out `isPending` before acting on `user` —
* redirecting on `user: null` alone bounces signed-in visitors to sign-in on
* every hard reload:
*
*   import { RedirectToSignIn } from "@/lib/auth/gates";
*   const { user, isPending } = useCurrentUserState();
*   if (isPending) return null;              // still resolving — don't redirect yet
*   if (!user) return <RedirectToSignIn />;  // definitely signed out
*
* `authEnabled` is a module-level constant fixed at load, so the guarded hook
* call keeps a stable hook order across every render of a given component.
*/
function useCurrentUserState() {
	const { data, isPending } = authClient.useSession();
	const user = data?.user;
	return {
		user: user ? {
			id: user.id,
			displayName: user.name ?? null,
			primaryEmail: user.email ?? null,
			profileImageUrl: user.image ?? null,
			isDevFallback: false
		} : null,
		isPending
	};
}
function ticks(count, r, majorEvery, innerShort, innerLong) {
	const out = [];
	for (let i = 0; i < count; i += 1) {
		const a = i / count * Math.PI * 2 - Math.PI / 2;
		const major = i % majorEvery === 0;
		const inner = major ? innerLong : innerShort;
		out.push({
			x1: round(Math.cos(a) * inner),
			y1: round(Math.sin(a) * inner),
			x2: round(Math.cos(a) * r),
			y2: round(Math.sin(a) * r),
			major
		});
	}
	return out;
}
function round(n) {
	return Math.round(n * 100) / 100;
}
function HudRings({ active }) {
	const outer = ticks(72, 118, 6, 110, 104);
	const inner = ticks(36, 78, 4, 72, 68);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("svg", {
		viewBox: "-140 -140 280 280",
		className: "pointer-events-none absolute inset-0 h-full w-full",
		"aria-hidden": "true",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
				r: "132",
				fill: "none",
				stroke: "currentColor",
				className: "text-cyan/20",
				strokeWidth: "0.6"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
				r: "96",
				fill: "none",
				stroke: "currentColor",
				className: "text-cyan/25",
				strokeWidth: "0.7"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("g", {
				className: active ? "anim-ring origin-center" : "anim-ring origin-center opacity-70",
				children: [outer.map((t, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("line", {
					x1: t.x1,
					y1: t.y1,
					x2: t.x2,
					y2: t.y2,
					stroke: "currentColor",
					className: t.major ? "text-cyan/80" : "text-cyan/35",
					strokeWidth: t.major ? 1.4 : .7
				}, `o-${i}`)), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
					r: "118",
					fill: "none",
					stroke: "currentColor",
					className: "text-cyan/50",
					strokeWidth: "1.1",
					strokeDasharray: "8 10",
					style: { animation: "dash-move 12s linear infinite" }
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("g", {
				className: "anim-ring-rev origin-center",
				children: [inner.map((t, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("line", {
					x1: t.x1,
					y1: t.y1,
					x2: t.x2,
					y2: t.y2,
					stroke: "currentColor",
					className: "text-cyan/45",
					strokeWidth: "0.8"
				}, `i-${i}`)), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
					r: "52",
					fill: "none",
					stroke: "currentColor",
					className: "text-cyan/40",
					strokeWidth: "0.6"
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
				d: "M -18 -128 L 0 -138 L 18 -128",
				fill: "none",
				stroke: "currentColor",
				className: "text-cyan",
				strokeWidth: "1.2"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
				d: "M -18 128 L 0 138 L 18 128",
				fill: "none",
				stroke: "currentColor",
				className: "text-cyan",
				strokeWidth: "1.2"
			})
		]
	});
}
function CornerBrackets() {
	const arm = "absolute h-5 w-5 border-cyan/70";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "pointer-events-none absolute inset-3 sm:inset-5",
		"aria-hidden": "true",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: `${arm} top-0 left-0 border-t border-l` }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: `${arm} top-0 right-0 border-t border-r` }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: `${arm} bottom-0 left-0 border-b border-l` }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: `${arm} bottom-0 right-0 border-b border-r` })
		]
	});
}
function HudClock() {
	const [now, setNow] = (0, import_react.useState)(null);
	(0, import_react.useEffect)(() => {
		setNow(/* @__PURE__ */ new Date());
		const id = window.setInterval(() => setNow(/* @__PURE__ */ new Date()), 1e3);
		return () => window.clearInterval(id);
	}, []);
	const hh = now ? now.toLocaleTimeString([], {
		hour: "2-digit",
		minute: "2-digit",
		second: "2-digit",
		hour12: false
	}) : "--:--:--";
	const day = now ? now.toLocaleDateString([], {
		weekday: "short",
		month: "short",
		day: "2-digit"
	}).toUpperCase() : "SYSTEM TIME";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "text-right",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "hud-readout text-lg leading-none text-cyan sm:text-xl",
			children: hh
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "hud-label mt-1",
			children: day
		})]
	});
}
function ScanSweep() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "pointer-events-none absolute inset-0 overflow-hidden",
		"aria-hidden": "true",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "absolute inset-x-0 h-1/3 bg-linear-to-b from-transparent via-cyan/10 to-transparent",
			style: { animation: "scan-sweep 7s linear infinite" }
		})
	});
}
function WaveBars({ active }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "flex h-8 items-end justify-center gap-0.5",
		"aria-hidden": "true",
		children: [
			8,
			14,
			22,
			18,
			28,
			16,
			24,
			12,
			20,
			10,
			18,
			26,
			14,
			22,
			9
		].map((h, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "w-0.5 bg-cyan/80",
			style: {
				height: active ? `${h}px` : "4px",
				animation: active ? `listen-breathe ${.7 + i % 5 * .12}s ease-in-out ${i * 40}ms infinite` : "none",
				transformOrigin: "bottom"
			}
		}, i))
	});
}
function GateScreen({ kicker, title, children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "relative min-h-dvh overflow-hidden bg-bg text-fg",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "hud-grid absolute inset-0" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "hud-scan absolute inset-0" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "hud-vignette absolute inset-0" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ScanSweep, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CornerBrackets, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
				className: "relative z-10 flex items-start justify-between px-5 pt-6 sm:px-10",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "hud-label text-cyan",
						children: kicker
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
						className: "font-display text-4xl font-semibold tracking-[0.28em] sm:text-5xl",
						children: "SOVI"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-1 font-mono text-xs tracking-[0.2em] text-muted",
						children: "SOVEREIGN OS"
					})
				] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(HudClock, {})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "relative z-10 mx-auto mt-4 grid max-w-5xl items-center gap-6 px-5 pb-16 lg:grid-cols-[1fr_minmax(0,24rem)]",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "relative mx-auto aspect-square w-[min(70vw,20rem)]",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(HudRings, { active: true }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "absolute top-1/2 left-1/2 grid size-24 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-cyan/70 bg-void/80 core-glow anim-core",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "hud-label text-cyan",
							children: title
						})
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "relative",
					children
				})]
			})
		]
	});
}
function LoginForm() {
	const [email, setEmail] = (0, import_react.useState)("");
	const [password, setPassword] = (0, import_react.useState)("");
	const [name, setName] = (0, import_react.useState)("");
	const [mode, setMode] = (0, import_react.useState)("in");
	const [busy, setBusy] = (0, import_react.useState)(false);
	const [error, setError] = (0, import_react.useState)(null);
	async function onEmail(e) {
		e.preventDefault();
		setBusy(true);
		setError(null);
		try {
			if (mode === "up") {
				const { error: err } = await authClient.signUp.email({
					email,
					password,
					name: name.trim() || "Operator",
					callbackURL: "/"
				});
				if (err) throw new Error(err.message ?? "Sign-up failed");
			} else {
				const { error: err } = await authClient.signIn.email({
					email,
					password,
					callbackURL: "/"
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
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "hud-panel p-5 sm:p-6",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "hud-label text-cyan",
				children: "Biometric lock / fallback"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "mt-1 font-display text-2xl font-semibold tracking-wide",
				children: "IDENTITY REQUIRED"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-2 font-mono text-xs leading-relaxed text-muted",
				children: "This HUD is sealed to your account. Sign in to bring Sovi online on this device — phone, desktop, or Chromebook."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-5 grid gap-2",
				children: GROK_PROVIDERS.map((p) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					type: "button",
					className: "hud-btn hud-btn-ghost w-full",
					onClick: () => void signIn(p.providerId, { callbackURL: "/" }),
					children: ["Continue with ", p.label]
				}, p.providerId))
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "my-5 flex items-center gap-3",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "h-px flex-1 bg-line" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "hud-label",
						children: "Local credential"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "h-px flex-1 bg-line" })
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
				onSubmit: onEmail,
				className: "grid gap-3",
				children: [
					mode === "up" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						className: "hud-input",
						placeholder: "Callsign",
						value: name,
						onChange: (e) => setName(e.target.value),
						autoComplete: "name"
					}) : null,
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						className: "hud-input",
						type: "email",
						required: true,
						placeholder: "Email",
						value: email,
						onChange: (e) => setEmail(e.target.value),
						autoComplete: "email"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						className: "hud-input",
						type: "password",
						required: true,
						minLength: 8,
						placeholder: "Passphrase (8+)",
						value: password,
						onChange: (e) => setPassword(e.target.value),
						autoComplete: mode === "up" ? "new-password" : "current-password"
					}),
					error ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "font-mono text-xs text-warn",
						children: error
					}) : null,
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "submit",
						className: "hud-btn w-full",
						disabled: busy || false,
						children: busy ? "Verifying…" : mode === "up" ? "Create clearance" : "Authorize"
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				className: "mt-3 w-full font-mono text-xs text-muted underline-offset-4 hover:text-cyan hover:underline",
				onClick: () => setMode((m) => m === "in" ? "up" : "in"),
				children: mode === "in" ? "No clearance? Create an identity." : "Already cleared? Authorize."
			})
		]
	});
}
//#endregion
export { LoginForm as a, useCurrentUserState as c, HudRings as i, GateScreen as n, ScanSweep as o, HudClock as r, WaveBars as s, CornerBrackets as t };
