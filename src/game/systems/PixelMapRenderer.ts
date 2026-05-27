import Phaser from "phaser";
import type { LocationId } from "../data/chapters";

type GeneratedLocation = LocationId;
type LayerName = "sky" | "back" | "mid" | "front" | "fx";

type LayerSprite = Phaser.GameObjects.TileSprite & {
  layerName: LayerName;
  layerSpeed: number;
  floatSpeed: number;
};

type BeautySprite = Phaser.GameObjects.Image & {
  frameIndex: number;
  baseAlpha: number;
};

const generatedLocations: GeneratedLocation[] = [
  "taxi",
  "hospital",
  "road",
  "bosquete",
  "valley",
  "ravine",
  "river",
  "night",
  "room"
];
const layerNames: LayerName[] = ["sky", "back", "mid", "front", "fx"];
const layerDepths: Record<LayerName, number> = {
  sky: 0,
  back: 5,
  mid: 10,
  front: 18,
  fx: 24
};

const layerAlphas: Record<LayerName, number> = {
  sky: 1,
  back: 0.96,
  mid: 0.96,
  front: 0.88,
  fx: 0.58
};

const layerSpeeds: Record<LayerName, number> = {
  sky: 0.9,
  back: 1.4,
  mid: 2.1,
  front: 0.8,
  fx: 18
};

const locationLayerSpeeds: Record<GeneratedLocation, Partial<Record<LayerName, number>>> = {
  taxi: { sky: 0.5, back: 0.9, mid: 1.1, front: 0.4, fx: 10 },
  hospital: { sky: 0.5, back: 0.8, mid: 1.1, front: 0.5, fx: 10 },
  road: { sky: 1.2, back: 1.8, mid: 2.8, front: 1.2, fx: 16 },
  bosquete: { sky: 1.1, back: 2.4, mid: 3.2, front: 1, fx: 14 },
  valley: { sky: 1.4, back: 1.8, mid: 2.4, front: 0.9, fx: 9 },
  ravine: { sky: 0.8, back: 1.5, mid: 2.5, front: 1.1, fx: 12 },
  river: { sky: 1, back: 1.5, mid: 2.8, front: 1.2, fx: 28 },
  night: { sky: 0.7, back: 1, mid: 1.6, front: 0.7, fx: 7 },
  room: { sky: 0.35, back: 0.5, mid: 0.7, front: 0.3, fx: 4 }
};

const locationLayerFloats: Record<GeneratedLocation, Partial<Record<LayerName, number>>> = {
  taxi: { fx: 3 },
  hospital: { fx: 3 },
  road: { back: 2, fx: 4 },
  bosquete: { back: 3, fx: 9 },
  valley: { fx: 5 },
  ravine: { fx: 7 },
  river: { mid: 1.8, fx: 6 },
  night: { back: 1.4, fx: 3 },
  room: { fx: 1.6 }
};

const locationBeautyAlpha: Record<GeneratedLocation, number> = {
  taxi: 0.22,
  hospital: 0.24,
  road: 0.26,
  bosquete: 0.25,
  valley: 0.25,
  ravine: 0.24,
  river: 0.28,
  night: 0.32,
  room: 0.3
};

const locationBeautySpeed: Record<GeneratedLocation, number> = {
  taxi: 0.11,
  hospital: 0.085,
  road: 0.08,
  bosquete: 0.095,
  valley: 0.07,
  ravine: 0.08,
  river: 0.13,
  night: 0.09,
  room: 0.075
};

export class PixelMapRenderer {
  private readonly scene: Phaser.Scene;
  private readonly fallbackGraphics: Phaser.GameObjects.Graphics;
  private readonly flashGraphics: Phaser.GameObjects.Graphics;
  private readonly layerMap = new Map<GeneratedLocation, LayerSprite[]>();
  private readonly beautyFrameMap = new Map<GeneratedLocation, BeautySprite[]>();
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

