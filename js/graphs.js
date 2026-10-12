// Network and CPU graphs: data store (helper service or mock data), polling, text rendering.

let metricGraphsRenderInterval = null;

let metricGraphsPollInterval = null;

let metricGraphsRevealTimeout = null;

let metricPollBusy = false;

let cpuFillChar = "░";

const NET_MIN = 0.0;

const NET_MAX = 2000.0;

const CPU_MIN = 0.0;

const CPU_MAX = 100.0;

const HISTORY = 240;

const CPU_HISTORY = 420;

const HELPER_PORT_START = 8877;

const HELPER_PORT_END = 8896;

const POLL_INTERVAL_MS = 1000;

const RENDER_INTERVAL_MS = 1000;

const FETCH_TIMEOUT_MS = 2500;

const DIAG_LOG_EVERY = 10;

const MAX_PENDING_POINTS = 16;

let activeMetricsUrl = null;

let nextMetricsDiscoveryAt = 0;

const DISCOVERY_RETRY_MS = 30000;

let metricsDiscoveryLogged = false;

let graph1Height = 11;

let graph2Height = 11;

function initializeMetricGraphs() {
	const container = document.getElementById("metrics-graphs");
	if (!container) return;

	container.classList.add("hidden");
	clearTimeout(metricGraphsRevealTimeout);
	metricGraphsRevealTimeout = setTimeout(() => {
		if (userSettings.layout.hideGraphsPanel !== true) {
			container.classList.remove("hidden");
			drawNetworkGraph();
			drawCpuGraph();
		}
	}, 1400);
	metricStore = createDataStore();
	console.log(
		`[DATA] metrics endpoint=auto (/metrics or localhost:${HELPER_PORT_START}-${HELPER_PORT_END}) poll=${POLL_INTERVAL_MS}ms timeout=${FETCH_TIMEOUT_MS}ms`
	);

	pollMetrics();
	loopMetricGraphs();

	if (!metricGraphsPollInterval) metricGraphsPollInterval = setInterval(pollMetrics, POLL_INTERVAL_MS);
	if (!metricGraphsRenderInterval) metricGraphsRenderInterval = setInterval(loopMetricGraphs, RENDER_INTERVAL_MS);
}

let metricStore = null;

