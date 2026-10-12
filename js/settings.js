// User settings and the Wallpaper Engine property listener that applies them.
// Loaded after the feature files: Wallpaper Engine may call the listener as soon as it is assigned.

const root = document.documentElement;

const userSettings = {
	dateformat: "mmddyyyy",
	timeFormat: 12,
	ignoreTooBig: false,
	layout: {
		customMargins: false,
		direction: "vertical", // vertical | horizontal

		hideTimePanel: false,
		hideAudioPanel: false,
		hideGraphsPanel: false,
		hideAsciiArt: false,

		position: "right", // left | center | right
		alignment: "top", // top | center | bottom | custom
		order: "time", // time | overview
		audioLocation: "overview", // time | center | overview

		margin: {
			top: undefined,
			bottom: undefined,
			left: undefined,
			right: undefined,
		},
	},
	volume: {
		showExtras: true, // bass/mid/treble sliders
		smoothness: 0.2,
		sensitivity: 1,
	},
	ascii: {
		useMediaArt: true,
		defaultImage: "",
		colored: true,
		colorMode: "theme",
		resolution: 50,
		saturation: 1, // 0 = grayscale, 1 = normal, >1 more vivid
	},
	times: [
		{ enabled: true, label: "HOME" },
		{ enabled: true, label: "CEST", timezone: "Europe/Berlin" },
		{ enabled: true, label: "UTC", timezone: "UTC" },
		{ enabled: true, label: "PST", timezone: "America/Los_Angeles" },
		{ enabled: true, label: "IST", timezone: "Asia/Kolkata" },
	],
	timers: [
		{ enabled: true, label: "", date: "" },
		{ enabled: true, label: "", date: "" },
		{ enabled: true, label: "", date: "" },
		{ enabled: true, label: "", date: "" },
		{ enabled: true, label: "", date: "" },
	],
	systemInfo: {},
	customSystemInfo: {
		enabled: true,
		rows: 11, // rows above this count are blanked (menu: "Custom Rows")
	},
};

let initialLoad = true;

let ASCIIUpdateTimeout = null;

