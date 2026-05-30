import Phaser from "phaser";
import { chapters, isChapterAvailableInCurrentDeploy, type Chapter } from "../game/data/chapters";
import { fadeOutMenuMusic, startMenuMusic, stopMenuMusic } from "../game/systems/menuMusic";
import { loadProgress, resetProgress } from "../game/systems/ProgressStore";

export class HomeScene extends Phaser.Scene {
  private progress = loadProgress();
  private background!: Phaser.GameObjects.Graphics;
  private backdrop?: Phaser.GameObjects.Image;
  private titleShimmer!: Phaser.GameObjects.Text;
  private resetModal?: Phaser.GameObjects.Container;

  constructor() {
    super("HomeScene");
  }

  create() {
    this.progress = loadProgress();
    this.cameras.main.setBackgroundColor("#090b10");
    this.createBackdrop();
    this.createHero();
    this.createCalendarPanel();
    chapters.forEach((chapter, index) => this.createChapterCard(chapter, index));
    this.createResetControl();
    startMenuMusic(0.16, 1400);

    this.cameras.main.fadeIn(420, 9, 11, 16);
  }

  update(time: number) {
    const seconds = time / 1000;
    this.drawBackground(seconds);
    this.titleShimmer.setAlpha(0.18 + Math.sin(seconds * 2.4) * 0.08);

    if (this.backdrop) {
      this.backdrop.setPosition(480 + Math.sin(seconds * 0.18) * 7, 270 + Math.cos(seconds * 0.14) * 4);
    }
  }

  private createBackdrop() {
    const key = this.textures.exists("home-river-hero")
      ? "home-river-hero"
      : this.textures.exists("bg-river-beauty-1")
        ? "bg-river-beauty-1"
        : "scene-river-picnic-spot";
    this.backdrop = this.add.image(480, 270, key).setDisplaySize(1000, 563).setDepth(0);
    this.background = this.add.graphics().setDepth(1);
  }

  private createHero() {
    this.add
      .text(70, 40, "PRIMER RECUERDO DISPONIBLE", {
        fontFamily: "Courier New",
        fontSize: "14px",
        fontStyle: "bold",
        color: "#8fe8ff"
      })
      .setDepth(3);

    this.titleShimmer = this.add
      .text(70, 72, "Alexis & Kiara", {
        fontFamily: "Courier New",
        fontSize: "62px",
        fontStyle: "bold",
        color: "#53b6b2"
      })
      .setDepth(2);

    this.add
      .text(72, 66, "Alexis & Kiara", {
        fontFamily: "Courier New",
        fontSize: "62px",
        fontStyle: "bold",
        color: "#fff2dc"
      })
      .setDepth(3);

    this.add
      .text(74, 133, "Donde el río nos vio", {
        fontFamily: "Courier New",
        fontSize: "28px",
        fontStyle: "bold",
        color: "#ffd28a"
      })
      .setDepth(3);

    this.add
      .text(
        76,
        178,
        "Una historia interactiva sobre una tarde que empezó con nervios y terminó guardándose en un lugar muy especial.",
        {
          fontFamily: "Courier New",
          fontSize: "16px",
          color: "#fff2dc",
          lineSpacing: 7,
          wordWrap: { width: 500 }
        }
      )
      .setDepth(3);

    this.createPrimaryButton(76, 264, 310, 62, "ENTRAR AL RECUERDO", "toca para empezar", () => {
      this.startChapter(chapters[0]);
    });
  }

