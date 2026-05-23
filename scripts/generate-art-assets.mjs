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

function mixColor(a, b, t) {
  return [
    Math.round(a[0] + (b[0] - a[0]) * t),
    Math.round(a[1] + (b[1] - a[1]) * t),
    Math.round(a[2] + (b[2] - a[2]) * t),
    Math.round(a[3] + (b[3] - a[3]) * t)
  ];
}

function verticalGradient(png, y, height, topColor, bottomColor, step = 4) {
  for (let yy = y; yy < y + height; yy += step) {
    const t = (yy - y) / Math.max(1, height);
    fill(png, 0, yy, png.width, step, mixColor(topColor, bottomColor, t));
  }
}

function seeded(seed) {
  let value = seed >>> 0;
  return () => {
    value = (value * 1664525 + 1013904223) >>> 0;
    return value / 4294967296;
  };
}

function scatter(png, seed, count, area, palette, options = {}) {
  const rand = seeded(seed);
  const min = options.min ?? 2;
  const max = options.max ?? 7;

  for (let i = 0; i < count; i += 1) {
    const size = Math.floor(min + rand() * (max - min + 1));
    const x = area.x + Math.floor(rand() * area.w);
    const y = area.y + Math.floor(rand() * area.h);
    const color = palette[Math.floor(rand() * palette.length)];
    fill(png, x, y, size + Math.floor(rand() * 5), Math.max(2, Math.floor(size * 0.55)), color);
  }
}

function fillPolygon(png, points, color) {
  const ys = points.map((point) => point[1]);
  const minY = Math.max(0, Math.floor(Math.min(...ys)));
  const maxY = Math.min(png.height - 1, Math.ceil(Math.max(...ys)));

  for (let y = minY; y <= maxY; y += 1) {
    const intersections = [];
    for (let i = 0; i < points.length; i += 1) {
      const a = points[i];
      const b = points[(i + 1) % points.length];
      if ((a[1] <= y && b[1] > y) || (b[1] <= y && a[1] > y)) {
        intersections.push(a[0] + ((y - a[1]) * (b[0] - a[0])) / (b[1] - a[1]));
      }
    }
    intersections.sort((a, b) => a - b);
    for (let i = 0; i < intersections.length; i += 2) {
      const x0 = Math.max(0, Math.floor(intersections[i]));
      const x1 = Math.min(png.width, Math.ceil(intersections[i + 1]));
      fill(png, x0, y, x1 - x0, 1, color);
    }
  }
}

function drawCloud(png, x, y, scale, color, shade = rgba("#c4cada", 70)) {
  const s = scale;
  fill(png, x, y + 10 * s, 52 * s, 10 * s, shade);
  fill(png, x + 14 * s, y, 40 * s, 14 * s, color);
  fill(png, x + 42 * s, y + 6 * s, 46 * s, 14 * s, color);
  fill(png, x - 8 * s, y + 14 * s, 72 * s, 12 * s, color);
  fill(png, x + 62 * s, y + 18 * s, 38 * s, 8 * s, shade);
}

function drawMountainBand(png, baseY, color, shade, offset = 0) {
  const points = [[-80, baseY], [70, baseY - 88], [188, baseY - 34], [328, baseY - 112], [500, baseY - 30], [662, baseY - 104], [840, baseY - 40], [1040, baseY - 116], [1040, baseY + 70], [-80, baseY + 70]];
  fillPolygon(png, points.map(([x, y]) => [x + offset, y]), color);
  for (let x = -60; x < W + 120; x += 84) {
    pixelLine(png, x + offset, baseY - 10 - ((x + 240) % 64), x + 62 + offset, baseY + 24, 4, shade);
  }
}

function drawTree(png, x, y, scale, palette = {}) {
  const trunk = palette.trunk ?? rgba("#5a3523");
  const trunkLight = palette.trunkLight ?? rgba("#9a6740");
  const leafDark = palette.leafDark ?? rgba("#173019");
  const leaf = palette.leaf ?? rgba("#315c2e");
  const leafLight = palette.leafLight ?? rgba("#6f9e51");
  const s = scale;
  fill(png, x + 20 * s, y - 108 * s, 24 * s, 108 * s, trunk);
  fill(png, x + 30 * s, y - 104 * s, 6 * s, 96 * s, trunkLight);
  pixelLine(png, x + 28 * s, y - 78 * s, x - 12 * s, y - 132 * s, 9 * s, trunk);
  pixelLine(png, x + 38 * s, y - 70 * s, x + 80 * s, y - 124 * s, 8 * s, trunk);
  fill(png, x - 42 * s, y - 166 * s, 108 * s, 44 * s, leafDark);
  fill(png, x - 18 * s, y - 202 * s, 116 * s, 50 * s, leaf);
  fill(png, x + 42 * s, y - 162 * s, 94 * s, 38 * s, leafDark);
  fill(png, x - 28 * s, y - 218 * s, 66 * s, 28 * s, leafLight);
  fill(png, x + 62 * s, y - 190 * s, 64 * s, 26 * s, leafLight);
}

function drawTallGrass(png, y, colors, seed = 100) {
  const rand = seeded(seed);
  for (let x = -10; x < W + 10; x += 10) {
    const height = 16 + Math.floor(rand() * 30);
    const color = colors[Math.floor(rand() * colors.length)];
    fill(png, x, y - height, 4, height, color);
    fill(png, x + 4, y - Math.floor(height * 0.55), 8, 4, color);
  }
}

function drawFlowers(png, seed, area, colors) {
  const rand = seeded(seed);
  for (let i = 0; i < 60; i += 1) {
    const x = area.x + Math.floor(rand() * area.w);
    const y = area.y + Math.floor(rand() * area.h);
    const stem = colors.stem ?? rgba("#568b42");
    const flower = colors.petals[Math.floor(rand() * colors.petals.length)];
    fill(png, x, y + 4, 3, 8, stem);
    fill(png, x - 4, y, 4, 4, flower);
    fill(png, x + 4, y, 4, 4, flower);
    fill(png, x, y - 4, 4, 4, flower);
    fill(png, x, y + 4, 4, 4, rgba("#ffe6a0"));
  }
}

