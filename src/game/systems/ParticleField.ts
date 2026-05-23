import Phaser from "phaser";
import type { LocationId } from "../data/chapters";

type ParticleFieldKind =
  | "dust-warm"
  | "dust-cool"
  | "leaves"
  | "pollen"
  | "river-sparkle"
  | "fireflies"
  | "headlights"
  | "wind-streak"
  | "none";

type ParticleSpec = {
  kind: ParticleFieldKind;
  count: number;
  color: number;
  glowColor?: number;
  size: number;
  spawnRect: Phaser.Geom.Rectangle;
  driftX: { min: number; max: number };
  driftY: { min: number; max: number };
  alpha: { min: number; max: number };
  twinkleSpeed?: number;
  depth: number;
};

const fieldByLocation: Record<LocationId, ParticleFieldKind[]> = {
  taxi: ["headlights", "dust-cool"],
  hospital: ["dust-warm"],
  road: ["pollen", "wind-streak"],
  bosquete: ["leaves", "pollen"],
  valley: ["pollen", "wind-streak"],
  ravine: ["dust-warm", "wind-streak"],
  river: ["river-sparkle", "pollen"],
  night: ["fireflies"],
  room: ["dust-warm"]
};

const baseSpecs: Record<ParticleFieldKind, Omit<ParticleSpec, "kind">> = {
  "dust-warm": {
    count: 24,
    color: 0xfff2dc,
    size: 2,
    spawnRect: new Phaser.Geom.Rectangle(0, 60, 960, 360),
    driftX: { min: -6, max: 10 },
    driftY: { min: -3, max: 6 },
    alpha: { min: 0.15, max: 0.4 },
    twinkleSpeed: 1.3,
    depth: 22
  },
  "dust-cool": {
    count: 18,
    color: 0xb6c9e0,
    size: 2,
    spawnRect: new Phaser.Geom.Rectangle(120, 90, 720, 280),
    driftX: { min: -10, max: 14 },
    driftY: { min: -2, max: 4 },
    alpha: { min: 0.12, max: 0.32 },
    twinkleSpeed: 1.6,
    depth: 22
  },
  leaves: {
    count: 14,
    color: 0xa6c46f,
    glowColor: 0xd4e89a,
    size: 4,
    spawnRect: new Phaser.Geom.Rectangle(-40, 30, 1040, 400),
    driftX: { min: 18, max: 42 },
    driftY: { min: 14, max: 34 },
    alpha: { min: 0.55, max: 0.92 },
    twinkleSpeed: 0.6,
    depth: 23
  },
  pollen: {
    count: 28,
    color: 0xfff7cf,
    size: 2,
    spawnRect: new Phaser.Geom.Rectangle(-40, 80, 1040, 360),
    driftX: { min: 4, max: 22 },
    driftY: { min: -4, max: 8 },
    alpha: { min: 0.25, max: 0.65 },
    twinkleSpeed: 1.5,
    depth: 23
  },
  "river-sparkle": {
    count: 32,
    color: 0xeaf6ff,
    glowColor: 0x9fdcff,
    size: 3,
    spawnRect: new Phaser.Geom.Rectangle(40, 320, 880, 120),
    driftX: { min: 28, max: 60 },
    driftY: { min: -2, max: 2 },
    alpha: { min: 0.3, max: 0.95 },
    twinkleSpeed: 3.2,
    depth: 26
  },
  fireflies: {
    count: 18,
    color: 0xfff1a5,
    glowColor: 0xffd76d,
    size: 3,
    spawnRect: new Phaser.Geom.Rectangle(40, 120, 880, 320),
    driftX: { min: -12, max: 14 },
    driftY: { min: -10, max: 10 },
    alpha: { min: 0.2, max: 0.95 },
    twinkleSpeed: 1.8,
    depth: 26
  },
  headlights: {
    count: 6,
    color: 0xffe9b0,
    glowColor: 0xfff2dc,
    size: 6,
    spawnRect: new Phaser.Geom.Rectangle(960, 220, 100, 80),
    driftX: { min: -240, max: -160 },
    driftY: { min: -2, max: 2 },
    alpha: { min: 0.5, max: 0.95 },
    twinkleSpeed: 0.8,
    depth: 24
  },
  "wind-streak": {
    count: 6,
    color: 0xeaf2ff,
    size: 2,
    spawnRect: new Phaser.Geom.Rectangle(-80, 130, 1120, 240),
    driftX: { min: 90, max: 160 },
    driftY: { min: -2, max: 2 },
    alpha: { min: 0.08, max: 0.22 },
    twinkleSpeed: 0.4,
    depth: 23
  },
  none: {
    count: 0,
    color: 0xffffff,
    size: 1,
    spawnRect: new Phaser.Geom.Rectangle(0, 0, 0, 0),
    driftX: { min: 0, max: 0 },
    driftY: { min: 0, max: 0 },
    alpha: { min: 0, max: 0 },
    depth: 0
  }
};

type LiveParticle = {
  obj: Phaser.GameObjects.GameObject;
  baseAlpha: number;
  twinkleSpeed: number;
  velocityX: number;
  velocityY: number;
  wobblePhase: number;
  bounds: Phaser.Geom.Rectangle;
  kind: ParticleFieldKind;
};

