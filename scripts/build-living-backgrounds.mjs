import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { PNG } from "pngjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const sourceDir = path.join(root, "public", "assets", "generated", "backgrounds");
const outputWidth = 960;
const outputHeight = 540;

const locations = [
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

const locationTone = {
  taxi: { r: 8, g: 4, b: -2, contrast: 1.03, wave: 1.4 },
  hospital: { r: 5, g: 3, b: 1, contrast: 1.02, wave: 1.0 },
  road: { r: 9, g: 5, b: -4, contrast: 1.04, wave: 1.6 },
  bosquete: { r: 2, g: 8, b: -5, contrast: 1.04, wave: 2.2 },
  valley: { r: 4, g: 6, b: 1, contrast: 1.04, wave: 1.5 },
  ravine: { r: 8, g: 3, b: -4, contrast: 1.05, wave: 1.3 },
  river: { r: 1, g: 5, b: 8, contrast: 1.04, wave: 2.6 },
  night: { r: -5, g: -2, b: 10, contrast: 1.05, wave: 0.8 },
  room: { r: 8, g: 2, b: -2, contrast: 1.03, wave: 0.7 }
};

const frames = [
  { suffix: "1", offsetX: 0, offsetY: 0, brightness: 1, warmth: 0, phase: 0 },
  { suffix: "2", offsetX: 1.8, offsetY: -0.9, brightness: 1.028, warmth: 0.018, phase: 1.9 },
  { suffix: "3", offsetX: -1.4, offsetY: 0.8, brightness: 0.992, warmth: -0.008, phase: 3.8 }
];

function clamp(value, min = 0, max = 255) {
  return Math.max(min, Math.min(max, value));
}

function sampleBilinear(source, x, y, channel) {
  const x0 = Math.floor(clamp(x, 0, source.width - 1));
  const y0 = Math.floor(clamp(y, 0, source.height - 1));
  const x1 = Math.min(source.width - 1, x0 + 1);
  const y1 = Math.min(source.height - 1, y0 + 1);
  const tx = clamp(x - x0, 0, 1);
  const ty = clamp(y - y0, 0, 1);
  const i00 = (y0 * source.width + x0) * 4 + channel;
  const i10 = (y0 * source.width + x1) * 4 + channel;
  const i01 = (y1 * source.width + x0) * 4 + channel;
  const i11 = (y1 * source.width + x1) * 4 + channel;
  const top = source.data[i00] * (1 - tx) + source.data[i10] * tx;
  const bottom = source.data[i01] * (1 - tx) + source.data[i11] * tx;
  return top * (1 - ty) + bottom * ty;
}

function toneChannel(value, contrast, brightness, shift) {
  return clamp((value - 128) * contrast + 128 * brightness + shift);
}

function renderFrame(location, source, frame) {
  const output = new PNG({ width: outputWidth, height: outputHeight });
  const tone = locationTone[location];
  const sourceAspect = source.width / source.height;
  const outputAspect = outputWidth / outputHeight;
  const cropWidth = sourceAspect > outputAspect ? source.height * outputAspect : source.width;
  const cropHeight = sourceAspect > outputAspect ? source.height : source.width / outputAspect;
  const cropX = (source.width - cropWidth) / 2;
  const cropY = (source.height - cropHeight) / 2;
  const scaleX = cropWidth / outputWidth;
  const scaleY = cropHeight / outputHeight;

  for (let y = 0; y < outputHeight; y += 1) {
    const vertical = y / outputHeight;
    const atmosphereWave =
      Math.sin(vertical * Math.PI * 2.4 + frame.phase) * tone.wave * (0.25 + (1 - vertical) * 0.75);

    for (let x = 0; x < outputWidth; x += 1) {
      const horizontal = x / outputWidth;
      let sourceX = cropX + (x + 0.5 + frame.offsetX + atmosphereWave) * scaleX;
      let sourceY = cropY + (y + 0.5 + frame.offsetY) * scaleY;

      if (location === "river" && y > 292) {
        sourceX += Math.sin(horizontal * Math.PI * 12 + frame.phase) * 2.4;
        sourceY += Math.sin(horizontal * Math.PI * 7 + frame.phase) * 0.8;
      }

      if (location === "bosquete" && y < 330) {
        sourceX += Math.sin((x + y) * 0.018 + frame.phase) * 0.9;
      }

      const index = (y * outputWidth + x) * 4;
      const vignetteX = (x - outputWidth / 2) / (outputWidth / 2);
      const vignetteY = (y - outputHeight / 2) / (outputHeight / 2);
      const vignette = 1 - Math.max(0, Math.hypot(vignetteX, vignetteY * 0.82) - 0.65) * 0.16;
      const pulse = 1 + Math.sin(frame.phase + horizontal * Math.PI * 1.3) * 0.007;
      const brightness = frame.brightness * vignette * pulse;
      const warmShift = frame.warmth * 255;

      const r = sampleBilinear(source, sourceX, sourceY, 0);
      const g = sampleBilinear(source, sourceX, sourceY, 1);
      const b = sampleBilinear(source, sourceX, sourceY, 2);

      output.data[index] = toneChannel(r, tone.contrast, brightness, tone.r + warmShift);
      output.data[index + 1] = toneChannel(g, tone.contrast, brightness, tone.g + warmShift * 0.55);
      output.data[index + 2] = toneChannel(b, tone.contrast, brightness, tone.b - warmShift * 0.25);
      output.data[index + 3] = 255;
    }
  }

  return output;
}

for (const location of locations) {
  const sourcePath = path.join(sourceDir, `${location}-beauty-source.png`);
  const outputDir = path.join(sourceDir, location);
  fs.mkdirSync(outputDir, { recursive: true });
  const source = PNG.sync.read(fs.readFileSync(sourcePath));

  for (const frame of frames) {
    const rendered = renderFrame(location, source, frame);
    const outputPath = path.join(outputDir, `beauty-${frame.suffix}.png`);
    fs.writeFileSync(outputPath, PNG.sync.write(rendered));
  }
}