function drawRock(png, x, y, width, height, color = rgba("#6b717a"), light = rgba("#9aa0a6")) {
  fill(png, x, y + height * 0.35, width, height * 0.45, rgba("#3f454d"));
  fill(png, x + width * 0.1, y, width * 0.7, height * 0.5, color);
  fill(png, x + width * 0.2, y + height * 0.12, width * 0.35, height * 0.12, light);
  fill(png, x + width * 0.72, y + height * 0.28, width * 0.2, height * 0.2, color);
}

function drawPixelHouse(png, x, y, scale = 1) {
  const s = scale;
  fill(png, x, y - 48 * s, 112 * s, 48 * s, rgba("#f0d0a2"));
  fill(png, x - 10 * s, y - 58 * s, 132 * s, 18 * s, rgba("#8d3f35"));
  fillPolygon(png, [[x - 14 * s, y - 58 * s], [x + 56 * s, y - 96 * s], [x + 126 * s, y - 58 * s]], rgba("#b95b46"));
  fill(png, x + 14 * s, y - 34 * s, 22 * s, 20 * s, rgba("#446a7a"));
  fill(png, x + 72 * s, y - 40 * s, 26 * s, 40 * s, rgba("#6a4a36"));
  fill(png, x + 77 * s, y - 26 * s, 5 * s, 5 * s, rgba("#ffd27d"));
}

function drawWaterHighlights(png, y, height, seed = 20, color = rgba("#a6eee5", 120)) {
  const rand = seeded(seed);
  for (let i = 0; i < 80; i += 1) {
    const x = Math.floor(rand() * W);
    const yy = y + Math.floor(rand() * height);
    const w = 18 + Math.floor(rand() * 54);
    const h = rand() > 0.65 ? 5 : 3;
    fill(png, x, yy, w, h, color);
  }
}

function taxi() {
  const sky = createPng();
  verticalGradient(sky, 0, H, rgba("#151c2c"), rgba("#40526a"));
  drawMountainBand(sky, 306, rgba("#1c2734"), rgba("#293748"), -80);
  for (let x = -40; x < W + 80; x += 96) {
    const h = 86 + ((x + 260) % 5) * 16;
    fill(sky, x, 250 - h, 62, h, rgba("#202b38"));
    fill(sky, x + 10, 260 - h, 14, 18, rgba("#ffd27d", 110));
    fill(sky, x + 38, 292 - h, 12, 16, rgba("#7fcad0", 92));
  }

  const back = createPng();
  fill(back, 0, 266, W, 76, rgba("#2f3e4e"));
  for (let x = -20; x < W + 120; x += 170) {
    fill(back, x, 290, 108, 28, rgba("#24313f"));
    fill(back, x + 16, 278, 56, 18, rgba("#f1cc6b", 180));
    fill(back, x + 82, 304, 18, 10, rgba("#d34e4c", 190));
  }
  for (let x = -80; x < W + 160; x += 145) fill(back, x, 324, 70, 5, rgba("#ffd27d", 120));

  const mid = createPng();
  fill(mid, 68, 54, 824, 228, rgba("#070a10", 170));
  fill(mid, 100, 82, 758, 176, rgba("#8bd6df", 30));
  fill(mid, 452, 54, 52, 228, rgba("#070a10", 205));
  fill(mid, 344, 66, 272, 26, rgba("#090b10", 218));
  fill(mid, 412, 94, 136, 20, rgba("#202733"));
  fill(mid, 96, 286, 768, 76, rgba("#0d1119"));
  fill(mid, 140, 332, 680, 56, rgba("#252d38"));
  fill(mid, 214, 378, 118, 28, rgba("#d9a93a"));
  fill(mid, 628, 378, 118, 28, rgba("#d9a93a"));
  fill(mid, 248, 406, 466, 16, rgba("#303948"));
  fill(mid, 732, 280, 38, 62, rgba("#0b1118"));
  fill(mid, 738, 288, 26, 44, rgba("#5cd1c5", 120));

  const front = createPng();
  fill(front, 0, 0, W, 42, rgba("#07090e"));
  fill(front, 0, 344, W, 52, rgba("#090c12"));
  fill(front, 0, 392, W, 148, rgba("#111722"));
  fill(front, 56, 82, 38, 252, rgba("#07090e", 235));
  fill(front, 866, 82, 38, 252, rgba("#07090e", 235));
  fill(front, 0, 500, W, 40, rgba("#07090e"));

  const fx = createPng();
  for (let x = -40; x < W; x += 136) {
    fill(fx, x, 138, 84, 5, rgba("#fff1b2", 86));
    fill(fx, x + 42, 222, 118, 4, rgba("#9ce0df", 62));
  }
  fill(fx, 730, 278, 48, 74, rgba("#5cd1c5", 36));
  saveSet("taxi", { sky, back, mid, front, fx });
}

