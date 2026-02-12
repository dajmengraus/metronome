// =====================
// UI ELEMENTS
// =====================

const btnStart = document.getElementById("btn-start");
const btnStop = document.getElementById("btn-stop");

const btnDecreaseBpm = document.getElementById("decrease-bpm");
const btnIncreaseBpm = document.getElementById("increase-bpm");
const btnDecreaseFiveBpm = document.getElementById("decrease-five-bpm");
const btnIncreaseFiveBpm = document.getElementById("increase-five-bpm");

const bpmText = document.getElementById("bpm");
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
let beatsPerBar = 4;

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

function getBeatLength() {
    return 60 / bpm;
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
        currentBeat = (currentBeat + 1) % beatsPerBar;
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


// =====================
// EVENTS
// =====================

btnStart.addEventListener("click", start);
btnStop.addEventListener("click", stop);

btnDecreaseBpm.addEventListener("click", () => decreaseBpm(1));
btnIncreaseBpm.addEventListener("click", () => increaseBpm(1));

btnDecreaseFiveBpm.addEventListener("click", () => decreaseBpm(5));
btnIncreaseFiveBpm.addEventListener("click", () => increaseBpm(5));