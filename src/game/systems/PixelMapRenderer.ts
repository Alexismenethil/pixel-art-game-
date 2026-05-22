import Phaser from "phaser";
import type { LocationId } from "../data/chapters";

export class PixelMapRenderer {
  private readonly graphics: Phaser.GameObjects.Graphics;
  private location: LocationId = "hospital";
  private transitionAlpha = 0;

  constructor(scene: Phaser.Scene) {
    this.graphics = scene.add.graphics();
    this.graphics.setDepth(0);
  }

  setLocation(location: LocationId) {
    if (this.location === location) return;

    this.location = location;
    this.transitionAlpha = 1;
  }

  update(timeSeconds: number) {
    this.graphics.clear();

    if (this.location === "hospital") this.drawHospital(timeSeconds);
    if (this.location === "bosquete") this.drawBosquete(timeSeconds);
    if (this.location === "river") this.drawRiver(timeSeconds);
    if (this.location === "night") this.drawNight(timeSeconds);
    if (this.location === "room") this.drawRoom(timeSeconds);

    if (this.transitionAlpha > 0) {
      this.fillRect(0, 0, 960, 540, 0xfff2dc, this.transitionAlpha * 0.18);
      this.transitionAlpha = Math.max(0, this.transitionAlpha - 0.035);
    }
  }

  private drawHospital(time: number) {
    this.fillRect(0, 0, 960, 540, 0x151923);
    this.fillRect(0, 0, 960, 240, 0x263145);
    this.fillRect(0, 240, 960, 210, 0xb9c2c9);
    this.fillRect(0, 450, 960, 90, 0x404955);

    for (let x = 80; x < 900; x += 170) {
      this.fillRect(x, 82, 94, 98, 0xe9f4f3);
      this.fillRect(x + 12, 96, 70, 18, 0x6aa7b0);
      this.fillRect(x + 12, 126, 70, 18, 0x6aa7b0);
      this.fillRect(x + 12, 156, 70, 18, 0x6aa7b0);
    }

    this.fillRect(410, 66, 132, 88, 0xf6f0dd);
    this.fillRect(462, 82, 28, 56, 0xd7565b);
    this.fillRect(448, 96, 56, 28, 0xd7565b);

    for (let x = 0; x < 960; x += 80) {
      const shimmer = Math.sin(time * 2 + x) * 0.08 + 0.22;
      this.fillRect(x + 8, 478, 44, 8, 0xffffff, shimmer);
    }
  }

  private drawBosquete(time: number) {
    this.fillRect(0, 0, 960, 540, 0x101820);
    this.fillRect(0, 0, 960, 220, 0x20324a);
    this.fillRect(0, 220, 960, 230, 0x385143);
    this.fillRect(0, 450, 960, 90, 0x24341e);

    for (let x = -30; x < 1000; x += 86) {
      const sway = Math.sin(time * 1.8 + x) * 4;
      this.fillRect(x + 30, 242, 26, 134, 0x1d2418);
      this.fillRect(x + sway, 188, 86, 56, 0x4e743e);
      this.fillRect(x + 16 - sway, 152, 70, 58, 0x638c48);
    }

    for (let i = 0; i < 13; i += 1) {
      const x = (i * 93 + time * 16) % 1020;
      const y = 92 + Math.sin(time + i) * 12;
      this.fillRect(x - 30, y, 42, 5, 0xdce7dd, 0.2);
    }

    this.fillRect(620, 414, 118, 18, 0x6a6157);
    this.fillRect(642, 396, 72, 24, 0x8f8173);
  }

  private drawRiver(time: number) {
    this.fillRect(0, 0, 960, 540, 0x18272e);
    this.fillRect(0, 0, 960, 206, 0x263247);
    this.fillRect(0, 206, 960, 76, 0x425c55);
    this.fillRect(0, 282, 960, 168, 0x24606d);
    this.fillRect(0, 450, 960, 90, 0x27351f);

    for (let x = -60; x < 1020; x += 54) {
      const drift = Math.sin(time * 1.8 + x * 0.05) * 10;
      this.fillRect(x + drift, 314 + ((x / 54) % 2) * 12, 36, 8, 0x74c8bb);
      this.fillRect(x + 20 - drift, 374, 46, 6, 0x397d87);
    }

    for (let x = 20; x < 960; x += 110) {
      const sway = Math.sin(time * 1.2 + x) * 3;
      this.fillRect(x, 238, 24, 46, 0x1c2618);
      this.fillRect(x - 20 + sway, 204, 70, 42, 0x476b3d);
      this.fillRect(x + 12 - sway, 184, 52, 48, 0x5a7f46);
    }

    this.fillRect(120, 396, 52, 22, 0x50606a);
    this.fillRect(160, 412, 28, 12, 0x82919a);
    this.fillRect(780, 416, 64, 18, 0x5d5d61);
    this.fillRect(820, 430, 36, 10, 0x8b8a83);
  }

  private drawNight(time: number) {
    this.fillRect(0, 0, 960, 540, 0x101624);
    this.fillRect(0, 296, 960, 82, 0x152d45);
    this.fillRect(0, 378, 960, 162, 0x161a1d);

    for (let x = 30; x < 930; x += 90) {
      this.fillRect(x, 364, 62, 18, 0x4a3b35);
      this.fillRect(x + 26, 316, 10, 70, 0x2d2527);
    }

    this.fillRect(122, 112, 46, 46, 0xf5e9ba);
    this.fillRect(132, 122, 26, 26, 0xfff4c9);

    for (let i = 0; i < 24; i += 1) {
      const pulse = 0.4 + Math.sin(time * 3 + i) * 0.25;
      this.fillRect(120 + i * 32, 52 + ((i * 17) % 90), 5, 5, 0xfff1a5, pulse);
    }
  }

  private drawRoom(time: number) {
    this.fillRect(0, 0, 960, 314, 0x2a2830);
    this.fillRect(0, 314, 960, 226, 0x1e2629);

    for (let x = 0; x < 960; x += 72) {
      this.fillRect(x, 314, 4, 226, 0x334044);
    }

    this.fillRect(90, 78, 220, 138, 0x15181d);
    this.fillRect(108, 96, 76, 48, 0x294f66);
    this.fillRect(196, 96, 76, 48, 0x70394f);
    this.fillRect(122, 160, 132, 24, 0xe49a47);

    const lamp = 0.25 + Math.sin(time * 2) * 0.08;
    this.fillRect(640, 80, 250, 220, 0xffd27d, lamp);
    this.fillRect(654, 86, 210, 210, 0x15181d);
    this.fillRect(678, 110, 52, 62, 0x24606d);
    this.fillRect(746, 110, 52, 62, 0x7c536d);
    this.fillRect(714, 198, 88, 48, 0xe8d7b3);
  }

  private fillRect(
    x: number,
    y: number,
    width: number,
    height: number,
    color: number,
    alpha = 1
  ) {
    this.graphics.fillStyle(color, alpha);
    this.graphics.fillRect(Math.round(x), Math.round(y), Math.round(width), Math.round(height));
  }
}
