# /*

ECHOTYPE
Interactive Lyrics Typewriter
=============================

Data flow:

Artist + Song
↓
iTunes Search API
↓
Song / Artist / Album / Artwork / Duration
↓
Fandom lyrics lookup
↓
Typewriter animation

# No audio URL is required.

*/

/* =========================================================
ELEMENTS
========================================================= */

const artistInput =
document.getElementById("artistInput");

const songInput =
document.getElementById("songInput");

const loadBtn =
document.getElementById("loadBtn");

const loadText =
document.getElementById("loadText");

const artistDisplay =
document.getElementById("artistDisplay");

const titleDisplay =
document.getElementById("titleDisplay");

const albumDisplay =
document.getElementById("albumDisplay");

const coverArt =
document.getElementById("coverArt");

const placeholderArt =
document.getElementById("placeholderArt");

const artStage =
document.getElementById("artStage");

const artCard =
document.getElementById("artCard");

const playBtn =
document.getElementById("playBtn");

const playIcon =
document.getElementById("playIcon");

const restartBtn =
document.getElementById("restartBtn");

const clearBtn =
document.getElementById("clearBtn");

const seekBar =
document.getElementById("seekBar");

const durationSlider =
document.getElementById("durationSlider");

const durationValue =
document.getElementById("durationValue");

const currentTime =
document.getElementById("currentTime");

const totalTime =
document.getElementById("totalTime");

const lyricsOutput =
document.getElementById("lyricsOutput");

const lyricsWindow =
document.getElementById("lyricsWindow");

const lyricsStatus =
document.getElementById("lyricsStatus");

const percentInfo =
document.getElementById("percentInfo");

const progressFill =
document.getElementById("progressFill");

const sourceText =
document.getElementById("sourceText");

const qualityBadge =
document.getElementById("qualityBadge");

const statusText =
document.getElementById("statusText");

const statusDot =
document.getElementById("statusDot");

const footerText =
document.getElementById("footerText");

const rainCanvas =
document.getElementById("rainCanvas");

/* =========================================================
STATE
========================================================= */

let currentSong = {
artist: "",
title: "",
album: "",
artwork: null,
duration: null
};

let lyrics = "";

let isPlaying = false;

let startedAt = 0;

let elapsedBeforePause = 0;

let animationFrame = null;

let typewriterDuration =
Number(
durationSlider.value
);

/* =========================================================
BASIC HELPERS
========================================================= */

function formatTime(seconds) {

if (
!Number.isFinite(seconds) ||
seconds < 0
) {

```
return "0:00";
```

}

const minutes =
Math.floor(
seconds / 60
);

const remaining =
Math.floor(
seconds % 60
);

return (
`${minutes}:${String(
      remaining
    ).padStart(2, "0")}`
);
}

function setStatus(
text,
active = false
) {

statusText.textContent =
text;

footerText.textContent =
text;

statusDot.classList.toggle(
"active",
active
);
}

function setLyricsStatus(
text,
live = false
) {

lyricsStatus.textContent =
text;

lyricsStatus.classList.toggle(
"live",
live
);
}

/* =========================================================
PLACEHOLDER
========================================================= */

function showEmptyLyrics(
title,
subtitle
) {

lyricsOutput.innerHTML =

```
`<div class="empty-state">

  <div class="empty-symbol">
    ♪
  </div>

  <strong>
    ${title}
  </strong>

  <span>
    ${subtitle}
  </span>

</div>`;
```

}

/* =========================================================
UPDATE DURATION LABEL
========================================================= */

function updateDurationLabel() {

typewriterDuration =
Number(
durationSlider.value
);

durationValue.textContent =
formatTime(
typewriterDuration
);

totalTime.textContent =
formatTime(
typewriterDuration
);
}

durationSlider.addEventListener(
"input",
updateDurationLabel
);

/* =========================================================
SEARCH ITUNES
========================================================= */