window.wallpaperPropertyListener = {
	applyUserProperties: function (properties) {
		let shouldUpdateAscii = false;
		let shouldUpdateClock = false;
		let shouldUpdateTimer = false;
		let shouldUpdateSystem = false;
		let shouldUpdateLayout = false;
		let shouldRedrawMetricGraphs = false;
		let shouldRenderDividerLines = false;

		if (initialLoad === true) {
			systemInfo.forEach((entry) => {
				if (!entry) return;
				userSettings.systemInfo[entry] = properties[entry].value;
			});

			updateSystem();
			updateLayout();
			refreshAsciiPalette();
			initialLoad = false;
		}

		if (properties.textsize) {
			root.style.setProperty("--p", `${properties.textsize.value}pt`);
			invalidateMeasurements();
			invalidateSliderMeasurements();
			invalidateAsciiViewportLock();
			if (lastMediaTimeline.hasValue) renderSeekbar(lastMediaTimeline.position, lastMediaTimeline.duration);
			shouldUpdateLayout = true;
		}

		if (properties.theme) {
			const theme = properties.theme.value;
			document.documentElement.setAttribute("data-theme", theme);
		}

		for (const [key, setting] of Object.entries(COLOR_SETTINGS)) {
			if (!properties[key]) continue;
			const rgb = wpColorToCss(properties[key].value);
			setting.vars.forEach((cssVar) => root.style.setProperty(cssVar, rgb));
			if (setting.redraw === "graphs") shouldRedrawMetricGraphs = true;
			if (setting.redraw === "ascii") shouldUpdateAscii = true;
		}

		if (properties.hideitoobigiwarning) {
			userSettings.ignoreTooBig = properties.hideitoobigiwarning.value;
			shouldUpdateLayout = true;
		}

















		if (properties.seekbarfillchar) {
			const raw = String(properties.seekbarfillchar.value ?? "").trim();
			seekbarProgressChar = raw.length > 0 ? raw[0] : "=";
			if (lastMediaTimeline.hasValue) renderSeekbar(lastMediaTimeline.position, lastMediaTimeline.duration);
		}




		if (properties.hidetimetopdivider) {
			setDividerHidden(".divider-time-top", properties.hidetimetopdivider.value);
			shouldRenderDividerLines = true;
		}
		if (properties.hidetimebottomdivider) {
			setDividerHidden(".divider-time-bottom", properties.hidetimebottomdivider.value);
			shouldRenderDividerLines = true;
		}
		if (properties.hidegraph1topdivider) {
			setDividerHidden(".divider-graph1-top", properties.hidegraph1topdivider.value);
			shouldRenderDividerLines = true;
		}
		if (properties.hidegraph1bottomdivider) {
			setDividerHidden(".divider-graph1-bottom", properties.hidegraph1bottomdivider.value);
			shouldRenderDividerLines = true;
		}
		if (properties.hidegraph2topdivider) {
			setDividerHidden(".divider-graph2-top", properties.hidegraph2topdivider.value);
			shouldRenderDividerLines = true;
		}
		if (properties.hidegraph2bottomdivider) {
			setDividerHidden(".divider-graph2-bottom", properties.hidegraph2bottomdivider.value);
			shouldRenderDividerLines = true;
		}
		if (properties.hideaudiovisualizertopdivider) {
			setDividerHidden(".divider-audio-visualizer-top", properties.hideaudiovisualizertopdivider.value);
			shouldRenderDividerLines = true;
		}
		if (properties.hideaudiovisualizerbottomdivider) {
			setDividerHidden(".divider-audio-visualizer-bottom", properties.hideaudiovisualizerbottomdivider.value);
			shouldRenderDividerLines = true;
		}
		if (properties.hideaudioseekbartopdivider) {
			setDividerHidden(".divider-audio-seekbar-top", properties.hideaudioseekbartopdivider.value);
			shouldRenderDividerLines = true;
		}















		if (properties.graph1spacebefore !== undefined) {
			const val = Math.max(0, Math.floor(Number(properties.graph1spacebefore.value) || 0));
			document.documentElement.style.setProperty(`--graph1-space-before`, `${val}ch`);
			shouldRedrawMetricGraphs = true;
		}

		if (properties.graph2spacebefore !== undefined) {
			const val = Math.max(0, Math.floor(Number(properties.graph2spacebefore.value) || 0));
			document.documentElement.style.setProperty(`--graph2-space-before`, `${val}ch`);
			shouldRedrawMetricGraphs = true;
		}

		if (properties.graph1height !== undefined) {
			graph1Height = Math.max(5, Math.min(30, Math.floor(Number(properties.graph1height.value) || 11)));
			shouldRedrawMetricGraphs = true;
		}

		if (properties.graph2height !== undefined) {
			graph2Height = Math.max(5, Math.min(30, Math.floor(Number(properties.graph2height.value) || 11)));
			shouldRedrawMetricGraphs = true;
		}

		if (properties.artbackground) {
			const val = Boolean(properties.artbackground.value);
			if (val === true) {
				document.documentElement.style.setProperty(`--color-art-bg`, `var(--color-art-value)`);
			} else {
				document.documentElement.style.setProperty(`--color-art-bg`, `transparent`);
			}
		}

		if (properties.hidetimepanel) {
			userSettings.layout.hideTimePanel = Boolean(properties.hidetimepanel.value);
			shouldUpdateLayout = true;
			shouldUpdateTimer = true;
		}
		if (properties.hideaudiopanel) {
			userSettings.layout.hideAudioPanel = Boolean(properties.hideaudiopanel.value);
			shouldUpdateLayout = true;
		}
		if (properties.hidegraphspanel) {
			userSettings.layout.hideGraphsPanel = Boolean(properties.hidegraphspanel.value);
			shouldUpdateLayout = true;
			shouldRedrawMetricGraphs = true;
		}
		if (properties.hideasciiart) {
			userSettings.layout.hideAsciiArt = Boolean(properties.hideasciiart.value);
			shouldUpdateLayout = true;
		}

		if (properties.layout_direction) {
			userSettings.layout.direction = properties.layout_direction.value;
			shouldUpdateLayout = true;
		}

		if (properties.layout_position) {
			userSettings.layout.position = properties.layout_position.value;
			shouldUpdateLayout = true;
		}

		if (properties.layout_alignment) {
			userSettings.layout.alignment = properties.layout_alignment.value;
			shouldUpdateLayout = true;
		}
		if (properties.layout_vertical_order) {
			userSettings.layout.order = properties.layout_vertical_order.value;
			shouldUpdateLayout = true;
		}

		if (properties.layout_audio_location) {
			userSettings.layout.audioLocation = properties.layout_audio_location.value;
			shouldUpdateLayout = true;
		}

		if (properties.layout_custom_margin) {
			userSettings.layout.customMargins = properties.layout_custom_margin.value;
			shouldUpdateLayout = true;
		}

		if (properties.shiftleft) {
			userSettings.layout.margin.left = properties.shiftleft.value;
			shouldUpdateLayout = true;
		}

		if (properties.shiftright) {
			userSettings.layout.margin.right = properties.shiftright.value;
			shouldUpdateLayout = true;
		}

		if (properties.shifttop) {
			userSettings.layout.margin.top = properties.shifttop.value;
			shouldUpdateLayout = true;
		}

		if (properties.shiftbottom) {
			userSettings.layout.margin.bottom = properties.shiftbottom.value;
			shouldUpdateLayout = true;
		}


		if (properties.theme) {
			shouldUpdateAscii = true;
		}

		if (properties.timeformat) {
			userSettings.timeFormat = Number(properties.timeformat.value);
			updateDate();
		}

		if (properties.dateformat) {
			userSettings.dateformat = properties.dateformat.value;
			updateDate();
		}

		if (properties.showextras) {
			const value = properties.showextras.value;

			userSettings.volume.showExtras = properties.showextras.value;

			if (sliders) {
				if (value === false) {
					[sliders.bass, sliders.mid, sliders.treble].forEach((slider) => {
						slider.classList.add("hidden");
					});
				} else {
					[sliders.bass, sliders.mid, sliders.treble].forEach((slider) => {
						slider.classList.remove("hidden");
					});
				}
				invalidateSliderMeasurements();
			}
		}
		if (properties.smoothness) userSettings.volume.smoothness = 1 - parseFloat(properties.smoothness.value);
		if (properties.volume_sensitivity) userSettings.volume.sensitivity = parseFloat(properties.volume_sensitivity.value);

		if (properties.usemediaart !== undefined) {
			userSettings.ascii.useMediaArt = properties.usemediaart.value;
			shouldUpdateAscii = true;
		}
		if (properties.defaultimage !== undefined) {
			let val = properties.defaultimage.value;
			if (val && !val.startsWith("file:///") && !val.startsWith("http")) {
				val = "file:///" + val.replace(/\\/g, "/");
			}
			userSettings.ascii.defaultImage = val;
			shouldUpdateAscii = true;
		}
		if (properties.coloredascii !== undefined) {
			userSettings.ascii.colored = properties.coloredascii.value;
			shouldUpdateAscii = true;
		}
		if (properties.asciiresolution !== undefined) {
			userSettings.ascii.resolution = parseInt(properties.asciiresolution.value) - 2;
			invalidateAsciiViewportLock();
			shouldUpdateAscii = true;
		}
		if (properties.saturation !== undefined) {
			userSettings.ascii.saturation = parseFloat(properties.saturation.value);
			shouldUpdateAscii = true;
		}
		if (properties.ascii_color_mode) {
			userSettings.ascii.colorMode = properties.ascii_color_mode.value;
			shouldUpdateAscii = true;
		}



		for (let i = 0; i <= 4; i++) {
			const timeProp = properties[`time${i}`];
			if (timeProp) {
				const newVal = timeProp.value;
				const element = document.querySelector(`.time${i}`);
				if (element) {
					element.classList.toggle("hidden", !newVal);
					if (newVal === true) shouldUpdateClock = true;
				}
				userSettings.times[i].enabled = newVal;
			}

			const labelProp = properties[`clabel${i}`];
			if (labelProp) {
				userSettings.times[i].label = labelProp.value;
			}

			const tzProp = properties[`timezone${i}`];
			if (tzProp) {
				userSettings.times[i].timezone = tzProp.value;
			}
		}

		for (let i = 0; i <= 4; i++) {
			const timerProp = properties[`timer${i}`];
			if (timerProp) {
				const newVal = timerProp.value;
				const element = document.querySelector(`.timer${i}`);
				if (element) {
					element.classList.toggle("hidden", !newVal);
					if (newVal === true) shouldUpdateTimer = true;
				}
				userSettings.timers[i].enabled = newVal;
			}

			const labelProp = properties[`tlabel${i}`];
			if (labelProp) {
				userSettings.timers[i].label = labelProp.value;
			}

			const dateProp = properties[`tdate${i}`];
			if (dateProp) {
				userSettings.timers[i].date = dateProp.value;
			}
		}

		systemInfo.forEach((entry) => {
			if (properties[entry]) {
				userSettings.systemInfo[entry] = properties[entry].value;
				shouldUpdateSystem = true;
			}
		});

		for (let i = 1; i <= customSystemInfoValues; i++) {
			const prop = properties[`system_stats_prop-${i}`];
			if (prop) {
				userSettings.customSystemInfo[`prop-${i}`] = prop.value;
				shouldUpdateSystem = true;
			}

			const val = properties[`system_stats_value-${i}`];
			if (val) {
				userSettings.customSystemInfo[`value-${i}`] = val.value;
				shouldUpdateSystem = true;
			}
		}

		if (properties.system_additional_information) {
			userSettings.customSystemInfo.enabled = Boolean(properties.system_additional_information.value);
			shouldUpdateSystem = true;
		}
		if (properties.system_custom_rows) {
			userSettings.customSystemInfo.rows = Number(properties.system_custom_rows.value);
			shouldUpdateSystem = true;
		}

		if (shouldUpdateAscii) {
			clearTimeout(ASCIIUpdateTimeout);
			ASCIIUpdateTimeout = setTimeout(() => {
				refreshAsciiPalette();
				updateAsciiImageDebounce();
			}, 250);
		}
		if (shouldUpdateClock) updateClocks();
		if (shouldUpdateTimer) updateTimers();
		if (shouldUpdateSystem) updateSystem();
		if (shouldRenderDividerLines) renderDividers();
		if (shouldUpdateLayout) updateLayout();
		if (shouldRedrawMetricGraphs && metricStore) {
			drawNetworkGraph();
			drawCpuGraph();
		}
	},
};
