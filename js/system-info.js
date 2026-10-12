// System information block: manual values, auto-detection (OS, GPU, local/public IP), custom rows.

const systemInfo = ["hostname", "ip", "os", "kernel", "shell", "cpu", "gpu", "ram", "disk"];

const customSystemInfoValues = 11;

let autoDetectedIp = "";

let autoDetectedPublicIp = "";

let autoIpDetectPromise = null;

let autoDetectedSystemInfo = {};

let autoSystemDetectPromise = null;

function updateSystem() {
	Object.keys(userSettings.systemInfo).forEach((entry) => {
		const el = document.querySelector(`.${entry}`);
		if (!el) return;
		const manualValue = userSettings.systemInfo[entry];
		const hasManualValue = manualValue !== undefined && manualValue !== null && String(manualValue).trim().length > 0;

		// Manual values from UI always win over autodetection.
		if (hasManualValue) {
			el.textContent = manualValue;
			return;
		}

		if (entry === "ip" && autoDetectedIp) {
			el.textContent = autoDetectedIp;
			return;
		}

		if (autoDetectedSystemInfo[entry]) {
			el.textContent = autoDetectedSystemInfo[entry];
			return;
		}

		el.textContent = "";
	});
	const publicIpEl = document.querySelector(".publicip");
	if (publicIpEl) {
		publicIpEl.textContent = autoDetectedPublicIp || "-";
	}

	for (let i = 1; i <= customSystemInfoValues; i++) {
		if (
			(!userSettings.customSystemInfo[`prop-${i}`] && !userSettings.customSystemInfo[`value-${i}`]) ||
			userSettings.customSystemInfo.enabled === false ||
			i > userSettings.customSystemInfo.rows
		) {
			document.querySelector(`.custom-prop-${i}`).innerHTML = "&nbsp;";
			document.querySelector(`.custom-value-${i}`).innerHTML = "&nbsp;";
		} else {
			document.querySelector(`.custom-prop-${i}`).textContent = userSettings.customSystemInfo[`prop-${i}`];
			document.querySelector(`.custom-value-${i}`).textContent = userSettings.customSystemInfo[`value-${i}`];
		}
	}

	document.querySelector(".resolution").textContent = `${document.body.scrollWidth}x${document.body.scrollHeight}`;
}

function isIpv4(text) {
	return /^\d{1,3}(?:\.\d{1,3}){3}$/.test(String(text || "").trim());
}

function isIpv6(text) {
	return /^[0-9a-f:]+$/i.test(String(text || "").trim()) && String(text || "").includes(":");
}

function isIpAddress(text) {
	return isIpv4(text) || isIpv6(text);
}

function detectIpViaWebRTC() {
	return new Promise((resolve) => {
		const RTCPeer = window.RTCPeerConnection || window.webkitRTCPeerConnection || window.mozRTCPeerConnection;
		if (!RTCPeer) {
			resolve("");
			return;
		}

		let done = false;
		const finish = (value) => {
			if (done) return;
			done = true;
			resolve(value || "");
		};

		try {
			const pc = new RTCPeer({ iceServers: [] });
			pc.createDataChannel("ip");
			pc.onicecandidate = (event) => {
				const cand = event?.candidate?.candidate || "";
				const match = cand.match(/(\d{1,3}(?:\.\d{1,3}){3})/);
				if (!match) return;
				const ip = match[1];
				if (ip === "127.0.0.1" || ip === "0.0.0.0") return;
				pc.close();
				finish(ip);
			};
			pc.createOffer()
				.then((offer) => pc.setLocalDescription(offer))
				.catch(() => finish(""));
			setTimeout(() => {
				try {
					pc.close();
				} catch (e) {
					// ignore close errors
				}
				finish("");
			}, 1800);
		} catch (e) {
			finish("");
		}
	});
}

function detectOsFromUserAgent() {
	const ua = navigator.userAgent || "";
	if (/Windows/i.test(ua)) return "Windows";
	if (/Android/i.test(ua)) return "Android";
	if (/iPhone|iPad|iPod/i.test(ua)) return "iOS";
	if (/Mac OS X|Macintosh/i.test(ua)) return "macOS";
	if (/Linux/i.test(ua)) return "Linux";
	return "Unknown OS";
}