function hospital() {
  const sky = createPng();
  verticalGradient(sky, 0, H, rgba("#1a2234"), rgba("#65416a"));
  fill(sky, 0, 250, W, 80, rgba("#233747"));
  drawCloud(sky, 86, 92, 1, rgba("#d5d2df", 90), rgba("#726d8e", 72));
  drawCloud(sky, 568, 72, 1, rgba("#f2d6cf", 78), rgba("#7e6682", 70));
  scatter(sky, 41, 36, { x: 0, y: 40, w: W, h: 170 }, [rgba("#fff2dc", 72), rgba("#ffd27d", 70)], { min: 2, max: 4 });

  const back = createPng();
  fill(back, 36, 78, 888, 244, rgba("#273246"));
  fill(back, 54, 94, 852, 212, rgba("#899399"));
  fill(back, 74, 114, 372, 176, rgba("#b9c0bf"));
  fill(back, 470, 104, 384, 186, rgba("#76848d"));
  fill(back, 118, 150, 210, 118, rgba("#d7e7e5"));
  fill(back, 138, 168, 72, 82, rgba("#456f7c", 190));
  fill(back, 232, 168, 72, 82, rgba("#456f7c", 190));
  fill(back, 534, 142, 98, 108, rgba("#263848"));
  fill(back, 656, 142, 98, 108, rgba("#263848"));
  fill(back, 388, 122, 92, 112, rgba("#f5e1ba"));
  plus(back, 421, 145, 18, rgba("#a02b39"));
  for (let x = 76; x < 858; x += 96) fill(back, x, 96, 52, 5, rgba("#ffe0a4", 120));
  for (let x = 530; x < 780; x += 54) fill(back, x, 268, 36, 10, rgba("#1e2a36"));

  const mid = createPng();
  fill(mid, 0, 300, W, 72, rgba("#626d78"));
  fill(mid, 0, 372, W, 96, rgba("#343f4c"));
  for (let x = 0; x < W; x += 76) {
    fill(mid, x, 315, 62, 3, rgba("#aab8b5", 58));
    fill(mid, x + 18, 392, 46, 6, rgba("#e6e9df", 92));
  }
  fill(mid, 20, 342, 270, 28, rgba("#1f2c2d"));
  fill(mid, 48, 328, 58, 36, rgba("#426b34"));
  fill(mid, 122, 332, 66, 32, rgba("#537c3f"));
  fill(mid, 210, 336, 52, 28, rgba("#7a9154"));
  fill(mid, 688, 330, 142, 34, rgba("#1f2d36"));
  fill(mid, 710, 306, 88, 24, rgba("#455463"));

  const front = createPng();
  fill(front, 0, 466, W, 74, rgba("#17242b"));
  fill(front, 0, 456, W, 12, rgba("#566370"));
  drawTallGrass(front, 538, [rgba("#264a2c"), rgba("#376e39"), rgba("#5a8644")], 54);
  drawFlowers(front, 57, { x: 0, y: 472, w: W, h: 52 }, { petals: [rgba("#ff8aa1"), rgba("#ffd27d"), rgba("#fff2dc")] });
  for (let x = 62; x < 930; x += 122) {
    fill(front, x, 392, 14, 70, rgba("#1b222b"));
    fill(front, x - 4, 386, 22, 10, rgba("#d3454b"));
  }

  const fx = createPng();
  for (let x = 52; x < W; x += 126) fill(fx, x, 116, 50, 5, rgba("#fff2dc", 56));
  for (let x = 84; x < W; x += 178) fill(fx, x, 326, 32, 4, rgba("#ffe0a4", 64));

  saveSet("hospital", { sky, back, mid, front, fx });
}

function road() {
  const sky = createPng();
  verticalGradient(sky, 0, H, rgba("#232c42"), rgba("#c07165"));
  drawCloud(sky, 64, 94, 1, rgba("#fff2dc", 80), rgba("#9a7088", 72));
  drawCloud(sky, 610, 76, 1, rgba("#ffd3bd", 78), rgba("#7c6687", 72));
  drawMountainBand(sky, 308, rgba("#485b55"), rgba("#32433e"), 0);

  const back = createPng();
  fill(back, 0, 286, W, 74, rgba("#38584d"));
  for (let x = -40; x < W + 120; x += 112) {
    fill(back, x + 40, 210, 18, 104, rgba("#31402c"));
    fill(back, x, 188, 88, 48, rgba("#4d7440"));
    fill(back, x + 22, 152, 76, 52, rgba("#6f9452"));
  }
  for (let x = 0; x < W; x += 140) {
    fill(back, x, 318, 104, 6, rgba("#ddd3a2", 80));
  }

  const mid = createPng();
  fill(mid, 0, 332, W, 46, rgba("#6f725c"));
  fillPolygon(mid, [[0, 378], [960, 340], [960, 540], [0, 540]], rgba("#333842"));
  fillPolygon(mid, [[404, 378], [520, 372], [840, 540], [290, 540]], rgba("#232833"));
  for (let y = 390; y < 540; y += 42) {
    const t = (y - 390) / 150;
    fill(mid, 438 + t * 20, y, 96 + t * 160, 7, rgba("#f3d88d", 130));
  }
  fill(mid, 0, 372, 338, 168, rgba("#446038"));
  fill(mid, 804, 364, 156, 176, rgba("#3b562d"));
  scatter(mid, 61, 120, { x: 0, y: 360, w: W, h: 150 }, [rgba("#5f874b"), rgba("#7ba45a"), rgba("#384a32")], { min: 3, max: 11 });

  const front = createPng();
  drawTallGrass(front, 540, [rgba("#22371d"), rgba("#355b2f"), rgba("#6f8f42")], 77);
  fill(front, 0, 510, W, 30, rgba("#162018", 190));
  for (let x = -80; x < W + 100; x += 180) {
    fill(front, x, 420, 92, 10, rgba("#6a4d36"));
    fill(front, x + 8, 392, 10, 58, rgba("#533621"));
    fill(front, x + 70, 392, 10, 58, rgba("#533621"));
  }

  const fx = createPng();
  for (let x = 0; x < W; x += 96) fill(fx, x + 12, 372, 46, 4, rgba("#fff0ad", 42));
  scatter(fx, 65, 30, { x: 0, y: 110, w: W, h: 170 }, [rgba("#fff2dc", 58), rgba("#ffd27d", 45)], { min: 2, max: 4 });
  saveSet("road", { sky, back, mid, front, fx });
}

