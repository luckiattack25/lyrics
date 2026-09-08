const lyricsUrlInput =
document.getElementById("lyricsUrl");

const audioUrlInput =
document.getElementById("audioUrl");

const durationInput =
document.getElementById("duration");

const loadBtn =
document.getElementById("loadBtn");

const playBtn =
document.getElementById("playBtn");

const restartBtn =
document.getElementById("restartBtn");

const muteBtn =
document.getElementById("muteBtn");

const audioPlayer =
document.getElementById("audioPlayer");

const seekBar =
document.getElementById("seekBar");

const volumeBar =
document.getElementById("volumeBar");

const currentTimeLabel =
document.getElementById("currentTime");

const totalTimeLabel =
document.getElementById("totalTime");

const progressFill =
document.getElementById("progressFill");

const percentInfo =
document.getElementById("percentInfo");

const lyricsOutput =
document.getElementById("lyricsOutput");

const lyricsState =
document.getElementById("lyricsState");

const statusText =
document.getElementById("statusText");

const statusDot =
document.querySelector(".status-dot");

const connectionLabel =
document.getElementById("connectionLabel");

const trackTitle =
document.getElementById("trackTitle");

const trackArtist =
document.getElementById("trackArtist");

const trackMeta =
document.getElementById("trackMeta");

const coverArt =
document.getElementById("coverArt");

const albumPlaceholder =
document.getElementById("albumPlaceholder");

const albumCoverWrap =
document.getElementById("albumCoverWrap");

const albumStage =
document.getElementById("albumStage");

const playIcon =
document.getElementById("playIcon");

const volumeIcon =
document.getElementById("volumeIcon");

/* =========================================================
STATE
========================================================= */

let fullLyrics = "";

let animationFrame = null;

let lyricsLoaded = false;

let fallbackDuration = 140;

let wasPlayingBeforeSeek = false;

let currentSong = {
artist: "Unknown Artist",
title: "Waiting for a song",
cover: null
};

/* =========================================================
INITIAL AUDIO SETTINGS
========================================================= */

audioPlayer.volume =
Number(volumeBar.value);

/* =========================================================
HELPERS
========================================================= */

function formatTime(seconds) {

if (
!Number.isFinite(seconds) ||
seconds < 0
) {
return "0:00";
}

const minutes =
Math.floor(seconds / 60);

const remainingSeconds =
Math.floor(seconds % 60);

return (
`${minutes}:${String(
      remainingSeconds
    ).padStart(2, "0")}`
);
}

function setStatus(
text,
active = false
) {

statusText.textContent =
text;

statusDot.classList.toggle(
"active",
active
);
}

function setLyricsState(
text,
live = false
) {

lyricsState.textContent =
text;

lyricsState.classList.toggle(
"live",
live
);
}

function resetLyricsDisplay() {

lyricsOutput.innerHTML =
`<span class="lyrics-placeholder">
      Your lyrics will appear here.     </span>`;

progressFill.style.width =
"0%";

percentInfo.textContent =
"0%";
}

function updateTrackDisplay(
artist,
title,
meta = ""
) {

trackArtist.textContent =
artist || "Unknown Artist";

trackTitle.textContent =
title || "Unknown Song";

trackMeta.textContent =
meta ||
"Ready to play.";
}

/* =========================================================
FANDOM URL PARSER
========================================================= */

function parseSongFromFandomUrl(url) {

try {

```
const parsed =
  new URL(url);

const pathname =
  decodeURIComponent(
    parsed.pathname
  );

const wikiIndex =
  pathname.toLowerCase()
    .indexOf("/wiki/");

if (wikiIndex === -1) {

  return {
    artist: "",
    title: ""
  };
}

const page =
  pathname.slice(
    wikiIndex + 6
  );

const parts =
  page.split(":");

if (parts.length < 2) {

  return {
    artist: "",
    title: page
      .replace(/_/g, " ")
      .trim()
  };
}

const artist =
  parts[0]
    .replace(/_/g, " ")
    .trim();

const title =
  parts
    .slice(1)
    .join(":")
    .replace(/_/g, " ")
    .trim();

return {
  artist,
  title
};
```

} catch (error) {

```
console.error(
  "URL parser error:",
  error
);

return {
  artist: "",
  title: ""
};
```

}
}

