export function createTransparentTexture(
  scene: Phaser.Scene,
  sourceKey: string,
  targetKey: string
) {
  if (scene.textures.exists(targetKey)) return;

  const source = scene.textures.get(sourceKey).getSourceImage() as HTMLImageElement;
  const texture = scene.textures.createCanvas(targetKey, source.width, source.height);
  if (!texture) return;

  const context = texture.getContext();
  context.imageSmoothingEnabled = false;
  context.drawImage(source, 0, 0);

  const image = context.getImageData(0, 0, source.width, source.height);
  const data = image.data;
  const visited = new Uint8Array(source.width * source.height);
  const stack: Array<[number, number]> = [];
  const edge = averageEdgeColor(data, source.width, source.height);

  for (let x = 0; x < source.width; x += 1) {
    stack.push([x, 0], [x, source.height - 1]);
  }

  for (let y = 0; y < source.height; y += 1) {
    stack.push([0, y], [source.width - 1, y]);
  }

  while (stack.length > 0) {
    const [x, y] = stack.pop()!;
    if (x < 0 || y < 0 || x >= source.width || y >= source.height) continue;

    const pos = y * source.width + x;
    if (visited[pos]) continue;
    visited[pos] = 1;

    const idx = pos * 4;
    if (!isBackground(data, idx, edge)) continue;

    data[idx + 3] = 0;
    stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
  }

  context.putImageData(image, 0, 0);
  texture.refresh();
}

function averageEdgeColor(data: Uint8ClampedArray, width: number, height: number) {
  let r = 0;
  let g = 0;
  let b = 0;
  let count = 0;

  const sample = (x: number, y: number) => {
    const idx = (y * width + x) * 4;
    const max = Math.max(data[idx], data[idx + 1], data[idx + 2]);
    if (max > 90) return;
    r += data[idx];
    g += data[idx + 1];
    b += data[idx + 2];
    count += 1;
  };

  for (let x = 0; x < width; x += 1) {
    sample(x, 0);
    sample(x, height - 1);
  }

  for (let y = 0; y < height; y += 1) {
    sample(0, y);
    sample(width - 1, y);
  }

  return {
    r: count ? r / count : 18,
    g: count ? g / count : 20,
    b: count ? b / count : 24
  };
}

function isBackground(
  data: Uint8ClampedArray,
  idx: number,
  edge: { r: number; g: number; b: number }
) {
  const r = data[idx];
  const g = data[idx + 1];
  const b = data[idx + 2];
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const distance = Math.hypot(r - edge.r, g - edge.g, b - edge.b);

  return min > 10 && max < 82 && max - min < 22 && distance < 18;
}
