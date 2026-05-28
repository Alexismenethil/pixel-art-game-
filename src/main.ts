import Phaser from "phaser";
import { BootScene } from "./scenes/BootScene";
import { HomeScene } from "./scenes/HomeScene";
import { StoryScene } from "./scenes/StoryScene";
import { forceStopGameAudio, installDevServerAudioGuard } from "./game/systems/audioLifecycle";

type GameWindow = Window &
  typeof globalThis & {
    __alexisKiaraGame?: Phaser.Game;
    __alexisKiaraCleanup?: () => void;
  };

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: "game-root",
  backgroundColor: "#090b10",
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: 960,
    height: 540
  },
  pixelArt: true,
  roundPixels: true,
  scene: [BootScene, HomeScene, StoryScene]
};

const gameWindow = window as GameWindow;

gameWindow.__alexisKiaraCleanup?.();
forceStopGameAudio();
gameWindow.__alexisKiaraGame?.destroy(true);

const game = new Phaser.Game(config);
gameWindow.__alexisKiaraGame = game;

const handlePageExit = () => forceStopGameAudio();
const handleVisibilityChange = () => {
  if (document.hidden) forceStopGameAudio();
};
const cleanupDevAudioGuard = installDevServerAudioGuard();
let cleanedUp = false;

const cleanup = () => {
  if (cleanedUp) return;
  cleanedUp = true;
  window.removeEventListener("pagehide", handlePageExit);
  window.removeEventListener("beforeunload", handlePageExit);
  document.removeEventListener("visibilitychange", handleVisibilityChange);
  cleanupDevAudioGuard();
  forceStopGameAudio();
  game.destroy(true);
  if (gameWindow.__alexisKiaraGame === game) {
    gameWindow.__alexisKiaraGame = undefined;
  }
  if (gameWindow.__alexisKiaraCleanup === cleanup) {
    gameWindow.__alexisKiaraCleanup = undefined;
  }
};

gameWindow.__alexisKiaraCleanup = cleanup;

window.addEventListener("pagehide", handlePageExit);
window.addEventListener("beforeunload", handlePageExit);
document.addEventListener("visibilitychange", handleVisibilityChange);

if (import.meta.hot) {
  import.meta.hot.dispose(cleanup);
}
