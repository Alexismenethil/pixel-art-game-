import Phaser from "phaser";
import {
  chapters,
  type ActorId,
  type Chapter,
  type ChapterId,
  type LocationId,
  type SceneProp,
  type StoryBeat,
  type StoryChoice
} from "../game/data/chapters";
import { CharacterActor } from "../game/systems/CharacterActor";
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
  private guideToggle!: Phaser.GameObjects.Text;
  private cinematicTopBar!: Phaser.GameObjects.Rectangle;
  private cinematicBottomBar!: Phaser.GameObjects.Rectangle;
  private warmthOverlay!: Phaser.GameObjects.Rectangle;
  private vignetteTop!: Phaser.GameObjects.Rectangle;
  private vignetteBottom!: Phaser.GameObjects.Rectangle;
  private vignetteLeft!: Phaser.GameObjects.Rectangle;
  private vignetteRight!: Phaser.GameObjects.Rectangle;
  private choicesContainer!: Phaser.GameObjects.Container;
  private choiceButtons: ChoiceButton[] = [];
  private sceneProps: Phaser.GameObjects.Image[] = [];
  private scenePropsSignature = "";
  private memoryMarker?: Phaser.GameObjects.Container;
  private dialogueTimer?: Phaser.Time.TimerEvent;
  private fullDialogueText = "";
  private isTypingDialogue = false;
  private typingShowsChoices = false;
  private cameraTarget = { x: 480, y: 270 };
  private cameraDrift = { x: 0, y: 0, speed: 0.55 };
  private cameraSettling = false;
  private cameraSettleTimer?: Phaser.Time.TimerEvent;
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
  }

  create() {
    this.cameras.main.setBackgroundColor("#090b10");
    this.map = new PixelMapRenderer(this);
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
      if (this.tryToggleGuides(pointer)) return;
      if (this.isTypingDialogue) {
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
    this.actors.alexis.update(seconds);
    this.actors.kiara.update(seconds);
    this.updateCameraDrift(seconds);

    this.promptText.setAlpha(0.45 + Math.sin(seconds * 4) * 0.25);

    this.sceneProps.forEach((prop, index) => {
      const float = (prop.getData("float") as number | undefined) ?? 0;
      const baseY = (prop.getData("baseY") as number | undefined) ?? prop.y;
      if (float > 0) {
        prop.setY(baseY + Math.sin(seconds * 1.6 + index * 0.7) * float);
      }
    });

    if (this.memoryMarker) {
      this.memoryMarker.setScale(1 + Math.sin(seconds * 5) * 0.08);
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
  }

  private createUiCamera() {
    const uiObjects = [
      this.dialogueBox,
      this.choicesContainer,
      this.locationText,
      this.scoreText,
      this.guideToggle,
      this.warmthOverlay,
      this.vignetteTop,
      this.vignetteBottom,
      this.vignetteLeft,
      this.vignetteRight,
      this.cinematicTopBar,
      this.cinematicBottomBar
    ];
    const worldObjects = [
      ...this.map.getRenderObjects(),
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
  }

  private currentBeat() {
    return this.chapter.beats[this.beatIndex];
  }

  private applyBeat(beat: StoryBeat, immediate = false) {
    this.map.setLocation(beat.location);
    this.locationText.setText(`${this.chapter.title}  /  ${locationLabels[beat.location]}`);
    this.speakerText.setText(beat.speaker);
    this.clearChoices();
    this.startDialogueText(beat.text, Boolean(beat.choices?.length));

    this.actors.alexis.applyBeat(beat.actors.alexis, immediate);
    this.actors.kiara.applyBeat(beat.actors.kiara, immediate);
    this.renderSceneProps(beat.props ?? [], immediate);
    this.updateMemoryMarker(beat);
    this.applyCinematicMood(beat, immediate);

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

    this.cameras.main.pan(x, y, duration, "Sine.easeInOut");
    this.cameras.main.zoomTo(zoom, duration, "Sine.easeInOut");
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
    const currentIndex = chapters.findIndex((chapter) => chapter.id === this.chapter.id);
    const nextChapter = chapters[currentIndex + 1];

    completeChapter(this.progress, this.chapter.id);
    if (nextChapter) unlockChapter(this.progress, nextChapter.id);
    saveProgress(this.progress);

    this.isTransitioning = true;
    this.cameras.main.fadeOut(420, 9, 11, 16);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
      this.scene.start("HomeScene");
    });
  }

  private updateMemoryMarker(beat: StoryBeat) {
    this.memoryMarker?.destroy();
    this.memoryMarker = undefined;

    if (!beat.memory) return;
    if (this.progress.memories.some((memory) => memory.id === beat.memory?.id)) return;

    const marker = this.add.container(beat.memory.x, beat.memory.y).setDepth(70);
    this.uiCamera?.ignore(marker);
    const halo = this.add.ellipse(0, 0, 92, 58, 0xfff1a5, 0.16);
    const card = this.add.graphics();
    card.fillStyle(0x151820, 0.9);
    card.fillRoundedRect(-42, -27, 84, 54, 10);
    card.lineStyle(3, 0xffd27d, 0.95);
    card.strokeRoundedRect(-42, -27, 84, 54, 10);
    card.lineStyle(1, 0xffffff, 0.18);
    card.strokeRoundedRect(-34, -19, 68, 38, 7);
    const gemShadow = this.add.polygon(3, 3, [0, -17, 19, 0, 0, 17, -19, 0], 0x5b3d2f, 0.38);
    const gem = this.add.polygon(0, 0, [0, -17, 19, 0, 0, 17, -19, 0], 0xfff1a5, 1);
    gem.setStrokeStyle(3, 0xe79037, 1);
    const spark = this.add
      .text(0, -1, "*", {
        fontFamily: "Courier New",
        fontSize: "24px",
        fontStyle: "bold",
        color: "#10131a"
      })
      .setOrigin(0.5);
    const text = this.add
      .text(0, -47, "recuerdo", {
        fontFamily: "Courier New",
        fontSize: "14px",
        fontStyle: "bold",
        color: "#fff2dc",
        stroke: "#10131a",
        strokeThickness: 4
      })
      .setOrigin(0.5);

    marker.add([halo, card, gemShadow, gem, spark, text]);
    marker.setVisible(this.guidesVisible);
    this.memoryMarker = marker;
  }

  private tryCollectMemory(pointer: Phaser.Input.Pointer) {
    const beat = this.currentBeat();
    if (!beat.memory || !this.memoryMarker || !this.guidesVisible) return false;

    const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
    const distance = Phaser.Math.Distance.Between(worldPoint.x, worldPoint.y, beat.memory.x, beat.memory.y);

    if (distance > 70) return false;

    addMemory(this.progress, {
      id: beat.memory.id,
      label: beat.memory.label,
      text: beat.memory.text
    });
    this.playMemoryChime();
    saveProgress(this.progress);
    this.memoryMarker.destroy();
    this.memoryMarker = undefined;
    this.flashToast(`Recuerdo guardado: ${beat.memory.label}`);
    return true;
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
      const alpha = propData.alpha ?? 1;
      const prop = this.add
        .image(propData.x, propData.y, propData.texture)
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

  private playMemoryChime() {
    const AudioContextCtor =
      window.AudioContext ??
      (window as Window & typeof globalThis & { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!AudioContextCtor) return;

    const context = new AudioContextCtor();
    const gain = context.createGain();
    const now = context.currentTime;
    gain.connect(context.destination);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.08, now + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.72);

    [
      { frequency: 660, delay: 0 },
      { frequency: 880, delay: 0.08 },
      { frequency: 1320, delay: 0.18 }
    ].forEach(({ frequency, delay }) => {
      const oscillator = context.createOscillator();
      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(frequency, now + delay);
      oscillator.connect(gain);
      oscillator.start(now + delay);
      oscillator.stop(now + delay + 0.32);
    });

    window.setTimeout(() => {
      void context.close();
    }, 900);
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
    this.memoryMarker?.setVisible(this.guidesVisible);
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
    this.dialogueTimer = this.time.addEvent({
      delay: dialogueTypingDelayMs,
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
}