    for (const [key, frames] of this.beautyFrameMap) {
      const visible = key === location;
      frames.forEach((frame) => frame.setVisible(visible));
    }
  }

  update(timeSeconds: number) {
    this.fallbackGraphics.clear();

    if (this.isGeneratedLocation(this.location)) this.updateGeneratedLayers(this.location, timeSeconds);

    this.flashGraphics.clear();
    if (this.transitionAlpha > 0) {
      this.flashGraphics.fillStyle(0xfff2dc, this.transitionAlpha * 0.18);
      this.flashGraphics.fillRect(0, 0, 960, 540);
      this.transitionAlpha = Math.max(0, this.transitionAlpha - 0.035);
    }
  }

  getRenderObjects() {
    return [
      this.fallbackGraphics,
      this.flashGraphics,
      ...Array.from(this.beautyFrameMap.values()).flat(),
      ...Array.from(this.layerMap.values()).flat()
    ];
  }

  private createGeneratedLayers() {
    for (const location of generatedLocations) {
      const layers: LayerSprite[] = [];
      const beautyFrames: BeautySprite[] = [];

      for (let index = 0; index < 3; index += 1) {
        const textureKey = `bg-${location}-beauty-${index + 1}`;
        if (!this.scene.textures.exists(textureKey)) continue;

        const frame = this.scene.add
          .image(480, 270, textureKey)
          .setDepth(17)
          .setAlpha(0)
          .setVisible(false)
          .setBlendMode(Phaser.BlendModes.SCREEN) as BeautySprite;
        frame.setDisplaySize(978, 552);
        frame.frameIndex = index;
        frame.baseAlpha = locationBeautyAlpha[location];
        beautyFrames.push(frame);
      }

      for (const layerName of layerNames) {
        const textureKey = `bg-${location}-${layerName}`;
        if (!this.scene.textures.exists(textureKey)) continue;

        const layer = this.scene.add
          .tileSprite(480, 270, 960, 540, textureKey)
          .setDepth(layerDepths[layerName])
          .setVisible(false) as LayerSprite;

        layer.layerName = layerName;
        layer.layerSpeed = locationLayerSpeeds[location][layerName] ?? layerSpeeds[layerName];
        layer.floatSpeed = locationLayerFloats[location][layerName] ?? 0;
        layers.push(layer);
      }

      this.beautyFrameMap.set(location, beautyFrames);
      this.layerMap.set(location, layers);
    }
  }

  private updateGeneratedLayers(location: GeneratedLocation, time: number) {
    const layers = this.layerMap.get(location);
    if (!layers) return;

    for (const layer of layers) {
      const isFx = layer.layerName === "fx";
      layer.tilePositionX = isFx
        ? time * layer.layerSpeed
        : Math.sin(time * 0.22 + layer.depth * 0.11) * layer.layerSpeed;
      layer.tilePositionY =
        Math.sin(time * (isFx ? 0.8 : 0.26) + layer.depth * 0.13) * layer.floatSpeed;
      const alpha =
        isFx
          ? layerAlphas.fx + Math.sin(time * 1.8 + layer.depth) * 0.12
          : layerAlphas[layer.layerName] + Math.sin(time * 0.38 + layer.depth) * 0.018;
      layer.setAlpha(Phaser.Math.Clamp(alpha, 0, 1));
    }

    this.updateBeautyFrames(location, time);
  }

  private updateBeautyFrames(location: GeneratedLocation, time: number) {
    const frames = this.beautyFrameMap.get(location);
    if (!frames?.length) return;

    const cycle = (time * locationBeautySpeed[location]) % frames.length;
    const driftX = location === "taxi" || location === "room" ? 1.2 : 2.6;
    const driftY = location === "river" || location === "bosquete" ? 1.8 : 1.1;

    for (const frame of frames) {
      const rawDistance = Math.abs(cycle - frame.frameIndex);
      const distance = Math.min(rawDistance, frames.length - rawDistance);
      const weight = Phaser.Math.Clamp(1 - distance, 0, 1);
      const breathe = 0.94 + Math.sin(time * 0.42 + frame.frameIndex * 1.7) * 0.06;
      frame.setAlpha(frame.baseAlpha * weight * breathe);
      frame.setPosition(
        480 + Math.sin(time * 0.19 + frame.frameIndex * 1.9) * driftX,
        270 + Math.cos(time * 0.16 + frame.frameIndex * 1.4) * driftY
      );
      frame.setScale(1.018 + Math.sin(time * 0.12 + frame.frameIndex) * 0.004);
    }
  }

  private isGeneratedLocation(location: LocationId): location is GeneratedLocation {
    return generatedLocations.includes(location as GeneratedLocation);
  }

  private drawTaxi(time: number) {
    this.fillRect(0, 0, 960, 540, 0x101826);
    this.fillRect(0, 42, 960, 228, 0x1d2b3c);
    this.fillRect(0, 270, 960, 86, 0x334051);
    this.fillRect(0, 356, 960, 184, 0x16181f);

    for (let x = -80; x < 1040; x += 210) {
      const drift = (time * 42 + x) % 1120;
      this.fillRect(drift - 80, 78, 86, 116, 0x293848);
      this.fillRect(drift - 62, 104, 50, 24, 0x527184, 0.85);
      this.fillRect(drift - 62, 142, 50, 24, 0x527184, 0.65);
    }

    for (let x = -120; x < 1080; x += 160) {
      const drift = (time * 86 + x) % 1200;
      this.fillRect(drift - 120, 318, 76, 6, 0xd9c88e, 0.72);
    }

    this.fillRect(70, 64, 820, 218, 0x070a10, 0.48);
    this.fillRect(102, 86, 756, 172, 0x8bb8c8, 0.12);
    this.fillRect(458, 64, 44, 218, 0x090b10, 0.72);
    this.fillRect(356, 76, 248, 24, 0x090b10, 0.82);
    this.fillRect(416, 96, 128, 18, 0x1b1f27);

    this.fillRect(0, 344, 960, 46, 0x0c0f16);
    this.fillRect(0, 390, 960, 150, 0x11151d);
    this.fillRect(154, 388, 652, 58, 0x232a35);
    this.fillRect(210, 372, 112, 28, 0xe3b33f);
    this.fillRect(638, 372, 112, 28, 0xe3b33f);
    this.fillRect(248, 406, 466, 16, 0x303847);

    const phoneGlow = 0.28 + Math.sin(time * 4) * 0.08;
    this.fillRect(726, 276, 48, 72, 0x0d1117);
    this.fillRect(733, 284, 34, 52, 0x53b6b2, phoneGlow);
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
