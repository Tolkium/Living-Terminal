#!/usr/bin/env node
"use strict";

/**
 * Minimal local metrics helper for Wallpaper Engine graphs.
 *
 * Exposes `GET /metrics` on localhost and returns live:
 * - `netMbps`: combined RX+TX throughput in megabits/sec
 * - `cpuPercent`: total CPU usage percent
 *
 * On Windows, streams Performance Counters from one long-running `typeperf`
 * process (cheap, and values track Task Manager). If typeperf is unavailable,
 * falls back to polling `Get-Counter` / plain Node.js sampling.
 *
 * JSON shape matches current wallpaper expectations:
 * {
 *   latest: { timestamp, netMbps, cpuPercent },
 *   points: [{ timestamp, netMbps, cpuPercent }, ...]
 * }
 */

const http = require("http");
const os = require("os");
const { execFile, spawn } = require("child_process");
const { promisify } = require("util");

const execFileAsync = promisify(execFile);

const HOST = "127.0.0.1";
const PORT_START = 8877;
const PORT_END = 8896;
const SAMPLE_INTERVAL_MS = 1000;
const HISTORY_LIMIT = 600;
const POWERSHELL_TIMEOUT_MS = 3500;
const TYPEPERF_COUNTERS = ["\\Processor(_Total)\\% Processor Time", "\\Network Interface(*)\\Bytes Total/sec"];
const TYPEPERF_STARTUP_TIMEOUT_MS = 8000;
const TYPEPERF_RESTART_DELAY_MS = 2000;
// Virtual/tunnel adapters double-count traffic that already passes a physical adapter.
const IGNORED_ADAPTERS = /loopback|isatap|teredo|pseudo|miniport|virtual|vmware|hyper-v|vethernet|bluetooth|npcap|wireguard|tailscale|zerotier/i;

let previousCpuSnapshot = takeCpuSnapshot();
let previousNetSnapshot = null;
let latestPoint = null;
let sampleInFlight = false;
let sampleError = null;
let pollingTimer = null;
let typeperfProcess = null;
const history = [];

function clamp(value, min, max) {
	return Math.max(min, Math.min(max, value));
}

function takeCpuSnapshot() {
	const totals = os.cpus().reduce(
		(acc, cpu) => {
			const times = cpu.times;
			acc.idle += times.idle;
			acc.total += times.user + times.nice + times.sys + times.idle + times.irq;
			return acc;
		},
		{ idle: 0, total: 0 }
	);
	return { idle: totals.idle, total: totals.total };
}

function getCpuPercent(previous, current) {
	const idleDelta = current.idle - previous.idle;
	const totalDelta = current.total - previous.total;
	if (totalDelta <= 0) return 0;
	return clamp(((totalDelta - idleDelta) / totalDelta) * 100, 0, 100);
}

async function runPowerShellJson(script) {
	const { stdout } = await execFileAsync(
		"powershell.exe",
		["-NoProfile", "-ExecutionPolicy", "Bypass", "-Command", script],
		{
			windowsHide: true,
			timeout: POWERSHELL_TIMEOUT_MS,
			maxBuffer: 256 * 1024,
		}
	);
	return JSON.parse(String(stdout).trim() || "null");
}