async function searchITunes(
artist,
title
) {

const query =
encodeURIComponent(
`${artist} ${title}`
);

const url =
`https://itunes.apple.com/search?term=${query}&media=music&entity=song&limit=25`;

const response =
await fetch(url);

if (!response.ok) {

```
throw new Error(
  "iTunes search failed."
);
```

}

const data =
await response.json();

if (
!data.results ||
data.results.length === 0
) {

```
return null;
```

}

const wantedArtist =
artist
.toLowerCase()
.replace(/\s+/g, " ")
.trim();

const wantedTitle =
title
.toLowerCase()
.replace(/\s+/g, " ")
.trim();

let best =
data.results[0];

let bestScore =
-Infinity;

/*
Find the closest match instead
of blindly taking the first result.
*/

for (
const item of data.results
) {

```
const itemArtist =
  String(
    item.artistName || ""
  )
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();


const itemTitle =
  String(
    item.trackName || ""
  )
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();


let score =
  0;


if (
  itemArtist === wantedArtist
) {

  score += 100;
}


if (
  itemTitle === wantedTitle
) {

  score += 100;
}


if (
  itemTitle.includes(
    wantedTitle
  )
) {

  score += 35;
}


if (
  itemArtist.includes(
    wantedArtist
  )
) {

  score += 25;
}


if (
  score > bestScore
) {

  bestScore =
    score;

  best =
    item;
}
```

}

return {

```
artist:
  best.artistName ||
  artist,

title:
  best.trackName ||
  title,

album:
  best.collectionName ||
  "Unknown Album",

artwork:
  best.artworkUrl100
    ? best.artworkUrl100.replace(
        "100x100",
        "1000x1000"
      )
    : null,

duration:
  Number.isFinite(
    best.trackTimeMillis
  )
    ? best.trackTimeMillis / 1000
    : null,

preview:
  best.previewUrl ||
  null,

collectionId:
  best.collectionId ||
  null,

trackId:
  best.trackId ||
  null
```

};
}

/* =========================================================
APPLY ITUNES INFORMATION
========================================================= */

function applySongInfo(
data,
fallbackArtist,
fallbackTitle
) {

currentSong = {

```
artist:
  data?.artist ||
  fallbackArtist,

title:
  data?.title ||
  fallbackTitle,

album:
  data?.album ||
  "Unknown Album",

artwork:
  data?.artwork ||
  null,

duration:
  data?.duration ||
  null
```

};

artistDisplay.textContent =
currentSong.artist
.toUpperCase();

titleDisplay.textContent =
currentSong.title;

albumDisplay.textContent =
currentSong.album;

/*
Use the actual iTunes track
duration as the initial UI value.
*/

if (
currentSong.duration &&
currentSong.duration >= 5
) {

```
const safeDuration =
  Math.min(
    Math.round(
      currentSong.duration
    ),
    600
  );


durationSlider.value =
  String(
    safeDuration
  );

typewriterDuration =
  safeDuration;
```

}

updateDurationLabel();

/*
Artwork
*/

if (
currentSong.artwork
) {

```
coverArt.onload =
  () => {

    coverArt.classList.remove(
      "hidden"
    );

    placeholderArt.classList.add(
      "hidden"
    );
  };


coverArt.onerror =
  () => {

    coverArt.classList.add(
      "hidden"
    );

    placeholderArt.classList.remove(
      "hidden"
    );
  };


coverArt.src =
  currentSong.artwork;
```

} else {

```
coverArt.classList.add(
  "hidden"
);

placeholderArt.classList.remove(
  "hidden"
);
```

}
}

/* =========================================================
FIND FANDOM PAGE
========================================================= */

function buildFandomPageName(
artist,
title
) {

/*
Typical Fandom music pages use
the pattern:

```
  Artist:Song

Convert spaces to underscores
for MediaWiki-style page names.
```

*/

const cleanArtist =
artist
.trim()
.replace(/\s+/g, "_");

const cleanTitle =
title
.trim()
.replace(/\s+/g, "_");

return (
`${cleanArtist}:${cleanTitle}`
);
}

/* =========================================================
FANDOM API LYRICS
========================================================= */

