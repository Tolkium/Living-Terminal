// ASCII art panel: sizing the frame to the free space, and converting album art / logo images to ASCII.

let currentAsciiViewportDimensions = null;

let cachedAsciiLifeDimensions = null;

const ASCII_MIN_WIDTH = 20;

const ASCII_MIN_HEIGHT = 10;

const ASCII_LIFE_LINE_HEIGHT_SCALE = 0.998;

function getAsciiPreElement() {
	return document.querySelector(".image pre.ascii");
}

function getAsciiImageContainer() {
	return document.querySelector(".overview-terminal .information .image");
}

function getAsciiInformationElement() {
	return document.querySelector(".overview-terminal .information");
}

function getAsciiOverviewElement() {
	return document.querySelector(".overview-terminal");
}

function getDefaultAsciiDimensions() {
	return {
		width: Math.max(ASCII_MIN_WIDTH, Math.floor(userSettings.ascii.resolution)),
		height: Math.max(ASCII_MIN_HEIGHT, Math.floor(userSettings.ascii.resolution * 0.5)),
	};
}

function setAsciiFontScale() {
	const scale = Math.min(48 / userSettings.ascii.resolution, 1);
	document.documentElement.style.setProperty("--ascii-font-size", `calc(var(--p) * ${scale})`);
}

function setAsciiRenderDimensions(dimensions) {
	currentAsciiViewportDimensions = dimensions;
}

function getAsciiRenderDimensions() {
	return currentAsciiViewportDimensions || getAsciiLifeDimensions();
}

// Album art (when enabled and available), else the user's logo, else "" (the panel then shows Game of Life).
function getAsciiImageSource(source = null) {
	if (source) return source;
	if (userSettings.ascii.useMediaArt && currentMediaThumbnail) return currentMediaThumbnail;
	return userSettings.ascii.defaultImage || "";
}

// Image art has no frame, so it also uses the space of the Game of Life borders and caption.
function getAsciiImageRenderDimensions() {
	const lifeDimensions = getAsciiLifeDimensions();
	return {
		width: lifeDimensions.width + 2,
		height: lifeDimensions.height + 3,
		framed: false,
	};
}

function updateAsciiImage(source = null) {
	if (!isMediaPlaying) {
		startGameOfLifeIfNeeded();
		return;
	}

	const imageSrc = getAsciiImageSource(source);
	if (!imageSrc) {
		startGameOfLife();
		return;
	}

	const image = new Image();
	image.crossOrigin = "Anonymous";
	image.src = imageSrc;

	image.onload = () => {
		stopGameOfLife();
		setAsciiFontScale();
		invalidateAsciiViewportLock();
		setAsciiLifeAspectMode(false);
		setAsciiRenderDimensions(getAsciiImageRenderDimensions());
		applyAsciiViewportLock();

		const asciiHTML = imageToAscii(image, {
			resolution: getAsciiRenderDimensions().width,
			resolutionHeight: getAsciiRenderDimensions().height,
			useColor: userSettings.ascii.colored,
			saturation: userSettings.ascii.saturation,
			colorMode: userSettings.ascii.colorMode,
		});

		document.querySelector(".image pre.ascii").innerHTML = asciiHTML;
	};

	image.onerror = () => {
		setAsciiLifeAspectMode(false);
		applyAsciiViewportLock();
		if (userSettings.ascii.defaultImage && imageSrc !== userSettings.ascii.defaultImage) {
			updateAsciiImageDebounce(userSettings.ascii.defaultImage);
		} else {
			startGameOfLife();
		}
	};
}

function getAsciiLifeDimensions() {
	if (cachedAsciiLifeDimensions) return cachedAsciiLifeDimensions;
	// Already leaves room for the frame (2 border columns; top/bottom border + caption lines).
	cachedAsciiLifeDimensions = getResponsiveAsciiDimensions(1);
	return cachedAsciiLifeDimensions;
}

function invalidateAsciiViewportLock() {
	cachedAsciiLifeDimensions = null;
	currentAsciiViewportDimensions = null;
	life.layoutStable = false;
}

function setAsciiLifeAspectMode(enabled) {
	const pre = getAsciiPreElement();
	if (!pre) return;
	if (!enabled) {
		pre.style.lineHeight = "";
		return;
	}

	pre.style.lineHeight = "";
	const computed = getComputedStyle(pre);
	const fontPx = Number.parseFloat(computed.fontSize) || 16;
	let lineHeightPx = Number.parseFloat(computed.lineHeight);
	if (!Number.isFinite(lineHeightPx)) lineHeightPx = fontPx * 1.2;
	pre.style.lineHeight = `${(lineHeightPx / fontPx) * ASCII_LIFE_LINE_HEIGHT_SCALE}`;
}