/* =========================================================
FETCH FANDOM LYRICS
========================================================= */

async function fetchFandomLyrics(url) {

try {

```
const proxyUrl =
  "https://corsproxy.io/?" +
  encodeURIComponent(url);

const response =
  await fetch(proxyUrl);

if (!response.ok) {

  throw new Error(
    `Lyrics request failed: ${response.status}`
  );
}

const html =
  await response.text();

const documentObject =
  new DOMParser()
    .parseFromString(
      html,
      "text/html"
    );

/*
  Fandom lyrics pages can use
  .lyricbox.

  Keep a few fallbacks so the
  player is a little more tolerant.
*/

const lyricBox =
  documentObject.querySelector(
    ".lyricbox"
  );

if (lyricBox) {

  return lyricBox.innerText.trim();
}


const alternative =
  documentObject.querySelector(
    ".lyrics"
  );

if (alternative) {

  return alternative.innerText.trim();
}


return "";
```

} catch (error) {

```
console.error(
  "Lyrics fetch error:",
  error
);

return "";
```

}
}

/* =========================================================
FETCH COVER ART
========================================================= */

async function fetchCoverArt(
artist,
title
) {

if (!artist && !title) {
return null;
}

try {

```
const searchTerm =
  encodeURIComponent(
    `${artist} ${title}`
  );

const apiUrl =
  `https://itunes.apple.com/search?term=${searchTerm}&media=music&limit=5`;

const response =
  await fetch(apiUrl);

if (!response.ok) {

  throw new Error(
    "Artwork request failed."
  );
}

const data =
  await response.json();

if (
  !data.results ||
  data.results.length === 0
) {
  return null;
}


/*
  Try to find the closest result
  to the requested artist/title.
*/

const normalizedArtist =
  artist
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();

const normalizedTitle =
  title
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();


let bestResult =
  data.results[0];


for (const result of data.results) {

  const resultArtist =
    String(
      result.artistName || ""
    )
      .toLowerCase()
      .replace(/\s+/g, " ")
      .trim();

  const resultTitle =
    String(
      result.trackName || ""
    )
      .toLowerCase()
      .replace(/\s+/g, " ")
      .trim();

  if (
    resultArtist === normalizedArtist &&
    resultTitle === normalizedTitle
  ) {

    bestResult = result;
    break;
  }

}


const artworkUrl =
  bestResult.artworkUrl100
    ? bestResult.artworkUrl100
        .replace(
          "100x100",
          "1000x1000"
        )
    : null;


return {

  artist:
    bestResult.artistName ||
    artist,

  title:
    bestResult.trackName ||
    title,

  cover:
    artworkUrl

};
```

} catch (error) {

```
console.error(
  "Cover-art error:",
  error
);

return null;
```

}
}

/* =========================================================
UPDATE COVER
========================================================= */

function applyCoverArt(
coverUrl
) {

if (!coverUrl) {

```
coverArt.classList.add(
  "hidden"
);

albumPlaceholder.classList.remove(
  "hidden"
);

return;
```

}

coverArt.onload = () => {

```
coverArt.classList.remove(
  "hidden"
);

albumPlaceholder.classList.add(
  "hidden"
);
```

};

coverArt.onerror = () => {

```
coverArt.classList.add(
  "hidden"
);

albumPlaceholder.classList.remove(
  "hidden"
);
```

};

coverArt.src =
coverUrl;
}

/* =========================================================
LOAD SONG METADATA
========================================================= */

async function loadSongMetadata(
lyricsUrl
) {

const parsed =
parseSongFromFandomUrl(
lyricsUrl
);

currentSong.artist =
parsed.artist ||
"Unknown Artist";

currentSong.title =
parsed.title ||
"Unknown Song";

updateTrackDisplay(
currentSong.artist,
currentSong.title,
"Looking up song artwork..."
);

const artwork =
await fetchCoverArt(
parsed.artist,
parsed.title
);

if (artwork) {

```
currentSong.artist =
  artwork.artist ||
  currentSong.artist;

currentSong.title =
  artwork.title ||
  currentSong.title;

currentSong.cover =
  artwork.cover ||
  null;

updateTrackDisplay(
  currentSong.artist,
  currentSong.title,
  "Cover art matched"
);

applyCoverArt(
  currentSong.cover
);
```

} else {

```
updateTrackDisplay(
  currentSong.artist,
  currentSong.title,
  "Cover art not found — custom artwork can be added later"
);

applyCoverArt(null);
```

}
}

/* =========================================================
SET AUDIO SOURCE
========================================================= */

function loadAudioSource(
audioUrl
) {

if (!audioUrl) {

```
audioPlayer.removeAttribute(
  "src"
);

audioPlayer.load();

connectionLabel.textContent =
  "Lyrics only";

return false;
```

}

audioPlayer.src =
audioUrl;

audioPlayer.load();

connectionLabel.textContent =
"Audio connected";

return true;
}

/* =========================================================
AUDIO DURATION
========================================================= */

function getTotalDuration() {

if (
Number.isFinite(
audioPlayer.duration
) &&
audioPlayer.duration > 0
) {

```
return audioPlayer.duration;
```

}

return fallbackDuration;
}

/* =========================================================
UPDATE VISUAL PROGRESS
========================================================= */

function updateProgress() {

const duration =
getTotalDuration();

let current =
0;

if (
Number.isFinite(
audioPlayer.currentTime
)
) {

```
current =
  audioPlayer.currentTime;
```

} else {

```
return;
```

}

const progress =
duration > 0
? Math.min(
current / duration,
1
)
: 0;

const percent =
progress * 100;

seekBar.value =
String(
percent
);

progressFill.style.width =
`${percent}%`;

percentInfo.textContent =
`${Math.round(percent)}%`;

currentTimeLabel.textContent =
formatTime(current);

totalTimeLabel.textContent =
formatTime(duration);

/*
Typewriter synchronization.

```
Instead of using a separate timer,
lyric position is calculated directly
from the song's playback position.
That keeps text and audio together
even after seeking or pausing.
```

*/

if (
lyricsLoaded &&
fullLyrics.length > 0
) {

```
const characterPosition =
  Math.floor(
    fullLyrics.length *
    progress
  );

const visibleText =
  fullLyrics.slice(
    0,
    characterPosition
  );


lyricsOutput.textContent =
  visibleText;


if (
  visibleText.length > 0 &&
  audioPlayer.paused === false
) {

  lyricsOutput.scrollTop =
    lyricsOutput.scrollHeight;
}
```

}

if (!audioPlayer.paused) {

```
animationFrame =
  requestAnimationFrame(
    updateProgress
  );
```

} else {

```
animationFrame = null;
```

}
}

/* =========================================================
PLAY / PAUSE UI
========================================================= */

function updatePlayUI(
isPlaying
) {

if (isPlaying) {

```
playIcon.textContent =
  "Ⅱ";

playBtn.setAttribute(
  "aria-label",
  "Pause"
);

playBtn.setAttribute(
  "title",
  "Pause"
);

playBtn.classList.add(
  "playing"
);

setLyricsState(
  "PLAYING",
  true
);

setStatus(
  "Playing",
  true
);
```

} else {

```
playIcon.textContent =
  "▶";

playBtn.setAttribute(
  "aria-label",
  "Play"
);

playBtn.setAttribute(
  "title",
  "Play"
);

playBtn.classList.remove(
  "playing"
);

setLyricsState(
  "PAUSED",
  false
);

setStatus(
  "Paused",
  false
);
```

}
}

/* =========================================================
START PLAYBACK
========================================================= */

async function playAudio() {

if (
!audioPlayer.src
) {

```
setStatus(
  "No audio URL",
  false
);

setLyricsState(
  "NO AUDIO",
  false
);

return;
```

}

try {

```
await audioPlayer.play();

updatePlayUI(true);

if (!animationFrame) {

  animationFrame =
    requestAnimationFrame(
      updateProgress
    );
}
```

} catch (error) {

```
console.error(
  "Playback failed:",
  error
);

setStatus(
  "Playback blocked",
  false
);

setLyricsState(
  "PRESS PLAY",
  false
);
```

}
}

/* =========================================================
PAUSE PLAYBACK
========================================================= */

function pauseAudio() {

audioPlayer.pause();

updatePlayUI(false);

if (animationFrame) {

```
cancelAnimationFrame(
  animationFrame
);

animationFrame = null;
```

}

updateProgress();
}

/* =========================================================
TOGGLE PLAYBACK
========================================================= */

async function togglePlayback() {

if (
audioPlayer.paused
) {

```
await playAudio();
```

} else {

```
pauseAudio();
```

}
}

/* =========================================================
LOAD EVERYTHING
========================================================= */

async function loadEverything() {

const lyricsUrl =
lyricsUrlInput.value.trim();

const audioUrl =
audioUrlInput.value.trim();

const duration =
Number(
durationInput.value
);

if (!lyricsUrl) {

```
alert(
  "Enter a Fandom lyrics URL."
);

return;
```

}

if (
!Number.isFinite(duration) ||
duration < 5
) {

```
alert(
  "Enter a valid fallback duration of at least 5 seconds."
);

return;
```

}

fallbackDuration =
duration;

loadBtn.disabled = true;

loadBtn.querySelector(
"span"
).textContent =
"Loading...";

setStatus(
"Loading",
false
);

resetLyricsDisplay();

lyricsLoaded = false;

fullLyrics = "";

audioPlayer.pause();

audioPlayer.currentTime = 0;

try {

```
/*
  Load lyrics and metadata together.
*/

const [
  lyrics,
  metadata
] = await Promise.all([
  fetchFandomLyrics(
    lyricsUrl
  ),
  loadSongMetadata(
    lyricsUrl
  )
]);


if (!lyrics) {

  throw new Error(
    "Lyrics were not found."
  );
}


fullLyrics =
  lyrics;

lyricsLoaded =
  true;


loadAudioSource(
  audioUrl
);


/*
  With no audio source, the lyrics
  can still be displayed, but there
  is nothing to synchronize against.
*/

if (!audioUrl) {

  lyricsState.textContent =
    "READY";

  setStatus(
    "Lyrics ready",
    true
  );

  connectionLabel.textContent =
    "No audio loaded";

  lyricsOutput.textContent =
    "";

  updateProgress();

  return;
}


setLyricsState(
  "READY",
  true
);


setStatus(
  "Ready",
  true
);


connectionLabel.textContent =
  "Audio connected";


/*
  Start playback from the button
  click that initiated this function.
*/

await playAudio();
```

} catch (error) {

```
console.error(
  "Load error:",
  error
);

resetLyricsDisplay();

lyricsLoaded = false;

fullLyrics = "";

setStatus(
  "Load failed",
  false
);

setLyricsState(
  "ERROR",
  false
);

alert(
  error.message ||
  "Something went wrong while loading the song."
);
```

} finally {

```
loadBtn.disabled = false;

loadBtn.querySelector(
  "span"
).textContent =
  "Load & Start";
```

}
}

/* =========================================================
RESTART
========================================================= */

async function restartSong() {

if (
!audioPlayer.src
) {

```
resetLyricsDisplay();

return;
```

}

audioPlayer.currentTime =
0;

lyricsOutput.scrollTop =
0;

await playAudio();
}

/* =========================================================
SEEK
========================================================= */

seekBar.addEventListener(
"input",
() => {

```
if (
  !audioPlayer.src
) {
  return;
}


const duration =
  getTotalDuration();

const percentage =
  Number(
    seekBar.value
  ) / 100;


audioPlayer.currentTime =
  duration *
  percentage;


updateProgress();
```

}
);

/* =========================================================
VOLUME
========================================================= */

volumeBar.addEventListener(
"input",
() => {

```
const volume =
  Number(
    volumeBar.value
  );

audioPlayer.volume =
  volume;

if (volume === 0) {

  audioPlayer.muted =
    true;

} else {

  audioPlayer.muted =
    false;
}


volumeIcon.textContent =
  volume === 0
    ? "×"
    : "◖)";
```

}
);

/* =========================================================
MUTE
========================================================= */

muteBtn.addEventListener(
"click",
() => {

```
audioPlayer.muted =
  !audioPlayer.muted;


if (audioPlayer.muted) {

  volumeIcon.textContent =
    "×";

} else {

  volumeIcon.textContent =
    "◖)";
}
```

}
);

/* =========================================================
AUDIO EVENTS
========================================================= */

audioPlayer.addEventListener(
"loadedmetadata",
() => {

```
const duration =
  getTotalDuration();

totalTimeLabel.textContent =
  formatTime(duration);

updateProgress();
```

}
);

audioPlayer.addEventListener(
"timeupdate",
() => {

```
updateProgress();
```

}
);

audioPlayer.addEventListener(
"play",
() => {

```
updatePlayUI(true);

if (!animationFrame) {

  animationFrame =
    requestAnimationFrame(
      updateProgress
    );
}
```

}
);

audioPlayer.addEventListener(
"pause",
() => {

```
updatePlayUI(false);

updateProgress();
```

}
);

audioPlayer.addEventListener(
"ended",
() => {

```
updatePlayUI(false);

setLyricsState(
  "FINISHED",
  false
);

setStatus(
  "Finished",
  false
);

progressFill.style.width =
  "100%";

percentInfo.textContent =
  "100%";

seekBar.value =
  "100";

currentTimeLabel.textContent =
  totalTimeLabel.textContent;


if (lyricsLoaded) {

  lyricsOutput.textContent =
    fullLyrics;

  lyricsOutput.scrollTop =
    lyricsOutput.scrollHeight;
}
```

}
);

audioPlayer.addEventListener(
"error",
() => {

```
setStatus(
  "Audio error",
  false
);

setLyricsState(
  "AUDIO ERROR",
  false
);

connectionLabel.textContent =
  "Audio failed to load";
```

}
);

/* =========================================================
BUTTON EVENTS
========================================================= */

loadBtn.addEventListener(
"click",
loadEverything
);

playBtn.addEventListener(
"click",
togglePlayback
);

restartBtn.addEventListener(
"click",
restartSong
);

/* =========================================================
KEYBOARD SHORTCUTS
========================================================= */

document.addEventListener(
"keydown",
(event) => {

```
/*
  Don't steal spacebar behavior
  while the user is typing in an input.
*/

const target =
  event.target;

const isTyping =
  target.tagName === "INPUT" ||
  target.tagName === "TEXTAREA";


if (
  event.code === "Space" &&
  !isTyping
) {

  event.preventDefault();

  togglePlayback();
}


if (
  event.code === "KeyR" &&
  !isTyping
) {

  restartSong();
}
```

}
);

/* =========================================================
3D MOUSE INTERACTION
========================================================= */

albumStage.addEventListener(
"pointermove",
(event) => {

```
const rect =
  albumStage.getBoundingClientRect();

const x =
  event.clientX -
  rect.left;

const y =
  event.clientY -
  rect.top;

const centerX =
  rect.width / 2;

const centerY =
  rect.height / 2;


const rotateY =
  ((x - centerX) / centerX) *
  8;

const rotateX =
  ((centerY - y) / centerY) *
  8;


albumCoverWrap.style.setProperty(
  "--rx",
  `${rotateX}deg`
);

albumCoverWrap.style.setProperty(
  "--ry",
  `${rotateY}deg`
);
```

}
);

albumStage.addEventListener(
"pointerleave",
() => {

```
albumCoverWrap.style.setProperty(
  "--rx",
  "0deg"
);

albumCoverWrap.style.setProperty(
  "--ry",
  "0deg"
);
```

}
);

/* =========================================================
BACKGROUND PARALLAX
========================================================= */

let targetMouseX = 0;
let targetMouseY = 0;

let currentMouseX = 0;
let currentMouseY = 0;

document.addEventListener(
"pointermove",
(event) => {

```
targetMouseX =
  (event.clientX /
    window.innerWidth -
    0.5) *
  28;

targetMouseY =
  (event.clientY /
    window.innerHeight -
    0.5) *
  20;
```

}
);

function animateBackground() {

currentMouseX +=
(targetMouseX -
currentMouseX) *
0.06;

currentMouseY +=
(targetMouseY -
currentMouseY) *
0.06;

document.documentElement.style.setProperty(
"--mx",
currentMouseX
);

document.documentElement.style.setProperty(
"--my",
currentMouseY
);

requestAnimationFrame(
animateBackground
);
}

animateBackground();

/* =========================================================
INITIAL STATE
========================================================= */

setStatus(
"Ready",
false
);

setLyricsState(
"STANDBY",
false
);

updateTrackDisplay(
"Unknown Artist",
"Waiting for a song",
"Paste a lyrics page and connect your audio."
);

totalTimeLabel.textContent =
formatTime(
fallbackDuration
);