function createDataStore() {
	const state = {
		tick: 0,
		netSeries: Array.from({ length: HISTORY }, () => 0),
		cpuSeries: Array.from({ length: CPU_HISTORY }, () => 0),
		hasServiceData: false,
		lastMetrics: null,
		lastMetricsAt: 0,
		lastServiceTimestamp: 0,
		pendingServicePoints: [],
		pollCount: 0,
		pollFailStreak: 0,
		sourceMode: "unknown",
		resetOnFirstService: false,
	};

	function setSourceMode(mode, detail) {
		if (state.sourceMode === mode) return;
		state.sourceMode = mode;
		if (mode === "service") {
			console.log(`[DATA] SOURCE=SERVICE (${detail})`);
		} else if (mode === "mock") {
			console.warn(`[DATA] SOURCE=MOCK (${detail})`);
		}
	}

	function nextNet(prev) {
		const noise = (Math.random() - 0.5) * 18;
		const wave = 26 * Math.sin(state.tick / 30) + 14 * Math.sin(state.tick / 11);
		return clamp(prev + noise + wave * 0.08, NET_MIN, NET_MAX);
	}

	function nextCpu(prev) {
		const drift = Math.sin(state.tick / 17) * 0.9 + Math.sin(state.tick / 41) * 0.6;
		const noise = (Math.random() - 0.5) * 4.2;
		return clamp(prev + drift + noise, CPU_MIN, CPU_MAX);
	}

	function getLiveMetrics() {
		if (!state.lastMetrics) return null;
		if (Date.now() - state.lastMetricsAt > 5000) return null;
		return state.lastMetrics;
	}

	return {
		async pullMetrics() {
			let timer = null;
			try {
				const metricsUrl = await resolveMetricsEndpoint();
				if (!metricsUrl) return;

				state.pollCount += 1;
				const controller = new AbortController();
				timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
				const t0 = performance.now();
				const res = await fetch(`${metricsUrl}?since=${state.lastServiceTimestamp}&t=${Date.now()}`, {
					cache: "no-store",
					signal: controller.signal,
				});
				if (!res.ok) {
					state.pollFailStreak += 1;
					if (state.pollCount % DIAG_LOG_EVERY === 0) {
						console.warn(`[DATA] /metrics http=${res.status} failStreak=${state.pollFailStreak}`);
					}
					return;
				}
				const data = await res.json();
				const rawPoints = data?.points;
				const points = Array.isArray(rawPoints) ? rawPoints : rawPoints && typeof rawPoints === "object" ? [rawPoints] : [];
				const candidates = points.length > 0 ? points : [data?.latest, data].filter(Boolean);
				let accepted = 0;
				for (const p of candidates) {
					const ts = Number(p?.timestamp);
					const netMbps = Number(p?.netMbps);
					const cpuPercent = Number(p?.cpuPercent);
					if (!Number.isFinite(ts) || !Number.isFinite(netMbps) || !Number.isFinite(cpuPercent)) continue;
					if (ts <= state.lastServiceTimestamp) continue;
					const metric = {
						timestamp: ts,
						netMbps: Math.max(0, netMbps),
						cpuPercent: clamp(cpuPercent, CPU_MIN, CPU_MAX),
					};
					state.pendingServicePoints.push(metric);
					state.lastServiceTimestamp = ts;
					accepted += 1;
				}
				if (state.pendingServicePoints.length > MAX_PENDING_POINTS) {
					state.pendingServicePoints.splice(0, state.pendingServicePoints.length - MAX_PENDING_POINTS);
				}
				if (accepted > 0) {
					if (!state.hasServiceData) state.resetOnFirstService = true;
					state.hasServiceData = true;
					state.lastMetrics = state.pendingServicePoints[state.pendingServicePoints.length - 1];
					state.lastMetricsAt = Date.now();
					state.pollFailStreak = 0;
					if (state.pollCount % DIAG_LOG_EVERY === 0) {
						const dt = Math.round(performance.now() - t0);
						console.log(`[DATA] /metrics ok dt=${dt}ms accepted=${accepted} since=${state.lastServiceTimestamp}`);
					}
				}
			} catch (err) {
				activeMetricsUrl = null;
				state.pollFailStreak += 1;
				if (state.pollCount % DIAG_LOG_EVERY === 0) {
					const msg = err && err.name ? err.name : "fetch_error";
					console.warn(`[DATA] /metrics ${msg} failStreak=${state.pollFailStreak}`);
				}
			} finally {
				if (timer) clearTimeout(timer);
			}
		},
		step() {
			state.tick += 1;
			if (!state.hasServiceData) {
				setSourceMode("mock", "service unavailable, using mock data");
				state.netSeries.shift();
				state.netSeries.push(nextNet(state.netSeries[state.netSeries.length - 1]));
				state.cpuSeries.shift();
				state.cpuSeries.push(nextCpu(state.cpuSeries[state.cpuSeries.length - 1]));
				return;
			}

			let live = null;
			if (state.pendingServicePoints.length > 0) {
				// The helper can sample faster than we render; always show the newest point so the graph never lags behind.
				live = state.pendingServicePoints[state.pendingServicePoints.length - 1];
				state.pendingServicePoints.length = 0;
				state.lastMetrics = live;
				state.lastMetricsAt = Date.now();
			} else {
				live = getLiveMetrics();
			}
			setSourceMode("service", live ? "fresh /metrics data" : "holding last service value");
			if (!live && state.lastMetrics) live = state.lastMetrics;
			if (state.resetOnFirstService && live) state.resetOnFirstService = false;
			state.netSeries.shift();
			state.netSeries.push(live ? clamp(live.netMbps, NET_MIN, NET_MAX) : nextNet(state.netSeries[state.netSeries.length - 1]));
			state.cpuSeries.shift();
			state.cpuSeries.push(live ? live.cpuPercent : nextCpu(state.cpuSeries[state.cpuSeries.length - 1]));
		},
		sample(seriesName, width) {
			const series = seriesName === "cpu" ? state.cpuSeries : state.netSeries;
			if (width <= 0) return [];
			if (series.length >= width) return series.slice(series.length - width);
			const pad = Array.from({ length: width - series.length }, () => 0);
			return pad.concat(series);
		},
	};
}