async function readWindowsPerfMetrics() {
	const script = [
		"$cpuPaths = @('\\Processor(_Total)\\% Processor Time', '\\Processor Information(_Total)\\% Processor Time', '\\Processor Information(_Total)\\% Processor Utility')",
		"$cpuValue = $null",
		"foreach ($path in $cpuPaths) {",
		"  try {",
		"    $sample = Get-Counter -Counter $path -ErrorAction Stop | Select-Object -ExpandProperty CounterSamples | Select-Object -First 1",
		"    if ($sample -and $sample.CookedValue -ne $null) { $cpuValue = [double]$sample.CookedValue; break }",
		"  } catch {}",
		"}",
		"$netSamples = @()",
		"try { $netSamples = Get-Counter -Counter '\\Network Interface(*)\\Bytes Total/sec' -ErrorAction Stop | Select-Object -ExpandProperty CounterSamples } catch {}",
		`$ignored = '${IGNORED_ADAPTERS.source}'`,
		"$filtered = @($netSamples | Where-Object { $_.InstanceName -and ($_.InstanceName -notmatch $ignored) })",
		"if (-not $filtered -or $filtered.Count -eq 0) { $filtered = @($netSamples) }",
		"$bytesPerSecond = 0.0",
		"if ($filtered) { $bytesPerSecond = [double](($filtered | Measure-Object -Property CookedValue -Sum).Sum) }",
		"[PSCustomObject]@{ cpuPercent = $cpuValue; netMbps = ($bytesPerSecond * 8 / 1000000.0) } | ConvertTo-Json -Compress",
	].join("; ");

	const data = await runPowerShellJson(script);
	return {
		cpuPercent: clamp(Number(data?.cpuPercent) || 0, 0, 100),
		netMbps: Math.max(0, Number(data?.netMbps) || 0),
	};
}

async function readWindowsNetworkBytes() {
	const command = [
		"-NoProfile",
		"-ExecutionPolicy",
		"Bypass",
		"-Command",
		[
			"$adapters = Get-NetAdapter -Physical -ErrorAction SilentlyContinue | Where-Object { $_.Status -eq 'Up' }",
			"if (-not $adapters) { $adapters = Get-NetAdapter -ErrorAction SilentlyContinue | Where-Object { $_.Status -eq 'Up' } }",
			"$stats = foreach ($adapter in $adapters) { Get-NetAdapterStatistics -Name $adapter.Name -ErrorAction SilentlyContinue }",
			"if (-not $stats) { [Console]::Out.WriteLine('0'); exit 0 }",
			"$rx = ($stats | Measure-Object -Property ReceivedBytes -Sum).Sum",
			"$tx = ($stats | Measure-Object -Property SentBytes -Sum).Sum",
			"[Console]::Out.WriteLine([string]([int64]($rx + $tx)))",
		].join("; "),
	];

	const { stdout } = await execFileAsync("powershell.exe", command, {
		windowsHide: true,
		timeout: POWERSHELL_TIMEOUT_MS,
		maxBuffer: 64 * 1024,
	});
	const value = Number.parseInt(String(stdout).trim(), 10);
	return Number.isFinite(value) ? value : 0;
}

async function readNetworkBytes() {
	if (process.platform !== "win32") return 0;
	return readWindowsNetworkBytes();
}

async function sampleMetrics() {
	if (sampleInFlight) return;
	sampleInFlight = true;

	try {
		const now = Date.now();
		let cpuPercent = latestPoint ? latestPoint.cpuPercent : 0;
		let netMbps = latestPoint ? latestPoint.netMbps : 0;

		if (process.platform === "win32") {
			try {
				const perfMetrics = await readWindowsPerfMetrics();
				cpuPercent = perfMetrics.cpuPercent;
				netMbps = perfMetrics.netMbps;
			} catch (perfError) {
				const currentCpuSnapshot = takeCpuSnapshot();
				cpuPercent = getCpuPercent(previousCpuSnapshot, currentCpuSnapshot);
				previousCpuSnapshot = currentCpuSnapshot;

				const totalNetworkBytes = await readNetworkBytes();
				if (previousNetSnapshot && now > previousNetSnapshot.timestamp) {
					const deltaBytes = Math.max(0, totalNetworkBytes - previousNetSnapshot.totalBytes);
					const deltaSeconds = (now - previousNetSnapshot.timestamp) / 1000;
					netMbps = deltaSeconds > 0 ? (deltaBytes * 8) / deltaSeconds / 1_000_000 : 0;
				}

				previousNetSnapshot = {
					timestamp: now,
					totalBytes: totalNetworkBytes,
				};
				if (!sampleError) {
					console.warn(`[metrics-helper] perf counters unavailable, using fallback: ${perfError.message || perfError}`);
				}
			}
		} else {
			const currentCpuSnapshot = takeCpuSnapshot();
			cpuPercent = getCpuPercent(previousCpuSnapshot, currentCpuSnapshot);
			previousCpuSnapshot = currentCpuSnapshot;
		}

		recordPoint(cpuPercent, netMbps, now);
	} catch (error) {
		sampleError = error && error.message ? error.message : String(error);
		console.warn(`[metrics-helper] sample failed: ${sampleError}`);
	} finally {
		sampleInFlight = false;
	}
}

