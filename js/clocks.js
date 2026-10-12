// Date/time line and the five time-zone clocks with day-progress bars.

function updateDate() {
	const now = new Date();

	const pad = (n) => n.toString().padStart(2, "0");

	const month = pad(now.getMonth() + 1);
	const day = pad(now.getDate());
	const year = now.getFullYear();

	const hours24 = now.getHours();
	const minutes = pad(now.getMinutes());
	const seconds = pad(now.getSeconds());

	const dateFormat = userSettings.dateformat;
	const timeFormat = userSettings.timeFormat;

	let dateText;

	if (dateFormat === "ddmmyyyy") {
		dateText = `${day}/${month}/${year}`;
	} else if (dateFormat === "mmddyyyy") {
		dateText = `${month}/${day}/${year}`;
	} else if (dateFormat === "yyyymmdd") {
		dateText = `${year}/${month}/${day}`;
	}

	let timeText;

	if (timeFormat === 12) {
		const period = hours24 >= 12 ? "PM" : "AM";
		const hours12 = pad(hours24 % 12 || 12);
		timeText = `${hours12}:${minutes}:${seconds} ${period}`;
	} else {
		timeText = `${pad(hours24)}:${minutes}:${seconds}`;
	}

	const dateElement = getCachedElement(".dateDisplay");
	const timeElement = getCachedElement(".timeDisplay");
	if (dateElement) dateElement.textContent = dateText;
	if (timeElement) timeElement.textContent = timeText;
}

const zoneFormatters = new Map();

function getZoneFormatter(zone) {
	if (!zoneFormatters.has(zone)) {
		let formatter = null;
		try {
			formatter = new Intl.DateTimeFormat("en-US", {
				timeZone: zone,
				hourCycle: "h23",
				year: "numeric",
				month: "numeric",
				day: "numeric",
				hour: "numeric",
				minute: "numeric",
				second: "numeric",
			});
		} catch (e) {
			// invalid zone name
		}
		zoneFormatters.set(zone, formatter);
	}
	return zoneFormatters.get(zone);
}

function getLocalClockParts(now) {
	return {
		year: now.getFullYear(),
		month: now.getMonth(),
		day: now.getDate(),
		hours: now.getHours(),
		minutes: now.getMinutes(),
		seconds: now.getSeconds(),
	};
}

// Wall-clock time for a clock slot. `timezone` is either an hour offset from UTC ("-7", "5.5")
// or an IANA zone name ("America/Los_Angeles", follows daylight saving time). Returns null if invalid.
function getClockParts(now, timezone) {
	const raw = String(timezone ?? "").trim();
	const offsetHours = Number(raw);
	if (Number.isFinite(offsetHours)) {
		const shifted = new Date(now.getTime() + offsetHours * 3600000);
		return {
			year: shifted.getUTCFullYear(),
			month: shifted.getUTCMonth(),
			day: shifted.getUTCDate(),
			hours: shifted.getUTCHours(),
			minutes: shifted.getUTCMinutes(),
			seconds: shifted.getUTCSeconds(),
		};
	}

	const formatter = getZoneFormatter(raw);
	if (!formatter) return null;
	const parts = {};
	for (const part of formatter.formatToParts(now)) parts[part.type] = part.value;
	return {
		year: Number(parts.year),
		month: Number(parts.month) - 1,
		day: Number(parts.day),
		hours: Number(parts.hour) % 24,
		minutes: Number(parts.minute),
		seconds: Number(parts.second),
	};
}

function showInvalidClock(element) {
	const dayElement = element.querySelector(".day");
	dayElement.textContent = "[INVALID TZ]";
	dayElement.classList.remove("time-day-today", "time-day-yesterday", "time-day-tomorrow");
	element.querySelector(".time24").textContent = "--:--:--";
	element.querySelector(".time12").textContent = "--:--:-- --";
	element.querySelector(".morning").textContent = "";
	element.querySelector(".noon").textContent = "";
	element.querySelector(".night").textContent = "";
	element.querySelector(".percentage").textContent = "";
}