async function resolveMetricsEndpoint() {
	if (activeMetricsUrl) return activeMetricsUrl;
	if (Date.now() < nextMetricsDiscoveryAt) return null;

	const candidates = [];
	if (location.protocol !== "file:") candidates.push("/metrics");
	for (let port = HELPER_PORT_START; port <= HELPER_PORT_END; port++) {
		candidates.push(`http://localhost:${port}/metrics`);
	}

	for (const baseUrl of candidates) {
		let timer = null;
		try {
			const controller = new AbortController();
			timer = setTimeout(() => controller.abort(), 900);
			const probe = await fetch(`${baseUrl}?t=${Date.now()}`, {
				cache: "no-store",
				signal: controller.signal,
			});
			if (!probe.ok) continue;
			const json = await probe.json();
			if (!json || (!json.latest && !Array.isArray(json.points))) continue;

			activeMetricsUrl = baseUrl;
			console.log(`[DATA] metrics source discovered: ${activeMetricsUrl}`);
			return activeMetricsUrl;
		} catch (err) {
			// try next endpoint
		} finally {
			if (timer) clearTimeout(timer);
		}
	}

	nextMetricsDiscoveryAt = Date.now() + DISCOVERY_RETRY_MS;
	if (!metricsDiscoveryLogged) {
		console.warn("[DATA] no /metrics endpoint found; using mock data until helper is reachable");
		metricsDiscoveryLogged = true;
	}

	return null;
}

function isGraphsPanelVisible() {
	const container = document.getElementById("metrics-graphs");
	return Boolean(container) && !container.classList.contains("hidden");
}

function frameColsForPanel(element, leftCols, minCols, rightCols = 0) {
	const charWidth = measureCharWidth(element);
	const style = getComputedStyle(element);
	const pad = (parseFloat(style.paddingLeft) || 0) + (parseFloat(style.paddingRight) || 0);
	const totalCols = Math.floor((element.clientWidth - pad) / Math.max(1, charWidth));
	const frameCols = totalCols - leftCols - 2 - rightCols; // left label/gap + frame borders + right reserve
	return Math.max(minCols, frameCols);
}

function graphLabelWidth(values, formatter, minWidth = 0) {
	return Math.max(
		minWidth,
		...values.map((value) => String(formatter(value)).length)
	);
}

function placeRightGraphLabel(lines, row, label, color, width, offset = 0) {
	const index = row + offset;
	if (!label || index < 0 || index >= lines.length) return;
	lines[index] += colorText(label.toString().padEnd(width, " "), color);
}

function formatGraphRightSpeedLabel(mbps) {
	if (mbps < 1) {
		const kb = Math.round(clamp(mbps * 1000, 0, 999));
		return `${kb}K`;
	}
	if (mbps < 10) {
		if (mbps >= 9.95) return `10M`;
		return `${mbps.toFixed(1)}M`;
	}
	if (mbps < 1000) {
		return `${Math.round(mbps)}M`;
	}
	const gb = mbps / 1000;
	if (gb < 10) {
		if (gb >= 9.95) return `10G`;
		return `${gb.toFixed(1)}G`;
	}
	return `${Math.round(gb)}G`;
}

function formatGraphRightPercentLabel(value) {
	return `${Math.round(value)}%`;
}

function drawPathWithKind(grid, kindGrid, values, kind = "line") {
	for (let x = 0; x < values.length; x++) {
		const y = values[x];
		if (x === 0) {
			grid[y][x] = "─";
			if (kindGrid) kindGrid[y][x] = kind;
			continue;
		}
		const py = values[x - 1];
		if (y === py) {
			grid[y][x] = "─";
			if (kindGrid) kindGrid[y][x] = kind;
			continue;
		}
		if (y < py) {
			grid[py][x] = "╯";
			if (kindGrid) kindGrid[py][x] = kind;
			for (let yy = y + 1; yy < py; yy++) {
				grid[yy][x] = "│";
				if (kindGrid) kindGrid[yy][x] = kind;
			}
			grid[y][x] = "╭";
			if (kindGrid) kindGrid[y][x] = kind;
		} else {
			grid[py][x] = "╮";
			if (kindGrid) kindGrid[py][x] = kind;
			for (let yy = py + 1; yy < y; yy++) {
				grid[yy][x] = "│";
				if (kindGrid) kindGrid[yy][x] = kind;
			}
			grid[y][x] = "╰";
			if (kindGrid) kindGrid[y][x] = kind;
		}
	}
}

