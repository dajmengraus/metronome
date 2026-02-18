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
const bpmCircle = document.getElementById("bpm-circle");
const tempoText = document.querySelector(".tempo");
const numeratorText = document.getElementById("numerator");
const denominatorText = document.getElementById("denominator");
const soundDropdown = document.getElementById("sound-dropdown");
const beats = document.getElementById("beats");
const tap = document.getElementById("tap");


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
let tapTimes = [];
let tapResetTimeoutID = null;


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
    if (!bpmCircle) return;
    bpmCircle.classList.remove("bpm-circle--highlight--accent");
    bpmCircle.classList.remove("bpm-circle--highlight");
    bpmCircle.classList.remove("bpm-circle--pulse");
    bpmCircle.classList.remove("bpm-circle--pulse-accent");
}

function updateUI(beat, time) {

    const delay = (time - audioCtx.currentTime) * 1000;

    setTimeout(() => {

        clearBeats();
        if (beat === 0) {
            beats.children[beat].classList.add("beat--hit-accent");
            if (bpmCircle) {
                bpmCircle.classList.add("bpm-circle--highlight--accent");
                pulseBpmCircle(true);
            }
            return;
        }
        beats.children[beat].classList.add("beat--hit");
        if (bpmCircle) {
            bpmCircle.classList.add("bpm-circle--highlight");
            pulseBpmCircle(false);
        }

    }, delay);
}


// =====================
// BPM CIRCLE
// =====================

function pulseBpmCircle(isAccent) {
    if (!bpmCircle) return;

    bpmCircle.classList.remove("bpm-circle--pulse");
    bpmCircle.classList.remove("bpm-circle--pulse-accent");
    void bpmCircle.offsetWidth;
    bpmCircle.classList.add(isAccent ? "bpm-circle--pulse-accent" : "bpm-circle--pulse");
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
    const minBpm = Number(slider.min) || 1;
    const maxBpm = Number(slider.max) || 300;
    const parsed = Number(value);
    if (Number.isNaN(parsed)) return;

    bpm = Math.min(maxBpm, Math.max(minBpm, Math.round(parsed)));
    bpmText.innerText = bpm;
    tempoText.innerText = getTempoName(bpm);
    slider.value = String(bpm);
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
// TAP TEMPO
// =====================

const tapTempoWindowSize = 5;
const tapTempoResetMs = 2000;
const tapMinIntervalMs = 200;  // 300 BPM
const tapMaxIntervalMs = 2000; // 30 BPM

function resetTapTempo() {
    tapTimes = [];
    clearTimeout(tapResetTimeoutID);
    tapResetTimeoutID = null;
}

function handleTapTempo() {
    const now = performance.now();
    const previousTap = tapTimes[tapTimes.length - 1];

    if (previousTap) {
        const interval = now - previousTap;
        if (interval < tapMinIntervalMs || interval > tapMaxIntervalMs) {
            tapTimes = [now];
        } else {
            tapTimes.push(now);
        }
    } else {
        tapTimes.push(now);
    }

    if (tapTimes.length > tapTempoWindowSize) {
        tapTimes.shift();
    }

    if (tapTimes.length >= 2) {
        let totalInterval = 0;

        for (let i = 1; i < tapTimes.length; i++) {
            totalInterval += tapTimes[i] - tapTimes[i - 1];
        }

        const averageInterval = totalInterval / (tapTimes.length - 1);
        const tappedBpm = 60000 / averageInterval;
        updateBpm(tappedBpm);
    }

    clearTimeout(tapResetTimeoutID);
    tapResetTimeoutID = setTimeout(resetTapTempo, tapTempoResetMs);
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
tap.addEventListener("click", handleTapTempo);

soundDropdown.addEventListener("change", async (e) => {
    const selected = e.target.value;

    await loadSelectedSound(selected);

    if (schedulerID) {
        stop();
        start();
    }
});