function detectGpuRenderer() {
	try {
		const canvas = document.createElement("canvas");
		const gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
		if (!gl) return "";
		const ext = gl.getExtension("WEBGL_debug_renderer_info");
		const value = ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER);
		let renderer = String(value || "").trim();
		const angleMatch = renderer.match(/^ANGLE\((.*)\)$/i);
		if (angleMatch) renderer = angleMatch[1];
		const parts = renderer.split(",").map((s) => s.trim()).filter(Boolean);
		if (parts.length >= 2) {
			const candidate = parts[1]
				.replace(/\(0x[0-9a-f]+\)/gi, "")
				.replace(/\s+Direct3D.*$/i, "")
				.replace(/\s+OpenGL.*$/i, "")
				.replace(/\s+Vulkan.*$/i, "")
				.replace(/\s+Metal.*$/i, "")
				.replace(/\s*\([^)]*\)\s*$/i, "")
				.trim();
			if (candidate) return candidate;
		}
		return renderer
			.replace(/\(0x[0-9a-f]+\)/gi, "")
			.replace(/\s+Direct3D.*$/i, "")
			.replace(/\s+OpenGL.*$/i, "")
			.replace(/\s+Vulkan.*$/i, "")
			.replace(/\s+Metal.*$/i, "")
			.replace(/\s*\([^)]*\)\s*$/i, "")
			.trim();
	} catch (e) {
		return "";
	}
}

async function detectAutoSystemInfo() {
	const detected = {};

	if (location.hostname && location.hostname !== "localhost") {
		detected.hostname = location.hostname;
	}

	const uaDataPlatform = navigator.userAgentData?.platform;
	detected.os = uaDataPlatform ? String(uaDataPlatform) : detectOsFromUserAgent();

	const gpu = detectGpuRenderer();
	if (gpu) detected.gpu = gpu;

	return detected;
}

function ensureAutoSystemInfoDetection() {
	if (autoSystemDetectPromise) return;
	autoSystemDetectPromise = detectAutoSystemInfo()
		.then((detected) => {
			autoDetectedSystemInfo = detected || {};
			updateSystem();
		})
		.catch(() => {
			// keep configured values if detection fails
		})
		.finally(() => {
			autoSystemDetectPromise = null;
		});
}

async function detectPublicIp() {
	const endpoints = [
		"https://api.ipify.org?format=json",
		"https://api64.ipify.org?format=json",
		"https://api.myip.com",
	];

	for (const url of endpoints) {
		let timer = null;
		try {
			const controller = new AbortController();
			timer = setTimeout(() => controller.abort(), 1800);
			const res = await fetch(url, { cache: "no-store", signal: controller.signal });
			if (!res.ok) continue;
			const json = await res.json();
			const ip = String(json?.ip || "").trim();
			if (isIpAddress(ip)) return ip;
		} catch (e) {
			// try next endpoint
		} finally {
			if (timer) clearTimeout(timer);
		}
	}
	return "";
}

function ensureAutoIpDetection() {
	if ((autoDetectedIp || autoDetectedPublicIp) || autoIpDetectPromise) return;
	autoIpDetectPromise = Promise.all([
		detectIpViaWebRTC().then((ip) => {
			if (ip) return ip;
			if (isIpv4(location.hostname) && location.hostname !== "127.0.0.1") return location.hostname;
			return "";
		}),
		detectPublicIp(),
	])
		.then(([localIp, publicIp]) => {
			if (localIp) autoDetectedIp = localIp;
			if (publicIp) autoDetectedPublicIp = publicIp;
		})
		.then(() => {
			const ipEl = document.querySelector(".ip");
			if (ipEl && autoDetectedIp) ipEl.textContent = autoDetectedIp;
			const publicIpEl = document.querySelector(".publicip");
			if (publicIpEl) publicIpEl.textContent = autoDetectedPublicIp || "-";
		})
		.finally(() => {
			autoIpDetectPromise = null;
		});
}
