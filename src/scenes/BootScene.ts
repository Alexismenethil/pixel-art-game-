import Phaser from "phaser";
import { chapters, isChapterAvailableInCurrentDeploy, type ChapterId } from "../game/data/chapters";
import { fadeOutMenuMusic, startMenuMusic } from "../game/systems/menuMusic";

export class BootScene extends Phaser.Scene {
  private loadingBar!: Phaser.GameObjects.Rectangle;
  private loadingText!: Phaser.GameObjects.Text;
  private loadingDetailText!: Phaser.GameObjects.Text;
  private loadingGlow!: Phaser.GameObjects.Rectangle;
  private bootBackdrop?: Phaser.GameObjects.Image;
  private bootOverlay?: Phaser.GameObjects.Rectangle;

  constructor() {
    super("BootScene");
  }

  preload() {
    this.cameras.main.setBackgroundColor("#000000");
    this.add.rectangle(480, 270, 960, 540, 0x000000).setDepth(0);
    this.load.once("filecomplete-image-home-river-hero", () => {
      this.bootBackdrop = this.add.image(480, 270, "home-river-hero").setDisplaySize(1000, 563).setAlpha(0.12).setDepth(1);
      this.bootOverlay = this.add.rectangle(480, 270, 960, 540, 0x03060c, 0.72).setDepth(2);
      this.tweens.add({
        targets: this.bootBackdrop,
        x: 487,
        y: 266,
        duration: 6200,
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut"
      });
    });
    this.add.rectangle(480, 156, 330, 2, 0xe79037, 0.62).setDepth(4);
    this.add.rectangle(480, 396, 330, 2, 0x53b6b2, 0.28).setDepth(4);

    const title = this.add
      .text(480, 176, "Alexis & Kiara", {
        fontFamily: "Courier New",
        fontSize: "54px",
        fontStyle: "bold",
        color: "#fff2dc"
      })
      .setOrigin(0.5)
      .setDepth(5);
    this.tweens.add({
      targets: title,
      alpha: { from: 0.82, to: 1 },
      duration: 1120,
      yoyo: true,
      repeat: -1
    });

    this.add
      .text(480, 232, "Capitulo 1", {
        fontFamily: "Courier New",
        fontSize: "18px",
        fontStyle: "bold",
        color: "#53b6b2"
      })
      .setOrigin(0.5)
      .setDepth(5);

    this.add
      .text(480, 262, "Donde el rio nos vio", {
        fontFamily: "Courier New",
        fontSize: "24px",
        fontStyle: "bold",
        color: "#e79037"
      })
      .setOrigin(0.5)
      .setDepth(5);

    this.add
      .text(480, 304, "Cargando el primer recuerdo...", {
        fontFamily: "Courier New",
        fontSize: "16px",
        color: "#b7b0a5"
      })
      .setOrigin(0.5)
      .setDepth(5);

    this.add.rectangle(480, 344, 424, 16, 0x08090c, 0.9).setStrokeStyle(2, 0x3b4656).setDepth(5);
    this.loadingGlow = this.add.rectangle(270, 344, 0, 10, 0x53b6b2, 0.22).setOrigin(0, 0.5).setDepth(6);
    this.loadingBar = this.add.rectangle(274, 344, 0, 6, 0xe79037).setOrigin(0, 0.5).setDepth(7);
    this.loadingText = this.add
      .text(480, 372, "0%", {
        fontFamily: "Courier New",
        fontSize: "16px",
        color: "#fff2dc"
      })
      .setOrigin(0.5)
      .setDepth(5);
    this.loadingDetailText = this.add
      .text(480, 420, "Preparando la cita", {
        fontFamily: "Courier New",
        fontSize: "14px",
        color: "#9fb0c4"
      })
      .setOrigin(0.5)
      .setDepth(5);

    this.load.on("progress", (value: number) => {
      this.loadingGlow.width = 420 * value;
      this.loadingBar.width = 412 * value;
      this.loadingText.setText(`${Math.round(value * 100)}%`);
      this.loadingDetailText.setText(this.loadingMessageFor(value));
      this.bootBackdrop?.setAlpha(0.12 + value * 0.44);
      this.bootOverlay?.setAlpha(0.72 - value * 0.24);
    });

    startMenuMusic(0.14, 2600);

    this.load.image("home-river-hero", "/assets/generated/backgrounds/river/beauty-1.png");
    this.load.image("characters-sheet", "/assets/characters-sheet.png");
    this.load.image("chapter-1-reference", "/assets/references/chapter-1-ai-background-reference.png");

    const locations = [
      "taxi",
      "hospital",
      "road",
      "bosquete",
      "valley",
      "ravine",
      "river",
      "night",
      "room"
    ] as const;
    const layers = ["sky", "back", "mid", "front", "fx"] as const;
    const beautyFrames = ["1", "2", "3", "4", "5"] as const;

    for (const location of locations) {
      for (const layer of layers) {
        if (location === "bosquete" && layer === "front") continue;
        this.load.image(`bg-${location}-${layer}`, `/assets/chapter-1/${location}/${layer}.png`);
      }

      for (const frame of beautyFrames) {
        this.load.image(
          `bg-${location}-beauty-${frame}`,
          `/assets/generated/backgrounds/${location}/beauty-${frame}.png`
        );
      }
    }

    const sceneBackdrops = [
      ["taxi-back-close-day", "/assets/chapter-1/taxi/back-close-day.png"],
      ["taxi-back-day-side-window", "/assets/chapter-1/taxi/back-day-side-window.png"],
      ["hospital-wide-old", "/assets/chapter-1/hospital/hospital.png"],
      ["hospital-entrance-day", "/assets/chapter-1/hospital/entrance-day.png"],
      ["hospital-entrance-close-day", "/assets/chapter-1/hospital/entrance-close-day.png"],
      ["road-golden-path", "/assets/chapter-1/road/sky.png"],
      ["road-asphalt-path", "/assets/generated/backgrounds/road/beauty-1.png"],
      ["bosquete-clearing", "/assets/chapter-1/bosquete/clearing.png"],
      ["valley-cima-close", "/assets/chapter-1/valley/cima-close.png"],
      ["ravine-path-down", "/assets/chapter-1/ravine/path-down.png?v=ravine-river-path-20260530"],
      ["river-arrival-wide", "/assets/chapter-1/river/llegara%20al%20rio.png"],
      ["river-picnic-spot", "/assets/chapter-1/river/picnic-spot.png"],
      ["river-close-faces", "/assets/chapter-1/river/close-faces.png"]
    ] as const;

    for (const [key, path] of sceneBackdrops) {
      this.load.image(`scene-${key}`, path);
    }

    const sharedExpressions = [
      "neutral",
      "happy",
      "surprised",
      "scared",
      "shy",
      "talking",
      "thinking",
      "angry",
      "crying",
      "laughing",
      "sleepy",
      "looking-away-shy"
    ] as const;

    const alexisExpressions = [
      "nervous-soft",
      "panic-late",
      "awkward-smile",
      "flirty-shy",
      "soft-love",
      "laughing-soft",
      "trying-cool",
      "breathless",
      "after-kiss-shy",
      "lean-in",
      "lean-in-soft-alt",
      "closed-eyes",
      "hand-on-cheek",
      "looking-phone",
      "wide-eyes-love"
    ] as const;

    const kiaraExpressions = [
      "teasing-smile",
      "laughing-haha",
      "shy-soft",
      "flirty-soft",
      "gentle-smile",
      "surprised-soft",
      "caring",
      "close-nervous",
      "after-kiss-blush",
      "lean-in",
      "closed-eyes",
      "hand-near-mouth",
      "looking-down-soft",
      "pointing-snacks"
    ] as const;

    for (const expression of sharedExpressions) {
      this.load.image(`alexis-${expression}`, `/assets/characters/alexis/${expression}.png`);
      this.load.image(`kiara-${expression}`, `/assets/characters/kiara/${expression}.png`);
    }

    for (const expression of alexisExpressions) {
      this.load.image(`alexis-${expression}`, `/assets/characters/alexis/${expression}.png`);
    }

    for (const expression of kiaraExpressions) {
      this.load.image(`kiara-${expression}`, `/assets/characters/kiara/${expression}.png`);
    }

    const poses = ["back", "side", "sitting", "walking-side"] as const;

    for (const pose of poses) {
      this.load.image(`alexis-pose-${pose}`, `/assets/characters/alexis/poses/${pose}.png`);
      this.load.image(`kiara-pose-${pose}`, `/assets/characters/kiara/poses/${pose}.png`);
    }

    this.load.spritesheet("alexis-walk-side-sheet", "/assets/characters/alexis/animations/walk-side.png", {
      frameWidth: 256,
      frameHeight: 386
    });
    this.load.spritesheet("kiara-walk-side-sheet", "/assets/characters/kiara/animations/walk-side.png", {
      frameWidth: 256,
      frameHeight: 386
    });

    const coupleScenes = [
      "walking-back",
      "hold-hands",
      "sitting-together",
      "kiss",
      "hug",
      "hospital-meet-nervous",
      "hospital-meet-close",
      "hospital-meet-wide",
      "taxi-back-seat",
      "taxi-driver",
      "walking-side-01",
      "walking-side-02",
      "walking-side-03",
      "walking-side-04",
      "walking-back-01",
      "walking-back-02",
      "walking-back-03",
      "walking-back-04",
      "valley-back-wide",
      "valley-back-close",
      "river-sitting-normal",
      "river-sitting-snacks",
      "river-sitting-close",
      "river-sitting-normal-grounded",
      "river-sitting-normal-grounded-alt",
      "river-sitting-snacks-grounded",
      "river-sitting-close-grounded",
      "almost-kiss-01",
      "almost-kiss-02",
      "almost-kiss-03",
      "almost-kiss-04",
      "kiss-sitting",
      "after-kiss-shy",
      "walking-hand-touch",
      "laugh-shared",
      "post-kiss-shy",
      "valley-side-by-side",
      "nurse",
      "older-woman",
      "cafeteria-lady"
    ] as const;

    for (const scene of coupleScenes) {
      this.load.image(`couple-${scene}`, `/assets/couples/${scene}.png`);
    }

    const npcs = ["taxi-driver", "nurse", "older-woman", "cafeteria-lady"] as const;

    for (const npc of npcs) {
      this.load.image(`npc-${npc}`, `/assets/npcs/${npc}.png`);
    }

    this.load.image("prop-purple-moto", "/assets/props/purple-moto.png");
    this.load.image("prop-taxi", "/assets/props/taxi.png");
  }

  create() {
    this.time.delayedCall(350, () => {
      const params = new URLSearchParams(window.location.search);
      const chapterId = params.get("chapter");
      const startBeatId = params.get("beat") ?? undefined;
      const startScene = () => {
        if (this.isPlayableChapterId(chapterId)) {
          fadeOutMenuMusic(520);
          this.scene.start("StoryScene", { chapterId, startBeatId });
          return;
        }

        this.scene.start("HomeScene");
      };

      this.cameras.main.fadeOut(360, 0, 0, 0);
      this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, startScene);
    });
  }

  private loadingMessageFor(progress: number) {
    if (progress < 0.22) return "Guardando el frio suave de julio";
    if (progress < 0.44) return "Preparando el taxi y el hospital";
    if (progress < 0.68) return "Encendiendo el valle";
    if (progress < 0.9) return "Acomodando el rio";
    return "Listo para empezar";
  }

  private isPlayableChapterId(chapterId: string | null): chapterId is ChapterId {
    const candidate = chapters.find((chapter) => chapter.id === chapterId);
    return Boolean(candidate && isChapterAvailableInCurrentDeploy(candidate.id));
  }
}
