// Countdown / count-up / repeating date timers.

// The initial HTML uses ansi-* colors; timers switch to timer-days-* classes once updated.
const TIMER_STATE_CLASSES = [
	"ansi-red",
	"ansi-bright-red",
	"ansi-cyan",
	"ansi-green",
	"timer-days-left",
	"timer-days-soon",
	"timer-days-today",
	"timer-days-ago",
	"timer-days-invalid",
];

function updateTimers() {
	if (userSettings.layout.hideTimePanel === true) return;

	const now = new Date();
	const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
	const msInDay = 1000 * 60 * 60 * 24;

	userSettings.timers.forEach((timer, index) => {
		if (!timer.enabled) return;

		const element = getCachedElement(`.timer${index}`);
		if (!element) return;

		const parts = timer.date.split("/").map((x) => Number(x.trim()));
		let targetDate;
		let hasYear = parts.length === 3;

		if (hasYear) {
			const [day, month, year] = parts;
			if (isNaN(day) || isNaN(month) || isNaN(year)) {
				showInvalid(element, timer.label);
				return;
			}
			targetDate = new Date(year, month - 1, day);
		} else if (parts.length === 2) {
			const [day, month] = parts;
			if (isNaN(day) || isNaN(month)) {
				showInvalid(element, timer.label);
				return;
			}
			targetDate = new Date(today.getFullYear(), month - 1, day);
			if (targetDate < today) {
				targetDate.setFullYear(targetDate.getFullYear() + 1);
			}
		} else {
			showInvalid(element, timer.label);
			return;
		}

		if (isNaN(targetDate.getTime())) {
			showInvalid(element, timer.label);
			return;
		}

		const diff = Math.round((targetDate - today) / msInDay);

		let typeText = "";
		let dayText = "";
		let daysStateClass = "";

		if (!hasYear) {
			typeText = "[COUNT_REP]";
		} else if (diff > 0) {
			typeText = "[COUNT_DOWN]";
		} else {
			typeText = "[COUNT_UP]";
		}

		if (diff > 1) {
			dayText = `${diff} DAYS LEFT`;
			daysStateClass = "timer-days-left";
		} else if (diff === 1) {
			dayText = "1 DAY LEFT";
			daysStateClass = "timer-days-soon";
		} else if (diff === 0) {
			dayText = "TODAY";
			daysStateClass = "timer-days-today";
		} else {
			dayText = `${Math.abs(diff)} DAYS AGO`;
			daysStateClass = "timer-days-ago";
		}

		element.querySelector(".type").textContent = typeText;
		element.querySelector(".label").textContent = `[${timer.label}]`;

		const daysElement = element.querySelector(".days");
		daysElement.textContent = dayText;

		daysElement.classList.remove(...TIMER_STATE_CLASSES);
		daysElement.classList.add(daysStateClass);
	});
}

function showInvalid(element, label) {
	element.querySelector(".type").textContent = "[INVALID]";
	element.querySelector(".label").textContent = `[${label}]`;
	const daysElement = element.querySelector(".days");
	daysElement.textContent = "";
	daysElement.classList.remove(...TIMER_STATE_CLASSES);
	daysElement.classList.add("timer-days-invalid");
}
