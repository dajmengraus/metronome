let bpm = 100;
let beatsPerBar = 4;
let beatUnit = 4;

let beat = 0;
const interval = (60 / bpm) * 1000;

let isRunning = false;

const start = setInterval(() => {
    beat = (beat % beatsPerBar) + 1;
    
    if (beat === 1) {
        //accented beat
    } else {
        //beat
    }
}, interval)