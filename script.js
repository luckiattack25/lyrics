const artistInput =
document.getElementById("artistInput");

const songInput =
document.getElementById("songInput");

const audioInput =
document.getElementById("audioInput");

const loadBtn =
document.getElementById("loadBtn");

const playBtn =
document.getElementById("playBtn");

const restartBtn =
document.getElementById("restartBtn");

const muteBtn =
document.getElementById("muteBtn");

const volumeBar =
document.getElementById("volumeBar");

const seekBar =
document.getElementById("seekBar");

const audio =
document.createElement("audio");

audio.preload = "metadata";

const artistDisplay =
document.getElementById("artistDisplay");

const titleDisplay =
document.getElementById("titleDisplay");

const albumDisplay =
document.getElementById("albumDisplay");

const coverImage =
document.getElementById("coverImage");

const placeholderCover =
document.getElementById("placeholderCover");

const coverCard =
document.getElementById("coverCard");

const lyricsOutput =
document.getElementById("lyricsOutput");

const lyricsStatus =
document.getElementById("lyricsStatus");

const statusText =
document.getElementById("statusText");

const statusDot =
document.getElementById("statusDot");

const currentTimeText =
document.getElementById("currentTime");

const totalTimeText =
document.getElementById("totalTime");

const progressFill =
document.getElementById("progressFill");

const percentInfo =
document.getElementById("percentInfo");

const footerStatus =
document.getElementById("footerStatus");

const playIcon =
document.getElementById("playIcon");

/* =========================================================
STATE
========================================================= */

let lyrics = "";

let hasLyrics = false;

let currentSong = {
artist: "",
title: "",
album: ""
};

let backgroundAnimation = null;

/* =========================================================
DEFAULT SETTINGS
========================================================= */

audio.volume =
Number(
volumeBar.value
);

/* =========================================================
HELPERS
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

const secondsPart =
Math.floor(
seconds % 60
);

return (
`${minutes}:${String(
      secondsPart
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
ITUNES SEARCH
========================================================= */

async function findSongMetadata(
artist,
title
) {

const query =
encodeURIComponent(
`${artist} ${title}`
);

const url =
`https://itunes.apple.com/search?term=${query}&media=music&entity=song&limit=10`;

const response =
await fetch(url);

if (!response.ok) {

```
throw new Error(
  "Music metadata request failed."
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
.trim();

const wantedTitle =
title
.toLowerCase()
.trim();

let result =
data.results[0];

/*
Prefer an exact artist/title match.
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
    .trim();

const itemTitle =
  String(
    item.trackName || ""
  )
    .toLowerCase()
    .trim();


if (
  itemArtist === wantedArtist &&
  itemTitle === wantedTitle
) {

  result =
    item;

  break;
}
```

}

return {

```
artist:
  result.artistName ||
  artist,

title:
  result.trackName ||
  title,

album:
  result.collectionName ||
  "",

artwork:
  result.artworkUrl100
    ? result.artworkUrl100.replace(
        "100x100",
        "1000x1000"
      )
    : null,

duration:
  Number.isFinite(
    result.trackTimeMillis
  )
    ? result.trackTimeMillis / 1000
    : null
```

};
}

/* =========================================================
APPLY METADATA
========================================================= */

function applyMetadata(
data,
fallbackArtist,
fallbackTitle
) {

const artist =
data?.artist ||
fallbackArtist;

const title =
data?.title ||
fallbackTitle;

const album =
data?.album ||
"Music";

currentSong = {
artist,
title,
album
};

artistDisplay.textContent =
artist;

titleDisplay.textContent =
title;

albumDisplay.textContent =
album;

if (
data &&
data.artwork
) {

```
coverImage.src =
  data.artwork;

coverImage.onload =
  () => {

    coverImage.classList.remove(
      "hidden"
    );

    placeholderCover.classList.add(
      "hidden"
    );
  };

coverImage.onerror =
  () => {

    coverImage.classList.add(
      "hidden"
    );

    placeholderCover.classList.remove(
      "hidden"
    );
  };
```

} else {

```
coverImage.classList.add(
  "hidden"
);

placeholderCover.classList.remove(
  "hidden"
);
```

}
}

/* =========================================================
LYRIC FETCH
========================================================= */

async function findLyrics(
artist,
title
) {

/*
This uses LRCLIB's public API.

```
We deliberately keep this separate
from the music artwork lookup because
they are different services.
```

*/

const url =
"https://lrclib.net/api/get?" +
"artist_name=" +
encodeURIComponent(artist) +
"&track_name=" +
encodeURIComponent(title);

try {

```
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


/*
  Some responses may contain
  synchronized lyrics instead.
*/

if (
  data &&
  data.syncedLyrics
) {

  const cleaned =
    removeLrcTiming(
      data.syncedLyrics
    );

  if (cleaned) {
    return cleaned;
  }
}


return null;
```

} catch (error) {

```
console.warn(
  "Lyrics lookup unavailable:",
  error
);

return null;
```

}
}