function bosquete() {
  const sky = createPng();
  verticalGradient(sky, 0, H, rgba("#142033"), rgba("#4d3b63"));
  drawCloud(sky, 124, 88, 1, rgba("#ffd8c5", 58), rgba("#6c5b82", 65));
  drawCloud(sky, 606, 116, 1, rgba("#ece4d0", 46), rgba("#636582", 60));

  const back = createPng();
  fill(back, 0, 278, W, 86, rgba("#1d342c"));
  for (let x = -70; x < W + 140; x += 136) drawTree(back, x, 378, 0.86, {
    trunk: rgba("#3c2519"),
    trunkLight: rgba("#8d5a34"),
    leafDark: rgba("#122817"),
    leaf: rgba("#2f5932"),
    leafLight: rgba("#6f944c")
  });

  const mid = createPng();
  fill(mid, 0, 344, W, 82, rgba("#263b2c"));
  fillPolygon(mid, [[338, 340], [620, 340], [840, 540], [116, 540]], rgba("#8a603d"));
  fillPolygon(mid, [[368, 340], [586, 340], [746, 540], [222, 540]], rgba("#b87847"));
  scatter(mid, 82, 220, { x: 0, y: 330, w: W, h: 190 }, [rgba("#24431f"), rgba("#40652f"), rgba("#7f9651"), rgba("#c58c55")], { min: 3, max: 10 });
  fill(mid, 118, 374, 112, 18, rgba("#6a422c"));
  fill(mid, 132, 354, 84, 20, rgba("#9b6842"));
  fill(mid, 176, 288, 18, 96, rgba("#3a2a22"));
  fill(mid, 154, 284, 62, 12, rgba("#ffd27d", 90));
  fill(mid, 162, 248, 44, 40, rgba("#ffd27d", 140));
  fill(mid, 172, 258, 24, 24, rgba("#fff2dc", 150));

  const front = createPng();
  fill(front, 0, 474, W, 66, rgba("#142315"));
  drawTallGrass(front, 540, [rgba("#1e351e"), rgba("#3f6931"), rgba("#7ba64d")], 92);
  drawFlowers(front, 93, { x: 0, y: 454, w: W, h: 76 }, { petals: [rgba("#ff8aa1"), rgba("#f3cc5e"), rgba("#d7e6a4")] });
  drawRock(front, 760, 448, 82, 50, rgba("#676d76"), rgba("#a4a09a"));
  drawRock(front, 96, 466, 56, 36, rgba("#5b626d"), rgba("#969a9d"));

  const fx = createPng();
  scatter(fx, 98, 70, { x: 0, y: 86, w: W, h: 280 }, [rgba("#fff2dc", 68), rgba("#ffd27d", 60), rgba("#91e5c4", 52)], { min: 2, max: 5 });
  saveSet("bosquete", { sky, back, mid, front, fx });
}

function valley() {
  const sky = createPng();
  verticalGradient(sky, 0, H, rgba("#34284c"), rgba("#f0a15e"));
  fill(sky, 0, 178, W, 28, rgba("#f7c579", 110));
  drawCloud(sky, 74, 82, 1, rgba("#ffd8bd", 90), rgba("#8d6686", 70));
  drawCloud(sky, 578, 112, 1, rgba("#ffe0c7", 82), rgba("#9d6878", 72));

  const back = createPng();
  drawMountainBand(back, 312, rgba("#4f654e"), rgba("#405441"), -30);
  fill(back, 0, 300, W, 114, rgba("#668558"));
  for (let x = -30; x < W; x += 74) {
    fillPolygon(back, [[x, 414], [x + 72, 306], [x + 140, 414]], rgba((x / 74) % 2 ? "#587a43" : "#7b9654"));
  }
  for (let x = 20; x < W; x += 88) {
    fill(back, x, 352, 54, 10, rgba("#d9b96b", 112));
    fill(back, x + 20, 370, 76, 8, rgba("#7dbf79", 120));
  }
  fill(back, 0, 408, W, 54, rgba("#24707d"));
  drawWaterHighlights(back, 416, 36, 22, rgba("#abe9e2", 80));

  const mid = createPng();
  fillPolygon(mid, [[0, 372], [300, 330], [960, 398], [960, 540], [0, 540]], rgba("#41612f"));
  fillPolygon(mid, [[0, 406], [340, 356], [960, 420], [960, 540], [0, 540]], rgba("#6c8c42"));
  fillPolygon(mid, [[260, 372], [540, 364], [636, 540], [194, 540]], rgba("#b67a42"));
  drawPixelHouse(mid, 666, 394, 0.72);
  fill(mid, 626, 414, 178, 44, rgba("#436f37"));
  drawFlowers(mid, 133, { x: 600, y: 414, w: 236, h: 60 }, { petals: [rgba("#ff95ad"), rgba("#fff2dc"), rgba("#ffd27d")] });
  scatter(mid, 123, 140, { x: 0, y: 356, w: W, h: 150 }, [rgba("#3d642d"), rgba("#759a4a"), rgba("#cda85b"), rgba("#8a5e3d")], { min: 3, max: 10 });

  const front = createPng();
  fill(front, 0, 468, W, 72, rgba("#22351b"));
  drawTallGrass(front, 540, [rgba("#243c1e"), rgba("#557b34"), rgba("#b2a557")], 136);
  drawFlowers(front, 137, { x: 0, y: 468, w: W, h: 58 }, { petals: [rgba("#f58aa0"), rgba("#f7d16a"), rgba("#ffffff")] });

  const fx = createPng();
  for (let x = 0; x < W; x += 112) fill(fx, x, 188, 56, 4, rgba("#fff2dc", 48));
  scatter(fx, 141, 34, { x: 0, y: 118, w: W, h: 210 }, [rgba("#fff2dc", 64), rgba("#ffd27d", 58)], { min: 2, max: 4 });
  saveSet("valley", { sky, back, mid, front, fx });
}

