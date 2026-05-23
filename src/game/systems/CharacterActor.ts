import Phaser from "phaser";
import type { ActorBeatState, ActorId, Mood } from "../data/chapters";

export class CharacterActor {
  private readonly scene: Phaser.Scene;
  private readonly container: Phaser.GameObjects.Container;
  private readonly sprite: Phaser.GameObjects.Image;
  private readonly shadow: Phaser.GameObjects.Ellipse;
  private readonly reactionText: Phaser.GameObjects.Text;
  private readonly actorId: ActorId;
  private mood: Mood = "idle";
  private phase: number;
  private reaction = "";

  constructor(
    scene: Phaser.Scene,
    actorId: ActorId,
    x: number,
    y: number,
    phase: number
  ) {
    this.scene = scene;
    this.actorId = actorId;
    this.phase = phase;
    this.shadow = scene.add.ellipse(0, -4, 112, 18, 0x000000, 0.38);
    this.sprite = scene.add.image(0, 0, `${actorId}-neutral`).setOrigin(0.5, 1);
    this.sprite.setScale(0.46);
    this.reactionText = scene.add
      .text(0, -206, "", {
        fontFamily: "Courier New",
        fontSize: "21px",
        fontStyle: "bold",
        color: "#fff2dc",
        stroke: "#10131a",
        strokeThickness: 4
      })
      .setOrigin(0.5)
      .setVisible(false);

    this.container = scene.add.container(x, y, [this.shadow, this.sprite, this.reactionText]);
    this.container.setDepth(30);
  }

  applyBeat(state: ActorBeatState, immediate = false) {
    this.mood = state.mood;
    this.container.setVisible(state.visible ?? true);
    this.sprite.setTexture(this.textureForState(state));
    this.sprite.setFlipX(state.facing === "left");
    this.sprite.setScale(state.scale ?? 0.46);
    this.reaction = state.reaction ?? "";
    this.reactionText.setText(this.reaction);
    this.reactionText.setVisible(Boolean(this.reaction) && (state.visible ?? true));

    const target = {
      x: state.x,
      y: state.y,
      scaleX: state.scale ? state.scale / 0.46 : 1,
      scaleY: state.scale ? state.scale / 0.46 : 1
    };

    if (immediate) {
      this.container.setPosition(target.x, target.y);
      this.container.setScale(target.scaleX, target.scaleY);
      return;
    }

    this.scene.tweens.add({
      targets: this.container,
      x: target.x,
      y: target.y,
      scaleX: target.scaleX,
      scaleY: target.scaleY,
      duration: 520,
      ease: "Sine.easeInOut"
    });
  }

  update(timeSeconds: number) {
    const speed = this.mood === "walk" ? 10 : this.mood === "nervous" ? 8 : 4;
    const bobSize = this.mood === "walk" ? 5 : this.mood === "happy" ? 4 : 2;
    const bob = Math.sin(timeSeconds * speed + this.phase) * bobSize;
    const breathe = 1 + Math.sin(timeSeconds * 3 + this.phase) * 0.012;
    const shake = this.mood === "nervous" ? Math.sin(timeSeconds * 16) * 2 : 0;
    const rotate =
      this.mood === "surprised"
        ? Math.sin(timeSeconds * 8 + this.phase) * 0.025
        : this.mood === "thinking"
          ? -0.025
          : 0;

    this.sprite.setY(bob);
    this.sprite.setX(shake);
    this.sprite.setScale(0.46 * breathe);
    this.sprite.setRotation(rotate);

    if (this.reaction) {
      const float = Math.sin(timeSeconds * 3.1 + this.phase) * 4;
      const sparkle = 0.5 + Math.sin(timeSeconds * 4 + this.phase) * 0.1;
      this.reactionText.setY(-212 + float);
      this.reactionText.setAlpha(sparkle);
      this.reactionText.setScale(1 + Math.sin(timeSeconds * 4.8 + this.phase) * 0.035);
      this.reactionText.setRotation(Math.sin(timeSeconds * 2.2 + this.phase) * 0.025);
    }
  }

  getRenderObject() {
    return this.container;
  }

  private textureForState(state: ActorBeatState) {
    if (state.pose) return this.firstExistingTexture([`${this.actorId}-pose-${state.pose}`, `${this.actorId}-neutral`]);
    if (state.expression) return this.firstExistingTexture([`${this.actorId}-${state.expression}`, `${this.actorId}-neutral`]);

    const expressionByMood: Record<Mood, string> = {
      idle: "neutral",
      walk: "neutral",
      soft: "shy",
      happy: "happy",
      laughing: "laughing",
      nervous: "scared",
      surprised: "surprised",
      shy: "shy",
      thinking: "thinking",
      talking: "talking",
      finale: "happy"
    };

    return this.firstExistingTexture([`${this.actorId}-${expressionByMood[state.mood]}`, `${this.actorId}-neutral`]);
  }

  private firstExistingTexture(keys: string[]) {
    return keys.find((key) => this.scene.textures.exists(key)) ?? keys[keys.length - 1];
  }

}