/* =========================================================
REMOVE LRC TIMESTAMPS
========================================================= */

function removeLrcTiming(
text
) {

return text
.replace(
/\(\d{1,3}:\d{2}(?:\.\d+)?\)/g,
""
)
.replace(
/\r\n/g,
"\n"
)
.trim();
}

/* =========================================================
SHOW LYRICS
========================================================= */

function showLyricsPlaceholder(
message
) {

lyricsOutput.innerHTML =
` <div class="lyrics-empty">

```
    <div class="empty-icon">
      ♪
    </div>

    <strong>
      ${message}
    </strong>

    <span>
      The song can still play without lyrics.
    </span>

  </div>
`;
```

}

function prepareLyrics(
text
) {

if (!text) {

```
hasLyrics =
  false;

lyrics = "";

showLyricsPlaceholder(
  "Lyrics unavailable"
);

setLyricsStatus(
  "NO LYRICS",
  false
);

return;
```

}

lyrics =
text;

hasLyrics =
true;

lyricsOutput.textContent =
"";

setLyricsStatus(
"READY",
false
);
}

/* =========================================================
AUDIO
========================================================= */

function setAudioSource(
url
) {

audio.pause();

audio.currentTime =
0;

if (!url) {

```
audio.removeAttribute(
  "src"
);

audio.load();

footerStatus.textContent =
  "No audio URL";

return false;
```

}

audio.src =
url;

audio.load();

footerStatus.textContent =
"Audio connected";

return true;
}

/* =========================================================
RESET DISPLAY
========================================================= */

function resetPlaybackDisplay() {

seekBar.value =
"0";

progressFill.style.width =
"0%";

percentInfo.textContent =
"0%";

currentTimeText.textContent =
"0:00";

totalTimeText.textContent =
"0:00";

if (hasLyrics) {

```
lyricsOutput.textContent =
  "";
```

}
}

/* =========================================================
UPDATE UI FROM AUDIO
========================================================= */

function updatePlaybackUI() {

const duration =
audio.duration;

if (
!Number.isFinite(duration) ||
duration <= 0
) {

```
return;
```

}

const current =
audio.currentTime;

const percentage =
Math.min(
(current / duration) * 100,
100
);

seekBar.value =
String(
percentage
);

progressFill.style.width =
`${percentage}%`;

percentInfo.textContent =
`${Math.round(
      percentage
    )}%`;

currentTimeText.textContent =
formatTime(
current
);

totalTimeText.textContent =
formatTime(
duration
);

/*
Synchronize typewriter text
to actual audio position.
*/

if (
hasLyrics &&
lyrics.length > 0
) {

```
const characterIndex =
  Math.floor(
    lyrics.length *
    (current / duration)
  );


const visible =
  lyrics.slice(
    0,
    characterIndex
  );


lyricsOutput.textContent =
  visible;


if (
  !audio.paused
) {

  lyricsOutput.scrollTop =
    lyricsOutput.scrollHeight;
}
```

}
}

/* =========================================================
PLAY UI
========================================================= */

function setPlayingUI(
playing
) {

if (playing) {

```
playIcon.textContent =
  "Ⅱ";

playBtn.classList.add(
  "playing"
);

setStatus(
  "Playing",
  true
);

setLyricsStatus(
  hasLyrics
    ? "PLAYING"
    : "AUDIO",
  true
);
```

} else {

```
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
```

}
}

/* =========================================================
PLAY
========================================================= */

async function playSong() {

if (!audio.src) {

```
setStatus(
  "Add an audio URL",
  false
);

return;
```

}

try {

```
await audio.play();

setPlayingUI(
  true
);
```

} catch (error) {

```
console.error(
  error
);

setStatus(
  "Playback blocked",
  false
);
```

}
}

/* =========================================================
TOGGLE
========================================================= */

async function togglePlay() {

if (
audio.paused
) {

```
await playSong();
```

} else {

```
audio.pause();
```

}
}

/* =========================================================
LOAD SONG
========================================================= */