function colorText(text, colorCssVar) {
	return `<span style="color:${colorCssVar}">${escapeHtml(text)}</span>`;
}

function renderGridRowHtml(chars, kinds, palette) {
	let html = "";
	let activeColor = "";
	let buffer = "";

	for (let i = 0; i < chars.length; i++) {
		const token = kinds?.[i] || "bg";
		const color = palette[token] || palette.bg;
		const ch = chars[i];

		if (color !== activeColor) {
			if (buffer) html += `<span style="color:${activeColor}">${escapeHtml(buffer)}</span>`;
			activeColor = color;
			buffer = ch;
		} else {
			buffer += ch;
		}
	}

	if (buffer) html += `<span style="color:${activeColor}">${escapeHtml(buffer)}</span>`;
	return html;
}

function overlayTextLinesOnGrid(grid, textLines, startX, startY, opaque = false, kindGrid = null, kind = "big") {
	const maxRowWidth = textLines.reduce((max, line) => Math.max(max, (line || "").length), 0);

	for (let y = 0; y < textLines.length; y++) {
		const row = textLines[y] || "";
		const gy = startY + y;
		if (gy < 0 || gy >= grid.length) continue;

		if (opaque) {
			for (let x = 0; x < maxRowWidth; x++) {
				const gx = startX + x;
				if (gx < 0 || gx >= grid[gy].length) continue;
				grid[gy][gx] = " ";
				if (kindGrid) kindGrid[gy][gx] = "bg";
			}
		}

		for (let x = 0; x < row.length; x++) {
			const ch = row[x];
			if (ch === " ") continue;
			const gx = startX + x;
			if (gx < 0 || gx >= grid[gy].length) continue;
			grid[gy][gx] = ch;
			if (kindGrid) kindGrid[gy][gx] = kind;
		}
	}
}

function formatSpeedCompact(mbps) {
	if (mbps < 1) {
		const kb = Math.round(clamp(mbps * 1000, 0, 999));
		return `${kb}Kb`;
	}
	if (mbps < 1000) {
		if (mbps < 10) return `${mbps.toFixed(1)}Mb`;
		return `${Math.round(mbps)}Mb`;
	}
	const gb = mbps / 1000;
	return `${gb.toFixed(1)}Gb`;
}

function bigTextLines(text) {
	const glyphs = {
		0: ["╔═══╗", "║   ║", "║   ║", "║   ║", "╚═══╝"],
		1: ["  ╗  ", " ╔║  ", "  ║  ", "  ║  ", " ═╩═ "],
		2: ["╔═══╗", "    ║", "╔═══╝", "║    ", "╚═══╝"],
		3: ["╔═══╗", "    ║", " ═══╣", "    ║", "╚═══╝"],
		4: ["║   ║", "║   ║", "╚═══╣", "    ║", "    ╚"],
		5: ["╔═══╗", "║    ", "╚═══╗", "    ║", "╚═══╝"],
		6: ["╔═══╗", "║    ", "╠═══╗", "║   ║", "╚═══╝"],
		7: ["╔═══╗", "    ║", "    ║", "    ║", "    ╚"],
		8: ["╔═══╗", "║   ║", "╠═══╣", "║   ║", "╚═══╝"],
		9: ["╔═══╗", "║   ║", "╚═══╣", "    ║", "╚═══╝"],
		".": ["     ", "     ", "     ", "  ╷  ", "  ╵  "],
		K: ["K  K ", "K K  ", "KK   ", "K K  ", "K  K "],
		M: ["M   M", "MM MM", "M M M", "M   M", "M   M"],
		G: [" GGG ", "G    ", "G GG ", "G  G ", " GGG "],
		B: ["BBBB ", "B   B", "BBBB ", "B   B", "BBBB "],
		" ": ["     ", "     ", "     ", "     ", "     "],
	};
	const rows = ["", "", "", "", ""];
	for (const ch of text) {
		const g = glyphs[ch] || glyphs[" "];
		for (let i = 0; i < 5; i++) rows[i] += g[i] + " ";
	}
	return rows.map((r) => r.trimEnd());
}

