// Small shared helpers: math, HTML escaping, cached DOM lookups, character-width measurement.

function clamp(v, a, b) {
	return Math.max(a, Math.min(b, v));
}

function escapeHtml(text) {
	return String(text)
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;");
}

function formatTime(totalSeconds) {
	if (isNaN(totalSeconds) || totalSeconds < 0) {
		return "00:00";
	}

	const days = Math.floor(totalSeconds / 86400);
	const hours = Math.floor((totalSeconds % 86400) / 3600);
	const minutes = Math.floor((totalSeconds % 3600) / 60);
	const seconds = totalSeconds % 60;

	const padDouble = (num) => String(num).padStart(2, "0");

	let timeStr = "";

	if (days > 0) {
		timeStr += `${days}:`;
	}
	if (days > 0 || hours > 0) {
		timeStr += `${padDouble(hours)}:`;
	}
	timeStr += `${padDouble(minutes)}:${padDouble(seconds)}`;

	return timeStr;
}

// The page structure is static, so lookups for the per-second updates are done once.
const elementCache = new Map();

function getCachedElement(selector) {
	let element = elementCache.get(selector);
	if (!element) {
		element = document.querySelector(selector);
		if (element) elementCache.set(selector, element);
	}
	return element;
}

// Wallpaper Engine colors are "r g b" floats in 0..1.
function wpColorToCss(value) {
	const [r = 0, g = 0, b = 0] = String(value).split(" ").map((v) => Math.round(Number(v) * 255));
	return `rgb(${r},${g},${b})`;
}

// Width of one character in `el`'s font, measured with `sample` and cached per font.
// invalidateMeasurements() clears the cache (resize, font size change, web font loaded).
const charWidthCache = new Map();

function measureCharWidth(el, sample = "M".repeat(10)) {
	const style = getComputedStyle(el);
	const key = [style.fontFamily, style.fontSize, style.letterSpacing, sample].join("|");
	let width = charWidthCache.get(key);
	if (width) return width;

	const probe = document.createElement("span");
	probe.style.cssText = "position:absolute;visibility:hidden;pointer-events:none;white-space:pre;font-variant-ligatures:none";
	probe.style.fontFamily = style.fontFamily;
	probe.style.fontSize = style.fontSize;
	probe.style.letterSpacing = style.letterSpacing;
	probe.textContent = sample;
	document.body.appendChild(probe);
	width = probe.getBoundingClientRect().width / sample.length || 10;
	probe.remove();
	charWidthCache.set(key, width);
	return width;
}

function invalidateMeasurements() {
	charWidthCache.clear();
}

function debounce(fn, delay = 100) {
	let timer;
	return function (...args) {
		clearTimeout(timer);
		timer = setTimeout(() => fn.apply(this, args), delay);
	};
}
