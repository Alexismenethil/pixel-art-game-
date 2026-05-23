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

export class StoryScene extends Phaser.Scene {
  private chapter!: Chapter;
  private beatIndex = 0;
  private map!: PixelMapRenderer;
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
  private fullDialogueText = "";
  private isTypingDialogue = false;
  private typingShowsChoices = false;
  private cameraTarget = { x: 480, y: 270 };
  private cameraDrift = { x: 0, y: 0, speed: 0.55 };
  private cameraSettling = false;
  private cameraSettleTimer?: Phaser.Time.TimerEvent;
  private backgroundMusic?: HTMLAudioElement;
  private triedBackgroundMusic = false;
  private awaitingChoice = false;
  private guidesVisible = true;
  private isTransitioning = false;

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
    this.cameraSettleTimer?.remove(false);
    this.dialogueTimer = undefined;
    this.cameraSettleTimer = undefined;
    this.fullDialogueText = "";
    this.isTypingDialogue = false;
    this.typingShowsChoices = false;
    this.cameraTarget = { x: 480, y: 270 };
    this.cameraDrift = { x: 0, y: 0, speed: 0.55 };
    this.cameraSettling = false;
    this.backgroundMusic?.pause();
    this.backgroundMusic = undefined;
    this.triedBackgroundMusic = false;
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
  }

  create() {
    this.cameras.main.setBackgroundColor("#090b10");
    this.map = new PixelMapRenderer(this);
    this.particles = new ParticleField(this);
    this.actors = {
      alexis: new CharacterActor(this, "alexis", 360, 430, 0),
      kiara: new CharacterActor(this, "kiara", 540, 430, 0.8)
    };

    this.createDialogueUi();
    this.createTopControls();
    this.createCinematicUi();
    this.createUiCamera();
    this.applyBeat(this.currentBeat(), true);

    this.input.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
      if (this.isTransitioning) return;
      void this.tryStartBackgroundMusic();
      if (this.pendingSmsNotificationSound) {
        this.pendingSmsNotificationSound = false;
        this.playSmsNotificationSound();
      }
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

    this.dialogueBox.add([this.dialogueBg, this.speakerText, this.dialogueText, this.promptText]);

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

    this.updateScoreText();
    this.updateMemoryCounterText();
  }

  private createCinematicUi() {
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
  }

  private createUiCamera() {
    const uiObjects = [
      this.dialogueBox,
      this.choicesContainer,
      this.locationText,
      this.scoreText,
      this.memoryCounterText,
      this.guideToggle,
      this.warmthOverlay,
      this.vignetteTop,
      this.vignetteBottom,
      this.vignetteLeft,
      this.vignetteRight,
      this.cinematicTopBar,
      this.cinematicBottomBar,
      this.heartbeatOverlay,
      this.bloomOverlay,
      this.chromaticOverlay
    ];
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
    if (this.cameraDrift.x === 0 && this.cameraDrift.y === 0) return;

    const dx = Math.sin(seconds * this.cameraDrift.speed) * this.cameraDrift.x;
    const dy = Math.cos(seconds * this.cameraDrift.speed * 0.82) * this.cameraDrift.y;
    this.cameras.main.centerOn(this.cameraTarget.x + dx, this.cameraTarget.y + dy);
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
  }

  private currentBeat() {
    return this.chapter.beats[this.beatIndex];
  }

  private applyBeat(beat: StoryBeat, immediate = false) {
    const previousLocation = (this as { _prevLocation?: LocationId })._prevLocation;
    this.map.setLocation(beat.location);
    this.particles.setLocation(beat.location, immediate);
    this.locationText.setText(`${this.chapter.title}  /  ${locationLabels[beat.location]}`);
    this.speakerText.setText(beat.speaker);
    this.clearChoices();
    this.currentPace = beat.pace ?? "normal";
    this.startDialogueText(beat.text, Boolean(beat.choices?.length));

    this.actors.alexis.applyBeat(beat.actors.alexis, immediate);
    this.actors.kiara.applyBeat(beat.actors.kiara, immediate);
    this.renderSceneProps(beat.props ?? [], immediate);
    this.updateMemoryMarker(beat, immediate);
    this.updateSmsNotification(beat, immediate);
    this.applyCinematicMood(beat, immediate);

    const heartbeat = beat.cinematic?.heartbeat ?? 0;
    this.heartbeatIntensity = heartbeat;
    if (!immediate && heartbeat > 0) {
      this.heartbeatPulse = Math.max(this.heartbeatPulse, 0.65);
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

  private advance() {
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
      sequence.forEach((item, index) => {
        this.tweens.add({
          targets: item,
          alpha: item === continueHint ? 0.7 : 1,
          y: (item as Phaser.GameObjects.Text).y - 6,
          delay: index * 320,
          duration: 720,
          ease: "Sine.easeOut"
        });
      });

      this.tweens.add({
        targets: continueHint,
        alpha: 0.35,
        delay: sequence.length * 320 + 900,
        duration: 900,
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut"
      });

      this.input.once("pointerdown", () => {
        this.tweens.add({
          targets: [overlay, credits],
          alpha: 0,
          duration: 600,
          ease: "Sine.easeIn"
        });
        this.time.delayedCall(620, () => onContinue());
      });
      this.input.keyboard?.once("keydown-SPACE", () => {
        this.tweens.add({
          targets: [overlay, credits],
          alpha: 0,
          duration: 600,
          ease: "Sine.easeIn"
        });
        this.time.delayedCall(620, () => onContinue());
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
      .text(480, 196, text, {
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
      y: 184,
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

  private renderSceneProps(props: SceneProp[], immediate = false) {
    const signature = JSON.stringify(props);
    if (signature === this.scenePropsSignature) return;

    this.sceneProps.forEach((prop) => prop.destroy());
    this.sceneProps = [];
    this.scenePropsSignature = signature;

    props.forEach((propData) => {
      const texture = this.resolveScenePropTexture(propData.texture);
      if (!texture) return;

      const alpha = propData.alpha ?? 1;
      const prop = this.add
        .image(propData.x, propData.y, texture)
        .setOrigin(0.5, 1)
        .setDepth(propData.depth ?? 31)
        .setScale(propData.scale ?? 0.46)
        .setAlpha(immediate ? alpha : 0)
        .setFlipX(propData.flipX ?? false);

      prop.setData("baseY", propData.y);
      prop.setData("float", propData.float ?? 0);
      this.uiCamera?.ignore(prop);
      this.sceneProps.push(prop);

      if (!immediate) {
        this.tweens.add({
          targets: prop,
          alpha,
          duration: 260,
          ease: "Sine.easeOut"
        });
      }
    });
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

  private async tryStartBackgroundMusic() {
    if (this.triedBackgroundMusic || this.backgroundMusic) return;

    this.triedBackgroundMusic = true;
    const url = await this.findBackgroundMusicUrl();
    if (!url) return;

    const audio = new Audio(url);
    audio.loop = true;
    audio.volume = 0;
    this.backgroundMusic = audio;

    try {
      await audio.play();
      this.tweens.addCounter({
        from: 0,
        to: 0.16,
        duration: 1600,
        ease: "Sine.easeOut",
        onUpdate: (tween) => {
          if (this.backgroundMusic) {
            this.backgroundMusic.volume = tween.getValue() ?? 0;
          }
        }
      });
    } catch {
      this.backgroundMusic = undefined;
    }
  }

  private async findBackgroundMusicUrl() {
    const candidates = [`/assets/audio/${this.chapter.id}.mp3`, `/assets/audio/${this.chapter.id}.ogg`];

    for (const url of candidates) {
      try {
        const response = await fetch(url, { method: "HEAD" });
        if (response.ok) return url;
      } catch {
        // Missing music is fine while the soundtrack is still being composed.
      }
    }

    return undefined;
  }

  private fadeOutBackgroundMusic() {
    const music = this.backgroundMusic;
    if (!music) return;

    this.backgroundMusic = undefined;
    this.tweens.addCounter({
      from: music.volume,
      to: 0,
      duration: 900,
      ease: "Sine.easeIn",
      onUpdate: (tween) => {
        music.volume = tween.getValue() ?? 0;
      },
      onComplete: () => {
        music.pause();
        music.currentTime = 0;
      }
    });
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
    const context = this.createAudioContext();
    if (!context) return;

    const output = this.createEchoBus(context, 0.86, 0.09, 0.08, 0.12);
    const now = context.currentTime;

    this.scheduleTone(context, output, 880, now, 0.16, 0.052, "sine");
    this.scheduleTone(context, output, 1318.51, now + 0.09, 0.18, 0.046, "sine");
    this.scheduleTone(context, output, 1760, now + 0.19, 0.2, 0.032, "triangle");

    window.setTimeout(() => {
      void context.close();
    }, 700);
  }

  private playScoreChime(statId: StoryStatId) {
    const context = this.createAudioContext();
    if (!context) return;

    const output = this.createEchoBus(context, 0.9, 0.18, 0.16, 0.22);
    const now = context.currentTime;

    if (statId === "ternura") {
      [
        { frequency: 659.25, delay: 0, volume: 0.044 },
        { frequency: 783.99, delay: 0.08, volume: 0.038 },
        { frequency: 1046.5, delay: 0.18, volume: 0.032 }
      ].forEach(({ frequency, delay, volume }) => {
        this.scheduleTone(context, output, frequency, now + delay, 0.42, volume, "sine");
      });
    } else if (statId === "nervios") {
      [
        { frequency: 466.16, delay: 0, volume: 0.036 },
        { frequency: 440, delay: 0.06, volume: 0.032 },
        { frequency: 523.25, delay: 0.14, volume: 0.028 },
        { frequency: 493.88, delay: 0.2, volume: 0.022 }
      ].forEach(({ frequency, delay, volume }) => {
        this.scheduleTone(context, output, frequency, now + delay, 0.18, volume, "triangle");
      });
      this.scheduleNoise(context, output, now, 0.22, 0.006, 1600, "highpass");
    } else {
      [
        { frequency: 523.25, delay: 0, volume: 0.032 },
        { frequency: 659.25, delay: 0.11, volume: 0.036 },
        { frequency: 783.99, delay: 0.24, volume: 0.032 },
        { frequency: 987.77, delay: 0.39, volume: 0.028 },
        { frequency: 1174.66, delay: 0.56, volume: 0.022 }
      ].forEach(({ frequency, delay, volume }) => {
        this.scheduleTone(context, output, frequency, now + delay, 0.58, volume, "sine");
      });
      this.scheduleTone(context, output, 196, now, 1.1, 0.014, "triangle");
    }

    window.setTimeout(() => {
      void context.close();
    }, 1500);
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

  private playMemoryRevealChime() {
    const context = this.createAudioContext();
    if (!context) return;

    const output = context.createGain();
    const delay = context.createDelay();
    const feedback = context.createGain();
    const wet = context.createGain();
    const now = context.currentTime;

    output.gain.setValueAtTime(0.78, now);
    delay.delayTime.setValueAtTime(0.16, now);
    feedback.gain.setValueAtTime(0.1, now);
    wet.gain.setValueAtTime(0.24, now);
    output.connect(context.destination);
    output.connect(delay);
    delay.connect(feedback);
    feedback.connect(delay);
    delay.connect(wet);
    wet.connect(context.destination);

    this.scheduleTone(context, output, 659.25, now, 0.34, 0.028, "triangle");
    this.scheduleTone(context, output, 880, now + 0.06, 0.34, 0.038, "sine");
    this.scheduleTone(context, output, 1174.66, now + 0.16, 0.42, 0.032, "sine");
    this.scheduleTone(context, output, 1567.98, now + 0.27, 0.3, 0.02, "triangle");

    window.setTimeout(() => {
      void context.close();
    }, 1000);
  }

  private playMemoryChime() {
    const context = this.createAudioContext();
    if (!context) return;

    const output = context.createGain();
    const delay = context.createDelay();
    const feedback = context.createGain();
    const wet = context.createGain();
    const now = context.currentTime;

    output.gain.setValueAtTime(0.92, now);
    delay.delayTime.setValueAtTime(0.21, now);
    feedback.gain.setValueAtTime(0.2, now);
    wet.gain.setValueAtTime(0.3, now);

    output.connect(context.destination);
    output.connect(delay);
    delay.connect(feedback);
    feedback.connect(delay);
    delay.connect(wet);
    wet.connect(context.destination);

    [
      { frequency: 392, delay: 0, volume: 0.026, duration: 0.9, type: "triangle" as OscillatorType },
      { frequency: 523.25, delay: 0.02, volume: 0.048, duration: 0.62, type: "sine" as OscillatorType },
      { frequency: 659.25, delay: 0.1, volume: 0.056, duration: 0.62, type: "sine" as OscillatorType },
      { frequency: 783.99, delay: 0.2, volume: 0.058, duration: 0.6, type: "sine" as OscillatorType },
      { frequency: 1046.5, delay: 0.34, volume: 0.046, duration: 0.54, type: "triangle" as OscillatorType },
      { frequency: 1318.51, delay: 0.47, volume: 0.034, duration: 0.46, type: "sine" as OscillatorType },
      { frequency: 1567.98, delay: 0.58, volume: 0.026, duration: 0.34, type: "sine" as OscillatorType }
    ].forEach(({ frequency, delay, volume, duration, type }) => {
      this.scheduleTone(context, output, frequency, now + delay, duration, volume, type);
    });

    [
      { frequency: 1760, delay: 0.24 },
      { frequency: 2093, delay: 0.42 },
      { frequency: 2637.02, delay: 0.64 }
    ].forEach(({ frequency, delay }) => {
      this.scheduleTone(context, output, frequency, now + delay, 0.2, 0.016, "triangle");
    });

    window.setTimeout(() => {
      void context.close();
    }, 1900);
  }

  private createAudioContext() {
    const AudioContextCtor =
      window.AudioContext ??
      (window as Window & typeof globalThis & { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!AudioContextCtor) return undefined;

    const context = new AudioContextCtor();
    if (context.state === "suspended") {
      void context.resume();
    }
    return context;
  }

  private createEchoBus(
    context: AudioContext,
    outputVolume: number,
    delayTime: number,
    feedbackAmount: number,
    wetAmount: number
  ) {
    const output = context.createGain();
    const delay = context.createDelay();
    const feedback = context.createGain();
    const wet = context.createGain();

    output.gain.setValueAtTime(outputVolume, context.currentTime);
    delay.delayTime.setValueAtTime(delayTime, context.currentTime);
    feedback.gain.setValueAtTime(feedbackAmount, context.currentTime);
    wet.gain.setValueAtTime(wetAmount, context.currentTime);

    output.connect(context.destination);
    output.connect(delay);
    delay.connect(feedback);
    feedback.connect(delay);
    delay.connect(wet);
    wet.connect(context.destination);

    return output;
  }

  private scheduleTone(
    context: AudioContext,
    destination: AudioNode,
    frequency: number,
    start: number,
    duration: number,
    volume: number,
    type: OscillatorType
  ) {
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, start);

    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(volume, start + 0.025);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);

    oscillator.connect(gain);
    gain.connect(destination);
    oscillator.start(start);
    oscillator.stop(start + duration + 0.03);
  }

  private scheduleNoise(
    context: AudioContext,
    destination: AudioNode,
    start: number,
    duration: number,
    volume: number,
    filterFrequency: number,
    filterType: BiquadFilterType
  ) {
    const sampleCount = Math.max(1, Math.floor(context.sampleRate * duration));
    const buffer = context.createBuffer(1, sampleCount, context.sampleRate);
    const data = buffer.getChannelData(0);

    for (let index = 0; index < sampleCount; index += 1) {
      const fadeOut = 1 - index / sampleCount;
      data[index] = (Math.random() * 2 - 1) * fadeOut;
    }

    const source = context.createBufferSource();
    const filter = context.createBiquadFilter();
    const gain = context.createGain();

    source.buffer = buffer;
    filter.type = filterType;
    filter.frequency.setValueAtTime(filterFrequency, start);
    filter.Q.setValueAtTime(filterType === "bandpass" ? 1.4 : 0.7, start);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(volume, start + 0.025);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);

    source.connect(filter);
    filter.connect(gain);
    gain.connect(destination);
    source.start(start);
    source.stop(start + duration + 0.03);
  }

  private tryToggleGuides(pointer: Phaser.Input.Pointer) {
    const bounds = this.guideToggle.getBounds();
    if (!bounds.contains(pointer.x, pointer.y)) return false;

    this.toggleGuides();
    return true;
  }

  private toggleGuides() {
    this.guidesVisible = !this.guidesVisible;
    this.guideToggle.setText(`guias: ${this.guidesVisible ? "on" : "off"}`);
    this.locationText.setVisible(this.guidesVisible);
    this.scoreText.setVisible(this.guidesVisible);
    this.memoryCounterText.setVisible(this.guidesVisible);
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

    let index = 0;
    this.promptText.setText("toca para completar");
    const delay = paceDelays[this.currentPace] ?? dialogueTypingDelayMs;
    this.dialogueTimer = this.time.addEvent({
      delay,
      loop: true,
      callback: () => {
        index += 1;
        this.dialogueText.setText(this.fullDialogueText.slice(0, index));

        if (index >= this.fullDialogueText.length) {
          this.finishDialogueText();
        }
      }
    });
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

    this.promptText.setText("toca para seguir");
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
    this.speakerText.setText(choice.resultSpeaker ?? "Narrador");
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
