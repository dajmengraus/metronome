// =====================
// UI ELEMENTS
// =====================

const btnToggleMetronome = document.getElementById("btn-toggle-metronome");

const slider = document.getElementById("slider");
const btnDecreaseBpm = document.getElementById("decrease-bpm");
const btnIncreaseBpm = document.getElementById("increase-bpm");
const btnDecreaseFiveBpm = document.getElementById("decrease-five-bpm");
const btnIncreaseFiveBpm = document.getElementById("increase-five-bpm");
const btnDecreaseNumerator = document.getElementById("decrease-numerator");
const btnIncreaseNumerator = document.getElementById("increase-numerator");
const btnDecreaseDenominator = document.getElementById("decrease-denominator");
const btnIncreaseDenominator = document.getElementById("increase-denominator");

const bpmText = document.getElementById("bpm");
const tempoText = document.querySelector(".tempo");
const numeratorText = document.getElementById("numerator");
const denominatorText = document.getElementById("denominator");
const soundDropdown = document.getElementById("sound-dropdown");
const beats = document.getElementById("beats");


// =====================
// AUDIO ENGINE
// =====================

const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

let beatBuffer = null;
let accentBuffer = null;


// =====================
// METRONOME STATE
// =====================

let bpm = 100;
let numerator = numeratorText.innerText;
let denominator = denominatorText.innerText;

let currentBeat = 0;
let nextNoteTime = 0;

let schedulerID = null;


// =====================
// SCHEDULER SETTINGS
// =====================

const lookahead = 25;      // ms
const scheduleAhead = 0.1; // sec


// =====================
// AUDIO LOADING
// =====================

const soundMap = {
    "beat-1": {
        beat: "audio/beat.mp3",
        accent: "audio/beat-accent.mp3"
    },
    "beat-2": {
        beat: "audio/beat-2.mp3",
        accent: "audio/beat-accent-2.mp3"
    }
}

async function loadSound(url) {
    const res = await fetch(url);
    const buffer = await res.arrayBuffer();
    return await audioCtx.decodeAudioData(buffer);
}

async function loadSelectedSound(key) {
    const config = soundMap[key];
    beatBuffer = await loadSound(config.beat);
    accentBuffer = await loadSound(config.accent);
}

loadSelectedSound("beat-1");


// =====================
// AUDIO PLAYBACK
// =====================

function playSound(buffer, time) {
    const source = audioCtx.createBufferSource();
    source.buffer = buffer;
    source.connect(audioCtx.destination);
    source.start(time);
}


// =====================
// TIMING
// =====================

let timing = 60

function getBeatLength() {
    return timing / bpm;
}


// =====================
// UI
// =====================

function clearBeats() {
    for (const el of beats.children) {
        el.classList.remove("beat--hit");
        el.classList.remove("beat--hit-accent");
    }
}

function updateUI(beat, time) {

    const delay = (time - audioCtx.currentTime) * 1000;

    setTimeout(() => {

        clearBeats();
        if (beat === 0) {
            beats.children[beat].classList.add("beat--hit-accent");
            return;
        }
        beats.children[beat].classList.add("beat--hit");

    }, delay);
}


// =====================
// SCHEDULER
// =====================

function scheduler() {

    while (nextNoteTime < audioCtx.currentTime + scheduleAhead) {

        // Play sound
        if (currentBeat === 0) {
            playSound(accentBuffer, nextNoteTime);
        } else {
            playSound(beatBuffer, nextNoteTime);
        }

        // Sync UI
        updateUI(currentBeat, nextNoteTime);

        // Next beat
        nextNoteTime += getBeatLength();
        currentBeat = (currentBeat + 1) % numerator;
    }
}


// =====================
// CONTROL
// =====================

function start() {

    if (schedulerID) return;

    if (audioCtx.state === "suspended") {
        audioCtx.resume();
    }

    currentBeat = 0;
    nextNoteTime = audioCtx.currentTime + 0.05;

    schedulerID = setInterval(scheduler, lookahead);
    updateToggleButtonUI(true);
}


