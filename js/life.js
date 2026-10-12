// Conway's Game of Life, shown in the ASCII panel while no music is playing.

let gameOfLifeInterval = null;

// Game of Life: flat double-buffered grids; `counts` always holds neighbor counts of `cells`.
const life = {
	width: 0,
	height: 0,
	cells: null,
	next: null,
	counts: null,
	prevHash: 0,
	prevPrevHash: 0,
	layout: null, // measured { width, height } of the frame
	layoutStable: false, // false = re-measure on the next frame
	framesSinceMeasure: 0,
};

const LIFE_REMEASURE_FRAMES = 11; // ~2 s at 180 ms per frame

function countLifeNeighbors() {
	const { width, height, cells, counts } = life;
	counts.fill(0);
	for (let y = 0; y < height; y++) {
		const up = ((y - 1 + height) % height) * width;
		const row = y * width;
		const down = ((y + 1) % height) * width;
		for (let x = 0; x < width; x++) {
			if (!cells[row + x]) continue;
			const left = (x - 1 + width) % width;
			const right = (x + 1) % width;
			counts[up + left]++;
			counts[up + x]++;
			counts[up + right]++;
			counts[row + left]++;
			counts[row + right]++;
			counts[down + left]++;
			counts[down + x]++;
			counts[down + right]++;
		}
	}
}

function seedLife(width, height) {
	const size = width * height;
	life.width = width;
	life.height = height;
	life.cells = new Uint8Array(size);
	life.next = new Uint8Array(size);
	life.counts = new Uint8Array(size);
	for (let i = 0; i < size; i++) life.cells[i] = Math.random() > 0.88 ? 1 : 0;
	life.prevHash = 0;
	life.prevPrevHash = 0;
	countLifeNeighbors();
}

function stepLife() {
	const { cells, next, counts } = life;
	for (let i = 0; i < cells.length; i++) {
		const n = counts[i];
		next[i] = n === 3 || (n === 2 && cells[i]) ? 1 : 0;
	}
	life.cells = next;
	life.next = cells;
	countLifeNeighbors();
}

function hashLife() {
	let hash = 2166136261;
	const cells = life.cells;
	for (let i = 0; i < cells.length; i++) hash = Math.imul(hash ^ cells[i] ^ (i & 0xff), 16777619);
	return hash >>> 0;
}

// Wakes up a stuck (static or blinking) board by seeding cells in quiet, dead areas.
function reviveQuietLifeCells(count) {
	const { cells, counts } = life;
	let candidates = [];
	for (let i = 0; i < cells.length; i++) if (!cells[i] && counts[i] <= 1) candidates.push(i);
	if (candidates.length === 0) for (let i = 0; i < cells.length; i++) if (!cells[i]) candidates.push(i);

	for (let i = 0; i < count && candidates.length > 0; i++) {
		const idx = Math.floor(Math.random() * candidates.length);
		cells[candidates[idx]] = 1;
		candidates.splice(idx, 1);
	}
	countLifeNeighbors();
}

function buildGameOfLifeAsciiFrame() {
	const { width, height, cells, counts } = life;
	const border = `<span class="life-frame">+${"-".repeat(width)}+</span>`;
	const lines = [border];

	for (let y = 0; y < height; y++) {
		let row = "";
		for (let i = y * width, end = i + width; i < end; i++) {
			if (!cells[i]) row += " ";
			else if (counts[i] <= 2) row += ".";
			else if (counts[i] <= 4) row += "o";
			else row += "#";
		}
		lines.push(`<span class="life-frame">|</span><span class="life-cell">${row}</span><span class="life-frame">|</span>`);
	}

	lines.push(border);
	lines.push(`<span class="life-cell"> Conway's Game of Life </span>`);
	return lines.join("\n");
}

// Measuring the frame forces a layout. The measured size depends on the frame's current size, so after an
// invalidation (start, resize, font/resolution/layout change) it is repeated until it stops changing.
// Other panels can also change size without an invalidation, so it is re-checked every LIFE_REMEASURE_FRAMES.
function measureGameOfLifeLayout() {
	setAsciiFontScale();
	setAsciiLifeAspectMode(true);
	invalidateAsciiViewportLock();
	const dimensions = getAsciiLifeDimensions();
	setAsciiRenderDimensions(dimensions);
	applyAsciiViewportLock();
	life.layout = dimensions;
}

function renderGameOfLifeFrame() {
	life.framesSinceMeasure += 1;
	if (!life.layoutStable || life.framesSinceMeasure >= LIFE_REMEASURE_FRAMES) {
		life.framesSinceMeasure = 0;
		const previous = life.layout;
		measureGameOfLifeLayout();
		life.layoutStable = Boolean(previous) && previous.width === life.layout.width && previous.height === life.layout.height;
	}
	const { width, height } = life.layout;
	if (!life.cells || life.width !== width || life.height !== height) seedLife(width, height);

	stepLife();
	let hash = hashLife();
	if (hash === life.prevHash || hash === life.prevPrevHash) {
		reviveQuietLifeCells(Math.random() < 0.5 ? 1 : 2);
		hash = hashLife();
	}
	life.prevPrevHash = life.prevHash;
	life.prevHash = hash;

	getAsciiPreElement().innerHTML = buildGameOfLifeAsciiFrame();
}

function startGameOfLifeIfNeeded() {
	if (!isMediaPlaying) startGameOfLife();
}

// Also used while music plays when there is no album art or logo to show.
function startGameOfLife() {
	if (gameOfLifeInterval) return;
	life.layout = null;
	life.layoutStable = false;
	renderGameOfLifeFrame();
	gameOfLifeInterval = setInterval(renderGameOfLifeFrame, 180);
}

function stopGameOfLife() {
	if (!gameOfLifeInterval) return;
	clearInterval(gameOfLifeInterval);
	gameOfLifeInterval = null;
}