function ravine() {
  const sky = createPng();
  verticalGradient(sky, 0, H, rgba("#24344b"), rgba("#7d6b61"));
  drawCloud(sky, 160, 90, 1, rgba("#f0ddc0", 58), rgba("#6d7080", 66));
  drawMountainBand(sky, 304, rgba("#425a4f"), rgba("#31443c"), 40);

  const back = createPng();
  fill(back, 0, 290, W, 74, rgba("#38563d"));
  for (let x = -30; x < W + 40; x += 92) {
    fill(back, x + 24, 222, 22, 118, rgba("#33412b"));
    fill(back, x, 206, 72, 38, rgba("#527445"));
    fill(back, x + 12, 178, 66, 40, rgba("#7d9656"));
  }

  const mid = createPng();
  fill(mid, 0, 340, W, 200, rgba("#4c5f36"));
  fillPolygon(mid, [[0, 298], [260, 338], [516, 540], [0, 540]], rgba("#7b5538"));
  fillPolygon(mid, [[960, 304], [694, 350], [446, 540], [960, 540]], rgba("#6a4b33"));
  fillPolygon(mid, [[266, 314], [704, 314], [558, 540], [418, 540]], rgba("#9c6b42"));
  fillPolygon(mid, [[420, 330], [574, 330], [538, 540], [454, 540]], rgba("#6d513d"));
  scatter(mid, 152, 180, { x: 0, y: 316, w: W, h: 210 }, [rgba("#573c2c"), rgba("#8b6849"), rgba("#b78a56"), rgba("#405f32")], { min: 3, max: 12 });
  drawRock(mid, 158, 410, 90, 54, rgba("#62625f"), rgba("#999184"));
  drawRock(mid, 690, 390, 78, 46, rgba("#5d5e5f"), rgba("#9a9288"));

  const front = createPng();
  fill(front, 0, 488, W, 52, rgba("#1f2b1b"));
  drawTallGrass(front, 540, [rgba("#243719"), rgba("#547a34"), rgba("#a08942")], 155);
  for (let x = -20; x < W; x += 74) fill(front, x, 472 + ((x + 30) % 3) * 8, 34, 9, rgba("#1c2519", 180));

  const fx = createPng();
  scatter(fx, 158, 44, { x: 0, y: 160, w: W, h: 250 }, [rgba("#fff2dc", 46), rgba("#e2c071", 50)], { min: 2, max: 4 });
  for (let x = 430; x < 560; x += 20) fill(fx, x, 350 + ((x / 20) % 5) * 30, 36, 3, rgba("#d2b28a", 62));
  saveSet("ravine", { sky, back, mid, front, fx });
}

function river() {
  const sky = createPng();
  verticalGradient(sky, 0, H, rgba("#2a2448"), rgba("#ff9f62"));
  fill(sky, 0, 180, W, 30, rgba("#ffd47a", 120));
  drawCloud(sky, 86, 74, 1, rgba("#ffd9c0", 100), rgba("#765d85", 80));
  drawCloud(sky, 610, 102, 1, rgba("#ffe6c8", 90), rgba("#826a8a", 76));

  const back = createPng();
  drawMountainBand(back, 286, rgba("#4a6254"), rgba("#344a41"), -20);
  fill(back, 0, 266, W, 66, rgba("#2e5947"));
  for (let x = -20; x < W + 80; x += 94) {
    fill(back, x + 32, 218, 20, 92, rgba("#26311f"));
    fill(back, x, 192, 82, 46, rgba("#4b703a"));
    fill(back, x + 12, 168, 70, 42, rgba("#6b8950"));
  }
  fill(back, 0, 320, W, 42, rgba("#224b55"));

  const mid = createPng();
  fill(mid, 0, 318, W, 128, rgba("#236a7a"));
  verticalGradient(mid, 320, 126, rgba("#2f8a95", 230), rgba("#174757", 255));
  fill(mid, 430, 320, 116, 128, rgba("#ffbd73", 70));
  drawWaterHighlights(mid, 332, 98, 182, rgba("#a8f0e7", 92));
  drawWaterHighlights(mid, 340, 84, 183, rgba("#ffd27d", 76));
  fillPolygon(mid, [[0, 404], [276, 382], [416, 540], [0, 540]], rgba("#5d4a31"));
  fillPolygon(mid, [[960, 400], [742, 382], [566, 540], [960, 540]], rgba("#5c4b32"));
  fillPolygon(mid, [[246, 398], [742, 390], [854, 540], [96, 540]], rgba("#355227"));
  fill(mid, 346, 416, 230, 42, rgba("#6a4a33"));
  fill(mid, 366, 396, 190, 24, rgba("#9d6542"));
  drawRock(mid, 128, 410, 70, 42, rgba("#676f73"), rgba("#a6a093"));
  drawRock(mid, 786, 414, 80, 44, rgba("#5d646b"), rgba("#a29a90"));

  const front = createPng();
  fill(front, 0, 454, W, 86, rgba("#21341c"));
  drawTallGrass(front, 540, [rgba("#233b1e"), rgba("#4f7938"), rgba("#95a64b")], 190);
  drawFlowers(front, 191, { x: 0, y: 448, w: W, h: 70 }, { petals: [rgba("#ff8aa1"), rgba("#fff2dc"), rgba("#ffd27d")] });
  drawRock(front, 54, 470, 78, 40, rgba("#5d646c"), rgba("#a29b91"));
  drawRock(front, 820, 462, 92, 50, rgba("#5a6067"), rgba("#99938b"));
  fill(front, 410, 450, 138, 12, rgba("#e7c86d", 190));
  fill(front, 428, 462, 100, 9, rgba("#ff8aa1", 150));

  const fx = createPng();
  for (let x = 0; x < W; x += 78) fill(fx, x + 8, 342, 48, 4, rgba("#fff2dc", 72));
  for (let x = 34; x < W; x += 96) fill(fx, x, 382, 64, 3, rgba("#8fe6df", 70));
  scatter(fx, 200, 34, { x: 0, y: 116, w: W, h: 220 }, [rgba("#fff2dc", 58), rgba("#ffd27d", 50)], { min: 2, max: 4 });

  saveSet("river", { sky, back, mid, front, fx });
}