  private createCalendarPanel() {
    const panel = this.add.container(654, 52).setDepth(4);
    const bg = this.add.rectangle(0, 0, 238, 232, 0x071018, 0.74).setOrigin(0).setStrokeStyle(2, 0xffd28a, 0.9);
    const shine = this.add.rectangle(0, 0, 238, 7, 0xe79037, 0.96).setOrigin(0);
    const title = this.add.text(18, 22, "Nuevo capítulo", {
      fontFamily: "Courier New",
      fontSize: "18px",
      fontStyle: "bold",
      color: "#fff2dc"
    });
    const title2 = this.add.text(18, 48, "cada mes", {
      fontFamily: "Courier New",
      fontSize: "18px",
      fontStyle: "bold",
      color: "#ffd28a"
    });
    const copy = this.add.text(18, 84, "Por ahora solo se abre el primer recuerdo. Los demás quedan guardados para más adelante.", {
      fontFamily: "Courier New",
      fontSize: "13px",
      color: "#d8d0c2",
      lineSpacing: 5,
      wordWrap: { width: 198 }
    });
    const current = this.add.rectangle(18, 150, 92, 26, 0x123438, 0.9).setOrigin(0).setStrokeStyle(2, 0x8fe8ff);
    const currentText = this.add.text(30, 157, "AHORA", {
      fontFamily: "Courier New",
      fontSize: "12px",
      fontStyle: "bold",
      color: "#8fe8ff"
    });
    const next = this.add.rectangle(124, 150, 92, 26, 0x160f19, 0.82).setOrigin(0).setStrokeStyle(2, 0xc79bff, 0.8);
    const nextText = this.add.text(134, 157, "PRONTO", {
      fontFamily: "Courier New",
      fontSize: "12px",
      fontStyle: "bold",
      color: "#e2c7ff"
    });
    const memories = this.add.text(18, 194, `${this.progress.memories.length} recuerdos guardados`, {
      fontFamily: "Courier New",
      fontSize: "13px",
      color: "#fff2dc"
    });

    panel.add([bg, shine, title, title2, copy, current, currentText, next, nextText, memories]);
  }

  private createChapterCard(chapter: Chapter, index: number) {
    const availableInRelease = isChapterAvailableInCurrentDeploy(chapter.id);
    const unlocked = availableInRelease && this.progress.unlockedChapters.includes(chapter.id);
    const completed = this.progress.completedChapters.includes(chapter.id);
    const x = 58 + index * 224;
    const y = 366;
    const card = this.add.container(x, y).setDepth(5);
    const fill = unlocked ? 0x071018 : 0x070a10;
    const stroke = completed ? 0x70a35a : unlocked ? 0xffd28a : 0x637084;
    const accent = completed ? 0x70a35a : unlocked ? 0xe79037 : 0xc79bff;
    const bg = this.add.rectangle(0, 0, 198, 126, fill, unlocked ? 0.86 : 0.68).setOrigin(0).setStrokeStyle(3, stroke, unlocked ? 1 : 0.72);
    const cap = this.add.rectangle(0, 0, 198, 6, accent, unlocked ? 1 : 0.72).setOrigin(0);
    const number = this.add.text(146, 17, String(chapter.number).padStart(2, "0"), {
      fontFamily: "Courier New",
      fontSize: "28px",
      fontStyle: "bold",
      color: unlocked ? "#ffd28a" : "#566173"
    });
    const eyebrow = this.add.text(16, 18, `CAPÍTULO ${chapter.number}`, {
      fontFamily: "Courier New",
      fontSize: "12px",
      fontStyle: "bold",
      color: unlocked ? "#8fe8ff" : "#8a92a0"
    });
    const title = this.add.text(16, 42, unlocked ? chapter.title : "Pronto continúa", {
      fontFamily: "Courier New",
      fontSize: "15px",
      fontStyle: "bold",
      color: unlocked ? "#fff2dc" : "#c0c6d0",
      lineSpacing: 2,
      wordWrap: { width: 132 }
    });
    const route = this.add.text(16, 76, this.chapterCardDescription(unlocked, completed), {
      fontFamily: "Courier New",
      fontSize: "12px",
      color: unlocked ? "#d8d0c2" : "#969faf",
      lineSpacing: 4,
      wordWrap: { width: 164 }
    });
    const statusLabel = completed ? "COMPLETADO" : unlocked ? "JUGAR AHORA" : "PRÓXIMAMENTE";
    const statusBg = this.add.rectangle(16, 102, 118, 18, unlocked ? 0x123438 : 0x161224, 0.94).setOrigin(0);
    const statusText = this.add.text(23, 106, statusLabel, {
      fontFamily: "Courier New",
      fontSize: "10px",
      fontStyle: "bold",
      color: unlocked ? "#8fe8ff" : "#e2c7ff"
    });

    card.add([bg, cap, number, eyebrow, title, route, statusBg, statusText]);

    if (!unlocked) return;

    bg.setInteractive({ useHandCursor: true });
    bg.on("pointerover", () => {
      bg.setFillStyle(0x102233, 0.9);
      card.setY(y - 4);
    });
    bg.on("pointerout", () => {
      bg.setFillStyle(fill, 0.86);
      card.setY(y);
    });
    bg.on("pointerdown", () => this.startChapter(chapter));
  }

