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
  // Living-blink state: actors close their eyes for a heartbeat now and then so
  // a held frame reads as a person breathing, not a frozen portrait.
  private currentTextureKey: string;
  private readonly closedEyesKey: string;
  private readonly canBlink: boolean;
  private animationActive = false;
  private isBlinking = false;
  private blinkUntil = 0;
  private nextBlinkAt = 0;
  private lastSeconds = 0;
  private blinkClockSet = false;

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
    this.currentTextureKey = `${actorId}-neutral`;
    this.closedEyesKey = `${actorId}-closed-eyes`;
    this.canBlink = scene.textures.exists(this.closedEyesKey);
    // Stagger the first blink per actor so the two never blink in lockstep.
    this.nextBlinkAt = 2.4 + phase * 2.2;
    this.createAnimations();
  }

  applyBeat(state: ActorBeatState, immediate = false) {
    const wasVisible = this.container.visible;
    const willBeVisible = state.visible ?? true;

    this.mood = state.mood;
    this.container.setVisible(willBeVisible);
    // A new beat overrides any blink in flight; reschedule the next one.
    this.isBlinking = false;
    this.nextBlinkAt = this.lastSeconds + this.randomBlinkDelay();
    const animationKey = this.animationForState(state);
    if (animationKey && willBeVisible) {
      this.animationActive = true;
      this.sprite.play(animationKey, true);
    } else {
      this.animationActive = false;
      this.sprite.stop();
      this.currentTextureKey = this.textureForState(state);
      this.sprite.setTexture(this.currentTextureKey);
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
    this.lastSeconds = timeSeconds;
    this.updateBlink(timeSeconds);
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

  private randomBlinkDelay() {
    // Human blink cadence: a few seconds apart, never metronomic.
    return 2.6 + Math.random() * 4.2;
  }

  private blinkBlockedByExpression() {
    const key = this.currentTextureKey;
    // The closed-eyes assets are full-body drawings, not expression overlays.
    // Blinking over authored reactions can briefly swap the whole pose and look
    // like a visual bug, so only neutral holds get the living blink treatment.
    return key !== `${this.actorId}-neutral`;
  }

  private updateBlink(timeSeconds: number) {
    if (!this.canBlink) return;

    // Anchor the blink clock to the scene's first frame (timeSeconds is absolute
    // game time, so we can't trust a value scheduled before the scene ran).
    if (!this.blinkClockSet) {
      this.blinkClockSet = true;
      this.nextBlinkAt = timeSeconds + 2.4 + this.phase * 2.2;
    }

    if (this.isBlinking) {
      if (timeSeconds >= this.blinkUntil) {
        // Reopen the eyes back to whatever expression the beat is holding.
        this.sprite.setTexture(this.currentTextureKey);
        this.isBlinking = false;
        // ~25% of the time, follow with a quick second blink — the natural flutter.
        this.nextBlinkAt =
          timeSeconds + (Math.random() < 0.25 ? 0.16 : this.randomBlinkDelay());
      }
      return;
    }

    if (
      !this.container.visible ||
      this.animationActive ||
      this.blinkBlockedByExpression() ||
      this.sprite.texture.key !== this.currentTextureKey ||
      timeSeconds < this.nextBlinkAt
    ) {
      return;
    }

    this.isBlinking = true;
    this.blinkUntil = timeSeconds + 0.09 + Math.random() * 0.04;
    this.sprite.setTexture(this.closedEyesKey);
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