function recordPoint(cpuPercent, netMbps, timestamp = Date.now()) {
	latestPoint = {
		timestamp,
		netMbps: Number(Math.max(0, netMbps).toFixed(3)),
		cpuPercent: Number(clamp(cpuPercent, 0, 100).toFixed(2)),
	};

	history.push(latestPoint);
	if (history.length > HISTORY_LIMIT) history.splice(0, history.length - HISTORY_LIMIT);
	if (sampleError) console.log(`[metrics-helper] recovered: ${sampleError}`);
	sampleError = null;
}

function startPolling() {
	if (pollingTimer) return;
	sampleMetrics();
	pollingTimer = setInterval(sampleMetrics, SAMPLE_INTERVAL_MS);
}

function parseCsvLine(line) {
	return line.replace(/^"|"$/g, "").split('","');
}

// Column indexes of the network adapters to sum, from typeperf's CSV header.
function pickNetworkColumns(header) {
	const instanceOf = (name) => (name.match(/\\Network Interface\((.*)\)\\/i) || [])[1] || "";
	const adapters = header.map((name, index) => ({ name, index })).filter(({ name }) => instanceOf(name));
	const physical = adapters.filter(({ name }) => !IGNORED_ADAPTERS.test(instanceOf(name)));
	return (physical.length > 0 ? physical : adapters).map(({ index }) => index);
}

// Streams one sample per second from a long-running typeperf process. Resolves true once the first
// sample arrives, false if typeperf is unavailable (then the caller falls back to polling).
function startTypeperf() {
	return new Promise((resolve) => {
		let settled = false;
		let netColumns = null;
		let buffer = "";
		const settle = (ok) => {
			if (settled) return;
			settled = true;
			clearTimeout(startupTimer);
			resolve(ok);
		};

		const child = spawn("typeperf", [...TYPEPERF_COUNTERS, "-si", "1"], { windowsHide: true });
		typeperfProcess = child;
		const startupTimer = setTimeout(() => {
			settle(false);
			child.kill();
		}, TYPEPERF_STARTUP_TIMEOUT_MS);

		child.stdout.setEncoding("utf8");
		child.stdout.on("data", (chunk) => {
			buffer += chunk;
			let newline;
			while ((newline = buffer.indexOf("\n")) >= 0) {
				const line = buffer.slice(0, newline).trim();
				buffer = buffer.slice(newline + 1);
				if (!line.startsWith('"')) continue;

				const columns = parseCsvLine(line);
				if (!netColumns) {
					netColumns = pickNetworkColumns(columns);
					continue;
				}
				const cpuPercent = Number(columns[1]);
				if (!Number.isFinite(cpuPercent)) continue;
				const bytesPerSecond = netColumns.reduce((sum, index) => sum + (Number(columns[index]) || 0), 0);
				recordPoint(cpuPercent, (bytesPerSecond * 8) / 1_000_000);
				settle(true);
			}
		});

		child.on("error", () => settle(false));
		child.on("exit", (code) => {
			if (typeperfProcess === child) typeperfProcess = null;
			if (!settled) {
				settle(false);
				return;
			}
			console.warn(`[metrics-helper] typeperf exited (code ${code}), restarting`);
			setTimeout(() => {
				startTypeperf().then((ok) => {
					if (!ok) startPolling();
				});
			}, TYPEPERF_RESTART_DELAY_MS).unref();
		});
	});
}

