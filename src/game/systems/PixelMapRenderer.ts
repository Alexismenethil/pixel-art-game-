import Phaser from "phaser";
import type { LocationId } from "../data/chapters";

type GeneratedLocation = "hospital" | "bosquete" | "river";
type LayerName = "sky" | "back" | "mid" | "front" | "fx";

type LayerSprite = Phaser.GameObjects.TileSprite & {
  layerSpeed: number;
  floatSpeed: number;
};

const generatedLocations: GeneratedLocation[] = ["hospital", "bosquete", "river"];
const layerNames: LayerName[] = ["sky", "back", "mid", "front", "fx"];
const layerDepths: Record<LayerName, number> = {
  sky: 0,
  back: 5,
  mid: 10,
  front: 55,
  fx: 65
};

const layerSpeeds: Record<LayerName, number> = {
  sky: 2,
  back: 5,
  mid: 12,
  front: 20,
  fx: 26
};

export class PixelMapRenderer {
  private readonly scene: Phaser.Scene;
  private readonly fallbackGraphics: Phaser.GameObjects.Graphics;
  private readonly flashGraphics: Phaser.GameObjects.Graphics;
  private readonly layerMap = new Map<GeneratedLocation, LayerSprite[]>();
  private location: LocationId = "hospital";
  private transitionAlpha = 0;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.fallbackGraphics = scene.add.graphics().setDepth(0);
    this.flashGraphics = scene.add.graphics().setDepth(90);
    this.createGeneratedLayers();
    this.setLocation("hospital", true);
  }

  setLocation(location: LocationId, immediate = false) {
    if (this.location === location && !immediate) return;

    this.location = location;
    this.transitionAlpha = immediate ? 0 : 1;
    this.fallbackGraphics.clear();

    for (const [key, layers] of this.layerMap) {
      const visible = key === location;
      layers.forEach((layer) => layer.setVisible(visible));
    }
  }

  update(timeSeconds: number) {
    this.fallbackGraphics.clear();

    if (this.isGeneratedLocation(this.location)) {
      this.updateGeneratedLayers(this.location, timeSeconds);
    } else if (this.location === "night") {
      this.drawNight(timeSeconds);
    } else if (this.location === "room") {
      this.drawRoom(timeSeconds);
    }

    this.flashGraphics.clear();
    if (this.transitionAlpha > 0) {
      this.flashGraphics.fillStyle(0xfff2dc, this.transitionAlpha * 0.18);
      this.flashGraphics.fillRect(0, 0, 960, 540);
      this.transitionAlpha = Math.max(0, this.transitionAlpha - 0.035);
    }
  }

  private createGeneratedLayers() {
    for (const location of generatedLocations) {
      const layers: LayerSprite[] = [];

      for (const layerName of layerNames) {
        const layer = this.scene.add
          .tileSprite(480, 270, 960, 540, `bg-${location}-${layerName}`)
          .setDepth(layerDepths[layerName])
          .setVisible(false) as LayerSprite;

        layer.layerSpeed = layerSpeeds[layerName];
        layer.floatSpeed = layerName === "fx" ? 12 : layerName === "back" ? 3 : 0;
        layers.push(layer);
      }

      this.layerMap.set(location, layers);
    }
  }

  private updateGeneratedLayers(location: GeneratedLocation, time: number) {
    const layers = this.layerMap.get(location);
    if (!layers) return;

    for (const layer of layers) {
      layer.tilePositionX = time * layer.layerSpeed;
      layer.tilePositionY = Math.sin(time * 0.8 + layer.depth) * layer.floatSpeed;
    }
  }

  private isGeneratedLocation(location: LocationId): location is GeneratedLocation {
    return location === "hospital" || location === "bosquete" || location === "river";
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
    this.fallbackGraphics.fillStyle(color, alpha);
    this.fallbackGraphics.fillRect(Math.round(x), Math.round(y), Math.round(width), Math.round(height));
  }
}