function drawNetworkGraph() {
	const element = document.getElementById("g1");
	if (!element || !metricStore || !isGraphsPanelVisible()) return;

	const rightLabelWidth = 4;
	const h = graph1Height;
	const labelW = 4;
	const w = frameColsForPanel(element, labelW, 20, rightLabelWidth);
	const data = metricStore.sample("net", w);
	const dMin = Math.min(...data);
	const dMax = Math.max(...data);
	const pad = Math.max(0.01, dMax - dMin) * 0.08;
	const localMin = Math.max(0, dMin - pad);
	const localMax = Math.max(localMin + 0.01, dMax + pad);
	const localSpan = Math.max(0.01, localMax - localMin);
	const yVals = data.map((v) => {
		const t = (v - localMin) / localSpan;
		return h - 1 - Math.round(clamp(t, 0, 1) * (h - 1));
	});
	const grid = Array.from({ length: h }, () => Array(w).fill(" "));
	const kindGrid = Array.from({ length: h }, () => Array(w).fill("bg"));
	drawPathWithKind(grid, kindGrid, yVals, "line");

	const out = [];
	const cur = data[data.length - 1] || 0;
	const avg = data.reduce((a, b) => a + b, 0) / Math.max(1, data.length);
	const compact = formatSpeedCompact(cur);
	const compactMatch = compact.match(/^([0-9.]+)([A-Za-z]+)$/);
	const numericPart = compactMatch ? compactMatch[1] : compact;
	const unitPart = compactMatch ? compactMatch[2] : "";
	const bigDisplay = numericPart;
	const bigTextRaw = bigTextLines(bigDisplay);
	const bigText = bigTextRaw.map((line) => ` ${line} `);
	const bigWidth = bigText.reduce((m, line) => Math.max(m, line.length), 0);
	const bigTop = Math.max(0, Math.floor((h - bigText.length) / 2));
	const bigLeft = Math.max(0, Math.floor((w - bigWidth) / 2));
	overlayTextLinesOnGrid(grid, bigText, bigLeft, bigTop, true, kindGrid, "big");
	if (unitPart) {
		const unitX = Math.min(w - unitPart.length, bigLeft + bigWidth + 1);
		const unitY = Math.min(h - 1, bigTop + bigText.length - 1);
		overlayTextLinesOnGrid(grid, [unitPart], unitX, unitY, true, kindGrid, "big");
	}
	const title = `Network (Down+Up)  cur:${cur.toFixed(1)} Mbps  avg:${avg.toFixed(1)} Mbps`;
	const palette = {
		bg: "var(--graph1-line-color, var(--color-green))",
		line: "var(--graph1-line-color, var(--graph1-color, var(--color-green)))",
		fill: "var(--graph1-fill-color, var(--graph1-color, var(--color-green)))",
		big: "var(--graph1-big-color, var(--graph1-color, var(--color-green)))",
		window: "var(--graph1-window-color, var(--graph1-color, var(--color-green)))",
		tooltip: "var(--graph1-tooltip-color, var(--color-bright-black))",
		title: "var(--graph1-title-color, var(--graph1-tooltip-color, var(--color-bright-black)))",
	};
	out.push(colorText(`${" ".repeat(labelW)}+${"-".repeat(w)}+`, palette.window));

	for (let r = 0; r < h; r++) {
		const yVal = localMax - (localSpan * r) / (h - 1);
		const yLabelValue = formatGraphRightSpeedLabel(yVal);
		const yLabel = r % 2 === 0 ? yLabelValue.padStart(labelW, " ") : " ".repeat(labelW);
		const rowHtml = renderGridRowHtml(grid[r], kindGrid[r], palette);
		out.push(
			`${colorText(yLabel, palette.tooltip)}${colorText("|", palette.window)}${rowHtml}${colorText("|", palette.window)}`
		);
	}
	const currentRow = yVals[yVals.length - 1] ?? 0;
	placeRightGraphLabel(out, currentRow, formatGraphRightSpeedLabel(cur), palette.tooltip, rightLabelWidth, 1);

	out.push(colorText(`${" ".repeat(labelW)}+${"-".repeat(w)}+`, palette.window));

	// One column = one render tick, so column x shows the sample from (w - 1 - x) ticks ago.
	const now = Date.now();
	const marks = 7;
	const tickRow = Array(w).fill(" ");
	const labelRow = Array(w).fill(" ");
	for (let i = 0; i < marks; i++) {
		const x = Math.round((i / (marks - 1)) * (w - 1));
		const label = new Date(now - (w - 1 - x) * RENDER_INTERVAL_MS).toLocaleTimeString("en-US", { hour12: false }).slice(3);
		tickRow[x] = "┬";
		const start = clamp(x - Math.floor(label.length / 2), 0, Math.max(0, w - label.length));
		for (let j = 0; j < label.length && start + j < w; j++) labelRow[start + j] = label[j];
	}
	out.push(colorText(" ".repeat(labelW + 1) + tickRow.join(""), palette.tooltip));
	out.push(colorText(" ".repeat(labelW + 1) + labelRow.join(""), palette.tooltip));
	const graphStart = labelW + 1;
	const titlePad = graphStart + Math.max(0, Math.round((w - title.length) / 2));
	out.unshift(colorText(" ".repeat(titlePad) + title, palette.title));
	element.innerHTML = out.join("\n");
}

