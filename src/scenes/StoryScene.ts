import Phaser from "phaser";
import {
  chapters,
  isChapterAvailableInCurrentDeploy,
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
import {
  FORCE_STOP_AUDIO_EVENT,
  registerGameAudioElement,
  unregisterGameAudioElement
} from "../game/systems/audioLifecycle";
import { stopMenuMusic } from "../game/systems/menuMusic";
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
  container: Phaser.GameObjects.Container;
  bg: Phaser.GameObjects.Rectangle;
  glow: Phaser.GameObjects.Rectangle;
  accent: Phaser.GameObjects.Rectangle;
  label: Phaser.GameObjects.Text;
  indicator: Phaser.GameObjects.Text;
  index: number;
  accentColor: number;
};

const locationLabels: Record<LocationId, string> = {
  taxi: "taxi",
  hospital: "hospital",
  road: "camino",
  bosquete: "campo",
  valley: "valle",
  ravine: "quebrada",
  river: "río",
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

// Per-location music sits UNDER "su canción" now: a soft color for each place,
// not a competing track. Kept low so the special song stays the voice you hear.
const musicVolumeByLocation: Record<LocationId, number> = {
  taxi: 0.1,
  hospital: 0.13,
  road: 0.11,
  bosquete: 0.115,
  valley: 0.11,
  ravine: 0.14,
  river: 0.12,
  night: 0.085,
  room: 0.08
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
  private riverMagicAura?: Phaser.GameObjects.Container;
  private riverMagicShapes: Phaser.GameObjects.Shape[] = [];
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
  private hoveredChoiceIndex = -1;
  private choiceLocked = false;
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
  private signatureMusic?: HTMLAudioElement;
  private signatureStarted = false;
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
    stopMenuMusic();
    const requestedChapter = chapters.find((chapter) => chapter.id === data.chapterId);
    this.chapter =
      requestedChapter && isChapterAvailableInCurrentDeploy(requestedChapter.id)
        ? requestedChapter
        : chapters[0];
    const startBeatIndex = data.startBeatId
      ? this.chapter.beats.findIndex((beat) => beat.id === data.startBeatId)
      : -1;
    this.beatIndex = startBeatIndex >= 0 ? startBeatIndex : 0;
    this.progress = loadProgress();
    this.guidesVisible = true;
    this.isTransitioning = false;
    this.awaitingChoice = false;
    this.choiceButtons = [];
    this.hoveredChoiceIndex = -1;
    this.choiceLocked = false;
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
    this.stopAllAudioNow(false);
    this.triedBackgroundMusic = false;
    this.signatureMusic = undefined;
    this.signatureStarted = false;
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
    this.riverMagicAura?.destroy();
    this.riverMagicAura = undefined;
    this.riverMagicShapes = [];
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
      if (this.isTransitioning || this.choiceLocked) return;
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
        this.flashToast("Elige una opción para continuar");
        return;
      }
      this.advance();
    });

    this.input.on("pointermove", (pointer: Phaser.Input.Pointer) => this.updateChoiceHover(pointer));

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
    this.updateRiverMagic(seconds);

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

      const animationFrames = prop.getData("animationFrames") as string[] | undefined;
      if (animationFrames?.length) {
        const frameRate = (prop.getData("animationFrameRate") as number | undefined) ?? 5;
        const phase = (prop.getData("animationPhase") as number | undefined) ?? 0;
        const frameIndex = Math.floor(seconds * frameRate + phase) % animationFrames.length;
        const frameTexture = animationFrames[frameIndex];
        if (frameTexture && prop.texture.key !== frameTexture) {
          prop.setTexture(frameTexture);
        }
      }
    });

    if (this.memoryMarker) {
      this.memoryMarker.setY(this.memoryMarkerBaseY + Math.sin(seconds * 2.8) * 3);
      this.memoryMarker.setScale(this.memoryMarkerBaseScale * (1 + Math.sin(seconds * 5) * 0.08));
      this.memoryMarker.rotation = Math.sin(seconds * 1.6) * 0.025;
    }
  }

  private createDialogueUi() {
    this.dialogueBox = this.add.container(50, 386).setDepth(80);
    this.dialogueBox.setScrollFactor(0);
    this.dialogueBg = this.add
      .rectangle(0, 0, 860, 118, 0x181d25, 0.88)
      .setOrigin(0)
      .setStrokeStyle(2, 0x697383);
    this.dialogueAccent = this.add.rectangle(0, 0, 6, 118, 0x9fb0c4, 0.95).setOrigin(0);
    this.speakerText = this.add.text(24, 18, "", {
      fontFamily: "Courier New",
      fontSize: "19px",
      fontStyle: "bold",
      color: "#e79037"
    });
    this.dialogueText = this.add.text(24, 48, "", {
      fontFamily: "Courier New",
      fontSize: "19px",
      color: "#fff2dc",
      lineSpacing: 4,
      wordWrap: { width: 790 }
    });
    this.promptText = this.add
      .text(748, 90, "toca para seguir", {
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

    this.setRiverMagicAura(cinematic?.riverMagic ?? 0, immediate);

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
    this.applyHudVisibility(beat, immediate);

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
      const showGenericLocation = !card && !beat.cinematic?.hideDialogue && !beat.cinematic?.hideHud;
      if (card || showGenericLocation) {
        this.time.delayedCall(immediate ? 380 : 0, () => {
          if (card) {
            this.showLocationCard(card.title, card.subtitle);
          } else {
            this.showLocationCard(locationLabels[beat.location]);
          }
        });
      }
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

  private applyHudVisibility(beat: StoryBeat, immediate = false) {
    const hideHud = this.shouldHideHud(beat);
    const guideObjects = [this.locationText, this.scoreText, this.memoryCounterText];
    const hudObjects = [...guideObjects, this.guideToggle, this.audioToggle];

    hudObjects.forEach((object) => {
      const isGuideObject = guideObjects.includes(object);
      const shouldShow = !hideHud && (!isGuideObject || this.guidesVisible);
      this.tweens.killTweensOf(object);

      if (shouldShow) {
        object.setVisible(true);
      }

      if (immediate) {
        object.setAlpha(shouldShow ? 1 : 0);
        object.setVisible(shouldShow);
        return;
      }

      if (!shouldShow && !object.visible) {
        object.setAlpha(0);
        return;
      }

      object.setVisible(true);
      this.tweens.add({
        targets: object,
        alpha: shouldShow ? 1 : 0,
        duration: 320,
        ease: "Sine.easeInOut",
        onComplete: () => {
          if (!shouldShow) object.setVisible(false);
        }
      });
    });
  }

  private shouldHideHud(beat: StoryBeat) {
    return Boolean(beat.cinematic?.hideHud || (beat.cinematic?.intimate && beat.cinematic.letterbox));
  }

  private advance(fromAuto = false) {
    if (this.choiceLocked) return;
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
      this.flashToast("Elige una opción para continuar");
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
        .text(0, 6, `Capítulo ${this.chapter.number}`, {
          fontFamily: "Courier New",
          fontSize: "14px",
          color: "#b7b0a5"
        })
        .setOrigin(0.5)
        .setAlpha(0);
      const quote = this.add
        .text(0, 44, "Y todavía nos sigue viendo.", {
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
        .text(0, 110, `ternura ${ternura}   nervios ${nervios}   sueño ${sueno}`, {
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

  private setRiverMagicAura(intensity: number, immediate = false) {
    const targetAlpha = Phaser.Math.Clamp(intensity, 0, 1);

    if (targetAlpha > 0 && !this.riverMagicAura) {
      this.createRiverMagicAura();
    }

    if (!this.riverMagicAura) return;

    this.tweens.killTweensOf(this.riverMagicAura);

    if (immediate) {
      this.riverMagicAura.setAlpha(targetAlpha);
      this.riverMagicAura.setVisible(targetAlpha > 0);
      if (targetAlpha <= 0) {
        this.riverMagicAura.destroy();
        this.riverMagicAura = undefined;
        this.riverMagicShapes = [];
      }
      return;
    }

    this.riverMagicAura.setVisible(true);
    this.tweens.add({
      targets: this.riverMagicAura,
      alpha: targetAlpha,
      duration: targetAlpha > 0 ? 760 : 520,
      ease: "Sine.easeInOut",
      onComplete: () => {
        if (targetAlpha > 0 || !this.riverMagicAura) return;
        this.riverMagicAura.destroy();
        this.riverMagicAura = undefined;
        this.riverMagicShapes = [];
      }
    });
  }

  private createRiverMagicAura() {
    const aura = this.add.container(480, 450).setDepth(31.86).setAlpha(0);
    const shapes: Phaser.GameObjects.Shape[] = [];

    const addShape = (shape: Phaser.GameObjects.Shape, kind: string, phase: number, baseAlpha: number) => {
      shape
        .setData("kind", kind)
        .setData("phase", phase)
        .setData("baseAlpha", baseAlpha)
        .setData("baseX", shape.x)
        .setData("baseY", shape.y);
      aura.add(shape);
      shapes.push(shape);
      return shape;
    };

    addShape(
      this.add.ellipse(0, 24, 590, 138, 0xc8fff4, 0.34).setBlendMode(Phaser.BlendModes.SCREEN),
      "pool",
      0,
      0.34
    );
    addShape(
      this.add.ellipse(0, 2, 470, 94, 0xfff2dc, 0.3).setBlendMode(Phaser.BlendModes.SCREEN),
      "pool",
      1.2,
      0.3
    );
    addShape(
      this.add.ellipse(0, -42, 680, 210, 0xe7d6ff, 0.2).setBlendMode(Phaser.BlendModes.SCREEN),
      "halo",
      0.6,
      0.2
    );
    addShape(
      this.add.ellipse(0, -58, 560, 150, 0xffd1e3, 0.18).setBlendMode(Phaser.BlendModes.SCREEN),
      "halo",
      1.8,
      0.18
    );
    addShape(
      this.add.ellipse(0, -84, 620, 190, 0xffdff5, 0.16),
      "halo",
      2.15,
      0.16
    );
    addShape(
      this.add.ellipse(0, -18, 660, 150, 0xd7fff7, 0.12),
      "halo",
      2.35,
      0.12
    );
    addShape(
      this.add.ellipse(0, -154, 500, 112, 0xfff2dc, 0.2).setBlendMode(Phaser.BlendModes.SCREEN),
      "halo",
      2.5,
      0.2
    );
    addShape(
      this.add.ellipse(0, -174, 390, 74, 0xc8fff4, 0.18).setBlendMode(Phaser.BlendModes.SCREEN),
      "halo",
      3.1,
      0.18
    );

    for (let i = 0; i < 5; i += 1) {
      addShape(
        this.add
          .ellipse(0, 8, 260 + i * 58, 40 + i * 16, 0xffffff, 0)
          .setStrokeStyle(2, i % 2 === 0 ? 0xc8fff4 : 0xffd1e3, 0.56)
          .setBlendMode(Phaser.BlendModes.SCREEN),
        "ring",
        i * 0.9,
        0.62 - i * 0.04
      );
    }

    for (let i = 0; i < 30; i += 1) {
      const angle = (Math.PI * 2 * i) / 30;
      const radiusX = 218 + (i % 5) * 20;
      const radiusY = 42 + (i % 3) * 8;
      const direction = Math.cos(angle) < 0 ? 1 : -1;
      const star = addShape(
        this.createRiverSparkleStar(Math.cos(angle) * radiusX, 8 + Math.sin(angle) * radiusY),
        "kissStar",
        i * 0.073,
        0.95
      );
      star.setData("drift", direction * (68 + (i % 6) * 12));
      star.setData("rise", 54 + (i % 5) * 13);
    }

    const ribbonColors = [0xfff2dc, 0xc8fff4, 0xffd1e3, 0xe7d6ff];
    for (let i = 0; i < 9; i += 1) {
      addShape(
        this.add
          .rectangle(-220 + i * 55, -54 + (i % 5) * 18, 170 + (i % 4) * 66, 5 + (i % 2), ribbonColors[i % ribbonColors.length], 0)
          .setAngle(-8 + i * 2.25)
          .setBlendMode(Phaser.BlendModes.SCREEN),
        "ribbon",
        i * 0.52,
        0.34 + (i % 3) * 0.035
      );
    }

    for (let i = 0; i < 7; i += 1) {
      addShape(
        this.add
          .rectangle(-180 + i * 60, 18, 8 + (i % 3) * 3, 94 + (i % 2) * 28, i % 2 === 0 ? 0xc8fff4 : 0xffe2f0, 0)
          .setOrigin(0.5, 1)
          .setAngle(-10 + i * 3.5)
          .setBlendMode(Phaser.BlendModes.SCREEN),
        "beam",
        i * 0.7,
        0.38
      );
    }

    const moteColors = [0xfff2dc, 0xc8fff4, 0xffd1e3, 0xe7d6ff, 0xffffff];
    for (let i = 0; i < 42; i += 1) {
      const angle = (Math.PI * 2 * i) / 42;
      const radius = 126 + (i % 7) * 25;
      addShape(
        this.add
          .ellipse(
            Math.cos(angle) * radius,
            -16 + Math.sin(angle) * 48,
            4 + (i % 4),
            4 + (i % 4),
            moteColors[i % moteColors.length],
            0
          )
          .setBlendMode(Phaser.BlendModes.SCREEN),
        "mote",
        i * 0.48,
        0.78
      );
    }

    for (let i = 0; i < 16; i += 1) {
      const side = i % 2 === 0 ? -1 : 1;
      const lane = Math.floor(i / 2);
      addShape(
        this.add
          .polygon(
            side * (150 + (lane % 4) * 38),
            -80 + (lane % 5) * 33,
            [0, -9, 6, 0, 0, 9, -6, 0],
            i % 3 === 0 ? 0xfff2dc : i % 3 === 1 ? 0xc8fff4 : 0xffd1e3,
            0
          )
          .setBlendMode(Phaser.BlendModes.SCREEN),
        "glint",
        i * 0.41,
        0.95
      );
    }

    for (let i = 0; i < 18; i += 1) {
      const arc = (Math.PI * i) / 17;
      addShape(
        this.add
          .polygon(
            Math.cos(arc) * 250,
            -138 - Math.sin(arc) * 48,
            [0, -8, 5, 0, 0, 8, -5, 0],
            moteColors[i % moteColors.length],
            0
          )
          .setBlendMode(Phaser.BlendModes.SCREEN),
        "glint",
        2.2 + i * 0.33,
        0.88
      );
    }

    this.uiCamera?.ignore(aura);
    this.riverMagicAura = aura;
    this.riverMagicShapes = shapes;
  }

  private updateRiverMagic(seconds: number) {
    if (!this.riverMagicAura || this.riverMagicAura.alpha <= 0.001) return;

    this.riverMagicAura.setY(450 + Math.sin(seconds * 1.1) * 3.2);
    this.riverMagicAura.setScale(1 + Math.sin(seconds * 0.72) * 0.018);

    for (const shape of this.riverMagicShapes) {
      const kind = shape.getData("kind") as string;
      const phase = shape.getData("phase") as number;
      const baseAlpha = shape.getData("baseAlpha") as number;
      const baseX = shape.getData("baseX") as number;
      const baseY = shape.getData("baseY") as number;
      const pulse = Math.sin(seconds * 1.9 + phase);

      if (kind === "pool") {
        shape.setAlpha(baseAlpha * (0.74 + pulse * 0.22));
        shape.setScale(1 + Math.sin(seconds * 0.85 + phase) * 0.035, 1 + Math.cos(seconds * 0.7 + phase) * 0.055);
      } else if (kind === "halo") {
        const wave = (Math.sin(seconds * 0.72 + phase) + 1) * 0.5;
        shape.setAlpha(baseAlpha * (0.62 + wave * 0.58));
        shape.setScale(0.96 + wave * 0.08, 0.92 + wave * 0.16);
      } else if (kind === "ring") {
        const wave = (Math.sin(seconds * 1.35 + phase) + 1) * 0.5;
        shape.setAlpha(baseAlpha * (0.35 + wave * 0.65));
        shape.setScale(0.92 + wave * 0.18, 0.9 + wave * 0.22);
        shape.setRotation(Math.sin(seconds * 0.45 + phase) * 0.018);
      } else if (kind === "kissStar") {
        const kissAlpha = Phaser.Math.Clamp((this.riverMagicAura.alpha - 0.86) / 0.14, 0, 1);
        const progress = (seconds * 0.22 + phase) % 1;
        const glow = Math.sin(progress * Math.PI);
        const drift = shape.getData("drift") as number;
        const rise = shape.getData("rise") as number;
        const twinkle = (Math.sin(seconds * 3.2 + phase * 42) + 1) * 0.5;
        shape.setAlpha(Phaser.Math.Clamp(baseAlpha * kissAlpha * glow * twinkle, 0, 0.95));
        shape.setPosition(
          baseX + drift * progress + Math.sin(seconds * 1.2 + phase * 8) * 8,
          baseY - rise * progress + Math.cos(seconds * 1.35 + phase * 7) * 5
        );
        shape.setRotation(seconds * 0.8 + phase * 8);
        shape.setScale(0.9 + glow * 0.18);
      } else if (kind === "ribbon") {
        const wave = (Math.sin(seconds * 1.05 + phase) + 1) * 0.5;
        shape.setAlpha(baseAlpha * (0.3 + wave * 0.82));
        shape.setPosition(
          baseX + Math.sin(seconds * 0.52 + phase) * 18,
          baseY + Math.cos(seconds * 0.6 + phase) * 4
        );
        shape.setScale(0.82 + wave * 0.28, 1);
      } else if (kind === "beam") {
        shape.setAlpha(baseAlpha * (0.55 + Math.max(0, pulse) * 0.65));
        shape.setY(baseY - Math.max(0, pulse) * 12);
        shape.setScale(1, 0.86 + Math.max(0, pulse) * 0.38);
      } else if (kind === "glint") {
        const twinkle = (Math.sin(seconds * 2.8 + phase) + 1) * 0.5;
        shape.setAlpha(baseAlpha * (0.12 + twinkle * 0.9));
        shape.setPosition(
          baseX + Math.sin(seconds * 0.74 + phase) * 10,
          baseY + Math.cos(seconds * 0.92 + phase) * 10
        );
        shape.setRotation(seconds * 0.42 + phase);
        shape.setScale(0.55 + twinkle * 0.82);
      } else {
        shape.setAlpha(baseAlpha * (0.42 + Math.sin(seconds * 2.2 + phase) * 0.35));
        shape.setPosition(
          baseX + Math.sin(seconds * 0.9 + phase) * 12,
          baseY + Math.cos(seconds * 1.15 + phase) * 8
        );
        shape.setScale(0.82 + Math.sin(seconds * 1.7 + phase) * 0.22);
      }
    }
  }

  private createRiverSparkleStar(x: number, y: number) {
    const size = 3;
    return this.add.star(x, y, 4, size * 0.5, size * 1.4, 0xeaf6ff, 0.95).setStrokeStyle(1, 0x9fdcff, 0.7).setAlpha(0);
  }

  // A restrained bloom of light rising from below. Used on the kiss beat so
  // the magic feels soft and cinematic instead of noisy.
  private spawnPetals() {
    const bottomGlow = this.add
      .ellipse(480, 548, 720, 92, 0xffc6df, 0)
      .setDepth(92)
      .setScrollFactor(0)
      .setBlendMode(Phaser.BlendModes.SCREEN);
    this.cameras.main.ignore(bottomGlow);

    this.tweens.add({
      targets: bottomGlow,
      alpha: { from: 0, to: 0.24 },
      scaleX: 1.12,
      scaleY: 1.22,
      yoyo: true,
      duration: 1700,
      ease: "Sine.easeInOut",
      onComplete: () => bottomGlow.destroy()
    });

    const beamColors = [0xfff2dc, 0xffd7e8, 0xd7fff7];
    for (let i = 0; i < 5; i += 1) {
      const beam = this.add
        .rectangle(288 + i * 96, 566, 8 + (i % 2) * 4, 170 + (i % 3) * 22, beamColors[i % beamColors.length], 0)
        .setOrigin(0.5, 1)
        .setDepth(92)
        .setAngle(-10 + i * 5)
        .setScrollFactor(0)
        .setBlendMode(Phaser.BlendModes.SCREEN);
      this.cameras.main.ignore(beam);

      this.tweens.add({
        targets: beam,
        alpha: { from: 0, to: 0.12 },
        y: 438 - (i % 3) * 12,
        scaleY: 1.18,
        delay: i * 72,
        yoyo: true,
        duration: 1500 + (i % 3) * 150,
        ease: "Sine.easeInOut",
        onComplete: () => beam.destroy()
      });
    }

    const moteColors = [0xffd1e3, 0xc8fff4, 0xfff2dc, 0xe7d6ff];
    for (let i = 0; i < 24; i += 1) {
      const startX = 170 + Math.random() * 620;
      const startY = 548 + Math.random() * 58;
      const size = 3 + Math.random() * 6;
      const mote = this.add
        .ellipse(startX, startY, size, size, moteColors[i % moteColors.length], 0)
        .setOrigin(0.5)
        .setDepth(93)
        .setScrollFactor(0)
        .setBlendMode(Phaser.BlendModes.SCREEN);
      this.cameras.main.ignore(mote);

      const rise = 150 + Math.random() * 170;
      const sway = (Math.random() < 0.5 ? -1 : 1) * (18 + Math.random() * 46);
      this.tweens.add({
        targets: mote,
        y: startY - rise,
        x: startX + sway,
        alpha: { from: 0, to: 0.42 },
        scale: 0.65 + Math.random() * 0.7,
        delay: i * 56,
        duration: 1900 + Math.random() * 900,
        ease: "Sine.easeOut",
        onComplete: () => {
          this.tweens.add({
            targets: mote,
            alpha: 0,
            scale: 0.2,
            duration: 620,
            ease: "Sine.easeIn",
            onComplete: () => mote.destroy()
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
      .rectangle(0, 0, 960, 540, 0xfff2dc, 0)
      .setOrigin(0)
      .setDepth(76)
      .setScrollFactor(0)
      .setBlendMode(Phaser.BlendModes.SCREEN);
    this.cameras.main.ignore(veil);

    this.tweens.add({
      targets: veil,
      alpha: { from: 0, to: 0.28 },
      yoyo: true,
      duration: 760,
      ease: "Sine.easeInOut",
      onComplete: () => veil.destroy()
    });

    const blushVeil = this.add
      .rectangle(0, 0, 960, 540, 0xff8fbd, 0)
      .setOrigin(0)
      .setDepth(77)
      .setScrollFactor(0)
      .setBlendMode(Phaser.BlendModes.SCREEN);
    this.cameras.main.ignore(blushVeil);

    this.tweens.add({
      targets: blushVeil,
      alpha: { from: 0, to: 0.12 },
      yoyo: true,
      delay: 110,
      duration: 900,
      ease: "Sine.easeInOut",
      onComplete: () => blushVeil.destroy()
    });

    this.playKissMiraclePulse();
  }

  private playKissMiraclePulse() {
    const pulse = this.add.container(480, 454).setDepth(31.86).setAlpha(0);
    const colors = [0xfff2dc, 0xc8fff4, 0xffd1e3, 0xe7d6ff];

    const glow = this.add.ellipse(0, 12, 560, 138, 0xfff2dc, 0.18).setBlendMode(Phaser.BlendModes.SCREEN);
    const blush = this.add.ellipse(0, -22, 430, 112, 0xffb8d7, 0.14).setBlendMode(Phaser.BlendModes.SCREEN);
    const cyan = this.add.ellipse(0, 32, 610, 96, 0xc8fff4, 0.16).setBlendMode(Phaser.BlendModes.SCREEN);
    pulse.add([glow, blush, cyan]);

    for (let i = 0; i < 5; i += 1) {
      const ring = this.add
        .ellipse(0, 10 - i * 7, 220 + i * 70, 36 + i * 16, 0xffffff, 0)
        .setStrokeStyle(2, colors[i % colors.length], 0.58 - i * 0.055)
        .setBlendMode(Phaser.BlendModes.SCREEN);
      pulse.add(ring);
      this.tweens.add({
        targets: ring,
        alpha: { from: 0.46, to: 0 },
        scaleX: 1.65 + i * 0.18,
        scaleY: 1.55 + i * 0.16,
        delay: i * 95,
        duration: 1350 + i * 120,
        ease: "Sine.easeOut"
      });
    }

    for (let i = 0; i < 10; i += 1) {
      const ribbon = this.add
        .rectangle(-240 + i * 54, -72 + (i % 5) * 24, 160 + (i % 4) * 48, 5, colors[i % colors.length], 0.24)
        .setAngle(-10 + i * 2.2)
        .setBlendMode(Phaser.BlendModes.SCREEN);
      pulse.add(ribbon);
      this.tweens.add({
        targets: ribbon,
        x: ribbon.x + Math.sin(i * 1.4) * 34,
        alpha: { from: 0, to: 0.34 },
        scaleX: 1.24,
        delay: 80 + i * 36,
        yoyo: true,
        duration: 1180 + (i % 4) * 110,
        ease: "Sine.easeInOut"
      });
    }

    for (let i = 0; i < 34; i += 1) {
      const angle = (Math.PI * 2 * i) / 34;
      const radius = 118 + (i % 6) * 26;
      const spark = this.add
        .polygon(
          Math.cos(angle) * radius,
          -22 + Math.sin(angle) * 56,
          [0, -7, 5, 0, 0, 7, -5, 0],
          colors[i % colors.length],
          0
        )
        .setBlendMode(Phaser.BlendModes.SCREEN);
      pulse.add(spark);
      this.tweens.add({
        targets: spark,
        x: spark.x + Math.cos(angle) * (24 + (i % 4) * 8),
        y: spark.y - 34 - (i % 5) * 10,
        alpha: { from: 0, to: 0.72 },
        scale: 0.82 + (i % 4) * 0.16,
        rotation: angle + 0.9,
        delay: i * 22,
        yoyo: true,
        duration: 1080 + (i % 5) * 120,
        ease: "Sine.easeInOut"
      });
    }

    for (let i = 0; i < 30; i += 1) {
      const angle = (Math.PI * 2 * i) / 30;
      const radiusX = 220 + (i % 6) * 18;
      const radiusY = 42 + (i % 4) * 8;
      const startX = Math.cos(angle) * radiusX;
      const startY = 10 + Math.sin(angle) * radiusY;
      const star = this.createRiverSparkleStar(startX, startY);
      pulse.add(star);
      this.tweens.add({
        targets: star,
        x: startX + 86 + (i % 5) * 16,
        y: startY - 76 - (i % 6) * 10,
        alpha: { from: 0, to: 0.8 },
        scale: 1.05,
        rotation: angle + 0.8,
        delay: 120 + i * 28,
        yoyo: true,
        duration: 1250 + (i % 5) * 110,
        ease: "Sine.easeInOut"
      });
    }

    this.uiCamera?.ignore(pulse);
    this.tweens.add({
      targets: pulse,
      alpha: { from: 0, to: 1 },
      y: 438,
      yoyo: true,
      hold: 360,
      duration: 1560,
      ease: "Sine.easeInOut",
      onComplete: () => pulse.destroy()
    });
    this.tweens.add({
      targets: [glow, blush, cyan],
      scaleX: 1.18,
      scaleY: 1.28,
      duration: 1700,
      ease: "Sine.easeOut"
    });
  }

  private playKissBackdropDissolve() {
    this.playRiverLiftBurst();

    const warmExposure = this.add
      .rectangle(0, 0, 960, 540, 0xffefd0, 0)
      .setOrigin(0)
      .setDepth(75)
      .setScrollFactor(0)
      .setBlendMode(Phaser.BlendModes.SCREEN);
    this.cameras.main.ignore(warmExposure);

    this.tweens.add({
      targets: warmExposure,
      alpha: { from: 0, to: 0.2 },
      yoyo: true,
      hold: 260,
      duration: 980,
      ease: "Sine.easeInOut",
      onComplete: () => warmExposure.destroy()
    });

    const horizonBloom = this.add
      .ellipse(480, 330, 820, 210, 0xfff7df, 0)
      .setDepth(76)
      .setScrollFactor(0)
      .setBlendMode(Phaser.BlendModes.SCREEN);
    this.cameras.main.ignore(horizonBloom);

    this.tweens.add({
      targets: horizonBloom,
      alpha: { from: 0, to: 0.28 },
      scaleX: 1.18,
      scaleY: 1.36,
      y: 286,
      yoyo: true,
      hold: 180,
      duration: 1180,
      ease: "Sine.easeInOut",
      onComplete: () => horizonBloom.destroy()
    });

    const riverGleam = this.add
      .rectangle(0, 365, 960, 74, 0xc8fff4, 0)
      .setOrigin(0)
      .setDepth(76)
      .setScrollFactor(0)
      .setBlendMode(Phaser.BlendModes.SCREEN);
    this.cameras.main.ignore(riverGleam);

    this.tweens.add({
      targets: riverGleam,
      alpha: { from: 0, to: 0.16 },
      scaleY: 1.55,
      y: 342,
      yoyo: true,
      delay: 120,
      duration: 1060,
      ease: "Sine.easeInOut",
      onComplete: () => riverGleam.destroy()
    });
  }

  private playRiverLiftBurst() {
    const burst = this.add.container(480, 446).setDepth(31.7).setAlpha(0);
    const floor = this.add.ellipse(0, 18, 500, 88, 0xc8fff4, 0.3).setBlendMode(Phaser.BlendModes.SCREEN);
    const goldFloor = this.add.ellipse(0, 2, 410, 58, 0xfff2dc, 0.24).setBlendMode(Phaser.BlendModes.SCREEN);
    const ringColors = [0xc8fff4, 0xffd1e3, 0xfff2dc, 0xe7d6ff];
    const rings = ringColors.map((color, index) =>
      this.add
        .ellipse(0, 8 - index * 5, 220 + index * 54, 34 + index * 12, 0xffffff, 0)
        .setStrokeStyle(2, color, 0.82 - index * 0.09)
        .setBlendMode(Phaser.BlendModes.SCREEN)
    );

    burst.add([floor, goldFloor, ...rings]);

    for (let i = 0; i < 8; i += 1) {
      const beam = this.add
        .rectangle(-210 + i * 60, 24, 9 + (i % 3) * 3, 120 + (i % 4) * 22, ringColors[i % ringColors.length], 0)
        .setOrigin(0.5, 1)
        .setAngle(-12 + i * 3.4)
        .setBlendMode(Phaser.BlendModes.SCREEN);
      burst.add(beam);
      this.tweens.add({
        targets: beam,
        y: -66 - (i % 4) * 12,
        alpha: { from: 0, to: 0.34 },
        scaleY: 1.24,
        delay: i * 44,
        yoyo: true,
        duration: 1260 + (i % 3) * 130,
        ease: "Sine.easeInOut"
      });
    }

    for (let i = 0; i < 36; i += 1) {
      const angle = (Math.PI * 2 * i) / 36;
      const spark = this.add
        .ellipse(
          Math.cos(angle) * (128 + (i % 5) * 10),
          Math.sin(angle) * 30,
          4 + (i % 4) * 1.5,
          4 + (i % 4) * 1.5,
          ringColors[i % ringColors.length],
          0
        )
        .setBlendMode(Phaser.BlendModes.SCREEN);
      spark.setData("angle", angle);
      burst.add(spark);

      this.tweens.add({
        targets: spark,
        x: Math.cos(angle) * (210 + (i % 6) * 18),
        y: Math.sin(angle) * (48 + (i % 4) * 12) - 92 - (i % 5) * 9,
        alpha: { from: 0, to: 0.72 },
        scale: 1.36,
        delay: i * 16,
        yoyo: true,
        duration: 1040 + (i % 5) * 80,
        ease: "Sine.easeOut"
      });
    }

    this.uiCamera?.ignore(burst);

    this.tweens.add({
      targets: burst,
      alpha: { from: 0, to: 1 },
      y: 430,
      yoyo: true,
      hold: 260,
      duration: 1180,
      ease: "Sine.easeInOut",
      onComplete: () => burst.destroy()
    });
    this.tweens.add({
      targets: floor,
      scaleX: 1.34,
      scaleY: 1.5,
      alpha: 0,
      duration: 1280,
      ease: "Sine.easeOut"
    });
    this.tweens.add({
      targets: goldFloor,
      scaleX: 1.46,
      scaleY: 1.3,
      alpha: 0,
      duration: 1220,
      ease: "Sine.easeOut"
    });
    this.tweens.add({
      targets: rings,
      scaleX: 2.65,
      scaleY: 2.2,
      alpha: 0,
      duration: 1280,
      ease: "Sine.easeOut"
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
      const previousTexture = previous
        ? ((previous.getData("propTexture") as string | undefined) ?? previous.texture.key)
        : undefined;

      if (previous && previousTexture && (previousTexture === texture || this.isSameWalkingCycle(previousTexture, texture))) {
        this.tweens.killTweensOf(previous);
        previous
          .setDepth(propData.depth ?? 31)
          .setFlipX(propData.flipX ?? false)
          .setTexture(texture);
        previous.setData("baseY", propData.y);
        previous.setData("float", propData.float ?? 0);
        this.configureScenePropAnimation(previous, texture, index);
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

      const kissBackdropShift = Boolean(previousTexture && this.isKissBackdropShift(previousTexture, texture));
      const softSwap = Boolean(previous && previousTexture && this.shouldSoftSwapSceneProp(previousTexture, texture));
      const startX = softSwap && previous ? previous.x : propData.x;
      const startY = softSwap && previous ? previous.y : propData.y;
      const startScale =
        kissBackdropShift && previous ? previous.scaleX * 1.035 : softSwap && previous ? previous.scaleX : scale;
      const prop = this.add
        .image(startX, startY, texture)
        .setOrigin(0.5, 1)
        .setDepth(propData.depth ?? 31)
        .setScale(startScale)
        .setAlpha(immediate ? alpha : 0)
        .setFlipX(propData.flipX ?? false);

      if (kissBackdropShift) {
        prop.setY(prop.y + 10);
      }
      prop.setData("baseY", propData.y);
      prop.setData("float", propData.float ?? 0);
      this.configureScenePropAnimation(prop, texture, index);
      this.uiCamera?.ignore(prop);
      nextProps.push(prop);

      if (!immediate) {
        const duration = kissBackdropShift ? 1580 : softSwap ? 620 : 300;
        if (softSwap && previous) {
          fadingProps.add(previous);
          this.tweens.killTweensOf(previous);
          if (kissBackdropShift) {
            this.playKissBackdropDissolve();
            this.tweens.add({
              targets: previous,
              alpha: 0,
              y: previous.y - 8,
              scaleX: previous.scaleX * 1.045,
              scaleY: previous.scaleY * 1.045,
              duration,
              ease: "Sine.easeInOut",
              onComplete: () => previous.destroy()
            });
          } else {
            this.tweens.add({
              targets: previous,
              alpha: 0,
              duration,
              ease: "Sine.easeInOut",
              onComplete: () => previous.destroy()
            });
          }
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

  private configureScenePropAnimation(prop: Phaser.GameObjects.Image, texture: string, index: number) {
    prop.setData("propTexture", texture);

    const frames = this.scenePropAnimationFrames(texture).filter((frame) => this.textures.exists(frame));
    if (frames.length <= 1) {
      prop.setData("animationFrames", undefined);
      prop.setData("animationFrameRate", undefined);
      prop.setData("animationPhase", undefined);
      return;
    }

    prop.setData("animationFrames", frames);
    prop.setData("animationFrameRate", 1.8);
    prop.setData("animationPhase", index * 0.45);
  }

  private scenePropAnimationFrames(texture: string) {
    const family = this.scenePropAnimationFamily(texture);
    if (family === "walking-side") {
      return [
        "couple-walking-side-01",
        "couple-walking-side-02",
        "couple-walking-side-03",
        "couple-walking-side-04"
      ];
    }
    if (family === "walking-back") {
      return [
        "couple-walking-back-01",
        "couple-walking-back-02",
        "couple-walking-back-03",
        "couple-walking-back-04"
      ];
    }

    return [];
  }

  private isSameWalkingCycle(previousTexture: string, nextTexture: string) {
    const previousFamily = this.scenePropAnimationFamily(previousTexture);
    return Boolean(previousFamily && previousFamily === this.scenePropAnimationFamily(nextTexture));
  }

  private scenePropAnimationFamily(texture: string) {
    if (texture.startsWith("couple-walking-side-")) return "walking-side";
    if (texture === "couple-walking-back" || texture.startsWith("couple-walking-back-")) return "walking-back";
    return undefined;
  }

  private isKissBackdropShift(previousTexture: string, nextTexture: string) {
    return previousTexture === "scene-river-picnic-spot" && nextTexture === "scene-river-close-faces";
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

  // Their special song runs underneath every location as a constant, gentle
  // bed. It only starts once a user gesture has unlocked audio, so we attempt it
  // each beat until playback is allowed; the AmbienceEngine keeps it filtered
  // and quiet so it never muddies the per-location music.
  private ensureSignatureUnderscore() {
    if (!this.audioEnabled || this.signatureStarted) return;
    this.signatureStarted = true;

    const element = new Audio("/assets/audio/swordsman.mp3");
    element.loop = true;
    element.volume = 1; // true level is shaped by the Web Audio gain
    registerGameAudioElement(element);
    this.backgroundMusicElements.add(element);
    this.signatureMusic = element;

    const audioSessionId = this.audioSessionId;
    // Build the filtered routing before playback so it never blasts unprocessed.
    // This is THEIR song — it should be clearly present, the voice you hear.
    this.ambience.connectSignatureUnderscore(element, 0.2);
    this.ambience.setSignatureIntimate(Boolean(this.currentBeat().cinematic?.intimate));

    element
      .play()
      .then(() => {
        if (!this.audioEnabled || audioSessionId !== this.audioSessionId || this.signatureMusic !== element) {
          this.stopBackgroundMusicElement(element);
          if (this.signatureMusic === element) this.signatureMusic = undefined;
        }
      })
      .catch((error) => {
        // Most often: autoplay not yet unlocked. Reset so the next beat retries.
        console.warn("Signature underscore not ready yet:", error);
        if (this.signatureMusic === element) this.signatureMusic = undefined;
        this.signatureStarted = false;
        this.stopBackgroundMusicElement(element);
      });
  }

  private async updateBackgroundMusicForLocation(location: LocationId) {
    if (!this.audioEnabled) return;
    this.ensureSignatureUnderscore();
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
    registerGameAudioElement(newMusic);
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

  // Each place in chapter 1 owns a piece of music. Because the story moves
  // through long contiguous runs of one location, this crossfades only at the
  // real narrative seams (taxi → hospital → road → …), giving every scene its
  // own emotional color instead of a single track underneath everything.
  private async findLocationMusicUrl(location: LocationId) {
    if (this.chapter.id === "chapter-1") {
      const byLocation: Partial<Record<LocationId, string>> = {
        taxi: "/assets/audio/chapter-1-taxi.mp3",
        hospital: "/assets/audio/chapter-1-hospital.mp3",
        road: "/assets/audio/chapter-1-road.mp3",
        bosquete: "/assets/audio/chapter-1-bosquete.mp3",
        valley: "/assets/audio/chapter-1-valley.mp3",
        ravine: "/assets/audio/chapter-1-ravine.mp3",
        river: "/assets/audio/chapter-1-river.mp3"
      };
      return byLocation[location] ?? "/assets/audio/chapter-1.wav";
    }
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

    // Fade their song out alongside the scene so the chapter closes in silence.
    const signature = this.signatureMusic;
    if (signature) {
      this.signatureMusic = undefined;
      this.signatureStarted = false;
      this.tweens.addCounter({
        from: signature.volume,
        to: 0,
        duration: 1200,
        ease: "Sine.easeIn",
        onUpdate: (tween) => {
          signature.volume = tween.getValue() ?? 0;
        },
        onComplete: () => {
          this.stopBackgroundMusicElement(signature);
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
    if (!this.guideToggle.visible || this.guideToggle.alpha < 0.2) return false;
    const bounds = this.guideToggle.getBounds();
    if (!bounds.contains(pointer.x, pointer.y)) return false;

    this.toggleGuides();
    return true;
  }

  private tryToggleAudio(pointer: Phaser.Input.Pointer) {
    if (!this.audioToggle.visible || this.audioToggle.alpha < 0.2) return false;
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
    this.signatureMusic = undefined;
    this.signatureStarted = false;
    this.triedBackgroundMusic = false;
    this.ambience?.destroy();
    if (recreateAmbience) {
      this.ambience = new AmbienceEngine();
    }
  }

  private stopBackgroundMusicElement(music: HTMLAudioElement) {
    this.ambience?.releaseExternalMusic(music);
    this.ambience?.releaseSignatureUnderscore(music);
    if (this.signatureMusic === music) this.signatureMusic = undefined;
    music.pause();
    try {
      music.currentTime = 0;
    } catch {}
    music.removeAttribute("src");
    music.load();
    this.backgroundMusicElements.delete(music);
    unregisterGameAudioElement(music);
  }

  private shutdownAudioLifecycle() {
    window.removeEventListener(FORCE_STOP_AUDIO_EVENT, this.forceStopAudioHandler);
    this.stopAllAudioNow(false);
  }

  private forceDisableAudio() {
    this.audioEnabled = false;
    this.audioToggle?.setText("audio: off");
    this.stopAllAudioNow();
  }

  private toggleGuides() {
    this.guidesVisible = !this.guidesVisible;
    const hideHud = this.shouldHideHud(this.currentBeat());
    this.guideToggle.setText(`guias: ${this.guidesVisible ? "on" : "off"}`);
    this.locationText.setVisible(this.guidesVisible && !hideHud);
    this.scoreText.setVisible(this.guidesVisible && !hideHud);
    this.memoryCounterText.setVisible(this.guidesVisible && !hideHud);
  }

  private setSpeaker(speaker: StoryBeat["speaker"], immediate = false) {
    const changed = speaker !== this.currentSpeaker;
    this.currentSpeaker = speaker;
    this.speakerText.setText(speaker);
    this.speakerText.setColor(speakerColors[speaker] ?? "#fff2dc");

    const accentColor = speakerAccentHex[speaker] ?? 0x697383;
    this.dialogueAccent.setFillStyle(accentColor, 0.95);
    this.dialogueBg.setStrokeStyle(2, accentColor, 0.7);

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
    this.hoveredChoiceIndex = -1;
  }

  // Choice moments are the emotional pivots of a love story — where the player
  // *decides*. So each option is a small piece of cinema: it slides up and
  // settles with a stagger, breathes a faint accent shimmer while it waits, and
  // lifts toward the cursor on hover. The accent borrows the speaker's signature
  // hue so the buttons feel like the player's own voice answering.
  private renderChoices(beat: StoryBeat) {
    this.clearChoices();
    this.awaitingChoice = Boolean(beat.choices?.length);
    this.promptText.setText(this.awaitingChoice ? "elige con el corazon" : "toca para seguir");

    if (!beat.choices?.length) return;

    const width = 816;
    const height = 38;
    const step = 48;
    const accentColor = speakerAccentHex.Alexis;

    beat.choices.forEach((choice, index) => {
      const centerY = index * step + height / 2;
      const container = this.add.container(width / 2, centerY);

      const glow = this.add
        .rectangle(0, 0, width + 14, height + 14, accentColor, 0)
        .setOrigin(0.5)
        .setBlendMode(Phaser.BlendModes.SCREEN);
      const bg = this.add
        .rectangle(0, 0, width, height, 0x10131a, 0.9)
        .setOrigin(0.5)
        .setStrokeStyle(2, accentColor, 0.55);
      const accent = this.add.rectangle(-width / 2 + 3, 0, 4, height, accentColor, 0.85).setOrigin(0.5);
      const indicator = this.add
        .text(-width / 2 + 20, 0, "♥", {
          fontFamily: "Courier New",
          fontSize: "15px",
          fontStyle: "bold",
          color: speakerColors.Kiara
        })
        .setOrigin(0.5)
        .setAlpha(0);
      const label = this.add
        .text(-width / 2 + 22, 0, `${index + 1}.  ${choice.label}`, {
          fontFamily: "Courier New",
          fontSize: "14px",
          fontStyle: "bold",
          color: "#e8ddcb",
          wordWrap: { width: 740 }
        })
        .setOrigin(0, 0.5);

      container.add([glow, bg, accent, indicator, label]);
      this.choicesContainer.add(container);

      // Staggered slide-up entrance: each option lands a beat after the last.
      container.setAlpha(0);
      container.setX(width / 2 - 26);
      this.tweens.add({
        targets: container,
        alpha: 1,
        x: width / 2,
        delay: 90 + index * 110,
        duration: 460,
        ease: "Back.easeOut"
      });
      // A slow accent breath so the waiting options never feel frozen.
      this.tweens.add({
        targets: accent,
        alpha: 0.4,
        delay: 360 + index * 110,
        duration: 1300,
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut"
      });

      this.choiceButtons.push({
        bounds: new Phaser.Geom.Rectangle(this.choicesContainer.x, this.choicesContainer.y + index * step, width, height),
        choice,
        container,
        bg,
        glow,
        accent,
        label,
        indicator,
        index,
        accentColor
      });
    });
  }

  private updateChoiceHover(pointer: Phaser.Input.Pointer) {
    if (!this.awaitingChoice || !this.choiceButtons.length) return;

    const hovered = this.choiceButtons.find((button) => button.bounds.contains(pointer.x, pointer.y));
    const hoveredIndex = hovered ? hovered.index : -1;
    if (hoveredIndex === this.hoveredChoiceIndex) return;
    this.hoveredChoiceIndex = hoveredIndex;

    for (const button of this.choiceButtons) {
      this.setChoiceHovered(button, button.index === hoveredIndex);
    }

    this.input.setDefaultCursor(hovered ? "pointer" : "default");
  }

  private setChoiceHovered(button: ChoiceButton, hovered: boolean) {
    this.tweens.killTweensOf(button.container);
    this.tweens.killTweensOf(button.glow);
    this.tweens.killTweensOf(button.label);
    this.tweens.killTweensOf(button.indicator);

    if (hovered) {
      button.bg.setFillStyle(0x1b2129, 0.96);
      button.bg.setStrokeStyle(2, button.accentColor, 1);
      button.label.setColor("#fff7e8");
      this.tweens.add({ targets: button.container, scaleX: 1.018, scaleY: 1.06, duration: 200, ease: "Back.easeOut" });
      this.tweens.add({ targets: button.glow, alpha: 0.18, duration: 220, ease: "Sine.easeOut" });
      this.tweens.add({ targets: button.label, x: -button.bg.width / 2 + 30, duration: 220, ease: "Sine.easeOut" });
      this.tweens.add({ targets: button.indicator, alpha: 1, scaleX: 1.25, scaleY: 1.25, duration: 220, ease: "Back.easeOut" });
    } else {
      button.bg.setFillStyle(0x10131a, 0.9);
      button.bg.setStrokeStyle(2, button.accentColor, 0.55);
      button.label.setColor("#e8ddcb");
      this.tweens.add({ targets: button.container, scaleX: 1, scaleY: 1, duration: 220, ease: "Sine.easeOut" });
      this.tweens.add({ targets: button.glow, alpha: 0, duration: 220, ease: "Sine.easeOut" });
      this.tweens.add({ targets: button.label, x: -button.bg.width / 2 + 22, duration: 220, ease: "Sine.easeOut" });
      this.tweens.add({ targets: button.indicator, alpha: 0, scaleX: 1, scaleY: 1, duration: 180, ease: "Sine.easeIn" });
    }
  }

  private trySelectChoice(pointer: Phaser.Input.Pointer) {
    if (!this.awaitingChoice) return false;

    const selected = this.choiceButtons.find((button) => button.bounds.contains(pointer.x, pointer.y));
    if (!selected) return false;

    const { choice } = selected;
    this.awaitingChoice = false;
    this.choiceLocked = true;
    this.input.setDefaultCursor("default");

    // Confirm beat: the chosen line flares and lifts while its siblings dim away,
    // so the decision lands before the story moves on.
    this.choiceButtons.forEach((button) => {
      this.tweens.killTweensOf(button.container);
      this.tweens.killTweensOf(button.glow);
      this.tweens.killTweensOf(button.accent);
      if (button === selected) {
        button.bg.setStrokeStyle(2, button.accentColor, 1);
        button.indicator.setAlpha(1);
        this.tweens.add({
          targets: button.glow,
          alpha: { from: 0.3, to: 0 },
          duration: 520,
          ease: "Sine.easeOut"
        });
        this.tweens.add({
          targets: button.container,
          scaleX: 1.04,
          scaleY: 1.12,
          duration: 240,
          yoyo: true,
          ease: "Sine.easeOut"
        });
      } else {
        this.tweens.add({
          targets: button.container,
          alpha: 0.12,
          x: button.container.x - 12,
          duration: 320,
          ease: "Sine.easeIn"
        });
      }
    });

    if (choice.stat) {
      addStoryStat(this.progress, choice.stat.id, choice.stat.amount ?? 1);
      saveProgress(this.progress);
      this.updateScoreText();
      this.playScoreChime(choice.stat.id);
      this.flashToast(`+${choice.stat.amount ?? 1} ${choice.stat.label}`);
    }

    // Let the confirmation read for a moment before the answer continues.
    this.time.delayedCall(360, () => {
      this.choiceLocked = false;
      this.clearChoices();
      this.setSpeaker(choice.resultSpeaker ?? "Narrador");
      this.startDialogueText(choice.resultText);
    });

    return true;
  }

  private updateScoreText() {
    const { ternura, nervios, sueno } = this.progress.storyStats;
    this.scoreText.setText(`ternura ${ternura}  |  nervios ${nervios}  |  sueño ${sueno}`);
  }

  private updateMemoryCounterText() {
    const chapterMemoryIds = new Set(
      this.chapter.beats.flatMap((beat) => (beat.memory ? [beat.memory.id] : []))
    );
    const collected = this.progress.memories.filter((memory) => chapterMemoryIds.has(memory.id)).length;
    this.memoryCounterText.setText(`recuerdos ${collected}/${chapterMemoryIds.size}`);
  }
}