function getAsciiViewportMetrics() {
	const pre = getAsciiPreElement();
	const image = getAsciiImageContainer();
	const information = getAsciiInformationElement();
	const overview = getAsciiOverviewElement();
	if (!pre || !image) return null;

	const computed = getComputedStyle(pre);
	const fontPx = Number.parseFloat(computed.fontSize) || 16;
	let lineHeightPx = Number.parseFloat(computed.lineHeight);
	if (!Number.isFinite(lineHeightPx)) lineHeightPx = fontPx * 1.2;
	const charWidthPx = measureCharWidth(pre, "0".repeat(10));
	if (!Number.isFinite(charWidthPx) || charWidthPx <= 0 || !Number.isFinite(lineHeightPx) || lineHeightPx <= 0) return null;

	const widthPx = image.clientWidth || image.getBoundingClientRect().width;
	let heightPx = information ? getAvailableAsciiHeightPx(information, overview) : 0;
	if (!heightPx) heightPx = overview?.clientHeight || image.clientHeight || window.innerHeight * 0.4;

	return { charWidthPx, lineHeightPx, widthPx, heightPx };
}

// Height the art may use: the information row's current height plus the free space left in the terminal.
// Measuring free space (instead of the overview's bottom edge) keeps the result independent of the art's own
// current size, so it settles immediately instead of creeping or flipping by one row each frame.
function getAvailableAsciiHeightPx(information, overview) {
	const terminal = document.querySelector(".terminal");
	if (!terminal) return 0;
	const outerHeight = (el) => {
		const style = getComputedStyle(el);
		return el.offsetHeight + (parseFloat(style.marginTop) || 0) + (parseFloat(style.marginBottom) || 0);
	};
	const panels = terminal.classList.contains("horizontal") && overview ? [overview] : [...terminal.children];
	const used = panels.reduce((sum, el) => sum + outerHeight(el), 0);
	return Math.max(0, information.getBoundingClientRect().height + terminal.clientHeight - used);
}

function getResponsiveAsciiDimensions(targetAspect = 1) {
	const metrics = getAsciiViewportMetrics();
	if (!metrics) return getDefaultAsciiDimensions();

	const innerWidthPx = Math.max(0, metrics.widthPx - metrics.charWidthPx * 2);
	const innerHeightPx = Math.max(0, metrics.heightPx - metrics.lineHeightPx * 3);
	const maxCols = Math.max(ASCII_MIN_WIDTH, Math.floor(innerWidthPx / metrics.charWidthPx));
	const maxRows = Math.max(ASCII_MIN_HEIGHT, Math.floor(innerHeightPx / metrics.lineHeightPx));
	const colsPerRow = Math.max(0.1, targetAspect * (metrics.lineHeightPx / metrics.charWidthPx));

	let height = maxRows;
	let width = Math.floor(height * colsPerRow);
	if (width > maxCols) {
		width = maxCols;
		height = Math.floor(width / colsPerRow);
	}

	return {
		width: Math.max(ASCII_MIN_WIDTH, width),
		height: Math.max(ASCII_MIN_HEIGHT, height),
	};
}

function getAsciiFrameMetrics(dimensions) {
	if (dimensions.framed === false) return { framedWidth: dimensions.width, framedHeight: dimensions.height };
	return {
		framedWidth: dimensions.width + 2,
		framedHeight: dimensions.height + 3,
	};
}

function getAsciiLineHeightPx(pre) {
	const computed = getComputedStyle(pre);
	let lineHeightPx = Number.parseFloat(computed.lineHeight);
	if (!Number.isFinite(lineHeightPx)) {
		const fontPx = Number.parseFloat(computed.fontSize) || 16;
		lineHeightPx = fontPx * 1.2;
	}
	return lineHeightPx;
}

function applyAsciiViewportLock() {
	const pre = getAsciiPreElement();
	const image = getAsciiImageContainer();
	if (!pre) return;

	const dimensions = getAsciiRenderDimensions();
	const { framedWidth, framedHeight } = getAsciiFrameMetrics(dimensions);

	pre.style.display = "inline-block";
	pre.style.width = `${framedWidth}ch`;
	const lineHeightPx = getAsciiLineHeightPx(pre);
	pre.style.height = `${Math.ceil(framedHeight * lineHeightPx)}px`;
	if (image) {
		image.style.width = "";
		image.style.minWidth = "0";
	}
}

function refreshAsciiViewport() {
	invalidateAsciiViewportLock();
	applyAsciiViewportLock();
	if (gameOfLifeInterval) renderGameOfLifeFrame();
	else updateAsciiImageDebounce();
}

const asciiChars = [" ", ".", ":", "-", "=", "+", "*", "#", "%", "@"];