async function fetchFandomLyrics(
artist,
title
) {

const page =
buildFandomPageName(
artist,
title
);

/*
We try the lyrics.fandom.com
endpoint first.

```
API parse is preferable to scraping
the whole page because MediaWiki
exposes page content through
action=parse.
```

*/

const endpoint =
"https://lyrics.fandom.com/api.php?" +
new URLSearchParams({

```
  action:
    "parse",

  page:
    page,

  prop:
    "text",

  format:
    "json",

  origin:
    "*"
});
```

const response =
await fetch(endpoint);

if (!response.ok) {

```
throw new Error(
  "Fandom request failed."
);
```

}

const data =
await response.json();

if (
!data.parse ||
!data.parse.text
) {

```
return null;
```

}

const html =
data.parse.text["*"];

if (!html) {
return null;
}

return cleanFandomLyrics(
html
);
}

/* =========================================================
CLEAN FANDOM HTML
========================================================= */

function cleanFandomLyrics(
html
) {

const parser =
new DOMParser();

const doc =
parser.parseFromString(
html,
"text/html"
);

/*
Look for the lyric container first.
*/

const candidates = [

```
".lyricbox",

".lyrics",

".mw-parser-output"
```

];

let container =
null;

for (
const selector of candidates
) {

```
const found =
  doc.querySelector(
    selector
  );


if (found) {

  container =
    found;

  break;
}
```

}

if (!container) {
return null;
}

/*
Remove common non-lyric elements.
*/

container
.querySelectorAll(
"script,style,table,nav,aside,.references,.reference"
)
.forEach(
element =>
element.remove()
);

let text =
container.innerText ||
container.textContent ||
"";

text =
text
.replace(
/\r\n/g,
"\n"
)
.replace(
/\n{3,}/g,
"\n\n"
)
.trim();

/*
Fandom pages can contain an introductory
section. Keep the result bounded and
clean obvious navigation text.
*/

const lines =
text
.split("\n")
.map(
line =>
line.trimEnd()
);

const filtered =
lines.filter(
line => {

```
    const value =
      line.trim()
        .toLowerCase();


    if (!value) {
      return true;
    }


    if (
      value === "lyrics" ||
      value === "song lyrics"
    ) {
      return false;
    }


    return true;
  }
);
```

const result =
filtered.join("\n").trim();

return result || null;
}

/* =========================================================
SECOND LYRICS FALLBACK
========================================================= */

async function fetchLyricsFallback(
artist,
title
) {

/*
Use the public LRCLIB endpoint as
an additional fallback.

```
This does NOT affect the UI or require
a user-provided URL.
```

*/

try {

```
const url =
  "https://lrclib.net/api/get?" +
  new URLSearchParams({

    artist_name:
      artist,

    track_name:
      title
  });


const response =
  await fetch(url);


if (!response.ok) {
  return null;
}


const data =
  await response.json();


if (
  data &&
  data.plainLyrics
) {

  return data.plainLyrics.trim();
}


if (
  data &&
  data.syncedLyrics
) {

  return data.syncedLyrics
    .replace(
      /\[\d{1,3}:\d{2}(?:\.\d+)?\]/g,
      ""
    )
    .trim();
}


return null;
```

} catch (error) {

```
console.warn(
  "Lyrics fallback unavailable:",
  error
);

return null;
```

}
}

/* =========================================================
LOAD LYRICS
========================================================= */

async function loadLyrics(
artist,
title
) {

setLyricsStatus(
"LOOKING UP",
false
);

sourceText.textContent =
"Searching lyrics...";

/*
Fandom first.
*/

try {

```
const fandomLyrics =
  await fetchFandomLyrics(
    artist,
    title
  );


if (
  fandomLyrics &&
  fandomLyrics.length > 20
) {

  lyrics =
    fandomLyrics;


  hasLyricsSuccessfullyLoaded();

  return true;
}
```

} catch (error) {

```
console.warn(
  "Fandom lookup failed:",
  error
);
```

}

/*
Fallback.
*/

const fallbackLyrics =
await fetchLyricsFallback(
artist,
title
);

if (
fallbackLyrics &&
fallbackLyrics.length > 20
) {

```
lyrics =
  fallbackLyrics;


hasLyricsSuccessfullyLoaded(
  true
);

return true;
```

}

/*
Nothing found.
*/

lyrics =
"";

sourceText.textContent =
"No lyrics found";

setLyricsStatus(
"NO LYRICS",
false
);

showEmptyLyrics(
"Lyrics unavailable",
"The song was found, but lyrics could not be loaded."
);

return false;
}

/* =========================================================
LYRICS SUCCESS
========================================================= */

function hasLyricsSuccessfullyLoaded(
fallback = false
) {

hasLyrics =
true;

lyricsOutput.textContent =
"";

lyricsOutput.scrollTop =
0;

sourceText.textContent =
fallback
? "Fallback lyrics source"
: "Fandom lyrics source";

setLyricsStatus(
"READY",
true
);
}

/* =========================================================
ANIMATION RESET
========================================================= */

function resetAnimation() {

if (
animationFrame
) {

```
cancelAnimationFrame(
  animationFrame
);

animationFrame =
  null;
```

}

isPlaying =
false;

elapsedBeforePause =
0;

startedAt =
0;

playIcon.textContent =
"▶";

playBtn.classList.remove(
"playing"
);

playBtn.setAttribute(
"aria-label",
"Start typewriter"
);

setLyricsStatus(
lyrics
? "READY"
: "STANDBY",
Boolean(lyrics)
);

setStatus(
"Ready",
false
);
}

/* =========================================================
TYPEWRITER
========================================================= */

function updateTypewriter(
elapsed
) {

if (
!lyrics ||
lyrics.length === 0
) {

```
return;
```

}

const progress =
Math.min(
elapsed /
typewriterDuration,
1
);

const characterIndex =
Math.floor(
lyrics.length *
progress
);

lyricsOutput.textContent =
lyrics.slice(
0,
characterIndex
);

const percent =
progress * 100;

seekBar.value =
String(
percent
);

progressFill.style.width =
`${percent}%`;

percentInfo.textContent =
`${Math.round(
      percent
    )}%`;

currentTime.textContent =
formatTime(
elapsed
);

totalTime.textContent =
formatTime(
typewriterDuration
);

/*
Keep latest text visible while
the typewriter is active.
*/

if (
isPlaying
) {

```
lyricsOutput.scrollTop =
  lyricsOutput.scrollHeight;
```

}

if (
progress >= 1
) {

```
stopPlayback(
  true
);

return;
```

}

if (
isPlaying
) {

```
animationFrame =
  requestAnimationFrame(
    animationTick
  );
```

}
}

/* =========================================================
ANIMATION TICK
========================================================= */

function animationTick() {

if (!isPlaying) {
return;
}

const now =
performance.now();

const elapsed =
elapsedBeforePause +
(
now -
startedAt
) / 1000;

updateTypewriter(
elapsed
);
}

/* =========================================================
START
========================================================= */

function startPlayback() {

if (
!lyrics ||
lyrics.length === 0
) {

```
setStatus(
  "No lyrics",
  false
);

return;
```

}

/*
If already finished, restart.
*/

if (
elapsedBeforePause >=
typewriterDuration
) {

```
elapsedBeforePause =
  0;

lyricsOutput.textContent =
  "";

seekBar.value =
  "0";

progressFill.style.width =
  "0%";

percentInfo.textContent =
  "0%";
```

}

isPlaying =
true;

startedAt =
performance.now();

playIcon.textContent =
"Ⅱ";

playBtn.classList.add(
"playing"
);

playBtn.setAttribute(
"aria-label",
"Pause typewriter"
);

setStatus(
"Playing",
true
);

setLyricsStatus(
"TYPING",
true
);

animationFrame =
requestAnimationFrame(
animationTick
);
}

/* =========================================================
STOP / PAUSE
========================================================= */

function stopPlayback(
finished = false
) {

if (
isPlaying
) {

```
elapsedBeforePause +=
  (
    performance.now() -
    startedAt
  ) / 1000;
```

}

if (
animationFrame
) {

```
cancelAnimationFrame(
  animationFrame
);

animationFrame =
  null;
```

}

isPlaying =
false;

if (finished) {

```
elapsedBeforePause =
  typewriterDuration;


if (lyrics) {

  lyricsOutput.textContent =
    lyrics;

  lyricsOutput.scrollTop =
    lyricsOutput.scrollHeight;
}


seekBar.value =
  "100";


progressFill.style.width =
  "100%";


percentInfo.textContent =
  "100%";


currentTime.textContent =
  formatTime(
    typewriterDuration
  );


playIcon.textContent =
  "▶";


playBtn.classList.remove(
  "playing"
);


setLyricsStatus(
  "FINISHED",
  false
);


setStatus(
  "Finished",
  false
);


return;
```

}

playIcon.textContent =
"▶";

playBtn.classList.remove(
"playing"
);

setStatus(
"Paused",
false
);

setLyricsStatus(
"PAUSED",
false
);
}

/* =========================================================
RESTART
========================================================= */

function restartPlayback() {

if (!lyrics) {
return;
}

if (
animationFrame
) {

```
cancelAnimationFrame(
  animationFrame
);

animationFrame =
  null;
```

}

elapsedBeforePause =
0;

lyricsOutput.textContent =
"";

lyricsOutput.scrollTop =
0;

seekBar.value =
"0";

progressFill.style.width =
"0%";

percentInfo.textContent =
"0%";

currentTime.textContent =
"0:00";

startPlayback();
}

/* =========================================================
CLEAR
========================================================= */

function clearSong() {

resetAnimation();

currentSong = {
artist: "",
title: "",
album: "",
artwork: null,
duration: null
};

lyrics =
"";

artistInput.value =
"";

songInput.value =
"";

artistDisplay.textContent =
"UNKNOWN ARTIST";

titleDisplay.textContent =
"Choose a song";

albumDisplay.textContent =
"Search for a track to begin";

coverArt.classList.add(
"hidden"
);

placeholderArt.classList.remove(
"hidden"
);

qualityBadge.textContent =
"IDLE";

sourceText.textContent =
"No lyrics loaded";

progressFill.style.width =
"0%";

percentInfo.textContent =
"0%";

seekBar.value =
"0";

showEmptyLyrics(
"Waiting for a song",
"Enter an artist and song above."
);

setLyricsStatus(
"STANDBY",
false
);

setStatus(
"Ready",
false
);
}

/* =========================================================
LOAD SONG
========================================================= */

async function loadSong() {

const artist =
artistInput.value.trim();

const title =
songInput.value.trim();

if (!artist) {

```
alert(
  "Enter an artist name."
);

artistInput.focus();

return;
```

}

if (!title) {

```
alert(
  "Enter a song name."
);

songInput.focus();

return;
```

}

loadBtn.disabled =
true;

loadText.textContent =
"Searching...";

resetAnimation();

showEmptyLyrics(
"Finding your song",
"Matching artwork and lyrics..."
);

setLyricsStatus(
"SEARCHING",
false
);

setStatus(
"Searching",
false
);

try {

```
/*
  iTunes is the primary source
  for identifying the song.
*/

const metadata =
  await searchITunes(
    artist,
    title
  );


/*
  Even if iTunes doesn't find a
  result, preserve what the user
  entered and continue to lyrics.
*/

applySongInfo(
  metadata,
  artist,
  title
);


if (metadata) {

  qualityBadge.textContent =
    "MATCHED";

  sourceText.textContent =
    "iTunes metadata";
} else {

  qualityBadge.textContent =
    "MANUAL";

  sourceText.textContent =
    "Metadata fallback";
}


/*
  Fetch lyrics after identifying
  the song.
*/

const finalArtist =
  metadata?.artist ||
  artist;

const finalTitle =
  metadata?.title ||
  title;


await loadLyrics(
  finalArtist,
  finalTitle
);


/*
  If lyrics were found, prepare
  the player but don't start until
  the user presses the play button.
*/

if (lyrics) {

  resetAnimation();

  totalTime.textContent =
    formatTime(
      typewriterDuration
    );


  setStatus(
    "Ready",
    true
  );


  setLyricsStatus(
    "READY",
    true
  );
}
```

} catch (error) {

```
console.error(
  "Load error:",
  error
);


qualityBadge.textContent =
  "ERROR";


setStatus(
  "Search failed",
  false
);


setLyricsStatus(
  "ERROR",
  false
);


showEmptyLyrics(
  "Couldn't load the song",
  "Try another artist and title."
);


sourceText.textContent =
  "Lookup failed";
```

} finally {

```
loadBtn.disabled =
  false;

loadText.textContent =
  "Find & Load";
```

}
}

/* =========================================================
SEEK
========================================================= */

seekBar.addEventListener(
"input",
() => {

```
if (!lyrics) {
  return;
}


const progress =
  Number(
    seekBar.value
  ) / 100;


const elapsed =
  typewriterDuration *
  progress;


elapsedBeforePause =
  elapsed;


currentTime.textContent =
  formatTime(
    elapsed
  );


percentInfo.textContent =
  `${Math.round(
    progress * 100
  )}%`;


progressFill.style.width =
  `${progress * 100}%`;


const characterIndex =
  Math.floor(
    lyrics.length *
    progress
  );


lyricsOutput.textContent =
  lyrics.slice(
    0,
    characterIndex
  );


lyricsOutput.scrollTop =
  lyricsOutput.scrollHeight;


if (isPlaying) {

  startedAt =
    performance.now();
}
```

}
);

/* =========================================================
BUTTON EVENTS
========================================================= */

loadBtn.addEventListener(
"click",
loadSong
);

playBtn.addEventListener(
"click",
() => {

```
if (isPlaying) {

  stopPlayback();

} else {

  startPlayback();
}
```

}
);

restartBtn.addEventListener(
"click",
restartPlayback
);

clearBtn.addEventListener(
"click",
clearSong
);

/* =========================================================
ENTER TO SEARCH
========================================================= */

document.addEventListener(
"keydown",
(event) => {

```
const editing =
  event.target.tagName === "INPUT" ||
  event.target.tagName === "TEXTAREA";


if (
  event.key === "Enter" &&
  editing
) {

  loadSong();
}


if (
  event.code === "Space" &&
  !editing
) {

  event.preventDefault();

  if (isPlaying) {

    stopPlayback();

  } else {

    startPlayback();
  }
}


if (
  event.key.toLowerCase() === "r" &&
  !editing
) {

  restartPlayback();
}
```

}
);

/* =========================================================
3D ALBUM TILT
========================================================= */

artStage.addEventListener(
"pointermove",
(event) => {

```
const rect =
  artStage.getBoundingClientRect();


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
  (
    (x - centerX) /
    centerX
  ) * 9;


const rotateX =
  (
    (centerY - y) /
    centerY
  ) * 9;


artCard.style.setProperty(
  "--rotate-x",
  `${rotateX}deg`
);


artCard.style.setProperty(
  "--rotate-y",
  `${rotateY}deg`
);
```

}
);

artStage.addEventListener(
"pointerleave",
() => {

```
artCard.style.setProperty(
  "--rotate-x",
  "0deg"
);


artCard.style.setProperty(
  "--rotate-y",
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
  (
    event.clientX /
    window.innerWidth -
    0.5
  ) * 30;


targetMouseY =
  (
    event.clientY /
    window.innerHeight -
    0.5
  ) * 20;
```

}
);

function animateParallax() {

currentMouseX +=
(
targetMouseX -
currentMouseX
) * 0.05;

currentMouseY +=
(
targetMouseY -
currentMouseY
) * 0.05;

document.documentElement.style.setProperty(
"--mouse-x",
`${currentMouseX}px`
);

document.documentElement.style.setProperty(
"--mouse-y",
`${currentMouseY}px`
);

requestAnimationFrame(
animateParallax
);
}

animateParallax();

/* =========================================================
DIGITAL RAIN
========================================================= */

const rainContext =
rainCanvas.getContext(
"2d"
);

let rainColumns = [];

const rainCharacters =
"アイウエオカキクケコサシスセソタチツテトナニヌネノ" +
"0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ" +
"01";

function resizeRain() {

const scale =
window.devicePixelRatio || 1;

rainCanvas.width =
window.innerWidth *
scale;

rainCanvas.height =
window.innerHeight *
scale;

rainContext.setTransform(
scale,
0,
0,
scale,
0,
0
);

const fontSize =
15;

const columns =
Math.ceil(
window.innerWidth /
fontSize
);

rainColumns =
new Array(
columns
)
.fill(0)
.map(
() =>
Math.random() *
window.innerHeight /
fontSize
);
}

function drawRain() {

/*
Dark translucent clearing creates
the trailing-rain effect.
*/

rainContext.fillStyle =
"rgba(3, 4, 7, 0.075)";

rainContext.fillRect(
0,
0,
window.innerWidth,
window.innerHeight
);

rainContext.font =
"12px 'DM Mono', monospace";

for (
let i = 0;
i < rainColumns.length;
i++
) {

```
const x =
  i * 15;


const y =
  rainColumns[i] *
  15;


const character =
  rainCharacters[
    Math.floor(
      Math.random() *
      rainCharacters.length
    )
  ];


/*
  Keep the rain subtle so it
  doesn't compete with the UI.
*/

rainContext.fillStyle =
  Math.random() > 0.88
    ? "rgba(255, 76, 141, 0.55)"
    : "rgba(160, 165, 190, 0.18)";


rainContext.fillText(
  character,
  x,
  y
);


if (
  y >
  window.innerHeight &&
  Math.random() > 0.975
) {

  rainColumns[i] =
    0;
}


rainColumns[i] +=
  0.75;
```

}

requestAnimationFrame(
drawRain
);
}

window.addEventListener(
"resize",
resizeRain
);

resizeRain();

drawRain();

/* =========================================================
INITIALIZE
========================================================= */

updateDurationLabel();

setStatus(
"Ready",
false
);

setLyricsStatus(
"STANDBY",
false
);

showEmptyLyrics(
"Waiting for a song",
"Enter an artist and song above."
);
