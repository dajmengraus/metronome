// =====================
// UI ELEMENTS
// =====================

const btnStart = document.getElementById("btn-start");
const btnStop = document.getElementById("btn-stop");

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
const numeratorText = document.getElementById("numerator");
const denominatorText = document.getElementById("denominator");
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

async function loadSound(url) {
    const res = await fetch(url);
    const buffer = await res.arrayBuffer();
    return await audioCtx.decodeAudioData(buffer);
}

async function initAudio() {
    beatBuffer = await loadSound("audio/beat.mp3");
    accentBuffer = await loadSound("audio/beat-accent.mp3");
}

initAudio();


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
        el.classList.remove("beat--selected");
    }
}

function updateUI(beat, time) {

    const delay = (time - audioCtx.currentTime) * 1000;

    setTimeout(() => {

        clearBeats();
        beats.children[beat].classList.add("beat--selected");

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
}


function stop() {

    clearInterval(schedulerID);
    schedulerID = null;

    clearBeats();

    currentBeat = 0;
}


// =====================
// BPM CONTROL
// =====================

function updateBpm(value) {
    bpm = Math.max(1, value);
    bpmText.innerText = bpm;
}

function increaseBpm(val) {
    updateBpm(bpm + val);
}

function decreaseBpm(val) {
    updateBpm(bpm - val);
}


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

btnStart.addEventListener("click", start);
btnStop.addEventListener("click", stop);

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