let cachedAsciiPalette = []; // [{ r, g, b, cssVar }]

let asciiCanvas = null;

function buildAsciiPalette() {
	const style = getComputedStyle(document.documentElement);
	return [
		style.getPropertyValue("--color-black").trim(),
		style.getPropertyValue("--color-red").trim(),
		style.getPropertyValue("--color-green").trim(),
		style.getPropertyValue("--color-yellow").trim(),
		style.getPropertyValue("--color-blue").trim(),
		style.getPropertyValue("--color-magenta").trim(),
		style.getPropertyValue("--color-cyan").trim(),
		style.getPropertyValue("--color-white").trim(),
		style.getPropertyValue("--color-bright-black").trim(),
		style.getPropertyValue("--color-bright-red").trim(),
		style.getPropertyValue("--color-bright-green").trim(),
		style.getPropertyValue("--color-bright-yellow").trim(),
		style.getPropertyValue("--color-bright-blue").trim(),
		style.getPropertyValue("--color-bright-magenta").trim(),
		style.getPropertyValue("--color-bright-cyan").trim(),
		style.getPropertyValue("--color-bright-white").trim(),
	];
}

function parseCssColor(text) {
	const value = String(text || "").trim();
	if (value.startsWith("rgb")) {
		const [r = 0, g = 0, b = 0] = (value.match(/\d+/g) || []).map(Number);
		return { r, g, b };
	}
	const hex = parseInt(value.replace("#", ""), 16) || 0;
	return { r: (hex >> 16) & 255, g: (hex >> 8) & 255, b: hex & 255 };
}

function refreshAsciiPalette() {
	cachedAsciiPalette = buildAsciiPalette().map((color, i) => ({
		...parseCssColor(color),
		cssVar: `var(--color-${getTerminalColorName(i)})`,
	}));
}

function getBrightness(r, g, b) {
	return 0.299 * r + 0.587 * g + 0.114 * b; // luminance formula
}

function closestColor(r, g, b) {
	let minDist = Infinity;
	let chosen = "";
	for (const color of cachedAsciiPalette) {
		const dist = (color.r - r) ** 2 + (color.g - g) ** 2 + (color.b - b) ** 2;
		if (dist < minDist) {
			minDist = dist;
			chosen = color.cssVar;
		}
	}
	return chosen;
}

function getTerminalColorName(index) {
	const names = [
		"black",
		"red",
		"green",
		"yellow",
		"blue",
		"magenta",
		"cyan",
		"white",
		"bright-black",
		"bright-red",
		"bright-green",
		"bright-yellow",
		"bright-blue",
		"bright-magenta",
		"bright-cyan",
		"bright-white",
	];
	return names[index];
}

function imageToAscii(img, settings = {}) {
	const { resolution = 50, resolutionHeight = null, useColor = false, saturation = 1, colorMode = "theme" } = settings;

	const outputHeight = Math.max(1, Math.floor(resolutionHeight || resolution / 2));
	if (!asciiCanvas) asciiCanvas = document.createElement("canvas");
	const ctx = asciiCanvas.getContext("2d", { willReadFrequently: true });

	asciiCanvas.width = resolution;
	asciiCanvas.height = outputHeight;

	ctx.drawImage(img, 0, 0, resolution, outputHeight);
	const data = ctx.getImageData(0, 0, resolution, outputHeight).data;

	let output = "";
	for (let y = 0; y < outputHeight; y++) {
		// Consecutive characters with the same color share one <span>.
		let runColor = "";
		let run = "";
		for (let x = 0; x < resolution; x++) {
			const i = (y * resolution + x) * 4;
			let r = data[i];
			let g = data[i + 1];
			let b = data[i + 2];

			const gray = 0.299 * r + 0.587 * g + 0.114 * b;
			r = Math.min(255, Math.max(0, gray + (r - gray) * saturation));
			g = Math.min(255, Math.max(0, gray + (g - gray) * saturation));
			b = Math.min(255, Math.max(0, gray + (b - gray) * saturation));

			const brightness = getBrightness(r, g, b);
			const char = asciiChars[Math.floor((brightness / 255) * (asciiChars.length - 1))];

			if (!useColor) {
				output += char;
				continue;
			}
			const color = colorMode === "image" ? `rgb(${r | 0}, ${g | 0}, ${b | 0})` : closestColor(r, g, b);
			if (color !== runColor) {
				if (run) output += `<span style="color: ${runColor}">${run}</span>`;
				runColor = color;
				run = "";
			}
			run += char;
		}
		if (run) output += `<span style="color: ${runColor}">${run}</span>`;
		output += "\n";
	}

	return output;
}

const updateAsciiImageDebounce = debounce(updateAsciiImage, 150);