function updateClocks() {
	if (userSettings.layout.hideTimePanel === true) return;
	const times = ["time0", "time1", "time2", "time3", "time4"];
	const now = new Date();

	times.forEach((time, id) => {
		const element = getCachedElement(`.${time}`);
		if (userSettings.times[id].enabled === false || !element) return;

		const local = getLocalClockParts(now);
		const clock = id === 0 ? local : getClockParts(now, userSettings.times[id].timezone);
		element.querySelector(".label").textContent = `[${userSettings.times[id].label}]`;
		if (!clock) {
			showInvalidClock(element);
			return;
		}

		const h = String(clock.hours).padStart(2, "0");
		const m = String(clock.minutes).padStart(2, "0");
		const s = String(clock.seconds).padStart(2, "0");

		const hour12 = String(clock.hours % 12 || 12).padStart(2, "0");
		const ampm = clock.hours >= 12 ? "PM" : "AM";

		const time24 = `${h}:${m}:${s}`;
		const time12 = `${hour12}:${m}:${s} ${ampm}`;

		const dayDiff = Math.round(
			(Date.UTC(clock.year, clock.month, clock.day) - Date.UTC(local.year, local.month, local.day)) / 86400000
		);
		let day = "TODAY";
		let dayClass = "time-day-today";
		if (dayDiff < 0) {
			day = "YESTERDAY";
			dayClass = "time-day-yesterday";
		} else if (dayDiff > 0) {
			day = "TOMORROW";
			dayClass = "time-day-tomorrow";
		}

		// Time progress and bar allocation
		const totalSeconds = 86400;
		const secondsPassed = clock.hours * 3600 + clock.minutes * 60 + clock.seconds;
		const progress = secondsPassed / totalSeconds;
		const percentage = Math.floor(progress * 100);

		const totalBars = 24;

		const morningRatio = 5 / 24;
		const noonRatio = 14 / 24;
		const nightRatio = 5 / 24;

		const rawMorning = totalBars * morningRatio;
		const rawNoon = totalBars * noonRatio;
		const rawNight = totalBars * nightRatio;

		let morningBarsMax = Math.floor(rawMorning);
		let noonBarsMax = Math.floor(rawNoon);
		let nightBarsMax = Math.floor(rawNight);

		let allocated = morningBarsMax + noonBarsMax + nightBarsMax;
		let remaining = totalBars - allocated;

		const remainders = [
			{ segment: "morning", remainder: rawMorning - morningBarsMax },
			{ segment: "noon", remainder: rawNoon - noonBarsMax },
			{ segment: "night", remainder: rawNight - nightBarsMax },
		];

		remainders.sort((a, b) => b.remainder - a.remainder);

		for (let i = 0; i < remaining; i++) {
			if (remainders[i % 3].segment === "morning") morningBarsMax++;
			else if (remainders[i % 3].segment === "noon") noonBarsMax++;
			else nightBarsMax++;
		}

		const filledBars = Math.floor(progress * totalBars);
		const morningBars = Math.min(filledBars, morningBarsMax);
		const noonBars = Math.min(Math.max(filledBars - morningBarsMax, 0), noonBarsMax);
		const nightBars = Math.min(Math.max(filledBars - morningBarsMax - noonBarsMax, 0), nightBarsMax);

		const dayElement = element.querySelector(".day");
		dayElement.textContent = day;
		dayElement.classList.remove("time-day-today", "time-day-yesterday", "time-day-tomorrow");
		dayElement.classList.add(dayClass);
		element.querySelector(".time24").textContent = time24;
		element.querySelector(".time12").textContent = time12;

		element.querySelector(".morning").textContent = "|".repeat(morningBars);
		element.querySelector(".noon").textContent = "|".repeat(noonBars);
		element.querySelector(".night").textContent = "|".repeat(nightBars);
		element.querySelector(".percentage").textContent = `${percentage}%`;
	});
}