function drawCpuGraph() {
	const element = document.getElementById("g2");
	if (!element || !metricStore || !isGraphsPanelVisible()) return;

	const vStep = 21;
	const rightLabelWidth = 4;
	const h = graph2Height;
	const labelW = graphLabelWidth([CPU_MIN, (CPU_MAX + CPU_MIN) / 2, CPU_MAX], (value) => `${Math.round(value)}%`, 2);
	const leftCols = labelW;
	const w = frameColsForPanel(element, leftCols, 12, rightLabelWidth);
	const grid = Array.from({ length: h }, () => Array(w).fill(" "));
	const kindGrid = Array.from({ length: h }, () => Array(w).fill("bg"));
	const vGuideCount = Math.max(1, Math.floor((w - 1) / Math.max(1, vStep)));
	const vGuides = Array.from({ length: vGuideCount }, (_, i) => Math.round(((i + 1) * w) / (vGuideCount + 1)) - 1).filter(
		(x, i, arr) => x > 0 && x < w - 1 && (i === 0 || x !== arr[i - 1])
	);

	const hLines = [2, 5, 8];
	for (const x of vGuides) {
		for (let y = 0; y < h; y++) {
			grid[y][x] = "¦";
			kindGrid[y][x] = "helper";
		}
	}
	for (const y of hLines) {
		for (let x = 0; x < w; x++) {
			if (grid[y][x] === " ") {
				grid[y][x] = "-";
				kindGrid[y][x] = "helper";
			}
		}
	}

	const raw = metricStore.sample("cpu", w);
	const smoothed = raw.map((v, i) => {
		const a = raw[clamp(i - 1, 0, raw.length - 1)];
		const b = raw[i];
		const c = raw[clamp(i + 1, 0, raw.length - 1)];
		return a * 0.2 + b * 0.6 + c * 0.2;
	});
	const yVals = smoothed.map((p) => {
		const t = (p - CPU_MIN) / (CPU_MAX - CPU_MIN);
		return h - 1 - Math.round(clamp(t, 0, 1) * (h - 1));
	});
	const yValsPath = yVals.slice();
	if (yValsPath.length > 1) yValsPath[0] = yValsPath[1];

	for (let x = 0; x < w; x++) {
		const y = yVals[x];
		for (let yy = y; yy < h; yy++) {
			if (grid[yy][x] === " ") {
				grid[yy][x] = cpuFillChar;
				kindGrid[yy][x] = "fill";
			}
		}
	}

	drawPathWithKind(grid, kindGrid, yValsPath, "line");
	if (yValsPath.length > 0) {
		grid[yValsPath[0]][0] = "─";
		kindGrid[yValsPath[0]][0] = "line";
	}
	for (const x of vGuides) {
		for (let y = 0; y < h; y++) {
			if (grid[y][x] === " ") {
				grid[y][x] = "¦";
				kindGrid[y][x] = "helper";
			}
		}
	}

	const out = [];
	const curCpu = Math.round(smoothed[smoothed.length - 1]);
	const avgCpu = smoothed.reduce((a, b) => a + b, 0) / Math.max(1, smoothed.length);
	const cpuDisplay = `${curCpu}`;
	const bigTextRaw = bigTextLines(cpuDisplay);
	const bigText = bigTextRaw.map((line) => ` ${line} `);
	const bigWidth = bigText.reduce((m, line) => Math.max(m, line.length), 0);
	const bigTop = Math.max(0, Math.floor((h - bigText.length) / 2));
	const bigLeft = Math.max(0, Math.floor((w - bigWidth) / 2));
	overlayTextLinesOnGrid(grid, bigText, bigLeft, bigTop, true, kindGrid, "big");
	const percentBadge = "%";
	const percentX = Math.max(0, Math.min(w - percentBadge.length, bigLeft + bigWidth));
	const percentY = Math.min(h - 1, bigTop + bigText.length - 1);
	overlayTextLinesOnGrid(grid, [percentBadge], percentX, percentY, true, kindGrid, "big");
	const title = `CPU Usage  cur:${(raw[raw.length - 1] || 0).toFixed(1)}%  avg:${avgCpu.toFixed(1)}%`;
	const palette = {
		bg: "var(--graph2-fill-color, var(--graph2-line-color, var(--color-green)))",
		line: "var(--graph2-line-color, var(--graph2-color, var(--color-green)))",
		fill: "var(--graph2-fill-color, var(--graph2-color, var(--color-green)))",
		big: "var(--graph2-big-color, var(--graph2-color, var(--color-green)))",
		helper: "var(--graph2-helper-color, var(--graph2-line-color, var(--graph2-color, var(--color-green))))",
		window: "var(--graph2-window-color, var(--graph2-color, var(--color-green)))",
		tooltip: "var(--graph2-tooltip-color, var(--color-bright-black))",
		title: "var(--graph2-title-color, var(--graph2-tooltip-color, var(--color-bright-black)))",
	};
	out.push(colorText(`${" ".repeat(labelW)}+${"-".repeat(w)}+`, palette.window));

	for (let y = 0; y < h; y++) {
		let axisLabel = "".padEnd(labelW, " ");
		if (y === 0) axisLabel = `${Math.round(CPU_MAX)}%`.padEnd(labelW, " ");
		if (y === Math.floor(h / 2)) axisLabel = `${Math.round((CPU_MAX + CPU_MIN) / 2)}%`.padEnd(labelW, " ");
		if (y === h - 1) axisLabel = `${Math.round(CPU_MIN)}%`.padEnd(labelW, " ");
		const rowHtml = renderGridRowHtml(grid[y], kindGrid[y], palette);
		out.push(
			`${colorText(axisLabel.trimEnd().padStart(labelW, " "), palette.tooltip)}${colorText("|", palette.window)}${rowHtml}${colorText("|", palette.window)}`
		);
	}
	const currentRow = yVals[yVals.length - 1] ?? 0;
	placeRightGraphLabel(out, currentRow, formatGraphRightPercentLabel(raw[raw.length - 1] || 0), palette.tooltip, rightLabelWidth, 1);
	out.push(colorText(`${" ".repeat(labelW)}+${"-".repeat(w)}+`, palette.window));
	const now = new Date();
	const start = new Date(now.getTime() - (w - 1) * RENDER_INTERVAL_MS);
	const ts = (d) => d.toLocaleTimeString("en-US", { hour12: false });
	const t1 = ts(start);
	const t2 = ts(now);
	out.push(colorText(`${" ".repeat(labelW)}${t1}${" ".repeat(Math.max(1, w - t1.length - t2.length))}${t2}`, palette.tooltip));
	const graphStart = labelW;
	const titlePad = graphStart + Math.max(0, Math.round((w - title.length) / 2));
	out.unshift(colorText(" ".repeat(titlePad) + title, palette.title));
	element.innerHTML = out.join("\n");
}

async function pollMetrics() {
	if (metricPollBusy || !metricStore || !isGraphsPanelVisible()) return;
	metricPollBusy = true;
	try {
		await metricStore.pullMetrics();
	} finally {
		metricPollBusy = false;
	}
}

function loopMetricGraphs() {
	if (!metricStore) return;
	metricStore.step();
	drawNetworkGraph();
	drawCpuGraph();
}
