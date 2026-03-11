const clips = [
  {
    speaker: "Magnus",
    phase: "whisper",
    file: "assets/audio/01-magnus.m4a",
    text: "Scroll-triggered CSS is safe. We ship in twenty minutes.",
  },
  {
    speaker: "Max",
    phase: "whisper",
    file: "assets/audio/02-max.m4a",
    text: "Safe isn't phenomenal. Without audio reactivity, it's dead.",
  },
  {
    speaker: "Magnus",
    phase: "build",
    file: "assets/audio/03-magnus.m4a",
    text: "Mobile browsers choke on heavy audio analysis.",
  },
  {
    speaker: "Max",
    phase: "build",
    file: "assets/audio/04-max.m4a",
    text: "We analyze frequencies, not the whole stream. Light touches.",
  },
  {
    speaker: "Magnus",
    phase: "release",
    file: "assets/audio/05-magnus.m4a",
    text: "Visuals only on key moments then. Scroll drives the story.",
  },
  {
    speaker: "Max",
    phase: "release",
    file: "assets/audio/06-max.m4a",
    text: "That's RESONANCE. Fast shipping, genuine magic. Build it.",
  },
];

const playButton = document.querySelector("#play-sequence");
const replayButton = document.querySelector("#replay-sequence");
const lineCards = [...document.querySelectorAll(".line-card")];
const canvas = document.querySelector("#visualizer");
const ctx = canvas.getContext("2d");

let audioContext;
let analyser;
let rafId = 0;
let currentAudio = null;
let currentSource = null;
let currentIndex = -1;

function resizeCanvas() {
  const ratio = window.devicePixelRatio || 1;
  canvas.width = Math.floor(window.innerWidth * ratio);
  canvas.height = Math.floor(window.innerHeight * ratio);
  canvas.style.width = `${window.innerWidth}px`;
  canvas.style.height = `${window.innerHeight}px`;
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
}

function ensureAudioGraph(audio) {
  if (!audioContext) {
    audioContext = new window.AudioContext();
  }
  if (!analyser) {
    analyser = audioContext.createAnalyser();
    analyser.fftSize = 512;
    analyser.smoothingTimeConstant = 0.88;
    analyser.connect(audioContext.destination);
  }
  if (currentSource) {
    currentSource.disconnect();
  }
  currentSource = audioContext.createMediaElementSource(audio);
  currentSource.connect(analyser);
}

function setActiveLine(index) {
  currentIndex = index;
  lineCards.forEach((card, cardIndex) => {
    card.classList.toggle("active", cardIndex === index);
  });
  document.body.dataset.phase = clips[index]?.phase || "whisper";
}

function clearVisualizer() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
}

function drawVisualizer() {
  if (!analyser) {
    clearVisualizer();
    return;
  }

  const width = window.innerWidth;
  const height = window.innerHeight;
  const frequencyData = new Uint8Array(analyser.frequencyBinCount);
  analyser.getByteFrequencyData(frequencyData);

  ctx.clearRect(0, 0, width, height);

  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, "rgba(126, 224, 255, 0.2)");
  gradient.addColorStop(0.5, "rgba(245, 208, 103, 0.18)");
  gradient.addColorStop(1, "rgba(255, 143, 107, 0.2)");
  ctx.fillStyle = gradient;

  const centerX = width / 2;
  const centerY = height / 2;
  const baseRadius = Math.min(width, height) * 0.16;
  const step = (Math.PI * 2) / frequencyData.length;

  ctx.beginPath();
  for (let i = 0; i < frequencyData.length; i += 1) {
    const angle = i * step;
    const magnitude = frequencyData[i] / 255;
    const radius = baseRadius + magnitude * 140;
    const x = centerX + Math.cos(angle) * radius;
    const y = centerY + Math.sin(angle) * radius;
    if (i === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  }
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = "rgba(255,255,255,0.22)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let i = 0; i < frequencyData.length; i += 6) {
    const angle = i * step;
    const magnitude = frequencyData[i] / 255;
    const radius = baseRadius + magnitude * 180;
    const x = centerX + Math.cos(angle) * radius;
    const y = centerY + Math.sin(angle) * radius;
    if (i === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  }
  ctx.closePath();
  ctx.stroke();

  const bass = frequencyData.slice(0, 20).reduce((sum, value) => sum + value, 0) / 20 || 0;
  const haloRadius = baseRadius + bass * 0.75;
  ctx.beginPath();
  ctx.arc(centerX, centerY, haloRadius, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(245, 208, 103, 0.08)";
  ctx.fill();

  rafId = window.requestAnimationFrame(drawVisualizer);
}

async function playSequence(startIndex = 0) {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.currentTime = 0;
  }

  if (audioContext?.state === "suspended") {
    await audioContext.resume();
  }

  async function playAt(index) {
    if (index >= clips.length) {
      setActiveLine(clips.length - 1);
      return;
    }

    const clip = clips[index];
    const audio = new Audio(clip.file);
    audio.preload = "auto";
    currentAudio = audio;
    ensureAudioGraph(audio);
    setActiveLine(index);

    await audioContext.resume();

    try {
      await audio.play();
    } catch (error) {
      console.error("Audio playback failed", error);
      return;
    }

    audio.addEventListener(
      "ended",
      () => {
        playAt(index + 1);
      },
      { once: true },
    );
  }

  window.cancelAnimationFrame(rafId);
  drawVisualizer();
  playAt(startIndex);
}

function replaySequence() {
  setActiveLine(-1);
  playSequence(0);
}

playButton.addEventListener("click", () => {
  playSequence(0);
});

replayButton.addEventListener("click", () => {
  replaySequence();
});

window.addEventListener("resize", resizeCanvas);
resizeCanvas();
drawVisualizer();
