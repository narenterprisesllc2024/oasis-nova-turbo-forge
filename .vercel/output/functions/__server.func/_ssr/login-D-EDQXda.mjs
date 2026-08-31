import { _ as Navigate, y as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
import { a as LoginForm, c as useCurrentUserState, n as GateScreen } from "./login-form-DCBfiEED.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/login-D-EDQXda.js
var import_jsx_runtime = require_jsx_runtime();
function Login() {
	const { user, isPending } = useCurrentUserState();
	if (!isPending && user) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Navigate, { to: "/" });
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(GateScreen, {
		kicker: "Identity gate",
		title: "LOCK",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoginForm, {})
	});
}
//#endregion
export { Login as component };