async function loadSong() {

const artist =
artistInput.value.trim();

const title =
songInput.value.trim();

const audioUrl =
audioInput.value.trim();

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

loadBtn.querySelector(
"span"
).textContent =
"Loading...";

setStatus(
"Searching",
false
);

setLyricsStatus(
"SEARCHING",
false
);

try {

```
/*
  Search metadata first.
*/

const metadata =
  await findSongMetadata(
    artist,
    title
  );


applyMetadata(
  metadata,
  artist,
  title
);


/*
  Get lyrics independently.
*/

const lyricsResult =
  await findLyrics(
    artist,
    title
  );


prepareLyrics(
  lyricsResult
);


/*
  Set audio if the user supplied
  a permitted direct audio URL.
*/

const audioLoaded =
  setAudioSource(
    audioUrl
  );


resetPlaybackDisplay();


if (audioLoaded) {

  await playSong();

} else {

  setStatus(
    "Song found",
    true
  );

  albumDisplay.textContent =
    metadata?.album ||
    "Metadata loaded — add an audio URL to play";

  setLyricsStatus(
    hasLyrics
      ? "READY"
      : "NO LYRICS",
    hasLyrics
  );
}
```

} catch (error) {

```
console.error(
  error
);

setStatus(
  "Search failed",
  false
);

setLyricsStatus(
  "ERROR",
  false
);


showLyricsPlaceholder(
  "Could not load song"
);


alert(
  "Something went wrong while finding the song."
);
```

} finally {

```
loadBtn.disabled =
  false;

loadBtn.querySelector(
  "span"
).textContent =
  "Load Song";
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
if (!audio.src) {
  return;
}


if (
  !Number.isFinite(
    audio.duration
  )
) {
  return;
}


audio.currentTime =
  audio.duration *
  (
    Number(
      seekBar.value
    ) / 100
  );


updatePlaybackUI();
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
audio.volume =
  Number(
    volumeBar.value
  );

audio.muted =
  audio.volume === 0;
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
audio.muted =
  !audio.muted;
```

}
);

/* =========================================================
RESTART
========================================================= */

restartBtn.addEventListener(
"click",
async () => {

```
if (!audio.src) {
  return;
}


audio.currentTime =
  0;

lyricsOutput.scrollTop =
  0;

await playSong();
```

}
);

/* =========================================================
AUDIO EVENTS
========================================================= */

audio.addEventListener(
"loadedmetadata",
() => {

```
totalTimeText.textContent =
  formatTime(
    audio.duration
  );

updatePlaybackUI();
```

}
);

audio.addEventListener(
"timeupdate",
() => {

```
updatePlaybackUI();
```

}
);

audio.addEventListener(
"play",
() => {

```
setPlayingUI(
  true
);
```

}
);

audio.addEventListener(
"pause",
() => {

```
setPlayingUI(
  false
);
```

}
);

audio.addEventListener(
"ended",
() => {

```
setPlayingUI(
  false
);

setStatus(
  "Finished",
  false
);

setLyricsStatus(
  "FINISHED",
  false
);


if (hasLyrics) {

  lyricsOutput.textContent =
    lyrics;

  lyricsOutput.scrollTop =
    lyricsOutput.scrollHeight;
}
```

}
);

audio.addEventListener(
"error",
() => {

```
setStatus(
  "Audio error",
  false
);

footerStatus.textContent =
  "Audio failed to load";

setLyricsStatus(
  "AUDIO ERROR",
  false
);
```

}
);

/* =========================================================
KEYBOARD SHORTCUTS
========================================================= */

document.addEventListener(
"keydown",
(event) => {

```
const tag =
  event.target.tagName;

const editing =
  tag === "INPUT" ||
  tag === "TEXTAREA";


if (
  event.code === "Space" &&
  !editing
) {

  event.preventDefault();

  togglePlay();
}


if (
  event.code === "KeyR" &&
  !editing
) {

  restartBtn.click();
}


if (
  event.code === "Enter" &&
  editing
) {

  /*
    Enter in either text field
    loads the song.
  */

  loadSong();
}
```

}
);

/* =========================================================
3D ALBUM INTERACTION
========================================================= */

coverCard.addEventListener(
"pointermove",
(event) => {

```
const rect =
  coverCard.getBoundingClientRect();


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
  ) * 8;


const rotateX =
  (
    (centerY - y) /
    centerY
  ) * 8;


coverCard.style.setProperty(
  "--rx",
  `${rotateX}deg`
);

coverCard.style.setProperty(
  "--ry",
  `${rotateY}deg`
);
```

}
);

coverCard.addEventListener(
"pointerleave",
() => {

```
coverCard.style.setProperty(
  "--rx",
  "0deg"
);

coverCard.style.setProperty(
  "--ry",
  "0deg"
);
```

}
);

/* =========================================================
BACKGROUND PARALLAX
========================================================= */

let targetX = 0;
let targetY = 0;

let currentX = 0;
let currentY = 0;

document.addEventListener(
"pointermove",
(event) => {

```
targetX =
  (
    event.clientX /
    window.innerWidth -
    0.5
  ) * 30;


targetY =
  (
    event.clientY /
    window.innerHeight -
    0.5
  ) * 20;
```

}
);

function animateBackground() {

currentX +=
(
targetX -
currentX
) * 0.05;

currentY +=
(
targetY -
currentY
) * 0.05;

document.documentElement.style.setProperty(
"--mouse-x",
`${currentX}px`
);

document.documentElement.style.setProperty(
"--mouse-y",
`${currentY}px`
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

setLyricsStatus(
"STANDBY",
false
);

artistInput.value =
"";

songInput.value =
"";

audioInput.value =
"";
