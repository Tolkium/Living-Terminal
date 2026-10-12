// Now-playing info, playback state, timeline and seekbar from Wallpaper Engine's media integration.

let currentMediaThumbnail = "";

let isMediaPlaying = false;

let seekbarProgressChar = "=";

const MEDIA_TIMELINE_TICK_MS = 1000;

function getMediaStatusElement() {
	return document.querySelector(".playing-song .status");
}

function getMediaSummaryElement() {
	return document.querySelector(".playing-song .text");
}

function getMediaTimeElement() {
	return document.querySelector(".playing-song .time");
}

function getMediaCurrentTimeElement() {
	return document.querySelector(".currentTime");
}

function setMediaPlaybackStatus(label) {
	const element = getMediaStatusElement();
	if (element) element.textContent = label;
}

function setMediaTimelineText(position, duration) {
	const currentTimeElement = getMediaCurrentTimeElement();
	const mediaTimeElement = getMediaTimeElement();
	if (currentTimeElement) currentTimeElement.textContent = formatTime(position);
	if (mediaTimeElement) mediaTimeElement.textContent = `[${formatTime(position)}/${formatTime(duration)}]`;
}

function syncMediaTimelineState(position, duration, hasValue) {
	lastMediaTimeline.position = position;
	lastMediaTimeline.duration = duration;
	lastMediaTimeline.hasValue = hasValue;
	lastMediaTimeline.syncedAt = hasValue ? Date.now() : 0;
}

function wallpaperMediaPropertiesListener(event) {
	const title = event.title;
	const artist = event.artist;
	const album = event.albumTitle;

	document.querySelector(".currentTitle").textContent = title;
	document.querySelector(".currentArtist").textContent = artist;
	document.querySelector(".currentAlbum").textContent = album;

	const summaryElement = getMediaSummaryElement();
	if (summaryElement) summaryElement.textContent = artist || title ? `${artist} - ${title}` : "";
}

if (window.wallpaperRegisterMediaPropertiesListener) window.wallpaperRegisterMediaPropertiesListener(wallpaperMediaPropertiesListener);

let mediaTimelineTicker = null;

let lastMediaTimeline = {
	position: 0,
	duration: 0,
	hasValue: false,
	syncedAt: 0,
};

const SEEKBAR_MIN_LEN = 24;

const SEEKBAR_MAX_LEN = 220;

function getSeekbarLength() {
	const el = document.querySelector(".seekbar");
	if (!el) return 100;
	const charWidth = measureCharWidth(el, `${seekbarProgressChar}>-`.repeat(16));
	// Add a small compensation so subpixel rounding does not make the bar appear 1 char short.
	const available = Math.max(0, Math.floor(el.clientWidth / Math.max(1, charWidth) + 0.55));
	return Math.max(SEEKBAR_MIN_LEN, Math.min(SEEKBAR_MAX_LEN, available));
}

function buildSeekbar(position, duration, barLen) {
	const safeLen = Math.max(2, Number(barLen) || 100);
	if (!Number.isFinite(duration) || duration <= 0) {
		return `<span class="head">&gt;</span><span class="track">${"-".repeat(safeLen - 1)}</span>`;
	}

	const ratio = Math.max(0, Math.min(1, position / duration));
	const idx = Math.round(ratio * (safeLen - 1));

	const progressChar = escapeHtml(seekbarProgressChar);
	const left = progressChar.repeat(idx);
	const right = "-".repeat(safeLen - 1 - idx);

	return `<span class="progress">${left}</span><span class="head">&gt;</span><span class="track">${right}</span>`;
}

function renderSeekbar(position, duration) {
	const seekbarEl = document.querySelector(".seekbar");
	if (!seekbarEl) return;
	seekbarEl.innerHTML = buildSeekbar(position, duration, getSeekbarLength());
}

function resetMediaTimelineDisplay() {
	syncMediaTimelineState(0, 0, false);
	setMediaTimelineText(0, 0);
	renderSeekbar(0, 0);
}

function getCurrentTimelinePosition() {
	if (!lastMediaTimeline.hasValue) return 0;
	if (!isMediaPlaying || !Number.isFinite(lastMediaTimeline.duration) || lastMediaTimeline.duration <= 0) {
		return Math.max(0, Math.floor(lastMediaTimeline.position));
	}
	const elapsedSeconds = Math.max(0, (Date.now() - lastMediaTimeline.syncedAt) / 1000);
	return Math.min(lastMediaTimeline.duration, Math.max(0, Math.floor(lastMediaTimeline.position + elapsedSeconds)));
}

function renderCurrentMediaTimeline() {
	if (!lastMediaTimeline.hasValue) {
		renderSeekbar(0, 0);
		return;
	}
	const duration = Math.max(0, lastMediaTimeline.duration);
	const position = getCurrentTimelinePosition();
	setMediaTimelineText(position, duration);
	renderSeekbar(position, duration);
}

function ensureMediaTimelineTicker() {
	if (mediaTimelineTicker) return;
	mediaTimelineTicker = setInterval(() => {
		if (!isMediaPlaying || !lastMediaTimeline.hasValue) return;
		renderCurrentMediaTimeline();
	}, MEDIA_TIMELINE_TICK_MS);
}

function wallpaperMediaTimelineListener(event) {
	const duration = Math.max(0, Number(event.duration) || 0);
	const position = Math.max(0, Number(event.position) || 0);
	syncMediaTimelineState(position, duration, true);
	renderCurrentMediaTimeline();
}

if (window.wallpaperRegisterMediaTimelineListener) window.wallpaperRegisterMediaTimelineListener(wallpaperMediaTimelineListener);

ensureMediaTimelineTicker();

function wallpaperMediaPlaybackListener(event) {
	if (event.state !== window.wallpaperMediaIntegration.PLAYBACK_PLAYING) {
		isMediaPlaying = false;
		setMediaPlaybackStatus("Idle:");
		resetMediaTimelineDisplay();
		startGameOfLifeIfNeeded();
	} else {
		isMediaPlaying = true;
		setMediaPlaybackStatus("Playing:");
		if (lastMediaTimeline.hasValue) lastMediaTimeline.syncedAt = Date.now();
		stopGameOfLife();
		renderCurrentMediaTimeline();
		updateAsciiImageDebounce();
	}
}

if (window.wallpaperRegisterMediaPlaybackListener) window.wallpaperRegisterMediaPlaybackListener(wallpaperMediaPlaybackListener);

function wallpaperMediaThumbnailListener(event) {
	currentMediaThumbnail = event.thumbnail || "";

	if (!isMediaPlaying) {
		startGameOfLifeIfNeeded();
		return;
	}

	updateAsciiImageDebounce();
}

if (window.wallpaperRegisterMediaThumbnailListener) window.wallpaperRegisterMediaThumbnailListener(wallpaperMediaThumbnailListener);
