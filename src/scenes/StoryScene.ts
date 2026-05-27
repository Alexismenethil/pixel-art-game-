import Phaser from "phaser";
import {
  chapters,
  type ActorId,
  type Chapter,
  type ChapterId,
  type LocationId,
  type SceneProp,
  type StoryBeat,
  type StoryChoice,
  type StoryStatId
} from "../game/data/chapters";
import { CharacterActor } from "../game/systems/CharacterActor";
import { ParticleField } from "../game/systems/ParticleField";
import { PixelMapRenderer } from "../game/systems/PixelMapRenderer";
import { AmbienceEngine } from "../game/systems/AmbienceEngine";
import { FORCE_STOP_AUDIO_EVENT } from "../game/systems/audioLifecycle";
import {
  addMemory,
  addStoryStat,
  completeChapter,
  loadProgress,
  saveProgress,
  unlockChapter
} from "../game/systems/ProgressStore";

type StorySceneData = {
  chapterId: ChapterId;
  startBeatId?: string;
};

type ChoiceButton = {
  bounds: Phaser.Geom.Rectangle;
  choice: StoryChoice;
};

const locationLabels: Record<LocationId, string> = {
  taxi: "taxi",
  hospital: "hospital",
  road: "camino",
  bosquete: "campo",
  valley: "valle",
  ravine: "quebrada",
  river: "rio",
  night: "noche",
  room: "recuerdos"
};

const dialogueTypingDelayMs = 22;

const paceDelays: Record<NonNullable<StoryBeat["pace"]>, number> = {
  slow: 38,
  normal: 22,
  fast: 16,
  urgent: 11,
  freeze: 56
};

// Each speaker gets a signature color for the name + dialogue accent bar,
// so the eye instantly knows whose voice it is before reading a word.
const speakerColors: Record<StoryBeat["speaker"], string> = {
  Alexis: "#e79037",
  Kiara: "#c79bff",
  Ambos: "#8fe8ff",
  Narrador: "#9fb0c4",
  Chofer: "#d9b48a"
};

const speakerAccentHex: Record<StoryBeat["speaker"], number> = {
  Alexis: 0xe79037,
  Kiara: 0xc79bff,
  Ambos: 0x8fe8ff,
  Narrador: 0x9fb0c4,
  Chofer: 0xd9b48a
};

// Per-location color grade (multiply wash) so each place has a distinct film
// "look": cool dusk in the taxi/hospital, golden hour outdoors, blue night.
const colorGrades: Record<LocationId, { color: number; alpha: number }> = {
  taxi: { color: 0x9fb6e0, alpha: 0.2 },
  hospital: { color: 0xbcc8d6, alpha: 0.14 },
  road: { color: 0xffdca8, alpha: 0.18 },
  bosquete: { color: 0xe6e2a8, alpha: 0.16 },
  valley: { color: 0xffe2b0, alpha: 0.18 },
  ravine: { color: 0xdac9a8, alpha: 0.15 },
  river: { color: 0xffd9c0, alpha: 0.18 },
  night: { color: 0x6a78b0, alpha: 0.26 },
  room: { color: 0xd8c0e0, alpha: 0.15 }
};

const musicVolumeByLocation: Record<LocationId, number> = {
  taxi: 0.2,
  hospital: 0.17,
  road: 0.22,
  bosquete: 0.23,
  valley: 0.22,
  ravine: 0.18,
  river: 0.24,
  night: 0.17,
  room: 0.16
};

export class StoryScene extends Phaser.Scene {
  private chapter!: Chapter;
  private beatIndex = 0;
  private map!: PixelMapRenderer;
  private ambience!: AmbienceEngine;
  private actors!: Record<ActorId, CharacterActor>;
  private progress = loadProgress();
  private uiCamera!: Phaser.Cameras.Scene2D.Camera;
  private dialogueBox!: Phaser.GameObjects.Container;
  private dialogueBg!: Phaser.GameObjects.Rectangle;
  private speakerText!: Phaser.GameObjects.Text;
  private dialogueText!: Phaser.GameObjects.Text;
  private promptText!: Phaser.GameObjects.Text;
  private locationText!: Phaser.GameObjects.Text;
  private scoreText!: Phaser.GameObjects.Text;
  private memoryCounterText!: Phaser.GameObjects.Text;
  private guideToggle!: Phaser.GameObjects.Text;
  private audioToggle!: Phaser.GameObjects.Text;
  private cinematicTopBar!: Phaser.GameObjects.Rectangle;
  private cinematicBottomBar!: Phaser.GameObjects.Rectangle;
  private warmthOverlay!: Phaser.GameObjects.Rectangle;
  private vignetteTop!: Phaser.GameObjects.Rectangle;
  private vignetteBottom!: Phaser.GameObjects.Rectangle;
  private vignetteLeft!: Phaser.GameObjects.Rectangle;
  private vignetteRight!: Phaser.GameObjects.Rectangle;
  private heartbeatOverlay!: Phaser.GameObjects.Rectangle;
  private heartbeatIntensity = 0;
  private heartbeatPulse = 0;
  private bloomOverlay!: Phaser.GameObjects.Rectangle;
  private chromaticOverlay!: Phaser.GameObjects.Rectangle;
  private godraysContainer!: Phaser.GameObjects.Container;
  private godraysShafts: Phaser.GameObjects.Rectangle[] = [];
  private colorGradeOverlay!: Phaser.GameObjects.Rectangle;
  private gradedLocation?: LocationId;
  private filmGrain?: Phaser.GameObjects.TileSprite;
  private dialogueAccent!: Phaser.GameObjects.Rectangle;
  private currentSpeaker: StoryBeat["speaker"] = "Narrador";
  private typingIndex = 0;
  private locationCard?: Phaser.GameObjects.Container;
  private whisperText?: Phaser.GameObjects.Text;
  private currentPace: NonNullable<StoryBeat["pace"]> = "normal";
  private particles!: ParticleField;
  private endCinemaActive = false;
  private cameraTilt = 0;
  private cameraBaseZoom = 1;
  private smsNotification?: Phaser.GameObjects.Container;
  private pendingSmsNotificationSound = false;
  private choicesContainer!: Phaser.GameObjects.Container;
  private choiceButtons: ChoiceButton[] = [];
  private sceneProps: Phaser.GameObjects.Image[] = [];
  private scenePropsSignature = "";
  private memoryMarker?: Phaser.GameObjects.Container;
  private memoryMarkerBaseY = 0;
  private memoryMarkerBaseScale = 0.82;
  private dialogueTimer?: Phaser.Time.TimerEvent;
  private autoAdvanceTimer?: Phaser.Time.TimerEvent;
  private fullDialogueText = "";
  private isTypingDialogue = false;
  private typingShowsChoices = false;
  private cameraTarget = { x: 480, y: 270 };
  private cameraDrift = { x: 0, y: 0, speed: 0.55 };
  private cameraSettling = false;
  private cameraSettleTimer?: Phaser.Time.TimerEvent;
  private backgroundMusic?: HTMLAudioElement;
  private backgroundMusicElements = new Set<HTMLAudioElement>();
  private activeMusicUrl?: string;
  private triedBackgroundMusic = false;
  private audioSessionId = 0;
  private awaitingChoice = false;
  private guidesVisible = true;
  private audioEnabled = true;
  private isTransitioning = false;
  private readonly forceStopAudioHandler = () => this.forceDisableAudio();

  constructor() {
    super("StoryScene");
  }

  init(data: StorySceneData) {
    this.chapter = chapters.find((chapter) => chapter.id === data.chapterId) ?? chapters[0];
    const startBeatIndex = data.startBeatId
      ? this.chapter.beats.findIndex((beat) => beat.id === data.startBeatId)
      : -1;
    this.beatIndex = startBeatIndex >= 0 ? startBeatIndex : 0;
    this.progress = loadProgress();
    this.guidesVisible = true;
    this.isTransitioning = false;
    this.awaitingChoice = false;
    this.choiceButtons = [];
    this.sceneProps = [];
    this.scenePropsSignature = "";
    this.dialogueTimer?.remove(false);
    this.autoAdvanceTimer?.remove(false);
    this.cameraSettleTimer?.remove(false);
    this.dialogueTimer = undefined;
    this.autoAdvanceTimer = undefined;
    this.cameraSettleTimer = undefined;
    this.fullDialogueText = "";
    this.isTypingDialogue = false;
    this.typingShowsChoices = false;
    this.cameraTarget = { x: 480, y: 270 };
    this.cameraDrift = { x: 0, y: 0, speed: 0.55 };
    this.cameraSettling = false;
    this.stopAllAudioNow();
    this.triedBackgroundMusic = false;
    this.audioEnabled = true;
    this.smsNotification?.destroy();
    this.smsNotification = undefined;
    this.pendingSmsNotificationSound = false;
    this.locationCard?.destroy();
    this.locationCard = undefined;
    this.whisperText?.destroy();
    this.whisperText = undefined;
    this.heartbeatIntensity = 0;
    this.heartbeatPulse = 0;
    this.currentPace = "normal";
    this.endCinemaActive = false;
    this.cameraTilt = 0;
    this.cameraBaseZoom = 1;
    this.currentSpeaker = "Narrador";
    this.typingIndex = 0;
    this.godraysShafts = [];
    this.gradedLocation = undefined;
  }

