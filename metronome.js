const btnStart = document.getElementById("btn-start");
const btnStop = document.getElementById("btn-stop");
const beatAccent = document.getElementById("beat-accent");
const beats = document.getElementById("beats");

const beatAudio = new Audio("audio/beat.mp3")
const beatAccentAudio = new Audio("audio/beat-accent.mp3")

let bpm = 100;
let beatsPerBar = 4;
let beatUnit = 4;

let beat = 0;
let intervalId = null;
const interval = (60 / bpm) * 1000;

function start() {
    for (let beat of beats.children) {
        console.log(beat);
    }
    if (intervalId !== null) return;

    intervalId = setInterval(() => {
        beat = (beat % beatsPerBar) + 1;
        if (beat === 1) {
            beatAccentAudio.currentTime = 0;
            beatAccentAudio.play()
        } else {
            beatAudio.currentTime = 0;
            beatAudio.play();
        }
    }, interval)
}

function stop() {
    clearInterval(intervalId);
    intervalId = null;
    beat = 0;
}

btnStart.addEventListener("click", start);
btnStop.addEventListener("click", stop)