function night() {
  const sky = createPng();
  verticalGradient(sky, 0, H, rgba("#090f1e"), rgba("#19284a"));
  fill(sky, 126, 92, 58, 58, rgba("#f3e4a8"));
  fill(sky, 142, 104, 34, 34, rgba("#fff2c7"));
  scatter(sky, 218, 64, { x: 0, y: 38, w: W, h: 180 }, [rgba("#fff2dc", 118), rgba("#a8d7ff", 95)], { min: 2, max: 4 });

  const back = createPng();
  fill(back, 0, 282, W, 70, rgba("#1d3853"));
  for (let x = -20; x < W + 90; x += 82) {
    fill(back, x, 214, 54, 98, rgba("#162337"));
    fill(back, x + 10, 232, 10, 14, rgba("#ffd27d", 110));
    fill(back, x + 32, 268, 10, 14, rgba("#5fc6d0", 90));
  }

  const mid = createPng();
  fill(mid, 0, 350, W, 44, rgba("#22384b"));
  fill(mid, 0, 394, W, 146, rgba("#10151e"));
  for (let x = 48; x < W; x += 112) {
    fill(mid, x, 342, 70, 18, rgba("#584139"));
    fill(mid, x + 30, 292, 10, 68, rgba("#2d2527"));
  }

  const front = createPng();
  fill(front, 0, 496, W, 44, rgba("#080d15"));
  const fx = createPng();
  scatter(fx, 224, 28, { x: 0, y: 50, w: W, h: 260 }, [rgba("#fff2dc", 62), rgba("#ffd27d", 50)], { min: 2, max: 4 });
  saveSet("night", { sky, back, mid, front, fx });
}

function room() {
  const sky = createPng();
  verticalGradient(sky, 0, H, rgba("#251f2c"), rgba("#1f3033"));

  const back = createPng();
  fill(back, 0, 0, W, 314, rgba("#2b2832"));
  for (let x = 0; x < W; x += 80) fill(back, x, 0, 4, 314, rgba("#3a3642"));
  fill(back, 90, 78, 220, 138, rgba("#15181d"));
  fill(back, 108, 96, 76, 48, rgba("#294f66"));
  fill(back, 196, 96, 76, 48, rgba("#70394f"));
  fill(back, 640, 80, 250, 220, rgba("#ffd27d", 40));
  fill(back, 654, 86, 210, 210, rgba("#15181d"));

  const mid = createPng();
  fill(mid, 0, 314, W, 226, rgba("#1e2629"));
  for (let x = 0; x < W; x += 72) fill(mid, x, 314, 4, 226, rgba("#334044"));
  fill(mid, 330, 392, 300, 74, rgba("#6c4734"));
  fill(mid, 354, 368, 252, 32, rgba("#9f6b42"));
  fill(mid, 400, 338, 44, 54, rgba("#f7d6a2"));
  fill(mid, 486, 328, 62, 66, rgba("#a96576"));

  const front = createPng();
  fill(front, 0, 502, W, 38, rgba("#141b1e"));
  const fx = createPng();
  fill(fx, 626, 70, 280, 260, rgba("#ffd27d", 36));
  scatter(fx, 230, 30, { x: 40, y: 70, w: 840, h: 260 }, [rgba("#fff2dc", 46), rgba("#ffd27d", 40)], { min: 2, max: 4 });
  saveSet("room", { sky, back, mid, front, fx });
}

function drawPurpleMotoAsset() {
  const png = createPng(280, 160);
  const outline = rgba("#17101b");
  const purpleDark = rgba("#44215f");
  const purple = rgba("#7c3fb4");
  const purpleLight = rgba("#c08aff");
  const metal = rgba("#9ca7b4");
  const tire = rgba("#101015");
  fill(png, 42, 106, 58, 58, tire);
  fill(png, 180, 106, 58, 58, tire);
  fill(png, 54, 118, 34, 34, rgba("#313844"));
  fill(png, 192, 118, 34, 34, rgba("#313844"));
  pixelLine(png, 72, 132, 132, 74, 8, outline);
  pixelLine(png, 206, 132, 148, 74, 8, outline);
  pixelLine(png, 132, 76, 196, 128, 8, metal);
  fillPolygon(png, [[96, 72], [160, 54], [204, 86], [174, 110], [110, 104]], outline);
  fillPolygon(png, [[104, 74], [158, 62], [194, 88], [168, 102], [116, 98]], purple);
  fill(png, 124, 56, 48, 14, purpleLight);
  fill(png, 162, 44, 58, 18, outline);
  fill(png, 166, 38, 48, 18, rgba("#2d2230"));
  pixelLine(png, 194, 58, 234, 32, 5, metal);
  fill(png, 230, 24, 28, 8, outline);
  fill(png, 58, 88, 54, 20, purpleDark);
  fill(png, 212, 78, 24, 18, rgba("#ffe0a4"));
  save(png, out("props", "purple-moto.png"));
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
  const sampleAvg = () => {
    let r = 0, g = 0, b = 0, count = 0;
    const samples = [];
    for (let x = 0; x < png.width; x += 1) {
      samples.push([x, 0], [x, png.height - 1]);
    }
    for (let y = 0; y < png.height; y += 1) {
      samples.push([0, y], [png.width - 1, y]);
    }
    for (const [x, y] of samples) {
      const idx = (y * png.width + x) << 2;
      r += png.data[idx];
      g += png.data[idx + 1];
      b += png.data[idx + 2];
      count += 1;
    }
    return [r / count, g / count, b / count];
  };

  const [bgR, bgG, bgB] = sampleAvg();
  const bgMax = Math.max(bgR, bgG, bgB);

  const colorDist = (idx) => {
    const dr = png.data[idx] - bgR;
    const dg = png.data[idx + 1] - bgG;
    const db = png.data[idx + 2] - bgB;
    return Math.sqrt(dr * dr + dg * dg + db * db);
  };
  const maxOf = (idx) =>
    Math.max(png.data[idx], png.data[idx + 1], png.data[idx + 2]);

  const isBackground = (idx) => {
    const max = maxOf(idx);
    if (max > bgMax + 24) return false;
    return colorDist(idx) < 20;
  };

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
    if (!isBackground(idx)) continue;
    png.data[idx + 3] = 0;
    stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
  }

  const countTransparentNeighbors = (x, y) => {
    let n = 0;
    for (const [dx, dy] of [[-1,0],[1,0],[0,-1],[0,1],[-1,-1],[1,-1],[-1,1],[1,1]]) {
      const nx = x + dx;
      const ny = y + dy;
      if (nx < 0 || ny < 0 || nx >= png.width || ny >= png.height) {
        n += 1;
        continue;
      }
      if (png.data[((ny * png.width + nx) << 2) + 3] === 0) n += 1;
    }
    return n;
  };

  for (let pass = 0; pass < 4; pass += 1) {
    let changed = 0;
    for (let y = 0; y < png.height; y += 1) {
      for (let x = 0; x < png.width; x += 1) {
        const idx = (y * png.width + x) << 2;
        if (png.data[idx + 3] === 0) continue;
        const max = maxOf(idx);
        if (max >= 48) continue;
        const tn = countTransparentNeighbors(x, y);
        if (tn >= 5) {
          png.data[idx + 3] = 0;
          changed += 1;
        }
      }
    }
    if (changed === 0) break;
  }
}