  create() {
    this.cameras.main.setBackgroundColor("#090b10");
    this.map = new PixelMapRenderer(this);
    this.particles = new ParticleField(this);
    this.actors = {
      alexis: new CharacterActor(this, "alexis", 360, 430, 0),
      kiara: new CharacterActor(this, "kiara", 540, 430, 0.8)
    };

    if (this.ambience) {
      this.ambience.destroy();
    }
    this.ambience = new AmbienceEngine();
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.shutdownAudioLifecycle();
    });
    window.addEventListener(FORCE_STOP_AUDIO_EVENT, this.forceStopAudioHandler);

    this.createDialogueUi();
    this.createTopControls();
    this.createCinematicUi();
    this.createUiCamera();
    this.applyBeat(this.currentBeat(), true);

    this.input.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
      if (this.isTransitioning) return;
      if (this.pendingSmsNotificationSound) {
        this.pendingSmsNotificationSound = false;
        if (this.audioEnabled) this.playSmsNotificationSound();
      }
      if (this.isPlayerInputLocked()) return;
      if (this.tryToggleAudio(pointer)) return;
      if (this.tryToggleGuides(pointer)) return;
      if (this.isTypingDialogue) {
        if (this.tryCollectMemory(pointer)) return;
        this.completeDialogueText();
        return;
      }
      if (this.tryCollectMemory(pointer)) return;
      if (this.trySelectChoice(pointer)) return;
      if (this.awaitingChoice) {
        this.flashToast("Elige una opcion para continuar");
        return;
      }
      this.advance();
    });

    this.input.keyboard?.on("keydown-SPACE", () => this.advance());
    this.input.keyboard?.on("keydown-ENTER", () => this.advance());
    this.input.keyboard?.on("keydown-M", () => this.toggleAudio());
    this.input.keyboard?.on("keydown-H", () => this.toggleGuides());
    this.input.keyboard?.on("keydown-ESC", () => this.scene.start("HomeScene"));

    this.cameras.main.fadeIn(360, 9, 11, 16);
  }

  update(time: number) {
    const seconds = time / 1000;
    this.map.update(seconds);
    this.particles?.update(seconds);
    this.actors.alexis.update(seconds);
    this.actors.kiara.update(seconds);
    this.updateCameraDrift(seconds);
    this.updateHeartbeatPulse();
    this.updateGodrays(seconds);

    if (this.filmGrain) {
      // Jitter the noise each frame so the grain crawls like real film stock.
      this.filmGrain.setTilePosition(Math.random() * 128, Math.random() * 128);
      this.filmGrain.setAlpha(0.04 + Math.random() * 0.025);
    }

    this.promptText.setAlpha(0.45 + Math.sin(seconds * 4) * 0.25);

    this.sceneProps.forEach((prop, index) => {
      const float = (prop.getData("float") as number | undefined) ?? 0;
      const baseY = (prop.getData("baseY") as number | undefined) ?? prop.y;
      if (float > 0) {
        prop.setY(baseY + Math.sin(seconds * 1.6 + index * 0.7) * float);
      }
    });

    if (this.memoryMarker) {
      this.memoryMarker.setY(this.memoryMarkerBaseY + Math.sin(seconds * 2.8) * 3);
      this.memoryMarker.setScale(this.memoryMarkerBaseScale * (1 + Math.sin(seconds * 5) * 0.08));
      this.memoryMarker.rotation = Math.sin(seconds * 1.6) * 0.025;
    }
  }

  private createDialogueUi() {
    this.dialogueBox = this.add.container(50, 376).setDepth(80);
    this.dialogueBox.setScrollFactor(0);
    this.dialogueBg = this.add
      .rectangle(0, 0, 860, 128, 0x181d25, 0.92)
      .setOrigin(0)
      .setStrokeStyle(3, 0x697383);
    this.dialogueAccent = this.add.rectangle(0, 0, 6, 128, 0x9fb0c4, 0.95).setOrigin(0);
    this.speakerText = this.add.text(24, 18, "", {
      fontFamily: "Courier New",
      fontSize: "20px",
      fontStyle: "bold",
      color: "#e79037"
    });
    this.dialogueText = this.add.text(24, 48, "", {
      fontFamily: "Courier New",
      fontSize: "20px",
      color: "#fff2dc",
      lineSpacing: 5,
      wordWrap: { width: 780 }
    });
    this.promptText = this.add
      .text(748, 98, "toca para seguir", {
        fontFamily: "Courier New",
        fontSize: "14px",
        color: "#b7b0a5"
      })
      .setOrigin(0, 0.5);

    this.dialogueBox.add([this.dialogueBg, this.dialogueAccent, this.speakerText, this.dialogueText, this.promptText]);

    this.choicesContainer = this.add.container(72, 250).setDepth(82);
    this.choicesContainer.setScrollFactor(0);
  }

  private createTopControls() {
    this.locationText = this.add
      .text(32, 28, "", {
        fontFamily: "Courier New",
        fontSize: "16px",
        fontStyle: "bold",
        color: "#53b6b2",
        backgroundColor: "#10131acc",
        padding: { x: 12, y: 8 }
      })
      .setDepth(85)
      .setScrollFactor(0);

    this.scoreText = this.add
      .text(32, 70, "", {
        fontFamily: "Courier New",
        fontSize: "14px",
        fontStyle: "bold",
        color: "#fff2dc",
        backgroundColor: "#10131acc",
        padding: { x: 12, y: 8 }
      })
      .setDepth(85)
      .setScrollFactor(0);

    this.memoryCounterText = this.add
      .text(32, 112, "", {
        fontFamily: "Courier New",
        fontSize: "14px",
        fontStyle: "bold",
        color: "#fff2dc",
        backgroundColor: "#10131acc",
        padding: { x: 12, y: 8 }
      })
      .setDepth(85)
      .setScrollFactor(0);

    this.guideToggle = this.add
      .text(808, 28, "guias: on", {
        fontFamily: "Courier New",
        fontSize: "16px",
        fontStyle: "bold",
        color: "#fff2dc",
        backgroundColor: "#10131acc",
        padding: { x: 12, y: 8 }
      })
      .setDepth(85)
      .setScrollFactor(0)
      .setInteractive({ useHandCursor: true });

    this.audioToggle = this.add
      .text(808, 70, `audio: ${this.audioEnabled ? "on" : "off"}`, {
        fontFamily: "Courier New",
        fontSize: "16px",
        fontStyle: "bold",
        color: "#fff2dc",
        backgroundColor: "#10131acc",
        padding: { x: 12, y: 8 }
      })
      .setDepth(85)
      .setScrollFactor(0)
      .setInteractive({ useHandCursor: true });

    this.updateScoreText();
    this.updateMemoryCounterText();
  }

  private createCinematicUi() {
    // Color grade sits lowest of the overlays and multiplies the scene to give
    // each location a cohesive cinematic palette.
    this.colorGradeOverlay = this.add
      .rectangle(0, 0, 960, 540, 0xffffff, 0)
      .setOrigin(0)
      .setDepth(70)
      .setScrollFactor(0)
      .setBlendMode(Phaser.BlendModes.MULTIPLY);

    this.warmthOverlay = this.add
      .rectangle(0, 0, 960, 540, 0xffd7a3, 0)
      .setOrigin(0)
      .setDepth(72)
      .setScrollFactor(0);

    this.vignetteTop = this.add.rectangle(0, 0, 960, 96, 0x05070a, 0).setOrigin(0).setDepth(73).setScrollFactor(0);
    this.vignetteBottom = this.add
      .rectangle(0, 444, 960, 96, 0x05070a, 0)
      .setOrigin(0)
      .setDepth(73)
      .setScrollFactor(0);
    this.vignetteLeft = this.add.rectangle(0, 0, 92, 540, 0x05070a, 0).setOrigin(0).setDepth(73).setScrollFactor(0);
    this.vignetteRight = this.add
      .rectangle(868, 0, 92, 540, 0x05070a, 0)
      .setOrigin(0)
      .setDepth(73)
      .setScrollFactor(0);

    this.cinematicTopBar = this.add
      .rectangle(0, 0, 960, 0, 0x05070a, 0)
      .setOrigin(0)
      .setDepth(74)
      .setScrollFactor(0);
    this.cinematicBottomBar = this.add
      .rectangle(0, 540, 960, 0, 0x05070a, 0)
      .setOrigin(0)
      .setDepth(74)
      .setScrollFactor(0);

    this.heartbeatOverlay = this.add
      .rectangle(0, 0, 960, 540, 0xc8243b, 0)
      .setOrigin(0)
      .setDepth(71)
      .setScrollFactor(0);
    this.bloomOverlay = this.add
      .rectangle(0, 0, 960, 540, 0xfff2dc, 0)
      .setOrigin(0)
      .setDepth(72)
      .setScrollFactor(0);
    this.chromaticOverlay = this.add
      .rectangle(0, 0, 960, 540, 0xff7aa8, 0)
      .setOrigin(0)
      .setDepth(72)
      .setScrollFactor(0)
      .setBlendMode(Phaser.BlendModes.SCREEN);

    this.createGodrays();
    this.createFilmGrain();
  }

  // A faint, animated film-grain veil over the whole picture (but under the
  // dialogue UI) for an organic, celluloid texture. Built from a one-time noise
  // canvas tiled across the screen; if texture creation fails we skip silently.
  private createFilmGrain() {
    const key = "film-grain-noise";
    try {
      if (!this.textures.exists(key)) {
        const size = 128;
        const canvas = document.createElement("canvas");
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        const image = ctx.createImageData(size, size);
        for (let i = 0; i < image.data.length; i += 4) {
          const v = Math.floor(Math.random() * 255);
          image.data[i] = v;
          image.data[i + 1] = v;
          image.data[i + 2] = v;
          image.data[i + 3] = 255;
        }
        ctx.putImageData(image, 0, 0);
        this.textures.addCanvas(key, canvas);
      }
      this.filmGrain = this.add
        .tileSprite(0, 0, 960, 540, key)
        .setOrigin(0)
        .setDepth(78)
        .setScrollFactor(0)
        .setAlpha(0.05)
        .setBlendMode(Phaser.BlendModes.SCREEN);
    } catch (e) {
      console.warn("Film grain unavailable:", e);
      this.filmGrain = undefined;
    }
  }

  // Soft diagonal light shafts that pour in from the upper-left. Screen-blended
  // so they read as warm sun, not paint. The container alpha is driven per beat
  // by cinematic.godrays; individual shafts shimmer in update().
  private createGodrays() {
    this.godraysContainer = this.add
      .container(0, 0)
      .setDepth(72)
      .setAlpha(0)
      .setScrollFactor(0)
      .setBlendMode(Phaser.BlendModes.SCREEN);

    const shaftColors = [0xfff2dc, 0xffe6c0, 0xfff7e2];
    this.godraysShafts = [];
    for (let i = 0; i < 6; i += 1) {
      const shaft = this.add
        .rectangle(120 + i * 150, 270, 46 + (i % 3) * 18, 1100, shaftColors[i % shaftColors.length], 0.24)
        .setOrigin(0.5)
        .setAngle(24)
        .setBlendMode(Phaser.BlendModes.SCREEN);
      shaft.setData("baseAlpha", 0.2 + (i % 3) * 0.06);
      shaft.setData("baseX", 120 + i * 150);
      shaft.setData("phase", i * 1.3);
      this.godraysContainer.add(shaft);
      this.godraysShafts.push(shaft);
    }
  }

  private createUiCamera() {
    const uiObjects: Phaser.GameObjects.GameObject[] = [
      this.dialogueBox,
      this.choicesContainer,
      this.locationText,
      this.scoreText,
      this.memoryCounterText,
      this.guideToggle,
      this.audioToggle,
      this.warmthOverlay,
      this.vignetteTop,
      this.vignetteBottom,
      this.vignetteLeft,
      this.vignetteRight,
      this.cinematicTopBar,
      this.cinematicBottomBar,
      this.heartbeatOverlay,
      this.bloomOverlay,
      this.chromaticOverlay,
      this.godraysContainer,
      this.colorGradeOverlay
    ];
    if (this.filmGrain) uiObjects.push(this.filmGrain);
    const worldObjects = [
      ...this.map.getRenderObjects(),
      this.particles.getRenderObject(),
      this.actors.alexis.getRenderObject(),
      this.actors.kiara.getRenderObject()
    ];

    this.uiCamera = this.cameras.add(0, 0, 960, 540, false, "ui");
    this.uiCamera.setScroll(0, 0);
    this.uiCamera.setZoom(1);
    this.cameras.main.ignore(uiObjects);
    this.uiCamera.ignore(worldObjects);
  }

  private updateCameraDrift(seconds: number) {
    if (this.cameraSettling) return;

    // Authored drift (parallax-style sweep) plus a tiny layered "handheld"
    // breath so even a locked-off frame feels held by a person, never frozen.
    const driftX = Math.sin(seconds * this.cameraDrift.speed) * this.cameraDrift.x;
    const driftY = Math.cos(seconds * this.cameraDrift.speed * 0.82) * this.cameraDrift.y;
    const breathX = Math.sin(seconds * 0.9) * 0.6 + Math.sin(seconds * 1.7 + 1.3) * 0.32;
    const breathY = Math.cos(seconds * 0.8) * 0.5 + Math.sin(seconds * 1.3 + 0.7) * 0.28;

    this.cameras.main.centerOn(this.cameraTarget.x + driftX + breathX, this.cameraTarget.y + driftY + breathY);
  }

  private applyCinematicMood(beat: StoryBeat, immediate = false) {
    const cinematic = beat.cinematic;
    const duration = immediate ? 0 : 460;
    const letterboxHeight =
      typeof cinematic?.letterbox === "number" ? cinematic.letterbox : cinematic?.letterbox ? 28 : 0;
    const letterboxAlpha = letterboxHeight > 0 ? 0.78 : 0;
    const warmth = cinematic?.warmth ?? 0;
    const vignette = cinematic?.vignette ?? 0;

    const applyNow = () => {
      this.cinematicTopBar.setAlpha(letterboxAlpha).setDisplaySize(960, letterboxHeight);
      this.cinematicBottomBar
        .setY(540 - letterboxHeight)
        .setAlpha(letterboxAlpha)
        .setDisplaySize(960, letterboxHeight);
      this.warmthOverlay.setAlpha(warmth);
      [this.vignetteTop, this.vignetteBottom, this.vignetteLeft, this.vignetteRight].forEach((edge) =>
        edge.setAlpha(vignette)
      );
    };

    if (immediate) {
      applyNow();
    } else {
      this.tweens.add({
        targets: this.cinematicTopBar,
        alpha: letterboxAlpha,
        displayHeight: letterboxHeight,
        duration,
        ease: "Sine.easeInOut"
      });
      this.tweens.add({
        targets: this.cinematicBottomBar,
        y: 540 - letterboxHeight,
        alpha: letterboxAlpha,
        displayHeight: letterboxHeight,
        duration,
        ease: "Sine.easeInOut"
      });
      this.tweens.add({
        targets: this.warmthOverlay,
        alpha: warmth,
        duration,
        ease: "Sine.easeInOut"
      });
      this.tweens.add({
        targets: [this.vignetteTop, this.vignetteBottom, this.vignetteLeft, this.vignetteRight],
        alpha: vignette,
        duration,
        ease: "Sine.easeInOut"
      });
    }

    if (!immediate && cinematic?.flash) {
      this.cameras.main.flash(360, 255, 226, 190, false);
    }

    if (!immediate && cinematic?.shake) {
      this.cameras.main.shake(cinematic.shakeDuration ?? 220, cinematic.shake);
    }

    if (!immediate && cinematic?.magicShift) {
      this.playMagicSceneShift();
    }

    const bloom = cinematic?.bloom ?? 0;
    this.tweens.add({
      targets: this.bloomOverlay,
      alpha: bloom,
      duration: immediate ? 0 : 640,
      ease: "Sine.easeOut"
    });

    const chromatic = cinematic?.chromatic ? 0.18 : 0;
    this.tweens.add({
      targets: this.chromaticOverlay,
      alpha: chromatic,
      duration: immediate ? 0 : 520,
      ease: "Sine.easeInOut"
    });

    const slowmo = cinematic?.slowmo ?? 0;
    const targetScale = slowmo > 0 ? 1 - Math.max(0, Math.min(0.7, slowmo)) : 1;
    this.time.timeScale = targetScale;

    const godrays = cinematic?.godrays ?? 0;
    this.tweens.add({
      targets: this.godraysContainer,
      alpha: godrays,
      duration: immediate ? 0 : 900,
      ease: "Sine.easeInOut"
    });

    if (!immediate && cinematic?.petals) {
      this.spawnPetals();
    }
  }

  private currentBeat() {
    return this.chapter.beats[this.beatIndex];
  }

  private isKissHeartbeatBeat(beat: StoryBeat) {
    return beat.id === "first-kiss";
  }

  private heartbeatForBeat(beat: StoryBeat) {
    if (!this.isKissHeartbeatBeat(beat)) return 0;
    return Math.max(0.9, beat.cinematic?.heartbeat ?? 0.92);
  }

  private applyBeat(beat: StoryBeat, immediate = false) {
    const previousLocation = (this as { _prevLocation?: LocationId })._prevLocation;
    this.autoAdvanceTimer?.remove(false);
    this.autoAdvanceTimer = undefined;
    this.map.setLocation(beat.location);
    this.particles.setLocation(beat.location, immediate);
    this.applyColorGrade(beat.location, immediate);
    if (this.audioEnabled) {
      this.ambience.setLocationAmbience(beat.location, immediate);
      void this.updateBackgroundMusicForLocation(beat.location);
    }
    this.locationText.setText(`${this.chapter.title}  /  ${locationLabels[beat.location]}`);
    this.setSpeaker(beat.speaker, immediate);
    this.clearChoices();
    this.currentPace = beat.pace ?? "normal";
    if (beat.cinematic?.persistDialogue) {
      if (beat.text) this.fullDialogueText = beat.text;
      this.dialogueTimer?.remove(false);
      this.dialogueTimer = undefined;
      this.dialogueText.setText(this.fullDialogueText);
      this.isTypingDialogue = false;
      this.typingShowsChoices = false;
      this.scheduleAutoAdvance(beat);
    } else {
      this.startDialogueText(beat.text, Boolean(beat.choices?.length));
    }
    this.dialogueBox.setVisible(!beat.cinematic?.hideDialogue);

    this.actors.alexis.applyBeat(beat.actors.alexis, immediate);
    this.actors.kiara.applyBeat(beat.actors.kiara, immediate);
    this.renderSceneProps(beat.props ?? [], immediate);
    this.updateMemoryMarker(beat, immediate);
    this.updateSmsNotification(beat, immediate);
    this.applyCinematicMood(beat, immediate);

    const heartbeat = this.heartbeatForBeat(beat);
    this.heartbeatIntensity = heartbeat;
    if (!immediate && heartbeat > 0) {
      this.heartbeatPulse = Math.max(this.heartbeatPulse, 0.65);
    }
    if (this.audioEnabled) {
      this.ambience.setHeartbeat(heartbeat);
      this.ambience.setIntimate(Boolean(beat.cinematic?.intimate), immediate);
      if (!immediate && this.isKissHeartbeatBeat(beat)) {
        this.ambience.playKissMomentSound();
      }
    }

    if (previousLocation !== beat.location) {
      const card = beat.cinematic?.locationCard;
      this.time.delayedCall(immediate ? 380 : 0, () => {
        if (card) {
          this.showLocationCard(card.title, card.subtitle);
        } else {
          this.showLocationCard(locationLabels[beat.location]);
        }
      });
    }

    this.showWhisper(beat.cinematic?.whisper);

    (this as { _prevLocation?: LocationId })._prevLocation = beat.location;

    const zoom = beat.camera?.zoom ?? 1;
    const x = beat.camera?.x ?? 480;
    const y = beat.camera?.y ?? 270;
    const duration = immediate ? 0 : (beat.camera?.duration ?? 520);
    this.cameraTarget = { x, y };
    this.cameraDrift = {
      x: beat.camera?.driftX ?? 0,
      y: beat.camera?.driftY ?? 0,
      speed: beat.camera?.driftSpeed ?? 0.55
    };
    this.cameraSettling = duration > 0;
    this.cameraSettleTimer?.remove(false);
    if (duration > 0) {
      this.cameraSettleTimer = this.time.delayedCall(duration + 80, () => {
        this.cameraSettling = false;
      });
    }

    this.cameraBaseZoom = zoom;
    this.cameras.main.pan(x, y, duration, "Sine.easeInOut");
    this.cameras.main.zoomTo(zoom, duration, "Sine.easeInOut");

    this.cameraTilt = 0;
  }

  private advance(fromAuto = false) {
    if (!fromAuto && this.isPlayerInputLocked()) {
      return;
    }

    this.autoAdvanceTimer?.remove(false);
    this.autoAdvanceTimer = undefined;

    if (this.isTypingDialogue) {
      this.completeDialogueText();
      return;
    }

    if (this.awaitingChoice) {
      this.flashToast("Elige una opcion para continuar");
      return;
    }

    const beat = this.currentBeat();

    if (beat.completeChapter) {
      this.finishChapter();
      return;
    }

    if (this.beatIndex < this.chapter.beats.length - 1) {
      this.beatIndex += 1;
      this.applyBeat(this.currentBeat());
      return;
    }

    this.finishChapter();
  }

  private finishChapter() {
    if (this.endCinemaActive) return;
    this.endCinemaActive = true;

    const currentIndex = chapters.findIndex((chapter) => chapter.id === this.chapter.id);
    const nextChapter = chapters[currentIndex + 1];

    completeChapter(this.progress, this.chapter.id);
    if (nextChapter) unlockChapter(this.progress, nextChapter.id);
    saveProgress(this.progress);

    this.runEndCinematic(() => {
      this.fadeOutBackgroundMusic();
      this.isTransitioning = true;
      this.cameras.main.fadeOut(640, 9, 11, 16);
      this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
        this.scene.start("HomeScene");
      });
    });
  }

  private runEndCinematic(onContinue: () => void) {
    this.isTransitioning = true;
    this.heartbeatIntensity = 0;
    this.tweens.add({
      targets: this.cinematicTopBar,
      alpha: 1,
      displayHeight: 90,
      duration: 1400,
      ease: "Sine.easeInOut"
    });
    this.tweens.add({
      targets: this.cinematicBottomBar,
      y: 450,
      alpha: 1,
      displayHeight: 90,
      duration: 1400,
      ease: "Sine.easeInOut"
    });
    this.tweens.add({
      targets: this.warmthOverlay,
      alpha: 0.18,
      duration: 1400,
      ease: "Sine.easeInOut"
    });
    this.tweens.add({
      targets: [this.vignetteTop, this.vignetteBottom, this.vignetteLeft, this.vignetteRight],
      alpha: 0.45,
      duration: 1400,
      ease: "Sine.easeInOut"
    });
    this.cameras.main.zoomTo(1.08, 1800, "Sine.easeInOut");

    const chapterMemoryIds = new Set(
      this.chapter.beats.flatMap((beat) => (beat.memory ? [beat.memory.id] : []))
    );
    const collected = this.progress.memories.filter((m) => chapterMemoryIds.has(m.id)).length;
    const total = chapterMemoryIds.size;

    const overlay = this.add
      .rectangle(0, 0, 960, 540, 0x05070a, 0)
      .setOrigin(0)
      .setDepth(95)
      .setScrollFactor(0);
    this.cameras.main.ignore(overlay);
    this.tweens.add({
      targets: overlay,
      alpha: 0.72,
      duration: 1400,
      ease: "Sine.easeInOut"
    });

    this.time.delayedCall(900, () => {
      const credits = this.add.container(480, 270).setDepth(96).setScrollFactor(0);
      const dedicatoria = this.add
        .text(0, -110, "PARA KIARA", {
          fontFamily: "Courier New",
          fontSize: "16px",
          color: "#c79bff",
          fontStyle: "bold"
        })
        .setOrigin(0.5)
        .setAlpha(0);
      const heart = this.add
        .text(0, -84, "❤", {
          fontFamily: "Courier New",
          fontSize: "20px",
          color: "#ff7aa8"
        })
        .setOrigin(0.5)
        .setAlpha(0);
      const title = this.add
        .text(0, -36, this.chapter.title, {
          fontFamily: "Courier New",
          fontSize: "32px",
          fontStyle: "bold",
          color: "#fff2dc"
        })
        .setOrigin(0.5)
        .setAlpha(0);
      const subtitle = this.add
        .text(0, 6, `Capitulo ${this.chapter.number}`, {
          fontFamily: "Courier New",
          fontSize: "14px",
          color: "#b7b0a5"
        })
        .setOrigin(0.5)
        .setAlpha(0);
      const quote = this.add
        .text(0, 44, "Y todavia nos sigue viendo.", {
          fontFamily: "Courier New",
          fontSize: "16px",
          fontStyle: "italic",
          color: "#e79037"
        })
        .setOrigin(0.5)
        .setAlpha(0);
      const memorySummary = this.add
        .text(0, 86, `Recuerdos guardados  ${collected} / ${total}`, {
          fontFamily: "Courier New",
          fontSize: "14px",
          color: "#fff2dc"
        })
        .setOrigin(0.5)
        .setAlpha(0);
      const { ternura, nervios, sueno } = this.progress.storyStats;
      const stats = this.add
        .text(0, 110, `ternura ${ternura}   nervios ${nervios}   sueno ${sueno}`, {
          fontFamily: "Courier New",
          fontSize: "12px",
          color: "#8fe8ff"
        })
        .setOrigin(0.5)
        .setAlpha(0);
      const continueHint = this.add
        .text(0, 152, "toca para volver al cuarto de recuerdos", {
          fontFamily: "Courier New",
          fontSize: "13px",
          color: "#b7b0a5"
        })
        .setOrigin(0.5)
        .setAlpha(0);

      credits.add([dedicatoria, heart, title, subtitle, quote, memorySummary, stats, continueHint]);
      this.cameras.main.ignore(credits);

      const sequence = [dedicatoria, heart, title, subtitle, quote, memorySummary, stats, continueHint];
      const revealStepMs = 320;
      const revealDurationMs = 720;
      sequence.forEach((item, index) => {
        this.tweens.add({
          targets: item,
          alpha: item === continueHint ? 0.7 : 1,
          y: (item as Phaser.GameObjects.Text).y - 6,
          delay: index * revealStepMs,
          duration: revealDurationMs,
          ease: "Sine.easeOut"
        });
      });

      this.tweens.add({
        targets: continueHint,
        alpha: 0.35,
        delay: sequence.length * revealStepMs + 900,
        duration: 900,
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut"
      });

      let continued = false;
      const continueAfterCredits = () => {
        if (continued) return;
        continued = true;
        this.tweens.add({
          targets: [overlay, credits],
          alpha: 0,
          duration: 600,
          ease: "Sine.easeIn"
        });
        this.time.delayedCall(620, () => onContinue());
      };

      const continueReadyDelay = (sequence.length - 1) * revealStepMs + revealDurationMs + 180;
      this.time.delayedCall(continueReadyDelay, () => {
        this.input.once("pointerdown", continueAfterCredits);
        this.input.keyboard?.once("keydown-SPACE", continueAfterCredits);
        this.input.keyboard?.once("keydown-ENTER", continueAfterCredits);
      });
    });
  }

  private updateMemoryMarker(beat: StoryBeat, immediate = false) {
    this.memoryMarker?.destroy();
    this.memoryMarker = undefined;
    this.memoryMarkerBaseY = 0;
    this.memoryMarkerBaseScale = 0.82;

    if (!beat.memory) return;
    const isCollected = this.progress.memories.some((memory) => memory.id === beat.memory?.id);

    const marker = this.add.container(beat.memory.x, beat.memory.y).setDepth(70);
    this.memoryMarkerBaseY = beat.memory.y;
    this.memoryMarkerBaseScale = 0.62;
    this.uiCamera?.ignore(marker);

    const accent = isCollected ? 0xb783ff : 0xc79bff;
    const gemColor = 0x2a1638;
    const deepAccent = isCollected ? 0x201026 : 0x2c1438;
    const haloOuter = this.add.ellipse(0, 0, 96, 62, 0x9b6dff, isCollected ? 0.12 : 0.16);
    const haloMiddle = this.add.ellipse(0, 0, 70, 44, 0x8fe8ff, isCollected ? 0.07 : 0.1);
    const haloInner = this.add.ellipse(0, 0, 36, 26, 0xe7d6ff, 0.07);
    const orbitA = this.add.ellipse(0, 0, 70, 38, 0xffffff, 0).setStrokeStyle(1, accent, 0.5);
    const orbitB = this.add.ellipse(0, 0, 52, 50, 0xffffff, 0).setStrokeStyle(1, 0x8fe8ff, 0.3);
    orbitB.setAngle(-22);

    const gemShadow = this.add.polygon(3, 5, [0, -18, 17, -2, 8, 15, 0, 21, -8, 15, -17, -2], 0x05070a, 0.44);
    const gem = this.add.polygon(0, 0, [0, -21, 20, -3, 10, 18, 0, 24, -10, 18, -20, -3], gemColor, 0.76);
    gem.setStrokeStyle(3, deepAccent, 0.95);
    const gemEdge = this.add.polygon(0, 0, [0, -21, 20, -3, 10, 18, 0, 24, -10, 18, -20, -3], 0xffffff, 0);
    gemEdge.setStrokeStyle(1, accent, 0.86);
    const innerGlow = this.add.ellipse(0, 0, 27, 35, 0x8fe8ff, 0.13);
    const gemFacetTop = this.add.polygon(0, -9, [0, -9, 12, 0, 0, 5, -12, 0], 0xe7d6ff, 0.16);
    const gemFacetBottom = this.add.polygon(0, 8, [0, -2, 8, 7, 0, 12, -8, 7], 0x8fe8ff, 0.08);
    const gemShine = this.add.polygon(-4, -7, [0, -7, 6, -2, 2, 5, -5, 0], 0xffffff, 0.46);
    const coreSpark = this.add.polygon(0, -1, [0, -8, 3, -2, 8, 0, 3, 2, 0, 8, -3, 2, -8, 0, -3, -2], 0xf2e7ff, 0.54);
    const makeTwinkle = (x: number, y: number, scale: number, alpha: number) =>
      this.add
        .polygon(x, y, [0, -8, 2, -2, 8, 0, 2, 2, 0, 8, -2, 2, -8, 0, -2, -2], 0xf2e7ff, alpha)
        .setScale(scale);

    const orbitSparks = [
      this.add.text(-44, -10, "*", {
        fontFamily: "Courier New",
        fontSize: "15px",
        fontStyle: "bold",
        color: "#f2e7ff"
      }),
      this.add.text(38, -16, "+", {
        fontFamily: "Courier New",
        fontSize: "12px",
        fontStyle: "bold",
        color: "#d8fbff"
      }),
      this.add.text(44, 10, ".", {
        fontFamily: "Courier New",
        fontSize: "17px",
        fontStyle: "bold",
        color: "#c79bff"
      }),
      this.add.text(-34, 18, "+", {
        fontFamily: "Courier New",
        fontSize: "12px",
        fontStyle: "bold",
        color: "#f2e7ff"
      })
    ].map((sparkle) => sparkle.setOrigin(0.5));
    const twinkles = [
      makeTwinkle(-38, -27, 0.52, 0.66),
      makeTwinkle(38, -25, 0.4, 0.6),
      makeTwinkle(42, 22, 0.42, 0.54),
      makeTwinkle(-32, 26, 0.36, 0.58)
    ];

    marker.add([
      haloOuter,
      haloMiddle,
      haloInner,
      orbitA,
      orbitB,
      gemShadow,
      gem,
      innerGlow,
      gemFacetTop,
      gemFacetBottom,
      gemEdge,
      gemShine,
      coreSpark,
      ...twinkles,
      ...orbitSparks
    ]);
    marker.setAlpha(0);
    marker.setScale(this.memoryMarkerBaseScale * 0.78);
    marker.setVisible(true);
    this.memoryMarker = marker;

    this.tweens.add({
      targets: marker,
      alpha: 1,
      scale: this.memoryMarkerBaseScale,
      duration: 360,
      ease: "Back.easeOut"
    });
    this.tweens.add({
      targets: haloOuter,
      alpha: 0.28,
      scaleX: 1.18,
      scaleY: 1.18,
      yoyo: true,
      repeat: -1,
      duration: 1200,
      ease: "Sine.easeInOut"
    });
    this.tweens.add({
      targets: haloMiddle,
      alpha: isCollected ? 0.24 : 0.32,
      scaleX: 1.1,
      scaleY: 1.1,
      yoyo: true,
      repeat: -1,
      duration: 920,
      ease: "Sine.easeInOut"
    });
    this.tweens.add({
      targets: orbitA,
      angle: 360,
      repeat: -1,
      duration: 5200,
      ease: "Linear"
    });
    this.tweens.add({
      targets: orbitB,
      angle: -382,
      repeat: -1,
      duration: 6200,
      ease: "Linear"
    });
    this.tweens.add({
      targets: [...orbitSparks, ...twinkles],
      alpha: 0.22,
      scaleX: 0.82,
      scaleY: 0.82,
      yoyo: true,
      repeat: -1,
      duration: 720,
      ease: "Sine.easeInOut"
    });
    this.tweens.add({
      targets: gemShine,
      alpha: 0.72,
      x: 4,
      y: -15,
      yoyo: true,
      repeat: -1,
      duration: 1100,
      ease: "Sine.easeInOut"
    });
    this.tweens.add({
      targets: innerGlow,
      alpha: 0.26,
      scaleX: 1.18,
      scaleY: 1.08,
      yoyo: true,
      repeat: -1,
      duration: 980,
      ease: "Sine.easeInOut"
    });
    this.tweens.add({
      targets: coreSpark,
      alpha: 0.18,
      scaleX: 0.82,
      scaleY: 0.82,
      yoyo: true,
      repeat: -1,
      duration: 900,
      ease: "Sine.easeInOut"
    });

    if (!immediate) {
      this.playMemoryRevealChime();
    }
  }

  private tryCollectMemory(pointer: Phaser.Input.Pointer) {
    const beat = this.currentBeat();
    if (!beat.memory || !this.memoryMarker) return false;

    const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
    const distance = Phaser.Math.Distance.Between(worldPoint.x, worldPoint.y, beat.memory.x, beat.memory.y);

    if (distance > 70) return false;

    const isCollected = this.progress.memories.some((memory) => memory.id === beat.memory?.id);
    if (isCollected) {
      this.playMemoryRevealChime();
      const recalledMarker = this.memoryMarker;
      this.memoryMarker = undefined;
      this.memoryMarkerBaseY = 0;
      this.memoryMarkerBaseScale = 0.82;
      this.playMemoryCollectBurst(recalledMarker.x, recalledMarker.y, "recordado");
      this.tweens.add({
        targets: recalledMarker,
        alpha: 0,
        scale: 1.25,
        angle: 16,
        y: recalledMarker.y - 20,
        duration: 460,
        ease: "Sine.easeOut",
        onComplete: () => recalledMarker.destroy()
      });
      this.flashToast(`Recuerdo: ${beat.memory.label}`);
      return true;
    }

    addMemory(this.progress, {
      id: beat.memory.id,
      label: beat.memory.label,
      text: beat.memory.text
    });
    this.playMemoryChime();
    saveProgress(this.progress);
    this.updateMemoryCounterText();
    const collectedMarker = this.memoryMarker;
    this.memoryMarker = undefined;
    this.memoryMarkerBaseY = 0;
    this.memoryMarkerBaseScale = 0.82;
    if (collectedMarker) {
      this.playMemoryCollectBurst(collectedMarker.x, collectedMarker.y, "guardado");
      this.tweens.add({
        targets: collectedMarker,
        alpha: 0,
        scale: 1.45,
        y: collectedMarker.y - 18,
        duration: 420,
        ease: "Sine.easeOut",
        onComplete: () => collectedMarker.destroy()
      });
    }
    this.flashToast(`Recuerdo guardado: ${beat.memory.label}`);
    return true;
  }

  private updateHeartbeatPulse() {
    this.heartbeatPulse = Math.max(0, this.heartbeatPulse - 0.025);
    const baseGlow = this.heartbeatIntensity * 0.1;
    const pulseGlow = this.heartbeatPulse * 0.14;
    this.heartbeatOverlay.setAlpha(Math.min(0.4, baseGlow + pulseGlow));
  }

  private applyColorGrade(location: LocationId, immediate = false) {
    if (this.gradedLocation === location && !immediate) return;
    this.gradedLocation = location;
    const grade = colorGrades[location] ?? { color: 0xffffff, alpha: 0 };

    if (immediate) {
      this.colorGradeOverlay.setFillStyle(grade.color, 1);
      this.colorGradeOverlay.setAlpha(grade.alpha);
      return;
    }

    // Dip the wash out, swap the hue, then ease the new palette in so the grade
    // dissolves between locations instead of snapping.
    this.tweens.killTweensOf(this.colorGradeOverlay);
    this.tweens.add({
      targets: this.colorGradeOverlay,
      alpha: 0,
      duration: 240,
      ease: "Sine.easeIn",
      onComplete: () => {
        this.colorGradeOverlay.setFillStyle(grade.color, 1);
        this.tweens.add({
          targets: this.colorGradeOverlay,
          alpha: grade.alpha,
          duration: 560,
          ease: "Sine.easeOut"
        });
      }
    });
  }

  private updateGodrays(seconds: number) {
    if (this.godraysContainer.alpha <= 0.001) return;
    for (const shaft of this.godraysShafts) {
      const phase = shaft.getData("phase") as number;
      const baseAlpha = shaft.getData("baseAlpha") as number;
      const baseX = shaft.getData("baseX") as number;
      shaft.setAlpha(baseAlpha * (0.6 + 0.4 * Math.sin(seconds * 0.6 + phase)));
      shaft.setX(baseX + Math.sin(seconds * 0.25 + phase) * 14);
    }
  }

  // A slow drift of petals/hearts rising through the frame. Used on the kiss
  // beat to turn a held moment into a soft, swooning bloom.
  private spawnPetals() {
    const glyphs = ["♥", "❀", "✿", "❤"];
    for (let i = 0; i < 16; i += 1) {
      const startX = 120 + Math.random() * 720;
      const startY = 520 + Math.random() * 60;
      const colorHex = i % 3 === 0 ? "#ff7aa8" : i % 3 === 1 ? "#ffd1e3" : "#c79bff";
      const petal = this.add
        .text(startX, startY, glyphs[i % glyphs.length], {
          fontFamily: "Courier New",
          fontSize: `${14 + (i % 4) * 4}px`,
          color: colorHex
        })
        .setOrigin(0.5)
        .setDepth(93)
        .setScrollFactor(0)
        .setAlpha(0);
      this.cameras.main.ignore(petal);

      const rise = 240 + Math.random() * 170;
      const sway = (Math.random() < 0.5 ? -1 : 1) * (30 + Math.random() * 44);
      this.tweens.add({
        targets: petal,
        y: startY - rise,
        x: startX + sway,
        alpha: { from: 0, to: 0.9 },
        angle: sway > 0 ? 42 : -42,
        delay: i * 80,
        duration: 2600 + Math.random() * 1300,
        ease: "Sine.easeOut",
        onComplete: () => {
          this.tweens.add({
            targets: petal,
            alpha: 0,
            duration: 600,
            ease: "Sine.easeIn",
            onComplete: () => petal.destroy()
          });
        }
      });
    }
  }

  private showLocationCard(title: string, subtitle?: string) {
    this.locationCard?.destroy();
    const card = this.add.container(480, 96).setDepth(96).setScrollFactor(0);
    const bg = this.add
      .rectangle(0, 0, 420, 64, 0x05070a, 0.62)
      .setOrigin(0.5)
      .setStrokeStyle(1, 0xfff2dc, 0.32);
    const line = this.add.rectangle(-180, 0, 32, 2, 0xe79037, 0.9).setOrigin(0, 0.5);
    const lineRight = this.add.rectangle(148, 0, 32, 2, 0xe79037, 0.9).setOrigin(0, 0.5);
    const titleText = this.add
      .text(0, subtitle ? -8 : 0, title.toUpperCase(), {
        fontFamily: "Courier New",
        fontSize: "18px",
        fontStyle: "bold",
        color: "#fff2dc"
      })
      .setOrigin(0.5);
    card.add([bg, line, lineRight, titleText]);
    if (subtitle) {
      const subtitleText = this.add
        .text(0, 14, subtitle, {
          fontFamily: "Courier New",
          fontSize: "12px",
          color: "#b7b0a5"
        })
        .setOrigin(0.5);
      card.add(subtitleText);
    }
    card.setAlpha(0);
    this.cameras.main.ignore(card);
    this.locationCard = card;
    this.tweens.add({
      targets: card,
      alpha: 1,
      y: 110,
      duration: 420,
      ease: "Sine.easeOut"
    });
    this.tweens.add({
      targets: card,
      alpha: 0,
      y: 96,
      delay: 1700,
      duration: 520,
      ease: "Sine.easeIn",
      onComplete: () => {
        if (this.locationCard === card) {
          this.locationCard = undefined;
        }
        card.destroy();
      }
    });
  }

  private showWhisper(text?: string) {
    this.whisperText?.destroy();
    this.whisperText = undefined;
    if (!text) return;
    const whisper = this.add
      .text(480, 158, text, {
        fontFamily: "Courier New",
        fontSize: "15px",
        fontStyle: "italic",
        color: "#f2e7ff",
        stroke: "#10131a",
        strokeThickness: 3
      })
      .setOrigin(0.5)
      .setDepth(94)
      .setScrollFactor(0)
      .setAlpha(0);
    this.cameras.main.ignore(whisper);
    this.whisperText = whisper;
    this.tweens.add({
      targets: whisper,
      alpha: 0.85,
      y: 146,
      duration: 600,
      ease: "Sine.easeOut"
    });
    this.tweens.add({
      targets: whisper,
      alpha: 0,
      delay: 2400,
      duration: 700,
      ease: "Sine.easeIn",
      onComplete: () => {
        if (this.whisperText === whisper) this.whisperText = undefined;
        whisper.destroy();
      }
    });
  }

  private flashToast(message: string) {
    const toast = this.add
      .text(480, 102, message, {
        fontFamily: "Courier New",
        fontSize: "18px",
        fontStyle: "bold",
        color: "#fff2dc",
        backgroundColor: "#10131acc",
        padding: { x: 14, y: 10 }
      })
      .setOrigin(0.5)
      .setDepth(100)
      .setScrollFactor(0);
    this.cameras.main.ignore(toast);

    this.tweens.add({
      targets: toast,
      y: 82,
      alpha: 0,
      duration: 1500,
      ease: "Sine.easeIn",
      onComplete: () => toast.destroy()
    });
  }

  private playMagicSceneShift() {
    if (this.audioEnabled) {
      this.ambience.playMagicShiftSound();
    }
    const veil = this.add
      .rectangle(0, 0, 960, 540, 0xe7d6ff, 0)
      .setOrigin(0)
      .setDepth(76)
      .setScrollFactor(0)
      .setBlendMode(Phaser.BlendModes.SCREEN);
    this.cameras.main.ignore(veil);

    this.tweens.add({
      targets: veil,
      alpha: { from: 0, to: 0.2 },
      yoyo: true,
      duration: 620,
      ease: "Sine.easeInOut",
      onComplete: () => veil.destroy()
    });

    const sparkles = Array.from({ length: 18 }, (_, index) => {
      const angle = (Math.PI * 2 * index) / 18;
      const radius = 90 + (index % 5) * 32;
      const x = 480 + Math.cos(angle) * radius;
      const y = 258 + Math.sin(angle) * (radius * 0.42);
      const sparkle = this.add
        .text(x, y, index % 3 === 0 ? "+" : "*", {
          fontFamily: "Courier New",
          fontSize: `${12 + (index % 4) * 3}px`,
          fontStyle: "bold",
          color: index % 2 === 0 ? "#d8fbff" : "#e7d6ff",
          stroke: "#2a1638",
          strokeThickness: 2
        })
        .setOrigin(0.5)
        .setDepth(77)
        .setAlpha(0)
        .setScrollFactor(0);
      this.cameras.main.ignore(sparkle);
      return sparkle;
    });

    sparkles.forEach((sparkle, index) => {
      this.tweens.add({
        targets: sparkle,
        alpha: { from: 0, to: 0.85 },
        x: sparkle.x + Math.sin(index * 1.7) * 22,
        y: sparkle.y - 20 - (index % 4) * 6,
        scale: 1.18,
        delay: index * 18,
        yoyo: true,
        duration: 760,
        ease: "Sine.easeInOut",
        onComplete: () => sparkle.destroy()
      });
    });
  }

  private renderSceneProps(props: SceneProp[], immediate = false) {
    const signature = JSON.stringify(props);
    if (signature === this.scenePropsSignature) return;

    const previousProps = this.sceneProps;
    const fadingProps = new Set<Phaser.GameObjects.Image>();
    const nextProps: Phaser.GameObjects.Image[] = [];
    this.scenePropsSignature = signature;

    props.forEach((propData, index) => {
      const texture = this.resolveScenePropTexture(propData.texture);
      if (!texture) return;

      const alpha = propData.alpha ?? 1;
      const scale = propData.scale ?? 0.46;
      const previous = previousProps[index];

      if (previous?.texture.key === texture) {
        this.tweens.killTweensOf(previous);
        previous
          .setDepth(propData.depth ?? 31)
          .setFlipX(propData.flipX ?? false)
          .setTexture(texture);
        previous.setData("baseY", propData.y);
        previous.setData("float", propData.float ?? 0);
        nextProps.push(previous);

        if (immediate) {
          previous.setPosition(propData.x, propData.y).setScale(scale).setAlpha(alpha);
        } else {
          this.tweens.add({
            targets: previous,
            x: propData.x,
            y: propData.y,
            scaleX: scale,
            scaleY: scale,
            alpha,
            duration: this.isKissFrameTexture(texture) ? 620 : 300,
            ease: "Sine.easeInOut"
          });
        }
        return;
      }

      const softSwap = previous && this.shouldSoftSwapSceneProp(previous.texture.key, texture);
      const prop = this.add
        .image(softSwap ? previous.x : propData.x, softSwap ? previous.y : propData.y, texture)
        .setOrigin(0.5, 1)
        .setDepth(propData.depth ?? 31)
        .setScale(softSwap ? previous.scaleX : scale)
        .setAlpha(immediate ? alpha : 0)
        .setFlipX(propData.flipX ?? false);

      prop.setData("baseY", propData.y);
      prop.setData("float", propData.float ?? 0);
      this.uiCamera?.ignore(prop);
      nextProps.push(prop);

      if (!immediate) {
        const duration = softSwap ? 620 : 300;
        if (softSwap) {
          fadingProps.add(previous);
          this.tweens.killTweensOf(previous);
          this.tweens.add({
            targets: previous,
            alpha: 0,
            duration,
            ease: "Sine.easeInOut",
            onComplete: () => previous.destroy()
          });
        }
        this.tweens.add({
          targets: prop,
          x: propData.x,
          y: propData.y,
          scaleX: scale,
          scaleY: scale,
          alpha,
          duration,
          ease: "Sine.easeInOut"
        });
      }
    });

    previousProps.forEach((previous) => {
      if (nextProps.includes(previous) || fadingProps.has(previous)) return;
      this.tweens.killTweensOf(previous);
      if (immediate) {
        previous.destroy();
        return;
      }
      this.tweens.add({
        targets: previous,
        alpha: 0,
        duration: 260,
        ease: "Sine.easeIn",
        onComplete: () => previous.destroy()
      });
    });

    this.sceneProps = nextProps;
  }

  private shouldSoftSwapSceneProp(previousTexture: string, nextTexture: string) {
    if (previousTexture === nextTexture) return true;
    if (this.isKissFrameTexture(previousTexture) && this.isKissFrameTexture(nextTexture)) return true;
    if (this.isKissFrameTexture(previousTexture) && nextTexture.startsWith("couple-post-kiss-")) return true;
    if (previousTexture.startsWith("scene-river-") && nextTexture.startsWith("scene-river-")) return true;
    if (previousTexture.startsWith("couple-river-sitting-") && this.isKissFrameTexture(nextTexture)) return true;
    return false;
  }

  private isKissFrameTexture(texture: string) {
    return texture.startsWith("couple-almost-kiss-") || texture === "couple-kiss-sitting";
  }

  private resolveScenePropTexture(texture: string) {
    if (this.textures.exists(texture)) return texture;

    const fallbacks =
      texture.startsWith("couple-walking-side-")
        ? ["couple-walking-back", "alexis-pose-walking-side"]
        : texture.startsWith("couple-walking-back-")
          ? ["couple-walking-back", "alexis-pose-back"]
          : texture.startsWith("couple-valley-back-")
            ? ["couple-walking-back", "alexis-pose-back"]
            : texture.startsWith("couple-river-sitting-") || texture.startsWith("couple-almost-kiss-")
              ? ["couple-sitting-together", "alexis-pose-sitting"]
              : texture === "couple-kiss-sitting"
                ? ["couple-kiss", "couple-sitting-together"]
                : texture.startsWith("couple-")
                  ? ["couple-sitting-together", "couple-walking-back"]
                  : texture.startsWith("npc-")
                    ? ["npc-taxi-driver"]
                    : texture.startsWith("prop-")
                      ? ["prop-purple-moto"]
                      : [];

    const fallback = fallbacks.find((key) => this.textures.exists(key));
    if (fallback) return fallback;

    console.warn(`No se encontro la textura "${texture}" ni una imagen de respaldo.`);
    return undefined;
  }

  private async updateBackgroundMusicForLocation(location: LocationId) {
    if (!this.audioEnabled) return;
    const audioSessionId = this.audioSessionId;

    const url = await this.findLocationMusicUrl(location);
    if (!this.audioEnabled || audioSessionId !== this.audioSessionId) return;

    if (!url) {
      // Fallback to generative procedural music
      if (this.backgroundMusic) {
        this.fadeOutBackgroundMusic();
      }
      this.ambience.startMusic(false);
      return;
    }

    if (this.activeMusicUrl === url && this.backgroundMusic) {
      this.ambience.connectExternalMusic(this.backgroundMusic, location);
      this.fadeBackgroundMusicTo(this.backgroundMusic, musicVolumeByLocation[location] ?? 0.18, 650);
      return;
    }

    // Stop procedural music if it's running
    this.ambience.stopMusic(false);

    const oldMusic = this.backgroundMusic;
    const newMusic = new Audio(url);
    newMusic.loop = true;
    newMusic.volume = 0;
    this.backgroundMusicElements.add(newMusic);
    this.ambience.connectExternalMusic(newMusic, location);

    this.activeMusicUrl = url;
    this.backgroundMusic = newMusic;

    try {
      await newMusic.play();
      if (!this.audioEnabled || audioSessionId !== this.audioSessionId || this.backgroundMusic !== newMusic) {
        this.stopBackgroundMusicElement(newMusic);
        return;
      }
      this.tweens.addCounter({
        from: 0,
        to: musicVolumeByLocation[location] ?? 0.18,
        duration: 1900,
        ease: "Sine.easeOut",
        onUpdate: (tween) => {
          if (this.backgroundMusic === newMusic) {
            newMusic.volume = tween.getValue() ?? 0;
          }
        }
      });
    } catch (e) {
      console.warn("Failed to play background music:", e);
      if (this.backgroundMusic === newMusic) {
        this.backgroundMusic = undefined;
        this.activeMusicUrl = undefined;
        this.stopBackgroundMusicElement(newMusic);
      }
    }

    // Smoothly crossfade/fadeout the old music
    if (oldMusic) {
      this.tweens.addCounter({
        from: oldMusic.volume,
        to: 0,
        duration: 1200, // Smooth fade-out
        ease: "Sine.easeIn",
        onUpdate: (tween) => {
          oldMusic.volume = tween.getValue() ?? 0;
        },
        onComplete: () => {
          this.stopBackgroundMusicElement(oldMusic);
        }
      });
    }
  }

  private fadeBackgroundMusicTo(music: HTMLAudioElement, volume: number, duration: number) {
    this.tweens.addCounter({
      from: music.volume,
      to: volume,
      duration,
      ease: "Sine.easeInOut",
      onUpdate: (tween) => {
        if (this.backgroundMusic === music) {
          music.volume = tween.getValue() ?? volume;
        }
      }
    });
  }

  private async findLocationMusicUrl(location: LocationId) {
    return "/assets/audio/swordsman.mp3";
  }

  private fadeOutBackgroundMusic() {
    const music = this.backgroundMusic;
    if (music) {
      this.backgroundMusic = undefined;
      this.activeMusicUrl = undefined;
      this.tweens.addCounter({
        from: music.volume,
        to: 0,
        duration: 900,
        ease: "Sine.easeIn",
        onUpdate: (tween) => {
          music.volume = tween.getValue() ?? 0;
        },
        onComplete: () => {
          this.stopBackgroundMusicElement(music);
        }
      });
    }

    // Always stop the procedural music
    this.ambience.stopMusic(false);
  }

  private updateSmsNotification(beat: StoryBeat, immediate = false) {
    this.smsNotification?.destroy();
    this.smsNotification = undefined;
    this.pendingSmsNotificationSound = false;

    const isSms = beat.location === "taxi" && beat.speaker === "Kiara";
    if (!isSms) return;

    const notification = this.add.container(1000, 96).setDepth(99).setScrollFactor(0);
    const shadow = this.add.graphics();
    shadow.fillStyle(0x05070a, 0.32);
    shadow.fillRoundedRect(4, 6, 316, 94, 18);

    const card = this.add.graphics();
    card.fillStyle(0xf6f8fb, 0.94);
    card.fillRoundedRect(0, 0, 316, 94, 18);
    card.lineStyle(1, 0xffffff, 0.7);
    card.strokeRoundedRect(0, 0, 316, 94, 18);

    const avatar = this.add.ellipse(34, 34, 42, 42, 0x2a1638, 1).setStrokeStyle(2, 0xb783ff, 0.92);
    const avatarText = this.add
      .text(34, 34, "K", {
        fontFamily: "Courier New",
        fontSize: "22px",
        fontStyle: "bold",
        color: "#f2e7ff"
      })
      .setOrigin(0.5);
    const appText = this.add.text(64, 16, "mensaje", {
      fontFamily: "Courier New",
      fontSize: "12px",
      fontStyle: "bold",
      color: "#6f7782"
    });
    const timeText = this.add
      .text(290, 16, "ahora", {
        fontFamily: "Courier New",
        fontSize: "12px",
        fontStyle: "bold",
        color: "#8b949e"
      })
      .setOrigin(1, 0);
    const senderText = this.add.text(64, 32, "Kiara", {
      fontFamily: "Courier New",
      fontSize: "16px",
      fontStyle: "bold",
      color: "#171a20"
    });
    const messageText = this.add.text(64, 54, beat.text, {
      fontFamily: "Courier New",
      fontSize: "14px",
      fontStyle: "bold",
      color: "#2c3138",
      wordWrap: { width: 232 }
    });

    notification.add([shadow, card, avatar, avatarText, appText, timeText, senderText, messageText]);
    this.cameras.main.ignore(notification);
    this.smsNotification = notification;

    if (immediate) {
      notification.setX(606);
      this.pendingSmsNotificationSound = true;
      return;
    }

    this.pendingSmsNotificationSound = false;
    this.playSmsNotificationSound();
    this.tweens.add({
      targets: notification,
      x: 606,
      duration: 520,
      ease: "Back.easeOut"
    });
    this.tweens.add({
      targets: notification,
      y: 102,
      yoyo: true,
      duration: 900,
      repeat: 1,
      ease: "Sine.easeInOut"
    });
  }

  private playSmsNotificationSound() {
    if (!this.audioEnabled) return;
    this.ambience?.playSmsNotificationSound();
  }

  private playScoreChime(statId: StoryStatId) {
    if (!this.audioEnabled) return;
    this.ambience?.playScoreChime(statId);
  }

  private playMemoryRevealChime() {
    if (!this.audioEnabled) return;
    this.ambience?.playMemoryRevealChime();
  }

  private playMemoryChime() {
    if (!this.audioEnabled) return;
    this.ambience?.playMemoryChime();
  }

  private playMemoryCollectBurst(x: number, y: number, text = "guardado") {
    const burst = this.add.container(x, y).setDepth(96);
    this.uiCamera?.ignore(burst);

    const ring = this.add.ellipse(0, 0, 42, 30, 0xe7d6ff, 0.2).setStrokeStyle(3, 0xb783ff, 0.9);
    const softRing = this.add.ellipse(0, 0, 68, 44, 0xd8fbff, 0.11).setStrokeStyle(1, 0x8fe8ff, 0.44);
    const glow = this.add.ellipse(0, 0, 86, 56, 0x9b6dff, 0.13);
    const label = this.add
      .text(0, -48, text, {
        fontFamily: "Courier New",
        fontSize: "15px",
        fontStyle: "bold",
        color: "#fff2dc",
        stroke: "#10131a",
        strokeThickness: 4
      })
      .setOrigin(0.5);

    const sparks = Array.from({ length: 12 }, (_, index) => {
      const angle = (Math.PI * 2 * index) / 12;
      const spark = this.add
        .text(Math.cos(angle) * 14, Math.sin(angle) * 10, index % 3 === 0 ? "+" : "*", {
          fontFamily: "Courier New",
          fontSize: `${13 + (index % 4) * 3}px`,
          fontStyle: "bold",
          color: index % 3 === 0 ? "#d8fbff" : index % 2 === 0 ? "#f2e7ff" : "#c79bff"
        })
        .setOrigin(0.5);
      spark.setData("targetX", Math.cos(angle) * (56 + index * 2));
      spark.setData("targetY", Math.sin(angle) * (38 + index * 1.4));
      return spark;
    });

    burst.add([glow, softRing, ring, label, ...sparks]);

    this.tweens.add({
      targets: glow,
      scaleX: 3.4,
      scaleY: 2.8,
      alpha: 0,
      duration: 840,
      ease: "Sine.easeOut"
    });
    this.tweens.add({
      targets: [ring, softRing],
      scaleX: 3.2,
      scaleY: 2.4,
      alpha: 0,
      angle: 80,
      duration: 760,
      ease: "Sine.easeOut"
    });
    this.tweens.add({
      targets: label,
      y: -70,
      alpha: 0,
      duration: 900,
      ease: "Sine.easeIn"
    });
    sparks.forEach((spark, index) => {
      this.tweens.add({
        targets: spark,
        x: spark.getData("targetX") as number,
        y: spark.getData("targetY") as number,
        angle: index % 2 === 0 ? 34 : -34,
        alpha: 0,
        duration: 820,
        ease: "Sine.easeOut"
      });
    });
    this.time.delayedCall(1100, () => burst.destroy());
  }

  private tryToggleGuides(pointer: Phaser.Input.Pointer) {
    const bounds = this.guideToggle.getBounds();
    if (!bounds.contains(pointer.x, pointer.y)) return false;

    this.toggleGuides();
    return true;
  }

  private tryToggleAudio(pointer: Phaser.Input.Pointer) {
    const bounds = this.audioToggle.getBounds();
    if (!bounds.contains(pointer.x, pointer.y)) return false;

    this.toggleAudio();
    return true;
  }

  private toggleAudio() {
    this.audioEnabled = !this.audioEnabled;
    this.audioToggle.setText(`audio: ${this.audioEnabled ? "on" : "off"}`);

    if (!this.audioEnabled) {
      this.stopAllAudioNow();
      this.flashToast("Sonido desactivado");
      return;
    }

    const beat = this.currentBeat();
    this.ambience.ensureContext();
    this.ambience.setLocationAmbience(beat.location, true);
    this.ambience.setHeartbeat(this.heartbeatForBeat(beat));
    this.ambience.setIntimate(Boolean(beat.cinematic?.intimate), true);
    void this.updateBackgroundMusicForLocation(beat.location);
    if (this.isKissHeartbeatBeat(beat)) {
      this.ambience.playKissMomentSound();
    }
    this.flashToast("Sonido activado");
  }

  private stopAllAudioNow(recreateAmbience = true) {
    this.audioSessionId += 1;
    for (const music of [...this.backgroundMusicElements]) {
      this.stopBackgroundMusicElement(music);
    }
    this.backgroundMusic = undefined;
    this.activeMusicUrl = undefined;
    this.triedBackgroundMusic = false;
    this.ambience?.destroy();
    if (recreateAmbience) {
      this.ambience = new AmbienceEngine();
    }
  }

  private stopBackgroundMusicElement(music: HTMLAudioElement) {
    this.ambience?.releaseExternalMusic(music);
    music.pause();
    try {
      music.currentTime = 0;
    } catch {}
    music.removeAttribute("src");
    music.load();
    this.backgroundMusicElements.delete(music);
  }

  private shutdownAudioLifecycle() {
    window.removeEventListener(FORCE_STOP_AUDIO_EVENT, this.forceStopAudioHandler);
    this.stopAllAudioNow(false);
  }

  private forceDisableAudio() {
    this.audioEnabled = false;
    this.audioToggle?.setText("audio: off");
    this.stopAllAudioNow(false);
  }

  private toggleGuides() {
    this.guidesVisible = !this.guidesVisible;
    this.guideToggle.setText(`guias: ${this.guidesVisible ? "on" : "off"}`);
    this.locationText.setVisible(this.guidesVisible);
    this.scoreText.setVisible(this.guidesVisible);
    this.memoryCounterText.setVisible(this.guidesVisible);
  }

  private setSpeaker(speaker: StoryBeat["speaker"], immediate = false) {
    const changed = speaker !== this.currentSpeaker;
    this.currentSpeaker = speaker;
    this.speakerText.setText(speaker);
    this.speakerText.setColor(speakerColors[speaker] ?? "#fff2dc");

    const accentColor = speakerAccentHex[speaker] ?? 0x697383;
    this.dialogueAccent.setFillStyle(accentColor, 0.95);
    this.dialogueBg.setStrokeStyle(3, accentColor, 0.7);

    if (immediate || !changed) return;

    // A new voice should "land": the name and its accent bar slide/fade in.
    this.tweens.killTweensOf(this.speakerText);
    this.tweens.killTweensOf(this.dialogueAccent);
    this.speakerText.setAlpha(0.2).setX(16);
    this.tweens.add({ targets: this.speakerText, alpha: 1, x: 24, duration: 260, ease: "Sine.easeOut" });
    this.dialogueAccent.setAlpha(0.15);
    this.tweens.add({ targets: this.dialogueAccent, alpha: 0.95, duration: 340, ease: "Sine.easeOut" });
  }

  private startDialogueText(text: string, showChoicesWhenDone = false) {
    this.dialogueTimer?.remove(false);
    this.dialogueTimer = undefined;
    this.fullDialogueText = text;
    this.typingShowsChoices = showChoicesWhenDone;
    this.isTypingDialogue = text.length > 0;
    this.dialogueText.setText("");

    if (!this.isTypingDialogue) {
      this.finishDialogueText();
      return;
    }

    this.typingIndex = 0;
    this.promptText.setText("toca para completar");
    this.scheduleNextChar();
  }

  // Types one character then schedules the next with a delay that reacts to
  // punctuation, so the line breathes like a spoken sentence instead of a
  // metronome. A soft per-speaker blip rides along for texture.
  private scheduleNextChar() {
    const text = this.fullDialogueText;
    if (this.typingIndex >= text.length) {
      this.finishDialogueText();
      return;
    }

    this.typingIndex += 1;
    this.dialogueText.setText(text.slice(0, this.typingIndex));

    const justTyped = text.charAt(this.typingIndex - 1);
    const prevChar = this.typingIndex >= 2 ? text.charAt(this.typingIndex - 2) : " ";
    const isWordStart = justTyped.trim().length > 0 && (prevChar === " " || this.typingIndex === 1);
    // One soft musical note per word (not per letter), randomly skipped, so the
    // text "sings" gently in each character's register instead of clicking.
    // (Disabled per user request to prevent sound effects when writing words)
    // if (this.audioEnabled && isWordStart && Math.random() < 0.55) {
    //   this.ambience?.playTypingTone(this.currentSpeaker);
    // }

    if (this.typingIndex >= text.length) {
      this.finishDialogueText();
      return;
    }

    this.dialogueTimer = this.time.delayedCall(this.delayForChar(justTyped), () => this.scheduleNextChar());
  }

  private delayForChar(ch: string) {
    const base = paceDelays[this.currentPace] ?? dialogueTypingDelayMs;
    if (".!?".includes(ch)) return base * 9;
    if (",;:".includes(ch)) return base * 4.5;
    if (ch === " ") return base * 0.6;
    return base;
  }

  private completeDialogueText() {
    this.dialogueText.setText(this.fullDialogueText);
    this.finishDialogueText();
  }

  private finishDialogueText() {
    this.dialogueTimer?.remove(false);
    this.dialogueTimer = undefined;
    this.isTypingDialogue = false;

    if (this.typingShowsChoices) {
      this.typingShowsChoices = false;
      this.renderChoices(this.currentBeat());
      return;
    }

    const beat = this.currentBeat();
    if (this.scheduleAutoAdvance(beat)) {
      return;
    }

    this.promptText.setText("toca para seguir");
  }

  private scheduleAutoAdvance(beat: StoryBeat) {
    if (!this.shouldAutoAdvance(beat)) return false;

    this.autoAdvanceTimer?.remove(false);
    this.promptText.setText("");
    this.autoAdvanceTimer = this.time.delayedCall(beat.cinematic?.holdMs ?? 900, () => {
      this.autoAdvanceTimer = undefined;
      if (!this.isTypingDialogue && !this.awaitingChoice) {
        this.advance(true);
      }
    });

    return true;
  }

  private shouldAutoAdvance(beat: StoryBeat) {
    return Boolean(
      beat.cinematic?.holdMs &&
        !beat.choices?.length &&
        !beat.memory &&
        !beat.completeChapter
    );
  }

  private isPlayerInputLocked() {
    return Boolean(this.currentBeat().cinematic?.lockInput && !this.isTypingDialogue);
  }

  private clearChoices() {
    this.choicesContainer.removeAll(true);
    this.choiceButtons = [];
    this.awaitingChoice = false;
  }

  private renderChoices(beat: StoryBeat) {
    this.clearChoices();
    this.awaitingChoice = Boolean(beat.choices?.length);
    this.promptText.setText(this.awaitingChoice ? "elige una opcion" : "toca para seguir");

    if (!beat.choices?.length) return;

    beat.choices.forEach((choice, index) => {
      const y = index * 40;
      const background = this.add
        .rectangle(0, y, 816, 34, 0x10131a, 0.94)
        .setOrigin(0)
        .setStrokeStyle(2, 0xe79037);
      const label = this.add
        .text(18, y + 17, `${index + 1}. ${choice.label}`, {
          fontFamily: "Courier New",
          fontSize: "14px",
          fontStyle: "bold",
          color: "#fff2dc",
          wordWrap: { width: 760 }
        })
        .setOrigin(0, 0.5);

      this.choicesContainer.add([background, label]);
      this.choiceButtons.push({
        bounds: new Phaser.Geom.Rectangle(this.choicesContainer.x, this.choicesContainer.y + y, 816, 34),
        choice
      });
    });
  }

  private trySelectChoice(pointer: Phaser.Input.Pointer) {
    if (!this.awaitingChoice) return false;

    const selected = this.choiceButtons.find((button) => button.bounds.contains(pointer.x, pointer.y));
    if (!selected) return false;

    const { choice } = selected;
    if (choice.stat) {
      addStoryStat(this.progress, choice.stat.id, choice.stat.amount ?? 1);
      saveProgress(this.progress);
      this.updateScoreText();
      this.playScoreChime(choice.stat.id);
      this.flashToast(`+${choice.stat.amount ?? 1} ${choice.stat.label}`);
    }

    this.awaitingChoice = false;
    this.clearChoices();
    this.setSpeaker(choice.resultSpeaker ?? "Narrador");
    this.startDialogueText(choice.resultText);

    return true;
  }

  private updateScoreText() {
    const { ternura, nervios, sueno } = this.progress.storyStats;
    this.scoreText.setText(`ternura ${ternura}  |  nervios ${nervios}  |  sueno ${sueno}`);
  }

  private updateMemoryCounterText() {
    const chapterMemoryIds = new Set(
      this.chapter.beats.flatMap((beat) => (beat.memory ? [beat.memory.id] : []))
    );
    const collected = this.progress.memories.filter((memory) => chapterMemoryIds.has(memory.id)).length;
    this.memoryCounterText.setText(`recuerdos ${collected}/${chapterMemoryIds.size}`);
  }
}
