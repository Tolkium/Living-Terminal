// Panel visibility, direction/position/alignment, margins, the too-big warning and divider lines.

function updateLayout() {
	const body = document.querySelector("body");
	const terminal = document.querySelector(".terminal");
	const audioPanel = document.querySelector(".audio-terminal");
	const graphsPanel = document.getElementById("metrics-graphs");
	const asciiPanel = document.querySelector(".overview-terminal .information .image");
	const warningEl = document.querySelector(".too-big-warning");

	const audioTimeJump = document.getElementById("audio-time-jump");
	const audioTerminalJump = document.getElementById("audio-terminal-jump");
	const audioOverviewJump = document.getElementById("audio-overview-jump");

	const timePanelEl = document.querySelector('.time-terminal')

	// ---

	const hideTime = userSettings.layout.hideTimePanel;
	if (hideTime === true) timePanelEl.classList.add('hidden');
	else timePanelEl.classList.remove('hidden');

	if (audioPanel) audioPanel.classList.toggle("hidden", userSettings.layout.hideAudioPanel === true);
	if (graphsPanel) graphsPanel.classList.toggle("hidden", userSettings.layout.hideGraphsPanel === true);
	if (asciiPanel) asciiPanel.classList.toggle("hidden", userSettings.layout.hideAsciiArt === true);
	

	const isHorizontal = userSettings.layout.direction === "horizontal";
	if (isHorizontal) {
		terminal.classList.remove("vertical");
		terminal.classList.add("horizontal");
	} else {
		terminal.classList.add("vertical");
		terminal.classList.remove("horizontal");
	}

	const position = userSettings.layout.position;
	if (position === "left") {
		body.classList.add("left");
		body.classList.remove("center");
		body.classList.remove("right");
	} else if (position === "center") {
		body.classList.remove("left");
		body.classList.add("center");
		body.classList.remove("right");
	} else {
		body.classList.remove("left");
		body.classList.remove("center");
		body.classList.add("right");
	}

	const alignment = userSettings.layout.alignment;
	if (alignment === "top") {
		terminal.classList.add("top");
		terminal.classList.remove("center");
		terminal.classList.remove("bottom");
	} else if (alignment === "center") {
		terminal.classList.remove("top");
		terminal.classList.add("center");
		terminal.classList.remove("bottom");
	} else {
		terminal.classList.remove("top");
		terminal.classList.remove("center");
		terminal.classList.add("bottom");
	}

	const order = userSettings.layout.order;
	if (order === "overview") {
		terminal.classList.remove("time");
		terminal.classList.add("overview");
	} else {
		terminal.classList.add("time");
		terminal.classList.remove("overview");
	}

	const audioLocation = userSettings.layout.audioLocation;
	if (audioLocation === "time") {
		audioTimeJump.appendChild(audioPanel);
	} else if (audioLocation === "center") {
		audioTerminalJump.appendChild(audioPanel);
	} else {
		audioOverviewJump.appendChild(audioPanel);
	}

	// ---

	const marginEl = document.querySelector("body");
	if (userSettings.layout.customMargins) {
		const margins = userSettings.layout.margin;

		Object.keys(margins).forEach((margin) => {
			const val = parseInt(margins[margin]);
			if (val === null || Number.isNaN(val)) return marginEl.style.setProperty(`padding-${margin}`, "");

			marginEl.style.setProperty(`padding-${margin}`, `${val}px`);
		});
	} else {
		marginEl.style.setProperty("padding", "0", "important");
	}

	invalidateAsciiViewportLock();
	invalidateSliderMeasurements();

	if (!userSettings.ignoreTooBig) {
		const isOutX = terminal.scrollWidth > terminal.clientWidth;
		const isOutY = terminal.scrollHeight > terminal.clientHeight;

		if (isOutX || isOutY) warningEl.classList.remove("hidden");
		else warningEl.classList.add("hidden");
	} else warningEl.classList.add("hidden");

	if (lastMediaTimeline.hasValue) renderSeekbar(lastMediaTimeline.position, lastMediaTimeline.duration);
	renderDividers();
}

function renderDividers() {
	const dividers = document.querySelectorAll(".divider");
	if (!dividers.length) return;

	dividers.forEach((el) => {
		const charWidth = measureCharWidth(el, "-".repeat(32));
		const count = Math.max(2, Math.floor(el.clientWidth / Math.max(1, charWidth) + 0.5));
		el.textContent = "-".repeat(count);
	});
}

function setDividerHidden(selector, hidden) {
	document.querySelectorAll(selector).forEach((element) => {
		element.classList.toggle("hidden", Boolean(hidden));
	});
}