function putPixel(png, x, y, color) {
  if (x < 0 || y < 0 || x >= png.width || y >= png.height) return;
  const idx = (png.width * y + x) << 2;
  png.data[idx] = color[0];
  png.data[idx + 1] = color[1];
  png.data[idx + 2] = color[2];
  png.data[idx + 3] = color[3];
}

function pixelLine(png, x0, y0, x1, y1, thickness, color) {
  x0 = Math.round(x0);
  y0 = Math.round(y0);
  x1 = Math.round(x1);
  y1 = Math.round(y1);
  thickness = Math.max(1, Math.round(thickness));

  const dx = Math.abs(x1 - x0);
  const sx = x0 < x1 ? 1 : -1;
  const dy = -Math.abs(y1 - y0);
  const sy = y0 < y1 ? 1 : -1;
  let err = dx + dy;
  let x = x0;
  let y = y0;

  while (true) {
    fill(png, x - Math.floor(thickness / 2), y - Math.floor(thickness / 2), thickness, thickness, color);
    if (x === x1 && y === y1) break;
    const err2 = err * 2;
    if (err2 >= dy) {
      err += dy;
      x += sx;
    }
    if (err2 <= dx) {
      err += dx;
      y += sy;
    }
  }
}

function outlinedRect(png, x, y, width, height, outline, fillColor) {
  fill(png, x, y, width, height, outline);
  fill(png, x + 2, y + 2, width - 4, height - 4, fillColor);
}

function clearFaceDetails(png, c, options = {}) {
  const skin = c.skin;
  fill(png, c.mouth.x, c.mouth.y, c.mouth.w, c.mouth.h, skin);

  if (options.eyes) {
    for (const eye of c.eyes) fill(png, eye.x, eye.y, eye.w, eye.h, skin);
  }

  if (options.brows) {
    fill(png, c.brows.left.x, c.brows.left.y, c.brows.left.w, c.brows.left.h, c.skin);
    fill(png, c.brows.right.x, c.brows.right.y, c.brows.right.w, c.brows.right.h, c.skin);
  }
}

function drawCheeks(png, c, strong = false) {
  const color = strong ? c.blushStrong : c.blush;
  fill(png, c.cheeks.left.x, c.cheeks.left.y, c.cheeks.left.w, 3, color);
  fill(png, c.cheeks.left.x + 3, c.cheeks.left.y + 4, c.cheeks.left.w - 6, 3, color);
  fill(png, c.cheeks.right.x, c.cheeks.right.y, c.cheeks.right.w, 3, color);
  fill(png, c.cheeks.right.x + 3, c.cheeks.right.y + 4, c.cheeks.right.w - 6, 3, color);
}

function drawOpenMouth(png, x, y, width, height, c, teeth = false) {
  outlinedRect(png, x, y, width, height, c.outline, c.mouthDark);
  fill(png, x + 3, y + height - 5, width - 6, 3, c.mouthRed);
  if (teeth) fill(png, x + 4, y + 2, width - 8, 3, c.teeth);
  putPixel(png, x, y, c.skin);
  putPixel(png, x + width - 1, y, c.skin);
  putPixel(png, x, y + height - 1, c.skin);
  putPixel(png, x + width - 1, y + height - 1, c.skin);
}

function drawHappyEyes(png, c) {
  for (const eye of c.eyes) {
    fill(png, eye.x, eye.y, eye.w, eye.h, c.skin);
    pixelLine(png, eye.x + 2, eye.y + 11, eye.x + 9, eye.y + 16, 3, c.outline);
    pixelLine(png, eye.x + 9, eye.y + 16, eye.x + eye.w - 3, eye.y + 10, 3, c.outline);
  }
}

function drawRoundEyes(png, c) {
  for (const eye of c.eyes) {
    fill(png, eye.x, eye.y, eye.w, eye.h, c.skin);
    outlinedRect(png, eye.x + 4, eye.y + 2, eye.w - 8, eye.h - 3, c.outline, c.eye);
    fill(png, eye.x + 8, eye.y + 4, eye.w - 16, eye.h - 10, c.eyeDark);
    fill(png, eye.x + 10, eye.y + 6, 4, 5, c.eyeLight);
  }
}

