import Phaser from "phaser";
import type { ActorBeatState, ActorId, Mood } from "../data/chapters";

export class CharacterActor {
  private readonly scene: Phaser.Scene;
  private readonly container: Phaser.GameObjects.Container;
  private readonly sprite: Phaser.GameObjects.Sprite;
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
    this.sprite = scene.add.sprite(0, 0, `${actorId}-neutral`).setOrigin(0.5, 1);
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
    this.createAnimations();
  }

  applyBeat(state: ActorBeatState, immediate = false) {
    const wasVisible = this.container.visible;
    const willBeVisible = state.visible ?? true;

    this.mood = state.mood;
    this.container.setVisible(willBeVisible);
    const animationKey = this.animationForState(state);
    if (animationKey && willBeVisible) {
      this.sprite.play(animationKey, true);
    } else {
      this.sprite.stop();
      this.sprite.setTexture(this.textureForState(state));
    }
    this.sprite.setFlipX(state.facing === "left");
    this.sprite.setScale(state.scale ?? 0.46);
    this.reaction = state.reaction ?? "";
    this.reactionText.setText(this.reaction);
    this.reactionText.setVisible(Boolean(this.reaction) && willBeVisible);

    const target = {
      x: state.x,
      y: state.y,
      scaleX: state.scale ? state.scale / 0.46 : 1,
      scaleY: state.scale ? state.scale / 0.46 : 1
    };

    if (immediate || !willBeVisible) {
      this.container.setPosition(target.x, target.y);
      this.container.setScale(target.scaleX, target.scaleY);
      this.container.setAlpha(1);
      return;
    }

    // Fresh appearance: rise and settle with a soft pop, fading in from nothing.
    if (!wasVisible && willBeVisible) {
      this.container.setPosition(target.x, target.y + 16);
      this.container.setScale(target.scaleX * 0.9, target.scaleY * 0.9);
      this.container.setAlpha(0);
      this.scene.tweens.add({
        targets: this.container,
        y: target.y,
        scaleX: target.scaleX,
        scaleY: target.scaleY,
        alpha: 1,
        duration: 560,
        ease: "Back.easeOut"
      });
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
    const speed =
      this.mood === "walk" ? 4.2 : this.mood === "nervous" ? 8 : this.mood === "laughing" ? 7 : this.mood === "happy" ? 6 : 4;
    const bobSize = this.mood === "walk" ? 2 : this.mood === "laughing" ? 5 : this.mood === "happy" ? 4 : 2;
    const bob = Math.sin(timeSeconds * speed + this.phase) * bobSize;
    // Happy/laughing get an extra little upward bounce on top of the bob.
    const bounce =
      this.mood === "happy" || this.mood === "laughing"
        ? Math.abs(Math.sin(timeSeconds * speed * 0.5 + this.phase)) * 3
        : 0;
    const breathe = 1 + Math.sin(timeSeconds * 3 + this.phase) * 0.012;
    const shake = this.mood === "nervous" ? Math.sin(timeSeconds * 16) * 2 : 0;
    const lean =
      this.mood === "shy" || this.mood === "soft"
        ? Math.sin(timeSeconds * 1.4 + this.phase) * 0.02
        : this.mood === "laughing"
          ? Math.sin(timeSeconds * 9 + this.phase) * 0.04
          : this.mood === "surprised"
            ? Math.sin(timeSeconds * 8 + this.phase) * 0.025
            : this.mood === "thinking"
              ? -0.025
              : 0;

    const offsetY = bob - bounce;
    this.sprite.setY(offsetY);
    this.sprite.setX(shake);
    this.sprite.setScale(0.46 * breathe);
    this.sprite.setRotation(lean);

    // Shadow tightens and lightens as the character lifts off the ground.
    const lift = Math.max(0, -offsetY);
    this.shadow.setScale(Math.max(0.62, 1 - lift * 0.014), Math.max(0.5, 1 - lift * 0.02));
    this.shadow.setAlpha(Math.max(0.24, 0.38 - lift * 0.006));

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

  private createAnimations() {
    const sheetKey = `${this.actorId}-walk-side-sheet`;
    const animationKey = `${this.actorId}-walk-side`;

    if (!this.scene.textures.exists(sheetKey) || this.scene.anims.exists(animationKey)) return;

    this.scene.anims.create({
      key: animationKey,
      frames: this.scene.anims.generateFrameNumbers(sheetKey, { start: 0, end: 7 }),
      frameRate: 3.2,
      repeat: -1
    });
  }

  private animationForState(state: ActorBeatState) {
    const animationKey = `${this.actorId}-walk-side`;
    if (
      (state.mood === "walk" || state.pose === "walking-side") &&
      this.scene.textures.exists(`${this.actorId}-walk-side-sheet`) &&
      this.scene.anims.exists(animationKey)
    ) {
      return animationKey;
    }

    return undefined;
  }
}
