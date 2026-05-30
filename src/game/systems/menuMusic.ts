import {
  registerGameAudioElement,
  unregisterGameAudioElement
} from "./audioLifecycle";

const MENU_MUSIC_URL = "/assets/audio/home-theme.mp3";
const MENU_MUSIC_START_SECONDS = 6;
const MENU_MUSIC_DEFAULT_VOLUME = 0.16;

let menuMusic: HTMLAudioElement | undefined;
let fadeFrame = 0;

function ensureMenuMusic() {
  if (!menuMusic) {
    menuMusic = new Audio(MENU_MUSIC_URL);
    menuMusic.preload = "auto";
    menuMusic.volume = 0;
    menuMusic.loop = false;
    menuMusic.addEventListener("ended", () => {
      if (!menuMusic) return;
      seekToMusicStart(menuMusic);
      void menuMusic.play().catch(() => undefined);
    });
    registerGameAudioElement(menuMusic);
  }

  if (!menuMusic.src.includes(MENU_MUSIC_URL)) {
    menuMusic.src = MENU_MUSIC_URL;
    menuMusic.load();
    registerGameAudioElement(menuMusic);
  }

  return menuMusic;
}

export function startMenuMusic(volume = MENU_MUSIC_DEFAULT_VOLUME, fadeMs = 1800) {
  const music = ensureMenuMusic();
  seekToMusicStart(music);

  music
    .play()
    .then(() => fadeMenuMusicTo(volume, fadeMs))
    .catch(() => undefined);
}

export function fadeOutMenuMusic(fadeMs = 650) {
  const music = menuMusic;
  if (!music) return;

  fadeMenuMusicTo(0, fadeMs, () => {
    music.pause();
    seekToMusicStart(music);
  });
}

export function stopMenuMusic() {
  const music = menuMusic;
  if (!music) return;

  window.cancelAnimationFrame(fadeFrame);
  music.pause();
  seekToMusicStart(music);
  unregisterGameAudioElement(music);
  menuMusic = undefined;
}

function seekToMusicStart(music: HTMLAudioElement) {
  if (music.currentTime >= MENU_MUSIC_START_SECONDS && !music.ended) return;

  try {
    music.currentTime = MENU_MUSIC_START_SECONDS;
  } catch {
    music.addEventListener(
      "loadedmetadata",
      () => {
        try {
          music.currentTime = MENU_MUSIC_START_SECONDS;
        } catch {}
      },
      { once: true }
    );
  }
}

function fadeMenuMusicTo(targetVolume: number, durationMs: number, onDone?: () => void) {
  const music = menuMusic;
  if (!music) return;

  window.cancelAnimationFrame(fadeFrame);
  const startVolume = music.volume;
  const startTime = performance.now();
  const duration = Math.max(durationMs, 1);

  const tick = (now: number) => {
    const progress = Math.max(0, Math.min((now - startTime) / duration, 1));
    const eased = 1 - Math.pow(1 - progress, 3);
    music.volume = Math.max(0, Math.min(startVolume + (targetVolume - startVolume) * eased, 1));

    if (progress < 1) {
      fadeFrame = window.requestAnimationFrame(tick);
      return;
    }

    onDone?.();
  };

  fadeFrame = window.requestAnimationFrame(tick);
}