function drawSoftBrows(png, c, mood) {
  const { left, right } = c.brows;
  if (mood === "worried") {
    pixelLine(png, left.x + 1, left.y + 9, left.x + left.w - 1, left.y + 3, 3, c.outline);
    pixelLine(png, right.x + 1, right.y + 3, right.x + right.w - 1, right.y + 9, 3, c.outline);
    return;
  }
  if (mood === "surprised") {
    pixelLine(png, left.x + 2, left.y + 1, left.x + left.w - 2, left.y + 1, 3, c.outline);
    pixelLine(png, right.x + 2, right.y + 1, right.x + right.w - 2, right.y + 1, 3, c.outline);
    return;
  }
  pixelLine(png, left.x + 2, left.y + 6, left.x + left.w - 2, left.y + 6, 2, c.outline);
  pixelLine(png, right.x + 2, right.y + 6, right.x + right.w - 2, right.y + 6, 2, c.outline);
}

function drawExpression(png, expression, c) {
  if (expression === "neutral") return;

  if (expression === "happy") {
    clearFaceDetails(png, c, { eyes: true });
    drawHappyEyes(png, c);
    drawOpenMouth(png, c.centerX - 11, c.mouth.y + 3, 22, 13, c, true);
    drawCheeks(png, c);
    return;
  }

  if (expression === "talking") {
    clearFaceDetails(png, c);
    drawOpenMouth(png, c.centerX - 9, c.mouth.y + 1, 18, 18, c);
    drawCheeks(png, c);
    return;
  }

  if (expression === "surprised") {
    clearFaceDetails(png, c, { eyes: true, brows: true });
    drawRoundEyes(png, c);
    drawSoftBrows(png, c, "surprised");
    drawOpenMouth(png, c.centerX - 7, c.mouth.y, 14, 18, c);
    return;
  }

  if (expression === "scared") {
    clearFaceDetails(png, c, { brows: true });
    drawSoftBrows(png, c, "worried");
    fill(png, c.centerX - 10, c.mouth.y + 7, 20, 5, c.outline);
    fill(png, c.centerX - 7, c.mouth.y + 9, 14, 3, c.skinShadow);
    fill(png, c.sweat.x, c.sweat.y, 5, 10, c.sweatBlue);
    fill(png, c.sweat.x - 2, c.sweat.y + 5, 9, 5, c.sweatBlue);
    drawCheeks(png, c);
    return;
  }

  if (expression === "shy") {
    clearFaceDetails(png, c);
    drawCheeks(png, c, true);
    fill(png, c.centerX - 8, c.mouth.y + 8, 16, 3, c.outline);
    fill(png, c.centerX - 5, c.mouth.y + 10, 10, 2, c.mouthRed);
    return;
  }

  if (expression === "thinking") {
    clearFaceDetails(png, c, { brows: true });
    drawSoftBrows(png, c, "thinking");
    fill(png, c.centerX - 9, c.mouth.y + 8, 12, 3, c.outline);
    fill(png, c.centerX + 2, c.mouth.y + 11, 7, 3, c.outline);
    fill(png, c.centerX - 6, c.mouth.y + 7, 7, 2, c.skin);
  }
}

function characterFaceConfig(character) {
  const shared = {
    outline: rgba("#070303"),
    mouthDark: rgba("#2a1010"),
    mouthRed: rgba("#c95a4f"),
    teeth: rgba("#fff1d6"),
    eye: rgba("#211817"),
    eyeDark: rgba("#0d0b0d"),
    eyeLight: rgba("#f6f3df"),
    sweatBlue: rgba("#72c9df")
  };

  if (character === "alexis") {
    return {
      ...shared,
      centerX: 119,
      skin: rgba("#f8b36b"),
      skinShadow: rgba("#d8894f"),
      blush: rgba("#e98978", 205),
      blushStrong: rgba("#ee7a88", 230),
      eyes: [
        { x: 77, y: 112, w: 28, h: 38 },
        { x: 135, y: 112, w: 28, h: 38 }
      ],
      brows: {
        left: { x: 76, y: 101, w: 31, h: 12 },
        right: { x: 134, y: 101, w: 31, h: 12 }
      },
      cheeks: {
        left: { x: 68, y: 145, w: 25 },
        right: { x: 146, y: 145, w: 25 }
      },
      mouth: { x: 101, y: 151, w: 37, h: 24 },
      sweat: { x: 166, y: 119 }
    };
  }

  return {
    ...shared,
    centerX: 109,
    skin: rgba("#f8b772"),
    skinShadow: rgba("#d48952"),
    blush: rgba("#e88f80", 205),
    blushStrong: rgba("#ee7a96", 230),
    eyes: [
      { x: 68, y: 112, w: 28, h: 38 },
      { x: 126, y: 112, w: 28, h: 38 }
    ],
    brows: {
      left: { x: 68, y: 101, w: 31, h: 12 },
      right: { x: 126, y: 101, w: 31, h: 12 }
    },
    cheeks: {
      left: { x: 58, y: 145, w: 25 },
      right: { x: 137, y: 145, w: 25 }
    },
    mouth: { x: 92, y: 151, w: 37, h: 24 },
    sweat: { x: 158, y: 119 }
  };
}

function makeCompleteFrameSet(character) {
  const base = readPng(out(`${character}-base.png`));
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

  for (const expression of expressions) {
    const png = clonePng(base);
    transparentFlood(png);
    save(png, out("characters", character, `${expression}.png`));
  }
}

taxi();
hospital();
road();
bosquete();
valley();
ravine();
river();
night();
room();
drawPurpleMotoAsset();

makeCompleteFrameSet("alexis");
makeCompleteFrameSet("kiara");

console.log("Generated layered pixel-art backgrounds, props and full-frame character sprites.");
