// Startup, the one-second tick and the shared resize handling. Loaded last.

let startTimestamp = null;

function waitForUptimeElement() {
	const uptimeElements = document.querySelectorAll(".uptime");
	if (!uptimeElements.length) {
		requestAnimationFrame(waitForUptimeElement);
		return;
	}

	startTimestamp = new Date();

	updateSystem();
	ensureAutoIpDetection();
	ensureAutoSystemInfoDetection();
	updateAsciiImageDebounce();
	initializeMetricGraphs();
	renderDividers();

	setInterval(() => {
		const uptimeText = formatTime(Math.floor((new Date() - startTimestamp) / 1000));
		uptimeElements.forEach((element) => {
			element.textContent = uptimeText;
		});
		updateDate();
		updateClocks();
		updateTimers();
	}, 1000);
}

requestAnimationFrame(waitForUptimeElement);

// One resize path: drop cached measurements, then re-render everything that is sized in characters.
function handleResize() {
	invalidateMeasurements();
	invalidateSliderMeasurements();
	renderDividers();
	if (lastMediaTimeline.hasValue) renderCurrentMediaTimeline();
	else renderSeekbar(0, 0);
	refreshAsciiViewport();
	drawNetworkGraph();
	drawCpuGraph();
}

window.addEventListener("resize", debounce(handleResize, 120));

// Character widths depend on the web font, which finishes loading after the first measurements.
if (document.fonts) document.fonts.ready.then(handleResize);
