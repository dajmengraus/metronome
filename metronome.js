const btnStart = document.getElementById("btn-start");
const btnStop = document.getElementById("btn-stop");
const beatAccent = document.getElementById("beat-accent");
const beats = document.getElementById("beats");
const btnDecreaseBpm = document.getElementById("decrease-bpm")
const btnIncreaseBpm = document.getElementById("increase-bpm")
const btnDecreaseFiveBpm = document.getElementById("decrease-five-bpm")
const btnIncreaseFiveBpm = document.getElementById("increase-five-bpm")
const bpmText = document.getElementById("bpm");

const beatAudio = new Audio("audio/beat.mp3")
const beatAccentAudio = new Audio("audio/beat-accent.mp3")

let bpm = 100;
let beatsPerBar = 4;
let beatUnit = 4;

let beat = 0;
let intervalId = null;

function increaseBpm(incr) {
    if (intervalId) {    
        stop()
        bpm += incr;
        bpmText.innerText = bpm;
        start();
    } else {
        bpm += incr;
        bpmText.innerText = bpm;
    }
}

function decreaseBpm(decr) {
    if (decr === 1 && bpm === 1) {
        return;
    }
    if (decr === 5 && bpm === 5) {
        return;
    }
    if (intervalId) {
        stop();
        bpm -= decr;
        bpmText.innerText = bpm;
        start();
    } else {
        bpm -= decr;
        bpmText.innerText = bpm;
    }
}

function getInterval() {
    return (60 / bpm) * 1000;
}

function clearBeats() {
    for (let beat of beats.children) {
        beat.classList.remove("beat--selected");
    }
}

function start() {
    if (intervalId !== null) return;

    intervalId = setInterval(() => {
        clearBeats();

        beats.children[beat].classList.add("beat--selected");

        if (beat === 0) {
            beatAccentAudio.currentTime = 0;
            beatAccentAudio.play()
        } else {
            beatAudio.currentTime = 0;
            beatAudio.play();
        }

        beat = (beat + 1) % beatsPerBar;

    }, getInterval());
}

function stop() {
    clearBeats();
    clearInterval(intervalId);
    intervalId = null;
    beat = 0;
}


btnStart.addEventListener("click", start);
btnStop.addEventListener("click", stop);

btnDecreaseBpm.addEventListener("click", () => decreaseBpm(1));
btnIncreaseBpm.addEventListener("click", () => increaseBpm(1));
btnDecreaseFiveBpm.addEventListener("click", () => decreaseBpm(5));
btnIncreaseFiveBpm.addEventListener("click", () => increaseBpm(5));