  private createPrimaryButton(
    x: number,
    y: number,
    width: number,
    height: number,
    label: string,
    subLabel: string,
    onClick: () => void
  ) {
    const container = this.add.container(x, y).setDepth(5);
    const shadow = this.add.rectangle(8, 8, width, height, 0x05070a, 0.72).setOrigin(0);
    const bg = this.add.rectangle(0, 0, width, height, 0xffb55c, 0.98).setOrigin(0).setStrokeStyle(3, 0xfff2dc);
    const labelText = this.add.text(22, 13, label, {
      fontFamily: "Courier New",
      fontSize: "17px",
      fontStyle: "bold",
      color: "#0b1018"
    });
    const subLabelText = this.add.text(22, 38, subLabel, {
      fontFamily: "Courier New",
      fontSize: "12px",
      color: "#35200d"
    });
    const arrow = this.add.text(width - 40, 14, ">", {
      fontFamily: "Courier New",
      fontSize: "28px",
      fontStyle: "bold",
      color: "#0b1018"
    });

    container.add([shadow, bg, labelText, subLabelText, arrow]);
    bg.setInteractive({ useHandCursor: true });
    bg.on("pointerover", () => {
      bg.setFillStyle(0xffd28a, 1);
      container.setY(y - 3);
    });
    bg.on("pointerout", () => {
      bg.setFillStyle(0xffb55c, 0.98);
      container.setY(y);
    });
    bg.on("pointerdown", onClick);
  }

  private createResetControl() {
    this.add
      .text(54, 512, "© Hass Studio 2026 · con amor, Alexis", {
        fontFamily: "Courier New",
        fontSize: "10px",
        color: "#b7b0a5"
      })
      .setAlpha(0.72)
      .setDepth(6);

    const reset = this.add
      .text(790, 510, "reiniciar progreso", {
        fontFamily: "Courier New",
        fontSize: "12px",
        color: "#d8d0c2"
      })
      .setDepth(6)
      .setInteractive({ useHandCursor: true });

    reset.on("pointerover", () => reset.setColor("#fff2dc"));
    reset.on("pointerout", () => reset.setColor("#d8d0c2"));
    reset.on("pointerdown", () => this.showResetModal());
  }

