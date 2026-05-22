import Phaser from "phaser";
import { chapters, type Chapter } from "../game/data/chapters";
import { loadProgress, resetProgress } from "../game/systems/ProgressStore";

export class HomeScene extends Phaser.Scene {
  private progress = loadProgress();
  private background!: Phaser.GameObjects.Graphics;

  constructor() {
    super("HomeScene");
  }

  create() {
    this.progress = loadProgress();
    this.cameras.main.setBackgroundColor("#090b10");
    this.background = this.add.graphics().setDepth(0);

    this.add
      .text(64, 46, "Alexis & Kiara", {
        fontFamily: "Courier New",
        fontSize: "54px",
        fontStyle: "bold",
        color: "#fff2dc"
      })
      .setDepth(2);

    this.add
      .text(68, 104, "Historieta pixel interactiva", {
        fontFamily: "Courier New",
        fontSize: "18px",
        fontStyle: "bold",
        color: "#e79037"
      })
      .setDepth(2);

    this.add
      .text(68, 136, "Elige un capitulo desbloqueado. Dentro de la historia solo toca la pantalla para avanzar.", {
        fontFamily: "Courier New",
        fontSize: "18px",
        color: "#b7b0a5",
        wordWrap: { width: 760 }
      })
      .setDepth(2);

    chapters.forEach((chapter, index) => this.createChapterCard(chapter, index));
    this.createResetControl();

    this.cameras.main.fadeIn(400, 9, 11, 16);
  }

  update(time: number) {
    this.drawBackground(time / 1000);
  }

  private createChapterCard(chapter: Chapter, index: number) {
    const unlocked = this.progress.unlockedChapters.includes(chapter.id);
    const completed = this.progress.completedChapters.includes(chapter.id);
    const x = 68 + (index % 2) * 416;
    const y = 224 + Math.floor(index / 2) * 122;
    const card = this.add.container(x, y).setDepth(3);
    const fill = unlocked ? 0x1c2027 : 0x11151d;
    const stroke = completed ? 0x70a35a : unlocked ? 0xe79037 : 0x4d5663;
    const bg = this.add
      .rectangle(0, 0, 372, 92, fill)
      .setOrigin(0)
      .setStrokeStyle(3, stroke);

    const eyebrow = this.add.text(20, 14, unlocked ? `CAPITULO ${chapter.number}` : "BLOQUEADO", {
      fontFamily: "Courier New",
      fontSize: "14px",
      fontStyle: "bold",
      color: unlocked ? "#53b6b2" : "#68717d"
    });

    const title = this.add.text(20, 36, unlocked ? chapter.title : "???", {
      fontFamily: "Courier New",
      fontSize: "22px",
      fontStyle: "bold",
      color: unlocked ? "#fff2dc" : "#68717d",
      wordWrap: { width: 320 }
    });

    const route = this.add.text(20, 66, unlocked ? chapter.route : chapter.lockedTeaser, {
      fontFamily: "Courier New",
      fontSize: "14px",
      color: unlocked ? "#b7b0a5" : "#68717d",
      wordWrap: { width: 330 }
    });

    card.add([bg, eyebrow, title, route]);

    if (!unlocked) return;

    bg.setInteractive({ useHandCursor: true });
    bg.on("pointerover", () => bg.setFillStyle(0x262b33));
    bg.on("pointerout", () => bg.setFillStyle(fill));
    bg.on("pointerdown", () => {
      this.cameras.main.fadeOut(260, 9, 11, 16);
      this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
        this.scene.start("StoryScene", { chapterId: chapter.id });
      });
    });
  }

  private createResetControl() {
    const reset = this.add
      .text(840, 494, "reset", {
        fontFamily: "Courier New",
        fontSize: "14px",
        color: "#68717d"
      })
      .setDepth(5)
      .setInteractive({ useHandCursor: true });

    reset.on("pointerdown", () => {
      resetProgress();
      this.scene.restart();
    });
  }

  private drawBackground(time: number) {
    this.background.clear();
    this.background.fillStyle(0x090b10, 1);
    this.background.fillRect(0, 0, 960, 540);

    for (let y = 0; y < 540; y += 18) {
      this.background.fillStyle(y % 36 === 0 ? 0x111722 : 0x0c1018, 0.72);
      this.background.fillRect(0, y, 960, 9);
    }

    for (let i = 0; i < 18; i += 1) {
      const x = (i * 71 + time * 10) % 1000;
      const y = 42 + ((i * 47) % 420);
      const alpha = 0.12 + Math.sin(time * 2 + i) * 0.05;
      this.background.fillStyle(0xfff2dc, alpha);
      this.background.fillRect(x, y, 34, 4);
    }
  }
}
