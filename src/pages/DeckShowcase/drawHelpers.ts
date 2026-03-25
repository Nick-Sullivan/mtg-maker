export const CANVAS_SIZE = 2400;

export const WUBRG = ["W", "U", "B", "R", "G"];

export interface DrawState {
  title: string;
  bracket: string;
  description: string;
  keyCardImgs: (HTMLImageElement | null)[];
  keyCardLoadingStates: boolean[];
  commanderImg: HTMLImageElement | null;
  commanderImgLoading: boolean;
  altImgs: (HTMLImageElement | null)[];
  altImgLoadingStates: boolean[];
  backgroundImgs: (HTMLImageElement | null)[];
  backgroundImgLoadingStates: boolean[];
  partnerImgs: (HTMLImageElement | null)[];
  partnerImgLoadingStates: boolean[];
  colorIdentity: string[];
  colorIcons: Partial<Record<string, HTMLImageElement>>;
  showColorIcons: boolean;
  tags: string[];
  qrImg: HTMLImageElement | null;
  shape: "square" | "vertical" | "horizontal";
}

export function getCanvasDimensions(
  shape: "square" | "vertical" | "horizontal",
  size = CANVAS_SIZE,
) {
  if (shape === "vertical")
    return { width: size, height: Math.round((size * 7) / 5) };
  if (shape === "horizontal")
    return { width: Math.round((size * 7) / 5), height: size };
  return { width: size, height: size };
}

export function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
): string[] {
  const lines: string[] = [];
  let line = "";
  for (const word of text.split(" ")) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines;
}

export function drawCard(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x: number,
  y: number,
  w: number,
  h: number,
  rotation = 0,
) {
  const r = 14;

  function roundedRectPath() {
    ctx.beginPath();
    ctx.moveTo(-w / 2 + r, -h / 2);
    ctx.lineTo(w / 2 - r, -h / 2);
    ctx.arcTo(w / 2, -h / 2, w / 2, -h / 2 + r, r);
    ctx.lineTo(w / 2, h / 2 - r);
    ctx.arcTo(w / 2, h / 2, w / 2 - r, h / 2, r);
    ctx.lineTo(-w / 2 + r, h / 2);
    ctx.arcTo(-w / 2, h / 2, -w / 2, h / 2 - r, r);
    ctx.lineTo(-w / 2, -h / 2 + r);
    ctx.arcTo(-w / 2, -h / 2, -w / 2 + r, -h / 2, r);
    ctx.closePath();
  }

  ctx.save();
  ctx.translate(x + w / 2, y + h / 2);
  ctx.rotate(rotation);

  ctx.shadowBlur = 40;
  ctx.shadowColor = "rgba(0,0,0,0.85)";
  ctx.shadowOffsetX = 6;
  ctx.shadowOffsetY = 14;
  roundedRectPath();
  ctx.clip();
  ctx.shadowBlur = 0;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;
  ctx.drawImage(img, -w / 2, -h / 2, w, h);

  ctx.restore();
  ctx.save();
  ctx.translate(x + w / 2, y + h / 2);
  ctx.rotate(rotation);
  roundedRectPath();
  const rim = ctx.createLinearGradient(-w / 2, -h / 2, w / 2, h / 2);
  rim.addColorStop(0, "rgba(255,255,255,0.35)");
  rim.addColorStop(0.4, "rgba(255,255,255,0.08)");
  rim.addColorStop(1, "rgba(0,0,0,0.3)");
  ctx.strokeStyle = rim;
  ctx.lineWidth = 3;
  ctx.stroke();

  ctx.restore();
}

export function drawPlaceholderCard(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  rotation = 0,
) {
  const r = 14;
  ctx.save();
  ctx.translate(x + w / 2, y + h / 2);
  ctx.rotate(rotation);

  ctx.shadowBlur = 40;
  ctx.shadowColor = "rgba(0,0,0,0.85)";
  ctx.shadowOffsetX = 6;
  ctx.shadowOffsetY = 14;

  ctx.beginPath();
  ctx.moveTo(-w / 2 + r, -h / 2);
  ctx.lineTo(w / 2 - r, -h / 2);
  ctx.arcTo(w / 2, -h / 2, w / 2, -h / 2 + r, r);
  ctx.lineTo(w / 2, h / 2 - r);
  ctx.arcTo(w / 2, h / 2, w / 2 - r, h / 2, r);
  ctx.lineTo(-w / 2 + r, h / 2);
  ctx.arcTo(-w / 2, h / 2, -w / 2, h / 2 - r, r);
  ctx.lineTo(-w / 2, -h / 2 + r);
  ctx.arcTo(-w / 2, -h / 2, -w / 2 + r, -h / 2, r);
  ctx.closePath();

  ctx.fillStyle = "rgba(90, 90, 90, 0.55)";
  ctx.fill();
  ctx.restore();
}