  private showResetModal() {
    if (this.resetModal) return;

    const modal = this.add.container(0, 0).setDepth(30);
    const dim = this.add.rectangle(480, 270, 960, 540, 0x000000, 0.58).setInteractive();
    const shadow = this.add.rectangle(490, 284, 420, 190, 0x04060b, 0.82);
    const panel = this.add.rectangle(480, 270, 420, 190, 0x071018, 0.96).setStrokeStyle(3, 0xffd28a);
    const cap = this.add.rectangle(480, 177, 420, 6, 0xe79037, 0.98);
    const title = this.add.text(480, 210, "Reiniciar progreso", {
      fontFamily: "Courier New",
      fontSize: "22px",
      fontStyle: "bold",
      color: "#fff2dc"
    }).setOrigin(0.5);
    const body = this.add.text(480, 252, "Se borrarán tus recuerdos guardados y el avance local de esta partida.", {
      fontFamily: "Courier New",
      fontSize: "14px",
      color: "#d8d0c2",
      align: "center",
      lineSpacing: 6,
      wordWrap: { width: 326 }
    }).setOrigin(0.5);
    const cancel = this.createModalButton(288, 310, 134, "CANCELAR", 0x172a2f, 0x8fe8ff, () => this.closeResetModal());
    const confirm = this.createModalButton(438, 310, 238, "SÍ, REINICIAR", 0xffb55c, 0xfff2dc, () => {
      resetProgress();
      this.closeResetModal();
      this.scene.restart();
    });

    dim.on("pointerdown", () => this.closeResetModal());
    modal.add([dim, shadow, panel, cap, title, body, ...cancel, ...confirm]);
    this.resetModal = modal;
  }

  private createModalButton(
    x: number,
    y: number,
    width: number,
    label: string,
    fill: number,
    stroke: number,
    onClick: () => void
  ) {
    const bg = this.add.rectangle(x, y, width, 38, fill, 0.95).setOrigin(0).setStrokeStyle(2, stroke).setInteractive({
      useHandCursor: true
    });
    const text = this.add.text(x + width / 2, y + 19, label, {
      fontFamily: "Courier New",
      fontSize: "13px",
      fontStyle: "bold",
      color: fill === 0xffb55c ? "#0b1018" : "#fff2dc"
    }).setOrigin(0.5);

    bg.on("pointerover", () => bg.setAlpha(1));
    bg.on("pointerout", () => bg.setAlpha(0.95));
    bg.on("pointerdown", onClick);

    return [bg, text];
  }

  private closeResetModal() {
    this.resetModal?.destroy();
    this.resetModal = undefined;
  }

  private startChapter(chapter: Chapter) {
    if (!isChapterAvailableInCurrentDeploy(chapter.id)) return;

    fadeOutMenuMusic(220);
    this.cameras.main.fadeOut(260, 9, 11, 16);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
      stopMenuMusic();
      this.scene.start("StoryScene", { chapterId: chapter.id });
    });
  }

  private chapterCardDescription(unlocked: boolean, completed: boolean) {
    if (!unlocked) return "Próximamente.";
    if (completed) return "Recuerdo completado.";
    return "Una tarde para descubrir paso a paso.";
  }

  private drawBackground(time: number) {
    this.background.clear();
    this.background.fillStyle(0x070a12, 0.14);
    this.background.fillRect(0, 0, 960, 540);

    this.background.fillStyle(0x03060c, 0.42);
    this.background.fillRect(48, 30, 620, 302);
    this.background.fillStyle(0xffd28a, 0.28);
    this.background.fillRect(48, 30, 620, 3);
    this.background.fillStyle(0x8fe8ff, 0.12);
    this.background.fillRect(48, 328, 620, 2);

    this.background.fillStyle(0x05070c, 0.42);
    this.background.fillRect(0, 338, 960, 202);
    this.background.fillStyle(0xffd28a, 0.22);
    this.background.fillRect(0, 336, 960, 3);
    this.background.fillStyle(0x8fe8ff, 0.12);
    this.background.fillRect(0, 344, 960, 2);
    this.background.fillStyle(0xffd28a, 0.08 + Math.sin(time * 0.8) * 0.025);
    this.background.fillRect(0, 292, 960, 24);

    for (let i = 0; i < 12; i += 1) {
      const x = (i * 91 + time * 12) % 1040 - 40;
      const y = 52 + ((i * 47) % 238);
      const alpha = 0.06 + Math.sin(time * 1.4 + i) * 0.025;
      this.background.fillStyle(i % 2 === 0 ? 0xffd28a : 0x8fe8ff, alpha);
      this.background.fillRect(x, y, 30, 2);
    }
  }
}
