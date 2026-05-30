import fs from "node:fs";
import path from "node:path";
import { PNG } from "pngjs";

const root = process.cwd();
const frameWidth = 256;
const frameHeight = 386;

const characters = ["alexis", "kiara"];
const frames = [
  { pose: "side", dx: 0, dy: 0 },
  { pose: "walking-side", dx: 1, dy: -2 },
  { pose: "walking-side", dx: 2, dy: -1 },
  { pose: "side", dx: 0, dy: 0 },
  { pose: "side", dx: 0, dy: 1 },
  { pose: "walking-side", dx: -1, dy: -2 },
  { pose: "walking-side", dx: -2, dy: -1 },
  { pose: "side", dx: 0, dy: 0 }
];

function readPng(filePath) {
  return PNG.sync.read(fs.readFileSync(filePath));
}

function pasteFrame(sheet, source, frameIndex, dx, dy) {
  const baseX = frameIndex * frameWidth + Math.floor((frameWidth - source.width) / 2) + dx;
  const baseY = frameHeight - source.height + dy;

  for (let y = 0; y < source.height; y += 1) {
    for (let x = 0; x < source.width; x += 1) {
      const srcIndex = (source.width * y + x) << 2;
      const alpha = source.data[srcIndex + 3];
      if (alpha === 0) continue;

      const targetX = baseX + x;
      const targetY = baseY + y;
      if (targetX < 0 || targetX >= sheet.width || targetY < 0 || targetY >= sheet.height) continue;

      const targetIndex = (sheet.width * targetY + targetX) << 2;
      sheet.data[targetIndex] = source.data[srcIndex];
      sheet.data[targetIndex + 1] = source.data[srcIndex + 1];
      sheet.data[targetIndex + 2] = source.data[srcIndex + 2];
      sheet.data[targetIndex + 3] = alpha;
    }
  }
}

for (const character of characters) {
  const poseRoot = path.join(root, "public", "assets", "characters", character, "poses");
  const sources = {
    side: readPng(path.join(poseRoot, "side.png")),
    "walking-side": readPng(path.join(poseRoot, "walking-side.png"))
  };
  const sheet = new PNG({ width: frameWidth * frames.length, height: frameHeight, colorType: 6 });

  frames.forEach((frame, index) => {
    pasteFrame(sheet, sources[frame.pose], index, frame.dx, frame.dy);
  });

  const outputPath = path.join(root, "public", "assets", "characters", character, "animations", "walk-side.png");
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, PNG.sync.write(sheet));
}

console.log("Built local character walk spritesheets.");
