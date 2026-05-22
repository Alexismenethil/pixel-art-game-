import Phaser from "phaser";
import {
  chapters,
  type ActorId,
  type Chapter,
  type ChapterId,
  type StoryBeat
} from "../game/data/chapters";
import { CharacterActor } from "../game/systems/CharacterActor";
import { PixelMapRenderer } from "../game/systems/PixelMapRenderer";
import {
  addMemory,
  completeChapter,
  loadProgress,
  saveProgress,
  unlockChapter
} from "../game/systems/ProgressStore";

type StorySceneData = {
  chapterId: ChapterId;
};

export class StoryScene extends Phaser.Scene {
  private chapter!: Chapter;
  private beatIndex = 0;
  private map!: PixelMapRenderer;
  private actors!: Record<ActorId, CharacterActor>;
  private progress = loadProgress();
  private dialogueBox!: Phaser.GameObjects.Container;
  private dialogueBg!: Phaser.GameObjects.Rectangle;
  private speakerText!: Phaser.GameObjects.Text;
  private dialogueText!: Phaser.GameObjects.Text;
  private promptText!: Phaser.GameObjects.Text;
  private locationText!: Phaser.GameObjects.Text;
  private guideToggle!: Phaser.GameObjects.Text;
  private memoryMarker?: Phaser.GameObjects.Container;
  private guidesVisible = true;
  private isTransitioning = false;

  constructor() {
    super("StoryScene");
  }

  init(data: StorySceneData) {
    this.chapter = chapters.find((chapter) => chapter.id === data.chapterId) ?? chapters[0];
    this.beatIndex = 0;
    this.progress = loadProgress();
    this.guidesVisible = true;
    this.isTransitioning = false;
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
    this.applyBeat(this.currentBeat(), true);

    this.input.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
      if (this.isTransitioning) return;
      if (this.tryToggleGuides(pointer)) return;
      if (this.tryCollectMemory(pointer)) return;
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

    this.promptText.setAlpha(0.45 + Math.sin(seconds * 4) * 0.25);

    if (this.memoryMarker) {
      this.memoryMarker.setScale(1 + Math.sin(seconds * 5) * 0.08);
    }
  }

  private createDialogueUi() {
    this.dialogueBox = this.add.container(50, 376).setDepth(80);
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
      .setDepth(85);

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
      .setInteractive({ useHandCursor: true });
  }

  private currentBeat() {
    return this.chapter.beats[this.beatIndex];
  }

  private applyBeat(beat: StoryBeat, immediate = false) {
    this.map.setLocation(beat.location);
    this.locationText.setText(`${this.chapter.title}  /  ${beat.location}`);
    this.speakerText.setText(beat.speaker);
    this.dialogueText.setText(beat.text);

    this.actors.alexis.applyBeat(beat.actors.alexis, immediate);
    this.actors.kiara.applyBeat(beat.actors.kiara, immediate);
    this.updateMemoryMarker(beat);

    const zoom = beat.camera?.zoom ?? 1;
    const x = beat.camera?.x ?? 480;
    const y = beat.camera?.y ?? 270;
    this.cameras.main.pan(x, y, immediate ? 0 : 420, "Sine.easeInOut");
    this.cameras.main.zoomTo(zoom, immediate ? 0 : 420, "Sine.easeInOut");
  }

  private advance() {
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
    const glow = this.add.rectangle(0, 0, 80, 52, 0xfff1a5, 0.24);
    const item = this.add.rectangle(0, 0, 54, 28, 0xfff1a5, 1).setStrokeStyle(4, 0x8f8173);
    const text = this.add
      .text(0, -42, "recuerdo", {
        fontFamily: "Courier New",
        fontSize: "14px",
        fontStyle: "bold",
        color: "#fff2dc",
        stroke: "#10131a",
        strokeThickness: 4
      })
      .setOrigin(0.5);

    marker.add([glow, item, text]);
    marker.setVisible(this.guidesVisible);
    this.memoryMarker = marker;
  }

  private tryCollectMemory(pointer: Phaser.Input.Pointer) {
    const beat = this.currentBeat();
    if (!beat.memory || !this.memoryMarker || !this.guidesVisible) return false;

    const distance = Phaser.Math.Distance.Between(
      pointer.worldX,
      pointer.worldY,
      beat.memory.x,
      beat.memory.y
    );

    if (distance > 70) return false;

    addMemory(this.progress, {
      id: beat.memory.id,
      label: beat.memory.label,
      text: beat.memory.text
    });
    saveProgress(this.progress);
    this.memoryMarker.destroy();
    this.memoryMarker = undefined;
    this.flashMemoryText(beat.memory.label);
    return true;
  }

  private flashMemoryText(label: string) {
    const toast = this.add
      .text(480, 102, `Recuerdo guardado: ${label}`, {
        fontFamily: "Courier New",
        fontSize: "18px",
        fontStyle: "bold",
        color: "#fff2dc",
        backgroundColor: "#10131acc",
        padding: { x: 14, y: 10 }
      })
      .setOrigin(0.5)
      .setDepth(100);

    this.tweens.add({
      targets: toast,
      y: 82,
      alpha: 0,
      duration: 1500,
      ease: "Sine.easeIn",
      onComplete: () => toast.destroy()
    });
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
    this.memoryMarker?.setVisible(this.guidesVisible);
  }
}