export class ParticleField {
  private readonly scene: Phaser.Scene;
  private readonly container: Phaser.GameObjects.Container;
  private particles: LiveParticle[] = [];
  private currentLocation?: LocationId;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.container = scene.add.container(0, 0).setDepth(24);
  }

  getRenderObject() {
    return this.container;
  }

  setLocation(location: LocationId, immediate = false) {
    if (this.currentLocation === location && !immediate) return;
    this.currentLocation = location;
    this.fadeOutCurrent(immediate);
    const fields = fieldByLocation[location] ?? [];
    fields.forEach((kind) => this.spawnField(kind, immediate));
  }

  update(seconds: number) {
    for (const particle of this.particles) {
      const obj = particle.obj as Phaser.GameObjects.Image & Phaser.GameObjects.Rectangle;
      // Need position access - use container's children differently
      const pos = obj as unknown as { x: number; y: number; alpha: number; setPosition: (x: number, y: number) => void; setAlpha: (a: number) => void };
      const nextX = pos.x + particle.velocityX * (1 / 60);
      const nextY = pos.y + particle.velocityY * (1 / 60) + Math.sin(seconds * 1.4 + particle.wobblePhase) * 0.6;
      pos.setPosition(nextX, nextY);
      const wobble = Math.sin(seconds * (particle.twinkleSpeed ?? 1) + particle.wobblePhase);
      const alpha = Phaser.Math.Clamp(particle.baseAlpha * (0.55 + 0.45 * wobble), 0, 1);
      pos.setAlpha(alpha);

      if (
        nextX < particle.bounds.left - 60 ||
        nextX > particle.bounds.right + 60 ||
        nextY < particle.bounds.top - 60 ||
        nextY > particle.bounds.bottom + 60
      ) {
        const spawn = baseSpecs[particle.kind].spawnRect;
        const respawnX =
          particle.velocityX > 0
            ? particle.bounds.left - 30
            : particle.velocityX < 0
              ? particle.bounds.right + 30
              : spawn.left + Math.random() * spawn.width;
        const respawnY = spawn.top + Math.random() * spawn.height;
        pos.setPosition(respawnX, respawnY);
      }
    }
  }

  destroy() {
    this.particles.forEach((particle) => particle.obj.destroy());
    this.particles = [];
    this.container.destroy();
  }

  private fadeOutCurrent(immediate: boolean) {
    const old = this.particles;
    this.particles = [];
    old.forEach((particle) => {
      if (immediate) {
        particle.obj.destroy();
        return;
      }
      this.scene.tweens.add({
        targets: particle.obj,
        alpha: 0,
        duration: 420,
        ease: "Sine.easeOut",
        onComplete: () => particle.obj.destroy()
      });
    });
  }

  private spawnField(kind: ParticleFieldKind, immediate: boolean) {
    if (kind === "none") return;
    const spec = baseSpecs[kind];
    const bounds = new Phaser.Geom.Rectangle(
      spec.spawnRect.left - 60,
      spec.spawnRect.top - 60,
      spec.spawnRect.width + 120,
      spec.spawnRect.height + 120
    );
    for (let i = 0; i < spec.count; i += 1) {
      const x = spec.spawnRect.left + Math.random() * spec.spawnRect.width;
      const y = spec.spawnRect.top + Math.random() * spec.spawnRect.height;
      const size = spec.size + Math.random() * spec.size * 0.6;
      let obj: Phaser.GameObjects.GameObject;
      if (kind === "leaves") {
        obj = this.scene.add
          .rectangle(x, y, size + 2, size, spec.color, spec.alpha.max)
          .setStrokeStyle(1, spec.glowColor ?? spec.color, 0.4)
          .setAngle(Math.random() * 360)
          .setDepth(spec.depth);
      } else if (kind === "headlights") {
        obj = this.scene.add
          .ellipse(x, y, size * 4, size * 2.2, spec.color, spec.alpha.max)
          .setDepth(spec.depth);
      } else if (kind === "wind-streak") {
        obj = this.scene.add
          .rectangle(x, y, size * 18, size, spec.color, spec.alpha.max)
          .setDepth(spec.depth);
      } else if (kind === "river-sparkle" || kind === "fireflies") {
        const star = this.scene.add
          .star(x, y, 4, size * 0.5, size * 1.4, spec.color, spec.alpha.max)
          .setDepth(spec.depth);
        if (spec.glowColor) star.setStrokeStyle(1, spec.glowColor, 0.7);
        obj = star;
      } else {
        obj = this.scene.add
          .rectangle(x, y, size, size, spec.color, spec.alpha.max)
          .setDepth(spec.depth);
      }
      const baseAlpha = Phaser.Math.FloatBetween(spec.alpha.min, spec.alpha.max);
      const velocityX = Phaser.Math.FloatBetween(spec.driftX.min, spec.driftX.max);
      const velocityY = Phaser.Math.FloatBetween(spec.driftY.min, spec.driftY.max);
      const live: LiveParticle = {
        obj,
        baseAlpha,
        twinkleSpeed: spec.twinkleSpeed ?? 1,
        velocityX,
        velocityY,
        wobblePhase: Math.random() * Math.PI * 2,
        bounds,
        kind
      };
      this.particles.push(live);
      this.container.add(obj as Phaser.GameObjects.GameObject);
      if (!immediate) {
        const start = (obj as unknown as { setAlpha: (a: number) => void });
        start.setAlpha(0);
        this.scene.tweens.add({
          targets: obj,
          alpha: baseAlpha,
          duration: 600,
          ease: "Sine.easeOut"
        });
      }
    }
  }
}