function sendJson(response, statusCode, payload) {
	response.writeHead(statusCode, {
		"Content-Type": "application/json; charset=utf-8",
		"Cache-Control": "no-store",
		"Access-Control-Allow-Origin": "*",
	});
	response.end(JSON.stringify(payload));
}

function createServer() {
	return http.createServer((request, response) => {
		const url = new URL(request.url || "/", `http://${request.headers.host || `${HOST}:${PORT_START}`}`);

		if (url.pathname === "/metrics") {
			const since = Number.parseInt(url.searchParams.get("since") || "0", 10);
			const points = Number.isFinite(since) && since > 0 ? history.filter((point) => point.timestamp > since) : history.slice(-8);
			return sendJson(response, 200, {
				latest: latestPoint,
				points,
				intervalMs: SAMPLE_INTERVAL_MS,
				source: "metrics-helper",
				error: sampleError,
			});
		}

		if (url.pathname === "/" || url.pathname === "/health") {
			return sendJson(response, 200, {
				ok: true,
				portRange: [PORT_START, PORT_END],
				latest: latestPoint,
				error: sampleError,
			});
		}

		return sendJson(response, 404, { ok: false, error: "not_found" });
	});
}

function listenOnAvailablePort(server, port = PORT_START) {
	return new Promise((resolve, reject) => {
		const tryPort = (candidate) => {
			if (candidate > PORT_END) {
				reject(new Error(`No free port in ${PORT_START}-${PORT_END}`));
				return;
			}

			server.once("error", function onError(error) {
				server.removeListener("listening", onListening);
				if (error && error.code === "EADDRINUSE") {
					tryPort(candidate + 1);
					return;
				}
				reject(error);
			});

			function onListening() {
				server.removeAllListeners("error");
				resolve(candidate);
			}

			server.once("listening", onListening);
			server.listen(candidate, HOST);
		};

		tryPort(port);
	});
}

function probeExistingHelper(port) {
	return new Promise((resolve) => {
		const request = http.get({ host: HOST, port, path: "/health", timeout: 300 }, (response) => {
			let body = "";
			response.on("data", (chunk) => (body += chunk));
			response.on("end", () => {
				try {
					resolve(Array.isArray(JSON.parse(body).portRange));
				} catch {
					resolve(false);
				}
			});
		});
		request.on("timeout", () => request.destroy());
		request.on("error", () => resolve(false));
	});
}

async function findRunningHelperPort() {
	for (let port = PORT_START; port <= PORT_END; port++) {
		if (await probeExistingHelper(port)) return port;
	}
	return null;
}

async function main() {
	const runningPort = await findRunningHelperPort();
	if (runningPort) {
		console.log(`[metrics-helper] already running on http://${HOST}:${runningPort}/metrics, exiting`);
		return;
	}

	const server = createServer();
	const port = await listenOnAvailablePort(server);
	console.log(`[metrics-helper] serving http://${HOST}:${port}/metrics`);

	if (process.platform === "win32" && (await startTypeperf())) {
		console.log("[metrics-helper] streaming performance counters via typeperf (1s)");
	} else {
		console.warn(`[metrics-helper] typeperf unavailable, polling every ${SAMPLE_INTERVAL_MS}ms instead`);
		startPolling();
	}

	const shutdown = () => {
		console.log("[metrics-helper] shutting down");
		if (typeperfProcess) typeperfProcess.kill();
		server.close(() => process.exit(0));
		setTimeout(() => process.exit(0), 300).unref();
	};

	process.on("SIGINT", shutdown);
	process.on("SIGTERM", shutdown);
	process.on("SIGHUP", shutdown);
}

main().catch((error) => {
	console.error(`[metrics-helper] fatal: ${error && error.stack ? error.stack : error}`);
	process.exit(1);
});