function stop() {

    clearInterval(schedulerID);
    schedulerID = null;

    clearBeats();

    currentBeat = 0;
    updateToggleButtonUI(false);
}

function updateToggleButtonUI(isRunning) {
    btnToggleMetronome.innerText = isRunning ? "Stop" : "Start";
    btnToggleMetronome.setAttribute("aria-pressed", String(isRunning));
    btnToggleMetronome.classList.toggle("is-running", isRunning);
}

function toggleMetronome() {
    if (schedulerID) {
        stop();
        return;
    }
    start();
}

updateToggleButtonUI(false);


// =====================
// BPM CONTROL
// =====================

const tempoRanges = [
    { name: "Grave", min: 20, max: 40 },
    { name: "Largo", min: 40, max: 60 },
    { name: "Lento", min: 45, max: 60 },
    { name: "Adagio", min: 66, max: 76 },
    { name: "Andante", min: 76, max: 108 },
    { name: "Moderato", min: 108, max: 120 },
    { name: "Allegretto", min: 112, max: 120 },
    { name: "Allegro", min: 120, max: 156 },
    { name: "Vivace", min: 156, max: 176 },
    { name: "Presto", min: 168, max: 200 },
    { name: "Prestissimo", min: 200, max: 300 }
];

function getTempoName(value) {
    const bpmValue = Number(value);
    const matchingRanges = tempoRanges.filter((range) => bpmValue >= range.min && bpmValue <= range.max);

    if (matchingRanges.length === 0) {
        return bpmValue < tempoRanges[0].min ? tempoRanges[0].name : tempoRanges[tempoRanges.length - 1].name;
    }

    // When ranges overlap, prefer the most specific range.
    matchingRanges.sort((a, b) => (a.max - a.min) - (b.max - b.min));
    return matchingRanges[0].name;
}

function updateBpm(value) {
    bpm = Math.max(1, value);
    bpmText.innerText = bpm;
    tempoText.innerText = getTempoName(bpm);
}

function increaseBpm(val) {
    updateBpm(bpm + val);
}

function decreaseBpm(val) {
    updateBpm(bpm - val);
}

updateBpm(bpm);


// ==========================
// TIME SIGNATURE CONTROL
// ==========================

function increaseNumerator() {
    numerator++;
    numeratorText.innerText = numerator;
    const beatDiv = document.createElement("div");
    beatDiv.classList.add("beat");
    beats.appendChild(beatDiv);
}

function decreaseNumerator() {
    if (numerator == 1) return;
    numerator--;
    numeratorText.innerText = numerator;
    beats.children[beats.children.length - 1].remove();
}

function increaseDenominator() {
    timing /= 2;
    denominator *= 2;
    denominatorText.innerText = denominator;
}

function decreaseDenominator() {
    if (denominator > 1) {
        timing *= 2;
    }
    denominator = Math.max(1, denominator / 2);
    denominatorText.innerText = denominator;
}


// =====================
// EVENTS
// =====================

btnToggleMetronome.addEventListener("click", toggleMetronome);

slider.oninput = function() {
    updateBpm(this.value);
}

btnDecreaseBpm.addEventListener("click", () => decreaseBpm(1));
btnIncreaseBpm.addEventListener("click", () => increaseBpm(1));

btnDecreaseFiveBpm.addEventListener("click", () => decreaseBpm(5));
btnIncreaseFiveBpm.addEventListener("click", () => increaseBpm(5));

btnDecreaseNumerator.addEventListener("click", decreaseNumerator);
btnIncreaseNumerator.addEventListener("click", increaseNumerator);


btnDecreaseDenominator.addEventListener("click", decreaseDenominator);
btnIncreaseDenominator.addEventListener("click", increaseDenominator);

soundDropdown.addEventListener("change", async (e) => {
    const selected = e.target.value;

    await loadSelectedSound(selected);

    if (schedulerID) {
        stop();
        start();
    }
});
