const urlInput = document.getElementById("lyricsUrl");
const durationInput = document.getElementById("duration");
const startBtn = document.getElementById("startBtn");
const resetBtn = document.getElementById("resetBtn");
const lyricsOutput = document.getElementById("lyricsOutput");
const progressFill = document.getElementById("progressFill");
const timeInfo = document.getElementById("timeInfo");
const percentInfo = document.getElementById("percentInfo");

let typingInterval = null;
let startTime = null;
let totalDuration = 0;
let fullText = "";
let currentIndex = 0;

function resetPlayer() {
  if (typingInterval) clearInterval(typingInterval);
  typingInterval = null;
  startTime = null;
  totalDuration = 0;
  fullText = "";
  currentIndex = 0;

  lyricsOutput.textContent = "";
  progressFill.style.width = "0%";
  timeInfo.textContent = "0.0 / 0.0 s";
  percentInfo.textContent = "0%";
}

// Convert "New Drank" → "New_Drank"
function fandomFormat(str) {
  return str.trim().replace(/\s+/g, "_");
}

async function fetchFandomLyrics(url) {
  const proxyUrl = "https://corsproxy.io/?" + url;
  const html = await fetch(proxyUrl).then(r => r.text());

  const doc = new DOMParser().parseFromString(html, "text/html");
  const box = doc.querySelector(".lyricbox");

  if (!box) return "";
  return box.innerText.trim();
}

async function startTyping() {
  resetPlayer();

  let url = urlInput.value.trim();
  const durationSeconds = Number(durationInput.value);

  // If user typed "Lucki:New Drank", fix it automatically
  if (url.includes(":")) {
    const [artist, title] = url.split(":");
    const fixedTitle = fandomFormat(title);
    url = `https://lyrics.fandom.com/wiki/${artist}:${fixedTitle}`;
  }

  const lyrics = await fetchFandomLyrics(url);

  if (!lyrics) {
    alert("Lyrics not found on Fandom.");
    return;
  }

  fullText = lyrics;
  totalDuration = durationSeconds;

  const totalChars = fullText.length;
  const msPerChar = (totalDuration * 1000) / totalChars;

  startTime = performance.now();
  currentIndex = 0;

  typingInterval = setInterval(() => {
    if (currentIndex >= totalChars) {
      clearInterval(typingInterval);
      updateProgress(true);
      return;
    }

    lyricsOutput.textContent = fullText.slice(0, currentIndex + 1);
    currentIndex++;

    updateProgress(false);
  }, msPerChar);
}

function updateProgress(forceComplete = false) {
  if (!startTime) return;

  const now = performance.now();
  const elapsedSec = (now - startTime) / 1000;

  let percent = forceComplete ? 100 : Math.min((elapsedSec / totalDuration) * 100, 100);

  progressFill.style.width = percent + "%";
  timeInfo.textContent = `${elapsedSec.toFixed(1)} / ${totalDuration.toFixed(1)} s`;
  percentInfo.textContent = Math.round(percent) + "%";
}

startBtn.addEventListener("click", startTyping);
resetBtn.addEventListener("click", resetPlayer);

// Auto-load Goku by Lucki
window.onload = () => {
  urlInput.value = "Lucki:Goku";
  startTyping();
};
