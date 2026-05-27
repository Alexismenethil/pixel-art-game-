import Phaser from "phaser";
import { BootScene } from "./scenes/BootScene";
import { HomeScene } from "./scenes/HomeScene";
import { StoryScene } from "./scenes/StoryScene";
import { forceStopGameAudio, installDevServerAudioGuard } from "./game/systems/audioLifecycle";

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

new Phaser.Game(config);

window.addEventListener("pagehide", forceStopGameAudio);
window.addEventListener("beforeunload", forceStopGameAudio);
installDevServerAudioGuard();
