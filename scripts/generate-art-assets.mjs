import fs from "node:fs";
import path from "node:path";
import { PNG } from "pngjs";

const root = process.cwd();
const out = (...parts) => path.join(root, "public", "assets", ...parts);

const W = 960;
const H = 540;

const rgba = (hex, alpha = 255) => {
  const clean = hex.replace("#", "");
  return [
    Number.parseInt(clean.slice(0, 2), 16),
    Number.parseInt(clean.slice(2, 4), 16),
    Number.parseInt(clean.slice(4, 6), 16),
    alpha
  ];
};

function createPng(width = W, height = H) {
  return new PNG({ width, height, colorType: 6 });
}

function fill(png, x, y, width, height, color) {
  const [r, g, b, a] = color;
  const x0 = Math.max(0, Math.floor(x));
  const y0 = Math.max(0, Math.floor(y));
  const x1 = Math.min(png.width, Math.ceil(x + width));
  const y1 = Math.min(png.height, Math.ceil(y + height));

  for (let py = y0; py < y1; py += 1) {
    for (let px = x0; px < x1; px += 1) {
      const idx = (png.width * py + px) << 2;
      png.data[idx] = r;
      png.data[idx + 1] = g;
      png.data[idx + 2] = b;
      png.data[idx + 3] = a;
    }
  }
}

function save(png, filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, PNG.sync.write(png));
}

function plus(png, x, y, size, color) {
  fill(png, x + size, y, size, size * 3, color);
  fill(png, x, y + size, size * 3, size, color);
}

function hospital() {
  const sky = createPng();
  fill(sky, 0, 0, W, H, rgba("#1c2431"));
  fill(sky, 0, 0, W, 205, rgba("#172030"));
  for (let x = 0; x < W; x += 120) fill(sky, x, 78 + (x % 3) * 8, 42, 4, rgba("#5e6c7d", 92));

  const back = createPng();
  for (let x = 82; x < 900; x += 190) {
    fill(back, x, 112, 118, 148, rgba("#aab3b8"));
    fill(back, x + 18, 132, 82, 20, rgba("#457079"));
    fill(back, x + 18, 166, 82, 24, rgba("#3b626b"));
    fill(back, x + 18, 206, 82, 26, rgba("#355864"));
  }
  fill(back, 408, 82, 148, 104, rgba("#d9d7c9"));
  plus(back, 462, 105, 28, rgba("#9d3340"));

  const mid = createPng();
  fill(mid, 0, 282, W, 164, rgba("#798086"));
  fill(mid, 0, 446, W, 94, rgba("#353e4a"));
  for (let x = 0; x < W; x += 92) fill(mid, x + 16, 486, 48, 7, rgba("#dbe2df", 70));

  const front = createPng();
  fill(front, 40, 444, 880, 10, rgba("#58636d"));
  fill(front, 0, 514, W, 26, rgba("#202832"));

  const fx = createPng();
  for (let x = 40; x < W; x += 135) fill(fx, x, 300, 34, 4, rgba("#fff2dc", 46));

  saveSet("hospital", { sky, back, mid, front, fx });
}

function bosquete() {
  const sky = createPng();
  fill(sky, 0, 0, W, H, rgba("#152234"));
  fill(sky, 0, 0, W, 230, rgba("#20324a"));
  for (let x = 20; x < W; x += 145) fill(sky, x, 92 + (x % 4) * 9, 70, 5, rgba("#dce7dd", 42));

  const back = createPng();
  for (let x = -30; x < 1010; x += 92) {
    fill(back, x + 32, 224, 28, 144, rgba("#1d2418"));
    fill(back, x, 174, 86, 58, rgba("#456c38"));
    fill(back, x + 15, 132, 72, 62, rgba("#5d8445"));
  }

  const mid = createPng();
  fill(mid, 0, 300, W, 150, rgba("#385143"));
  for (let x = -18; x < W; x += 78) {
    fill(mid, x, 350, 48, 8, rgba("#6ba27a", 124));
    fill(mid, x + 26, 400, 62, 7, rgba("#5f8b6d", 124));
  }
  fill(mid, 620, 414, 118, 18, rgba("#6a6157"));
  fill(mid, 642, 396, 72, 24, rgba("#8f8173"));

  const front = createPng();
  fill(front, 0, 450, W, 90, rgba("#24341e"));
  for (let x = 0; x < W; x += 54) fill(front, x, 470 + (x % 2) * 10, 26, 8, rgba("#1a2617"));

  const fx = createPng();
  for (let i = 0; i < 18; i += 1) {
    const x = 25 + i * 54;
    fill(fx, x, 116 + (i % 5) * 18, 6, 6, rgba("#fff2dc", 60));
  }

  saveSet("bosquete", { sky, back, mid, front, fx });
}

