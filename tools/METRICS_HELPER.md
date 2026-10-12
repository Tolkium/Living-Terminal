# Metrics Helper

Small local HTTP helper that feeds live CPU and network data to the wallpaper's graphs.

## What it serves

- `GET http://127.0.0.1:8877/metrics`
- Falls forward through ports `8877-8896` if earlier port already used
- One sample per second

Response shape:

```json
{
  "latest": {
    "timestamp": 1712345678901,
    "netMbps": 12.345,
    "cpuPercent": 34.56
  },
  "points": [
    {
      "timestamp": 1712345678901,
      "netMbps": 12.345,
      "cpuPercent": 34.56
    }
  ],
  "intervalMs": 1000,
  "source": "metrics-helper",
  "error": null
}
```

## Run

From repo root:

```bat
node tools\metrics-helper.js
```

Or double-click:

```bat
tools\metrics-helper.cmd
```

If the window closes immediately, Node.js is most likely not installed or not in `PATH`.
The launcher:

- uses plain `node` if available
- falls back to `fnm exec ... node` if `fnm` is in `PATH`
- keeps the window open on failure and shows the error

## Notes

- On Windows, the helper streams performance counters from one long-running `typeperf`
  process, so values match Task Manager and the helper itself uses almost no CPU
- Network speed is download + upload of the physical adapters (virtual/VPN adapters are skipped)
- If `typeperf` is unavailable, it falls back to polling `Get-Counter` / plain Node.js sampling
- Only one copy runs at a time: starting it again while it runs just exits
- The wallpaper finds the helper by itself on `localhost:8877-8896`

## Autostart (recommended)

Wallpaper Engine web wallpapers run in a sandbox and cannot start programs,
so the helper has to be started by Windows instead.

- `tools\install-autostart.cmd` — adds a hidden Startup shortcut
  (`shell:startup\Living-Terminal Metrics.lnk`, no admin needed) and starts the helper now
- `tools\uninstall-autostart.cmd` — removes the shortcut and stops the running helper

The shortcut runs `metrics-helper-hidden.vbs`, which starts the helper without a console
window (uses `node`, or `fnm exec` if Node is only available through fnm).
Log: `%TEMP%\living-terminal-metrics.log`. Running it twice is safe — a second copy exits.
