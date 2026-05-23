import fs from "node:fs";
import path from "node:path";
import { PNG } from "pngjs";

const root = process.cwd();
const assetRoot = path.join(root, "public", "assets");
const characters = ["alexis", "kiara"];
const expressions = [
  "neutral",
  "happy",
  "surprised",
  "scared",
  "shy",
  "talking",
  "thinking",
  "angry",
  "crying",
  "laughing",
  "sleepy"
];

function readPng(filePath) {
  return PNG.sync.read(fs.readFileSync(filePath));
}

function clonePng(png) {
  const copy = new PNG({ width: png.width, height: png.height, colorType: 6 });
  png.data.copy(copy.data);
  return copy;
}

function savePng(png, filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, PNG.sync.write(png));
}

function isGreenFringe(r, g, b, a) {
  if (a === 0) return false;
  if (g < 70) return false;
  return g > r + 24 && g > b + 24 && r < 120 && b < 130;
}

function cleanTransparentPixels(png) {
  for (let i = 0; i < png.data.length; i += 4) {
    const a = png.data[i + 3];
    if (a === 0) {
      png.data[i] = 0;
      png.data[i + 1] = 0;
      png.data[i + 2] = 0;
      continue;
    }

    const r = png.data[i];
    const g = png.data[i + 1];
    const b = png.data[i + 2];

    if (isGreenFringe(r, g, b, a)) {
      png.data[i] = 0;
      png.data[i + 1] = 0;
      png.data[i + 2] = 0;
      png.data[i + 3] = 0;
      continue;
    }

    if (g > r + 12 && g > b + 12) {
      png.data[i + 1] = Math.max(r, b);
    }
  }
}

function listPngFiles(dir) {
  if (!fs.existsSync(dir)) return [];

  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(dir, entry.name);
    if (entry.isDirectory()) return listPngFiles(entryPath);
    return entry.name.endsWith(".png") ? [entryPath] : [];
  });
}

for (const character of characters) {
  const characterDir = path.join(assetRoot, "characters", character);
  const neutralPath = path.join(characterDir, "neutral.png");
  const neutral = readPng(neutralPath);
  cleanTransparentPixels(neutral);

  for (const expression of expressions) {
    const frame = clonePng(neutral);
    savePng(frame, path.join(characterDir, `${expression}.png`));
  }
}

for (const dir of [
  path.join(assetRoot, "characters"),
  path.join(assetRoot, "couples"),
  path.join(assetRoot, "npcs")
]) {
  for (const filePath of listPngFiles(dir)) {
    const png = readPng(filePath);
    cleanTransparentPixels(png);
    savePng(png, filePath);
  }
}

console.log("Character sprites repaired: clean transparent expressions and chroma fringes removed.");