function river() {
  const sky = createPng();
  fill(sky, 0, 0, W, H, rgba("#18272e"));
  fill(sky, 0, 0, W, 206, rgba("#263247"));
  for (let x = 0; x < W; x += 124) fill(sky, x + 20, 92 + (x % 3) * 11, 68, 5, rgba("#edf0da", 45));

  const back = createPng();
  fill(back, 0, 206, W, 76, rgba("#425c55"));
  for (let x = 20; x < W; x += 110) {
    fill(back, x, 238, 24, 46, rgba("#1c2618"));
    fill(back, x - 20, 204, 70, 42, rgba("#476b3d"));
    fill(back, x + 12, 184, 52, 48, rgba("#5a7f46"));
  }

  const mid = createPng();
  fill(mid, 0, 282, W, 168, rgba("#24606d"));
  for (let x = -20; x < W; x += 54) {
    fill(mid, x, 314 + ((x / 54) % 2) * 12, 36, 8, rgba("#74c8bb"));
    fill(mid, x + 20, 374, 46, 6, rgba("#397d87"));
  }
  fill(mid, 120, 396, 52, 22, rgba("#50606a"));
  fill(mid, 160, 412, 28, 12, rgba("#82919a"));
  fill(mid, 780, 416, 64, 18, rgba("#5d5d61"));
  fill(mid, 820, 430, 36, 10, rgba("#8b8a83"));

  const front = createPng();
  fill(front, 0, 450, W, 90, rgba("#27351f"));
  fill(front, 0, 450, W, 8, rgba("#3f5930"));

  const fx = createPng();
  for (let x = 0; x < W; x += 96) fill(fx, x + 12, 340, 42, 4, rgba("#fff2dc", 45));

  saveSet("river", { sky, back, mid, front, fx });
}

function saveSet(location, layers) {
  for (const [name, png] of Object.entries(layers)) {
    save(png, out("chapter-1", location, `${name}.png`));
  }
}

function readPng(filePath) {
  return PNG.sync.read(fs.readFileSync(filePath));
}

function clonePng(png) {
  const copy = createPng(png.width, png.height);
  png.data.copy(copy.data);
  return copy;
}

function transparentFlood(png) {
  const stack = [];
  const visited = new Uint8Array(png.width * png.height);

  for (let x = 0; x < png.width; x += 1) stack.push([x, 0], [x, png.height - 1]);
  for (let y = 0; y < png.height; y += 1) stack.push([0, y], [png.width - 1, y]);

  while (stack.length) {
    const [x, y] = stack.pop();
    if (x < 0 || y < 0 || x >= png.width || y >= png.height) continue;
    const pos = y * png.width + x;
    if (visited[pos]) continue;
    visited[pos] = 1;
    const idx = pos << 2;
    const r = png.data[idx];
    const g = png.data[idx + 1];
    const b = png.data[idx + 2];
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    if (!(min > 8 && max < 88 && max - min < 28)) continue;
    png.data[idx + 3] = 0;
    stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
  }
}

function tintFrame(png, tint) {
  const [tr, tg, tb, strength] = tint;
  for (let i = 0; i < png.data.length; i += 4) {
    if (png.data[i + 3] === 0) continue;
    png.data[i] = Math.round(png.data[i] * (1 - strength) + tr * strength);
    png.data[i + 1] = Math.round(png.data[i + 1] * (1 - strength) + tg * strength);
    png.data[i + 2] = Math.round(png.data[i + 2] * (1 - strength) + tb * strength);
  }
}

function addFrameBadge(png, expression, character) {
  const badgeColors = {
    neutral: null,
    happy: "#e86a7a",
    surprised: "#fff2a6",
    scared: "#70c6d6",
    shy: "#e9a2bc",
    talking: "#f0b46a",
    thinking: "#9cc3ff"
  };
  const color = badgeColors[expression];
  if (!color) return;

  const x = character === "alexis" ? 186 : 176;
  const y = 72;
  fill(png, x, y + 8, 7, 7, rgba(color));
  fill(png, x + 7, y, 7, 21, rgba(color));
  fill(png, x - 7, y + 7, 21, 7, rgba(color));
}

function makeCompleteFrameSet(character) {
  const base = readPng(out(`${character}-base.png`));
  const expressions = ["neutral", "happy", "surprised", "scared", "shy", "talking", "thinking"];
  const tints = {
    neutral: null,
    happy: [232, 106, 122, 0.04],
    surprised: [255, 242, 166, 0.06],
    scared: [112, 198, 214, 0.08],
    shy: [233, 162, 188, 0.06],
    talking: [240, 180, 106, 0.04],
    thinking: [156, 195, 255, 0.05]
  };

  for (const expression of expressions) {
    const png = clonePng(base);
    transparentFlood(png);
    if (tints[expression]) tintFrame(png, tints[expression]);
    addFrameBadge(png, expression, character);
    save(png, out("characters", character, `${expression}.png`));
  }
}

hospital();
bosquete();
river();

makeCompleteFrameSet("alexis");
makeCompleteFrameSet("kiara");

console.log("Generated chapter 1 layered backgrounds and full-frame character sprites.");
