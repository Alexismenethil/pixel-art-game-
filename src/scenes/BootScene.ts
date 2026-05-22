import Phaser from "phaser";
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
    this.load.image("chapter-1-reference", "/assets/references/chapter-1-ai-background-reference.png");

    const locations = ["hospital", "bosquete", "river"] as const;
    const layers = ["sky", "back", "mid", "front", "fx"] as const;

    for (const location of locations) {
      for (const layer of layers) {
        this.load.image(`bg-${location}-${layer}`, `/assets/chapter-1/${location}/${layer}.png`);
      }
    }

    const expressions = ["neutral", "happy", "surprised", "scared", "shy", "talking", "thinking"] as const;

    for (const expression of expressions) {
      this.load.image(`alexis-${expression}`, `/assets/characters/alexis/${expression}.png`);
      this.load.image(`kiara-${expression}`, `/assets/characters/kiara/${expression}.png`);
    }
  }

  create() {
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
