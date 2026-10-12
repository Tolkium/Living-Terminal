// Volume / bass / mid / treble bars driven by Wallpaper Engine's audio listener.

const getSmoothness = () => userSettings.volume.smoothness;

const getSensitivity = () => userSettings.volume.sensitivity;

const AUDIO_SLIDER_NAMES = ["volume", "bass", "mid", "treble"];

const sliderParts = new Map();

const DEFAULT_SLIDER_BARS = {
	green: 15,
	yellow: 10,
	red: 5,
};

const smoothed = {
	volume: 0,
	bass: 0,
	mid: 0,
	treble: 0,
};

let sliders = null;

const audioAnalyzer = new AudioSliderAnalyzer();

function getAudioSliderElements() {
	const entries = AUDIO_SLIDER_NAMES.map((name) => [name, document.querySelector(`.slider.${name}`)]);
	if (entries.some(([, element]) => !element)) return null;
	return Object.fromEntries(entries);
}

function waitForSliders() {
	sliders = getAudioSliderElements();
	if (!sliders) requestAnimationFrame(waitForSliders);
}

waitForSliders();

function clampPercent(percent) {
	return Math.max(0, Math.min(percent, 100));
}

// Elements and bar capacities are cached per slider; the audio listener runs many times per second,
// so it must not query the DOM, read layout or write unchanged text.
function getSliderParts(slider) {
	let parts = sliderParts.get(slider);
	if (!parts) {
		parts = {
			value: slider.querySelector(".value"),
			green: slider.querySelector(".ansi-green"),
			yellow: slider.querySelector(".ansi-yellow"),
			red: slider.querySelector(".ansi-red"),
			percent: slider.querySelector(".ansi-bright-black"),
			caps: null,
			lastKey: "",
		};
		sliderParts.set(slider, parts);
	}
	if (!parts.caps) parts.caps = getSliderBarCaps(parts.value);
	return parts;
}

function invalidateSliderMeasurements() {
	sliderParts.forEach((parts) => {
		parts.caps = null;
		parts.lastKey = "";
	});
}

function updateSliderVisual(slider, percent) {
	if (!slider) return;
	const parts = getSliderParts(slider);
	if (!parts.green || !parts.yellow || !parts.red || !parts.percent) return;

	percent = clampPercent(percent);

	const { green: maxGreen, yellow: maxYellow, red: maxRed, total } = parts.caps;
	const activeBars = Math.round((percent / 100) * total);
	const greenBars = Math.min(activeBars, maxGreen);
	const yellowBars = Math.min(Math.max(activeBars - maxGreen, 0), maxYellow);
	const redBars = Math.min(Math.max(activeBars - maxGreen - maxYellow, 0), maxRed);

	const key = `${greenBars}|${yellowBars}|${redBars}|${percent}`;
	if (key === parts.lastKey) return;
	parts.lastKey = key;

	parts.green.textContent = "|".repeat(greenBars).padEnd(maxGreen, " ");
	parts.yellow.textContent = "|".repeat(yellowBars).padEnd(maxYellow, " ");
	parts.red.textContent = "|".repeat(redBars).padEnd(maxRed, " ");
	parts.percent.textContent = `${percent}%`;
}

function getSliderBarCaps(valueElement) {
	if (!valueElement) {
		return {
			...DEFAULT_SLIDER_BARS,
			total: DEFAULT_SLIDER_BARS.green + DEFAULT_SLIDER_BARS.yellow + DEFAULT_SLIDER_BARS.red,
		};
	}

	const charWidth = measureCharWidth(valueElement);
	const totalChars = Math.max(12, Math.floor(valueElement.clientWidth / Math.max(1, charWidth)) - 7);

	let green = Math.max(1, Math.round(totalChars * 0.5));
	let yellow = Math.max(1, Math.round(totalChars * (1 / 3)));
	let red = Math.max(1, totalChars - green - yellow);

	const sum = green + yellow + red;
	if (sum < totalChars) red += totalChars - sum;
	else if (sum > totalChars) red = Math.max(1, red - (sum - totalChars));

	return { green, yellow, red, total: green + yellow + red };
}

function smoothBandLevel(current, target, attack, release) {
	const factor = target > current ? attack : release;
	return current * (1 - factor) + target * factor;
}

function getAudioSmoothingFactors() {
	const smoothing = getSmoothness();
	return {
		volume: smoothing,
		extraAttack: Math.min(1, smoothing * 1.9),
		extraRelease: Math.max(0.06, smoothing * 0.55),
	};
}

function applySmoothedAudioLevels(levels) {
	const { volume, extraAttack, extraRelease } = getAudioSmoothingFactors();
	smoothed.bass = smoothBandLevel(smoothed.bass, levels.bass, extraAttack, extraRelease);
	smoothed.mid = smoothBandLevel(smoothed.mid, levels.mid, extraAttack, extraRelease);
	smoothed.treble = smoothBandLevel(smoothed.treble, levels.treble, extraAttack, extraRelease);
	smoothed.volume = smoothed.volume * (1 - volume) + levels.volume * volume;
}

function renderAudioSliders() {
	if (!sliders) return;
	if (userSettings.volume.showExtras) {
		updateSliderVisual(sliders.bass, Math.floor(smoothed.bass));
		updateSliderVisual(sliders.mid, Math.floor(smoothed.mid));
		updateSliderVisual(sliders.treble, Math.floor(smoothed.treble));
	}
	updateSliderVisual(sliders.volume, Math.floor(smoothed.volume * 100));
}

// audio listener
function wallpaperAudioListener(audioArray) {
	if (!sliders) return;
	const levels = audioAnalyzer.analyze(audioArray, getSensitivity());
	applySmoothedAudioLevels(levels);
	renderAudioSliders();
}

if (window.wallpaperRegisterAudioListener) window.wallpaperRegisterAudioListener(wallpaperAudioListener);
