const btnStart = document.getElementById("btn-start");
const btnStop = document.getElementById("btn-stop");
const beatAccent = document.getElementById("beat-accent");

let bpm = 100;
let beatsPerBar = 4;
let beatUnit = 4;

let beat = 0;
let intervalId = null;
const interval = (60 / bpm) * 1000;

function start() {
    if (intervalId !== null) return;

    intervalId = setInterval(() => {
        beat = (beat % beatsPerBar) + 1;
        if (beat === 1) {
            //accented beat
            console.log("TICK");
        } else {
            console.log("tick");
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