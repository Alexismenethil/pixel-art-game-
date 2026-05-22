import Phaser from "phaser";
import { createTransparentTexture } from "../game/utils/createTransparentTexture";

export class BootScene extends Phaser.Scene {
  private loadingBar!: Phaser.GameObjects.Rectangle;
  private loadingText!: Phaser.GameObjects.Text;

  constructor() {
    super("BootScene");
  }

  preload() {
    this.cameras.main.setBackgroundColor("#090b10");
    this.add
      .text(480, 206, "Alexis & Kiara", {
        fontFamily: "Courier New",
        fontSize: "56px",
        fontStyle: "bold",
        color: "#fff2dc"
      })
      .setOrigin(0.5);

    this.add
      .text(480, 264, "Cargando recuerdos...", {
        fontFamily: "Courier New",
        fontSize: "20px",
        color: "#b7b0a5"
      })
      .setOrigin(0.5);

    this.add.rectangle(480, 310, 420, 18, 0x1c2027).setStrokeStyle(2, 0x697383);
    this.loadingBar = this.add.rectangle(272, 310, 0, 12, 0xe79037).setOrigin(0, 0.5);
    this.loadingText = this.add
      .text(480, 342, "0%", {
        fontFamily: "Courier New",
        fontSize: "16px",
        color: "#fff2dc"
      })
      .setOrigin(0.5);

    this.load.on("progress", (value: number) => {
      this.loadingBar.width = 412 * value;
      this.loadingText.setText(`${Math.round(value * 100)}%`);
    });

    this.load.image("characters-sheet", "/assets/characters-sheet.png");
    this.load.image("alexis-base", "/assets/alexis-base.png");
    this.load.image("kiara-base", "/assets/kiara-base.png");
  }

  create() {
    createTransparentTexture(this, "alexis-base", "alexis");
    createTransparentTexture(this, "kiara-base", "kiara");

    this.time.delayedCall(350, () => {
      const params = new URLSearchParams(window.location.search);
      const chapterId = params.get("chapter");

      if (chapterId) {
        this.scene.start("StoryScene", { chapterId });
        return;
      }

      this.scene.start("HomeScene");
    });
  }
}
